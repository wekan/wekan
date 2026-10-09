// A Markdown link written from text an import file supplies. Plain
// JavaScript, so the importers' Node tests run it.
//
// The title escapes backslash as well as [ and ]: escaping only the brackets
// left a title ending in "\" free to escape the closing bracket, so the title
// ran on into the link. The destination percent-encodes everything that ends
// it or breaks it - ( ) < > \, whitespace and control characters.
// encodeURIComponent was used for that before, and it leaves ( and ) as they
// are, so a ")" in a URL still closed the link early. The caller still decides
// which schemes may be linked at all.

const pct = c => {
  const code = c.charCodeAt(0);
  return code < 128 ? `%${code.toString(16).toUpperCase().padStart(2, '0')}` : encodeURIComponent(c);
};

export function markdownLinkTitle(text) {
  return String(text == null ? '' : text).replace(/[\\[\]]/g, '\\$&');
}

export function markdownLinkUrl(url) {
  return String(url == null ? '' : url).replace(/[()<>\\\s\u0000-\u001f\u007f]/gu, pct);
}

export function markdownLink(title, url) {
  return `[${markdownLinkTitle(title)}](${markdownLinkUrl(url)})`;
}
