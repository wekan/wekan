'use strict';

// Login and E-mail are Admin Panel / PEOPLE panes now, above Organizations.
//
// Both are about the people who can sign in and how they are reached, which is what
// that page is for. The move is only half markup: every handler those two panes need
// was registered on `Template.setting`, and Blaze delivers an event to the handlers of
// the template the element is IN. Left there, each pane would render on People and
// then quietly do nothing - no toggle would stick, no Save would save. So the handlers
// moved onto `Template.general` and `Template.email`, the templates that draw them,
// which is where they work wherever the pane is rendered.
//
// The panes' TEMPLATES stay in settingBody.jade beside the other admin panes (Blaze
// templates are global), and their handlers sit beside the other settings handlers in
// settingBody.js. Only which page renders them changed.
//
// Run: node tests/loginEmailPanesMoved.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const settingsJs = read('client/components/settings/settingBody.js');
const settingsJade = read('client/components/settings/settingBody.jade');
const peopleJs = read('client/components/settings/peopleBody.js');
const peopleJade = read('client/components/settings/peopleBody.jade');

// The handler keys of one Template.X.events({...}) block.
function handlerKeys(src, template) {
  const at = src.indexOf(`${template}.events({`);
  if (at < 0) return [];
  const lines = src.slice(at).split('\n');
  const keys = [];
  let depth = 0;
  for (const line of lines) {
    if (depth === 1) {
      const m = /^  '([^']+)'\(/.exec(line);
      if (m) keys.push(m[1]);
    }
    for (const ch of line) { if (ch === '{') depth += 1; else if (ch === '}') depth -= 1; }
    if (depth <= 0 && keys.length) break;
  }
  return keys;
}

const LOGIN_HANDLERS = ['click a.js-toggle-forgot-password', 'click a.js-toggle-registration',
  'click a.js-toggle-display-authentication-method', 'click a.js-toggle-board-choose',
  'click button.js-email-invite', 'click button.js-account-access-save'];
// "Add board members only from the same Organization or Team" left the Login pane
// entirely: it is two checkboxes now, each in the pane it is about (People /
// Organizations and People / Teams), so it is asserted there instead of here.
const ORG_TEAM_TOGGLES = ['click a.js-toggle-board-members-same-org',
  'click a.js-toggle-board-members-same-team'];
const EMAIL_HANDLERS = ['click a.js-toggle-tls', 'click button.js-save',
  'click button.js-send-smtp-test-email'];

console.log('loginEmailPanesMoved:');

test('People lists Login and E-mail above Organizations', () => {
  // peopleMenu(user) takes the current user since multitenancy option D: an
  // Organization's own admin gets the same menu, shorter.
  const menu = peopleJs.slice(peopleJs.indexOf('function peopleMenu(user)'),
    peopleJs.indexOf('];', peopleJs.indexOf('function peopleMenu(user)')));
  const at = id => menu.indexOf(`id: '${id}'`);
  assert.ok(at('registration-setting') > -1, 'Login is a People menu entry');
  assert.ok(at('email-setting') > -1, 'and so is E-mail');
  assert.ok(at('registration-setting') < at('email-setting'), 'Login first');
  assert.ok(at('email-setting') < at('org-setting'), 'both above Organizations');
  // Unchanged ids and i18n keys, so no pane lost its translations in the move.
  assert.ok(/id: 'registration-setting'[^}]*labelKey: 'login'/.test(menu));
  assert.ok(/id: 'email-setting'[^}]*labelKey: 'email'/.test(menu));
});

test('People renders both right-hand pages', () => {
  assert.ok(/else if registrationSetting\.get\s*\n\s*\+general/.test(peopleJade),
    'the Login pane renders on People');
  assert.ok(/else if emailSetting\.get\s*\n\s*\+email/.test(peopleJade),
    'and so does the E-mail pane');
  // With the state and helpers behind them, or the branch is never true.
  for (const v of ['registrationSetting', 'emailSetting']) {
    assert.ok(peopleJs.includes(`this.${v} = new ReactiveVar`), `${v} must exist`);
    assert.ok(peopleJs.includes(`this.${v}.set('`), `${v} must be set by the menu handler`);
    assert.ok(new RegExp(`  ${v}\\(\\) \\{`).test(peopleJs), `${v} needs a helper`);
  }
});

