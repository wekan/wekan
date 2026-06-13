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

// --- Faithful copy of the GCJ-02 / BD-09 datum conversions (cardDetails.js) -
const GCJ = (() => {
  const PI = Math.PI;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;
  const XPI = (PI * 3000.0) / 180.0;
  const outOfChina = (lat, lon) =>
    lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
  const tLat = (x, y) => {
    let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    r += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
    r += ((20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2) / 3;
    r += ((160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) * 2) / 3;
    return r;
  };
  const tLon = (x, y) => {
    let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    r += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
    r += ((20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2) / 3;
    r += ((150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) * 2) / 3;
    return r;
  };
  const wgs2gcj = (lat, lon) => {
    if (outOfChina(lat, lon)) return [lat, lon];
    let dLat = tLat(lon - 105, lat - 35);
    let dLon = tLon(lon - 105, lat - 35);
    const rad = (lat / 180) * PI;
    let magic = Math.sin(rad);
    magic = 1 - EE * magic * magic;
    const sq = Math.sqrt(magic);
    dLat = (dLat * 180) / (((A * (1 - EE)) / (magic * sq)) * PI);
    dLon = (dLon * 180) / ((A / sq) * Math.cos(rad) * PI);
    return [lat + dLat, lon + dLon];
  };
  const gcj2wgs = (lat, lon) => {
    if (outOfChina(lat, lon)) return [lat, lon];
    let wLat = lat;
    let wLon = lon;
    for (let i = 0; i < 10; i++) {
      const [gLat, gLon] = wgs2gcj(wLat, wLon);
      const dLat = gLat - lat;
      const dLon = gLon - lon;
      if (Math.abs(dLat) < 1e-9 && Math.abs(dLon) < 1e-9) break;
      wLat -= dLat;
      wLon -= dLon;
    }
    return [wLat, wLon];
  };
  const gcj2bd = (lat, lon) => {
    const z = Math.sqrt(lon * lon + lat * lat) + 0.00002 * Math.sin(lat * XPI);
    const theta = Math.atan2(lat, lon) + 0.000003 * Math.cos(lon * XPI);
    return [z * Math.sin(theta) + 0.006, z * Math.cos(theta) + 0.0065];
  };
  const bd2gcj = (lat, lon) => {
    const x = lon - 0.0065;
    const y = lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * XPI);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * XPI);
    return [z * Math.sin(theta), z * Math.cos(theta)];
  };
  return {
    wgs2gcj,
    gcj2wgs,
    wgs2bd: (lat, lon) => {
      if (outOfChina(lat, lon)) return [lat, lon];
      const [gLat, gLon] = wgs2gcj(lat, lon);
      return gcj2bd(gLat, gLon);
    },
    bd2wgs: (lat, lon) => {
      if (outOfChina(lat, lon)) return [lat, lon];
      const [gLat, gLon] = bd2gcj(lat, lon);
      return gcj2wgs(gLat, gLon);
    },
  };
})();

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
  // Match coordinates against a copy with percent-encoded commas/slashes decoded.
  const sd = s.replace(/%2c/gi, ',').replace(/%2f/gi, '/');
  let m;
  // Provider-specific lon,lat forms first (setCoords keeps only the first match).
  if (/yandex\./i.test(sd) && (m = sd.match(new RegExp(`[?&](?:ll|pt)=${N},${N}`)))) setCoords(m[2], m[1]);
  if (/mapy\./i.test(sd) && (m = sd.match(new RegExp(`[?&]y=${N}`)))) {
    const mx = sd.match(new RegExp(`[?&]x=${N}`));
    if (mx) setCoords(m[1], mx[1]);
  }
  if (/2gis\./i.test(sd) && (m = sd.match(new RegExp(`(?:/geo/|[?&]m=)${N},${N}`)))) setCoords(m[2], m[1]);
  if (/amap\./i.test(sd) && (m = sd.match(new RegExp(`[?&]position=${N},${N}`)))) {
    const [wLat, wLon] = GCJ.gcj2wgs(parseFloat(m[2]), parseFloat(m[1]));
    setCoords(wLat, wLon);
  }
  if (/baidu\./i.test(sd) && (m = sd.match(new RegExp(`[?&]location=${N},${N}`)))) {
    const [wLat, wLon] = GCJ.bd2wgs(parseFloat(m[1]), parseFloat(m[2]));
    setCoords(wLat, wLon);
  }
  if (/here\./i.test(sd) && (m = sd.match(new RegExp(`(?:[?&]map=|/l/)${N},${N}`)))) setCoords(m[1], m[2]);
  if ((m = sd.match(new RegExp(`!3d${N}!4d${N}`)))) setCoords(m[1], m[2]);
  if ((m = sd.match(new RegExp(`@${N},${N}`)))) setCoords(m[1], m[2]);
  if ((m = sd.match(new RegExp(`[?&#]mlat=${N}`)))) {
    const mlon = sd.match(new RegExp(`[?&#]mlon=${N}`));
    if (mlon) setCoords(m[1], mlon[1]);
  }
  if ((m = sd.match(new RegExp(`[#&]map=\\d+(?:\\.\\d+)?/${N}/${N}`)))) setCoords(m[1], m[2]);
  if ((m = sd.match(new RegExp(`[?&]cp=${N}~${N}`)))) setCoords(m[1], m[2]);
  if ((m = sd.match(new RegExp(`[?&]ll=${N},${N}`)))) setCoords(m[1], m[2]);
  if ((m = sd.match(new RegExp(`[?&]q=${N},${N}`)))) setCoords(m[1], m[2]);
  if ((m = sd.match(new RegExp(`[?&]center=${N},${N}`)))) setCoords(m[1], m[2]);

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
    // --- USA ---
    case 'google':
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    case 'bing':
      return `https://www.bing.com/maps?cp=${lat}~${lon}&lvl=16`;
    case 'apple':
      return `https://maps.apple.com/?ll=${lat},${lon}`;
    case 'waze':
      return `https://waze.com/ul?ll=${lat},${lon}`;
    // --- Europe ---
    case 'here':
      return `https://wego.here.com/?map=${lat},${lon},16`;
    case 'yandex':
      return `https://yandex.com/maps/?ll=${lon},${lat}&z=16`;
    case 'mapy':
      return `https://mapy.cz/zakladni?x=${lon}&y=${lat}&z=16`;
    case '2gis':
      return `https://2gis.ru/geo/${lon},${lat}`;
    // --- Asia (coordinates converted from WGS-84 into the local datum) ---
    case 'baidu': {
      const [bLat, bLon] = GCJ.wgs2bd(parseFloat(lat), parseFloat(lon));
      return `https://api.map.baidu.com/marker?location=${bLat},${bLon}&output=html`;
    }
    case 'amap': {
      const [gLat, gLon] = GCJ.wgs2gcj(parseFloat(lat), parseFloat(lon));
      return `https://uri.amap.com/marker?position=${gLon},${gLat}`;
    }
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
  // USA
  assert.ok(mapLinkFor('google', 1, 2).startsWith('https://www.google.com/maps/search/?api=1&query=1,2'));
  assert.ok(mapLinkFor('bing', 1, 2).startsWith('https://www.bing.com/maps?cp=1~2'));
  assert.ok(mapLinkFor('apple', 1, 2).startsWith('https://maps.apple.com/?ll=1,2'));
  assert.ok(mapLinkFor('waze', 1, 2).startsWith('https://waze.com/ul?ll=1,2'));
  // Europe
  assert.ok(mapLinkFor('openstreetmap', 1, 2).startsWith('https://www.openstreetmap.org/?mlat=1&mlon=2'));
  assert.ok(mapLinkFor('here', 1, 2).startsWith('https://wego.here.com/?map=1,2,16'));
  // lon,lat order for these providers: lon=2 comes before lat=1.
  assert.ok(mapLinkFor('yandex', 1, 2).startsWith('https://yandex.com/maps/?ll=2,1'));
  assert.ok(mapLinkFor('mapy', 1, 2).startsWith('https://mapy.cz/zakladni?x=2&y=1'));
  assert.ok(mapLinkFor('2gis', 1, 2).startsWith('https://2gis.ru/geo/2,1'));
  // Asia
  assert.ok(mapLinkFor('baidu', 1, 2).startsWith('https://api.map.baidu.com/marker?location=1,2'));
  assert.ok(mapLinkFor('amap', 1, 2).startsWith('https://uri.amap.com/marker?position=2,1'));
  // Unknown provider falls back to OpenStreetMap.
  assert.ok(mapLinkFor('whatever', 1, 2).startsWith('https://www.openstreetmap.org/'));
});

