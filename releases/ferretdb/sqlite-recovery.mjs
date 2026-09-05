#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip, createGunzip } from 'node:zlib';
import { spawnSync } from 'node:child_process';

const SCHEMA = 1;
const RESERVE = Number(process.env.WEKAN_RECOVERY_RESERVE_BYTES || 64 * 1024 * 1024);
const MAX_LOAD_PER_CORE = Number(process.env.WEKAN_RECOVERY_MAX_LOAD_PER_CORE || 0.5);
const SNAPSHOT_AGE_MS = Number(process.env.WEKAN_RECOVERY_SNAPSHOT_HOURS || 24) * 3600 * 1000;

const shaFile = async file => {
  const hash = createHash('sha256');
  await pipeline(createReadStream(file), async function* (source) {
    for await (const chunk of source) { hash.update(chunk); yield chunk; }
  });
  return hash.digest('hex');
};

const event = async (dbDir, type, detail, severity = 'info') => {
  const row = JSON.stringify({ type, db: 'wekan', severity, source: 'startup', detail,
    ts: new Date().toISOString() });
  await fs.appendFile(path.join(dbDir, 'recovery-events.jsonl'), `${row}\n`).catch(() => {});
};

const exists = async file => fs.stat(file).then(() => true, () => false);

async function check(binary, file) {
  if (!binary || !(await exists(file))) return false;
  const result = spawnSync(binary, ['check-sqlite', file], { encoding: 'utf8', timeout: 120000 });
  return result.status === 0 && result.stdout.trim() === 'ok';
}

async function enoughSpace(dbDir, needed) {
  const stats = await fs.statfs(dbDir);
  const available = Number(stats.bavail) * Number(stats.bsize);
  return { ok: available >= needed, available, needed };
}

async function verifyGeneration(dir) {
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'));
    if (manifest.schema !== SCHEMA || manifest.file !== 'wekan.sqlite.gz') return null;
    const archive = path.join(dir, manifest.file);
    const compressed = await fs.stat(archive);
    if (compressed.size !== manifest.compressedBytes) return null;
    if (await shaFile(archive) !== manifest.compressedSha256) return null;
    return { manifest, archive };
  } catch {
    return null;
  }
}

async function unpackVerified(candidate, target) {
  const hash = createHash('sha256');
  let bytes = 0;
  await pipeline(
    createReadStream(candidate.archive),
    createGunzip(),
    async function* (source) {
      for await (const chunk of source) { bytes += chunk.length; hash.update(chunk); yield chunk; }
    },
    createWriteStream(target, { mode: 0o600 }),
  );
  if (bytes !== candidate.manifest.uncompressedBytes ||
      hash.digest('hex') !== candidate.manifest.uncompressedSha256) {
    await fs.rm(target, { force: true });
    throw new Error('uncompressed snapshot checksum or size mismatch');
  }
}

