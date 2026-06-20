/**
 * Pure helper to determine which user should be credited for an attachment
 * activity (specifically the 'deleteAttachment' activity).
 *
 * Bug #5504: when an attachment is deleted, the activity must record the user
 * who actually performed the removal (the acting user), not the original
 * uploader. When no acting user is available (e.g. a server/system removal),
 * fall back to the uploader so the activity still has a sensible userId.
 *
 * @param {string|null|undefined} actingUserId the user performing the removal
 * @param {string|null|undefined} uploaderUserId the original uploader
 * @returns {string|null|undefined} actingUserId if present, otherwise uploaderUserId
 */
export function deleteActivityUserId(actingUserId, uploaderUserId) {
  return actingUserId || uploaderUserId;
}
