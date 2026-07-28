// ============================================================================
// The SWC helpers the LEGACY client bundle needs — imported AND USED, so they
// are actually in it.
//
// wekan/wekan#6534 / #6535 / #6556: WeKan in Yandex Browser dies at load with
//
//   Cannot find module '@swc/helpers/_/_possible_constructor_return'
//
// An older browser is served `web.browser.legacy`, where SWC compiles classes
// down to ES5 and emits imports of its own runtime helpers. The built legacy
// bundle DOES contain `link("@swc/helpers/_/_possible_constructor_return", …)` -
// the app asks for it - while the module tree beside it holds the OTHER helper
// directories and not that one, so the module system cannot resolve what the code
// imports and the whole app fails to start. (The modern bundle is unaffected:
// nothing there is transformed that far.)
//
// FIRST ATTEMPT, and why it did nothing (#6556, still broken in 10.45): this file
// listed the helpers as side-effect-only imports -
//
//     import '@swc/helpers/_/_possible_constructor_return';
//
// - and `@swc/helpers` declares `"sideEffects": false`. That is a promise to the
// bundler that importing a module of this package changes nothing, so an import
// whose bindings are never read may be removed entirely. It was: the file
// compiled to nothing, the package directory was never pulled in, and the bundle
// was exactly as before.
//
// So every helper is BOUND and then USED below. The array is written to a global,
// which is an observable effect no optimizer may remove, and reading each binding
// is what forces the module - and therefore the package subdirectory the runtime
// asks for - into the bundle.
//
// Why import the `_/` path and not `esm/`: the transform emits
// `@swc/helpers/_/_x`, so that is the path the runtime resolves, and only an
// import of THAT path puts it in the module tree. (Node's own resolver would
// refuse it - the package's `exports` map has no `./_/*` entry - but Meteor's
// module system resolves the directory through its package.json `main`, which is
// what the legacy bundle does at runtime.)
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
