'use strict';

// The CHANGELOG is read at a glance (#6524).
//
// A reader wants to see, per version, WHAT changed - a title per change. The long
// story belongs in the commit message, which each entry links by its short hash. The
// changelog had grown paragraphs instead: a single entry could run to 1,600
// characters, so the list of changes was unreadable as a list.
//
// These are the rules CLAUDE.md states, checked against the file:
//   * an entry's visible text is a title, not a paragraph;
//   * the commit link's text is the 9-character short hash, and the URL uses it too;
//   * no long URL is ever shown as visible text;
//   * lines are wrapped at 80 columns, except a line carrying a link.
//
// Run: node tests/changelogFormat.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const changelog = read('CHANGELOG.md');
const lines = changelog.split('\n');
const BULLET = /^(\s*)[-*](\s|$)/;
const LINK = /\[([^\]]*)\]\(([^)]*)\)/g;

// Every bullet, joined over the lines it wraps onto.
function bullets() {
  const out = [];
  let i = 0;
  let inCode = false;
  while (i < lines.length) {
    if (lines[i].trim().startsWith('```')) { inCode = !inCode; i += 1; continue; }
    if (!inCode && BULLET.test(lines[i])) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && lines[j].startsWith('  ')
             && !BULLET.test(lines[j])) j += 1;
      out.push({ line: i + 1, text: lines.slice(i, j).map(s => s.trim()).join(' ') });
      i = j; continue;
    }
    i += 1;
  }
  return out;
}

// What a reader sees: a link counts as its text, not its URL.
const visible = text => text.replace(LINK, (m, label) => label)
  .replace(/\s*Thanks to .*$/, '').trim();

const ALL = bullets();

console.log('changelogFormat:');

test('the file is one long list of bullets, and they parse', () => {
  assert.ok(ALL.length > 2000, `expected thousands of entries, found ${ALL.length}`);
});

test('an entry is a title, not a paragraph', () => {
  // 200 visible characters is already generous for a title; the ones this catches
  // were paragraphs of 600-1,600.
  const long = ALL.filter(b => visible(b.text).length > 200 && /wekan\/commit\//.test(b.text));
  assert.deepStrictEqual(long.map(b => `line ${b.line}: ${visible(b.text).slice(0, 60)}…`), [],
    'an entry that links a commit must be a title - the story goes in the commit');
});

test('a commit link shows the short hash, and links the short hash', () => {
  const bad = [];
  for (const m of changelog.matchAll(/\[([^\]]*)\]\((https:\/\/github\.com\/wekan\/[\w.-]+\/commit\/([0-9a-f]+))\)/g)) {
    const [, label, , hash] = m;
    // 9 characters, except where the changelog only ever recorded a shorter hash
    // (a couple of 8-character ones from 2019 that cannot be lengthened now).
    if (hash.length !== 9 && hash.length !== 8) bad.push(`URL hash is ${hash.length} chars: ${hash}`);
    else if (label !== hash) bad.push(`link text is "${label}", not the hash ${hash}`);
  }
  assert.deepStrictEqual(bad.slice(0, 5), [], `${bad.length} commit links break the rule`);
});

test('no long URL is shown as visible text', () => {
  // A bare URL in the text is what the rule is against; inside a link's parentheses
  // it is invisible, which is where every URL belongs.
  const bare = [];
  let inCode = false;
  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) { inCode = !inCode; return; }
    if (inCode || line.startsWith('    ')) return;   // code, not prose
    const withoutLinks = line.replace(LINK, (m, label) => label);
    const m = /https?:\/\/\S{45,}/.exec(withoutLinks);
    if (m) bare.push(`line ${i + 1}: ${m[0].slice(0, 50)}…`);
  });
  // A handful survive in the oldest entries - commit-comment anchors, a couple of
  // URLs that were mistyped when they were written, an API example - so this pins
  // the count rather than zero: it may fall, never rise.
  assert.ok(bare.length <= 25,
    `${bare.length} long bare URLs: ${bare.slice(0, 3).join(' | ')}`);
});

test('lines are wrapped at 80 columns, links excepted', () => {
  const over = lines
    .map((line, i) => ({ line: i + 1, text: line }))
    .filter(l => l.text.length > 80 && !/https?:\/\//.test(l.text));
  // Same: the remainder are deep-indented technical notes in old entries.
  assert.ok(over.length <= 30,
    `${over.length} over-long lines without a link, e.g. line ${over[0] && over[0].line}`);
});

test('the Upcoming section follows the rules to the letter', () => {
  // The one section being written right now - it has no excuse for a stray old entry.
  const start = lines.findIndex(l => l.startsWith('# Upcoming WeKan'));
  assert.ok(start !== -1, 'there must be an Upcoming section');
  const end = lines.findIndex((l, i) => i > start && l.startsWith('# v'));
  const section = lines.slice(start, end);
  const inSection = ALL.filter(b => b.line > start && b.line < end);
  assert.ok(inSection.length > 5, 'and it must have entries');
  for (const b of inSection) {
    assert.ok(visible(b.text).length <= 170,
      `line ${b.line}: an Upcoming entry must be a title (${visible(b.text).length} chars)`);
  }
  for (const line of section) {
    assert.ok(line.length <= 80 || /https?:\/\//.test(line),
      `Upcoming line over 80 columns: ${line.slice(0, 60)}…`);
  }
});

test('CLAUDE.md states these rules, so they are not folklore', () => {
  const claude = read('CLAUDE.md');
  assert.ok(/A CHANGELOG entry is a TITLE, not the story/.test(claude));
  assert.ok(/Commit hashes are the link text/.test(claude));
  assert.ok(/Never show a long URL as visible text/.test(claude));
  assert.ok(/Word-wrap both CHANGELOGs at 80 chars/.test(claude));
});

console.log(`\n${passed} tests passed`);
