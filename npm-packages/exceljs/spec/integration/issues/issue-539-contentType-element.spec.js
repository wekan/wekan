const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  describe('issue 539 - <contentType /> element', () => {
    it('Reading 1904.xlsx', () => {
      const wb = new ExcelJS.Workbook();
      return wb.xlsx.readFile(
        './spec/integration/data/1519293514-KRISHNAPATNAM_LINE_UP.xlsx'
      );
    });
  });
});
