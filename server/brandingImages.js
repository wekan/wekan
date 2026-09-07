import crypto from 'crypto';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import Boards from '/models/boards';
import { STORAGE_NAME_FILESYSTEM } from '/models/lib/fileStoreConstants';
import { generateUniversalAttachmentUrl } from '/models/lib/universalUrlGenerator';
import { fileStoreStrategyFactory as attachmentStoreFactory } from '/models/attachments.server';
import Org from '/models/org';
import Settings from '/models/settings';
import * as tenantAdmin from '/models/lib/tenantAdmin';
import { fetchSafe } from '/server/lib/ssrfGuard';
import {
  boundedStreamBuffer,
  convertImageBufferToGif,
  storeGeneratedGif,
} from '/server/lib/legacyHtml4Gif';

const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;
const GLOBAL_FIELDS = ['customLoginLogoImageUrl', 'customTopLeftCornerLogoImageUrl'];
const ORG_FIELDS = ['orgCustomLoginLogoImageUrl', 'orgCustomTopLeftCornerLogoImageUrl'];
const SLOT_FIELDS = {
  login: { global: GLOBAL_FIELDS[0], org: ORG_FIELDS[0] },
  topLeft: { global: GLOBAL_FIELDS[1], org: ORG_FIELDS[1] },
};
// Failed legacy downloads live only in this unpublished server collection. The
// public Settings/Org document is cleared immediately, so clients never keep
// loading or displaying an external image while a later startup retry is owed.
const BrandingImageImports = new Mongo.Collection('brandingImageImports');

function internalUrl(id) {
  return `/branding/images/${encodeURIComponent(id)}.gif`;
}

function isExternalUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

async function defaultStorage() {
  const setting = await AttachmentStorageSettings.findOneAsync({});
  const storage = setting?.getDefaultStorage?.() || STORAGE_NAME_FILESYSTEM;
  if (setting?.isStorageWriteEnabled && !setting.isStorageWriteEnabled(storage)) {
    throw new Error('Default attachment storage is not writable');
  }
  return storage;
}

async function storeBrandingGif(input, scope, ownerId, slot, source) {
  const gif = await convertImageBufferToGif(input);
  const digest = crypto.createHash('sha256').update(gif).digest('hex');
  const identity = `${scope}:${ownerId || 'instance'}:${slot}:${digest}`;
  const id = `branding-${crypto.createHash('sha256').update(identity).digest('hex').slice(0, 32)}`;
  let file = await Attachments.collection.findOneAsync({ _id: id });
  if (!file) {
    file = {
      _id: id,
      name: `${slot}-logo.gif`,
      type: 'image/gif',
      size: gif.length,
      extension: 'gif',
      extensionWithDot: '.gif',
      uploadedAt: new Date(),
      versions: {},
      meta: {
        systemAsset: 'branding-image',
        brandingScope: scope,
        brandingOwnerId: ownerId || '',
        brandingSlot: slot,
        sourceDigest: crypto.createHash('sha256').update(String(source || '')).digest('hex'),
      },
    };
    await Attachments.collection.insertAsync(file);
  }
  if (!file.versions?.original) {
    await storeGeneratedGif(file, gif, {
      factory: attachmentStoreFactory,
      collection: Attachments.collection,
      getDefaultStorage: defaultStorage,
      versionName: 'original',
    });
  }
  return internalUrl(id);
}

export async function uploadBrandingImageForUser(
  userId, scope, orgId, slot, input,
) {
  check(scope, Match.OneOf('global', 'org'));
  check(orgId, Match.OneOf(String, null));
  check(slot, Match.OneOf('login', 'topLeft'));
  const user = await ReactiveCache.getUser(
    { _id: userId }, { fields: { isAdmin: 1, orgs: 1 } },
  );
  if (scope === 'global' ? user?.isAdmin !== true
    : !orgId || !tenantAdmin.canManageOrg(user, orgId)) {
    throw new Meteor.Error('not-authorized');
  }
  if (!Buffer.isBuffer(input) || !input.length || input.length > MAX_UPLOAD_BYTES) {
    throw new Meteor.Error('invalid-image-size');
  }
  let url;
  try { url = await storeBrandingGif(input, scope, orgId, slot, 'admin-upload'); }
  catch (error) { throw new Meteor.Error('invalid-image', error.message); }
  const field = SLOT_FIELDS[slot][scope];
  const collection = scope === 'global' ? Settings : Org;
  const id = scope === 'global' ? (await Settings.findOneAsync({}))?._id : orgId;
  await collection.direct.updateAsync(id, { $set: { [field]: url } });
  return url;
}

