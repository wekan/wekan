/* eslint-env mocha */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import { Random } from 'meteor/random';
import { FileStoreStrategyFilesystem } from '/models/lib/fileStoreStrategy';
import Attachments from '/models/attachments';

// FileStoreStrategyFilesystem falls back to a bare global `Attachments` when no
// collection is passed (models/lib/fileStoreStrategy.js). The app exposes model
// collections as globals; the meteor-test module scope does not, so define it
// here to avoid a ReferenceError when constructing the strategy.
globalThis.Attachments = globalThis.Attachments || Attachments;

function readStreamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

describe('fileStoreStrategy security', function() {
  let tempRoot;
  let storageRoot;
  let originalWritablePath;

  beforeEach(function() {
    originalWritablePath = process.env.WRITABLE_PATH;
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-fss-'));
    storageRoot = path.join(tempRoot, 'files', 'attachments');
    fs.mkdirSync(storageRoot, { recursive: true });
    process.env.WRITABLE_PATH = tempRoot;
  });

  afterEach(function() {
    if (typeof originalWritablePath === 'string') {
      process.env.WRITABLE_PATH = originalWritablePath;
    } else {
      delete process.env.WRITABLE_PATH;
    }

    try {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors in tests.
    }
  });

  function createAttachmentFileObj(filePath) {
    return {
      _id: Random.id(),
      name: 'proof.txt',
      collectionName: 'attachments',
      versions: {
        original: {
          path: filePath,
          storage: 'fs',
          type: 'text/plain',
          size: 4,
          meta: {},
        },
      },
      meta: {
        boardId: Random.id(),
      },
    };
  }

  it('denies absolute path outside attachment storage root', function() {
    const externalPath = path.join(tempRoot, 'outside-secret.txt');
    fs.writeFileSync(externalPath, 'secret');

    const strategy = new FileStoreStrategyFilesystem(
      createAttachmentFileObj(externalPath),
      'original',
    );

    const stream = strategy.getReadStream();
    expect(stream).to.equal(undefined);
  });

  it('allows reading a regular file from storage root', async function() {
    const insidePath = path.join(storageRoot, 'safe.txt');
    fs.writeFileSync(insidePath, 'safe-data');

    const strategy = new FileStoreStrategyFilesystem(
      createAttachmentFileObj(insidePath),
      'original',
    );

    const stream = strategy.getReadStream();
    expect(stream).to.not.equal(undefined);

    const content = await readStreamToString(stream);
    expect(content).to.equal('safe-data');
  });

  it('denies symlink inside storage root that points outside', function() {
    const externalPath = path.join(tempRoot, 'outside-via-link.txt');
    fs.writeFileSync(externalPath, 'linked-secret');
    const symlinkPath = path.join(storageRoot, 'escape-link.txt');
    fs.symlinkSync(externalPath, symlinkPath);

    const strategy = new FileStoreStrategyFilesystem(
      createAttachmentFileObj(symlinkPath),
      'original',
    );

    const stream = strategy.getReadStream();
    expect(stream).to.equal(undefined);
  });
});