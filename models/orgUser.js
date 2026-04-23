import { Mongo } from 'meteor/mongo';
import { incrementCounter } from './counters';
const { SimpleSchema } = require('/imports/simpleSchema');

const OrgUser = new Mongo.Collection('orgUser');

/**
 * A Organization User in wekan
 */
OrgUser.attachSchema(
  new SimpleSchema({
    _id: {
      /**
       * the organization user's id
       */
      type: Number,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return incrementCounter('orgUserId', 1);
        }
      },
    },
    orgId: {
      /**
       * the organization id
       */
      type: Number,
      optional: true,
    },
    userId: {
      /**
       * the user id
       */
      type: Number,
      optional: true,
    },
    role: {
      /**
       * the role of user
       */
      type: String,
      optional: true,
      max: 20,
    },
    createdAt: {
      /**
       * creation date of the organization user
       */
      type: Date,
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

export default OrgUser;
