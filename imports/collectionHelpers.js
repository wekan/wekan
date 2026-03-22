/**
 * Collection extensions shim (Meteor 3.4 migration).
 *
 * CRITICAL: This file must use ONLY require() — NO import statements.
 * import statements are hoisted and can trigger evaluation chains that
 * reach model files (via reactiveCache → i18n → translation.js) BEFORE
 * collection2 has patched Mongo.Collection.prototype.attachSchema.
 *
 * With require(), each call completes synchronously before the next,
 * guaranteeing this execution order:
 *   1. Mongo loaded
 *   2. SimpleSchema loaded + set as global
 *   3. collection2 loaded (patches attachSchema onto Mongo.Collection)
 *   4. Collection.helpers() shim installed
 *
 * Only THEN can model files safely call attachSchema/helpers.
 */

const { Mongo } = require('meteor/mongo');

// Load SimpleSchema and set as global (used by 30+ model files without importing)
const SimpleSchema = require('meteor/aldeed:simple-schema').default;
if (typeof window !== 'undefined') window.SimpleSchema = SimpleSchema;
else if (typeof global !== 'undefined') global.SimpleSchema = SimpleSchema;

// Register collection2 schema extensions removed from simple-schema v2
SimpleSchema.extendOptions(['denyUpdate', 'denyInsert']);

// Ensure collection2 augments Mongo.Collection.prototype with attachSchema
require('meteor/aldeed:collection2');

// Shim for dburles:collection-helpers (removed — absorbed into Meteor 3.4 core)
if (!Mongo.Collection.prototype.helpers) {
  Mongo.Collection.prototype.helpers = function (helpers) {
    if (this._transform && !this._helpers)
      throw new Meteor.Error(
        "Can't apply helpers to '" +
          this._name +
          "' a transform function already exists!",
      );

    if (!this._helpers) {
      this._helpers = function Document(doc) {
        return Object.assign(this, doc);
      };
      this._transform = (doc) => new this._helpers(doc);
    }

    Object.keys(helpers).forEach(
      (key) => (this._helpers.prototype[key] = helpers[key]),
    );
  };
}
