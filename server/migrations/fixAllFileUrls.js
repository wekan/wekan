/**
 * Fix All File URLs Migration
 * Ensures all attachment and avatar URLs are universal and work regardless of ROOT_URL and PORT settings
 */

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Users from '/models/users';
import Attachments from '/models/attachments';
import Avatars from '/models/avatars';
import Cards from '/models/cards';
import { generateUniversalAttachmentUrl, generateUniversalAvatarUrl, cleanFileUrl, extractFileIdFromUrl, isUniversalFileUrl } from '/models/lib/universalUrlGenerator';

class FixAllFileUrlsMigration {
  constructor() {
    this.name = 'fixAllFileUrls';
    this.version = 1;
  }

  /**
   * Check if migration is needed for a board
   */
  needsMigration(boardId) {
    // Get all users who are members of this board
    const board = ReactiveCache.getBoard(boardId);
    if (!board || !board.members) {
      return false;
    }

    const memberIds = board.members.map(m => m.userId);

    // Check for problematic avatar URLs for board members
    const users = ReactiveCache.getUsers({ _id: { $in: memberIds } });
    for (const user of users) {
      if (user.profile && user.profile.avatarUrl) {
        const avatarUrl = user.profile.avatarUrl;
        if (this.hasProblematicUrl(avatarUrl)) {
          return true;
        }
      }
    }

    // Check for problematic attachment URLs on this board
    const cards = ReactiveCache.getCards({ boardId });
    const cardIds = cards.map(c => c._id);
    const attachments = ReactiveCache.getAttachments({ cardId: { $in: cardIds } });

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
   * Execute the migration for a board
   */
  async execute(boardId) {
    let filesFixed = 0;
    let errors = [];

    console.log(`Starting universal file URL migration for board ${boardId}...`);

    try {
      // Fix avatar URLs for board members
      const avatarFixed = await this.fixAvatarUrls(boardId);
      filesFixed += avatarFixed;

      // Fix attachment URLs for board cards
      const attachmentFixed = await this.fixAttachmentUrls(boardId);
      filesFixed += attachmentFixed;

      // Fix card attachment references
      const cardFixed = await this.fixCardAttachmentUrls(boardId);
      filesFixed += cardFixed;

    } catch (error) {
      console.error('Error during file URL migration for board', boardId, ':', error);
      errors.push(error.message);
    }

    console.log(`Universal file URL migration completed for board ${boardId}. Fixed ${filesFixed} file URLs.`);

    return {
      success: errors.length === 0,
      filesFixed,
      errors,
      changes: [`Fixed ${filesFixed} file URLs for this board`]
    };
  }

  /**
   * Fix avatar URLs in user profiles for board members
   */
  async fixAvatarUrls(boardId) {
    const board = ReactiveCache.getBoard(boardId);
    if (!board || !board.members) {
      return 0;
    }

    const memberIds = board.members.map(m => m.userId);
    const users = ReactiveCache.getUsers({ _id: { $in: memberIds } });
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
   * Fix attachment URLs in attachment records for this board
   */
  async fixAttachmentUrls(boardId) {
    const cards = ReactiveCache.getCards({ boardId });
    const cardIds = cards.map(c => c._id);
    const attachments = ReactiveCache.getAttachments({ cardId: { $in: cardIds } });
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
   * Fix attachment URLs in the Attachments collection for this board
   */
  async fixCardAttachmentUrls(boardId) {
    const cards = ReactiveCache.getCards({ boardId });
    const cardIds = cards.map(c => c._id);
    const attachments = ReactiveCache.getAttachments({ cardId: { $in: cardIds } });
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
  'fixAllFileUrls.execute'(boardId) {
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Check if user is board admin
    const board = ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    const user = ReactiveCache.getUser(this.userId);
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

    return fixAllFileUrlsMigration.execute(boardId);
  },

  'fixAllFileUrls.needsMigration'(boardId) {
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    return fixAllFileUrlsMigration.needsMigration(boardId);
  }
});
