// Pure helper used by the Cards.before.update hook to detect a card description
// change. Extracted so the description-change activity logic (issue #5482) can be
// unit-tested without the Meteor/Mongo collection machinery.
//
// Returns true only when the update modifier sets `description` to a value that
// differs from the current document's description. This mirrors how sibling
// tracked fields (e.g. title, dueAt) are detected in the before.update hook, so
// the existing Activities.after.insert outgoing-webhook hook fires on description
// changes too. Empty-to-empty saves (e.g. '' -> '' or missing -> '') are treated
// as no-ops and do NOT emit.
export function descriptionChanged(oldDoc, modifier) {
  if (!modifier || !modifier.$set || !('description' in modifier.$set)) {
    return false;
  }
  const oldDescription = (oldDoc && oldDoc.description) || '';
  const newDescription = modifier.$set.description || '';
  return newDescription !== oldDescription;
}
