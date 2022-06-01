import { Tracker } from 'meteor/tracker';
import moment from 'moment/min/moment-with-locales';
import { TAPi18n } from './tap';

// Reactively adjust Moment.js translations
Tracker.autorun(() => {
  const language = TAPi18n.getLanguage();
  try {
    moment.locale(language);
  } catch (err) {
    console.error(err);
  }
});
