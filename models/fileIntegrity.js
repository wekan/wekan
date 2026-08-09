import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

// ============================================================================
// The filesystem storage BASELINE (design: docs/Security/Remediation/WeKan.md §13).
//
// One document per stored file: what it was called, how big it was, when it was
// last modified, its md5/sha256/sha512, and an ed25519 signature over all of
// that. server/lib/fileIntegrityScan.js writes it and re-checks it once a day.
//
// In the EXISTING WeKan database, like every other part of this subsystem - no
// new files under WRITABLE_PATH, nothing extra to back up or to forget to back
// up, and it works the same on FerretDB and MongoDB.
//
// Deliberately NOT schema-attached: `digests` is a small open map, and the point
// of this collection is to be a faithful record of what was observed rather than
// something a schema might quietly clean fields out of - which is exactly the
// bug that once emptied the database-problems rows (models/eventLog.js).
// ============================================================================

const FileIntegrity = new Mongo.Collection('fileIntegrity');

// The signing key, and the scan's own bookkeeping (when it last ran). Separate
// from the baseline so a full re-baseline never touches the key.
export const IntegrityKeys = new Mongo.Collection('fileIntegrityKeys');

if (Meteor.isServer) {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  Meteor.startup(async () => {
    // The scan reads by _id (the path) and sweeps by `at`.
    await ensureIndex(FileIntegrity, { at: -1 });
  });

  // NEVER published. The baseline is a map of every file on the server and the
  // key document is a private key; neither has any business on a client, not
  // even an admin's. Admin Panel reads the FINDINGS, which are ordinary event
  // log rows, not this.
  FileIntegrity.deny({
    insert: () => true,
    update: () => true,
    remove: () => true,
  });
  IntegrityKeys.deny({
    insert: () => true,
    update: () => true,
    remove: () => true,
  });
}

export default FileIntegrity;
