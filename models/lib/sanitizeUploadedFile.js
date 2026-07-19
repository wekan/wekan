'use strict';

// General "sanitize known exploits from an uploaded file at its staging location,
// BEFORE it is promoted to the default storage (filesystem final location, S3,
// GridFS, ...)". Centralizes the exploit-removal step so every upload path
// (attachments, avatars) runs the same sanitization in the same place.
//
// Today this strips JavaScript (<script>, event handlers, javascript: URIs,
// embedded HTML) and XML-loop / billion-laughs DOCTYPE/ENTITY constructs from SVG
// uploads, in place, so the image still uploads but cannot execute script or
// expand entities. The file's on-disk bytes at version.path are rewritten while it
// is still on the local filesystem staging area; only after this returns should
// the caller move the file to its final storage backend.

const { isSvgFile, sanitizeSvgFileSync } = require('./sanitizeSvg');

// Sanitize known exploits from every version of fileObj in place. Returns true if
// any version's bytes were modified (so the caller can persist the new sizes).
function sanitizeUploadedFileExploits(fileObj) {
  if (!fileObj || !fileObj.versions) return false;
  let changed = false;

  // SVG: remove script / event handlers / javascript: URIs / XML DOCTYPE/ENTITY.
  if (isSvgFile(fileObj.type, fileObj.name)) {
    Object.keys(fileObj.versions).forEach(versionName => {
      const version = fileObj.versions[versionName];
      const newSize = sanitizeSvgFileSync(version && version.path);
      if (newSize !== null) {
        version.size = newSize;
        changed = true;
      }
    });
  }

  return changed;
}

module.exports = { sanitizeUploadedFileExploits };
