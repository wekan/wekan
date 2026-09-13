import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
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
export async function sync(settings, { preview = false, run = command, directory = root, log = console.log, platform = process.platform } = {}) {
  if (!settings.mirrors.length) throw new Error('No active destination mirrors. Select mirrors first.');
  const temporary = path.join(directory, '.tools/tmp');
  fs.mkdirSync(temporary, { recursive: true });
  const work = fs.mkdtempSync(path.join(temporary, 'mirror-menu-'));
  const engine = path.join(directory, 'tools/mirror-active-forges.mjs');
  const snapshot = path.join(work, 'source.json');
  const execute = (tool, args) => { const output = run(tool, args); if (output) log(output.trimEnd()); };
  let failed = false;
  try {
    execute(process.execPath, [engine, '--source', settings.source, '--export-source', snapshot]);
    execute(process.execPath, [engine, '--source', settings.source, '--archive-only', ...(preview ? [] : ['--apply']), '--snapshot', snapshot]);
    for (const target of settings.mirrors) {
      try {
        const args = [...(preview ? ['--preview'] : []), '--source', settings.source, '--snapshot', snapshot, '--skip-archive'];
        if (platform === 'win32') {
          const batch = path.join(directory, `releases/mirror-${target}.bat`);
          const parts = [batch, ...args];
          if (parts.some(p => /["%!\r\n]/.test(p))) throw new Error('Unsupported command characters in checkout path');
          execute('cmd.exe', ['/d', '/s', '/c', `call ${parts.map(p => `"${p}"`).join(' ')}`]);
        } else execute('bash', [path.join(directory, `releases/mirror-${target}.sh`), ...args]);
      } catch (error) { failed = true; log(`[${target}] failed: ${error.message}`); }
    }
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
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

export async function menu({ directory = root, ask, log = console.log, synchronize = sync, online = checkOnline, missing = checkMissing } = {}) {
  let settings = currentSettings(directory);
  saveSettings(directory, settings);
  for (;;) {
    log(`\nSource: ${forges[settings.source].name}; mirrors: ${settings.mirrors.map(m => forges[m].name).join(', ') || 'none'}\nSettings: ${path.join(directory, '.tools/mirror/settings.txt')}\n1. Sync newest data from source to destination mirrors\n2. Select source\n3. Select what mirrors are active\n4. Check whether source and mirrors are online\n5. Check where data is not mirrored yet\n6. Exit`);
    const choice = await ask('Choice: ');
    if (choice === null || choice === '6') return;
    try {
      if (choice === '1') await synchronize(settings);
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
      } else log('Select an option from 1 to 6.');
    } catch (e) { log(`Failed: ${e.message}`); }
  }
}

export async function main(args = process.argv.slice(2)) {
  if (args.length > 1) throw new Error('Expected one mirror operation');
  const settings = currentSettings(root);
  if (args[0] === '--help' || args[0] === '-h') { console.log('mirror.sh / mirror.bat [--sync | --preview | --check-online | --check-missing]\nWithout arguments: interactive menu. Settings: .tools/mirror/settings.txt.'); return; }
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
