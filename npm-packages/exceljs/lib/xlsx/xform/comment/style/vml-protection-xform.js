const BaseXform = require('../../base-xform');

class VmlProtectionXform extends BaseXform {
  constructor(model) {
    super();
    this._model = model;
  }

  get tag() {
    return this._model && this._model.tag;
  }

  render(xmlStream, model) {
    xmlStream.leafNode(this.tag, null, model);
  }

  parseOpen(node) {
    switch (node.name) {
      case this.tag:
        this.text = '';
        return true;
      default:
        return false;
    }
  }

  parseText(text) {
    this.text = text;
  }

  parseClose() {
    return false;
  }
}

module.exports = VmlProtectionXform;
