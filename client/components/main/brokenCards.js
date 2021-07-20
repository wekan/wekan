import { CardSearchPagedComponent } from '../../lib/cardSearch';

BlazeComponent.extendComponent({}).register('brokenCardsHeaderBar');

Template.brokenCards.helpers({
  userId() {
    return Meteor.userId();
  },
});

class BrokenCardsComponent extends CardSearchPagedComponent {
  onCreated() {
    super.onCreated();

    Meteor.subscribe('brokenCards', this.sessionId);
  }
}
BrokenCardsComponent.register('brokenCards');
