// A card's or a board's spentTime is a Number, and time is added to it with
// $inc (models/cards.js addSpentTime, server/timeEntries.js): an $inc adds to
// what the server has, whatever the client has seen.
//
// #6940: MongoDB and FerretDB both refuse an $inc on a field that holds null -
// "Cannot apply $inc to a value of non-numeric type" - and the board import
// stored every card without logged time as spentTime: null (429,620 cards on
// one migrated server), so logging time on any of them failed. An update
// pipeline with $ifNull would avoid it on MongoDB, but FerretDB v1, Minimongo
// and the allow/deny mutators accept only operator documents, so the fix is
// made where the stored value is known: the Cards and Boards before.update
// hooks hand the modifier and the stored document to this function, and an
// $inc of a field that is not a number becomes the $set of the sum, counting
// what is stored as 0. A missing field is left to $inc, which starts it at
// the amount on its own.
//
// Pure, no Meteor imports, so tests/spentTimeNullSafe.test.cjs can run it.

const NUMERIC_TIME_FIELDS = ['spentTime'];

function storedNumber(value) {
  const n = Number(value);
  return value !== null && typeof value !== 'boolean' && Number.isFinite(n) ? n : 0;
}

// Rewrites `modifier` in place and returns the names of the fields it moved
// from $inc to $set. Nothing is changed when the stored value is a number, the
// field is absent, the amount is not a number, or $set already names it.
function nullSafeTimeIncrement(doc, modifier, fields = NUMERIC_TIME_FIELDS) {
  const moved = [];
  if (!doc || !modifier || !modifier.$inc || typeof modifier.$inc !== 'object') return moved;
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(modifier.$inc, field)) continue;
    if (!Object.prototype.hasOwnProperty.call(doc, field)) continue;
    const stored = doc[field];
    if (typeof stored === 'number') continue;
    const amount = modifier.$inc[field];
    if (typeof amount !== 'number' || !Number.isFinite(amount)) continue;
    if (modifier.$set && Object.prototype.hasOwnProperty.call(modifier.$set, field)) continue;
    modifier.$set = Object.assign(modifier.$set || {}, { [field]: storedNumber(stored) + amount });
    delete modifier.$inc[field];
    moved.push(field);
  }
  if (moved.length && Object.keys(modifier.$inc).length === 0) delete modifier.$inc;
  return moved;
}

module.exports = { NUMERIC_TIME_FIELDS, nullSafeTimeIncrement, storedNumber };
