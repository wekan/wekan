const testXformHelper = require('../test-xform-helper');

const PhoneticTextXform = verquire('xlsx/xform/strings/phonetic-text-xform');

const expectations = [
  {
    title: 'text',
    create() {
      return new PhoneticTextXform();
    },
    preparedModel: {text: 'Hello, World!', sb: 0, eb: 1},
    xml: '<rPh sb="0" eb="1"><t>Hello, World!</t></rPh>',
    parsedModel: {text: 'Hello, World!', sb: 0, eb: 1},
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Katakana',
    create() {
      return new PhoneticTextXform();
    },
    preparedModel: {sb: 0, eb: 2, text: 'ヤクワリ'},
    xml: '<rPh sb="0" eb="2"><t>ヤクワリ</t></rPh>',
    parsedModel: {sb: 0, eb: 2, text: 'ヤクワリ'},
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('PhoneticTextXform', () => {
  testXformHelper(expectations);
});
