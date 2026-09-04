'use strict';

/*
 * Run WeKan's server out of the bundle ZIP, without unpacking it.
 *
 * Preloaded by the bundled Node.js before main.js:
 *
 *   node.exe --require wekan-vfs.cjs main.js
 *
 * and configured entirely through the environment, so a bundle that has no
 * archive behind it (the ordinary ZIP, the snap, Docker) loads this file and
 * does nothing at all:
 *
 *   WEKAN_VFS_ARCHIVE  file holding the ZIP - the single EXE itself
 *   WEKAN_VFS_OFFSET   where the ZIP starts in it (default 0)
 *   WEKAN_VFS_LENGTH   how long it is (default: to the end of the file)
 *   WEKAN_VFS_ROOT     the directory the archive is mounted at
 *   WEKAN_VFS_STRIP    leading archive path to drop (default "bundle/")
 *
 * WHY THIS EXISTS. The single Windows EXE used to be an Enigma Virtual Box
 * image: all 44,401 bundle files served from a virtual filesystem inside the
 * EXE by a closed-source driver. In 11.48 that driver handed Node.js the wrong
 * bytes - after loading the native bcrypt addon it answered the next read,
 * promises.js, with that addon's own PE bytes - and WeKan died in a restart
 * loop. This is the same idea in our own code, where it can be read, tested
 * and fixed: the archive is mounted in-process, so the only files that ever
 * reach the disk are the ones that cannot be virtual at all.
 *
 * WHAT STILL HAS TO BE REAL, and why:
 *
 *   - node.exe and ferretdb.exe are separate processes. Windows needs a real
 *     path to start one.
 *   - .node addons are loaded with LoadLibrary, which also needs a real path.
 *   - main.js, because it is the entry Node resolves before this file's hooks
 *     could see it, and start-wekan.bat, because cmd.exe reads it.
 *   - the directory main.js chdir()s into: a working directory is a kernel
 *     concept, not something a hook can answer.
 *
 * Everything else - about 39,000 files - is read from the archive.
 *
 * TWO MECHANISMS, because Node needs both:
 *
 *   1. module.registerHooks() (Node >= 22.15) for `require`. The CJS loader
 *      resolves through internal C++ bindings, not through `fs`, so patching
 *      `fs` alone cannot make `require` see a virtual file - and Module._stat
 *      is captured as a module-local inside Module._findPath, so replacing it
 *      does nothing either. Resolution is therefore done here, by hand.
 *   2. `fs` patching for everything that is NOT a module: Meteor's boot.js
 *      reads program.json and every server package with fs.readFileSync and
 *      runs them through vm.runInThisContext, and webapp serves the client
 *      files with fs.createReadStream.
 *
 * A real file always wins over an archived one, so anything unpacked beside
 * the EXE simply shadows the copy in the archive.
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { Readable } = require('node:stream');
const { pathToFileURL, fileURLToPath } = require('node:url');

const ARCHIVE = process.env.WEKAN_VFS_ARCHIVE;
const ROOT_ENV = process.env.WEKAN_VFS_ROOT;

/* No archive behind this bundle: the ordinary ZIP, the snap, Docker. */
if (!ARCHIVE || !ROOT_ENV) {
  module.exports = { installed: false };
} else {
  module.exports = install();
}

