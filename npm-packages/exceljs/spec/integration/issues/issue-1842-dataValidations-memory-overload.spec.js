const {join} = require('path');
const {readFileSync} = require('fs');

const ExcelJS = verquire('exceljs');

const fileName = './spec/integration/data/test-issue-1842.xlsx';

describe('github issues', () => {
  describe('issue 1842 - Memory overload when unnecessary dataValidations apply', () => {
    it('when using readFile', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(fileName, {
        ignoreNodes: ['dataValidations'],
      });

      // arriving here is success
      expect(true).to.equal(true);
    });

    it('when loading an in memory buffer', async () => {
      const filePath = join(process.cwd(), fileName);
      const buffer = readFileSync(filePath);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer, {
        ignoreNodes: ['dataValidations'],
      });

      // arriving here is success
      expect(true).to.equal(true);
    });
  });
});
