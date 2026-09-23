// Shared by all new-item composers. Blank lines never create empty items.
export function splitTitleLines(value) {
  return String(value || '').split(/\r\n?|\n/).map(line => line.trim()).filter(Boolean);
}

export function creationTitles(value, separate = false) {
  const title = String(value || '').replace(/\r\n?/g, '\n').trim();
  return separate ? splitTitleLines(title) : (title ? [title] : []);
}

// Reserve an ordered range without crossing either neighbouring item.
export function titleSortIndexes(previous, next, count) {
  if (!count) return [];
  if (previous == null && next == null) return Array.from({ length: count }, (_, i) => i);
  if (previous == null) return Array.from({ length: count }, (_, i) => next - count + i);
  if (next == null) return Array.from({ length: count }, (_, i) => previous + i + 1);
  return Array.from({ length: count }, (_, i) => previous + (next - previous) * (i + 1) / (count + 1));
}
