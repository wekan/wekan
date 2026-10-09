const SharedStrings = verquire('utils/shared-strings');

describe('SharedStrings', () => {
  it('Stores and shares string values', () => {
    const ss = new SharedStrings();

    const iHello = ss.add('Hello');
    const iHelloV2 = ss.add('Hello');
    const iGoodbye = ss.add('Goodbye');

    expect(iHello).to.equal(iHelloV2);
    expect(iGoodbye).to.not.equal(iHelloV2);

    expect(ss.count).to.equal(2);
    expect(ss.totalRefs).to.equal(3);
  });

  it('Does not escape values', () => {
    // that's the job of the xml utils
    const ss = new SharedStrings();

    const iXml = ss.add('<tag>value</tag>');
    const iAmpersand = ss.add('&');

    expect(ss.getString(iXml)).to.equal('<tag>value</tag>');
    expect(ss.getString(iAmpersand)).to.equal('&');
  });
});
