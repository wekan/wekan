'use strict';

// Admin Panel / Settings / Layout / Custom head meta tags (#4042): what of
// the stored text is written into every page's <head>.
//
// The field was saved and published but never rendered: only the link tags
// and the manifest were injected (server/lib/customHeadRender.js). It is
// rendered now, and as META TAGS ONLY - the use the field is named for
// (description, Open Graph and Twitter card tags, theme-color, verification
// tokens). Anything else in the text is dropped: a <script>, a <style>, a
// second <title>. So are the two http-equiv values that act on every visitor
// rather than describe the page: `refresh` redirects them and `set-cookie`
// writes their cookies.
//
// Pure: tested by tests/customHeadMetaTags.test.cjs.
const META = /<meta\b[^<>]*>/gi;
const ACTIVE = /\bhttp-equiv\s*=\s*["']?\s*(refresh|set-cookie)\b/i;
const MAX_TAGS = 100;

function safeMetaTags(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  return (text.match(META) || [])
    .filter(tag => !ACTIVE.test(tag))
    // A tag must end where it says it ends: no attribute may smuggle a "<".
    .filter(tag => !/<[^<>]*</.test(tag.slice(1)))
    .slice(0, MAX_TAGS);
}

module.exports = { safeMetaTags };
