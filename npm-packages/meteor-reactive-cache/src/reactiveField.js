import DataCache from './DataCache';
import ejson from './meteor/ejson';

export default (fn, compare) => {
  const cache = new DataCache((key) => fn(...ejson.parse(key)), compare);
  const resolver = (...args) => cache.get(ejson.stringify(args));
  resolver.cache = cache;
  return resolver;
};
