const HrStopwatch = require('./utils/hr-stopwatch');

const Excel = require('../excel');

const {Workbook} = Excel;

const [, , filename] = process.argv;

const stopwatch = new HrStopwatch();
stopwatch.start();

const wb = new Workbook();
const ws = wb.addWorksheet('blort');

for (let row = 1; row <= 100; row++) {
  const values = [];
  if (row === 1) {
    values.push('');
    for (let col = 2; col <= 100; col++) {
      values.push(`Col ${col}`);
    }
  } else {
    for (let col = 1; col <= 100; col++) {
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

wb.xlsx
  .writeFile(filename)
  .then(() => {
    const micros = stopwatch.microseconds;
    console.log('Done.');
    console.log('Time taken:', micros);
  })
  .catch(error => {
    console.log(error.message);
  });
