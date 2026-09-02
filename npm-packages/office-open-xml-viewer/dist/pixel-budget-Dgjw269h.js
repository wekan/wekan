//#region packages/core/src/image/pixel-budget.ts
var e = 32767, t = 1 << 25, n = 1 << 27, r = n, i = t * 4, a = n * 4;
function o(e) {
	return e === "image-dimension" || e === "image-pixels" || e === "active-decoded-bytes";
}
function s(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
var c = class e extends RangeError {
	code = "ooxml-decoded-image-limit";
	constructor(t, n, r) {
		super(`OOXML decoded image limit exceeded: ${t} ${r} > ${n}`), this.metric = t, this.limit = n, this.observed = r, this.name = "OoxmlDecodedImageLimitError", Object.setPrototypeOf(this, e.prototype);
	}
};
function l(e) {
	if (!(!e || typeof e != "object")) try {
		let t = e, n = t.code, r = t.metric, i = t.limit, a = t.observed;
		return n !== "ooxml-decoded-image-limit" || !o(r) || !s(i) || !s(a) || a <= i ? void 0 : {
			metric: r,
			limit: i,
			observed: a
		};
	} catch {
		return;
	}
}
function u(e) {
	if (!l(e)) return !1;
	try {
		let t = e;
		return typeof t.name == "string" && typeof t.message == "string";
	} catch {
		return !1;
	}
}
//#endregion
export { r as a, l as c, t as i, u as l, i as n, n as o, e as r, c as s, a as t };
