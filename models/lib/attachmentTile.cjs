'use strict';

// #6796: how big an attachment's tile is on the opened card
// (client/components/cards/attachments.jade, attachmentGallery).
//
// The full tile (144x96) is worth its space only when it SHOWS something - an
// image, an SVG, a video or audio player. A file with nothing to preview got the
// same box with its extension written in it ("txt"), which took more room than
// the file name did and pushed the name and its buttons out of the card. Such a
// file now gets a small file button, and so does every attachment when Board
// Settings / Card / Show on Card / Attachments: Preview is off. The small button
// still opens the preview, as the tile does.

const PREVIEW_EXTENSIONS = new Set(['svg', 'mp3', 'ogg', 'webm', 'mp4']);

function attachmentHasVisualPreview({ isImage, extension, hasLink } = {}) {
  if (!hasLink) return false;
  if (isImage) return true;
  return PREVIEW_EXTENSIONS.has(String(extension || '').toLowerCase());
}

// previewsOn: the board's allowsAttachmentPreviewsOnCard (unset means on).
function attachmentTileCompact(file = {}, previewsOn) {
  if (previewsOn === false) return true;
  return !attachmentHasVisualPreview(file);
}

module.exports = { attachmentHasVisualPreview, attachmentTileCompact, PREVIEW_EXTENSIONS };
