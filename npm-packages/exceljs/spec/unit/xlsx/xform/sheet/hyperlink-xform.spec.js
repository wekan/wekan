const testXformHelper = require('../test-xform-helper');

const HyperlinkXform = verquire('xlsx/xform/sheet/hyperlink-xform');

const expectations = [
  {
    title: 'Web Link',
    create() {
      return new HyperlinkXform();
    },
    preparedModel: {address: 'B6', rId: 'rId1'},
    get parsedModel() {
      return this.preparedModel;
    },
    xml: '<hyperlink ref="B6" r:id="rId1"/>',
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Internal Link',
    create() {
      return new HyperlinkXform();
    },
    preparedModel: {address: 'B6', rId: 'rId1', target: 'sheet1!B2'},
    get parsedModel() {
      return this.preparedModel;
    },
    xml: '<hyperlink ref="B6" r:id="rId1" location="sheet1!B2"/>',
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('HyperlinkXform', () => {
  testXformHelper(expectations);
});
