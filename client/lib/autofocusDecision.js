// Which element, if any, client/lib/autofocus.js may focus after the DOM changed.
//
// It used to focus the LAST [autofocus] element anywhere in the document, and
// select its text, whenever any added node contained one - also while somebody
// was typing in another field. On the import page that moved focus from the
// attachment token field to the pasted JSON, all of it selected, and the next
// keys typed replaced the JSON (import-attachment-auth.e2e.js: the textarea
// held only the token, and the import said "Your text is not valid JSON").
//
// Now only an [autofocus] element that was itself just added is a candidate,
// and focus is never taken from a field the user is typing in. Opening a popup
// or a form still focuses its field: focus is then on the button that was
// clicked, or on a field that the new one replaced and that is gone from the
// page. Pure, so it is tested without a browser
// (tests/autofocusDecision.test.cjs).

const EDITABLE = /^(INPUT|TEXTAREA|SELECT)$/;

function isTyping(active, body) {
  if (!active || active === body) return false;
  // A field the re-render just removed - the add-card or checklist composer
  // replaced by a new one after Enter - is not being typed in any more.
  if (active.isConnected === false) return false;
  if (active.isContentEditable) return true;
  return EDITABLE.test(active.tagName || '') && !active.disabled && !active.readOnly;
}

// added: the [autofocus] elements the mutations added, oldest first.
// active: document.activeElement. Returns the element to focus, or null.
function autofocusTarget(added, active, body) {
  const candidates = (added || []).filter(el => el && el.isConnected !== false && typeof el.focus === 'function');
  if (!candidates.length) return null;
  const target = candidates[candidates.length - 1];
  if (target === active) return null;
  if (isTyping(active, body)) return null;
  return target;
}

module.exports = { autofocusTarget, isTyping };
