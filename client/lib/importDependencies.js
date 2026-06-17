// #3392: parse a card-dependency ("Red Strings") file into a flat list of
// lines: { from, to, type, color, icon, fromCardNumber, toCardNumber,
// fromTitle, toTitle }. Supports the WeKan dependencies JSON export, the WeKan
// dependencies SVG export (round-trippable via its data-* attributes), a
// generic JSON array/`lines` of line objects, and a best-effort mapping of
// Miro REST API connectors (items + connectors). Cards are matched in the
// target board by id, then card number, then title (see importBoardDependencies).
//
// Kendis and piplanning.io are proprietary tools without a documented public
// dependency file format; export their links from their API as the generic JSON
// shape `{ "lines": [ { "fromTitle": "...", "toTitle": "...", "type": "blocks" } ] }`
// and import that here.

// Strip HTML tags safely. A single `replace(/<[^>]*>/g, '')` is an incomplete
// multi-character sanitization (CodeQL js/incomplete-multi-character-sanitization):
//   1. removing one match can splice surrounding text into a new match, so the
//      replacement is looped to a fixed point; and
//   2. a dangling, unclosed tag with no ">" (e.g. a trailing "<script" or
//      "<svg/onload=...") is never matched by the regex at all and would survive,
//      so any stray "<"/">" left over is removed afterwards.
// Together these guarantee no "<tag" (complete or partial) can remain.
function stripHtml(s) {
  let str = String(s == null ? '' : s);
  let prev;
  do {
    prev = str;
    str = str.replace(/<[^>]*>/g, '');
  } while (str !== prev);
  return str.replace(/[<>]/g, '').trim();
}

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

// Best-effort mapping of Miro REST API data: an `items` (or `data`) array with
// titles, and a `connectors` array whose entries reference startItem/endItem ids.
// Connectors are mapped to lines and item ids resolved to titles so they can be
// matched to WeKan cards by title. A connector caption containing "block"/"fix"
// is mapped to the corresponding relation type.
function parseMiro(data) {
  const items = data.items || data.data || [];
  const titleById = {};
  (Array.isArray(items) ? items : []).forEach(it => {
    if (!it || !it.id) return;
    const title = stripHtml(
      (it.data && (it.data.title || it.data.content)) || it.title || it.content,
    );
    if (title) titleById[it.id] = title;
  });
  const connectors = Array.isArray(data) ? data : data.connectors || [];
  return (connectors || [])
    .map(c => {
      const from = c.startItem && c.startItem.id;
      const to = c.endItem && c.endItem.id;
      const caption =
        (c.captions && c.captions[0] && stripHtml(c.captions[0].content)) || '';
      const cl = caption.toLowerCase();
      let type;
      if (cl.includes('block')) type = 'blocks';
      else if (cl.includes('fix')) type = 'fixes';
      return {
        from,
        to,
        fromTitle: titleById[from] || null,
        toTitle: titleById[to] || null,
        type,
      };
    })
    .filter(l => l.from || l.to || l.fromTitle || l.toTitle);
}

function looksLikeMiro(data) {
  if (data && Array.isArray(data.connectors)) return true;
  if (
    Array.isArray(data) &&
    data.some(o => o && (o.startItem || o.endItem))
  ) {
    return true;
  }
  return false;
}

function parseJson(text) {
  const data = JSON.parse(text);
  if (looksLikeMiro(data)) return parseMiro(data);
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
