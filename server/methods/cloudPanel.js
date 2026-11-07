// The Cloud Panel's server side (models/lib/cloudPanel.js has the rules,
// docs/Platforms/FOSS/Weddy/Cloud-Panel.md the design):
//
//   cloudStatus()               what the client may draw: is Cloud here, is the
//                               caller the SuperAdmin on the Cloud Panel Domain
//   cloudSaveSettings()         Admin Panel / People / Cloud: the Cloud Panel Domain
//                               and the SuperAdmin Username (a site admin)
//   cloudDomains(), cloudSaveDomain(), cloudRemoveDomain()
//                               the Domains table (the SuperAdmin, on the panel domain)
//   cloudSetCloudflareToken()   the CloudFlare API key: written to
//                               WEDDY_CLOUD_DIR/cloudflare.json, mode 0600, and never
//                               sent back - the client only learns whether one is set
//
// Every change writes WEDDY_CLOUD_DIR/domains.json, which Weddy follows: it starts
// and stops the WeKan of each domain and gets its certificate.

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import fs from 'fs';
import path from 'path';
import { ReactiveCache } from '/imports/reactiveCache';
import * as tenantAdmin from '/models/lib/tenantAdmin';
import {
  cloudEnabled, cloudPanelAllowed, cleanDomainRow, domainsFile, normalizeHost, validDomain,
  DOMAIN_FIELDS,
} from '/models/lib/cloudPanel';

// Server only: neither collection is published.
export const CloudPanelSettings = new Mongo.Collection('cloudPanelSettings');
export const CloudDomains = new Mongo.Collection('cloudDomains');

const cloudDir = () => process.env.WEDDY_CLOUD_DIR;

function writeFileAtomic(file, text, mode) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text, { mode });
  fs.chmodSync(tmp, mode);
  fs.renameSync(tmp, file);
}

async function settings() {
  return (await CloudPanelSettings.findOneAsync('settings')) || {};
}

// domains.json from the collection - after every change, and at startup, so Weddy
// and the table never stay apart.
async function writeDomainsFile() {
  if (!cloudEnabled(process.env)) return;
  const s = await settings();
  const rows = await CloudDomains.find({}, { sort: { domain: 1 } }).fetchAsync();
  writeFileAtomic(path.join(cloudDir(), 'domains.json'),
    `${JSON.stringify(domainsFile(s.cloudPanelDomain, rows), null, 2)}\n`, 0o600);
}

// The Host the browser asked for. Not X-Forwarded-Host, which a client can send
// itself: behind Weddy, Host is already the domain - Weddy passes it on unchanged.
function hostOf(connection) {
  const h = connection && connection.httpHeaders;
  return (h && h.host) || '';
}

async function callerUser(userId) {
  return userId ? ReactiveCache.getUser({ _id: userId }, { fields: { username: 1, emails: 1, isAdmin: 1, orgs: 1 } }) : null;
}

async function requireSuperAdmin(method) {
  const s = await settings();
  const user = await callerUser(method.userId);
  if (!cloudPanelAllowed({ env: process.env, user, superAdminUsername: s.superAdminUsername,
    cloudPanelDomain: s.cloudPanelDomain, host: hostOf(method.connection) })) {
    throw new Meteor.Error('not-authorized', 'The Cloud Panel is for the SuperAdmin, on the Cloud Panel Domain');
  }
  return user;
}

function readStatus() {
  try {
    const st = JSON.parse(fs.readFileSync(path.join(cloudDir(), 'status.json'), 'utf8'));
    return Array.isArray(st.domains) ? st.domains : [];
  } catch (e) {
    return [];
  }
}

