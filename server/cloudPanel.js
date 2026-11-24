// Cloud Panel (docs/Features/Admin-Panel/Cloud-Panel.md, models/lib/cloudPanel.js).
//
// There is a Cloud Panel only where the server's environment says so:
// CLOUD=cloud.example.com. It is typically a WeKan container of its own,
// whose purpose is to keep the database passwords of the customers' WeKan
// containers and manage those containers. Without CLOUD every cloudPanel*
// method is refused, and the attempt is recorded in Admin Panel / Problems:
// an ordinary WeKan - whose site administrator may be a customer - must never
// be made to connect to a MongoDB server somebody names (CloudPanelBleed,
// 2026-11-22). The domain is never read from the database or the browser.
//
// Who may do what, at the CLOUD address only:
//   Admin Panel / Cloud (domains, invoices, chat, tickets, Cloudflare, Caddy,
//   allowed addresses)     the Cloud Admins: the site administrators of this
//                          container, from an allowed address when the list
//                          of allowed addresses is set
//   a customer's invoices, tickets, chat and domain
//                          the customers a domain lists; a customer of a
//                          domain with its own database signs in with the
//                          password of their own WeKan, checked against that
//                          database (the customer login below)
//
// Database passwords and the Cloudflare token are written here and never sent
// back. Nothing is published.
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Random } from 'meteor/random';
import { MongoInternals } from 'meteor/mongo';
import Org from '/models/org';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import { CloudSettings, CloudDomains, CloudInvoices, CloudChatMessages } from '/models/cloudPanel';
import * as tenants from '/models/lib/tenants';
import { TABLE_PAGE_ROWS_PER_PAGE } from '/models/lib/tablePage';
const C = require('/models/lib/cloudPanel');
const A = require('/models/lib/cloudAddresses');

const SETTINGS_ID = 'cloud';
const MAX_DOMAINS = 10000;
const MAX_CHAT_PAGE = 200;
const MAX_TICKETS = 500;
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

// A refusal, in Admin Panel / Problems (models/lib/securityCategories.js).
function recordRefusal(key, source, detail) {
  try {
    require('/server/lib/securityLog').record({ key, action: 'blocked', source, detail });
  } catch (e) { /* logging must never break the guard */ }
}

// ---------------------------------------------------------------- the gate

// The panel's own domain, from the environment, read on every call: there is
// no other place it can come from.
function cloudDomainNow() {
  return C.cloudDomainFromEnv({ CLOUD: process.env.CLOUD });
}

/**
 * No CLOUD, no Cloud Panel. Every method except cloudPanelWhoAmI - which the
 * pages ask to know whether to show themselves - starts here, and so does
 * every connection to a customer's database. Nothing in an ordinary WeKan
 * calls these, so a call is an attempt and is recorded.
 */
function requireCloud(source) {
  const cloudDomain = cloudDomainNow();
  if (!cloudDomain) {
    recordRefusal('authz.cloud-panel-off', source, 'A Cloud Panel method was called on a WeKan without the CLOUD environment variable');
    denied();
  }
  return cloudDomain;
}

async function stored() {
  const doc = await CloudSettings.findOneAsync(SETTINGS_ID);
  return {
    cloudflare: (doc && doc.cloudflare) || { apiToken: '', zoneId: '', target: '', proxied: true },
    caddy: (doc && doc.caddy) || { adminUrl: '', sharedUpstream: '', email: '' },
    allowedAddresses: (doc && Array.isArray(doc.allowedAddresses)) ? doc.allowedAddresses : [],
  };
}

async function save(field, value) {
  await CloudSettings.upsertAsync(SETTINGS_ID, { $set: { [field]: value } });
}

const USER_FIELDS = { username: 1, isAdmin: 1, loginDisabled: 1, emails: 1, 'profile.fullname': 1, 'services.cloudCustomer': 1 };

async function userOf(userId) {
  if (!userId) return null;
  return Meteor.users.findOneAsync(userId, { fields: USER_FIELDS });
}

// The host this method was called on.
function hostOf(connection) {
  const headers = (connection && connection.httpHeaders) || {};
  return tenants.requestHost(headers, { trustProxy: tenants.trustsProxyHost(process.env) });
}

// Where the caller is, the way every other login guard of WeKan resolves it:
// X-Forwarded-For only as far as HTTP_FORWARDED_COUNT trusts it.
function addressOf(connection) {
  const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');
  return resolveClientKey({
    headers: (connection && connection.httpHeaders) || {},
    socketAddress: connection && connection.clientAddress,
    forwardedCount: process.env.HTTP_FORWARDED_COUNT,
  });
}

// CLOUD_ADMIN_ANY_ADDRESS=true is the way back in for an operator whose
// list no longer has their address: it sets the list aside until it is
// removed again (docs/Features/Admin-Panel/Cloud-Panel.md).
function addressListOf(all) {
  return process.env.CLOUD_ADMIN_ANY_ADDRESS === 'true' ? [] : all.allowedAddresses;
}

