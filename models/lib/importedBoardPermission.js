'use strict';

// A board export may predate the permission field (notably old Sandstorm
// exports). Importing an absent or malformed value must fail closed: only an
// explicit supported open value may create a public or instance-wide (#3249)
// board. Admin Panel's "private boards only" still applies on insert.
function importedBoardPermission(permission) {
  return permission === 'public' || permission === 'instance' ? permission : 'private';
}

export { importedBoardPermission };
