import fs from 'node:fs';
import path from 'node:path';
import {deflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
const folder=path.resolve('dist',manifest.id);
for(const name of ['main.js','manifest.json','styles.css'])if(!fs.existsSync(path.join(folder,name)))throw new Error('Missing '+name);
for(const name of ['README.md','UPSTREAM.md','FEATURES.md','ACCEPTANCE.md'])if(fs.existsSync(name))fs.copyFileSync(name,path.join(folder,name));
fs.cpSync('examples/fusion',path.join(folder,'示例'),{recursive:true});
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const notices=['# Bundled runtime dependencies',''];
for(const [location,entry]of Object.entries(lock.packages)){
  if(!location||entry.dev||!location.startsWith('node_modules/'))continue;
  const pkgPath=path.join(location,'package.json');if(!fs.existsSync(pkgPath))continue;
  const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
  notices.push(`## ${pkg.name} ${pkg.version}`,`License: ${pkg.license??'see below'}`,'');
  const files=fs.readdirSync(location).filter(name=>/^(licen[cs]e|copying)(\.|$)/i.test(name));
  for(const file of files)if(fs.statSync(path.join(location,file)).isFile())notices.push(fs.readFileSync(path.join(location,file),'utf8'),'');
}
fs.writeFileSync(path.join(folder,'THIRD_PARTY_NOTICES.md'),notices.join('\n'));
fs.mkdirSync('artifacts',{recursive:true});
const archive=path.resolve('artifacts',`${manifest.id}-${manifest.version}.zip`);
// Standard ZIP with UTF-8 names; no platform-specific shell/archive dependency.
const files=[];
const visit=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){const file=path.join(directory,entry.name);if(entry.isDirectory())visit(file);else if(entry.isFile())files.push(file);}};
visit(folder);
const crcTable=Array.from({length:256},(_,value)=>{for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
const crc32=bytes=>{let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;};
const chunks=[],central=[];let offset=0;
for(const file of files){
  const name=Buffer.from(path.relative(path.dirname(folder),file).split(path.sep).join('/'),'utf8');
  const data=fs.readFileSync(file),compressed=deflateRawSync(data,{level:9}),crc=crc32(data);
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(33,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
  const header=Buffer.alloc(46);header.writeUInt32LE(0x02014b50);header.writeUInt16LE(20,4);header.writeUInt16LE(20,6);header.writeUInt16LE(0x800,8);header.writeUInt16LE(8,10);header.writeUInt16LE(33,14);header.writeUInt32LE(crc,16);header.writeUInt32LE(compressed.length,20);header.writeUInt32LE(data.length,24);header.writeUInt16LE(name.length,28);header.writeUInt32LE(offset,42);
  chunks.push(local,name,compressed);central.push(header,name);offset+=local.length+name.length+compressed.length;
}
const index=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(index.length,12);end.writeUInt32LE(offset,16);
fs.writeFileSync(archive,Buffer.concat([...chunks,index,end]));
const hashes={version:manifest.version,zip:archive,sha256:createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),files:Object.fromEntries(['main.js','manifest.json','styles.css'].map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(folder,name))).digest('hex')]))};
fs.writeFileSync('artifacts/package-verification.json',JSON.stringify(hashes,null,2)+'\n');
console.log(JSON.stringify(hashes,null,2));
