'use strict';

const chai = require('chai');

process.env.EXCEL_NATIVE = 'yes';

const verquire = require('../../../utils/verquire');

const tools = require('../../../utils/tools');

const Excel = verquire('exceljs');

const {expect} = chai;

const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';
const RT_ARR = [
  {text: 'First Line:\n', font: {bold: true}},
  {text: 'Second Line\n'},
  {text: 'Third Line\n'},
  {text: 'Last Line'},
];
const TEST_VALUE = {
  richText: RT_ARR,
};
const TEST_NOTE = {
  texts: RT_ARR,
};

describe('pr related issues', () => {
  describe('pr 896 add xml:space="preserve" for all whitespaces', () => {
    it('should store cell text and comment with leading new line', () => {
      const properties = tools.fix(
        require('../../../utils/data/sheet-properties.json')
      );
      const pageSetup = tools.fix(
        require('../../../utils/data/page-setup.json')
      );

      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('sheet1', {
        properties,
        pageSetup,
      });

      ws.getColumn(1).width = 20;
      ws.getCell('A1').value = TEST_VALUE;
      ws.getCell('A1').note = TEST_NOTE;
      ws.getCell('A1').alignment = {wrapText: true};

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new Excel.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('sheet1');
          expect(ws2).to.not.be.undefined();
          expect(ws2.getCell('A1').value).to.deep.equal(TEST_VALUE);
        });
    });
  });
});
