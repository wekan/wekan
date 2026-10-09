const testXformHelper = require('../test-xform-helper');

const StyleXform = verquire('xlsx/xform/style/style-xform');

const expectations = [
  {
    title: 'Default',
    create() {
      return new StyleXform();
    },
    preparedModel: {numFmtId: 0, fontId: 0, fillId: 0, borderId: 0},
    xml: '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Default with xfId',
    create() {
      return new StyleXform({xfId: true});
    },
    preparedModel: {numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, xfId: 0},
    xml: '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Aligned',
    create() {
      return new StyleXform({xfId: true});
    },
    preparedModel: {
      numFmtId: 0,
      fontId: 0,
      fillId: 0,
      borderId: 0,
      xfId: 0,
      alignment: {horizontal: 'center', vertical: 'middle'},
    },
    xml:
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Font',
    create() {
      return new StyleXform({xfId: true});
    },
    preparedModel: {numFmtId: 0, fontId: 5, fillId: 0, borderId: 0, xfId: 0},
    xml:
      '<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Border',
    create() {
      return new StyleXform({xfId: true});
    },
    preparedModel: {numFmtId: 0, fontId: 0, fillId: 0, borderId: 7, xfId: 0},
    xml:
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="7" xfId="0" applyBorder="1"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'NumFmt',
    create() {
      return new StyleXform({xfId: true});
    },
    preparedModel: {numFmtId: 1, fontId: 0, fillId: 0, borderId: 0, xfId: 0},
    xml:
      '<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Fill',
    create() {
      return new StyleXform({xfId: true});
    },
    preparedModel: {numFmtId: 0, fontId: 0, fillId: 2, borderId: 0, xfId: 0},
    xml:
      '<xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Protected',
    create() {
      return new StyleXform({xfId: true});
    },
    preparedModel: {
      numFmtId: 0,
      fontId: 0,
      fillId: 0,
      borderId: 0,
      xfId: 0,
      alignment: {horizontal: 'center', vertical: 'middle'},
      protection: {locked: false},
    },
    xml:
      '<xf borderId="1" fillId="10" fontId="3" numFmtId="0" xfId="0" applyProtection="1" applyAlignment="1" applyFill="1" applyBorder="1" applyFont="1"><protection locked="0"/><alignment horizontal="center" vertical="center"/></xf>',
    parsedModel: {
      borderId: 1,
      fillId: 10,
      fontId: 3,
      numFmtId: 0,
      xfId: 0,
      alignment: {horizontal: 'center', vertical: 'middle'},
      protection: {locked: false, hidden: false},
    },
    tests: ['parse', 'parseIn'],
  },
];

describe('StyleXform', () => {
  testXformHelper(expectations);
});
