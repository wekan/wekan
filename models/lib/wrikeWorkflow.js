// A Wrike workflow, and the WeKan board lists and rules it corresponds to.
// Plain JavaScript, so tests/wrikeWorkflow.test.cjs runs it in Node; the
// Wrike Excel export (models/lib/wrikeFormat.js), the "Wrike workflow" board
// export and the Rules import/export popup all use it, so the three agree on
// every workflow and status name.
//
// What Wrike documents:
//   - A workflow is a name and an ordered list of custom statuses; each status
//     has a name (128 symbols max), a color and one of four status groups:
//     Active, Completed, Deferred, Cancelled. Moving a task into a Completed or
//     Cancelled status closes it; Active and Deferred keep it open.
//   - Its API's Query Workflows (GET /workflows) returns
//       { kind: 'workflows', data: [ { id, name, standard, hidden,
//         customStatuses: [ { id, name, standardName, color, standard, group,
//         hidden } ] } ] }
//     with color one of the fourteen StatusColor values below. Create
//     Workflow (POST /workflows, name) and Modify Workflow (PUT
//     /workflows/{id}, customStatus) take the same fields. Wrike has no file
//     import or export of workflows: that JSON is the only exchange format, so
//     it is the one written and read here.
//   - Its Excel import applies a custom status only when the Workflow and
//     Custom Status cells name a workflow and status that exist in Wrike
//     (case-sensitive); otherwise the default workflow's status is used.
//   - Wrike's automation rules (WHEN-IF-THEN) have no export, import or API,
//     so WeKan rules are not sent to Wrike as rules. What a Wrike workflow does
//     on its own - close a task in a Completed or Cancelled status, reopen it
//     in an Active or Deferred one - is what WeKan does with a rule, so that
//     part travels: as rules into WeKan, and back out as status groups.
//
// The correspondence:
//   WeKan board            <-> Wrike workflow (its name is the board's title)
//   a list, in board order <-> a custom status, in workflow order
//   the list's color       <-> the status color (nearest of each palette)
//   a rule "when a card is moved to list X, mark it complete"
//                          <-> X is in the Completed group (Cancelled when its
//                              name says so)
//   a rule "when a card is moved to list X, mark it incomplete"
//                          <-> X is in the Active group (Deferred when its name
//                              says so)
// A list no rule speaks for takes its group from its name: Wrike's own group
// names, then common English names (Done, Closed, On hold, Rejected ...), else
// Active.

export const WRIKE_STATUS_GROUPS = ['Active', 'Completed', 'Deferred', 'Cancelled'];
export const WRIKE_STATUS_COLORS = ['Brown', 'DarkCyan', 'Gray', 'Blue', 'DarkBlue', 'Orange', 'Red', 'YellowGreen',
  'Purple', 'Yellow', 'Indigo', 'DarkRed', 'Turquoise', 'Green'];
export const MAX_WRIKE_NAME = 128;

const GROUP_COLOR = { Active: 'Blue', Completed: 'Green', Deferred: 'Gray', Cancelled: 'Red' };
const WRIKE_TO_WEKAN = {
  Brown: 'saddlebrown', DarkCyan: 'sky', Gray: 'gray', Blue: 'blue', DarkBlue: 'navy', Orange: 'orange', Red: 'red',
  YellowGreen: 'lime', Purple: 'purple', Yellow: 'yellow', Indigo: 'indigo', DarkRed: 'crimson', Turquoise: 'paleturquoise',
  Green: 'green',
};
const WEKAN_TO_WRIKE = {
  ...Object.fromEntries(Object.entries(WRIKE_TO_WEKAN).map(([wrike, wekan]) => [wekan, wrike])),
  white: 'Gray', black: 'Gray', silver: 'Gray', peachpuff: 'Orange', pink: 'Red', mistyrose: 'Red', plum: 'Purple',
  magenta: 'Purple', darkgreen: 'Green', slateblue: 'Indigo', gold: 'Yellow',
};

