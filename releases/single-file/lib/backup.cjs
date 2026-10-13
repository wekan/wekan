'use strict';

// "Backup": a copy of everything WeKan keeps - the database, attachments,
// avatars and wekan.env - in wekan-files/backup/YYYY-MM-DD_HH-MM-SS, local
// time. A running WeKan is stopped for the copy and started again after it,
// because a SQLite database copied while FerretDB writes to it is not a
// backup anyone can rely on.
//
// Restoring is copying the directories back, with WeKan stopped.

const fs = require('node:fs');
const path = require('node:path');

// What a backup holds, relative to wekan-files. bin, logs, run, versions and
// earlier backups are not data.
const BACKUP_PARTS = ['db', 'attachments', 'avatars', 'wekan.env'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function backupName(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function backupTo(layout, { date = new Date(), fsImpl = fs } = {}) {
  let dest = path.join(layout.backup, backupName(date));
  // Two backups in the same second get -2, -3 ... instead of mixing.
  for (let n = 2; fsImpl.existsSync(dest); n += 1) dest = path.join(layout.backup, `${backupName(date)}-${n}`);
  fsImpl.mkdirSync(dest, { recursive: true });
  const copied = [];
  for (const part of BACKUP_PARTS) {
    const from = path.join(layout.files, part);
    if (!fsImpl.existsSync(from)) continue;
    fsImpl.cpSync(from, path.join(dest, part), {
      recursive: true,
      // The database directory holds sqlite-recovery's own rotating
      // snapshots; a backup of the backups doubles the size for nothing.
      filter: src => !(part === 'db' && path.relative(from, src).split(path.sep)[0] === 'backup'),
    });
    copied.push(part);
  }
  return { dest, copied };
}

function listBackups(layout, fsImpl = fs) {
  try {
    return fsImpl.readdirSync(layout.backup)
      .filter(n => /^\d{4}-\d\d-\d\d_\d\d-\d\d-\d\d(-\d+)?$/.test(n))
      .sort()
      .reverse();
  } catch (e) {
    return [];
  }
}

module.exports = { BACKUP_PARTS, backupName, backupTo, listBackups };
