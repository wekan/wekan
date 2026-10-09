/* eslint-disable import/no-extraneous-dependencies,node/no-unpublished-require */
require('core-js/modules/es.promise');
require('core-js/modules/es.promise.finally');
require('core-js/modules/es.object.assign');
require('core-js/modules/es.object.keys');
require('core-js/modules/es.object.values');
require('core-js/modules/es.symbol');
require('core-js/modules/es.symbol.async-iterator');
// required by core-js/modules/es.promise Promise.all
require('core-js/modules/es.array.iterator');
// required by node_modules/saxes/saxes.js SaxesParser.captureTo
require('core-js/modules/es.array.includes');
// required by lib/doc/workbook.js Workbook.model
require('core-js/modules/es.array.find-index');
// required by lib/doc/workbook.js Workbook.addWorksheet and Workbook.getWorksheet
require('core-js/modules/es.array.find');
// required by node_modules/saxes/saxes.js SaxesParser.getCode10
require('core-js/modules/es.string.from-code-point');
// required by lib/xlsx/xform/sheet/data-validations-xform.js DataValidationsXform.parseClose
require('core-js/modules/es.string.includes');
// required by lib/utils/utils.js utils.validInt and lib/csv/csv.js CSV.read
require('core-js/modules/es.number.is-nan');
require('regenerator-runtime/runtime');

const ExcelJS = {
  Workbook: require('./doc/workbook'),
};

// Object.assign mono-fill
const Enums = require('./doc/enums');

Object.keys(Enums).forEach(key => {
  ExcelJS[key] = Enums[key];
});

module.exports = ExcelJS;
