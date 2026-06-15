/* eslint-env mocha */
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

// #3392: guard that every dependency REST route is documented with the OpenAPI
// JSDoc annotations the generator (openapi/generate_openapi.py) consumes, so new
// routes are picked up in the published API docs. Reads the source rather than
// running the (python/esprima) generator so it works in the plain mocha runner.
describe('dependencies REST OpenAPI annotations', function () {
  const file = path.join(process.cwd(), 'server/models/dependencies.js');
  const src = fs.readFileSync(file, 'utf8');

  // Each WebApp.handlers.<method>('<path>' route and the comment block above it.
  const routeRe = /\/\*\*([\s\S]*?)\*\/\s*WebApp\.handlers\.(get|post|put|delete)\(\s*'([^']+)'/g;

  function collectRoutes() {
    const routes = [];
    let m;
    while ((m = routeRe.exec(src)) !== null) {
      routes.push({ doc: m[1], method: m[2], routePath: m[3] });
    }
    return routes;
  }

  it('finds all five dependency REST routes', function () {
    const paths = collectRoutes().map(r => `${r.method.toUpperCase()} ${r.routePath}`);
    expect(paths).to.include.members([
      'GET /api/boards/:boardId/dependencies',
      'GET /api/boards/:boardId/cards/:cardId/dependencies',
      'POST /api/boards/:boardId/cards/:cardId/dependencies',
      'PUT /api/boards/:boardId/cards/:cardId/dependencies/:targetId',
      'DELETE /api/boards/:boardId/cards/:cardId/dependencies/:targetId',
    ]);
  });

  it('every route has @operation, @tag Dependencies and @summary', function () {
    const routes = collectRoutes();
    expect(routes.length).to.be.at.least(5);
    routes.forEach(({ doc, routePath }) => {
      expect(doc, `@operation missing for ${routePath}`).to.match(/@operation\s+\w+/);
      expect(doc, `@tag Dependencies missing for ${routePath}`).to.match(/@tag\s+Dependencies/);
      expect(doc, `@summary missing for ${routePath}`).to.match(/@summary\s+\S+/);
    });
  });

  it('every WebApp.handlers route in the file is documented (no undocumented route)', function () {
    const documented = collectRoutes().length;
    const total = (src.match(/WebApp\.handlers\.(get|post|put|delete)\(/g) || []).length;
    expect(documented).to.equal(total);
  });

  it('operation ids are unique', function () {
    const ids = collectRoutes()
      .map(r => (r.doc.match(/@operation\s+(\w+)/) || [])[1])
      .filter(Boolean);
    expect(new Set(ids).size).to.equal(ids.length);
  });
});
