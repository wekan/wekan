const Range = verquire('doc/range');

describe('Range', () => {
  function check(
    d,
    range,
    $range,
    tl,
    $t$l,
    br,
    $b$r,
    top,
    left,
    bottom,
    right,
    sheetName
  ) {
    expect(d.range).to.equal(range);
    expect(d.$range).to.equal($range);
    expect(d.tl).to.equal(tl);
    expect(d.$t$l).to.equal($t$l);
    expect(d.br).to.equal(br);
    expect(d.$b$r).to.equal($b$r);
    expect(d.top).to.equal(top);
    expect(d.left).to.equal(left);
    expect(d.bottom).to.equal(bottom);
    expect(d.right).to.equal(right);
    expect(d.toString()).to.equal(range);
    expect(d.sheetName).to.equal(sheetName);
  }

  it('has a valid default value', () => {
    const d = new Range();
    check(d, 'A1:A1', '$A$1:$A$1', 'A1', '$A$1', 'A1', '$A$1', 1, 1, 1, 1);
  });

  it('constructs as expected', () => {
    // check range + rotations
    check(
      new Range('B5:D10'),
      'B5:D10',
      '$B$5:$D$10',
      'B5',
      '$B$5',
      'D10',
      '$D$10',
      5,
      2,
      10,
      4
    );
    check(
      new Range('B10:D5'),
      'B5:D10',
      '$B$5:$D$10',
      'B5',
      '$B$5',
      'D10',
      '$D$10',
      5,
      2,
      10,
      4
    );
    check(
      new Range('D5:B10'),
      'B5:D10',
      '$B$5:$D$10',
      'B5',
      '$B$5',
      'D10',
      '$D$10',
      5,
      2,
      10,
      4
    );
    check(
      new Range('D10:B5'),
      'B5:D10',
      '$B$5:$D$10',
      'B5',
      '$B$5',
      'D10',
      '$D$10',
      5,
      2,
      10,
      4
    );

    check(
      new Range('G7', 'C16'),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );
    check(
      new Range('C7', 'G16'),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );
    check(
      new Range('C16', 'G7'),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );
    check(
      new Range('G16', 'C7'),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );

    check(
      new Range(7, 3, 16, 7),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );
    check(
      new Range(16, 3, 7, 7),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );
    check(
      new Range(7, 7, 16, 3),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );
    check(
      new Range(16, 7, 7, 3),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );

    check(
      new Range([7, 3, 16, 7]),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );
    check(
      new Range([16, 3, 7, 7]),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );
    check(
      new Range([7, 7, 16, 3]),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );
    check(
      new Range([16, 7, 7, 3]),
      'C7:G16',
      '$C$7:$G$16',
      'C7',
      '$C$7',
      'G16',
      '$G$16',
      7,
      3,
      16,
      7
    );

    check(
      new Range('$B$5:$D$10'),
      'B5:D10',
      '$B$5:$D$10',
      'B5',
      '$B$5',
      'D10',
      '$D$10',
      5,
      2,
      10,
      4
    );
    check(
      new Range('blort!$B$5:$D$10'),
      'blort!B5:D10',
      'blort!$B$5:$D$10',
      'B5',
      '$B$5',
      'D10',
      '$D$10',
      5,
      2,
      10,
      4,
      'blort'
    );
  });

  it('expands properly', () => {
    const d = new Range();

    d.expand(1, 1, 1, 3);
    expect(d.tl).to.equal('A1');
    expect(d.br).to.equal('C1');
    expect(d.toString()).to.equal('A1:C1');

    d.expand(1, 3, 3, 3);
    expect(d.tl).to.equal('A1');
    expect(d.br).to.equal('C3');
    expect(d.toString()).to.equal('A1:C3');
  });

  it('doesn\'t always include the default row/col', () => {
    const d = new Range();

    d.expand(2, 2, 4, 4);
    expect(d.tl).to.equal('B2');
    expect(d.br).to.equal('D4');
    expect(d.toString()).to.equal('B2:D4');
  });

  it('detects intersections', () => {
    const C3F6 = new Range('C3:F6');

    // touching at corners
    expect(C3F6.intersects(new Range('A1:B2'))).to.be.false();
    expect(C3F6.intersects(new Range('G1:H2'))).to.be.false();
    expect(C3F6.intersects(new Range('A7:B8'))).to.be.false();
    expect(C3F6.intersects(new Range('G7:H8'))).to.be.false();

    // Adjacent to edges
    expect(C3F6.intersects(new Range('A1:H2'))).to.be.false();
    expect(C3F6.intersects(new Range('A1:B8'))).to.be.false();
    expect(C3F6.intersects(new Range('G1:H8'))).to.be.false();
    expect(C3F6.intersects(new Range('A7:H8'))).to.be.false();

    // 1 cell margin
    expect(C3F6.intersects(new Range('A1:H1'))).to.be.false();
    expect(C3F6.intersects(new Range('A1:A8'))).to.be.false();
    expect(C3F6.intersects(new Range('G1:G8'))).to.be.false();
    expect(C3F6.intersects(new Range('A8:G8'))).to.be.false();

    // Adjacent at corners
    expect(C3F6.intersects(new Range('A1:B3'))).to.be.false();
    expect(C3F6.intersects(new Range('A1:C2'))).to.be.false();
    expect(C3F6.intersects(new Range('F1:H2'))).to.be.false();
    expect(C3F6.intersects(new Range('G1:H3'))).to.be.false();
    expect(C3F6.intersects(new Range('A6:B8'))).to.be.false();
    expect(C3F6.intersects(new Range('A7:C8'))).to.be.false();
    expect(C3F6.intersects(new Range('F7:H8'))).to.be.false();
    expect(C3F6.intersects(new Range('G6:H8'))).to.be.false();

    // Adjacent at edges
    expect(C3F6.intersects(new Range('A4:B5'))).to.be.false();
    expect(C3F6.intersects(new Range('D1:E2'))).to.be.false();
    expect(C3F6.intersects(new Range('D7:E8'))).to.be.false();
    expect(C3F6.intersects(new Range('G4:H8'))).to.be.false();

    // intersecting at corners
    expect(C3F6.intersects(new Range('A1:C3'))).to.be.true();
    expect(C3F6.intersects(new Range('F1:H3'))).to.be.true();
    expect(C3F6.intersects(new Range('A6:C8'))).to.be.true();
    expect(C3F6.intersects(new Range('F6:H8'))).to.be.true();

    // slice through middle
    expect(C3F6.intersects(new Range('A4:H5'))).to.be.true();
    expect(C3F6.intersects(new Range('D1:E8'))).to.be.true();

    // inside
    expect(C3F6.intersects(new Range('D4:E5'))).to.be.true();

    // outside
    expect(C3F6.intersects(new Range('A1:H8'))).to.be.true();
  });

  it('detects containment', () => {
    const C3F6 = new Range('C3:F6');

    expect(C3F6.contains('A1')).to.be.false();
    expect(C3F6.contains('B2')).to.be.false();
    expect(C3F6.contains('C2')).to.be.false();
    expect(C3F6.contains('D2')).to.be.false();
    expect(C3F6.contains('E2')).to.be.false();
    expect(C3F6.contains('F2')).to.be.false();
    expect(C3F6.contains('G2')).to.be.false();
    expect(C3F6.contains('H1')).to.be.false();
    expect(C3F6.contains('G3')).to.be.false();
    expect(C3F6.contains('G4')).to.be.false();
    expect(C3F6.contains('G5')).to.be.false();
    expect(C3F6.contains('G6')).to.be.false();
    expect(C3F6.contains('G7')).to.be.false();
    expect(C3F6.contains('H7')).to.be.false();
    expect(C3F6.contains('F7')).to.be.false();
    expect(C3F6.contains('E7')).to.be.false();
    expect(C3F6.contains('D7')).to.be.false();
    expect(C3F6.contains('C7')).to.be.false();
    expect(C3F6.contains('B7')).to.be.false();
    expect(C3F6.contains('A8')).to.be.false();
    expect(C3F6.contains('B6')).to.be.false();
    expect(C3F6.contains('B5')).to.be.false();
    expect(C3F6.contains('B4')).to.be.false();
    expect(C3F6.contains('B3')).to.be.false();

    expect(C3F6.contains('C3')).to.be.true();
    expect(C3F6.contains('D3')).to.be.true();
    expect(C3F6.contains('E3')).to.be.true();
    expect(C3F6.contains('F3')).to.be.true();
    expect(C3F6.contains('F4')).to.be.true();
    expect(C3F6.contains('F5')).to.be.true();
    expect(C3F6.contains('F6')).to.be.true();
    expect(C3F6.contains('E6')).to.be.true();
    expect(C3F6.contains('D6')).to.be.true();
    expect(C3F6.contains('C6')).to.be.true();
    expect(C3F6.contains('C5')).to.be.true();
    expect(C3F6.contains('C4')).to.be.true();
    expect(C3F6.contains('D4')).to.be.true();
    expect(C3F6.contains('E4')).to.be.true();
    expect(C3F6.contains('E5')).to.be.true();
    expect(C3F6.contains('D5')).to.be.true();

    expect(C3F6.contains('$A$1')).to.be.false();
    expect(C3F6.contains('$D$5')).to.be.true();

    expect(C3F6.contains('other!$A$1')).to.be.false();
    expect(C3F6.contains('other!$D$5')).to.be.true();

    const otherC3F6 = new Range('other!C3:F6');
    expect(otherC3F6.contains('$A$1')).to.be.false();
    expect(otherC3F6.contains('$D$5')).to.be.true();
    expect(otherC3F6.contains('other!$A$1')).to.be.false();
    expect(otherC3F6.contains('other!$D$5')).to.be.true();
    expect(otherC3F6.contains('blort!$A$1')).to.be.false();
    expect(otherC3F6.contains('blort!$D$5')).to.be.false();
  });
});
