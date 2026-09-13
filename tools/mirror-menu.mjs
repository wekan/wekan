import { repositoryArchive, organization, repository } from './mirror-repository.mjs';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { loadOrganizations, saveOrganizations } from './mirror-organizations.mjs';
import { forges, loadSettings, saveSettings } from './mirror-settings.mjs';
import { root, command, cliApi, httpJson, activeMirrors } from './mirror-active-forges.mjs';

function currentSettings(directory) {
  const registry = path.join(directory, 'releases/mirror.sh');
  return loadSettings(directory, fs.existsSync(registry) ? activeMirrors(fs.readFileSync(registry, 'utf8')).map(m => m.name) : undefined);
}

export function changeSource(settings, source) {
  if (!Object.hasOwn(forges, source)) throw new Error('Unknown source');
  return { source, mirrors: [...new Set([...settings.mirrors, settings.source])].filter(m => m !== source) };
}

// All external commands are injectable: tests never contact or write to a forge.
export function streamCommand(tool, args, input, options = {}) {
  return new Promise((resolve, reject) => {
    // Only the running Node executable and the fixed Unix wrapper interpreter
    // are needed. Checkout paths always remain arguments, never shell source.
    if (tool !== process.execPath && tool !== 'bash') throw new Error('Unsupported mirror executable');
    const spawnOptions = { ...options, shell: false, windowsHide: true, stdio: ['ignore', 'inherit', 'inherit'] };
    const child = tool === 'bash' ? spawn('bash', args, spawnOptions) : spawn(process.execPath, args, spawnOptions);
    child.once('error', reject);
    child.once('close', (code, signal) => code === 0 ? resolve('') : reject(new Error(`Mirror command failed (${signal || code})`)));
  });
}

