import { Mongo } from 'meteor/mongo';
const { SimpleSchema } = require('/imports/simpleSchema');
import { STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS } from '/models/lib/fileStoreConstants';

// Attachment Storage Settings Collection
const AttachmentStorageSettings = new Mongo.Collection('attachmentStorageSettings');

// Schema for attachment storage settings
AttachmentStorageSettings.attachSchema(
  new SimpleSchema({
    // Default storage backend for new uploads
    defaultStorage: {
      type: String,
      allowedValues: [STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS],
      defaultValue: STORAGE_NAME_FILESYSTEM,
      label: 'Default Storage Backend'
    },

    // Storage backend configuration
    storageConfig: {
      type: Object,
      optional: true,
      label: 'Storage Configuration'
    },

    'storageConfig.filesystem': {
      type: Object,
      optional: true,
      label: 'Filesystem Configuration'
    },

    'storageConfig.filesystem.enabled': {
      type: Boolean,
      defaultValue: true,
      label: 'Filesystem Storage Enabled'
    },

    'storageConfig.filesystem.path': {
      type: String,
      optional: true,
      label: 'Filesystem Storage Path'
    },

    'storageConfig.gridfs': {
      type: Object,
      optional: true,
      label: 'GridFS Configuration'
    },

    'storageConfig.gridfs.enabled': {
      type: Boolean,
      defaultValue: true,
      label: 'GridFS Storage Enabled'
    },

    // DISABLED: S3 storage configuration removed due to Node.js compatibility
    /*
    'storageConfig.s3': {
      type: Object,
      optional: true,
      label: 'S3 Configuration'
    },

    'storageConfig.s3.enabled': {
      type: Boolean,
      defaultValue: false,
      label: 'S3 Storage Enabled'
    },

    'storageConfig.s3.endpoint': {
      type: String,
      optional: true,
      label: 'S3 Endpoint'
    },

    'storageConfig.s3.bucket': {
      type: String,
      optional: true,
      label: 'S3 Bucket'
    },

    'storageConfig.s3.region': {
      type: String,
      optional: true,
      label: 'S3 Region'
    },

    'storageConfig.s3.sslEnabled': {
      type: Boolean,
      defaultValue: true,
      label: 'S3 SSL Enabled'
    },

    'storageConfig.s3.port': {
      type: Number,
      defaultValue: 443,
      label: 'S3 Port'
    },
    */

    // Upload settings
    uploadSettings: {
      type: Object,
      optional: true,
      label: 'Upload Settings'
    },

    'uploadSettings.maxFileSize': {
      type: Number,
      optional: true,
      label: 'Maximum File Size (bytes)'
    },

    'uploadSettings.allowedMimeTypes': {
      type: Array,
      optional: true,
      label: 'Allowed MIME Types'
    },

    'uploadSettings.allowedMimeTypes.$': {
      type: String,
      label: 'MIME Type'
    },

    // Migration settings
    migrationSettings: {
      type: Object,
      optional: true,
      label: 'Migration Settings'
    },

    'migrationSettings.autoMigrate': {
      type: Boolean,
      defaultValue: false,
      label: 'Auto Migrate to Default Storage'
    },

    'migrationSettings.batchSize': {
      type: Number,
      defaultValue: 10,
      min: 1,
      max: 100,
      label: 'Migration Batch Size'
    },

    'migrationSettings.delayMs': {
      type: Number,
      defaultValue: 1000,
      min: 100,
      max: 10000,
      label: 'Migration Delay (ms)'
    },

    'migrationSettings.cpuThreshold': {
      type: Number,
      defaultValue: 70,
      min: 10,
      max: 90,
      label: 'CPU Threshold (%)'
    },

    // Metadata
    createdAt: {
      type: Date,
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
      label: 'Created At'
    },

    updatedAt: {
      type: Date,
      autoValue() {
        if (this.isUpdate || this.isUpsert) {
          return new Date();
        }
      },
      label: 'Updated At'
    },

    createdBy: {
      type: String,
      optional: true,
      label: 'Created By'
    },

    updatedBy: {
      type: String,
      optional: true,
      label: 'Updated By'
    }
  })
);

// Helper methods
AttachmentStorageSettings.helpers({
  // Get default storage backend
  getDefaultStorage() {
    return this.defaultStorage || STORAGE_NAME_FILESYSTEM;
  },

  // Check if storage backend is enabled
  isStorageEnabled(storageName) {
    if (!this.storageConfig) return false;

    switch (storageName) {
      case STORAGE_NAME_FILESYSTEM:
        return this.storageConfig.filesystem?.enabled !== false;
      case STORAGE_NAME_GRIDFS:
        return this.storageConfig.gridfs?.enabled !== false;
      // DISABLED: S3 storage removed due to Node.js compatibility
      // case STORAGE_NAME_S3:
      //   return this.storageConfig.s3?.enabled === true;
      default:
        return false;
    }
  },

  // Get storage configuration
  getStorageConfig(storageName) {
    if (!this.storageConfig) return null;

    switch (storageName) {
      case STORAGE_NAME_FILESYSTEM:
        return this.storageConfig.filesystem;
      case STORAGE_NAME_GRIDFS:
        return this.storageConfig.gridfs;
      // DISABLED: S3 storage removed due to Node.js compatibility
      // case STORAGE_NAME_S3:
      //   return this.storageConfig.s3;
      default:
        return null;
    }
  },

  // Get upload settings
  getUploadSettings() {
    return this.uploadSettings || {};
  },

  // Get migration settings
  getMigrationSettings() {
    return this.migrationSettings || {};
  }
});

export default AttachmentStorageSettings;
