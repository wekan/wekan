import { Mongo } from 'meteor/mongo';
const { SimpleSchema } = require('/imports/simpleSchema');

// Custom board roles (#3022): named roles an administrator builds in Admin
// Panel / People / Roles from the capability matrix in
// models/lib/boardRoleCapabilities.js (CUSTOM_ROLE_CAPABILITIES). A board
// member is given one by board admin, like a built-in role, and carries its id
// in `customRoleId` - plus, in the old per-role flags, the strongest built-in
// role that grants nothing more (fallbackRoleFor), so code that still reads a
// flag never grants more than the custom role does.
//
// Only site admins write this collection, and only through the methods in
// server/customBoardRoles.js. Every signed-in user reads it: a role's name and
// what it may do are what the board shows its members.

export const CUSTOM_ROLE_NAME_MAX = 60;

const CustomBoardRoles = new Mongo.Collection('customBoardRoles');

CustomBoardRoles.attachSchema(
  new SimpleSchema({
    name: {
      type: String,
      min: 1,
      max: CUSTOM_ROLE_NAME_MAX,
    },
    capabilities: {
      type: Object,
      blackbox: true,
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
      optional: true,
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

export default CustomBoardRoles;
