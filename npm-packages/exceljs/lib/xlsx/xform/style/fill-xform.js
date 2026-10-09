/* eslint-disable max-classes-per-file */
const BaseXform = require('../base-xform');

const ColorXform = require('./color-xform');

class StopXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      color: new ColorXform(),
    };
  }

  get tag() {
    return 'stop';
  }

  render(xmlStream, model) {
    xmlStream.openNode('stop');
    xmlStream.addAttribute('position', model.position);
    this.map.color.render(xmlStream, model.color);
    xmlStream.closeNode();
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'stop':
        this.model = {
          position: parseFloat(node.attributes.position),
        };
        return true;
      case 'color':
        this.parser = this.map.color;
        this.parser.parseOpen(node);
        return true;
      default:
        return false;
    }
  }

  parseText() {}

  parseClose(name) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.model.color = this.parser.model;
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }
}

class PatternFillXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      fgColor: new ColorXform('fgColor'),
      bgColor: new ColorXform('bgColor'),
    };
  }

  get name() {
    return 'pattern';
  }

  get tag() {
    return 'patternFill';
  }

  render(xmlStream, model) {
    xmlStream.openNode('patternFill');
    xmlStream.addAttribute('patternType', model.pattern);
    if (model.fgColor) {
      this.map.fgColor.render(xmlStream, model.fgColor);
    }
    if (model.bgColor) {
      this.map.bgColor.render(xmlStream, model.bgColor);
    }
    xmlStream.closeNode();
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'patternFill':
        this.model = {
          type: 'pattern',
          pattern: node.attributes.patternType,
        };
        return true;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }
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
        if (this.parser.model) {
          this.model[name] = this.parser.model;
        }
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }
}

class GradientFillXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      stop: new StopXform(),
    };
    // if (model) {
    //   this.gradient = model.gradient;
    //   if (model.center) {
    //     this.center = model.center;
    //   }
    //   if (model.degree !== undefined) {
    //     this.degree = model.degree;
    //   }
    //   this.stops = model.stops.map(function(stop) { return new StopXform(stop); });
    // } else {
    //   this.stops = [];
    // }
  }

  get name() {
    return 'gradient';
  }

  get tag() {
    return 'gradientFill';
  }

  render(xmlStream, model) {
    xmlStream.openNode('gradientFill');
    switch (model.gradient) {
      case 'angle':
        xmlStream.addAttribute('degree', model.degree);
        break;
      case 'path':
        xmlStream.addAttribute('type', 'path');
        if (model.center.left) {
          xmlStream.addAttribute('left', model.center.left);
          if (model.center.right === undefined) {
            xmlStream.addAttribute('right', model.center.left);
          }
        }
        if (model.center.right) {
          xmlStream.addAttribute('right', model.center.right);
        }
        if (model.center.top) {
          xmlStream.addAttribute('top', model.center.top);
          if (model.center.bottom === undefined) {
            xmlStream.addAttribute('bottom', model.center.top);
          }
        }
        if (model.center.bottom) {
          xmlStream.addAttribute('bottom', model.center.bottom);
        }
        break;

      default:
        break;
    }

    const stopXform = this.map.stop;
    model.stops.forEach(stopModel => {
      stopXform.render(xmlStream, stopModel);
    });

    xmlStream.closeNode();
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'gradientFill': {
        const model = (this.model = {
          stops: [],
        });
        if (node.attributes.degree) {
          model.gradient = 'angle';
          model.degree = parseInt(node.attributes.degree, 10);
        } else if (node.attributes.type === 'path') {
          model.gradient = 'path';
          model.center = {
            left: node.attributes.left ? parseFloat(node.attributes.left) : 0,
            top: node.attributes.top ? parseFloat(node.attributes.top) : 0,
          };
          if (node.attributes.right !== node.attributes.left) {
            model.center.right = node.attributes.right ? parseFloat(node.attributes.right) : 0;
          }
          if (node.attributes.bottom !== node.attributes.top) {
            model.center.bottom = node.attributes.bottom ? parseFloat(node.attributes.bottom) : 0;
          }
        }
        return true;
      }

      case 'stop':
        this.parser = this.map.stop;
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
        this.model.stops.push(this.parser.model);
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }
}

// Fill encapsulates translation from fill model to/from xlsx
class FillXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      patternFill: new PatternFillXform(),
      gradientFill: new GradientFillXform(),
    };
  }

  get tag() {
    return 'fill';
  }

  render(xmlStream, model) {
    xmlStream.addRollback();
    xmlStream.openNode('fill');
    switch (model.type) {
      case 'pattern':
        this.map.patternFill.render(xmlStream, model);
        break;
      case 'gradient':
        this.map.gradientFill.render(xmlStream, model);
        break;
      default:
        xmlStream.rollback();
        return;
    }
    xmlStream.closeNode();
    xmlStream.commit();
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'fill':
        this.model = {};
        return true;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }
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
        this.model = this.parser.model;
        this.model.type = this.parser.name;
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }

  validStyle(value) {
    return FillXform.validPatternValues[value];
  }
}

FillXform.validPatternValues = [
  'none',
  'solid',
  'darkVertical',
  'darkGray',
  'mediumGray',
  'lightGray',
  'gray125',
  'gray0625',
  'darkHorizontal',
  'darkVertical',
  'darkDown',
  'darkUp',
  'darkGrid',
  'darkTrellis',
  'lightHorizontal',
  'lightVertical',
  'lightDown',
  'lightUp',
  'lightGrid',
  'lightTrellis',
  'lightGrid',
].reduce((p, v) => {
  p[v] = true;
  return p;
}, {});

FillXform.StopXform = StopXform;
FillXform.PatternFillXform = PatternFillXform;
FillXform.GradientFillXform = GradientFillXform;

module.exports = FillXform;
