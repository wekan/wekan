/* eslint-disable max-classes-per-file */
const utils = require('../../utils/utils');
const RelType = require('../../xlsx/rel-type');

class HyperlinksProxy {
  constructor(sheetRelsWriter) {
    this.writer = sheetRelsWriter;
  }

  push(hyperlink) {
    this.writer.addHyperlink(hyperlink);
  }
}

class SheetRelsWriter {
  constructor(options) {
    // in a workbook, each sheet will have a number
    this.id = options.id;

    // count of all relationships
    this.count = 0;

    // keep record of all hyperlinks
    this._hyperlinks = [];

    this._workbook = options.workbook;
  }

  get stream() {
    if (!this._stream) {
      // eslint-disable-next-line no-underscore-dangle
      this._stream = this._workbook._openStream(`/xl/worksheets/_rels/sheet${this.id}.xml.rels`);
    }
    return this._stream;
  }

  get length() {
    return this._hyperlinks.length;
  }

  each(fn) {
    return this._hyperlinks.forEach(fn);
  }

  get hyperlinksProxy() {
    return this._hyperlinksProxy || (this._hyperlinksProxy = new HyperlinksProxy(this));
  }

  addHyperlink(hyperlink) {
    // Write to stream
    const relationship = {
      Target: hyperlink.target,
      Type: RelType.Hyperlink,
      TargetMode: 'External',
    };
    const rId = this._writeRelationship(relationship);

    // store sheet stuff for later
    this._hyperlinks.push({
      rId,
      address: hyperlink.address,
    });
  }

  addMedia(media) {
    return this._writeRelationship(media);
  }

  addRelationship(rel) {
    return this._writeRelationship(rel);
  }

  commit() {
    if (this.count) {
      // write xml utro
      this._writeClose();
      // and close stream
      this.stream.end();
    }
  }

  // ================================================================================
  _writeOpen() {
    this.stream.write(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
       <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    );
  }

  _writeRelationship(relationship) {
    if (!this.count) {
      this._writeOpen();
    }

    const rId = `rId${++this.count}`;

    if (relationship.TargetMode) {
      this.stream.write(
        `<Relationship Id="${rId}"` +
          ` Type="${relationship.Type}"` +
          ` Target="${utils.xmlEncode(relationship.Target)}"` +
          ` TargetMode="${relationship.TargetMode}"` +
          '/>'
      );
    } else {
      this.stream.write(
        `<Relationship Id="${rId}" Type="${relationship.Type}" Target="${relationship.Target}"/>`
      );
    }

    return rId;
  }

  _writeClose() {
    this.stream.write('</Relationships>');
  }
}

module.exports = SheetRelsWriter;
