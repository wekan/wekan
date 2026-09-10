//#region packages/core/src/math/mathjax.ts
var e = 1e3;
function t(t) {
	let n = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(t);
	if (!n) return {
		widthEm: 0,
		ascentEm: 0,
		descentEm: 0
	};
	let r = parseFloat(n[2]), i = parseFloat(n[3]), a = parseFloat(n[4]);
	return {
		widthEm: i / e,
		ascentEm: Math.max(0, -r / e),
		descentEm: Math.max(0, (r + a) / e)
	};
}
function n(e, t) {
	return e.replace(/currentColor/g, t);
}
//#endregion
export { t as n, n as t };
