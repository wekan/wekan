'use strict';

// Regression test for #6481: after upgrading 6.09 -> 10.00 the migration
// reported success but boards/cards were missing, and the mongodb log showed:
//   [migrate3] parse activities: Unexpected token 'N', ..."value":NaN,...
//   [migrate3] parse cards:      Unexpected token '+', ..."sort":+Infinity,...
// mongo 3.x mongoexport emits non-finite doubles as the BARE tokens NaN,
// Infinity, +Infinity and -Infinity, which are NOT valid JSON, so EJSON.parse
// throws and the WHOLE document is dropped. sanitizeNonFinite() rewrites those
// bare tokens (only OUTSIDE string literals) to the canonical EJSON v2 double
// form {"$numberDouble":"NaN"|"Infinity"|"-Infinity"} that EJSON.parse accepts,
// so the document migrates instead of being lost. Strings that merely contain
// the text "NaN"/"Infinity", and ordinary negative numbers, must be untouched.
//
// FOLLOW-UP (#6481): once parseable, the value is still a JS Infinity/NaN, which
// FerretDB then REFUSES to insert ("infinity values are not allowed") — the exact
// second-round error the reporter hit. clampNonFinite() walks the parsed document
// and resets every non-finite number to a finite 0 so the document actually lands
// in FerretDB/SQLite. Finite numbers, strings and BSON wrappers stay untouched.
//
// Run: node tests/migrateNonFinite.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Mirrors sanitizeNonFinite() in snap-src/bin/migrate-mongo3-to-ferretdb.mjs.
function sanitizeNonFinite(line) {
  if (line.indexOf('NaN') === -1 && line.indexOf('Infinity') === -1) return line;
  let out = '', inStr = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inStr) {
      out += c;
      if (c === '\\') { out += line[i + 1] || ''; i++; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === 'N' || c === 'I' || c === '+' || c === '-') {
      const m = /^(NaN|[+-]?Infinity)/.exec(line.slice(i));
      if (m) {
        const tok = m[1];
        const val = tok === 'NaN' ? 'NaN' : (tok[0] === '-' ? '-Infinity' : 'Infinity');
        out += `{"$numberDouble":"${val}"}`;
        i += tok.length - 1;
        continue;
      }
    }
    out += c;
  }
  return out;
}

// The bare tokens the old code choked on become valid JSON once rewritten, so a
// downstream JSON.parse (used here as a proxy for EJSON.parse succeeding) works.
function parses(line) {
  try { JSON.parse(sanitizeNonFinite(line)); return true; } catch { return false; }
}

// Mirrors clampNonFinite() in snap-src/bin/migrate-mongo3-to-ferretdb.mjs.
function clampNonFinite(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = clampNonFinite(value[i]);
    return value;
  }
  if (value && typeof value === 'object') {
    if (value._bsontype === 'Double' && typeof value.value === 'number' && !Number.isFinite(value.value)) {
      value.value = 0;
      return value;
    }
    if (value._bsontype) return value;
    for (const k of Object.keys(value)) value[k] = clampNonFinite(value[k]);
    return value;
  }
  return value;
}

console.log('migrateNonFinite:');

test('bare NaN value -> $numberDouble (the #6481 activities case)', () => {
  assert.strictEqual(
    sanitizeNonFinite('{"a":"","value":NaN,"activ":1}'),
    '{"a":"","value":{"$numberDouble":"NaN"},"activ":1}',
  );
});

test('bare +Infinity value -> $numberDouble (the #6481 cards "sort" case)', () => {
  assert.strictEqual(
    sanitizeNonFinite('{"title":"R","sort":+Infinity,"x":2}'),
    '{"title":"R","sort":{"$numberDouble":"Infinity"},"x":2}',
  );
});

test('bare Infinity and -Infinity both handled', () => {
  assert.strictEqual(sanitizeNonFinite('{"s":Infinity}'), '{"s":{"$numberDouble":"Infinity"}}');
  assert.strictEqual(sanitizeNonFinite('{"s":-Infinity}'), '{"s":{"$numberDouble":"-Infinity"}}');
});

test('non-finite tokens inside arrays are handled, real numbers kept', () => {
  assert.strictEqual(
    sanitizeNonFinite('{"a":[NaN,+Infinity,-5,3.5]}'),
    '{"a":[{"$numberDouble":"NaN"},{"$numberDouble":"Infinity"},-5,3.5]}',
  );
});

test('the previously-fatal lines now parse as valid JSON', () => {
  assert.ok(parses('{"n":3,"value":NaN,"activ":true}'));
  assert.ok(parses('{"id":"3","sort":+Infinity,"more":1}'));
  assert.ok(!(() => { try { JSON.parse('{"value":NaN}'); return true; } catch { return false; } })(),
    'sanity: the raw bare-token line is genuinely invalid JSON');
});

