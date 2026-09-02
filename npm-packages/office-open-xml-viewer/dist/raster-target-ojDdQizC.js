//#region packages/core/src/image/tiff-contract.ts
var e = class e extends Error {
	code = "ooxml-tiff-decode";
	constructor(t, n) {
		super(t, n), this.name = "TiffDecodeError", Object.setPrototypeOf(this, e.prototype);
	}
};
function t(e) {
	if (!(typeof e != "object" || !e)) try {
		let t = e, n = t.code, r = t.message;
		return n === "ooxml-tiff-decode" && typeof r == "string" ? { message: r } : void 0;
	} catch {
		return;
	}
}
function n(e) {
	if (!t(e)) return !1;
	try {
		return typeof e.name == "string";
	} catch {
		return !1;
	}
}
function r(e) {
	if (e.length < 4) return !1;
	let t = e[0] === 73 && e[1] === 73, n = e[0] === 77 && e[1] === 77;
	return !t && !n ? !1 : new DataView(e.buffer, e.byteOffset, e.byteLength).getUint16(2, t) === 42;
}
function i(e) {
	if (!r(e) || e.length < 8) return null;
	let t = e[0] === 73, n = new DataView(e.buffer, e.byteOffset, e.byteLength), i = (e, t) => Number.isSafeInteger(e) && e >= 0 && t >= 0 && e <= n.byteLength - t, a = n.getUint32(4, t);
	if (!i(a, 2)) return null;
	let o = n.getUint16(a, t);
	if (!i(a + 2, o * 12 + 4)) return null;
	let s, c;
	for (let e = 0; e < o; e++) {
		let r = a + 2 + e * 12, i = n.getUint16(r, t);
		if (i !== 256 && i !== 257) continue;
		let o = n.getUint16(r + 2, t);
		if (n.getUint32(r + 4, t) !== 1 || o !== 1 && o !== 3 && o !== 4) return null;
		let l = o === 1 ? n.getUint8(r + 8) : o === 3 ? n.getUint16(r + 8, t) : n.getUint32(r + 8, t);
		i === 256 ? s = l : c = l;
	}
	return s === void 0 || c === void 0 ? null : {
		width: s,
		height: c
	};
}
//#endregion
//#region packages/core/src/image/raster-target.ts
function a(e) {
	return typeof e == "number" && Number.isFinite(e) && e > 0 ? e : void 0;
}
function o(e, t, n, r = !1) {
	if (!Number.isFinite(e.width) || !Number.isFinite(e.height) || !(e.width > 0) || !(e.height > 0)) return null;
	let i = a(t), o = a(n);
	if ((r ? i === void 0 && o === void 0 : i === void 0 || o === void 0) || i !== void 0 && !(i < e.width) || o !== void 0 && !(o < e.height)) return null;
	let s = i === void 0 ? 0 : i / e.width, c = o === void 0 ? 0 : o / e.height, l, u;
	if (i !== void 0 && s >= c) l = Math.max(1, Math.ceil(i)), u = Math.max(1, Math.ceil(e.height * l / e.width));
	else if (o !== void 0) u = Math.max(1, Math.ceil(o)), l = Math.max(1, Math.ceil(e.width * u / e.height));
	else return null;
	return l < e.width && u < e.height ? {
		width: l,
		height: u
	} : null;
}
function s(e, t, n, r = !1) {
	if (!Number.isFinite(e.width) || !Number.isFinite(e.height) || !(e.width > 0) || !(e.height > 0)) return null;
	let i = a(t), s = a(n);
	if (i !== void 0 && s !== void 0) {
		let t = Math.min(e.width, Math.max(1, Math.ceil(i))), n = Math.min(e.height, Math.max(1, Math.ceil(s)));
		return t < e.width || n < e.height ? {
			width: t,
			height: n
		} : null;
	}
	return o(e, i, s, r);
}
function c(e, t, n, r) {
	let i = s({
		width: e,
		height: t
	}, n, r, !0);
	return i ? {
		resizeWidth: i.width,
		resizeHeight: i.height,
		resizeQuality: "high"
	} : void 0;
}
//#endregion
export { t as a, i as c, e as i, s as n, r as o, c as r, n as s, o as t };
