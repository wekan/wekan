'use strict';

// GitHub Actions workflows as WeKan Rules, for the GitHub organization import
// (design: docs/Features/Board/Version-Control-View.md, "GitHub Actions").
//
// A workflow is "on <event> run <steps>". The events about issues have WeKan
// triggers, and the steps that change an issue have WeKan actions, on a board
// imported from that repository - where an issue is a card, a label a label,
// and "closed" the Closed list:
//
//   on                                   WeKan trigger
//   issues: opened                       createCard
//   issues: closed / reopened            moveCard to Closed / Open
//   issues: labeled / unlabeled          addedLabel / removedLabel
//   issues: assigned / unassigned        joinAssignee / unjoinAssignee
//   issues: edited                       textContainsTrigger (any text)
//   issue_comment: created               addComment
//   schedule: cron                       scheduledTrigger, scheduleKind cron
//   workflow_dispatch                    a board button
//
//   steps                                WeKan action
//   add labels (actions-ecosystem/action-add-labels, andymckay/labeler,
//     `gh issue edit --add-label`)       addLabel
//   remove labels                        removeLabel
//   close / reopen (peter-evans/close-issue, `gh issue close|reopen`)
//                                        moveCardToBottom Closed / Open
//   comment (peter-evans/create-or-update-comment,
//     actions-ecosystem/action-create-comment, `gh issue comment`)
//                                        addComment
//   assign (pozil/auto-assign-issue, `gh issue edit --add-assignee`)
//                                        addAssignee
//   create an issue (JasonEtco/create-an-issue, `gh issue create`)
//                                        createCard
//   actions/stale                        a scheduled aging rule: label stale
//
// Everything else - a shell script, actions/github-script, a build, a test,
// a deployment - is code, and a WeKan server does not run code taken from an
// imported repository. Such a workflow is still imported, as a DISABLED rule
// carrying the workflow's YAML in its description, so it is visible in the
// Rules and their workflow view, and the import's losses say what it was.
//
// Pure: tests/githubActionsRules.test.cjs.

const { parseWorkflowYaml } = require('./workflowYaml');
const { isValidCron } = require('./cronSchedule');

const ANY = '*';
const escapeRegExp = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CARD_SCOPE = { listName: ANY, swimlaneName: ANY, cardTitle: ANY, userId: ANY };

function events(on) {
  if (typeof on === 'string') return { [on]: {} };
  if (Array.isArray(on)) return Object.fromEntries(on.map(e => [e, {}]));
  return on && typeof on === 'object' ? on : {};
}

function types(config) {
  const t = config && config.types;
  return Array.isArray(t) ? t : typeof t === 'string' ? [t] : null;
}

/** The WeKan triggers a workflow's `on:` maps to, and what did not map. */
function mapTriggers(on) {
  const triggers = [];
  const unmapped = [];
  for (const [event, config] of Object.entries(events(on))) {
    const want = types(config);
    const has = t => !want || want.includes(t);
    if (event === 'issues') {
      if (has('opened')) triggers.push({ activityType: 'createCard', ...CARD_SCOPE });
      if (has('closed')) triggers.push({ activityType: 'moveCard', ...CARD_SCOPE, listName: 'Closed', oldListName: ANY });
      if (has('reopened')) triggers.push({ activityType: 'moveCard', ...CARD_SCOPE, listName: 'Open', oldListName: ANY });
      if (has('labeled') || has('milestoned')) triggers.push({ activityType: 'addedLabel', labelId: ANY, userId: ANY });
      if (has('unlabeled') || has('demilestoned')) triggers.push({ activityType: 'removedLabel', labelId: ANY, userId: ANY });
      if (has('assigned')) triggers.push({ activityType: 'joinAssignee', username: ANY, userId: ANY });
      if (has('unassigned')) triggers.push({ activityType: 'unjoinAssignee', username: ANY, userId: ANY });
      if (has('edited')) triggers.push({ activityType: 'textContainsTrigger', textContains: '', ...CARD_SCOPE });
      const known = ['opened', 'closed', 'reopened', 'labeled', 'unlabeled', 'milestoned', 'demilestoned', 'assigned', 'unassigned', 'edited'];
      (want || []).filter(t => !known.includes(t)).forEach(t => unmapped.push(`issues: ${t}`));
    } else if (event === 'issue_comment') {
      if (has('created')) triggers.push({ activityType: 'addComment', cardTitle: ANY, userId: ANY });
      (want || []).filter(t => t !== 'created').forEach(t => unmapped.push(`issue_comment: ${t}`));
    } else if (event === 'schedule') {
      for (const entry of Array.isArray(config) ? config : []) {
        const cron = entry && entry.cron;
        if (typeof cron === 'string' && isValidCron(cron)) {
          triggers.push({ activityType: 'scheduledTrigger', scheduleKind: 'cron', cron: cron.trim().replace(/\s+/g, ' '), listName: ANY, swimlaneName: ANY });
        } else unmapped.push(`schedule: ${JSON.stringify(cron)}`);
      }
    } else if (event === 'workflow_dispatch') {
      triggers.push({ activityType: 'button', buttonType: 'board' });
    } else {
      unmapped.push(event);
    }
  }
  return { triggers, unmapped };
}

