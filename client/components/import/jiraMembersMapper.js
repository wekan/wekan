// Extract the distinct assignees from a Jira export so the import "map members"
// step can map each Jira user to a WeKan user.
export function jiraGetMembersToMap(data) {
  const issues = Array.isArray(data) ? data : data.issues || [];
  const byId = {};
  issues.forEach(issue => {
    const assignee = issue.fields && issue.fields.assignee;
    if (!assignee) return;
    const id = assignee.accountId || assignee.name || assignee.emailAddress;
    if (!id || byId[id]) return;
    byId[id] = {
      id,
      username: assignee.name || assignee.displayName || id,
      fullName: assignee.displayName || assignee.name || id,
      wekanId: null,
    };
  });
  return Object.values(byId);
}
