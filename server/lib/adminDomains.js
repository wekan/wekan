import { Meteor } from 'meteor/meteor';
import securityLog from '/server/lib/securityLog';
const { paginateDomains } = require('/models/lib/domainTablePage');

async function requireGlobalAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  securityLog.record({ severity: 'high', category: 'authz', bleed: 'DomainBleed',
    action: 'blocked', source: 'adminDomains', userId,
    username: user?.username, req: context.req,
    detail: 'refused an attempt to enumerate account email domains' });
  throw new Meteor.Error('not-authorized', 'Admin access required');
}

function normalizedPageRequest(params = {}) {
  const search = String(params.search || '').trim().slice(0, 500);
  const numericPage = Number(params.page);
  const page = Number.isSafeInteger(numericPage) && numericPage > 0 ? numericPage : 1;
  const numericPerPage = Number(params.perPage);
  const perPage = Number.isSafeInteger(numericPerPage) && numericPerPage > 0
    ? Math.min(numericPerPage, 200) : 10;
  return { search, page, perPage };
}

async function aggregateDomainsForAdmin(userId, context = {}) {
  await requireGlobalAdmin(userId, context);
  const users = await Meteor.users.find({}, { fields: { emails: 1 } }).fetchAsync();
  const counts = new Map();
  for (const user of users) {
    const address = String(user?.emails?.[0]?.address || '');
    const at = address.lastIndexOf('@');
    if (at < 0) continue;
    const domain = address.slice(at + 1).toLowerCase().trim();
    if (!domain) continue;
    counts.set(domain, (counts.get(domain) || 0) + 1);
  }
  return Array.from(counts, ([domain, count]) => ({ domain, count }));
}

export async function domainsForAdmin(userId, context = {}) {
  const rows = await aggregateDomainsForAdmin(userId, context);
  return rows.sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
}

export async function domainsPageForAdmin(userId, params = {}, context = {}) {
  const rows = await aggregateDomainsForAdmin(userId, context);
  return paginateDomains(rows, normalizedPageRequest(params));
}

export default { domainsForAdmin, domainsPageForAdmin };
