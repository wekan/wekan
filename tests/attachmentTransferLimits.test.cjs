'use strict';

const assert = require('assert');
const {
  LIMIT_MODES,
  normalizeLimitSettings,
  pickModeForLimit,
  pickUnitForBytes,
  toBytes,
  toDisplayValue,
} = require('../models/lib/attachmentTransferLimits');

const normalized = normalizeLimitSettings({
  uploadSettings: { maxFileSize: 4 * 1024 * 1024 },
  limitSettings: {
    attachmentsDownloadMaxBytes: 2 * 1024 * 1024 * 1024,
    apiUploadBlocked: true,
    avatarsUploadBlocked: true,
  },
});
assert.strictEqual(normalized.attachmentsUploadMaxBytes, 4 * 1024 * 1024);
assert.strictEqual(pickUnitForBytes(normalized.attachmentsUploadMaxBytes), 'mb');
assert.strictEqual(toDisplayValue(normalized.attachmentsUploadMaxBytes, 'mb'), 4);
assert.strictEqual(pickUnitForBytes(normalized.attachmentsDownloadMaxBytes), 'gb');
assert.strictEqual(pickModeForLimit('apiUploadMaxBytes', normalized), LIMIT_MODES.BLOCKED);
assert.strictEqual(normalized.avatarsUploadBlocked, true);

assert.strictEqual(toBytes('1.5', 'mb'), 1572864);
for (const invalid of [['0', 'mb'], ['-1', 'mb'], ['x', 'mb'], ['1', 'bogus'],
  [String(Number.MAX_SAFE_INTEGER), 'gb']]) {
  assert.strictEqual(toBytes(...invalid), null);
}

console.log('attachmentTransferLimits: shared normalization and validation passed');
