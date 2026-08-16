'use strict';

// "Open in map" links, in one place.
//
// The card details pane has offered these since locations were added; Admin
// Panel now needs the same thing for the places accounts log in from, so the
// builder moved here rather than being written twice. One implementation means
// a provider added for the card is a provider the Admin Panel gets too, and the
// user's own `profile.mapProvider` choice applies in both.

// Chinese datum conversions ("eviltransform" algorithm). Baidu Maps uses BD-09
// and Amap (Gaode) uses GCJ-02; both are offset from the WGS-84 coordinates
// Wekan stores, so a raw lat/lon would land a few hundred metres off. Convert on
// the way out (mapLinkFor) and back (parseMapLink). Coordinates outside mainland
// China use no offset, so every non-Chinese provider is unaffected.
const GCJ = (() => {
  const PI = Math.PI;
  const A = 6378245.0; // Krasovsky 1940 semi-major axis
  const EE = 0.00669342162296594323; // eccentricity squared
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
  // Approximate inverse by fixed-point iteration (converges to ~1e-9 deg).
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

// Build an "open in map" link for the given provider and coordinates. Mirrors
// the providers offered in the location popup's "Open map links at" selector,
// grouped by region (USA, Europe, Asia). Note that several non-US providers
// expect the coordinates in lon,lat order rather than lat,lon.
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

module.exports = { mapLinkFor, GCJ };
