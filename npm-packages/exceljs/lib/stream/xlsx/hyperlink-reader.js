const {EventEmitter} = require('events');
const parseSax = require('../../utils/parse-sax');

const Enums = require('../../doc/enums');
const RelType = require('../../xlsx/rel-type');

class HyperlinkReader extends EventEmitter {
  constructor({workbook, id, iterator, options}) {
    super();

    this.workbook = workbook;
    this.id = id;
    this.iterator = iterator;
    this.options = options;
  }

  get count() {
    return (this.hyperlinks && this.hyperlinks.length) || 0;
  }

  each(fn) {
    return this.hyperlinks.forEach(fn);
  }

  async read() {
    const {iterator, options} = this;
    let emitHyperlinks = false;
    let hyperlinks = null;
    switch (options.hyperlinks) {
      case 'emit':
        emitHyperlinks = true;
        break;
      case 'cache':
        this.hyperlinks = hyperlinks = {};
        break;
      default:
        break;
    }

    if (!emitHyperlinks && !hyperlinks) {
      this.emit('finished');
      return;
    }

    try {
      for await (const events of parseSax(iterator)) {
        for (const {eventType, value} of events) {
          if (eventType === 'opentag') {
            const node = value;
            if (node.name === 'Relationship') {
              const rId = node.attributes.Id;
              switch (node.attributes.Type) {
                case RelType.Hyperlink:
                  {
                    const relationship = {
                      type: Enums.RelationshipType.Styles,
                      rId,
                      target: node.attributes.Target,
                      targetMode: node.attributes.TargetMode,
                    };
                    if (emitHyperlinks) {
                      this.emit('hyperlink', relationship);
                    } else {
                      hyperlinks[relationship.rId] = relationship;
                    }
                  }
                  break;

                default:
                  break;
              }
            }
          }
        }
      }
      this.emit('finished');
    } catch (error) {
      this.emit('error', error);
    }
  }
}

module.exports = HyperlinkReader;