// Signed in, on the panel's domain. Returns who is asking and what they are.
async function onPanel(self, source) {
  const cloudDomain = requireCloud(source);
  if (!self.userId) denied();
  if (!C.isCloudHost(hostOf(self.connection), cloudDomain)) denied();
  const all = await stored();
  const user = await userOf(self.userId);
  const admin = C.isCloudAdmin(user, cloudDomain);
  const fromAllowed = A.addressAllowed(addressOf(self.connection), addressListOf(all));
  return { user, all, cloudDomain, isCloudAdmin: admin && fromAllowed };
}

async function cloudAdmin(self, source) {
  const who = await onPanel(self, source);
  if (!who.isCloudAdmin) {
    // No page offers a customer, or a Cloud Admin away from the allowed
    // addresses, anything that comes here.
    recordRefusal('authz.cloud-panel-access', source, 'A Cloud Admin method was called by somebody who is not a Cloud Admin here');
    denied();
  }
  return who;
}

// A domain this user may read the invoices, tickets and chat of: any, for a
// Cloud Admin; for a customer, their own.
async function readableDomain(self, domainId, source) {
  const who = await onPanel(self, source);
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
  return validated(() => C.dnsPlan(domains, existing, { cloudDomain: cloudDomainNow(), cloudflare: all.cloudflare }));
}

// ---------------------------------------------------------------- databases

/**
 * A connection to a customer's own database, for as long as `fn` runs. The
 * one place in WeKan that builds a MongoClient from data that is not the
 * server's own environment - and it is behind the CLOUD gate HERE, not only
 * in its callers, so no caller added later can reach it from an ordinary
 * WeKan (tests/cloudPanelGate.test.cjs).
 */
