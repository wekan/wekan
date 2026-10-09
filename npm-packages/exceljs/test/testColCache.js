const colCache = require('../lib/utils/col-cache');

const arg = process.argv[2];

const match = arg.match(/^[A-Z]+$/);
let n;
let l;
if (match) {
  n = colCache.l2n(match[0]);
  l = colCache.n2l(n);
  console.log(`${arg} --> ${n} --> ${l}`);
} else {
  l = colCache.n2l(parseInt(arg, 10));
  n = colCache.l2n(l);
  console.log(`${arg} --> ${l} --> ${n}`);
}
