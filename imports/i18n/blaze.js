import { Blaze } from 'meteor/blaze';
import { TAPi18n } from './tap';

Blaze.registerHelper('_', (...args) => {
  const lastArg = args.pop() || {};
  const { hash = {} } = lastArg;
  const [key] = args.splice(0, 1);

  if (!key) {
    return '';
  }

  // Keep helper reactive to language changes and i18n readiness.
  TAPi18n.current.get();
  TAPi18n.ready.get();

  // If TAPi18n is not initialized yet, return the key as fallback
  if (!TAPi18n.i18n || !TAPi18n.ready.get()) {
    return key;
  }

  const translation = TAPi18n.__(key, { ...hash, sprintf: args });
  return translation;
});

// A setting shown in English AND in the user's language (Admin Panel /
// Attachments: the product's own English terms stay recognizable). The English
// text comes from en.i18n.json, not a second copy typed into the template, and
// the translated line is shown only when it says something else - in English,
// or where a language has no translation yet, the same sentence twice in a row
// is what was shown before.
Blaze.registerHelper('englishText', key => {
  TAPi18n.ready.get();
  return key && TAPi18n.i18n ? TAPi18n.__(key, {}, 'en') : key;
});
Blaze.registerHelper('translatedDiffers', key => {
  TAPi18n.current.get();
  TAPi18n.ready.get();
  if (!key || !TAPi18n.i18n || !TAPi18n.ready.get()) return false;
  return TAPi18n.__(key) !== TAPi18n.__(key, {}, 'en');
});
