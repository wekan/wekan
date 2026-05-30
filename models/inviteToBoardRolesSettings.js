import { Mongo } from 'meteor/mongo';
const { SimpleSchema } = require('/imports/simpleSchema');

// All board-member role keys that a global admin may grant the "invite to
// board" capability to. Order is the display order in the Admin Panel / People
// / Roles tab. NOTE: these are BOARD-level roles, deliberately kept distinct
// from the global site-admin flag `user.isAdmin`. 'board-admin' is the board
// administrator role; 'normal' is a plain member with no restriction flags.
export const INVITE_TO_BOARD_ROLES = [
  'board-admin',
  'normal',
  'worker',
  'comment-only',
  'no-comments',
  'normal-assigned-only',
  'comment-assigned-only',
  'read-only',
  'read-assigned-only',
];

// The single settings document id.
export const INVITE_TO_BOARD_ROLES_ID = 'inviteToBoardRoles';

// Secure default: only board admins and plain normal members may invite.
export const INVITE_TO_BOARD_ROLES_DEFAULT = ['board-admin', 'normal'];

const InviteToBoardRolesSettings = new Mongo.Collection('inviteToBoardRolesSettings');

InviteToBoardRolesSettings.attachSchema(
  new SimpleSchema({
    _id: {
      type: String,
    },
    allowedRoles: {
      type: Array,
      optional: true,
    },
    'allowedRoles.$': {
      type: String,
      allowedValues: INVITE_TO_BOARD_ROLES,
    },
    sort: {
      type: Number,
      optional: true,
    },
    createdAt: {
      type: Date,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
  }),
);

InviteToBoardRolesSettings.helpers({
  isRoleAllowed(role) {
    return (this.allowedRoles || []).includes(role);
  },
});

// Returns the configured set of allowed roles, falling back to the secure
// default if the settings document does not exist yet.
InviteToBoardRolesSettings.allowedRoles = async function() {
  const doc = await InviteToBoardRolesSettings.findOneAsync(INVITE_TO_BOARD_ROLES_ID);
  return (doc && doc.allowedRoles) || INVITE_TO_BOARD_ROLES_DEFAULT;
};

export default InviteToBoardRolesSettings;
