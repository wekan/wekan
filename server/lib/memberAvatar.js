import { Meteor } from 'meteor/meteor';
import Avatars from '/models/avatars';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import { convertImageBufferToGif } from '/server/lib/legacyHtml4Gif';
import { generateUniversalAvatarUrl } from '/models/lib/universalUrlGenerator';
import { fileStoreStrategyFactory } from '/models/avatars.server';
import securityLog from '/server/lib/securityLog';

const DEFAULT_MAX_BYTES = 72000;

function report(user, context, detail) {
  securityLog.record({
    category: 'file', bleed: 'FileBleed', severity: 'high', action: 'blocked',
    source: 'memberAvatar', userId: user?._id || context.userId,
    username: user?.username, req: context.req, connection: context.connection, detail,
  });
}

async function account(userId, context) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { username: 1, profile: 1 },
  });
  if (!user) {
    report(user, { ...context, userId }, 'refused member avatar access without an account');
    throw new Meteor.Error('not-logged-in');
  }
  return user;
}

function uploadMaximum() {
  const configured = Number.parseInt(process.env.AVATARS_UPLOAD_MAX_SIZE || '', 10);
  return Number.isSafeInteger(configured) && configured > 0 ? configured : DEFAULT_MAX_BYTES;
}

async function uploadsBlocked() {
  const settings = await AttachmentStorageSettings.findOneAsync({});
  return settings?.limitSettings?.avatarsUploadBlocked === true;
}

async function avatarDataUrl(avatar) {
  if (avatar.type !== 'image/gif' || avatar.size > uploadMaximum()) return '';
  const stream = fileStoreStrategyFactory.getFileStrategy(avatar, 'original').getReadStream();
  if (!stream) return '';
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > uploadMaximum()) {
      stream.destroy();
      return '';
    }
    chunks.push(chunk);
  }
  return `data:image/gif;base64,${Buffer.concat(chunks).toString('base64')}`;
}

export async function memberAvatarsForUser(userId, context = {}) {
  const user = await account(userId, context);
  const avatars = await Avatars.collection.find({ userId }, {
    fields: { name: 1, type: 1, size: 1, uploadedAt: 1, versions: 1 },
    sort: { uploadedAt: -1 }, limit: 100,
  }).fetchAsync();
  for (const avatar of avatars) avatar.dataUrl = await avatarDataUrl(avatar);
  return {
    currentUrl: user.profile?.avatarUrl || '', avatars,
    uploadBlocked: await uploadsBlocked(), uploadMaxBytes: uploadMaximum(),
  };
}

export async function memberAvatarState(userId, context = {}) {
  const user = await account(userId, context);
  return { currentUrl: user.profile?.avatarUrl || '', uploadBlocked: await uploadsBlocked() };
}

export async function uploadMemberAvatar(userId, input, context = {}) {
  const user = await account(userId, context);
  const maximum = uploadMaximum();
  if (await uploadsBlocked()) {
    report(user, context, 'refused member avatar upload while uploads are blocked');
    throw new Meteor.Error('avatar-upload-blocked');
  }
  if (!Buffer.isBuffer(input) || !input.length || input.length > maximum) {
    report(user, context, `refused member avatar byte size ${input?.length || 0}`);
    throw new Meteor.Error('invalid-image-size');
  }
  let gif;
  try {
    gif = await convertImageBufferToGif(input);
  } catch (error) {
    report(user, context, 'refused undecodable member avatar image');
    throw new Meteor.Error('invalid-image', error.message);
  }
  const file = await Avatars.writeAsync(gif, {
    fileName: 'avatar.gif', type: 'image/gif', userId,
    meta: { source: 'member-avatar' },
  }, true);
  if (!file?._id) throw new Meteor.Error('avatar-upload-failed');
  return file._id;
}

export async function selectMemberAvatar(userId, avatarId, context = {}) {
  const user = await account(userId, context);
  if (avatarId === '') {
    await Meteor.users.updateAsync(userId, { $set: { 'profile.avatarUrl': '' } });
    return '';
  }
  if (typeof avatarId !== 'string' || avatarId.length > 100) {
    report(user, context, 'refused malformed member avatar id');
    throw new Meteor.Error('avatar-not-found');
  }
  const avatar = await Avatars.collection.findOneAsync({ _id: avatarId, userId }, {
    fields: { _id: 1 },
  });
  if (!avatar) {
    report(user, context, `refused selecting avatar outside account ${avatarId.slice(0, 100)}`);
    throw new Meteor.Error('avatar-not-found');
  }
  const url = generateUniversalAvatarUrl(avatar._id);
  await Meteor.users.updateAsync(userId, { $set: { 'profile.avatarUrl': url } });
  return url;
}

export async function deleteMemberAvatar(userId, avatarId, context = {}) {
  const user = await account(userId, context);
  if (typeof avatarId !== 'string' || avatarId.length > 100) {
    report(user, context, 'refused malformed member avatar deletion');
    throw new Meteor.Error('avatar-not-found');
  }
  const avatar = await Avatars.collection.findOneAsync({ _id: avatarId, userId }, {
    fields: { _id: 1 },
  });
  if (!avatar) {
    report(user, context, `refused deleting avatar outside account ${avatarId.slice(0, 100)}`);
    throw new Meteor.Error('avatar-not-found');
  }
  await Avatars.removeAsync(avatar._id);
  const currentId = /\/(?:cdn\/storage|cfs\/files)\/avatars\/([^/?#]+)/
    .exec(user.profile?.avatarUrl || '')?.[1];
  if (currentId === avatar._id) {
    await Meteor.users.updateAsync(userId, { $set: { 'profile.avatarUrl': '' } });
  }
  return true;
}
