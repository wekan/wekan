#!/usr/bin/env node
// database-choose.mjs — which of two databases the snap should serve, decided from
// what is IN them rather than from a file timestamp, and what to bring across from
// the other one so nothing is lost.
//
// WHY THIS EXISTS. #6583 and #6585 are the same accident from opposite ends: a
// snap serving a copy of its own data instead of the data. The guards that came
// out of them (bin/ferretdb-migration-stale) answer from mtimes, and an mtime
// cannot tell "somebody used this database" from "this database was started" - so
// when BOTH copies have been written to since the migration, that guard says
// AMBIGUOUS and the admin was left to start each database by hand twice and
// look at the boards each time. Most people never see that message: it is in
// `snap logs`, and their site is meanwhile showing the wrong copy.
//
// A timestamp says when a file was touched. The DATA says what is in it, and both
// copies can be read - so ask them (bin/db-eval.mjs `evidence`): how many
// documents each collection holds, and the newest moment any document carries.
//
// THE DECISION, in the order it is made:
//
//   nothing to compare      one side unreadable or empty -> the other one, if it
//                           has anything at all
//   one is a superset       it has at least as many documents everywhere AND its
//                           newest data is not older -> serve it; there is
//                           nothing on the other side that is not also here
//   one is clearly newer    both hold documents the other does not, but one has
//                           the newer data -> serve THAT one, and merge what is
//                           missing from the other into it (insert-only)
//   too close to call       the newest moments are within a margin of each other,
//                           or there is no timestamp anywhere -> decide nothing,
//                           keep the current setting, show the explanation
//
// WHAT "MERGE" MEANS HERE, and what it deliberately does not mean. Only documents
// whose _id is ABSENT from the chosen database are inserted; nothing that is there
// is ever overwritten or deleted, and the other database is left on disk exactly
// as it was. So a card edited on both sides keeps the version in the copy being
// served - the newer one - and a card that only ever existed on the other side is
// added rather than lost. WeKan keeps its own history (the activities collection
// and the card's Activity feed), and those records merge the same way, so the work
// done on the copy that is not being served is still readable in the card's
// history instead of being stranded in a database nobody opens.
//
// A three-way merge of two divergent databases - reconciling two edits of one
// field - is NOT attempted, and never will be from a script: that is a choice
// about somebody's work, and the ambiguous branch keeps handing it to a person.
//
// Pure: no I/O, no Meteor, no driver. The evidence comes in as data and the
// decision goes out as data, so tests/snapDatabaseChoice.test.cjs can exercise
// every shape (and bin/database-autopick does the running-around).
//
// Usage:  database-choose.mjs '<mongodb-evidence-json>' '<ferretdb-evidence-json>'
// Prints: JSON { choice, reason, merge, detail }
//   choice  'mongodb' | 'ferretdb' | null   (null = decide nothing)
//   merge   'mongodb' | 'ferretdb' | null   which one to copy missing documents FROM

// Collections whose documents are worth carrying across. The history ones are
// first on purpose: they are append-only, so merging them can only add to what a
// card's Activity feed shows.
const MERGE_COLLECTIONS = [
  'activities', 'card_comments', 'cards', 'checklists', 'checklistItems',
  'lists', 'swimlanes', 'boards', 'attachments', 'users', 'customFields',
  // History.md §9a: append-only rows are what make two copies of a database
  // mergeable, and this list is the only place the snap learns which
  // collections carry them. Added the moment the collection existed, as §9a.4
  // requires - a history row written on the copy that is not served is work
  // that would otherwise be stranded in a database nobody opens.
  'changeHistory', 'userPositionHistory',
];

// How close two "newest data" moments have to be before the difference stops
// meaning anything. The migration itself writes on both sides within a few
// minutes of each other, and a database that is merely started can log a session
// document - so a few hours of daylight is what makes "clearly newer" a fact
// rather than a coin toss.
const NEWER_BY_MS = 6 * 60 * 60 * 1000;

function isEvidence(value) {
  return !!value && typeof value === 'object' && value.counts && typeof value.counts === 'object';
}

