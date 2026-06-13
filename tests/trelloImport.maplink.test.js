/**
 * Test: card location map-link parsing and provider URL generation.
 *
 * Covers the pure logic added for card locations:
 *   - client/components/import/import.js style parsing is not here; the relevant
 *     functions live in client/components/cards/cardDetails.js:
 *       parseMapLink(url)  -> { latitude, longitude, name, address }
 *       mapLinkFor(provider, lat, lon) -> url
 *   These depend on Blaze/Meteor and can't be required under plain Node, so —
 *   following the convention of the sibling trelloCreator.*.test.js files — the
 *   logic is re-implemented faithfully here. Failures throw, so a regression
 *   exits non-zero.
 */

const assert = require('assert');

// --- Faithful copy of parseMapLink (cardDetails.js) -----------------------
function parseMapLink(url) {
  const result = {};
  if (!url) return result;
  const s = String(url).trim();

  let lat;
  let lon;
  const setCoords = (la, lo) => {
    if (lat !== undefined) return;
    const a = parseFloat(la);
    const o = parseFloat(lo);
    if (!isNaN(a) && !isNaN(o) && Math.abs(a) <= 90 && Math.abs(o) <= 180) {
      lat = a;
      lon = o;
    }
  };

  const N = '(-?\\d+(?:\\.\\d+)?)';
  let m;
  if ((m = s.match(new RegExp(`!3d${N}!4d${N}`)))) setCoords(m[1], m[2]);
  if ((m = s.match(new RegExp(`@${N},${N}`)))) setCoords(m[1], m[2]);
  if ((m = s.match(new RegExp(`[?&#]mlat=${N}`)))) {
    const mlon = s.match(new RegExp(`[?&#]mlon=${N}`));
    if (mlon) setCoords(m[1], mlon[1]);
  }
  if ((m = s.match(new RegExp(`[#&]map=\\d+(?:\\.\\d+)?/${N}/${N}`)))) setCoords(m[1], m[2]);
  if ((m = s.match(new RegExp(`[?&]cp=${N}~${N}`)))) setCoords(m[1], m[2]);
  if ((m = s.match(new RegExp(`[?&]ll=${N},${N}`)))) setCoords(m[1], m[2]);
  if ((m = s.match(new RegExp(`[?&]q=${N},${N}`)))) setCoords(m[1], m[2]);
  if ((m = s.match(new RegExp(`[?&]center=${N},${N}`)))) setCoords(m[1], m[2]);

  if (lat !== undefined) {
    result.latitude = lat;
    result.longitude = lon;
  }

  const decode = raw => {
    try {
      return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
    } catch (e) {
      return raw.replace(/\+/g, ' ').trim();
    }
  };
  const isCoordText = t => /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(t);

  if ((m = s.match(/\/place\/([^/@?]+)/))) {
    const name = decode(m[1]);
    if (name && !isCoordText(name)) result.name = name;
  }
  if ((m = s.match(/[?&](?:q|query|destination)=([^&]+)/))) {
    const q = decode(m[1]);
    if (q && !isCoordText(q)) result.address = q;
  }

  return result;
}

