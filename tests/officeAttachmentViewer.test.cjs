'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  const viewer = await import('../client/lib/officeAttachmentViewer.js');

  console.log('officeAttachmentViewer:');

  test('source files are rejected above the 32 MiB boundary', () => {
    assert.doesNotThrow(() => viewer.assertSourceSize(viewer.MAX_SOURCE_BYTES));
    assert.throws(() => viewer.assertSourceSize(viewer.MAX_SOURCE_BYTES + 1), RangeError);
  });

  {
    const bytes = await viewer.readBoundedResponse(new Response('office bytes'));
    assert.strictEqual(new TextDecoder().decode(bytes), 'office bytes');
    passed += 1;
    console.log('  ok - attachment responses are read through the bounded stream');
  }

  {
    let cancelled = false;
    const response = {
      body: {
        getReader() {
          return {
            async read() {
              return { done: false, value: new Uint8Array(viewer.MAX_SOURCE_BYTES + 1) };
            },
            async cancel() { cancelled = true; },
          };
        },
      },
    };
    await assert.rejects(() => viewer.readBoundedResponse(response), RangeError);
    assert.strictEqual(cancelled, true, 'the oversized response stream is cancelled');
    passed += 1;
    console.log('  ok - a lying or missing Content-Length cannot bypass the limit');
  }

  test('archive and decoded-image budgets remain bounded', () => {
    assert.deepStrictEqual(viewer.VIEWER_OPTIONS.resourceLimits, {
      maxArchiveEntryBytes: 32 * 1024 * 1024,
      maxTotalInflatedBytes: 96 * 1024 * 1024,
      maxArchiveEntries: 2048,
    });
    assert.deepStrictEqual(viewer.VIEWER_OPTIONS.imageResources, {
      decodedByteBudget: 64 * 1024 * 1024,
      strategy: 'strict',
      resolution: 'display',
    });
  });

  test('active links, remote fonts and main-thread rendering stay disabled', () => {
    assert.strictEqual(viewer.VIEWER_OPTIONS.enableHyperlinks, false);
    assert.strictEqual(viewer.VIEWER_OPTIONS.useGoogleFonts, false);
    assert.strictEqual(viewer.VIEWER_OPTIONS.mode, 'worker');
  });

  test('viewer engines are lazy format-specific chunks', () => {
    const source = read('client/lib/officeAttachmentViewer.js');
    assert.match(source,
      /import\('@wekan\/office-open-xml-viewer\/docx'\)/);
    assert.match(source,
      /import\('@wekan\/office-open-xml-viewer\/xlsx'\)/);
    assert.match(source,
      /import\('@wekan\/office-open-xml-viewer\/pptx'\)/);
    assert.doesNotMatch(source,
      /^import .*@wekan\/office-open-xml-viewer/m,
      'a static import would put viewer engines in every initial browser load');
  });

  test('the fork exposes only the three browser viewers', () => {
    const pkg = JSON.parse(read('npm-packages/office-open-xml-viewer/package.json'));
    assert.deepStrictEqual(Object.keys(pkg.exports).sort(), ['./docx', './pptx', './xlsx']);
    assert.strictEqual(pkg.dependencies, undefined);
    assert.strictEqual(pkg.scripts, undefined);
    for (const excluded of ['node.mjs', 'math.mjs', 'tiff.mjs', 'region-map.mjs']) {
      assert.ok(!fs.existsSync(path.join(root,
        'npm-packages/office-open-xml-viewer/dist', excluded)), `${excluded} stays excluded`);
    }
  });

  test('every retained viewer import and asset reference resolves inside the fork', () => {
    const dist = path.join(root, 'npm-packages/office-open-xml-viewer/dist');
    const pending = ['docx.mjs', 'xlsx.mjs', 'pptx.mjs'];
    const visited = new Set();
    while (pending.length) {
      const relative = pending.pop();
      if (visited.has(relative)) continue;
      visited.add(relative);
      const source = fs.readFileSync(path.join(dist, relative), 'utf8');
      const references = [
        ...source.matchAll(/(?:from\s*|import\s*\()\s*["'](\.[^"']+)["']/g),
        ...source.matchAll(/new URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url/g),
      ];
      for (const match of references) {
        const target = path.normalize(path.join(path.dirname(relative), match[1]));
        assert.ok(fs.existsSync(path.join(dist, target)), `${relative} requires ${target}`);
        if (/\.(?:mjs|js)$/.test(target)) pending.push(target);
      }
    }
  });

  test('Office bytes stay fetch-only instead of becoming inline server content', () => {
    const route = read('server/routes/universalFileServer.js');
    assert.ok(!/vnd\.openxmlformats-officedocument/.test(route));
    assert.match(route, /Unknown types: force download as fallback/);
    assert.match(route, /Content-Security-Policy', "default-src 'none'; sandbox;/);
  });

  test('closing or replacing a preview aborts and destroys its resources', () => {
    const attachments = read('client/components/cards/attachments.js');
    assert.match(attachments, /officePreviewAbortController\.abort\(\)/);
    assert.match(attachments, /officePreview\.destroy\(\)/);
    assert.match(attachments, /generation !== officePreviewGeneration/);
  });

  console.log(`\nofficeAttachmentViewer: ${passed} tests passed`);
})();
