// The size limits and the board write check both attachment APIs apply: the
// Meteor methods in server/attachmentApi.js and the REST routes in
// server/routes/attachmentApi.js. Each used to define all of this itself,
// identically.
import { ReactiveCache } from '/imports/reactiveCache';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { tripCanary } from '/server/lib/canary';

// Hard in-memory ceiling for one file through either API, whatever the
// settings say.
export const HARD_MAX_API_FILE_BYTES = 64 * 1024 * 1024;

// Returns true if the user may *write* to the board (add/change/remove
// attachments): the canonical board write capability, or a global site admin.
// Read operations keep using board.hasMember().
export async function userHasBoardWriteAccess(board, userId) {
  if (!board || !userId) {
    return false;
  }
  if (allowIsBoardMemberWithWriteAccess(userId, board)) {
    return true;
  }
  // Global site admins may write to any board.
  const admin = await ReactiveCache.getUser({ _id: userId, isAdmin: true });
  if (admin !== undefined) {
    return true;
  }
  tripCanary('board.write-without-capability', { userId });
  return false;
}

function normalizeConfiguredLimit(configuredValue, fallbackValue = 0) {
  if (Number.isFinite(configuredValue) && configuredValue >= 0) {
    return configuredValue;
  }
  return Number.isFinite(fallbackValue) && fallbackValue >= 0 ? fallbackValue : 0;
}

export function getEffectiveApiFileLimit(maxBytes) {
  if (Number.isFinite(maxBytes) && maxBytes > 0) {
    return Math.min(maxBytes, HARD_MAX_API_FILE_BYTES);
  }
  // Unlimited in settings still uses a hard in-memory safety cap.
  return HARD_MAX_API_FILE_BYTES;
}

export function maxBase64LengthForBytes(maxBytes) {
  const safeBytes = Number.isFinite(maxBytes) && maxBytes > 0 ? maxBytes : HARD_MAX_API_FILE_BYTES;
  return Math.ceil((safeBytes * 4) / 3) + 4;
}

export function parseNonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export async function getApiTransferLimits() {
  const envUploadFallback = parseNonNegativeInt(process.env.ATTACHMENT_API_MAX_UPLOAD_BYTES, 0);
  const envDownloadFallback = parseNonNegativeInt(process.env.ATTACHMENT_API_MAX_DOWNLOAD_BYTES, 0);

  const fallback = {
    apiUploadMaxBytes: envUploadFallback,
    apiDownloadMaxBytes: envDownloadFallback,
    apiUploadBlocked: false,
    apiDownloadBlocked: false,
  };

  try {
    const settings = await AttachmentStorageSettings.findOneAsync({});
    const limitSettings = settings?.limitSettings || {};

    const apiUploadMaxBytes = normalizeConfiguredLimit(limitSettings.apiUploadMaxBytes, fallback.apiUploadMaxBytes);
    const apiDownloadMaxBytes = normalizeConfiguredLimit(limitSettings.apiDownloadMaxBytes, fallback.apiDownloadMaxBytes);
    const apiUploadBlocked = limitSettings.apiUploadBlocked === true;
    const apiDownloadBlocked = limitSettings.apiDownloadBlocked === true;

    return {
      apiUploadMaxBytes,
      apiDownloadMaxBytes,
      apiUploadBlocked,
      apiDownloadBlocked,
      effectiveApiUploadMaxBytes: getEffectiveApiFileLimit(apiUploadMaxBytes),
      effectiveApiDownloadMaxBytes: getEffectiveApiFileLimit(apiDownloadMaxBytes),
    };
  } catch (error) {
    const apiUploadMaxBytes = normalizeConfiguredLimit(null, fallback.apiUploadMaxBytes);
    const apiDownloadMaxBytes = normalizeConfiguredLimit(null, fallback.apiDownloadMaxBytes);

    return {
      apiUploadMaxBytes,
      apiDownloadMaxBytes,
      apiUploadBlocked: false,
      apiDownloadBlocked: false,
      effectiveApiUploadMaxBytes: getEffectiveApiFileLimit(apiUploadMaxBytes),
      effectiveApiDownloadMaxBytes: getEffectiveApiFileLimit(apiDownloadMaxBytes),
    };
  }
}
