'use strict';

// #4236 "The processing strategy for the enter key is different". The card
// TITLE textarea submitted on PLAIN Enter (only Shift+Enter made a newline),
// while the card DESCRIPTION textarea — and the shared inlinedForm — insert a
// newline on plain Enter and only submit on Ctrl/Cmd+Enter. That inconsistency
// meant Enter could not add a new line in the title.
//
// isSubmitKey centralizes the "does this keydown submit the editor?" rule so
// every multi-line editor field behaves the same: submit ONLY on Enter together
// with Ctrl or Cmd; plain Enter and Shift+Enter fall through to the textarea
// default (a newline). Meteor-free and unit tested.
function isSubmitKey(event) {
  if (!event) return false;
  const isEnter = event.keyCode === 13 || event.key === 'Enter';
  if (!isEnter) return false;
  return !!(event.ctrlKey || event.metaKey);
}

module.exports = { isSubmitKey };
