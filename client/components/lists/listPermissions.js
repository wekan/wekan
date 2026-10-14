import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import CustomBoardRoles from '/models/customBoardRoles';

// #4527: the List permissions popup (list menu, board admins). One row per
// role a member can have - the built-in ones, the custom ones, and on an open
// board everybody signed in - and for each, edit and comment: as the board
// says, allowed, or refused in this list.
const { BOARD_ROLES } = require('/models/lib/boardRoleCapabilities');
const { LIST_CAPABILITIES, SIGNED_IN, cleanExceptions } = require('/models/lib/listPermissions');

function choiceOf(list, role, cap) {
  const entry = list && list.roleExceptions && list.roleExceptions[role];
  if (!entry || typeof entry[cap] !== 'boolean') return '';
  return entry[cap] ? 'allow' : 'deny';
}

Template.listPermissionsPopup.helpers({
  roles() {
    const list = Template.instance().data;
    const board = list && ReactiveCache.getBoard(list.boardId);
    const rows = BOARD_ROLES.filter(role => role !== 'board-admin')
      .map(role => ({ key: role, label: TAPi18n.__(role) }));
    CustomBoardRoles.find({}, { sort: { name: 1 } }).forEach(role => {
      rows.push({ key: `custom:${role._id}`, label: role.name });
    });
    if (board && (board.permission === 'public' || board.permission === 'instance')) {
      rows.push({ key: SIGNED_IN, label: TAPi18n.__('list-permission-signed-in') });
    }
    return rows;
  },
  capabilities() {
    return LIST_CAPABILITIES;
  },
  capLabel(cap) {
    return TAPi18n.__(cap === 'write' ? 'edit' : 'comment');
  },
  isChoice(role, cap, value) {
    return choiceOf(Template.instance().data, role, cap) === value;
  },
});

Template.listPermissionsPopup.events({
  'click .js-save-list-permissions'(event, tpl) {
    const list = tpl.data;
    const exceptions = {};
    tpl.findAll('select.js-list-permission').forEach(select => {
      if (!select.value) return;
      const role = select.getAttribute('data-role');
      const cap = select.getAttribute('data-cap');
      exceptions[role] = exceptions[role] || {};
      exceptions[role][cap] = select.value === 'allow';
    });
    Meteor.call('lists.setRoleExceptions', list._id, cleanExceptions(exceptions), error => {
      if (error) {
        console.error('lists.setRoleExceptions', error);
        return;
      }
      Popup.back();
    });
  },
});
