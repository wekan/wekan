/**
 * Universal URL Generator
 * Generates file URLs that work regardless of ROOT_URL and PORT settings
 * Ensures all attachments and avatars are always visible
 */

import { Meteor } from 'meteor/meteor';

/**
 * Generate a universal file URL that works regardless of ROOT_URL and PORT
 * @param {string} fileId - The file ID
 * @param {string} type - The file type ('attachment' or 'avatar')
 * @param {string} version - The file version (default: 'original')
 * @returns {string} - Universal file URL
 */
export function generateUniversalFileUrl(fileId, type, version = 'original') {
  if (!fileId) {
    return '';
  }

  // Always use relative URLs to avoid ROOT_URL and PORT dependencies
  if (type === 'attachment') {
    return `/cdn/storage/attachments/${fileId}`;
  } else if (type === 'avatar') {
    return `/cdn/storage/avatars/${fileId}`;
  }

  return '';
}

/**
 * Generate a universal attachment URL
 * @param {string} attachmentId - The attachment ID
 * @param {string} version - The file version (default: 'original')
 * @returns {string} - Universal attachment URL
 */
export function generateUniversalAttachmentUrl(attachmentId, version = 'original') {
  return generateUniversalFileUrl(attachmentId, 'attachment', version);
}

/**
 * Generate a universal avatar URL
 * @param {string} avatarId - The avatar ID
 * @param {string} version - The file version (default: 'original')
 * @returns {string} - Universal avatar URL
 */
export function generateUniversalAvatarUrl(avatarId, version = 'original') {
  return generateUniversalFileUrl(avatarId, 'avatar', version);
}

/**
 * Clean and normalize a file URL to ensure it's universal
 * @param {string} url - The URL to clean
 * @param {string} type - The file type ('attachment' or 'avatar')
 * @returns {string} - Cleaned universal URL
 */
export function cleanFileUrl(url, type) {
  if (!url) {
    return '';
  }

  // Remove any domain, port, or protocol from the URL
  let cleanUrl = url;

  // Remove protocol and domain
  cleanUrl = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');

  // Remove ROOT_URL pathname if present
  if (Meteor.isServer && process.env.ROOT_URL) {
    try {
      const rootUrl = new URL(process.env.ROOT_URL);
      if (rootUrl.pathname && rootUrl.pathname !== '/') {
        cleanUrl = cleanUrl.replace(rootUrl.pathname, '');
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }

  // Normalize path separators
  cleanUrl = cleanUrl.replace(/\/+/g, '/');

  // Ensure URL starts with /
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }

  // Convert old CollectionFS URLs to new format
  if (type === 'attachment') {
    cleanUrl = cleanUrl.replace('/cfs/files/attachments/', '/cdn/storage/attachments/');
  } else if (type === 'avatar') {
    cleanUrl = cleanUrl.replace('/cfs/files/avatars/', '/cdn/storage/avatars/');
  }

  // Remove any query parameters that might cause issues
  cleanUrl = cleanUrl.split('?')[0];
  cleanUrl = cleanUrl.split('#')[0];

  return cleanUrl;
}

/**
 * Check if a URL is a universal file URL
 * @param {string} url - The URL to check
 * @param {string} type - The file type ('attachment' or 'avatar')
 * @returns {boolean} - True if it's a universal file URL
 */
export function isUniversalFileUrl(url, type) {
  if (!url) {
    return false;
  }

  if (type === 'attachment') {
    return url.includes('/cdn/storage/attachments/') || url.includes('/cfs/files/attachments/');
  } else if (type === 'avatar') {
    return url.includes('/cdn/storage/avatars/') || url.includes('/cfs/files/avatars/');
  }

  return false;
}

/**
 * Extract file ID from a universal file URL
 * @param {string} url - The URL to extract from
 * @param {string} type - The file type ('attachment' or 'avatar')
 * @returns {string|null} - The file ID or null if not found
 */
export function extractFileIdFromUrl(url, type) {
  if (!url) {
    return null;
  }

  let pattern;
  if (type === 'attachment') {
    pattern = /\/(?:cdn\/storage\/attachments|cfs\/files\/attachments)\/([^\/\?#]+)/;
  } else if (type === 'avatar') {
    pattern = /\/(?:cdn\/storage\/avatars|cfs\/files\/avatars)\/([^\/\?#]+)/;
  } else {
    return null;
  }

  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Generate a fallback URL for when the primary URL fails
 * @param {string} fileId - The file ID
 * @param {string} type - The file type ('attachment' or 'avatar')
 * @returns {string} - Fallback URL
 */
export function generateFallbackUrl(fileId, type) {
  if (!fileId) {
    return '';
  }

  // Try alternative route patterns
  if (type === 'attachment') {
    return `/attachments/${fileId}`;
  } else if (type === 'avatar') {
    return `/avatars/${fileId}`;
  }

  return '';
}

/**
 * Get all possible URLs for a file (for redundancy)
 * @param {string} fileId - The file ID
 * @param {string} type - The file type ('attachment' or 'avatar')
 * @returns {Array<string>} - Array of possible URLs
 */
export function getAllPossibleUrls(fileId, type) {
  if (!fileId) {
    return [];
  }

  const urls = [];

  // Primary URL
  urls.push(generateUniversalFileUrl(fileId, type));

  // Fallback URL
  urls.push(generateFallbackUrl(fileId, type));

  // Legacy URLs for backward compatibility
  if (type === 'attachment') {
    urls.push(`/cfs/files/attachments/${fileId}`);
  } else if (type === 'avatar') {
    urls.push(`/cfs/files/avatars/${fileId}`);
  }

  return urls.filter(url => url); // Remove empty URLs
}
