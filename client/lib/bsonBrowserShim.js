// Browser shim for `process.getBuiltinModule`, imported FIRST in the client
// entry so it runs before any module that pulls in bson.
//
// Regression (after the mongodb/bson 7.3.0 bump): bson 7.x evaluates, at module
// load time,
//
//     const { startupSnapshot } = globalThis?.process?.getBuiltinModule('v8') ?? {};
//
// The optional chaining stops BEFORE the call, so when a partial `process`
// polyfill is present (Meteor/rspack provide one in the browser) but has no
// `getBuiltinModule`, the call throws `TypeError: getBuiltinModule is not a
// function`. That throw happens while `client/components/cards/attachments.js`
// (`import { ObjectId } from 'bson'`) is being evaluated, which aborts the
// client bundle bootstrap partway through `client/imports.js` — every feature
// imported after it (notifications, rules, swimlanes, …) is never registered,
// so the board view throws `No such template: notifications` and renders
// nothing.
//
// Installing a no-op `getBuiltinModule` makes bson take its intended browser
// fallback (`?? {}`): there is no V8 startup snapshot in a browser, so
// `undefined` is the correct value.

/**
 * Ensure `glob.process.getBuiltinModule` is callable. Only adds the method when
 * a `process` object exists but lacks it (the exact browser-polyfill case);
 * never overwrites a real Node implementation. Returns true when it installed
 * the shim.
 *
 * @param {*} glob a global-like object (e.g. globalThis)
 * @returns {boolean}
 */
export function installGetBuiltinModuleShim(glob) {
  if (
    glob &&
    glob.process &&
    typeof glob.process.getBuiltinModule !== 'function'
  ) {
    try {
      glob.process.getBuiltinModule = () => undefined;
      return true;
    } catch (e) {
      // `process` may be frozen in some environments — nothing more we can do.
      return false;
    }
  }
  return false;
}

installGetBuiltinModuleShim(typeof globalThis !== 'undefined' ? globalThis : undefined);
