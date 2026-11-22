'use strict';

// Cloud Panel (docs/Features/Admin-Panel/Cloud-Panel.md): the hosting
// operator's page on a domain of its own - cloud.example.com - where the Cloud
// Admins keep the customer domains, their databases, the Cloudflare DNS and the
// Caddy routes, and where each customer sees their invoices and talks to the
// operator.
//
// A domain is one of two kinds:
//   own     the customer's own WeKan container and its own MongoDB database,
//           routed by Caddy to that container (Multitenancy.md option A);
//   shared  served by THIS WeKan, as an Organization that claims the domain
//           (Multitenancy.md option D). Importing an own domain merges its
//           database into this one and makes it shared.
//
// Pure - no Meteor, no database, no network - so every rule is tested as data
// (tests/cloudPanel.test.cjs); server/cloudPanel.js does the I/O.

// A host as models/lib/tenants.js normalizeHost compares them: lower case,
// without a scheme, user, path, port or the root dot. (tenants.js is an ES
// module; this one is required by plain-node tests, so it has its own.)
function normalizeHost(host) {
  if (typeof host !== 'string') return '';
  let h = host.trim().toLowerCase();
  const scheme = h.indexOf('://');
  if (scheme !== -1) h = h.slice(scheme + 3);
  h = h.slice(h.lastIndexOf('@') + 1).split('/')[0];
  if (!h.startsWith('[')) h = h.split(':')[0];
  while (h.endsWith('.')) h = h.slice(0, -1);
  return h.trim();
}

const DOMAIN_MODES = Object.freeze(['own', 'shared']);
const MAX_CUSTOMERS = 50;
const INVOICE_STATUSES = Object.freeze(['open', 'paid', 'void']);
// The collections an import copies from a customer's own WeKan database:
// the board content of a tenant backup (models/lib/tenantBackup.js), and the
// time of its cards. Accounts are matched or created, never copied blindly;
// settings stay this instance's.
const IMPORT_COLLECTIONS = Object.freeze(['boards', 'lists', 'swimlanes', 'cards', 'card_comments', 'card_comment_reactions',
  'checklists', 'checklistItems', 'customFields', 'activities', 'rules', 'triggers', 'actions', 'integrations', 'attachments',
  'timeEntries']);

function fail(message) { throw new Error(message); }

function plainObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Expected an object');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`Unsupported field: ${key}`);
  return value;
}

function text(value, max, message) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) fail(message);
  return value.trim();
}

// A hostname: letters, digits, hyphens and dots, at least two labels.
function hostname(value, message = 'Use a domain name such as customer1.example.com') {
  const host = normalizeHost(typeof value === 'string' ? value : '');
  if (!host || host.length > 253 || !/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/.test(host)) fail(message);
  return host;
}

function usernames(value, max, message) {
  if (value === undefined || value === null || value === '') return [];
  const list = Array.isArray(value) ? value : String(value).split(/[\s,;]+/);
  const out = [...new Set(list.map(v => text(String(v), 100, message).toLowerCase()).filter(Boolean))];
  if (out.length > max) fail(`At most ${max}`);
  return out;
}

// ---------------------------------------------------------------- the gate

/**
 * The Cloud Panel's own domain - and whether there is a Cloud Panel at all.
 *
 * It is the server's environment variable CLOUD, e.g. CLOUD=cloud.wekan.fi,
 * and nothing else: not a setting in the database, not a field in the
 * browser, not the REST API. The panel holds the database passwords of the
 * customers' WeKan containers and connects to those databases, so the
 * operator of the machine decides that this container is the panel, and a
 * site administrator of any other WeKan - a customer is the administrator of
 * their own container - cannot make theirs one. Before 2026-11-22 the domain
 * was a setting any site administrator could change from Admin Panel /
 * People / Cloud, and with it reach any MongoDB server the WeKan server could
 * reach; a domain stored there then is read by nothing now.
 *
 * Empty (and so: no panel) when CLOUD is unset or is not a host name.
 */
