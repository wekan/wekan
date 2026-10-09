const testXformHelper = require('../test-xform-helper');

const CellPositionXform = verquire('xlsx/xform/drawing/cell-position-xform');

const expectations = [
  {
    title: 'integers',
    create() {
      return new CellPositionXform({tag: 'xdr:from'});
    },
    preparedModel: {
      nativeRow: 5,
      nativeRowOff: 0,
      nativeCol: 7,
      nativeColOff: 0,
    },
    xml:
      '<xdr:from><xdr:col>7</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>5</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>',
    parsedModel: {
      nativeRow: 5,
      nativeRowOff: 0,
      nativeCol: 7,
      nativeColOff: 0,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'halves',
    create() {
      return new CellPositionXform({tag: 'xdr:to'});
    },
    preparedModel: {
      nativeRow: 5,
      nativeRowOff: 90000,
      nativeCol: 7,
      nativeColOff: 320000,
    },
    xml:
      '<xdr:to><xdr:col>7</xdr:col><xdr:colOff>320000</xdr:colOff><xdr:row>5</xdr:row><xdr:rowOff>90000</xdr:rowOff></xdr:to>',
    parsedModel: {
      nativeRow: 5,
      nativeRowOff: 90000,
      nativeCol: 7,
      nativeColOff: 320000,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('CellPositionXform', () => {
  testXformHelper(expectations);
});
