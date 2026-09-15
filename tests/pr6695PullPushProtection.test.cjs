'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const superseded = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/pr6695-superseded-translations.json')));
const source = fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'));
const english = JSON.parse(source);
const newerKey = Object.keys(superseded['zh-TW']).find(key =>
  !/__|%(?:\d+\$)?[A-Za-z]/.test(english[key]));
assert.ok(newerKey, 'a key without source placeholders can model a newer human pull');
const newerHuman = '新的人工翻譯';
const tempRoot = path.join(root, '.tools/tmp/pr6695-pull-push');
fs.mkdirSync(tempRoot, { recursive: true });

const fixture = fs.mkdtempSync(path.join(tempRoot, 'pull-'));
try {
  const dataDir = path.join(fixture, 'imports/i18n/data');
  const beforeDir = path.join(fixture, 'before');
  const protectionDir = path.join(fixture, 'releases/translations');
  for (const dir of [dataDir, beforeDir, protectionDir]) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'en.i18n.json'), source);
  fs.copyFileSync(path.join(root, 'releases/translations/pr6695-superseded-translations.json'),
    path.join(protectionDir, 'pr6695-superseded-translations.json'));

  for (const locale of Object.keys(superseded)) {
    const filename = `${locale}.i18n.json`;
    const current = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', filename)));
    fs.writeFileSync(path.join(beforeDir, filename), JSON.stringify(current));
    const pulled = { ...current, ...superseded[locale] };
    if (locale === 'zh-TW') pulled[newerKey] = newerHuman;
    fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(pulled));
  }
  const merge = spawnSync(process.execPath,
    [path.join(root, 'releases/translations/merge-translations.mjs'), '--before-dir', beforeDir],
    { cwd: fixture, encoding: 'utf8' });
  assert.equal(merge.status, 0, merge.stderr);
  for (const locale of Object.keys(superseded)) {
    const current = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${locale}.i18n.json`)));
    const merged = JSON.parse(fs.readFileSync(path.join(dataDir, `${locale}.i18n.json`)));
    for (const key of Object.keys(superseded[locale])) {
      assert.equal(merged[key], locale === 'zh-TW' && key === newerKey ? newerHuman : current[key],
        `${locale}:${key}: pull chose the wrong translation`);
    }
  }
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

const noNode = spawnSync('sh', [path.join(root, 'releases/translations/pull-translations.sh')], {
  encoding: 'utf8', env: { ...process.env, NODE_BIN: '/nonexistent/wekan-node' },
});
assert.equal(noNode.status, 1, 'pull refuses to overwrite files without a merge-capable Node');
assert.match(noNode.stderr, /refusing to overwrite local human translations/);

const dryRun = spawnSync('sh', [path.join(root, 'releases/translations/push-all-translations.sh'), '--dry-run'], {
  encoding: 'utf8', env: { ...process.env, NODE_BIN: process.execPath },
});
assert.equal(dryRun.status, 0, dryRun.stderr);
assert.equal((dryRun.stdout.match(/protected human translations: target upload skipped/g) || []).length, 2);

(async () => {
  const { pushTranslations } = await import('../releases/translations/push-all-translations.mjs');
  const uploads = [];
  const request = async (method, url, body) => {
    if (method === 'POST' && url === '/resource_strings_async_uploads')
      return { data: { attributes: { status: 'succeeded' } } };
    if (method === 'GET' && url.includes('/languages'))
      return { data: [{ id: 'l:zh_TW' }, { id: 'l:zh-Hant' }, { id: 'l:fi' }] };
    if (method === 'POST' && url === '/resource_translations_async_uploads') {
      uploads.push(body.data.relationships.language.data.id);
      return { data: { attributes: { status: 'succeeded' } } };
    }
    throw new Error(`Unexpected ${method} ${url}`);
  };
  const result = await pushTranslations({
    config: { org: 'wekan', project: 'wekan', resource: 'wekan',
      sourceFile: 'en', sourceLanguage: 'en' },
    languages: [{ file: 'zh-TW', code: 'zh_TW' }, { file: 'zh-Hant', code: 'zh-Hant' },
      { file: 'fi', code: 'fi' }],
    request, readContent: () => '{"name":"Name"}', sleep: async () => {}, log() {},
  });
  assert.deepEqual(result.skipped.map(row => row.file), ['zh-TW', 'zh-Hant']);
  assert.deepEqual(uploads, ['l:fi'], 'human-owned targets are never uploaded');
  console.log('PR #6695: pull restores stale machine values; push skips human-owned targets');
})().catch(error => { console.error(error); process.exitCode = 1; });
