#!/usr/bin/env node
// changelog-wrap.mjs - wrap CHANGELOG.md prose at 80 columns, the way
// tests/changelogFormat.test.cjs requires, without changing what it renders.
//
//   node releases/changelog-wrap.mjs [CHANGELOG.md]
//
// It touches only the lines that test counts: longer than 80 characters, with
// no link, not a <summary>, not a "**Languages updated:**" list and not the
// prescribed closing sentence. Headings, tables, HTML lines and fenced code are
// left alone. A bullet's continuation is indented two spaces past the bullet,
// as CLAUDE.md asks, and a wrapped line never begins with something markdown
// would read as a heading, a list item, a table or HTML - so the rendered text
// is the same and only whitespace changes. Running it twice changes nothing.
import fs from 'node:fs';

const CLOSING = 'Thanks to above GitHub users for their contributions and translators for their translations.';

export function exempt(line) {
  return line.length <= 80 || /https?:\/\//.test(line) || /\[[^\]]+\]\([^\s)]+\)/.test(line)
    || line.startsWith('<summary>') || line.startsWith('**Languages updated:** ') || line === CLOSING;
}

// A continuation line must not start something markdown would read as block syntax.
const unsafeStart = word => /^(#|[-*+]$|\d+[.)]$|\||>|<\/?[a-z]|=+$|```)/i.test(word);

export function wrapChangelog(text) {
  let fence = false;
  const out = [];
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) fence = !fence;
    if (fence || exempt(line) || /^\s*(#|\||<)/.test(line)) { out.push(line); continue; }
    const m = line.match(/^(\s*)((?:[-*+]|\d+\.)\s+)?/);
    const first = m[0];
    const cont = m[1] + (m[2] ? ' '.repeat(m[2].length) : '');
    const words = line.slice(first.length).split(/ +/).filter(Boolean);
    let current = first;
    let hasWord = false;
    for (const word of words) {
      if (hasWord && current.length + 1 + word.length > 80) {
        if (!unsafeStart(word)) {
          out.push(current);
          current = cont + word;
          continue;
        }
        // "#6514" must not open a line; carry the word before it down too.
        const cut = current.lastIndexOf(' ');
        if (cut > cont.length) {
          out.push(current.slice(0, cut));
          current = cont + current.slice(cut + 1) + ' ' + word;
          continue;
        }
        current += ' ' + word;
      } else {
        current += (hasWord ? ' ' : '') + word;
      }
      hasWord = true;
    }
    out.push(current);
  }
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2] || 'CHANGELOG.md';
  const before = fs.readFileSync(file, 'utf8');
  const after = wrapChangelog(before);
  if (after !== before) fs.writeFileSync(file, after);
  console.log(after === before ? `${file}: already wrapped` : `${file}: wrapped`);
}
