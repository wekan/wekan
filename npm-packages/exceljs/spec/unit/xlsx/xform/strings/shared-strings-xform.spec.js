const fs = require('fs');

const testXformHelper = require('../test-xform-helper');

const SharedStringsXform = verquire('xlsx/xform/strings/shared-strings-xform');

const expectations = [
  {
    title: 'Shared Strings',
    create() {
      return new SharedStringsXform();
    },
    preparedModel: require('./data/sharedStrings.json'),
    xml: fs.readFileSync(`${__dirname}/data/sharedStrings.xml`).toString(),
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('SharedStringsXform', () => {
  testXformHelper(expectations);
});
