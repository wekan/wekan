// In this file we define a set of DOM transformations that are specifically
// intended for blind screen readers.
//
// See https://github.com/wekan/wekan/issues/337 for the general accessibility
// considerations.

// Without an href, links are non-keyboard-focusable and are not presented on
// blind screen readers. We default to the empty anchor `#` href.
function enforceHref(attributes) {
  if (! _.has(attributes, 'href')) {
    attributes.href = '#';
  }
  return attributes;
}

// `title` is inconsistently used on the web, and is thus inconsistently
// presented by screen readers. `aria-label`, on the other hand, is specific to
// accessibility and is presented in ways that title shouldn't be.
function copyTitleInAriaLabel(attributes) {
  if (! _.has(attributes, 'aria-label') && _.has(attributes, 'title')) {
    attributes['aria-label'] = attributes.title;
  }
  return attributes;
}

// XXX Our implementation relies on overwriting Blaze virtual DOM functions,
// which is a little bit hacky -- but still reasonable with our ES6 usage. If we
// end up switching to React we will probably create lower level small
// components to handle that without overwriting any build-in function.
const {
  A: superA,
  I: superI,
} = HTML;

HTML.A = (attributes, ...others) => {
  return superA(copyTitleInAriaLabel(enforceHref(attributes)), ...others);
}

HTML.I = (attributes, ...others) => {
  return superI(copyTitleInAriaLabel(attributes), ...others);
}
