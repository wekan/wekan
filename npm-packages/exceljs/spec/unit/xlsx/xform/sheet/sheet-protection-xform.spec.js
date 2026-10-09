const testXformHelper = require('../test-xform-helper');

const SheetProtectionXform = verquire(
  'xlsx/xform/sheet/sheet-protection-xform'
);

const expectations = [
  {
    title: 'Unprotected (Empty)',
    create() {
      return new SheetProtectionXform();
    },
    preparedModel: {},
    xml: '',
    parsedModel: {},
    tests: ['render', 'renderIn'],
  },
  {
    title: 'Protected (Default)',
    create() {
      return new SheetProtectionXform();
    },
    preparedModel: {
      algorithmName: 'SHA-512',
      hashValue:
        'RHtx1KpAYT7nBzGCTInkHrbf2wTZxP3BT4Eo8PBHPTM4KfKArJTluFvizDvo6GnBCOO6JJu7qwKvMqnKHs7dcw==',
      saltValue: '6tC6yotbNa8JaMaDvbUgxw==',
      spinCount: 100000,
      sheet: true,
      objects: false,
      scenarios: false,
    },
    xml:
      '<sheetProtection algorithmName="SHA-512" hashValue="RHtx1KpAYT7nBzGCTInkHrbf2wTZxP3BT4Eo8PBHPTM4KfKArJTluFvizDvo6GnBCOO6JJu7qwKvMqnKHs7dcw==" saltValue="6tC6yotbNa8JaMaDvbUgxw==" spinCount="100000" sheet="1" objects="1" scenarios="1"/>',
    parsedModel: {
      algorithmName: 'SHA-512',
      hashValue:
        'RHtx1KpAYT7nBzGCTInkHrbf2wTZxP3BT4Eo8PBHPTM4KfKArJTluFvizDvo6GnBCOO6JJu7qwKvMqnKHs7dcw==',
      saltValue: '6tC6yotbNa8JaMaDvbUgxw==',
      spinCount: 100000,
      sheet: true,
      objects: false,
      scenarios: false,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Unprotected (All false)',
    create() {
      return new SheetProtectionXform();
    },
    preparedModel: {
      selectLockedCells: false,
      selectUnlockedCells: false,
    },
    xml: '<sheetProtection selectLockedCells="1" selectUnlockedCells="1"/>',
    parsedModel: {
      selectLockedCells: false,
      selectUnlockedCells: false,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'Protected (All false)',
    create() {
      return new SheetProtectionXform();
    },
    preparedModel: {
      algorithmName: 'SHA-512',
      hashValue:
        'RHtx1KpAYT7nBzGCTInkHrbf2wTZxP3BT4Eo8PBHPTM4KfKArJTluFvizDvo6GnBCOO6JJu7qwKvMqnKHs7dcw==',
      saltValue: '6tC6yotbNa8JaMaDvbUgxw==',
      spinCount: 100000,
      sheet: true,
      selectLockedCells: false,
      selectUnlockedCells: false,
    },
    xml:
      '<sheetProtection algorithmName="SHA-512" hashValue="RHtx1KpAYT7nBzGCTInkHrbf2wTZxP3BT4Eo8PBHPTM4KfKArJTluFvizDvo6GnBCOO6JJu7qwKvMqnKHs7dcw==" saltValue="6tC6yotbNa8JaMaDvbUgxw==" spinCount="100000" sheet="1" selectLockedCells="1" selectUnlockedCells="1"/>',
    parsedModel: {
      algorithmName: 'SHA-512',
      hashValue:
        'RHtx1KpAYT7nBzGCTInkHrbf2wTZxP3BT4Eo8PBHPTM4KfKArJTluFvizDvo6GnBCOO6JJu7qwKvMqnKHs7dcw==',
      saltValue: '6tC6yotbNa8JaMaDvbUgxw==',
      spinCount: 100000,
      sheet: true,
      selectLockedCells: false,
      selectUnlockedCells: false,
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('SheetProtectionXform', () => {
  testXformHelper(expectations);
});
