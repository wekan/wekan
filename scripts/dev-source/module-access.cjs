'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Only imports present in client code may be requested. A caller cannot choose
// an arbitrary parent or use the development endpoint as a filesystem reader.
class ClientImports {
  constructor(root, parse) {
    this.root = fs.realpathSync(root);
    this.parse = parse;
    this.dependencies = new Map([['', new Set(['/client/main.js'])]]);
  }
  register(parent, code) {
    const requests = this.dependencies.get(parent) || new Set();
    const nodes = [this.parse(code, {
      syntax: 'ecmascript',
      target: 'es2022'
    })];
    while (nodes.length) {
      const node = nodes.pop();
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        const imported = callee.type === 'Identifier' && ['require', '__wekanSourceImport'].includes(callee.value) || callee.type === 'MemberExpression' && ['require', 'link', 'dynamicImport'].includes(callee.property?.value);
        if (imported && node.arguments[0]?.expression?.type === 'StringLiteral') {
          requests.add(node.arguments[0].expression.value);
        }
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) nodes.push(...value);else if (value && typeof value === 'object') nodes.push(value);
      }
    }
    this.dependencies.set(parent, requests);
  }
  authorize(request, parent = '') {
    if (typeof request !== 'string' || typeof parent !== 'string' || !this.dependencies.get(parent)?.has(request)) {
      throw new Error('Module is not a declared client import');
    }
  }
  file(filename) {
    const real = fs.realpathSync(filename);
    const relative = path.relative(this.root, real).replace(/\\/g, '/');
    // These pure helpers are already imported unconditionally by shared models.
    const sharedHelper = ['server/lib/cardCopyHelpers.js', 'server/lib/removeMember.js', 'server/lib/labelRemap.js'].includes(relative);
    // Never serve server, private, toolchain, dotfile or outside-checkout code.
    if (!sharedHelper && (!/^(client|imports|models|config|node_modules|npm-packages|packages)\//.test(relative) || relative.split('/').some(part => part.startsWith('.')) || /(^|\/)(server|private)\//.test(relative) || !/\.(js|mjs|cjs|json|jade|css)$/.test(relative) || /\.server\.[cm]?js$/.test(relative))) {
      throw new Error('File is outside the client source tree');
    }
    return relative;
  }
}
module.exports = {
  ClientImports
};
