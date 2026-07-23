'use strict';

// Pure, dependency-free helpers for the i18n loader (imports/i18n/tap.js),
// extracted so the tricky module-unwrap and the timeout guard are unit-testable
// in plain Node without Meteor/i18next. Related to #6503: a hung or failed
// dynamic import() of a language file must never leave i18n permanently stuck.

// Unwrap a dynamic `import()` result that may be an ES-module namespace
// ({ default: {...}, __esModule: true } or a [Symbol.toStringTag]==='Module'
// object) into the bare translation map.
//
// NB: the translation data ITSELF contains a key literally named "default"
// (value "Default"/"Standard"), so we must NOT unwrap merely because a `default`
// property exists — only a genuine module namespace is unwrapped (#5756).
function unwrapI18nModule(data) {
  const isModuleNamespace =
    data &&
    typeof data === 'object' &&
    (data.__esModule === true || data[Symbol.toStringTag] === 'Module') &&
    data.default &&
    typeof data.default === 'object';
  return isModuleNamespace ? data.default : data;
}

// Race a promise against a timeout. The returned promise settles with the input
// promise if it settles within `ms`, otherwise it REJECTS with a timeout Error.
// Used so a hung dynamic import() of the default language file can never leave
// TAPi18n.ready stuck false (the UI would show raw keys forever) — after the
// timeout the caller falls back to the statically-bundled English (#6503).
function promiseWithTimeout(promise, ms, timeoutMessage) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(v);
    };
    const timer = setTimeout(
      () => finish(reject, new Error(timeoutMessage || `timed out after ${ms}ms`)),
      ms,
    );
    Promise.resolve(promise).then(
      v => finish(resolve, v),
      e => finish(reject, e),
    );
  });
}

export { unwrapI18nModule, promiseWithTimeout };
