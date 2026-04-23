import { Meteor } from 'meteor/meteor';
import Actions from '/models/actions';

Meteor.startup(async () => {
  await Actions._collection.createIndexAsync({ modifiedAt: -1 });
});
