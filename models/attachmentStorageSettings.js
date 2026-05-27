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

    'storageConfig.filesystem.read': {
      type: Boolean,
      defaultValue: true,
      label: 'Filesystem Read Enabled'
    },

    'storageConfig.filesystem.write': {
      type: Boolean,
      defaultValue: true,
      label: 'Filesystem Write Enabled'
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

    'storageConfig.gridfs.read': {
      type: Boolean,
      defaultValue: true,
      label: 'GridFS Read Enabled'
    },

    'storageConfig.gridfs.write': {
      type: Boolean,
      defaultValue: true,
      label: 'GridFS Write Enabled'
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

    // Transfer limits (bytes). 0 means unlimited.
    limitSettings: {
      type: Object,
      optional: true,
      label: 'Transfer Limits'
    },

    'limitSettings.attachmentsUploadMaxBytes': {
      type: Number,
      optional: true,
      min: 0,
      label: 'Attachments Upload Max (bytes)'
    },

    'limitSettings.attachmentsUploadBlocked': {
      type: Boolean,
      optional: true,
      defaultValue: false,
      label: 'Attachments Upload Blocked'
    },

    'limitSettings.attachmentsDownloadMaxBytes': {
      type: Number,
      optional: true,
      min: 0,
      label: 'Attachments Download Max (bytes)'
    },

    'limitSettings.attachmentsDownloadBlocked': {
      type: Boolean,
      optional: true,
      defaultValue: false,
      label: 'Attachments Download Blocked'
    },

    'limitSettings.apiUploadMaxBytes': {
      type: Number,
      optional: true,
      min: 0,
      label: 'API Upload Max (bytes)'
    },

    'limitSettings.apiUploadBlocked': {
      type: Boolean,
      optional: true,
      defaultValue: false,
      label: 'API Upload Blocked'
    },

    'limitSettings.apiDownloadMaxBytes': {
      type: Number,
      optional: true,
      min: 0,
      label: 'API Download Max (bytes)'
    },

    'limitSettings.apiDownloadBlocked': {
      type: Boolean,
      optional: true,
      defaultValue: false,
      label: 'API Download Blocked'
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
        if (this.isInsert || this.isUpdate || this.isUpsert) {
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
  },

  // Get transfer limit settings
  getLimitSettings() {
    return this.limitSettings || {};
  }
});

export default AttachmentStorageSettings;
