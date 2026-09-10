// Minimal ESM loader hook that stubs the Meteor-package and other
// non-node-testable imports pulled in by client/lib/filter.js, so its real
// SetFilter/Filter logic can be exercised directly under plain `node` (no
// Meteor build) by tests/labelFilterThreeState.test.cjs (#2886).
//
// Only the pieces filter.js's `import` list actually touches when exercising
// SetFilter/Filter (Blaze.registerHelper, Tracker.Dependency, Session.get,
// boardScopedFilterSelector) are given real-enough behaviour; everything else
// is a no-op so the module can load without a running Meteor app.

const STUBS = {
  'meteor/blaze': `
    export const Blaze = { registerHelper() {} };
  `,
  'meteor/tracker': `
    export class Dependency {
      changed() {}
      depend() {}
    }
    export const Tracker = { Dependency };
  `,
  'meteor/session': `
    const store = new Map();
    export const Session = {
      get: key => store.get(key),
      set: (key, val) => store.set(key, val),
    };
  `,
  '/imports/reactiveCache': `
    export const ReactiveCache = {};
  `,
  '/imports/lib/dateUtils': `
    const passthrough = () => undefined;
    export const formatDateTime = passthrough;
    export const formatDate = passthrough;
    export const formatTime = passthrough;
    export const getISOWeek = passthrough;
    export const isValidDate = passthrough;
    export const isBefore = passthrough;
    export const isAfter = passthrough;
    export const isSame = passthrough;
    export const add = passthrough;
    export const subtract = passthrough;
    export const startOf = passthrough;
    export const endOf = passthrough;
    export const format = passthrough;
    export const parseDate = passthrough;
    export const now = passthrough;
    export const createDate = passthrough;
    export const fromNow = passthrough;
    export const calendar = passthrough;
  `,
  '/imports/lib/advancedFilter': `
    export const tokenizeAdvancedFilter = () => [];
    export const parseAdvancedFilterDate = () => null;
    export const buildDateValueSelector = () => ({});
    export const advancedFilterCommandsToSelector = () => ({});
  `,
  '/models/lib/weekStart': `
    export const weekRange = () => ({});
  `,
  '/models/lib/boardScopedSelection': `
    // Real behaviour isn't needed for these tests: pass the filter selector
    // through unchanged, ignoring the board-id scoping.
    export const boardScopedFilterSelector = selector => selector;
  `,
};

export async function resolve(specifier, context, nextResolve) {
  if (Object.prototype.hasOwnProperty.call(STUBS, specifier)) {
    return { url: `meteor-stub:${specifier}`, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('meteor-stub:')) {
    const specifier = url.slice('meteor-stub:'.length);
    return {
      format: 'module',
      source: STUBS[specifier],
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
