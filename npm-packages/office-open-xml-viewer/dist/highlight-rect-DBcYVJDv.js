//#region packages/core/src/search/highlight-rect.ts
function e(e, t, n, r) {
	let i = t <= 0 ? 0 : r(e.slice(0, t)), a = n >= e.length ? r(e) : r(e.slice(0, n));
	return {
		x: i,
		width: Math.max(0, a - i)
	};
}
function t(e, t) {
	return t > 0 ? `${e / t * 100}%` : "0%";
}
//#endregion
export { e as n, t };
