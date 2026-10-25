'use strict';

// A streaming SVG sanitizer: any size, in one pass, with bounded memory.
//
// SVG is XML that can carry active content. This removes, wherever it is - in
// the first byte or the last, split across any two chunks:
//
//   - elements that run script or load other documents, with everything inside
//     them: script, foreignObject, iframe, object, embed, handler, the SMIL
//     elements set / animate* (which can rewrite an href to javascript:), and
//     meta, link, base;
//   - every event-handler attribute (onload, onclick, ...);
//   - any attribute whose value - its character references decoded and the
//     characters a browser ignores in a URL scheme removed - contains
//     javascript: or vbscript:, an href-like one that is a data:text/html or
//     data:application/ URL, and a style attribute or <style> sheet with
//     javascript:, vbscript:, expression(, -moz-binding, behavior: or @import;
//   - DOCTYPE with its internal subset, ENTITY declarations (XML loops,
//     external entities), and processing instructions other than the XML
//     declaration (xml-stylesheet);
//   - and nothing else: comments and CDATA are text and pass through as they are.
//
// What it keeps, it keeps byte for byte: the input is read as one byte per
// character (latin1), so UTF-8 and every other ASCII-compatible encoding passes
// through unchanged. UTF-16 - recognised by its byte order mark, or by the
// zero bytes of `<?` - is decoded and written as UTF-8 instead, because a
// byte-wise look at it would not see `<script` at all; its XML declaration is
// dropped, since it would name the wrong encoding. A tag or a <style> sheet
// longer than MAX_MARKUP_CHARS is dropped (it cannot be checked within the
// bound), and so is its element.
//
// models/lib/sanitizeSvg.js (uploads, sanitizeSvgContent) and
// server/lib/svgResponse.js (serving) both use it.

const { Transform } = require('stream');

const MAX_MARKUP_CHARS = 32 * 1024 * 1024;

// How much of what was removed is kept for the log.
const REMOVED_SAMPLE_CHARS = 4096;

// Elements removed with their whole content.
const DROP_ELEMENTS = new Set([
  'script', 'foreignobject', 'iframe', 'object', 'embed', 'handler', 'set',
  'animate', 'animatetransform', 'animatemotion', 'animatecolor', 'discard',
  'meta', 'link', 'base', 'frame', 'frameset', 'applet', 'listener',
]);

// Attributes whose value is a URL a browser may follow.
const URL_ATTRIBUTES = new Set(['href', 'xlink:href', 'src', 'action', 'formaction', 'xml:base', 'data', 'background', 'poster']);

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", colon: ':', tab: '\t', newline: '\n', nbsp: ' ', lpar: '(', rpar: ')', sol: '/', bsol: '\\' };

function decodeReferences(value) {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);?/gi, (all, ref) => {
    if (ref[0] === '#') {
      const code = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
      try { return String.fromCodePoint(code); } catch (e) { return ''; }
    }
    const named = NAMED[ref.toLowerCase()];
    return named !== undefined ? named : all;
  });
}

// The value as a browser compares it: references decoded, every control
// character, space and the characters ignored inside a scheme removed.
function normalizedValue(raw) {
  // eslint-disable-next-line no-control-regex
  return decodeReferences(raw).replace(/[\u0000-\u0020\u007f-\u00a0\u00ad\u200b-\u200f\u2028\u2029\ufeff]/g, '').toLowerCase();
}

