const BaseXform = require('./base-xform');

/* 'virtual' methods used as a form of documentation */
/* eslint-disable class-methods-use-this */

// base class for xforms that are composed of other xforms
// offers some default implementations
class CompositeXform extends BaseXform {
  createNewModel(node) {
    return {};
  }

  parseOpen(node) {
    // Typical pattern for composite xform
    this.parser = this.parser || this.map[node.name];
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    if (node.name === this.tag) {
      this.model = this.createNewModel(node);
      return true;
    }

    return false;
  }

  parseText(text) {
    // Default implementation. Send text to child parser
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  onParserClose(name, parser) {
    // parseClose has seen a child parser close
    // now need to incorporate into this.model somehow
    this.model[name] = parser.model;
  }

  parseClose(name) {
    // Default implementation
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.onParserClose(name, this.parser);
        this.parser = undefined;
      }
      return true;
    }

    return name !== this.tag;
  }
}

module.exports = CompositeXform;
