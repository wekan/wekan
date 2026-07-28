// ============================================================================
// WeKan Client Entry Point
//
// Side-effect imports keep bootstrap order explicit without relying on
// browser-side CommonJS require().
// ============================================================================

// 0. Browser shim that MUST run before any module pulls in bson: bson 7.x calls
//    `process.getBuiltinModule('v8')` at load time, which throws in the browser
//    (partial `process` polyfill) and aborts the bundle bootstrap, leaving later
//    features (notifications, swimlanes, …) unregistered so boards do not render.
import '/client/lib/bsonBrowserShim';

// 0b. The SWC runtime helpers the LEGACY bundle's ES5 transform emits imports
//     for. They are linked by the transformed code but only INCLUDED if the
//     scanner saw an import first, and one of them was not: an older browser
//     (Yandex) died at load with "Cannot find module
//     '@swc/helpers/_/_possible_constructor_return'" (wekan/wekan-snap#178).
//     First, so a helper is present before anything transformed runs.
import '/client/lib/swcHelpers';

// 1. Bootstrap — helpers polyfill (SimpleSchema is server-only)
import '/imports/collectionHelpers';

// 2. Eagerly load all app styles
import '/client/styles';

// 3. Load all application code
import '/client/imports';
