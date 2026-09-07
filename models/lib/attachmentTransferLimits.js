'use strict';

// One representation of attachment transfer limits for Blaze, REST and the
// no-JavaScript HTML4 baseline. Values stored in MongoDB are whole bytes; the
// display unit is deliberately not persisted.
const LIMIT_UNIT_FACTORS = Object.freeze({
  bytes: 1,
  mb: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
});

const LIMIT_MODES = Object.freeze({
  UNLIMITED: 'unlimited',
  MAX_SIZE: 'max-size',
  BLOCKED: 'blocked',
});

const LIMIT_BLOCKED_FIELDS = Object.freeze({
  attachmentsUploadMaxBytes: 'attachmentsUploadBlocked',
  attachmentsDownloadMaxBytes: 'attachmentsDownloadBlocked',
  apiUploadMaxBytes: 'apiUploadBlocked',
  apiDownloadMaxBytes: 'apiDownloadBlocked',
});

const LIMIT_FIELDS = Object.freeze(Object.keys(LIMIT_BLOCKED_FIELDS));

const DEFAULT_LIMIT_SETTINGS = Object.freeze({
  attachmentsUploadMaxBytes: 0,
  attachmentsDownloadMaxBytes: 0,
  apiUploadMaxBytes: 0,
  apiDownloadMaxBytes: 0,
  attachmentsUploadBlocked: false,
  avatarsUploadBlocked: false,
  attachmentsDownloadBlocked: false,
  apiUploadBlocked: false,
  apiDownloadBlocked: false,
});

function toNonNegativeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeLimitSettings(settingsDoc) {
  const fromDoc = settingsDoc?.limitSettings || {};
  const legacyUpload = settingsDoc?.uploadSettings?.maxFileSize;
  const normalized = { ...DEFAULT_LIMIT_SETTINGS };
  for (const field of LIMIT_FIELDS) {
    const fallback = field === 'attachmentsUploadMaxBytes'
      && Number.isFinite(legacyUpload) ? legacyUpload : 0;
    normalized[field] = Number.isFinite(fromDoc[field])
      ? toNonNegativeInteger(fromDoc[field], 0)
      : toNonNegativeInteger(fallback, 0);
    normalized[LIMIT_BLOCKED_FIELDS[field]] =
      fromDoc[LIMIT_BLOCKED_FIELDS[field]] === true;
  }
  normalized.avatarsUploadBlocked = fromDoc.avatarsUploadBlocked === true;
  return normalized;
}

function getBlockedFieldName(fieldName) {
  return LIMIT_BLOCKED_FIELDS[fieldName] || null;
}

function pickModeForLimit(fieldName, normalizedLimits) {
  const blockedField = getBlockedFieldName(fieldName);
  if (blockedField && normalizedLimits[blockedField] === true) return LIMIT_MODES.BLOCKED;
  return normalizedLimits[fieldName] > 0 ? LIMIT_MODES.MAX_SIZE : LIMIT_MODES.UNLIMITED;
}

function pickUnitForBytes(bytes) {
  const safeBytes = toNonNegativeInteger(bytes, 0);
  if (safeBytes > 0 && safeBytes % LIMIT_UNIT_FACTORS.gb === 0) return 'gb';
  if (safeBytes > 0 && safeBytes % LIMIT_UNIT_FACTORS.mb === 0) return 'mb';
  return 'bytes';
}

function toDisplayValue(bytes, unit) {
  return toNonNegativeInteger(bytes, 0) / (LIMIT_UNIT_FACTORS[unit] || 1);
}

function toBytes(value, unit) {
  const numericValue = Number.parseFloat(value);
  const factor = LIMIT_UNIT_FACTORS[unit];
  if (!Number.isFinite(numericValue) || numericValue <= 0 || !factor) return null;
  const bytes = Math.round(numericValue * factor);
  return Number.isSafeInteger(bytes) && bytes > 0 ? bytes : null;
}

module.exports = {
  DEFAULT_LIMIT_SETTINGS,
  LIMIT_BLOCKED_FIELDS,
  LIMIT_FIELDS,
  LIMIT_MODES,
  LIMIT_UNIT_FACTORS,
  getBlockedFieldName,
  normalizeLimitSettings,
  pickModeForLimit,
  pickUnitForBytes,
  toBytes,
  toDisplayValue,
  toNonNegativeInteger,
};