// A one-label name - `localhost`, or a container's name on a private
// network - is a host too, but a switch someone meant as "on" is not.
const NOT_A_HOST = Object.freeze(['true', 'false', 'yes', 'no', 'on', 'off', '0', '1']);
function cloudDomainFromEnv(env) {
  const raw = env && typeof env.CLOUD === 'string' ? env.CLOUD : '';
  if (!raw.trim()) return '';
  try { return hostname(raw); } catch (e) { /* maybe one label */ }
  const host = normalizeHost(raw);
  if (NOT_A_HOST.includes(host) || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host) || /^\d+$/.test(host)) return '';
  return host;
}

// Cloudflare: an API token with Zone.DNS edit on the zone, the zone id, the
// target the customer domains point at, and whether Cloudflare proxies them.
function normalizeCloudflare(value) {
  const v = plainObject(value, ['apiToken', 'zoneId', 'target', 'proxied']);
  const zoneId = text(v.zoneId, 64, 'Invalid zone id');
  if (zoneId && !/^[a-f0-9]{32}$/i.test(zoneId)) fail('A Cloudflare zone id is 32 hexadecimal characters');
  const apiToken = text(v.apiToken, 200, 'Invalid API token');
  if (apiToken && !/^[A-Za-z0-9_-]{20,200}$/.test(apiToken)) fail('Invalid API token');
  const target = v.target === undefined || v.target === '' ? '' : hostOrIp(v.target);
  return { apiToken, zoneId, target, proxied: v.proxied !== false };
}

function isIpv4(value) {
  return /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(value);
}

function isIpv6(value) {
  return /^[0-9a-f:]+$/i.test(value) && value.includes(':') && value.split(':').length <= 8;
}

function hostOrIp(value) {
  const v = text(value, 253, 'Invalid target');
  if (isIpv4(v) || isIpv6(v)) return v;
  return hostname(v, 'The target is an IP address or a host name');
}

