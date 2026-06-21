// Pure, Meteor-free helpers behind the REST API response/error handling fixes.
// Kept dependency-free so they can be unit-tested standalone (mocha + chai)
// without booting Meteor.
//
//   #5804 The REST API returned an HTTP 500 with a raw stack trace when a
//         request was invalid (e.g. POST .../comments without a `comment`
//         parameter, or against a board that does not exist):
//
//           - The schema validation error thrown on insert is a circular
//             object (SimpleSchemaValidationContext -> SimpleSchema -> ...).
//             Passing it to JSON.stringify threw "Converting circular
//             structure to JSON" *inside* the response writer, which bubbled
//             up as a generic HTTP 500 page.
//           - Missing required parameters should be reported as HTTP 400, and
//             auth/lookup failures with their own status code, not 500.
//
// These helpers make response serialization crash-proof and map errors to a
// sensible HTTP status code.

/**
 * Extract a short, human-readable message from an arbitrary value (typically an
 * Error / Meteor.Error / SimpleSchema validation error). Never throws and
 * always returns a string, even for circular or exotic objects.
 *
 * @param {*} value
 * @returns {string}
 */
export function extractErrorMessage(value) {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  // Meteor.Error uses `reason`; native errors use `message`; some carry `error`.
  const message = value.reason || value.message || value.error;
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  try {
    return String(value);
  } catch (e) {
    return 'Unknown error';
  }
}

/**
 * Serialize `data` to a JSON string that is safe to send as a response body.
 * Falls back to a minimal `{ "error": <message> }` payload when the value
 * cannot be serialized (for example a circular SimpleSchema validation error),
 * so the response never crashes the request handler with an HTTP 500.
 *
 * @param {*} data
 * @param {(number|null)} [spacer] indentation passed through to JSON.stringify
 * @returns {string}
 */
export function safeJsonStringify(data, spacer) {
  const space = spacer === undefined ? null : spacer;
  try {
    return JSON.stringify(data, null, space);
  } catch (err) {
    return JSON.stringify({ error: extractErrorMessage(data) }, null, space);
  }
}

/**
 * Map an error thrown inside a REST handler to an HTTP status code. Honours an
 * explicit numeric `statusCode` (set by the Authentication helpers: 401/403),
 * recognises a few well-known Meteor.Error names, and otherwise defaults to
 * 500 (a genuine server error).
 *
 * @param {*} error
 * @returns {number}
 */
export function httpStatusForError(error) {
  if (error && typeof error.statusCode === 'number') {
    return error.statusCode;
  }
  const name = error && (error.error || error.errorType || error.name);
  switch (name) {
    case 'Unauthorized':
      return 401;
    case 'Forbidden':
      return 403;
    case 'NotFound':
      return 404;
    default:
      return 500;
  }
}

/**
 * Validate the body of a "create comment" REST request. The CardComments schema
 * requires `text` to be a non-empty String; without this guard a missing
 * `comment` parameter reaches the insert and throws a circular validation error
 * that previously surfaced as an HTTP 500 (#5804).
 *
 * @param {object} body the request body
 * @returns {{ valid: boolean, comment?: string, error?: string }}
 */
export function validateCommentBody(body) {
  const comment =
    body && typeof body.comment === 'string' ? body.comment.trim() : '';
  if (comment === '') {
    return { valid: false, error: 'Missing required parameter: comment' };
  }
  return { valid: true, comment };
}
