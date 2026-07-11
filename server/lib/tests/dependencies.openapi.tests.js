/* eslint-env mocha */
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

// #3392: guard that every dependency REST route is documented with the OpenAPI
// JSDoc annotations the generator (openapi/generate_openapi.py) consumes, so new
// routes are picked up in the published API docs. Reads the source rather than
// running the (python/esprima) generator so it works in the plain mocha runner.
describe('dependencies REST OpenAPI annotations', function () {
  let routes = [];
  let total = 0;

  // Read the source in a hook (not at describe-collection time) so a path/fs
  // problem fails only this suite instead of aborting the whole test bundle.
  before(function () {
    // Under `meteor test` the server runs from the built bundle, so process.cwd()
    // is not the repo root. Locate the source by walking up from several seeds
    // (cwd, and the shell PWD where meteor was launched) until we find it.
    // NOTE: do not reference the bare `__dirname` global here. This file is an ES
    // module (it uses top-level `import`), and Meteor/Node 24 injects
    // `const __dirname = fileURLToPath(import.meta.url)` for ESM files that use
    // `__dirname`. That collides with the `__dirname` Meteor's CommonJS module
    // wrapper already provides, crashing the whole server bundle at boot with
    // "Identifier '__dirname' has already been declared". PWD (the directory
    // `meteor` was launched from) is the seed that actually reaches the repo root.
    const rel = 'server/models/dependencies.js';
    const seeds = [process.cwd(), process.env.PWD].filter(Boolean);
    let src = null;
    for (const seed of seeds) {
      let dir = seed;
      for (let i = 0; i < 12; i += 1) {
        try {
          src = fs.readFileSync(path.join(dir, rel), 'utf8');
          break;
        } catch (e) {
          // walk up
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
      if (src !== null) break;
    }
    if (src === null) {
      // Source genuinely not reachable from this runtime (e.g. a fully bundled
      // deploy). Skip rather than fail: this is a source-annotation guard.
      this.skip();
      return;
    }

    const routeRe = /\/\*\*([\s\S]*?)\*\/\s*WebApp\.handlers\.(get|post|put|delete)\(\s*'([^']+)'/g;
    let m;
    while ((m = routeRe.exec(src)) !== null) {
      routes.push({ doc: m[1], method: m[2], routePath: m[3] });
    }
    total = (src.match(/WebApp\.handlers\.(get|post|put|delete)\(/g) || []).length;
  });

  it('finds all five dependency REST routes', function () {
    const paths = routes.map(r => `${r.method.toUpperCase()} ${r.routePath}`);
    expect(paths).to.include.members([
      'GET /api/boards/:boardId/dependencies',
      'GET /api/boards/:boardId/cards/:cardId/dependencies',
      'POST /api/boards/:boardId/cards/:cardId/dependencies',
      'PUT /api/boards/:boardId/cards/:cardId/dependencies/:targetId',
      'DELETE /api/boards/:boardId/cards/:cardId/dependencies/:targetId',
    ]);
  });

  it('every route has @operation, @tag Dependencies and @summary', function () {
    expect(routes.length).to.be.at.least(5);
    routes.forEach(({ doc, routePath }) => {
      expect(doc, `@operation missing for ${routePath}`).to.match(/@operation\s+\w+/);
      expect(doc, `@tag Dependencies missing for ${routePath}`).to.match(/@tag\s+Dependencies/);
      expect(doc, `@summary missing for ${routePath}`).to.match(/@summary\s+\S+/);
    });
  });

  it('every WebApp.handlers route in the file is documented (no undocumented route)', function () {
    expect(routes.length).to.equal(total);
  });

  it('operation ids are unique', function () {
    const ids = routes
      .map(r => (r.doc.match(/@operation\s+(\w+)/) || [])[1])
      .filter(Boolean);
    expect(new Set(ids).size).to.equal(ids.length);
  });
});
