import { Mongo } from 'meteor/mongo';

// Client-side collection mirror for attachment migration status
export const AttachmentMigrationStatus = new Mongo.Collection('attachmentMigrationStatus');
