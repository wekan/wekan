export const SHARED_TEMPLATE_SCOPES = Object.freeze([
  'organizations',
  'teams',
  'domains',
]);

export const SHARED_TEMPLATE_SCOPE_LABELS = Object.freeze({
  organizations: 'organizations',
  teams: 'teams',
  domains: 'domains',
});

export function normalizeSharedTemplateScopes(scopes) {
  const values = Array.isArray(scopes) ? scopes : scopes ? [scopes] : [];
  return SHARED_TEMPLATE_SCOPES.filter(scope => values.includes(scope));
}

// This is intentionally shared by Blaze and the HTML4 baseline. Keeping the
// grouping here means both renderers expose the same users, scopes and boards.
export function buildSharedTemplateScopeGroups(scope, rows) {
  if (!SHARED_TEMPLATE_SCOPES.includes(scope)) return [];
  const groups = new Map();
  const add = (key, name, row) => {
    if (!key) return;
    if (!groups.has(key)) groups.set(key, {
      groupKey: key,
      groupName: name || key,
      members: [],
    });
    groups.get(key).members.push({
      userId: row.userId,
      label: row.fullname ? `${row.fullname} (${row.username})` : row.username,
      templateBoards: (row.templateBoards || []).map(board => ({
        title: board.title,
        boardId: board.boardId,
        slug: board.slug,
        url: board.boardId ? `/b/${board.boardId}/${board.slug || 'template'}` : '',
      })),
    });
  };

  for (const row of rows || []) {
    if (scope === 'organizations') {
      for (const org of row.orgs || []) add(org.orgId, org.orgDisplayName, row);
    } else if (scope === 'teams') {
      for (const team of row.teams || []) add(team.teamId, team.teamDisplayName, row);
    } else {
      for (const domain of row.domains || []) add(domain, domain, row);
    }
  }
  return [...groups.values()].sort((a, b) =>
    String(a.groupName).localeCompare(String(b.groupName)));
}
