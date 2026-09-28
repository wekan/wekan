'use strict';
const fields = [
  ['Sprint', 'sprintId', 'Scrum sprint'], ['PastSprints', 'pastSprintIds', 'Past Scrum sprints'],
  ['Release', 'releaseId', 'Scrum release'], ['IssueType', 'issueType', 'Scrum issue type'],
  ['AcceptanceCriteria', 'acceptanceCriteria', 'Scrum acceptance criteria'], ['BacklogRank', 'backlogRank', 'Scrum backlog rank'],
];
const scrumVisibility = board => fields.map(([suffix]) => board?.scrum?.visibility?.[`card${suffix}`] === true);
async function appendRuleCardScrum({ card, board, readRecord, add }) {
  const visibility = scrumVisibility(board), references = [];
  for (let index = 0; index < fields.length; index++) {
    if (!visibility[index]) continue;
    const [, field, label] = fields[index], value = card.scrum?.[field];
    if (!['sprintId', 'pastSprintIds', 'releaseId'].includes(field)) { add(label, value); continue; }
    const ids = field === 'pastSprintIds' ? (Array.isArray(value) ? value : []) : [value];
    const names = [], kind = field === 'releaseId' ? 'release' : 'sprint';
    for (const id of [...new Set(ids)]) {
      if (typeof id !== 'string' || !id) continue;
      const record = await readRecord(kind, id, card.boardId);
      if (!record || record._id !== id || record.boardId !== card.boardId || record.deletedAt) continue;
      if (typeof record.name !== 'string') continue;
      names.push(record.name); references.push({ kind, id, name: record.name });
    }
    add(label, names);
  }
  return async () => {
    for (const { kind, id, name } of references) {
      const record = await readRecord(kind, id, card.boardId);
      if (!record || record._id !== id || record.boardId !== card.boardId || record.deletedAt || record.name !== name) {
        throw new Error('rule-email-scrum-changed');
      }
    }
  };
}
module.exports = { scrumVisibility, appendRuleCardScrum };
