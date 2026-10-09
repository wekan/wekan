'use strict';

const utils = require('./utils/utils');
const HrStopwatch = require('./utils/hr-stopwatch');
const ColumnSum = require('./utils/column-sum');

const Excel = require('../excel');

const {Workbook} = Excel;
const {WorkbookReader} = Excel.stream.xlsx;

if (process.argv[2] === 'help') {
  console.log('Usage:');
  console.log('    node testBigBookIn filename reader plan');
  console.log('Where:');
  console.log('    reader is one of [stream, document]');
  console.log('    plan is one of [zero, one, two, hyperlinks]');
  // eslint-disable-next-line no-process-exit
  process.exit(0);
}

const filename = process.argv[2];
const reader = process.argv.length > 3 ? process.argv[3] : 'stream';
const plan = process.argv.length > 4 ? process.argv[4] : 'one';

const useStream = reader === 'stream';

function getTimeout() {
  const memory = process.memoryUsage();
  const heapSize = memory.heapTotal;
  if (heapSize < 300000000) {
    return 0;
  }
  if (heapSize < 600000000) {
    return heapSize / 5000000;
  }
  if (heapSize < 1000000000) {
    return heapSize / 2000000;
  }
  return heapSize / 1000000;
}

const options = {
  reader: useStream ? 'stream' : 'document',
  filename,
  plan,
  gc: {
    getTimeout,
  },
};
console.log(JSON.stringify(options, null, '  '));

const stopwatch = new HrStopwatch();
stopwatch.start();

function logProgress(count) {
  const memory = process.memoryUsage();
  const txtCount = utils.fmt.number(count);
  const txtHeap = utils.fmt.number(memory.heapTotal);
  process.stdout.write(`Count: ${txtCount}, Heap Size: ${txtHeap}\u001b[0G`);
}

const colCount = new ColumnSum([3, 6, 7, 8]);
let hyperlinkCount = 0;

function checkRow(row) {
  if (row.number > 1) {
    colCount.add(row);

    if (colCount.count % 1000 === 0) {
      logProgress(colCount.count);
    }
  }
  row.destroy();
}

function report() {
  console.log(`Count: ${colCount.count}`);
  console.log(`Sums: ${colCount}`);
  console.log(`Hyperlinks: ${hyperlinkCount}`);

  stopwatch.stop();
  console.log(`Time: ${stopwatch}`);
}

if (useStream) {
  const wb = new WorkbookReader();
  wb.on('end', () => {
    console.log('reached end of stream');
  });
  wb.on('finished', report);
  wb.on('worksheet', worksheet => {
    worksheet.on('row', checkRow);
  });
  wb.on('hyperlinks', hyperlinks => {
    hyperlinks.on('hyperlink', () => {
      hyperlinkCount++;
    });
  });
  wb.on('entry', entry => {
    console.log(JSON.stringify(entry));
  });
  switch (options.plan) {
    case 'zero':
      wb.read(filename, {
        entries: 'emit',
      });
      break;
    case 'one':
      wb.read(filename, {
        entries: 'emit',
        worksheets: 'emit',
      });
      break;
    case 'two':
      break;
    case 'hyperlinks':
      wb.read(filename, {
        hyperlinks: 'emit',
      });
      break;
    default:
      break;
  }
} else {
  const wb = new Workbook();
  wb.xlsx
    .readFile(filename)
    .then(() => {
      const ws = wb.getWorksheet('blort');
      ws.eachRow(checkRow);
    })
    .then(report);
}
