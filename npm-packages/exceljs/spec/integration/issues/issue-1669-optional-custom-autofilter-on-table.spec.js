const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  it('issue 1669 - optional autofilter and custom autofilter on tables', () => {
    const wb = new ExcelJS.Workbook();
    return wb.xlsx.readFile('./spec/integration/data/test-issue-1669.xlsx');
  }).timeout(6000);
});
