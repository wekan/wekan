import { Meteor } from 'meteor/meteor';
import Actions from '/models/actions';
import { ensureIndex } from '/server/lib/mongoStartup';

Meteor.startup(async () => {
  await ensureIndex(Actions, { modifiedAt: -1 });
});
