'use strict';
// Server-only: a Sandstorm grain backup (.zip) read for the import, and
// written for the export (models/lib/sandstorm/grainApps.js says what each
// app's grain holds). The .zip is opened under the archive limits of the
// other imports (server/lib/chatArchives.js openZip); an app's SQLite
// database is copied to a directory of its own and read with Node's own
// node:sqlite, never written back; the export writes its databases the same
// way, into a temporary directory that is removed afterwards.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { openZip } = require('./chatArchives');

const MAX_FILES = 5000;
const lazy = () => require('../../models/lib/sandstorm/grainApps');
const grainInfo = () => require('../../models/lib/sandstorm/grainInfo');

async function withTempDir(fn) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'wekan-grain-'));
  try { return await fn(dir); } finally { await fs.promises.rm(dir, { recursive: true, force: true }); }
}

// The rows of SQLite tables of a database in the grain (with its -wal and
// -shm beside it, as a running app leaves them).
async function sqliteRows(zip, dbPath, queries) {
  const { DatabaseSync } = require('node:sqlite');
  const entry = zip.byPath.get(dbPath);
  if (!entry) throw new Error(`The grain has no ${dbPath.replace(/^data\//, '')}`);
  return withTempDir(async dir => {
    const file = path.join(dir, 'db.sqlite');
    await fs.promises.writeFile(file, await zip.bytes(entry));
    for (const suffix of ['-wal', '-shm']) {
      const side = zip.byPath.get(`${dbPath}${suffix}`);
      if (side) await fs.promises.writeFile(`${file}${suffix}`, await zip.bytes(side));
    }
    const db = new DatabaseSync(file);
    try {
      const out = {};
      for (const [name, sql] of Object.entries(queries)) {
        try { out[name] = db.prepare(sql).all(); } catch (error) { out[name] = []; }
      }
      return out;
    } finally { db.close(); }
  });
}

const WEKAN_COLLECTIONS = ['boards', 'lists', 'swimlanes', 'cards', 'checklists', 'checklistItems', 'card_comments', 'users', 'attachments'];

