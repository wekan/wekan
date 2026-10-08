'use strict';

// #1759: a card's labels when it is moved or copied to another board.
//
// Labels belong to a board, so a card's label ids are remapped by name to the
// destination board's labels. A label the destination board does not have was
// dropped. It is now created there - same name, same colour - when the person
// moving or copying the card may create labels on that board, which is a board
// admin (server/permissions/boards.js); for anybody else the label is still
// dropped, because a move must not do what that user could not do directly.
// Unnamed labels are never created or matched: they cannot be told apart.
//
// Pure: tested by tests/crossBoardLabels.test.cjs.
function planCrossBoardLabels({ sourceLabels, labelIds, destLabels, canCreate, newId }) {
  const src = Array.isArray(sourceLabels) ? sourceLabels : [];
  const ids = Array.isArray(labelIds) ? labelIds : [];
  const dest = Array.isArray(destLabels) ? destLabels : [];
  const byName = new Map();
  for (const label of dest) if (label && label.name && !byName.has(label.name)) byName.set(label.name, label._id);
  const create = [];
  const mapped = [];
  for (const label of src) {
    if (!label || !label.name || !ids.includes(label._id)) continue;
    if (byName.has(label.name)) {
      if (!mapped.includes(byName.get(label.name))) mapped.push(byName.get(label.name));
    } else if (canCreate) {
      const created = { _id: newId(), name: label.name, color: label.color };
      byName.set(label.name, created._id);
      create.push(created);
      mapped.push(created._id);
    }
  }
  return { labelIds: mapped, create };
}

module.exports = { planCrossBoardLabels };
