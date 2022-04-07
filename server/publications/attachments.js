import Attachments from '/models/attachments';
import { ObjectID } from 'bson';

Meteor.publish('attachmentsList', function() {
  const ret = Attachments.find(
    {},
    {
      fields: {
        _id: 1,
        name: 1,
        size: 1,
        type: 1,
        meta: 1,
      },
      sort: {
        name: 1,
      },
      limit: 250,
    },
  ).cursor;
  return ret;
});

Meteor.publish('orphanedAttachments', function() {
  let keys = [];

  if (Attachments.find({}, { fields: { copies: 1 } }) !== undefined) {
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
  } else {
    return [];
  }
});
