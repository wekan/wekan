// #3392: parse a card-dependency ("Red Strings") file into a flat list of
// lines: { from, to, type, color, icon, fromCardNumber, toCardNumber,
// fromTitle, toTitle }. Supports the WeKan dependencies JSON export, the WeKan
// dependencies SVG export (round-trippable via its data-* attributes) and a
// generic JSON array of line objects.

function lineFromObject(o) {
  return {
    from: o.from || o.fromId || o.source || null,
    to: o.to || o.toId || o.target || null,
    fromCardNumber: o.fromCardNumber != null ? o.fromCardNumber : o.fromNumber,
    toCardNumber: o.toCardNumber != null ? o.toCardNumber : o.toNumber,
    fromTitle: o.fromTitle || null,
    toTitle: o.toTitle || null,
    type: o.type || undefined,
    color: o.color || undefined,
    icon: o.icon || undefined,
  };
}

function parseJson(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data.map(lineFromObject);
  if (data && Array.isArray(data.lines)) return data.lines.map(lineFromObject);
  return [];
}

function parseSvg(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const paths = doc.querySelectorAll('path.dependency-line, path[data-from]');
  const lines = [];
  paths.forEach(p => {
    const from = p.getAttribute('data-from');
    const to = p.getAttribute('data-to');
    if (!from && !to) return;
    lines.push({
      from,
      to,
      fromCardNumber: p.getAttribute('data-from-number') || undefined,
      toCardNumber: p.getAttribute('data-to-number') || undefined,
      fromTitle: p.getAttribute('data-from-title') || undefined,
      toTitle: p.getAttribute('data-to-title') || undefined,
      type: p.getAttribute('data-type') || undefined,
      color: p.getAttribute('data-color') || undefined,
      icon: p.getAttribute('data-icon') || undefined,
    });
  });
  return lines;
}

// Auto-detect by content (SVG starts with '<'; JSON otherwise). `filename` is an
// optional hint used to disambiguate.
export function parseDependencyLines(text, filename = '') {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];
  const looksSvg =
    /\.svg$/i.test(filename) || trimmed.startsWith('<');
  if (looksSvg) return parseSvg(trimmed);
  return parseJson(trimmed);
}
