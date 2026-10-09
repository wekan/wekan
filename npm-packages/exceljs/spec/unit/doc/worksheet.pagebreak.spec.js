const Excel = verquire('exceljs');

describe('Worksheet', () => {
  describe('Page Breaks', () => {
    it('adds multiple row breaks', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');

      // initial values
      ws.getCell('A1').value = 'A1';
      ws.getCell('B1').value = 'B1';
      ws.getCell('A2').value = 'A2';
      ws.getCell('B2').value = 'B2';
      ws.getCell('A3').value = 'A3';
      ws.getCell('B3').value = 'B3';

      let row = ws.getRow(1);
      row.addPageBreak();
      row = ws.getRow(2);
      row.addPageBreak();

      expect(ws.rowBreaks.length).to.equal(2);
    });
  });
});
