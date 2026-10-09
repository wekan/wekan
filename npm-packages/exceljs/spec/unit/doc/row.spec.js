const {createSheetMock} = require('../../utils/index');

const Enums = verquire('doc/enums');

describe('Row', () => {
  it('stores cells', () => {
    const sheet = createSheetMock();
    sheet.addColumn(1, {key: 'name'});

    const row1 = sheet.getRow(1);
    expect(row1.number).to.equal(1);
    expect(row1.hasValues).to.not.be.ok();

    const a1 = row1.getCell(1);
    expect(a1.address).to.equal('A1');
    expect(a1.type).to.equal(Enums.ValueType.Null);
    expect(row1.hasValues).to.not.be.ok();

    expect(row1.getCell('A')).to.equal(a1);
    expect(row1.getCell('name')).to.equal(a1);

    a1.value = 5;
    expect(a1.type).to.equal(Enums.ValueType.Number);
    expect(row1.hasValues).to.be.ok();

    const b1 = row1.getCell(2);
    expect(b1.address).to.equal('B1');
    expect(b1.type).to.equal(Enums.ValueType.Null);
    expect(a1.type).to.equal(Enums.ValueType.Number);

    b1.value = 'Hello, World!';
    const d1 = row1.getCell(4);
    d1.value = {
      hyperlink: 'http://www.hyperlink.com',
      text: 'www.hyperlink.com',
    };

    const values = [
      ,
      5,
      'Hello, World!',
      ,
      {hyperlink: 'http://www.hyperlink.com', text: 'www.hyperlink.com'},
    ];
    expect(row1.values).to.deep.equal(values);
    expect(row1.dimensions).to.deep.equal({min: 1, max: 4});

    let count = 0;
    row1.eachCell((cell, colNumber) => {
      expect(cell.type).to.not.equal(Enums.ValueType.Null);
      switch (cell.type) {
        case Enums.ValueType.Hyperlink:
          expect(cell.value).to.deep.equal(values[colNumber]);
          break;
        default:
          expect(cell.value).to.equal(values[colNumber]);
          break;
      }
      count++;
    });

    // eachCell should just cover non-null cells
    expect(count).to.equal(3);

    const row2 = sheet.getRow(2);
    expect(row2.dimensions).to.be.null();
  });

  it('stores values by whole row', () => {
    const sheet = createSheetMock();
    sheet.addColumn(1, {key: 'id'});
    sheet.addColumn(2, {key: 'name'});
    sheet.addColumn(3, {key: 'dob'});

    const now = new Date();

    const row1 = sheet.getRow(1);

    // set values by contiguous array
    row1.values = [5, 'Hello, World!', null];
    expect(row1.getCell(1).value).to.equal(5);
    expect(row1.getCell(2).value).to.equal('Hello, World!');
    expect(row1.getCell(3).value).to.be.null();
    expect(row1.values).to.deep.equal([, 5, 'Hello, World!']);

    // set values by sparse array
    const values = [];
    values[1] = 7;
    values[3] = 'Not Null!';
    values[5] = now;
    row1.values = values;
    expect(row1.getCell(1).value).to.equal(7);
    expect(row1.getCell(2).value).to.be.null();
    expect(row1.getCell(3).value).to.equal('Not Null!');
    expect(row1.getCell(5).type).to.equal(Enums.ValueType.Date);
    expect(row1.values).to.deep.equal([, 7, , 'Not Null!', , now]);

    // set values by object
    row1.values = {
      id: 9,
      name: 'Dobbie',
      dob: now,
    };
    expect(row1.getCell(1).value).to.equal(9);
    expect(row1.getCell(2).value).to.equal('Dobbie');
    expect(row1.getCell(3).type).to.equal(Enums.ValueType.Date);
    expect(row1.getCell(5).value).to.be.null();
    expect(row1.values).to.deep.equal([, 9, 'Dobbie', now]);
  });

  describe('Splice', () => {
    it('remove only', () => {
      const sheet = createSheetMock();
      const row = sheet.getRow(1);

      row.getCell(2).value = 2;
      row.getCell(3).value = 3;
      row.getCell(5).value = 5;
      row.getCell(7).value = 7;
      row.getCell(11).value = 'eleven';
      row.getCell(13).value = 13;

      row.splice(3, 3);
      expect(row.getCell(2).value).to.equal(2);
      expect(row.getCell(2).type).to.equal(Enums.ValueType.Number);
      expect(row.getCell(2).address).to.equal('B1');
      expect(row.getCell(4).value).to.equal(7);
      expect(row.getCell(4).type).to.equal(Enums.ValueType.Number);
      expect(row.getCell(4).address).to.equal('D1');
      expect(row.getCell(8).value).to.equal('eleven');
      expect(row.getCell(8).type).to.equal(Enums.ValueType.String);
      expect(row.getCell(8).address).to.equal('H1');
    });

    it('remove to end', () => {
      const sheet = createSheetMock();
      const row = sheet.getRow(1);

      row.getCell(1).value = 1;
      row.getCell(2).value = 2;
      row.getCell(3).value = 3;
      row.getCell(4).value = 4;
      row.getCell(5).value = 5;

      row.splice(4, 2);
      expect(row.getCell(1).value).to.equal(1);
      expect(row.getCell(2).value).to.equal(2);
      expect(row.getCell(3).value).to.equal(3);
      expect(row.getCell(4).value).to.be.null();
      expect(row.getCell(5).value).to.be.null();
      expect(row.getCell(6).value).to.be.null();
    });

    it('remove almost to end', () => {
      const sheet = createSheetMock();
      const row = sheet.getRow(1);

      row.getCell(1).value = 1;
      row.getCell(2).value = 2;
      row.getCell(3).value = 3;
      row.getCell(4).value = 4;
      row.getCell(5).value = 5;
      row.getCell(6).value = 6;

      row.splice(4, 2);
      expect(row.getCell(1).value).to.equal(1);
      expect(row.getCell(2).value).to.equal(2);
      expect(row.getCell(3).value).to.equal(3);
      expect(row.getCell(4).value).to.equal(6);
      expect(row.getCell(5).value).to.be.null();
      expect(row.getCell(6).value).to.be.null();
    });

    it('remove past end', () => {
      const sheet = createSheetMock();
      const row = sheet.getRow(1);

      row.getCell(1).value = 1;
      row.getCell(2).value = 2;
      row.getCell(3).value = 3;
      row.getCell(4).value = 4;
      row.getCell(5).value = 5;
      row.getCell(6).value = 6;

      row.splice(4, 4);
      expect(row.getCell(1).value).to.equal(1);
      expect(row.getCell(2).value).to.equal(2);
      expect(row.getCell(3).value).to.equal(3);
      expect(row.getCell(4).value).to.be.null();
      expect(row.getCell(5).value).to.be.null();
      expect(row.getCell(6).value).to.be.null();
      expect(row.getCell(7).value).to.be.null();
      expect(row.getCell(8).value).to.be.null();
    });

    it('remove and insert fewer', () => {
      const sheet = createSheetMock();
      const row = sheet.getRow(1);
      row.values = [1, 2, 3, 4, 5, 6, 7, 8];
      row.splice(4, 3, 'four', 'five');
      expect(row.values).to.deep.equal([, 1, 2, 3, 'four', 'five', 7, 8]);
    });

    it('remove and insert replacements', () => {
      const sheet = createSheetMock();
      const row = sheet.getRow(1);
      row.values = [1, 2, 3, 4, 5, 6, 7, 8];
      row.splice(4, 3, 'four', 'five', 'six');
      expect(row.values).to.deep.equal([
        ,
        1,
        2,
        3,
        'four',
        'five',
        'six',
        7,
        8,
      ]);
    });

    it('remove and insert more', () => {
      const sheet = createSheetMock();
      const row = sheet.getRow(1);
      row.values = [1, 2, 3, 4, 5, 6, 7, 8];
      row.splice(4, 3, 'four', 'five', 'six', 'six and a half');
      expect(row.values).to.deep.equal([
        ,
        1,
        2,
        3,
        'four',
        'five',
        'six',
        'six and a half',
        7,
        8,
      ]);
    });
  });

  it('iterates over cells', () => {
    const sheet = createSheetMock();
    const row1 = sheet.getRow(1);

    row1.getCell(1).value = 1;
    row1.getCell(2).value = 2;
    row1.getCell(4).value = 4;
    row1.getCell(6).value = 6;
    row1.eachCell((cell, colNumber) => {
      expect(colNumber).to.not.equal(3);
      expect(colNumber).to.not.equal(5);
      expect(cell.value).to.equal(colNumber);
    });

    let count = 1;
    row1.eachCell({includeEmpty: true}, (cell, colNumber) => {
      expect(colNumber).to.equal(count++);
    });
    expect(count).to.equal(7);
  });

  it('builds a model', () => {
    const sheet = createSheetMock();
    const row1 = sheet.getRow(1);
    row1.getCell(1).value = 5;
    row1.getCell(2).value = 'Hello, World!';
    row1.getCell(4).value = {
      hyperlink: 'http://www.hyperlink.com',
      text: 'www.hyperlink.com',
    };
    row1.getCell(5).value = null;
    row1.height = 50;

    expect(row1.model).to.deep.equal({
      cells: [
        {address: 'A1', type: Enums.ValueType.Number, value: 5, style: {}},
        {
          address: 'B1',
          type: Enums.ValueType.String,
          value: 'Hello, World!',
          style: {},
        },
        {
          address: 'D1',
          type: Enums.ValueType.Hyperlink,
          text: 'www.hyperlink.com',
          hyperlink: 'http://www.hyperlink.com',
          style: {},
        },
        {address: 'E1', type: Enums.ValueType.Null, style: {}},
      ],
      number: 1,
      min: 1,
      max: 5,
      height: 50,
      hidden: false,
      style: {},
      outlineLevel: 0,
      collapsed: false,
    });

    const row2 = sheet.getRow(2);
    expect(row2.model).to.be.null();

    const row3 = sheet.getRow(3);
    row3.getCell(1).value = 5;
    row3.outlineLevel = 1;
    expect(row3.model).to.deep.equal({
      cells: [
        {address: 'A3', type: Enums.ValueType.Number, value: 5, style: {}},
      ],
      number: 3,
      min: 1,
      max: 1,
      height: undefined,
      hidden: false,
      style: {},
      outlineLevel: 1,
      collapsed: true,
    });
  });

  it('builds from model', () => {
    const sheet = createSheetMock();
    const row1 = sheet.getRow(1);
    row1.model = {
      cells: [
        {address: 'A1', type: Enums.ValueType.Number, value: 5},
        {address: 'B1', type: Enums.ValueType.String, value: 'Hello, World!'},
        {
          address: 'D1',
          type: Enums.ValueType.Hyperlink,
          text: 'www.hyperlink.com',
          hyperlink: 'http://www.hyperlink.com',
        },
      ],
      number: 1,
      min: 1,
      max: 4,
      height: 32.5,
    };

    expect(row1.dimensions).to.deep.equal({min: 1, max: 4});
    expect(row1.values).to.deep.equal([
      ,
      5,
      'Hello, World!',
      ,
      {hyperlink: 'http://www.hyperlink.com', text: 'www.hyperlink.com'},
    ]);
    expect(row1.getCell(1).type).to.equal(Enums.ValueType.Number);
    expect(row1.getCell(1).value).to.equal(5);
    expect(row1.getCell(2).type).to.equal(Enums.ValueType.String);
    expect(row1.getCell(2).value).to.equal('Hello, World!');
    expect(row1.getCell(4).type).to.equal(Enums.ValueType.Hyperlink);
    expect(row1.getCell(4).value).to.deep.equal({
      hyperlink: 'http://www.hyperlink.com',
      text: 'www.hyperlink.com',
    });
    expect(row1.getCell(5).type).to.equal(Enums.ValueType.Null);
    expect(row1.height - 32.5).to.be.below(0.00000001);
  });

  it('counts cells', () => {
    const sheet = createSheetMock();
    const row1 = sheet.getRow(1);

    row1.getCell(1).value = 'one';
    row1.getCell(2).value = 'two';
    row1.getCell(4).value = 'four';
    row1.getCell(5).value = 'five';

    expect(row1.cellCount).to.equal(5);
    expect(row1.actualCellCount).to.equal(4);
  });
});
