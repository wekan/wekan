const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  it('issue 257 - worksheet order is not respected', () => {
    const wb = new ExcelJS.Workbook();
    return wb.xlsx
      .readFile('./spec/integration/data/test-issue-257.xlsx')
      .then(() => {
        expect(wb.worksheets.map(ws => ws.name)).to.deep.equal([
          'First',
          'Second',
        ]);
      });
  });
});
