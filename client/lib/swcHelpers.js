// ============================================================================
// The SWC helpers the LEGACY client bundle needs, imported so they are in it.
//
// wekan/wekan-snap#178: WeKan 10.44 in Yandex Browser died at load with
//
//   Cannot find module '@swc/helpers/_/_possible_constructor_return'
//
// An older browser is served `web.browser.legacy`, where SWC compiles classes
// down to ES5 and emits imports of its own runtime helpers. The built legacy
// bundle DOES contain `link("@swc/helpers/_/_possible_constructor_return", …)`
// - the app asks for it - but the module tree beside it holds 22 helper
// directories and NOT that one, so the module system cannot resolve what the
// code imports and the whole app fails to start. (The modern bundle is
// unaffected: nothing there is transformed down that far.)
//
// The reason is the order of the build: Meteor's scanner decides which files of
// an npm package to include from the imports it can SEE, and these imports are
// written by the SWC transform afterwards - so a helper that only the transform
// introduces can be linked without being included. `_call_super` happened to be
// pulled in through another helper's relative require and `_possible_constructor_return`
// was not, which is why exactly one was missing.
//
// Importing them here, from ordinary client code, is what the scanner does see.
// The list is the ES5 class/inheritance and iteration/spread set: those are the
// transforms a legacy target actually triggers, each helper is a few lines, and
// having them all removes the whole class of "it works until a class is written
// slightly differently" failure. tests/swcLegacyHelpers.test.cjs keeps the list
// and the reason from drifting apart.
// ============================================================================

// Classes and inheritance - the ES5 downlevel of `class`, `extends`, `super`.
import '@swc/helpers/_/_class_call_check';
import '@swc/helpers/_/_create_class';
import '@swc/helpers/_/_inherits';
import '@swc/helpers/_/_call_super';
import '@swc/helpers/_/_possible_constructor_return';
import '@swc/helpers/_/_assert_this_initialized';
import '@swc/helpers/_/_get_prototype_of';
import '@swc/helpers/_/_set_prototype_of';
import '@swc/helpers/_/_is_native_reflect_construct';
import '@swc/helpers/_/_construct';
import '@swc/helpers/_/_wrap_native_super';
import '@swc/helpers/_/_get';
import '@swc/helpers/_/_super_prop_base';
import '@swc/helpers/_/_class_private_field_get';
import '@swc/helpers/_/_class_private_field_set';
import '@swc/helpers/_/_define_property';
import '@swc/helpers/_/_instanceof';
import '@swc/helpers/_/_type_of';

// Destructuring, spread and iteration.
import '@swc/helpers/_/_sliced_to_array';
import '@swc/helpers/_/_to_consumable_array';
import '@swc/helpers/_/_to_array';
import '@swc/helpers/_/_array_with_holes';
import '@swc/helpers/_/_array_without_holes';
import '@swc/helpers/_/_array_like_to_array';
import '@swc/helpers/_/_iterable_to_array';
import '@swc/helpers/_/_iterable_to_array_limit';
import '@swc/helpers/_/_non_iterable_rest';
import '@swc/helpers/_/_non_iterable_spread';
import '@swc/helpers/_/_unsupported_iterable_to_array';
import '@swc/helpers/_/_object_spread';
import '@swc/helpers/_/_object_spread_props';
import '@swc/helpers/_/_object_without_properties';
import '@swc/helpers/_/_object_without_properties_loose';
import '@swc/helpers/_/_extends';

// async / await and generators.
import '@swc/helpers/_/_async_to_generator';
import '@swc/helpers/_/_ts_generator';
import '@swc/helpers/_/_async_iterator';
import '@swc/helpers/_/_await_async_generator';
import '@swc/helpers/_/_wrap_async_generator';
import '@swc/helpers/_/_async_generator_delegate';
import '@swc/helpers/_/_ts_values';
