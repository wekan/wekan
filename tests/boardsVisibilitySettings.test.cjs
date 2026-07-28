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
// Both are ONE CHECKBOX each now, not a Yes/No pair (the same checkbox the rest of
// the Admin Panel uses), but the trap below is the same in either shape and is what
// these tests are really about.
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
  // Either quote style: the file has both `template(name='x')` and
  // `template(name="x")`, and looking for only one of them said a template that
  // is right there "must exist".
  const start = Math.max(
    jade.indexOf(`template(name='${name}')`),
    jade.indexOf(`template(name="${name}")`),
  );
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
  // The INPUT ids are unchanged - only the labels were renamed - so both the id and
  // the new label key have to be there.
  for (const id of ['hide-card-counter-list', 'hide-board-member-list']) {
    assert.ok(boardsVisibility.includes(id), `${id} must be in the Visibility pane`);
  }
  for (const key of ['card-counter-list', 'board-member-list']) {
    assert.ok(boardsVisibility.includes(`{{_ '${key}'}}`), `${key} must label its row`);
  }
  // One checkbox each now, not a Yes/No pair - the same checkbox the rest of the
  // Admin Panel uses - still bound to the stored value.
  assert.ok(/\.materialCheckBox#hide-card-counter-list\(class="\{\{#if currentSetting\.hideCardCounterList\}\}is-checked/.test(boardsVisibility));
  assert.ok(/\.materialCheckBox#hide-board-member-list\(class="\{\{#if currentSetting\.hideBoardMemberList\}\}is-checked/.test(boardsVisibility));
  assert.ok(!/type="radio"/.test(boardsVisibility.slice(0, boardsVisibility.indexOf('js-visibility-all-boards-save'))),
    'the All Boards section has no radios left');
  // And they are saved by their section's button - All Boards.
  assert.ok(/js-visibility-all-boards-save/.test(boardsVisibility));
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

test('the All Boards save writes them, and only what it found', () => {
  const body = handler('js-visibility-all-boards-save');
  assert.ok(/allowPrivateOnly/.test(body), 'it still saves its own setting');
  assert.ok(/TableVisibilityModeSettings\.update/.test(body),
    'boards visibility lives in its own collection, so it is a separate write');
  // Guarded: a checkbox that is not on screen must not be written as false.
  assert.ok(/\$\(selector\)\.length/.test(body) && /\$\('#accounts-allowPrivateOnly'\)\.length/.test(body),
    'a missing checkbox must be skipped, never saved as false');
  assert.ok(/hasClass\('is-checked'\)/.test(body),
    'and what is saved is whether the box is ticked');
  assert.ok(/saveVisibilitySettings\(\$set\)/.test(body),
    'and the Settings write goes through the helper that sends no empty update');
  assert.ok(/Object\.keys\(\$set\)\.length/.test(js), 'which is what that helper checks');
});

test('every Yes/No pair in the pane is a checkbox now', () => {
  // Each of these settings is on or off, so a pair of radios said the same thing
  // twice. They are the checkbox the rest of the Admin Panel uses - the plain square
  // when off, the green tick when on, the animation between - and each one's Save
  // reads the tick and still skips a checkbox that is not on screen.
  assert.ok(!/type="radio"/.test(boardsVisibility), 'no radios left in Visibility');
  for (const [id, cls] of [['accounts-allowPrivateOnly', 'js-toggle-all-boards-hide'],
    ['hide-board-activities', 'js-toggle-all-boards-hide'],
    ['hide-card-counter-list', 'js-toggle-all-boards-hide'],
    ['hide-board-member-list', 'js-toggle-all-boards-hide'],
    ['hide-logo', 'js-toggle-hide-logo']]) {
    assert.ok(new RegExp(`a\\.flex\\.${cls}\\s*\\n\\s*\\.materialCheckBox#${id}`).test(boardsVisibility),
      `${id} is a materialCheckBox under ${cls}`);
    assert.ok(new RegExp(`'click a\\.${cls}`).test(js), `${cls} has a handler`);
  }
  const logo = handler('js-visibility-logo-save');
  assert.ok(/\$\('#hide-logo'\)\.length/.test(logo) && /hasClass\('is-checked'\)/.test(logo),
    'Hide Logo is saved from its tick, and skipped when it is not on screen');
});

test('each section of Visibility has its own Save, above its rule', () => {
  // One Save for the whole pane meant pressing Save in one group also wrote
  // whatever was half-typed in another. Every section ends with its own button.
  const pane = boardsVisibility;
  const buttons = ['js-visibility-all-boards-save', 'js-visibility-url-save',
    'js-visibility-product-name-save', 'js-visibility-logo-save'];
  for (const cls of buttons) {
    assert.ok(pane.includes(cls), `${cls} must be in the pane`);
    assert.ok(handler(cls).length > 0, `${cls} must have a handler`);
  }
  // In section order, each above the rule that closes its section.
  const at = t => pane.indexOf(t);
  for (let i = 1; i < buttons.length; i += 1) {
    assert.ok(at(buttons[i - 1]) < at(buttons[i]), 'the buttons follow the sections');
  }
  // The separators cut the pane into sections; each section holds at most ONE
  // Save, and the Save belongs to the fields above it. Counting separators (it
  // was pinned at 3) breaks whenever a section is added - the site-theme picker
  // group did exactly that - so what is asserted is the shape, not the number.
  const rules = [...pane.matchAll(/li\.admin-pane-group-separator/g)].map(m => m.index);
  assert.ok(rules.length >= buttons.length,
    'every section but the first is opened by a rule');
  const bounds = [0, ...rules, pane.length];
  const sections = bounds.slice(0, -1).map((from, i) => pane.slice(from, bounds[i + 1]));
  for (const section of sections) {
    const saves = buttons.filter(b => section.includes(b));
    assert.ok(saves.length <= 1,
      `one Save per section, found ${saves.join(' + ')} in the same section`);
  }
  // The site-theme picker is the one group with NO Save: it applies immediately,
  // like the per-user "Change color" it mirrors (docs/Theme/Theme.md).
  const themeSection = sections.find(sec => sec.includes('themeColorPicker'));
  assert.ok(themeSection, 'the site theme picker is in this pane');
  assert.deepStrictEqual(buttons.filter(b => themeSection.includes(b)), [],
    'the theme picker applies immediately and has no Save');
  // And every Save is in a section of its own.
  assert.strictEqual(sections.filter(sec => buttons.some(b => sec.includes(b))).length,
    buttons.length, 'each Save has its own section');
  // The three buttons this replaces are gone - jade AND handler, together.
  for (const gone of ['js-tableVisibilityMode-save', 'js-hide-board-activities-save',
    'js-support-save']) {
    assert.ok(!pane.includes(gone), `${gone} must be gone from the pane`);
    assert.ok(!js.includes(`'click button.${gone}'`), `${gone}'s handler must be gone too`);
  }
  // No section may write another's field: the product name save writes exactly one.
  const product = handler('js-visibility-product-name-save');
  for (const foreign of ['hideLogo', 'legalNotice', 'spinnerName', 'allowPrivateOnly']) {
    assert.ok(!product.includes(foreign),
      `the Product name save must not write ${foreign}`);
  }
});

test('the All Boards labels are short, under a title that says "Hide"', () => {
  // The rows all sat under a title reading "All Boards" and each repeated it:
  // "Hide card counter list on All Boards". The title says "All Boards: Hide" and
  // each row says only what is hidden. Keys were renamed with their values, so no
  // language is left showing the old sentence under the new title - they fall back
  // to English until retranslated.
  assert.strictEqual(en['all-boards-hide'], 'All Boards: Hide');
  assert.strictEqual(en['public-boards'], 'Public boards');
  assert.strictEqual(en['board-activities'], 'Board activities');
  assert.strictEqual(en['card-counter-list'], 'Card counter list');
  assert.strictEqual(en['board-member-list'], 'Board member list');
  for (const gone of ['hide-card-counter-list', 'hide-board-member-list',
    'hide-activities-of-all-boards']) {
    assert.ok(!(gone in en), `${gone} was renamed, so it must be gone from en`);
    assert.ok(!new RegExp(`\\{\\{_ '${gone}'\\}\\}`).test(jade),
      `${gone} must not still be rendered anywhere`);
  }
  // 'all-boards' keeps its own value: the menus and the All Boards page use it.
  assert.strictEqual(en['all-boards'], 'All Boards');
  // ...and so does the boards-visibility setting's own key, which is the message
  // boardBody.jade shows on a board you may not open - where "Public boards" alone
  // would say nothing.
  assert.strictEqual(en['tableVisibilityMode-allowPrivateOnly'],
    'Boards visibility: Allow private boards only');
  assert.ok(read('client/components/boards/boardBody.jade')
    .includes("{{_ 'tableVisibilityMode-allowPrivateOnly'}}"),
    'which is why that key had to keep its sentence');
});

test('Visibility is named groups, in order, and nothing was dropped', () => {
  // A long flat list of settings with no grouping is the complaint this answers.
  // The settings themselves are untouched - so is every id, which is what the one
  // Save button at the bottom reads.
  const pane = jade.slice(jade.indexOf("ul#tableVisibilityMode-setting"),
    jade.indexOf("template(name='announcementSettings')"));
  const groups = [...pane.matchAll(/h2\.admin-pane-group-title \{\{_ '([\w-]+)'\}\}/g)]
    .map(m => m[1]);
  // The site-theme picker is a group of its own now - the same picker as the
  // per-user "Change color", one layer below it - and it sits between the product
  // name and the logo.
  assert.deepStrictEqual(groups,
    ['all-boards-hide', 'settings-group-url', 'custom-product-name', 'change-color',
      'settings-group-logo'],
    'the groups, top to bottom');
  // Product name holds ONE field, so its group title IS that field's label - with
  // the label's existing translation, at the group title's size. Printing both said
  // "Product name" twice.
  assert.strictEqual((pane.match(/custom-product-name/g) || []).length, 1,
    'the product name string must appear once in the pane, not as title AND label');
  for (const key of groups) {
    assert.ok(typeof en[key] === 'string' && en[key], `${key} must have an English string`);
  }
  // A group title is SMALLER than the pane title above it, or the page reads as
  // several pages stacked rather than one with groups.
  const css = read('client/components/settings/settingBody.css');
  const size = cls => parseFloat(/font-size:\s*([\d.]+)rem/
    .exec(new RegExp(`\\.${cls} \\{([^}]*)\\}`).exec(css)[1])[1]);
  assert.ok(size('admin-pane-group-title') < size('admin-pane-title'),
    'the group title must be smaller than the pane title');
  // Each setting is in the group it belongs to.
  const at = key => pane.indexOf(key);
  const group = key => groups.filter(g => at(g) > -1 && at(g) < at(key)).pop();
  for (const [key, expected] of [
    ['public-boards', 'all-boards-hide'],
    ['board-activities', 'all-boards-hide'],
    ['card-counter-list', 'all-boards-hide'],
    ['board-member-list', 'all-boards-hide'],
    ['wait-spinner', 'all-boards-hide'],
    ['support-page-enabled', 'settings-group-url'],
    ['custom-help-link-url', 'settings-group-url'],
    ['custom-legal-notice-link-url', 'settings-group-url'],
    ['automatic-linked-url-schemes', 'settings-group-url'],
    // custom-product-name is not listed here: it is the Product name group's TITLE,
    // checked in the group list above - the group holds one field, so the title is
    // its label.
    ['hide-logo', 'settings-group-logo'],
    ['custom-login-logo-image-url', 'settings-group-logo'],
    ['text-below-custom-login-logo', 'settings-group-logo'],
    ['custom-top-left-corner-logo-height', 'settings-group-logo'],
  ]) {
    assert.ok(at(key) > -1, `${key} must still be in the pane`);
    assert.strictEqual(group(key), expected, `${key} belongs under ${expected}`);
  }
  // A rule above every group but the first - All Boards opens the pane directly
  // under its title, so a rule there would separate it from nothing.
  assert.strictEqual((pane.match(/li\.admin-pane-group-separator/g) || []).length,
    groups.length - 1,
    'a horizontal rule above URL, Product name and Logo, but not above All Boards');
  const firstRule = pane.indexOf('li.admin-pane-group-separator');
  assert.ok(firstRule > pane.indexOf("_ 'all-boards-hide'") && firstRule < pane.indexOf("settings-group-url"),
    'the first rule sits between the All Boards group and the URL title');
  assert.ok(pane.indexOf('js-visibility-logo-save') > at('custom-top-left-corner-logo-height'),
    'the Logo section Save sits below every field it writes');
});

test('hide board activities sits in Visibility, under the visibility choice', () => {
  // It had a pane of its own for one radio pair. It is a visibility setting, so it
  // lives in the Visibility pane now - directly BELOW "allow private boards only".
  assert.ok(!jade.includes("template(name='hideBoardActivitiesSettings')"),
    'the one-setting pane is gone');
  assert.ok(!/id: 'hideBoardActivities-setting'/.test(js),
    'and so is its left-menu entry');
  const pane = jade.slice(jade.indexOf("ul#tableVisibilityMode-setting"),
    jade.indexOf("template(name='announcementSettings')"));
  const allow = pane.indexOf("_ 'public-boards'");
  const activities = pane.indexOf("_ 'board-activities'");
  assert.ok(activities > -1, 'it renders in the Visibility pane');
  assert.ok(allow > -1 && activities > allow, 'directly below the visibility choice');
  // The pane is in four named groups now (All Boards, URL, Product name, Logo), so
  // the branding fields sit in their OWN groups, below the All Boards one.
  for (const key of ['custom-product-name', 'hide-logo']) {
    const at = pane.indexOf(key);
    assert.ok(at > -1 && at > allow,
      key + ' belongs to a group of its own, below the All Boards settings');
  }
  // The old Layout button and handler stay gone.
  assert.ok(!pwa.includes('js-all-boards-hide-activities'), 'the Layout button must be gone');
  assert.ok(!js.includes('js-all-boards-hide-activities'), 'and its handler with it');
  // Its own Save is folded into the All Boards section save, which is what writes
  // the setting now - the section, not the single setting, owns the button.
  assert.ok(pane.includes('js-visibility-all-boards-save'),
    'the section save must exist, or the setting could not be saved');
});

test('hide board activities is ONE global setting, not a write per board', () => {
  // The old implementation bulk-updated showActivities:false on every board
  // document. That could not be undone - the per-board values were overwritten
  // and gone - and did nothing for boards created afterwards.
  const body = handler('js-visibility-all-boards-save');
  assert.ok(/hideBoardActivitiesOnAllBoards/.test(body), 'the section save writes it');
  assert.ok(/saveVisibilitySettings/.test(body)
    && /Settings\.update\(ReactiveCache\.getCurrentSetting\(\)\._id/.test(js),
    'it writes ONE global setting');
  assert.ok(!/Boards\.update/.test(body), 'and never touches board documents');
  // "Not on screen is left alone" is `if ($(selector).length)` now - the settings
  // are checkboxes rather than radios, and a checkbox reads `is-checked`, which is
  // false for a box that is not there. The guard is the length check.
  assert.ok(/if \(\$\(selector\)\.length\) \{/.test(body),
    'a setting whose checkbox is not on screen is skipped, not saved as false');
  assert.ok(/hasClass\('is-checked'\)/.test(body), 'and a shown one is read from its tick');
  // Schema field exists, and the read side consults it FIRST.
  assert.ok(/hideBoardActivitiesOnAllBoards: \{\s*type: Boolean/.test(read('models/settings.js')),
    'the global flag must be in the Settings schema');
  const activities = read('client/components/activities/activities.js');
  const fn = activities.slice(activities.indexOf('function _showActivities'));
  assert.ok(fn.indexOf('hideBoardActivitiesOnAllBoards') < fn.indexOf('let ret = false'),
    'the global flag is read once, before any per-board value');
});

test('the menu labels use existing translated keys', () => {
  // Renaming a menu entry must not invent a string that only English has. Both
  // renames point at keys that already exist in en.i18n.json.
  // The sign-in pane lives in Admin Panel / People now, so its entry is there.
  const people = read('client/components/settings/peopleBody.js');
  assert.ok(/id: 'registration-setting'[^}]*labelKey: 'login'/.test(people),
    'the sign-in pane is labelled with the existing login key');
  assert.strictEqual(en.login, 'Login');
  assert.strictEqual(en.visibility, 'Visibility');
  // The pane ids never changed when they moved, so no pane content lost its
  // translations - only which page hosts the entry did.
  assert.ok(people.includes("'registration-setting'") && js.includes("'tableVisibilityMode-setting'"),
    'the pane ids are unchanged');
});

test('the three account-access settings moved to Email and Login', () => {
  const email = template('email');
  const login = jade.slice(jade.indexOf('ul#registration-setting'), jade.indexOf("template(name='email')"));
  assert.ok(email.includes('accounts-allowEmailChange'), 'Allow Email Change is in Email');
  assert.ok(login.includes('accounts-allowUserNameChange'), 'Username Change is in Login');
  assert.ok(login.includes('accounts-allowUserDelete'), 'Self delete user account is in Login');
  // Each host pane has a Save that reaches them.
  assert.ok(/js-save\.primary/.test(email) && /js-account-access-save/.test(login));
  // The Accounts pane had nothing left, so it is gone - not left empty with a
  // stray Save button.
  assert.ok(!jade.includes("template(name='accountSettings')"), 'the empty pane is removed');
  assert.ok(!js.includes('js-accounts-save'), 'and its save handler with it');
  assert.ok(!/isAccountSetting/.test(jade) && !/isAccountSetting/.test(js),
    'and every reference to it');
});

test('the moved settings still see their values, and are written on click', () => {
  // A checkbox bound to a helper the HOST template does not have renders unticked -
  // it would silently show the wrong value. The helpers moved with the settings.
  assert.ok(/Template\.email\.helpers\(accountAccessHelpers\)/.test(js),
    'Email gets the helpers');
  assert.ok(/Template\.setting\.helpers\(accountAccessHelpers\)/.test(js),
    'the Settings template (which hosts the Login pane) gets them too');
  // Username change and self delete are checkboxes in the "Login: Allow" group now,
  // written on click - a checkbox that needs a Save button below it is a checkbox
  // you think you have already set.
  for (const [cls, id] of [['js-toggle-username-change', 'accounts-allowUserNameChange'],
    ['js-toggle-user-delete', 'accounts-allowUserDelete']]) {
    const body = js.slice(js.indexOf(`'click a.${cls}'`));
    const handlerBody = body.slice(0, body.indexOf('\n  },') + 5);
    assert.ok(handlerBody.includes(`AccountSettings.update('${id}'`),
      `${cls} must write ${id}`);
    assert.ok(/!allowed/.test(handlerBody), 'and toggle it, from the stored value');
  }
  // The Save at the bottom keeps only what is still a FIELD.
  const save = handler('js-account-access-save');
  assert.ok(!/allowUserNameChange|allowUserDelete|displayAuthenticationMethod/.test(save),
    'the Save must not still read radios that no longer exist');
  assert.ok(/defaultAuthenticationMethod/.test(save) && /oidcBtnTextvalue/.test(save),
    'it writes the method dropdown and the OIDC button text');
  // The settings still live in AccountSettings; only where they are SHOWN changed.
  assert.ok(/Meteor\.subscribe\('accountSettings'\)/.test(js),
    'the subscription must stay - the collection is unchanged');
});

test('Login: Allow is five ticked-when-allowed checkboxes', () => {
  // The pane mixed "Disable X" checkboxes with "Allow X: Yes/No" radios, so half
  // the rows meant the opposite of the other half. One group title says "Allow"
  // once, and every row is ticked when the thing is allowed.
  const login = template('general');
  assert.ok(/h2\.admin-pane-group-title \{\{_ 'login-allow'\}\}/.test(login),
    'the group title must be Login: Allow');
  assert.strictEqual(en['login-allow'], 'Login: Allow');
  assert.strictEqual(en.login, 'Login', 'the menu entry keeps its own label');
  for (const [key, value] of [['forgot-password', 'Forgot password'],
    ['self-registration', 'Self-Registration'],
    ['accounts-allowUserNameChange', 'Username Change'],
    ['accounts-allowUserDelete', 'Self delete user account'],
    ['display-authentication-method', 'Display Authentication Method']]) {
    assert.strictEqual(en[key], value, `${key} must read "${value}"`);
    assert.ok(login.includes(`{{_ '${key}'}}`), `${key} must label a row of the group`);
  }
  // The two "disable" flags are stored the other way round, so their checkbox asks
  // `unless` - the display inverts, the stored field does not.
  for (const field of ['disableForgotPassword', 'disableRegistration']) {
    assert.ok(new RegExp(`\\{\\{#unless currentSetting\\.${field}\\}\\}is-checked`).test(login),
      `${field} must be shown inverted: ticked means allowed`);
  }
  // The old keys are renamed; nothing renders them.
  for (const gone of ['disable-forgot-password', 'disable-self-registration']) {
    assert.ok(!(gone in en), `${gone} must be gone from en`);
    assert.ok(!jade.includes(gone), `${gone} must not be rendered anywhere`);
  }
  // No Yes/No radios left in this pane.
  assert.ok(!/name="allowUserNameChange"|name="allowUserDelete"|name="displayAuthenticationMethod"/.test(login),
    'the three radio pairs are checkboxes now');
  // A duplicate key in one event map silently overrides the earlier handler: the
  // dead `js-toggle-display-authentication-method` that only toggled a CSS class
  // sat after the real one and would have swallowed every click.
  assert.strictEqual((js.match(/'click a\.js-toggle-display-authentication-method'/g) || []).length, 1,
    'exactly one handler for the display-authentication-method toggle');
});

test('Support, Email domain name and Legal notice moved out of Layout', () => {
  const email = template('email');
  const visibility = template('tableVisibilityModeSettings');
  // Support is one feature - the link, the enable toggle AND the content editor
  // it controls - so all of it moved, not just the two visible rows.
  assert.ok(visibility.includes('js-toggle-support'), 'Support enable toggle is in Visibility');
  assert.ok(visibility.includes('href="/support"'), 'the Support link with it');
  assert.ok(visibility.includes('js-visibility-url-save'),
    'and the content editor it controls, saved with the rest of the URL section');
  assert.ok(visibility.includes('custom-legal-notice-link-url'), 'Legal notice URL is in Visibility');
  assert.ok(email.includes('email-domain-allowed-to-invite'),
    'the invite-domain field is in Email');
  for (const gone of ['js-toggle-support', 'email-domain-allowed-to-invite',
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
  // The Visibility saves go through visibilityTextFields(), which does the same
  // check once for every field it is given - `if ($(sel).length)` - instead of
  // repeating it per field at each call site.
  const helper = js.slice(js.indexOf('function visibilityTextFields'));
  assert.ok(/if \(\$\(sel\)\.length\) \{/.test(helper.slice(0, 400)),
    'the shared field reader skips an input that is not on screen');
  assert.ok(/\['#legalNoticevalue', 'legalNotice'\]/.test(js),
    'and the Visibility save is one of its callers');
});

test('the E-mail pane Save writes BOTH settings above it, and is below them', () => {
  // It wrote NEITHER. The SMTP fields are commented out of this pane, checkField()
  // throws on an input that is not there, and the throw was caught and swallowed -
  // so the handler returned before its Settings.update and pressing Save did
  // nothing at all. Allow email change was never written by anything in the app.
  const email = template('email');
  const at = t => email.indexOf(t);
  assert.ok(at('js-save') > at('email-domain-allowed-to-invite'),
    'the Save button sits below the invite-domain field');
  assert.ok(at('js-save') > at('accounts-allowEmailChange'),
    'and below the allow-email-change checkbox, not inside its row');
  // It is a checkbox now, not a Yes/No pair: the setting is on or off, and this is
  // the checkbox the rest of the Admin Panel uses.
  assert.ok(/a\.flex\.js-toggle-allow-email-change\s*\n\s*\.materialCheckBox#accounts-allowEmailChange/.test(email),
    'one materialCheckBox, the same markup as Announcement\'s active checkbox');
  assert.ok(!/name="allowEmailChange"/.test(email), 'the radio pair is gone');
  const save = js.slice(js.indexOf("'click button.js-save'"));
  const body = save.slice(0, save.indexOf('\n  },') + 5);
  assert.ok(/\$\('#mail-server-host'\)\.length/.test(body),
    'the SMTP fields are written only when that block is rendered - checkField '
    + 'throws on a missing input, and that throw is what swallowed the whole save');
  assert.ok(/\$\('#mailDomainNamevalue'\)\.length/.test(body),
    'the invite domain is written when its input is on screen');
  assert.ok(/AccountSettings\.update\('accounts-allowEmailChange'/.test(body),
    'and allow email change is written too - it lives in AccountSettings, so it is '
    + 'a second write');
  assert.ok(/\$\('#accounts-allowEmailChange'\)\.length/.test(body),
    'a checkbox that is not on screen is skipped, never saved as false');
  assert.ok(/hasClass\('is-checked'\)/.test(body),
    'and the value saved is whether the box is ticked');
  assert.ok(/Object\.keys\(\$set\)\.length/.test(body), 'no empty update is sent');
});

test('the invite-domain label says what the setting does', () => {
  // "Email domain name" said nothing about what it decides, and read as if it
  // limited who may sign in. It decides who may INVITE, and only while
  // self-registration is disabled (isNonAdminAllowedToSendMail).
  assert.strictEqual(en['email-domain-allowed-to-invite'],
    'Email domain allowed to invite people, when self-registration is disabled');
  assert.ok(!('can-invite-if-same-mailDomainName' in en), 'the old key is renamed');
  assert.ok(!/can-invite-if-same-mailDomainName/.test(jade),
    'and nothing renders it any more');
  // The behaviour the label now describes, in the code it describes.
  const settings = read('server/models/settings.js');
  assert.ok(/disableRegistration &&\s*\n\s*currSett\.mailDomainName/.test(settings),
    'the domain only grants invites while self-registration is disabled');
  assert.ok(/isNonAdminAllowedToSendMail/.test(settings), 'and only for non-admins');
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
  // The second field of this Save is the OIDC button text, and it is guarded the
  // same way. The Yes/No radio this used to check is not in this pane at all -
  // "display the authentication method" is a checkbox with its own click handler
  // (js-toggle-display-authentication-method), which writes the toggle directly.
  assert.ok(/\$\('#oidcBtnTextvalue'\)\.length/.test(body),
    'and so does the other field it saves');
  assert.ok(/if \(Object\.keys\(\$settings\)\.length\)/.test(body),
    'and nothing is written when neither is on screen');
  const js2 = read('client/components/settings/settingBody.js');
  assert.ok(/displayAuthenticationMethod: !shown/.test(js2),
    'the display toggle writes itself, from its own handler');
});

test('Wait Spinner moved to Visibility', () => {
  const visibility = template('tableVisibilityModeSettings');
  assert.ok(visibility.includes("{{_ 'wait-spinner'}}"), 'the setting is in Visibility');
  assert.ok(visibility.includes('+selectSpinnerName'), 'with its dropdown');
  assert.ok(!pwa.includes('wait-spinner'), 'not in PWA');
  assert.ok(!js.includes('js-save-layout'), 'the Layout save is gone');
  assert.ok(/\$\('#spinnerName'\)\.length/.test(handler('js-visibility-all-boards-save')),
    'the All Boards save writes it only when the input is on screen');
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
  // The pane header that also spelled it out is gone - Admin Panel / Settings shows
  // the left menu and the pane, with no title bar repeating the pane name - so the
  // menu entry is the only place PWA is written, and it must stay untranslated there.
  assert.ok(!/\.content-title/.test(jade), 'no title bar to carry a second copy');
  assert.ok(!/\{\{_ 'layout'\}\}/.test(jade), 'and nothing translates it back');
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
  const save = handler('js-visibility-product-name-save');
  assert.ok(/\$\('#product-name'\)\.length/.test(save), 'each field is written only when shown');
  assert.ok(/document\.title = /.test(save), 'the product name still retitles the page');
  // The logo fields are the Logo section's, guarded the same way - by the shared
  // helper that only collects an input that is actually on screen.
  assert.ok(/visibilityTextFields\(\[/.test(handler('js-visibility-logo-save')));
  assert.ok(/if \(\$\(sel\)\.length\)/.test(js), 'and that helper is the guard');
  // OIDC button text went to Login instead.
  assert.ok(/\$\('#oidcBtnTextvalue'\)\.length/.test(handler('js-account-access-save')),
    'the OIDC button text is saved by Login, guarded the same way');
});

console.log(`\nboardsVisibilitySettings: ${passed} tests passed`);
