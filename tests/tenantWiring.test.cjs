'use strict';
// The pure modules are ES modules (every app file is one in Meteor), so they are
// loaded with a dynamic import - the same way tests/cardUrl.test.cjs loads its module.
(async () => {

// Multitenancy option D — the wiring.
//
// The three pure modules are tested on their own (tenants / tenantAdmin /
// tenantBackup). These are the guards that the rest of WeKan actually ASKS them
// instead of deciding again: a rule that only one of the two sides applies is worse
// than no rule, because it reads as if it were enforced.
//
// Source guards, since there is no Meteor runtime here to boot the app.
// Run: node tests/tenantWiring.test.cjs
//
// See docs/Design/Multitenancy/Multitenancy.md (D.1–D.9).

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const tenants = await import('../models/lib/tenants.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const live = s => s.replace(/^\s*\/\/.*$/gm, '');
const liveJade = s => s.replace(/^\s*\/\/-.*$/gm, '');

console.log('tenantWiring:');

// ── the modules are ES modules ───────────────────────────────────────────────

test('the pure modules use ESM exports, not module.exports', () => {
  // Every app file is an ES module in Meteor: `module.exports = {…}` in one of these
  // throws the moment the CLIENT bundle loads it -
  //   Uncaught Error: ES Modules may not assign module.exports
  // - and it takes down every module after it in the graph, so the Admin Panel, the
  // board and the login form all disappear at once. These three are imported by
  // models/users.js, which the client bundles, so they must be ESM.
  for (const mod of ['models/lib/tenants.js', 'models/lib/tenantAdmin.js',
    'models/lib/tenantBackup.js']) {
    const src = read(mod);
    assert.ok(/\nexport \{/.test(src), `${mod}: must export with ESM syntax`);
    assert.ok(!/module\.exports/.test(live(src)), `${mod}: must not assign module.exports`);
  }
  // …and every importer uses `import`, not require(), for the same reason.
  for (const f of ['models/users.js', 'server/models/users.js', 'server/models/org.js',
    'server/publications/people.js', 'server/publications/org.js',
    'server/publications/settings.js', 'server/lib/tenantResolver.js',
    'server/methods/tenant.js', 'server/methods/backup.js',
    'client/components/settings/peopleBody.js',
    'client/components/settings/attachments.js',
    'client/components/settings/settingBody.js']) {
    const src = read(f);
    assert.ok(!/require\('\/models\/lib\/tenant/.test(src),
      `${f}: import the tenant modules, do not require() them`);
  }
});

// ── off by default ───────────────────────────────────────────────────────────

test('nothing happens unless the deployment sets MULTITENANCY=true', () => {
  const resolver = read('server/lib/tenantResolver.js');
  assert.ok(/isTenancyEnabled\(process\.env\)/.test(resolver),
    'the switch is read from the environment, in one place');
  // Every entry point checks it: the resolver, the root URL, the runtime config
  // hook and the startup that installs it.
  ['function tenantForHeaders', 'function tenantRootUrlFor', 'function installRuntimeConfigHook']
    .forEach(fn => {
      const body = resolver.slice(resolver.indexOf(fn));
      assert.ok(/if \(!enabled\(\)\)/.test(body.slice(0, 400)),
        `${fn} returns early when tenancy is off`);
    });
});

test('X-Forwarded-Host is only believed through the shared rule', () => {
  const resolver = read('server/lib/tenantResolver.js');
  assert.ok(/trustsProxyHost\(process\.env\)/.test(resolver),
    'the trust decision comes from the pure module and the environment');
  assert.ok(/requestHost\(headers, \{ trustProxy: trustProxy\(\) \}\)/.test(resolver),
    'and every host read goes through requestHost with it');
  assert.ok(!/headers\['x-forwarded-host'\]/.test(live(resolver)),
    'no hand-rolled header read anywhere in the resolver');
});

// ── problem 2: the client bundle ─────────────────────────────────────────────

test('the per-host runtime config hook rewrites ROOT_URL and the DDP URL', () => {
  const resolver = read('server/lib/tenantResolver.js');
  assert.ok(/WebApp\.addRuntimeConfigHook/.test(resolver), 'uses the Meteor hook meant for this');
  assert.ok(/config\.ROOT_URL = rootUrl/.test(resolver));
  assert.ok(/config\.DDP_DEFAULT_CONNECTION_URL = rootUrl/.test(resolver),
    'or a client loaded from b.example.com would open its DDP connection to a.example.com');
  assert.ok(/decodeRuntimeConfig/.test(resolver) && /encodeRuntimeConfig/.test(resolver),
    'encoded with Meteor\'s own helpers - the hook does not check what it is given');
  assert.ok(/return null/.test(resolver),
    'an unknown host leaves Meteor\'s own config untouched');
});

// ── D.7: the admin rules are asked, not re-decided ───────────────────────────

test('the people publication and its count use the SAME scope function', () => {
  const pub = read('server/publications/people.js');
  const count = read('server/models/users.js');
  assert.ok(/tenantAdmin\.canOpenAdminPanel\(user\)/.test(pub),
    'the publication opens for a per-tenant admin too');
  // GHSA-phm4-4v26-j2vq: what reaches the scope function is the selector AFTER the
  // injection guard, not the raw one. The scoping rule is unchanged - it still
  // merges the restriction under $and - but it no longer has to be handed a
  // selector that might carry $where, because merging never stripped that out.
  assert.ok(/tenantAdmin\.peopleScopeSelector\(user, safeQuery\)/.test(pub),
    'and scopes with the shared rule, applied to the guarded query');
  assert.ok(/safeSelector\(query, 'people'\)/.test(pub),
    'which means the guard has to run first');
  assert.ok(!/user\.isAdmin/.test(live(pub)), 'no second opinion left in the publication');
  // Same rule, same guard: the count and the page ids both scope the selector the
  // publication scopes, and both hand it over only after the injection guard
  // (GHSA-phm4-4v26-j2vq) has had it.
  assert.ok(/tenantAdmin\.peopleScopeSelector\(currentUser, safeSelector\(query \|\| \{\}, 'getUsersCollectionCount'\)\)/.test(count),
    'getUsersCollectionCount is scoped the same way, or the pager counts the wrong set');
  assert.ok(/tenantAdmin\.peopleScopeSelector\(currentUser, safeSelector\(query \|\| \{\}, 'getPeoplePageIds'\)\)/.test(count),
    'and so is getPeoplePageIds, which reads the page back');
});

test('the org publication and its count are scoped the same way', () => {
  const pub = read('server/publications/org.js');
  const count = read('server/models/org.js');
  assert.ok(/tenantAdmin\.orgScopeSelector\(user, safeQuery\)/.test(pub));
  assert.ok(/tenantAdmin\.orgScopeSelector\(user, safeSelector\(query \|\| \{\}, 'getOrgsCollectionCount'\)\)/.test(count));
  assert.ok(/tenantAdmin\.canOpenAdminPanel\(user\)/.test(count));
});

test('the org publication publishes the tenant fields the panes need', () => {
  const pub = read('server/publications/org.js');
  const { brandingOrgFields } = tenants;
  assert.ok(/orgDomains: 1/.test(pub), 'the hostnames');
  brandingOrgFields().forEach(field => {
    assert.ok(new RegExp(`${field}: 1`).test(pub), `${field} must be published`);
  });
});

test('appointing a per-tenant admin writes the membership flag, never isAdmin', () => {
  const methods = read('server/methods/tenant.js');
  const setOrgAdmin = methods.slice(methods.indexOf('async setOrgAdmin'));
  assert.ok(/'orgs\.\$\.isAdmin': value/.test(setOrgAdmin),
    'it writes the per-org flag on the membership the user already has');
  assert.ok(!/\{ \$set: \{ isAdmin/.test(setOrgAdmin),
    'and never the site-wide flag');
  assert.ok(/tenantAdmin\.canSetOrgAdmin\(actor, orgId\)/.test(setOrgAdmin));
  assert.ok(/tenantAdmin\.canManageUser\(actor, target\)/.test(setOrgAdmin),
    'a per-tenant admin may not touch a site admin');
  assert.ok(/not-a-member/.test(setOrgAdmin),
    'and may not appoint someone who is not a member of the org');
});

test('the org tenant fields are refused when another org already claims the host', () => {
  const methods = read('server/methods/tenant.js');
  const setFields = methods.slice(methods.indexOf('async setOrgTenantFields'),
    methods.indexOf('async listOrgMembers'));
  assert.ok(/tenantAdmin\.canManageOrg\(user, orgId\)/.test(setFields));
  assert.ok(/conflictingHosts/.test(setFields) && /tenant-domain-taken/.test(setFields),
    'a host two orgs claim is refused, with the host named');
  assert.ok(/parseHostList/.test(setFields),
    'and what is stored is the normalised list, so what an admin reads back is what is matched');
});

// ── D.8: per-tenant backup ───────────────────────────────────────────────────

test('backup and restore ask the pure module for every decision', () => {
  const backup = read('server/methods/backup.js');
  assert.ok(/tenantBackup\.resolveBackupScope/.test(backup), 'the scope is resolved, not assumed');
  assert.ok(/tenantBackup\.tenantBackupRelativeDir/.test(backup), 'the archive path');
  assert.ok(/tenantBackup\.exportSelector/.test(backup), 'the export selectors');
  assert.ok(/tenantBackup\.docBelongsToTenant/.test(backup), 'the restore-side guard');
  assert.ok(/tenantBackup\.allowedRestoreBoardIds/.test(backup), 'the intersection');
  assert.ok(/tenantBackup\.canUseBackupPath/.test(backup), 'who may use an archive');
  assert.ok(/tenantBackup\.orgIdOfBackupPath/.test(backup), 'which tenant an archive is');
});

test('a tenant restore is scoped by the ARCHIVE, not by the caller', () => {
  const backup = read('server/methods/backup.js');
  const restore = backup.slice(backup.indexOf('async restoreBackup'),
    backup.indexOf('async listBackups'));
  assert.ok(/doRestore\(zipPath, mode, tenantBackup\.orgIdOfBackupPath\(zipPath\)\)/.test(restore),
    'so a tenant archive is restored as that tenant even by the site admin');
  assert.ok(/canUseBackupPath/.test(restore), 'and only by someone who may use it');
});

test('a tenant restore never empties a shared collection', () => {
  const backup = read('server/methods/backup.js');
  assert.ok(/if \(mode === 'replace-all' && !tenant\) \{ await c\.deleteMany/.test(backup),
    '"replace all" replaces this tenant\'s documents, not everyone\'s');
});

test('a tenant restore refuses an entry for a collection a tenant does not own', () => {
  const backup = read('server/methods/backup.js');
  assert.ok(/if \(tenant && !tenantBackup\.isTenantCollection\(coll\)\)/.test(backup),
    'a users.ndjson inside a tenant archive is refused outright');
});

test('a tenant archive carries no avatars, and only its own attachment files', () => {
  const backup = read('server/methods/backup.js');
  assert.ok(/Avatars are NOT part of a tenant archive/.test(backup),
    'the export says so');
  assert.ok(/allowedFileIds\.has\(fileId\)/.test(backup),
    'and the restore only writes files whose attachment record passed the guard');
});

test('the backup list shows only the archives the caller may restore', () => {
  const backup = read('server/methods/backup.js');
  const list = backup.slice(backup.indexOf('async listBackups'),
    backup.indexOf('async getBackupSchedule'));
  assert.ok(/canUseBackupPath/.test(list),
    'the list and the permission cannot disagree');
  assert.ok(/orgId: tenantBackup\.orgIdOfBackupPath/.test(list),
    'and each row says which scope it is');
});

test('the scheduled backup stays instance-wide and site-admin only', () => {
  const backup = read('server/methods/backup.js');
  const save = backup.slice(backup.indexOf('async saveBackupSchedule'));
  assert.ok(/await requireAdmin\(\)/.test(save.slice(0, 300)),
    'one cron, one archive of everything - a per-tenant admin backs up on demand');
});

// ── D.9: branding ────────────────────────────────────────────────────────────

test('per-tenant branding is applied where the settings document is published', () => {
  const pub = read('server/publications/settings.js');
  assert.ok(/tenantForConnection\(this\.connection\)/.test(pub),
    'the tenant comes from the connection\'s own host');
  assert.ok(/tenants\.tenantBrandingOverrides\(org\)/.test(pub));
  assert.ok(/if \(!org\) \{\s*\n\s*return Settings\.find\(\{\}, \{ fields: SETTING_FIELDS \}\);/.test(pub),
    'no tenancy, or a host nobody claims: exactly the cursor it always was');
  assert.ok(/observeChanges/.test(pub), 'and a tenant\'s copy stays reactive');
});

test('an instance setting cannot overwrite a tenant\'s own value', () => {
  const pub = read('server/publications/settings.js');
  const changed = pub.slice(pub.indexOf('changed: (id, doc)'), pub.indexOf('removed: id'));
  assert.ok(/if \(overrides\[field\] !== undefined\) patch\[field\] = overrides\[field\]/.test(changed),
    'the tenant\'s value wins whatever the instance sets afterwards');
});

// ── the Admin Panel ──────────────────────────────────────────────────────────

test('the Admin Panel pages open for a per-tenant admin, and scope their menus', () => {
  const peopleJade = liveJade(read('client/components/settings/peopleBody.jade'));
  const attachJade = liveJade(read('client/components/settings/attachments.jade'));
  assert.ok(/unless currentUser\.isAdminOrOrgAdmin/.test(peopleJade));
  assert.ok(/unless currentUser\.isAdminOrOrgAdmin/.test(attachJade));

  const peopleJs = read('client/components/settings/peopleBody.js');
  const attachJs = read('client/components/settings/attachments.js');
  assert.ok(/tenantAdmin\.tenantAdminPeopleMenu\(items, user\)/.test(peopleJs),
    'the People menu is filtered by the shared rule');
  assert.ok(/tenantAdmin\.tenantAdminAttachmentsMenu\(items, user\)/.test(attachJs),
    'and so is the Attachments menu');
  assert.ok(/function firstPeoplePaneId/.test(peopleJs),
    'the page opens on the first pane the user actually has, not on Login');
});

test('the user helpers exist, so Blaze can ask the same questions', () => {
  const users = read('models/users.js');
  assert.ok(/isAdminOrOrgAdmin\(\) \{\s*\n\s*return tenantAdmin\.canOpenAdminPanel\(this\);/.test(users));
  assert.ok(/isOrgAdmin\(\) \{\s*\n\s*return tenantAdmin\.isTenantAdmin\(this\);/.test(users));
  assert.ok(/'orgs\.\$\.isAdmin'/.test(users), 'and the schema carries the per-org flag');
});

test('Settings and Problems stay site-admin only in the tab bar', () => {
  const header = liveJade(read('client/components/settings/settingHeader.jade'));
  // The tabs are icon-only `.board-header-btn`s in the FIRST top header bar
  // now, beside the notification bell - they were labelled
  // `.setting-header-btn`s in a second bar of their own. The RULE is unchanged
  // and is what this checks: a per-tenant Global Admin gets People and
  // Attachments, and not Settings or Problems.
  const settingsTab = header.slice(header.indexOf('.admin-panel-tabs'));
  assert.ok(/if currentUser\.isAdmin\n\s+a\.board-header-btn\.settings/.test(settingsTab),
    'Settings is behind the site-admin check');
  assert.ok(/if currentUser\.isAdmin\n\s+a\.board-header-btn\.problems/.test(settingsTab),
    'and so is Problems');
  // People and Attachments are NOT behind that check - a per-tenant admin needs them.
  assert.ok(/\n {6}a\.board-header-btn\.people/.test(settingsTab), 'People is not');
  assert.ok(/\n {6}a\.board-header-btn\.informations/.test(settingsTab), 'nor Attachments');
});

test('the Organizations row can appoint the org\'s own admins', () => {
  const jade = liveJade(read('client/components/settings/peopleBody.jade'));
  const js = read('client/components/settings/peopleBody.js');
  assert.ok(/a\.js-org-admins/.test(jade), 'from the ⋯ menu the row already had');
  assert.ok(/template\(name="orgAdminsPopup"\)/.test(jade));
  assert.ok(/'click \.js-org-admins': Popup\.open\('orgAdmins'\)/.test(js));
  assert.ok(/Meteor\.call\('setOrgAdmin'/.test(js));
  assert.ok(/Meteor\.call\('listOrgMembers'/.test(js));
});

test('the Backup pane offers a scope, and asks the server for the list', () => {
  const jade = liveJade(read('client/components/settings/attachments.jade'));
  const js = read('client/components/settings/attachments.js');
  assert.ok(/select\.wekan-form-control\.js-backup-scope/.test(jade));
  assert.ok(/backup-scope-instance/.test(jade), 'the whole instance is one of the choices');
  assert.ok(/if isSiteAdmin/.test(jade), 'but only for the site admin');
  assert.ok(/Meteor\.call\('myAdminOrgs'/.test(js), 'the list comes from the server');
  assert.ok(/Meteor\.call\('runBackup', opts, storage, orgId \|\| null/.test(js));
});

// ── the site theme (D.9 / docs/Features/Page/Theme.md) ─────────────────────────

test('Visibility gets a Change color section, above Logo, using the SHARED picker', () => {
  const jade = liveJade(read('client/components/settings/settingBody.jade'));
  const pane = jade.slice(jade.indexOf("template(name='tableVisibilityModeSettings')"),
    jade.indexOf("template(name='announcementSettings')"));
  const iColor = pane.indexOf("{{_ 'change-color'}}");
  const iLogo = pane.indexOf("{{_ 'settings-group-logo'}}");
  assert.ok(iColor > 0 && iLogo > 0 && iColor < iLogo, 'Change color sits above Logo');
  assert.ok(/\+themeColorPicker\(scope="admin"\)/.test(pane),
    'the same template Board Settings and Member Settings render, with a scope');
  assert.ok(!/board-background-select/.test(pane), 'no picker markup copied into the pane');
});

test('the site admin is told their colour reaches every Organization', () => {
  const jade = liveJade(read('client/components/settings/settingBody.jade'));
  const pane = jade.slice(jade.indexOf("template(name='tableVisibilityModeSettings')"),
    jade.indexOf("template(name='announcementSettings')"));
  const section = pane.slice(pane.indexOf("{{_ 'change-color'}}"), pane.indexOf('+themeColorPicker'));
  assert.ok(/if isSiteAdmin\n\s+h3\.admin-pane-subgroup-title \{\{_ 'theme-override-all-tenants'\}\}/.test(section),
    'a smaller line under the section title, and only for the site admin');
  const css = read('client/components/settings/settingBody.css');
  assert.ok(/\.admin-pane-subgroup-title \{/.test(css), 'which has a style of its own');
});

test('every other group of Visibility stays site-admin only', () => {
  const jade = liveJade(read('client/components/settings/settingBody.jade'));
  const pane = jade.slice(jade.indexOf("template(name='tableVisibilityModeSettings')"),
    jade.indexOf("template(name='announcementSettings')"));
  // Each instance-wide group writes the INSTANCE settings, so an Organization's
  // admin must not be shown it: they would be editing everyone's.
  ['all-boards-hide', 'settings-group-url', 'custom-product-name', 'settings-group-logo']
    .forEach(key => {
      const i = pane.indexOf(`{{_ '${key}'}}`);
      assert.ok(i > 0, `${key} is still there`);
      const before = pane.slice(0, i);
      assert.ok(before.lastIndexOf('if isSiteAdmin') > before.lastIndexOf('+themeColorPicker'),
        `${key} is inside an isSiteAdmin block`);
    });
});

test('the picker knows three scopes, and the admin one writes through the server', () => {
  const picker = read('client/components/main/themeColorPicker.js');
  assert.ok(/const SCOPES = \['board', 'global', 'admin'\]/.test(picker));
  assert.ok(/Meteor\.call\('getAdminThemeColor'/.test(picker), 'it asks whose theme it is setting');
  assert.ok(/Meteor\.call\('setAdminThemeColor', color, custom/.test(picker));
  assert.ok(/Meteor\.call\('setAdminThemeColor', null, null\)/.test(picker),
    'and "Default theme" clears it');
});

test('the server decides whose theme is written, and validates the colour', () => {
  const methods = read('server/methods/tenant.js');
  const set = methods.slice(methods.indexOf('async setAdminThemeColor'));
  assert.ok(/tenantAdmin\.themeTarget\(user, org && org\._id\)/.test(set),
    'the shared rule, from the caller and the host they are on');
  assert.ok(/BOARD_COLORS\.includes\(color\)/.test(set), 'a theme name from the shared list');
  assert.ok(/isHexColor/.test(set), 'and custom colours are hex, or dropped');
  assert.ok(/themeColor: color/.test(set) && /orgThemeColor: color/.test(set),
    'the instance document or the Organization, never both');
});

test('the order of themes is default -> site/Organization -> user, at runtime', () => {
  const apply = read('client/components/main/globalThemeColor.js');
  const iUser = apply.indexOf('const globalColor = user');
  // The site colour is read in two places - a helper that only NAMES the class,
  // and the autorun that applies it. The order that matters is the one in the
  // autorun, so look for it after the user override rather than taking whichever
  // comes first in the file.
  const iSite = apply.indexOf('const siteColor = !board', iUser);
  assert.ok(iUser > 0 && iSite > iUser, 'the user override is tried first, so it wins');
  assert.ok(/!board && setting && setting\.themeColor/.test(apply),
    'and the site theme is not applied on a board page, where the board\'s colour owns it');
  const pub = read('server/publications/settings.js');
  assert.ok(/themeColor: 1/.test(pub) && /themeCustomColors: 1/.test(pub),
    'the site theme is published, so a tenant host serves its own');
  const themeField = tenants.BRANDING_FIELDS.find(f => f.setting === 'themeColor');
  assert.ok(themeField && themeField.org === 'orgThemeColor',
    'and an Organization overrides it like any other branding field');
});

test('an empty custom-colour list does not override the instance one', () => {
  const { tenantBrandingOverrides } = tenants;
  assert.deepStrictEqual(tenantBrandingOverrides({ orgThemeCustomColors: [] }), {});
  assert.deepStrictEqual(tenantBrandingOverrides({ orgThemeColor: 'belize' }),
    { themeColor: 'belize' });
  assert.deepStrictEqual(
    tenantBrandingOverrides({ orgThemeColor: 'belize', orgThemeCustomColors: ['#112233'] }),
    { themeColor: 'belize', themeCustomColors: ['#112233'] });
});

test('the design of the shared picker is written down', () => {
  const doc = read('docs/Features/Page/Theme.md');
  assert.ok(/scope="admin"/.test(doc) && /scope="board"/.test(doc) && /scope="global"/.test(doc));
  assert.ok(/Default theme/.test(doc) && /Site theme/i.test(doc) && /User's own/.test(doc),
    'including the order of themes');
  ['client/components/main/themeColorPicker.jade', 'models/lib/tenantAdmin.js']
    .forEach(f => assert.ok(doc.includes(f), `${f} is in the Related files table`));
});

test('every new i18n key the panes use exists in English', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  ['org-tenant', 'org-domains', 'org-domains-description', 'error-org-domain-taken',
    'org-admins', 'org-admins-description', 'backup-scope', 'backup-scope-instance',
    'backup-scope-description', 'theme-override-all-tenants'].forEach(key => {
    assert.ok(typeof en[key] === 'string' && en[key].length, `${key} must exist`);
  });
});

// ── the design document is the contract ──────────────────────────────────────

test('the design document says option D ships, and how it is turned on', () => {
  const doc = read('docs/Design/Multitenancy/Multitenancy.md');
  assert.ok(/Option D is implemented/.test(doc));
  assert.ok(/MULTITENANCY_TRUST_PROXY_HOST/.test(doc), 'the proxy-trust switch is documented');
  assert.ok(/models\/lib\/tenantBackup\.js/.test(doc), 'and the files it lives in');
  assert.ok(/SOFT tenancy|soft. tenancy|\*soft\* tenancy/i.test(doc),
    'and it says plainly what option D does NOT isolate');
});

console.log(`\n${passed} tests passed`);

})();
