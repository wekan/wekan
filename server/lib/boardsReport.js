import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Users from '/models/users';

export const BOARD_REPORT_PERMISSIONS = Object.freeze(['all', 'public', 'private']);

async function requireAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) throw new Meteor.Error('not-authorized', 'Admin only');
}

function optionsFor(options) {
  const search = String(options.search || '').trim().slice(0, 500);
  const permission = BOARD_REPORT_PERMISSIONS.includes(options.permission)
    ? options.permission : 'all';
  const limit = Math.min(Math.max(options.limit || 10, 1), 200);
  const skip = Math.min(Math.max(options.skip || 0, 0), 1000000);
  return { search, permission, limit, skip };
}

export function boardsReportQuery(search = '', permission = 'all') {
  const query = {};
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.title = new RegExp(safe, 'i');
  }
  if (permission === 'public' || permission === 'private') {
    query.permission = permission;
  }
  return query;
}

// One instance-wide, bounded source for both the HTML5 publication and HTML4.
// Related names are fetched only for the current page, never for the instance.
export async function boardsReportForAdmin(userId, options = {}) {
  check(options, {
    search: Match.Optional(String), permission: Match.Optional(String),
    limit: Match.Optional(Number), skip: Match.Optional(Number),
  });
  await requireAdmin(userId);
  const bounded = optionsFor(options);
  const boards = await ReactiveCache.getBoards(
    boardsReportQuery(bounded.search, bounded.permission),
    {
      fields: {
        _id: 1, boardId: 1, archived: 1, slug: 1, title: 1,
        description: 1, color: 1, backgroundImageURL: 1, members: 1,
        orgs: 1, teams: 1, permission: 1, type: 1, sort: 1,
      },
      sort: { sort: 1 }, limit: bounded.limit, skip: bounded.skip,
    }, false,
  );
  const userIds = [...new Set(boards.flatMap(board =>
    (board.members || []).map(member => member.userId)).filter(Boolean))];
  const orgIds = [...new Set(boards.flatMap(board =>
    (board.orgs || []).map(org => org.orgId)).filter(Boolean))];
  const teamIds = [...new Set(boards.flatMap(board =>
    (board.teams || []).map(team => team.teamId)).filter(Boolean))];
  const [users, orgs, teams] = await Promise.all([
    userIds.length ? ReactiveCache.getUsers(
      { _id: { $in: userIds } }, { fields: Users.safeFields }, false,
    ) : [],
    orgIds.length ? ReactiveCache.getOrgs({ _id: { $in: orgIds } }, {}, false) : [],
    teamIds.length ? ReactiveCache.getTeams({ _id: { $in: teamIds } }, {}, false) : [],
  ]);
  return { boards, users, orgs, teams, ...bounded };
}

export async function boardsReportCountForAdmin(userId, search = '', permission = 'all') {
  await requireAdmin(userId);
  const bounded = optionsFor({ search, permission });
  const cursor = await ReactiveCache.getBoards(
    boardsReportQuery(bounded.search, bounded.permission), {}, true,
  );
  return typeof cursor.countAsync === 'function'
    ? await cursor.countAsync() : cursor.count();
}
