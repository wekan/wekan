const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../../..');
test('offline mirror catalog navigates by host/organization/repository and displays local comment images',async({page})=>{
 const temporary=path.join(root,'.tools/tmp');fs.mkdirSync(temporary,{recursive:true});
 const work=fs.mkdtempSync(path.join(temporary,'mirror-static-browser-'));let server;
 try{
  const {archiveSnapshot}=await import(pathToFileURL(path.join(root,'tools/mirror-archive.mjs')).href);
  await archiveSnapshot({sourceName:'github',organization:'sample',repository:'repo',issues:[{number:1000,title:'Offline issue <script>danger</script>',body:'Original description',state:'open',html_url:'https://github.com/sample/repo/issues/1000',commentsToMirror:[{id:2000,body:'![Image](https://example.com/image.png)',user:{login:'member'},html_url:'https://github.com/sample/repo/issues/1000#issuecomment-2000'}]}],releases:[]},{root:work,fetchFile:async(url,{temporary})=>{fs.mkdirSync(temporary,{recursive:true});const file=path.join(temporary,'image-download');fs.copyFileSync(path.join(root,'public/windows11/Wide310x150Logo.scale-100.png'),file);return {file,originalName:'image.png'};}});
  server=http.createServer((request,response)=>{const file=path.resolve(work,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));if(!file.startsWith(work+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404);response.end();return;}response.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.png')?'image/png':'text/plain');fs.createReadStream(file).pipe(response);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.goto(origin+'/.tools/mirror/index.html');
  await page.getByRole('link',{name:'github.com',exact:true}).focus();await page.keyboard.press('Enter');
  await page.getByRole('link',{name:'sample',exact:true}).click();await page.getByRole('link',{name:'repo',exact:true}).click();
  await page.getByRole('link',{name:'issues',exact:true}).click();await page.getByRole('link',{name:'Offline issue <script>danger</script>',exact:true}).click();
  await expect(page.getByRole('heading',{name:'#1000 Offline issue <script>danger</script>'})).toBeVisible();
  await expect(page.locator('article#comment-2000 img')).toBeVisible();await expect.poll(()=>page.locator('article#comment-2000 img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('script')).toHaveCount(0);await expect(page.locator('article#comment-2000 a[download]')).toHaveCount(1);
  await page.goto(origin+'/.tools/mirror/github.com/sample/repo/issues/1000/2000/index.html');await expect(page.locator('body')).toHaveText('');
 }finally{if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(work,{recursive:true,force:true});}
});

test('incremental issue archive survives interruption and resumes an offline catalog',async({page})=>{
 const temporary=path.join(root,'.tools/tmp');fs.mkdirSync(temporary,{recursive:true});
 const work=fs.mkdtempSync(path.join(temporary,'mirror-incremental-browser-'));let server;
 try{
  const {collectGithub}=await import(pathToFileURL(path.join(root,'tools/mirror-disk-snapshot.mjs')).href);
  let interrupted=true;
  const api=async endpoint=>{
   const url=new URL(endpoint,'https://api.github.com/'),first=url.searchParams.get('page')==='1';
   if(url.pathname.endsWith('/issues'))return first?[{id:1000,number:1000,title:'Saved incremental issue',body:'Saved original description',state:'open',html_url:'https://github.com/wekan/wekan/issues/1000'},{id:1001,number:1001,title:'Pending pull',body:'Pull body',pull_request:{},html_url:'https://github.com/wekan/wekan/pull/1001'}]:[];
   if(url.pathname.endsWith('/pulls'))return first?[{number:1001,patch_url:'https://github.com/wekan/wekan/pull/1001.patch'}]:[];
   if(url.pathname.endsWith('/issues/comments'))return first?[{id:2000,issue_url:'https://api.github.com/repos/wekan/wekan/issues/1000',body:'![Image](https://example.com/image.png)',user:{login:'member'},html_url:'https://github.com/wekan/wekan/issues/1000#issuecomment-2000'}]:[];
   if(url.pathname.endsWith('/reviews')&&interrupted)throw Error('interrupted browser fixture');
   return [];
  };
  const options={root:work,api,log:()=>{},fetchFile:async(url,{temporary})=>{fs.mkdirSync(temporary,{recursive:true});const file=path.join(temporary,'image-'+require('node:crypto').randomUUID());fs.copyFileSync(path.join(root,'public/windows11/Wide310x150Logo.scale-100.png'),file);return {file,originalName:'image.png'};}};
  let failure;try{await collectGithub(options);}catch(error){failure=error;}
  expect(failure?.message).toContain('interrupted browser fixture');
  server=http.createServer((request,response)=>{const file=path.resolve(work,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));if(!file.startsWith(work+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404);response.end();return;}response.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.png')?'image/png':'text/plain');fs.createReadStream(file).pipe(response);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.goto(origin+'/.tools/mirror/github.com/wekan/wekan/issues/1000/index.html');
  await expect(page.getByRole('heading',{name:'#1000 Saved incremental issue'})).toBeVisible();
  await expect(page.locator('article#comment-2000 img')).toBeVisible();
  interrupted=false;await collectGithub(options);
  await page.goto(origin+'/.tools/mirror/index.html');
  await page.getByRole('link',{name:'github.com',exact:true}).click();
  await page.getByRole('link',{name:'wekan',exact:true}).click();
  await page.getByRole('link',{name:'wekan',exact:true}).click();
  await page.getByRole('link',{name:'issues',exact:true}).click();
  await page.getByRole('link',{name:'Saved incremental issue',exact:true}).click();
  await expect(page.locator('article#comment-2000 img')).toBeVisible();
  await expect.poll(()=>page.locator('article#comment-2000 img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
  await page.goto(origin+'/.tools/mirror/github.com/wekan/wekan/issues/1000/2000/index.html');await expect(page.locator('body')).toHaveText('');
 }finally{if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(work,{recursive:true,force:true});}
});
