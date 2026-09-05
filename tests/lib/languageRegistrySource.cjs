'use strict';

// Parse the deliberately line-oriented language registry without regular
// expressions. This stays linear for arbitrarily long native language names.
function linesBetween(source, opening, closing) {
  const lines = source.split('\n');
  const start = lines.findIndex(line => line.trim() === opening);
  if (start < 0) throw new Error(`Missing ${opening}`);
  const end = lines.findIndex((line, index) =>
    index > start && line.trim() === closing);
  if (end < 0) throw new Error(`Missing ${closing} after ${opening}`);
  return lines.slice(start + 1, end);
}

function parseLanguageMetadata(source) {
  return linesBetween(source, 'const languageMetadata = [', '];')
    .filter(line => line.trim())
    .map(line => {
      const row = line.trim();
      if (!row.startsWith('[') || !row.endsWith('],')) {
        throw new Error(`Invalid language metadata row: ${row}`);
      }
      const values = JSON.parse(row.slice(0, -1));
      if (values.length !== 5 || typeof values[4] !== 'boolean') {
        throw new Error(`Invalid language metadata values: ${row}`);
      }
      return values;
    });
}

function parseLanguageLoaders(source) {
  const prefix = '() => import("./data/';
  const suffix = '.i18n.json"),';
  return linesBetween(source, 'const languageLoaders = {', '};')
    .filter(line => line.trim())
    .map(line => {
      const row = line.trim();
      const separator = row.indexOf(': ');
      if (separator < 0 || !row.endsWith(suffix)) {
        throw new Error(`Invalid language loader row: ${row}`);
      }
      const key = JSON.parse(row.slice(0, separator));
      const loader = row.slice(separator + 2);
      if (!loader.startsWith(prefix)) {
        throw new Error(`Invalid language loader: ${row}`);
      }
      return [key, loader.slice(prefix.length, -suffix.length)];
    });
}

module.exports = { parseLanguageMetadata, parseLanguageLoaders };
