const testXformHelper = require('../test-xform-helper');

const SharedStringXform = verquire('xlsx/xform/strings/shared-string-xform');

const expectations = [
  {
    title: 'text',
    create() {
      return new SharedStringXform();
    },
    preparedModel: 'Hello, World!',
    xml: '<si><t>Hello, World!</t></si>',
    parsedModel: 'Hello, World!',
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'rich text',
    create() {
      return new SharedStringXform();
    },
    preparedModel: {
      richText: [
        {
          font: {
            size: 11,
            bold: true,
            color: {theme: 1},
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
          text: 'Bold,',
        },
      ],
    },
    xml:
      '<si><r><rPr><b/><color theme="1"/><family val="2"/><scheme val="minor"/><sz val="11"/><rFont val="Calibri"/></rPr><t>Bold,</t></r></si>',
    parsedModel: {
      richText: [
        {
          font: {
            size: 11,
            bold: true,
            color: {theme: 1},
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
          text: 'Bold,',
        },
      ],
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'richText is empty',
    create() {
      return new SharedStringXform();
    },
    preparedModel: {
      richText: [],
    },
    xml: '<si><t></t></si>',
    parsedModel: '',
    tests: ['parse'],
  },
  {
    title: 'text + phonetic',
    create() {
      return new SharedStringXform();
    },
    preparedModel: {
      text: 'Hello, World!',
      phoneticText: {text: 'Helow woruld'},
    },
    xml:
      '<si><t>Hello, World!</t><rPh eb="0" sb="0"><t>Helow woruld</t></rPh></si>',
    parsedModel: 'Hello, World!',
    tests: ['parse'],
  },
  {
    title: 'Kanji + Katakana',
    create() {
      return new SharedStringXform();
    },
    preparedModel: {
      text: '役割',
      phoneticText: {
        sb: 0,
        eb: 2,
        text: 'ヤクワリ',
        properties: {fontId: 1},
      },
    },
    xml:
      '<si><t>役割</t><rPh sb="0" eb="2"><t>ヤクワリ</t></rPh><phoneticPr fontId="1" /></si>',
    parsedModel: '役割',
    tests: ['parse'],
  },
  {
    title: 'text with newline',
    create() {
      return new SharedStringXform();
    },
    preparedModel: 'Hello,\nWorld!',
    xml: '<si><t xml:space="preserve">Hello,\nWorld!</t></si>',
    parsedModel: 'Hello,\nWorld!',
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('SharedStringXform', () => {
  testXformHelper(expectations);
});
