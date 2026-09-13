// Rebuild an existing repository's HTML from editable CSV, without network access.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateStatic } from './mirror-static.mjs';
import { writeBytes } from './mirror-archive.mjs';
export function parseCsv(text) {
  const rows=[],row=[];let value='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted && text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(value);value='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row.splice(0));value='';}
    else value+=c;
  }
  if(quoted)throw Error('Unterminated CSV string');
  if(value || row.length){row.push(value);rows.push(row);}
  const header=rows.shift() || [];
  if(new Set(header).size!==header.length)throw Error('Duplicate CSV column');
  return rows.filter(r=>r.some(Boolean)).map(r=>{if(r.length!==header.length)throw Error('Invalid CSV row width');return Object.fromEntries(header.map((h,i)=>[h,r[i]]));});
}
export function rebuild(base) {
  const rows=parseCsv(fs.readFileSync(path.join(base,'index.csv'),'utf8'));
  const snapshot={organization:path.basename(path.dirname(base)),repository:path.basename(base),issues:[],releases:[]};
  for(const row of rows){
    if(!['issues','pulls','releases'].includes(row.type))continue;
    const local=path.resolve(base,row.local_path || '');
    if(!local.startsWith(path.resolve(base)+path.sep) || path.basename(local)!=='index.html')throw Error('Unsafe CSV item path');
    const directory=path.dirname(local);
    if(row.type==='releases'){const release=JSON.parse(fs.readFileSync(path.join(directory,'release.json'),'utf8'));snapshot.releases.push({...release,name:row.title,html_url:row.source});continue;}
    const number=Number(row.number);if(!Number.isSafeInteger(number)||number<1)throw Error('Invalid CSV issue number');
    const item={number,title:row.title,state:row.state,html_url:row.source,commentsToMirror:[],...(row.type==='pulls'?{pull_request:{}}:{})},comments=new Map();
    for(const comment of parseCsv(fs.readFileSync(path.join(directory,'index.csv'),'utf8'))){
      if(comments.has(comment.comment))continue;
      const value={id:comment.comment,archiveCommentId:comment.comment,user:{login:comment.author},created_at:comment.created_at,body:comment.body,html_url:comment.source};comments.set(comment.comment,value);
      if(comment.comment==='body'){item.body=value.body;item.user=value.user;item.created_at=value.created_at;}else item.commentsToMirror.push(value);
    }
    snapshot.issues.push(item);
  }
  generateStatic(snapshot,base,(file,content)=>writeBytes(file,Buffer.from(content),new Date()));
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{if(process.argv.length!==3)throw Error('Usage: node tools/mirror-static-rebuild.mjs .tools/mirror/github.com/wekan/wekan');rebuild(path.resolve(process.argv[2]));}catch(error){console.error(error.message);process.exitCode=1;}
}
