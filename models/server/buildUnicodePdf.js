// scripts/patch-pdfkit-entry.cjs makes this static Node import select PDFKit's
// CommonJS build. Keeping a static import is important: Meteor then records and
// ships PDFKit as an application dependency. The CommonJS build derives its
// resource paths from the deployed __filename, so a bundle built on Linux also
// starts on Windows.
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
const LABEL_COLORS = {
  white: '#ffffff', green: '#008000', yellow: '#ffff00', orange: '#ffa500',
  red: '#ff0000', purple: '#800080', blue: '#0000ff', sky: '#87ceeb',
  lime: '#00ff00', pink: '#ffc0cb', black: '#000000', silver: '#c0c0c0',
  peachpuff: '#ffdab9', crimson: '#dc143c', plum: '#dda0dd',
  darkgreen: '#006400', slateblue: '#6a5acd', magenta: '#ff00ff',
  gold: '#ffd700', navy: '#000080', gray: '#808080', saddlebrown: '#8b4513',
  paleturquoise: '#afeeee', mistyrose: '#ffe4e1', indigo: '#4b0082',
};

function contrastingText(hex) {
  const channels = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16));
  return (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000 > 140
    ? '#000000' : '#ffffff';
}

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
      const drawText = (text, x, y, options = {}) => {
        let cursor = x;
        for (const run of unicodeRuns(text)) {
          pdf.font(run.font).fontSize(options.size || FONT_SIZE)
            .fillColor(options.color || '#000000');
          pdf.text(run.text, cursor, y, { lineBreak: false,
            width: options.width, height: LINE_HEIGHT, ellipsis: !!options.width });
          cursor += pdf.widthOfString(run.text);
        }
      };
      lines.forEach((item, index) => {
        const y = PAGE_MARGIN + index * LINE_HEIGHT;
        if (item && item.bar) {
          pdf.save().fillColor('#d9d9d9')
            .rect(PAGE_MARGIN - 4, y - 3, PAGE_WIDTH - (PAGE_MARGIN - 4) * 2, LINE_HEIGHT)
            .fill().restore();
        }
        if (item && item.labelRow) {
          const cellWidth = (PAGE_WIDTH - PAGE_MARGIN * 2) / 6;
          drawText(`${item.labelTitle || ''}${item.labelTitle ? ':' : ''}`,
            PAGE_MARGIN, y, { width: cellWidth - 4 });
          item.labelRow.forEach((label, labelIndex) => {
            const x = PAGE_MARGIN + cellWidth * (labelIndex + 1);
            const color = LABEL_COLORS[label.color] || '#c0c0c0';
            pdf.save().fillColor(color).rect(x, y - 2, cellWidth, LINE_HEIGHT).fill().restore();
            drawText(label.name || '', x + 2, y, {
              size: 8, color: contrastingText(color), width: cellWidth - 4,
            });
          });
          return;
        }
        if (item && item.progress) {
          const total = Math.max(0, Number(item.progress.total) || 0);
          const done = Math.max(0, Math.min(total, Number(item.progress.done) || 0));
          const cellWidth = (PAGE_WIDTH - PAGE_MARGIN * 2) / 6;
          const filled = total ? Math.round(done / total * 6) : 0;
          for (let part = 0; part < 6; part += 1) {
            const x = PAGE_MARGIN + part * cellWidth;
            pdf.save().lineWidth(0.5).rect(x, y - 2, cellWidth, LINE_HEIGHT);
            if (part < filled) pdf.fillAndStroke('#2980b9', '#000000');
            else pdf.stroke('#000000');
            pdf.restore();
          }
          drawText(`${done}/${total}`, PAGE_MARGIN + 2, y, { size: 8 });
          return;
        }
        if (item && item.attachmentCells) {
          const widths = [20, 120, 48, 72, 115, 120];
          let x = PAGE_MARGIN;
          item.attachmentCells.forEach((cell, cellIndex) => {
            const width = widths[cellIndex];
            pdf.save().lineWidth(0.4);
            if (item.attachmentHeader) pdf.fillColor('#d9d9d9').rect(x, y - 2, width, LINE_HEIGHT)
              .fillAndStroke('#d9d9d9', '#000000');
            else pdf.rect(x, y - 2, width, LINE_HEIGHT).stroke('#000000');
            pdf.restore();
            drawText(String(cell ?? ''), x + 2, y, { size: 7, width: width - 4 });
            x += width;
          });
          return;
        }
        if (item && item.imageRow) {
          const gap = 10;
          const width = (PAGE_WIDTH - PAGE_MARGIN * 2 - gap * 2) / 3;
          item.imageRow.forEach((image, column) => {
            const x = PAGE_MARGIN + column * (width + gap);
            if (Buffer.isBuffer(image.data)) {
              try {
                pdf.image(image.data, x, y, {
                  fit: [width, LINE_HEIGHT * 7], align: 'left', valign: 'top',
                });
              } catch (error) {
                // The attachment detail row still names an unreadable preview.
              }
            }
            drawText((item.imageCaptions || [])[column] || '', x, y + LINE_HEIGHT * 7,
              { size: 8, width });
          });
          return;
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
      });
    }
    pdf.end();
  });
}

export { buildUnicodePdf, unicodeRuns };
