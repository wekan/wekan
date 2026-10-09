const BaseXform = verquire('xlsx/xform/base-xform');

class CompyXform extends BaseXform {
  constructor(options) {
    super();

    this.tag = options.tag;
    this.attrs = options.attrs;
    this.children = options.children;
    this.map = this.children.reduce((map, child) => {
      const name = child.name || child.tag;
      const tag = child.tag || child.name;
      map[tag] = child;
      child.name = name;
      child.tag = tag;
      return map;
    }, {});
  }

  prepare(model, options) {
    this.children.forEach(child => {
      child.xform.prepare(model[child.tag], options);
    });
  }

  render(xmlStream, model) {
    xmlStream.openNode(this.tag, this.attrs);
    this.children.forEach(child => {
      child.xform.render(xmlStream, model[child.name]);
    });
    xmlStream.closeNode();
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.xform.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.tag:
        this.model = {};
        return true;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.xform.parseOpen(node);
          return true;
        }
    }
    return false;
  }

  parseText(text) {
    if (this.parser) {
      this.parser.xform.parseText(text);
    }
  }

  parseClose(name) {
    if (this.parser) {
      if (!this.parser.xform.parseClose(name)) {
        this.model[this.parser.name] = this.parser.xform.model;
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }

  reconcile(model, options) {
    this.children.forEach(child => {
      child.xform.prepare(model[child.tag], options);
    });
  }
}

module.exports = CompyXform;
