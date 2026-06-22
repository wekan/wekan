/* eslint-env mocha */
import { expect } from 'chai';
import {
  truncateFilenameToBytes,
  sanitizeFilename,
} from '/models/lib/filenameSanitizer';

// Regression tests for #6412: very long attachment filenames produced an on-disk
// "<id>-<version>-<name>" component longer than the filesystem's 255-byte limit
// and failed with ENAMETOOLONG (worse with multibyte UTF-8 like German umlauts).
// sanitizeFilename now caps the name at 200 UTF-8 *bytes*, measured in bytes and
// never splitting a multibyte codepoint, while preserving the file extension.
describe('attachment filename truncation (#6412)', function() {
  const isValidUtf8 = s => Buffer.from(s, 'utf8').toString('utf8') === s;

  describe('truncateFilenameToBytes', function() {
    it('leaves a short name unchanged', function() {
      expect(truncateFilenameToBytes('short.png', 200)).to.equal('short.png');
    });

    it('truncates a long ASCII name to the byte budget and keeps the extension', function() {
      const name = 'a'.repeat(300) + '.png';
      const out = truncateFilenameToBytes(name, 200);
      expect(Buffer.byteLength(out, 'utf8')).to.be.at.most(200);
      expect(out.endsWith('.png')).to.equal(true);
    });

    it('truncates a multibyte (umlaut) name by bytes without splitting a codepoint', function() {
      // The actual filename from the issue report (German, umlauts = 2 bytes each).
      const name =
        'Förderprogramme helfen bei deiner Unternehmensgründung. Man unterscheidet ' +
        'auf drei Ebenen. Absicherung des Lebensunterhalt bei Gründung aus ' +
        'Arbeitslosigkeit Beratungskostenzuschüsse für die Beratung vor oder während .png';
      expect(Buffer.byteLength(name, 'utf8')).to.be.above(200);
      const out = truncateFilenameToBytes(name, 200);
      expect(Buffer.byteLength(out, 'utf8')).to.be.at.most(200);
      expect(isValidUtf8(out), 'must remain valid UTF-8 (no split codepoint)').to.equal(true);
      expect(out.endsWith('.png')).to.equal(true);
    });

    it('clips the whole name when the extension itself is absurdly long', function() {
      const name = 'x.' + 'y'.repeat(300);
      const out = truncateFilenameToBytes(name, 200);
      expect(Buffer.byteLength(out, 'utf8')).to.be.at.most(200);
      expect(isValidUtf8(out)).to.equal(true);
    });
  });

  describe('sanitizeFilename', function() {
    it('caps a very long name so the on-disk "<id>-<version>-<name>" stays under 255 bytes', function() {
      const out = sanitizeFilename('Ü'.repeat(300) + '.png');
      expect(Buffer.byteLength(out, 'utf8')).to.be.at.most(200);
      const id = 'aBcD1234eFgH5678i'; // typical Random.id()
      const component = `${id}-original-${out}`;
      expect(Buffer.byteLength(component, 'utf8')).to.be.below(255);
    });

    it('still strips path traversal AND caps length together', function() {
      const out = sanitizeFilename('../../' + 'n'.repeat(300) + '.txt');
      expect(out.includes('..'), 'path traversal removed').to.equal(false);
      expect(Buffer.byteLength(out, 'utf8')).to.be.at.most(200);
      expect(out.endsWith('.txt')).to.equal(true);
    });

    it('falls back to "unnamed" for empty/invalid input', function() {
      expect(sanitizeFilename('')).to.equal('unnamed');
      expect(sanitizeFilename(null)).to.equal('unnamed');
    });
  });
});
