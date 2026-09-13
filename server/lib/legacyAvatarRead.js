import { getUserIdFromRequest } from '/server/lib/requestUser';
import { getOldAttachmentData, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';

// CollectionFS records cannot reliably establish public-board visibility.
// Require authentication before looking up metadata or opening the old bucket.
export async function readAuthenticatedLegacyAvatar(req, fileId) {
  if (!(await getUserIdFromRequest(req))) return null;
  const avatar = await getOldAttachmentData(fileId, 'avatars');
  if (!avatar) return null;
  const stream = await getOldAttachmentStream(fileId, 'avatars');
  return stream ? { avatar, stream } : null;
}
