import { MongoInternals } from 'meteor/mongo';

// TEMPORARY DIAGNOSTIC (Sandstorm .spk / FerretDB).
//
// The Sandstorm grain runs on FerretDB, which is stricter than MongoDB and rejects
// some queries (e.g. "unknown operator: userId", BadValue) that MongoDB accepts.
// The driver stack trace does not include the WeKan call site, so this patch wraps
// the raw mongodb Collection.find() to log the collection name + the exact selector
// whenever a cursor iteration throws. That pinpoints the offending query so it can
// be rewritten FerretDB-compatibly, after which this file can be removed.
Meteor.startup(() => {
  try {
    const CollProto =
      MongoInternals &&
      MongoInternals.NpmModule &&
      MongoInternals.NpmModule.Collection &&
      MongoInternals.NpmModule.Collection.prototype;
    if (!CollProto || typeof CollProto.find !== 'function') {
      console.error('** ferretdbQueryDebug: could not locate mongodb Collection.prototype.find; skipping.');
      return;
    }

    const logErr = (collName, filter, err) => {
      let selector;
      try { selector = JSON.stringify(filter); } catch (_) { selector = String(filter); }
      console.error(
        '** FerretDB/Mongo query error on collection "%s": %s\n   selector: %s',
        collName, (err && err.message) || err, selector,
      );
    };

    const origFind = CollProto.find;
    CollProto.find = function(filter, options) {
      const cursor = origFind.call(this, filter, options);
      const collName = this.collectionName;
      for (const m of ['toArray', 'next', 'hasNext', 'forEach', 'tryNext']) {
        const orig = cursor[m];
        if (typeof orig !== 'function') continue;
        cursor[m] = function(...args) {
          let r;
          try {
            r = orig.apply(this, args);
          } catch (err) {
            logErr(collName, filter, err);
            throw err;
          }
          if (r && typeof r.then === 'function') {
            return r.catch(err => { logErr(collName, filter, err); throw err; });
          }
          return r;
        };
      }
      return cursor;
    };
    console.log('** ferretdbQueryDebug: query-error diagnostic installed.');
  } catch (e) {
    console.error('** ferretdbQueryDebug: install failed:', (e && e.message) || e);
  }
});
