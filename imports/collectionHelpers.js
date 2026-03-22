/**
 * Collection extensions shim (Meteor 3.4 migration).
 *
 * 1. Ensures aldeed:collection2 (attachSchema) is loaded early
 * 2. Registers SimpleSchema as global
 * 3. Registers denyUpdate/denyInsert as allowed schema extensions
 * 4. Adds Collection.helpers() (previously from dburles:collection-helpers)
 *
 * Import this file early in both client and server entry points.
 */
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';

// Ensure collection2 augments Mongo.Collection.prototype with attachSchema
import 'meteor/aldeed:collection2';

// Set SimpleSchema as global (used by 30+ model files without importing)
if (typeof window !== 'undefined') window.SimpleSchema = SimpleSchema;
else if (typeof global !== 'undefined') global.SimpleSchema = SimpleSchema;

// Register collection2 schema extensions removed from simple-schema v2
SimpleSchema.extendOptions(['denyUpdate', 'denyInsert']);

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
