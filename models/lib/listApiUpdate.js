'use strict';

// Pure, Meteor-free helper for #5396: let REST-API clients edit a list's
// title and color (like cards can be edited) through
// PUT /api/boards/:boardId/lists/:listId. Kept CommonJS + dependency-free so
// the exact same field/validation logic runs on the server and in plain-Node
// unit tests (mirrors models/lib/boardSortReorder.js and
// models/lib/contrastColor.js).
//
// `normalizeColor` is injected (the server passes `normalizeListColor` from
// models/lists.js) so this module never imports anything Meteor/Mongo. That
// normalizer returns an allowed named palette color or a custom '#rrggbb' hex
// unchanged, and '' for anything else — so an unknown color is rejected here
// with a clear error instead of being silently stored as None.

const MAX_TITLE_LENGTH = 1000;

// Build the { $set } update document for a list PUT body. Returns either
//   { set: {...} }        the fields to update (may be empty when nothing given)
//   { error: 'message' }  when a provided field is invalid (e.g. a bad color)
// so the endpoint can answer with a clear 4xx instead of hanging or 500-ing.
function buildListPutUpdate(body, normalizeColor) {
  const src = body || {};
  const set = {};

  if (
    src.title !== undefined &&
    src.title !== null &&
    String(src.title) !== ''
  ) {
    const title = String(src.title);
    set.title =
      title.length > MAX_TITLE_LENGTH
        ? title.substring(0, MAX_TITLE_LENGTH)
        : title;
  }

  if (
    src.color !== undefined &&
    src.color !== null &&
    String(src.color) !== ''
  ) {
    const normalize =
      typeof normalizeColor === 'function' ? normalizeColor : c => c;
    const color = normalize(String(src.color));
    if (!color) {
      return {
        error:
          'Invalid list color. Use a named palette color or a #rrggbb hex value.',
      };
    }
    set.color = color;
  }

  if (Object.prototype.hasOwnProperty.call(src, 'starred')) {
    set.starred = src.starred;
  }

  if (src.wipLimit) {
    set.wipLimit = src.wipLimit;
  }

  return { set };
}

module.exports = { buildListPutUpdate, MAX_TITLE_LENGTH };
