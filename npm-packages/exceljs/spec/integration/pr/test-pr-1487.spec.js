const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  describe('pull request 1487 - lastColumn with an empty column', () => {
    it('Reading 1904.xlsx', () => {
      const wb = new ExcelJS.Workbook();
      return wb.xlsx.readFile('./spec/integration/data/1904.xlsx').then(() => {
        const ws = wb.getWorksheet('Sheet1');
        expect(ws.lastColumn).to.equal(ws.getColumn(2));
      });
    });
  });
  // the new property is also tested in gold.spec.js
});