function install() {
  const OFFSET = Number(process.env.WEKAN_VFS_OFFSET || 0);
  const ROOT = path.resolve(ROOT_ENV);
  const STRIP = process.env.WEKAN_VFS_STRIP === undefined
    ? 'bundle/' : process.env.WEKAN_VFS_STRIP;
  const CACHE_BYTES = Number(process.env.WEKAN_VFS_CACHE_BYTES || 128 * 1024 * 1024);

  const WIN = process.platform === 'win32';
  const key = p => (WIN ? p.toLowerCase() : p);

  // ---- the archive ---------------------------------------------------------

  const fd = fs.openSync(ARCHIVE, 'r');
  const fileSize = fs.fstatSync(fd).size;
  const LENGTH = process.env.WEKAN_VFS_LENGTH
    ? Number(process.env.WEKAN_VFS_LENGTH) : fileSize - OFFSET;

  function readAt(position, length) {
    const buffer = Buffer.allocUnsafe(length);
    let got = 0;
    while (got < length) {
      const n = fs.readSync(fd, buffer, got, length - got, OFFSET + position + got);
      if (n <= 0) throw new Error(`wekan-vfs: short read at ${position + got}`);
      got += n;
    }
    return buffer;
  }

  /* entries: relative POSIX path (lower-cased on Windows) -> record */
  const entries = new Map();
  /* dirs: directory path -> Map(child key -> child name as stored) */
  const dirs = new Map();

  function addDir(rel) {
    const k = key(rel);
    if (!dirs.has(k)) dirs.set(k, new Map());
    if (rel === '') return;
    const at = rel.lastIndexOf('/');
    const parent = at === -1 ? '' : rel.slice(0, at);
    const name = at === -1 ? rel : rel.slice(at + 1);
    addDir(parent);
    dirs.get(key(parent)).set(key(name), name);
  }

  readCentralDirectory();

  function readCentralDirectory() {
    const tailLength = Math.min(LENGTH, 66 * 1024);
    const tail = readAt(LENGTH - tailLength, tailLength);
    let eocd = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd === -1) throw new Error('wekan-vfs: no ZIP end-of-central-directory');

    let count = tail.readUInt16LE(eocd + 10);
    let cdSize = tail.readUInt32LE(eocd + 12);
    let cdOffset = tail.readUInt32LE(eocd + 16);

    /* ZIP64, for an archive with more than 65535 entries or past 4 GB. */
    if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      const locator = eocd - 20;
      if (locator < 0 || tail.readUInt32LE(locator) !== 0x07064b50) {
        throw new Error('wekan-vfs: ZIP64 archive without its locator');
      }
      const at = Number(tail.readBigUInt64LE(locator + 8));
      const head = readAt(at, 56);
      if (head.readUInt32LE(0) !== 0x06064b50) {
        throw new Error('wekan-vfs: ZIP64 end-of-central-directory not found');
      }
      count = Number(head.readBigUInt64LE(32));
      cdSize = Number(head.readBigUInt64LE(40));
      cdOffset = Number(head.readBigUInt64LE(48));
    }

    const cd = readAt(cdOffset, cdSize);
    let at = 0;
    for (let i = 0; i < count; i++) {
      if (cd.readUInt32LE(at) !== 0x02014b50) {
        throw new Error(`wekan-vfs: bad central-directory entry ${i}`);
      }
      const method = cd.readUInt16LE(at + 10);
      const mtime = dosTime(cd.readUInt16LE(at + 12), cd.readUInt16LE(at + 14));
      let csize = cd.readUInt32LE(at + 20);
      let size = cd.readUInt32LE(at + 24);
      const nameLength = cd.readUInt16LE(at + 28);
      const extraLength = cd.readUInt16LE(at + 30);
      const commentLength = cd.readUInt16LE(at + 32);
      let local = cd.readUInt32LE(at + 42);
      const name = cd.toString('utf8', at + 46, at + 46 + nameLength);

      if (size === 0xffffffff || csize === 0xffffffff || local === 0xffffffff) {
        const extra = cd.subarray(at + 46 + nameLength,
          at + 46 + nameLength + extraLength);
        let e = 0;
        while (e + 4 <= extra.length) {
          const id = extra.readUInt16LE(e);
          const length = extra.readUInt16LE(e + 2);
          if (id === 0x0001) {
            let f = e + 4;
            if (size === 0xffffffff) { size = Number(extra.readBigUInt64LE(f)); f += 8; }
            if (csize === 0xffffffff) { csize = Number(extra.readBigUInt64LE(f)); f += 8; }
            if (local === 0xffffffff) { local = Number(extra.readBigUInt64LE(f)); }
            break;
          }
          e += 4 + length;
        }
      }

      at += 46 + nameLength + extraLength + commentLength;

      let rel = name;
      if (STRIP && rel.startsWith(STRIP)) rel = rel.slice(STRIP.length);
      else if (STRIP && rel === STRIP.replace(/\/$/, '')) rel = '';
      if (rel === '' ) continue;

      if (rel.endsWith('/')) { addDir(rel.slice(0, -1)); continue; }
      entries.set(key(rel), { rel, local, csize, size, method, mtime });
      const cut = rel.lastIndexOf('/');
      addDir(cut === -1 ? '' : rel.slice(0, cut));
      dirs.get(key(cut === -1 ? '' : rel.slice(0, cut)))
        .set(key(cut === -1 ? rel : rel.slice(cut + 1)),
          cut === -1 ? rel : rel.slice(cut + 1));
    }
  }

  function dosTime(time, date) {
    const year = ((date >> 9) & 0x7f) + 1980;
    const month = ((date >> 5) & 0x0f) - 1;
    const day = date & 0x1f;
    const hour = (time >> 11) & 0x1f;
    const minute = (time >> 5) & 0x3f;
    const second = (time & 0x1f) * 2;
    return new Date(year, month, day, hour, minute, second).getTime();
  }

  // ---- reading an entry, with a bounded cache ------------------------------

  const cache = new Map();
  let cached = 0;

  function contents(entry) {
    const hit = cache.get(entry.rel);
    if (hit) { cache.delete(entry.rel); cache.set(entry.rel, hit); return hit; }

    const header = readAt(entry.local, 30);
    if (header.readUInt32LE(0) !== 0x04034b50) {
      throw new Error(`wekan-vfs: bad local header for ${entry.rel}`);
    }
    const start = entry.local + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
    const raw = readAt(start, entry.csize);
    let out;
    if (entry.method === 0) out = raw;
    else if (entry.method === 8) out = zlib.inflateRawSync(raw);
    else throw new Error(`wekan-vfs: ${entry.rel} uses ZIP method ${entry.method}`);
    if (out.length !== entry.size) {
      throw new Error(
        `wekan-vfs: ${entry.rel} unpacked to ${out.length} bytes, expected ${entry.size}`);
    }

    if (out.length <= CACHE_BYTES) {
      cache.set(entry.rel, out);
      cached += out.length;
      while (cached > CACHE_BYTES) {
        const oldest = cache.keys().next().value;
        cached -= cache.get(oldest).length;
        cache.delete(oldest);
      }
    }
    return out;
  }

  // ---- mapping a real path onto the archive --------------------------------

  const ROOTKEY = key(ROOT);

  /* The archive path for an absolute path under ROOT, or null. */
  function relOf(p) {
    if (typeof p !== 'string') return null;
    let abs;
    try { abs = path.resolve(p); } catch { return null; }
    const k = key(abs);
    if (k === ROOTKEY) return '';
    if (!k.startsWith(ROOTKEY + path.sep)) return null;
    return abs.slice(ROOT.length + 1).split(path.sep).join('/');
  }

  function toPath(value) {
    if (typeof value === 'string') return value;
    if (Buffer.isBuffer(value)) return value.toString();
    if (value instanceof URL && value.protocol === 'file:') return fileURLToPath(value);
    return null;
  }

  const original = {};
  function keep(name, object = fs) {
    original[name] = object[name];
    return original[name];
  }

  /* A real file shadows the archive, so unpacked files simply win. */
  function realExists(p) {
    try { original.statSync.call(fs, p); return true; } catch { return false; }
  }

  /*
   * Resolve a path to "real, handle it normally", an archive entry, a
   * directory, or nothing there. Every patched fs function starts here.
   *
   * A real DIRECTORY is not handled normally, which is the subtle half: the
   * launcher creates wekan-app/programs/server on disk because main.js chdir()s
   * into it, and the archive holds boot.js, packages/ and npm/ under that same
   * path. Handing such a directory straight to the real readdir would list the
   * two or three unpacked files and hide the entire server. So a directory is
   * always ours, and listing() merges both sides; only a real FILE shadows.
   */
  function look(p) {
    const rel = relOf(p);
    if (rel === null) return null;
    let realStat = null;
    try { realStat = original.statSync.call(fs, p); } catch { /* not on disk */ }
    if (realStat && !realStat.isDirectory()) return null;
    const k = key(rel);
    if (realStat || dirs.has(k)) return { kind: 'dir', rel, realStat };
    const entry = entries.get(k);
    if (entry) return { kind: 'file', entry };
    return { kind: 'missing', rel };
  }

  function enoent(p, syscall) {
    const error = new Error(`ENOENT: no such file or directory, ${syscall} '${p}'`);
    error.code = 'ENOENT';
    error.errno = -2;
    error.syscall = syscall;
    error.path = p;
    return error;
  }

  function statFor(hit) {
    const isDir = hit.kind === 'dir';
    const size = isDir ? 0 : hit.entry.size;
    const ms = isDir ? Date.now() : hit.entry.mtime;
    const when = new Date(ms);
    return {
      dev: 0, ino: 0, nlink: 1, uid: 0, gid: 0, rdev: 0, blksize: 4096,
      mode: isDir ? 0o040555 : 0o100444,
      size, blocks: Math.ceil(size / 512),
      atimeMs: ms, mtimeMs: ms, ctimeMs: ms, birthtimeMs: ms,
      atime: when, mtime: when, ctime: when, birthtime: when,
      isFile: () => !isDir,
      isDirectory: () => isDir,
      isSymbolicLink: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
    };
  }

  function decode(buffer, options) {
    const encoding = typeof options === 'string' ? options : options && options.encoding;
    return encoding ? buffer.toString(encoding) : buffer;
  }

  /* Archive names plus anything really on disk in the same directory. */
  function listing(rel, p) {
    const names = new Set(dirs.get(key(rel)) ? [...dirs.get(key(rel)).values()] : []);
    try {
      for (const name of original.readdirSync.call(fs, p)) names.add(name);
    } catch { /* the directory exists only in the archive */ }
    return [...names].sort();
  }

  // ---- the fs patches ------------------------------------------------------

  keep('statSync'); keep('lstatSync'); keep('readFileSync'); keep('readdirSync');
  keep('existsSync'); keep('realpathSync'); keep('accessSync'); keep('openSync');
  keep('stat'); keep('lstat'); keep('readFile'); keep('readdir'); keep('access');
  keep('realpath'); keep('createReadStream');

  fs.statSync = function (p, options) {
    const hit = look(toPath(p));
    if (!hit) return original.statSync.apply(this, arguments);
    if (hit.kind === 'missing') {
      if (options && options.throwIfNoEntry === false) return undefined;
      throw enoent(p, 'stat');
    }
    /* A directory that is really on disk keeps its own real stat. */
    return hit.realStat || statFor(hit);
  };
  fs.lstatSync = function (p, options) {
    const hit = look(toPath(p));
    if (!hit) return original.lstatSync.apply(this, arguments);
    if (hit.kind === 'missing') {
      if (options && options.throwIfNoEntry === false) return undefined;
      throw enoent(p, 'lstat');
    }
    return hit.realStat || statFor(hit);
  };
  fs.existsSync = function (p) {
    const hit = look(toPath(p));
    if (!hit) return original.existsSync.apply(this, arguments);
    return hit.kind !== 'missing';
  };
  fs.accessSync = function (p) {
    const hit = look(toPath(p));
    if (!hit) return original.accessSync.apply(this, arguments);
    if (hit.kind === 'missing') throw enoent(p, 'access');
    return undefined;
  };
  fs.realpathSync = Object.assign(function (p) {
    const hit = look(toPath(p));
    if (!hit) return original.realpathSync.apply(this, arguments);
    if (hit.kind === 'missing') throw enoent(p, 'realpath');
    return path.resolve(toPath(p));
  }, { native: original.realpathSync.native });
  fs.readFileSync = function (p, options) {
    const hit = look(toPath(p));
    if (!hit) return original.readFileSync.apply(this, arguments);
    if (hit.kind !== 'file') throw enoent(p, 'open');
    return decode(contents(hit.entry), options);
  };
  fs.readdirSync = function (p, options) {
    const hit = look(toPath(p));
    if (!hit) return original.readdirSync.apply(this, arguments);
    if (hit.kind !== 'dir') throw enoent(p, 'scandir');
    const names = listing(hit.rel, toPath(p));
    if (options && options.withFileTypes) {
      return names.map(name => {
        const child = hit.rel === '' ? name : `${hit.rel}/${name}`;
        const isDir = dirs.has(key(child));
        return {
          name, parentPath: toPath(p), path: toPath(p),
          isFile: () => !isDir, isDirectory: () => isDir,
          isSymbolicLink: () => false, isBlockDevice: () => false,
          isCharacterDevice: () => false, isFIFO: () => false, isSocket: () => false,
        };
      });
    }
    return names;
  };

  /* The callback forms, so async readers see the same filesystem. */
  const lastArg = args => args[args.length - 1];
  function async(name, sync) {
    const originalFn = original[name];
    fs[name] = function (...args) {
      const p = toPath(args[0]);
      if (look(p) === null) return originalFn.apply(this, args);
      const callback = lastArg(args);
      if (typeof callback !== 'function') return originalFn.apply(this, args);
      let value;
      try { value = sync(...args.slice(0, -1)); }
      catch (error) { return process.nextTick(callback, error); }
      return process.nextTick(callback, null, value);
    };
  }
  async('stat', (p, o) => fs.statSync(p, o));
  async('lstat', (p, o) => fs.lstatSync(p, o));
  async('readFile', (p, o) => fs.readFileSync(p, o));
  async('readdir', (p, o) => fs.readdirSync(p, o));
  async('access', p => fs.accessSync(p));
  async('realpath', p => fs.realpathSync(p));
  /* fs-extra checks for fs.realpath.native and warns when a patch drops it. */
  fs.realpath.native = original.realpath.native;

  const promises = fs.promises;
  for (const [name, sync] of [
    ['stat', (p, o) => fs.statSync(p, o)],
    ['lstat', (p, o) => fs.lstatSync(p, o)],
    ['readFile', (p, o) => fs.readFileSync(p, o)],
    ['readdir', (p, o) => fs.readdirSync(p, o)],
    ['access', p => fs.accessSync(p)],
    ['realpath', p => fs.realpathSync(p)],
  ]) {
    const originalFn = promises[name];
    promises[name] = async function (...args) {
      if (look(toPath(args[0])) === null) return originalFn.apply(this, args);
      return sync(...args);
    };
  }

  fs.createReadStream = function (p, options) {
    const hit = look(toPath(p));
    if (!hit) return original.createReadStream.apply(this, arguments);
    const settings = typeof options === 'string' ? { encoding: options } : (options || {});
    if (hit.kind !== 'file') {
      const stream = new Readable({ read() {} });
      process.nextTick(() => stream.emit('error', enoent(p, 'open')));
      return stream;
    }
    let buffer = contents(hit.entry);
    const start = settings.start || 0;
    const end = settings.end === undefined ? buffer.length - 1 : settings.end;
    buffer = buffer.subarray(start, end + 1);
    const stream = Readable.from([settings.encoding ? buffer.toString(settings.encoding) : buffer]);
    stream.path = toPath(p);
    stream.bytesRead = buffer.length;
    stream.close = callback => { if (callback) process.nextTick(callback); };
    process.nextTick(() => stream.emit('open', -1));
    return stream;
  };

  // ---- CommonJS resolution -------------------------------------------------

  const FILE_EXTS = ['', '.js', '.json', '.node', '.cjs', '.mjs'];

  function isFile(rel) {
    return entries.has(key(rel)) || realExists(path.join(ROOT, rel.split('/').join(path.sep)));
  }
  function isDirectory(rel) {
    if (dirs.has(key(rel))) return true;
    try {
      return original.statSync
        .call(fs, path.join(ROOT, rel.split('/').join(path.sep))).isDirectory();
    } catch { return false; }
  }
  function readJson(rel) {
    try {
      const abs = path.join(ROOT, rel.split('/').join(path.sep));
      return JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch { return null; }
  }
  const absOf = rel => path.join(ROOT, rel.split('/').join(path.sep));

  function loadAsFile(rel) {
    for (const ext of FILE_EXTS) {
      if (ext === '' && rel.endsWith('/')) continue;
      const candidate = rel + ext;
      if (isFile(candidate)) return candidate;
    }
    return null;
  }
  function loadIndex(rel) {
    for (const name of ['index.js', 'index.json', 'index.node']) {
      const candidate = `${rel}/${name}`;
      if (isFile(candidate)) return candidate;
    }
    return null;
  }
  function loadAsDirectory(rel) {
    const pkg = readJson(`${rel}/package.json`);
    if (pkg && typeof pkg.main === 'string' && pkg.main) {
      const main = posixJoin(rel, pkg.main);
      const hit = loadAsFile(main) || loadIndex(main);
      if (hit) return hit;
    }
    return loadIndex(rel);
  }
  function posixJoin(base, rest) {
    const parts = `${base}/${rest}`.split('/');
    const out = [];
    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') out.pop();
      else out.push(part);
    }
    return out.join('/');
  }

  /*
   * package.json "exports", enough of it for a bundle: strings, condition
   * objects, subpath maps, arrays of alternatives and a single "*" pattern.
   * Conditions are the ones Node uses for require(): node, require, default.
   */
  /*
   * The conditions Node applies to require(), including "module-sync" (Node
   * 22.10+), which is how a dual package points require() at its ESM entry.
   * Order comes from the exports object's own keys, exactly as Node does it -
   * a fixed priority list here would pick a different entry than the loader.
   */
  const CONDITIONS = new Set(['node', 'require', 'module-sync', 'default']);
  function resolveExports(pkgRel, subpath) {
    const pkg = readJson(`${pkgRel}/package.json`);
    if (!pkg || pkg.exports === undefined || pkg.exports === null) return null;
    let exports = pkg.exports;
    const request = subpath === '' ? '.' : `./${subpath}`;

    if (typeof exports === 'string' || Array.isArray(exports) ||
        (typeof exports === 'object' && !Object.keys(exports).some(k => k.startsWith('.')))) {
      if (request !== '.') return null;
      exports = { '.': exports };
    }
    let target = exports[request];
    if (target === undefined) {
      let best = null;
      for (const pattern of Object.keys(exports)) {
        const star = pattern.indexOf('*');
        if (star === -1) continue;
        const head = pattern.slice(0, star);
        const tail = pattern.slice(star + 1);
        if (request.startsWith(head) && request.endsWith(tail) &&
            request.length >= head.length + tail.length &&
            (best === null || head.length > best.head.length)) {
          best = { head, tail, target: exports[pattern] };
        }
      }
      if (!best) return null;
      const filled = request.slice(best.head.length, request.length - best.tail.length);
      target = substitute(best.target, filled);
    }
    /* An array of alternatives falls through to the next when one is absent. */
    for (const resolved of candidates(target)) {
      if (typeof resolved !== 'string' || !resolved.startsWith('./')) continue;
      const rel = posixJoin(pkgRel, resolved.slice(2));
      if (isFile(rel)) return rel;
    }
    return null;
  }
  function substitute(target, filled) {
    if (typeof target === 'string') return target.split('*').join(filled);
    if (Array.isArray(target)) return target.map(t => substitute(t, filled));
    if (target && typeof target === 'object') {
      const out = {};
      for (const k of Object.keys(target)) out[k] = substitute(target[k], filled);
      return out;
    }
    return target;
  }
  function candidates(target, out = []) {
    if (typeof target === 'string') { out.push(target); return out; }
    if (Array.isArray(target)) {
      for (const item of target) candidates(item, out);
      return out;
    }
    if (target && typeof target === 'object') {
      for (const condition of Object.keys(target)) {
        if (CONDITIONS.has(condition)) candidates(target[condition], out);
      }
    }
    return out;
  }

  function resolveBare(specifier, fromRel) {
    const slash = specifier.indexOf('/');
    const scoped = specifier.startsWith('@');
    let name = specifier;
    let subpath = '';
    if (scoped) {
      const second = specifier.indexOf('/', slash + 1);
      if (second !== -1) { name = specifier.slice(0, second); subpath = specifier.slice(second + 1); }
    } else if (slash !== -1) {
      name = specifier.slice(0, slash); subpath = specifier.slice(slash + 1);
    }

    let dir = fromRel;
    for (;;) {
      if (!dir.endsWith('/node_modules')) {
        const pkgRel = dir === '' ? `node_modules/${name}` : `${dir}/node_modules/${name}`;
        if (isDirectory(pkgRel)) {
          const viaExports = resolveExports(pkgRel, subpath);
          if (viaExports) return viaExports;
          const target = subpath === '' ? pkgRel : `${pkgRel}/${subpath}`;
          const hit = loadAsFile(target) || loadAsDirectory(target);
          if (hit) return hit;
        }
      }
      if (dir === '') return null;
      const cut = dir.lastIndexOf('/');
      dir = cut === -1 ? '' : dir.slice(0, cut);
    }
  }

  function resolveRequest(specifier, parentAbs) {
    if (path.isAbsolute(specifier) || /^[a-zA-Z]:[\\/]/.test(specifier)) {
      const rel = relOf(specifier);
      if (rel === null) return null;
      return loadAsFile(rel) || loadAsDirectory(rel);
    }
    const parentRel = parentAbs === null ? null : relOf(path.dirname(parentAbs));
    if (parentRel === null) return null;
    if (specifier.startsWith('./') || specifier.startsWith('../') ||
        specifier === '.' || specifier === '..') {
      const target = posixJoin(parentRel, specifier);
      return loadAsFile(target) || loadAsDirectory(target);
    }
    return resolveBare(specifier, parentRel);
  }

  // ---- the loader hooks ----------------------------------------------------

  const Module = require('node:module');
  if (typeof Module.registerHooks !== 'function') {
    throw new Error(
      'wekan-vfs: this Node.js has no module.registerHooks(); Node 22.15 or newer is required.');
  }

  /*
   * The format to declare for a resolved file, or null to declare none.
   *
   * A .node addon MUST get null. Declaring "commonjs" for one makes Node
   * compile the binary as JavaScript and die with "SyntaxError: Invalid or
   * unexpected token" on its Mach-O/PE header - the very failure this whole
   * change exists to remove, reproduced from the other side. With no format
   * Node dispatches on the extension and loads the addon properly.
   */
  function formatOf(rel) {
    if (rel.endsWith('.node')) return null;
    if (rel.endsWith('.json')) return 'json';
    if (rel.endsWith('.cjs')) return 'commonjs';
    if (rel.endsWith('.mjs')) return 'module';
    let dir = rel;
    for (;;) {
      const cut = dir.lastIndexOf('/');
      dir = cut === -1 ? '' : dir.slice(0, cut);
      const pkg = readJson(dir === '' ? 'package.json' : `${dir}/package.json`);
      if (pkg) return pkg.type === 'module' ? 'module' : 'commonjs';
      if (dir === '') return 'commonjs';
    }
  }

  Module.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('node:') || Module.builtinModules.includes(specifier)) {
        return nextResolve(specifier, context);
      }
      let parentAbs = null;
      if (context.parentURL && context.parentURL.startsWith('file:')) {
        try { parentAbs = fileURLToPath(context.parentURL); } catch { parentAbs = null; }
      }
      const inScope = relOf(specifier) !== null ||
        (parentAbs !== null && relOf(parentAbs) !== null);
      if (!inScope) return nextResolve(specifier, context);

      const rel = resolveRequest(specifier, parentAbs);
      if (rel === null) return nextResolve(specifier, context);
      const resolved = { url: pathToFileURL(absOf(rel)).href, shortCircuit: true };
      const format = formatOf(rel);
      if (format !== null) resolved.format = format;
      return resolved;
    },

    load(url, context, nextLoad) {
      if (!url.startsWith('file:')) return nextLoad(url, context);
      let target;
      try { target = fileURLToPath(url); } catch { return nextLoad(url, context); }
      /* .node addons are real files loaded by the OS; never serve those. */
      if (target.endsWith('.node')) return nextLoad(url, context);
      const hit = look(target);
      if (!hit || hit.kind !== 'file') return nextLoad(url, context);
      const rel = hit.entry.rel;
      const format = context.format || formatOf(rel) || 'commonjs';
      return {
        format,
        source: format === 'json' ? contents(hit.entry).toString('utf8') : contents(hit.entry),
        shortCircuit: true,
      };
    },
  });

  /*
   * The layer below the hooks, for callers that skip them.
   *
   * Meteor's runtime.js installs `Module.prototype.resolve = id =>
   * Module._resolveFilename(id, this)` and hands it to reify, so every
   * `import`/`require` inside a Meteor package resolves through
   * Module._resolveFilename DIRECTLY. registerHooks() sits above that call and
   * never sees it - `require()` and `require.resolve()` go through the hooks,
   * but this does not - so without this the server dies on the first module
   * reify asks for. Loading still goes through the load hook: only resolution
   * has to be answered here.
   */
  const resolveFilename = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (typeof request === 'string' &&
        !request.startsWith('node:') && !Module.builtinModules.includes(request)) {
      const parentAbs = parent && typeof parent.filename === 'string'
        ? parent.filename : null;
      if (relOf(request) !== null || (parentAbs !== null && relOf(parentAbs) !== null)) {
        const rel = resolveRequest(request, parentAbs);
        if (rel !== null) return absOf(rel);
      }
    }
    return resolveFilename.apply(this, arguments);
  };

  return {
    installed: true,
    archive: ARCHIVE,
    root: ROOT,
    files: entries.size,
    directories: dirs.size,
    resolve: resolveRequest,
    format: formatOf,
    entryNames: () => [...entries.values()].map(e => e.rel),
    readEntry: rel => {
      const entry = entries.get(key(rel));
      return entry ? contents(entry) : null;
    },
  };
}
