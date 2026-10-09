const testXformHelper = require('../../test-xform-helper');

const CfRuleXform = verquire('xlsx/xform/sheet/cf/cf-rule-xform');

const expectations = [
  {
    title: 'Expression',
    create() {
      return new CfRuleXform();
    },
    preparedModel: {
      type: 'expression',
      dxfId: 1,
      priority: 1,
      formulae: ['ROW()'],
    },
    xml: `
      <cfRule type="expression" dxfId="1" priority="1">
        <formula>ROW()</formula>
      </cfRule>
    `,
    parsedModel: {
      type: 'expression',
      dxfId: 1,
      priority: 1,
      formulae: ['ROW()'],
    },
    tests: ['render', 'parse'],
  },
  {
    title: 'Cell Is',
    create() {
      return new CfRuleXform();
    },
    preparedModel: {
      type: 'cellIs',
      dxfId: 1,
      priority: 1,
      operator: 'greaterThan',
      formulae: ['1'],
    },
    xml: `
      <cfRule type="cellIs" dxfId="1" priority="1" operator="greaterThan">
        <formula>1</formula>
      </cfRule>
    `,
    parsedModel: {
      type: 'cellIs',
      dxfId: 1,
      priority: 1,
      operator: 'greaterThan',
      formulae: ['1'],
    },
    tests: ['render', 'parse'],
  },
  {
    title: 'Top 10',
    create() {
      return new CfRuleXform();
    },
    preparedModel: {type: 'top10', dxfId: 1, priority: 1, rank: 10},
    xml: '<cfRule type="top10" dxfId="1" priority="1" rank="10" />',
    parsedModel: {type: 'top10', dxfId: 1, priority: 1, rank: 10},
    tests: ['render', 'parse'],
  },
  {
    title: 'Top 10%',
    create() {
      return new CfRuleXform();
    },
    preparedModel: {
      type: 'top10',
      dxfId: 1,
      priority: 1,
      rank: 10,
      percent: true,
    },
    xml: '<cfRule type="top10" dxfId="1" priority="1" rank="10" percent="1" />',
    parsedModel: {
      type: 'top10',
      dxfId: 1,
      priority: 1,
      rank: 10,
      percent: true,
    },
    tests: ['render', 'parse'],
  },
  {
    title: 'Bottom 10',
    create() {
      return new CfRuleXform();
    },
    preparedModel: {
      type: 'top10',
      dxfId: 1,
      priority: 1,
      rank: 10,
      bottom: true,
    },
    xml: '<cfRule type="top10" dxfId="1" priority="1" rank="10" bottom="1" />',
    parsedModel: {type: 'top10', dxfId: 1, priority: 1, rank: 10, bottom: true},
    tests: ['render', 'parse'],
  },
  {
    title: 'Above Average',
    create() {
      return new CfRuleXform();
    },
    preparedModel: {type: 'aboveAverage', dxfId: 1, priority: 1},
    xml: '<cfRule type="aboveAverage" dxfId="1" priority="1" />',
    parsedModel: {type: 'aboveAverage', dxfId: 1, priority: 1},
    tests: ['render', 'parse'],
  },
  {
    title: 'Below Average',
    create() {
      return new CfRuleXform();
    },
    preparedModel: {
      type: 'aboveAverage',
      dxfId: 1,
      priority: 1,
      aboveAverage: false,
    },
    xml:
      '<cfRule type="aboveAverage" dxfId="1" priority="1" aboveAverage="0" />',
    parsedModel: {
      type: 'aboveAverage',
      dxfId: 1,
      priority: 1,
      aboveAverage: false,
    },
    tests: ['render', 'parse'],
  },
  {
    title: 'Colour Scale',
    create() {
      return new CfRuleXform();
    },
    preparedModel: {
      type: 'colorScale',
      priority: 1,
      cfvo: [{type: 'min'}, {type: 'percentile', value: 50}, {type: 'max'}],
      color: [{argb: 'FFFF0000'}, {argb: 'FF00FF00'}, {argb: 'FF0000FF'}],
    },
    xml: `
      <cfRule type="colorScale" priority="1">
        <colorScale>
          <cfvo type="min" />
          <cfvo type="percentile" val="50" />
          <cfvo type="max" />
          <color rgb="FFFF0000" />
          <color rgb="FF00FF00" />
          <color rgb="FF0000FF" />
        </colorScale>
      </cfRule>
    `,
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'parse'],
  },
  {
    title: 'Icon Set',
    create() {
      return new CfRuleXform();
    },
    preparedModel: {
      type: 'iconSet',
      iconSet: '4Arrows',
      priority: 1,
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 25},
        {type: 'percent', value: 50},
        {type: 'percent', value: 75},
      ],
    },
    xml: `
      <cfRule type="iconSet" priority="1">
        <iconSet iconSet="4Arrows">
          <cfvo type="percent" val="0"/>
          <cfvo type="percent" val="25"/>
          <cfvo type="percent" val="50"/>
          <cfvo type="percent" val="75"/>
        </iconSet>
      </cfRule>
    `,
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'parse'],
  },
];

describe('CfRuleXform', () => {
  testXformHelper(expectations);
});
