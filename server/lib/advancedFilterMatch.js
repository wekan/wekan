// #3092: let a Rule's trigger fire when a card matches the same "Advanced
// Filter" criteria already available in the board's Filter sidebar.
//
// The selector-building algorithm (parenthesised sub-expressions, the
// `field = value` / `!=` / `>` / … comparisons, and `and`/`or`/`not`), AND
// the three resolvers it needs (custom field name -> id, dropdown value ->
// id, date-typed custom field range), are NOT duplicated here: both live
// once, in /imports/lib/advancedFilter.js
// (advancedFilterStringToSelector / buildAdvancedFilterResolversFromCustomFields),
// and both the sidebar (client/lib/filter.js AdvancedFilter class) and this
// module call the same functions. The only thing that differs between the
// two callers is how the custom fields are FETCHED: the sidebar reads them
// (synchronously, on the client) from ReactiveCache; this module pre-fetches
// the board's custom fields once — Meteor 3 collections are async on the
// server — and hands the same plain array to the shared resolver builder, so
// the shared selector-building function itself stays plain, synchronous code
// with no Meteor/ReactiveCache import on either side.
//
// Matching the card against the built selector reuses the real Cards
// collection (`Cards.findOneAsync({ ...selector, _id: card._id })`) rather
// than a hand-rolled in-memory selector matcher — the same Mongo/FerretDB
// query engine the client's minimongo mirrors decides the match, so "does
// this card match the advanced filter" is answered identically here and in
// the sidebar.
import {
  advancedFilterStringToSelector,
  buildAdvancedFilterResolversFromCustomFields,
} from '/imports/lib/advancedFilter';
import CustomFields from '/models/customFields';
import Cards from '/models/cards';

export { buildAdvancedFilterResolversFromCustomFields as buildServerAdvancedFilterResolvers };

/**
 * Evaluate a rule's stored "Advanced Filter" trigger string against a card's
 * CURRENT state (the same criteria language, and the same matching
 * semantics, as the board Filter sidebar's Advanced Filter). Returns false
 * for an empty/unset filter string (nothing to match), and false rather than
 * throwing when the filter string fails to parse (mirrors the sidebar, which
 * falls back to its last valid selector — here there is none yet, so no
 * match).
 */
export async function cardMatchesAdvancedFilter(card, filterString) {
  if (!card || !filterString || !filterString.trim()) return false;
  let selector;
  try {
    const customFields = await CustomFields.find({ boardId: card.boardId }).fetchAsync();
    const resolvers = buildAdvancedFilterResolversFromCustomFields(customFields);
    selector = advancedFilterStringToSelector(filterString, resolvers);
  } catch (e) {
    return false;
  }
  const match = await Cards.findOneAsync({ ...selector, _id: card._id });
  return !!match;
}
