'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function harness(responses){
 const calls=[];const context={URL,Buffer,AbortController,setTimeout,clearTimeout,
 fetch:async(url,options)=>{calls.push({url,options});const response=responses.shift();if(!response)throw new Error('Unexpected request');if(response.error)throw new Error(response.error);return {ok:true,headers:new Headers(response.headers),json:async()=>response.body};}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('server/lib/listSyncFetch.js','utf8').replace(/export /g,''),context);
 return {context,calls};
}
const config={url:'https://tracker.example',projectKey:'team/project'};const credential={username:'test',token:'test-token'};
test('Jira fetches all offset pages using the actual returned count',async()=>{
 const {context,calls}=harness([{body:{startAt:0,total:3,issues:[{key:'A'}]}},{body:{startAt:1,total:3,issues:[{key:'B'},{key:'C'}]}}]);
 const result=await context.fetchJiraIssues(config,credential);
 assert.equal(result.issues.length,3);assert.match(calls[1].url,/startAt=1$/);
});
test('Jira rejects incomplete, inconsistent or malformed later pages',async()=>{
 for(const second of [{startAt:1,total:2,issues:[]},{startAt:0,total:2,issues:[{key:'B'}]},{startAt:1,total:3,issues:[{key:'B'}]},{}]){
  const {context}=harness([{body:{startAt:0,total:2,issues:[{key:'A'}]}},{body:second}]);
  await assert.rejects(context.fetchJiraIssues(config,credential),/pagination/);
 }
 const {context}=harness([{body:{startAt:0,total:0,issues:[]}}]);
 assert.equal((await context.fetchJiraIssues(config,credential)).issues.length,0);
});
test('GitHub, Gitea and GitLab follow Link pagination even with short pages',async()=>{
 for(const name of ['fetchGithubIssues','fetchGiteaIssues','fetchGitlabIssues']){
  const origin=name==='fetchGithubIssues'?'https://api.github.com':'https://tracker.example';
  const {context,calls}=harness([{body:[{id:1}],headers:{link:`<${origin}/next?page=2>; rel="next"`}},{body:[{id:2}]}]);
  assert.equal((await context[name](config,credential)).length,2);assert.equal(calls.length,2);
  assert.deepEqual(calls[0].options.headers,calls[1].options.headers);
  assert.equal(calls[1].options.redirect,'error');
 }
});
test('GitLab supports X-Next-Page and later fetch failures return no partial result',async()=>{
 const {context,calls}=harness([{body:[{id:1}],headers:{'x-next-page':'2'}},{body:[{id:2}]}]);
 assert.equal((await context.fetchGitlabIssues(config,credential)).length,2);assert.match(calls[1].url,/page=2/);
 const failed=harness([{body:[{id:1}],headers:{'x-next-page':'2'}},{error:'offline'}]);
 await assert.rejects(failed.context.fetchGitlabIssues(config,credential),/offline/);
});
test('pagination rejects foreign origins, cycles, malformed pages and item overflow',async()=>{
 const foreign=harness([{body:[{id:1}],headers:{link:'<https://other.example/page>; rel="next"'}}]);
 await assert.rejects(foreign.context.fetchGiteaIssues(config,credential),/origin/);assert.equal(foreign.calls.length,1);
 const cycle=harness([{body:[],headers:{'x-next-page':'2'}},{body:[],headers:{'x-next-page':'2'}}]);
 await assert.rejects(cycle.context.fetchGitlabIssues(config,credential),/did not finish/);
 const malformed=harness([{body:{error:'failure'}}]);await assert.rejects(malformed.context.fetchGithubIssues(config,credential),/Invalid sync/);
 const overflow=harness([{body:{startAt:0,total:100001,issues:[]}}]);await assert.rejects(overflow.context.fetchJiraIssues(config,credential),/limit/);
});

test('advertised array totals cannot silently truncate when next links are missing',async()=>{
 const partial=harness([{body:[{id:1}],headers:{'x-total-count':'2'}}]);
 await assert.rejects(partial.context.fetchGiteaIssues(config,credential),/Incomplete/);
 const complete=harness([{body:[{id:1}],headers:{'x-total':'1'}}]);
 assert.equal((await complete.context.fetchGitlabIssues(config,credential)).length,1);
});

test('Jira Cloud uses enhanced search, explicit fields and opaque page tokens',async()=>{
 const {context,calls}=harness([{body:{issues:[{key:'A'}],isLast:false,nextPageToken:'a+/= &b'}},{body:{issues:[{key:'B'}],isLast:true}}]);
 const result=await context.fetchJiraIssues({...config,url:'https://team.atlassian.net'},credential);
 assert.equal(result.issues.length,2);
 const first=new URL(calls[0].url),second=new URL(calls[1].url);
 assert.equal(first.pathname,'/rest/api/3/search/jql');
 assert.equal(first.searchParams.get('jql'),'project=team/project');
 assert.ok(first.searchParams.get('fields').includes('description'));
 assert.equal(second.searchParams.get('nextPageToken'),'a+/= &b');
 assert.equal(second.searchParams.has('startAt'),false);
});
test('Jira Cloud refuses missing termination metadata and repeating tokens',async()=>{
 for(const body of [{issues:[]},{issues:[],isLast:false},{issues:[],isLast:false,nextPageToken:42}]){
  const {context}=harness([{body}]);
  await assert.rejects(context.fetchJiraIssues({...config,url:'https://team.atlassian.net'},credential),/pagination/);
 }
 const loop=harness([{body:{issues:[],isLast:false,nextPageToken:'same'}},{body:{issues:[],isLast:false,nextPageToken:'same'}}]);
 await assert.rejects(loop.context.fetchJiraIssues({...config,url:'https://team.atlassian.net'},credential),/repeating/);
 const empty=harness([{body:{issues:[],isLast:true}}]);
 assert.equal((await empty.context.fetchJiraIssues({...config,url:'https://team.atlassian.net'},credential)).issues.length,0);
});
