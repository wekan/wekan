import { Meteor } from 'meteor/meteor';
import { getScrumBoardData } from '/server/scrum';
const { sprintReport, velocityRows } = require('/models/lib/scrumReports');

export async function loadScrumChartData(userId, boardId, chartKey, options = {}) {
  const data = await getScrumBoardData(userId, boardId);
  if (chartKey === 'scrumVelocity') return { reports: velocityRows(data.sprints), partial: data.partial };
  if (chartKey !== 'scrumSprint') throw new Meteor.Error('invalid-chart');
  if (typeof options.sprintId !== 'string' || options.sprintId.length > 200) throw new Meteor.Error('invalid-sprint');
  const sprint = data.sprints.find(s => s._id === options.sprintId);
  if (!sprint) throw new Meteor.Error('not-found', 'Sprint not found on this board');
  return { reports: sprint.closeSnapshot ? [sprintReport(sprint)] : [], partial: data.partial };
}
