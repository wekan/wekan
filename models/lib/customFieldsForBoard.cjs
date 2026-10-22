'use strict';

// #6800: the custom field values a NEW card may carry onto `boardId` - only
// values for fields defined on that board.
//
// A card copied, made from a card template, linked from another board, or a
// subtask copied with it, took its whole customFields array along: values of
// another board's fields, of deleted fields, and entries with no field id at all
// (old imports). The admin-only field guard (server/lib/adminOnlyCustomFields.js)
// cannot match such a value to a field of the new card's board, so it refused
// the whole card and recorded an AdminFieldBleed event against the user, who only
// saw that no card appeared. Such a value cannot be shown on the new card anyway.
//
// getDefinition(fieldId) -> { boardIds } | null, read as it is NOW: the copy may
// have just shared the field with the destination board (mapCustomFieldsToBoard).
async function customFieldsForBoard(customFields, boardId, getDefinition) {
  if (!Array.isArray(customFields) || !boardId) return [];
  const kept = [];
  for (const field of customFields) {
    if (!field || typeof field._id !== 'string' || !field._id) continue;
    const definition = await getDefinition(field._id);
    if (definition && Array.isArray(definition.boardIds) && definition.boardIds.includes(boardId)) kept.push(field);
  }
  return kept;
}

module.exports = { customFieldsForBoard };
