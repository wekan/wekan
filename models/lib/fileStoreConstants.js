// Storage backend name constants — shared between client and server.
// Extracted from fileStoreStrategy.js to avoid pulling fs/path into the client.

export const STORAGE_NAME_FILESYSTEM = 'fs';
export const STORAGE_NAME_GRIDFS = 'gridfs';
export const STORAGE_NAME_S3 = 's3';
export const STORAGE_NAME_AZURE = 'azure';
export const STORAGE_NAME_GCS = 'gcs';
// Legacy CollectionFS GridFS (pre-Meteor-Files): metadata lives in
// cfs.<coll>.filerecord and binaries in the cfs_gridfs.<coll> GridFS bucket.
// Supported as a migration source and (for export to very old WeKan) destination.
export const STORAGE_NAME_COLLECTIONFS = 'collectionfs';

// Storage backends served through @tweedegolf/storage-abstraction (multi-cloud).
// Filesystem and GridFS keep their dedicated native strategies.
export const CLOUD_STORAGE_NAMES = [STORAGE_NAME_S3, STORAGE_NAME_AZURE, STORAGE_NAME_GCS];
