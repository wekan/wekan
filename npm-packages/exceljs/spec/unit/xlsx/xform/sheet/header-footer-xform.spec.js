const testXformHelper = require('../test-xform-helper');

const HeaderFooterXform = verquire('xlsx/xform/sheet/header-footer-xform');

const expectations = [
  {
    title: 'set oddHeader',
    create: () => new HeaderFooterXform(),
    preparedModel: {
      oddHeader: '&CExceljs',
    },
    xml: '<headerFooter><oddHeader>&amp;CExceljs</oddHeader></headerFooter>',
    parsedModel: {
      oddHeader: '&CExceljs',
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'set oddFooter',
    create: () => new HeaderFooterXform(),
    preparedModel: {
      oddFooter: '&CExceljs',
    },
    xml: '<headerFooter><oddFooter>&amp;CExceljs</oddFooter></headerFooter>',
    parsedModel: {
      oddFooter: '&CExceljs',
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'set oddHeader position',
    create: () => new HeaderFooterXform(),
    preparedModel: {
      oddHeader: '&LExceljs',
    },
    xml: '<headerFooter><oddHeader>&amp;LExceljs</oddHeader></headerFooter>',
    parsedModel: {
      oddHeader: '&LExceljs',
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'set firstFooter',
    create: () => new HeaderFooterXform(),
    preparedModel: {
      differentFirst: true,
      oddHeader: '&CExceljs',
      oddFooter: '&CExceljs',
      firstHeader: '&CHome',
      firstFooter: '&CHome',
    },
    xml:
      '<headerFooter differentFirst="1"><oddFooter>&amp;CExceljs</oddFooter><firstFooter>&amp;CHome</firstFooter><oddHeader>&amp;CExceljs</oddHeader><firstHeader>&amp;CHome</firstHeader></headerFooter>',
    parsedModel: {
      differentFirst: true,
      oddHeader: '&CExceljs',
      oddFooter: '&CExceljs',
      firstHeader: '&CHome',
      firstFooter: '&CHome',
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'set differentOddEven',
    create: () => new HeaderFooterXform(),
    preparedModel: {
      differentOddEven: true,
      oddHeader: '&Codd Header',
      oddFooter: '&Codd Footer',
      evenHeader: '&Ceven Header',
      evenFooter: '&Ceven Footer',
    },
    xml:
      '<headerFooter differentOddEven="1"><oddHeader>&amp;Codd Header</oddHeader><oddFooter>&amp;Codd Footer</oddFooter><evenHeader>&amp;Ceven Header</evenHeader><evenFooter>&amp;Ceven Footer</evenFooter></headerFooter>',
    parsedModel: {
      differentOddEven: true,
      oddHeader: '&Codd Header',
      oddFooter: '&Codd Footer',
      evenHeader: '&Ceven Header',
      evenFooter: '&Ceven Footer',
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'set font style',
    create: () => new HeaderFooterXform(),
    preparedModel: {
      oddFooter: '&C&B&KFF0000Red Bold',
    },
    xml:
      '<headerFooter><oddFooter>&amp;C&amp;B&amp;KFF0000Red Bold</oddFooter></headerFooter>',
    parsedModel: {
      oddFooter: '&C&B&KFF0000Red Bold',
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('HeaderFooterXform', () => {
  testXformHelper(expectations);
});
