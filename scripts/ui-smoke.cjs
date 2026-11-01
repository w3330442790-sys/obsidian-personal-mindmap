const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../artifacts/harness');
fs.mkdirSync(root,{recursive:true});
const fixture={version:1,root:{id:'root',text:'融合 Mindmap 验证',children:[
  {id:'branch',text:'学习分支',children:[{id:'high',text:'考点 ==关键答案== 与 **加粗**'},{id:'answer',text:'隐藏答案',markers:['🙈'],note:'答案备注',labels:['答案标签'],children:[{id:'detail',text:'解析内容'}]}]},
  {id:'edit',text:'苹果、香蕉，梨'}, {id:'task',text:'[ ] 待完成事项'},
  {id:'image',text:'![样例](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF1kAAAAASUVORK5CYII=)'},
  {id:'notes',text:'备注示例',note:'**备注正文**',callout:'可见标注'},
  {id:'question',text:'一道选择题',children:[{id:'correct',text:'[x] 正确选项',children:[{id:'explain',text:'解题思路'}]},{id:'wrong',text:'[ ] 干扰选项'}]}
]}};
const results=[],errors=[];
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');const f=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(b);});
});
async function command(page,c){await page.evaluate(c=>window.postMessage({type:'command',command:c},'*'),c);await page.waitForTimeout(100);}
async function check(name,fn){await fn();results.push(name);console.log('PASS '+name);}
(async()=>{
 await require('esbuild').build({entryPoints:[path.resolve(__dirname,'test-harness.tsx')],bundle:true,outfile:path.join(root,'app.js'),format:'iife',jsx:'automatic',loader:{'.woff2':'dataurl'},define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent'});
 fs.writeFileSync(path.join(root,'index.html'),'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1450,height:980}});
 page.setDefaultTimeout(8000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(fixture=>{
   window.__testDoc=fixture;window.__testMessages=[];
   window.__testHost={post(m){window.__testMessages.push(m);if(m.type==='ready')setTimeout(()=>window.postMessage({type:'init',text:JSON.stringify(window.__testDoc),lang:'zh-CN',fileName:'测试脑图',host:'obsidian'},'*'),0);else if(m.type==='edit')window.__testDoc=JSON.parse(m.text);},onViewState(state){window.__testViewState=state;},subscribe(handler){const listener=event=>handler(event.data);window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);},listLinkTargets(query){return ['测试笔记','参考资料','临床复习'].filter(name=>name.includes(query));},saveBinary:async(name)=>'attachments/'+name,editNote(text,onCommit,readOnly){window.__noteReadOnly=readOnly;if(!readOnly)onCommit('**弹窗编辑的备注**');},pickNote:async()=>'参考资料'};
 },fixture);
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.locator('[data-id="root"]').first().waitFor();
 await check('loads original primary canvas and rich nodes',async()=>{const count=node=>1+(node.children??[]).reduce((sum,c)=>sum+count(c),0);assert.equal(await page.locator('.wm-topic[data-kind="topic"]').count(),count(fixture.root));assert.ok(await page.locator('strong').count());assert.equal(await page.locator('.wm-rich-topic img').count(),1);});
 await check('primary editor adds child and supports undo/redo',async()=>{
   await page.evaluate(()=>window.postMessage({type:'select',ids:['edit']},'*'));await command(page,'addChild');
   await page.keyboard.type('新增节点');await page.keyboard.press('Enter');
   await page.waitForFunction(()=>window.__testDoc.root.children.find(n=>n.id==='edit').children?.[0]?.text==='新增节点');
   await command(page,'undo');assert.notEqual(await page.evaluate(()=>window.__testDoc.root.children.find(n=>n.id==='edit').children[0].text),'新增节点');
   await command(page,'undo');assert.ok(!(await page.evaluate(()=>window.__testDoc.root.children.find(n=>n.id==='edit').children?.length)));
   await command(page,'redo');await command(page,'redo');assert.equal(await page.evaluate(()=>window.__testDoc.root.children.find(n=>n.id==='edit').children[0].text),'新增节点');
 });
 await check('study mode masks answers without source mutation',async()=>{
   const before=await page.evaluate(()=>JSON.stringify(window.__testDoc));
   await command(page,'toggleStudy');
   assert.ok(await page.locator('[data-id="answer"] [data-kind="reveal"]').count());
   assert.equal(await page.locator('[data-id="high"] mark > span').evaluate(e=>getComputedStyle(e).visibility),'hidden');
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__testDoc)),before);
   assert.match(await page.locator('.wm-topic[data-id="correct"]').textContent(),/\[ \] 正确选项/);assert.equal(await page.locator('[data-id="explain"]').count(),0);
   await page.locator('[data-id="question"] [data-kind="reveal"]').click();
   assert.equal(await page.locator('[data-id="explain"]').count(),1);assert.equal(await page.evaluate(()=>JSON.stringify(window.__testDoc)),before);
   await command(page,'toggleStudy');
 });
 await check('locked view can fold branches without saving their collapse state',async()=>{
   await page.evaluate(()=>window.postMessage({type:'select',ids:['branch']},'*'));const before=await page.evaluate(()=>JSON.stringify(window.__testDoc));
   await command(page,'toggleLock');await command(page,'fold');assert.equal(await page.locator('.wm-topic[data-id="high"]').count(),0);
   await command(page,'fold');assert.equal(await page.locator('.wm-topic[data-id="high"]').count(),1);assert.equal(await page.evaluate(()=>JSON.stringify(window.__testDoc)),before);await command(page,'toggleLock');
 });
 await check('lock prevents edits and undo',async()=>{
   const before=await page.evaluate(()=>JSON.stringify(window.__testDoc));await command(page,'toggleLock');await command(page,'deleteNode');await command(page,'undo');
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__testDoc)),before);await command(page,'toggleLock');
 });
 await check('focus branch projects view without deleting other branches',async()=>{
   await page.evaluate(()=>window.postMessage({type:'select',ids:['branch']},'*'));await command(page,'focusBranch');
   assert.equal(await page.locator('.wm-topic[data-id="edit"]').count(),0);assert.equal(await page.evaluate(()=>window.__testDoc.root.children.length),fixture.root.children.length);
   await command(page,'exitFocus');assert.equal(await page.locator('.wm-topic[data-id="edit"]').count(),1);
 });
 await check('SVG export emits real exported document',async()=>{
   await command(page,'exportSvg');await page.waitForFunction(()=>window.__testMessages.some(m=>m.type==='export'&&m.format==='svg'));
   const exported=await page.evaluate(()=>window.__testMessages.filter(m=>m.type==='export'&&m.format==='svg').at(-1));
   assert.match(exported.data,/<svg/);assert.match(exported.data,/data:image\/png;base64/);
 });
 await check('PNG export emits a raster image rather than only an SVG wrapper',async()=>{
   await command(page,'export');await page.waitForFunction(()=>window.__testMessages.some(m=>m.type==='export'&&m.format==='png'));
   const png=await page.evaluate(()=>window.__testMessages.filter(m=>m.type==='export'&&m.format==='png').at(-1).data);assert.ok(png.startsWith('iVBORw0KGgo'));
 });
 await check('node images open a full-size preview',async()=>{
   await page.locator('.wm-topic[data-id="image"] img').dblclick();await page.locator('dialog.wm-image-lightbox').waitFor();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog.wm-image-lightbox'));
 });
 await check('docked outline can be toggled beside the canvas',async()=>{
   await command(page,'toggleOutline');await page.getByLabel('大纲面板',{exact:true}).waitFor();assert.ok(await page.locator('.wm-canvas').isVisible());await command(page,'toggleOutline');assert.equal(await page.getByLabel('大纲面板',{exact:true}).count(),0);
 });
 await check('display-only note cards resize and fold without mutating content',async()=>{
   const before=await page.evaluate(()=>JSON.stringify(window.__testDoc));await command(page,'toggleNotes');
   const handle=page.locator('.wm-topic[data-id="notes"] [data-kind="note-resize"]');await handle.scrollIntoViewIfNeeded();const box=await handle.boundingBox();
   await page.mouse.move(box.x+6,box.y+6);await page.mouse.down();await page.mouse.move(box.x+50,box.y+45,{steps:6});await page.mouse.up();
   await page.waitForFunction(()=>window.__testViewState.noteCards.notes?.w>320);
   await page.locator('.wm-topic[data-id="notes"] [data-kind="note-collapse"]').click();assert.equal(await page.locator('.wm-topic[data-id="notes"] [data-kind="note-card"]').count(),0);
   await page.locator('.wm-topic[data-id="notes"] [data-kind="note-icon"]').click();assert.equal(await page.locator('.wm-topic[data-id="notes"] [data-kind="note-card"]').count(),1);
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__testDoc)),before);await command(page,'toggleNotes');
 });
 await check('hidden topics persist and can be shown then restored',async()=>{
   await page.locator('.wm-topic[data-id="task"]').click({button:'right'});await page.getByRole('button',{name:'隐藏分支',exact:true}).click();
   await page.waitForFunction(()=>window.__testDoc.root.children.find(n=>n.id==='task').hidden===true);assert.equal(await page.locator('.wm-topic[data-id="task"]').count(),0);
   await page.getByRole('button',{name:'显示隐藏节点',exact:true}).click();assert.equal(await page.locator('.wm-topic[data-id="task"]').getAttribute('opacity'),'0.45');
   await page.locator('.wm-topic[data-id="task"]').click({button:'right'});await page.getByRole('button',{name:'取消隐藏分支',exact:true}).click();await page.waitForFunction(()=>!window.__testDoc.root.children.find(n=>n.id==='task').hidden);
 });
 await check('Markdown link completion inserts a chosen vault note',async()=>{
   await page.evaluate(()=>window.postMessage({type:'select',ids:['edit']},'*'));await command(page,'editNode');
   const editor=page.getByLabel('topic text');await editor.fill('链接到 [[测');
   await page.getByRole('listbox',{name:'链接到笔记'}).waitFor();await editor.press('Enter');await editor.press('Enter');
   await page.waitForFunction(()=>window.__testDoc.root.children.find(n=>n.id==='edit').text==='链接到 [[测试笔记]]');
 });
 await check('note popover callback writes the selected note and notebook picker creates a link',async()=>{
   await page.locator('[data-id="notes"] [data-kind="note-icon"]').click();
   await page.waitForFunction(()=>window.__testDoc.root.children.find(n=>n.id==='notes').note==='**弹窗编辑的备注**');
   await command(page,'linkNote');await page.waitForFunction(()=>window.__testDoc.root.children.find(n=>n.id==='notes').link==='[[参考资料]]');
 });
 await check('pasted image saves attachment and appends Markdown to the selected note',async()=>{
   await page.evaluate(()=>{window.postMessage({type:'select',ids:['notes']},'*');});await page.waitForTimeout(60);
   await page.getByLabel('topic text').focus();
   await page.evaluate(()=>{const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array([1,2,3])],'paste.png',{type:'image/png'}));document.querySelector('[aria-label="topic text"]').dispatchEvent(new ClipboardEvent('paste',{clipboardData:transfer,bubbles:true,cancelable:true}));});
   await page.waitForFunction(()=>window.__testDoc.root.children.find(n=>n.id==='notes').note.includes('![[attachments/paste.png]]'));
 });
 await check('autosave synchronization keeps typing active and flush commits before pane teardown',async()=>{
   await page.evaluate(()=>window.postMessage({type:'select',ids:['edit']},'*'));await command(page,'editNode');const editor=page.getByLabel('topic text');await editor.fill('尚未按回车的内容');await command(page,'syncPending');
   await page.waitForFunction(()=>window.__testDoc.root.children.find(n=>n.id==='edit').text==='尚未按回车的内容');assert.ok(await editor.evaluate(el=>el.classList.contains('wm-editing')));
   await command(page,'flush');assert.ok(!(await editor.evaluate(el=>el.classList.contains('wm-editing'))));
 });
 await page.screenshot({path:path.resolve(__dirname,'../artifacts/primary-canvas.png'),fullPage:true});
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.resolve(__dirname,'../artifacts/ui-results.json'),JSON.stringify({results,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