test('mapLinkFor output round-trips back through parseMapLink (osm/bing/apple)', () => {
  // Google uses a ?query=lat,lon search URL which parseMapLink intentionally
  // does not read as coordinates (it expects @lat,lon / ?q=lat,lon), so it is
  // not part of the round-trip set. Every other provider — including the
  // lon,lat-order ones (yandex/mapy/2gis/amap) — must round-trip.
  ['openstreetmap', 'bing', 'apple', 'waze', 'here', 'yandex', 'mapy', '2gis', 'baidu', 'amap'].forEach(p => {
    const url = mapLinkFor(p, 60.17, 24.94);
    const r = parseMapLink(url);
    assert.strictEqual(r.latitude, 60.17, `provider ${p} lat`);
    assert.strictEqual(r.longitude, 24.94, `provider ${p} lon`);
  });
});

test('detects coordinates from real-world provider URLs (incl. %2C and alt forms)', () => {
  const cases = [
    ['https://www.waze.com/ul?ll=45.6906,-120.8109&navigate=yes', 45.6906, -120.8109],
    ['https://waze.com/ul?ll=45.6906%2C-120.8109', 45.6906, -120.8109],
    ['https://wego.here.com/?map=52.5074,13.405,16,normal', 52.5074, 13.405],
    ['https://share.here.com/l/52.5074,13.405,Berlin', 52.5074, 13.405],
    ['https://yandex.com/maps/?ll=37.6203,55.7539&z=12', 55.7539, 37.6203],
    ['https://yandex.ru/maps/?ll=37.6203%2C55.7539&z=12', 55.7539, 37.6203],
    ['https://yandex.ru/maps/?pt=37.6203,55.7539,pm2rdm&z=12', 55.7539, 37.6203],
    ['https://mapy.cz/zakladni?x=14.4378&y=50.0755&z=11', 50.0755, 14.4378],
    ['https://mapy.com/en/zakladni?x=14.4378&y=50.0755&z=11', 50.0755, 14.4378],
    ['https://2gis.ru/moscow?m=37.6203%2C55.7539%2F12', 55.7539, 37.6203],
    // Baidu/Amap apply a datum conversion, so they are covered separately by the
    // "Chinese datum offset" test rather than asserted as exact raw coordinates.
  ];
  cases.forEach(([url, lat, lon]) => {
    const r = parseMapLink(url);
    assert.strictEqual(r.latitude, lat, `lat for ${url}`);
    assert.strictEqual(r.longitude, lon, `lon for ${url}`);
  });
});

