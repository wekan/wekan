const BaseXform = require('../../base-xform');
const CompositeXform = require('../../composite-xform');

const CfvoExtXform = require('./cfvo-ext-xform');
const CfIconExtXform = require('./cf-icon-ext-xform');

class IconSetExtXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      'x14:cfvo': (this.cfvoXform = new CfvoExtXform()),
      'x14:cfIcon': (this.cfIconXform = new CfIconExtXform()),
    };
  }

  get tag() {
    return 'x14:iconSet';
  }

  render(xmlStream, model) {
    xmlStream.openNode(this.tag, {
      iconSet: BaseXform.toStringAttribute(model.iconSet),
      reverse: BaseXform.toBoolAttribute(model.reverse, false),
      showValue: BaseXform.toBoolAttribute(model.showValue, true),
      custom: BaseXform.toBoolAttribute(model.icons, false),
    });

    model.cfvo.forEach(cfvo => {
      this.cfvoXform.render(xmlStream, cfvo);
    });

    if (model.icons) {
      model.icons.forEach((icon, i) => {
        icon.iconId = i;
        this.cfIconXform.render(xmlStream, icon);
      });
    }

    xmlStream.closeNode();
  }

  createNewModel({attributes}) {
    return {
      cfvo: [],
      iconSet: BaseXform.toStringValue(attributes.iconSet, '3TrafficLights'),
      reverse: BaseXform.toBoolValue(attributes.reverse, false),
      showValue: BaseXform.toBoolValue(attributes.showValue, true),
    };
  }

  onParserClose(name, parser) {
    const [, prop] = name.split(':');
    switch (prop) {
      case 'cfvo':
        this.model.cfvo.push(parser.model);
        break;

      case 'cfIcon':
        if (!this.model.icons) {
          this.model.icons = [];
        }
        this.model.icons.push(parser.model);
        break;

      default:
        this.model[prop] = parser.model;
        break;
    }
  }
}

module.exports = IconSetExtXform;
