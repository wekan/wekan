const testUtils = require('../../utils/index');

const ExcelJS = verquire('exceljs');

const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';
const TEST_CSV_FILE_NAME = './spec/out/wb.test.csv';

// =============================================================================
// Tests

describe('Workbook', () => {
  describe('Serialise', () => {
    it('xlsx file', () => {
      const wb = testUtils.createTestBook(new ExcelJS.Workbook(), 'xlsx');

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          testUtils.checkTestBook(wb2, 'xlsx');
        });
    });
    describe('Xlsx Zip Compression', () => {
      it('xlsx file with best compression', () => {
        const wb = testUtils.createTestBook(new ExcelJS.Workbook(), 'xlsx');

        return wb.xlsx
          .writeFile(TEST_XLSX_FILE_NAME, {
            zip: {
              compression: 'DEFLATE',
              compressionOptions: {
                level: 9,
              },
            },
          })
          .then(() => {
            const wb2 = new ExcelJS.Workbook();
            return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
          })
          .then(wb2 => {
            testUtils.checkTestBook(wb2, 'xlsx');
          });
      });

      it('xlsx file with default compression', () => {
        const wb = testUtils.createTestBook(new ExcelJS.Workbook(), 'xlsx');

        return wb.xlsx
          .writeFile(TEST_XLSX_FILE_NAME, {
            zip: {
              compression: 'DEFLATE',
            },
          })
          .then(() => {
            const wb2 = new ExcelJS.Workbook();
            return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
          })
          .then(wb2 => {
            testUtils.checkTestBook(wb2, 'xlsx');
          });
      });

      it('xlsx file with fast compression', () => {
        const wb = testUtils.createTestBook(new ExcelJS.Workbook(), 'xlsx');

        return wb.xlsx
          .writeFile(TEST_XLSX_FILE_NAME, {
            zip: {
              compression: 'DEFLATE',
              compressionOptions: {
                level: 1,
              },
            },
          })
          .then(() => {
            const wb2 = new ExcelJS.Workbook();
            return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
          })
          .then(wb2 => {
            testUtils.checkTestBook(wb2, 'xlsx');
          });
      });

      it('xlsx file with no compression', () => {
        const wb = testUtils.createTestBook(new ExcelJS.Workbook(), 'xlsx');

        return wb.xlsx
          .writeFile(TEST_XLSX_FILE_NAME, {
            zip: {
              compression: 'STORE',
            },
          })
          .then(() => {
            const wb2 = new ExcelJS.Workbook();
            return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
          })
          .then(wb2 => {
            testUtils.checkTestBook(wb2, 'xlsx');
          });
      });
    });
    it('sheets with correct names', () => {
      const wb = new ExcelJS.Workbook();
      const ws1 = wb.addWorksheet('Hello, World!');
      expect(ws1.name).to.equal('Hello, World!');
      ws1.getCell('A1').value = 'Hello, World!';

      const ws2 = wb.addWorksheet();
      expect(ws2.name).to.match(/sheet\d+/);
      ws2.getCell('A1').value = ws2.name;

      wb.addWorksheet('This & That');

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          expect(wb2.getWorksheet('Hello, World!')).to.be.ok();
          expect(wb2.getWorksheet('This & That')).to.be.ok();
        });
    });

    it('creator, lastModifiedBy, etc', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Hello');
      ws.getCell('A1').value = 'World!';
      wb.creator = 'Foo';
      wb.lastModifiedBy = 'Bar';
      wb.created = new Date(2016, 0, 1);
      wb.modified = new Date(2016, 4, 19);
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          expect(wb2.creator).to.equal(wb.creator);
          expect(wb2.lastModifiedBy).to.equal(wb.lastModifiedBy);
          expect(wb2.created).to.equalDate(wb.created);
          expect(wb2.modified).to.equalDate(wb.modified);
        });
    });
    it('printTitlesRow', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('printHeader');

      ws.getCell('A1').value =
        'This is a header row repeated on every printed page';
      ws.getCell('B2').value = 'This is a header row too';

      for (let i = 0; i < 100; i++) {
        ws.addRow(['not header row']);
      }

      ws.pageSetup.printTitlesRow = '1:2';

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('printHeader');
          expect(ws2.pageSetup.printTitlesRow).to.equal('1:2');
          expect(ws2.pageSetup.printTitlesColumn).to.be.undefined();
        });
    });
    it('printTitlesColumn', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('printColumn');

      ws.getCell('A1').value =
        'This is a column repeated on every printed page';
      ws.getCell('A2').value =
        'This is a column repeated on every printed page';
      ws.getCell('B1').value = 'This is a repeated column too';
      ws.getCell('B2').value = 'This is a repeated column too';

      ws.getCell('C1').value = 'This is a regular column';
      ws.getCell('C2').value = 'This is a regular column';
      ws.getCell('D1').value = 'This is a regular column';
      ws.getCell('D2').value = 'This is a regular column';

      ws.pageSetup.printTitlesRow = 'A:B';

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('printColumn');
          expect(ws2.pageSetup.printTitlesRow).to.be.undefined();
          expect(ws2.pageSetup.printTitlesColumn).to.equal('A:B');
        });
    });
    it('printTitlesRowAndColumn', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('printHeaderAndColumn');

      ws.getCell('A1').value =
        'This is a column / row repeated on every printed page';
      ws.getCell('A2').value =
        'This is a column / row repeated on every printed page';
      ws.getCell('B1').value = 'This is a repeated column / row too';
      ws.getCell('B2').value = 'This is a repeated column / row too';

      ws.getCell('C1').value = 'This is a regular column, repeated row';
      ws.getCell('C2').value = 'This is a regular column, repeated row';
      ws.getCell('D1').value = 'This is a regular column, repeated row';
      ws.getCell('D2').value = 'This is a regular column, repeated row';

      ws.getCell('A3').value = 'This is a repeated column';
      ws.getCell('B3').value = 'This is a repeated column';
      ws.getCell('C3').value = 'This is a regular column / row';
      ws.getCell('D3').value = 'This is a regular column / row';

      ws.pageSetup.printTitlesColumn = 'A:B';
      ws.pageSetup.printTitlesRow = '1:2';

      for (let i = 0; i < 100; i++) {
        ws.addRow([
          'repeated column, not repeated row',
          'repeated column, not repeated row',
          'no repeat',
          'no repeat',
        ]);
      }

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('printHeaderAndColumn');
          expect(ws2.pageSetup.printTitlesRow).to.equal('1:2');
          expect(ws2.pageSetup.printTitlesColumn).to.equal('A:B');
        });
    });

    it('shared formula', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Hello');
      ws.fillFormula('A1:B2', 'ROW()+COLUMN()', [
        [2, 3],
        [3, 4],
      ]);
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('Hello');
          expect(ws2.getCell('A1').value).to.deep.equal({
            formula: 'ROW()+COLUMN()',
            shareType: 'shared',
            ref: 'A1:B2',
            result: 2,
          });
          expect(ws2.getCell('B1').value).to.deep.equal({
            sharedFormula: 'A1',
            result: 3,
          });
          expect(ws2.getCell('A2').value).to.deep.equal({
            sharedFormula: 'A1',
            result: 3,
          });
          expect(ws2.getCell('B2').value).to.deep.equal({
            sharedFormula: 'A1',
            result: 4,
          });
        });
    });

    it('auto filter', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Hello');
      ws.getCell('A1').value = 1;
      ws.getCell('B1').value = 1;
      ws.getCell('A2').value = 2;
      ws.getCell('B2').value = 2;
      ws.getCell('A3').value = 3;
      ws.getCell('B3').value = 3;

      ws.autoFilter = 'A1:B1';

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('Hello');
          expect(ws2.autoFilter).to.equal('A1:B1');
        });
    });

    it('company, manager, etc', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Hello');
      ws.getCell('A1').value = 'World!';
      wb.company = 'Cyber Sapiens, Ltd';
      wb.manager = 'Guyon Roche';
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          expect(wb2.company).to.equal(wb.company);
          expect(wb2.manager).to.equal(wb.manager);
        });
    });

    it('title, subject, etc', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Hello');
      ws.getCell('A1').value = 'World!';
      wb.title = 'the title';
      wb.subject = 'the subject';
      wb.keywords = 'the keywords';
      wb.category = 'the category';
      wb.description = 'the description';
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          expect(wb2.title).to.equal(wb.title);
          expect(wb2.subject).to.equal(wb.subject);
          expect(wb2.keywords).to.equal(wb.keywords);
          expect(wb2.category).to.equal(wb.category);
          expect(wb2.description).to.equal(wb.description);
        });
    });

    it('language, revision and contentStatus', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Hello');
      ws.getCell('A1').value = 'World!';
      wb.language = 'Klingon';
      wb.revision = 2;
      wb.contentStauts = 'Final';
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          expect(wb2.language).to.equal(wb.language);
          expect(wb2.revision).to.equal(wb.revision);
          expect(wb2.contentStatus).to.equal(wb.contentStatus);
        });
    });

    it('empty strings', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Hello');
      ws.getCell('A1').value = 'Foo';
      ws.getCell('A2').value = '';
      ws.getCell('A3').value = 'Baz';
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('Hello');

          expect(ws2.getCell('A1').value).to.equal('Foo');
          expect(ws2.getCell('A2').value).to.equal('');
          expect(ws2.getCell('A3').value).to.equal('Baz');
        });
    });

    it('dataValidations', () => {
      const wb = testUtils.createTestBook(new ExcelJS.Workbook(), 'xlsx', [
        'dataValidations',
      ]);

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          testUtils.checkTestBook(wb2, 'xlsx', ['dataValidations']);
        });
    });

    it('empty string', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet();

      ws.columns = [
        {key: 'id', width: 10},
        {key: 'name', width: 32},
      ];

      ws.addRow({id: 1, name: ''});

      return wb.xlsx.writeFile(TEST_XLSX_FILE_NAME);
    });

    it('a lot of sheets to xlsx file', function() {
      this.timeout(10000);

      let i;
      const wb = new ExcelJS.Workbook();
      const numSheets = 90;
      // add numSheets sheets
      for (i = 1; i <= numSheets; i++) {
        const ws = wb.addWorksheet(`sheet${i}`);
        ws.getCell('A1').value = i;
      }
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          for (i = 1; i <= numSheets; i++) {
            const ws2 = wb2.getWorksheet(`sheet${i}`);
            expect(ws2).to.be.ok();
            expect(ws2.getCell('A1').value).to.equal(i);
          }
        });
    });

    it('csv file', function() {
      this.timeout(5000);

      const wb = testUtils.createTestBook(new ExcelJS.Workbook(), 'csv');

      return wb.csv
        .writeFile(TEST_CSV_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.csv.readFile(TEST_CSV_FILE_NAME).then(() => wb2);
        })
        .then(wb2 => {
          testUtils.checkTestBook(wb2, 'csv');
        });
    });

    it('CSV file and its configuration', function() {
      this.timeout(5000);
      const writeOptions = {
        dateFormat: 'DD/MM/YYYY HH:mm:ss',
        dateUTC: false,
        encoding: 'utf-8',
        includeEmptyRows: false,
        sheetName: 'sheet1',
        formatterOptions: {
          delimiter: '\t',
          quote: false,
        },
      };
      const readOptions = {
        dateFormats: ['DD/MM/YYYY HH:mm:ss'],
        sheetName: 'sheet1',
        parserOptions: {
          delimiter: '\t',
          quote: false,
        },
      };
      const wb = testUtils.createTestBook(new ExcelJS.Workbook(), 'csv');

      return wb.csv
        .writeFile(TEST_CSV_FILE_NAME, writeOptions)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.csv
            .readFile(TEST_CSV_FILE_NAME, readOptions)
            .then(() => wb2);
        })
        .then(wb2 => {
          testUtils.checkTestBook(wb2, 'csv', false, writeOptions);
        });
    });

    it('defined names', () => {
      const wb1 = new ExcelJS.Workbook();
      const ws1a = wb1.addWorksheet('blort');
      const ws1b = wb1.addWorksheet('foo');

      function assign(sheet, address, value, name) {
        const cell = sheet.getCell(address);
        cell.value = value;
        if (Array.isArray(name)) {
          cell.names = name;
        } else {
          cell.name = name;
        }
      }

      // single entry
      assign(ws1a, 'A1', 5, 'five');

      // three amigos - horizontal line
      assign(ws1a, 'A3', 3, 'amigos');
      assign(ws1a, 'B3', 3, 'amigos');
      assign(ws1a, 'C3', 3, 'amigos');

      // three amigos - vertical line
      assign(ws1a, 'E1', 3, 'verts');
      assign(ws1a, 'E2', 3, 'verts');
      assign(ws1a, 'E3', 3, 'verts');

      // four square
      assign(ws1a, 'C5', 4, 'squares');
      assign(ws1a, 'B6', 4, 'squares');
      assign(ws1a, 'C6', 4, 'squares');
      assign(ws1a, 'B5', 4, 'squares');

      // long distance
      assign(ws1a, 'B7', 2, 'sheets');
      assign(ws1b, 'B7', 2, 'sheets');

      // two names
      assign(ws1a, 'G1', 1, 'thing1');
      ws1a.getCell('G1').addName('thing2');

      // once removed
      assign(ws1a, 'G2', 1, ['once', 'twice']);
      ws1a.getCell('G2').removeName('once');

      return wb1.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2a = wb2.getWorksheet('blort');
          const ws2b = wb2.getWorksheet('foo');

          function check(sheet, address, value, name) {
            const cell = sheet.getCell(address);
            expect(cell.value).to.equal(value);
            expect(cell.name).to.equal(name);
          }

          // single entry
          check(ws2a, 'A1', 5, 'five');

          // three amigos - horizontal line
          check(ws2a, 'A3', 3, 'amigos');
          check(ws2a, 'B3', 3, 'amigos');
          check(ws2a, 'C3', 3, 'amigos');

          // three amigos - vertical line
          check(ws2a, 'E1', 3, 'verts');
          check(ws2a, 'E2', 3, 'verts');
          check(ws2a, 'E3', 3, 'verts');

          // four square
          check(ws2a, 'C5', 4, 'squares');
          check(ws2a, 'B6', 4, 'squares');
          check(ws2a, 'C6', 4, 'squares');
          check(ws2a, 'B5', 4, 'squares');

          // long distance
          check(ws2a, 'B7', 2, 'sheets');
          check(ws2b, 'B7', 2, 'sheets');

          // two names
          expect(ws2a.getCell('G1').names).to.have.members([
            'thing1',
            'thing2',
          ]);

          // once removed
          expect(ws2a.getCell('G2').names).to.have.members(['twice']);

          // ranges
          function rangeCheck(name, members) {
            const ranges = wb2.definedNames.getRanges(name);
            expect(ranges.name).to.equal(name);
            if (members.length) {
              expect(ranges.ranges).to.have.members(members);
            } else {
              expect(ranges.ranges.length).to.equal(0);
            }
          }

          rangeCheck('five', ['blort!$A$1']);
          rangeCheck('amigos', ['blort!$A$3:$C$3']);
          rangeCheck('verts', ['blort!$E$1:$E$3']);
          rangeCheck('squares', ['blort!$B$5:$C$6']);
          rangeCheck('sheets', ['blort!$B$7', 'foo!$B$7']);
          rangeCheck('thing1', ['blort!$G$1']);
          rangeCheck('thing2', ['blort!$G$1']);
          rangeCheck('once', []);
          rangeCheck('twice', ['blort!$G$2']);
        });
    });

    describe('Duplicate Rows', () => {
      it('Duplicate rows with styles properly', () => {
        const fileDuplicateRowTestFile =
          './spec/integration/data/duplicateRowTest.xlsx';
        const wb = new ExcelJS.Workbook();
        return wb.xlsx.readFile(fileDuplicateRowTestFile).then(() => {
          const ws = wb.getWorksheet('duplicateTest');

          ws.getCell('A1').value = 'OneInfo';
          ws.getCell('A2').value = 'TwoInfo';
          ws.duplicateRow(1, 2);

          return wb.xlsx
            .writeFile(TEST_XLSX_FILE_NAME)
            .then(() => {
              const wb2 = new ExcelJS.Workbook();
              return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
            })
            .then(wb2 => {
              const ws2 = wb2.getWorksheet('duplicateTest');

              expect(ws2.getCell('A2').value).to.equal('OneInfo');
              expect(ws2.getCell('A2').style).to.equal(ws2.getCell('A1').style);
              expect(ws2.getCell('A3').value).to.equal('OneInfo');
              expect(ws2.getCell('A3').style).to.equal(ws2.getCell('A1').style);
              expect(ws2.getCell('A4').value).to.be.null();
            });
        });
      });

      it('Duplicate rows replacing properly', () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('duplicateTest');
        ws.getCell('A1').value = 'OneInfo';
        ws.getCell('A2').value = 'TwoInfo';
        ws.getCell('A3').value = 'ThreeInfo';
        ws.getCell('A4').value = 'FourInfo';
        ws.duplicateRow(1, 2, false);

        return wb.xlsx
          .writeFile(TEST_XLSX_FILE_NAME)
          .then(() => {
            const wb2 = new ExcelJS.Workbook();
            return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
          })
          .then(wb2 => {
            const ws2 = wb2.getWorksheet('duplicateTest');

            expect(ws2.getCell('A1').value).to.equal('OneInfo');
            expect(ws2.getCell('A2').value).to.equal('OneInfo');
            expect(ws2.getCell('A3').value).to.equal('OneInfo');
            expect(ws2.getCell('A4').value).to.equal('FourInfo');
          });
      });

      it('Duplicate rows shifting properly', () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('duplicateTest');
        ws.getCell('A1').value = 'OneInfo';
        ws.getCell('A2').value = 'TwoInfo';
        ws.getCell('A3').value = 'ThreeInfo';
        ws.getCell('A4').value = 'FourInfo';
        ws.duplicateRow(1, 2, true);

        return wb.xlsx
          .writeFile(TEST_XLSX_FILE_NAME)
          .then(() => {
            const wb2 = new ExcelJS.Workbook();
            return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
          })
          .then(wb2 => {
            const ws2 = wb2.getWorksheet('duplicateTest');

            expect(ws2.getCell('A1').value).to.equal('OneInfo');
            expect(ws2.getCell('A2').value).to.equal('OneInfo');
            expect(ws2.getCell('A3').value).to.equal('OneInfo');
            expect(ws2.getCell('A4').value).to.equal('TwoInfo');
          });
      });

      it('Duplicate rows with height properly', () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('duplicateTest');
        ws.getCell('A1').value = 'OneInfo';
        ws.getCell('A2').value = 'TwoInfo';
        ws.getRow(1).height = 25;
        ws.getRow(2).height = 15;
        ws.duplicateRow(1, 1, true);

        return wb.xlsx
          .writeFile(TEST_XLSX_FILE_NAME)
          .then(() => {
            const wb2 = new ExcelJS.Workbook();
            return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
          })
          .then(wb2 => {
            const ws2 = wb2.getWorksheet('duplicateTest');

            expect(ws2.getCell('A1').value).to.equal('OneInfo');
            expect(ws2.getCell('A2').value).to.equal('OneInfo');
            expect(ws2.getRow(1).height).to.equal(ws2.getRow(2).height);
            expect(ws2.getRow(1).height).to.not.equal(ws2.getRow(3).height);
          });
      });
    });

    describe('Merge Cells', () => {
      it('serialises and deserialises properly', () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('blort');

        // initial values
        ws.getCell('B2').value = 'B2';

        ws.mergeCells('B2:C3');

        return wb.xlsx
          .writeFile(TEST_XLSX_FILE_NAME)
          .then(() => {
            const wb2 = new ExcelJS.Workbook();
            return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
          })
          .then(wb2 => {
            const ws2 = wb2.getWorksheet('blort');

            expect(ws2.getCell('B2').value).to.equal('B2');
            expect(ws2.getCell('B3').value).to.equal('B2');
            expect(ws2.getCell('C2').value).to.equal('B2');
            expect(ws2.getCell('C3').value).to.equal('B2');

            expect(ws2.getCell('B2').type).to.equal(ExcelJS.ValueType.String);
            expect(ws2.getCell('B3').type).to.equal(ExcelJS.ValueType.Merge);
            expect(ws2.getCell('C2').type).to.equal(ExcelJS.ValueType.Merge);
            expect(ws2.getCell('C3').type).to.equal(ExcelJS.ValueType.Merge);
          });
      });

      it('styles', () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('blort');

        // initial values
        const B2 = ws.getCell('B2');
        B2.value = 5;
        B2.style.font = testUtils.styles.fonts.broadwayRedOutline20;
        B2.style.border = testUtils.styles.borders.doubleRed;
        B2.style.fill = testUtils.styles.fills.blueWhiteHGrad;
        B2.style.alignment = testUtils.styles.namedAlignments.middleCentre;
        B2.style.numFmt = testUtils.styles.numFmts.numFmt1;

        // expecting styles to be copied (see worksheet spec)
        ws.mergeCells('B2:C3');

        return wb.xlsx
          .writeFile(TEST_XLSX_FILE_NAME)
          .then(() => {
            const wb2 = new ExcelJS.Workbook();
            return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
          })
          .then(wb2 => {
            const ws2 = wb2.getWorksheet('blort');

            expect(ws2.getCell('B2').font).to.deep.equal(
              testUtils.styles.fonts.broadwayRedOutline20
            );
            expect(ws2.getCell('B2').border).to.deep.equal(
              testUtils.styles.borders.doubleRed
            );
            expect(ws2.getCell('B2').fill).to.deep.equal(
              testUtils.styles.fills.blueWhiteHGrad
            );
            expect(ws2.getCell('B2').alignment).to.deep.equal(
              testUtils.styles.namedAlignments.middleCentre
            );
            expect(ws2.getCell('B2').numFmt).to.equal(
              testUtils.styles.numFmts.numFmt1
            );

            expect(ws2.getCell('B3').font).to.deep.equal(
              testUtils.styles.fonts.broadwayRedOutline20
            );
            expect(ws2.getCell('B3').border).to.deep.equal(
              testUtils.styles.borders.doubleRed
            );
            expect(ws2.getCell('B3').fill).to.deep.equal(
              testUtils.styles.fills.blueWhiteHGrad
            );
            expect(ws2.getCell('B3').alignment).to.deep.equal(
              testUtils.styles.namedAlignments.middleCentre
            );
            expect(ws2.getCell('B3').numFmt).to.equal(
              testUtils.styles.numFmts.numFmt1
            );

            expect(ws2.getCell('C2').font).to.deep.equal(
              testUtils.styles.fonts.broadwayRedOutline20
            );
            expect(ws2.getCell('C2').border).to.deep.equal(
              testUtils.styles.borders.doubleRed
            );
            expect(ws2.getCell('C2').fill).to.deep.equal(
              testUtils.styles.fills.blueWhiteHGrad
            );
            expect(ws2.getCell('C2').alignment).to.deep.equal(
              testUtils.styles.namedAlignments.middleCentre
            );
            expect(ws2.getCell('C2').numFmt).to.equal(
              testUtils.styles.numFmts.numFmt1
            );

            expect(ws2.getCell('C3').font).to.deep.equal(
              testUtils.styles.fonts.broadwayRedOutline20
            );
            expect(ws2.getCell('C3').border).to.deep.equal(
              testUtils.styles.borders.doubleRed
            );
            expect(ws2.getCell('C3').fill).to.deep.equal(
              testUtils.styles.fills.blueWhiteHGrad
            );
            expect(ws2.getCell('C3').alignment).to.deep.equal(
              testUtils.styles.namedAlignments.middleCentre
            );
            expect(ws2.getCell('C3').numFmt).to.equal(
              testUtils.styles.numFmts.numFmt1
            );
          });
      });
    });
  });

  it('spliced meat and ham', () => {
    const wb = new ExcelJS.Workbook();
    const sheets = [
      'splice.rows.removeOnly',
      'splice.rows.insertFewer',
      'splice.rows.insertSame',
      'splice.rows.insertMore',
      'splice.rows.insertStyle',
      'splice.columns.removeOnly',
      'splice.columns.insertFewer',
      'splice.columns.insertSame',
      'splice.columns.insertMore',
    ];
    const options = {
      checkBadAlignments: false,
      checkSheetProperties: false,
      checkViews: false,
    };

    testUtils.createTestBook(wb, 'xlsx', sheets, options);

    return wb.xlsx
      .writeFile(TEST_XLSX_FILE_NAME)
      .then(() => {
        const wb2 = new ExcelJS.Workbook();
        return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
      })
      .then(wb2 => {
        testUtils.checkTestBook(wb2, 'xlsx', sheets, options);
      });
  });

  it('throws an error when xlsx file not found', () => {
    const wb = new ExcelJS.Workbook();
    let success = 0;
    return wb.xlsx
      .readFile('./wb.doesnotexist.xlsx')
      .then((/* wb2 */) => {
        success = 1;
      })
      .catch((/* error */) => {
        success = 2;
        // expect the right kind of error
      })
      .then(() => {
        expect(success).to.equal(2);
      });
  });

  it('throws an error when csv file not found', () => {
    const wb = new ExcelJS.Workbook();
    let success = 0;
    return wb.csv
      .readFile('./wb.doesnotexist.csv')
      .then((/* wb */) => {
        success = 1;
      })
      .catch((/* error */) => {
        success = 2;
        // expect the right kind of error
      })
      .then(() => {
        expect(success).to.equal(2);
      });
  });
  it('throw an error for wrong data type', async () => {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load({});
      expect.fail('should fail for given argument');
    } catch (e) {
      expect(e.message).to.equal(
        'Can\'t read the data of \'the loaded zip file\'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?'
      );
    }
  });

  describe('Sheet Views', () => {
    it('frozen panes', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('frozen');
      ws.views = [
        {
          state: 'frozen',
          xSplit: 2,
          ySplit: 3,
          topLeftCell: 'C4',
          activeCell: 'D5',
        },
        {state: 'frozen', ySplit: 1},
        {state: 'frozen', xSplit: 1},
      ];
      ws.getCell('A1').value = 'Let it Snow!';

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('frozen');
          expect(ws2).to.be.ok();
          expect(ws2.getCell('A1').value).to.equal('Let it Snow!');
          expect(ws2.views).to.deep.equal([
            {
              workbookViewId: 0,
              state: 'frozen',
              xSplit: 2,
              ySplit: 3,
              topLeftCell: 'C4',
              activeCell: 'D5',
              showRuler: true,
              showGridLines: true,
              showRowColHeaders: true,
              zoomScale: 100,
              zoomScaleNormal: 100,
              rightToLeft: false,
            },
            {
              workbookViewId: 0,
              state: 'frozen',
              xSplit: 0,
              ySplit: 1,
              topLeftCell: 'A2',
              showRuler: true,
              showGridLines: true,
              showRowColHeaders: true,
              zoomScale: 100,
              zoomScaleNormal: 100,
              rightToLeft: false,
            },
            {
              workbookViewId: 0,
              state: 'frozen',
              xSplit: 1,
              ySplit: 0,
              topLeftCell: 'B1',
              showRuler: true,
              showGridLines: true,
              showRowColHeaders: true,
              zoomScale: 100,
              zoomScaleNormal: 100,
              rightToLeft: false,
            },
          ]);
        });
    });

    it('serialises split panes', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('split');
      ws.views = [
        {
          state: 'split',
          xSplit: 2000,
          ySplit: 3000,
          topLeftCell: 'C4',
          activeCell: 'D5',
          activePane: 'bottomRight',
        },
        {
          state: 'split',
          ySplit: 1500,
          activePane: 'bottomLeft',
          topLeftCell: 'A10',
        },
        {state: 'split', xSplit: 1500, activePane: 'topRight'},
      ];
      ws.getCell('A1').value = 'Do the splits!';

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('split');
          expect(ws2).to.be.ok();
          expect(ws2.getCell('A1').value).to.equal('Do the splits!');
          expect(ws2.views).to.deep.equal([
            {
              workbookViewId: 0,
              state: 'split',
              xSplit: 2000,
              ySplit: 3000,
              topLeftCell: 'C4',
              activeCell: 'D5',
              activePane: 'bottomRight',
              showRuler: true,
              showGridLines: true,
              showRowColHeaders: true,
              zoomScale: 100,
              zoomScaleNormal: 100,
              rightToLeft: false,
            },
            {
              workbookViewId: 0,
              state: 'split',
              xSplit: 0,
              ySplit: 1500,
              topLeftCell: 'A10',
              activePane: 'bottomLeft',
              showRuler: true,
              showGridLines: true,
              showRowColHeaders: true,
              zoomScale: 100,
              zoomScaleNormal: 100,
              rightToLeft: false,
            },
            {
              workbookViewId: 0,
              state: 'split',
              xSplit: 1500,
              ySplit: 0,
              topLeftCell: undefined,
              activePane: 'topRight',
              showRuler: true,
              showGridLines: true,
              showRowColHeaders: true,
              zoomScale: 100,
              zoomScaleNormal: 100,
              rightToLeft: false,
            },
          ]);
        });
    });

    it('multiple book views', () => {
      const wb = new ExcelJS.Workbook();
      wb.views = [testUtils.views.book.visible, testUtils.views.book.hidden];

      const ws1 = wb.addWorksheet('one');
      ws1.views = [testUtils.views.sheet.frozen];

      const ws2 = wb.addWorksheet('two');
      ws2.views = [testUtils.views.sheet.split];

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          expect(wb2.views).to.deep.equal(wb.views);

          const ws1b = wb2.getWorksheet('one');
          expect(ws1b.views).to.deep.equal(ws1.views);

          const ws2b = wb2.getWorksheet('two');
          expect(ws2b.views).to.deep.equal(ws2.views);
        });
    });
  });
});
