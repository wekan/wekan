const fs = require('fs');

const testXformHelper = require('../test-xform-helper');

const StylesXform = verquire('xlsx/xform/style/styles-xform');
const XmlStream = verquire('utils/xml-stream');

const expectations = [
  {
    title: 'Styles with fonts',
    create() {
      return new StylesXform();
    },
    preparedModel: require('./data/styles.1.1.json'),
    xml: fs.readFileSync(`${__dirname}/data/styles.1.2.xml`).toString(),
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('StylesXform', () => {
  testXformHelper(expectations);

  describe('As StyleManager', () => {
    it('Renders empty model', () => {
      const stylesXform = new StylesXform(true);
      const expectedXml = fs
        .readFileSync(`${__dirname}/data/styles.2.2.xml`)
        .toString();

      const xmlStream = new XmlStream();
      stylesXform.render(xmlStream);

      expect(xmlStream.xml).xml.to.equal(expectedXml);
    });
  });
});
