module.exports = {
  tag: 'xdr:spPr',
  c: [
    {
      tag: 'a:xfrm',
      c: [
        {tag: 'a:off', $: {x: '0', y: '0'}},
        {tag: 'a:ext', $: {cx: '0', cy: '0'}},
      ],
    },
    {
      tag: 'a:prstGeom',
      $: {prst: 'rect'},
      c: [{tag: 'a:avLst'}],
    },
  ],
};
