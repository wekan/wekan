const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  it('issue 2125 - spliceRows remove last row', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet();
    ws.addRows([['1st'], ['2nd'], ['3rd']]);

    ws.spliceRows(ws.rowCount, 1);

    expect(ws.getRow(ws.rowCount).getCell(1).value).to.equal('2nd');
  });
});
