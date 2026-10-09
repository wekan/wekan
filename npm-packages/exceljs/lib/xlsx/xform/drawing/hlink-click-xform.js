const BaseXform = require('../base-xform');

class HLinkClickXform extends BaseXform {
  get tag() {
    return 'a:hlinkClick';
  }

  render(xmlStream, model) {
    if (!(model.hyperlinks && model.hyperlinks.rId)) {
      return;
    }
    xmlStream.leafNode(this.tag, {
      'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'r:id': model.hyperlinks.rId,
      tooltip: model.hyperlinks.tooltip,
    });
  }

  parseOpen(node) {
    switch (node.name) {
      case this.tag:
        this.model = {
          hyperlinks: {
            rId: node.attributes['r:id'],
            tooltip: node.attributes.tooltip,
          },
        };
        return true;
      default:
        return true;
    }
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

module.exports = HLinkClickXform;
