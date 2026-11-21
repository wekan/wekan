import { Mongo } from 'meteor/mongo';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

// Shared labels (#2761, #4698): the catalogs, written only by site admins
// through server/sharedLabels.js. Rules in models/lib/sharedLabels.js.
const SharedLabels = new Mongo.Collection('sharedLabels');

SharedLabels.attachSchema(new SimpleSchema({
  name: { type: String, optional: true, max: 100 },
  color: { type: String },
  // 'instance', 'org' or 'team'; scopeId is the organization or team.
  scope: { type: String, allowedValues: ['instance', 'org', 'team'] },
  scopeId: { type: String, optional: true },
  sort: { type: Number, optional: true },
  createdAt: {
    type: Date,
    optional: true,
    autoValue: createdAtAutoValue,
  },
  modifiedAt: {
    type: Date,
    optional: true,
    autoValue: modifiedAtAutoValue,
  },
}));

export default SharedLabels;
