const ExcelJS = verquire('exceljs');

const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';

describe('github issues', () => {
  it('issue 1027 - Broken due to Cannot set property \'marked\' of undefined error', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');

    const range = 'A2:A1048576';

    ws.dataValidations.model[range] = {
      allowBlank: true,
      error: 'Please use the drop down to select a valid value',
      errorTitle: 'Invalid Selection',
      formulae: ['"Apples,Bananas,Oranges"'],
      showErrorMessage: true,
      type: 'list',
    };

    return wb.xlsx.writeFile(TEST_XLSX_FILE_NAME);
  });
});
