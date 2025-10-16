import { TAPi18n } from './tap';
import './accounts';

if (Meteor.isClient) {
  import './blaze';
}

export { TAPi18n };

// Initialize translations immediately and synchronously
Meteor.startup(async () => {
  await TAPi18n.init();
});

