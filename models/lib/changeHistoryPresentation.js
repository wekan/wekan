'use strict';

const GROUP_KEYS = Object.freeze({
  title: 'title', description: 'description', labels: 'labels', members: 'members',
  assignees: 'assignees', dates: 'date', checklists: 'checklists', subtasks: 'subtasks',
  attachments: 'attachments', comments: 'comments', customFields: 'custom-fields',
  position: 'sort',
});

function changeTypeKey(changeType) {
  return changeType === 'added' ? 'added' : `history-change-${changeType}`;
}

function summariseChangeHistory(row, translate = key => key, formatDate = String) {
  const content = row?.newContent || row?.previousContent;
  if (!content) return '';
  if (typeof content.value === 'string') return content.value;
  if (content.value === null) return '—';
  if (Array.isArray(content.value)) return content.value.join(', ');
  if (content.isDate) return formatDate(content.value);
  if (typeof content.value === 'number' || typeof content.value === 'boolean') {
    return String(content.value);
  }
  if (content.document?.title) return content.document.title;
  if (content.document?.text) return content.document.text;
  if (content.deleted !== undefined) {
    return translate(content.deleted ? 'history-change-removed' : 'history-change-restored');
  }
  try {
    return JSON.stringify(content.value !== undefined ? content.value : content);
  } catch (_) {
    return '';
  }
}

module.exports = { GROUP_KEYS, changeTypeKey, summariseChangeHistory };
