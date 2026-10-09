const testXformHelper = require('../test-xform-helper');

const DimensionXform = verquire('xlsx/xform/sheet/dimension-xform');

const expectations = [
  {
    title: 'Dimension',
    create() {
      return new DimensionXform();
    },
    preparedModel: 'A1:F5',
    get parsedModel() {
      return this.preparedModel;
    },
    xml: '<dimension ref="A1:F5"/>',
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('DimensionXform', () => {
  testXformHelper(expectations);
});
