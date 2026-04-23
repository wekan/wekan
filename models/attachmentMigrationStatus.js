import { Mongo } from 'meteor/mongo';

const AttachmentMigrationStatus = new Mongo.Collection('attachmentMigrationStatus');

export default AttachmentMigrationStatus;
