import PDFDocument from 'pdfkit';

import {
  FONT_SIZE,
  LINE_HEIGHT,
  PAGE_HEIGHT,
  PAGE_MARGIN,
  PAGE_WIDTH,
  paginateLines,
} from '/models/lib/pdfDocument';

const MAIN_FONT = 'WeKanUnicodeBMP';
const UPPER_FONT = 'WeKanUnicodeUpper';

function unicodeRuns(text) {
  const runs = [];
  for (const character of String(text || '')) {
    const font = character.codePointAt(0) > 0xffff ? UPPER_FONT : MAIN_FONT;
    const previous = runs[runs.length - 1];
    if (previous && previous.font === font) previous.text += character;
    else runs.push({ font, text: character });
  }
  return runs;
}

// PDFKit subsets the two bundled GNU Unifont OpenType files and embeds only the
// glyphs this export uses. The BMP font covers U+0000-U+FFFF; the upper font is
// the fallback for assigned characters in Unicode's supplementary planes.
function buildUnicodePdf(rawLines, fonts) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const mainFont = Buffer.from(fonts.main);
    const upperFont = Buffer.from(fonts.upper);
    // PDFKit otherwise initializes Helvetica immediately and reads its AFM from
    // `__dirname/data`. Meteor rewrites that path inside a production bundle,
    // where the AFM is not an application asset. Starting with the already
    // loaded Unicode font avoids any filesystem lookup for a base-14 font.
    const pdf = new PDFDocument({ autoFirstPage: false, compress: true,
      font: mainFont, margin: PAGE_MARGIN, size: [PAGE_WIDTH, PAGE_HEIGHT] });
    pdf.on('data', chunk => chunks.push(chunk));
    pdf.on('error', reject);
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.registerFont(MAIN_FONT, mainFont);
    pdf.registerFont(UPPER_FONT, upperFont);

    for (const lines of paginateLines(rawLines || [])) {
      pdf.addPage({ margin: PAGE_MARGIN, size: [PAGE_WIDTH, PAGE_HEIGHT] });
      lines.forEach((item, index) => {
        const y = PAGE_MARGIN + index * LINE_HEIGHT;
        if (item && item.bar) {
          pdf.save().fillColor('#d9d9d9')
            .rect(PAGE_MARGIN - 4, y - 3, PAGE_WIDTH - (PAGE_MARGIN - 4) * 2, LINE_HEIGHT)
            .fill().restore();
        }
        const sourceRuns = item && item.runs
          ? item.runs
          : [{ text: item && item.text !== undefined ? item.text : String(item || ''),
            bold: !!(item && item.bold) }];
        let x = PAGE_MARGIN;
        for (const source of sourceRuns) {
          for (const run of unicodeRuns(source.text)) {
            const size = source.bold ? FONT_SIZE + 0.5 : FONT_SIZE;
            pdf.font(run.font).fontSize(size).fillColor('#000000');
            pdf.text(run.text, x, y, { lineBreak: false });
            x += pdf.widthOfString(run.text);
          }
        }
        if (item && item.imageRow) {
          const gap = 10;
          const width = (PAGE_WIDTH - PAGE_MARGIN * 2 - gap * 2) / 3;
          item.imageRow.forEach((image, column) => {
            if (!Buffer.isBuffer(image.data)) return;
            try {
              pdf.image(image.data, PAGE_MARGIN + column * (width + gap), y + LINE_HEIGHT, {
                fit: [width, LINE_HEIGHT * 7], align: 'left', valign: 'top',
              });
            } catch (error) {
              // Its filename and size remain above the preview row.
            }
          });
        }
      });
    }
    pdf.end();
  });
}

export { buildUnicodePdf, unicodeRuns };
