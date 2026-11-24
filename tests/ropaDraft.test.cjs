'use strict';

// Row 2.2 (docs/Compliance/README.md): the records of processing draft, from
// the inventory, this server's retention values and the outside services it
// really uses.
// Run: node --test tests/ropaDraft.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { ropaDraft, SERVICES } = require('../models/lib/ropaDraft');
const { INVENTORY } = require('../models/lib/personalDataInventory');

test('every collection holding personal data is a row, with the value this server sets', () => {
  const draft = ropaDraft({ values: { LOGIN_ADDRESS_RETENTION_DAYS: '30' }, today: new Date(Date.UTC(2026, 10, 24)) });
  const personal = INVENTORY.filter(e => !(e.categories.length === 1 && e.categories[0] === 'none'));
  for (const e of personal) assert.ok(draft.includes(`| ${e.collection} |`), e.collection);
  assert.ok(!draft.includes('| versionChecks |'), 'no row for a collection with no person in it');
  assert.match(draft, /set here: LOGIN_ADDRESS_RETENTION_DAYS=30/);
  assert.match(draft, /Drafted on 2026-11-24/);
  for (const part of ['## Controller', 'Legal basis: (fill in', '## Recipients outside this server', '## Transfers to third countries']) {
    assert.ok(draft.includes(part), part);
  }
});

test('only the outside services this server uses are recipients', () => {
  assert.match(ropaDraft({ services: {} }), /- None, as this server is set up\./);
  const draft = ropaDraft({ services: { mail: true, webhooks: true } });
  assert.match(draft, /- The mail server:/);
  assert.match(draft, /- Outgoing webhooks:/);
  assert.doesNotMatch(draft, /Have I Been Pwned|ActivityPub/);
  assert.equal(SERVICES.length, 6);
});

test('negative: a table cell cannot be broken by a | in the text', () => {
  const draft = ropaDraft({ inventory: [{ collection: 'x', categories: ['contact'], purpose: 'a | b', retention: { default: 'c | d' }, erasure: 'delete' }] });
  assert.ok(draft.includes('| x | contact | a \\| b | c \\| d | delete |'), 'the pipe escaped, the cell whole');
  const back = ropaDraft({ inventory: [{ collection: 'y', categories: ['contact'], purpose: 'ends \\', retention: { default: 'x' }, erasure: 'n/a' }] });
  assert.ok(back.includes('| ends \\\\ |'), 'a trailing backslash is escaped first');
});

test('a site administrator asks for it; the pane shows it to copy', () => {
  const m = read('server/methods/legalPages.js');
  const body = m.slice(m.indexOf('async getRopaDraft()'), m.indexOf('\n  },', m.indexOf('async getRopaDraft()')));
  assert.match(body, /await assertSiteAdmin\(this\.userId\);/);
  assert.doesNotMatch(body, /updateAsync|insertAsync|removeAsync/, 'it only reads');
  assert.match(read('client/components/settings/legalPagesSettings.jade'), /textarea\.wekan-form-control\.js-ropa-text\(rows="14" readonly/);
});
