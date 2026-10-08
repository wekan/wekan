// Percent-encoded URL octets (for example Arabic %D8%B9) are URL data,
// not printf substitutions. Strip them only within HTTP(S) URL spans.
// Keep real placeholders both in URLs and in surrounding translated prose.
export function translationTokens(value) {
  if (typeof value !== 'string') return [];
  const text = value.replace(/https?:\/\/[^\s<>"']+/g,
    url => url.replace(/%[0-9a-f]{2}/gi, ''));
  // Include non-Latin names: an extra translated token must not disappear from
  // the inventory merely because its spelling is outside the ASCII alphabet.
  return (text.match(/__[^\s]+?__|%\{[^}]+\}|%%|%(?:\d+\$)?[A-Za-z]|%\d+/gu) || []).sort();
}
