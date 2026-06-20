/**
 * Pure helpers for building the option labels shown in board / list /
 * swimlane selectors (e.g. the move-card and copy-card popups).
 *
 * Regression #6135 ("numbering boards, list, swim caused some issues"):
 * a previous change prepended a sequential number to every option label
 * (e.g. "3. My Board"). That broke two things:
 *
 *   1. Boards whose name itself starts with a digit became hard to read.
 *   2. First-letter keyboard navigation in the native <select> dropdown
 *      stopped working, because every option started with a number instead
 *      of the board name.
 *
 * The fix: numbering is OPTIONAL and OFF by default. By default the label is
 * exactly the entity name, so its first character is the name's first
 * character and first-letter navigation works again. When numbering is
 * explicitly enabled, the number is appended as a trailing visual suffix so
 * the label still STARTS with the name.
 */

/**
 * Build the label for a selectable board/list/swimlane option.
 *
 * @param {string} name   The entity (board/list/swimlane) name/title.
 * @param {number} index  Zero-based position in the list.
 * @param {Object} [opts]
 * @param {boolean} [opts.numbered=false] When true, append the 1-based
 *        number as a trailing suffix. When false (default), return the bare
 *        name so first-letter keyboard navigation keeps working.
 * @returns {string} The option label.
 */
export function boardOptionLabel(name, index, { numbered = false } = {}) {
  const label = name == null ? '' : String(name);
  if (!numbered) {
    return label;
  }
  const position = Number(index);
  const number = Number.isFinite(position) ? position + 1 : index;
  return `${label} (${number})`;
}

export default boardOptionLabel;
