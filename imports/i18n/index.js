import { TAPi18n } from './tap';
import './accounts';
import './moment';

export { TAPi18n };

if (Meteor.isClient) {
  (async () => {
    await import('./blaze');
    await TAPi18n.init();
  })();
} else {
  (async () => {
    await TAPi18n.init();
  })();
}

