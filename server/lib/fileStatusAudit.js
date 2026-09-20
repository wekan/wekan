'use strict';
// Read-only inventory. Never infer that an unreferenced file is safe to delete.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ObjectId } = require('bson');
const { isPathInsideBase } = require('../../models/lib/storagePathContainment');
const LIMITS = { records: 20000, entries: 50000, history: 20000, findings: 500,
  milliseconds: 120000, bytes: 256 * 1024 * 1024, fileBytes: 32 * 1024 * 1024 };
const errorCode = e => String(e?.code || e?.name || 'read-failed').slice(0, 80);
function canonicalMime(value) {
  const mime = String(value || '').split(';')[0].trim().toLowerCase();
  return ({ 'image/jpg': 'image/jpeg', 'image/x-png': 'image/png', 'application/x-gzip': 'application/gzip',
    'text/javascript': 'application/javascript', 'text/xml': 'application/xml' })[mime] || mime;
}
const basename = value => path.basename(String(value || '').replace(/\\/g, '/'));

async function auditFiles({ db, roots, writablePath, detect, remoteRead, mode = 'all',
  limits = {}, report = {}, cancelled = () => false }) {
  const cap = { ...LIMITS, ...limits }, start = Date.now();
  Object.assign(report, { state: 'running', mode, startedAt: new Date(), phase: 'metadata',
    counts: { records: 0, versions: 0, diskFiles: 0, historyRows: 0, bytesRead: 0 },
    totals: {}, findings: [], limitations: [], roots: [], omittedFindings: 0 });
  const note = text => { if (!report.limitations.includes(text)) report.limitations.push(text); };
  const finding = (kind, data = {}) => {
    report.totals[kind] = (report.totals[kind] || 0) + 1;
    if (report.findings.length < cap.findings) report.findings.push({ kind, ...data });
    else report.omittedFindings++;
  };
  const check = () => {
    if (cancelled()) throw Object.assign(new Error('Scan cancelled'), { code: 'CANCELLED' });
    if (Date.now() - start > cap.milliseconds) throw Object.assign(new Error('Time limit reached'), { code: 'LIMIT' });
  };
  async function rows(collection, filter, projection, limit, visit) {
    const cursor = db.collection(collection).find(filter, { projection, limit: limit + 1, maxTimeMS: 10000 });
    let count = 0;
    try {
      for await (const row of cursor) {
        check();
        if (++count > limit) { note(`${collection}: record limit reached; results are partial.`); break; }
        await visit(row);
      }
    } finally { await cursor.close(); }
  }
  const refs = [], docs = new Map(), history = new Map(), files = new Map(), referenced = new Set();
  const historyPaths = new Map(), historyNames = new Map();
  const parentCache = new Map();
  try {
    for (const coll of ['attachments', 'avatars']) {
      await rows(coll, {}, { name: 1, extension: 1, type: 1, size: 1, path: 1, versions: 1, meta: 1, sha256: 1 }, cap.records, async doc => {
        report.counts.records++;
        for (const [field, parent] of [['boardId', 'boards'], ['cardId', 'cards']]) {
          const parentId = doc.meta?.[field];
          if (!parentId) { if (coll === 'attachments') finding('missing-owner-metadata', { collection: coll, id: String(doc._id), fields: field }); continue; }
          const key = `${parent}/${parentId}`;
          if (!parentCache.has(key)) parentCache.set(key, !!(await db.collection(parent).findOne({ _id: parentId }, { projection: { _id: 1 }, maxTimeMS: 5000 })));
          if (!parentCache.get(key)) finding('missing-parent-record', { collection: coll, id: String(doc._id), fields: field, parentId: String(parentId) });
        }
        const id = String(doc._id), key = `${coll}/${id}`;
        docs.set(key, doc);
        const missing = ['name', 'extension', 'type', 'size'].filter(field => doc[field] === undefined || doc[field] === null || doc[field] === '');
        if (missing.length) finding('incomplete-metadata', { collection: coll, id, fields: missing.join(', '), name: doc.name || '' });
        if (!doc.versions || typeof doc.versions !== 'object' || !Object.keys(doc.versions).length) {
          finding('missing-versions', { collection: coll, id, name: doc.name || '', detail: 'Upload/finalization may be incomplete; cause is not established.' });
          refs.push({ coll, doc, version: { path: doc.path, storage: 'fs', size: doc.size }, versionName: '(top-level only)' });
        }
        for (const [versionName, version] of Object.entries(doc.versions || {})) {
          if (refs.length >= cap.records) throw Object.assign(new Error('Version limit reached'), { code: 'LIMIT' });
          report.counts.versions++;
          if (!version || typeof version !== 'object') { finding('invalid-version', { collection: coll, id, version: versionName }); continue; }
          const missing = ['size', 'type', 'extension'].filter(field => version[field] === undefined || version[field] === null || version[field] === '');
          if (missing.length) finding('incomplete-version', { collection: coll, id, version: versionName, fields: missing.join(', ') });
          refs.push({ coll, doc, version, versionName });
        }
      });
    }
    report.phase = 'history';
    await rows('changeHistory', { entityType: 'attachment' }, { entityId: 1, changeType: 1, createdAt: 1, undone: 1, previousContent: 1, newContent: 1 }, cap.history, async row => {
      report.counts.historyRows++;
      const id = String(row.entityId), events = history.get(id) || [];
      if (events.length < 10) events.push({ change: row.changeType, at: row.createdAt, undone: !!row.undone });
      history.set(id, events);
      // Store only path/name evidence, never document contents or actor details.
      let inspectedFields = 0;
      function extract(value, depth = 0) {
        if (!value || typeof value !== 'object' || depth > 5) return;
        for (const [key, field] of Object.entries(value)) {
          if (++inspectedFields > 2000) { note('Some large history snapshots were truncated.'); return; }
          if (['path', 'name'].includes(key) && typeof field === 'string') {
            const b = basename(field), ids = historyPaths.get(b) || new Set();
            if (b && historyPaths.size >= cap.entries && !historyPaths.has(b)) { note('History evidence entry limit reached; results are partial.'); return; }
            if (b) { ids.add(id); historyPaths.set(b, ids); const names = historyNames.get(id) || new Set(); names.add(b); historyNames.set(id, names); }
          } else if (field && typeof field === 'object') extract(field, depth + 1);
        }
      }
      extract(row.previousContent); extract(row.newContent);
      for (const content of [row.previousContent, row.newContent]) {
        if (content?.field === 'name' && typeof content.value === 'string') extract({ name: content.value });
      }
    });
    await rows('activities', { attachmentId: { $exists: true } }, { attachmentId: 1, activityType: 1, createdAt: 1 }, cap.history, async row => {
      const id = String(row.attachmentId), events = history.get(id) || [];
      if (events.length < 10) events.push({ change: row.activityType, at: row.createdAt, source: 'activities' });
      history.set(id, events);
    });
    await rows('recoveryEvents', { type: { $in: ['attachment-permanently-deleted', 'board-permanently-deleted', 'restore-backup', 'remigrate', 'restore-failed'] } }, { type: 1, createdAt: 1 }, 100, async row => {
      finding('recovery-event-context', { detail: `${row.type}; may be relevant but is not proof of a specific file change.`, at: row.createdAt });
    });
    report.phase = 'filesystem';
    const scanRoots = new Set(Object.values(roots).map(p => path.resolve(p)));
    scanRoots.add(path.resolve(path.dirname(roots.attachments), 'temp'));
    for (const coll of ['attachments', 'avatars']) {
      scanRoots.add(path.resolve(writablePath, coll));
      scanRoots.add(path.resolve(writablePath, 'uploads', coll));
    }
    const realRoots = [];
    let entries = 0;
    async function walk(directory, depth = 0) {
      check();
      if (depth > 12) { note('Directory depth limit reached; deeper files were not checked.'); return; }
      let dir;
      try { dir = await fs.promises.opendir(directory); }
      catch (error) { finding('directory-unreadable', { path: directory, detail: errorCode(error) }); return; }
      for await (const entry of dir) {
        check();
        if (++entries > cap.entries) throw Object.assign(new Error('Filesystem entry limit reached'), { code: 'LIMIT' });
        const filename = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) { finding('symlink-not-followed', { path: filename }); continue; }
        if (entry.isDirectory()) await walk(filename, depth + 1);
        else if (entry.isFile()) {
          try { const stat = await fs.promises.lstat(filename); files.set(filename, { path: filename, stat }); }
          catch (error) { finding('file-changed-during-scan', { path: filename, detail: errorCode(error) }); }
        } else finding('non-regular-file', { path: filename });
      }
    }
    for (const root of scanRoots) {
      try {
        const real = await fs.promises.realpath(root);
        report.roots.push({ path: root, resolved: real, status: 'accessible' });
        if (!realRoots.includes(real)) { realRoots.push(real); await walk(real); }
      } catch (error) {
        if (error.code === 'LIMIT' || error.code === 'CANCELLED') throw error;
        report.roots.push({ path: root, status: errorCode(error) });
        if (Object.values(roots).map(p => path.resolve(p)).includes(root)) finding('storage-root-unavailable', { path: root, detail: errorCode(error) });
      }
    }
    // Old CFS migrations also left <id>-<name> directly in WRITABLE_PATH.
    // Inspect only file entries there, never unrelated directories or files.
    try {
      const root = await fs.promises.realpath(writablePath);
      if (!realRoots.includes(root)) realRoots.push(root);
      const dir = await fs.promises.opendir(root);
      for await (const entry of dir) {
        check();
        if (++entries > cap.entries) throw Object.assign(new Error('Filesystem entry limit reached'), { code: 'LIMIT' });
        if (!entry.isFile()) continue;
        const candidateIds = entry.name.split(/[-_.]/);
        let prefix = '';
        const known = docs.has(`attachments/${entry.name}`) || docs.has(`avatars/${entry.name}`) || candidateIds.some((part, i) => {
          prefix += (i ? entry.name[prefix.length] : '') + part;
          return docs.has(`attachments/${prefix}`) || docs.has(`avatars/${prefix}`);
        });
        if (!known && !historyPaths.has(entry.name)) continue;
        const filename = path.join(root, entry.name);
        files.set(filename, { path: filename, stat: await fs.promises.lstat(filename) });
      }
    } catch (error) {
      if (error.code === 'LIMIT' || error.code === 'CANCELLED') throw error;
      note(`Legacy writable-directory check unavailable: ${errorCode(error)}.`);
    }
    report.counts.diskFiles = files.size;
    const byBase = new Map(), byHash = new Map(), byIdentifier = new Map();
    for (const file of files.values()) {
      const b = basename(file.path), list = byBase.get(b) || []; list.push(file); byBase.set(b, list);
      const prefixes = [b];
      for (let i = 0; i < b.length; i++) if ('-_.'.includes(b[i])) prefixes.push(b.slice(0, i));
      for (const prefix of prefixes) if (docs.has(`attachments/${prefix}`) || docs.has(`avatars/${prefix}`)) {
        const matches = byIdentifier.get(prefix) || []; matches.push(file); byIdentifier.set(prefix, matches);
      }
    }
    async function inspect(file, full = false) {
      if (full ? file.complete : file.checked) return file;
      file.checked = true; check();
      const wanted = full ? file.stat.size : Math.min(file.stat.size, 65536);
      if ((full && file.stat.size > cap.fileBytes) || report.counts.bytesRead + wanted > cap.bytes) {
        finding(full ? 'checksum-not-checked' : 'content-not-checked', { path: file.path, detail: 'File-size or total-byte limit reached.' }); note('Some file contents/checksums were not read due to size/byte limits.'); return file;
      }
      let handle;
      try {
        // Recheck canonical containment and use O_NOFOLLOW where available.
        const real = await fs.promises.realpath(file.path);
        if (!realRoots.some(root => isPathInsideBase(root, real))) throw Object.assign(new Error(), { code: 'OUTSIDE_ROOT' });
        handle = await fs.promises.open(file.path, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
        const before = await handle.stat();
        if (!before.isFile() || before.size !== file.stat.size || before.ino !== file.stat.ino) throw Object.assign(new Error(), { code: 'CHANGED' });
        const buffer = Buffer.alloc(Math.min(before.size, wanted));
        let bytesRead = 0;
        while (bytesRead < buffer.length) {
          check();
          const next = await handle.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead);
          if (!next.bytesRead) break;
          bytesRead += next.bytesRead;
        }
        report.counts.bytesRead += bytesRead;
        const after = await handle.stat();
        if (bytesRead !== wanted || after.size !== before.size || after.mtimeMs !== before.mtimeMs) throw Object.assign(new Error(), { code: 'CHANGED' });
        const data = buffer.subarray(0, bytesRead);
        file.complete = bytesRead === before.size;
        if (file.complete) {
          file.sha256 = crypto.createHash('sha256').update(data).digest('hex');
          const duplicates = byHash.get(file.sha256) || []; duplicates.push(file.path); byHash.set(file.sha256, duplicates);
        }
        file.detected = await detect(data);
        file.readSuccessful = true;
        if (!bytesRead) finding('empty-file', { path: file.path });
      } catch (error) { finding('content-read-failed', { path: file.path, detail: errorCode(error) }); }
      finally { if (handle) await handle.close(); }
      return file;
    }
    // Content inspection also covers files not yet represented in the database.
    if (mode !== 'inventory') for (const file of files.values()) await inspect(file);
    // Detect types across the inventory before spending the remaining budget on
    // full hashes, so one large upload cannot consume every later file's check.
    if (mode === 'all') for (const file of files.values()) await inspect(file, true);
    for (const file of files.values()) if (file.readSuccessful && (!file.detected?.mime || file.detected.mime === 'application/octet-stream')) finding('type-unknown', { path: file.path });
    if (mode === 'types') note('Type checks use up to 64 KiB per file; large-file checksums are not verified in this mode.');
    report.phase = 'reconciliation';
    const baselines = new Map();
    await rows('fileIntegrity', {}, { path: 1, size: 1, mtimeMs: 1, digests: 1, at: 1 }, cap.records, async row => {
      const filename = row.path || String(row._id);
      baselines.set(filename, row);
      const file = files.get(filename);
      if (file && (Number(row.size) !== file.stat.size || (file.sha256 && row.digests?.sha256 && row.digests.sha256 !== file.sha256))) {
        finding('integrity-baseline-differs', { path: filename, detail: 'Current size or SHA-256 differs from the saved baseline; review integrity history.', at: row.at });
      }
      if (!file && row.digests?.sha256) for (const moved of byHash.get(row.digests.sha256) || []) {
        finding('baseline-move-candidate', { path: moved, previousPath: filename, detail: 'Matches baseline SHA-256. Baseline signature is not verified by this read-only scan.' });
      }
    });
    const gridRefs = { attachments: new Set(), avatars: new Set() };
    const missingRefs = [];
    for (const { coll, doc, version, versionName } of refs) {
      check();
      const id = String(doc._id), context = { collection: coll, id, version: versionName, name: doc.name || '' };
      const storage = version.storage || (version.meta?.gridFsFileId || doc.meta?.source === 'import' ? 'gridfs' : 'fs');
      if (version.size !== undefined && (!Number.isFinite(version.size) || version.size < 0)) finding('invalid-size-metadata', context);
      const hints = ['s3', 'azure', 'gcs'].filter(provider => version.meta?.[`${provider}FileId`]);
      if (!version.storage && hints.length) finding('storage-backend-ambiguous', { ...context, detail: `Storage flag is absent but metadata mentions ${hints.join(', ')}. Check migration/finalization history.` });
      if (!version.storage) finding('inferred-storage', { ...context, detail: `Storage flag absent; inferred ${storage}.` });
      let file;
      if (storage === 'fs') {
        if (!version.path) finding('missing-path', context);
        if (typeof version.path === 'string' && version.path) {
          const resolved = path.resolve(version.path);
          // Do not open arbitrary database-provided paths outside configured roots.
          if (!scanRoots.has(resolved) && ![...scanRoots].some(root => isPathInsideBase(root, resolved))) finding('path-outside-storage-roots', { ...context, path: version.path });
          else {
            try { const real = await fs.promises.realpath(resolved); file = files.get(real); }
            catch (error) { if (error.code !== 'ENOENT') finding('record-path-unreadable', { ...context, path: version.path, detail: errorCode(error) }); }
          }
        }
        if (!file) { missingRefs.push({ context, doc, version }); finding('missing-or-unverified-file', { ...context, path: version.path || '', history: history.get(id) || [] }); }
        else {
          if (referenced.has(file.path)) finding('duplicate-file-reference', { ...context, path: file.path });
          referenced.add(file.path);
          if (Number.isFinite(version.size) && version.size !== file.stat.size) finding('size-mismatch', { ...context, path: file.path, expected: version.size, actual: file.stat.size });
          const checksum = version.sha256 || (versionName === 'original' && doc.sha256);
          if (checksum && file.sha256 && String(checksum).toLowerCase() !== file.sha256) finding('checksum-mismatch', { ...context, path: file.path });
        }
      } else if (storage === 'gridfs') {
        const gridId = version.meta?.gridFsFileId;
        if (!gridId) { finding('missing-storage-reference', { ...context, storage }); missingRefs.push({ context, doc, version }); }
        else {
          gridRefs[coll].add(String(gridId));
          const storedId = typeof gridId === 'string' && /^[0-9a-f]{24}$/i.test(gridId) ? new ObjectId(gridId) : gridId;
          const stored = await db.collection(`${coll}.files`).findOne({ _id: storedId }, { maxTimeMS: 5000 });
          if (!stored) { finding('missing-gridfs-file', { ...context, storage, history: history.get(id) || [] }); missingRefs.push({ context, doc, version }); }
          else if (Number.isFinite(version.size) && Number(stored.length) !== version.size) finding('size-mismatch', { ...context, expected: version.size, actual: Number(stored.length) });
        }
      }
      if (storage !== 'fs') {
        if (remoteRead && mode !== 'inventory') {
          try {
            if (report.counts.bytesRead + 65536 > cap.bytes) throw Object.assign(new Error(), { code: 'BYTE_LIMIT' });
            const buffer = await remoteRead(coll, doc, versionName, storage);
            report.counts.bytesRead += buffer.length;
            file = { detected: await detect(buffer) };
          } catch (error) { if (error.code === 'BYTE_LIMIT') note('Remote content byte limit reached; results are partial.'); finding('remote-read-unverified', { ...context, storage, detail: errorCode(error) }); }
        } else finding('remote-content-not-checked', { ...context, storage });
      }
      if (file?.detected?.mime) {
        const { mime, ext } = file.detected;
        if (ext === 'zip' && ['docx', 'xlsx', 'pptx', 'docm', 'xlsm', 'pptm', 'odt', 'ods', 'odp', 'epub'].includes(String(doc.extension || basename(doc.name).split('.').pop()).toLowerCase())) {
          finding('container-subtype-unverified', { ...context, detected: mime, detail: 'ZIP container detected; insufficient evidence to contradict the declared document subtype.' });
          continue;
        }
        if (!doc.type || !doc.extension || !version.type || !version.extension) finding('detected-metadata-for-incomplete-record', {
          ...context, detected: mime, extension: ext || '',
          detail: 'Content detection succeeded during this scan. Missing saved metadata does not establish why finalization failed.',
        });
        if (version.type && canonicalMime(version.type) !== canonicalMime(mime) && mime !== 'application/octet-stream') finding('mime-mismatch', { ...context, stored: version.type, detected: mime });
        const extension = basename(version.name || (versionName === 'original' ? doc.name : '')).split('.').slice(1).pop()?.toLowerCase() || '';
        const aliases = { jpg: ['jpg', 'jpeg', 'jpe'], tif: ['tif', 'tiff'], gz: ['gz', 'gzip', 'tgz', 'svgz'], html: ['html', 'htm'], js: ['js', 'mjs', 'cjs'], yaml: ['yaml', 'yml'], ndjson: ['ndjson', 'jsonl'] };
        if (ext && (version.name || versionName === 'original') && !(aliases[ext] || [ext]).includes(extension)) finding('extension-mismatch', { ...context, detected: ext, stored: extension });
        if (ext && versionName === 'original' && doc.extension && !(aliases[ext] || [ext]).includes(String(doc.extension).toLowerCase())) finding('record-extension-mismatch', { ...context, detected: ext, stored: doc.extension });
        if (versionName === 'original' && doc.type && canonicalMime(doc.type) !== canonicalMime(mime) && mime !== 'application/octet-stream') finding('record-mime-mismatch', { ...context, detected: mime, stored: doc.type });
        if (ext && version.extension && !(aliases[ext] || [ext]).includes(String(version.extension).toLowerCase())) finding('version-extension-mismatch', { ...context, detected: ext, stored: version.extension });
      }
    }
    for (const { context, doc, version } of missingRefs) {
      const candidates = new Map();
      for (const file of byIdentifier.get(context.id) || []) candidates.set(file.path, 'identifier in stored filename (candidate, not proof)');
      for (const name of [basename(version.path), basename(doc.name), ...(historyNames.get(context.id) || [])]) for (const file of byBase.get(name) || []) candidates.set(file.path, 'matching filename (ambiguous)');
      for (const filename of byHash.get(String(version.sha256 || doc.sha256 || baselines.get(version.path)?.digests?.sha256 || '').toLowerCase()) || []) candidates.set(filename, 'matching recorded SHA-256');
      for (const [filename, reason] of candidates) finding('possible-moved-or-renamed-file', { ...context, path: filename, detail: reason, detected: files.get(filename)?.detected?.mime || '', extension: files.get(filename)?.detected?.ext || '' });
      if (!candidates.size) finding('no-recovery-candidate', context);
    }
    for (const file of files.values()) if (!referenced.has(file.path)) {
      const b = basename(file.path), ids = [...(historyPaths.get(b) || [])];
      finding('file-without-live-reference', { path: file.path, size: file.stat.size,
        detected: file.detected?.mime || '', extension: file.detected?.ext || '', historyIds: ids.slice(0, 10),
        history: ids.slice(0, 3).map(id => ({ id, events: history.get(id) || [] })),
        detail: file.stat.mtimeMs > start - 3600000 ? 'Recently modified: upload or migration may still be in progress.' : 'May be a moved file, deleted record, incomplete upload or lost metadata; not safe to delete based on this scan.' });
    }
    for (const [hash, duplicates] of byHash) if (duplicates.length > 1) finding('duplicate-content', { sha256: hash, paths: duplicates.slice(0, 10), count: duplicates.length });
    for (const coll of ['attachments', 'avatars']) {
      const stored = new Map(), chunks = new Map();
      await rows(`${coll}.files`, {}, { length: 1, filename: 1, chunkSize: 1 }, cap.records, async row => {
        const id = String(row._id); stored.set(id, row);
        if (!gridRefs[coll].has(id)) finding('gridfs-without-live-reference', { collection: coll, id, name: row.filename || '' });
      });
      await rows(`${coll}.chunks`, {}, { files_id: 1, n: 1 }, cap.entries, async row => {
        const id = String(row.files_id), seen = chunks.get(id) || new Set();
        if (!Number.isInteger(row.n) || row.n < 0 || seen.has(row.n)) finding('gridfs-invalid-chunk-sequence', { collection: coll, id });
        seen.add(row.n); chunks.set(id, seen);
      });
      for (const [id, row] of stored) {
        const seen = chunks.get(id) || new Set();
        const expected = row.chunkSize > 0 ? Math.ceil(Number(row.length) / row.chunkSize) : NaN;
        if (!Number.isFinite(expected) || seen.size !== expected || [...seen].some(n => n >= expected)) finding('gridfs-chunk-count-mismatch', { collection: coll, id, expected: Number.isFinite(expected) ? expected : 'invalid metadata', actual: seen.size });
      }
      for (const id of chunks.keys()) if (!stored.has(id)) finding('gridfs-chunks-without-file-record', { collection: coll, id, detail: 'Candidate orphan; inventory may be partial.' });
    }
    note('Local type checks inspect headers first. Full hashes and duplicate-content checks only include files fully read within the remaining byte budget.');
    note('Read-only snapshot, not a transaction: uploads, deletion or migration during a scan can change results. Repeat after activity stops.');
    note('Integrity baselines are comparison evidence only here; this scan does not replace the signed baseline verification in Filesystem integrity.');
    note('Unreferenced cloud objects, legacy CollectionFS buckets, external/unmounted directories, backups, filesystem journal and deleted history are not exhaustively inventoried.');
    note('Remote reads inspect at most 64 KiB; full remote checksums and GridFS chunk payloads are not verified (chunk counts/sequences are checked). Unknown/encrypted formats and truncated headers may prevent definitive type detection.');
    report.state = report.limitations.some(x => /limit|partial/i.test(x)) ? 'partial' : 'completed';
  } catch (error) {
    report.state = error.code === 'CANCELLED' ? 'cancelled' : error.code === 'LIMIT' ? 'partial' : 'failed';
    note(error.code === 'LIMIT' || error.code === 'CANCELLED' ? error.message : `Scan failed: ${errorCode(error)}. No repair was performed.`);
  }
  report.finishedAt = new Date(); report.phase = 'finished';
  return report;
}
module.exports = { auditFiles, LIMITS };
