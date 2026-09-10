// #2184: optionally copy the parent card's CURRENT labelIds onto a new
// subtask, once, at creation time. This is a ONE-TIME copy, not an ongoing
// sync -- a later change to the parent's labels must never retroactively
// touch a subtask that was already created. Kept as a small pure function so
// it can be unit-tested without a database or a Meteor method call.
export function computeSubtaskLabelIds(parentCard, inheritLabels) {
  if (!inheritLabels) {
    return [];
  }
  const parentLabelIds =
    parentCard && Array.isArray(parentCard.labelIds) ? parentCard.labelIds : [];
  // Copy the array so later mutation of the parent's labelIds (by reference)
  // can never leak into the already-created subtask.
  return [...parentLabelIds];
}

export default computeSubtaskLabelIds;
