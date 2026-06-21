/* eslint-env mocha */
import { expect } from 'chai';
import { installGetBuiltinModuleShim } from '/client/lib/bsonBrowserShim';

/**
 * Unit tests for the bson browser shim.
 *
 * Regression: bson 7.x evaluates `globalThis?.process?.getBuiltinModule('v8')`
 * at module-load time. In the browser a partial `process` polyfill exists but
 * has no `getBuiltinModule`, so the (non-optional) call threw and aborted the
 * client bundle bootstrap — boards stopped rendering. The shim installs a no-op
 * `getBuiltinModule` so bson takes its intended `?? {}` browser fallback.
 */
describe('installGetBuiltinModuleShim (bson browser bootstrap)', function() {
  it('installs a no-op getBuiltinModule when process lacks it (the browser case)', function() {
    const glob = { process: {} };
    const installed = installGetBuiltinModuleShim(glob);
    expect(installed).to.equal(true);
    expect(glob.process.getBuiltinModule).to.be.a('function');
    // The shimmed call must not throw and must return undefined so `?? {}` wins.
    expect(glob.process.getBuiltinModule('v8')).to.equal(undefined);
  });

  it('does NOT overwrite a real getBuiltinModule (Node case)', function() {
    const real = () => ({ startupSnapshot: {} });
    const glob = { process: { getBuiltinModule: real } };
    const installed = installGetBuiltinModuleShim(glob);
    expect(installed).to.equal(false);
    expect(glob.process.getBuiltinModule).to.equal(real);
  });

  it('is a no-op when there is no process object', function() {
    const glob = {};
    expect(installGetBuiltinModuleShim(glob)).to.equal(false);
    expect(glob.process).to.equal(undefined);
  });

  it('is null / undefined safe', function() {
    expect(installGetBuiltinModuleShim(null)).to.equal(false);
    expect(installGetBuiltinModuleShim(undefined)).to.equal(false);
  });

  it('returns false (does not throw) when process is frozen', function() {
    const glob = { process: Object.freeze({}) };
    // Object.freeze prevents adding the property; the shim must swallow that.
    expect(installGetBuiltinModuleShim(glob)).to.equal(false);
  });

  it('makes the exact bson expression safe', function() {
    const glob = { process: {} };
    installGetBuiltinModuleShim(glob);
    // Mirror bson: `const { startupSnapshot } = g?.process?.getBuiltinModule('v8') ?? {}`
    let startupSnapshot;
    expect(() => {
      ({ startupSnapshot } = glob.process.getBuiltinModule('v8') ?? {});
    }).to.not.throw();
    expect(startupSnapshot).to.equal(undefined);
  });
});
