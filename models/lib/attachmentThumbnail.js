'use strict';

// wekan/wekan#3275: a small preview of an image attachment, served from
// /cdn/storage/attachments/<id>/thumbnail (maintainer decision 2026-09-29), so
// the card's attachment gallery and the minicard cover no longer download the
// full original - a phone photo is several megabytes and is shown a few
// hundred pixels wide.
//
// The route is the attachment route itself (server/routes/universalFileServer.js)
// with every one of its checks - board access, download block, storage read
// flag - so a thumbnail is readable exactly when the original is.

// Longest edge in pixels. A minicard cover is at most about 270 CSS pixels
// wide; 512 keeps it sharp on a 2x screen.
const THUMBNAIL_EDGE = 512;
const THUMBNAIL_TYPE = 'image/webp';

// Raster formats the converter reads. SVG is not one: it is text that can
// carry scripts, is already small, and is shown by the original route with
// its own sandboxing headers.
const RASTER_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/pjpeg', 'image/gif', 'image/webp', 'image/avif',
  'image/bmp', 'image/tiff', 'image/heic', 'image/heif',
]);
const RASTER_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'jpe', 'jfif', 'gif', 'webp', 'avif', 'bmp', 'tif', 'tiff', 'heic', 'heif',
]);

// "/abc123/thumbnail" (what the handler sees after its mount prefix) -> true.
// Only exactly that: "/abc123", "/abc123/original/name.png" and anything
// longer are the original, as before.
function isThumbnailPath(urlPath) {
  const parts = String(urlPath || '').split('?')[0].split('/').filter(Boolean);
  return parts.length === 2 && parts[1] === 'thumbnail';
}

function canThumbnail(attachment) {
  if (!attachment) return false;
  const type = String(attachment.type || attachment.mime || '').toLowerCase().split(';')[0].trim();
  if (type) return RASTER_TYPES.has(type);
  const name = String(attachment.name || '');
  const extension = String(attachment.extension || name.slice(name.lastIndexOf('.') + 1) || '').toLowerCase();
  return name.includes('.') || attachment.extension ? RASTER_EXTENSIONS.has(extension) : false;
}

// The thumbnail URL for an attachment URL as built by
// models/lib/universalUrlGenerator.js ("<root>/cdn/storage/attachments/<id>").
function thumbnailUrl(attachmentUrl) {
  return attachmentUrl ? `${String(attachmentUrl).replace(/\/+$/, '')}/thumbnail` : '';
}

module.exports = { THUMBNAIL_EDGE, THUMBNAIL_TYPE, isThumbnailPath, canThumbnail, thumbnailUrl };
