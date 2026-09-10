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

// #2075: broader summary than #3319's sum-only badge, built on the SAME
// mechanism (the board's custom field(s) flagged showSumAtTopOfList=true,
// resolved against a list's - optionally swimlane-scoped - cards). Two more
// pure, unit-testable aggregations sit alongside sumCustomFieldValues():
//
// - numberFieldStats(): for number-type fields, also returns min/max and how
//   many of the cards have ANY of the flagged fields set at all (`count` out
//   of `total`), reusing the exact same numeric-parsing rules as the sum so
//   the two can never disagree about what counts as a value.
// - dateFieldRange(): for a date-type field, the earliest/latest value among
//   the cards, plus the same count/total "how many have it set" figures.
//
// Neither replaces sumCustomFieldValues() - the existing "∑ N" badge and its
// test coverage are untouched - they add detail the caller (listHeader.js)
// can show alongside it (min/max) or use for a different field type (date).

function numberFieldStats(cards, fieldIds) {
  const ids = Array.isArray(fieldIds) ? fieldIds.filter(Boolean) : [];
  const total = Array.isArray(cards) ? cards.length : 0;
  const stats = { count: 0, sum: 0, min: null, max: null, total };
  if (!Array.isArray(cards) || !cards.length || !ids.length) {
    return stats;
  }

  cards.forEach(card => {
    const cfs = (card && card.customFields) || [];
    let cardHasValue = false;
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
        stats.sum += v;
        stats.min = stats.min === null ? v : Math.min(stats.min, v);
        stats.max = stats.max === null ? v : Math.max(stats.max, v);
        cardHasValue = true;
      }
    });
    if (cardHasValue) stats.count += 1;
  });
  return stats;
}

// A date-custom-field value can arrive as a Date, an ISO string, or (rarely)
// a millisecond timestamp - mirrors how the rest of WeKan reads a custom
// field date value. An unparseable value is ignored, same policy as an
// unparseable number above: it must not silently count as "unset" AND must
// not corrupt the range with an invalid date.
function parseDateValue(v) {
  if (v === null || v === undefined || v === '') return null;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  return isNaN(t) ? null : t;
}

function dateFieldRange(cards, fieldIds) {
  const ids = Array.isArray(fieldIds) ? fieldIds.filter(Boolean) : [];
  const total = Array.isArray(cards) ? cards.length : 0;
  const result = { count: 0, earliest: null, latest: null, total };
  if (!Array.isArray(cards) || !cards.length || !ids.length) {
    return result;
  }

  cards.forEach(card => {
    const cfs = (card && card.customFields) || [];
    let cardHasValue = false;
    ids.forEach(fieldId => {
      const cf = cfs.find(f => f && f._id === fieldId);
      if (!cf) return;
      const t = parseDateValue(cf.value);
      if (t === null) return;
      result.earliest = result.earliest === null ? t : Math.min(result.earliest, t);
      result.latest = result.latest === null ? t : Math.max(result.latest, t);
      cardHasValue = true;
    });
    if (cardHasValue) result.count += 1;
  });
  return result;
}

export { sumCustomFieldValues, numberFieldStats, dateFieldRange };
