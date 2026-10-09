const _ = verquire('utils/under-dash');
const util = require('util');

describe('under-dash', () => {
  describe('isEqual', () => {
    const values = [
      0,
      1,
      true,
      false,
      'string',
      'foobar',
      'other string',
      [],
      ['array'],
      ['array', 'foobar'],
      ['array2'],
      ['array2', 'foobar'],
      {},
      {object: 1},
      {object: 2},
      {object: 1, foobar: 'quux'},
      {object: 2, foobar: 'quux'},
      null,
      undefined,
      () => {},
      () => {},
      Symbol('foo'),
      Symbol('foo'),
      Symbol('bar'),
    ];

    function showVal(o) {
      return util.inspect(o, {compact: true});
    }

    it('works on simple values', () => {
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values.length; j++) {
          const a = values[i];
          const b = values[j];

          const assertion = `${showVal(a)} ${i === j ? '==' : '!='} ${showVal(
            b
          )}`;
          expect(_.isEqual(a, b)).to.equal(i === j, `expected ${assertion}`);
        }
      }
    });

    it('works on complex arrays', () => {
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values.length; j++) {
          const a = [values[i]];
          const b = [values[j]];

          const assertion = `${showVal(a)} ${i === j ? '==' : '!='} ${showVal(
            b
          )}`;
          expect(_.isEqual(a, b)).to.equal(i === j, `expected ${assertion}`);
        }
      }
    });

    it('works on complex objects', () => {
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values.length; j++) {
          const a = {key: values[i]};
          const b = {key: values[j]};

          const assertion = `${showVal(a)} ${i === j ? '==' : '!='} ${showVal(
            b
          )}`;
          expect(_.isEqual(a, b)).to.equal(i === j, `expected ${assertion}`);
        }
      }
    });
  });
});
