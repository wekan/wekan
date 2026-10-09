const testXformHelper = require('../test-xform-helper');

const BorderXform = verquire('xlsx/xform/style/border-xform');

const expectations = [
  {
    title: 'Empty',
    create() {
      return new BorderXform();
    },
    preparedModel: {},
    xml: '<border><left/><right/><top/><bottom/><diagonal/></border>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Thin Red Box',
    create() {
      return new BorderXform();
    },
    preparedModel: {
      left: {color: {argb: 'FFFF0000'}, style: 'thin'},
      right: {color: {argb: 'FFFF0000'}, style: 'thin'},
      top: {color: {argb: 'FFFF0000'}, style: 'thin'},
      bottom: {color: {argb: 'FFFF0000'}, style: 'thin'},
    },
    xml:
      '<border><left style="thin"><color rgb="FFFF0000"/></left><right style="thin"><color rgb="FFFF0000"/></right><top style="thin"><color rgb="FFFF0000"/></top><bottom style="thin"><color rgb="FFFF0000"/></bottom><diagonal/></border>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Dotted colourless Box',
    create() {
      return new BorderXform();
    },
    preparedModel: {
      left: {style: 'dotted'},
      right: {style: 'dotted'},
      top: {style: 'dotted'},
      bottom: {style: 'dotted'},
    },
    xml:
      '<border><left style="dotted"/><right style="dotted"/><top style="dotted"/><bottom style="dotted"/><diagonal/></border>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Cross',
    create() {
      return new BorderXform();
    },
    preparedModel: {diagonal: {style: 'thin', up: true, down: true}},
    xml:
      '<border diagonalUp="1" diagonalDown="1"><left/><right/><top/><bottom/><diagonal style="thin"/></border>',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Missing Style',
    create() {
      return new BorderXform();
    },
    preparedModel: {
      left: {color: {argb: 'FFFF0000'}},
      right: {color: {argb: 'FFFF0000'}},
      top: {color: {argb: 'FFFF0000'}, style: 'medium'},
      bottom: {color: {argb: 'FFFF0000'}, style: 'medium'},
    },
    xml:
      '<border><left/><right/><top style="medium"><color rgb="FFFF0000"/></top><bottom style="medium"><color rgb="FFFF0000"/></bottom><diagonal/></border>',
    tests: ['render', 'renderIn'],
  },
  {
    title: 'Missing Style',
    create() {
      return new BorderXform();
    },
    xml:
      '<border><left><color rgb="FFFF0000"/></left><right><color rgb="FFFF0000"/></right><top style="medium"><color rgb="FFFF0000"/></top><bottom style="medium"><color rgb="FFFF0000"/></bottom><diagonal/></border>',
    parsedModel: {
      left: {color: {argb: 'FFFF0000'}},
      right: {color: {argb: 'FFFF0000'}},
      top: {color: {argb: 'FFFF0000'}, style: 'medium'},
      bottom: {color: {argb: 'FFFF0000'}, style: 'medium'},
    },
    tests: ['parse'],
  },
];

describe('BorderXform', () => {
  testXformHelper(expectations);
});