async function snapshot(dbDir, reason = 'scheduled') {
  const live = path.join(dbDir, 'wekan.sqlite');
  const stat = await fs.stat(live);
  const recovery = path.join(dbDir, '.recovery');
  const staging = path.join(recovery, `.staging-${process.pid}-${Date.now()}`);
  const latest = path.join(recovery, 'latest');
  const previous = path.join(recovery, 'previous');
  const space = await enoughSpace(dbDir, stat.size * 2 + RESERVE);
  if (!space.ok) {
    await event(dbDir, 'snapshot-deferred',
      `Insufficient disk space for verified snapshot: need ${space.needed}, available ${space.available}`,
      'warning');
    return false;
  }
  await fs.mkdir(staging, { recursive: true, mode: 0o700 });
  try {
    const archive = path.join(staging, 'wekan.sqlite.gz');
    await pipeline(createReadStream(live), createGzip({ level: 6 }), createWriteStream(archive, { mode: 0o600 }));
    const compressed = await fs.stat(archive);
    const oldLatest = await verifyGeneration(latest);
    const currentHash = await shaFile(live);
    const manifest = {
      schema: SCHEMA, file: 'wekan.sqlite.gz', createdAt: new Date().toISOString(), reason,
      source: 'wekan.sqlite', uncompressedBytes: stat.size, compressedBytes: compressed.size,
      uncompressedSha256: currentHash, compressedSha256: await shaFile(archive),
      previousUncompressedSha256: oldLatest?.manifest?.uncompressedSha256 || null,
      contentChanged: oldLatest ? oldLatest.manifest.uncompressedSha256 !== currentHash : null,
      uncompressedByteDelta: oldLatest ? stat.size - oldLatest.manifest.uncompressedBytes : null,
    };
    const probe = path.join(staging, 'verify.sqlite');
    await unpackVerified({ manifest, archive }, probe);
    await fs.rm(probe, { force: true });
    await fs.writeFile(path.join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    await fs.rm(previous, { recursive: true, force: true });
    if (await exists(latest)) await fs.rename(latest, previous);
    await fs.rename(staging, latest);
    await event(dbDir, 'snapshot-created',
      `Verified compressed snapshot created (${stat.size} -> ${compressed.size} bytes, SHA-256 ${manifest.uncompressedSha256})`);
    return true;
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    await event(dbDir, 'snapshot-failed', `Verified snapshot failed: ${error.message}`, 'error');
    return false;
  }
}

async function restore(dbDir, binary, name) {
  const dir = path.join(dbDir, '.recovery', name);
  const candidate = await verifyGeneration(dir);
  if (!candidate) return false;
  const live = path.join(dbDir, 'wekan.sqlite');
  const staging = path.join(dbDir, `.wekan.sqlite.restore-${process.pid}`);
  const space = await enoughSpace(dbDir, candidate.manifest.uncompressedBytes + RESERVE);
  if (!space.ok) {
    await event(dbDir, 'restore-failed',
      `Insufficient disk space to stage ${name}: need ${space.needed}, available ${space.available}`, 'error');
    return false;
  }
  try {
    await unpackVerified(candidate, staging);
    if (!(await check(binary, staging))) throw new Error('restored snapshot failed SQLite quick_check');
    await fs.rename(staging, live);
    await fs.rm(`${live}-wal`, { force: true });
    await fs.rm(`${live}-shm`, { force: true });
    await event(dbDir, name === 'previous' ? 'restore-prev' : 'restore-backup',
      `Automatically restored and verified ${name} snapshot`, 'warning');
    return true;
  } catch (error) {
    await fs.rm(staging, { force: true });
    await event(dbDir, 'restore-failed', `${name} snapshot rejected: ${error.message}`, 'error');
    return false;
  }
}

async function startup(dbDir, binary) {
  await fs.mkdir(dbDir, { recursive: true });
  const live = path.join(dbDir, 'wekan.sqlite');
  if (!(await exists(live))) return 0;
  if (await check(binary, live)) {
    const latest = await verifyGeneration(path.join(dbDir, '.recovery', 'latest'));
    const due = !latest || Date.now() - Date.parse(latest.manifest.createdAt) >= SNAPSHOT_AGE_MS;
    const cores = Math.max(1, os.cpus().length);
    if (due && process.env.WEKAN_SQLITE_BACKUP !== 'false' &&
        os.loadavg()[0] / cores <= MAX_LOAD_PER_CORE) await snapshot(dbDir);
    else if (due && process.env.WEKAN_SQLITE_BACKUP !== 'false') await event(dbDir, 'snapshot-deferred',
      `CPU load ${os.loadavg()[0].toFixed(2)} is above the low-load snapshot threshold`, 'warning');
    return 0;
  }
  await event(dbDir, 'corruption-detected', 'FerretDB quick_check rejected live wekan.sqlite', 'error');
  if (await restore(dbDir, binary, 'latest')) return 0;
  if (await restore(dbDir, binary, 'previous')) return 0;
  await event(dbDir, 'manual-required',
    'No verified SQLite snapshot is usable; retained MongoDB migration source is the next recovery source', 'error');
  return 3;
}

async function migrationEvidence(dbDir, sourceDir, checkpoint) {
  await fs.mkdir(dbDir, { recursive: true });
  const names = await fs.readdir(sourceDir);
  const sourceFiles = [];
  let sourceBytes = 0;
  for (const name of names.sort()) {
    if (!/^(WiredTiger|collection-|index-|sizeStorer|_mdb_catalog|storage\.bson|journal)/.test(name)) continue;
    const file = path.join(sourceDir, name);
    const stat = await fs.stat(file).catch(() => null);
    if (!stat || !stat.isFile()) continue;
    sourceBytes += stat.size;
    sourceFiles.push({ name, bytes: stat.size, mtimeMs: Math.trunc(stat.mtimeMs) });
  }
  const space = await enoughSpace(dbDir, sourceBytes + RESERVE);
  if (!space.ok) {
    await event(dbDir, 'migration-deferred',
      `Insufficient disk space for migration: need ${space.needed}, available ${space.available}`, 'error');
    return false;
  }
  const checkpointHash = checkpoint && await exists(checkpoint) ? await shaFile(checkpoint) : null;
  const manifest = { schema: SCHEMA, createdAt: new Date().toISOString(), sourceBytes,
    sourceFiles, checkpoint: checkpoint ? path.basename(checkpoint) : null, checkpointHash };
  const outDir = path.join(dbDir, '.recovery', 'migration-source');
  await fs.mkdir(outDir, { recursive: true, mode: 0o700 });
  const temp = path.join(outDir, `manifest-${process.pid}.tmp`);
  await fs.writeFile(temp, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temp, path.join(outDir, 'manifest.json'));
  await event(dbDir, 'migration-source-verified',
    `Recorded ${sourceFiles.length} MongoDB source files (${sourceBytes} bytes) and checkpoint checksum`);
  return true;
}

const [command, dbDir, binary] = process.argv.slice(2);
if (!command || !dbDir) {
  console.error('usage: sqlite-recovery.mjs startup|snapshot|verify <sqlite-dir> [argument]');
  process.exit(64);
}
let code = 0;
if (command === 'startup') code = await startup(path.resolve(dbDir), binary);
else if (command === 'snapshot') code = (await snapshot(path.resolve(dbDir), 'manual')) ? 0 : 1;
else if (command === 'verify') code = (await verifyGeneration(path.resolve(dbDir))) ? 0 : 1;
else if (command === 'migration-evidence') code = (await migrationEvidence(
  path.resolve(dbDir), path.resolve(binary), process.argv[5] ? path.resolve(process.argv[5]) : null,
)) ? 0 : 4;
else code = 64;
process.exitCode = code;
