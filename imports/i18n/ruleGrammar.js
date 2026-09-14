// Basque trigger actions contain their own finite verb and temporal clause.
// Other locales retain the separately translated linking verb.
function ruleTriggerCopula(language, translatedCopula) {
  return /^eu(?:[-_]|$)/i.test(String(language || '')) ? '' : translatedCopula;
}
module.exports = { ruleTriggerCopula };
