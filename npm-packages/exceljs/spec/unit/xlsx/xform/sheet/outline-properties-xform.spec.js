const testXformHelper = require('../test-xform-helper');

const OutlinePropertiesXform = verquire(
  'xlsx/xform/sheet/outline-properties-xform'
);

const expectations = [
  {
    title: 'empty',
    create() {
      return new OutlinePropertiesXform();
    },
    preparedModel: {},
    xml: '',
    parsedModel: {},
    tests: ['render', 'renderIn'],
  },
  {
    title: 'summaryBelow',
    create() {
      return new OutlinePropertiesXform();
    },
    preparedModel: {summaryBelow: false},
    xml: '<outlinePr summaryBelow="0"/>',
    parsedModel: {summaryBelow: false},
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'summaryRight',
    create() {
      return new OutlinePropertiesXform();
    },
    preparedModel: {summaryRight: false},
    xml: '<outlinePr summaryRight="0"/>',
    parsedModel: {summaryRight: false},
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'summaryRight',
    create() {
      return new OutlinePropertiesXform();
    },
    preparedModel: {summaryBelow: true, summaryRight: false},
    xml: '<outlinePr summaryBelow="1" summaryRight="0"/>',
    parsedModel: {summaryBelow: true, summaryRight: false},
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('OutlinePropertiesXform', () => {
  testXformHelper(expectations);
});
