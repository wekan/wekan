import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Attachments from '/models/attachments';

async function requireAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) throw new Meteor.Error('not-authorized', 'Admin only');
}

function boundedOptions(options) {
  return {
    search: String(options.search || '').trim().slice(0, 500),
    limit: Math.min(Math.max(options.limit || 10, 1), 200),
    skip: Math.min(Math.max(options.skip || 0, 0), 1000000),
  };
}

export function attachmentsReportQuery(search = '') {
  if (!search) return {};
  const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { name: new RegExp(safe, 'i') };
}

// The Files Report deliberately uses the plain collection. Going through the
// FilesCollection backward-compatibility cursor can block while resolving old
// CFS records, whereas this report needs only metadata for one bounded page.
export async function attachmentsReportForAdmin(userId, options = {}) {
  check(options, {
    search: Match.Optional(String), limit: Match.Optional(Number),
    skip: Match.Optional(Number),
  });
  await requireAdmin(userId);
  const bounded = boundedOptions(options);
  const cursor = Attachments.collection.find(
    attachmentsReportQuery(bounded.search), {
      fields: { _id: 1, name: 1, size: 1, type: 1, meta: 1,
        path: 1, versions: 1 },
      sort: { name: 1 }, limit: bounded.limit, skip: bounded.skip,
    },
  );
  const attachments = typeof cursor.fetchAsync === 'function'
    ? await cursor.fetchAsync() : cursor.fetch();
  return { attachments, ...bounded };
}

export async function attachmentsReportCountForAdmin(userId, search = '') {
  await requireAdmin(userId);
  const bounded = boundedOptions({ search });
  const cursor = Attachments.collection.find(
    attachmentsReportQuery(bounded.search),
  );
  return typeof cursor.countAsync === 'function'
    ? await cursor.countAsync() : cursor.count();
}
