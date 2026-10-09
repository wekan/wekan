const fs = require('fs');

const testXformHelper = require('../test-xform-helper');

const Enums = verquire('doc/enums');
const XmlStream = verquire('utils/xml-stream');
const WorksheetXform = verquire('xlsx/xform/sheet/worksheet-xform');

const SharedStringsXform = verquire('xlsx/xform/strings/shared-strings-xform');
const StylesXform = verquire('xlsx/xform/style/styles-xform');

const fakeStyles = {
  addStyleModel(style, cellType) {
    if (cellType === Enums.ValueType.Date) {
      return 1;
    }
    if (style && style.font) {
      return 2;
    }
    return 0;
  },
  getStyleModel(id) {
    switch (id) {
      case 1:
        return {numFmt: 'mm-dd-yy'};
      case 2:
        return {
          font: {
            underline: true,
            size: 11,
            color: {theme: 10},
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
        };
      default:
        return null;
    }
  },
};

const fakeHyperlinkMap = {
  B6: 'https://www.npmjs.com/package/exceljs',
};

function fixDate(model) {
  model.rows[3].cells[1].value = new Date(model.rows[3].cells[1].value);
  return model;
}

const expectations = [
  {
    title: 'Sheet 1',
    create: () => new WorksheetXform(),
    initialModel: fixDate(require('./data/sheet.1.0.json')),
    preparedModel: fixDate(require('./data/sheet.1.1.json')),
    xml: fs.readFileSync(`${__dirname}/data/sheet.1.2.xml`).toString(),
    parsedModel: require('./data/sheet.1.3.json'),
    reconciledModel: fixDate(require('./data/sheet.1.4.json')),
    tests: ['prepare', 'render', 'parse'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 2 - Data Validations',
    create: () => new WorksheetXform(),
    initialModel: require('./data/sheet.2.0.json'),
    preparedModel: require('./data/sheet.2.1.json'),
    xml: fs.readFileSync(`${__dirname}/data/sheet.2.2.xml`).toString(),
    tests: ['prepare', 'render'],
    options: {
      styles: new StylesXform(true),
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 3 - Empty Sheet',
    create: () => new WorksheetXform(),
    preparedModel: require('./data/sheet.3.1.json'),
    xml: fs.readFileSync(`${__dirname}/data/sheet.3.2.xml`).toString(),
    tests: ['render'],
    options: {
      styles: new StylesXform(true),
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
    },
  },
  {
    title: 'Sheet 5 - Shared Formulas',
    create: () => new WorksheetXform(),
    initialModel: require('./data/sheet.5.0.json'),
    preparedModel: require('./data/sheet.5.1.json'),
    xml: fs.readFileSync(`${__dirname}/data/sheet.5.2.xml`).toString(),
    parsedModel: require('./data/sheet.5.3.json'),
    reconciledModel: require('./data/sheet.5.4.json'),
    tests: ['prepare-render', 'parse'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 6 - AutoFilter',
    create: () => new WorksheetXform(),
    preparedModel: require('./data/sheet.6.1.json'),
    xml: fs.readFileSync(`${__dirname}/data/sheet.6.2.xml`).toString(),
    parsedModel: require('./data/sheet.6.3.json'),
    tests: ['render', 'parse'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 7 - Row Breaks',
    create: () => new WorksheetXform(),
    initialModel: require('./data/sheet.7.0.json'),
    preparedModel: require('./data/sheet.7.1.json'),
    xml: fs.readFileSync(`${__dirname}/data/sheet.7.2.xml`).toString(),
    tests: ['prepare', 'render'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
];

describe('WorksheetXform', () => {
  testXformHelper(expectations);

  it('hyperlinks must be after dataValidations', () => {
    const xform = new WorksheetXform();
    const model = require('./data/sheet.4.0.json');
    const xmlStream = new XmlStream();
    const options = {
      styles: new StylesXform(true),
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
    };
    xform.prepare(model, options);
    xform.render(xmlStream, model);

    const {xml} = xmlStream;
    const iHyperlinks = xml.indexOf('hyperlinks');
    const iDataValidations = xml.indexOf('dataValidations');
    expect(iHyperlinks).not.to.equal(-1);
    expect(iDataValidations).not.to.equal(-1);
    expect(iHyperlinks).to.be.greaterThan(iDataValidations);
  });

  it('conditionalFormattings must be before dataValidations', () => {
    const xform = new WorksheetXform();
    const model = require('./data/sheet.4.0.json');
    const xmlStream = new XmlStream();
    const options = {
      styles: new StylesXform(true),
      hyperlinks: [],
    };
    xform.prepare(model, options);
    xform.render(xmlStream, model);

    const {xml} = xmlStream;
    const iConditionalFormatting = xml.indexOf('conditionalFormatting');
    const iDataValidations = xml.indexOf('dataValidations');
    expect(iConditionalFormatting).not.to.equal(-1);
    expect(iDataValidations).not.to.equal(-1);
    expect(iConditionalFormatting).to.be.lessThan(iDataValidations);
  });
});
