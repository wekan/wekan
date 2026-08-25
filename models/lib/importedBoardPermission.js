'use strict';

// A board export may predate the permission field (notably old Sandstorm
// exports). Importing an absent or malformed value must fail closed: only an
// explicit supported public value may create a public board.
function importedBoardPermission(permission) {
  return permission === 'public' ? 'public' : 'private';
}

export { importedBoardPermission };
