import { ReactiveVar } from 'meteor/reactive-var';
import { Utils } from '/client/lib/utils';

function projectedPoint(point, board) {
  const left = Math.max(0, Math.min(100, ((point.longitude + 180) / 360) * 100));
  const top = Math.max(0, Math.min(100, ((90 - point.latitude) / 180) * 100));
  return {
    ...point,
    style: `left:${left}%;top:${top}%`,
    url: board
      ? `/b/${board._id}/${board.slug}/${point.cardId}`
      : '#',
  };
}

Template.mapView.onCreated(function() {
  this.status = new ReactiveVar(null);
  this.error = new ReactiveVar('');
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (!boardId) return;
    Meteor.call('boardStatus', boardId, (error, result) => {
      this.error.set(error ? error.reason || error.error : '');
      this.status.set(error ? null : result);
    });
  });
});

Template.mapView.events({
  'mousedown .map-view, touchstart .map-view'(event) {
    event.stopPropagation();
  },
});

Template.mapView.helpers({
  boardTitle() {
    return Utils.getCurrentBoard()?.title || '';
  },
  mapPoints() {
    const dashboard = Template.instance().status.get()?.dashboard;
    const board = Utils.getCurrentBoard();
    return (dashboard?.mapPoints || []).map(point => projectedPoint(point, board));
  },
  hasMapPoints() {
    return !!Template.instance().status.get()?.dashboard?.mapPoints?.length;
  },
  mapPointCount() {
    return Template.instance().status.get()?.dashboard?.mapPointTotal || 0;
  },
  mapPointsTruncated() {
    return !!Template.instance().status.get()?.dashboard?.mapPointsTruncated;
  },
  mapError() {
    return Template.instance().error.get();
  },
});
