const testUtils = require('../../utils/index');

const {copyStyle} = verquire('utils/copy-style');

const style1 = {
  numFmt: testUtils.styles.numFmts.numFmt1,
  font: testUtils.styles.fonts.broadwayRedOutline20,
  alignment: testUtils.styles.namedAlignments.topLeft,
  border: testUtils.styles.borders.thickRainbow,
  fill: testUtils.styles.fills.redGreenDarkTrellis,
};
const style2 = {
  fill: testUtils.styles.fills.rgbPathGrad,
};

describe('copyStyle', () => {
  it('should copy a style deeply', () => {
    const copied = copyStyle(style1);
    expect(copied).to.deep.equal(style1);
    expect(copied.font).to.not.equal(style1.font);
    expect(copied.alignment).to.not.equal(style1.alignment);
    expect(copied.border).to.not.equal(style1.border);
    expect(copied.fill).to.not.equal(style1.fill);

    expect(copyStyle({})).to.deep.equal({});
  });

  it('should copy fill.stops deeply', () => {
    const copied = copyStyle(style2);
    expect(copied.fill.stops).to.deep.equal(style2.fill.stops);
    expect(copied.fill.stops).to.not.equal(style2.fill.stops);
    expect(copied.fill.stops[0]).to.not.equal(style2.fill.stops[0]);
  });

  it('should return the argument if a falsy value passed', () => {
    expect(copyStyle(null)).to.equal(null);
    expect(copyStyle(undefined)).to.equal(undefined);
  });
});
