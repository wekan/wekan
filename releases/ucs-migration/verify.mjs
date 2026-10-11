import fs from 'node:fs';
import path from 'node:path';

export function assertComplete(status) {
  if (status?.success !== true || status.phase !== 'completed' || !status.finishedAt ||
      !Array.isArray(status.errors) || status.errors.length ||
      !status.collections || !Object.keys(status.collections).length) {
    throw new Error('Incomplete migration; refusing UCS upgrade');
  }
  for (const [name, value] of Object.entries(status.collections)) {
    if (!Number.isInteger(value.total) || value.total < 0 || value.done !== value.total) {
      throw new Error(`Incomplete collection: ${name}`);
    }
  }
}

export function verifyFile(version, root, stat = fs.statSync) {
  if (version.meta?.gridFsFileId || version.storage === 'gridfs') throw new Error('Unmigrated GridFS reference');
  if (version.storage !== 'fs' || typeof version.path !== 'string') throw new Error('Missing filesystem version');
  const relative = path.relative(root, version.path);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('File outside persistent volume');
  const info = stat(version.path);
  if (!info.isFile() || !Number.isFinite(version.size) || info.size !== version.size) throw new Error('Missing or truncated file');
}

export async function verifyFiles(db, writablePath = process.env.WRITABLE_PATH || '/data') {
  for (const bucket of ['attachments', 'avatars']) {
    for await (const record of db.collection(bucket).find({})) {
      if (!record.versions?.original) throw new Error(`Missing original version: ${bucket}/${record._id}`);
      for (const version of Object.values(record.versions)) verifyFile(version, path.resolve(writablePath, 'files', bucket));
    }
  }
}
