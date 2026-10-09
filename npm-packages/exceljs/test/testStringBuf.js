const utils = require('./utils/utils');
const HrStopwatch = require('./utils/hr-stopwatch');

const StringBuf = require('../lib/utils/string-buf.js');

const SIZE = 1048576;

function testWrite(results) {
  const a = [];

  function test(size) {
    return function() {
      console.log(`Write: ${size}`);
      const text = utils.randomName(size);
      const sb = new StringBuf({size: SIZE + 10});
      const sw = new HrStopwatch();
      sw.start();
      while (sb.length < SIZE) {
        sb.addText(text);
      }
      sw.stop();
      a.push(`${size}:${Math.round(sw.span * 1000)}`);
    };
  }

  return Promise.resolve()
    .then(test(1))
    .delay(1000)
    .then(test(2))
    .delay(1000)
    .then(test(4))
    .delay(1000)
    .then(test(8))
    .delay(1000)
    .then(test(16))
    .delay(1000)
    .then(test(32))
    .delay(1000)
    .then(test(64))
    .delay(1000)
    .then(() => {
      results.write = a.join(', ');
      return results;
    });
}

function testGrow(results) {
  const a = [];

  function test(size) {
    return function() {
      console.log(`Grow: ${size}`);
      const text = utils.randomName(size);
      const sb = new StringBuf({size: 8});
      const sw = new HrStopwatch();
      sw.start();
      while (sb.length < SIZE) {
        sb.addText(text);
      }
      sw.stop();
      a.push(`${size}:${Math.round(sw.span * 1000)}`);
    };
  }

  return Promise.resolve()
    .then(test(1))
    .delay(1000)
    .then(test(2))
    .delay(1000)
    .then(test(4))
    .delay(1000)
    .then(test(8))
    .delay(1000)
    .then(test(16))
    .delay(1000)
    .then(test(32))
    .delay(1000)
    .then(test(64))
    .delay(1000)
    .then(() => {
      results.grow = a.join(', ');
      return results;
    });
}

const results = {};
Promise.resolve(results)
  .then(testWrite)
  .then(testGrow)
  .then(r => {
    console.log(JSON.stringify(r, null, '  '));
  });
