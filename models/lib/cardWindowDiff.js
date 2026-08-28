function changedFields(previous, current) {
  const changed = {};
  const keys = new Set([...Object.keys(previous), ...Object.keys(current)]);

  keys.delete('_id');
  for (const key of keys) {
    if (!EJSON.equals(previous[key], current[key])) {
      changed[key] = Object.prototype.hasOwnProperty.call(current, key)
        ? current[key]
        : undefined;
    }
  }

  return changed;
}

function diffCardWindow(previousCards, currentCards) {
  const previous = new Map(previousCards.map(card => [card._id, card]));
  const current = new Map(currentCards.map(card => [card._id, card]));
  const added = [];
  const changed = [];
  const removed = [];

  for (const card of currentCards) {
    const oldCard = previous.get(card._id);
    if (!oldCard) {
      added.push(card);
      continue;
    }

    const fields = changedFields(oldCard, card);
    if (Object.keys(fields).length > 0) changed.push({ _id: card._id, fields });
  }

  for (const card of previousCards) {
    if (!current.has(card._id)) removed.push(card._id);
  }

  return { added, changed, removed };
}

module.exports = { diffCardWindow };
