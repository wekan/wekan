/**
 * Server-side Bulk Attachment Move
 *
 * Moves all attachments matching a source storage to a destination storage as a
 * background job that runs entirely on the server. Because the orchestration
 * lives on the server (not in the browser), the transfer keeps running when the
 * admin leaves or closes the "Admin Panel / Attachments / Move Attachment" page,
 * and its progress is shown again when they return.
 *
 * Progress is persisted in the `attachmentBulkMoveStatus` collection (a single
 * doc with _id 'bulk') so it can be published to the client reactively.
 */

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import AttachmentBulkMoveStatus from '/models/attachmentBulkMoveStatus';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import { fileStoreStrategyFactory } from '/models/attachments.server';
import { moveToStorage } from '/models/lib/fileStoreStrategy';

const STATUS_ID = 'bulk';

// In-memory control flags for the currently running job. A single bulk move
// runs at a time per server process.
const controller = {
  running: false,
  paused: false,
  cancelled: false,
};

// Mirror of the client-side source matcher in
// client/components/settings/attachments.js so the server selects exactly the
// same set of attachments the admin sees in the move list.
function attachmentVersionMatchesSource(attachment, source) {
  const versions = Object.values(attachment.versions || {});
  return versions.some(v => {
    switch (source) {
      case 'collectionfs':
        return !!(v.meta && v.meta.gridFsFileId);
      case 'gridfs':
        return v.storage === 'gridfs' && !(v.meta && v.meta.gridFsFileId);
      case 'fs':
        return v.storage === 'fs' || (!v.storage && !(v.meta && v.meta.gridFsFileId));
      case 's3':
        return v.storage === 's3';
      case 'azure':
        return v.storage === 'azure';
      case 'gcs':
        return v.storage === 'gcs';
      default:
        return false;
    }
  });
}

async function setStatus(fields) {
  await AttachmentBulkMoveStatus.upsertAsync(
    { _id: STATUS_ID },
    { $set: { ...fields, updatedAt: new Date() } },
  );
}

async function requireAdmin(userId) {
  if (!userId) {
    throw new Meteor.Error('not-authorized', 'Must be logged in');
  }
  const user = await ReactiveCache.getUser(userId);
  if (!user || !user.isAdmin) {
    throw new Meteor.Error('not-authorized', 'Admin access required');
  }
  return user;
}

async function runBulkMove(ids, destStorage) {
  const total = ids.length;
  try {
    for (let i = 0; i < total; i++) {
      if (controller.cancelled) break;

      // Honor pause requests without busy-spinning the CPU.
      while (controller.paused && !controller.cancelled) {
        await new Promise(r => setTimeout(r, 200));
      }
      if (controller.cancelled) break;

      const fileObj = await ReactiveCache.getAttachment(ids[i]);
      if (!fileObj) {
        continue;
      }

      await setStatus({
        done: i,
        current: i + 1,
        name: fileObj.name || fileObj._id,
        size: fileObj.size || 0,
        paused: false,
      });

      try {
        // moveToStorage returns a Promise resolving once every version is moved.
        await moveToStorage(fileObj, destStorage, fileStoreStrategyFactory);
      } catch (error) {
        console.error('[attachmentBulkMove] Failed to move attachment', ids[i], error);
      }
    }
  } finally {
    const cancelled = controller.cancelled;
    controller.running = false;
    controller.paused = false;
    controller.cancelled = false;
    const finalStatus = {
      running: false,
      paused: false,
      cancelled,
      finishedAt: new Date(),
    };
    // On normal completion record every file as done; on cancel keep the
    // last processed count untouched.
    if (!cancelled) {
      finalStatus.done = total;
    }
    await setStatus(finalStatus);
  }
}

Meteor.methods({
  async startBulkAttachmentMove(source, dest) {
    check(source, String);
    check(dest, String);

    await requireAdmin(this.userId);

    if (controller.running) {
      throw new Meteor.Error('bulk-move-already-running', 'A bulk attachment move is already running');
    }

    const allowedSources = ['collectionfs', 'gridfs', 'fs', 's3', 'azure', 'gcs'];
    const allowedDestinations = ['collectionfs', 'gridfs', 'fs', 's3', 'azure', 'gcs'];
    if (!allowedSources.includes(source) || !allowedDestinations.includes(dest)) {
      throw new Meteor.Error('invalid-storage', 'Invalid storage selection');
    }
    if (source === dest) {
      throw new Meteor.Error('invalid-storage', 'Source and destination must differ');
    }

    // 'collectionfs' is only meaningful as a source; the writable GridFS target
    // is 'gridfs' (mirrors the client mapping).
    const destStorage = dest === 'collectionfs' ? 'gridfs' : dest;

    const allAttachments = await Attachments.find({}).fetchAsync();
    const ids = allAttachments
      .filter(a => attachmentVersionMatchesSource(a, source))
      .map(a => a._id);

    if (ids.length === 0) {
      await setStatus({
        running: false,
        paused: false,
        total: 0,
        done: 0,
        current: 0,
        source,
        dest: destStorage,
        finishedAt: new Date(),
      });
      return { total: 0 };
    }

    controller.running = true;
    controller.paused = false;
    controller.cancelled = false;

    await setStatus({
      running: true,
      paused: false,
      total: ids.length,
      done: 0,
      current: 0,
      name: '',
      size: 0,
      source,
      dest: destStorage,
      cancelled: false,
      startedAt: new Date(),
      finishedAt: null,
    });

    Meteor.defer(() => runBulkMove(ids, destStorage));

    return { total: ids.length };
  },

  async pauseBulkAttachmentMove() {
    await requireAdmin(this.userId);
    if (!controller.running) return false;
    controller.paused = true;
    await setStatus({ paused: true });
    return true;
  },

  async resumeBulkAttachmentMove() {
    await requireAdmin(this.userId);
    if (!controller.running) return false;
    controller.paused = false;
    await setStatus({ paused: false });
    return true;
  },

  async cancelBulkAttachmentMove() {
    await requireAdmin(this.userId);
    controller.cancelled = true;
    controller.paused = false;
    return true;
  },
});

Meteor.publish('attachmentBulkMoveStatus', async function () {
  if (!this.userId) {
    return this.ready();
  }
  const user = await ReactiveCache.getUser(this.userId);
  if (!user || !user.isAdmin) {
    return this.ready();
  }
  return AttachmentBulkMoveStatus.find({});
});

Meteor.startup(() => {
  // A move job cannot survive a server restart (its in-memory controller is
  // gone), so clear any stale "running" flag left over from a previous process.
  AttachmentBulkMoveStatus.updateAsync(
    { _id: STATUS_ID, running: true },
    { $set: { running: false, paused: false, interrupted: true, updatedAt: new Date() } },
  ).catch(() => {});
});