Meteor.methods({
  async cloudStatus() {
    if (!cloudEnabled(process.env)) return { enabled: false };
    const s = await settings();
    const user = await callerUser(this.userId);
    const siteAdmin = tenantAdmin.isSiteAdmin(user);
    const panel = cloudPanelAllowed({ env: process.env, user, superAdminUsername: s.superAdminUsername,
      cloudPanelDomain: s.cloudPanelDomain, host: hostOf(this.connection) });
    let cloudflareTokenSet = false;
    if (panel) {
      try {
        cloudflareTokenSet = !!JSON.parse(fs.readFileSync(path.join(cloudDir(), 'cloudflare.json'), 'utf8')).apiToken;
      } catch (e) { /* no token yet */ }
    }
    return {
      enabled: true,
      cloudPanel: panel,
      cloudPanelDomain: s.cloudPanelDomain || '',
      // The SuperAdmin's name only to whoever may change it.
      superAdminUsername: siteAdmin ? (s.superAdminUsername || '') : undefined,
      cloudflareTokenSet,
    };
  },

  async cloudSaveSettings(cloudPanelDomain, superAdminUsername) {
    check(cloudPanelDomain, String);
    check(superAdminUsername, String);
    if (!cloudEnabled(process.env)) throw new Meteor.Error('not-available');
    const user = await callerUser(this.userId);
    if (!tenantAdmin.isSiteAdmin(user)) throw new Meteor.Error('not-authorized');
    const domain = normalizeHost(cloudPanelDomain);
    if (domain && !validDomain(domain)) throw new Meteor.Error('invalid-domain', 'Cloud Panel Domain');
    const name = superAdminUsername.trim();
    if (name.length > 200) throw new Meteor.Error('invalid', 'SuperAdmin Username');
    await CloudPanelSettings.upsertAsync('settings', { $set: { cloudPanelDomain: domain, superAdminUsername: name,
      updatedAt: new Date(), updatedBy: this.userId } });
    await writeDomainsFile();
    return true;
  },

  async cloudDomains() {
    await requireSuperAdmin(this);
    const status = new Map(readStatus().map(d => [d.domain, d]));
    const rows = await CloudDomains.find({}, { sort: { domain: 1 } }).fetchAsync();
    return rows.map(r => {
      const out = { _id: r._id };
      for (const f of DOMAIN_FIELDS) out[f] = r[f] || '';
      const st = status.get(r.domain);
      out.tls = st ? st.tls : '';
      out.error = st ? (st.error || '') : '';
      return out;
    });
  },

  async cloudSaveDomain(id, row) {
    check(id, Match.Maybe(String));
    check(row, Object);
    await requireSuperAdmin(this);
    const { row: clean, error } = cleanDomainRow(row);
    if (error) throw new Meteor.Error('invalid', error);
    const s = await settings();
    if (clean.domain === normalizeHost(s.cloudPanelDomain)) {
      throw new Meteor.Error('invalid', 'domain'); // the panel is the first domain's own
    }
    const other = await CloudDomains.findOneAsync({ domain: clean.domain });
    if (other && other._id !== id) throw new Meteor.Error('duplicate', 'domain');
    if (id) {
      const n = await CloudDomains.updateAsync(id, { $set: { ...clean, updatedAt: new Date() } });
      if (!n) throw new Meteor.Error('not-found');
    } else {
      await CloudDomains.insertAsync({ ...clean, createdAt: new Date() });
    }
    await writeDomainsFile();
    return true;
  },

  async cloudRemoveDomain(id) {
    check(id, String);
    await requireSuperAdmin(this);
    await CloudDomains.removeAsync(id);
    await writeDomainsFile();
    return true;
  },

  // An empty key removes it. The key is stored for Weddy, on the server, and is
  // never returned by any method.
  async cloudSetCloudflareToken(apiToken) {
    check(apiToken, String);
    await requireSuperAdmin(this);
    const token = apiToken.trim();
    if (token.length > 500 || /\s/.test(token)) throw new Meteor.Error('invalid', 'apiToken');
    const file = path.join(cloudDir(), 'cloudflare.json');
    if (token) writeFileAtomic(file, `${JSON.stringify({ apiToken: token })}\n`, 0o600);
    else fs.rmSync(file, { force: true });
    return true;
  },
});

Meteor.startup(async () => {
  if (!cloudEnabled(process.env)) return;
  try {
    await writeDomainsFile();
  } catch (e) {
    console.error('Cloud Panel: writing domains.json failed:', e.message);
  }
});
