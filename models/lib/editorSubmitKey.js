'use strict';

// #4236 "The processing strategy for the enter key is different". The card
// TITLE textarea submitted on PLAIN Enter (only Shift+Enter made a newline),
// while the card DESCRIPTION textarea — and the shared inlinedForm — insert a
// newline on plain Enter and only submit on Ctrl/Cmd+Enter. That inconsistency
// meant Enter could not add a new line in the title.
//
// isSubmitKey centralizes the "does this keydown submit the editor?" rule so
// every multi-line editor field behaves the same.
//
// Default (submitOnEnter off): submit ONLY on Enter together with Ctrl or Cmd;
// plain Enter and Shift+Enter fall through to the textarea default (a newline).
//
// Opt-in per-user setting (submitOnEnter on, Member Settings): plain Enter
// submits and Shift+Enter inserts a newline — restoring the pre-#4236 fast
// title-editing workflow for users who prefer it, without affecting anyone else.
//
// Meteor-free and unit tested. The caller passes the current user's preference
// as opts.submitOnEnter so this stays a pure function.
function isSubmitKey(event, opts = {}) {
  if (!event) return false;
  const isEnter = event.keyCode === 13 || event.key === 'Enter';
  if (!isEnter) return false;
  if (opts.submitOnEnter) {
    // plain Enter submits; Shift+Enter is a newline (Ctrl/Cmd+Enter also submits)
    return !event.shiftKey;
  }
  return !!(event.ctrlKey || event.metaKey);
}

module.exports = { isSubmitKey };
