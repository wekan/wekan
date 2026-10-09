const colCache = verquire('utils/col-cache');

describe('colCache', () => {
  it('caches values', () => {
    expect(colCache.l2n('A')).to.equal(1);
    expect(colCache._l2n.A).to.equal(1);
    expect(colCache._n2l[1]).to.equal('A');

    // also, because of the fill heuristic A-Z will be there too
    const dic = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
    ];
    dic.forEach((letter, index) => {
      expect(colCache._l2n[letter]).to.equal(index + 1);
      expect(colCache._n2l[index + 1]).to.equal(letter);
    });

    // next level
    expect(colCache.n2l(27)).to.equal('AA');
    expect(colCache._l2n.AB).to.equal(28);
    expect(colCache._n2l[28]).to.equal('AB');
  });

  it('converts numbers to letters', () => {
    expect(colCache.n2l(1)).to.equal('A');
    expect(colCache.n2l(26)).to.equal('Z');
    expect(colCache.n2l(27)).to.equal('AA');
    expect(colCache.n2l(702)).to.equal('ZZ');
    expect(colCache.n2l(703)).to.equal('AAA');
  });
  it('converts letters to numbers', () => {
    expect(colCache.l2n('A')).to.equal(1);
    expect(colCache.l2n('Z')).to.equal(26);
    expect(colCache.l2n('AA')).to.equal(27);
    expect(colCache.l2n('ZZ')).to.equal(702);
    expect(colCache.l2n('AAA')).to.equal(703);
  });

  it('throws when out of bounds', () => {
    expect(() => {
      colCache.n2l(0);
    }).to.throw(Error);
    expect(() => {
      colCache.n2l(-1);
    }).to.throw(Error);
    expect(() => {
      colCache.n2l(16385);
    }).to.throw(Error);

    expect(() => {
      colCache.l2n('');
    }).to.throw(Error);
    expect(() => {
      colCache.l2n('AAAA');
    }).to.throw(Error);
    expect(() => {
      colCache.l2n(16385);
    }).to.throw(Error);
  });

  it('validates addresses properly', () => {
    expect(colCache.validateAddress('A1')).to.be.ok();
    expect(colCache.validateAddress('AA10')).to.be.ok();
    expect(colCache.validateAddress('ABC100000')).to.be.ok();

    expect(() => {
      colCache.validateAddress('A');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('1');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('1A');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('A 1');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('A1A');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('1A1');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('a1');
    }).to.throw(Error);
    expect(() => {
      colCache.validateAddress('a');
    }).to.throw(Error);
  });

  it('decodes addresses', () => {
    expect(colCache.decodeAddress('A1')).to.deep.equal({
      address: 'A1',
      col: 1,
      row: 1,
      $col$row: '$A$1',
    });
    expect(colCache.decodeAddress('AA11')).to.deep.equal({
      address: 'AA11',
      col: 27,
      row: 11,
      $col$row: '$AA$11',
    });
  });

  describe('with a malformed address', () => {
    it('tolerates a missing row number', () => {
      expect(colCache.decodeAddress('$B')).to.deep.equal({
        address: 'B',
        col: 2,
        row: undefined,
        $col$row: '$B$',
      });
    });

    it('tolerates a missing column number', () => {
      expect(colCache.decodeAddress('$2')).to.deep.equal({
        address: '2',
        col: undefined,
        row: 2,
        $col$row: '$$2',
      });
    });
  });

  it('convert [sheetName!][$]col[$]row[[$]col[$]row] into address or range structures', () => {
    expect(colCache.decodeEx('Sheet1!$H$1')).to.deep.equal({
      $col$row: '$H$1',
      address: 'H1',
      col: 8,
      row: 1,
      sheetName: 'Sheet1',
    });
    expect(colCache.decodeEx('\'Sheet 1\'!$H$1')).to.deep.equal({
      $col$row: '$H$1',
      address: 'H1',
      col: 8,
      row: 1,
      sheetName: 'Sheet 1',
    });
    expect(colCache.decodeEx('\'Sheet !$:1\'!$H$1')).to.deep.equal({
      $col$row: '$H$1',
      address: 'H1',
      col: 8,
      row: 1,
      sheetName: 'Sheet !$:1',
    });
    expect(colCache.decodeEx('\'Sheet !$:1\'!#REF!')).to.deep.equal({
      sheetName: 'Sheet !$:1',
      error: '#REF!',
    });
  });

  it('gets address structures (and caches them)', () => {
    let addr = colCache.getAddress('D5');
    expect(addr.address).to.equal('D5');
    expect(addr.row).to.equal(5);
    expect(addr.col).to.equal(4);
    expect(colCache.getAddress('D5')).to.equal(addr);
    expect(colCache.getAddress(5, 4)).to.equal(addr);

    addr = colCache.getAddress('E4');
    expect(addr.address).to.equal('E4');
    expect(addr.row).to.equal(4);
    expect(addr.col).to.equal(5);
    expect(colCache.getAddress('E4')).to.equal(addr);
    expect(colCache.getAddress(4, 5)).to.equal(addr);
  });

  it('decodes addresses and ranges', () => {
    // address
    expect(colCache.decode('A1')).to.deep.equal({
      address: 'A1',
      col: 1,
      row: 1,
      $col$row: '$A$1',
    });
    expect(colCache.decode('AA11')).to.deep.equal({
      address: 'AA11',
      col: 27,
      row: 11,
      $col$row: '$AA$11',
    });

    // range
    expect(colCache.decode('A1:B2')).to.deep.equal({
      dimensions: 'A1:B2',
      tl: 'A1',
      br: 'B2',
      top: 1,
      left: 1,
      bottom: 2,
      right: 2,
    });

    // wonky ranges
    expect(colCache.decode('A2:B1')).to.deep.equal({
      dimensions: 'A1:B2',
      tl: 'A1',
      br: 'B2',
      top: 1,
      left: 1,
      bottom: 2,
      right: 2,
    });
    expect(colCache.decode('B2:A1')).to.deep.equal({
      dimensions: 'A1:B2',
      tl: 'A1',
      br: 'B2',
      top: 1,
      left: 1,
      bottom: 2,
      right: 2,
    });
  });
});