async function withSource(domain, fn) {
  requireCloud('cloud:database');
  if (!domain || !domain.database) invalid(new Error('This domain has no database'));
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
// never one another Organization has. The Cloud Admin who asks is a site
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

// ---------------------------------------------------------------- support boards

// The Cloud Admins: this container's site administrators, never a customer.
async function cloudAdminIds() {
  const admins = await Meteor.users.find({ isAdmin: true, loginDisabled: { $ne: true } },
    { fields: { _id: 1, isAdmin: 1, loginDisabled: 1, 'services.cloudCustomer': 1 } }).fetchAsync();
  return admins.filter(u => C.isCloudAdmin(u, cloudDomainNow())).map(u => u._id);
}

// The customers who signed in to this domain and whom it still lists.
async function customerUsersOf(domain) {
  return Meteor.users.find({ 'services.cloudCustomer.domainId': domain._id },
    { fields: { _id: 1, loginDisabled: 1, 'services.cloudCustomer': 1 } }).fetchAsync();
}

/**
 * The domain's support board (models/lib/cloudPanel.js SUPPORT_LISTS): made
 * the first time it is needed - when a Cloud Admin saves the domain, or its
 * customer first signs in - and its members kept as supportMembers says: the
 * Cloud Admins its board admins, the listed customers Comment only, and a
 * customer the domain no longer lists no longer a member. Returns the
 * domain's `support` { boardId, swimlaneId, lists, chatCardId }.
 */
async function ensureSupportBoard(domain) {
  requireCloud('cloud:support-board');
  const adminIds = await cloudAdminIds();
  const customers = await customerUsersOf(domain);
  const listed = customers.filter(u => u.loginDisabled !== true && C.customerDomains(u, [domain]).length).map(u => u._id);
  const unlisted = new Set(customers.map(u => u._id).filter(id => !listed.includes(id)));
  const desired = C.supportMembers(adminIds, listed);
  let support = domain.support || null;
  let board = support && support.boardId ? await Boards.findOneAsync(support.boardId) : null;
  if (!board) {
    const boardId = await Boards.insertAsync({ title: C.supportBoardTitle(domain.domain), permission: 'private', color: 'belize',
      members: desired, migrationVersion: 1 });
    const swimlaneId = await Swimlanes.insertAsync({ title: 'Default', boardId, sort: 0 });
    const lists = {};
    for (let i = 0; i < C.SUPPORT_LISTS.length; i += 1) {
      const list = C.SUPPORT_LISTS[i];
      // eslint-disable-next-line no-await-in-loop
      lists[list.key] = await Lists.insertAsync({ title: list.title, boardId, swimlaneId, sort: i, archived: false, createdAt: new Date() });
    }
    const chatCardId = await Cards.insertAsync({ title: `Chat: ${domain.domain}`, boardId, listId: lists.chat, swimlaneId,
      userId: (desired[0] && desired[0].userId) || '', sort: 0, archived: false });
    support = { boardId, swimlaneId, lists, chatCardId };
    await CloudDomains.updateAsync(domain._id, { $set: { support } });
    await migrateChat(domain, support, adminIds[0] || '');
    return support;
  }
  // Members: add who is missing, reactivate who came back, and let go of a
  // customer the domain no longer lists. Anybody else a board admin added
  // stays as they are.
  const members = (board.members || []).map(m => ({ ...m }));
  let changed = false;
  for (const want of desired) {
    const at = members.findIndex(m => m.userId === want.userId);
    if (at === -1) { members.push(want); changed = true; continue; }
    const have = members[at];
    if (have.isActive !== true || have.isAdmin !== want.isAdmin || (!want.isAdmin && have.isCommentOnly !== true)) {
      members[at] = { ...have, ...want };
      changed = true;
    }
  }
  for (const m of members) {
    if (unlisted.has(m.userId) && m.isActive !== false) { m.isActive = false; changed = true; }
  }
  if (changed) await Boards.updateAsync(board._id, { $set: { members } });
  return support;
}

// The chat of the earlier panel, CloudChatMessages, moved once into the
// support board's chat card - kept, and marked, so it is moved only once.
async function migrateChat(domain, support, fallbackUserId) {
  const legacy = await CloudChatMessages.find({ domainId: domain._id, migratedAt: { $exists: false } }, { sort: { at: 1 } }).fetchAsync();
  if (!legacy.length) return 0;
  for (let i = 0; i < legacy.length; i += BATCH) {
    const docs = legacy.slice(i, i + BATCH).map(m => chatComment(support, {
      userId: m.userId || fallbackUserId, text: m.text, at: m.at,
      imported: m.userId ? null : { authorName: m.authorName || '', room: m.room || '', source: m.source || null },
    }));
    // eslint-disable-next-line no-await-in-loop
    await CardComments.rawCollection().insertMany(docs, { ordered: false });
  }
  await CloudChatMessages.updateAsync({ domainId: domain._id, migratedAt: { $exists: false } }, { $set: { migratedAt: new Date() } }, { multi: true });
  return legacy.length;
}

// A comment of the chat card, as a raw document: imported and migrated
// messages keep the time they were written, which an insert through the
// schema would replace with now. An imported message names its author in
// its text too, so Board View / Chat shows who wrote it.
function chatComment(support, { userId, text, at, imported }) {
  const given = at ? new Date(at) : null;
  const when = given && Number.isFinite(given.getTime()) ? given : new Date();
  const body = imported && imported.authorName ? `${imported.authorName}: ${text}` : text;
  const doc = { _id: Random.id(), boardId: support.boardId, cardId: support.chatCardId, userId: userId || '', text: String(body).slice(0, 20000),
    parentId: '', createdAt: when, modifiedAt: when };
  if (imported) doc.cloudImport = imported;
  return doc;
}

function ticketState(support, listId) {
  return C.TICKET_STATES.find(key => support.lists && support.lists[key] === listId) || null;
}

async function namesOf(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const users = await Meteor.users.find({ _id: { $in: ids } }, { fields: { username: 1, 'profile.fullname': 1 } }).fetchAsync();
  return new Map(users.map(u => [u._id, displayName(u)]));
}

// ---------------------------------------------------------------- methods

// Admin Panel / People / Cloud used to set the panel's domain and SuperAdmin
// from the browser. The domain is the CLOUD environment variable now and
// the Cloud Admins are the site administrators, so there is nothing to set:
// both are refused, and recorded, whoever asks.
function settingsRefused(source) {
  const cloudDomain = requireCloud(source);
  recordRefusal('authz.cloud-panel-access', source, `The Cloud Panel's domain is the CLOUD environment variable (${cloudDomain}), not a setting`);
  throw new Meteor.Error('not-authorized', 'The Cloud Panel\'s domain is the CLOUD environment variable of the server');
}

const METHODS = {
  async cloudPanelGetSettings() {
    return settingsRefused('method:cloudPanelGetSettings');
  },

  async cloudPanelSetSettings(value) {
    check(value, Match.Any);
    return settingsRefused('method:cloudPanelSetSettings');
  },

  // What the pages should show this user, on this host: nothing at all on a
  // WeKan without CLOUD. Answers without refusing, so the page knows whether
  // to show itself, and so the router and the Admin Panel tabs can ask on
  // every WeKan without filling Problems.
  async cloudPanelWhoAmI() {
    const cloudDomain = cloudDomainNow();
    const nobody = { enabled: !!cloudDomain, onCloudHost: false, isCloudAdmin: false, isCustomer: false, addressRefused: false, domains: [] };
    if (!cloudDomain) return nobody;
    const onCloudHost = C.isCloudHost(hostOf(this.connection), cloudDomain);
    if (!onCloudHost || !this.userId) return { ...nobody, onCloudHost };
    const user = await userOf(this.userId);
    const admin = C.isCloudAdmin(user, cloudDomain);
    const fromAllowed = A.addressAllowed(addressOf(this.connection), addressListOf(await stored()));
    const isCloudAdmin = admin && fromAllowed;
    const domains = isCloudAdmin ? [] : C.customerDomains(user, await CloudDomains.find({},
      { fields: { domain: 1, customerName: 1, customerUsernames: 1, customerEmail: 1, billingEmail: 1, startDate: 1, endDate: 1, mode: 1 },
        limit: MAX_DOMAINS }).fetchAsync());
    return { ...nobody, onCloudHost, isCloudAdmin, isCustomer: C.isCloudCustomer(user), addressRefused: admin && !fromAllowed,
      domains: domains.map(d => ({ _id: d._id, domain: d.domain, customerName: d.customerName || '', startDate: d.startDate || null,
        endDate: d.endDate || null, mode: d.mode })) };
  },

  async cloudPanelConfig() {
    const { all } = await cloudAdmin(this, 'method:cloudPanelConfig');
    const { apiToken, ...cloudflare } = all.cloudflare;
    return { cloudDomain: cloudDomainNow(), cloudflare: { ...cloudflare, hasToken: !!apiToken }, caddy: all.caddy,
      allowedAddresses: all.allowedAddresses, yourAddress: addressOf(this.connection),
      anyAddress: process.env.CLOUD_ADMIN_ANY_ADDRESS === 'true' };
  },

  // Admin Panel / Cloud / Allowed addresses. Refused when the caller's own
  // address is not in the new list: saving it would lock them out at once,
  // with nobody told why.
  async cloudPanelSetAllowedAddresses(value) {
    check(value, Match.OneOf(String, [String]));
    await cloudAdmin(this, 'method:cloudPanelSetAllowedAddresses');
    const list = validated(() => A.normalizeAllowedAddresses(value));
    const yours = addressOf(this.connection);
    if (list.length && !A.addressAllowed(yours, list)) {
      invalid(new Error(`Your address ${yours} is not in the list: saving it would lock you out`));
    }
    await save('allowedAddresses', list);
    return list;
  },

  // An empty token keeps the stored one: the panel never shows it.
  async cloudPanelSetCloudflare(value) {
    check(value, Object);
    const { all } = await cloudAdmin(this, 'method:cloudPanelSetCloudflare');
    const cf = validated(() => C.normalizeCloudflare(value));
    if (!cf.apiToken) cf.apiToken = all.cloudflare.apiToken || '';
    await save('cloudflare', cf);
    return true;
  },

  async cloudPanelSetCaddy(value) {
    check(value, Object);
    await cloudAdmin(this, 'method:cloudPanelSetCaddy');
    const caddy = validated(() => C.normalizeCaddy(value));
    await save('caddy', caddy);
    return caddy;
  },

  // The domains table (docs/Features/Table.md): the total once when
  // the page opens or the search changes, then one page at a time.
  async cloudPanelDomainsCount(search) {
    check(search, Match.Optional(String));
    await cloudAdmin(this, 'method:cloudPanelDomainsCount');
    return CloudDomains.find(domainSearch(search)).countAsync();
  },

  async cloudPanelDomainsPage(params) {
    check(params, { search: Match.Optional(String), page: Match.Optional(Match.Integer) });
    await cloudAdmin(this, 'method:cloudPanelDomainsPage');
    const page = Math.max(1, params.page || 1);
    const rows = await CloudDomains.find(domainSearch(params.search), { sort: { domain: 1 }, skip: (page - 1) * TABLE_PAGE_ROWS_PER_PAGE,
      limit: TABLE_PAGE_ROWS_PER_PAGE }).fetchAsync();
    return rows.map(C.redactDomain);
  },

  async cloudPanelDomain(domainId) {
    check(domainId, String);
    await cloudAdmin(this, 'method:cloudPanelDomain');
    return C.redactDomain(await CloudDomains.findOneAsync(domainId));
  },

  async cloudPanelSaveDomain(domainId, value) {
    check(domainId, Match.OneOf(null, String));
    check(value, Object);
    const { cloudDomain } = await cloudAdmin(this, 'method:cloudPanelSaveDomain');
    const previous = domainId ? await CloudDomains.findOneAsync(domainId) : null;
    if (domainId && !previous) invalid(new Error('No such domain'));
    const doc = validated(() => C.normalizeDomain(value, previous));
    if (doc.domain === cloudDomain) invalid(new Error('That is the Cloud Panel\'s own domain'));
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
    // Its support board, made now, and its customers kept up to date.
    await ensureSupportBoard(await CloudDomains.findOneAsync(id));
    return id;
  },

  // A domain with invoices is a record of them: void them, do not lose them.
  // Its support board is archived, not deleted, for the same reason.
  async cloudPanelRemoveDomain(domainId) {
    check(domainId, String);
    await cloudAdmin(this, 'method:cloudPanelRemoveDomain');
    if (await CloudInvoices.find({ domainId }).countAsync()) invalid(new Error('This domain has invoices'));
    const domain = await CloudDomains.findOneAsync(domainId);
    if (domain && domain.support && domain.support.boardId) {
      await Boards.updateAsync(domain.support.boardId, { $set: { archived: true, archivedAt: new Date() } });
    }
    await CloudChatMessages.removeAsync({ domainId });
    await CloudDomains.removeAsync(domainId);
    return true;
  },

  async cloudPanelTestDatabase(domainId) {
    check(domainId, String);
    await cloudAdmin(this, 'method:cloudPanelTestDatabase');
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
    await cloudAdmin(this, 'method:cloudPanelImportDomain');
    const domain = await CloudDomains.findOneAsync(domainId);
    if (!domain) invalid(new Error('No such domain'));
    if (domain.mode !== 'own') invalid(new Error('This domain already shares this WeKan'));
    return importDomain(domain, { dryRun: !(options && options.dryRun === false) });
  },

  async cloudPanelCaddyfile() {
    const { all, cloudDomain } = await cloudAdmin(this, 'method:cloudPanelCaddyfile');
    const domains = await CloudDomains.find({}, { fields: { domain: 1, mode: 1, upstream: 1, startDate: 1, endDate: 1 }, limit: MAX_DOMAINS }).fetchAsync();
    return C.caddyfile(domains, { cloudDomain, caddy: all.caddy }, new Date().toISOString().slice(0, 10));
  },

  // Load the Caddyfile into Caddy through its admin API.
  async cloudPanelPushCaddy() {
    const { all, cloudDomain } = await cloudAdmin(this, 'method:cloudPanelPushCaddy');
    if (!all.caddy.adminUrl) invalid(new Error('Set the Caddy admin URL first'));
    const domains = await CloudDomains.find({}, { fields: { domain: 1, mode: 1, upstream: 1, startDate: 1, endDate: 1 }, limit: MAX_DOMAINS }).fetchAsync();
    let res;
    try {
      // The Caddy admin API the Cloud Admin set, like the WebDAV endpoint of
      // Admin Panel / Attachments: no redirects, and what it answers is not
      // passed on.
      res = await fetch(`${all.caddy.adminUrl}/load`, { method: 'POST', headers: { 'Content-Type': 'text/caddyfile' },
        body: C.caddyfile(domains, { cloudDomain, caddy: all.caddy }, new Date().toISOString().slice(0, 10)), redirect: 'error',
        signal: AbortSignal.timeout(20000) });
    } catch (e) {
      invalid(new Error('Caddy did not answer at its admin API'));
    }
    if (!res.ok) invalid(new Error(`Caddy refused the routes: HTTP ${res.status}`));
    return true;
  },

  async cloudPanelDnsPlan() {
    const { all } = await cloudAdmin(this, 'method:cloudPanelDnsPlan');
    return dnsPlanNow(all);
  },

  async cloudPanelDnsApply() {
    const { all } = await cloudAdmin(this, 'method:cloudPanelDnsApply');
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
    const who = await onPanel(this, 'method:cloudPanelInvoices');
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
    const { user } = await cloudAdmin(this, 'method:cloudPanelSaveInvoice');
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
    await cloudAdmin(this, 'method:cloudPanelRemoveInvoice');
    await CloudInvoices.removeAsync(invoiceId);
    return true;
  },

  // ------------------------------------------------------------ tickets

  // A domain's support tickets: the cards of its support board's Open, In
  // progress and Done lists, the way Board View / Lists shows them.
  async cloudPanelTickets(domainId) {
    check(domainId, String);
    const { domain } = await readableDomain(this, domainId, 'method:cloudPanelTickets');
    const support = await ensureSupportBoard(domain);
    const listIds = C.TICKET_STATES.map(key => support.lists[key]).filter(Boolean);
    const cards = await Cards.find({ boardId: support.boardId, listId: { $in: listIds }, archived: { $ne: true } },
      { sort: { sort: 1 }, limit: MAX_TICKETS, fields: { title: 1, description: 1, listId: 1, userId: 1, createdAt: 1, sort: 1 } }).fetchAsync();
    const names = await namesOf(cards.map(c => c.userId));
    const board = await Boards.findOneAsync(support.boardId, { fields: { slug: 1 } });
    return {
      boardId: support.boardId,
      boardSlug: (board && board.slug) || 'board',
      columns: C.TICKET_STATES.map(key => ({
        key,
        cards: cards.filter(c => ticketState(support, c.listId) === key).map(c => ({ _id: c._id, title: c.title || '',
          description: c.description || '', author: names.get(c.userId) || '', createdAt: c.createdAt || null })),
      })),
    };
  },

  // A new ticket, into Open - the one write a customer makes on the board.
  async cloudPanelAddTicket(domainId, value) {
    check(domainId, String);
    check(value, Object);
    const { user, domain } = await readableDomain(this, domainId, 'method:cloudPanelAddTicket');
    const ticket = validated(() => C.normalizeTicket(value));
    const support = await ensureSupportBoard(domain);
    const sort = await Cards.find({ boardId: support.boardId, listId: support.lists.open }).countAsync();
    return Cards.insertAsync({ title: ticket.title, description: ticket.description, boardId: support.boardId, listId: support.lists.open,
      swimlaneId: support.swimlaneId, userId: user._id, sort, archived: false });
  },

  // Open, In progress, Done: a Cloud Admin's to move.
  async cloudPanelMoveTicket(domainId, cardId, state) {
    check(domainId, String);
    check(cardId, String);
    check(state, Match.OneOf(...C.TICKET_STATES));
    await cloudAdmin(this, 'method:cloudPanelMoveTicket');
    const domain = await CloudDomains.findOneAsync(domainId);
    if (!domain) invalid(new Error('No such domain'));
    const support = await ensureSupportBoard(domain);
    const card = await Cards.findOneAsync({ _id: cardId, boardId: support.boardId });
    if (!card || !ticketState(support, card.listId)) invalid(new Error('No such ticket'));
    await Cards.updateAsync(card._id, { $set: { listId: support.lists[state] } });
    return true;
  },

  // ------------------------------------------------------------ chat

  // The newest messages of a domain's support chat - the comments of its
  // support board's chat card - oldest first; `before` pages back.
  async cloudPanelChat(domainId, before) {
    check(domainId, String);
    check(before, Match.Optional(Date));
    const { domain } = await readableDomain(this, domainId, 'method:cloudPanelChat');
    const support = await ensureSupportBoard(domain);
    const selector = { boardId: support.boardId, cardId: support.chatCardId };
    if (before) selector.createdAt = { $lt: before };
    const comments = await CardComments.find(selector, { sort: { createdAt: -1 }, limit: MAX_CHAT_PAGE }).fetchAsync();
    const names = await namesOf(comments.map(c => c.userId));
    return comments.reverse().map(c => {
      const imported = c.cloudImport || null;
      const prefix = imported && imported.authorName ? `${imported.authorName}: ` : '';
      return { _id: c._id, text: prefix && String(c.text).startsWith(prefix) ? String(c.text).slice(prefix.length) : c.text,
        authorName: (imported && imported.authorName) || names.get(c.userId) || '', mine: !imported && c.userId === this.userId,
        source: (imported && imported.source) || null, room: (imported && imported.room) || '', at: c.createdAt };
    });
  },

  async cloudPanelSendChat(domainId, message) {
    check(domainId, String);
    check(message, Object);
    const { user, domain } = await readableDomain(this, domainId, 'method:cloudPanelSendChat');
    const value = validated(() => C.normalizeChatMessage(message));
    const support = await ensureSupportBoard(domain);
    return CardComments.insertAsync({ text: value.text, boardId: support.boardId, cardId: support.chatCardId, userId: user._id });
  },

  // Earlier conversations: a Rocket.Chat export .zip, or a SandChat grain
  // backup .zip, read by the same readers the board import uses, into the
  // support chat.
  async cloudPanelImportChat(domainId, source, file) {
    check(domainId, String);
    check(source, Match.OneOf('rocketchat', 'sandchat'));
    check(file, { zipBase64: String });
    const { user } = await cloudAdmin(this, 'method:cloudPanelImportChat');
    const domain = await CloudDomains.findOneAsync(domainId);
    if (!domain) invalid(new Error('No such domain'));
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
    const support = await ensureSupportBoard(domain);
    const messages = C.importedChatMessages(board, source).slice(0, MAX_IMPORTED_MESSAGES);
    for (let i = 0; i < messages.length; i += BATCH) {
      const docs = messages.slice(i, i + BATCH).map(m => chatComment(support, { userId: user._id, text: m.text, at: m.at,
        imported: { authorName: m.authorName, room: m.room, source } }));
      // eslint-disable-next-line no-await-in-loop
      await CardComments.rawCollection().insertMany(docs, { ordered: false });
    }
    return { imported: messages.length };
  },
};

// The gate before anything else a method does - before its argument checks,
// too - so that on a WeKan without CLOUD every call is refused and recorded
// the same way, whatever it was sent.
for (const name of Object.keys(METHODS)) {
  if (name === 'cloudPanelWhoAmI') continue;
  const method = METHODS[name];
  METHODS[name] = async function cloudGated(...args) {
    requireCloud(`method:${name}`);
    return method.apply(this, args);
  };
}
Meteor.methods(METHODS);

for (const name of ['cloudPanelImportDomain', 'cloudPanelTestDatabase', 'cloudPanelImportChat', 'cloudPanelDnsApply', 'cloudPanelPushCaddy']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId() { return true; } }, 10, 60000);
}
DDPRateLimiter.addRule({ type: 'method', name: 'cloudPanelSendChat', connectionId() { return true; } }, 60, 60000);
DDPRateLimiter.addRule({ type: 'method', name: 'cloudPanelAddTicket', connectionId() { return true; } }, 30, 60000);

