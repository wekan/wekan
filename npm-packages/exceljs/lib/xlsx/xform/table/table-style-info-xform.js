const BaseXform = require('../base-xform');

class TableStyleInfoXform extends BaseXform {
  get tag() {
    return 'tableStyleInfo';
  }

  render(xmlStream, model) {
    xmlStream.leafNode(this.tag, {
      name: model.theme ? model.theme : undefined,
      showFirstColumn: model.showFirstColumn ? '1' : '0',
      showLastColumn: model.showLastColumn ? '1' : '0',
      showRowStripes: model.showRowStripes ? '1' : '0',
      showColumnStripes: model.showColumnStripes ? '1' : '0',
    });
    return true;
  }

  parseOpen(node) {
    if (node.name === this.tag) {
      const {attributes} = node;
      this.model = {
        theme: attributes.name ? attributes.name : null,
        showFirstColumn: attributes.showFirstColumn === '1',
        showLastColumn: attributes.showLastColumn === '1',
        showRowStripes: attributes.showRowStripes === '1',
        showColumnStripes: attributes.showColumnStripes === '1',
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

module.exports = TableStyleInfoXform;
