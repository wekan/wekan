import { TrelloCreator } from './trelloCreator';
import { WekanCreator } from './wekanCreator';
import { CsvCreator } from './csvCreator';
import { Exporter } from './exporter';
import wekanMembersMapper from './wekanmapper';

Meteor.methods({
  importBoard(board, data, importSource, currentBoard) {
    check(data, Object);
    check(importSource, String);
    check(currentBoard, Match.Maybe(String));
    let creator;
    switch (importSource) {
      case 'trello':
        check(board, Object);
        creator = new TrelloCreator(data);
        break;
      case 'wekan':
        check(board, Object);
        creator = new WekanCreator(data);
        break;
      case 'csv':
        check(board, Array);
        creator = new CsvCreator(data);
        break;
    }

    // 1. check all parameters are ok from a syntax point of view
    //creator.check(board);

    // 2. check parameters are ok from a business point of view (exist &
    // authorized) nothing to check, everyone can import boards in their account

    // 3. create all elements
    return creator.create(board, currentBoard);
  },
});

Meteor.methods({
  cloneBoard(sourceBoardId, currentBoardId) {
    check(sourceBoardId, String);
    check(currentBoardId, Match.Maybe(String));
    const exporter = new Exporter(sourceBoardId);
    const data = exporter.build();
    const addData = {};
    addData.membersMapping = wekanMembersMapper.getMembersToMap(data);
    const creator = new WekanCreator(addData);
    //data.title = `${data.title  } - ${  TAPi18n.__('copy-tag')}`;
    data.title = `${data.title}`;
    return creator.create(data, currentBoardId);
  },
});
