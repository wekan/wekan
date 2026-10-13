// Record an email problem in Admin Panel -> Problems -> Email
// (models/lib/mailProblems.js). Never throws: recording that a send failed
// must not turn into a second failure.
const { mailProblemEvent } = require('/models/lib/mailProblems');

function recordMailProblem(kind, info = {}) {
  try {
    const evt = mailProblemEvent(kind, info);
    if (!evt) return;
    const { foldEventFireAndForget } = require('/server/lib/eventLogFold');
    foldEventFireAndForget(evt, 'mailProblems');
  } catch (e) {
    // logging must never break the mail path
  }
}

module.exports = { recordMailProblem };
