'use strict';

// A YAML reader for GitHub Actions workflow files (.github/workflows/*.yml),
// for the GitHub organization import's Actions -> WeKan Rules. Workflow files
// use a small, regular part of YAML, and WeKan has no YAML library in its
// production bundle, so this reads that part and refuses the rest with an
// error, instead of adding a dependency:
//
//   key: value            block mappings, keys plain or quoted
//   - item                block sequences, also of mappings ("- uses: x")
//   [a, "b"] {a: b}       flow sequences and mappings, one line
//   'x' "x\n" plain       scalars; true/false/null/numbers typed
//   | |- > >-             block scalars (run: scripts, bodies)
//   # comment, ---        comments and one document start
//
// Anchors, aliases, tags and multi-document files are refused: a workflow
// does not need them, and a reader that half-understood them would map a
// different workflow than the one written. Pure: tests/workflowYaml.test.cjs.

class WorkflowYamlError extends Error {}

function fail(message, lineNo) {
  throw new WorkflowYamlError(lineNo ? `line ${lineNo}: ${message}` : message);
}

// The line without its comment: a # starts one at the line start or after a
// space, and not inside quotes.
function stripComment(text) {
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\' && quote === '"') { i += 1; continue; }
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '#' && (i === 0 || /\s/.test(text[i - 1]))) {
      return text.slice(0, i).replace(/\s+$/, '');
    }
  }
  return text.replace(/\s+$/, '');
}

function unquoteDouble(body, lineNo) {
  return body.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (m, e) => {
    if (e[0] === 'u' || e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
    const map = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', '/': '/', '0': '\0', ' ': ' ' };
    if (!(e in map)) fail(`unknown escape \\${e}`, lineNo);
    return map[e];
  });
}

function scalar(raw, lineNo) {
  const text = raw.trim();
  if (text === '') return null;
  if (/^[&*!]/.test(text)) fail('anchors, aliases and tags are not supported', lineNo);
  if (text[0] === '"') {
    if (!/^"(?:[^"\\]|\\.)*"$/.test(text)) fail('unterminated "string"', lineNo);
    return unquoteDouble(text.slice(1, -1), lineNo);
  }
  if (text[0] === "'") {
    if (!/^'(?:[^']|'')*'$/.test(text)) fail("unterminated 'string'", lineNo);
    return text.slice(1, -1).replace(/''/g, "'");
  }
  if (text[0] === '[' || text[0] === '{') return flow(text, lineNo);
  if (/^(null|~|Null|NULL)$/.test(text)) return null;
  if (/^(true|True|TRUE)$/.test(text)) return true;
  if (/^(false|False|FALSE)$/.test(text)) return false;
  if (/^[-+]?\d+$/.test(text)) return Number(text);
  if (/^[-+]?(\d+\.\d*|\.\d+)([eE][-+]?\d+)?$/.test(text)) return Number(text);
  return text;
}

// One-line flow collections: [a, b], {a: b, c: [d]}.
function flow(text, lineNo) {
  let i = 0;
  const ws = () => { while (i < text.length && /\s/.test(text[i])) i += 1; };
  const item = (stops) => {
    ws();
    if (text[i] === '[' || text[i] === '{') return collection();
    let start = i;
    if (text[i] === '"' || text[i] === "'") {
      const q = text[i];
      i += 1;
      while (i < text.length && text[i] !== q) i += (text[i] === '\\' && q === '"') ? 2 : 1;
      i += 1;
      return scalar(text.slice(start, i), lineNo);
    }
    while (i < text.length && !stops.includes(text[i])) i += 1;
    return scalar(text.slice(start, i), lineNo);
  };
  const collection = () => {
    const open = text[i];
    const close = open === '[' ? ']' : '}';
    i += 1;
    const out = open === '[' ? [] : {};
    ws();
    if (text[i] === close) { i += 1; return out; }
    for (;;) {
      if (open === '[') out.push(item([',', ']']));
      else {
        const key = item([':', ',', '}']);
        ws();
        if (text[i] !== ':') fail('expected ":" in a {mapping}', lineNo);
        i += 1;
        out[String(key)] = item([',', '}']);
      }
      ws();
      if (text[i] === ',') { i += 1; continue; }
      if (text[i] === close) { i += 1; return out; }
      fail(`unterminated ${open}${close}`, lineNo);
    }
  };
  const value = collection();
  ws();
  if (i < text.length) fail('text after a flow collection', lineNo);
  return value;
}

