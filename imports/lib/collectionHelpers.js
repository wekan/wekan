/**
 * Collection helper functions replacing underscore.js utilities.
 * These are used across both client and server code.
 */

/**
 * Find the first object in an array where all key-value pairs in `props` match.
 * Replacement for _.findWhere(arr, props)
 */
export function findWhere(arr, props) {
  if (!arr) return undefined;
  const keys = Object.keys(props);
  return arr.find(item => keys.every(k => item[k] === props[k]));
}

/**
 * Find all objects in an array where all key-value pairs in `props` match.
 * Replacement for _.where(arr, props)
 */
export function where(arr, props) {
  if (!arr) return [];
  const keys = Object.keys(props);
  return arr.filter(item => keys.every(k => item[k] === props[k]));
}

/**
 * Deduplicate an array of objects by a property name, keeping first occurrence.
 * Replacement for _.uniq(arr, prop)
 */
export function uniqBy(arr, prop) {
  if (!arr) return [];
  const seen = new Set();
  return arr.filter(item => {
    const val = item[prop];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

/**
 * Group an array by a property name or function.
 * Replacement for _.groupBy(arr, keyOrFn)
 */
export function groupBy(arr, keyOrFn) {
  if (!arr) return {};
  const getKey = typeof keyOrFn === 'function' ? keyOrFn : item => item[keyOrFn];
  const result = {};
  for (const item of arr) {
    const key = getKey(item);
    (result[key] || (result[key] = [])).push(item);
  }
  return result;
}

/**
 * Index an array by a property, mapping each key to a single item (last wins).
 * Replacement for _.indexBy(arr, prop)
 */
export function indexBy(arr, prop) {
  if (!arr) return {};
  const result = {};
  for (const item of arr) {
    result[item[prop]] = item;
  }
  return result;
}

/**
 * Create a debounced version of a function.
 * Replacement for _.debounce(fn, wait)
 */
export function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
}

/**
 * Create a function that executes at most once.
 * Replacement for _.once(fn)
 */
export function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (called) return result;
    called = true;
    result = fn.apply(this, args);
    return result;
  };
}
