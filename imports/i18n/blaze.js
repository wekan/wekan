import { Blaze } from 'meteor/blaze';
import { TAPi18n } from './tap';

Blaze.registerHelper('_', (...args) => {
  const { hash } = args.pop();
  const [key] = args.splice(0, 1);
  return TAPi18n.__(key, { ...hash, sprintf: args });
});
