import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';

const { isOpenPermission } = require('/models/lib/boardPermission');

// VisibilityBleed's import sibling. Admin Panel -> "private boards only" was
// enforced in Boards.before.insert, but a board import writes through
// Boards.direct, which skips every collection hook, so a Trello or WeKan
// export marked public arrived public on an instance that allows none. The
// importers now ask this function, the same rule the hook applies. Returns
// the permission to store.
export async function boardPermissionUnderPolicy(permission) {
  if (!isOpenPermission(permission)) return permission;
  const privateOnly = await TableVisibilityModeSettings.findOneAsync('tableVisibilityMode-allowPrivateOnly');
  return privateOnly?.booleanValue ? 'private' : permission;
}
