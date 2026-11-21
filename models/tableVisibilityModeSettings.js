import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

const TableVisibilityModeSettings = new Mongo.Collection('tableVisibilityModeSettings');

TableVisibilityModeSettings.attachSchema(
  new SimpleSchema({
    _id: {
      type: String,
    },
    booleanValue: {
      type: Boolean,
      optional: true,
    },
    sort: {
      type: Number,
    },
    createdAt: {
      type: Date,
      optional: true,
      autoValue: createdAtAutoValue,
    },
    modifiedAt: {
      type: Date,
      autoValue: modifiedAtAutoValue,
    },
  }),
);

TableVisibilityModeSettings.helpers({
  allowPrivateOnly() {
    return TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly').booleanValue;
  },
});

export default TableVisibilityModeSettings;
