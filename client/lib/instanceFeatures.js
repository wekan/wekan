// #6736: the instance's feature decisions (Admin Panel / Settings / Visibility /
// Features) for the signed-in user, reactively. The decisions themselves are
// models/lib/instanceFeatures.js; this only supplies what the client knows -
// the published Settings document and the user's own preview flag.
import { Template } from 'meteor/templating';
import { ReactiveCache } from '/imports/reactiveCache';
import { currentUserWith } from '/client/lib/currentUserWith';
const { isBoardViewAvailable, isFeatureAvailable } = require('/models/lib/instanceFeatures');

// #6745: only the two fields canPreviewFeatures() reads. Utils.boardView()
// calls this, and every list's card loop reads boardView(): with the whole user
// document here, a card open (a user write) re-ran every list and Blaze then
// re-evaluated every minicard.
const PREVIEW_USER_FIELDS = ['featurePreview', 'isAdmin'];

export function allowBoardView(view) {
  return isBoardViewAvailable(ReactiveCache.getCurrentSetting(), currentUserWith(PREVIEW_USER_FIELDS), view);
}

// A catalog feature without a board view of its own (the helpers that need no
// AI: rule suggestions, ...), for the signed-in user.
export function allowFeature(key) {
  return isFeatureAvailable(ReactiveCache.getCurrentSetting(), currentUserWith(PREVIEW_USER_FIELDS), key);
}

// {{#if allowFeature 'board-summary'}} in a template.
Template.registerHelper('allowFeature', key => allowFeature(key));
