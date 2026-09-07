const { membersFromImport } = require('/models/lib/importMembers');

// Extract the distinct task owners from a Kanboard export so the import
// "map members" step can map each Kanboard user to a WeKan user.
export function kanboardGetMembersToMap(data) {
  return membersFromImport('kanboard', data).map(member => ({ ...member, wekanId: null }));
}
