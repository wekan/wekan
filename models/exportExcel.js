if (Meteor.isServer) {
  // todo XXX once we have a real API in place, move that route there
  // todo XXX also  share the route definition between the client and the server
  // so that we could use something like
  // `ApiRoutes.path('boards/exportExcel', boardId)``
  // on the client instead of copy/pasting the route path manually between the
  // client and the server.
  /**
   * @operation exportExcel
   * @tag Boards
   *
   * @summary This route is used to export the board Excel.
   *
   * @description If user is already logged-in, pass loginToken as param
   * "authToken": '/api/boards/:boardId/exportExcel?authToken=:token'
   *
   * See https://blog.kayla.com.au/server-side-route-authentication-in-meteor/
   * for detailed explanations
   *
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} authToken the loginToken
   */
  const Excel = require('exceljs');
  Picker.route('/api/boards/:boardId/exportExcel', function(params, req, res) {
    const boardId = params.boardId;
    let user = null;
    //console.log('Excel');

    const loginToken = params.query.authToken;
    if (loginToken) {
      const hashToken = Accounts._hashLoginToken(loginToken);
      user = Meteor.users.findOne({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
    } else if (!Meteor.settings.public.sandstorm) {
      Authentication.checkUserId(req.userId);
      user = Users.findOne({
        _id: req.userId,
        isAdmin: true,
      });
    }
    const exporterExcel = new ExporterExcel(boardId);
    if (exporterExcel.canExport(user)) {
      exporterExcel.build(res);
    } else {
      res.end(TAPi18n.__('user-can-not-export-excel'));
    }
  });
}

// exporter maybe is broken since Gridfs introduced, add fs and path

export class ExporterExcel {
  constructor(boardId) {
    this._boardId = boardId;
  }

  build(res) {
    const fs = Npm.require('fs');
    const os = Npm.require('os');
    const path = Npm.require('path');

    const byBoard = {
      boardId: this._boardId,
    };
    const byBoardNoLinked = {
      boardId: this._boardId,
      linkedId: {
        $in: ['', null],
      },
    };
    // we do not want to retrieve boardId in related elements
    const noBoardId = {
      fields: {
        boardId: 0,
      },
    };
    const result = {
      _format: 'wekan-board-1.0.0',
    };
    _.extend(
      result,
      Boards.findOne(this._boardId, {
        fields: {
          stars: 0,
        },
      }),
    );
    result.lists = Lists.find(byBoard, noBoardId).fetch();
    result.cards = Cards.find(byBoardNoLinked, noBoardId).fetch();
    result.swimlanes = Swimlanes.find(byBoard, noBoardId).fetch();
    result.customFields = CustomFields.find(
      {
        boardIds: {
          $in: [this.boardId],
        },
      },
      {
        fields: {
          boardId: 0,
        },
      },
    ).fetch();
    result.comments = CardComments.find(byBoard, noBoardId).fetch();
    result.activities = Activities.find(byBoard, noBoardId).fetch();
    result.rules = Rules.find(byBoard, noBoardId).fetch();
    result.checklists = [];
    result.checklistItems = [];
    result.subtaskItems = [];
    result.triggers = [];
    result.actions = [];
    result.cards.forEach(card => {
      result.checklists.push(
        ...Checklists.find({
          cardId: card._id,
        }).fetch(),
      );
      result.checklistItems.push(
        ...ChecklistItems.find({
          cardId: card._id,
        }).fetch(),
      );
      result.subtaskItems.push(
        ...Cards.find({
          parentId: card._id,
        }).fetch(),
      );
    });
    result.rules.forEach(rule => {
      result.triggers.push(
        ...Triggers.find(
          {
            _id: rule.triggerId,
          },
          noBoardId,
        ).fetch(),
      );
      result.actions.push(
        ...Actions.find(
          {
            _id: rule.actionId,
          },
          noBoardId,
        ).fetch(),
      );
    });

    // we also have to export some user data - as the other elements only
    // include id but we have to be careful:
    // 1- only exports users that are linked somehow to that board
    // 2- do not export any sensitive information
    const users = {};
    result.members.forEach(member => {
      users[member.userId] = true;
    });
    result.lists.forEach(list => {
      users[list.userId] = true;
    });
    result.cards.forEach(card => {
      users[card.userId] = true;
      if (card.members) {
        card.members.forEach(memberId => {
          users[memberId] = true;
        });
      }
    });
    result.comments.forEach(comment => {
      users[comment.userId] = true;
    });
    result.activities.forEach(activity => {
      users[activity.userId] = true;
    });
    result.checklists.forEach(checklist => {
      users[checklist.userId] = true;
    });
    const byUserIds = {
      _id: {
        $in: Object.getOwnPropertyNames(users),
      },
    };
    // we use whitelist to be sure we do not expose inadvertently
    // some secret fields that gets added to User later.
    const userFields = {
      fields: {
        _id: 1,
        username: 1,
        'profile.fullname': 1,
        'profile.initials': 1,
        'profile.avatarUrl': 1,
      },
    };
    result.users = Users.find(byUserIds, userFields)
      .fetch()
      .map(user => {
        // user avatar is stored as a relative url, we export absolute
        if ((user.profile || {}).avatarUrl) {
          user.profile.avatarUrl = FlowRouter.url(user.profile.avatarUrl);
        }
        return user;
      });

    const jdata = result;
    //init exceljs workbook
    const Excel = require('exceljs');
    const workbook = new Excel.Workbook();
    workbook.creator = TAPi18n.__('export-board');
    workbook.lastModifiedBy = TAPi18n.__('export-board');
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    const filename = `${jdata.title}.xlsx`;
    //init worksheet
    const worksheet = workbook.addWorksheet(jdata.title, {
      properties: {
        tabColor: {
          argb: 'FFC0000',
        },
      },
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
      },
    });
    //get worksheet
    const ws = workbook.getWorksheet(jdata.title);
    ws.properties.defaultRowHeight = 20;
    //init columns
    //Excel font. Western: Arial. zh-CN: 宋体
    ws.columns = [
      {
        key: 'a',
        width: 7,
      },
      {
        key: 'b',
        width: 16,
      },
      {
        key: 'c',
        width: 7,
      },
      {
        key: 'd',
        width: 14,
        style: {
          font: {
            name: TAPi18n.__('excel-font'),
            size: '10',
          },
          numFmt: 'yyyy/mm/dd hh:mm:ss',
        },
      },
      {
        key: 'e',
        width: 14,
        style: {
          font: {
            name: TAPi18n.__('excel-font'),
            size: '10',
          },
          numFmt: 'yyyy/mm/dd hh:mm:ss',
        },
      },
      {
        key: 'f',
        width: 10,
      },
      {
        key: 'g',
        width: 10,
      },
      {
        key: 'h',
        width: 18,
      },
    ];

    //add title line
    ws.mergeCells('A1:H1');
    ws.getCell('A1').value = jdata.title;
    ws.getCell('A1').style = {
      font: {
        name: TAPi18n.__('excel-font'),
        size: '20',
      },
    };
    ws.getCell('A1').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    ws.getRow(1).height = 40;
    //get member info
    let jmem = '';
    const jmeml = {};
    for (const i in jdata.users) {
      jmem = `${jmem + jdata.users[i].profile.fullname},`;
      jmeml[jdata.users[i]._id] = jdata.users[i].profile.fullname;
    }
    jmem = jmem.substr(0, jmem.length - 1);
    //get kanban list info
    const jlist = {};
    for (const klist in jdata.lists) {
      jlist[jdata.lists[klist]._id] = jdata.lists[klist].title;
    }
    //get kanban label info
    const jlabel = {};
    for (const klabel in jdata.labels) {
      jlabel[jdata.labels[klabel]._id] = jdata.labels[klabel].name;
    }
    //add data +8 hours
    function add8hours(jdate) {
      const curdate = new Date(jdate);
      return new Date(curdate.setHours(curdate.getHours() + 8));
    }
    //add blank row
    ws.addRow().values = ['', '', '', '', '', '', '', ''];
    //add kanban info
    ws.addRow().values = [
      TAPi18n.__('createdAt'),
      add8hours(jdata.createdAt),
      TAPi18n.__('modifiedAt'),
      add8hours(jdata.modifiedAt),
      TAPi18n.__('r-member'),
      jmem,
    ];
    ws.getRow(3).font = {
      name: TAPi18n.__('excel-font'),
      size: 10,
      bold: true,
    };
    ws.getCell('B3').style = {
      font: {
        name: TAPi18n.__('excel-font'),
        size: '10',
        bold: true,
      },
      numFmt: 'yyyy/mm/dd hh:mm:ss',
    };
    //cell center
    function cellCenter(cellno) {
      ws.getCell(cellno).alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
    }
    cellCenter('A3');
    cellCenter('B3');
    cellCenter('C3');
    cellCenter('D3');
    cellCenter('E3');
    cellCenter('F3');
    ws.getRow(3).height = 20;
    //all border
    function allBorder(cellno) {
      ws.getCell(cellno).border = {
        top: {
          style: 'thin',
        },
        left: {
          style: 'thin',
        },
        bottom: {
          style: 'thin',
        },
        right: {
          style: 'thin',
        },
      };
    }
    allBorder('A3');
    allBorder('B3');
    allBorder('C3');
    allBorder('D3');
    allBorder('E3');
    allBorder('F3');
    //add blank row
    ws.addRow().values = ['', '', '', '', '', '', '', '', ''];
    //add card title
    //ws.addRow().values = ['编号', '标题', '创建人', '创建时间', '更新时间', '列表', '成员', '描述', '标签'];
    ws.addRow().values = [
      TAPi18n.__('number'),
      TAPi18n.__('title'),
      TAPi18n.__('owner'),
      TAPi18n.__('createdAt'),
      TAPi18n.__('last-modified-at'),
      TAPi18n.__('list'),
      TAPi18n.__('description'),
      TAPi18n.__('status'),
    ];
    ws.getRow(5).height = 20;
    allBorder('A5');
    allBorder('B5');
    allBorder('C5');
    allBorder('D5');
    allBorder('E5');
    allBorder('F5');
    allBorder('G5');
    allBorder('H5');
    allBorder('I5');
    cellCenter('A5');
    cellCenter('B5');
    cellCenter('C5');
    cellCenter('D5');
    cellCenter('E5');
    cellCenter('F5');
    cellCenter('G5');
    cellCenter('H5');
    cellCenter('I5');
    ws.getRow(5).font = {
      name: TAPi18n.__('excel-font'),
      size: 12,
      bold: true,
    };
    //add blank row
    //add card info
    for (const i in jdata.cards) {
      const jcard = jdata.cards[i];
      //get member info
      let jcmem = '';
      for (const j in jcard.members) {
        jcmem += jmeml[jcard.members[j]];
        jcmem += ' ';
      }
      //get card label info
      let jclabel = '';
      for (const jl in jcard.labelIds) {
        jclabel += jlabel[jcard.labelIds[jl]];
        jclabel += ' ';
      }
      //      console.log(jclabel);

      //add card detail
      const t = Number(i) + 1;
      ws.addRow().values = [
        t.toString(),
        jcard.title,
        jmeml[jcard.userId],
        add8hours(jcard.createdAt),
        add8hours(jcard.dateLastActivity),
        jlist[jcard.listId],
        jcmem,
        jcard.description,
        jclabel,
      ];
      const y = Number(i) + 6;
      //ws.getRow(y).height = 25;
      allBorder(`A${y}`);
      allBorder(`B${y}`);
      allBorder(`C${y}`);
      allBorder(`D${y}`);
      allBorder(`E${y}`);
      allBorder(`F${y}`);
      allBorder(`G${y}`);
      allBorder(`H${y}`);
      allBorder(`I${y}`);
      cellCenter(`A${y}`);
      ws.getCell(`B${y}`).alignment = {
        wrapText: true,
      };
      ws.getCell(`H${y}`).alignment = {
        wrapText: true,
      };
      ws.getCell(`I${y}`).alignment = {
        wrapText: true,
      };
    }
    //    var exporte=new Stream;
    workbook.xlsx.write(res).then(function() {});
    //     return exporte;
  }

  canExport(user) {
    const board = Boards.findOne(this._boardId);
    return board && board.isVisibleBy(user);
  }
}
