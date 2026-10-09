const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  it('issue 176 - Unexpected xml node in parseOpen', () => {
    const wb = new ExcelJS.Workbook();
    return wb.xlsx
      .readFile('./spec/integration/data/test-issue-176.xlsx')
      .then(() => {
        // arriving here is success
        expect(true).to.equal(true);
      });
  });
});
