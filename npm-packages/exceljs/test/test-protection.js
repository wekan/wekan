const Excel = require('../lib/exceljs.nodejs.js');
const HrStopwatch = require('./utils/hr-stopwatch');

const [, , filename, password] = process.argv;

const wb = new Excel.Workbook();
const ws = wb.addWorksheet('Foo');
ws.getCell('A1').value = 1;
ws.getCell('B1').value = 2;
ws.getCell('A2').value = {formula: 'A1+2', result: 3};
ws.getCell('B2').value = {formula: 'B1+2', result: 4};

ws.getCell('B1').protection = {locked: false};
ws.getCell('A2').protection = {locked: false};
ws.getCell('B2').protection = {hidden: true};

async function save() {
  const stopwatch = new HrStopwatch();
  stopwatch.start();

  await ws.protect(password);
  console.log('Protection Time:', stopwatch.microseconds);

  stopwatch.start();
  await wb.xlsx.writeFile(filename);
  console.log('Done.');
  console.log('Time taken:', stopwatch.microseconds);
}

save().catch(error => {
  console.log(error.message);
});
