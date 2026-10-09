const Excel = require('../excel');

const filename = process.argv[2];

const wb = new Excel.Workbook();

let passed = true;
const assert = function(value, failMessage, passMessage) {
  if (!value) {
    if (failMessage) {
      console.log(failMessage);
    }
    passed = false;
  } else if (passMessage) {
    console.log(passMessage);
  }
};

// const assertEqual = function(address, name, value, expected) {
//   assert(
//     _.isEqual(value, expected),
//     `Expected Cell[${address}] ${name} to be ${JSON.stringify(
//       expected
//     )}, was ${JSON.stringify(value)}`
//   );
// };

const assertDate = function(address, cell, expected) {
  assert(
    cell.type === Excel.ValueType.Date,
    `expected ${address} type to be Date, was ${cell.type}`
  );
  assert(
    cell.value instanceof Date,
    `expected  value ${address} to be a Date, was ${cell.value}`
  );
  const {value} = cell;
  assert(
    value.getYear() === expected.getYear(),
    `expected ${address} Year to be ${expected.getYear()}, was ${value.getYear()}`
  );
  assert(
    value.getMonth() === expected.getMonth(),
    `expected ${address} Month to be ${expected.getMonth()}, was ${value.getMonth()}`
  );
  assert(
    value.getDay() === expected.getDay(),
    `expected ${address} Day to be ${expected.getDay()}, was ${value.getDay()}`
  );
  assert(
    value.getHours() === expected.getHours(),
    `expected ${address} Hour to be ${expected.getHours()}, was ${value.getHours()}`
  );
  assert(
    value.getMinutes() === expected.getMinutes(),
    `expected ${address} Minute to be ${expected.getMinutes()}, was ${value.getMinutes()}`
  );
  assert(
    value.getSeconds() === expected.getSeconds(),
    `expected ${address} Second to be ${expected.getSeconds()}, was ${value.getSeconds()}`
  );
};

const options = {
  dateFormats: ['DD/MM/YYYY HH:mm:ss'],
};

// assuming file created by testBookOut
wb.csv.readFile(filename, options).then(() => {
  const ws = wb.getWorksheet();

  assert(ws, 'Expected to find at least one worksheet');

  assert(ws.getCell('A2').value === 7, 'Expected A2 == 7');
  assert(
    ws.getCell('A2').type === Excel.ValueType.Number,
    `expected A2 type to be Number, was ${ws.getCell('A2').type}`
  );
  assert(
    ws.getCell('B2').value === 'Hello, World!',
    `Expected B2 == "Hello, World!", was "${ws.getCell('B2').value}"`
  );
  assert(
    ws.getCell('B2').type === Excel.ValueType.String,
    `expected B2 type to be String, was ${ws.getCell('B2').type}`
  );

  assert(
    Math.abs(ws.getCell('C2').value + 5.55) < 0.000001,
    `Expected C2 == -5.55, was ${ws.getCell('C2').value}`
  );
  assert(
    ws.getCell('C2').type === Excel.ValueType.Number,
    `expected C2 type to be Number, was ${ws.getCell('C2').type}`
  );

  const expected = new Date(2015, 2, 10, 7, 8, 9);
  assertDate('D2', ws.getCell('D2'), expected);

  assert(ws.getCell('C5').value === 3, 'Expected C5 == 3');
  assert(
    ws.getCell('C5').type === Excel.ValueType.Number,
    `expected C5 type to be Number, was ${ws.getCell('C5').type}`
  );

  assert(ws.getCell('A7').value === 1, 'Expected A7 == 1');
  assert(
    ws.getCell('A7').type === Excel.ValueType.Number,
    `expected A7 type to be Number, was ${ws.getCell('A7').type}`
  );
  assert(ws.getCell('B7').value === 2, 'Expected B7 == 2');
  assert(
    ws.getCell('B7').type === Excel.ValueType.Number,
    `expected B7 type to be Number, was ${ws.getCell('B7').type}`
  );
  assert(
    ws.getCell('C7').value === null,
    `Expected C7 == null, was ${ws.getCell('C7').value}`
  );
  assert(
    ws.getCell('C7').type === Excel.ValueType.Null,
    `expected C7 type to be Null, was ${ws.getCell('C7').type}`
  );
  assert(ws.getCell('D7').value === 4, 'Expected D7 == 4');
  assert(
    ws.getCell('D7').type === Excel.ValueType.Number,
    `expected D7 type to be Number, was ${ws.getCell('D7').type}`
  );

  assert(
    ws.getCell('A10').value === '<',
    `Expected A10 to be "<", was "${ws.getCell('A10').value}"`
  );
  assert(
    ws.getCell('B10').value === '>',
    `Expected A10 to be ">", was "${ws.getCell('B10').value}"`
  );
  assert(
    ws.getCell('C10').value === '<a>',
    `Expected A10 to be "<a>", was "${ws.getCell('C10').value}"`
  );
  assert(
    ws.getCell('D10').value === '><',
    `Expected A10 to be "><", was "${ws.getCell('D10').value}"`
  );

  assert(passed, 'Something went wrong', 'All tests passed!');
});
