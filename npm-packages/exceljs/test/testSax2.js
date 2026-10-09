const events = require('events');
const Sax = require('sax');
const utils = require('./utils/utils');

const Row = function(r) {
  this.number = r;
  this.cells = {};
};
Row.prototype = {
  add(cell) {
    this.cells[cell.address] = cell;
  },
};

const parser = Sax.createStream(true, {});

let target = 0;
let count = 0;
const e = new events.EventEmitter();
e.on('drain', () => {
  setImmediate(() => {
    const a = [];
    for (let i = 0; i < 1000; i++) {
      a.push(`<row r="${target++}">`);
      for (let j = 0; j < 10; j++) {
        a.push(`<cell c="${j}">${utils.randomNum(10000)}</cell>`);
      }
      a.push('</row>');
    }
    const buf = Buffer.from(a.join(''));
    parser.write(buf);
  });
});
e.on('row', (/*row*/) => {
  if (++count % 1000 === 0) {
    process.stdout.write(`Count:${count}, ${target}\u001b[0G`); // "\033[0G"
  }
  if (target - count < 100) {
    e.emit('drain');
  }
});
e.on('finished', () => {
  console.log(`Finished worksheet: ${count}`);
});

let row = null;
let cell = null;
parser.on('opentag', node => {
  // console.log('opentag ' + node.name);
  switch (node.name) {
    case 'row': {
      const r = parseInt(node.attributes.r, 10);
      row = new Row(r);
      break;
    }
    case 'cell': {
      const c = parseInt(node.attributes.c, 10);
      cell = {
        c,
        value: '',
      };
      break;
    }
    default:
  }
});
parser.on('text', text => {
  // console.log('text ' + text);
  if (cell) {
    cell.value += text;
  }
});
parser.on('closetag', name => {
  // console.log('closetag ' + name);
  switch (name) {
    case 'row':
      e.emit('row', row);
      row = null;
      break;
    case 'cell':
      row.add(cell);
      break;
    default:
  }
});
parser.on('end', () => {
  e.emit('finished');
});

parser.write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><root>');
e.emit('drain');
