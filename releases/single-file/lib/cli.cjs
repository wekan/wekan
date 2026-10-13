'use strict';

// The single file's commands and its menu.
//
//   wekan                  the menu (in a terminal); `start` otherwise
//   wekan start            run WeKan here, in the foreground (Ctrl-C stops)
//   wekan start --background
//   wekan stop | status | version | log
//   wekan versions         versions that can be installed
//   wekan update           the newest version
//   wekan use <version>    another version, newer or older
//   wekan backup
//   wekan autostart install | remove | status
//   wekan set PORT 8080    a setting in wekan-files/wekan.env
//
// Everything the menu does is one of these commands, so an administrator
// without a terminal menu (ssh, a script, Task Scheduler) can do all of it.

const fs = require('node:fs');
const readline = require('node:readline/promises');
const { layout: makeLayout } = require('./paths.cjs');
const stack = require('./stack.cjs');
const status = require('./status.cjs');
const info = require('./info.cjs');
const backup = require('./backup.cjs');
const releases = require('./releases.cjs');
const autostart = require('./autostart.cjs');
const { ferretdbVersion, ensureFerretdb } = require('./ferretdb.cjs');
const { buildEnv, readEnvFile, setEnvValue, ENV_TEMPLATE } = require('./config.cjs');

const HELP = `Usage: wekan [command]

  (none)                  the menu, when started in a terminal
  start [--background]    start WeKan (foreground unless --background)
  stop                    stop WeKan
  status                  what is running, and where
  version                 version information, as Admin Panel / Version
  versions                versions that can be installed
  update                  update to the newest version
  use <version>           change to another version, newer or older
  backup                  back up wekan-files to wekan-files/backup/<date_time>
  autostart install|remove|status
                          run WeKan automatically at boot
  log                     the last lines of wekan-files/logs/wekan.log
  set <KEY> <value>       a setting in wekan-files/wekan.env (e.g. PORT 8080)
  help                    this text
`;

function makeCtx(ctx) {
  const layout = makeLayout({ exePath: ctx.exePath, env: process.env });
  const manifest = stack.readManifest(ctx.appRoot);
  return { ...ctx, layout, manifest };
}

async function cmdStatus(c, out) {
  const run = status.running(c.layout);
  out(`WeKan ${c.manifest.version} (${c.manifest.target}), single file`);
  out(`Files:     ${c.layout.files}`);
  if (!run) {
    out('Status:    stopped');
  } else {
    // Asked directly, not through ROOT_URL, which may be a proxy's address.
    const code = await status.probe(`http://127.0.0.1:${run.port}/`);
    out(`Status:    running since ${run.started}, pid ${run.pid}${run.version !== c.manifest.version ? `, version ${run.version}` : ''}`);
    out(`Address:   ${run.rootUrl} (${code ? `answers HTTP ${code}` : 'not answering yet'})`);
  }
  let auto = false;
  try {
    auto = autostart.status(c.layout);
  } catch (e) {
    auto = false;
  }
  out(`At boot:   ${auto ? `starts automatically (${autostart.method()})` : 'not started automatically'}`);
  out(`Backups:   ${backup.listBackups(c.layout).length} in ${c.layout.backup}`);
  return 0;
}

function cmdVersion(c, out) {
  let ferret = null;
  try {
    ferret = ferretdbVersion(ensureFerretdb({ appRoot: c.appRoot, manifest: c.manifest, binDir: c.layout.bin }));
  } catch (e) {
    ferret = null;
  }
  for (const line of info.versionLines({ manifest: c.manifest, layout: c.layout, running: status.running(c.layout), ferretdb: ferret })) out(line);
  return 0;
}

async function available(c, out) {
  const kept = releases.keptVersions(c.layout, c.manifest.target);
  let online = [];
  try {
    online = await releases.fetchReleases(c.manifest.target);
  } catch (e) {
    out(`Could not list the releases on GitHub: ${e.message}`);
  }
  return { kept, online };
}

async function cmdVersions(c, out) {
  const { kept, online } = await available(c, out);
  out(`Running now: ${c.manifest.version}`);
  if (kept.length) out(`Kept in ${c.layout.versions}: ${kept.map(k => k.version).join(', ')}`);
  for (const r of online) {
    const mark = r.version === c.manifest.version ? '  <- running now' : '';
    out(`  ${r.version.padEnd(8)} ${r.published.slice(0, 10)}${r.prerelease ? ' prerelease' : ''}${mark}`);
  }
  if (!online.length) out('No release on GitHub has a single file for this platform yet.');
  return 0;
}

