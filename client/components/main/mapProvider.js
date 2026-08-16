// Its own template, because settings/tablePage.js imports this module: whichever
// module reaches it first evaluates it, and that can be long before the feature
// list gets to the .jade - at which point `Template.mapProviderSelect.helpers`
// throws and every template registered after it never registers.
// tests/clientBundleImports.test.cjs is the guard.
import './mapProvider.jade';
import { ReactiveCache } from '/imports/reactiveCache';

// The map-provider chooser's own helper, so every template that includes
// +mapProviderSelect gets it - the card's location popup and the Admin Panel
// location popup both did this themselves before, with the same six lines.
Template.mapProviderSelect.helpers({
  isMapProvider(provider) {
    const user = ReactiveCache.getCurrentUser();
    const current = user ? user.getMapProvider() : 'openstreetmap';
    return current === provider;
  },
});

// The provider currently selected in a rendered chooser, or the saved one when
// there is no chooser on screen. Whoever includes the template reads the choice
// through this rather than reaching for `.js-map-provider` itself.
export function selectedMapProvider(templateInstance) {
  const select = templateInstance && templateInstance.find
    ? templateInstance.find('.js-map-provider')
    : null;
  if (select && select.value) return select.value;
  const user = ReactiveCache.getCurrentUser();
  return (user && user.getMapProvider()) || 'openstreetmap';
}
