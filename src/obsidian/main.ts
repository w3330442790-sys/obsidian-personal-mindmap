import { TFile, TFolder, Notice, normalizePath, loadMathJax } from 'obsidian';
import GogogaPlugin from '../../vendor/gogoga/src/main';
import { WmindView, VIEW_TYPE } from './view';
import { newDoc, serialize } from '../core/doc';
import { parseMarkdownDoc } from '../fusion/markdown';
import type { HostCommand } from '../../webview/src/host';
import { registerFusionThemes } from '../core/theme';
import { registerWmindEmbeds } from './wmind-embed';
import { VIEW_TYPE_MINDMAP } from '../../vendor/gogoga/src/view';

export default class PersonalMindmapPlugin extends GogogaPlugin {
  async onload(): Promise<void> {
    await super.onload();
    void loadMathJax().then(()=>this.refreshPrimaryViews()).catch(()=>undefined);
    this.registerView(VIEW_TYPE, leaf => new WmindView(leaf, this));
    this.registerExtensions(['wmind'], VIEW_TYPE);
    registerFusionThemes(this.settings);
    registerWmindEmbeds(this);
    this.addRibbonIcon('brain-circuit', '新建完整格式脑图 (.wmind)', () => void this.createWmind());
    this.addCommand({ id: 'create-wmind', name: '新建完整格式脑图 (.wmind)', callback: () => void this.createWmind() });
    this.addCommand({ id: 'convert-to-wmind', name: '从当前 Markdown 创建完整格式脑图', checkCallback: checking => {
      const file = this.app.workspace.getActiveFile();
      if (!(file instanceof TFile) || file.extension !== 'md') return false;
      if (!checking) void this.convertToWmind(file);
      return true;
    }});
    const commands: [string, string, HostCommand][] = [
      ['undo','撤销','undo'],['redo','重做','redo'],['zoom-in','放大','zoomIn'],['zoom-out','缩小','zoomOut'],
      ['fit','适应画布','fit'],['find','查找','find'],['replace','替换','replace'],
      ['wmind-outline','切换大纲','toggleOutline'],['wmind-study','切换背诵模式','toggleStudy'],
      ['wmind-lock','锁定 / 解锁编辑','toggleLock'],['wmind-notes','展开 / 收起备注','toggleNotes'],
      ['wmind-focus','聚焦选中分支','focusBranch'],['wmind-exit-focus','退出分支聚焦','exitFocus'],
      ['wmind-export-png','导出 PNG','export'],['wmind-export-svg','导出 SVG','exportSvg'],['wmind-copy-image','复制图片','copyImage'],
      ['wmind-export-markdown','导出 Markdown 大纲','exportMarkdown'],
      ['wmind-add-child','完整格式 · 添加子节点','addChild'],['wmind-add-sibling','完整格式 · 添加同级节点','addSibling'],
      ['wmind-insert-before','完整格式 · 在前面插入节点','insertBefore'],['wmind-insert-parent','完整格式 · 插入父节点','insertParent'],
      ['wmind-edit-node','完整格式 · 编辑节点','editNode'],['wmind-callout','完整格式 · 编辑标注','callout'],
      ['wmind-add-relation','完整格式 · 添加关联线','addRelationship'],['wmind-delete-node','完整格式 · 删除节点','deleteNode'],
      ['wmind-delete-only','完整格式 · 仅删除节点，保留子节点','deleteOnly'],['wmind-move-up','完整格式 · 上移','moveUp'],['wmind-move-down','完整格式 · 下移','moveDown'],
      ['wmind-indent','完整格式 · 降级','indent'],['wmind-outdent','完整格式 · 升级','outdent'],
      ['wmind-expand','完整格式 · 展开全部','expandAll'],['wmind-collapse','完整格式 · 收起全部','collapseAll'],
      ['wmind-boundary','完整格式 · 添加外框','boundary'],['wmind-summary','完整格式 · 添加概括','summary'],
      ['wmind-link-note','完整格式 · 链接笔记','linkNote'],['wmind-split','完整格式 · 按标点拆分','splitTopic'],
      ...Array.from({length:9},(_,i)=>[`wmind-level-${i+1}`,`完整格式 · 显示到第 ${i+1} 层`,`showLevel:${i+1}`] as [string,string,HostCommand]),
    ];
    for (const [id,name,command] of commands) this.addCommand({id,name,checkCallback: checking => {
      const view = this.app.workspace.getActiveViewOfType(WmindView);
      if (!view) return false;
      if (!checking) view.command(command);
      return true;
    }});
    this.registerEvent(this.app.workspace.on('file-menu', (menu,file) => {
      if (file instanceof TFolder) menu.addItem(item => item.setTitle('新建完整格式脑图 (.wmind)').setIcon('brain-circuit').onClick(() => void this.createWmind(file)));
      else if (file instanceof TFile && file.extension === 'md') menu.addItem(item => item.setTitle('转换为完整格式脑图 (.wmind)').setIcon('brain-circuit').onClick(() => void this.convertToWmind(file)));
    }));
  }
  applyCustomThemes():void {
    registerFusionThemes(this.settings);
    super.applyCustomThemes();
    void this.refreshPrimaryViews(false);
  }
  async saveSettings():Promise<void>{
    registerFusionThemes(this.settings);
    await super.saveSettings();
    await this.refreshPrimaryViews();
  }
  /** Reuse the view's snapshot-safe settings lifecycle for both primary file types. */
  async refreshPrimaryViews(includeMarkdown=true):Promise<void>{
    const views=new Set<WmindView>();
    for(const type of includeMarkdown?[VIEW_TYPE,VIEW_TYPE_MINDMAP]:[VIEW_TYPE])for(const leaf of this.app.workspace.getLeavesOfType(type))if(leaf.view instanceof WmindView)views.add(leaf.view);
    await Promise.all([...views].map(view=>view.refreshFromSettings()));
  }
  private freePath(dir:string, name:string):string {
    const clean = name.replace(/[\\/:*?"<>|]/g,' ').trim() || '新建思维导图';
    let path=normalizePath(`${dir}/${clean}.wmind`);
    for(let n=2;this.app.vault.getAbstractFileByPath(path);n++) path=normalizePath(`${dir}/${clean} ${n}.wmind`);
    return path;
  }
  async createWmind(folder?:TFolder):Promise<void> {
    const path=this.freePath(folder?.path??this.app.workspace.getActiveFile()?.parent?.path??'', '新建思维导图');
    const file=await this.app.vault.create(path,serialize(newDoc(path.split('/').pop()!.replace(/\.wmind$/,''))));
    await this.app.workspace.getLeaf(true).openFile(file);
  }
  async convertToWmind(file:TFile):Promise<void> {
    try {
      const doc=parseMarkdownDoc(await this.app.vault.read(file),file.basename,this.rootRule());
      const created=await this.app.vault.create(this.freePath(file.parent?.path??'',file.basename),serialize(doc));
      await this.app.workspace.getLeaf(true).openFile(created);
      new Notice(`已创建 ${created.path}`);
    }catch(error){new Notice(`转换失败：${(error as Error).message}`);}
  }
}
