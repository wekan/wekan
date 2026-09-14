// Basque temporal clauses and Thai predicates already contain their verb.
// Thai คือ identifies a noun; it must not precede a passive/action predicate.
// Other locales retain the separately translated linking verb.
function ruleTriggerCopula(language, translatedCopula) {
  return /^(?:eu|th)(?:[-_]|$)/i.test(String(language || '')) ? '' : translatedCopula;
}
module.exports = { ruleTriggerCopula };
