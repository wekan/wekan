const StringBuf = verquire('utils/string-buf');

describe('StringBuf', () => {
  // StringBuf is a lightweight string-builder used by the streaming writers to build
  // strings (e.g. for row data) without too many memory operations
  it('writes strings as UTF8', () => {
    const sb = new StringBuf({size: 64});
    sb.addText('Hello, World!');
    const chunk = sb.toBuffer();
    expect(chunk.toString('UTF8')).to.equal('Hello, World!');
  });

  it('grows properly', () => {
    const sb = new StringBuf({size: 8});
    expect(sb.length).to.equal(0);
    expect(sb.capacity).to.equal(8);

    // write simple UTF8 string. Should use 7 bytes
    // that's within 4 bytes of 16
    sb.addText('Hello, ');
    expect(sb.length).to.equal(7);
    expect(sb.capacity).to.equal(16);

    // add some more (6 bytes)
    sb.addText('World!');
    expect(sb.length).to.equal(13);
    expect(sb.capacity).to.equal(32);

    // and more (7 bytes)
    sb.addText(' Hello.');
    expect(sb.length).to.equal(20);
    expect(sb.capacity).to.equal(32);

    // after all that - the string should be intact
    const chunk = sb.toBuffer();
    expect(chunk.toString('UTF8')).to.equal('Hello, World! Hello.');
  });

  it('resets', () => {
    const sb = new StringBuf({size: 64});
    sb.addText('Hello, ');
    expect(sb.length).to.equal(7);

    sb.reset();
    expect(sb.length).to.equal(0);

    sb.addText('World!');
    expect(sb.length).to.equal(6);

    const chunk = sb.toBuffer();
    expect(chunk.toString('UTF8')).to.equal('World!');
  });
});
