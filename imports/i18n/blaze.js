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
