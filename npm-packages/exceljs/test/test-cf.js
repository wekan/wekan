const Excel = require('../lib/exceljs.nodejs.js');
const Range = require('../lib/doc/range');

const HrStopwatch = require('./utils/hr-stopwatch');

const [, , filename] = process.argv;

const wb = new Excel.Workbook();

function addTable(ws, ref) {
  const range = new Range(ref);
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(
    (day, index) => {
      ws.getCell(range.top, range.left + index).value = day;
    }
  );
  let count = 1;
  for (let i = 1; i <= 6; i++) {
    for (let j = 0; j < 5; j++) {
      ws.getCell(range.top + i, range.left + j).value = count++;
    }
  }
}

function addDateTable(ws, ref) {
  const range = new Range(ref);
  [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ].forEach((day, index) => {
    ws.getCell(range.top, range.left + index).value = day;
  });
  const DAY = 86400000;
  const now = Date.now();
  const today = now - (now % DAY);
  let dt = new Date(today);
  const sow = today - ( (dt.getDay() - 1) * DAY );
  const som = sow - (28 * DAY);
  dt = new Date(som);

  for (let i = 1; i <= 9; i++) {
    for (let j = 0; j < 7; j++) {
      const cell = ws.getCell(range.top + i, range.left + j);
      cell.value = dt;
      cell.numFmt = 'DD MMM';
      dt = new Date(dt.getTime() + DAY);
    }
  }
}

// ============================================================================
// Expression
const expressionWS = wb.addWorksheet('Formula');

addTable(expressionWS, 'A1:E7');
expressionWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'expression',
      priority: 3,
      formulae: ['MOD(ROW()+COLUMN(),2)=0'],
      style: {font: {bold: true}},
    },
  ],
});

// testing priority
expressionWS.addConditionalFormatting({
  ref: 'A2',
  rules: [
    {
      type: 'expression',
      priority: 1,
      formulae: ['TRUE'],
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FF00'}},
      },
    },
    {
      type: 'expression',
      priority: 2,
      formulae: ['TRUE'],
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FFFF0000'}},
      },
    },
  ],
});

// ============================================================================
// Highlight Cells
const highlightWS = wb.addWorksheet('Highlight');

addTable(highlightWS, 'A1:E7');
highlightWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'cellIs',
      operator: 'greaterThan',
      formulae: [13],
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FF00'}},
      },
    },
  ],
});

// ============================================================================
// Top 10% (and bottom)
const top10pcWS = wb.addWorksheet('Top 10%');

addTable(top10pcWS, 'A1:E7');
top10pcWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'top10',
      percent: true,
      rank: 10,
      style: {font: {bold: true}},
    },
    {
      type: 'top10',
      percent: true,
      bottom: true,
      rank: 10,
      style: {font: {italic: true}},
    },
  ],
});

// top and bottom 8
addTable(top10pcWS, 'G1:K7');
top10pcWS.addConditionalFormatting({
  ref: 'G1:K7',
  rules: [
    {
      type: 'top10',
      percent: false,
      rank: 8,
      style: {font: {bold: true}},
    },
    {
      type: 'top10',
      percent: false,
      bottom: true,
      rank: 8,
      style: {font: {italic: true}},
    },
  ],
});

// above and below average
addTable(top10pcWS, 'M1:Q7');
top10pcWS.addConditionalFormatting({
  ref: 'M1:Q7',
  rules: [
    {
      type: 'aboveAverage',
      style: {font: {bold: true}},
    },
    {
      type: 'aboveAverage',
      aboveAverage: false,
      style: {font: {italic: true}},
    },
  ],
});

// ============================================================================
// Colour Scales
const colourScaleWS = wb.addWorksheet('Colour Scales');

addTable(colourScaleWS, 'A1:E7');
colourScaleWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'colorScale',
      cfvo: [{type: 'min'}, {type: 'percentile', value: 50}, {type: 'max'}],
      color: [{argb: 'FFF8696B'}, {argb: 'FFFFEB84'}, {argb: 'FF63BE7B'}],
    },
  ],
});

