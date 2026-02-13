import { Mongo } from 'meteor/mongo';

// Server-side collection for attachment migration status
export const AttachmentMigrationStatus = new Mongo.Collection('attachmentMigrationStatus');

// Allow/Deny rules
// This collection is server-only and should not be modified by clients
// Allow server-side operations (when userId is undefined) but deny all client operations
if (Meteor.isServer) {
  AttachmentMigrationStatus.allow({
    insert: (userId) => !userId,
    update: (userId) => !userId,
    remove: (userId) => !userId,
  });
}

// Create indexes for better query performance
Meteor.startup(() => {
  AttachmentMigrationStatus._collection.createIndexAsync({ boardId: 1 });
  AttachmentMigrationStatus._collection.createIndexAsync({ userId: 1, boardId: 1 });
  AttachmentMigrationStatus._collection.createIndexAsync({ updatedAt: -1 });
});
