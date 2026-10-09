const HrStopwatch = require('./utils/hr-stopwatch');

const Workbook = require('../lib/doc/workbook');

const filename = process.argv[2];

const wb = new Workbook();
const stopwatch = new HrStopwatch();
stopwatch.start();
wb.xlsx
  .readFile(filename)
  .then(() => {
    const micros = stopwatch.microseconds;
    console.log('Done.');
    console.log('Time taken:', micros);

    const ws = wb.getWorksheet('blort');

    const {image} = ws.background;
    console.log('Media', image.name, image.type, image.buffer.length);
  })
  .catch(error => {
    console.log(error.message);
  });