// top and bottom 8
addTable(colourScaleWS, 'G1:K7');
colourScaleWS.addConditionalFormatting({
  ref: 'G1:K7',
  rules: [
    {
      type: 'colorScale',
      cfvo: [{type: 'min'}, {type: 'max'}],
      color: [{argb: 'FFF8696B'}, {argb: 'FFFCFCFF'}],
    },
  ],
});

// ============================================================================
// Arrows
const arrowsWS = wb.addWorksheet('Arrows');

addTable(arrowsWS, 'A1:E7');
arrowsWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'iconSet',
      iconSet: '3Arrows',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 66},
      ],
    },
  ],
});

addTable(arrowsWS, 'G1:K7');
arrowsWS.addConditionalFormatting({
  ref: 'G1:K7',
  rules: [
    {
      type: 'iconSet',
      iconSet: '4Arrows',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 25},
        {type: 'percent', value: 50},
        {type: 'percent', value: 75},
      ],
    },
  ],
});

addTable(arrowsWS, 'M1:Q7');
arrowsWS.addConditionalFormatting({
  ref: 'M1:Q7',
  rules: [
    {
      type: 'iconSet',
      iconSet: '5Arrows',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 20},
        {type: 'percent', value: 40},
        {type: 'percent', value: 60},
        {type: 'percent', value: 80},
      ],
    },
  ],
});

addTable(arrowsWS, 'A9:E15');
arrowsWS.addConditionalFormatting({
  ref: 'A9:E15',
  rules: [
    {
      type: 'iconSet',
      iconSet: '4ArrowsGray',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 25},
        {type: 'percent', value: 50},
        {type: 'percent', value: 75},
      ],
    },
  ],
});

addTable(arrowsWS, 'G9:K15');
arrowsWS.addConditionalFormatting({
  ref: 'G9:K15',
  rules: [
    {
      type: 'iconSet',
      iconSet: '3TrafficLights',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'num', value: 'COLUMN()'},
        {type: 'num', value: 'ROW()'},
      ],
    },
  ],
});

// ============================================================================
// Shapes
const shapesWS = wb.addWorksheet('Shapes');

addTable(shapesWS, 'A1:E7');
shapesWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'iconSet',
      iconSet: '3TrafficLights',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
  ],
});

addTable(shapesWS, 'G1:K6');
shapesWS.addConditionalFormatting({
  ref: 'G1:K6',
  rules: [
    {
      type: 'iconSet',
      iconSet: '5Quarters',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 20},
        {type: 'percent', value: 40},
        {type: 'percent', value: 60},
        {type: 'percent', value: 80},
      ],
    },
  ],
});

addTable(shapesWS, 'M1:Q7');
shapesWS.addConditionalFormatting({
  ref: 'M1:Q7',
  rules: [
    {
      type: 'iconSet',
      iconSet: '3TrafficLights',
      showValue: false,
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
  ],
});

addTable(shapesWS, 'A9:E15');
shapesWS.addConditionalFormatting({
  ref: 'A9:E15',
  rules: [
    {
      type: 'iconSet',
      iconSet: '3TrafficLights',
      reverse: true,
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
  ],
});

// ============================================================================
// Shapes
const extSshapesWS = wb.addWorksheet('Ext Shapes');

addTable(extSshapesWS, 'A1:E7');
extSshapesWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'iconSet',
      iconSet: '3Stars',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
  ],
});

addTable(extSshapesWS, 'G1:K7');
extSshapesWS.addConditionalFormatting({
  ref: 'G1:K7',
  rules: [
    {
      type: 'iconSet',
      iconSet: '3Triangles',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
  ],
});

addTable(extSshapesWS, 'M1:Q7');
extSshapesWS.addConditionalFormatting({
  ref: 'M1:Q7',
  rules: [
    {
      type: 'iconSet',
      iconSet: '5Boxes',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 20},
        {type: 'percent', value: 40},
        {type: 'percent', value: 60},
        {type: 'percent', value: 80},
      ],
    },
  ],
});

// ============================================================================
// Databar
const databarWS = wb.addWorksheet('Databar');

