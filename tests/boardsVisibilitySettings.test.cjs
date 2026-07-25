'use strict';

// "Hide card counter list on All Boards" and "Hide board member list on All
// Boards" moved from Admin Panel / Settings / Layout to Admin Panel / Settings /
// Visibility, which is where the rest of "what All Boards shows" lives (the
// pane id and its own i18n key are still tableVisibilityMode; the menu label is
// now the "visibility" key).
//
// "Don't show the board activities on all boards" moved out of Layout too, into
// its own pane, and stopped being a bulk write over every board.
//
// The move has a trap worth guarding: the Layout save read those two radios with
//   $('input[name=hideCardCounterList]:checked').val() === 'true'
// If that read is left behind after the inputs move, :checked matches nothing,
// .val() is undefined, the comparison yields FALSE, and pressing Save on Layout
// silently turns both settings OFF. So the reads must not be in PWA, and
// the new ones must not write a value they did not find.
//
// Run: node tests/boardsVisibilitySettings.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const jade = read('client/components/settings/settingBody.jade');
const js = read('client/components/settings/settingBody.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

// The two panes, isolated so "which pane is it in" is actually being asserted.
function template(name) {
  const start = jade.indexOf(`template(name='${name}')`);
  assert.ok(start >= 0, `template ${name} must exist`);
  const after = jade.indexOf('\ntemplate(name=', start + 1);
  return jade.slice(start, after === -1 ? undefined : after);
}
// One handler's body: from its key to the '  },' that closes it. Slicing to the
// next handler instead would include that handler's code, so an assertion like
// "Layout no longer writes X" would fail on the pane that legitimately does.
function handler(name) {
  const at = js.indexOf("'click button." + name + "'");
  assert.ok(at >= 0, `handler ${name} must exist`);
  return js.slice(at, js.indexOf('\n  },', at) + 5);
}
const boardsVisibility = template('tableVisibilityModeSettings');
// The old Layout pane is now PWA and holds only the PWA settings, so every
// 'must not be in PWA' check becomes 'must not be in PWA'.
const pwa = template('pwaSettings');

console.log('boardsVisibilitySettings:');

test('the pane is the one shown as "Visibility"', () => {
  // The menu label is the 'visibility' key; the pane id and its own
  // tableVisibilityMode key are unchanged, so its 141 translations still apply.
  assert.strictEqual(en.visibility, 'Visibility');
  const js = read('client/components/settings/settingBody.js');
  assert.ok(/id: 'tableVisibilityMode-setting'[^}]*labelKey: 'visibility'/.test(js),
    'the menu entry for this pane must be labelled with the visibility key');
});