async function changeTo(c, version, out, { confirm = async () => true } = {}) {
  if (version === c.manifest.version) {
    out(`WeKan ${version} is the version running now.`);
    return 0;
  }
  const kept = releases.keptVersions(c.layout, c.manifest.target).find(k => k.version === version);
  let file = kept ? kept.file : null;
  if (!file) {
    const online = await releases.fetchReleases(c.manifest.target);
    const rel = online.find(r => r.version === version);
    if (!rel) {
      out(`WeKan ${version} has no single file for ${c.manifest.target}. See: wekan versions`);
      return 1;
    }
    if (releases.compareVersions(version, c.manifest.version) < 0) {
      out(`WeKan ${version} is OLDER than ${c.manifest.version}. A database the newer version has`);
      out('already upgraded may not work in the older one; a backup is made first, so you can go back.');
    }
    if (!(await confirm(`Change from ${c.manifest.version} to ${version}?`))) return 1;
    file = await releases.download(rel, c.layout, { log: out });
  } else if (!(await confirm(`Change from ${c.manifest.version} to ${version} (kept in wekan-files/versions)?`))) {
    return 1;
  }
  const wasRunning = !!status.running(c.layout);
  if (wasRunning) await status.stop(c.layout, { log: out });
  const done = backup.backupTo(c.layout);
  out(`Backed up ${done.copied.join(', ') || 'nothing yet'} to ${done.dest}`);
  const keptAs = releases.install({ layout: c.layout, newFile: file, currentVersion: c.manifest.version, target: c.manifest.target });
  out(`WeKan ${version} installed as ${c.layout.exePath}; ${c.manifest.version} kept as ${keptAs}.`);
  if (wasRunning) {
    // The NEW executable, now at the old one's path.
    const pid = stack.startBackground(c.sea ? { ...c, self: [c.layout.exePath] } : c, c.layout);
    out(`Started WeKan ${version} in the background (pid ${pid}).`);
  }
  return 0;
}

async function cmdUpdate(c, out, opts) {
  const online = await releases.fetchReleases(c.manifest.target);
  const newest = online.find(r => !r.prerelease);
  if (!newest) {
    out('No release on GitHub has a single file for this platform yet.');
    return 1;
  }
  if (releases.compareVersions(newest.version, c.manifest.version) <= 0) {
    out(`WeKan ${c.manifest.version} is the newest version.`);
    return 0;
  }
  return changeTo(c, newest.version, out, opts);
}

async function cmdBackup(c, out) {
  const wasRunning = !!status.running(c.layout);
  if (wasRunning) await status.stop(c.layout, { log: out });
  stack.prepareDirs(c.layout);
  const done = backup.backupTo(c.layout);
  out(`Backed up ${done.copied.join(', ')} to ${done.dest}`);
  if (wasRunning) out(`Started WeKan again (pid ${stack.startBackground(c, c.layout)}).`);
  return 0;
}

function cmdAutostart(c, sub, out) {
  if (sub === 'install') {
    out(`WeKan now starts at boot: ${autostart.install(c.layout, { log: out })}.`);
  } else if (sub === 'remove') {
    out(autostart.remove(c.layout) ? 'WeKan no longer starts at boot.' : 'WeKan was not set to start at boot.');
  } else {
    out(autostart.status(c.layout) ? `WeKan starts at boot (${autostart.method()}).` : 'WeKan does not start at boot.');
  }
  return 0;
}

function cmdLog(c, out, lines = 40) {
  let text = '';
  try {
    text = fs.readFileSync(c.layout.logFile, 'utf8');
  } catch (e) {
    out(`No log yet at ${c.layout.logFile}.`);
    return 0;
  }
  for (const line of text.split(/\r?\n/).slice(-lines - 1)) out(line);
  return 0;
}

function cmdSet(c, key, value, out) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key || '') || value === undefined) {
    out('Usage: wekan set <KEY> <value>');
    return 1;
  }
  stack.prepareDirs(c.layout);
  let text = ENV_TEMPLATE;
  try {
    text = fs.readFileSync(c.layout.envFile, 'utf8');
  } catch (e) {
    text = ENV_TEMPLATE;
  }
  fs.writeFileSync(c.layout.envFile, setEnvValue(text, key, value));
  out(`${key}=${value} in ${c.layout.envFile}. It takes effect when WeKan next starts.`);
  return 0;
}

async function startBackground(c, out) {
  const run = status.running(c.layout);
  if (run) {
    out(`WeKan is already running (pid ${run.pid}) at ${run.rootUrl}.`);
    return 0;
  }
  const pid = stack.startBackground(c, c.layout);
  const cfg = buildEnv({ file: readEnvFile(c.layout), layout: c.layout });
  out(`Starting WeKan in the background (pid ${pid}) at ${cfg.rootUrl}. Log: ${c.layout.logFile}`);
  return 0;
}

