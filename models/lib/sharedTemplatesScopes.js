// Admin Panel / People / Shared templates: which group kinds - Organizations,
// Teams, email Domains - a template board may be shared with by dragging it
// onto one in All Boards / Templates, and which groupings the admin's own
// Shared templates view lists. One instance setting, Settings.sharedTemplatesScopes,
// so every browser of every user sees the same choice. It used to be read from
// the browser's localStorage, which made it different per browser and empty
// for everyone but the admin who ticked it.
const SHARED_TEMPLATES_SCOPES = ['organizations', 'teams', 'domains'];
// The localStorage key the choice used to live in, read once to carry an
// admin's earlier ticks over to the setting.
const LEGACY_STORAGE_KEY = 'sharedTemplatesScopes';

// Only known kinds, each once, in a fixed order.
function normalizeScopes(value) {
  if (!Array.isArray(value)) return [];
  return SHARED_TEMPLATES_SCOPES.filter(scope => value.includes(scope));
}

function sharedTemplatesScopes(setting) {
  return normalizeScopes(setting && setting.sharedTemplatesScopes);
}

function toggleScope(current, scope) {
  if (!SHARED_TEMPLATES_SCOPES.includes(scope)) return normalizeScopes(current);
  const list = normalizeScopes(current);
  return list.includes(scope)
    ? list.filter(s => s !== scope)
    : normalizeScopes([...list, scope]);
}

module.exports = {
  SHARED_TEMPLATES_SCOPES,
  LEGACY_STORAGE_KEY,
  normalizeScopes,
  sharedTemplatesScopes,
  toggleScope,
};