test('both settings are now in the Visibility pane', () => {
  for (const id of ['hide-card-counter-list', 'hide-board-member-list']) {
    assert.ok(boardsVisibility.includes(id), `${id} must be in the Visibility pane`);
  }
  // Radios, with both states bound to the stored value as before.
  assert.ok(/name="hideCardCounterList"[\s\S]*?checked="\{\{#if currentSetting\.hideCardCounterList\}\}/.test(boardsVisibility));
  assert.ok(/name="hideBoardMemberList"[\s\S]*?checked="\{\{#if currentSetting\.hideBoardMemberList\}\}/.test(boardsVisibility));
  // And they are saved by the pane's own button.
  assert.ok(/js-tableVisibilityMode-save/.test(boardsVisibility));
});

test('neither setting is left behind in Layout', () => {
  for (const id of ['hide-card-counter-list', 'hide-board-member-list',
    'hideCardCounterList', 'hideBoardMemberList']) {
    assert.ok(!pwa.includes(id), `${id} must not be in the PWA pane`);
  }
});

test('the Layout save no longer writes them (this is the trap)', () => {
  assert.ok(!js.includes('js-save-layout'),
    'the Layout save is gone entirely - its fields moved with their inputs');
});

test('the Visibility save writes them, and only what it found', () => {
  const save = js.slice(js.indexOf("'click button.js-tableVisibilityMode-save'"));
  const body = save.slice(0, save.indexOf('\n  },') + 4);
  assert.ok(/allowPrivateOnly/.test(body), 'it still saves its own setting');
  assert.ok(/Settings\.update\(ReactiveCache\.getCurrentSetting\(\)\._id/.test(body),
    'the two flags live in Settings, so they are a second write');
  // Guarded: an input that is not on screen must not be written as false.
  assert.ok(/!== undefined/.test(body),
    'a missing radio must be skipped, never saved as false');
  assert.ok(/Object\.keys\(\$set\)\.length/.test(body),
    'and no empty update is sent');
});

test('the i18n keys are unchanged (the strings only moved)', () => {
  assert.strictEqual(en['hide-card-counter-list'], 'Hide card counter list on All Boards');
  assert.strictEqual(en['hide-board-member-list'], 'Hide board member list on All Boards');
});

test('hide board activities is its own pane, not a Layout button', () => {
  assert.ok(jade.includes("template(name='hideBoardActivitiesSettings')"),
    'it has its own pane now');
  assert.ok(!pwa.includes('js-all-boards-hide-activities'),
    'the Layout button must be gone');
  assert.ok(!js.includes('js-all-boards-hide-activities'),
    'and its handler with it');
  assert.ok(/id: 'hideBoardActivities-setting'/.test(js), 'it has a menu entry');
});

test('hide board activities is ONE global setting, not a write per board', () => {
  // The old implementation bulk-updated showActivities:false on every board
  // document. That could not be undone - the per-board values were overwritten
  // and gone - and did nothing for boards created afterwards.
  const body = handler('js-hide-board-activities-save');
  assert.ok(/Settings\.update\(ReactiveCache\.getCurrentSetting\(\)\._id/.test(body),
    'it writes ONE global setting');
  assert.ok(!/Boards\.update/.test(body), 'and never touches board documents');
  assert.ok(/=== undefined/.test(body), 'a missing radio is skipped, not saved as false');
  // Schema field exists, and the read side consults it FIRST.
  assert.ok(/hideBoardActivitiesOnAllBoards: \{\s*type: Boolean/.test(read('models/settings.js')),
    'the global flag must be in the Settings schema');
  const activities = read('client/components/activities/activities.js');
  const fn = activities.slice(activities.indexOf('function _showActivities'));
  assert.ok(fn.indexOf('hideBoardActivitiesOnAllBoards') < fn.indexOf('let ret = false'),
    'the global flag is read once, before any per-board value');
});

test('the Settings menu labels use existing translated keys', () => {
  // Renaming a menu entry must not invent a string that only English has. Both
  // renames point at keys that already exist in en.i18n.json.
  assert.ok(/id: 'registration-setting'[^}]*labelKey: 'login'/.test(js),
    'the sign-in pane is labelled with the existing login key');
  assert.strictEqual(en.login, 'Login');
  assert.strictEqual(en.visibility, 'Visibility');
  // The pane ids never changed, so no pane content lost its translations.
  assert.ok(js.includes("'registration-setting'") && js.includes("'tableVisibilityMode-setting'"),
    'the pane ids are unchanged');
});

test('the three account-access settings moved to Email and Login', () => {
  const email = template('email');
  const login = jade.slice(jade.indexOf('ul#registration-setting'), jade.indexOf("template(name='email')"));
  assert.ok(email.includes('accounts-allowEmailChange'), 'Allow Email Change is in Email');
  assert.ok(login.includes('accounts-allowUserNameChange'), 'Allow Username Change is in Login');
  assert.ok(login.includes('accounts-allowUserDelete'), 'Allow user self delete is in Login');
  // Each host pane has a Save that reaches them.
  assert.ok(/js-save\.primary/.test(email) && /js-account-access-save/.test(login));
  // The Accounts pane had nothing left, so it is gone - not left empty with a
  // stray Save button.
  assert.ok(!jade.includes("template(name='accountSettings')"), 'the empty pane is removed');
  assert.ok(!js.includes('js-accounts-save'), 'and its save handler with it');
  assert.ok(!/isAccountSetting/.test(jade) && !/isAccountSetting/.test(js),
    'and every reference to it');
});

test('the moved radios still see their values, and save what they found', () => {
  // A radio bound to a helper the HOST template does not have renders unchecked -
  // it would silently show the wrong value. The helpers moved with the settings.
  assert.ok(/Template\.email\.helpers\(accountAccessHelpers\)/.test(js),
    'Email gets the helpers');
  assert.ok(/Template\.setting\.helpers\(accountAccessHelpers\)/.test(js),
    'the Settings template (which hosts the Login pane) gets them too');
  const body = handler('js-account-access-save');
  assert.ok(/!== undefined/.test(body),
    'a radio that is not on screen must be skipped, never saved as false');
  assert.ok(/accounts-allowUserNameChange/.test(body) && /accounts-allowUserDelete/.test(body));
  // The settings still live in AccountSettings; only where they are SHOWN changed.
  assert.ok(/Meteor\.subscribe\('accountSettings'\)/.test(js),
    'the subscription must stay - the collection is unchanged');
});

test('Support, Email domain name and Legal notice moved out of Layout', () => {
  const email = template('email');
  const visibility = template('tableVisibilityModeSettings');
  // Support is one feature - the link, the enable toggle AND the content editor
  // it controls - so all of it moved, not just the two visible rows.
  assert.ok(visibility.includes('js-toggle-support'), 'Support enable toggle is in Visibility');
  assert.ok(visibility.includes('href="/support"'), 'the Support link with it');
  assert.ok(visibility.includes('js-support-save'), 'and the content editor it controls');
  assert.ok(visibility.includes('custom-legal-notice-link-url'), 'Legal notice URL is in Visibility');
  assert.ok(email.includes('can-invite-if-same-mailDomainName'), 'Email domain name is in Email');
  for (const gone of ['js-toggle-support', 'can-invite-if-same-mailDomainName',
    'custom-legal-notice-link-url']) {
    assert.ok(!pwa.includes(gone), `${gone} must not be in PWA`);
  }
});

test('the Layout save cannot wipe the two moved text fields', () => {
  // These are TEXT inputs, so the trap is worse than for a radio: a missing
  // input reads as undefined, ('' || '').trim() is '', and saving Layout would
  // have written an EMPTY string over the stored value.
  assert.ok(!js.includes('js-save-layout'), 'the Layout save is gone');
  // Their new homes write them only when the input is actually present.
  assert.ok(/\$\('#mailDomainNamevalue'\)\.length/.test(js),
    'the Email save guards on the input existing');
  assert.ok(/\$\('#legalNoticevalue'\)\.length/.test(js),
    'the Visibility save guards on the input existing');
});

test('the authentication-method settings moved to Login', () => {
  const login = jade.slice(jade.indexOf('ul#registration-setting'), jade.indexOf("template(name='email')"));
  assert.ok(login.includes('display-authentication-method'), 'the Yes/No is in Login');
  assert.ok(login.includes('+selectAuthenticationMethod'), 'the method dropdown with it');
  assert.ok(!pwa.includes('display-authentication-method'), 'not in PWA');
  assert.ok(!pwa.includes('selectAuthenticationMethod'), 'dropdown not in PWA');
});

test('the Login save keeps the empty-value guard the Layout save had', () => {
  assert.ok(!js.includes('js-save-layout'), 'the Layout save is gone');
  const body = handler('js-account-access-save');
  // The dropdown can read '' when nothing is chosen; saving that over the
  // REQUIRED defaultAuthenticationMethod string fails validation silently, which
  // is why the fallback exists. It had to travel with the setting.
  assert.ok(/resolveDefaultAuthenticationMethod\(/.test(body),
    'the fallback to the stored method must come along');
  assert.ok(/\$\('#defaultAuthenticationMethod'\)\.length/.test(body),
    'and it writes only when the dropdown is on screen');
  assert.ok(/display !== undefined/.test(body), 'same for the Yes/No radio');
});

test('Wait Spinner moved to Visibility', () => {
  const visibility = template('tableVisibilityModeSettings');
  assert.ok(visibility.includes("{{_ 'wait-spinner'}}"), 'the setting is in Visibility');
  assert.ok(visibility.includes('+selectSpinnerName'), 'with its dropdown');
  assert.ok(!pwa.includes('wait-spinner'), 'not in PWA');
  assert.ok(!js.includes('js-save-layout'), 'the Layout save is gone');
  assert.ok(/\$\('#spinnerName'\)\.length/.test(handler('js-tableVisibilityMode-save')),
    'the Visibility save writes it only when the input is on screen');
});

test('every Layout text field the panes took is guarded in its new home', () => {
  // The recurring hazard across all of these moves: the save handler left
  // behind. Each field that moved must be written only where its input now is.
  assert.ok(!js.includes('js-save-layout'),
    'no handler may be left reading inputs that now live in other panes');
});

test('Layout is now PWA, holding only PWA settings', () => {
  assert.ok(jade.includes("template(name='pwaSettings')"), 'the pane is pwaSettings');
  assert.ok(!jade.includes("template(name='layoutSettings')"), 'the old name is gone');
  // What it keeps: the custom head tags, the manifest and assetlinks.
  for (const keep of ['js-toggle-custom-head', 'custom-head-manifest-content',
    'js-toggle-custom-assetlinks', 'custom-assetlinks-content']) {
    assert.ok(pwa.includes(keep), `${keep} belongs in PWA`);
  }
  // What it must not: anything about branding or sign-in.
  for (const gone of ['custom-product-name', 'hide-logo', 'custom-login-logo-image-url',
    'custom-top-left-corner-logo-height', 'oidc-button-text', 'automatic-linked-url-schemes']) {
    assert.ok(!pwa.includes(gone), `${gone} must have moved out of PWA`);
  }
});

test('PWA is a literal label, never a translated string', () => {
  assert.ok(/label: 'PWA'/.test(js), 'the menu entry uses a literal label');
  assert.ok(!/labelKey: 'layout'/.test(js), 'not the layout i18n key any more');
  assert.ok(jade.includes('| PWA'), 'and the pane header is literal too');
  // No new i18n key was invented for an acronym.
  assert.ok(!('pwa' in en), 'PWA must not be added as a translatable string');
});

test('the branding group landed in Visibility with a guarded save', () => {
  const visibility = template('tableVisibilityModeSettings');
  for (const moved of ['custom-product-name', 'hide-logo', 'custom-login-logo-image-url',
    'custom-login-logo-link-url', 'text-below-custom-login-logo',
    'custom-top-left-corner-logo-image-url', 'custom-top-left-corner-logo-link-url',
    'custom-top-left-corner-logo-height', 'custom-help-link-url',
    'automatic-linked-url-schemes']) {
    assert.ok(visibility.includes(moved), `${moved} must be in Visibility`);
  }
  const save = handler('js-tableVisibilityMode-save');
  assert.ok(/\$\('#product-name'\)\.length/.test(save), 'each field is written only when shown');
  assert.ok(/document\.title = /.test(save), 'the product name still retitles the page');
  // OIDC button text went to Login instead.
  assert.ok(/\$\('#oidcBtnTextvalue'\)\.length/.test(handler('js-account-access-save')),
    'the OIDC button text is saved by Login, guarded the same way');
});

console.log(`\nboardsVisibilitySettings: ${passed} tests passed`);
