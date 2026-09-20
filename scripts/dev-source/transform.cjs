'use strict';

const swc = require('@swc/core');

// Preserve import()'s module-namespace contract. SWC's CommonJS wildcard helper
// has no Module tag; JSON containing a literal "default" key then looks like a
// translation map instead of a namespace to the application's i18n loader.
const dynamicHelper = `
function __wekanSourceImport(request) {
  return Promise.resolve().then(function () {
    const value = require(request);
    if (value && (value.__esModule || value[Symbol.toStringTag] === 'Module')) return value;
    return Object.assign(Object.create(null), value, {default: value, [Symbol.toStringTag]: 'Module'});
  });
}
`;
function transform(source, filename, sourceMaps = false) {
  const ast = swc.parseSync(source, {
    syntax: 'ecmascript',
    jsx: true,
    target: 'es2022'
  });
  const pending = [ast];
  // CommonJS dependencies may deliberately use sloppy-mode semantics. Adding
  // a directive changes their behavior; only ES modules are implicitly strict.
  // An explicit source directive remains intact in either kind of module.
  const isESModule = ast.body.some(node => /^(ImportDeclaration|Export)/.test(node.type));
  let hasDynamic = false;
  while (pending.length) {
    const node = pending.pop();
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'CallExpression' && node.callee.type === 'Import') {
      node.callee = {
        type: 'Identifier',
        span: node.callee.span,
        ctxt: 0,
        value: '__wekanSourceImport',
        optional: false
      };
      hasDynamic = true;
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) pending.push(...value);else if (value && typeof value === 'object') pending.push(value);
    }
  }
  const result = swc.transformSync(ast, {
    filename,
    jsc: {
      target: 'es2022'
    },
    module: {
      type: 'commonjs',
      strictMode: isESModule
    },
    sourceMaps
  });
  // Keep SWC's strict-mode directive and source-map line positions intact.
  // Function declarations are hoisted, so imports can call the helper below.
  return result.code + (hasDynamic ? dynamicHelper : '');
}
module.exports = {
  transform
};
