import { TrelloCreator } from './trelloCreator';
import { WekanCreator } from './wekanCreator';

Meteor.methods({
  importBoard(board, data, importSource) {
    check(board, Object);
    check(data, Object);
    check(importSource, String);
    let creator;
    switch (importSource) {
    case 'trello':
      creator = new TrelloCreator(data);
      break;
    case 'wekan':
      creator = new WekanCreator(data);
      break;
    }

    // 1. check all parameters are ok from a syntax point of view
    creator.check(board);

    // 2. check parameters are ok from a business point of view (exist &
    // authorized) nothing to check, everyone can import boards in their account

    // 3. create all elements
    return creator.create(board);
  },
});
