const BaseXform = require('../base-xform');
const HlickClickXform = require('./hlink-click-xform');
const ExtLstXform = require('./ext-lst-xform');

class CNvPrXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      'a:hlinkClick': new HlickClickXform(),
      'a:extLst': new ExtLstXform(),
    };
  }

  get tag() {
    return 'xdr:cNvPr';
  }

  render(xmlStream, model) {
    xmlStream.openNode(this.tag, {
      id: model.index,
      name: `Picture ${model.index}`,
    });
    this.map['a:hlinkClick'].render(xmlStream, model);
    this.map['a:extLst'].render(xmlStream, model);
    xmlStream.closeNode();
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    switch (node.name) {
      case this.tag:
        this.reset();
        break;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        break;
    }
    return true;
  }

  parseText() {}

  parseClose(name) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        this.model = this.map['a:hlinkClick'].model;
        return false;
      default:
        return true;
    }
  }
}

module.exports = CNvPrXform;
