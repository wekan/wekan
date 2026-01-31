/**
 * Fix Avatar URLs Migration
 * Removes problematic auth parameters from existing avatar URLs
 */

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Users from '/models/users';
import { generateUniversalAvatarUrl, cleanFileUrl, extractFileIdFromUrl, isUniversalFileUrl } from '/models/lib/universalUrlGenerator';

class FixAvatarUrlsMigration {
  constructor() {
    this.name = 'fixAvatarUrls';
    this.version = 1;
  }

  /**
   * Check if migration is needed for a board
   */
  async needsMigration(boardId) {
    // Get all users who are members of this board
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !board.members) {
      return false;
    }

    const memberIds = board.members.map(m => m.userId);
    const users = await ReactiveCache.getUsers({ _id: { $in: memberIds } });
    
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
   * Execute the migration for a board
   */
  async execute(boardId) {
    // Get all users who are members of this board
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !board.members) {
      return {
        success: false,
        error: 'Board not found or has no members'
      };
    }

    const memberIds = board.members.map(m => m.userId);
    const users = await ReactiveCache.getUsers({ _id: { $in: memberIds } });
    let avatarsFixed = 0;

    console.log(`Starting avatar URL fix migration for board ${boardId}...`);

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

    console.log(`Avatar URL fix migration completed for board ${boardId}. Fixed ${avatarsFixed} avatar URLs.`);
    
    return {
      success: true,
      avatarsFixed,
      changes: [`Fixed ${avatarsFixed} avatar URLs for board members`]
    };
  }
}

// Export singleton instance
export const fixAvatarUrlsMigration = new FixAvatarUrlsMigration();

// Meteor method
Meteor.methods({
  async 'fixAvatarUrls.execute'(boardId) {
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Check if user is board admin
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    // Only board admins can run migrations
    const isBoardAdmin = board.members && board.members.some(
      member => member.userId === this.userId && member.isAdmin
    );

    if (!isBoardAdmin && !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Only board administrators can run migrations');
    }

    return await fixAvatarUrlsMigration.execute(boardId);
  },

  async 'fixAvatarUrls.needsMigration'(boardId) {
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    return await fixAvatarUrlsMigration.needsMigration(boardId);
  }
});
