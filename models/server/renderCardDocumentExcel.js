// Draw models/lib/cardDocument.js onto an ExcelJS worksheet.
//
// The document owns order, emptiness and content. This renderer owns only
// worksheet presentation: six columns, fills, borders, row heights and images.

const THIN = {
  top: { style: 'thin' }, left: { style: 'thin' },
  bottom: { style: 'thin' }, right: { style: 'thin' },
};
const MEDIUM = {
  top: { style: 'medium' }, left: { style: 'medium' },
  bottom: { style: 'medium' }, right: { style: 'medium' },
};
const GRAY = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };

const LABEL_COLORS = {
  white: 'FFFFFFFF', green: 'FF008000', yellow: 'FFFFFF00', orange: 'FFFFA500',
  red: 'FFFF0000', purple: 'FF800080', blue: 'FF0000FF', sky: 'FF87CEEB',
  lime: 'FF00FF00', pink: 'FFFFC0CB', black: 'FF000000', silver: 'FFC0C0C0',
  peachpuff: 'FFFFDAB9', crimson: 'FFDC143C', plum: 'FFDDA0DD',
  darkgreen: 'FF006400', slateblue: 'FF6A5ACD', magenta: 'FFFF00FF',
  gold: 'FFFFD700', navy: 'FF000080', gray: 'FF808080',
  saddlebrown: 'FF8B4513', paleturquoise: 'FFAFEEEE', mistyrose: 'FFFFE4E1',
  indigo: 'FF4B0082',
};

function textColor(background) {
  const hex = background.slice(2);
  const channels = [0, 2, 4].map(at => parseInt(hex.slice(at, at + 2), 16) / 255)
    .map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2] > 0.179
    ? 'FF000000' : 'FFFFFFFF';
}

function richValue(runs, fontName, prefix = '') {
  const values = [];
  if (prefix) values.push({ text: prefix, bold: false, italic: false });
  values.push(...(runs || []));
  if (!values.length) return '';
  if (values.length === 1 && !values[0].bold && !values[0].italic
      && !values[0].strike && !values[0].code && !values[0].link) return values[0].text || '';
  return { richText: values.map(run => ({
    text: String(run.text || ''),
    font: {
      name: run.code ? 'Courier New' : fontName,
      size: 10,
      bold: !!run.bold,
      italic: !!run.italic,
      strike: !!run.strike,
      underline: run.link ? true : undefined,
      color: run.link ? { argb: 'FF0563C1' } : undefined,
    },
  })) };
}

function blockRuns(block) {
  const prefix = block.type === 'bullet' ? '• '
    : block.type === 'ordered' ? `${block.index}. ` : block.quote ? '> ' : '';
  return { prefix: `${'    '.repeat(block.level || 0)}${prefix}`, runs: block.runs || [] };
}

