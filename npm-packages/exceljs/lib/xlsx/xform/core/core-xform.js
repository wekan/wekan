const XmlStream = require('../../../utils/xml-stream');
const BaseXform = require('../base-xform');
const DateXform = require('../simple/date-xform');
const StringXform = require('../simple/string-xform');
const IntegerXform = require('../simple/integer-xform');

class CoreXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      'dc:creator': new StringXform({tag: 'dc:creator'}),
      'dc:title': new StringXform({tag: 'dc:title'}),
      'dc:subject': new StringXform({tag: 'dc:subject'}),
      'dc:description': new StringXform({tag: 'dc:description'}),
      'dc:identifier': new StringXform({tag: 'dc:identifier'}),
      'dc:language': new StringXform({tag: 'dc:language'}),
      'cp:keywords': new StringXform({tag: 'cp:keywords'}),
      'cp:category': new StringXform({tag: 'cp:category'}),
      'cp:lastModifiedBy': new StringXform({tag: 'cp:lastModifiedBy'}),
      'cp:lastPrinted': new DateXform({tag: 'cp:lastPrinted', format: CoreXform.DateFormat}),
      'cp:revision': new IntegerXform({tag: 'cp:revision'}),
      'cp:version': new StringXform({tag: 'cp:version'}),
      'cp:contentStatus': new StringXform({tag: 'cp:contentStatus'}),
      'cp:contentType': new StringXform({tag: 'cp:contentType'}),
      'dcterms:created': new DateXform({
        tag: 'dcterms:created',
        attrs: CoreXform.DateAttrs,
        format: CoreXform.DateFormat,
      }),
      'dcterms:modified': new DateXform({
        tag: 'dcterms:modified',
        attrs: CoreXform.DateAttrs,
        format: CoreXform.DateFormat,
      }),
    };
  }

  render(xmlStream, model) {
    xmlStream.openXml(XmlStream.StdDocAttributes);

    xmlStream.openNode('cp:coreProperties', CoreXform.CORE_PROPERTY_ATTRIBUTES);

    this.map['dc:creator'].render(xmlStream, model.creator);
    this.map['dc:title'].render(xmlStream, model.title);
    this.map['dc:subject'].render(xmlStream, model.subject);
    this.map['dc:description'].render(xmlStream, model.description);
    this.map['dc:identifier'].render(xmlStream, model.identifier);
    this.map['dc:language'].render(xmlStream, model.language);
    this.map['cp:keywords'].render(xmlStream, model.keywords);
    this.map['cp:category'].render(xmlStream, model.category);
    this.map['cp:lastModifiedBy'].render(xmlStream, model.lastModifiedBy);
    this.map['cp:lastPrinted'].render(xmlStream, model.lastPrinted);
    this.map['cp:revision'].render(xmlStream, model.revision);
    this.map['cp:version'].render(xmlStream, model.version);
    this.map['cp:contentStatus'].render(xmlStream, model.contentStatus);
    this.map['cp:contentType'].render(xmlStream, model.contentType);
    this.map['dcterms:created'].render(xmlStream, model.created);
    this.map['dcterms:modified'].render(xmlStream, model.modified);

    xmlStream.closeNode();
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'cp:coreProperties':
      case 'coreProperties':
        return true;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }
        // Ignore unknown tags for compatibility with non-Excel applications
        return true;
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
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case 'cp:coreProperties':
      case 'coreProperties':
        this.model = {
          creator: this.map['dc:creator'].model,
          title: this.map['dc:title'].model,
          subject: this.map['dc:subject'].model,
          description: this.map['dc:description'].model,
          identifier: this.map['dc:identifier'].model,
          language: this.map['dc:language'].model,
          keywords: this.map['cp:keywords'].model,
          category: this.map['cp:category'].model,
          lastModifiedBy: this.map['cp:lastModifiedBy'].model,
          lastPrinted: this.map['cp:lastPrinted'].model,
          revision: this.map['cp:revision'].model,
          contentStatus: this.map['cp:contentStatus'].model,
          contentType: this.map['cp:contentType'].model,
          created: this.map['dcterms:created'].model,
          modified: this.map['dcterms:modified'].model,
        };
        return false;
      default:
        // Ignore unknown tags for compatibility with non-Excel applications
        return true;
    }
  }
}

CoreXform.DateFormat = function(dt) {
  return dt.toISOString().replace(/[.]\d{3}/, '');
};
CoreXform.DateAttrs = {'xsi:type': 'dcterms:W3CDTF'};

CoreXform.CORE_PROPERTY_ATTRIBUTES = {
  'xmlns:cp': 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties',
  'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
  'xmlns:dcterms': 'http://purl.org/dc/terms/',
  'xmlns:dcmitype': 'http://purl.org/dc/dcmitype/',
  'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
};

module.exports = CoreXform;
