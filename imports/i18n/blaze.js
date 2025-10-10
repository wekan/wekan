import { Blaze } from 'meteor/blaze';
import { TAPi18n } from './tap';

Blaze.registerHelper('_', (...args) => {
  const { hash } = args.pop();
  const [key] = args.splice(0, 1);

  // If TAPi18n is not initialized yet, return the key as fallback
  if (!TAPi18n.i18n) {
    return key;
  }

  const translation = TAPi18n.__(key, { ...hash, sprintf: args });

  // If translation is the same as key (meaning not found), return a formatted version
  if (translation === key) {
    return key.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  return translation;
});