// What each app's reader in grainApps.js takes.
async function readAppData(app, zip) {
  const text = async p => (zip.byPath.get(p) ? zip.read(zip.byPath.get(p)) : '');
  const under = prefix => zip.entries.filter(e => e.path.startsWith(prefix) && !e.path.endsWith('/'));
  switch (app.app) {
    case 'wekan': {
      const { decodeSjson } = lazy();
      const tables = await sqliteRows(zip, 'data/files/db/wekan.sqlite', { collections: 'select name, table_name from _ferretdb_collections' });
      const names = new Map(tables.collections.map(r => [r.name, r.table_name]));
      const queries = {};
      for (const name of WEKAN_COLLECTIONS) {
        if (names.has(name)) queries[name] = `select json(_ferretdb_sjson) as doc from "${String(names.get(name)).replace(/"/g, '""')}"`;
      }
      const rows = await sqliteRows(zip, 'data/files/db/wekan.sqlite', queries);
      const collections = {};
      for (const [name, list] of Object.entries(rows)) collections[name] = list.map(r => decodeSjson(JSON.parse(r.doc)));
      // Attachment files (Meteor-Files on the filesystem): /var/... is data/...
      const files = {};
      for (const a of collections.attachments || []) {
        const where = a && a.versions && a.versions.original && a.versions.original.path;
        const entry = typeof where === 'string' && where.startsWith('/var/') && zip.byPath.get(`data/${where.slice(5)}`);
        if (entry) files[a._id] = (await zip.bytes(entry)).toString('base64');
      }
      return { collections, files };
    }
    case 'prioritize': {
      const raw = await text('data/data.json');
      if (!raw) throw new Error('The Prioritize grain has no data.json');
      return { data: JSON.parse(raw) };
    }
    case 'yatl':
      return sqliteRows(zip, 'data/db.sqlite3', { todos: 'select id, done, descr from todos order by id' });
    case 'mutodo': {
      const entries = under('data/todo.db/').filter(e => /\.data$/.test(e.path)).sort((a, b) => a.path.localeCompare(b.path));
      if (!entries.length) throw new Error('The μTodo grain has no todo.db');
      const parts = [];
      for (const e of entries) parts.push(await zip.bytes(e));
      return { bytes: new Uint8Array(Buffer.concat(parts)) };
    }
    case 'sandchat':
      return sqliteRows(zip, 'data/db.sqlite3', { chats: 'select id, message, user_id, created_at from chats', users: 'select id, name from users' });
    case 'ethercalc': {
      const sheets = {};
      for (const e of under('data/dump/').filter(e => /\/snapshot-[^/]+\.txt$/.test(e.path) && !/_formdata\.txt$/.test(e.path))) {
        sheets[/snapshot-([^/]+)\.txt$/.exec(e.path)[1]] = await zip.read(e);
      }
      return { sheets };
    }
    case 'radicalecalendar':
    case 'radicalecontacts': {
      const ext = app.app === 'radicalecalendar' ? '.ics' : '.vcf';
      const entries = under('data/lib/radicale/').filter(e => e.path.endsWith(ext));
      if (!entries.length) {
        const other = under('data/lib/radicale/').some(e => e.path.endsWith(ext === '.ics' ? '.vcf' : '.ics'));
        throw new Error(other ? `This Radicale grain is ${ext === '.ics' ? 'an address book' : 'a calendar'}: choose Sandstorm → Radicale ${ext === '.ics' ? 'address book' : 'calendar'}`
          : `The Radicale grain has no ${ext} file`);
      }
      const texts = [];
      for (const e of entries) texts.push(await zip.read(e));
      return app.app === 'radicalecalendar' ? { ics: texts.join('\r\n') } : { vcf: texts.join('\r\n') };
    }
    case 'davros': {
      const files = [];
      for (const e of under('data/davros/data/').slice(0, MAX_FILES)) {
        const rel = e.path.slice('data/davros/data/'.length);
        const buffer = await zip.bytes(e);
        files.push(/\.(md|markdown|txt)$/i.test(rel) ? { path: rel, text: buffer.toString('utf8') } : { path: rel, base64: buffer.toString('base64') });
      }
      return { files };
    }
    case 'hackercms': {
      const pages = [];
      for (const e of under('data/src/').slice(0, MAX_FILES)) {
        if (/\.(html?|md|markdown)$/i.test(e.path)) pages.push({ path: e.path.slice('data/src/'.length), text: await zip.read(e) });
      }
      return { pages };
    }
    case 'gogs':
      return sqliteRows(zip, 'data/gogs/data/gogs.db', {
        issues: 'select id, repo_id, "index", poster_id, name, content, milestone_id, assignee_id, is_closed, is_pull, deadline_unix, created_unix from issue',
        comments: 'select id, type, poster_id, issue_id, content, created_unix from comment',
        labels: 'select id, name from label', issueLabels: 'select issue_id, label_id from issue_label',
        milestones: 'select id, name from milestone', users: 'select id, name, full_name from user',
        repositories: 'select id, name from repository',
      });
    case 'wordpress':
      return sqliteRows(zip, 'data/wordpress/wp-content/database/.ht.sqlite', {
        posts: 'select ID, post_author, post_date_gmt, post_content, post_title, post_status, post_parent, post_type from wp_posts',
        comments: 'select comment_post_ID, comment_author, comment_date_gmt, comment_content, comment_approved from wp_comments',
        users: 'select ID, user_login, display_name from wp_users',
        terms: 'select tt.term_taxonomy_id, tt.taxonomy, t.name from wp_term_taxonomy tt join wp_terms t on t.term_id = tt.term_id',
        relationships: 'select object_id, term_taxonomy_id from wp_term_relationships',
      });
    default:
      throw new Error('Not a Sandstorm app WeKan reads');
  }
}

