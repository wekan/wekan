import { Mongo } from 'meteor/mongo';
import { incrementCounter } from './counters';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
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
      autoValue: createdAtAutoValue,
    },
    modifiedAt: {
      type: Date,
      autoValue: modifiedAtAutoValue,
    },
  }),
);

export default OrgUser;
