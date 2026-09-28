import { FILTER_PRESET_SETS, FILTER_PRESET_TEXTS, FILTER_PRESET_DUE, validateFilterPresetState } from '/models/lib/filterPresetState';

export function captureFilterPreset(filter) {
  filter.advanced.validate(filter.advanced.value());
  const providers = filter.providers.snapshot();
  const extended = Object.keys(providers).length > 0;
  return validateFilterPresetState({ version: extended ? 2 : 1, ...(extended ? { providers } : {}),
    sets: Object.fromEntries(FILTER_PRESET_SETS.map(key => [key, filter[key].list().map(id => id === undefined ? null : id)])),
    texts: Object.fromEntries(FILTER_PRESET_TEXTS.map(key => [key, filter[key].value()])),
    labelMode: filter.labelIds.mode(), due: filter.dueAt.state(),
    dateRange: filter.dateRange.value(), movementDate: filter.movementDate.value(),
    dateRecency: filter.dateRecency.value(), columnAge: filter.columnAge.value(),
  });
}
export function applyFilterPreset(filter, input) {
  const state = validateFilterPresetState(input);
  // Reject invalid or no-longer-resolvable expressions before touching live state.
  filter.advanced.validate(state.texts.advanced);
  const restoreProviders = filter.providers.prepareRestore(state.providers);
  filter.reset();
  for (const key of FILTER_PRESET_SETS) for (const id of state.sets[key]) filter[key].add(id === null ? undefined : id);
  for (const key of FILTER_PRESET_TEXTS) filter[key].set(state.texts[key]);
  filter.labelIds.setMode(state.labelMode);
  if (state.due !== null) filter.dueAt[FILTER_PRESET_DUE[state.due]]();
  filter.dateRange.set(state.dateRange); filter.movementDate.set(state.movementDate);
  filter.dateRecency.set(state.dateRecency);
  if (state.columnAge.listId) filter.columnAge.set(state.columnAge.listId, state.columnAge.days);
  restoreProviders();
}