const splitList = v => (Array.isArray(v) ? v : String(v == null ? '' : v).split(/[,\n]/))
  .map(s => String(s).trim()).filter(Boolean);

// `gh issue ...` commands of a run: step, the part WeKan can do.
function ghActions(script) {
  const actions = [];
  let rest = String(script || '');
  const unknown = [];
  for (const raw of rest.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^gh issue (close|reopen|comment|edit|create)\b(.*)$/.exec(line);
    if (!m) { unknown.push(line); continue; }
    const args = m[2];
    const opt = name => {
      const r = new RegExp(`--${escapeRegExp(name)}(?:=|\\s+)(?:"([^"]*)"|'([^']*)'|(\\S+))`, 'g');
      const out = [];
      let x;
      while ((x = r.exec(args))) out.push(x[1] ?? x[2] ?? x[3]);
      return out;
    };
    if (m[1] === 'close') actions.push({ actionType: 'moveCardToBottom', listName: 'Closed', swimlaneName: ANY });
    else if (m[1] === 'reopen') actions.push({ actionType: 'moveCardToBottom', listName: 'Open', swimlaneName: ANY });
    else if (m[1] === 'comment') {
      const body = opt('body').concat(opt('b'))[0];
      if (body !== undefined) actions.push({ actionType: 'addComment', commentText: body });
      else unknown.push(line);
    } else if (m[1] === 'create') {
      const title = opt('title').concat(opt('t'))[0];
      if (title !== undefined) actions.push({ actionType: 'createCard', cardName: title, listName: 'Open', swimlaneName: ANY });
      else unknown.push(line);
    } else {
      opt('add-label').flatMap(splitList).forEach(name => actions.push({ actionType: 'addLabel', labelName: name }));
      opt('remove-label').flatMap(splitList).forEach(name => actions.push({ actionType: 'removeLabel', labelName: name }));
      opt('add-assignee').flatMap(splitList).forEach(name => actions.push({ actionType: 'addAssignee', username: name.replace(/^@/, '') }));
      if (!/--(add|remove)-(label|assignee)/.test(args)) unknown.push(line);
    }
  }
  return { actions, unknown };
}

/** The WeKan actions of a job's steps, and the steps that are code. */
function mapSteps(steps) {
  const actions = [];
  const unmapped = [];
  for (const step of Array.isArray(steps) ? steps : []) {
    if (!step || typeof step !== 'object') continue;
    const uses = typeof step.uses === 'string' ? step.uses.split('@')[0].toLowerCase() : '';
    const w = step.with && typeof step.with === 'object' ? step.with : {};
    const label = step.name || step.uses || (step.run ? String(step.run).split('\n')[0] : 'step');
    if (uses === 'actions/checkout' || uses === 'actions/setup-node') continue; // preparation only
    if (['actions-ecosystem/action-add-labels', 'andymckay/labeler', 'christianvuerings/add-labels'].includes(uses)) {
      splitList(w.labels || w['add-labels']).forEach(name => actions.push({ actionType: 'addLabel', labelName: name }));
      splitList(w['remove-labels']).forEach(name => actions.push({ actionType: 'removeLabel', labelName: name }));
    } else if (uses === 'actions-ecosystem/action-remove-labels') {
      splitList(w.labels).forEach(name => actions.push({ actionType: 'removeLabel', labelName: name }));
    } else if (uses === 'peter-evans/close-issue') {
      if (w.comment) actions.push({ actionType: 'addComment', commentText: String(w.comment) });
      actions.push({ actionType: 'moveCardToBottom', listName: 'Closed', swimlaneName: ANY });
    } else if (['peter-evans/create-or-update-comment', 'actions-ecosystem/action-create-comment'].includes(uses)) {
      actions.push({ actionType: 'addComment', commentText: String(w.body || '') });
    } else if (uses === 'pozil/auto-assign-issue') {
      splitList(w.assignees).forEach(name => actions.push({ actionType: 'addAssignee', username: name.replace(/^@/, '') }));
    } else if (uses === 'jasonetco/create-an-issue') {
      actions.push({ actionType: 'createCard', cardName: String(w.title || 'Imported issue'), listName: 'Open', swimlaneName: ANY });
    } else if (!uses && typeof step.run === 'string') {
      const gh = ghActions(step.run);
      actions.push(...gh.actions);
      if (gh.unknown.length) unmapped.push(step.name ? `${step.name}: ${gh.unknown[0]}` : gh.unknown[0]);
    } else {
      unmapped.push(String(label));
    }
  }
  return { actions, unmapped };
}

