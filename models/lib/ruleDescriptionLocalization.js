// Rule trigger/action descriptions predate locale-independent descriptors and
// are stored as rendered UI prose. Consequently a rule created while English
// was selected still contains English after its reader switches to Finnish.
// Localize that legacy prose at display time from the same r-* strings the rule
// builder uses; do not rewrite the rule, its parameters or its export format.

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function caseLikeMatch(translated, matched) {
  if (!translated || !matched) return translated;
  const firstLetter = matched.match(/\p{L}/u);
  if (!firstLetter || firstLetter[0] !== firstLetter[0].toLowerCase()) {
    return translated;
  }
  const at = translated.search(/\p{L}/u);
  if (at < 0) return translated;
  return translated.slice(0, at) + translated[at].toLowerCase()
    + translated.slice(at + 1);
}

export function localizeStoredRuleDescription(description, translations) {
  if (typeof description !== 'string' || !description.trim()) return '';
  if (!Array.isArray(translations)) return description;

  // Longer builder phrases must win over their component words. For example,
  // "Move card to top of its list" has its own natural translation and must
  // not be assembled from "Move card to", "Top of" and "its list".
  const bySource = new Map();
  for (const entry of translations) {
    const source = typeof entry?.source === 'string' ? entry.source.trim() : '';
    const translated = typeof entry?.translated === 'string'
      ? entry.translated.trim()
      : '';
    if (!source || !translated || source === translated) continue;
    // Some short English fragments are intentionally repeated. The generic
    // rule-builder fragments occur later in the canonical file than specialist
    // controls (for example `r-by` after `r-sort-by`), so let those win when
    // translating an assembled stored description.
    bySource.set(source.toLocaleLowerCase(), { source, translated });
  }
  const entries = [...bySource.values()]
    .sort((a, b) => b.source.length - a.source.length);

  const trimmed = description.trim();
  const whole = bySource.get(trimmed.toLocaleLowerCase());
  if (whole) return caseLikeMatch(whole.translated, trimmed);

  let result = description;
  for (const { source, translated } of entries) {
    // Unicode letter/number boundaries keep a short builder word such as
    // "by" out of a username or list name. Capturing the leading delimiter
    // avoids lookbehind, retaining compatibility with older client engines.
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}])(${escapeRegExp(source)})(?=$|[^\\p{L}\\p{N}])`,
      'giu',
    );
    result = result.replace(pattern, (all, before, matched) =>
      `${before}${caseLikeMatch(translated, matched)}`);
  }
  return result;
}

export function localizedStoredRuleDescription(description, translate, sources) {
  const translations = Object.entries(sources || {}).map(([key, source]) => ({
    source,
    translated: typeof translate === 'function' ? translate(key) : source,
  }));
  const localized = localizeStoredRuleDescription(description, translations);
  return localized
    ? localized.charAt(0).toUpperCase() + localized.slice(1)
    : '';
}
