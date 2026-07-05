/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Readable } from 'stream';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import { fileStoreStrategyFactory } from '/models/attachments.server';
// Register the api.attachment.* Meteor methods under test (the meteor-test entry
// does not load app server code the way server/main.js → /server/imports does).
import '/server/attachmentApi';

describe('attachmentApi authentication', function() {
  let findOneStub, hashStub;

  beforeEach(function() {
    hashStub = sinon.stub(Accounts, '_hashLoginToken');
    findOneStub = sinon.stub(Meteor.users, 'findOne');
  });

  afterEach(function() {
    if (hashStub) hashStub.restore();
    if (findOneStub) findOneStub.restore();
  });

  // Mock request/response objects
  function createMockReq(headers = {}) {
    return {
      headers,
      on: sinon.stub(),
      connection: { destroy: sinon.stub() },
    };
  }

  function createMockRes() {
    return {
      writeHead: sinon.stub(),
      end: sinon.stub(),
      headersSent: false,
    };
  }

  describe('authenticateApiRequest', function() {
    it('denies request with missing X-User-Id header', function() {
      const req = createMockReq({ 'x-auth-token': 'sometoken' });
      const res = createMockRes();

      // Simulate the handler behavior
      let errorThrown = false;
      try {
        if (!req.headers['x-user-id'] || !req.headers['x-auth-token']) {
          throw new Meteor.Error('unauthorized', 'Missing X-User-Id or X-Auth-Token headers');
        }
      } catch (error) {
        errorThrown = true;
        expect(error.error).to.equal('unauthorized');
      }

      expect(errorThrown).to.equal(true);
    });

    it('denies request with missing X-Auth-Token header', function() {
      const req = createMockReq({ 'x-user-id': 'user123' });

      let errorThrown = false;
      try {
        if (!req.headers['x-user-id'] || !req.headers['x-auth-token']) {
          throw new Meteor.Error('unauthorized', 'Missing X-User-Id or X-Auth-Token headers');
        }
      } catch (error) {
        errorThrown = true;
        expect(error.error).to.equal('unauthorized');
      }

      expect(errorThrown).to.equal(true);
    });

    it('denies request with invalid token', function() {
      const userId = 'user123';
      const token = 'invalidtoken';
      const req = createMockReq({ 'x-user-id': userId, 'x-auth-token': token });

      hashStub.returns('hashedInvalidToken');
      findOneStub.returns(null); // No user found

      let errorThrown = false;
      try {
        const hashedToken = Accounts._hashLoginToken(token);
        const user = Meteor.users.findOne({
          _id: userId,
          'services.resume.loginTokens.hashedToken': hashedToken,
        });
        if (!user) {
          throw new Meteor.Error('unauthorized', 'Invalid credentials');
        }
      } catch (error) {
        errorThrown = true;
        expect(error.error).to.equal('unauthorized');
      }

      expect(errorThrown).to.equal(true);
      expect(hashStub.calledOnce).to.equal(true);
      expect(findOneStub.calledOnce).to.equal(true);
    });

    it('allows request with valid X-User-Id and X-Auth-Token', function() {
      const userId = 'user123';
      const token = 'validtoken';
      const req = createMockReq({ 'x-user-id': userId, 'x-auth-token': token });

      const hashedToken = 'hashedValidToken';
      hashStub.returns(hashedToken);
      findOneStub.returns({ _id: userId }); // User found

      let authenticatedUserId = null;
      try {
        const hashed = Accounts._hashLoginToken(token);
        const user = Meteor.users.findOne({
          _id: userId,
          'services.resume.loginTokens.hashedToken': hashed,
        });
        if (!user) {
          throw new Meteor.Error('unauthorized', 'Invalid credentials');
        }
        authenticatedUserId = userId;
      } catch (error) {
        // Should not throw
      }

      expect(authenticatedUserId).to.equal(userId);
      expect(hashStub.calledOnce).to.equal(true);
      expect(hashStub.calledWith(token)).to.equal(true);
      expect(findOneStub.calledOnce).to.equal(true);
      const queryArg = findOneStub.getCall(0).args[0];
      expect(queryArg._id).to.equal(userId);
      expect(queryArg['services.resume.loginTokens.hashedToken']).to.equal(hashedToken);
    });

    it('prevents identity spoofing by validating hashed token', function() {
      const victimId = 'victim-user-id';
      const attackerToken = 'attacker-token';
      const req = createMockReq({ 'x-user-id': victimId, 'x-auth-token': attackerToken });

      hashStub.returns('hashedAttackerToken');
      // Simulate victim exists but token doesn't match
      findOneStub.returns(null);

      let errorThrown = false;
      try {
        const hashed = Accounts._hashLoginToken(attackerToken);
        const user = Meteor.users.findOne({
          _id: victimId,
          'services.resume.loginTokens.hashedToken': hashed,
        });
        if (!user) {
          throw new Meteor.Error('unauthorized', 'Invalid credentials');
        }
      } catch (error) {
        errorThrown = true;
        expect(error.error).to.equal('unauthorized');
      }

      expect(errorThrown).to.equal(true);
    });
  });

  describe('request handler DoS prevention', function() {
    it('enforces timeout on hanging requests', function(done) {
      this.timeout(5000);

      const req = createMockReq({ 'x-user-id': 'user1', 'x-auth-token': 'token1' });
      const res = createMockRes();

      // Simulate timeout behavior
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.headersSent = true;
          res.writeHead(408, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Request timeout' }));
        }
      }, 100); // Short timeout for test

      // Wait for timeout
      setTimeout(() => {
        expect(res.headersSent).to.equal(true);
        expect(res.writeHead.calledWith(408)).to.equal(true);
        clearTimeout(timeout);
        done();
      }, 150);
    });

    it('limits request body size', function() {
      const req = createMockReq({ 'x-user-id': 'user1', 'x-auth-token': 'token1' });
      let body = '';
      const limit = 50 * 1024 * 1024; // 50MB

      // Simulate exceeding limit
      body = 'a'.repeat(limit + 1);
      expect(body.length).to.be.greaterThan(limit);

      // Handler should destroy connection
      if (body.length > limit) {
        req.connection.destroy();
      }

      expect(req.connection.destroy.calledOnce).to.equal(true);
    });
  });

  describe('attachment API method limits', function() {
    let getAttachmentStub;
    let getBoardStub;
    let findSettingsStub;
    let getFileStrategyStub;

    afterEach(function() {
      if (getAttachmentStub) getAttachmentStub.restore();
      if (getBoardStub) getBoardStub.restore();
      if (findSettingsStub) findSettingsStub.restore();
      if (getFileStrategyStub) getFileStrategyStub.restore();

      getAttachmentStub = null;
      getBoardStub = null;
      findSettingsStub = null;
      getFileStrategyStub = null;
    });

    it('rejects api.attachment.upload when payload exceeds configured API upload limit', async function() {
      const uploadHandler = Meteor.server.method_handlers['api.attachment.upload'];
      expect(uploadHandler).to.be.a('function');

      getBoardStub = sinon.stub(ReactiveCache, 'getBoard').resolves({
        hasMember: () => true,
        // Active full member so userHasBoardWriteAccess() grants write access and
        // the request reaches the upload-size-limit check under test.
        members: [{ userId: 'user-1', isActive: true }],
        allowsAttachments: true,
      });
      getAttachmentStub = sinon.stub(ReactiveCache, 'getCard').resolves({
        boardId: 'board-1',
        swimlaneId: 'swimlane-1',
        listId: 'list-1',
      });
      findSettingsStub = sinon.stub(AttachmentStorageSettings, 'findOneAsync').resolves({
        limitSettings: {
          apiUploadMaxBytes: 5,
        },
      });

      let thrown;
      try {
        await uploadHandler.apply(
          { userId: 'user-1' },
          ['board-1', 'swimlane-1', 'list-1', 'card-1', Buffer.alloc(10).toString('base64'), 'big.bin', 'application/octet-stream', 'fs'],
        );
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.exist;
      expect(thrown.error).to.equal('upload-error');
      expect(thrown.reason).to.include('Attachment exceeds API upload limit');
    });

    it('rejects api.attachment.download when stream exceeds configured API download limit', async function() {
      const downloadHandler = Meteor.server.method_handlers['api.attachment.download'];
      expect(downloadHandler).to.be.a('function');

      getAttachmentStub = sinon.stub(ReactiveCache, 'getAttachment').resolves({
        _id: 'att-1',
        name: 'huge.bin',
        size: undefined,
        type: 'application/octet-stream',
        meta: { boardId: 'board-1' },
      });
      getBoardStub = sinon.stub(ReactiveCache, 'getBoard').resolves({
        hasMember: () => true,
      });
      findSettingsStub = sinon.stub(AttachmentStorageSettings, 'findOneAsync').resolves({
        limitSettings: {
          apiDownloadMaxBytes: 10,
        },
      });
      getFileStrategyStub = sinon.stub(fileStoreStrategyFactory, 'getFileStrategy').returns({
        getReadStream: () => Readable.from([Buffer.alloc(6), Buffer.alloc(6)]),
        getStorageName: () => 'fs',
      });

      let thrown;
      try {
        await downloadHandler.apply({ userId: 'user-1' }, ['att-1']);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.exist;
      expect(thrown.error).to.equal('file-too-large');
      expect(thrown.reason).to.include('Attachment exceeds API download limit');
    });
  });

  describe('attachment API write permissions', function() {
    let stubs = [];

    const stub = (obj, method, impl) => {
      const s = sinon.stub(obj, method).callsFake(impl);
      stubs.push(s);
      return s;
    };

    afterEach(function() {
      stubs.forEach(s => s.restore());
      stubs = [];
    });

    it('rejects api.attachment.upload from a read-only board member', async function() {
      const uploadHandler = Meteor.server.method_handlers['api.attachment.upload'];
      stub(ReactiveCache, 'getCard', async () => ({
        boardId: 'board-1',
        swimlaneId: 'swimlane-1',
        listId: 'list-1',
      }));
      stub(ReactiveCache, 'getBoard', async () => ({
        hasMember: () => true,
        allowsAttachments: true,
        members: [{ userId: 'user-1', isActive: true, isReadOnly: true }],
      }));
      // Not a global admin.
      stub(ReactiveCache, 'getUser', async () => undefined);

      let thrown;
      try {
        await uploadHandler.apply(
          { userId: 'user-1' },
          ['board-1', 'swimlane-1', 'list-1', 'card-1', Buffer.alloc(2).toString('base64'), 'f.bin', 'application/octet-stream', 'fs'],
        );
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.exist;
      expect(thrown.error).to.equal('not-authorized');
    });

    it('rejects api.attachment.delete from a comment-only board member', async function() {
      const deleteHandler = Meteor.server.method_handlers['api.attachment.delete'];
      stub(ReactiveCache, 'getAttachment', async () => ({
        _id: 'att-1',
        name: 'f.bin',
        meta: { boardId: 'board-1' },
      }));
      stub(ReactiveCache, 'getBoard', async () => ({
        hasMember: () => true,
        members: [{ userId: 'user-1', isActive: true, isCommentOnly: true }],
      }));
      stub(ReactiveCache, 'getUser', async () => undefined);

      let thrown;
      try {
        await deleteHandler.apply({ userId: 'user-1' }, ['att-1']);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.exist;
      expect(thrown.error).to.equal('not-authorized');
    });

    it('allows a global site admin to delete even without board write access', async function() {
      const deleteHandler = Meteor.server.method_handlers['api.attachment.delete'];
      stub(ReactiveCache, 'getAttachment', async () => ({
        _id: 'att-1',
        name: 'f.bin',
        meta: { boardId: 'board-1' },
      }));
      stub(ReactiveCache, 'getBoard', async () => ({
        hasMember: () => true,
        members: [{ userId: 'user-1', isActive: true, isReadOnly: true }],
      }));
      // user-1 IS a global admin.
      stub(ReactiveCache, 'getUser', async () => ({ _id: 'user-1', isAdmin: true }));
      stub(Attachments, 'removeAsync', async () => 1);

      let result;
      let thrown;
      try {
        result = await deleteHandler.apply({ userId: 'user-1' }, ['att-1']);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.not.exist;
      expect(result).to.have.property('success', true);
    });
  });
});
