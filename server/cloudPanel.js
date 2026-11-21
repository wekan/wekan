// Cloud Panel (docs/Features/Admin-Panel/Cloud-Panel.md, models/lib/cloudPanel.js).
//
// Who may do what:
//   Admin Panel / People / Cloud           site administrators: the Cloud
//                                          Panel Domain and its SuperAdmin
//   the panel (Cloudflare, Caddy, Domains, every invoice and chat)
//                                          the SuperAdmin - an administrator,
//                                          by username or e-mail address - on
//                                          the Cloud Panel Domain
//   a customer's invoices and chat         the customers a domain names, on the
//                                          panel's domain
//
// The panel answers only on its own domain: a method called from any other
// host is refused, so a customer domain never shows it whoever is signed in.
// Database passwords and the Cloudflare token are written here and never sent
// back. Nothing is published.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Random } from 'meteor/random';
import { MongoInternals } from 'meteor/mongo';
import Org from '/models/org';
import { CloudSettings, CloudDomains, CloudInvoices, CloudChatMessages } from '/models/cloudPanel';
import * as tenants from '/models/lib/tenants';
import { TABLE_PAGE_ROWS_PER_PAGE } from '/models/lib/tablePage';
const C = require('/models/lib/cloudPanel');

const SETTINGS_ID = 'cloud';
const MAX_DOMAINS = 10000;
const MAX_CHAT_PAGE = 200;
const MAX_IMPORTED_MESSAGES = 200000;
const BATCH = 1000;

function denied() {
  throw new Meteor.Error('not-authorized', 'You may not do that');
}

function invalid(error) {
  throw new Meteor.Error('invalid-input', (error && error.message) || 'Invalid input');
}

function validated(fn) {
  try { return fn(); } catch (e) { return invalid(e); }
}

async function stored() {
  const doc = await CloudSettings.findOneAsync(SETTINGS_ID);
  return {
    settings: (doc && doc.settings) || { domain: '', superAdminUsername: '' },
    cloudflare: (doc && doc.cloudflare) || { apiToken: '', zoneId: '', target: '', proxied: true },
    caddy: (doc && doc.caddy) || { adminUrl: '', sharedUpstream: '', email: '' },
  };
}

async function save(field, value) {
  await CloudSettings.upsertAsync(SETTINGS_ID, { $set: { [field]: value } });
}

async function userOf(userId) {
  if (!userId) return null;
  return Meteor.users.findOneAsync(userId, { fields: { username: 1, isAdmin: 1, loginDisabled: 1, emails: 1, 'profile.fullname': 1 } });
}

async function siteAdmin(userId) {
  const user = await userOf(userId);
  return !!(user && user.isAdmin === true && user.loginDisabled !== true);
}

// The host this method was called on.
function hostOf(connection) {
  const headers = (connection && connection.httpHeaders) || {};
  return tenants.requestHost(headers, { trustProxy: tenants.trustsProxyHost(process.env) });
}

// Signed in, on the panel's domain. Returns who is asking and what they are.
async function onPanel(self) {
  if (!self.userId) denied();
  const all = await stored();
  if (!C.isCloudHost(hostOf(self.connection), all.settings)) denied();
  const user = await userOf(self.userId);
  return { user, all, isCloudAdmin: C.isCloudAdmin(user, all.settings) };
}

async function cloudAdmin(self) {
  const who = await onPanel(self);
  if (!who.isCloudAdmin) denied();
  return who;
}

// A domain this user may read the invoices and chat of: any, for a Cloud
// Admin; for a customer, one that names them.
async function readableDomain(self, domainId) {
  const who = await onPanel(self);
  const domain = await CloudDomains.findOneAsync(domainId);
  if (!domain) invalid(new Error('No such domain'));
  if (!who.isCloudAdmin && !C.customerDomains(who.user, [domain]).length) denied();
  return { ...who, domain };
}

function displayName(user) {
  return (user && ((user.profile && user.profile.fullname) || user.username)) || '';
}

