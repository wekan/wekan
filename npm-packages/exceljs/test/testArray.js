const _ = require('../lib/utils/under-dash.js');

const a = [];
a[3] = 'three';
// a[2] = 'two';
a[4] = 'four';
a[1] = 'one';
a[5] = 'five';
a[0] = 'zero';

_.each(a, i => {
  console.log(i);
});
