const testXformHelper = require('../../test-xform-helper');

const FormulaXform = verquire('xlsx/xform/sheet/cf/formula-xform');

const expectations = [
  {
    title: 'formula',
    create() {
      return new FormulaXform();
    },
    preparedModel: 'ROW()',
    xml: '<formula>ROW()</formula>',
    parsedModel: 'ROW()',
    tests: ['render', 'parse'],
  },
];

describe('FormulaXform', () => {
  testXformHelper(expectations);
});
