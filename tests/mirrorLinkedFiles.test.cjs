'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const temporary=path.join(root,'.tools/tmp');fs.mkdirSync(temporary,{recursive:true});process.env.TMPDIR=temporary;
const archive=import('../tools/mirror-archive.mjs');
const engine=import('../tools/mirror-active-forges.mjs');
function fixture(){const directory=fs.mkdtempSync(path.join(temporary,'linked-files-'));return {directory,snapshot:{sourceName:'github',repository:'wekan',issues:[{number:1000,title:'<script>unsafe</script>',state:'open',body:'Description',html_url:'https://github.com/wekan/wekan/issues/1000',commentsToMirror:[{id:2000,html_url:'https://github.com/wekan/wekan/issues/1000#issuecomment-2000',user:{login:'tester'},body:'![photo](https://example.com/photo.png) [webpage](https://example.com/article) https://example.com/video.mp4'}]}],releases:[]}};}
test('every public linked file is archived under its own comment, with empty listing and usable static pages',async()=>{
 const m=await archive,{directory,snapshot}=fixture(),records=[];
 try {
  await m.archiveSnapshot(snapshot,{root:directory,record:(...r)=>records.push(r),fetchFile:async(url,{temporary,allLinks})=>{assert.equal(allLinks,true);fs.mkdirSync(temporary,{recursive:true});const file=path.join(temporary,encodeURIComponent(url));fs.writeFileSync(file,url.endsWith('article')?'<html>Webpage snapshot</html>':'media bytes');return {file,originalName:url.endsWith('article')?'article.html':path.basename(url)};}});
  const base=path.join(directory,'.tools/mirror/github.com/wekan/wekan'),comment=path.join(base,'issues/1000/2000');
  assert.equal(fs.readFileSync(path.join(comment,'index.html'),'utf8'),'');
  assert.equal(fs.readdirSync(comment).filter(n=>n.startsWith('attachment-')).length,3);
  assert.match(fs.readFileSync(path.join(comment,'index.csv'),'utf8'),/article.html/);
  const page=fs.readFileSync(path.join(base,'issues/1000/index.html'),'utf8');
  assert.match(page,/2000\/attachment-/);assert.match(page,/<img /);assert.match(page,/<video /);assert.doesNotMatch(page,/<script>unsafe/);
  assert.match(fs.readFileSync(path.join(base,'index.html'),'utf8'),/wekan\/wekan/);
  assert.match(fs.readFileSync(path.join(base,'issues/index.csv'),'utf8'),/1000/);
  assert.equal(snapshot.issues[0].commentsToMirror[0].archiveCommentId,undefined);
  assert.equal(records.filter(r=>r[0]==='failed').length,0);
 } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
test('webpage downloads use HTML filenames, conditional caching and credential-free requests',async()=>{
 const m=await archive,dir=fs.mkdtempSync(path.join(temporary,'linked-download-'));
 try {const result=await m.downloadUrl('https://example.com/article',{temporary:dir,allLinks:true,resolveHost:async()=>[{address:'93.184.216.34'}],fetcher:async(url,options)=>{assert.equal(options.headers.Authorization,undefined);assert.equal(options.redirect,'manual');return new Response('<html>snapshot</html>',{headers:{'content-type':'text/html'}});}});assert.equal(result.originalName,'article.html');assert.equal(fs.readFileSync(result.file,'utf8'),'<html>snapshot</html>');}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('local, private, credential-bearing and redirected nonpublic links are rejected',async()=>{
 const m=await archive;
 for(const url of ['http://127.0.0.1/x','http://10.1.2.3/x','http://[::1]/x','http://[::ffff:127.0.0.1]/x'])await assert.rejects(m.downloadUrl(url,{allLinks:true,fetcher:async()=>{throw Error('fetch must not run');}}),/public Internet/);
 await assert.rejects(m.downloadUrl('https://user:secret@example.com',{allLinks:true}),/Unsupported/);
 await assert.rejects(m.downloadUrl('https://example.com',{allLinks:true,resolveHost:async()=>[{address:'93.184.216.34'}],fetcher:async()=>new Response(null,{status:302,headers:{location:'http://192.168.1.1/x'}})}),/public Internet/);
});
test('comment attachments are added to existing same comment, retained on changes, and retry failures',async()=>{
 const m=await archive,e=await engine,{directory,snapshot}=fixture();
 try{
 await m.archiveSnapshot(snapshot,{root:directory,fetchFile:async(url,{temporary})=>{fs.mkdirSync(temporary,{recursive:true});const file=path.join(temporary,encodeURIComponent(url));fs.writeFileSync(file,'bytes');return {file};}});
 const comment=snapshot.issues[0].commentsToMirror[0],destination={id:333,body:'Preserved human comment'},calls=[],records=[];
 const adapter={kind:'gitlab',uploadCommentAttachment:async(target,c,a)=>{assert.equal(c.id,333);calls.push(a.name);return `[file](https://gitlab.com/uploads/${a.name})`;},editComment:async(target,c,text)=>{assert.match(text,/Preserved human comment/);}};
 await e.syncCommentAttachments(adapter,snapshot,snapshot.issues[0],{iid:4},comment,destination,true,(...r)=>records.push(r),directory);
 assert.equal(calls.length,3);await e.syncCommentAttachments(adapter,snapshot,snapshot.issues[0],{iid:4},comment,destination,true,()=>{},directory);assert.equal(calls.length,3);
 const untouched={id:334,body:'Original'},failing={...adapter,uploadCommentAttachment:async()=>{throw Error('upload offline');}};
 await e.syncCommentAttachments(failing,snapshot,snapshot.issues[0],{},comment,untouched,true,(...r)=>records.push(r),directory);assert.equal(untouched.body,'Original');assert.equal(records.filter(r=>r[0]==='failed').length,3);
 await e.syncCommentAttachments(adapter,snapshot,snapshot.issues[0],{},comment,untouched,false,()=>{},directory);assert.equal(calls.length,3);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('non-WeKan archives isolate repository identities and retain removed project exports',async()=>{
 const m=await archive,{directory,snapshot}=fixture();snapshot.repository='FerretDB';snapshot.issues=[];snapshot.projects=[{number:7,title:'Roadmap',url:'https://github.com/orgs/wekan/projects/7',readme:'Tasks',public:true}];
 try{await m.archiveSnapshot(snapshot,{root:directory});const base=path.join(directory,'.tools/mirror/github.com/wekan/FerretDB');assert.ok(fs.existsSync(path.join(base,'projects/7/index.html')));snapshot.projects=[];await m.archiveSnapshot(snapshot,{root:directory});assert.ok(fs.readdirSync(path.join(base,'projects/7')).some(n=>/^old-.*-project.json$/.test(n)));assert.equal(fs.existsSync(path.join(directory,'.tools/mirror/projects/7')),false);}finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('legacy archives migrate without deleting or overwriting conflicting files, and catalog paths remain distinct',async()=>{
 const m=await archive,{directory,snapshot}=fixture();snapshot.issues=[];
 try{const old=path.join(directory,'.tools/mirror/issues/1234');fs.mkdirSync(old,{recursive:true});fs.writeFileSync(path.join(old,'manual.txt'),'older');const newer=path.join(directory,'.tools/mirror/github.com/wekan/wekan/issues/1234');fs.mkdirSync(newer,{recursive:true});fs.writeFileSync(path.join(newer,'manual.txt'),'newer');await m.archiveSnapshot(snapshot,{root:directory});assert.equal(fs.readFileSync(path.join(newer,'manual.txt'),'utf8'),'newer');assert.ok(fs.readdirSync(newer).some(n=>/^old-.*-manual.txt$/.test(n)));
 snapshot.organization='sample';snapshot.repository='repo';await m.archiveSnapshot(snapshot,{root:directory});const catalog=fs.readFileSync(path.join(directory,'.tools/mirror/index.html'),'utf8');assert.match(catalog,/github.com\/index.html/);assert.match(fs.readFileSync(path.join(directory,'.tools/mirror/github.com/index.csv'),'utf8'),/sample/);assert.match(fs.readFileSync(path.join(directory,'.tools/mirror/github.com/sample/index.html'),'utf8'),/repo\/index.html/);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('HTML can be rebuilt offline from updated CSV and CSV preserves multiline quoted comment bodies',async()=>{
 const rebuild=await import('../tools/mirror-static-rebuild.mjs'),s=await import('../tools/mirror-static.mjs'),m=await archive,{directory,snapshot}=fixture();snapshot.issues[0].commentsToMirror=[];
 try{await m.archiveSnapshot(snapshot,{root:directory});const base=path.join(directory,'.tools/mirror/github.com/wekan/wekan'),file=path.join(base,'index.csv');fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('<script>unsafe</script>','Updated title'));rebuild.rebuild(base);assert.match(fs.readFileSync(path.join(base,'issues/1000/index.html'),'utf8'),/Updated title/);assert.deepEqual(rebuild.parseCsv(s.csv([['body','name'],['First line\n"quoted", next','example']])),[{body:'First line\n"quoted", next',name:'example'}]);assert.throws(()=>rebuild.parseCsv('"unclosed'),/Unterminated/);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('review and ordinary comment IDs cannot collide and already mirrored reviews are not rewritten on reruns',async()=>{
 const m=await archive,{directory,snapshot}=fixture(),issue=snapshot.issues[0];issue.pull_request={};issue.commentsToMirror=[{id:2000,body:'Comment',html_url:'https://github.com/wekan/wekan/pull/1000#issuecomment-2000'},{id:2000,body:'Review',created_at:'2026-09-13',html_url:'https://github.com/wekan/wekan/pull/1000#pullrequestreview-2000'}];issue.reviews=[{id:2000,body:'Review',html_url:issue.commentsToMirror[1].html_url}];
 try{await m.archiveSnapshot(snapshot,{root:directory});const base=path.join(directory,'.tools/mirror/github.com/wekan/wekan/pulls/1000');assert.ok(fs.existsSync(path.join(base,'2000/comment.json')));assert.ok(fs.existsSync(path.join(base,'review-2000/comment.json')));await m.archiveSnapshot(snapshot,{root:directory});assert.equal(fs.readdirSync(path.join(base,'review-2000')).some(n=>n.startsWith('old-')),false);}finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('organization catalogs include dot-prefixed GitHub repositories such as .github',async()=>{
 const m=await archive,{directory,snapshot}=fixture();snapshot.repository='.github';snapshot.issues=[];
 try{await m.archiveSnapshot(snapshot,{root:directory});assert.match(fs.readFileSync(path.join(directory,'.tools/mirror/github.com/wekan/index.csv'),'utf8'),/\.github\/index.html/);}finally{fs.rmSync(directory,{recursive:true,force:true});}
});
