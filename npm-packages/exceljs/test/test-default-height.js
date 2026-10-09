const HrStopwatch = require('./utils/hr-stopwatch');
const {Workbook} = require('../lib/exceljs.nodejs');

const [, , filename] = process.argv;

if (!filename) {
  console.error('Must specify a filename');
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}

const wb = new Workbook();
const ws = wb.addWorksheet('blort');

ws.getCell('B2').value = 'Hello';
ws.properties.defaultRowHeight = 50;

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
    console.error(error.stack);
  });
