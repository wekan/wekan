const testXformHelper = require('../test-xform-helper');

const WorkbookViewXform = verquire('xlsx/xform/book/workbook-view-xform');

const expectations = [
  {
    title: 'Normal',
    create() {
      return new WorkbookViewXform();
    },
    preparedModel: {},
    xml:
      '<workbookView xWindow="0" yWindow="0" windowWidth="12000" windowHeight="24000"/>',
    parsedModel: {
      x: 0,
      y: 0,
      width: 12000,
      height: 24000,
      visibility: 'visible',
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Hidden',
    create() {
      return new WorkbookViewXform();
    },
    preparedModel: {visibility: 'hidden'},
    xml:
      '<workbookView visibility="hidden" xWindow="0" yWindow="0" windowWidth="12000" windowHeight="24000"/>',
    parsedModel: {
      visibility: 'hidden',
      x: 0,
      y: 0,
      width: 12000,
      height: 24000,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Active Tab & First Sheet',
    create() {
      return new WorkbookViewXform();
    },
    preparedModel: {activeTab: 2, firstSheet: 3},
    xml:
      '<workbookView xWindow="0" yWindow="0" windowWidth="12000" windowHeight="24000" activeTab="2" firstSheet="3"/>',
    parsedModel: {
      visibility: 'visible',
      x: 0,
      y: 0,
      width: 12000,
      height: 24000,
      activeTab: 2,
      firstSheet: 3,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('WorkbookViewXform', () => {
  testXformHelper(expectations);
});
