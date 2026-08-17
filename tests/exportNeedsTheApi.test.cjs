'use strict';

// Guard: an export produces the file that was asked for, or says why not.
// Run: node tests/exportNeedsTheApi.test.cjs
//
// WHAT HAPPENED. Exporting a card to PDF from a WeKan bundle produced an HTML
// file. Not a broken PDF - WeKan's own page, saved under the name `<card>.pdf`.
//
// Every export in the interface is a download from an `/api/...` address: a
// board or a card to PDF, to Excel, to JSON, to .zip, to CSV, and the ten
// "export for another tool" formats. server/apiMiddleware.js refuses every
// `/api` request unless WITH_API is exactly "true", and it refused by answering
// `301 Location: /`. The browser followed that to the front page, and the
// download link's `download="<card>.pdf"` wrote the HTML it got there to that
// name.
//
// TWO FAULTS, and both are pinned here, because either alone reproduces it:
//
//   1. The bundle launchers did not set WITH_API. The snap has defaulted it to
//      true for years and every docker-compose in this repository sets it, so
//      the bundle was the ONE platform where exporting was off by default -
//      which is why it was the one platform where an export came back as HTML.
//
//   2. The refusal was a redirect. Whatever the setting, "the API is off" must
//      not arrive as a 200 full of HTML: a 403 with a sentence in it cannot be
//      mistaken for the file that was asked for, and it says what to change.
//      This matters for anybody who turns WITH_API off ON PURPOSE and then
//      wonders why their exports are broken PDFs.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('exportNeedsTheApi:');

test('every platform that ships a launcher turns the API on', () => {
  // The snap and the compose files always did. The two bundle launchers are
  // what a person runs after downloading a release, and they did not.
  const sh = read('releases/ferretdb/start-wekan.sh');
  assert.ok(/export WITH_API="\$\{WITH_API:-true\}"/.test(sh),
    'start-wekan.sh must default WITH_API to true, overridable from the environment');

  const bat = read('releases/ferretdb/start-wekan.bat');
  assert.ok(/if not defined WITH_API set "WITH_API=true"/.test(bat),
    'start-wekan.bat must do the same');

  const snap = read('snap-src/bin/config');
  assert.ok(/DEFAULT_WITH_API="true"/.test(snap),
    'the snap has defaulted it to true all along - the launchers match it now');
});

test('and the launchers say WHY it is on, since the name does not', () => {
  // "WITH_API" reads like a developer feature. The comment is what stops
  // somebody switching it off to harden an instance and silently breaking every
  // export in the interface.
  for (const file of ['releases/ferretdb/start-wekan.sh', 'releases/ferretdb/start-wekan.bat']) {
    const source = read(file);
    const i = source.indexOf('WITH_API');
    const context = source.slice(Math.max(0, i - 900), i);
    assert.ok(/export/i.test(context) && /PDF|Excel|JSON/i.test(context),
      `${file} must say that the exports depend on it`);
  }
});

test('a refused /api request is a 403 with words, never a redirect (negative)', () => {
  const mw = read('server/apiMiddleware.js');
  const gate = /function apiGate\(req, res, next\) \{([\s\S]*?)\n\}\);/.exec(mw);
  assert.ok(gate, 'the API gate must exist');
  // The CODE, not the comment above it explaining what the redirect used to do -
  // which of course contains the words this test is looking for.
  const body = gate[1].split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');

  assert.ok(!/writeHead\(30\d/.test(body),
    'the gate must NOT redirect - a redirect to `/` is how an export became an '
    + 'HTML file saved as .pdf');
  assert.ok(!/Location:/.test(body), 'and must send no Location header');
  assert.ok(/writeHead\(403/.test(body), 'it answers 403');
  assert.ok(/text\/plain/.test(body),
    'as plain text, so nothing can render it as a page or save it as a document');
  assert.ok(/WITH_API=true/.test(body),
    'and the answer names the setting to change');
});

test('the exports really are /api addresses, which is why this matters', () => {
  // If they were not, the gate would be irrelevant to them and this suite would
  // be guarding nothing.
  const js = read('client/components/boards/exportScope.js');
  assert.ok(/exportUrl\(`\/api\/boards\/:boardId\//.test(js),
    'every format the popup offers is built as an /api/boards/... address');
  const routes = read('models/exportPDF.js') + read('models/exportExcel.js') + read('models/export.js');
  for (const route of ['/api/boards/:boardId/exportPDF', '/api/boards/:boardId/exportExcel',
    '/api/boards/:boardId/export']) {
    assert.ok(routes.includes(route), `${route} is served under /api`);
  }
});

test('and the download link names a file, so a wrong answer gets that name', () => {
  // This is the mechanism that turned a redirect into "a PDF that is HTML": the
  // anchor tells the browser what to call whatever comes back. It is right -
  // the answer is what has to be trustworthy.
  const jade = read('client/components/boards/exportScope.jade');
  assert.ok(/a\(href="\{\{url\}\}" download\)/.test(jade),
    'the format links request a download');
  const exporters = read('models/server/ExporterCardPDF.js')
    + read('models/server/ExporterExcelCard.js')
    + read('models/server/ExporterExcelBoard.js');
  assert.ok(/Content-Disposition/.test(exporters),
    'the server supplies the localized, scope-aware filename');
});

console.log(`\nexportNeedsTheApi: ${passed} tests passed`);
