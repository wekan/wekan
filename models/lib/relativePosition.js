// Plan insertion beside a live sibling. Normal moves need one write; only a
// tied (or exhausted floating-point) gap requires adjusting other siblings.
export function relativePosition(siblings, targetId, position, movingId) {
  const items = siblings.filter(item => item._id !== movingId);
  const target = items.findIndex(item => item._id === targetId);
  if (target < 0) throw new Error('The selected destination is no longer available.');
  const at = target + (position === 'above' ? 0 : 1);
  const left = items[at - 1];
  const right = items[at];
  const low = left?.sort ?? (right.sort - 2);
  const high = right?.sort ?? (left.sort + 2);
  const middle = low + (high - low) / 2;
  if (Number.isFinite(middle) && middle > low && middle < high) {
    return { sort: middle, updates: [] };
  }

  // Expand only the ambiguous run, retaining the visible stable order. Include
  // the new slot in its spacing so it never inherits a sibling's tied value.
  let start = Math.max(0, at - 1);
  let end = Math.min(items.length, at + 1);
  while (start > 0 && items[start - 1].sort === items[start].sort) start--;
  while (end < items.length && items[end].sort === items[end - 1].sort) end++;
  const lower = start ? items[start - 1].sort : items[start].sort - (end - start + 2);
  const upper = end < items.length ? items[end].sort : items[end - 1].sort + (end - start + 2);
  const run = items.slice(start, end);
  run.splice(at - start, 0, null);
  const step = (upper - lower) / (run.length + 1);
  const values = run.map((_, i) => lower + step * (i + 1));
  if (values.every((v, i) => Number.isFinite(v) && v > (i ? values[i - 1] : lower) && v < upper)) {
    return {
      sort: values[at - start],
      updates: run.flatMap((item, i) => item && item.sort !== values[i] ? [{ id: item._id, sort: values[i] }] : []),
    };
  }
  // Extremely large or non-finite imported ranks cannot be divided safely.
  const ordered = items.slice();
  ordered.splice(at, 0, null);
  return { sort: at, updates: ordered.flatMap((item, i) => item && item.sort !== i ? [{ id: item._id, sort: i }] : []) };
}
