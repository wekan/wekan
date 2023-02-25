import { ReactiveCache } from '/imports/reactiveCache';
// exporter maybe is broken since Gridfs introduced, add fs and path
import { createWorkbook } from './createWorkbook';

class ExporterCardPDF {
  constructor(boardId) {
    this._boardId = boardId;
  }

  build(res) {

    /*
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
        workbook.creator = TAPi18n.__('export-board');
        workbook.lastModifiedBy = TAPi18n.__('export-board');
        workbook.created = new Date();
        workbook.modified = new Date();
        workbook.lastPrinted = new Date();
        const filename = `${result.title}.xlsx`;
        //init worksheet
        const worksheet = workbook.addWorksheet(result.title, {
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
        const ws = workbook.getWorksheet(result.title);
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
          horizontal: 'center',
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
        //add blank row
        ws.addRow().values = ['', '', '', '', '', ''];
        //add kanban info
        ws.addRow().values = [
          TAPi18n.__('createdAt'),
          addTZhours(result.createdAt),
          TAPi18n.__('modifiedAt'),
          addTZhours(result.modifiedAt),
          TAPi18n.__('members'),
          jmem,
        ];
        ws.getRow(3).font = {
          name: TAPi18n.__('excel-font'),
          size: 10,
          bold: true,
        };
        ws.mergeCells('F3:R3');
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
        function cellLeft(cellno) {
          ws.getCell(cellno).alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          };
        }
        cellCenter('A3');
        cellCenter('B3');
        cellCenter('C3');
        cellCenter('D3');
        cellCenter('E3');
        cellLeft('F3');
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
          TAPi18n.__('number'),
          TAPi18n.__('title'),
          TAPi18n.__('description'),
          TAPi18n.__('parent-card'),
          TAPi18n.__('owner'),
          TAPi18n.__('createdAt'),
          TAPi18n.__('last-modified-at'),
          TAPi18n.__('card-received'),
          TAPi18n.__('card-start'),
          TAPi18n.__('card-due'),
          TAPi18n.__('card-end'),
          TAPi18n.__('list'),
          TAPi18n.__('swimlane'),
          TAPi18n.__('assignee'),
          TAPi18n.__('members'),
          TAPi18n.__('labels'),
          TAPi18n.__('overtime-hours'),
          TAPi18n.__('spent-time-hours'),
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
        allBorder('J5');
        allBorder('K5');
        allBorder('L5');
        allBorder('M5');
        allBorder('N5');
        allBorder('O5');
        allBorder('P5');
        allBorder('Q5');
        allBorder('R5');
        cellCenter('A5');
        cellCenter('B5');
        cellCenter('C5');
        cellCenter('D5');
        cellCenter('E5');
        cellCenter('F5');
        cellCenter('G5');
        cellCenter('H5');
        cellCenter('I5');
        cellCenter('J5');
        cellCenter('K5');
        cellCenter('L5');
        cellCenter('M5');
        cellCenter('N5');
        cellCenter('O5');
        cellCenter('P5');
        cellCenter('Q5');
        cellCenter('R5');
        ws.getRow(5).font = {
          name: TAPi18n.__('excel-font'),
          size: 12,
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
          allBorder(`J${y}`);
          allBorder(`K${y}`);
          allBorder(`L${y}`);
          allBorder(`M${y}`);
          allBorder(`N${y}`);
          allBorder(`O${y}`);
          allBorder(`P${y}`);
          allBorder(`Q${y}`);
          allBorder(`R${y}`);
          cellCenter(`A${y}`);
          ws.getCell(`B${y}`).alignment = {
            wrapText: true,
          };
          ws.getCell(`C${y}`).alignment = {
            wrapText: true,
          };
          ws.getCell(`M${y}`).alignment = {
            wrapText: true,
          };
          ws.getCell(`N${y}`).alignment = {
            wrapText: true,
          };
          ws.getCell(`O${y}`).alignment = {
            wrapText: true,
          };
        }
        workbook.xlsx.write(res).then(function () {});
        */

    var doc = new PDFDocument({size: 'A4', margin: 50});
    doc.fontSize(12);
    doc.text('Some test text', 10, 30, {align: 'center', width: 200});
    this.response.writeHead(200, {
      'Content-type': 'application/pdf',
      'Content-Disposition': "attachment; filename=test.pdf"
    });
    this.response.end( doc.outputSync() );

  }

  canExport(user) {
    const board = ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }
}

export { ExporterCardPDF };
