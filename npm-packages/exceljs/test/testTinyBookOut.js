const HrStopwatch = require('./utils/hr-stopwatch');
const Workbook = require('../lib/doc/workbook');

const filename = process.argv[2];

const wb = new Workbook();
const ws = wb.addWorksheet('blort');

ws.getCell('A1').value = 7;
ws.getCell('B1').value = 'Hello, World!';

const stopwatch = new HrStopwatch();
stopwatch.start();
wb.xlsx.writeFile(filename).then(() => {
  const micros = stopwatch.microseconds;
  console.log('Done.');
  console.log('Time taken:', micros);
});
// .catch(function(error) {
//    console.log(error.message);
// })
