'use strict';
// The Cloud Panel: many WeKan domains from one Weddy (models/lib/cloudPanel.js,
// server/methods/cloudPanel.js, client/components/settings/cloudPanel.*,
// docs/Platforms/FOSS/Weddy/Cloud-Panel.md). The rules as arithmetic, and the
// security properties as the source has to keep them.
(async () => {
  const assert = require('assert');
  const fs = require('fs');
  const path = require('path');
  const root = path.resolve(__dirname, '..');
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const c = await import('../models/lib/cloudPanel.js');

  let passed = 0;
  function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
  console.log('cloudPanel:');

  const FIRST = { WEDDY_CLOUD_DIR: '/var/lib/weddy/files/cloud' };
  const TENANT = { WEDDY_CLOUD_DIR: '/x', WEDDY_TENANT: 'true' };
  const SUPER = { username: 'xet7', emails: [{ address: 'Lauri.Ojansivu@wekan.fi' }] };

  test('Cloud exists only in the WeKan of Weddy\'s first domain', () => {
    assert.strictEqual(c.cloudEnabled(FIRST), true);
    assert.strictEqual(c.cloudEnabled({}), false, 'negative: a WeKan outside Weddy');
    assert.strictEqual(c.cloudEnabled(TENANT), false, 'negative: a customer\'s WeKan');
  });

  test('the SuperAdmin by username or e-mail, without case; nobody when unset', () => {
    assert.ok(c.isSuperAdmin(SUPER, 'lauri.ojansivu@wekan.fi'));
    assert.ok(c.isSuperAdmin(SUPER, ' XET7 '));
    assert.ok(!c.isSuperAdmin(SUPER, ''), 'negative: no SuperAdmin Username');
    assert.ok(!c.isSuperAdmin({ username: 'other', emails: [] }, 'xet7'), 'negative: another user');
    assert.ok(!c.isSuperAdmin(null, 'xet7'), 'negative: signed out');
  });

  test('the Cloud Panel: the SuperAdmin, on the Cloud Panel Domain, in the first domain\'s WeKan', () => {
    const base = { env: FIRST, user: SUPER, superAdminUsername: 'xet7', cloudPanelDomain: 'cloud.wekan.team' };
    assert.ok(c.cloudPanelAllowed({ ...base, host: 'Cloud.Wekan.Team:443' }));
    assert.ok(!c.cloudPanelAllowed({ ...base, host: 'customer.wekan.team' }), 'negative: another domain');
    assert.ok(!c.cloudPanelAllowed({ ...base, host: 'cloud.wekan.team', user: { username: 'u' } }), 'negative: not the SuperAdmin');
    assert.ok(!c.cloudPanelAllowed({ ...base, host: 'cloud.wekan.team', env: TENANT }), 'negative: a customer\'s WeKan');
    assert.ok(!c.cloudPanelAllowed({ ...base, host: '', cloudPanelDomain: '' }), 'negative: no Cloud Panel Domain');
  });

  test('a domain name is also a directory name: the same rule as Weddy', () => {
    for (const ok of ['customer.wekan.team', 'wekan.customer.com']) assert.ok(c.validDomain(ok), ok);
    for (const bad of ['', 'localhost', '../etc', 'a/b.com', 'a..b.com', 'UPPER.com', 'a b.com', '-a.com']) {
      assert.ok(!c.validDomain(bad), `negative: ${bad}`);
    }
    const weddy = path.join(root, '.tools/w/caddy-wekan-plugin/cloud.go');
    if (fs.existsSync(weddy)) {
      const goRe = fs.readFileSync(weddy, 'utf8').match(/regexp\.MustCompile\(`([^`]+)`\)/)[1];
      assert.strictEqual(goRe, String(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$/).slice(1, -1),
        'the rule in Weddy\'s cloud.go is the same');
    }
  });

  test('a Domains row: normalized, and each wrong field named', () => {
    const { row } = c.cleanDomainRow({ domain: 'Customer.Wekan.Team.', customerName: ' Oy ', startDate: '2026-11-07', endDate: '2027-11-06' });
    assert.deepStrictEqual(row, { domain: 'customer.wekan.team', customerName: 'Oy', customerEmail: '', billingEmail: '',
      startDate: '2026-11-07', endDate: '2027-11-06' });
    assert.strictEqual(c.cleanDomainRow({ domain: '../x' }).error, 'domain', 'negative');
    assert.strictEqual(c.cleanDomainRow({ domain: 'a.fi', billingEmail: 'nope' }).error, 'billingEmail', 'negative');
    assert.strictEqual(c.cleanDomainRow({ domain: 'a.fi', startDate: '2026-02-30' }).error, 'startDate', 'negative: no such day');
    assert.strictEqual(c.cleanDomainRow({ domain: 'a.fi', startDate: '2027-01-01', endDate: '2026-01-01' }).error, 'endDate',
      'negative: ends before it starts');
  });

  test('domains.json as Weddy reads it', () => {
    const f = c.domainsFile('Cloud.Wekan.Team', [{ domain: 'b.fi', endDate: '2027-01-01', _id: 'x' }, { domain: 'a.fi' }]);
    assert.deepStrictEqual(f, { cloudPanelDomain: 'cloud.wekan.team', domains: [{ domain: 'a.fi' }, { domain: 'b.fi', endDate: '2027-01-01' }] });
  });

  const server = read('server/methods/cloudPanel.js');
  const methodBody = name => {
    const i = server.indexOf(`async ${name}(`);
    assert.ok(i > 0, name);
    return server.slice(i, server.indexOf('\n  },', i));
  };

  test('every Domains and CloudFlare method checks the SuperAdmin on the panel domain', () => {
    for (const m of ['cloudDomains', 'cloudSaveDomain', 'cloudRemoveDomain', 'cloudSetCloudflareToken']) {
      assert.match(methodBody(m), /await requireSuperAdmin\(this\)/, m);
    }
    assert.match(methodBody('cloudSaveSettings'), /isSiteAdmin\(user\)/, 'the settings: a site admin');
    assert.match(server, /cloudPanelAllowed\(\{[\s\S]*host: hostOf\(method\.connection\)/);
  });

  test('negative: the CloudFlare key is never sent back, and its file is 0600', () => {
    for (const m of ['cloudStatus', 'cloudDomains', 'cloudSaveDomain', 'cloudSetCloudflareToken']) {
      assert.doesNotMatch(methodBody(m).replace(/JSON\.parse\([^;]*\)\.apiToken/, ''), /return[^;]*apiToken/, m);
    }
    assert.match(methodBody('cloudStatus'), /cloudflareTokenSet = !!JSON\.parse/, 'only whether one is set');
    assert.match(methodBody('cloudSetCloudflareToken'), /writeFileAtomic\(file, .*, 0o600\);/);
    assert.match(server, /writeFileSync\(tmp, text, \{ mode \}\)[\s\S]*chmodSync\(tmp, mode\)/);
  });

  test('negative: X-Forwarded-Host is not trusted for the panel domain', () => {
    const hostOf = server.slice(server.indexOf('function hostOf'), server.indexOf('}', server.indexOf('function hostOf')));
    assert.doesNotMatch(hostOf, /x-forwarded-host'\]/);
  });

  test('negative: the Cloud collections are not published', () => {
    const all = fs.readdirSync(path.join(root, 'server'), { recursive: true }).filter(f => f.endsWith('.js'))
      .map(f => fs.readFileSync(path.join(root, 'server', f), 'utf8')).join('\n');
    assert.doesNotMatch(all, /Meteor\.publish\([^)]*cloud(?:PanelSettings|Domains)/i);
    assert.doesNotMatch(all, /CloudDomains\.find\([^)]*\)\s*;?\s*\n\s*\}\);\s*\n\s*Meteor\.publish/);
  });

  test('the Cloud menu: only where Cloud exists, only for a site admin', () => {
    const people = read('client/components/settings/peopleBody.js');
    const menu = people.slice(people.indexOf('function peopleMenu'), people.indexOf('return items;', people.indexOf('function peopleMenu')));
    const tenantReturn = menu.indexOf('return tenantAdmin.tenantAdminPeopleMenu');
    const filter = menu.indexOf("items = items.filter(item => item.id !== 'cloud-setting')");
    assert.ok(menu.includes("{ id: 'cloud-setting', icon: 'fa-cloud', labelKey: 'cloud' }"));
    assert.ok(tenantReturn > 0 && filter > tenantReturn, 'removed where Cloud does not exist');
    assert.match(menu, /if \(!cloudStatus\.get\(\)\.enabled\) \{\s*items = items\.filter/);
    const tenant = read('models/lib/tenantAdmin.js');
    const allowed = tenant.slice(tenant.indexOf('TENANT_ADMIN_PEOPLE_PANES'), tenant.indexOf(']', tenant.indexOf('TENANT_ADMIN_PEOPLE_PANES')));
    assert.ok(!allowed.includes('cloud-setting'), 'negative: never in a per-tenant admin\'s whitelist');
    assert.match(read('models/lib/adminUrls.js'), /cloud: 'cloud-setting'/);
    assert.match(read('client/components/settings/peopleBody.jade'), /else if cloudSetting\.get\s*\n\s*\+cloudSettings/);
    assert.match(read('config/router.js'), /FlowRouter\.route\('\/cloud'/);
  });

  test('UI: the CloudFlare key field is write-only, the panel says no to others', () => {
    const jade = read('client/components/settings/cloudPanel.jade');
    assert.match(jade, /input\.wekan-form-control\.js-cloudflare-token\(type="password" autocomplete="new-password" value=""\)/);
    assert.match(jade, /unless status\.cloudPanel\s*\n\s*\| \{\{_ 'cloud-panel-not-allowed'\}\}/);
    for (const f of ['domain', 'customerName', 'customerEmail', 'billingEmail', 'startDate', 'endDate']) {
      assert.match(jade, new RegExp(`data-field="${f}"`), f);
    }
    const settings = read('client/features/settings.js');
    for (const f of ['cloudPanel.jade', 'cloudPanel.js', 'cloudPanel.css']) assert.ok(settings.includes(f), f);
  });

  console.log(`cloudPanel: ${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });
