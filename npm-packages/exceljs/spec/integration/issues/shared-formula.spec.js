const Enums = verquire('doc/enums');
const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  describe('Shared Formulas', () => {
    describe('issue xyz - cells copied as a block treat formulas as values', () => {
      const explain =
        'this fails, although the cells look the same in excel. Both cells are created by copying A3:B3 to A4:F19. The first row in the new block work as espected, the rest only has values (when seen through exceljs)';
      it('copied cells should have the right formulas', () => {
        const wb = new ExcelJS.Workbook();
        return wb.xlsx
          .readFile('./spec/integration/data/fibonacci.xlsx')
          .then(() => {
            const ws = wb.getWorksheet('fib');
            expect(ws.getCell('A4').value).to.deep.equal({
              formula: 'A3+1',
              shareType: 'shared',
              ref: 'A4:A19',
              result: 4,
            });
            expect(ws.getCell('A5').value).to.deep.equal(
              {sharedFormula: 'A4', result: 5},
              explain
            );
          });
      });
      it('copied cells should have the right types', () => {
        const wb = new ExcelJS.Workbook();
        return wb.xlsx
          .readFile('./spec/integration/data/fibonacci.xlsx')
          .then(() => {
            const ws = wb.getWorksheet('fib');
            expect(ws.getCell('A4').type).to.equal(Enums.ValueType.Formula);
            expect(ws.getCell('A5').type).to.equal(Enums.ValueType.Formula);
          });
      });
      it('copied cells should have the same fields', () => {
        // to see if there are other fields on the object worth comparing
        const wb = new ExcelJS.Workbook();
        return wb.xlsx
          .readFile('./spec/integration/data/fibonacci.xlsx')
          .then(() => {
            const ws = wb.getWorksheet('fib');
            const A4 = ws.getCell('A4');
            const A5 = ws.getCell('A5');
            expect(Object.keys(A4).join()).to.equal(Object.keys(A5).join());
          });
      });
    });
  });
});
