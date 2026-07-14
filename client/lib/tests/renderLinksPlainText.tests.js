/* eslint-env mocha */
import { expect } from 'chai';
import { getSecureDOMPurifyConfig, sanitizeHTML } from '/imports/lib/secureDOMPurify';

// Tests for the Admin Panel / Features / Security "Render links as plain text"
// toggle and the underlying XSS hardening. Runs client-side, so DOMPurify has a
// real DOM and sanitizeHTML() exercises the actual sanitizer, not just its config.
describe('secureDOMPurify — render links as plain text + XSS hardening', function() {
  // Config-level assertions need no DOM, so they hold in any environment.
  describe('getSecureDOMPurifyConfig(options)', function() {
    it('forbids the <a> tag only when stripLinks is set', function() {
      expect(getSecureDOMPurifyConfig({ stripLinks: true }).FORBID_TAGS).to.include('a');
    });
    it('does NOT forbid <a> by default (negative)', function() {
      expect(getSecureDOMPurifyConfig().FORBID_TAGS).to.not.include('a');
    });
    it('keeps inner content so a stripped link leaves its visible text', function() {
      expect(getSecureDOMPurifyConfig({ stripLinks: true }).KEEP_CONTENT).to.equal(true);
    });
  });

  describe('sanitizeHTML() link handling', function() {
    it('drops the <a> wrapper but keeps its visible text when stripLinks is true', function() {
      const out = sanitizeHTML('<a href="http://example.com">Company Board</a>', { stripLinks: true });
      expect(out).to.not.match(/<a\b/i);
      expect(out).to.contain('Company Board');
    });
    it('keeps a clickable <a> by default (negative)', function() {
      const out = sanitizeHTML('<a href="http://example.com">Company Board</a>');
      expect(out).to.match(/<a\b/i);
      expect(out).to.contain('Company Board');
    });
  });

  describe('sanitizeHTML() XSS hardening (independent of stripLinks)', function() {
    it('strips a javascript: href', function() {
      const out = sanitizeHTML('<a href="javascript:alert(1)">x</a>').toLowerCase();
      expect(out).to.not.contain('javascript:');
    });
    it('strips event-handler attributes', function() {
      const out = sanitizeHTML('<img src="x" onerror="alert(1)">').toLowerCase();
      expect(out).to.not.contain('onerror');
    });
    it('removes <script> tags but keeps surrounding text', function() {
      const out = sanitizeHTML('<script>alert(1)</script>hello');
      expect(out.toLowerCase()).to.not.contain('<script');
      expect(out).to.contain('hello');
    });
    it('keeps a plain safe paragraph unchanged in spirit (negative)', function() {
      const out = sanitizeHTML('<p>just <strong>text</strong></p>');
      expect(out).to.contain('just');
      expect(out).to.match(/<strong\b/i);
    });
  });
});
