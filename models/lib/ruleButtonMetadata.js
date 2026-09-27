'use strict';

function ruleButtonMetadata(trigger, title) {
  return trigger?.activityType === 'button'
    ? { $set: { buttonType: trigger.buttonType || 'card', buttonLabel: trigger.buttonLabel || title || 'Rule' } }
    : { $unset: { buttonType: '', buttonLabel: '' } };
}
module.exports = { ruleButtonMetadata };
