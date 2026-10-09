const testXformHelper = require('../../test-xform-helper');

const IconSetExtXform = verquire('xlsx/xform/sheet/cf-ext/icon-set-ext-xform');

const expectations = [
  {
    title: 'Default Set',
    create() {
      return new IconSetExtXform();
    },
    preparedModel: {
      iconSet: '3Triangles',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
    xml: `
      <x14:iconSet iconSet="3Triangles">
        <x14:cfvo type="percent"><xm:f>0</xm:f></x14:cfvo>
        <x14:cfvo type="percent"><xm:f>33</xm:f></x14:cfvo>
        <x14:cfvo type="percent"><xm:f>67</xm:f></x14:cfvo>
      </x14:iconSet>
    `,
    parsedModel: {
      iconSet: '3Triangles',
      reverse: false,
      showValue: true,
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
    tests: ['render', 'parse'],
  },
  {
    title: 'Reversed & Hide Values',
    create() {
      return new IconSetExtXform();
    },
    preparedModel: {
      iconSet: '5Boxes',
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
      <x14:iconSet iconSet="5Boxes" reverse="1" showValue="0">
        <x14:cfvo type="percent"><xm:f>0</xm:f></x14:cfvo>
        <x14:cfvo type="percent"><xm:f>20</xm:f></x14:cfvo>
        <x14:cfvo type="percent"><xm:f>40</xm:f></x14:cfvo>
        <x14:cfvo type="percent"><xm:f>60</xm:f></x14:cfvo>
        <x14:cfvo type="percent"><xm:f>80</xm:f></x14:cfvo>
      </x14:iconSet>
    `,
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'parse'],
  },
];

describe('IconSetExtXform', () => {
  testXformHelper(expectations);
});