// Caddy: where its admin API listens (to load the routes), and where this
// WeKan answers (the upstream of every shared domain).
function normalizeCaddy(value) {
  const v = plainObject(value, ['adminUrl', 'sharedUpstream', 'email']);
  const adminUrl = text(v.adminUrl, 200, 'Invalid admin URL');
  if (adminUrl && !/^https?:\/\/[^\s/?#]+(\/[^\s?#]*)?$/.test(adminUrl)) fail('The Caddy admin URL is http(s)://host:port');
  return {
    adminUrl: adminUrl.replace(/\/+$/, ''),
    sharedUpstream: upstream(v.sharedUpstream),
    email: text(v.email, 200, 'Invalid email'),
  };
}

// host:port of a container, as Caddy's reverse_proxy takes it.
function upstream(value) {
  const v = text(value, 260, 'Invalid upstream');
  if (!v) return '';
  if (!/^[A-Za-z0-9.-]+:\d{1,5}$/.test(v) || Number(v.split(':').pop()) > 65535) fail('An upstream is host:port, such as wekan-customer1:8080');
  return v;
}

// ---------------------------------------------------------------- domains

// A customer domain's MongoDB: a whole connection string, or its parts. A
// database without a password is allowed - a database on a private network
// often has none.
function normalizeDatabase(value) {
  if (value === undefined || value === null) return null;
  const v = plainObject(value, ['uri', 'host', 'port', 'database', 'username', 'password', 'authSource', 'replicaSet', 'tls']);
  const uri = text(v.uri, 2000, 'The connection string is too long');
  if (uri) {
    if (!/^mongodb(\+srv)?:\/\/[^\s]+$/.test(uri)) fail('A connection string begins mongodb:// or mongodb+srv://');
    return { uri };
  }
  const host = text(v.host, 253, 'Invalid database host');
  if (!host) return null;
  if (!/^[A-Za-z0-9.-]+$/.test(host)) fail('Invalid database host');
  const port = v.port === undefined || v.port === null || v.port === '' ? 27017 : v.port;
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail('A port is 1 to 65535');
  const database = text(v.database, 64, 'Invalid database name');
  if (!database || !/^[^/\\. "$*<>:|?]{1,64}$/.test(database)) fail('A database has a name, without / \\ . " $ * < > : | ?');
  const out = { host, port, database };
  const username = text(v.username, 200, 'Invalid username');
  if (username) {
    out.username = username;
    if (typeof v.password === 'string' && v.password.length > 500) fail('The password is too long');
    if (typeof v.password === 'string' && v.password) out.password = v.password;
  }
  const authSource = text(v.authSource, 64, 'Invalid auth source');
  if (authSource) out.authSource = authSource;
  const replicaSet = text(v.replicaSet, 64, 'Invalid replica set');
  if (replicaSet) out.replicaSet = replicaSet;
  if (v.tls === true) out.tls = true;
  return out;
}

// The connection string of a database, with the password encoded.
function mongoUrlOf(db) {
  if (!db) return '';
  if (db.uri) return db.uri;
  const auth = db.username ? `${encodeURIComponent(db.username)}${db.password ? `:${encodeURIComponent(db.password)}` : ''}@` : '';
  const params = [];
  if (db.username) params.push(`authSource=${encodeURIComponent(db.authSource || db.database)}`);
  else if (db.authSource) params.push(`authSource=${encodeURIComponent(db.authSource)}`);
  if (db.replicaSet) params.push(`replicaSet=${encodeURIComponent(db.replicaSet)}`);
  if (db.tls) params.push('tls=true');
  return `mongodb://${auth}${db.host}:${db.port}/${encodeURIComponent(db.database)}${params.length ? `?${params.join('&')}` : ''}`;
}

// A database as the panel shows it: never the password, nor one inside a
// connection string.
function redactDatabase(db) {
  if (!db) return null;
  if (db.uri) return { uri: db.uri.replace(/^(mongodb(?:\+srv)?:\/\/[^:/@]+):[^@]*@/, '$1:****@'), hasPassword: /^mongodb(\+srv)?:\/\/[^:/@]+:[^@]+@/.test(db.uri) };
  const { password, ...rest } = db;
  return { ...rest, hasPassword: !!password };
}

/**
 * A customer domain. `previous` is the stored one: a password left empty on
 * an edit keeps the stored password, so the panel never has to show it.
 */
function normalizeDomain(value, previous = null) {
  const v = plainObject(value, ['domain', 'customerName', 'customerEmail', 'billingEmail', 'startDate', 'endDate', 'mode', 'upstream',
    'database', 'customerUsernames', 'notes', 'cloudflare']);
  const startDate = dayOrNull(v.startDate);
  const endDate = dayOrNull(v.endDate);
  if (startDate && endDate && endDate < startDate) fail('The End Date must not be before the Start Date');
  const mode = v.mode === undefined ? 'own' : v.mode;
  if (!DOMAIN_MODES.includes(mode)) fail('A domain has its own database or shares this one');
  let database = normalizeDatabase(v.database);
  const old = previous && previous.database;
  if (database && old && !database.uri && !old.uri && database.username && !database.password
    && database.username === old.username && old.password) {
    database = { ...database, password: old.password };
  }
  const out = {
    domain: hostname(v.domain),
    customerName: text(v.customerName, 200, 'The customer name is too long'),
    customerEmail: email(v.customerEmail),
    billingEmail: email(v.billingEmail),
    startDate,
    endDate,
    mode,
    upstream: upstream(v.upstream),
    database,
    customerUsernames: usernames(v.customerUsernames, MAX_CUSTOMERS, 'Invalid username'),
    notes: text(v.notes, 2000, 'The notes are too long'),
    cloudflare: v.cloudflare !== false,
  };
  if (mode === 'own' && !out.upstream) fail('A domain with its own database has its own container: give its upstream, host:port');
  return out;
}

function dayOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)
    || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) fail('Use a date written YYYY-MM-DD');
  return value;
}

function email(value) {
  const v = text(value, 254, 'The e-mail address is too long').toLowerCase();
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail('Invalid e-mail address');
  return v;
}

// A domain is served from its Start Date to its End Date, both included; one
// without dates always - the same rule as Weddy's.
function isActiveOn(domain, day) {
  if (!domain) return false;
  if (domain.startDate && day < domain.startDate) return false;
  if (domain.endDate && day > domain.endDate) return false;
  return true;
}

function redactDomain(doc) {
  if (!doc) return null;
  return { ...doc, database: redactDatabase(doc.database) };
}

// ---------------------------------------------------------------- who

/**
 * Is this request for the Cloud Panel? Only on the panel's own domain - the
 * CLOUD environment variable, as cloudDomainFromEnv reads it - so a customer
 * domain never shows it. Anything but that string, such as the settings
 * object an earlier version stored in the database, is no panel.
 */
function isCloudHost(host, cloudDomain) {
  return typeof cloudDomain === 'string' && !!cloudDomain && normalizeHost(host || '') === cloudDomain;
}

// The names a user goes by: their username and their e-mail addresses.
function namesOf(user) {
  if (!user) return [];
  return [user.username, ...(user.emails || []).map(e => e && e.address)].filter(Boolean).map(n => String(n).trim().toLowerCase());
}

/**
 * A customer who signed in at the panel with the password of their OWN WeKan
 * (server/cloudPanel.js, the customer login): a local account with no
 * password of its own, marked services.cloudCustomer { domainId,
 * foreignUserId, username, emails, verifiedAt }.
 */
function isCloudCustomer(user) {
  const cc = user && user.services && user.services.cloudCustomer;
  return !!(cc && typeof cc.domainId === 'string' && cc.domainId);
}

/**
 * The Cloud Admins: on the panel's container, its site administrators - the
 * first account registered there is one, as in every WeKan - who are not
 * disabled. Never a customer's account, whatever it says about itself, and
 * nobody at all when there is no panel.
 */
function isCloudAdmin(user, cloudDomain) {
  if (typeof cloudDomain !== 'string' || !cloudDomain) return false;
  if (!user || user.isAdmin !== true || user.loginDisabled === true) return false;
  return !isCloudCustomer(user);
}

// Does this domain name this person among its customers - by a username of
// customerUsernames or by its customerEmail?
function listsCustomer(domain, name) {
  const want = String(name || '').trim().toLowerCase();
  if (!want || !domain) return false;
  return [domain.customerEmail, ...(domain.customerUsernames || [])].some(n => n && String(n).toLowerCase() === want);
}

/**
 * The domains a customer may see. A customer who signed in with their own
 * WeKan's password sees exactly the one domain they signed in to, and only
 * while that domain still lists them - never another domain that happens to
 * list a name like theirs. Any other account: the domains whose Customer or
 * Billing e-mail address is theirs, or that name them among the customers.
 */
function customerDomains(user, domains) {
  if (isCloudCustomer(user)) {
    const cc = user.services.cloudCustomer;
    const names = [cc.username, ...(cc.emails || [])].filter(Boolean);
    return (domains || []).filter(d => d && d._id === cc.domainId && names.some(n => listsCustomer(d, n)));
  }
  const names = new Set(namesOf(user));
  if (!names.size) return [];
  return (domains || []).filter(d => [d.customerEmail, d.billingEmail, ...(d.customerUsernames || [])]
    .some(n => n && names.has(String(n).toLowerCase())));
}

// ---------------------------------------------------------------- customer login

// The name a password login asks for: Meteor's { username } / { email } or a
// bare string. An { id } login is not a customer's.
function loginName(userQuery) {
  if (typeof userQuery === 'string') return { name: userQuery.trim().toLowerCase(), byEmail: userQuery.includes('@') };
  if (!userQuery || typeof userQuery !== 'object') return { name: '', byEmail: false };
  if (typeof userQuery.username === 'string') return { name: userQuery.username.trim().toLowerCase(), byEmail: false };
  if (typeof userQuery.email === 'string') return { name: userQuery.email.trim().toLowerCase(), byEmail: true };
  return { name: '', byEmail: false };
}

/**
 * Whether the customer login takes this password login, and for which
 * domain. It takes it only
 *   - when there is a Cloud Panel (CLOUD) and the login is at its address,
 *   - when no account HERE has that name - an account of the panel's own,
 *     a Cloud Admin's above all, signs in with its own password, and no
 *     customer database can stand in for it,
 *   - for a name that exactly one domain lists, and that domain has its own
 *     database to ask. A name no domain lists is not looked up anywhere: no
 *     customer's database is ever searched for a stranger.
 * Returns { handle: false } (the ordinary password login decides) or
 * { handle: true, domain, name, byEmail } or { handle: true, refuse }.
 */
// A customer's name at the panel is their username with their domain,
// `username_customerdomain` (shadowUsername), so two customers both called
// anna at two domains are two names: the part after the LAST underscore is
// the domain when it is one, and the part before it is the username their own
// WeKan knows. Returns { name, domain } or null for a name with no domain.
function qualifiedLoginName(name) {
  const at = String(name || '').lastIndexOf('_');
  if (at <= 0) return null;
  const domain = name.slice(at + 1);
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) return null;
  return { name: name.slice(0, at), domain };
}

