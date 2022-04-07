import Attachments from '/models/attachments';
import { ObjectID } from 'bson';

Meteor.publish('attachmentsList', function(limit) {
  const ret = Attachments.find(
    {},
    {
      fields: {
        _id: 1,
        name: 1,
        size: 1,
        type: 1,
        meta: 1,
        path: 1,
        versions: 1,
      },
      sort: {
        name: 1,
      },
      limit: limit,
    },
  ).cursor;
  return ret;
});
