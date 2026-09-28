import { ReactiveCache } from '/imports/reactiveCache';
import { formatStringTemplate } from '/models/lib/customFieldStringTemplate';

class CustomField {
  constructor(definition) {
    this.definition = definition;
  }
}

export class CustomFieldStringTemplate extends CustomField {
  constructor(definition) {
    super(definition);
    this.format = definition.settings.stringtemplateFormat;
    this.separator = definition.settings.stringtemplateSeparator;
  }

  getFormattedValue(rawValue, context = {}) {
    return formatStringTemplate(rawValue, this.format, this.separator, context);
  }
}

// Called inside a Blaze helper, so Minimongo reads track renames and moves.
// Linked cards use the same real card as customFieldsWD()'s values.
export function stringTemplateContext(card) {
  const real = card?.getRealCard?.() || card;
  if (!real) return {};
  const context = { 'card.title': real.title || '' };
  const board = ReactiveCache.getBoard(real.boardId);
  const list = ReactiveCache.getList({ _id: real.listId, boardId: real.boardId });
  const swimlane = ReactiveCache.getSwimlane({ _id: real.swimlaneId, boardId: real.boardId });
  if (board) context['board.title'] = board.title || '';
  if (list) context['list.title'] = list.title || '';
  if (swimlane) context['swimlane.title'] = swimlane.title || '';
  return context;
}
