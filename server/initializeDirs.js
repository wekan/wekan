// ============================================================================
// Initialize Upload Directories
// Runs at server startup before models are loaded to ensure ostrio:files
// can create necessary upload directories without permission errors.
// ============================================================================

import fs from 'fs';
import path from 'path';

// Compute upload subdirectory path:
// - On Docker (WRITABLE_PATH=/data): /data/files/attachments, /data/files/avatars
// - On Snap (WRITABLE_PATH=$SNAP_COMMON/files): $SNAP_COMMON/files/attachments, $SNAP_COMMON/files/avatars
// - On dev (WRITABLE_PATH=..): ../files/attachments, ../files/avatars
//
// Snap already appends '/files' to WRITABLE_PATH, so we detect and handle that case.
function getUploadPaths() {
  const basePath = process.env.WRITABLE_PATH || process.cwd();
  
  // Check if basePath already ends with '/files' (Snap case)
  const endsWithFiles = basePath.endsWith('/files') || basePath.endsWith('\\files');
  
  if (endsWithFiles) {
    // Snap: WRITABLE_PATH is already $SNAP_COMMON/files, so append subdirectories directly
    return {
      attachments: path.join(basePath, 'attachments'),
      avatars: path.join(basePath, 'avatars'),
    };
  } else {
    // Docker & Dev: WRITABLE_PATH is /data or .., so append /files/{subdir}
    return {
      attachments: path.join(basePath, 'files', 'attachments'),
      avatars: path.join(basePath, 'files', 'avatars'),
    };
  }
}

const uploadPaths = getUploadPaths();
const dirsToCreate = [uploadPaths.attachments, uploadPaths.avatars];

dirsToCreate.forEach(dirPath => {
  try {
    // Create directory recursively with proper permissions (0o755)
    // Ignore error if it already exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
      if (process.env.DEBUG === 'true') {
        console.info(`[initializeDirs] Created directory: ${dirPath}`);
      }
    } else {
      // Verify the directory is writable
      try {
        fs.accessSync(dirPath, fs.constants.W_OK);
        if (process.env.DEBUG === 'true') {
          console.info(`[initializeDirs] Directory exists and is writable: ${dirPath}`);
        }
      } catch (accessError) {
        console.warn(`[initializeDirs] WARNING: Directory exists but may not be writable: ${dirPath}`, accessError.message);
      }
    }
  } catch (error) {
    console.error(`[initializeDirs] FAILED to initialize directory: ${dirPath}`, error.message);
    throw new Error(`Cannot create or access upload directory: ${dirPath}\n${error.message}`);
  }
});
