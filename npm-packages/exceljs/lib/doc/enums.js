'use strict';

module.exports = {
  ValueType: {
    Null: 0,
    Merge: 1,
    Number: 2,
    String: 3,
    Date: 4,
    Hyperlink: 5,
    Formula: 6,
    SharedString: 7,
    RichText: 8,
    Boolean: 9,
    Error: 10,
  },
  FormulaType: {
    None: 0,
    Master: 1,
    Shared: 2,
  },
  RelationshipType: {
    None: 0,
    OfficeDocument: 1,
    Worksheet: 2,
    CalcChain: 3,
    SharedStrings: 4,
    Styles: 5,
    Theme: 6,
    Hyperlink: 7,
  },
  DocumentType: {
    Xlsx: 1,
  },
  ReadingOrder: {
    LeftToRight: 1,
    RightToLeft: 2,
  },
  ErrorValue: {
    NotApplicable: '#N/A',
    Ref: '#REF!',
    Name: '#NAME?',
    DivZero: '#DIV/0!',
    Null: '#NULL!',
    Value: '#VALUE!',
    Num: '#NUM!',
  },
};
