/* eslint-env mocha */
import { expect } from 'chai';
import {
  extractErrorMessage,
  safeJsonStringify,
  httpStatusForError,
  validateCommentBody,
} from '../apiResponseHelpers';

/**
 * Unit tests for the pure helpers behind the REST API error-handling fix:
 *
 *   #5804 HTTP 500 error when sending an invalid `application/json` request,
 *         should instead return HTTP 400.
 *
 * The helpers are Meteor-free so these tests run standalone (mocha + chai).
 */
describe('REST API response helpers (#5804)', function() {
  // A SimpleSchema validation error is circular: a validation context points
  // back to its schema, which points back to its contexts. This is the exact
  // shape that previously crashed JSON.stringify and surfaced as HTTP 500.
  function makeCircularValidationError() {
    const schema = { name: 'SimpleSchema' };
    const context = { name: 'SimpleSchemaValidationContext', _simpleSchema: schema };
    schema._validationContexts = { default: context };
    const error = new Error('failed validation');
    error.reason = 'Text is required';
    error._validationContexts = { default: context };
    return error;
  }

  describe('extractErrorMessage', function() {
    it('returns a Meteor.Error reason', function() {
      expect(extractErrorMessage({ reason: 'Unauthorized' })).to.equal('Unauthorized');
    });

    it('returns a native Error message', function() {
      expect(extractErrorMessage(new Error('boom'))).to.equal('boom');
    });

    it('prefers reason over message', function() {
      const e = new Error('low level');
      e.reason = 'friendly';
      expect(extractErrorMessage(e)).to.equal('friendly');
    });

    it('passes a plain string through', function() {
      expect(extractErrorMessage('just text')).to.equal('just text');
    });

    it('is null / undefined safe', function() {
      expect(extractErrorMessage(null)).to.equal('null');
      expect(extractErrorMessage(undefined)).to.equal('undefined');
    });

    it('never throws on a circular validation error', function() {
      expect(() => extractErrorMessage(makeCircularValidationError())).to.not.throw();
      expect(extractErrorMessage(makeCircularValidationError())).to.equal('Text is required');
    });
  });

  describe('safeJsonStringify', function() {
    it('serializes ordinary data like JSON.stringify', function() {
      expect(safeJsonStringify({ _id: 'abc' })).to.equal('{"_id":"abc"}');
    });

    it('honours the spacer argument', function() {
      expect(safeJsonStringify({ a: 1 }, 2)).to.equal('{\n  "a": 1\n}');
    });

    it('does NOT throw on a circular structure (regression for the HTTP 500)', function() {
      const circular = {};
      circular.self = circular;
      expect(() => safeJsonStringify(circular)).to.not.throw();
    });

    it('falls back to an { error } payload for a circular validation error', function() {
      const json = safeJsonStringify(makeCircularValidationError());
      expect(JSON.parse(json)).to.deep.equal({ error: 'Text is required' });
    });
  });

  describe('httpStatusForError', function() {
    it('uses an explicit numeric statusCode', function() {
      expect(httpStatusForError({ statusCode: 401 })).to.equal(401);
      expect(httpStatusForError({ statusCode: 403 })).to.equal(403);
      expect(httpStatusForError({ statusCode: 404 })).to.equal(404);
    });

    it('maps well-known Meteor.Error names', function() {
      expect(httpStatusForError({ error: 'Unauthorized' })).to.equal(401);
      expect(httpStatusForError({ error: 'Forbidden' })).to.equal(403);
      expect(httpStatusForError({ error: 'NotFound' })).to.equal(404);
    });

    it('defaults to 500 for an unknown error', function() {
      expect(httpStatusForError(new Error('boom'))).to.equal(500);
      expect(httpStatusForError(null)).to.equal(500);
      expect(httpStatusForError(undefined)).to.equal(500);
    });
  });

  describe('validateCommentBody', function() {
    it('accepts a non-empty comment and trims it', function() {
      const r = validateCommentBody({ comment: '  hello  ' });
      expect(r.valid).to.equal(true);
      expect(r.comment).to.equal('hello');
    });

    it('rejects a missing comment (the #5804 repro: no body sent)', function() {
      const r = validateCommentBody(undefined);
      expect(r.valid).to.equal(false);
      expect(r.error).to.match(/comment/i);
    });

    it('rejects an empty body object', function() {
      expect(validateCommentBody({}).valid).to.equal(false);
    });

    it('rejects a whitespace-only comment', function() {
      expect(validateCommentBody({ comment: '   ' }).valid).to.equal(false);
    });

    it('rejects a non-string comment', function() {
      expect(validateCommentBody({ comment: 42 }).valid).to.equal(false);
      expect(validateCommentBody({ comment: null }).valid).to.equal(false);
    });
  });
});
