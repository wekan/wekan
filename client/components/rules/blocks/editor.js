import { registerRulesBlocks } from '/models/lib/rulesBlocksDefinition';
import * as Blockly from 'blockly/core';
import messageKeys from '/models/lib/blocklyMessageKeys.json';
import { blockState, ruleWorkspace, workspaceRule } from '/models/lib/rulesBlocks';
import { TRIGGER_PALETTE, ACTION_PALETTE } from '/models/lib/rulesWorkflowPalette';

export function createRulesBlocksEditor(element, { onChange, rtl = false, translate } = {}) {
  const t = (key, options) => translate ? translate(key, options) : key;
  const localize = () => {
    Blockly.setLocale(Object.fromEntries(Object.entries(messageKeys).map(([key, wekanKey]) =>
      [key, t(wekanKey, { postProcess: false })])));
    registerRulesBlocks(Blockly, translate);
  };
  const contents = (palette, kind) => palette.map(entry => ({ kind: 'block', ...blockState(kind, entry.doc) }));
  let workspace, loading = false;
  function inject(direction) {
    localize();
    const result = Blockly.inject(element, {
      toolbox: { kind: 'categoryToolbox', contents: [
        { kind: 'category', name: t('r-trigger'), colour: 145, contents: contents(TRIGGER_PALETTE, 'trigger') },
        { kind: 'category', name: t('r-action'), colour: 225, contents: contents(ACTION_PALETTE, 'action') },
      ] },
      renderer: 'zelos', rtl: direction, sounds: false, trashcan: true,
      // Enable/disable belongs to the rule; workspace comments have no rule equivalent.
      disable: false, comments: false, collapse: true,
      media: `${__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''}/blockly-media/`,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: true, startScale: 0.85, maxScale: 1.5, minScale: 0.4 },
    });
    result.addChangeListener(event => {
      if (!loading && !event.isUiEvent && ![Blockly.Events.FINISHED_LOADING, Blockly.Events.VIEWPORT_CHANGE].includes(event.type)) onChange?.();
    });
    return result;
  }
  workspace = inject(rtl);
  const observer = new ResizeObserver(() => Blockly.svgResize(workspace));
  observer.observe(element);
  function restore(state) {
    loading = true;
    Blockly.Events.disable();
    try {
      workspace.clear();
      if (state) Blockly.serialization.workspaces.load(state, workspace);
      workspace.clearUndo();
    } finally { Blockly.Events.enable(); loading = false; }
    Blockly.svgResize(workspace);
  }
  return {
    load(trigger, action) { restore(trigger && action ? ruleWorkspace(trigger, action) : null); },
    read() { return workspaceRule(workspace); },
    setLocale(direction) {
      // Recreate to apply translated fields and RTL without losing draft blocks.
      const state = Blockly.serialization.workspaces.save(workspace);
      workspace.dispose();
      workspace = inject(direction);
      restore(state);
    },
    dispose() { observer.disconnect(); workspace.dispose(); },
  };
}
