const BaseXform = require('../../base-xform');

class SqrefExtXform extends BaseXform {
  get tag() {
    return 'xm:sqref';
  }

  render(xmlStream, model) {
    xmlStream.leafNode(this.tag, null, model);
  }

  parseOpen() {
    this.model = '';
  }

  parseText(text) {
    this.model += text;
  }

  parseClose(name) {
    return name !== this.tag;
  }
}

module.exports = SqrefExtXform;
