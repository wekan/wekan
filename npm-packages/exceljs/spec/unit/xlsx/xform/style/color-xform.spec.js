const testXformHelper = require('../test-xform-helper');

const ColorXform = verquire('xlsx/xform/style/color-xform');

const expectations = [
  {
    title: 'RGB',
    create: () => new ColorXform(),
    preparedModel: {argb: 'FF00FF00'},
    xml: '<color rgb="FF00FF00"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Theme',
    create: () => new ColorXform(),
    preparedModel: {theme: 1},
    xml: '<color theme="1"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Theme with Tint',
    create: () => new ColorXform(),
    preparedModel: {theme: 1, tint: 0.5},
    xml: '<color theme="1" tint="0.5"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Theme with Tint Zero',
    create: () => new ColorXform(),
    preparedModel: {theme: 0, tint: 0},
    xml: '<color theme="0" tint="0"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Indexed',
    create: () => new ColorXform(),
    preparedModel: {indexed: 1},
    xml: '<color indexed="1"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Indexed Zero',
    create: () => new ColorXform(),
    preparedModel: {indexed: 0},
    xml: '<color indexed="0"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Undefined',
    create: () => new ColorXform(),
    preparedModel: undefined,
    xml: '',
    tests: ['render', 'renderIn'],
  },
];

describe('ColorXform', () => {
  testXformHelper(expectations);
});