function customerLoginPlan({ cloudDomain, host, userQuery, localUser, domains }) {
  if (!isCloudHost(host, cloudDomain)) return { handle: false, reason: 'not-cloud' };
  const typed = loginName(userQuery);
  let { name } = typed;
  const { byEmail } = typed;
  if (!name || name.length > 254) return { handle: false, reason: 'no-name' };
  if (localUser && !isCloudCustomer(localUser)) return { handle: false, reason: 'local-account' };
  // username_customerdomain: only that domain, asked for the username alone.
  const qualified = byEmail ? null : qualifiedLoginName(name);
  if (qualified) {
    const at = (domains || []).filter(d => d && d.mode === 'own' && d.database
      && String(d.domain || '').toLowerCase() === qualified.domain && listsCustomer(d, qualified.name));
    if (at.length === 1) return { handle: true, domain: at[0], name: qualified.name, byEmail: false };
  }
  const listing = (domains || []).filter(d => d && d.mode === 'own' && d.database && listsCustomer(d, name));
  if (!listing.length) return { handle: false, reason: 'unlisted' };
  if (listing.length > 1) return { handle: true, refuse: 'ambiguous' };
  return { handle: true, domain: listing[0], name, byEmail };
}

// The password hash of an account in a customer's own WeKan, as
// accounts-password keeps it.
function passwordHashOf(user) {
  const p = user && user.services && user.services.password;
  return (p && (p.argon2 || p.bcrypt)) || '';
}