test('Baidu/Amap apply the Chinese datum offset and round-trip back to WGS-84', () => {
  const lat = 39.9042; // Beijing — inside mainland China, so the offset applies.
  const lon = 116.4074;
  ['baidu', 'amap'].forEach(p => {
    const url = mapLinkFor(p, lat, lon);
    // The emitted URL carries shifted (non-WGS-84) coordinates.
    const unshifted = p === 'baidu'
      ? `https://api.map.baidu.com/marker?location=${lat},${lon}&output=html`
      : `https://uri.amap.com/marker?position=${lon},${lat}`;
    assert.notStrictEqual(url, unshifted, `${p} URL should be in the local datum`);
    // Parsing converts back to WGS-84 within ~10 m (1e-4 deg).
    const r = parseMapLink(url);
    assert.ok(Math.abs(r.latitude - lat) < 1e-4, `${p} lat round-trip got ${r.latitude}`);
    assert.ok(Math.abs(r.longitude - lon) < 1e-4, `${p} lon round-trip got ${r.longitude}`);
  });
});

test('datum offset is not applied to coordinates outside China', () => {
  // Helsinki is well outside the China bounds, so Baidu/Amap links stay raw.
  assert.ok(mapLinkFor('baidu', 60.17, 24.94).startsWith('https://api.map.baidu.com/marker?location=60.17,24.94'));
  assert.ok(mapLinkFor('amap', 60.17, 24.94).startsWith('https://uri.amap.com/marker?position=24.94,60.17'));
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