// What the grain chosen as `key` (a source of models/lib/importSources.js)
// holds for the app: { sandstorm: key, info, data }, which
// EXTERNAL_PARSERS[key] (models/lib/sandstorm/grainApps.js) reads.
async function readSandstormGrainData(value, key) {
  const apps = lazy();
  const app = apps.sandstormApp(key);
  if (!app) throw new Error('Not a Sandstorm app WeKan reads');
  const opened = await openZip(value, 'Sandstorm grain');
  const zip = { ...opened, byPath: new Map(opened.entries.map(e => [e.path.replace(/^\.?\//, ''), e])) };
  const meta = zip.byPath.get('metadata');
  if (!meta) throw new Error('Not a Sandstorm grain backup: it has no metadata file (in Sandstorm, open the grain and choose Download backup)');
  const info = grainInfo().readGrainInfo(new Uint8Array(await zip.bytes(meta)));
  if (info.appId !== app.appId) {
    if (apps.SANDSTORM_UNREADABLE[info.appId]) throw new Error(`This grain cannot be imported: ${apps.SANDSTORM_UNREADABLE[info.appId]}`);
    const other = apps.sandstormAppsOf(info.appId)[0];
    throw new Error(other ? `This is a ${other.name} grain: choose Sandstorm → ${other.name}`
      : `This grain is of a Sandstorm app WeKan does not read (app id ${info.appId})`);
  }
  return { sandstorm: key, info, data: await readAppData(app, zip) };
}

// The board of a grain, read and parsed in one step (the tests).
async function readSandstormGrain(value, key) {
  const { sandstorm, info, data } = await readSandstormGrainData(value, key);
  return lazy().parseSandstormGrain(sandstorm, data, info);
}

// An attachment's bytes from WeKan's storage, or null.
async function attachmentBytes(attachmentId, maxBytes) {
  const { ReactiveCache } = require('/imports/reactiveCache');
  const { fileStoreStrategyFactory } = require('/models/attachments.server');
  const attachment = await ReactiveCache.getAttachment(attachmentId);
  if (!attachment || Number(attachment.size) > maxBytes) return null;
  const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
  const stream = strategy && strategy.getReadStream();
  if (!stream) return null;
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxBytes) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const MAX_EXPORT_ATTACHMENT_BYTES = 256 * 1024 * 1024;

// The grain .zip of sandstormGrainFiles' list: metadata first, then data/.
// `readAttachment(id)` resolves to an attachment's bytes (the server's
// storage by default; a test passes its own).
async function writeSandstormGrain(spec, { readAttachment } = {}) {
  const { zipSync, strToU8 } = require('fflate');
  const entries = { metadata: spec.metadata };
  for (const [p, text] of Object.entries(spec.files)) entries[p] = strToU8(String(text));
  for (const [p, bytes] of Object.entries(spec.bytes)) entries[p] = bytes;
  for (const [p, size] of Object.entries(spec.random)) entries[p] = require('crypto').randomBytes(Number(size) || 32);
  for (const dir of spec.dirs) entries[dir] = new Uint8Array(0);
  // A symbolic link, as zip -y stores it: the target as data, Unix mode 0120777.
  for (const [p, target] of Object.entries(spec.symlinks)) entries[p] = [strToU8(String(target)), { os: 3, attrs: (0o120777 << 16) >>> 0 }];
  const read = readAttachment || (id => attachmentBytes(id, MAX_EXPORT_ATTACHMENT_BYTES));
  for (const [p, id] of Object.entries(spec.attachments)) {
    const bytes = await read(id);
    if (bytes) entries[p] = new Uint8Array(bytes);
  }
  if (Object.keys(spec.sqlite).length) {
    const { DatabaseSync } = require('node:sqlite');
    await withTempDir(async dir => {
      for (const [p, { ddl, rows }] of Object.entries(spec.sqlite)) {
        const file = path.join(dir, path.basename(p));
        const db = new DatabaseSync(file);
        try {
          for (const statement of ddl) db.exec(statement);
          db.exec('BEGIN');
          for (const [table, list] of Object.entries(rows || {})) {
            for (const row of list) {
              const keys = Object.keys(row);
              db.prepare(`insert into "${table}" (${keys.map(k => `"${k}"`).join(', ')}) values (${keys.map(() => '?').join(', ')})`)
                .run(...keys.map(k => row[k]));
            }
          }
          db.exec('COMMIT');
        } finally { db.close(); }
        entries[p] = new Uint8Array(await fs.promises.readFile(file));
      }
    });
  }
  return Buffer.from(zipSync(entries, { level: 6 }));
}

module.exports = { readSandstormGrain, readSandstormGrainData, writeSandstormGrain, sqliteRows, attachmentBytes, MAX_EXPORT_ATTACHMENT_BYTES };
