/* eslint-env mocha */
import { expect } from 'chai';
import { looksLikeDangerousMarkup } from '/models/fileValidation';

// Regression test for GHSA-jhph-whx8-wq6p: when the `file` binary is unavailable,
// isFileValid() must not trust the client-supplied MIME type. It falls back to
// looksLikeDangerousMarkup() to sniff the real bytes, so a spoofed "image/png"
// upload that actually contains HTML/JS is still forced through the dangerous
// content scan (and rejected). These tests pin the sniffer that gates that path.
describe('fileValidation — dangerous-markup content sniff (GHSA-jhph-whx8-wq6p)', function() {
  describe('flags dangerous markup regardless of the claimed MIME type', function() {
    const dangerous = [
      "<html><body><script>alert('XSS')</script></body></html>",
      '<script>document.cookie</script>',
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      '   \n <html></html>',                 // leading whitespace
      '<!DOCTYPE html><html></html>',
      "<?xml version='1.0'?><root/>",
      '<iframe src="evil"></iframe>',
      '<object data="x"></object>',
      '<embed src="x">',
      '<!ENTITY xxe SYSTEM "file:///etc/passwd">',
      '<META HTTP-EQUIV="refresh" content="0">', // case-insensitive
    ];
    dangerous.forEach((sample, i) => {
      it(`detects dangerous sample #${i + 1}`, function() {
        expect(looksLikeDangerousMarkup(sample)).to.equal(true);
      });
    });
  });

  describe('does NOT misfire on genuine non-markup content (negative)', function() {
    const safe = [
      '',
      null,
      undefined,
      'hello world, this is a plain text note.',
      'a,b,c\n1,2,3\n',                         // CSV
      '{"key": "value", "n": 1}',              // JSON
      '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR',    // PNG magic bytes
      '\xff\xd8\xff\xe0\x00\x10JFIF',           // JPEG magic bytes
      '%PDF-1.7\n1 0 obj',                      // PDF header
      'Some text mentioning a script for a play, no angle brackets.',
    ];
    safe.forEach((sample, i) => {
      it(`treats safe sample #${i + 1} as not dangerous`, function() {
        expect(looksLikeDangerousMarkup(sample)).to.equal(false);
      });
    });
  });
});
