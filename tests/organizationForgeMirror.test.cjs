'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),tmp=path.join(root,'.tools/tmp');fs.mkdirSync(tmp,{recursive:true});process.env.TMPDIR=tmp;
const org=import('../tools/mirror-organization.mjs'),menu=import('../tools/mirror-menu.mjs'),project=import('../tools/mirror-projects.mjs');
const repo=name=>({name,full_name:`wekan/${name}`,owner:{login:'wekan'},private:false,has_issues:true,has_wiki:false,has_projects:false,default_branch:'devel'});
test('organization discovery includes forks and archives, paginates short pages and rejects repeated/incomplete data',async()=>{
 const m=await org,calls=[];const repos=await m.organizationRepositories(async(kind,url)=>{calls.push(url);return url.endsWith('page=1')?[{...repo('wekan'),fork:true}]:url.endsWith('page=2')?[{...repo('FerretDB'),archived:true}]:[];});assert.equal(repos.length,2);assert.equal(calls.length,3);
 await assert.rejects(m.organizationRepositories(async()=>[repo('wekan')]),/Repeated/);
 await assert.rejects(m.organizationRepositories(async()=>[{name:'../unsafe'}]),/Invalid/);
});
test('missing mirrors are planned without writes; only confirmed 404 allows creation, visibility is preserved',async()=>{
 const m=await org,calls=[];const api=async(kind,url,method,data)=>{calls.push({kind,url,method,data});if(url.startsWith('projects/wekan'))throw Error('HTTP 404: not found');if(url==='groups/wekan')return {id:23};return {};};
 assert.equal(await m.ensureRepository('gitlab',repo('new'),{apply:false,api}),false);assert.equal(calls.some(c=>c.method==='POST'),false);
 await assert.rejects(m.ensureRepository('gitlab',repo('new'),{apply:true,api:async()=>{throw Error('HTTP 403: denied');}}),/403/);
 await assert.rejects(m.ensureRepository('codeberg',{...repo('private'),private:true},{apply:true,api:async()=>({private:false})}),/visibility/);
 const created=[];let exists=false;assert.equal(await m.ensureRepository('codeberg',repo('new'),{apply:true,api:async(k,u,method,data)=>{created.push({u,method,data});if(u==='repos/wekan/new'&&!exists)throw Error('HTTP 404: missing');if(method==='POST')exists=true;return {};}}),true);assert.equal(created.find(c=>c.method==='POST').data.auto_init,false);
});
test('organization sync scopes environment and archives, skips disabled features, continues other repos after failures',async()=>{
 const m=await org,directory=fs.mkdtempSync(path.join(tmp,'org-sync-')),calls=[],logs=[];
 try{
 const success=await m.syncOrganization({source:'codeberg',mirrors:['github','gitlab']},{directory,log:s=>logs.push(s),api:async(k,u)=>u.startsWith('orgs/wekan/repos')?(u.endsWith('page=1')?[repo('bad'),repo('good')]:[]):({visibility:'public'}),run:(tool,args,input,options)=>{calls.push({tool,args,options});if(args.includes('--export-source')){const name=options.env.WEKAN_MIRROR_REPOSITORY;if(name==='bad')throw Error('source unavailable');fs.writeFileSync(args.at(-1),JSON.stringify({repository:name,issues:[],releases:[],labels:[],milestones:[]}));}return '';},projects:()=>{throw Error('disabled project must not be read');},synchronize:async(settings,options)=>{assert.deepEqual(settings,{source:'github',mirrors:['gitlab']});assert.equal(options.environment.WEKAN_MIRROR_REPOSITORY,'good');assert.equal(options.environment.WEKAN_MIRROR_DEFAULT_BRANCH,'devel');return true;}});
 assert.equal(success,false);assert.ok(logs.some(s=>s.includes('wekan/good')));assert.equal(calls.some(c=>c.args.some(a=>String(a).includes('.wiki.git'))),false);
 assert.ok(fs.existsSync(path.join(directory,'.tools/log')));
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('organization menu action preserves existing Exit choice and saved destination settings',async()=>{
 const m=await menu,directory=fs.mkdtempSync(path.join(tmp,'org-menu-')),answers=['7','6'],calls=[],logs=[];
 try{await m.menu({directory,ask:async()=>answers.shift(),log:s=>logs.push(s),organization:async settings=>calls.push(settings)});assert.equal(calls.length,1);assert.match(logs[0],/7. Mirror all repositories of selected GitHub organization/);assert.equal(calls[0].source,'github');}finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('disabled wiki has no Git/API reads; enabled wiki preview has no writes and retries inaccessible wiki',async()=>{
 const m=await org;await m.mirrorWiki(repo('a'),['gitlab'],{apply:true,run:()=>{throw Error('disabled');}});
 const calls=[];await m.mirrorWiki({...repo('a'),has_wiki:true},['gitlab'],{apply:false,run:(tool,args)=>{calls.push(args);return 'refs';}});assert.equal(calls.length,1);assert.equal(calls[0][0],'ls-remote');
 await assert.rejects(m.mirrorWiki({...repo('a'),has_wiki:true},['gitlab'],{apply:false,run:()=>{throw Error('offline');}}),/offline/);
});
test('GraphQL connection pagination rejects partial exports and repeated cursors',async()=>{
 const m=await project,variables=[];const nodes=await m.connection(async(q,v)=>{variables.push(v.after);return {data:{nodes:v.after?[{id:'2'}]:[{id:'1'}],pageInfo:{hasNextPage:!v.after,endCursor:'next'}}};},'',{},d=>d);assert.equal(nodes.length,2);assert.deepEqual(variables,[null,'next']);
 await assert.rejects(m.connection(async()=>({errors:[{message:'scope denied'}]}),'',{},d=>d),/scope denied/);
 await assert.rejects(m.connection(async()=>({data:{nodes:[],pageInfo:{hasNextPage:true,endCursor:'same'}}}),'',{},d=>d),/Repeated/);
});
test('projects export paginates nested field values, labels and new multi-select fields',async()=>{
 const m=await project,queries=[];
 const projects=await m.projectsForRepository('wekan',async(q,v)=>{
 queries.push(q);const key=q.includes('projectsV2(')?'projectsV2':q.includes('fields(')?'fields':q.includes('statusUpdates(')?'statusUpdates':q.includes('workflows(')?'workflows':q.includes('views(')?'views':q.includes('items(')?'items':q.includes('fieldValues(')?'fieldValues':'labels';
 const nodes=key==='projectsV2'?[{id:'p',number:1}]:key==='items'?[{id:'i'}]:key==='fieldValues'?[{__typename:'ProjectV2ItemFieldLabelValue',field:{name:'Labels'}}]:key==='labels'?[{id:v.after?'l2':'l1'}]:[];
 const connection={nodes,pageInfo:{hasNextPage:key==='labels'&&!v.after,endCursor:'next'}};
 return {data:{repository:{[key]:connection},node:key==='labels'?{fieldValueByName:{labels:connection}}:{[key]:connection}}};});
 assert.equal(projects[0].items[0].fieldValues[0].labels.length,2);assert.ok(queries.some(q=>q.includes('ProjectV2MultiSelectField')));assert.ok(queries.some(q=>q.includes('ProjectV2ItemIssueFieldValue')));
});
test('organization management adds, edits, removes and selects namespaces without deleting archives',async()=>{
 const m=await menu,o=await import('../tools/mirror-organizations.mjs'),directory=fs.mkdtempSync(path.join(tmp,'org-manage-'));
 try{
 const archived=path.join(directory,'.tools/mirror/github.com/sample/repo/issues');fs.mkdirSync(archived,{recursive:true});fs.writeFileSync(path.join(archived,'kept.txt'),'kept');
 const answers=['2','sample','gitlab-group/subgroup','codeberg-group','sf-project','3','2','renamed','','','','4','2','5'];
 await m.manageOrganizations({directory,ask:async()=>answers.shift(),log:()=>{}});
 const value=o.loadOrganizations(directory);assert.equal(value.organizations.length,1);assert.equal(value.selected,'wekan');assert.equal(fs.readFileSync(path.join(archived,'kept.txt'),'utf8'),'kept');
 await assert.rejects(async()=>o.setOrganization(value,{source:'../bad',destinations:{gitlab:'a',codeberg:'a',sourceforge:'a'}}),/Invalid/);
 const r=await import('../tools/mirror-repository.mjs');const targets=r.repositoryForges('repo','sample',{gitlab:'group/sub',codeberg:'other',sourceforge:'sf'});assert.equal(targets.github.git,'https://github.com/sample/repo.git');assert.equal(targets.gitlab.push,'git@gitlab.com:group/sub/repo.git');assert.equal(targets.codeberg.push,'git@codeberg.org:other/repo.git');
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('different source organization and destination namespace are used in discovery, creation and child context',async()=>{
 const m=await org,directory=fs.mkdtempSync(path.join(tmp,'org-context-')),calls=[];
 try{
 let created=false;
 const api=async(kind,url,method,data)=>{calls.push({kind,url,method,data});if(url.startsWith('orgs/sample/repos'))return url.endsWith('page=1')?[{...repo('repo'),owner:{login:'sample'},full_name:'sample/repo'}]:[];if(url==='repos/destination/repo'&&!created)throw Error('HTTP 404: missing');if(method==='POST')created=true;return {private:false};};
 const success=await m.syncOrganization({source:'github',mirrors:['codeberg']},{organizationEntry:{source:'sample',destinations:{gitlab:'group/sub',codeberg:'destination',sourceforge:'sf'}},directory,api,log:()=>{},run:(tool,args,input,options)=>{assert.equal(options.env.WEKAN_MIRROR_ORGANIZATION,'sample');assert.equal(options.env.WEKAN_MIRROR_CODEBERG_NAMESPACE,'destination');fs.writeFileSync(args.at(-1),JSON.stringify({repository:'repo',issues:[],releases:[]}));return '';},synchronize:async()=>true});
 assert.equal(success,true);assert.ok(calls.some(c=>c.url==='orgs/destination/repos'&&c.method==='POST'));
 const logs=fs.readdirSync(path.join(directory,'.tools/log/mirror-organization'));
 assert.equal(logs.length,1);assert.match(logs[0],/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}(?:-\d+)?$/);
 assert.ok(fs.existsSync(path.join(directory,'.tools/log/mirror-organization',logs[0],'report.json')));
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('native wiki initialization merges source into destination default branch and aborts conflicting edits',async()=>{
 const m=await org,directory=fs.mkdtempSync(path.join(tmp,'wiki-native-')),calls=[],apiCalls=[];
 const run=(tool,args)=>{calls.push(args);if(args[0]==='ls-remote')return args[1].startsWith('https:')?'source refs':'';if(args.includes('symbolic-ref'))return args[1].endsWith('wiki.git')?'refs/heads/master':'refs/heads/main';if(args.includes('for-each-ref'))return 'refs/heads/master\nrefs/tags/wiki-v1\n';if(args.includes('config')&&args.length===4)return args.at(-1)==='user.name'?'Lauri Ojansivu':'x@xet7.org';return '';};
 try{await m.mirrorWiki({...repo('repo'),has_wiki:true},['codeberg'],{apply:true,directory,run,owner:'sample',destinations:{gitlab:'a',codeberg:'b',sourceforge:'c'},api:async(k,u,method,data)=>{apiCalls.push({u,method,data});return {};}});assert.ok(apiCalls.some(c=>c.u==='repos/b/repo/wiki/new'&&c.data.title==='WeKan-Mirror'));assert.ok(calls.some(c=>c.includes('merge')&&c.includes('--allow-unrelated-histories')));assert.ok(calls.some(c=>c.includes('push')&&c.includes('HEAD')));assert.ok(calls.some(c=>c.includes('refs/tags/wiki-v1:refs/tags/wiki-v1')));
 const errors=[];await m.mirrorWiki({...repo('repo'),has_wiki:true},['codeberg'],{apply:true,directory,run:(tool,args)=>{if(args.includes('merge')&&args.includes('--no-edit'))throw Error('conflicting pages');return run(tool,args);},api:async()=>({}),record:(s,d)=>errors.push({s,d})});assert.ok(calls.some(c=>c.includes('merge')&&c.includes('--abort')));assert.ok(errors.some(e=>e.s==='failed'&&e.d.includes('conflicting pages')));
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('empty Git repositories skip pushing and non-main branch recovery uses the source default branch',async()=>{
 const m=await import('../tools/mirror-active-forges.mjs'),directory=fs.mkdtempSync(path.join(tmp,'empty-git-')),calls=[];
 try{assert.equal(m.syncGit({name:'gitlab',url:'git@gitlab.com:wekan/empty'},(tool,args)=>{calls.push(args);return '';},()=>false,directory),false);assert.equal(calls.some(c=>c.includes('push')),false);
 const run=(tool,args)=>{calls.push(args);if(args.includes('for-each-ref'))return 'refs/heads/devel\n';if(args.includes('refs/heads/*:refs/heads/*'))throw Error('non-fast-forward');if(args.includes('symbolic-ref'))return 'devel\n';if(args.includes('config')&&args.at(-1)==='user.name')return 'Lauri Ojansivu';if(args.includes('config')&&args.at(-1)==='user.email')return 'x@xet7.org';return '';};m.syncGit({name:'gitlab',url:'git@gitlab.com:wekan/repo',defaultBranch:'devel'},run,()=>true,directory);assert.ok(calls.some(c=>c.includes('HEAD:refs/heads/devel')));
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
