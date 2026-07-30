// ============================================================================
// The SWC runtime helpers, bundled into the client — a diagnostic and a belt,
// NOT the fix. The fix for the crash below is `/.swcrc`; read on before touching
// either.
//
// wekan/wekan#6534 / #6535 / #6556 / #6557: WeKan in Yandex Browser dies at load
// with
//
//   Uncaught Error: Cannot find module '@swc/helpers/_/_possible_constructor_return'
//       at w (…) at a.resolve (…) at a.s [as link] (…)
//       at client-rspack.js (…:285:985)
//       at client-meteor.js (…:285:86)
//
// WHAT ACTUALLY HAPPENS, from the frames outward. `client-meteor.js` is Meteor's
// client mainModule and its last line is `import './client-rspack.js'`; that
// `link()` runs the rspack bundle as a Meteor module, and the failing `link()` is
// in `client-rspack.js` itself. So the import of the helper is in the copy of the
// rspack bundle that METEOR compiled - it is not in the bundle rspack wrote (the
// built `_build/main-prod/client-rspack.js` contains no `@swc/helpers` specifier
// at all). Meteor put it there:
//
//   * package.json says `"meteor": { "modern": true }`, which turns on Meteor
//     3.3+'s SWC transpiler for every file, app and package alike;
//   * `packages/babel-compiler/babel-compiler.js` sets `jsc.externalHelpers: true`
//     whenever `node_modules/@swc/helpers` exists - and WeKan depends on it - so
//     the transpiled output IMPORTS its helpers instead of inlining them;
//   * for `web.browser.legacy` that transpile has no `jsc.target` and an
//     `env.targets` down to `ie: '11'`, so `class` is lowered to ES5 and the
//     output gains `import { _ } from "@swc/helpers/_/_possible_constructor_return"`;
//   * that specifier is not in the legacy bundle's module tree, so the `link()`
//     throws and the whole app fails to boot. The MODERN bundle is fine: nothing
//     there is lowered that far, and where a helper IS needed the modern module
//     runtime resolves `mainFields: ['browser','module','main']` (the `esm/` file)
//     while the legacy one prefers `main` (`../../cjs/_x.cjs`).
//
// Only a browser served the legacy bundle can hit it, which is why it looked
// Yandex-specific: `useragent-ng` reports Yandex Browser as family
// "Yandex Browser" → `webapp` camel-cases that to `yandexBrowser`, and
// `modern-browsers` has no minimum and no alias for that name, so `isModern()` is
// false. server/modernBrowsers.js fixes that side of it.
//
// WHY THE EARLIER ATTEMPTS COULD NOT WORK. #6534/#6535 imported the helpers as
// bare side-effect imports here; `@swc/helpers` declares `"sideEffects": false`,
// so the bundler was free to delete them, and did. #6556 bound and read every
// helper so nothing could be dropped - and 10.51 failed identically, because
// THIS FILE IS IN THE RSPACK GRAPH. rspack resolves these imports and inlines the
// helper bodies into `client-rspack.js`; they never become entries in Meteor's own
// module tree, which is the tree the failing `link()` searches. No amount of
// importing from app code can satisfy a link that Meteor's transpiler wrote after
// the fact.
//
// THE FIX is to stop the import being emitted at all: `/.swcrc` sets
// `jsc.externalHelpers: false`, so SWC inlines each helper into the file that
// needs it. Both readers of that file merge it over their defaults and neither
// preserves `jsc.externalHelpers` (Meteor's `deepMerge` keeps only `jsc.target`,
// `env.targets` and `module.type`; @meteorjs/rspack's only `jsc.target`), so the
// setting takes effect for the Meteor transpile and the rspack build alike.
//
// WHAT THIS FILE IS FOR NOW. `window.__wekanSwcHelpers` says in one word whether
// the helpers reached the bundle, which is the first thing to ask if this ever
// comes back; and the imports keep the helper modules present in the rspack graph,
// where they have always resolved correctly. Every binding is still BOUND and READ,
// because `sideEffects: false` has not changed and an unread import may be deleted.
// ============================================================================