// The domains a table search matches: by domain or customer name.
function domainSearch(search) {
  const term = String(search || '').trim().slice(0, 200);
  return term ? { $or: [{ domain: { $regex: escapeRegExp(term), $options: 'i' } },
    { customerName: { $regex: escapeRegExp(term), $options: 'i' } }] } : {};
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------- Cloudflare

async function cloudflareFetch(cf, path, options = {}) {
  if (!cf.apiToken || !cf.zoneId) invalid(new Error('Set the Cloudflare API token and zone first'));
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cf.zoneId}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${cf.apiToken}`, 'Content-Type': 'application/json' },
    // Only api.cloudflare.com, never somewhere it points to.
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  });
  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }
  if (!res.ok || !body || body.success !== true) {
    const message = body && body.errors && body.errors[0] ? body.errors[0].message : `HTTP ${res.status}`;
    invalid(new Error(`Cloudflare: ${message}`));
  }
  return body.result;
}

async function dnsPlanNow(all) {
  const domains = await CloudDomains.find({}, { fields: { domain: 1, cloudflare: 1 }, limit: MAX_DOMAINS }).fetchAsync();
  const existing = await cloudflareFetch(all.cloudflare, '/dns_records?per_page=5000');
  return validated(() => C.dnsPlan(domains, existing, all));
}

// ---------------------------------------------------------------- databases

async function withSource(domain, fn) {
  if (!domain.database) invalid(new Error('This domain has no database'));
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(C.mongoUrlOf(domain.database), { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 });
  try {
    await client.connect();
    return await fn(client.db());
  } catch (e) {
    if (e instanceof Meteor.Error) throw e;
    return invalid(new Error(`The database: ${(e && e.message) || e}`));
  } finally {
    await client.close().catch(() => {});
  }
}

function ownDb() {
  return MongoInternals.defaultRemoteCollectionDriver().mongo.db;
}

// A host a shared domain's Organization may claim (TenantBleed,
// tests/tenantHostApproval.test.cjs): never this WeKan's own address, and
// never one another Organization has. The SuperAdmin who asks is a site
// administrator, who is the one that assigns hostnames.
async function claimableHost(host, orgId) {
  const instanceHost = tenants.normalizeHost(Meteor.absoluteUrl());
  if (instanceHost && host === instanceHost) invalid(new Error('That is this WeKan\'s own address'));
  const others = await Org.find({ _id: { $ne: orgId || '' }, orgDomains: { $exists: true } }, { fields: { orgDomains: 1 } }).fetchAsync();
  if (others.some(o => tenants.parseHostList(o.orgDomains || '').includes(host))) {
    invalid(new Error('Another Organization has that domain'));
  }
  return host;
}

// The Organization a shared domain is: the one it names, or a new one that
// claims the domain (models/lib/tenants.js picks it by host).
async function ensureOrg(domain) {
  if (domain.orgId && await Org.findOneAsync(domain.orgId)) return domain.orgId;
  await claimableHost(domain.domain, null);
  const name = domain.customerName || domain.domain;
  const orgId = await Org.insertAsync({
    orgDisplayName: name, orgShortName: domain.domain.split('.')[0].slice(0, 50), orgDesc: `Cloud Panel: ${domain.domain}`,
    orgWebsite: `https://${domain.domain}`, orgIsActive: true, orgDomains: domain.domain,
  });
  await CloudDomains.updateAsync(domain._id, { $set: { orgId } });
  return orgId;
}

/**
 * Merge a customer's own WeKan database into this one: their accounts
 * become accounts here (matched by e-mail address), their boards and all
 * that hangs off them are copied, everybody becomes a member of the domain's
 * Organization, and the domain becomes shared. A document whose _id is
 * already here is left alone and counted. `dryRun` counts without writing.
 */
