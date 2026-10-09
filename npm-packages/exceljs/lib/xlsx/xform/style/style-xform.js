const BaseXform = require('../base-xform');

const AlignmentXform = require('./alignment-xform');
const ProtectionXform = require('./protection-xform');

// <xf numFmtId="[numFmtId]" fontId="[fontId]" fillId="[fillId]" borderId="[xf.borderId]" xfId="[xfId]">
//   Optional <alignment>
//   Optional <protection>
// </xf>

// Style assists translation from style model to/from xlsx
class StyleXform extends BaseXform {
  constructor(options) {
    super();

    this.xfId = !!(options && options.xfId);
    this.map = {
      alignment: new AlignmentXform(),
      protection: new ProtectionXform(),
    };
  }

  get tag() {
    return 'xf';
  }

  render(xmlStream, model) {
    xmlStream.openNode('xf', {
      numFmtId: model.numFmtId || 0,
      fontId: model.fontId || 0,
      fillId: model.fillId || 0,
      borderId: model.borderId || 0,
    });
    if (this.xfId) {
      xmlStream.addAttribute('xfId', model.xfId || 0);
    }

    if (model.numFmtId) {
      xmlStream.addAttribute('applyNumberFormat', '1');
    }
    if (model.fontId) {
      xmlStream.addAttribute('applyFont', '1');
    }
    if (model.fillId) {
      xmlStream.addAttribute('applyFill', '1');
    }
    if (model.borderId) {
      xmlStream.addAttribute('applyBorder', '1');
    }
    if (model.alignment) {
      xmlStream.addAttribute('applyAlignment', '1');
    }
    if (model.protection) {
      xmlStream.addAttribute('applyProtection', '1');
    }

    /**
     * Rendering tags causes close of XML stream.
     * Therefore adding attributes must be done before rendering tags.
     */

    if (model.alignment) {
      this.map.alignment.render(xmlStream, model.alignment);
    }
    if (model.protection) {
      this.map.protection.render(xmlStream, model.protection);
    }

    xmlStream.closeNode();
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    // used during sax parsing of xml to build font object
    switch (node.name) {
      case 'xf':
        this.model = {
          numFmtId: parseInt(node.attributes.numFmtId, 10),
          fontId: parseInt(node.attributes.fontId, 10),
          fillId: parseInt(node.attributes.fillId, 10),
          borderId: parseInt(node.attributes.borderId, 10),
        };
        if (this.xfId) {
          this.model.xfId = parseInt(node.attributes.xfId, 10);
        }
        return true;
      case 'alignment':
        this.parser = this.map.alignment;
        this.parser.parseOpen(node);
        return true;
      case 'protection':
        this.parser = this.map.protection;
        this.parser.parseOpen(node);
        return true;
      default:
        return false;
    }
  }

  parseText(text) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        if (this.map.protection === this.parser) {
          this.model.protection = this.parser.model;
        } else {
          this.model.alignment = this.parser.model;
        }
        this.parser = undefined;
      }
      return true;
    }
    return name !== 'xf';
  }
}

module.exports = StyleXform;
