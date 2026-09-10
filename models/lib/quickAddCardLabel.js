'use strict';

// Pure helpers for GitHub issue #3986: quick-add-card bracket label syntax.
// Typing "[Fedora] Do a thing" in the quick-add-card textarea at the bottom of
// a list creates a card titled "Do a thing" with the "Fedora" label applied,
// creating the label on the board first if it does not already exist.
//
// Only a SINGLE bracket prefix at the very start of the title is parsed - this
// is deliberately not a general mid-title or multi-label syntax. Extracted so
// the parsing/resolution logic is unit-testable in plain Node, mirroring the
// other models/lib pure helpers (labelAutocomplete.js, memberAutocomplete.js).

// Parses a leading "[LabelName] " prefix off a quick-add-card title.
//
// Returns { title, labelName }:
// - When the title starts with a well-formed bracket prefix (non-empty
//   content, no nested brackets, followed by at least one non-whitespace
//   character), `labelName` is the trimmed bracket content and `title` is the
//   remainder with the prefix stripped.
// - Otherwise (no brackets, empty brackets, nested brackets, or nothing left
//   after the bracket) the title is returned unchanged and `labelName` is
//   `null` - the bracket is treated as literal title text, not label syntax.
function parseQuickAddCardLabel(rawTitle) {
  const title = rawTitle == null ? '' : String(rawTitle);
  const trimmed = title.trim();
  // [^[\]]* forbids a second '[' or ']' inside the brackets, so a title like
  // "[a[b] rest" (nested/unbalanced brackets) never matches and is left as
  // literal text, per the "defensive, not overly clever" scope.
  const match = /^\[([^[\]]*)\](?:\s+(\S.*))?$/s.exec(trimmed);
  if (!match) {
    return { title: rawTitle, labelName: null };
  }
  const labelName = match[1].trim();
  const rest = (match[2] || '').trim();
  if (!labelName || !rest) {
    // Empty bracket ("[] Do a thing") or nothing after the bracket
    // ("[Fedora]" alone) - not the syntax, keep the literal title.
    return { title: rawTitle, labelName: null };
  }
  return { title: rest, labelName };
}

// Finds an existing label on the board whose name matches `labelName`
// case-insensitively. Returns the label's `_id`, or `null` when no label
// matches (including when `labels` is empty/absent or `labelName` is falsy).
function findExistingLabelIdByName(labels, labelName) {
  if (!Array.isArray(labels) || !labelName) {
    return null;
  }
  const needle = String(labelName).trim().toLowerCase();
  const found = labels.find(
    label => String(label?.name == null ? '' : label.name).toLowerCase() === needle,
  );
  return found ? found._id : null;
}

// Picks a default color for a newly created label: the first palette color
// not already used by one of the board's labels, falling back to the first
// palette color when every color is already used. Mirrors
// Template.createLabelPopup.helpers.defaultColor() in
// client/components/cards/labels.js, so a label auto-created by the quick-add
// bracket syntax gets the same kind of color a manually created one would.
function pickDefaultLabelColor(labels, colors) {
  const palette = Array.isArray(colors) && colors.length > 0 ? colors : ['green'];
  const used = (Array.isArray(labels) ? labels : []).map(label => label?.color);
  const available = palette.filter(color => !used.includes(color));
  return available.length > 0 ? available[0] : palette[0];
}

export {
  parseQuickAddCardLabel,
  findExistingLabelIdByName,
  pickDefaultLabelColor,
};
