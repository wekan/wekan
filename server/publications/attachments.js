import Attachments, { AttachmentStorage } from '/models/attachments';
import { ObjectID } from 'bson';

Meteor.publish('attachmentsList', function() {
  // eslint-disable-next-line no-console
  // console.log('attachments:', AttachmentStorage.find());
  const files = AttachmentStorage.find(
    {},
    {
      fields: {
        _id: 1,
        filename: 1,
        md5: 1,
        length: 1,
        contentType: 1,
        metadata: 1,
      },
      sort: {
        filename: 1,
      },
      limit: 250,
    },
  );
  const attIds = [];
  files.forEach(file => {
    attIds.push(file._id._str);
  });

  return [
    files,
    Attachments.find({ 'copies.attachments.key': { $in: attIds } }),
  ];
});

Meteor.publish('orphanedAttachments', function() {
  let keys = [];
  Attachments.find({}, { fields: { copies: 1 } }).forEach(att => {
    keys.push(new ObjectID(att.copies.attachments.key));
  });
  keys.sort();
  keys = _.uniq(keys, true);

  return AttachmentStorage.find(
    { _id: { $nin: keys } },
    {
      fields: {
        _id: 1,
        filename: 1,
        md5: 1,
        length: 1,
        contentType: 1,
        metadata: 1,
      },
      sort: {
        filename: 1,
      },
      limit: 250,
    },
  );
});
