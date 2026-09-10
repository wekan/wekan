//#region packages/core/src/worker/renderer-module-contract.ts
var e = "ooxml-worker-renderer-module/v1", t = /* @__PURE__ */ new WeakMap();
function n(t, n) {
	if (t === "math") {
		if (!n) throw TypeError("Math worker renderer requires an engine asset URL");
		return Object.freeze({
			protocol: e,
			builtin: t,
			engineAssetUrl: n
		});
	}
	return Object.freeze({
		protocol: e,
		builtin: t
	});
}
function r(e, r, i) {
	let a = r === "math" ? n(r, i?.engineAssetUrl ?? "") : n(r);
	return t.set(e, a), e;
}
function i(e) {
	let n = e.math ? t.get(e.math) : void 0, r = e.threeD ? t.get(e.threeD) : void 0, i = e.regionMap ? t.get(e.regionMap) : void 0, a = e.chartEx ? t.get(e.chartEx) : void 0, o = e.tiff ? t.get(e.tiff) : void 0, s = {
		...n ? { math: n } : {},
		...r ? { threeD: r } : {},
		...i ? { regionMap: i } : {},
		...a ? { chartEx: a } : {},
		...o ? { tiff: o } : {}
	};
	return Object.keys(s).length > 0 ? Object.freeze(s) : void 0;
}
//#endregion
export { i as n, r as t };
