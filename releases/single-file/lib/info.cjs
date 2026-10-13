'use strict';

// "Version info": what Admin Panel -> Settings -> Version shows, as text
// lines, read without logging in and whether or not WeKan is running. The
// same groups in the same order - what this IS (version, packaging), the
// operating system, the runtime, the database - plus where its files are.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function bytes(n) {
  if (!Number.isFinite(n)) return 'unknown';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${i === 0 ? v : v.toFixed(1)} ${units[i]}`;
}

function duration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d} days`);
  if (h) parts.push(`${h} hours`);
  if (m) parts.push(`${m} minutes`);
  parts.push(`${s % 60} seconds`);
  return parts.join(', ');
}

function dirSize(dir, fsImpl = fs) {
  let total = 0;
  let files = 0;
  const walk = d => {
    let entries = [];
    try {
      entries = fsImpl.readdirSync(d, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) {
        try {
          total += fsImpl.statSync(p).size;
          files += 1;
        } catch (err) {
          // removed while counting
        }
      }
    }
  };
  walk(dir);
  return { bytes: total, files };
}

/**
 * @param {object} o
 * @param {object} o.manifest single-file.json
 * @param {object} o.layout paths.layout()
 * @param {object|null} o.running the pid file of a running WeKan, or null
 * @param {{version: string, commit: string}} [o.ferretdb]
 * @param {object} [o.osImpl] os, or a fake one
 */
function versionLines({ manifest, layout, running, ferretdb, osImpl = os, now = Date.now(), fsImpl = fs }) {
  const cpus = osImpl.cpus() || [];
  const load = osImpl.loadavg().map(n => n.toFixed(2)).join(', ');
  const db = dirSize(layout.db, fsImpl);
  const att = dirSize(layout.attachments, fsImpl);
  const lines = [
    ['WeKan version', manifest.version],
    ['Package', 'single-file'],
    ['Platform', manifest.target],
    ['Built', manifest.built || 'unknown'],
    ['', ''],
    ['OS type', osImpl.type()],
    ['OS platform', osImpl.platform()],
    ['OS arch', osImpl.arch()],
    ['OS release', osImpl.release()],
    ['OS uptime', duration(osImpl.uptime())],
    ['OS load average', load],
    ['OS total memory', bytes(osImpl.totalmem())],
    ['OS free memory', bytes(osImpl.freemem())],
    ['OS CPU count', `${cpus.length}${cpus[0] ? ` x ${cpus[0].model.trim()}` : ''}`],
    ['', ''],
    ['Node.js version', (manifest.node || process.version).replace(/^v/, '')],
    ['Meteor version', manifest.meteor || 'unknown'],
    ['WeKan server', running ? `running, pid ${running.pid}, for ${duration((now - Date.parse(running.started)) / 1000)}` : 'stopped'],
    ['Address', running ? running.rootUrl : 'not running'],
    ['', ''],
    ['Database type', 'FerretDB'],
    ['FerretDB version', ferretdb ? ferretdb.version : 'unknown'],
    ['FerretDB commit', ferretdb ? ferretdb.commit : 'unknown'],
    ['Storage engine', 'SQLite'],
    ['Reactivity', 'polling'],
    ['Database size', bytes(db.bytes)],
    ['Attachments', `${att.files} files, ${bytes(att.bytes)}`],
    ['', ''],
    ['Executable', layout.exePath],
    ['WRITABLE_PATH', layout.writable],
  ];
  const width = Math.max(...lines.map(([k]) => k.length));
  return lines.map(([k, v]) => (k ? `${k.padEnd(width)} : ${v}` : ''));
}

module.exports = { bytes, duration, dirSize, versionLines };
