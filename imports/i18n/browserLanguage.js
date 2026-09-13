// Browser BCP 47 tags mapped to WeKan's historical locale identifiers.
const aliases = {
  vep: 've-PP', vec: 've-CC', vls: 'vl-SS', war: 'wa-RR',
  'es-419': 'es-LA', 'be-by': 'be-BE', 'ca-valencia': 'ca-valencia',
  'uz-arab': 'uz-AR', 'uz-latn': 'uz-LA', iw: 'he', ji: 'yi', in: 'id',
  no: 'nb', yue: 'yue_CN', wuu: 'wuu-Hans', 'zh-mo': 'zh-Hant',
};
function matchBrowserLanguage(value, resolveTag) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const original = resolveTag(value.trim());
  if (original) return original;
  let candidate = value.trim().replace(/_/g, '-');
  while (candidate) {
    const exact = resolveTag(candidate);
    if (exact) return exact;
    const mapped = aliases[candidate.toLowerCase()];
    if (mapped && resolveTag(mapped)) return resolveTag(mapped);
    const cut = candidate.lastIndexOf('-');
    candidate = cut > 0 ? candidate.slice(0, cut) : '';
  }
  return undefined;
}
function preferredLanguage(profileLanguage, navigatorInfo, resolveTag) {
  const saved = matchBrowserLanguage(profileLanguage, resolveTag);
  if (saved) return saved;
  const browserLanguages = Array.isArray(navigatorInfo.languages) ? navigatorInfo.languages : [];
  for (const language of [...browserLanguages, navigatorInfo.language, navigatorInfo.userLanguage]) {
    const supported = matchBrowserLanguage(language, resolveTag);
    if (supported) return supported;
  }
  return resolveTag('en') || 'en';
}
module.exports = { matchBrowserLanguage, preferredLanguage };
