module.exports = {
  anchors: [
    {
      range: {
        tl: {nativeRow: 0, nativeRowOff: 0, nativeCol: 0, nativeColOff: 0},
        br: {nativeRow: 7, nativeRowOff: 0, nativeCol: 3, nativeColOff: 0},
        editAs: 'oneCell',
      },
      picture: {
        rId: 'rId1',
        hyperlinks: {
          tooltip: 'exceljs',
          rId: 'rId3',
        },
      },
    },
    {
      range: {
        tl: {
          nativeRow: 2,
          nativeRowOff: 90000,
          nativeCol: 5,
          nativeColOff: 320000,
        },
        ext: {width: 100, height: 200},
        editAs: 'oneCell',
      },
      picture: {
        rId: 'rId2',
      },
    },
  ],
};