async function importDomain(domain, { dryRun }) {
  return withSource(domain, async source => {
    if (source.databaseName === ownDb().databaseName && domain.database && !domain.database.uri
      && ['127.0.0.1', 'localhost', 'mongodb'].includes(domain.database.host)) {
      invalid(new Error('That is this WeKan\'s own database'));
    }
    const names = (await source.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name);
    if (!names.includes('boards') || !names.includes('users')) invalid(new Error('That database is not a WeKan database: it has no boards and users'));
    const sourceUsers = await source.collection('users').find({}, { projection: { _id: 1, username: 1, emails: 1, profile: 1,
      services: 1, createdAt: 1, loginDisabled: 1 } }).toArray();
    const emails = sourceUsers.flatMap(u => (u.emails || []).map(e => e && e.address).filter(Boolean));
    const unames = sourceUsers.map(u => u.username).filter(Boolean);
    const existing = await Meteor.users.find({ $or: [
      { 'emails.address': { $in: emails.map(e => new RegExp(`^${escapeRegExp(e)}$`, 'i')) } },
      { username: { $in: unames.map(n => String(n).toLowerCase()) } },
    ] }, { fields: { _id: 1, username: 1, emails: 1 } }).fetchAsync();
    const plan = C.accountPlan(sourceUsers, existing);
    const report = { users: { matched: 0, created: 0 }, collections: {}, files: 0 };
    report.users.created = plan.create.length;
    report.users.matched = sourceUsers.length - plan.create.length;
    // A new id for an account whose id is taken here by somebody else.
    for (const c of plan.create) if (!c.keepId) plan.map[c.sourceId] = Random.id();

    const copyable = [...C.IMPORT_COLLECTIONS, ...names.filter(n => /\.(files|chunks)$/.test(n))].filter(n => names.includes(n));
    for (const name of copyable) {
      const stats = { copied: 0, skipped: 0 };
      const cursor = source.collection(name).find({});
      let batch = [];
      const flush = async () => {
        if (!batch.length) return;
        const ids = batch.map(d => d._id);
        const taken = new Set((await ownDb().collection(name).find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray()).map(d => String(d._id)));
        const fresh = batch.filter(d => !taken.has(String(d._id)));
        stats.skipped += batch.length - fresh.length;
        stats.copied += fresh.length;
        if (!dryRun && fresh.length) await ownDb().collection(name).insertMany(fresh, { ordered: false });
        batch = [];
      };
      for await (const doc of cursor) {
        batch.push(/\.chunks$/.test(name) ? doc : C.remapIds(doc, plan.map));
        if (batch.length >= BATCH) await flush();
      }
      await flush();
      report.collections[name] = stats;
      if (name === 'attachments') report.files = stats.copied + stats.skipped;
    }
    report.gridfs = copyable.some(n => /\.(files|chunks)$/.test(n));
    if (dryRun) return report;

    const orgId = await ensureOrg(domain);
    const org = await Org.findOneAsync(orgId);
    const member = { orgId, orgDisplayName: (org && org.orgDisplayName) || domain.domain };
    const byId = new Map(sourceUsers.map(u => [u._id, u]));
    for (const c of plan.create) {
      const u = byId.get(c.sourceId);
      // An imported account is never an administrator here, whatever it was
      // on the customer's own WeKan.
      await Meteor.users.rawCollection().insertOne({
        _id: plan.map[c.sourceId], username: c.username, emails: u.emails || [], profile: C.remapIds(u.profile || {}, plan.map),
        services: u.services && u.services.password ? { password: u.services.password } : {},
        createdAt: u.createdAt || new Date(), isAdmin: false, loginDisabled: u.loginDisabled === true, orgs: [member],
      });
    }
    const matched = [...new Set(Object.entries(plan.map).filter(([src]) => !plan.create.some(c => c.sourceId === src)).map(([, id]) => id))];
    if (matched.length) {
      await Meteor.users.updateAsync({ _id: { $in: matched }, 'orgs.orgId': { $ne: orgId } }, { $push: { orgs: member } }, { multi: true });
    }
    await CloudDomains.updateAsync(domain._id, { $set: { mode: 'shared', importedAt: new Date(), importReport: report } });
    return report;
  });
}

