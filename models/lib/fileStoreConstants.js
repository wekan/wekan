// Storage backend name constants — shared between client and server.
// Extracted from fileStoreStrategy.js to avoid pulling fs/path into the client.

export const STORAGE_NAME_FILESYSTEM = 'fs';
export const STORAGE_NAME_GRIDFS = 'gridfs';
export const STORAGE_NAME_S3 = 's3';
