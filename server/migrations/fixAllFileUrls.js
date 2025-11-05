/**
 * Fix All File URLs Migration
 * Ensures all attachment and avatar URLs are universal and work regardless of ROOT_URL and PORT settings
 */

import { ReactiveCache } from '/imports/reactiveCache';
import Users from '/models/users';
import Attachments from '/models/attachments';
import Avatars from '/models/avatars';
import { generateUniversalAttachmentUrl, generateUniversalAvatarUrl, cleanFileUrl, extractFileIdFromUrl, isUniversalFileUrl } from '/models/lib/universalUrlGenerator';

class FixAllFileUrlsMigration {
  constructor() {
    this.name = 'fixAllFileUrls';
    this.version = 1;
  }

  /**
   * Check if migration is needed
   */
  needsMigration() {
    // Check for problematic avatar URLs
    const users = ReactiveCache.getUsers({});
    for (const user of users) {
      if (user.profile && user.profile.avatarUrl) {
        const avatarUrl = user.profile.avatarUrl;
        if (this.hasProblematicUrl(avatarUrl)) {
          return true;
        }
      }
    }

    // Check for problematic attachment URLs
    const attachments = ReactiveCache.getAttachments({});
    for (const attachment of attachments) {
      if (attachment.url && this.hasProblematicUrl(attachment.url)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a URL has problematic patterns
   */
  hasProblematicUrl(url) {
    if (!url) return false;
    
    // Check for auth parameters
    if (url.includes('auth=false') || url.includes('brokenIsFine=true')) {
      return true;
    }
    
    // Check for absolute URLs with domains
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }
    
    // Check for ROOT_URL dependencies
    if (Meteor.isServer && process.env.ROOT_URL) {
      try {
        const rootUrl = new URL(process.env.ROOT_URL);
        if (rootUrl.pathname && rootUrl.pathname !== '/' && url.includes(rootUrl.pathname)) {
          return true;
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
    
    // Check for non-universal file URLs
    if (url.includes('/cfs/files/') && !isUniversalFileUrl(url, 'attachment') && !isUniversalFileUrl(url, 'avatar')) {
      return true;
    }
    
    return false;
  }

  /**
   * Execute the migration
   */
  async execute() {
    let filesFixed = 0;
    let errors = [];

    console.log(`Starting universal file URL migration...`);

    try {
      // Fix avatar URLs
      const avatarFixed = await this.fixAvatarUrls();
      filesFixed += avatarFixed;

      // Fix attachment URLs
      const attachmentFixed = await this.fixAttachmentUrls();
      filesFixed += attachmentFixed;

      // Fix card attachment references
      const cardFixed = await this.fixCardAttachmentUrls();
      filesFixed += cardFixed;

    } catch (error) {
      console.error('Error during file URL migration:', error);
      errors.push(error.message);
    }

    console.log(`Universal file URL migration completed. Fixed ${filesFixed} file URLs.`);
    
    return {
      success: errors.length === 0,
      filesFixed,
      errors
    };
  }

  /**
   * Fix avatar URLs in user profiles
   */
  async fixAvatarUrls() {
    const users = ReactiveCache.getUsers({});
    let avatarsFixed = 0;

    for (const user of users) {
      if (user.profile && user.profile.avatarUrl) {
        const avatarUrl = user.profile.avatarUrl;
        
        if (this.hasProblematicUrl(avatarUrl)) {
          try {
            // Extract file ID from URL
            const fileId = extractFileIdFromUrl(avatarUrl, 'avatar');
            
            let cleanUrl;
            if (fileId) {
              // Generate universal URL
              cleanUrl = generateUniversalAvatarUrl(fileId);
            } else {
              // Clean existing URL
              cleanUrl = cleanFileUrl(avatarUrl, 'avatar');
            }
            
            if (cleanUrl && cleanUrl !== avatarUrl) {
              // Update user's avatar URL
              Users.update(user._id, {
                $set: {
                  'profile.avatarUrl': cleanUrl,
                  modifiedAt: new Date()
                }
              });
              
              avatarsFixed++;
              
              if (process.env.DEBUG === 'true') {
                console.log(`Fixed avatar URL for user ${user.username}: ${avatarUrl} -> ${cleanUrl}`);
              }
            }
          } catch (error) {
            console.error(`Error fixing avatar URL for user ${user.username}:`, error);
          }
        }
      }
    }

    return avatarsFixed;
  }

  /**
   * Fix attachment URLs in attachment records
   */
  async fixAttachmentUrls() {
    const attachments = ReactiveCache.getAttachments({});
    let attachmentsFixed = 0;

    for (const attachment of attachments) {
      // Check if attachment has URL field that needs fixing
      if (attachment.url && this.hasProblematicUrl(attachment.url)) {
        try {
          const fileId = attachment._id;
          const cleanUrl = generateUniversalAttachmentUrl(fileId);
          
          if (cleanUrl && cleanUrl !== attachment.url) {
            // Update attachment URL
            Attachments.update(attachment._id, {
              $set: {
                url: cleanUrl,
                modifiedAt: new Date()
              }
            });
            
            attachmentsFixed++;
            
            if (process.env.DEBUG === 'true') {
              console.log(`Fixed attachment URL: ${attachment.url} -> ${cleanUrl}`);
            }
          }
        } catch (error) {
          console.error(`Error fixing attachment URL for ${attachment._id}:`, error);
        }
      }
    }

    return attachmentsFixed;
  }

  /**
   * Fix attachment URLs in the Attachments collection
   */
  async fixCardAttachmentUrls() {
    const attachments = ReactiveCache.getAttachments({});
    let attachmentsFixed = 0;

    for (const attachment of attachments) {
      if (attachment.url && this.hasProblematicUrl(attachment.url)) {
        try {
          const fileId = attachment._id || extractFileIdFromUrl(attachment.url, 'attachment');
          const cleanUrl = fileId ? generateUniversalAttachmentUrl(fileId) : cleanFileUrl(attachment.url, 'attachment');
          
          if (cleanUrl && cleanUrl !== attachment.url) {
            // Update attachment with fixed URL
            Attachments.update(attachment._id, {
              $set: {
                url: cleanUrl,
                modifiedAt: new Date()
              }
            });
            
            attachmentsFixed++;
            
            if (process.env.DEBUG === 'true') {
              console.log(`Fixed attachment URL ${attachment._id}`);
            }
          }
        } catch (error) {
          console.error(`Error fixing attachment URL:`, error);
        }
      }
    }

    return attachmentsFixed;
  }
}

// Export singleton instance
export const fixAllFileUrlsMigration = new FixAllFileUrlsMigration();

// Meteor methods
Meteor.methods({
  'fixAllFileUrls.execute'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return fixAllFileUrlsMigration.execute();
  },

  'fixAllFileUrls.needsMigration'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return fixAllFileUrlsMigration.needsMigration();
  }
});
