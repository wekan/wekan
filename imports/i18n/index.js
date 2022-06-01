import { TAPi18n } from './tap';
import './accounts';
import './moment';

if (Meteor.isClient) {
  import './blaze';
}

export { TAPi18n };

(async () => {
  await TAPi18n.init();
})();

