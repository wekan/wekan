const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  it('issue 991 - differentiates between strings with leading numbers and dates when reading csv files', () => {
    const wb = new ExcelJS.Workbook();
    return wb.csv
      .readFile('./spec/integration/data/test-issue-991.csv')
      .then(worksheet => {
        expect(worksheet.getCell('A1').value.toString()).to.equal(
          new Date('2019-11-04T00:00:00').toString()
        );
        expect(worksheet.getCell('A2').value.toString()).to.equal(
          new Date('2019-11-04T00:00:00').toString()
        );
        expect(worksheet.getCell('A3').value.toString()).to.equal(
          new Date('2019-11-04T10:17:55').toString()
        );
        expect(worksheet.getCell('A4').value).to.equal('00210PRG1');
        expect(worksheet.getCell('A5').value).to.equal('1234-5thisisnotadate');
      });
  });
});
