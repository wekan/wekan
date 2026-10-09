const testXformHelper = require('../../test-xform-helper');

const IconSetXform = verquire('xlsx/xform/sheet/cf/icon-set-xform');

const expectations = [
  {
    title: 'Default Set',
    create() {
      return new IconSetXform();
    },
    preparedModel: {
      iconSet: '3TrafficLights',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
    xml: `
      <iconSet>
        <cfvo type="percent" val="0"/>
        <cfvo type="percent" val="33"/>
        <cfvo type="percent" val="67"/>
      </iconSet>
    `,
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'parse'],
  },
  {
    title: 'Reversed & Hide Values',
    create() {
      return new IconSetXform();
    },
    preparedModel: {
      iconSet: '5Arrows',
      reverse: true,
      showValue: false,
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 20},
        {type: 'percent', value: 40},
        {type: 'percent', value: 60},
        {type: 'percent', value: 80},
      ],
    },
    xml: `
      <iconSet iconSet="5Arrows" reverse="1" showValue="0">
        <cfvo type="percent" val="0"/>
        <cfvo type="percent" val="20"/>
        <cfvo type="percent" val="40"/>
        <cfvo type="percent" val="60"/>
        <cfvo type="percent" val="80"/>
      </iconSet>
    `,
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'parse'],
  },
];

describe('IconSetXform', () => {
  testXformHelper(expectations);
});