/**
 * The account the customer's own database answered with, judged before any
 * password is compared: exactly one, not disabled there, with a password.
 */
function foreignAccountDecision(users) {
  const list = Array.isArray(users) ? users.filter(Boolean) : [];
  if (list.length !== 1) return { ok: false, reason: list.length ? 'ambiguous' : 'not-found' };
  const user = list[0];
  if (user.loginDisabled === true) return { ok: false, reason: 'disabled' };
  if (!passwordHashOf(user)) return { ok: false, reason: 'no-password' };
  return { ok: true, user };
}

// The local username of a customer's account here, and the name they sign in
// with: `username_customerdomain` - theirs, then an underscore, then their
// domain - so the same username at two domains is two accounts
// (qualifiedLoginName reads it back).
function shadowUsername(username, domain) {
  const base = String(username || 'customer').toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'customer';
  return `${base}_${String(domain || '').toLowerCase()}`.slice(0, 200);
}

// ---------------------------------------------------------------- REST API

/**
 * Does a plain HTTP request at the CLOUD address reach the REST API? Not
 * without a login: there is no POST /users/login nor /users/register there
 * at all - signed in or not, since both are ways of getting a login - and
 * no /api/ for a request that does not carry one. So the panel, which holds
 * every customer's database password, has no sign-in but its own page, with
 * its brute-force brakes and its allowed addresses. Every other host - and
 * every WeKan without CLOUD - is unchanged.
 *
 * The inbound email and bounce webhooks are /api/ too, and are not there
 * either: the panel turns no email into cards and sends nothing that bounces.
 * A provider that must post to this container posts to another host name of
 * it, which is not the CLOUD address.
 * Returns 'pass' or 'refuse'.
 */
