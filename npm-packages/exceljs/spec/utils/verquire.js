// this module allows the specs to switch between source code and
// transpiled code depending on the environment variable EXCEL_BUILD

/* eslint-disable import/no-dynamic-require */

const libs = {};
const basePath = (function() {
  const nodeMajorVersion = parseInt(process.versions.node.split('.')[0], 10);
  if (process.env.EXCEL_BUILD === 'es5' || nodeMajorVersion < 10) {
    require('core-js/modules/es.promise');
    require('core-js/modules/es.object.assign');
    require('core-js/modules/es.object.keys');
    require('core-js/modules/es.symbol');
    require('core-js/modules/es.symbol.async-iterator');
    require('regenerator-runtime/runtime');
    libs.exceljs = require('../../dist/es5');
    return '../../dist/es5/';
  }
  libs.exceljs = require('../../lib/exceljs.nodejs');
  return '../../lib/';
})();

module.exports = function verquire(path) {
  if (!libs[path]) {
    libs[path] = require(basePath + path);
  }
  return libs[path];
};
