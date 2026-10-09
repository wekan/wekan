const Excel = require('../excel');

const {Workbook} = Excel;

const [, , filename] = process.argv;

const wb = new Workbook();
const ws = wb.addWorksheet('test sheet');

for (let row = 1; row <= 10; row++) {
  const values = [];
  if (row === 1) {
    values.push('');
    for (let col = 2; col <= 10; col++) {
      values.push(`Col ${col}`);
    }
  } else {
    for (let col = 1; col <= 10; col++) {
      if (col === 1) {
        values.push(`Row ${row}`);
      } else {
        values.push(`${row}-${col}`);
      }
    }
  }
  ws.addRow(values);
}

ws.pageSetup.printTitlesColumn = 'A:A';
ws.pageSetup.printTitlesRow = '1:1';
ws.pageSetup.printArea = 'A1:B5&&A6:B10';

wb.xlsx
  .writeFile(filename)
  .then(() => {
    console.log('Done.');
  })
  .catch(error => {
    console.log(error.message);
  });
