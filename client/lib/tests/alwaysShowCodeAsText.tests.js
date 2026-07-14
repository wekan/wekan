/* eslint-env mocha */
import { expect } from 'chai';
import { Markdown } from 'meteor/wekan-markdown';

// Tests for the Admin Panel / Features / Security "Always show all code as plain
// text" toggle. When enabled, the markdown helper renders the raw source escaped
// (via escapeHtmlSource) so hidden content — HTML comments, the target of markdown
// links, JavaScript and any other code — is shown literally, not executed. Here we
// pin escapeHtmlSource, the escaper that makes that safe.
describe('markdown — always show code as plain text (escapeHtmlSource)', function() {
  const esc = Markdown.escapeHtmlSource;

  it('escapes <script> so it is shown, not executed', function() {
    expect(esc("<script>alert('x')</script>")).to.equal(
      "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
    );
  });

  it('reveals HTML comments instead of hiding them', function() {
    expect(esc('<!-- secret -->')).to.equal('&lt;!-- secret --&gt;');
  });

  it('escapes ampersand first so entities are not double-decoded', function() {
    expect(esc('a & b')).to.equal('a &amp; b');
    expect(esc('&lt;')).to.equal('&amp;lt;');
  });

  it('escapes quotes used in markup attributes', function() {
    expect(esc('<a href="x">')).to.equal('&lt;a href=&quot;x&quot;&gt;');
  });

  it('leaves plain text without HTML-significant characters unchanged (negative)', function() {
    expect(esc('just plain text 123')).to.equal('just plain text 123');
  });

  it('leaves an empty string unchanged (negative)', function() {
    expect(esc('')).to.equal('');
  });
});
