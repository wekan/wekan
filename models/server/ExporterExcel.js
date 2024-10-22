import { ReactiveCache } from '/imports/reactiveCache';
import moment from 'moment/min/moment-with-locales';
import { TAPi18n } from '/imports/i18n';
import { createWorkbook } from './createWorkbook';

// exporter maybe is broken since Gridfs introduced, add fs and path

class ExporterExcel {
  constructor(boardId, userLanguage) {
    this._boardId = boardId;
    this.userLanguage = userLanguage;
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
      ReactiveCache.getBoard(this._boardId, {
        fields: {
          stars: 0,
        },
      }),
    );
    result.lists = ReactiveCache.getLists(byBoard, noBoardId);
    result.cards = ReactiveCache.getCards(byBoardNoLinked, noBoardId);
    result.swimlanes = ReactiveCache.getSwimlanes(byBoard, noBoardId);
    result.customFields = ReactiveCache.getCustomFields(
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
    );
    result.comments = ReactiveCache.getCardComments(byBoard, noBoardId);
    result.activities = ReactiveCache.getActivities(byBoard, noBoardId);
    result.rules = ReactiveCache.getRules(byBoard, noBoardId);
    result.checklists = [];
    result.checklistItems = [];
    result.subtaskItems = [];
    result.triggers = [];
    result.actions = [];
    result.cards.forEach((card) => {
      result.checklists.push(
        ...ReactiveCache.getChecklists({
          cardId: card._id,
        }),
      );
      result.checklistItems.push(
        ...ReactiveCache.getChecklistItems({
          cardId: card._id,
        }),
      );
      result.subtaskItems.push(
        ...ReactiveCache.getCards({
          parentId: card._id,
        }),
      );
    });
    result.rules.forEach((rule) => {
      result.triggers.push(
        ...ReactiveCache.getTriggers(
          {
            _id: rule.triggerId,
          },
          noBoardId,
        ),
      );
      result.actions.push(
        ...ReactiveCache.getActions(
          {
            _id: rule.actionId,
          },
          noBoardId,
        ),
      );
    });

    // we also have to export some user data - as the other elements only
    // include id but we have to be careful:
    // 1- only exports users that are linked somehow to that board
    // 2- do not export any sensitive information
    const users = {};
    result.members.forEach((member) => {
      users[member.userId] = true;
    });
    result.lists.forEach((list) => {
      users[list.userId] = true;
    });
    result.cards.forEach((card) => {
      users[card.userId] = true;
      if (card.members) {
        card.members.forEach((memberId) => {
          users[memberId] = true;
        });
      }
      if (card.assignees) {
        card.assignees.forEach((memberId) => {
          users[memberId] = true;
        });
      }
    });
    result.comments.forEach((comment) => {
      users[comment.userId] = true;
    });
    result.activities.forEach((activity) => {
      users[activity.userId] = true;
    });
    result.checklists.forEach((checklist) => {
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
        'profile.initials': 1,
        'profile.avatarUrl': 1,
      },
    };
    result.users = ReactiveCache.getUsers(byUserIds, userFields)
      .map((user) => {
        // user avatar is stored as a relative url, we export absolute
        if ((user.profile || {}).avatarUrl) {
          user.profile.avatarUrl = FlowRouter.url(user.profile.avatarUrl);
        }
        return user;
      });



