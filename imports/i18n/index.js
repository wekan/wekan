import { Meteor } from 'meteor/meteor';
import { TAPi18n } from './tap';
import './accounts';
import './blaze';

export { TAPi18n };

// Initialize translations at startup. TAPi18n.init() is internally resilient
// (it registers the statically-bundled English and bounds the dynamic language
// load with a timeout, always setting `ready`), but guard the startup too so a
// stray rejection can never become an unhandled promise rejection (#6503).
Meteor.startup(async () => {
  try {
    await TAPi18n.init();
  } catch (e) {
    console.error('TAPi18n.init failed at startup', e);
  }
});
