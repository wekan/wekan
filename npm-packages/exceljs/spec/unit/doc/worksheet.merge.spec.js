const testUtils = require('../../utils/index');

const Excel = verquire('exceljs');
const Dimensions = verquire('doc/range');

describe('Worksheet', () => {
  describe('Merge Cells', () => {
    it('references the same top-left value', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');

      // initial values
      ws.getCell('A1').value = 'A1';
      ws.getCell('B1').value = 'B1';
      ws.getCell('A2').value = 'A2';
      ws.getCell('B2').value = 'B2';

      ws.mergeCells('A1:B2');

      expect(ws.getCell('A1').value).to.equal('A1');
      expect(ws.getCell('B1').value).to.equal('A1');
      expect(ws.getCell('A2').value).to.equal('A1');
      expect(ws.getCell('B2').value).to.equal('A1');

      expect(ws.getCell('A1').type).to.equal(Excel.ValueType.String);
      expect(ws.getCell('B1').type).to.equal(Excel.ValueType.Merge);
      expect(ws.getCell('A2').type).to.equal(Excel.ValueType.Merge);
      expect(ws.getCell('B2').type).to.equal(Excel.ValueType.Merge);
    });

    it('does not allow overlapping merges', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');

      ws.mergeCells('B2:C3');

      // intersect four corners
      expect(() => {
        ws.mergeCells('A1:B2');
      }).to.throw(Error);
      expect(() => {
        ws.mergeCells('C1:D2');
      }).to.throw(Error);
      expect(() => {
        ws.mergeCells('C3:D4');
      }).to.throw(Error);
      expect(() => {
        ws.mergeCells('A3:B4');
      }).to.throw(Error);

      // enclosing
      expect(() => {
        ws.mergeCells('A1:D4');
      }).to.throw(Error);
    });

    it('merges and unmerges', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');

      const expectMaster = function(range, master) {
        const d = new Dimensions(range);
        for (let i = d.top; i <= d.bottom; i++) {
          for (let j = d.left; j <= d.right; j++) {
            const cell = ws.getCell(i, j);
            const masterCell = master ? ws.getCell(master) : cell;
            expect(cell.master.address).to.equal(masterCell.address);
          }
        }
      };

      // merge some cells, then unmerge them
      ws.mergeCells('A1:B2');
      expectMaster('A1:B2', 'A1');
      ws.unMergeCells('A1:B2');
      expectMaster('A1:B2', null);

      // unmerge just one cell
      ws.mergeCells('A1:B2');
      expectMaster('A1:B2', 'A1');
      ws.unMergeCells('A1');
      expectMaster('A1:B2', null);

      ws.mergeCells('A1:B2');
      expectMaster('A1:B2', 'A1');
      ws.unMergeCells('B2');
      expectMaster('A1:B2', null);

      // build 4 merge-squares
      ws.mergeCells('A1:B2');
      ws.mergeCells('D1:E2');
      ws.mergeCells('A4:B5');
      ws.mergeCells('D4:E5');

      expectMaster('A1:B2', 'A1');
      expectMaster('D1:E2', 'D1');
      expectMaster('A4:B5', 'A4');
      expectMaster('D4:E5', 'D4');

      // unmerge the middle
      ws.unMergeCells('B2:D4');

      expectMaster('A1:B2', null);
      expectMaster('D1:E2', null);
      expectMaster('A4:B5', null);
      expectMaster('D4:E5', null);
    });

    it('does not allow overlapping merges', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');

      ws.mergeCells('B2:C3');

      // intersect four corners
      expect(() => {
        ws.mergeCells('A1:B2');
      }).to.throw(Error);
      expect(() => {
        ws.mergeCells('C1:D2');
      }).to.throw(Error);
      expect(() => {
        ws.mergeCells('C3:D4');
      }).to.throw(Error);
      expect(() => {
        ws.mergeCells('A3:B4');
      }).to.throw(Error);

      // enclosing
      expect(() => {
        ws.mergeCells('A1:D4');
      }).to.throw(Error);
    });

    it('merges styles', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');

      // initial value
      const B2 = ws.getCell('B2');
      B2.value = 5;
      B2.style.font = testUtils.styles.fonts.broadwayRedOutline20;
      B2.style.border = testUtils.styles.borders.doubleRed;
      B2.style.fill = testUtils.styles.fills.blueWhiteHGrad;
      B2.style.alignment = testUtils.styles.namedAlignments.middleCentre;
      B2.style.numFmt = testUtils.styles.numFmts.numFmt1;

      // expecting styles to be copied (see worksheet spec)
      ws.mergeCells('B2:C3');

      expect(ws.getCell('B2').font).to.deep.equal(
        testUtils.styles.fonts.broadwayRedOutline20
      );
      expect(ws.getCell('B2').border).to.deep.equal(
        testUtils.styles.borders.doubleRed
      );
      expect(ws.getCell('B2').fill).to.deep.equal(
        testUtils.styles.fills.blueWhiteHGrad
      );
      expect(ws.getCell('B2').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('B2').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt1
      );

      expect(ws.getCell('B3').font).to.deep.equal(
        testUtils.styles.fonts.broadwayRedOutline20
      );
      expect(ws.getCell('B3').border).to.deep.equal(
        testUtils.styles.borders.doubleRed
      );
      expect(ws.getCell('B3').fill).to.deep.equal(
        testUtils.styles.fills.blueWhiteHGrad
      );
      expect(ws.getCell('B3').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('B3').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt1
      );

      expect(ws.getCell('C2').font).to.deep.equal(
        testUtils.styles.fonts.broadwayRedOutline20
      );
      expect(ws.getCell('C2').border).to.deep.equal(
        testUtils.styles.borders.doubleRed
      );
      expect(ws.getCell('C2').fill).to.deep.equal(
        testUtils.styles.fills.blueWhiteHGrad
      );
      expect(ws.getCell('C2').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('C2').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt1
      );

      expect(ws.getCell('C3').font).to.deep.equal(
        testUtils.styles.fonts.broadwayRedOutline20
      );
      expect(ws.getCell('C3').border).to.deep.equal(
        testUtils.styles.borders.doubleRed
      );
      expect(ws.getCell('C3').fill).to.deep.equal(
        testUtils.styles.fills.blueWhiteHGrad
      );
      expect(ws.getCell('C3').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('C3').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt1
      );
    });

    it('preserves merges after row inserts', function() {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('testMergeAfterInsert');

      ws.addRow([1, 2]);
      ws.addRow([3, 4]);
      ws.mergeCells('A1:B2');
      ws.insertRow(1, ['Inserted Row Text']);

      const r2 = ws.getRow(2);
      const r3 = ws.getRow(3);

      const cellVals = [];
      for (const r of [r2, r3]) {
        for (const cell of r._cells) {
          cellVals.push(cell._value);
        }
      }

      let nNumberVals = 0;
      let nMergeVals = 0;
      for (const cellVal of cellVals) {
        const {name} = cellVal.constructor;
        if (name === 'NumberValue') nNumberVals += 1;
        if (name === 'MergeValue' && cellVal.model.master === 'A2') {
          nMergeVals += 1;
        }
      }
      expect(nNumberVals).to.deep.equal(1);
      expect(nMergeVals).to.deep.equal(3);
    });
  });
});
