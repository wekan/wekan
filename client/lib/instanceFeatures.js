// #6736: the instance's feature decisions (Admin Panel / Settings / Visibility /
// Features) for the signed-in user, reactively. The decisions themselves are
// models/lib/instanceFeatures.js; this only supplies what the client knows -
// the published Settings document and the user's own preview flag.
import { ReactiveCache } from '/imports/reactiveCache';
const { isBoardViewAvailable } = require('/models/lib/instanceFeatures');

export function allowBoardView(view) {
  return isBoardViewAvailable(ReactiveCache.getCurrentSetting(), ReactiveCache.getCurrentUser(), view);
}
