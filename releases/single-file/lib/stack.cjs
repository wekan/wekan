'use strict';

// `wekan start`: FerretDB and WeKan, together, in a restart loop - what
// releases/ferretdb/start-wekan.sh's loop does, run by the executable itself:
//
//   1. verified SQLite recovery while the database is at rest
//      (sqlite-recovery.mjs, run by this same executable);
//   2. a requested restore (restore.cjs);
//   3. FerretDB, from its verified copy in wekan-files/bin;
//   4. the recovery page, while a recovery is still being finished;
//   5. WeKan's server, this executable again in its server role;
//   6. when WeKan exits: FerretDB is stopped and both start again 3 s later.
//
// Ctrl-C, SIGTERM, `wekan stop` and the menu's Stop end both and remove
// wekan-files/run/wekan.pid.

const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { ENV_TEMPLATE, buildEnv, readEnvFile } = require('./config.cjs');
const { ensureFerretdb, ferretdbArgs } = require('./ferretdb.cjs');
const { requestedRestore } = require('./restore.cjs');
const { running } = require('./status.cjs');
const { SUBDIRS } = require('./paths.cjs');

const LOG_ROTATE_BYTES = 10 * 1024 * 1024;

function prepareDirs(layout, fsImpl = fs) {
  for (const name of SUBDIRS) fsImpl.mkdirSync(layout[name], { recursive: true });
  if (!fsImpl.existsSync(layout.envFile)) fsImpl.writeFileSync(layout.envFile, ENV_TEMPLATE);
}

function rotateLog(file, fsImpl = fs) {
  try {
    if (fsImpl.statSync(file).size > LOG_ROTATE_BYTES) fsImpl.renameSync(file, `${file}.1`);
  } catch (e) {
    // no log yet
  }
}

function readManifest(appRoot) {
  return JSON.parse(fs.readFileSync(path.join(appRoot, 'single-file.json'), 'utf8'));
}

function selfCommand(ctx, role, args, env) {
  return { cmd: ctx.self[0], args: [...ctx.self.slice(1), ...args], env: { ...env, WEKAN_SINGLE_FILE_ROLE: role } };
}

async function runStack(ctx, layout, { log = console.log, once = false } = {}) {
  const already = running(layout);
  if (already) throw new Error(`WeKan is already running (pid ${already.pid}) at ${already.rootUrl}.`);
  prepareDirs(layout);
  const manifest = readManifest(ctx.appRoot);
  const cfg = buildEnv({ file: readEnvFile(layout), layout, version: manifest.version, target: manifest.target });
  for (const note of cfg.notes) log(`WeKan: ${note}`);
  const { env } = cfg;
  log(`WeKan memory budget: Node ${cfg.budget.heapMb} MiB; FerretDB Go ${cfg.budget.goMb} MiB; available ${cfg.budget.memoryMb} MiB.`);
  const ferretdb = cfg.useFerret ? ensureFerretdb({ appRoot: ctx.appRoot, manifest, binDir: layout.bin }) : null;

  fs.writeFileSync(layout.pidFile, JSON.stringify({
    pid: process.pid, started: new Date().toISOString(), version: manifest.version,
    port: cfg.port, rootUrl: cfg.rootUrl, exe: ctx.exePath,
  }));
  let stopping = false;
  let ferret = null;
  let server = null;
  const killChild = child => {
    if (child && child.exitCode === null && child.signalCode === null) {
      try {
        child.kill('SIGTERM');
      } catch (e) {
        // exited meanwhile
      }
    }
  };
  const finish = () => {
    stopping = true;
    killChild(server);
    killChild(ferret);
  };
  process.on('SIGINT', finish);
  process.on('SIGTERM', finish);
  if (process.platform !== 'win32') process.on('SIGHUP', finish);

  try {
    while (!stopping) {
      if (ferretdb) {
        const recovery = selfCommand(ctx, 'script', ['releases/ferretdb/sqlite-recovery.mjs', 'startup', layout.db, ferretdb], env);
        const rec = spawnSync(recovery.cmd, recovery.args, { env: recovery.env, stdio: 'inherit', cwd: layout.files, windowsHide: true });
        if (rec.status !== 0) {
          throw new Error(`Recovery could not produce a verified SQLite database (status ${rec.status}).`);
        }
        requestedRestore({ dbDir: layout.db, env, log });
        log(`Starting bundled FerretDB v1 (SQLite) on ${cfg.ferretAddr} (data: ${layout.db}) ...`);
        ferret = spawn(ferretdb, ferretdbArgs(layout.db, cfg.ferretAddr), { env, stdio: 'inherit', cwd: layout.files, windowsHide: true });
      } else {
        log(`Using external database at ${cfg.mongoUrl} (not starting bundled FerretDB).`);
      }

      const inProgress = path.join(layout.db, 'RECOVERY_IN_PROGRESS');
      if (fs.existsSync(inProgress)) {
        const grace = Number(env.WEKAN_RECOVERY_BRIDGE_SECONDS || 20);
        log(`Recovery in progress: bridging with the recovery page for up to ${grace}s before starting WeKan.`);
        const bridge = selfCommand(ctx, 'script', ['releases/ferretdb/recovery-bridge.mjs'], { ...env, PRODUCT_NAME: env.PRODUCT_NAME || 'WeKan' });
        const page = spawn(bridge.cmd, bridge.args, { env: bridge.env, stdio: 'inherit', cwd: layout.files, windowsHide: true });
        for (let waited = 0; waited < grace && fs.existsSync(inProgress) && !stopping; waited += 2) {
          await new Promise(r => setTimeout(r, 2000));
        }
        killChild(page);
      }

      if (stopping) break;
      log(`Starting WeKan ${manifest.version} on ${cfg.rootUrl} (port ${cfg.port}), files under ${layout.files} ...`);
      const srv = selfCommand(ctx, 'server', [], env);
      server = spawn(srv.cmd, srv.args, { env: srv.env, stdio: 'inherit', cwd: layout.files, windowsHide: true });
      const code = await new Promise(resolve => server.on('exit', (c, s) => resolve(s || c)));
      killChild(ferret);
      if (ferret) await new Promise(resolve => (ferret.exitCode !== null || ferret.signalCode !== null ? resolve() : ferret.on('exit', resolve)));
      ferret = null;
      server = null;
      if (stopping || once) {
        if (once && !stopping) log(`WeKan exited (${code}).`);
        break;
      }
      log(`WeKan exited (${code}); restarting in 3 seconds... (Ctrl-C to stop)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  } finally {
    finish();
    try {
      const info = JSON.parse(fs.readFileSync(layout.pidFile, 'utf8'));
      if (info.pid === process.pid) fs.rmSync(layout.pidFile, { force: true });
    } catch (e) {
      // removed by `wekan stop`
    }
  }
  return 0;
}

/** Starts `wekan start` detached, logging to wekan-files/logs/wekan.log. */
function startBackground(ctx, layout) {
  prepareDirs(layout);
  rotateLog(layout.logFile);
  const out = fs.openSync(layout.logFile, 'a');
  const env = { ...process.env };
  delete env.WEKAN_SINGLE_FILE_ROLE;
  const child = spawn(ctx.self[0], [...ctx.self.slice(1), 'start'], {
    detached: true, stdio: ['ignore', out, out], cwd: layout.files, env, windowsHide: true,
  });
  child.unref();
  fs.closeSync(out);
  return child.pid;
}

module.exports = { prepareDirs, rotateLog, readManifest, runStack, startBackground, LOG_ROTATE_BYTES };