test('Settings no longer renders or lists them', () => {
  assert.ok(!/\+general\b/.test(settingsJade), 'the Login pane is not rendered here');
  assert.ok(!/\+email\b/.test(settingsJade), 'nor the E-mail pane');
  assert.ok(!/isGeneralSetting|isEmailSetting/.test(settingsJs),
    'and their helpers are gone, not left dangling');
  assert.ok(!/'registration-setting'|'email-setting'/.test(settingsJs),
    'their ids are gone from the menu and the id map');
});

test('Settings opens on a pane it still has', () => {
  // generalSetting was the var that started true. Removing it without promoting
  // another pane leaves the page opening on nothing at all. Visibility took that
  // role when Login moved out; Version has it now that Version is a pane of this
  // page and its first entry (docs/Features/Page/Left-Menu.md).
  assert.ok(/this\.versionSetting = new ReactiveVar\(true\)/.test(settingsJs),
    'Version is the first pane now, so it is the one that opens');
  const others = settingsJs.match(/this\.\w+Setting\w* = new ReactiveVar\(true\)/g) || [];
  assert.strictEqual(others.length, 1, 'exactly one pane may start open');
  // Multitenancy option D moves it to Visibility for an Organization's own admin,
  // who has no Version pane - in an autorun, once the user is known. Deciding that
  // at onCreated read a user document that has often not arrived, which opened the
  // wrong pane for the site admin too.
  assert.ok(/this\.openPaneDecided = false;/.test(settingsJs),
    'and the exception is decided once the user is known, not at onCreated');
});

test('each pane took its handlers with it', () => {
  // This is the half that fails silently: the markup renders, and nothing works.
  const onGeneral = handlerKeys(settingsJs, 'Template.general');
  const onEmail = handlerKeys(settingsJs, 'Template.email');
  const onSetting = handlerKeys(settingsJs, 'Template.setting');
  for (const key of LOGIN_HANDLERS) {
    assert.ok(onGeneral.includes(key), `${key} must be on Template.general now`);
    assert.ok(!onSetting.includes(key), `${key} must no longer be on Template.setting`);
  }
  for (const key of EMAIL_HANDLERS) {
    assert.ok(onEmail.includes(key), `${key} must be on Template.email now`);
    assert.ok(!onSetting.includes(key), `${key} must no longer be on Template.setting`);
  }
});

test('the board-member restriction lives in Organizations and Teams, not in Login', () => {
  // One checkbox in the Login pane restricted two things that are not in it. It
  // is two now, one per pane, and neither belongs to Login any more.
  for (const key of ORG_TEAM_TOGGLES) {
    assert.ok(peopleJs.includes(`'${key}'`), `${key} must be handled in the People panes`);
  }
  assert.ok(!/js-toggle-board-members-same-org-team/.test(peopleJs + settingsJs),
    'the single combined toggle is gone from both panes');
});

test('the panes that stayed kept theirs (negative)', () => {
  // The move must not have dragged another pane's handlers along.
  const onSetting = handlerKeys(settingsJs, 'Template.setting');
  for (const key of ['click a.js-toggle-hide-logo', 'click a.js-toggle-support',
    'click button.js-custom-head-save', 'click a.js-setting-menu']) {
    assert.ok(onSetting.includes(key), `${key} belongs to a pane that did not move`);
  }
});

test('both panes can read the account-access settings they show', () => {
  // A helper the host template does not have renders as unchecked - it silently
  // shows the wrong value rather than failing.
  assert.ok(/Template\.general\.helpers\(accountAccessHelpers\)/.test(settingsJs),
    'Login shows allowUserNameChange / allowUserDelete');
  assert.ok(/Template\.email\.helpers\(accountAccessHelpers\)/.test(settingsJs),
    'E-mail shows allowEmailChange');
});

test('every handler still targets a template that exists', () => {
  // Registering on a missing template throws at MODULE LOAD and takes out every
  // module after it - that is how the password field vanished from /sign-in once.
  for (const tpl of ['general', 'email']) {
    assert.ok(new RegExp(`template\\(name=['"]${tpl}['"]\\)`).test(settingsJade),
      `template ${tpl} must exist for its handlers`);
  }
});

console.log(`\nloginEmailPanesMoved: ${passed} tests passed`);