    //init exceljs workbook
    const workbook = createWorkbook();
    workbook.creator = TAPi18n.__('export-board','',this.userLanguage);
    workbook.lastModifiedBy = TAPi18n.__('export-board','',this.userLanguage);
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    const filename = `${result.title}.xlsx`;
    //init worksheet
    let worksheetTitle = result.title;
    if (worksheetTitle.length > 31) {
      // MS Excel doesn't allow worksheet name longer than 31 chars
      // Exceljs truncate names to 31 chars
      let words = worksheetTitle.split(' ');
      let tmpTitle = '';
      for (let i=0;i<words.length; i++) {
        if (words[0].length > 27) {
          // title has no spaces
          tmpTitle = words[0].substr(0,27) + ' ';
          break;
        }
        if(tmpTitle.length + words[i].length < 27) {
          tmpTitle += words[i] + ' ';
        }
        else {
          break;
        }
      }
      worksheetTitle = tmpTitle + '...';
    }
    const worksheet = workbook.addWorksheet(worksheetTitle, {
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
    const ws = workbook.getWorksheet(worksheetTitle);
    ws.properties.defaultRowHeight = 20;
    //init columns
    //Excel font. Western: Arial. zh-CN: 宋体
    ws.columns = [
      {
        key: 'a',
        width: 14,
      },
      {
        key: 'b',
        width: 40,
      },
      {
        key: 'c',
        width: 60,
      },
      {
        key: 'd',
        width: 40,
      },
      {
        key: 'e',
        width: 20,
      },
      {
        key: 'f',
        width: 20,
        style: {
          font: {
            name: TAPi18n.__('excel-font'),
            size: '10',
          },
          numFmt: 'yyyy/mm/dd hh:mm:ss',
        },
      },
      {
        key: 'g',
        width: 20,
        style: {
          font: {
            name: TAPi18n.__('excel-font'),
            size: '10',
          },
          numFmt: 'yyyy/mm/dd hh:mm:ss',
        },
      },
      {
        key: 'h',
        width: 20,
        style: {
          font: {
            name: TAPi18n.__('excel-font'),
            size: '10',
          },
          numFmt: 'yyyy/mm/dd hh:mm:ss',
        },
      },
      {
        key: 'i',
        width: 20,
        style: {
          font: {
            name: TAPi18n.__('excel-font'),
            size: '10',
          },
          numFmt: 'yyyy/mm/dd hh:mm:ss',
        },
      },
      {
        key: 'j',
        width: 20,
        style: {
          font: {
            name: TAPi18n.__('excel-font'),
            size: '10',
          },
          numFmt: 'yyyy/mm/dd hh:mm:ss',
        },
      },
      {
        key: 'k',
        width: 20,
        style: {
          font: {
            name: TAPi18n.__('excel-font'),
            size: '10',
          },
          numFmt: 'yyyy/mm/dd hh:mm:ss',
        },
      },
      {
        key: 'l',
        width: 20,
      },
      {
        key: 'm',
        width: 20,
      },
      {
        key: 'n',
        width: 20,
      },
      {
        key: 'o',
        width: 20,
      },
      {
        key: 'p',
        width: 20,
      },
      {
        key: 'q',
        width: 20,
      },
      {
        key: 'r',
        width: 20,
      },
    ];

    //add title line
    ws.mergeCells('A1:H1');
    ws.getCell('A1').value = result.title;
    ws.getCell('A1').style = {
      font: {
        name: TAPi18n.__('excel-font'),
        size: '20',
      },
    };
    ws.getCell('A1').alignment = {
      vertical: 'middle',
      horizontal: 'left',
    };
    ws.getRow(1).height = 40;
    //get member and assignee info
    let jmem = '';
    let jassig = '';
    const jmeml = {};
    const jassigl = {};
    for (const i in result.users) {
      jmem = `${jmem + result.users[i].username},`;
      jmeml[result.users[i]._id] = result.users[i].username;
    }
    jmem = jmem.substr(0, jmem.length - 1);
    for (const ia in result.users) {
      jassig = `${jassig + result.users[ia].username},`;
      jassigl[result.users[ia]._id] = result.users[ia].username;
    }
    jassig = jassig.substr(0, jassig.length - 1);
    //get kanban list info
    const jlist = {};
    for (const klist in result.lists) {
      jlist[result.lists[klist]._id] = result.lists[klist].title;
    }
    //get kanban swimlanes info
    const jswimlane = {};
    for (const kswimlane in result.swimlanes) {
      jswimlane[result.swimlanes[kswimlane]._id] =
        result.swimlanes[kswimlane].title;
    }
    //get kanban label info
    const jlabel = {};
    var isFirst = 1;
    for (const klabel in result.labels) {
      // console.log(klabel);
      if (isFirst == 0) {
        jlabel[result.labels[klabel]._id] = `,${result.labels[klabel].name}`;
      } else {
        isFirst = 0;
        jlabel[result.labels[klabel]._id] = result.labels[klabel].name;
      }
    }
    //add data +8 hours
    function addTZhours(jdate) {
      if (!jdate) { return ' '; }
      const curdate = new Date(jdate);
      const checkCorrectDate = moment(curdate);
      if (checkCorrectDate.isValid()) {
        return curdate;
      } else {
        return ' ';
      }
      ////Do not add 8 hours to GMT. Use GMT instead.
      ////Could not yet figure out how to get localtime.
      //return new Date(curdate.setHours(curdate.getHours() + 8));
      //return curdate;
    }

    //cell center
    function cellCenter(cellno) {
      ws.getCell(cellno).alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
    }
    function cellLeft(cellno) {
      ws.getCell(cellno).alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      };
    }
    // cell Card alignment
    function cellCardAlignment(cellno) {
      ws.getCell(cellno).alignment = {
        vertical: 'top',
        horizontal: 'left',
        wrapText: true,
      };
    }
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

    //add blank row
    ws.addRow().values = ['', '', '', '', '', ''];

    //add board description
    ws.addRow().values = [
      TAPi18n.__('description','',this.userLanguage),
      result.description,
    ];

    ws.mergeCells('B3:H3');
    ws.getRow(3).height = 40;
    // In MS Excel, we can't use the AutoFit feature on a column that contains a cell merged with cells in other columns.
    // Likewise, we can't use AutoFit on a row that contains a cell merged with cells in other rows.
    ws.getRow(3).font = {
      name: TAPi18n.__('excel-font'),
      size: 10,
    };
    ws.getCell('A3').style = {
      font: {
        name: TAPi18n.__('excel-font'),
        size: '10',
        bold: true,
      },
    };
    ws.getCell(`B3`).alignment = {
      wrapText: true,
      vertical: 'middle',
    };
    cellCenter('A3');

    //add blank row
    ws.addRow().values = ['', '', '', '', '', ''];

    //add kanban info
    ws.addRow().values = [
      TAPi18n.__('createdAt','',this.userLanguage),
      addTZhours(result.createdAt),
      TAPi18n.__('modifiedAt','',this.userLanguage),
      addTZhours(result.modifiedAt),
      TAPi18n.__('members','',this.userLanguage),
      jmem,
    ];
    ws.getRow(5).font = {
      name: TAPi18n.__('excel-font'),
      size: 10,
      bold: true,
    };
    ws.mergeCells('F5:R5');
    ws.getCell('B5').style = {
      font: {
        name: TAPi18n.__('excel-font'),
        size: '10',
        bold: true,
      },
      numFmt: 'yyyy/mm/dd hh:mm:ss',
    };
    ws.getCell('D5').style = {
      font: {
        name: TAPi18n.__('excel-font'),
        size: '10',
        bold: true,
      },
      numFmt: 'yyyy/mm/dd hh:mm:ss',
    };

    cellCenter('A5');
    cellCenter('B5');
    cellCenter('C5');
    cellCenter('D5');
    cellCenter('E5');
    cellLeft('F5');
    ws.getRow(5).height = 20;

    allBorder('A5');
    allBorder('B5');
    allBorder('C5');
    allBorder('D5');
    allBorder('E5');
    allBorder('F5');
    //add blank row
    ws.addRow().values = [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ];
    //add card title
    //ws.addRow().values = ['编号', '标题', '创建人', '创建时间', '更新时间', '列表', '成员', '描述', '标签'];
    //this is where order in which the excel file generates
    ws.addRow().values = [
      TAPi18n.__('number','',this.userLanguage),
      TAPi18n.__('title','',this.userLanguage),
      TAPi18n.__('description','',this.userLanguage),
      TAPi18n.__('parent-card','',this.userLanguage),
      TAPi18n.__('owner','',this.userLanguage),
      TAPi18n.__('createdAt','',this.userLanguage),
      TAPi18n.__('last-modified-at','',this.userLanguage),
      TAPi18n.__('card-received','',this.userLanguage),
      TAPi18n.__('card-start','',this.userLanguage),
      TAPi18n.__('card-due','',this.userLanguage),
      TAPi18n.__('card-end','',this.userLanguage),
      TAPi18n.__('list','',this.userLanguage),
      TAPi18n.__('swimlane','',this.userLanguage),
      TAPi18n.__('assignee','',this.userLanguage),
      TAPi18n.__('members','',this.userLanguage),
      TAPi18n.__('labels','',this.userLanguage),
      TAPi18n.__('overtime-hours','',this.userLanguage),
      TAPi18n.__('spent-time-hours','',this.userLanguage),
    ];
    ws.getRow(7).height = 20;
    allBorder('A7');
    allBorder('B7');
    allBorder('C7');
    allBorder('D7');
    allBorder('E7');
    allBorder('F7');
    allBorder('G7');
    allBorder('H7');
    allBorder('I7');
    allBorder('J7');
    allBorder('K7');
    allBorder('L7');
    allBorder('M7');
    allBorder('N7');
    allBorder('O7');
    allBorder('P7');
    allBorder('Q7');
    allBorder('R7');
    cellCenter('A7');
    cellCenter('B7');
    cellCenter('C7');
    cellCenter('D7');
    cellCenter('E7');
    cellCenter('F7');
    cellCenter('G7');
    cellCenter('H7');
    cellCenter('I7');
    cellCenter('J7');
    cellCenter('K7');
    cellCenter('L7');
    cellCenter('M7');
    cellCenter('N7');
    cellCenter('O7');
    cellCenter('P7');
    cellCenter('Q7');
    cellCenter('R7');
    ws.getRow(7).font = {
      name: TAPi18n.__('excel-font'),
      size: 10,
      bold: true,
    };
    //add blank row
    //add card info
    for (const i in result.cards) {
      const jcard = result.cards[i];
      //get member info
      let jcmem = '';
      for (const j in jcard.members) {
        jcmem += jmeml[jcard.members[j]];
        jcmem += ' ';
      }
      //get assignee info
      let jcassig = '';
      for (const ja in jcard.assignees) {
        jcassig += jassigl[jcard.assignees[ja]];
        jcassig += ' ';
      }
      //get card label info
      let jclabel = '';
      for (const jl in jcard.labelIds) {
        jclabel += jlabel[jcard.labelIds[jl]];
        jclabel += ' ';
      }
      //get parent name
      if (jcard.parentId) {
        const parentCard = result.cards.find(
          (card) => card._id === jcard.parentId,
        );
        jcard.parentCardTitle = parentCard ? parentCard.title : '';
      }

      //add card detail
      const t = Number(i) + 1;
      ws.addRow().values = [
        t.toString(),
        jcard.title,
        jcard.description,
        jcard.parentCardTitle,
        jmeml[jcard.userId],
        addTZhours(jcard.createdAt),
        addTZhours(jcard.dateLastActivity),
        addTZhours(jcard.receivedAt),
        addTZhours(jcard.startAt),
        addTZhours(jcard.dueAt),
        addTZhours(jcard.endAt),
        jlist[jcard.listId],
        jswimlane[jcard.swimlaneId],
        jcassig,
        jcmem,
        jclabel,
        jcard.isOvertime ? 'true' : 'false',
        jcard.spentTime,
      ];
      const y = Number(i) + 8;
      //ws.getRow(y).height = 25;
      ws.getRow(y).font = {
        name: TAPi18n.__('excel-font'),
        size: 10,
      };
      // Border
      allBorder(`A${y}`);
      allBorder(`B${y}`);
      allBorder(`C${y}`);
      allBorder(`D${y}`);
      allBorder(`E${y}`);
      allBorder(`F${y}`);
      allBorder(`G${y}`);
      allBorder(`H${y}`);
      allBorder(`I${y}`);
      allBorder(`J${y}`);
      allBorder(`K${y}`);
      allBorder(`L${y}`);
      allBorder(`M${y}`);
      allBorder(`N${y}`);
      allBorder(`O${y}`);
      allBorder(`P${y}`);
      allBorder(`Q${y}`);
      allBorder(`R${y}`);
      // Alignment
      ws.getCell(`A${y}`).alignment = {
        vertical: 'top',
        horizontal: 'right',
        wrapText: true,
      };
      cellCardAlignment(`B${y}`);
      cellCardAlignment(`C${y}`);
      cellCardAlignment(`D${y}`);
      cellCardAlignment(`E${y}`);
      cellCardAlignment(`F${y}`);
      cellCardAlignment(`G${y}`);
      cellCardAlignment(`H${y}`);
      cellCardAlignment(`I${y}`);
      cellCardAlignment(`J${y}`);
      cellCardAlignment(`K${y}`);
      cellCardAlignment(`L${y}`);
      cellCardAlignment(`M${y}`);
      cellCardAlignment(`N${y}`);
      cellCardAlignment(`O${y}`);
      cellCardAlignment(`P${y}`);
      ws.getCell(`Q${y}`).alignment = {
        vertical: 'top',
        horizontal: 'center',
        wrapText: true,
      };
      ws.getCell(`R${y}`).alignment = {
        vertical: 'top',
        horizontal: 'center',
        wrapText: true,
      };
    }



    //Activities worksheet
    //init worksheet
    const worksheet2 = workbook.addWorksheet(TAPi18n.__('activity','',this.userLanguage), {
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
    const ws2 = workbook.getWorksheet(TAPi18n.__('activity','',this.userLanguage));
    ws2.properties.defaultRowHeight = 20;
    //init columns
    ws2.columns = [
      {
        key: 'a',
        width: 14,
      },
      {
        key: 'b',
        width: 60,
      },
      {
        key: 'c',
        width: 40,
      },
      {
        key: 'd',
        width: 40,
      },
      {
        key: 'e',
        width: 30,
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
        width: 30,
        style: {
          font: {
            name: TAPi18n.__('excel-font'),
            size: '10',
          },
          numFmt: 'yyyy/mm/dd hh:mm:ss',
        },
      },
    ];
    // cell Card alignment
    function cellCardAlignmentWs2(cellno) {
      ws2.getCell(cellno).alignment = {
        vertical: 'top',
        horizontal: 'left',
        wrapText: true,
      };
    }
    //all border
    function allBorderWs2(cellno) {
      ws2.getCell(cellno).border = {
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

    //add title line
    ws2.mergeCells('A1:F1');
    ws2.getCell('A1').value = result.title;
    ws2.getCell('A1').style = {
      font: {
        name: TAPi18n.__('excel-font'),
        size: '20',
      },
    };
    ws2.getCell('A1').alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    ws2.getRow(1).height = 40;

    //add blank row
    ws2.addRow().values = ['', '', '', '', '', ''];

    //add comment title
    ws2.addRow().values = [
      TAPi18n.__('number','',this.userLanguage),
      TAPi18n.__('activity','',this.userLanguage),
      TAPi18n.__('card','',this.userLanguage),
      TAPi18n.__('owner','',this.userLanguage),
      TAPi18n.__('createdAt','',this.userLanguage),
      TAPi18n.__('last-modified-at','',this.userLanguage),
    ];
    ws2.getRow(3).height = 20;
    ws2.getRow(3).font = {
      name: TAPi18n.__('excel-font'),
      size: 10,
      bold: true,
    };
    ws2.getRow(3).alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    allBorderWs2('A3');
    allBorderWs2('B3');
    allBorderWs2('C3');
    allBorderWs2('D3');
    allBorderWs2('E3');
    allBorderWs2('F3');

    //add comment info
    let commentcnt = 0;
    for (const i in result.comments) {
      const jcomment = result.comments[i];
      //card title
      const parentCard = result.cards.find(
        (card) => card._id === jcomment.cardId,
      );
      jcomment.cardTitle = parentCard ? parentCard.title : '';
      if (jcomment.cardTitle == '') {
        continue;
      }
      //add comment detail
      commentcnt++;
      ws2.addRow().values = [
        commentcnt.toString(),
        jcomment.text,
        jcomment.cardTitle,
        jmeml[jcomment.userId],
        addTZhours(jcomment.createdAt),
        addTZhours(jcomment.modifiedAt),
      ];
      const y = commentcnt + 3;
      ws2.getRow(y).font = {
        name: TAPi18n.__('excel-font'),
        size: 10,
      };
      // Border
      allBorderWs2(`A${y}`);
      allBorderWs2(`B${y}`);
      allBorderWs2(`C${y}`);
      allBorderWs2(`D${y}`);
      allBorderWs2(`E${y}`);
      allBorderWs2(`F${y}`);
      // Alignment
      ws2.getCell(`A${y}`).alignment = {
        vertical: 'top',
        horizontal: 'right',
        wrapText: true,
      };
      cellCardAlignmentWs2(`B${y}`);
      cellCardAlignmentWs2(`C${y}`);
      cellCardAlignmentWs2(`D${y}`);
      cellCardAlignmentWs2(`E${y}`);
      cellCardAlignmentWs2(`F${y}`);

    }
    workbook.xlsx.write(res).then(function () {});
  }

  canExport(user) {
    const board = ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }
}

export { ExporterExcel };