// ---------------------------------------------------------------- methods

Meteor.methods({
  // Admin Panel / Settings / Cloud Panel.
  async cloudPanelGetSettings() {
    if (!(await siteAdmin(this.userId))) denied();
    return (await stored()).settings;
  },

  async cloudPanelSetSettings(value) {
    check(value, Object);
    if (!(await siteAdmin(this.userId))) denied();
    const settings = validated(() => C.normalizeCloudSettings(value));
    const name = settings.superAdminUsername;
    if (name) {
      const user = await Meteor.users.findOneAsync({ $or: [{ username: name }, { 'emails.address': new RegExp(`^${escapeRegExp(name)}$`, 'i') }] },
        { fields: { isAdmin: 1 } });
      if (!user) invalid(new Error(`No user ${name}`));
      if (user.isAdmin !== true) invalid(new Error(`${name} is not an administrator`));
    }
    if (settings.domain && await CloudDomains.findOneAsync({ domain: settings.domain })) {
      invalid(new Error('That domain is a customer domain'));
    }
    await save('settings', settings);
    return settings;
  },

  // What the panel's page should show this user, on this host. Answers
  // without refusing, so the page knows whether to show itself at all.
  async cloudPanelWhoAmI() {
    const all = await stored();
    const onCloudHost = C.isCloudHost(hostOf(this.connection), all.settings);
    if (!onCloudHost || !this.userId) return { onCloudHost, isCloudAdmin: false, domains: [] };
    const user = await userOf(this.userId);
    const isCloudAdmin = C.isCloudAdmin(user, all.settings);
    const domains = isCloudAdmin ? [] : C.customerDomains(user, await CloudDomains.find({},
      { fields: { domain: 1, customerName: 1, customerUsernames: 1, customerEmail: 1, billingEmail: 1 }, limit: MAX_DOMAINS }).fetchAsync());
    return { onCloudHost, isCloudAdmin, domains: domains.map(d => ({ _id: d._id, domain: d.domain, customerName: d.customerName || '' })) };
  },

  async cloudPanelConfig() {
    const { all } = await cloudAdmin(this);
    const { apiToken, ...cloudflare } = all.cloudflare;
    return { settings: all.settings, cloudflare: { ...cloudflare, hasToken: !!apiToken }, caddy: all.caddy };
  },

  // An empty token keeps the stored one: the panel never shows it.
  async cloudPanelSetCloudflare(value) {
    check(value, Object);
    const { all } = await cloudAdmin(this);
    const cf = validated(() => C.normalizeCloudflare(value));
    if (!cf.apiToken) cf.apiToken = all.cloudflare.apiToken || '';
    await save('cloudflare', cf);
    return true;
  },

  async cloudPanelSetCaddy(value) {
    check(value, Object);
    await cloudAdmin(this);
    const caddy = validated(() => C.normalizeCaddy(value));
    await save('caddy', caddy);
    return caddy;
  },

  // The domains table (docs/Features/General/Table.md): the total once when
  // the page opens or the search changes, then one page at a time.
  async cloudPanelDomainsCount(search) {
    check(search, Match.Optional(String));
    await cloudAdmin(this);
    return CloudDomains.find(domainSearch(search)).countAsync();
  },

  async cloudPanelDomainsPage(params) {
    check(params, { search: Match.Optional(String), page: Match.Optional(Match.Integer) });
    await cloudAdmin(this);
    const page = Math.max(1, params.page || 1);
    const rows = await CloudDomains.find(domainSearch(params.search), { sort: { domain: 1 }, skip: (page - 1) * TABLE_PAGE_ROWS_PER_PAGE,
      limit: TABLE_PAGE_ROWS_PER_PAGE }).fetchAsync();
    return rows.map(C.redactDomain);
  },

  async cloudPanelDomain(domainId) {
    check(domainId, String);
    await cloudAdmin(this);
    return C.redactDomain(await CloudDomains.findOneAsync(domainId));
  },

  async cloudPanelSaveDomain(domainId, value) {
    check(domainId, Match.OneOf(null, String));
    check(value, Object);
    const { all } = await cloudAdmin(this);
    const previous = domainId ? await CloudDomains.findOneAsync(domainId) : null;
    if (domainId && !previous) invalid(new Error('No such domain'));
    const doc = validated(() => C.normalizeDomain(value, previous));
    if (doc.domain === all.settings.domain) invalid(new Error('That is the Cloud Panel\'s own domain'));
    const same = await CloudDomains.findOneAsync({ domain: doc.domain });
    if (same && same._id !== domainId) invalid(new Error('That domain is already listed'));
    // Refused before anything is written, not after.
    if (doc.mode === 'shared') await claimableHost(doc.domain, (previous && previous.orgId) || null);
    const fields = { ...doc };
    if (!fields.database) delete fields.database;
    let id = domainId;
    if (id) {
      const modifier = { $set: fields };
      if (!doc.database) modifier.$unset = { database: '' };
      await CloudDomains.updateAsync(id, modifier);
    } else {
      if (await CloudDomains.find({}).countAsync() >= MAX_DOMAINS) invalid(new Error('Too many domains'));
      id = await CloudDomains.insertAsync(fields);
    }
    // A shared domain is an Organization claiming it.
    if (doc.mode === 'shared') {
      const saved = await CloudDomains.findOneAsync(id);
      const orgId = await ensureOrg(saved);
      const org = await Org.findOneAsync(orgId);
      const hosts = tenants.parseHostList((org && org.orgDomains) || '');
      if (!hosts.includes(doc.domain)) {
        await claimableHost(doc.domain, orgId);
        await Org.updateAsync(orgId, { $set: { orgDomains: [...hosts, doc.domain].join(', ') } });
      }
    }
    return id;
  },

  // A domain with invoices is a record of them: void them, do not lose them.
  async cloudPanelRemoveDomain(domainId) {
    check(domainId, String);
    await cloudAdmin(this);
    if (await CloudInvoices.find({ domainId }).countAsync()) invalid(new Error('This domain has invoices'));
    await CloudChatMessages.removeAsync({ domainId });
    await CloudDomains.removeAsync(domainId);
    return true;
  },

  async cloudPanelTestDatabase(domainId) {
    check(domainId, String);
    await cloudAdmin(this);
    const domain = await CloudDomains.findOneAsync(domainId);
    if (!domain) invalid(new Error('No such domain'));
    return withSource(domain, async db => {
      const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name);
      const count = async name => (names.includes(name) ? db.collection(name).estimatedDocumentCount() : 0);
      return { ok: true, collections: names.length, users: await count('users'), boards: await count('boards'), cards: await count('cards') };
    });
  },

  async cloudPanelImportDomain(domainId, options) {
    check(domainId, String);
    check(options, Match.Optional({ dryRun: Match.Optional(Boolean) }));
    await cloudAdmin(this);
    const domain = await CloudDomains.findOneAsync(domainId);
    if (!domain) invalid(new Error('No such domain'));
    if (domain.mode !== 'own') invalid(new Error('This domain already shares this WeKan'));
    return importDomain(domain, { dryRun: !(options && options.dryRun === false) });
  },

  async cloudPanelCaddyfile() {
    const { all } = await cloudAdmin(this);
    const domains = await CloudDomains.find({}, { fields: { domain: 1, mode: 1, upstream: 1, startDate: 1, endDate: 1 }, limit: MAX_DOMAINS }).fetchAsync();
    return C.caddyfile(domains, all, new Date().toISOString().slice(0, 10));
  },

  // Load the Caddyfile into Caddy through its admin API.
  async cloudPanelPushCaddy() {
    const { all } = await cloudAdmin(this);
    if (!all.caddy.adminUrl) invalid(new Error('Set the Caddy admin URL first'));
    const domains = await CloudDomains.find({}, { fields: { domain: 1, mode: 1, upstream: 1, startDate: 1, endDate: 1 }, limit: MAX_DOMAINS }).fetchAsync();
    let res;
    try {
      // The Caddy admin API the SuperAdmin - an administrator - set, like the
      // WebDAV endpoint of Admin Panel / Attachments: no redirects, and what
      // it answers is not passed on.
      res = await fetch(`${all.caddy.adminUrl}/load`, { method: 'POST', headers: { 'Content-Type': 'text/caddyfile' },
        body: C.caddyfile(domains, all, new Date().toISOString().slice(0, 10)), redirect: 'error', signal: AbortSignal.timeout(20000) });
    } catch (e) {
      invalid(new Error('Caddy did not answer at its admin API'));
    }
    if (!res.ok) invalid(new Error(`Caddy refused the routes: HTTP ${res.status}`));
    return true;
  },

  async cloudPanelDnsPlan() {
    const { all } = await cloudAdmin(this);
    return dnsPlanNow(all);
  },

  async cloudPanelDnsApply() {
    const { all } = await cloudAdmin(this);
    const plan = await dnsPlanNow(all);
    for (const record of plan.create) {
      await cloudflareFetch(all.cloudflare, '/dns_records', { method: 'POST', body: JSON.stringify(record) });
    }
    for (const { id, ...record } of plan.update) {
      await cloudflareFetch(all.cloudflare, `/dns_records/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(record) });
    }
    return { created: plan.create.length, updated: plan.update.length, conflicts: plan.conflicts };
  },

  // ------------------------------------------------------------ invoices

  // Every invoice for a Cloud Admin (of one domain, when asked); a
  // customer's own for a customer.
  async cloudPanelInvoices(domainId) {
    check(domainId, Match.Optional(String));
    const who = await onPanel(this);
    let domainIds;
    if (who.isCloudAdmin) domainIds = domainId ? [domainId] : null;
    else {
      const own = C.customerDomains(who.user, await CloudDomains.find({}, { fields: { customerUsernames: 1, customerEmail: 1, billingEmail: 1 },
        limit: MAX_DOMAINS }).fetchAsync())
        .map(d => d._id);
      domainIds = domainId ? own.filter(id => id === domainId) : own;
    }
    const selector = domainIds ? { domainId: { $in: domainIds } } : {};
    const invoices = await CloudInvoices.find(selector, { sort: { issueDate: -1 }, limit: 2000 }).fetchAsync();
    const names = new Map((await CloudDomains.find({ _id: { $in: [...new Set(invoices.map(i => i.domainId))] } }, { fields: { domain: 1 } }).fetchAsync())
      .map(d => [d._id, d.domain]));
    return invoices.map(i => ({ _id: i._id, domainId: i.domainId, domain: names.get(i.domainId) || '', number: i.number, issueDate: i.issueDate,
      dueDate: i.dueDate || null, amountMinor: i.amountMinor, currency: i.currency, status: i.status, paidDate: i.paidDate || null,
      description: i.description || '', link: i.link || '' }));
  },

  async cloudPanelSaveInvoice(domainId, invoiceId, value) {
    check(domainId, String);
    check(invoiceId, Match.OneOf(null, String));
    check(value, Object);
    const { user } = await cloudAdmin(this);
    if (!(await CloudDomains.findOneAsync(domainId))) invalid(new Error('No such domain'));
    const doc = validated(() => C.normalizeCloudInvoice(value));
    const fields = { domainId, ...doc };
    for (const k of Object.keys(fields)) if (fields[k] === null || fields[k] === '') delete fields[k];
    if (invoiceId) {
      const unset = {};
      for (const k of ['dueDate', 'paidDate', 'description', 'link']) if (!(k in fields)) unset[k] = '';
      await CloudInvoices.updateAsync({ _id: invoiceId, domainId }, Object.keys(unset).length ? { $set: fields, $unset: unset } : { $set: fields });
      return invoiceId;
    }
    if (await CloudInvoices.findOneAsync({ domainId, number: doc.number })) invalid(new Error('That invoice number is already recorded'));
    return CloudInvoices.insertAsync({ ...fields, createdBy: user._id });
  },

  async cloudPanelRemoveInvoice(invoiceId) {
    check(invoiceId, String);
    await cloudAdmin(this);
    await CloudInvoices.removeAsync(invoiceId);
    return true;
  },

  // ------------------------------------------------------------ chat

  // The newest messages of a domain's chat, oldest first; `before` pages back.
  async cloudPanelChat(domainId, before) {
    check(domainId, String);
    check(before, Match.Optional(Date));
    await readableDomain(this, domainId);
    const selector = before ? { domainId, at: { $lt: before } } : { domainId };
    const messages = await CloudChatMessages.find(selector, { sort: { at: -1 }, limit: MAX_CHAT_PAGE }).fetchAsync();
    return messages.reverse().map(m => ({ _id: m._id, text: m.text, authorName: m.authorName || '', mine: m.userId === this.userId,
      source: m.source || null, room: m.room || '', at: m.at }));
  },

  async cloudPanelSendChat(domainId, message) {
    check(domainId, String);
    check(message, Object);
    const { user } = await readableDomain(this, domainId);
    const value = validated(() => C.normalizeChatMessage(message));
    return CloudChatMessages.insertAsync({ domainId, userId: user._id, authorName: displayName(user), text: value.text, at: new Date() });
  },

  // Earlier conversations: a Rocket.Chat export .zip, or a SandChat grain
  // backup .zip, read by the same readers the board import uses.
  async cloudPanelImportChat(domainId, source, file) {
    check(domainId, String);
    check(source, Match.OneOf('rocketchat', 'sandchat'));
    check(file, { zipBase64: String });
    await cloudAdmin(this);
    if (!(await CloudDomains.findOneAsync(domainId))) invalid(new Error('No such domain'));
    let board;
    try {
      if (source === 'rocketchat') {
        const { readRocketChatExport } = require('/server/lib/chatArchives');
        const { parseRocketChatExport } = require('/models/lib/chatExportFormats');
        board = parseRocketChatExport(await readRocketChatExport(file));
      } else {
        const { readSandstormGrain } = require('/server/lib/sandstormGrain');
        board = await readSandstormGrain(file, 'sandstormsandchat');
      }
    } catch (e) {
      invalid(e);
    }
    const messages = C.importedChatMessages(board, source).slice(0, MAX_IMPORTED_MESSAGES);
    for (let i = 0; i < messages.length; i += BATCH) {
      const docs = messages.slice(i, i + BATCH).map(m => ({ _id: Random.id(), domainId, authorName: m.authorName, text: m.text, source,
        room: m.room, at: m.at || new Date(), createdAt: new Date() }));
      await CloudChatMessages.rawCollection().insertMany(docs, { ordered: false });
    }
    return { imported: messages.length };
  },
});

for (const name of ['cloudPanelImportDomain', 'cloudPanelTestDatabase', 'cloudPanelImportChat', 'cloudPanelDnsApply', 'cloudPanelPushCaddy']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId() { return true; } }, 10, 60000);
}
DDPRateLimiter.addRule({ type: 'method', name: 'cloudPanelSendChat', connectionId() { return true; } }, 60, 60000);

Meteor.startup(async () => {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  await ensureIndex(CloudDomains, { domain: 1 }, { unique: true });
  await ensureIndex(CloudDomains, { customerUsernames: 1 });
  await ensureIndex(CloudInvoices, { domainId: 1, issueDate: -1 });
  await ensureIndex(CloudChatMessages, { domainId: 1, at: -1 });
});
