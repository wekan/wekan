import { i as e, r as t } from "./pixel-budget-Dgjw269h.js";
import { a as n, n as r, r as i, t as a } from "./units-EJdC96r6.js";
//#region packages/core/src/canvas/aux-canvas.ts
function o(e, t) {
	return [Math.max(1, Math.ceil(e)), Math.max(1, Math.ceil(t))];
}
function s(e, t) {
	let [n, r] = o(e, t);
	if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(n, r);
	if (typeof document < "u") {
		let e = document.createElement("canvas");
		return e.width = n, e.height = r, e;
	}
	return null;
}
function c(e, t, n) {
	let [r, i] = o(t, n);
	if (typeof OffscreenCanvas < "u") try {
		return new OffscreenCanvas(r, i);
	} catch {}
	if (typeof document < "u") try {
		let e = document.createElement("canvas");
		return e.width = r, e.height = i, e;
	} catch {}
	try {
		let t = e.canvas?.constructor;
		return typeof t == "function" ? new t(r, i) : null;
	} catch {
		return null;
	}
}
//#endregion
//#region packages/core/src/image/dib.ts
var l = t, u = e;
function d(e, t, n, r, i) {
	if (n < 40 || t + 40 > e.byteLength) return null;
	let a = e.getUint32(t, !0);
	if (a < 40) return null;
	let o = e.getInt32(t + 4, !0), s = e.getInt32(t + 8, !0), c = e.getUint16(t + 14, !0);
	if (e.getUint32(t + 16, !0) !== 0) return null;
	let d = s < 0, f = Math.abs(o), p = Math.abs(s);
	if (f <= 0 || p <= 0 || f > l || p > l || f * p > u) return null;
	let m = new Uint8ClampedArray(f * p * 4), h = f * c + 31 >> 5 << 2 >>> 0;
	if (r + h * p > r + i + h && r + h * p > e.byteLength) return null;
	let g = null;
	if (c <= 8) {
		let n = e.getUint32(t + 32, !0);
		n === 0 && (n = 1 << c);
		let r = t + a;
		g = [];
		for (let t = 0; t < n; t++) {
			let n = r + t * 4;
			if (n + 4 > e.byteLength) break;
			let i = e.getUint8(n), a = e.getUint8(n + 1), o = e.getUint8(n + 2);
			g.push(o << 16 | a << 8 | i);
		}
	}
	let _ = (e, t, n, r, i, a) => {
		let o = (e * f + t) * 4;
		m[o] = n, m[o + 1] = r, m[o + 2] = i, m[o + 3] = a;
	}, v = !1;
	for (let t = 0; t < p; t++) {
		let n = d ? t : p - 1 - t, i = t, a = r + n * h;
		if (a + h > e.byteLength) break;
		if (c === 32) for (let t = 0; t < f; t++) {
			let n = a + t * 4, r = e.getUint8(n), o = e.getUint8(n + 1), s = e.getUint8(n + 2), c = e.getUint8(n + 3);
			c !== 0 && (v = !0), _(i, t, s, o, r, c);
		}
		else if (c === 24) {
			for (let t = 0; t < f; t++) {
				let n = a + t * 3;
				_(i, t, e.getUint8(n + 2), e.getUint8(n + 1), e.getUint8(n), 255);
			}
			v = !0;
		} else if (c === 8 && g) {
			for (let t = 0; t < f; t++) {
				let n = e.getUint8(a + t), r = g[n] ?? 0;
				_(i, t, r >> 16 & 255, r >> 8 & 255, r & 255, 255);
			}
			v = !0;
		} else if (c === 4 && g) {
			for (let t = 0; t < f; t++) {
				let n = e.getUint8(a + (t >> 1)), r = t & 1 ? n & 15 : n >> 4 & 15, o = g[r] ?? 0;
				_(i, t, o >> 16 & 255, o >> 8 & 255, o & 255, 255);
			}
			v = !0;
		} else if (c === 1 && g) {
			for (let t = 0; t < f; t++) {
				let n = e.getUint8(a + (t >> 3)) >> 7 - (t & 7) & 1, r = g[n] ?? 0;
				_(i, t, r >> 16 & 255, r >> 8 & 255, r & 255, 255);
			}
			v = !0;
		} else return null;
	}
	if (c === 32 && !v) for (let e = 3; e < m.length; e += 4) m[e] = 255;
	return {
		width: f,
		height: p,
		data: m
	};
}
function f(e, t, n) {
	if (n < 40 || t + 40 > e.byteLength) return null;
	let r = e.getUint32(t, !0);
	if (r < 40) return null;
	let i = e.getUint16(t + 14, !0), a = 0;
	if (i <= 8) {
		let n = e.getUint32(t + 32, !0);
		n === 0 && (n = 1 << i), a = n;
	} else a = e.getUint32(t + 32, !0);
	let o = r + a * 4, s = t + o, c = n - o;
	return c <= 0 ? null : d(e, t, o, s, c);
}
function p(e, t, n, r, i, a) {
	try {
		let o = s(t.width, t.height);
		if (!o) return !1;
		let c = o.getContext("2d");
		if (!c) return !1;
		let l = c.createImageData(t.width, t.height);
		l.data.set(t.data), c.putImageData(l, 0, 0);
		let u = Math.min(n, i), d = Math.min(r, a), f = Math.abs(i - n), p = Math.abs(a - r);
		return e.drawImage(o, u, d, f, p), !0;
	} catch {
		return !1;
	}
}
//#endregion
//#region packages/core/src/image/wmf.ts
var m = {
	EOF: 0,
	SETBKMODE: 258,
	SETTEXTALIGN: 302,
	SETTEXTCOLOR: 521,
	SETPOLYFILLMODE: 262,
	SETWINDOWORG: 523,
	SETWINDOWEXT: 524,
	SELECTOBJECT: 301,
	DELETEOBJECT: 496,
	TEXTOUT: 1313,
	POLYGON: 804,
	POLYLINE: 805,
	POLYPOLYGON: 1336,
	RECTANGLE: 1051,
	CREATEPENINDIRECT: 762,
	CREATEFONTINDIRECT: 763,
	CREATEBRUSHINDIRECT: 764,
	DIBBITBLT: 2368,
	DIBSTRETCHBLT: 2881,
	STRETCHDIBITS: 3907
}, h = 2596720087, g = 22, _ = 18, v = 1179469088;
function y(e, t) {
	if (e.length < t + _) return !1;
	let n = e[t] | e[t + 1] << 8, r = e[t + 2] | e[t + 3] << 8;
	return (n === 1 || n === 2) && r === 9;
}
function b(e) {
	return e.length < 4 ? !1 : (e[0] | e[1] << 8 | e[2] << 16 | e[3] << 24) >>> 0 === h ? !0 : y(e, 0);
}
function x(e) {
	if (e.length < 44) return !1;
	let t = new DataView(e.buffer, e.byteOffset, e.byteLength);
	return t.getUint32(0, !0) === 1 && t.getUint32(40, !0) === v;
}
function S(e) {
	return e === "image/wmf" || e === "image/emf";
}
function C(e) {
	let t = e & 255, n = e >>> 8 & 255, r = e >>> 16 & 255, i = (e) => e.toString(16).padStart(2, "0");
	return `#${i(t)}${i(n)}${i(r)}`;
}
function w(e, t) {
	for (let n = 0; n < e.length; n++) if (e[n] == null) {
		e[n] = t;
		return;
	}
	e.push(t);
}
var ee = class {
	p = 0;
	constructor(e, t, n) {
		this.b = e, this.end = n, this.p = t;
	}
	get remaining() {
		return this.end - this.p;
	}
	i16() {
		let e = this.u16();
		return e >= 32768 ? e - 65536 : e;
	}
	u16() {
		let e = this.b[this.p] | this.b[this.p + 1] << 8;
		return this.p += 2, e;
	}
	u8() {
		return this.b[this.p++];
	}
	u32() {
		let e = (this.b[this.p] | this.b[this.p + 1] << 8 | this.b[this.p + 2] << 16 | this.b[this.p + 3] << 24) >>> 0;
		return this.p += 4, e;
	}
	bytes(e) {
		let t = Math.min(this.p + Math.max(0, e), this.end), n = this.b.subarray(this.p, t);
		return this.p = t, n;
	}
	skip(e) {
		this.p = Math.min(this.p + Math.max(0, e), this.end);
	}
};
function T(e, t) {
	return (t - e.orgX) * (e.W / e.extX);
}
function E(e, t) {
	return (t - e.orgY) * (e.H / e.extY);
}
function te(e, t) {
	let n = t * Math.abs(e.W / e.extX);
	return n >= 1 ? n : 1;
}
var D = .001;
function O(e, t, n) {
	return Math.abs(e - t) <= D || Math.abs(e - n) <= D;
}
function ne(e, t, n) {
	let r = [], i = n ? t.length : t.length - 1;
	for (let n = 0; n < i; n++) {
		let i = t[n], a = t[(n + 1) % t.length], o = Math.abs(i[0] - a[0]) <= D && O(i[0], 0, e.W) && O(a[0], 0, e.W), s = Math.abs(i[1] - a[1]) <= D && O(i[1], 0, e.H) && O(a[1], 0, e.H);
		o || s || r.push([i, a]);
	}
	return r;
}
function re(e, t, n) {
	if (!e.curPen || e.curPen.stroke == null || t.length < 2) return;
	let { ctx: r } = e;
	if (r.strokeStyle = e.curPen.stroke, r.lineWidth = te(e, e.curPen.width), !e.suppressBoundaryFrame) {
		r.beginPath(), r.moveTo(t[0][0], t[0][1]);
		for (let e = 1; e < t.length; e++) r.lineTo(t[e][0], t[e][1]);
		n && r.closePath(), r.stroke(), e.drew = !0;
		return;
	}
	let i = ne(e, t, n);
	if (i.length === 0) return;
	r.beginPath();
	let a = null;
	for (let [e, t] of i) (!a || a[0] !== e[0] || a[1] !== e[1]) && r.moveTo(e[0], e[1]), r.lineTo(t[0], t[1]), a = t;
	r.stroke(), e.drew = !0;
}
function ie(e, t, n) {
	let r = [];
	for (let i = 0; i < n && !(t.remaining < 4); i++) {
		let n = t.i16(), i = t.i16();
		r.push([T(e, n), E(e, i)]);
	}
	return r;
}
function ae(e, t) {
	t.length < 2 || !e.curPen || e.curPen.stroke == null || re(e, t, !1);
}
function oe(e, t) {
	if (t.length < 2) return;
	let { ctx: n } = e;
	if (e.curBrush && e.curBrush.fill != null) {
		n.beginPath(), n.moveTo(t[0][0], t[0][1]);
		for (let e = 1; e < t.length; e++) n.lineTo(t[e][0], t[e][1]);
		n.closePath(), n.fillStyle = e.curBrush.fill, n.fill(e.fillRule), e.drew = !0;
	}
	re(e, t, !0);
}
function se(e, t) {
	let n = t.u16();
	if (n <= 0 || n > 65536) return;
	let r = [];
	for (let e = 0; e < n; e++) {
		if (t.remaining < 2) return;
		r.push(t.u16());
	}
	let { ctx: i } = e;
	i.beginPath();
	let a = !1;
	for (let n of r) {
		if (n < 2) {
			for (let e = 0; e < n && t.remaining >= 4; e++) t.i16(), t.i16();
			continue;
		}
		let r = ie(e, t, n);
		if (!(r.length < 2)) {
			i.moveTo(r[0][0], r[0][1]);
			for (let e = 1; e < r.length; e++) i.lineTo(r[e][0], r[e][1]);
			i.closePath(), a = !0;
		}
	}
	a && (e.curBrush && e.curBrush.fill != null && (i.fillStyle = e.curBrush.fill, i.fill(e.fillRule), e.drew = !0), e.curPen && e.curPen.stroke != null && (i.strokeStyle = e.curPen.stroke, i.lineWidth = te(e, e.curPen.width), i.stroke(), e.drew = !0));
}
function ce(e) {
	let t = e.u16(), n = e.i16();
	e.i16();
	let r = e.u32();
	return {
		kind: "pen",
		stroke: (t & 255) == 5 ? null : C(r),
		width: Math.abs(n)
	};
}
function le(e) {
	let t = e.u16(), n = e.u32();
	return e.u16(), {
		kind: "brush",
		fill: t === 1 ? null : C(n)
	};
}
function ue(e) {
	let t = e.indexOf(0), n = t >= 0 ? e.subarray(0, t) : e;
	if (n.length === 0) return "";
	try {
		return new TextDecoder("shift_jis").decode(n);
	} catch {
		return String.fromCharCode(...n);
	}
}
function de(e) {
	let t = Math.abs(e.i16());
	e.i16(), e.i16(), e.i16();
	let n = e.i16(), r = e.u8() !== 0;
	return e.u8(), e.u8(), e.u8(), e.u8(), e.u8(), e.u8(), e.u8(), {
		kind: "font",
		height: t,
		weight: n,
		italic: r,
		face: ue(e.bytes(Math.min(32, e.remaining)))
	};
}
function fe(e, t, n, r) {
	if (t.length === 0) return;
	let i = e.curFont, a = i?.height || 12, o = Math.abs(E(e, e.orgY + a) - E(e, e.orgY));
	if (!Number.isFinite(o) || o < 1) return;
	let { ctx: s } = e;
	try {
		s.fillStyle = e.textColor;
		let a = i && i.weight >= 700 ? "bold " : "";
		s.font = `${i?.italic ? "italic " : ""}${a}${o}px ${i?.face || "sans-serif"}`;
		let c = e.textAlign & 6;
		s.textAlign = c === 2 ? "right" : c === 6 ? "center" : "left", s.textBaseline = (e.textAlign & 24) == 24 ? "alphabetic" : "top", s.fillText(t, T(e, n), E(e, r)), e.drew = !0;
	} catch {}
}
function pe(e, t, n, r, i = !1) {
	if (!b(e)) return !1;
	let a = 0;
	(e.length >= 4 ? (e[0] | e[1] << 8 | e[2] << 16 | e[3] << 24) >>> 0 : 0) === h && (a = g);
	let o = a + _;
	if (o > e.length) return !1;
	let s = {
		ctx: t,
		W: n,
		H: r,
		orgX: 0,
		orgY: 0,
		extX: n || 1,
		extY: r || 1,
		haveExt: !1,
		objects: [],
		curPen: null,
		curBrush: null,
		curFont: null,
		textColor: "#000000",
		textAlign: 0,
		fillRule: "nonzero",
		drew: !1,
		suppressBoundaryFrame: i
	}, c = new DataView(e.buffer, e.byteOffset, e.byteLength);
	for (; o + 6 <= e.length;) {
		let t = c.getUint32(o, !0), n = c.getUint16(o + 4, !0);
		if (t < 3) break;
		let r = t * 2, i = o + r;
		if (i > e.length || n === m.EOF) break;
		let a = o + 6, l = new ee(e, a, i);
		switch (n) {
			case m.SETWINDOWORG:
				s.orgY = l.i16(), s.orgX = l.i16();
				break;
			case m.SETWINDOWEXT: {
				let e = l.i16(), t = l.i16();
				s.extY = e || 1, s.extX = t || 1, s.haveExt = !0;
				break;
			}
			case m.SETPOLYFILLMODE:
				s.fillRule = l.u16() === 1 ? "evenodd" : "nonzero";
				break;
			case m.SETTEXTCOLOR:
				s.textColor = C(l.u32());
				break;
			case m.SETTEXTALIGN:
				s.textAlign = l.u16();
				break;
			case m.CREATEPENINDIRECT:
				w(s.objects, ce(l));
				break;
			case m.CREATEBRUSHINDIRECT:
				w(s.objects, le(l));
				break;
			case m.CREATEFONTINDIRECT:
				w(s.objects, de(l));
				break;
			case m.SELECTOBJECT: {
				let e = l.u16(), t = s.objects[e];
				t?.kind === "pen" ? s.curPen = t : t?.kind === "brush" ? s.curBrush = t : t?.kind === "font" && (s.curFont = t);
				break;
			}
			case m.DELETEOBJECT: {
				let e = l.u16(), t = s.objects[e];
				t && (t === s.curPen && (s.curPen = null), t === s.curBrush && (s.curBrush = null), t === s.curFont && (s.curFont = null), s.objects[e] = null);
				break;
			}
			case m.POLYLINE:
				ae(s, ie(s, l, l.i16()));
				break;
			case m.POLYGON:
				oe(s, ie(s, l, l.i16()));
				break;
			case m.POLYPOLYGON:
				se(s, l);
				break;
			case m.RECTANGLE: {
				let e = l.i16(), t = l.i16(), n = l.i16(), r = l.i16();
				oe(s, [
					[T(s, r), E(s, n)],
					[T(s, t), E(s, n)],
					[T(s, t), E(s, e)],
					[T(s, r), E(s, e)]
				]);
				break;
			}
			case m.TEXTOUT: {
				let e = l.u16(), t = ue(l.bytes(e));
				e % 2 != 0 && l.skip(1);
				let n = l.i16();
				fe(s, t, l.i16(), n);
				break;
			}
			case m.STRETCHDIBITS: {
				l.u32(), l.i16(), l.i16(), l.i16(), l.i16(), l.u16();
				let e = l.i16(), t = l.i16(), n = l.i16(), r = l.i16(), o = a + 22, u = f(c, o, i - o);
				if (u) {
					let i = T(s, r), a = E(s, n), o = T(s, r + t), c = E(s, n + e);
					p(s.ctx, u, i, a, o, c) && (s.drew = !0);
				}
				break;
			}
			case m.DIBSTRETCHBLT:
			case m.DIBBITBLT:
			case m.SETBKMODE: break;
			default: break;
		}
		o = i;
	}
	return s.drew;
}
var me = 2e3, he = 2;
function ge(e, t) {
	let n = e > 0 ? e : 300, r = t > 0 ? t : 300, i = (e) => Math.max(1, Math.min(me, Math.round(e)));
	return {
		w: i(n * he),
		h: i(r * he)
	};
}
async function _e(e, t, n, r = !1) {
	if (!b(e) || t <= 0 || n <= 0) return null;
	let i = s(t, n);
	if (!i) return null;
	let a = i.getContext("2d");
	return !a || (a.lineJoin = "round", a.lineCap = "round", !pe(e, a, t, n, r)) ? null : createImageBitmap(i);
}
//#endregion
//#region packages/core/src/image/crop.ts
function k(e) {
	if (!e) return !0;
	if (![
		e.l,
		e.t,
		e.r,
		e.b
	].every(Number.isFinite)) return !1;
	let t = e.l, n = e.t, r = 1 - e.r, i = 1 - e.b;
	return r > t && i > n && Math.min(1, r) > Math.max(0, t) && Math.min(1, i) > Math.max(0, n);
}
function A(e) {
	let t = e;
	return {
		w: t.naturalWidth || (typeof t.width == "number" ? t.width : 0) || 0,
		h: t.naturalHeight || (typeof t.height == "number" ? t.height : 0) || 0
	};
}
function ve(e, t) {
	if (!t || !(t.l || t.t || t.r || t.b) || ![
		t.l,
		t.t,
		t.r,
		t.b
	].every(Number.isFinite)) return null;
	let { w: n, h: r } = A(e);
	if (n <= 0 || r <= 0) return null;
	let i = t.l, a = t.t, o = 1 - t.r, s = 1 - t.b, c = o - i, l = s - a;
	if (!(c > 0) || !(l > 0)) return {
		sx: 0,
		sy: 0,
		sw: 0,
		sh: 0,
		dxFraction: 0,
		dyFraction: 0,
		dwFraction: 0,
		dhFraction: 0
	};
	let u = Math.max(0, i), d = Math.max(0, a), f = Math.min(1, o), p = Math.min(1, s), m = Math.max(0, f - u), h = Math.max(0, p - d);
	return {
		sx: u * n,
		sy: d * r,
		sw: m * n,
		sh: h * r,
		dxFraction: (u - i) / c,
		dyFraction: (d - a) / l,
		dwFraction: m / c,
		dhFraction: h / l
	};
}
function j(e, t, n, r, i, a, o) {
	let s = ve(t, n);
	s ? s.sw > 0 && s.sh > 0 && s.dwFraction > 0 && s.dhFraction > 0 && e.drawImage(t, s.sx, s.sy, s.sw, s.sh, r + s.dxFraction * a, i + s.dyFraction * o, s.dwFraction * a, s.dhFraction * o) : e.drawImage(t, r, i, a, o);
}
function ye(e, t, n) {
	if (!Number.isFinite(e) || !Number.isFinite(t) || !(e > 0) || !(t > 0)) return null;
	let r = n ? 1 - n.l - n.r : 1, i = n ? 1 - n.t - n.b : 1;
	if (!Number.isFinite(r) || !Number.isFinite(i) || !(r > 0) || !(i > 0) || !k(n)) return null;
	let a = Math.ceil(e / r), o = Math.ceil(t / i);
	return Number.isFinite(a) && Number.isFinite(o) ? {
		width: a,
		height: o
	} : null;
}
function be(e, t, n, r) {
	if (!t || !S(e)) return {
		widthPt: n,
		heightPt: r
	};
	if (!k(t)) return null;
	let i = 1 - t.l - t.r, a = 1 - t.t - t.b;
	return {
		widthPt: n / i,
		heightPt: r / a
	};
}
//#endregion
//#region packages/core/src/chart/box-whisker.ts
var xe = .06;
function M(e) {
	let t = Math.floor(e.length / 2);
	return e.length % 2 == 1 ? e[t] : e[t - 1] / 2 + e[t] / 2;
}
function Se(e) {
	let t = 0;
	for (let n of e) t = Math.max(t, Math.abs(n));
	if (t === 0) return 0;
	let n = 0;
	for (let r of e) n += r / t;
	return n / e.length * t;
}
function Ce(e, t, n) {
	if (!Number.isFinite(t)) return n < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
	let r = e + n * t;
	return Number.isFinite(r) ? r : n < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
}
function we(e, t) {
	let n = e.filter((e) => typeof e == "number" && Number.isFinite(e)).sort((e, t) => e - t);
	if (n.length === 0) return null;
	let r = Math.floor(n.length / 2), i = M(n), a = t === "inclusive" && n.length % 2 == 1, o = n.slice(0, r + +!!a), s = n.slice(r + +(n.length % 2 == 1 && !a)), c = M(o.length > 0 ? o : n), l = M(s.length > 0 ? s : n), u = (l - c) * 1.5, d = Ce(c, u, -1), f = Ce(l, u, 1), p = [], m = [];
	for (let e of n) e < d || e > f ? m.push(e) : p.push(e);
	return {
		q1: c,
		median: i,
		q3: l,
		lowerFence: d,
		upperFence: f,
		whiskerLo: p[0] ?? n[0],
		whiskerHi: p[p.length - 1] ?? n[n.length - 1],
		mean: Se(n),
		outliers: m,
		inner: p
	};
}
function Te(e, t) {
	let n = 0;
	for (let r of e) for (let e of r) if (n += e.length, !Number.isSafeInteger(n) || n > t) return t + 1;
	return n;
}
function Ee(e, t, n, r, i, a, o) {
	if (!Number.isFinite(e) || !Number.isFinite(t) || t <= 0 || !Number.isInteger(n) || n <= 0 || !Number.isInteger(r) || r <= 0 || !Number.isInteger(i) || i < 0 || i >= n || !Number.isInteger(a) || a < 0 || a >= r || !Number.isFinite(o) || o < 0) return null;
	let s = t / n, c = s / (r + o / 100), l = c * r, u = c * xe, d = c - u, f = e + s * (i + .5) - l / 2 + a * c + u / 2;
	return {
		boxX: f,
		boxWidth: d,
		centerX: f + d / 2
	};
}
//#endregion
//#region packages/core/src/chart/category-spacing.ts
function De(e, t) {
	return t == null || !Number.isFinite(t) ? e : e * Math.max(0, Math.min(1e3, t)) / 100;
}
function Oe(e, t, n, r = !1) {
	let i = Math.max(0, t - 1), a = Number.isFinite(e) ? Math.max(0, Math.min(i, e)) : 0, o = n ? (a + .5) / Math.max(1, t) : t === 1 ? .5 : a / i;
	return r ? 1 - o : o;
}
function ke(e, t) {
	if (e <= 0) return [];
	let n = [], r = t ? e : e - 1;
	for (let i = 0; i <= r; i++) n.push(t ? i / e : e === 1 ? .5 : i / (e - 1));
	return n;
}
function Ae(e, t) {
	return e <= 0 ? [] : t ? Array.from({ length: e }, (t, n) => (n + .5) / e) : e <= 1 ? [] : Array.from({ length: e - 1 }, (t, n) => (n + .5) / (e - 1));
}
function je(e, t, n, r, i) {
	if (i == null) return {
		fraction: Oe(e, t, n, r),
		textAlign: "center"
	};
	let a = Math.max(0, t - 1), o = Number.isFinite(e) ? Math.max(0, Math.min(a, e)) : 0, s, c;
	if (t <= 1 ? (s = 0, c = 1) : n ? (s = o / t, c = (o + 1) / t) : (s = o === 0 ? 0 : (o - .5) / a, c = o === a ? 1 : (o + .5) / a), r) {
		let e = 1 - c;
		c = 1 - s, s = e;
	}
	return i === "l" ? {
		fraction: s,
		textAlign: "left"
	} : i === "r" ? {
		fraction: c,
		textAlign: "right"
	} : {
		fraction: (s + c) / 2,
		textAlign: "center"
	};
}
function Me(e, t) {
	return e != null && Number.isFinite(e) ? Math.max(0, Math.min(500, e)) : t === "legacy" ? 150 : 33;
}
//#endregion
//#region packages/core/src/chart/layout.ts
function Ne(e, t, n) {
	let r = Math.max(1, t), i = [], a = [], o = 0;
	for (let t = 0; t < e.length; t++) {
		let s = Math.min(r, Math.max(0, e[t])), c = a.length === 0 ? s : o + n + s;
		a.length > 0 && c > r ? (i.push(a), a = [t], o = s) : (a.push(t), o = c);
	}
	return a.length > 0 && i.push(a), i;
}
var Pe = 14;
function N(e, t) {
	return typeof e == "number" && Number.isFinite(e) && e >= 100 && e <= 4e5 ? e / 100 * t : null;
}
function Fe(e, t, n) {
	return N(e.titleFontSizeHpt, n) ?? Pe * n;
}
var Ie = .62;
function Le(e, t, n, r, i) {
	if (!e.title && !e.titlePresent) return {
		fontPx: 0,
		topPad: 0,
		bottomPad: 0,
		bandH: 0
	};
	let a = Fe(e, t, n), o = a + t * r + t * i, s = Math.min(Math.max(0, o - a), a * Ie);
	return {
		fontPx: a,
		topPad: s,
		bottomPad: o - a - s,
		bandH: o
	};
}
function Re(e, t, n, r, i) {
	if (!e.showLegend) return null;
	let a = e.legendPos ?? "r", o = a === "l" ? "l" : a === "t" ? "t" : a === "b" ? "b" : "r";
	if (o === "r" || o === "l") {
		if (i) {
			let e = Math.min(80, t * .3), n = t * .3, r = Math.max(0, ...i.itemWidths) + i.horizontalPadding;
			return {
				side: o,
				reserveW: Math.min(n, Math.max(e, r)),
				reserveH: 0
			};
		}
		return {
			side: o,
			reserveW: Math.max(80, t * r),
			reserveH: 0
		};
	}
	if (i) {
		let e = Math.max(1, t - i.horizontalPadding), r = Ne(i.itemWidths, e, i.itemGap).length * i.rowHeight + i.verticalPadding;
		return {
			side: o,
			reserveW: 0,
			reserveH: Math.min(n * .3, r)
		};
	}
	return {
		side: o,
		reserveW: 0,
		reserveH: Math.max(18, n * .08)
	};
}
function ze(e, t = !1) {
	return t ? {
		legRightW: 0,
		legLeftW: 0,
		legTopH: 0,
		legBottomH: 0
	} : {
		legRightW: e?.side === "r" ? e.reserveW : 0,
		legLeftW: e?.side === "l" ? e.reserveW : 0,
		legTopH: e?.side === "t" ? e.reserveH : 0,
		legBottomH: e?.side === "b" ? e.reserveH : 0
	};
}
function Be(e, t) {
	return N(e, t) ?? 10 * t;
}
function Ve(e, t) {
	return Math.max(0, e != null && Number.isFinite(e) ? e : 0) / i * t;
}
function He(e, t, n) {
	let r = 0, i = !1;
	if (n != null) switch (i = !0, n) {
		case "horz": break;
		case "vert270":
			r -= 90;
			break;
		case "vert":
		case "wordArtVert":
		case "eaVert":
		case "mongolianVert":
		case "wordArtVertRtl":
			r += 90;
			break;
	}
	return t != null && Number.isFinite(t) && (r += t / 6e4, i = !0), i ? r * Math.PI / 180 : e === "left" || e === "right" ? -Math.PI / 2 : 0;
}
function Ue(e) {
	return Math.max(8, e * .02);
}
function We(e, t, n, r) {
	let i = Be(e.catAxisTitleFontSizeHpt, r), a = Be(e.valAxisTitleFontSizeHpt, r), o = Ve(e.catAxisTitleTextVerticalInsetEmu, r), s = Ve(e.valAxisTitleTextVerticalInsetEmu, r);
	return {
		catFontPx: i,
		valFontPx: a,
		catBandH: e.catAxisTitle ? i + o + Ue(n) + 4 : 0,
		valBandW: e.valAxisTitle ? a + s + Ue(t) + 4 : 0
	};
}
var Ge = 2.25, Ke = 2.75;
function qe(e, t, n) {
	if (!e.title && !e.titlePresent) return {
		fontPx: 0,
		topPad: 0,
		bottomPad: 0,
		bandH: 0
	};
	let r = Fe(e, t, n), i = r * Ge, a = Math.min(Math.max(0, i - r), r * Ie);
	return {
		fontPx: r,
		topPad: a,
		bottomPad: i - r - a,
		bandH: i
	};
}
function Je(e, t) {
	let n = Ye(e), r = De(n, t);
	return e * Ke + r - n;
}
function Ye(e) {
	return 5 / 6 * e;
}
function Xe(e) {
	return e;
}
var Ze = 1.5;
function Qe(e) {
	let t = e.outerTextMarginPx ?? 0;
	return {
		t: e.valAxisHidden ? 0 : e.valLabelFontPx / 2 + t,
		r: (e.secondaryBandW ?? 0) > 0 ? (e.secondaryBandW ?? 0) + t : 0,
		b: e.catAxisHidden ? 0 : e.catLabelFontPx + (e.catLabelGapPx ?? Ye(e.catLabelFontPx)) + e.catTitleBandH + t,
		l: e.valAxisHidden ? 0 : e.valLabelWidth + (e.valLabelGapPx ?? Xe(e.valLabelFontPx)) + e.valTitleBandW + t
	};
}
function $e(e, t, n) {
	let r = e.xMode || "factor", i = e.yMode || "factor", a = e.wMode || "factor", o = e.hMode || "factor", s = r === "edge" ? t.x + e.x * t.w : n.x + e.x * t.w, c = i === "edge" ? t.y + e.y * t.h : n.y + e.y * t.h, l = e.w == null ? n.w : a === "edge" ? t.x + e.w * t.w - s : e.w * t.w, u = e.h == null ? n.h : o === "edge" ? t.y + e.h * t.h - c : e.h * t.h;
	return ![
		s,
		c,
		l,
		u
	].every(Number.isFinite) || l <= 0 || u <= 0 ? null : {
		x: s,
		y: c,
		w: l,
		h: u
	};
}
function et(e, t, n, r, i, a, o) {
	let s = o.titleBand ?? Le(e, i, a, o.titleTopPadFrac ?? 0, o.titleBottomPadFrac ?? 0), c = o.legendReserve === void 0 ? Re(e, r, i, o.legendSideReserveFrac) : o.legendReserve, l = ze(c, e.legendOverlay === !0), u = We(e, r, i, a), d, f, p, m;
	if (o.radialGapFrac != null) {
		let e = i * o.radialGapFrac;
		p = r - l.legRightW - l.legLeftW, m = i - s.bandH - l.legTopH - l.legBottomH - e, d = t + l.legLeftW, f = n + s.bandH + l.legTopH + e;
	} else {
		let e = o.pad;
		if (!e) throw Error("computeChartFrame: cartesian frame requires params.pad");
		d = t + e.l, f = n + e.t, p = r - e.l - e.r, m = i - e.t - e.b;
	}
	let h = !1, g = o.honorPlotAreaManualLayout ? e.plotAreaManualLayout : null;
	if (g) {
		let e = g.layoutTarget === "inner" ? {
			t: 0,
			r: 0,
			b: 0,
			l: 0
		} : o.manualOuterInsets ?? {
			t: 0,
			r: 0,
			b: 0,
			l: 0
		}, a = g.layoutTarget === "inner" ? {
			x: d,
			y: f,
			w: p,
			h: m
		} : {
			x: d - e.l,
			y: f - e.t,
			w: p + e.l + e.r,
			h: m + e.t + e.b
		}, s = $e(g, {
			x: t,
			y: n,
			w: r,
			h: i
		}, a);
		s && s.w > e.l + e.r && s.h > e.t + e.b && (d = s.x + e.l, f = s.y + e.t, p = s.w - e.l - e.r, m = s.h - e.t - e.b, h = !0);
	}
	return {
		title: s,
		legend: c,
		legendBands: l,
		axisTitles: u,
		plotRect: {
			px0: d,
			py0: f,
			pw: p,
			ph: m
		},
		plotAreaManualLayoutApplied: h,
		center: {
			cx: d + p / 2,
			cy: f + m / 2
		}
	};
}
//#endregion
//#region packages/core/src/chart/data-label-layout.ts
var tt = (e) => [
	e.x,
	e.y,
	e.w,
	e.h
].every(Number.isFinite) && e.w > 0 && e.h > 0;
function nt(e, t) {
	let n = Math.max(e.x, t.x), r = Math.max(e.y, t.y), i = Math.min(e.x + e.w, t.x + t.w), a = Math.min(e.y + e.h, t.y + t.h);
	return i > n && a > r ? {
		x: n,
		y: r,
		w: i - n,
		h: a - r
	} : null;
}
function rt(e, t, n) {
	return Math.min(Math.max(e, t), n);
}
function it(e, t, n, r, i, a = t) {
	if (!tt(t) || !tt(a) || !Number.isFinite(r) || r <= 0 || ![n.w, n.h].every(Number.isFinite) || n.w < 0 || n.h <= 0) return null;
	let o = r * .5, s = t, c, l, u = !1, d = "center", f = "middle";
	if (e.kind === "point") {
		if (![
			e.x,
			e.y,
			e.markerGap ?? 0
		].every(Number.isFinite)) return null;
		let t = o + Math.max(0, e.markerGap ?? 0);
		switch (c = e.x, l = e.y, e.position ?? "r") {
			case "l":
				c -= t + n.w / 2, d = "right";
				break;
			case "t":
				l -= t + n.h / 2, f = "bottom";
				break;
			case "b":
				l += t + n.h / 2, f = "top";
				break;
			case "ctr":
			case "inEnd":
			case "bestFit": break;
			default:
				c += t + n.w / 2, d = "left";
				break;
		}
	} else if (e.kind === "box") {
		if (![
			e.rect.x,
			e.rect.y,
			e.rect.w,
			e.rect.h
		].every(Number.isFinite) || e.rect.w <= 0 || e.rect.h <= 0) return null;
		let r = nt(e.rect, t);
		if (!r) return null;
		let i = e.position ?? "ctr";
		c = r.x + r.w / 2, l = r.y + r.h / 2, i === "inBase" ? (s = {
			x: r.x + o,
			y: r.y + o,
			w: r.w - o,
			h: r.h - o
		}, c = s.x + n.w / 2, l = s.y + n.h / 2, d = "left", f = "top") : i === "inEnd" ? (s = {
			x: r.x + o,
			y: r.y,
			w: r.w - o,
			h: r.h - o
		}, c = s.x + n.w / 2, l = s.y + s.h - n.h / 2, d = "left", f = "bottom") : i === "l" ? (s = {
			x: r.x + o,
			y: r.y + o,
			w: r.w - o,
			h: r.h - o * 2
		}, c = s.x + n.w / 2, d = "left") : i === "r" || i === "outEnd" ? (s = {
			x: r.x,
			y: r.y + o,
			w: r.w - o,
			h: r.h - o * 2
		}, c = s.x + s.w - n.w / 2, d = "right") : i === "t" ? (s = {
			x: r.x + o,
			y: r.y + o,
			w: r.w - o * 2,
			h: r.h - o
		}, l = s.y + n.h / 2, f = "top") : i === "b" ? (s = {
			x: r.x + o,
			y: r.y,
			w: r.w - o * 2,
			h: r.h - o
		}, l = s.y + s.h - n.h / 2, f = "bottom") : s = {
			x: r.x + o,
			y: r.y + o,
			w: r.w - o * 2,
			h: r.h - o * 2
		};
	} else {
		if (![
			e.rect.x,
			e.rect.y,
			e.rect.w,
			e.rect.h
		].every(Number.isFinite) || e.rect.w < 0 || e.rect.h < 0) return null;
		let r = e.position ?? "outEnd", i = r === "inBase" || r === "inEnd" || r === "ctr";
		if (u = !i, i) {
			let n = nt(e.rect, t);
			if (!n) return null;
			s = n;
		} else if (e.orientation === "vertical" && e.rect.w <= 0 || e.orientation === "horizontal" && e.rect.h <= 0) return null;
		let a = e.rect.x + e.rect.w / 2, p = e.rect.y + e.rect.h / 2;
		if (c = a, l = p, e.orientation === "vertical") {
			let t = e.negative ? e.rect.y + e.rect.h : e.rect.y, i = e.negative ? e.rect.y : e.rect.y + e.rect.h;
			r === "inBase" ? (l = i + (e.negative ? 1 : -1) * (o + n.h / 2), f = e.negative ? "top" : "bottom") : r === "inEnd" ? (l = t + (e.negative ? -1 : 1) * (o + n.h / 2), f = e.negative ? "bottom" : "top") : r !== "ctr" && (l = t + (e.negative ? 1 : -1) * (o + n.h / 2), f = e.negative ? "top" : "bottom");
		} else {
			let t = e.negative ? e.rect.x : e.rect.x + e.rect.w, i = e.negative ? e.rect.x + e.rect.w : e.rect.x;
			r === "inBase" ? (c = i + (e.negative ? -1 : 1) * (o + n.w / 2), d = e.negative ? "right" : "left") : r === "inEnd" ? (c = t + (e.negative ? 1 : -1) * (o + n.w / 2), d = e.negative ? "left" : "right") : r !== "ctr" && (c = t + (e.negative ? -1 : 1) * (o + n.w / 2), d = e.negative ? "right" : "left");
		}
	}
	let p = Math.max(2, r * .5), m = Math.max(2, r * .9);
	if (s.w < p || s.h < m) return null;
	let h = {
		x: c - Math.min(n.w, s.w) / 2,
		y: l - Math.min(n.h, s.h) / 2,
		w: Math.min(n.w, s.w),
		h: Math.min(n.h, s.h)
	};
	if (i) {
		let e = $e(i, a, h);
		if (!e) return null;
		h = e, d = "center", f = "middle";
		let n = nt(e, t);
		if (!n || (s = n, s.w < p || s.h < m)) return null;
	}
	let g = Math.min(Math.max(p, h.w), s.w), _ = Math.min(Math.max(m, h.h), s.h), v = g / 2, y = _ / 2, b = u || i ? h.x + h.w / 2 : rt(h.x + h.w / 2, s.x + v, s.x + s.w - v), x = u || i ? h.y + h.h / 2 : rt(h.y + h.h / 2, s.y + y, s.y + s.h - y);
	return [b, x].every(Number.isFinite) ? {
		x: d === "left" ? b - v : d === "right" ? b + v : b,
		y: f === "top" ? x - y : f === "bottom" ? x + y : x,
		textAlign: d,
		textBaseline: f,
		maxWidth: s.w,
		maxHeight: s.h,
		clip: s,
		rect: h
	} : null;
}
var at = 4096, ot = 4;
function st(e, t, n) {
	if (n(e) <= t) return e;
	if (n("…") > t) return "";
	let r = 0, i = Array.from(e), a = i.length;
	for (; r < a;) {
		let e = Math.ceil((r + a) / 2);
		n(`${i.slice(0, e).join("")}…`) <= t ? r = e : a = e - 1;
	}
	return `${i.slice(0, r).join("")}…`;
}
function ct(e) {
	let t = "", n = 0;
	for (let r of e) {
		if (n >= at) return {
			value: t,
			truncated: !0
		};
		t += r, n++;
	}
	return {
		value: t,
		truncated: !1
	};
}
function lt(e, t, n, r, i) {
	if (![
		t,
		n,
		r
	].every(Number.isFinite) || t <= 0 || n < r || r <= 0) return [];
	let a = Math.max(1, Math.min(ot, Math.floor(n / r))), o = ct(e), s = o.value.split(/\r?\n/), c = [], l = o.truncated, u = (e) => {
		let n = [], r = "";
		for (let a of Array.from(e)) {
			let e = `${r}${a}`;
			r && i(e) > t ? (n.push(r), r = a) : r = e;
		}
		return r && n.push(r), n.filter((e) => i(e) <= t);
	};
	for (let e of s) {
		if (i(e) <= t) {
			c.push(e);
			continue;
		}
		let n = e.match(/\S+\s*|\s+/g) ?? [];
		if (n.length <= 1) c.push(...u(e));
		else {
			let e = "";
			for (let r of n) {
				let n = `${e}${r}`;
				if (i(n) <= t) e = n;
				else {
					e && c.push(e);
					let t = u(r);
					e = t.pop() ?? "", c.push(...t);
				}
			}
			e && c.push(e);
		}
	}
	l ||= c.length > a;
	let d = c.slice(0, a);
	return l && d.length > 0 && !d[d.length - 1].endsWith("…") && (d[d.length - 1] = st(`${d[d.length - 1]}…`, t, i)), d;
}
//#endregion
//#region packages/core/src/chart/data-label-style.ts
function ut(e, t) {
	return (t?.deleted ?? e?.deleted) === !0;
}
function dt(e, t) {
	let n = e?.fontPaintAuthored === !0 || e?.fontColor != null || e?.fontHidden === !0, r = t?.fontPaintAuthored === !0 || t?.fontColor != null || t?.fontHidden === !0;
	return {
		fontColor: n ? e.fontColor : e?.fontColor ?? t?.fontColor,
		fontItalic: e?.fontItalic ?? t?.fontItalic,
		fontLanguage: e?.fontLanguage ?? t?.fontLanguage,
		fontBaseline: e?.fontBaseline ?? t?.fontBaseline,
		fontPaintAuthored: n ? !0 : r || void 0,
		fontHidden: n ? e.fontHidden : t?.fontHidden,
		textRotation: e?.textRotation ?? t?.textRotation,
		textWrap: e?.textWrap ?? t?.textWrap,
		textVerticalAnchor: e?.textVerticalAnchor ?? t?.textVerticalAnchor,
		textVerticalMode: e?.textVerticalMode ?? t?.textVerticalMode,
		textLInsEmu: e?.textLInsEmu ?? t?.textLInsEmu,
		textTInsEmu: e?.textTInsEmu ?? t?.textTInsEmu,
		textRInsEmu: e?.textRInsEmu ?? t?.textRInsEmu,
		textBInsEmu: e?.textBInsEmu ?? t?.textBInsEmu,
		textBodyAuthored: e?.textBodyAuthored === !0 || t?.textBodyAuthored === !0 || void 0,
		textAlign: e?.textAlign ?? t?.textAlign
	};
}
function ft(e, t) {
	return e?.textAlign === "l" ? "left" : e?.textAlign === "r" ? "right" : e?.textAlign === "ctr" ? "center" : t;
}
function pt(e, t) {
	let n = t / i, o = e?.textBodyAuthored === !0 ? a : 0, s = e?.textBodyAuthored === !0 ? r : 0;
	return {
		left: (e?.textLInsEmu ?? o) * n,
		top: (e?.textTInsEmu ?? s) * n,
		right: (e?.textRInsEmu ?? o) * n,
		bottom: (e?.textBInsEmu ?? s) * n
	};
}
function mt(e, t) {
	let n = Number.isFinite(e) ? e / 6e4 * Math.PI / 180 : 0;
	return t === "vert" ? n + Math.PI / 2 : t === "vert270" ? n + Math.PI * 3 / 2 : n;
}
function ht(e, t, n, r) {
	let i = mt(n, r);
	if (i === 0) return {
		w: e,
		h: t,
		radians: i
	};
	let a = Math.abs(Math.cos(i)), o = Math.abs(Math.sin(i));
	return {
		w: e * a + t * o,
		h: e * o + t * a,
		radians: i
	};
}
function gt(e, t, n, r, i, a, o) {
	return r !== 0 && (e.translate(t, n), e.rotate(r), e.translate(-t, -n)), {
		x: t + (i === "left" ? o.left : i === "right" ? -o.right : (o.left - o.right) / 2),
		y: n + (a === "top" ? o.top : a === "bottom" ? -o.bottom : (o.top - o.bottom) / 2)
	};
}
function _t(e, t, n, r, i, a) {
	return a?.textWrap === "none" ? ![
		t,
		n,
		r
	].every(Number.isFinite) || t <= 0 || n <= 0 || r <= 0 ? [] : ct(e).value.split(/\r?\n/) : lt(e, t, n, r, i);
}
function vt(e, t, n, r, i, a, o = "center", s = "center", c = n.w, l = 0) {
	if (!a) {
		let n = Math.max(0, c) / 2, r = (e) => e === "left" ? -n : e === "right" ? n : 0, i = r(o) - r(s);
		return {
			x: e + Math.cos(l) * i,
			y: t + Math.sin(l) * i
		};
	}
	let u = o === "left" ? n.x : o === "right" ? n.x + n.w : n.x + n.w / 2, d = i?.textVerticalAnchor ?? (i?.textBodyAuthored === !0 ? "t" : "ctr");
	return d === "t" ? {
		x: u,
		y: n.y + Math.min(r, n.h) / 2
	} : d === "b" ? {
		x: u,
		y: n.y + n.h - Math.min(r, n.h) / 2
	} : {
		x: u,
		y: n.y + n.h / 2
	};
}
//#endregion
//#region packages/core/src/chart/marker-style.ts
function yt(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.legendEntries ?? []) n.deleted === !0 && t.add(n.idx);
	return t;
}
function bt(e) {
	return e.markerSymbol != null || e.markerSize != null || e.markerFill != null || e.markerFillPaint !== void 0 || e.markerFillPaintAuthored === !0 || e.markerLine != null || e.markerLineWidthEmu != null;
}
function xt(e) {
	return e != null && (e.markerSymbol != null || e.markerSize != null || e.markerFill != null || e.color != null || e.markerFillPaint !== void 0 || e.markerFillPaintAuthored === !0 || e.markerLine != null || e.markerLineWidthEmu != null);
}
function St(e, t) {
	return t == null || !Number.isFinite(t) || t === 0 || t < 0 && e.showNegativeBubbles !== !0 ? null : Math.abs(t);
}
function Ct(e, t) {
	return e.bubble3D ?? e.bubble3DGroupDefault ?? !1;
}
function P(e) {
	return e !== "none" && e !== "x" && e !== "plus";
}
function F(e, t, n, r, i, a) {
	let o = a?.chartType ?? e.chartType, s = t.values[r] != null;
	if (!s && (n === "line" || n === "stackedLine" || n === "stackedLinePct") && (s = (o === "line" || o === "stackedLine" || o === "stackedLinePct") && (o !== "line" || e.dispBlanksAs === "zero")), !s) return !1;
	if (n === "scatter" && i) {
		let n = (t.categories ?? e.categories)[r];
		if (n == null || !Number.isFinite(Number.parseFloat(n))) return !1;
	}
	if (n === "scatter" && o === "bubble") {
		let n = t.bubbleSizes?.[r];
		if (n == null || !Number.isFinite(n) || n === 0) return !1;
		let i = a?.showNegativeBubbles ?? e.showNegativeBubbles;
		return n < 0 && i !== !0 ? !1 : (a?.bubbleScale ?? e.bubbleScale ?? 100) > 0;
	}
	return !0;
}
function wt(e, t, n, r, i, a) {
	if (n === "radar" || !t.seriesDataLabels && !t.dataLabelOverrides?.length) return 0;
	let o = new Map((t.dataLabelOverrides ?? []).map((e) => [e.idx, e])), s = 0;
	for (let c = 0; c < r; c++) {
		let r = o.get(c);
		ut(t.seriesDataLabels, r) || (r?.showLegendKey ?? t.seriesDataLabels?.showLegendKey ?? !1) === !0 && F(e, t, n, c, i, a) && s++;
	}
	return s;
}
function Tt(e) {
	return e === "line" || e === "stackedLine" || e === "stackedLinePct" || e === "area" || e === "stackedArea" || e === "stackedAreaPct" || e === "stock" || e === "clusteredBar" || e === "clusteredBarH" || e === "stackedBar" || e === "stackedBarH" || e === "stackedBarPct" || e === "stackedBarHPct";
}
function Et(e) {
	return e.dataPointOverrides?.some((e) => e.markerSymbol != null && e.markerSymbol !== "none") === !0;
}
function Dt(e, t, n, r) {
	return e === "radar" ? r === "filled" : e === "scatter" && t !== "bubble" && (n === "lineNoMarker" || n === "smoothNoMarker");
}
function Ot(e, t, n, r) {
	let i = n.seriesType ?? e;
	return !(i === "line" || i === "stackedLine" || i === "stackedLinePct" || i === "stock" || i === "radar") && i !== "scatter" && i !== "bubble" || i === "radar" && r === "filled" || i === "scatter" && (t === "lineNoMarker" || t === "smoothNoMarker") ? !1 : (n.markerSymbol ?? (i === "stock" ? "none" : "circle")) !== "none" && n.showMarker !== !1;
}
function kt(e, t, n, r) {
	return t?.markerSymbol == null ? !r || e.markerSymbol === "none" ? "none" : e.markerSymbol ?? n : t.markerSymbol;
}
function At(e, t, n) {
	if (t?.markerFillPaint !== void 0) return t.markerFillPaint;
	if (!(t?.markerFill != null || t?.color != null || t?.markerFillPaintAuthored === !0) && e.dataPointColors?.[n] == null && e.markerFillPaint !== void 0) return e.markerFillPaint;
}
function jt(e, t, n, r) {
	return t?.markerFill == null ? t?.color == null ? e.dataPointColors?.[n] ?? (t?.markerFillPaintAuthored === !0 ? "00000000" : e.markerFill == null ? e.markerFillPaintAuthored === !0 ? "00000000" : r : e.markerFill) : t.color : t.markerFill;
}
function Mt(e) {
	return e.markerFillPaint;
}
function Nt(e, t) {
	return e.markerFill == null ? e.markerFillPaintAuthored === !0 ? "00000000" : t : e.markerFill;
}
function Pt(e) {
	return e?.fillType === "gradient" ? e.stops.length : e == null ? 0 : 1;
}
//#endregion
//#region packages/core/src/chart/resource-limits.ts
var I = 1e4, Ft = 4096, It = 1048576, Lt = 4096, Rt = new Set([
	"clusteredBar",
	"clusteredBarH",
	"stackedBar",
	"stackedBarH",
	"stackedBarPct",
	"stackedBarHPct",
	"clusteredColumn",
	"line",
	"stackedLine",
	"stackedLinePct",
	"area",
	"stackedArea",
	"stackedAreaPct",
	"pie",
	"doughnut",
	"radar",
	"scatter",
	"bubble",
	"stock",
	"surface"
]);
function zt(e) {
	return Rt.has(e);
}
function Bt(e) {
	let t = 0, n = (e) => !Number.isSafeInteger(e) || e < 0 || e > 1e4 - t ? !1 : (t += e, !0), r = (e, n) => !Number.isSafeInteger(e) || e < 0 || !Number.isSafeInteger(n) || n < 0 || e !== 0 && n > Math.floor((1e4 - t) / e) ? !1 : (t += e * n, !0);
	if (!n(e.legendEntries?.length ?? 0) || !n(e.plotGroups?.length ?? 0)) return I + 1;
	if (e.plotGroups != null) {
		let t = 0;
		for (let n of e.plotGroups) {
			if (!Number.isSafeInteger(n.seriesStart) || n.seriesStart < 0 || !Number.isSafeInteger(n.seriesCount) || n.seriesCount < 0 || n.seriesStart !== t || n.seriesCount > e.series.length - t) return I + 1;
			t += n.seriesCount;
		}
		if (t !== e.series.length) return I + 1;
	}
	for (let t of e.series) {
		let i = Math.max(1, e.categories.length, t.values.length, t.categories?.length ?? 0, t.bubbleSizes?.length ?? 0, t.dataPointOverrides?.length ?? 0, t.dataLabelOverrides?.length ?? 0);
		if (!n(i) || !r(t.trendLines?.length ?? 0, Math.max(1, t.values.length)) || !n(t.errBars?.length ?? 0)) return I + 1;
		for (let e of t.errBars ?? []) if (!n(Math.max(i, e.plus.length, e.minus.length))) return I + 1;
	}
	if (!n(e.chartexSunburst?.rows.length ?? 0) || !n(e.chartexTreemap?.rows.length ?? 0) || !n(e.chartexRegionMap?.rows.length ?? 0) || !n(e.chartexBox?.categories.length ?? 0) || !n(e.chartexBox?.series.length ?? 0)) return I + 1;
	for (let t of e.chartexBox?.series ?? []) for (let e of t.valuesByCategory) if (!n(e.length)) return I + 1;
	return n(e.ofPie?.customSplitIndices?.length ?? 0) ? t : I + 1;
}
function Vt(e) {
	if (!zt(e.chartType)) return null;
	let t = 0;
	for (let n of e.series) {
		let r = 0;
		for (let e of n.errBars ?? []) r = Math.max(r, e.plus.length, e.minus.length);
		let i = Math.max(1, e.categories.length, n.categories?.length ?? 0, n.values.length, n.bubbleSizes?.length ?? 0, n.dataPointOverrides?.length ?? 0, n.dataLabelOverrides?.length ?? 0, n.trendLines?.length ?? 0, r);
		if (!Number.isSafeInteger(i) || i > 1e4 - t) return I + 1;
		t += i;
	}
	return t;
}
//#endregion
//#region packages/core/src/chart/plot-groups.ts
var Ht = new Set([
	"area3D",
	"line3D",
	"pie3D",
	"bar3D",
	"surface3D"
]);
function Ut(e, t) {
	return t === "bar" || t === "bar3D" ? e.includes("Bar") : t === "line" || t === "line3D" ? e.includes("Line") : t === "area" || t === "area3D" ? e.includes("Area") : t === "pie" || t === "pie3D" ? e === "pie" : t === "surface" || t === "surface3D" ? e === "surface" || e === "surface3D" : e === t;
}
function Wt(e) {
	if (e.plotGroups == null) return !0;
	let t = 0;
	for (let n of e.plotGroups) {
		if (!Number.isSafeInteger(n.seriesStart) || n.seriesStart !== t || !Number.isSafeInteger(n.seriesCount) || n.seriesCount < 0 || n.seriesCount > e.series.length - t) return !1;
		t += n.seriesCount;
	}
	return t === e.series.length;
}
function Gt(e) {
	let t = Array(e.series.length);
	for (let n of e.plotGroups ?? []) {
		let r = Math.min(e.series.length, n.seriesStart + n.seriesCount);
		for (let e = n.seriesStart; e < r; e++) t[e] = n;
	}
	return t;
}
function Kt(e, t) {
	return t ? t.kind === "bubble" ? "bubble" : t.kind === "line" ? t.grouping === "percentStacked" ? "stackedLinePct" : t.grouping === "stacked" ? "stackedLine" : "line" : t.kind === "area" ? t.grouping === "percentStacked" ? "stackedAreaPct" : t.grouping === "stacked" ? "stackedArea" : "area" : t.kind : e;
}
function qt(e) {
	if (e.plotGroups == null || e.plotGroups.length <= 1) return "legacy";
	if (!Wt(e)) return "unsupported";
	let t = e.plotGroups.filter((e) => e.seriesCount > 0);
	if (t.length === 0) return "legacy";
	if (t.length === 1) return Ut(e.chartType, t[0].kind) ? "legacy" : "unsupported";
	if (t.some((e) => e.categoryAxis === "none" || e.valueAxis === "none") || t.some((t) => t.categoryAxis === "secondary" && e.secondaryCatAxis == null || t.valueAxis === "secondary" && e.secondaryValAxis == null)) return "unsupported";
	let n = new Set(t.map((e) => e.kind));
	if (t.some((e) => Ht.has(e.kind))) return "unsupported";
	if (t.length === 2 && t[0].kind === "bar" && t[1].kind === "scatter") {
		let [n, r] = t, i = e.series.slice(n.seriesStart, n.seriesStart + n.seriesCount), a = e.series.slice(r.seriesStart, r.seriesStart + r.seriesCount);
		return n.categoryAxis === "primary" && (n.valueAxis === "primary" || n.valueAxis === "unresolved") && (r.categoryAxis === "secondary" || r.categoryAxis === "unresolved") && r.valueAxis === "secondary" && e.secondaryCatAxis != null && e.secondaryValAxis != null && i.every((e) => e.useSecondaryAxis !== !0) && a.every((e) => e.useSecondaryAxis === !0) ? "bar-combo" : "unsupported";
	}
	if (t.some((e) => e.categoryAxis === "unresolved" || e.valueAxis === "unresolved" || e.seriesAxis === "unresolved")) return "unsupported";
	if (n.size === 1) {
		let n = t[0].kind;
		if (n === "line" || n === "area") return t.some((e) => e.categoryAxis !== "primary") ? "unsupported" : n === "line" ? "line-groups" : "area-groups";
		if (n === "scatter" || n === "bubble") return "scatter-bubble";
		if (n === "bar") {
			let n = e.chartType.endsWith("H") ? "bar" : "col";
			return new Set(t.map((e) => e.barDirection ?? n)).size > 1 && (t.length !== 2 || t.some((e) => e.categoryAxis !== "primary" || e.valueAxis !== "primary")) ? "unsupported" : "bar-combo";
		}
		return "unsupported";
	}
	if (t.length === 2 && n.has("bar") && n.has("area")) return t.find((e) => e.kind === "line" || e.kind === "area")?.categoryAxis === "primary" ? "bar-combo" : "unsupported";
	if (t.length === 2 && t[0].kind === "area" && t[1].kind === "line" && t.every((e) => e.categoryAxis === "primary" && e.valueAxis === "primary")) return "area-groups";
	if (n.size === 2 && n.has("bar") && n.has("line")) {
		let n = t.filter((e) => e.kind === "bar"), r = t.filter((e) => e.kind === "line"), i = e.chartType.endsWith("H") ? "bar" : "col", a = new Set(n.map((e) => e.barDirection ?? i));
		return n.length <= 2 && r.length === 1 && t.length <= 3 && a.size === 1 && t.every((e) => e.categoryAxis === "primary") ? "bar-combo" : "unsupported";
	}
	return [...n].every((e) => e === "scatter" || e === "bubble") ? t.length > 2 ? "unsupported" : "scatter-bubble" : t.length === 2 && t[0].kind === "stock" && t[1].kind === "line" && (t[0].seriesCount === 3 || t[0].seriesCount === 4) && (t[1].grouping == null || t[1].grouping === "standard") && t.every((e) => e.categoryAxis === "primary" && e.valueAxis === "primary") ? "stock-line" : "unsupported";
}
//#endregion
//#region packages/core/src/chart/style-paint.ts
function L(e, t, n) {
	let r = t === "fill" ? e?.fillColors : e?.lineColors;
	return r?.length ? r[((t === "fill" ? e?.fillColorIndex : e?.lineColorIndex) ?? n) % r.length] ?? null : null;
}
function Jt(e, t) {
	let n = e?.fillPaints;
	return n?.length ? n[(e?.fillColorIndex ?? t) % n.length] ?? null : null;
}
function Yt(e, t) {
	let n = e?.linePaints;
	return n?.length ? n[(e?.lineColorIndex ?? t) % n.length] ?? null : null;
}
function R(e, t) {
	if (!e) return;
	if (e.fillHidden) return e.fillNoStyle ? void 0 : null;
	let n = Jt(e, t);
	if (n) return n;
	let r = L(e, "fill", t);
	return r ? {
		fillType: "solid",
		color: r
	} : e.fillPaintAuthored === !0 ? null : void 0;
}
function z(e, t) {
	if (!e) return;
	if (e.lineHidden) return e.lineNoStyle ? void 0 : null;
	let n = Yt(e, t);
	if (n) return n;
	let r = L(e, "line", t);
	return r ? {
		fillType: "solid",
		color: r
	} : e.linePaintAuthored === !0 ? null : void 0;
}
function Xt(e, t, n) {
	let r = t?.style, i = e.chartStyleRoles?.[n], a;
	a = t?.fillHidden === !0 ? null : t?.fillColor ? {
		fillType: "solid",
		color: t.fillColor
	} : R(r, 0), a === void 0 && (a = R(i, 0));
	let o;
	o = t?.lineHidden === !0 ? null : t?.lineColor ? {
		fillType: "solid",
		color: t.lineColor
	} : z(r, 0), o === void 0 && (o = z(i, 0));
	let s = i?.lineNoStyle === !0 ? void 0 : i;
	return {
		fill: a,
		line: o,
		lineWidthEmu: t?.lineWidthEmu ?? r?.lineWidthEmu ?? s?.lineWidthEmu,
		lineDash: t?.lineDash ?? r?.lineDash ?? s?.lineDash,
		lineCustomDash: r?.lineCustomDash ?? s?.lineCustomDash,
		lineCap: r?.lineCap ?? s?.lineCap,
		lineJoin: r?.lineJoin ?? s?.lineJoin
	};
}
//#endregion
//#region packages/core/src/chart/three-d-surface-picture-plan.ts
function B(e, t) {
	return !Number.isSafeInteger(t) || t < 0 ? !1 : e.slabFaces ? t === 0 ? e.slabFaces.front : t === 1 || t >= 6 ? !1 : t % 2 == 0 ? e.slabFaces.end : e.slabFaces.sides : t === 0;
}
function Zt(e, t) {
	return e.mode !== "stack" && e.mode !== "stackScale" || !B(e, t) ? !1 : !e.slabFaces || t === 0 || t % 2 == 1;
}
function Qt(e, t) {
	return B(e, t) ? $t(e, t) ? e.repetitions : 1 : 0;
}
function $t(e, t) {
	return e.mode === "stackScale" && Zt(e, t);
}
function V(e) {
	let t = 0;
	for (let n = 0; n < 6; n++) if (t += Qt(e, n), t > 4096) return null;
	return e;
}
function H(e) {
	return e == null || [
		e.l,
		e.t,
		e.r,
		e.b
	].every((e) => (e ?? 0) === 0);
}
function en(e) {
	if (!e) return !0;
	let t = e.l ?? 0, n = e.t ?? 0, r = e.r ?? 0, i = e.b ?? 0, a = [
		t,
		n,
		r,
		i
	], o = 1 - r, s = 1 - i;
	return a.every(Number.isFinite) && o > t && s > n && Math.min(1, o) > Math.max(0, t) && Math.min(1, s) > Math.max(0, n);
}
function tn(e, t, n, r) {
	if (e.tile != null == (e.stretch === !0) || !en(e.srcRect) || !en(e.fillRect) || e.rotWithShape === !1 || e.alpha != null && (!Number.isFinite(e.alpha) || e.alpha < 0 || e.alpha > 1)) return null;
	let i = t?.pictureOptions;
	if (i?.pictureFormatAuthored === !0 && i.pictureFormat == null || i?.pictureStackUnitAuthored === !0 && i.pictureStackUnit == null) return null;
	let a = i?.pictureFormat ?? "stretch";
	if ((!H(e.srcRect) || !H(e.fillRect)) && a !== "stretch") return null;
	let o = t?.thicknessPercent ?? 0;
	if (!Number.isFinite(o) || o < 0) return null;
	let s = o === 0 ? void 0 : {
		front: i?.applyToFront !== !1,
		sides: i?.applyToSides !== !1,
		end: i?.applyToEnd !== !1
	};
	if (s && !Object.values(s).some(Boolean) || !s && (n === "backWall" && i?.applyToFront === !1 || (n === "floor" || n === "sideWall") && i?.applyToSides === !1) || (i?.pictureStackUnitAuthored === !0 || i?.pictureStackUnit != null) && a !== "stackScale") return null;
	if (e.tile) return a !== "stretch" || !H(e.fillRect) ? null : V({
		mode: "tile",
		repetitions: 1,
		slabFaces: s
	});
	if (a === "stretch") return V({
		mode: "stretch",
		repetitions: 1,
		slabFaces: s
	});
	if (a === "stack") return V({
		mode: "stack",
		repetitions: 1,
		slabFaces: s
	});
	if (a !== "stackScale") return null;
	let c = i?.pictureStackUnit;
	if (!(c != null && Number.isFinite(c) && c > 0)) return null;
	if (n === "floor") return V({
		mode: "stretch",
		repetitions: 1,
		slabFaces: s
	});
	if (r == null) return V({
		mode: "stackScale",
		repetitions: 1,
		stackUnit: c,
		slabFaces: s
	});
	if (!(Number.isFinite(r) && r > 0)) return null;
	let l = Math.ceil(r / c);
	return !Number.isSafeInteger(l) || l < 1 || l > 4096 ? null : V({
		mode: "stackScale",
		repetitions: l,
		stackUnit: c,
		slabFaces: s
	});
}
//#endregion
//#region packages/core/src/chart/image-fill.ts
var nn = new Set([
	"line",
	"stackedLine",
	"stackedLinePct",
	"area",
	"stackedArea",
	"stackedAreaPct",
	"clusteredBar",
	"clusteredBarH",
	"stackedBar",
	"stackedBarH",
	"stackedBarPct",
	"stackedBarHPct",
	"surface",
	"surface3D"
]);
function U(e) {
	return JSON.stringify([
		e.imagePath,
		e.svgImagePath ?? null,
		e.duotone?.clr1 ?? null,
		e.duotone?.clr2 ?? null
	]);
}
var W;
function rn(e, t) {
	let n = W;
	W = e;
	try {
		return t();
	} finally {
		W = n;
	}
}
function an(e, t, n, r, i) {
	let a = e;
	return {
		x: a.endsWith("r") || a === "r" ? t - r : a === "t" || a === "ctr" || a === "b" ? (t - r) / 2 : 0,
		y: a.startsWith("b") || a === "b" ? n - i : a === "l" || a === "ctr" || a === "r" ? (n - i) / 2 : 0
	};
}
var on = new Set([
	"tl",
	"t",
	"tr",
	"l",
	"ctr",
	"r",
	"bl",
	"b",
	"br"
]), sn = new Set([
	"none",
	"x",
	"y",
	"xy"
]);
function G(e) {
	return e.tile != null != (e.stretch === !0) && k(e.srcRect);
}
function cn(e) {
	let t = e.tile;
	if (!t) return null;
	let { algn: n, tx: r, ty: i, sx: a, sy: o } = t, s = t.flip ?? "none", c = e.dpi;
	return !n || !on.has(n) || !sn.has(s) || !Number.isFinite(r) || !Number.isFinite(i) || !(c != null && Number.isFinite(c) && c > 0) || !(Number.isFinite(a) && a > 0) || !(Number.isFinite(o) && o > 0) ? null : {
		alignment: n,
		tx: r,
		ty: i,
		sx: a,
		sy: o,
		dpi: c,
		flipX: s === "x" || s === "xy",
		flipY: s === "y" || s === "xy"
	};
}
function ln(e) {
	return G(e) ? W?.(e) ?? null : null;
}
function un(e, t, r = n) {
	let a = cn(e);
	if (!a) return null;
	let o = A(t);
	if (!(Number.isFinite(o.w) && o.w > 0) || !(Number.isFinite(o.h) && o.h > 0)) return null;
	let s = 96 / a.dpi * (r / n), c = o.w * a.sx * s, l = o.h * a.sy * s;
	return !(c > 0) || !(l > 0) ? null : {
		alignment: a.alignment,
		tileW: c,
		tileH: l,
		offsetX: a.tx / i * r,
		offsetY: a.ty / i * r,
		flipX: a.flipX,
		flipY: a.flipY
	};
}
function dn(e, t, n) {
	let r = an(e.alignment, t, n, e.tileW, e.tileH);
	return {
		x: r.x + e.offsetX,
		y: r.y + e.offsetY
	};
}
function fn(e, t, n, r, i) {
	let a = un(e, t, i);
	if (!a) return null;
	let { tileW: o, tileH: s } = a, c = Math.ceil(n / o) + 2, l = Math.ceil(r / s) + 2, u = c * l;
	return Number.isSafeInteger(u) ? {
		...a,
		columns: c,
		rows: l,
		repetitions: u
	} : null;
}
function pn(e, t, r, i, a = n) {
	if (!(r > 0) || !(i > 0) || !G(e)) return 0;
	let o = t?.(e);
	if (!o) return 0;
	if (!e.tile) return 1;
	let s = fn(e, o, r, i, a);
	return s ? Math.min(s.repetitions, Lt) : 0;
}
function K(e) {
	return Number.isFinite(e) && e > 0;
}
function mn(e, t) {
	if (!K(t.widthPt) || !K(t.heightPt) || !K(e.metafileWidthFactor) || !K(e.metafileHeightFactor) || !Number.isFinite(e.targetWidthFactor) || e.targetWidthFactor < 0 || !Number.isFinite(e.targetHeightFactor) || e.targetHeightFactor < 0) return null;
	let n = t.widthPt * e.metafileWidthFactor, r = t.heightPt * e.metafileHeightFactor;
	if (!K(n) || !K(r)) return null;
	let i = t.targetWidthPx, a = t.targetHeightPx;
	if (i != null != (a != null)) return null;
	if (i == null || a == null) return {
		widthPt: n,
		heightPt: r
	};
	if (!K(i) || !K(a)) return null;
	let o = i * e.targetWidthFactor, s = a * e.targetHeightFactor;
	if (!Number.isFinite(o) || o < 0 || e.targetWidthFactor > 0 && o === 0 || !Number.isFinite(s) || s < 0 || e.targetHeightFactor > 0 && s === 0) return null;
	let c = Math.ceil(o), l = Math.ceil(s);
	return !Number.isFinite(c) || !Number.isFinite(l) ? null : {
		widthPt: n,
		heightPt: r,
		targetWidthPx: c,
		targetHeightPx: l
	};
}
function hn(e) {
	if (!G(e)) return null;
	let t = e.srcRect ? 1 - e.srcRect.l - e.srcRect.r : 1, n = e.srcRect ? 1 - e.srcRect.t - e.srcRect.b : 1;
	if (!(Number.isFinite(t) && t > 0) || !(Number.isFinite(n) && n > 0)) return null;
	let r = e.srcRect != null;
	if (e.tile) {
		if (!cn(e)) return null;
		let i = 1 / t, a = 1 / n;
		return !K(i) || !K(a) ? null : {
			preserveNaturalSize: !0,
			hasSourceCrop: r,
			targetWidthFactor: 0,
			targetHeightFactor: 0,
			metafileWidthFactor: i,
			metafileHeightFactor: a
		};
	}
	let i = e.fillRect, a = i?.l ?? 0, o = i?.t ?? 0, s = i?.r ?? 0, c = i?.b ?? 0;
	if (![
		a,
		o,
		s,
		c
	].every(Number.isFinite)) return null;
	let l = 1 - a - s, u = 1 - o - c;
	if (!K(l) || !K(u)) return null;
	let d = l / t, f = u / n;
	return !K(d) || !K(f) ? null : {
		preserveNaturalSize: !1,
		hasSourceCrop: r,
		targetWidthFactor: d,
		targetHeightFactor: f,
		metafileWidthFactor: d,
		metafileHeightFactor: f
	};
}
function gn(e, t) {
	return {
		fill: e.fill,
		preserveNaturalSize: e.preserveNaturalSize || t.preserveNaturalSize,
		hasSourceCrop: e.hasSourceCrop || t.hasSourceCrop,
		targetWidthFactor: Math.max(e.targetWidthFactor, t.targetWidthFactor),
		targetHeightFactor: Math.max(e.targetHeightFactor, t.targetHeightFactor),
		metafileWidthFactor: Math.max(e.metafileWidthFactor, t.metafileWidthFactor),
		metafileHeightFactor: Math.max(e.metafileHeightFactor, t.metafileHeightFactor)
	};
}
function _n(e, t) {
	if (Bt(e) > 1e4) return {
		usages: [],
		sourceLimitExceeded: !1,
		usageRejected: !1
	};
	let n = /* @__PURE__ */ new Map(), r = !1, i = !1, a = (e) => {
		if (i || !e || typeof e != "object" || e.fillType !== "image") return;
		let a = e, o = hn(a);
		if (!o) return;
		let s = U(a), c = {
			fill: a,
			...o
		};
		if (t && !t(c)) {
			i = !0;
			return;
		}
		let l = n.get(s);
		if (l) {
			n.set(s, gn(l, c));
			return;
		}
		if (n.size >= 256) {
			r = !0;
			return;
		}
		n.set(s, c);
	}, o = (e, t) => {
		let n = e?.fillPaints;
		if (n?.length) return n[(e?.fillColorIndex ?? t) % n.length];
	}, s = (e, t) => {
		if (!e) return;
		if (e.fillHidden === !0) return e.fillNoStyle ? void 0 : null;
		let n = o(e, t);
		if (n?.fillType === "image") return n;
		if (n != null || e.fillPaintAuthored === !0) return null;
		let r = e.fillColors;
		return r?.length && r[(e.fillColorIndex ?? t) % r.length] ? null : void 0;
	}, c = (e, t, n, r, i) => {
		if (n === !0) return null;
		if (e?.fillType === "image") return e;
		if (e != null || t != null || r === !0) return null;
		if (i?.fillNoStyle !== !0) return s(i, 0);
	}, l = c(e.chartFill, void 0, e.chartFillHidden, e.chartFillPaintAuthored, e.chartStyleRoles?.chartArea);
	l && a(l);
	let u = c(e.plotAreaFill, e.plotAreaBg, e.plotAreaFillHidden, e.plotAreaFillPaintAuthored, e.threeD ? e.chartStyleRoles?.plotArea3D : e.chartStyleRoles?.plotArea);
	u && a(u);
	let d = e.series.some((e) => e.values.some((e) => e != null && Number.isFinite(e))), f = Math.max(e.categories.length, ...e.series.map((e) => e.categories?.length ?? e.values.length)), p = e.chartType === "surface" || e.chartType === "surface3D" ? e.series.length >= 2 && f >= 2 && d : d;
	if (e.threeD && nn.has(e.chartType) && p) {
		let t = e.valMin != null && Number.isFinite(e.valMin) && e.valMax != null && Number.isFinite(e.valMax) ? e.valMax - e.valMin : void 0;
		for (let [n, r] of [
			["floor", "floor"],
			["sideWall", "wall"],
			["backWall", "wall"]
		]) {
			let i = e.threeD[n], o = Xt(e, i, r).fill;
			o?.fillType === "image" && tn(o, i, n, t) && a(o);
		}
	}
	let m = Gt(e), h = e.series.some((t, n) => {
		let r = m[n];
		return (r?.kind === "bubble" || r?.kind === "scatter" ? "scatter" : t.seriesType ?? (e.chartType === "bubble" ? "scatter" : e.chartType)) === "scatter" && (t.categories ?? e.categories).some((e) => Number.isFinite(Number.parseFloat(e)));
	}), g = e.chartStyleRoles?.dataPointMarker, _ = yt(e), v = e.categories.length > 0 || (e.series[0]?.categories?.length ?? 0) > 0 || e.series.some((e) => e.values.length > 0);
	for (let t = 0; t < e.series.length; t++) {
		let n = e.series[t], r = m[t], i = r?.kind === "bubble" || r == null && e.chartType === "bubble", c = r?.kind === "bubble" || r?.kind === "scatter" ? "scatter" : n.seriesType ?? (e.chartType === "bubble" ? "scatter" : e.chartType), l = Kt(e.chartType, r), u = r?.scatterStyle ?? e.scatterStyle, d = r?.radarStyle ?? e.radarStyle, f = {
			chartType: l,
			bubbleScale: r?.bubbleScale ?? e.bubbleScale,
			showNegativeBubbles: r?.showNegativeBubbles ?? e.showNegativeBubbles
		};
		if (!(c === "line" || c === "stackedLine" || c === "stackedLinePct" || c === "area" || c === "stackedArea" || c === "stackedAreaPct" || c === "scatter" || c === "radar" || c === "stock") || Dt(c, l, u, d)) continue;
		let p = c === "area" || c === "stackedArea" || c === "stackedAreaPct" ? (n.showMarker === !0 || bt(n)) && n.markerSymbol !== "none" : c === "stock" ? n.markerSymbol != null && n.markerSymbol !== "none" : n.showMarker !== !1 && n.markerSymbol !== "none", y = _.has(t), b = Math.max(n.values.length, n.categories?.length ?? 0, e.categories.length), x = wt(e, n, c, b, h, f) > 0, S = Ot(l, u, n, d) && (e.showLegend && !y || e.dataTable?.showKeys === !0 && Tt(e.chartType) && v || x), C = n.markerSymbol ?? (c === "stock" ? "none" : "circle");
		if (S && P(C)) {
			if (i) {
				let r = s(n.chartexStyle, t);
				if (r && a(r), r === void 0 && n.color == null) {
					let n = s(e.chartStyleRoles?.dataPoint, t);
					n && a(n);
				}
			} else a(n.markerFillPaint);
			!i && n.markerFillPaint === void 0 && n.markerFill == null && n.markerFillPaintAuthored !== !0 && a(o(g, t));
		}
		if (!p && !Et(n)) continue;
		let w = new Map((n.dataPointOverrides ?? []).map((e) => [e.idx, e]));
		for (let l = 0; l < b; l++) {
			if (!F(e, n, c, l, h, f)) continue;
			let u = w.get(l);
			if (!P(kt(n, u, "circle", p))) continue;
			if (i) {
				let t = { showNegativeBubbles: r?.showNegativeBubbles ?? e.showNegativeBubbles };
				if ((r?.bubbleScale ?? e.bubbleScale ?? 100) <= 0 || St(t, n.bubbleSizes?.[l]) == null || (n.bubbleSizes?.[l] ?? 0) < 0) continue;
				let i = s(u?.chartexStyle, l);
				if (i && a(i), i !== void 0 || u?.fillHidden === !0 || u?.color != null || n.dataPointColors?.[l] != null) continue;
				let o = s(n.chartexStyle, l);
				if (o && a(o), o !== void 0 || n.color != null) continue;
				let c = s(e.chartStyleRoles?.dataPoint, l);
				c && a(c);
				continue;
			}
			let d = At(n, u, l);
			a(d), d === void 0 && u?.markerFill == null && u?.color == null && n.dataPointColors?.[l] == null && n.markerFill == null && u?.markerFillPaintAuthored !== !0 && n.markerFillPaintAuthored !== !0 && a(o(g, t));
		}
	}
	for (let t = 0; t < (e.chartexBox?.series.length ?? 0); t++) {
		let n = e.chartexBox.series[t];
		if (!P(e.chartStyleMarkerSymbol ?? e.chartexMarkerSymbol ?? "circle") || !(n.showNonoutliers || n.showOutliers)) continue;
		let r = 0;
		for (let e of n.valuesByCategory) {
			let t = we(e, n.quartileMethod);
			t && (n.showNonoutliers && (r += t.inner.length), n.showOutliers && (r += t.outliers.length));
		}
		if (r === 0) continue;
		let i = n.chartexFormatIdx ?? t, o = n.chartexStyle, c = s(o, i);
		if (c && a(c), c !== void 0 || n.color != null) continue;
		let l = s(e.chartexDataPointMarkerStyle ?? e.chartexDataPointStyle ?? void 0, i);
		l && a(l);
	}
	return {
		usages: r || i ? [] : [...n.values()],
		sourceLimitExceeded: r,
		usageRejected: i
	};
}
function vn(e) {
	return _n(e).usages;
}
function yn(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r = 0; r < e.length; r++) {
		let i = e[r], a = _n(i, t ? (e) => t(e, r) : void 0);
		if (!a.usageRejected) {
			if (a.sourceLimitExceeded) return [];
			for (let e of a.usages) {
				let t = U(e.fill), r = n.get(t);
				if (r) {
					n.set(t, gn(r, e));
					continue;
				}
				if (n.size >= 256) return [];
				n.set(t, e);
			}
		}
	}
	return [...n.values()];
}
function bn(e, t, r, i, a, o, s = n, c = 0) {
	let l = W?.(t);
	if (!l || !(a > 0) || !(o > 0) || !G(t) || c !== 0 && t.rotWithShape == null) return !1;
	if (e.save(), e.beginPath(), e.rect(r, i, a, o), e.clip(), t.rotWithShape === !1 && c !== 0 && (e.translate(r + a / 2, i + o / 2), e.rotate(-c * Math.PI / 180), e.translate(-(r + a / 2), -(i + o / 2))), t.alpha != null && (e.globalAlpha *= Math.max(0, Math.min(1, t.alpha))), !t.tile) {
		let n = t.fillRect, s = r + (n?.l ?? 0) * a, c = i + (n?.t ?? 0) * o, u = (1 - (n?.l ?? 0) - (n?.r ?? 0)) * a, d = (1 - (n?.t ?? 0) - (n?.b ?? 0)) * o;
		return u > 0 && d > 0 && j(e, l, t.srcRect, s, c, u, d), e.restore(), u > 0 && d > 0;
	}
	let u = fn(t, l, a, o, s);
	if (!u || u.repetitions > 4096) return e.restore(), !1;
	let { tileW: d, tileH: f, flipX: p, flipY: m, columns: h, rows: g } = u, _ = dn(u, a, o), v = r + _.x, y = i + _.y, b = Math.floor((r - v) / d) - 1, x = Math.floor((i - y) / f) - 1;
	for (let n = x; n < x + g; n++) for (let r = b; r < b + h; r++) {
		let i = v + r * d, a = y + n * f, o = p && Math.abs(r) % 2 == 1, s = m && Math.abs(n) % 2 == 1;
		e.save(), e.translate(i + (o ? d : 0), a + (s ? f : 0)), e.scale(o ? -1 : 1, s ? -1 : 1), j(e, l, t.srcRect, 0, 0, d, f), e.restore();
	}
	return e.restore(), !0;
}
//#endregion
//#region packages/core/src/shape/pattern-bitmaps.ts
var xn = {
	pct5: [
		0,
		16,
		0,
		0,
		0,
		1,
		0,
		0
	],
	pct10: [
		136,
		0,
		34,
		0,
		136,
		0,
		34,
		0
	],
	pct20: [
		136,
		34,
		136,
		34,
		136,
		34,
		136,
		34
	],
	pct25: [
		136,
		85,
		34,
		85,
		136,
		85,
		34,
		85
	],
	pct30: [
		170,
		85,
		170,
		85,
		170,
		85,
		170,
		85
	],
	pct40: [
		170,
		119,
		170,
		221,
		170,
		119,
		170,
		221
	],
	pct50: [
		170,
		85,
		170,
		85,
		170,
		85,
		170,
		85
	],
	pct60: [
		221,
		85,
		119,
		85,
		221,
		85,
		119,
		85
	],
	pct70: [
		238,
		85,
		187,
		85,
		238,
		85,
		187,
		85
	],
	pct75: [
		238,
		170,
		187,
		170,
		238,
		170,
		187,
		170
	],
	pct80: [
		254,
		239,
		251,
		191,
		254,
		239,
		251,
		191
	],
	pct90: [
		255,
		239,
		255,
		251,
		255,
		239,
		255,
		251
	],
	horz: [
		255,
		0,
		0,
		0,
		255,
		0,
		0,
		0
	],
	vert: [
		136,
		136,
		136,
		136,
		136,
		136,
		136,
		136
	],
	ltHorz: [
		0,
		255,
		0,
		0,
		0,
		0,
		0,
		0
	],
	ltVert: [
		32,
		32,
		32,
		32,
		32,
		32,
		32,
		32
	],
	dkHorz: [
		255,
		255,
		0,
		0,
		255,
		255,
		0,
		0
	],
	dkVert: [
		204,
		204,
		204,
		204,
		204,
		204,
		204,
		204
	],
	narHorz: [
		255,
		0,
		255,
		0,
		255,
		0,
		255,
		0
	],
	narVert: [
		170,
		170,
		170,
		170,
		170,
		170,
		170,
		170
	],
	cross: [
		255,
		136,
		136,
		136,
		255,
		136,
		136,
		136
	],
	lgGrid: [
		255,
		128,
		128,
		128,
		128,
		128,
		128,
		128
	],
	smGrid: [
		255,
		136,
		136,
		136,
		255,
		136,
		136,
		136
	],
	dotGrid: [
		136,
		0,
		0,
		0,
		136,
		0,
		0,
		0
	],
	dnDiag: [
		128,
		64,
		32,
		16,
		8,
		4,
		2,
		1
	],
	upDiag: [
		1,
		2,
		4,
		8,
		16,
		32,
		64,
		128
	],
	ltDnDiag: [
		136,
		68,
		34,
		17,
		136,
		68,
		34,
		17
	],
	ltUpDiag: [
		17,
		34,
		68,
		136,
		17,
		34,
		68,
		136
	],
	dkDnDiag: [
		195,
		129,
		0,
		129,
		195,
		129,
		0,
		129
	],
	dkUpDiag: [
		195,
		129,
		0,
		129,
		195,
		129,
		0,
		129
	],
	wdDnDiag: [
		128,
		64,
		32,
		16,
		8,
		4,
		2,
		129
	],
	wdUpDiag: [
		1,
		2,
		4,
		8,
		16,
		32,
		64,
		129
	],
	diagCross: [
		129,
		66,
		36,
		24,
		24,
		36,
		66,
		129
	],
	horzBrick: [
		255,
		16,
		16,
		16,
		255,
		1,
		1,
		1
	],
	diagBrick: [
		129,
		66,
		36,
		24,
		36,
		66,
		129,
		0
	],
	lgCheck: [
		240,
		240,
		240,
		240,
		15,
		15,
		15,
		15
	],
	smCheck: [
		204,
		204,
		51,
		51,
		204,
		204,
		51,
		51
	],
	trellis: [
		165,
		90,
		165,
		90,
		165,
		90,
		165,
		90
	]
};
function Sn(e, t, n) {
	let r = xn[e];
	if (!r) return null;
	let i = s(8, 8);
	if (!i) return null;
	let a = i.getContext("2d");
	if (!a) return null;
	a.fillStyle = Cn(n), a.fillRect(0, 0, 8, 8), a.fillStyle = Cn(t);
	for (let e = 0; e < 8; e++) {
		let t = r[e];
		for (let n = 0; n < 8; n++) t & 1 << 7 - n && a.fillRect(n, e, 1, 1);
	}
	return i;
}
function Cn(e) {
	return `rgba(${parseInt(e.slice(0, 2), 16)},${parseInt(e.slice(2, 4), 16)},${parseInt(e.slice(4, 6), 16)},${e.length >= 8 ? parseInt(e.slice(6, 8), 16) / 255 : 1})`;
}
//#endregion
//#region packages/core/src/draw/dash.ts
function q(e, t) {
	return e.map((e) => e * t);
}
var wn = {
	dotted: [1, 2],
	dashed: [3, 2],
	dashSmallGap: [3, 1],
	dotDash: [
		1,
		2,
		3,
		2
	],
	dotDotDash: [
		1,
		2,
		1,
		2,
		3,
		2
	],
	dashDotStroked: [
		1,
		2,
		3,
		2
	]
};
function Tn(e, t) {
	let n = wn[e];
	return n ? q(n, t) : [];
}
var En = {
	hair: [1, 1],
	dashed: [4, 3],
	mediumDashed: [4, 3],
	dotted: [2, 2],
	dashDot: [
		4,
		2,
		1,
		2
	],
	mediumDashDot: [
		4,
		2,
		1,
		2
	],
	dashDotDot: [
		4,
		2,
		1,
		2,
		1,
		2
	],
	mediumDashDotDot: [
		4,
		2,
		1,
		2,
		1,
		2
	],
	slantDashDot: [
		5,
		3,
		1,
		3
	]
};
function Dn(e) {
	let t = En[e];
	return t ? q(t, 1) : [];
}
var On = {
	dash: [6, 3],
	dot: [1.5, 3],
	dashDot: [
		6,
		3,
		1.5,
		3
	],
	lgDash: [10, 4],
	lgDashDot: [
		10,
		4,
		1.5,
		4
	],
	lgDashDotDot: [
		10,
		4,
		1.5,
		4,
		1.5,
		4
	],
	sysDash: [4, 2],
	sysDot: [1, 2],
	sysDashDot: [
		4,
		2,
		1,
		2
	],
	sysDashDotDot: [
		4,
		2,
		1,
		2,
		1,
		2
	]
};
function kn(e, t) {
	let n = On[e];
	return n ? q(n, t) : [];
}
var An = 512;
function J(e, t, n) {
	if (e != null) {
		let t = [];
		for (let r = 0; r < Math.min(e.length, An); r += 1) {
			let i = e[r];
			!Number.isFinite(i.dash) || !Number.isFinite(i.space) || i.dash < 0 || i.space < 0 || i.dash === 0 && i.space === 0 || t.push(i.dash * n, i.space * n);
		}
		return t;
	}
	return kn(t ?? "solid", n);
}
function jn(e, t) {
	let n = kn(e, t);
	if (n.length > 0) return n;
	let r = e.trim().split(/[\s,]+/).map(Number);
	return r.length >= 2 && r.every((e) => Number.isFinite(e) && e >= 0) && r.some((e) => e > 0) ? (r.length % 2 != 0 && r.pop(), q(r, t)) : [];
}
var Mn = {
	dotted: [1.5, 3],
	dottedHeavy: [1.5, 3],
	dash: [6, 3],
	dashHeavy: [6, 3],
	dashLong: [10, 4],
	dashLongHeavy: [10, 4],
	dotDash: [
		6,
		3,
		1.5,
		3
	],
	dotDashHeavy: [
		6,
		3,
		1.5,
		3
	],
	dotDotDash: [
		6,
		3,
		1.5,
		3,
		1.5,
		3
	],
	dotDotDashHeavy: [
		6,
		3,
		1.5,
		3,
		1.5,
		3
	]
};
function Nn(e, t) {
	let n = Mn[e];
	return n ? q(n, t) : [];
}
//#endregion
//#region packages/core/src/shape/paint.ts
var Pn = 512;
function Fn(e, t, n, r, i, a, o) {
	let s = e.tileRect;
	if (!s || (s.l ?? 0) === 0 && (s.t ?? 0) === 0 && (s.r ?? 0) === 0 && (s.b ?? 0) === 0) return null;
	let l = n + i * (s.l ?? 0), u = r + a * (s.t ?? 0), d = i * (1 - (s.l ?? 0) - (s.r ?? 0)), f = a * (1 - (s.t ?? 0) - (s.b ?? 0));
	if (!Number.isFinite(d) || !Number.isFinite(f) || Math.abs(d) < 1e-9 || Math.abs(f) < 1e-9) return null;
	let p = Math.min(1, Pn / Math.abs(d), Pn / Math.abs(f)), m = Math.max(1, Math.ceil(Math.abs(d) * p)), h = Math.max(1, Math.ceil(Math.abs(f) * p)), g = c(t, m, h), _ = g?.getContext("2d");
	if (!g || !_) return null;
	let v = X({
		...e,
		tileRect: void 0,
		flip: void 0
	}, _, 0, 0, m, h, o);
	if (!v) return null;
	_.fillStyle = v, _.fillRect(0, 0, m, h);
	let y = e.flip === "x" || e.flip === "xy", b = e.flip === "y" || e.flip === "xy", x = g;
	if (y || b) {
		let e = c(t, m * (y ? 2 : 1), h * (b ? 2 : 1)), n = e?.getContext("2d");
		if (!e || !n) return null;
		for (let e = 0; e < (b ? 2 : 1); e += 1) for (let t = 0; t < (y ? 2 : 1); t += 1) n.save(), n.translate(t * m, e * h), n.scale(t === 1 ? -1 : 1, e === 1 ? -1 : 1), n.drawImage(g, t === 1 ? -m : 0, e === 1 ? -h : 0), n.restore();
		x = e;
	}
	let S = t.createPattern(x, "repeat");
	return !S || typeof S.setTransform != "function" ? null : (S.setTransform({
		a: d / m,
		b: 0,
		c: 0,
		d: f / h,
		e: l,
		f: u
	}), S);
}
function Y(e, t = 1) {
	let n = e.charCodeAt(0) === 35 ? e.slice(1) : e;
	return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${n.length >= 8 ? parseInt(n.slice(6, 8), 16) / 255 : t})`;
}
function In(e) {
	let t = e.charCodeAt(0) === 35 ? e.slice(1) : e, n = parseInt(t.slice(0, 2), 16), r = parseInt(t.slice(2, 4), 16), i = parseInt(t.slice(4, 6), 16);
	return .299 * n + .587 * r + .114 * i;
}
function Ln(e) {
	return e && In(e) < 128 ? "#FFFFFF" : "#000000";
}
function X(e, t, n, r, i, a, o = 0) {
	if (!e || e.fillType === "none") return null;
	if (e.fillType === "solid") return Y(e.color);
	if (e.fillType === "pattern") return zn(e, t);
	if (e.fillType === "gradient") {
		let s = e.stops;
		if (s.length === 0) return null;
		if (s.length === 1) return Y(s[0].color);
		let c = Fn(e, t, n, r, i, a, o);
		if (c) return c;
		let l, u = e.tileRect, d = n + i * (u?.l ?? 0), f = r + a * (u?.t ?? 0), p = i * (1 - (u?.l ?? 0) - (u?.r ?? 0)), m = a * (1 - (u?.t ?? 0) - (u?.b ?? 0));
		if (e.gradType === "radial") {
			let n = e.fillToRect, r = d + p * (n?.l ?? 0), i = f + m * (n?.t ?? 0), a = p * (1 - (n?.l ?? 0) - (n?.r ?? 0)), o = m * (1 - (n?.t ?? 0) - (n?.b ?? 0)), s = r + a / 2, c = i + o / 2, u = Math.max(Math.abs(s - d), Math.abs(d + p - s)), h = Math.max(Math.abs(c - f), Math.abs(f + m - c)), g = e.path === "rect" ? Math.max(u, h) : Math.sqrt(u * u + h * h);
			l = t.createRadialGradient(s, c, 0, s, c, Math.max(g, 1e-9));
		} else {
			let n = (e.rotWithShape === !1 ? e.angle - o : e.angle) * Math.PI / 180, r = Math.cos(n), i = Math.sin(n);
			if (e.scaled === !0) {
				r *= p, i *= m;
				let e = Math.hypot(r, i);
				e > 0 && (r /= e, i /= e);
			}
			let a = d + p / 2, s = f + m / 2, c = (Math.abs(r) * p + Math.abs(i) * m) / 2;
			l = t.createLinearGradient(a - r * c, s - i * c, a + r * c, s + i * c);
		}
		for (let e of s) l.addColorStop(Math.min(1, Math.max(0, e.position)), Y(e.color));
		return l;
	}
	return null;
}
var Rn = /* @__PURE__ */ new WeakMap();
function zn(e, t) {
	let n = `${e.preset}|${e.fg}|${e.bg}`, r = Rn.get(t);
	r || (r = /* @__PURE__ */ new Map(), Rn.set(t, r));
	let i = r.get(n);
	if (i) return i;
	let a = Sn(e.preset, e.fg, e.bg);
	if (!a) return Y(e.fg);
	let o = t.createPattern(a, "repeat");
	return o ? (r.set(n, o), o) : Y(e.fg);
}
function Bn(e, t, n) {
	if (!t) {
		e.strokeStyle = "transparent", e.lineWidth = 0, e.setLineDash([]), e.lineCap = "butt", e.lineJoin = "miter", e.miterLimit = 10;
		return;
	}
	e.strokeStyle = Y(t.color);
	let r = Math.max(.5, t.width * n);
	e.lineWidth = r;
	let i = t.customDash == null ? t.dashStyle ? jn(t.dashStyle, r) : [] : J(t.customDash, null, r), a = t.lineCap ?? "butt", o = i.some((e, t) => t % 2 == 0 && e === 0);
	e.lineCap = a === "butt" && o ? "square" : a, e.lineJoin = t.lineJoin ?? "miter", e.miterLimit = t.miterLimit ?? 10, e.setLineDash(i);
}
//#endregion
//#region packages/core/src/chart/compound-frame.ts
function Vn(e, t) {
	if (!Number.isFinite(e) || e <= 0) return [];
	let n = t === "dbl" ? [
		1,
		1,
		1
	] : t === "thinThick" ? [
		1,
		1,
		3
	] : t === "thickThin" ? [
		3,
		1,
		1
	] : t === "tri" ? [
		1,
		1,
		2,
		1,
		1
	] : [1], r = e / n.reduce((e, t) => e + t, 0), i = [], a = 0;
	for (let e = 0; e < n.length; e += 2) {
		let t = n[e] * r;
		i.push({
			center: a + t / 2,
			width: t
		}), a += t + (n[e + 1] ?? 0) * r;
	}
	return i;
}
function Hn(e, t, n, r, i, a) {
	let o = Math.max(0, Math.min(a, r / 2, i / 2));
	e.beginPath(), e.moveTo(t + o, n), e.lineTo(t + r - o, n), e.quadraticCurveTo(t + r, n, t + r, n + o), e.lineTo(t + r, n + i - o), e.quadraticCurveTo(t + r, n + i, t + r - o, n + i), e.lineTo(t + o, n + i), e.quadraticCurveTo(t, n + i, t, n + i - o), e.lineTo(t, n + o), e.quadraticCurveTo(t, n, t + o, n), e.closePath();
}
function Un(e, t, n, r, i, a, o, s = 0) {
	if (r > 0 && i > 0) for (let c of Vn(a, o)) {
		let a = Math.max(0, r - c.center * 2), o = Math.max(0, i - c.center * 2);
		a > 0 && o > 0 && (e.lineWidth = c.width, s > 0 ? (Hn(e, t + c.center, n + c.center, a, o, Math.max(0, s - c.center)), e.stroke()) : e.strokeRect(t + c.center, n + c.center, a, o));
	}
}
//#endregion
//#region packages/core/src/chart/axis-style.ts
function Z(e, t) {
	return e ? Math.max(.5, e / i) * t : 1;
}
function Wn(e, t, n) {
	return {
		color: e ? `#${e}` : "#aaa",
		width: Z(t, n)
	};
}
function Gn(e, t, n) {
	return {
		color: e ? `#${e}` : "#e0e0e0",
		width: t ? Z(t, n) : .5
	};
}
function Kn(e) {
	return e.catAxisCrossBetween !== "midCat";
}
//#endregion
//#region packages/core/src/excel-date.ts
var Q = 864e5, qn = Date.UTC(1899, 11, 30), Jn = Date.UTC(1904, 0, 1);
function $(e, t = !1) {
	if (t) return new Date(Jn + e * Q);
	let n = e < 60 ? e + 1 : e;
	return new Date(qn + n * Q);
}
function Yn(e, t = !1) {
	if (t) return (e.getTime() - Jn) / Q;
	let n = (e.getTime() - qn) / Q;
	return n <= 60 ? n - 1 : n;
}
//#endregion
//#region packages/core/src/text/round-decimal.ts
function Xn(e, t) {
	if (!Number.isFinite(e)) return String(e);
	let n = Math.max(0, Math.trunc(t)), r = e < 0, [i, a = ""] = Zn(Math.abs(e).toString()).split("."), o = a.padEnd(n + 1, "0"), s = o.slice(0, n), c = o.charCodeAt(n) - 48, l = (i + s).split("").map((e) => e.charCodeAt(0) - 48);
	if (c >= 5) {
		let e = l.length - 1;
		for (; e >= 0; e--) if (l[e] === 9) l[e] = 0;
		else {
			l[e] += 1;
			break;
		}
		e < 0 && l.unshift(1);
	}
	let u = l.map((e) => String(e)).join(""), d = n, f = (d > 0 ? u.slice(0, u.length - d) : u) || "0", p = d > 0 ? u.slice(u.length - d) : "", m = f.replace(/^0+(?=\d)/, ""), h = p.length > 0 ? `${m}.${p}` : m, g = /^[0.]*$/.test(h) && !/[1-9]/.test(h);
	return r && !g ? `-${h}` : h;
}
function Zn(e) {
	let t = /^(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(e);
	if (!t) return e;
	let [, n, r = "", i] = t, a = parseInt(i, 10), o = n + r, s = n.length + a;
	return s <= 0 ? "0." + "0".repeat(-s) + o : s >= o.length ? o + "0".repeat(s - o.length) : o.slice(0, s) + "." + o.slice(s);
}
//#endregion
//#region packages/core/src/chart/chart-number-format.ts
var Qn = /* @__PURE__ */ new Map();
function $n(e, t = !1, n = typeof navigator > "u" ? void 0 : navigator.language) {
	let r = n ?? "", i = Qn.get(r);
	return i || (i = new Intl.DateTimeFormat(n, {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		timeZone: "UTC"
	}), Qn.set(r, i)), i.format($(e, t));
}
function er(e) {
	return Number.isInteger(e) ? String(e) : Xn(e, 6).replace(/\.?0+$/, "");
}
function tr(e, t, n = !1) {
	if (!t || t.trim().toLowerCase() === "general") return er(e);
	if (rr(t)) return ir(e, t, n);
	let r = ar(t), i;
	return i = e > 0 ? r[0] ?? t : e < 0 ? r[1] ?? r[0] ?? t : r[2] ?? r[0] ?? t, i === "" ? "" : (e < 0 && r.length < 2 ? "-" : "") + or(Math.abs(e), i);
}
function nr(e, t, n = !1) {
	if (!t || e.trim() === "") return e;
	let r = Number(e);
	return Number.isFinite(r) ? tr(r, t, n) : e;
}
function rr(e) {
	let t = !1;
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		if (r === "\"") {
			t = !t;
			continue;
		}
		if (!t) {
			if (r === "\\") {
				n++;
				continue;
			}
			if (r === "[") {
				for (; n < e.length && e[n] !== "]";) n++;
				continue;
			}
			if (r === "y" || r === "Y" || r === "d" || r === "D" || r === "m" || r === "M" || r === "h" || r === "H" || r === "s" || r === "S") return !0;
		}
	}
	return !1;
}
function ir(e, t, n = !1) {
	let r = $(Math.floor(e), n), i = r.getUTCFullYear(), a = r.getUTCMonth() + 1, o = r.getUTCDate(), s = (e - Math.floor(e)) * 86400, c = Math.floor(s / 3600), l = Math.floor(s % 3600 / 60), u = Math.floor(s % 60), d = "", f = !1, p = 0;
	for (; p < t.length;) {
		let e = t[p];
		if (e === "\"") {
			f = !f, p++;
			continue;
		}
		if (f) {
			d += e, p++;
			continue;
		}
		if (e === "\\" && p + 1 < t.length) {
			d += t[p + 1], p += 2;
			continue;
		}
		if (e === "[") {
			for (; p < t.length && t[p] !== "]";) p++;
			p < t.length && p++;
			continue;
		}
		if (e === "y" || e === "Y") {
			let e = 0;
			for (; p < t.length && (t[p] === "y" || t[p] === "Y");) e++, p++;
			d += e >= 3 ? String(i) : String(i % 100).padStart(2, "0");
			continue;
		}
		if (e === "m" || e === "M") {
			let e = 0;
			for (; p < t.length && (t[p] === "m" || t[p] === "M");) e++, p++;
			if (d.match(/[Hh]+\W*$/)) d += e >= 2 ? String(l).padStart(2, "0") : String(l);
			else {
				let t = [
					"Jan",
					"Feb",
					"Mar",
					"Apr",
					"May",
					"Jun",
					"Jul",
					"Aug",
					"Sep",
					"Oct",
					"Nov",
					"Dec"
				], n = [
					"January",
					"February",
					"March",
					"April",
					"May",
					"June",
					"July",
					"August",
					"September",
					"October",
					"November",
					"December"
				];
				d += e >= 5 ? n[a - 1][0] : e === 4 ? n[a - 1] : e === 3 ? t[a - 1] : e === 2 ? String(a).padStart(2, "0") : String(a);
			}
			continue;
		}
		if (e === "d" || e === "D") {
			let e = 0;
			for (; p < t.length && (t[p] === "d" || t[p] === "D");) e++, p++;
			d += e >= 2 ? String(o).padStart(2, "0") : String(o);
			continue;
		}
		if (e === "h" || e === "H") {
			let e = 0;
			for (; p < t.length && (t[p] === "h" || t[p] === "H");) e++, p++;
			d += e >= 2 ? String(c).padStart(2, "0") : String(c);
			continue;
		}
		if (e === "s" || e === "S") {
			let e = 0;
			for (; p < t.length && (t[p] === "s" || t[p] === "S");) e++, p++;
			d += e >= 2 ? String(u).padStart(2, "0") : String(u);
			continue;
		}
		d += e, p++;
	}
	return d;
}
function ar(e) {
	let t = [], n = "";
	for (let r = 0; r < e.length; r++) {
		let i = e[r];
		if (i === "\\" && r + 1 < e.length) {
			n += i + e[r + 1], r++;
			continue;
		}
		if (i === "\"") {
			for (n += i, r++; r < e.length && e[r] !== "\"";) n += e[r], r++;
			r < e.length && (n += e[r]);
			continue;
		}
		if (i === "[") {
			for (n += i, r++; r < e.length && e[r] !== "]";) n += e[r], r++;
			r < e.length && (n += e[r]);
			continue;
		}
		if (i === ";") {
			t.push(n), n = "";
			continue;
		}
		n += i;
	}
	return t.push(n), t;
}
function or(e, t) {
	let n = [], r = 0, i = !1, a = !1;
	for (; r < t.length;) {
		let e = t[r];
		if (e === "\"") {
			r++;
			let e = "";
			for (; r < t.length && t[r] !== "\"";) e += t[r], r++;
			r < t.length && r++, n.push({
				kind: "lit",
				text: e
			});
			continue;
		}
		if (e === "\\" && r + 1 < t.length) {
			n.push({
				kind: "lit",
				text: t[r + 1]
			}), r += 2;
			continue;
		}
		if (e === "_" && r + 1 < t.length) {
			n.push({
				kind: "lit",
				text: " "
			}), r += 2;
			continue;
		}
		if (e === "*" && r + 1 < t.length) {
			r += 2;
			continue;
		}
		if (e === "[") {
			for (r++; r < t.length && t[r] !== "]";) r++;
			r < t.length && r++;
			continue;
		}
		if (e === "%") {
			a = !0, n.push({
				kind: "lit",
				text: "%"
			}), r++;
			continue;
		}
		if (e === "#" || e === "0" || e === "." || e === "," || e === "?") {
			let e = "";
			for (; r < t.length && (t[r] === "#" || t[r] === "0" || t[r] === "." || t[r] === "," || t[r] === "?");) e += t[r], r++;
			n.push({
				kind: "num",
				text: e
			}), i = !0;
			continue;
		}
		n.push({
			kind: "lit",
			text: e
		}), r++;
	}
	if (!i) return n.map((e) => e.text).join("");
	let o = a ? e * 100 : e, s = "";
	for (let e of n) e.kind === "num" && (s += e.text);
	let c = sr(o, s), l = !1;
	return n.map((e) => e.kind === "lit" ? e.text : l ? "" : (l = !0, c)).join("");
}
function sr(e, t) {
	let n = t.indexOf("."), r = n >= 0 ? t.slice(0, n) : t, i = n >= 0 ? t.slice(n + 1) : "", a = /,/.test(r), o = (i.match(/[#0?]/g) ?? []).length, s = (r.replace(/,/g, "").match(/0/g) ?? []).length, [c, l = ""] = Xn(e, o).split("."), u = c.padStart(s, "0"), d = a ? u.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : u;
	return o === 0 ? d : `${d}.${l.padEnd(o, "0")}`;
}
//#endregion
//#region packages/core/src/chart/legend-frame.ts
function cr(e, t, n, r, i = 0) {
	if (!((!t.legendFill && !t.legendFillColor || t.legendFillHidden === !0) && (!t.legendLineFill && !t.legendLineColor || t.legendLineHidden === !0))) {
		if (e.save(), t.legendFillHidden !== !0 && (t.legendFill || t.legendFillColor)) {
			let r = t.legendFill ? X(t.legendFill, e, n.x, n.y, n.w, n.h, i) : `#${t.legendFillColor}`;
			r && (e.fillStyle = r), r && e.fillRect(n.x, n.y, n.w, n.h);
		}
		if (t.legendLineHidden !== !0 && (t.legendLineFill || t.legendLineColor) && n.w > 0 && n.h > 0) {
			let a = Z(t.legendLineWidthEmu, r), o = t.legendLineFill ? X(t.legendLineFill, e, n.x, n.y, n.w, n.h, i) : t.legendLineColor ? `#${t.legendLineColor}` : null;
			if (!o) {
				e.restore();
				return;
			}
			e.strokeStyle = o, e.lineCap = t.legendLineCap === "rnd" ? "round" : t.legendLineCap === "sq" ? "square" : "butt", e.lineJoin = t.legendLineJoin === "round" || t.legendLineJoin === "bevel" ? t.legendLineJoin : "miter", e.setLineDash(J(t.legendLineCustomDash, t.legendLineDash, a)), Un(e, n.x, n.y, n.w, n.h, a, t.legendLineCompound);
		}
		e.restore();
	}
}
//#endregion
//#region packages/core/src/chart/plot-area-frame.ts
function lr(e, t, n, r, a, o, s, c = 0) {
	if (t.plotAreaFillHidden !== !0) if (t.plotAreaFill?.fillType === "image") bn(e, t.plotAreaFill, n, r, a, o, s, c);
	else {
		let i = t.plotAreaFill ? X(t.plotAreaFill, e, n, r, a, o, c) : t.plotAreaBg ? `#${t.plotAreaBg}` : null;
		i && (e.fillStyle = i, e.fillRect(n, r, a, o));
	}
	if (t.plotAreaLineHidden === !0 || !t.plotAreaLineFill && !t.plotAreaLineColor) return;
	let l = t.plotAreaLineWidthEmu ? Math.max(.5, t.plotAreaLineWidthEmu / i) * s : 1;
	e.save();
	let u = t.plotAreaLineFill ? X(t.plotAreaLineFill, e, n, r, a, o, c) : t.plotAreaLineColor ? `#${t.plotAreaLineColor}` : null;
	if (!u) {
		e.restore();
		return;
	}
	e.strokeStyle = u, e.setLineDash(J(t.plotAreaLineCustomDash, t.plotAreaLineDash, l)), e.lineCap = t.plotAreaLineCap === "rnd" ? "round" : t.plotAreaLineCap === "sq" ? "square" : "butt", e.lineJoin = t.plotAreaLineJoin === "round" || t.plotAreaLineJoin === "bevel" ? t.plotAreaLineJoin : "miter", Un(e, n, r, a, o, l, t.plotAreaLineCompound), e.restore();
}
//#endregion
export { zt as $, Me as $t, vn as A, Ze as At, R as B, Re as Bt, Dn as C, dt as Ct, mn as D, ct as Dt, ln as E, gt as Et, B as F, qe as Ft, qt as G, Ne as Gt, z as H, N as Ht, Qt as I, Je as It, I as J, ke as Jt, Gt as K, $e as Kt, Zt as L, Ye as Lt, bn as M, Ue as Mt, rn as N, He as Nt, un as O, lt as Ot, tn as P, Ve as Pt, Vt as Q, Oe as Qt, $t as R, We as Rt, Nn as S, ut as St, pn as T, ht as Tt, Yt as U, Le as Ut, Jt as V, Qe as Vt, Xt as W, et as Wt, It as X, De as Xt, Lt as Y, je as Yt, Ft as Z, Ae as Zt, Y as _, Mt as _t, tr as a, A as an, yt as at, J as b, ft as bt, $ as c, C as cn, jt as ct, Kn as d, _e as dn, P as dt, Ee as en, Bt as et, Wn as f, ge as fn, Dt as ft, Ln as g, c as gn, Nt as gt, Bn as h, s as hn, Ot as ht, er as i, j as in, wt as it, yn as j, Be as jt, dn as k, it as kt, Yn as l, x as ln, At as lt, Un as m, d as mn, bt as mt, cr as n, we as nn, Tt as nt, $n as o, be as on, kt as ot, Gn as p, p as pn, xt as pt, Kt as q, Xe as qt, nr as r, ve as rn, F as rt, Xn as s, ye as sn, Et as st, lr as t, Te as tn, Ct as tt, Z as u, b as un, Pt as ut, X as v, St as vt, U as w, _t as wt, kn as x, pt as xt, Tn as y, vt as yt, L as z, ze as zt };
