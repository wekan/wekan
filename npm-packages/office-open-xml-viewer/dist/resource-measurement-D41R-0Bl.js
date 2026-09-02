import { ft as e, ht as t, mt as n, ot as r, yt as i } from "./line-metrics-BGtFM-ec.js";
import { an as a } from "./plot-area-frame-D5hEOgkJ.js";
import { i as o } from "./pixel-budget-Dgjw269h.js";
import { r as s } from "./raster-target-ojDdQizC.js";
//#region packages/core/src/image/duotone-bitmap-by-path.ts
function c(e, t) {
	return t ? `${e}|duo:${t.clr1}:${t.clr2}` : e;
}
var l = "duotone";
async function u(u, d, f, p, m = {}) {
	let { offscreenFactory: h, failClosedOnDuotoneFailure: g = !1, ..._ } = m, v = f ? {
		..._,
		maxRetainedPixels: Math.min(_.maxRetainedPixels ?? 33554432, Math.floor(o / 4))
	} : _, y = f ? {
		...v,
		targetWidthPx: void 0,
		targetHeightPx: void 0
	} : v, b = f ? e(p, l) : void 0, x = await n(u, d, p, y);
	if (!f || !x) return x;
	let S = await i(u, d, p, y, b, x), C = s(Number(x.width), Number(x.height), _.targetWidthPx, _.targetHeightPx), w = C ? `|resize:${C.resizeWidth}x${C.resizeHeight}` : "";
	return t(l, `${c(S, f)}${w}${g ? "|strict" : ""}`, p, async () => {
		let { w: e, h: t } = a(x);
		if (e <= 0 || t <= 0) return {
			bitmap: g ? null : x,
			owned: !1
		};
		let n = await r(x, f, {
			width: e,
			height: t,
			offscreenFactory: h,
			targetWidthPx: _.targetWidthPx,
			targetHeightPx: _.targetHeightPx
		});
		if (n === x) {
			if (g) return {
				bitmap: null,
				owned: !1
			};
			if (!C) return {
				bitmap: x,
				owned: !1
			};
			if (typeof createImageBitmap > "u") throw Error("createImageBitmap is unavailable for duotone fallback resampling");
			let e = await createImageBitmap(x, C);
			return {
				bitmap: e,
				owned: e !== x
			};
		}
		let i = n;
		return {
			bitmap: i,
			owned: i !== x
		};
	}, b);
}
//#endregion
//#region packages/core/src/internal/resource-measurement.ts
function d(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw Error(`${t} must be a non-negative safe integer`);
}
function f(e, t, n) {
	return d(e, "resource measurement"), d(t, "resource measurement"), d(n, "resource measurement limit"), e > n || t > n || t > n - e ? n === 2 ** 53 - 1 ? n : n + 1 : e + t;
}
function p(e, t = 2 ** 53 - 1) {
	d(t, "resource measurement limit");
	let n = 0;
	for (let r = 0; r < e.length; r += 1) {
		let i = e.charCodeAt(r), a;
		if (i <= 127) a = 1;
		else if (i <= 2047) a = 2;
		else if (i >= 55296 && i <= 56319 && r + 1 < e.length) {
			let t = e.charCodeAt(r + 1);
			t >= 56320 && t <= 57343 ? (a = 4, r += 1) : a = 3;
		} else a = 3;
		if (n = f(n, a, t), n > t) return n;
	}
	return n;
}
function m(e, t = 2 ** 53 - 1) {
	d(t, "resource measurement limit");
	let n = f(0, 2, t);
	if (n > t) return n;
	for (let r = 0; r < e.length; r += 1) {
		let i = e.charCodeAt(r), a;
		if (i === 34 || i === 92 || i === 8 || i === 9 || i === 10 || i === 12 || i === 13) a = 2;
		else if (i <= 31) a = 6;
		else if (i <= 127) a = 1;
		else if (i <= 2047) a = 2;
		else if (i >= 55296 && i <= 56319 && r + 1 < e.length) {
			let t = e.charCodeAt(r + 1);
			t >= 56320 && t <= 57343 ? (a = 4, r += 1) : a = 6;
		} else a = i >= 55296 && i <= 57343 ? 6 : 3;
		if (n = f(n, a, t), n > t) return n;
	}
	return n;
}
function h(e, t) {
	return f(0, e, t);
}
function g(e, t = 2 ** 53 - 1, n = !1) {
	if (d(t, "resource measurement limit"), e === null) return {
		jsonBytes: h(4, t),
		stringValueUtf8Bytes: 0
	};
	if (typeof e == "string") return {
		jsonBytes: m(e, t),
		stringValueUtf8Bytes: p(e, t)
	};
	if (typeof e == "boolean") return {
		jsonBytes: h(e ? 4 : 5, t),
		stringValueUtf8Bytes: 0
	};
	if (typeof e == "number") return {
		jsonBytes: h((Number.isFinite(e) ? String(Object.is(e, -0) ? 0 : e) : "null").length, t),
		stringValueUtf8Bytes: 0
	};
	if (typeof e == "bigint") throw TypeError("BigInt values cannot be serialized to JSON");
	if (Array.isArray(e)) {
		let n = h(2, t), r = 0;
		for (let i = 0; i < e.length; i += 1) {
			i !== 0 && (n = f(n, 1, t));
			let a = g(e[i], t, !0);
			n = f(n, a.jsonBytes, t), r = f(r, a.stringValueUtf8Bytes, t);
		}
		return {
			jsonBytes: n,
			stringValueUtf8Bytes: r
		};
	}
	if (typeof e == "object") {
		let n = h(2, t), r = 0, i = 0;
		for (let [a, o] of Object.entries(e)) {
			if (o === void 0 || typeof o == "function" || typeof o == "symbol") continue;
			i++ !== 0 && (n = f(n, 1, t)), n = f(n, m(a, t), t), n = f(n, 1, t);
			let e = g(o, t);
			n = f(n, e.jsonBytes, t), r = f(r, e.stringValueUtf8Bytes, t);
		}
		return {
			jsonBytes: n,
			stringValueUtf8Bytes: r
		};
	}
	return {
		jsonBytes: n ? h(4, t) : 0,
		stringValueUtf8Bytes: 0
	};
}
//#endregion
export { u as a, c as i, g as n, p as r, f as t };
