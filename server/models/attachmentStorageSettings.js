import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import {
  STORAGE_NAME_FILESYSTEM,
  STORAGE_NAME_GRIDFS,
} from '/models/lib/fileStoreConstants';

Meteor.methods({
  async getAttachmentStorageSettings() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    let settings = await AttachmentStorageSettings.findOneAsync({});
    if (!settings) {
      settings = {
        defaultStorage: STORAGE_NAME_FILESYSTEM,
        storageConfig: {
          filesystem: {
            enabled: true,
            path: process.env.WRITABLE_PATH ? `${process.env.WRITABLE_PATH}/attachments` : '/data/attachments',
          },
          gridfs: {
            enabled: true,
          },
        },
        uploadSettings: {
          maxFileSize: process.env.ATTACHMENTS_UPLOAD_MAX_SIZE
            ? parseInt(process.env.ATTACHMENTS_UPLOAD_MAX_SIZE) : 0,
          allowedMimeTypes: process.env.ATTACHMENTS_UPLOAD_MIME_TYPES
            ? process.env.ATTACHMENTS_UPLOAD_MIME_TYPES.split(',').map(t => t.trim()) : [],
        },
        migrationSettings: {
          autoMigrate: false,
          batchSize: 10,
          delayMs: 1000,
          cpuThreshold: 70,
        },
        createdBy: this.userId,
        updatedBy: this.userId,
      };

      await AttachmentStorageSettings.insertAsync(settings);
      settings = await AttachmentStorageSettings.findOneAsync({});
    }

    return settings;
  },

  async updateAttachmentStorageSettings(settings) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    AttachmentStorageSettings.simpleSchema().validate(settings);

    return AttachmentStorageSettings.upsertAsync(
      {},
      {
        $set: {
          ...settings,
          updatedBy: this.userId,
          updatedAt: new Date(),
        },
      },
    );
  },

  async getDefaultAttachmentStorage() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const settings = await AttachmentStorageSettings.findOneAsync({});
    return settings ? settings.getDefaultStorage() : STORAGE_NAME_FILESYSTEM;
  },

  async setDefaultAttachmentStorage(storageName) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    if (![STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS].includes(storageName)) {
      throw new Meteor.Error('invalid-storage', 'Invalid storage backend');
    }

    return AttachmentStorageSettings.upsertAsync(
      {},
      {
        $set: {
          defaultStorage: storageName,
          updatedBy: this.userId,
          updatedAt: new Date(),
        },
      },
    );
  },
});

Meteor.publish('attachmentStorageSettings', async function() {
  if (!this.userId) {
    return this.ready();
  }

  const user = await ReactiveCache.getUser(this.userId);
  if (!user || !user.isAdmin) {
    return this.ready();
  }

  return AttachmentStorageSettings.find({});
});
