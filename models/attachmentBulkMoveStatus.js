import { Mongo } from 'meteor/mongo';

// Singleton-style collection holding the progress of the server-side bulk
// attachment move job. Because the job runs on the server, its progress
// survives the admin navigating away from (or closing) the Move Attachment
// page and is shown again when they return.
const AttachmentBulkMoveStatus = new Mongo.Collection('attachmentBulkMoveStatus');

export default AttachmentBulkMoveStatus;