// Classes and inheritance - the ES5 downlevel of `class`, `extends`, `super`.
import { _ as _class_call_check } from '@swc/helpers/_/_class_call_check';
import { _ as _create_class } from '@swc/helpers/_/_create_class';
import { _ as _inherits } from '@swc/helpers/_/_inherits';
import { _ as _call_super } from '@swc/helpers/_/_call_super';
import { _ as _possible_constructor_return } from '@swc/helpers/_/_possible_constructor_return';
import { _ as _assert_this_initialized } from '@swc/helpers/_/_assert_this_initialized';
import { _ as _get_prototype_of } from '@swc/helpers/_/_get_prototype_of';
import { _ as _set_prototype_of } from '@swc/helpers/_/_set_prototype_of';
import { _ as _is_native_reflect_construct } from '@swc/helpers/_/_is_native_reflect_construct';
import { _ as _construct } from '@swc/helpers/_/_construct';
import { _ as _wrap_native_super } from '@swc/helpers/_/_wrap_native_super';
import { _ as _get } from '@swc/helpers/_/_get';
import { _ as _super_prop_base } from '@swc/helpers/_/_super_prop_base';
import { _ as _class_private_field_get } from '@swc/helpers/_/_class_private_field_get';
import { _ as _class_private_field_set } from '@swc/helpers/_/_class_private_field_set';
import { _ as _define_property } from '@swc/helpers/_/_define_property';
import { _ as _instanceof } from '@swc/helpers/_/_instanceof';
import { _ as _type_of } from '@swc/helpers/_/_type_of';

// Destructuring, spread and iteration.
import { _ as _sliced_to_array } from '@swc/helpers/_/_sliced_to_array';
import { _ as _to_consumable_array } from '@swc/helpers/_/_to_consumable_array';
import { _ as _to_array } from '@swc/helpers/_/_to_array';
import { _ as _array_with_holes } from '@swc/helpers/_/_array_with_holes';
import { _ as _array_without_holes } from '@swc/helpers/_/_array_without_holes';
import { _ as _array_like_to_array } from '@swc/helpers/_/_array_like_to_array';
import { _ as _iterable_to_array } from '@swc/helpers/_/_iterable_to_array';
import { _ as _iterable_to_array_limit } from '@swc/helpers/_/_iterable_to_array_limit';
import { _ as _non_iterable_rest } from '@swc/helpers/_/_non_iterable_rest';
import { _ as _non_iterable_spread } from '@swc/helpers/_/_non_iterable_spread';
import { _ as _unsupported_iterable_to_array } from '@swc/helpers/_/_unsupported_iterable_to_array';
import { _ as _object_spread } from '@swc/helpers/_/_object_spread';
import { _ as _object_spread_props } from '@swc/helpers/_/_object_spread_props';
import { _ as _object_without_properties } from '@swc/helpers/_/_object_without_properties';
import { _ as _object_without_properties_loose } from '@swc/helpers/_/_object_without_properties_loose';
import { _ as _extends } from '@swc/helpers/_/_extends';

// async / await and generators.
import { _ as _async_to_generator } from '@swc/helpers/_/_async_to_generator';
import { _ as _ts_generator } from '@swc/helpers/_/_ts_generator';
import { _ as _async_iterator } from '@swc/helpers/_/_async_iterator';
import { _ as _await_async_generator } from '@swc/helpers/_/_await_async_generator';
import { _ as _wrap_async_generator } from '@swc/helpers/_/_wrap_async_generator';
import { _ as _async_generator_delegate } from '@swc/helpers/_/_async_generator_delegate';
import { _ as _ts_values } from '@swc/helpers/_/_ts_values';

// Every binding above, read. `sideEffects: false` lets a bundler drop an import
// nobody reads; it may not drop one whose value ends up somewhere observable.
const SWC_RUNTIME_HELPERS = [
  _class_call_check, _create_class, _inherits, _call_super,
  _possible_constructor_return, _assert_this_initialized, _get_prototype_of,
  _set_prototype_of, _is_native_reflect_construct, _construct, _wrap_native_super,
  _get, _super_prop_base, _class_private_field_get, _class_private_field_set,
  _define_property, _instanceof, _type_of,

  _sliced_to_array, _to_consumable_array, _to_array, _array_with_holes,
  _array_without_holes, _array_like_to_array, _iterable_to_array,
  _iterable_to_array_limit, _non_iterable_rest, _non_iterable_spread,
  _unsupported_iterable_to_array, _object_spread, _object_spread_props,
  _object_without_properties, _object_without_properties_loose, _extends,

  _async_to_generator, _ts_generator, _async_iterator, _await_async_generator,
  _wrap_async_generator, _async_generator_delegate, _ts_values,
];

// The observable effect. It is also useful on its own: in a browser that fails
// this way again, `window.__wekanSwcHelpers` in the console says whether the
// helpers reached the bundle at all.
if (typeof window !== 'undefined') {
  window.__wekanSwcHelpers = SWC_RUNTIME_HELPERS.filter(
    helper => typeof helper === 'function',
  ).length;
}

export default SWC_RUNTIME_HELPERS;