async function importExternal(value, scope, ownerId, slot) {
  const response = await fetchSafe(value, { maxRedirects: 3 });
  const status = response.statusCode || response.status;
  if (status < 200 || status >= 300) throw new Error(`branding download returned HTTP ${status}`);
  const input = await boundedStreamBuffer(response.body || response, MAX_UPLOAD_BYTES);
  return storeBrandingGif(input, scope, ownerId, slot, value);
}

export async function storeBoardBackgroundGif(input, boardId, source) {
  const gif = await convertImageBufferToGif(input);
  const digest = crypto.createHash('sha256').update(gif).digest('hex');
  const id = `board-background-${crypto.createHash('sha256').update(`${boardId}:${digest}`).digest('hex').slice(0, 28)}`;
  let file = await Attachments.collection.findOneAsync({ _id: id });
  if (!file) {
    file = {
      _id: id, name: 'board-background.gif', type: 'image/gif', size: gif.length,
      extension: 'gif', extensionWithDot: '.gif', uploadedAt: new Date(), versions: {},
      meta: {
        boardId, fileId: id, source: 'board-background', systemAsset: 'localized-board-background',
        sourceDigest: crypto.createHash('sha256').update(String(source)).digest('hex'),
      },
    };
    await Attachments.collection.insertAsync(file);
  }
  if (!file.versions?.original) {
    await storeGeneratedGif(file, gif, {
      factory: attachmentStoreFactory, collection: Attachments.collection,
      getDefaultStorage: defaultStorage, versionName: 'original',
    });
  }
  return { id, url: generateUniversalAttachmentUrl(id) };
}

async function importBoardBackground(value, boardId) {
  const response = await fetchSafe(value, { maxRedirects: 3 });
  const status = response.statusCode || response.status;
  if (status < 200 || status >= 300) throw new Error(`background download returned HTTP ${status}`);
  return storeBoardBackgroundGif(
    await boundedStreamBuffer(response.body || response, MAX_UPLOAD_BYTES), boardId, value);
}

async function migrateDocument(collection, doc, scope, fields) {
  for (const [slot, field] of Object.entries(fields)) {
    const value = doc?.[field];
    if (!isExternalUrl(value)) continue;
    try {
      const url = await importExternal(value.trim(), scope, doc._id, slot);
      // Compare-and-set: never overwrite a newer administrator change made while
      // the startup download was running.
      await collection.updateAsync({ _id: doc._id, [field]: value }, { $set: { [field]: url } });
      await BrandingImageImports.removeAsync({ scope, ownerId: doc._id, slot });
      console.info(`[branding] localized ${scope} ${slot} image to Default Storage`);
    } catch (error) {
      await BrandingImageImports.updateAsync(
        { scope, ownerId: doc._id, slot },
        { $set: { scope, ownerId: doc._id, slot, field, url: value, updatedAt: new Date() } },
        { upsert: true },
      );
      await collection.updateAsync({ _id: doc._id, [field]: value }, { $set: { [field]: '' } });
      console.error(`[branding] could not localize ${scope} ${slot} image: ${error.message}`);
    }
  }
}

