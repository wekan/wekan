'use strict';
// 2026-11-19: the Admin Panel answers one question per tab. Settings = what this
// WeKan offers and how it looks (Appearance, Features, Feature profiles, Security,
// Activities and notifications, Delete, ...); People = who may sign in and what
// they may do; Problems = what is going wrong (Summary, Backup, Reports). The
// settings that sat in Problems and the features that sat in Visibility moved,
// and every old address redirects.
// Run: node --test tests/adminPanelStructure.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const urls = require('../models/lib/adminUrls');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const settingsMenu = (() => {
  const js = read('client/components/settings/settingBody.js');
  const body = js.slice(js.indexOf('function settingsMenu('), js.indexOf('// Multitenancy option D', js.indexOf('function settingsMenu(')));
  return [...body.matchAll(/\{ id: '([\w-]+)'/g)].map(m => m[1]);
})();

test('Settings: how it looks, then what it offers and who sees it, then the server-wide switches', () => {
  assert.deepStrictEqual(settingsMenu.slice(0, 7), ['version-setting', 'tableVisibilityMode-setting', 'features-setting',
    'feature-profiles-setting', 'privacy-security-setting', 'activities-setting', 'delete-setting']);
  for (const [slug, pane] of [['appearance', 'tableVisibilityMode-setting'], ['features', 'features-setting'],
    ['feature-profiles', 'feature-profiles-setting'], ['security', 'privacy-security-setting'],
    ['activities', 'activities-setting'], ['delete', 'delete-setting']]) {
    assert.strictEqual(urls.paneIdForSlug('settings', slug), pane, slug);
  }
});

test('every moved pane redirects to a pane that exists, and nothing else redirects', () => {
  for (const [page, moved] of Object.entries(urls.MOVED_PANES)) {
    for (const [slug, [toPage, toSlug]] of Object.entries(moved)) {
      assert.ok(urls.paneIdForSlug(toPage, toSlug), `${page}/${slug} -> ${toPage}/${toSlug} exists`);
      assert.strictEqual(urls.paneIdForSlug(page, slug), null, `${page}/${slug} is not still a pane`);
      assert.strictEqual(urls.movedPanePath(page, slug), `/admin/${toPage}/${toSlug}`);
    }
  }
  // Negative: a live pane, an unknown slug and an unknown page are not redirected.
  for (const [page, slug] of [['settings', 'version'], ['problems', 'summary'], ['settings', 'nope'], ['nope', 'security']]) {
    assert.strictEqual(urls.movedPanePath(page, slug), null, `${page}/${slug}`);
  }
  const router = read('config/router.js');
  assert.match(router, /triggersEnter: \[\s*redirectMovedPane\('settings'\),/);
  assert.match(router, /triggersEnter: \[\s*redirectMovedPane\('problems'\),/);
});

test('negative: no feature switch or server-wide setting is left in Appearance or Problems', () => {
  const jade = read('client/components/settings/settingBody.jade');
  const tpl = jade.slice(jade.indexOf("template(name='tableVisibilityModeSettings')"), jade.indexOf("template(name='announcementSettings')"));
  const appearance = tpl.slice(tpl.indexOf('    else\n'));
  for (const cls of ['js-feature-row', 'js-feature-profile', 'js-optional-api-row', 'js-toggle-rules-read-only', 'js-toggle-sqrl']) {
    assert.ok(!appearance.includes(cls), `${cls} is not in Appearance`);
  }
  const problems = read('client/components/settings/adminProblems.jade');
  for (const tpl2 of ['+featuresSecurity', '+featuresDelete', '+featuresNotifications']) {
    assert.ok(!problems.includes(tpl2), `${tpl2} is not rendered on Problems`);
  }
});

test('People, Teams and Organizations show the feature profile that applies', () => {
  const js = read('client/components/settings/peopleBody.js');
  for (const cols of ['PEOPLE_COLUMNS', 'TEAM_COLUMNS', 'ORG_COLUMNS']) {
    const block = js.slice(js.indexOf(`const ${cols} = [`), js.indexOf('];', js.indexOf(`const ${cols} = [`)));
    assert.match(block, /labelKey: 'feature-profiles'/, cols);
  }
  const jade = read('client/components/settings/peopleBody.jade');
  for (const cls of ['td.people-feature-profile', 'td.team-feature-profile', 'td.org-feature-profile']) assert.ok(jade.includes(cls), cls);
  assert.match(read('server/publications/people.js'), /featureProfileId: 1,/);
});

test('the docs mirror it, and explain the layers in one place', () => {
  for (const page of ['Appearance', 'Features', 'Feature-Profiles', 'Security', 'Activities-and-Notifications', 'Delete']) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', `docs/Features/Admin-Panel/Settings/${page}.md`)), page);
  }
  assert.ok(!fs.existsSync(path.join(__dirname, '..', 'docs/Features/Admin-Panel/Settings/Visibility.md')), 'Visibility.md became Appearance.md');
  const map = read('docs/Features/Admin-Panel/Who-Sees-What.md');
  for (const link of ['Settings/Features.md', 'Settings/Feature-Profiles.md', '../Board-Sidebar/Members/Members.md', '../Lists/List-Permissions.md']) {
    assert.ok(map.includes(link), link);
  }
});
