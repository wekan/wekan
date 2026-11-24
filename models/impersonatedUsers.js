import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

const ImpersonatedUsers = new Mongo.Collection('impersonatedUsers');

/**
 * A Impersonated User in wekan
 */
ImpersonatedUsers.attachSchema(
  new SimpleSchema({
    adminId: {
      /**
       * the admin userid that impersonates
       */
      type: String,
      optional: true,
    },
    userId: {
      /**
       * the userId that is impersonated
       */
      type: String,
      optional: true,
    },
    boardId: {
      /**
       * the boardId that was exported by anyone that has sometime impersonated
       */
      type: String,
      optional: true,
    },
    attachmentId: {
      /**
       * the attachmentId that was exported by anyone that has sometime impersonated
       */
      type: String,
      optional: true,
    },
    reason: {
      /**
       * the reason why impersonated, like exportJSON
       */
      type: String,
      optional: true,
    },
    note: {
      /**
       * emergency access only: why, as the administrator wrote it; the other
       * administrators get it by e-mail (models/lib/emergencyAccess.js)
       */
      type: String,
      optional: true,
      max: 500,
    },
    createdAt: {
      /**
       * creation date of the impersonation
       */
      type: Date,
      autoValue: createdAtAutoValue,
    },
    modifiedAt: {
      /**
       * modified date of the impersonation
       */
      type: Date,
      autoValue: modifiedAtAutoValue,
    },
  }),
);

if (Meteor.isServer) {
  // Admin Panel / Problems / Impersonation pages these newest-first and counts
  // them with the same selector (server/publications/impersonationReport.js).
  const { ensureIndex } = require('/server/lib/mongoStartup');
  Meteor.startup(async () => {
    await ensureIndex(ImpersonatedUsers, { createdAt: -1 });
  });
}

export default ImpersonatedUsers;