export async function sync(settings, { preview = false, run = streamCommand, directory = root, log = console.log, platform = process.platform, environment = {}, sourceSnapshotFile, heartbeatMs = 15000 } = {}) {
  if (!settings.mirrors.length) throw new Error('No active destination mirrors. Select mirrors first.');
  const temporary = path.join(directory, '.tools/tmp');
  fs.mkdirSync(temporary, { recursive: true });
  const work = fs.mkdtempSync(path.join(temporary, 'mirror-menu-'));
  const engine = path.join(directory, 'tools/mirror-active-forges.mjs');
  const base = repositoryArchive(directory, environment.WEKAN_MIRROR_REPOSITORY || repository, environment.WEKAN_MIRROR_ORGANIZATION || organization, 'github.com');
  const progressFile = path.join(base, 'sync-progress.json');
  const durableSnapshot = path.join(base, 'source-manifest.json');
  const track = settings.source === 'github' && !preview;
  const identity = JSON.stringify({source:settings.source,mirrors:settings.mirrors});
  const prior = track && fs.existsSync(progressFile) ? JSON.parse(fs.readFileSync(progressFile, 'utf8')) : undefined;
  const resume = prior?.version === 1 && prior.identity === identity && !prior.complete;
  const progress = resume ? prior : {version:1,identity,sourceReady:false,archiveDone:false,targetsDone:[],complete:false};
  let snapshot = resume && progress.sourceReady && fs.existsSync(durableSnapshot) ? durableSnapshot : sourceSnapshotFile || path.join(work, 'source.json');
  const saveProgress = () => {
    if (!track) return;
    fs.mkdirSync(base, {recursive:true});
    const incoming = `${progressFile}.incoming-${process.pid}`;
    fs.writeFileSync(incoming, JSON.stringify(progress,null,2)+'\n'); fs.renameSync(incoming,progressFile);
  };
  const execute = async (tool, args) => {
    const started = Date.now();
    const timer = setInterval(() => log(`[mirror] Still running this stage (${Math.floor((Date.now() - started) / 1000)} seconds elapsed)`), heartbeatMs);
    try {
      const output = await run(tool, args, undefined, { env: { ...process.env, ...environment } });
      if (output) log(output.trimEnd());
    } finally { clearInterval(timer); }
  };
  let failed = false;
  try {
    log(`[mirror] ${preview ? 'Checking' : 'Starting sync'} from ${forges[settings.source].name} to ${settings.mirrors.map(m => forges[m].name).join(', ')}`);
    saveProgress();
    log(`[mirror] Reading source issues, pull requests, comments and releases`);
    if (resume && progress.sourceReady && snapshot === durableSnapshot) log('[mirror] Resuming saved source snapshot; completed collection is reused');
    else if (!sourceSnapshotFile) await execute(process.execPath, [engine, '--source', settings.source, '--export-source', snapshot, ...(settings.source === 'github' ? ['--incremental', ...(preview ? ['--cache-only'] : [])] : [])]);
    progress.sourceReady = fs.existsSync(durableSnapshot); saveProgress();
    log('[mirror] Updating local archive and static pages');
    try { if (!progress.archiveDone) await execute(process.execPath, [engine, '--source', settings.source, '--archive-only', ...(preview ? [] : ['--apply']), '--snapshot', snapshot]); progress.archiveDone = true; saveProgress(); }
    catch (error) { failed = true; log(`[archive] failed: ${error.message}`); }
    for (const target of settings.mirrors) {
      if (progress.targetsDone.includes(target)) { log(`[mirror] ${forges[target].name}: already completed; skipping`); continue; }
      log(`[mirror] ${preview ? 'Checking' : 'Syncing'} ${forges[target].name}`);
      try {
        const args = [...(preview ? ['--preview'] : []), '--source', settings.source, '--snapshot', snapshot, '--skip-archive'];
        if (platform === 'win32') {
          // Native batches require cmd.exe, which parses paths as commands.
          // Run their existing engine with the same flags as separate argv.
          await execute(process.execPath, [engine, '--target', target, '--code', ...(preview ? [] : ['--apply']), ...args.filter(arg => arg !== '--preview')]);
        } else await execute('bash', [path.join(directory, `releases/mirror-${target}.sh`), ...args]);
        progress.targetsDone.push(target); saveProgress();
      } catch (error) { failed = true; log(`[${target}] failed: ${error.message}`); }
    }
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
  progress.complete = !failed; saveProgress();
  log(`[mirror] ${failed ? 'Finished with failures' : 'Finished successfully'}`);
  return !failed;
}

export async function checkOnline(settings, { run = command, api = cliApi, http = httpJson, log = console.log } = {}) {
  let online = true;
  for (const name of [settings.source, ...settings.mirrors]) {
    const errors = [];
    try { run('git', ['ls-remote', '--symref', forges[name].git, 'HEAD']); } catch (e) { errors.push(`Git access: ${e.message}`); }
    try {
      if (name === 'sourceforge') await http('https://sourceforge.net/rest/p/wekan');
      else await api(name, name === 'gitlab' ? 'projects/wekan%2Fwekan' : 'repos/wekan/wekan');
    } catch (e) { errors.push(`API access: ${e.message}`); }
    log(`${forges[name].name} (${name === settings.source ? 'source' : 'mirror'}): ${errors.length ? errors.join('; ') : 'Git and API accessible'}`);
    if (errors.length) online = false;
  }
  return online;
}

export function checkGitMissing(settings, { run = command, directory = root, log = console.log } = {}) {
  const temporary = path.join(directory, '.tools/tmp');
  fs.mkdirSync(temporary, { recursive: true });
  const work = fs.mkdtempSync(path.join(temporary, 'mirror-check-'));
  let complete = true;
  try {
    run('git', ['init', '--bare', work]);
    run('git', ['-C', work, 'fetch', '--no-tags', forges[settings.source].git, '+refs/heads/*:refs/check/source/heads/*', '+refs/tags/*:refs/check/source/tags/*']);
    const refs = run('git', ['-C', work, 'for-each-ref', '--format=%(refname)', 'refs/check/source/']).trim().split('\n').filter(Boolean);
    for (const mirror of settings.mirrors) {
      try {
        run('git', ['-C', work, 'fetch', '--no-tags', forges[mirror].git, `+refs/heads/*:refs/check/${mirror}/heads/*`, `+refs/tags/*:refs/check/${mirror}/tags/*`]);
        for (const source of refs) {
          const target = source.replace('/source/', `/${mirror}/`);
          let present = true;
          try { run('git', ['-C', work, 'rev-parse', '--verify', target]); } catch { present = false; }
          if (!present) { log(`[${mirror}] missing ${source.replace('refs/check/source/', '')}`); continue; }
          if (source.includes('/tags/')) {
            if (run('git', ['-C', work, 'rev-parse', source]).trim() !== run('git', ['-C', work, 'rev-parse', target]).trim()) log(`[${mirror}] different tag ${source.split('/tags/')[1]}`);
          } else {
            const count = run('git', ['-C', work, 'rev-list', '--count', source, '--not', target]).trim();
            if (count !== '0') log(`[${mirror}] ${source.split('/heads/')[1]}: ${count} source commits missing`);
          }
        }
        log(`[${mirror}] Git comparison complete`);
      } catch (e) { complete = false; log(`[${mirror}] Git comparison failed: ${e.message}`); }
    }
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
  return complete;
}

export async function checkMissing(settings, options = {}) {
  const log = options.log || console.log;
  let git = false;
  try { git = checkGitMissing(settings, options); } catch (e) { log(`Git comparison failed: ${e.message}`); }
  const data = await sync(settings, { ...options, preview: true });
  return git && data;
}

export async function menu({ directory = root, ask, log = console.log, synchronize = sync, online = checkOnline, missing = checkMissing, organizations = manageOrganizations, organization = async (settings) => (await import('./mirror-organization.mjs')).syncOrganization(settings,{directory}) } = {}) {
  let settings = currentSettings(directory);
  saveSettings(directory, settings);
  saveOrganizations(directory,loadOrganizations(directory));
  for (;;) {
    const registry=loadOrganizations(directory);
    log(`\nSelected GitHub organization: ${registry.selected || 'none'}\nSource: ${forges[settings.source].name}; mirrors: ${settings.mirrors.map(m => forges[m].name).join(', ') || 'none'}\nSettings: ${path.join(directory, '.tools/mirror/settings.txt')}\n1. Sync newest data from source to destination mirrors\n2. Select source\n3. Select what mirrors are active\n4. Check whether source and mirrors are online\n5. Check where data is not mirrored yet\n6. Exit\n7. Mirror all repositories of selected GitHub organization\n8. Add, edit, remove or select organizations`);
    const choice = await ask('Choice: ');
    if (choice === null || choice === '6') return;
    try {
      if (choice === '8') await organizations({directory,ask,log});
      else if (choice === '7') await organization(settings);
      else if (choice === '1') await synchronize(settings);
      else if (choice === '4') await online(settings);
      else if (choice === '5') await missing(settings);
      else if (choice === '2') {
        const names = Object.keys(forges);
        log(names.map((n, i) => `${i + 1}. ${forges[n].name}`).join('\n'));
        const answer = await ask('Source (blank cancels): ');
        if (answer === null) return;
        if (!answer.trim()) continue;
        const source = names[Number(answer) - 1];
        settings = changeSource(settings, source); saveSettings(directory, settings);
      } else if (choice === '3') {
        const names = Object.keys(forges).filter(n => n !== settings.source);
        log(names.map((n, i) => `${i + 1}. [${settings.mirrors.includes(n) ? 'x' : ' '}] ${forges[n].name}`).join('\n'));
        const answer = await ask('Active numbers separated by commas; none disables all; blank cancels: ');
        if (answer === null) return;
        if (!answer.trim()) continue;
        const mirrors = answer.trim() === 'none' ? [] : answer.split(',').map(n => names[Number(n.trim()) - 1]);
        saveSettings(directory, { source: settings.source, mirrors }); settings = loadSettings(directory);
      } else log('Select an option from 1 to 8.');
    } catch (e) { log(`Failed: ${e.message}`); }
    finally {
      if (['1', '4', '5', '7'].includes(choice) && process.env.WEKAN_MIRROR_LOG_FILE) log(`Mirror log: ${process.env.WEKAN_MIRROR_LOG_FILE}`);
    }
  }
}

export async function main(args = process.argv.slice(2)) {
  if (args.length > 1) throw new Error('Expected one mirror operation');
  const settings = currentSettings(root);
  if (args[0] === '--help' || args[0] === '-h') { console.log('mirror.sh / mirror.bat [--sync | --preview | --check-online | --check-missing | --sync-organization | --preview-organization]\nWithout arguments: interactive menu. Settings: .tools/mirror/settings.txt.'); return; }
  if (args[0] === '--sync-organization' || args[0] === '--preview-organization') { if (!await (await import('./mirror-organization.mjs')).syncOrganization(settings,{preview:args[0] === '--preview-organization'})) process.exitCode=1; return; }
  if (args[0] === '--sync') { if (!await sync(settings)) process.exitCode = 1; return; }
  if (args[0] === '--preview' || args[0] === '--check-missing') { if (!await checkMissing(settings)) process.exitCode = 1; return; }
  if (args[0] === '--check-online') { if (!await checkOnline(settings)) process.exitCode = 1; return; }
  if (args.length) throw new Error(`Unknown mirror operation: ${args[0]}`);
  const input = createInterface({ input: process.stdin, output: process.stdout });
  let closed = false; input.on('close', () => { closed = true; });
  try { await menu({ ask: async prompt => { if (closed) return null; try { return (await input.question(prompt)).trim(); } catch { return null; } } }); }
  finally { input.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });

export async function manageOrganizations({directory=root,ask,log=console.log}={}) {
  const {loadOrganizations,saveOrganizations,setOrganization,removeOrganization}=await import('./mirror-organizations.mjs');
  let value=loadOrganizations(directory);saveOrganizations(directory,value);
  for (;;) {
    log(`Organizations: ${value.organizations.map((o,i)=>`${i+1}. ${o.source}${o.source===value.selected?' (selected)':''}`).join('; ') || 'none'}\n1. Select organization\n2. Add organization\n3. Edit organization\n4. Remove organization (keep archived files)\n5. Back`);
    const choice=await ask('Organization action: ');if(choice===null||choice==='5')return;
    try {
      let item;
      if (['1','3','4'].includes(choice)) {
        const answer=await ask('Organization number: ');if(answer===null)return;
        item=value.organizations[Number(answer)-1];if(!item)throw Error('Invalid organization number');
        if(choice==='1'){value.selected=item.source;saveOrganizations(directory,value);continue;}
        if(choice==='4'){value=removeOrganization(value,item.source);saveOrganizations(directory,value);continue;}
      } else if(choice!=='2')throw Error('Select an action from 1 to 5');
      const answer=await ask(`GitHub source organization${item?` [${item.source}]`:''}: `);if(answer===null)return;
      const source=answer.trim()||item?.source;if(!source)throw Error('Source organization is required');
      const destinations={};
      for(const kind of ['gitlab','codeberg','sourceforge']){
        const fallback=item?.destinations[kind] || source;
        const answer=await ask(`${kind} destination organization/project [${fallback}]: `);if(answer===null)return;destinations[kind]=answer.trim()||fallback;
      }
      value=setOrganization(value,{source,destinations},item?.source);saveOrganizations(directory,value);
    }catch(error){log(`Failed: ${error.message}`);}
  }
}
