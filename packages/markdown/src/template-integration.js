import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import * as markdownItEmoji from 'markdown-it-emoji';
import markdownItMath from 'markdown-it-math/no-default-renderer';
import temml from 'temml';
import { getSecureDOMPurifyConfig } from './secureDOMPurify';
import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

const Markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

// Admin Panel / Features / Security bridge. This package cannot import app code,
// so app code (client/components/main/editor.js) keeps this reactive flag in sync
// with the `alwaysShowCodeAsText` setting. When true, the markdown helper never
// renders markdown/HTML: it shows the entire raw source as escaped plain text, so
// hidden links, HTML comments (<!-- -->), JavaScript and any other code are always
// visible, not clickable, and not running.
Markdown.alwaysShowCodeAsText = new ReactiveVar(false);

// Escape every HTML-significant character so the raw source is shown literally.
// DOMPurify alone is not enough here: it would strip tags like <script> rather
// than display them, which would hide code instead of revealing it.
function escapeHtmlSource(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Exposed on the exported Markdown object so the "always show code as plain text"
// escaper can be unit-tested (see client/lib/tests/alwaysShowCodeAsText.tests.js).
Markdown.escapeHtmlSource = escapeHtmlSource;

//import markdownItMermaid from "@wekanteam/markdown-it-mermaid";

// Static URL Scheme Listing
var urlschemes = [
  "aodroplink",
  "thunderlink",
  "cbthunderlink",
  "onenote",
  "file",
  "abasurl",
  "conisio",
  "mailspring"
];



// Better would be a field in the admin backend to set this dynamically
// instead of putting all known or wanted url schemes here hard into code
// but i was not able to access those settings
// var urlschemes = currentSetting.automaticLinkedUrlSchemes.split('\n');



// put all url schemes into the linkify configuration to automatically make it clickable
for(var i=0; i<urlschemes.length;i++){
  Markdown.linkify.add(urlschemes[i]+":",'http:');
}

const emojiPlugin = markdownItEmoji.full || markdownItEmoji.default || markdownItEmoji;
if (emojiPlugin) {
  Markdown.use(emojiPlugin);
}

// LaTeX math support. Renders $...$ (inline) and $$...$$ (block) to native
// MathML using Temml, which browsers display without any client-side rendering
// engine. Migrated from markdown-it-mathjax3 (which bundled all of MathJax and
// had a double-render bug); MathML rendering had been silently dropped in commit
// 63ce45c53 during the Meteor 3 refactor. The emitted MathML is whitelisted in
// secureDOMPurify.js so DOMPurify does not strip it.
// We use the markdown-it-math `no-default-renderer` entrypoint and call Temml
// ourselves, instead of the `markdown-it-math/temml` entrypoint, to avoid a
// top-level `await import("temml")` that the Meteor/rspack bundler dislikes.
// Docs: https://github.com/wekan/wekan/blob/main/docs/Features/LaTeX.md
const renderMath = (src, displayMode) => {
  try {
    return temml.renderToString(src, { throwOnError: false, errorColor: '#cc0000', displayMode });
  } catch (e) {
    // Never let one malformed formula break the whole markdown render.
    return src;
  }
};
Markdown.use(markdownItMath, {
  inlineRenderer: (src) => renderMath(src, false),
  blockRenderer: (src) => renderMath(src, true),
});

// Custom plugin to prevent SVG-based DoS attacks
Markdown.use(function(md) {
  // Filter out dangerous SVG content in markdown
  md.core.ruler.push('svg-dos-protection', function(state) {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Check for image tokens that might contain SVG
      if (token.type === 'image') {
        const src = token.attrGet('src');
        if (src) {
          // Block SVG data URIs and .svg files
          if (src.startsWith('data:image/svg') || src.endsWith('.svg')) {
            if (process.env.DEBUG === 'true') {
              console.warn('Blocked potentially malicious SVG image in markdown:', src);
            }
            // Replace with a warning message
            token.type = 'paragraph_open';
            token.tag = 'p';
            token.nesting = 1;
            token.attrSet('style', 'color: red; background: #ffe6e6; padding: 8px; border: 1px solid #ff9999;');
            token.attrSet('title', 'Blocked potentially malicious SVG image');

            // Add warning text token
            const warningToken = {
              type: 'text',
              content: '⚠️ Blocked potentially malicious SVG image for security reasons',
              level: token.level,
              markup: '',
              info: '',
              meta: null,
              block: true,
              hidden: false
            };

            // Insert warning token after the paragraph open
            tokens.splice(i + 1, 0, warningToken);

            // Add paragraph close token
            const closeToken = {
              type: 'paragraph_close',
              tag: 'p',
              nesting: -1,
              level: token.level,
              markup: '',
              info: '',
              meta: null,
              block: true,
              hidden: false
            };
            tokens.splice(i + 2, 0, closeToken);

            // Remove the original image token
            tokens.splice(i, 1);
            i--; // Adjust index since we removed a token
          }
        }
      }

      // Check for HTML tokens that might contain SVG or malicious content
      if (token.type === 'html_block' || token.type === 'html_inline') {
        const content = token.content;
        if (content) {
          // Check for SVG content
          const hasSVG = content.includes('<svg') ||
                        content.includes('data:image/svg') ||
                        content.includes('xlink:href') ||
                        content.includes('<use') ||
                        content.includes('<defs>');
          
          // Check for malicious img tags with SVG data URIs
          const hasMaliciousImg = content.includes('<img') && 
                                 (content.includes('data:image/svg') || 
                                  content.includes('src="data:image/svg'));
          
          // Check for base64 encoded SVG with script tags
          const hasBase64SVG = content.includes('data:image/svg+xml;base64,');
          
          if (hasSVG || hasMaliciousImg || hasBase64SVG) {
            if (process.env.DEBUG === 'true') {
              console.warn('Blocked potentially malicious SVG content in HTML:', content.substring(0, 100) + '...');
            }
            
            // Additional check for base64 encoded SVG with script tags
            if (hasBase64SVG) {
              try {
                const base64Match = content.match(/data:image\/svg\+xml;base64,([^"'\s]+)/);
                if (base64Match) {
                  const decodedContent = atob(base64Match[1]);
                  if (decodedContent.includes('<script') || decodedContent.includes('javascript:')) {
                    if (process.env.DEBUG === 'true') {
                      console.warn('Blocked SVG with embedded JavaScript in markdown');
                    }
                  }
                }
              } catch (e) {
                // If decoding fails, continue with blocking
              }
            }
            
            // Replace with warning
            token.type = 'paragraph_open';
            token.tag = 'p';
            token.nesting = 1;
            token.attrSet('style', 'color: red; background: #ffe6e6; padding: 8px; border: 1px solid #ff9999;');
            token.attrSet('title', 'Blocked potentially malicious SVG content');

            // Add warning text
            const warningToken = {
              type: 'text',
              content: '⚠️ Blocked potentially malicious SVG content for security reasons',
              level: token.level,
              markup: '',
              info: '',
              meta: null,
              block: true,
              hidden: false
            };

            // Insert warning token after the paragraph open
            tokens.splice(i + 1, 0, warningToken);

            // Add paragraph close token
            const closeToken = {
              type: 'paragraph_close',
              tag: 'p',
              nesting: -1,
              level: token.level,
              markup: '',
              info: '',
              meta: null,
              block: true,
              hidden: false
            };
            tokens.splice(i + 2, 0, closeToken);

            // Remove the original HTML token
            tokens.splice(i, 1);
            i--; // Adjust index since we removed a token
          }
        }
      }
    }
  });
});

// Try to fix Mermaid Diagram error: Maximum call stack size exceeded.
// Added bigger text size for Diagram.
// https://github.com/wekan/wekan/issues/4251
// https://stackoverflow.com/questions/66825888/maximum-text-size-in-diagram-exceeded-mermaid-js
// https://github.com/mermaid-js/mermaid/blob/74b1219d62dd76d98d60abeeb36d4520f64faceb/src/defaultConfig.js#L39
// https://github.com/wekan/cli-table3
// https://www.npmjs.com/package/@wekanteam/markdown-it-mermaid
// https://github.com/wekan/markdown-it-mermaid
//Markdown.use(markdownItMermaid,{
//  maxTextSize: 200000,
//});

Blaze.Template.registerHelper('markdown', new Template('markdown', function () {
  const self = this;
  let text = '';
  if (self.templateContentBlock) {
    text = Blaze._toText(self.templateContentBlock, HTML.TEXTMODE.STRING);
  }
  // Admin Panel / Features / Security: "show all code as plain text" forces the
  // raw-source view for ALL content, not only for hidden markdown links.
  const forceRawSource = Markdown.alwaysShowCodeAsText.get();
  const hasHiddenLink = text.includes("[]");
  if (forceRawSource || hasHiddenLink) {
    // Prevent hiding info: https://wekan.github.io/hall-of-fame/invisiblebleed/
    // Do not render markdown/HTML; show the whole source as escaped preformatted
    // text so every tag, HTML comment (<!-- -->), link and any other code is
    // visible, not clickable, and not running.
    const escaped = escapeHtmlSource(text);
    const style = hasHiddenLink ? ' style="background-color: red;"' : '';
    const warn = hasHiddenLink
      ? 'Warning! Hidden markdown link description!'
      : 'Code shown as plain text';
    return HTML.Raw('<pre' + style + ' title="' + warn + '" aria-label="' + warn + '">' + DOMPurify.sanitize(escaped, getSecureDOMPurifyConfig()) + '</pre>');
  } else {
    // Prevent hiding info: https://wekan.github.io/hall-of-fame/invisiblebleed/
    // If text does not have hidden markdown link, render all markdown.
    // Also show html comments.
    const renderedMarkdown = Markdown.render(text).replace('<!--', '<font color="red" title="Warning! Hidden HTML comment!" aria-label="Warning! Hidden HTML comment!">&lt;!--</font>').replace('-->', '<font color="red" title="Warning! Hidden HTML comment!" aria-label="Warning! Hidden HTML comment!">--&gt;</font>');
    const sanitized = DOMPurify.sanitize(renderedMarkdown, getSecureDOMPurifyConfig());
    return HTML.Raw(sanitized);
  }
}));
