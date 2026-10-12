// CommonJS keeps the synchronous loader usable by Meteor and Node-based tests.
module.exports = function loadExcel() {
  return require('@wekanteam/exceljs');
};
