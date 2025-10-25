/**
 * Fix Avatar URLs Migration
 * Removes problematic auth parameters from existing avatar URLs
 */

import { ReactiveCache } from '/imports/reactiveCache';
import Users from '/models/users';
import { generateUniversalAvatarUrl, cleanFileUrl, extractFileIdFromUrl, isUniversalFileUrl } from '/models/lib/universalUrlGenerator';

class FixAvatarUrlsMigration {
  constructor() {
    this.name = 'fixAvatarUrls';
    this.version = 1;
  }

  /**
   * Check if migration is needed
   */
  needsMigration() {
    const users = ReactiveCache.getUsers({});
    
    for (const user of users) {
      if (user.profile && user.profile.avatarUrl) {
        const avatarUrl = user.profile.avatarUrl;
        if (avatarUrl.includes('auth=false') || avatarUrl.includes('brokenIsFine=true')) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Execute the migration
   */
  async execute() {
    const users = ReactiveCache.getUsers({});
    let avatarsFixed = 0;

    console.log(`Starting avatar URL fix migration...`);

    for (const user of users) {
      if (user.profile && user.profile.avatarUrl) {
        const avatarUrl = user.profile.avatarUrl;
        let needsUpdate = false;
        let cleanUrl = avatarUrl;
        
        // Check if URL has problematic parameters
        if (avatarUrl.includes('auth=false') || avatarUrl.includes('brokenIsFine=true')) {
          // Remove problematic parameters
          cleanUrl = cleanUrl.replace(/[?&]auth=false/g, '');
          cleanUrl = cleanUrl.replace(/[?&]brokenIsFine=true/g, '');
          cleanUrl = cleanUrl.replace(/\?&/g, '?');
          cleanUrl = cleanUrl.replace(/\?$/g, '');
          needsUpdate = true;
        }
        
        // Check if URL is using old CollectionFS format
        if (avatarUrl.includes('/cfs/files/avatars/')) {
          cleanUrl = cleanUrl.replace('/cfs/files/avatars/', '/cdn/storage/avatars/');
          needsUpdate = true;
        }
        
        // Check if URL is missing the /cdn/storage/avatars/ prefix
        if (avatarUrl.includes('avatars/') && !avatarUrl.includes('/cdn/storage/avatars/') && !avatarUrl.includes('/cfs/files/avatars/')) {
          // This might be a relative URL, make it absolute
          if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
            cleanUrl = `/cdn/storage/avatars/${avatarUrl}`;
            needsUpdate = true;
          }
        }
        
        // If we have a file ID, generate a universal URL
        const fileId = extractFileIdFromUrl(avatarUrl, 'avatar');
        if (fileId && !isUniversalFileUrl(cleanUrl, 'avatar')) {
          cleanUrl = generateUniversalAvatarUrl(fileId);
          needsUpdate = true;
        }
        
        if (needsUpdate) {
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
      }
    }

    console.log(`Avatar URL fix migration completed. Fixed ${avatarsFixed} avatar URLs.`);
    
    return {
      success: true,
      avatarsFixed
    };
  }
}

// Export singleton instance
export const fixAvatarUrlsMigration = new FixAvatarUrlsMigration();

// Meteor method
Meteor.methods({
  'fixAvatarUrls.execute'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return fixAvatarUrlsMigration.execute();
  },

  'fixAvatarUrls.needsMigration'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return fixAvatarUrlsMigration.needsMigration();
  }
});
