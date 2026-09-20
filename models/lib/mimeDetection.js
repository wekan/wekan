'use strict';
// Full libmagic detection on every server platform. Native file is preferred;
// the bundled WASM engine/database keeps portable and Windows installs offline.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { execFile } = require('node:child_process');
const HEADER_BYTES = 64 * 1024;
let portable;
function nativeOptions() {
  const env = { ...process.env };
  if (env.SNAP && !env.MAGIC) {
    for (const sub of ['usr/lib/file/magic.mgc', 'usr/share/misc/magic.mgc', 'usr/share/file/magic.mgc']) {
      const candidate = path.join(env.SNAP, sub);
      if (fs.existsSync(candidate)) { env.MAGIC = candidate; break; }
    }
  }
  return { timeout: 2000, maxBuffer: 4096, windowsHide: true, env };
}
function nativeMime(args, buffer) {
  return new Promise(resolve => {
    const child = execFile('file', args, nativeOptions(), (error, stdout) => {
      const mime = error ? '' : String(stdout).trim().toLowerCase();
      resolve(/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(mime) ? mime : undefined);
    });
    if (buffer) {
      child.stdin.on('error', () => {});
      child.stdin.end(buffer.subarray(0, HEADER_BYTES));
    }
  });
}
async function portableMime(buffer) {
  if (!portable) {
    // Keep Emscripten's wrapper beside its WASM asset instead of relocating it
    // inside Rspack output. Node also finds checkout node_modules via parents.
    const runtimeRequire = createRequire(path.join(process.cwd(), 'npm', 'package.json'));
    portable = Promise.resolve().then(() => runtimeRequire('wasmagic').WASMagic.create());
    portable.catch(() => { portable = null; });
  }
  const engine = await portable;
  return String(engine.detect(buffer.subarray(0, HEADER_BYTES))).trim().toLowerCase();
}
async function detectMimeBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) throw new TypeError('Expected file bytes');
  const bytes = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength).subarray(0, HEADER_BYTES);
  const native = await nativeMime(['--mime-type', '-b', '-'], bytes);
  if (native) return native;
  try { return await portableMime(bytes); } catch (_) { return undefined; }
}
async function detectMimeFile(filename) {
  const native = await nativeMime(['--mime-type', '-b', '--', String(filename)]);
  if (native) return native;
  let handle;
  try {
    if (!(await fs.promises.stat(filename)).isFile()) return undefined;
    handle = await fs.promises.open(filename, fs.constants.O_RDONLY | (fs.constants.O_NONBLOCK || 0));
    if (!(await handle.stat()).isFile()) return undefined;
    const buffer = Buffer.alloc(HEADER_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return await portableMime(buffer.subarray(0, bytesRead));
  } catch (_) { return undefined; }
  finally { if (handle) await handle.close(); }
}
module.exports = { detectMimeFile, detectMimeBuffer, HEADER_BYTES };