function cloudRestDecision({ cloudDomain, host, url, signedIn }) {
  if (!isCloudHost(host, cloudDomain)) return 'pass';
  let pathname = String(url || '').split('?')[0];
  try { pathname = decodeURIComponent(pathname); } catch (e) { return 'refuse'; }
  pathname = pathname.toLowerCase().replace(/\/{2,}/g, '/');
  if (/^\/users\/(login|register)(\/|$)/.test(pathname)) return 'refuse';
  if (/^\/(api|users)(\/|$)/.test(pathname)) return signedIn ? 'pass' : 'refuse';
  return 'pass';
}

// ---------------------------------------------------------------- support boards

// Each customer domain has a WeKan board for its support: the tickets are
// its cards in Open / In progress / Done, and the support chat is the
// comments of one card in the Chat list - which Board View / Chat shows as a
// chat (client/components/boards/chatView.js: a card is a channel, its
// comments the messages).
const SUPPORT_LISTS = Object.freeze([
  { key: 'open', titleKey: 'open', title: 'Open' },
  { key: 'progress', titleKey: 'scrum-category-doing', title: 'In progress' },
  { key: 'done', titleKey: 'done', title: 'Done' },
  { key: 'chat', titleKey: 'board-view-chat', title: 'Chat' },
]);
const TICKET_STATES = Object.freeze(['open', 'progress', 'done']);

function supportBoardTitle(domain) {
  return `Support: ${domain}`;
}

/**
 * Who is on a domain's support board, and as what. The Cloud Admins are its
 * board admins: everything. The domain's customers are Comment only
 * (models/lib/boardRoleCapabilities.js): they read every card and comment,
 * and cannot create, edit, move, archive or delete a card, nor manage the
 * board - 'normal' would let them archive and move the tickets, a Worker
 * would let them move them. Adding a ticket is the one write they are given,
 * and the panel's own method does it for them (one card, into Open).
 */
function supportMembers(adminIds, customerIds) {
  const flags = { isNoComments: false, isCommentOnly: false, isWorker: false, isNormalAssignedOnly: false,
    isCommentAssignedOnly: false, isReadOnly: false, isReadAssignedOnly: false };
  const out = [];
  const seen = new Set();
  for (const userId of adminIds || []) {
    if (!userId || seen.has(userId)) continue;
    seen.add(userId);
    out.push({ userId, isAdmin: true, isActive: true, ...flags });
  }
  for (const userId of customerIds || []) {
    if (!userId || seen.has(userId)) continue;
    seen.add(userId);
    out.push({ userId, isAdmin: false, isActive: true, ...flags, isCommentOnly: true });
  }
  return out;
}

function normalizeTicket(value) {
  const v = plainObject(value, ['title', 'description']);
  const title = text(v.title, 500, 'A title is at most 500 characters');
  if (!title) fail('A ticket has a title');
  return { title, description: text(v.description, 20000, 'A description is at most 20000 characters') };
}

// ---------------------------------------------------------------- Caddy

/**
 * The Caddyfile of the panel and every domain: the panel and each shared
 * domain to this WeKan, each own domain to its container.
 */
function caddyfile(domains, { cloudDomain = '', caddy = {} } = {}, today = null) {
  const blocks = [];
  if (caddy.email) blocks.push(`{\n\temail ${caddy.email}\n}`);
  const shared = caddy.sharedUpstream || 'wekan:8080';
  if (cloudDomain) blocks.push(`${cloudDomain} {\n\treverse_proxy ${shared}\n}`);
  for (const d of [...(domains || [])].sort((a, b) => a.domain.localeCompare(b.domain))) {
    const to = d.mode === 'shared' ? shared : d.upstream;
    if (!to || (today && !isActiveOn(d, today))) continue;
    blocks.push(`${d.domain} {\n\treverse_proxy ${to}\n}`);
  }
  return `${blocks.join('\n\n')}\n`;
}

