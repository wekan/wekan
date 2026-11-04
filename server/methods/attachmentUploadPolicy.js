import { Meteor } from 'meteor/meteor';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
const { uploadPolicy } = require('/models/lib/attachmentUploadPolicy');

// #6870: tells a signed-in client whether uploads are blocked site-wide, so a card does not offer a
// "+" button and a drop zone for an upload the server will refuse. The refusal itself is enforced
// on the server whatever the client does (models/attachments.server.js, server/attachmentApi.js);
// this only decides what is shown. Only the boolean is returned.
Meteor.methods({
  async attachmentUploadPolicy() {
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    let limitSettings;
    try {
      limitSettings = (await AttachmentStorageSettings.findOneAsync({}))?.limitSettings;
    } catch (error) {
      // an unreadable setting leaves uploads as they were, as the server's own check does
      limitSettings = undefined;
    }
    return uploadPolicy(limitSettings);
  },
});
