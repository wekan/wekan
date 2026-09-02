import { qt as e } from "./line-metrics-BGtFM-ec.js";
import { c as t, o as n, r, s as i } from "./bounded-raw-part-cache-C6ro6Ezf.js";
//#region packages/core/src/fonts/embedded.ts
function a(e, t) {
	let n = o(t), r = e.slice(), i = Math.min(32, r.length);
	for (let e = 0; e < i; e++) r[e] ^= n[e % 16];
	return r;
}
function o(e) {
	let t = e.replace(/[{}\-\s]/g, "");
	if (t.length !== 32 || /[^0-9a-fA-F]/.test(t)) throw Error(`invalid fontKey GUID: ${e}`);
	let n = new Uint8Array(16);
	for (let e = 0; e < 16; e++) n[e] = parseInt(t.slice(e * 2, e * 2 + 2), 16);
	return n.reverse();
}
function s(e, t, n, r) {
	let i = 2166136261;
	for (let e = 0; e < r.length; e++) i ^= r[e], i = Math.imul(i, 16777619);
	return `${e}|${t}|${n}|${r.length}|${(i >>> 0).toString(16)}`;
}
async function c(o, c = e) {
	let l = r();
	if (!l || typeof FontFace > "u") return [];
	let u = [], d = /* @__PURE__ */ new Set(), f = [];
	for (let e of o) try {
		if (e.bytes.length === 0 || e.bytes.length > c) {
			f.push(e.family);
			continue;
		}
		let n = e.odttf ? a(e.bytes, e.fontKey ?? "") : e.bytes, r = `embedded:${s(e.family, e.weight, e.style, n)}`;
		if (d.has(r)) continue;
		d.add(r);
		let { face: i } = t(r, l, () => {
			let t = n.buffer.slice(n.byteOffset, n.byteOffset + n.byteLength), r = new FontFace(e.family, t, {
				weight: e.weight,
				style: e.style
			});
			return l.add(r), r;
		});
		u.push(i);
	} catch {
		f.push(e.family);
	}
	let p = u;
	if (u.length > 0) {
		let e = await n(Promise.allSettled(u.map((e) => Promise.resolve().then(() => e.load()))));
		Array.isArray(e) ? (p = [], e.forEach((e, t) => {
			let n = u[t];
			e.status === "fulfilled" ? p.push(n) : (f.push(n.family), i([n]));
		}), await n(l.ready)) : (f.push(...u.map((e) => e.family)), i(u), p = []);
	}
	return f.length > 0 && console.warn(`[ooxml] failed to register embedded font(s): ${[...new Set(f)].join(", ")}; falling back to substitute fonts (text may shift or differ).`), p;
}
function l(e) {
	i(e);
}
//#endregion
//#region packages/core/src/layout/virtual-scroll.ts
function u(e, t, n) {
	return e < t ? t : e > n ? n : e;
}
function d(e, t, n) {
	let r = e.length;
	if (r === 0) return {
		offsets: [],
		totalHeight: 0
	};
	let i = n?.leading ?? 0, a = n?.trailing ?? 0, o = Array(r), s = 0;
	for (let n = 0; n < r; n++) o[n] = i + s + n * t, s += e[n];
	return {
		offsets: o,
		totalHeight: i + s + (r - 1) * t + a
	};
}
function f(e, t, n, r) {
	let i = e.offsets, a = i.length;
	if (a === 0) return {
		start: 0,
		end: -1,
		topIndex: 0,
		offsets: i,
		totalHeight: 0
	};
	let o = 0, s = a;
	for (; o < s;) {
		let e = o + s >>> 1;
		i[e] <= t ? o = e + 1 : s = e;
	}
	let c = u(o - 1, 0, a - 1), l = t + n;
	for (o = 0, s = a; o < s;) {
		let e = o + s >>> 1;
		i[e] < l ? o = e + 1 : s = e;
	}
	let d = u(o - 1, 0, a - 1);
	return {
		start: u(c - r, 0, a - 1),
		end: u(d + r, 0, a - 1),
		topIndex: c,
		offsets: i,
		totalHeight: e.totalHeight
	};
}
function p(e, t, n, r, i, a, o) {
	if (e === 0) return {
		start: 0,
		end: -1,
		topIndex: 0,
		totalHeight: 0
	};
	let s = o?.leading ?? 0, c = o?.trailing ?? 0, l = t + n, d = u(r < s ? 0 : l > 0 ? Math.floor((r - s) / l) : e - 1, 0, e - 1), f = r + i, p = u(f <= s ? 0 : l > 0 ? Math.ceil((f - s) / l) - 1 : e - 1, 0, e - 1);
	return {
		start: u(d - a, 0, e - 1),
		end: u(p + a, 0, e - 1),
		topIndex: d,
		totalHeight: s + e * t + (e - 1) * n + c
	};
}
//#endregion
//#region packages/core/src/internal/progressive-layout-lifecycle.ts
var m = class {
	state = Object.freeze({ status: "complete" });
	get complete() {
		return this.state.status === "complete";
	}
	get settled() {
		return this.state.status !== "pending";
	}
	begin() {
		this.state = Object.freeze({ status: "pending" });
	}
	succeed() {
		this.state = Object.freeze({ status: "complete" });
	}
	fail(e) {
		let t = e instanceof Error ? e : Error(String(e));
		return this.state = Object.freeze({
			status: "failed",
			error: t
		}), t;
	}
	throwIfFailed() {
		if (this.state.status === "failed") throw this.state.error;
	}
}, h = class {
	failed = /* @__PURE__ */ new WeakMap();
	notify(e, t, ...n) {
		if (!(!t || this.failed.get(t)?.has(e))) try {
			let r = t(...n);
			r && typeof r.then == "function" && Promise.resolve(r).catch((n) => this.reportOnce(e, t, n));
		} catch (n) {
			this.reportOnce(e, t, n);
		}
	}
	reportOnce(e, t, n) {
		let r = this.failed.get(t) ?? /* @__PURE__ */ new Set();
		if (r.has(e)) return;
		r.add(e), this.failed.has(t) || this.failed.set(t, r);
		let i = n instanceof Error ? n : Error(String(n));
		console.error(`[ooxml] ${e} callback failed and was disabled:`, i);
	}
}, g = 65536;
function _(e, t) {
	let n = Math.min(e.length, t);
	if (n > 0 && n < e.length) {
		let t = e.charCodeAt(n - 1), r = e.charCodeAt(n);
		t >= 55296 && t <= 56319 && r >= 56320 && r <= 57343 && n--;
	}
	return e.slice(0, n);
}
function v(e) {
	if (e !== void 0 && (!Number.isFinite(e) || e < 0)) throw RangeError("maxTextCharacters must be a finite non-negative number.");
	return Math.min(g, Math.floor(e ?? 65536));
}
function y(e, t, n) {
	let r = v(n), i = 0, a = !1, o = (e) => {
		let t = _(e.text, Math.max(0, r - i));
		return i += t.length, t.length < e.text.length && (a = !0), {
			...e,
			text: t
		};
	}, s = Object.freeze({
		root: Object.freeze(o(e)),
		replies: Object.freeze(t.map((e) => Object.freeze(o(e))))
	});
	return Object.freeze({
		thread: s,
		truncated: a,
		textCharacters: i,
		maxTextCharacters: r
	});
}
//#endregion
//#region packages/core/src/internal/dom-interaction-boundary.ts
function b(e, t) {
	return e.dataset?.[t] !== void 0;
}
function x(e, t, n) {
	let r = typeof e.composedPath == "function" ? e.composedPath() : [];
	if (r.length > 0) {
		let e = !1;
		for (let i of r) {
			if (i === t) return e;
			b(i, n) && (e = !0);
		}
	}
	let i = e.target;
	if (!i || !t.contains(i)) return !1;
	let a = i;
	for (; a;) {
		if (b(a, n)) return !0;
		if (a === t) break;
		a = a.parentElement;
	}
	return !1;
}
//#endregion
export { p as a, c, m as i, l, y as n, f as o, h as r, d as s, x as t };
