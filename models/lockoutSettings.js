import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');
const { KNOWN_DEFAULTS, UNKNOWN_DEFAULTS, configFromMap } = require('/models/lib/lockoutConfig');

const LockoutSettings = new Mongo.Collection('lockoutSettings');

LockoutSettings.attachSchema(
  new SimpleSchema({
    _id: {
      type: String,
    },
    value: {
      type: Number,
    },
    category: {
      type: String,
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

LockoutSettings.helpers({
  // Both read through models/lib/lockoutConfig.js, the one list of the
  // lockout's settings and their defaults that the server's startup and the
  // Admin Panel's reload read too.
  getKnownConfig() {
    return configFromMap('known', settingsMap(Object.keys(KNOWN_DEFAULTS).map(k => `known-${k}`)));
  },
  getUnknownConfig() {
    return configFromMap('unknown', settingsMap(Object.keys(UNKNOWN_DEFAULTS).map(k => `unknown-${k}`)));
  },
});

// { id: value } of the given settings, in one query.
function settingsMap(ids) {
  const map = {};
  LockoutSettings.find({ _id: { $in: ids } }, { fields: { _id: 1, value: 1 } })
    .fetch().forEach(s => { map[s._id] = s.value; });
  return map;
}

export default LockoutSettings;
