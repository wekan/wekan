import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import securityLog from '/server/lib/securityLog';

async function requireGlobalAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  securityLog.record({ severity: 'high', category: 'authz', bleed: 'TemplateBleed',
    action: 'blocked', source: 'adminSharedTemplates', userId,
    username: user?.username, req: context.req,
    detail: 'refused an attempt to read instance-wide shared template metadata' });
  throw new Meteor.Error(userId ? 'not-authorized' : 'not-logged-in');
}

export async function sharedTemplatesForAdmin(userId, context = {}) {
  await requireGlobalAdmin(userId, context);
  const users = await ReactiveCache.getUsers(
    { 'profile.templatesBoardId': { $exists: true, $nin: [null, ''] } },
    { fields: { username: 1, 'profile.fullname': 1,
      'profile.templatesBoardId': 1, 'profile.boardTemplatesSwimlaneId': 1,
      orgs: 1, teams: 1, emails: 1 } },
  );
  const result = [];
  for (const user of users) {
    const profile = user.profile || {};
    if (!profile.templatesBoardId) continue;
    const cardQuery = { boardId: profile.templatesBoardId,
      type: 'cardType-linkedBoard', archived: false };
    if (profile.boardTemplatesSwimlaneId) {
      cardQuery.swimlaneId = profile.boardTemplatesSwimlaneId;
    }
    const cards = await ReactiveCache.getCards(cardQuery, {
      fields: { title: 1, linkedId: 1, sort: 1 }, sort: { sort: 1 },
    });
    if (!cards?.length) continue;
    const templateBoards = [];
    for (const card of cards) {
      const board = card.linkedId && await ReactiveCache.getBoard(card.linkedId);
      templateBoards.push({ cardId: card._id, title: card.title || '',
        boardId: card.linkedId || '', slug: board?.slug || '' });
    }
    const domains = [...new Set((user.emails || []).map(email => {
      const address = String(email.address || '');
      const at = address.lastIndexOf('@');
      return at < 0 ? '' : address.slice(at + 1).toLowerCase().trim();
    }).filter(Boolean))];
    result.push({ userId: user._id, username: user.username || '',
      fullname: profile.fullname || '',
      orgs: (user.orgs || []).map(org => ({ orgId: org.orgId,
        orgDisplayName: org.orgDisplayName })),
      teams: (user.teams || []).map(team => ({ teamId: team.teamId,
        teamDisplayName: team.teamDisplayName })), domains, templateBoards });
  }
  return result;
}