const NAMED_GROUPS = [
  ['Completed', /^(completed?|done|closed|finished|resolved|shipped|released|delivered|approved|accepted)$/i],
  ['Cancelled', /^(cancell?ed|canceled|rejected|won'?t (do|fix)|wontfix|abandoned|dropped|declined|obsolete|invalid|duplicate)$/i],
  ['Deferred', /^(deferred|on hold|paused|someday|later|parked|icebox|postponed|waiting)$/i],
];

// The group a list's name alone suggests.
export function wrikeGroupForName(name) {
  const text = String(name || '').trim();
  const own = WRIKE_STATUS_GROUPS.find(group => group.toLowerCase() === text.toLowerCase());
  if (own) return own;
  const named = NAMED_GROUPS.find(([, pattern]) => pattern.test(text));
  return named ? named[0] : 'Active';
}

export const wrikeName = name => String(name || '').trim().slice(0, MAX_WRIKE_NAME);

// A WeKan list color (a named palette color or '#rrggbb') as a Wrike color.
export function wrikeColorForList(color, group) {
  const named = WEKAN_TO_WRIKE[String(color || '').toLowerCase()];
  return named || GROUP_COLOR[group] || 'Gray';
}

export const wekanColorForWrike = color => WRIKE_TO_WEKAN[color] || '';

// The list a moveCard rule names, when it names exactly one.
const movedTo = trigger => (trigger && trigger.activityType === 'moveCard' && trigger.listName && trigger.listName !== '*'
  ? String(trigger.listName) : '');

// rules: [{ trigger, action }] in the portable shape of the Rules export.
// Returns Map(list title -> 'complete' | 'incomplete') for the lists whose
// move rule marks a card complete or incomplete; when rules disagree about a
// list, the last one wins, as it is the one that runs last.
export function completionByList(rules) {
  const byList = new Map();
  for (const rule of Array.isArray(rules) ? rules : []) {
    const list = movedTo(rule && rule.trigger);
    const type = rule && rule.action && rule.action.actionType;
    if (!list) continue;
    if (type === 'markCardComplete') byList.set(list, 'complete');
    else if (type === 'markCardIncomplete') byList.set(list, 'incomplete');
  }
  return byList;
}

// The group of a list: its rule first, then its name.
export function wrikeGroupForList(title, completion) {
  const byName = wrikeGroupForName(title);
  const rule = completion && completion.get(String(title || ''));
  if (rule === 'complete') return byName === 'Cancelled' ? 'Cancelled' : 'Completed';
  if (rule === 'incomplete') return byName === 'Deferred' ? 'Deferred' : 'Active';
  return byName;
}

// A board's lists and rules as a Wrike workflow, in the shape GET /workflows
// returns. Wrike requires a workflow to have an Active and a Completed status;
// when no list is one, a status of that group is added, named after it.
// Returns { workflow, statusOf } where statusOf(list title) is the
// { name, group } the Excel export writes for a card in that list.
export function wrikeWorkflowFromBoard({ boardTitle, lists, rules }) {
  const completion = completionByList(rules);
  const statuses = [];
  const byTitle = new Map();
  for (const list of Array.isArray(lists) ? lists : []) {
    const title = String((list && list.title) || '').trim();
    if (!title || byTitle.has(title)) continue;
    let name = wrikeName(title);
    // Two lists whose names only differ after 128 symbols stay two statuses.
    for (let n = 2; statuses.some(status => status.name === name); n += 1) name = `${wrikeName(title).slice(0, MAX_WRIKE_NAME - 4)} (${n})`;
    const group = wrikeGroupForList(title, completion);
    const status = { name, standardName: false, color: wrikeColorForList(list.color, group), standard: false, group, hidden: false };
    statuses.push(status);
    byTitle.set(title, status);
  }
  for (const group of ['Active', 'Completed']) {
    if (statuses.some(status => status.group === group)) continue;
    let name = group;
    for (let n = 2; statuses.some(status => status.name === name); n += 1) name = `${group} (${n})`;
    const added = { name, standardName: false, color: GROUP_COLOR[group], standard: false, group, hidden: false };
    if (group === 'Active') statuses.unshift(added); else statuses.push(added);
  }
  const workflow = {
    kind: 'workflows',
    data: [{ name: wrikeName(boardTitle) || 'WeKan board', standard: false, hidden: false, customStatuses: statuses }],
  };
  const statusOf = title => {
    const status = byTitle.get(String(title || '').trim());
    if (status) return { name: status.name, group: status.group };
    const first = statuses.find(candidate => candidate.group === 'Active');
    return { name: first.name, group: first.group };
  };
  return { workflow, statusOf };
}

// A Wrike workflow JSON - GET /workflows' { kind, data }, its data array, or one
// workflow object - as the statuses a WeKan board has. The first workflow
// that is not hidden and not Wrike's standard one is read, else the standard
// one; the others and hidden statuses are reported, not read.
export function readWrikeWorkflow(json) {
  let value = json;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch (e) { throw new Error('Wrike workflow is not JSON'); }
  }
  const all = Array.isArray(value) ? value : value && Array.isArray(value.data) ? value.data : value && Array.isArray(value.customStatuses) ? [value] : null;
  if (!all || !all.length) throw new Error('Wrike workflow JSON has no workflow: expected GET /workflows\' { "kind": "workflows", "data": [...] }');
  const usable = all.filter(workflow => workflow && Array.isArray(workflow.customStatuses));
  const chosen = usable.find(workflow => !workflow.hidden && !workflow.standard) || usable.find(workflow => !workflow.hidden) || usable[0];
  if (!chosen) throw new Error('Wrike workflow JSON has no workflow with customStatuses');
  const unsupported = [];
  all.forEach((workflow, index) => {
    if (workflow !== chosen) unsupported.push({ path: `/data/${index}`, reason: `the Wrike workflow "${(workflow && workflow.name) || index}" is not read; one workflow is read at a time` });
  });
  const statuses = [];
  chosen.customStatuses.forEach((status, index) => {
    const path = `/data/${all.indexOf(chosen)}/customStatuses/${index}`;
    const name = String((status && status.name) || '').trim();
    if (!name) { unsupported.push({ path, reason: 'a Wrike status without a name is not read' }); return; }
    if (status.hidden) { unsupported.push({ path, reason: `the hidden Wrike status "${name}" is not read` }); return; }
    const group = WRIKE_STATUS_GROUPS.includes(status.group) ? status.group : wrikeGroupForName(name);
    if (!WRIKE_STATUS_GROUPS.includes(status.group)) unsupported.push({ path, reason: `Wrike status group "${status.group}" is not Active, Completed, Deferred or Cancelled; "${group}" is used` });
    if (statuses.some(existing => existing.name === name)) { unsupported.push({ path, reason: `a second Wrike status named "${name}" is read once` }); return; }
    statuses.push({ name, group, color: wekanColorForWrike(status.color) });
  });
  if (!statuses.length) throw new Error(`Wrike workflow "${chosen.name || ''}" has no status to read`);
  return { name: String(chosen.name || '').trim() || 'Wrike workflow', statuses, unsupported };
}

// The WeKan rules that do what the workflow's status groups do: a card moved
// into a Completed or Cancelled status is marked complete, into an Active or
// Deferred one incomplete. In the portable shape of the Rules export.
export function wrikeWorkflowRules(statuses) {
  return (Array.isArray(statuses) ? statuses : []).map(status => {
    const closes = status.group === 'Completed' || status.group === 'Cancelled';
    return {
      title: `Wrike ${status.group}: a card moved to "${status.name}" is marked ${closes ? 'complete' : 'incomplete'}`,
      trigger: { activityType: 'moveCard', listName: status.name, oldListName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' },
      action: { actionType: closes ? 'markCardComplete' : 'markCardIncomplete' },
    };
  });
}

// The "Wrike workflow" board export: the collected board, lists and rules.
export function formatWrikeWorkflow({ board, lists, workflowRules }) {
  return wrikeWorkflowFromBoard({ boardTitle: board && board.title, lists, rules: workflowRules }).workflow;
}
