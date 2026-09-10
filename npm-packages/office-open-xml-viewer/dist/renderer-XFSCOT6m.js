import { $ as e, $t as t, At as n, B as r, Bt as i, Ct as a, Dt as o, E as s, Et as c, Ft as l, G as u, Gt as d, H as f, Ht as p, It as m, J as h, K as g, Kt as _, Lt as v, M as y, Mt as b, N as x, Nt as S, Q as C, Qt as w, Rt as T, St as E, T as D, Tt as O, U as k, V as A, Vt as j, W as M, Wt as N, X as ee, Xt as P, Yt as te, Z as F, Zt as ne, _ as re, _t as ie, a as I, at as L, b as ae, bt as R, c as oe, ct as se, d as ce, dt as le, et as z, f as ue, ft as de, gt as B, ht as fe, i as pe, it as me, jt as he, kt as ge, l as _e, lt as ve, m as ye, mt as be, n as xe, nn as Se, nt as Ce, o as we, ot as Te, p as Ee, pt as De, q as Oe, qt as ke, r as Ae, rt as je, st as Me, t as Ne, tt as V, u as Pe, ut as Fe, v as Ie, vt as H, wt as U, x as Le, xt as Re, yt as ze, z as Be, zt as Ve } from "./plot-area-frame-D5hEOgkJ.js";
import { a as W, r as He } from "./units-EJdC96r6.js";
import { C as Ue, D as We, E as G, O as Ge, S as K, _ as q, a as Ke, b as qe, d as Je, f as Ye, g as J, h as Xe, i as Ze, k as Qe, l as $e, m as et, n as tt, o as nt, p as rt, u as it, v as at, x as ot, y as st } from "./three-d-YYghQndN.js";
//#region packages/core/src/chart/of-pie.ts
function ct(e, t) {
	let n = e?.splitType ?? "auto", r = e?.splitPos, i = /* @__PURE__ */ new Set();
	if ((e?.splitPosAuthored === !0 || r != null) && (![
		"percent",
		"pos",
		"val"
	].includes(n) || r == null || !Number.isFinite(r))) return null;
	if (n === "auto") {
		if (e?.splitTypeAuthored === !0) return null;
		let n = Math.ceil(t.length / 3);
		for (let e = Math.max(0, t.length - n); e < t.length; e++) i.add(e);
		return i;
	}
	if (n === "cust") {
		if (e?.customSplitIndices == null) return null;
		for (let n of e.customSplitIndices) Number.isSafeInteger(n) && n >= 0 && n < t.length && i.add(n);
		return i;
	}
	if (r == null || !Number.isFinite(r)) return null;
	if (n === "pos") {
		if (!Number.isInteger(r) || r < 0 || r > 32e3) return null;
		let e = Math.min(t.length, r);
		for (let n = t.length - e; n < t.length; n++) i.add(n);
		return i;
	}
	if (n === "val") {
		for (let e = 0; e < t.length; e++) {
			let n = t[e];
			n != null && Number.isFinite(n) && n < r && i.add(e);
		}
		return i;
	}
	if (r < 0 || r > 100) return null;
	let a = 0;
	for (let e of t) e != null && Number.isFinite(e) && (a += Math.abs(e));
	if (!(a > 0)) return i;
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		n != null && Number.isFinite(n) && Math.abs(n) / a * 100 < r && i.add(e);
	}
	return i;
}
//#endregion
//#region packages/core/src/chart/date-axis.ts
function lt(e) {
	return e === "days" || e === "months" || e === "years" ? e : null;
}
function ut(e, t) {
	switch (t) {
		case "years": return new Date(Date.UTC(e.getUTCFullYear(), 0, 1));
		case "months": return new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 1));
		case "days": return new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()));
	}
}
function dt(e, t, n) {
	if (n === "days") return new Date(e.getTime() + t * 864e5);
	let r = new Date(e.getTime());
	return n === "months" ? r.setUTCMonth(r.getUTCMonth() + t) : r.setUTCFullYear(r.getUTCFullYear() + t), r;
}
function ft(e, t) {
	switch (t) {
		case "years": return e.getUTCFullYear();
		case "months": return e.getUTCFullYear() * 12 + e.getUTCMonth();
		case "days": return Math.floor(e.getTime() / 864e5);
	}
}
function pt(e) {
	let t = e.categories.map((e) => Number(e));
	if (t.length === 0 || t.some((e) => !Number.isFinite(e))) return null;
	let n = e.date1904 === !0, r = lt(e.baseTimeUnit) ?? "days", i = lt(e.majorTimeUnit) ?? r, a = lt(e.minorTimeUnit) ?? r, o = (e, t) => e == null || !(e > 0) || !Number.isFinite(e) ? null : t === "days" || e >= 1 && Number.isInteger(e) ? e : null, s = o(e.majorUnit, i), c = o(e.minorUnit, a), l = (e) => ft(oe(e, n), r), u = Array(t.length), d = Infinity, f = -Infinity, p = Infinity, m = -Infinity;
	for (let e = 0; e < t.length; e++) {
		let n = t[e], r = l(n);
		u[e] = r, d = Math.min(d, r), f = Math.max(f, r), p = Math.min(p, n), m = Math.max(m, n);
	}
	let h = e.explicitMin, g = e.explicitMax, _ = h != null && Number.isFinite(h) ? l(h) : null, v = g != null && Number.isFinite(g) ? l(g) : null, y = e.crossBetween !== !1, b = _ ?? d, x = (v ?? f) + +!!y;
	x > b || (b -= .5, x += .5);
	let S = x - b, C = (e) => (l(e) - b) / S, w = e.reversed ? (e) => 1 - C(e) : C, T = (e) => (l(e) + (y ? .5 : 0) - b) / S, E = e.reversed ? (e) => 1 - T(e) : T, D = t.map(E), O = t.map(() => 1 / S), k = h != null && Number.isFinite(h) ? h : p, A = g != null && Number.isFinite(g) ? g : m, j = (e, t) => {
		if (t == null) return [];
		let r = ut(oe(k, n), e), i = _e(r, n);
		for (let a = 0; i < k && a < 512; a++) {
			let a = dt(r, t, e), o = _e(a, n);
			if (!(o > i)) return [];
			r = a, i = o;
		}
		if (i < k) return [];
		let a = [];
		for (; i <= A;) {
			if (a.length === 512) return [];
			a.push({
				serial: i,
				fraction: w(i)
			});
			let o = dt(r, t, e), s = _e(o, n);
			if (!(s > i)) break;
			r = o, i = s;
		}
		return a;
	}, M = j(i, s), N = new Set(M.map((e) => l(e.serial)));
	return {
		positions: D,
		categoryBandFractions: O,
		majorTicks: M,
		minorTicks: c == null ? [] : j(a, c).filter((e) => !N.has(l(e.serial)))
	};
}
//#endregion
//#region packages/core/src/chart/trendline-label.ts
function mt(e, t, n, r, i, a, o) {
	if (![
		n,
		r,
		i
	].every(Number.isFinite) || n <= 0 || r <= 0 || t.w <= 0 || t.h <= 0) return null;
	let s = Math.max(4, i * .5), c = Math.min(n, Math.max(0, t.w - s * 2)), l = Math.min(r, t.h), u = t.x + t.w * .75, d = {
		x: o ? Math.max(t.x, Math.min(t.x + t.w - c, u - c)) : Math.max(t.x, t.x + t.w - s - c),
		y: o ? Math.max(t.y, Math.min(t.y + t.h - l, o.y - l + i * .25)) : Math.min(t.y + t.h - l, t.y + s),
		w: c,
		h: l
	};
	if (a) {
		let t = _(a, e, d);
		if (t) return {
			...t,
			automatic: !1
		};
	}
	return {
		...d,
		automatic: !0
	};
}
//#endregion
//#region packages/core/src/chart/source-visibility.ts
function ht(e, t) {
	if (!e.some(Boolean)) return null;
	let n = Math.max(t, e.length), r = [], i = new Int32Array(n);
	i.fill(-1);
	for (let t = 0; t < n; t++) e[t] !== !0 && (i[t] = r.length, r.push(t));
	return {
		keep: r,
		remap: i
	};
}
function gt(e, t) {
	if (e == null) return e;
	let n = [];
	for (let r of t.keep) r < e.length && n.push(e[r]);
	return n;
}
function _t(e, t) {
	if (e == null) return e;
	let n = [];
	for (let r of e) {
		if (r.idx >= t.remap.length) continue;
		let e = t.remap[r.idx];
		e >= 0 && n.push({
			...r,
			idx: e
		});
	}
	return n;
}
function vt(e) {
	return Math.max(e.values.length, e.categories?.length ?? 0, e.sourceHidden?.length ?? 0, e.dataPointColors?.length ?? 0, e.dataLabelColors?.length ?? 0, e.catFormatCodes?.length ?? 0, e.bubbleSizes?.length ?? 0, ...(e.errBars ?? []).flatMap((e) => [e.plus.length, e.minus.length]));
}
function yt(e, t) {
	return {
		...e,
		values: gt(e.values, t) ?? [],
		categories: gt(e.categories, t),
		sourceHidden: gt(e.sourceHidden, t),
		dataPointColors: gt(e.dataPointColors, t),
		dataLabelColors: gt(e.dataLabelColors, t),
		catFormatCodes: gt(e.catFormatCodes, t),
		bubbleSizes: gt(e.bubbleSizes, t),
		dataPointOverrides: _t(e.dataPointOverrides, t),
		dataLabelOverrides: _t(e.dataLabelOverrides, t),
		errBars: e.errBars?.map((e) => ({
			...e,
			plus: gt(e.plus, t) ?? [],
			minus: gt(e.minus, t) ?? []
		}))
	};
}
function bt(e) {
	let t = e.sourceHidden;
	if (!t?.some(Boolean)) return e;
	let n = (e, n) => e == null ? e : e.map((e, r) => t[r] === !0 ? n : e);
	return {
		...e,
		values: n(e.values, null) ?? [],
		bubbleSizes: n(e.bubbleSizes, null),
		errBars: e.errBars?.map((e) => ({
			...e,
			plus: n(e.plus, null) ?? [],
			minus: n(e.minus, null) ?? []
		}))
	};
}
function xt(e) {
	return e.chartType === "scatter" || e.chartType === "bubble";
}
function St(e) {
	let t = e.sourceHidden;
	return t != null && t.length > 0 && t.every(Boolean);
}
var Ct = [
	"diamond",
	"square",
	"triangle",
	"x",
	"star",
	"circle"
], wt = /* @__PURE__ */ new WeakSet();
function Tt(e) {
	return wt.has(e);
}
function Et(e, t) {
	let n = e.themeAccentColors, r = t.dataPointColors?.some((e) => e != null) === !0 || (t.dataPointOverrides?.length ?? 0) > 0, i = t.markerSymbol != null || t.markerFill != null || t.markerFillPaintAuthored === !0 || t.markerLine != null;
	if (e.scatterStyle !== "marker" || !n?.length || r || i || t.lineHidden === !0) return t;
	let a = {
		...t,
		dataPointColors: t.values.map((e, t) => n[t % n.length]),
		dataPointOverrides: t.values.map((e, t) => ({
			idx: t,
			markerSymbol: Ct[t % Ct.length]
		}))
	};
	return wt.add(a), a;
}
function Dt(e) {
	if (e.plotVisibleOnly !== !0) return e;
	if (xt(e)) return {
		...e,
		series: e.series.flatMap((t) => {
			let n = t.categories == null ? {
				...t,
				categories: e.categories
			} : t, r = n.sourceHidden, i = r && ht(r, vt(n));
			if (!i) return [n];
			if (i.keep.length === 0) return [];
			let a = yt(n, i);
			return e.chartType === "scatter" ? [Et(e, a)] : [a];
		})
	};
	let t = Math.max(e.categories.length, ...e.categoryLevels?.map((e) => e.length) ?? [], ...e.series.map(vt)), n = e.categorySourceHidden ? ht(e.categorySourceHidden, t) : null, r = e.series.flatMap((e) => {
		let t = n ? yt(e, n) : e;
		return n?.keep.length === 0 || St(t) ? [] : [bt(t)];
	});
	if (!n) return {
		...e,
		series: r
	};
	let i = e.subtotalIndices.flatMap((e) => {
		if (e >= n.remap.length) return [];
		let t = n.remap[e];
		return t >= 0 ? [t] : [];
	});
	return {
		...e,
		categories: gt(e.categories, n) ?? [],
		categoryLevels: e.categoryLevels?.map((e) => gt(e, n) ?? []),
		categorySourceHidden: gt(e.categorySourceHidden, n),
		subtotalIndices: i,
		series: r
	};
}
//#endregion
//#region packages/core/src/chart/renderer.ts
var Ot = [
	"4472C4",
	"ED7D31",
	"A9D18E",
	"FF0000",
	"70AD47",
	"4BACC6",
	"FFC000",
	"9E480E",
	"843C0C",
	"636363",
	"255E91",
	"967300"
], kt = [
	"5B9BD5",
	"ED7D31",
	"A5A5A5",
	"FFC000",
	"4472C4",
	"70AD47"
];
function At(e, t) {
	return t?.color ? `#${t.color}` : `#${Ot[e % Ot.length]}`;
}
function jt(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e ?? []) t.has(n.idx) || t.set(n.idx, n);
	return t;
}
function Mt(e, t, n = !0) {
	let r = t.dataPointColors?.[e];
	return r ? `#${r}` : t.color === "00000000" ? "#00000000" : n ? `#${Ot[e % Ot.length]}` : At(e, t);
}
function Nt(e, t) {
	return t && (t.startsWith("+mj") ? e.themeMajorFontLatin ?? null : t.startsWith("+mn") ? e.themeMinorFontLatin ?? null : t);
}
function Y(e, t, n) {
	let r = n === "major" ? e.themeMajorFontLatin : e.themeMinorFontLatin, i = Nt(e, t) ?? r;
	return i ? `"${i}", Calibri, Arial, sans-serif` : "sans-serif";
}
function Pt(e, t, n = !1, r = !1) {
	return `${r ? "italic " : ""}${n ? "bold " : ""}${e}px ${t}`;
}
function Ft(e) {
	return e === "pie" || e === "doughnut";
}
function It(e) {
	return e.chartType === "bubble" && e.series.length === 1 && e.series[0]?.bubbleXSourceIsString === !0 ? !0 : !!e.varyColors && e.series.length === 1 && typeof e.chartType == "string" && /Bar/.test(e.chartType);
}
function Lt(e, t, n, r = !1) {
	if (r || Ft(e)) {
		let e = t[0];
		return e ? Mt(n, e) : `#${Ot[n % Ot.length]}`;
	}
	return At(n, t[n]);
}
function Rt(e, t, n, r, i, a, o, s, c, l, u = "sans-serif", d, f, p, m) {
	e.save(), e.font = Pt(a, u, o, s), e.fillStyle = c;
	let h = p ? t : q(e, t, l), g = S(i, d, f), v = n, y = r;
	if (p && m) {
		let t = e.measureText(h).width, i = Math.abs(Math.cos(g)), o = Math.abs(Math.sin(g)), s = t * i + a * o, c = t * o + a * i, l = {
			x: n - s / 2,
			y: r - c / 2,
			w: s,
			h: c
		}, u = _({
			...p,
			w: void 0,
			h: void 0
		}, m, l);
		u && (v = u.x + u.w / 2, y = u.y + u.h / 2);
	}
	e.translate(v, y), g !== 0 && e.rotate(g), e.textAlign = "center", e.textBaseline = "middle", e.fillText(h, 0, 0), e.restore();
}
function zt(e) {
	return e ? `#${e}` : "#555";
}
function Bt(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m = !1) {
	let h = (t, f, p, m, h, g, _, v, y, x) => {
		if (f === "left") {
			Rt(e, t, n + u + b(i) + p / 2, s + l / 2, f, p, m, h, g, l, _, v, y, x, {
				x: n,
				y: r,
				w: i,
				h: a
			});
			return;
		}
		Rt(e, t, o + c / 2, r + a - d - b(a) - p / 2, f, p, m, h, g, c, _, v, y, x, {
			x: n,
			y: r,
			w: i,
			h: a
		});
	};
	t.valAxisTitle && h(t.valAxisTitle, m ? "horizontal" : "left", p, t.valAxisTitleFontBold ?? !0, t.valAxisTitleFontItalic ?? !1, zt(t.valAxisTitleFontColor), Y(t, t.valAxisTitleFontFace, "major"), t.valAxisTitleRotation, t.valAxisTitleVerticalMode, t.valAxisTitleManualLayout), t.catAxisTitle && h(t.catAxisTitle, m ? "left" : "horizontal", f, t.catAxisTitleFontBold ?? !0, t.catAxisTitleFontItalic ?? !1, zt(t.catAxisTitleFontColor), Y(t, t.catAxisTitleFontFace, "major"), t.catAxisTitleRotation, t.catAxisTitleVerticalMode, t.catAxisTitleManualLayout);
}
function Vt(e) {
	return e.dataTable != null && Ce(e.chartType);
}
function Ht(e) {
	let t = e.chartType === "clusteredBarH" || e.chartType === "stackedBarH" || e.chartType === "stackedBarHPct", n = e.series.map((e, t) => ({
		series: e,
		sourceIndex: t
	}));
	return t ? n.reverse() : n;
}
function Ut(e, t) {
	let n = Vt(e) ? e.dataTable : null;
	if (!n) return 0;
	let r = p(n.fontSizeHpt, t) ?? 9 * t, i = Math.max(1, r * 1.2) + 4 * t;
	return (e.series.length + 1) * i;
}
function Wt(e, t, n) {
	let r = Vt(t) ? t.dataTable : null;
	if (!r) return 0;
	let i = p(r.fontSizeHpt, n) ?? 9 * n, a = Y(t, r.fontFace, "minor");
	e.save(), e.font = Pt(i, a, r.fontBold ?? !1, r.fontItalic ?? !1);
	let o = t.series.reduce((t, n) => Math.max(t, e.measureText(n.name).width), 0);
	e.restore();
	let s = r.showKeys ? Math.max(12 * n, i * 1.7) : 0, c = r.showKeys ? 4 * n : 0;
	return o + s + c + 6 * n;
}
function Gt(e, t, n, r) {
	let i = Vt(t) ? t.dataTable : null;
	if (!i) return null;
	let a = p(i.fontSizeHpt, r) ?? 9 * r, o = Math.max(1, a * 1.2), s = o + 4 * r, c = Y(t, i.fontFace, "minor");
	e.save(), e.font = Pt(a, c, i.fontBold ?? !1, i.fontItalic ?? !1);
	let l = t.series.find((e) => e.catFormatCode)?.catFormatCode ?? t.catAxisFormatCode, u = t.series.find((e) => e.catFormatBuiltinId != null)?.catFormatBuiltinId, d = pr(t).map((i) => {
		let a = i.trim() === "" ? NaN : Number(i);
		return Yn(e, u === 14 && Number.isFinite(a) ? we(a, t.date1904) : Ae(i, l, t.date1904), Math.max(1, n - 4 * r));
	});
	e.restore();
	let f = Math.max(1, ...d.map((e) => e.length)) * o + 4 * r;
	return {
		fontPx: a,
		lineHeight: o,
		headerLines: d,
		headerHeight: f,
		rowHeight: s,
		totalHeight: f + Ht(t).length * s
	};
}
function Kt(e, t, n, r, i, a, o, s) {
	let c = t.dataTable;
	if (!c || !n) return;
	let l = pr(t);
	if (l.length === 0) return;
	let u = a / l.length, d = Y(t, c.fontFace, "minor"), f = Pt(n.fontPx, d, c.fontBold ?? !1, c.fontItalic ?? !1), p = c.showKeys ? Math.max(12 * s, n.fontPx * 1.7) : 0, m = c.showKeys ? 4 * s : 0;
	e.save(), e.font = f;
	let h = t.series.reduce((t, n) => Math.max(t, e.measureText(n.name).width), 0) + p + m + 6 * s, g = Math.min(Math.max(0, r - o), h), _ = r - g, v = g + a, y = i + n.totalHeight, b = Ht(t), x = Yt(t.series, t.chartType, t.scatterStyle, !1, t.categories, [], !0, [], t.radarStyle, t), S = c.fillColor ?? null;
	e.beginPath(), e.rect(_, i, v, n.totalHeight), e.clip();
	let C = c.fontColor ? `#${c.fontColor}` : "#000000", w = (t, r, i) => {
		if (S && t !== "") {
			let a = e.measureText(t).width;
			e.fillStyle = `#${S}`, e.fillRect(r - a / 2, i - n.lineHeight / 2, a, n.lineHeight);
		}
		e.fillStyle = C, e.textAlign = "center", e.fillText(t, r, i);
	};
	e.fillStyle = C, e.textAlign = "center", e.textBaseline = "middle";
	for (let e = 0; e < l.length; e++) {
		let t = r + (e + .5) * u, a = n.headerLines[e] ?? [""], o = a.length * n.lineHeight, s = i + (n.headerHeight - o) / 2 + n.lineHeight / 2;
		a.forEach((e, r) => {
			w(e, t, s + r * n.lineHeight);
		});
	}
	for (let t = 0; t < b.length; t++) {
		let { series: a, sourceIndex: o } = b[t], d = i + n.headerHeight + t * n.rowHeight + n.rowHeight / 2;
		if (g > 0) {
			let t = _ + 3 * s + p + m;
			if (e.textAlign = "left", e.fillText(q(e, a.name, Math.max(0, r - t - 2 * s)), t, d), c.showKeys && p > 0) {
				let t = _ + 3 * s, r = x[o];
				if (r) {
					let i = Math.min(n.fontPx, n.rowHeight - 2 * s);
					Q(e, r.swatchStyle, r.color, t, d - i / 2, p, i, r.marker, r.fillPaint, r.outlineColor, r.outlineWidthEmu, r.outlineDash, r.outlineCap, r.outlineJoin, s);
				}
				e.fillStyle = C;
			}
		}
		for (let e = 0; e < l.length; e++) {
			let t = a.values[e];
			w(t == null ? "" : I(t, a.valFormatCode), r + (e + .5) * u, d);
		}
	}
	if (c.lineHidden !== !0) {
		if (e.strokeStyle = c.lineColor ? `#${c.lineColor}` : "#808080", e.lineWidth = c.lineWidthEmu == null ? Math.max(.5, s * .75) : Pe(c.lineWidthEmu, s), e.setLineDash(Mi(c.lineDash ?? void 0, e.lineWidth)), c.showHorizontalBorder) {
			let t = i + n.headerHeight;
			for (let r = 0; r < b.length; r++) e.beginPath(), e.moveTo(_, t), e.lineTo(_ + v, t), e.stroke(), t += n.rowHeight;
		}
		if (c.showVerticalBorder) {
			e.beginPath(), e.moveTo(r, i), e.lineTo(r, y), e.stroke();
			for (let t = 1; t < l.length; t++) {
				let n = r + t * u;
				e.beginPath(), e.moveTo(n, i), e.lineTo(n, y), e.stroke();
			}
		}
		if (c.showOutline) {
			let t = e.lineWidth / 2;
			e.strokeRect(_ + t, i + t, Math.max(0, v - e.lineWidth), Math.max(0, n.totalHeight - e.lineWidth));
		}
	}
	e.restore();
}
function qt(e) {
	return e && (e === "line" || e === "stackedLine" || e === "stackedLinePct" || e === "radar" || e === "scatter" || e === "stock") ? "line" : "fill";
}
function Jt(e, t, n) {
	if (e !== "scatter") return !1;
	let r = t ?? "marker";
	return (r === "marker" || r === "line" || r === "lineMarker" || r === "lineNoMarker" || r === "smooth" || r === "smoothMarker" || r === "smoothNoMarker") && n.lineHidden !== !0;
}
function X(e, t, n, r, i, a) {
	let o = r[i];
	if (!o) return null;
	let s = o.seriesType ?? e, c = s === "stock", l = s === "line" || s === "stackedLine" || s === "stackedLinePct" || s === "radar" || c, u = s === "bubble", d = s === "scatter" || u;
	if (!l && !d || !fe(e, t, o, n)) return null;
	let f = o.markerSymbol ?? o.automaticMarkerSymbol ?? (c ? "none" : "circle"), p = At(i, o), m = B(o, p.replace(/^#/, "")), h = u ? !1 : d ? Jt("scatter", t, o) : o.lineHidden !== !0;
	if (u && a) {
		let e = mi(a, o, void 0, i, p), t = hi(a, o, void 0, i);
		return {
			symbol: "circle",
			fill: e.color,
			fillPaint: e.paint,
			line: t.color,
			lineWidthEmu: t.widthEmu ?? null,
			linePaint: t.paint,
			lineDash: t.dash,
			lineCustomDash: t.customDash,
			lineCap: t.cap,
			lineJoin: t.join,
			bubble3D: V(o, void 0),
			withLine: !1
		};
	}
	return {
		symbol: f,
		fill: m,
		fillPaint: ie(o),
		line: o.markerLine ?? null,
		lineWidthEmu: o.markerLineWidthEmu ?? null,
		withLine: h
	};
}
function Z(e, t, n, r) {
	let i = mi(e, t, n, r, At(0, t)), a = hi(e, t, n, r);
	return {
		symbol: "circle",
		fill: i.color,
		fillPaint: i.paint,
		line: a.color,
		lineWidthEmu: a.widthEmu ?? null,
		linePaint: a.paint,
		lineDash: a.dash,
		lineCustomDash: a.customDash,
		lineCap: a.cap,
		lineJoin: a.join,
		bubble3D: V(t, n),
		withLine: !1
	};
}
function Q(e, t, n, r, i, a, o, s = null, c = void 0, l = null, u = null, d = null, f = null, p = null, m = 1, h = 0) {
	if (t !== "none") {
		if (s && !s.withLine) {
			Si(e, r + a / 2, i + o / 2, s.symbol, o * .58 / m, s.fill, s.line, m, s.lineWidthEmu == null ? void 0 : Pe(s.lineWidthEmu, m), s.fillPaint, h, s.linePaint, s.lineDash, s.lineCustomDash, s.lineCap, s.lineJoin, s.bubble3D);
			return;
		}
		if (e.fillStyle = n, t === "line") {
			if (!(l != null || u != null || d != null || f != null || p != null)) {
				e.strokeStyle = n;
				let t = e.lineWidth;
				e.lineWidth = Math.max(1.5, o * .15), e.beginPath();
				let c = i + o / 2;
				e.moveTo(r, c), e.lineTo(r + a, c), e.stroke(), e.lineWidth = t, s && Si(e, r + a / 2, i + o / 2, s.symbol, o * .58 / m, s.fill, s.line, m, s.lineWidthEmu == null ? void 0 : Pe(s.lineWidthEmu, m), s.fillPaint, h, s.linePaint, s.lineDash, s.lineCustomDash, s.lineCap, s.lineJoin, s.bubble3D);
				return;
			}
			e.save(), e.strokeStyle = l ? `#${l}` : n, e.lineWidth = u == null ? Math.max(1.5, o * .15) : Pe(u, m), e.setLineDash(Mi(d ?? void 0, e.lineWidth)), e.lineCap = f === "rnd" ? "round" : f === "sq" ? "square" : "butt", e.lineJoin = p === "round" || p === "bevel" ? p : "miter", e.beginPath();
			let t = i + o / 2;
			e.moveTo(r, t), e.lineTo(r + a, t), e.stroke(), s && Si(e, r + a / 2, i + o / 2, s.symbol, o * .58 / m, s.fill, s.line, m, s.lineWidthEmu == null ? void 0 : Pe(s.lineWidthEmu, m), s.fillPaint, h, s.linePaint, s.lineDash, s.lineCustomDash, s.lineCap, s.lineJoin, s.bubble3D), e.restore();
		} else if (c !== null && (c && (e.fillStyle = c.fillType === "solid" ? c.color.startsWith("#") ? c.color : `#${c.color}` : Ie(c, e, r, i, a, o, h) ?? n), e.fillRect(r, i, a, o)), l) {
			let t = Pe(u, m);
			e.save(), e.strokeStyle = `#${l}`, e.lineWidth = t, e.setLineDash(Mi(d ?? void 0, e.lineWidth)), e.lineCap = f === "rnd" ? "round" : f === "sq" ? "square" : "butt", e.lineJoin = p === "round" || p === "bevel" ? p : "miter", e.strokeRect(r + t / 2, i + t / 2, Math.max(0, a - t), Math.max(0, o - t)), e.restore();
		}
	}
}
function $(e, t) {
	if (t.length === 0) return [...e];
	let n = /* @__PURE__ */ new Map();
	for (let e of t) n.set(e.idx, e);
	let r = [];
	for (let t = 0; t < e.length; t++) {
		let i = n.get(t);
		i?.deleted !== !0 && r.push({
			...e[t],
			textOverride: i ?? null
		});
	}
	return r;
}
function Yt(e, t, n, r = !1, i = [], a = [], o = !0, s = [], c, l) {
	if (r || Ft(t)) {
		let n = e[0], c = n ? n.values.length : 0, u = n?.categories ?? i, d = new Map(n?.dataPointOverrides?.map((e) => [e.idx, e]) ?? []);
		return $(Array.from({ length: c }, (i, s) => {
			let c = d.get(s), f = (c?.lineHidden ?? n?.lineHidden) !== !0, p = t === "bubble" && l && n ? Z(l, n, c, s) : null;
			return {
				label: (u[s] ?? `Item ${s + 1}`).toString(),
				color: Ft(t) && n ? Mt(s, n, o) : Lt(t, e, s, r),
				marker: p,
				swatchStyle: qt(t),
				fillPaint: c?.fillHidden === !0 ? null : c?.color || n?.dataPointColors?.[s] ? void 0 : s < a.length ? a[s] : n?.fillPattern ?? void 0,
				outlineColor: f ? c?.lineColor ?? n?.lineColor ?? null : null,
				outlineWidthEmu: f ? c?.lineWidthEmu ?? n?.lineWidthEmu ?? null : null,
				outlineDash: f ? c?.lineDash ?? n?.chartexStyle?.lineDash ?? null : null,
				outlineCap: f ? n?.chartexStyle?.lineCap ?? null : null,
				outlineJoin: f ? n?.chartexStyle?.lineJoin ?? null : null,
				textOverride: null
			};
		}), s);
	}
	return $(e.map((r, i) => {
		let o = r.seriesType ?? t, s = r.lineHidden !== !0, u = s ? r.lineColor ?? null : null, d = X(t, n, c, e, i, l), f = o === "stock" && !s && !d ? "none" : qt(o);
		return {
			label: r.name || `Series ${i + 1}`,
			color: f === "line" && u ? `#${u}` : Lt(t, e, i),
			marker: d,
			swatchStyle: f,
			fillPaint: i < a.length ? a[i] : r.fillPattern ?? void 0,
			outlineColor: u,
			outlineWidthEmu: s ? r.lineWidthEmu ?? null : null,
			outlineDash: s ? r.chartexStyle?.lineDash ?? null : null,
			outlineCap: s ? r.chartexStyle?.lineCap ?? null : null,
			outlineJoin: s ? r.chartexStyle?.lineJoin ?? null : null,
			textOverride: null
		};
	}), s);
}
function Xt(e, t, n = 0) {
	let r = It(e) || Ft(e.chartType), i = Yt(e.series, e.chartType, e.scatterStyle, It(e), e.categories, [], e.varyColors !== !1, [], e.radarStyle, e);
	return (e, a) => {
		let o = i[r ? a : e];
		return o ? {
			entry: o,
			ptToPx: t,
			shapeRotationDeg: n
		} : void 0;
	};
}
function Zt(e, t, n, r) {
	if (!n) return t;
	let i = Nt(e, n.fontFace) ?? n.fontFace;
	return {
		fontFamily: i ? `"${i}", Calibri, Arial, sans-serif` : t.fontFamily,
		color: n.fontColor ? `#${n.fontColor}` : t.color,
		bold: n.fontBold ?? t.bold,
		sizePx: p(n.fontSizeHpt, r) ?? t.sizePx
	};
}
function Qt(e, t, n) {
	let r = un(t, n);
	return e.font = `${t.bold ? "bold " : ""}${r}px ${t.fontFamily}`, r;
}
var $t = {
	fontFamily: "sans-serif",
	color: "#333",
	bold: !1,
	sizePx: null
}, en = 4, tn = 12, nn = 4, rn = 4, an = rn * 2, on = 4, sn = 8, cn = .01, ln = 7;
function un(e, t) {
	return e.sizePx ?? 10 * t;
}
function dn(e, t, n) {
	return e.map((e) => {
		if (e.swatchStyle === "fill") return ln * n;
		let r = t * 1.6;
		if (e.swatchStyle !== "line" || !e.outlineDash) return r;
		let i = e.outlineWidthEmu == null ? Math.max(1.5, t * .15) : Pe(e.outlineWidthEmu, n), a = Mi(e.outlineDash, i), o = a.length > 0 ? a.reduce((e, t) => e + t, 0) + a[0] : 0;
		return Math.max(r, o);
	});
}
function fn(e, t, n) {
	return e.swatchStyle === "fill" ? ln * n : t;
}
function pn(e, t, n) {
	if (!(n > 0)) return [];
	let r = Yn(e, t, n);
	return r.length <= 2 ? r : [r[0], q(e, r.slice(1).join(" "), n)];
}
function mn(e, t, n, r, a, o) {
	if (!t.showLegend) return null;
	let s = gn(t, o), c = Yt(qn(t), t.chartType, t.scatterStyle, It(t), t.categories, [], t.varyColors !== !1, t.legendEntries ?? [], t.radarStyle, t), l = c.map((e) => Zt(t, s, e.textOverride, o)), u = l.map((e) => un(e, o)), d = c.map((e, t) => dn([e], u[t], o)[0]);
	e.save();
	let f = c.map((t, n) => (Qt(e, l[n], o), d[n] + en + e.measureText(t.label).width));
	e.restore();
	let p = t.legendPos ?? "r", m = p === "t" || p === "b", h = i(t, n, r, a, {
		itemWidths: f,
		rowHeight: Math.max(0, ...u) + nn,
		itemGap: tn,
		horizontalPadding: m ? an : sn,
		verticalPadding: on
	});
	return h ? {
		...h,
		measuredLabels: c.map((e) => e.label),
		entryStyles: l,
		fontSizes: u,
		swatches: d,
		itemWidths: f
	} : null;
}
function hn(e, t, n, r, i, a, o = "vertical", s, c = $t, l, u = !1, f = [], p = 1, m = [], h = 0, g = !0, _, v) {
	let y = en, b = Yt(t, s, l, u, f, m, g, _?.legendEntries ?? [], _?.radarStyle, _), x = v != null && v.measuredLabels.length === b.length && v.measuredLabels.every((e, t) => e === b[t].label), S = x ? v.entryStyles : b.map((e) => _ ? Zt(_, c, e.textOverride, p) : c), C = x ? v.fontSizes : S.map((e) => un(e, p));
	S[0] && Qt(e, S[0], p), e.textBaseline = "middle";
	let w = Math.max(0, ...C) + nn, T = x ? v.swatches : b.map((e, t) => dn([e], C[t], p)[0]), E = x ? v.itemWidths : b.map((t, n) => (Qt(e, S[n], p), T[n] + y + e.measureText(t.label).width));
	if (o === "horizontal") {
		let t = d(E, i, tn).slice(0, Math.max(0, Math.floor((a - on) / w))), o = r + on / 2;
		for (let r = 0; r < t.length; r++) {
			let a = t[r], s = a.map((e) => Math.min(i, E[e])), c = s.reduce((e, t) => e + t, 0) + tn * Math.max(0, a.length - 1), l = n + Math.max(0, (i - c) / 2), u = o + r * w + w / 2;
			for (let t = 0; t < a.length; t++) {
				let n = a[t], r = T[n], i = s[t];
				if (i < r) {
					l += i + tn;
					continue;
				}
				let o = Math.max(0, i - r - y + cn);
				Qt(e, S[n], p);
				let c = q(e, b[n].label, o), d = fn(b[n], C[n], p);
				Q(e, b[n].swatchStyle, b[n].color, l, u - d / 2, r, d, b[n].marker, b[n].fillPaint, b[n].outlineColor, b[n].outlineWidthEmu, b[n].outlineDash, b[n].outlineCap, b[n].outlineJoin, p, h), e.fillStyle = S[n].color, e.textAlign = "left", e.fillText(c, l + r + y, u), l += i + tn;
			}
		}
		return;
	}
	let D = i - Math.max(...T, 0) - y, O = !u && !Ft(s), k = b.map((t, n) => (Qt(e, S[n], p), O ? pn(e, t.label, D) : [q(e, t.label, D)])), A = k.map((e, t) => e.length * C[t] + nn), j = 0, M = 0;
	for (; j < b.length && M + A[j] <= a;) M += A[j], j++;
	let N = j === b.length ? r + (a - M) / 2 : r;
	for (let t = 0; t < j; t++) {
		let r = T[t], a = A[t];
		if (i < r) {
			N += a;
			continue;
		}
		let o = fn(b[t], C[t], p);
		Q(e, b[t].swatchStyle, b[t].color, n, N + (a - o) / 2, r, o, b[t].marker, b[t].fillPaint, b[t].outlineColor, b[t].outlineWidthEmu, b[t].outlineDash, b[t].outlineCap, b[t].outlineJoin, p, h), Qt(e, S[t], p), e.fillStyle = S[t].color, e.textAlign = "left", k[t].forEach((i, a) => e.fillText(i, n + r + y, N + C[t] * (a + .5))), N += a;
	}
}
function gn(e, t) {
	let n = Nt(e, e.legendFontFace) ?? e.themeMinorFontLatin;
	return {
		fontFamily: n ? `"${n}", Calibri, Arial, sans-serif` : "sans-serif",
		color: e.legendFontColor ? `#${e.legendFontColor}` : "#333",
		bold: e.legendFontBold ?? !1,
		sizePx: p(e.legendFontSizeHpt, t)
	};
}
function _n(e, t, n, r, i, a, o, s, c, l, u, d, f, p = [], m = 0) {
	if (!n) return;
	let h = gn(t, f), g = qn(t), v = It(t), y = Math.min(sn / 2, Math.max(0, n.reserveW) / 2), b = Math.max(0, n.reserveW - y * 2), x = n.side === "r" ? {
		x: r + a - n.reserveW + y,
		y: c,
		w: b,
		h: u
	} : n.side === "l" ? {
		x: r + y,
		y: c,
		w: b,
		h: u
	} : n.side === "t" ? {
		x: r + rn,
		y: i + d,
		w: Math.max(0, a - an),
		h: n.reserveH
	} : {
		x: r + rn,
		y: i + o - n.reserveH,
		w: Math.max(0, a - an),
		h: n.reserveH
	}, S = n.side === "t" || n.side === "b" ? "horizontal" : "vertical", C = t.legendManualLayout, w = C ? _(C, {
		x: r,
		y: i,
		w: a,
		h: o
	}, x) : null;
	if (w) {
		let r = w.w >= w.h ? "horizontal" : "vertical";
		xe(e, t, w, f, m), hn(e, g, w.x, w.y, w.w, w.h, r, t.chartType, h, t.scatterStyle, v, t.categories, f, p, m, t.varyColors !== !1, t, n);
		return;
	}
	xe(e, t, x, f, m), hn(e, g, x.x, x.y, x.w, x.h, S, t.chartType, h, t.scatterStyle, v, t.categories, f, p, m, t.varyColors !== !1, t, n);
}
function vn(e, t, n, r, i, a, o, s) {
	if (!t || t.side !== "t" || e.legendOverlay === !0 || e.legendManualLayout == null) return s;
	let c = {
		x: n + rn,
		y: r + o + 2,
		w: Math.max(0, i - an),
		h: t.reserveH
	}, l = _(e.legendManualLayout, {
		x: n,
		y: r,
		w: i,
		h: a
	}, c);
	if (!l) return s;
	let u = Math.max(0, r + s - (c.y + c.h));
	return Math.max(s, l.y + l.h - r + u);
}
function yn(e, t, n, r, i, a, o, s = !1, c = !1, l = "major", u = 1, d) {
	if (c || t === "none" || !t) return;
	let f = xn(l, o, u), p = t === "cross" ? f / 2 : f, m = e.strokeStyle, h = e.lineWidth, g = e.getLineDash?.() ?? [];
	if (e.strokeStyle = a ?? "#888", e.lineWidth = o ?? 1, e.setLineDash(Mi(d ?? void 0, e.lineWidth)), e.beginPath(), n === "val") {
		let n = r, a = i, o = s ? 1 : -1, c = t === "out" || t === "cross" ? o * p : 0, l = t === "in" || t === "cross" ? -o * p : 0;
		e.moveTo(n + c, a), e.lineTo(n + l, a);
	} else {
		let n = r, a = i, o = s ? -1 : 1, c = t === "out" || t === "cross" ? o * p : 0, l = t === "in" || t === "cross" ? -o * p : 0;
		e.moveTo(a, n + c), e.lineTo(a, n + l);
	}
	e.stroke(), e.strokeStyle = m, e.lineWidth = h, e.setLineDash(g);
}
function bn(e, t, n, r, i, a, o, s) {
	let c = e.getLineDash?.() ?? [], l = Mi(s ?? void 0, o), u = l.length !== c.length || l.some((e, t) => e !== c[t]);
	e.strokeStyle = a, e.lineWidth = o, u && e.setLineDash(l), e.beginPath(), e.moveTo(t, n), e.lineTo(r, i), e.stroke(), u && e.setLineDash(c);
}
function xn(e, t, n) {
	let r = (e === "minor" ? 4 : 6) * n;
	return t ? Math.max(r, t + 2 * n) : r;
}
function Sn(e, t, n, r) {
	if (e !== "out" && e !== "cross") return 0;
	let i = xn(t, n, r);
	return e === "cross" ? i / 2 : i;
}
function Cn(e, t, n, r, i, a) {
	a && a.explicit ? (e.strokeStyle = a.color, e.lineWidth = a.width) : (e.strokeStyle = i ? "#aaa" : a?.color ?? "#e0e0e0", e.lineWidth = i ? 1 : a?.width ?? .5);
	let o = a?.dash ?? [], s = o.length > 0 && e.getLineDash ? e.getLineDash() : [];
	o.length > 0 && e.setLineDash(o), e.beginPath(), e.moveTo(t, r), e.lineTo(t + n, r), e.stroke(), o.length > 0 && e.setLineDash(s);
}
function wn(e, t) {
	let { color: n, width: r } = Ee(e.valAxisGridlineColor, e.valAxisGridlineWidthEmu, t);
	return {
		color: n,
		width: r,
		explicit: e.valAxisGridlineColor != null || e.valAxisGridlineWidthEmu != null || e.valAxisGridlineDash != null,
		dash: Mi(e.valAxisGridlineDash ?? void 0, r)
	};
}
function Tn(e, t) {
	let { color: n, width: r } = Ee(e.valAxisMinorGridlineColor, e.valAxisMinorGridlineWidthEmu, t);
	return {
		color: n,
		width: r,
		explicit: e.valAxisMinorGridlineColor != null,
		dash: Mi(e.valAxisMinorGridlineDash ?? void 0, r)
	};
}
function En(e, t) {
	let { color: n, width: r } = Ee(e.minorGridlineColor, e.minorGridlineWidthEmu, t);
	return {
		color: n,
		width: r,
		explicit: e.minorGridlineColor != null || e.minorGridlineWidthEmu != null || e.minorGridlineDash != null,
		dash: Mi(e.minorGridlineDash ?? void 0, r)
	};
}
function Dn(e, t) {
	let { color: n, width: r } = Ee(e.majorGridlineColor, e.majorGridlineWidthEmu, t);
	return {
		color: n,
		width: r,
		explicit: e.majorGridlineColor != null || e.majorGridlineWidthEmu != null || e.majorGridlineDash != null,
		dash: Mi(e.majorGridlineDash ?? void 0, r)
	};
}
function On(e) {
	return e.catAxisMajorGridlines === !0;
}
function kn(e, t) {
	let n = Ee(e.catAxisGridlineColor, e.catAxisGridlineWidthEmu, t);
	return {
		...n,
		dash: Mi(e.catAxisGridlineDash ?? void 0, n.width)
	};
}
function An(e, t) {
	let n = Ee(e.catAxisMinorGridlineColor, e.catAxisMinorGridlineWidthEmu, t);
	return {
		...n,
		dash: Mi(e.catAxisMinorGridlineDash ?? void 0, n.width)
	};
}
function jn(e, t) {
	if (t <= 0) return [];
	let n = ce(e), r = [], i = n ? t : t - 1;
	for (let e = 0; e <= i; e++) r.push(n ? e / t : t === 1 ? .5 : e / (t - 1));
	return r;
}
function Mn(e) {
	return e.valAxisOrientation === "maxMin";
}
function Nn(e) {
	return e.catAxisOrientation === "maxMin";
}
function Pn(e) {
	return e.valAxisMajorGridlines !== !1;
}
function Fn(e, t) {
	return e == null || !t ? e : e * 100;
}
function In(e, t, n) {
	return I((n ? t / 100 : t) / Ln(e.valAxisDisplayUnits), n ? e.valAxisFormatCode ?? "0%" : e.valAxisFormatCode, e.date1904);
}
function Ln(e) {
	let t = e?.divisor;
	return t != null && Number.isFinite(t) && t > 0 ? t : 1;
}
function Rn(e, t, n, r) {
	return I(e / Ln(r), t, n);
}
function zn(e) {
	return e.builtInUnit ? {
		hundreds: "Hundreds",
		thousands: "Thousands",
		tenThousands: "Ten Thousands",
		hundredThousands: "Hundred Thousands",
		millions: "Millions",
		tenMillions: "Ten Millions",
		hundredMillions: "Hundred Millions",
		billions: "Billions",
		trillions: "Trillions"
	}[e.builtInUnit] ?? e.builtInUnit : pe(e.divisor);
}
function Bn(e, t, n, r) {
	let i = [
		{
			units: t.valAxisDisplayUnits,
			vertical: !0,
			fallbackX: n.x + n.w * .08,
			fallbackY: n.y + n.h * .12
		},
		{
			units: t.catAxisDisplayUnits,
			vertical: !1,
			fallbackX: n.x + n.w * .82,
			fallbackY: n.y + n.h * .82
		},
		{
			units: t.secondaryValAxis?.displayUnits,
			vertical: !0,
			fallbackX: n.x + n.w * .92,
			fallbackY: n.y + n.h * .12
		},
		{
			units: t.secondaryCatAxis?.displayUnits,
			vertical: !1,
			fallbackX: n.x + n.w * .82,
			fallbackY: n.y + n.h * .08
		}
	];
	for (let { units: a, vertical: o, fallbackX: s, fallbackY: c } of i) {
		let i = a?.label;
		if (!a || !i) continue;
		let l = i.text ?? zn(a), u = p(i.fontSizeHpt, r) ?? 10 * r;
		e.save(), e.font = Pt(u, Y(t, i.fontFace, "minor"), i.fontBold ?? !1, i.fontItalic ?? !1);
		let d = i.rotation == null ? o ? -Math.PI / 2 : 0 : i.rotation / 6e4 * Math.PI / 180, f = e.measureText(l).width, m = Math.abs(Math.cos(d)) * f + Math.abs(Math.sin(d)) * u, h = Math.abs(Math.sin(d)) * f + Math.abs(Math.cos(d)) * u, g = {
			x: s - m / 2,
			y: c - h / 2,
			w: m,
			h
		}, v = i.manualLayout ? _({
			...i.manualLayout,
			w: void 0,
			h: void 0
		}, n, g) : g;
		if (!v) {
			e.restore();
			continue;
		}
		let y = v.x + v.w / 2, b = v.y + v.h / 2;
		i.boxStyle?.fill && (e.fillStyle = `#${i.boxStyle.fill}`, e.fillRect(v.x, v.y, v.w, v.h)), i.boxStyle?.borderColor && (e.strokeStyle = `#${i.boxStyle.borderColor}`, e.lineWidth = i.boxStyle.borderWidthEmu ? Math.max(.5, i.boxStyle.borderWidthEmu / He * r) : 1, e.strokeRect(v.x, v.y, v.w, v.h)), e.translate(y, b), d !== 0 && e.rotate(d), e.fillStyle = i.fontColor ? `#${i.fontColor}` : "#595959", e.textAlign = "center", e.textBaseline = "middle", e.fillText(l, 0, 0), e.restore();
	}
}
function Vn(e, t, n, r, i = !1, a = "vertical") {
	let o = Mn(e), s = e.valAxisLogBase, c = Fn(e.valMin, i) ?? (i ? t : e.valMin), l = Fn(e.valMax, i) ?? (i ? n : e.valMax), u = Fn(e.valAxisMajorUnit, i), d = i && !(s != null && isFinite(s) && s >= 2) && !(u != null && isFinite(u) && u > 0) ? at(t, n, a, r) : u, f = e.valAxisMinorTickMark != null && e.valAxisMinorTickMark !== "none", p = G({
		dataMin: t,
		dataMax: n,
		explicitMin: c,
		explicitMax: l,
		axisLenPt: r,
		axisOrientation: a,
		majorUnit: d,
		minorUnit: Fn(e.valAxisMinorUnit, i),
		needMinor: e.valAxisMinorGridlines === !0 || f,
		logBase: s,
		reversed: o
	}), { min: m, max: h, majorUnit: g, majorTicks: _ } = p;
	return {
		min: m,
		max: h,
		step: g,
		majorLines: _,
		minorLines: e.valAxisMinorGridlines ? p.minorTicks : [],
		minorTicks: p.minorTicks,
		frac: p.fraction
	};
}
function Hn(e, t) {
	return t && t.trim().toLowerCase() !== "general" ? I(e, t) : pe(Number(e.toPrecision(6)));
}
function Un(e, t, n) {
	if (e.labelText) return e.labelText.split(/\r?\n/);
	if (!t) return [];
	let r = e.labelFormatSourceLinked === !0 ? n : e.labelFormatCode, i = [];
	if (e.dispEq) {
		let e = t.intercept < 0 ? "−" : "+";
		i.push(`y = ${Hn(t.slope, r)}x ${e} ${Hn(Math.abs(t.intercept), r)}`);
	}
	return e.dispRSqr && i.push(`R² = ${Hn(t.rSquared, r)}`), i;
}
function Wn(e, t, n, r, i, a) {
	if (!i) return;
	let o = Un(t, n, a);
	if (o.length === 0) return;
	let { chart: s, chartRect: c, plotRect: l } = i, u = p(t.labelFontSizeHpt, r) ?? p(s.dataLabelFontSizeHpt, r) ?? 10 * r, d = Y(s, t.labelFontFace ?? s.dataLabelFontFace, "minor"), f = t.labelFontBold ?? s.dataLabelFontBold ?? !1, m = t.labelFontItalic ?? !1;
	e.font = Pt(u, d, f, m);
	let h = u * 1.2, g = t.labelFontColor ?? s.dataLabelFontColor, _ = t.labelRichRuns?.length ? J(e, {
		runs: t.labelRichRuns,
		ptToPx: r,
		fontFamily: d,
		fallbackBold: f,
		fallbackItalic: m,
		fallbackBaseline: t.labelFontBaseline ?? void 0,
		fallbackColorHidden: t.labelFontPaintAuthored === !0 && (t.labelFontHidden === !0 || t.labelFontColor == null),
		fontFamilyForFace: (e) => Y(s, e, "minor")
	}, u, g ? `#${g}` : "#595959") : null, v = _?.width ?? Math.max(...o.map((t) => e.measureText(t).width)), y = {
		fontColor: t.labelFontColor ?? void 0,
		fontItalic: m,
		fontPaintAuthored: t.labelFontPaintAuthored ?? void 0,
		fontHidden: t.labelFontHidden ?? void 0,
		fontLanguage: t.labelFontLanguage ?? void 0,
		fontBaseline: t.labelFontBaseline ?? void 0,
		textRotation: t.labelTextRotation ?? void 0,
		textWrap: t.labelTextWrap ?? void 0,
		textVerticalAnchor: t.labelTextVerticalAnchor ?? void 0,
		textVerticalMode: t.labelTextVerticalMode ?? void 0,
		textLInsEmu: t.labelTextLInsEmu ?? void 0,
		textTInsEmu: t.labelTextTInsEmu ?? void 0,
		textRInsEmu: t.labelTextRInsEmu ?? void 0,
		textBInsEmu: t.labelTextBInsEmu ?? void 0,
		textBodyAuthored: t.labelTextBodyAuthored ?? void 0
	}, b = Re(y, r), x = v + b.left + b.right, S = (_?.height ?? o.length * h) + b.top + b.bottom, C = O(x, S, t.labelTextRotation ?? void 0, t.labelTextVerticalMode ?? void 0), w = mt(c, l, C.w, C.h, u, t.labelManualLayout, i.automaticAnchor);
	if (!w) return;
	e.save(), w.automatic && (e.beginPath(), e.rect(l.x, l.y, l.w, l.h), e.clip());
	let T = w.x + w.w / 2, E = w.y + w.h / 2, D = t.labelTextBodyAuthored === !0 || t.labelTextRotation != null || t.labelTextWrap != null || t.labelTextVerticalAnchor != null || t.labelTextVerticalMode != null || t.labelTextLInsEmu != null || t.labelTextTInsEmu != null || t.labelTextRInsEmu != null || t.labelTextBInsEmu != null, k = w.automatic ? {
		x: T - x / 2,
		y: E - S / 2,
		w: x,
		h: S
	} : {
		x: w.x,
		y: w.y,
		w: w.w,
		h: w.h
	};
	Ge(e, Fr(s, t.labelBox, s.chartStyleRoles?.trendlineLabel, !0), k, r, i.shapeRotationDeg ?? 0);
	let A = t.labelTextAlign;
	e.textAlign = A === "r" ? "right" : A === "ctr" ? "center" : "left", e.textBaseline = "top", e.fillStyle = g ? `#${g}` : "#595959";
	let j = Math.max(0, k.w - b.left - b.right), M = Math.max(0, k.h - b.top - b.bottom), N = w.automatic && C.radians === 0 && w.w === C.w && w.h === C.h && (t.labelTextWrap == null || t.labelTextWrap === "none"), ee = _ ? [] : D && !N ? U(o.join("\n"), j, M, h, (t) => e.measureText(t).width, y) : o;
	if (!_ && ee.length === 0) {
		e.restore();
		return;
	}
	let P = D ? e.textAlign === "right" ? k.x + k.w - b.right : e.textAlign === "center" ? k.x + (k.w + b.left - b.right) / 2 : k.x + b.left : e.textAlign === "right" ? w.x + w.w : e.textAlign === "center" ? w.x + w.w / 2 : w.x, te = (t.labelFontBaseline ?? 0) * u, F = D ? t.labelTextVerticalAnchor === "b" ? k.y + k.h - b.bottom - (_?.height ?? ee.length * h) : t.labelTextVerticalAnchor === "ctr" ? k.y + (k.h - (_?.height ?? ee.length * h) + b.top - b.bottom) / 2 : k.y + b.top : w.y, ne = w.automatic ? ee.length : Math.min(ee.length, Math.floor(M / h));
	if (C.radians !== 0 && (e.translate(T, E), e.rotate(C.radians), e.translate(-T, -E)), _) Xe(e, _, P, F, e.textAlign, "top", Math.max(_.width, j));
	else if (!(t.labelFontPaintAuthored === !0 && (t.labelFontHidden === !0 || t.labelFontColor == null))) for (let t = 0; t < ne; t++) e.fillText(D && y.textWrap === "none" ? ee[t] : q(e, ee[t], Math.max(0, j || v)), P, F + t * h - te);
	e.restore();
}
function Gn(e, t, n, r, i, a, o, s, c) {
	let l = t.trendLines;
	if (!l || l.length === 0) return;
	let u = [], d = [];
	for (let e = 0; e < t.values.length; e++) {
		let n = t.values[e], r = o ? o[e] : e;
		n != null && r != null && Number.isFinite(n) && Number.isFinite(r) && (u.push(r), d.push(n));
	}
	if (u.length < 2) return;
	let f = e.getLineDash ? e.getLineDash() : [];
	for (let o of l) {
		let l = K(u, d, o.trendlineType, {
			period: o.period,
			order: o.order,
			intercept: o.intercept,
			forward: o.forward,
			backward: o.backward
		});
		if (l.xs.length < 2 || ![...l.xs, ...l.ys].every(Number.isFinite)) continue;
		let f = o.trendlineType === "linear" ? Ue(u, d, o.intercept) : null, p = f && [
			f.slope,
			f.intercept,
			f.rSquared
		].every(Number.isFinite) ? f : null, m = l.xs, h = l.ys;
		if (o.trendlineType === "linear") {
			let e = (l.ys[1] - l.ys[0]) / (l.xs[1] - l.xs[0] || 1), t = o.backward ?? 0, n = o.forward ?? 0;
			m = [l.xs[0] - t, l.xs[1] + n], h = [l.ys[0] - e * t, l.ys[1] + e * n];
		}
		if (![...m, ...h].every(Number.isFinite)) continue;
		let g = m.map((e, t) => c ? c(e, h[t]) : {
			x: r(e),
			y: i(h[t])
		});
		if (g.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y))) {
			if (!o.lineHidden) {
				s?.clipLineToPlot && (e.save(), e.beginPath(), e.rect(s.plotRect.x, s.plotRect.y, s.plotRect.w, s.plotRect.h), e.clip()), e.strokeStyle = o.lineColor ? `#${o.lineColor}` : n, e.lineWidth = o.lineWidthEmu ? Pe(o.lineWidthEmu, a) : 1.5, e.setLineDash(Mi(o.lineDash ?? void 0, e.lineWidth)), e.beginPath();
				for (let t = 0; t < g.length; t++) {
					let { x: n, y: r } = g[t];
					t === 0 ? e.moveTo(n, r) : e.lineTo(n, r);
				}
				e.stroke(), s?.clipLineToPlot && e.restore();
			}
			Wn(e, o, p, a, s ? {
				...s,
				automaticAnchor: g.at(-1)
			} : void 0, t.valFormatCode);
		}
	}
	e.setLineDash(f);
}
function Kn(e) {
	let t = (e) => {
		switch (e) {
			case "exp": return "Exponential";
			case "log": return "Logarithmic";
			case "poly": return "Polynomial";
			case "power": return "Power";
			case "movingAvg": return "Moving Average";
			default: return "Linear";
		}
	}, n = [];
	for (let r of e) for (let e of r.trendLines ?? []) {
		if (e.lineHidden === !0) continue;
		let i = r.lineColor ?? r.color;
		n.push({
			name: e.name ?? `${t(e.trendlineType)} (${r.name || "Series"})`,
			color: e.lineColor ?? i,
			lineColor: e.lineColor ?? i,
			lineWidthEmu: e.lineWidthEmu,
			lineHidden: !1,
			chartexStyle: { lineDash: e.lineDash },
			values: [],
			seriesType: "line",
			showMarker: !1
		});
	}
	return n;
}
function qn(e) {
	return Ft(e.chartType) || It(e) ? e.series : e.series.flatMap((e) => [e, ...Kn([e])]);
}
function Jn(e, t, n) {
	return p(e, n) ?? Math.max(8, t * .045);
}
function Yn(e, t, n, r = 0) {
	let i = t.trim().split(/\s+/).filter(Boolean);
	if (i.length === 0) return [""];
	let a = [], o = "", s = (t) => {
		let i = o ? `${o} ${t}` : t;
		if (e.measureText(i).width <= n) {
			o = i;
			return;
		}
		if (o &&= (a.push(o), ""), e.measureText(t).width <= n + r) {
			o = t;
			return;
		}
		let s = Array.from(t), c = 0;
		for (; c < s.length;) {
			let t = c + 1, r = s.length, i = c + 1;
			for (; t <= r;) {
				let a = Math.floor((t + r) / 2);
				e.measureText(s.slice(c, a).join("")).width <= n ? (i = a, t = a + 1) : r = a - 1;
			}
			let l = s.slice(c, i).join("");
			c = i, c < s.length ? a.push(l) : o = l;
		}
	};
	for (let e of i) s(e);
	return o && a.push(o), a.length ? a : [""];
}
function Xn(e, t) {
	return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)%?$/.test(e) ? t * .15 : 0;
}
function Zn(e) {
	return e.catAxisTickLabelPos !== "none";
}
var Qn = 54e5;
function $n(e) {
	let t = e.catAxisLabelRotation;
	return t == null || t === 0 || Math.abs(t) > Qn ? 0 : t / 6e4 * (Math.PI / 180);
}
function er(e, t, n, r, i) {
	if (i === 0) {
		e.fillText(t, n, r);
		return;
	}
	e.save(), e.translate(n, r), e.rotate(i), e.textAlign = "right", e.textBaseline = "middle", e.fillText(t, 0, 0), e.restore();
}
function tr(e, t, n = Nn(e)) {
	return e.catAxisIsDate === !0 ? pt({
		categories: t,
		date1904: e.date1904,
		baseTimeUnit: e.catAxisBaseTimeUnit,
		majorTimeUnit: e.catAxisMajorTimeUnit,
		majorUnit: e.catAxisMajorUnit,
		minorTimeUnit: e.catAxisMinorTimeUnit,
		minorUnit: e.catAxisMinorUnit,
		explicitMin: e.catAxisMin,
		explicitMax: e.catAxisMax,
		crossBetween: ce(e),
		reversed: n
	}) : null;
}
function nr(e, t, n, r) {
	for (let i of e.errBars ?? []) {
		if (i.dir !== t) continue;
		let a = i.barType === "plus" || i.barType === "both", o = i.barType === "minus" || i.barType === "both", s = Math.max(e.values.length, i.plus.length, i.minus.length);
		for (let e = 0; e < s; e++) {
			let t = n(e);
			if (t == null || !Number.isFinite(t)) continue;
			let s = i.plus[e], c = i.minus[e];
			a && s != null && Number.isFinite(s) && r(t + s), o && c != null && Number.isFinite(c) && r(t - c);
		}
	}
}
function rr(e, t, n, r = "y", i = !1, a = !1, o = (e) => e.useSecondaryAxis === !0, s = () => null) {
	if (!e) return null;
	let c = Infinity, l = -Infinity, u = (e) => {
		Number.isFinite(e) && (c = Math.min(c, e), l = Math.max(l, e));
	};
	a && u(0);
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		if (o(n, e)) {
			for (let t = 0; t < n.values.length; t++) {
				let r = s(n, t, e) ?? n.values[t];
				r != null && u(r);
			}
			nr(n, r, (t) => s(n, t, e) ?? n.values[t] ?? null, u);
		}
	}
	(!Number.isFinite(c) || !Number.isFinite(l)) && (c = 0, l = 1);
	let d = G({
		dataMin: c,
		dataMax: l,
		explicitMin: Fn(e.min, i),
		explicitMax: Fn(e.max, i),
		axisLenPt: n,
		axisOrientation: "vertical",
		majorUnit: Fn(e.majorUnit, i),
		minorUnit: Fn(e.minorUnit, i),
		needMinor: e.minorGridlines === !0 || e.minorTickMark != null && e.minorTickMark !== "none",
		logBase: e.logBase,
		reversed: e.orientation === "maxMin"
	}), { min: f, max: p, majorUnit: m } = d;
	return {
		min: f,
		max: p,
		step: m,
		majorLines: d.majorTicks,
		minorTicks: d.minorTicks,
		makeToY: (e, t) => (n) => e + t - d.fraction(n) * t
	};
}
function ir(e, t, n, r, i, a, o) {
	if (!t.hidden) {
		if (e.save(), t.minorGridlines) {
			let s = En(t, o);
			for (let t of n.minorTicks) Cn(e, i, a, r(t), !1, s);
		}
		if (t.majorGridlines) {
			let s = Dn(t, o);
			for (let t of n.majorLines) Cn(e, i, a, r(t), !1, s);
		}
		e.restore();
	}
}
function ar(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h = !1) {
	let g = o + c, { color: _, width: v } = ue(n.lineColor, n.lineWidthEmu, u);
	if (n.lineHidden || bn(e, g, s, g, s + l, _, v, n.lineDash), !n.hidden) {
		e.font = `${n.fontItalic ? "italic " : ""}${n.fontBold ? "bold " : ""}${d}px ${Y(t, n.fontFace, "minor")}`, e.fillStyle = n.fontColor ? `#${n.fontColor}` : p, e.textAlign = "left", e.textBaseline = "middle";
		for (let t of r.majorLines) {
			let r = i(t);
			yn(e, n.majorTickMark, "val", g, r, _, v, !0, n.lineHidden, "major", u, n.lineDash), n.tickLabelPos !== "none" && e.fillText(Rn(h ? t / 100 : t, n.formatCode ?? null, m, n.displayUnits), g + 14, r);
		}
		if (n.minorTickMark && n.minorTickMark !== "none") for (let t of r.minorTicks) yn(e, n.minorTickMark, "val", g, i(t), _, v, !0, n.lineHidden, "minor", u, n.lineDash);
	}
	n.title && or(e, t, n, a, o, s, c, l, f, u);
}
function or(e, t, n, r, i, a, o, s, c, l) {
	if (!n.title) return;
	let u = he(n.titleFontSizeHpt, l), d = n.titleFontColor ? `#${n.titleFontColor}` : n.fontColor ? `#${n.fontColor}` : "#555";
	Rt(e, n.title, i + o + c + u * .6, a + s / 2, "right", u, n.titleFontBold ?? !0, n.titleFontItalic ?? !1, d, s, Y(t, n.titleFontFace, "major"), n.titleRotation, n.titleVerticalMode, n.titleManualLayout, r);
}
function sr(e, t, n, r, i, a, o, s, c) {
	if (n.hidden || r.length === 0) return;
	let { color: l, width: u } = ue(n.lineColor, n.lineWidthEmu, c);
	n.lineHidden || bn(e, a, o, a + s, o, l, u, n.lineDash);
	let d = n.orientation === "maxMin", f = Math.max(1, Math.floor(n.tickLabelSkip ?? 1)), m = Math.max(1, Math.floor(n.tickMarkSkip ?? 1)), h = r.length, g = (e) => te(e, h, ce(t), d, n.labelAlignment);
	if (!n.lineHidden && n.majorTickMark !== "none") {
		let r = ce(t), i = r ? h : h - 1;
		for (let t = 0; t <= i; t += m) {
			let f = d ? i - t : t, p = r ? f / h : h === 1 ? .5 : f / (h - 1);
			yn(e, n.majorTickMark, "cat", o, a + p * s, l, u, !0, n.lineHidden, "major", c, n.lineDash);
		}
	}
	let _ = p(n.fontSizeHpt, c) ?? 9 * c;
	if (n.tickLabelPos !== "none") {
		e.font = Pt(_, Y(t, n.fontFace, "minor"), n.fontBold ?? !1, n.fontItalic ?? !1), e.fillStyle = n.fontColor ? `#${n.fontColor}` : "#555", e.textBaseline = "bottom";
		let i = Math.max(1, s / h - 4), c = P(v(_), n.labelOffsetPercent);
		for (let l = 0; l < h; l += f) {
			let u = g(l);
			e.textAlign = u.textAlign, e.fillText(q(e, Ae(r[l], n.formatCode, t.date1904), i), a + u.fraction * s, o - c);
		}
	}
	if (n.title) {
		let r = he(n.titleFontSizeHpt, c);
		Rt(e, n.title, a + s / 2, o - (n.tickLabelPos === "none" ? 0 : _ + P(v(_), n.labelOffsetPercent)) - r / 2 - 4, "horizontal", r, n.titleFontBold ?? !0, n.titleFontItalic ?? !1, n.titleFontColor ? `#${n.titleFontColor}` : "#555", s, Y(t, n.titleFontFace, "major"), n.titleRotation, n.titleVerticalMode, n.titleManualLayout, i);
	}
}
function cr(e, t, n) {
	let r = n / (e.titleFontSizeHpt != null && e.titleFontSizeHpt >= 100 && e.titleFontSizeHpt <= 4e5 ? e.titleFontSizeHpt / 100 : 14), i = p(t.fontSizeHpt, r) ?? n, a = Nt(e, t.fontFace ?? e.titleFontFace);
	return {
		font: Pt(i, a ? `"${a}", Calibri, Arial, sans-serif` : "Calibri, Arial, sans-serif", t.bold ?? (e.titleRichRuns?.length ? !1 : e.titleFontBold ?? !0), t.italic ?? !1),
		fontSize: i,
		color: t.color ? `#${t.color}` : e.titleFontColor ? `#${e.titleFontColor}` : "#333"
	};
}
function lr(e, t, n, r) {
	let i = t.titleRichRuns?.length ? t.titleRichRuns : t.title ? [{ text: t.title }] : [], a = [{
		pieces: [],
		width: 0,
		height: r
	}], o = () => {
		let e = {
			pieces: [],
			width: 0,
			height: r
		};
		return a.push(e), e;
	}, s = a[0];
	for (let a of i) {
		let i = cr(t, a, r);
		for (let t of a.text.split(/(\n|[\t ]+)/).filter((e) => e.length > 0)) {
			if (t === "\n") {
				s = o();
				continue;
			}
			e.font = i.font;
			let r = e.measureText(t).width, a = /^[\t ]+$/.test(t);
			!a && s.pieces.length > 0 && s.width + r > n && (s = o()), !(a && s.pieces.length === 0) && (s.pieces.push({
				text: t,
				width: r,
				font: i.font,
				color: i.color
			}), s.width += r, s.height = Math.max(s.height, i.fontSize));
		}
	}
	return a;
}
function ur(e, t, n, r, i) {
	let a = l(t, r, i);
	if (a.bandH === 0 || !t.titleRichRuns?.length) return a;
	let o = e.font, s = lr(e, t, Math.max(1, n), a.fontPx);
	e.font = o;
	let c = s.reduce((e, t) => e + t.height, 0);
	return {
		...a,
		bandH: a.topPad + c + a.bottomPad
	};
}
function dr(e, t, n, r, i, a) {
	if (!t.title) return;
	if (!t.titleRichRuns?.length) {
		let o = Nt(t, t.titleFontFace), s = o ? `"${o}", Calibri, Arial, sans-serif` : "Calibri, Arial, sans-serif";
		e.font = `${t.titleFontBold ?? !0 ? "bold " : ""}${a}px ${s}`, e.fillStyle = t.titleFontColor ? `#${t.titleFontColor}` : "#333", e.textAlign = "center", e.textBaseline = "top", e.fillText(t.title, n + i / 2, r);
		return;
	}
	e.save();
	let o = lr(e, t, Math.max(1, i), a);
	e.textAlign = "left", e.textBaseline = "top";
	let s = r;
	for (let t of o) {
		let r = n + (i - t.width) / 2;
		for (let n of t.pieces) e.font = n.font, e.fillStyle = n.color, e.fillText(n.text, r, s), r += n.width;
		s += t.height;
	}
	e.restore();
}
function fr(e, t, n, r, i, a, o, s) {
	if (!t.title) return;
	let c = t.titleManualLayout;
	if (c) {
		let l = Nt(t, t.titleFontFace), u = l ? `"${l}", Calibri, Arial, sans-serif` : "Calibri, Arial, sans-serif";
		e.font = `${t.titleFontBold ?? !0 ? "bold " : ""}${s}px ${u}`;
		let d = lr(e, t, Math.max(1, i), s), f = Math.min(i, Math.max(...d.map((e) => e.width), 0)), p = {
			x: n + (i - f) / 2,
			y: o,
			w: f,
			h: s
		}, m = _({
			...c,
			w: void 0,
			h: void 0
		}, {
			x: n,
			y: r,
			w: i,
			h: a
		}, p);
		if (m) {
			dr(e, t, m.x, m.y, m.w, s);
			return;
		}
	}
	dr(e, t, n, o, i, s);
}
function pr(e) {
	if (e.categories.length > 0) return e.categories;
	let t = e.series[0];
	if (t?.categories && t.categories.length > 0) return t.categories;
	let n = 0;
	for (let t of e.series) t.values.length > n && (n = t.values.length);
	return n > 0 ? Array.from({ length: n }, (e, t) => String(t + 1)) : [];
}
function mr(e, t) {
	let n = Math.max(e.x, t.x), r = Math.max(e.y, t.y), i = Math.min(e.x + e.w, t.x + t.w), a = Math.min(e.y + e.h, t.y + t.h);
	return i > n && a > r ? {
		x: n,
		y: r,
		w: i - n,
		h: a - r
	} : null;
}
function hr(e, t, n) {
	return e.showDataLabelsOverMax === !0 || !Number.isFinite(n) || t <= n;
}
function gr(e, t, n, r, i, a, o, s, c, l, u, d, f, p = !1, m, h, g, _ = 1, v, y = 0) {
	Oi(e, t, {
		kind: "bar",
		rect: o === "vertical" ? {
			x: n,
			y: r,
			w: a,
			h: i
		} : {
			x: n,
			y: r,
			w: i,
			h: a
		},
		orientation: o,
		negative: p,
		position: s ?? "outEnd"
	}, u, l, c ? `#${c}` : "#333", f, d, m, h, g, _, v, y);
}
function _r(e) {
	return 7 * e;
}
function vr(e, r, i, a, o = {}, s = 0) {
	let { x: c, y: l, w: u, h: d } = i, f = r.chartType === "clusteredBarH" || r.chartType === "stackedBarH" || r.chartType === "stackedBarHPct", h = r.chartType.startsWith("stacked"), g = r.chartType === "stackedBarPct" || r.chartType === "stackedBarHPct", _ = r.series.filter((e) => e.seriesType !== "line" && e.seriesType !== "scatter" && e.seriesType !== "area"), y = (e) => e.barGroupDirection == null ? f : e.barGroupDirection === "bar", x = _, S = (e) => e.useSecondaryAxis === !0 ? "secondary-default" : "primary-default", C = (e) => e.barGroupIndex == null ? S(e) : `group-${e.barGroupIndex}`, w = (e) => e.barGroupGrouping ?? (g ? "percentStacked" : h ? "stacked" : "clustered"), E = (e) => {
		let t = w(e);
		return t === "stacked" || t === "percentStacked";
	}, D = (e) => w(e) === "percentStacked", O = r.series.filter((e) => e.seriesType === "line"), k = r.series.filter((e) => e.seriesType === "area"), A = r.series.filter((e) => e.seriesType === "scatter"), M = new Map(r.series.map((e, t) => [e, t])), ee = /* @__PURE__ */ new Map();
	for (let e of r.plotGroups ?? []) for (let t = e.seriesStart; t < e.seriesStart + e.seriesCount; t++) {
		let n = r.series[t];
		n && ee.set(n, e);
	}
	let F = /* @__PURE__ */ new Map();
	for (let e of r.plotGroups ?? []) {
		if (e.seriesCount === 0) continue;
		let t = F.get(e.valueAxis) ?? {
			count: 0,
			percentCount: 0
		};
		t.count++, e.grouping === "percentStacked" && t.percentCount++, F.set(e.valueAxis, t);
	}
	let ne = (e) => {
		let t = F.get(e.valueAxis);
		return t != null && t.count === t.percentCount;
	}, re = Xt(r, a), ie = r.series.some((e) => e.useSecondaryAxis === !0), I = !f && r.secondaryValAxis && ie ? r.secondaryValAxis : null, L = I ? x.filter((e) => e.useSecondaryAxis === !0) : [], ae = I ? x.filter((e) => e.useSecondaryAxis !== !0) : x, R = L.length > 0 ? r.secondaryCatAxis : null, oe = L[0]?.categories?.length ? L[0].categories : r.categories, le = pr(r), z = le.length;
	if (z === 0) return;
	let de = /* @__PURE__ */ new Map();
	for (let e of x) {
		let t = C(e), n = de.get(t);
		n ? n.push(e) : de.set(t, [e]);
	}
	let B = (e) => de.get(C(e)) ?? [e], fe = /* @__PURE__ */ new Map();
	for (let [e, t] of de) {
		let n = Array(z).fill(0);
		for (let e of t) for (let t = 0; t < z; t++) n[t] += Math.abs(e.values[t] ?? 0);
		fe.set(e, n);
	}
	let pe = (e, t) => fe.get(C(e))?.[t] || 1, me = (e) => {
		let t = ee.get(e);
		return t == null || ne(t) ? 100 : 1;
	}, ge = (e, t) => D(e) ? me(e) / pe(e, t) : 1, _e = /* @__PURE__ */ new Map(), ye = /* @__PURE__ */ new Map();
	for (let e of [...O, ...k]) _e.set(e, Array.from({ length: z }, (t, n) => e.values[n] ?? 0)), ye.set(e, Array(z).fill(0));
	for (let e of r.plotGroups ?? []) {
		if (e.kind !== "line" && e.kind !== "area") continue;
		let t = r.series.slice(e.seriesStart, e.seriesStart + e.seriesCount), n = e.grouping === "stacked" || e.grouping === "percentStacked", i = e.grouping === "percentStacked", a = i && ne(e) ? 100 : 1;
		for (let e = 0; e < z; e++) {
			let r = i && t.reduce((t, n) => t + Math.abs(n.values[e] ?? 0), 0) || 1, o = 0;
			for (let s of t) {
				let t = s.values[e] ?? 0, c = i ? t / r * a : t, l = ye.get(s), u = _e.get(s);
				l == null || u == null || (l[e] = n ? o : 0, o = n ? o + c : c, u[e] = o);
			}
		}
	}
	let xe = (e, t) => _e.get(e)?.[t] ?? e.values[t] ?? 0, Se = (e, t) => ye.get(e)?.[t] ?? 0, Ce = (e) => D(e) ? (e.errBars ?? []).map((t) => ({
		...t,
		plus: t.plus.map((t, n) => t == null ? t : t * ge(e, n)),
		minus: t.minus.map((t, n) => t == null ? t : t * ge(e, n))
	})) : e.errBars ?? [], we = It(r), Ee = x.map((e) => new Map((e.dataPointOverrides ?? []).map((e) => [e.idx, e]))), Oe = x.map((e) => new Map((e.dataLabelOverrides ?? []).map((e) => [e.idx, e]))), je = x.map((e, t) => Li(e, t)), V = r.chartexDataPointStyle != null || r.chartexColorPalette != null, Fe = /* @__PURE__ */ new Map();
	V && x.forEach((e, t) => {
		let n = je[t], i = e.color ?? Hi(r, n, x.length, e.chartexStyle);
		Fe.set(e, $i(r, e.name, e, r.chartexDataPointStyle, n, x.length, i));
	});
	let H = {
		...r,
		series: (V ? x : r.series).map((e) => Fe.get(e) ?? e)
	}, U = ur(e, r, u, d, a), Le = U.fontPx, Re = U.topPad, ze = U.bandH, Be = Jn(r.catAxisFontSizeHpt, d, a), W = Jn(r.valAxisFontSizeHpt, d, a), He = !f && !Vt(r) && r.catAxisNoMultiLevelLabels !== !0 && (r.categoryLevels?.length ?? 0) > 1 ? r.categoryLevels : null, Ue = He ? (He.length - 1) * (Be + 4) : 0, Ge = Vt(r), K = Ut(r, a), Ke = Wt(e, r, a), qe = mn(e, H, u, d, .22, a), { legRightW: Je, legLeftW: Ye, legTopH: J, legBottomH: Xe } = Ve(qe, r.legendOverlay === !0), Ze = T(r, u, d, a), Qe = Ze.catFontPx, $e = Ze.valFontPx, et = f ? r.valAxisTitle ? $e + b(d) + 4 : 0 : Ze.catBandH, tt = f ? r.catAxisTitle ? Qe + b(u) + 4 : 0 : Ze.valBandW, nt = p(R?.fontSizeHpt, a) ?? 9 * a, rt = R && !R.hidden && R.tickLabelPos !== "none" ? nt + P(v(nt), R.labelOffsetPercent) + 2 : 0, it = R?.title ? he(R.titleFontSizeHpt, a) + 6 : 0, at = ze + J + W / 2 + 2 + rt + it, st = f ? (r.valAxisHidden ? d * .02 : m(W)) + K + et + Xe : (Ge ? 0 : m(Be, r.catAxisLabelOffsetPercent)) + Ue + K + et + Xe, ct = d - at - st, lt = 0;
	if (f && !r.catAxisHidden && Zn(r)) {
		let t = r.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, ct / z * .5)) : Be;
		e.save(), e.font = Pt(t, Y(r, r.catAxisFontFace, "minor"), r.catAxisFontBold ?? !1, r.catAxisFontItalic ?? !1);
		for (let t of le) lt = Math.max(lt, e.measureText(Ae(t, r.catAxisFormatCode, r.date1904)).width);
		e.restore(), lt += P(r.catAxisFontSizeHpt == null ? 4 : ke(t), r.catAxisLabelOffsetPercent) + n * a;
	}
	let ut = Math.min(lt, Math.max(0, u / 2 - tt - Ye)), dt = f ? u - ((r.catAxisHidden ? u * .03 : ut) + tt + Ye) - (Je + u * .03) : 0, ft = r.valAxisHidden ? void 0 : (f ? dt : ct) / a, pt = (e, t) => {
		let n = x[e], r = n?.values[t] ?? 0;
		if (!n || !E(n)) return r;
		let i = B(n), a = D(n), o = 1;
		a && (o = i.reduce((e, n) => e + Math.abs(n.values[t] ?? 0), 0) || 1);
		let s = a ? ge(n, t) * o : 1, c = a ? r / o * s : r, l = 0, u = i.indexOf(n);
		for (let e = 0; e <= u; e++) {
			let n = i[e]?.values[t] ?? 0, r = a ? n / o * s : n;
			c < 0 == r < 0 && (l += r);
		}
		return l;
	}, mt = (r.plotGroups ?? []).filter((e) => e.seriesCount > 0 && e.valueAxis !== "secondary"), ht = mt.length > 0 ? mt.every((e) => e.grouping === "percentStacked") : ae.some(D), gt = 0, _t = 0;
	for (let e = 0; e < z; e++) {
		let t = /* @__PURE__ */ new Map();
		for (let e of ae) {
			let n = C(e), r = t.get(n);
			r ? r.push(e) : t.set(n, [e]);
		}
		for (let n of t.values()) {
			let t = n[0], r = E(t), i = D(t), a = i && n.reduce((t, n) => t + Math.abs(n.values[e] ?? 0), 0) || 1, o = 0, s = 0;
			for (let t of n) {
				let n = t.values[e] ?? 0, c = i ? n / a * me(t) : n;
				r ? c >= 0 ? o += c : s += c : (gt = Math.max(gt, c), _t = Math.min(_t, c));
			}
			r && (gt = Math.max(gt, o), _t = Math.min(_t, s));
		}
	}
	for (let e of [...O, ...k]) if (!(I && e.useSecondaryAxis === !0)) for (let t = 0; t < z; t++) {
		if (e.values[t] == null) continue;
		let n = xe(e, t);
		gt = Math.max(gt, n), _t = Math.min(_t, n);
	}
	for (let e of ae) {
		let t = x.indexOf(e);
		for (let n of Ce(e)) nr({
			...e,
			errBars: [n]
		}, f ? "x" : "y", (n) => e.values[n] == null ? null : pt(t, n), (e) => {
			gt = Math.max(gt, e), _t = Math.min(_t, e);
		});
	}
	for (let e of [...O, ...k]) I && e.useSecondaryAxis === !0 || nr(e, "y", (t) => e.values[t] ?? null, (e) => {
		let t = e;
		gt = Math.max(gt, t), _t = Math.min(_t, t);
	});
	ht && (ae.some((e) => e.values.some((e) => e != null && e > 0)) && (gt = Math.max(gt, 100)), ae.some((e) => e.values.some((e) => e != null && e < 0)) && (_t = Math.min(_t, -100))), r.valMax != null && (gt = ht ? r.valMax * 100 : r.valMax), r.valMin != null && (_t = ht ? r.valMin * 100 : r.valMin), gt === 0 && _t === 0 && (gt = 1);
	let vt = Vn(r, _t, gt, ft, ht, f ? "horizontal" : "vertical"), { step: yt } = vt, bt = new Set(x), xt = new Set(_), St = (r.plotGroups ?? []).filter((e) => e.seriesCount > 0 && e.valueAxis === "secondary"), Ct = St.length > 0 ? St.every((e) => e.grouping === "percentStacked") : L.some(D), wt = r.series.filter((e) => !xt.has(e) || bt.has(e)).map((e) => {
		if (e.useSecondaryAxis !== !0) return e;
		if (bt.has(e)) {
			let t = x.indexOf(e);
			return {
				...e,
				values: e.values.map((e, n) => e == null ? e : pt(t, n)),
				errBars: Ce(e)
			};
		}
		return Ct ? {
			...e,
			values: e.values.map((e) => e == null ? e : e * 100),
			errBars: (e.errBars ?? []).map((e) => ({
				...e,
				plus: e.plus.map((e) => e == null ? e : e * 100),
				minus: e.minus.map((e) => e == null ? e : e * 100)
			}))
		} : e;
	});
	if (Ct && L[0]) {
		let e = [];
		L.some((e) => e.values.some((e) => e != null && e > 0)) && e.push(100), L.some((e) => e.values.some((e) => e != null && e < 0)) && e.push(-100), wt.push({
			...L[0],
			values: e,
			errBars: []
		});
	}
	let Tt = rr(I, wt, ct / a, f ? "x" : "y", Ct, L.length > 0), Et = Math.max(8, Math.min(11, d / 20)), Dt = r.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, ct / 20)) : W, Ot = e.font, kt = 0, Nt = 0;
	if (!f && !r.valAxisHidden) {
		e.font = Pt(Dt, Y(r, r.valAxisFontFace, "minor"), r.valAxisFontBold ?? !1, r.valAxisFontItalic ?? !1);
		let t = 0;
		for (let n of vt.majorLines) {
			let i = In(r, n, ht);
			t = Math.max(t, e.measureText(i).width);
		}
		kt = t, Nt = kt + 16;
	}
	let Ft = p(I?.fontSizeHpt, a) ?? Et, Lt = 0;
	if (I && !I.hidden) {
		e.font = `${Ft}px ${Y(r, I.fontFace, "minor")}`;
		let t = 0;
		for (let n of Tt?.majorLines ?? []) t = Math.max(t, e.measureText(Rn(Ct ? n / 100 : n, I.formatCode ?? null, r.date1904, I.displayUnits)).width);
		Lt = t + 18;
	}
	e.font = Ot;
	let Rt = I && I.title ? he(I.titleFontSizeHpt, a) + 8 : 0, zt = {
		t: at,
		r: Je + u * .03 + Lt + Rt,
		b: st,
		l: f ? Ye + Math.max((r.catAxisHidden ? u * .03 : ut) + tt, Ke) : Ye + Math.max(tt + Nt, Ke)
	};
	zt.t = vn(r, qe, c, l, u, d, ze, zt.t);
	let Ht = f ? {
		t: 0,
		r: r.valAxisHidden ? 0 : Dt / 2,
		b: r.valAxisHidden ? 0 : Dt + et,
		l: r.catAxisHidden ? 0 : lt + tt
	} : j({
		valAxisHidden: r.valAxisHidden,
		catAxisHidden: r.catAxisHidden,
		valLabelWidth: kt,
		valLabelFontPx: Dt,
		catLabelFontPx: Be,
		valLabelGapPx: r.valAxisFontSizeHpt == null ? 12 : ke(Dt),
		catLabelGapPx: r.catAxisFontSizeHpt == null ? P(3, r.catAxisLabelOffsetPercent) : P(v(Be), r.catAxisLabelOffsetPercent),
		outerTextMarginPx: n * a,
		valTitleBandW: tt,
		catTitleBandH: et,
		secondaryBandW: Lt + Rt
	}), qt = N(r, c, l, u, d, a, {
		titleBand: U,
		legendSideReserveFrac: .22,
		legendReserve: qe,
		pad: zt,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: Ht
	}), Jt = ur(e, r, qt.plotRect.pw, d, a);
	Math.abs(Jt.bandH - U.bandH) > .01 && (U = Jt, Le = U.fontPx, Re = U.topPad, ze = U.bandH, at = ze + J + W / 2 + 2 + rt + it, zt.t = vn(r, qe, c, l, u, d, ze, at), qt = N(r, c, l, u, d, a, {
		titleBand: U,
		legendSideReserveFrac: .22,
		legendReserve: qe,
		pad: zt,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: Ht
	}));
	let { px0: X, py0: Z, pw: Q } = qt.plotRect, { ph: $ } = qt.plotRect;
	if (fr(e, r, r.titleManualLayout || !r.titleRichRuns?.length ? c : X, l, r.titleManualLayout || !r.titleRichRuns?.length ? u : Q, d, l + Re, Le), Q <= 0 || $ <= 0) return;
	let Yt = tr(r, le, f ? !Nn(r) : Nn(r)), Zt = $n(r), Qt = [], $t = 0;
	if (!Ge && !f && !Yt && !r.catAxisHidden && Zn(r) && Zt === 0) {
		let t = Q / z, n = r.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, t * .5)) : Be;
		e.save(), e.font = Pt(n, Y(r, r.catAxisFontFace, "minor"), r.catAxisFontBold ?? !1, r.catAxisFontItalic ?? !1);
		for (let i of le) {
			let a = Ae(i, r.catAxisFormatCode, r.date1904);
			Qt.push(Yn(e, a, Math.max(1, t), Xn(a, n)));
		}
		e.restore();
		let i = Math.max(1, ...Qt.map((e) => e.length));
		!(r.plotAreaManualLayout?.layoutTarget === "inner" && r.plotAreaManualLayout.w != null && r.plotAreaManualLayout.h != null) && i > 1 && ($t = (i - 1) * (n + 2), $ = Math.max(1, $ - $t));
	}
	let en = Ge ? Gt(e, r, Q / z, a) : null;
	en && en.totalHeight > K && ($ = Math.max(1, $ - (en.totalHeight - K))), Ne(e, r, X, Z, Q, $, a, s);
	let tn = (e) => Z + $ - vt.frac(e) * $, nn = (e) => X + vt.frac(e) * Q, rn = tn(0), an = nn(0), on = (e) => tn(e), sn = Tt ? Tt.makeToY(Z, $) : tn, cn = (e) => sn(e), ln = wn(r, a);
	e.textBaseline = "middle";
	let un = r.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, $ / 20)) : W;
	e.font = Pt(un, Y(r, r.valAxisFontFace, "minor"), r.valAxisFontBold ?? !1, r.valAxisFontItalic ?? !1);
	let dn = r.valAxisFontColor ? `#${r.valAxisFontColor}` : "#555";
	if (e.fillStyle = dn, !r.valAxisHidden) {
		let t = Tn(r, a);
		for (let n of vt.minorLines) if (!f) Cn(e, X, Q, tn(n), !1, t);
		else {
			let r = nn(n);
			e.strokeStyle = t.color, e.lineWidth = t.width;
			let i = t.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
			t.dash.length > 0 && e.setLineDash(t.dash), e.beginPath(), e.moveTo(r, Z), e.lineTo(r, Z + $), e.stroke(), t.dash.length > 0 && e.setLineDash(i);
		}
		let n = Pn(r), i = r.valAxisTickLabelPos !== "none";
		for (let t of vt.majorLines) {
			let s = Math.abs(t) < yt * 1e-9, c = In(r, t, ht);
			if (f) {
				let a = nn(t);
				if (n) {
					e.strokeStyle = ln.explicit ? ln.color : s ? "#aaa" : ln.color, e.lineWidth = ln.explicit ? ln.width : s ? 1 : ln.width;
					let t = ln.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
					ln.dash.length > 0 && e.setLineDash(ln.dash), e.beginPath(), e.moveTo(a, Z), e.lineTo(a, Z + $), e.stroke(), ln.dash.length > 0 && e.setLineDash(t);
				}
				if (i) {
					e.textAlign = "center";
					let t = r.valAxisFontSizeHpt == null ? 10 : v(un);
					e.fillText(c, a, Z + $ + t);
				}
			} else {
				let l = tn(t);
				if (n && Cn(e, X, Q, l, s, ln), i) {
					e.textAlign = "right";
					let t = o.gapPolicy === "chartex" ? _r(a) : r.valAxisFontSizeHpt == null ? 12 : ke(un);
					e.fillText(c, X - t, l);
				}
			}
		}
	}
	if (I && Tt && ir(e, I, Tt, sn, X, Q, a), !r.catAxisHidden && On(r)) {
		let t = kn(r, a);
		e.strokeStyle = t.color, e.lineWidth = t.width;
		let n = t.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
		t.dash.length > 0 && e.setLineDash(t.dash);
		let i = Yt ? Yt.majorTicks.map((e) => e.fraction) : jn(r, z);
		for (let t of i) {
			if (e.beginPath(), f) {
				let n = Z + t * $;
				e.moveTo(X, n), e.lineTo(X + Q, n);
			} else {
				let n = X + t * Q;
				e.moveTo(n, Z), e.lineTo(n, Z + $);
			}
			e.stroke();
		}
		t.dash.length > 0 && e.setLineDash(n);
	}
	let { color: fn, width: pn } = ue(r.catAxisLineColor, r.catAxisLineWidthEmu, a), { color: hn, width: gn } = ue(r.valAxisLineColor, r.valAxisLineWidthEmu, a), Sn = !r.catAxisHidden && !r.catAxisLineHidden, En = !r.valAxisHidden && !r.valAxisLineHidden && r.valAxisLineColor != null, Dn = Kr(r, vt.min, vt.max), An = f ? Z + $ : tn(Dn), Mn = f ? nn(Dn) : X, Fn = !f && (r.catAxisTickLabelPos ?? "nextTo") === "nextTo" ? An : Z + $, Ln = Math.max(1, Math.floor(r.catAxisTickMarkSkip ?? 1)), zn = !f && He != null && Yt == null && !r.catAxisLineHidden && ce(r) && Math.abs(Fn - An) < .01, Bn = () => {
		if (f ? (Sn && bn(e, Mn, Z, Mn, Z + $, fn, pn, r.catAxisLineDash), En && bn(e, X, Z + $, X + Q, Z + $, hn, gn, r.valAxisLineDash)) : (Sn && bn(e, X, An, X + Q, An, fn, pn, r.catAxisLineDash), En && bn(e, X, Z, X, Z + $, hn, gn, r.valAxisLineDash)), !r.valAxisHidden && r.valAxisMajorTickMark && r.valAxisMajorTickMark !== "none") for (let t of vt.majorLines) f ? yn(e, r.valAxisMajorTickMark, "cat", Z + $, nn(t), hn, gn, !1, r.valAxisLineHidden, "major", a, r.valAxisLineDash) : yn(e, r.valAxisMajorTickMark, "val", X, tn(t), hn, gn, !1, r.valAxisLineHidden, "major", a, r.valAxisLineDash);
		if (!r.valAxisHidden && r.valAxisMinorTickMark && r.valAxisMinorTickMark !== "none") for (let t of vt.minorTicks) f ? yn(e, r.valAxisMinorTickMark, "cat", Z + $, nn(t), hn, gn, !1, r.valAxisLineHidden, "minor", a, r.valAxisLineDash) : yn(e, r.valAxisMinorTickMark, "val", X, tn(t), hn, gn, !1, r.valAxisLineHidden, "minor", a, r.valAxisLineDash);
		if (!r.catAxisHidden && r.catAxisMajorTickMark && r.catAxisMajorTickMark !== "none") {
			let t = zn ? [] : jn(r, z), n = Yt ? Yt.majorTicks.map((e) => e.fraction) : t.filter((e, t) => t % Ln === 0);
			for (let t of n) f ? yn(e, r.catAxisMajorTickMark, "val", Mn, Z + t * $, fn, pn, !1, r.catAxisLineHidden, "major", a, r.catAxisLineDash) : yn(e, r.catAxisMajorTickMark, "cat", An, X + t * Q, fn, pn, !1, r.catAxisLineHidden, "major", a, r.catAxisLineDash);
		}
		if (!r.catAxisHidden && r.catAxisMinorTickMark && r.catAxisMinorTickMark !== "none") {
			let t = ce(r) ? Array.from({ length: z }, (e, t) => (t + .5) / z) : Array.from({ length: Math.max(0, z - 1) }, (e, t) => (t + .5) / (z - 1)), n = Yt ? Yt.minorTicks.map((e) => e.fraction) : t;
			for (let t of n) f ? yn(e, r.catAxisMinorTickMark, "val", Mn, Z + t * $, fn, pn, !1, r.catAxisLineHidden, "minor", a, r.catAxisLineDash) : yn(e, r.catAxisMinorTickMark, "cat", An, X + t * Q, fn, pn, !1, r.catAxisLineHidden, "minor", a, r.catAxisLineDash);
		}
	}, Hn = (e) => e ? $ / z : Q / z, Un = Hn(f), Wn = Nn(r), qn = (e, t) => t ? Wn ? e : z - 1 - e : Wn ? z - 1 - e : e, Qn = (e, t = f) => Yt ? Yt.categoryBandFractions[e] * (t ? $ : Q) : Hn(t), or = (e, t = f) => Yt ? (t ? Z : X) + Yt.positions[e] * (t ? $ : Q) - Qn(e, t) / 2 : (t ? Z : X) + qn(e, t) * Hn(t), cr = (e) => Yt ? X + Yt.positions[e] * Q : X + qn(e, !1) * Hn(!1) + Hn(!1) / 2, lr = (e, n) => {
		let i = e[0], a = i ? E(i) : h, s = a ? 1 : Math.max(1, e.length), c = i?.barGroupOverlap ?? r.barOverlap ?? 0, l = a || !Number.isFinite(c) ? 0 : Math.max(-100, Math.min(100, c)), u = t(i?.barGroupGapWidth ?? r.barGapWidth, o.gapPolicy ?? "legacy"), d = n / (1 + (s - 1) * (1 - l / 100) + u / 100), f = a ? 0 : d * (1 - l / 100);
		return {
			barW: d,
			clusterGap: f,
			catStart: (n - (d + (s - 1) * f)) / 2
		};
	}, dr = (r.barGroupDecorations ?? []).some((e) => e.seriesLines?.length === 1) ? x.map(() => Array(z).fill(null)) : null;
	for (let t = 0; t < k.length; t++) {
		let n = k[t], i = jt(n.dataPointOverrides), o = At(M.get(n) ?? t, n), c = I && n.useSecondaryAxis === !0 ? cn : on, l = r.dispBlanksAs ?? "zero", u = [], d = () => {
			if (u.length !== 0) {
				Yt && (e.save(), e.beginPath(), e.rect(X, Z, Q, $), e.clip()), e.beginPath(), e.moveTo(u[0].x, u[0].baseY), e.lineTo(u[0].x, u[0].y), ji(e, u, !1);
				for (let t = u.length - 1; t >= 0; t--) e.lineTo(u[t].x, u[t].baseY);
				e.closePath(), e.fillStyle = n.fillPattern ? Ie(n.fillPattern, e, u[0].x, Z, Math.max(1, u[u.length - 1].x - u[0].x), $) ?? o : o, e.fill(), n.lineHidden !== !0 && (e.strokeStyle = n.lineColor ? `#${n.lineColor}` : o, e.lineWidth = n.lineWidthEmu == null ? 1.5 : Pe(n.lineWidthEmu, a), e.setLineDash([]), e.stroke()), Yt && e.restore(), u = [];
			}
		};
		for (let e = 0; e < z; e++) n.values[e] == null && (l === "gap" && d(), l !== "zero") || u.push({
			x: cr(e),
			y: c(xe(n, e)),
			baseY: c(Se(n, e))
		});
		d();
		let f = (n.showMarker === !0 || be(n)) && n.markerSymbol !== "none";
		if (f || Me(n)) {
			let t = Math.max(2, 2.5 * a);
			for (let r = 0; r < z; r++) {
				if (n.values[r] == null) continue;
				let l = i.get(r), u = Te(n, l, "circle", f);
				if (u === "none") continue;
				let d = cr(r), p = c(xe(n, r));
				if (be(n) || De(l)) {
					let t = l?.markerLineWidthEmu ?? n.markerLineWidthEmu;
					Si(e, d, p, u, l?.markerSize ?? n.markerSize ?? 5, se(n, l, r, o), l?.markerLine ?? n.markerLine ?? null, a, t == null ? void 0 : Pe(t, a), ve(n, l, r), s);
				} else e.fillStyle = o, e.beginPath(), e.arc(d, p, t, 0, Math.PI * 2), e.fill();
			}
		}
	}
	for (let t = 0; t < z; t++) {
		let n = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
		for (let o = 0; o < x.length; o++) {
			let f = x[o], m = y(f), h = Qn(t, m), g = I != null && f.useSecondaryAxis === !0, _ = B(f), v = C(f), b = E(f), S = D(f), w = S && _.reduce((e, n) => e + Math.abs(n.values[t] ?? 0), 0) || 1, T = n.get(v) ?? 0, O = i.get(v) ?? 0, k = Math.max(0, _.indexOf(f)), { barW: A, clusterGap: j, catStart: N } = lr(_, h), ee = g && Tt ? Tt.makeToY(Z, $) : tn, P = Tt ? R?.crossesAt != null && Number.isFinite(R.crossesAt) ? Math.max(Tt.min, Math.min(Tt.max, R.crossesAt)) : R?.crosses === "max" ? Tt.max : R?.crosses === "min" ? Tt.min : Math.max(Tt.min, Math.min(Tt.max, 0)) : 0, te = g ? ee(P) : rn, F = f.values[t] ?? 0, ne = S ? F / w * me(f) : F, ie = ne < 0, L = g && Tt ? Tt.max : vt.max, ae = ie && (f.invertIfNegative === !0 || f.automaticNegativeStyle === !0), oe = Ee[o].get(t), se = oe?.color ?? f.dataPointColors?.[t], ce = se ? `#${se}` : we ? Mt(t, f) : At(o, f), z = ae ? f.automaticNegativeStyle === !0 || f.invertedFillHidden === !0 ? null : f.invertedFill : void 0, ue = oe?.fillHidden ? null : oe?.color ? {
				fillType: "solid",
				color: oe.color
			} : z === void 0 ? V ? Ji(r, je[o], x.length, f.chartexStyle, f.color) : void 0 : z, de = () => {
				if (oe?.lineHidden != null || oe?.lineColor != null || oe?.lineWidthEmu != null || oe?.lineDash != null) {
					if (oe?.lineHidden) return !1;
					let t = zi(r, r.chartexDataPointStyle, "line", je[o], x.length) ?? f.lineColor ?? ce;
					return e.strokeStyle = `#${oe?.lineColor ?? t.replace(/^#/, "")}`, e.lineWidth = oe?.lineWidthEmu == null ? f.lineWidthEmu == null ? 1 : Pe(f.lineWidthEmu, a) : Pe(oe.lineWidthEmu, a), e.setLineDash(Mi(oe?.lineDash, e.lineWidth)), !0;
				}
				if (ae && (f.invertedLineHidden != null || f.invertedLineColor != null || f.invertedLineWidthEmu != null)) return f.invertedLineHidden ? !1 : (e.strokeStyle = `#${f.invertedLineColor ?? "000000"}`, e.lineWidth = Pe(f.invertedLineWidthEmu, a), e.setLineDash([]), !0);
				if (f.automaticNegativeStyle === !0) return e.strokeStyle = "#000000", e.lineWidth = .75 * a, e.setLineDash([]), !0;
				let t = ae && r.chartType === "clusteredBar" && r.legacyChartStyle === 2 && f.invertedFillAuthored === !0 && f.invertedFill != null && f.invertedLineAuthored === !1, n = f.lineHidden === !0 || f.lineColor != null || f.lineWidthEmu != null;
				return t && n ? f.lineHidden || !f.lineColor ? !1 : (e.strokeStyle = `#${f.lineColor}`, e.lineWidth = Pe(f.lineWidthEmu, a), e.setLineDash([]), !0) : t ? (e.strokeStyle = "#000000", e.lineWidth = .75 * a, e.setLineDash([]), !0) : V ? Qi(e, r, r.chartexDataPointStyle, f, je[o], x.length, ce, a) : !f.lineColor || f.lineHidden ? !1 : (e.strokeStyle = `#${f.lineColor}`, e.lineWidth = Pe(f.lineWidthEmu, a), e.setLineDash([]), !0);
			};
			if (m) {
				let n = k, i = b ? or(t, !0) + N : or(t, !0) + N + n * j, m = b ? nn(ie ? O : T) : an, h = nn(b ? (ie ? O : T) + ne : ne), g = Ai(Math.min(m, h), X, X + Q), _ = Ai(Math.max(m, h), X, X + Q), v = Math.max(0, _ - g);
				if (dr && f.values[t] != null && (dr[o][t] = {
					categoryStart: i,
					categoryEnd: i + A,
					valueEnd: Ai(h, X, X + Q)
				}), ue !== null && (e.fillStyle = ue ? Yi(e, ue, g, i, v, A, ce) : f.fillPattern ? Ie(f.fillPattern, e, g, i, v, A) ?? ce : ce, e.fillRect(g, i, v, A)), v > 0 && A > 0 && de()) {
					let t = e.lineWidth;
					e.strokeRect(g + t / 2, i + t / 2, Math.max(0, v - t), Math.max(0, A - t));
				}
				let y = f.seriesDataLabels, x = Ri(r, f, t, f.categories?.[t] ?? le[t] ?? "", F, {
					visible: r.showDataLabels,
					showVal: r.showDataLabels && !S,
					showPercent: r.showDataLabels && S,
					showCatName: !1
				}, Oe[o], S ? ne / 100 : void 0, f.useSecondaryAxis && I ? I.displayUnits : r.valAxisDisplayUnits);
				if (x && hr(r, F, L)) {
					let n = p(x.fontSizeHpt ?? r.dataLabelFontSizeHpt, a) ?? Math.max(7, Math.min(11, A * .6)), m = Oe[o].get(t), h = x.fontBold || y?.fontBold == null && m?.fontBold == null, _ = Y(r, x.fontFace ?? r.dataLabelFontFace, "minor");
					e.font = `${x.textStyle.fontItalic ? "italic " : ""}${h ? "bold " : ""}${n}px ${_}`, gr(e, x.text, g, i, v, A, "horizontal", x.position ?? r.dataLabelPosition ?? (b ? "ctr" : null), f.dataLabelColors?.[t] ?? x.fontColor ?? f.labelColor ?? r.dataLabelFontColor ?? null, n, {
						x: X,
						y: Z,
						w: Q,
						h: $
					}, {
						x: c,
						y: l,
						w: u,
						h: d
					}, m?.manualLayout, ie, Ei(r, m, a, _, h, x.textStyle), x.showLegendKey ? re(M.get(f) ?? o, t) : void 0, x.textStyle, a, We(m?.labelBox, y?.labelBox), s);
				}
			} else {
				let n = b ? or(t, !1) + N : or(t, !1) + N + k * j;
				if (n + A <= X || n >= X + Q) continue;
				let i = b ? ee(ie ? O : T) : te, m = ee(b ? (ie ? O : T) + ne : ne), h = Ai(Math.min(i, m), Z, Z + $), g = Ai(Math.max(i, m), Z, Z + $), _ = Math.max(0, g - h);
				if (dr && f.values[t] != null && (dr[o][t] = {
					categoryStart: n,
					categoryEnd: n + A,
					valueEnd: Ai(m, Z, Z + $)
				}), ue !== null && (e.fillStyle = ue ? Yi(e, ue, n, h, A, _, ce) : f.fillPattern ? Ie(f.fillPattern, e, n, h, A, _) ?? ce : ce, e.fillRect(n, h, A, _)), A > 0 && _ > 0 && de()) {
					let t = e.lineWidth;
					e.strokeRect(n + t / 2, h + t / 2, Math.max(0, A - t), Math.max(0, _ - t));
				}
				let v = f.seriesDataLabels, y = Ri(r, f, t, f.categories?.[t] ?? le[t] ?? "", F, {
					visible: r.showDataLabels,
					showVal: r.showDataLabels && !S,
					showPercent: r.showDataLabels && S,
					showCatName: !1
				}, Oe[o], S ? ne / 100 : void 0, f.useSecondaryAxis && I ? I.displayUnits : r.valAxisDisplayUnits);
				if (y && hr(r, F, L)) {
					let i = p(y.fontSizeHpt ?? r.dataLabelFontSizeHpt, a) ?? Math.max(7, Math.min(11, A * .6)), m = Oe[o].get(t), g = y.fontBold || v?.fontBold == null && m?.fontBold == null, x = Y(r, y.fontFace ?? r.dataLabelFontFace, "minor");
					e.font = `${y.textStyle.fontItalic ? "italic " : ""}${g ? "bold " : ""}${i}px ${x}`, gr(e, y.text, n, h, _, A, "vertical", y.position ?? r.dataLabelPosition ?? (b ? "ctr" : null), f.dataLabelColors?.[t] ?? y.fontColor ?? f.labelColor ?? r.dataLabelFontColor ?? null, i, {
						x: X,
						y: Z,
						w: Q,
						h: $
					}, {
						x: c,
						y: l,
						w: u,
						h: d
					}, m?.manualLayout, ie, Ei(r, m, a, x, g, y.textStyle), y.showLegendKey ? re(M.get(f) ?? o, t) : void 0, y.textStyle, a, We(m?.labelBox, v?.labelBox), s);
				}
			}
			b && (ie ? i.set(v, O + ne) : n.set(v, T + ne));
		}
	}
	if (dr) {
		let t = /* @__PURE__ */ new Map();
		for (let e = 0; e < x.length; e++) {
			let n = x[e].barGroupIndex ?? 0, r = t.get(n);
			r ? r.push(e) : t.set(n, [e]);
		}
		for (let n of r.barGroupDecorations ?? []) if (n.seriesLines?.length === 1) {
			if (e.save(), !yr(e, br(r, n.seriesLines[0], "seriesLine"), a)) {
				e.restore();
				continue;
			}
			e.beginPath(), e.rect(X, Z, Q, $), e.clip();
			for (let r of t.get(n.groupIndex) ?? []) {
				let t = dr[r], n = y(x[r]);
				for (let r = 0; r + 1 < z; r++) {
					let i = t[r], a = t[r + 1];
					if (!i || !a) continue;
					let o = (i.categoryStart + i.categoryEnd) / 2, s = (a.categoryStart + a.categoryEnd) / 2 >= o;
					e.beginPath(), n ? (e.moveTo(i.valueEnd, s ? i.categoryEnd : i.categoryStart), e.lineTo(a.valueEnd, s ? a.categoryStart : a.categoryEnd)) : (e.moveTo(s ? i.categoryEnd : i.categoryStart, i.valueEnd), e.lineTo(s ? a.categoryStart : a.categoryEnd, a.valueEnd)), e.stroke();
				}
			}
			e.restore();
		}
	}
	let mr = (e, t) => {
		let n = B(e), r = Math.max(0, n.indexOf(e)), i = y(e), a = lr(n, Qn(t, i)), o = or(t, i) + a.catStart;
		return E(e) ? o + a.barW / 2 : o + r * a.clusterGap + a.barW / 2;
	}, vr = (e, t) => {
		if (Number.isInteger(t) && t >= 0 && t < z) return mr(e, t);
		let n = B(e), r = Math.max(0, n.indexOf(e)), i = y(e), a = Hn(i), o = lr(n, a), s = i ? Wn ? t : z - 1 - t : Wn ? z - 1 - t : t;
		return (i ? Z : X) + s * a + o.catStart + (E(e) ? 0 : r) * o.clusterGap + o.barW / 2;
	};
	for (let t = 0; t < x.length; t++) {
		let n = x[t], o = y(n), c = I != null && n.useSecondaryAxis === !0, l = o ? nn : c && Tt ? Tt.makeToY(Z, $) : tn, u = At(t, n), d = (e) => pt(t, e);
		for (let t of Ce(n)) Fi(e, n, Cr(r, t), z, o, (e) => mr(n, e), l, d, u, a);
		Gn(e, n, u, (e) => vr(n, e - 1), l, a, n.values.map((e, t) => t + 1), {
			chart: r,
			chartRect: i,
			plotRect: {
				x: X,
				y: Z,
				w: Q,
				h: $
			},
			shapeRotationDeg: s
		}, (e, t) => o ? {
			x: l(t),
			y: vr(n, e - 1)
		} : {
			x: vr(n, e - 1),
			y: l(t)
		});
	}
	if ((!Ge || f) && !r.catAxisHidden && Zn(r)) {
		e.fillStyle = r.catAxisFontColor ? `#${r.catAxisFontColor}` : "#555";
		let t = r.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, Un * .5)) : Be;
		e.font = Pt(t, Y(r, r.catAxisFontFace, "minor"), r.catAxisFontBold ?? !1, r.catAxisFontItalic ?? !1);
		let n = Un - 4, i = X - 4 - (c + Ye + tt), o = Zt, s = Yt ? Yt.majorTicks.map((e) => ({
			raw: Ae(String(e.serial), r.catAxisFormatCode, r.date1904),
			fraction: e.fraction,
			categoryIndex: -1
		})) : le.map((e, t) => ({
			raw: Ae(e.toString(), r.catAxisFormatCode, r.date1904),
			fraction: null,
			categoryIndex: t
		}));
		for (let a of s) {
			let { raw: s } = a;
			if (f) {
				let n = a.fraction == null ? Z + qn(a.categoryIndex, !0) * Un + Un / 2 : Z + a.fraction * $, o = P(r.catAxisFontSizeHpt == null ? 4 : ke(t), r.catAxisLabelOffsetPercent), l = c + Ye + tt, u = X - o, d = r.catAxisLabelAlignment, f = d === "l" ? l : d === "ctr" ? (l + u) / 2 : u;
				e.textAlign = d === "l" ? "left" : d === "ctr" ? "center" : "right", e.textBaseline = "middle", e.fillText(q(e, s, i), f, n);
			} else {
				let i = a.fraction != null || a.categoryIndex < 0 ? {
					fraction: a.fraction ?? .5,
					textAlign: "center"
				} : te(a.categoryIndex, z, ce(r), Wn, r.catAxisLabelAlignment), c = X + i.fraction * Q;
				e.textAlign = i.textAlign, e.textBaseline = "top";
				let l = o === 0 ? n : $ * .4, u = P(r.catAxisFontSizeHpt == null ? 3 : v(t), r.catAxisLabelOffsetPercent);
				o === 0 ? (a.categoryIndex >= 0 ? Qt[a.categoryIndex] ?? [s] : [s]).forEach((n, r) => {
					e.fillText(n, c, Fn + u + r * (t + 2));
				}) : er(e, q(e, s, l), c, Fn + u, o);
			}
		}
		if (!f && He) {
			let n = P(r.catAxisFontSizeHpt == null ? 3 : v(t), r.catAxisLabelOffsetPercent), i = t + 4;
			e.textAlign = "center", e.textBaseline = "top", e.strokeStyle = fn, e.lineWidth = pn, e.setLineDash([]);
			let o = (e) => {
				if (!zn || e % Ln !== 0) return Fn;
				let t = xn("major", pn, a);
				return r.catAxisMajorTickMark === "cross" ? Fn - t / 2 : r.catAxisMajorTickMark === "in" ? Fn - t : Fn;
			}, s = /* @__PURE__ */ new Set();
			for (let e = 1; e < He.length; e++) {
				let t = He[e] ?? [];
				for (let e = 0; e < z; e++) (t[e] ?? "") !== "" && s.add(e);
				s.add(z);
			}
			let c = Fn + n + t + 2;
			for (let t = 0; t <= z; t++) {
				if (s.has(t)) continue;
				let n = X + t / z * Q;
				e.beginPath(), e.moveTo(n, o(t)), e.lineTo(n, c), e.stroke();
			}
			let l = /* @__PURE__ */ new Map();
			for (let a = 1; a < He.length; a++) {
				let o = He[a] ?? [], s = [];
				for (let e = 0; e < z; e++) (o[e] ?? "") !== "" && s.push(e);
				for (let c = 0; c < s.length; c++) {
					let u = s[c], d = s[c + 1] ?? z, f = o[u] ?? "", p = X + u / z * Q, m = X + d / z * Q, h = Fn + n + a * i, g = r.catAxisLabelAlignment, _ = g === "l" ? p : g === "r" ? m : (p + m) / 2;
					e.textAlign = g === "l" ? "left" : g === "r" ? "right" : "center", e.fillText(q(e, f, Math.max(0, m - p - 4)), _, h);
					let v = h + t + 2;
					for (let e of [u, d]) l.set(e, Math.max(l.get(e) ?? Fn, v));
				}
			}
			for (let [t, n] of l) {
				let r = X + t / z * Q;
				e.beginPath(), e.moveTo(r, o(t)), e.lineTo(r, n), e.stroke();
			}
		}
	}
	if (O.length > 0 && !f) {
		Wr(e, r, z, cr, (e) => I && e.useSecondaryAxis === !0 ? cn : on, () => An, (e, t) => e.values[t] == null ? null : xe(e, t), Un, a, s, "background"), Yt && (e.save(), e.beginPath(), e.rect(X, Z, Q, $), e.clip());
		for (let t = 0; t < O.length; t++) {
			let n = O[t], c = jt(n.dataPointOverrides), l = At(x.length + t, n), u = I && n.useSecondaryAxis === !0 ? cn : on, d = n.chartexStyle != null || n.lineHidden != null || n.lineColor != null || n.lineWidthEmu != null || r.chartexDataPointLineStyle != null, f = d ? Qi(e, r, r.chartexDataPointLineStyle, n, Li(n, M.get(n) ?? t), O.length, l, a, { linkedNoStyleFallback: o.semanticLineNoStyleFallback }) : !0;
			d || (e.strokeStyle = l, e.lineWidth = 2, e.setLineDash([])), e.beginPath();
			let p = n.smooth === !0, m = r.dispBlanksAs ?? "gap", h = [], g = () => {
				h.length !== 0 && (e.moveTo(h[0].x, h[0].y), ji(e, h, p), h = []);
			};
			for (let e = 0; e < z; e++) {
				if (n.values[e] == null && (m === "gap" && g(), m !== "zero")) continue;
				let t = cr(e);
				h.push({
					x: t,
					y: u(xe(n, e))
				});
			}
			g(), f && e.stroke();
			let _ = n.showMarker !== !1 && n.markerSymbol !== "none", v = _ || Me(n), y = be(n);
			if (v) for (let t = 0; t < z; t++) {
				if (n.values[t] == null) continue;
				let r = cr(t), i = u(xe(n, t)), o = c.get(t), d = Te(n, o, "circle", _);
				if (d !== "none") if (y || De(o)) {
					let c = o?.markerLineWidthEmu ?? n.markerLineWidthEmu;
					Si(e, r, i, d, o?.markerSize ?? n.markerSize ?? 5, se(n, o, t, l), o?.markerLine ?? n.markerLine ?? null, a, c == null ? void 0 : Pe(c, a), ve(n, o, t), s);
				} else e.fillStyle = l, e.beginPath(), e.arc(r, i, 3, 0, Math.PI * 2), e.fill();
			}
			Gn(e, n, l, (e) => cr(e), u, a, void 0, {
				chart: r,
				chartRect: i,
				plotRect: {
					x: X,
					y: Z,
					w: Q,
					h: $
				},
				shapeRotationDeg: s
			});
		}
		Wr(e, r, z, cr, (e) => I && e.useSecondaryAxis === !0 ? cn : on, () => An, (e, t) => e.values[t] == null ? null : xe(e, t), Un, a, s, "foreground"), Yt && e.restore();
	}
	if (A.length > 0) {
		let t = [], n = [];
		for (let e of A) {
			let r = e.categories ?? [];
			for (let i = 0; i < e.values.length; i++) {
				let a = di(r, i, !1), o = e.values[i];
				a == null || o == null || (t.push(a), n.push(o));
			}
		}
		if (t.length && n.length) {
			let o = r.secondaryCatAxis, f = r.secondaryValAxis, p = ot(t), m = ot(n), h = (e) => e?.minorGridlines === !0 || e?.minorTickMark != null && e.minorTickMark !== "none", g = G({
				dataMin: p.min,
				dataMax: p.max,
				explicitMin: o?.min,
				explicitMax: o?.max,
				axisLenPt: Q / a,
				axisOrientation: "horizontal",
				majorUnit: o?.majorUnit,
				minorUnit: o?.minorUnit,
				needMinor: h(o),
				logBase: o?.logBase,
				reversed: o?.orientation === "maxMin"
			}), _ = G({
				dataMin: m.min,
				dataMax: m.max,
				explicitMin: f?.min,
				explicitMax: f?.max,
				axisLenPt: $ / a,
				axisOrientation: "vertical",
				majorUnit: f?.majorUnit,
				minorUnit: f?.minorUnit,
				needMinor: h(f),
				logBase: f?.logBase,
				reversed: f?.orientation === "maxMin"
			});
			vi(e, r, A.map((e, t) => ({
				series: e,
				index: M.get(e) ?? t
			})), !1, (e) => X + g.fraction(e) * Q, (e) => Z + $ - _.fraction(e) * $, i, X, Z, Q, $, a, !1, r.scatterStyle ?? "marker", {
				x: c,
				y: l,
				w: u,
				h: d
			}, _.max, void 0, s);
		}
	}
	Bn(), R && !f && sr(e, r, R, oe, i, X, Z, Q, a), I && Tt && ar(e, r, I, Tt, sn, i, X, Z, Q, $, a, Ft, Lt, dn, r.date1904, Ct), en && Kt(e, r, en, X, Z + $ + (f ? r.valAxisHidden ? d * .02 : m(W) : 0), Q, c + Ye, a);
	let xr = V ? x.flatMap((e, t) => [Ji(r, je[t], x.length, e.chartexStyle, e.color), ...Kn([e]).map(() => void 0)]) : [];
	_n(e, H, qe, c, l, u, d, X, Z, Q, $, ze + 2, a, xr), Bt(e, r, c, l, u, d, X, Z, Q, $, Ye, Xe, Qe, $e, f);
}
function yr(e, t, n) {
	return t.hidden === !0 || t.paintAuthored === !0 && t.color == null ? !1 : (e.strokeStyle = `#${t.color ?? "000000"}`, e.lineWidth = t.widthEmu == null ? Math.max(1, .75 * n) : Pe(t.widthEmu, n), e.setLineDash(Mi(t.dash ?? void 0, e.lineWidth)), e.lineCap = t.cap === "rnd" ? "round" : t.cap === "sq" ? "square" : "butt", e.lineJoin = t.join === "round" || t.join === "bevel" ? t.join : "miter", !0);
}
function br(e, t, n) {
	let r = e.chartStyleRoles?.[n], i = r != null && r.lineNoStyle !== !0, a = t.paintAuthored === !0 || t.color != null || t.hidden === !0, o = i && (r.linePaintAuthored === !0 || r.lineHidden === !0 || r.lineColors?.some((e) => e != null) === !0 || r.linePaints?.some((e) => e != null) === !0);
	return {
		color: t.color ?? (!a && i ? zi(e, r, "line", 0, 1) : null),
		paintAuthored: a ? t.paintAuthored : o ? !0 : void 0,
		widthEmu: t.widthEmu ?? (i ? r.lineWidthEmu : null),
		dash: t.dash ?? (i ? r.lineDash : null),
		cap: t.cap ?? (i ? r.lineCap : null),
		join: t.join ?? (i ? r.lineJoin : null),
		hidden: t.hidden ?? (!a && i && r.lineHidden === !0 ? !0 : null)
	};
}
function xr(e, t, n) {
	let r = e.chartStyleRoles?.[n], i = r != null && r.fillNoStyle !== !0, a = r != null && r.lineNoStyle !== !0, o = r?.fillPaints?.[0], s = t.fillPaintAuthored === !0 || t.fillColor != null || t.fill != null || t.fillHidden === !0, c = t.linePaintAuthored === !0 || t.lineColor != null || t.lineHidden === !0, l = i && (r.fillPaintAuthored === !0 || r.fillHidden === !0 || o != null || r.fillColors?.some((e) => e != null) === !0), u = a && (r.linePaintAuthored === !0 || r.lineHidden === !0 || r.lineColors?.some((e) => e != null) === !0 || r.linePaints?.some((e) => e != null) === !0);
	return {
		fillColor: t.fillColor ?? (!s && i ? zi(e, r, "fill", 0, 1) : null),
		fill: t.fill ?? (!s && i && o != null && o.fillType !== "image" && o.fillType !== "none" ? o : null),
		fillPaintAuthored: s ? t.fillPaintAuthored : l ? !0 : void 0,
		fillHidden: t.fillHidden ?? (!s && i && r.fillHidden === !0 ? !0 : null),
		lineColor: t.lineColor ?? (!c && a ? zi(e, r, "line", 0, 1) : null),
		linePaintAuthored: c ? t.linePaintAuthored : u ? !0 : void 0,
		lineWidthEmu: t.lineWidthEmu ?? (a ? r.lineWidthEmu : null),
		lineDash: t.lineDash ?? (a ? r.lineDash : null),
		lineCap: t.lineCap ?? (a ? r.lineCap : null),
		lineJoin: t.lineJoin ?? (a ? r.lineJoin : null),
		lineHidden: t.lineHidden ?? (!c && a && r.lineHidden === !0 ? !0 : null)
	};
}
function Sr(e, t, n, r, i, a, o) {
	for (let s = 0; s < n; s++) {
		let n = Infinity, c = -Infinity, l = !1;
		for (let e of t) {
			let t = o(e, s);
			if (t == null || !Number.isFinite(t)) continue;
			let r = i(e)(t), u = a(e);
			!Number.isFinite(r) || !Number.isFinite(u) || (n = Math.min(n, r, u), c = Math.max(c, r, u), l = !0);
		}
		!l || Math.abs(c - n) < .01 || (e.beginPath(), e.moveTo(r(s), n), e.lineTo(r(s), c), e.stroke());
	}
}
function Cr(e, t) {
	let n = br(e, {
		color: t.color,
		widthEmu: t.lineWidthEmu,
		dash: t.dash,
		hidden: t.hidden
	}, "errorBar");
	return {
		...t,
		color: n.color ?? void 0,
		lineWidthEmu: n.widthEmu ?? void 0,
		dash: n.dash ?? void 0,
		hidden: n.hidden ?? void 0
	};
}
function wr(e, t) {
	return br(e, {
		color: t.leaderLineColor,
		widthEmu: t.leaderLineWidthEmu,
		dash: t.leaderLineDash,
		hidden: t.leaderLineHidden
	}, "leaderLine");
}
function Tr(e, t) {
	let n = br(e, {
		color: t.lineColor,
		widthEmu: t.lineWidthEmu,
		dash: t.lineDash,
		hidden: t.lineHidden
	}, "trendline");
	return {
		...t,
		lineColor: n.color ?? void 0,
		lineWidthEmu: n.widthEmu ?? void 0,
		lineDash: n.dash ?? void 0,
		lineHidden: n.hidden ?? void 0
	};
}
function Er(e, t) {
	let n = br(e, {
		color: t.lineColor,
		widthEmu: t.lineWidthEmu,
		dash: t.lineDash,
		hidden: t.lineHidden
	}, "dataTable");
	return {
		...t,
		lineColor: n.color ?? void 0,
		lineWidthEmu: n.widthEmu ?? void 0,
		lineDash: n.dash ?? void 0,
		lineHidden: n.hidden ?? void 0
	};
}
function Dr(e, t, n, r, i, a) {
	if (n !== !0 || !e.chartStyleRoles?.[t]) return {
		visible: n,
		color: r,
		widthEmu: i,
		dash: a
	};
	let o = br(e, {
		color: r,
		widthEmu: i,
		dash: a
	}, t);
	return {
		visible: o.hidden !== !0,
		color: o.color,
		widthEmu: o.widthEmu,
		dash: o.dash
	};
}
function Or(e, t) {
	if (!t || !e.chartStyleRoles?.gridlineMajor && !e.chartStyleRoles?.gridlineMinor) return t;
	let n = Dr(e, "gridlineMajor", t.majorGridlines, t.majorGridlineColor, t.majorGridlineWidthEmu, t.majorGridlineDash), r = Dr(e, "gridlineMinor", t.minorGridlines, t.minorGridlineColor, t.minorGridlineWidthEmu, t.minorGridlineDash);
	return n.visible !== t.majorGridlines || n.color !== t.majorGridlineColor || n.widthEmu !== t.majorGridlineWidthEmu || n.dash !== t.majorGridlineDash || r.visible !== t.minorGridlines || r.color !== t.minorGridlineColor || r.widthEmu !== t.minorGridlineWidthEmu || r.dash !== t.minorGridlineDash ? {
		...t,
		majorGridlines: n.visible ?? void 0,
		majorGridlineColor: n.color,
		majorGridlineWidthEmu: n.widthEmu,
		majorGridlineDash: n.dash,
		minorGridlines: r.visible ?? void 0,
		minorGridlineColor: r.color,
		minorGridlineWidthEmu: r.widthEmu,
		minorGridlineDash: r.dash
	} : t;
}
function kr(e, t, n, r, i, a) {
	return br(e, {
		color: n,
		widthEmu: r,
		dash: i,
		hidden: a ? !0 : void 0
	}, t);
}
function Ar(e, t, n) {
	let r = e.chartStyleRoles?.[n];
	if (!t || !r) return t;
	let i = kr(e, n, t.lineColor, t.lineWidthEmu, t.lineDash, t.lineHidden), a = i.hidden === !0, o = t.fontSizeHpt ?? r.fontSizeHpt, s = t.fontBold ?? r.fontBold, c = t.fontItalic ?? r.fontItalic, l = t.fontColor ?? r.fontColor, u = t.fontFace ?? r.fontFace;
	return i.color === t.lineColor && i.widthEmu === t.lineWidthEmu && i.dash === t.lineDash && a === t.lineHidden && o === t.fontSizeHpt && s === t.fontBold && c === t.fontItalic && l === t.fontColor && u === t.fontFace ? t : {
		...t,
		lineColor: i.color,
		lineWidthEmu: i.widthEmu,
		lineDash: i.dash,
		lineHidden: a,
		fontSizeHpt: o,
		fontBold: s,
		fontItalic: c,
		fontColor: l,
		fontFace: u
	};
}
function jr(e) {
	let t = e.threeD?.seriesAxis, n = e.chartStyleRoles?.seriesAxis;
	if (!t || !n) return e;
	let r = br(e, {
		color: t.lineColor,
		widthEmu: t.lineWidthEmu,
		dash: t.lineDash,
		hidden: t.lineHidden ? !0 : void 0
	}, "seriesAxis"), i = r.hidden === !0, a = t.fontSizeHpt ?? n.fontSizeHpt, o = t.fontBold ?? n.fontBold, s = t.fontItalic ?? n.fontItalic, c = t.fontColor ?? n.fontColor, l = t.fontFace ?? n.fontFace;
	return r.color === t.lineColor && r.widthEmu === t.lineWidthEmu && r.dash === t.lineDash && i === t.lineHidden && a === t.fontSizeHpt && o === t.fontBold && s === t.fontItalic && c === t.fontColor && l === t.fontFace ? e : {
		...e,
		threeD: {
			...e.threeD,
			seriesAxis: {
				...t,
				lineColor: r.color,
				lineWidthEmu: r.widthEmu,
				lineDash: r.dash,
				lineHidden: i,
				fontSizeHpt: a,
				fontBold: o,
				fontItalic: s,
				fontColor: c,
				fontFace: l
			}
		}
	};
}
function Mr(e, t) {
	if (e.chartType === "bubble") return !1;
	let n = t.seriesType ?? e.chartType;
	return n === "line" || n === "stackedLine" || n === "stackedLinePct" || n === "area" || n === "stackedArea" || n === "stackedAreaPct" || n === "scatter" || n === "radar" || n === "stock";
}
function Nr(e, t, n, r) {
	let i = e.chartStyleRoles?.dataPointMarker;
	if (!Mr(e, t) || (t.showMarker === !1 || t.markerSymbol === "none") && !Me(t)) return t;
	let a = i != null && i.fillNoStyle !== !0, o = i != null && i.lineNoStyle !== !0, s = t.markerFillPaintAuthored === !0 || t.markerFill != null || t.markerFillPaint !== void 0, c = t.markerFill ?? (!s && a && i?.fillHidden === !0 ? "00000000" : !s && a && i ? zi(e, i, "fill", n, r) : null), l = !s && a && i ? Ki(e, i, n, r) : void 0, u = t.markerFillPaint === void 0 ? l?.fillType === "gradient" || l?.fillType === "pattern" || l?.fillType === "image" ? l : void 0 : t.markerFillPaint, d = s ? t.markerFillPaintAuthored : a && i?.fillPaintAuthored === !0 ? !0 : void 0, f = t.markerLine ?? (o && i?.lineHidden === !0 ? "00000000" : o && i ? zi(e, i, "line", n, r) : null), p = t.markerLineWidthEmu ?? (o ? i?.lineWidthEmu : null), m = t.markerSize ?? e.chartStyleMarkerSizePt, h = t.markerSymbol ?? e.chartStyleMarkerSymbol;
	return c === t.markerFill && u === t.markerFillPaint && d === t.markerFillPaintAuthored && f === t.markerLine && p === t.markerLineWidthEmu && m === t.markerSize && h === t.markerSymbol ? t : {
		...t,
		markerFill: c,
		markerFillPaint: u,
		markerFillPaintAuthored: d,
		markerLine: f,
		markerLineWidthEmu: p,
		markerSize: m,
		markerSymbol: h
	};
}
function Pr(e, t, n) {
	if (!n || n.lineNoStyle === !0) return t;
	let { color: r, fill: i, hidden: a } = t;
	t.paintAuthored === !0 || i != null || r != null || a === !0 || (n.lineHidden === !0 ? a = !0 : (i = Wi(n, 0), r = i == null ? zi(e, n, "line", 0, 1) : null));
	let o = t.dash, s = t.customDash, c = t.dashAuthored;
	return c !== !0 && o == null && s == null && (o = n.lineDash, s = n.lineCustomDash, c = n.lineDashAuthored), {
		color: r,
		fill: i,
		hidden: a,
		paintAuthored: t.paintAuthored,
		widthEmu: t.widthEmu ?? n.lineWidthEmu,
		dash: o,
		dashAuthored: c,
		customDash: s,
		cap: t.cap ?? n.lineCap,
		join: t.join ?? n.lineJoin,
		compound: t.compound ?? n.lineCompound
	};
}
function Fr(e, t, n, r) {
	if (!n || !t && !r) return t ?? void 0;
	let i = t ?? {}, a = i.fill, o = i.fillPaint, s = i.fillHidden;
	!(i.fillPaintAuthored === !0 || a != null || o != null || s === !0) && n.fillNoStyle !== !0 && (s = n.fillHidden, o = n.fillHidden === !0 ? void 0 : Ui(n, 0), a = o == null && n.fillHidden !== !0 ? zi(e, n, "fill", 0, 1) ?? void 0 : void 0);
	let c = Pr(e, {
		color: i.borderColor,
		fill: i.borderFill,
		widthEmu: i.borderWidthEmu,
		dash: i.borderDash,
		dashAuthored: i.borderDashAuthored,
		customDash: i.borderCustomDash,
		cap: i.borderCap,
		join: i.borderJoin,
		compound: i.borderCompound,
		hidden: i.borderHidden,
		paintAuthored: i.borderPaintAuthored
	}, n);
	return {
		...i,
		fill: a,
		fillPaint: o,
		fillHidden: s,
		borderColor: c.color ?? void 0,
		borderFill: c.fill ?? void 0,
		borderWidthEmu: c.widthEmu ?? void 0,
		borderDash: c.dash ?? void 0,
		borderDashAuthored: c.dashAuthored ?? void 0,
		borderCustomDash: c.customDash ?? void 0,
		borderCap: c.cap ?? void 0,
		borderJoin: c.join ?? void 0,
		borderCompound: c.compound ?? void 0,
		borderHidden: c.hidden ?? void 0
	};
}
function Ir(e, t) {
	let n = t.labelBox ? e.chartStyleRoles?.dataLabelCallout ?? e.chartStyleRoles?.dataLabel : e.chartStyleRoles?.dataLabel;
	if (!n) return t;
	let r = Fr(e, t.labelBox, n, !1), i = t.fontPaintAuthored === !0 || t.fontColor != null || t.fontHidden === !0;
	return {
		...t,
		fontSizeHpt: t.fontSizeHpt ?? n.fontSizeHpt ?? void 0,
		fontBold: t.fontBold ?? n.fontBold ?? void 0,
		fontItalic: t.fontItalic ?? n.fontItalic ?? void 0,
		fontColor: i ? t.fontColor : n.fontColor ?? void 0,
		fontPaintAuthored: i || n.fontPaintAuthored === !0 || void 0,
		fontHidden: i ? t.fontHidden : n.fontHidden ?? void 0,
		fontFace: t.fontFace ?? n.fontFace ?? void 0,
		fontLanguage: t.fontLanguage ?? n.fontLanguage ?? void 0,
		fontBaseline: t.fontBaseline ?? n.fontBaseline ?? void 0,
		textRotation: t.textRotation ?? n.textRotation ?? void 0,
		textWrap: t.textWrap ?? n.textWrap ?? void 0,
		textVerticalAnchor: t.textVerticalAnchor ?? n.textVerticalAnchor ?? void 0,
		textVerticalMode: t.textVerticalMode ?? n.textVerticalMode ?? void 0,
		textLInsEmu: t.textLInsEmu ?? n.textLInsEmu ?? void 0,
		textTInsEmu: t.textTInsEmu ?? n.textTInsEmu ?? void 0,
		textRInsEmu: t.textRInsEmu ?? n.textRInsEmu ?? void 0,
		textBInsEmu: t.textBInsEmu ?? n.textBInsEmu ?? void 0,
		textBodyAuthored: t.textBodyAuthored === !0 || n.textBodyAuthored === !0 || void 0,
		labelBox: r
	};
}
function Lr(e, t) {
	let n = e.chartStyleRoles?.trendlineLabel;
	if (!n) return t;
	let r = t.labelFontPaintAuthored === !0 || t.labelFontColor != null || t.labelFontHidden === !0;
	return {
		...t,
		labelBox: Fr(e, t.labelBox, n, !0),
		labelFontSizeHpt: t.labelFontSizeHpt ?? n.fontSizeHpt ?? void 0,
		labelFontBold: t.labelFontBold ?? n.fontBold ?? void 0,
		labelFontItalic: t.labelFontItalic ?? n.fontItalic ?? void 0,
		labelFontColor: r ? t.labelFontColor : n.fontColor ?? void 0,
		labelFontPaintAuthored: r || n.fontPaintAuthored === !0 || void 0,
		labelFontHidden: r ? t.labelFontHidden : n.fontHidden ?? void 0,
		labelFontFace: t.labelFontFace ?? n.fontFace ?? void 0,
		labelFontLanguage: t.labelFontLanguage ?? n.fontLanguage ?? void 0,
		labelFontBaseline: t.labelFontBaseline ?? n.fontBaseline ?? void 0,
		labelTextRotation: t.labelTextRotation ?? n.textRotation ?? void 0,
		labelTextWrap: t.labelTextWrap ?? n.textWrap ?? void 0,
		labelTextVerticalAnchor: t.labelTextVerticalAnchor ?? n.textVerticalAnchor ?? void 0,
		labelTextVerticalMode: t.labelTextVerticalMode ?? n.textVerticalMode ?? void 0,
		labelTextLInsEmu: t.labelTextLInsEmu ?? n.textLInsEmu ?? void 0,
		labelTextTInsEmu: t.labelTextTInsEmu ?? n.textTInsEmu ?? void 0,
		labelTextRInsEmu: t.labelTextRInsEmu ?? n.textRInsEmu ?? void 0,
		labelTextBInsEmu: t.labelTextBInsEmu ?? n.textBInsEmu ?? void 0,
		labelTextBodyAuthored: t.labelTextBodyAuthored === !0 || n.textBodyAuthored === !0 || void 0
	};
}
function Rr(e, t, n) {
	let r = t.labelBox != null || n?.labelBox != null ? e.chartStyleRoles?.dataLabelCallout ?? e.chartStyleRoles?.dataLabel : e.chartStyleRoles?.dataLabel, i = r ? Fr(e, n?.labelBox, r, !0) : n?.labelBox, a = t.fontPaintAuthored === !0 || t.fontColor != null || t.fontHidden === !0, o = n?.fontPaintAuthored === !0 || n?.fontColor != null || n?.fontHidden === !0, s = a ? t : o ? n : r;
	return {
		...t,
		fontSizeHpt: t.fontSizeHpt ?? n?.fontSizeHpt ?? r?.fontSizeHpt ?? void 0,
		fontBold: t.fontBold ?? n?.fontBold ?? r?.fontBold ?? void 0,
		fontItalic: t.fontItalic ?? n?.fontItalic ?? r?.fontItalic ?? void 0,
		fontColor: s?.fontColor ?? void 0,
		fontPaintAuthored: a || o || r?.fontPaintAuthored === !0 || void 0,
		fontHidden: s?.fontHidden ?? void 0,
		fontFace: t.fontFace ?? n?.fontFace ?? r?.fontFace ?? void 0,
		fontLanguage: t.fontLanguage ?? n?.fontLanguage ?? r?.fontLanguage ?? void 0,
		fontBaseline: t.fontBaseline ?? n?.fontBaseline ?? r?.fontBaseline ?? void 0,
		textRotation: t.textRotation ?? n?.textRotation ?? r?.textRotation ?? void 0,
		textWrap: t.textWrap ?? n?.textWrap ?? r?.textWrap ?? void 0,
		textVerticalAnchor: t.textVerticalAnchor ?? n?.textVerticalAnchor ?? r?.textVerticalAnchor ?? void 0,
		textVerticalMode: t.textVerticalMode ?? n?.textVerticalMode ?? r?.textVerticalMode ?? void 0,
		textLInsEmu: t.textLInsEmu ?? n?.textLInsEmu ?? r?.textLInsEmu ?? void 0,
		textTInsEmu: t.textTInsEmu ?? n?.textTInsEmu ?? r?.textTInsEmu ?? void 0,
		textRInsEmu: t.textRInsEmu ?? n?.textRInsEmu ?? r?.textRInsEmu ?? void 0,
		textBInsEmu: t.textBInsEmu ?? n?.textBInsEmu ?? r?.textBInsEmu ?? void 0,
		textBodyAuthored: t.textBodyAuthored === !0 || n?.textBodyAuthored === !0 || r?.textBodyAuthored === !0 || void 0,
		textAlign: t.textAlign ?? n?.textAlign,
		labelBox: We(t.labelBox, i)
	};
}
function zr(e) {
	let t = e.chartStyleRoles?.legend;
	if (!t) return e;
	let n = e.legendFill, r = e.legendFillColor, i = e.legendFillHidden;
	!(e.legendFillPaintAuthored === !0 || n != null || r != null || i === !0) && t.fillNoStyle !== !0 && (t.fillHidden === !0 ? i = !0 : (n = Ui(t, 0), r = n == null ? zi(e, t, "fill", 0, 1) : null));
	let a = Pr(e, {
		color: e.legendLineColor,
		fill: e.legendLineFill,
		widthEmu: e.legendLineWidthEmu,
		dash: e.legendLineDash,
		dashAuthored: e.legendLineDashAuthored,
		customDash: e.legendLineCustomDash,
		cap: e.legendLineCap,
		join: e.legendLineJoin,
		compound: e.legendLineCompound,
		hidden: e.legendLineHidden,
		paintAuthored: e.legendLinePaintAuthored
	}, t);
	return n === e.legendFill && r === e.legendFillColor && i === e.legendFillHidden && a.color === e.legendLineColor && a.fill === e.legendLineFill && a.widthEmu === e.legendLineWidthEmu && a.dash === e.legendLineDash && a.dashAuthored === e.legendLineDashAuthored && a.customDash === e.legendLineCustomDash && a.cap === e.legendLineCap && a.join === e.legendLineJoin && a.compound === e.legendLineCompound && a.hidden === e.legendLineHidden ? e : {
		...e,
		legendFill: n,
		legendFillColor: r,
		legendFillHidden: i,
		legendLineColor: a.color,
		legendLineFill: a.fill,
		legendLineWidthEmu: a.widthEmu,
		legendLineDash: a.dash,
		legendLineDashAuthored: a.dashAuthored,
		legendLineCustomDash: a.customDash,
		legendLineCap: a.cap,
		legendLineJoin: a.join,
		legendLineCompound: a.compound,
		legendLineHidden: a.hidden
	};
}
function Br(e) {
	let t = e.threeD ? e.chartStyleRoles?.plotArea3D : e.chartStyleRoles?.plotArea;
	if (!t) return e;
	let n = e.plotAreaFill, r = e.plotAreaBg, i = e.plotAreaFillHidden;
	!(e.plotAreaFillPaintAuthored === !0 || (n != null || r != null) && e.plotAreaFillAutomatic !== !0 || i === !0) && t.fillNoStyle !== !0 && (t.fillHidden === !0 ? i = !0 : (n = Ui(t, 0), r = n == null ? zi(e, t, "fill", 0, 1) : null));
	let a = Pr(e, {
		color: e.plotAreaLineColor,
		fill: e.plotAreaLineFill,
		widthEmu: e.plotAreaLineWidthEmu,
		dash: e.plotAreaLineDash,
		dashAuthored: e.plotAreaLineDashAuthored,
		customDash: e.plotAreaLineCustomDash,
		cap: e.plotAreaLineCap,
		join: e.plotAreaLineJoin,
		compound: e.plotAreaLineCompound,
		hidden: e.plotAreaLineHidden,
		paintAuthored: e.plotAreaLinePaintAuthored
	}, t);
	return n === e.plotAreaFill && r === e.plotAreaBg && i === e.plotAreaFillHidden && a.color === e.plotAreaLineColor && a.fill === e.plotAreaLineFill && a.widthEmu === e.plotAreaLineWidthEmu && a.dash === e.plotAreaLineDash && a.dashAuthored === e.plotAreaLineDashAuthored && a.customDash === e.plotAreaLineCustomDash && a.cap === e.plotAreaLineCap && a.join === e.plotAreaLineJoin && a.compound === e.plotAreaLineCompound && a.hidden === e.plotAreaLineHidden ? e : {
		...e,
		plotAreaFill: n,
		plotAreaBg: r,
		plotAreaFillHidden: i,
		plotAreaLineColor: a.color,
		plotAreaLineFill: a.fill,
		plotAreaLineWidthEmu: a.widthEmu,
		plotAreaLineDash: a.dash,
		plotAreaLineDashAuthored: a.dashAuthored,
		plotAreaLineCustomDash: a.customDash,
		plotAreaLineCap: a.cap,
		plotAreaLineJoin: a.join,
		plotAreaLineCompound: a.compound,
		plotAreaLineHidden: a.hidden
	};
}
function Vr(e) {
	let t = e.chartStyleRoles?.chartArea;
	if (!t) return e;
	let n = e.chartFill, r = e.chartBg, i = e.chartFillHidden;
	!(e.chartFillPaintAuthored === !0 || n != null || i === !0) && t.fillNoStyle !== !0 && (t.fillHidden === !0 ? (n = null, r = null, i = !0) : (n = Ui(t, 0), r = n == null ? zi(e, t, "fill", 0, 1) : null, i = null));
	let a = Pr(e, {
		color: e.chartBorderColor,
		fill: e.chartBorderLineFill,
		widthEmu: e.chartBorderWidthEmu,
		dash: e.chartBorderDash,
		dashAuthored: e.chartBorderDashAuthored,
		customDash: e.chartBorderCustomDash,
		cap: e.chartBorderCap,
		join: e.chartBorderJoin,
		compound: e.chartBorderCompound,
		hidden: e.chartBorderHidden,
		paintAuthored: e.chartBorderPaintAuthored
	}, t);
	return n === e.chartFill && r === e.chartBg && i === e.chartFillHidden && a.color === e.chartBorderColor && a.fill === e.chartBorderLineFill && a.widthEmu === e.chartBorderWidthEmu && a.dash === e.chartBorderDash && a.dashAuthored === e.chartBorderDashAuthored && a.customDash === e.chartBorderCustomDash && a.cap === e.chartBorderCap && a.join === e.chartBorderJoin && a.compound === e.chartBorderCompound && a.hidden === e.chartBorderHidden ? e : {
		...e,
		chartFill: n,
		chartBg: r,
		chartFillHidden: i,
		chartBorderColor: a.color,
		chartBorderLineFill: a.fill,
		chartBorderWidthEmu: a.widthEmu,
		chartBorderDash: a.dash,
		chartBorderDashAuthored: a.dashAuthored,
		chartBorderCustomDash: a.customDash,
		chartBorderCap: a.cap,
		chartBorderJoin: a.join,
		chartBorderCompound: a.compound,
		chartBorderHidden: a.hidden
	};
}
function Hr(e) {
	if (!e.chartStyleRoles?.errorBar && !e.chartStyleRoles?.leaderLine && !e.chartStyleRoles?.trendline && !e.chartStyleRoles?.trendlineLabel && !e.chartStyleRoles?.dataLabel && !e.chartStyleRoles?.dataLabelCallout && !e.chartStyleRoles?.dataTable && !e.chartStyleRoles?.gridlineMajor && !e.chartStyleRoles?.gridlineMinor && !e.chartStyleRoles?.categoryAxis && !e.chartStyleRoles?.valueAxis && !e.chartStyleRoles?.seriesAxis && !e.chartStyleRoles?.dataPointMarker && !e.chartStyleRoles?.legend && !e.chartStyleRoles?.plotArea && !e.chartStyleRoles?.plotArea3D && !e.chartStyleRoles?.chartArea && e.chartStyleMarkerSizePt == null && e.chartStyleMarkerSymbol == null) return e;
	let t = !1, n = e.series.map((n, r) => {
		let i = Nr(e, n, r, e.series.length);
		t ||= i !== n;
		let a = e.chartStyleRoles?.errorBar ? i.errBars?.map((n) => {
			let r = Cr(e, n);
			return t ||= r.color !== n.color || r.lineWidthEmu !== n.lineWidthEmu || r.dash !== n.dash || r.hidden !== n.hidden, r;
		}) : i.errBars, o = i.seriesDataLabels;
		if (o && (e.chartStyleRoles?.dataLabel || e.chartStyleRoles?.dataLabelCallout)) {
			let n = Ir(e, o);
			t ||= n !== o, o = n;
		}
		let s = e.chartStyleRoles?.dataLabelCallout || e.chartStyleRoles?.dataLabel ? i.dataLabelOverrides?.map((r) => {
			let i = Rr(e, r, n.seriesDataLabels);
			return t ||= i !== r, i;
		}) : i.dataLabelOverrides;
		if (o && e.chartStyleRoles?.leaderLine) {
			let n = wr(e, o), r = {
				...o,
				leaderLineColor: n.color ?? void 0,
				leaderLineWidthEmu: n.widthEmu ?? void 0,
				leaderLineDash: n.dash ?? void 0,
				leaderLineHidden: n.hidden ?? void 0
			};
			t ||= r.leaderLineColor !== o.leaderLineColor || r.leaderLineWidthEmu !== o.leaderLineWidthEmu || r.leaderLineDash !== o.leaderLineDash || r.leaderLineHidden !== o.leaderLineHidden, o = r;
		}
		let c = e.chartStyleRoles?.trendline || e.chartStyleRoles?.trendlineLabel ? i.trendLines?.map((n) => {
			let r = e.chartStyleRoles?.trendline ? Tr(e, n) : n;
			return e.chartStyleRoles?.trendlineLabel && (r = Lr(e, r)), t ||= r.lineColor !== n.lineColor || r.lineWidthEmu !== n.lineWidthEmu || r.lineDash !== n.lineDash || r.lineHidden !== n.lineHidden || r !== n, r;
		}) : i.trendLines;
		return a === i.errBars && o === i.seriesDataLabels && s === i.dataLabelOverrides && c === i.trendLines ? i : {
			...i,
			errBars: a,
			seriesDataLabels: o,
			dataLabelOverrides: s,
			trendLines: c
		};
	}), r = e.dataTable;
	if (r && e.chartStyleRoles?.dataTable) {
		let n = Er(e, r);
		t ||= n.lineColor !== r.lineColor || n.lineWidthEmu !== r.lineWidthEmu || n.lineDash !== r.lineDash || n.lineHidden !== r.lineHidden, r = n;
	}
	let i = Dr(e, "gridlineMajor", e.valAxisMajorGridlines, e.valAxisGridlineColor, e.valAxisGridlineWidthEmu, e.valAxisGridlineDash), a = Dr(e, "gridlineMajor", e.catAxisMajorGridlines, e.catAxisGridlineColor, e.catAxisGridlineWidthEmu, e.catAxisGridlineDash), o = Dr(e, "gridlineMinor", e.valAxisMinorGridlines, e.valAxisMinorGridlineColor, e.valAxisMinorGridlineWidthEmu, e.valAxisMinorGridlineDash), s = Dr(e, "gridlineMinor", e.catAxisMinorGridlines, e.catAxisMinorGridlineColor, e.catAxisMinorGridlineWidthEmu, e.catAxisMinorGridlineDash), c = Or(e, e.secondaryValAxis), l = Or(e, e.secondaryCatAxis), u = Ar(e, c, "valueAxis"), d = Ar(e, l, "categoryAxis"), f = kr(e, "categoryAxis", e.catAxisLineColor, e.catAxisLineWidthEmu, e.catAxisLineDash, e.catAxisLineHidden), p = kr(e, "valueAxis", e.valAxisLineColor, e.valAxisLineWidthEmu, e.valAxisLineDash, e.valAxisLineHidden), m = e.chartStyleRoles?.categoryAxis, h = e.chartStyleRoles?.valueAxis, g = e.catAxisFontSizeHpt ?? m?.fontSizeHpt ?? null, _ = e.catAxisFontBold ?? m?.fontBold, v = e.catAxisFontItalic ?? m?.fontItalic, y = e.catAxisFontColor ?? m?.fontColor, b = e.catAxisFontFace ?? m?.fontFace, x = e.valAxisFontSizeHpt ?? h?.fontSizeHpt ?? null, S = e.valAxisFontBold ?? h?.fontBold, C = e.valAxisFontItalic ?? h?.fontItalic, w = e.valAxisFontColor ?? h?.fontColor, T = e.valAxisFontFace ?? h?.fontFace;
	return t ||= i.visible !== e.valAxisMajorGridlines || i.color !== e.valAxisGridlineColor || i.widthEmu !== e.valAxisGridlineWidthEmu || i.dash !== e.valAxisGridlineDash || a.visible !== e.catAxisMajorGridlines || a.color !== e.catAxisGridlineColor || a.widthEmu !== e.catAxisGridlineWidthEmu || a.dash !== e.catAxisGridlineDash || o.visible !== e.valAxisMinorGridlines || o.color !== e.valAxisMinorGridlineColor || o.widthEmu !== e.valAxisMinorGridlineWidthEmu || o.dash !== e.valAxisMinorGridlineDash || s.visible !== e.catAxisMinorGridlines || s.color !== e.catAxisMinorGridlineColor || s.widthEmu !== e.catAxisMinorGridlineWidthEmu || s.dash !== e.catAxisMinorGridlineDash || u !== e.secondaryValAxis || d !== e.secondaryCatAxis || f.color !== e.catAxisLineColor || f.widthEmu !== e.catAxisLineWidthEmu || f.dash !== e.catAxisLineDash || f.hidden === !0 !== e.catAxisLineHidden || p.color !== e.valAxisLineColor || p.widthEmu !== e.valAxisLineWidthEmu || p.dash !== e.valAxisLineDash || p.hidden === !0 !== e.valAxisLineHidden || g !== e.catAxisFontSizeHpt || _ !== e.catAxisFontBold || v !== e.catAxisFontItalic || y !== e.catAxisFontColor || b !== e.catAxisFontFace || x !== e.valAxisFontSizeHpt || S !== e.valAxisFontBold || C !== e.valAxisFontItalic || w !== e.valAxisFontColor || T !== e.valAxisFontFace, zr(Br(Vr(jr(t ? {
		...e,
		series: n,
		dataTable: r,
		valAxisMajorGridlines: i.visible,
		valAxisGridlineColor: i.color,
		valAxisGridlineWidthEmu: i.widthEmu,
		valAxisGridlineDash: i.dash,
		catAxisMajorGridlines: a.visible,
		catAxisGridlineColor: a.color,
		catAxisGridlineWidthEmu: a.widthEmu,
		catAxisGridlineDash: a.dash,
		valAxisMinorGridlines: o.visible,
		valAxisMinorGridlineColor: o.color,
		valAxisMinorGridlineWidthEmu: o.widthEmu,
		valAxisMinorGridlineDash: o.dash,
		catAxisMinorGridlines: s.visible,
		catAxisMinorGridlineColor: s.color,
		catAxisMinorGridlineWidthEmu: s.widthEmu,
		catAxisMinorGridlineDash: s.dash,
		secondaryValAxis: u,
		secondaryCatAxis: d,
		catAxisLineColor: f.color,
		catAxisLineWidthEmu: f.widthEmu,
		catAxisLineDash: f.dash,
		catAxisLineHidden: f.hidden === !0,
		valAxisLineColor: p.color,
		valAxisLineWidthEmu: p.widthEmu,
		valAxisLineDash: p.dash,
		valAxisLineHidden: p.hidden === !0,
		catAxisFontSizeHpt: g,
		catAxisFontBold: _,
		catAxisFontItalic: v,
		catAxisFontColor: y,
		catAxisFontFace: b,
		valAxisFontSizeHpt: x,
		valAxisFontBold: S,
		valAxisFontItalic: C,
		valAxisFontColor: w,
		valAxisFontFace: T
	} : e))));
}
function Ur(e, t, n, r, i, a, o, s, c, l, u, d = 0) {
	let f = Number.isFinite(c.gapWidthPercent) && c.gapWidthPercent >= 0 ? c.gapWidthPercent : 150, p = Math.max(0, s / (1 + f / 100));
	for (let s = 0; s < r; s++) {
		let r = t(s), f = n(s);
		if (r == null || f == null || !Number.isFinite(r) || !Number.isFinite(f)) continue;
		let m = a(r), h = o(f), g = Math.abs(h - m);
		if (!(p > 0) || !(g > 0) || !Number.isFinite(g)) continue;
		let _ = f >= r ? c.up : c.down, v = _.fillPaintAuthored === !0 || _.fill != null || _.fillColor != null || _.fillHidden === !0 ? void 0 : f >= r ? u?.upFillColor : u?.downFillColor, y = _.fillColor ?? v, b = i(s) - p / 2, x = Math.min(m, h);
		if (!_.fillHidden && (_.fill != null || y != null)) {
			let t = _.fill ? Ie(_.fill, e, b, x, p, g, d) : `#${y}`;
			t != null && (e.fillStyle = t, e.fillRect(b, x, p, g));
		}
		let S = _.linePaintAuthored === !0 || _.lineColor != null || _.lineHidden === !0, C = _.lineColor ?? (S ? void 0 : u?.lineColor), w = _.lineWidthEmu ?? (S ? void 0 : u?.lineWidthEmu);
		if (!_.lineHidden && (_.linePaintAuthored !== !0 || C != null) && (C != null || w != null)) {
			let t = e.getLineDash(), n = e.lineCap, r = e.lineJoin;
			e.strokeStyle = `#${C ?? "000000"}`, e.lineWidth = w == null ? Math.max(1, .75 * l) : Pe(w, l), e.setLineDash(Mi(_.lineDash ?? void 0, e.lineWidth)), e.lineCap = _.lineCap === "rnd" ? "round" : _.lineCap === "sq" ? "square" : "butt", e.lineJoin = _.lineJoin === "round" || _.lineJoin === "bevel" ? _.lineJoin : "miter", e.strokeRect(b, x, p, g), e.setLineDash(t), e.lineCap = n, e.lineJoin = r;
		}
	}
}
function Wr(e, t, n, r, i, a, o, s, c, l, u) {
	for (let d of t.lineGroupDecorations ?? []) {
		let f = t.series.filter((e) => e.lineGroupIndex === d.groupIndex);
		if (f.length === 0 && d.groupIndex === 0 && [
			"line",
			"stackedLine",
			"stackedLinePct"
		].includes(t.chartType) && (f = t.series.filter((e) => e.seriesType == null || e.seriesType === "line")), f.length === 0) continue;
		if (u === "foreground" && d.upDownBars && f.length >= 2) {
			let a = f[0], u = f[f.length - 1], p = {
				...d.upDownBars,
				up: xr(t, d.upDownBars.up, "upBar"),
				down: xr(t, d.upDownBars.down, "downBar")
			};
			Ur(e, (e) => o(a, e), (e) => o(u, e), n, r, i(a), i(u), s, p, c, t.legacyChartStyle === 2 ? {
				lineColor: "000000",
				lineWidthEmu: 9525,
				upFillColor: "FFFFFF",
				downFillColor: "000000"
			} : void 0, l);
		}
		if (u === "foreground") continue;
		let p = d.dropLines ? br(t, d.dropLines, "dropLine") : null;
		p && yr(e, p, c) && Sr(e, f, n, r, i, a, o);
		let m = d.hiLowLines ? br(t, d.hiLowLines, "hiLoLine") : null;
		if (m && f.length >= 2 && yr(e, m, c)) {
			let t = i(f[0]);
			for (let i = 0; i < n; i++) {
				let n = Infinity, a = -Infinity;
				for (let e of f) {
					let t = o(e, i);
					t == null || !Number.isFinite(t) || (n = Math.min(n, t), a = Math.max(a, t));
				}
				!Number.isFinite(n) || !Number.isFinite(a) || (e.beginPath(), e.moveTo(r(i), t(n)), e.lineTo(r(i), t(a)), e.stroke());
			}
		}
	}
}
function Gr(e, t, n, r) {
	return e != null && Number.isFinite(e) ? Ai(e, n, r) : t === "max" ? r : t === "min" ? n : Ai(0, n, r);
}
function Kr(e, t, n) {
	return Gr(e.catAxisCrossesAt, e.catAxisCrosses, t, n);
}
function qr(e, t, r, i, a = 0) {
	let { x: o, y: s, w: c, h: l } = r, u = pr(t), d = u.length;
	if (d === 0) return;
	let f = Xt(t, i), h = t.chartType === "stackedLinePct" ? "percentStacked" : t.chartType === "stackedLine" ? "stacked" : "standard", g = t.plotGroups?.filter((e) => e.kind === "line") ?? [{
		kind: "line",
		seriesStart: 0,
		seriesCount: t.series.length,
		categoryAxis: "primary",
		valueAxis: "primary",
		seriesAxis: "none",
		grouping: h
	}], _ = Array(t.series.length).fill(!1), y = Array(t.series.length).fill(!1), b = Array(t.series.length).fill(!1), x = Array(t.series.length).fill(null), S = t.series.map(() => Array(d).fill(0)), C = /* @__PURE__ */ new Map();
	for (let e of g) {
		let t = e.valueAxis;
		C.set(t, (C.get(t) ?? !0) && e.grouping === "percentStacked");
	}
	for (let e of g) {
		let n = e.grouping ?? "standard", r = n === "stacked" || n === "percentStacked", i = n === "percentStacked", a = t.series.slice(e.seriesStart, e.seriesStart + e.seriesCount), o = i && C.get(e.valueAxis) === !0 ? 100 : 1, s = i ? u.map((e, t) => a.reduce((e, n) => e + Math.abs(n.values[t] ?? 0), 0) || 1) : null;
		for (let t = 0; t < a.length; t++) {
			let n = e.seriesStart + t;
			_[n] = r, y[n] = i, b[n] = e.valueAxis === "secondary", x[n] = s;
			for (let e = 0; e < d; e++) {
				let c = a[t].values[e] ?? 0;
				if (!r) {
					S[n][e] = c;
					continue;
				}
				let l = t === 0 ? 0 : S[n - 1][e], u = i && s ? c / s[e] * o : c;
				S[n][e] = l + u;
			}
		}
	}
	let w = (e, t) => S[e]?.[t] ?? 0, E = g.filter((e) => e.valueAxis !== "secondary"), D = E.length > 0 && E.every((e) => e.grouping === "percentStacked"), O = t.dispBlanksAs ?? "gap", k = g.filter((e) => e.valueAxis === "secondary"), A = k.length > 0 && k.every((e) => e.grouping === "percentStacked"), M = t.secondaryValAxis && t.series.some((e, n) => b[n] || t.plotGroups == null && e.useSecondaryAxis === !0) ? t.secondaryValAxis : null, ee = new Map(t.series.map((e, t) => [e, t])), F = (e) => {
		let n = ee.get(e) ?? -1;
		return M != null && (b[n] || t.plotGroups == null && e.useSecondaryAxis === !0);
	}, ne = Infinity, re = -Infinity;
	for (let e = 0; e < d; e++) for (let n = 0; n < t.series.length; n++) {
		if (F(t.series[n]) || !_[n] && t.series[n].values[e] == null) continue;
		let r = w(n, e);
		ne = Math.min(ne, r), re = Math.max(re, r);
	}
	for (let e = 0; e < t.series.length; e++) {
		let n = t.series[e];
		F(n) || nr(n, "y", (t) => n.values[t] == null ? null : w(e, t), (e) => {
			ne = Math.min(ne, e), re = Math.max(re, e);
		});
	}
	isFinite(ne) || (ne = 0, re = 1);
	let ie = t.valAxisLogBase != null && t.valAxisLogBase >= 2;
	t.valMin == null ? D && ne > 0 && !ie && (ne = 0) : ne = D ? t.valMin * 100 : t.valMin, t.valMax == null ? D && re < 0 && (re = 0) : re = D ? t.valMax * 100 : t.valMax;
	let I = ur(e, t, c, l, i), L = I.fontPx, ae = I.topPad, R = I.bandH, oe = mn(e, t, c, l, .22, i), { legRightW: le, legLeftW: z, legTopH: de, legBottomH: B } = Ve(oe, t.legendOverlay === !0), fe = Jn(t.catAxisFontSizeHpt, l, i), pe = Jn(t.valAxisFontSizeHpt, l, i), me = T(t, c, l, i), ge = me.catFontPx, _e = me.valFontPx, ye = me.catBandH, xe = me.valBandW, Se = Vt(t), Ce = Ut(t, i), we = Wt(e, t, i), Ee = R + de + pe / 2 + 2, Oe = (Se ? Ce : m(fe, t.catAxisLabelOffsetPercent)) + ye + B, je = l - Ee - Oe, V = rr(M, t.series, je / i, "y", A, !1, (e, n) => b[n] || t.plotGroups == null && t.series[n].useSecondaryAxis === !0, (e, t, n) => !_[n] && e.values[t] == null ? null : w(n, t)), Fe = Math.max(8, Math.min(11, l / 20)), Ie = p(M?.fontSizeHpt, i) ?? Fe, H = 0;
	if (M && V && !M.hidden) {
		let n = e.font;
		e.font = Pt(Ie, Y(t, M.fontFace, "minor"), !1, M.fontItalic ?? !1);
		let r = 0;
		for (let n of V.majorLines) r = Math.max(r, e.measureText(Rn(n, M.formatCode ?? null, t.date1904, M.displayUnits)).width);
		H = r + 18, e.font = n;
	}
	let U = M && M.title ? he(M.titleFontSizeHpt, i) + 8 : 0, Le = z + Math.max(pe * 2.2 + 10 + xe, we), Re = le + c * .05 + H + U, ze = Vn(t, ne, re, je / i, D), Be = 0;
	if (!t.valAxisHidden && t.valAxisTickLabelPos !== "none" && t.plotAreaManualLayout != null && t.plotAreaManualLayout.layoutTarget !== "inner") {
		let n = e.font;
		e.font = Pt(pe, Y(t, t.valAxisFontFace, "minor"), t.valAxisFontBold ?? !1, t.valAxisFontItalic ?? !1);
		for (let n of ze.majorLines) Be = Math.max(Be, e.measureText(In(t, n, D)).width);
		e.font = n;
	}
	let W = {
		t: Ee,
		r: Re,
		b: Oe,
		l: Le
	}, He = j({
		valAxisHidden: t.valAxisHidden,
		catAxisHidden: t.catAxisHidden,
		valLabelWidth: Be,
		valLabelFontPx: pe,
		catLabelFontPx: fe,
		valLabelGapPx: t.valAxisFontSizeHpt == null ? 6 : ke(pe),
		catLabelGapPx: t.catAxisFontSizeHpt == null ? P(5, t.catAxisLabelOffsetPercent) : P(v(fe), t.catAxisLabelOffsetPercent),
		outerTextMarginPx: n * i,
		valTitleBandW: xe,
		catTitleBandH: ye,
		secondaryBandW: H + U
	}), Ue = N(t, o, s, c, l, i, {
		titleBand: I,
		legendSideReserveFrac: .22,
		legendReserve: oe,
		pad: W,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: He
	}), We = ur(e, t, Ue.plotRect.pw, l, i);
	Math.abs(We.bandH - I.bandH) > .01 && (I = We, L = I.fontPx, ae = I.topPad, R = I.bandH, Ee = R + de + pe / 2 + 2, W.t = Ee, Ue = N(t, o, s, c, l, i, {
		titleBand: I,
		legendSideReserveFrac: .22,
		legendReserve: oe,
		pad: W,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: He
	}));
	let { px0: G, py0: Ge, pw: K } = Ue.plotRect, { ph: q } = Ue.plotRect;
	if (fr(e, t, t.titleManualLayout || !t.titleRichRuns?.length ? o : G, s, t.titleManualLayout || !t.titleRichRuns?.length ? c : K, l, s + ae, L), K <= 0 || q <= 0) return;
	let Ke = Se ? Gt(e, t, K / d, i) : null;
	Ke && Ke.totalHeight > Ce && (q = Math.max(1, q - (Ke.totalHeight - Ce))), Ne(e, t, G, Ge, K, q, i, a);
	let qe = Vn(t, ne, re, q / i, D);
	if (qe.max - qe.min === 0) return;
	let Je = (e) => Ge + q - qe.frac(e) * q, Ye = V ? V.makeToY(Ge, q) : Je, J = (e) => F(e) ? Ye : Je, Xe = Je(Kr(t, qe.min, qe.max)), Ze = M && V ? Ye(Gr(t.secondaryCatAxis?.crossesAt, t.secondaryCatAxis?.crosses, V.min, V.max)) : Xe, Qe = (e) => F(e) ? Ze : Xe, $e = ue(t.catAxisLineColor, t.catAxisLineWidthEmu, i), tt = ue(t.valAxisLineColor, t.valAxisLineWidthEmu, i), nt = t.catAxisLineColor == null ? void 0 : $e.color, rt = t.catAxisLineWidthEmu == null ? void 0 : $e.width, it = t.valAxisLineColor == null ? void 0 : tt.color, at = t.valAxisLineWidthEmu == null ? void 0 : tt.width, ot = tr(t, u), st = ce(t), ct = Nn(t), lt = ot ? (e) => G + ot.positions[e] * K : st ? (e) => G + ((ct ? d - 1 - e : e) + .5) / d * K : (e) => {
		let t = ct ? d - 1 - e : e;
		return G + (d === 1 ? K / 2 : t / (d - 1) * K);
	};
	if (!t.valAxisHidden) {
		e.font = Pt(pe, Y(t, t.valAxisFontFace, "minor"), t.valAxisFontBold ?? !1, t.valAxisFontItalic ?? !1), e.textBaseline = "middle";
		let n = wn(t, i), r = Tn(t, i);
		for (let t of qe.minorLines) Cn(e, G, K, Je(t), !1, r);
		let a = Pn(t), o = t.valAxisTickLabelPos !== "none";
		for (let r of qe.majorLines) {
			let s = Je(r);
			if (a && Cn(e, G, K, s, r === 0, n), yn(e, t.valAxisMajorTickMark, "val", G, s, it, at, !1, t.valAxisLineHidden, "major", i, t.valAxisLineDash), o) {
				e.fillStyle = t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#555", e.textAlign = "right";
				let n = t.valAxisFontSizeHpt == null ? 6 : ke(pe);
				e.fillText(In(t, r, D), G - n, s);
			}
		}
		if (t.valAxisMinorTickMark && t.valAxisMinorTickMark !== "none") for (let n of qe.minorTicks) yn(e, t.valAxisMinorTickMark, "val", G, Je(n), it, at, !1, t.valAxisLineHidden, "minor", i, t.valAxisLineDash);
	}
	if (M && V && ir(e, M, V, Ye, G, K, i), !t.catAxisHidden && On(t)) {
		let n = kn(t, i);
		e.strokeStyle = n.color, e.lineWidth = n.width;
		let r = n.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
		n.dash.length > 0 && e.setLineDash(n.dash);
		let a = ot ? ot.majorTicks.map((e) => e.fraction) : jn(t, d);
		for (let t of a) {
			let n = G + t * K;
			e.beginPath(), e.moveTo(n, Ge), e.lineTo(n, Ge + q), e.stroke();
		}
		n.dash.length > 0 && e.setLineDash(r);
	}
	!t.catAxisHidden && !t.catAxisLineHidden && bn(e, G, Xe, G + K, Xe, $e.color, $e.width, t.catAxisLineDash), !t.valAxisHidden && !t.valAxisLineHidden && bn(e, G, Ge, G, Ge + q, tt.color, tt.width, t.valAxisLineDash);
	let ut = ot ? (ot.categoryBandFractions[0] ?? 0) * K : st ? K / d : d > 1 ? K / (d - 1) : K, dt = new Map(t.series.map((e, t) => [e, t]));
	Wr(e, t, d, lt, J, Qe, (e, t) => {
		let n = dt.get(e);
		return n == null ? null : w(n, t);
	}, ut, i, a, "background");
	let ft = Math.max(1, 2.25 * i), pt = Math.max(2, 2.5 * i), mt = Jn(t.dataLabelFontSizeHpt, l, i), ht = [];
	for (let n = 0; n < t.series.length; n++) {
		let p = t.series[n], m = _[n], h = x[n], g = jt(p.dataPointOverrides), v = At(n, p), b = J(p);
		e.strokeStyle = p.lineColor ? `#${p.lineColor}` : v, e.lineWidth = p.lineWidthEmu == null ? ft : Pe(p.lineWidthEmu, i), e.setLineDash(Mi(p.chartexStyle?.lineDash ?? void 0, e.lineWidth)), e.lineCap = p.chartexStyle?.lineCap === "rnd" ? "round" : p.chartexStyle?.lineCap === "sq" ? "square" : "butt", e.lineJoin = p.chartexStyle?.lineJoin === "round" || p.chartexStyle?.lineJoin === "bevel" ? p.chartexStyle.lineJoin : "miter", e.beginPath();
		let S = p.smooth === !0, C = [], T = () => {
			C.length !== 0 && (e.moveTo(C[0].x, C[0].y), ji(e, C, S), C = []);
		};
		for (let e = 0; e < d; e++) {
			if (!m && p.values[e] == null) {
				if (O === "gap") {
					T();
					continue;
				}
				if (O === "span") continue;
			}
			C.push({
				x: lt(e),
				y: b(w(n, e))
			});
		}
		T(), p.lineHidden !== !0 && e.stroke();
		let E = (e) => w(n, e);
		for (let n of p.errBars ?? []) Pi(e, p, Cr(t, n), d, lt, b, E, v);
		e.fillStyle = v;
		let D = p.showMarker !== !1 && p.markerSymbol !== "none", k = D || Me(p), A = be(p), j = (p.dataLabelOverrides?.length ?? 0) > 0 || p.seriesDataLabels != null;
		j && ht.push(() => {
			Ii(e, p, u, d, lt, b, E, q, i, t.date1904 ?? !1, m || O === "zero", Y(t, t.dataLabelFontFace, "minor"), t.dataLabelPosition ?? "r", {
				x: o,
				y: Ge,
				w: c,
				h: q
			}, {
				x: o,
				y: s,
				w: c,
				h: l
			}, y[n] && h ? (e) => (p.values[e] ?? 0) / h[e] : void 0, (e) => {
				if (!k) return 0;
				let t = g.get(e);
				return !A && !De(t) ? pt : Te(p, t, "circle", D) === "none" ? 0 : (t?.markerSize ?? p.markerSize ?? 5) / 2 * i;
			}, (e) => Y(t, e, "minor"), F(p) ? M?.displayUnits : t.valAxisDisplayUnits, (e) => f(n, e), (e) => hr(t, e, F(p) && V ? V.max : qe.max), a);
		});
		for (let t = 0; t < d; t++) {
			if (!m && p.values[t] == null && O !== "zero") continue;
			let r = w(n, t);
			if (k) {
				let n = g.get(t);
				if (A || De(n)) {
					let o = Te(p, n, "circle", D);
					if (o !== "none") {
						let s = n?.markerSize ?? p.markerSize ?? 5, c = se(p, n, t, v), l = n?.markerLine ?? p.markerLine ?? null, u = n?.markerLineWidthEmu ?? p.markerLineWidthEmu;
						Si(e, lt(t), b(r), o, s, c, l, i, u == null ? void 0 : Pe(u, i), ve(p, n, t), a);
					}
				} else e.beginPath(), e.arc(lt(t), b(r), pt, 0, Math.PI * 2), e.fill();
			}
		}
		t.showDataLabels && !j && ht.push(() => {
			for (let r = 0; r < d; r++) {
				if (!m && p.values[r] == null && O !== "zero") continue;
				let i = w(n, r), a = et({
					showValue: !0,
					sourceValue: p.values[r] ?? 0,
					valueDivisor: Ln(F(p) ? M?.displayUnits : t.valAxisDisplayUnits),
					formatCode: t.dataLabelFormatCode ?? p.valFormatCode ?? null,
					date1904: t.date1904
				});
				Ti(e, lt(r), b(i), a, t.dataLabelPosition ?? "r", mt, t.dataLabelFontColor ?? void 0, t.dataLabelFontBold ?? !1, Y(t, t.dataLabelFontFace, "minor"), k ? pt + 1 : 2, {
					x: G,
					y: Ge,
					w: K,
					h: q
				});
			}
		}), Gn(e, p, v, lt, b, i, void 0, {
			chart: t,
			chartRect: r,
			plotRect: {
				x: G,
				y: Ge,
				w: K,
				h: q
			},
			shapeRotationDeg: a
		});
	}
	Wr(e, t, d, lt, J, Qe, (e, t) => {
		let n = dt.get(e);
		return n == null ? null : w(n, t);
	}, ut, i, a, "foreground");
	for (let e of ht) e();
	if (!t.catAxisHidden) {
		let n = t.catAxisFontColor ? `#${t.catAxisFontColor}` : "#555";
		e.fillStyle = n, e.textAlign = "center", e.textBaseline = "top", e.font = Pt(fe, Y(t, t.catAxisFontFace, "minor"), t.catAxisFontBold ?? !1, t.catAxisFontItalic ?? !1);
		let r = Math.max(1, Math.floor(t.catAxisTickMarkSkip ?? 1)), a = ot ? ot.majorTicks.map((e) => G + e.fraction * K) : Array.from({ length: Math.ceil(d / r) }, (e, t) => lt(t * r));
		for (let n of a) yn(e, t.catAxisMajorTickMark, "cat", Xe, n, nt, rt, !1, t.catAxisLineHidden, "major", i, t.catAxisLineDash);
		if (t.catAxisMinorTickMark && t.catAxisMinorTickMark !== "none" && ot) for (let n of ot.minorTicks) yn(e, t.catAxisMinorTickMark, "cat", Xe, G + n.fraction * K, nt, rt, !1, t.catAxisLineHidden, "minor", i, t.catAxisLineDash);
		let o = !Se && Zn(t), s = Math.max(1, Math.floor(t.catAxisTickLabelSkip ?? 1)), c = $n(t), l = ot ? ot.majorTicks.map((e) => ({
			label: Ae(String(e.serial), t.catAxisFormatCode, t.date1904),
			x: G + e.fraction * K,
			categoryIndex: -1
		})) : Array.from({ length: Math.ceil(d / s) }, (e, n) => {
			let r = n * s;
			return {
				label: Ae((u[r] ?? "").toString(), t.catAxisFormatCode, t.date1904),
				x: lt(r),
				categoryIndex: r
			};
		});
		for (let r of l) {
			let i = r.categoryIndex < 0 ? null : te(r.categoryIndex, d, ce(t), Nn(t), t.catAxisLabelAlignment), a = i ? G + i.fraction * K : r.x;
			if (!o) continue;
			e.textAlign = i?.textAlign ?? "center", e.fillStyle = n;
			let s = r.label;
			if (!s) continue;
			let l = P(t.catAxisFontSizeHpt == null ? 5 : v(fe), t.catAxisLabelOffsetPercent), u = t.catAxisTickLabelPos ?? "nextTo";
			er(e, s, a, (u === "nextTo" ? Xe : u === "high" ? Ge : Ge + q) + l, c);
		}
	}
	if (M && V) {
		let n = t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#555";
		ar(e, t, M, V, Ye, r, G, Ge, K, q, i, Ie, H, n, t.date1904);
	}
	Ke && Kt(e, t, Ke, G, Ge + q, K, o + z, i), _n(e, t, oe, o, s, c, l, G, Ge, K, q, R + 2, i), Bt(e, t, o, s, c, l, G, Ge, K, q, z, B, ge, _e);
}
function Jr(e, t, n, r, i = 0) {
	let { x: a, y: o, w: s, h: c } = n, l = pr(t), u = l.length;
	if (u === 0) return;
	let d = Xt(t, r), f = t.plotGroups?.find((e) => e.kind === "stock"), h = f ? t.series.slice(f.seriesStart, f.seriesStart + f.seriesCount) : t.series, g = t.plotGroups == null ? [] : t.plotGroups.filter((e) => e.kind === "line").flatMap((e) => t.series.slice(e.seriesStart, e.seriesStart + e.seriesCount)), _ = [...h, ...g], v = new Map(t.series.map((e, t) => [e, t])), y = h.length >= 4, b = y ? 0 : -1, x = +!!y, S = y ? 2 : 1, C = y ? 3 : 2, w = h[x], E = h[S], D = h[C], O = b >= 0 ? h[b] : void 0, k = h[0], A = h.at(-1), j = t.secondaryValAxis && _.some((e) => e.useSecondaryAxis === !0) ? t.secondaryValAxis : null, M = (e) => j != null && e.useSecondaryAxis === !0, ee = ur(e, t, s, c, r), F = ee.fontPx, ne = ee.topPad, re = ee.bandH, ie = mn(e, t, s, c, .22, r), { legRightW: I, legLeftW: L, legBottomH: R, legTopH: oe } = Ve(ie, t.legendOverlay === !0), le = Jn(t.catAxisFontSizeHpt, c, r), z = Jn(t.valAxisFontSizeHpt, c, r), de = T(t, s, c, r), B = de.catFontPx, fe = de.valFontPx, pe = de.catBandH, me = de.valBandW, ge = Vt(t), _e = Ut(t, r), ye = Wt(e, t, r), xe = re + oe + z / 2 + 2, Se = (ge ? _e : m(le, t.catAxisLabelOffsetPercent)) + pe + R, Ce = rr(j, _, (c - xe - Se) / r), we = Math.max(8, Math.min(11, c / 20)), Ee = p(j?.fontSizeHpt, r) ?? we, De = 0;
	if (j && Ce && !j.hidden) {
		let n = e.font;
		e.font = Pt(Ee, Y(t, j.fontFace, "minor"), j.fontBold ?? !1, j.fontItalic ?? !1);
		let r = 0;
		for (let n of Ce.majorLines) r = Math.max(r, e.measureText(Rn(n, j.formatCode ?? null, t.date1904, j.displayUnits)).width);
		De = r + 18, e.font = n;
	}
	let Oe = j?.title ? he(j.titleFontSizeHpt, r) + 8 : 0, ke = {
		t: xe,
		r: I + s * .05 + De + Oe,
		b: Se,
		l: L + Math.max(z * 2.2 + 10 + me, ye)
	};
	fr(e, t, a, o, s, c, o + ne, F);
	let je = N(t, a, o, s, c, r, {
		titleBand: ee,
		legendSideReserveFrac: .22,
		legendReserve: ie,
		pad: ke,
		honorPlotAreaManualLayout: !0
	}), { px0: V, py0: Fe, pw: H } = je.plotRect, { ph: U } = je.plotRect;
	if (H <= 0 || U <= 0) return;
	let Le = ge ? Gt(e, t, H / u, r) : null;
	Le && Le.totalHeight > _e && (U = Math.max(1, U - (Le.totalHeight - _e))), Ne(e, t, V, Fe, H, U, r, i);
	let Re = Infinity, ze = -Infinity;
	for (let e of _) if (!M(e)) for (let t = 0; t < u; t++) {
		let n = e.values[t];
		n != null && (Re = Math.min(Re, n), ze = Math.max(ze, n));
	}
	for (let e of _) M(e) || nr(e, "y", (t) => e.values[t] ?? null, (e) => {
		Re = Math.min(Re, e), ze = Math.max(ze, e);
	});
	isFinite(Re) || (Re = 0, ze = 1), t.valMin != null && (Re = t.valMin), t.valMax != null && (ze = t.valMax);
	let Be = Vn(t, Re, ze, U / r);
	if (Be.max - Be.min === 0) return;
	let W = (e) => Fe + U - Be.frac(e) * U, He = Ce?.makeToY(Fe, U) ?? W, Ue = (e) => M(e) ? He : W, We = ce(t), G = Nn(t), Ge = tr(t, l), K = Ge ? (e) => V + Ge.positions[e] * H : We ? (e) => V + ((G ? u - 1 - e : e) + .5) / u * H : (e) => {
		let t = G ? u - 1 - e : e;
		return V + (u === 1 ? H / 2 : t / (u - 1) * H);
	};
	if (!t.valAxisHidden) {
		e.font = Pt(z, Y(t, t.valAxisFontFace, "minor"), t.valAxisFontBold ?? !1, t.valAxisFontItalic ?? !1), e.textBaseline = "middle";
		let n = wn(t, r), i = Tn(t, r);
		for (let t of Be.minorLines) Cn(e, V, H, W(t), !1, i);
		let a = Pn(t), o = t.valAxisTickLabelPos !== "none";
		for (let i of Be.majorLines) {
			let s = W(i);
			a && Cn(e, V, H, s, i === 0, n), yn(e, t.valAxisMajorTickMark, "val", V, s, void 0, void 0, !1, t.valAxisLineHidden, "major", r, t.valAxisLineDash), o && (e.fillStyle = t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#555", e.textAlign = "right", e.fillText(In(t, i, !1), V - 6, s));
		}
		for (let n of Be.minorTicks) yn(e, t.valAxisMinorTickMark, "val", V, W(n), void 0, void 0, !1, t.valAxisLineHidden, "minor", r, t.valAxisLineDash);
	}
	j && Ce && ir(e, j, Ce, He, V, H, r);
	let Ke = ue(t.catAxisLineColor, t.catAxisLineWidthEmu, r), qe = ue(t.valAxisLineColor, t.valAxisLineWidthEmu, r);
	if (!t.catAxisHidden && !t.catAxisLineHidden && bn(e, V, Fe + U, V + H, Fe + U, Ke.color, Ke.width, t.catAxisLineDash), !t.valAxisHidden && !t.valAxisLineHidden && bn(e, V, Fe, V, Fe + U, qe.color, qe.width, t.valAxisLineDash), t.stockDropLines) {
		let n = br(t, t.stockDropLines, "dropLine"), i = {
			...n,
			color: n.color ?? (n.paintAuthored === !0 ? null : t.stockAutomaticStyle?.lineColor),
			widthEmu: n.widthEmu ?? t.stockAutomaticStyle?.lineWidthEmu
		};
		(i.paintAuthored !== !0 || i.color != null) && (i.color != null || i.widthEmu != null || i.dash != null) && yr(e, i, r) && Sr(e, h, u, K, (e) => Ue(e), () => Fe + U, (e, t) => e.values[t] ?? null);
	}
	if (t.stockHiLowLines === !0 && w != null && E != null && w && E) {
		let n = br(t, t.stockHiLowLineStyle ?? { color: t.stockHiLowLineColor ?? null }, "hiLoLine"), i = {
			...n,
			color: n.color ?? (n.paintAuthored === !0 ? null : t.stockAutomaticStyle?.lineColor),
			widthEmu: n.widthEmu ?? t.stockAutomaticStyle?.lineWidthEmu
		};
		if ((i.paintAuthored !== !0 || i.color != null) && (i.color != null || i.widthEmu != null || i.dash != null) && yr(e, i, r)) for (let t = 0; t < u; t++) {
			let n = w.values[t], r = E.values[t];
			if (n == null || r == null) continue;
			let i = K(t), a = Ue(w), o = Ue(E);
			e.beginPath(), e.moveTo(i, a(n)), e.lineTo(i, o(r)), e.stroke();
		}
	}
	let Je = (t, n, a) => {
		if (!t) return;
		let o = At(n, t), s = jt(t.dataPointOverrides), c = t.markerSymbol != null && t.markerSymbol !== "none" && be(t), l = Math.max(3, H / u * .22);
		for (let n = 0; n < u; n++) {
			let u = t.values[n];
			if (u == null) continue;
			let d = K(n), f = Ue(t)(u), p = s.get(n);
			if (p?.markerSymbol === "none" || p?.markerSymbol == null && t.markerSymbol === "none") continue;
			if (c || p?.markerSymbol != null && p.markerSymbol !== "none") {
				Si(e, d, f, p?.markerSymbol ?? t.markerSymbol ?? "circle", p?.markerSize ?? t.markerSize ?? 3, se(t, p, n, o), p?.markerLine ?? t.markerLine ?? null, r, (p?.markerLineWidthEmu ?? t.markerLineWidthEmu) == null ? void 0 : Pe(p?.markerLineWidthEmu ?? t.markerLineWidthEmu, r), ve(t, p, n), i);
				continue;
			}
			e.strokeStyle = o, e.lineWidth = Math.max(1, .75 * r), e.beginPath();
			let m = a === "right" ? d : a === "left" ? d - l : d - l / 2, h = a === "right" ? d + l : a === "left" ? d : d + l / 2;
			e.moveTo(m, f), e.lineTo(h, f), e.stroke();
		}
	};
	for (let a of g) {
		let o = v.get(a) ?? 0, s = At(Math.max(0, o), a), c = Ue(a), l = jt(a.dataPointOverrides);
		if (a.lineHidden !== !0) {
			let n = Gi(t, a.chartexStyle, o, t.series.length), l = n === void 0 ? a.lineColor ? `#${a.lineColor}` : s : n == null ? null : Ie(n, e, V, Fe, H, U, i);
			if (l != null) {
				e.save(), e.strokeStyle = l, e.lineWidth = a.lineWidthEmu == null ? Math.max(1, 2.25 * r) : Pe(a.lineWidthEmu, r), e.setLineDash(ae(a.chartexStyle?.lineCustomDash, a.chartexStyle?.lineDash, e.lineWidth)), e.lineCap = a.chartexStyle?.lineCap === "rnd" ? "round" : a.chartexStyle?.lineCap === "sq" ? "square" : "butt", e.lineJoin = a.chartexStyle?.lineJoin === "round" || a.chartexStyle?.lineJoin === "bevel" ? a.chartexStyle.lineJoin : "miter", e.beginPath();
				let t = [], n = () => {
					t.length !== 0 && (e.moveTo(t[0].x, t[0].y), ji(e, t, a.smooth === !0), t = []);
				};
				for (let e = 0; e < u; e++) {
					let r = a.values[e];
					if (r == null) {
						n();
						continue;
					}
					t.push({
						x: K(e),
						y: c(r)
					});
				}
				n(), e.stroke(), e.restore();
			}
		}
		let d = a.showMarker !== !1 && a.markerSymbol !== "none";
		if (d || Me(a)) for (let t = 0; t < u; t++) {
			let n = a.values[t];
			if (n == null) continue;
			let o = l.get(t), u = Te(a, o, "circle", d);
			u !== "none" && Si(e, K(t), c(n), u, o?.markerSize ?? a.markerSize ?? 5, se(a, o, t, s), o?.markerLine ?? a.markerLine ?? null, r, (o?.markerLineWidthEmu ?? a.markerLineWidthEmu) == null ? void 0 : Pe(o?.markerLineWidthEmu ?? a.markerLineWidthEmu, r), ve(a, o, t), i);
		}
		Gn(e, a, s, K, c, r, void 0, {
			chart: t,
			chartRect: n,
			plotRect: {
				x: V,
				y: Fe,
				w: H,
				h: U
			},
			shapeRotationDeg: i
		});
	}
	if (t.stockUpDownBars && k && A) {
		let n = t.stockUpDownBarStyle ?? {
			gapWidthPercent: 150,
			up: {},
			down: {}
		}, a = {
			...n,
			up: xr(t, n.up, "upBar"),
			down: xr(t, n.down, "downBar")
		}, o = Ge ? (Ge.categoryBandFractions[0] ?? 0) * H : We ? H / u : u > 1 ? H / (u - 1) : H;
		Ur(e, (e) => k.values[e] ?? null, (e) => A.values[e] ?? null, u, K, Ue(k), Ue(A), o, a, r, t.stockAutomaticStyle ?? void 0, i);
	}
	Je(O, b, "left"), (w?.markerSymbol != null || w && Me(w)) && Je(w, x, "both"), (E?.markerSymbol != null || E && Me(E)) && Je(E, S, "both"), Je(D, C, "right");
	for (let n of _) {
		let r = At(v.get(n) ?? 0, n);
		for (let i of n.errBars ?? []) Pi(e, n, Cr(t, i), u, K, Ue(n), (e) => n.values[e] ?? 0, r);
	}
	if (h.length < 3) for (let e = 0; e < h.length; e++) Je(h[e], e, "both");
	for (let a of _) {
		let o = v.get(a) ?? 0;
		wi(e, a, l, !0, K, Ue(a), U, r, t.date1904, Y(t, t.dataLabelFontFace, "minor"), t.dataLabelPosition ?? "r", {
			x: V,
			y: Fe,
			w: H,
			h: U
		}, n, (e) => Y(t, e, "minor"), M(a) ? j?.displayUnits : t.valAxisDisplayUnits, (e) => d(o, e), (e) => hr(t, e, M(a) ? Ce?.max ?? Be.max : Be.max), i);
	}
	if (!t.catAxisHidden) {
		let n = Math.max(1, Math.floor(t.catAxisTickLabelSkip ?? 1)), i = t.catAxisFontColor ? `#${t.catAxisFontColor}` : "#555";
		e.fillStyle = i, e.textAlign = "center", e.textBaseline = "top", e.font = Pt(le, Y(t, t.catAxisFontFace, "minor"), t.catAxisFontBold ?? !1, t.catAxisFontItalic ?? !1);
		let a = Ge ? (Ge.categoryBandFractions[0] ?? 0) * H - 4 : H / u * n - 4, o = !ge && Zn(t), s = $n(t), c = Ge && Ge.majorTicks.length > 0 ? Ge.majorTicks.map((e) => ({
			label: Ae(String(e.serial), t.catAxisFormatCode, t.date1904),
			x: V + e.fraction * H,
			categoryIndex: -1
		})) : Array.from({ length: Math.ceil(u / n) }, (e, r) => {
			let i = r * n;
			return {
				label: Ae((l[i] ?? "").toString(), t.catAxisFormatCode, t.date1904),
				x: K(i),
				categoryIndex: i
			};
		});
		for (let n of c) {
			let c = n.categoryIndex < 0 ? null : te(n.categoryIndex, u, ce(t), Nn(t), t.catAxisLabelAlignment), l = c ? V + c.fraction * H : n.x;
			if (yn(e, t.catAxisMajorTickMark, "cat", Fe + U, l, Ke.color, Ke.width, !1, t.catAxisLineHidden, "major", r, t.catAxisLineDash), !o) continue;
			e.textAlign = c?.textAlign ?? "center", e.fillStyle = i;
			let d = n.label;
			er(e, q(e, d, s === 0 ? a : U * .4), l, Fe + U + P(5, t.catAxisLabelOffsetPercent), s);
		}
		if (t.catAxisMinorTickMark && t.catAxisMinorTickMark !== "none" && Ge) for (let n of Ge.minorTicks) yn(e, t.catAxisMinorTickMark, "cat", Fe + U, V + n.fraction * H, void 0, void 0, !1, t.catAxisLineHidden, "minor", r, t.catAxisLineDash);
	}
	if (j && Ce) {
		let i = t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#555";
		ar(e, t, j, Ce, He, n, V, Fe, H, U, r, Ee, De, i, t.date1904);
	}
	Le && Kt(e, t, Le, V, Fe + U, H, a + L, r), _n(e, t, ie, a, o, s, c, V, Fe, H, U, re + 2, r), Bt(e, t, a, o, s, c, V, Fe, H, U, L, R, B, fe);
}
var Yr = (e) => e[0] + e[2] > e[1] + e[3] ? [[
	0,
	1,
	2
], [
	0,
	2,
	3
]] : [[
	0,
	1,
	3
], [
	1,
	2,
	3
]], Xr = 2e5, Zr = 1.25;
function Qr(e, t, n) {
	if (e.length === 0) return [];
	let r = [], i = (e) => n ? e.value >= t : e.value <= t, a = e[e.length - 1], o = i(a);
	for (let n of e) {
		let e = i(n);
		if (e !== o) {
			let e = n.value - a.value, i = e === 0 ? 0 : (t - a.value) / e;
			r.push({
				x: a.x + (n.x - a.x) * i,
				y: a.y + (n.y - a.y) * i,
				depth: a.depth + (n.depth - a.depth) * i,
				value: t
			});
		}
		e && r.push(n), a = n, o = e;
	}
	return r;
}
function $r(e, t, n, i, a = 0) {
	let { x: o, y: c, w: l, h: u } = n, d = pr(t), h = t.series, g = d.length, _ = h.length;
	if (g < 2 || _ < 2) return;
	let v = Infinity, y = -Infinity;
	for (let e of h) for (let t = 0; t < g; t++) {
		let n = e.values[t];
		n == null || !Number.isFinite(n) || (v = Math.min(v, n), y = Math.max(y, n));
	}
	if (!Number.isFinite(v) || !Number.isFinite(y)) return;
	t.valMin != null && (v = t.valMin), t.valMax != null && (y = t.valMax);
	let b = {
		...t.threeD ?? {},
		rotationX: t.threeD?.rotationX ?? 15,
		rotationY: t.threeD?.rotationY ?? 20,
		rightAngleAxes: t.threeD?.rightAngleAxes ?? !1,
		perspective: t.threeD?.perspective ?? 30
	}, x = $e(b), S = rt(b), C = Ze(b, n, {
		sceneDepthScale: Zr,
		perspectiveTangentGain: S
	}), T;
	if (C) {
		let e = C.topology.axisX === "min" ? C.front.x : C.front.x + C.front.w, t = C.project(e, C.front.y + C.front.h, C.topology.nearDepth), n = C.project(e, C.front.y, C.topology.nearDepth);
		T = Math.hypot(n.x - t.x, n.y - t.y) / i;
	}
	let E = t.valAxisMajorUnit == null ? qe(v, y, T) : null, D = Vn(E == null ? t : {
		...t,
		valAxisMajorUnit: E
	}, v, y, T), O = D.step;
	if (!(O > 0) || !Number.isFinite(O)) return;
	let k = t.valMin ?? D.min, A = t.valMax ?? Math.max(k + O, k + Math.ceil((y - k) / O) * O), j = A - k;
	if (!(j > 0) || !Number.isFinite(j)) return;
	let ee = Math.ceil(j / O), F = Math.floor(j / O + 1e-9) + 1, re = (g - 1) * (_ - 1) * 2;
	if (!Number.isSafeInteger(ee) || !Number.isSafeInteger(F) || ee < 1 || F < 2 || re < 1 || ee > 512 || F > 512 || ee > Math.floor(Xr / re) || F > Xr) return;
	let ie = ee, L = Mn(t) ? (e) => 1 - (e - k) / j : (e) => (e - k) / j, R = Array.from({ length: F }, (e, t) => k + t * O), oe = (e, t) => {
		let n = Math.min(e, t), r = Math.max(e, t), i = Math.max(1, Math.floor((n - k) / O) + 1), a = Math.min(ie - 1, Math.ceil((r - k) / O) - 1), o = [0];
		if (e !== t) for (let n = i; n <= a; n++) o.push((k + n * O - e) / (t - e));
		return o.push(1), o.sort((e, t) => e - t), o;
	}, se = Array.from({ length: ie }, (e, n) => it(t.themeAccentColors ?? [], n, ie, t.legacyChartStyle ?? 2) ?? (h[n]?.color ? `#${h[n].color}` : At(n, h[n]))), le = new Map((t.surfaceBandFormats ?? []).map((e) => [e.idx, e])), z = t.chartStyleRoles?.dataPoint3D, ue = t.chartStyleRoles?.dataPointWireframe, de = (e) => e?.lineNoStyle !== !0 && (e?.linePaintAuthored === !0 || e?.lineHidden === !0 || (e?.lineColors?.length ?? 0) > 0 || (e?.linePaints?.length ?? 0) > 0), B = t.surfaceWireframe === !0 ? [] : Array.from({ length: ie }, (e, t) => {
		let n = le.get(t), i;
		return i = n?.fillHidden === !0 ? null : n?.fill ? n.fill : r(n?.style, t), i === void 0 ? r(z, t) : i;
	}), fe = t.surfaceWireframe === !0 ? [] : Array.from({ length: ie }, (e, t) => {
		let n = le.get(t), r;
		return r = n?.lineHidden === !0 ? null : n?.lineColor ? {
			fillType: "solid",
			color: n.lineColor
		} : f(n?.style, t), r === void 0 ? f(z, t) : r;
	}), me = (e, t) => {
		let n = e?.lineNoStyle === !0 ? void 0 : e, r = n?.lineDashAuthored === !0 || n?.lineDash != null || n?.lineCustomDash != null;
		return {
			lineWidthEmu: n?.lineWidthEmu ?? t.lineWidthEmu,
			lineDash: r ? n?.lineDash : t.lineDash,
			lineCustomDash: r ? n?.lineCustomDash : t.lineCustomDash,
			lineCap: n?.lineCap ?? t.lineCap,
			lineJoin: n?.lineJoin ?? t.lineJoin,
			lineCompound: n?.lineCompound ?? t.lineCompound
		};
	}, he = ue?.lineColorIndex, ge;
	ge = de(ue) ? ue?.lineHidden === !0 ? f(ue, 0) : he == null ? null : f(ue, he) : void 0;
	let _e = ue?.lineNoStyle === !0 ? {
		paint: void 0,
		lineWidthEmu: void 0,
		lineDash: void 0,
		lineCustomDash: void 0,
		lineCap: void 0,
		lineJoin: void 0,
		lineCompound: void 0
	} : {
		paint: ge,
		lineWidthEmu: ue?.lineWidthEmu,
		lineDash: ue?.lineDash,
		lineCustomDash: ue?.lineCustomDash,
		lineCap: ue?.lineCap,
		lineJoin: ue?.lineJoin,
		lineCompound: ue?.lineCompound
	}, ve = h[0], ye;
	ye = ve?.lineHidden === !0 ? null : ve?.lineColor == null ? f(ve?.chartexStyle, 0) : {
		fillType: "solid",
		color: ve.lineColor
	};
	let be = me(ve?.chartexStyle, _e), xe = {
		paint: ye === void 0 ? ge : ye,
		...be,
		lineWidthEmu: ve?.lineWidthEmu ?? be.lineWidthEmu
	};
	xe.lineCompound != null && (xe.paint = null);
	let Se = Array.from({ length: ie }, (e, t) => {
		let n = le.get(t);
		if (n) return n.lineHidden === !0 ? null : n.lineColor == null ? f(n.style, t) : {
			fillType: "solid",
			color: n.lineColor
		};
	}), Ce = Se.map((e, t) => {
		let n = le.get(t), r = me(n?.style, xe), i = {
			paint: e === void 0 ? xe.paint : e,
			...r,
			lineWidthEmu: n?.lineWidthEmu ?? r.lineWidthEmu
		};
		return i.lineCompound != null && (i.paint = null), i;
	}), we = (e, t) => e.paint !== void 0 && e.paint === t.paint && e.lineWidthEmu === t.lineWidthEmu && e.lineDash === t.lineDash && e.lineCustomDash === t.lineCustomDash && e.lineCap === t.lineCap && e.lineJoin === t.lineJoin && e.lineCompound === t.lineCompound, Te = (e, t) => {
		let n = oe(e, t), r = [];
		for (let i = 0; i < n.length - 1; i++) {
			let a = n[i], o = n[i + 1], s = e + (t - e) * ((a + o) / 2), c = Math.max(0, Math.min(ie - 1, Math.floor((s - k) / O))), l = r[r.length - 1];
			l && Se[l.band] === void 0 && Se[c] === void 0 && we(Ce[l.band], Ce[c]) ? l.to = o : r.push({
				from: a,
				to: o,
				band: c
			});
		}
		return r;
	};
	if (t.surfaceWireframe === !0) {
		let e = 0, t = (t, n) => t == null || n == null || !Number.isFinite(t) || !Number.isFinite(n) ? !0 : (e += Te(t, n).length, e <= Xr);
		for (let e = 0; e < _; e++) for (let n = 0; n < g - 1; n++) if (!t(h[e].values[n], h[e].values[n + 1])) return;
		for (let e = 0; e < g; e++) for (let n = 0; n < _ - 1; n++) if (!t(h[n].values[e], h[n + 1].values[e])) return;
		for (let t = 0; t < _ - 1; t++) for (let n = 0; n < g - 1; n++) {
			let r = [
				h[t].values[n],
				h[t].values[n + 1],
				h[t + 1].values[n + 1],
				h[t + 1].values[n]
			];
			if (r.some((e) => e == null || !Number.isFinite(e))) continue;
			let i = r;
			for (let t of Yr(i)) {
				let n = Math.min(...t.map((e) => i[e])), r = Math.max(...t.map((e) => i[e])), a = Math.max(1, Math.floor((n - k) / O) + 1), o = Math.min(ie - 1, Math.ceil((r - k) / O) - 1);
				if (!(o < a) && (e += o - a + 1, e > Xr)) return;
			}
		}
	}
	let De = Se.some((e) => e === void 0), Oe = [
		{
			surface: t.threeD?.floor,
			role: "floor"
		},
		{
			surface: t.threeD?.sideWall,
			role: "wall"
		},
		{
			surface: t.threeD?.backWall,
			role: "wall"
		}
	].map(({ surface: e, role: n }) => M(t, e, n)), ke = 0;
	for (let e of [
		...B,
		...fe,
		...t.surfaceWireframe === !0 && De ? [xe.paint] : [],
		...t.surfaceWireframe === !0 ? Se.filter((e) => e !== void 0) : [],
		...Oe.flatMap((e) => [e.fill, e.line])
	]) {
		if (e == null) continue;
		let t = Fe(e);
		if (e.fillType === "gradient" && t > ea || t > ta - ke) return;
		ke += t;
	}
	let Ae = Array.from({ length: ie }, (e, t) => {
		let n = k + t * O, r = Math.min(A, n + O);
		return `${pe(n)}-${pe(r)}`;
	}), je = {
		...t,
		series: Ae.map((e, t) => ({
			name: e,
			color: se[t].replace(/^#/, ""),
			values: []
		}))
	};
	Math.abs(b.rotationX) === 90 && je.series.reverse();
	let Me = mn(e, je, l, u, .22, i), { legRightW: V, legLeftW: H, legTopH: U, legBottomH: Re } = Ve(Me, t.legendOverlay === !0), ze = ur(e, t, l, u, i), Be = Jn(t.catAxisFontSizeHpt, u, i), W = t.threeD?.seriesAxis, He = p(W?.fontSizeHpt, i) ?? Be, { px0: Ue, py0: We, pw: G, ph: Ge } = N(t, o, c, l, u, i, {
		titleBand: ze,
		legendSideReserveFrac: .22,
		legendReserve: Me,
		pad: {
			t: ze.bandH + U + He / 2,
			r: V + He * 3.2 + 12,
			b: m(Be, t.catAxisLabelOffsetPercent) + Re,
			l: H + Be * 1.5
		},
		honorPlotAreaManualLayout: !0
	}).plotRect;
	if (!(G > 0) || !(Ge > 0)) return;
	fr(e, t, t.titleManualLayout || !t.titleRichRuns?.length ? o : Ue, c, t.titleManualLayout || !t.titleRichRuns?.length ? l : G, u, c + ze.topPad, ze.fontPx), Ne(e, t, Ue, We, G, Ge, i, a);
	let K = Ze(b, {
		x: Ue,
		y: We,
		w: G,
		h: Ge
	}, {
		sceneDepthScale: Zr,
		perspectiveTangentGain: S
	});
	if (!K) return;
	K = tt(K, t.threeD ?? {}, {
		x: Ue,
		y: We,
		w: G,
		h: Ge
	});
	let q = x || Math.abs(b.rotationX) === 90 && b.rotationY === 0 && b.rightAngleAxes === !1 && b.perspective === 0, { front: J } = K, Xe = t.catAxisOrientation === "maxMin", et = ce(t), at = (e) => J.x + w(e, g, et, Xe) * J.w, ot = W?.orientation === "maxMin", st = (e) => w(e, _, !1, ot), ct = (e) => J.y + J.h - L(e) * J.h, lt = [], ut = [], dt = (e, t) => {
		let n = (n) => ({
			x: e.x + (t.x - e.x) * n,
			y: e.y + (t.y - e.y) * n,
			depth: e.depth + (t.depth - e.depth) * n,
			value: e.value + (t.value - e.value) * n
		});
		for (let r of Te(e.value, t.value)) {
			let e = n(r.from), t = n(r.to);
			ut.push({
				points: [K.project(e.x, e.y, e.depth), K.project(t.x, t.y, t.depth)],
				band: r.band
			});
		}
	}, ft = (e) => {
		let t = Math.min(...e.map((e) => e.value)), n = Math.max(...e.map((e) => e.value)), r = Math.max(1, Math.floor((t - k) / O) + 1), i = Math.min(ie - 1, Math.ceil((n - k) / O) - 1);
		for (let t = r; t <= i; t++) {
			let n = k + t * O, r = [], i = (e) => {
				r.some((t) => Math.abs(t.x - e.x) < 1e-9 && Math.abs(t.y - e.y) < 1e-9 && Math.abs(t.depth - e.depth) < 1e-9) || r.push(e);
			};
			for (let t = 0; t < e.length; t++) {
				let r = e[t], a = e[(t + 1) % e.length];
				if (r.value === n && i(r), r.value < n && a.value > n || r.value > n && a.value < n) {
					let e = (n - r.value) / (a.value - r.value);
					i({
						x: r.x + (a.x - r.x) * e,
						y: r.y + (a.y - r.y) * e,
						depth: r.depth + (a.depth - r.depth) * e,
						value: n
					});
				}
			}
			r.length === 2 && ut.push({
				points: [K.project(r[0].x, r[0].y, r[0].depth), K.project(r[1].x, r[1].y, r[1].depth)],
				band: t - 1
			});
		}
	}, pt = (e) => {
		if (t.surfaceWireframe === !0) {
			ft(e);
			return;
		}
		let n = Math.min(...e.map((e) => e.value)), r = Math.max(...e.map((e) => e.value)), i = Math.max(0, Math.floor((n - k) / O)), a = Math.min(ie - 1, Math.floor((r - k) / O));
		for (let t = i; t <= a; t++) {
			let n = k + t * O, r = t === ie - 1 ? A : n + O, i = Qr(e, n, !0);
			if (i = Qr(i, r, !1), i.length < 3) continue;
			let a = i.map((e) => K.project(e.x, e.y, e.depth));
			lt.push({
				points: a,
				scenePoints: i,
				band: t,
				depth: i.reduce((e, t) => e + K.cameraDepth(t.x, t.y, t.depth), 0) / i.length
			});
		}
	};
	e.save(), e.beginPath(), e.rect(Ue, We, G, Ge), e.clip();
	let mt = (t, n, r, i, a = !1) => {
		if (t.length < 2) return;
		let o = a ? t.map((e) => K.projectUnbounded(e.x, e.y, e.depth)) : t.map((e) => K.project(e.x, e.y, e.depth));
		e.beginPath(), e.moveTo(o[0].x, o[0].y);
		for (let t = 1; t < o.length; t++) e.lineTo(o[t].x, o[t].y);
		e.strokeStyle = n, e.lineWidth = r, e.setLineDash(Le(i ?? "solid", r)), e.stroke();
	}, ht = K.topology.farDepth, gt = K.topology.nearDepth, _t = J.y + J.h, vt = J.y, yt = K.topology.farX === "min" ? J.x : J.x + J.w, bt = [
		"floor",
		"sideWall",
		"backWall"
	].map((e) => {
		let n = t.threeD?.[e];
		return Ke(K, e, n?.thicknessPercent);
	}), xt = [
		"floor",
		"sideWall",
		"backWall"
	], St = (e, t, n, r, i, a) => {
		let o = bt[e], s = xt[e];
		for (let e of nt(o, s, t, n)) o.thickness > 0 && !K.cameraFacing(o.faces[e.faceIndex]) || mt(e.scenePoints, r, i, a, !0);
	}, Ct = (e, t, n, r) => {
		for (let i of e) {
			let e = L(i);
			St(1, "y", e, t, n, r), St(2, "y", e, t, n, r);
		}
	}, wt = (e, t, n, r) => {
		for (let i of e) St(0, "x", i, t, n, r), St(2, "x", i, t, n, r);
	}, Tt = bt.some((e) => e.thickness > 0) ? bt.map((e) => e.faces.filter((t) => e.thickness === 0 || K.cameraFacing(t)).map((e) => e.map((e) => K.projectUnbounded(e.x, e.y, e.depth)))) : [
		[
			K.project(J.x, _t, gt),
			K.project(J.x + J.w, _t, gt),
			K.project(J.x + J.w, _t, ht),
			K.project(J.x, _t, ht)
		],
		[
			K.project(yt, _t, gt),
			K.project(yt, _t, ht),
			K.project(yt, vt, ht),
			K.project(yt, vt, gt)
		],
		[
			K.project(J.x, _t, ht),
			K.project(J.x + J.w, _t, ht),
			K.project(J.x + J.w, vt, ht),
			K.project(J.x, vt, ht)
		]
	].map((e) => [e]);
	for (let n = 0; n < Tt.length; n++) {
		let r = Tt[n];
		if (!r.length) continue;
		let a = r.flat(), o = Oe[n], c = o.fill?.fillType === "image" ? o.fill : null;
		if (c) {
			let r = s(c), i = t.threeD?.[xt[n]];
			r && Qe(e, c, r, i, xt[n], bt[n], bt[n].faces.map((e, t) => ({
				face: e,
				faceIndex: t
			})).filter(({ face: e }) => bt[n].thickness === 0 || K.cameraFacing(e)).map(({ faceIndex: e }) => e), (e) => K.projectUnbounded(e.x, e.y, e.depth), j);
		}
		let l = Math.min(...a.map((e) => e.x)), u = Math.max(...a.map((e) => e.x)), d = Math.min(...a.map((e) => e.y)), f = Math.max(...a.map((e) => e.y)), p = c ? null : o.fill?.fillType === "solid" ? `#${o.fill.color}` : o.fill ? Ie(o.fill, e, l, d, u - l, f - d) : null, m = o.line?.fillType === "solid" ? `#${o.line.color}` : o.line ? Ie(o.line, e, l, d, u - l, f - d) : null, h = o.lineWidthEmu == null ? 1 : Pe(o.lineWidthEmu, i);
		for (let t of r) {
			e.beginPath(), e.moveTo(t[0].x, t[0].y);
			for (let n = 1; n < t.length; n++) e.lineTo(t[n].x, t[n].y);
			e.closePath(), p && (e.fillStyle = p, e.fill()), m && (e.strokeStyle = m, e.lineWidth = h, e.setLineDash(ae(o.lineCustomDash, o.lineDash, h)), e.lineCap = o.lineCap === "rnd" ? "round" : o.lineCap === "sq" ? "square" : "butt", e.lineJoin = o.lineJoin === "round" || o.lineJoin === "bevel" ? o.lineJoin : "miter", e.stroke());
		}
	}
	if (t.valAxisMinorGridlines === !0) {
		let e = Tn(t, i);
		Ct(D.minorLines.filter((e) => e >= k && e <= A), e.color, e.width, t.valAxisMinorGridlineDash);
	}
	if (Pn(t)) {
		let e = Ee(t.valAxisGridlineColor, t.valAxisGridlineWidthEmu, i);
		if (t.valAxisMajorGridlines === !0) Ct(R, e.color, e.width, t.valAxisGridlineDash);
		else for (let n of R) {
			let r = L(n), i = ct(n);
			bt[2].thickness > 0 ? St(2, "y", r, e.color, e.width, t.valAxisGridlineDash) : mt([{
				x: J.x,
				y: i,
				depth: ht
			}, {
				x: J.x + J.w,
				y: i,
				depth: ht
			}], e.color, e.width, t.valAxisGridlineDash), bt[1].thickness > 0 ? St(1, "y", r, e.color, e.width, t.valAxisGridlineDash) : mt([{
				x: yt,
				y: i,
				depth: gt
			}, {
				x: yt,
				y: i,
				depth: ht
			}], e.color, e.width, t.valAxisGridlineDash);
		}
	}
	if (t.catAxisMinorGridlines === !0) {
		let e = An(t, i);
		wt(ne(g, et), e.color, e.width, t.catAxisMinorGridlineDash);
	}
	if (t.catAxisMajorGridlines) {
		let e = Ee(t.catAxisGridlineColor, t.catAxisGridlineWidthEmu, i);
		wt(jn(t, g), e.color, e.width, t.catAxisGridlineDash);
	}
	for (let e = 0; e < _ - 1; e++) for (let t = 0; t < g - 1; t++) {
		let n = [
			h[e].values[t],
			h[e].values[t + 1],
			h[e + 1].values[t + 1],
			h[e + 1].values[t]
		];
		if (n.some((e) => e == null || !Number.isFinite(e))) continue;
		let r = [
			{
				x: at(t),
				y: ct(n[0]),
				depth: st(e),
				value: n[0]
			},
			{
				x: at(t + 1),
				y: ct(n[1]),
				depth: st(e),
				value: n[1]
			},
			{
				x: at(t + 1),
				y: ct(n[2]),
				depth: st(e + 1),
				value: n[2]
			},
			{
				x: at(t),
				y: ct(n[3]),
				depth: st(e + 1),
				value: n[3]
			}
		];
		for (let e of Yr(n)) pt(e.map((e) => r[e]));
	}
	if (t.surfaceWireframe === !0) {
		for (let e = 0; e < _; e++) for (let t = 0; t < g - 1; t++) {
			let n = h[e].values[t], r = h[e].values[t + 1];
			n == null || r == null || !Number.isFinite(n) || !Number.isFinite(r) || dt({
				x: at(t),
				y: ct(n),
				depth: st(e),
				value: n
			}, {
				x: at(t + 1),
				y: ct(r),
				depth: st(e),
				value: r
			});
		}
		for (let e = 0; e < g; e++) for (let t = 0; t < _ - 1; t++) {
			let n = h[t].values[e], r = h[t + 1].values[e];
			n == null || r == null || !Number.isFinite(n) || !Number.isFinite(r) || dt({
				x: at(e),
				y: ct(n),
				depth: st(t),
				value: n
			}, {
				x: at(e),
				y: ct(r),
				depth: st(t + 1),
				value: r
			});
		}
	}
	lt.sort((e, t) => e.depth - t.depth);
	let Et = Array.from({ length: ie }, () => ({
		minX: Infinity,
		minY: Infinity,
		maxX: -Infinity,
		maxY: -Infinity
	}));
	for (let e of lt) {
		let t = Et[e.band];
		for (let n of e.points) t.minX = Math.min(t.minX, n.x), t.minY = Math.min(t.minY, n.y), t.maxX = Math.max(t.maxX, n.x), t.maxY = Math.max(t.maxY, n.y);
	}
	for (let e of ut) {
		let t = Et[e.band];
		for (let n of e.points) t.minX = Math.min(t.minX, n.x), t.minY = Math.min(t.minY, n.y), t.maxX = Math.max(t.maxX, n.x), t.maxY = Math.max(t.maxY, n.y);
	}
	let Dt = (t, n) => {
		if (t == null) return t;
		if (t.fillType === "solid") return `#${t.color}`;
		let r = Et[n];
		return !Number.isFinite(r.minX) || !Number.isFinite(r.minY) || !Number.isFinite(r.maxX) || !Number.isFinite(r.maxY) ? null : Ie(t, e, r.minX, r.minY, r.maxX - r.minX, r.maxY - r.minY);
	}, Ot = B.map(Dt), kt = fe.map(Dt);
	for (let t of lt) {
		let n = le.get(t.band);
		e.beginPath(), e.moveTo(t.points[0].x, t.points[0].y);
		for (let n = 1; n < t.points.length; n++) e.lineTo(t.points[n].x, t.points[n].y);
		e.closePath();
		let r = Ot[t.band];
		r !== null && (e.fillStyle = r ?? Je(se[t.band], q ? Ye(K.cameraNormal(t.scenePoints)) : 1), e.fill());
		let a = kt[t.band];
		if (a != null) {
			let t = n?.style, r = z?.lineNoStyle === !0 ? void 0 : z;
			e.strokeStyle = a;
			let o = n?.lineWidthEmu ?? t?.lineWidthEmu ?? r?.lineWidthEmu;
			e.lineWidth = o == null ? 1 : Pe(o, i), e.setLineDash(ae(t?.lineCustomDash ?? r?.lineCustomDash, t?.lineDash ?? r?.lineDash, e.lineWidth));
			let s = t?.lineCap ?? r?.lineCap, c = t?.lineJoin ?? r?.lineJoin;
			e.lineCap = s === "rnd" ? "round" : s === "sq" ? "square" : "butt", e.lineJoin = c === "round" || c === "bevel" ? c : "miter", e.stroke();
		}
	}
	if (t.surfaceWireframe === !0) {
		let t = De ? xe.paint?.fillType === "solid" ? `#${xe.paint.color}` : xe.paint ? Ie(xe.paint, e, Ue, We, G, Ge) : xe.paint : void 0, n = Se.map((e, n) => e === void 0 ? t : Dt(e, n));
		for (let t of ut) {
			let r = Ce[t.band], a = n[t.band];
			if (a === null) continue;
			e.beginPath(), e.moveTo(t.points[0].x, t.points[0].y), e.lineTo(t.points[1].x, t.points[1].y), e.strokeStyle = a ?? se[t.band], e.lineWidth = r.lineWidthEmu == null ? Math.max(1, .75 * i) : Pe(r.lineWidthEmu, i), e.setLineDash(ae(r.lineCustomDash, r.lineDash, e.lineWidth));
			let o = r.lineCap, s = r.lineJoin;
			e.lineCap = o === "rnd" ? "round" : o === "sq" ? "square" : "butt", e.lineJoin = s === "round" || s === "bevel" ? s : "miter", e.stroke();
		}
	}
	e.restore();
	let jt = K.project(J.x + J.w / 2, J.y + J.h / 2, .5), Mt = (t, n, r, a, o, s, c, l, u) => {
		if (c || t == null || t === "none") return;
		let d = a.x - r.x, f = a.y - r.y, p = Math.hypot(d, f);
		if (!(p > 1e-6)) return;
		let m = -f / p, h = d / p, g = (r.x + a.x) / 2, _ = (r.y + a.y) / 2;
		(g - jt.x) * m + (_ - jt.y) * h < 0 && (m = -m, h = -h);
		let v = xn(l, s, i), y = t === "cross" ? v / 2 : v, b = t === "out" || t === "cross" ? y : 0, x = t === "in" || t === "cross" ? y : 0;
		bn(e, n.x + m * b, n.y + h * b, n.x - m * x, n.y - h * x, o, s, u);
	}, Nt = K.project(J.x, _t, gt), Ft = K.project(J.x + J.w, _t, gt), It = t.catAxisLineWidthEmu == null ? 1 : Pe(t.catAxisLineWidthEmu, i);
	bn(e, Nt.x, Nt.y, Ft.x, Ft.y, t.catAxisLineColor ? `#${t.catAxisLineColor}` : "#000000", It, t.catAxisLineDash);
	let Lt = t.catAxisLineColor ? `#${t.catAxisLineColor}` : "#000000", Rt = t.catAxisHidden || t.catAxisLineHidden === !0, zt = Math.max(1, Math.floor(t.catAxisTickMarkSkip ?? 1));
	for (let e = 0; e < g; e += zt) Mt(t.catAxisMajorTickMark, K.project(at(e), _t, gt), Nt, Ft, Lt, It, Rt, "major", t.catAxisLineDash);
	if (t.catAxisMinorTickMark != null && t.catAxisMinorTickMark !== "none") for (let e = 0; e < g - 1; e++) {
		let n = (w(e, g, et, Xe) + w(e + 1, g, et, Xe)) / 2;
		Mt(t.catAxisMinorTickMark, K.project(J.x + n * J.w, _t, gt), Nt, Ft, Lt, It, Rt, "minor", t.catAxisLineDash);
	}
	e.font = Pt(Be, Y(t, t.catAxisFontFace, "minor"), t.catAxisFontBold ?? !1, t.catAxisFontItalic ?? !1), e.fillStyle = t.catAxisFontColor ? `#${t.catAxisFontColor}` : "#000000", e.textBaseline = "top";
	for (let n = 0; n < g; n++) {
		let r = te(n, g, ce(t), Nn(t), t.catAxisLabelAlignment), i = K.project(J.x + r.fraction * J.w, _t, gt);
		e.textAlign = r.textAlign, e.fillText(d[n] ?? "", i.x, i.y + P(8, t.catAxisLabelOffsetPercent));
	}
	if (!W?.hidden) {
		let n = W?.lineWidthEmu == null ? 1 : Pe(W.lineWidthEmu, i), r = K.project(J.x, _t, .5), a = K.project(J.x + J.w, _t, .5), o = r.x >= a.x ? J.x : J.x + J.w, s = K.project(o, _t, gt), c = K.project(o, _t, ht);
		bn(e, s.x, s.y, c.x, c.y, W?.lineColor ? `#${W.lineColor}` : "#000000", n, W?.lineDash);
		let l = W?.lineColor ? `#${W.lineColor}` : "#000000", u = Math.max(1, Math.floor(W?.tickMarkSkip ?? 1));
		for (let e = 0; e < _; e += u) Mt(W?.majorTickMark, K.project(o, _t, st(e)), s, c, l, n, W?.lineHidden === !0, "major", W?.lineDash);
		if (W?.minorTickMark != null && W.minorTickMark !== "none") for (let e = 0; e < _ - 1; e++) Mt(W.minorTickMark, K.project(o, _t, (st(e) + st(e + 1)) / 2), s, c, l, n, W.lineHidden === !0, "minor", W.lineDash);
		e.font = Pt(He, Y(t, W?.fontFace, "minor"), W?.fontBold ?? !1, W?.fontItalic ?? !1), e.fillStyle = W?.fontColor ? `#${W.fontColor}` : "#000000", e.textAlign = "left", e.textBaseline = "middle";
		for (let t = 0; t < _; t++) {
			let n = K.project(o, _t, st(t));
			e.fillText(h[t].name, n.x + 8, n.y);
		}
	}
	if (!t.valAxisHidden) {
		let n = K.topology.axisX === "min" ? J.x : J.x + J.w, r = K.project(n, J.y + J.h, gt), a = K.project(n, J.y, gt);
		if (Math.hypot(a.x - r.x, a.y - r.y) > 4) {
			let o = t.valAxisLineWidthEmu == null ? 1 : Pe(t.valAxisLineWidthEmu, i);
			bn(e, r.x, r.y, a.x, a.y, t.valAxisLineColor ? `#${t.valAxisLineColor}` : "#000000", o, t.valAxisLineDash), e.font = Pt(Jn(t.valAxisFontSizeHpt, u, i), Y(t, t.valAxisFontFace, "minor"), t.valAxisFontBold ?? !1, t.valAxisFontItalic ?? !1), e.fillStyle = t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#000000";
			let s = (r.x + a.x) / 2 < Ue + G / 2;
			e.textAlign = s ? "right" : "left", e.textBaseline = "middle";
			for (let r of R) {
				let i = K.project(n, ct(r), gt);
				e.fillText(I(r, t.valAxisFormatCode, t.date1904), i.x + (s ? -6 : 6), i.y);
			}
		}
	}
	_n(e, je, Me, o, c, l, u, Ue, We, G, Ge, ze.bandH + 2, i);
}
function ei(e, t, r, i, a = 0) {
	let { x: o, y: s, w: c, h: l } = r, u = pr(t), d = u.length;
	if (d === 0) return;
	let f = Xt(t, i), h = t.series.map((e, t) => ({
		series: e,
		chartIndex: t
	})).filter(({ series: e }) => e.seriesType == null || e.seriesType === "area"), _ = t.series.map((e, t) => ({
		series: e,
		chartIndex: t
	})).filter(({ series: e }) => e.seriesType === "line");
	if (h.length === 0 && _.length === 0) return;
	let y = g(t), b = t.chartType === "stackedAreaPct" ? "percentStacked" : t.chartType === "stackedArea" ? "stacked" : "standard", x = t.plotGroups?.filter((e) => e.kind === "area") ?? [{
		kind: "area",
		seriesStart: 0,
		seriesCount: h.length,
		categoryAxis: "primary",
		valueAxis: "primary",
		seriesAxis: "none",
		grouping: b
	}], S = Array(t.series.length).fill(-1);
	for (let e = 0; e < h.length; e++) S[h[e].chartIndex] = e;
	let C = x.map((e) => {
		let n = [], r = Math.min(t.series.length, e.seriesStart + e.seriesCount);
		for (let t = e.seriesStart; t < r; t++) {
			let e = S[t];
			e >= 0 && n.push(e);
		}
		return {
			group: e,
			areaIndices: n
		};
	}), w = Array(h.length).fill(!1), E = Array(h.length).fill(!1), D = Array(h.length).fill(null), O = h.map(() => Array(d).fill(0)), k = h.map(() => Array(d).fill(0)), A = t.plotGroups?.filter((e) => (e.kind === "area" || e.kind === "line") && e.seriesCount > 0) ?? x, M = /* @__PURE__ */ new Map();
	for (let e of A) {
		let t = e.valueAxis;
		M.set(t, (M.get(t) ?? !0) && e.grouping === "percentStacked");
	}
	for (let { group: e, areaIndices: t } of C) {
		let n = e.grouping ?? "standard", r = n === "stacked" || n === "percentStacked", i = n === "percentStacked", a = i && M.get(e.valueAxis) === !0 ? 100 : 1, o = i ? u.map((e, n) => t.reduce((e, t) => e + Math.abs(h[t].series.values[n] ?? 0), 0) || 1) : null;
		for (let e of t) w[e] = r, E[e] = i, D[e] = o;
		for (let e = 0; e < d; e++) {
			let n = 0, s = 0;
			for (let c of t) {
				let t = h[c].series.values[e] ?? 0, l = i && o ? t / o[e] * a : t, u = l >= 0 ? n : s;
				O[c][e] = r ? u : 0, k[c][e] = r ? u + l : l, r && (l >= 0 ? n += l : s += l);
			}
		}
	}
	let ee = A.filter((e) => e.valueAxis !== "secondary"), F = ee.length > 0 && ee.every((e) => e.grouping === "percentStacked"), ne = new Map(h.map((e, t) => [e.series, t])), re = new Map(t.series.map((e, t) => [e, t])), ie = (e) => y[re.get(e) ?? -1]?.valueAxis === "secondary" || t.plotGroups == null && e.useSecondaryAxis === !0, I = A.filter((e) => e.valueAxis === "secondary"), L = I.length > 0 && I.every((e) => e.grouping === "percentStacked"), ae = t.secondaryValAxis && t.series.some((e) => ie(e)) ? t.secondaryValAxis : null, R = (e) => ae != null && ie(e), oe = ur(e, t, c, l, i), le = oe.fontPx, z = oe.topPad, de = oe.bandH, B = Jn(t.catAxisFontSizeHpt, l, i), fe = Jn(t.valAxisFontSizeHpt, l, i), pe = mn(e, t, c, l, .22, i), { legRightW: me, legLeftW: ge, legTopH: _e, legBottomH: ye } = Ve(pe, t.legendOverlay === !0), xe = T(t, c, l, i), Se = xe.catFontPx, Ce = xe.valFontPx, we = xe.catBandH, Ee = xe.valBandW, Oe = Vt(t), je = Ut(t, i), V = Wt(e, t, i), Fe = de + _e + fe / 2 + 2, Ie = (Oe ? je : m(B, t.catAxisLabelOffsetPercent)) + we + ye, H = l - Fe - Ie, U = rr(ae, t.series, H / i, "y", L, !1, (e) => ie(e), (e, t) => {
		let n = ne.get(e);
		return n == null ? e.values[t] ?? null : e.values[t] == null ? null : k[n][t] ?? null;
	}), Le = Math.max(8, Math.min(11, l / 20)), Re = p(ae?.fontSizeHpt, i) ?? Le, ze = 0;
	if (ae && U && !ae.hidden) {
		let n = e.font;
		e.font = `${Re}px ${Y(t, ae.fontFace, "minor")}`;
		let r = 0;
		for (let n of U.majorLines) r = Math.max(r, e.measureText(Rn(n, ae.formatCode ?? null, t.date1904, ae.displayUnits)).width);
		ze = r + 18, e.font = n;
	}
	let Be = ae && ae.title ? he(ae.titleFontSizeHpt, i) + 8 : 0, W = (() => {
		let e = Infinity, t = -Infinity;
		for (let n = 0; n < d; n++) {
			for (let r = 0; r < h.length; r++) {
				let { series: i } = h[r];
				R(i) || i.values[n] == null || (e = Math.min(e, O[r][n], k[r][n]), t = Math.max(t, O[r][n], k[r][n]));
			}
			for (let { series: r } of _) {
				if (R(r)) continue;
				let i = r.values[n];
				i != null && (e = Math.min(e, i), t = Math.max(t, i));
			}
		}
		return !isFinite(e) || !isFinite(t) ? {
			min: 0,
			max: 1
		} : F ? {
			min: e < 0 ? -100 : 0,
			max: t > 0 ? 100 : 0
		} : {
			min: e,
			max: t
		};
	})();
	if (!F) {
		let e = (e) => {
			W = {
				min: Math.min(W.min, e),
				max: Math.max(W.max, e)
			};
		};
		for (let t = 0; t < h.length; t++) {
			let { series: n } = h[t];
			R(n) || nr(n, "y", (e) => n.values[e] == null ? null : k[t][e], e);
		}
		for (let { series: t } of _) R(t) || nr(t, "y", (e) => t.values[e] ?? null, e);
	}
	let He = Vn(t, W.min, W.max, H / i, F), Ue = t.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, H / 20)) : fe, We = 0;
	if (!t.valAxisHidden && t.plotAreaManualLayout != null && t.plotAreaManualLayout.layoutTarget !== "inner") {
		let n = e.font;
		e.font = Pt(Ue, Y(t, t.valAxisFontFace, "minor"), t.valAxisFontBold ?? !1, t.valAxisFontItalic ?? !1);
		for (let n of He.majorLines) We = Math.max(We, e.measureText(In(t, n, F)).width);
		e.font = n;
	}
	let G = j({
		valAxisHidden: t.valAxisHidden,
		catAxisHidden: t.catAxisHidden,
		valLabelWidth: We,
		valLabelFontPx: Ue,
		catLabelFontPx: B,
		valLabelGapPx: t.valAxisFontSizeHpt == null ? 6 : ke(Ue),
		catLabelGapPx: t.catAxisFontSizeHpt == null ? P(3, t.catAxisLabelOffsetPercent) : P(v(B), t.catAxisLabelOffsetPercent),
		outerTextMarginPx: n * i,
		valTitleBandW: Ee,
		catTitleBandH: we,
		secondaryBandW: ze + Be
	}), Ge = {
		t: Fe,
		r: me + c * .05 + ze + Be,
		b: Ie,
		l: ge + Math.max(c * .12 + Ee, V)
	};
	fr(e, t, o, s, c, l, s + z, le);
	let K = N(t, o, s, c, l, i, {
		titleBand: oe,
		legendSideReserveFrac: .22,
		legendReserve: pe,
		pad: Ge,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: G
	}), { px0: q, py0: Ke, pw: qe } = K.plotRect, { ph: Je } = K.plotRect;
	if (qe <= 0 || Je <= 0) return;
	let Ye = Oe ? Gt(e, t, qe / d, i) : null;
	Ye && Ye.totalHeight > je && (Je = Math.max(1, Je - (Ye.totalHeight - je))), Ne(e, t, q, Ke, qe, Je, i, a);
	let J = Vn(t, W.min, W.max, Je / i, F), Xe = ce(t), Ze = Nn(t), Qe = tr(t, u), $e = Qe ? (e) => q + Qe.positions[e] * qe : Xe ? (e) => q + ((Ze ? d - 1 - e : e) + .5) / d * qe : (e) => {
		let t = Ze ? d - 1 - e : e;
		return q + (d === 1 ? qe / 2 : t / (d - 1) * qe);
	}, et = (e) => Ke + Je - J.frac(e) * Je, tt = U ? U.makeToY(Ke, Je) : et, nt = (e) => R(e) ? tt : et, rt = et(Kr(t, J.min, J.max)), it = ae && U ? tt(Gr(t.secondaryCatAxis?.crossesAt, t.secondaryCatAxis?.crosses, U.min, U.max)) : rt, at = (e) => R(e) ? it : rt, { color: ot, width: st } = ue(t.catAxisLineColor, t.catAxisLineWidthEmu, i), { color: ct, width: lt } = ue(t.valAxisLineColor, t.valAxisLineWidthEmu, i);
	if (!t.valAxisHidden) {
		let n = wn(t, i), r = Tn(t, i);
		if (t.valAxisMinorGridlines) for (let t of J.minorLines) Cn(e, q, qe, et(t), !1, r);
		if (Pn(t)) for (let t of J.majorLines) Cn(e, q, qe, et(t), t === 0, n);
	}
	if (ae && U && ir(e, ae, U, tt, q, qe, i), !t.catAxisHidden && On(t)) {
		let n = kn(t, i);
		e.strokeStyle = n.color, e.lineWidth = n.width;
		let r = n.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
		n.dash.length > 0 && e.setLineDash(n.dash);
		let a = Qe ? Qe.majorTicks.map((e) => e.fraction) : jn(t, d);
		for (let t of a) {
			let n = q + t * qe;
			e.beginPath(), e.moveTo(n, Ke), e.lineTo(n, Ke + Je), e.stroke();
		}
		n.dash.length > 0 && e.setLineDash(r);
	}
	let ut = C.flatMap(({ areaIndices: e }) => e), dt = (e, t) => k[e]?.[t] ?? 0;
	for (let t of ut) {
		let { series: n, chartIndex: r } = h[t], a = At(r, n), o = Ke + Je, s = nt(n), c = n.smooth === !0;
		if (e.beginPath(), w[t]) {
			let n = [];
			for (let e = 0; e < d; e++) n.push({
				x: $e(e),
				y: et(k[t][e])
			});
			e.moveTo(n[0].x, n[0].y), ji(e, n, c);
			for (let n = d - 1; n >= 0; n--) e.lineTo($e(n), et(O[t][n]));
		} else {
			let t = [];
			for (let e = 0; e < d; e++) t.push({
				x: $e(e),
				y: s(n.values[e] ?? 0)
			});
			e.moveTo($e(0), o), e.lineTo(t[0].x, t[0].y), ji(e, t, c), e.lineTo($e(d - 1), o);
		}
		e.closePath(), e.fillStyle = a, e.fill(), n.lineHidden !== !0 && (e.strokeStyle = n.lineColor ? `#${n.lineColor}` : a, e.lineWidth = n.lineWidthEmu ? Pe(n.lineWidthEmu, i) : 1.5, e.setLineDash([]), e.stroke());
	}
	let ft = /* @__PURE__ */ new Map();
	for (let e = 0; e < h.length; e++) {
		let t = h[e].series, n = t.areaGroupIndex ?? 0, r = ft.get(n) ?? [];
		r.push({
			series: t,
			areaIndex: e
		}), ft.set(n, r);
	}
	for (let n of t.areaGroupDecorations ?? []) {
		if (!n.dropLines || !yr(e, br(t, n.dropLines, "dropLine"), i)) continue;
		let r = ft.get(n.groupIndex) ?? [];
		for (let t = 0; t < d; t++) {
			let n = Infinity, i = -Infinity, a = !1;
			for (let e of r) {
				if (e.series.values[t] == null) continue;
				let r = nt(e.series)(dt(e.areaIndex, t)), o = at(e.series);
				!Number.isFinite(r) || !Number.isFinite(o) || (n = Math.min(n, r, o), i = Math.max(i, r, o), a = !0);
			}
			!a || Math.abs(i - n) < .01 || (e.beginPath(), e.moveTo($e(t), n), e.lineTo($e(t), i), e.stroke());
		}
	}
	{
		let n = Math.max(2, 2.5 * i);
		for (let r = 0; r < h.length; r++) {
			let { series: p, chartIndex: m } = h[r], g = jt(p.dataPointOverrides), _ = At(m, p), v = nt(p), y = (e) => dt(r, e), b = D[r];
			for (let n of p.errBars ?? []) Pi(e, p, Cr(t, n), d, $e, v, y, _);
			let x = (p.showMarker === !0 || be(p)) && p.markerSymbol !== "none";
			if (x || Me(p)) for (let t = 0; t < d; t++) {
				if (p.values[t] == null) continue;
				let r = g.get(t), o = Te(p, r, "circle", x);
				if (o === "none") continue;
				let s = $e(t), c = v(y(t));
				if (be(p) || De(r)) {
					let n = r?.markerSize ?? p.markerSize ?? 5, l = se(p, r, t, _), u = r?.markerLine ?? p.markerLine ?? null, d = r?.markerLineWidthEmu ?? p.markerLineWidthEmu;
					Si(e, s, c, o, n, l, u, i, d == null ? void 0 : Pe(d, i), ve(p, r, t), a);
				} else e.fillStyle = _, e.beginPath(), e.arc(s, c, n, 0, Math.PI * 2), e.fill();
			}
			Ii(e, p, u, d, $e, v, y, Je, i, t.date1904 ?? !1, !0, Y(t, t.dataLabelFontFace, "minor"), t.dataLabelPosition ?? "ctr", {
				x: q,
				y: Ke,
				w: qe,
				h: Je
			}, {
				x: o,
				y: s,
				w: c,
				h: l
			}, E[r] && b ? (e) => (p.values[e] ?? 0) / b[e] : void 0, void 0, (e) => Y(t, e, "minor"), R(p) ? ae?.displayUnits : t.valAxisDisplayUnits, (e) => f(m, e), (e) => hr(t, e, R(p) && U ? U.max : J.max), a);
		}
	}
	for (let { series: n, chartIndex: p } of _) {
		let m = jt(n.dataPointOverrides), h = At(p, n), g = n.lineColor ? `#${n.lineColor}` : h, _ = nt(n);
		if (n.lineHidden !== !0) {
			e.strokeStyle = g, e.lineWidth = n.lineWidthEmu ? Pe(n.lineWidthEmu, i) : Math.max(1, 2.25 * i), e.setLineDash([]), e.beginPath();
			let r = [], a = () => {
				r.length !== 0 && (e.moveTo(r[0].x, r[0].y), ji(e, r, n.smooth === !0), r = []);
			};
			for (let e = 0; e < d; e++) {
				let i = n.values[e];
				i == null && ((t.dispBlanksAs ?? "gap") === "gap" && a(), (t.dispBlanksAs ?? "gap") !== "zero") || r.push({
					x: $e(e),
					y: _(i ?? 0)
				});
			}
			a(), e.stroke();
		}
		let v = (e) => n.values[e] ?? 0;
		for (let r of n.errBars ?? []) Pi(e, n, Cr(t, r), d, $e, _, v, g);
		let y = (n.showMarker === !0 || be(n)) && n.markerSymbol !== "none";
		if (y || Me(n)) for (let t = 0; t < d; t++) {
			let r = n.values[t];
			if (r == null) continue;
			let o = m.get(t), s = Te(n, o, "circle", y);
			s !== "none" && Si(e, $e(t), _(r), s, o?.markerSize ?? n.markerSize ?? 5, se(n, o, t, g), o?.markerLine ?? n.markerLine ?? null, i, (o?.markerLineWidthEmu ?? n.markerLineWidthEmu) == null ? void 0 : Pe(o?.markerLineWidthEmu ?? n.markerLineWidthEmu, i), ve(n, o, t), a);
		}
		Ii(e, n, u, d, $e, _, v, Je, i, t.date1904 ?? !1, !1, Y(t, t.dataLabelFontFace, "minor"), t.dataLabelPosition ?? "r", {
			x: q,
			y: Ke,
			w: qe,
			h: Je
		}, {
			x: o,
			y: s,
			w: c,
			h: l
		}, void 0, void 0, (e) => Y(t, e, "minor"), R(n) ? ae?.displayUnits : t.valAxisDisplayUnits, (e) => f(p, e), (e) => hr(t, e, R(n) && U ? U.max : J.max), a), Gn(e, n, g, $e, _, i, void 0, {
			chart: t,
			chartRect: r,
			plotRect: {
				x: q,
				y: Ke,
				w: qe,
				h: Je
			},
			shapeRotationDeg: a
		});
	}
	if (!t.valAxisHidden) {
		let n = t.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, Je / 20)) : fe;
		e.font = Pt(n, Y(t, t.valAxisFontFace, "minor"), t.valAxisFontBold ?? !1, t.valAxisFontItalic ?? !1), e.textBaseline = "middle";
		for (let r of J.majorLines) {
			let a = et(r);
			yn(e, t.valAxisMajorTickMark, "val", q, a, ct, lt, !1, t.valAxisLineHidden, "major", i, t.valAxisLineDash), e.fillStyle = t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#555", e.textAlign = "right";
			let o = t.valAxisFontSizeHpt == null ? 6 : ke(n);
			e.fillText(In(t, r, F), q - o, a);
		}
		if (t.valAxisMinorTickMark && t.valAxisMinorTickMark !== "none") for (let n of J.minorTicks) yn(e, t.valAxisMinorTickMark, "val", q, et(n), ct, lt, !1, t.valAxisLineHidden, "minor", i, t.valAxisLineDash);
	}
	if (!t.catAxisHidden && !t.catAxisLineHidden && bn(e, q, rt, q + qe, rt, ot, st, t.catAxisLineDash), !t.valAxisHidden && !t.valAxisLineHidden && t.valAxisLineColor != null && bn(e, q, Ke, q, Ke + Je, ct, lt, t.valAxisLineDash), !t.catAxisHidden && t.catAxisMajorTickMark && t.catAxisMajorTickMark !== "none") {
		let n = Math.max(1, Math.floor(t.catAxisTickMarkSkip ?? 1));
		if (Qe) for (let n of Qe.majorTicks) yn(e, t.catAxisMajorTickMark, "cat", rt, q + n.fraction * qe, ot, st, !1, t.catAxisLineHidden, "major", i, t.catAxisLineDash);
		else if (Xe) for (let r = 0; r <= d; r += n) yn(e, t.catAxisMajorTickMark, "cat", rt, q + r / d * qe, ot, st, !1, t.catAxisLineHidden, "major", i, t.catAxisLineDash);
		else for (let r = 0; r < d; r += n) yn(e, t.catAxisMajorTickMark, "cat", rt, $e(r), ot, st, !1, t.catAxisLineHidden, "major", i, t.catAxisLineDash);
	}
	if (!t.catAxisHidden && t.catAxisMinorTickMark && t.catAxisMinorTickMark !== "none" && Qe) for (let n of Qe.minorTicks) yn(e, t.catAxisMinorTickMark, "cat", rt, q + n.fraction * qe, ot, st, !1, t.catAxisLineHidden, "minor", i, t.catAxisLineDash);
	if (!Oe && !t.catAxisHidden) {
		let n = t.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, qe / d * .8)) : B;
		e.fillStyle = t.catAxisFontColor ? `#${t.catAxisFontColor}` : "#555", e.textAlign = "center", e.textBaseline = "top", e.font = Pt(n, Y(t, t.catAxisFontFace, "minor"), t.catAxisFontBold ?? !1, t.catAxisFontItalic ?? !1);
		let r = Math.max(1, Math.floor(t.catAxisTickLabelSkip ?? 1)), i = Qe ? Qe.majorTicks.map((e) => ({
			label: Ae(String(e.serial), t.catAxisFormatCode, t.date1904),
			x: q + e.fraction * qe,
			categoryIndex: -1
		})) : Array.from({ length: Math.ceil(d / r) }, (e, n) => {
			let i = n * r;
			return {
				label: Ae((u[i] ?? "").toString(), t.catAxisFormatCode, t.date1904),
				x: $e(i),
				categoryIndex: i
			};
		});
		for (let r of i) {
			let i = r.label;
			if (!i) continue;
			let a = r.categoryIndex < 0 ? null : te(r.categoryIndex, d, ce(t), Nn(t), t.catAxisLabelAlignment), o = P(t.catAxisFontSizeHpt == null ? 3 : v(n), t.catAxisLabelOffsetPercent);
			e.textAlign = a?.textAlign ?? "center";
			let s = t.catAxisTickLabelPos ?? "nextTo", c = s === "nextTo" ? rt : s === "high" ? Ke : Ke + Je;
			e.fillText(i, a ? q + a.fraction * qe : r.x, c + o);
		}
	}
	if (ae && U) {
		let n = t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#555";
		ar(e, t, ae, U, tt, r, q, Ke, qe, Je, i, Re, ze, n, t.date1904);
	}
	Ye && Kt(e, t, Ye, q, Ke + Je, qe, o + ge, i), _n(e, t, pe, o, s, c, l, q, Ke, qe, Je, de + 2, i), Bt(e, t, o, s, c, l, q, Ke, qe, Je, ge, ye, Se, Ce);
}
var ti = .88;
function ni(e, t, n, r, i = 0) {
	let a = t.series[0];
	if (!a) return;
	let o = ct(t.ofPie, a.values);
	if (o == null || o.size === 0) {
		ri(e, {
			...t,
			chartType: "pie"
		}, n, !1, r, i);
		return;
	}
	let s = [], c = [];
	for (let e = 0; e < a.values.length; e++) {
		let t = a.values[e], n = t == null ? 0 : Math.abs(t);
		!(n > 0) || !Number.isFinite(n) || (o.has(e) ? c : s).push({
			sourceIndex: e,
			value: n
		});
	}
	if (c.length === 0) {
		ri(e, {
			...t,
			chartType: "pie"
		}, n, !1, r, i);
		return;
	}
	let l = {
		...t,
		chartType: "pie"
	}, u = mn(e, l, n.w, n.h, .28, r), d = N(t, n.x, n.y, n.w, n.h, r, {
		titleTopPadFrac: .035,
		titleBottomPadFrac: .035,
		legendSideReserveFrac: .28,
		legendReserve: u,
		radialGapFrac: .02,
		honorPlotAreaManualLayout: !0
	});
	fr(e, t, n.x, n.y, n.w, n.h, n.y + d.title.topPad, d.title.fontPx);
	let { px0: f, py0: p, pw: m, ph: h } = d.plotRect;
	if (!(m > 0) || !(h > 0)) return;
	Ne(e, t, f, p, m, h, r, i);
	let g = t.ofPie, _ = Math.max(.05, Math.min(2, (g?.secondPieSizePercent ?? 75) / 100)), v = Math.max(0, g?.gapWidthPercent ?? 150) / 100, y = Math.min(h * .44, m * .9 / (2 + 2 * _ + v)), b = y * _;
	if (!(y > 0) || !(b > 0)) return;
	let x = f + (m - (2 * y + v * y + 2 * b)) / 2, S = x + y, C = x + 2 * y + v * y + b, w = p + h / 2, T = c.reduce((e, t) => e + t.value, 0), E = [...s, {
		sourceIndex: c[0].sourceIndex,
		value: T
	}], D = (n, r, i) => {
		let o = n.reduce((e, t) => e + t.value, 0), s = -Math.PI / 2, c = s, l = s;
		for (let u = 0; u < n.length; u++) {
			let d = n[u], f = o > 0 ? d.value / o * Math.PI * 2 : 0;
			e.beginPath(), e.moveTo(r, w), e.arc(r, w, i, s, s + f), e.closePath(), e.fillStyle = Mt(d.sourceIndex, a, t.varyColors !== !1), e.fill(), e.strokeStyle = "#fff", e.lineWidth = 1, e.stroke(), u === n.length - 1 && (c = s, l = s + f), s += f;
		}
		return {
			aggregateStart: c,
			aggregateEnd: l
		};
	}, O = D(E, S, y), k = w - b, A = w + b;
	if ((g?.type ?? "pie") === "bar") {
		let n = w - b, r = b;
		for (let i of c) {
			let o = T > 0 ? 2 * b * i.value / T : 0;
			e.fillStyle = Mt(i.sourceIndex, a, t.varyColors !== !1), e.fillRect(C - r / 2, n, r, o), e.strokeStyle = "#fff", e.lineWidth = 1, e.strokeRect(C - r / 2, n, r, o), n += o;
		}
		k = w - b, A = w + b;
	} else D(c, C, b);
	if (g?.seriesLines ?? !0) {
		e.strokeStyle = "#808080", e.lineWidth = Math.max(1, .75 * r), e.setLineDash([]);
		let t = {
			x: S + Math.cos(O.aggregateStart) * y,
			y: w + Math.sin(O.aggregateStart) * y
		}, n = {
			x: S + Math.cos(O.aggregateEnd) * y,
			y: w + Math.sin(O.aggregateEnd) * y
		};
		e.beginPath(), e.moveTo(t.x, t.y), e.lineTo(C - b, k), e.stroke(), e.beginPath(), e.moveTo(n.x, n.y), e.lineTo(C - b, A), e.stroke();
	}
	u && _n(e, l, u, n.x, n.y, n.w, n.h, f, p, m, h, d.title.bandH + 2, r);
}
function ri(e, t, n, r, i, a = 0) {
	let { x: o, y: s, w: c, h: l } = n, u = t.series[0];
	if (!u) return;
	let d = u.categories && u.categories.length > 0 ? u.categories : t.categories, f = u.values.map((e) => Math.abs(e ?? 0)), p = f.reduce((e, t) => e + t, 0);
	if (p === 0) return;
	let m = {
		...t,
		series: [{
			...u,
			categories: d
		}]
	}, h = mn(e, m, c, l, .28, i), g = N(t, o, s, c, l, i, {
		titleTopPadFrac: .035,
		titleBottomPadFrac: .035,
		legendSideReserveFrac: .28,
		legendReserve: h,
		radialGapFrac: .02,
		honorPlotAreaManualLayout: !0
	}), _ = g.title.fontPx, v = g.title.bandH;
	fr(e, t, o, s, c, l, s + g.title.topPad, _);
	let { px0: y, py0: b, pw: x, ph: S } = g.plotRect;
	Ne(e, t, y, b, x, S, i, a);
	let C = g.center.cx, w = g.center.cy, T = Math.min(x, S) * .42, E = -Math.PI / 2 + (t.firstSliceAngle ?? 0) * Math.PI / 180, D = r ? Math.max(1, Math.min(90, t.holeSize ?? 50)) : 0, O = r ? t.series : [u], k = new Map(O.map((e) => [e, jt(e.dataPointOverrides)])), A = (T - D / 100 * T) / O.length, j = (e, t) => {
		let n = k.get(e)?.get(t)?.explosion ?? e.explosion ?? 0;
		return n > 0 ? n / 100 * T : 0;
	}, M = u.seriesDataLabels ?? {
		showVal: !1,
		showCatName: !1,
		showSerName: !1,
		showPercent: !1
	}, ee = u.seriesDataLabels != null || (u.dataLabelOverrides?.length ?? 0) > 0, P = t.showDataLabels && !ee, te = Y(t, M.fontFace ?? t.dataLabelFontFace, "minor");
	for (let n = 0; n < O.length; n++) {
		let a = O[n], o = a.values.map((e) => Math.abs(e ?? 0)), s = o.reduce((e, t) => e + t, 0);
		if (s === 0) continue;
		let c = T - n * A, l = c - A, u = E;
		for (let d = 0; d < o.length; d++) {
			let f = o[d] / s * Math.PI * 2, p = Mt(d, a, t.varyColors !== !1), m = u + f / 2, h = j(a, d), g = h > 0 ? Math.cos(m) * h : 0, _ = h > 0 ? Math.sin(m) * h : 0;
			e.beginPath(), l > .01 ? (e.arc(C + g, w + _, c, u, u + f), e.arc(C + g, w + _, l, u + f, u, !0)) : (e.moveTo(C + g, w + _), e.arc(C + g, w + _, c, u, u + f)), e.closePath(), e.fillStyle = p, e.fill();
			let v = k.get(a)?.get(d), y = v?.lineHidden ?? a.lineHidden, b = v?.lineColor ?? a.lineColor;
			if (y !== !0 && b) {
				let t = v?.lineWidthEmu ?? a.lineWidthEmu, n = t == null ? Math.max(.5, i * .75) : Pe(t, i);
				e.save(), e.strokeStyle = `#${b}`, e.lineWidth = n, e.setLineDash(Mi(v?.lineDash ?? a.chartexStyle?.lineDash ?? void 0, n)), e.lineCap = a.chartexStyle?.lineCap === "rnd" ? "round" : a.chartexStyle?.lineCap === "sq" ? "square" : "butt", e.lineJoin = a.chartexStyle?.lineJoin === "round" || a.chartexStyle?.lineJoin === "bevel" ? a.chartexStyle.lineJoin : "miter", e.stroke(), e.restore();
			}
			if (P && n === 0 && f > .15) {
				let t = T * (r ? .75 : .6), n = C + g + Math.cos(m) * t, i = w + _ + Math.sin(m) * t, a = Math.round(o[d] / s * 100);
				e.font = `bold ${Math.max(8, T * .1)}px ${te}`, e.fillStyle = "#fff", e.textAlign = "center", e.textBaseline = "middle", e.fillText(`${a}%`, n, i);
			}
			u += f;
		}
	}
	ee && ii(e, t, M, u, d, f, p, C, w, T, r ? T - A : 0, E, te, i, y, b, x, S, o, s, c, l, a), h && _n(e, m, h, o, s, c, l, y, b, x, S, v + 2, i);
}
function ii(e, t, n, r, i, o, s, c, l, u, d, f, m, h, g, _, v, y, b, x, S, C, w) {
	let T = jt(r.dataLabelOverrides ?? []), D = Xt({
		...t,
		series: [{
			...r,
			categories: i
		}]
	}, h), O = /* @__PURE__ */ new Set();
	for (let e = 0; e < o.length; e++) {
		let t = T.get(e);
		if (E(n, t)) continue;
		let r = We(t?.labelBox, n.labelBox);
		r?.fillHidden !== !0 && (r?.fill != null || r?.fillPaint != null) && O.add(e);
	}
	O.size > 0 && li(e, t, n, r, i, o, s, c, l, u, d, f, m, h, g, v, _, y, b, x, S, C, O, T, w);
	let k = [], A = f;
	for (let f = 0; f < o.length; f++) {
		let j = o[f] / s * Math.PI * 2, M = A + j / 2;
		if (A += j, O.has(f)) continue;
		let N = T.get(f);
		if (E(n, N)) continue;
		let ee = N?.showCatName ?? n.showCatName, P = N?.showSerName ?? n.showSerName, te = N?.showVal ?? n.showVal, F = N?.showPercent ?? n.showPercent, ne = N?.showLegendKey ?? n.showLegendKey ?? !1, re = et({
			customText: N?.text,
			showCategory: ee,
			showSeries: P,
			showValue: te,
			showPercent: F,
			category: (i[f] ?? "").toString(),
			seriesName: r.name,
			sourceValue: o[f],
			percentRatio: o[f] / s,
			formatCode: N?.formatCode ?? n.formatCode ?? r.valFormatCode ?? null,
			percentFormatCode: N?.formatCode ?? n.formatCode ?? "0%",
			date1904: t.date1904 ?? !1,
			separator: N?.separator ?? n.separator
		}), ie = ne ? D(0, f) : void 0;
		if (!re && !ie) continue;
		let I = (N?.position ?? n.position ?? "bestFit") === "outEnd", L = p(N?.fontSizeHpt ?? n.fontSizeHpt, h) ?? Math.max(8, u * .1), ae = N?.fontBold ?? n.fontBold, R = N?.fontColor ?? n.fontColor, oe = N?.fontFace ?? n.fontFace ? Y(t, N?.fontFace ?? n.fontFace, "minor") : m, se = a(N, n), ce = Ei(t, N, h, oe, ae ?? !1, se), le = d > .01 ? (d + u) / 2 : u * ti;
		if (N?.manualLayout) {
			e.font = `${se.fontItalic ? "italic " : ""}${ae ? "bold " : ""}${L}px ${oe}`, Oi(e, re, {
				kind: "point",
				x: c + Math.cos(M) * le,
				y: l + Math.sin(M) * le,
				position: "ctr"
			}, {
				x: g,
				y: _,
				w: v,
				h: y
			}, L, R ? `#${R}` : "#fff", N.manualLayout, {
				x: b,
				y: x,
				w: S,
				h: C
			}, ce, ie, se, h, We(N?.labelBox, n.labelBox), w);
			continue;
		}
		if (I) {
			e.font = `${se.fontItalic ? "italic " : ""}${ae ? "bold " : ""}${L}px ${oe}`;
			let t = ce ? J(e, ce, L, R ? `#${R}` : "#333") : null, n = L * 1.15, r = t ? [] : U(re, Math.max(0, S - L), Math.max(0, C - L), n, (t) => e.measureText(t).width, se);
			if (ce && !t || !t && r.length === 0 && !ie) continue;
			let i = t?.width ?? r.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), a = t?.height ?? L + Math.max(0, r.length - 1) * n, o = ie ? dn([ie.entry], L, h)[0] ?? 0 : 0, s = ie ? fn(ie.entry, L, h) : 0;
			k.push(si(r, M, c, l, u, Math.min(o + (re ? en : 0) + i, Math.max(0, S - L)), Math.min(Math.max(s, a), Math.max(0, C - L)), n, L, ae ?? !1, R ? `#${R}` : "#333", oe, t ?? void 0, ie, se, h));
			continue;
		}
		let z = le, ue = c + Math.cos(M) * z, de = l + Math.sin(M) * z;
		e.font = `${se.fontItalic ? "italic " : ""}${ae ? "bold " : ""}${L}px ${oe}`;
		let B = 2 * z * Math.sin(Math.min(Math.PI, Math.abs(j)) / 2) - L, fe = d > .01 ? u - d - L : u - L;
		if (!(B > 0) || !(fe > 0)) continue;
		let pe = mr({
			x: ue - B / 2,
			y: de - fe / 2,
			w: B,
			h: fe
		}, {
			x: g,
			y: _,
			w: v,
			h: y
		});
		pe && Oi(e, re, {
			kind: "point",
			x: ue,
			y: de,
			position: "ctr"
		}, pe, L, R ? `#${R}` : "#fff", void 0, {
			x: b,
			y: x,
			w: S,
			h: C
		}, ce, ie, se, h, We(N?.labelBox, n.labelBox), w);
	}
	ci(e, k, b, x, S, C);
}
function ai(e, t, n, r, i, a) {
	let o = Math.max(Math.abs(n - e) - i, 0), s = Math.max(Math.abs(r - t) - a, 0);
	return Math.hypot(o, s);
}
function oi(e, t, n, r, i) {
	let a = Math.cos(e), o = Math.sin(e), s = t + i, c = 0, l = s + Math.hypot(n, r);
	for (let e = 0; e < 32; e++) {
		let e = (c + l) / 2;
		ai(0, 0, a * e, o * e, n, r) >= s ? l = e : c = e;
	}
	return l;
}
function si(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m = {}, h = 1) {
	let g = O(a, o, m.textRotation, m.textVerticalMode), _ = Re(m, h), v = a + _.left + _.right, y = o + _.top + _.bottom, b = O(v, y, m.textRotation, m.textVerticalMode);
	a = b.w, o = b.h;
	let x = oi(t, i, g.w / 2, g.h / 2, c * .5), S = n + Math.cos(t) * x, C = r + Math.sin(t) * x;
	return {
		lines: e,
		rich: f,
		legendKey: p,
		boxW: a,
		boxH: o,
		unrotatedW: v,
		unrotatedH: y,
		textStyle: m,
		ptToPx: h,
		lineHeight: s,
		fontPx: c,
		bold: l,
		fontColor: u,
		font: d,
		cxBox: S,
		cyBox: C
	};
}
function ci(e, t, n, r, i, a) {
	if (t.length !== 0) {
		e.save(), e.beginPath(), e.rect(n, r, i, a), e.clip();
		for (let n of t) {
			let t = Re(n.textStyle, n.ptToPx), r = O(n.unrotatedW, n.unrotatedH, n.textStyle.textRotation, n.textStyle.textVerticalMode), i = n.cxBox + (t.left - t.right) / 2, a = n.cyBox + (t.top - t.bottom) / 2, o = Math.max(0, n.unrotatedW - t.left - t.right), s = R(n.textStyle, "center"), c = s === "left" ? n.cxBox - n.unrotatedW / 2 + t.left : s === "right" ? n.cxBox + n.unrotatedW / 2 - t.right : i;
			if (e.save(), r.radians !== 0 && (e.translate(n.cxBox, n.cyBox), e.rotate(r.radians), e.translate(-n.cxBox, -n.cyBox)), !n.legendKey) {
				if (n.rich) {
					Xe(e, n.rich, c, a, s, "middle", o), e.restore();
					continue;
				}
				e.font = `${n.textStyle.fontItalic ? "italic " : ""}${n.bold ? "bold " : ""}${n.fontPx}px ${n.font}`, e.fillStyle = n.fontColor, e.textAlign = s, e.textBaseline = "middle";
				let t = (n.textStyle.fontBaseline ?? 0) * n.fontPx, r = a - (n.lines.length - 1) * n.lineHeight / 2 - t;
				if (!(n.textStyle.fontPaintAuthored === !0 && (n.textStyle.fontHidden === !0 || n.textStyle.fontColor == null))) for (let t = 0; t < n.lines.length; t++) e.fillText(n.lines[t], c, r + t * n.lineHeight);
				e.restore();
				continue;
			}
			e.font = `${n.textStyle.fontItalic ? "italic " : ""}${n.bold ? "bold " : ""}${n.fontPx}px ${n.font}`;
			let l = n.legendKey ? dn([n.legendKey.entry], n.fontPx, n.legendKey.ptToPx)[0] ?? 0 : 0, u = n.legendKey ? fn(n.legendKey.entry, n.fontPx, n.legendKey.ptToPx) : 0, d = n.rich?.width ?? n.lines.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), f = n.legendKey && (n.rich || n.lines.length > 0) ? en : 0, p = i - (l + f + d) / 2;
			if (n.legendKey && Q(e, n.legendKey.entry.swatchStyle, n.legendKey.entry.color, p, a - u / 2, l, u, n.legendKey.entry.marker, n.legendKey.entry.fillPaint, n.legendKey.entry.outlineColor, n.legendKey.entry.outlineWidthEmu, n.legendKey.entry.outlineDash, n.legendKey.entry.outlineCap, n.legendKey.entry.outlineJoin, n.legendKey.ptToPx, n.legendKey.shapeRotationDeg), n.rich) {
				Xe(e, n.rich, p + l + f, a, "left", "middle"), e.restore();
				continue;
			}
			e.fillStyle = n.fontColor, e.textAlign = "left", e.textBaseline = "middle";
			let m = (n.textStyle.fontBaseline ?? 0) * n.fontPx, h = a - (n.lines.length - 1) * n.lineHeight / 2 - m;
			if (!(n.textStyle.fontPaintAuthored === !0 && (n.textStyle.fontHidden === !0 || n.textStyle.fontColor == null))) for (let t = 0; t < n.lines.length; t++) e.fillText(n.lines[t], p + l + f, h + t * n.lineHeight);
			e.restore();
		}
		e.restore();
	}
}
function li(e, t, n, r, i, o, s, c, l, u, d, f, m, h, g, _, v, y, b, x, S, C, w, T, D) {
	let k = Xt(t, h), A = (e) => T.get(e), j = p(n.fontSizeHpt, h) ?? Math.max(9, u * .09), M = n.labelBox, N = [], ee = f;
	for (let f = 0; f < o.length; f++) {
		let T = o[f] / s * Math.PI * 2, D = ee + T / 2;
		if (ee += T, T <= 0 || !w.has(f)) continue;
		let P = A(f);
		if (E(n, P)) continue;
		let te = P?.showCatName ?? n.showCatName, F = P?.showSerName ?? n.showSerName, ne = P?.showVal ?? n.showVal, re = P?.showPercent ?? n.showPercent, ie = P?.showLegendKey ?? n.showLegendKey ?? !1, I = p(P?.fontSizeHpt, h) ?? j, L = P?.fontBold ?? n.fontBold ?? !1, ae = P?.fontFace ?? n.fontFace ? Y(t, P?.fontFace ?? n.fontFace, "minor") : m, R = P?.fontColor ? `#${P.fontColor}` : n.fontColor ? `#${n.fontColor}` : "#000", oe = We(P?.labelBox, M), se = P?.position ?? n.position ?? "bestFit", ce = et({
			customText: P?.text,
			showCategory: te,
			showSeries: F,
			showValue: ne,
			showPercent: re,
			category: (i[f] ?? "").toString(),
			seriesName: r.name,
			sourceValue: o[f],
			percentRatio: o[f] / s,
			formatCode: P?.formatCode ?? n.formatCode ?? r.valFormatCode ?? null,
			percentFormatCode: P?.formatCode ?? n.formatCode ?? "0%",
			date1904: t.date1904 ?? !1,
			separator: P?.separator ?? n.separator,
			defaultSeparator: "\n"
		}), le = ie ? k(0, f) : void 0;
		if (!ce && !le) continue;
		let z = a(P, n), ue = Ei(t, P, h, ae, L, z), de = z.textBodyAuthored === !0 || z.textLInsEmu != null || z.textTInsEmu != null || z.textRInsEmu != null || z.textBInsEmu != null, B = Re(z, h), fe = de ? B.left : Math.max(4, I * .45), pe = de ? B.right : Math.max(4, I * .45), me = de ? B.top : Math.max(2, I * .28), he = de ? B.bottom : Math.max(2, I * .28), _e = I * .22, ve = I + _e;
		e.font = `${z.fontItalic ? "italic " : ""}${L ? "bold " : ""}${I}px ${ae}`;
		let ye = ue ? J(e, ue, I, R) : null;
		if (ue && !ye) continue;
		let be = ye ? [] : U(ce, Math.max(0, _ - fe - pe), Math.max(0, y - me - he), ve, (t) => e.measureText(t).width, z);
		if (!ye && be.length === 0 && !le) continue;
		let xe = ye?.width ?? 0;
		if (!ye) for (let t of be) xe = Math.max(xe, e.measureText(t).width);
		let Se = le ? dn([le.entry], I, h)[0] ?? 0 : 0, Ce = le ? fn(le.entry, I, h) : 0, we = le && ce ? en : 0, Te = Se + we + xe + fe + pe, Ee = Math.max(Ce, ye?.height ?? (be.length > 0 ? be.length * ve - _e : 0)) + me + he, De = O(Te, Ee, z.textRotation, z.textVerticalMode), Oe = Math.min(De.w, _), ke = Math.max(Ce, ye?.height ?? (be.length > 0 ? be.length * ve - _e : 0));
		ke = Math.min(De.h, y);
		let Ae = c + Math.cos(D) * u, je = l + Math.sin(D) * u, Me = Math.cos(D) < 0, Ne = Math.max(Oe, ke) * .55 + u * .06, V = Ae + Math.cos(D) * Ne, Pe = je + Math.sin(D) * Ne, Fe, Ie = !1;
		if (P?.manualLayout) {
			let t = ge({
				kind: "point",
				x: V,
				y: Pe,
				position: "ctr"
			}, {
				x: g,
				y: v,
				w: _,
				h: y
			}, {
				w: Oe,
				h: ke
			}, I, P.manualLayout, {
				x: b,
				y: x,
				w: S,
				h: C
			});
			if (!t || (Oe = t.rect.w, ke = t.rect.h, Te = Oe, Ee = ke, !ye && (be = U(ce, Math.max(0, Oe - fe - pe - Se - we), Math.max(0, ke - me - he), ve, (t) => e.measureText(t).width, z), be.length === 0 && !le))) continue;
			V = t.rect.x + t.rect.w / 2, Pe = t.rect.y + t.rect.h / 2, Me = V < c, Fe = t.clip;
		} else if (se !== "bestFit" && se !== "outEnd") {
			let t = d > .01 ? (d + u) / 2 : u * ti, n = c + Math.cos(D) * t, r = l + Math.sin(D) * t, i = 2 * t * Math.sin(Math.min(Math.PI, Math.abs(T)) / 2) - I, a = d > .01 ? u - d - I : u - I, o = mr({
				x: n - i / 2,
				y: r - a / 2,
				w: i,
				h: a
			}, {
				x: g,
				y: v,
				w: _,
				h: y
			});
			if (!o) continue;
			if (ye) Oe = Math.min(Oe, o.w), ke = Math.min(ke, o.h);
			else {
				if (be = U(ce, Math.max(0, o.w - fe - pe - Se - we), Math.max(0, o.h - me - he), ve, (t) => e.measureText(t).width, z), be.length === 0 && !le) continue;
				xe = be.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), Te = Se + we + xe + fe + pe, Ee = Math.max(Ce, be.length > 0 ? be.length * ve - _e : 0) + me + he, De = O(Te, Ee, z.textRotation, z.textVerticalMode), Oe = De.w, ke = De.h;
			}
			let s = ge({
				kind: "point",
				x: n,
				y: r,
				position: se === "inBase" || se === "inEnd" ? "ctr" : se
			}, o, {
				w: Oe,
				h: ke
			}, I);
			if (!s) continue;
			V = s.textAlign === "left" ? s.x + Oe / 2 : s.textAlign === "right" ? s.x - Oe / 2 : s.x, Pe = s.textBaseline === "top" ? s.y + ke / 2 : s.textBaseline === "bottom" ? s.y - ke / 2 : s.y, Me = V < c, Fe = s.clip, Ie = !0;
		}
		N.push({
			lines: be,
			rich: ye ?? void 0,
			legendKey: le,
			lineHeight: ve,
			midAngle: D,
			rimX: Ae,
			rimY: je,
			boxW: Oe,
			boxH: ke,
			unrotatedW: Te,
			unrotatedH: Ee,
			cxBox: V,
			cyBox: Pe,
			leftSide: Me,
			fontColor: R,
			box: oe,
			fontPx: I,
			bold: L,
			font: ae,
			textStyle: z,
			ptToPx: h,
			inside: Ie,
			manualClip: Fe
		});
	}
	let P = v + 2, te = v + y - 2, F = te - P, ne = (e) => {
		if (e.length === 0) return;
		e.sort((e, t) => e.cyBox - t.cyBox);
		let t = 0;
		for (let n of e) t += n.boxH;
		if (t += (e.length - 1) * 3, t > F) {
			let t = e.reduce((e, t) => e + t.boxH, 0), n = e.length;
			if (n === 1) {
				e[0].cyBox = Math.min(Math.max(e[0].cyBox, P + e[0].boxH / 2), te - e[0].boxH / 2);
				return;
			}
			let r = (F - t) / (n - 1), i = P;
			for (let t of e) t.cyBox = i + t.boxH / 2, i += t.boxH + r;
			return;
		}
		for (let t = 1; t < e.length; t++) {
			let n = e[t - 1], r = e[t], i = (n.boxH + r.boxH) / 2 + 3;
			r.cyBox - n.cyBox < i && (r.cyBox = n.cyBox + i);
		}
		let n = e[e.length - 1].cyBox + e[e.length - 1].boxH / 2 - te;
		if (n > 0) for (let t of e) t.cyBox -= n;
		let r = P - (e[0].cyBox - e[0].boxH / 2);
		if (r > 0) for (let t of e) t.cyBox += r;
	};
	ne(N.filter((e) => !e.manualClip && !e.leftSide)), ne(N.filter((e) => !e.manualClip && e.leftSide));
	for (let e of N) e.manualClip || (e.cyBox = Math.max(P + e.boxH / 2, e.cyBox), e.cyBox = Math.min(te - e.boxH / 2, e.cyBox));
	let re = g + 2, ie = g + _ - 2;
	for (let e of N) {
		if (e.manualClip) continue;
		let t = e.boxW / 2;
		e.cxBox - t < re && (e.cxBox = re + t), e.cxBox + t > ie && (e.cxBox = ie - t);
	}
	e.save(), e.beginPath(), e.rect(g, v, _, y), e.clip();
	let I = wr(t, n), L = I.color ? `#${I.color}` : "#a6a6a6", ae = I.widthEmu ? Math.max(.5, I.widthEmu / He * h) : 1;
	e.setLineDash(Mi(I.dash ?? void 0, ae));
	for (let t of N) {
		let r = t.cxBox + (t.leftSide ? t.boxW / 2 : -t.boxW / 2), i = t.cyBox, a = r - t.rimX, o = i - t.rimY, s = Math.hypot(a, o);
		!t.inside && n.showLeaderLines && I.hidden !== !0 && s > t.fontPx * .9 && (e.beginPath(), e.moveTo(t.rimX, t.rimY), e.lineTo(r, i), e.strokeStyle = L, e.lineWidth = ae, e.stroke());
	}
	for (let t of N) {
		t.manualClip && (e.save(), e.beginPath(), e.rect(t.manualClip.x, t.manualClip.y, t.manualClip.w, t.manualClip.h), e.clip());
		let n = t.cxBox - t.boxW / 2, r = t.cyBox - t.boxH / 2;
		Ge(e, t.box, {
			x: n,
			y: r,
			w: t.boxW,
			h: t.boxH
		}, h, D);
		let i = t.textStyle.textBodyAuthored === !0 || t.textStyle.textLInsEmu != null || t.textStyle.textTInsEmu != null || t.textStyle.textRInsEmu != null || t.textStyle.textBInsEmu != null, a = Re(t.textStyle, t.ptToPx), o = i ? a.left : Math.max(4, t.fontPx * .45), s = i ? a.right : Math.max(4, t.fontPx * .45), c = i ? a.top : Math.max(2, t.fontPx * .28), l = i ? a.bottom : Math.max(2, t.fontPx * .28), u = O(t.unrotatedW, t.unrotatedH, t.textStyle.textRotation, t.textStyle.textVerticalMode), d = t.cxBox + (o - s) / 2, f = t.cyBox + (c - l) / 2, p = n + o, m = n + t.boxW - s, g = Math.max(0, m - p), _ = R(t.textStyle, "center"), v = _ === "left" ? p : _ === "right" ? m : d, y = (e) => (t.textStyle.textVerticalAnchor ?? (t.textStyle.textBodyAuthored === !0 ? "t" : "ctr")) === "t" ? r + c + e / 2 : (t.textStyle.textVerticalAnchor ?? (t.textStyle.textBodyAuthored === !0 ? "t" : "ctr")) === "b" ? r + t.boxH - l - e / 2 : f, b = (e) => _ === "left" ? p : _ === "right" ? m - e : d - e / 2;
		if (e.save(), e.beginPath(), e.rect(n, r, t.boxW, t.boxH), e.clip(), u.radians !== 0 && (e.translate(t.cxBox, t.cyBox), e.rotate(u.radians), e.translate(-t.cxBox, -t.cyBox)), !t.legendKey) {
			let n = y(t.rich?.height ?? Math.max(0, t.lines.length * t.lineHeight - (t.lineHeight - t.fontPx)));
			if (t.rich) {
				Xe(e, t.rich, v, n, _, "middle", g), e.restore(), t.manualClip && e.restore();
				continue;
			}
			e.font = `${t.textStyle.fontItalic ? "italic " : ""}${t.bold ? "bold " : ""}${t.fontPx}px ${t.font}`, e.fillStyle = t.fontColor, e.textAlign = _, e.textBaseline = "middle";
			let r = t.lineHeight - t.fontPx, i = (t.textStyle.fontBaseline ?? 0) * t.fontPx, a = n - (t.lines.length * t.lineHeight - r) / 2 + t.fontPx / 2 - i;
			if (!(t.textStyle.fontPaintAuthored === !0 && (t.textStyle.fontHidden === !0 || t.textStyle.fontColor == null))) for (let n = 0; n < t.lines.length; n++) e.fillText(t.lines[n], v, a + n * t.lineHeight);
			e.restore(), t.manualClip && e.restore();
			continue;
		}
		let x = t.legendKey ? dn([t.legendKey.entry], t.fontPx, t.legendKey.ptToPx)[0] ?? 0 : 0, S = t.legendKey ? fn(t.legendKey.entry, t.fontPx, t.legendKey.ptToPx) : 0, C = t.legendKey && (t.rich || t.lines.length > 0) ? en : 0, w = t.rich?.width ?? t.lines.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), T = x + C + w, E = y(Math.max(S, t.rich?.height ?? Math.max(0, t.lines.length * t.lineHeight - (t.lineHeight - t.fontPx)))), k = b(T);
		if (t.legendKey && Q(e, t.legendKey.entry.swatchStyle, t.legendKey.entry.color, k, E - S / 2, x, S, t.legendKey.entry.marker, t.legendKey.entry.fillPaint, t.legendKey.entry.outlineColor, t.legendKey.entry.outlineWidthEmu, t.legendKey.entry.outlineDash, t.legendKey.entry.outlineCap, t.legendKey.entry.outlineJoin, t.legendKey.ptToPx, t.legendKey.shapeRotationDeg), t.rich) {
			Xe(e, t.rich, k + x + C, E, "left", "middle", w), e.restore(), t.manualClip && e.restore();
			continue;
		}
		e.font = `${t.textStyle.fontItalic ? "italic " : ""}${t.bold ? "bold " : ""}${t.fontPx}px ${t.font}`, e.fillStyle = t.fontColor, e.textAlign = "left", e.textBaseline = "middle";
		let A = t.lineHeight - t.fontPx, j = (t.textStyle.fontBaseline ?? 0) * t.fontPx, M = E - (t.lines.length * t.lineHeight - A) / 2 + t.fontPx / 2 - j;
		if (!(t.textStyle.fontPaintAuthored === !0 && (t.textStyle.fontHidden === !0 || t.textStyle.fontColor == null))) for (let n = 0; n < t.lines.length; n++) e.fillText(t.lines[n], k + x + C, M + n * t.lineHeight);
		e.restore(), t.manualClip && e.restore();
	}
	e.restore();
}
function ui(e, t, n, r, i = 0) {
	let { x: a, y: o, w: s, h: c } = n, l = pr(t), u = l.length;
	if (u < 3) return;
	let d = mn(e, t, s, c, .22, r), f = N(t, a, o, s, c, r, {
		titleTopPadFrac: .035,
		titleBottomPadFrac: .035,
		legendSideReserveFrac: .22,
		legendReserve: d,
		radialGapFrac: .02,
		honorPlotAreaManualLayout: !0
	}), p = f.title.fontPx;
	fr(e, t, a, o, s, c, o + f.title.topPad, p);
	let { px0: m, py0: h, pw: g, ph: _ } = f.plotRect;
	Ne(e, t, m, h, g, _, r, i);
	let v = f.center.cx, y = f.center.cy, b = t.plotAreaManualLayout, x = b?.layoutTarget === "inner" && b.w != null && b.h != null && Number.isFinite(b.w) && Number.isFinite(b.h) && f.plotAreaManualLayoutApplied ? Math.min(g, _) / 2 : Math.min(g, _) * .38, S = Infinity, C = -Infinity;
	for (let e of t.series) for (let t of e.values) t != null && (S = Math.min(S, t), C = Math.max(C, t));
	isFinite(S) || (S = 0, C = 1), C === 0 && (C = 1);
	let w = t.valAxisMinorTickMark != null && t.valAxisMinorTickMark !== "none", T = t.valAxisLogBase != null && Number.isFinite(t.valAxisLogBase) && t.valAxisLogBase >= 2, E = t.valAxisMajorUnit ?? (T ? null : st(t.valMin ?? S, t.valMax ?? C, x / r)), D = G({
		dataMin: S,
		dataMax: C,
		explicitMin: t.valMin,
		explicitMax: t.valMax,
		axisLenPt: x / r,
		axisOrientation: "vertical",
		majorUnit: E,
		minorUnit: t.valAxisMinorUnit,
		needMinor: t.valAxisMinorGridlines === !0 || w,
		logBase: t.valAxisLogBase,
		reversed: Mn(t)
	}), O = (e) => Ai(D.fraction(e), 0, 1), k = -Math.PI / 2, A = (e) => k + e / u * Math.PI * 2, j = D.majorTicks.filter((e) => O(e) > 0), M = (t) => {
		let n = O(t) * x;
		e.beginPath();
		for (let t = 0; t < u; t++) {
			let r = A(t), i = v + Math.cos(r) * n, a = y + Math.sin(r) * n;
			t === 0 ? e.moveTo(i, a) : e.lineTo(i, a);
		}
		e.closePath(), e.stroke();
	};
	if (t.valAxisMinorGridlines) {
		let n = Tn(t, r);
		e.strokeStyle = n.color, e.lineWidth = n.width;
		let i = n.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
		n.dash.length > 0 && e.setLineDash(n.dash);
		for (let e of D.minorTicks) M(e);
		n.dash.length > 0 && e.setLineDash(i);
	}
	if (!t.valAxisHidden && Pn(t)) {
		let n = wn(t, r);
		e.strokeStyle = n.color, e.lineWidth = n.width;
		let i = n.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
		n.dash.length > 0 && e.setLineDash(n.dash);
		for (let e of j) M(e);
		n.dash.length > 0 && e.setLineDash(i);
	}
	e.strokeStyle = "#bbb", e.lineWidth = .5;
	for (let t = 0; t < u; t++) {
		let n = A(t);
		e.beginPath(), e.moveTo(v, y), e.lineTo(v + Math.cos(n) * x, y + Math.sin(n) * x), e.stroke();
	}
	if (!t.valAxisHidden) {
		e.font = Pt(Jn(t.valAxisFontSizeHpt, c, r), Y(t, t.valAxisFontFace, "minor"), t.valAxisFontBold ?? !1, t.valAxisFontItalic ?? !1), e.fillStyle = t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#555", e.textAlign = "right", e.textBaseline = "middle";
		for (let n of j) {
			let i = y - O(n) * x, a = ue(t.valAxisLineColor, t.valAxisLineWidthEmu, r);
			yn(e, t.valAxisMajorTickMark, "val", v, i, a.color, a.width, !1, t.valAxisLineHidden, "major", r, t.valAxisLineDash), t.valAxisTickLabelPos !== "none" && e.fillText(In(t, n, !1), v - 3, i);
		}
		if (w) {
			let n = ue(t.valAxisLineColor, t.valAxisLineWidthEmu, r);
			for (let i of D.minorTicks) yn(e, t.valAxisMinorTickMark, "val", v, y - O(i) * x, n.color, n.width, !1, t.valAxisLineHidden, "minor", r, t.valAxisLineDash);
		}
	}
	e.font = Pt(t.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, x * .2)) : Jn(t.catAxisFontSizeHpt, c, r), Y(t, t.catAxisFontFace, "minor"), t.catAxisFontBold ?? !1, t.catAxisFontItalic ?? !1), e.fillStyle = t.catAxisFontColor ? `#${t.catAxisFontColor}` : "#444", e.textBaseline = "middle";
	let ee = v - g / 2, te = v + g / 2;
	if (!t.catAxisHidden && Zn(t)) for (let n = 0; n < u; n++) {
		let r = A(n), i = P(12, t.catAxisLabelOffsetPercent), a = v + Math.cos(r) * (x + i), o = y + Math.sin(r) * (x + i), s = t.catAxisLabelAlignment, c = s === "l" ? "left" : s === "r" ? "right" : s === "ctr" ? "center" : Math.cos(r) < -.1 ? "right" : Math.cos(r) > .1 ? "left" : "center";
		e.textAlign = c;
		let u = c === "right" ? a - ee : c === "left" ? te - a : 2 * Math.min(te - a, a - ee), d = Ae((l[n] ?? "").toString(), t.catAxisFormatCode, t.date1904);
		e.fillText(q(e, d, u), a, o);
	}
	let F = de("radar", t.chartType, t.scatterStyle, t.radarStyle), ne = Math.max(2, x * .025);
	for (let n = 0; n < t.series.length; n++) {
		let a = t.series[n], o = At(n, a), s = [];
		for (let e = 0; e < u; e++) {
			let t = a.values[e];
			if (t == null) {
				s.push(null);
				continue;
			}
			let n = O(t), r = A(e);
			s.push([v + Math.cos(r) * x * n, y + Math.sin(r) * x * n]);
		}
		e.beginPath();
		let c = !1;
		for (let t of s) {
			if (t == null) {
				c = !1;
				continue;
			}
			c ? e.lineTo(t[0], t[1]) : (e.moveTo(t[0], t[1]), c = !0);
		}
		let l = s.every((e) => e != null);
		if (F && l ? (e.closePath(), e.fillStyle = re(o, .25), e.fill()) : l && e.closePath(), a.lineHidden !== !0) {
			let t = e.getLineDash ? e.getLineDash() : [], n = e.lineCap, i = e.lineJoin;
			e.strokeStyle = a.lineColor ? `#${a.lineColor}` : o, e.lineWidth = a.lineWidthEmu == null ? 2 : Pe(a.lineWidthEmu, r), e.setLineDash(Mi(a.chartexStyle?.lineDash ?? void 0, e.lineWidth)), e.lineCap = a.chartexStyle?.lineCap === "rnd" ? "round" : a.chartexStyle?.lineCap === "sq" ? "square" : "butt", e.lineJoin = a.chartexStyle?.lineJoin === "round" || a.chartexStyle?.lineJoin === "bevel" ? a.chartexStyle.lineJoin : "miter", e.stroke(), e.setLineDash(t), e.lineCap = n, e.lineJoin = i;
		}
		let d = !F && a.showMarker !== !1 && a.markerSymbol !== "none";
		if (!F && (d || Me(a))) {
			let t = jt(a.dataPointOverrides);
			for (let n = 0; n < s.length; n++) {
				let c = s[n];
				if (c == null) continue;
				let l = t.get(n), u = Te(a, l, "circle", d);
				if (u === "none") continue;
				let f = l?.markerSize ?? a.markerSize ?? Math.max(4, ne * 2 / r), p = se(a, l, n, o), m = l?.markerLine ?? a.markerLine ?? null, h = l?.markerLineWidthEmu ?? a.markerLineWidthEmu;
				Si(e, c[0], c[1], u, f, p, m, r, h == null ? 1 : Pe(h, r), ve(a, l, n), i);
			}
		}
	}
	_n(e, t, d, a, o, s, c, m, h, g, _, f.title.bandH + 2, r);
}
function di(e, t, n) {
	if (n) return t + 1;
	let r = e[t];
	if (r == null) return null;
	let i = parseFloat(r);
	return Number.isNaN(i) ? null : i;
}
function fi(e, t) {
	return e.bubbleSizeRepresents === "w" ? t : Math.sqrt(t);
}
function pi(e, t, n, r) {
	return se(e, t, n, r);
}
function mi(e, t, n, r, i, a = V(t, n)) {
	let o = t.bubbleSizes?.[r];
	if (o != null && Number.isFinite(o) && o < 0) return t.invertedFillHidden === !0 ? {
		color: "00000000",
		paint: null
	} : t.invertedFill ? {
		color: t.invertedFill.fillType === "solid" ? t.invertedFill.color : i,
		paint: t.invertedFill
	} : a ? {
		color: "FFFFFF",
		paint: void 0
	} : {
		color: "00000000",
		paint: null
	};
	let s = Ki(e, n?.chartexStyle, r, t.values.length);
	if (s !== void 0) return {
		color: s?.fillType === "solid" ? s.color : i,
		paint: s
	};
	if (n?.fillHidden === !0) return {
		color: "00000000",
		paint: null
	};
	if (n?.color != null) return {
		color: n.color,
		paint: void 0
	};
	let c = t.dataPointColors?.[r];
	if (c != null) return {
		color: c,
		paint: void 0
	};
	let l = Ki(e, t.chartexStyle, r, t.values.length);
	if (l !== void 0) return {
		color: l?.fillType === "solid" ? l.color : i,
		paint: l
	};
	if (t.color != null) return {
		color: t.color,
		paint: void 0
	};
	let u = Ki(e, e.chartStyleRoles?.dataPoint, r, t.values.length);
	return u === void 0 ? {
		color: pi(t, n, r, i),
		paint: ve(t, n, r)
	} : {
		color: u?.fillType === "solid" ? u.color : i,
		paint: u
	};
}
function hi(e, t, n, r) {
	let i = n?.chartexStyle, a = t.chartexStyle, o = e.chartStyleRoles?.dataPoint, s = o?.lineNoStyle === !0 ? void 0 : o, c = [
		i,
		a,
		s
	], l = n?.lineDash, u;
	if (l == null) {
		for (let e of c) if (e?.lineDash != null || e?.lineCustomDash != null || e?.lineDashAuthored === !0) {
			l = e.lineDash, u = e.lineCustomDash ?? void 0;
			break;
		}
	}
	let d = {
		widthEmu: n?.lineWidthEmu ?? i?.lineWidthEmu ?? t.lineWidthEmu ?? a?.lineWidthEmu ?? s?.lineWidthEmu ?? n?.markerLineWidthEmu ?? t.markerLineWidthEmu,
		dash: l,
		customDash: u,
		cap: i?.lineCap ?? a?.lineCap ?? s?.lineCap,
		join: i?.lineJoin ?? a?.lineJoin ?? s?.lineJoin
	}, f = Gi(e, i, r, t.values.length);
	if (f !== void 0) return {
		color: f?.fillType === "solid" ? f.color : n?.lineColor ?? null,
		paint: f,
		...d
	};
	if (n?.lineHidden === !0) return {
		color: null,
		paint: null,
		...d
	};
	if (n?.lineColor != null) return {
		color: n.lineColor,
		paint: void 0,
		...d
	};
	let p = Gi(e, a, r, t.values.length);
	if (p !== void 0) return {
		color: p?.fillType === "solid" ? p.color : t.lineColor ?? null,
		paint: p,
		...d
	};
	if (t.lineHidden === !0) return {
		color: null,
		paint: null,
		...d
	};
	if (t.lineColor != null) return {
		color: t.lineColor,
		paint: void 0,
		...d
	};
	let m = Gi(e, o, r, t.values.length);
	if (m !== void 0) return {
		color: m?.fillType === "solid" ? m.color : null,
		paint: m,
		...d
	};
	let h = t.bubbleSizes?.[r], g = h != null && Number.isFinite(h) && h < 0 && V(t, n) ? "000000" : null;
	return {
		color: n?.markerLine ?? t.markerLine ?? t.lineColor ?? g,
		paint: void 0,
		...d
	};
}
function gi(e, t, n) {
	return {
		series: t,
		seriesIndex: n,
		fallbackColor: At(n, t),
		cats: t.categories ?? e.categories,
		pointOverrides: new Map((t.dataPointOverrides ?? []).map((e) => [e.idx, e]))
	};
}
function _i(e, t, n, r, i) {
	let a = Ai(e.bubbleScale ?? 100, 0, 300);
	if (a <= 0) return 0;
	let o = 0;
	for (let { series: r, cats: i, pointOverrides: a } of t) if (!(r.showMarker === !1 || r.markerSymbol === "none")) for (let t = 0; t < r.values.length; t++) {
		if (r.values[t] == null || di(i, t, n) == null || a.get(t)?.markerSymbol === "none") continue;
		let s = H(e, r.bubbleSizes?.[t]);
		s != null && (o = Math.max(o, fi(e, s)));
	}
	return o <= 0 ? 0 : Math.min(r, i) * a / (300 + a) / o;
}
function vi(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _ = 0, v) {
	let y = p === "line" || p === "lineMarker" || p === "lineNoMarker", b = p === "smooth" || p === "smoothMarker" || p === "smoothNoMarker", x = de("scatter", t.chartType, p, t.radarStyle), S = n.map(({ series: e, index: n }) => gi(t, e, n)), C = Xt(t, d), w = v ?? t, T = f ? _i(w, S, r, l, u) : 0;
	for (let { series: n, fallbackColor: o, cats: s } of S) for (let c of n.errBars ?? []) Ci(e, n, Cr(t, c), s, r, i, a, o);
	for (let { series: t, fallbackColor: n, cats: o } of S) {
		let s = p === "marker" && Tt(t), c = s || y, l = !s && p === "marker" && !f || b;
		if ((c || l) && t.lineHidden !== !0) {
			let c = [];
			for (let e = 0; e < t.values.length; e++) {
				let n = t.values[e];
				if (n == null) continue;
				let s = di(o, e, r);
				s != null && c.push({
					x: i(s),
					y: a(n)
				});
			}
			if (c.length >= 2) {
				if (e.save(), s && t.dataPointColors?.some(Boolean)) {
					e.lineWidth = 1.5;
					for (let r = 1; r < c.length; r++) e.strokeStyle = `#${t.dataPointColors[r] ?? t.color ?? n.replace(/^#/, "")}`, e.beginPath(), e.moveTo(c[r - 1].x, c[r - 1].y), e.lineTo(c[r].x, c[r].y), e.stroke();
				} else {
					if (e.strokeStyle = t.color ? `#${t.color}` : n, e.lineWidth = 1.5, e.beginPath(), e.moveTo(c[0].x, c[0].y), l && c.length >= 3) for (let t = 0; t < c.length - 1; t++) {
						let n = c[t - 1] ?? c[t], r = c[t], i = c[t + 1], a = c[t + 2] ?? i;
						e.bezierCurveTo(r.x + (i.x - n.x) / 6, r.y + (i.y - n.y) / 6, i.x - (a.x - r.x) / 6, i.y - (a.y - r.y) / 6, i.x, i.y);
					}
					else for (let t = 1; t < c.length; t++) e.lineTo(c[t].x, c[t].y);
					e.stroke();
				}
				e.restore();
			}
		}
	}
	for (let { series: n, fallbackColor: o, cats: s, pointOverrides: c } of S) {
		let l = !x && n.showMarker !== !1 && n.markerSymbol !== "none";
		if (l || !x && Me(n)) for (let u = 0; u < n.values.length; u++) {
			let p = n.values[u];
			if (p == null) continue;
			let m = di(s, u, r);
			if (m == null) continue;
			let h = c.get(u), g = Te(n, h, f ? "circle" : n.automaticMarkerSymbol ?? "circle", l);
			if (g === "none") continue;
			let v = h?.markerSize ?? n.markerSize ?? 5;
			if (f) {
				if (T <= 0) continue;
				let e = H(w, n.bubbleSizes?.[u]);
				if (e == null) continue;
				v = fi(w, e) * T / d;
			}
			let y = f ? mi(t, n, h, u, o) : null, b = y?.color ?? pi(n, h, u, o), x = f ? hi(t, n, h, u) : null, S = f ? x.color : h?.markerLine ?? n.markerLine ?? null, C = h?.markerLineWidthEmu ?? n.markerLineWidthEmu, E = x?.widthEmu, D = f ? E : C, O = D == null ? void 0 : Pe(D, d);
			Si(e, i(m), a(p), g, v, b, S, d, O, f ? y.paint : ve(n, h, u), _, f ? x.paint : void 0, f ? x.dash : void 0, f ? x.customDash : void 0, f ? x.cap : void 0, f ? x.join : void 0, f ? V(n, h) : !1);
		}
	}
	for (let { series: n, seriesIndex: s, cats: l, pointOverrides: p } of S) wi(e, n, l, r, i, a, u, d, t.date1904, Y(t, t.dataLabelFontFace, "minor"), t.dataLabelPosition ?? "r", {
		x: o.x,
		y: c,
		w: o.w,
		h: u
	}, m, (e) => Y(t, e, "minor"), g, (e) => C(s, e), (e) => hr(t, e, h), _, (e) => {
		if (x) return 0;
		let t = n.showMarker !== !1 && n.markerSymbol !== "none", r = p.get(e);
		if (Te(n, r, "circle", t) === "none") return 0;
		let i = r?.markerSize ?? n.markerSize ?? 5;
		if (f) {
			if (T <= 0) return 0;
			let t = H(w, n.bubbleSizes?.[e]);
			if (t == null) return 0;
			i = fi(w, t) * T / d;
		}
		return Math.max(0, i * d / 2);
	});
	for (let { series: n, fallbackColor: f, cats: p } of S) Gn(e, n, f, i, a, d, n.values.map((e, t) => di(p, t, r)), {
		chart: t,
		chartRect: o,
		plotRect: {
			x: s,
			y: c,
			w: l,
			h: u
		},
		clipLineToPlot: !0,
		shapeRotationDeg: _
	});
}
function yi(e, t, n, r, i = 0) {
	let { x: a, y: o, w: s, h: c } = n, l = t.series.map((e, t) => ({
		series: e,
		index: t
	})), u = g(t), d = ({ series: e, index: n }) => u[n]?.categoryAxis === "secondary" || t.plotGroups == null && e.useSecondaryAxis === !0, f = ({ series: e, index: n }) => u[n]?.valueAxis === "secondary" || t.plotGroups == null && e.useSecondaryAxis === !0, h = l.filter((e) => !d(e)), _ = l.filter(d), y = l.filter((e) => !f(e)), b = l.filter(f), x = l.filter((e) => !d(e) && !f(e)), S = l.filter((e) => d(e) && f(e)), C = _.length > 0 ? t.secondaryCatAxis : null, w = b.length > 0 ? t.secondaryValAxis : null, E = ((e) => {
		let n = [];
		for (let { series: r } of e) {
			let e = r.categories ?? t.categories;
			for (let t of e) {
				let e = parseFloat(t);
				Number.isFinite(e) && n.push(e);
			}
		}
		return n;
	})(l).length === 0, D = l.length === 1 && l[0].series.bubbleXSourceIsString === !0 ? l[0].series.values.length + 1 : null, O = (e) => {
		let n = [], r = [];
		for (let { series: i } of e) {
			let e = i.categories ?? t.categories;
			for (let t = 0; t < i.values.length; t++) {
				let a = i.values[t];
				if (a == null) continue;
				let o = di(e, t, E);
				o != null && (n.push(o), r.push(a));
			}
			nr(i, "x", (t) => i.values[t] == null ? null : di(e, t, E), (e) => n.push(e)), nr(i, "y", (t) => di(e, t, E) == null ? null : i.values[t] ?? null, (e) => r.push(e));
		}
		if (E && n.length === 0) {
			let t = 0;
			for (let { series: n } of e) t = Math.max(t, n.values.length);
			for (let e = 0; e < t; e++) n.push(e);
		}
		return {
			x: ot(n),
			y: ot(r)
		};
	}, k = {
		x: O(h.length > 0 ? h : _).x,
		y: O(y.length > 0 ? y : b).y
	}, A = {
		x: O(_).x,
		y: O(b).y
	}, j = ur(e, t, s, c, r), M = j.fontPx, ee = j.topPad, P = Jn(t.catAxisFontSizeHpt, c, r), te = Jn(t.valAxisFontSizeHpt, c, r), F = mn(e, t, s, c, .22, r), { legRightW: ne, legLeftW: re, legTopH: ie, legBottomH: I } = Ve(F, t.legendOverlay === !0), L = T(t, s, c, r), ae = L.catFontPx, R = L.valFontPx, oe = L.catBandH, se = L.valBandW;
	fr(e, t, a, o, s, c, o + ee, M);
	let ce = w ? G({
		dataMin: A.y.min,
		dataMax: A.y.max,
		explicitMin: w.min,
		explicitMax: w.max,
		axisLenPt: Math.max(1, c * .7 / r),
		axisOrientation: "vertical",
		majorUnit: w.majorUnit,
		minorUnit: w.minorUnit,
		needMinor: w.minorGridlines === !0 || w.minorTickMark != null && w.minorTickMark !== "none",
		logBase: w.logBase,
		reversed: w.orientation === "maxMin"
	}) : null, le = 0;
	if (w && ce && !w.hidden && w.tickLabelPos !== "none") {
		let n = e.font;
		e.font = Pt(p(w.fontSizeHpt, r) ?? te, Y(t, w.fontFace, "minor"), w.fontBold ?? !1, w.fontItalic ?? !1);
		for (let n of ce.majorTicks) le = Math.max(le, e.measureText(Rn(n, w.formatCode, t.date1904, w.displayUnits)).width);
		le += ke(te) + 4, e.font = n;
	}
	let z = C && !C.hidden && C.tickLabelPos !== "none" ? (p(C.fontSizeHpt, r) ?? P) + v(P) + 2 : 0, { plotRect: { px0: de, py0: B, pw: fe, ph: pe } } = N(t, a, o, s, c, r, {
		titleBand: j,
		legendSideReserveFrac: .22,
		legendReserve: F,
		pad: {
			t: j.bandH + ie + te / 2 + 2 + z,
			r: ne + s * .05 + le,
			b: (t.catAxisHidden ? c * .04 : m(P)) + oe + I,
			l: (t.valAxisHidden ? s * .04 : s * .12) + se + re
		},
		honorPlotAreaManualLayout: !0
	});
	if (fe <= 0 || pe <= 0) return;
	Ne(e, t, de, B, fe, pe, r, i);
	let { min: me, max: he } = k.x, { min: ge, max: _e } = k.y;
	t.valMin != null && (ge = t.valMin), t.valMax != null && (_e = t.valMax);
	let ve = t.valAxisMinorGridlines === !0 || t.valAxisMinorTickMark != null && t.valAxisMinorTickMark !== "none", ye = G({
		dataMin: ge,
		dataMax: _e,
		explicitMin: t.valMin,
		explicitMax: t.valMax,
		axisLenPt: pe / r,
		axisOrientation: "vertical",
		majorUnit: t.valAxisMajorUnit,
		minorUnit: t.valAxisMinorUnit,
		needMinor: ve,
		logBase: t.valAxisLogBase,
		reversed: Mn(t)
	});
	ge = ye.min, _e = ye.max;
	let be = t.catAxisMinorGridlines === !0 || t.catAxisMinorTickMark != null && t.catAxisMinorTickMark !== "none", xe = G({
		dataMin: me,
		dataMax: he,
		explicitMin: t.catAxisMin ?? (D == null ? null : 0),
		explicitMax: t.catAxisMax ?? D,
		axisLenPt: fe / r,
		axisOrientation: "horizontal",
		majorUnit: t.catAxisMajorUnit,
		minorUnit: t.catAxisMinorUnit,
		needMinor: be,
		logBase: t.catAxisLogBase,
		reversed: Nn(t)
	});
	me = xe.min, he = xe.max;
	let Se = C ? G({
		dataMin: A.x.min,
		dataMax: A.x.max,
		explicitMin: C.min,
		explicitMax: C.max,
		axisLenPt: fe / r,
		axisOrientation: "horizontal",
		majorUnit: C.majorUnit,
		minorUnit: C.minorUnit,
		needMinor: C.minorGridlines === !0 || C.minorTickMark != null && C.minorTickMark !== "none",
		logBase: C.logBase,
		reversed: C.orientation === "maxMin"
	}) : null, Ce = w ? G({
		dataMin: A.y.min,
		dataMax: A.y.max,
		explicitMin: w.min,
		explicitMax: w.max,
		axisLenPt: pe / r,
		axisOrientation: "vertical",
		majorUnit: w.majorUnit,
		minorUnit: w.minorUnit,
		needMinor: w.minorGridlines === !0 || w.minorTickMark != null && w.minorTickMark !== "none",
		logBase: w.logBase,
		reversed: w.orientation === "maxMin"
	}) : null, we = (e) => de + xe.fraction(e) * fe, Te = (e) => B + pe - ye.fraction(e) * pe, Ee = (e) => de + (Se?.fraction(e) ?? 0) * fe, De = (e) => B + pe - (Ce?.fraction(e) ?? 0) * pe, Oe = xe.majorUnit, Ae = ye.majorTicks, je = ye.minorTicks, Me = xe.majorTicks, V = xe.minorTicks, Fe = B + pe;
	if (t.catAxisCrossesAt != null) Fe = Ai(Te(t.catAxisCrossesAt), B, B + pe);
	else {
		let e = t.catAxisCrosses ?? "autoZero";
		e === "autoZero" && ge < 0 && _e > 0 ? Fe = Ai(Te(0), B, B + pe) : e === "max" && (Fe = B);
	}
	let Ie = de;
	if (t.valAxisCrossesAt != null) Ie = Ai(we(t.valAxisCrossesAt), de, de + fe);
	else {
		let e = t.valAxisCrosses ?? "autoZero";
		e === "autoZero" && me < 0 && he > 0 ? Ie = Ai(we(0), de, de + fe) : e === "max" && (Ie = de + fe);
	}
	let H = wn(t, r);
	if (!t.valAxisHidden) {
		let n = t.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, pe / 20)) : Jn(t.valAxisFontSizeHpt, c, r), i = t.valAxisFontSizeHpt == null ? 4 : ke(n);
		e.font = Pt(n, Y(t, t.valAxisFontFace, "minor"), t.valAxisFontBold ?? !1, t.valAxisFontItalic ?? !1);
		let a = t.valAxisLineColor ? `#${t.valAxisLineColor}` : void 0, o = Pe(t.valAxisLineWidthEmu, r), s = t.valAxisLineHidden ? 0 : Sn(t.valAxisMajorTickMark, "major", o, r);
		if (t.valAxisMinorGridlines) {
			let n = Tn(t, r);
			for (let t of je) Cn(e, de, fe, Te(t), !1, n);
		}
		for (let n of Ae) {
			let c = Te(n);
			if (e.strokeStyle = H.color, e.lineWidth = H.width, Pn(t)) {
				let t = H.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
				H.dash.length > 0 && e.setLineDash(H.dash), e.beginPath(), e.moveTo(de, c), e.lineTo(de + fe, c), e.stroke(), H.dash.length > 0 && e.setLineDash(t);
			}
			if (t.valAxisTickLabelPos !== "none") {
				e.fillStyle = t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#555";
				let r = t.valAxisTickLabelPos ?? "nextTo", a;
				r === "high" ? (e.textAlign = "left", a = de + fe + i) : r === "low" ? (e.textAlign = "right", a = de - i) : (e.textAlign = "right", a = Ie - s - i), e.textBaseline = "middle", e.fillText(In(t, n, !1), a, c);
			}
			yn(e, t.valAxisMajorTickMark, "val", Ie, c, a, o, !1, t.valAxisLineHidden, "major", r, t.valAxisLineDash);
		}
		if (t.valAxisMinorTickMark && t.valAxisMinorTickMark !== "none") for (let n of je) yn(e, t.valAxisMinorTickMark, "val", Ie, Te(n), a, o, !1, t.valAxisLineHidden, "minor", r, t.valAxisLineDash);
	}
	if (!t.catAxisHidden && On(t) && Oe > 0) {
		let n = kn(t, r);
		e.strokeStyle = n.color, e.lineWidth = n.width;
		let i = n.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
		n.dash.length > 0 && e.setLineDash(n.dash);
		for (let t of Me) {
			let n = we(t);
			e.beginPath(), e.moveTo(n, B), e.lineTo(n, B + pe), e.stroke();
		}
		n.dash.length > 0 && e.setLineDash(i);
	}
	if (!t.catAxisHidden && t.catAxisMinorGridlines && Oe > 0) {
		let n = An(t, r), i = n.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
		e.strokeStyle = n.color, e.lineWidth = n.width, n.dash.length > 0 && e.setLineDash(n.dash);
		for (let t of V) {
			let n = we(t);
			e.beginPath(), e.moveTo(n, B), e.lineTo(n, B + pe), e.stroke();
		}
		n.dash.length > 0 && e.setLineDash(i);
	}
	if (!t.catAxisHidden && !t.catAxisLineHidden && (e.save(), e.lineCap = "butt", bn(e, de, Fe, de + fe, Fe, t.catAxisLineColor ? `#${t.catAxisLineColor}` : "#888", Pe(t.catAxisLineWidthEmu, r), t.catAxisLineDash), e.restore()), !t.valAxisHidden && !t.valAxisLineHidden && (e.save(), bn(e, Ie, B, Ie, B + pe, t.valAxisLineColor ? `#${t.valAxisLineColor}` : "#888", Pe(t.valAxisLineWidthEmu, r), t.valAxisLineDash), e.restore()), !t.catAxisHidden) {
		let n = t.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, pe / 20)) : Jn(t.catAxisFontSizeHpt, c, r), i = t.catAxisFontSizeHpt == null ? 4 : v(n);
		e.font = Pt(n, Y(t, t.catAxisFontFace, "minor"), t.catAxisFontBold ?? !1, t.catAxisFontItalic ?? !1), e.fillStyle = t.catAxisFontColor ? `#${t.catAxisFontColor}` : "#555", e.textAlign = "center";
		let a = t.catAxisTickLabelPos ?? "nextTo", o = Pe(t.catAxisLineWidthEmu, r), s = t.catAxisLineColor ? `#${t.catAxisLineColor}` : void 0, l = t.catAxisLineHidden ? 0 : Sn(t.catAxisMajorTickMark, "major", o, r), u = a === "low" ? B + pe + i : a === "high" ? B - i : Fe + l + i;
		e.textBaseline = a === "high" ? "bottom" : "top";
		for (let n of Me) {
			let i = we(n);
			a !== "none" && e.fillText(Rn(n, t.catAxisFormatCode, t.date1904, t.catAxisDisplayUnits), i, u), yn(e, t.catAxisMajorTickMark, "cat", Fe, i, s, o, !1, t.catAxisLineHidden, "major", r, t.catAxisLineDash);
		}
		if (t.catAxisMinorTickMark && t.catAxisMinorTickMark !== "none") for (let n of V) yn(e, t.catAxisMinorTickMark, "cat", Fe, we(n), s, o, !1, t.catAxisLineHidden, "minor", r, t.catAxisLineDash);
	}
	let U = (l, u, d, f, p, m, h, g) => {
		l.length !== 0 && vi(e, t, l, E, f, p, n, de, B, fe, pe, r, u, d, {
			x: a,
			y: o,
			w: s,
			h: c
		}, m, h, i, g);
	};
	if (t.plotGroups == null) {
		let e = t.chartType === "bubble", n = e ? "marker" : t.scatterStyle ?? "marker";
		U(x, e, n, we, Te, ye.max, t.valAxisDisplayUnits), S.length > 0 && Se && Ce && U(S, e, n, Ee, De, Ce.max, w?.displayUnits);
	} else for (let e of t.plotGroups) {
		if (e.kind !== "scatter" && e.kind !== "bubble") continue;
		let n = t.series.slice(e.seriesStart, e.seriesStart + e.seriesCount).map((t, n) => ({
			series: t,
			index: e.seriesStart + n
		}));
		if (n.length === 0) continue;
		let r = e.kind === "bubble", i = e.categoryAxis === "secondary", a = e.valueAxis === "secondary";
		U(n, r, r ? "marker" : e.scatterStyle ?? t.scatterStyle ?? "marker", i ? Ee : we, a ? De : Te, a && Ce ? Ce.max : ye.max, a ? w?.displayUnits : t.valAxisDisplayUnits, r ? {
			bubbleScale: e.bubbleScale ?? t.bubbleScale,
			bubbleSizeRepresents: e.bubbleSizeRepresents ?? t.bubbleSizeRepresents,
			showNegativeBubbles: e.showNegativeBubbles ?? t.showNegativeBubbles
		} : void 0);
	}
	if (C && Se && !C.hidden) {
		let n = ue(C.lineColor, C.lineWidthEmu, r);
		C.lineHidden || bn(e, de, B, de + fe, B, n.color, n.width, C.lineDash);
		let i = p(C.fontSizeHpt, r) ?? P;
		e.font = Pt(i, Y(t, C.fontFace, "minor"), C.fontBold ?? !1, C.fontItalic ?? !1), e.fillStyle = C.fontColor ? `#${C.fontColor}` : "#555", e.textAlign = "center", e.textBaseline = "bottom";
		let a = C.lineHidden ? 0 : Sn(C.majorTickMark, "major", n.width, r);
		for (let o of Se.majorTicks) {
			let s = Ee(o);
			C.tickLabelPos !== "none" && e.fillText(Rn(o, C.formatCode, t.date1904, C.displayUnits), s, B - a - v(i)), yn(e, C.majorTickMark, "cat", B, s, n.color, n.width, !0, C.lineHidden, "major", r, C.lineDash);
		}
		if (C.minorTickMark && C.minorTickMark !== "none") for (let t of Se.minorTicks) yn(e, C.minorTickMark, "cat", B, Ee(t), n.color, n.width, !0, C.lineHidden, "minor", r, C.lineDash);
	}
	w && Ce && ar(e, t, w, {
		min: Ce.min,
		max: Ce.max,
		step: Ce.majorUnit,
		majorLines: Ce.majorTicks,
		minorTicks: Ce.minorTicks,
		makeToY: () => De
	}, De, n, de, B, fe, pe, r, p(w.fontSizeHpt, r) ?? te, le, t.valAxisFontColor ? `#${t.valAxisFontColor}` : "#555", t.date1904), _n(e, t, F, a, o, s, c, de, B, fe, pe, j.bandH + 2, r), Bt(e, t, a, o, s, c, de, B, fe, pe, re, I, ae, R);
}
var bi = 15;
function xi(e, t, n, r) {
	let i = e.globalCompositeOperation, a = e.fillStyle;
	e.save(), e.clip();
	let o = (i) => {
		e.globalCompositeOperation = "source-atop", e.fillStyle = i, e.fillRect(t - r / 2, n - r / 2, r, r);
	}, s = t - r * .08, c = n - r * .17, l = e.createRadialGradient(s, c, 0, s, c, r * .55);
	l.addColorStop(0, "rgba(255,255,255,0.72)"), l.addColorStop(.14, "rgba(255,255,255,0.48)"), l.addColorStop(.38, "rgba(255,255,255,0.1)"), l.addColorStop(1, "rgba(255,255,255,0)"), o(l);
	let u = t - r * .08, d = n - r * .18, f = e.createRadialGradient(u, d, 0, u, d, r * .78);
	f.addColorStop(0, "rgba(0,0,0,0)"), f.addColorStop(.3, "rgba(0,0,0,0)"), f.addColorStop(.46, "rgba(0,0,0,0.22)"), f.addColorStop(.66, "rgba(0,0,0,0.48)"), f.addColorStop(1, "rgba(0,0,0,0.62)"), o(f);
	let p = t - r * .2, m = n - r * .45, h = e.createRadialGradient(p, m, 0, p, m, r);
	h.addColorStop(0, "rgba(255,255,255,0)"), h.addColorStop(.76, "rgba(255,255,255,0)"), h.addColorStop(.82, "rgba(255,255,255,0.05)"), h.addColorStop(.87, "rgba(255,255,255,0.12)"), h.addColorStop(.95, "rgba(255,255,255,0.28)"), h.addColorStop(1, "rgba(255,255,255,0)"), o(h), e.globalCompositeOperation = i, e.fillStyle = a, e.restore();
}
function Si(e, t, n, r, i, a, o, s, c = 1, l = void 0, u = 0, d = void 0, f = void 0, p = void 0, m = void 0, h = void 0, g = !1) {
	let _ = Math.max(2, i * s), v = _ / 2, b = a.startsWith("#") ? a : `#${a}`, x = o ? o.startsWith("#") ? o : `#${o}` : null;
	e.save(), e.fillStyle = l === void 0 ? b : l == null ? "rgba(0,0,0,0)" : Ie(l, e, t - v, n - v, _, _, u) ?? "rgba(0,0,0,0)";
	let S = d === void 0 ? x : d == null ? null : Ie(d, e, t - v, n - v, _, _, u), C = S != null;
	S && (e.strokeStyle = S, e.lineWidth = c, e.setLineDash(Ni(p, f, c)), e.lineCap = m === "rnd" ? "round" : m === "sq" ? "square" : "butt", e.lineJoin = h === "round" || h === "bevel" ? h : "miter");
	let w = l?.fillType === "image" ? l : void 0, T = () => {
		if (!w) {
			l !== null && e.fill();
			return;
		}
		e.save(), e.clip(), y(e, w, t - v, n - v, _, _, s, u), e.restore();
	}, E = () => {
		g && l !== null && xi(e, t, n, _);
	};
	switch (r) {
		case "square":
			w || g ? (e.beginPath(), e.rect(t - v, n - v, _, _), T(), E()) : l !== null && e.fillRect(t - v, n - v, _, _), C && e.strokeRect(t - v, n - v, _, _);
			break;
		case "diamond":
			e.beginPath(), e.moveTo(t, n - v), e.lineTo(t + v, n), e.lineTo(t, n + v), e.lineTo(t - v, n), e.closePath(), T(), E(), C && e.stroke();
			break;
		case "triangle":
			e.beginPath(), e.moveTo(t, n - v), e.lineTo(t + v, n + v), e.lineTo(t - v, n + v), e.closePath(), T(), E(), C && e.stroke();
			break;
		case "x":
			e.strokeStyle = S ?? e.fillStyle, e.lineWidth = Math.max(1, _ * .18), e.beginPath(), e.moveTo(t - v, n - v), e.lineTo(t + v, n + v), e.moveTo(t - v, n + v), e.lineTo(t + v, n - v), e.stroke();
			break;
		case "plus":
			e.strokeStyle = S ?? e.fillStyle, e.lineWidth = Math.max(1, _ * .18), e.beginPath(), e.moveTo(t - v, n), e.lineTo(t + v, n), e.moveTo(t, n - v), e.lineTo(t, n + v), e.stroke();
			break;
		case "star":
			e.beginPath();
			for (let r = 0; r < 10; r++) {
				let i = r % 2 == 0 ? v : v * .45, a = -Math.PI / 2 + r * Math.PI / 5, o = t + Math.cos(a) * i, s = n + Math.sin(a) * i;
				r === 0 ? e.moveTo(o, s) : e.lineTo(o, s);
			}
			e.closePath(), T(), E(), C && e.stroke();
			break;
		case "dot":
			e.beginPath(), e.ellipse(t, n, _ * .25, _ * .1, 0, 0, Math.PI * 2), T(), E(), C && e.stroke();
			break;
		case "dash": {
			let r = _ * .2;
			w || g ? (e.beginPath(), e.rect(t - v, n - r / 2, _, r), T(), E()) : l !== null && e.fillRect(t - v, n - r / 2, _, r), C && e.strokeRect(t - v, n - r / 2, _, r);
			break;
		}
		case "picture":
			e.beginPath(), e.rect(t - v, n - v, _, _), w && y(e, w, t - v, n - v, _, _, s, u), E(), C && e.strokeRect(t - v, n - v, _, _), e.restore();
			return;
		default:
			e.beginPath(), e.arc(t, n, v, 0, Math.PI * 2), T(), E(), C && e.stroke();
			break;
	}
	e.restore();
}
function Ci(e, t, n, r, i, a, o, s) {
	if (n.hidden === !0) return;
	e.save(), e.strokeStyle = n.color ? `#${n.color}` : s, e.lineWidth = n.lineWidthEmu ? Math.max(.5, n.lineWidthEmu / He) : 1, e.setLineDash(Mi(n.dash, e.lineWidth));
	let c = n.barType === "plus" || n.barType === "both", l = n.barType === "minus" || n.barType === "both", u = n.dir === "x", d = e.lineWidth / 2;
	for (let s = 0; s < t.values.length; s++) {
		let f = t.values[s];
		if (f == null) continue;
		let p = di(r, s, i);
		if (p == null) continue;
		let m = a(p), h = o(f), g = (t) => {
			let r = m, i = h;
			u ? r = a(p + t) : i = o(f + t), e.beginPath(), e.moveTo(m, h), e.lineTo(r, i), e.stroke(), n.noEndCap || (e.save(), e.setLineDash([]), e.beginPath(), u ? (e.moveTo(r, i - d), e.lineTo(r, i + d)) : (e.moveTo(r - d, i), e.lineTo(r + d, i)), e.stroke(), e.restore());
		};
		if (c) {
			let e = n.plus[s];
			e != null && g(e);
		}
		if (l) {
			let e = n.minus[s];
			e != null && g(-e);
		}
	}
	e.restore();
}
function wi(e, t, n, r, i, o, s, c, l = !1, u = "sans-serif", d = "r", f = {
	x: -1e6,
	y: -1e6,
	w: 2e6,
	h: 2e6
}, m = f, h, g, _, v, y = 0, b) {
	let x = t.dataLabelOverrides ?? [], S = jt(x);
	if (x.length === 0 && !t.seriesDataLabels) return;
	let C = t.seriesDataLabels;
	for (let x = 0; x < t.values.length; x++) {
		let w = t.values[x];
		if (w == null || v && !v(w)) continue;
		let T = di(n, x, r);
		if (T == null) continue;
		let D = S.get(x);
		if (E(C, D)) continue;
		let O = D?.showCatName ?? C?.showCatName, k = D?.showSerName ?? C?.showSerName, A = D?.showVal ?? C?.showVal, j = D?.showBubbleSize ?? C?.showBubbleSize, M = D?.showLegendKey ?? C?.showLegendKey ?? !1, N = et({
			customText: D?.text,
			showCategory: O,
			showSeries: k,
			showValue: A,
			showBubbleSize: j,
			category: r ? Ae((n[x] ?? String(T)).toString(), t.catFormatCodes?.[x] ?? t.catFormatCode ?? null, l) : I(T, t.catFormatCodes?.[x] ?? t.catFormatCode ?? null, l),
			seriesName: t.name,
			sourceValue: w,
			bubbleSize: t.bubbleSizes?.[x] ?? void 0,
			valueDivisor: Ln(g),
			formatCode: D?.formatCode ?? C?.formatCode ?? null,
			date1904: l,
			separator: D?.separator ?? C?.separator
		}), ee = M ? _?.(x) : void 0;
		if (!N && !ee) continue;
		let P = D?.position ?? C?.position ?? d, te = p(D?.fontSizeHpt ?? C?.fontSizeHpt, c) ?? Math.max(9, Math.min(11, s / 25)), F = D?.fontColor ?? C?.fontColor, ne = D?.fontBold ?? C?.fontBold ?? !1, re = D?.fontFace ?? C?.fontFace, ie = re && h ? h(re) : u;
		Ti(e, i(T), o(w), N, P, te, F, ne, ie, b?.(x) ?? 0, f, D?.manualLayout, m, D?.richRuns, c, h, ee, a(D, C), We(D?.labelBox, C?.labelBox), y);
	}
}
function Ti(e, t, n, r, i, a, o, s, c = "sans-serif", l = 0, u = {
	x: -1e6,
	y: -1e6,
	w: 2e6,
	h: 2e6
}, d, f = u, p, m = 1, h, g, _, v, y = 0) {
	e.save(), e.font = `${_?.fontItalic ? "italic " : ""}${s ? "bold " : ""}${a}px ${c}`, Oi(e, r, {
		kind: "point",
		x: t,
		y: n,
		position: i,
		markerGap: l
	}, u, a, o ? `#${o}` : "#333", d, f, p && p.length > 0 ? {
		runs: p,
		ptToPx: m,
		fontFamily: c,
		fallbackBold: s,
		fallbackItalic: _?.fontItalic,
		fallbackBaseline: _?.fontBaseline,
		fallbackColorHidden: _?.fontPaintAuthored === !0 && (_.fontHidden === !0 || _.fontColor == null),
		fontFamilyForFace: h
	} : void 0, g, _, m, v, y), e.restore();
}
function Ei(e, t, n, r, i, a) {
	if (!(!t?.text || !t.richRuns || t.richRuns.length === 0)) return Di(e, t.richRuns, n, r, i, a);
}
function Di(e, t, n, r, i, a) {
	if (!(!t || t.length === 0)) return {
		runs: t,
		ptToPx: n,
		fontFamily: r,
		fallbackBold: i,
		fallbackItalic: a?.fontItalic,
		fallbackBaseline: a?.fontBaseline,
		fallbackColorHidden: a?.fontPaintAuthored === !0 && (a.fontHidden === !0 || a.fontColor == null),
		fontFamilyForFace: (t) => Y(e, t, "minor")
	};
}
function Oi(e, t, n, r, i, a, s, l = r, u, d, f, p = 1, m, h = 0) {
	if (!t && !d || !Number.isFinite(i) || i <= 0) return;
	if (d) {
		ki(e, t, n, r, i, a, s, l, u, d, f, m);
		return;
	}
	if (u) {
		let t = J(e, u, i, a);
		if (!t) return;
		let o = Re(f, p), d = O(t.width + o.left + o.right, t.height + o.top + o.bottom, f?.textRotation, f?.textVerticalMode), g = ge(n, r, {
			w: d.w,
			h: d.h
		}, i, s, l);
		if (!g) return;
		e.save(), e.beginPath(), e.rect(g.clip.x, g.clip.y, g.clip.w, g.clip.h), e.clip(), Ge(e, m, g.rect, p, h);
		let _ = R(f, g.textAlign), v = ze(g.x, g.y, g.rect, t.height + o.top + o.bottom, f, s != null, _, g.textAlign, t.width + o.left + o.right, d.radians), y = c(e, v.x, v.y, d.radians, _, g.textBaseline, o);
		Xe(e, t, y.x, y.y, _, g.textBaseline, s ? Math.max(0, g.rect.w - o.left - o.right) : t.width), e.restore();
		return;
	}
	let g = i * 1.15, _ = o(t).value.split(/\r?\n/), v = _.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), y = Math.max(g, _.length * g), b = Re(f, p), x = O(v + b.left + b.right, y + b.top + b.bottom, f?.textRotation, f?.textVerticalMode), S = ge(n, r, {
		w: x.w,
		h: x.h
	}, i, s, l);
	if (!S) return;
	let C = (t) => e.measureText(t).width, w = U(t, S.maxWidth, S.maxHeight, g, C, f);
	if (w.length === 0) return;
	let T = w.reduce((e, t) => Math.max(e, C(t)), 0), E = w.length * g, D = O(T + b.left + b.right, E + b.top + b.bottom, f?.textRotation, f?.textVerticalMode);
	if (S = ge(n, r, {
		w: D.w,
		h: D.h
	}, i, s, l), !S) return;
	e.save(), e.beginPath(), e.rect(S.clip.x, S.clip.y, S.clip.w, S.clip.h), e.clip(), Ge(e, m, S.rect, p, h);
	let k = f?.fontPaintAuthored === !0 && (f.fontHidden === !0 || f.fontColor == null);
	e.fillStyle = a;
	let A = R(f, S.textAlign);
	e.textAlign = A, e.textBaseline = S.textBaseline;
	let j = ze(S.x, S.y, S.rect, E + b.top + b.bottom, f, s != null, A, S.textAlign, T + b.left + b.right, D.radians), M = c(e, j.x, j.y, D.radians, A, S.textBaseline, b), N = (f?.fontBaseline ?? 0) * i, ee = S.textBaseline === "middle" ? M.y - (w.length - 1) * g / 2 : S.textBaseline === "bottom" ? M.y - (w.length - 1) * g : M.y;
	if (!k) for (let t = 0; t < w.length; t++) e.fillText(w[t], M.x, ee + t * g - N);
	e.restore();
}
function ki(e, t, n, r, i, a, s, c, l, u, d, f) {
	let { entry: p, ptToPx: m, shapeRotationDeg: h } = u, g = dn([p], i, m)[0] ?? 0, _ = fn(p, i, m), v = t ? en : 0, y = t && l ? J(e, l, i, a) : null;
	if (t && l && !y) return;
	let b = i * 1.15, x = t && !y ? o(t).value.split(/\r?\n/) : [], S = y?.width ?? x.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), C = y?.height ?? (x.length > 0 ? Math.max(b, x.length * b) : 0), w = Re(d, m), T = O(g + v + S + w.left + w.right, Math.max(_, C) + w.top + w.bottom, d?.textRotation, d?.textVerticalMode), E = ge(n, r, {
		w: T.w,
		h: T.h
	}, i, s, c);
	if (!E) return;
	let D = x;
	if (t && !y && (D = U(t, Math.max(0, E.maxWidth - g - v), E.maxHeight, b, (t) => e.measureText(t).width, d), D.length === 0)) return;
	let k = y?.width ?? D.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), A = y?.height ?? D.length * b, j = g + v + k, M = Math.max(_, A), N = j + w.left + w.right, ee = M + w.top + w.bottom, P = O(N, ee, d?.textRotation, d?.textVerticalMode);
	if (E = ge(n, r, {
		w: P.w,
		h: P.h
	}, i, s, c), !E) return;
	let te = E.textAlign === "left" ? E.x + P.w / 2 : E.textAlign === "right" ? E.x - P.w / 2 : E.x, F = E.textBaseline === "top" ? E.y + P.h / 2 : E.textBaseline === "bottom" ? E.y - P.h / 2 : E.y;
	if (s) {
		let e = R(d, "center"), t = ze(te, F, E.rect, ee, d, !0, e);
		te = e === "left" ? t.x + N / 2 : e === "right" ? t.x - N / 2 : t.x, F = t.y;
	}
	let ne = te - N / 2 + w.left, re = F - ee / 2 + w.top;
	if (e.save(), e.beginPath(), e.rect(E.clip.x, E.clip.y, E.clip.w, E.clip.h), e.clip(), Ge(e, f, E.rect, m, h), P.radians !== 0 && (e.translate(te, F), e.rotate(P.radians), e.translate(-te, -F)), Q(e, p.swatchStyle, p.color, ne, re + (M - _) / 2, g, _, p.marker, p.fillPaint, p.outlineColor, p.outlineWidthEmu, p.outlineDash, p.outlineCap, p.outlineJoin, m, h), t) {
		let t = ne + g + v;
		if (y) Xe(e, y, t, re + (M - A) / 2, "left", "top");
		else if (!(d?.fontPaintAuthored === !0 && (d.fontHidden === !0 || d.fontColor == null))) {
			e.fillStyle = a, e.textAlign = "left", e.textBaseline = "top";
			let n = (d?.fontBaseline ?? 0) * i, r = re + (M - A) / 2 - n;
			for (let n = 0; n < D.length; n++) e.fillText(D[n], t, r + n * b);
		}
	}
	e.restore();
}
function Ai(e, t, n) {
	return e < t ? t : e > n ? n : e;
}
function ji(e, t, n) {
	if (t.length !== 0) if (n && t.length >= 3) for (let n = 0; n < t.length - 1; n++) {
		let r = t[n - 1] ?? t[n], i = t[n], a = t[n + 1], o = t[n + 2] ?? a, s = i.x + (a.x - r.x) / 6, c = i.y + (a.y - r.y) / 6, l = a.x - (o.x - i.x) / 6, u = a.y - (o.y - i.y) / 6;
		e.bezierCurveTo(s, c, l, u, a.x, a.y);
	}
	else for (let n = 1; n < t.length; n++) e.lineTo(t[n].x, t[n].y);
}
function Mi(e, t = 1) {
	return Le(e ?? "solid", Number.isFinite(t) && t > 0 ? t : 1);
}
function Ni(e, t, n = 1) {
	return ae(e, t, Number.isFinite(n) && n > 0 ? n : 1);
}
function Pi(e, t, n, r, i, a, o, s) {
	if (n.hidden === !0 || n.dir === "x") return;
	let c = n.barType === "plus" || n.barType === "both", l = n.barType === "minus" || n.barType === "both";
	e.save(), e.strokeStyle = n.color ? `#${n.color}` : s, e.lineWidth = n.lineWidthEmu ? Math.max(.5, n.lineWidthEmu / He) : 1, e.setLineDash(Mi(n.dash, e.lineWidth));
	let u = e.lineWidth / 2;
	for (let s = 0; s < r; s++) {
		if (t.values[s] == null) continue;
		let r = o(s), d = i(s), f = a(r), p = (t) => {
			let i = a(r + t);
			e.beginPath(), e.moveTo(d, f), e.lineTo(d, i), e.stroke(), n.noEndCap || (e.save(), e.setLineDash([]), e.beginPath(), e.moveTo(d - u, i), e.lineTo(d + u, i), e.stroke(), e.restore());
		};
		if (c) {
			let e = n.plus[s];
			e != null && p(e);
		}
		if (l) {
			let e = n.minus[s];
			e != null && p(-e);
		}
	}
	e.restore();
}
function Fi(e, t, n, r, i, a, o, s, c, l) {
	if (n.hidden === !0 || !i && n.dir === "x" || i && n.dir === "y") return;
	let u = n.barType === "plus" || n.barType === "both", d = n.barType === "minus" || n.barType === "both";
	e.save(), e.strokeStyle = n.color ? `#${n.color}` : c, e.lineWidth = n.lineWidthEmu ? Math.max(.5, n.lineWidthEmu / He * l) : Math.max(.5, l * .75), e.setLineDash(Mi(n.dash, e.lineWidth));
	let f = Math.max(e.lineWidth / 2, 2 * l);
	for (let c = 0; c < r; c++) {
		if (t.values[c] == null) continue;
		let r = s(c), l = a(c), p = o(r), m = (t) => {
			let a = o(r + t);
			e.beginPath(), i ? (e.moveTo(p, l), e.lineTo(a, l)) : (e.moveTo(l, p), e.lineTo(l, a)), e.stroke(), n.noEndCap || (e.save(), e.setLineDash([]), e.beginPath(), i ? (e.moveTo(a, l - f), e.lineTo(a, l + f)) : (e.moveTo(l - f, a), e.lineTo(l + f, a)), e.stroke(), e.restore());
		};
		if (u) {
			let e = n.plus[c];
			e != null && m(e);
		}
		if (d) {
			let e = n.minus[c];
			e != null && m(-e);
		}
	}
	e.restore();
}
function Ii(e, t, n, r, i, o, s, c, l, u, d, f = "sans-serif", m = "t", h = {
	x: -1e6,
	y: -1e6,
	w: 2e6,
	h: 2e6
}, g = h, _, v, y, b, x, S, C = 0) {
	let w = t.dataLabelOverrides ?? [], T = jt(w), D = t.seriesDataLabels;
	if (w.length === 0 && !D) return !1;
	for (let w = 0; w < r; w++) {
		if (t.values[w] == null && !d) continue;
		let r = s(w);
		if (S && !S(r)) continue;
		let O = t.values[w] ?? 0, k = T.get(w);
		if (E(D, k)) continue;
		let A = k?.showCatName ?? D?.showCatName, j = k?.showSerName ?? D?.showSerName, M = k?.showVal ?? D?.showVal, N = k?.showPercent ?? D?.showPercent, ee = k?.showLegendKey ?? D?.showLegendKey ?? !1, P = et({
			customText: k?.text,
			showCategory: A,
			showSeries: j,
			showValue: M,
			showPercent: N,
			category: n[w] ?? "",
			seriesName: t.name,
			sourceValue: O,
			valueDivisor: Ln(b),
			percentRatio: _?.(w),
			formatCode: k?.formatCode ?? D?.formatCode ?? null,
			date1904: u,
			separator: k?.separator ?? D?.separator
		}), te = ee ? x?.(w) : void 0;
		if (!P && !te) continue;
		let F = k?.position ?? D?.position ?? m, ne = p(k?.fontSizeHpt ?? D?.fontSizeHpt, l) ?? Math.max(9, Math.min(11, c / 25)), re = k?.fontColor ?? D?.fontColor, ie = k?.fontBold ?? D?.fontBold ?? !1, I = k?.fontFace ?? D?.fontFace, L = I && y ? y(I) : f;
		Ti(e, i(w), o(r), P, F, ne, re, ie, L, v?.(w) ?? 0, h, k?.manualLayout, g, k?.richRuns, l, y, te, a(k, D), We(k?.labelBox, D?.labelBox), C);
	}
	return !0;
}
function Li(e, t) {
	return e?.chartexFormatIdx ?? t;
}
function Ri(e, t, n, r, i, o, s, c, l) {
	if (!t) return null;
	let u = t.seriesDataLabels, d = s.get(n);
	if (E(u, d) || !u && !d && !o.visible) return null;
	let f = typeof c == "boolean" ? c : !1, p = typeof c == "number" ? c : void 0, m = !f && (d?.showVal ?? u?.showVal ?? o.showVal), h = d?.showCatName ?? u?.showCatName ?? o.showCatName, g = d?.showSerName ?? u?.showSerName ?? o.showSerName ?? !1, _ = d?.showPercent ?? u?.showPercent ?? o.showPercent ?? !1, v = d?.showLegendKey ?? u?.showLegendKey ?? !1, y = d?.formatCode ?? u?.formatCode ?? e.dataLabelFormatCode ?? null, b = et({
		customText: d?.text,
		showCategory: h,
		showSeries: g,
		showValue: m,
		showPercent: _,
		category: r,
		seriesName: t.name,
		sourceValue: i,
		valueDivisor: Ln(l),
		percentRatio: p,
		formatCode: y ?? t.valFormatCode ?? null,
		percentFormatCode: y ?? "0%",
		date1904: e.date1904,
		separator: d?.separator ?? u?.separator
	});
	return !b && !v ? null : {
		text: b,
		showLegendKey: v,
		position: d?.position ?? u?.position,
		fontColor: d?.fontColor ?? u?.fontColor,
		fontSizeHpt: d?.fontSizeHpt ?? u?.fontSizeHpt,
		fontBold: d?.fontBold ?? u?.fontBold,
		fontFace: d?.fontFace ?? u?.fontFace,
		manualLayout: d?.manualLayout,
		labelBox: We(d?.labelBox, u?.labelBox),
		richRuns: d?.text ? d.richRuns : void 0,
		textStyle: a(d, u)
	};
}
function zi(e, t, n, r, i) {
	return Be(t, n, r);
}
function Bi(e, t, n, r) {
	if (!t.length) return null;
	let i = e.chartexColorStyleMethod;
	return i === "withinLinear" || i === "acrossLinear" || i === "withinLinearReversed" || i === "acrossLinearReversed" ? t[i === "withinLinear" || i === "withinLinearReversed" ? 0 : n % t.length] ?? null : t[n % t.length] ?? null;
}
function Vi(e, t, n) {
	return (e.chartexColorPalette ? Bi(e, e.chartexColorPalette, t, n) : null) ?? e.chartexAccents?.[t % (e.chartexAccents.length || 1)] ?? kt[t % kt.length];
}
function Hi(e, t, n, r) {
	return zi(e, r, "fill", t, n) ?? zi(e, e.chartexDataPointStyle, "fill", t, n) ?? Vi(e, t, n);
}
function Ui(e, t) {
	return A(e, t);
}
function Wi(e, t) {
	return k(e, t);
}
function Gi(e, t, n, r) {
	return f(t, n);
}
function Ki(e, t, n, i) {
	return r(t, n);
}
function qi(e, t, n, r, i, a) {
	let o = Ki(e, r, t, n);
	if (o !== void 0) return o;
	if (i) return {
		fillType: "solid",
		color: i
	};
	let s = Ki(e, a, t, n);
	return s === void 0 ? {
		fillType: "solid",
		color: Vi(e, t, n)
	} : s;
}
function Ji(e, t, n, r, i, a = e.chartexDataPointStyle) {
	let o = r?.fillHidden ? void 0 : Ki(e, r, t, n);
	if (o !== void 0) return o;
	if (r && i) return {
		fillType: "solid",
		color: i
	};
	let s = Ki(e, a, t, n);
	return s === void 0 ? i ? {
		fillType: "solid",
		color: i
	} : {
		fillType: "solid",
		color: Vi(e, t, n)
	} : s;
}
function Yi(e, t, n, r, i, a, o, s = 0) {
	return t.fillType === "solid" ? t.color.startsWith("#") ? t.color : `#${t.color}` : Ie(t, e, n, r, i, a, s) ?? o;
}
function Xi(e, t, n, r, i, a, o = {}) {
	let s = (t, n) => ({
		visible: t?.lineHidden !== !0,
		color: zi(e, t, "line", r, i) ?? n,
		widthEmu: t?.lineWidthEmu ?? null,
		dash: t?.lineDash ?? null,
		cap: t?.lineCap ?? null,
		join: t?.lineJoin ?? null
	}), c = n?.chartexStyle;
	if ((c?.lineHidden != null || c?.lineColors?.some(Boolean) || c?.lineWidthEmu != null || c?.lineDash != null || c?.lineCap != null || c?.lineJoin != null) && !(c?.lineHidden && c.lineNoStyle)) {
		let e = s(c, n?.lineColor ?? a);
		return e.widthEmu ??= n?.lineWidthEmu ?? null, e;
	}
	return n?.lineHidden != null || n?.lineColor != null || n?.lineWidthEmu != null ? {
		visible: n?.lineHidden !== !0,
		color: n?.lineColor ?? a,
		widthEmu: n?.lineWidthEmu ?? null,
		dash: null,
		cap: null,
		join: null
	} : t?.lineNoStyle && o.linkedNoStyleFallback ? s(null, a) : s(t, a);
}
function Zi(e, t, n) {
	return t.visible ? (e.strokeStyle = t.color.startsWith("#") ? t.color : `#${t.color}`, e.lineWidth = t.widthEmu == null ? 1 : Pe(t.widthEmu, n), e.setLineDash(Mi(t.dash ?? void 0, e.lineWidth)), e.lineCap = t.cap === "rnd" ? "round" : t.cap === "sq" ? "square" : "butt", e.lineJoin = t.join === "round" || t.join === "bevel" ? t.join : "miter", !0) : !1;
}
function Qi(e, t, n, r, i, a, o, s, c = {}) {
	return Zi(e, Xi(t, n, r, i, a, o, c), s);
}
function $i(e, t, n, r, i, a, o, s = !1, c = !0) {
	let l = Xi(e, r, n, i, a, o, { linkedNoStyleFallback: s });
	return {
		name: t,
		values: [],
		color: o.replace(/^#/, ""),
		lineHidden: !c || !l.visible,
		lineColor: c && l.visible ? l.color.replace(/^#/, "") : null,
		lineWidthEmu: c ? l.widthEmu : null,
		chartexStyle: {
			lineDash: c ? l.dash : null,
			lineCap: c ? l.cap : null,
			lineJoin: c ? l.join : null
		}
	};
}
var ea = F, ta = ee, na = ea, ra = ta, ia = new Set([
	"pie",
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
	"stackedBarHPct"
]);
function aa(e, t, n, r, i) {
	if (n === "surface") return !1;
	if (n === "area" || n === "stackedArea" || n === "stackedAreaPct") return r < Math.max(e.categories.length, t.categories?.length ?? 0, t.values.length);
	let a = t.values[r];
	if ((n === "line" || n === "stackedLine" || n === "stackedLinePct") && a == null) return (e.chartType === "line" || e.chartType === "stackedLine" || e.chartType === "stackedLinePct") && (e.chartType !== "line" || e.dispBlanksAs === "zero");
	if (a == null || !Number.isFinite(a) || (n === "pie" || n === "doughnut") && a <= 0) return !1;
	if (n === "scatter") {
		if (!i) return !0;
		let n = (t.categories ?? e.categories)[r];
		return n != null && Number.isFinite(Number.parseFloat(n));
	}
	return !0;
}
function oa(e, t, n) {
	let r = p(e.legendFontSizeHpt, n) ?? 10 * n, i = p(e.dataTable?.fontSizeHpt, n) ?? 9 * n, a = p(t.seriesDataLabels?.fontSizeHpt ?? e.dataLabelFontSizeHpt, n) ?? 10 * n;
	for (let e of t.dataLabelOverrides ?? []) a = Math.max(a, p(e.fontSizeHpt, n) ?? a);
	return {
		legend: Math.max(2, (2 * r + nn) * .58),
		table: Math.max(2, i),
		labels: Math.max(2, a)
	};
}
function sa(t, n, r = W, i) {
	let a = e(t.chartType), o = t.chartexBox != null;
	if (!a && !o) return null;
	let s = g(t), c = t.series.some((e, n) => {
		let r = s[n];
		return (r?.kind === "bubble" || r?.kind === "scatter" ? "scatter" : e.seriesType ?? (t.chartType === "bubble" ? "scatter" : t.chartType)) === "scatter" ? (e.categories ?? t.categories).some((e) => Number.isFinite(Number.parseFloat(e))) : !1;
	}), l = Vt(t) && pr(t).length > 0 && t.dataTable?.showKeys === !0, u = L(t), d = t.chartType === "bubble" && i ? _i(t, t.series.map((e, n) => gi(t, e, n)), !c, i.w, i.h) : 0, f = /* @__PURE__ */ new Map();
	if (i) for (let e of t.plotGroups ?? []) {
		if (e.kind !== "bubble" || e.seriesCount === 0) continue;
		let n = t.series.slice(e.seriesStart, e.seriesStart + e.seriesCount).map((n, r) => gi(t, n, e.seriesStart + r));
		f.set(e, _i({
			bubbleScale: e.bubbleScale ?? t.bubbleScale,
			bubbleSizeRepresents: e.bubbleSizeRepresents ?? t.bubbleSizeRepresents,
			showNegativeBubbles: e.showNegativeBubbles ?? t.showNegativeBubbles
		}, n, !c, i.w, i.h));
	}
	let p = 0, m = (e, t = 1) => t <= 0 || e <= 0 ? !0 : !Number.isSafeInteger(t) || e > Math.floor((ta - p) / t) ? !1 : (p += e * t, !0), h = (e, t = 1, i = Math.max(2, 5 * r)) => {
		if (t <= 0 || e == null) return !0;
		let a = e.fillType === "image" ? D(e, n, i, i, r) : Fe(e);
		return e.fillType === "gradient" && a > ea ? !1 : m(a, t);
	};
	if (a) for (let e = 0; e < t.series.length; e++) {
		let n = t.series[e], a = s[e], o = a?.kind === "bubble" || a == null && t.chartType === "bubble", p = a?.kind === "bubble" || a?.kind === "scatter" ? "scatter" : n.seriesType ?? (t.chartType === "bubble" ? "scatter" : t.chartType), g = Oe(t.chartType, a), _ = a?.scatterStyle ?? t.scatterStyle, v = a?.radarStyle ?? t.radarStyle, y = {
			chartType: g,
			bubbleScale: a?.bubbleScale ?? t.bubbleScale,
			showNegativeBubbles: a?.showNegativeBubbles ?? t.showNegativeBubbles
		}, b = o ? {
			bubbleScale: y.bubbleScale,
			bubbleSizeRepresents: a?.bubbleSizeRepresents ?? t.bubbleSizeRepresents,
			showNegativeBubbles: y.showNegativeBubbles
		} : void 0, x = a?.kind === "bubble" ? f.get(a) ?? 0 : d;
		if (!(p === "line" || p === "stackedLine" || p === "stackedLinePct" || p === "area" || p === "stackedArea" || p === "stackedAreaPct" || p === "scatter" || p === "radar" || p === "stock") || de(p, g, _, v)) continue;
		let S = p === "area" || p === "stackedArea" || p === "stackedAreaPct" ? (n.showMarker === !0 || be(n)) && n.markerSymbol !== "none" : p === "stock" ? n.markerSymbol != null && n.markerSymbol !== "none" : n.showMarker !== !1 && n.markerSymbol !== "none";
		if (!S && !Me(n)) continue;
		let C = Math.max(n.values.length, n.categories?.length ?? 0, t.categories.length), w = jt(n.dataPointOverrides);
		for (let a = 0; a < C; a++) {
			if (!je(t, n, p, a, c, y) || o && (x <= 0 || H(b, n.bubbleSizes?.[a]) == null)) continue;
			let s = w.get(a);
			if (!le(Te(n, s, "circle", S))) continue;
			let l = o ? mi(t, n, s, a, At(e, n)) : null, u = o ? l.paint : ve(n, s, a), d = Math.max(2, (s?.markerSize ?? n.markerSize ?? 5) * r);
			if (p === "scatter" && o) {
				let e = H(b, n.bubbleSizes?.[a]);
				d = e == null ? 0 : fi(b, e) * x;
			} else p === "radar" && s?.markerSize == null && n.markerSize == null && i && (d = Math.max(4 * r, Math.min(i.w, i.h) * .025));
			if (!h(u, 1, d)) return ta + 1;
			if (o) {
				let e = hi(t, n, s, a).paint;
				if (!h(e, 1, d) || V(n, s) && l.paint !== null && !m(bi)) return ta + 1;
			}
		}
		if (le(n.markerSymbol ?? (p === "stock" ? "none" : "circle")) && fe(g, _, n, v)) {
			let i = u.has(e), a = me(t, n, p, C, c, y), s = oa(t, n, r), d = o ? mi(t, n, void 0, e, At(e, n)) : null, f = o ? d.paint : ie(n), g = o ? hi(t, n, void 0, e) : null, _ = (e, t) => h(f, e, t) && (!o || h(g.paint, e, t)) && (!o || !V(n, void 0) || d.paint === null || m(bi, e));
			if (t.showLegend && !i && !_(1, s.legend) || l && !_(1, s.table) || !_(a, s.labels)) return ta + 1;
		}
	}
	let _ = t.chartexBox;
	if (_) {
		let e = _.series.length, n = t.chartexDataPointMarkerStyle ?? t.chartexDataPointStyle;
		if (le(t.chartStyleMarkerSymbol ?? t.chartexMarkerSymbol ?? "circle")) for (let i = 0; i < e; i++) {
			let a = _.series[i];
			if (!a.showNonoutliers && !a.showOutliers) continue;
			let o = 0;
			for (let e of a.valuesByCategory) {
				let t = Se(e, a.quartileMethod);
				t && (a.showNonoutliers && (o += t.inner.length), a.showOutliers && (o += t.outliers.length));
			}
			if (!h(qi(t, Li(a, i), e, a.chartexStyle, a.color, n), o, Math.max(2, 3 * r))) return ta + 1;
		}
	}
	return p;
}
function ca(e) {
	let t = 0;
	for (let n of [e?.fillPaint, e?.borderFill]) {
		if (!n) continue;
		let e = Fe(n);
		if (n.fillType === "gradient" && e > na) return null;
		t += e;
	}
	return t;
}
function la(e, t, n, r) {
	let i = t.seriesDataLabels;
	return E(i, r) ? !1 : !!(r?.text || (r?.showVal ?? i?.showVal ?? e.showDataLabels) || (r?.showCatName ?? i?.showCatName) || (r?.showSerName ?? i?.showSerName) || (r?.showPercent ?? i?.showPercent) || (r?.showBubbleSize ?? i?.showBubbleSize) || (r?.showLegendKey ?? i?.showLegendKey)) && n < Math.max(t.values.length, t.categories?.length ?? 0, e.categories.length);
}
function ua(e, t) {
	if (e.chartexSunburst || e.chartexTreemap) return null;
	let n = 0, r = (e) => {
		let t = ca(e);
		return t == null || t > ra - n ? !1 : (n += t, !0);
	}, i = e.threeD != null && t != null && ia.has(e.chartType), a = e.series.some((t) => (t.seriesType ?? e.chartType) === "scatter" && (t.categories ?? e.categories).some((e) => Number.isFinite(Number.parseFloat(e))));
	for (let t of e.series) {
		let n = jt(t.dataLabelOverrides), o = t.seriesType ?? e.chartType, s = Math.max(t.values.length, t.categories?.length ?? 0, e.categories.length);
		for (let c = 0; c < s; c++) {
			let s = t.values[c];
			if (i) {
				if (s == null || !Number.isFinite(s)) continue;
				if (e.showDataLabelsOverMax !== !0) {
					let n = t.useSecondaryAxis ? e.secondaryValAxis?.max : e.valMax;
					if (n != null && Number.isFinite(n) && s > n) continue;
				}
			} else if (!aa(e, t, o, c, a)) continue;
			let l = n.get(c);
			if (!la(e, t, c, l)) continue;
			let u = We(l?.labelBox, t.seriesDataLabels?.labelBox);
			if (u && !r(u)) return ra + 1;
		}
		if (!i) {
			for (let e of t.trendLines ?? []) if ((e.dispEq === !0 || e.dispRSqr === !0 || e.labelText || e.labelRichRuns?.some((e) => e.text.length > 0) === !0) && e.labelBox && !r(e.labelBox)) return ra + 1;
		}
	}
	return n;
}
function da(e, t) {
	if (!e.threeD || !t || !ia.has(e.chartType)) return null;
	let n = 0;
	for (let t of e.series) {
		let r = Math.max(1, t.values.length, t.categories?.length ?? 0), i = t.threeDShape ?? e.threeD.shape ?? "box", a = e.chartType === "pie" ? 36 : e.chartType.toLowerCase().includes("bar") ? i === "box" ? 4 : 36 : e.chartType.toLowerCase().includes("area") ? 4 : t.smooth === !0 ? 25 : 3;
		if (!Number.isSafeInteger(r) || r > Math.floor(1e4 / a) || (n += r * a, n > 1e4)) return h + 1;
	}
	return n;
}
function fa(e, t, n) {
	return n <= 1e4 ? !1 : (e.fillStyle = "#888", e.font = "12px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("(too many data points)", t.x + t.w / 2, t.y + t.h / 2), !0);
}
function pa(e, t, n, r) {
	let i = t.chartTextBoxes;
	if (i?.length) for (let a of i) {
		let i = n.x + a.x * n.w, o = n.y + a.y * n.h, s = a.w * n.w, c = a.h * n.h;
		if (!(s > 0 && c > 0)) continue;
		let l = i + (a.lIns ?? 91440) / He * r, u = o + (a.tIns ?? 45720) / He * r, d = i + s - (a.rIns ?? 91440) / He * r, f = o + c - (a.bIns ?? 45720) / He * r, p = d - l, m = f - u;
		if (!(p > 0 && m > 0)) continue;
		let h = (e, t) => {
			let n = Math.max(1, ...t.map((e) => e.fontPx));
			return {
				paragraph: e,
				runs: t,
				width: t.reduce((e, t) => e + t.width, 0),
				height: n * 1.2,
				baseline: n * .9
			};
		}, g = a.paragraphs.flatMap((n) => {
			let i = n.runs.map((n) => {
				let i = Math.max(1, (n.fontSizeHpt ?? 1e3) / 100 * r), a = `${n.bold ? "bold " : ""}${i}px ${Y(t, n.fontFace, "minor")}`;
				return e.font = a, {
					run: n,
					text: n.text,
					fontPx: i,
					font: a,
					width: e.measureText(n.text).width
				};
			}), o = i.reduce((e, t) => e + t.width, 0);
			if (a.wrap === "none" || o <= p) return [h(n, i)];
			let s = [], c = [], l = 0, u = () => {
				c.length && (s.push(h(n, c)), c = [], l = 0);
			};
			for (let t of i) {
				let n = t.text.match(/\s+|\S+/g) ?? [];
				for (let r of n) {
					let n = /^\s+$/.test(r);
					e.font = t.font;
					let i = e.measureText(r).width;
					c.length && l + i > p && u(), !(n && !c.length) && (c.push({
						...t,
						text: r,
						width: i
					}), l += i);
				}
			}
			return u(), s.length ? s : [h(n, i)];
		}), _ = g.reduce((e, t) => e + t.height, 0), v = a.verticalAnchor === "b" ? f - _ : a.verticalAnchor === "ctr" ? u + (m - _) / 2 : u;
		e.save(), e.beginPath(), e.rect(i, o, s, c), e.clip(), e.textAlign = "left", e.textBaseline = "alphabetic";
		let y = v;
		for (let t of g) {
			let n = t.paragraph.align, r = n === "ctr" ? l + (p - t.width) / 2 : n === "r" ? d - t.width : l;
			for (let n of t.runs) e.font = n.font, e.fillStyle = n.run.color ? `#${n.run.color}` : "#000000", e.fillText(n.text, r, y + t.baseline), r += n.width;
			y += t.height;
		}
		e.restore();
	}
}
var ma = 10;
function ha(e, t, n, r, i, a) {
	let o = Math.max(0, Math.min(a, r / 2, i / 2));
	e.beginPath(), e.moveTo(t + o, n), e.lineTo(t + r - o, n), e.quadraticCurveTo(t + r, n, t + r, n + o), e.lineTo(t + r, n + i - o), e.quadraticCurveTo(t + r, n + i, t + r - o, n + i), e.lineTo(t + o, n + i), e.quadraticCurveTo(t, n + i, t, n + i - o), e.lineTo(t, n + o), e.quadraticCurveTo(t, n, t + o, n), e.closePath();
}
function ga(e, t, n, r = W, i = 0, a, o, s, c) {
	e.save();
	try {
		if (fa(e, n, z(t))) return;
		t = Dt(t), t = Hr(t);
		let { x: l, y: d, w: f, h: p } = n, m = t.roundedCorners === !0, h = m ? ma * r : 0;
		if (m && (ha(e, l, d, f, p, h), e.clip()), t.chartFillHidden !== !0) if (t.chartFill?.fillType === "image") y(e, t.chartFill, l, d, f, p, r, i);
		else if (t.chartFill) {
			let n = Ie(t.chartFill, e, l, d, f, p, i);
			n && (e.fillStyle = n), n && e.fillRect(l, d, f, p);
		} else t.chartBg && (e.fillStyle = `#${t.chartBg}`, e.fillRect(l, d, f, p));
		if (t.chartBorderHidden !== !0 && (t.chartBorderLineFill || t.chartBorderColor)) {
			e.save();
			let n = t.chartBorderLineFill ? Ie(t.chartBorderLineFill, e, l, d, f, p, i) : t.chartBorderColor ? `#${t.chartBorderColor}` : null;
			if (!n) e.restore();
			else {
				e.strokeStyle = n;
				let i = t.chartBorderWidthEmu ? Math.max(.5, t.chartBorderWidthEmu / He) * r : 1;
				e.setLineDash(Ni(t.chartBorderCustomDash, t.chartBorderDash, i)), e.lineCap = t.chartBorderCap === "rnd" ? "round" : t.chartBorderCap === "sq" ? "square" : "butt", e.lineJoin = t.chartBorderJoin === "round" || t.chartBorderJoin === "bevel" ? t.chartBorderJoin : "miter", ye(e, l, d, f, p, i, t.chartBorderCompound, m ? h : 0), e.restore();
			}
		}
		let g = t.chartexBox != null || t.chartexSunburst != null || t.chartexTreemap != null || t.chartexRegionMap != null;
		if (t.series.length === 0 && !g) {
			e.fillStyle = "#888", e.font = "12px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("(no data)", l + f / 2, d + p / 2), pa(e, t, n, r);
			return;
		}
		let _ = C(t), v = (_ != null || t.chartexBox != null) && (_ ?? 0) <= 1e4 ? sa(t, s, r, n) : null, b = da(t, a), x = ua(t, a);
		if ((_ != null || v != null || b != null || x != null) && fa(e, n, Math.max(_ ?? 0, v != null && v > ta ? 10001 : 0, b ?? 0, x != null && x > ra ? 10001 : 0))) {
			pa(e, t, n, r);
			return;
		}
		let S = u(t);
		if (S === "unsupported") {
			e.fillStyle = "#888", e.font = "11px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("Unsupported chart", l + f / 2, d + p / 2), pa(e, t, n, r);
			return;
		}
		if (S !== "legacy") {
			switch (S) {
				case "bar-combo":
					vr(e, t, n, r, {}, i);
					break;
				case "line-groups":
					qr(e, t, n, r, i);
					break;
				case "area-groups":
					ei(e, t, n, r, i);
					break;
				case "scatter-bubble":
					yi(e, t, n, r, i);
					break;
				case "stock-line":
					Jr(e, t, n, r, i);
					break;
			}
			Bn(e, t, n, r), pa(e, t, n, r);
			return;
		}
		if (a?.render(e, t, n, r, i)) {
			Bn(e, t, n, r), pa(e, t, n, r);
			return;
		}
		if (o?.render(e, t, n, r, i)) {
			pa(e, t, n, r);
			return;
		}
		if (c?.render(e, t, n, r, i)) {
			Bn(e, t, n, r), pa(e, t, n, r);
			return;
		}
		switch (t.chartType) {
			case "clusteredBar":
			case "clusteredBarH":
			case "stackedBar":
			case "stackedBarH":
			case "stackedBarPct":
			case "stackedBarHPct":
				vr(e, t, n, r, {}, i);
				break;
			case "line":
			case "stackedLine":
			case "stackedLinePct":
				qr(e, t, n, r, i);
				break;
			case "area":
			case "stackedArea":
			case "stackedAreaPct":
				ei(e, t, n, r, i);
				break;
			case "pie":
				ri(e, t, n, !1, r, i);
				break;
			case "ofPie":
				ni(e, t, n, r, i);
				break;
			case "doughnut":
				ri(e, t, n, !0, r, i);
				break;
			case "radar":
				ui(e, t, n, r, i);
				break;
			case "scatter":
			case "bubble":
				yi(e, t, n, r, i);
				break;
			case "stock":
				Jr(e, t, n, r, i);
				break;
			case "surface":
			case "surface3D":
				$r(e, t, n, r, i);
				break;
			default: e.fillStyle = "#888", e.font = "11px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("Unsupported chart", l + f / 2, d + p / 2);
		}
		Bn(e, t, n, r), pa(e, t, n, r);
	} finally {
		e.restore();
	}
}
function _a(e, t, n, r = W, i = 0, a, o, s, c) {
	x(s, () => {
		ga(e, t, n, r, i, a, o, s, c);
	});
}
//#endregion
export { qr as A, jt as C, fa as D, Vn as E, Cn as F, wn as I, Tn as L, Xi as M, Di as N, vr as O, bn as P, Yn as R, In as S, mn as T, Oi as _, Hi as a, Si as b, $i as c, zi as d, _r as f, Bt as g, yn as h, At as i, Ri as j, _a as k, qi as l, Y as m, Zi as n, Ji as o, Pt as p, Jn as r, Yi as s, Qi as t, Li as u, fr as v, ur as w, Pn as x, _n as y };
