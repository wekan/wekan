// "One board per project": a document of the generalized importer (the
// Kanboard-shaped board every external parser makes, models/kanboardCreator.js)
// split into one document per swimlane, so a tool's export that holds several
// projects - Vikunja's, Plane's and Redmine's projects, Wrike's folders,
// ClickUp's lists - becomes one board per project, as a Trello .zip of many
// boards does. Plain JavaScript, so tests/importSplit.test.cjs runs it in Node.
//
// Each part keeps every list (a project shares its tool's workflow) - or,
// when the parser says which lists each swimlane had (`swimlane_columns`, as
// Kanri's all-data export does, whose boards have columns of their own), just
// those - the labels and the board-level data, takes the swimlane's name as its board name
// and puts its cards in its Default swimlane. A parent card or a dependency on
// a card that went to another board cannot be kept: it is reported in that
// part's loss report. The source's own report goes with the first part, so it
// is told once.

export const MAX_SPLIT_BOARDS = 200;
const laneOf = task => task.swimlane_name || task.swimlane || 'Default';

export function splitBySwimlane(parsed) {
  const tasks = Array.isArray(parsed && parsed.tasks) ? parsed.tasks : [];
  const lanes = [...new Set(tasks.map(laneOf))];
  if (lanes.length < 2) return [parsed];
  if (lanes.length > MAX_SPLIT_BOARDS) {
    throw new Error(`the import has ${lanes.length} swimlanes; one board per project makes at most ${MAX_SPLIT_BOARDS} boards`);
  }
  const laneOfRef = new Map();
  tasks.forEach(task => { if (task.ref !== undefined && task.ref !== null && task.ref !== '') laneOfRef.set(String(task.ref), laneOf(task)); });
  const boardName = (parsed.board && parsed.board.name) || 'Imported board';
  return lanes.map((lane, index) => {
    const unsupported = index === 0 && Array.isArray(parsed.unsupported) ? [...parsed.unsupported] : [];
    const elsewhere = ref => ref !== undefined && ref !== null && laneOfRef.has(String(ref)) && laneOfRef.get(String(ref)) !== lane;
    const own = tasks.filter(task => laneOf(task) === lane).map(task => {
      const copy = { ...task, swimlane_name: 'Default' };
      delete copy.swimlane;
      const where = `/${lane}/${task.ref || task.title}`;
      if (elsewhere(task.parent_ref)) {
        unsupported.push({ path: where, reason: `its parent card "${task.parent_ref}" went to the board "${laneOfRef.get(String(task.parent_ref))}"` });
        delete copy.parent_ref;
      }
      if (Array.isArray(task.dependencies)) {
        copy.dependencies = task.dependencies.filter(dependency => {
          if (!elsewhere(dependency && dependency.ref)) return true;
          unsupported.push({ path: where, reason: `its dependency on "${dependency.ref}" went to the board "${laneOfRef.get(String(dependency.ref))}"` });
          return false;
        });
      }
      return copy;
    });
    const ownColumns = parsed.swimlane_columns && Array.isArray(parsed.swimlane_columns[lane])
      ? parsed.swimlane_columns[lane].map(title => ({ title })) : parsed.columns;
    const part = {
      ...parsed,
      columns: ownColumns,
      board: { ...(parsed.board || {}), name: lane === 'Default' ? boardName : lane },
      swimlanes: [{ name: 'Default' }],
      tasks: own,
      warnings: index === 0 && Array.isArray(parsed.warnings) ? parsed.warnings : [],
      unsupported,
    };
    delete part.swimlane_columns;
    return part;
  });
}
