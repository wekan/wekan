'use strict';

// Pure helper for the PUT /api/boards/:boardId/labels REST endpoint. Extracted so
// the input validation / label-doc building is unit-testable in plain Node without
// Meteor (mirrors models/lib/boardSortReorder.js and models/lib/reconcileBoardTeamMembers.js).
//
// #5510 (adding a board label via the REST API fails with an internal server error /
// timeout): the old handler read req.body.label.color / .name unconditionally and only
// sent a response inside `if (hasOwnProperty(req.body, 'label'))`. So:
//   - a body WITHOUT a `label` key fell through and NEVER wrote an HTTP response, so the
//     request hung until the client timed out (the reported "timeout"); and
//   - a body where `label` is a bare string (e.g. { "label": "labelName" }, the exact
//     payload in the report) produced name === undefined and color === undefined and
//     pushed a schema-invalid label, returning 200 for garbage.
//
// buildBoardLabel normalizes the accepted shapes and always yields a definite outcome:
//   - { ok: true,  name, color }           -> caller pushes { _id, name, color }
//   - { ok: false, status, error }         -> caller returns that JSON error (never hangs)
//
// Accepted request bodies (all resolve to a label with a name and a valid color):
//   { "label": { "name": "Bug", "color": "red" } }   documented shape (unchanged)
//   { "label": { "name": "Bug" } }                    color defaults sensibly
//   { "label": "Bug" }                                string is taken as the name

// Default when no color is supplied. 'green' is a visible, always-allowed label color.
const DEFAULT_LABEL_COLOR = 'green';

function buildBoardLabel(rawLabel, allowedColors) {
  const colors = Array.isArray(allowedColors) ? allowedColors : [];

  if (rawLabel === undefined || rawLabel === null) {
    return {
      ok: false,
      status: 400,
      error:
        "Missing 'label'. Send { \"label\": { \"name\": \"...\", \"color\": \"green\" } } or { \"label\": \"...\" }.",
    };
  }

  let name;
  let color;
  if (typeof rawLabel === 'string') {
    // { "label": "labelName" } — treat the string as the label name.
    name = rawLabel;
    color = undefined;
  } else if (typeof rawLabel === 'object') {
    name = rawLabel.name;
    color = rawLabel.color;
  } else {
    return {
      ok: false,
      status: 400,
      error: "'label' must be an object { name, color } or a string name.",
    };
  }

  // name is optional in the schema; coerce a provided value to a string, else ''.
  name = name === undefined || name === null ? '' : String(name);

  // color is required in the schema (allowedValues LABEL_COLORS). Default when
  // absent; reject an explicit but unknown color rather than pushing an invalid doc.
  if (color === undefined || color === null || color === '') {
    color = DEFAULT_LABEL_COLOR;
  } else {
    color = String(color);
    if (colors.length && !colors.includes(color)) {
      return {
        ok: false,
        status: 400,
        error: `Invalid label color '${color}'. Allowed colors: ${colors.join(', ')}.`,
      };
    }
  }

  return { ok: true, name, color };
}

module.exports = {
  DEFAULT_LABEL_COLOR,
  buildBoardLabel,
};
