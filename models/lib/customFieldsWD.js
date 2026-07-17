'use strict';

// #3748: match a card's `customFields` entries to the custom-field definitions
// attached to the card's CURRENT board ("customFields With Definitions").
//
// Linked cards are by design pointers that mirror the original card; labels and
// custom-field DEFINITIONS are board-scoped, so they are deliberately not
// inherited across boards (that remapping-by-name behaviour belongs to the
// COPY path — Cards.copy()/mapCustomFieldsToBoard — not to links). However,
// Cards.link() deep-copies the original document, so a cross-board linked card
// carries a `customFields` snapshot whose definition ids do not exist on the
// viewing board. The old customFieldsWD() returned an empty `{}` placeholder
// for every unmatched entry, which rendered a phantom empty row in the card
// details and made the `cardCustomField` template's getTemplate() helper throw
// "TypeError: Cannot read properties of undefined (reading 'type')" on every
// render. Unmatched entries must be SKIPPED instead.

// A dropdown custom field stores the selected item's id as `value`; the
// human-readable "true value" is the matching dropdown item's name. Any other
// field type (or an id that no longer matches an item) keeps the raw value.
function resolveTrueValue(definition, value) {
  const items =
    definition && definition.settings && definition.settings.dropdownItems;
  if (Array.isArray(items)) {
    for (const item of items) {
      if (item && item._id === value) {
        return item.name;
      }
    }
  }
  return value;
}

// customFields: the card's own `customFields` array ([{_id, value}, ...]).
// definitions: the CustomFields definitions attached to the card's board.
// Returns [{_id, value, trueValue, definition}, ...] sorted by definition
// name, with entries whose definition is not on this board left out.
function buildCustomFieldsWD(customFields, definitions) {
  if (!Array.isArray(customFields) || !Array.isArray(definitions)) {
    return [];
  }
  const ret = [];
  for (const customField of customFields) {
    if (!customField) {
      continue;
    }
    const definition = definitions.find(
      def => def && def._id === customField._id,
    );
    if (!definition) {
      // e.g. a linked card's snapshot from the original board, or a definition
      // that was deleted / detached from this board.
      continue;
    }
    ret.push({
      _id: customField._id,
      value: customField.value,
      trueValue: resolveTrueValue(definition, customField.value),
      definition,
    });
  }
  ret.sort((a, b) => {
    const aName = a.definition.name;
    const bName = b.definition.name;
    if (aName === undefined || bName === undefined) {
      return 0;
    }
    return aName.localeCompare(bName);
  });
  return ret;
}

module.exports = { buildCustomFieldsWD, resolveTrueValue };
