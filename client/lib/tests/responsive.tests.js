/* eslint-env mocha */
import { expect } from 'chai';
import {
  isMobileViewport,
  isMobileViewportNow,
  MOBILE_BREAKPOINT,
} from '/client/lib/responsiveUtils';

/**
 * Unit tests for the responsive viewport helpers used by the mobile popup fix
 * (#5942) and the responsive CSS overrides (#5902, #6018, #5982).
 *
 * isMobileViewport(width) is the single source of truth for deciding whether a
 * given viewport width should be treated as a narrow/mobile layout.
 */
describe('responsive viewport helpers (isMobileViewport)', function() {
  it('exposes a sane default breakpoint', function() {
    expect(MOBILE_BREAKPOINT).to.equal(768);
  });

  it('treats a typical phone width as mobile', function() {
    expect(isMobileViewport(375)).to.equal(true); // iPhone-ish
    expect(isMobileViewport(414)).to.equal(true);
  });

  it('treats a typical desktop width as not mobile', function() {
    expect(isMobileViewport(1440)).to.equal(false);
    expect(isMobileViewport(1920)).to.equal(false);
  });

  it('is inclusive at the breakpoint boundary', function() {
    expect(isMobileViewport(768)).to.equal(true); // exactly at breakpoint
    expect(isMobileViewport(769)).to.equal(false); // just above
  });

  it('honours a custom breakpoint argument', function() {
    expect(isMobileViewport(800, 800)).to.equal(true);
    expect(isMobileViewport(801, 800)).to.equal(false);
    expect(isMobileViewport(500, 480)).to.equal(false);
    expect(isMobileViewport(480, 480)).to.equal(true);
  });

  it('returns false for invalid / non-numeric widths', function() {
    expect(isMobileViewport(undefined)).to.equal(false);
    expect(isMobileViewport(null)).to.equal(false);
    expect(isMobileViewport(NaN)).to.equal(false);
    expect(isMobileViewport('375')).to.equal(false);
  });

  it('isMobileViewportNow returns a boolean and does not throw', function() {
    expect(isMobileViewportNow()).to.be.a('boolean');
  });
});
