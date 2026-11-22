# Planning Poker / Scrum Poker

## What it is

Planning Poker lets a team estimate a card together: everybody picks a card of
the deck - 1, 2, 3, 5, 8, 13, 20, 40, 100 or ? - without seeing the others'
picks, and when the vote ends WeKan shows who chose what and which value won.
A board admin then sets the card's estimation, which the Scrum board uses as the
card's estimate.

Click Card => `☰` => `Edit Planning Poker` (now the hamburger of the card's
**Planning Poker** section).

## Read more

- [Planning poker](https://en.wikipedia.org/wiki/Planning_poker),
  [Wideband Delphi](https://en.wikipedia.org/wiki/Wideband_Delphi) (the method
  it comes from) and [Story point](https://en.wikipedia.org/wiki/Story_point) on
  Wikipedia.
- [Original Wekan Feature Request and Description](https://github.com/wekan/wekan/issues/3751)
- [Pull Request that implements Planning Poker](https://github.com/wekan/wekan/pull/3836)
- [Bug: Planning Poker Setting End Date only works in English](https://github.com/wekan/wekan/issues/3837)
- In WeKan: [Scrum](Scrum.md), [Card Settings](Card-Settings.md).

## How to use it

**Start a vote** (whoever may change the card):

1. Open the card. In the **Planning Poker** section, click its hamburger,
   **Edit Planning Poker**. The popup is **Start a Planning Poker**.
2. Optionally tick **Allow all logged in users**, so people who are not members
   of the board may vote too. It can be changed only before the vote starts.
3. Optionally click **End** and choose when the vote closes.
4. Click **Save**. The deck appears on the card.

**Vote**

1. Click one of the cards: **1**, **2**, **3**, **5**, **8**, **13**, **20**,
   **40**, **100** or **?** (unsure). Your pick gets a check mark.
2. Click another card to change your vote; each person has one vote.
3. Voting is open to board members (and to everybody signed in when allowed)
   until the end date.

**Finish and estimate** (board admins):

1. Click **Finish** to end the vote now (it sets the end date to this moment).
2. The result table lists each value, its number of **Votes** and **Who** voted
   for it; the winning value is highlighted. A badge says how many of the
   board's active members voted.
3. Type a number and click **Set Estimation** to store the card's estimation. It
   shows on the minicard once the vote has ended.
4. **Replay** clears the votes, the end date and the estimation, for a new
   round.
5. To remove the Planning Poker from the card, a board admin opens **Edit
   Planning Poker** and clicks **Delete**, then confirms.

**Show or hide it**: Board Settings / Card, row **Planning Poker** (*Show on
Card*, on by default, and *Show on Minicard*).

## How the numbers are calculated

From `models/cards.js` (`pokerCount*`, `pokerWinner`, `expiredPoker`):

- **Votes per value**: the number of user ids in that value's list
  (`poker.one`, `poker.two`, ... `poker.unsure`). A vote is moved, never
  doubled: voting takes you out of every other list (`setPoker`).
- **Votes in total** = the sum over all ten values (`pokerCount`). The badge
  shows it as *N of M*, where M is the number of the board's active members. It
  is not shown on a public board that allows all logged-in users, where M would
  not be the voters.
- **Ended**: the vote has an end date (`poker.end`) and it is in the past.
- **Winner**: the value with the most votes; when several share the most votes,
  the highest number of them wins. **?** counts as a value but has no number, so
  in a tie with it the order is not defined. With no votes at all, every value
  ties at 0 and **100** is highlighted.
- **Estimation**: the number typed, read as a whole number (`parseInt`), stored
  as `poker.estimation`. The Scrum board reads it as the card's estimate when
  its estimate source is Planning Poker (the default, `estimateSource: 'poker'`
  in `models/lib/scrum.js`).

## How it works in WeKan

- **Data**: `card.poker` - `question` (true while a vote exists),
  `allowNonBoardMembers`, the ten vote lists, `end` and `estimation`. A card
  that never had a vote has no `poker` at all.
- **Server methods** in [server/models/cards.js](../../../server/models/cards.js):
  `cards.setPokerQuestion` (start), `cards.pokerVote`, `cards.setPokerEnd` /
  `cards.unsetPokerEnd`, `cards.replayPoker`, `cards.setPokerEstimation` /
  `cards.unsetPokerEstimation` and `cards.unsetPoker` (delete). Voting needs
  board membership or `allowNonBoardMembers`; every other method needs
  `canEditCardOrLinkedCard`. Each writes the source card of a linked card. A
  member cannot vote for somebody else: the server takes the voter from the
  signed-in user.
- **Client**: `cardFieldSectionPoker` and `cardStartPlanningPokerPopup` in
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade),
  their events in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js);
  the minicard badge in `client/components/cards/minicard.jade`.
- Tests: [server/lib/tests/cards.methods.tests.js](../../../server/lib/tests/cards.methods.tests.js)
  and [server/lib/tests/cards.security.tests.js](../../../server/lib/tests/cards.security.tests.js).

## Commits

 - [WeKan JSON import keeps poker](https://github.com/wekan/wekan/commit/c640c5c376526f6550873b757fa6b68511c63d42)
 - [Card Settings: Planning Poker is a section of its own](https://github.com/wekan/wekan/commit/c69f3fe25a0db118bdf258370ded4a330f7e0ffa)
 - [Edit Planning Poker moves to its section's hamburger](https://github.com/wekan/wekan/commit/4f20f24201b4b51c07118b1ebd543a774ee4a79f)
 - [A Board Settings / Card toggle for Planning Poker](https://github.com/wekan/wekan/commit/970213010013529150101d3fd6c59f33eab542d4)
 - [Missing voting buttons fixed](https://github.com/wekan/wekan/commit/adbdef140e4bc1a0fdec08197bb403edf2377b12)
 - [Members can no longer forge others' votes, in planning poker too](https://github.com/wekan/wekan/commit/0a1a075f3153e71d9a858576f1c68d2925230d9c)
 - [A card without planning poker stores no poker fields](https://github.com/wekan/wekan/commit/a929d1e3a4bb6d8daf1f34b131a09addfa452af6)
 - [Deleting a planning poker works](https://github.com/wekan/wekan/commit/18b6381d790848062752b211d48c84a2de268bd0)
 - [Setting the end date works in more languages](https://github.com/wekan/wekan/commit/57f31d443faaa32d6c7b53d81af3be133af5f040)
 - [Add Planning Poker](https://github.com/wekan/wekan/commit/fa3d11737265ba373522e4d9aa6c2cb2c8a43546)