// actions/stale: issues without activity for `days-before-stale` days (60)
// get the stale label - WeKan's scheduled "aging" rule.
function staleRule(workflowName, steps) {
  const stale = (Array.isArray(steps) ? steps : []).find(s => s && typeof s.uses === 'string' && /^actions\/stale@/i.test(s.uses));
  if (!stale) return null;
  const w = stale.with || {};
  const days = Number(w['days-before-issue-stale'] ?? w['days-before-stale'] ?? 60);
  return {
    title: `${workflowName}: stale`,
    trigger: { activityType: 'scheduledTrigger', scheduleKind: 'aging', days: Number.isFinite(days) && days > 0 ? days : 60, listName: ANY },
    actions: [{ actionType: 'addLabel', labelName: String(w['stale-issue-label'] || 'stale') }],
  };
}

/**
 * One workflow file as rules:
 *   { rules: [{ title, trigger, actions, extraTriggers, enabled, description }], unmapped: [] }
 * A rule is enabled only when its trigger and EVERY step mapped; otherwise it
 * is disabled and its description is the workflow's YAML.
 */
function workflowToRules(fileName, yamlText) {
  let doc;
  try {
    doc = parseWorkflowYaml(yamlText);
  } catch (error) {
    return { rules: [], unmapped: [`${fileName}: ${error.message}`] };
  }
  const name = String((doc && doc.name) || fileName.replace(/\.ya?ml$/, ''));
  const description = `GitHub Actions workflow ${fileName}\n\n\`\`\`yaml\n${String(yamlText).trim()}\n\`\`\``;
  const { triggers, unmapped: triggerLoss } = mapTriggers(doc && doc.on);
  const rules = [];
  const unmapped = triggerLoss.map(t => `${fileName}: on ${t}`);
  for (const [jobId, job] of Object.entries((doc && doc.jobs) || {})) {
    const steps = job && Array.isArray(job.steps) ? job.steps : [];
    const stale = staleRule(name, steps);
    if (stale) {
      rules.push({ ...stale, extraTriggers: [], enabled: true, description });
      continue;
    }
    const { actions, unmapped: stepLoss } = mapSteps(steps);
    stepLoss.forEach(s => unmapped.push(`${fileName}: ${jobId}: ${s}`));
    if (job && job.uses) unmapped.push(`${fileName}: ${jobId}: reusable workflow ${job.uses}`);
    // A scheduled workflow chooses its issues in its script; as a WeKan
    // schedule its card actions would reach EVERY card of the list.
    const scheduledCardActions = triggers.some(t => t.activityType === 'scheduledTrigger')
      && actions.some(a => a.actionType !== 'createCard');
    if (scheduledCardActions) unmapped.push(`${fileName}: ${jobId}: a schedule whose issues its script chooses`);
    const complete = triggers.length > 0 && actions.length > 0 && stepLoss.length === 0 && !(job && job.uses)
      && !scheduledCardActions;
    rules.push({
      title: Object.keys(doc.jobs).length > 1 ? `${name}: ${(job && job.name) || jobId}` : name,
      trigger: triggers[0] || { activityType: 'button', buttonType: 'board' },
      extraTriggers: triggers.slice(1, 11),
      actions: actions.length ? actions.slice(0, 11) : [{ actionType: 'addComment', commentText: `Workflow ${name} ran in GitHub Actions.` }],
      enabled: complete,
      description,
    });
  }
  return { rules, unmapped };
}

module.exports = { workflowToRules, mapTriggers, mapSteps, ghActions };
