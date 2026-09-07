'use strict';

const EXTERNAL_RULE_FORMATS = new Set(['trello', 'workflow-auto', 'n8n', 'nodered']);

function parseTrelloButler(text) {
  const rules = [];
  const unmapped = [];
  String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    .forEach(line => {
      const added = line.toLowerCase().match(
        /when a card is added to list ["“](.+?)["”].*move the card to the (top|bottom)/,
      );
      if (!added) {
        unmapped.push(line);
        return;
      }
      rules.push({
        title: line,
        trigger: {
          activityType: 'createCard', listName: added[1], swimlaneName: '*',
          cardTitle: '*', userId: '*',
        },
        action: {
          actionType: added[2] === 'top' ? 'moveCardToTop' : 'moveCardToBottom',
          listName: '*', swimlaneName: '*',
        },
      });
    });
  return { rules, unmapped };
}

function mapTriggerType(type = '', name = '') {
  const value = `${type} ${name}`.toLowerCase();
  if (/schedule|cron|interval|inject/.test(value)) return {
    activityType: 'scheduledTrigger', scheduleKind: 'calendar',
    scheduleType: 'daily', atTime: '09:00', listName: '*', swimlaneName: '*',
  };
  if (/trigger|webhook|http in|http-in|start/.test(value)) return {
    activityType: 'createCard', listName: '*', swimlaneName: '*',
    cardTitle: '*', userId: '*',
  };
  return null;
}

function mapActionType(type = '', name = '') {
  const value = `${type} ${name}`.toLowerCase();
  if (/archive/.test(value)) return { actionType: 'archive' };
  if (/move.*top|to top/.test(value)) return {
    actionType: 'moveCardToTop', listName: '*', swimlaneName: '*',
  };
  if (/move.*bottom/.test(value)) return {
    actionType: 'moveCardToBottom', listName: '*', swimlaneName: '*',
  };
  if (/complete|done/.test(value)) return { actionType: 'markCardComplete' };
  if (/email|mail|smtp|gmail/.test(value)) return {
    actionType: 'sendEmail', emailTo: '', emailSubject: 'Imported workflow', emailMsg: '',
  };
  if (/create.*card|wekan|card/.test(value)) return {
    actionType: 'createCard', cardName: name || 'Imported card',
    listName: '*', swimlaneName: '*',
  };
  return null;
}

function parseN8n(data) {
  const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
  const byName = Object.create(null);
  for (const node of nodes) if (node && typeof node.name === 'string') byName[node.name] = node;
  const rules = [];
  const unmapped = [];
  const connections = data?.connections && typeof data.connections === 'object'
    ? data.connections : {};
  for (const sourceName of Object.keys(connections)) {
    const source = byName[sourceName];
    if (!source) continue;
    const trigger = mapTriggerType(source.type, sourceName);
    const main = Array.isArray(connections[sourceName]?.main)
      ? connections[sourceName].main : [];
    for (const output of main.flat()) {
      const target = output && byName[output.node];
      if (!target) continue;
      const action = mapActionType(target.type, target.name);
      const label = `${sourceName} → ${target.name || output.node}`;
      if (trigger && action) rules.push({ title: label, trigger, action });
      else unmapped.push(label);
    }
  }
  return { rules, unmapped };
}

function parseNodeRed(data) {
  const nodes = Array.isArray(data) ? data
    : (Array.isArray(data?.flows) ? data.flows : []);
  const byId = Object.create(null);
  for (const node of nodes) if (node && typeof node.id === 'string') byId[node.id] = node;
  const rules = [];
  const unmapped = [];
  for (const node of nodes) {
    const trigger = mapTriggerType(node?.type, node?.name);
    if (!trigger) continue;
    const wires = Array.isArray(node.wires) ? node.wires.flat() : [];
    for (const targetId of wires) {
      const target = byId[targetId];
      if (!target) continue;
      const action = mapActionType(target.type, target.name);
      const label = `${node.name || node.type} → ${target.name || target.type}`;
      if (action) rules.push({ title: label, trigger, action });
      else unmapped.push(label);
    }
  }
  return { rules, unmapped };
}

function parseWorkflowData(data, format) {
  let selected = format;
  if (selected === 'workflow-auto') {
    if (data && Array.isArray(data.nodes) && data.connections) selected = 'n8n';
    else if (Array.isArray(data) || Array.isArray(data?.flows)) selected = 'nodered';
  }
  if (selected === 'n8n') return parseN8n(data);
  if (selected === 'nodered') return parseNodeRed(data);
  throw new Error('Unknown workflow format');
}

module.exports = {
  EXTERNAL_RULE_FORMATS,
  parseN8n,
  parseNodeRed,
  parseTrelloButler,
  parseWorkflowData,
};