// ---------------------------------------------------------------- Cloudflare

/**
 * What Cloudflare has to change so every domain (and the panel) points at the
 * target: records to create, records to update. A record of another type on
 * the same name - an MX, a TXT - is never touched; a CNAME where an A is
 * wanted, or the other way round, is reported as a conflict, not replaced.
 */
function dnsPlan(domains, existing, { cloudDomain = '', cloudflare = {} } = {}) {
  const target = cloudflare.target;
  if (!target) fail('Set the target the domains point at');
  const type = isIpv4(target) ? 'A' : (isIpv6(target) ? 'AAAA' : 'CNAME');
  const names = [...new Set([cloudDomain, ...(domains || []).filter(d => d.cloudflare !== false).map(d => d.domain)].filter(Boolean))];
  const create = [];
  const update = [];
  const conflicts = [];
  const unchanged = [];
  for (const name of names) {
    const records = (existing || []).filter(r => r && normalizeHost(r.name) === name && ['A', 'AAAA', 'CNAME'].includes(r.type));
    const same = records.find(r => r.type === type);
    const wanted = { type, name, content: target, proxied: cloudflare.proxied !== false, ttl: 1 };
    if (!records.length) create.push(wanted);
    else if (same) {
      if (same.content === target && !!same.proxied === wanted.proxied) unchanged.push(name);
      else update.push({ id: same.id, ...wanted });
    } else conflicts.push({ name, type: records[0].type, content: records[0].content });
  }
  return { create, update, conflicts, unchanged };
}

// ---------------------------------------------------------------- invoices

// An invoice of the hosting, as the Cloud Admin records it - also invoices
// from before the panel, carried over by hand.
function normalizeCloudInvoice(value) {
  const v = plainObject(value, ['number', 'issueDate', 'dueDate', 'amount', 'currency', 'status', 'paidDate', 'description', 'link']);
  const day = (x, message) => {
    if (x === undefined || x === null || x === '') return null;
    if (typeof x !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(x) || Number.isNaN(Date.parse(`${x}T00:00:00Z`))) fail(message);
    return x;
  };
  const number = text(v.number, 50, 'The number is too long');
  if (!number) fail('An invoice has a number');
  const issueDate = day(v.issueDate, 'Use a date written YYYY-MM-DD');
  if (!issueDate) fail('An invoice has a date');
  const cur = typeof v.currency === 'string' ? v.currency.trim().toUpperCase() : '';
  if (!/^[A-Z]{3}$/.test(cur)) fail('Use a three-letter currency code, such as EUR or USD');
  if (typeof v.amount !== 'number' || !Number.isFinite(v.amount) || v.amount < 0) fail('An amount is a number of at least 0');
  const { toMinorUnits } = require('./currencies');
  const status = v.status === undefined ? 'open' : v.status;
  if (!INVOICE_STATUSES.includes(status)) fail('Invalid status');
  const paidDate = day(v.paidDate, 'Use a date written YYYY-MM-DD');
  if (status === 'paid' && !paidDate) fail('A paid invoice has the day it was paid');
  const link = text(v.link, 500, 'The link is too long');
  if (link && !/^https:\/\/[^\s]+$/.test(link)) fail('A link is https://');
  return {
    number, issueDate, dueDate: day(v.dueDate, 'Use a date written YYYY-MM-DD'), amountMinor: toMinorUnits(v.amount, cur), currency: cur,
    status, paidDate: status === 'paid' ? paidDate : null, description: text(v.description, 1000, 'The description is too long'), link,
  };
}

// ---------------------------------------------------------------- chat

function normalizeChatMessage(value) {
  const v = plainObject(value, ['text']);
  const body = text(v.text, 20000, 'A message is at most 20000 characters');
  if (!body) fail('A message has text');
  return { text: body };
}

