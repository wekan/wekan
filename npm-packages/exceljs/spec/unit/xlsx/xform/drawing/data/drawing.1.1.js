module.exports = {
  anchors: [
    {
      anchorType: 'xdr:twoCellAnchor',
      range: {
        tl: {nativeRow: 0, nativeRowOff: 0, nativeCol: 0, nativeColOff: 0},
        br: {nativeRow: 7, nativeRowOff: 0, nativeCol: 3, nativeColOff: 0},
      },
      picture: {
        index: 1,
        rId: 'rId1',
        hyperlinks: {
          tooltip: 'exceljs',
          rId: 'rId3',
        },
      },
    },
    {
      anchorType: 'xdr:oneCellAnchor',
      range: {
        tl: {
          nativeRow: 2,
          nativeRowOff: 90000,
          nativeCol: 5,
          nativeColOff: 320000,
        },
        ext: {width: 100, height: 200},
      },
      picture: {
        index: 2,
        rId: 'rId2',
      },
    },
  ],
};
