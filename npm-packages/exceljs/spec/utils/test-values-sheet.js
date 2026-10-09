const tools = require('./tools');

const ExcelJS = verquire('exceljs');

const self = {
  testValues: tools.fix(require('./data/sheet-values.json')),
  styles: tools.fix(require('./data/styles.json')),
  properties: tools.fix(require('./data/sheet-properties.json')),
  pageSetup: tools.fix(require('./data/page-setup.json')),
  headerFooter: tools.fix(require('./data/header-footer.json')),

  addSheet(wb, options) {
    // call it sheet1 so this sheet can be used for csv testing
    const ws = wb.addWorksheet('sheet1', {
      properties: self.properties,
      pageSetup: self.pageSetup,
      headerFooter: self.headerFooter,
    });

    ws.getCell('J10').value = 1;
    ws.getColumn(10).outlineLevel = 1;
    ws.getRow(10).outlineLevel = 1;

    ws.getCell('A1').value = 7;
    ws.getCell('B1').value = self.testValues.str;
    ws.getCell('C1').value = self.testValues.date;
    ws.getCell('D1').value = self.testValues.formulas[0];
    ws.getCell('E1').value = self.testValues.formulas[1];
    ws.getCell('F1').value = self.testValues.hyperlink;
    ws.getCell('G1').value = self.testValues.str2;
    ws.getCell('H1').value = self.testValues.json.raw;
    ws.getCell('I1').value = true;
    ws.getCell('J1').value = false;
    ws.getCell('K1').value = self.testValues.Errors.NotApplicable;
    ws.getCell('L1').value = self.testValues.Errors.Value;

    ws.getRow(1).commit();

    // merge cell square with numerical value
    ws.getCell('A2').value = 5;
    ws.mergeCells('A2:B3');

    // merge cell square with null value
    ws.mergeCells('C2:D3');
    ws.getRow(3).commit();

    ws.getCell('A4').value = 1.5;
    ws.getCell('A4').numFmt = self.testValues.numFmt1;
    ws.getCell('A4').border = self.styles.borders.thin;
    ws.getCell('C4').value = 1.5;
    ws.getCell('C4').numFmt = self.testValues.numFmt2;
    ws.getCell('C4').border = self.styles.borders.doubleRed;
    ws.getCell('E4').value = 1.5;
    ws.getCell('E4').border = self.styles.borders.thickRainbow;
    ws.getRow(4).commit();

    // test fonts and formats
    ws.getCell('A5').value = self.testValues.str;
    ws.getCell('A5').font = self.styles.fonts.arialBlackUI14;
    ws.getCell('B5').value = self.testValues.str;
    ws.getCell('B5').font = self.styles.fonts.broadwayRedOutline20;
    ws.getCell('C5').value = self.testValues.str;
    ws.getCell('C5').font = self.styles.fonts.comicSansUdB16;

    ws.getCell('D5').value = 1.6;
    ws.getCell('D5').numFmt = self.testValues.numFmt1;
    ws.getCell('D5').font = self.styles.fonts.arialBlackUI14;

    ws.getCell('E5').value = 1.6;
    ws.getCell('E5').numFmt = self.testValues.numFmt2;
    ws.getCell('E5').font = self.styles.fonts.broadwayRedOutline20;

    ws.getCell('F5').value = self.testValues.date;
    ws.getCell('F5').numFmt = self.testValues.numFmtDate;
    ws.getCell('F5').font = self.styles.fonts.comicSansUdB16;
    ws.getRow(5).commit();

    ws.getRow(6).height = 42;
    self.styles.alignments.forEach((alignment, index) => {
      const rowNumber = 6;
      const colNumber = index + 1;
      const cell = ws.getCell(rowNumber, colNumber);
      cell.value = alignment.text;
      cell.alignment = alignment.alignment;
    });
    ws.getRow(6).commit();

    if (options.checkBadAlignments) {
      self.styles.badAlignments.forEach((alignment, index) => {
        const rowNumber = 7;
        const colNumber = index + 1;
        const cell = ws.getCell(rowNumber, colNumber);
        cell.value = alignment.text;
        cell.alignment = alignment.alignment;
      });
    }
    ws.getRow(7).commit();

    const row8 = ws.getRow(8);
    row8.height = 40;
    row8.getCell(1).value = 'Blue White Horizontal Gradient';
    row8.getCell(1).fill = self.styles.fills.blueWhiteHGrad;
    row8.getCell(2).value = 'Red Dark Vertical';
    row8.getCell(2).fill = self.styles.fills.redDarkVertical;
    row8.getCell(3).value = 'Red Green Dark Trellis';
    row8.getCell(3).fill = self.styles.fills.redGreenDarkTrellis;
    row8.getCell(4).value = 'RGB Path Gradient';
    row8.getCell(4).fill = self.styles.fills.rgbPathGrad;
    row8.commit();

    // Old Shared Formula
    ws.getCell('A9').value = 1;
    ws.getCell('B9').value = {formula: 'A9+1', result: 2};
    ws.getCell('C9').value = {sharedFormula: 'B9', result: 3};
    ws.getCell('D9').value = {sharedFormula: 'B9', result: 4};
    ws.getCell('E9').value = {sharedFormula: 'B9', result: 5};

    if (ws.fillFormula) {
      // Fill Formula Shared
      ws.fillFormula('A10:E10', 'A9', [1, 2, 3, 4, 5]);

      // Array Formula
      ws.fillFormula('A11:E11', 'A9', [1, 1, 1, 1, 1], 'array');
    }
  },

  checkSheet(wb, options) {
    const ws = wb.getWorksheet('sheet1');
    expect(ws).to.not.be.undefined();

    if (options.checkSheetProperties) {
      expect(ws.getColumn(10).outlineLevel).to.equal(1);
      expect(ws.getColumn(10).collapsed).to.equal(true);
      expect(ws.getRow(10).outlineLevel).to.equal(1);
      expect(ws.getRow(10).collapsed).to.equal(true);
      expect(ws.properties.outlineLevelCol).to.equal(1);
      expect(ws.properties.outlineLevelRow).to.equal(1);
      expect(ws.properties.tabColor).to.deep.equal({argb: 'FF00FF00'});
      expect(ws.properties).to.deep.equal(self.properties);
      expect(ws.pageSetup).to.deep.equal(self.pageSetup);
      expect(ws.headerFooter).to.deep.equal(self.headerFooter);
    }

    expect(ws.getCell('A1').value).to.equal(7);
    expect(ws.getCell('A1').type).to.equal(ExcelJS.ValueType.Number);
    expect(ws.getCell('B1').value).to.equal(self.testValues.str);
    expect(ws.getCell('B1').type).to.equal(ExcelJS.ValueType.String);
    expect(
      Math.abs(
        ws.getCell('C1').value.getTime() - self.testValues.date.getTime()
      )
    ).to.be.below(options.dateAccuracy);
    expect(ws.getCell('C1').type).to.equal(ExcelJS.ValueType.Date);

    if (options.checkFormulas) {
      expect(ws.getCell('D1').value).to.deep.equal(self.testValues.formulas[0]);
      expect(ws.getCell('D1').type).to.equal(ExcelJS.ValueType.Formula);
      expect(ws.getCell('E1').value.formula).to.equal(
        self.testValues.formulas[1].formula
      );
      expect(ws.getCell('E1').value.value).to.be.undefined();
      expect(ws.getCell('E1').type).to.equal(ExcelJS.ValueType.Formula);
      expect(ws.getCell('F1').value).to.deep.equal(self.testValues.hyperlink);
      expect(ws.getCell('F1').type).to.equal(ExcelJS.ValueType.Hyperlink);
      expect(ws.getCell('G1').value).to.equal(self.testValues.str2);
    } else {
      expect(ws.getCell('D1').value).to.equal(
        self.testValues.formulas[0].result
      );
      expect(ws.getCell('D1').type).to.equal(ExcelJS.ValueType.Number);
      expect(ws.getCell('E1').value).to.be.null();
      expect(ws.getCell('E1').type).to.equal(ExcelJS.ValueType.Null);
      expect(ws.getCell('F1').value).to.deep.equal(
        self.testValues.hyperlink.hyperlink
      );
      expect(ws.getCell('F1').type).to.equal(ExcelJS.ValueType.String);
      expect(ws.getCell('G1').value).to.equal(self.testValues.str2);
    }

    expect(ws.getCell('H1').value).to.equal(self.testValues.json.string);
    expect(ws.getCell('H1').type).to.equal(ExcelJS.ValueType.String);

    expect(ws.getCell('I1').value).to.equal(true);
    expect(ws.getCell('I1').type).to.equal(ExcelJS.ValueType.Boolean);
    expect(ws.getCell('J1').value).to.equal(false);
    expect(ws.getCell('J1').type).to.equal(ExcelJS.ValueType.Boolean);

    expect(ws.getCell('K1').value).to.deep.equal(
      self.testValues.Errors.NotApplicable
    );
    expect(ws.getCell('K1').type).to.equal(ExcelJS.ValueType.Error);
    expect(ws.getCell('L1').value).to.deep.equal(self.testValues.Errors.Value);
    expect(ws.getCell('L1').type).to.equal(ExcelJS.ValueType.Error);

    // A2:B3
    expect(ws.getCell('A2').value).to.equal(5);
    expect(ws.getCell('A2').type).to.equal(ExcelJS.ValueType.Number);
    expect(ws.getCell('A2').master).to.equal(ws.getCell('A2'));

    if (options.checkMerges) {
      expect(ws.getCell('A3').value).to.equal(5);
      expect(ws.getCell('A3').type).to.equal(ExcelJS.ValueType.Merge);
      expect(ws.getCell('A3').master).to.equal(ws.getCell('A2'));

      expect(ws.getCell('B2').value).to.equal(5);
      expect(ws.getCell('B2').type).to.equal(ExcelJS.ValueType.Merge);
      expect(ws.getCell('B2').master).to.equal(ws.getCell('A2'));

      expect(ws.getCell('B3').value).to.equal(5);
      expect(ws.getCell('B3').type).to.equal(ExcelJS.ValueType.Merge);
      expect(ws.getCell('B3').master).to.equal(ws.getCell('A2'));

      // C2:D3
      expect(ws.getCell('C2').value).to.be.null();
      expect(ws.getCell('C2').type).to.equal(ExcelJS.ValueType.Null);
      expect(ws.getCell('C2').master).to.equal(ws.getCell('C2'));

      expect(ws.getCell('D2').value).to.be.null();
      expect(ws.getCell('D2').type).to.equal(ExcelJS.ValueType.Merge);
      expect(ws.getCell('D2').master).to.equal(ws.getCell('C2'));

      expect(ws.getCell('C3').value).to.be.null();
      expect(ws.getCell('C3').type).to.equal(ExcelJS.ValueType.Merge);
      expect(ws.getCell('C3').master).to.equal(ws.getCell('C2'));

      expect(ws.getCell('D3').value).to.be.null();
      expect(ws.getCell('D3').type).to.equal(ExcelJS.ValueType.Merge);
      expect(ws.getCell('D3').master).to.equal(ws.getCell('C2'));
    }

    if (options.checkStyles) {
      expect(ws.getCell('A4').numFmt).to.equal(self.testValues.numFmt1);
      expect(ws.getCell('A4').type).to.equal(ExcelJS.ValueType.Number);
      expect(ws.getCell('A4').border).to.deep.equal(self.styles.borders.thin);
      expect(ws.getCell('C4').numFmt).to.equal(self.testValues.numFmt2);
      expect(ws.getCell('C4').type).to.equal(ExcelJS.ValueType.Number);
      expect(ws.getCell('C4').border).to.deep.equal(
        self.styles.borders.doubleRed
      );
      expect(ws.getCell('E4').border).to.deep.equal(
        self.styles.borders.thickRainbow
      );

      // test fonts and formats
      expect(ws.getCell('A5').value).to.equal(self.testValues.str);
      expect(ws.getCell('A5').type).to.equal(ExcelJS.ValueType.String);
      expect(ws.getCell('B5').value).to.equal(self.testValues.str);
      expect(ws.getCell('B5').type).to.equal(ExcelJS.ValueType.String);
      expect(ws.getCell('B5').font).to.deep.equal(
        self.styles.fonts.broadwayRedOutline20
      );
      expect(ws.getCell('C5').value).to.equal(self.testValues.str);
      expect(ws.getCell('C5').type).to.equal(ExcelJS.ValueType.String);
      expect(ws.getCell('C5').font).to.deep.equal(
        self.styles.fonts.comicSansUdB16
      );

      expect(Math.abs(ws.getCell('D5').value - 1.6)).to.be.below(0.00000001);
      expect(ws.getCell('D5').type).to.equal(ExcelJS.ValueType.Number);
      expect(ws.getCell('D5').numFmt).to.equal(self.testValues.numFmt1);
      expect(ws.getCell('D5').font).to.deep.equal(
        self.styles.fonts.arialBlackUI14
      );

      expect(Math.abs(ws.getCell('E5').value - 1.6)).to.be.below(0.00000001);
      expect(ws.getCell('E5').type).to.equal(ExcelJS.ValueType.Number);
      expect(ws.getCell('E5').numFmt).to.equal(self.testValues.numFmt2);
      expect(ws.getCell('E5').font).to.deep.equal(
        self.styles.fonts.broadwayRedOutline20
      );

      expect(
        Math.abs(
          ws.getCell('F5').value.getTime() - self.testValues.date.getTime()
        )
      ).to.be.below(options.dateAccuracy);
      expect(ws.getCell('F5').type).to.equal(ExcelJS.ValueType.Date);
      expect(ws.getCell('F5').numFmt).to.equal(self.testValues.numFmtDate);
      expect(ws.getCell('F5').font).to.deep.equal(
        self.styles.fonts.comicSansUdB16
      );

      expect(ws.getRow(5).height).to.be.undefined();
      expect(ws.getRow(6).height).to.equal(42);
      self.styles.alignments.forEach((alignment, index) => {
        const rowNumber = 6;
        const colNumber = index + 1;
        const cell = ws.getCell(rowNumber, colNumber);
        expect(cell.value).to.equal(alignment.text);
        expect(cell.alignment).to.deep.equal(alignment.alignment);
      });

      if (options.checkBadAlignments) {
        self.styles.badAlignments.forEach((alignment, index) => {
          const rowNumber = 7;
          const colNumber = index + 1;
          const cell = ws.getCell(rowNumber, colNumber);
          expect(cell.value).to.equal(alignment.text);
          expect(cell.alignment).to.be.undefined();
        });
      }

      const row8 = ws.getRow(8);
      expect(row8.height).to.equal(40);
      expect(row8.getCell(1).fill).to.deep.equal(
        self.styles.fills.blueWhiteHGrad
      );
      expect(row8.getCell(2).fill).to.deep.equal(
        self.styles.fills.redDarkVertical
      );
      expect(row8.getCell(3).fill).to.deep.equal(
        self.styles.fills.redGreenDarkTrellis
      );
      expect(row8.getCell(4).fill).to.deep.equal(self.styles.fills.rgbPathGrad);

      if (options.checkFormulas) {
        // Shared Formula
        expect(ws.getCell('A9').value).to.equal(1);
        expect(ws.getCell('A9').type).to.equal(ExcelJS.ValueType.Number);

        expect(ws.getCell('B9').value).to.deep.equal({
          shareType: 'shared',
          ref: 'B9:E9',
          formula: 'A9+1',
          result: 2,
        });
        expect(ws.getCell('B9').type).to.equal(ExcelJS.ValueType.Formula);

        ['C9', 'D9', 'E9'].forEach((address, index) => {
          expect(ws.getCell(address).value).to.deep.equal({
            sharedFormula: 'B9',
            result: index + 3,
          });
          expect(ws.getCell(address).type).to.equal(ExcelJS.ValueType.Formula);
        });

        if (ws.getCell('A10').value) {
          // Fill Formula Shared
          expect(ws.getCell('A10').value).to.deep.equal({
            shareType: 'shared',
            ref: 'A10:E10',
            formula: 'A9',
            result: 1,
          });
          ['B10', 'C10', 'D10', 'E10'].forEach((address, index) => {
            expect(ws.getCell(address).value).to.deep.equal({
              sharedFormula: 'A10',
              result: index + 2,
            });
            expect(ws.getCell(address).formula).to.equal(`${address[0]}9`);
          });

          // Array Formula
          // ws.fillFormula('A11:E11', 'A9', [1,1,1,1,1], 'array');
          expect(ws.getCell('A11').value).to.deep.equal({
            shareType: 'array',
            ref: 'A11:E11',
            formula: 'A9',
            result: 1,
          });
          ['B11', 'C11', 'D11', 'E11'].forEach(address => {
            expect(ws.getCell(address).value).to.equal(1);
          });
        }
      } else {
        ['A9', 'B9', 'C9', 'D9', 'E9'].forEach((address, index) => {
          expect(ws.getCell(address).value).to.equal(index + 1);
          expect(ws.getCell(address).type).to.equal(ExcelJS.ValueType.Number);
        });
      }
    }
  },
};

module.exports = self;
