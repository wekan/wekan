import { ReactiveCache } from '/imports/reactiveCache';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';

// #4475: Admin Panel -> Settings -> Visibility -> "Only admins can create
// boards" (tableVisibilityMode-boardCreationAdminOnly). Shared by every
// client-side "Add board" entry point so the button hides consistently;
// the real enforcement is server-side, in createBoardWithInitialSwimlanes
// (server/models/boards.js) - this only avoids showing a control that
// would be rejected.
export function boardCreationAllowed() {
  const restricted = TableVisibilityModeSettings.findOne(
    'tableVisibilityMode-boardCreationAdminOnly',
  )?.booleanValue;
  if (!restricted) {
    return true;
  }
  return !!ReactiveCache.getCurrentUser()?.isAdmin;
}
