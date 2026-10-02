'use strict';

// The optional Litestream engine of continuous backup
// (docs/Backup/Continuous-Backup.md). Litestream (Apache-2.0) is not bundled:
// WeKan runs it only when an administrator chose it and gave the path of a
// binary they installed. WeKan writes its configuration, starts
// `litestream replicate`, restarts it when it exits, and keeps its last lines
// of output for the pane. Restores use `litestream restore` by hand.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { writeAtomic } = require('./store');

// YAML scalars are written double-quoted with escapes, so a path or URL can
// never add a key of its own.
const quote = value => JSON.stringify(String(value));
// One replica per database file. The replica URL names a place; each file
// gets its own path below it.
function litestreamConfig(files, replicaUrl) {
  const base = replicaUrl.replace(/\/+$/, '');
  const lines = ['dbs:'];
  for (const file of files) {
    lines.push(`  - path: ${quote(file)}`, '    replicas:', `      - url: ${quote(`${base}/${path.basename(file, '.sqlite')}`)}`);
  }
  return `${lines.join('\n')}\n`;
}

class LitestreamEngine {
  constructor({ binary, files, replicaUrl, target, onError = () => {}, spawnProcess = spawn }) {
    Object.assign(this, { binary, files, replicaUrl, target, onError, spawnProcess });
    this.output = [];
    this.stats = { starts: 0, exits: 0, lastExitCode: null, running: false };
    this.stopped = false;
  }
  static available(binary) {
    try { return !!binary && path.isAbsolute(binary) && fs.statSync(binary).isFile(); } catch (error) { return false; }
  }
  async start() {
    this.config = path.join(this.target, 'litestream.yml');
    await writeAtomic(this.config, litestreamConfig(this.files, this.replicaUrl));
    this.launch();
    return this;
  }
  launch() {
    if (this.stopped) return;
    // No shell: the binary and its arguments are passed as they are.
    const child = this.spawnProcess(this.binary, ['replicate', '-config', this.config], { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    this.child = child; this.stats.starts += 1; this.stats.running = true;
    const keep = data => {
      this.output.push(...String(data).split('\n').filter(Boolean));
      this.output.splice(0, Math.max(0, this.output.length - 50));
    };
    child.stdout?.on('data', keep); child.stderr?.on('data', keep);
    child.on('error', error => this.onError(error));
    child.on('exit', code => {
      this.stats.running = false; this.stats.exits += 1; this.stats.lastExitCode = code;
      if (this.stopped) return;
      this.onError(new Error(`Litestream exited with code ${code}`));
      // Restart, more slowly the more often it fails.
      const delay = Math.min(1000 * 2 ** Math.min(this.stats.exits, 6), 60000);
      this.restart = setTimeout(() => this.launch(), delay);
    });
  }
  async stop() {
    this.stopped = true;
    clearTimeout(this.restart);
    if (this.child && this.stats.running) {
      const exited = new Promise(resolve => this.child.once('exit', resolve));
      this.child.kill('SIGTERM');
      await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 10000))]);
    }
  }
  status() { return { engine: 'litestream', files: this.files.map(f => path.basename(f)), output: this.output.slice(-10), ...this.stats }; }
}

module.exports = { LitestreamEngine, litestreamConfig };
