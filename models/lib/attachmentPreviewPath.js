'use strict';

// /cdn/storage/attachments/<id>/preview-<part>: the parts of an attachment's
// converted preview (server/lib/attachmentPreviewStore.js) - meta, index and
// rows. Two segments, like /<id>/thumbnail: Meteor-Files answers every
// /cdn/storage/<collection>/<id>/<version>/<name> path itself, so a third
// segment never reaches the file server. Pure, for the file server and
// tests/attachmentPreviewStore.test.cjs.
const PREVIEW_PARTS = ['meta', 'index', 'rows'];

// The part asked for, from the path after /cdn/storage/attachments, or null.
function previewPartOf(urlPath) {
  const parts = String(urlPath || '').split('?')[0].split('/').filter(Boolean);
  if (parts.length !== 2 || !parts[1].startsWith('preview-')) return null;
  const part = parts[1].slice('preview-'.length);
  return PREVIEW_PARTS.includes(part) ? part : null;
}

module.exports = { previewPartOf, PREVIEW_PARTS };
