const XmlStream = require('../../../utils/xml-stream');

const BaseXform = require('../base-xform');

// used for rendering the [Content_Types].xml file
// not used for parsing
class ContentTypesXform extends BaseXform {
  render(xmlStream, model) {
    xmlStream.openXml(XmlStream.StdDocAttributes);

    xmlStream.openNode('Types', ContentTypesXform.PROPERTY_ATTRIBUTES);

    const mediaHash = {};
    (model.media || []).forEach(medium => {
      if (medium.type === 'image') {
        const imageType = medium.extension;
        if (!mediaHash[imageType]) {
          mediaHash[imageType] = true;
          xmlStream.leafNode('Default', {Extension: imageType, ContentType: `image/${imageType}`});
        }
      }
    });

    xmlStream.leafNode('Default', {
      Extension: 'rels',
      ContentType: 'application/vnd.openxmlformats-package.relationships+xml',
    });
    xmlStream.leafNode('Default', {Extension: 'xml', ContentType: 'application/xml'});

    xmlStream.leafNode('Override', {
      PartName: '/xl/workbook.xml',
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
    });

    model.worksheets.forEach(worksheet => {
      const name = `/xl/worksheets/sheet${worksheet.id}.xml`;
      xmlStream.leafNode('Override', {
        PartName: name,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml',
      });
    });

    if ((model.pivotTables || []).length) {
      // Note(2023-10-06): assuming at most one pivot table for now.
      xmlStream.leafNode('Override', {
        PartName: '/xl/pivotCache/pivotCacheDefinition1.xml',
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml',
      });
      xmlStream.leafNode('Override', {
        PartName: '/xl/pivotCache/pivotCacheRecords1.xml',
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml',
      });
      xmlStream.leafNode('Override', {
        PartName: '/xl/pivotTables/pivotTable1.xml',
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml',
      });
    }

    xmlStream.leafNode('Override', {
      PartName: '/xl/theme/theme1.xml',
      ContentType: 'application/vnd.openxmlformats-officedocument.theme+xml',
    });
    xmlStream.leafNode('Override', {
      PartName: '/xl/styles.xml',
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml',
    });

    const hasSharedStrings = model.sharedStrings && model.sharedStrings.count;
    if (hasSharedStrings) {
      xmlStream.leafNode('Override', {
        PartName: '/xl/sharedStrings.xml',
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml',
      });
    }

    if (model.tables) {
      model.tables.forEach(table => {
        xmlStream.leafNode('Override', {
          PartName: `/xl/tables/${table.target}`,
          ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml',
        });
      });
    }

    if (model.drawings) {
      model.drawings.forEach(drawing => {
        xmlStream.leafNode('Override', {
          PartName: `/xl/drawings/${drawing.name}.xml`,
          ContentType: 'application/vnd.openxmlformats-officedocument.drawing+xml',
        });
      });
    }

    if (model.commentRefs) {
      xmlStream.leafNode('Default', {
        Extension: 'vml',
        ContentType: 'application/vnd.openxmlformats-officedocument.vmlDrawing',
      });

      model.commentRefs.forEach(({commentName}) => {
        xmlStream.leafNode('Override', {
          PartName: `/xl/${commentName}.xml`,
          ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml',
        });
      });
    }

    xmlStream.leafNode('Override', {
      PartName: '/docProps/core.xml',
      ContentType: 'application/vnd.openxmlformats-package.core-properties+xml',
    });
    xmlStream.leafNode('Override', {
      PartName: '/docProps/app.xml',
      ContentType: 'application/vnd.openxmlformats-officedocument.extended-properties+xml',
    });

    xmlStream.closeNode();
  }

  parseOpen() {
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

ContentTypesXform.PROPERTY_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/package/2006/content-types',
};

module.exports = ContentTypesXform;
