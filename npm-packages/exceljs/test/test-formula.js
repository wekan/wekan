const Excel = require('../lib/exceljs.nodejs.js');
const HrStopwatch = require('./utils/hr-stopwatch');

const [, , filename] = process.argv;

const wb = new Excel.Workbook();
const ws = wb.addWorksheet('Foo');

ws.fillFormula('A1:B2', 'ROW()+COLUMN()', [
  [2, 3],
  [3, 4],
]);

ws.fillFormula('A4:B5', 'A1', [
  [2, 3],
  [3, 4],
]);

for (let i = 1; i <= 4; i++) {
  ws.getCell(`D${i}`).value = {formula: 'ROW()', result: i};
}

ws.fillFormula('E1:E4', 'D1', [1, 1, 1, 1], 'array');

// manual fill formula
ws.getCell('F1').value = {formula: 'ROW()', result: 1};
ws.getCell('F2').value = {sharedFormula: 'F1', result: 2};
ws.getCell('F3').value = {sharedFormula: 'F1', result: 3};
ws.getCell('F4').value = {sharedFormula: 'F1', result: 4};

// function fill
ws.getCell('H1').value = 1;
ws.fillFormula('H2:H20', 'H1+1', row => row);

// array formula

ws.getCell('I1').value = 1;
ws.getCell('J1').value = {
  shareType: 'array',
  ref: 'J1:K2',
  formula: 'I1',
  result: 1,
};

const stopwatch = new HrStopwatch();
stopwatch.start();
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