// ---------------------------------------------------------------- customer login

// A login that failed, the way accounts-password says it: the same words for
// a stranger, a wrong password and a disabled account.
function loginRefused() {
  return Accounts._handleError('Incorrect password');
}

// The account a customer has in their own WeKan, by the name they typed:
// at most two looked at, so two matches are refused rather than guessed.
async function foreignUsers(domain, name, byEmail) {
  return withSource(domain, async db => {
    const exact = new RegExp(`^${escapeRegExp(name)}$`, 'i');
    return db.collection('users').find(byEmail ? { 'emails.address': exact } : { username: exact },
      { projection: { _id: 1, username: 1, emails: 1, loginDisabled: 1, 'profile.fullname': 1, 'services.password': 1,
        'services.twoFactorAuthentication': 1 }, limit: 2 }).toArray();
  });
}

/**
 * The account here of a customer who signed in with their own WeKan's
 * password: found by the domain and their account there, made the first
 * time. It has no password of its own - every login asks the customer's
 * database again - and is never an administrator.
 */
async function shadowUser(domain, foreign) {
  const emails = (foreign.emails || []).map(e => e && e.address).filter(Boolean).map(a => String(a).toLowerCase());
  const cloudCustomer = { domainId: domain._id, foreignUserId: String(foreign._id), username: String(foreign.username || '').toLowerCase(),
    emails, verifiedAt: new Date() };
  const existing = await Meteor.users.findOneAsync({ 'services.cloudCustomer.domainId': domain._id,
    'services.cloudCustomer.foreignUserId': cloudCustomer.foreignUserId }, { fields: { _id: 1 } });
  const fullname = (foreign.profile && foreign.profile.fullname) || foreign.username || '';
  if (existing) {
    // A customer account made with the older username-domain form takes the
    // username_customerdomain name they sign in with, when it is free.
    const wanted = C.shadowUsername(foreign.username || emails[0], domain.domain);
    const set = { 'services.cloudCustomer': cloudCustomer, isAdmin: false };
    if (!(await Meteor.users.findOneAsync({ username: wanted, _id: { $ne: existing._id } }, { fields: { _id: 1 } }))) set.username = wanted;
    await Meteor.users.updateAsync(existing._id, { $set: set });
    return existing._id;
  }
  let username = C.shadowUsername(foreign.username || emails[0], domain.domain);
  if (await Meteor.users.findOneAsync({ username }, { fields: { _id: 1 } })) username = `${username}-${Random.id(4).toLowerCase()}`;
  const _id = Random.id();
  // Straight into the collection, as an import makes accounts: not through
  // Accounts.createUser, whose first-account rule would make the panel's
  // first visitor its administrator, and whose registration checks are for
  // people signing up, which a customer here is not.
  await Meteor.users.rawCollection().insertOne({
    _id, username, emails: [], createdAt: new Date(), isAdmin: false, loginDisabled: false, authenticationMethod: 'password',
    profile: { fullname, initials: fullname.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 3).toUpperCase() },
    services: { cloudCustomer },
  });
  return _id;
}

