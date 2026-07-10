import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { createWorkbook, createWorkbookWriter } from './createWorkbook';
import { 
  formatDateTime, 
  formatDate, 
  formatTime, 
  getISOWeek, 
  isValidDate, 
  isBefore, 
  isAfter, 
  isSame, 
  add, 
  subtract, 
  startOf, 
  endOf, 
  format, 
  parseDate, 
  now, 
  createDate, 
  fromNow, 
  calendar 
} from '/imports/lib/dateUtils';

// exporter maybe is broken since Gridfs introduced, add fs and path

class ExporterExcel {
  constructor(boardId, userLanguage) {
    this._boardId = boardId;
    this.userLanguage = userLanguage;
  }

  async build(res) {
    // ─────────────────────────────────────────────────────────────────────────
    // Streaming Excel export. The previous version loaded the ENTIRE board
    // (cards, comments, activities, checklists, subtasks, rules, custom fields)
    // into memory and built the whole styled workbook before writing it out —
    // gigabytes of RAM for a board with thousands of cards, most of it data the
    // spreadsheet never even shows (activities/checklists/subtasks/rules are not
    // rendered). This version:
    //   * loads only the small lookup tables (lists, swimlanes, labels, users),
    //   * streams cards and comments a document at a time from raw cursors,
    //   * writes rows through the exceljs streaming WorkbookWriter, committing
    //     each row straight to `res` so peak memory stays flat, and
    //   * resolves parent-card titles via a cheap id→title map instead of the old
    //     O(n²) `result.cards.find()` per card.
    // The visible layout/styling is unchanged.
    // ─────────────────────────────────────────────────────────────────────────
    const noBoardId = { fields: { boardId: 0 } };
    const cardsRaw = require('/models/cards').default.rawCollection();
    const cardCommentsRaw = require('/models/cardComments').default.rawCollection();
    const cardSelector = { boardId: this._boardId, linkedId: { $in: ['', null] } };

    const board = await ReactiveCache.getBoard(this._boardId, { fields: { stars: 0 } });
    const result = {
      title: board.title,
      description: board.description,
      createdAt: board.createdAt,
      modifiedAt: board.modifiedAt,
      labels: board.labels || [],
      members: board.members || [],
    };
    const lists = await ReactiveCache.getLists({ boardId: this._boardId }, noBoardId);
    const swimlanes = await ReactiveCache.getSwimlanes({ boardId: this._boardId }, noBoardId);

    // Small lookup maps.
    const jlist = {};
    lists.forEach(l => { jlist[l._id] = l.title; });
    const jswimlane = {};
    swimlanes.forEach(s => { jswimlane[s._id] = s.title; });
    const jlabel = {};
    let isFirstLabel = 1;
    result.labels.forEach(label => {
      jlabel[label._id] = isFirstLabel === 0 ? `,${label.name}` : label.name;
      isFirstLabel = 0;
    });

    // Pass 1 — stream cards once to build the id→title map (for parent lookups)
    // and collect referenced user ids. Only ids/titles are held, never full docs.
    const cardTitleById = {};
    const userIds = new Set();
    result.members.forEach(m => userIds.add(m.userId));
    lists.forEach(l => userIds.add(l.userId));
    {
      const cursor = cardsRaw.find(cardSelector, { projection: { _id: 1, title: 1, userId: 1, members: 1, assignees: 1 } });
      for await (const c of cursor) {
        cardTitleById[c._id] = c.title;
        if (c.userId) userIds.add(c.userId);
        (c.members || []).forEach(id => userIds.add(id));
        (c.assignees || []).forEach(id => userIds.add(id));
      }
    }
    // Pass 1b — comment authors.
    {
      const cursor = cardCommentsRaw.find({ cardId: { $in: Object.keys(cardTitleById) } }, { projection: { userId: 1 } });
      for await (const c of cursor) { if (c.userId) userIds.add(c.userId); }
    }

    const userFields = { fields: { _id: 1, username: 1, 'profile.initials': 1, 'profile.avatarUrl': 1 } };
    const users = await ReactiveCache.getUsers({ _id: { $in: Array.from(userIds).filter(Boolean) } }, userFields);
    // member/assignee username map + comma-joined member list, as before.
    const jmeml = {};
    let jmem = '';
    users.forEach(u => { jmeml[u._id] = u.username; jmem += `${u.username},`; });
    jmem = jmem.substr(0, jmem.length - 1);

    //init exceljs streaming workbook (writes rows straight to res)
    const workbook = createWorkbookWriter(res);
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
    // jmem / jmeml / jlist / jswimlane / jlabel were computed above from cursors.
    // assignee username map is identical to the member username map.
    const jassigl = jmeml;
    //add data +8 hours
    function addTZhours(jdate) {
      if (!jdate) { return ' '; }
      const curdate = new Date(jdate);
      const checkCorrectDate = new Date(curdate);
      if (isValidDate(checkCorrectDate)) {
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
    // Header rows 1-7 are fully built — commit them to the stream (in order)
    // before streaming card rows. The streaming writer requires committed rows
    // to be finalized in ascending order and never touched again.
    for (let r = 1; r <= 7; r++) { ws.getRow(r).commit(); }

    let cardIdx = 0;
    {
      const cursor = cardsRaw.find(cardSelector);
      for await (const jcard of cursor) {
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
        //get parent name (via id->title map, not an O(n²) scan of all cards)
        if (jcard.parentId) {
          jcard.parentCardTitle = cardTitleById[jcard.parentId] || '';
        }

        //add card detail
        const t = cardIdx + 1;
        const row = ws.addRow([
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
        ]);
        const y = row.number;
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
        row.commit();
        cardIdx++;
      }
    }
    ws.commit();



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
    // Commit header rows 1-3 before streaming comment rows (in-order commit).
    for (let r = 1; r <= 3; r++) { ws2.getRow(r).commit(); }
    let commentcnt = 0;
    {
      const cursor = cardCommentsRaw.find({ cardId: { $in: Object.keys(cardTitleById) } });
      for await (const jcomment of cursor) {
        //card title (via id->title map, not an O(n²) scan)
        jcomment.cardTitle = cardTitleById[jcomment.cardId] || '';
        if (jcomment.cardTitle == '') {
          continue;
        }
        //add comment detail
        commentcnt++;
        const row = ws2.addRow([
          commentcnt.toString(),
          jcomment.text,
          jcomment.cardTitle,
          jmeml[jcomment.userId] || jcomment.userId || '',
          addTZhours(jcomment.createdAt),
          addTZhours(jcomment.modifiedAt),
        ]);
        const y = row.number;
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
        row.commit();
      }
    }
    ws2.commit();
    await workbook.commit();
  }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }
}

export { ExporterExcel };