const MENU = [
  ['1', 'Start WeKan (in the background)'],
  ['2', 'Stop WeKan'],
  ['3', 'Status'],
  ['4', 'Version info'],
  ['5', 'Update to the newest version'],
  ['6', 'Change to another version (newer or older)'],
  ['7', 'Backup now'],
  ['8', 'Run automatically at boot: install'],
  ['9', 'Run automatically at boot: remove'],
  ['10', 'Show the log'],
  ['11', 'Settings: port and address'],
  ['12', 'Start WeKan here, in this window (Ctrl-C stops)'],
  ['0', 'Quit'],
];

async function menu(c, { input = process.stdin, output = process.stdout } = {}) {
  const rl = readline.createInterface({ input, output, terminal: !!output.isTTY });
  const out = line => output.write(`${line}\n`);
  // Lines are read through the iterator rather than rl.question(), which
  // drops lines that arrive before it asks: input piped in by a script
  // arrives all at once. The end of the input is Quit.
  const lines = rl[Symbol.asyncIterator]();
  const ask = async q => {
    output.write(q);
    const next = await lines.next();
    if (next.done) throw Object.assign(new Error('end of input'), { endOfInput: true });
    return String(next.value).trim();
  };
  const confirm = async q => /^(y|yes)$/i.test(await ask(`${q} [y/N] `));
  try {
    for (;;) {
      const run = status.running(c.layout);
      out('');
      out(`WeKan ${c.manifest.version} (${c.manifest.target}) - ${run ? `running at ${run.rootUrl}` : 'stopped'}`);
      out(`Files: ${c.layout.files}`);
      out('');
      for (const [key, label] of MENU) out(`${key.padStart(3)}) ${label}`);
      output.write('\n');
      const choice = await ask('Choose: ');
      out('');
      try {
        switch (choice) {
          case '1': await startBackground(c, out); break;
          case '2': out((await status.stop(c.layout, { log: out })) ? 'Stopped.' : 'WeKan was not running.'); break;
          case '3': await cmdStatus(c, out); break;
          case '4': cmdVersion(c, out); break;
          case '5': await cmdUpdate(c, out, { confirm }); break;
          case '6': {
            await cmdVersions(c, out);
            const v = await ask('Version to change to (empty: cancel): ');
            if (v) await changeTo(c, v, out, { confirm });
            break;
          }
          case '7': await cmdBackup(c, out); break;
          case '8': cmdAutostart(c, 'install', out); break;
          case '9': cmdAutostart(c, 'remove', out); break;
          case '10': cmdLog(c, out); break;
          case '11': {
            const cfg = buildEnv({ file: readEnvFile(c.layout), layout: c.layout });
            out(`Now: PORT=${cfg.port} ROOT_URL=${cfg.rootUrl}`);
            const port = await ask('New port (empty: keep): ');
            if (port) {
              if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) out('A port is a number from 1 to 65535.');
              else cmdSet(c, 'PORT', port, out);
            }
            const url = await ask('New address, e.g. https://wekan.example.com (empty: keep): ');
            if (url) {
              if (!/^https?:\/\/\S+$/.test(url)) out('An address starts with http:// or https://.');
              else cmdSet(c, 'ROOT_URL', url, out);
            }
            break;
          }
          case '12': rl.close(); return stack.runStack(c, c.layout);
          case '0': case 'q': case 'quit': case '': return 0;
          default: out(`No such choice: ${choice}`);
        }
      } catch (err) {
        if (err.endOfInput) throw err;
        out(`Could not do that: ${err.message}`);
      }
    }
  } catch (err) {
    if (err.endOfInput) return 0;
    throw err;
  } finally {
    rl.close();
  }
}

async function run(ctx, argv, { out = line => console.log(line), isTTY = !!(process.stdin.isTTY && process.stdout.isTTY) } = {}) {
  const c = makeCtx(ctx);
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case undefined: return isTTY ? menu(c) : stack.runStack(c, c.layout);
    case 'menu': return menu(c);
    case 'start': return rest.includes('--background') ? startBackground(c, out) : stack.runStack(c, c.layout);
    case 'stop': out((await status.stop(c.layout, { log: out })) ? 'Stopped.' : 'WeKan was not running.'); return 0;
    case 'status': return cmdStatus(c, out);
    case 'version': case '--version': case '-v': return cmdVersion(c, out);
    case 'versions': return cmdVersions(c, out);
    case 'update': return cmdUpdate(c, out, { confirm: async () => true });
    case 'use': return rest[0] ? changeTo(c, rest[0].replace(/^v/, ''), out) : (out('Usage: wekan use <version>'), 1);
    case 'backup': return cmdBackup(c, out);
    case 'autostart': return cmdAutostart(c, rest[0] || 'status', out);
    case 'log': return cmdLog(c, out, Number(rest[0]) || 40);
    case 'set': return cmdSet(c, rest[0], rest[1], out);
    case 'help': case '--help': case '-h': out(HELP); return 0;
    default: out(HELP); return 1;
  }
}

module.exports = { HELP, MENU, run, menu, changeTo };
