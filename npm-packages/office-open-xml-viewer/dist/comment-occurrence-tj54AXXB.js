//#region packages/pptx/src/comment-occurrence.ts
function e(e, t, n) {
	return `slide:${n}:${e.id ?? `classic:${e.authorId ?? "unknown"}:${e.index ?? t}`}`;
}
//#endregion
export { e as t };
