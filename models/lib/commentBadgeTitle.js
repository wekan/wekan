// Reuse only the comments already visible to the caller. Render the returned
// string through a normal escaped title attribute, never as HTML.
export function commentBadgeTitle(comments, countTitle) {
  const visible = Array.isArray(comments) ? comments : [];
  if (visible.length === 1 && typeof visible[0]?.text === 'string' && visible[0].text.trim()) {
    return visible[0].text;
  }
  return countTitle(visible.length);
}
