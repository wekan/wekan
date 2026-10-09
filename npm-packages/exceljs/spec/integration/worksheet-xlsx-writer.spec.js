const testutils = require('../utils/index');

const ExcelJS = verquire('exceljs');

const CONCATENATE_HELLO_WORLD = 'CONCATENATE("Hello", ", ", "World!")';

describe('WorksheetWriter', () => {
  describe('Values', () => {
    it('stores values properly', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      const now = new Date();

      // plain number
      ws.getCell('A1').value = 7;

      // simple string
      ws.getCell('B1').value = 'Hello, World!';

      // floating point
      ws.getCell('C1').value = 3.14;

      // 5 will be overwritten by the current date-time
      ws.getCell('D1').value = 5;
      ws.getCell('D1').value = now;

      // constructed string - will share recored with B1
      ws.getCell('E1').value = `${['Hello', 'World'].join(', ')}!`;

      // hyperlink
      ws.getCell('F1').value = {
        text: 'www.google.com',
        hyperlink: 'http://www.google.com',
      };

      // number formula
      ws.getCell('A2').value = {formula: 'A1', result: 7};

      // string formula
      ws.getCell('B2').value = {
        formula: CONCATENATE_HELLO_WORLD,
        result: 'Hello, World!',
      };

      // date formula
      ws.getCell('C2').value = {formula: 'D1', result: now};

      expect(ws.getCell('A1').value).to.equal(7);
      expect(ws.getCell('B1').value).to.equal('Hello, World!');
      expect(ws.getCell('C1').value).to.equal(3.14);
      expect(ws.getCell('D1').value).to.equal(now);
      expect(ws.getCell('E1').value).to.equal('Hello, World!');
      expect(ws.getCell('F1').value.text).to.equal('www.google.com');
      expect(ws.getCell('F1').value.hyperlink).to.equal(
        'http://www.google.com'
      );

      expect(ws.getCell('A2').value.formula).to.equal('A1');
      expect(ws.getCell('A2').value.result).to.equal(7);

      expect(ws.getCell('B2').value.formula).to.equal(CONCATENATE_HELLO_WORLD);
      expect(ws.getCell('B2').value.result).to.equal('Hello, World!');

      expect(ws.getCell('C2').value.formula).to.equal('D1');
      expect(ws.getCell('C2').value.result).to.equal(now);
    });

    it('stores shared string values properly', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
        useSharedStrings: true,
      });
      const ws = wb.addWorksheet('blort');

      ws.getCell('A1').value = 'Hello, World!';

      ws.getCell('A2').value = 'Hello';
      ws.getCell('B2').value = 'World';
      ws.getCell('C2').value = {
        formula: 'CONCATENATE(A2, ", ", B2, "!")',
        result: 'Hello, World!',
      };

      ws.getCell('A3').value = `${['Hello', 'World'].join(', ')}!`;

      // A1 and A3 should reference the same string object
      expect(ws.getCell('A1').value).to.equal(ws.getCell('A3').value);

      // A1 and C2 should not reference the same object
      expect(ws.getCell('A1').value).to.equal(ws.getCell('C2').value.result);
    });

    it('assigns cell types properly', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // plain number
      ws.getCell('A1').value = 7;

      // simple string
      ws.getCell('B1').value = 'Hello, World!';

      // floating point
      ws.getCell('C1').value = 3.14;

      // date-time
      ws.getCell('D1').value = new Date();

      // hyperlink
      ws.getCell('E1').value = {
        text: 'www.google.com',
        hyperlink: 'http://www.google.com',
      };

      // number formula
      ws.getCell('A2').value = {formula: 'A1', result: 7};

      // string formula
      ws.getCell('B2').value = {
        formula: CONCATENATE_HELLO_WORLD,
        result: 'Hello, World!',
      };

      // date formula
      ws.getCell('C2').value = {formula: 'D1', result: new Date()};

      expect(ws.getCell('A1').type).to.equal(ExcelJS.ValueType.Number);
      expect(ws.getCell('B1').type).to.equal(ExcelJS.ValueType.String);
      expect(ws.getCell('C1').type).to.equal(ExcelJS.ValueType.Number);
      expect(ws.getCell('D1').type).to.equal(ExcelJS.ValueType.Date);
      expect(ws.getCell('E1').type).to.equal(ExcelJS.ValueType.Hyperlink);

      expect(ws.getCell('A2').type).to.equal(ExcelJS.ValueType.Formula);
      expect(ws.getCell('B2').type).to.equal(ExcelJS.ValueType.Formula);
      expect(ws.getCell('C2').type).to.equal(ExcelJS.ValueType.Formula);
    });

    it('adds columns', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      ws.columns = [
        {key: 'id', width: 10},
        {key: 'name', width: 32},
        {key: 'dob', width: 10},
      ];

      expect(ws.getColumn('id').number).to.equal(1);
      expect(ws.getColumn('id').width).to.equal(10);
      expect(ws.getColumn('A')).to.equal(ws.getColumn('id'));
      expect(ws.getColumn(1)).to.equal(ws.getColumn('id'));

      expect(ws.getColumn('name').number).to.equal(2);
      expect(ws.getColumn('name').width).to.equal(32);
      expect(ws.getColumn('B')).to.equal(ws.getColumn('name'));
      expect(ws.getColumn(2)).to.equal(ws.getColumn('name'));

      expect(ws.getColumn('dob').number).to.equal(3);
      expect(ws.getColumn('dob').width).to.equal(10);
      expect(ws.getColumn('C')).to.equal(ws.getColumn('dob'));
      expect(ws.getColumn(3)).to.equal(ws.getColumn('dob'));
    });

    it('adds column headers', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      ws.columns = [
        {header: 'Id', width: 10},
        {header: 'Name', width: 32},
        {header: 'D.O.B.', width: 10},
      ];

      expect(ws.getCell('A1').value).to.equal('Id');
      expect(ws.getCell('B1').value).to.equal('Name');
      expect(ws.getCell('C1').value).to.equal('D.O.B.');
    });

    it('adds column headers by number', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // by defn
      ws.getColumn(1).defn = {key: 'id', header: 'Id', width: 10};

      // by property
      ws.getColumn(2).key = 'name';
      ws.getColumn(2).header = 'Name';
      ws.getColumn(2).width = 32;

      expect(ws.getCell('A1').value).to.equal('Id');
      expect(ws.getCell('B1').value).to.equal('Name');

      expect(ws.getColumn('A').key).to.equal('id');
      expect(ws.getColumn(1).key).to.equal('id');
      expect(ws.getColumn(1).header).to.equal('Id');
      expect(ws.getColumn(1).headers).to.deep.equal(['Id']);
      expect(ws.getColumn(1).width).to.equal(10);

      expect(ws.getColumn(2).key).to.equal('name');
      expect(ws.getColumn(2).header).to.equal('Name');
      expect(ws.getColumn(2).headers).to.deep.equal(['Name']);
      expect(ws.getColumn(2).width).to.equal(32);
    });

    it('adds column headers by letter', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // by defn
      ws.getColumn('A').defn = {key: 'id', header: 'Id', width: 10};

      // by property
      ws.getColumn('B').key = 'name';
      ws.getColumn('B').header = 'Name';
      ws.getColumn('B').width = 32;

      expect(ws.getCell('A1').value).to.equal('Id');
      expect(ws.getCell('B1').value).to.equal('Name');

      expect(ws.getColumn('A').key).to.equal('id');
      expect(ws.getColumn(1).key).to.equal('id');
      expect(ws.getColumn('A').header).to.equal('Id');
      expect(ws.getColumn('A').headers).to.deep.equal(['Id']);
      expect(ws.getColumn('A').width).to.equal(10);

      expect(ws.getColumn('B').key).to.equal('name');
      expect(ws.getColumn('B').header).to.equal('Name');
      expect(ws.getColumn('B').headers).to.deep.equal(['Name']);
      expect(ws.getColumn('B').width).to.equal(32);
    });

    it('adds rows by object', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // add columns to define column keys
      ws.columns = [
        {header: 'Id', key: 'id', width: 10},
        {header: 'Name', key: 'name', width: 32},
        {header: 'D.O.B.', key: 'dob', width: 10},
      ];

      const dateValue1 = new Date(1970, 1, 1);
      const dateValue2 = new Date(1965, 1, 7);

      ws.addRow({id: 1, name: 'John Doe', dob: dateValue1});
      ws.addRow({id: 2, name: 'Jane Doe', dob: dateValue2});

      expect(ws.getCell('A2').value).to.equal(1);
      expect(ws.getCell('B2').value).to.equal('John Doe');
      expect(ws.getCell('C2').value).to.equal(dateValue1);

      expect(ws.getCell('A3').value).to.equal(2);
      expect(ws.getCell('B3').value).to.equal('Jane Doe');
      expect(ws.getCell('C3').value).to.equal(dateValue2);

      expect(ws.getRow(2).values).to.deep.equal([, 1, 'John Doe', dateValue1]);
      expect(ws.getRow(3).values).to.deep.equal([, 2, 'Jane Doe', dateValue2]);
    });

    it('adds rows by contiguous array', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      const dateValue1 = new Date(1970, 1, 1);
      const dateValue2 = new Date(1965, 1, 7);

      ws.addRow([1, 'John Doe', dateValue1]);
      ws.addRow([2, 'Jane Doe', dateValue2]);

      expect(ws.getCell('A1').value).to.equal(1);
      expect(ws.getCell('B1').value).to.equal('John Doe');
      expect(ws.getCell('C1').value).to.equal(dateValue1);

      expect(ws.getCell('A2').value).to.equal(2);
      expect(ws.getCell('B2').value).to.equal('Jane Doe');
      expect(ws.getCell('C2').value).to.equal(dateValue2);

      expect(ws.getRow(1).values).to.deep.equal([, 1, 'John Doe', dateValue1]);
      expect(ws.getRow(2).values).to.deep.equal([, 2, 'Jane Doe', dateValue2]);
    });

    it('adds rows by sparse array', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      const dateValue1 = new Date(1970, 1, 1);
      const dateValue2 = new Date(1965, 1, 7);
      const rows = [
        ,
        [, 1, 'John Doe', , dateValue1],
        [, 2, 'Jane Doe', , dateValue2],
      ];
      const row3 = [];
      row3[1] = 3;
      row3[3] = 'Sam';
      row3[5] = dateValue1;
      rows.push(row3);
      rows.forEach(row => {
        if (row) {
          ws.addRow(row);
        }
      });

      expect(ws.getCell('A1').value).to.equal(1);
      expect(ws.getCell('B1').value).to.equal('John Doe');
      expect(ws.getCell('D1').value).to.equal(dateValue1);

      expect(ws.getCell('A2').value).to.equal(2);
      expect(ws.getCell('B2').value).to.equal('Jane Doe');
      expect(ws.getCell('D2').value).to.equal(dateValue2);

      expect(ws.getCell('A3').value).to.equal(3);
      expect(ws.getCell('C3').value).to.equal('Sam');
      expect(ws.getCell('E3').value).to.equal(dateValue1);

      expect(ws.getRow(1).values).to.deep.equal(rows[1]);
      expect(ws.getRow(2).values).to.deep.equal(rows[2]);
      expect(ws.getRow(3).values).to.deep.equal(rows[3]);
    });

    it('sets row styles', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('basket');

      ws.getCell('A1').value = 5;
      ws.getCell('A1').numFmt = testutils.styles.numFmts.numFmt1;
      ws.getCell('A1').font = testutils.styles.fonts.arialBlackUI14;

      ws.getCell('C1').value = 'Hello, World!';
      ws.getCell('C1').alignment = testutils.styles.namedAlignments.bottomRight;
      ws.getCell('C1').border = testutils.styles.borders.doubleRed;
      ws.getCell('C1').fill = testutils.styles.fills.redDarkVertical;

      ws.getRow(1).numFmt = testutils.styles.numFmts.numFmt2;
      ws.getRow(1).font = testutils.styles.fonts.comicSansUdB16;
      ws.getRow(1).alignment = testutils.styles.namedAlignments.middleCentre;
      ws.getRow(1).border = testutils.styles.borders.thin;
      ws.getRow(1).fill = testutils.styles.fills.redGreenDarkTrellis;

      expect(ws.getCell('A1').numFmt).to.equal(
        testutils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('A1').font).to.deep.equal(
        testutils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('A1').alignment).to.deep.equal(
        testutils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('A1').border).to.deep.equal(
        testutils.styles.borders.thin
      );
      expect(ws.getCell('A1').fill).to.deep.equal(
        testutils.styles.fills.redGreenDarkTrellis
      );

      expect(ws.findCell('B1')).to.be.undefined();

      expect(ws.getCell('C1').numFmt).to.equal(
        testutils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('C1').font).to.deep.equal(
        testutils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('C1').alignment).to.deep.equal(
        testutils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('C1').border).to.deep.equal(
        testutils.styles.borders.thin
      );
      expect(ws.getCell('C1').fill).to.deep.equal(
        testutils.styles.fills.redGreenDarkTrellis
      );

      // when we 'get' the previously null cell, it should inherit the row styles
      expect(ws.getCell('B1').numFmt).to.equal(
        testutils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('B1').font).to.deep.equal(
        testutils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('B1').alignment).to.deep.equal(
        testutils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('B1').border).to.deep.equal(
        testutils.styles.borders.thin
      );
      expect(ws.getCell('B1').fill).to.deep.equal(
        testutils.styles.fills.redGreenDarkTrellis
      );
    });

    it('sets col styles', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('basket');

      ws.getCell('A1').value = 5;
      ws.getCell('A1').numFmt = testutils.styles.numFmts.numFmt1;
      ws.getCell('A1').font = testutils.styles.fonts.arialBlackUI14;

      ws.getCell('A3').value = 'Hello, World!';
      ws.getCell('A3').alignment = testutils.styles.namedAlignments.bottomRight;
      ws.getCell('A3').border = testutils.styles.borders.doubleRed;
      ws.getCell('A3').fill = testutils.styles.fills.redDarkVertical;

      ws.getColumn('A').numFmt = testutils.styles.numFmts.numFmt2;
      ws.getColumn('A').font = testutils.styles.fonts.comicSansUdB16;
      ws.getColumn('A').alignment =
        testutils.styles.namedAlignments.middleCentre;
      ws.getColumn('A').border = testutils.styles.borders.thin;
      ws.getColumn('A').fill = testutils.styles.fills.redGreenDarkTrellis;

      expect(ws.getCell('A1').numFmt).to.equal(
        testutils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('A1').font).to.deep.equal(
        testutils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('A1').alignment).to.deep.equal(
        testutils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('A1').border).to.deep.equal(
        testutils.styles.borders.thin
      );
      expect(ws.getCell('A1').fill).to.deep.equal(
        testutils.styles.fills.redGreenDarkTrellis
      );

      expect(ws.findRow(2)).to.be.undefined();

      expect(ws.getCell('A3').numFmt).to.equal(
        testutils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('A3').font).to.deep.equal(
        testutils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('A3').alignment).to.deep.equal(
        testutils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('A3').border).to.deep.equal(
        testutils.styles.borders.thin
      );
      expect(ws.getCell('A3').fill).to.deep.equal(
        testutils.styles.fills.redGreenDarkTrellis
      );

      // when we 'get' the previously null cell, it should inherit the column styles
      expect(ws.getCell('A2').numFmt).to.equal(
        testutils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('A2').font).to.deep.equal(
        testutils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('A2').alignment).to.deep.equal(
        testutils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('A2').border).to.deep.equal(
        testutils.styles.borders.thin
      );
      expect(ws.getCell('A2').fill).to.deep.equal(
        testutils.styles.fills.redGreenDarkTrellis
      );
    });
  });

  describe('Merge Cells', () => {
    it('references the same top-left value', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
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

      expect(ws.getCell('A1').type).to.equal(ExcelJS.ValueType.String);
      expect(ws.getCell('B1').type).to.equal(ExcelJS.ValueType.Merge);
      expect(ws.getCell('A2').type).to.equal(ExcelJS.ValueType.Merge);
      expect(ws.getCell('B2').type).to.equal(ExcelJS.ValueType.Merge);
    });

    it('does not allow overlapping merges', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
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
  });

  describe('Page Breaks', () => {
    it('adds multiple row breaks', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // initial values
      ws.getCell('A1').value = 'A1';
      ws.getCell('B1').value = 'B1';
      ws.getCell('A2').value = 'A2';
      ws.getCell('B2').value = 'B2';
      ws.getCell('A3').value = 'A3';
      ws.getCell('B3').value = 'B3';

      let row = ws.getRow(1);
      row.addPageBreak();
      row = ws.getRow(2);
      row.addPageBreak();
      expect(ws.rowBreaks.length).to.equal(2);
    });
  });
});
