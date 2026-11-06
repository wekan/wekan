import { Template } from 'meteor/templating';
import { ReactiveCache } from '/imports/reactiveCache';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';

// #4475: Admin Panel -> Settings -> Visibility -> "Only admins can create
// boards" (tableVisibilityMode-boardCreationAdminOnly). Shared by every
// client-side entry point that makes a new board - Add Board, and with it
// Import and Template, Duplicate in the All Boards sidebar, and "Create
// board from card" - so they hide consistently. The real enforcement is on
// the server, on every path (CreateBleed, server/lib/boardCreationGuard.js);
// this only avoids offering a control the server would refuse.
export function boardCreationAllowed() {
  const restricted = TableVisibilityModeSettings.findOne(
    'tableVisibilityMode-boardCreationAdminOnly',
  )?.booleanValue;
  if (!restricted) {
    return true;
  }
  return !!ReactiveCache.getCurrentUser()?.isAdmin;
}

// For templates: {{#if boardCreationAllowed}}.
Template.registerHelper('boardCreationAllowed', () => boardCreationAllowed());
