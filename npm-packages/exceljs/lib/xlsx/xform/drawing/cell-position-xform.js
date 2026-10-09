const BaseXform = require('../base-xform');
const IntegerXform = require('../simple/integer-xform');

class CellPositionXform extends BaseXform {
  constructor(options) {
    super();

    this.tag = options.tag;
    this.map = {
      'xdr:col': new IntegerXform({tag: 'xdr:col', zero: true}),
      'xdr:colOff': new IntegerXform({tag: 'xdr:colOff', zero: true}),
      'xdr:row': new IntegerXform({tag: 'xdr:row', zero: true}),
      'xdr:rowOff': new IntegerXform({tag: 'xdr:rowOff', zero: true}),
    };
  }

  render(xmlStream, model) {
    xmlStream.openNode(this.tag);

    this.map['xdr:col'].render(xmlStream, model.nativeCol);
    this.map['xdr:colOff'].render(xmlStream, model.nativeColOff);

    this.map['xdr:row'].render(xmlStream, model.nativeRow);
    this.map['xdr:rowOff'].render(xmlStream, model.nativeRowOff);

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

  parseText(text) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        this.model = {
          nativeCol: this.map['xdr:col'].model,
          nativeColOff: this.map['xdr:colOff'].model,
          nativeRow: this.map['xdr:row'].model,
          nativeRowOff: this.map['xdr:rowOff'].model,
        };
        return false;
      default:
        // not quite sure how we get here!
        return true;
    }
  }
}

module.exports = CellPositionXform;
