// #3319: sum a numeric custom field's values across a set of cards (a list,
// optionally scoped to one swimlane row). Pulled out as a pure function so it
// can be unit-tested without Meteor/Minimongo - it only reads plain card
// objects and a list of numeric-custom-field ids, both already resolved by
// the caller (see numberFieldsSum() in client/components/lists/listHeader.js).
//
// - a card missing the field, or whose value is null/undefined, contributes 0
// - a non-numeric (and non-numeric-string) value is ignored, not treated as 0
//   in a way that would hide a bad value - it simply does not add to the sum
// - an empty card list (or no matching fields) returns 0
function sumCustomFieldValues(cards, fieldIds) {
  const ids = Array.isArray(fieldIds) ? fieldIds.filter(Boolean) : [];
  if (!Array.isArray(cards) || !cards.length || !ids.length) {
    return 0;
  }

  let total = 0;
  cards.forEach(card => {
    const cfs = (card && card.customFields) || [];
    ids.forEach(fieldId => {
      const cf = cfs.find(f => f && f._id === fieldId);
      if (!cf || cf.value === null || cf.value === undefined) return;
      let v = cf.value;
      if (typeof v === 'string') {
        const parsed = parseFloat(v.replace(',', '.'));
        if (isNaN(parsed)) return;
        v = parsed;
      }
      if (typeof v === 'number' && isFinite(v)) {
        total += v;
      }
    });
  });
  return total;
}

export { sumCustomFieldValues };
