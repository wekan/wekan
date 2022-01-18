/* eslint-env mocha */
import sinon from 'sinon';
import { expect } from 'chai';
import { Random } from 'meteor/random';
import '../utils';


describe('Utils', function() {
  beforeEach(function() {
    sinon.stub(Utils, 'reload').callsFake(() => {});
  });

  afterEach(function() {
    window.localStorage.removeItem(boardView);
    sinon.restore();
  });

  const boardView = 'boardView';

  describe(Utils.setBoardView.name, function() {
    it('sets the board view if the user exists', function(done) {
      const viewId = Random.id();
      const user = {
        setBoardView: (view) => {
          expect(view).to.equal(viewId);
          done();
        },
      };
      sinon.stub(Meteor, 'user').callsFake(() => user);
      Utils.setBoardView(viewId);

      expect(window.localStorage.getItem(boardView)).to.equal(viewId);
    });

    it('sets a specific view if no user exists but a view is defined', function() {
      const views = [
        'board-view-swimlanes',
        'board-view-lists',
        'board-view-cal'
      ];

      sinon.stub(Meteor, 'user').callsFake(() => {});

      views.forEach(viewName => {
        Utils.setBoardView(viewName);
        expect(window.localStorage.getItem(boardView)).to.equal(viewName);
      });
    });

    it('sets a default view if no user and no view are given', function() {
      sinon.stub(Meteor, 'user').callsFake(() => {});
      Utils.setBoardView();
      expect(window.localStorage.getItem(boardView)).to.equal('board-view-swimlanes');
    });
  });

  describe(Utils.unsetBoardView.name, function() {
    it('removes the boardview from localStoage', function() {
      window.localStorage.setItem(boardView, Random.id());
      window.localStorage.setItem('collapseSwimlane', Random.id());

      Utils.unsetBoardView();

      expect(window.localStorage.getItem(boardView)).to.equal(null);
      expect(window.localStorage.getItem('collapseSwimlane')).to.equal(null);
    });
  });

  describe(Utils.boardView.name, function() {
    it('returns the user\'s board view if a user exists', function() {
      const viewId = Random.id();
      const user = {};
      sinon.stub(Meteor, 'user').callsFake(() => user);
      expect(Utils.boardView()).to.equal(undefined);

      const boardView = Random.id();
      user.profile = { boardView };

      expect(Utils.boardView()).to.equal(boardView);
    });
    it('returns the current defined view', function() {
      const views = [
        'board-view-swimlanes',
        'board-view-lists',
        'board-view-cal'
      ];

      sinon.stub(Meteor, 'user').callsFake(() => {});

      views.forEach(viewName => {
        window.localStorage.setItem(boardView, viewName);
        expect(Utils.boardView()).to.equal(viewName);
      });
    });
    it('returns a default if nothing is set', function() {
      sinon.stub(Meteor, 'user').callsFake(() => {});
      expect(Utils.boardView()).to.equal('board-view-swimlanes');
      expect(window.localStorage.getItem(boardView)).to.equal('board-view-swimlanes');
    });
  });

  describe(Utils.myCardsSort.name, function() {
    it('has no tests yet');
  });

  describe(Utils.myCardsSortToggle.name, function() {
    it('has no tests yet');
  });

  describe(Utils.setMyCardsSort.name, function() {
    it('has no tests yet');
  });

  describe(Utils.archivedBoardIds.name, function() {
    it('has no tests yet');
  });

  describe(Utils.dueCardsView.name, function() {
    it('has no tests yet');
  });

  describe(Utils.setDueCardsView.name, function() {
    it('has no tests yet');
  });

  describe(Utils.goBoardId.name, function() {
    it('has no tests yet');
  });

  describe(Utils.goCardId.name, function() {
    it('has no tests yet');
  });

  describe(Utils.processUploadedAttachment.name, function() {
    it('has no tests yet');
  });

  describe(Utils.shrinkImage.name, function() {
    it('has no tests yet');
  });

  describe(Utils.capitalize.name, function() {
    it('has no tests yet');
  });

  describe(Utils.isMiniScreen.name, function() {
    it('has no tests yet');
  });

  describe(Utils.isShowDesktopDragHandles.name, function() {
    it('has no tests yet');
  });

  describe(Utils.isMiniScreenOrShowDesktopDragHandles.name, function() {
    it('has no tests yet');
  });

  describe(Utils.calculateIndexData.name, function() {
    it('has no tests yet');
  });

  describe(Utils.calculateIndex.name, function() {
    it('has no tests yet');
  });

  describe(Utils.manageCustomUI.name, function() {
    it('has no tests yet');
  });

  describe(Utils.setCustomUI.name, function() {
    it('has no tests yet');
  });

  describe(Utils.setMatomo.name, function() {
    it('has no tests yet');
  });

  describe(Utils.manageMatomo.name, function() {
    it('has no tests yet');
  });

  describe(Utils.getTriggerActionDesc.name, function() {
    it('has no tests yet');
  });
});