addTable(databarWS, 'A1:E7');
databarWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'dataBar',
      color: {argb: 'FFFF0000'},
      gradient: true,
      cfvo: [
        {type: 'num', value: 5},
        {type: 'num', value: 20},
      ],
    },
  ],
});

addTable(databarWS, 'G1:K7');
databarWS.addConditionalFormatting({
  ref: 'G1:K7',
  rules: [
    {
      type: 'dataBar',
      color: {argb: 'FF00FF00'},
      gradient: false,
      cfvo: [
        {type: 'num', value: 5},
        {type: 'num', value: 20},
      ],
    },
  ],
});

// ============================================================================
// Cell Is
const cellIsWS = wb.addWorksheet('Cell Is');

addTable(cellIsWS, 'A1:E7');
cellIsWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'cellIs',
      operator: 'equal',
      formulae: [13],
      style: {font: {bold: true}},
    },
    {
      type: 'cellIs',
      operator: 'greaterThan',
      formulae: [22],
      style: {font: {italic: true}},
    },
    {
      type: 'cellIs',
      operator: 'lessThan',
      formulae: [4],
      style: {font: {underline: true}},
    },
    {
      type: 'cellIs',
      operator: 'between',
      formulae: [16, 20],
      style: {font: {strike: true}},
    },
  ],
});

// ============================================================================
// Contains
const containsWS = wb.addWorksheet('Contains');

addTable(containsWS, 'A1:E7');
containsWS.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'containsText',
      operator: 'containsText',
      text: 'sday',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FF00'}},
      },
    },
  ],
});

addTable(containsWS, 'G1:K7');
containsWS.addConditionalFormatting({
  ref: 'G1:K7',
  rules: [
    {
      type: 'containsText',
      operator: 'containsBlanks',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FFFF0000'}},
      },
    },
  ],
});

addTable(containsWS, 'M1:Q7');
containsWS.addConditionalFormatting({
  ref: 'M1:Q7',
  rules: [
    {
      type: 'containsText',
      operator: 'notContainsBlanks',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF0000FF'}},
      },
    },
  ],
});

addTable(containsWS, 'A9:E15');
containsWS.addConditionalFormatting({
  ref: 'A9:E15',
  rules: [
    {
      type: 'containsText',
      operator: 'containsErrors',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FF00'}},
      },
    },
  ],
});

addTable(containsWS, 'G9:K15');
containsWS.addConditionalFormatting({
  ref: 'G9:K15',
  rules: [
    {
      type: 'containsText',
      operator: 'notContainsErrors',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FFFF0000'}},
      },
    },
  ],
});

// ============================================================================
// Dates
const dateWS = wb.addWorksheet('Dates');

addDateTable(dateWS, 'A1:G10');
dateWS.addConditionalFormatting({
  ref: 'A1:G10',
  rules: [
    {
      type: 'timePeriod',
      timePeriod: 'lastWeek',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FFFF0000'}},
      },
    },
    {
      type: 'timePeriod',
      timePeriod: 'thisWeek',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FF00'}},
      },
    },
    {
      type: 'timePeriod',
      timePeriod: 'nextWeek',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF0000FF'}},
      },
    },
    {
      type: 'timePeriod',
      timePeriod: 'yesterday',
      style: {font: {italic: true}},
    },
    {
      type: 'timePeriod',
      timePeriod: 'today',
      style: {font: {bold: true}},
    },
    {
      type: 'timePeriod',
      timePeriod: 'tomorrow',
      style: {font: {underline: true}},
    },
    {
      type: 'timePeriod',
      timePeriod: 'last7Days',
      style: {font: {strike: true}},
    },
    {
      type: 'timePeriod',
      timePeriod: 'lastMonth',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FFFFFF00'}},
      },
    },
    {
      type: 'timePeriod',
      timePeriod: 'thisMonth',
      style: {
        font: {
          name: 'Comic Sans MS',
          family: 4,
          size: 16,
          underline: 'double',
          bold: true,
        },
      },
    },
    {
      type: 'timePeriod',
      timePeriod: 'nextMonth',
      style: {
        fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FFFF'}},
      },
    },
  ],
});

// ============================================================================
// Save

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