async function renderCardDocumentExcel(ws, workbook, startRow, document, options = {}) {
  const fontName = options.fontName || 'Arial';
  let row = startRow;
  let section = '';
  const pageBreakRows = [];
  const merge = (value, style = {}) => {
    ws.mergeCells(`A${row}:F${row}`);
    const cell = ws.getCell(`A${row}`);
    cell.value = value;
    cell.font = { name: fontName, size: 10, ...(style.font || {}) };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true,
      ...(style.alignment || {}) };
    if (style.fill) cell.fill = style.fill;
    if (style.border) cell.border = style.border;
    ws.getRow(row).height = style.height || 20;
    row += 1;
  };
  const label = (ref, value) => {
    const cell = ws.getCell(ref);
    cell.value = `${value}:`;
    cell.font = { name: fontName, size: 10, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    cell.border = THIN;
  };
  const value = (ref, content) => {
    const cell = ws.getCell(ref);
    cell.value = content;
    cell.font = { name: fontName, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = THIN;
  };

  for (const block of document || []) {
    if (block.type === 'title') {
      merge(richValue(block.runs, fontName), { font: { size: 16, bold: true }, height: 40 });
      continue;
    }
    if (block.type === 'section') {
      section = block.key || '';
      if (row > startRow + 14) pageBreakRows.push(row - 1);
      merge(block.title || '', { font: { size: 11, bold: true }, fill: GRAY,
        border: MEDIUM, height: 22, alignment: { wrapText: false } });
      continue;
    }
    if (block.type === 'meta') {
      if (block.labelDetails && block.labelDetails.length) {
        const ordinaryPairs = (block.pairs || [])
          .filter(pair => pair[0] !== block.labelTitle);
        if (ordinaryPairs.length) {
          const ordinaryColumns = [['A', 'B'], ['C', 'D'], ['E', 'F']];
          ordinaryPairs.forEach((pair, index) => {
            label(`${ordinaryColumns[index][0]}${row}`, pair[0]);
            value(`${ordinaryColumns[index][1]}${row}`, pair[1]);
          });
          ws.getRow(row).height = 20;
          row += 1;
        }
        const columns = ['B', 'C', 'D', 'E', 'F'];
        for (let offset = 0; offset < block.labelDetails.length; offset += columns.length) {
          const labels = block.labelDetails.slice(offset, offset + columns.length);
          label(`A${row}`, offset === 0 ? (block.labelTitle || 'Labels') : '');
          labels.forEach((entry, index) => {
            const cell = ws.getCell(`${columns[index]}${row}`);
            const background = LABEL_COLORS[entry.color] || 'FFC0C0C0';
            cell.value = entry.name || '';
            cell.font = { name: fontName, size: 10, bold: true,
              color: { argb: textColor(background) } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: background } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = THIN;
          });
          columns.slice(labels.length).forEach(column => {
            ws.getCell(`${column}${row}`).border = THIN;
          });
          ws.getRow(row).height = 20;
          row += 1;
        }
        continue;
      }
      const columns = [['A', 'B'], ['C', 'D'], ['E', 'F']];
      (block.pairs || []).slice(0, 3).forEach((pair, index) => {
        label(`${columns[index][0]}${row}`, pair[0]);
        value(`${columns[index][1]}${row}`, pair[1]);
      });
      ws.getRow(row).height = 20; row += 1;
      continue;
    }
    if (block.type === 'text') {
      for (const markdownBlock of block.blocks || []) {
        const mapped = blockRuns(markdownBlock);
        merge(richValue(mapped.runs, fontName, mapped.prefix), {
          font: markdownBlock.type === 'heading' ? { bold: true } : {},
          border: THIN,
        });
      }
      continue;
    }
    if (block.type === 'note') {
      merge(richValue(block.runs, fontName), { font: { bold: true }, border: THIN });
      if (block.progress) {
        const total = Math.max(0, Number(block.progress.total) || 0);
        const done = Math.max(0, Math.min(total, Number(block.progress.done) || 0));
        const filled = total ? Math.round(done / total * 6) : 0;
        for (let index = 0; index < 6; index += 1) {
          const cell = ws.getCell(`${String.fromCharCode(65 + index)}${row}`);
          cell.value = index === 0 ? `${done}/${total}` : '';
          cell.border = THIN;
          if (index < filled) cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: `FF${options.progressColor || '2980B9'}` },
          };
        }
        ws.getRow(row).height = 12;
        row += 1;
      }
      continue;
    }
    if (block.type === 'list') {
      if (section === 'attachments' && (block.items || []).some(item => item.attachment)) {
        const headings = options.attachmentHeadings || ['#', 'Name', 'Size', 'Type', 'Uploaded', 'Uploader'];
        headings.forEach((heading, index) => {
          const cell = ws.getCell(`${String.fromCharCode(65 + index)}${row}`);
          cell.value = heading; cell.font = { name: fontName, size: 9, bold: true };
          cell.fill = GRAY; cell.border = THIN;
        });
        row += 1;
        (block.items || []).forEach((item, index) => {
          const attachment = item.attachment || {};
          const cells = [index + 1, attachment.name || '', attachment.size || '',
            attachment.type || '', attachment.uploaded || '', attachment.uploader || ''];
          cells.forEach((content, cellIndex) => {
            const cell = ws.getCell(`${String.fromCharCode(65 + cellIndex)}${row}`);
            cell.value = content; cell.font = { name: fontName, size: 9 };
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            cell.border = THIN;
          });
          row += 1;
        });
      } else {
        for (const item of block.items || []) {
          merge(richValue(item.runs, fontName,
            `${'    '.repeat(item.level || 0)}${item.marker || '-'} `), { border: THIN });
        }
      }
      continue;
    }
    if (block.type === 'rows') {
      for (const cells of block.rows || []) {
        ws.mergeCells(`A${row}:B${row}`); ws.mergeCells(`C${row}:F${row}`);
        value(`A${row}`, richValue(cells[0], fontName));
        value(`C${row}`, richValue(cells[1], fontName));
        row += 1;
      }
      continue;
    }
    if (block.type === 'images') {
      const images = (block.images || [])
        .filter(image => image.data && ['jpeg', 'png', 'gif', 'bmp'].includes(image.ext));
      for (let offset = 0; offset < images.length; offset += 6) {
        const imageRow = images.slice(offset, offset + 6);
        ws.getRow(row).height = 95;
        imageRow.forEach((image, index) => {
          try {
            const imageId = workbook.addImage({ buffer: image.data, extension: image.ext });
            ws.addImage(imageId, {
              tl: { col: index, row: row - 1 }, ext: { width: 105, height: 115 },
            });
          } catch (error) {
            ws.getCell(`${String.fromCharCode(65 + index)}${row}`).value = image.name || '';
          }
        });
        row += 1;
        imageRow.forEach((image, index) => {
          const column = String.fromCharCode(65 + index);
          const cell = ws.getCell(`${column}${row}`);
          cell.value = image.name || '';
          cell.font = { name: fontName, size: 8 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        ws.getRow(row).height = 16;
        row += 1;
      }
    }
  }
  return { row, pageBreakRows };
}

export { renderCardDocumentExcel };