const SCRIPT_SCHEMES = /javascript:|vbscript:|livescript:|mocha:/;
const CSS_DANGER = /javascript:|vbscript:|expression\(|-moz-binding|behavior:|@import|url\((?:'|")?(?:javascript|vbscript):/;

function attributeIsDangerous(name, rawValue) {
  const n = name.toLowerCase();
  const local = n.includes(':') ? n.slice(n.lastIndexOf(':') + 1) : n;
  if (local.startsWith('on')) return true;
  const value = normalizedValue(rawValue);
  if (SCRIPT_SCHEMES.test(value)) return true;
  if ((URL_ATTRIBUTES.has(n) || local === 'href') && /^data:(?:text\/html|application\/|text\/xml|image\/svg\+xml;[^,]*charset)/.test(value)) return true;
  if (local === 'style' && CSS_DANGER.test(value)) return true;
  return false;
}

// Parses a start tag's text (between `<` and `>`, `/` included) into its name,
// its attributes with their raw text, and whether it closes itself.
function parseTag(text) {
  let i = 0;
  const len = text.length;
  while (i < len && /[^\s/>]/.test(text[i])) i += 1;
  const name = text.slice(0, i);
  const attributes = [];
  let selfClosing = false;
  while (i < len) {
    while (i < len && /\s/.test(text[i])) i += 1;
    if (i >= len) break;
    if (text[i] === '/') { selfClosing = true; i += 1; continue; }
    const start = i;
    while (i < len && /[^\s=/>]/.test(text[i])) i += 1;
    const attrName = text.slice(start, i);
    let j = i;
    while (j < len && /\s/.test(text[j])) j += 1;
    let value = '';
    if (text[j] === '=') {
      j += 1;
      while (j < len && /\s/.test(text[j])) j += 1;
      const quote = text[j];
      if (quote === '"' || quote === "'") {
        const close = text.indexOf(quote, j + 1);
        const end = close === -1 ? len : close;
        value = text.slice(j + 1, end);
        j = close === -1 ? len : close + 1;
      } else {
        const vs = j;
        while (j < len && /[^\s>]/.test(text[j])) j += 1;
        value = text.slice(vs, j);
      }
      i = j;
    } else if (!attrName) {
      i += 1; // a stray character
      continue;
    }
    attributes.push({ name: attrName, value, raw: text.slice(start, i) });
  }
  return { name, attributes, selfClosing };
}

// Where a tag's text stops being plain: a quote, or its end.
const TAG_STOP = /["'>]/g;

// The end (exclusive) of `term` in input from `from`, given `carry` - the last
// characters of the previous chunk - or { at: -1, carry } with the new carry.
function findEnd(input, from, carry, term) {
  if (carry) {
    const joined = carry + input.slice(from, from + term.length - 1);
    const k = joined.indexOf(term);
    if (k !== -1) return { at: from + k + term.length - carry.length };
  }
  const k = input.indexOf(term, from);
  if (k !== -1) return { at: k + term.length };
  const tail = (carry + input.slice(Math.max(from, input.length - (term.length - 1)))).slice(-(term.length - 1));
  return { at: -1, carry: tail };
}

const localName = name => {
  const n = name.toLowerCase();
  return n.includes(':') ? n.slice(n.lastIndexOf(':') + 1) : n;
};

// The sanitizer itself: push(text) returns the sanitized text so far, end()
// what remains. `changed` is true once anything dangerous was removed;
// comments and CDATA are text, and pass through as they are.
function createSvgSanitizer({ maxMarkup = MAX_MARKUP_CHARS } = {}) {
  let state = 'text';
  let buf = '';             // the construct being read
  let tagOverflow = false;  // the tag outgrew maxMarkup: only its start is kept
  let dropName = null;      // inside a dropped element: its local name
  let dropDepth = 0;
  let inStyle = false;      // inside <style>: its sheet is collected and checked
  let sheet = '';
  let sheetOverflow = false;
  let changed = false;
  let removed = '';         // a sample of what was removed, for the log
  let declHead = '';
  let dropXmlDeclaration = false; // re-encoded input: its declaration names the wrong encoding        // the start of a removed declaration, for the log
  let quote = null;         // inside a quoted attribute value of a tag
  let bracket = 0;          // inside a DOCTYPE's internal subset

  // Something dangerous was removed: `fragment` is what, kept in a short
  // sample so the log can say what kind of thing it was.
  const note = fragment => {
    changed = true;
    if (removed.length < REMOVED_SAMPLE_CHARS) removed += `${String(fragment).slice(0, 256)}\n`;
  };

  const emitText = (out, text) => {
    if (dropName) return out;
    if (inStyle) {
      if (sheetOverflow) return out;
      if (sheet.length + text.length > maxMarkup) { sheetOverflow = true; note('<style> sheet too long to check'); sheet = ''; return out; }
      sheet += text;
      return out;
    }
    return out + text;
  };

  function closeStyle(out) {
    inStyle = false;
    const keep = !sheetOverflow && !CSS_DANGER.test(normalizedValue(sheet));
    if (!keep && !sheetOverflow) note(sheet);
    const result = out + (keep ? sheet : '');
    sheet = '';
    sheetOverflow = false;
    return result;
  }

  function finishTag(out) {
    const text = buf;
    const overflowed = tagOverflow;
    buf = '';
    tagOverflow = false;

    if (text[0] === '/') {
      const name = localName(text.slice(1).trim());
      if (dropName) {
        if (name === dropName && --dropDepth === 0) dropName = null;
        return out;
      }
      if (name === 'style' && inStyle) out = closeStyle(out);
      return `${out}<${text}>`;
    }

    const tag = parseTag(text);
    const name = localName(tag.name);
    if (dropName) {
      if (name === dropName && !tag.selfClosing && !overflowed) dropDepth += 1;
      return out;
    }
    if (DROP_ELEMENTS.has(name)) {
      note(`<${text}>`);
      if (!tag.selfClosing || overflowed) { dropName = name; dropDepth = 1; }
      return out;
    }
    if (overflowed) {
      // Too long to check: the tag goes; what it contains stays.
      note(`<${text.slice(0, 64)} (a tag too long to check)`);
      return out;
    }
    const dangerous = tag.attributes.filter(a => attributeIsDangerous(a.name, a.value));
    let result = `<${text}>`;
    if (dangerous.length) {
      note(dangerous.map(a => a.raw).join(' '));
      result = `<${tag.name}${tag.attributes.filter(a => !dangerous.includes(a)).map(a => ` ${a.raw}`).join('')}${tag.selfClosing ? '/>' : '>'}`;
    }
    out = emitText(out, result);
    if (name === 'style' && !tag.selfClosing) {
      if (inStyle) { note('<style> inside <style>'); } else { inStyle = true; sheet = ''; sheetOverflow = false; }
    }
    return out;
  }

  const addToTag = text => {
    if (tagOverflow) return;
    if (buf.length + text.length <= maxMarkup) buf += text;
    else { buf += text.slice(0, maxMarkup - buf.length); tagOverflow = true; }
  };

  function push(input) {
    let out = '';
    let textStart = -1;
    const flushText = end => {
      if (textStart !== -1) { out = emitText(out, input.slice(textStart, end)); textStart = -1; }
    };
    for (let i = 0; i < input.length; i += 1) {
      const c = input[i];
      switch (state) {
        case 'text':
          if (c === '<') { flushText(i); state = 'lt'; buf = ''; }
          else if (textStart === -1) textStart = i;
          break;
        case 'lt':
          if (c === '!') { state = 'bang'; buf = ''; }
          else if (c === '?') { state = 'pi'; buf = ''; }
          else if (c === '>') { state = 'text'; out = emitText(out, '&lt;&gt;'); }
          else { state = 'tag'; buf = c; quote = null; if (c === '"' || c === "'") quote = c; }
          break;
        case 'tag': {
          // In bulk: to the closing quote, or to the next quote or `>`. A tag
          // of path data is megabytes long; one character at a time would
          // build it of a million little strings.
          let j = i;
          let closed = false;
          while (j < input.length) {
            if (quote) {
              const k = input.indexOf(quote, j);
              if (k === -1) { addToTag(input.slice(j)); j = input.length; break; }
              addToTag(input.slice(j, k + 1));
              quote = null;
              j = k + 1;
            } else {
              TAG_STOP.lastIndex = j;
              const m = TAG_STOP.exec(input);
              if (!m) { addToTag(input.slice(j)); j = input.length; break; }
              const k = m.index;
              if (m[0] === '>') { addToTag(input.slice(j, k)); j = k; closed = true; break; }
              addToTag(input.slice(j, k + 1));
              quote = m[0];
              j = k + 1;
            }
          }
          if (closed) { state = 'text'; out = finishTag(out); i = j; } else i = input.length - 1;
          break;
        }
        case 'bang':
          buf += c;
          if (buf === '--') { state = 'comment'; out = emitText(out, '<!--'); buf = ''; }
          else if (buf === '[CDATA[') { state = 'cdata'; out = emitText(out, '<![CDATA['); buf = ''; }
          else if (!'--'.startsWith(buf) && !'[CDATA['.startsWith(buf)) {
            // DOCTYPE, ENTITY, ELEMENT, ATTLIST ...: removed with any internal subset.
            state = 'decl';
            declHead = `<!${buf}`;
            bracket = 0;
            for (const ch of buf) { if (ch === '[') bracket += 1; else if (ch === ']') bracket -= 1; }
            if (c === '>' && bracket <= 0) { state = 'text'; note(declHead); }
            buf = '';
          }
          break;
        case 'decl':
          if (declHead.length < 64) declHead += c;
          if (c === '[') bracket += 1;
          else if (c === ']') bracket -= 1;
          else if (c === '>' && bracket <= 0) { state = 'text'; note(declHead); }
          break;
        case 'comment':
        case 'cdata': {
          // Text to their terminator, which may be split across two chunks.
          const end = findEnd(input, i, buf, state === 'comment' ? '-->' : ']]>');
          if (end.at === -1) { out = emitText(out, input.slice(i)); buf = end.carry; i = input.length - 1; }
          else { out = emitText(out, input.slice(i, end.at)); state = 'text'; buf = ''; i = end.at - 1; }
          break;
        }
        case 'pi':
          buf += c;
          if (buf.endsWith('?>')) {
            const body = buf.slice(0, -2);
            // Only the XML declaration stays.
            if (/^xml(\s|$)/i.test(body)) { if (!dropXmlDeclaration) out = emitText(out, `<?${body}?>`); }
            else note(`<?${body}?>`);
            buf = '';
            state = 'text';
          } else if (buf.length > 4096) {
            note(`<?${buf}`); state = 'skippi'; buf = '';
          }
          break;
        case 'skippi': {
          const end = findEnd(input, i, buf, '?>');
          if (end.at === -1) { buf = end.carry; i = input.length - 1; } else { state = 'text'; buf = ''; i = end.at - 1; }
          break;
        }
        default:
          break;
      }
    }
    if (state === 'text') flushText(input.length);
    return out;
  }

  function end() {
    let out = '';
    // An unfinished tag, declaration or instruction at the end is dropped.
    if (state === 'tag' || state === 'lt' || state === 'bang' || state === 'decl' || state === 'pi' || state === 'skippi') {
      if (state === 'decl') note(declHead);
      else if (state === 'tag' || state === 'pi' || state === 'skippi') note(`<${buf.slice(0, 64)} (unfinished at the end)`);
    }
    if (inStyle) out = closeStyle(out);
    state = 'text';
    buf = '';
    return out;
  }

  return {
    push, end,
    get changed() { return changed; },
    get removed() { return removed; },
    dropXmlDeclaration() { dropXmlDeclaration = true; },
  };
}

// UTF-16, by its byte order mark or by the zero bytes of `<?` / `<s`.
function detectEncoding(head) {
  if (head.length >= 2 && head[0] === 0xff && head[1] === 0xfe) return { encoding: 'utf-16le', bom: 2 };
  if (head.length >= 2 && head[0] === 0xfe && head[1] === 0xff) return { encoding: 'utf-16be', bom: 2 };
  if (head.length >= 4 && head[0] === 0x3c && head[1] === 0x00 && head[2] !== 0x00 && head[3] === 0x00) return { encoding: 'utf-16le', bom: 0 };
  if (head.length >= 4 && head[0] === 0x00 && head[1] === 0x3c && head[2] === 0x00) return { encoding: 'utf-16be', bom: 0 };
  return { encoding: 'bytes', bom: 0 };
}

// A Transform: bytes in, sanitized bytes out. After it ends, `stream.changed`
// is true when anything dangerous was removed, and `stream.removed` is a short
// sample of what. Decoding UTF-16 to UTF-8 is not a change: nothing was removed.
function createSvgSanitizeStream(options = {}) {
  const sanitizer = createSvgSanitizer(options);
  let decided = false;
  let head = Buffer.alloc(0);
  let mode = null;
  let decoder = null;

  const fromBytes = buf => (mode === 'bytes' ? buf.toString('latin1') : decoder.write(buf));
  const toBytes = text => (mode === 'bytes' ? Buffer.from(text, 'latin1') : Buffer.from(text, 'utf8'));

  const stream = new Transform({
    transform(chunk, enc, cb) {
      let buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (!decided) {
        head = Buffer.concat([head, buf]);
        if (head.length < 4) { cb(); return; }
        decided = true;
        const found = detectEncoding(head);
        mode = found.encoding === 'bytes' ? 'bytes' : 'utf16';
        if (mode === 'utf16') {
          const { StringDecoder } = require('string_decoder');
          decoder = found.encoding === 'utf-16le' ? new StringDecoder('utf16le') : null;
          if (!decoder) {
            // StringDecoder has no utf-16be: swap the bytes of each pair.
            decoder = { pending: null, write(b) {
              let data = this.pending ? Buffer.concat([this.pending, b]) : b;
              this.pending = data.length % 2 ? data.subarray(data.length - 1) : null;
              if (this.pending) data = data.subarray(0, data.length - 1);
              const swapped = Buffer.from(data); swapped.swap16();
              return swapped.toString('utf16le');
            }, end() { return ''; } };
          }
          sanitizer.dropXmlDeclaration();
        }
        buf = head.subarray(found.bom);
        head = null;
      }
      const text = fromBytes(buf);
      const out = sanitizer.push(text);
      if (out) this.push(toBytes(out));
      cb();
    },
    flush(cb) {
      if (!decided && head && head.length) {
        mode = 'bytes';
        const out = sanitizer.push(head.toString('latin1'));
        if (out) this.push(toBytes(out));
      }
      if (decoder && typeof decoder.end === 'function') {
        const rest = decoder.end();
        if (rest) { const out = sanitizer.push(rest); if (out) this.push(toBytes(out)); }
      }
      const tail = sanitizer.end();
      if (tail) this.push(toBytes(tail));
      stream.changed = sanitizer.changed;
      stream.removed = sanitizer.removed;
      cb();
    },
  });
  stream.changed = false;
  stream.removed = '';
  return stream;
}

// The whole string at once (small inputs, the sanitizeSvgContent API).
function sanitizeSvgString(svg) {
  if (typeof svg !== 'string' || svg.length === 0) return { content: svg, changed: false };
  const sanitizer = createSvgSanitizer();
  const content = sanitizer.push(svg) + sanitizer.end();
  return { content, changed: sanitizer.changed, removed: sanitizer.removed };
}

module.exports = {
  MAX_MARKUP_CHARS, DROP_ELEMENTS, createSvgSanitizer, createSvgSanitizeStream, sanitizeSvgString,
  attributeIsDangerous, normalizedValue, detectEncoding,
};