function totalDocuments(evidence) {
  if (!isEvidence(evidence)) return 0;
  return Object.values(evidence.counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

// Does `a` hold at least as many documents as `b` in every collection they name?
function coversEverywhere(a, b) {
  const names = new Set([...Object.keys(a.counts), ...Object.keys(b.counts)]);
  for (const name of names) {
    const inA = Number(a.counts[name]) || 0;
    const inB = Number(b.counts[name]) || 0;
    if (inA < inB) return false;
  }
  return true;
}

function newestOf(evidence) {
  if (!isEvidence(evidence)) return null;
  // `Number(null)` is 0, not NaN, and 0 is a real moment (1970) - so a database
  // with NO timestamp at all would have compared as the oldest one imaginable and
  // lost every comparison. "There is nothing to compare" has to stay its own
  // answer, which is what the no-timestamps branch below is for.
  const raw = evidence.newest;
  if (raw === null || raw === undefined || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function chooseDatabase(mongodb, ferretdb, options = {}) {
  const margin = Number.isFinite(options.newerByMs) ? options.newerByMs : NEWER_BY_MS;
  const mongoDocs = totalDocuments(mongodb);
  const ferretDocs = totalDocuments(ferretdb);
  const mongoOk = isEvidence(mongodb) && mongoDocs > 0;
  const ferretOk = isEvidence(ferretdb) && ferretDocs > 0;

  // Nothing to compare. One database holding everything is not a choice.
  if (!mongoOk && !ferretOk) {
    return { choice: null, merge: null, reason: 'no-data',
      detail: 'Neither database could be read, or both are empty.' };
  }
  if (!ferretOk) {
    return { choice: 'mongodb', merge: null, reason: 'only-one-has-data',
      detail: `Only MongoDB holds data (${mongoDocs} documents).` };
  }
  if (!mongoOk) {
    return { choice: 'ferretdb', merge: null, reason: 'only-one-has-data',
      detail: `Only FerretDB holds data (${ferretDocs} documents).` };
  }

  const mongoNewest = newestOf(mongodb);
  const ferretNewest = newestOf(ferretdb);
  const mongoCovers = coversEverywhere(mongodb, ferretdb);
  const ferretCovers = coversEverywhere(ferretdb, mongodb);

  // One holds everything the other holds, and is not the older of the two.
  // Serving it loses nothing, and there is nothing to merge.
  if (mongoCovers && !ferretCovers
      && (mongoNewest === null || ferretNewest === null || mongoNewest >= ferretNewest)) {
    return { choice: 'mongodb', merge: null, reason: 'superset',
      detail: `MongoDB holds at least as many documents as FerretDB in every collection (${mongoDocs} vs ${ferretDocs}).` };
  }
  if (ferretCovers && !mongoCovers
      && (ferretNewest === null || mongoNewest === null || ferretNewest >= mongoNewest)) {
    return { choice: 'ferretdb', merge: null, reason: 'superset',
      detail: `FerretDB holds at least as many documents as MongoDB in every collection (${ferretDocs} vs ${mongoDocs}).` };
  }

  // Identical counts everywhere and no timestamp to separate them: the two are
  // the same database as far as anything here can tell, so changing the setting
  // would be churn.
  if (mongoNewest === null || ferretNewest === null) {
    return { choice: null, merge: null, reason: 'no-timestamps',
      detail: 'Neither database carries a timestamp to compare, and neither covers the other.' };
  }

  const difference = Math.abs(mongoNewest - ferretNewest);
  if (difference < margin) {
    return { choice: null, merge: null, reason: 'too-close',
      detail: `The newest data on each side is within ${Math.round(difference / 60000)} minute(s) of the other, which is not enough to tell them apart.` };
  }

  // Both hold work the other does not, and one of them is clearly the one in use.
  // Serve that one and add what only exists on the other side - inserting what is
  // missing, overwriting nothing.
  const newer = mongoNewest > ferretNewest ? 'mongodb' : 'ferretdb';
  const older = newer === 'mongodb' ? 'ferretdb' : 'mongodb';
  const hours = Math.round(difference / 3600000);
  return {
    choice: newer,
    merge: older,
    reason: 'newer-with-merge',
    detail: `${newer === 'mongodb' ? 'MongoDB' : 'FerretDB'} holds the newer data (by about ${hours} hour(s)); `
      + `documents that exist only in ${older === 'mongodb' ? 'MongoDB' : 'FerretDB'} are copied into it, and nothing there is overwritten.`,
  };
}

export { chooseDatabase, MERGE_COLLECTIONS, NEWER_BY_MS, totalDocuments, coversEverywhere };

// CLI: two evidence documents in, one decision out.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const parse = (raw) => { try { return JSON.parse(raw); } catch { return null; } };
  const decision = chooseDatabase(parse(process.argv[2]), parse(process.argv[3]));
  console.log(JSON.stringify(decision));
  process.exit(decision.choice ? 0 : 1);
}
