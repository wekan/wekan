// Pure helper shared by the comment / description editor key handling.
//
// Regression #3289 / #4172 / #5457: when the @mention (or other textcomplete)
// autocomplete dropdown is open, pressing Enter should SELECT the highlighted
// suggestion, not submit the comment / close the card. This helper centralises
// that single decision so it can be unit-tested without a DOM.
//
// Returns true when an Enter keypress should be allowed to submit the form
// (i.e. the autocomplete dropdown is NOT open), and false when Enter must be
// captured by the autocomplete to pick the highlighted suggestion.
export function shouldSubmitOnEnter({ autocompleteOpen } = {}) {
  return !autocompleteOpen;
}