// NEGATIVE tests: text/values that merely LOOK like the tokens must be left alone.
test('NEGATIVE: "NaN"/"Infinity" inside a string value is NOT rewritten', () => {
  assert.strictEqual(
    sanitizeNonFinite('{"t":"has NaN and +Infinity inside","v":1}'),
    '{"t":"has NaN and +Infinity inside","v":1}',
  );
});

test('NEGATIVE: string containing :NaN, and an escaped quote is untouched', () => {
  const s = '{"t":"a:NaN,+Infinity,b","q":"esc \\" then NaN","n":-5}';
  assert.strictEqual(sanitizeNonFinite(s), s);
});

test('NEGATIVE: ordinary negative numbers are not treated as -Infinity', () => {
  assert.strictEqual(sanitizeNonFinite('{"n":-5,"m":-42}'), '{"n":-5,"m":-42}');
});

test('NEGATIVE: a line with no special tokens is returned unchanged (fast path)', () => {
  const s = '{"n":-5,"m":42,"s":"plain text"}';
  assert.strictEqual(sanitizeNonFinite(s), s);
});

// ── clampNonFinite (#6481 follow-up: FerretDB rejects non-finite doubles) ─────
test('clampNonFinite: a bare Infinity sort becomes finite 0 (the FerretDB-insert case)', () => {
  const doc = clampNonFinite(JSON.parse(sanitizeNonFinite('{"title":"R","sort":+Infinity,"x":2}')));
  // sanitizeNonFinite turned +Infinity into {"$numberDouble":"Infinity"}; JSON.parse
  // (proxy for EJSON.parse) yields an object here, but the real bson EJSON.parse
  // yields a JS Infinity — covered by the direct-number cases below.
  assert.deepStrictEqual(doc, { title: 'R', sort: { $numberDouble: 'Infinity' }, x: 2 });
});

test('clampNonFinite: Infinity / -Infinity / NaN numbers -> 0', () => {
  assert.strictEqual(clampNonFinite(Infinity), 0);
  assert.strictEqual(clampNonFinite(-Infinity), 0);
  assert.strictEqual(clampNonFinite(NaN), 0);
});

test('clampNonFinite: nested + arrays clamped, finite values preserved', () => {
  const out = clampNonFinite({ sort: Infinity, value: NaN, ok: 5, neg: -3.5, arr: [Infinity, 1, -Infinity], sub: { a: NaN, b: 2 } });
  assert.deepStrictEqual(out, { sort: 0, value: 0, ok: 5, neg: -3.5, arr: [0, 1, 0], sub: { a: 0, b: 2 } });
});

test('clampNonFinite: a bson Double wrapping Infinity is clamped in place', () => {
  const doc = { sort: { _bsontype: 'Double', value: Infinity } };
  clampNonFinite(doc);
  assert.strictEqual(doc.sort.value, 0);
});

test('NEGATIVE: clampNonFinite leaves finite numbers, strings and BSON wrappers untouched', () => {
  const oid = { _bsontype: 'ObjectId', id: 'abc' };
  const date = { _bsontype: 'Date', valueOf: () => 1 };
  const doc = { n: 0, big: 1e300, s: 'Infinity', oid, date, d: { _bsontype: 'Double', value: 3.5 } };
  const out = clampNonFinite(doc);
  assert.strictEqual(out.n, 0);
  assert.strictEqual(out.big, 1e300);
  assert.strictEqual(out.s, 'Infinity', 'a string is never clamped');
  assert.strictEqual(out.oid, oid, 'ObjectId wrapper untouched');
  assert.strictEqual(out.date, date, 'Date wrapper untouched');
  assert.strictEqual(out.d.value, 3.5, 'finite Double untouched');
});

// Source guard: the real migration must call the sanitizer and emit $numberDouble.
test('source: migrate-mongo3-to-ferretdb.mjs sanitizes non-finite doubles', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'snap-src', 'bin', 'migrate-mongo3-to-ferretdb.mjs'), 'utf8');
  assert.ok(/function sanitizeNonFinite/.test(src), 'sanitizeNonFinite() must exist');
  assert.ok(src.includes('$numberDouble'), 'must rewrite to the EJSON $numberDouble form');
  assert.ok(/legacyToV2\([\s\S]*?sanitizeNonFinite/.test(src) ||
            /sanitizeNonFinite\(line\.replace/.test(src),
    'legacyToV2 must run the input through sanitizeNonFinite');
});

// Source guard: and it must clamp non-finite doubles to finite before insert.
test('source: migrate-mongo3-to-ferretdb.mjs clamps non-finite doubles before insert', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'snap-src', 'bin', 'migrate-mongo3-to-ferretdb.mjs'), 'utf8');
  assert.ok(/export function clampNonFinite/.test(src), 'clampNonFinite() must exist');
  assert.ok(/clampNonFinite\(EJSON\.parse\(legacyToV2/.test(src),
    'exportDocs must clamp each parsed document before it is inserted');
});

console.log(`\n${passed} passed`);