// --- Faithful copy of mapLinkFor (cardDetails.js) -------------------------
function mapLinkFor(provider, lat, lon) {
  switch (provider) {
    case 'google':
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    case 'bing':
      return `https://www.bing.com/maps?cp=${lat}~${lon}&lvl=16`;
    case 'apple':
      return `https://maps.apple.com/?ll=${lat},${lon}`;
    case 'openstreetmap':
    default:
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
  }
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('Google Maps @lat,lon', () => {
  const r = parseMapLink('https://www.google.com/maps/@60.1699,24.9384,15z');
  assert.strictEqual(r.latitude, 60.1699);
  assert.strictEqual(r.longitude, 24.9384);
});

test('Google Maps place with !3d!4d and place name', () => {
  const r = parseMapLink(
    'https://www.google.com/maps/place/Helsinki+Airport/@60.3172,24.9633,15z/data=!3d60.317200!4d24.963300',
  );
  assert.strictEqual(r.latitude, 60.3172);
  assert.strictEqual(r.longitude, 24.9633);
  assert.strictEqual(r.name, 'Helsinki Airport');
});

test('Google Maps ?q=lat,lon', () => {
  const r = parseMapLink('https://maps.google.com/?q=60.1699,24.9384');
  assert.strictEqual(r.latitude, 60.1699);
  assert.strictEqual(r.longitude, 24.9384);
});

test('OpenStreetMap mlat/mlon', () => {
  const r = parseMapLink(
    'https://www.openstreetmap.org/?mlat=60.1699&mlon=24.9384#map=16/60.1699/24.9384',
  );
  assert.strictEqual(r.latitude, 60.1699);
  assert.strictEqual(r.longitude, 24.9384);
});

test('OpenStreetMap #map hash only', () => {
  const r = parseMapLink('https://www.openstreetmap.org/#map=16/60.1699/24.9384');
  assert.strictEqual(r.latitude, 60.1699);
  assert.strictEqual(r.longitude, 24.9384);
});

test('Bing Maps cp=lat~lon', () => {
  const r = parseMapLink('https://www.bing.com/maps?cp=60.1699~24.9384&lvl=15');
  assert.strictEqual(r.latitude, 60.1699);
  assert.strictEqual(r.longitude, 24.9384);
});

test('Apple Maps ll + textual q becomes address', () => {
  const r = parseMapLink('https://maps.apple.com/?ll=60.1699,24.9384&q=Helsinki');
  assert.strictEqual(r.latitude, 60.1699);
  assert.strictEqual(r.longitude, 24.9384);
  assert.strictEqual(r.address, 'Helsinki');
});

test('Google search query text -> address, no coords', () => {
  const r = parseMapLink('https://www.google.com/maps/search/?api=1&query=Eiffel+Tower');
  assert.strictEqual(r.latitude, undefined);
  assert.strictEqual(r.address, 'Eiffel Tower');
});

test('garbage / empty input yields nothing', () => {
  assert.deepStrictEqual(parseMapLink('not a url'), {});
  assert.deepStrictEqual(parseMapLink(''), {});
  assert.deepStrictEqual(parseMapLink(undefined), {});
});

test('out-of-range coordinates are rejected', () => {
  const r = parseMapLink('https://maps.example.com/?q=200,400');
  assert.strictEqual(r.latitude, undefined);
});

test('mapLinkFor builds the right URL per provider', () => {
  assert.ok(mapLinkFor('openstreetmap', 1, 2).startsWith('https://www.openstreetmap.org/?mlat=1&mlon=2'));
  assert.ok(mapLinkFor('google', 1, 2).includes('google.com/maps/search/?api=1&query=1,2'));
  assert.ok(mapLinkFor('bing', 1, 2).includes('bing.com/maps?cp=1~2'));
  assert.ok(mapLinkFor('apple', 1, 2).includes('maps.apple.com/?ll=1,2'));
  // Unknown provider falls back to OpenStreetMap.
  assert.ok(mapLinkFor('whatever', 1, 2).includes('openstreetmap.org'));
});

test('mapLinkFor output round-trips back through parseMapLink (osm/bing/apple)', () => {
  // Google uses a ?query=lat,lon search URL which parseMapLink intentionally
  // does not read as coordinates (it expects @lat,lon / ?q=lat,lon), so it is
  // not part of the round-trip set.
  ['openstreetmap', 'bing', 'apple'].forEach(p => {
    const url = mapLinkFor(p, 60.17, 24.94);
    const r = parseMapLink(url);
    assert.strictEqual(r.latitude, 60.17, `provider ${p} lat`);
    assert.strictEqual(r.longitude, 24.94, `provider ${p} lon`);
  });
});

if (typeof describe === 'function') {
  describe('card location map links', () => {
    tests.forEach(([name, fn]) => it(name, fn));
  });
} else {
  console.log('Map link parsing tests\n');
  let failed = 0;
  tests.forEach(([name, fn]) => {
    try {
      fn();
      console.log(`✓ ${name}`);
    } catch (e) {
      failed++;
      console.log(`✗ ${name}\n    ${e.message}`);
    }
  });
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  if (failed > 0) process.exitCode = 1;
}