Meteor.startup(async () => {
  const setting = await Settings.findOneAsync({});
  if (setting) await migrateDocument(Settings, setting, 'global', {
    login: GLOBAL_FIELDS[0], topLeft: GLOBAL_FIELDS[1],
  });
  const orgs = await Org.find({ $or: ORG_FIELDS.map(field => ({ [field]: /^https?:\/\//i })) }).fetchAsync();
  for (const org of orgs) await migrateDocument(Org, org, 'org', {
    login: ORG_FIELDS[0], topLeft: ORG_FIELDS[1],
  });
  const boards = await Boards.find({ backgroundImageURL: /^https?:\/\//i }, {
    fields: { backgroundImageURL: 1 },
  }).fetchAsync();
  for (const board of boards) {
    const value = board.backgroundImageURL;
    try {
      const stored = await importBoardBackground(value, board._id);
      await Boards.updateAsync({ _id: board._id, backgroundImageURL: value }, {
        $set: { backgroundImageId: stored.id, backgroundImageURL: stored.url },
      });
    } catch (error) {
      await BrandingImageImports.updateAsync(
        { scope: 'board', ownerId: board._id, slot: 'background' },
        { $set: { scope: 'board', ownerId: board._id, slot: 'background',
          field: 'backgroundImageURL', url: value, updatedAt: new Date() } },
        { upsert: true },
      );
      await Boards.updateAsync({ _id: board._id, backgroundImageURL: value }, {
        $set: { backgroundImageURL: '', backgroundImageId: '' },
      });
      console.error(`[branding] could not localize board background: ${error.message}`);
    }
  }
  const pending = await BrandingImageImports.find({}, { sort: { updatedAt: 1 } }).fetchAsync();
  for (const item of pending) {
    try {
      if (item.scope === 'board') {
        const stored = await importBoardBackground(item.url, item.ownerId);
        await Boards.updateAsync(item.ownerId, {
          $set: { backgroundImageId: stored.id, backgroundImageURL: stored.url },
        });
      } else {
        const url = await importExternal(item.url, item.scope, item.ownerId, item.slot);
        const collection = item.scope === 'global' ? Settings : Org;
        await collection.updateAsync(item.ownerId, { $set: { [item.field]: url } });
      }
      await BrandingImageImports.removeAsync(item._id);
    } catch (error) {
      console.error(`[branding] queued ${item.scope} ${item.slot} image retry failed: ${error.message}`);
    }
  }
});

Meteor.methods({
  async uploadBrandingImage(scope, orgId, slot, base64) {
    check(scope, Match.OneOf('global', 'org'));
    check(orgId, Match.OneOf(String, null));
    check(slot, Match.OneOf('login', 'topLeft'));
    check(base64, String);
    if (base64.length > Math.ceil(MAX_UPLOAD_BYTES * 4 / 3) + 4 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      throw new Meteor.Error('invalid-image');
    }
    const input = Buffer.from(base64, 'base64');
    if (!input.length || input.length > MAX_UPLOAD_BYTES) throw new Meteor.Error('invalid-image-size');
    return uploadBrandingImageForUser(this.userId, scope, orgId, slot, input);
  },

  async uploadBoardBackgroundImage(boardId, base64) {
    check(boardId, String);
    check(base64, String);
    const board = await ReactiveCache.getBoard(boardId);
    const user = await ReactiveCache.getUser({ _id: this.userId }, { fields: { isAdmin: 1 } });
    if (!board || !this.userId ||
        !((board.hasAdmin && board.hasAdmin(this.userId)) || user?.isAdmin === true)) {
      throw new Meteor.Error('not-authorized');
    }
    if (base64.length > Math.ceil(MAX_UPLOAD_BYTES * 4 / 3) + 4 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      throw new Meteor.Error('invalid-image');
    }
    const input = Buffer.from(base64, 'base64');
    if (!input.length || input.length > MAX_UPLOAD_BYTES) throw new Meteor.Error('invalid-image-size');
    let stored;
    try {
      stored = await storeBoardBackgroundGif(input, boardId, 'admin-upload');
    } catch (error) {
      throw new Meteor.Error('invalid-image', error.message);
    }
    await Boards.updateAsync(boardId, {
      $set: { backgroundImageId: stored.id, backgroundImageURL: stored.url },
    });
    return stored;
  },
});

WebApp.handlers.get('/branding/images/:fileId.gif', async (req, res) => {
  try {
    const file = await Attachments.collection.findOneAsync({
      _id: req.params.fileId,
      'meta.systemAsset': 'branding-image',
    });
    if (!file?.versions?.original) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const strategy = attachmentStoreFactory.getFileStrategy(file, 'original');
    const gif = await boundedStreamBuffer(strategy.getReadStream(), MAX_UPLOAD_BYTES);
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': gif.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });
    res.end(gif);
  } catch (error) {
    console.error(`[branding] image read failed: ${error.message}`);
    if (!res.headersSent) res.writeHead(500);
    res.end('Image unavailable');
  }
});
