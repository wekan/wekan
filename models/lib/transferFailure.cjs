'use strict';

// What server/lib/secureTransfer.js records when an import or export throws.
//
// Only the transfer boundary's own refusals (models/lib/importExportBoundary.js
// marks them name 'TransferBoundaryError') are an ATTEMPT, and are recorded as
// blocked: a cycle or a non-plain object is not something an export produces,
// so it is high, and a size limit - which a large real board reaches too - is
// medium. Anything else is the code failing, not the user trying something:
// sanitize-html 2.18.0 threw RangeError on nested <iframe>, and recording that
// as a high "blocked" event disabled the account of whoever exported a board
// someone else had planted the payload in. It is recorded as detected, so an
// administrator still sees it, and never blocks an account.

function isTransferBoundaryError(error) {
  return Boolean(error) && error.name === 'TransferBoundaryError';
}

function transferFailureEvent(error, context = {}) {
  const base = {
    category: 'Import/export validation',
    source: context.source || `${context.direction || 'import'}:unknown`,
    userId: context.userId,
    username: context.username,
    ip: context.ip,
  };
  if (isTransferBoundaryError(error)) {
    return {
      ...base,
      bleed: 'ImportExportValidation',
      severity: error.kind === 'limit' ? 'medium' : 'high',
      action: 'blocked',
      detail: error.message,
    };
  }
  const name = (error && error.name) || 'Error';
  const message = (error && error.message) || String(error);
  return {
    ...base,
    bleed: 'ImportExportFailure',
    severity: 'medium',
    action: 'detected',
    blocksAccount: false,
    detail: `${name}: ${message}`.slice(0, 200),
  };
}

module.exports = { isTransferBoundaryError, transferFailureEvent };
