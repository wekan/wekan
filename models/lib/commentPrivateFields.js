'use strict';
const PRIVATE_COMMENT_FIELDS = ['webhookResponsePending', 'webhookResponseRevision'];
const isPrivateCommentField = path => typeof path === 'string' &&
  PRIVATE_COMMENT_FIELDS.some(field => path === field || path.startsWith(`${field}.`));
function hasPrivateCommentWrite(fields = [], modifier) {
  const paths = [...fields];
  if (modifier && typeof modifier === 'object') {
    // A replacement can erase evidence even when it names no private field.
    if (Object.keys(modifier).some(key => !key.startsWith('$'))) return true;
    for (const [operator, value] of Object.entries(modifier)) {
      if (!operator.startsWith('$')) paths.push(operator);
      else if (value && typeof value === 'object') {
        paths.push(...Object.keys(value));
        if (operator === '$rename') paths.push(...Object.values(value));
      }
    }
  }
  return paths.some(isPrivateCommentField);
}
// Server callers needing recovery metadata must use the private raw-driver
// path explicitly. All ordinary reads, including publication cursors and board
// exports, exclude it even if a caller asks for a private field by name.
function publicCommentOptions(options = {}) {
  const fields = { ...(options.fields || {}) };
  const inclusion = Object.entries(fields).some(([key, value]) => key !== '_id' && value !== 0 && value !== false) ||
    (Object.keys(fields).length === 1 && fields._id === 1);
  if (inclusion) {
    for (const key of Object.keys(fields)) if (isPrivateCommentField(key)) delete fields[key];
    // Removing the only requested field must not expand into the whole document.
    if (!Object.entries(fields).some(([key, value]) => key !== '_id' && value !== 0 && value !== false)) {
      return { ...options, fields: { _id: 1 } };
    }
  } else {
    for (const key of Object.keys(fields)) if (isPrivateCommentField(key)) delete fields[key];
    for (const field of PRIVATE_COMMENT_FIELDS) fields[field] = 0;
  }
  return { ...options, fields };
}
function withoutCommentPrivateFields(comment) {
  const result = { ...comment };
  for (const field of PRIVATE_COMMENT_FIELDS) delete result[field];
  return result;
}
module.exports = { PRIVATE_COMMENT_FIELDS, hasPrivateCommentWrite, publicCommentOptions, withoutCommentPrivateFields };
