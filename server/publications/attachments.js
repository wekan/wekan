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
