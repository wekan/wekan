const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  describe('pull request 1576 - inlineStr cell type support', () => {
    it('Reading test-issue-1575.xlsx', () => {
      const wb = new ExcelJS.Workbook();
      return wb.xlsx
        .readFile('./spec/integration/data/test-issue-1575.xlsx')
        .then(() => {
          const ws = wb.getWorksheet('Sheet1');
          expect(ws.getCell('A1').value).to.equal('A');
          expect(ws.getCell('B1').value).to.equal('B');
          expect(ws.getCell('C1').value).to.equal('C');
          expect(ws.getCell('A2').value).to.equal('1.0');
          expect(ws.getCell('B2').value).to.equal('2.0');
          expect(ws.getCell('C2').value).to.equal('3.0');
          expect(ws.getCell('A3').value).to.equal('4.0');
          expect(ws.getCell('B3').value).to.equal('5.0');
          expect(ws.getCell('C3').value).to.equal('6.0');
        });
    });
  });
});