/**
 * Messages of an imported chat - the board models/lib/chatExportFormats.js
 * (Rocket.Chat) or models/lib/sandstorm/grainApps.js (SandChat) makes of an
 * export: its cards are the rooms, their comments the messages.
 */
function importedChatMessages(board, source) {
  const out = [];
  for (const task of (board && board.tasks) || []) {
    const room = String(task.title || '').slice(0, 200);
    for (const c of task.comments || []) {
      const body = String(c.text || '').slice(0, 20000);
      if (!body.trim()) continue;
      const at = c.date ? new Date(c.date) : null;
      out.push({ text: body, room, authorName: String(c.authorName || c.author || '').slice(0, 200), source,
        at: at && Number.isFinite(at.getTime()) ? at : null });
    }
  }
  return out;
}

// ---------------------------------------------------------------- import

/**
 * How the accounts of a customer's database become accounts here: one with
 * the same e-mail address (or, with no address, the same username) IS that
 * account; any other is created, under its own username - or, when the
 * username is taken, under it with a number added.
 */
function accountPlan(sourceUsers, existingUsers) {
  const emailOf = u => (((u && u.emails) || [])[0] || {}).address;
  const byEmail = new Map();
  const taken = new Set();
  const existingIds = new Set();
  for (const u of existingUsers || []) {
    existingIds.add(u._id);
    if (u.username) taken.add(String(u.username).toLowerCase());
    for (const e of u.emails || []) if (e && e.address) byEmail.set(String(e.address).toLowerCase(), u._id);
  }
  const map = {};
  const create = [];
  for (const u of sourceUsers || []) {
    if (!u || !u._id) continue;
    const email = emailOf(u) ? String(emailOf(u)).toLowerCase() : '';
    if (email && byEmail.has(email)) { map[u._id] = byEmail.get(email); continue; }
    let username = String(u.username || 'user').toLowerCase();
    if (!email && taken.has(username)) {
      const same = (existingUsers || []).find(x => String(x.username || '').toLowerCase() === username);
      if (same) { map[u._id] = same._id; continue; }
    }
    for (let i = 2; taken.has(username); i += 1) username = `${String(u.username || 'user').toLowerCase()}${i}`;
    taken.add(username);
    const id = existingIds.has(u._id) ? null : u._id;
    create.push({ sourceId: u._id, username, keepId: !!id });
    if (email) byEmail.set(email, u._id);
    map[u._id] = u._id;
  }
  return { map, create };
}

// Every string in a document equal to a mapped id becomes the id it maps to:
// user ids sit in many fields (userId, members, assignees, createdBy, ...), and
// an id is a random 17 characters, so an exact match is the id and nothing else.
function remapIds(value, map) {
  if (typeof value === 'string') return Object.prototype.hasOwnProperty.call(map, value) ? map[value] : value;
  if (Array.isArray(value)) return value.map(v => remapIds(v, map));
  if (value instanceof Date || value === null || typeof value !== 'object') return value;
  // A Mongo ObjectId, a Buffer or another class instance is kept as it is.
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = remapIds(v, map);
  return out;
}

module.exports = {
  DOMAIN_MODES, INVOICE_STATUSES, IMPORT_COLLECTIONS,
  cloudDomainFromEnv, normalizeCloudflare, normalizeCaddy, normalizeDatabase, normalizeDomain,
  mongoUrlOf, redactDatabase, redactDomain, isCloudHost, isCloudAdmin, isCloudCustomer, listsCustomer, customerDomains, isActiveOn,
  loginName, customerLoginPlan, qualifiedLoginName, passwordHashOf, foreignAccountDecision, shadowUsername,
  cloudRestDecision, SUPPORT_LISTS, TICKET_STATES, supportBoardTitle, supportMembers, normalizeTicket,
  caddyfile, dnsPlan, normalizeCloudInvoice, normalizeChatMessage, importedChatMessages, accountPlan, remapIds,
};
