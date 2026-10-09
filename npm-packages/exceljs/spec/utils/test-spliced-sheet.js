const Enums = verquire('doc/enums');

module.exports = {
  rows: {
    removeOnly: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-row-remove-only');

        ws.addRow(['1,1', '1,2', '1,3']);
        ws.addRow(['2,1', '2,2', '2,3']);
        ws.getCell('A4').value = 4.1;
        ws.getCell('C4').value = 4.3;
        ws.addRow(['5,1', '5,2', '5,3']);

        ws.spliceRows(2, 1);
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-row-remove-only');
        expect(ws).to.not.be.undefined();

        expect(ws.getCell('A1').value).to.equal('1,1');
        expect(ws.getCell('A1').type).to.equal(Enums.ValueType.String);
        expect(ws.getCell('B1').value).to.equal('1,2');
        expect(ws.getCell('B1').type).to.equal(Enums.ValueType.String);
        expect(ws.getCell('C1').value).to.equal('1,3');
        expect(ws.getCell('C1').type).to.equal(Enums.ValueType.String);

        expect(ws.getCell('A2').type).to.equal(Enums.ValueType.Null);
        expect(ws.getCell('B2').type).to.equal(Enums.ValueType.Null);
        expect(ws.getCell('C2').type).to.equal(Enums.ValueType.Null);

        expect(ws.getCell('A3').value).to.equal(4.1);
        expect(ws.getCell('A3').type).to.equal(Enums.ValueType.Number);
        expect(ws.getCell('B3').type).to.equal(Enums.ValueType.Null);
        expect(ws.getCell('C3').value).to.equal(4.3);
        expect(ws.getCell('C3').type).to.equal(Enums.ValueType.Number);

        expect(ws.getCell('A4').value).to.equal('5,1');
        expect(ws.getCell('A4').type).to.equal(Enums.ValueType.String);
        expect(ws.getCell('B4').value).to.equal('5,2');
        expect(ws.getCell('B4').type).to.equal(Enums.ValueType.String);
        expect(ws.getCell('C4').value).to.equal('5,3');
        expect(ws.getCell('C4').type).to.equal(Enums.ValueType.String);

        ws.addRow(['5,1b', '5,2b', '5,3b']);
        expect(ws.getCell('A5').value).to.equal('5,1b');
        expect(ws.getCell('A5').type).to.equal(Enums.ValueType.String);
        expect(ws.getCell('B5').value).to.equal('5,2b');
        expect(ws.getCell('B5').type).to.equal(Enums.ValueType.String);
        expect(ws.getCell('C5').value).to.equal('5,3b');
        expect(ws.getCell('C5').type).to.equal(Enums.ValueType.String);
      },
    },
    insertFewer: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-row-insert-fewer');

        ws.addRow(['1,1', '1,2', '1,3']);
        ws.addRow(['2,1', '2,2', '2,3']);
        ws.getCell('A4').value = 4.1;
        ws.getCell('C4').value = 4.3;
        ws.addRow(['5,1', '5,2', '5,3']);

        ws.spliceRows(2, 2, ['one', 'two', 'three']);
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-row-insert-fewer');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([, '1,1', '1,2', '1,3']);
        expect(ws.getRow(2).values).to.deep.equal([, 'one', 'two', 'three']);
        expect(ws.getRow(3).values).to.deep.equal([, 4.1, , 4.3]);
        expect(ws.getRow(4).values).to.deep.equal([, '5,1', '5,2', '5,3']);
      },
    },
    insertSame: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-row-insert-same');

        ws.addRow(['1,1', '1,2', '1,3']);
        ws.addRow(['2,1', '2,2', '2,3']);
        ws.getCell('A4').value = 4.1;
        ws.getCell('C4').value = 4.3;
        ws.addRow(['5,1', '5,2', '5,3']);

        ws.spliceRows(2, 2, ['one', 'two', 'three'], ['une', 'deux', 'trois']);
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-row-insert-same');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([, '1,1', '1,2', '1,3']);
        expect(ws.getRow(2).values).to.deep.equal([, 'one', 'two', 'three']);
        expect(ws.getRow(3).values).to.deep.equal([, 'une', 'deux', 'trois']);
        expect(ws.getRow(4).values).to.deep.equal([, 4.1, , 4.3]);
        expect(ws.getRow(5).values).to.deep.equal([, '5,1', '5,2', '5,3']);
      },
    },
    insertMore: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-row-insert-more');

        ws.addRow(['1,1', '1,2', '1,3']);
        ws.addRow(['2,1', '2,2', '2,3']);
        ws.getCell('A4').value = 4.1;
        ws.getCell('C4').value = 4.3;
        ws.addRow(['5,1', '5,2', '5,3']);

        ws.spliceRows(
          2,
          2,
          ['one', 'two', 'three'],
          ['une', 'deux', 'trois'],
          ['uno', 'due', 'tre']
        );
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-row-insert-more');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([, '1,1', '1,2', '1,3']);
        expect(ws.getRow(2).values).to.deep.equal([, 'one', 'two', 'three']);
        expect(ws.getRow(3).values).to.deep.equal([, 'une', 'deux', 'trois']);
        expect(ws.getRow(4).values).to.deep.equal([, 'uno', 'due', 'tre']);
        expect(ws.getRow(5).values).to.deep.equal([, 4.1, , 4.3]);
        expect(ws.getRow(6).values).to.deep.equal([, '5,1', '5,2', '5,3']);
      },
    },
    removeStyle: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-row-remove-style');
        ws.addRow(['1,1', '1,2', '1,3', '1,4']);
        ws.addRow(['2,1', '2,2', '2,3', '2,4']);
        ws.addRow(['3,1', '3,2', '3,3', '3,4']);
        ws.addRow(['4,1', '4,2', '4,3', '4,4']);

        ws.getCell('A1').numFmt = '# ?/?';
        ws.getCell('B2').fill = {
          type: 'pattern',
          pattern: 'darkVertical',
          fgColor: {argb: 'FFFF0000'},
        };
        ws.getRow(3).border = {
          top: {style: 'thin'},
          left: {style: 'thin'},
          bottom: {style: 'thin'},
          right: {style: 'thin'},
        };
        ws.getRow(4).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };

        // remove rows 2 & 3
        ws.spliceRows(2, 2);
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-row-remove-style');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          '1,2',
          '1,3',
          '1,4',
        ]);
        expect(ws.getRow(2).values).to.deep.equal([
          ,
          '4,1',
          '4,2',
          '4,3',
          '4,4',
        ]);

        expect(ws.getCell('A1').style).to.deep.equal({
          numFmt: '# ?/?',
        });
        expect(ws.getRow(2).style).to.deep.equal({
          alignment: {
            horizontal: 'left',
            vertical: 'middle',
          },
        });
      },
    },
    insertStyle: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-row-insert-style');

        ws.addRow(['1,1', '1,2', '1,3']);
        ws.addRow(['2,1', '2,2', '2,3']);
        ws.getCell('A2').fill = {
          type: 'pattern',
          pattern: 'darkVertical',
          fgColor: {argb: 'FFFF0000'},
        };
        ws.getRow(2).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };

        ws.spliceRows(2, 0, ['one', 'two', 'three']);
        ws.getCell('A2').border = {
          top: {style: 'thin'},
          left: {style: 'thin'},
          bottom: {style: 'thin'},
          right: {style: 'thin'},
        };
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-row-insert-style');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([, '1,1', '1,2', '1,3']);
        expect(ws.getRow(2).values).to.deep.equal([, 'one', 'two', 'three']);
        expect(ws.getRow(3).values).to.deep.equal([, '2,1', '2,2', '2,3']);

        expect(ws.getRow(3).style.alignment).to.deep.equal({
          horizontal: 'left',
          vertical: 'middle',
        });
        expect(ws.getCell('A2').style.border).to.deep.equal({
          top: {style: 'thin'},
          left: {style: 'thin'},
          bottom: {style: 'thin'},
          right: {style: 'thin'},
        });
        expect(ws.getCell('A3').style.alignment).to.deep.equal({
          horizontal: 'left',
          vertical: 'middle',
        });
        expect(ws.getCell('A3').style.fill).to.deep.equal({
          type: 'pattern',
          pattern: 'darkVertical',
          fgColor: {argb: 'FFFF0000'},
        });
      },
    },
    replaceStyle: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-row-replace-style');
        ws.addRow(['1,1', '1,2', '1,3', '1,4']);
        ws.addRow(['2,1', '2,2', '2,3', '2,4']);
        ws.addRow(['3,1', '3,2', '3,3', '3,4']);

        ws.getCell('B1').numFmt = 'top';
        ws.getCell('B2').numFmt = 'middle';
        ws.getCell('B3').numFmt = 'bottom';

        ws.getRow(1).alignment = {
          horizontal: 'left',
          vertical: 'top',
        };
        ws.getRow(2).alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        ws.getRow(3).alignment = {
          horizontal: 'right',
          vertical: 'bottom',
        };

        // remove rows 2 & 3
        ws.spliceRows(2, 1, ['two-one', 'two-two', 'two-three', 'two-four']);
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-row-replace-style');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          '1,2',
          '1,3',
          '1,4',
        ]);
        expect(ws.getRow(2).values).to.deep.equal([
          ,
          'two-one',
          'two-two',
          'two-three',
          'two-four',
        ]);
        expect(ws.getRow(3).values).to.deep.equal([
          ,
          '3,1',
          '3,2',
          '3,3',
          '3,4',
        ]);

        expect(ws.getCell('B1').style).to.deep.equal({
          numFmt: 'top',
          alignment: {
            horizontal: 'left',
            vertical: 'top',
          },
        });
        expect(ws.getCell('B2').style).to.deep.equal({});
        expect(ws.getCell('B3').style).to.deep.equal({
          numFmt: 'bottom',
          alignment: {
            horizontal: 'right',
            vertical: 'bottom',
          },
        });
        expect(ws.getRow(1).style).to.deep.equal({
          alignment: {
            horizontal: 'left',
            vertical: 'top',
          },
        });
        expect(ws.getRow(2).style).to.deep.equal({});
        expect(ws.getRow(3).style).to.deep.equal({
          alignment: {
            horizontal: 'right',
            vertical: 'bottom',
          },
        });
      },
    },
    removeDefinedNames: {
      addSheet(wb) {
        const wsSquare = wb.addWorksheet('splice-row-remove-name-square');
        wsSquare.addRow(['1,1', '1,2', '1,3', '1,4']);
        wsSquare.addRow(['2,1', '2,2', '2,3', '2,4']);
        wsSquare.addRow(['3,1', '3,2', '3,3', '3,4']);
        wsSquare.addRow(['4,1', '4,2', '4,3', '4,4']);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3, 4].forEach(row => {
            wsSquare.getCell(col + row).name = 'square';
          });
        });

        wsSquare.spliceRows(2, 2);

        const wsSingles = wb.addWorksheet('splice-row-remove-name-singles');
        wsSingles.getCell('A1').value = '1,1';
        wsSingles.getCell('A4').value = '4,1';
        wsSingles.getCell('D1').value = '1,4';
        wsSingles.getCell('D4').value = '4,4';

        ['A', 'D'].forEach(col => {
          [1, 4].forEach(row => {
            wsSingles.getCell(col + row).name = `single-${col}${row}`;
          });
        });

        wsSingles.spliceRows(2, 2);
      },

      checkSheet(wb) {
        const wsSquare = wb.getWorksheet('splice-row-remove-name-square');
        expect(wsSquare).to.not.be.undefined();

        expect(wsSquare.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          '1,2',
          '1,3',
          '1,4',
        ]);
        expect(wsSquare.getRow(2).values).to.deep.equal([
          ,
          '4,1',
          '4,2',
          '4,3',
          '4,4',
        ]);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3].forEach(row => {
            if (row === 3) {
              expect(wsSquare.getCell(col + row).name).to.be.undefined();
            } else {
              expect(wsSquare.getCell(col + row).name).to.equal('square');
            }
          });
        });

        const wsSingles = wb.getWorksheet('splice-row-remove-name-singles');
        expect(wsSingles).to.not.be.undefined();

        expect(wsSingles.getRow(1).values).to.deep.equal([, '1,1', , , '1,4']);
        expect(wsSingles.getRow(2).values).to.deep.equal([, '4,1', , , '4,4']);

        expect(wsSingles.getCell('A1').name).to.equal('single-A1');
        expect(wsSingles.getCell('A2').name).to.equal('single-A4');
        expect(wsSingles.getCell('D1').name).to.equal('single-D1');
        expect(wsSingles.getCell('D2').name).to.equal('single-D4');
      },
    },
    insertDefinedNames: {
      addSheet(wb) {
        const wsSquare = wb.addWorksheet('splice-row-insert-name-square');
        wsSquare.addRow(['1,1', '1,2', '1,3', '1,4']);
        wsSquare.addRow(['2,1', '2,2', '2,3', '2,4']);
        wsSquare.addRow(['3,1', '3,2', '3,3', '3,4']);
        wsSquare.addRow(['4,1', '4,2', '4,3', '4,4']);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3, 4].forEach(row => {
            wsSquare.getCell(col + row).name = 'square';
          });
        });

        wsSquare.spliceRows(3, 0, ['foo', 'bar', 'baz', 'qux']);

        const wsSingles = wb.addWorksheet('splice-row-insert-name-singles');
        wsSingles.getCell('A1').value = '1,1';
        wsSingles.getCell('A4').value = '4,1';
        wsSingles.getCell('D1').value = '1,4';
        wsSingles.getCell('D4').value = '4,4';

        ['A', 'D'].forEach(col => {
          [1, 4].forEach(row => {
            wsSingles.getCell(col + row).name = `single-${col}${row}`;
          });
        });

        wsSingles.spliceRows(3, 0, ['foo', 'bar', 'baz', 'qux']);
      },

      checkSheet(wb) {
        const wsSquare = wb.getWorksheet('splice-row-insert-name-square');
        expect(wsSquare).to.not.be.undefined();

        expect(wsSquare.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          '1,2',
          '1,3',
          '1,4',
        ]);
        expect(wsSquare.getRow(2).values).to.deep.equal([
          ,
          '2,1',
          '2,2',
          '2,3',
          '2,4',
        ]);
        expect(wsSquare.getRow(3).values).to.deep.equal([
          ,
          'foo',
          'bar',
          'baz',
          'qux',
        ]);
        expect(wsSquare.getRow(4).values).to.deep.equal([
          ,
          '3,1',
          '3,2',
          '3,3',
          '3,4',
        ]);
        expect(wsSquare.getRow(5).values).to.deep.equal([
          ,
          '4,1',
          '4,2',
          '4,3',
          '4,4',
        ]);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3, 4, 5].forEach(row => {
            if (row === 3) {
              expect(wsSquare.getCell(col + row).name).to.be.undefined();
            } else {
              expect(wsSquare.getCell(col + row).name).to.equal('square');
            }
          });
        });

        const wsSingles = wb.getWorksheet('splice-row-insert-name-singles');
        expect(wsSingles).to.not.be.undefined();
        expect(wsSingles.getRow(1).values).to.deep.equal([, '1,1', , , '1,4']);
        expect(wsSingles.getRow(3).values).to.deep.equal([
          ,
          'foo',
          'bar',
          'baz',
          'qux',
        ]);
        expect(wsSingles.getRow(5).values).to.deep.equal([, '4,1', , , '4,4']);

        expect(wsSingles.getCell('A1').name).to.equal('single-A1');
        expect(wsSingles.getCell('A5').name).to.equal('single-A4');
        expect(wsSingles.getCell('D1').name).to.equal('single-D1');
        expect(wsSingles.getCell('D5').name).to.equal('single-D4');
      },
    },
    replaceDefinedNames: {
      addSheet(wb) {
        const wsSquare = wb.addWorksheet('splice-row-replace-name-square');
        wsSquare.addRow(['1,1', '1,2', '1,3', '1,4']);
        wsSquare.addRow(['2,1', '2,2', '2,3', '2,4']);
        wsSquare.addRow(['3,1', '3,2', '3,3', '3,4']);
        wsSquare.addRow(['4,1', '4,2', '4,3', '4,4']);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3, 4].forEach(row => {
            wsSquare.getCell(col + row).name = 'square';
          });
        });

        wsSquare.spliceRows(2, 1, ['foo', 'bar', 'baz', 'qux']);

        const wsSingles = wb.addWorksheet('splice-row-replace-name-singles');
        wsSingles.getCell('A1').value = '1,1';
        wsSingles.getCell('A4').value = '4,1';
        wsSingles.getCell('D1').value = '1,4';
        wsSingles.getCell('D4').value = '4,4';

        ['A', 'D'].forEach(col => {
          [1, 4].forEach(row => {
            wsSingles.getCell(col + row).name = `single-${col}${row}`;
          });
        });

        wsSingles.spliceRows(2, 1, ['foo', 'bar', 'baz', 'qux']);
      },

      checkSheet(wb) {
        const wsSquare = wb.getWorksheet('splice-row-replace-name-square');
        expect(wsSquare).to.not.be.undefined();

        expect(wsSquare.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          '1,2',
          '1,3',
          '1,4',
        ]);
        expect(wsSquare.getRow(2).values).to.deep.equal([
          ,
          'foo',
          'bar',
          'baz',
          'qux',
        ]);
        expect(wsSquare.getRow(3).values).to.deep.equal([
          ,
          '3,1',
          '3,2',
          '3,3',
          '3,4',
        ]);
        expect(wsSquare.getRow(4).values).to.deep.equal([
          ,
          '4,1',
          '4,2',
          '4,3',
          '4,4',
        ]);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3, 4].forEach(row => {
            if (row === 2) {
              expect(wsSquare.getCell(col + row).name).to.be.undefined();
            } else {
              expect(wsSquare.getCell(col + row).name).to.equal('square');
            }
          });
        });

        const wsSingles = wb.getWorksheet('splice-row-replace-name-singles');
        expect(wsSingles).to.not.be.undefined();

        expect(wsSingles.getRow(1).values).to.deep.equal([, '1,1', , , '1,4']);
        expect(wsSingles.getRow(2).values).to.deep.equal([
          ,
          'foo',
          'bar',
          'baz',
          'qux',
        ]);
        expect(wsSingles.getRow(4).values).to.deep.equal([, '4,1', , , '4,4']);

        expect(wsSingles.getCell('A1').name).to.equal('single-A1');
        expect(wsSingles.getCell('A4').name).to.equal('single-A4');
        expect(wsSingles.getCell('D1').name).to.equal('single-D1');
        expect(wsSingles.getCell('D4').name).to.equal('single-D4');
      },
    },
  },
  columns: {
    removeOnly: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-column-remove-only');

        ws.columns = [
          {key: 'id', width: 10},
          {key: 'name', width: 32},
          {key: 'dob', width: 10},
        ];

        ws.addRow({id: 'id1', name: 'name1', dob: 'dob1'});
        ws.addRow({id: 2, dob: 'dob2'});
        ws.addRow({name: 'name3', dob: 3});

        ws.spliceColumns(2, 1);
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-column-remove-only');
        expect(ws).to.not.be.undefined();

        expect(ws.getCell('A1').value).to.equal('id1');
        expect(ws.getCell('A1').type).to.equal(Enums.ValueType.String);
        expect(ws.getCell('B1').value).to.equal('dob1');
        expect(ws.getCell('B1').type).to.equal(Enums.ValueType.String);
        expect(ws.getCell('C1').type).to.equal(Enums.ValueType.Null);

        expect(ws.getCell('A2').value).to.equal(2);
        expect(ws.getCell('A2').type).to.equal(Enums.ValueType.Number);
        expect(ws.getCell('B2').value).to.equal('dob2');
        expect(ws.getCell('B2').type).to.equal(Enums.ValueType.String);
        expect(ws.getCell('C2').type).to.equal(Enums.ValueType.Null);

        expect(ws.getCell('A3').type).to.equal(Enums.ValueType.Null);
        expect(ws.getCell('B3').value).to.equal(3);
        expect(ws.getCell('B3').type).to.equal(Enums.ValueType.Number);
        expect(ws.getCell('C3').type).to.equal(Enums.ValueType.Null);
      },
    },
    insertFewer: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-column-insert-fewer');

        ws.addRow(['1,1', '1,2', '1,3', '1,4', '1,5']);
        ws.addRow(['2,1', '2,2', '2,3', '2,4', '2,5']);
        ws.getCell('A4').value = 4.1;
        ws.getCell('C4').value = 4.3;
        ws.getCell('E4').value = 4.5;
        ws.addRow(['5,1', '5,2', '5,3', '5,4', '5,5']);

        ws.spliceColumns(2, 2, ['one', 'two', 'three', 'four', 'five']);
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-column-insert-fewer');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          'one',
          '1,4',
          '1,5',
        ]);
        expect(ws.getRow(2).values).to.deep.equal([
          ,
          '2,1',
          'two',
          '2,4',
          '2,5',
        ]);
        expect(ws.getRow(3).values).to.deep.equal([, , 'three']);
        expect(ws.getRow(4).values).to.deep.equal([, 4.1, 'four', , 4.5]);
        expect(ws.getRow(5).values).to.deep.equal([
          ,
          '5,1',
          'five',
          '5,4',
          '5,5',
        ]);
      },
    },
    insertSame: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-column-insert-same');

        ws.addRow(['1,1', '1,2', '1,3', '1,4', '1,5']);
        ws.addRow(['2,1', '2,2', '2,3', '2,4', '2,5']);
        ws.getCell('A4').value = 4.1;
        ws.getCell('C4').value = 4.3;
        ws.getCell('E4').value = 4.5;
        ws.addRow(['5,1', '5,2', '5,3', '5,4', '5,5']);

        ws.spliceColumns(
          2,
          2,
          ['one', 'two', 'three', 'four', 'five'],
          ['une', 'deux', 'trois', 'quatre', 'cinq']
        );
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-column-insert-same');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          'one',
          'une',
          '1,4',
          '1,5',
        ]);
        expect(ws.getRow(2).values).to.deep.equal([
          ,
          '2,1',
          'two',
          'deux',
          '2,4',
          '2,5',
        ]);
        expect(ws.getRow(3).values).to.deep.equal([, , 'three', 'trois']);
        expect(ws.getRow(4).values).to.deep.equal([
          ,
          4.1,
          'four',
          'quatre',
          ,
          4.5,
        ]);
        expect(ws.getRow(5).values).to.deep.equal([
          ,
          '5,1',
          'five',
          'cinq',
          '5,4',
          '5,5',
        ]);
      },
    },
    insertMore: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-column-insert-more');

        ws.addRow(['1,1', '1,2', '1,3', '1,4', '1,5']);
        ws.addRow(['2,1', '2,2', '2,3', '2,4', '2,5']);
        ws.getCell('A4').value = 4.1;
        ws.getCell('C4').value = 4.3;
        ws.getCell('E4').value = 4.5;
        ws.addRow(['5,1', '5,2', '5,3', '5,4', '5,5']);

        ws.spliceColumns(
          2,
          2,
          ['one', 'two', 'three', 'four', 'five'],
          ['une', 'deux', 'trois', 'quatre', 'cinq'],
          ['uno', 'due', 'tre', 'quatro', 'cinque']
        );
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-column-insert-more');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          'one',
          'une',
          'uno',
          '1,4',
          '1,5',
        ]);
        expect(ws.getRow(2).values).to.deep.equal([
          ,
          '2,1',
          'two',
          'deux',
          'due',
          '2,4',
          '2,5',
        ]);
        expect(ws.getRow(3).values).to.deep.equal([
          ,
          ,
          'three',
          'trois',
          'tre',
        ]);
        expect(ws.getRow(4).values).to.deep.equal([
          ,
          4.1,
          'four',
          'quatre',
          'quatro',
          ,
          4.5,
        ]);
        expect(ws.getRow(5).values).to.deep.equal([
          ,
          '5,1',
          'five',
          'cinq',
          'cinque',
          '5,4',
          '5,5',
        ]);
      },
    },
    removeStyle: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-col-remove-style');
        ws.addRow(['1,1', '1,2', '1,3', '1,4']);
        ws.addRow(['2,1', '2,2', '2,3', '2,4']);
        ws.addRow(['3,1', '3,2', '3,3', '3,4']);
        ws.addRow(['4,1', '4,2', '4,3', '4,4']);

        ws.getCell('A1').numFmt = '# ?/?';
        ws.getCell('B2').fill = {
          type: 'pattern',
          pattern: 'darkVertical',
          fgColor: {argb: 'FFFF0000'},
        };
        ws.getColumn(3).border = {
          top: {style: 'thin'},
          left: {style: 'thin'},
          bottom: {style: 'thin'},
          right: {style: 'thin'},
        };
        ws.getColumn(4).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };

        // remove cols 2 & 3
        ws.spliceColumns(2, 2);
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-col-remove-style');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([, '1,1', '1,4']);
        expect(ws.getRow(2).values).to.deep.equal([, '2,1', '2,4']);
        expect(ws.getRow(3).values).to.deep.equal([, '3,1', '3,4']);
        expect(ws.getRow(4).values).to.deep.equal([, '4,1', '4,4']);

        expect(ws.getCell('A1').style).to.deep.equal({
          numFmt: '# ?/?',
        });
        expect(ws.getColumn(2).style).to.deep.equal({
          alignment: {
            horizontal: 'left',
            vertical: 'middle',
          },
        });
        expect(ws.getCell('B4').style).to.deep.equal({
          alignment: {
            horizontal: 'left',
            vertical: 'middle',
          },
        });
      },
    },
    insertStyle: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-col-insert-style');

        ws.addRow(['1,1', '1,2', '1,3']);
        ws.addRow(['2,1', '2,2', '2,3']);
        ws.addRow(['3,1', '3,2', '3,3']);
        ws.getCell('B2').fill = {
          type: 'pattern',
          pattern: 'darkVertical',
          fgColor: {argb: 'FFFF0000'},
        };
        ws.getColumn(2).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };

        ws.spliceColumns(2, 0, ['one', 'two', 'three']);
        ws.getCell('B2').border = {
          top: {style: 'thin'},
          left: {style: 'thin'},
          bottom: {style: 'thin'},
          right: {style: 'thin'},
        };
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-col-insert-style');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          'one',
          '1,2',
          '1,3',
        ]);
        expect(ws.getRow(2).values).to.deep.equal([
          ,
          '2,1',
          'two',
          '2,2',
          '2,3',
        ]);
        expect(ws.getRow(3).values).to.deep.equal([
          ,
          '3,1',
          'three',
          '3,2',
          '3,3',
        ]);

        expect(ws.getColumn(3).style).to.deep.equal({
          alignment: {
            horizontal: 'left',
            vertical: 'middle',
          },
        });
        expect(ws.getCell('B2').style).to.deep.equal({
          border: {
            top: {style: 'thin'},
            left: {style: 'thin'},
            bottom: {style: 'thin'},
            right: {style: 'thin'},
          },
        });
        expect(ws.getCell('C2').style).to.deep.equal({
          alignment: {
            horizontal: 'left',
            vertical: 'middle',
          },
          fill: {
            type: 'pattern',
            pattern: 'darkVertical',
            fgColor: {argb: 'FFFF0000'},
          },
        });
      },
    },
    replaceStyle: {
      addSheet(wb) {
        const ws = wb.addWorksheet('splice-col-replace-style');
        ws.addRow(['1,1', '1,2', '1,3', '1,4']);
        ws.addRow(['2,1', '2,2', '2,3', '2,4']);
        ws.addRow(['3,1', '3,2', '3,3', '3,4']);

        ws.getCell('A2').numFmt = 'left';
        ws.getCell('B2').numFmt = 'center';
        ws.getCell('C2').numFmt = 'right';

        ws.getColumn(1).alignment = {
          horizontal: 'left',
          vertical: 'top',
        };
        ws.getColumn(2).alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        ws.getColumn(3).alignment = {
          horizontal: 'right',
          vertical: 'bottom',
        };

        // remove rows 2 & 3
        ws.spliceColumns(2, 1, ['one-two', 'two-two', 'three-two']);
      },

      checkSheet(wb) {
        const ws = wb.getWorksheet('splice-col-replace-style');
        expect(ws).to.not.be.undefined();

        expect(ws.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          'one-two',
          '1,3',
          '1,4',
        ]);
        expect(ws.getRow(2).values).to.deep.equal([
          ,
          '2,1',
          'two-two',
          '2,3',
          '2,4',
        ]);
        expect(ws.getRow(3).values).to.deep.equal([
          ,
          '3,1',
          'three-two',
          '3,3',
          '3,4',
        ]);

        expect(ws.getCell('A2').style).to.deep.equal({
          numFmt: 'left',
          alignment: {
            horizontal: 'left',
            vertical: 'top',
          },
        });
        expect(ws.getCell('B2').style).to.deep.equal({});
        expect(ws.getCell('C2').style).to.deep.equal({
          numFmt: 'right',
          alignment: {
            horizontal: 'right',
            vertical: 'bottom',
          },
        });
        expect(ws.getColumn(1).style).to.deep.equal({
          alignment: {
            horizontal: 'left',
            vertical: 'top',
          },
        });
        expect(ws.getColumn(2).style).to.deep.equal({});
        expect(ws.getColumn(3).style).to.deep.equal({
          alignment: {
            horizontal: 'right',
            vertical: 'bottom',
          },
        });
      },
    },
    removeDefinedNames: {
      addSheet(wb) {
        const wsSquare = wb.addWorksheet('splice-col-remove-name-square');
        wsSquare.addRow(['1,1', '1,2', '1,3', '1,4']);
        wsSquare.addRow(['2,1', '2,2', '2,3', '2,4']);
        wsSquare.addRow(['3,1', '3,2', '3,3', '3,4']);
        wsSquare.addRow(['4,1', '4,2', '4,3', '4,4']);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3, 4].forEach(row => {
            wsSquare.getCell(col + row).name = 'square';
          });
        });

        wsSquare.spliceColumns(2, 2);

        const wsSingles = wb.addWorksheet('splice-col-remove-name-singles');
        wsSingles.getCell('A1').value = '1,1';
        wsSingles.getCell('A4').value = '4,1';
        wsSingles.getCell('D1').value = '1,4';
        wsSingles.getCell('D4').value = '4,4';

        ['A', 'D'].forEach(col => {
          [1, 4].forEach(row => {
            wsSingles.getCell(col + row).name = `single-${col}${row}`;
          });
        });

        wsSingles.spliceColumns(2, 2);
      },

      checkSheet(wb) {
        const wsSquare = wb.getWorksheet('splice-col-remove-name-square');
        expect(wsSquare).to.not.be.undefined();

        expect(wsSquare.getRow(1).values).to.deep.equal([, '1,1', '1,4']);
        expect(wsSquare.getRow(2).values).to.deep.equal([, '2,1', '2,4']);
        expect(wsSquare.getRow(3).values).to.deep.equal([, '3,1', '3,4']);
        expect(wsSquare.getRow(4).values).to.deep.equal([, '4,1', '4,4']);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3].forEach(row => {
            if (['C', 'D'].includes(col)) {
              expect(wsSquare.getCell(col + row).name).to.be.undefined();
            } else {
              expect(wsSquare.getCell(col + row).name).to.equal('square');
            }
          });
        });

        const wsSingles = wb.getWorksheet('splice-col-remove-name-singles');
        expect(wsSingles).to.not.be.undefined();

        expect(wsSingles.getRow(1).values).to.deep.equal([, '1,1', '1,4']);
        expect(wsSingles.getRow(4).values).to.deep.equal([, '4,1', '4,4']);

        expect(wsSingles.getCell('A1').name).to.equal('single-A1');
        expect(wsSingles.getCell('A4').name).to.equal('single-A4');
        expect(wsSingles.getCell('B1').name).to.equal('single-D1');
        expect(wsSingles.getCell('B4').name).to.equal('single-D4');
      },
    },
    insertDefinedNames: {
      addSheet(wb) {
        const wsSquare = wb.addWorksheet('splice-col-insert-name-square');
        wsSquare.addRow(['1,1', '1,2', '1,3', '1,4']);
        wsSquare.addRow(['2,1', '2,2', '2,3', '2,4']);
        wsSquare.addRow(['3,1', '3,2', '3,3', '3,4']);
        wsSquare.addRow(['4,1', '4,2', '4,3', '4,4']);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3, 4].forEach(row => {
            wsSquare.getCell(col + row).name = 'square';
          });
        });

        wsSquare.spliceColumns(3, 0, ['foo', 'bar', 'baz', 'qux']);

        const wsSingles = wb.addWorksheet('splice-col-insert-name-singles');
        wsSingles.getCell('A1').value = '1,1';
        wsSingles.getCell('A4').value = '4,1';
        wsSingles.getCell('D1').value = '1,4';
        wsSingles.getCell('D4').value = '4,4';

        ['A', 'D'].forEach(col => {
          [1, 4].forEach(row => {
            wsSingles.getCell(col + row).name = `single-${col}${row}`;
          });
        });

        wsSingles.spliceColumns(3, 0, ['foo', 'bar', 'baz', 'qux']);
      },

      checkSheet(wb) {
        const wsSquare = wb.getWorksheet('splice-col-insert-name-square');
        expect(wsSquare).to.not.be.undefined();

        expect(wsSquare.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          '1,2',
          'foo',
          '1,3',
          '1,4',
        ]);
        expect(wsSquare.getRow(2).values).to.deep.equal([
          ,
          '2,1',
          '2,2',
          'bar',
          '2,3',
          '2,4',
        ]);
        expect(wsSquare.getRow(3).values).to.deep.equal([
          ,
          '3,1',
          '3,2',
          'baz',
          '3,3',
          '3,4',
        ]);
        expect(wsSquare.getRow(4).values).to.deep.equal([
          ,
          '4,1',
          '4,2',
          'qux',
          '4,3',
          '4,4',
        ]);

        ['A', 'B', 'C', 'D', 'E'].forEach(col => {
          [1, 2, 3, 4].forEach(row => {
            if (col === 'C') {
              expect(wsSquare.getCell(col + row).name).to.be.undefined();
            } else {
              expect(wsSquare.getCell(col + row).name).to.equal('square');
            }
          });
        });

        const wsSingles = wb.getWorksheet('splice-col-insert-name-singles');
        expect(wsSingles).to.not.be.undefined();

        expect(wsSingles.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          ,
          'foo',
          ,
          '1,4',
        ]);
        expect(wsSingles.getRow(4).values).to.deep.equal([
          ,
          '4,1',
          ,
          'qux',
          ,
          '4,4',
        ]);

        expect(wsSingles.getCell('A1').name).to.equal('single-A1');
        expect(wsSingles.getCell('A4').name).to.equal('single-A4');
        expect(wsSingles.getCell('E1').name).to.equal('single-D1');
        expect(wsSingles.getCell('E4').name).to.equal('single-D4');
      },
    },
    replaceDefinedNames: {
      addSheet(wb) {
        const wsSquare = wb.addWorksheet('splice-col-replace-name-square');
        wsSquare.addRow(['1,1', '1,2', '1,3', '1,4']);
        wsSquare.addRow(['2,1', '2,2', '2,3', '2,4']);
        wsSquare.addRow(['3,1', '3,2', '3,3', '3,4']);
        wsSquare.addRow(['4,1', '4,2', '4,3', '4,4']);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3, 4].forEach(row => {
            wsSquare.getCell(col + row).name = 'square';
          });
        });

        wsSquare.spliceColumns(2, 1, ['foo', 'bar', 'baz', 'qux']);

        const wsSingles = wb.addWorksheet('splice-col-replace-name-singles');
        wsSingles.getCell('A1').value = '1,1';
        wsSingles.getCell('A4').value = '4,1';
        wsSingles.getCell('D1').value = '1,4';
        wsSingles.getCell('D4').value = '4,4';

        ['A', 'D'].forEach(col => {
          [1, 4].forEach(row => {
            wsSingles.getCell(col + row).name = `single-${col}${row}`;
          });
        });

        wsSingles.spliceColumns(2, 1, ['foo', 'bar', 'baz', 'qux']);
      },

      checkSheet(wb) {
        const wsSquare = wb.getWorksheet('splice-col-replace-name-square');
        expect(wsSquare).to.not.be.undefined();

        expect(wsSquare.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          'foo',
          '1,3',
          '1,4',
        ]);
        expect(wsSquare.getRow(2).values).to.deep.equal([
          ,
          '2,1',
          'bar',
          '2,3',
          '2,4',
        ]);
        expect(wsSquare.getRow(3).values).to.deep.equal([
          ,
          '3,1',
          'baz',
          '3,3',
          '3,4',
        ]);
        expect(wsSquare.getRow(4).values).to.deep.equal([
          ,
          '4,1',
          'qux',
          '4,3',
          '4,4',
        ]);

        ['A', 'B', 'C', 'D'].forEach(col => {
          [1, 2, 3, 4].forEach(row => {
            if (col === 'B') {
              expect(wsSquare.getCell(col + row).name).to.be.undefined();
            } else {
              expect(wsSquare.getCell(col + row).name).to.equal('square');
            }
          });
        });

        const wsSingles = wb.getWorksheet('splice-col-replace-name-singles');
        expect(wsSingles).to.not.be.undefined();

        expect(wsSingles.getRow(1).values).to.deep.equal([
          ,
          '1,1',
          'foo',
          ,
          '1,4',
        ]);
        expect(wsSingles.getRow(4).values).to.deep.equal([
          ,
          '4,1',
          'qux',
          ,
          '4,4',
        ]);

        expect(wsSingles.getCell('A1').name).to.equal('single-A1');
        expect(wsSingles.getCell('A4').name).to.equal('single-A4');
        expect(wsSingles.getCell('D1').name).to.equal('single-D1');
        expect(wsSingles.getCell('D4').name).to.equal('single-D4');
      },
    },
  },
};
