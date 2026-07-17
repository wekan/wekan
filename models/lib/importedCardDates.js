// #1992: restore ALL card date fields when importing a WeKan board export.
//
// The exporter (models/exporter.js) dumps full card documents, so an export
// carries createdAt, receivedAt, startAt, dueAt and endAt. The importer
// (models/wekanCreator.js) previously restored only startAt and dueAt, and
// derived createdAt exclusively from a matching `createCard` activity — but
// Sandstorm exports and old/pruned boards often have no such activity, so the
// card's creation date silently reset to the import time ("dates missing" in
// the issue). receivedAt and endAt were dropped for every import.
//
// This module is pure (no Meteor) so it can be unit-tested with plain Node.

/**
 * Parse a date-ish value (ISO string or Date) into a valid Date, or null.
 * Invalid values return null instead of an Invalid Date so a corrupt field in
 * a foreign/hand-edited export can never fail collection2 validation and
 * abort the whole card insert (which would make cards go missing).
 */
function toValidDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Compute the date fields for a card being imported.
 *
 * @param {Object} card the card object from the export
 * @param {String|Date|null} activityCreatedAt creation date recovered from the
 *        export's `createCard` activity, when one exists (takes precedence,
 *        matching the importer's historical behaviour)
 * @param {Date} now fallback timestamp (the import operation's shared date)
 * @returns {{createdAt: Date, receivedAt: ?Date, startAt: ?Date, dueAt: ?Date, endAt: ?Date}}
 */
function importedCardDates(card, activityCreatedAt, now) {
  const fallbackNow =
    now instanceof Date && !isNaN(now.getTime()) ? now : new Date();
  const createdAt =
    toValidDateOrNull(activityCreatedAt) ||
    toValidDateOrNull(card && card.createdAt) ||
    fallbackNow;
  return {
    createdAt,
    receivedAt: toValidDateOrNull(card && card.receivedAt),
    startAt: toValidDateOrNull(card && card.startAt),
    dueAt: toValidDateOrNull(card && card.dueAt),
    endAt: toValidDateOrNull(card && card.endAt),
  };
}

module.exports = { importedCardDates, toValidDateOrNull };
