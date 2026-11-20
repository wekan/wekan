// Server-only: the rows of a CSV/TSV file uploaded to the local disk
// (server/lib/importUpload.js), parsed as the page parses a pasted text
// (client/components/import/csvMapping.js parseCsvImportText): a first line
// with a tab means tab-separated.
import { csvSeparatorOf } from '/models/lib/csvImportMapping';

const MAX_TEXT_BYTES = 256 * 1024 * 1024;

export async function readCsvUploadRows(file) {
  const fs = require('fs');
  const { size } = await fs.promises.stat(file);
  if (size > MAX_TEXT_BYTES) {
    const error = new Error(`A CSV file is read as one text, at most ${MAX_TEXT_BYTES} bytes`);
    error.code = 'import-too-large';
    throw error;
  }
  const text = (await fs.promises.readFile(file, 'utf8')).replace(/^\uFEFF/, '');
  const result = require('papaparse').parse(text, { delimiter: csvSeparatorOf(text), skipEmptyLines: 'greedy' });
  return result && Array.isArray(result.data) ? result.data : [];
}