/**
 * The customer login: a password login at the CLOUD address, for a name a
 * domain with its own database lists, checked against that customer's own
 * WeKan database - the same bcrypt / Argon2 accounts-password uses there.
 * Returns undefined (not ours: the ordinary password login decides) or a
 * login result.
 */
async function customerLogin(invocation, options) {
  if (!options || !options.password || !options.user) return undefined;
  const cloudDomain = cloudDomainNow();
  if (!cloudDomain || !C.isCloudHost(hostOf(invocation && invocation.connection), cloudDomain)) return undefined;
  const { name } = C.loginName(options.user);
  if (!name) return undefined;
  let localUser = null;
  try {
    localUser = await Accounts._findUserByQuery(options.user, { fields: { _id: 1, services: 1 } });
  } catch (e) {
    return undefined;
  }
  // username_customerdomain names its domain (C.qualifiedLoginName); a bare
  // name is looked up as itself.
  const qualified = C.qualifiedLoginName(name);
  const domains = await CloudDomains.find({ $or: [{ customerUsernames: name }, { customerEmail: name },
    ...(qualified ? [{ domain: qualified.domain, customerUsernames: qualified.name }] : [])] },
    { fields: { domain: 1, mode: 1, database: 1, customerUsernames: 1, customerEmail: 1, support: 1 }, limit: 10 }).fetchAsync();
  const plan = C.customerLoginPlan({ cloudDomain, host: hostOf(invocation.connection), userQuery: options.user, localUser, domains });
  if (!plan.handle) return undefined;
  if (plan.refuse) return loginRefused();
  let found;
  try {
    found = await foreignUsers(plan.domain, plan.name, plan.byEmail);
  } catch (e) {
    console.warn(`Cloud Panel: the database of ${plan.domain.domain} did not answer a customer login: ${(e && (e.reason || e.message)) || e}`);
    return loginRefused();
  }
  const decision = C.foreignAccountDecision(found);
  if (!decision.ok) return loginRefused();
  const foreign = decision.user;
  // Accounts._checkPasswordAsync, with the customer's hash and an id that
  // no account here has: when the hash's cost is not this server's, it
  // re-hashes the password into the account of that id, and no account here
  // is the customer's account there.
  const checked = await Accounts._checkPasswordAsync({ _id: `cloud-customer-check:${Random.id()}`,
    services: { password: foreign.services.password } }, options.password);
  const known = await Meteor.users.findOneAsync({ 'services.cloudCustomer.domainId': plan.domain._id,
    'services.cloudCustomer.foreignUserId': String(foreign._id) }, { fields: { _id: 1 } });
  if (checked.error) {
    if (known) return { userId: known._id, error: checked.error };
    return loginRefused();
  }
  const twoFactor = foreign.services && foreign.services.twoFactorAuthentication;
  if (twoFactor && typeof Accounts._check2faEnabled === 'function' && Accounts._check2faEnabled(foreign)) {
    if (!options.code) Accounts._handleError('2FA code must be informed', true, 'no-2fa-code');
    if (!Accounts._isTokenValid(twoFactor.secret, options.code)) Accounts._handleError('Invalid 2FA code', true, 'invalid-2fa-code');
  }
  const userId = await shadowUser(plan.domain, foreign);
  try {
    await ensureSupportBoard(await CloudDomains.findOneAsync(plan.domain._id));
  } catch (e) {
    console.warn(`Cloud Panel: the support board of ${plan.domain.domain}: ${(e && (e.reason || e.message)) || e}`);
  }
  return { userId };
}

