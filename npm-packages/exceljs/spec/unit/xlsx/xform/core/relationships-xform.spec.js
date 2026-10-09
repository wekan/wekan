const fs = require('fs');

const testXformHelper = require('../test-xform-helper');

const RelationshipsXform = verquire('xlsx/xform/core/relationships-xform');

const expectations = [
  {
    title: 'worksheet.rels',
    create() {
      return new RelationshipsXform();
    },
    preparedModel: require('./data/worksheet.rels.1.json'),
    xml: fs
      .readFileSync(`${__dirname}/data/worksheet.rels.xml`)
      .toString()
      .replace(/\r\n/g, '\n'),
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('RelationshipsXform', () => {
  testXformHelper(expectations);
});
