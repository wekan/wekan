/* eslint-env mocha */
import { expect } from 'chai';
import { isTextSelectionInsideCard } from '/client/lib/cardCloseGuard';

/**
 * Unit tests for the card-details close guard.
 *
 * Regression #5686 ("Chrome: Selecting text in checklist closes card"):
 * a text-selection drag that starts on the card content and ends with the
 * mouse released outside the card must keep the card open. The guard returns
 * true (keep the card open) only when there is a live, non-collapsed text
 * selection anchored inside the card detail pane.
 *
 * The helper is DOM-light, so a fake `cardDetailsEl` with a `contains()` method
 * and a fake `selection` object are enough to exercise every branch.
 */
describe('isTextSelectionInsideCard (#5686)', function() {
  // A node "inside" the card and one "outside" it.
  const insideNode = { id: 'inside' };
  const outsideNode = { id: 'outside' };
  const cardEl = {
    contains(node) {
      return node === insideNode;
    },
  };

  function selection({ collapsed = false, text = 'selected text', anchor, focus }) {
    return {
      isCollapsed: collapsed,
      toString: () => text,
      anchorNode: anchor,
      focusNode: focus,
    };
  }

  it('keeps the card open when the selection is anchored inside the card (the #5686 drag)', function() {
    const sel = selection({ anchor: insideNode, focus: outsideNode });
    expect(isTextSelectionInsideCard(sel, cardEl)).to.equal(true);
  });

  it('keeps the card open when only the focus node is inside the card', function() {
    const sel = selection({ anchor: outsideNode, focus: insideNode });
    expect(isTextSelectionInsideCard(sel, cardEl)).to.equal(true);
  });

  it('closes the card when the selection is entirely outside the card', function() {
    const sel = selection({ anchor: outsideNode, focus: outsideNode });
    expect(isTextSelectionInsideCard(sel, cardEl)).to.equal(false);
  });

  it('closes the card for a collapsed (caret-only) selection inside the card', function() {
    const sel = selection({ collapsed: true, anchor: insideNode, focus: insideNode });
    expect(isTextSelectionInsideCard(sel, cardEl)).to.equal(false);
  });

  it('closes the card when the selected text is empty / whitespace only', function() {
    expect(isTextSelectionInsideCard(selection({ text: '', anchor: insideNode }), cardEl)).to.equal(false);
    expect(isTextSelectionInsideCard(selection({ text: '   ', anchor: insideNode }), cardEl)).to.equal(false);
  });

  it('matches when the selection node IS the card element itself', function() {
    const sel = selection({ anchor: cardEl, focus: cardEl });
    expect(isTextSelectionInsideCard(sel, cardEl)).to.equal(true);
  });

  it('is null / undefined safe', function() {
    expect(isTextSelectionInsideCard(null, cardEl)).to.equal(false);
    expect(isTextSelectionInsideCard(selection({ anchor: insideNode }), null)).to.equal(false);
    expect(isTextSelectionInsideCard(undefined, undefined)).to.equal(false);
  });

  it('always returns a Boolean', function() {
    expect(isTextSelectionInsideCard(selection({ anchor: insideNode }), cardEl)).to.be.a('boolean');
    expect(isTextSelectionInsideCard(null, null)).to.be.a('boolean');
  });
});
