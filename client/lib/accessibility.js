// In this file we define a set of DOM transformations that are specifically
// intended for blind screen readers.
//
// See https://github.com/wekan/wekan/issues/337 for the general accessibility
// considerations.

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function visibleFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter(element => element.offsetParent !== null && !element.closest('.no-height'));
}

export function focusFirstControl(container) {
  if (!container) return null;
  const target = container.querySelector('[autofocus]') ||
    visibleFocusableElements(container)[0] || container;
  if (target === container && !container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '-1');
  }
  target.focus();
  return target;
}

export function trapTabKey(event, container = event.currentTarget) {
  if (event.key !== 'Tab') return false;
  const controls = visibleFocusableElements(container);
  if (!controls.length) {
    event.preventDefault();
    focusFirstControl(container);
    return true;
  }

  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

export function tabIndexForKey(event, currentIndex, tabCount) {
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || tabCount < 1) {
    return null;
  }
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    return (currentIndex + 1) % tabCount;
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    return (currentIndex - 1 + tabCount) % tabCount;
  }
  if (event.key === 'Home') return 0;
  if (event.key === 'End') return tabCount - 1;
  if (event.key === 'Enter' || event.key === ' ') return currentIndex;
  return null;
}

// Without an href, links are non-keyboard-focusable and are not presented on
// blind screen readers. We default to the empty anchor `#` href.
function enforceHref(attributes) {
  if (!Object.hasOwn(attributes, 'href')) {
    attributes.href = '#';
  }
  return attributes;
}

// `title` is inconsistently used on the web, and is thus inconsistently
// presented by screen readers. `aria-label`, on the other hand, is specific to
// accessibility and is presented in ways that title shouldn't be.
function copyTitleInAriaLabel(attributes) {
  if (!Object.hasOwn(attributes, 'aria-label') && Object.hasOwn(attributes, 'title')) {
    attributes['aria-label'] = attributes.title;
  }
  return attributes;
}

// XXX Our implementation relies on overwriting Blaze virtual DOM functions,
// which is a little bit hacky -- but still reasonable with our ES6 usage. If we
// end up switching to React we will probably create lower level small
// components to handle that without overwriting any build-in function.
const { A: superA, I: superI } = HTML;

HTML.A = (attributes, ...others) => {
  return superA(copyTitleInAriaLabel(enforceHref(attributes)), ...others);
};

HTML.I = (attributes, ...others) => {
  return superI(copyTitleInAriaLabel(attributes), ...others);
};
