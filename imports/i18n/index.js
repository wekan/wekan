import { Meteor } from 'meteor/meteor';
import { TAPi18n } from './tap';
import './accounts';
import './blaze';

export { TAPi18n };

// Initialize translations immediately and synchronously
Meteor.startup(async () => {
  await TAPi18n.init();
});
