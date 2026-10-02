import { Meteor } from 'meteor/meteor';
import { getScrumBoardData, getScrumDailyHistory } from '/server/scrum';
const { velocityReports } = require('/models/lib/scrumReports');

export async function loadScrumChartData(userId, boardId, chartKey, options = {}) {
  if (chartKey === 'scrumDaily') {
    if (typeof options.sprintId !== 'string' || !options.sprintId || options.sprintId.length > 200) throw new Meteor.Error('invalid-sprint');
    return getScrumDailyHistory(userId, boardId, options.sprintId);
  }
  const data = await getScrumBoardData(userId, boardId);
  if (data.importPending) throw new Meteor.Error('scrum-import-pending', 'The Scrum import is incomplete. Report exports are unavailable.');
  // Reports computed by getScrumBoardData, from the rows the reader may see.
  if (chartKey === 'scrumVelocity') return { reports: velocityReports(data.sprints), partial: data.partial };
  if (chartKey !== 'scrumSprint') throw new Meteor.Error('invalid-chart');
  if (typeof options.sprintId !== 'string' || options.sprintId.length > 200) throw new Meteor.Error('invalid-sprint');
  const sprint = data.sprints.find(s => s._id === options.sprintId);
  if (!sprint) throw new Meteor.Error('not-found', 'Sprint not found on this board');
  return { reports: sprint.closeSnapshot && sprint.report ? [sprint.report] : [], partial: data.partial };
}
