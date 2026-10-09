const BaseXform = require('../base-xform');

class WorksheetPropertiesXform extends BaseXform {
  render(xmlStream, model) {
    xmlStream.leafNode('workbookPr', {
      date1904: model.date1904 ? 1 : undefined,
      defaultThemeVersion: 164011,
      filterPrivacy: 1,
    });
  }

  parseOpen(node) {
    if (node.name === 'workbookPr') {
      this.model = {
        date1904: node.attributes.date1904 === '1',
      };
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

module.exports = WorksheetPropertiesXform;