// `key: rest` -> [key, rest], or null when the line is not a mapping entry.
function splitKey(text) {
  const quoted = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*')\s*:(?:\s+|$)(.*)$/.exec(text);
  if (quoted) return [scalar(quoted[1]), quoted[2]];
  const plain = /^([^\s"'[\]{}#,][^:#]*?)\s*:(?:\s+|$)(.*)$/.exec(text);
  return plain ? [plain[1], plain[2]] : null;
}

function parseWorkflowYaml(source) {
  const raw = String(source || '').replace(/^﻿/, '').split(/\r?\n/);
  const lines = [];
  let docStarts = 0;
  for (let n = 0; n < raw.length; n += 1) {
    if (/\t/.test(raw[n].match(/^\s*/)[0])) fail('tabs are not allowed for indentation', n + 1);
    const text = stripComment(raw[n]);
    if (/^---\s*$/.test(text)) { docStarts += 1; if (docStarts > 1 || lines.some(l => !l.blank)) fail('one document only', n + 1); continue; }
    if (/^\.\.\.\s*$/.test(text)) break;
    lines.push({ n: n + 1, raw: raw[n], text, indent: text.match(/^ */)[0].length, blank: text.trim() === '',
      rawBlank: raw[n].trim() === '' });
  }
  let at = 0;
  const next = () => { while (at < lines.length && lines[at].blank) at += 1; return lines[at]; };

  // A block scalar's lines: everything indented deeper than its parent. Read
  // raw - a "# ..." line in a run: script is part of the script.
  function blockScalar(style, parentIndent) {
    const keep = style.includes('+');
    const strip = style.includes('-');
    const folded = style[0] === '>';
    const body = [];
    let indent = null;
    while (at < lines.length) {
      const line = lines[at];
      if (!line.rawBlank) {
        const ind = line.raw.match(/^ */)[0].length;
        if (ind <= parentIndent) break;
        if (indent === null) indent = ind;
        if (ind < indent) break;
      }
      body.push(line.rawBlank ? '' : line.raw.slice(indent).replace(/\s+$/, (m) => (/\S/.test(line.raw) ? m : '')));
      at += 1;
    }
    while (!keep && body.length && body[body.length - 1] === '') body.pop();
    let text = folded ? body.join('\n').replace(/([^\n])\n(?=[^\n ])/g, '$1 ') : body.join('\n');
    if (!strip) text += '\n';
    return text;
  }

  // The value after "key:" or "- ": inline, a block scalar, or a nested block.
  function valueAfter(rest, parentIndent, lineNo) {
    const r = rest.trim();
    if (/^[|>][-+]?$/.test(r)) return blockScalar(r, parentIndent);
    if (r !== '') return scalar(r, lineNo);
    const line = next();
    if (!line || line.indent <= parentIndent) {
      // A sequence may sit at its key's own indent ("steps:\n- uses: x").
      if (line && line.indent === parentIndent && /^- |^-$/.test(line.text.trim())) return block(line.indent);
      return null;
    }
    return block(line.indent);
  }

  function block(indent) {
    const first = next();
    if (!first) return null;
    if (/^-(\s|$)/.test(first.text.trim())) {
      const out = [];
      for (let line = next(); line && line.indent === indent && /^-(\s|$)/.test(line.text.trim()); line = next()) {
        at += 1;
        const rest = line.text.trim().slice(1);
        const inner = rest.replace(/^\s+/, '');
        const kv = inner ? splitKey(inner) : null;
        if (kv) {
          // "- key: value" starts a mapping whose keys line up after "- ".
          const keyIndent = indent + 1 + (rest.length - inner.length);
          const obj = {};
          obj[kv[0]] = valueAfter(kv[1], keyIndent, line.n);
          const more = next();
          if (more && more.indent === keyIndent && !/^-(\s|$)/.test(more.text.trim())) Object.assign(obj, mapping(keyIndent));
          out.push(obj);
        } else {
          out.push(valueAfter(inner, indent, line.n));
        }
      }
      const after = next();
      if (after && after.indent > indent) fail('unexpected indentation', after.n);
      return out;
    }
    return mapping(indent);
  }

  function mapping(indent) {
    const out = {};
    for (let line = next(); line && line.indent === indent; line = next()) {
      const kv = splitKey(line.text.trim());
      if (!kv) fail(`expected "key: value", found ${JSON.stringify(line.text.trim().slice(0, 40))}`, line.n);
      at += 1;
      if (Object.prototype.hasOwnProperty.call(out, kv[0])) fail(`duplicate key ${kv[0]}`, line.n);
      out[kv[0]] = valueAfter(kv[1], indent, line.n);
    }
    const after = next();
    if (after && after.indent > indent) fail('unexpected indentation', after.n);
    return out;
  }

  const first = next();
  if (!first) return null;
  const doc = block(first.indent);
  const rest = next();
  if (rest) fail('unexpected indentation', rest.n);
  return doc;
}

module.exports = { parseWorkflowYaml, WorkflowYamlError };
