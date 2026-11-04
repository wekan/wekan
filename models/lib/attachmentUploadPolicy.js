'use strict';

// Whether this installation lets people upload attachments (#6870).
//
// The switch already exists: Admin Panel / Attachments / Transfer limits has "Attachments upload"
// and "API upload" set to Blocked (limitSettings.attachmentsUploadBlocked / apiUploadBlocked).
// The server refuses an upload on every path when it is on - the upload pipeline
// (models/attachments.server.js) and the API methods and routes (server/attachmentApi.js,
// server/routes/attachmentApi.js). What was missing is that the card still offered the "+" button
// and a drop zone for an upload that would be refused. This is the one decision the server
// method that tells the client and the tests share, so there is no second setting that could
// disagree with the one the server enforces.
//
// Only the boolean leaves the server: the rest of the limits (sizes, storage paths) are for
// administrators.

function uploadPolicy(limitSettings) {
  const limits = limitSettings && typeof limitSettings === 'object' ? limitSettings : {};
  return {
    // anything but a real `true` keeps uploads as they were
    uploadsBlocked: limits.attachmentsUploadBlocked === true,
  };
}

module.exports = { uploadPolicy };
