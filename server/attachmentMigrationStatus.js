import { Meteor } from 'meteor/meteor';
import AttachmentMigrationStatus from '/models/attachmentMigrationStatus';
import { ensureIndex } from '/server/lib/mongoStartup';

// Allow/Deny rules
// This collection is server-only and should not be modified by clients
// Allow server-side operations (when userId is undefined) but deny all client operations
AttachmentMigrationStatus.allow({
  insert: (userId) => !userId,
  update: (userId) => !userId,
  remove: (userId) => !userId,
});

// Create indexes for better query performance
Meteor.startup(() => {
  ensureIndex(AttachmentMigrationStatus, { boardId: 1 });
  ensureIndex(AttachmentMigrationStatus, { userId: 1, boardId: 1 });
  ensureIndex(AttachmentMigrationStatus, { updatedAt: -1 });
});
