import { Meteor } from 'meteor/meteor';
import fs from 'fs';

// SVG sanitization for uploaded files.
//
// SVG is XML and can carry active content: <script> elements, inline event
// handlers (onload=, onclick=, ...), javascript:/vbscript: URIs, HTML embedded
// via <foreignObject>/<iframe>/<object>/<embed>, and XML DOCTYPE/ENTITY
// declarations that enable entity-expansion ("billion laughs" / XML loop) and
// external-entity (XXE) attacks.
//
// Rather than rejecting such files we strip the dangerous constructs so the
// image still uploads but cannot execute script or expand entities. The set of
// constructs removed here is kept in sync with the detection patterns in
// models/fileValidation.js (containsJsOrXmlBombs), so a sanitized file passes
// validation afterwards.
//
// This is a string/regex sanitizer (the server has no DOM, so DOMPurify is not
// available without jsdom). It is intentionally aggressive — when in doubt it
// removes content.

// Active-content elements that can run JavaScript or load remote/HTML content.
const DANGEROUS_ELEMENTS = [
  'script',
  'foreignObject',
  'iframe',
  'object',
  'embed',
  'handler',
  'set',
  'animate',
  'animateTransform',
  'animateMotion',
];

export function sanitizeSvgContent(svg) {
  if (typeof svg !== 'string' || svg.length === 0) {
    return { content: svg, changed: false };
  }

  let out = svg;

  // XML loops / XXE: remove DOCTYPE (including any internal DTD subset with
  // <!ENTITY ...> definitions) and any stray ENTITY declarations.
  out = out.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  out = out.replace(/<!ENTITY[\s\S]*?>/gi, '');

  // Remove <?xml-stylesheet ...?> processing instructions (keep the leading
  // <?xml ...?> declaration, which is harmless).
  out = out.replace(/<\?xml-stylesheet[\s\S]*?\?>/gi, '');

  // Remove dangerous elements, both paired (<tag>...</tag>) and self-closing.
  for (const tag of DANGEROUS_ELEMENTS) {
    out = out.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '');
    out = out.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  }

  // Remove <meta http-equiv="refresh" ...> redirects.
  out = out.replace(/<meta\b[^>]*http-equiv\s*=\s*['"]?\s*refresh[^>]*>/gi, '');

  // Strip inline event-handler attributes (onload=, onclick=, onmouseover=, ...).
  out = out.replace(/\son[a-z][a-z0-9_-]*\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\son[a-z][a-z0-9_-]*\s*=\s*'[^']*'/gi, '');
  out = out.replace(/\son[a-z][a-z0-9_-]*\s*=\s*[^\s>]+/gi, '');

  // Neutralize javascript:/vbscript: URIs (in href, xlink:href, style url(), ...).
  out = out.replace(/(javascript|vbscript)\s*:/gi, 'removed:');

  return { content: out, changed: out !== svg };
}

// Returns true when a file looks like an SVG (by MIME type or .svg extension).
export function isSvgFile(mimeType, fileName) {
  const mime = (mimeType || '').toLowerCase();
  if (mime === 'image/svg+xml' || mime === 'image/svg') {
    return true;
  }
  return /\.svg$/i.test(fileName || '');
}

// Sanitize an SVG file in place. Returns the new byte size when the file was
// rewritten, or null when nothing changed / the file could not be processed.
export function sanitizeSvgFileSync(filePath) {
  if (!Meteor.isServer || !filePath) {
    return null;
  }
  try {
    const original = fs.readFileSync(filePath, 'utf8');
    const { content, changed } = sanitizeSvgContent(original);
    if (!changed) {
      return null;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return Buffer.byteLength(content, 'utf8');
  } catch (error) {
    console.error('[sanitizeSvgFileSync] failed to sanitize', filePath, error);
    return null;
  }
}
