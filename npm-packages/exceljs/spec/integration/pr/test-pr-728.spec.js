const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  it('pull request 728 - Read worksheet hidden state', () => {
    const wb = new ExcelJS.Workbook();
    return wb.xlsx
      .readFile('./spec/integration/data/test-pr-728.xlsx')
      .then(() => {
        const expected = {1: 'visible', 2: 'hidden', 3: 'visible'};
        wb.eachSheet((ws, sheetId) => {
          expect(ws.state).to.equal(expected[sheetId]);
        });
      });
  });
});
