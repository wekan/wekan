import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { getOldAttachmentData, getOldAttachmentDataBuffer } from '/models/lib/attachmentBackwardCompatibility';

/**
 * Migration script to convert old CollectionFS attachments to new Meteor-Files structure
 * This script can be run to migrate all old attachments to the new format
 */

if (Meteor.isServer) {
  Meteor.methods({
    /**
     * Migrate a single attachment from old to new structure
     * @param {string} attachmentId - The old attachment ID
     * @returns {Object} - Migration result
     */
    async migrateAttachment(attachmentId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      try {
        // Get old attachment data
        const oldAttachment = getOldAttachmentData(attachmentId);
        if (!oldAttachment) {
          return { success: false, error: 'Old attachment not found' };
        }

        // Check if already migrated
        const existingAttachment = await ReactiveCache.getAttachment(attachmentId);
        if (existingAttachment) {
          return { success: true, message: 'Already migrated', attachmentId };
        }

        // Get file data from GridFS
        const fileData = getOldAttachmentDataBuffer(attachmentId);
        if (!fileData) {
          return { success: false, error: 'Could not read file data from GridFS' };
        }

        // Create new attachment using Meteor-Files
        const fileObj = new File([fileData], oldAttachment.name, {
          type: oldAttachment.type
        });

        const uploader = Attachments.insert({
          file: fileObj,
          meta: oldAttachment.meta,
          isBase64: false,
          transport: 'http'
        });

        if (uploader) {
          return {
            success: true,
            message: 'Migration successful',
            attachmentId,
            newAttachmentId: uploader._id
          };
        } else {
          return { success: false, error: 'Failed to create new attachment' };
        }

      } catch (error) {
        console.error('Error migrating attachment:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Migrate all attachments for a specific card
     * @param {string} cardId - The card ID
     * @returns {Object} - Migration results
     */
    async migrateCardAttachments(cardId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      try {
        // Get all old attachments for this card
        const oldAttachments = await ReactiveCache.getAttachments({ 'meta.cardId': cardId });

        for (const attachment of oldAttachments) {
          const result = Meteor.call('migrateAttachment', attachment._id);
          if (result.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push({
              attachmentId: attachment._id,
              error: result.error
            });
          }
        }

        return results;

      } catch (error) {
        console.error('Error migrating card attachments:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get migration status for attachments
     * @param {string} cardId - The card ID (optional)
     * @returns {Object} - Migration status
     */
    async getAttachmentMigrationStatus(cardId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      try {
        const selector = cardId ? { 'meta.cardId': cardId } : {};
        const allAttachments = await ReactiveCache.getAttachments(selector);

        const status = {
          total: allAttachments.length,
          newStructure: 0,
          oldStructure: 0,
          mixed: false
        };

        for (const attachment of allAttachments) {
          if (attachment.meta && attachment.meta.source === 'legacy') {
            status.oldStructure++;
          } else {
            status.newStructure++;
          }
        }

        status.mixed = status.oldStructure > 0 && status.newStructure > 0;

        return status;

      } catch (error) {
        console.error('Error getting migration status:', error);
        return { error: error.message };
      }
    }
  });
}
