/**
 * Shim for dburles:collection-helpers (removed in Meteor 3.4 migration).
 * Adds Collection.helpers() method that attaches helper functions to
 * documents retrieved from the collection via the transform option.
 *
 * Import this file early in both client and server entry points.
 */
import { Mongo } from 'meteor/mongo';

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
