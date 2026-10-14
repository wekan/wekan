// Basque temporal clauses and Thai/Kannada/Malayalam/Latin predicates already contain their verb.
// Thai คือ identifies a noun; it must not precede a passive/action predicate.
// Irish temporal clauses already contain bhíonn.
// Other locales retain the separately translated linking verb.
function ruleTriggerCopula(language, translatedCopula) {
  return /^(?:eu|th|kn|ml|la|ga)(?:[-_]|$)/i.test(String(language || '')) ? '' : translatedCopula;
}
// A Basque named subject ends with its demonstrative (hau).
// Put the name control before that phrase in the DOM, including saved descriptions.
function ruleNameBeforeSubject(language) {
  return /^eu(?:[-_]|$)/i.test(String(language || ''));
}
module.exports = { ruleTriggerCopula, ruleNameBeforeSubject };
