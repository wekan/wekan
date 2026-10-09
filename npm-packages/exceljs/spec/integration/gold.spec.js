const ExcelJS = verquire('exceljs');

// =============================================================================
// This spec is based around a gold standard Excel workbook 'gold.xlsx'

describe('Gold Book', () => {
  describe('Read', () => {
    let wb;
    before(() => {
      wb = new ExcelJS.Workbook();
      return wb.xlsx.readFile(`${__dirname}/data/gold.xlsx`);
    });

    it('Values', () => {
      const ws = wb.getWorksheet('Values');

      expect(ws.getCell('B1').value).to.equal('I am Text');
      expect(ws.getCell('B2').value).to.equal(3.14);
      expect(ws.getCell('B3').value).to.equal(5);
      // const b4 = ws.getCell('B4').value;
      // console.log(typeof b4, b4);
      expect(ws.getCell('B4').value).to.equalDate(
        new Date('2016-05-17T00:00:00.000Z')
      );
      expect(ws.getCell('B5').value).to.deep.equal({
        formula: 'B1',
        result: 'I am Text',
      });

      expect(ws.getCell('B6').value).to.deep.equal({
        hyperlink: 'https://www.npmjs.com/package/exceljs',
        text: 'exceljs',
      });

      expect(ws.lastColumn).to.equal(ws.getColumn(2));
      expect(ws.lastRow).to.equal(ws.getRow(6));
    });

    it('Styles', () => {});
  });
});
