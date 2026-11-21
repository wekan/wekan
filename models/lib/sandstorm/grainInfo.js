// The `metadata` file of a Sandstorm grain backup (.zip): a GrainInfo struct
// (sandstorm-io/sandstorm src/sandstorm/grain.capnp) as an unpacked Cap'n
// Proto message, which backup.c++ writes and restores as it is. Read and
// written in plain JavaScript, without a Cap'n Proto library, so
// tests/sandstormGrain.test.cjs runs it in Node.
//
//   struct GrainInfo {
//     appId @0 :Text;          appVersion @1 :UInt32;     title @2 :Text;
//     ownerIdentityId @3 :Text; users @4 :List(User);   originalGrainId @5 :Text;
//     struct User { identityId @0 :Text; credentialIds @1 :List(Text);
//                   profile @2 :Identity.Profile; }
//   }
//   struct Profile { displayName @0 :LocalizedText; preferredHandle @1 :Text;
//                    picture @2 :StaticAsset; pronouns @3 :Pronouns; }
//   struct LocalizedText { defaultText @0 :Text; localizations @1 :List(...); }
//
// The struct's data section holds appVersion; its pointers, in this order,
// appId, title, ownerIdentityId, users and originalGrainId.

export const MAX_GRAIN_INFO_BYTES = 1024 * 1024;

function reader(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input || []);
  if (bytes.length < 16 || bytes.length > MAX_GRAIN_INFO_BYTES) throw new Error('The grain metadata is not a GrainInfo message');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const segments = view.getUint32(0, true) + 1;
  if (segments !== 1) throw new Error('The grain metadata has more than one segment');
  const words = view.getUint32(4, true);
  const base = 8;
  if (base + words * 8 > bytes.length) throw new Error('The grain metadata is shorter than it says');
  const end = base + words * 8;
  let visits = 0;
  const word = at => {
    visits += 1;
    if (visits > 100000) throw new Error('The grain metadata is too deeply linked');
    if (at < base || at + 8 > end) throw new Error('The grain metadata points outside itself');
    return { lo: view.getUint32(at, true), hi: view.getUint32(at + 4, true) };
  };
  // A struct pointer at `at`: { data, dataWords, ptrs, ptrCount } or null.
  const struct = at => {
    const { lo, hi } = word(at);
    if (lo === 0 && hi === 0) return null;
    if ((lo & 3) !== 0) throw new Error('The grain metadata has a pointer that is not a struct');
    const offset = (lo | 0) >> 2;
    const data = at + 8 + offset * 8;
    return { data, dataWords: hi & 0xffff, ptrs: data + (hi & 0xffff) * 8, ptrCount: hi >>> 16 };
  };
  const ptr = (s, i) => (s && i < s.ptrCount ? s.ptrs + i * 8 : null);
  const text = at => {
    if (at === null) return '';
    const { lo, hi } = word(at);
    if (lo === 0 && hi === 0) return '';
    if ((lo & 3) !== 1 || (hi & 7) !== 2) throw new Error('The grain metadata has text that is not a byte list');
    const start = at + 8 + ((lo | 0) >> 2) * 8;
    const count = hi >>> 3;
    if (start + count > end) throw new Error('The grain metadata points outside itself');
    return new TextDecoder('utf-8').decode(bytes.subarray(start, start + Math.max(0, count - 1)));
  };
  // A list of structs (composite): their struct descriptors.
  const structs = at => {
    if (at === null) return [];
    const { lo, hi } = word(at);
    if (lo === 0 && hi === 0) return [];
    if ((lo & 3) !== 1 || (hi & 7) !== 7) throw new Error('The grain metadata has a list that is not of structs');
    const tagAt = at + 8 + ((lo | 0) >> 2) * 8;
    const tag = word(tagAt);
    const count = tag.lo >>> 2;
    const dataWords = tag.hi & 0xffff;
    const ptrCount = tag.hi >>> 16;
    const size = (dataWords + ptrCount) * 8;
    if (count > 10000) throw new Error('The grain metadata lists too many users');
    return Array.from({ length: count }, (_, n) => {
      const data = tagAt + 8 + n * size;
      return { data, dataWords, ptrs: data + dataWords * 8, ptrCount };
    });
  };
  const textList = at => {
    if (at === null) return [];
    const { lo, hi } = word(at);
    if (lo === 0 && hi === 0) return [];
    if ((lo & 3) !== 1 || (hi & 7) !== 6) return [];
    const start = at + 8 + ((lo | 0) >> 2) * 8;
    return Array.from({ length: Math.min(hi >>> 3, 1000) }, (_, n) => text(start + n * 8));
  };
  return { view, struct, ptr, text, structs, textList, base };
}

export function readGrainInfo(input) {
  const r = reader(input);
  const root = r.struct(r.base);
  if (!root) throw new Error('The grain metadata is empty');
  const users = r.structs(r.ptr(root, 3)).map(user => {
    const profile = r.struct(r.ptr(user, 2));
    const displayName = profile ? r.struct(r.ptr(profile, 0)) : null;
    return {
      identityId: r.text(r.ptr(user, 0)),
      credentialIds: r.textList(r.ptr(user, 1)),
      name: displayName ? r.text(r.ptr(displayName, 0)) : '',
      handle: profile ? r.text(r.ptr(profile, 1)) : '',
    };
  });
  return {
    appId: r.text(r.ptr(root, 0)),
    appVersion: root.dataWords ? r.view.getUint32(root.data, true) : 0,
    title: r.text(r.ptr(root, 1)),
    ownerIdentityId: r.text(r.ptr(root, 2)),
    users,
    originalGrainId: r.text(r.ptr(root, 4)),
  };
}

// A GrainInfo of the app, its version and the grain's title, with no owner
// and no users: whoever restores the grain owns it.
export function writeGrainInfo({ appId, appVersion = 0, title = '' } = {}) {
  if (!/^[0-9a-z]{52}$/.test(String(appId || ''))) throw new Error('A grain needs the app id of a Sandstorm app');
  const enc = s => new TextEncoder().encode(String(s || ''));
  const texts = [enc(appId), enc(title)];
  const textWords = texts.map(t => Math.ceil((t.length + 1) / 8));
  // root pointer (1) + struct data (1) + 5 pointers + the texts.
  const words = 1 + 1 + 5 + textWords.reduce((a, b) => a + b, 0);
  const out = new Uint8Array(8 + words * 8);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0, true);
  view.setUint32(4, words, true);
  const base = 8;
  // Root struct pointer: offset 0, data 1 word, 5 pointers.
  view.setUint32(base, 0, true);
  view.setUint32(base + 4, 1 | (5 << 16), true);
  view.setUint32(base + 8, Number(appVersion) >>> 0, true);
  const ptrs = base + 16;
  let next = ptrs + 5 * 8;
  [[0, texts[0], textWords[0]], [1, texts[1], textWords[1]]].forEach(([i, t, w]) => {
    const at = ptrs + i * 8;
    const offset = (next - (at + 8)) / 8;
    view.setUint32(at, ((offset << 2) | 1) >>> 0, true);
    view.setUint32(at + 4, (2 | ((t.length + 1) << 3)) >>> 0, true);
    out.set(t, next);
    next += w * 8;
  });
  return out;
}
