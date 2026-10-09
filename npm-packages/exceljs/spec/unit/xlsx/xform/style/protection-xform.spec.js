const testXformHelper = require('../test-xform-helper');

const ProtectionXform = verquire('xlsx/xform/style/protection-xform');

const expectations = [
  {
    title: 'Empty',
    create: () => new ProtectionXform(),
    preparedModel: {},
    xml: '',
    tests: ['render', 'renderIn'],
  },
  {
    title: 'Locked',
    create: () => new ProtectionXform(),
    preparedModel: {locked: true, hidden: false},
    xml: '',
    parsedModel: {},
    tests: ['render', 'renderIn'],
  },
  {
    title: 'Unlocked',
    create: () => new ProtectionXform(),
    preparedModel: {locked: false, hidden: false},
    xml: '<protection locked="0"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Hidden',
    create: () => new ProtectionXform(),
    preparedModel: {locked: true, hidden: true},
    xml: '<protection hidden="1"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Unlocked and Hidden',
    create: () => new ProtectionXform(),
    preparedModel: {locked: false, hidden: true},
    xml: '<protection locked="0" hidden="1"/>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('ProtectionXform', () => {
  testXformHelper(expectations);
});
