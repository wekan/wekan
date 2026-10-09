const colCache = verquire('utils/col-cache');
const Excel = verquire('exceljs');

const spliceArray = (a, index, count, ...rest) => {
  const clone = [...a];
  clone.splice(index, count, ...rest);
  return clone;
};

const values = [
  ['Date', 'Id', 'Word'],
  [new Date('2019-08-01'), 1, 'Bird'],
  [new Date('2019-08-02'), 2, 'is'],
  [new Date('2019-08-03'), 3, 'the'],
  [new Date('2019-08-04'), 4, 'Word'],
  ['Totals', {formula: 'SUBTOTAL(104,TestTable[Id])', result: 4}, null],
];

function addTable(ref, ws) {
  return ws.addTable({
    name: 'TestTable',
    ref,
    headerRow: true,
    totalsRow: true,
    style: {
      theme: 'TableStyleDark3',
      showRowStripes: true,
    },
    columns: [
      {name: 'Date', totalsRowLabel: 'Totals', filterButton: true},
      {
        name: 'Id',
        totalsRowFunction: 'max',
        filterButton: true,
        totalsRowResult: 4,
      },
      {
        name: 'Word',
        filterButton: false,
        style: {font: {bold: true, name: 'Comic Sans MS'}},
      },
    ],
    rows: [
      [new Date('2019-08-01'), 1, 'Bird'],
      [new Date('2019-08-02'), 2, 'is'],
      [new Date('2019-08-03'), 3, 'the'],
      [new Date('2019-08-04'), 4, 'Word'],
    ],
  });
}

function checkTable(ref, ws, testValues) {
  const a = colCache.decodeAddress(ref);

  for (let i = -1; i <= testValues.length + 1; i++) {
    const vRow = testValues[i];
    const nRow = i + a.row;
    const row = nRow >= 1 && ws.getRow(nRow);
    if (!row) continue;
    for (let j = -1; j <= testValues[0].length + 1; j++) {
      const value = (vRow && vRow[j]) || null;
      const nCol = j + a.col;
      const cellValue = nCol >= 1 && row.getCell(nCol).value;
      if (!cellValue) continue;

      if (value instanceof Date) {
        expect(cellValue).to.equalDate(value);
      } else if (value === null) {
        expect(cellValue).to.be.null();
      } else if (typeof value === 'object') {
        expect(cellValue).to.deep.equal(value);
      } else {
        expect(cellValue).to.equal(value);
      }
    }
  }
}

describe('Worksheet', () => {
  describe('Table', () => {
    it('creates a table', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      addTable('A1', ws);

      checkTable('A1', ws, values);
    });

    it('removes header', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      const table = addTable('A1', ws);

      table.headerRow = false;
      table.commit();

      const newValues = spliceArray(values, 0, 1);
      checkTable('A1', ws, newValues);
    });

    it('removes totals', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      const table = addTable('A1', ws);

      table.totalsRow = false;
      table.commit();

      const newValues = spliceArray(values, 5, 1);
      checkTable('A1', ws, newValues);
    });

    it('moves the table', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      const table = addTable('A1', ws);

      table.ref = 'C2';
      table.commit();

      checkTable('C2', ws, values);
    });

    it('removes a row', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      const table = addTable('A1', ws);

      table.removeRows(1);
      table.commit();

      const newValues = spliceArray(values, 2, 1);
      checkTable('A1', ws, newValues);
    });

    it('adds a row', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      const table = addTable('A1', ws);

      table.addRow([new Date('2019-08-05'), 5, 'Bird']);
      table.commit();

      const newValues = spliceArray(values, 5, 0, [
        new Date('2019-08-05'),
        5,
        'Bird',
      ]);
      checkTable('A1', ws, newValues);
    });

    it('removes a column', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      const table = addTable('A1', ws);

      table.removeColumns(1);
      table.commit();

      const newValues = values.map(rVals => spliceArray(rVals, 1, 1));
      checkTable('A1', ws, newValues);
    });

    it('adds a column', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      const table = addTable('A1', ws);

      table.addColumn(
        {
          name: 'Letter',
          totalsRowFunction: 'custom',
          totalsRowFormula: 'ROW()',
          totalsRowResult: 6,
          filterButton: true,
        },
        ['a', 'b', 'c', 'd'],
        2
      );
      table.commit();

      const colValues = [
        'Letter',
        'a',
        'b',
        'c',
        'd',
        {formula: 'ROW()', result: 6},
      ];
      const newValues = values.map((rVals, i) =>
        spliceArray(rVals, 2, 0, colValues[i])
      );
      checkTable('A1', ws, newValues);
    });

    it('renames a column', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      const table = addTable('A1', ws);

      const column = table.getColumn(1);
      column.name = 'Code';
      table.commit();

      const newValues = [...values];
      newValues.splice(0, 1, ['Date', 'Code', 'Word']);
      newValues.splice(5, 1, [
        'Totals',
        {formula: 'SUBTOTAL(104,TestTable[Code])', result: 4},
        null,
      ]);

      checkTable('A1', ws, newValues);
    });
  });
});
