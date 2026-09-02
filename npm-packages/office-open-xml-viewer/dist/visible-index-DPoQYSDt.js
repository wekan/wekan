//#region packages/core/src/nav/visible-index.ts
function e(e, t, n, r) {
	for (let i = e + t; i >= 0 && i < r; i += t) if (!n(i)) return i;
	return e;
}
function t(t, n, r) {
	if (r === 0 || !n(t)) return t;
	let i = e(t, 1, n, r);
	return i === t ? e(t, -1, n, r) : i;
}
function n(e, t) {
	let n = 0;
	for (let r = 0; r < t; r++) e(r) || n++;
	return n;
}
//#endregion
export { e as n, t as r, n as t };
