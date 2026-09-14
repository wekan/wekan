// Human-run organization mirroring. Every external operation is injectable.
import { readSnapshot } from './mirror-disk-snapshot.mjs';
import fs from 'node:fs';
import path from 'node:path';
import logDirectory from './log-directory.cjs';
import { command, cliApi, httpJson, root } from './mirror-active-forges.mjs';
import { validateRepository, repositoryArchive, repositoryForges, sourceForgeMount } from './mirror-repository.mjs';
import { generateCatalog } from './mirror-static.mjs';
import { loadOrganizations, organizationName } from './mirror-organizations.mjs';
import { projectsForRepository } from './mirror-projects.mjs';
import { archiveProjects, timestamp, writeBytes } from './mirror-archive.mjs';

export async function organizationRepositories(api = cliApi, owner = 'wekan') {
  organizationName(owner);
  const repos = [], identities = new Set();
  for (let page = 1; ; page++) {
    const items = await api('github', `orgs/${owner}/repos?type=all&sort=full_name&per_page=100&page=${page}`);
    if (!Array.isArray(items)) throw new Error('Incomplete GitHub organization repository inventory');
    if (!items.length) return repos;
    for (const item of items) {
      validateRepository(item.name);
      if (item.owner?.login?.toLowerCase() !== owner.toLowerCase() || item.full_name?.toLowerCase() !== `${owner}/${item.name}`.toLowerCase() || typeof item.private !== 'boolean' || typeof item.has_issues !== 'boolean' || typeof item.has_wiki !== 'boolean' || typeof item.has_projects !== 'boolean') throw new Error('Invalid organization repository metadata');
      const key = item.name.toLowerCase();
      if (identities.has(key)) throw new Error('Repeated GitHub organization repository page');
      identities.add(key); repos.push(item);
    }
  }
}
function missing(error) { return /(?:HTTP[ :]+404|status[ :]+404|\(404\)|\b404\s*:)/i.test(error.message); }
export async function ensureRepository(kind, repo, {apply,api=cliApi,http=httpJson,record=()=>{},destinations={gitlab:'wekan',codeberg:'wekan',sourceforge:'wekan'}}) {
  const name = validateRepository(repo.name);
  if (kind === 'sourceforge') {
    if (repo.private) throw new Error('SourceForge WeKan public project cannot preserve private repository visibility');
    const project = await http(`https://sourceforge.net/rest/p/${destinations.sourceforge}`);
    const mount = name === 'wekan' && destinations.sourceforge==='wekan' ? 'code' : sourceForgeMount(name);
    const tool = project.tools?.find(t=>t.mount_point===mount);
    if (tool && tool.name !== 'git') throw new Error(`SourceForge tool ${mount} is occupied by another tool`);
    if (!tool) {
      record('planned',`SourceForge Git tool ${mount}`);
      if (!apply) return false;
      if (!process.env.SOURCEFORGE_TOKEN) throw new Error('Set SOURCEFORGE_TOKEN to create SourceForge repository tools');
      await http(`https://sourceforge.net/rest/p/${destinations.sourceforge}/admin/install_tool`,{method:'POST',headers:{Authorization:`Bearer ${process.env.SOURCEFORGE_TOKEN}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({tool:'git',mount_point:mount,mount_label:name,order:'last'}).toString()});
      const verified = await http(`https://sourceforge.net/rest/p/${destinations.sourceforge}`);
      if (!verified.tools?.some(t=>t.mount_point===mount && t.name==='git')) throw new Error('SourceForge did not confirm repository creation');
    }
    return true;
  }
  const endpoint = kind === 'gitlab' ? `projects/${encodeURIComponent(destinations.gitlab+'/'+name)}` : `repos/${destinations.codeberg}/${name}`;
  let existing;
  try { existing = await api(kind,endpoint); } catch(error) { if (!missing(error)) throw error; }
  if (existing) {
    if (repo.private && (kind==='gitlab' ? existing.visibility!=='private' : existing.private!==true)) throw new Error('Existing public mirror cannot preserve private source visibility');
    return true;
  }
  record('planned',`${kind} repository ${destinations[kind]}/${name}`);
  if (!apply) return false;
  if (kind === 'gitlab') {
    const group = await api(kind,`groups/${encodeURIComponent(destinations.gitlab)}`);
    if (!Number.isSafeInteger(group.id)) throw new Error('Invalid GitLab destination group');
    await api(kind,'projects','POST',{name,path:name,namespace_id:group.id,description:repo.description || '',visibility:repo.private?'private':'public',initialize_with_readme:false,issues_enabled:true,wiki_enabled:repo.has_wiki});
  } else if (kind === 'codeberg') {
    await api(kind,`orgs/${destinations.codeberg}/repos`,'POST',{name,description:repo.description || '',private:repo.private,auto_init:false,default_branch:repo.default_branch || 'main',has_issues:true,has_wiki:repo.has_wiki});
  } else throw new Error('Organization destination must be GitLab, Codeberg or SourceForge');
  await api(kind,endpoint); // Confirm creation instead of assuming POST succeeded.
  record('copied',`${kind} repository ${destinations[kind]}/${name}`);
  return true;
}

export async function mirrorWiki(repo, targets, {apply,run=command,api=cliApi,http=httpJson,directory=root,record=()=>{},owner='wekan',destinations={gitlab:'wekan',codeberg:'wekan',sourceforge:'wekan'}}) {
  if (!repo.has_wiki) { record('skipped',`${repo.name}: wiki disabled`); return; }
  const source = `https://github.com/${owner}/${validateRepository(repo.name)}.wiki.git`;
  // An enabled but never initialized wiki has no Git repository. Report the
  // actual Git error, retain old data and retry next run; do not call it disabled.
  const inventory = run('git',['ls-remote',source]);
  if (!inventory.trim()) { record('checked',`${repo.name}: wiki has no Git refs`); return; }
  if (!apply) { for (const target of targets) record('planned',`${target}: wiki Git files and history`); return; }
  const base = repositoryArchive(directory,repo.name,owner); fs.mkdirSync(base,{recursive:true});
  const cache = path.join(base,'wiki.git');
  if (!fs.existsSync(cache)) run('git',['clone','--mirror',source,cache]);
  else run('git',['-C',cache,'fetch','origin']); // No prune: retain historical refs.
  for (const target of targets) {
    try {
      let destination;
      if (target==='sourceforge') {
        const mount = sourceForgeMount(repo.name,'-wiki');
        const project = await http(`https://sourceforge.net/rest/p/${destinations.sourceforge}`);
        const tool = project.tools?.find(t=>t.mount_point===mount);
        if (tool && tool.name!=='git') throw new Error('SourceForge wiki Git tool mount occupied');
        if (!tool) {
          if (!process.env.SOURCEFORGE_TOKEN) throw new Error('Set SOURCEFORGE_TOKEN to create wiki Git tool');
          await http(`https://sourceforge.net/rest/p/${destinations.sourceforge}/admin/install_tool`,{method:'POST',headers:{Authorization:`Bearer ${process.env.SOURCEFORGE_TOKEN}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({tool:'git',mount_point:mount,mount_label:`${repo.name} Wiki`,order:'last'}).toString()});
        }
        destination=`ssh://${destinations.sourceforge}@git.code.sf.net/p/${destinations.sourceforge}/${mount}`;
      } else {
        const endpoint = target==='gitlab' ? `projects/${encodeURIComponent(destinations.gitlab+'/'+repo.name)}` : `repos/${destinations.codeberg}/${repo.name}`;
        await api(target,endpoint,target==='gitlab'?'PUT':'PATCH',target==='gitlab'?{wiki_enabled:true}:{has_wiki:true});
        destination=repositoryForges(repo.name,owner,destinations)[target].push.replace(/(?:\.git)?$/,'.wiki.git');
        if (!run('git',['ls-remote',destination]).trim()) {
          const content=`Wiki files mirrored from ${source}`;
          await api(target,target==='gitlab'?`${endpoint}/wikis`:`${endpoint}/wiki/new`,'POST',target==='gitlab'?{title:'WeKan-Mirror',content,format:'markdown'}:{title:'WeKan-Mirror',content_base64:Buffer.from(content).toString('base64')});
        }
      }
      if(target==='sourceforge') run('git',['-C',cache,'push',destination,'refs/heads/*:refs/heads/*','refs/tags/*:refs/tags/*']);
      else {
        // Initialization or existing edits introduce destination-only history.
        const checkout=path.join(base,`wiki-transfer-${target}`);
        if (!fs.existsSync(checkout)) run('git',['clone',destination,checkout]);
        if (run('git',['-C',checkout,'status','--porcelain']).trim()) throw new Error('Wiki checkout has local changes; preserved');
        for (const key of ['user.name','user.email']) run('git',['-C',checkout,'config',key,run('git',['-C',directory,'config',key]).trim()]);
        run('git',['-C',checkout,'pull','--ff-only']);
        run('git',['-C',checkout,'fetch',source,'HEAD']);
        try { run('git',['-C',checkout,'merge','--no-edit','--allow-unrelated-histories','FETCH_HEAD']); }
        catch(error) { try {run('git',['-C',checkout,'merge','--abort']);} catch {} throw error; }
        run('git',['-C',checkout,'push','origin','HEAD']);
        const sourceHead=run('git',['-C',cache,'symbolic-ref','HEAD']).trim(),destinationHead=run('git',['-C',checkout,'symbolic-ref','HEAD']).trim();
        const refs=run('git',['-C',cache,'for-each-ref','--format=%(refname)','refs/heads','refs/tags']).trim().split(/\r?\n/).filter(r=>r && r!==sourceHead && r!==destinationHead);
        if(refs.some(r=>!/^refs\/(heads|tags)\//.test(r)))throw Error('Unexpected wiki Git ref');
        if(refs.length)run('git',['-C',cache,'push',destination,...refs.map(r=>`${r}:${r}`)]);
      }
      record('copied',`${target}: ${repo.name} wiki files and history`);
    } catch(error) { record('failed',`${target}: wiki: ${error.message}`); }
  }
}

export async function mirrorProjects(repo, projects, targets, {apply,run=command,directory=root,record=()=>{},owner='wekan',destinations={gitlab:'wekan',codeberg:'wekan',sourceforge:'wekan'}}) {
  if (!repo.has_projects) { record('skipped',`${repo.name}: projects disabled`); return; }
  const portable = projects.filter(p=>p.public || repo.private);
  for (const project of projects.filter(p=>!p.public && !repo.private)) record('unsupported',`${repo.name}: private project ${project.number} retained locally; not published to a public mirror`);
  if (!portable.length) return;
  if (!apply) { for (const target of targets) record('planned',`${target}: ${portable.length} portable project exports on wekan-mirror-projects branch`); return; }
  const base = repositoryArchive(directory,repo.name,owner), cache = path.join(base,'project-transfer');
  fs.mkdirSync(cache,{recursive:true});
  if (!fs.existsSync(path.join(cache,'.git'))) run('git',['init','--initial-branch=wekan-mirror-projects',cache]);
  if (run('git',['-C',cache,'status','--porcelain']).trim()) throw new Error('Project transfer checkout contains local changes; preserved');
  for (const key of ['user.name','user.email']) {
    const identity = run('git',['-C',directory,'config',key]).trim();
    if (!identity) throw new Error(`Configure ${key} before project transfer`);
    run('git',['-C',cache,'config',key,identity]);
  }
  await archiveProjects(cache,portable,{apply:true,now:new Date(),temporary:path.join(directory,'.tools/tmp/mirror-projects'),record});
  run('git',['-C',cache,'add','--','projects']);
  if (run('git',['-C',cache,'diff','--cached','--name-only']).trim()) run('git',['-C',cache,'commit','-m',`Update portable GitHub projects for ${owner}/${repo.name}`]);
  for (const target of targets) {
    try { run('git',['-C',cache,'push',repositoryForges(repo.name,owner,destinations)[target].push,'HEAD:refs/heads/wekan-mirror-projects']); record('copied',`${target}: portable project metadata/items/fields/views/workflows`); }
    catch(error) { record('failed',`${target}: portable projects: ${error.message}`); }
  }
}

export async function syncOrganization(settings,{preview=false,api=cliApi,http=httpJson,run=command,directory=root,log=console.log,synchronize,projects=projectsForRepository,wiki=mirrorWiki,projectTransfer=mirrorProjects,organizationEntry}={}) {
  const registry=loadOrganizations(directory);
  const selected=organizationEntry || registry.organizations.find(o=>o.source===registry.selected);
  if (!selected) throw new Error('Add or select a source organization first');
  const owner=selected.source,destinations=selected.destinations;
  const targets = settings.mirrors.filter(n=>n!=='github');
  if (!targets.length) throw new Error('Select at least one non-GitHub destination mirror');
  const repos = await organizationRepositories(api,owner); // Complete discovery before writes.
  const stamp = timestamp(), logdir = logDirectory.reserve(path.join(directory, '.tools/log'), 'mirror-organization');
  const work = path.join(directory,'.tools/tmp',`mirror-organization-${stamp}`);
  fs.mkdirSync(logdir,{recursive:true}); fs.mkdirSync(work,{recursive:true});
  const report = {source:`https://github.com/${owner}`,destinations,preview,repositories:repos.map(r=>r.name),events:[]};
  const record = (status,detail) => { report.events.push({status,detail}); const line=`[organization] ${status}: ${detail}`;log(line);fs.appendFileSync(path.join(logdir,'status.txt'),line+'\n');fs.writeFileSync(path.join(logdir,'report.json'),JSON.stringify(report,null,2)+'\n'); };
  if (!synchronize) synchronize = (await import('./mirror-menu.mjs')).sync;
  try {
    for (const repo of repos) {
      if (repo.disabled) { record('failed',`${repo.name}: GitHub repository is disabled`); continue; }
      const environment = {WEKAN_MIRROR_ORGANIZATION:owner,WEKAN_MIRROR_GITLAB_NAMESPACE:destinations.gitlab,WEKAN_MIRROR_CODEBERG_NAMESPACE:destinations.codeberg,WEKAN_MIRROR_SOURCEFORGE_NAMESPACE:destinations.sourceforge,WEKAN_MIRROR_REPOSITORY:repo.name,WEKAN_MIRROR_DEFAULT_BRANCH:repo.default_branch || 'main',WEKAN_MIRROR_HAS_ISSUES:String(repo.has_issues)};
      const file = path.join(work,`${repo.name}.json`);
      try {
        const savedBase = repositoryArchive(directory,repo.name,owner,'github.com');
        const progressFile = path.join(savedBase,'sync-progress.json'), savedSource = path.join(savedBase,'source-manifest.json');
        const progress = !preview && fs.existsSync(progressFile) ? JSON.parse(fs.readFileSync(progressFile,'utf8')) : undefined;
        const expectedIdentity = JSON.stringify({source:'github',mirrors:targets});
        if (progress?.version===1 && progress.identity===expectedIdentity && !progress.complete && progress.sourceReady && fs.existsSync(savedSource)) fs.copyFileSync(savedSource,file);
        else run(process.execPath,[path.join(directory,'tools/mirror-active-forges.mjs'),'--source','github','--incremental',...(preview?['--cache-only']:[]),'--export-source',file],undefined,{env:{...process.env,...environment}});
        const snapshotData = JSON.parse(fs.readFileSync(file,'utf8'));
        const snapshot = readSnapshot(file);
        if (snapshot.repository!==repo.name || !snapshot.issues || !snapshot.releases) throw new Error('Incomplete repository snapshot');
        snapshot.organization=owner; snapshot.repositoryMetadata=repo;
        if (repo.has_projects) {
          try { snapshot.projects=await projects(repo.name,undefined,owner); } catch(error) {
            if(/requires a GitHub token|token rejected.*Projects/i.test(error.message)) {
              snapshot.projectPageUrl=`https://github.com/${owner}/${repo.name}/projects`;
              record('unsupported',`${repo.name}: tokenless Projects GraphQL export unavailable; archive public projects webpage HTML`);
            } else record('failed',`${repo.name}: projects inventory: ${error.message}`);
          }
        } else record('skipped',`${repo.name}: projects disabled`);
        fs.writeFileSync(file,JSON.stringify(snapshotData.diskSnapshot === 1 ? {...snapshotData,organization:owner,repositoryMetadata:repo,...(snapshot.projects!==undefined?{projects:snapshot.projects}:{}),...(snapshot.projectPageUrl?{projectPageUrl:snapshot.projectPageUrl}:{})} : snapshot));
        const ready=[];
        for (const target of targets) {
          try { if (await ensureRepository(target,repo,{apply:!preview,api,http,record,destinations})) ready.push(target); }
          catch(error) { record('failed',`${repo.name}: ${target} repository: ${error.message}`); }
        }
        if (ready.length) {
          if (!await synchronize({source:'github',mirrors:ready},{preview,directory,run,log,environment,sourceSnapshotFile:file})) record('failed',`${repo.name}: one or more base data transfers failed`);
        } else {
          // Archive even when creation/authentication failed at every mirror.
          run(process.execPath,[path.join(directory,'tools/mirror-active-forges.mjs'),'--source','github','--archive-only',...(preview?[]:['--apply']),'--snapshot',file],undefined,{env:{...process.env,...environment}});
        }
        try { await wiki(repo,ready,{apply:!preview,run,api,http,directory,record,owner,destinations}); } catch(error) { record('failed',`${repo.name}: wiki inventory: ${error.message}`); }
        if (snapshot.projects!==undefined) {
          try { await projectTransfer(repo,snapshot.projects,ready,{apply:!preview,run,directory,record,owner,destinations}); } catch(error) { record('failed',`${repo.name}: project export: ${error.message}`); }
        }
        record('checked',`${owner}/${repo.name}`);
      } catch(error) { record('failed',`${repo.name}: ${error.message}`); }
    }
  } finally { fs.rmSync(work,{recursive:true,force:true}); }
  if(!preview)generateCatalog(directory,(file,content)=>writeBytes(file,Buffer.from(content),new Date()));
  record('summary',`${repos.length} repositories; ${report.events.filter(e=>e.status==='failed').length} failures; report ${logdir}`);
  return !report.events.some(e=>e.status==='failed');
}
