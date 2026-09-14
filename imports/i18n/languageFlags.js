export function languageFlags(tag) {
  const flagMap = {
    'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹', 'pt': '🇵🇹', 'ru': '🇷🇺',
    'ja': '🇯🇵', 'ko': '🇰🇷', 'zh': '🇨🇳', 'ar': '🇸🇦', 'hi': '🇮🇳', 'th': '🇹🇭', 'vi': '🇻🇳',
    'tr': '🇹🇷', 'pl': '🇵🇱', 'nl': '🇳🇱', 'sv': '🇸🇪', 'da': '🇩🇰', 'no': '🇳🇴', 'fi': '🇫🇮',
    'cs': '🇨🇿', 'hu': '🇭🇺', 'ro': '🇷🇴', 'bg': '🇧🇬', 'hr': '🇭🇷', 'sk': '🇸🇰', 'sl': '🇸🇮',
    'et': '🇪🇪', 'lv': '🇱🇻', 'lt': '🇱🇹', 'el': '🇬🇷', 'he': '🇮🇱', 'uk': '🇺🇦', 'be': '🇧🇾',
    'ca': '🇪🇸', 'eu': '🇪🇸', 'gl': '🇪🇸', 'cy': '🇬🇧', 'ga': '🇮🇪', 'mt': '🇲🇹', 'is': '🇮🇸',
    'mk': '🇲🇰', 'sq': '🇦🇱', 'sr': '🇷🇸', 'bs': '🇧🇦', 'me': '🇲🇪', 'fa': '🇮🇷', 'ur': '🇵🇰',
    'bn': '🇧🇩', 'ta': '🇮🇳', 'te': '🇮🇳', 'ml': '🇮🇳', 'kn': '🇮🇳', 'gu': '🇮🇳', 'pa': '🇮🇳',
    'mr': '🇮🇳', 'or': '🇮🇳', 'as': '🇮🇳', 'ne': '🇳🇵', 'si': '🇱🇰', 'my': '🇲🇲', 'km': '🇰🇭', 'lo': '🇱🇦',
    'ka': '🇬🇪', 'hy': '🇦🇲', 'az': '🇦🇿', 'kk': '🇰🇿', 'ky': '🇰🇬', 'uz': '🇺🇿', 'mn': '🇲🇳',
    'bo': '🇨🇳', 'dz': '🇧🇹', 'ug': '🇨🇳', 'ii': '🇨🇳', 'za': '🇨🇳', 'yue': '🇭🇰', 'zh-HK': '🇭🇰',
    'zh-TW': '🇹🇼', 'zh-CN': '🇨🇳', 'id': '🇮🇩', 'ms': '🇲🇾', 'tl': '🇵🇭', 'ceb': '🇵🇭',
    'haw': '🇺🇸', 'mi': '🇳🇿', 'sm': '🇼🇸', 'to': '🇹🇴', 'fj': '🇫🇯', 'ty': '🇵🇫', 'mg': '🇲🇬',
    'sw': '🇹🇿', 'am': '🇪🇹', 'om': '🇪🇹', 'so': '🇸🇴', 'ti': '🇪🇷', 'ha': '🇳🇬', 'yo': '🇳🇬',
    'ig': '🇳🇬', 'zu': '🇿🇦', 'xh': '🇿🇦', 'af': '🇿🇦', 'st': '🇿🇦', 'tn': '🇿🇦', 'ss': '🇿🇦',
    've': '🇿🇦', 'ts': '🇿🇦', 'nr': '🇿🇦', 'nso': '🇿🇦', 'wo': '🇸🇳', 'ff': '🇸🇳', 'dy': '🇲🇱',
    'bm': '🇲🇱', 'tw': '🇬🇭', 'ak': '🇬🇭', 'lg': '🇺🇬', 'rw': '🇷🇼', 'rn': '🇧🇮', 'ny': '🇲🇼',
    'sn': '🇿🇼', 'nd': '🇿🇼',
    'ace': '🇮🇩', 'ary': '🇲🇦', 'ast': '🇪🇸', 'br': '🇫🇷', 'cmn': '🇨🇳', 'fy': '🇳🇱', 'nb': '🇳🇴', 'oc': '🇫🇷', 'tk': '🇹🇲', 'vl': '🇧🇪', 'wa': '🇧🇪', 'wuu': '🇨🇳', 'yi': '🇮🇱', 'zgh': '🇲🇦',
    'jv': '🇮🇩', 'ps': '🇦🇫', 'lb': '🇱🇺', 'tg': '🇹🇯', 'la': '🇻🇦',
    'tt': '🇷🇺',
    'ku': '🇮🇶', 'sd': '🇵🇰',
    'ee': '🇬🇭', 'ba': '🇷🇺', 'cv': '🇷🇺', 'sah': '🇷🇺',
    'qu': '🇵🇪', 'gn': '🇵🇾', 'ay': '🇧🇴', 'fo': '🇫🇴', 'se': '🇳🇴', 'gd': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'kw': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'gv': '🇮🇲',
    'ht': '🇭🇹', 'pap': '🇨🇼', 'tpi': '🇵🇬', 'bi': '🇻🇺', 'co': '🇫🇷', 'sc': '🇮🇹', 'scn': '🇮🇹', 'nap': '🇮🇹', 'fur': '🇮🇹', 'rm': '🇨🇭', 'hsb': '🇩🇪',
    'kl': '🇬🇱', 'iu': '🇨🇦', 'chr': '🇺🇸', 'nah': '🇲🇽', 'bua': '🇷🇺', 'csb': '🇵🇱', 'szl': '🇵🇱', 'an': '🇪🇸', 'lld': '🇮🇹', 'rup': '🇬🇷',
    'mai': '🇮🇳', 'bho': '🇮🇳', 'kok': '🇮🇳', 'ks': '🇮🇳', 'ckb': '🇮🇶', 'tig': '🇪🇷', 'wal': '🇪🇹'
  };
  // These legacy locale prefixes name different languages, not Venda/Walloon.
  const languageOverrides = { 've-CC': '🇮🇹', 've-PP': '🇷🇺', 'wa-RR': '🇵🇭' };
  const base = tag.split(/[-_@]/)[0];
  const language = languageOverrides[tag] || flagMap[base] || '🌐';
  if (!/[-_@]/.test(tag)) return { language, country: '' };
  const countryOverrides = {
    'be-BE': '🇧🇾', 've-CC': '🇮🇹', 've-PP': '🇷🇺', 'vl-SS': '🇧🇪',
    'wa-RR': '🇵🇭', 'es-LA': '🌐', 'zh-GB': '🇨🇳', 'en-YS': '🌐',
    'az-LA': '🇦🇿', 'uz-LA': '🇺🇿', 'uz-AR': '🇺🇿',
  };
  const countries = new Set('ZA AU DZ EG AZ ES CZ GB AT CH DE GR BR IT MY AR CL CO MX PE PY EE IR BE CA NL IN IL JP KH KR PT RO RU SI UA UZ VN CN HK SG TW ID TR TM'.split(' '));
  const suffix = tag.split(/[-_@]/)[1];
  const country = countryOverrides[tag] || (countries.has(suffix)
    ? String.fromCodePoint(...[...suffix].map(letter => 0x1f1e6 + letter.charCodeAt(0) - 65))
    : language);
  return { language, country };
}

export function languageLabelParts(name, country) {
  if (!country) return { languageName: name, regionName: '' };
  const parentheses = name.match(/^(.*?)\s*[（(]([^（）()]+)[）)]$/);
  if (parentheses) return { languageName: parentheses[1].trim(), regionName: parentheses[2] };
  const regional = name.match(/^(Español|Português) (?:en|de|do) (.+)$/);
  if (regional) return { languageName: regional[1], regionName: regional[2] };
  // Preserve complete native legacy/script names without inventing a region name.
  return { languageName: name, regionName: '' };
}
