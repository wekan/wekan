/**
 * Collection extensions shim (Meteor 3.4 migration).
 *
 * This module only patches collection prototype helpers that older app code
 * still relies on. SimpleSchema now lives in `/imports/simpleSchema`.
 */
const MeteorPackage = typeof Package !== 'undefined' ? Package.meteor : undefined;
const MongoPackage = typeof Package !== 'undefined' ? Package.mongo : undefined;
const CollectionHooksPackage =
  typeof Package !== 'undefined' ? Package['matb33:collection-hooks'] : undefined;
const Meteor = MeteorPackage && MeteorPackage.Meteor;
const Mongo = MongoPackage && MongoPackage.Mongo;
const CollectionHooks = CollectionHooksPackage && CollectionHooksPackage.CollectionHooks;

if (Mongo && Mongo.Collection && Mongo.Collection.prototype && !Mongo.Collection.prototype.helpers) {
  Mongo.Collection.prototype.helpers = function helpers(helpersMap) {
    if (this._transform && !this._helpersConstructor) {
      throw new Error(
        `Can't apply helpers to '${this._name}': a transform function already exists.`,
      );
    }

    if (!this._helpersConstructor) {
      this._helpersConstructor = function CollectionDocument(doc) {
        Object.assign(this, doc);
      };
      this._transform = doc => new this._helpersConstructor(doc);
    }

    Object.keys(helpersMap).forEach(key => {
      this._helpersConstructor.prototype[key] = helpersMap[key];
    });
  };
}

if (Mongo && Mongo.Collection && Mongo.Collection.prototype && !Mongo.Collection.prototype.attachSchema) {
  Mongo.Collection.prototype.attachSchema = function attachSchema(schema) {
    if (schema && schema._schemaDefinition) {
      schema._schema = schema._schemaDefinition;
    }
    this._simpleSchema = schema;
    return this;
  };
}

if (Mongo && Mongo.Collection && Mongo.Collection.prototype && !Mongo.Collection.prototype.simpleSchema) {
  Mongo.Collection.prototype.simpleSchema = function simpleSchema() {
    return this._simpleSchema;
  };
}

if (Mongo && Mongo.Collection && CollectionHooks && !Mongo.Collection._wekanHookBootstrapPatched) {
  const OriginalCollection = Mongo.Collection;
  const originalExtendCollectionInstance = CollectionHooks.extendCollectionInstance;

  function ensureHookSurface(collection, constructor) {
    if (!collection || collection._wekanHookSurfaceReady) {
      return collection;
    }

    const safeConstructor =
      constructor && constructor.prototype ? constructor : OriginalCollection;

    if (
      Meteor &&
      Meteor.isServer &&
      (!collection._collection ||
        typeof collection._collection.insertAsync !== 'function' ||
        typeof collection._collection.updateAsync !== 'function' ||
        typeof collection._collection.removeAsync !== 'function')
    ) {
      Object.defineProperty(collection, '_collection', {
        value: collection,
        configurable: true,
        enumerable: false,
        writable: true,
      });
    }

    originalExtendCollectionInstance.call(CollectionHooks, collection, safeConstructor);
    Object.defineProperty(collection, '_wekanHookSurfaceReady', {
      value: true,
      configurable: true,
      enumerable: false,
      writable: true,
    });
    return collection;
  }

  CollectionHooks.extendCollectionInstance = function extendCollectionInstance(collection, constructor) {
    return ensureHookSurface(collection, constructor);
  };

  function PatchedCollection(...args) {
    const ret = OriginalCollection.apply(this, args);
    const collection =
      ret && typeof ret === 'object' ? ret : this;

    ensureHookSurface(collection, OriginalCollection);
    return ret;
  }

  PatchedCollection.prototype = OriginalCollection.prototype;
  PatchedCollection.prototype.constructor = PatchedCollection;

  Object.keys(OriginalCollection).forEach(key => {
    PatchedCollection[key] = OriginalCollection[key];
  });

  Object.defineProperty(PatchedCollection, '_wekanHookBootstrapPatched', {
    value: true,
    configurable: true,
    enumerable: false,
    writable: true,
  });

  Mongo.Collection = PatchedCollection;
  if (Meteor) {
    Meteor.Collection = PatchedCollection;
  }
}

module.exports = {};