/**
 * Admin Panel / Cloud / Allowed addresses: a Cloud Admin signs in at the
 * CLOUD address only from them, when there are any. Every kind of login,
 * resume included, so a session does not outlive the list either.
 */
async function cloudAdminAddressAllowed(attempt) {
  if (!attempt || !attempt.user || !attempt.allowed) return true;
  const cloudDomain = cloudDomainNow();
  if (!cloudDomain || !C.isCloudHost(hostOf(attempt.connection), cloudDomain)) return true;
  if (!C.isCloudAdmin(attempt.user, cloudDomain)) return true;
  const address = addressOf(attempt.connection);
  if (A.addressAllowed(address, addressListOf(await stored()))) return true;
  try {
    require('/server/lib/securityLog').record({ key: 'authn.cloud-admin-address', action: 'blocked', source: `login:${attempt.type || ''}`,
      detail: `A Cloud Admin login from ${address}, which is not an allowed address`, userId: attempt.user._id,
      username: attempt.user.username, ip: address });
  } catch (e) { /* logging must never break the guard */ }
  throw new Meteor.Error(403, 'Cloud Admins sign in only from the allowed addresses');
}

Meteor.startup(async () => {
  Accounts.registerLoginHandler('password', async function cloudCustomerPasswordLogin(options) {
    return customerLogin(this, options);
  });
  // Before accounts-password's own handler, which refuses an account it
  // does not have before any password is looked at. Next to the front, not
  // AT it: server/loginTimingNormalization.js keeps its handler first.
  const handlers = Accounts._loginHandlers;
  if (Array.isArray(handlers) && handlers.length > 1) {
    const mine = handlers.pop();
    handlers.splice(1, 0, mine);
  }
  Accounts.validateLoginAttempt(cloudAdminAddressAllowed);

  const { ensureIndex } = require('/server/lib/mongoStartup');
  await ensureIndex(CloudDomains, { domain: 1 }, { unique: true });
  await ensureIndex(CloudDomains, { customerUsernames: 1 });
  await ensureIndex(CloudDomains, { customerEmail: 1 });
  await ensureIndex(CloudInvoices, { domainId: 1, issueDate: -1 });
  await ensureIndex(CloudChatMessages, { domainId: 1, at: -1 });
  await ensureIndex(Meteor.users, { 'services.cloudCustomer.domainId': 1, 'services.cloudCustomer.foreignUserId': 1 }, { sparse: true });
});
