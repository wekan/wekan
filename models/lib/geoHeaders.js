'use strict';

// Where a request came from, when something in front of WeKan already knows.
//
// WeKan does no geolocation of its own: no database to ship, nothing to keep up
// to date, and no lookup of a user's address against a third party. But a CDN or
// proxy in front of it often HAS resolved the address already and says so in a
// header, and that costs nothing to read. Cloudflare, Fastly, CloudFront, Vercel
// and Google's load balancer all do it, with different names for the same
// things.
//
// WHAT IT IS FOR. Admin Panel groups the addresses people log in from, and a
// grouping reads far better as "London" than as `100.100.100.100`: an admin
// recognises their own offices at a glance. The city is a LABEL for a place
// several accounts share, not a fact about any person.
//
// TRUST. These headers are only as good as whatever set them, and anything a
// client can send it can forge. They are therefore used for DISPLAY ONLY - a
// name beside an address, and a map link - and never for a decision. Nothing
// blocks, allows, rate-limits or groups by security on the strength of them. The
// same rule as X-Forwarded-For, one step further: that one at least has
// HTTP_FORWARDED_COUNT to say how much of it to believe, and there is no
// equivalent for a city name.

// header -> field, for every service that sets one. Lower-case: Node
// lower-cases incoming header names.
const SOURCES = [
  // Cloudflare. IPCountry is on by default; City/Region need Managed Transforms.
  { country: 'cf-ipcountry', city: 'cf-ipcity', region: 'cf-region',
    lat: 'cf-iplatitude', lon: 'cf-iplongitude', via: 'Cloudflare' },
  // Fastly, when the geo VCL snippets are enabled.
  { country: 'fastly-client-country-code', city: 'fastly-client-city',
    region: 'fastly-client-region', lat: 'fastly-client-lat',
    lon: 'fastly-client-lon', via: 'Fastly' },
  // AWS CloudFront viewer headers.
  { country: 'cloudfront-viewer-country', city: 'cloudfront-viewer-city',
    region: 'cloudfront-viewer-country-region-name',
    lat: 'cloudfront-viewer-latitude', lon: 'cloudfront-viewer-longitude',
    via: 'CloudFront' },
  // Vercel.
  { country: 'x-vercel-ip-country', city: 'x-vercel-ip-city',
    region: 'x-vercel-ip-country-region', lat: 'x-vercel-ip-latitude',
    lon: 'x-vercel-ip-longitude', via: 'Vercel' },
  // Google Cloud load balancer / Firebase.
  { country: 'x-client-geo-country', city: 'x-client-geo-city',
    region: 'x-client-geo-region', via: 'Google Cloud' },
  // A plain reverse proxy configured by hand. Last, so a real CDN wins.
  { country: 'x-geoip-country', city: 'x-geoip-city', region: 'x-geoip-region',
    lat: 'x-geoip-latitude', lon: 'x-geoip-longitude', via: 'proxy' },
];

const str = v => (typeof v === 'string' ? v.trim() : '');

// A city name arrives percent-encoded from some CDNs (`New%20York`), and Vercel
// documents that explicitly. Decoding is best-effort: a malformed escape is left
// as it came rather than throwing inside a login.
function decode(value) {
  if (!value || !value.includes('%')) return value;
  try { return decodeURIComponent(value); } catch (e) { return value; }
}

const num = v => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// The location a set of request headers carries, or null when none of them do.
//
//   { city: 'London', region: 'England', country: 'GB',
//     latitude: 51.5, longitude: -0.12, via: 'Cloudflare' }
function locationFromHeaders(headers) {
  if (!headers || typeof headers !== 'object') return null;
  const get = name => decode(str(headers[name]));
  for (const src of SOURCES) {
    const country = get(src.country);
    const city = get(src.city);
    const region = get(src.region);
    if (!country && !city && !region) continue;
    // Cloudflare sends XX for "unknown", and T1 for Tor. Neither is a place.
    if (!city && !region && (country === 'XX' || country === 'T1')) continue;
    const location = { via: src.via };
    if (city) location.city = city;
    if (region) location.region = region;
    if (country) location.country = country;
    const lat = src.lat ? num(headers[src.lat]) : null;
    const lon = src.lon ? num(headers[src.lon]) : null;
    if (lat !== null && lon !== null) {
      location.latitude = lat;
      location.longitude = lon;
    }
    return location;
  }
  return null;
}

// The short text a table cell shows: "London", or "London, GB" when the city
// alone could be several places, or just the country when that is all there is.
// One line, never more - the detail is in the popup behind it.
function locationLabel(location) {
  if (!location) return '';
  const { city, region, country } = location;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (region && country) return `${region}, ${country}`;
  return region || country || '';
}

// Can this location be put on a map? Only with coordinates - a city name is not
// a position, and guessing one would be inventing data.
const hasCoordinates = location => !!location
  && typeof location.latitude === 'number'
  && typeof location.longitude === 'number';

// The country's flag, from its ISO 3166-1 alpha-2 code. Regional indicator
// symbols: 'GB' is U+1F1EC U+1F1E7. No image, no table of 250 files to ship and
// keep - the font draws it, and a font that cannot falls back to the two
// letters, which is still the country.
function countryFlag(code) {
  const cc = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '';
  // Cloudflare's XX (unknown) and T1 (Tor) are not countries and have no flag.
  if (cc === 'XX' || cc === 'T1') return '';
  return String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

// What the leftmost cell of an office row shows: the flag, then the city.
//   { flag: '🇬🇧', text: 'London' }
// The city alone is the name an admin recognises; the flag says which London.
function officeLabel(location) {
  if (!location) return { flag: '', text: '' };
  return {
    flag: countryFlag(location.country),
    text: location.city || location.region || location.country || '',
  };
}

module.exports = {
  SOURCES, locationFromHeaders, locationLabel, hasCoordinates, countryFlag, officeLabel,
};
