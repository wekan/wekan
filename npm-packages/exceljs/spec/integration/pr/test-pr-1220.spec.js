const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  it('pull request 1220 - The worksheet should not be undefined', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('./spec/integration/data/test-pr-1220.xlsx');
    const ws = wb.getWorksheet(1);
    expect(ws).to.not.equal(undefined);
  });
});
