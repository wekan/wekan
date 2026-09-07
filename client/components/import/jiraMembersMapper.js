const { membersFromImport } = require('/models/lib/importMembers');

// Extract the distinct assignees from a Jira export so the import "map members"
// step can map each Jira user to a WeKan user.
export function jiraGetMembersToMap(data) {
  return membersFromImport('jira', data).map(member => ({ ...member, wekanId: null }));
}
