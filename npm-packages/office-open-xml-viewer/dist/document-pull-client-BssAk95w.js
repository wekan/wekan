import { $ as e, A as t, At as n, Bt as r, C as i, Ct as a, D as o, E as s, Et as c, Gt as l, Ht as u, It as d, J as f, Kt as p, Lt as m, M as h, Mt as g, N as _, Nt as v, O as y, Ot as b, Rt as x, S, St as C, Tt as w, Ut as T, Vt as E, Wt as D, _ as O, at as k, bt as A, c as j, d as M, dt as N, et as ee, f as te, ft as P, g as ne, gt as re, h as ie, ht as ae, it as F, j as oe, k as se, l as ce, m as le, mt as ue, n as de, nt as fe, o as pe, s as me, st as he, t as ge, tt as _e, u as ve, v as ye, w as be, wt as I, xt as xe, y as Se, yt as Ce } from "./line-metrics-BGtFM-ec.js";
import { c as we, o as Te, r as Ee, s as De } from "./bounded-raw-part-cache-C6ro6Ezf.js";
import { c as Oe, f as ke, i as Ae, l as je, m as Me, n as Ne, o as L, p as Pe, s as Fe, t as Ie, u as Le } from "./line-distribute-BsV4MVZ2.js";
import { A as Re, D as ze, g as Be, h as Ve, in as He, j as R, on as Ue, sn as We, v as Ge, w as Ke, y as qe } from "./plot-area-frame-D5hEOgkJ.js";
import { i as Je, l as Ye } from "./pixel-budget-Dgjw269h.js";
import "./units-EJdC96r6.js";
import { L as Xe } from "./three-d-YYghQndN.js";
import { k as Ze } from "./renderer-XFSCOT6m.js";
import { r as Qe, s as $e } from "./raster-target-ojDdQizC.js";
import { a as et, i as tt, n as nt, o as z, r as rt, s as it, t as at } from "./source-key-BkBB3X82.js";
//#region packages/core/src/fonts/canvas-route.ts
function ot(e, t) {
	let n = e.trim();
	if (!n) throw TypeError("Canvas font route requires a family list");
	return Object.freeze({
		familyList: n,
		scope: t,
		fingerprint: `canvas-font-route-v1:${encodeURIComponent(t)}:${encodeURIComponent(n)}`
	});
}
function st(e, t, n, r) {
	if (!Number.isFinite(t) || t < 0) throw RangeError("Canvas font size must be finite and non-negative");
	if (!Number.isFinite(n) || n < 1 || n > 1e3) throw RangeError("Canvas font weight must be finite and between 1 and 1000");
	if (!e.familyList.trim()) throw TypeError("Canvas font route requires a family list");
	return `${r} ${n} ${t}px ${e.familyList}`;
}
//#endregion
//#region packages/core/src/shape/drawingml-shape.ts
function ct(e, t, n) {
	let { x: r, y: i, w: a, h: o } = t.rect, { rotationDeg: s, flipH: c, flipV: l } = t.transform;
	e.save();
	try {
		(s !== 0 || c || l) && (e.translate(r + a / 2, i + o / 2), s !== 0 && e.rotate(s * Math.PI / 180), e.scale(c ? -1 : 1, l ? -1 : 1), e.translate(-(r + a / 2), -(i + o / 2))), n();
	} finally {
		e.restore();
	}
}
function lt(e, t) {
	let { x: n, y: r, w: i, h: a } = t.rect;
	if (e.beginPath(), t.geometry.kind === "preset") {
		let o = [...t.geometry.adjustments];
		b(e, t.geometry.name, n, r, i, a, o) || Oe(e, t.geometry.name, n, r, i, a, o[0], o[1], o[2], o[3]);
	} else Le(e, t.geometry.subpaths, n, r, i, a);
	e.clip();
}
var ut = new Set([
	"line",
	"straightconnector1",
	"bentconnector2",
	"bentconnector3",
	"bentconnector4",
	"bentconnector5",
	"curvedconnector2",
	"curvedconnector3",
	"curvedconnector4",
	"curvedconnector5"
]), dt = new Set([
	"callout1",
	"callout2",
	"callout3",
	"bordercallout1",
	"bordercallout2",
	"bordercallout3",
	"accentcallout1",
	"accentcallout2",
	"accentcallout3",
	"accentbordercallout1",
	"accentbordercallout2",
	"accentbordercallout3"
]);
function ft(e) {
	return dt.has(e) || e === "line" || e === "straightconnector1" || e.startsWith("bentconnector");
}
function pt(e, t, n, r, i) {
	if (Ve(e, t, n), t.fill) {
		let n = Ge(t.fill, e, r.x, r.y, r.w, r.h, i);
		n && (e.strokeStyle = n);
	}
}
function mt(e, t, r, i) {
	let a = t.stroke;
	if (!a || !ut.has(r) && !dt.has(r)) return;
	let { x: o, y: s, w: c, h: l } = t.rect, u = a.fill ? Ge(a.fill, e, o, s, c, l, t.transform.rotationDeg) ?? void 0 : void 0, d = n(r, o, s, c, l, [...t.geometry.kind === "preset" ? t.geometry.adjustments : []]);
	if (d) {
		if (ft(r) && d.vertices.length >= 2 && (a.headEnd || a.tailEnd)) {
			let n = d.vertices.map((e) => ({
				x: e.x,
				y: e.y
			}));
			a.tailEnd && (n[n.length - 1] = Fe(n[n.length - 1], n[n.length - 2], L(a.tailEnd, a, i))), a.headEnd && (n[0] = Fe(n[0], n[1], L(a.headEnd, a, i))), pt(e, a, i, t.rect, t.transform.rotationDeg), e.beginPath(), e.moveTo(n[0].x, n[0].y);
			for (let t = 1; t < n.length; t++) e.lineTo(n[t].x, n[t].y);
			e.stroke();
		}
		a.tailEnd && Ae(e, d.end.x, d.end.y, d.end.angle, a.tailEnd, a, i, u), a.headEnd && Ae(e, d.start.x, d.start.y, d.start.angle, a.headEnd, a, i, u);
	}
}
function ht(e, t, n) {
	if (t.geometry.kind !== "custom") return;
	let r = t.stroke;
	if (!r || !r.headEnd && !r.tailEnd) return;
	let i = je(t.geometry.subpaths), { x: a, y: o, w: s, h: c } = t.rect, l = r.fill ? Ge(r.fill, e, a, o, s, c, t.transform.rotationDeg) ?? void 0 : void 0;
	i.start && r.headEnd && Ae(e, a + i.start.x * s, o + i.start.y * c, Math.atan2(i.start.dy * c, i.start.dx * s), r.headEnd, r, n, l), i.end && r.tailEnd && Ae(e, a + i.end.x * s, o + i.end.y * c, Math.atan2(i.end.dy * c, i.end.dx * s), r.tailEnd, r, n, l);
}
function gt(e, t, n) {
	let { x: r, y: i, w: a, h: o } = t.rect;
	ct(e, t, () => {
		let s = Ge(t.fill, e, r, i, a, o, t.transform.rotationDeg), c = t.stroke, l = c ? () => {
			pt(e, c, n, t.rect, t.transform.rotationDeg), e.stroke();
		} : null;
		if (t.geometry.kind === "preset") {
			let u = t.geometry.name.toLowerCase(), d = [...t.geometry.adjustments], f = ft(u) && !!(c?.headEnd || c?.tailEnd);
			g(u) && v(e, u, r, i, a, o, d, s, l, () => {}, f ? { skipTrailingStroke: !0 } : void 0) || (e.beginPath(), Oe(e, u, r, i, a, o, d[0], d[1], d[2], d[3]), s && u !== "arc" && (e.fillStyle = s, u === "donut" || u === "smileyface" || u === "frame" ? e.fill("evenodd") : e.fill()), l && l()), mt(e, t, u, n);
		} else e.beginPath(), Le(e, t.geometry.subpaths, r, i, a, o), s && (e.fillStyle = s, e.fill()), l && l(), ht(e, t, n);
	});
}
//#endregion
//#region packages/core/src/text/number-format.ts
var _t = [
	[1e3, "M"],
	[900, "CM"],
	[500, "D"],
	[400, "CD"],
	[100, "C"],
	[90, "XC"],
	[50, "L"],
	[40, "XL"],
	[10, "X"],
	[9, "IX"],
	[5, "V"],
	[4, "IV"],
	[1, "I"]
];
function vt(e) {
	let t = "", n = e;
	for (let [e, r] of _t) for (; n >= e;) t += r, n -= e;
	return t;
}
function yt(e, t) {
	let n = t.length, r = Math.floor((e - 1) / n) + 1;
	return t[(e - 1) % n].repeat(r);
}
var bt = Array.from({ length: 26 }, (e, t) => String.fromCharCode(65 + t)), xt = /* @__PURE__ */ "أ.ب.ت.ث.ج.ح.خ.د.ذ.ر.ز.س.ش.ص.ض.ط.ظ.ع.غ.ف.ق.ك.ل.م.ن.ه.و.ي".split("."), St = /* @__PURE__ */ "أ.ب.ج.د.ه.و.ز.ح.ط.ي.ك.ل.م.ن.س.ع.ف.ص.ق.ر.ش.ت.ث.خ.ذ.ض.غ.ظ".split("."), Ct = [
	"א",
	"ב",
	"ג",
	"ד",
	"ה",
	"ו",
	"ז",
	"ח",
	"ט",
	"י",
	"כ",
	"ל",
	"מ",
	"נ",
	"ס",
	"ע",
	"פ",
	"צ",
	"ק",
	"ר",
	"ש",
	"ת"
], wt = [
	...jt(1072, 1080),
	...jt(1082, 1087),
	...jt(1088, 1097),
	"ы",
	"э",
	"ю",
	"я"
], Tt = [
	...jt(1040, 1048),
	...jt(1050, 1055),
	...jt(1056, 1065),
	"Ы",
	"Э",
	"Ю",
	"Я"
], Et = [
	"ก",
	"ข",
	"ค",
	...jt(3591, 3619),
	"ล",
	...jt(3623, 3630)
], Dt = [
	"ㄱ",
	"ㄴ",
	"ㄷ",
	"ㄹ",
	"ㅁ",
	"ㅂ",
	"ㅅ",
	"ㅇ",
	"ㅈ",
	"ㅊ",
	"ㅋ",
	"ㅌ",
	"ㅍ",
	"ㅎ"
], Ot = [
	"가",
	"나",
	"다",
	"라",
	"마",
	"바",
	"사",
	"아",
	"자",
	"차",
	"카",
	"타",
	"파",
	"하"
], kt = jt(2325, 2361), At = [
	...jt(2309, 2324),
	"अं",
	"अः"
];
function jt(e, t) {
	let n = [];
	for (let r = e; r <= t; r++) n.push(String.fromCodePoint(r));
	return n;
}
var Mt = /* @__PURE__ */ "ア.イ.ウ.エ.オ.カ.キ.ク.ケ.コ.サ.シ.ス.セ.ソ.タ.チ.ツ.テ.ト.ナ.ニ.ヌ.ネ.ノ.ハ.ヒ.フ.ヘ.ホ.マ.ミ.ム.メ.モ.ヤ.ユ.ヨ.ラ.リ.ル.レ.ロ.ワ.ヰ.ヱ.ヲ.ン".split("."), Nt = [
	...jt(65393, 65436),
	"ｦ",
	"ﾝ"
];
function Pt(e) {
	return e <= 20 ? String.fromCodePoint(9312 + (e - 1)) : String(e);
}
function Ft(e, t) {
	return String(e).split("").map((e) => t[e.charCodeAt(0) - 48]).join("");
}
var It = jt(65296, 65305), Lt = jt(3664, 3673), Rt = jt(2406, 2415), zt = [
	"〇",
	"一",
	"二",
	"三",
	"四",
	"五",
	"六",
	"七",
	"八",
	"九"
], Bt = [
	"영",
	"일",
	"이",
	"삼",
	"사",
	"오",
	"육",
	"칠",
	"팔",
	"구"
], Vt = [
	"零",
	"一",
	"二",
	"三",
	"四",
	"五",
	"六",
	"七",
	"八",
	"九"
], Ht = [
	"○",
	"一",
	"二",
	"三",
	"四",
	"五",
	"六",
	"七",
	"八",
	"九"
];
function Ut(e, t) {
	if (e < 10) return t[e];
	if (e < 100) {
		let n = Math.floor(e / 10), r = e % 10, i = n === 1 ? "十" : t[n] + "十";
		return r === 0 ? i : i + t[r];
	}
	return Ft(e, t);
}
function Wt(e, t) {
	switch (t) {
		case "upperRoman": return e >= 1 ? vt(e) : String(e);
		case "lowerRoman": return e >= 1 ? vt(e).toLowerCase() : String(e);
		case "upperLetter": return e >= 1 ? yt(e, bt) : String(e);
		case "lowerLetter": return e >= 1 ? yt(e, bt).toLowerCase() : String(e);
		case "arabicAlpha": return e >= 1 ? yt(e, xt) : String(e);
		case "arabicAbjad": return e >= 1 ? yt(e, St) : String(e);
		case "russianLower": return e >= 1 ? yt(e, wt) : String(e);
		case "russianUpper": return e >= 1 ? yt(e, Tt) : String(e);
		case "thaiLetters": return e >= 1 ? yt(e, Et) : String(e);
		case "chosung": return e >= 1 ? yt(e, Dt) : String(e);
		case "ganada": return e >= 1 ? yt(e, Ot) : String(e);
		case "hindiVowels": return e >= 1 ? yt(e, kt) : String(e);
		case "hindiConsonants": return e >= 1 ? yt(e, At) : String(e);
		case "aiueoFullWidth": return e >= 1 ? yt(e, Mt) : String(e);
		case "aiueo": return e >= 1 ? yt(e, Nt) : String(e);
		case "decimalEnclosedCircle": return e >= 1 ? Pt(e) : String(e);
		case "hebrew1": return e >= 1 ? Jt(e) : String(e);
		case "hebrew2": return e >= 1 ? Yt(e) : String(e);
		case "hex": return e >= 1 ? e.toString(16).toUpperCase() : String(e);
		case "numberInDash": return e >= 1 ? `- ${e} -` : String(e);
		case "decimalZero": return e >= 1 && e <= 9 ? `0${e}` : String(e);
		case "decimalFullWidth": return e >= 1 ? Ft(e, It) : String(e);
		case "decimalHalfWidth": return String(e);
		case "thaiNumbers": return e >= 1 ? Ft(e, Lt) : String(e);
		case "hindiNumbers": return e >= 1 ? Ft(e, Rt) : String(e);
		case "ideographDigital":
		case "japaneseDigitalTenThousand": return e >= 1 ? Ft(e, zt) : String(e);
		case "koreanDigital": return e >= 1 ? Ft(e, Bt) : String(e);
		case "koreanDigital2": return e >= 1 ? Ft(e, Vt) : String(e);
		case "taiwaneseDigital": return e >= 1 ? Ft(e, Ht) : String(e);
		case "chineseCounting": return e >= 1 ? Ut(e, zt) : String(e);
		case "taiwaneseCounting": return e >= 1 ? Ut(e, Ht) : String(e);
		case "chineseCountingThousand": return e >= 1 ? an(e, Zt) : String(e);
		case "taiwaneseCountingThousand": return e >= 1 ? an(e, Qt) : String(e);
		case "chineseLegalSimplified": return e >= 1 ? an(e, en) : String(e);
		case "ideographLegalTraditional": return e >= 1 ? an(e, nn) : String(e);
		case "japaneseCounting": return e >= 1 ? an(e, Xt) : String(e);
		case "japaneseLegal": return e >= 1 ? an(e, tn) : String(e);
		case "koreanCounting": return e >= 1 ? an(e, $t) : String(e);
		case "koreanLegal": return e >= 1 ? cn(e) : String(e);
		default: return String(e);
	}
}
var Gt = [
	"",
	"א",
	"ב",
	"ג",
	"ד",
	"ה",
	"ו",
	"ז",
	"ח",
	"ט"
], Kt = [
	"",
	"י",
	"כ",
	"ל",
	"מ",
	"נ",
	"ס",
	"ע",
	"פ",
	"צ"
], qt = [
	"",
	"ק",
	"ר",
	"ש",
	"ת",
	"ך",
	"ם",
	"ן",
	"ף",
	"ץ"
];
function Jt(e) {
	let t = "", n = e, r = Math.floor(n / 1e3);
	n %= 1e3;
	let i = Math.floor(n / 100);
	if (n %= 100, r > 0 && (t += Gt[r % 10]), t += qt[i], n === 15) return t + "טו";
	if (n === 16) return t + "טז";
	let a = Math.floor(n / 10), o = n % 10;
	return t += Kt[a], t += Gt[o], t;
}
function Yt(e) {
	let t = Ct.length, n = Math.floor((e - 1) / t);
	return Ct[e - t * n - 1] + "ת".repeat(n);
}
var Xt = {
	digits: Vt,
	ten: "十",
	hundred: "百",
	thousand: "千",
	myriad: "万",
	elideOne: !0,
	insertZero: !1
}, Zt = {
	...Xt,
	elideOne: !1,
	insertZero: !0
}, Qt = { ...Zt }, $t = {
	digits: [
		"영",
		"일",
		"이",
		"삼",
		"사",
		"오",
		"육",
		"칠",
		"팔",
		"구"
	],
	ten: "십",
	hundred: "백",
	thousand: "천",
	myriad: "만",
	elideOne: !0,
	insertZero: !1
}, en = {
	digits: [
		"零",
		"壹",
		"贰",
		"叁",
		"肆",
		"伍",
		"陆",
		"柒",
		"捌",
		"玖"
	],
	ten: "拾",
	hundred: "佰",
	thousand: "仟",
	myriad: "万",
	elideOne: !1,
	insertZero: !0
}, tn = {
	digits: [
		"零",
		"壱",
		"弐",
		"参",
		"四",
		"伍",
		"六",
		"七",
		"八",
		"九"
	],
	ten: "拾",
	hundred: "百",
	thousand: "阡",
	myriad: "萬",
	elideOne: !1,
	insertZero: !1
}, nn = {
	digits: [
		"零",
		"壹",
		"貳",
		"參",
		"肆",
		"伍",
		"陸",
		"柒",
		"捌",
		"玖"
	],
	ten: "拾",
	hundred: "佰",
	thousand: "仟",
	myriad: "萬",
	elideOne: !1,
	insertZero: !1
};
function rn(e, t, n) {
	let r = Math.floor(e / 1e3) % 10, i = Math.floor(e / 100) % 10, a = Math.floor(e / 10) % 10, o = e % 10, s = [
		{
			digit: r,
			unit: t.thousand
		},
		{
			digit: i,
			unit: t.hundred
		},
		{
			digit: a,
			unit: t.ten
		},
		{
			digit: o,
			unit: ""
		}
	], c = "", l = !1, u = !1;
	for (let { digit: e, unit: r } of s) {
		if (e === 0) {
			l && (u = !0);
			continue;
		}
		u &&= (t.insertZero && (c += t.digits[0]), !1), n && e === 1 && r ? c += r : c += t.digits[e] + r, l = !0;
	}
	return c;
}
function an(e, t) {
	if (e >= 1e8) {
		let n = Math.floor(e / 1e8), r = e % 1e8, i = an(n, t) + "億";
		return r === 0 ? i : i + (t.insertZero && r < 1e7 ? t.digits[0] : "") + an(r, t);
	}
	let n = Math.floor(e / 1e4), r = e % 1e4, i = "";
	return n > 0 && (i += rn(n, t, t.elideOne) + t.myriad), r > 0 && (t.insertZero && n > 0 && r < 1e3 && (i += t.digits[0]), i += rn(r, t, t.elideOne)), i;
}
var on = [
	"",
	"하나",
	"둘",
	"셋",
	"넷",
	"다섯",
	"여섯",
	"일곱",
	"여덟",
	"아홉"
], sn = [
	"",
	"열",
	"스물",
	"서른",
	"마흔",
	"쉰",
	"예순",
	"일흔",
	"여든",
	"아흔"
];
function cn(e) {
	if (e >= 100) return String(e);
	let t = Math.floor(e / 10), n = e % 10;
	return sn[t] + on[n];
}
//#endregion
//#region packages/core/src/text/field-format-switch.ts
var ln = {
	Arabic: "decimal",
	ArabicDash: "numberInDash",
	Hex: "hex",
	Roman: "upperRoman",
	roman: "lowerRoman",
	ALPHABETIC: "upperLetter",
	alphabetic: "lowerLetter",
	ARABICABJAD: "arabicAbjad",
	ARABICALPHA: "arabicAlpha",
	HEBREW1: "hebrew1",
	HEBREW2: "hebrew2",
	HINDIARABIC: "hindiNumbers",
	HINDILETTER1: "hindiVowels",
	HINDILETTER2: "hindiConsonants",
	THAIARABIC: "thaiNumbers",
	THAILETTER: "thaiLetters",
	CHOSUNG: "chosung",
	GANADA: "ganada",
	DBCHAR: "decimalFullWidth",
	SBCHAR: "decimalHalfWidth"
};
function un(e) {
	let t = /\\\*\s+(\S+)/g, n;
	for (; (n = t.exec(e)) !== null;) {
		let e = ln[n[1]];
		if (e) return e;
	}
	return null;
}
//#endregion
//#region packages/core/src/text/date-time-picture.ts
var dn = [
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
], fn = [
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
], pn = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
], mn = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
], hn = (e) => e < 10 ? `0${e}` : `${e}`;
function gn(e) {
	let t = /\\@\s*"([^"]*)"/.exec(e);
	if (t) return t[1];
	let n = /\\@\s*(\S+)/.exec(e);
	return n ? n[1] : null;
}
function _n(e, t) {
	let n = t.getFullYear(), r = t.getMonth(), i = t.getDate(), a = t.getDay(), o = t.getHours(), s = o % 12 == 0 ? 12 : o % 12, c = t.getMinutes(), l = t.getSeconds(), u = o >= 12, d = "", f = 0, p = e.length;
	for (; f < p;) {
		let t = e[f];
		if (t === "'") {
			f++;
			let t = "";
			for (; f < p;) {
				if (e[f] === "'") {
					if (e[f + 1] === "'") {
						t += "'", f += 2;
						continue;
					}
					f++;
					break;
				}
				t += e[f++];
			}
			d += t;
			continue;
		}
		if (/[A-Za-z]/.test(t)) {
			let u = f;
			for (; u < p && e[u] === t;) u++;
			let m = e.slice(f, u).length, h = t.toLowerCase(), g = null;
			if (t === "y" || t === "Y" ? g = m >= 4 ? String(n).padStart(4, "0") : hn(n % 100) : t === "M" ? g = m >= 4 ? dn[r] : m === 3 ? fn[r] : m === 2 ? hn(r + 1) : String(r + 1) : h === "d" ? g = m >= 4 ? pn[a] : m === 3 ? mn[a] : m === 2 ? hn(i) : String(i) : t === "H" ? g = m >= 2 ? hn(o) : String(o) : t === "h" ? g = m >= 2 ? hn(s) : String(s) : t === "m" ? g = m >= 2 ? hn(c) : String(c) : t === "s" ? g = m >= 2 ? hn(l) : String(l) : (h === "a" || h === "p") && (g = null), g !== null) {
				d += g, f = u;
				continue;
			}
			if (!(h === "a" || h === "p")) return null;
		}
		let m = /^([AaPp])([Mm])?\/([AaPp])([Mm])?/.exec(e.slice(f));
		if (m) {
			let e = m[2] !== void 0;
			d += e ? u ? "PM" : "AM" : u ? "P" : "A", f += m[0].length;
			continue;
		}
		d += t, f++;
	}
	return d;
}
//#endregion
//#region packages/core/src/fonts/local-metrics.ts
function vn(e) {
	return e.trim().toLowerCase();
}
function yn(e) {
	return `local("${e.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}")`;
}
function bn(e) {
	return `__ooxml_local_${[...e].map((e) => (e.codePointAt(0) ?? 0).toString(16).padStart(6, "0")).join("")}`;
}
function xn() {
	return typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1).getContext("2d") : typeof document < "u" && document?.createElement ? document.createElement("canvas").getContext("2d") : null;
}
async function Sn(e) {
	let t = Ee();
	if (!t || typeof FontFace > "u") return {
		faces: [],
		metrics: {}
	};
	let n = [], r = {}, i = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = t.family.trim(), n = t.localNames.map((e) => e.trim()).filter(Boolean);
		if (!e || n.length === 0 || t.lineHeightMultiplier != null && !(t.lineHeightMultiplier > 0)) continue;
		let r = t.weight ?? 400, a = t.style ?? "normal";
		if (!(r >= 100 && r <= 900) || a !== "normal" && a !== "italic") continue;
		let o = n.map(yn).join(", "), s = vn(e), c = `local-face:${o}:${r}:${a}`, l = i.get(c) ?? {
			source: o,
			requests: []
		};
		l.requests.push({
			...t,
			family: e,
			normalizedFamily: s,
			source: o,
			weight: r,
			style: a
		}), i.set(c, l);
	}
	for (let [e, a] of i) {
		let i = bn(e), { face: o } = we(e, t, () => {
			let e = a.requests[0], n = new FontFace(i, a.source, {
				weight: String(e.weight),
				style: e.style
			});
			return t.add(n), n;
		});
		try {
			if (!await Te(o.load()) || o.status !== "loaded") throw Error("local font load timed out");
			let e = !1;
			for (let t of a.requests) {
				let n;
				if (t.lineHeightMultiplier != null) {
					let e = xn();
					if (!e) continue;
					e.font = `${t.style} ${t.weight} 100px "${i}"`;
					let r = e.measureText("Hg国"), a = r.fontBoundingBoxAscent, o = r.fontBoundingBoxDescent;
					if (!(Number.isFinite(a) && Number.isFinite(o) && a + o > 0)) continue;
					n = (a + o) / 100 * t.lineHeightMultiplier;
				}
				let a = t.weight === 400 && t.style === "normal" ? t.normalizedFamily : `${t.normalizedFamily}:${t.weight}:${t.style}`;
				r[a] = {
					family: i,
					...n == null ? {} : { lineHeightRatio: n },
					requestedFamily: t.family,
					weight: t.weight,
					style: t.style,
					sourceIdentity: t.source,
					synthesized: !1
				}, e = !0;
			}
			if (!e) throw Error("exact local font route unavailable");
			n.push(o);
		} catch {
			De([o]);
		}
	}
	return {
		faces: n,
		metrics: r
	};
}
function Cn(e) {
	De(e);
}
//#endregion
//#region packages/core/src/text/font-advance-metrics.ts
var wn = [{
	test: (e) => e === "georgia",
	biasEm: .0105
}];
function Tn(e) {
	return (e ?? "").trim().replace(/^["']|["']$/g, "").replace(/\s+/g, " ").toLowerCase();
}
function En(e) {
	let t = Tn(e);
	for (let e of wn) if (e.test(t)) return e.biasEm;
	return 0;
}
//#endregion
//#region packages/docx/src/layout/validation-policy.ts
function Dn() {
	let e = globalThis.process?.env;
	return e ? e.VITEST !== void 0 || e.NODE_ENV === "test" : !1;
}
var On = Dn();
function kn() {
	return On;
}
//#endregion
//#region packages/docx/src/layout/plain-data.ts
var An = class extends TypeError {}, jn = /* @__PURE__ */ new WeakSet(), Mn = /* @__PURE__ */ new WeakSet();
function Nn(e, t, n = /* @__PURE__ */ new WeakSet(), r = /* @__PURE__ */ new WeakSet()) {
	if (e == null || typeof e == "string" || typeof e == "boolean") return;
	if (typeof e == "number") {
		if (!Number.isFinite(e)) throw TypeError(`${t} must contain finite numbers`);
		return;
	}
	if (typeof e != "object" || n.has(e)) throw TypeError(`${t} must be structured-clone-safe plain data`);
	if (r.has(e) || jn.has(e)) return;
	let i = Object.getPrototypeOf(e);
	if (!Array.isArray(e) && i !== Object.prototype && i !== null) throw TypeError(`${t} must be structured-clone-safe plain data`);
	if (Object.getOwnPropertySymbols(e).length !== 0) throw TypeError(`${t} must contain only enumerable string data properties`);
	n.add(e);
	try {
		for (let i of Object.getOwnPropertyNames(e)) {
			if (Array.isArray(e) && i === "length") continue;
			if (Array.isArray(e) && String(Number(i)) !== i) throw TypeError(`${t}.${i} must be an array index`);
			let a = Object.getOwnPropertyDescriptor(e, i);
			if (!a || !a.enumerable || !("value" in a)) throw TypeError(`${t}.${i} must be an enumerable data property`);
			Nn(a.value, `${t}.${i}`, n, r);
		}
	} finally {
		n.delete(e);
	}
	r.add(e);
}
function Pn(e, t = /* @__PURE__ */ new WeakSet()) {
	if (typeof e != "object" || !e || t.has(e)) {
		if (typeof e == "number" && !Number.isFinite(e)) throw new An("must contain finite numbers");
		return e;
	}
	if (jn.has(e) || Mn.has(e)) return e;
	if (t.add(e), Array.isArray(e)) {
		for (let n = 0; n < e.length; n += 1) Pn(e[n], t);
		for (let n in e) String(Number(n)) !== n && Object.prototype.hasOwnProperty.call(e, n) && Pn(e[n], t);
	} else for (let n in e) Object.prototype.hasOwnProperty.call(e, n) && Pn(e[n], t);
	return Object.freeze(e), Mn.add(e), e;
}
function Fn(e, t) {
	if (typeof e != "object" || !e) {
		if (typeof e == "function" || typeof e == "symbol") throw TypeError("value must be structured-clone-safe plain data");
		if (typeof e == "number" && !Number.isFinite(e)) throw new An("must contain finite numbers");
		return e;
	}
	if (Object.isFrozen(e) && jn.has(e)) return e;
	let n = t.get(e);
	if (n !== void 0) return n;
	if (Array.isArray(e)) {
		let n = Array(e.length);
		t.set(e, n);
		for (let r = 0; r < e.length; r += 1) Object.prototype.hasOwnProperty.call(e, r) && (n[r] = Fn(e[r], t));
		return Object.freeze(n), n;
	}
	let r = Object.getPrototypeOf(e);
	if (r !== Object.prototype && r !== null) throw TypeError("value must be structured-clone-safe plain data");
	let i = {};
	t.set(e, i);
	for (let n in e) if (Object.prototype.hasOwnProperty.call(e, n)) {
		let r = Fn(e[n], t);
		n === "__proto__" ? Object.defineProperty(i, n, {
			value: r,
			enumerable: !0,
			writable: !0,
			configurable: !0
		}) : i[n] = r;
	}
	return Object.freeze(i), i;
}
function B(e, t) {
	if (typeof e == "object" && e && jn.has(e)) return e;
	kn() && Ln(e, t);
	try {
		let t = Fn(e, /* @__PURE__ */ new Map());
		return typeof t == "object" && t && jn.add(t), t;
	} catch (e) {
		let n = e instanceof An ? e.message : "must be structured-clone-safe plain data";
		throw TypeError(`${t} ${n}`);
	}
}
function In(e, t) {
	return kn() && Ln(e, t), Rn(e, /* @__PURE__ */ new WeakSet());
}
function Ln(e, t) {
	try {
		structuredClone(e);
	} catch {
		throw TypeError(`${t} must be structured-clone-safe plain data`);
	}
	Nn(e, t);
}
function Rn(e, t) {
	if (typeof e != "object" || !e || t.has(e)) {
		if (typeof e == "number" && !Number.isFinite(e)) throw new An("must contain finite numbers");
		return e;
	}
	if (jn.has(e)) return e;
	if (t.add(e), Array.isArray(e)) {
		for (let n = 0; n < e.length; n += 1) Rn(e[n], t);
		for (let n in e) String(Number(n)) !== n && Object.prototype.hasOwnProperty.call(e, n) && Rn(e[n], t);
	} else for (let n in e) Object.prototype.hasOwnProperty.call(e, n) && Rn(e[n], t);
	return Object.freeze(e), jn.add(e), e;
}
//#endregion
//#region packages/docx/src/layout/paint-resources.ts
function zn(e, t) {
	if (typeof e != "string" || e.trim().length === 0) throw TypeError(`${t} must be a non-empty string`);
}
function Bn(e, t) {
	if (!Number.isFinite(e) || e < 0) throw TypeError(`${t} must be finite and non-negative`);
}
function Vn(e, t) {
	if (!Number.isFinite(e)) throw TypeError(`${t} must be finite`);
}
function Hn(e, t) {
	if (!Number.isFinite(e) || e < 0 || e > 1) throw TypeError(`${t} must be between 0 and 1`);
}
function Un(e, t) {
	Bn(e.widthPt, `${t}.widthPt`), Bn(e.heightPt, `${t}.heightPt`);
}
function Wn(e) {
	switch (zn(e.resourceKey, "resourceKey"), e.kind) {
		case "image":
		case "picture-bullet":
			if (e.documentOrder !== void 0 && (!Number.isSafeInteger(e.documentOrder) || e.documentOrder < 0)) throw TypeError("documentOrder must be a non-negative safe integer");
			if (zn(e.partPath, "partPath"), zn(e.mimeType, "mimeType"), e.svgImagePath !== void 0 && zn(e.svgImagePath, "svgImagePath"), Un(e.intrinsicSize, "intrinsicSize"), e.alpha !== void 0 && Hn(e.alpha, "alpha"), e.rotation !== void 0 && !Number.isFinite(e.rotation)) throw TypeError("rotation must be finite");
			e.srcRect !== void 0 && (Vn(e.srcRect.l, "srcRect.l"), Vn(e.srcRect.t, "srcRect.t"), Vn(e.srcRect.r, "srcRect.r"), Vn(e.srcRect.b, "srcRect.b"));
			break;
		case "chart":
			Un(e.intrinsicSize, "intrinsicSize");
			break;
		case "math": break;
		default: throw TypeError(`Unknown paint resource kind: ${String(e)}`);
	}
}
function Gn(e) {
	return Wn(e), B(e, `paint resource ${e.resourceKey}`);
}
function Kn(e, t, n) {
	return /* @__PURE__ */ Error(`Paint resource kind mismatch for ${e}: expected ${t}, got ${n}`);
}
function qn(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		if (t.has(n.resourceKey)) throw Error(`Duplicate paint resource key: ${n.resourceKey}`);
		t.add(n.resourceKey);
	}
	let n = e.map(Gn).sort((e, t) => e.resourceKey.localeCompare(t.resourceKey));
	return Jn(Object.freeze(n));
}
function Jn(e) {
	if (!Object.isFrozen(e)) throw TypeError("Owned paint descriptors must be sealed");
	let t = null;
	for (let n of e) {
		if (Wn(n), !Object.isFrozen(n)) throw TypeError(`Owned paint descriptor must be sealed: ${n.resourceKey}`);
		if (t !== null && n.resourceKey.localeCompare(t) <= 0) throw Error(`Owned paint descriptors must have unique sorted keys: ${n.resourceKey}`);
		t = n.resourceKey;
	}
	let n = e, r = new Map(n.map((e) => [e.resourceKey, e])), i = Object.freeze(n.map((e) => e.resourceKey));
	return Object.freeze({
		keys: i,
		descriptors: n,
		resolve(e, t) {
			let n = r.get(e);
			if (!n) throw Error(`Unknown paint resource: ${e}`);
			if (n.kind !== t) throw Kn(e, t, n.kind);
			return n;
		}
	});
}
//#endregion
//#region packages/docx/src/layout/production-paint-resources.ts
function Yn(e) {
	return rt(e);
}
function Xn(e, t, n, r = {}) {
	return {
		kind: e,
		resourceKey: t,
		partPath: n,
		...r.svgImagePath === void 0 ? {} : { svgImagePath: r.svgImagePath },
		...r.srcRect == null ? {} : { srcRect: { ...r.srcRect } },
		...r.rotation === void 0 ? {} : { rotation: r.rotation },
		...r.flipH === void 0 ? {} : { flipH: r.flipH },
		...r.flipV === void 0 ? {} : { flipV: r.flipV },
		...r.alpha === void 0 ? {} : { alpha: r.alpha },
		...r.colorReplaceFrom === void 0 ? {} : { colorReplaceFrom: r.colorReplaceFrom },
		...r.duotone === void 0 ? {} : { duotone: { ...r.duotone } }
	};
}
function Zn(e, t, n, r) {
	let i = [], a = [], o = [], s = (e, t, n, r, o, s, c = {}) => {
		let l = tt(t, n);
		i.push(Xn(e, l, n, c)), a.push({
			resourceKey: l,
			mimeType: r,
			widthPt: o,
			heightPt: s
		});
	}, c = (e, t) => {
		if (e.type === "image") {
			s("image", t, e.imagePath, e.mimeType, e.widthPt, e.heightPt, e);
			return;
		}
		if (e.type === "chart") {
			o.push({
				kind: "chart",
				resourceKey: Yn(t),
				intrinsicSize: {
					widthPt: e.widthPt,
					heightPt: e.heightPt
				},
				model: e.chart
			});
			return;
		}
		if (e.type !== "shape") return;
		let n = e;
		n.fill?.fillType === "image" && s("image", t, n.fill.imagePath, n.fill.mimeType, n.widthPt, n.heightPt, {
			...n.fill.svgImagePath === void 0 ? {} : { svgImagePath: n.fill.svgImagePath },
			...n.fill.srcRect === void 0 ? {} : { srcRect: { ...n.fill.srcRect } },
			...n.fill.alpha === void 0 ? {} : { alpha: n.fill.alpha },
			...n.fill.duotone === void 0 ? {} : { duotone: n.fill.duotone }
		});
		let r = `${t.story}:${t.storyInstance}:${t.path.join(".")}`;
		if (n.textBoxContent !== void 0) {
			f(n.textBoxContent, "textbox", r);
			return;
		}
		n.textBlocks?.forEach((e, t) => {
			if (e.imagePath) {
				if (!e.mimeType || e.imageWidthPt == null || e.imageHeightPt == null) throw Error("Text-box compatibility image requires complete metadata");
				s("image", {
					story: "textbox",
					storyInstance: r,
					path: [t, 0]
				}, e.imagePath, e.mimeType, e.imageWidthPt, e.imageHeightPt, { svgImagePath: e.svgImagePath });
			}
		});
	}, l = (e, t, n, r) => {
		e.rows.forEach((e, i) => e.cells.forEach((e, a) => {
			f(e.content, t, n, [
				...r,
				i,
				a
			]);
		}));
	}, u = (e, t, n) => {
		if (e) for (let r of [
			"default",
			"first",
			"even"
		]) {
			let i = e[r];
			i && f(i.body, t, n ? `${n}:${r}` : r);
		}
	}, d = (e, n) => {
		let i = e.numbering;
		if (i?.picBulletImagePath) {
			let t = r?.(e), a = i.picBulletWidthPt ?? t?.widthPt, o = i.picBulletHeightPt ?? t?.heightPt;
			if (!i.picBulletMimeType || a == null || o == null) throw Error("Picture bullet requires complete metadata");
			s("picture-bullet", n, i.picBulletImagePath, i.picBulletMimeType, a, o);
		}
		let a = t?.paragraphAcquisitionInput(e, n).runs ?? e.runs, o = 0;
		a.forEach((t, r) => {
			if (t.type === "unavailableDrawing") return;
			let i = e.runs[o++];
			i && (i.type === "image" || i.type === "chart" || i.type === "shape") && c(i, {
				...n,
				path: [...n.path, r]
			});
		});
	}, f = (e, t, n, r = []) => {
		e.forEach((e, i) => {
			let a = [...r, i];
			e.type === "paragraph" ? d(e, {
				story: t,
				storyInstance: n,
				path: a
			}) : e.type === "table" ? l(e, t, n, a) : e.type === "sectionBreak" && (u(e.headers, "header", `section:${i}`), u(e.footers, "footer", `section:${i}`));
		});
	};
	f(e.body, "body", "body"), u(e.headers, "header"), u(e.footers, "footer");
	for (let t of e.footnotes ?? []) f(t.content, "footnote", t.id);
	for (let t of e.endnotes ?? []) f(t.content, "endnote", t.id);
	let p = new Map(a.map((e) => [e.resourceKey, e]));
	if (p.size !== a.length) throw Error("Duplicate image resource key");
	for (let [e, t] of i.entries()) {
		let n = p.get(t.resourceKey);
		if (!n) throw Error(`Missing layout image metadata: ${t.resourceKey}`);
		o.push({
			...t,
			documentOrder: e,
			mimeType: n.mimeType,
			intrinsicSize: {
				widthPt: n.widthPt,
				heightPt: n.heightPt
			}
		});
	}
	for (let e of n) o.push({
		kind: "math",
		resourceKey: e.resourceKey
	});
	return {
		imageMetadata: a,
		descriptors: o
	};
}
function Qn(e, t, n, r) {
	let i = Zn(e, t, n, r);
	return Object.freeze({
		imageMetadata: Object.freeze(i.imageMetadata.map((e) => Object.freeze({ ...e }))),
		paintResources: qn(i.descriptors)
	});
}
//#endregion
//#region packages/docx/src/layout/resources.ts
function $n(e, t = "body", n = "body") {
	let r = [], i = (e, a = []) => {
		e.forEach((e, o) => {
			let s = [...a, o];
			e.type === "paragraph" ? e.runs.forEach((e, i) => {
				e.type === "math" && r.push({
					nodes: e.nodes,
					display: e.display,
					source: {
						story: t,
						storyInstance: n,
						path: [...s, i]
					},
					resourceKey: et({
						story: t,
						storyInstance: n,
						path: [...s, i]
					}, e.display ? "display" : "inline")
				});
			}) : e.type === "table" && e.rows.forEach((e, t) => e.cells.forEach((e, n) => {
				i(e.content, [
					...s,
					t,
					n
				]);
			}));
		});
	};
	return i(e), r;
}
function er(e, t) {
	if (!Number.isFinite(e) || e < 0) throw RangeError(`${t} must be finite and non-negative`);
	return e;
}
function tr(e) {
	let t = [...e].map((e) => Object.freeze({
		resourceKey: e.resourceKey,
		widthPt: er(e.widthPt, "widthPt"),
		heightPt: er(e.heightPt, "heightPt"),
		mimeType: e.mimeType
	})).sort((e, t) => e.resourceKey.localeCompare(t.resourceKey)), n = new Map(t.map(({ resourceKey: e, ...t }) => [e, Object.freeze(t)]));
	if (n.size !== t.length) throw Error("Duplicate image resource key");
	return Object.freeze({
		fingerprint: it("images", t),
		resolve(e) {
			let t = n.get(e);
			if (!t) throw Error(`Unknown image resource: ${e}`);
			return t;
		}
	});
}
function nr(e) {
	let t = [...e].map((e) => Object.freeze({
		resourceKey: e.resourceKey,
		widthEm: er(e.widthEm, "widthEm"),
		ascentEm: er(e.ascentEm, "ascentEm"),
		descentEm: er(e.descentEm, "descentEm"),
		diagnostics: Object.freeze(e.diagnostics.map((e) => Object.freeze({ ...e }))),
		...e.available === !1 ? { available: !1 } : {}
	})).sort((e, t) => e.resourceKey.localeCompare(t.resourceKey)), n = new Map(t.map((e) => [e.resourceKey, e]));
	if (n.size !== t.length) throw Error("Duplicate math resource key");
	return Object.freeze({
		fingerprint: it("math", t),
		resolve(e) {
			let t = n.get(e);
			if (!t) throw Error(`Unknown math resource: ${e}`);
			return t;
		}
	});
}
//#endregion
//#region packages/docx/src/layout/runtime-state.ts
var rr = Symbol("document-layout-runtime");
function ir(e, t) {
	Object.defineProperty(e, rr, {
		configurable: !1,
		enumerable: !1,
		writable: !1,
		value: {
			services: null,
			defaultCurrentDateMs: t,
			activeLayoutOptions: null
		}
	});
}
function ar(e) {
	let t = e[rr];
	if (t) return t;
	throw Error("Document layout runtime is not initialized; attach it explicitly");
}
function or(e) {
	let t = new Map(e), n = Object.freeze([...t.keys()].sort());
	return Object.freeze({
		keys: n,
		resolve(e) {
			let n = t.get(e);
			if (n === void 0) throw Error(`Unknown runtime resource: ${e}`);
			return n;
		}
	});
}
var sr = /* @__PURE__ */ new WeakMap(), cr = /* @__PURE__ */ new WeakMap(), lr = /* @__PURE__ */ new WeakMap(), ur = /* @__PURE__ */ new WeakMap(), dr = /* @__PURE__ */ new WeakMap(), fr = /* @__PURE__ */ new WeakMap(), pr = /* @__PURE__ */ new WeakMap();
function mr() {
	let e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap(), n = 1;
	return Object.freeze({
		objectIdentity(t) {
			let r = e.get(t);
			return r === void 0 && (r = n, n += 1, e.set(t, r)), r;
		},
		get(e, n) {
			return t.get(e)?.get(n);
		},
		set(e, n, r) {
			let i = t.get(e);
			i || (i = /* @__PURE__ */ new Map(), t.set(e, i)), i.set(n, r);
		}
	});
}
function hr(e, t) {
	let n = [
		e.text,
		e.images,
		e.math
	], r = new Set(n.flatMap((e) => {
		let t = cr.get(e);
		return t ? [t] : [];
	}));
	if (r.size > 1) throw Error("Layout services combine foreign runtime owners");
	let i = r.values().next().value, a = n.filter((e) => !cr.has(e));
	if (i && a.length > 1) throw Error("Layout services are missing service lineage for multiple components");
	if (!i && !t) return;
	let o = i ?? {};
	for (let e of n) {
		let t = cr.get(e);
		if (t && t !== o) throw Error("Layout services combine foreign runtime owners");
		cr.set(e, o);
	}
	return o;
}
function gr(e, t) {
	let n = hr(e, !0);
	if (lr.has(n)) throw Error("Body layout kernel is already attached");
	lr.set(n, t);
}
function _r(e) {
	let t = hr(e, !1);
	return t ? lr.get(t) : void 0;
}
function vr(e, t) {
	let n = hr(e, !0);
	if (ur.has(n)) throw Error("Layout source store is already attached");
	ur.set(n, t);
}
function yr(e) {
	let t = hr(e, !1);
	return t ? ur.get(t) : void 0;
}
function br(e, t) {
	let n = hr(e, !0);
	if (dr.has(n)) throw Error("Vertical glyph measurement service is already attached");
	dr.set(n, t);
}
function xr(e) {
	let t = hr(e, !1), n = t ? dr.get(t) : void 0;
	if (!n) throw Error("Vertical glyph measurement service is not attached");
	return n;
}
function Sr(e, t) {
	if (fr.has(e)) throw Error("Layout variant store is already attached");
	fr.set(e, t);
}
function Cr(e) {
	return fr.get(e);
}
function wr(e, t, n = t.keys()) {
	if (sr.has(e)) throw Error("Private resource lookup is already attached");
	let r = new Set(t.keys()), i = new Set(n), a = [...i].filter((e) => !r.has(e)).sort(), o = [...r].filter((e) => !i.has(e)).sort();
	if (a.length > 0 || o.length > 0) throw Error(`Runtime resource membership mismatch: missing [${a.join(", ")}]; extra [${o.join(", ")}]`);
	sr.set(e, or(t));
}
function Tr(e) {
	return sr.get(e);
}
var Er = /* @__PURE__ */ new WeakMap(), Dr = /* @__PURE__ */ new WeakMap();
function Or(e, t = {}) {
	let n = Object.freeze({
		...e,
		...t
	}), r = _r(e);
	if (!r) throw Error("Body layout kernel is not attached to the supplied services");
	if (_r(n) !== r) throw Error("Layout service view did not retain its body layout kernel owner");
	let i = sr.get(e);
	i && sr.set(n, i);
	let a = Er.get(e);
	a && Er.set(n, a);
	let o = pr.get(e);
	return o && pr.set(n, o), n;
}
function kr(e) {
	let t = Or(e);
	return pr.set(t, mr()), t;
}
function Ar(e) {
	return pr.get(e);
}
function jr(e, t) {
	if (!Number.isInteger(t.totalPages) || t.totalPages < 1) throw RangeError("Field acquisition totalPages must be a positive integer");
	let n = Or(e);
	return Dr.set(n, Object.freeze({ ...t })), n;
}
function Mr(e) {
	return Dr.get(e) ?? Object.freeze({ totalPages: 1 });
}
function Nr(e, t) {
	if (Er.has(e)) throw Error("Paint resource registry is already attached");
	Er.set(e, t);
}
function Pr(e) {
	let t = Er.get(e);
	if (!t) throw Error("Paint resource registry is not attached");
	return t;
}
//#endregion
//#region packages/docx/src/layout/page-layers.ts
var Fr = [
	"background",
	"behindText",
	"header",
	"body",
	"notes",
	"front",
	"footer"
], Ir = Object.freeze({
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: 0,
	f: 0
});
function Lr(e) {
	return Object.freeze({
		kind: "clip",
		clip: e
	});
}
function Rr(e, t) {
	return Object.freeze({
		kind: "transform",
		transform: Object.freeze({
			...Ir,
			e,
			f: t
		})
	});
}
function zr(e, t) {
	if (!t.textBoxIds?.length) return Object.freeze([]);
	let n = new Map(e.textBoxes.map((e) => [e.id, e]));
	return Object.freeze(t.textBoxIds.flatMap((e) => {
		let t = n.get(e);
		return t ? [t] : [];
	}));
}
function Br(e, t, n, r, i) {
	if (e.kind === "drawing") {
		if (!e.anchorLayer) return;
		i.push(Object.freeze({
			drawing: e,
			textBoxes: Object.freeze([]),
			frames: Object.freeze([...n]),
			layoutTranslationPt: Object.freeze({ ...r }),
			encounterOrder: i.length,
			root: t
		}));
		return;
	}
	if (e.kind !== "textbox") {
		if (e.kind === "note") {
			let a = e.story.clipBounds ? Object.freeze([...n, Lr(e.story.clipBounds)]) : n;
			for (let n of e.story.blocks) Br(n, t, a, r, i);
			return;
		}
		if (e.kind === "paragraph") {
			let a = e.clipBounds ? Object.freeze([...n, Lr(e.clipBounds)]) : n;
			for (let n of e.drawings) n.anchorLayer && i.push(Object.freeze({
				drawing: n,
				owner: e,
				textBoxes: zr(e, n),
				frames: Object.freeze([...a]),
				layoutTranslationPt: Object.freeze({ ...r }),
				encounterOrder: i.length,
				root: t
			}));
			return;
		}
		Ur(e, t, n, r, i);
	}
}
function Vr(e, t, n, r, i, a) {
	let o = t.xPt - e.flowBounds.xPt, s = t.yPt - e.flowBounds.yPt;
	Br(e, n, Object.freeze([...r, Rr(o, s)]), Object.freeze({
		xPt: i.xPt + o,
		yPt: i.yPt + s
	}), a);
}
function Hr(e, t, n, r, i) {
	Vr(e.child, {
		xPt: e.xPt - r.xPt,
		yPt: e.yPt - r.yPt
	}, t, n, r, i);
}
function Ur(e, t, n, r, i) {
	let a = e.clipBounds ? Object.freeze([...n, Lr(e.clipBounds)]) : n;
	for (let n of e.rows) for (let e of n.cells) {
		let n = "visualMergeOwnership" in e && e.visualMergeOwnership === "continuation";
		if (e.verticalMerge === "continue" && !n) continue;
		let o = e.clipBounds ? Object.freeze([...a, Lr(e.clipBounds)]) : a;
		for (let n of e.blocks) Vr(n.layout, {
			xPt: e.contentBounds.xPt + (n.layout.kind === "table" ? n.layout.flowBounds.xPt : 0),
			yPt: e.flowBounds.yPt + n.offsetPt + (n.layout.kind === "table" ? n.layout.flowBounds.yPt : 0)
		}, t, o, r, i);
	}
	for (let n of e.resolvedFloatingTables ?? []) Hr(n, t, a, r, i);
}
function Wr(e) {
	let t = e.drawing.anchorLayer;
	return Object.freeze({
		kind: "drawing",
		layer: t.behindDoc ? "behindText" : "front",
		sourceLayer: e.root.layer,
		rootNodeId: e.root.node.id,
		coordinateSpace: e.root.coordinateSpace,
		flowDomainId: e.root.node.flowDomainId,
		node: e.drawing,
		...e.owner ? { ownerNodeId: e.owner.id } : {},
		textBoxes: e.textBoxes,
		frames: e.frames,
		layoutTranslationPt: e.layoutTranslationPt
	});
}
function Gr(e, t) {
	return Object.freeze({
		kind: "node",
		layer: e.layer,
		sourceLayer: e.layer,
		rootNodeId: e.node.id,
		coordinateSpace: e.coordinateSpace,
		flowDomainId: e.node.flowDomainId,
		node: e.node,
		omitAnchoredDrawings: t
	});
}
function Kr(e, t) {
	return e.drawing.anchorLayer.relativeHeight - t.drawing.anchorLayer.relativeHeight || e.drawing.anchorLayer.sourceOrder - t.drawing.anchorLayer.sourceOrder || e.encounterOrder - t.encounterOrder;
}
function qr(e) {
	let t = [];
	for (let n of e) Br(n.node, n, Object.freeze([]), Object.freeze({
		xPt: 0,
		yPt: 0
	}), t);
	let n = t.filter(({ drawing: e }) => e.anchorLayer.behindDoc).sort(Kr).map(Wr), r = t.filter(({ drawing: e }) => !e.anchorLayer.behindDoc).sort(Kr).map(Wr), i = new Set(t.map(({ root: e }) => e.node)), a = e.flatMap((e) => e.node.kind === "drawing" && e.node.anchorLayer ? [] : [Gr(e, i.has(e.node))]);
	return Object.freeze([
		...n,
		...a,
		...r
	]);
}
function Jr(e, t) {
	return t.has(e) || (t.add(e), e.kind === "drawing") ? !1 : e.kind === "paragraph" ? e.lines.some((e) => e.placements.some((e) => e.kind === "text" && e.paintOps?.some((e) => e.verticalFeature === !0) === !0)) || e.textBoxes.some((e) => Jr(e, t)) : e.kind === "textbox" || e.kind === "note" ? e.story.blocks.some((e) => Jr(e, t)) : e.rows.some((e) => e.cells.some((e) => e.blocks.some((e) => Jr(e.layout, t)))) || (e.resolvedFloatingTables ?? []).some((e) => Jr(e.child, t));
}
function Yr(e, t, n) {
	if (!n.has(e)) {
		if (n.add(e), e.kind === "drawing") {
			for (let n of e.commands) (n.kind === "resource" || n.kind === "drawingml-image-fill") && t.add(n.resourceKey);
			return;
		}
		if (e.kind === "paragraph") {
			for (let n of e.resources) t.add(n.resourceKey);
			for (let r of e.drawings) Yr(r, t, n);
			for (let r of e.textBoxes) Yr(r, t, n);
			return;
		}
		if (e.kind === "textbox" || e.kind === "note") {
			for (let r of e.story.blocks) Yr(r, t, n);
			return;
		}
		for (let r of e.rows) for (let e of r.cells) for (let r of e.blocks) Yr(r.layout, t, n);
		for (let r of e.resolvedFloatingTables ?? []) Yr(r.child, t, n);
	}
}
function Xr(e) {
	let t = Object.freeze(e.map(({ layer: e, node: t, coordinateSpace: n }) => Object.freeze({
		layer: e,
		node: t,
		coordinateSpace: n ?? "section-logical"
	}))), n = new Map(Fr.map((e) => [e, []]));
	for (let e of t) n.get(e.layer).push(e.node);
	let r = [];
	for (let e = 0; e < t.length;) {
		let n = t[e].layer, i = e + 1;
		for (; t[i]?.layer === n;) i += 1;
		let a = t.slice(e, i);
		n === "header" || n === "body" || n === "notes" || n === "footer" ? r.push(...qr(a)) : r.push(...a.map((e) => Gr(e, !1))), e = i;
	}
	let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
	for (let { node: e } of t) Yr(e, a, o);
	return Object.freeze({
		roots: t,
		paintOrder: Object.freeze(r),
		capabilities: Object.freeze({
			requiresElementBackedVerticalGlyphPaint: t.some(({ node: e }) => Jr(e, i)),
			resourceKeys: Object.freeze([...a])
		}),
		background: Object.freeze(n.get("background")),
		behindText: Object.freeze(n.get("behindText")),
		header: Object.freeze(n.get("header")),
		body: Object.freeze(n.get("body")),
		notes: Object.freeze(n.get("notes")),
		front: Object.freeze(n.get("front")),
		footer: Object.freeze(n.get("footer"))
	});
}
//#endregion
//#region packages/docx/src/layout/page-graph.ts
var Zr = class extends Error {
	constructor(e) {
		super(e), this.name = "PageGraphError";
	}
}, Qr = Xr;
function $r(e, t, n) {
	let r = new Map(n.map((e) => [e.id, e]));
	if (r.size !== n.length || n.length !== e[t].length) throw new Zr(`Replacement ${t} layer must preserve unique paint node identities`);
	return Qr(e.roots.map((e) => {
		if (e.layer !== t) return e;
		let n = r.get(e.node.id);
		if (!n) throw new Zr(`Missing replacement paint node ${e.node.id}`);
		return {
			...e,
			node: n
		};
	}));
}
function ei(e) {
	return e.layers.roots;
}
function ti(e) {
	let t = !1, n = !1;
	for (let r of e.layers.roots) if (r.layer === "body") {
		if (n) throw new Zr(`Paint sequence must contain one contiguous body paint run; re-entered at ${r.node.id}`);
		t = !0;
	} else t && (n = !0);
	let r = /* @__PURE__ */ new Map();
	for (let t of e.layers.roots) {
		if (r.has(t.node.id)) throw new Zr(`Duplicate paint node ${t.node.id}`);
		r.set(t.node.id, t);
	}
	let i = /* @__PURE__ */ new Map();
	for (let t of Fr) for (let n of e.layers[t]) {
		if (i.has(n.id)) throw new Zr(`Duplicate semantic page node ${n.id}`);
		i.set(n.id, {
			layer: t,
			node: n
		});
	}
	if (i.size !== r.size) throw new Zr("Semantic page layers do not match retained roots");
	for (let [e, t] of r) {
		let n = i.get(e);
		if (!n || n.layer !== t.layer || n.node !== t.node) throw new Zr(`Paint root ${e} is not the retained ${t.layer} node`);
	}
	let a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
	for (let t of e.layers.paintOrder) {
		let e = r.get(t.rootNodeId);
		if (!e) throw new Zr(`Missing paint root ${t.rootNodeId}`);
		if (e.layer !== t.sourceLayer) throw new Zr(`Paint root ${t.rootNodeId} belongs to ${e.layer}, not ${t.sourceLayer}`);
		if (a.add(t.rootNodeId), t.kind === "node") {
			if (t.node !== e.node || t.node.id !== t.rootNodeId) throw new Zr(`Paint root ${t.rootNodeId} is not the retained ${t.sourceLayer} node`);
			continue;
		}
		if (!t.node.anchorLayer) throw new Zr(`Drawing paint entry ${t.node.id} is not anchored`);
		if (o.has(t.node.id)) throw new Zr(`Duplicate drawing paint reference ${t.node.id}`);
		o.add(t.node.id);
	}
	if (a.size !== r.size) throw new Zr(`Missing paint-order reference for ${[...r.keys()].find((e) => !a.has(e)) ?? "<unknown>"}`);
	return e.layers.roots.map(({ node: e }) => e);
}
//#endregion
//#region packages/docx/src/layout/error-page.ts
var ni = Object.freeze({
	story: "body",
	storyInstance: "parse-error",
	path: Object.freeze([])
});
function ri(e, t, n, r, i) {
	let a = e.trim().split(/\s+/).filter(Boolean), o = [], s = "", c = (e) => r.shape({
		text: e,
		fontSizePt: n,
		fonts: {},
		genericFamily: "sans-serif"
	}).advancePt, l = (e) => {
		let n = [
			0,
			...O(e),
			e.length
		].filter((e, t, n) => t === 0 || e !== n[t - 1]), r = n.length - 1;
		for (; r > 0 && c(`${e.slice(0, n[r])}…`) > t;) --r;
		return `${e.slice(0, n[r] ?? 0)}…`;
	}, u = () => {
		o.length === 0 ? o.push(l("")) : o[o.length - 1] = l(o[o.length - 1]);
	}, d = (e) => {
		let n = [
			0,
			...O(e),
			e.length
		].filter((e, t, n) => t === 0 || e !== n[t - 1]), r = 0;
		for (; r < n.length - 1;) {
			if (o.length >= i) return u(), !0;
			let a = r + 1;
			for (; a < n.length && c(e.slice(n[r], n[a])) <= t;) a += 1;
			let s = Math.max(r + 1, a - 1), d = e.slice(n[r], n[s]);
			if (o.length >= i - 1 && s < n.length - 1) return o.push(l(d)), !0;
			o.push(d), r = s;
		}
		return !1;
	};
	for (let e = 0; e < a.length; e += 1) {
		let n = a[e], r = s ? `${s} ${n}` : n, l = c(r);
		if (s && l > t) {
			if (o.push(s), s = "", o.length >= i) {
				u();
				break;
			}
			if (c(n) > t) {
				if (d(n)) break;
			} else s = n;
		} else if (!s && l > t) {
			if (d(n)) break;
		} else s = r;
		if (e < a.length - 1 && o.length >= i && !s) {
			u();
			break;
		}
	}
	return s && o.length < i && o.push(s), o;
}
function ii(e, t, n) {
	if (!(t.widthPt > 0 && t.heightPt > 0)) throw RangeError("Error page size must be positive");
	let r = Math.max(18, Math.min(t.widthPt, t.heightPt) * .06), i = {
		xPt: r,
		yPt: r,
		widthPt: t.widthPt - r * 2,
		heightPt: t.heightPt - r * 2
	}, a = Math.max(8, Math.min(t.widthPt, t.heightPt) * .02), o = n.resolve({
		fonts: {},
		slot: "ascii",
		genericFamily: "sans-serif"
	}).route, s = ri(e, t.widthPt - r * 4, a, n, 4), c = a * 1.4, l = [
		{
			kind: "fill-rect",
			rect: {
				xPt: 0,
				yPt: 0,
				widthPt: t.widthPt,
				heightPt: t.heightPt
			},
			fill: "#ffffff"
		},
		{
			kind: "stroke-rect",
			rect: i,
			stroke: "#c8ccd2",
			lineWidthPt: 1,
			dashPt: [6, 5]
		},
		{
			kind: "text",
			rect: {
				xPt: 0,
				yPt: t.heightPt * .27,
				widthPt: t.widthPt,
				heightPt: 36
			},
			text: "⚠",
			fill: "#b23b3b",
			fontRoute: o,
			fontSizePt: 28,
			fontWeight: 400,
			fontStyle: "normal",
			align: "center",
			baseline: "middle"
		},
		{
			kind: "text",
			rect: {
				xPt: r * 2,
				yPt: t.heightPt * .4,
				widthPt: t.widthPt - r * 4,
				heightPt: 24
			},
			text: "This document could not be displayed",
			fill: "#333333",
			fontRoute: o,
			fontSizePt: 13,
			fontWeight: 600,
			fontStyle: "normal",
			align: "center",
			baseline: "middle"
		},
		...s.map((e, n) => ({
			kind: "text",
			rect: {
				xPt: r * 2,
				yPt: t.heightPt * .5 + c * n,
				widthPt: t.widthPt - r * 4,
				heightPt: c
			},
			text: e,
			fill: "#666666",
			fontRoute: o,
			fontSizePt: a,
			fontWeight: 400,
			fontStyle: "normal",
			align: "center",
			baseline: "middle"
		}))
	], u = {
		kind: "drawing",
		id: "parse-error-page",
		source: ni,
		flowDomainId: "parse-error",
		flowBounds: i,
		inkBounds: i,
		advancePt: i.heightPt,
		ordinaryFlow: !1,
		commands: l
	}, d = {
		geometry: {
			pageWidth: t.widthPt,
			pageHeight: t.heightPt,
			marginTop: r,
			marginRight: r,
			marginBottom: r,
			marginLeft: r,
			headerDistance: 0,
			footerDistance: 0
		},
		columns: [{
			xPt: r,
			wPt: i.widthPt
		}],
		columnSeparator: !1,
		grid: {
			kind: "none",
			linePitchPt: null,
			charSpacePt: null
		},
		textDirection: "lrTb",
		verticalAlignment: "top"
	};
	return {
		pages: [{
			pageIndex: 0,
			geometry: {
				xPt: 0,
				yPt: 0,
				widthPt: t.widthPt,
				heightPt: t.heightPt,
				contentTopPt: r,
				contentBottomPt: t.heightPt - r
			},
			flowDomains: [{
				id: "parse-error",
				kind: "body",
				logicalBounds: i,
				physicalBounds: i
			}],
			section: d,
			sectionOccurrenceId: "parse-error-section",
			pageBorder: null,
			parityBlank: !1,
			bookmarkStarts: [],
			pageNumber: {
				displayNumber: 1,
				format: "decimal",
				sectionOccurrenceId: "parse-error-section"
			},
			columnSeparators: [],
			sectionRegions: [{
				id: "parse-error-region",
				sectionOccurrenceId: "parse-error-section",
				coordinateSpace: {
					writingMode: "horizontal-tb",
					logicalToPhysical: {
						a: 1,
						b: 0,
						c: 0,
						d: 1,
						e: 0,
						f: 0
					},
					physicalToLogical: {
						a: 1,
						b: 0,
						c: 0,
						d: 1,
						e: 0,
						f: 0
					}
				},
				blockStartPt: r,
				blockEndPt: t.heightPt - r,
				columnFlowDirection: "ltr",
				columnIndexes: [0],
				flowDomainIds: ["parse-error"],
				section: d
			}],
			layers: Qr([{
				layer: "body",
				node: u
			}]),
			readingOrder: [u.id]
		}],
		diagnostics: [{
			code: "UNSUPPORTED_FEATURE",
			severity: "error",
			source: ni,
			message: e
		}]
	};
}
//#endregion
//#region packages/docx/src/layout/options.ts
function ai(e, t, n = !1) {
	let r = e == null ? t : typeof e == "number" ? e : e.getTime();
	if (!Number.isFinite(r)) throw RangeError("currentDate must resolve to finite epoch milliseconds");
	return Object.freeze({
		currentDateMs: r,
		...n === !0 ? { showTrackedChanges: !0 } : {}
	});
}
function oi(e) {
	return ai(e.currentDate, e.defaultCurrentDateMs, e.showTrackedChanges);
}
function si(e, t) {
	return it("layout", {
		currentDateMs: e.currentDateMs,
		showTrackedChanges: e.showTrackedChanges === !0,
		text: t.text.fingerprint,
		images: t.images.fingerprint,
		math: t.math.fingerprint,
		verticalGlyphs: t.verticalGlyphFingerprint ?? null
	});
}
//#endregion
//#region packages/docx/src/layout/diagnostics.ts
var ci = Object.freeze({
	UNSUPPORTED_TEXT_EFFECT: Object.freeze({
		severity: "warning",
		layoutCode: "UNSUPPORTED_FEATURE",
		message: "WordprocessingML text effects are not rendered"
	}),
	INVALID_TEXT_EFFECT_VALUE: Object.freeze({
		severity: "warning",
		layoutCode: "INVALID_VALUE",
		message: "An invalid WordprocessingML text-effect value was ignored"
	}),
	MISSING_DRAWING_EXTENT: Object.freeze({
		severity: "error",
		layoutCode: "INVALID_GEOMETRY",
		message: "A drawing with a missing required extent was omitted"
	}),
	INVALID_DRAWING_EXTENT: Object.freeze({
		severity: "error",
		layoutCode: "INVALID_GEOMETRY",
		message: "A drawing with an invalid extent was omitted"
	}),
	DEGENERATE_DRAWING_EXTENT: Object.freeze({
		severity: "warning",
		layoutCode: "INVALID_GEOMETRY",
		message: "A drawing has a schema-valid zero-area extent"
	})
}), li = Object.freeze({
	code: "INVALID_VALUE",
	severity: "warning",
	message: "The parser diagnostic contract did not match this renderer build"
});
function ui(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function di(e, t) {
	if (!Array.isArray(e) || !e.every((e) => Number.isSafeInteger(e) && e >= 0)) return !1;
	let [n] = e;
	return n === void 0 || n < t;
}
function fi(e) {
	return Object.freeze({
		story: "body",
		storyInstance: "body",
		path: Object.freeze([...e])
	});
}
function pi(e, t) {
	if (e === void 0) return Object.freeze([]);
	if (!Array.isArray(e)) return Object.freeze([li]);
	let n = [], r = !1;
	for (let i of e) {
		if (!ui(i) || typeof i.code != "string" || !Object.hasOwn(ci, i.code) || i.part !== "word/document.xml" || !di(i.path, t)) {
			r = !0;
			continue;
		}
		let e = ci[i.code];
		if (i.severity !== e.severity) {
			r = !0;
			continue;
		}
		n.push(Object.freeze({
			code: e.layoutCode,
			severity: e.severity,
			source: fi(i.path),
			message: e.message
		}));
	}
	return r && n.push(li), Object.freeze(n);
}
var V = class extends Error {
	code;
	constructor(e, t) {
		super(`${e}: ${t}`), this.name = "LayoutInvariantError", this.code = e;
	}
};
//#endregion
//#region packages/docx/src/layout/coordinate-space.ts
function mi(e) {
	switch (e) {
		case "tb":
		case "tbV":
		case "lrTb":
		case "lrTbV": return "horizontal-tb";
		case "rl":
		case "rlV":
		case "tbRl":
		case "tbRlV": return "vertical-rl";
		case "btLr": return "vertical-rl";
		case "lr":
		case "lrV":
		case "tbLrV": return "vertical-lr";
		default: throw RangeError(`Unsupported Transitional text direction ${JSON.stringify(e)}`);
	}
}
function hi(e) {
	if (!Number.isFinite(e.widthPt) || !Number.isFinite(e.heightPt) || e.widthPt <= 0 || e.heightPt <= 0) throw RangeError("Physical page extents must be positive and finite");
}
function gi(e) {
	if (!Number.isFinite(e.xPt) || !Number.isFinite(e.yPt)) throw RangeError("Point coordinates must be finite");
}
function _i(e) {
	if (![
		e.a,
		e.b,
		e.c,
		e.d,
		e.e,
		e.f
	].every(Number.isFinite)) throw RangeError("Matrix coefficients must be finite");
}
function vi(e) {
	if (gi(e), !Number.isFinite(e.widthPt) || !Number.isFinite(e.heightPt) || e.widthPt < 0 || e.heightPt < 0) throw RangeError("Rectangle extents must be finite and non-negative");
}
function yi(e, t) {
	switch (hi(e), t) {
		case "horizontal-tb": return {
			widthPt: e.widthPt,
			heightPt: e.heightPt
		};
		case "vertical-rl":
		case "vertical-lr": return {
			widthPt: e.heightPt,
			heightPt: e.widthPt
		};
		default: throw RangeError(`Unsupported writing mode ${String(t)}`);
	}
}
function bi(e, t) {
	switch (hi(e), t) {
		case "horizontal-tb": return {
			widthPt: e.widthPt,
			heightPt: e.heightPt
		};
		case "vertical-rl":
		case "vertical-lr": return {
			widthPt: e.heightPt,
			heightPt: e.widthPt
		};
		default: throw RangeError(`Unsupported writing mode ${String(t)}`);
	}
}
function xi(e, t) {
	switch (hi(t), e) {
		case "horizontal-tb": return {
			a: 1,
			b: 0,
			c: 0,
			d: 1,
			e: 0,
			f: 0
		};
		case "vertical-rl": return {
			a: 0,
			b: 1,
			c: -1,
			d: 0,
			e: t.widthPt,
			f: 0
		};
		case "vertical-lr": return {
			a: 0,
			b: 1,
			c: 1,
			d: 0,
			e: 0,
			f: 0
		};
		default: throw RangeError(`Unsupported writing mode ${String(e)}`);
	}
}
function Si(e, t) {
	switch (hi(t), e) {
		case "horizontal-tb": return {
			a: 1,
			b: 0,
			c: 0,
			d: 1,
			e: 0,
			f: 0
		};
		case "vertical-rl": return {
			a: 0,
			b: -1,
			c: 1,
			d: 0,
			e: 0,
			f: t.widthPt
		};
		case "vertical-lr": return {
			a: 0,
			b: 1,
			c: 1,
			d: 0,
			e: 0,
			f: 0
		};
		default: throw RangeError(`Unsupported writing mode ${String(e)}`);
	}
}
function Ci(e, t) {
	return _i(e), gi(t), {
		xPt: e.a * t.xPt + e.c * t.yPt + e.e,
		yPt: e.b * t.xPt + e.d * t.yPt + e.f
	};
}
function wi(e, t) {
	vi(t);
	let n = [
		Ci(e, t),
		Ci(e, {
			xPt: t.xPt + t.widthPt,
			yPt: t.yPt
		}),
		Ci(e, {
			xPt: t.xPt,
			yPt: t.yPt + t.heightPt
		}),
		Ci(e, {
			xPt: t.xPt + t.widthPt,
			yPt: t.yPt + t.heightPt
		})
	], r = n.map(({ xPt: e }) => e), i = n.map(({ yPt: e }) => e), a = Math.min(...r), o = Math.min(...i);
	return {
		xPt: a,
		yPt: o,
		widthPt: Math.max(...r) - a,
		heightPt: Math.max(...i) - o
	};
}
function Ti(e, t) {
	_i(e);
	let n = Ci(e, {
		xPt: 0,
		yPt: 0
	}), r = {
		top: {
			xPt: 0,
			yPt: -1
		},
		right: {
			xPt: 1,
			yPt: 0
		},
		bottom: {
			xPt: 0,
			yPt: 1
		},
		left: {
			xPt: -1,
			yPt: 0
		}
	}, i = {}, a = /* @__PURE__ */ new Set();
	for (let o of [
		"top",
		"right",
		"bottom",
		"left"
	]) {
		let s = Ci(e, r[o]), c = s.xPt - n.xPt, l = s.yPt - n.yPt, u = l === 0 && c !== 0 ? c > 0 ? "right" : "left" : c === 0 && l !== 0 ? l > 0 ? "bottom" : "top" : null;
		if (u === null || a.has(u)) throw RangeError("Edge transforms require a non-degenerate axis-aligned matrix");
		i[u] = t[o], a.add(u);
	}
	if (a.size !== 4) throw RangeError("Edge transform must map every physical edge exactly once");
	return i;
}
function Ei(e, t) {
	return {
		writingMode: e,
		logicalToPhysical: xi(e, t),
		physicalToLogical: Si(e, t)
	};
}
//#endregion
//#region packages/docx/src/layout/column-separators.ts
function Di(e) {
	return Object.freeze(e);
}
function Oi(e) {
	let t = [];
	for (let n of e) {
		let { columns: e, columnSeparator: r } = n.section;
		if (!r || e.length < 2 || n.blockEndPt <= n.blockStartPt) continue;
		let i = new Set(n.columnIndexes), a = n.columnFlowDirection === "rtl" ? e.map((e, t) => t).reverse() : e.map((e, t) => t);
		for (let r = 0; r < a.length - 1; r += 1) {
			let o = a[r];
			if (!i.has(o)) continue;
			let s = a[r + 1], c = Math.min(o, s), l = Math.max(o, s), u = e[c], d = e[l], f = (u.xPt + u.wPt + d.xPt) / 2;
			t.push(Object.freeze({
				start: Di(Ci(n.coordinateSpace.logicalToPhysical, {
					xPt: f,
					yPt: n.blockStartPt
				})),
				end: Di(Ci(n.coordinateSpace.logicalToPhysical, {
					xPt: f,
					yPt: n.blockEndPt
				}))
			}));
		}
	}
	return Object.freeze(t);
}
//#endregion
//#region packages/docx/src/layout/border-treatment.ts
function ki(e, t) {
	let n = qe(e, t), r = e === "triple" || /^(?:thinThick|thickThin|thinThickThin)(?:Small|Medium|Large)Gap$/.test(e);
	return Object.freeze({
		authoredStyle: e,
		style: e === "double" ? "double" : r ? "compound" : n.length > 0 ? "dashed" : e.includes("wave") ? "wavy" : "solid",
		dashPatternPt: Object.freeze(n)
	});
}
//#endregion
//#region packages/docx/src/layout/text.ts
function Ai(e, t) {
	let n = (e.smallCaps ? Math.max(e.fontSize - 2, 1) : e.fontSize) * t;
	return e.vertAlign && (n *= .65), n;
}
var ji = /[ᄀ-ᇿ⺀-⿟　-〿぀-ヿ㄰-㆏㐀-䶿一-鿿ꥠ-꥿가-퟿豈-﫿＀-￯]/u;
function Mi(e, t, n) {
	let r = null, i = 0;
	for (let n of t) n.alignment !== "bar" && (n.pos > i && (i = n.pos), n.pos > e && (r === null || n.pos < r.pos) && (r = n));
	let a = null;
	if (n > 0) {
		let t = Math.ceil((Math.max(e, i) + 1e-6) / n) * n;
		t <= e && (t += n), a = {
			pos: t,
			alignment: "left"
		};
	}
	return r && a ? r.pos <= a.pos ? r : a : r ?? a;
}
function Ni(e, t, n) {
	return Mi(e, t, n);
}
function Pi(e, t) {
	let n = t === "vert" || t === "vert270" || t === "eaVert" || t === "mongolianVert";
	return {
		type: "text",
		text: e.text,
		bold: e.bold ?? !1,
		italic: e.italic ?? !1,
		underline: !1,
		strikethrough: !1,
		fontSize: e.fontSizePt,
		color: e.color ?? null,
		fontFamily: e.fontFamily ?? null,
		fontFamilyEastAsia: e.fontFamilyEastAsia ?? null,
		isLink: !1,
		background: null,
		vertAlign: null,
		hyperlink: null,
		ruby: e.ruby ?? void 0,
		textBoxLineFloor: !0,
		textBoxVertical: n
	};
}
function Fi(e, t = {}, n = {}) {
	if (!e) return "sans-serif";
	let r = t[e];
	if (r === "roman") return "serif";
	if (r === "swiss") return "sans-serif";
	if (r === "modern" && n[e] === "fixed") return "monospace";
	let i = u(e);
	return i === "mono" ? "monospace" : i === "serif" ? "serif" : "sans-serif";
}
function Ii(e) {
	return e === "eastAsia" ? "sans-serif" : "serif";
}
var Li = Symbol("docx.localMetricSnapshot");
function Ri(e = {}) {
	if (e[Li]) return e;
	let t = Object.entries(e).map(([e, t]) => {
		if (!t.family?.trim()) throw TypeError(`Local metric ${e} requires a family`);
		if (t.lineHeightRatio !== void 0 && (!Number.isFinite(t.lineHeightRatio) || t.lineHeightRatio < 0)) throw RangeError(`Local metric ${e} lineHeightRatio must be finite and non-negative`);
		if (t.weight !== void 0 && (!Number.isFinite(t.weight) || t.weight < 1 || t.weight > 1e3)) throw RangeError(`Local metric ${e} weight must be finite and between 1 and 1000`);
		let n = {
			family: t.family,
			...t.lineHeightRatio === void 0 ? {} : { lineHeightRatio: t.lineHeightRatio },
			...t.requestedFamily === void 0 ? {} : { requestedFamily: t.requestedFamily },
			...t.weight === void 0 ? {} : { weight: t.weight },
			...t.style === void 0 ? {} : { style: t.style },
			...t.sourceIdentity === void 0 ? {} : { sourceIdentity: t.sourceIdentity },
			...t.synthesized === void 0 ? {} : { synthesized: t.synthesized }
		};
		return [vn(e), Object.freeze(n)];
	}).sort(([e], [t]) => e.localeCompare(t)), n = Object.fromEntries(t);
	return Object.defineProperty(n, Li, { value: !0 }), Object.freeze(n);
}
var zi = new Set([
	161,
	164,
	167,
	168,
	170,
	173,
	175,
	176,
	177,
	178,
	179,
	180,
	182,
	183,
	184,
	185,
	186,
	188,
	189,
	190,
	191,
	215,
	247
]), Bi = new Set([
	224,
	225,
	232,
	233,
	234,
	236,
	237,
	242,
	243,
	249,
	250,
	252
]);
function Vi(e, t, n, r, i) {
	let a = n === "eastAsia", o = r?.split(/[-_]/, 1)[0]?.toLowerCase() === "zh", s = /^(?:86|88)$/i.test(i?.trim() ?? ""), c = "highAnsi";
	return e <= 127 ? c = "ascii" : e <= 255 ? c = a && (zi.has(e) || o && Bi.has(e)) ? "eastAsia" : "highAnsi" : e >= 256 && e <= 687 ? c = a && (o || s) ? "eastAsia" : "highAnsi" : e >= 688 && e <= 767 || e >= 768 && e <= 879 || e >= 880 && e <= 975 || e >= 1024 && e <= 1279 ? c = a ? "eastAsia" : "highAnsi" : e >= 1424 && e <= 1983 || e >= 64285 && e <= 65023 || e >= 65136 && e <= 65278 ? c = "ascii" : e >= 4352 && e <= 4607 || e >= 11904 && e <= 12031 || e >= 12032 && e <= 12255 || e >= 12272 && e <= 12687 || e >= 12688 && e <= 12703 || e >= 12800 && e <= 19903 || e >= 19968 && e <= 40879 || e >= 40960 && e <= 42127 || e >= 42128 && e <= 42191 || e >= 44032 && e <= 55215 || e >= 63744 && e <= 64255 || e >= 65072 && e <= 65103 || e >= 65104 && e <= 65135 || e >= 65280 && e <= 65519 || e >= 65536 && e <= 1114111 ? c = "eastAsia" : e >= 7680 && e <= 7935 ? c = a && o ? "eastAsia" : "highAnsi" : (e >= 8192 && e <= 10175 || e >= 57344 && e <= 63743 || e >= 64256 && e <= 64284) && (c = a ? "eastAsia" : "highAnsi"), c === "eastAsia" && a ? c : t ? "complexScript" : c;
}
function Hi(e, t) {
	return e.themeFontPresence?.[t] ?? e.themeFonts?.[t] != null ? e.themeFonts?.[t] : e.fonts[t] ?? (e.themeFontPresence?.ascii ?? e.themeFonts?.ascii != null ? e.themeFonts?.ascii : e.fonts.ascii);
}
function Ui(e) {
	let t = Ri(e.localMetrics), n = Object.freeze(Object.fromEntries(Object.entries(e.genericFamilies ?? {}).map(([e, t]) => [e.trim().toLocaleLowerCase("en-US"), t]).sort(([e], [t]) => e.localeCompare(t)))), r = Object.freeze(Object.fromEntries(Object.entries(e.eastAsiaFontCharsets ?? {}).map(([e, t]) => [e.trim().toLocaleLowerCase("en-US"), t.trim()]).sort(([e], [t]) => e.localeCompare(t)))), i = it("text", {
		fonts: e.fonts.fingerprint,
		measurer: e.measurer.fingerprint,
		localMetrics: t,
		eastAsiaFontCharsets: r,
		genericFamilies: n
	}), a = (t) => {
		let r = Hi(t, t.slot), i = r ? n[r.trim().toLocaleLowerCase("en-US")] ?? t.genericFamily ?? "sans-serif" : t.genericFamily ?? Ii(t.slot);
		return e.fonts.resolve({
			requestedFamily: r,
			genericFamily: i,
			weight: t.weight,
			style: t.style
		});
	}, o = /* @__PURE__ */ new Map(), s = (t) => {
		let n = JSON.stringify([
			t.text,
			t.fontRoute.familyList,
			t.fontRoute.scope,
			t.fontRoute.fingerprint,
			t.fontSizePt,
			t.weight,
			t.style,
			t.letterSpacingPt,
			t.kerning ?? null
		]), r = o.get(n);
		if (r) return r;
		let i = e.measurer.measure(t), a = Object.freeze({
			...i,
			...i.inkBounds ? { inkBounds: Object.freeze({ ...i.inkBounds }) } : {}
		});
		return o.set(n, a), a;
	}, c = (t) => e.measurer.measure(t).advancePt, l = /* @__PURE__ */ new Map();
	return Object.freeze({
		fingerprint: i,
		localMetrics: t,
		resolve: a,
		shape(e) {
			if (!Number.isFinite(e.fontSizePt) || e.fontSizePt < 0) throw RangeError("fontSizePt must be a finite non-negative number");
			let t = JSON.stringify([
				e.text,
				e.fontSizePt,
				[
					e.fonts.ascii ?? null,
					e.fonts.highAnsi ?? null,
					e.fonts.eastAsia ?? null,
					e.fonts.complexScript ?? null
				],
				[
					e.themeFonts?.ascii ?? null,
					e.themeFonts?.highAnsi ?? null,
					e.themeFonts?.eastAsia ?? null,
					e.themeFonts?.complexScript ?? null
				],
				[
					e.themeFontPresence?.ascii ?? null,
					e.themeFontPresence?.highAnsi ?? null,
					e.themeFontPresence?.eastAsia ?? null,
					e.themeFontPresence?.complexScript ?? null
				],
				e.weight ?? null,
				e.style ?? null,
				e.complexScript ?? null,
				e.fontHint ?? null,
				e.eastAsiaLanguage ?? null,
				e.eastAsiaFontCharset ?? null,
				e.genericFamily ?? null,
				e.letterSpacingPt ?? null,
				e.kerning ?? null,
				e.measure ?? null,
				e.clusterGeometry ?? null
			]), n = l.get(t);
			if (n) return n;
			let i = [], o = Object.freeze([...new Set([
				0,
				...O(e.text),
				e.text.length
			])].sort((e, t) => e - t)), u = new Set(o), d = 0;
			for (let t of e.text) {
				let n = d + t.length, a = Hi(e, "eastAsia"), o = e.eastAsiaFontCharset ?? (a ? r[a.trim().toLocaleLowerCase("en-US")] : void 0), s = Vi(t.codePointAt(0) ?? 0, e.complexScript ?? !1, e.fontHint, e.eastAsiaLanguage, o), c = i.at(-1);
				c?.script === s ? (c.text += t, c.end = n) : i.push({
					text: t,
					start: d,
					end: n,
					script: s,
					breakBefore: u.has(d)
				}), d = n;
			}
			let f = i.map((t) => {
				let n = a({
					fonts: e.fonts,
					themeFonts: e.themeFonts,
					themeFontPresence: e.themeFontPresence,
					slot: t.script,
					weight: e.weight,
					style: e.style,
					genericFamily: e.genericFamily
				}), r = e.measure === !1 ? {
					advancePt: 0,
					ascentPt: 0,
					descentPt: 0
				} : s({
					text: t.text,
					fontRoute: n.route,
					fontSizePt: e.fontSizePt,
					weight: n.weight,
					style: n.style,
					letterSpacingPt: e.letterSpacingPt ?? 0,
					kerning: e.kerning
				});
				return Object.freeze({
					...t,
					...r,
					font: n,
					fontRoute: n.route
				});
			}), p = f.flatMap((e) => e.font.diagnostics), m = f.length > 0 && f.every((e) => e.inkBounds !== void 0) ? (() => {
				let e = 0, t = Infinity, n = -Infinity, r = 0, i = 0;
				for (let a of f) {
					let o = a.inkBounds;
					t = Math.min(t, e + o.xMinPt), n = Math.max(n, e + o.xMaxPt), r = Math.max(r, o.ascentPt), i = Math.max(i, o.descentPt), e += a.advancePt;
				}
				return Object.freeze({
					xMinPt: t,
					xMaxPt: n,
					ascentPt: r,
					descentPt: i
				});
			})() : void 0, h = f.reduce((e, t) => e + t.advancePt, 0), g = e.clusterGeometry === !1 ? void 0 : (() => {
				let t = new Map([[0, 0], [e.text.length, h]]), n = (n) => {
					if (e.measure === !1 || n <= 0) return 0;
					let r = t.get(n);
					if (r !== void 0) return r;
					let i = 0;
					for (let t of f) {
						if (n >= t.end) {
							i += t.advancePt;
							continue;
						}
						if (n <= t.start) break;
						i += c({
							text: t.text.slice(0, n - t.start),
							fontRoute: t.fontRoute,
							fontSizePt: e.fontSizePt,
							weight: t.font.weight,
							style: t.font.style,
							letterSpacingPt: e.letterSpacingPt ?? 0,
							kerning: e.kerning
						});
						break;
					}
					return t.set(n, i), i;
				};
				return Object.freeze(o.slice(0, -1).map((e, t) => {
					let r = o[t + 1] ?? e, i = n(e);
					return Object.freeze({
						range: Object.freeze({
							start: e,
							end: r
						}),
						offsetPt: i,
						advancePt: n(r) - i
					});
				}));
			})(), _ = Object.freeze({
				advancePt: h,
				ascentPt: Math.max(0, ...f.map((e) => e.ascentPt)),
				descentPt: Math.max(0, ...f.map((e) => e.descentPt)),
				...m ? { inkBounds: m } : {},
				...m && f.every((e) => e.horizontalInkBoundsAreTight === !0) ? { horizontalInkBoundsAreTight: !0 } : {},
				spans: Object.freeze(f),
				graphemeBoundaries: o,
				...g ? { clusters: g } : {},
				diagnostics: Object.freeze(p)
			});
			return l.set(t, _), _;
		}
	});
}
//#endregion
//#region packages/docx/src/fit-text.ts
function Wi(e, t) {
	let n = [];
	for (let r = 0; r < e.length;) {
		let i = e[r];
		if (i.fitTextValTwips === void 0) {
			r += 1;
			continue;
		}
		let a = r + 1;
		if (i.fitTextId !== void 0) for (; a < e.length && e[a].fitTextValTwips !== void 0 && e[a].fitTextId === i.fitTextId;) a += 1;
		let o = 0, s = 0;
		for (let t = r; t < a; t += 1) {
			let n = e[t];
			o += n.naturalWidthPx * (n.charScale ?? 1), s += n.charCount;
		}
		let c = i.fitTextValTwips / 20 * t, l = s > 1 ? (c - o) / (s - 1) : 0, u = c - o - Math.max(0, s - 1) * l;
		n.push({
			start: r,
			end: a,
			targetPx: c,
			naturalPx: o,
			charCount: s,
			perGapPx: l,
			trailingPadPx: u
		}), r = a;
	}
	return n;
}
//#endregion
//#region packages/docx/src/layout/exact-geometry.ts
function Gi(e) {
	return e < 0n ? -e : e;
}
function Ki(e, t) {
	let n = Gi(e), r = Gi(t);
	for (; r !== 0n;) {
		let e = n % r;
		n = r, r = e;
	}
	return n;
}
function qi(e, t) {
	if (t === 0n) throw Error("Exact rational denominator must be nonzero");
	if (e === 0n) return Object.freeze({
		numerator: 0n,
		denominator: 1n
	});
	let n = t < 0n ? -1n : 1n, r = Ki(e, t);
	return Object.freeze({
		numerator: n * e / r,
		denominator: n * t / r
	});
}
function H(e, t) {
	let n = e.numerator * t.denominator - t.numerator * e.denominator;
	return n < 0n ? -1 : +(n > 0n);
}
function Ji(e, t) {
	return qi(e.numerator * t.denominator - t.numerator * e.denominator, e.denominator * t.denominator);
}
function Yi(e, t) {
	return qi(e.numerator * t.denominator + t.numerator * e.denominator, 2n * e.denominator * t.denominator);
}
function Xi(e) {
	return `${e.numerator}/${e.denominator}`;
}
var Zi = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
function Qi(e) {
	if (!Number.isFinite(e)) throw Error("Exact geometry requires a finite binary64 value");
	if (e === 0) return Object.freeze({
		coefficient: 0n,
		exponent: 0
	});
	Zi.setFloat64(0, e, !1);
	let t = Zi.getBigUint64(0, !1), n = t >> 63n != 0n, r = Number(t >> 52n & 2047n), i = t & (1n << 52n) - 1n, a = r === 0 ? i : 1n << 52n | i, o = r === 0 ? -1074 : r - 1023 - 52;
	for (; (a & 1n) == 0n;) a >>= 1n, o += 1;
	return Object.freeze({
		coefficient: n ? -a : a,
		exponent: o
	});
}
function $i(e) {
	return e === 0n ? 0 : e.toString(2).length;
}
function ea(e, t, n) {
	let r = n >= 0 ? e : e << BigInt(-n), i = n >= 0 ? t << BigInt(n) : t;
	return r < i ? -1 : +(r > i);
}
function ta(e, t, n) {
	let r = n >= 0 ? e << BigInt(n) : e, i = n >= 0 ? t : t << BigInt(-n), a = r / i, o = r % i * 2n;
	return (o > i || o === i && (a & 1n) != 0n) && (a += 1n), a;
}
function na(e) {
	return Zi.setBigUint64(0, e, !1), Zi.getFloat64(0, !1);
}
function ra(e) {
	if (e.numerator === 0n) return 0;
	let t = e.numerator < 0n, n = Gi(e.numerator), r = e.denominator, i = $i(n) - $i(r);
	ea(n, r, i) < 0 && --i;
	let a = t ? 1n << 63n : 0n;
	if (i < -1022) {
		let e = ta(n, r, 1074);
		return na(e === 0n ? a : e >= 1n << 52n ? a | 1n << 52n : a | e);
	}
	let o = ta(n, r, 52 - i);
	if (o === 1n << 53n && (o >>= 1n, i += 1), i > 1023) return t ? -Infinity : Infinity;
	let s = BigInt(i + 1023) << 52n, c = o - (1n << 52n);
	return na(a | s | c);
}
function ia(e) {
	if (e === Infinity) return e;
	if (Object.is(e, -0) || e === 0) return Number.MIN_VALUE;
	Zi.setFloat64(0, e, !1);
	let t = Zi.getBigUint64(0, !1);
	return na(e > 0 ? t + 1n : t - 1n);
}
function aa(e) {
	let t = ra(e);
	if (t === Infinity) return t;
	if (t === -Infinity) return -Number.MAX_VALUE;
	let n = Qi(t);
	return H(n.exponent >= 0 ? {
		numerator: n.coefficient << BigInt(n.exponent),
		denominator: 1n
	} : {
		numerator: n.coefficient,
		denominator: 1n << BigInt(-n.exponent)
	}, e) >= 0 ? t : ia(t);
}
function oa(e) {
	return -aa({
		numerator: -e.numerator,
		denominator: e.denominator
	});
}
//#endregion
//#region packages/docx/src/layout/polygon-wrap.ts
function sa(e) {
	if (!e.points || e.points.length < 3 || e.points.some((e) => !Number.isFinite(e.xPt) || !Number.isFinite(e.yPt))) throw Error(`Invalid ${e.kind} wrapPolygon for ${e.imageKey}`);
	if (![
		e.xLeftPt,
		e.xRightPt,
		e.yTopPt,
		e.yBottomPt
	].every(Number.isFinite) || e.xRightPt < e.xLeftPt || e.yBottomPt < e.yTopPt) throw Error(`Invalid finite wrap bounds for ${e.imageKey}`);
}
var ca = /* @__PURE__ */ new WeakMap();
function la(e, t) {
	return e.x === t.x && e.y === t.y;
}
function ua(e, t, n, r) {
	return e * r - t * n;
}
function da(e, t) {
	return t > 0n ? e >= 0n && e <= t : e <= 0n && e >= t;
}
function fa(e, t) {
	let n = la(e.from, t.from) || la(e.from, t.to) ? e.from : la(e.to, t.from) || la(e.to, t.to) ? e.to : null;
	if (n) return Object.freeze({
		y: qi(n.y, 1n),
		contact: "shared-endpoint"
	});
	let r = e.to.x - e.from.x, i = e.to.y - e.from.y, a = t.to.x - t.from.x, o = t.to.y - t.from.y, s = ua(r, i, a, o);
	if (s === 0n) return null;
	let c = t.from.x - e.from.x, l = t.from.y - e.from.y, u = ua(c, l, a, o), d = ua(c, l, r, i);
	return !da(u, s) || !da(d, s) ? null : Object.freeze({
		y: qi(e.from.y * s + i * u, s),
		contact: i === 0n || o === 0n ? "horizontal" : "active-crossing"
	});
}
function pa(e, t) {
	return `${e}:${t}`;
}
function ma(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let i of t) {
		if (i < 0 || i >= Math.floor(e.length / 2)) continue;
		n();
		let t = e[i * 2], a = e[i * 2 + 1];
		r.add(pa(t, a));
	}
	return r;
}
function ha(e) {
	let t = (e) => {
		if (e.length === 0) return null;
		let n = e[Math.floor(e.length / 2)].yTopPt, r = [], i = [], a = [];
		for (let t of e) t.yBottomPt <= n ? r.push(t) : t.yTopPt > n ? i.push(t) : a.push(t);
		return Object.freeze({
			centerYPt: n,
			crossingByTop: Object.freeze(a),
			crossingByBottom: Object.freeze(a.slice().sort((e, t) => t.yBottomPt - e.yBottomPt)),
			below: t(r),
			above: t(i)
		});
	};
	return t(e.slice().sort((e, t) => e.yTopPt - t.yTopPt || e.yBottomPt - t.yBottomPt));
}
function ga(e, t) {
	return ra(t >= 0 ? {
		numerator: e.numerator << BigInt(t),
		denominator: e.denominator
	} : {
		numerator: e.numerator,
		denominator: e.denominator << BigInt(-t)
	});
}
function _a(e, t) {
	return aa(t >= 0 ? {
		numerator: e.numerator << BigInt(t),
		denominator: e.denominator
	} : {
		numerator: e.numerator,
		denominator: e.denominator << BigInt(-t)
	});
}
function va(e, t) {
	let n = Qi(e), r = n.exponent - t;
	return r >= 0 ? {
		numerator: n.coefficient << BigInt(r),
		denominator: 1n
	} : {
		numerator: n.coefficient,
		denominator: 1n << BigInt(-r)
	};
}
function ya(e, t, n) {
	let r = e.dx * n.numerator - e.c * n.denominator, i = t.dx * n.numerator - t.c * n.denominator, a = r * t.dy - i * e.dy;
	return a < 0n ? -1 : +(a > 0n);
}
function ba(e) {
	let t = (e) => {
		if (e.length === 0) return null;
		let n = e[Math.floor(e.length / 2)].yTop, r = [], i = [], a = [];
		for (let t of e) H(t.yBottom, n) <= 0 ? r.push(t) : H(t.yTop, n) > 0 ? i.push(t) : a.push(t);
		return Object.freeze({
			centerY: n,
			crossingByTop: Object.freeze(a),
			crossingByBottom: Object.freeze(a.slice().sort((e, t) => H(t.yBottom, e.yBottom))),
			below: t(r),
			above: t(i)
		});
	};
	return t(e.slice().sort((e, t) => H(e.yTop, t.yTop) || H(e.yBottom, t.yBottom)));
}
function xa(e, t, n, r) {
	if (!(!e || H(n, t) <= 0)) {
		if (H(n, e.centerY) <= 0) {
			for (let t of e.crossingByTop) {
				if (H(t.yTop, n) >= 0) break;
				r.push(t);
			}
			xa(e.below, t, n, r);
			return;
		}
		if (H(t, e.centerY) >= 0) {
			for (let n of e.crossingByBottom) {
				if (H(n.yBottom, t) <= 0) break;
				r.push(n);
			}
			xa(e.above, t, n, r);
			return;
		}
		r.push(...e.crossingByTop), xa(e.below, t, n, r), xa(e.above, t, n, r);
	}
}
function Sa(e, t, n, r, i) {
	let a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
	t.forEach((e, t) => {
		if (e.minY === e.maxY) return;
		let n = Xi(qi(e.minY, 1n)), r = Xi(qi(e.maxY, 1n)), i = a.get(n);
		i ? i.push(t) : a.set(n, [t]);
		let s = o.get(r);
		s ? s.push(t) : o.set(r, [t]);
	});
	let s = /* @__PURE__ */ new Map();
	for (let e of i) {
		if (e.contact !== "active-crossing") continue;
		let t = Xi(e.y), n = s.get(t);
		n || s.set(t, n = /* @__PURE__ */ new Set()), n.add(e.leftEdge), n.add(e.rightEdge);
	}
	let c = [], l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map(), d = [], f = [], p = 0, m = 0, h = (t, n, i) => {
		for (let a of t) {
			if (n.has(a)) continue;
			let t = u.get(a);
			if (t && H(i, t.yTop) > 0) {
				let n = Object.freeze({
					yTop: t.yTop,
					yBottom: i,
					leftEdge: t.leftEdge,
					rightEdge: t.rightEdge
				});
				d.push(n);
				let a = ga(t.yTop, r), o = ga(i, r);
				o > a && f.push(Object.freeze({
					yTopPt: a,
					yBottomPt: o,
					left: e[t.leftEdge],
					right: e[t.rightEdge]
				}));
			}
			u.delete(a);
		}
		for (let e of n) {
			if (t.has(e)) continue;
			let n = e.indexOf(":");
			u.set(e, {
				leftEdge: Number(e.slice(0, n)),
				rightEdge: Number(e.slice(n + 1)),
				yTop: i
			});
		}
	}, g = /* @__PURE__ */ new Map(), _ = (e, t) => {
		e.add(Math.floor((t - 1) / 2)), e.add(Math.floor(t / 2)), e.add(Math.floor((t + 1) / 2));
	}, v = (e) => ma(c, e, () => {
		m += 2;
	}), y = () => {
		let e = /* @__PURE__ */ new Set();
		for (let t = 0; t + 1 < c.length; t += 2) m += 2, e.add(pa(c[t], c[t + 1]));
		return e;
	};
	for (let e = 0; e < n.length; e += 1) {
		let r = n[e], i = n[e + 1], u = i ? Yi(r, i) : r, d = (e, n) => (p += 1, ya(t[e], t[n], u) || e - n), f = (e) => {
			let t = 0, n = c.length;
			for (; t < n;) {
				let r = t + n >>> 1;
				d(c[r], e) <= 0 ? t = r + 1 : n = r;
			}
			c.splice(t, 0, e);
			for (let e = t; e < c.length; e += 1) g.set(c[e], e);
		}, m = (e) => {
			let t = g.get(e);
			if (t !== void 0) {
				c.splice(t, 1), g.delete(e);
				for (let e = t; e < c.length; e += 1) g.set(c[e], e);
			}
		}, b = (e) => {
			let n = [...e].filter((e) => g.has(e) && H(qi(t[e].minY, 1n), r) <= 0 && H(r, qi(t[e].maxY, 1n)) < 0), i = n.map((e) => g.get(e)).sort((e, t) => e - t);
			n.sort(d);
			for (let e = 0; e < i.length; e += 1) {
				let t = i[e], r = n[e];
				c[t] = r, g.set(r, t);
			}
		}, x = Xi(r), S = o.get(x) ?? [], C = a.get(x) ?? [], w = s.get(x) ?? l;
		if (S.length === 0 && C.length === 0 && (w.size === 0 || i === void 0)) continue;
		let T = S.length > 0 || C.length > 0, E = /* @__PURE__ */ new Set();
		if (!T) for (let e of w) {
			let t = g.get(e);
			t !== void 0 && _(E, t);
		}
		let D = T ? y() : v(E);
		for (let e of S) m(e);
		for (let e of C) f(e);
		if (w.size > 0 && i !== void 0 && b(w), c.length % 2 != 0) throw Error("Compiled wrapPolygon produced an odd open-slab crossing count");
		if (T) h(D, y(), r);
		else {
			let e = /* @__PURE__ */ new Set();
			for (let t of w) {
				let n = g.get(t);
				n !== void 0 && _(e, n);
			}
			h(D, v(e), r);
		}
	}
	return Object.freeze({
		spans: Object.freeze(f),
		exactSpans: Object.freeze(d),
		orderComparisonCount: p,
		pairMembershipVisitCount: m
	});
}
function Ca(e) {
	sa(e);
	let t = e.points, n = Object.freeze(t.map((e) => Object.freeze({ ...e }))), r = [
		...n.flatMap((e) => [e.xPt, e.yPt]),
		e.xLeftPt,
		e.xRightPt,
		e.yTopPt,
		e.yBottomPt
	].map(Qi).filter(({ coefficient: e }) => e !== 0n), i = r.length === 0 ? 0 : Math.min(...r.map(({ exponent: e }) => e)), a = (e) => {
		let t = Qi(e);
		return t.coefficient === 0n ? 0n : t.coefficient << BigInt(t.exponent - i);
	}, o = n.map((e) => Object.freeze({
		x: a(e.xPt),
		y: a(e.yPt)
	})), s = n.map((e, t) => {
		let r = n[(t + 1) % n.length], i = r.yPt - e.yPt, a = i === 0 ? 0 : (r.xPt - e.xPt) / i;
		return Object.freeze({
			from: e,
			to: r,
			minYPt: Math.min(e.yPt, r.yPt),
			maxYPt: Math.max(e.yPt, r.yPt),
			slopeXPerY: a,
			interceptX: i === 0 ? e.xPt : e.xPt - a * e.yPt
		});
	}), c = o.map((e, t) => {
		let n = o[(t + 1) % o.length], r = e.y <= n.y ? e : n, i = e.y <= n.y ? n : e, a = i.x - r.x, s = i.y - r.y;
		return Object.freeze({
			index: t,
			from: e,
			to: n,
			minY: r.y,
			maxY: i.y,
			dx: a,
			dy: s,
			c: a * r.y - s * r.x
		});
	}), l = [];
	for (let e = 0; e < c.length; e += 1) for (let t = e + 1; t < c.length; t += 1) {
		let n = fa(c[e], c[t]);
		n && l.push(Object.freeze({
			y: n.y,
			contact: n.contact,
			leftEdge: e,
			rightEdge: t
		}));
	}
	let u = Infinity, d = -Infinity, f = Infinity, p = -Infinity;
	for (let e of n) u = Math.min(u, e.xPt), d = Math.max(d, e.xPt), f = Math.min(f, e.yPt), p = Math.max(p, e.yPt);
	let m = /* @__PURE__ */ new Map();
	for (let e of o) {
		let t = qi(e.y, 1n);
		m.set(Xi(t), t);
	}
	for (let e of l) m.set(Xi(e.y), e.y);
	let h = Object.freeze([...m.values()].sort(H)), g = Object.freeze([...new Set(h.map((e) => ga(e, i)))].sort((e, t) => e - t)), _ = Sa(s, c, h, i, l), v = qi(o.reduce((e, t) => t.x < e ? t.x : e, o[0].x), 1n), y = qi(o.reduce((e, t) => t.x > e ? t.x : e, o[0].x), 1n), b = qi(o.reduce((e, t) => t.y < e ? t.y : e, o[0].y), 1n), x = qi(o.reduce((e, t) => t.y > e ? t.y : e, o[0].y), 1n), S = qi(0n, 1n), C = (e, t) => {
		let n = Ji(e, t);
		return H(n, S) > 0 ? n : S;
	}, w = Object.freeze({
		scaleExponent: i,
		edges: Object.freeze(c),
		eventYs: h,
		spans: _.exactSpans,
		spanIndex: ba(_.exactSpans),
		polygonLeft: v,
		polygonRight: y,
		polygonTop: b,
		polygonBottom: x,
		padLeft: C(v, qi(a(e.xLeftPt), 1n)),
		padRight: C(qi(a(e.xRightPt), 1n), y),
		padTop: C(b, qi(a(e.yTopPt), 1n)),
		padBottom: C(qi(a(e.yBottomPt), 1n), x)
	}), T = Object.freeze({
		kind: e.kind,
		edges: Object.freeze(s),
		eventYPts: g,
		contourSpans: _.spans,
		contourSpanIndex: ha(_.spans),
		intersectionCount: l.length,
		compileOrderComparisonCount: _.orderComparisonCount,
		compilePairMembershipVisitCount: _.pairMembershipVisitCount,
		polygonLeftPt: u,
		polygonRightPt: d,
		polygonTopPt: f,
		polygonBottomPt: p,
		padLeftPt: Math.max(0, u - e.xLeftPt),
		padRightPt: Math.max(0, e.xRightPt - d),
		padTopPt: Math.max(0, f - e.yTopPt),
		padBottomPt: Math.max(0, e.yBottomPt - p)
	});
	return ca.set(T, w), T;
}
function wa(e, t) {
	return {
		numerator: e.dx * t.numerator - e.c * t.denominator,
		denominator: e.dy * t.denominator
	};
}
function Ta(e, t) {
	return e.dx * t.dy === t.dx * e.dy && e.c * t.dy === t.c * e.dy;
}
function Ea(e) {
	let t = e.filter((e) => H(e.r, e.l) > 0).slice().sort((e, t) => H(e.l, t.l) || H(e.r, t.r)), n = [];
	for (let e of t) {
		let t = n.at(-1);
		!t || H(e.l, t.r) > 0 ? n.push({ ...e }) : H(e.r, t.r) > 0 && (n[n.length - 1] = {
			l: t.l,
			r: e.r
		});
	}
	return n;
}
function Da(e, t) {
	return {
		numerator: e.numerator * t.denominator + t.numerator * e.denominator,
		denominator: e.denominator * t.denominator
	};
}
function Oa(e, t) {
	return {
		numerator: e.numerator * t.denominator - t.numerator * e.denominator,
		denominator: e.denominator * t.denominator
	};
}
function ka(e, t, n) {
	let r = ca.get(e);
	if (!r) throw Error("Compiled polygon omitted its exact geometry authority");
	let i = Oa(t, r.padBottom), a = Da(n, r.padTop), o = H(r.polygonTop, i) >= 0 ? r.polygonTop : i, s = H(r.polygonBottom, a) <= 0 ? r.polygonBottom : a;
	if (H(s, o) <= 0) return [];
	let c = [], l = [];
	xa(r.spanIndex, o, s, l);
	for (let e of l) {
		let t = H(o, e.yTop) >= 0 ? o : e.yTop, n = H(s, e.yBottom) <= 0 ? s : e.yBottom;
		if (H(n, t) <= 0) continue;
		let i = r.edges[e.leftEdge], a = r.edges[e.rightEdge];
		if (Ta(i, a)) continue;
		let l = wa(i, t), u = wa(i, n), d = wa(a, t), f = wa(a, n);
		c.push({
			l: Oa(H(l, u) <= 0 ? l : u, r.padLeft),
			r: Da(H(d, f) >= 0 ? d : f, r.padRight)
		});
	}
	let u = Ea(c);
	return e.kind === "through" || u.length === 0 ? u : [{
		l: u[0].l,
		r: u.at(-1).r
	}];
}
function Aa(e, t, n) {
	let r = ca.get(e);
	if (!r) throw Error("Compiled polygon omitted its exact geometry authority");
	let i = va(t, r.scaleExponent), a = Da(i, va(n, r.scaleExponent)), o = (e) => r.scaleExponent >= 0 ? {
		numerator: e.numerator << BigInt(r.scaleExponent),
		denominator: e.denominator
	} : {
		numerator: e.numerator,
		denominator: e.denominator << BigInt(-r.scaleExponent)
	};
	return Object.freeze(ka(e, i, a).map((e) => Object.freeze({
		l: o(e.l),
		r: o(e.r)
	})));
}
function ja(e, t) {
	let n = ca.get(e);
	if (!n) throw Error("Compiled polygon omitted its exact geometry authority");
	let r = va(t, n.scaleExponent), i = /* @__PURE__ */ new Set();
	for (let e of n.eventYs) i.add(_a(Da(e, n.padBottom), n.scaleExponent)), i.add(_a(Oa(Oa(e, r), n.padTop), n.scaleExponent));
	return Object.freeze([...i].filter(Number.isFinite).sort((e, t) => e - t));
}
function Ma(e, t, n, r) {
	let i = ca.get(e);
	if (!i) throw Error("Compiled polygon omitted its exact geometry authority");
	let a = Yi(va(n, i.scaleExponent), va(r, i.scaleExponent)), o = va(t, i.scaleExponent), s = Oa(a, i.padBottom), c = Da(o, i.padTop), l = Da(a, c), u = H(i.polygonTop, s) >= 0 ? i.polygonTop : s, d = H(i.polygonBottom, l) <= 0 ? i.polygonBottom : l, f = [], p = [];
	xa(i.spanIndex, u, d, p);
	for (let e of p) {
		let t = H(u, e.yTop) >= 0 ? u : e.yTop;
		if (H(H(d, e.yBottom) <= 0 ? d : e.yBottom, t) <= 0) continue;
		let n = i.edges[e.leftEdge], r = i.edges[e.rightEdge];
		if (Ta(n, r)) continue;
		let a = H(s, e.yTop) > 0, o = H(l, e.yBottom) < 0, p = (e, t, n, r) => {
			let a = t ? n : r, o = {
				numerator: e.dx * a.numerator - e.c * a.denominator,
				denominator: e.dy * a.denominator
			};
			return {
				slope: t ? {
					numerator: e.dx,
					denominator: e.dy
				} : {
					numerator: 0n,
					denominator: 1n
				},
				intercept: i.scaleExponent >= 0 ? {
					numerator: o.numerator << BigInt(i.scaleExponent),
					denominator: o.denominator
				} : {
					numerator: o.numerator,
					denominator: o.denominator << BigInt(-i.scaleExponent)
				}
			};
		}, m = p(n, a, {
			numerator: -i.padBottom.numerator,
			denominator: i.padBottom.denominator
		}, e.yTop), h = p(n, o, c, e.yBottom), g = p(r, a, {
			numerator: -i.padBottom.numerator,
			denominator: i.padBottom.denominator
		}, e.yTop), _ = p(r, o, c, e.yBottom), v = n.dx >= 0n ? m : h, y = r.dx >= 0n ? _ : g, b = Object.freeze({
			left: Object.freeze({
				slope: v.slope,
				intercept: Oa(v.intercept, i.scaleExponent >= 0 ? {
					numerator: i.padLeft.numerator << BigInt(i.scaleExponent),
					denominator: i.padLeft.denominator
				} : {
					numerator: i.padLeft.numerator,
					denominator: i.padLeft.denominator << BigInt(-i.scaleExponent)
				})
			}),
			right: Object.freeze({
				slope: y.slope,
				intercept: Da(y.intercept, i.scaleExponent >= 0 ? {
					numerator: i.padRight.numerator << BigInt(i.scaleExponent),
					denominator: i.padRight.denominator
				} : {
					numerator: i.padRight.numerator,
					denominator: i.padRight.denominator << BigInt(-i.scaleExponent)
				})
			})
		});
		f.push(b);
	}
	return Object.freeze(f);
}
//#endregion
//#region packages/docx/src/layout/axis-aligned-overlap.ts
function Na(e, t, n) {
	return e.left < t.right - n && e.right > t.left + n && e.top < t.bottom - n && e.bottom > t.top + n;
}
function Pa(e, t, n) {
	let r = e.right - e.left, i = e.bottom - e.top;
	if (r < 0 || i < 0) throw RangeError("Overlap rectangle has negative extent");
	let a = e.left, o = e.top;
	for (let e = 0; e <= t.length; e += 1) {
		let s = {
			left: a,
			right: a + r,
			top: o,
			bottom: o + i
		}, c = t.map((e) => ({
			left: e.left,
			right: e.right,
			top: e.top,
			bottom: e.bottom
		})).filter((e) => Na(s, e, n.overlapEpsilon));
		if (c.length === 0) return Object.freeze({
			left: a,
			top: o
		});
		if (e === t.length) throw Error("Axis-aligned overlap resolution did not converge");
		let l = Math.max(...c.map((e) => e.right));
		if (l + r <= n.rightBoundary + n.rightBoundarySlack) {
			a = l;
			continue;
		}
		o = Math.max(...c.map((e) => e.bottom));
	}
	throw Error("Axis-aligned overlap resolution did not converge");
}
//#endregion
//#region packages/docx/src/layout/compatibility.ts
function Fa(e, t) {
	if (e.trim() === "") throw Error(`CompatibilityRule.${t} must not be empty`);
}
function U(e) {
	if (Fa(e.id, "id"), Fa(e.description, "description"), !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id)) throw Error("CompatibilityRule.id must be a stable kebab-case identifier");
	if (e.evidence.kind === "microsoft-note") {
		if (Fa(e.evidence.reference, "evidence.reference"), !/^\[MS-[A-Z0-9]+\] §§?\d/.test(e.evidence.reference)) throw Error("CompatibilityRule.evidence.reference must identify a Microsoft specification section");
	} else if (e.evidence.kind === "regression-test") {
		if (Fa(e.evidence.reference, "evidence.reference"), !/^packages\/docx\/src\/.+\.(?:test|spec)\.tsx?#[^#]+$/.test(e.evidence.reference)) throw Error("CompatibilityRule.evidence.reference must use DOCX path#test-title");
	} else if (Fa(e.evidence.syntheticFixtureId, "evidence.syntheticFixtureId"), Fa(e.evidence.application, "evidence.application"), Fa(e.evidence.version, "evidence.version"), Fa(e.evidence.platform, "evidence.platform"), !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.evidence.syntheticFixtureId)) throw Error("CompatibilityRule.evidence.syntheticFixtureId must be kebab-case");
	return Object.freeze(e.evidence), Object.freeze(e);
}
U({
	id: "word-section-btlr-tbrl-page-frame",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/coordinate-space.test.ts#maps Transitional text direction %s to %s"
	},
	description: "Issue #988 comment 4950296007 records that, unlike the normative ECMA-376 Part 4 §14.11.7 equivalence to lr, Word uses the tbRl page frame for section-level btLr; this rule covers only the page frame, while glyph orientation is paint-owned."
}), U({
	id: "word-square-line-start-one-inch",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/float-line-start-one-inch.test.ts#(e) the boundary is identical across scales (absolute pt width)"
	},
	description: "Issue #676 records that Word starts a content line beside a square-wrapped object only when the free side gap is at least one inch; tight and through polygon openings and empty paragraph marks are outside this rule."
});
var Ia = U({
	id: "word-float-different-paragraph-displacement",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/floats.test.ts#keeps observed different-paragraph displacement on exclusion bounds"
	},
	description: "Preserve the established Word-compatible policy that an overlap-permitted float is displaced by exclusion geometry from floats anchored in other paragraphs, while same-paragraph floats may overlap."
}), La = U({
	id: "word-page-anchored-table-collision-deferral",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/float-table-page-fit.test.ts#(g) DEFERS a page-anchored floating table when its raw band intersects an existing table float"
	},
	description: "Preserve the established Word-compatible pagination behavior that defers an absolute page- or margin-anchored floating table when its authored object band intersects an existing floating-table text-exclusion band on the page."
});
U({
	id: "word-empty-mark-float-side-gap",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/float-line-start-one-inch.test.ts#keeps an anchor-host metric-only line on the paragraph-mark threshold"
	},
	description: "An empty or anchor-only paragraph-mark line may start beside a square-wrapped object when the available side gap can hold the paragraph mark em; the one-inch content-line threshold does not apply."
});
var Ra = .05;
function za(e) {
	return (72 - Ra) * e;
}
function Ba(e, t) {
	return e * t;
}
//#endregion
//#region packages/docx/src/layout/floats.ts
var Va = .01, Ha = .5;
function Ua(e, t) {
	return Object.freeze(e === "overlap" ? {
		kind: "word-different-paragraph",
		paragraphId: t
	} : { kind: "none" });
}
function Wa(e, t) {
	return Object.freeze(e ? {
		kind: "word-different-paragraph",
		paragraphId: t
	} : { kind: "drawingml-normative" });
}
function Ga(e) {
	let t = {
		occurrenceId: e.occurrenceId,
		paragraphId: e.paragraphId,
		bounds: e.bounds,
		exclusionBounds: e.exclusionBounds
	};
	return e.kind === "table" ? {
		...t,
		kind: "table",
		tableOverlap: e.overlap
	} : {
		...t,
		kind: e.kind === "shape" ? "drawingml" : "frame"
	};
}
function Ka(e, t) {
	let n = e.imageX, r = e.imageY, i = e.imageW, a = e.imageH, o = e.xLeft, s = e.xRight, c = e.yTop, l = e.yBottom, u = {
		occurrenceId: e.anchorOccurrenceId ?? e.acquisitionOccurrenceId ?? `display-float:${t}`,
		paragraphId: e.paraId,
		bounds: {
			xPt: n,
			yPt: r,
			widthPt: i,
			heightPt: a
		},
		exclusionBounds: {
			xPt: o,
			yPt: c,
			widthPt: s - o,
			heightPt: l - c
		}
	};
	return e.kind === "table" ? {
		...u,
		kind: "table",
		tableOverlap: e.tableOverlap
	} : {
		...u,
		kind: e.kind === "shape" ? "drawingml" : "frame"
	};
}
function qa(e) {
	let t = e.xPt, n = e.yPt, r = e.widthPt, i = e.heightPt;
	return {
		left: t,
		right: t + r,
		top: n,
		bottom: n + i
	};
}
function Ja(e, t, n) {
	return t === 0 && n === 0 ? e : Object.freeze({
		xPt: e.xPt + t,
		yPt: e.yPt + n,
		widthPt: e.widthPt,
		heightPt: e.heightPt
	});
}
function Ya(e, t, n, r) {
	return Object.freeze({
		bounds: Ja(e.bounds, t, n),
		exclusionBounds: Ja(e.exclusionBounds, t, n),
		displacement: Object.freeze({
			xPt: t,
			yPt: n
		}),
		appliedCompatibilityRuleIds: Object.freeze([...r])
	});
}
function Xa(e, t) {
	let n = e.bounds.xPt - e.exclusionBounds.xPt, r = e.bounds.yPt - e.exclusionBounds.yPt, i = e.exclusionBounds.xPt + e.exclusionBounds.widthPt - e.bounds.xPt - e.bounds.widthPt, a = e.exclusionBounds.yPt + e.exclusionBounds.heightPt - e.bounds.yPt - e.bounds.heightPt, o = qa(t.exclusionBounds);
	return {
		left: o.left - i,
		right: o.right + n,
		top: o.top - a,
		bottom: o.bottom + r
	};
}
function Za(e, t, n = e.rightBoundaryPt) {
	let r = qa(e.moving.bounds);
	return t.length === 0 ? Object.freeze({
		left: r.left,
		top: r.top
	}) : Pa(r, t, {
		overlapEpsilon: e.overlapEpsilonPt ?? 0,
		rightBoundary: n,
		rightBoundarySlack: e.rightBoundarySlackPt ?? 0
	});
}
function Qa(e) {
	let { moving: t, avoidance: n } = e, r = e.blockers.flatMap((e) => t.kind === "table" && e.kind === "table" && (t.tableOverlap === "never" || e.tableOverlap === "never") || n.kind === "drawingml-normative" && e.kind === "drawingml" ? [qa(e.bounds)] : []), i = n.kind === "word-different-paragraph" ? e.blockers.flatMap((e) => e.paragraphId === n.paragraphId ? [] : [Xa(t, e)]) : [], a = t.exclusionBounds.xPt + t.exclusionBounds.widthPt - t.bounds.xPt - t.bounds.widthPt, o = n.kind === "word-different-paragraph" ? e.rightBoundaryPt - a : e.rightBoundaryPt, s = Za(e, r, o), c = i.length === 0 ? s : Za(e, [...r, ...i], o);
	return Ya(t, c.left - t.bounds.xPt, c.top - t.bounds.yPt, c.left !== s.left || c.top !== s.top ? [Ia.id] : []);
}
function $a(e) {
	if (e.inlineEndPt < e.inlineStartPt || e.blockExtentPt < 0) throw RangeError("Block-flow admission received a negative extent");
	let t = e.blockers.filter((t) => {
		let n = t.exclusionBounds;
		return t.kind === "table" && e.inlineEndPt - n.xPt > e.overlapEpsilonPt && n.xPt + n.widthPt - e.inlineStartPt > e.overlapEpsilonPt;
	}), n = e.blockStartPt;
	for (let r = 0; r <= t.length; r += 1) {
		let i = t.filter((t) => {
			let r = t.exclusionBounds;
			return n + e.blockExtentPt - r.yPt > e.overlapEpsilonPt && r.yPt + r.heightPt - n > e.overlapEpsilonPt;
		});
		if (i.length === 0) return Object.freeze({ blockStartPt: n });
		if (r === t.length) throw Error("Block-flow float admission did not converge");
		n = Math.max(...i.map((e) => e.exclusionBounds.yPt + e.exclusionBounds.heightPt));
	}
	throw Error("Block-flow float admission did not converge");
}
function eo(e) {
	let t = qa(e.bounds), n = e.blockers.some((n) => n.kind === "table" && Na(t, qa(n.exclusionBounds), e.overlapEpsilonPt));
	return Object.freeze({
		defer: n,
		appliedCompatibilityRuleIds: Object.freeze(n ? [La.id] : [])
	});
}
//#endregion
//#region packages/docx/src/layout/float-wrap.ts
function W(e) {
	let t = Qi(e);
	return t.exponent >= 0 ? {
		numerator: t.coefficient << BigInt(t.exponent),
		denominator: 1n
	} : {
		numerator: t.coefficient,
		denominator: 1n << BigInt(-t.exponent)
	};
}
function to(e, t) {
	return {
		numerator: e.numerator * t.denominator + t.numerator * e.denominator,
		denominator: e.denominator * t.denominator
	};
}
function no(e, t) {
	return {
		numerator: e.numerator * t.denominator - t.numerator * e.denominator,
		denominator: e.denominator * t.denominator
	};
}
function ro(e, t) {
	return {
		numerator: e.numerator * t.numerator,
		denominator: e.denominator * t.denominator
	};
}
function io(e, t) {
	let n = t.numerator < 0n;
	return {
		numerator: (n ? -e.numerator : e.numerator) * t.denominator,
		denominator: e.denominator * (n ? -t.numerator : t.numerator)
	};
}
function ao(e, t) {
	let n = W(e), r = W(t);
	return ra({
		numerator: n.numerator * r.denominator + r.numerator * n.denominator,
		denominator: 2n * n.denominator * r.denominator
	});
}
function oo(e) {
	switch (e) {
		case "left":
		case "right":
		case "largest":
		case "bothSides": return e;
		default: return "bothSides";
	}
}
function so(e) {
	return e === "square" || e === "topAndBottom" || e === "tight" || e === "through";
}
function co(e, t, n) {
	return e.xRight > t + .01 && e.xLeft < n - .01;
}
var lo = /* @__PURE__ */ new WeakMap(), uo = 4, fo = /* @__PURE__ */ new WeakMap();
function po(e) {
	return Object.isFrozen(e) && e.every((e) => Object.isFrozen(e));
}
function mo(e, t, n, r, i, a) {
	return e.kind === t && Object.is(e.xLeftPt, n) && Object.is(e.xRightPt, r) && Object.is(e.yTopPt, i) && Object.is(e.yBottomPt, a);
}
function ho(e, t, n) {
	let r = e.authoredWrap;
	if (r !== "tight" && r !== "through") throw Error("Polygon compilation requires tight or through wrap");
	let i = {
		kind: r,
		imageKey: e.imageKey,
		points: e.wrapPolygon,
		xLeftPt: e.xLeft,
		xRightPt: e.xRight,
		yTopPt: e.yTop,
		yBottomPt: e.yBottom
	};
	sa(i);
	let a = po(t);
	if (a) {
		let i = fo.get(t)?.find((t) => mo(t, r, e.xLeft, e.xRight, e.yTop, e.yBottom));
		if (i) return n && (n.polygonCacheHitCount += 1), i.compiled;
	}
	n && (n.polygonCompileCount += 1);
	let o = Ca(i);
	if (a) {
		let n = Object.freeze({
			kind: r,
			xLeftPt: e.xLeft,
			xRightPt: e.xRight,
			yTopPt: e.yTop,
			yBottomPt: e.yBottom,
			compiled: o
		});
		fo.set(t, Object.freeze([n, ...(fo.get(t) ?? []).slice(0, uo - 1)]));
	}
	return o;
}
function go(e, t) {
	let n = e.map((e) => {
		let n = e.wrapPolygon;
		t && n && (t.polygonSnapshotPointCount += n.length);
		let r = Object.freeze({
			...e,
			...n ? { wrapPolygon: Object.freeze(n.map((e) => Object.freeze({ ...e }))) } : {}
		}), i = r.authoredWrap === "tight" || r.authoredWrap === "through" ? ho(r, n ?? [], t) : null;
		return Object.freeze({
			rect: r,
			polygon: i,
			wrapMaximumLeftPt: i ? Math.min(r.xLeft, i.polygonLeftPt) : r.xLeft,
			wrapMaximumRightPt: i ? Math.max(r.xRight, i.polygonRightPt) : r.xRight
		});
	}), r = Object.freeze({ floats: Object.freeze(n) });
	return lo.set(r, /* @__PURE__ */ new Map()), r;
}
function _o(e, t) {
	let n = oo(e.rect.side);
	if (n !== "largest") return n;
	let r = H(no(W(e.wrapMaximumLeftPt), W(t.xLeftPt)), no(W(t.xRightPt), W(e.wrapMaximumRightPt)));
	return r === 0 ? t.readingDirection === "ltr" ? "left" : "right" : r > 0 ? "left" : "right";
}
function vo(e, t, n, r, i, a) {
	let { rect: o, polygon: s } = e, c = s ? Aa(s, t, n) : [{
		l: W(o.xLeft),
		r: W(o.xRight)
	}];
	if (c.length === 0) return [];
	let l = s === null, u = c.reduce((e, t) => H(t.l, e) < 0 ? t.l : e, c[0].l), d = c.reduce((e, t) => H(t.r, e) > 0 ? t.r : e, c[0].r);
	switch (_o(e, a)) {
		case "left": return [{
			l: u,
			r: W(i),
			leftSquareBoundary: l,
			rightSquareBoundary: !1
		}];
		case "right": return [{
			l: W(r),
			r: d,
			leftSquareBoundary: !1,
			rightSquareBoundary: l
		}];
		case "bothSides": return c.map((e) => ({
			...e,
			leftSquareBoundary: l,
			rightSquareBoundary: l
		}));
	}
}
function yo(e, t) {
	let n = lo.get(t);
	if (!n) throw Error("Prepared float geometry omitted its sweep cache");
	let r = n.get(e);
	if (r) return r;
	let i = /* @__PURE__ */ new Set(), a = (e) => {
		Number.isFinite(e) && i.add(e);
	};
	for (let { rect: n, polygon: r } of t.floats) if (a(aa(no(W(n.yTop), W(e)))), a(n.yBottom), r) for (let t of ja(r, e)) a(t);
	let o = Object.freeze([...i].sort((e, t) => e - t));
	return n.set(e, o), o;
}
function bo(e) {
	let t = e.filter((e) => H(e.r, e.l) > 0).slice().sort((e, t) => H(e.l, t.l) || H(e.r, t.r)), n = [];
	for (let e of t) {
		let t = n.at(-1);
		if (!t || H(e.l, t.r) > 0) {
			n.push({ ...e });
			continue;
		}
		H(e.l, t.l) === 0 && (t.leftSquareBoundary = t.leftSquareBoundary && e.leftSquareBoundary);
		let r = H(e.r, t.r);
		r > 0 ? (t.r = e.r, t.rightSquareBoundary = e.rightSquareBoundary) : r === 0 && (t.rightSquareBoundary = t.rightSquareBoundary && e.rightSquareBoundary);
	}
	return n;
}
function xo(e, t, n, r, i) {
	let a = bo(e), o = W(t), s = W(n), c = [], l = (e, t, n) => {
		let r = H(o, e) >= 0 ? o : e, i = H(s, t) <= 0 ? s : t;
		H(i, r) > 0 && c.push({
			l: r,
			r: i,
			squareConstrained: n
		});
	}, u = o, d = !1;
	for (let e of a) {
		if (H(e.r, o) <= 0) {
			d = e.rightSquareBoundary;
			continue;
		}
		if (H(e.l, s) >= 0) {
			l(u, s, d), u = s;
			break;
		}
		H(e.l, u) > 0 && l(u, e.l, d || e.leftSquareBoundary);
		let t = H(e.r, u);
		if (t > 0 ? (u = e.r, d = e.rightSquareBoundary) : t === 0 && (d &&= e.rightSquareBoundary), H(u, s) >= 0) break;
	}
	H(u, s) < 0 && l(u, s, d);
	let f = {
		numerator: 0n,
		denominator: 1n
	};
	for (let e of c) {
		let t = no(e.r, e.l);
		H(t, f) > 0 && (f = t);
	}
	for (let e of c) {
		let t = no(e.r, e.l);
		if (H(t, f) === 0 && H(t, W(Math.max(1, e.squareConstrained ? i : r))) >= 0) return {
			l: e.l,
			r: e.r,
			squareConstrained: e.squareConstrained
		};
	}
	return null;
}
function So(e, t, n, r, i, a, o, s, c, l, u) {
	let d = W(e), f = to(d, W(t)), p = (e) => W(e);
	if (a.floats.some(({ rect: e }) => e.mode === "topAndBottom" && co(e, o, s) && H(f, p(e.yTop)) > 0 && H(d, p(e.yBottom)) < 0)) return null;
	let m = [];
	for (let i of a.floats) {
		let { rect: a } = i;
		if (a.mode !== "square" || H(f, p(a.yTop)) <= 0 || H(d, p(a.yBottom)) >= 0 || !co(a, n, r)) continue;
		let o = vo(i, e, t, n, r, c);
		o.length !== 0 && m.push(...o);
	}
	if (m.length === 0) return {
		topY: e,
		xOffset: 0,
		maxWidth: i
	};
	let h = xo(m, n, r, l, u);
	if (!h) return null;
	let g = {
		numerator: 0n,
		denominator: 1n
	}, _ = no(h.l, W(n)), v = H(_, g) > 0 ? _ : g, y = W(n), b = aa(v), x = n + b, S = W(x);
	if (H(S, h.l) < 0 && (b = aa(no(W(aa(h.l)), y)), x = n + b, S = W(x)), H(S, h.l) < 0) throw Error("Exact float window could not represent a contained start");
	let C = W(r), w = H(h.r, C) <= 0 ? h.r : C, T = no(W(oa(w)), S), E = oa(H(T, g) > 0 ? T : g);
	if (H(W(x + E), w) > 0) throw Error("Exact float window could not represent a contained end");
	return {
		topY: e,
		xOffset: b,
		maxWidth: E
	};
}
function Co(e, t) {
	return to(ro(e.exact.slope, W(t)), e.exact.intercept);
}
function wo(e, t) {
	return H(e.exact.slope, t.exact.slope) === 0 && H(e.exact.intercept, t.exact.intercept) === 0;
}
function To(e, t, n) {
	return H(Co(e, n), Co(t, n)) || H(e.exact.slope, t.exact.slope);
}
function Eo(e, t, n) {
	let r = no(e.slope, t.slope);
	if (r.numerator === 0n) return null;
	let i = no(e.intercept, t.intercept);
	return io(no(W(n), i), r);
}
function Do(e, t, n, r, i) {
	t === null || H(t, W(n)) <= 0 || H(t, W(r)) >= 0 || (e.push(aa(t)), i && (i.localRootCandidateCount += 1));
}
function Oo(e, t, n, r, i, a) {
	let o = e[0];
	for (let r of e.slice(1)) {
		let e = To(r, o, n);
		(t === "min" && e < 0 || t === "max" && e > 0) && (o = r);
	}
	let s = o.square;
	for (let c of e) if (c !== o) {
		if (wo(c, o)) {
			s &&= c.square;
			continue;
		}
		(t === "min" ? H(c.exact.slope, o.exact.slope) < 0 : H(c.exact.slope, o.exact.slope) > 0) && Do(i, Eo(c.exact, o.exact, 0), n, r, a);
	}
	return {
		exact: o.exact,
		square: s
	};
}
function ko(e, t = !1) {
	return {
		exact: {
			slope: {
				numerator: 0n,
				denominator: 1n
			},
			intercept: W(e)
		},
		square: t
	};
}
function Ao(e, t, n, r, i, a, o, s, c) {
	let { rect: l, polygon: u } = e, d = W(ao(n, r));
	if (H(to(d, W(t)), W(l.yTop)) <= 0 || H(d, W(l.yBottom)) >= 0) return [];
	let f = u ? Ma(u, t, n, r).map((e) => ({
		left: {
			exact: e.left,
			square: !1
		},
		right: {
			exact: e.right,
			square: !1
		}
	})) : [{
		left: ko(l.xLeft, !0),
		right: ko(l.xRight, !0)
	}];
	if (f.length === 0) return [];
	let p = Oo(f.map((e) => e.left), "min", n, r, s, c), m = Oo(f.map((e) => e.right), "max", n, r, s, c);
	switch (u?.kind === "tight" && (f = [{
		left: p,
		right: m
	}]), _o(e, o)) {
		case "left": return [{
			left: p,
			right: ko(a)
		}];
		case "right": return [{
			left: ko(i),
			right: m
		}];
		case "bothSides": return f;
	}
}
function jo(e, t, n, r, i) {
	let a = e.slice().sort((e, n) => To(e.left, n.left, t) || To(e.right, n.right, t));
	for (let e = 0; e + 1 < a.length; e += 1) Do(r, Eo(a[e].left.exact, a[e + 1].left.exact, 0), t, n, i);
	let o = [];
	for (let e of a) {
		let a = o.at(-1);
		if (!a) {
			o.push(e);
			continue;
		}
		if (Do(r, Eo(e.left.exact, a.right.exact, 0), t, n, i), To(e.left, a.right, t) > 0) {
			o.push(e);
			continue;
		}
		let s = Oo([a.right, e.right], "max", t, n, r, i), c = wo(a.left, e.left) ? {
			exact: a.left.exact,
			square: a.left.square && e.left.square
		} : a.left;
		o[o.length - 1] = {
			left: c,
			right: s
		};
	}
	return o;
}
function Mo(e, t, n, r, i, a, o, s, c, l, u, d) {
	let f = W(ao(e, t)), p = to(f, W(n));
	if (a.floats.some(({ rect: e }) => e.mode === "topAndBottom" && co(e, o, s) && H(p, W(e.yTop)) > 0 && H(f, W(e.yBottom)) < 0)) return null;
	let m = [], h = [];
	for (let o of a.floats) {
		let { rect: a } = o;
		a.mode === "square" && co(a, r, i) && h.push(...Ao(o, n, e, t, r, i, c, m, d));
	}
	if (h.length === 0) return null;
	let g = jo(h, e, t, m, d), _ = ko(r), v = ko(i), y = [], b = (n, r, i) => {
		let a = {
			slope: no(r.exact.slope, n.exact.slope),
			intercept: no(r.exact.intercept, n.exact.intercept)
		};
		y.push({ exactWidth: a });
		let o = Math.max(1, i ? u : l);
		H(to(ro(a.slope, W(e)), a.intercept), W(o)) < 0 && a.slope.numerator > 0n && Do(m, Eo(r.exact, n.exact, o), e, t, d);
	}, x = _;
	for (let e of g) b(x, e.left, x.square || e.left.square), x = e.right;
	b(x, v, x.square);
	let S = y[0];
	for (let t of y.slice(1)) (H(to(ro(t.exactWidth.slope, W(e)), t.exactWidth.intercept), to(ro(S.exactWidth.slope, W(e)), S.exactWidth.intercept)) || H(t.exactWidth.slope, S.exactWidth.slope)) > 0 && (S = t);
	if (S) for (let n of y) n === S || H(n.exactWidth.slope, S.exactWidth.slope) <= 0 || Do(m, Eo(n.exactWidth, S.exactWidth, 0), e, t, d);
	return m.length === 0 ? null : Math.min(...m);
}
function No(e, t, n, r, i, a, o = r, s = r + i, c = {
	xLeftPt: r,
	xRightPt: r + i,
	readingDirection: "ltr"
}, l = t, u = null) {
	let d = r, f = r + i, p = yo(n, a);
	if (u) {
		u.structuralEventCount = p.length;
		for (let { polygon: e } of a.floats) e && (u.compiledIntersectionCount += e.intersectionCount, u.compiledContourSpanCount += e.contourSpans.length, u.compileOrderComparisonCount += e.compileOrderComparisonCount, u.compilePairMembershipVisitCount += e.compilePairMembershipVisitCount);
	}
	let m = (e) => (u && (u.evaluatedYCount += 1), So(e, n, d, f, i, a, o, s, c, t, l)), h = m(e);
	if (h) return h;
	let g = e, _ = p.findIndex((e) => e > g);
	for (; _ >= 0 && _ < p.length;) {
		let e = p[_], r = Mo(g, e, n, d, f, a, o, s, c, t, l, u);
		if (r !== null) {
			u && (u.localRootEventCount += 1);
			let e = m(r);
			if (e) return e;
			g = r;
			continue;
		}
		let i = m(e);
		if (i) return i;
		g = e;
		do
			_ += 1;
		while (_ < p.length && p[_] <= g);
	}
	throw Error("Finite float line-window event sweep found no usable terminal Y");
}
function Po(e, t, n, r, i, a, o = r, s = r + i, c = {
	xLeftPt: r,
	xRightPt: r + i,
	readingDirection: "ltr"
}, l = t) {
	return No(e, t, n, r, i, a, o, s, c, l);
}
function Fo(e, t, n, r) {
	let i = /* @__PURE__ */ new Set();
	for (;;) {
		let a = e;
		for (let i of t) i.mode === "topAndBottom" && co(i, n, r) && e >= i.yTop && e < i.yBottom && (a = Math.max(a, i.yBottom));
		if (a === e) return e;
		if (!Number.isFinite(a) || a < e || i.has(a)) throw Error("Top-and-bottom solver violated strictly increasing finite-bottom progress");
		i.add(a), e = a;
	}
}
//#endregion
//#region packages/docx/src/layout/math-fallback-text.ts
var Io = new Set([
	"+",
	"-",
	"−",
	"=",
	"±",
	"×",
	"÷"
]);
function Lo(e) {
	return Io.has(e) ? ` ${e} ` : e;
}
function G(e) {
	return e.map((e) => {
		switch (e.kind) {
			case "run": return Lo(e.text);
			case "fraction": return `${G(e.num)}/${G(e.den)}`;
			case "sup": return `${G(e.base)}^${G(e.sup ?? [])}`;
			case "sub": return `${G(e.base)}_${G(e.sub ?? [])}`;
			case "subSup": return `${G(e.base)}_${G(e.sub ?? [])}^${G(e.sup ?? [])}`;
			case "nary": return `${e.op}${G(e.sub ?? [])}${G(e.sup ?? [])}${G(e.body)}`;
			case "delimiter": return `${e.begChar}${e.items.map(G).join(",")}${e.endChar}`;
			case "radical": return `${e.index?.length ? G(e.index) : ""}√${G(e.radicand)}`;
			case "limit": return `${G(e.base)}${G(e.lower ?? [])}${G(e.upper ?? [])}`;
			case "array": return e.rows.map((e) => e.map(G).join(" ")).join(" ");
			case "groupChr": return `${e.char}${G(e.base)}`;
			case "bar":
			case "box":
			case "borderBox": return G(e.base);
			case "accent": return `${e.char}${G(e.base)}`;
			case "func": return `${G(e.name)}(${G(e.arg)})`;
			case "group": return G(e.items);
			case "phant": return e.show ? G(e.base) : "";
			case "sPre": return `${G(e.sub)}${G(e.sup)}${G(e.base)}`;
		}
	}).join("").replace(/[ \t]{2,}/g, " ");
}
//#endregion
//#region packages/docx/src/layout/convergence.ts
var Ro = class extends V {
	reason;
	states;
	passes;
	constructor(e, t, n) {
		super("NON_CONVERGENCE", e === "cycle" ? `repeated exact-state cycle at ${t.at(-1) ?? "<missing>"}` : `hard exact-state pass limit ${n} reached`), this.name = "ExactConvergenceError", this.reason = e, this.states = Object.freeze([...t]), this.passes = n;
	}
};
function zo(e) {
	let t = Bo({
		...e,
		step: function* (t, n) {
			return e.step(t, n);
		}
	}), n = t.next();
	for (; !n.done;) n = t.next();
	return n.value;
}
function* Bo(e) {
	let { seedState: t, step: n, stateOf: r, limit: i } = e, a = t === void 0 ? 2 : 1;
	if (!Number.isInteger(i) || i < a) throw RangeError(`Exact convergence limit must be an integer >= ${a}`);
	let o = t === void 0 ? [] : [t], s = new Set(o), c = null;
	for (let e = 1; e <= i; e += 1) {
		let t = yield* n(c, e), a = r(t), l = o.at(-1);
		if (o.push(a), l === a) return Object.freeze({
			value: t,
			passes: e
		});
		if (s.has(a)) throw new Ro("cycle", o, e);
		if (s.add(a), e === i) throw new Ro("limit", o, e);
		c = t;
	}
	throw new Ro("limit", o, i);
}
function* Vo(e, t, n) {
	if (!Number.isInteger(n) || n < 1) throw new V("NON_CONVERGENCE", "limit must be a positive integer");
	try {
		return (yield* Bo({
			seedState: e.fingerprint,
			step: function* (n) {
				return yield* t(n ?? e);
			},
			stateOf: (e) => e.fingerprint,
			limit: n
		})).value;
	} catch (e) {
		throw e instanceof Ro ? new V("NON_CONVERGENCE", e.reason === "cycle" ? `repeated geometry fingerprint cycle at ${e.states.at(-1) ?? "<missing>"}` : `hard iteration limit ${n} reached`) : e;
	}
}
//#endregion
//#region packages/docx/src/layout/line-wrap-convergence.ts
var Ho = class extends V {
	reason;
	states;
	constructor(e, t) {
		super("NON_CONVERGENCE", e === "cycle" ? `line wrap measure/resolve cycle did not converge (${t.length} states)` : `line wrap measure/resolve pass limit did not converge (${t.length} states)`), this.name = "LineWrapNonConvergenceError", this.reason = e, this.states = Object.freeze([...t]);
	}
};
function Uo(e) {
	return e.map((e) => ({ ...e }));
}
function Wo(e, t) {
	return JSON.stringify(e.map((e, n) => ({
		end: e.consumedEnd,
		topY: e.topY,
		xOffset: e.xOffset,
		availableWidth: e.availWidth,
		probeHeight: t[n],
		segments: e.segments.map((e) => ({
			source: e.src,
			...e.text === void 0 ? {} : { text: e.text }
		}))
	})));
}
var Go = 16;
function Ko(e, t) {
	try {
		return zo({
			step: (n) => {
				let r = e(n?.probeHeights ?? null), i = Object.freeze(r.map(t));
				return Object.freeze({
					lines: r,
					probeHeights: i,
					state: Wo(r, i)
				});
			},
			stateOf: (e) => e.state,
			limit: Go
		}).value.lines;
	} catch (e) {
		throw e instanceof Ro ? new Ho(e.reason, e.states) : e;
	}
}
U({
	id: "word-east-asian-grid-line-allocation",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/compatibility.test.ts#pins East Asian grid allocation and the untabled Far East metric factor"
	},
	description: "For an East Asian single-spaced line on a document grid, preserve the measured whole-cell allocation from the intended face design height and use the established 1.3-times-em fallback only when that design height is unavailable."
}), U({
	id: "word-table-cell-ignores-grid-right-indent-adjustment",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "table-cell-adjust-right-indent-width-position-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "In the observed linesAndChars matrix, paragraphs inside fixed-width table cells retain the same line breaks for omitted (default true) and explicit-false w:adjustRightInd across four boundary widths and both left/right cell positions. Scope this Word-only exception to table-cell containers; ordinary body paragraphs retain the ECMA-376 §17.3.1.1 adjustment."
}), U({
	id: "word-snap-to-chars-east-asian-cell-fit",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "snap-to-chars-east-asian-cell-fit-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "For snapToChars, Word centers each East-Asian grapheme independently in the smallest whole number of character-pitch units that contains its natural advance. A grapheme that fits uses the one-unit placement described by [MS-OI29500] §2.1.534; an undersized authored pitch expands only that grapheme to additional units."
}), U({
	id: "word-snap-to-chars-script-block-allocation",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.534"
	},
	description: "Allocate snapToChars Latin text in contiguous blocks centered across the required grid units, complex-script blocks from their leading edge, and East-Asian graphemes independently by character cell."
});
function qo(e, t) {
	return !(t > 0) || !Number.isFinite(e) ? 1 : Math.max(1, Math.ceil(Math.max(0, e) / t - 1e-9));
}
function Jo(e) {
	return !e;
}
U({
	id: "word-grid-right-indent-pitch-alignment",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "grid-right-indent-character-pitch-boundary-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "For body paragraphs whose ECMA-376 §17.3.1.1 adjustment is enabled on a linesAndChars character grid, Word reduces the physical line width to the greatest whole character-pitch multiple not exceeding the available width. The observed matrix covers exact and non-exact widths, zero and negative charSpace, explicit opt-out, line-only control, both physical indent sides, and the separately registered table-cell exception."
});
function Yo(e, t) {
	if (!(t > 0) || !Number.isFinite(e) || e <= 0) return 0;
	let n = (e % t + t) % t, r = 1e-9;
	return n <= r || t - n <= r ? 0 : n;
}
U({
	id: "word-hanging-tab-same-position-precedence",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "hanging-indent-authored-tab-collision-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "When the implicit tab created by a hanging indent shares its coordinate with an authored center, end, or start stop, Word resolves one advancing stop at that coordinate using the authored alignment. An authored bar remains an independent drawing rule, so the implicit advancing stop survives beside it. If center/end alignment would place following text before the current pen, the tab contributes zero advance."
});
function Xo(e) {
	return e !== "bar" && e !== "clear";
}
U({
	id: "word-rtl-decimal-tab-physical-alignment",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "rtl-decimal-tab-run-boundary-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "For LTR numeric cells embedded in a bidi paragraph, Word aligns the physical left edge of the first halfwidth period to the decimal stop across source-run boundaries. When no period exists, it aligns the numeric cell's physical right edge to the stop."
}), U({
	id: "word-decimal-tab-separator-resolution",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.556"
	},
	description: "Use the first explicit halfwidth period as the decimal-tab alignment point; when absent, use the implicit separator after the final digit of the first Unicode decimal-number sequence."
}), U({
	id: "word-use-fe-layout-inherited-grid-minimum",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "use-fe-layout-visible-script-grid-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "With useFELayout enabled, a visible Latin line with a resolved eastAsia font axis participates in Far East grid metrics even when w:rFonts@hint is absent; inherited automatic spacing keeps the larger of its whole-cell design allocation and one grid pitch multiplied by the inherited spacing value."
}), U({
	id: "word-use-fe-layout-empty-mark-grid-allocation",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "use-fe-layout-empty-mark-grid-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "With useFELayout enabled, a content-less paragraph mark participates in Far East whole-cell document-grid allocation even when the document contains no literal East Asian text. Its face-specific Far East design height governs the cell count; exact spacing and snapToGrid=false remain the document-grid overrides named by ECMA-376 §17.6.5. Observed Word output gives signed atLeast spacing a discontinuous boundary on an active grid: negative values use their absolute magnitude as the mark advance, zero keeps the ordinary atLeast-zero advance regardless of inheritance source, and positive values retain whole-cell allocation."
});
function Zo(e) {
	let { ordinaryAdvancePx: t, allocatedGridAdvancePx: n, atLeastZeroAdvancePx: r, lineSpacing: i, gridAllocationActive: a, scale: o } = e;
	return a ? i?.rule === "atLeast" && i.value < 0 ? Math.abs(i.value) * o : i?.rule === "atLeast" && i.value === 0 ? r : i?.rule === "exact" ? t : Math.max(t, n) : t;
}
U({
	id: "word-contiguous-underline-geometry",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/paragraph.test.ts#uses one safe baseline for a solid underline spanning adjacent source runs"
	},
	description: "Adjacent compatible underlined source runs share one safe baseline and continuous authored cadence while style, color, and thickness boundaries remain distinct."
}), U({
	id: "word-grid-at-least-tall-line-unsnapped",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/line-box-height.test.ts#does not round tall East Asian content up to an additional grid cell"
	},
	description: "An explicitly authored atLeast line on an active document grid keeps the maximum of its natural height, authored minimum, and one pitch instead of rounding tall content to another whole cell."
}), U({
	id: "word-degenerate-line-spacing-single",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-DOC] §2.9.146"
	},
	description: "Preserve a non-collapsing single-line fallback for exact or automatic line spacing at or below zero, consistent with the native LSPD representation."
}), U({
	id: "word-auto-multiple-baseline-pin",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "auto-multiple-baseline-pin",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "Paint a positive automatic line-spacing multiplier with its glyph baseline pinned inside the single design line, placing extra leading or compressed overflow toward block-end; this is draw-only and does not replace the centered trailing-mark pagination metric."
}), U({
	id: "word-mixed-anchor-visible-line-metrics",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/anchor-host-metrics.test.ts#reserves host line height without using its zero-ink box for a visible run baseline"
	},
	description: "A zero-ink drawing anchor host reserves its line and grid height while visible neighboring glyphs retain their own ascent, descent, and design-line baseline."
}), U({
	id: "word-justification-leading-indent-exclusion",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/text-distribute.test.ts#forwards (segs, slack, firstContentSi, lastDrawnSi) positionally"
	},
	description: "Keep leading whitespace used as a first-line text indent fixed while distributing justified-line slack across content in a left-to-right line."
}), U({
	id: "word-justified-candidate-separator-fit",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/justify-shrink-overshoot.test.ts#counts a candidate trailing space when the prospective line will justify"
	},
	description: "On a full paragraph-width line that will be fully justified, include the candidate word separator in its wrap-fit width; lines narrowed by DrawingML wrap exclusions retain collapsible line-end separator fit behavior."
}), U({
	id: "word-overflow-punctuation-language-sets",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OE376] §2.1.56"
	},
	description: "Apply the language-specific punctuation sets documented for Word in [MS-OE376] §2.1.56, and let overflowPunct override kinsoku when both rules affect the same character."
}), U({
	id: "word-full-width-character-spacing-scope",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OE376] §2.1.562"
	},
	description: "Interpret ST_CharacterSpacing as applying whitespace compression to full-width punctuation characters. This rule establishes only which characters are eligible; it does not define a universal compression amount."
}), U({
	id: "word-japanese-punctuation-compression-cell",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "japanese-fullwidth-punctuation-compression-cell",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "In the observed Japanese compatibility matrix, 、。 ，． and the closing forms 」』】）］｝ on a full ideographic-cell advance retain at least half of that cell. U+3017 and full-width !/? remain full-cell. A fontTable w:pitch value classifies the authored face for font selection; it is not a switch for document-level characterSpacingControl. Punctuation that the selected face already exposes on a smaller proportional advance is retained as measured rather than compressed a second time. Tight adjacent glyph ink can require a larger retained extent to prevent collision. This is an Office-observed compression amount, not a normative interpretation of ST_CharacterSpacing."
}), U({
	id: "word-authored-character-spacing-pitch-priority",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "authored-character-spacing-punctuation-pitch",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "When a run authors a positive w:spacing character pitch, Word preserves that expanded pitch instead of additionally applying the document-level punctuation whitespace compression. Omitted, zero, or overlapping run spacing leaves characterSpacingControl active."
}), U({
	id: "word-source-run-space-sequence",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "source-run-space-sequence-wrap-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "At a source-run boundary, Word keeps a space-only continuation attached when the preceding run already ends in a space. A single leading space in a distinct run without a preceding space remains a break opportunity. This isolates source-boundary compatibility from the ordinary UAX #14 LB7 handling within one authored run."
}), U({
	id: "word-consecutive-space-natural-advance",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "consecutive-space-wrap-grid-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "When visible text follows two or more authored consecutive spaces, Word preserves the sequence at natural advance instead of using it as Knuth-Plass inter-word shrink capacity. The result is invariant across linesAndChars with negative/zero charSpace and a line-only grid; source-run boundaries remain governed separately by the source-space-sequence rule."
}), U({
	id: "word-balanced-consecutive-space-cell",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "single-double-byte-width-space-grid-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "With ECMA-376 §17.15.3.3 balanceSingleByteDoubleByteWidth enabled, Word retains one ordinary inter-word U+0020 at its proportional natural advance, while a sequence of two or more authored U+0020 spaces advances each space by half of the selected East-Asian ideographic cell. The observed matrix covers one, two, four, and eight spaces; same-run and source-run boundaries; proportional and fixed-pitch faces; linesAndChars with negative/zero charSpace; and a line-only grid."
});
function Qo(e) {
	return Number.isInteger(e) && e >= 2;
}
function $o(e) {
	return e !== "snapToChars";
}
U({
	id: "word-balanced-lines-and-chars-grid-delta",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "single-double-byte-width-grid-observation-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "With balanceSingleByteDoubleByteWidth enabled on linesAndChars, Word applies half of the authored charSpace delta to ASCII SBCS text and to U+0020/U+3000 space characters, while applying the full delta to CJK ideographs and full-width ASCII forms. The Word-output evidence covers ASCII digits, letters, punctuation, spaces, CJK, full-width ASCII, mixed text, proportional/fixed-pitch faces, negative/zero/positive charSpace, and line-only controls. Non-ASCII high-ANSI and complex-script text are outside the observed matrix and retain the preexisting grid behavior."
}), U({
	id: "word-ideographic-space-line-end-allowance",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "ideographic-space-line-end-count-and-run-boundary-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "Word keeps a single U+3000 immediately following visible East-Asian text on that line when the visible glyph is force-fitted into a narrow table cell. A paragraph-final sequence of two or more U+3000 characters remains authored width-bearing content and may form blank continuation lines. The observed matrix covers single and trailing multiple spaces, linesAndChars with negative/positive charSpace, line-only grids, and snapToGrid opt-out."
});
function es(e, t) {
	return e && t === 1 ? 1 : 0;
}
function ts(e, t) {
	if (t !== "complexScript") return e.length > 0 && [...e].every((e) => e === " " || e === "　") ? .5 : t === "eastAsia" ? 1 : [...e].every((e) => (e.codePointAt(0) ?? 128) <= 127) ? .5 : void 0;
}
U({
	id: "word-ms-mincho-empty-east-asian-mark-height",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "ms-mincho-empty-east-asian-paragraph-mark",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "In the observed compatibility fixture, an empty 12-point East-Asian paragraph mark routed to MS Mincho occupies a 15.6-point single-line box. Scope this 1.3-em floor to empty East-Asian paragraph marks; ordinary MS Mincho text lines and Latin marks retain their independently measured metrics."
});
function ns(e) {
	let t = Math.max(0, e.punctuationAdvancePt), n = Math.max(0, e.ideographicCellAdvancePt);
	return t < n ? t : Math.min(t, Math.max(0, e.punctuationInkEndPt, n / 2));
}
function rs(e) {
	return e === void 0 || e <= 0;
}
function is(e, t) {
	return e.endsWith(" ") && t.startsWith(" ");
}
var as = {
	ja: new Set([...",.’”、。」』】），．］｝｡､"]),
	zhHans: new Set([..."!%),.:;>?]}¢°·ˇ’”‰′″℃∶、。〃〉》」』】〗〕〞﹚﹜﹞！＂％＇），．：；？］｝￠"]),
	zhHant: new Set([..."!),.:;?]}’”′、。〉》」』】〕〞﹚﹜﹞！），．：；？］｝"]),
	ko: new Set([..."!%),.:;?]}¢°’”′″℃〉》」』】〕！％），．：；？］｝￠"])
}, os = new Set([
	...as.ja,
	...as.zhHans,
	...as.zhHant,
	...as.ko
]);
function ss(e, t) {
	let n = t?.toLowerCase();
	return n?.startsWith("ja") ? as.ja.has(e) : n?.startsWith("ko") ? as.ko.has(e) : n?.startsWith("zh") ? (/(?:^|-)(?:tw|hk|mo)(?:-|$)|hant/u.test(n) ? as.zhHant : as.zhHans).has(e) : os.has(e);
}
function cs(e) {
	return e.lineWillJustify && e.wrapNarrowed !== !0 ? e.widthPx : e.widthPx - e.trailingSpacePx;
}
function ls(e) {
	return e.resolvedMeasurementRouteCount === 1 ? e.biasBudgetPx : 0;
}
U({
	id: "word-ruby-paragraph-uniform-line-advance",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/paragraph-measure.test.ts#uses one uniform snapped advance for every line in a ruby paragraph"
	},
	description: "Every line in a ruby-bearing paragraph uses the paragraph-wide maximum snapped line advance so its baseline rhythm remains uniform."
}), U({
	id: "word-fit-text-inter-character-expansion",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/fit-text.test.ts#distributes (val − Σnatural)/(n−1) as the inter-character gap, no trailing gap"
	},
	description: "Expand a multi-character fitText region to its authored width by distributing the residual evenly across interior character gaps."
}), U({
	id: "word-cjk-both-inter-character-expansion",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/text-distribute.test.ts#§17.18.44: fills a wrapped pure-CJK line via inter-CJK pitch (expansion default)"
	},
	description: "Treat inter-CJK boundaries as eligible inter-word gaps when expanding a non-final both-justified line that contains no spaces."
}), U({
	id: "word-thai-distribute-cluster-policy",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/thai-distribute.test.ts#fills non-final lines to the right margin under thaiDistribute"
	},
	description: "Expand non-final thaiDistribute lines at Thai grapheme-cluster boundaries while retaining a natural-width final line."
}), U({
	id: "word-numeric-decimal-tab-inference",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/decimal-tab-autoalign.test.ts#right-aligns numbers of different digit counts at the decimal tab"
	},
	description: "Right-align an otherwise tab-less numeric paragraph at its leading decimal tab while leaving non-numeric and no-decimal-tab paragraphs unchanged."
}), U({
	id: "word-numbering-marker-overflow-tab-advance",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/numbered-marker-tab-advance.test.ts#advances the body past the marker to the next tab stop, not onto indentLeft"
	},
	description: "When a numbering marker overruns its hanging-indent budget, advance the body to the next reachable tab stop beyond the marker edge."
}), U({
	id: "word-numbering-suffix-coincident-list-tab",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/numbering-marker.test.ts#keeps a suffix tab on the list stop coincident with the marker end"
	},
	description: "For the tab synthesized by a numbering suffix, accept an authored numeric list tab coincident with the shaped marker end instead of advancing to the next automatic tab stop."
}), U({
	id: "word-numbering-marker-paragraph-mark-fallback",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "numbering-marker-paragraph-mark-formatting",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "When numbering-level rPr omits a marker formatting axis, Word takes that axis from the effective paragraph-mark rPr rather than a content run. A numbering-level concrete value or explicit auto remains authoritative, and body and text-box stories use the same cascade."
});
function us(e, t) {
	return t.alignment === "num" && Math.abs(t.pos - e) <= 1e-6;
}
U({
	id: "word-tab-stop-page-edge-clamp",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/rtl-tab-stops.test.ts#pins a page number to the left text margin when the stop is past it"
	},
	description: "Clamp content assigned to a tab stop beyond the trailing text edge back onto that edge instead of placing ink outside the page content band."
}), U({
	id: "word-dictionary-sea-natural-fit",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/sea-justified-fit.test.ts#Rule 1: wraps the paragraph-final Thai word on a thaiDistribute closing line (zero space-shrink)"
	},
	description: "Do not admit a dictionary Southeast-Asian word by compressing preceding inter-word spaces when its natural advance exceeds the remaining line width."
}), U({
	id: "word-dictionary-sea-atomic-chunk",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/sea-justified-fit.test.ts#Rule 2: a no-space chunk that fits a full line moves whole instead of splitting"
	},
	description: "Move a glued dictionary Southeast-Asian chunk to a fresh line whole when it fits that full line, using dictionary breaks only when the chunk itself is overlong."
}), U({
	id: "word-overlong-token-emergency-break",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/run-inline-formatting.test.ts#breaks a no-space token wider than the line at the character level"
	},
	description: "Emergency-break an overlong token at grapheme-safe character boundaries on an empty line so the complete token remains inside the content band."
}), U({
	id: "word-external-link-syntax-breaks",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "external-link-syntax-formatting-seam-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "Treat readable separators in the path and query of displayed external URLs as line-break opportunities, while keeping the scheme and authority intact and preserving authored no-break hyphens and grapheme clusters."
});
function ds(e, t, n) {
	let r = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//u.exec(e);
	if (!r) return [];
	let i = r[0].length, a = e.slice(i).search(/[/?#]/u), o = a < 0 ? e.length : i + a, s = [];
	for (let r = o; r < e.length; r += 1) {
		let i = e[r], a = r + 1;
		(i === "/" && r > o || i === "-" || i === "?" || i === "&") && t.has(a) && !n.has(a) && s.push(a);
	}
	return s;
}
U({
	id: "word-run-vertical-align-baseline-shift",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/run-char-metrics-render.test.ts#w:vertAlign raises superscript, lowers subscript, and leaves ordinary baselines unchanged"
	},
	description: "Retain the established run-level baseline displacement for vertically aligned text: superscript rises by 0.35 of its authored font size and subscript falls by 0.15, while the separately authored w:position remains additive."
}), U({
	id: "word-uniform-run-position-leading",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "uniform-run-position-leading",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "When every metric-bearing item on a line has the same non-zero w:position, Word preserves the enlarged line extent but shares the resulting surplus above and below the glyphs. A line containing a differently-positioned item retains the full relative displacement."
});
function fs(e, t) {
	return t === 0 ? e : e - t / 2;
}
function ps(e, t) {
	return e === "super" ? t * .35 : e === "sub" ? -t * .15 : 0;
}
var ms = 1.3;
function hs(e, t, n) {
	if (!n || !e) return 0;
	let r = e.trim().toLowerCase();
	return r === "ms mincho" || r === "ｍｓ 明朝" ? t * ms : 0;
}
function gs(e, t) {
	return t > 0 ? Math.max(1, Math.ceil(e / t)) : 1;
}
function _s(e, t) {
	return e > 0 ? e : t * ms;
}
function vs(e, t, n) {
	return Math.max(e, t * n);
}
function ys(e, t, n) {
	return Math.max(e, t, n);
}
function bs(e, t) {
	return (e === "exact" || e === "auto") && t <= 0;
}
U({
	id: "word-neutral-script-attachment",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/compatibility.test.ts#keeps neutral characters attached to the active script slice"
	},
	description: "Weak and neutral non-letter characters stay with the active complex-script slice instead of opening additional formatting segments."
}), U({
	id: "word-rtl-run-ambiguous-class-override",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/bidi-line.test.ts#keeps LTR word order for English text in rtl-marked runs"
	},
	description: "Model an rtl-marked run as a higher-level UAX #9 override for punctuation and symbols only, leaving whitespace and strong letters at their ordinary classes."
}), U({
	id: "word-rtl-complex-script-european-digits-an",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/bidi-line.test.ts#orders an AN-classified date as 2026-02-28"
	},
	description: "Classify European digits as Arabic Number within an Arabic or Hebrew complex-script run so UAX #9 preserves the compatible visual ordering of digit groups and separators."
}), U({
	id: "word-kashida-final-form-priority",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/kashida-priority.test.ts#uses the BaRa join (Beh->Yeh) over the final-letter join in بين"
	},
	description: "Apply the measured kashida final-letter priority classes only at a word-final following letter instead of copying the broader Qt final-form conditions."
}), U({
	id: "word-vertical-tu-corner-placement",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/vertical-text.test.ts#does NOT ink-centre a substituted Tu comma even when ink metrics are present"
	},
	description: "Keep a substituted vertical Tu comma or full stop at the font-designed upper-right cell position rather than ink-centering it geometrically."
});
var xs = /[\p{P}\p{S}]/u;
function Ss(e) {
	return xs.test(e);
}
function Cs(e, t) {
	return e === t;
}
function ws(e) {
	return e !== null;
}
//#endregion
//#region packages/docx/src/line-layout.ts
var K = {
	shapedClusters: void 0,
	selectedFaceInkBounds: void 0,
	selectedFaceFontBox: void 0,
	snapGridClass: void 0,
	snapGridNaturalWidthPx: void 0,
	snapGridLeadingPadPx: void 0,
	snapGridTrailingPadPx: void 0,
	snapGridCellPitchPx: void 0
};
function Ts(e, t, n, r, i, a = {}) {
	if (t != null) return t * n;
	if (!r?.ruby || !i) throw Error(`Ruby at ${e}pt without hpsRaise requires retained base and guide ink`);
	if (r.textLayoutService && r.textShapeRequest) {
		let e = r.textLayoutService.shape({
			...r.textShapeRequest,
			text: r.text,
			fontSizePt: Ai(r, n),
			measure: !0,
			clusterGeometry: !1
		}), t = r.textLayoutService.shape({
			...r.textShapeRequest,
			text: r.ruby.text,
			fontSizePt: r.ruby.fontSizePt * n,
			measure: !0,
			clusterGeometry: !1
		});
		if (e.inkBounds && t.inkBounds) return e.inkBounds.ascentPt + t.inkBounds.descentPt;
	}
	let o = i.font;
	try {
		i.font = Rs(r.bold, r.italic, Ai(r, n), r.fontFamily, a, r.fontRoute);
		let t = i.measureText(r.text);
		i.font = Rs(r.bold, r.italic, e * n, r.fontFamily, a, r.fontRoute);
		let o = i.measureText(r.ruby.text);
		if (Number.isFinite(t.actualBoundingBoxAscent) && Number.isFinite(o.actualBoundingBoxDescent)) return t.actualBoundingBoxAscent + o.actualBoundingBoxDescent;
	} finally {
		i.font = o;
	}
	throw Error("Ruby without hpsRaise requires retained base and guide ink");
}
var Es = new Set([
	"sakkal majalla",
	"traditional arabic",
	"simplified arabic",
	"arabic typesetting",
	"univers next arabic",
	"noto naskh arabic",
	"noto sans arabic"
]), Ds = new Set([
	"sakkal majalla",
	"traditional arabic",
	"simplified arabic",
	"arabic typesetting",
	"noto naskh arabic"
]);
function Os(e) {
	return Es.has(e.toLowerCase());
}
function ks(e) {
	return e.map((e) => `"${e}"`).join(", ");
}
var As = ["Noto Naskh Arabic", "Noto Sans Arabic"];
function js(e) {
	let t = e && e !== "jp" ? r(e, "sans") : [
		"Noto Sans JP",
		"Hiragino Sans",
		"Meiryo",
		...r("jp", "sans").slice(1)
	];
	return e == null ? `${ks([
		...d,
		"Arial",
		"Helvetica",
		"Liberation Sans",
		...t,
		...As
	])}, sans-serif` : `${ks([
		...t,
		...As,
		...d
	])}, sans-serif`;
}
function Ms(e) {
	let t = e && e !== "jp" ? r(e, "serif") : [
		"Yu Mincho",
		"YuMincho",
		"Hiragino Mincho ProN",
		"MS Mincho",
		"Noto Serif JP",
		...r("jp", "serif").slice(1)
	];
	return e == null ? `${ks([
		...m,
		"Times New Roman",
		"Cambria",
		"Liberation Serif",
		...t,
		...As
	])}, serif` : `${ks([
		...t,
		...As,
		...m
	])}, serif`;
}
var Ns = /* @__PURE__ */ new WeakMap(), Ps = /* @__PURE__ */ new WeakMap();
function Fs(e, t) {
	let n = e ?? {};
	return t && Object.keys(t).length > 0 && Ps.set(n, t), n;
}
function Is(e, t = {}) {
	let n = Ns.get(t) ?? (() => {
		let e = /* @__PURE__ */ new Map();
		return Ns.set(t, e), e;
	})(), r = e ?? "\0null", i = n.get(r);
	if (i !== void 0) return i;
	let a = Ls(e, t, Ps.get(t));
	return n.set(r, a), a;
}
function Ls(e, t, n = {}) {
	if (!e) return js(null);
	let i = `"${((e) => e.replace(/"/g, "\\\""))(e)}"`, a = e.toLowerCase(), o = E(e);
	if (Os(e)) return Ds.has(a) ? `${i}, "Noto Naskh Arabic", "Noto Sans Arabic", "Noto Serif", "Noto Sans JP", "Hiragino Sans", serif` : `${i}, "Noto Sans Arabic", "Noto Naskh Arabic", "Noto Sans JP", "Hiragino Sans", sans-serif`;
	let s = t[e];
	if (s && s !== "auto") switch (s) {
		case "roman": return `${i}, ${Ms(o)}`;
		case "swiss": return `${i}, ${js(o)}`;
		case "modern":
			if (n[e] === "fixed") return o == null ? `${i}, "Courier New", monospace` : `${i}, ${ks([...o === "jp" ? [
				"Yu Gothic",
				"YuGothic",
				"Hiragino Sans",
				"Meiryo",
				"Noto Sans JP"
			] : r(o, "sans"), "Courier New"])}, monospace`;
			break;
		default: break;
	}
	let c = u(e);
	if (c === "serif") return `${i}, ${Ms(o)}`;
	if (c === "mono") return `${i}, "Courier New", monospace`;
	if (o == null || o === "jp") {
		if (a.includes("meiryo") || e.includes("メイリオ")) return `${i}, "Meiryo UI", "Meiryo", ${js(o)}`;
		if (e.includes("游ゴシック") || /\byu\s*gothic\b/i.test(e) || a.includes("yugothic")) return `${i}, "Yu Gothic", "YuGothic", ${js(o)}`;
		if (a.includes("ipa")) return `${i}, "IPAexGothic", ${js(o)}`;
		if (a.includes("segoe")) return `${i}, "Segoe UI", ${ks([...As, ...d])}, sans-serif`;
	}
	return `${i}, ${js(o)}`;
}
function Rs(e, t, n, r, i = {}, a) {
	return a ? st(a, n, e ? 700 : 400, t ? "italic" : "normal") : `${t ? "italic" : "normal"} ${e ? "bold" : "normal"} ${n}px ${Is(r, i)}`;
}
function zs(e, t, n = !1) {
	return Math.max(de(e.fontFamily, t, n), (e.resolvedLineHeightRatio ?? 0) * t);
}
function Bs(e, t, n = !1) {
	return Math.max(de(e.eaFloorFamily, t, n), (e.resolvedEaFloorLineHeightRatio ?? 0) * t);
}
function Vs(e) {
	for (let t of e.runs) if (t.type === "text" || t.type === "field") return t.fontSize;
	return typeof e.defaultFontSize == "number" ? e.defaultFontSize : 10;
}
function Hs(e, t = !1) {
	for (let t of e.runs) if (t.type === "text" || t.type === "field") return t.fontFamily;
	return t && e.defaultFontFamilyEastAsia ? e.defaultFontFamilyEastAsia : e.defaultFontFamily ?? null;
}
function Us(e, t, n) {
	return de(Hs(e, n), Vs(e) * t, n);
}
function Ws(e, t) {
	return !e || e.charSpacePt == null || e.type !== "linesAndChars" && e.type !== "snapToChars" ? 0 : e.charSpacePt * t;
}
function Gs(e) {
	let t = 0;
	for (let n of e) ji.test(n) && t++;
	return t;
}
function Ks(e, t, n) {
	let r = Ws(t, n);
	if (r === 0 || e.length === 0) return 0;
	let i = [...e];
	return t?.type === "linesAndChars" || Gs(e) === i.length ? i.length * r : 0;
}
function qs(e, t, n) {
	return e.snapToCharacterGrid === !1 || t?.type === "snapToChars" ? 0 : t?.type === "linesAndChars" && e.widthBalanceGridDeltaFactor !== void 0 ? Ws(t, n) * e.widthBalanceGridDeltaFactor : Ks(e.text, t, n) === 0 ? 0 : Ws(t, n);
}
function Js(e, t) {
	return e.fitTextPerGapPx === void 0 ? Ys(e) * t : e.fitTextPerGapPx;
}
function Ys(e) {
	return e.charSpacing ?? 0;
}
function Xs(e) {
	return e.punctuationCompressions?.reduce((e, t) => e + t.adjustmentPt, 0) ?? 0;
}
function Zs(e, t) {
	return Qs(e, e.text, t);
}
function Qs(e, t, n) {
	if (e.fitTextPerGapPx !== void 0 || e.tateChuYoko || !$o(n?.type) || !e.widthBalanceSpaceSequence || e.widthBalanceSpaceAdjustmentPt === void 0) return 0;
	let r = 0;
	for (let e of t) e === " " && (r += 1);
	return r * e.widthBalanceSpaceAdjustmentPt;
}
function $s(e, t, n) {
	let r = e.punctuationCompressions?.filter((e) => e.end > t && e.end <= n).map((e) => Object.freeze({
		end: e.end - t,
		adjustmentPt: e.adjustmentPt
	}));
	return r && r.length > 0 ? Object.freeze(r) : void 0;
}
function ec(e, t, n) {
	let r = e.noBreakRanges?.filter((e) => e.start >= t && e.end <= n).map((e) => Object.freeze({
		start: e.start - t,
		end: e.end - t
	}));
	return r && r.length > 0 ? Object.freeze(r) : void 0;
}
function tc(e) {
	return new Set(e.noBreakRanges?.flatMap((e) => [e.start, e.end]) ?? []);
}
function nc(e, t, n = 0) {
	let r = tc(e);
	return [
		0,
		...O(e.text),
		e.text.length
	].filter((e, t, n) => n.indexOf(e) === t).filter((e) => e >= n && e <= t && !r.has(e)).at(-1) ?? 0;
}
function rc(e) {
	if (e.hardJoinPrev !== !0 || e.text.length === 0) return;
	let t = tc(e);
	return [...O(e.text), e.text.length].find((e) => e > 0 && !t.has(e)) ?? e.text.length;
}
function q(e, t, n) {
	return {
		punctuationCompressions: $s(e, t, n),
		noBreakRanges: ec(e, t, n),
		externalLinkBreakOffsets: ic(e, t, n)
	};
}
function ic(e, t, n) {
	let r = e.externalLinkBreakOffsets?.filter((e) => e > t && e < n).map((e) => e - t);
	return r && r.length > 0 ? Object.freeze(r) : void 0;
}
function ac(e, t) {
	if (!e.textLayoutService || !e.textShapeRequest || t.length === 0) return;
	let n = e.textLayoutService.shape({
		...e.textShapeRequest,
		text: t,
		measure: !0,
		clusterGeometry: !1
	});
	if (n.horizontalInkBoundsAreTight !== !0 || !n.inkBounds || !Number.isFinite(n.advancePt) || !Number.isFinite(n.inkBounds.xMinPt) || !Number.isFinite(n.inkBounds.xMaxPt)) return;
	let r = e.charScale ?? 1;
	return {
		advancePt: n.advancePt * r,
		xMinPt: n.inkBounds.xMinPt * r,
		xMaxPt: n.inkBounds.xMaxPt * r
	};
}
function oc(e) {
	if (!e.textLayoutService || !e.textShapeRequest || e.text.length === 0) return;
	let t = e.textLayoutService.shape({
		...e.textShapeRequest,
		text: e.text,
		measure: !0,
		clusterGeometry: !0
	});
	if (!t.clusters?.length) return;
	let n = e.charScale ?? 1, r = /* @__PURE__ */ new Map();
	for (let e of t.clusters) {
		if (!Number.isFinite(e.advancePt)) return;
		r.set(e.range.end, e.advancePt * n);
	}
	return r;
}
function sc(e) {
	let t, n = /* @__PURE__ */ new Map();
	for (let r of e) {
		if (!("text" in r) || r.verticalRun) {
			t = void 0;
			continue;
		}
		let e = r, i = e.punctuationCompressions ?? [], a = new Map(i.map((e, t) => [e.end, t])), o = i.length > 0 ? oc(e) : void 0, s = [
			0,
			...O(e.text),
			e.text.length
		];
		for (let r = 0; r < s.length - 1; r += 1) {
			let i = s[r], c = s[r + 1];
			if (c <= i) continue;
			let l = a.get(c), u = t || l !== void 0 ? ac(e, e.text.slice(i, c)) : void 0;
			if (t && u) {
				let e = n.get(t.segment) ?? t.segment.punctuationCompressions.map((e) => ({ ...e })), r = e[t.compressionIndex], i = Math.max(0, t.ink.advancePt + r.adjustmentPt), a = Math.min(0, i - t.contextualAdvancePt), o = Math.min(0, t.ink.xMaxPt - u.xMinPt - t.contextualAdvancePt), s = Math.max(r.adjustmentPt, a, o);
				s !== r.adjustmentPt && (e[t.compressionIndex] = {
					end: r.end,
					adjustmentPt: s
				}, n.set(t.segment, e));
			}
			t = l !== void 0 && u ? {
				segment: e,
				compressionIndex: l,
				ink: u,
				contextualAdvancePt: o?.get(c) ?? u.advancePt
			} : void 0;
		}
	}
	for (let [e, t] of n) e.punctuationCompressions = Object.freeze(t.map((e) => Object.freeze(e)));
}
function cc(e) {
	return e.charScale ?? 1;
}
function lc(e, t, n, r, i) {
	return e * r + [...t].length * n + [...t].length * i;
}
function uc(e, t, n) {
	return e.fitTextPerGapPx === void 0 ? qs(e, t, n) + Js(e, n) : e.fitTextPerGapPx;
}
function dc(e, t, n, r) {
	if (e.fitTextPerGapPx !== void 0) {
		let n = [...e.text].length, r = e.fitTextRegionEnd ? Math.max(0, n - 1) : n;
		return t * cc(e) + r * e.fitTextPerGapPx + (e.fitTextTrailingPadPx ?? 0);
	}
	if (e.tateChuYoko) return e.fontSize * r;
	let i = qs(e, n, r);
	return lc(t, e.text, i, cc(e), Js(e, r)) + Zs(e, n) * r * cc(e) + Xs(e) * r;
}
function fc(e, t) {
	return t?.type !== "snapToChars" || !t.characterPitchPt || t.characterPitchPt <= 0 || e.snapToCharacterGrid === !1 || e.metricOnly || e.fitTextRegionIndex !== void 0 || e.tateChuYoko ? null : e.script === "eastAsia" ? "eastAsia" : e.script === "complexScript" ? "complexScript" : "latin";
}
function pc(e, t, n, r = 1) {
	return !(n > 0) || !Number.isFinite(e) ? e : t === "eastAsia" ? Math.max(1, r) * n : Math.max(1, Math.ceil(Math.max(0, e) / n - 1e-9)) * n;
}
function mc(e) {
	return !e || !e.linePitchPt || e.linePitchPt <= 0 ? !1 : e.type === "lines" || e.type === "linesAndChars" || e.type === "snapToChars";
}
function hc(e, t) {
	return gs(e, t);
}
function gc(e, t) {
	return _s(e, t);
}
function _c(e, t, n, r, i, a, o = 0, s = !1, c, l) {
	let u = t + n, d = Math.max(u, o), f = mc(i), p = f ? i.linePitchPt * r : 0, m = () => s ? a ? Math.max(p, Math.ceil(u / p) * p) : hc(c ?? (o > 0 ? o : l === void 0 ? p : gc(0, l)), p) * p : Math.max(u, p), h = e !== null && e.explicit !== !0;
	if (!e || bs(e.rule, e.value)) return f ? m() : d;
	if (e.rule === "auto") {
		if (f) {
			if (h) {
				let t = m();
				return s ? vs(t, p, e.value) : t;
			}
			return Math.max(u, p * e.value);
		}
		return d * e.value;
	}
	if (e.rule === "exact") return e.value * r;
	if (e.rule === "atLeast") {
		let t = f ? a || h ? m() : p : 0;
		return ys(d, e.value * r, t);
	}
	return d;
}
function vc(e, t) {
	return {
		asc: e * t * .8,
		desc: e * t * .2
	};
}
function yc(e, t, n, r, i = !1) {
	return ge(t, r, e.fontBoundingBoxAscent ?? e.actualBoundingBoxAscent ?? n * .8, e.fontBoundingBoxDescent ?? e.actualBoundingBoxDescent ?? n * .2, i);
}
function bc(e, t, n, r, i = !1, a, o = {}, s = e.lineSpacing, c = {}, l, u, d = !1) {
	let f = u, p = i || f?.fontHint === "eastAsia", m = f?.complexScript === !0, h = f?.fontSizePt ?? Vs(e), g = Hs(e, p), _ = g ? c[vn(g)] : void 0, v = _?.family ?? g, y, b;
	if (l) {
		let n = f ? f.weight >= 600 : !1, r = f?.style === "italic", i = f?.fonts.ascii ?? e.defaultFontFamily ?? g, a = l.shape({
			text: p ? "あ" : "x",
			fontSizePt: h * t,
			fonts: f?.fonts ?? {
				ascii: i,
				highAnsi: i,
				eastAsia: e.defaultFontFamilyEastAsia ?? i,
				complexScript: i
			},
			themeFonts: f?.themeFonts,
			themeFontPresence: f?.themeFontPresence,
			weight: n ? 700 : 400,
			style: r ? "italic" : "normal",
			complexScript: m,
			fontHint: f?.fontHint,
			eastAsiaLanguage: f?.eastAsiaLanguage,
			kerning: f?.kerning,
			measure: !0
		}), o = a.spans[0]?.font.resolvedFamily ?? g;
		({ascent: y, descent: b} = yc({
			width: a.advancePt,
			actualBoundingBoxAscent: a.ascentPt,
			actualBoundingBoxDescent: a.descentPt,
			fontBoundingBoxAscent: a.ascentPt,
			fontBoundingBoxDescent: a.descentPt
		}, o, h * t, h * t, p));
	} else if (a) {
		let e = a.font;
		a.font = Rs(!1, !1, h * t, v, o);
		let n = a.measureText(p ? "あ" : "x");
		a.font = e, {ascent: y, descent: b} = yc(n, v, h * t, h * t, p);
	} else ({asc: y, desc: b} = vc(h, t));
	let x = _?.lineHeightRatio == null ? Us(e, t, p) : h * t * _.lineHeightRatio, S = Math.max(x, hs(g, h * t, p)), C = i ? gc(S, h * t) : void 0, w = _c(s, y, b, t, n, r, S, i, C), T = d && i && mc(n), E = T ? _c(null, y, b, t, n, r, S, i, C) : w, D = T ? _c({
		rule: "atLeast",
		value: 0,
		explicit: !0
	}, y, b, t, n, r, S, i, C) : w;
	return {
		advancePx: d ? Zo({
			ordinaryAdvancePx: w,
			allocatedGridAdvancePx: E,
			atLeastZeroAdvancePx: D,
			lineSpacing: s,
			gridAllocationActive: T,
			scale: t
		}) : w,
		ascentPx: y,
		descentPx: b
	};
}
function xc(e, t, n, r, i = !1, a, o = {}, s = e.lineSpacing, c = {}, l, u, d = !1) {
	return bc(e, t, n, r, i, a, o, s, c, l, u, d).advancePx;
}
function Sc(e, t, n) {
	return Math.max(0, (e - t + n) / 2);
}
function Cc(e, t, n, r, i, a, o, s = {}, c, l, u = !1) {
	let d = bc(e, 1, t, n, r, i, a, o, s, c, l, u);
	return Sc(d.advancePx, d.ascentPx, d.descentPx);
}
function wc(e) {
	let t = [];
	for (let n of e) {
		let e = n.toLowerCase() === n && n.toUpperCase() !== n, r = /\s/.test(n) ? t[t.length - 1]?.reduced ?? !1 : e, i = t[t.length - 1];
		i && i.reduced === r ? i.text += n : t.push({
			text: n,
			reduced: r
		});
	}
	return t.length ? t : [{
		text: e,
		reduced: !1
	}];
}
function Tc(e, t) {
	for (let n = t - 1; n >= 0; n--) {
		let t = e[n];
		if (t.type === "text" || t.type === "field") return t.fontSize;
	}
	for (let n = t + 1; n < e.length; n++) {
		let t = e[n];
		if (t.type === "text" || t.type === "field") return t.fontSize;
	}
	return 10;
}
function Ec(e, t) {
	if (e.fieldType === "page") return Wt(t.displayPageNumber ?? t.pageIndex + 1, un(e.instruction) ?? t.pageNumberFormat ?? "decimal");
	if (e.fieldType === "numPages") {
		let n = un(e.instruction) ?? "decimal";
		return Wt(t.totalPages, n);
	}
	if (e.fieldType === "date" || e.fieldType === "time") {
		let n = gn(e.instruction);
		if (n) {
			let e = _n(n, new Date(t.currentDateMs ?? Date.now()));
			if (e !== null) return e;
		}
		return e.fallbackText;
	}
	return e.fallbackText;
}
function Dc(e) {
	for (let t = 0; t < e.length;) {
		let n = e.codePointAt(t);
		if (be(n)) return !0;
		t += n > 65535 ? 2 : 1;
	}
	return !1;
}
var Oc = new Set([
	"、",
	"。",
	"，",
	"．",
	"」",
	"』",
	"】",
	"）",
	"］",
	"｝"
]);
function kc(e) {
	let t = e.codePointAt(0);
	return t === void 0 ? !1 : t >= 12353 && t <= 12438 || t >= 12445 && t <= 12447 || t >= 12449 && t <= 12538 || t === 12540 || t >= 12541 && t <= 12543 || t >= 12784 && t <= 12799 || t >= 110576 && t <= 110591 || t >= 110592 && t <= 110959;
}
function Ac(e, t) {
	switch (t) {
		case "compressPunctuation": return Oc.has(e);
		case "compressPunctuationAndJapaneseKana": return Oc.has(e) || kc(e);
		default: return !1;
	}
}
function jc(e, t) {
	if (e === void 0) return;
	let n = [];
	for (let r of e) r > t && n.push(r - t);
	return n;
}
function Mc(e, t, n = Infinity) {
	if (t <= 0 || n <= 0 || Number.isFinite(n) && e[t - 1] === "　") return t;
	let r = t, i = n;
	for (; r < e.length && e[r] === "　" && i > 0;) r++, i--;
	return r;
}
function Nc(e) {
	let t = [...e];
	for (let e = t.length - 1; e >= 0; --e) if (t[e] !== "　") return ji.test(t[e]);
	return !1;
}
function Pc(e, t, n, r = 0, i = 1, a = 0, o = !1, s, c, l = Infinity) {
	let u = [...t], d = (t) => c?.(t) ?? (() => {
		let n = 0;
		if (o) {
			if (!s) throw Error("Vertical glyph measurement capability is required for vertical text");
			n = s.measureRunInkExtra(t);
		}
		return lc(e.measureText(t).width + n, t, r, i, a);
	})(), f = (e) => {
		let t = e, r = l;
		if (r > 0) {
			for (; t > 0 && u[t - 1] === "　";) t--;
			let n = e - t;
			t += Math.max(0, n - r);
		}
		return d(u.slice(0, t).join("")) <= n;
	}, p = 0, m = u.length;
	for (; p < m;) {
		let e = p + m + 1 >> 1;
		f(e) ? p = e : m = e - 1;
	}
	return u.slice(0, p).join("");
}
var Fc = new Set([
	"ar",
	"fa",
	"ur",
	"he",
	"iw",
	"yi",
	"ji",
	"ps",
	"sd",
	"ug",
	"dv",
	"syr",
	"ckb"
]);
function Ic(e, t) {
	if (e) {
		let t = e.split("-")[0].toLowerCase();
		if (Fc.has(t)) return !0;
	}
	return t;
}
function Lc(e) {
	let t = [], n = null, r = "";
	for (let i of e) {
		let e = be(i.codePointAt(0));
		n === null || e === n ? (n = e, r += i) : (t.push({
			text: r,
			ea: n
		}), n = e, r = i);
	}
	return r.length > 0 && t.push({
		text: r,
		ea: n ?? !1
	}), t;
}
function Rc(e) {
	let t = (e) => e >= 48 && e <= 57, n = (e) => e === "." || e === "," || e === ":" || e === "/" || e === "\xA0", r = [], i = "", a = null;
	for (let o = 0; o < e.length; o++) {
		let s = e[o], c = t(s.charCodeAt(0));
		!c && a === !0 && n(s) && t(e.charCodeAt(o + 1)) && (c = !0), a === null || c === a ? i += s : (r.push(i), i = s), a = c;
	}
	return i.length > 0 && r.push(i), r.length ? r : [e];
}
function zc(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = n;
		for (; r < e.length && e[r] !== " ";) r++;
		for (; r < e.length && e[r] === " ";) r++;
		r > n && t.push(e.slice(n, r)), n = r;
	}
	return t.length ? t : [e];
}
var Bc = .25;
function Vc(e) {
	let t = e?.defaultTabStop;
	return t != null && t > 0 ? t : 36;
}
function Hc(e) {
	return e === "center" ? "center" : e === "decimal" ? "decimal" : e === "right" || e === "end" ? "trailing" : "leading";
}
function Uc(e, t, n, r, i) {
	let a = e.length, o = e.map((e) => e.width), s = Array(a).fill(void 0), c = (t, n) => {
		let r = 0, i;
		for (let n = t; n < a && !e[n].isTab; n++) i === void 0 && e[n].decimalOffset !== void 0 && (i = r + e[n].decimalOffset), r += o[n];
		return {
			total: r,
			alignment: n === "center" ? r / 2 : n === "trailing" ? r : n === "decimal" ? i === void 0 ? 0 : r - i : 0
		};
	}, l = n;
	for (let n = 0; n < a; n++) {
		if (!e[n].isTab) {
			l += o[n];
			continue;
		}
		let a = Ni(l, t, i);
		if (!a) {
			o[n] = 0;
			continue;
		}
		let u = Hc(a.alignment), d = c(n + 1, u), f = d.total, p;
		p = u === "leading" ? a.pos : a.pos - d.alignment, p + f > r && (p = r - f), p < l && (p = l), o[n] = p - l, s[n] = a.leader, l = p;
	}
	return e.map((e, t) => ({
		width: o[t],
		leader: s[t]
	}));
}
function Wc(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let t of e) {
		if (t.fitTextRegionIndex === void 0) continue;
		let e = r.get(t.fitTextRegionIndex) ?? [];
		e.push(t), r.set(t.fitTextRegionIndex, e);
	}
	for (let e of r.values()) {
		let r = e.find((e) => e.fitTextVal !== void 0);
		if (!r || r.fitTextVal === void 0) continue;
		let i = 0, a = 0;
		for (let t of e) i += n(t) * cc(t), a += [...t.text].length;
		let o = Wi([{
			fitTextValTwips: r.fitTextVal,
			charCount: a,
			naturalWidthPx: i
		}], t)[0];
		o && e.forEach((t, n) => {
			t.fitTextPerGapPx = o.perGapPx, t.fitTextTrailingPadPx = n === e.length - 1 ? o.trailingPadPx : void 0, t.fitTextRegionStart = n === 0 ? !0 : void 0, t.fitTextRegionEnd = n === e.length - 1 ? !0 : void 0;
		});
	}
}
function Gc(e, t) {
	let n = [], r = (e, n = 400, r = "normal") => {
		if (!e) return;
		let i = vn(e), a = t.resolvedLocalFonts;
		if (!a) return;
		let o = a[`${i}:${n}:${r}`];
		if (o) return o;
		let s = a[i];
		return n === 400 && r === "normal" && s ? s : Object.values(a).find((e) => vn(e.requestedFamily ?? "") === i && (e.weight ?? 400) === n && (e.style ?? "normal") === r);
	}, a = /* @__PURE__ */ new Map(), o = [];
	for (let [t, n] of e.entries()) {
		if (n.type !== "text") {
			o.push({
				charCount: 0,
				naturalWidthPx: 0
			});
			continue;
		}
		let e = n.text.split("	");
		for (let r = 0; r < e.length; r += 1) a.set(`${t}:${r}`, o.length), o.push({
			fitTextValTwips: n.fitTextVal,
			fitTextId: n.fitTextId,
			charCount: [...e[r]].length,
			naturalWidthPx: 0,
			charScale: n.charScale
		}), r < e.length - 1 && o.push({
			charCount: 0,
			naturalWidthPx: 0
		});
	}
	let s = /* @__PURE__ */ new Map();
	Wi(o, 1).forEach((e, t) => {
		for (let n = e.start; n < e.end; n += 1) s.set(n, t);
	});
	let c = (e, i, o, c, l, u = !1) => {
		let d = i, f = d.typographyInput, p = (e, t) => e?.status === "valid" && e.value !== null ? e.value : t, m = p(f?.verticalAlign, o ?? void 0) ?? null, h = p(f?.positionPt, d.position), g = f?.characterSpacingPt ?? d.charSpacing, _ = rs(g), v = f?.characterScale ?? d.charScale, y = f?.kerningThresholdPt ?? d.kerning, b = f?.snapToGrid ?? d.snapToGrid, x = !1, S = d.ruby, C = S ? {
			text: S.text,
			fontSizePt: S.fontSizePt,
			...S.hpsRaisePt == null ? {} : { hpsRaisePt: S.hpsRaisePt }
		} : void 0, w = d.revision, T = d.rtl === !0 ? !0 : void 0, E = l === void 0 ? void 0 : a.get(`${c}:${l}`), D = E === void 0 ? void 0 : s.get(E), k = d.hyperlink ? {
			kind: "external",
			url: d.hyperlink
		} : d.hyperlinkAnchor ? {
			kind: "internal",
			ref: d.hyperlinkAnchor
		} : void 0, A = d.rtl === !0 || d.cs === !0, j = d.fontSizeCs ?? i.fontSize, M = d.fontFamilyCs ?? i.fontFamily, N = d.fontFamilyHighAnsi ?? i.fontFamily, ee = d.boldCs ?? !1, te = d.italicCs ?? !1, P = d.fontFamilyEastAsia ?? i.fontFamily, ne = (A || !!d.rtl) && Ic(d.langBidi, !!d.rtl), re = !0, ie = !1, ae = (e, a, o, s, c = !1, l = !1) => {
			if (t.balanceSingleByteDoubleByteWidth && !a && e.includes("　") && [...e].some((e) => e !== "　")) {
				for (let t of e.split(/(\u3000+)/u).filter(Boolean)) ae(t, a, o, void 0, c, l);
				return;
			}
			if (!c && _ && D === void 0) {
				let n = [
					0,
					...O(e),
					e.length
				];
				if (n.slice(0, -1).map((t, r) => e.slice(t, n[r + 1])).some((e) => Ac(e, t.characterSpacingControl))) {
					ae(e, a, o, void 0, !0, l);
					return;
				}
			}
			let f = a ? ee : i.bold, p = a ? te : i.italic, S = f ? 700 : 400, A = p ? "italic" : "normal", F = Object.freeze({
				text: e,
				fontSizePt: a ? j : i.fontSize,
				fonts: l ? {
					ascii: null,
					highAnsi: null,
					eastAsia: null,
					complexScript: null
				} : d.fontSlots?.direct ?? {
					ascii: i.fontFamily,
					highAnsi: N,
					eastAsia: P,
					complexScript: M
				},
				themeFonts: l ? void 0 : d.fontSlots?.theme,
				themeFontPresence: l ? void 0 : d.fontSlots?.themePresent,
				weight: S,
				style: A,
				complexScript: a,
				fontHint: d.fontHint,
				eastAsiaLanguage: d.langEastAsia,
				kerning: y == null ? void 0 : (a ? j : i.fontSize) >= y,
				measure: !1
			}), oe = s ? { spans: [s] } : t.layoutServices?.text.shape(F), se = c && _ ? (() => {
				let n = [
					0,
					...O(e),
					e.length
				], r = [];
				for (let i = 0; i < n.length - 1; i += 1) {
					let a = n[i], o = n[i + 1], s = e.slice(a, o);
					if (!Ac(s, t.characterSpacingControl)) continue;
					let c = t.layoutServices?.text.shape({
						...F,
						text: s,
						measure: !0,
						clusterGeometry: !1
					}), l = (c?.inkBounds && c.horizontalInkBoundsAreTight === !0 ? (() => {
						let e = Math.max(0, Math.min(c.advancePt, c.advancePt - c.inkBounds.xMaxPt));
						if (!Oc.has(s)) return e;
						let n = c.spans[0]?.fontRoute.fingerprint, r = t.layoutServices?.text.shape({
							...F,
							text: "一",
							fontHint: "eastAsia",
							measure: !0,
							clusterGeometry: !1
						}), i = r?.spans[0]?.fontRoute.fingerprint, a = r?.advancePt;
						if (!n || i !== n || a === void 0 || !Number.isFinite(a) || a <= 0) return 0;
						let o = ns({
							punctuationAdvancePt: c.advancePt,
							punctuationInkEndPt: c.inkBounds.xMaxPt,
							ideographicCellAdvancePt: a
						});
						return Math.max(0, Math.min(e, c.advancePt - o));
					})() : 0) * (v ?? 1);
					l > 0 && r.push({
						end: o,
						adjustmentPt: -l
					});
				}
				return r.length === 0 ? void 0 : Object.freeze(r.map((e) => Object.freeze(e)));
			})() : void 0, ce = oe?.spans.some((e) => e.script === "complexScript" !== a) ?? !1;
			if (oe && (oe.spans.length > 1 || ce)) {
				for (let e = 0; e < oe.spans.length; e += 1) {
					let n = oe.spans[e], r = n.script === "complexScript", a = r ? M : n.script === "eastAsia" ? P : n.script === "highAnsi" ? N : i.fontFamily, o = _ && c && [...n.text].some((e) => Ac(e, t.characterSpacingControl));
					ae(n.text, r, a, n, o);
				}
				return;
			}
			let le = oe?.spans[0], ue = (e, n) => {
				if (!e) return;
				let r = Object.values(t.layoutServices?.text.localMetrics ?? {}).filter((t) => vn(t.family) === vn(e) && (t.weight ?? 400) === S && (t.style ?? "normal") === A);
				return r.find((e) => n && vn(e.requestedFamily ?? "") === vn(n)) ?? r[0];
			}, de = le ? ue(le.font.resolvedFamily, le.font.requestedFamily) : r(o, S, A), fe = t.layoutServices?.text.resolve({
				fonts: F.fonts,
				themeFonts: F.themeFonts,
				themeFontPresence: F.themeFontPresence,
				slot: "eastAsia",
				weight: S,
				style: A
			}), pe = fe ? ue(fe.resolvedFamily, fe.requestedFamily) : r(P, S, A), me = de ?? (o ? t.resolvedLocalFonts?.[vn(o)] : void 0), he = pe ?? (P ? t.resolvedLocalFonts?.[vn(P)] : void 0), ge = fe?.resolvedFamily ?? pe?.family ?? P, _e = t.useFeLayout && (d.fontHint === "eastAsia" || !!ge?.trim()), ve = le?.script ?? s?.script ?? (a ? "complexScript" : ji.test(e) ? "eastAsia" : "ascii"), ye = t.balanceSingleByteDoubleByteWidth ? ts(e, ve) : void 0;
			n.push({
				text: e,
				script: ve,
				...ye === void 0 ? {} : { widthBalanceGridDeltaFactor: ye },
				..._e ? { metricEastAsian: !0 } : {},
				bold: f,
				italic: p,
				underline: i.underline,
				underlineStyle: d.underlineStyle,
				underlineColor: d.underlineColor,
				strikethrough: i.strikethrough,
				fontSize: a ? j : i.fontSize,
				color: i.color,
				fontFamily: le?.font.resolvedFamily ?? de?.family ?? o,
				fontRoute: le?.fontRoute,
				resolvedLineHeightRatio: me?.lineHeightRatio,
				vertAlign: m,
				measuredWidth: 0,
				textLayoutService: t.layoutServices?.text,
				textShapeRequest: F,
				breakBefore: le?.breakBefore ?? s?.breakBefore ?? !0,
				smallCaps: x,
				joinPrev: re && (d.noBreakBefore === !0 || u) || ie || s?.breakBefore === !1 ? !0 : void 0,
				hardJoinPrev: re && (d.noBreakBefore === !0 || u) ? !0 : void 0,
				doubleStrikethrough: i.doubleStrikethrough ?? !1,
				highlight: i.highlight ?? null,
				emphasisMark: i.emphasisMark,
				background: i.background ?? null,
				colorAuto: d.colorAuto ?? !1,
				border: d.border ?? null,
				ruby: re ? C : void 0,
				revision: w,
				...w && t.showTrackedChanges === !0 ? { trackChangesMarkup: {
					kind: w.kind,
					authorColor: t.revisionAuthorColor?.(w.author) ?? "#C00000"
				} } : {},
				rtl: T,
				digitsAsAN: ne ? !0 : void 0,
				eaFloorFamily: ge,
				eaFloorRoute: fe?.route,
				resolvedEaFloorLineHeightRatio: he?.lineHeightRatio,
				textBoxLineFloor: d.textBoxLineFloor,
				textBoxVertical: d.textBoxVertical,
				hyperlink: k,
				snapToCharacterGrid: b !== !1,
				charSpacing: g,
				punctuationCompressions: se,
				eastAsiaLanguage: d.langEastAsia,
				charScale: v,
				fitTextVal: D === void 0 ? void 0 : d.fitTextVal,
				fitTextId: D === void 0 ? void 0 : d.fitTextId,
				fitTextRegionIndex: D,
				fitTextRunIndex: D === void 0 ? void 0 : E,
				position: h,
				positionExtendsLineBox: t.positionExtendsLineBox !== !1,
				kerning: y,
				tateChuYoko: t.verticalCJK && d.eastAsianVert === !0 ? !0 : void 0,
				tateChuYokoCompress: t.verticalCJK && d.eastAsianVert === !0 && d.eastAsianVertCompress === !0 ? !0 : void 0,
				verticalRun: t.verticalCJK && d.eastAsianVert !== !0 ? !0 : void 0
			}), re = !1, ie = !1;
		}, F = (e, t) => {
			let n = t === "cs", r = t === "cs" ? M : t === "ea" ? P : i.fontFamily;
			if (ke(r)) {
				for (let t of Me(e, r)) ae(t.text, n, t.mapped ? null : r, void 0, !1, t.mapped);
				return;
			}
			ae(e, n, r);
		}, oe = (e) => {
			if (t.layoutServices?.text) {
				if (ke(i.fontFamily)) {
					F(e, "latin");
					return;
				}
				ae(e, !1, i.fontFamily);
				return;
			}
			for (let t of Lc(e)) F(t.text, t.ea ? "ea" : "latin");
		}, se = i.smallCaps ? wc(e) : [{
			text: e,
			reduced: !1
		}], ce = "";
		for (let e of se) {
			x = e.reduced, ie = ce.length > 0 && !/\s$/.test(ce), ce = e.text;
			let t = i.allCaps || i.smallCaps ? e.text.toUpperCase() : e.text;
			for (let e of zc(t)) if (A) if (ne) for (let t of Rc(e)) F(t, "cs");
			else F(e, "cs");
			else oe(e);
		}
	}, l = !1;
	for (let [i, a] of e.entries()) {
		let o = a.revision?.kind;
		if (t.showTrackedChanges !== !0 && (o === "deletion" || o === "moveFrom")) continue;
		let s = l;
		l = a.type === "text" && a.noBreakAfter === !0;
		let u = n.length;
		if (a.type === "text") {
			let e = a, r = e.noteRef ? e.noteRef.id ? t.noteNumbers?.get(`${e.noteRef.kind}:${e.noteRef.id}`) : t.noteReferenceNumber : void 0;
			if (e.noteRef) {
				let t = r == null ? e.text || "" : String(r);
				t.length > 0 && c(t, e, e.vertAlign ?? "super", i, 0, s);
				for (let e = u; e < n.length; e += 1) n[e].sourceRunIndex = i;
				continue;
			}
			let o = e.text.split("	");
			for (let t = 0; t < o.length; t++) o[t].length > 0 && c(o[t], e, e.vertAlign, i, t, t === 0 && s), t < o.length - 1 && n.push({
				isTab: !0,
				fontSize: e.fontSize,
				measuredWidth: 0,
				bold: e.bold,
				italic: e.italic,
				sourceRunIndex: i
			});
		} else if (a.type === "image") {
			let e = a;
			n.push({
				imagePath: e.imagePath,
				mimeType: e.mimeType,
				widthPt: e.widthPt,
				heightPt: e.heightPt,
				rotation: e.rotation,
				flipH: e.flipH,
				flipV: e.flipV,
				anchor: e.anchor ?? !1,
				anchorXPt: e.anchorXPt ?? 0,
				anchorYPt: e.anchorYPt ?? 0,
				anchorXFromMargin: e.anchorXFromMargin ?? !1,
				anchorYFromPara: e.anchorYFromPara ?? !1,
				colorReplaceFrom: e.colorReplaceFrom,
				duotone: e.duotone,
				alpha: e.alpha,
				srcRect: e.srcRect ?? void 0,
				measuredWidth: 0
			});
		} else if (a.type === "chart") {
			let e = a;
			n.push({
				imagePath: "",
				mimeType: "",
				widthPt: e.widthPt,
				heightPt: e.heightPt,
				anchor: e.anchor ?? !1,
				anchorXPt: e.anchorXPt ?? 0,
				anchorYPt: e.anchorYPt ?? 0,
				anchorXFromMargin: e.anchorXFromMargin ?? !1,
				anchorYFromPara: e.anchorYFromPara ?? !1,
				chart: !0,
				chartResourceKey: e.resourceKey,
				measuredWidth: 0
			});
		} else if (a.type === "shape" && a.inline === !0) n.push({
			imagePath: "",
			mimeType: "",
			widthPt: a.widthPt,
			heightPt: a.heightPt,
			anchor: !1,
			anchorXPt: 0,
			anchorYPt: 0,
			anchorXFromMargin: !1,
			anchorYFromPara: !1,
			inlineShape: !0,
			measuredWidth: 0
		});
		else if (a.type === "unavailableDrawing") {
			let e = "anchorAcquisitionInput" in a ? a.anchorAcquisitionInput : void 0;
			n.push({
				imagePath: "",
				mimeType: "",
				widthPt: a.widthPt,
				heightPt: a.heightPt,
				anchor: e !== void 0,
				anchorXPt: 0,
				anchorYPt: 0,
				anchorXFromMargin: !1,
				anchorYFromPara: !1,
				unavailableResourceKind: a.resourceKind,
				measuredWidth: 0
			});
		} else if (a.type === "break") {
			if (a.breakType === "line") {
				let t = Tc(e, e.indexOf(a));
				n.push({
					lineBreak: !0,
					fontSize: t,
					measuredWidth: 0
				});
			}
		} else if (a.type === "field") {
			let e = a, n = Ec(e, t);
			n && c(n, e, e.vertAlign, i, void 0, s);
		} else if (a.type === "math") {
			let r = a.fontSize || Tc(e, e.indexOf(a)), i = "resourceKey" in a ? a.resourceKey : void 0;
			if (t.layoutServices && !i) throw Error("Service-backed math layout requires a normalized structural resource key");
			let o = i ? t.layoutServices?.math.resolve(i) : void 0;
			n.push({
				math: !0,
				mathResourceKey: i ?? "",
				mathMetadata: o,
				display: a.display,
				fontSize: r,
				color: null,
				fallbackText: "fallbackText" in a ? a.fallbackText : G(a.nodes),
				measuredWidth: 0,
				mathAscent: 0,
				mathDescent: 0,
				jc: a.jc
			});
		} else if (a.type === "ptab") n.push({
			isTab: !0,
			fontSize: a.fontSize || Tc(e, e.indexOf(a)),
			measuredWidth: 0,
			leader: a.leader,
			ptab: {
				alignment: a.alignment,
				relativeTo: a.relativeTo
			}
		});
		else if (a.type === "anchorHost") {
			let e = a.fontFamilyEastAsia != null, i = a.bold ?? !1, o = a.italic ?? !1, s = a.fontFamilyEastAsia ?? a.fontFamily ?? null, c = i ? 700 : 400, l = o ? "italic" : "normal", u = r(s, c, l), d = r(a.fontFamilyEastAsia ?? null, c, l), f = u ?? (s ? t.resolvedLocalFonts?.[vn(s)] : void 0), p = d ?? (a.fontFamilyEastAsia ? t.resolvedLocalFonts?.[vn(a.fontFamilyEastAsia)] : void 0);
			n.push({
				text: "",
				metricOnly: !0,
				...e ? { metricEastAsian: !0 } : {},
				bold: i,
				italic: o,
				underline: !1,
				strikethrough: !1,
				fontSize: a.fontSize,
				color: null,
				fontFamily: u?.family ?? s,
				resolvedLineHeightRatio: f?.lineHeightRatio,
				vertAlign: null,
				measuredWidth: 0,
				eaFloorFamily: d?.family ?? a.fontFamilyEastAsia ?? null,
				resolvedEaFloorLineHeightRatio: p?.lineHeightRatio,
				snapToCharacterGrid: !1
			});
		}
		for (let e = u; e < n.length; e += 1) n[e].sourceRunIndex = i;
	}
	for (let [t, r] of e.entries()) {
		if (r.type !== "text") continue;
		let e = r, i = e.noBreakRanges;
		if (!i || i.length === 0) continue;
		let a = i.map((t) => {
			let n = (t) => {
				let n = e.text.slice(0, t);
				return e.allCaps || e.smallCaps ? n.toUpperCase().length : n.length;
			};
			return {
				start: n(t.start),
				end: n(t.end)
			};
		}), o = 0;
		for (let e of n) {
			if (e.sourceRunIndex !== t) continue;
			if (!("text" in e)) {
				"isTab" in e && (o += 1);
				continue;
			}
			let n = o + e.text.length;
			o > 0 && a.some((e) => e.start === o || e.end === o) && (e.joinPrev = !0, e.hardJoinPrev = !0);
			let r = a.filter((e) => e.start >= o && e.end <= n).map((e) => Object.freeze({
				start: e.start - o,
				end: e.end - o
			}));
			r.length > 0 && (e.noBreakRanges = Object.freeze(r)), o = n;
		}
	}
	for (let e = 0; e < n.length;) {
		let t = n[e];
		if (!("text" in t) || t.hyperlink?.kind !== "external") {
			e += 1;
			continue;
		}
		let r = t.hyperlink.url, i = e, a = [];
		for (; i < n.length;) {
			let e = n[i];
			if (!("text" in e) || e.hyperlink?.kind !== "external" || e.hyperlink.url !== r) break;
			a.push(e), i += 1;
		}
		let o = a.map((e) => e.text).join(""), s = /* @__PURE__ */ new Set(), c = 0;
		for (let e of a) {
			for (let t of e.noBreakRanges ?? []) {
				let e = [t.start, t.end];
				for (let t of e) s.add(c + t);
			}
			c += e.text.length;
		}
		let l = /* @__PURE__ */ new Set();
		for (let e of o.matchAll(/\S+/gu)) {
			let t = e[0], n = e.index, r = new Set(O(t).map((e) => n + e)), i = new Set([...s].filter((e) => e > n && e <= n + t.length).map((e) => e - n)), a = new Set([...r].map((e) => e - n));
			for (let e of ds(t, a, i)) l.add(n + e);
		}
		if (l.size === 0) {
			e = i;
			continue;
		}
		c = 0;
		for (let e = 0; e < a.length; e += 1) {
			let t = a[e], n = c, r = n + t.text.length, i = [...l].filter((e) => e > n && e < r).map((e) => e - n).sort((e, t) => e - t);
			i.length > 0 && (t.externalLinkBreakOffsets = Object.freeze(i)), e > 0 && l.has(n) && (t.joinPrev = void 0, t.externalLinkBreakBefore = !0), c = r;
		}
		e = i;
	}
	if (t.balanceSingleByteDoubleByteWidth) {
		let e = /* @__PURE__ */ new Map(), t = (t) => {
			let n = t.textLayoutService, r = t.textShapeRequest;
			if (!n || !r) return;
			let i = Ai(t, 1), a = [
				n.fingerprint,
				t.fontRoute?.fingerprint ?? "implicit-latin",
				t.eaFloorRoute?.fingerprint ?? "implicit-east-asia",
				i,
				t.bold ? 700 : 400,
				t.italic ? "italic" : "normal",
				t.kerning ?? "auto"
			].join("|"), o = e.get(a);
			if (o !== void 0) return o;
			let s = n.shape({
				...r,
				text: " ",
				fontSizePt: i,
				measure: !0,
				clusterGeometry: !1
			}).advancePt, c = n.shape({
				...r,
				text: "一",
				fontSizePt: i,
				fontHint: "eastAsia",
				measure: !0,
				clusterGeometry: !1
			}).advancePt;
			if (!Number.isFinite(s) || !Number.isFinite(c) || s < 0 || c <= 0) return;
			let l = c / 2 - s;
			return e.set(a, l), l;
		}, r = [], i = 0, a = () => {
			if (Qo(i)) for (let e of r) {
				e.widthBalanceSpaceSequence = !0;
				let n = t(e);
				n !== void 0 && (e.widthBalanceSpaceAdjustmentPt = n);
			}
			r = [], i = 0;
		};
		for (let e of n) {
			if (!("text" in e) || e.script === "complexScript") {
				a();
				continue;
			}
			let t = e.text.length - e.text.replace(/ +$/u, "").length;
			t > 0 && t === e.text.length || a(), t > 0 ? (r.push(e), i += t) : a();
		}
		a();
	}
	for (let e = 1; e < n.length; e++) {
		let t = n[e];
		if (!("text" in t) || t.joinPrev) continue;
		let r = t.text.codePointAt(0);
		if (r === void 0 || !y.lineStartForbidden.has(r)) continue;
		let i = n[e - 1];
		!("text" in i) || /\s$/.test(i.text) || (t.joinPrev = !0);
	}
	for (let e = 1; e < n.length; e++) {
		let t = n[e];
		if (!("text" in t) || t.joinPrev || t.text[0] !== " " && t.text[0] !== "　") continue;
		let r = n[e - 1];
		if (!("text" in r)) continue;
		let i = t.sourceRunIndex === r.sourceRunIndex, a = is(r.text, t.text);
		!i && !a || (t.joinPrev = !0);
	}
	for (let e = 1; e < n.length; e++) {
		let t = n[e];
		if (!("text" in t) || t.joinPrev || t.externalLinkBreakBefore || t.text.length === 0) continue;
		let r = n[e - 1];
		if (!("text" in r) || r.text.length === 0 || /\s$/u.test(r.text) || /^\s/u.test(t.text)) continue;
		let a = [...r.text].at(-1), o = [...t.text][0], s = a?.codePointAt(0), c = o?.codePointAt(0);
		s === void 0 || c === void 0 || s === 8203 || c === 8203 || ie(r.text) || ie(t.text) || Dc(r.text) || Dc(t.text) || i(s, c) && (t.joinPrev = !0);
	}
	let u = /* @__PURE__ */ new Set();
	for (let e of n) !("text" in e) || e.fitTextRegionIndex === void 0 || (u.has(e.fitTextRegionIndex) ? e.joinPrev = !0 : (e.fitTextRegionStart = !0, u.add(e.fitTextRegionIndex)));
	return sc(n), n;
}
function Kc(e, t, n, r, i, a = [], c, l = {}, u = 0, d = y, f = void 0, p = 36, m = n, h = !1, g = !1, _ = !1, v, b = "bounded", x, C = !1, w) {
	if (w === void 0) {
		let o = (o, s) => Kc(e, Uo(t), n, r, i, a, c, l, u, d, f, p, m, h, g, _, v, b, x, C, {
			probeHeights: o,
			preparedFloatWrap: s
		});
		if (!c || b === "intrinsic") return o(null);
		let s = c.lineWindow ? void 0 : go(c.floats);
		return Ko((e) => o(e, s), (e) => c.lineBoxH(e.ascent, e.descent, e.hasRuby, e.intendedSingle, e.eastAsian, e.gridCountSingle));
	}
	let { probeHeights: T, preparedFloatWrap: E } = w, D = [], k = [], A = 0, j = f?.type === "snapToChars" && f.characterPitchPt != null && f.characterPitchPt > 0 ? f.characterPitchPt * i : null, M = null, N = 0, ee = 0, te = 0, P = 0, re = /* @__PURE__ */ new Set(), ae = 0, F = 0, oe = 0, se = 0, ce = 0, le = 0, ue = 0, de = 0, fe = !1, pe = !0, me = n, he = 0, ge = c?.startPageY ?? 0, _e = () => za(i), ve = t.length > 0 && t.every((e) => "text" in e && e.metricOnly === !0 || "imagePath" in e && !!e.anchor), be = (e = 0) => {
		if (M = null, P = 0, re.clear(), he = 0, me = n, !c) return;
		let t = T?.[D.length];
		if (t === void 0) return;
		let r = {
			xLeftPt: c.referenceXPt ?? c.paraX,
			xRightPt: (c.referenceXPt ?? c.paraX) + (c.referenceWidthPt ?? n),
			readingDirection: c.readingDirection ?? (h ? "rtl" : "ltr")
		};
		if (c.lineWindow) {
			let r = c.lineWindow({
				topYPt: ge,
				minimumStartWidthPt: 1,
				squareMinimumStartWidthPt: e,
				probeHeightPt: t,
				paragraphXPt: c.paraX,
				maximumWidthPt: n,
				columnXPt: c.columnXPt,
				columnWidthPt: c.columnWidthPt
			});
			ge = r.topYPt, he = r.xOffsetPt, me = r.maximumWidthPt;
		} else {
			let i = Po(ge, 1, t, c.paraX, n, E ?? go(c.floats), c.columnXPt, c.columnXPt + c.columnWidthPt, r, e);
			ge = i.topY, he = i.xOffset, me = i.maxWidth;
		}
	}, I = () => b === "intrinsic" ? Infinity : me - (pe ? r : 0), xe = h ? a.map((e) => ({
		pos: e.pos * i,
		alignment: e.alignment,
		leader: e.leader
	})) : [], Ce = p * i, we = () => {
		if (!h || !k.some((e) => "isTab" in e)) return;
		let e = k.map((e) => ({
			isTab: "isTab" in e,
			width: e.measuredWidth
		}));
		for (let t = 0; t < k.length; t += 1) {
			if (!("isTab" in k[t])) continue;
			let n = t + 1;
			for (; n < k.length && !("isTab" in k[n]);) n += 1;
			let r = tt(k.slice(t + 1, n));
			if (!r) continue;
			let i = t + 1 + r.segmentIndex, a = k[i];
			"text" in a && (e[i].decimalOffset = Ze(a, a.text.slice(0, r.charOffset)));
		}
		let t = Uc(e, xe, m - (he + me) + (pe ? r : 0), m + u, Ce), n = 0;
		for (let e = 0; e < k.length; e++) {
			let r = k[e];
			"isTab" in r && (n += t[e].width - r.measuredWidth, r.measuredWidth = t[e].width, r.leader = t[e].leader);
		}
		A += n;
	}, Te = !1, Ee = !1, De = !1, Oe = (e, t = !1, n) => {
		we();
		let r, a = !1;
		for (let e of k) {
			if ("isTab" in e) continue;
			let t = "text" in e ? e.position ?? 0 : 0;
			if ("text" in e && e.positionExtendsLineBox === !1) {
				r = 0, a = !0;
				break;
			}
			if (!a) r = t, a = !0;
			else if (r !== t) {
				r = 0;
				break;
			}
		}
		let o = a ? r ?? 0 : 0;
		if (o !== 0) for (let e of k) "text" in e && (e.lineRelativePosition = fs(e.position ?? 0, o));
		let s = e === void 0 ? ae || 10 : Math.max(ae, e), l = F > 0 || oe > 0, u = l ? F : s * i * .8, d = l ? oe : s * i * .2, f = fe ? le : u, p = fe ? ue : d, m = fe ? de : se, h = ce || (Ee ? gc(se, s * i) : u + d);
		D.push({
			segments: k,
			height: s,
			ascent: u,
			descent: d,
			visibleAscent: f,
			visibleDescent: p,
			visibleIntendedSingle: m,
			intendedSingle: se,
			gridCountSingle: h,
			xOffset: he,
			availWidth: me,
			topY: c ? ge : void 0,
			hasRuby: Te,
			eastAsian: Ee,
			endsWithBreak: t,
			consumedEnd: n ?? R[0]?.src ?? Ve
		}), c && (ge += c.lineBoxH(u, d, Te, se, Ee, h)), k = [], A = 0, N = 0, ee = 0, te = 0, P = 0, re.clear(), ae = 0, F = 0, oe = 0, se = 0, ce = 0, le = 0, ue = 0, de = 0, fe = !1, Te = !1, Ee = !1, De = !1, pe = !1, be(_e());
	}, ke = (e, t = e.text) => En(e.fontFamily) * Ai(e, i) * cc(e) * [...t].length, Ae = (e) => {
		let t = e.bold ? 700 : 400, n = e.italic ? "italic" : "normal";
		return e.fontRoute ? `${e.fontRoute.fingerprint}|${t}|${n}` : `implicit|${Rs(e.bold, e.italic, 1, e.fontFamily, l)}`;
	}, je = (e, t, n = t.text) => {
		/\S/.test(n) && e.add(Ae(t));
	}, Me = (e) => {
		let t = re.size;
		for (let n of e) re.has(n) || (t += 1);
		return t;
	}, Ne = (e, t) => {
		let n = fc(e, f);
		return !n || j == null ? t : n === "eastAsia" ? pc(t, n, j, Xe(e)) : M?.kind === n ? pc(M.naturalWidthPx + t, n, j) - M.allocatedWidthPx : pc(t, n, j);
	}, L = (e, t, n, r, a, o = 0) => {
		let s = t;
		if ("text" in e) {
			let n = fc(e, f), r = e.snapGridNaturalWidthPx ?? t;
			if (n && j != null) if (e.snapGridClass = n, e.snapGridNaturalWidthPx = r, e.snapGridCellPitchPx = j, n === "eastAsia") s = pc(r, n, j, Xe(e)), e.snapGridLeadingPadPx = 0, e.snapGridTrailingPadPx = s - r, e.measuredWidth = s, M = null;
			else if (M?.kind === n) {
				let t = M.first.snapGridLeadingPadPx ?? 0, i = M.last.snapGridTrailingPadPx ?? 0, a = M.naturalWidthPx + r, o = pc(a, n, j), c = o - a, l = n === "latin" ? c / 2 : 0, u = c - l;
				M.first.measuredWidth -= t, M.first.snapGridLeadingPadPx = l, M.first.measuredWidth += l, M.last.measuredWidth -= i, e.snapGridLeadingPadPx = 0, e.snapGridTrailingPadPx = u, e.measuredWidth = r + u, s = o - M.allocatedWidthPx, M = {
					kind: n,
					first: M.first,
					last: e,
					naturalWidthPx: a,
					allocatedWidthPx: o
				};
			} else {
				let t = pc(r, n, j), i = t - r, a = n === "latin" ? i / 2 : 0, o = i - a;
				e.snapGridLeadingPadPx = a, e.snapGridTrailingPadPx = o, e.measuredWidth = t, s = t, M = {
					kind: n,
					first: e,
					last: e,
					naturalWidthPx: r,
					allocatedWidthPx: t
				};
			}
			else e.snapGridClass = void 0, e.snapGridLeadingPadPx = void 0, e.snapGridTrailingPadPx = void 0, e.snapGridCellPitchPx = void 0, e.measuredWidth = t, M = null;
		} else M = null;
		if (k.push(e), A += s, "text" in e) {
			let t = e.text.length - e.text.replace(/ +$/, "").length, n = t > 0 && t === e.text.length;
			if (n && ee > 0) N -= te, ee += t, te = 0;
			else {
				ee = 0, te = 0;
				let e = k[k.length - 2], r = e !== void 0 && "text" in e && /\S$/u.test(e.text);
				(n && r || t > 0 && !n) && (ee = t, te = t === 1 ? o : 0, N += te);
			}
			P += ke(e), je(re, e);
		}
		n > ae && (ae = n), r > F && (F = r), a > oe && (oe = a);
		let c = !("text" in e) || e.metricOnly !== !0;
		c && (fe = !0, r > le && (le = r), a > ue && (ue = a));
		let l = 0;
		if (!("isTab" in e) && !("imagePath" in e) && !("math" in e)) {
			let t = e;
			t.ruby && (Te = !0), t.seaBreaks !== void 0 && ye(t.text) && (De = !0);
			let n = t.metricEastAsian === !0 || ji.test(t.text);
			!Ee && n && (Ee = !0);
			let r = t.smallCaps && !t.vertAlign ? t.fontSize * i : Pe(t), a = n && !t.ruby, o = t.textBoxLineFloor && t.ruby ? 0 : Math.max(zs(t, r, a), t.textBoxLineFloor || t.metricEastAsian === !0 ? Bs(t, r, a) : 0);
			o > se && (se = o), c && o > de && (de = o), a && (l = gc(o, r));
		} else "isTab" in e || (l = r + a);
		l > ce && (ce = l);
	}, Pe = (e) => Ai(e, i), Fe = null, Ie = (t) => {
		t !== Fe && (e.font = t, Fe = t);
	}, Le = (t) => {
		if (t.kerning == null) return null;
		let n = e.fontKerning;
		return e.fontKerning = t.fontSize >= t.kerning ? "normal" : "none", n;
	}, Re = (t) => {
		t != null && (e.fontKerning = t);
	}, ze = (t, n = !1) => {
		if (t.textLayoutService && t.textShapeRequest) {
			let e = t.textLayoutService.shape({
				...t.textShapeRequest,
				text: t.text,
				fontSizePt: Pe(t),
				measure: !0,
				clusterGeometry: n
			});
			return n && (t.shapedClusters = e.clusters, t.selectedFaceFontBox = {
				ascentPt: e.ascentPt,
				descentPt: e.descentPt
			}, t.selectedFaceInkBounds = e.inkBounds ?? {
				xMinPt: 0,
				xMaxPt: e.advancePt,
				ascentPt: e.ascentPt,
				descentPt: e.descentPt
			}), {
				width: e.advancePt,
				actualBoundingBoxAscent: e.ascentPt,
				actualBoundingBoxDescent: e.descentPt,
				fontBoundingBoxAscent: e.ascentPt,
				fontBoundingBoxDescent: e.descentPt
			};
		}
		Ie(Rs(t.bold, t.italic, Pe(t), t.fontFamily, l, t.fontRoute));
		let r = Le(t), i = e.measureText(t.text);
		return Re(r), i;
	}, Be = (e, t) => {
		if (!e.verticalRun) return 0;
		if (!x) throw Error("Vertical glyph measurement capability is required for vertical text");
		Ie(Rs(e.bold, e.italic, Pe(e), e.fontFamily, l, e.fontRoute));
		let n = Le(e);
		try {
			return x.measureRunInkExtra(t);
		} finally {
			Re(n);
		}
	}, Ve = {
		segIndex: t.length,
		charOffset: 0
	}, He = t.map((e, t) => {
		if (e.src = {
			segIndex: t,
			charOffset: 0
		}, "text" in e && ie(e.text)) {
			let t = tc(e);
			e.seaBreaks = S(e.text, {
				cjk: !0,
				kinsoku: d
			}).filter((e) => !t.has(e));
		}
		return e;
	}), R;
	if (!v) R = He;
	else if (v.segIndex >= He.length) R = [];
	else {
		let e = He[v.segIndex];
		if (v.charOffset > 0) if (!("text" in e) || v.charOffset > e.text.length) R = [];
		else {
			let t = e.text.slice(v.charOffset);
			R = t ? [{
				...e,
				text: t,
				measuredWidth: 0,
				src: { ...v },
				joinPrev: void 0,
				hardJoinPrev: void 0,
				...q(e, v.charOffset, e.text.length),
				seaBreaks: jc(e.seaBreaks, v.charOffset)
			}, ...He.slice(v.segIndex + 1)] : He.slice(v.segIndex + 1);
		}
		else R = He.slice(v.segIndex);
	}
	let Ue = 0, We = -1, Ge = [];
	for (let e = R.length - 1; e >= 0; --e) {
		let t = R[e];
		if (!t || !("text" in t) || t.text.length === 0) break;
		if (t.fitTextRegionIndex !== void 0 || t.tateChuYoko === !0 || t.ruby !== void 0) {
			if (t.sourceRunIndex !== void 0) {
				for (let e = Ge.length - 1; e >= 0; --e) {
					let n = Ge[e];
					n.segment.sourceRunIndex === t.sourceRunIndex && (n.segment.paragraphFinalIdeographicSpaceTail = void 0, n.segment.paragraphFinalIdeographicSpaceLocalCount = void 0, n.segment.paragraphFinalIdeographicSpaceCount = void 0, n.segment.paragraphFinalIdeographicSpaceTailStart = void 0, Ge.splice(e, 1));
				}
				We = Ge.at(-1)?.index ?? -1;
			}
			break;
		}
		let n = /^\u3000+$/u.test(t.text), r = /[^\u3000]\u3000+$/u.test(t.text);
		if (!n && !r) break;
		let i = n ? [...t.text].length : [...t.text].reverse().findIndex((e) => e !== "　");
		if (Ue += i, t.paragraphFinalIdeographicSpaceTail = !0, t.paragraphFinalIdeographicSpaceLocalCount = i, t.paragraphFinalIdeographicSpaceCount = Ue, We = e, Ge.push({
			index: e,
			segment: t
		}), r) break;
	}
	if (We >= 0) {
		let e = R[We];
		e && "text" in e && (e.paragraphFinalIdeographicSpaceTailStart = !0);
	}
	Wc(R.filter((e) => "text" in e), i, (e) => ze(e).width + Be(e, e.text));
	let Ke = (e) => dc(e, ze(e).width + Be(e, e.text), f, i), qe = (e, t) => {
		let n = fc(e, f);
		return !n || j == null || e.text.length === 0 ? t : pc(t, n, j, n === "eastAsia" ? Xe(e) : 1);
	}, Je = (e) => qe(e, Ke(e)), Ye = (t, n, r = !1) => {
		let a = r ? t.text.length - n.length : 0, o = {
			...t,
			text: n,
			punctuationCompressions: $s(t, Math.max(0, a), Math.max(0, a) + n.length)
		};
		if (t.textLayoutService && t.textShapeRequest) return dc(o, t.textLayoutService.shape({
			...t.textShapeRequest,
			text: n,
			fontSizePt: Pe(t),
			measure: !0,
			clusterGeometry: !1
		}).advancePt + Be(t, n), f, i);
		Ie(Rs(t.bold, t.italic, Pe(t), t.fontFamily, l, t.fontRoute));
		let s = Le(t), c = e.measureText(n).width;
		return Re(s), dc(o, c + Be(t, n), f, i);
	}, Xe = (t) => {
		if (j == null) return 1;
		t.textLayoutService && t.textShapeRequest && !t.shapedClusters && ze(t, !0);
		let n = t.shapedClusters?.length ? t.shapedClusters : null, r = n == null ? [...new Set([
			0,
			...O(t.text),
			t.text.length
		])].sort((e, t) => e - t) : null, a = n?.map((e) => ({
			start: e.range.start,
			end: e.range.end,
			advancePx: e.advancePt
		})) ?? r.slice(0, -1).map((e, t) => ({
			start: e,
			end: r[t + 1],
			advancePx: void 0
		})), o = 0;
		for (let n of a) {
			let { start: r, end: a } = n;
			if (a <= r) continue;
			let s = t.text.slice(r, a), c = {
				...t,
				text: s,
				punctuationCompressions: $s(t, r, a)
			}, u;
			if (n.advancePx != null) u = dc(c, n.advancePx + Be(t, s), f, i);
			else {
				Ie(Rs(t.bold, t.italic, Pe(t), t.fontFamily, l, t.fontRoute));
				let n = Le(t), r = e.measureText(s).width;
				Re(n), u = dc(c, r + Be(t, s), f, i);
			}
			o += qo(u, j);
		}
		return Math.max(1, o);
	}, Ze = (e, t, n = !1) => qe({
		...e,
		text: t,
		shapedClusters: t === e.text ? e.shapedClusters : void 0
	}, Ye(e, t, n)), Qe = (t) => {
		let n = ze(t, fc(t, f) === "eastAsia"), r = dc(t, n.width + Be(t, t.text), f, i);
		t.snapGridNaturalWidthPx = r;
		let a = t.fontSize * i, o = n, s = Pe(t);
		if (t.smallCaps && !t.vertAlign && s !== a) {
			if (t.textLayoutService && t.textShapeRequest) {
				let e = t.textLayoutService.shape({
					...t.textShapeRequest,
					text: t.text || "X",
					fontSizePt: a,
					measure: !0,
					clusterGeometry: !1
				});
				o = {
					width: e.advancePt,
					actualBoundingBoxAscent: e.ascentPt,
					actualBoundingBoxDescent: e.descentPt,
					fontBoundingBoxAscent: e.ascentPt,
					fontBoundingBoxDescent: e.descentPt
				};
			} else {
				let n = e.font;
				e.font = Rs(t.bold, t.italic, a, t.fontFamily, l, t.fontRoute), o = e.measureText(t.text || "X"), e.font = n;
			}
			s = a;
		}
		let c = yc(o, t.fontFamily, a, s, (t.metricEastAsian === !0 || ji.test(t.text)) && !t.ruby), u = c.ascent, d = c.descent;
		if (t.positionExtendsLineBox !== !1) {
			let e = (t.position ?? 0) * i;
			e > 0 ? u += e : e < 0 && (d -= e);
		}
		return t.ruby && (!t.textBoxLineFloor || t.textBoxVertical) && (u += Ts(t.ruby.fontSizePt, t.ruby.hpsRaisePt, i, t, e, l)), {
			width: r,
			height: t.fontSize,
			ascent: u,
			descent: d
		};
	}, $e = (e) => {
		if (/\s$/u.test(e.text) || e.ruby !== void 0 || e.tateChuYoko === !0 || e.fitTextRegionIndex !== void 0) return;
		let t = R[0];
		if (!t || !("text" in t) || t.joinPrev !== !0 || t.text.length === 0 || [...t.text].some((e) => e !== "　")) return;
		R.shift();
		let n = es(Nc(e.text), t.paragraphFinalIdeographicSpaceCount ?? [...t.text].length);
		if (n === 0) {
			R.unshift(t);
			return;
		}
		let r = t.text.slice(0, n), i = {
			...t,
			...K,
			text: r,
			measuredWidth: 0,
			...q(t, 0, r.length)
		}, a = Qe(i);
		i.measuredWidth = a.width, L(i, a.width, a.height, a.ascent, a.descent);
		let o = t.text.slice(r.length);
		o.length > 0 && R.unshift({
			...t,
			...K,
			text: o,
			measuredWidth: 0,
			joinPrev: void 0,
			hardJoinPrev: void 0,
			...q(t, r.length, t.text.length),
			src: t.src ? {
				segIndex: t.src.segIndex,
				charOffset: t.src.charOffset + r.length
			} : void 0
		});
	}, et = (e) => "isTab" in e ? e.measuredWidth || 0 : "imagePath" in e ? e.widthPt * i : "math" in e ? e.measuredWidth || 0 : "lineBreak" in e ? 0 : Je(e), tt = (e) => {
		for (let t = 0; t < e.length; t += 1) {
			let n = e[t];
			if (!("text" in n)) continue;
			let r = n.text.indexOf(".");
			if (r >= 0) return {
				segmentIndex: t,
				charOffset: r
			};
		}
		let t = null, n = !1;
		for (let r = 0; r < e.length; r += 1) {
			let i = e[r];
			if (!("text" in i)) {
				if (n) return t;
				continue;
			}
			let a = 0;
			for (let e of i.text) if (a += e.length, /\p{Decimal_Number}/u.test(e)) n = !0, t = {
				segmentIndex: r,
				charOffset: a
			};
			else if (n) return t;
		}
		return t;
	}, nt = (e) => {
		let t = tt(e);
		if (!t) return;
		let n = 0;
		for (let r = 0; r < t.segmentIndex; r += 1) n += et(e[r]);
		let r = e[t.segmentIndex];
		return "text" in r ? n + Ze(r, r.text.slice(0, t.charOffset)) : n;
	}, z = () => {
		let e = [], t = 0;
		for (let n of R) {
			if ("isTab" in n || "lineBreak" in n) break;
			e.push(n), t += et(n);
		}
		let n = nt(e);
		return n === void 0 ? { totalWidth: t } : {
			totalWidth: t,
			decimalPrefixWidth: n
		};
	}, rt = null;
	be(ve ? c?.paragraphMarkLineStartWidth ?? _e() : _e());
	let it = (t, n, r = !0) => {
		let a = tc(t), o = [
			0,
			...O(t.text),
			t.text.length
		].filter((e, t, n) => n.indexOf(e) === t), s = 0;
		if (n > 0) if (Js(t, i) >= 0 && fc(t, f) !== "latin") {
			Ie(Rs(t.bold, t.italic, Pe(t), t.fontFamily, l, t.fontRoute));
			let r = Le(t);
			try {
				let r = Pc(e, t.text, n, qs(t, f, i), cc(t), Js(t, i), t.verticalRun === !0, x, (e) => Ze(t, e)).length;
				s = o.filter((e) => e <= r && !a.has(e)).at(-1) ?? 0;
			} finally {
				Re(r);
			}
		} else for (let e of o) e <= 0 || a.has(e) || Ne(t, Ye(t, t.text.slice(0, e))) <= n + 1e-9 && (s = e);
		for (s <= 0 && r && (s = o.find((e) => e > 0 && !a.has(e)) ?? t.text.length); t.text.startsWith("　", s);) s += 1;
		return s;
	}, at = (e, t) => {
		if (!(t > 0) || !e.externalLinkBreakOffsets?.length) return 0;
		let n = 0;
		for (let r of e.externalLinkBreakOffsets) r <= 0 || r >= e.text.length || Ne(e, Ye(e, e.text.slice(0, r))) <= t + 1e-9 && (n = r);
		return n;
	}, ot = (e, t) => {
		R.unshift({
			...e,
			...K,
			text: e.text.slice(t),
			...q(e, t, e.text.length),
			seaBreaks: jc(e.seaBreaks, t),
			measuredWidth: 0,
			joinPrev: void 0,
			hardJoinPrev: void 0,
			src: {
				segIndex: e.src.segIndex,
				charOffset: e.src.charOffset + t
			}
		});
	}, st = (e) => {
		let t = e.text.codePointAt(0), n = k[k.length - 1];
		if (t === void 0 || !d.lineStartForbidden.has(t) || n === void 0 || !("text" in n)) return { kind: "none" };
		let r = n, i = [...r.text], a = s(i, d, k.length > 1 ? 0 : 1);
		if (a <= 0) return { kind: "none" };
		let o = i.slice(0, i.length - a).join(""), c = o.length;
		if (c === 0 && r.hardJoinPrev === !0 || tc(r).has(c)) return { kind: "blocked" };
		let l = r.text.slice(c), u = {
			...r,
			...K,
			text: l,
			...q(r, c, r.text.length),
			measuredWidth: Ze(r, l, !0),
			joinPrev: void 0,
			hardJoinPrev: void 0,
			src: {
				segIndex: r.src.segIndex,
				charOffset: r.src.charOffset + c
			},
			seaBreaks: jc(r.seaBreaks, c)
		};
		if (o) {
			let e = Ze(r, o);
			A -= r.measuredWidth - e, k[k.length - 1] = {
				...r,
				...K,
				text: o,
				measuredWidth: e,
				...q(r, 0, c)
			};
		} else A -= r.measuredWidth, k.pop();
		return {
			kind: "retracted",
			tail: u
		};
	}, ct = (e, t, n, r) => {
		let i = O(e.text)[0] ?? e.text.length;
		if (i <= 0) return !1;
		let a = e.text.slice(0, i), o = Ye(e, a);
		return L({
			...e,
			...K,
			text: a,
			measuredWidth: o,
			...q(e, 0, i)
		}, o, t, n, r), i < e.text.length && ot(e, i), !0;
	};
	for (; R.length > 0;) {
		let t = R.shift();
		if ("lineBreak" in t) {
			Oe(t.fontSize, !0), rt = t.fontSize;
			continue;
		}
		if (rt = null, "isTab" in t) {
			if (h && !t.ptab) {
				t.measuredWidth = 0, L(t, 0, t.fontSize, t.fontSize * i * .8, t.fontSize * i * .2);
				continue;
			}
			let e = A + (pe ? r : 0);
			if (t.ptab) {
				t.resolvedAlignment = t.ptab.alignment;
				let r = t.ptab.relativeTo === "indent" ? 0 : -u, a = t.ptab.relativeTo === "indent" ? n : m, o = t.ptab.alignment === "left" ? r : t.ptab.alignment === "center" ? (r + a) / 2 : a, s = 0;
				for (let e of R) {
					if ("isTab" in e || "lineBreak" in e) break;
					s += et(e);
				}
				let c = t.ptab.alignment === "center" ? .5 : +(t.ptab.alignment === "right"), l = o - e - s * c;
				if (l <= 0) {
					if (k.length > 0) {
						Oe(void 0, !1, t.src), R.unshift(t);
						continue;
					}
					l = 0;
				}
				if (t.measuredWidth = l, L(t, l, t.fontSize, t.fontSize * i * .8, t.fontSize * i * .2), t.ptab.alignment !== "left") for (; R.length > 0;) {
					let e = R[0];
					if ("isTab" in e || "lineBreak" in e) break;
					if (R.shift(), "imagePath" in e) {
						let t = e.widthPt * i;
						e.measuredWidth = t, L(e, t, e.heightPt, e.heightPt * i, 0);
					} else if ("math" in e) L(e, e.measuredWidth || 0, e.fontSize, e.mathAscent || 0, e.mathDescent || 0);
					else {
						let t = ze(e), n = dc(e, t.width + Be(e, e.text), f, i);
						e.measuredWidth = n;
						let r = t.fontBoundingBoxAscent ?? t.actualBoundingBoxAscent ?? e.fontSize * i * .8, a = t.fontBoundingBoxDescent ?? t.actualBoundingBoxDescent ?? e.fontSize * i * .2;
						L(e, n, e.fontSize, r, a);
					}
				}
				continue;
			}
			let o = Mi(e + u, a.map((e) => ({
				pos: e.pos * i,
				alignment: e.alignment,
				leader: e.leader
			})), p * i);
			t.resolvedAlignment = o?.alignment ?? "left";
			let s = o ? o.pos - u : e, c = o ? Hc(o.alignment) : "leading";
			if (o && c !== "leading") {
				let n = s;
				t.leader = o.leader;
				let r = z(), a = c === "center" ? r.totalWidth / 2 : c === "decimal" ? r.decimalPrefixWidth ?? r.totalWidth : r.totalWidth, l = n - e - a;
				for (l <= 0 && (l = 0), t.measuredWidth = l, L(t, l, t.fontSize, t.fontSize * i * .8, t.fontSize * i * .2); R.length > 0;) {
					let e = R[0];
					if ("isTab" in e || "lineBreak" in e) break;
					if (R.shift(), "imagePath" in e) {
						let t = e.widthPt * i;
						e.measuredWidth = t, L(e, t, e.heightPt, e.heightPt * i, 0);
					} else if ("math" in e) L(e, e.measuredWidth || 0, e.fontSize, e.mathAscent || 0, e.mathDescent || 0);
					else {
						let t = ze(e), n = dc(e, t.width + Be(e, e.text), f, i);
						e.measuredWidth = n;
						let r = t.fontBoundingBoxAscent ?? t.actualBoundingBoxAscent ?? e.fontSize * i * .8, a = t.fontBoundingBoxDescent ?? t.actualBoundingBoxDescent ?? e.fontSize * i * .2;
						L(e, n, e.fontSize, r, a);
					}
				}
				continue;
			}
			let l = s - e;
			if (o && (t.leader = o.leader), l <= 0) {
				Oe(void 0, !1, t.src), R.unshift(t);
				continue;
			}
			if (A + l > I() && k.length > 0) {
				Oe(void 0, !1, t.src), R.unshift(t);
				continue;
			}
			t.measuredWidth = l, L(t, l, t.fontSize, t.fontSize * i * .8, t.fontSize * i * .2);
			continue;
		}
		if ("imagePath" in t) {
			if (t.anchor) {
				t.measuredWidth = 0;
				continue;
			}
			let e = t.widthPt * i, n = t.heightPt, r = t.heightPt * i;
			t.measuredWidth = e, k.length > 0 && A + e > I() && Oe(void 0, !1, t.src), L(t, e, n, r, 0);
			continue;
		}
		if ("math" in t) {
			let n = t.mathMetadata;
			if (!n || n.available === !1) {
				let n = t.fontSize * i;
				Ie(Rs(!1, !1, n, null, l));
				let r = e.measureText(t.fallbackText), a = r.width, o = r.fontBoundingBoxAscent ?? r.actualBoundingBoxAscent ?? n * .8, s = r.fontBoundingBoxDescent ?? r.actualBoundingBoxDescent ?? n * .2;
				t.measuredWidth = a, t.mathAscent = o, t.mathDescent = s, k.length > 0 && A + a > I() && Oe(void 0, !1, t.src), L(t, a, t.fontSize, Math.max(o, n * .8), Math.max(s, n * .2));
				continue;
			}
			let r = t.fontSize * i, a = n.widthEm * r, o = n.ascentEm * r, s = n.descentEm * r;
			t.measuredWidth = a, t.mathAscent = o, t.mathDescent = s;
			let c = Math.max(o, r * .8), u = Math.max(s, r * .2);
			k.length > 0 && A + a > I() && Oe(void 0, !1, t.src), L(t, a, t.fontSize, c, u);
			continue;
		}
		let s = t, c = Qe(s), v = c.width, b = Ne(s, v), S = c.height, w = c.ascent, T = c.descent, E = s.paragraphFinalIdeographicSpaceTail === !0, D = s.paragraphFinalIdeographicSpaceCount ?? 0, j = s.paragraphFinalIdeographicSpaceLocalCount ?? 0, M = E ? s.text.slice(0, Math.max(0, s.text.length - j)) : s.text;
		if (E && D > 1 && M.length > 0) {
			let e = {
				...s,
				...K,
				text: M,
				paragraphFinalIdeographicSpaceTail: void 0,
				paragraphFinalIdeographicSpaceLocalCount: void 0,
				paragraphFinalIdeographicSpaceCount: void 0,
				paragraphFinalIdeographicSpaceTailStart: void 0,
				measuredWidth: 0,
				...q(s, 0, M.length)
			}, t = {
				...s,
				...K,
				text: s.text.slice(M.length),
				paragraphFinalIdeographicSpaceLocalCount: j,
				joinPrev: void 0,
				hardJoinPrev: void 0,
				paragraphFinalIdeographicSpaceTailStart: !0,
				measuredWidth: 0,
				...q(s, M.length, s.text.length),
				src: s.src ? {
					segIndex: s.src.segIndex,
					charOffset: s.src.charOffset + M.length
				} : void 0
			};
			R.unshift(t), R.unshift(e);
			continue;
		}
		if (E && /^\u3000+$/u.test(s.text) && s.paragraphFinalIdeographicSpaceTailStart === !0 && k.some((e) => "text" in e && /[^\u3000]/u.test(e.text))) {
			let e = v;
			for (let t of R) {
				if (!("text" in t) || t.paragraphFinalIdeographicSpaceTail !== !0) break;
				e += Je(t);
			}
			if (A + e > I()) {
				Oe(void 0, !1, s.src), R.unshift(s);
				continue;
			}
		}
		if (s.fitTextRegionIndex !== void 0) {
			if (s.fitTextRegionStart) {
				let e = v;
				for (let t of R) {
					if (!("text" in t) || t.fitTextRegionIndex !== s.fitTextRegionIndex) break;
					e += Je(t);
				}
				k.length > 0 && A + e > I() && Oe(void 0, !1, s.src);
			}
			s.measuredWidth = v, L(s, v, S, w, T);
			continue;
		}
		let ee = s.text.replace(/ +$/, ""), te = fc(s, f) ? 0 : s.text.endsWith(" ") ? v - Ze(s, ee) : 0, re = (e) => {
			let t = e === void 0 || "lineBreak" in e;
			return g && (!t || _);
		}, ie = (e, t, r) => cs({
			widthPx: e,
			trailingSpacePx: t,
			lineWillJustify: re(r),
			wrapNarrowed: me !== n || he !== 0
		}), ae = ie(b, te, R[0]), F = s.seaBreaks !== void 0 && ye(s.text), oe = /* @__PURE__ */ new Set();
		je(oe, s, ee);
		let se = (e, t, n) => re(e) ? ls({
			biasBudgetPx: t,
			resolvedMeasurementRouteCount: Me(n)
		}) : De || F ? 0 : N * Bc;
		if (!s.joinPrev && k.length > 0 && R[0]?.joinPrev && (R[0]?.hardJoinPrev === !0 || !Dc(s.text)) && (R[0]?.hardJoinPrev === !0 || !(s.seaBreaks && s.seaBreaks.length > 0))) {
			let e = v, t = te, n = 0, r = P, i = new Set(oe), a = s, o = s.text, c = (e, t = e.text) => {
				r += ke(a, o), a = e, o = t;
			};
			for (; n < R.length && R[n].joinPrev; n++) {
				let r = R[n], a = rc(r);
				if (a !== void 0) {
					let n = r.text.slice(0, a), o = Ze(r, n);
					if (e += o, c(r, n), je(i, r, n), t = n.endsWith(" ") ? o - Ze(r, n.replace(/ +$/, "")) : 0, a < r.text.length) break;
					continue;
				}
				let o = r.externalLinkBreakOffsets?.[0];
				if (o !== void 0) {
					let n = r.text.slice(0, o), a = Ze(r, n);
					e += a, c(r, n), je(i, r, n), t = 0;
					break;
				}
				if (Dc(r.text)) {
					let n = [...r.text], a = 0;
					for (; a < n.length && y.lineStartForbidden.has(n[a].codePointAt(0));) a++;
					if (a < n.length) {
						let o = n.slice(0, a).join(""), s = Ze(r, o);
						e += s, o.length > 0 && (c(r, o), je(i, r, o)), t = 0;
						break;
					}
				}
				let s = Je(r);
				e += s, c(r), je(i, r);
				let l = r.text.replace(/ +$/, ""), u = r.text.endsWith(" ") ? s - Ze(r, l) : 0;
				t = l.length === 0 && t > 0 ? t + u : u;
			}
			r += ke(a, o.replace(/ +$/, "")), A + ie(e, t, R[n]) > I() + se(R[n], r, i) && Oe(void 0, !1, s.src);
		}
		if (F && k.length > 0 && (() => {
			let e = k[k.length - 1];
			return !("text" in e) || e.text.endsWith(" ");
		})()) {
			let e = v, t = te, n = 0, r = P + ke(s, ee), i = new Set(oe);
			if (!s.text.endsWith(" ")) for (; n < R.length; n++) {
				let a = R[n];
				if (!("text" in a) || a.seaBreaks === void 0 || !ye(a.text)) break;
				let o = a, s = Je(o), c = o.text.replace(/ +$/, "");
				if (e += s, t = o.text.endsWith(" ") ? s - Ze(o, c) : 0, r += ke(o, c), je(i, o, c), o.text.endsWith(" ")) {
					n++;
					break;
				}
			}
			let a = ie(e, t, R[n]);
			A + a > I() + se(R[n], r, i) && a <= me && Oe(void 0, !1, s.src);
		}
		let ce = se(R[0], P + ke(s, ee), oe), le = [...ee], ue = le.at(-1), de = le.slice(0, -1).join(""), fe = C && ue !== void 0 && (k.length > 0 || de.length > 0) && ss(ue, s.eastAsiaLanguage) && A + Ze(s, de) <= I() + ce;
		if (A + ae <= I() + ce) s.measuredWidth = v, L(s, v, S, w, T, te), $e(s);
		else if (fe) s.measuredWidth = v, L(s, v, S, w, T, te), $e(s);
		else if (Dc(s.text) && s.seaBreaks === void 0 && s.hardJoinPrev !== !0) {
			let t = I() - A, n = "", r = E ? es(Nc(s.text), s.paragraphFinalIdeographicSpaceCount ?? 0) : Infinity;
			if (t > 0) if (Js(s, i) < 0 || fc(s, f) === "latin") n = s.text.slice(0, it(s, t, !1));
			else {
				Ie(Rs(s.bold, s.italic, Pe(s), s.fontFamily, l, s.fontRoute));
				let a = Le(s);
				try {
					n = Pc(e, s.text, t, qs(s, f, i), cc(s), Js(s, i), s.verticalRun === !0, x, (e) => Ze(s, e), r);
				} finally {
					Re(a);
				}
			}
			let a = [...s.text], c = [...n].length, u = k.length > 0 ? 0 : 1, p = Mc(a, (C && c < a.length && (k.length > 0 || c > 0) && ss(a[c], s.eastAsiaLanguage) ? c + 1 : null) ?? o(a, c, d, u), E && r === 0 ? 0 : r), m = a.slice(0, p).join("").length, h = nc(s, m, +(u > 0)), g = s.text.slice(0, h);
			if (g.length > 0) {
				let e = Ye(s, g);
				L({
					...s,
					...K,
					text: g,
					measuredWidth: e,
					...q(s, 0, g.length)
				}, e, S, w, T);
				let t = s.text.slice(g.length);
				t ? R.unshift({
					...s,
					...K,
					text: t,
					...q(s, g.length, s.text.length),
					measuredWidth: 0,
					src: {
						segIndex: s.src.segIndex,
						charOffset: s.src.charOffset + g.length
					}
				}) : $e(s);
			} else if (k.length > 0) {
				let e = st(s);
				if (e.kind === "blocked") {
					ct(s, S, w, T);
					continue;
				}
				Oe(void 0, !1, e.kind === "retracted" ? e.tail.src : s.src), R.unshift(s), e.kind === "retracted" && R.unshift(e.tail);
			} else {
				let e = [...s.text], t = e.length > 0 ? Mc(e, 1, s.paragraphFinalIdeographicSpaceTail === !0 ? es(ji.test(e[0] ?? ""), s.paragraphFinalIdeographicSpaceCount ?? 0) : Infinity) : 0, n = e.slice(0, t).join("").length, r = nc(s, n) || it(s, I(), !0), i = s.text.slice(0, r);
				if (i) {
					let e = Ye(s, i);
					L({
						...s,
						...K,
						text: i,
						measuredWidth: e,
						...q(s, 0, i.length)
					}, e, S, w, T);
					let t = s.text.slice(i.length);
					t ? R.unshift({
						...s,
						...K,
						text: t,
						...q(s, i.length, s.text.length),
						measuredWidth: 0,
						src: {
							segIndex: s.src.segIndex,
							charOffset: s.src.charOffset + i.length
						}
					}) : $e(s);
				}
			}
		} else if (s.seaBreaks !== void 0 && s.hardJoinPrev !== !0) {
			let e = I() - A, t = (e) => Ze(s, e), n = Se(s.text) && Js(s, i) >= 0 && fc(s, f) !== "latin", r = ne(s.text, s.seaBreaks, 0, e, t, n);
			if (r > 0) {
				let e = s.text.slice(0, r), t = Ye(s, e);
				L({
					...s,
					...K,
					text: e,
					measuredWidth: t,
					...q(s, 0, e.length)
				}, t, S, w, T);
				let n = s.text.slice(r);
				n && R.unshift({
					...s,
					...K,
					text: n,
					...q(s, r, s.text.length),
					measuredWidth: 0,
					src: {
						segIndex: s.src.segIndex,
						charOffset: s.src.charOffset + r
					},
					seaBreaks: jc(s.seaBreaks, r)
				});
			} else if (k.length > 0) {
				let e = st(s);
				if (e.kind === "blocked") {
					ct(s, S, w, T);
					continue;
				}
				Oe(void 0, !1, e.kind === "retracted" ? e.tail.src : s.src), R.unshift(s), e.kind === "retracted" && R.unshift(e.tail);
			} else {
				let r = s.seaBreaks[0] ?? s.text.length, i = s.text.slice(0, r), a = O(i), o = ne(i, a, 0, e, t, n);
				o <= 0 && (o = a.length > 0 ? a[0] : i.length), o = nc(s, o) || it(s, e, !0);
				let c = s.text.slice(0, o), l = Ye(s, c);
				L({
					...s,
					...K,
					text: c,
					measuredWidth: l,
					...q(s, 0, c.length)
				}, l, S, w, T);
				let u = s.text.slice(o);
				u && R.unshift({
					...s,
					...K,
					text: u,
					...q(s, o, s.text.length),
					measuredWidth: 0,
					src: {
						segIndex: s.src.segIndex,
						charOffset: s.src.charOffset + o
					},
					seaBreaks: jc(s.seaBreaks, o)
				});
			}
		} else if (k.length === 0) {
			let e = at(s, I()) || it(s, I());
			if (e >= s.text.length) s.measuredWidth = v, L(s, v, S, w, T);
			else {
				let t = s.text.slice(0, e), n = Ye(s, t);
				L({
					...s,
					...K,
					text: t,
					measuredWidth: n,
					...q(s, 0, t.length)
				}, n, S, w, T), ot(s, e);
			}
		} else {
			let e = at(s, I() + ce - A);
			if (e > 0 && e < s.text.length) {
				let t = s.text.slice(0, e), n = Ye(s, t);
				L({
					...s,
					...K,
					text: t,
					measuredWidth: n,
					...q(s, 0, t.length)
				}, n, S, w, T), ot(s, e);
				continue;
			}
			if (s.joinPrev) {
				let e = I() - A, t = it(s, e, !0);
				if ((e > 0 || s.hardJoinPrev === !0) && t > 0 && t < s.text.length) {
					let e = s.text.slice(0, t), n = Ye(s, e);
					L({
						...s,
						...K,
						text: e,
						measuredWidth: n,
						...q(s, 0, e.length)
					}, n, S, w, T), ot(s, t);
					continue;
				}
				s.measuredWidth = v, L(s, v, S, w, T, te);
				continue;
			}
			Oe(void 0, !1, s.src), R.unshift(s);
		}
	}
	if (k.length > 0 ? Oe() : rt !== null && Oe(rt), b === "bounded") for (let e of D) for (let t of e.segments) !("text" in t) || t.metricOnly || t.text.length === 0 || (t.shapedClusters = void 0, t.textLayoutService && t.textShapeRequest && ze(t, !0));
	return D;
}
//#endregion
//#region packages/docx/src/bidi-line.ts
var qc = (e) => {
	let t = e.text;
	return typeof t == "string" ? t : void 0;
}, Jc = (e) => e.rtl === !0, Yc = (e) => e.digitsAsAN === !0, Xc = (e) => "isTab" in e;
function Zc(e) {
	for (let t of e) {
		if (Jc(t)) return !0;
		let e = qc(t);
		if (e !== void 0 && oe(e)) return !0;
	}
	return !1;
}
function Qc(e, n) {
	let r = e.length;
	if (r === 0) return {
		order: [],
		rtl: []
	};
	let i = "", a = Array(r), o = Array(r), s, c = () => {
		for (s ||= []; s.length < i.length;) s.push(null);
		return s;
	};
	for (let t = 0; t < r; t++) {
		let n = qc(e[t]) ?? "";
		if (a[t] = i.length, i += n.length > 0 ? n : "￼", o[t] = i.length, Xc(e[t])) c()[a[t]] = "S";
		else if (n.length > 0 && (Yc(e[t]) || Jc(e[t]))) {
			let n = c(), r = Yc(e[t]), s = Jc(e[t]);
			for (let e = a[t]; e < o[t]; e++) {
				let t = i.charCodeAt(e);
				r && t >= 48 && t <= 57 ? n[e] = "AN" : s && Ss(i[e]) && (n[e] = "R");
			}
		}
	}
	if (s) for (; s.length < i.length;) s.push(null);
	let { levels: l, paragraphLevel: u } = h().computeLevels(i, n ? "rtl" : "ltr", s), d = Array(r), f = Array(r);
	for (let e = 0; e < r; e++) {
		let t = o[e];
		for (; t > a[e] && i[t - 1] === " ";) t--;
		let n = !1;
		for (let r = a[e]; r < t; r++) {
			let e = l[r];
			if (e !== 255 && (e & 1) == 1) {
				n = !0;
				break;
			}
		}
		d[e] = n, f[e] = a[e];
		for (let r = a[e]; r < t; r++) {
			let t = l[r];
			if (t !== 255 && (t & 1) == 1 === n) {
				f[e] = r;
				break;
			}
		}
	}
	let { order: p } = t(l, u, f);
	return {
		order: p,
		rtl: d
	};
}
function $c(e, t) {
	switch (e) {
		case "center": return "center";
		case "both":
		case "justify":
		case "distribute":
		case "lowKashida":
		case "mediumKashida":
		case "highKashida":
		case "thaiDistribute": return "justify";
		case "end":
		case "right": return t ? "left" : "right";
		case "start":
		case "left":
		case void 0:
		default: return t ? "right" : "left";
	}
}
function el(e) {
	switch (e) {
		case "both":
		case "justify":
		case "distribute":
		case "lowKashida":
		case "mediumKashida":
		case "highKashida":
		case "thaiDistribute": return !0;
		default: return !1;
	}
}
function tl(e) {
	return e === "distribute";
}
//#endregion
//#region packages/docx/src/layout/float-wrap-oracle.ts
function nl(e, t) {
	let n = e.map((e) => Object.freeze({ ...e })), r = go(n);
	return {
		lineWindow: ({ topYPt: e, minimumStartWidthPt: n, squareMinimumStartWidthPt: i, probeHeightPt: a, paragraphXPt: o, maximumWidthPt: s, columnXPt: c, columnWidthPt: l }) => {
			let u = Po(e, n, a, o, s, r, c, c + l, t ?? {
				xLeftPt: o,
				xRightPt: o + s,
				readingDirection: "ltr"
			}, i ?? n);
			return {
				topYPt: u.topY,
				xOffsetPt: u.xOffset,
				maximumWidthPt: u.maxWidth
			};
		},
		skipTopAndBottomBands: ({ yPt: e, columnXPt: t, columnWidthPt: r }) => Fo(e, n, t, t + r)
	};
}
//#endregion
//#region packages/docx/src/paragraph-measure.ts
function rl(e) {
	if (e.characterGrid.active) return {
		type: e.characterGrid.kind,
		linePitchPt: null,
		characterPitchPt: e.characterGrid.pitchPt,
		charSpacePt: e.characterGrid.deltaPt
	};
}
function il(e) {
	let t = rl(e);
	return {
		type: t ? t.type : e.lineGrid.active ? "lines" : null,
		linePitchPt: e.lineGrid.active ? e.lineGrid.pitchPt : null,
		characterPitchPt: e.characterGrid.active ? e.characterGrid.pitchPt : null,
		charSpacePt: e.characterGrid.active ? e.characterGrid.deltaPt : null
	};
}
function al(e, t) {
	if (!mc(t)) return e;
	let n = t.linePitchPt;
	return n <= 0 ? e : e <= n ? n : Math.ceil(e / n) * n;
}
function ol(e, t, n, r, i, a) {
	let o = il(t), s = lu(t, n.availableWidthPt), c = Math.max(1, n.availableWidthPt - t.physicalIndentLeftPt - t.physicalIndentRightPt - s), l = n.paragraphXPt + t.physicalIndentLeftPt, u = t.spaceBeforePt, d = t.spaceAfterPt, f = Object.freeze({ ...n }), p = r.fontFamilyClasses, m = i.documentHasEastAsianText === !0 || i.useFeLayout === !0, h = n.startYPt + (n.suppressSpaceBefore ? 0 : u);
	n.wrap && (h = n.wrap.skipTopAndBottomBands({
		yPt: h,
		columnXPt: n.paragraphXPt,
		columnWidthPt: n.availableWidthPt
	}));
	let g = () => {
		let a = h, s = xc(e, 1, o, t.hasRuby, m, r.context, p, t.lineSpacing, i.resolvedLocalFonts, i.layoutServices?.text, i.paragraphMarkShapeInput, i.useFeLayout === !0);
		return n.wrap && (a = n.wrap.lineWindow({
			topYPt: a,
			minimumStartWidthPt: Vs(e),
			squareMinimumStartWidthPt: Ba(Vs(e), 1),
			probeHeightPt: s,
			paragraphXPt: l,
			maximumWidthPt: c,
			columnXPt: n.paragraphXPt,
			columnWidthPt: n.availableWidthPt
		}).topYPt), {
			lines: [],
			markOnly: !0,
			requestedSpaceBeforePt: u,
			requestedSpaceAfterPt: d,
			uniformRubyAdvancePt: 0,
			contentStartYPt: a,
			contentEndYPt: a + s,
			lastLineBelowBaselinePt: Cc(e, o, t.hasRuby, m, r.context, p, t.lineSpacing, i.resolvedLocalFonts, i.layoutServices?.text, i.paragraphMarkShapeInput, i.useFeLayout === !0),
			placement: f
		};
	}, _ = Gc(e.runs, i);
	if (_.length === 0) return g();
	let v = n.wrap ? {
		startPageY: h,
		paraX: l,
		columnXPt: n.paragraphXPt,
		columnWidthPt: n.availableWidthPt,
		floats: [],
		paragraphMarkLineStartWidth: Ba(Vs(e), 1),
		lineWindow: (e) => n.wrap.lineWindow(e),
		lineBoxH: (e, n, r, i, a, s) => _c(t.lineSpacing, e, n, 1, o, t.hasRuby, i ?? 0, t.hasRuby ? t.hasEastAsianText : a ?? !1, s),
		pageH: n.maximumYPt
	} : void 0, y = Kc(r.context, _, c, a ? 0 : t.firstIndentPt, 1, [...t.tabStops], v, p, t.physicalIndentLeftPt, t.kinsoku, o, t.defaultTabPt, c + t.physicalIndentRightPt + s, t.baseRtl, t.isJustified, t.stretchLastLine, a?.boundary, void 0, i.verticalGlyphMeasurement, t.overflowPunct !== !1);
	if (y.length === 0) return g();
	let b = t.hasRuby ? al(Math.max(0, ...y.map((e) => _c(t.lineSpacing, e.ascent, e.descent, 1, o, !0, e.intendedSingle, t.hasEastAsianText))), o) : 0;
	t.hasRuby && a?.uniformRubyAdvancePt !== void 0 && (b = Math.max(b, a.uniformRubyAdvancePt));
	let x = [];
	for (let e of y) {
		let n = e.topY !== void 0 && e.topY > h ? e.topY : h, r = t.hasRuby ? b : _c(t.lineSpacing, e.ascent, e.descent, 1, o, !1, e.intendedSingle, e.eastAsian ?? !1, e.gridCountSingle);
		x.push({
			layout: e,
			topYPt: n,
			advancePt: r
		}), h = n + r;
	}
	let S = x[x.length - 1];
	return {
		lines: x,
		markOnly: !1,
		requestedSpaceBeforePt: u,
		requestedSpaceAfterPt: d,
		uniformRubyAdvancePt: b,
		contentStartYPt: x[0].topYPt,
		contentEndYPt: h,
		lastLineBelowBaselinePt: Sc(S.advancePt, S.layout.ascent, S.layout.descent),
		placement: f
	};
}
//#endregion
//#region packages/docx/src/layout/numbering-marker.ts
function sl(e) {
	let t = e.leadingIndentPt + e.authoredFirstIndentPt + e.markerShiftPt;
	return {
		startPt: t,
		endPt: t + e.markerWidthPt
	};
}
function cl(e) {
	let t = e.authoredFirstIndentPt + e.markerShiftPt;
	return e.baseRtl ? e.alignedLeadingEdgePt - t - e.markerWidthPt : e.alignedLeadingEdgePt + t;
}
function ll(e, t) {
	let { numbering: n, markerInput: r, service: i } = t, a = n != null && (n.text !== "" || n.picBulletImagePath != null) && (!e.baseRtl || (n?.suff || "tab") === "tab" && t.authoredFirstIndentPt < 0);
	if (!n || !r || !i || !a) return e;
	let o = fl(n, r, {
		authoredFirstIndentPt: t.authoredFirstIndentPt,
		physicalIndentLeftPt: e.physicalIndentLeftPt,
		tabStops: t.tabStops,
		defaultTabPt: t.defaultTabPt ?? e.defaultTabPt
	}, i, t.clusterGeometry ?? !0);
	return {
		...e,
		firstIndentPt: o.bodyOffsetPt,
		numberingMarkerGeometry: o
	};
}
function ul(e, t, n, r, i = !0) {
	return r ? {
		shape: r.shape({
			text: t,
			fontSizePt: e.fontSizePt * n,
			fonts: e.fonts,
			themeFonts: e.themeFonts,
			themeFontPresence: e.themeFontPresence,
			weight: e.weight,
			style: e.style,
			complexScript: e.complexScript,
			fontHint: e.fontHint,
			eastAsiaLanguage: e.eastAsiaLanguage,
			kerning: e.kerning,
			measure: !0,
			clusterGeometry: i
		}),
		fontSizePx: e.fontSizePt * n
	} : null;
}
function dl(e, t, n) {
	return t.find((t) => us(e, t)) ?? Mi(e, [...t], n);
}
function fl(e, t, n, r, i = !0) {
	let a = e.picBulletImagePath ? "" : Pe(e.text, e.fontFamily ?? null), o = a ? ul(t, a, 1, r, i)?.shape ?? null : null, s = e.picBulletImagePath ? e.picBulletWidthPt ?? t.fontSizePt : o?.advancePt ?? 0, c = e.jc === "right" ? -s : e.jc === "center" ? -s / 2 : 0, l = n.authoredFirstIndentPt + c + s, u = e.suff || "tab", d = l;
	if (u === "space") d += ul(t, " ", 1, r, i)?.shape.advancePt ?? 0;
	else if (u === "tab" && (d = 0, l > 0)) {
		let e = dl(n.physicalIndentLeftPt + l, n.tabStops, n.defaultTabPt);
		d = e ? e.pos - n.physicalIndentLeftPt : l;
	}
	return d = Math.max(0, d), {
		bodyOffsetPt: d,
		markerText: a,
		markerWidthPt: s,
		markerShiftPt: c,
		shape: o
	};
}
U({
	id: "word-autofit-empty-paragraph-content-width",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "autofit-empty-paragraph-boundary-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "For table AutoFit content width, Word gives an empty unnumbered paragraph no intrinsic content width regardless of effective right, left, first-line, or hanging indentation. Cell margins still contribute, while whitespace, non-breaking space, visible text, and numbering remain content-bearing controls."
});
function pl(e) {
	return e.runs.length === 0 && e.numbering == null;
}
U({
	id: "word-exact-row-height-bottom-padding",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.180(d)"
	},
	description: "Word adds the largest bottom cell margin to an exact trHeight instead of treating that margin as part of the authored height."
}), U({
	id: "word-table-border-layer-cascade",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.169"
	},
	description: "During per-side border acquisition, none falls through to a lower-precedence layer while nil remains authored and blocks fallback only on that side."
}), U({
	id: "word-spaced-cell-inside-border-conflict",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §§2.1.136, 2.1.138"
	},
	description: "With non-zero cell spacing, Word retains the narrow conditional tcBorders insideH/insideV conflict against the corresponding table inside border."
}), U({
	id: "word-table-indent-all-alignments",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.155"
	},
	description: "Word applies tblInd as a signed leading-edge translation for every table alignment, reversing the translation for bidi visual order."
}), U({
	id: "word-exact-row-vertical-clip-only",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/table.test.ts#clips an overflowing merged owner when every row in its span is exact"
	},
	description: "Preserve the established exact-row overflow behavior that clips the owned vertical interval without clipping nested table ink horizontally to the cell box."
}), U({
	id: "word-over-page-cant-split-clip",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.120"
	},
	description: "Word starts an over-page cantSplit row on a fresh page and clips its overflow instead of synthesizing a row continuation."
}), U({
	id: "word-parallel-paragraph-row-cut",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "parallel-paragraph-row-cut-boundary-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "When a page cut crosses a row containing parallel paragraph content, Word emits no cell content unless every unfinished paragraph cell can reach at least its first legal line or block boundary in that page band. The observed rule does not cover nested-table child boundaries."
}), U({
	id: "word-positioned-table-adjacency-exclusion",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.149(a)"
	},
	description: "Word excludes effectively positioned tables from the logical adjacent-table sequence before retained layout consumes the parser-owned sequence identity."
}), U({
	id: "word-table-border-weight-precedence",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.169"
	},
	description: "Use the documented Word border numbers for shared-cell conflict weight and force dotted and dashed borders to a complete weight of one."
}), U({
	id: "word-omitted-row-height-rule-at-least",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.180"
	},
	description: "Treat an omitted trHeight hRule as atLeast while retaining an explicitly authored auto rule as authored input."
}), U({
	id: "word-authored-auto-row-height-floor",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/table-row-height.test.ts#auto with @val — @val is honored as a lower bound"
	},
	description: "Preserve the established legacy-model behavior that an auto row with an authored height value uses that value as a lower bound."
}), U({
	id: "word-collapsed-border-row-track-footprint",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "collapsed-border-row-track-matrix",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "For automatic and at-least table rows with collapsed cell boundaries, Word includes half of the winning top and bottom rule widths in each row track. Exact rows retain their authored complete height, and cell spacing keeps independent edges out of the collapsed footprint."
}), U({
	id: "word-effective-floating-table-positioning",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §2.1.162"
	},
	description: "Use parser-retained effective positioning status rather than lexical tblpPr presence to decide whether a table leaves ordinary flow."
}), U({
	id: "word-table-cell-spacing-scope-shadow",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §§2.1.152, 2.1.153, 2.1.154"
	},
	description: "At each table-cell-spacing precedence scope, pct, auto, and nil resolve to zero and shadow lower scopes instead of being treated as absent."
}), U({
	id: "word-table-margin-scope-shadow",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §§2.1.116, 2.1.125, 2.1.146, 2.1.177"
	},
	description: "Preserve the documented scope-specific treatment of non-dxa table cell margins: leading/trailing defaults may resolve to zero while cell/exception and nil top/bottom values remain ignored."
}), U({
	id: "word-first-row-table-exception-scope",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §§2.1.156, 2.1.158, 2.1.167"
	},
	description: "Apply the supported first-row table-property exception facts at table scope, including authored preferred-width shadowing."
}), U({
	id: "word-trailing-structural-cell-marker",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/compatibility.test.ts#drops only an empty trailing paragraph after a non-paragraph cell block"
	},
	description: "Exclude the required empty trailing cell paragraph from row-height and vertical-alignment measurements when it follows a visible non-paragraph block."
}), U({
	id: "word-cell-vertical-alignment-ink-block",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/cell-valign-leading-spacing.test.ts#inked block is vertically centred in the cell (midpoint = cell midpoint)"
	},
	description: "Center or bottom-align the visible cell ink block without charging the first paragraph spaceBefore or final paragraph spaceAfter at the cell edges."
}), U({
	id: "word-vertical-merge-terminal-border",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/cell-border-conflict-render.test.ts#uses the final continuation cell border at the bottom of a vertical merge"
	},
	description: "Resolve the bottom edge of a vertically merged cell from its terminal continuation cell before applying shared-edge conflict rules."
}), U({
	id: "word-vertical-section-upright-block-table",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/vertical-table-upright.test.ts#the table advances the flow by its PHYSICAL WIDTH; body text stays vertical"
	},
	description: "Paint a block table in an upright physical frame within a vertical section and charge its physical width as the body-flow advance."
});
function ml(e, t) {
	return Math.max(0, e ?? 0) + Math.max(0, ...t);
}
function hl(e, t) {
	return (Math.max(0, e) + Math.max(0, t)) / 2;
}
function gl(e) {
	return e != null && e !== "none";
}
function _l(e, t, n) {
	return n ? e - t : e + t;
}
function vl(e) {
	return e.spacingPt > 0 && !gl(e.directStyle) && gl(e.conditionalInsideStyle);
}
function yl(e, t) {
	let n = Math.min(e.xPt, t.xPt), r = Math.max(e.xPt + e.widthPt, t.xPt + t.widthPt);
	return Object.freeze({
		xPt: n,
		yPt: e.yPt,
		widthPt: r - n,
		heightPt: e.heightPt
	});
}
function bl(e) {
	return e.compatibility === "word" && e.availableHeightPt + e.epsilonPt >= e.freshPageHeightPt;
}
function xl(e) {
	return e.compatibility === "word" && e.hasUnfinishedParagraphWithoutProgress;
}
var Sl = Object.freeze([
	"single",
	"thick",
	"double",
	"dotted",
	"dashed",
	"dotDash",
	"dotDotDash",
	"triple",
	"thinThickSmallGap",
	"thickThinSmallGap",
	"thinThickThinSmallGap",
	"thinThickMediumGap",
	"thickThinMediumGap",
	"thinThickThinMediumGap",
	"thinThickLargeGap",
	"thickThinLargeGap",
	"thinThickThinLargeGap",
	"wave",
	"doubleWave",
	"dashSmallGap",
	"dashDotStroked",
	"threeDEmboss",
	"threeDEngrave",
	"outset",
	"inset"
]), Cl = Object.freeze({
	single: 1,
	thick: 2,
	double: 3,
	dotDash: 8,
	dotDotDash: 9,
	triple: 10,
	thinThickSmallGap: 11,
	thickThinSmallGap: 12,
	thinThickThinSmallGap: 13,
	thinThickMediumGap: 14,
	thickThinMediumGap: 15,
	thinThickThinMediumGap: 16,
	thinThickLargeGap: 17,
	thickThinLargeGap: 18,
	thinThickThinLargeGap: 19,
	wave: 20,
	doubleWave: 21,
	dashSmallGap: 22,
	dashDotStroked: 23,
	threeDEmboss: 24,
	threeDEngrave: 25,
	outset: 26,
	inset: 27
});
function wl(e, t) {
	return e === "dotted" || e === "dashed" ? 1 : Math.max(0, t) * 8 * (Cl[e] ?? 0);
}
function Tl(e, t) {
	return t ? e : "atLeast";
}
function El(e, t) {
	return e === "pct" || e === "auto" || e === "nil" ? 0 : t;
}
function Dl(e) {
	return e.kind === "dxa" ? e.dxaValuePt : e.scope === "cell" || e.scope === "exception" ? null : (e.edge === "start" || e.edge === "end") && (e.kind === "pct" || e.kind === "auto" || e.kind === "nil") ? 0 : null;
}
//#endregion
//#region packages/docx/src/layout/intrinsic-width.ts
function Ol(e, t, n) {
	let r = 0, i = 0;
	for (let t of e.content) {
		let e = t.type === "paragraph" && pl(t), a = t.type === "paragraph" ? e ? {
			minWidthPt: 0,
			maxWidthPt: 0
		} : n.paragraph(t) : n.nestedTable(t);
		r = Math.max(r, a.minWidthPt), i = Math.max(i, a.maxWidthPt);
	}
	let a = Math.max(0, t.left) + Math.max(0, t.right);
	return {
		minWidthPt: r + a,
		maxWidthPt: Math.max(r, i) + a
	};
}
function kl(e) {
	let t = e.textShapeRequest, n = (e) => e ? [
		e.ascii ?? null,
		e.highAnsi ?? null,
		e.eastAsia ?? null,
		e.complexScript ?? null
	] : null;
	return it("paragraph-intrinsic-text", [
		e.textLayoutService?.fingerprint ?? null,
		t ? [
			n(t.fonts),
			n(t.themeFonts),
			t.themeFontPresence ? [
				t.themeFontPresence.ascii ?? !1,
				t.themeFontPresence.highAnsi ?? !1,
				t.themeFontPresence.eastAsia ?? !1,
				t.themeFontPresence.complexScript ?? !1
			] : null,
			t.fontHint ?? null,
			t.fontSizePt,
			t.weight ?? null,
			t.style ?? null,
			t.complexScript ?? !1,
			t.eastAsiaLanguage ?? null,
			t.eastAsiaFontCharset ?? null,
			t.genericFamily ?? null,
			t.letterSpacingPt ?? null,
			t.kerning ?? null
		] : null,
		e.bold,
		e.italic,
		Ai(e, 1),
		e.fontFamily,
		e.fontRoute ?? null,
		e.charScale ?? 1,
		e.charSpacing ?? 0,
		e.fitTextPerGapPx ?? null,
		e.fitTextTrailingPadPx ?? null,
		e.fitTextRegionIndex ?? null,
		e.snapToCharacterGrid !== !1,
		e.widthBalanceGridDeltaFactor ?? null,
		e.widthBalanceSpaceSequence ?? !1,
		e.widthBalanceSpaceAdjustmentPt ?? null,
		e.script,
		e.tateChuYoko ?? !1,
		e.tateChuYoko ? e.sourceRunIndex ?? null : null,
		e.ruby ? [
			e.sourceRunIndex ?? null,
			e.ruby.text,
			e.ruby.fontSizePt,
			e.ruby.hpsRaisePt ?? null
		] : null,
		e.verticalRun ?? !1
	]);
}
function Al(e) {
	let t = [];
	for (let n of e) {
		let e = t.at(-1);
		if (e && "text" in e && "text" in n && kl(e) === kl(n)) {
			let r = e.text.length, i = e.text + n.text, a = [...e.punctuationCompressions ?? [], ...(n.punctuationCompressions ?? []).map((e) => ({
				end: r + e.end,
				adjustmentPt: e.adjustmentPt
			}))];
			t[t.length - 1] = {
				...e,
				text: i,
				punctuationCompressions: a.length > 0 ? a : void 0,
				textShapeRequest: e.textShapeRequest ? {
					...e.textShapeRequest,
					text: i
				} : void 0
			};
			continue;
		}
		t.push({ ...n });
	}
	return t;
}
function jl(e, t, n, r, i, a) {
	let o = 0, s = null, c = a?.type === "snapToChars" && a.characterPitchPt != null && a.characterPitchPt > 0 ? a.characterPitchPt : null, l = () => {
		!s || c == null || (o += pc(s.naturalWidthPt, s.kind, c), s = null);
	};
	for (let u of e) {
		let e = Math.max(n, u.start), d = Math.min(r, u.end);
		if (e >= d) continue;
		let f = t.slice(e, d), p = e - u.start, m = d - u.start, h = {
			...u.segment,
			text: f,
			punctuationCompressions: $s(u.segment, p, m)
		}, g = (e) => e.textLayoutService && e.textShapeRequest ? dc(e, e.textLayoutService.shape({
			...e.textShapeRequest,
			text: e.text,
			fontSizePt: Ai(e, 1),
			measure: !0,
			clusterGeometry: !1
		}).advancePt, a, 1) : (i.context.font = Rs(e.bold, e.italic, Ai(e, 1), e.fontFamily, i.fontFamilyClasses, e.fontRoute), dc(e, i.context.measureText(e.text).width, a, 1)), _ = fc(h, a);
		if (_ === "eastAsia" && c != null) {
			l();
			let e = h.textLayoutService && h.textShapeRequest ? h.textLayoutService.shape({
				...h.textShapeRequest,
				text: f,
				fontSizePt: Ai(h, 1),
				measure: !0,
				clusterGeometry: !0
			}).clusters : void 0, t = e?.length ? null : [...new Set([
				0,
				...O(f),
				f.length
			])].sort((e, t) => e - t), n = e?.map((e) => ({
				start: e.range.start,
				end: e.range.end,
				naturalWidthPt: dc({
					...h,
					text: f.slice(e.range.start, e.range.end),
					punctuationCompressions: $s(h, e.range.start, e.range.end)
				}, e.advancePt, a, 1)
			})) ?? t.slice(0, -1).map((e, n) => {
				let r = t[n + 1];
				return {
					start: e,
					end: r,
					naturalWidthPt: g({
						...h,
						text: f.slice(e, r),
						punctuationCompressions: $s(h, e, r)
					})
				};
			}), r = 0;
			for (let e of n) e.end <= e.start || (r += qo(e.naturalWidthPt, c));
			o += pc(n.reduce((e, t) => e + t.naturalWidthPt, 0), _, c, Math.max(1, r));
		} else {
			let e = g(h);
			if ((_ === "latin" || _ === "complexScript") && c != null) {
				let t = s;
				t?.kind === _ ? s = {
					kind: _,
					naturalWidthPt: t.naturalWidthPt + e
				} : (l(), s = {
					kind: _,
					naturalWidthPt: e
				});
			} else l(), o += e;
		}
	}
	return l(), o;
}
function Ml(e, t, n) {
	let r = rl(t), i = 0;
	for (let a = 0; a < e.length; a += 1) {
		let o = e[a];
		if (!("text" in o) || o.text.length === 0) continue;
		let s = [], c = "", l = (e) => {
			let t = c.length;
			c += e.text, s.push({
				segment: e,
				start: t,
				end: c.length
			});
		};
		for (l(o); a + 1 < e.length;) {
			let t = e[a + 1];
			if (!("text" in t) || t.joinPrev !== !0) break;
			l(t), a += 1;
		}
		let u = 0;
		for (let e of zc(c)) {
			let a = e.replace(/\s+$/u, ""), o = u, l = u + a.length;
			if (u += e.length, !a) continue;
			if (!Dc(a)) {
				i = Math.max(i, jl(s, c, o, l, n, r));
				continue;
			}
			let d = [
				0,
				...O(a),
				a.length
			], f = [];
			for (let e = 1; e < d.length; e += 1) f.push({
				text: a.slice(d[e - 1], d[e]),
				start: o + d[e - 1],
				end: o + d[e]
			});
			let p = [], m = f[0];
			for (let e = 1; e < f.length; e += 1) {
				let n = [...m.text].at(-1)?.codePointAt(0), r = f[e].text.codePointAt(0);
				n !== void 0 && r !== void 0 && !t.kinsoku.lineEndForbidden.has(n) && !t.kinsoku.lineStartForbidden.has(r) ? (p.push(m), m = f[e]) : m = {
					text: m.text + f[e].text,
					start: m.start,
					end: f[e].end
				};
			}
			m && p.push(m);
			for (let e of p) i = Math.max(i, jl(s, c, e.start, e.end, n, r));
		}
	}
	return i;
}
function Nl(e, t, n) {
	let r = (n.baseRtl ? n.physicalIndentRightPt : n.physicalIndentLeftPt) + (t === 0 ? n.firstIndentPt : 0) + e.xOffset;
	return {
		startPt: r,
		endPt: r + e.segments.reduce((e, t) => e + t.measuredWidth, 0)
	};
}
function Pl(e, t, n, r, i, a, o = {}) {
	if (!Number.isFinite(n) || n < 0) throw RangeError("maximumWidthPt must be finite and non-negative");
	if (n === 0) return {
		minWidthPt: 0,
		maxWidthPt: 0
	};
	let s = Al(Gc(e.runs, i)), c = Math.max(1, n - t.physicalIndentLeftPt - t.physicalIndentRightPt), l = s.length === 0 ? [] : Kc(r.context, s, c, t.firstIndentPt, 1, [...t.tabStops], void 0, r.fontFamilyClasses, t.physicalIndentLeftPt, t.kinsoku, rl(t), t.defaultTabPt, c + t.physicalIndentRightPt, t.baseRtl, t.isJustified, t.stretchLastLine, void 0, "intrinsic", i.verticalGlyphMeasurement, t.overflowPunct !== !1), u = t.baseRtl ? t.physicalIndentLeftPt : t.physicalIndentRightPt, d = 0, f = 0;
	l.forEach((e, n) => {
		let r = Nl(e, n, t);
		d = Math.min(d, r.startPt), f = Math.max(f, r.endPt);
	});
	let p = a ? sl({
		leadingIndentPt: t.baseRtl ? t.physicalIndentRightPt : t.physicalIndentLeftPt,
		authoredFirstIndentPt: e.indentFirst,
		markerShiftPt: a.markerShiftPt,
		markerWidthPt: a.markerWidthPt
	}) : void 0;
	p && (d = Math.min(d, p.startPt), f = Math.max(f, p.endPt));
	let m = Ml(s, t, r);
	for (let e of l) {
		let t = 0, n = e.segments.reduce((e, t) => e + t.measuredWidth, 0);
		for (let r of e.segments) t += r.measuredWidth, "imagePath" in r && !r.anchor || "math" in r ? m = Math.max(m, r.measuredWidth) : "isTab" in r && (m = Math.max(m, r.resolvedAlignment === "left" ? t : n));
	}
	let h = t.baseRtl ? t.physicalIndentRightPt : t.physicalIndentLeftPt, g = o.preserveWhitespaceOnlyContent && s.length > 0 && s.every((e) => "text" in e && /^[\s\u00a0]+$/u.test(e.text)) ? s : null, _ = g ? (() => {
		let e = "";
		return jl(g.map((t) => {
			let n = e.length;
			return e += t.text, {
				segment: t,
				start: n,
				end: e.length
			};
		}), e, 0, e.length, r, rl(t));
	})() : 0;
	if (_ > 0) {
		let e = h + t.firstIndentPt;
		d = Math.min(d, e), f = Math.max(f, e + _);
	}
	let v = Math.min(n, Math.max(0, f - d + u)), y = h, b = Math.min(0, y);
	m = Math.max(m, _);
	let x = Math.max(0, y + m), S = h + t.firstIndentPt;
	return b = Math.min(b, S), x = Math.max(x, S + m), p && (b = Math.min(b, p.startPt), x = Math.max(x, p.endPt)), {
		minWidthPt: Math.min(n, Math.max(0, x - b + u)),
		maxWidthPt: v
	};
}
//#endregion
//#region packages/docx/src/layout/paragraph-border-adjacency.ts
function Fl(e, t) {
	if (!e || t?.suppressBottom) return 0;
	let n = e.bottom;
	return !n || n.style === "none" ? 0 : (n.space ?? 0) + (n.width ?? 0) / 2;
}
function Il(e) {
	return e == null || e.style === "none" ? null : e;
}
function Ll(e, t) {
	let n = Il(e), r = Il(t);
	return n == null || r == null ? n == null && r == null : n.style === r.style && n.width === r.width && (n.space ?? 0) === (r.space ?? 0) && (n.color ?? null) === (r.color ?? null);
}
function Rl(e, t) {
	return !e || !t ? !1 : Ll(e.top, t.top) && Ll(e.bottom, t.bottom) && Ll(e.left, t.left) && Ll(e.right, t.right) && Ll(e.between, t.between);
}
function zl(e) {
	return e ? [
		e.top,
		e.right,
		e.bottom,
		e.left,
		e.between
	].some((e) => e != null && e.style !== "none") : !1;
}
function Bl(e, t) {
	return !e || !t || e.framePr || t.framePr ? !1 : zl(e.borders) && zl(t.borders) && Rl(e.borders, t.borders);
}
function Vl(e, t, n, r = !1) {
	let i = (e, t) => r ? !!e && !!t && !!e.framePr && !!t.framePr && zl(e.borders) && zl(t.borders) && Rl(e.borders, t.borders) : Bl(e, t), a = i(e, t), o = i(t, n), s = t.borders?.between;
	return Object.freeze({
		top: a ? s && s.style !== "none" ? "between" : "none" : "top",
		bottom: o ? "none" : "bottom"
	});
}
//#endregion
//#region packages/docx/src/layout/frame.ts
function Hl(e, t, n, r, i, a) {
	return Pl(e, t, n, r, i, a).maxWidthPt;
}
function Ul(e) {
	let t = e;
	return it("w:framePr", [
		t.dropCap,
		t.lines,
		t.wrap,
		t.hAnchor,
		t.vAnchor,
		t.hRule,
		t.hSpace,
		t.vSpace,
		t.w ?? null,
		t.h ?? null,
		t.x ?? null,
		t.y ?? null,
		t.xAlign ?? null,
		t.yAlign ?? null,
		t.__anchorLock === !0
	]);
}
function Wl(e) {
	let t = /* @__PURE__ */ new WeakMap();
	for (let n = 0; n < e.length;) {
		let r = e[n];
		if (r?.type !== "paragraph" || !r.framePr) {
			n += 1;
			continue;
		}
		let i = Ul(r.framePr), a = [r], o = [n], s = n + 1;
		for (; s < e.length;) {
			let t = e[s];
			if (t?.type !== "paragraph" || !t.framePr || Ul(t.framePr) !== i) break;
			a.push(t), o.push(s), s += 1;
		}
		let c = Object.freeze({
			id: `${i}:${n}`,
			owner: r,
			members: Object.freeze(a),
			sourceIndices: Object.freeze(o),
			framePr: r.framePr
		});
		for (let e of a) t.set(e, c);
		n = s;
	}
	return t;
}
var Gl = /* @__PURE__ */ new WeakMap(), Kl = /* @__PURE__ */ new WeakMap();
function ql(e) {
	let t = Wl(e);
	for (let n = 0; n < e.length; n += 1) {
		let r = e[n];
		if (r.type !== "paragraph") continue;
		let i = t.get(r);
		i && Gl.set(r, i);
		let a = e[n - 1], o = e[n + 1], s = a?.type === "paragraph" && t.get(a) === i ? a : null, c = o?.type === "paragraph" && t.get(o) === i ? o : null;
		Kl.set(r, Vl(i ? s : a?.type === "paragraph" ? a : null, r, i ? c : o?.type === "paragraph" ? o : null, i !== void 0));
	}
}
var Jl = (e) => Gl.get(e), Yl = (e) => Kl.get(e);
//#endregion
//#region packages/docx/src/layout-context.ts
function Xl(e) {
	return {
		story: e.story,
		containers: [...e.containers, { kind: "tableCell" }],
		lineNumberingEligible: !1
	};
}
function Zl(e) {
	return e.runs.some((e) => e.type === "text" && !!e.ruby);
}
function Ql(e) {
	return e.runs.some((e) => e.type === "text" && ji.test(e.text));
}
function $l(e) {
	for (let t of e) {
		if (t.type === "paragraph") {
			if (Ql(t)) return !0;
			continue;
		}
		if (t.type === "table") {
			for (let e of t.rows) for (let t of e.cells) if ($l(t.content)) return !0;
		}
	}
	return !1;
}
function eu(e, t = { normalStyleFontSizePt: 10 }) {
	return ql(e.body), {
		kinsoku: se(e.settings),
		defaultTabPt: Vc(e.settings),
		characterSpacingControl: e.settings?.characterSpacingControl,
		mathDefJc: e.settings?.mathDefJc,
		documentHasEastAsianText: $l(e.body),
		normalStyleFontSizePt: t.normalStyleFontSizePt,
		compat: {
			adjustLineHeightInTable: e.settings?.adjustLineHeightInTable ?? !1,
			useFeLayout: e.settings?.useFeLayout ?? !1,
			balanceSingleByteDoubleByteWidth: e.settings?.balanceSingleByteDoubleByteWidth ?? !1
		}
	};
}
function tu(e) {
	let t = e.pageWidth - e.marginLeft - e.marginRight, n = e.columns;
	if (!n || n.count <= 1) return [{
		xPt: e.marginLeft,
		wPt: Math.max(1, t)
	}];
	if (!n.equalWidth && n.cols.length > 0) {
		let t = [], r = e.marginLeft;
		for (let e of n.cols) t.push({
			xPt: r,
			wPt: Math.max(1, e.widthPt)
		}), r += e.widthPt + e.spacePt;
		return t;
	}
	let r = Math.max(1, (t - (n.count - 1) * n.spacePt) / n.count);
	return Array.from({ length: n.count }, (t, i) => ({
		xPt: e.marginLeft + i * (r + n.spacePt),
		wPt: r
	}));
}
function nu(e) {
	switch (e) {
		case "lines":
		case "linesAndChars":
		case "snapToChars": return e;
		default: return "none";
	}
}
function ru(e) {
	return e === "lines" || e === "linesAndChars" || e === "snapToChars";
}
function iu(e) {
	return e === "linesAndChars" || e === "snapToChars";
}
function au(e, t) {
	return {
		geometry: {
			pageWidth: t.pageWidth,
			pageHeight: t.pageHeight,
			marginTop: t.marginTop,
			marginRight: t.marginRight,
			marginBottom: t.marginBottom,
			marginLeft: t.marginLeft,
			headerDistance: t.headerDistance,
			footerDistance: t.footerDistance
		},
		columns: tu(t),
		columnSeparator: t.columns?.sep === !0,
		grid: {
			kind: nu(t.docGridType),
			linePitchPt: t.docGridLinePitch ?? null,
			charSpacePt: t.docGridCharSpace == null ? null : t.docGridCharSpace / 4096
		},
		textDirection: t.textDirection ?? "lrTb",
		sectionBidi: !1,
		verticalAlignment: t.vAlign ?? "top",
		lineNumbering: t.lineNumbering ?? void 0
	};
}
function ou(e) {
	return e.containers.some((e) => e.kind === "tableCell");
}
function su(e, t, n, r) {
	let i = ru(t.grid.kind) && t.grid.linePitchPt != null && t.grid.linePitchPt > 0 && r.snapToGrid !== !1 && r.lineSpacing?.rule !== "exact" && (!ou(n) || e.compat.adjustLineHeightInTable), a = iu(t.grid.kind), o = r.bidi === !0, s = ou(n), c = a ? e.normalStyleFontSizePt + (t.grid.charSpacePt ?? 0) : null, l = t.grid.kind === "linesAndChars" ? c : null, u = r.numbering, d = u != null && (u.text !== "" || u.picBulletImagePath != null), f = o && d && (u.suff || "tab") === "tab" && r.indentFirst < 0;
	return {
		lineGrid: {
			active: i,
			pitchPt: i ? t.grid.linePitchPt : null
		},
		characterGrid: {
			active: a,
			kind: a ? t.grid.kind : null,
			deltaPt: a ? t.grid.charSpacePt ?? 0 : 0,
			pitchPt: c != null && c > 0 ? c : null
		},
		rightIndentGrid: {
			pitchPt: l != null && l > 0 ? l : null,
			paragraphAllowsAdjustment: r.adjustRightInd !== !1 && Jo(s)
		},
		physicalIndentLeftPt: o ? r.indentRight : r.indentLeft,
		physicalIndentRightPt: o ? r.indentLeft : r.indentRight,
		firstIndentPt: f ? 0 : r.indentFirst,
		lineSpacing: r.lineSpacing,
		spaceBeforePt: r.spaceBefore,
		spaceAfterPt: r.spaceAfter,
		baseRtl: o,
		isJustified: el(r.alignment),
		stretchLastLine: tl(r.alignment),
		tabStops: cu(r),
		hasRuby: Zl(r),
		hasEastAsianText: Ql(r),
		kinsoku: e.kinsoku,
		defaultTabPt: e.defaultTabPt,
		overflowPunct: r.overflowPunct !== !1,
		mathDefJc: e.mathDefJc
	};
}
function cu(e) {
	let t = e.tabStops.filter((e) => e.alignment !== "clear").map((e) => ({ ...e })), n = e.indentLeft, r = t.some((e) => e.pos === n && Xo(e.alignment));
	return (e.indentFirst < 0 && !r ? [{
		pos: n,
		alignment: "left",
		leader: "none"
	}, ...t] : t).sort((e, t) => e.pos - t.pos);
}
function lu(e, t) {
	let { pitchPt: n, paragraphAllowsAdjustment: r } = e.rightIndentGrid;
	return !r || n == null ? 0 : Yo(t, n);
}
U({
	id: "word-default-line-number-distance",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/compatibility.test.ts#uses Word's observed 18pt line-number distance only when omitted"
	},
	description: "ECMA-376 §17.6.8 leaves an omitted line-number distance implementation-defined. Preserve Word-compatible 18pt placement only when the authored distance is absent."
}), U({
	id: "word-continuous-section-page-number-restart",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/page-number-field-render.test.ts#restarts a spilling continuous section after its shared first page"
	},
	description: "Issue #804 records that Word anchors a continuous section page-number restart to the first physical page containing that section body content, even when another section owns the page top. An empty same-page region does not consume the restart."
}), U({
	id: "word-trailing-empty-mark-baseline-admission",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/paginate-trailing-empty-mark-fit.test.ts#KEEPS an inkless empty paragraph on the page when ink-bearing content follows and only its below-baseline whitespace overflows"
	},
	description: "At the unreserved physical body edge, Word admits an undecorated non-terminal empty paragraph mark by its baseline when later ink follows in the same flow."
}), U({
	id: "word-section-mark-blank-page-suppression",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "next-page-section-mark-bottom-edge-admission",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "For the observed nextPage boundary, Word consumes an undecorated inkless paragraph that carries the section boundary on the outgoing page instead of creating an otherwise empty intermediate page solely for that non-painting mark. The following section still starts its requested page. Other section-start kinds remain outside this observation."
}), U({
	id: "word-book-fold-gutter-right-edge",
	evidence: {
		kind: "microsoft-note",
		reference: "[MS-OI29500] §§2.1.389, 2.1.391"
	},
	description: "For book-fold printing Word places the automatic gutter at the right-margin bisector edge, including reverse book-fold mode."
});
function uu(e) {
	return e ?? 18;
}
function du(e, t, n) {
	return e + t - n;
}
function fu(e) {
	return !e.hasContinuationBoundary && e.inkless && e.undecorated && !e.keepNext && e.markReservePt === 0 && e.pageBottomIsUnreserved && e.physicalRegionBottomIsActive ? e.followsNextPageSectionBoundary ? Math.max(0, e.markExtentPt) : e.hasFollowingInk ? e.markBelowBaselinePt : 0 : 0;
}
function pu() {
	return "right";
}
//#endregion
//#region packages/docx/src/layout/context.ts
function mu(e) {
	if (e.sectionOccurrenceId.length === 0) throw RangeError("Section occurrence id must not be empty");
	if (e.columns.length === 0) throw RangeError("A page-flow section requires at least one column");
	return Object.freeze({
		sectionOccurrenceId: e.sectionOccurrenceId,
		geometry: Object.freeze({ ...e.geometry }),
		columns: Object.freeze(e.columns.map((e) => Object.freeze({ ...e }))),
		textDirection: e.textDirection,
		sectionBidi: e.sectionBidi ?? !1,
		grid: Object.freeze(e.grid ?? {
			kind: "none",
			linePitchPt: null,
			charSpacePt: null
		})
	});
}
function hu(e) {
	return _u(e.geometry.marginTop);
}
function gu(e) {
	return e.geometry.pageHeight - _u(e.geometry.marginBottom);
}
function _u(e) {
	return Math.abs(e);
}
function vu(e) {
	return {
		pageWidth: e.pageHeight,
		pageHeight: e.pageWidth,
		marginLeft: e.marginTop,
		marginTop: e.marginRight,
		marginRight: e.marginBottom,
		marginBottom: e.marginLeft,
		headerDistance: e.headerDistance,
		footerDistance: e.footerDistance
	};
}
function yu(e) {
	return {
		pageWidth: e.pageHeight,
		pageHeight: e.pageWidth,
		marginTop: e.marginLeft,
		marginRight: e.marginTop,
		marginBottom: e.marginRight,
		marginLeft: e.marginBottom,
		headerDistance: e.headerDistance,
		footerDistance: e.footerDistance
	};
}
function bu(e) {
	return e === "tbRl" || e === "tbRlV" || e === "tbLrV" || e === "btLr";
}
function xu(e, t) {
	if (!Number.isInteger(t) || t < 0) throw RangeError("Physical page index must be a non-negative integer");
	let { pageWidth: n, pageHeight: r } = e.physicalGeometry, { marginTop: i, marginRight: a, marginBottom: o, marginLeft: s } = e.physicalGeometry, c = e.bookFoldPrinting || e.bookFoldRevPrinting;
	return c ? (n /= 2, pu() === "right" && (a += e.gutterPt)) : e.printTwoOnOne ? (r /= 2, i += e.gutterPt) : e.gutterAtTop && !e.mirrorMargins ? i += e.gutterPt : e.rtlGutter ? a += e.gutterPt : s += e.gutterPt, !c && !e.printTwoOnOne && e.mirrorMargins && t % 2 == 1 && ([s, a] = [a, s]), {
		...e.physicalGeometry,
		pageWidth: n,
		pageHeight: r,
		marginTop: i,
		marginRight: a,
		marginBottom: o,
		marginLeft: s
	};
}
function Su(e, t, n) {
	let r = xu(t, n), i = bu(t.textDirection) ? vu(r) : r;
	return Object.freeze({
		...e,
		geometry: Object.freeze(i),
		columns: Object.freeze(tu({
			...i,
			titlePage: !1,
			evenAndOddHeaders: !1,
			columns: t.columns
		}).map((e) => Object.freeze(e)))
	});
}
function Cu(e) {
	return {
		pageWidth: e.pageWidth,
		pageHeight: e.pageHeight,
		marginTop: e.marginTop,
		marginRight: e.marginRight,
		marginBottom: e.marginBottom,
		marginLeft: e.marginLeft,
		headerDistance: e.headerDistance,
		footerDistance: e.footerDistance
	};
}
function wu() {
	return {
		pageWidth: 612,
		pageHeight: 792,
		marginTop: 72,
		marginRight: 72,
		marginBottom: 72,
		marginLeft: 72,
		headerDistance: 36,
		footerDistance: 36
	};
}
function Tu(e, t = !1) {
	let n = e.docGridType === "lines" || e.docGridType === "linesAndChars" || e.docGridType === "snapToChars" ? e.docGridType : "none";
	return Object.freeze({
		geometry: Object.freeze(Cu(e)),
		columns: Object.freeze(tu(e).map((e) => Object.freeze(e))),
		columnSeparator: e.columns?.sep === !0,
		grid: Object.freeze({
			kind: n,
			linePitchPt: e.docGridLinePitch ?? null,
			charSpacePt: e.docGridCharSpace == null ? null : e.docGridCharSpace / 4096
		}),
		textDirection: e.textDirection ?? "lrTb",
		sectionBidi: t,
		verticalAlignment: e.vAlign ?? "top",
		...e.lineNumbering === null || e.lineNumbering === void 0 ? {} : { lineNumbering: Object.freeze({ ...e.lineNumbering }) }
	});
}
//#endregion
//#region packages/docx/src/layout/page-border.ts
function Eu(e, t) {
	switch (e.display) {
		case "firstPage": return t;
		case "notFirstPage": return !t;
		default: return !0;
	}
}
function Du(e) {
	return e !== void 0 && /^[0-9a-fA-F]{6}$/.test(e) ? `#${e}` : "#000000";
}
function Ou(e) {
	return e !== void 0 && Number.isFinite(e.space) ? e.space : 0;
}
function ku(e, t, n, r) {
	let i = Number.isFinite(e.width) ? e.width : .5;
	return Object.freeze({
		edge: t,
		from: Object.freeze(n),
		to: Object.freeze(r),
		color: Du(e.color),
		widthPt: i,
		...ki(e.style, i)
	});
}
function Au(e, t, n, r) {
	if (!e || !Eu(e, r)) return null;
	let { geometry: i } = t, a = e.offsetFrom === "text", o = a ? i.marginLeft : 0, s = a ? i.pageWidth - i.marginRight : i.pageWidth, c = a ? _u(i.marginTop) : 0, l = a ? i.pageHeight - _u(i.marginBottom) : i.pageHeight, u = c + Ou(e.top), d = l - Ou(e.bottom), f = o + Ou(e.left), p = s - Ou(e.right), m = [];
	if (e.top && m.push(ku(e.top, "top", {
		xPt: f,
		yPt: u
	}, {
		xPt: p,
		yPt: u
	})), e.bottom && m.push(ku(e.bottom, "bottom", {
		xPt: f,
		yPt: d
	}, {
		xPt: p,
		yPt: d
	})), e.left && m.push(ku(e.left, "left", {
		xPt: f,
		yPt: u
	}, {
		xPt: f,
		yPt: d
	})), e.right && m.push(ku(e.right, "right", {
		xPt: p,
		yPt: u
	}, {
		xPt: p,
		yPt: d
	})), m.length === 0) return null;
	let h = Ei(mi(t.textDirection), n);
	return Object.freeze({
		zOrder: e.zOrder === "back" ? "back" : "front",
		logicalToPhysical: Object.freeze({ ...h.logicalToPhysical }),
		segments: Object.freeze(m)
	});
}
//#endregion
//#region packages/docx/src/layout/page-factory.ts
function ju(e, t, n) {
	return `page:${e}:region:${encodeURIComponent(t)}:column:${n}`;
}
function Mu(e) {
	return Nu(e), {
		xPt: 0,
		yPt: 0,
		widthPt: e.widthPt,
		heightPt: e.heightPt,
		contentTopPt: e.contentTopPt,
		contentBottomPt: e.contentBottomPt
	};
}
function Nu(e) {
	if (!Number.isFinite(e.widthPt) || !Number.isFinite(e.heightPt) || !Number.isFinite(e.contentTopPt) || !Number.isFinite(e.contentBottomPt) || e.widthPt <= 0 || e.heightPt <= 0 || e.contentTopPt < 0 || e.contentTopPt > e.contentBottomPt || e.contentBottomPt > e.heightPt) throw RangeError("Effective page edges must satisfy 0 <= contentTopPt <= contentBottomPt <= heightPt");
}
function Pu(e, t) {
	if (e.length === 0) throw RangeError(`${t} must not be empty`);
}
function Fu(e, t) {
	if (e && t === void 0) throw RangeError("Page-border finalization requires explicit section-owned page identity");
	return t ?? !1;
}
function Iu(e, t) {
	return e.length === t.length && e.every((e, n) => {
		let r = t[n];
		return r !== void 0 && e.xPt === r.xPt && e.wPt === r.wPt;
	});
}
function Lu(e, t) {
	return e === t || e !== void 0 && t !== void 0 && e.start === t.start && e.countBy === t.countBy && e.distance === t.distance && e.restart === t.restart;
}
function Ru(e, t) {
	return e.geometry.pageWidth === t.geometry.pageWidth && e.geometry.pageHeight === t.geometry.pageHeight && e.geometry.marginTop === t.geometry.marginTop && e.geometry.marginRight === t.geometry.marginRight && e.geometry.marginBottom === t.geometry.marginBottom && e.geometry.marginLeft === t.geometry.marginLeft && e.geometry.headerDistance === t.geometry.headerDistance && e.geometry.footerDistance === t.geometry.footerDistance && Iu(e.columns, t.columns) && e.columnSeparator === t.columnSeparator && e.textDirection === t.textDirection && e.sectionBidi === !0 == (t.sectionBidi === !0) && e.grid.kind === t.grid.kind && e.grid.linePitchPt === t.grid.linePitchPt && e.grid.charSpacePt === t.grid.charSpacePt && e.verticalAlignment === t.verticalAlignment && Lu(e.lineNumbering, t.lineNumbering);
}
function zu(e) {
	if (mi(e.section.textDirection) !== e.writingMode) throw RangeError("Section region writing mode must agree with its section text direction");
	let t = e.section.sectionBidi === !0 ? "rtl" : "ltr";
	if (e.columnFlowDirection !== void 0 && e.columnFlowDirection !== t) throw RangeError("Section region column flow direction must agree with sectPr bidi");
	let n = e.columnIndexes ?? e.section.columns.map((e, t) => t);
	if (e.columns.length !== n.length || n.some((t, r) => !Number.isInteger(t) || t < 0 || t >= e.section.columns.length || r > 0 && t <= n[r - 1]) || e.columns.some((t, r) => {
		let i = e.section.columns[n[r]];
		return i === void 0 || t.inlineStartPt !== i.xPt || t.inlineExtentPt !== i.wPt;
	})) throw RangeError("Section region columns must equal its normalized section columns");
}
function Bu(e) {
	if (!Number.isInteger(e) || e < 0) throw RangeError("Layout page index must be a non-negative integer");
}
function Vu(e, t, n) {
	let r = [], i = [], a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), c, l = [];
	for (let u of n) {
		if (Pu(u.id, "Section region id"), Pu(u.sectionOccurrenceId, "Section occurrence id"), o.has(u.id) || s.has(u.sectionOccurrenceId)) throw RangeError("Section region and occurrence identities must be unique");
		if (o.add(u.id), s.add(u.sectionOccurrenceId), c !== void 0 && c !== u.writingMode) throw RangeError("One physical page cannot mix writing modes");
		c = u.writingMode, zu(u);
		let n = bi({
			widthPt: u.section.geometry.pageWidth,
			heightPt: u.section.geometry.pageHeight
		}, u.writingMode);
		if (n.widthPt !== t.widthPt || n.heightPt !== t.heightPt) throw RangeError(`Section regions on one physical page must use the same page box: expected ${n.widthPt}x${n.heightPt}, got ${t.widthPt}x${t.heightPt}`);
		let d = yi(t, u.writingMode), f = d.widthPt, p = d.heightPt;
		if (!Number.isFinite(u.blockStartPt) || !Number.isFinite(u.blockEndPt) || u.blockStartPt < 0 || u.blockEndPt < u.blockStartPt || u.blockEndPt > p) throw RangeError("Section regions must be inside the logical page");
		if (u.columns.length === 0) throw RangeError("Section region must contain a column");
		let m = u.columnIndexes ?? u.section.columns.map((e, t) => t), h = 0, g = Ei(u.writingMode, t), _ = u.columns.map((t, n) => {
			let r = m[n];
			if (!Number.isFinite(t.inlineStartPt) || !Number.isFinite(t.inlineExtentPt) || t.inlineStartPt < 0 || t.inlineExtentPt <= 0 || t.inlineStartPt + t.inlineExtentPt > f || t.inlineStartPt < h) throw RangeError("Columns must be ordered, disjoint, and inside the logical page");
			h = t.inlineStartPt + t.inlineExtentPt;
			let o = ju(e, u.id, r);
			if (a.has(o)) throw RangeError(`Duplicate flow domain ${o}`);
			let s = {
				xPt: t.inlineStartPt,
				yPt: u.blockStartPt,
				widthPt: t.inlineExtentPt,
				heightPt: u.blockEndPt - u.blockStartPt
			}, c = wi(g.logicalToPhysical, s);
			if (l.some((e) => c.xPt < e.xPt + e.widthPt && e.xPt < c.xPt + c.widthPt && c.yPt < e.yPt + e.heightPt && e.yPt < c.yPt + c.heightPt)) throw RangeError("Section flow domains on one page must be physically disjoint");
			return l.push(c), i.push({
				id: o,
				kind: "body",
				logicalBounds: s,
				physicalBounds: c
			}), a.set(o, u.sectionOccurrenceId), o;
		});
		r.push({
			id: u.id,
			sectionOccurrenceId: u.sectionOccurrenceId,
			coordinateSpace: g,
			blockStartPt: u.blockStartPt,
			blockEndPt: u.blockEndPt,
			columnFlowDirection: u.columnFlowDirection ?? (u.section.sectionBidi === !0 ? "rtl" : "ltr"),
			columnIndexes: Object.freeze([...m]),
			flowDomainIds: _,
			section: u.section
		});
	}
	return {
		regions: r,
		domains: i,
		sectionByDomain: a
	};
}
function Hu(e, t) {
	if (e.kind === "paragraph") {
		t(e), e.drawings.forEach((e) => Hu(e, t)), e.textBoxes.forEach((e) => Hu(e, t));
		return;
	}
	if (e.kind === "table") {
		Uu(e, t);
		return;
	}
	e.kind === "textbox" && Wu(e, t);
}
function Uu(e, t) {
	for (let n of e.rows) for (let e of n.cells) for (let n of e.blocks) Hu(n.layout, t);
}
function Wu(e, t) {
	e.story.blocks.forEach((e) => Hu(e, t));
}
function Gu(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of e) {
		let e = n.get(a.flowDomainId) ?? t;
		Hu(a, (t) => {
			for (let n of t.bookmarkStarts ?? []) !n || i.has(n) || (i.add(n), r.push({
				name: n,
				nodeId: t.id,
				sectionOccurrenceId: e
			}));
		});
	}
	return r;
}
function Ku(e) {
	let t = e.sectionRegions ?? [], n = new Map(t.map((e) => [e.id, e])), r = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of e.flowDomainIds) r.set(t, e.sectionOccurrenceId);
	for (let i of e.flowDomains) {
		if (i.kind !== "footnote" && i.kind !== "endnote") continue;
		let e = i.sectionRegionId ? n.get(i.sectionRegionId) : t[0];
		e && r.set(i.id, e.sectionOccurrenceId);
	}
	return r;
}
function qu(e, t = Ku(e)) {
	return Gu(ti(e), e.sectionOccurrenceId ?? "", t);
}
function Ju(e) {
	return e.parityBlank ? e : Object.freeze({
		...e,
		bookmarkStarts: Object.freeze([...qu(e)])
	});
}
function Yu(e) {
	Bu(e.pageIndex), Pu(e.sectionOccurrenceId, "Page-start section occurrence id");
	let { regions: t, domains: n, sectionByDomain: r } = Vu(e.pageIndex, e.physicalPage, e.sectionRegions), i = e.sectionRegions[0], a = i?.pageBorders ?? e.pageBorders;
	if (i !== void 0 && (e.sectionOccurrenceId !== i.sectionOccurrenceId || !Ru(e.section, i.section))) throw RangeError("Page-start section context must equal the first section region");
	return {
		pageIndex: e.pageIndex,
		geometry: Mu(e.physicalPage),
		flowDomains: n,
		section: e.section,
		sectionOccurrenceId: e.sectionOccurrenceId,
		parityBlank: !1,
		bookmarkStarts: Gu(e.paint.map(({ node: e }) => e), e.sectionOccurrenceId, r),
		pageNumber: e.pageNumber,
		sectionRegions: t,
		columnSeparators: Oi(t),
		pageBorder: Au(a, e.section, e.physicalPage, Fu(a, e.firstSectionOwnedPage)),
		layers: Qr(e.paint),
		readingOrder: e.readingOrder.map((e) => e.id)
	};
}
function Xu(e) {
	return Bu(e.pageIndex), Pu(e.sectionOccurrenceId, "Page-start section occurrence id"), Nu(e.physicalPage), Object.freeze({
		...e,
		sectionRegions: Object.freeze([]),
		paint: Object.freeze([]),
		readingOrder: Object.freeze([])
	});
}
function Zu(e, t) {
	return Object.freeze({
		...e,
		sectionRegions: Object.freeze([...e.sectionRegions, t])
	});
}
function Qu(e, t, n) {
	return Object.freeze({
		...e,
		paint: Object.freeze([...e.paint, t]),
		readingOrder: n ? Object.freeze([...e.readingOrder, t.node]) : e.readingOrder
	});
}
function $u(e, t, n) {
	return Yu({
		...e,
		pageNumber: t,
		firstSectionOwnedPage: n
	});
}
function ed(e) {
	return Bu(e.pageIndex), Pu(e.sectionOccurrenceId, "Page-start section occurrence id"), {
		pageIndex: e.pageIndex,
		geometry: Mu(e.physicalPage),
		flowDomains: [],
		section: e.section,
		sectionOccurrenceId: e.sectionOccurrenceId,
		parityBlank: !0,
		bookmarkStarts: [],
		pageNumber: e.pageNumber,
		sectionRegions: [],
		columnSeparators: [],
		pageBorder: Au(e.pageBorders, e.section, e.physicalPage, Fu(e.pageBorders, e.firstSectionOwnedPage)),
		layers: Qr([]),
		readingOrder: []
	};
}
//#endregion
//#region packages/docx/src/layout/rect-union.ts
function td(e) {
	if (e.length === 0) return null;
	let t = Math.min(...e.map((e) => e.xPt)), n = Math.min(...e.map((e) => e.yPt)), r = Math.max(...e.map((e) => e.xPt + e.widthPt)), i = Math.max(...e.map((e) => e.yPt + e.heightPt));
	return {
		xPt: t,
		yPt: n,
		widthPt: r - t,
		heightPt: i - n
	};
}
//#endregion
//#region packages/docx/src/layout/invariants.ts
var nd = {
	FLOW_OVERLAP: !0,
	BOTTOM_MARGIN_INVASION: !0,
	FLOW_DOMAIN_INVASION: !0,
	INVALID_REFERENCE: !0,
	INVALID_GEOMETRY: !0,
	INVALID_VALUE: !0,
	MISSING_RESOURCE: !0,
	NON_CONVERGENCE: !0,
	UNSUPPORTED_FEATURE: !0
}, rd = {
	body: !0,
	header: !0,
	footer: !0,
	footnote: !0,
	endnote: !0,
	textbox: !0
}, id = new Set(Object.keys(nd)), ad = new Set(Object.keys(rd));
function od(e, t, n = /* @__PURE__ */ new WeakSet()) {
	if (!(e === null || typeof e == "string" || typeof e == "boolean")) {
		if (typeof e == "number") {
			if (!Number.isFinite(e)) throw new V("INVALID_GEOMETRY", `${t} is not finite`);
			return;
		}
		if (typeof e != "object") throw new V("INVALID_GEOMETRY", `${t} contains ${typeof e}`);
		if (n.has(e)) throw new V("INVALID_GEOMETRY", `${t} contains a cycle`);
		n.add(e);
		try {
			if (Array.isArray(e)) {
				let r = 0;
				for (let i of Reflect.ownKeys(e)) {
					if (i === "length") continue;
					if (typeof i != "string") throw new V("INVALID_GEOMETRY", `${t} has a symbol key`);
					let a = Number(i);
					if (!Number.isInteger(a) || a < 0 || String(a) !== i || a >= e.length) throw new V("INVALID_GEOMETRY", `${t}.${i} is not an array index`);
					let o = Object.getOwnPropertyDescriptor(e, i);
					if (!o?.enumerable || !("value" in o)) throw new V("INVALID_GEOMETRY", `${t}[${i}] is not plain data`);
					od(o.value, `${t}[${i}]`, n), r += 1;
				}
				if (r !== e.length) throw new V("INVALID_GEOMETRY", `${t} is sparse`);
				return;
			}
			let r = Object.getPrototypeOf(e);
			if (r !== Object.prototype && r !== null) throw new V("INVALID_GEOMETRY", `${t} is not a plain record`);
			for (let r of Reflect.ownKeys(e)) {
				if (typeof r != "string") throw new V("INVALID_GEOMETRY", `${t} has a symbol key`);
				let i = Object.getOwnPropertyDescriptor(e, r);
				if (!i?.enumerable || !("value" in i)) throw new V("INVALID_GEOMETRY", `${t}.${r} is not plain data`);
				od(i.value, `${t}.${r}`, n);
			}
		} finally {
			n.delete(e);
		}
	}
}
function J(e, t) {
	if (!Number.isFinite(e)) throw new V("INVALID_GEOMETRY", `${t} is not finite`);
}
function sd(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function cd(e, t) {
	if (!sd(e)) throw new V("INVALID_GEOMETRY", `${t} is not a point`);
	J(e.xPt, `${t}.xPt`), J(e.yPt, `${t}.yPt`);
}
function ld(e, t) {
	if (cd(e, t), J(e.widthPt, `${t}.widthPt`), J(e.heightPt, `${t}.heightPt`), e.widthPt < 0 || e.heightPt < 0) throw new V("INVALID_GEOMETRY", `${t} has a negative extent`);
}
function ud(e, t) {
	if (!sd(e)) throw new V("INVALID_GEOMETRY", `${t} is not a matrix`);
	for (let n of [
		"a",
		"b",
		"c",
		"d",
		"e",
		"f"
	]) J(e[n], `${t}.${n}`);
}
function dd(e, t) {
	if (e !== "horizontal-tb" && e !== "vertical-rl" && e !== "vertical-lr") throw new V("INVALID_GEOMETRY", `${t} is unsupported`);
}
function fd(e, t) {
	if (!sd(e)) throw new V("INVALID_GEOMETRY", `${t} is not a coordinate space`);
	dd(e.writingMode, `${t}.writingMode`), ud(e.logicalToPhysical, `${t}.logicalToPhysical`), ud(e.physicalToLogical, `${t}.physicalToLogical`);
}
function pd(e, t) {
	let { plan: n } = e;
	if (od(n, `${t}.plan`), J(n.rect.x, `${t}.plan.rect.x`), J(n.rect.y, `${t}.plan.rect.y`), J(n.rect.w, `${t}.plan.rect.w`), J(n.rect.h, `${t}.plan.rect.h`), n.rect.w < 0 || n.rect.h < 0) throw new V("INVALID_GEOMETRY", `${t}.plan.rect has a negative extent`);
	if (J(n.transform.rotationDeg, `${t}.plan.transform.rotationDeg`), n.geometry.kind === "preset") {
		if (n.geometry.name.length === 0) throw new V("INVALID_GEOMETRY", `${t}.plan.geometry.name is empty`);
		n.geometry.adjustments.forEach((e, n) => {
			e !== null && J(e, `${t}.plan.geometry.adjustments[${n}]`);
		});
	} else n.geometry.subpaths.forEach((e, n) => {
		e.forEach((e, r) => {
			if (e.cmd.length === 0) throw new V("INVALID_GEOMETRY", `${t}.plan.geometry.subpaths[${n}][${r}].cmd is empty`);
		});
	});
	if (n.stroke && (J(n.stroke.width, `${t}.plan.stroke.width`), n.stroke.width < 0)) throw new V("INVALID_GEOMETRY", `${t}.plan.stroke.width is negative`);
}
function md(e, t) {
	if (e <= t) return !0;
	let n = 2 ** -52 * Math.max(1, Math.abs(e), Math.abs(t));
	return e - t <= n;
}
function hd(e, t) {
	return e < t && !md(t, e);
}
function gd(e, t) {
	return hd(e.xPt, t.xPt + t.widthPt) && hd(t.xPt, e.xPt + e.widthPt) && hd(e.yPt, t.yPt + t.heightPt) && hd(t.yPt, e.yPt + e.heightPt);
}
function _d(e, t) {
	return md(e.xPt, t.xPt) && md(e.yPt, t.yPt) && md(t.xPt + t.widthPt, e.xPt + e.widthPt) && md(t.yPt + t.heightPt, e.yPt + e.heightPt);
}
function vd(e, t) {
	return md(e.xPt, t.xPt) && md(t.xPt + t.widthPt, e.xPt + e.widthPt);
}
function yd(e, t, n) {
	return md(e, n.yPt) && md(n.yPt + n.heightPt, t);
}
function bd(e, t) {
	return md(e.yPt, t.yPt) && md(t.yPt + t.heightPt, e.yPt + e.heightPt);
}
function xd(e, t) {
	return e.xPt === t.xPt && e.yPt === t.yPt && e.widthPt === t.widthPt && e.heightPt === t.heightPt;
}
function Sd(e, t) {
	return e.a === t.a && e.b === t.b && e.c === t.c && e.d === t.d && e.e === t.e && e.f === t.f;
}
function Cd(e, t) {
	let n = e.pageBorder;
	if (n === null) return;
	if (n.zOrder !== "front" && n.zOrder !== "back") throw new V("INVALID_REFERENCE", `${t}.zOrder is invalid`);
	ud(n.logicalToPhysical, `${t}.logicalToPhysical`);
	let r = Ei(mi(e.section.textDirection), e.geometry).logicalToPhysical;
	if (!Sd(n.logicalToPhysical, r)) throw new V("INVALID_GEOMETRY", `${t}.logicalToPhysical contradicts the page-start section`);
	if (!Array.isArray(n.segments) || n.segments.length === 0) throw new V("INVALID_GEOMETRY", `${t}.segments is empty`);
	n.segments.forEach((e, n) => {
		let r = `${t}.segments[${n}]`;
		if (cd(e.from, `${r}.from`), cd(e.to, `${r}.to`), J(e.widthPt, `${r}.widthPt`), e.from.xPt !== e.to.xPt && e.from.yPt !== e.to.yPt) throw new V("INVALID_GEOMETRY", `${r} is not an axis-aligned page edge`);
		if (!/^#[0-9a-fA-F]{6}$/.test(e.color)) throw new V("INVALID_REFERENCE", `${r}.color is invalid`);
	});
}
function wd(e, t, n) {
	if (n.has(e)) throw new V("INVALID_REFERENCE", `duplicate retained node id ${e}`);
	n.add(e), t.add(e);
}
function Td(e, t, n) {
	if (wd(e.id, t, n), e.kind === "paragraph") {
		e.drawings.forEach((e) => Td(e, t, n)), e.textBoxes.forEach((e) => Td(e, t, n));
		return;
	}
	if (e.kind === "table") {
		e.rows.forEach((e) => {
			wd(e.id, t, n), e.cells.forEach((e) => {
				wd(e.id, t, n), e.blocks.forEach((e) => Td(e.layout, t, n));
			});
		});
		return;
	}
	if (e.kind === "note") {
		e.story.blocks.forEach((e) => Td(e, t, n));
		return;
	}
	e.kind === "textbox" && e.story.blocks.forEach((e) => Td(e, t, n));
}
function Ed(e, t) {
	if (e.kind === "paragraph") {
		let n = td(e.drawings.filter((e) => e.anchorLayer?.cellContainment === !0).map((e) => e.flowBounds));
		if (e.cellContainmentBounds && ld(e.cellContainmentBounds, `${t}.cellContainmentBounds`), n === null != (e.cellContainmentBounds === void 0) || n && e.cellContainmentBounds && !xd(n, e.cellContainmentBounds)) throw new V("INVALID_GEOMETRY", `${t}.cellContainmentBounds does not match its retained layoutInCell drawings`);
		let r = /* @__PURE__ */ new Set();
		(e.anchorCollisions ?? []).forEach((e, n) => {
			let i = `${t}.anchorCollisions[${n}]`;
			if (e.occurrenceId.length === 0 || r.has(e.occurrenceId)) throw new V("INVALID_REFERENCE", `${i}.occurrenceId is empty or duplicated`);
			if (r.add(e.occurrenceId), ld(e.bounds, `${i}.bounds`), e.horizontalOwnership !== "page" && e.horizontalOwnership !== "host" || e.verticalOwnership !== "page" && e.verticalOwnership !== "host") throw new V("INVALID_REFERENCE", `${i} has invalid axis ownership`);
		}), e.textBoxes.forEach((e, n) => Ed(e, `${t}.textBoxes[${n}]`));
		return;
	}
	if (e.kind === "table") {
		e.rows.forEach((e, n) => e.cells.forEach((e, r) => e.blocks.forEach((e, i) => Ed(e.layout, `${t}.rows[${n}].cells[${r}].blocks[${i}]`))));
		return;
	}
	e.kind === "textbox" && e.story.blocks.forEach((e, n) => Ed(e, `${t}.story.blocks[${n}]`));
}
function Dd(e, t) {
	if (e.orientation === "upright-physical" && !e.transform) throw new V("INVALID_GEOMETRY", `${t} upright physical drawing is missing its logical transform`);
	if (e.transform) for (let n of [
		"a",
		"b",
		"c",
		"d",
		"e",
		"f"
	]) J(e.transform[n], `${t}.transform.${n}`);
	e.clip?.kind === "rect" && ld(e.clip.rect, `${t}.clip.rect`), e.clip?.kind === "polygon" && e.clip.points.forEach((e, n) => cd(e, `${t}.clip.points[${n}]`)), e.commands.forEach((e, n) => {
		let r = `${t}.commands[${n}]`;
		if (e.kind !== "noop") {
			if (e.kind === "drawingml-shape") {
				pd(e, r);
				return;
			}
			if (e.kind === "drawingml-image-fill") {
				if (pd(e, r), e.resourceKey.length === 0) throw new V("INVALID_GEOMETRY", `${r}.resourceKey is empty`);
				if (e.fillRect) for (let t of [
					"l",
					"t",
					"r",
					"b"
				]) J(e.fillRect[t], `${r}.fillRect.${t}`);
				return;
			}
			if (ld(e.rect, `${r}.rect`), e.kind === "stroke-rect" && (J(e.lineWidthPt, `${r}.lineWidthPt`), e.dashPt.forEach((e, t) => J(e, `${r}.dashPt[${t}]`))), e.kind === "text" && (J(e.fontSizePt, `${r}.fontSizePt`), J(e.fontWeight, `${r}.fontWeight`)), e.kind === "watermark-text") {
				if (ld(e.sourceBounds, `${r}.sourceBounds`), e.sourceBounds.widthPt <= 0 || e.sourceBounds.heightPt <= 0) throw new V("INVALID_GEOMETRY", `${r}.sourceBounds must have positive extents`);
				if (J(e.opacity, `${r}.opacity`), J(e.rotationDeg, `${r}.rotationDeg`), J(e.fontSizePt, `${r}.fontSizePt`), e.opacity < 0 || e.opacity > 1 || e.fontSizePt <= 0) throw new V("INVALID_GEOMETRY", `${r} has invalid textPath paint metrics`);
				e.spans.forEach((e, t) => {
					J(e.advancePt, `${r}.spans[${t}].advancePt`), J(e.fontWeight, `${r}.spans[${t}].fontWeight`);
				});
			}
		}
	});
}
function Od(e) {
	od(e, "layout"), e.diagnostics.forEach((e, t) => {
		let n = `diagnostics[${t}]`;
		if (!id.has(e.code)) throw new V("INVALID_REFERENCE", `${n}.code is unknown`);
		if (e.severity !== "warning" && e.severity !== "error") throw new V("INVALID_REFERENCE", `${n}.severity is unknown`);
		if (typeof e.message != "string" || e.message.length === 0) throw new V("INVALID_REFERENCE", `${n}.message is empty`);
		if (e.source !== void 0 && (!ad.has(e.source.story) || typeof e.source.storyInstance != "string" || e.source.storyInstance.length === 0 || !Array.isArray(e.source.path) || e.source.path.some((e) => !Number.isSafeInteger(e) || e < 0))) throw new V("INVALID_REFERENCE", `${n}.source is invalid`);
	});
	let t = /* @__PURE__ */ new Set();
	e.pages.forEach((e, n) => {
		if (!Number.isInteger(e.pageIndex) || e.pageIndex !== n) throw new V("INVALID_REFERENCE", `pages[${n}] has invalid page index ${e.pageIndex}`);
		if (ld(e.geometry, `pages[${n}].geometry`), J(e.geometry.contentTopPt, `pages[${n}].geometry.contentTopPt`), J(e.geometry.contentBottomPt, `pages[${n}].geometry.contentBottomPt`), e.geometry.widthPt <= 0 || e.geometry.heightPt <= 0 || e.geometry.contentTopPt < 0 || e.geometry.contentTopPt > e.geometry.contentBottomPt || e.geometry.contentBottomPt > e.geometry.heightPt) throw new V("INVALID_GEOMETRY", `pages[${n}] has invalid effective page edges`);
		Cd(e, `pages[${n}].pageBorder`);
		let r = /* @__PURE__ */ new Map();
		if (e.flowDomains.forEach((e, t) => {
			if (ld(e.logicalBounds, `pages[${n}].flowDomains[${t}].logicalBounds`), ld(e.physicalBounds, `pages[${n}].flowDomains[${t}].physicalBounds`), r.has(e.id)) throw new V("INVALID_REFERENCE", `duplicate flow domain ${e.id}`);
			r.set(e.id, e);
		}), e.parityBlank && (e.flowDomains.length > 0 || (e.sectionRegions?.length ?? 0) > 0 || (e.columnSeparators?.length ?? 0) > 0 || ei(e).length > 0 || e.layers.roots.length > 0 || e.readingOrder.length > 0 || (e.bookmarkStarts?.length ?? 0) > 0)) throw new V("INVALID_REFERENCE", `pages[${n}] parity blank retains page content`);
		let i = /* @__PURE__ */ new Set();
		if (e.sectionOccurrenceId !== void 0) {
			if (e.sectionOccurrenceId.length === 0) throw new V("INVALID_REFERENCE", `pages[${n}] has an empty section occurrence id`);
			i.add(e.sectionOccurrenceId);
		}
		let a = /* @__PURE__ */ new Map();
		if (e.sectionRegions) {
			let t = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Map(), c = [], l;
			if (e.sectionRegions.forEach((u, d) => {
				let f = `pages[${n}].sectionRegions[${d}]`;
				if (u.id.length === 0 || t.has(u.id)) throw new V("INVALID_REFERENCE", `${f} has an invalid region id`);
				if (t.add(u.id), u.sectionOccurrenceId.length === 0) throw new V("INVALID_REFERENCE", `${f} has an empty section occurrence id`);
				if (o.has(u.sectionOccurrenceId)) throw new V("INVALID_REFERENCE", `${f} has a duplicate section occurrence id`);
				o.add(u.sectionOccurrenceId), i.add(u.sectionOccurrenceId), fd(u.coordinateSpace, `${f}.coordinateSpace`);
				let p = u.coordinateSpace.writingMode;
				if (l !== void 0 && l !== p) throw new V("INVALID_GEOMETRY", `${f} mixes coordinate systems on one physical page`);
				l = p;
				let m;
				try {
					m = mi(u.section.textDirection);
				} catch (e) {
					throw new V("INVALID_GEOMETRY", `${f}.section.textDirection is unsupported: ${e.message}`);
				}
				if (p !== m) throw new V("INVALID_GEOMETRY", `${f} writing mode contradicts its section text direction`);
				let h = yi(e.geometry, p), g = bi({
					widthPt: u.section.geometry.pageWidth,
					heightPt: u.section.geometry.pageHeight
				}, p);
				if (g.widthPt !== e.geometry.widthPt || g.heightPt !== e.geometry.heightPt) throw new V("INVALID_GEOMETRY", `${f} section geometry does not match the upright physical page`);
				if (J(u.blockStartPt, `${f}.blockStartPt`), J(u.blockEndPt, `${f}.blockEndPt`), u.columnFlowDirection !== "ltr" && u.columnFlowDirection !== "rtl") throw new V("INVALID_GEOMETRY", `${f} has an invalid column flow direction`);
				let _ = u.section.sectionBidi === !0 ? "rtl" : "ltr";
				if (u.columnFlowDirection !== _) throw new V("INVALID_GEOMETRY", `${f} column flow direction contradicts its section bidi`);
				if (u.blockStartPt < 0 || u.blockEndPt < u.blockStartPt || u.blockEndPt > h.heightPt) throw new V("INVALID_GEOMETRY", `${f} has an invalid block interval`);
				let v = Ei(u.coordinateSpace.writingMode, e.geometry);
				if (!Sd(u.coordinateSpace.logicalToPhysical, v.logicalToPhysical) || !Sd(u.coordinateSpace.physicalToLogical, v.physicalToLogical)) throw new V("INVALID_GEOMETRY", `${f} has an invalid coordinate transform`);
				let y = u.columnIndexes;
				if (u.flowDomainIds.length !== y.length || y.some((e, t) => !Number.isInteger(e) || e < 0 || e >= u.section.columns.length || t > 0 && e <= y[t - 1])) throw new V("INVALID_GEOMETRY", `${f} columns contradict its section`);
				let b = 0;
				u.flowDomainIds.forEach((t, n) => {
					let i = r.get(t);
					if (!i) throw new V("INVALID_REFERENCE", `${f} references missing flow domain ${t}`);
					if (i.kind !== "body") throw new V("INVALID_REFERENCE", `${f} owns non-body flow domain ${t}`);
					s.set(t, (s.get(t) ?? 0) + 1), a.set(t, u);
					let o = i.logicalBounds, l = u.section.columns[y[n]];
					if (o.widthPt <= 0 || o.heightPt < 0 || o.yPt !== u.blockStartPt || o.heightPt !== u.blockEndPt - u.blockStartPt || o.xPt < 0 || o.xPt < b || o.xPt + o.widthPt > h.widthPt || l === void 0 || o.xPt !== l.xPt || o.widthPt !== l.wPt) throw new V("INVALID_GEOMETRY", `${t} is not the section column's non-negative logical region`);
					if (b = o.xPt + o.widthPt, !xd(wi(u.coordinateSpace.logicalToPhysical, i.logicalBounds), i.physicalBounds)) throw new V("INVALID_GEOMETRY", `${t} physical bounds do not match its section region transform`);
					if (!_d(e.geometry, i.physicalBounds)) throw new V("INVALID_GEOMETRY", `${t} physical bounds leave the upright physical page`);
					if (c.some((e) => e.regionId !== u.id && gd(e.bounds, i.physicalBounds))) throw new V("INVALID_GEOMETRY", `${t} overlaps a body flow domain owned by another section region`);
					c.push({
						regionId: u.id,
						bounds: i.physicalBounds
					});
				});
			}), e.flowDomains.filter((e) => e.kind === "body").forEach((e) => {
				if (s.get(e.id) !== 1) throw new V("INVALID_REFERENCE", `${e.id} has invalid section region ownership`);
			}), !e.parityBlank && e.sectionRegions.length > 0) {
				let t = e.sectionRegions[0];
				if (e.sectionOccurrenceId !== t.sectionOccurrenceId) throw new V("INVALID_REFERENCE", `pages[${n}] page-start section occurrence does not match its first region`);
				if (!Ru(e.section, t.section)) throw new V("INVALID_GEOMETRY", `pages[${n}] page-start section facts do not match its first region`);
			}
		}
		let o = Oi(e.sectionRegions ?? []);
		if (!Array.isArray(e.columnSeparators) || e.columnSeparators.length !== o.length || e.columnSeparators.some((e, t) => {
			let n = o[t];
			return n === void 0 || e.start.xPt !== n.start.xPt || e.start.yPt !== n.start.yPt || e.end.xPt !== n.end.xPt || e.end.yPt !== n.end.yPt;
		})) throw new V("INVALID_GEOMETRY", `pages[${n}].columnSeparators contradict the retained section regions`);
		let s = new Map(e.sectionRegions.map((e) => [e.id, e]));
		for (let t of e.flowDomains) {
			if (t.kind !== "footnote" && t.kind !== "endnote") continue;
			let n = t.sectionRegionId ? s.get(t.sectionRegionId) : e.sectionRegions[0];
			if (!n) throw new V("INVALID_REFERENCE", `${t.id} references missing page story region ${t.sectionRegionId ?? "<default>"}`);
			if (!xd(wi(n.coordinateSpace.logicalToPhysical, t.logicalBounds), t.physicalBounds)) throw new V("INVALID_GEOMETRY", `${t.id} physical bounds do not match the page story transform`);
			a.set(t.id, n);
		}
		for (let t of e.flowDomains) if (!a.has(t.id) && !xd(t.logicalBounds, t.physicalBounds)) throw new V("INVALID_GEOMETRY", `${t.id} has unequal logical and physical bounds without a section region`);
		if (e.pageNumber) {
			if (J(e.pageNumber.displayNumber, `pages[${n}].pageNumber.displayNumber`), !Number.isInteger(e.pageNumber.displayNumber)) throw new V("INVALID_GEOMETRY", `pages[${n}] page number is not an integer`);
			if (e.pageNumber.format.length === 0 || !i.has(e.pageNumber.sectionOccurrenceId)) throw new V("INVALID_REFERENCE", `pages[${n}] has an invalid page number section owner`);
		}
		let c = [];
		try {
			ti(e);
		} catch (e) {
			throw e instanceof Zr ? new V("INVALID_REFERENCE", e.message) : e;
		}
		let l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Set();
		ei(e).forEach(({ node: e }, i) => {
			let o = `pages[${n}].nodes[${i}]`;
			l.set(e.id, e), Td(e, u, t), Ed(e, o), ld(e.flowBounds, `${o}.flowBounds`), ld(e.inkBounds, `${o}.inkBounds`), e.clipBounds && ld(e.clipBounds, `${o}.clipBounds`), J(e.advancePt, `${o}.advancePt`), e.kind === "drawing" && Dd(e, o);
			let s = r.get(e.flowDomainId);
			if (!s) throw new V("INVALID_REFERENCE", `${e.id} references missing flow domain ${e.flowDomainId}`);
			if (e.ordinaryFlow && s.kind === "body" && s.logicalBounds.heightPt === 0) throw new V("FLOW_DOMAIN_INVASION", `${e.id} claims ordinary flow in an empty body domain`);
			if (!e.ordinaryFlow) return;
			let d = s.kind === "body" ? a.get(s.id) : void 0;
			if (s.kind === "body") {
				if (!d) throw new V("INVALID_REFERENCE", `${e.id} references a body flow domain without a section region`);
				if (!md(e.flowBounds.yPt + e.flowBounds.heightPt, d.blockEndPt)) throw new V("BOTTOM_MARGIN_INVASION", `${e.id} crosses logical block end`);
			}
			if (!(d ? yd(d.blockStartPt, d.blockEndPt, e.flowBounds) && (e.kind === "table" || vd(s.logicalBounds, e.flowBounds)) : e.kind === "table" ? bd(s.logicalBounds, e.flowBounds) : _d(s.logicalBounds, e.flowBounds))) throw new V("FLOW_DOMAIN_INVASION", `${e.id} crosses flow domain ${s.id}`);
			c.push(e);
		});
		let d = /* @__PURE__ */ new Set();
		if (e.readingOrder.forEach((e) => {
			if (!l.has(e) || d.has(e)) throw new V("INVALID_REFERENCE", `invalid reading-order reference ${e}`);
			d.add(e);
		}), e.bookmarkStarts !== void 0) {
			let t = qu(e, new Map([...a].map(([e, t]) => [e, t.sectionOccurrenceId]))), r = t.every((e) => e.sectionOccurrenceId.length > 0 && i.has(e.sectionOccurrenceId)), o = e.bookmarkStarts.length === t.length && e.bookmarkStarts.every((e, n) => {
				let r = t[n];
				return r !== void 0 && e.name === r.name && e.nodeId === r.nodeId && e.sectionOccurrenceId === r.sectionOccurrenceId;
			});
			if (!r || !o) throw new V("INVALID_REFERENCE", `pages[${n}] bookmark metadata does not match its retained graph (invalid bookmark node or ownership)`);
		}
		for (let e = 0; e < c.length; e += 1) for (let t = e + 1; t < c.length; t += 1) {
			let n = c[e], i = c[t];
			if (!n || !i) continue;
			let a = r.get(n.flowDomainId), o = r.get(i.flowDomainId), s = n.flowDomainId === i.flowDomainId, l = a?.kind === "body" && (o?.kind === "footnote" || o?.kind === "endnote") || o?.kind === "body" && (a?.kind === "footnote" || a?.kind === "endnote"), u = a?.id !== o?.id && (a?.kind === "footnote" || a?.kind === "endnote") && (o?.kind === "footnote" || o?.kind === "endnote");
			if ((s || l || u) && gd(n.flowBounds, i.flowBounds)) throw new V("FLOW_OVERLAP", `${n.id} overlaps ${i.id}`);
		}
	});
}
function kd(e) {
	try {
		Od(e);
	} catch (e) {
		throw e instanceof V ? e : e instanceof TypeError || e instanceof RangeError ? new V("INVALID_GEOMETRY", e.message) : e;
	}
}
function Ad(e, t) {
	if (typeof e != "object" || !e) {
		if (typeof e == "number" && !Number.isFinite(e)) throw new V("INVALID_GEOMETRY", "retained layout contains a non-finite number");
		return e;
	}
	if (t.has(e)) return e;
	t.add(e);
	for (let n of Object.values(e)) Ad(n, t);
	return Object.freeze(e);
}
var jd = /* @__PURE__ */ new WeakSet(), Md = /* @__PURE__ */ new WeakSet();
function Nd(e) {
	if (jd.has(e)) return e;
	let t = Ad(e, /* @__PURE__ */ new WeakSet());
	return jd.add(t), t;
}
function Pd(e) {
	return jd.has(e) ? e : (kn() && od(e, "layout"), Nd(e));
}
function Fd(e) {
	if (Md.has(e)) return e;
	kd(e);
	let t = Nd(e);
	return Md.add(t), t;
}
//#endregion
//#region packages/docx/src/layout/variant-store.ts
function Id(e, t) {
	if (!Number.isInteger(t) || t < 0 || t >= e.pages.length) throw RangeError(`Page index ${t} out of range (count: ${e.pages.length})`);
	return e.pages[t];
}
var Ld = class {
	#e;
	#t;
	#n = /* @__PURE__ */ new Map();
	#r;
	#i;
	#a = null;
	#o = /* @__PURE__ */ new Set();
	constructor(e, t, n) {
		this.#e = e, this.#r = Object.freeze({ ...t }), this.#i = si(this.#r, this.#e), this.#t = n;
	}
	get defaultLayout() {
		return this.layoutFor(this.#r);
	}
	layoutFor(e) {
		return this.select(e).layout;
	}
	select(e) {
		let t = Object.isFrozen(e) ? e : Object.freeze({ ...e }), n = si(t, this.#e), r = this.#n.get(n);
		return r || (this.#c(n, t), r = Pd(this.#t(t)), this.#n.set(n, r)), Object.freeze({
			key: n,
			options: t,
			layout: r
		});
	}
	selectPage(e, t) {
		let n = this.select(e);
		return Object.freeze({
			...n,
			page: Id(n.layout, t)
		});
	}
	prime(e, t) {
		let n = Object.isFrozen(e) ? e : Object.freeze({ ...e }), r = si(n, this.#e);
		return this.#n.get(r) || this.#s(r, n, t);
	}
	replaceIfCurrent(e, t, n) {
		let r = Object.isFrozen(e) ? e : Object.freeze({ ...e }), i = si(r, this.#e);
		return (this.#n.get(i) ?? null) === t ? this.#s(i, r, n) : null;
	}
	#s(e, t, n) {
		this.#c(e, t);
		let r = Pd(n);
		return this.#n.set(e, r), r;
	}
	#c(e, t) {
		if (e !== this.#i) {
			if (this.#a !== t.currentDateMs) {
				for (let e of this.#o) this.#n.delete(e);
				this.#o.clear(), this.#a = t.currentDateMs;
			}
			this.#o.add(e);
		}
	}
	hasLayoutFor(e) {
		return this.#n.has(si(e, this.#e));
	}
	isDefault(e) {
		return si(e, this.#e) === this.#i;
	}
};
//#endregion
//#region packages/docx/src/layout/document-layout-variants.ts
function Rd(e) {
	let { services: t, defaultCurrentDateMs: n, buildLayout: r } = e, i = oi({ defaultCurrentDateMs: n }), a = e.source.fatalParse, o = a === null ? null : ii(a.message, a.pageSize, t.text), s = new Ld(t, i, o === null ? r : () => o);
	return Sr(t, s), Object.freeze({
		store: s,
		defaultOptions: i
	});
}
function zd(e, t, n) {
	let r = Cr(e);
	if (!r) throw Error("Document layout variant store is not attached to the supplied services");
	return r.selectPage(oi(t), n);
}
//#endregion
//#region packages/docx/src/layout/affine.ts
function Bd(e, t) {
	return Object.freeze({
		a: e.a * t.a + e.c * t.b,
		b: e.b * t.a + e.d * t.b,
		c: e.a * t.c + e.c * t.d,
		d: e.b * t.c + e.d * t.d,
		e: e.a * t.e + e.c * t.f + e.e,
		f: e.b * t.e + e.d * t.f + e.f
	});
}
function Vd(e) {
	return Object.freeze({
		a: e,
		b: 0,
		c: 0,
		d: e,
		e: 0,
		f: 0
	});
}
function Hd(e, t) {
	return Object.freeze({
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e,
		f: t
	});
}
function Ud(e) {
	return Object.freeze(e === 1 ? {
		a: 0,
		b: 1,
		c: -1,
		d: 0,
		e: 0,
		f: 0
	} : {
		a: 0,
		b: -1,
		c: 1,
		d: 0,
		e: 0,
		f: 0
	});
}
function Wd(e, t) {
	return {
		xPt: e.a * t.xPt + e.c * t.yPt + e.e,
		yPt: e.b * t.xPt + e.d * t.yPt + e.f
	};
}
function Gd(e, t) {
	let n = e.a * e.d - e.b * e.c;
	if (!Number.isFinite(n) || n === 0) return null;
	let r = t.xPt - e.e, i = t.yPt - e.f, a = {
		xPt: (e.d * r - e.c * i) / n,
		yPt: (-e.b * r + e.a * i) / n
	};
	return Number.isFinite(a.xPt) && Number.isFinite(a.yPt) ? a : null;
}
function Kd(e, t) {
	let n = e.a * e.d - e.b * e.c;
	if (!Number.isFinite(n) || n === 0) return null;
	let r = {
		xPt: (e.d * t.xPt - e.c * t.yPt) / n,
		yPt: (-e.b * t.xPt + e.a * t.yPt) / n
	};
	return Number.isFinite(r.xPt) && Number.isFinite(r.yPt) ? r : null;
}
//#endregion
//#region packages/docx/src/layout/text-index.ts
var qd = Object.freeze({
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: 0,
	f: 0
}), Jd = Object.freeze([]), Yd = Ud(1), Xd = Ud(-1);
function Zd(e, t, n, r, i, a = {}) {
	if (!e.collectRasterPaintOccurrences) return;
	let o = i, s = r.widthPt, c = r.heightPt;
	a.textBoxVerticalMode && (o = Bd(o, a.textBoxVerticalMode === "vert270" ? Yd : Xd), [s, c] = [c, s]), a.orientation === "upright-physical" && (o = Bd(o, Xd), [s, c] = [c, s]);
	let l = s * Math.hypot(o.a, o.b), u = c * Math.hypot(o.c, o.d);
	!Number.isFinite(l) || !Number.isFinite(u) || !(l > 0) || !(u > 0) || e.rasterPaintOccurrences.push(Object.freeze({
		resourceKey: t,
		resourceKind: n,
		widthPt: l,
		heightPt: u
	}));
}
function Qd(e, t, n) {
	if (!(!n.collectRasterPaintOccurrences || n.emittedRasterDrawings.has(e.id))) {
		n.emittedRasterDrawings.add(e.id);
		for (let r of e.commands) {
			if (r.kind === "resource" && r.resourceKind !== "math") {
				Zd(n, r.resourceKey, r.resourceKind, r.rect, t.pointToPage, { orientation: r.orientation });
				continue;
			}
			if (r.kind !== "drawingml-image-fill") continue;
			let { x: e, y: i, w: a, h: o } = r.plan.rect, s = r.fillRect ?? {
				l: 0,
				t: 0,
				r: 0,
				b: 0
			};
			Zd(n, r.resourceKey, "image", {
				xPt: e + s.l * a,
				yPt: i + s.t * o,
				widthPt: a * (1 - s.l - s.r),
				heightPt: o * (1 - s.t - s.b)
			}, t.pointToPage);
		}
	}
}
function $d(e) {
	let t = new Map(e.sectionRegions.map((e) => [e.id, e])), n = /* @__PURE__ */ new Map();
	for (let t of e.sectionRegions) for (let e of t.flowDomainIds) n.set(e, t);
	for (let r of e.flowDomains) {
		if (r.kind !== "footnote" && r.kind !== "endnote") continue;
		let i = r.sectionRegionId ? t.get(r.sectionRegionId) : e.sectionRegions[0];
		if (!i) throw Error(`${r.id} references missing page story region ${r.sectionRegionId ?? "<default>"}`);
		n.set(r.id, i);
	}
	return n;
}
function ef(e, t) {
	return t.coordinateSpace === "upright-physical" ? qd : e.get(t.node.flowDomainId)?.coordinateSpace.logicalToPhysical ?? qd;
}
function tf(e, t) {
	let n = e.rootPointToPage.get(t.rootNodeId);
	if (!n) throw Error(`Drawing entry ${t.node.id} references missing root ${t.rootNodeId}`);
	let r = n, i = [];
	for (let e of t.frames) e.kind === "transform" ? r = Bd(r, e.transform) : i.push(Object.freeze({
		bounds: e.clip,
		pointToPage: r
	}));
	return {
		pointToPage: r,
		layoutTranslationPt: t.layoutTranslationPt,
		rootNodeId: t.rootNodeId,
		paintOrderIndex: e.drawingPaintOrder.get(t.node.id) ?? -1,
		clips: Object.freeze(i)
	};
}
function nf(e, t) {
	return t ? {
		...e,
		clips: Object.freeze([...e.clips, Object.freeze({
			bounds: t,
			pointToPage: e.pointToPage
		})])
	} : e;
}
function rf(e, t, n) {
	let r = t.xPt - e.flowBounds.xPt, i = t.yPt - e.flowBounds.yPt;
	return {
		...n,
		pointToPage: Bd(n.pointToPage, Hd(r, i)),
		layoutTranslationPt: {
			xPt: n.layoutTranslationPt.xPt + r,
			yPt: n.layoutTranslationPt.yPt + i
		}
	};
}
function af(e, t) {
	return (t.textBoxIds ?? []).flatMap((t) => {
		let n = e.get(t);
		return n ? [n] : [];
	});
}
function of(e, t, n) {
	if (n.emittedTextBoxes.has(e.id)) return;
	n.emittedTextBoxes.add(e.id);
	let r = nf({
		...t,
		pointToPage: Bd(t.pointToPage, e.transform),
		textBoxVerticalMode: e.verticalMode ?? t.textBoxVerticalMode
	}, e.clipBounds);
	for (let t of e.story.blocks) df(t, r, n);
}
function sf(e, t, n, r) {
	let i = af(e, t), a = cf(t, n, r);
	Qd(t, a, r), r.collectDrawings && !r.emittedDrawings.has(t.id) && (r.emittedDrawings.add(t.id), r.drawings.push(Object.freeze({
		drawing: t,
		textBoxes: i,
		pointToPage: a.pointToPage,
		clips: a.clips,
		paintOrderIndex: a.paintOrderIndex,
		sourceOrder: r.drawingSourceOrder++
	})));
	for (let e of i) of(e, a, r);
}
function cf(e, t, n) {
	let r = n.drawingEntries.get(e.id), i = t;
	r && r.rootNodeId === t.rootNodeId && (i = tf(n, r));
	let a = i.layoutTranslationPt, o = e.anchorLayer?.horizontalOwnership === "page" ? -a.xPt : 0, s = e.anchorLayer?.verticalOwnership === "page" ? -a.yPt : 0, c = o === 0 && s === 0 ? i : {
		...i,
		pointToPage: Bd(i.pointToPage, Hd(o, s))
	};
	if (e.orientation === "upright-physical") {
		if (!e.transform) throw Error(`Upright physical drawing ${e.id} is missing its logical transform`);
		c = {
			...c,
			pointToPage: Bd(c.pointToPage, e.transform)
		};
	}
	return c;
}
function lf(e, t, n) {
	let r = nf(t, e.clipBounds);
	if (n.collectCompletedParagraphSources && e.continuation?.continuesOnNext !== !0 && n.completedParagraphSources.add(z(e.source)), n.collectTextRuns || n.collectTextRunSources) {
		for (let r of e.lines) for (let i of r.placements) if (i.kind === "text" && (n.collectTextRuns && n.runs.push(Object.freeze({
			placement: i,
			pointToPage: t.pointToPage,
			source: e.source,
			...e.paragraphId === void 0 ? {} : { paragraphId: e.paragraphId }
		})), n.collectTextRunSources && i.sourceRunIndex !== void 0 && i.text.length > 0)) {
			let t = z(e.source), r = n.sourceRuns.get(t) ?? /* @__PURE__ */ new Set();
			n.sourceRuns.has(t) || n.sourceRuns.set(t, r), r.add(i.sourceRunIndex);
		}
	}
	if (n.collectRasterPaintOccurrences) for (let t of e.lines) for (let e of t.placements) e.kind !== "resource" || e.resourceKind === "math" || Zd(n, e.resourceKey, e.resourceKind, e.bounds, r.pointToPage, {
		orientation: e.orientation,
		textBoxVerticalMode: r.textBoxVerticalMode
	});
	let i = new Map(e.textBoxes.map((e) => [e.id, e])), a = /* @__PURE__ */ new Set(), o = e.drawings.map((e, t) => {
		let n = e.source.path.at(-1);
		if (n === void 0 || !Number.isSafeInteger(n) || n < 0) throw Error(`Drawing ${e.id} has no retained paragraph run index`);
		return {
			drawing: e,
			index: t,
			runIndex: n
		};
	}).sort((e, t) => e.runIndex - t.runIndex || e.index - t.index), s = n.collectDrawings ? e.lines.flatMap((e) => e.placements.flatMap((e, t) => e.kind !== "resource" || e.resourceKind !== "image" && e.resourceKind !== "chart" || e.sourceRunIndex === void 0 ? [] : [{
		placement: e,
		index: t,
		runIndex: e.sourceRunIndex
	}])) : [];
	for (let { drawing: e } of o) for (let t of e.textBoxIds ?? []) a.add(t);
	let c = [...o.map((e) => ({
		kind: "drawing",
		...e
	})), ...s.map((e) => ({
		kind: "resource",
		...e
	}))].sort((e, t) => e.runIndex - t.runIndex || e.index - t.index);
	for (let t of c) {
		if (t.kind === "drawing") {
			sf(i, t.drawing, r, n);
			continue;
		}
		n.collectDrawings && n.inlineResources.push(Object.freeze({
			placement: t.placement,
			source: Object.freeze({
				...e.source,
				path: Object.freeze([...e.source.path, t.runIndex])
			}),
			pointToPage: r.pointToPage,
			clips: r.clips,
			paintOrderIndex: r.paintOrderIndex,
			sourceOrder: n.drawingSourceOrder++
		}));
	}
	for (let t of e.textBoxes) a.has(t.id) || of(t, r, n);
}
function uf(e, t, n) {
	let r = nf(t, e.clipBounds);
	for (let t of e.rows) for (let e of t.cells) {
		let t = "visualMergeOwnership" in e && e.visualMergeOwnership === "continuation";
		if (e.verticalMerge === "continue" && !t) continue;
		let i = nf(r, e.clipBounds);
		for (let t of e.blocks) {
			let r = t.layout;
			df(r, rf(r, {
				xPt: e.contentBounds.xPt + (r.kind === "table" ? r.flowBounds.xPt : 0),
				yPt: e.flowBounds.yPt + t.offsetPt + (r.kind === "table" ? r.flowBounds.yPt : 0)
			}, i), n);
		}
	}
	for (let i of e.resolvedFloatingTables ?? []) df(i.child, rf(i.child, {
		xPt: i.xPt - t.layoutTranslationPt.xPt,
		yPt: i.yPt - t.layoutTranslationPt.yPt
	}, r), n);
}
function df(e, t, n) {
	switch (e.kind) {
		case "paragraph":
			lf(e, t, n);
			return;
		case "table":
			uf(e, t, n);
			return;
		case "note":
			for (let r of e.story.blocks) df(r, nf(t, e.story.clipBounds), n);
			return;
		case "textbox":
			of(e, t, n);
			return;
		case "drawing": {
			let r = n.drawingEntries.get(e.id);
			sf(new Map((r?.textBoxes ?? []).map((e) => [e.id, e])), e, t, n);
			return;
		}
		default: throw Error(`Unknown text-index node: ${String(e)}`);
	}
}
function ff(e, t, n) {
	let r = e.pages[t];
	if (!r) throw RangeError(`Page index ${t} is out of range`);
	let i = new Map(r.layers.roots.map((e) => [e.node.id, e])), a = $d(r), o = new Map(r.layers.roots.map((e) => [e.node.id, ef(a, e)])), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
	for (let [e, t] of r.layers.paintOrder.entries()) t.kind === "drawing" && s.set(t.node.id, t), t.kind === "drawing" ? c.set(t.node.id, e) : l.set(t.node.id, e);
	let u = {
		...n,
		collectCompletedParagraphSources: n.collectCompletedParagraphSources === !0,
		collectRasterPaintOccurrences: n.collectRasterPaintOccurrences === !0,
		drawingEntries: s,
		rootPointToPage: o,
		rootPaintOrder: l,
		drawingPaintOrder: c,
		emittedTextBoxes: /* @__PURE__ */ new Set(),
		emittedDrawings: /* @__PURE__ */ new Set(),
		runs: [],
		sourceRuns: /* @__PURE__ */ new Map(),
		completedParagraphSources: /* @__PURE__ */ new Set(),
		drawings: [],
		inlineResources: [],
		rasterPaintOccurrences: [],
		emittedRasterDrawings: /* @__PURE__ */ new Set(),
		drawingSourceOrder: 0
	}, d = u.collectRasterPaintOccurrences ? r.layers.roots.map(({ node: e }) => e.id) : r.readingOrder;
	for (let e of d) {
		let t = i.get(e);
		if (!t) throw Error(`Reading-order node ${e} is not a page root`);
		let n = o.get(e);
		if (!n) throw Error(`Reading-order node ${e} has no page projection`);
		df(t.node, {
			pointToPage: n,
			layoutTranslationPt: {
				xPt: 0,
				yPt: 0
			},
			rootNodeId: t.node.id,
			paintOrderIndex: l.get(t.node.id) ?? -1,
			clips: Jd
		}, u);
	}
	return u;
}
function pf(e, t) {
	return Object.freeze(ff(e, t, {
		collectTextRuns: !0,
		collectTextRunSources: !1,
		collectDrawings: !1
	}).runs);
}
function mf(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
	for (let r = 0; r < e.pages.length; r += 1) {
		let i = ff(e, r, {
			collectTextRuns: !1,
			collectTextRunSources: !0,
			collectCompletedParagraphSources: !0,
			collectDrawings: !1
		});
		for (let [e, n] of i.sourceRuns) {
			let r = t.get(e) ?? /* @__PURE__ */ new Set();
			t.has(e) || t.set(e, r);
			for (let e of n) r.add(e);
		}
		for (let e of i.completedParagraphSources) n.add(e);
	}
	return Object.freeze({
		renderedRunIndex: t,
		completedSourceKeys: n
	});
}
function hf(e, t) {
	let n = ff(e, t, {
		collectTextRuns: !1,
		collectTextRunSources: !1,
		collectDrawings: !0
	}), r = [...n.drawings, ...n.inlineResources];
	return r.sort((e, t) => e.paintOrderIndex - t.paintOrderIndex || e.sourceOrder - t.sourceOrder), Object.freeze(r);
}
function gf(e, t) {
	return Object.freeze(ff(e, t, {
		collectTextRuns: !1,
		collectTextRunSources: !1,
		collectDrawings: !1,
		collectRasterPaintOccurrences: !0
	}).rasterPaintOccurrences);
}
//#endregion
//#region packages/docx/src/paint/affine.ts
function _f(e) {
	let t = Math.hypot(e.a, e.b), n = Math.hypot(e.c, e.d), r = e.a / t, i = e.b / t, a = e.c / n, o = e.d / n;
	if (!(r === 1 && i === 0 && a === 0 && o === 1)) return r === 0 && i === 1 && a === -1 && o === 0 ? "rotate(90deg)" : r === 0 && i === -1 && a === 1 && o === 0 ? "rotate(-90deg)" : `matrix(${r}, ${i}, ${a}, ${o}, 0, 0)`;
}
//#endregion
//#region packages/docx/src/text-run-projection.ts
function vf(e, t) {
	let { placement: n } = e, r = Wd(t, n.bounds), i = n.highlightBounds ? Wd(t, n.highlightBounds) : void 0, a = Math.hypot(t.a, t.b), o = Math.hypot(t.c, t.d), s = _f(t), c = n.paintOps[0]?.letterSpacingPt ?? 0;
	return {
		source: {
			story: e.source.story,
			storyInstance: e.source.storyInstance,
			path: [...e.source.path]
		},
		...e.paragraphId === void 0 ? {} : { paragraphId: e.paragraphId },
		...n.sourceRunIndex === void 0 ? {} : { sourceRunIndex: n.sourceRunIndex },
		direction: n.direction,
		text: n.text,
		x: r.xPt,
		y: r.yPt,
		w: n.bounds.widthPt * a,
		h: n.bounds.heightPt * o,
		...n.highlightBounds && i ? { highlightBounds: Object.freeze({
			x: i.xPt,
			y: i.yPt,
			width: n.highlightBounds.widthPt * a,
			height: n.highlightBounds.heightPt * o
		}) } : {},
		fontSize: n.fontSizePt * o,
		font: st(n.fontRoute, n.fontSizePt * o, n.fontWeight, n.fontStyle),
		...c === 0 ? {} : { letterSpacingPx: c * a },
		...s ? { transform: s } : {},
		...n.hyperlink ? { hyperlink: n.hyperlink } : {},
		...n.tateChuYoko ? { eastAsianVert: !0 } : {}
	};
}
function yf(e, t, n) {
	if (!Number.isFinite(n.scale) || n.scale <= 0) throw RangeError(`Text projection scale must be positive: ${n.scale}`);
	let r = Vd(n.scale);
	return pf(e, t).map((e) => vf(e, Bd(r, e.pointToPage)));
}
function bf(e, t, n) {
	let r = zd(e, {
		currentDate: n.currentDate,
		defaultCurrentDateMs: n.defaultCurrentDateMs,
		showTrackedChanges: n.showTrackedChanges
	}, t), i = (n.width ?? r.page.geometry.widthPt * 1.3333333333333333) / r.page.geometry.widthPt;
	return yf(r.layout, t, { scale: i });
}
//#endregion
//#region packages/docx/src/paint/browser-images.ts
function xf(e, t, n) {
	return `${e}${t ? `|clr:${t}` : ""}${n ? `|duo:${n.clr1}:${n.clr2}` : ""}`;
}
function Sf(e) {
	return e.cacheKey ?? xf(e.imagePath, e.colorReplaceFrom, e.duotone);
}
var Cf = "docx-color-effects";
function wf(e, t) {
	let n = parseInt(t.slice(0, 2), 16), r = parseInt(t.slice(2, 4), 16), i = parseInt(t.slice(4, 6), 16);
	for (let t = 0; t < e.data.length; t += 4) e.data[t] === n && e.data[t + 1] === r && e.data[t + 2] === i && (e.data[t + 3] = 0);
}
async function Tf(e, t, n, r, i) {
	let a = async (n) => {
		if (t) throw n instanceof Error ? n : /* @__PURE__ */ Error("2D canvas is unavailable for image color effects");
		if (r) return null;
		let a = Qe(e.width, e.height, i?.targetWidthPx, i?.targetHeightPx);
		if (!a) return e;
		if (typeof createImageBitmap > "u") throw Error("createImageBitmap is unavailable for duotone fallback resampling");
		return createImageBitmap(e, a);
	};
	if (typeof OffscreenCanvas > "u") return a();
	let o, s;
	try {
		o = new OffscreenCanvas(e.width, e.height), s = o.getContext("2d");
	} catch (e) {
		return a(e);
	}
	if (!s) return a();
	s.drawImage(e, 0, 0);
	let c;
	try {
		c = s.getImageData(0, 0, e.width, e.height);
	} catch (e) {
		return a(e);
	}
	if (t && wf(c, t), n) try {
		he(c, n.clr1, n.clr2);
	} catch {
		if (r) return null;
	}
	s.putImageData(c, 0, 0);
	let l = Qe(e.width, e.height, i?.targetWidthPx, i?.targetHeightPx);
	return l ? createImageBitmap(o, l) : createImageBitmap(o);
}
async function Ef(e, t, n, r, i = 0, a = 0, o, s = !1, c, l, u) {
	let d = Math.floor(Je / (n || o ? 4 : 1)), f = Number.isSafeInteger(u) && (u ?? 0) > 0 ? Math.min(d, u) : d, p = n || o ? P(r, Cf) : void 0, m = {
		widthPt: i,
		heightPt: a,
		suppressBoundaryFrame: !0,
		tiff: c,
		maxRetainedPixels: f,
		...l ?? {}
	}, h = await ue(e, t, r, { ...m });
	if (!h) return null;
	if (!n && !o) return h;
	let g = await Ce(e, t, r, m, p, h), _ = Qe(h.width, h.height, l?.targetWidthPx, l?.targetHeightPx), v = _ ? `|resize:${_.resizeWidth}x${_.resizeHeight}` : "";
	return ae(Cf, `${xf(g, n, o)}${v}${s ? "|strict" : ""}`, r, async () => {
		let e = await Tf(h, n, o, s, l);
		return {
			bitmap: e,
			owned: e !== null && e !== h
		};
	}, p);
}
function Df(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
	for (let e of t) {
		if (e.resourceKind !== "image" && e.resourceKind !== "picture-bullet" || !Number.isFinite(e.widthPt) || e.widthPt <= 0 || !Number.isFinite(e.heightPt) || e.heightPt <= 0) continue;
		let t = `${e.resourceKind}:${e.resourceKey}`, n = i.get(t);
		i.set(t, {
			widthPt: Math.max(n?.widthPt ?? 0, e.widthPt),
			heightPt: Math.max(n?.heightPt ?? 0, e.heightPt)
		});
	}
	let a = e.filter((e) => e.kind === "image" || e.kind === "picture-bullet").sort((e, t) => (e.documentOrder ?? 2 ** 53 - 1) - (t.documentOrder ?? 2 ** 53 - 1));
	for (let e of a) {
		let t = i.get(`${e.kind}:${e.resourceKey}`);
		if (!t) continue;
		let a = Ue(e.mimeType, e.srcRect, t.widthPt, t.heightPt);
		if (!a) continue;
		let o = {
			imagePath: e.partPath,
			mimeType: e.mimeType,
			...e.svgImagePath === void 0 ? {} : { svgImagePath: e.svgImagePath },
			...e.colorReplaceFrom === void 0 ? {} : { colorReplaceFrom: e.colorReplaceFrom },
			...e.duotone === void 0 ? {} : { duotone: e.duotone },
			widthPt: a.widthPt,
			heightPt: a.heightPt,
			hasCrop: e.srcRect != null
		}, s = n === void 0 ? null : We(t.widthPt * n, t.heightPt * n, e.srcRect);
		s && (o.targetWidthPx = s.width, o.targetHeightPx = s.height);
		let c = Sf(o), l = r.get(c);
		l ? (l.widthPt = Math.max(l.widthPt, o.widthPt), l.heightPt = Math.max(l.heightPt, o.heightPt), l.hasCrop ||= o.hasCrop, l.targetWidthPx = Math.max(l.targetWidthPx ?? 0, o.targetWidthPx ?? 0) || void 0, l.targetHeightPx = Math.max(l.targetHeightPx ?? 0, o.targetHeightPx ?? 0) || void 0) : r.set(c, o);
	}
	let o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Map();
	for (let e of t) {
		if (e.resourceKind !== "chart") continue;
		let t = s.get(e.resourceKey) ?? [];
		s.has(e.resourceKey) || s.set(e.resourceKey, t), t.push(e);
	}
	for (let t of e) if (t.kind === "chart") for (let e of s.get(t.resourceKey) ?? []) {
		if (!Number.isFinite(e.widthPt) || e.widthPt <= 0 || !Number.isFinite(e.heightPt) || e.heightPt <= 0) continue;
		let i = {
			widthPt: e.widthPt,
			heightPt: e.heightPt,
			targetWidthPx: n === void 0 ? void 0 : e.widthPt * n,
			targetHeightPx: n === void 0 ? void 0 : e.heightPt * n
		}, a = Re(t.model).map((e) => ({
			usage: e,
			size: ze(e, i)
		}));
		if (!a.some(({ size: e }) => e === null)) for (let { usage: e, size: t } of a) {
			if (!t) continue;
			let n = e.fill, i = Ue(n.mimeType, n.srcRect, t.widthPt, t.heightPt);
			if (!i) continue;
			let a = {
				cacheKey: Ke(n),
				imagePath: n.imagePath,
				mimeType: n.mimeType,
				...n.svgImagePath === void 0 ? {} : { svgImagePath: n.svgImagePath },
				...n.duotone === void 0 ? {} : { duotone: n.duotone },
				widthPt: i.widthPt,
				heightPt: i.heightPt,
				hasCrop: n.srcRect != null,
				failClosedOnDuotoneFailure: !0,
				...!e.preserveNaturalSize && t.targetWidthPx && t.targetHeightPx ? {
					targetWidthPx: t.targetWidthPx,
					targetHeightPx: t.targetHeightPx
				} : {}
			}, s = Sf(a), c = r.get(s);
			c ? (c.widthPt = Math.max(c.widthPt, a.widthPt), c.heightPt = Math.max(c.heightPt, a.heightPt), c.hasCrop ||= a.hasCrop) : r.set(s, a), e.preserveNaturalSize && o.add(s);
			let l = r.get(s);
			o.has(s) ? (l.targetWidthPx = void 0, l.targetHeightPx = void 0) : (l.targetWidthPx = Math.max(l.targetWidthPx ?? 0, a.targetWidthPx ?? 0) || void 0, l.targetHeightPx = Math.max(l.targetHeightPx ?? 0, a.targetHeightPx ?? 0) || void 0);
		}
	}
	return [...r.values()];
}
async function Of(e, t, n, r, i, o, s) {
	if (!n) return /* @__PURE__ */ new Map();
	let l = xe(s), u = (e, t) => o ? N(e, n, {
		targetWidthPx: t.targetWidthPx,
		targetHeightPx: t.targetHeightPx,
		maxRetainedPixels: t.targetWidthPx && t.targetHeightPx ? t.targetWidthPx * t.targetHeightPx : void 0,
		workerDecoder: o
	}) : N(e, n), d = Df(e, t, i), f = C((await Promise.all(d.map(async (e) => {
		if (!e.targetWidthPx || !e.targetHeightPx || e.colorReplaceFrom || e.duotone) return null;
		let t = e.mimeType === "image/svg+xml", i = {
			svgImagePath: e.svgImagePath,
			srcRect: e.hasCrop || null
		};
		if (t || k(i)) return null;
		if (w(e.mimeType) && (l.resolution === "display" || l.strategy === "adaptive")) return {
			key: Sf(e),
			targetWidthPx: e.targetWidthPx,
			targetHeightPx: e.targetHeightPx,
			retainedSurfaceCount: 1
		};
		let a = await re(e.imagePath, e.mimeType, n).catch(() => null);
		return !a?.dimensions || !c(a.format, r !== void 0) ? null : {
			key: Sf(e),
			targetWidthPx: e.targetWidthPx,
			targetHeightPx: e.targetHeightPx,
			sourceWidthPx: a.dimensions.width,
			sourceHeightPx: a.dimensions.height,
			retainedSurfaceCount: 1
		};
	}))).filter((e) => e !== null), l);
	for (let e of d) {
		if (e.mimeType === "image/svg+xml" || !e.colorReplaceFrom && !e.duotone && k({
			svgImagePath: e.svgImagePath,
			srcRect: e.hasCrop || null
		})) continue;
		let t = f.targets.get(Sf(e));
		e.targetWidthPx = t?.width, e.targetHeightPx = t?.height, e.plannedPixelLimit = t?.maxRetainedPixels;
	}
	let p = await Promise.all(d.map(async (e) => {
		try {
			let t = e.mimeType === "image/svg+xml", i = {
				svgImagePath: e.svgImagePath,
				srcRect: e.hasCrop || null
			}, a;
			if (k(i)) try {
				a = await u(i.svgImagePath, e);
			} catch (i) {
				let o = t ? await u(e.imagePath, e) : await Ef(e.imagePath, e.mimeType, e.colorReplaceFrom, n, e.widthPt, e.heightPt, e.duotone, e.failClosedOnDuotoneFailure ?? !1, r, e.targetWidthPx && e.targetHeightPx ? {
					targetWidthPx: e.targetWidthPx,
					targetHeightPx: e.targetHeightPx
				} : void 0, e.plannedPixelLimit);
				if (!o) throw i;
				a = o;
			}
			else a = t ? await u(e.imagePath, e) : await Ef(e.imagePath, e.mimeType, e.colorReplaceFrom, n, e.widthPt, e.heightPt, e.duotone, e.failClosedOnDuotoneFailure ?? !1, r, e.targetWidthPx && e.targetHeightPx ? {
				targetWidthPx: e.targetWidthPx,
				targetHeightPx: e.targetHeightPx
			} : void 0, e.plannedPixelLimit);
			return a == null ? null : [Sf(e), a];
		} catch (t) {
			if (a(t, "tiff")) return [Sf(e), t];
			throw t;
		}
	})), m = /* @__PURE__ */ new Map();
	for (let e of p) e && m.set(e[0], e[1]);
	return m;
}
//#endregion
//#region packages/docx/src/paint/column-separator-raster.ts
function kf(e, t) {
	return Math.round(e * t) / t;
}
function Af(e, t, n) {
	let r = e * t;
	return (n % 2 == 0 ? Math.round(r) : Math.round(r - .5) + .5) / t;
}
function jf(e, t, n) {
	let r = t * n, i = Math.max(1, Math.round(.5 * t)), a = Math.max(1, Math.round(i * n)), o = a / r;
	if (e.start.xPt === e.end.xPt) {
		let t = Af(e.start.xPt, r, a);
		return {
			segment: {
				start: {
					xPt: t,
					yPt: kf(e.start.yPt, r)
				},
				end: {
					xPt: t,
					yPt: kf(e.end.yPt, r)
				}
			},
			widthPt: o
		};
	}
	if (e.start.yPt === e.end.yPt) {
		let t = Af(e.start.yPt, r, a);
		return {
			segment: {
				start: {
					xPt: kf(e.start.xPt, r),
					yPt: t
				},
				end: {
					xPt: kf(e.end.xPt, r),
					yPt: t
				}
			},
			widthPt: o
		};
	}
	return {
		segment: e,
		widthPt: o
	};
}
//#endregion
//#region packages/docx/src/paint/canvas-resource.ts
function Mf(e, t, n, r, i) {
	if (r !== "upright-physical") {
		i.resources.paint(e, t, n, i.ctx);
		return;
	}
	let { ctx: a } = i;
	a.save(), a.translate(n.xPt + n.widthPt / 2, n.yPt + n.heightPt / 2), a.rotate(-Math.PI / 2), i.resources.paint(e, t, {
		xPt: -n.heightPt / 2,
		yPt: -n.widthPt / 2,
		widthPt: n.heightPt,
		heightPt: n.widthPt
	}, a), a.restore();
}
//#endregion
//#region packages/docx/src/paint/canvas-drawing.ts
function Nf(e, t) {
	for (let n of e.commands) {
		if (n.kind === "noop") continue;
		if (n.kind === "drawingml-shape") {
			gt(t.ctx, n.plan, 1);
			continue;
		}
		if (n.kind === "drawingml-image-fill") {
			if (!t.resources) throw Error(`Missing retained resource painter for ${n.resourceKey}`);
			let { x: e, y: r, w: i, h: a } = n.plan.rect, o = n.fillRect ?? {
				l: 0,
				t: 0,
				r: 0,
				b: 0
			}, s = {
				xPt: e + o.l * i,
				yPt: r + o.t * a,
				widthPt: i * (1 - o.l - o.r),
				heightPt: a * (1 - o.t - o.b)
			};
			s.widthPt > 0 && s.heightPt > 0 && ct(t.ctx, n.plan, () => {
				lt(t.ctx, n.plan), Mf(n.resourceKey, "image", s, void 0, t);
			}), gt(t.ctx, n.plan, 1);
			continue;
		}
		if (n.kind === "resource") {
			if (!t.resources) throw Error(`Missing retained resource painter for ${n.resourceKey}`);
			Mf(n.resourceKey, n.resourceKind, n.rect, n.orientation, t);
			continue;
		}
		if (n.kind === "fill-rect") {
			t.ctx.fillStyle = n.fill, t.ctx.fillRect(n.rect.xPt, n.rect.yPt, n.rect.widthPt, n.rect.heightPt);
			continue;
		}
		if (n.kind === "stroke-rect") {
			t.ctx.strokeStyle = n.stroke, t.ctx.lineWidth = n.lineWidthPt, t.ctx.setLineDash([...n.dashPt]), t.ctx.strokeRect(n.rect.xPt, n.rect.yPt, n.rect.widthPt, n.rect.heightPt), t.ctx.setLineDash([]);
			continue;
		}
		if (n.kind === "watermark-text") {
			let e = Ge(n.fill, t.ctx, n.rect.xPt, n.rect.yPt, n.rect.widthPt, n.rect.heightPt);
			if (e === null) continue;
			t.ctx.save();
			let r = n.rect.xPt + n.rect.widthPt / 2, i = n.rect.yPt + n.rect.heightPt / 2;
			t.ctx.translate(r, i), n.rotationDeg !== 0 && t.ctx.rotate(n.rotationDeg * Math.PI / 180), n.fitShape ? (t.ctx.scale(n.rect.widthPt / n.sourceBounds.widthPt, n.rect.heightPt / n.sourceBounds.heightPt), t.ctx.translate(-(n.sourceBounds.xPt + n.sourceBounds.widthPt / 2), -(n.sourceBounds.yPt + n.sourceBounds.heightPt / 2))) : t.ctx.translate(n.rect.xPt - r - n.sourceBounds.xPt, n.rect.yPt - i - n.sourceBounds.yPt), t.ctx.globalAlpha *= n.opacity, t.ctx.fillStyle = e, t.ctx.textAlign = "left", t.ctx.textBaseline = "alphabetic";
			let a = 0;
			for (let e of n.spans) t.ctx.font = st(e.fontRoute, n.fontSizePt, e.fontWeight, e.fontStyle), t.ctx.fillText(e.text, a, 0), a += e.advancePt;
			t.ctx.restore();
			continue;
		}
		t.ctx.fillStyle = n.fill, t.ctx.font = st(n.fontRoute, n.fontSizePt, n.fontWeight, n.fontStyle), t.ctx.textAlign = n.align === "start" ? "left" : n.align === "end" ? "right" : "center", t.ctx.textBaseline = n.baseline;
		let e = n.align === "start" ? n.rect.xPt : n.align === "end" ? n.rect.xPt + n.rect.widthPt : n.rect.xPt + n.rect.widthPt / 2, r = n.baseline === "top" ? n.rect.yPt : n.baseline === "bottom" ? n.rect.yPt + n.rect.heightPt : n.rect.yPt + n.rect.heightPt / 2;
		t.ctx.fillText(n.text, e, r);
	}
}
//#endregion
//#region packages/docx/src/paint/canvas-border.ts
function Pf(e, t, n) {
	let r = e === "triple", i = /^(thinThick|thickThin|thinThickThin)(Small|Medium|Large)Gap$/.exec(e);
	if (!r && !i) return null;
	let a = r ? [
		1,
		1,
		1
	] : i?.[1] === "thinThick" ? [1, 2] : i?.[1] === "thickThin" ? [2, 1] : [
		1,
		2,
		1
	], o = r || i?.[2] === "Small" ? 1 : i?.[2] === "Medium" ? 2 : 3, s = t / (a.reduce((e, t) => e + t, 0) + o * (a.length - 1)), c = a.map((e) => Math.max(1, Math.round(s * e * n))), l = Math.max(1, Math.round(s * o * n)), u = 0;
	return {
		bands: c.map((e, t) => {
			let n = {
				offsetDev: u,
				widthDev: e
			};
			return u += e + (t < c.length - 1 ? l : 0), n;
		}),
		spanDev: u
	};
}
function Ff(e) {
	return [...e.bands].reverse().map((t) => ({
		offsetDev: e.spanDev - t.offsetDev - t.widthDev,
		widthDev: t.widthDev
	}));
}
function If(e, t, n) {
	if (t.style !== "compound") return !1;
	let r = n.pointToCss ?? Vd(n.scale);
	if (r.b !== 0 || r.c !== 0 || r.a <= 0 || r.d <= 0) return !1;
	let i = Wd(r, {
		xPt: e.xPt,
		yPt: e.yPt
	}), a = Wd(r, {
		xPt: e.xPt + e.widthPt,
		yPt: e.yPt + e.heightPt
	}), o = Pf(t.authoredStyle, t.widthPt * r.d, n.dpr), s = Pf(t.authoredStyle, t.widthPt * r.a, n.dpr);
	if (!o || !s || o.bands.length !== s.bands.length) return !1;
	let c = Ff(o), l = Ff(s), u = (e, t, i, a) => {
		let o = [
			{
				xPt: e,
				yPt: t
			},
			{
				xPt: e + i,
				yPt: t
			},
			{
				xPt: e,
				yPt: t + a
			},
			{
				xPt: e + i,
				yPt: t + a
			}
		].map((e) => Gd(r, e));
		if (o.some((e) => e === null)) return !1;
		let s = o.filter((e) => e !== null), c = s.map((e) => e.xPt), l = s.map((e) => e.yPt);
		return n.ctx.fillRect(Math.min(...c), Math.min(...l), Math.max(...c) - Math.min(...c), Math.max(...l) - Math.min(...l)), !0;
	}, d = Math.round(i.xPt * n.dpr - s.spanDev / 2), f = Math.round(a.xPt * n.dpr + s.spanDev / 2), p = Math.round(i.yPt * n.dpr - o.spanDev / 2), m = Math.round(a.yPt * n.dpr + o.spanDev / 2);
	n.ctx.fillStyle = t.color;
	for (let e = 0; e < c.length; e += 1) {
		let t = c[e], r = l[e], i = d + r.offsetDev, a = f - r.offsetDev, o = p + t.offsetDev, s = m - t.offsetDev, h = i / n.dpr, g = a / n.dpr, _ = o / n.dpr, v = s / n.dpr, y = r.widthDev / n.dpr, b = t.widthDev / n.dpr;
		if (!u(h, _, g - h, b) || !u(h, v - b, g - h, b) || !u(h, _, y, v - _) || !u(g - y, _, y, v - _)) return !1;
	}
	return n.ctx.setLineDash([]), !0;
}
function Lf(e) {
	return 1 / e.dpr;
}
function Rf(t, n, r = 0) {
	let i = r / n.scale, a = i > t.widthPt ? {
		...t,
		widthPt: i,
		...typeof t.authoredStyle == "string" ? { dashPatternPt: Object.freeze(qe(t.authoredStyle, i)) } : {}
	} : t, { ctx: o } = n;
	o.strokeStyle = a.color, o.lineWidth = a.widthPt, o.setLineDash("dashPatternPt" in a && a.dashPatternPt ? [...a.dashPatternPt] : []), o.beginPath();
	let s = "path" in a && a.path?.length ? a.path : [a.from, a.to], c = s.length === 2 && (s[0].xPt === s[1].xPt || s[0].yPt === s[1].yPt), l = c && s[0].yPt === s[1].yPt, u = c && s[0].xPt === s[1].xPt, d = n.pointToCss ?? Vd(n.scale), f = s.map((e) => Wd(d, e)), p = c ? s[1].xPt - s[0].xPt : 0, m = c ? s[1].yPt - s[0].yPt : 0, h = d.a * p + d.c * m, g = d.b * p + d.d * m, _ = c && g === 0, v = c && h === 0, y = l ? Math.hypot(d.c, d.d) : u ? Math.hypot(d.a, d.b) : 0, b = a.style === "compound" && c && y > 0 ? Pf(a.authoredStyle, a.widthPt * y, n.dpr) : null;
	if (b) {
		o.fillStyle = a.color;
		let e = (e, t, n, r) => {
			let i = [
				{
					xPt: e,
					yPt: t
				},
				{
					xPt: e + n,
					yPt: t
				},
				{
					xPt: e,
					yPt: t + r
				},
				{
					xPt: e + n,
					yPt: t + r
				}
			].map((e) => Gd(d, e));
			if (i.some((e) => e === null)) return;
			let a = i.filter((e) => e !== null), s = a.map((e) => e.xPt), c = a.map((e) => e.yPt);
			o.fillRect(Math.min(...s), Math.min(...c), Math.max(...s) - Math.min(...s), Math.max(...c) - Math.min(...c));
		}, t = Math.round((_ ? f[0].yPt : f[0].xPt) * n.dpr - b.spanDev / 2);
		for (let r of b.bands) {
			let i = (t + r.offsetDev) / n.dpr, a = r.widthDev / n.dpr;
			if (_) e(Math.min(f[0].xPt, f[1].xPt), i, Math.abs(h), a);
			else if (v) e(i, Math.min(f[0].yPt, f[1].yPt), a, Math.abs(g));
			else {
				let e = (r.offsetDev - b.spanDev / 2) / n.dpr / y, t = r.widthDev / n.dpr / y;
				l ? o.fillRect(Math.min(s[0].xPt, s[1].xPt), s[0].yPt + e, Math.abs(s[1].xPt - s[0].xPt), t) : o.fillRect(s[0].xPt + e, Math.min(s[0].yPt, s[1].yPt), t, Math.abs(s[1].yPt - s[0].yPt));
			}
		}
		o.setLineDash([]);
		return;
	}
	if (a.style === "double" && c && y > 0) {
		if (o.fillStyle = a.color, _ || v) {
			let e = (e, t, n, r) => {
				let i = [
					{
						xPt: e,
						yPt: t
					},
					{
						xPt: e + n,
						yPt: t
					},
					{
						xPt: e,
						yPt: t + r
					},
					{
						xPt: e + n,
						yPt: t + r
					}
				].map((e) => Gd(d, e));
				if (i.some((e) => e === null)) return;
				let a = i.filter((e) => e !== null), s = a.map((e) => e.xPt), c = a.map((e) => e.yPt);
				o.fillRect(Math.min(...s), Math.min(...c), Math.max(...s) - Math.min(...s), Math.max(...c) - Math.min(...c));
			}, { railDev: t, gapDev: r, spanDev: i } = Ne(a.widthPt * y, n.dpr), s = t / n.dpr;
			if (_) {
				let a = Math.round(f[0].yPt * n.dpr - i / 2), o = Math.min(f[0].xPt, f[1].xPt), c = Math.abs(f[1].xPt - f[0].xPt);
				e(o, a / n.dpr, c, s), e(o, (a + t + r) / n.dpr, c, s);
			} else {
				let a = Math.round(f[0].xPt * n.dpr - i / 2), o = Math.min(f[0].yPt, f[1].yPt), c = Math.abs(f[1].yPt - f[0].yPt);
				e(a / n.dpr, o, s, c), e((a + t + r) / n.dpr, o, s, c);
			}
		} else {
			let { railDev: e, gapDev: t, spanDev: r } = Ne(a.widthPt * y, n.dpr), i = e / n.dpr / y, c = t / n.dpr / y, u = r / n.dpr / y;
			if (l) {
				let e = Math.min(s[0].xPt, s[1].xPt), t = Math.abs(s[1].xPt - s[0].xPt);
				o.fillRect(e, s[0].yPt - u / 2, t, i), o.fillRect(e, s[0].yPt - u / 2 + i + c, t, i);
			} else {
				let e = Math.min(s[0].yPt, s[1].yPt), t = Math.abs(s[1].yPt - s[0].yPt);
				o.fillRect(s[0].xPt - u / 2, e, i, t), o.fillRect(s[0].xPt - u / 2 + i + c, e, i, t);
			}
		}
		o.setLineDash([]);
		return;
	}
	let x = Kd(d, v && y > 0 ? {
		xPt: e(f[0].xPt, a.widthPt * y, n.dpr),
		yPt: 0
	} : _ && y > 0 ? {
		xPt: 0,
		yPt: e(f[0].yPt, a.widthPt * y, n.dpr)
	} : {
		xPt: 0,
		yPt: 0
	}) ?? {
		xPt: 0,
		yPt: 0
	}, S = s[0];
	o.moveTo(S.xPt + x.xPt, S.yPt + x.yPt);
	for (let e of s.slice(1)) o.lineTo(e.xPt + x.xPt, e.yPt + x.yPt);
	let C = a.style === "wavy" && s.length > 2;
	C && (o.save(), o.lineJoin = "bevel"), o.stroke(), C && o.restore(), o.setLineDash([]);
}
//#endregion
//#region packages/docx/src/paint/deferred-paint-frame.ts
function zf(e, t) {
	return (n) => () => {
		e.save();
		try {
			t(), n();
		} finally {
			e.restore();
		}
	};
}
//#endregion
//#region packages/docx/src/paint/canvas-table.ts
function Bf(e, t) {
	let n = t.pointToCss ?? Vd(t.scale);
	if (n.b !== 0 || n.c !== 0) return e;
	let r = [
		{
			xPt: e.xPt,
			yPt: e.yPt
		},
		{
			xPt: e.xPt + e.widthPt,
			yPt: e.yPt
		},
		{
			xPt: e.xPt,
			yPt: e.yPt + e.heightPt
		},
		{
			xPt: e.xPt + e.widthPt,
			yPt: e.yPt + e.heightPt
		}
	].map((e) => Wd(n, e)), i = r.map((e) => e.xPt), a = r.map((e) => e.yPt), o = Math.floor(Math.min(...i) * t.dpr) / t.dpr, s = Math.floor(Math.min(...a) * t.dpr) / t.dpr, c = Math.ceil(Math.max(...i) * t.dpr) / t.dpr, l = Math.ceil(Math.max(...a) * t.dpr) / t.dpr, u = [
		{
			xPt: o,
			yPt: s
		},
		{
			xPt: c,
			yPt: s
		},
		{
			xPt: o,
			yPt: l
		},
		{
			xPt: c,
			yPt: l
		}
	].map((e) => Gd(n, e));
	if (u.some((e) => e === null)) return e;
	let d = u.filter((e) => e !== null), f = d.map((e) => e.xPt), p = d.map((e) => e.yPt);
	return {
		xPt: Math.min(...f),
		yPt: Math.min(...p),
		widthPt: Math.max(...f) - Math.min(...f),
		heightPt: Math.max(...p) - Math.min(...p)
	};
}
function Vf(e, t, n, r = !0) {
	let i = t.xPt - e.flowBounds.xPt, a = t.yPt - e.flowBounds.yPt, o = n.layoutTranslationPt ?? {
		xPt: 0,
		yPt: 0
	}, s = Bd(n.pointToCss ?? Vd(n.scale), Hd(i, a)), c = zf(n.ctx, () => n.ctx.translate(i, a)), l = {
		...n,
		pointToCss: s,
		layoutTranslationPt: {
			xPt: o.xPt + i,
			yPt: o.yPt + a
		}
	};
	c(() => {
		e.kind === "paragraph" ? ip(e, l) : Gf(e, l, e.resolvedFloatingTables ?? [], r);
	})();
}
function Hf(e, t) {
	let n = Lf(t), r = /* @__PURE__ */ new Set();
	for (let n of e.compoundBorderFrames ?? []) If(n.bounds, n.border, t) && n.segmentIndexes.forEach((e) => r.add(e));
	e.borders.forEach((e, i) => {
		r.has(i) || Rf(e, t, n);
	});
}
function Uf(e, t, n) {
	let r = t.xPt - e.flowBounds.xPt, i = t.yPt - e.flowBounds.yPt, a = n.layoutTranslationPt ?? {
		xPt: 0,
		yPt: 0
	}, o = Bd(n.pointToCss ?? Vd(n.scale), Hd(r, i)), s = zf(n.ctx, () => n.ctx.translate(r, i)), c = {
		...n,
		pointToCss: o,
		layoutTranslationPt: {
			xPt: a.xPt + r,
			yPt: a.yPt + i
		}
	};
	s(() => {
		let t = () => Hf(e, c);
		if (!e.clipBounds) {
			t();
			return;
		}
		zf(n.ctx, () => {
			n.ctx.beginPath(), n.ctx.rect(e.clipBounds.xPt, e.clipBounds.yPt, e.clipBounds.widthPt, e.clipBounds.heightPt), n.ctx.clip();
		})(t)();
	})();
}
function Wf(e, t, n, r) {
	for (let n of e.rows) for (let e of n.cells) {
		let n = "visualMergeOwnership" in e && e.visualMergeOwnership === "continuation";
		if (e.verticalMerge === "continue" && !n) continue;
		e.background && (t.ctx.fillStyle = e.background.color, t.ctx.fillRect(e.flowBounds.xPt, e.flowBounds.yPt, e.flowBounds.widthPt, e.flowBounds.heightPt));
		let r = (t, n = !0) => {
			for (let r of e.blocks) Vf(r.layout, {
				xPt: e.contentBounds.xPt + (r.layout.kind === "table" ? r.layout.flowBounds.xPt : 0),
				yPt: e.flowBounds.yPt + r.offsetPt + (r.layout.kind === "table" ? r.layout.flowBounds.yPt : 0)
			}, t, r.layout.kind !== "table" || n);
		};
		if (!e.clipBounds) {
			r(t);
			continue;
		}
		if (zf(t.ctx, () => {
			t.ctx.beginPath(), t.ctx.rect(e.clipBounds.xPt, e.clipBounds.yPt, e.clipBounds.widthPt, e.clipBounds.heightPt), t.ctx.clip();
		})(() => r(t, !1))(), e.blocks.some((e) => e.layout.kind === "table")) {
			let n = Bf(e.clipBounds, t);
			zf(t.ctx, () => {
				t.ctx.beginPath(), t.ctx.rect(n.xPt, n.yPt, n.widthPt, n.heightPt), t.ctx.clip();
			})(() => {
				for (let n of e.blocks) n.layout.kind === "table" && Uf(n.layout, {
					xPt: e.contentBounds.xPt + n.layout.flowBounds.xPt,
					yPt: e.flowBounds.yPt + n.offsetPt + n.layout.flowBounds.yPt
				}, t);
			})();
		}
	}
	qf(n, t), r && Hf(e, t);
}
function Gf(e, t, n, r) {
	if (!e.clipBounds) {
		Wf(e, t, n, r);
		return;
	}
	let i = e.clipBounds;
	zf(t.ctx, () => {
		t.ctx.beginPath(), t.ctx.rect(i.xPt, i.yPt, i.widthPt, i.heightPt), t.ctx.clip();
	})(() => Wf(e, t, n, r))();
}
function Kf(e, t, n) {
	Gf(e, t, n ?? e.resolvedFloatingTables ?? [], !0);
}
function qf(e, t) {
	let n = t.layoutTranslationPt ?? {
		xPt: 0,
		yPt: 0
	};
	for (let r of e) Vf(r.child, {
		xPt: r.xPt - n.xPt,
		yPt: r.yPt - n.yPt
	}, t);
}
//#endregion
//#region packages/docx/src/paint/canvas-transform.ts
function Jf(e, t) {
	let n = e.transform;
	if (n) {
		n.call(e, t.a, t.b, t.c, t.d, t.e, t.f);
		return;
	}
	if (e.translate(t.e, t.f), t.a === 0 && t.b === 1 && t.c === -1 && t.d === 0) e.rotate(Math.PI / 2);
	else if (t.a === 0 && t.b === -1 && t.c === 1 && t.d === 0) e.rotate(-Math.PI / 2);
	else if (t.b === 0 && t.c === 0) e.scale(t.a, t.d);
	else throw Error("Canvas context cannot apply the retained point-space transform");
}
//#endregion
//#region packages/docx/src/paint/canvas-text.ts
function Yf(e) {
	if (e.text.length !== e.range.end - e.range.start) throw Error("UTF-16 text range is inconsistent");
	if (e.clusters.length === 0) throw Error("Retained glyph slices are incomplete (clusters)");
	let t = e.range.start;
	for (let n of e.clusters) {
		let { advancePt: r, offset: i, range: a } = n;
		if (!Number.isFinite(r) || !Number.isFinite(i.xPt) || !Number.isFinite(i.yPt) || a.start !== t || a.end <= a.start || a.end > e.range.end) throw Error(`Retained glyph slices are incomplete (cluster range ${t}:${a.start}-${a.end}/${e.range.end}; advance ${r}; offset ${i.xPt},${i.yPt})`);
		t = a.end;
	}
	if (t !== e.range.end) throw Error(`Retained glyph slices are incomplete (cluster end ${t}/${e.range.end})`);
	if (e.paintOps.length === 0) throw Error("Retained glyph slices are incomplete (paint ops)");
	let n = e.range.start;
	for (let t of e.paintOps) {
		let r = t.sourceMapping !== "kashida" && t.text.length !== t.range.end - t.range.start, i = !Number.isFinite(t.offset.xPt) || !Number.isFinite(t.offset.yPt) || t.glyphOffsetPt !== void 0 && (!Number.isFinite(t.glyphOffsetPt.xPt) || !Number.isFinite(t.glyphOffsetPt.yPt)) || t.blockAxisInkBounds !== void 0 && (!Number.isFinite(t.blockAxisInkBounds.startPt) || !Number.isFinite(t.blockAxisInkBounds.endPt) || t.blockAxisInkBounds.endPt < t.blockAxisInkBounds.startPt) || !Number.isFinite(t.letterSpacingPt) || !Number.isFinite(t.scaleX) || t.scaleX <= 0 || t.scaleY !== void 0 && (!Number.isFinite(t.scaleY) || t.scaleY <= 0), a = t.range.start !== n || t.range.end <= t.range.start || t.range.end > e.range.end;
		if (r || i || a) throw Error(`Retained glyph slices are incomplete (${r ? "text" : i ? "geometry" : `range ${n}:${t.range.start}-${t.range.end}/${e.range.end}`})`);
		n = t.range.end;
	}
	let r = e.text.slice(n - e.range.start);
	if (r !== "" && !/^\s+$/u.test(r)) throw Error(`Retained glyph slices are incomplete (paint end ${n}/${e.range.end})`);
}
function Xf(e, t) {
	return e.kind === "explicit" ? e.color : e.kind === "auto" ? Be(e.background ?? "#FFFFFF") : t.defaultTextColor ?? "#000000";
}
function Zf(e, t) {
	return Xf(e.color, t);
}
function Qf(e, t, n = !1) {
	let { ctx: r } = t;
	r.fillStyle = Xf(e.color, t), r.font = st(e.fontRoute, e.fontSizePt, e.fontWeight, e.fontStyle), n ? (r.save(), r.translate(e.origin.xPt, e.origin.yPt), r.rotate(-Math.PI / 2), r.fillText(e.text, 0, 0), r.restore()) : r.fillText(e.text, e.origin.xPt, e.origin.yPt);
}
function $f(e, t) {
	let { ctx: n } = t;
	if (n.beginPath(), e.points.length > 0) {
		let t = e.points[0];
		n.moveTo(t.xPt, t.yPt);
		for (let t of e.points.slice(1)) n.lineTo(t.xPt, t.yPt);
	}
	e.stroke !== null && (n.strokeStyle = e.stroke, n.lineWidth = e.strokeWidthPt, n.stroke()), e.fill !== null && (n.fillStyle = e.fill, n.fill());
}
function ep(e, t) {
	let n = new Map(e.textBoxes.map((e) => [e.id, e]));
	return (t.textBoxIds ?? []).flatMap((e) => {
		let t = n.get(e);
		return t ? [t] : [];
	});
}
function tp(e, t, n) {
	let r = n.layoutTranslationPt, i = e.anchorLayer?.horizontalOwnership === "page" ? -(r?.xPt ?? 0) : 0, a = e.anchorLayer?.verticalOwnership === "page" ? -(r?.yPt ?? 0) : 0;
	(i !== 0 || a !== 0) && (n.ctx.save(), n.ctx.translate(i, a));
	let o = (n) => {
		Nf(e, n);
		for (let e of t) ap(e, {
			...n,
			omitAnchoredDrawings: !1
		});
	};
	try {
		if (e.orientation === "upright-physical") {
			if (!e.transform) throw Error("Upright physical drawing requires its retained logical transform");
			let t = Bd(n.pointToCss ?? Vd(n.scale), e.transform);
			zf(n.ctx, () => {
				Jf(n.ctx, e.transform);
			})(() => o({
				...n,
				pointToCss: t
			}))();
		} else o(n);
	} finally {
		(i !== 0 || a !== 0) && n.ctx.restore();
	}
}
function np(e, t, n) {
	tp(t, ep(e, t), n);
}
function rp(e, t) {
	let { ctx: n } = t, r = new Set(e.drawings.flatMap((e) => e.textBoxIds ?? [])), i = (n) => np(e, n, t), a = e.drawings.filter((e) => e.anchorLayer?.behindDoc === !0).sort((e, t) => e.anchorLayer.relativeHeight - t.anchorLayer.relativeHeight || e.anchorLayer.sourceOrder - t.anchorLayer.sourceOrder);
	if (!t.omitAnchoredDrawings) for (let e of a) i(e);
	for (let t of e.lineNumbers ?? []) for (let e of t.paintOps) n.fillStyle = e.color, n.font = e.font, n.textAlign = e.textAlign, n.textBaseline = "alphabetic", n.fillText(e.text, e.origin.xPt, e.origin.yPt);
	e.shading && (n.fillStyle = e.shading.color, n.fillRect(e.inkBounds.xPt, e.inkBounds.yPt, e.inkBounds.widthPt, e.inkBounds.heightPt));
	for (let r of e.lines) {
		for (let e of r.barTabRules ?? []) Rf(e, t, Lf(t));
		for (let e of r.placements) {
			if (e.kind === "resource") {
				if (!t.resources) throw Error(`Missing retained resource painter for ${e.resourceKey}`);
				if (t.textBoxVerticalMode) {
					let r = t.textBoxVerticalMode === "vert270" ? Math.PI / 2 : -Math.PI / 2;
					n.save(), n.translate(e.bounds.xPt + e.bounds.widthPt / 2, e.bounds.yPt + e.bounds.heightPt / 2), n.rotate(r), Mf(e.resourceKey, e.resourceKind, {
						xPt: -e.bounds.heightPt / 2,
						yPt: -e.bounds.widthPt / 2,
						widthPt: e.bounds.heightPt,
						heightPt: e.bounds.widthPt
					}, e.orientation, t), n.restore();
				} else Mf(e.resourceKey, e.resourceKind, e.bounds, e.orientation, t);
				continue;
			}
			if (e.kind === "tab") {
				if (e.leader !== "none") {
					if (!e.leaderGlyphs) throw Error("Retained tab leader geometry is missing");
					for (let n of e.leaderGlyphs) Qf(n, t);
				}
				for (let n of e.decorations ?? []) Rf(n, t);
				continue;
			}
			if (e.kind !== "text") continue;
			if (Yf(e), e.unsupportedGeometry?.length) throw Error(`Unsupported retained typography geometry: ${e.unsupportedGeometry.join(", ")}`);
			if (e.highlightFragments) for (let t of e.highlightFragments) n.fillStyle = t.color, n.fillRect(t.rect.xPt, t.rect.yPt, t.rect.widthPt, t.rect.heightPt);
			else (e.background || e.highlight) && (n.fillStyle = e.highlight ?? e.background ?? "#000000", n.fillRect(e.bounds.xPt, e.bounds.yPt, e.bounds.widthPt, e.bounds.heightPt));
			n.fillStyle = Zf(e, t), n.font = st(e.fontRoute, e.fontSizePt, e.fontWeight, e.fontStyle), n.textAlign = "left", n.textBaseline = "alphabetic";
			let r = n.letterSpacing, i = n.fontKerning;
			for (let t of e.paintOps) {
				n.direction = t.direction, n.fontKerning = t.kerning;
				let r = e.origin.xPt + t.offset.xPt, i = e.origin.yPt + t.offset.yPt, a = t.glyphOffsetPt?.xPt ?? 0, o = t.glyphOffsetPt?.yPt ?? 0;
				if (t.glyphOrientation === "upright") {
					n.save(), n.translate(r, i), n.rotate(-Math.PI / 2), (t.scaleX !== 1 || t.scaleY !== void 0) && (t.writingMode === "vertical-rl" ? n.scale(1, t.scaleX) : n.scale(t.scaleX, t.scaleY ?? 1)), n.textAlign = "center", n.textBaseline = "middle", n.letterSpacing = `${t.letterSpacingPt}px`;
					let e = () => n.fillText(t.text, a, o);
					t.verticalFeature ? j(n, e) : e(), n.restore();
				} else t.glyphOrientation === "rotate" ? (n.save(), n.translate(r, i), t.scaleX !== 1 && n.scale(t.scaleX, 1), n.textAlign = "center", n.textBaseline = "middle", n.letterSpacing = `${t.letterSpacingPt / t.scaleX}px`, n.fillText(t.text, a, o), n.restore()) : t.scaleX === 1 ? (n.letterSpacing = `${t.letterSpacingPt}px`, n.fillText(t.text, r + a, i + o)) : (n.save(), n.translate(r + a, i + o), n.scale(t.scaleX, 1), n.letterSpacing = `${t.letterSpacingPt / t.scaleX}px`, n.fillText(t.text, 0, 0), n.restore());
			}
			if (n.letterSpacing = r, n.fontKerning = i, e.ruby) {
				let n = t.textBoxVerticalMode === "eaVert" || t.textBoxVerticalMode === "mongolianVert";
				for (let r of e.ruby.paintOps) Qf(r, t, n);
			}
			for (let n of e.emphasis?.glyphs ?? []) Qf(n, t);
			for (let n of e.emphasis?.paths ?? []) $f(n, t);
			for (let n of e.decorations) Rf(n, t);
			for (let n of e.runBorderFragments ?? []) Rf(n, t);
		}
	}
	let o = Lf(t);
	for (let n of e.borders) Rf(n, t, o);
	for (let t of e.drawings.filter((e) => !e.anchorLayer)) i(t);
	let s = e.drawings.filter((e) => e.anchorLayer && !e.anchorLayer.behindDoc).sort((e, t) => e.anchorLayer.relativeHeight - t.anchorLayer.relativeHeight || e.anchorLayer.sourceOrder - t.anchorLayer.sourceOrder);
	if (!t.omitAnchoredDrawings) for (let e of s) i(e);
	for (let n of e.textBoxes) r.has(n.id) || ap(n, {
		...t,
		omitAnchoredDrawings: !1
	});
}
function ip(e, t) {
	if (!e.clipBounds) {
		rp(e, t);
		return;
	}
	let n = e.clipBounds;
	zf(t.ctx, () => {
		t.ctx.beginPath(), t.ctx.rect(n.xPt, n.yPt, n.widthPt, n.heightPt), t.ctx.clip();
	})(() => rp(e, t))();
}
function ap(e, t) {
	let n = (t) => {
		for (let n of e.story.blocks) if (n.kind === "paragraph") ip(n, t);
		else if (n.kind === "table") Kf(n, t, n.resolvedFloatingTables ?? []);
		else throw Error(`Text-box story contains unsupported retained node: ${n.kind}`);
	}, r = Bd(t.pointToCss ?? Vd(t.scale), e.transform), i = e.transform.a !== 1 || e.transform.b !== 0 || e.transform.c !== 0 || e.transform.d !== 1 || e.transform.e !== 0 || e.transform.f !== 0, a = zf(t.ctx, () => {
		i && (e.verticalMode ? (t.ctx.translate(e.transform.e, e.transform.f), t.ctx.rotate(e.verticalMode === "vert270" ? -Math.PI / 2 : Math.PI / 2)) : t.ctx.transform(e.transform.a, e.transform.b, e.transform.c, e.transform.d, e.transform.e, e.transform.f));
	}), o = e.clipBounds ? zf(t.ctx, () => {
		t.ctx.beginPath(), t.ctx.rect(e.clipBounds.xPt, e.clipBounds.yPt, e.clipBounds.widthPt, e.clipBounds.heightPt), t.ctx.clip();
	}) : null, s = t.documentDefaultTextColor ?? t.defaultTextColor ?? "#000000", c = {
		...t,
		pointToCss: r,
		documentDefaultTextColor: s,
		defaultTextColor: e.defaultTextColor ?? s,
		...e.verticalMode ? { textBoxVerticalMode: e.verticalMode } : {}
	};
	a(() => {
		o ? o(() => n(c))() : n(c);
	})();
}
//#endregion
//#region packages/docx/src/paint/page-border.ts
function op(e, t) {
	let n = Bd(t.pointToCss ?? Vd(t.scale), e.logicalToPhysical), r = {
		...t,
		pointToCss: n
	};
	zf(t.ctx, () => {
		Jf(t.ctx, e.logicalToPhysical);
	})(() => {
		for (let t of e.segments) Rf(t, r, .5);
	})();
}
//#endregion
//#region packages/docx/src/paint/canvas-page.ts
var sp = Object.freeze({ paint(e, t) {
	throw Error(`Missing retained resource painter for ${e}: expected ${t}`);
} });
function cp(e, t) {
	return Object.freeze({ paint(n, r, i, a) {
		switch (r) {
			case "image":
				t.image(e.resolve(n, r), i, a);
				return;
			case "chart":
				t.chart(e.resolve(n, r), i, a);
				return;
			case "math":
				t.math(e.resolve(n, r), i, a);
				return;
			case "picture-bullet":
				t["picture-bullet"](e.resolve(n, r), i, a);
				return;
			default: throw Error(`Unknown retained resource kind: ${String(r)}`);
		}
	} });
}
function lp(e, t) {
	switch (e.kind) {
		case "drawing":
			Nf(e, t);
			return;
		case "paragraph":
			ip(e, t);
			return;
		case "table":
			Kf(e, t, e.resolvedFloatingTables ?? []);
			return;
		case "note": {
			e.separator.forEach((e) => Rf(e, t));
			let n = () => e.story.blocks.forEach((e) => lp(e, t));
			if (!e.story.clipBounds) {
				n();
				return;
			}
			let r = e.story.clipBounds;
			t.ctx.save();
			try {
				t.ctx.beginPath(), t.ctx.rect(r.xPt, r.yPt, r.widthPt, r.heightPt), t.ctx.clip(), n();
			} finally {
				t.ctx.restore();
			}
			return;
		}
		case "textbox": throw Error(`Unsupported page paint node kind: ${e.kind}`);
		default: throw Error(`Unknown page paint node kind: ${String(e)}`);
	}
}
function up(e, t) {
	let n = e.columnSeparators;
	if (n.length === 0) return;
	let { ctx: r } = t;
	r.save(), r.strokeStyle = "#000000";
	for (let e of n) {
		let n = jf(e, t.scale, t.dpr);
		r.lineWidth = n.widthPt, r.beginPath(), r.moveTo(n.segment.start.xPt, n.segment.start.yPt), r.lineTo(n.segment.end.xPt, n.segment.end.yPt), r.stroke();
	}
	r.restore();
}
function dp(e, t, n, r) {
	let i = n.get(e.flowDomainId), a = e.coordinateSpace === "upright-physical" ? void 0 : i?.coordinateSpace.logicalToPhysical, o = zf(t.ctx, () => {
		a && (a.a !== 1 || a.b !== 0 || a.c !== 0 || a.d !== 1 || a.e !== 0 || a.f !== 0) && Jf(t.ctx, a);
	}), s = {
		...t,
		...a ? { pointToCss: {
			a: a.a * t.scale,
			b: a.b * t.scale,
			c: a.c * t.scale,
			d: a.d * t.scale,
			e: a.e * t.scale,
			f: a.f * t.scale
		} } : {}
	};
	o(() => r(s))();
}
function fp(e, t) {
	if (e.kind === "transform") {
		let n = t.transform;
		if (n) n.call(t, e.transform.a, e.transform.b, e.transform.c, e.transform.d, e.transform.e, e.transform.f);
		else if (e.transform.a === 1 && e.transform.b === 0 && e.transform.c === 0 && e.transform.d === 1) t.translate(e.transform.e, e.transform.f);
		else throw Error("Canvas context cannot apply the retained page paint transform");
		return;
	}
	t.beginPath(), t.rect(e.clip.xPt, e.clip.yPt, e.clip.widthPt, e.clip.heightPt), t.clip();
}
function pp(e, t) {
	let n = t.pointToCss ?? Vd(t.scale);
	for (let t of e.frames) t.kind === "transform" && (n = Bd(n, t.transform));
	let r = {
		...t,
		pointToCss: n,
		layoutTranslationPt: e.layoutTranslationPt,
		omitAnchoredDrawings: !1
	}, i = 0;
	try {
		for (let n of e.frames) t.ctx.save(), i += 1, fp(n, t.ctx);
		tp(e.node, e.textBoxes, r);
	} finally {
		for (; i > 0;) t.ctx.restore(), --i;
	}
}
function mp(e, t) {
	let n = new Map(e.sectionRegions.flatMap((e) => e.flowDomainIds.map((t) => [t, e]))), r = new Map(e.sectionRegions.map((e) => [e.id, e]));
	for (let t of e.flowDomains) if (t.kind === "footnote" || t.kind === "endnote") {
		let i = t.sectionRegionId ? r.get(t.sectionRegionId) : e.sectionRegions[0];
		if (!i) throw Error(`${t.id} references missing page story region ${t.sectionRegionId ?? "<default>"}`);
		n.set(t.id, i);
	}
	let i = e.layers.paintOrder, a = i.findIndex((e) => e.sourceLayer !== "background" && e.sourceLayer !== "behindText" && e.sourceLayer !== "header"), o = a === -1 ? i.length : a, s = (e) => {
		for (let r of e) dp(r, t, n, (e) => {
			r.kind === "drawing" ? pp(r, e) : lp(r.node, {
				...e,
				omitAnchoredDrawings: r.omitAnchoredDrawings
			});
		});
	};
	e.pageBorder?.zOrder === "back" && op(e.pageBorder, t), s(i.slice(0, o)), up(e, t), s(i.slice(o));
	for (let n of e.changeBars ?? []) t.ctx.fillStyle = "#000000", t.ctx.fillRect(n.bounds.xPt, n.bounds.yPt, n.bounds.widthPt, n.bounds.heightPt);
	e.pageBorder?.zOrder !== "back" && e.pageBorder && op(e.pageBorder, t);
}
async function hp(e, t, n, r, i = sp) {
	let a = e.pages[t];
	if (!a) throw RangeError(`Page ${t} is outside the layout`);
	let o = n.getContext("2d");
	if (!o) throw Error("Canvas 2D context is unavailable");
	let s = r.scale * r.dpr;
	n.width = Math.ceil(a.geometry.widthPt * s), n.height = Math.ceil(a.geometry.heightPt * s), o.save();
	try {
		o.setTransform(1, 0, 0, 1, 0, 0), o.clearRect(0, 0, n.width, n.height), o.setTransform(s, 0, 0, s, 0, 0), mp(a, {
			ctx: o,
			scale: r.scale,
			dpr: r.dpr,
			resources: i
		});
	} finally {
		o.restore();
	}
}
//#endregion
//#region packages/docx/src/paint/resource-session.ts
function gp(e, t) {
	if (typeof e != "string" || e.trim().length === 0) throw TypeError(`${t} must be a non-empty string`);
}
function _p(e, t = {}) {
	return gp(e, "unavailable paint resource reason"), Object.freeze({
		status: "unavailable",
		reason: e,
		...t
	});
}
function vp(e) {
	return typeof e == "object" && !!e && e.status === "unavailable" && typeof e.reason == "string" && e.reason.trim().length > 0 && (e.placeholder === void 0 || e.placeholder === "tiff");
}
function yp(e) {
	if (typeof e != "object" || !e || e.status !== "unavailable") return;
	gp(e.reason, "unavailable paint resource reason");
	let t = e.placeholder;
	if (t !== void 0 && t !== "tiff") throw TypeError("unavailable paint resource placeholder must be tiff when supplied");
}
function bp(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of t) {
		if (n.has(r.resourceKey)) throw Error(`Duplicate paint resource handle: ${r.resourceKey}`);
		yp(r.handle), e.resolve(r.resourceKey, r.kind), n.set(r.resourceKey, Object.freeze({
			kind: r.kind,
			handle: r.handle
		}));
	}
	let r = Object.freeze([...n.keys()].sort());
	return Object.freeze({
		keys: r,
		resolve(t, r) {
			let i = e.resolve(t, r), a = n.get(t);
			if (!a) throw Error(`Missing paint resource handle for ${t}: expected ${r}`);
			if (a.kind !== r) throw Error(`Paint resource kind mismatch for ${t}: expected ${r}, got ${a.kind}`);
			return Object.freeze({
				descriptor: i,
				handle: a.handle
			});
		}
	});
}
function xp(e, t) {
	return bp(e, e.descriptors.map((e) => {
		if (e.kind === "chart") return {
			resourceKey: e.resourceKey,
			kind: e.kind,
			handle: null
		};
		let n = t(e);
		if (n == null) throw Error(`Missing ${e.kind} paint handle for ${e.resourceKey}`);
		return {
			resourceKey: e.resourceKey,
			kind: e.kind,
			handle: n
		};
	}));
}
//#endregion
//#region packages/docx/src/paint/canonical-resource-handlers.ts
function Sp(e) {
	if (!vp(e.handle)) {
		if (e.handle === void 0 || e.handle === null) throw Error(`Missing ${e.descriptor.kind} drawable for ${e.descriptor.resourceKey}`);
		return e.handle;
	}
}
function Cp(e, t, n) {
	let r = e.descriptor, i = Sp(e), a = vp(e.handle) ? e.handle.placeholder : void 0;
	if (!i && !a) return;
	let o = (e, o) => {
		i ? He(n, i, r.srcRect, e, o, t.widthPt, t.heightPt) : a === "tiff" && I(n, "tiff", {
			x: e,
			y: o,
			width: t.widthPt,
			height: t.heightPt
		});
	}, s = r.alpha !== void 0 && r.alpha < 1;
	s && (n.save(), n.globalAlpha *= r.alpha);
	let c = r.rotation ?? 0;
	c === 0 && !r.flipH && !r.flipV ? o(t.xPt, t.yPt) : (n.save(), n.translate(t.xPt + t.widthPt / 2, t.yPt + t.heightPt / 2), n.rotate(c * Math.PI / 180), n.scale(r.flipH ? -1 : 1, r.flipV ? -1 : 1), o(-t.widthPt / 2, -t.heightPt / 2), n.restore()), s && n.restore();
}
function wp(e, t, n) {
	let r = Sp(e);
	if (!r) {
		vp(e.handle) && e.handle.placeholder === "tiff" && I(n, "tiff", {
			x: t.xPt,
			y: t.yPt,
			width: t.widthPt,
			height: t.heightPt
		});
		return;
	}
	n.drawImage(r, t.xPt, t.yPt, t.widthPt, t.heightPt);
}
function Tp(e, t, n, r) {
	return Object.freeze({
		image(e, t, n) {
			Cp(e, t, n);
		},
		chart(i, a, o) {
			Ze(o, i.descriptor.model, {
				x: a.xPt,
				y: a.yPt,
				w: a.widthPt,
				h: a.heightPt
			}, 1, 0, e, t, n, r);
		},
		math(e, t, n) {
			wp(e, t, n);
		},
		"picture-bullet"(e, t, n) {
			wp(e, t, n);
		}
	});
}
var Ep = Tp(), Dp = /* @__PURE__ */ new WeakMap();
function Op(e) {
	Dp.set(e, (Dp.get(e) ?? 0) + 1);
}
function kp(e, t) {
	return (t ?? e.geometry.widthPt * 1.3333333333333333) / e.geometry.widthPt;
}
function Ap(e) {
	if (_e(e)) return e.ownerDocument ?? (typeof document > "u" ? null : document);
	let t = e.ownerDocument, n = t?.defaultView?.HTMLCanvasElement;
	return n && e instanceof n ? t : null;
}
function jp(e) {
	return Ap(e) !== null;
}
function Mp(e, t) {
	let n = Ap(e);
	if (!t || n && e.isConnected) return { canvas: e };
	let r = n ?? (typeof document > "u" ? void 0 : document);
	if (!r) throw Error("OpenType vertical glyph paint requires an element-backed document surface");
	let i = r.body ?? r.documentElement;
	if (!i) throw Error("OpenType vertical glyph paint requires an attached document surface");
	let a = r.createElement("canvas");
	return a.setAttribute("aria-hidden", "true"), Object.assign(a.style, {
		position: "fixed",
		left: "-99999px",
		top: "0",
		opacity: "0",
		pointerEvents: "none"
	}), i.appendChild(a), {
		canvas: a,
		release: () => a.remove()
	};
}
async function Np(e, t, n, r) {
	let i = (Dp.get(n) ?? 0) + 1;
	Dp.set(n, i);
	let a = () => Dp.get(n) !== i, o = t.layers.capabilities.resourceKeys, s = new Map(r.registry.descriptors.map((e) => [e.resourceKey, e])), c = o ? o.map((e) => {
		let t = s.get(e);
		if (!t) throw Error(`Missing retained paint resource descriptor: ${e}`);
		return t;
	}) : r.registry.descriptors, l = c.some((e) => e.kind === "image" || e.kind === "picture-bullet" || e.kind === "chart" && Re(e.model).length > 0), u = () => a() ? Promise.resolve() : Pp(e, t, n, r, c, a);
	return r.fetchImage && l ? A(r.fetchImage, r.imageResources, u) : u();
}
async function Pp(e, t, n, r, i, o) {
	let s;
	try {
		let c = r.dpr ?? ee(), l = Mp(n, !r.parseError && t.layers.capabilities.requiresElementBackedVerticalGlyphPaint), u = l.canvas;
		s = l.release;
		let d = u.getContext("2d");
		if (!d) throw Error("2D canvas is unavailable for DOCX paint");
		let f = kp(t, r.width), p = t.geometry.widthPt * f, m = t.geometry.heightPt * f, h = Xe(p * c, m * c), g = h.clamped ? c * h.scale : c;
		if (n.width = h.width, n.height = h.height, u !== n && (u.width = h.width, u.height = h.height), jp(n) && (n.style.width = `${p}px`, n.style.height = `${m}px`, n.style.display || (n.style.display = "block")), jp(u) && u !== n && (u.style.width = `${p}px`, u.style.height = `${m}px`), d.scale(g, g), d.fillStyle = "#ffffff", d.fillRect(0, 0, p, m), r.parseError) {
			await hp(e, 0, n, {
				scale: f,
				dpr: g
			});
			return;
		}
		let _;
		try {
			_ = await Of(i, r.rasterPaintOccurrences, r.fetchImage, r.tiff, f * g, r.svgDecoder, r.imageResources);
		} catch (e) {
			if (o()) return;
			throw e;
		}
		if (o()) return;
		let v = /* @__PURE__ */ new Map();
		if (r.fetchImage) {
			let e = r.fetchImage, t = /* @__PURE__ */ new Map();
			for (let e of r.rasterPaintOccurrences) {
				if (e.resourceKind !== "chart") continue;
				let n = t.get(e.resourceKey) ?? [];
				t.has(e.resourceKey) || t.set(e.resourceKey, n), n.push(e);
			}
			let n = [];
			for (let e of i) if (e.kind === "chart") for (let r of t.get(e.resourceKey) ?? []) {
				if (!Number.isFinite(r.widthPt) || r.widthPt <= 0 || !Number.isFinite(r.heightPt) || r.heightPt <= 0) continue;
				let t = {
					widthPt: r.widthPt,
					heightPt: r.heightPt,
					targetWidthPx: r.widthPt * f * g,
					targetHeightPx: r.heightPt * f * g
				}, i = [], a = !0;
				for (let n of Re(e.model)) {
					let e = ze(n, t);
					if (!e) {
						a = !1;
						break;
					}
					i.push({
						usage: n,
						size: e
					});
				}
				a && n.push({
					descriptor: e,
					frame: t,
					usages: i
				});
			}
			let o = /* @__PURE__ */ new Map();
			for (let e of R(n.map(({ descriptor: e }) => e.model), (e, t) => ze(e, n[t].frame) != null)) {
				let { fill: t } = e, n = Ke(t);
				o.has(n) || o.set(n, {
					fill: t,
					widthPt: 0,
					heightPt: 0,
					preserveNaturalSize: e.preserveNaturalSize,
					hasSourceCrop: e.hasSourceCrop
				});
			}
			for (let { usages: e } of n) for (let { usage: t, size: n } of e) {
				let { fill: e } = t, r = Ke(e), i = o.get(r);
				if (!i) continue;
				let a = i.preserveNaturalSize || t.preserveNaturalSize;
				o.set(r, {
					...i,
					widthPt: Math.max(i.widthPt, n.widthPt),
					heightPt: Math.max(i.heightPt, n.heightPt),
					targetWidthPx: a ? void 0 : Math.max(i.targetWidthPx ?? 0, n.targetWidthPx ?? 0) || void 0,
					targetHeightPx: a ? void 0 : Math.max(i.targetHeightPx ?? 0, n.targetHeightPx ?? 0) || void 0,
					preserveNaturalSize: a,
					hasSourceCrop: i.hasSourceCrop || t.hasSourceCrop
				});
			}
			await Promise.all([...o].map(async ([t, n]) => {
				if (_.has(t)) {
					let e = _.get(t);
					v.set(t, a(e, "tiff") ? null : e ?? null);
					return;
				}
				let { fill: i, widthPt: o, heightPt: s, targetWidthPx: c, targetHeightPx: l, hasSourceCrop: u } = n, d = c && l ? {
					targetWidthPx: c,
					targetHeightPx: l
				} : void 0;
				try {
					let n = (t) => r.svgDecoder ? N(t, e, {
						...d ?? {},
						workerDecoder: r.svgDecoder
					}) : N(t, e), a = () => i.mimeType === "image/svg+xml" ? i.duotone ? Promise.resolve(null) : n(i.imagePath) : Ef(i.imagePath, i.mimeType, void 0, e, o, s, i.duotone, !0, r.tiff, d), c, l = {
						svgImagePath: i.svgImagePath,
						srcRect: u ? !0 : null
					};
					if (!i.duotone && k(l)) try {
						c = await n(l.svgImagePath);
					} catch {
						c = await a();
					}
					else c = await a();
					v.set(t, c);
				} catch (e) {
					if (a(e, "tiff")) {
						v.set(t, null);
						return;
					}
					if (Ye(e) || $e(e)) throw e;
					v.set(t, null);
				}
			}));
		}
		if (o()) return;
		let y = cp(xp(r.registry, (e) => {
			if (e.kind === "math") return r.privateResources?.keys.includes(e.resourceKey) ? r.privateResources.resolve(e.resourceKey) : _p("optional math renderer unavailable");
			if (e.kind === "image" || e.kind === "picture-bullet") {
				let t = _.get(xf(e.partPath, e.colorReplaceFrom, e.duotone));
				return a(t, "tiff") ? _p("optional TIFF codec unavailable", { placeholder: "tiff" }) : t ?? _p(r.fetchImage ? "unsupported image format produced no drawable output" : "image byte source unavailable");
			}
		}), r.threeD || r.regionMap || r.chartEx || v.size > 0 ? Tp(r.threeD, r.regionMap, (e) => v.get(Ke(e)), r.chartEx) : Ep);
		d.save();
		try {
			d.scale(f, f), mp(t, {
				ctx: d,
				scale: f,
				dpr: g,
				resources: y,
				documentDefaultTextColor: r.defaultTextColor ?? "#000000",
				defaultTextColor: r.defaultTextColor ?? "#000000"
			});
		} finally {
			d.restore();
		}
		if (u !== n) {
			if (o()) return;
			let e = n.getContext("2d");
			if (!e) throw Error("2D canvas is unavailable for DOCX paint projection");
			e.drawImage(u, 0, 0);
		}
		if (r.onTextRun) for (let e of r.textRuns) r.onTextRun(e);
	} finally {
		s?.();
	}
}
//#endregion
//#region packages/docx/src/layout/body-layout-kernel.ts
var Fp = class extends Error {
	code = "NOTE_CAPACITY_EXCEEDED";
	constructor(e, t, n) {
		super(`${e} story exceeds ${n} on page ${t}`), this.kind = e, this.pageIndex = t, this.containerId = n, this.name = "NoteCapacityExceededError";
	}
};
//#endregion
//#region packages/docx/src/layout/body-pagination.ts
function Ip(e) {
	return Object.freeze({
		...e,
		pages: Object.freeze([...e.pages])
	});
}
function Lp(e) {
	let { kind: t, region: n, ...r } = e, i = Xu(r);
	if (n && (i = Zu(i, n)), t === "content" && i.sectionRegions.length === 0) throw RangeError("A content page draft requires an initial section region");
	if (t === "parity-blank" && i.sectionRegions.length !== 0) throw RangeError("A parity blank cannot retain a section region");
	return Object.freeze({
		kind: t,
		accumulator: i
	});
}
function Rp(e, t) {
	if (t.kind !== "content" || t.accumulator.pageIndex !== e.pageIndex) throw Error("The initial body page must be owned by the active flow");
	return Ip({
		flow: e,
		pages: [t],
		footnoteReservePt: 0,
		balanceTargetPt: null
	});
}
function zp(e, t) {
	if (t !== null && (!Number.isFinite(t) || t < 0)) throw RangeError("A body balance target must be finite and non-negative");
	return Ip({
		...e,
		balanceTargetPt: t
	});
}
function Bp(e, t) {
	if (!Number.isFinite(t) || t < 0) throw RangeError("A footnote reserve increment must be finite and non-negative");
	return t === 0 ? e : Ip({
		...e,
		footnoteReservePt: e.footnoteReservePt + t
	});
}
function Vp(e, t, n) {
	let r = [...e.pages], i = t.state, a = !1;
	for (let e of t.events) {
		if (e.type === "place") throw Error("Occurrence acceptance owns place events");
		if (e.type !== "next-column") {
			if (e.type === "next-page") {
				if (e.parityBlank) r.push(n.openParityBlankPage(e));
				else {
					let a = n.openContentPage(e, t.state);
					r.push(a.page), i = a.flow;
				}
				a = !0;
				continue;
			}
			if (!a) {
				let t = r.at(-1);
				if (!t || t.kind !== "content") throw Error("A continuous section requires an active content page");
				r[r.length - 1] = n.openSamePageSectionRegion(t, e, i);
			}
		}
	}
	let o = r.at(-1);
	if (!o || o.kind !== "content" || o.accumulator.pageIndex !== i.pageIndex) throw Error("A page transition must end on the active content page");
	return Ip({
		...e,
		flow: i,
		pages: r,
		footnoteReservePt: a ? 0 : e.footnoteReservePt,
		balanceTargetPt: a ? null : e.balanceTargetPt
	});
}
//#endregion
//#region packages/docx/src/layout/retained-geometry-translation.ts
function Hp(e) {
	if (e.length === 0) return null;
	let t = Math.min(...e.map((e) => e.xPt)), n = Math.min(...e.map((e) => e.yPt)), r = Math.max(...e.map((e) => e.xPt + e.widthPt)), i = Math.max(...e.map((e) => e.yPt + e.heightPt));
	return {
		xPt: t,
		yPt: n,
		widthPt: r - t,
		heightPt: i - n
	};
}
function Up(e) {
	return {
		x: !e.horzSpecified || e.horzAnchor !== "page" && e.horzAnchor !== "margin",
		y: e.vertAnchor !== "page" && e.vertAnchor !== "margin"
	};
}
function Y(e, t) {
	return {
		...e,
		xPt: e.xPt + t.xPt,
		yPt: e.yPt + t.yPt
	};
}
function X(e, t) {
	return {
		...e,
		xPt: e.xPt + t.xPt,
		yPt: e.yPt + t.yPt
	};
}
function Wp(e, t) {
	return {
		...e,
		from: Y(e.from, t),
		to: Y(e.to, t)
	};
}
function Gp(e, t) {
	return e.kind === "rect" ? {
		...e,
		rect: X(e.rect, t)
	} : {
		...e,
		points: e.points.map((e) => Y(e, t))
	};
}
function Kp(e, t) {
	return e.kind === "noop" ? e : e.kind === "drawingml-shape" || e.kind === "drawingml-image-fill" ? {
		...e,
		plan: {
			...e.plan,
			rect: {
				...e.plan.rect,
				x: e.plan.rect.x + t.xPt,
				y: e.plan.rect.y + t.yPt
			}
		}
	} : {
		...e,
		rect: X(e.rect, t)
	};
}
function qp(e, t) {
	let n = e.orientation === "upright-physical" ? {
		xPt: 0,
		yPt: 0
	} : t;
	return {
		...e,
		flowBounds: X(e.flowBounds, t),
		inkBounds: X(e.inkBounds, t),
		...e.clipBounds ? { clipBounds: X(e.clipBounds, t) } : {},
		...e.transform ? { transform: {
			...e.transform,
			e: e.transform.e + t.xPt,
			f: e.transform.f + t.yPt
		} } : {},
		...e.clip ? { clip: Gp(e.clip, t) } : {},
		commands: e.commands.map((e) => Kp(e, n))
	};
}
function Jp(e, t, n) {
	let r = `${t.xPt}\u0000${t.yPt}`, i = n.drawingMemo.get(e);
	if (i) {
		if (i.key !== r) throw Error("incompatible projection ownership");
		return i.value;
	}
	let a = qp(e, t);
	return n.drawingMemo.set(e, {
		key: r,
		value: a
	}), a;
}
function Yp(e, t, n) {
	return e.kind === "text" ? {
		...e,
		origin: Y(e.origin, t),
		bounds: X(e.bounds, t),
		decorations: e.decorations.map((e) => ({
			...e,
			from: Y(e.from, t),
			to: Y(e.to, t),
			...e.path ? { path: e.path.map((e) => Y(e, t)) } : {}
		})),
		...e.highlightFragments ? { highlightFragments: e.highlightFragments.map((e) => ({
			...e,
			rect: X(e.rect, t)
		})) } : {},
		...e.ruby ? { ruby: {
			...e.ruby,
			paintOps: e.ruby.paintOps.map((e) => ({
				...e,
				origin: Y(e.origin, t)
			}))
		} } : {},
		...e.emphasis ? { emphasis: {
			...e.emphasis,
			...e.emphasis.glyphs ? { glyphs: e.emphasis.glyphs.map((e) => ({
				...e,
				origin: Y(e.origin, t)
			})) } : {},
			...e.emphasis.paths ? { paths: e.emphasis.paths.map((e) => ({
				...e,
				points: e.points.map((e) => Y(e, t))
			})) } : {}
		} } : {},
		...e.runBorderFragments ? { runBorderFragments: e.runBorderFragments.map((e) => Wp(e, t)) } : {}
	} : e.kind === "anchor-host" ? {
		...e,
		bounds: X(e.bounds, t),
		baselinePt: e.baselinePt + t.yPt
	} : e.kind === "drawing" ? {
		...e,
		bounds: X(e.bounds, n?.get(e.drawingId) ?? t)
	} : e.kind === "tab" && (e.leaderGlyphs || e.decorations) ? {
		...e,
		...e.bounds ? { bounds: X(e.bounds, t) } : {},
		...e.leaderGlyphs ? { leaderGlyphs: e.leaderGlyphs.map((e) => ({
			...e,
			origin: Y(e.origin, t)
		})) } : {},
		...e.decorations ? { decorations: e.decorations.map((e) => ({
			...e,
			from: Y(e.from, t),
			to: Y(e.to, t),
			...e.path ? { path: e.path.map((e) => Y(e, t)) } : {}
		})) } : {}
	} : e.bounds ? {
		...e,
		bounds: X(e.bounds, t)
	} : e;
}
function Xp(e, t, n) {
	return {
		...e,
		bounds: X(e.bounds, t),
		baselinePt: e.baselinePt + t.yPt,
		placements: e.placements.map((e) => Yp(e, t, n)),
		...e.barTabRules ? { barTabRules: e.barTabRules.map((e) => ({
			...e,
			from: Y(e.from, t),
			to: Y(e.to, t)
		})) } : {}
	};
}
function Zp(e, t) {
	let n = e.axes[t];
	return n.status === "resolved" && [
		"page",
		"margin",
		"leftMargin",
		"rightMargin",
		"topMargin",
		"bottomMargin"
	].includes(n.referenceFrame);
}
function Qp(e, t) {
	let n = Zp(e, "horizontal") ? 0 : t.xPt, r = Zp(e, "vertical") ? 0 : t.yPt, i = {
		xPt: n,
		yPt: r
	}, a = {
		horizontal: e.axes.horizontal.status === "resolved" ? {
			...e.axes.horizontal,
			baseStartPt: e.axes.horizontal.baseStartPt + n,
			baseEndPt: e.axes.horizontal.baseEndPt + n,
			resolvedOriginPt: e.axes.horizontal.resolvedOriginPt + n
		} : e.axes.horizontal,
		vertical: e.axes.vertical.status === "resolved" ? {
			...e.axes.vertical,
			baseStartPt: e.axes.vertical.baseStartPt + r,
			baseEndPt: e.axes.vertical.baseEndPt + r,
			resolvedOriginPt: e.axes.vertical.resolvedOriginPt + r
		} : e.axes.vertical
	};
	return e.status === "unsupported" ? {
		...e,
		axes: a
	} : {
		...e,
		axes: a,
		geometry: {
			...e.geometry,
			objectFrame: X(e.geometry.objectFrame, i),
			inkBounds: X(e.geometry.inkBounds, i),
			wrapBounds: e.geometry.wrapBounds ? X(e.geometry.wrapBounds, i) : null,
			wrap: {
				...e.geometry.wrap,
				polygon: e.geometry.wrap.polygon ? {
					...e.geometry.wrap.polygon,
					points: e.geometry.wrap.polygon.points.map((e) => Y(e, i))
				} : null
			}
		}
	};
}
function $p(e, t) {
	return em(e, t, {
		memo: /* @__PURE__ */ new WeakMap(),
		drawingMemo: /* @__PURE__ */ new WeakMap()
	});
}
function em(e, t, n) {
	let r = `${t.xPt}\u0000${t.yPt}`, i = n.memo.get(e);
	if (i) {
		if (i.key !== r) throw Error("incompatible projection ownership");
		return i.value;
	}
	let a = new Map(e.drawings.flatMap((e) => e.anchorLayer ? [[e.anchorLayer.occurrenceId, e.anchorLayer]] : [])), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
	for (let n of e.drawings) {
		let e = {
			xPt: n.anchorLayer?.horizontalOwnership === "page" ? 0 : t.xPt,
			yPt: n.anchorLayer?.verticalOwnership === "page" ? 0 : t.yPt
		};
		s.set(n.id, e), n.textBoxIds?.forEach((t) => o.set(t, n.orientation === "upright-physical" ? {
			xPt: 0,
			yPt: 0
		} : e));
	}
	let c = e.drawings.map((e) => Jp(e, s.get(e.id) ?? t, n)), l = Hp(c.filter((e) => e.anchorLayer?.cellContainment === !0).map((e) => e.flowBounds)), u = {
		...e,
		flowBounds: X(e.flowBounds, t),
		inkBounds: X(e.inkBounds, t),
		...e.clipBounds ? { clipBounds: X(e.clipBounds, t) } : {},
		lines: e.lines.map((e) => Xp(e, t, s)),
		borders: e.borders.map((e) => Wp(e, t)),
		drawings: c,
		...l ? { cellContainmentBounds: l } : {},
		textBoxes: e.textBoxes.map((e) => nm(e, o.get(e.id) ?? t, n)),
		exclusions: e.exclusions.map((e) => {
			let n = e.anchorOccurrenceId ? a.get(e.anchorOccurrenceId) : void 0, r = {
				xPt: n?.horizontalOwnership === "page" ? 0 : t.xPt,
				yPt: e.verticalOwnership === "page" || n?.verticalOwnership === "page" ? 0 : t.yPt
			};
			return {
				...e,
				bounds: X(e.bounds, r),
				polygon: e.polygon.map((e) => Y(e, r))
			};
		}),
		...e.anchorCollisions ? { anchorCollisions: e.anchorCollisions.map((e) => ({
			...e,
			bounds: X(e.bounds, {
				xPt: e.horizontalOwnership === "page" ? 0 : t.xPt,
				yPt: e.verticalOwnership === "page" ? 0 : t.yPt
			})
		})) } : {},
		...e.anchorFrames ? { anchorFrames: e.anchorFrames.map((e) => Qp(e, t)) } : {},
		...e.paragraphMark ? { paragraphMark: {
			...e.paragraphMark,
			bounds: X(e.paragraphMark.bounds, t)
		} } : {},
		...e.lineNumbers ? { lineNumbers: e.lineNumbers.map((e) => ({
			...e,
			bounds: X(e.bounds, t),
			paintOps: e.paintOps.map((e) => ({
				...e,
				origin: Y(e.origin, t)
			}))
		})) } : {}
	};
	return n.memo.set(e, {
		key: r,
		value: u
	}), u;
}
function tm(e, t) {
	return nm(e, t, {
		memo: /* @__PURE__ */ new WeakMap(),
		drawingMemo: /* @__PURE__ */ new WeakMap()
	});
}
function nm(e, t, n) {
	let r = e.verticalMode === void 0;
	return {
		...e,
		flowBounds: X(e.flowBounds, t),
		inkBounds: X(e.inkBounds, t),
		...e.clipBounds ? { clipBounds: r ? X(e.clipBounds, t) : e.clipBounds } : {},
		...e.contentBounds ? { contentBounds: r ? X(e.contentBounds, t) : e.contentBounds } : {},
		transform: r ? e.transform : {
			...e.transform,
			e: e.transform.e + t.xPt,
			f: e.transform.f + t.yPt
		},
		story: r ? {
			...e.story,
			flowBounds: X(e.story.flowBounds, t),
			inkBounds: X(e.story.inkBounds, t),
			...e.story.clipBounds ? { clipBounds: X(e.story.clipBounds, t) } : {},
			blocks: e.story.blocks.map((e) => {
				if (e.kind === "paragraph") return em(e, t, n);
				if (e.kind === "table") return im(e, t);
				throw Error(`Text-box story contains unsupported retained node: ${e.kind}`);
			})
		} : e.story
	};
}
function rm(e, t) {
	return $p(e, t);
}
function im(e, t) {
	return {
		...e,
		flowBounds: X(e.flowBounds, t),
		inkBounds: X(e.inkBounds, t),
		...e.clipBounds ? { clipBounds: X(e.clipBounds, t) } : {},
		borders: e.borders.map((e) => Wp(e, t)),
		...e.compoundBorderFrames ? { compoundBorderFrames: e.compoundBorderFrames.map((e) => ({
			...e,
			bounds: X(e.bounds, t)
		})) } : {},
		rows: e.rows.map((e) => ({
			...e,
			flowBounds: X(e.flowBounds, t),
			inkBounds: X(e.inkBounds, t),
			...e.clipBounds ? { clipBounds: X(e.clipBounds, t) } : {},
			cells: e.cells.map((e) => ({
				...e,
				flowBounds: X(e.flowBounds, t),
				inkBounds: X(e.inkBounds, t),
				...e.clipBounds ? { clipBounds: X(e.clipBounds, t) } : {},
				contentBounds: X(e.contentBounds, t),
				blocks: e.blocks
			}))
		}))
	};
}
//#endregion
//#region packages/docx/src/layout/occurrence-projection.ts
function am(e, t) {
	return `${e}/occurrence/${encodeURIComponent(t).replaceAll("%3A", ":")}`;
}
function om(e) {
	if (!Number.isFinite(e.xPt) || !Number.isFinite(e.yPt)) throw RangeError("body occurrence translation must be finite");
}
function sm(e) {
	if (e.occurrenceId.length === 0) throw RangeError("occurrenceId must not be empty");
	if (e.destination.flowDomainId.length === 0) throw RangeError("flowDomainId must not be empty");
	om(e.destination.translation);
}
function cm(e, t) {
	let n = Up(e.positioning);
	return {
		xPt: n.x ? t.xPt : 0,
		yPt: n.y ? t.yPt : 0
	};
}
function lm(e) {
	let t = /* @__PURE__ */ new WeakSet(), n = /* @__PURE__ */ new WeakSet(), r = (e) => {
		if (t.has(e)) throw TypeError("body occurrence layout graph must be acyclic");
		if (!n.has(e)) {
			if (t.add(e), e.kind === "paragraph") for (let t of e.textBoxes) for (let e of t.story.blocks) (e.kind === "paragraph" || e.kind === "table") && r(e);
			else {
				for (let t of e.rows) for (let e of t.cells) for (let t of e.blocks) r(t.layout);
				for (let t of e.floatingTables ?? []) r(t.child);
				for (let t of e.resolvedFloatingTables ?? []) r(t.source.child), r(t.child);
			}
			t.delete(e), n.add(e);
		}
	};
	r(e);
}
function um(e, t) {
	lm(e);
	let n = /* @__PURE__ */ new WeakMap(), r = /* @__PURE__ */ new WeakMap(), i = (e) => `${e.xPt}\u0000${e.yPt}`, a = (e, t) => {
		let n = i(t), a = r.get(e);
		if (a) {
			if (a.key !== n) throw Error("incompatible projection ownership");
			return a.value;
		}
		let o = rm(e, t), s = Object.freeze({
			...o,
			...e.sectionFlowOwnership === void 0 ? {} : { sectionFlowOwnership: e.sectionFlowOwnership }
		});
		return r.set(e, {
			key: n,
			value: s
		}), s;
	}, o = (e, t) => {
		let r = i(t), a = n.get(e);
		if (a) {
			if (a.key !== r) throw Error("incompatible projection ownership");
			return a.value;
		}
		let s = {
			...im(e, t),
			...e.sectionFlowOwnership === void 0 ? {} : { sectionFlowOwnership: e.sectionFlowOwnership }
		};
		n.set(e, {
			key: r,
			value: s
		});
		let c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Set();
		for (let n of e.resolvedFloatingTables ?? []) {
			let r = e.resolvedFloatingTableCoordinateSpace !== void 0;
			c.set(n.source, r ? {
				xPt: 0,
				yPt: 0
			} : cm(n.source, t)), r && l.add(n.source);
		}
		let u = /* @__PURE__ */ new Map(), d = (e) => {
			let n = u.get(e);
			if (n) return n;
			let r = c.get(e) ?? t, i = l.has(e) ? {
				xPt: 0,
				yPt: 0
			} : t, a = {
				...e,
				anchorBounds: X(e.anchorBounds, i),
				...e.columnBounds ? { columnBounds: X(e.columnBounds, i) } : {},
				child: o(e.child, r)
			};
			return u.set(e, a), a;
		}, f = (e.floatingTables ?? []).map(d), p = (e.resolvedFloatingTables ?? []).map((e) => {
			let n = d(e.source), r = c.get(e.source) ?? cm(e.source, t);
			return {
				...e,
				xPt: e.xPt + r.xPt,
				yPt: e.yPt + r.yPt,
				bounds: X(e.bounds, r),
				exclusionBounds: X(e.exclusionBounds, r),
				child: n.child,
				source: n
			};
		});
		return (e.floatingTables || e.resolvedFloatingTables) && Object.assign(s, {
			floatingTables: f,
			resolvedFloatingTables: p
		}), s;
	};
	return e.kind === "paragraph" ? a(e, t) : o(e, t);
}
function dm(e, t) {
	return om(t), um(e, t);
}
function fm(e, t) {
	sm(t);
	let n = um(e, t.destination.translation), r = encodeURIComponent(t.occurrenceId), i = /* @__PURE__ */ new WeakMap(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new WeakMap(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = (e) => `${t.occurrenceId}/node/${encodeURIComponent(e)}`, u = (e) => `${t.occurrenceId}/anchor/${encodeURIComponent(e)}`, d = (e) => am(t.occurrenceId, e), f = (e, n) => `${t.destination.flowDomainId}/occurrence/${r}/${e}/${encodeURIComponent(n)}`, p = (e) => e.kind === "drawing" ? {
		...e,
		drawingId: l(e.drawingId)
	} : e.kind === "anchor-host" && e.anchorOccurrenceId ? {
		...e,
		anchorOccurrenceId: u(e.anchorOccurrenceId)
	} : e, m = (e, t) => {
		let n = o.get(e);
		if (n) {
			if (n.domain !== t) throw Error("incompatible projection ownership");
			return n.value;
		}
		if (e.anchorLayer) {
			let t = s.get(e.anchorLayer.occurrenceId);
			if (t && t !== e) throw Error("duplicate anchor occurrence owner");
			s.set(e.anchorLayer.occurrenceId, e);
		}
		let r = {
			...e,
			id: l(e.id),
			flowDomainId: t,
			...e.textBoxIds ? { textBoxIds: e.textBoxIds.map(l) } : {},
			...e.anchorLayer ? { anchorLayer: {
				...e.anchorLayer,
				occurrenceId: u(e.anchorLayer.occurrenceId),
				acquisitionOccurrenceId: e.anchorLayer.acquisitionOccurrenceId ?? e.anchorLayer.occurrenceId
			} } : {}
		};
		return o.set(e, {
			domain: t,
			value: r
		}), r;
	}, h = (e) => {
		let t = f("textbox", e.id);
		return {
			...e,
			id: l(e.id),
			flowDomainId: t,
			story: {
				...e.story,
				blocks: e.story.blocks.map((e) => {
					if (e.kind === "paragraph") return g(e, t);
					if (e.kind === "table") return b(e, t);
					throw Error(`Text-box story contains unsupported retained node: ${e.kind}`);
				})
			}
		};
	}, g = (e, t) => {
		let n = a.get(e);
		if (n) {
			if (n.domain !== t) throw Error("incompatible projection ownership");
			return n.value;
		}
		let r = {
			...e,
			id: l(e.id),
			flowDomainId: t,
			lines: e.lines.map((e) => ({
				...e,
				placements: e.placements.map(p)
			})),
			drawings: e.drawings.map((e) => m(e, t)),
			textBoxes: e.textBoxes.map(h),
			exclusions: e.exclusions.map((e) => ({
				...e,
				id: e.verticalOwnership === "page" && !e.anchorOccurrenceId ? e.id : l(e.id),
				...e.anchorOccurrenceId ? { anchorOccurrenceId: u(e.anchorOccurrenceId) } : {}
			})),
			...e.anchorCollisions ? { anchorCollisions: e.anchorCollisions.map((e) => ({
				...e,
				occurrenceId: u(e.occurrenceId)
			})) } : {},
			...e.anchorFrames ? { anchorFrames: e.anchorFrames.map((e) => ({
				...e,
				occurrenceId: u(e.occurrenceId)
			})) } : {}
		};
		return a.set(e, {
			domain: t,
			value: r
		}), r;
	}, _ = (e) => {
		let t = f("cell", e.id);
		return {
			...e,
			id: l(e.id),
			flowDomainId: t,
			blocks: e.blocks.map((e) => ({
				...e,
				layout: x(e.layout, t)
			}))
		};
	}, v = (e, t) => ({
		...e,
		id: l(e.id),
		flowDomainId: t,
		..."occurrenceId" in e && typeof e.occurrenceId == "string" ? { occurrenceId: d(e.occurrenceId) } : {},
		cells: e.cells.map(_)
	}), y = (e) => {
		let t = f("cell", e.hostCellId);
		return {
			...e,
			occurrenceId: d(e.occurrenceId),
			hostCellId: l(e.hostCellId),
			tableId: l(e.tableId),
			child: b(e.child, t)
		};
	}, b = (e, t) => {
		let n = i.get(e);
		if (n) {
			if (n.domain !== t) throw Error("incompatible projection ownership");
			return n.value;
		}
		let r = {
			...e,
			id: l(e.id),
			flowDomainId: t,
			rows: e.rows.map((e) => v(e, t))
		};
		i.set(e, {
			domain: t,
			value: r
		});
		let a = /* @__PURE__ */ new Map(), o = (e) => {
			let t = a.get(e);
			if (t) return t;
			let n = c.get(e.occurrenceId);
			if (n && n !== e) throw Error("duplicate floating placement occurrence owner");
			c.set(e.occurrenceId, e);
			let r = y(e);
			return a.set(e, r), r;
		}, s = (e.floatingTables ?? []).map(o), u = (e.resolvedFloatingTables ?? []).map((e) => {
			let t = o(e.source);
			return {
				...e,
				occurrenceId: d(e.occurrenceId),
				child: t.child,
				source: t
			};
		});
		return (e.floatingTables || e.resolvedFloatingTables) && Object.assign(r, {
			floatingTables: s,
			resolvedFloatingTables: u
		}), r;
	};
	function x(e, t) {
		return e.kind === "paragraph" ? g(e, t) : b(e, t);
	}
	let S = B(x(n, t.destination.flowDomainId), "DOCX body occurrence projection");
	if (S.kind !== "table" || e.kind !== "table") return S;
	let C = Object.isFrozen(e.columnWidthsPt) ? e.columnWidthsPt : Object.freeze([...e.columnWidthsPt]);
	return Object.freeze({
		...S,
		columnWidthsPt: C
	});
}
//#endregion
//#region packages/docx/src/layout/paginator.ts
var pm = class extends Error {
	code = "NEXT_COLUMN_DESTINATION_UNAVAILABLE";
	constructor(e, t, n, r) {
		super(`nextColumn requires a following column on the current page, but column ${e + 1} is unavailable (outgoing columns: ${t}, incoming columns: ${n}, reason: ${r})`), this.outgoingColumnIndex = e, this.outgoingColumnCount = t, this.incomingColumnCount = n, this.reason = r, this.name = "UnsupportedPageFlowTransitionError";
	}
};
function mm(e, t) {
	return e.sectionBidi ? [...t].reverse() : [...t];
}
function hm(e) {
	let t = mm(e.section, e.columnSubset);
	return t[t.indexOf(e.columnIndex) + 1];
}
function gm(e, t = {}) {
	let n = hu(e), r = gu(e), i = t.pageContentStartBlockPt ?? n, a = t.pageContentEndBlockPt ?? r, o = t.regionStartBlockPt ?? i, s = t.regionEndBlockPt ?? a, c = t.cursorBlockPt ?? o, l = t.deepestColumnBlockPt ?? c, u = t.pageIndex ?? 0, d = Object.freeze([...t.columnSubset ?? e.columns.map((e, t) => t)]), f = mm(e, d), p = t.columnIndex ?? f[0] ?? -1;
	if (!Number.isInteger(u) || u < 0) throw RangeError("Page index must be a non-negative integer");
	if (!Number.isInteger(p) || p < 0 || p >= e.columns.length) throw RangeError("Column index must identify a column in the active section");
	if (d.length === 0 || d.some((t, n) => !Number.isInteger(t) || t < 0 || t >= e.columns.length || n > 0 && t <= d[n - 1]) || !d.includes(p)) throw RangeError("Column subset must be ordered, unique, and contain the active column");
	if (![
		i,
		a,
		o,
		s,
		c,
		l
	].every(Number.isFinite)) throw RangeError("Page-flow cursors and bounds must be finite");
	if (i > o || o > s || s > a || o > c || c > s || c > l) throw RangeError("Page-flow bounds must contain the region and live cursor");
	return Object.freeze({
		pageIndex: u,
		columnIndex: p,
		pageHasContent: t.pageHasContent ?? !1,
		cursorBlockPt: c,
		pageContentStartBlockPt: i,
		pageContentEndBlockPt: a,
		regionStartBlockPt: o,
		regionEndBlockPt: s,
		columnSubset: d,
		deepestColumnBlockPt: l,
		section: e
	});
}
function _m(e, t) {
	return Object.freeze({
		state: e,
		events: Object.freeze(t.map((e) => Object.freeze({ ...e })))
	});
}
function vm(e, t, n) {
	if (!Number.isFinite(n) || n < 0) throw RangeError("A flow node charge must be a finite non-negative value");
	let r = e.cursorBlockPt, i = r + n;
	return _m(Object.freeze({
		...e,
		pageHasContent: !0,
		cursorBlockPt: i,
		deepestColumnBlockPt: Math.max(e.deepestColumnBlockPt, i)
	}), [{
		type: "place",
		node: t,
		blockStartPt: r,
		blockEndPt: i
	}]);
}
function ym(e, t) {
	let n = Math.max(e.deepestColumnBlockPt, e.cursorBlockPt), r = hm(e);
	if (r !== void 0) return _m(Object.freeze({
		...e,
		columnIndex: r,
		cursorBlockPt: e.regionStartBlockPt,
		deepestColumnBlockPt: n
	}), [{ type: "next-column" }]);
	let i = e.pageIndex + 1;
	return _m(gm(e.section, { pageIndex: i }), [{
		type: "next-page",
		reason: t,
		pageIndex: i,
		sectionOccurrenceId: e.section.sectionOccurrenceId,
		parityBlank: !1
	}]);
}
function bm(e, t) {
	return e.kind === t.kind && e.linePitchPt === t.linePitchPt && e.charSpacePt === t.charSpacePt;
}
function xm(e, t) {
	return e.xPt === t.xPt && e.yPt === t.yPt && e.widthPt === t.widthPt && e.heightPt === t.heightPt;
}
function Sm(e, t) {
	return e.xPt < t.xPt + t.widthPt && t.xPt < e.xPt + e.widthPt && e.yPt < t.yPt + t.heightPt && t.yPt < e.yPt + e.heightPt;
}
function Cm(e, t, n) {
	let r = (n) => {
		throw new pm(e.columnIndex, e.section.columns.length, t.columns.length, n);
	}, i = mi(e.section.textDirection), a = mi(t.textDirection);
	i !== a && r("writing-mode");
	let o = bi({
		widthPt: e.section.geometry.pageWidth,
		heightPt: e.section.geometry.pageHeight
	}, i), s = bi({
		widthPt: t.geometry.pageWidth,
		heightPt: t.geometry.pageHeight
	}, a);
	(o.widthPt !== s.widthPt || o.heightPt !== s.heightPt) && r("page-extent");
	let c = n.incomingPageContentStartBlockPt ?? hu(t), l = n.incomingPageContentEndBlockPt ?? gu(t);
	(c !== e.pageContentStartBlockPt || l !== e.pageContentEndBlockPt) && r("block-band"), bm(e.section.grid, t.grid) || r("grid");
	let u = mm(e.section, e.columnSubset), d = u.indexOf(e.columnIndex), f = u[d + 1];
	if (f === void 0) throw Error("nextColumn destination resolution requires a same-page successor");
	let p = Ei(i, o), m = e.section.columns[f], h = wi(p.logicalToPhysical, {
		xPt: m.xPt,
		yPt: e.regionStartBlockPt,
		widthPt: m.wPt,
		heightPt: e.regionEndBlockPt - e.regionStartBlockPt
	}), g = t.columns.findIndex((t) => xm(h, wi(p.logicalToPhysical, {
		xPt: t.xPt,
		yPt: e.regionStartBlockPt,
		widthPt: t.wPt,
		heightPt: e.regionEndBlockPt - e.regionStartBlockPt
	})));
	g < 0 && r("physical-column");
	let _ = mm(t, t.columns.map((e, t) => t)), v = _.indexOf(g);
	v < 0 && r("physical-column");
	let y = Object.freeze(_.slice(v).sort((e, t) => e - t)), b = Object.freeze(u.slice(0, d + 1).sort((e, t) => e - t)), x = (t, n) => {
		let r = t.columns[n];
		return wi(p.logicalToPhysical, {
			xPt: r.xPt,
			yPt: e.regionStartBlockPt,
			widthPt: r.wPt,
			heightPt: e.regionEndBlockPt - e.regionStartBlockPt
		});
	}, S = b.map((t) => x(e.section, t));
	return y.some((e) => {
		let n = x(t, e);
		return S.some((e) => Sm(e, n));
	}) && r("physical-overlap"), Object.freeze({
		targetColumnIndex: g,
		targetColumnOrdinal: v,
		columnSubset: y,
		outgoingColumnSubset: b
	});
}
function wm(e, t, n) {
	let r = e.pageIndex + 1;
	return _m(gm(t, { pageIndex: r }), [{
		type: "next-page",
		reason: n,
		pageIndex: r,
		sectionOccurrenceId: t.sectionOccurrenceId,
		parityBlank: !1
	}]);
}
function Tm(e, t) {
	let n = e % 2 == 0;
	return t === "odd" ? n : !n;
}
function Em(e, t, n, r) {
	let i = e.pageIndex + 1, a = [];
	return r !== void 0 && !Tm(i, r) && (a.push({
		type: "next-page",
		reason: "parity",
		pageIndex: i,
		sectionOccurrenceId: e.section.sectionOccurrenceId,
		parityBlank: !0
	}), i += 1), a.push({
		type: "next-page",
		reason: n,
		pageIndex: i,
		sectionOccurrenceId: t.sectionOccurrenceId,
		parityBlank: !1
	}), _m(gm(t, { pageIndex: i }), a);
}
function Dm(e, t, n) {
	return t === "lastRenderedPageBreak" ? _m(e, []) : t === "column" ? ym(e, "explicit-break") : t === "pageBreakBefore" && !e.pageHasContent && e.columnIndex === mm(e.section, e.columnSubset)[0] && e.cursorBlockPt === e.pageContentStartBlockPt ? _m(e, []) : t === "page" ? Em(e, e.section, "explicit-break", n) : wm(e, e.section, "page-break-before");
}
function Om(e, t, n, r = {}) {
	if (n === "continuous" && !r.hasFootnoteReferenceOnCurrentPage) {
		let n = e.section.columns.length > 1 ? Math.max(e.cursorBlockPt, e.deepestColumnBlockPt) : e.cursorBlockPt;
		return _m(gm(t, {
			pageIndex: e.pageIndex,
			pageContentStartBlockPt: e.pageContentStartBlockPt,
			pageContentEndBlockPt: e.pageContentEndBlockPt,
			cursorBlockPt: n,
			regionStartBlockPt: n,
			regionEndBlockPt: e.pageContentEndBlockPt,
			deepestColumnBlockPt: n,
			pageHasContent: e.pageHasContent
		}), [{
			type: "begin-section",
			placement: "same-page-block",
			section: t,
			targetColumnOrdinal: 0,
			columnSubset: t.columns.map((e, t) => t)
		}]);
	}
	if (n === "nextColumn") {
		if (hm(e) === void 0) {
			let n = wm(e, t, "section-break");
			return _m(n.state, [...n.events, {
				type: "begin-section",
				section: t
			}]);
		}
		let n = Cm(e, t, r);
		return _m(Object.freeze({
			...e,
			columnIndex: n.targetColumnIndex,
			columnSubset: n.columnSubset,
			cursorBlockPt: e.regionStartBlockPt,
			deepestColumnBlockPt: Math.max(e.deepestColumnBlockPt, e.cursorBlockPt),
			section: t
		}), [{ type: "next-column" }, {
			type: "begin-section",
			placement: "same-page-column",
			section: t,
			targetColumnOrdinal: n.targetColumnOrdinal,
			columnSubset: n.columnSubset,
			outgoingColumnSubset: n.outgoingColumnSubset
		}]);
	}
	if (n === "continuous") {
		let n = wm(e, t, "section-break");
		return _m(n.state, [...n.events, {
			type: "begin-section",
			section: t
		}]);
	}
	let i = Em(e, t, "section-break", n === "oddPage" ? "odd" : n === "evenPage" ? "even" : void 0);
	return _m(i.state, [...i.events, {
		type: "begin-section",
		section: t
	}]);
}
//#endregion
//#region packages/docx/src/line-fit-policy.ts
function km(e, t, n, r) {
	let i = e, a = 0;
	for (let o = e + 1; o <= t; o++) {
		let e = r(o);
		if (!(e <= n)) break;
		i = o, a = e;
	}
	return {
		end: i,
		fitValue: a
	};
}
function Am(e) {
	return !e.widowControl || e.end >= e.totalLines ? { kind: "keep" } : e.totalLines - e.end === 1 && e.end - e.start >= 2 ? { kind: "dropLastLine" } : e.start === 0 && e.end - e.start === 1 && e.canRelocate ? { kind: "relocate" } : { kind: "keep" };
}
U({
	id: "word-terminal-column-break",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/pagination.test.ts#ignores a terminal last-column break before a hard page boundary"
	},
	description: "The established pagination regression contract does not materialize a column transition when no body flow content occurs before the next forced page or non-continuous section boundary."
}), U({
	id: "word-pre-break-anchor-paragraph",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/pagination.test.ts#does not push an anchor-only pre-break paragraph to a new page just for its empty mark"
	},
	description: "The established pagination regression contract keeps an anchor-only paragraph immediately before an authored page break in the pre-break flow region without charging its otherwise visible paragraph mark."
}), U({
	id: "word-pre-break-inline-drawing-group",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/pagination.test.ts#moves a preceding image with its pre-break callout when the pair only fits fresh"
	},
	description: "The established pagination regression contract relocates a preceding inline DrawingML resource with an immediately following host-owned anchor paragraph before an authored page break when the pair fits only in a fresh flow region."
}), U({
	id: "word-continuous-section-mark-spacing",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/body-layout-input.test.ts#projects mutually exclusive collapsed-mark and drop-previous-after roles"
	},
	description: "The retained body input projects the established continuous-section empty-mark spacing behavior into one mutually exclusive role before pagination."
}), U({
	id: "word-contextual-spacing-per-side",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/contextual-spacing-body-paint.test.ts#paints the adjudicated six-case gap table"
	},
	description: "For same-style adjacent paragraphs, contextualSpacing removes only the contribution owned by each toggling side; a current-only toggle preserves the previous paragraph spaceAfter contribution."
}), U({
	id: "word-empty-keep-next-bridge",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/body-paginator-production.test.ts#bridges an undecorated empty keepNext mark through the following paragraph"
	},
	description: "Word print pagination treats an undecorated empty keep-with-next paragraph as a bridge: the following paragraph is admitted completely with the first indivisible content of its successor."
}), U({
	id: "word-automatic-keep-next-start-spacing",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/body-paginator-production.test.ts#suppresses leading spacing when a keepNext unit moves to an automatic page"
	},
	description: "When automatic overflow relocates a keep-with-next unit to a fresh physical page, suppress the leading paragraph space-before for that grouped relocation without changing ordinary overflow or authored-break spacing."
}), U({
	id: "word-trailing-space-after-fit-admission",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/paragraph-pagination.test.ts#admits final visible content when only authored spaceAfter crosses the region edge"
	},
	description: "Admit the final visible paragraph content at a flow-region edge when only its authored trailing space crosses the edge, while retaining that space for placement and paint."
}), U({
	id: "word-vertical-rl-final-line-baseline-admission",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "vertical-rl-final-line-baseline-admission",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "In a vertical-rl section, Word admits the final visible text column when its transformed baseline and retained visible ink remain inside the block-end edge even if the complete logical line box crosses that edge. The complete retained advance remains authoritative after admission."
}), U({
	id: "word-lowered-drop-cap-anchor-leading",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "lowered-drop-cap-anchor-leading",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "Word keeps the following anchor text below a baseline-lowered drop-cap glyph while preserving the drop cap exclusion height authored by framePr lines. ECMA-376 specifies those two inputs independently but does not prescribe this interaction."
});
function jm(e) {
	return Math.max(0, e);
}
function Mm(e) {
	return e === "none";
}
function Nm(e) {
	return Math.max(0, e.advancePt - Math.min(e.authoredSpaceAfterPt, e.retainedSpaceAfterPt));
}
function Pm(e) {
	return e.origin.yPt + (e.inkBounds?.descentPt ?? 0);
}
function Fm(e) {
	if (e.kind === "resource" || e.kind === "drawing") return e.bounds.yPt + e.bounds.heightPt;
	if (e.kind === "anchor-host") return null;
	if (e.kind === "tab") {
		let t = e.leaderGlyphs ?? [];
		return t.length > 0 ? Math.max(...t.map(Pm)) : null;
	}
	let t = e.paintOps ?? [], n = t.length > 0 ? t.map((t) => e.origin.yPt + t.offset.yPt + (t.blockAxisInkBounds?.endPt ?? t.inkBounds?.descentPt ?? 0)) : [e.origin.yPt];
	for (let t of e.decorations) {
		let e = t.widthPt / 2;
		n.push(t.from.yPt + e, t.to.yPt + e);
		for (let r of t.path ?? []) n.push(r.yPt + e);
	}
	for (let t of e.highlightFragments ?? []) n.push(t.rect.yPt + t.rect.heightPt);
	for (let t of e.runBorderFragments ?? []) {
		let e = t.widthPt / 2;
		n.push(t.from.yPt + e, t.to.yPt + e);
	}
	for (let t of e.emphasis?.glyphs ?? []) n.push(Pm(t));
	for (let t of e.ruby?.paintOps ?? []) n.push(Pm(t));
	for (let t of e.emphasis?.paths ?? []) {
		let e = t.stroke === null ? 0 : t.strokeWidthPt / 2;
		for (let r of t.points) n.push(r.yPt + e);
	}
	return Math.max(...n);
}
function Im(e) {
	if (e.writingMode !== "vertical-rl" || e.logicalLineBoxExtentPt <= e.availableBlockExtentPt) return e.logicalLineBoxExtentPt;
	let t = e.paragraph.lines.at(-1);
	if (!t || t.placements.some((e) => e.kind === "text" && (e.paintOps ?? []).some((e) => e.glyphOrientation !== void 0 && e.blockAxisInkBounds === void 0))) return e.logicalLineBoxExtentPt;
	let n = t.placements.flatMap((e) => {
		let t = Fm(e);
		return t === null ? [] : [t];
	});
	if (n.length === 0 || e.paragraph.shading) return e.logicalLineBoxExtentPt;
	for (let t of e.paragraph.borders) {
		let e = t.widthPt / 2;
		n.push(t.from.yPt + e, t.to.yPt + e);
	}
	if (e.paragraph.paragraphMark && !e.paragraph.paragraphMark.hidden) {
		let t = e.paragraph.paragraphMark.bounds;
		n.push(t.yPt + t.heightPt);
	}
	return Math.max(0, Math.max(...n) - e.paragraph.flowBounds.yPt);
}
function Lm(e) {
	return e.keepNext && e.inkless && e.undecoratedMark;
}
function Rm(e, t) {
	let n = e[t];
	if (n?.kind !== "body-block" || n.block.kind !== "paragraph") return;
	let r = e[t + 1], i = e[t + 2], a = n.block.inkless === !0 && r?.kind === "begin-section" && r.section.startType === "continuous";
	return a && n.block.spaceBeforePt === 0 ? "collapse-mark" : a ? "suppress-before" : n.block.inkless === !0 && r?.kind === "body-block" && r.block.kind === "paragraph" && r.block.inkless === !0 && r.block.spaceBeforePt === 0 && i?.kind === "begin-section" && i.section.startType === "continuous" ? "drop-previous-after" : void 0;
}
function zm(e) {
	return e.drawings.length > 0 && e.lines.every((e) => e.placements.every((e) => e.kind === "drawing" || e.kind === "anchor-host"));
}
function Bm(e) {
	return e.lines.some((e) => e.placements.some((e) => (e.kind === "resource" && (e.resourceKind === "image" || e.resourceKind === "chart") || e.kind === "drawing") && e.advancePt > 0 && e.bounds !== void 0 && e.bounds.widthPt > 0 && e.bounds.heightPt > 0));
}
function Vm(e, t) {
	if (!zm(e)) return null;
	let n = e.drawings.filter((e) => e.anchorLayer?.verticalOwnership === "host" && Number.isFinite(e.flowBounds.xPt) && Number.isFinite(e.flowBounds.yPt) && Number.isFinite(e.flowBounds.widthPt) && Number.isFinite(e.flowBounds.heightPt) && e.flowBounds.widthPt > 0 && e.flowBounds.heightPt > 0);
	if (n.length !== e.drawings.length) return null;
	let r = Math.max(...n.map((e) => e.flowBounds.yPt + e.flowBounds.heightPt));
	return Math.max(0, r - t);
}
function Hm(e) {
	if (!zm(e)) return null;
	let { paragraphMark: t, ...n } = e;
	return Object.freeze({
		...n,
		advancePt: 0,
		flowBounds: Object.freeze({
			...e.flowBounds,
			heightPt: 0
		})
	});
}
function Um(e) {
	let t = /* @__PURE__ */ new Set(), n = !1;
	for (let r = e.length - 1; r >= 0; --r) {
		let i = e[r];
		if (i.kind === "body-block") {
			n = i.block.kind !== "paragraph" || !i.block.pageBreakBefore;
			continue;
		}
		if (i.kind === "adjacent-table-group") {
			n = !0;
			continue;
		}
		if (i.kind === "authored-break") {
			i.break === "column" ? n && t.add(r) : n = !1;
			continue;
		}
		i.kind === "begin-section" && i.section.startType !== "continuous" && (n = !1);
	}
	return t;
}
U({
	id: "word-track-change-author-palette",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/compatibility.test.ts#pins the eight track-change author colors independently of author indexing"
	},
	description: "Use the established eight-color revision-author palette while keeping the renderer deterministic author-index policy outside this compatibility claim."
}), U({
	id: "word-track-change-decoration",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/compatibility.test.ts#maps visible track-change kinds to their revision decorations"
	},
	description: "When revision markup is visible, underline inserted text and strike through deleted text in the selected revision-author color."
}), U({
	id: "word-paragraph-shading-border-box",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/paragraph.test.ts#extends paragraph shading through visible border spacing"
	},
	description: "Extend paragraph shading through each visible paragraph-border spacing interval so the fill reaches the painted border box."
}), U({
	id: "word-auto-text-contrast-effective-background",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/cell-shading-auto-contrast.test.ts#paints a color-less run white inside a near-black cell"
	},
	description: "Resolve automatic or never-authored text color against the nearest effective run, paragraph, or cell background before applying the deterministic contrast picker."
}), U({
	id: "word-run-decoration-justified-advance",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/run-inline-formatting.test.ts#extends the border frame across justified inter-word slack"
	},
	description: "Extend run shading, borders, underline, and strike decoration through the justification pitch owned by that run, including widened spaces."
}), U({
	id: "word-snap-to-chars-terminal-underline",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "snap-to-chars-terminal-underline-boundaries",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "In the observed horizontal LTR snapToChars matrix, retain trailing character-cell slack in line advance while ending a terminal underline at the retained final-glyph ink extent. Authored trailing spaces remain content, and RTL/vertical text stays outside this rule."
}), U({
	id: "word-paragraph-border-flow-reservation",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/para-bottom-border-flow.test.ts#a bottom border drops the following paragraph by exactly space + width/2"
	},
	description: "Reserve a visible bottom paragraph border through its spacing interval and half stroke width so following flow begins below its painted outer edge."
});
var Wm = Object.freeze([
	"#C00000",
	"#0070C0",
	"#00B050",
	"#7030A0",
	"#E97132",
	"#196B24",
	"#9E480E",
	"#525252"
]);
U({
	id: "word-track-change-bar",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/track-changes-markup-layout.test.ts#emits one margin change bar per line containing revision text in the markup view"
	},
	description: "In the markup view, draw a vertical change bar in the margin beside every line that contains tracked-change content, matching the Word reviewing-pane convention (an app convention; ECMA-376 defines no bar geometry)."
});
var Gm = Object.freeze({
	underline: !1,
	strike: !1
}), Km = Object.freeze({
	underline: !0,
	strike: !1
}), qm = Object.freeze({
	underline: !1,
	strike: !0
});
function Jm(e) {
	return e === "insertion" || e === "moveTo" ? Km : e === "deletion" || e === "moveFrom" ? qm : Gm;
}
//#endregion
//#region packages/docx/src/text-distribute.ts
function Ym(e, t, n, r, i = -Infinity, a = !0, o = !1) {
	return Ie(e, t, {
		firstContentSi: n,
		lastDrawnSi: r,
		minPerGap: i,
		seaClusterGaps: o,
		...a ? {} : { isGapChar: () => !1 }
	});
}
function Xm(e) {
	if (!e) return 0;
	let t = 0;
	for (let n of e.perSeg.values()) t += n.splitBefore.length + +!!n.trailingGap;
	return e.perGap * t;
}
function Zm(e, t, n, r, i) {
	return t >= 0 ? null : Ym(e, t, n, r, -i * .25, !1);
}
//#endregion
//#region packages/docx/src/arabic-joining.generated.ts
var Qm = [
	"U",
	"C",
	"D",
	"L",
	"R",
	"T"
], $m = [
	0,
	173,
	174,
	768,
	880,
	1155,
	1162,
	1425,
	1470,
	1471,
	1472,
	1473,
	1475,
	1476,
	1478,
	1479,
	1480,
	1552,
	1563,
	1564,
	1565,
	1568,
	1569,
	1570,
	1574,
	1575,
	1576,
	1577,
	1578,
	1583,
	1587,
	1600,
	1601,
	1608,
	1609,
	1611,
	1632,
	1646,
	1648,
	1649,
	1652,
	1653,
	1656,
	1672,
	1690,
	1728,
	1729,
	1731,
	1740,
	1741,
	1742,
	1743,
	1744,
	1746,
	1748,
	1749,
	1750,
	1757,
	1759,
	1765,
	1767,
	1769,
	1770,
	1774,
	1776,
	1786,
	1789,
	1791,
	1792,
	1807,
	1808,
	1809,
	1810,
	1813,
	1818,
	1822,
	1823,
	1832,
	1833,
	1834,
	1835,
	1836,
	1837,
	1839,
	1840,
	1867,
	1869,
	1870,
	1881,
	1884,
	1899,
	1901,
	1905,
	1906,
	1907,
	1909,
	1912,
	1914,
	1920,
	1958,
	1969,
	1994,
	2027,
	2036,
	2042,
	2043,
	2045,
	2046,
	2070,
	2074,
	2075,
	2084,
	2085,
	2088,
	2089,
	2094,
	2112,
	2113,
	2118,
	2120,
	2121,
	2122,
	2132,
	2133,
	2134,
	2137,
	2140,
	2144,
	2145,
	2146,
	2150,
	2151,
	2152,
	2153,
	2155,
	2160,
	2179,
	2182,
	2183,
	2185,
	2190,
	2191,
	2192,
	2199,
	2208,
	2218,
	2221,
	2222,
	2223,
	2225,
	2227,
	2233,
	2234,
	2249,
	2250,
	2274,
	2275,
	2307,
	2362,
	2363,
	2364,
	2365,
	2369,
	2377,
	2381,
	2382,
	2385,
	2392,
	2402,
	2404,
	2433,
	2434,
	2492,
	2493,
	2497,
	2501,
	2509,
	2510,
	2530,
	2532,
	2558,
	2559,
	2561,
	2563,
	2620,
	2621,
	2625,
	2627,
	2631,
	2633,
	2635,
	2638,
	2641,
	2642,
	2672,
	2674,
	2677,
	2678,
	2689,
	2691,
	2748,
	2749,
	2753,
	2758,
	2759,
	2761,
	2765,
	2766,
	2786,
	2788,
	2810,
	2816,
	2817,
	2818,
	2876,
	2877,
	2879,
	2880,
	2881,
	2885,
	2893,
	2894,
	2901,
	2903,
	2914,
	2916,
	2946,
	2947,
	3008,
	3009,
	3021,
	3022,
	3072,
	3073,
	3076,
	3077,
	3132,
	3133,
	3134,
	3137,
	3142,
	3145,
	3146,
	3150,
	3157,
	3159,
	3170,
	3172,
	3201,
	3202,
	3260,
	3261,
	3263,
	3264,
	3270,
	3271,
	3276,
	3278,
	3298,
	3300,
	3328,
	3330,
	3387,
	3389,
	3393,
	3397,
	3405,
	3406,
	3426,
	3428,
	3457,
	3458,
	3530,
	3531,
	3538,
	3541,
	3542,
	3543,
	3633,
	3634,
	3636,
	3643,
	3655,
	3663,
	3761,
	3762,
	3764,
	3773,
	3784,
	3791,
	3864,
	3866,
	3893,
	3894,
	3895,
	3896,
	3897,
	3898,
	3953,
	3967,
	3968,
	3973,
	3974,
	3976,
	3981,
	3992,
	3993,
	4029,
	4038,
	4039,
	4141,
	4145,
	4146,
	4152,
	4153,
	4155,
	4157,
	4159,
	4184,
	4186,
	4190,
	4193,
	4209,
	4213,
	4226,
	4227,
	4229,
	4231,
	4237,
	4238,
	4253,
	4254,
	4957,
	4960,
	5906,
	5909,
	5938,
	5940,
	5970,
	5972,
	6002,
	6004,
	6068,
	6070,
	6071,
	6078,
	6086,
	6087,
	6089,
	6100,
	6109,
	6110,
	6151,
	6152,
	6154,
	6155,
	6158,
	6159,
	6160,
	6176,
	6265,
	6277,
	6279,
	6313,
	6314,
	6315,
	6432,
	6435,
	6439,
	6441,
	6450,
	6451,
	6457,
	6460,
	6679,
	6681,
	6683,
	6684,
	6742,
	6743,
	6744,
	6751,
	6752,
	6753,
	6754,
	6755,
	6757,
	6765,
	6771,
	6781,
	6783,
	6784,
	6832,
	6878,
	6880,
	6892,
	6912,
	6916,
	6964,
	6965,
	6966,
	6971,
	6972,
	6973,
	6978,
	6979,
	7019,
	7028,
	7040,
	7042,
	7074,
	7078,
	7080,
	7082,
	7083,
	7086,
	7142,
	7143,
	7144,
	7146,
	7149,
	7150,
	7151,
	7154,
	7212,
	7220,
	7222,
	7224,
	7376,
	7379,
	7380,
	7393,
	7394,
	7401,
	7405,
	7406,
	7412,
	7413,
	7416,
	7418,
	7616,
	7680,
	8203,
	8204,
	8205,
	8206,
	8208,
	8234,
	8239,
	8288,
	8293,
	8298,
	8304,
	8400,
	8433,
	11503,
	11506,
	11647,
	11648,
	11744,
	11776,
	12330,
	12334,
	12441,
	12443,
	42607,
	42611,
	42612,
	42622,
	42654,
	42656,
	42736,
	42738,
	43010,
	43011,
	43014,
	43015,
	43019,
	43020,
	43045,
	43047,
	43052,
	43053,
	43072,
	43122,
	43123,
	43204,
	43206,
	43232,
	43250,
	43263,
	43264,
	43302,
	43310,
	43335,
	43346,
	43392,
	43395,
	43443,
	43444,
	43446,
	43450,
	43452,
	43454,
	43493,
	43494,
	43561,
	43567,
	43569,
	43571,
	43573,
	43575,
	43587,
	43588,
	43596,
	43597,
	43644,
	43645,
	43696,
	43697,
	43698,
	43701,
	43703,
	43705,
	43710,
	43712,
	43713,
	43714,
	43756,
	43758,
	43766,
	43767,
	44005,
	44006,
	44008,
	44009,
	44013,
	44014,
	64286,
	64287,
	65024,
	65040,
	65056,
	65072,
	65279,
	65280,
	65529,
	65532,
	66045,
	66046,
	66272,
	66273,
	66422,
	66427,
	68097,
	68100,
	68101,
	68103,
	68108,
	68112,
	68152,
	68155,
	68159,
	68160,
	68288,
	68293,
	68294,
	68295,
	68296,
	68297,
	68299,
	68301,
	68302,
	68307,
	68311,
	68312,
	68317,
	68318,
	68321,
	68322,
	68324,
	68325,
	68327,
	68331,
	68335,
	68336,
	68480,
	68481,
	68482,
	68483,
	68486,
	68489,
	68490,
	68492,
	68493,
	68494,
	68496,
	68497,
	68498,
	68521,
	68525,
	68527,
	68864,
	68865,
	68898,
	68899,
	68900,
	68904,
	68969,
	68974,
	69291,
	69293,
	69314,
	69315,
	69317,
	69318,
	69320,
	69370,
	69376,
	69424,
	69427,
	69428,
	69445,
	69446,
	69457,
	69460,
	69461,
	69488,
	69492,
	69494,
	69506,
	69510,
	69552,
	69553,
	69554,
	69556,
	69559,
	69560,
	69561,
	69563,
	69565,
	69566,
	69568,
	69569,
	69570,
	69572,
	69573,
	69577,
	69578,
	69579,
	69580,
	69633,
	69634,
	69688,
	69703,
	69744,
	69745,
	69747,
	69749,
	69759,
	69762,
	69811,
	69815,
	69817,
	69819,
	69826,
	69827,
	69888,
	69891,
	69927,
	69932,
	69933,
	69941,
	70003,
	70004,
	70016,
	70018,
	70070,
	70079,
	70089,
	70093,
	70095,
	70096,
	70191,
	70194,
	70196,
	70197,
	70198,
	70200,
	70206,
	70207,
	70209,
	70210,
	70367,
	70368,
	70371,
	70379,
	70400,
	70402,
	70459,
	70461,
	70464,
	70465,
	70502,
	70509,
	70512,
	70517,
	70587,
	70593,
	70606,
	70607,
	70608,
	70609,
	70610,
	70611,
	70625,
	70627,
	70712,
	70720,
	70722,
	70725,
	70726,
	70727,
	70750,
	70751,
	70835,
	70841,
	70842,
	70843,
	70847,
	70849,
	70850,
	70852,
	71090,
	71094,
	71100,
	71102,
	71103,
	71105,
	71132,
	71134,
	71219,
	71227,
	71229,
	71230,
	71231,
	71233,
	71339,
	71340,
	71341,
	71342,
	71344,
	71350,
	71351,
	71352,
	71453,
	71454,
	71455,
	71456,
	71458,
	71462,
	71463,
	71468,
	71727,
	71736,
	71737,
	71739,
	71995,
	71997,
	71998,
	71999,
	72003,
	72004,
	72148,
	72152,
	72154,
	72156,
	72160,
	72161,
	72193,
	72203,
	72243,
	72249,
	72251,
	72255,
	72263,
	72264,
	72273,
	72279,
	72281,
	72284,
	72330,
	72343,
	72344,
	72346,
	72544,
	72545,
	72546,
	72549,
	72550,
	72551,
	72752,
	72759,
	72760,
	72766,
	72767,
	72768,
	72850,
	72872,
	72874,
	72881,
	72882,
	72884,
	72885,
	72887,
	73009,
	73015,
	73018,
	73019,
	73020,
	73022,
	73023,
	73030,
	73031,
	73032,
	73104,
	73106,
	73109,
	73110,
	73111,
	73112,
	73459,
	73461,
	73472,
	73474,
	73526,
	73531,
	73536,
	73537,
	73538,
	73539,
	73562,
	73563,
	78896,
	78913,
	78919,
	78934,
	90398,
	90410,
	90413,
	90416,
	92912,
	92917,
	92976,
	92983,
	94031,
	94032,
	94095,
	94099,
	94180,
	94181,
	113821,
	113823,
	113824,
	113828,
	118528,
	118574,
	118576,
	118599,
	119143,
	119146,
	119155,
	119171,
	119173,
	119180,
	119210,
	119214,
	119362,
	119365,
	121344,
	121399,
	121403,
	121453,
	121461,
	121462,
	121476,
	121477,
	121499,
	121504,
	121505,
	121520,
	122880,
	122887,
	122888,
	122905,
	122907,
	122914,
	122915,
	122917,
	122918,
	122923,
	123023,
	123024,
	123184,
	123191,
	123566,
	123567,
	123628,
	123632,
	124140,
	124144,
	124398,
	124400,
	124643,
	124644,
	124646,
	124647,
	124654,
	124656,
	124661,
	124662,
	125136,
	125143,
	125184,
	125252,
	125260,
	917505,
	917506,
	917536,
	917632,
	917760,
	918e3
], eh = [
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	2,
	0,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	1,
	2,
	4,
	2,
	5,
	0,
	2,
	5,
	4,
	0,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	0,
	4,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	4,
	0,
	2,
	0,
	2,
	0,
	5,
	4,
	5,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	5,
	0,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	0,
	5,
	0,
	2,
	5,
	0,
	1,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	5,
	0,
	2,
	0,
	2,
	0,
	4,
	2,
	4,
	0,
	4,
	1,
	2,
	0,
	2,
	4,
	2,
	0,
	5,
	2,
	4,
	0,
	4,
	2,
	4,
	2,
	4,
	2,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	2,
	0,
	1,
	5,
	0,
	5,
	0,
	2,
	0,
	5,
	2,
	5,
	2,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	1,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	2,
	3,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	2,
	4,
	0,
	4,
	0,
	4,
	0,
	3,
	4,
	2,
	3,
	2,
	4,
	2,
	4,
	0,
	4,
	5,
	0,
	2,
	4,
	0,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	2,
	4,
	0,
	4,
	2,
	0,
	3,
	2,
	4,
	2,
	5,
	0,
	5,
	0,
	5,
	0,
	4,
	2,
	0,
	2,
	0,
	5,
	0,
	2,
	4,
	2,
	0,
	5,
	2,
	4,
	0,
	2,
	4,
	2,
	5,
	0,
	2,
	0,
	2,
	4,
	0,
	2,
	4,
	2,
	4,
	2,
	0,
	2,
	4,
	2,
	0,
	4,
	2,
	3,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0,
	2,
	5,
	0,
	5,
	0,
	5,
	0,
	5,
	0
], th = [
	1587,
	1588,
	1589,
	1590,
	1690,
	1691,
	1692,
	1693,
	1694,
	1786,
	1787,
	1884,
	1901,
	1904,
	1917,
	1918,
	2223
], nh = [
	1580,
	1581,
	1582,
	1665,
	1666,
	1667,
	1668,
	1669,
	1670,
	1671,
	1727,
	1879,
	1880,
	1902,
	1903,
	1906,
	1916,
	2186,
	2210,
	2241,
	2245,
	2246
], rh = [
	1576,
	1578,
	1579,
	1646,
	1657,
	1658,
	1659,
	1660,
	1661,
	1662,
	1663,
	1664,
	1872,
	1873,
	1874,
	1875,
	1876,
	1877,
	1878,
	2208,
	2209,
	2230,
	2231,
	2232,
	2238,
	2239,
	2240
], ih = [
	1574,
	1585,
	1586,
	1597,
	1598,
	1599,
	1609,
	1610,
	1656,
	1681,
	1682,
	1683,
	1684,
	1685,
	1686,
	1687,
	1688,
	1689,
	1740,
	1742,
	1744,
	1745,
	1775,
	1883,
	1899,
	1900,
	1905,
	1909,
	1910,
	1911,
	2216,
	2217,
	2218,
	2226,
	2233,
	2234,
	69319
], ah = [
	1570,
	1571,
	1573,
	1575,
	1591,
	1592,
	1595,
	1596,
	1603,
	1604,
	1649,
	1650,
	1651,
	1653,
	1695,
	1705,
	1707,
	1708,
	1709,
	1710,
	1711,
	1712,
	1713,
	1714,
	1715,
	1716,
	1717,
	1718,
	1719,
	1720,
	1890,
	1891,
	1892,
	1898,
	1907,
	1908,
	1919,
	2160,
	2161,
	2162,
	2163,
	2164,
	2165,
	2166,
	2167,
	2168,
	2169,
	2170,
	2171,
	2172,
	2173,
	2174,
	2175,
	2176,
	2177,
	2178,
	2187,
	2188,
	2189,
	2211,
	2214,
	2224,
	2228,
	2242,
	2247,
	2248,
	69315,
	69316
], oh = [
	1572,
	1593,
	1594,
	1601,
	1602,
	1608,
	1647,
	1654,
	1655,
	1696,
	1697,
	1698,
	1699,
	1700,
	1701,
	1702,
	1703,
	1704,
	1732,
	1733,
	1734,
	1735,
	1736,
	1737,
	1738,
	1739,
	1743,
	1788,
	1885,
	1886,
	1887,
	1888,
	1889,
	1912,
	1913,
	2212,
	2213,
	2219,
	2227,
	2229,
	2243
];
//#endregion
//#region packages/docx/src/arabic-joining.ts
function sh(e) {
	let t = 0, n = $m.length - 1, r = -1;
	for (; t <= n;) {
		let i = t + (n - t >> 1);
		$m[i] <= e ? (r = i, t = i + 1) : n = i - 1;
	}
	return r < 0 ? "U" : Qm[eh[r]] ?? "U";
}
function ch(e) {
	let t = sh(e);
	return t === "D" || t === "L" || t === "C";
}
function lh(e) {
	let t = sh(e);
	return t === "D" || t === "R" || t === "C";
}
var uh = 1604, dh = new Set([
	1575,
	1570,
	1571,
	1573,
	1649
]), fh = 1600, ph = new Set(th), mh = new Set(nh), hh = new Set(rh), gh = new Set(ih), _h = new Set(ah), vh = new Set(oh), yh = /* @__PURE__ */ function(e) {
	return e[e.Normal = 7] = "Normal", e[e.Waw = 8] = "Waw", e[e.BaRa = 9] = "BaRa", e[e.Alef = 10] = "Alef", e[e.HahDal = 11] = "HahDal", e[e.Seen = 12] = "Seen", e[e.Kashida = 13] = "Kashida", e;
}(yh || {});
function bh(e) {
	let t = [...e].map((e) => e.codePointAt(0)), n = [], r = t.length > 0 && sh(t[0]) !== "T" ? 0 : -1;
	for (let e = 1; e < t.length; e++) {
		let i = t[e];
		if (sh(i) !== "T") {
			if (r >= 0) {
				let a = t[r];
				!(a === uh && dh.has(i)) && ch(a) && lh(i) && n.push(e);
			}
			r = e;
		}
	}
	return n;
}
function xh(e, t, n) {
	let r = t - 1;
	for (; r >= 0 && sh(e[r]) === "T";) r--;
	let i = e[r], a = e[t];
	return i === fh ? yh.Kashida : ph.has(i) ? yh.Seen : mh.has(i) ? yh.HahDal : Cs(t, n) && _h.has(a) ? yh.Alef : hh.has(i) && gh.has(a) ? yh.BaRa : Cs(t, n) && vh.has(a) ? yh.Waw : yh.Normal;
}
function Sh(e) {
	let t = [...e], n = [];
	for (let e = 0; e < t.length;) {
		for (; e < t.length && /\s/u.test(t[e]);) e++;
		if (e >= t.length) break;
		let r = e + 1;
		for (; r < t.length && !/\s/u.test(t[r]);) r++;
		let i = t.slice(e, r), a = i.map((e) => e.codePointAt(0)), o = a.length - 1;
		for (; o >= 0 && sh(a[o]) === "T";) o--;
		let s = -1, c = -1;
		for (let e of bh(i.join(""))) {
			let t = xh(a, e, o);
			t >= c && (s = e, c = t);
		}
		s >= 0 && n.push({
			beforeCp: e + s,
			priority: c
		}), e = r;
	}
	return n;
}
//#endregion
//#region packages/docx/src/kashida-justify.ts
var Ch = "ـ";
function wh(e, t) {
	let n = [...e], r = "";
	for (let e = 0; e < n.length; e++) {
		let i = t.get(e) ?? 0;
		i > 0 && (r += Ch.repeat(i)), r += n[e];
	}
	return r;
}
function Th(e, t, n, r) {
	if (t <= .5) return null;
	let i = [];
	for (let t = 0; t < e.length; t++) {
		let n = e[t].text;
		if (n !== void 0) for (let { beforeCp: e, priority: r } of Sh(n)) i.push({
			si: t,
			beforeCp: e,
			priority: r,
			textOrder: i.length
		});
	}
	if (i.length === 0) return null;
	i.sort((e, t) => t.priority - e.priority || e.textOrder - t.textOrder);
	let a = n === "low" ? 1 : n === "medium" ? 2 : Infinity, o = a, s = i.length * 64, c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
	for (let { si: t } of i) {
		if (u.has(t)) continue;
		let n = r(t, e[t].text);
		l.set(t, n), u.set(t, n);
	}
	let d = t, f = 0;
	for (let t = 0; t < o && d > .5 && f < s; t++) {
		let t = !1;
		for (let { si: n, beforeCp: o } of i) {
			if (d <= .5 || f >= s) break;
			let i = c.get(n);
			i || (i = /* @__PURE__ */ new Map(), c.set(n, i));
			let l = i.get(o) ?? 0;
			if (l >= a) continue;
			i.set(o, l + 1);
			let p = r(n, wh(e[n].text, i)), m = p - u.get(n);
			m > 0 && m <= d + 1e-6 ? (u.set(n, p), d -= m, f++, t = !0) : l === 0 ? i.delete(o) : i.set(o, l);
		}
		if (!t) break;
	}
	let p = /* @__PURE__ */ new Map();
	for (let [t, n] of c) {
		let r = [...n.entries()].filter(([, e]) => e > 0).sort(([e], [t]) => e - t).map(([e, t]) => ({
			beforeCp: e,
			count: t
		}));
		r.length !== 0 && p.set(t, {
			text: wh(e[t].text, n),
			insertions: r,
			advanceDeltaPx: u.get(t) - l.get(t)
		});
	}
	if (p.size === 0) return null;
	let m = [...p.values()].reduce((e, t) => e + t.advanceDeltaPx, 0);
	return {
		perSeg: p,
		appliedPx: m,
		residualPx: t - m
	};
}
//#endregion
//#region packages/docx/src/layout/shape-drawing-plan.ts
var Eh = 1;
function Dh(e) {
	return Object.freeze({
		status: "unsupported",
		command: Object.freeze({ kind: "noop" }),
		diagnostics: Object.freeze([Object.freeze({
			code: "UNSUPPORTED_FEATURE",
			severity: "error",
			message: e
		})])
	});
}
function Oh(e) {
	return e ? {
		type: e.type,
		w: e.w,
		len: e.len
	} : void 0;
}
function kh(e) {
	if (e) return e.fillType === "gradient" ? {
		fillType: "gradient",
		stops: e.stops.map((e) => ({
			position: e.position,
			color: e.color
		})),
		angle: e.angle,
		gradType: e.gradType,
		...e.scaled === void 0 ? {} : { scaled: e.scaled },
		...e.path === void 0 ? {} : { path: e.path },
		...e.fillToRect === void 0 ? {} : { fillToRect: { ...e.fillToRect } },
		...e.tileRect === void 0 ? {} : { tileRect: { ...e.tileRect } },
		...e.flip === void 0 ? {} : { flip: e.flip },
		...e.rotWithShape === void 0 ? {} : { rotWithShape: e.rotWithShape }
	} : {
		fillType: "pattern",
		fg: e.fg,
		bg: e.bg,
		preset: e.preset
	};
}
function Ah(e) {
	if (!e.stroke || !e.strokeWidth || e.strokeWidth <= 0) return null;
	let t = kh(e.strokeFill);
	return {
		color: e.stroke,
		width: e.strokeWidth,
		...t ? { fill: t } : {},
		...e.strokeDash ? { dashStyle: e.strokeDash } : {},
		...e.strokeCustomDash?.length ? { customDash: e.strokeCustomDash } : {},
		...e.strokeCap ? { lineCap: e.strokeCap } : {},
		...e.strokeJoin ? { lineJoin: e.strokeJoin } : {},
		...e.strokeMiterLimit !== void 0 && e.strokeMiterLimit !== null ? { miterLimit: e.strokeMiterLimit } : {},
		...e.strokeAlignment ? { alignment: e.strokeAlignment } : {},
		...e.strokeCompound ? { cmpd: e.strokeCompound } : {},
		...Oh(e.headEnd) ? { headEnd: Oh(e.headEnd) } : {},
		...Oh(e.tailEnd) ? { tailEnd: Oh(e.tailEnd) } : {}
	};
}
function jh(e, t, n, r, i) {
	let a = r !== void 0 && (r.textPathOk !== void 0 || r.on !== void 0 || r.fitShape !== void 0 || r.fitPath !== void 0 || r.trim !== void 0 || r.xScale !== void 0);
	if (r !== void 0 && (!a || r.textPathOk === !0 && r.on === !0)) {
		if (e.fill?.fillType === "image") return Dh("VML textPath with a DrawingML image fill is not rendered");
		if (r.fitPath === !0) return Dh("VML textPath fitPath=true is not rendered");
		if (r.xScale === !0) return Dh("VML textPath xScale=true is not rendered");
		if (r.string.trim().length === 0) return Object.freeze({
			status: "planned",
			command: Object.freeze({ kind: "noop" })
		});
		if (!n) throw Error("Shape textPath acquisition requires TextLayoutService");
		let i = a ? r.fitShape === !0 : !0;
		if (r.fontSizePt !== void 0 && (!Number.isFinite(r.fontSizePt) || r.fontSizePt < 0)) throw RangeError("VML textPath fontSizePt must be finite and non-negative");
		if (!i && r.fontSizePt === void 0) return Dh("VML textPath fitShape=false requires an authored font-size");
		if (r.fontSizePt === 0) return Object.freeze({
			status: "planned",
			command: Object.freeze({ kind: "noop" })
		});
		let o = r.fontSizePt ?? Eh, s = r.fontFamily ?? void 0, c = n.shape({
			text: r.string,
			fontSizePt: o,
			fonts: {
				ascii: s,
				highAnsi: s,
				eastAsia: s,
				complexScript: s
			},
			weight: r.bold ? 700 : 400,
			style: r.italic ? "italic" : "normal",
			measure: !0
		});
		if (r.trim === !0 && !c.inkBounds) return Dh("VML textPath trim=true requires glyph ink bounds");
		let l = r.trim === !0 ? c.inkBounds?.xMinPt ?? 0 : 0, u = r.trim === !0 ? c.inkBounds?.xMaxPt ?? 0 : c.advancePt, d = r.trim === !0 ? c.inkBounds?.ascentPt ?? 0 : c.ascentPt, f = r.trim === !0 ? c.inkBounds?.descentPt ?? 0 : c.descentPt, p = {
			xPt: l,
			yPt: -d,
			widthPt: u - l,
			heightPt: d + f
		};
		if (!Number.isFinite(c.advancePt) || Object.values(p).some((e) => !Number.isFinite(e)) || c.spans.some((e) => !Number.isFinite(e.advancePt))) throw Error("Shape textPath acquisition produced non-finite metrics");
		return p.widthPt <= 0 || p.heightPt <= 0 || c.spans.length === 0 ? Dh("VML textPath produced empty glyph metrics") : Object.freeze({
			status: "planned",
			command: B({
				kind: "watermark-text",
				rect: { ...t },
				text: r.string,
				fill: e.fill ? {
					...e.fill,
					...e.fill.fillType === "gradient" ? { stops: e.fill.stops.map((e) => ({ ...e })) } : {}
				} : null,
				opacity: Math.max(0, Math.min(1, e.fillOpacity ?? 1)),
				rotationDeg: e.rotation ?? 0,
				fitShape: i,
				fontSizePt: o,
				sourceBounds: p,
				spans: c.spans.map((e) => ({
					text: e.text,
					advancePt: e.advancePt,
					fontRoute: e.fontRoute,
					fontWeight: e.font.weight,
					fontStyle: e.font.style
				}))
			}, "VML textPath command")
		});
	}
	let o = {
		rect: {
			x: t.xPt,
			y: t.yPt,
			w: t.widthPt,
			h: t.heightPt
		},
		geometry: e.presetGeometry ? {
			kind: "preset",
			name: e.presetGeometry,
			adjustments: [...e.adjValues ?? []]
		} : {
			kind: "custom",
			subpaths: e.subpaths.map((e) => e.map((e) => ({ ...e })))
		},
		fill: e.fill && e.fill.fillType !== "image" ? {
			...e.fill,
			...e.fill.fillType === "gradient" ? { stops: e.fill.stops.map((e) => ({ ...e })) } : {}
		} : null,
		stroke: Ah(e),
		transform: {
			rotationDeg: e.rotation ?? 0,
			flipH: e.flipH ?? !1,
			flipV: e.flipV ?? !1
		}
	};
	if (e.fill?.fillType === "image") {
		if (e.fill.tile !== void 0) return Object.freeze({
			status: "unsupported",
			command: Object.freeze({ kind: "noop" }),
			diagnostics: Object.freeze([Object.freeze({
				code: "UNSUPPORTED_FEATURE",
				severity: "error",
				message: "Tiled DrawingML shape image fills are not rendered"
			})])
		});
		if (!i) throw Error("DrawingML shape image fill requires a retained image resource key");
		return Object.freeze({
			status: "planned",
			command: B({
				kind: "drawingml-image-fill",
				plan: o,
				resourceKey: i,
				...e.fill.fillRect === void 0 ? {} : { fillRect: {
					l: e.fill.fillRect.l ?? 0,
					t: e.fill.fillRect.t ?? 0,
					r: e.fill.fillRect.r ?? 0,
					b: e.fill.fillRect.b ?? 0
				} }
			}, "DrawingML shape image-fill command")
		});
	}
	return Object.freeze({
		status: "planned",
		command: B({
			kind: "drawingml-shape",
			plan: o
		}, "DrawingML shape command")
	});
}
//#endregion
//#region packages/docx/src/layout/textbox-input.ts
function Mh(e, t) {
	let n = e.fontFamily ?? null;
	return {
		fontSizePt: t,
		fonts: {
			ascii: n,
			highAnsi: n,
			eastAsia: e.fontFamilyEastAsia ?? n,
			complexScript: n
		},
		weight: 400,
		style: "normal",
		complexScript: !1
	};
}
function Nh(e, t = {
	story: "textbox",
	storyInstance: "shape",
	path: []
}, n = Mh) {
	return B((e.textBlocks ?? []).map((e, r) => {
		let i = {
			story: "textbox",
			storyInstance: t.storyInstance,
			path: [...t.path, r]
		}, a = e.runs?.length ? e.runs : [{
			text: e.text,
			fontSizePt: e.fontSizePt,
			color: e.color,
			fontFamily: e.fontFamily,
			bold: e.bold,
			italic: e.italic
		}], o = e.paragraphMarkColor === void 0 ? e.color ?? a[0]?.color : e.paragraphMarkColor ?? void 0, s = e.numbering ? {
			...e.numbering,
			...e.numbering.color == null && !e.numbering.colorAuto && o ? { color: o } : {}
		} : null;
		return {
			source: i,
			spacing: {
				beforePt: e.spaceBefore ?? 0,
				afterPt: e.spaceAfter ?? 0
			},
			runs: a.map((t) => ({
				text: t.text,
				fontSizePt: t.fontSizePt,
				...t.color ?? e.color ? { color: `#${t.color ?? e.color}` } : {},
				...t.fontFamily || e.fontFamily ? { fontFamily: t.fontFamily ?? e.fontFamily ?? void 0 } : {},
				...t.fontFamilyEastAsia ? { fontFamilyEastAsia: t.fontFamilyEastAsia } : {},
				bold: t.bold ?? e.bold ?? !1,
				italic: t.italic ?? e.italic ?? !1,
				...t.ruby ? { ruby: t.ruby } : {}
			})),
			alignment: e.alignment ?? "left",
			indentLeftPt: e.indentLeft ?? 0,
			indentRightPt: e.indentRight ?? 0,
			indentFirstPt: e.indentFirst ?? 0,
			lineSpacing: e.lineSpacingVal == null ? null : {
				value: e.lineSpacingVal,
				rule: e.lineSpacingRule === "exact" || e.lineSpacingRule === "atLeast" ? e.lineSpacingRule : "auto",
				explicit: !0
			},
			tabStops: (e.tabStops ?? []).map((e) => ({ ...e })),
			...e.bidi === void 0 ? {} : { bidi: e.bidi },
			contextualSpacing: e.contextualSpacing ?? !1,
			...e.styleId === void 0 ? {} : { styleId: e.styleId },
			...s ? {
				numbering: s,
				numberingMarkerShapeInput: n(s, e.fontSizePt)
			} : {},
			...e.imagePath ? { image: {
				imagePath: e.imagePath,
				mimeType: e.mimeType ?? "application/octet-stream",
				...e.svgImagePath ? { svgImagePath: e.svgImagePath } : {},
				widthPt: e.imageWidthPt ?? 0,
				heightPt: e.imageHeightPt ?? 0
			} } : {}
		};
	}), "DOCX text box acquisition input");
}
//#endregion
//#region packages/docx/src/layout/retained-typography.ts
function Ph(e) {
	if (!Number.isFinite(e.advancePt) || e.advancePt <= 0) throw RangeError("Tab leader glyph advance must be finite and positive");
	let t = Math.floor(e.interval.widthPt / e.advancePt), n = e.interval.widthPt - t * e.advancePt;
	return Array.from({ length: t }, (t, r) => ({
		text: e.glyph,
		origin: {
			xPt: e.interval.xPt + n / 2 + r * e.advancePt,
			yPt: e.baselinePt
		},
		fontRoute: e.fontRoute,
		fontSizePt: e.fontSizePt,
		fontWeight: e.fontWeight,
		fontStyle: e.fontStyle,
		color: e.color
	}));
}
function Fh(e) {
	let t;
	if (e.raisePt !== void 0) t = e.baseOrigin.yPt - e.raisePt;
	else if (e.baseInkTopPt !== void 0 && e.guideInkBottomFromBaselinePt !== void 0) t = e.baseInkTopPt - e.guideInkBottomFromBaselinePt;
	else throw Error("Ruby geometry requires authored w:hpsRaise or retained base/guide ink bounds");
	let n = e.baseOrigin.xPt + (e.baseAdvancePt - e.guideAdvancePt) / 2;
	return e.spans.map((e) => ({
		text: e.text,
		origin: {
			xPt: n + e.offsetPt,
			yPt: t
		},
		fontRoute: e.fontRoute,
		fontSizePt: e.fontSizePt,
		fontWeight: e.fontWeight,
		fontStyle: e.fontStyle,
		color: e.color
	}));
}
function Ih(e) {
	return -(e.inkBounds?.ascentPt ?? e.ascentPt);
}
function Lh(e) {
	return e.inkBounds?.descentPt ?? e.descentPt;
}
function Rh(e) {
	let t = e.inkBounds ? e.inkBounds.ascentPt + e.inkBounds.descentPt : Math.min(e.ascentPt, e.descentPt);
	if (!Number.isFinite(t) || t <= 0) throw Error("Retained decoration probe requires positive selected-face ink");
	return t;
}
function zh(e) {
	return e === "double" || e === "dbl" ? "double" : e?.includes("dot") ? "dotted" : e?.includes("dash") ? "dashed" : e?.includes("wave") ? "wavy" : "solid";
}
function Bh(e, t, n) {
	let r = Math.max(0, t.xPt - e.xPt), i = n * 2, a = Math.max(1, Math.ceil(r / i));
	return Array.from({ length: a + 1 }, (t, i) => ({
		xPt: e.xPt + r * i / a,
		yPt: e.yPt + (i % 2 == 0 ? -n / 2 : n / 2)
	}));
}
function Vh(e) {
	let t = [], n = e.origin.xPt + e.advancePt;
	if (e.underline) {
		let r = Rh(e.underline.probe), i = e.origin.yPt + (Ih(e.underline.probe) + Lh(e.underline.probe)) / 2, a = e.origin.yPt + Lh(e.base) + r / 2, o = Math.max(i, a), s = zh(e.underline.authoredStyle), c = {
			kind: "underline",
			...e.underline.authoredStyle === void 0 ? {} : { authoredStyle: e.underline.authoredStyle },
			color: e.underline.color,
			widthPt: r
		};
		if (s === "double") {
			let i = o + r * 2;
			t.push({
				...c,
				style: "solid",
				from: {
					xPt: e.origin.xPt,
					yPt: o
				},
				to: {
					xPt: n,
					yPt: o
				}
			}, {
				...c,
				style: "solid",
				from: {
					xPt: e.origin.xPt,
					yPt: i
				},
				to: {
					xPt: n,
					yPt: i
				}
			});
		} else {
			let i = {
				xPt: e.origin.xPt,
				yPt: o
			}, a = {
				xPt: n,
				yPt: o
			};
			t.push({
				...c,
				style: s,
				from: i,
				to: a,
				...s === "wavy" ? { path: Bh(i, a, r) } : {},
				...s === "dotted" ? { dashPatternPt: [r, r * 2] } : {},
				...s === "dashed" ? { dashPatternPt: [r * 4, r * 3] } : {}
			});
		}
	}
	if (e.strike) {
		let r = Rh(e.strike.probe), i = e.strike.color ?? e.color;
		if (e.strike.double && e.strike.doubleProbe) {
			let a = e.origin.yPt + Ih(e.strike.doubleProbe) + r / 2, o = e.origin.yPt + Lh(e.strike.doubleProbe) - r / 2;
			for (let s of [a, o]) t.push({
				kind: "strikethrough",
				color: i,
				widthPt: r,
				style: "solid",
				from: {
					xPt: e.origin.xPt,
					yPt: s
				},
				to: {
					xPt: n,
					yPt: s
				}
			});
		} else {
			let a = e.origin.yPt + (Ih(e.strike.probe) + Lh(e.strike.probe)) / 2;
			t.push({
				kind: "strikethrough",
				color: i,
				widthPt: r,
				style: "solid",
				from: {
					xPt: e.origin.xPt,
					yPt: a
				},
				to: {
					xPt: n,
					yPt: a
				}
			});
		}
	}
	return t;
}
function Hh(e) {
	let t = e.mark.inkBounds.xMaxPt - e.mark.inkBounds.xMinPt, n = e.mark.inkBounds.ascentPt + e.mark.inkBounds.descentPt;
	if (!(t > 0) || !(n > 0)) throw Error("Retained emphasis glyph requires positive selected-face ink bounds");
	let r = [];
	for (let t of e.clusterInk) {
		if (/^\s+$/u.test(t.text)) continue;
		let n = e.clusters.find((e) => e.range.start === t.range.start && e.range.end === t.range.end);
		if (!n) throw Error("Retained emphasis cluster ink does not match shaped cluster geometry");
		let i = (e.origin.xPt + n.offset.xPt + t.ink.xMinPt * e.scaleX + (e.origin.xPt + n.offset.xPt + t.ink.xMaxPt * e.scaleX)) / 2 - (e.mark.inkBounds.xMinPt + e.mark.inkBounds.xMaxPt) / 2, a = e.authored === "underDot" ? e.origin.yPt + t.ink.descentPt + e.mark.inkBounds.ascentPt : e.origin.yPt - t.ink.ascentPt - e.mark.inkBounds.descentPt;
		r.push({
			text: e.glyph,
			origin: {
				xPt: i,
				yPt: a
			},
			fontRoute: e.mark.fontRoute,
			fontSizePt: e.mark.fontSizePt,
			fontWeight: e.mark.fontWeight,
			fontStyle: e.mark.fontStyle,
			color: e.mark.color,
			inkBounds: e.mark.inkBounds
		});
	}
	return r;
}
function Uh(e, t) {
	return e.val === t.val && e.color === t.color && e.widthPt === t.widthPt && e.spacePt === t.spacePt && e.themeColor === t.themeColor && e.themeTint === t.themeTint && e.themeShade === t.themeShade && e.shadow === t.shadow && e.frame === t.frame;
}
function Wh(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = e[n], i = n + 1, a = r.bounds.xPt + r.bounds.widthPt + r.trailingSlackPt;
		for (; i < e.length;) {
			let t = e[i];
			if (!Uh(r.border, t.border) || Math.abs(t.bounds.xPt - a) > 1e-6 || t.bounds.yPt !== r.bounds.yPt || t.bounds.heightPt !== r.bounds.heightPt) break;
			a = t.bounds.xPt + t.bounds.widthPt + t.trailingSlackPt, i += 1;
		}
		let o = r.bounds.xPt - r.border.spacePt, s = r.bounds.yPt - r.border.spacePt, c = a + r.border.spacePt, l = r.bounds.yPt + r.bounds.heightPt + r.border.spacePt, u = {
			color: r.border.color,
			widthPt: r.border.widthPt,
			...ki(r.border.val, r.border.widthPt)
		};
		t.push({
			...u,
			edge: "top",
			from: {
				xPt: o,
				yPt: s
			},
			to: {
				xPt: c,
				yPt: s
			}
		}, {
			...u,
			edge: "right",
			from: {
				xPt: c,
				yPt: s
			},
			to: {
				xPt: c,
				yPt: l
			}
		}, {
			...u,
			edge: "bottom",
			from: {
				xPt: o,
				yPt: l
			},
			to: {
				xPt: c,
				yPt: l
			}
		}, {
			...u,
			edge: "left",
			from: {
				xPt: o,
				yPt: s
			},
			to: {
				xPt: o,
				yPt: l
			}
		}), n = i;
	}
	return t;
}
//#endregion
//#region packages/docx/src/layout/anchor-compatibility.ts
var Gh = U({
	id: "word-zero-relative-size",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/layout/anchor-frame.test.ts#uses wp:extent when Word does not support an exact-zero relative size"
	},
	description: "Word 2010 accepts only positive wp14:pctWidth and wp14:pctHeight values under [MS-ODRAWXML] notes 125/126. Preserve an authored zero as acquisition evidence while resolving the object from wp:extent."
});
U({
	id: "word-vertical-section-physical-drawing-layer",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/anchor-vertical-physical.test.ts#lands an upright-section anchor at the recorded physical centroid"
	},
	description: "Resolve anchored drawings in an upright vertical section against the physical page frame independently of the rotated text-flow coordinate space."
}), U({
	id: "word-page-level-float-prescan",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/page-anchor-prescan.test.ts#pre-scan REGISTERS a page-level (relativeFrom=\"margin\") wrap float on an earlier-scanned paragraph"
	},
	description: "A wrapping drawing whose vertical reference is page-level participates from page start so source-earlier paragraphs on that page see its exclusion."
}), U({
	id: "word-paragraph-anchor-pre-spacing-origin",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/anchor-paragraph-spacebefore.test.ts#anchors a wrapSquare paragraph float at the pre-spaceBefore paragraph top"
	},
	description: "Resolve a paragraph-relative anchored drawing from the paragraph top before applying the paragraph spaceBefore contribution."
}), U({
	id: "word-vertical-section-physical-header-footer",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/vertical-header-footer.test.ts#recovers the physical page box + margins from the logical (swapped) section"
	},
	description: "Paint a vertical section header and footer in the unrotated physical page frame rather than rotating them with the body text flow."
}), U({
	id: "word-frame-auto-wrap-around",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/frame-geometry.test.ts#wrap=\"around\" and \"auto\" → square float (auto ≡ around in Word)"
	},
	description: "Resolve an authored frame wrap value of auto through the same square side-wrap path as around."
}), U({
	id: "word-lower-layer-same-paragraph-anchor-composition",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "lower-layer-same-paragraph-anchor-composition",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "Word preserves a source-later, lower-z, page-owned drawing at its authored position when it belongs to the same anchor paragraph as already composed higher layers. This is a Word-observed compatibility override to ECMA-376 §20.4.2.3, not a normative OOXML rule."
}), U({
	id: "word-textbox-visible-anchor-extent",
	evidence: {
		kind: "office-observation",
		syntheticFixtureId: "textbox-visible-anchor-extent",
		application: "Microsoft Word",
		version: "16.111.1",
		platform: "macOS 26.5.2"
	},
	description: "For DrawingML middle and bottom text anchoring, derive the positioned extent through the last visible retained block while preserving structural trailing empty paragraphs and terminal paragraph spacing in the complete story."
}), U({
	id: "word-overlapping-layout-in-cell-overlay",
	evidence: {
		kind: "regression-test",
		reference: "packages/docx/src/table-cell-anchor-reflow.test.ts#does not grow an automatic row for an overlapping layoutInCell wrapNone object"
	},
	description: "Word leaves an overlap-permitted, non-wrapping layoutInCell drawing as an overlay instead of growing its automatic table row. This is an Office compatibility exception to the general resize behavior in ECMA-376 §20.4.2.3 layoutInCell; non-overlap drawings retain normative cell containment."
});
function Kh(e, t) {
	return !e || t !== "none";
}
function qh(e) {
	return e.shading || e.borders.length > 0 || e.resources.length > 0 || e.drawings.length > 0 || e.textBoxes.length > 0 || e.lineNumbers?.some((e) => e.paintOps.length > 0) ? !0 : e.lines.some((e) => e.placements.some((e) => e.kind === "text" || e.kind === "resource" || e.kind === "drawing" ? !0 : e.kind === "tab" && (e.leaderGlyphs?.length ?? 0) > 0));
}
function Jh(e) {
	let t = e.flowBounds.yPt, n;
	for (let r of e.blocks) {
		if (r.kind === "table") {
			n = Math.max(n ?? t, r.flowBounds.yPt + r.advancePt);
			continue;
		}
		r.kind !== "paragraph" || !qh(r) || (n = Math.max(n ?? t, r.flowBounds.yPt + Math.max(0, r.advancePt - r.spacing.afterPt)));
	}
	return n === void 0 ? 0 : Math.max(0, n - t);
}
function Yh(e) {
	return e === 0;
}
function Xh(e, t) {
	return e == null ? !t : e !== "paragraph" && e !== "line" && e !== "character";
}
function Zh(e, t, n) {
	return e === "page" && t !== null && n !== void 0 && t < n;
}
//#endregion
//#region packages/docx/src/layout/anchor-frame.ts
var Qh = 21600;
function Z(e, t, n) {
	return {
		code: e,
		path: t,
		message: n
	};
}
function $h(e) {
	return typeof e == "number" && Number.isFinite(e);
}
function eg(e) {
	return $h(e.xPt) && $h(e.yPt) && $h(e.widthPt) && $h(e.heightPt) && e.widthPt >= 0 && e.heightPt >= 0;
}
function tg(e) {
	return e.kind === "align" ? e.value : e.kind === "offset" ? e.valuePt : e.kind === "percent" ? e.fraction : null;
}
function Q(e, t, n, r = !1) {
	let i = t[e];
	return {
		axis: e,
		status: "unsupported",
		relativeFrom: r ? "page" : i.relativeFrom,
		choiceKind: r ? "simple-position" : i.choice.kind,
		choiceValue: r ? e === "horizontal" ? t.simplePosition.xPt : t.simplePosition.yPt : tg(i.choice),
		issueCode: n.code
	};
}
function ng(e, t, n, r) {
	let i = n[e];
	return i === null ? { problem: Z("missing-reference-frame", r, `${e} frame is required`) } : eg(i) ? { base: {
		startPt: t === "horizontal" ? i.xPt : i.yPt,
		endPt: t === "horizontal" ? i.xPt + i.widthPt : i.yPt + i.heightPt,
		referenceFrame: e
	} } : { problem: Z("invalid-reference-frame", r, `${e} frame must be finite and non-negative`) };
}
function rg(e, t, n, r) {
	let i = ng("page", t, n, r);
	if (!i.base) return i;
	let a = ng("margin", t, n, r);
	if (!a.base) return a;
	let o = n.page, s = n.margin, c = e === "leftMargin" || e === "rightMargin";
	if (c !== (t === "horizontal")) return { problem: Z("unsupported-relative-from", r, `${e} is not valid for the ${t} axis`) };
	let l = c ? o.xPt : o.yPt, u = c ? o.xPt + o.widthPt : o.yPt + o.heightPt, d = c ? s.xPt : s.yPt, f = c ? s.xPt + s.widthPt : s.yPt + s.heightPt;
	if (d < l || f > u) return { problem: Z("invalid-reference-frame", r, "margin frame must be contained by the page frame") };
	let p = e === "leftMargin" || e === "topMargin";
	return { base: {
		startPt: p ? l : f,
		endPt: p ? d : u,
		referenceFrame: e
	} };
}
function ig(e, t, n, r) {
	if (t === "page" || t === "margin" || e === "horizontal" && (t === "column" || t === "character") || e === "vertical" && (t === "paragraph" || t === "line")) return ng(t, e, n, r);
	if (e === "horizontal" && (t === "leftMargin" || t === "rightMargin") || e === "vertical" && (t === "topMargin" || t === "bottomMargin")) return rg(t, e, n, r);
	if (t === "insideMargin" || t === "outsideMargin") {
		if (n.pageParity === null) return { problem: Z("missing-page-parity", r, `${t} requires explicit page parity`) };
		let i = t === "insideMargin" == (n.pageParity === "odd");
		return {
			...rg(e === "horizontal" ? i ? "leftMargin" : "rightMargin" : i ? "topMargin" : "bottomMargin", e, n, r),
			parityRequired: !0
		};
	}
	return { problem: Z("unsupported-relative-from", r, `${t} is not a valid ${e} reference`) };
}
function ag(e, t, n) {
	let r = t.relativeSize[e], i = e === "horizontal" ? "width" : "height", a = (n = null) => {
		let r = e === "horizontal" ? t.extent.widthStatus : t.extent.heightStatus, a = e === "horizontal" ? t.extent.widthPt : t.extent.heightPt;
		return r === "missing" ? { problem: Z("missing-size", `extent.${i}`, `${i} is required`) } : r !== "valid" || !$h(a) || a <= 0 ? { problem: Z("invalid-size", `extent.${i}`, `${i} extent must be finite and positive`) } : { resolved: {
			valuePt: a,
			diagnostic: {
				source: "extent",
				valuePt: a,
				relativeFrom: n?.relativeFrom ?? null,
				referenceFrame: null,
				fraction: n?.fraction ?? null,
				...n === null ? {} : { compatibilityFallback: Gh.id }
			}
		} };
	};
	if (r === null) return a();
	let o = `relativeSize.${e}`;
	if (r.fractionStatus === "missing" || r.fraction === null) return { problem: Z("missing-relative-size-fraction", `${o}.fraction`, "relative size fraction is required") };
	if (r.fractionStatus !== "valid" || !$h(r.fraction)) return { problem: Z("invalid-relative-size-fraction", `${o}.fraction`, "relative size fraction must be finite") };
	if (r.fraction < 0) return { problem: Z("invalid-relative-size-fraction", `${o}.fraction`, "relative size fraction must be non-negative") };
	if (Yh(r.fraction)) return a({
		relativeFrom: r.relativeFrom,
		fraction: r.fraction
	});
	if (r.relativeFromStatus === "missing" || r.relativeFrom === null) return { problem: Z("missing-relative-size-reference", `${o}.relativeFrom`, "relative size reference is required") };
	if (r.relativeFromStatus !== "valid") return { problem: Z("invalid-relative-size-reference", `${o}.relativeFrom`, "relative size reference is invalid") };
	let s = ig(e, r.relativeFrom, n, `${o}.relativeFrom`);
	if (!s.base) return { problem: Z(s.problem?.code === "missing-reference-frame" ? "missing-relative-size-reference" : "invalid-relative-size-reference", `${o}.relativeFrom`, s.problem?.message ?? "relative size reference cannot be resolved") };
	let c = (s.base.endPt - s.base.startPt) * r.fraction;
	return !$h(c) || c < 0 ? { problem: Z("invalid-relative-size-fraction", `${o}.fraction`, "relative size result must be finite and non-negative") } : { resolved: {
		valuePt: c,
		diagnostic: {
			source: "relative",
			valuePt: c,
			relativeFrom: r.relativeFrom,
			referenceFrame: s.base.referenceFrame,
			fraction: r.fraction
		}
	} };
}
function og(e, t, n, r) {
	let i = n[e], a = e;
	if (i.relativeFromStatus === "missing" || i.relativeFrom === null) {
		let t = Z("missing-relative-from", `${a}.relativeFrom`, `${e} relativeFrom is required`);
		return {
			diagnostic: Q(e, n, t),
			problem: t
		};
	}
	if (i.relativeFromStatus !== "valid") {
		let t = Z("invalid-relative-from", `${a}.relativeFrom`, `${e} relativeFrom is invalid`);
		return {
			diagnostic: Q(e, n, t),
			problem: t
		};
	}
	let o = ig(e, i.relativeFrom, r, `${a}.relativeFrom`);
	if (!o.base) {
		let t = o.problem;
		return {
			diagnostic: Q(e, n, t),
			problem: t
		};
	}
	let s = i.choice;
	if (s.kind === "missing") {
		let t = Z("missing-axis-choice", `${a}.choice`, `${e} choice is required`);
		return {
			diagnostic: Q(e, n, t),
			problem: t
		};
	}
	if (s.kind === "invalid") {
		let t = Z("invalid-axis-choice", `${a}.choice`, `${e} choice is invalid`);
		return {
			diagnostic: Q(e, n, t),
			problem: t
		};
	}
	let c = o.base.endPt - o.base.startPt, l, u;
	if (s.kind === "offset") {
		if (!$h(s.valuePt)) {
			let t = Z("invalid-axis-value", `${a}.choice`, "offset must be finite");
			return {
				diagnostic: Q(e, n, t),
				problem: t
			};
		}
		l = o.base.startPt + s.valuePt, u = s.valuePt;
	} else if (s.kind === "percent") {
		if (!$h(s.fraction)) {
			let t = Z("invalid-axis-value", `${a}.choice`, "percentage must be finite");
			return {
				diagnostic: Q(e, n, t),
				problem: t
			};
		}
		l = o.base.startPt + c * s.fraction, u = s.fraction;
	} else if (s.kind === "align") {
		if (!(e === "horizontal" ? [
			"left",
			"center",
			"right",
			"inside",
			"outside"
		].includes(s.value) : [
			"top",
			"center",
			"bottom",
			"inside",
			"outside"
		].includes(s.value))) {
			let t = Z("invalid-axis-value", `${a}.choice`, `${s.value} is invalid`);
			return {
				diagnostic: Q(e, n, t),
				problem: t
			};
		}
		if ((s.value === "inside" || s.value === "outside") && r.pageParity === null) {
			let t = Z("missing-page-parity", "frames.pageParity", `${s.value} alignment requires explicit page parity`);
			return {
				diagnostic: Q(e, n, t),
				problem: t
			};
		}
		let i = e === "horizontal" ? "left" : "top", d = e === "horizontal" ? "right" : "bottom", f = s.value === "inside", p = r.pageParity === "odd", m = s.value === i || f && p || s.value === "outside" && !p, h = s.value === d || f && !p || s.value === "outside" && p;
		l = m ? o.base.startPt : h ? o.base.endPt - t : o.base.startPt + (c - t) / 2, u = s.value;
	} else {
		let t = Z("invalid-axis-choice", `${a}.choice`, `${e} choice is invalid`);
		return {
			diagnostic: Q(e, n, t),
			problem: t
		};
	}
	if (!$h(l)) {
		let t = Z("invalid-axis-value", `${a}.choice`, "resolved origin is not finite");
		return {
			diagnostic: Q(e, n, t),
			problem: t
		};
	}
	return {
		valuePt: l,
		diagnostic: {
			axis: e,
			status: "resolved",
			relativeFrom: i.relativeFrom,
			referenceFrame: o.base.referenceFrame,
			choiceKind: s.kind,
			choiceValue: u,
			baseStartPt: o.base.startPt,
			baseEndPt: o.base.endPt,
			resolvedOriginPt: l,
			pageParity: s.kind === "align" && (s.value === "inside" || s.value === "outside") ? r.pageParity : null
		}
	};
}
function sg(e, t, n) {
	let r = e === "horizontal" ? n.xPt : n.yPt, i = e === "horizontal" ? n.xPt + n.widthPt : n.yPt + n.heightPt, a = r + t;
	return {
		valuePt: a,
		diagnostic: {
			axis: e,
			status: "resolved",
			relativeFrom: "page",
			referenceFrame: "page",
			choiceKind: "simple-position",
			choiceValue: t,
			baseStartPt: r,
			baseEndPt: i,
			resolvedOriginPt: a,
			pageParity: null
		}
	};
}
var cg = [
	"top",
	"right",
	"bottom",
	"left"
];
function lg(e, t) {
	return e[`${t}Status`];
}
function ug(e, t) {
	return e[`${t}Pt`];
}
function dg(e, t, n) {
	let r = cg.some((t) => lg(e, t) !== "missing");
	if (!n && !r) return { values: {
		topPt: 0,
		rightPt: 0,
		bottomPt: 0,
		leftPt: 0
	} };
	let i = {
		topPt: 0,
		rightPt: 0,
		bottomPt: 0,
		leftPt: 0
	};
	for (let n of cg) {
		let r = lg(e, n), a = ug(e, n);
		if (r !== "valid" || !$h(a)) return { problem: Z("invalid-effect-extent", `${t}.${n}`, "present effectExtent requires four finite edge values") };
		i[`${n}Pt`] = a;
	}
	return { values: i };
}
function fg(e, t) {
	let n = {
		topPt: 0,
		rightPt: 0,
		bottomPt: 0,
		leftPt: 0
	}, r = {};
	for (let i of cg) {
		let a = lg(t, i), o = lg(e, i), s = a === "valid" || a === "invalid" ? {
			status: a,
			value: ug(t, i),
			source: "wrap"
		} : o === "valid" || o === "invalid" ? {
			status: o,
			value: ug(e, i),
			source: "anchor"
		} : {
			status: "missing",
			value: null,
			source: "implicit-zero"
		};
		if (s.status === "invalid" || s.status === "valid" && (!$h(s.value) || s.value < 0)) return { problem: Z("invalid-distance", `${s.source === "wrap" ? "wrap.distances" : "anchorDistances"}.${i}`, "wrap distance must be finite and non-negative") };
		n[`${i}Pt`] = s.status === "missing" ? 0 : s.value, r[i] = s.source;
	}
	return { resolved: {
		values: n,
		sources: r
	} };
}
function pg(e, t) {
	let n = {
		xPt: e.xPt - t.leftPt,
		yPt: e.yPt - t.topPt,
		widthPt: e.widthPt + t.leftPt + t.rightPt,
		heightPt: e.heightPt + t.topPt + t.bottomPt
	};
	return eg(n) ? n : null;
}
function mg(e, t) {
	let n = e.wrap.polygon;
	if (n === null || n.invalidPointCount !== 0 || n.coordinateSpace.width !== Qh || n.coordinateSpace.height !== Qh || n.points.length < 3) return { problem: Z("invalid-wrap-polygon", "wrap.polygon", "tight and through wrapping require a valid fixed 21600 by 21600 polygon") };
	let r = [];
	for (let [e, i] of n.points.entries()) {
		if (!$h(i.x) || !$h(i.y)) return { problem: Z("invalid-wrap-polygon", `wrap.polygon.points.${e}`, "polygon coordinates must be finite") };
		r.push({
			xPt: t.xPt + i.x / Qh * t.widthPt,
			yPt: t.yPt + i.y / Qh * t.heightPt
		});
	}
	let i = r.map((e) => e.xPt), a = r.map((e) => e.yPt), o = Math.min(...i), s = Math.max(...i), c = Math.min(...a), l = Math.max(...a);
	return {
		polygon: {
			edited: n.edited,
			points: r
		},
		bounds: {
			xPt: o,
			yPt: c,
			widthPt: s - o,
			heightPt: l - c
		}
	};
}
function hg(e) {
	return {
		coordinateSpace: "anchor-frame",
		groupApplication: "parser-resolved-child-frame",
		group: e === null ? null : {
			childSourceId: e.childSourceId,
			sourceIndex: e.sourceIndex,
			sourceCount: e.sourceCount,
			transformChain: e.transformChain.map((e) => ({ ...e })),
			childTransform: e.childTransform === null ? null : { ...e.childTransform },
			resolvedChildFrame: { ...e.resolvedChildFrame }
		}
	};
}
function gg(e) {
	return B(e, "anchor frame result");
}
function _g(e) {
	let { acquisition: t, frames: n } = e;
	for (let e of [
		"relativeHeight",
		"behindDoc",
		"locked",
		"layoutInCell",
		"allowOverlap"
	]) {
		let n = t.behavior[`${e}Status`], r = t.behavior[e];
		if (n === "valid" && r !== null) continue;
		let i = Z(n === "missing" ? "missing-required-behavior" : "invalid-required-behavior", `behavior.${e}`, `CT_Anchor requires a ${e} value`);
		return gg({
			status: "unsupported",
			occurrenceId: t.occurrenceId,
			axes: {
				horizontal: Q("horizontal", t, i),
				vertical: Q("vertical", t, i)
			},
			issues: [i]
		});
	}
	let r = [], i = ag("horizontal", t, n), a = ag("vertical", t, n);
	i.problem && r.push(i.problem), a.problem && r.push(a.problem);
	let o, s, c = i.problem ?? a.problem;
	if (c || !i.resolved || !a.resolved) {
		let e = c;
		o = { diagnostic: Q("horizontal", t, e) }, s = { diagnostic: Q("vertical", t, e) };
	} else if (t.simplePosition.status === "invalid") {
		let e = Z("invalid-simple-position", "simplePosition.enabled", "simplePos enablement is invalid");
		r.push(e), o = {
			diagnostic: Q("horizontal", t, e, !0),
			problem: e
		}, s = {
			diagnostic: Q("vertical", t, e, !0),
			problem: e
		};
	} else if (t.simplePosition.status === "valid" && t.simplePosition.enabled === !0) {
		let e = ng("page", "horizontal", n, "frames.page"), i = t.simplePosition.xPt, a = t.simplePosition.yPt;
		if (!e.base || n.page === null || !eg(n.page)) {
			let n = e.problem ?? Z("invalid-reference-frame", "frames.page", "simple positioning requires a valid page frame");
			r.push(n), o = {
				diagnostic: Q("horizontal", t, n, !0),
				problem: n
			}, s = {
				diagnostic: Q("vertical", t, n, !0),
				problem: n
			};
		} else if (t.simplePosition.xStatus !== "valid" || !$h(i)) {
			let e = t.simplePosition.xStatus === "invalid", n = Z(e ? "invalid-simple-position" : "missing-simple-coordinate", "simplePosition.x", e ? "simple position x is lexically invalid" : "simple position x is required");
			r.push(n), o = {
				diagnostic: Q("horizontal", t, n, !0),
				problem: n
			}, s = {
				diagnostic: Q("vertical", t, n, !0),
				problem: n
			};
		} else if (t.simplePosition.yStatus !== "valid" || !$h(a)) {
			let e = t.simplePosition.yStatus === "invalid", n = Z(e ? "invalid-simple-position" : "missing-simple-coordinate", "simplePosition.y", e ? "simple position y is lexically invalid" : "simple position y is required");
			r.push(n), o = {
				diagnostic: Q("horizontal", t, n, !0),
				problem: n
			}, s = {
				diagnostic: Q("vertical", t, n, !0),
				problem: n
			};
		} else o = sg("horizontal", i, n.page), s = sg("vertical", a, n.page);
	} else {
		let e = og("horizontal", i.resolved.valuePt, t, n), c = og("vertical", a.resolved.valuePt, t, n);
		o = {
			...e,
			diagnostic: e.diagnostic
		}, s = {
			...c,
			diagnostic: c.diagnostic
		}, e.problem && r.push(e.problem), c.problem && r.push(c.problem);
	}
	if (r.length > 0 || !i.resolved || !a.resolved || o.valuePt === void 0 || s.valuePt === void 0) return gg({
		status: "unsupported",
		occurrenceId: t.occurrenceId,
		axes: {
			horizontal: o.diagnostic,
			vertical: s.diagnostic
		},
		issues: r
	});
	let l = {
		xPt: o.valuePt,
		yPt: s.valuePt,
		widthPt: i.resolved.valuePt,
		heightPt: a.resolved.valuePt
	}, u = dg(t.parentEffectExtent, "parentEffectExtent", !1);
	if (u.problem || !u.values) {
		let e = u.problem;
		return gg({
			status: "unsupported",
			occurrenceId: t.occurrenceId,
			axes: {
				horizontal: o.diagnostic,
				vertical: s.diagnostic
			},
			issues: [e]
		});
	}
	let d = pg(l, u.values);
	if (d === null) {
		let e = Z("invalid-effect-extent", "parentEffectExtent", "parent effect extents produce invalid ink bounds");
		return gg({
			status: "unsupported",
			occurrenceId: t.occurrenceId,
			axes: {
				horizontal: o.diagnostic,
				vertical: s.diagnostic
			},
			issues: [e]
		});
	}
	if (t.wrap.kind === "missing" || t.wrap.kind === "invalid") {
		let e = Z(t.wrap.kind === "missing" ? "missing-wrap-kind" : "invalid-wrap-kind", "wrap.kind", "exactly one valid wrap kind is required");
		return gg({
			status: "unsupported",
			occurrenceId: t.occurrenceId,
			axes: {
				horizontal: o.diagnostic,
				vertical: s.diagnostic
			},
			issues: [e]
		});
	}
	let f = fg(t.anchorDistances, t.wrap.distances);
	if (f.problem || !f.resolved) return gg({
		status: "unsupported",
		occurrenceId: t.occurrenceId,
		axes: {
			horizontal: o.diagnostic,
			vertical: s.diagnostic
		},
		issues: [f.problem]
	});
	let p = t.wrap.kind === "square" || t.wrap.kind === "tight" || t.wrap.kind === "through", m = p && [
		"bothSides",
		"left",
		"right",
		"largest"
	].includes(t.wrap.side ?? "") ? t.wrap.side : null;
	if (p && m === null) {
		let e = Z("invalid-wrap-side", "wrap.side", "square, tight, and through wrapping require an authored wrap side");
		return gg({
			status: "unsupported",
			occurrenceId: t.occurrenceId,
			axes: {
				horizontal: o.diagnostic,
				vertical: s.diagnostic
			},
			issues: [e]
		});
	}
	let h = u.values, g = cg.some((e) => lg(t.parentEffectExtent, e) !== "missing") ? "parent" : "none";
	if (t.wrap.effectExtent !== null) {
		let e = dg(t.wrap.effectExtent, "wrap.effectExtent", !0);
		if (e.problem || !e.values) return gg({
			status: "unsupported",
			occurrenceId: t.occurrenceId,
			axes: {
				horizontal: o.diagnostic,
				vertical: s.diagnostic
			},
			issues: [e.problem]
		});
		h = e.values, g = "wrap-child";
	}
	let _ = null, v = null, y = null;
	if (t.wrap.kind === "tight" || t.wrap.kind === "through") {
		let e = mg(t, l);
		if (e.problem || !e.polygon || !e.bounds) return gg({
			status: "unsupported",
			occurrenceId: t.occurrenceId,
			axes: {
				horizontal: o.diagnostic,
				vertical: s.diagnostic
			},
			issues: [e.problem]
		});
		_ = e.polygon, v = {
			width: 21600,
			height: 21600
		}, y = e.bounds, h = {
			topPt: 0,
			rightPt: 0,
			bottomPt: 0,
			leftPt: 0
		}, g = "none";
	} else if (t.wrap.kind !== "none" && (y = pg(l, h), y === null)) {
		let e = Z("invalid-effect-extent", "wrap.effectExtent", "wrapping effect extents produce invalid bounds");
		return gg({
			status: "unsupported",
			occurrenceId: t.occurrenceId,
			axes: {
				horizontal: o.diagnostic,
				vertical: s.diagnostic
			},
			issues: [e]
		});
	}
	let b = y === null ? null : pg(y, f.resolved.values);
	if (y !== null && b === null) {
		let e = Z("invalid-distance", "wrap.distances", "distances produce invalid bounds");
		return gg({
			status: "unsupported",
			occurrenceId: t.occurrenceId,
			axes: {
				horizontal: o.diagnostic,
				vertical: s.diagnostic
			},
			issues: [e]
		});
	}
	return gg({
		status: "resolved",
		occurrenceId: t.occurrenceId,
		axes: {
			horizontal: o.diagnostic,
			vertical: s.diagnostic
		},
		issues: [],
		geometry: {
			objectFrame: l,
			inkBounds: d,
			wrapBounds: b,
			size: {
				horizontal: i.resolved.diagnostic,
				vertical: a.resolved.diagnostic
			},
			parentEffectExtent: u.values,
			wrap: {
				kind: t.wrap.kind,
				side: m,
				distances: f.resolved.values,
				distanceSources: f.resolved.sources,
				effectExtent: h,
				effectExtentSource: g,
				coordinateSpace: v,
				polygon: _
			},
			transform: hg(t.group)
		}
	});
}
//#endregion
//#region packages/docx/src/layout/paragraph-spacing.ts
function vg(e, t, n, r) {
	if (!e) return r;
	let i = !!(e.styleId && e.styleId === t.styleId), a = !!(i && e.contextualSpacing), o = !!(i && t.contextualSpacing);
	return a && o ? 0 : o ? n : a ? Math.max(r - n, 0) : Math.max(n, r);
}
function yg(e, t, n, r) {
	let i = vg(e, t, n, r), a = i <= n;
	return {
		suppressBefore: a,
		overlap: n + (a ? 0 : r) - i
	};
}
//#endregion
//#region packages/docx/src/layout/pagination-fields.ts
function bg(e) {
	return Object.freeze(e.pages.map((e) => Object.freeze({
		pageIndex: e.pageIndex,
		displayPageNumber: e.pageNumber.displayNumber,
		pageNumberFormat: e.pageNumber.format
	})));
}
function xg(e) {
	if (e.fieldType === "page") return "page";
	if (/numPages/i.test(e.fieldType) || /NUMPAGES/i.test(e.instruction)) return "total-pages";
}
function Sg(e) {
	return e.some((e) => e.type === "paragraph" ? e.runs.some((e) => e.type === "field" ? xg(e) !== void 0 : !1) : e.type === "table" ? e.rows.some((e) => e.cells.some((e) => Sg(e.content))) : !1);
}
function Cg(e, t = [], n = []) {
	return Sg(e) || t.some((e) => Sg(e.content)) || n.some((e) => Sg(e));
}
//#endregion
//#region packages/docx/src/layout/paragraph-wrap-registry.ts
var wg = /* @__PURE__ */ new WeakMap(), Tg = "table-final-frame:";
function Eg(e) {
	let t = new Set(e.drawings.flatMap((e) => {
		let t = e.anchorLayer?.acquisitionOccurrenceId ?? e.anchorLayer?.occurrenceId;
		return t === void 0 ? [] : [t];
	}));
	return Object.freeze({
		exclusions: Object.freeze(e.exclusions.filter((e) => !e.id.startsWith("table-final-frame:") && (e.anchorOccurrenceId === void 0 || !t.has(e.anchorOccurrenceId)))),
		collisions: Object.freeze((e.anchorCollisions ?? []).filter((e) => !t.has(e.occurrenceId)))
	});
}
function Dg(e) {
	return new Set((e.anchorFrames ?? []).flatMap((e) => e.status === "resolved" ? [e.occurrenceId] : []));
}
function Og(e) {
	let t = Dg(e), n = (e.anchorCollisions ?? []).filter((e) => t.has(e.occurrenceId)), r = new Set(n.map((e) => e.occurrenceId));
	for (let e of t) if (!r.has(e)) throw Error(`Paragraph anchor omitted collision geometry: ${e}`);
	return Object.freeze(n);
}
function kg(e) {
	let t = Dg(e);
	return Object.freeze(e.exclusions.filter((e) => e.anchorOccurrenceId !== void 0 && t.has(e.anchorOccurrenceId)));
}
function Ag(e) {
	return Object.freeze({
		flowDomainId: e,
		collisions: Object.freeze([]),
		exclusions: Object.freeze([])
	});
}
function jg(e, t) {
	let n = wg.get(e);
	n || (n = /* @__PURE__ */ new Map(), wg.set(e, n));
	let r = n.get(t);
	if (r) return r;
	let i = Ag(t);
	return n.set(t, i), i;
}
function Mg(e, t, n) {
	let r = wg.get(e);
	if (!r || r.get(t.flowDomainId) !== t) throw Error("Paragraph wrap registry transaction is stale");
	r.set(t.flowDomainId, Ng(t, n));
}
function Ng(e, t) {
	if (t.flowDomainId !== e.flowDomainId) throw Error("Paragraph wrap registry cannot cross flow domains");
	let n = new Set(e.collisions.map((e) => e.occurrenceId)), r = Og(t);
	for (let e of r) {
		if (n.has(e.occurrenceId)) throw Error(`Paragraph wrap occurrence committed twice: ${e.occurrenceId}`);
		n.add(e.occurrenceId);
	}
	let i = kg(t), a = new Set(r.map((e) => e.occurrenceId)), o = /* @__PURE__ */ new Set();
	for (let e of i) {
		let t = e.anchorOccurrenceId;
		if (t === void 0 || !a.has(t)) throw Error("Owned paragraph wrap exclusion omitted its collision occurrence");
		if (o.has(t)) throw Error(`Paragraph wrap occurrence produced duplicate exclusions: ${t}`);
		o.add(t);
	}
	return Object.freeze({
		flowDomainId: e.flowDomainId,
		collisions: Object.freeze([...e.collisions, ...r]),
		exclusions: Object.freeze([...e.exclusions, ...i])
	});
}
//#endregion
//#region packages/docx/src/layout/paragraph.ts
function Pg(e, t) {
	if (!Number.isFinite(e) || e < 0) throw RangeError(`${t} must be finite and non-negative`);
	return e;
}
function Fg(e) {
	if (!(!e || e.type !== "text" && e.type !== "field")) return e.typographyInput;
}
function Ig(e) {
	switch (e) {
		case "left": return "left";
		case "right": return "right";
		default: return "center";
	}
}
function Lg(e) {
	return Pg(e.measuredWidthPt, "segment.measuredWidthPt");
}
function Rg(e) {
	return e.map((e) => e.kind === "text" && !e.fixedPitch ? { text: e.text } : {});
}
function zg(e) {
	return e === "lowKashida" ? "low" : e === "mediumKashida" ? "medium" : e === "highKashida" ? "high" : null;
}
function Bg(e, t) {
	if (!e.textLayoutService || !e.textShapeRequest) throw Error("Kashida acquisition requires the retained TextLayoutService authority");
	let n = e.textLayoutService.shape({
		...e.textShapeRequest,
		text: t,
		measure: !0
	}), r = e.basePaintOps[0]?.scaleX ?? 1, i = e.basePaintOps[0]?.letterSpacingPt ?? 0;
	return n.advancePt * r + [...t].length * i;
}
function Vg(e, t) {
	if (!e) return null;
	let n = Xm(e), r = /* @__PURE__ */ new Map(), i = 0;
	for (let [n, a] of e.perSeg) {
		let e = t[n], o = a.splitBefore;
		if (e?.kind === "text") {
			let t = new Set(e.clusters.slice(1).map((t) => t.range.start - e.range.start)), n = [...e.text], r = [0];
			for (let e of n) r.push((r.at(-1) ?? 0) + e.length);
			o = o.filter((e) => t.has(r[e] ?? -1));
		}
		let s = t[n + 1], c = a.trailingGap && !(s?.kind === "text" && s.breakBefore === !1);
		i += o.length + +!!c, r.set(n, {
			splitBefore: [...o],
			trailingGap: c,
			internalStretch: 0
		});
	}
	if (i === 0) return null;
	let a = n / i;
	for (let e of r.values()) e.internalStretch = e.splitBefore.length * a;
	return {
		perGap: a,
		perSeg: r
	};
}
function Hg(e, t, n) {
	if (!t || t.splitBefore.length === 0) return {
		clusters: e.clusters,
		paintOps: e.basePaintOps
	};
	let r = [...e.text], i = [...t.splitBefore];
	if (i.some((e, t) => e <= 0 || e >= r.length || t > 0 && e <= (i[t - 1] ?? 0))) throw Error("Internal paragraph justification contains an invalid code-point cut");
	let a = [0];
	for (let e of r) a.push((a.at(-1) ?? 0) + e.length);
	let o = i.map((e) => a[e] ?? -1), s = new Set(e.clusters.map((t) => t.range.start - e.range.start));
	if (o.some((e) => !s.has(e))) throw Error("Internal paragraph justification must split at shaped cluster boundaries");
	let c = [
		0,
		...i,
		r.length
	], l = [];
	for (let t = 0; t < c.length - 1; t += 1) {
		let r = c[t] ?? 0, i = c[t + 1] ?? r, o = e.range.start + (a[r] ?? 0), s = e.clusters.find((e) => e.range.start === o);
		if (!s) throw Error("Internal paragraph justification is missing shaped cluster geometry");
		l.push({
			range: {
				start: o,
				end: e.range.start + (a[i] ?? 0)
			},
			offset: {
				xPt: s.offset.xPt + t * n,
				yPt: s.offset.yPt
			}
		});
	}
	let u = e.clusters.map((t) => {
		let r = t.range.start - e.range.start, i = o.filter((e) => e <= r).length;
		return {
			...t,
			offset: {
				...t.offset,
				xPt: t.offset.xPt + i * n
			}
		};
	});
	if (e.basePaintOps.length > 1) {
		let t = e.range.start;
		for (let n of e.basePaintOps) {
			if (n.range.start !== t || n.range.end <= n.range.start) throw Error("Internal paragraph justification has incomplete retained paint operations");
			t = n.range.end;
		}
		if (t !== e.range.end) throw Error("Internal paragraph justification has incomplete retained paint operations");
		let r = o.map((t) => e.range.start + t), i = [...new Set([
			e.range.start,
			e.range.end,
			...r,
			...e.basePaintOps.flatMap((e) => [e.range.start, e.range.end])
		])].sort((e, t) => e - t), a = [];
		for (let t = 0; t < i.length - 1; t += 1) {
			let o = i[t] ?? e.range.start, s = i[t + 1] ?? o, c = e.basePaintOps.find((e) => e.range.start <= o && e.range.end >= s);
			if (!c) throw Error("Internal paragraph justification lost a retained paint slice");
			let l = r.filter((e) => e <= o).length, d = u.find((e) => e.range.start === o);
			if (!d) throw Error("Internal paragraph justification is missing retained slice geometry");
			a.push({
				...c,
				text: c.text.slice(o - c.range.start, s - c.range.start),
				range: {
					start: o,
					end: s
				},
				offset: o === c.range.start ? {
					...c.offset,
					xPt: c.offset.xPt + l * n
				} : d.offset
			});
		}
		return {
			clusters: u,
			paintOps: a
		};
	}
	let d = e.basePaintOps.length === 1 ? e.basePaintOps[0] : void 0;
	if (!d) throw Error("Internal paragraph justification requires one contextual paint op");
	return i.length === r.length - 1 && i.every((e, t) => e === t + 1) ? {
		clusters: u,
		paintOps: [{
			...d,
			letterSpacingPt: d.letterSpacingPt + n
		}]
	} : {
		clusters: u,
		paintOps: l.map((t) => ({
			...d,
			text: e.text.slice(t.range.start - e.range.start, t.range.end - e.range.start),
			range: t.range,
			offset: t.offset
		}))
	};
}
function Ug(e, t) {
	return e.flatMap((e) => {
		let n = e.text.trimEnd();
		if (n === "" || n.length === e.text.length) return [e];
		if (e.sourceMapping === "kashida") return [{
			...e,
			text: n
		}];
		let r = e.range.start + n.length, i = t.find((e) => e.range.start === r), { inkBounds: a, blockAxisInkBounds: o, ...s } = e;
		return [{
			...e,
			text: n,
			range: {
				...e.range,
				end: r
			}
		}, {
			...s,
			text: e.text.slice(n.length),
			range: {
				start: r,
				end: e.range.end
			},
			offset: i?.offset ?? e.offset
		}];
	});
}
function Wg(e, t) {
	return e === void 0 || t === void 0 ? e === t : e.length === t.length && e.every((e, n) => e === t[n]);
}
function Gg(e, t) {
	return e.kind === "underline" && e.kind === t.kind && e.authoredStyle === t.authoredStyle && e.style === t.style && e.color === t.color && e.widthPt === t.widthPt && e.to.xPt === t.from.xPt && Wg(e.dashPatternPt, t.dashPatternPt);
}
function Kg(e, t) {
	let n = Math.max(e.from.yPt, t.from.yPt), r = {
		xPt: e.from.xPt,
		yPt: n
	}, i = {
		xPt: t.to.xPt,
		yPt: n
	}, { path: a, ...o } = e;
	return {
		...o,
		from: r,
		to: i,
		...e.style === "wavy" ? { path: Bh(r, i, e.widthPt) } : {}
	};
}
function qg(e, t) {
	let n = Math.min(t, Math.max(0, e.to.xPt - e.from.xPt)), r = e.from, i = {
		...e.to,
		xPt: e.to.xPt - n
	}, { path: a, ...o } = e;
	return {
		...o,
		from: r,
		to: i,
		...e.style === "wavy" ? { path: Bh(r, i, e.widthPt) } : {}
	};
}
function Jg(e) {
	let t = [];
	e.forEach((n, r) => {
		if (n.kind !== "text" && n.kind !== "tab" || !n.decorations) {
			t = [];
			return;
		}
		let i = [], a = [], o = /* @__PURE__ */ new Set();
		for (let s of n.decorations) {
			let n = t.filter((e) => !o.has(e) && Gg(e.decoration, s)).sort((e, t) => Math.abs(e.decoration.from.yPt - s.from.yPt) - Math.abs(t.decoration.from.yPt - s.from.yPt))[0];
			if (n) {
				o.add(n);
				let t = e[n.placementIndex];
				if (!t || t.kind !== "text" && t.kind !== "tab" || !t.decorations) throw Error("Continuous decoration owner left the retained line");
				let r = [...t.decorations], i = Kg(n.decoration, s);
				r[n.decorationIndex] = i, e[n.placementIndex] = {
					...t,
					decorations: r
				}, a.push({
					...n,
					decoration: i
				});
			} else {
				let e = i.length;
				i.push(s), a.push({
					placementIndex: r,
					decorationIndex: e,
					decoration: s
				});
			}
		}
		e[r] = {
			...n,
			decorations: i
		}, t = a;
	});
}
function Yg(e) {
	let { line: t } = e, n = t.segments, r = e.baseRtl || Zc(n), i = Qc(n.map((e) => e.kind === "tab" ? { isTab: !0 } : e.kind === "text" ? {
		text: e.text,
		rtl: e.rtl,
		digitsAsAN: e.digitsAsAN
	} : {}), e.baseRtl), a = n.reduce((e, t) => e + Lg(t), 0), o = e.paragraphXPt + t.xOffsetPt, s = Math.min(e.availableWidthPt, t.availableWidthPt), c = e.isFirstLine ? e.numbering ? Pg(e.numbering.bodyOffsetPt, "numbering.bodyOffsetPt") : e.firstLineIndentPt ?? 0 : 0, l = e.baseRtl ? 0 : c, u = (e.baseRtl ? s - c : s) - l - a, d = e.isLastLine || t.endsWithBreak, f = e.displayMathJustification === void 0 ? $c(e.alignment, e.baseRtl) : Ig(e.displayMathJustification), p = f === "justify" && (!d || e.stretchLastLine), m = p ? zg(e.alignment) : null;
	if (m && u > 0) {
		let e = Th(n.map((e) => e.kind === "text" ? { text: e.text } : {}), u, m, (e, t) => {
			let r = n[e];
			return r?.kind === "text" ? Bg(r, t) : 0;
		});
		e && (n = n.map((t, n) => {
			if (t.kind !== "text") return t;
			let r = e.perSeg.get(n);
			if (!r) return t;
			let i = t.basePaintOps[0];
			if (!i) throw Error("Kashida acquisition requires a contextual text paint operation");
			return {
				...t,
				measuredWidthPt: t.measuredWidthPt + r.advanceDeltaPx,
				basePaintOps: [{
					...i,
					text: r.text,
					sourceMapping: "kashida"
				}]
			};
		}), a += e.appliedPx, u = e.residualPx);
	}
	let h = i.order.at(-1) ?? -1, g = 0;
	if (!r) {
		let e = n.findIndex((e) => e.kind !== "text" || /\S/.test(e.text));
		g = e < 0 ? 0 : e;
	}
	let _ = null, v = 0, y = 0, b = Rg(n);
	if (p) {
		let i = Vg(Ym(b, u, g, r ? h : n.length, -(t.baselinePt - t.topPt) * .25, u > 0, e.alignment === "thaiDistribute" && u > 0), n);
		_ = i?.perSeg ?? null, v = i?.perGap ?? 0, y = Xm(i);
	} else if (u < 0) {
		let e = Vg(Zm(b, u, g, r ? h : n.length, t.baselinePt - t.topPt), n);
		_ = e?.perSeg ?? null, v = e?.perGap ?? 0, y = Xm(e);
	}
	let x = a + y, S = u - y, C = f === "right" ? S : f === "center" ? S / 2 : f === "justify" && e.baseRtl && !p ? S : 0, w = o + l, T = e.decimalAutoTabPt === void 0 ? C : Math.max(0, e.paragraphXPt + e.decimalAutoTabPt - x - w), E = w + T, D = [], O = /* @__PURE__ */ new Map();
	for (let e of i.order) {
		let r = n[e];
		if (!r) continue;
		let a = _?.get(e), o = a?.internalStretch ?? 0, s = Lg(r) + o;
		if (r.kind === "tab") {
			let e = {
				xPt: E,
				yPt: t.topPt,
				widthPt: r.measuredWidthPt,
				heightPt: t.advancePt
			}, n = r.underline ? Vh({
				origin: {
					xPt: E,
					yPt: t.baselinePt
				},
				advancePt: r.measuredWidthPt,
				base: r.underline.base,
				color: r.underline.color,
				underline: r.underline
			}) : void 0;
			D.push({
				kind: "tab",
				range: r.range,
				bounds: e,
				advancePt: r.measuredWidthPt,
				leader: r.leader,
				...n?.length ? { decorations: n } : {},
				...r.leader === "none" ? {} : r.leaderShape ? { leaderGlyphs: Ph({
					interval: e,
					baselinePt: t.baselinePt,
					...r.leaderShape
				}) } : {}
			});
		} else if (r.kind === "resource") D.push({
			kind: "resource",
			range: r.range,
			...r.sourceRunIndex === void 0 ? {} : { sourceRunIndex: r.sourceRunIndex },
			resourceKey: r.resourceKey,
			resourceKind: r.resourceKind,
			...r.orientation ? { orientation: r.orientation } : {},
			bounds: {
				xPt: E,
				yPt: t.baselinePt + r.topOffsetPt,
				widthPt: r.widthPt,
				heightPt: r.heightPt
			},
			advancePt: r.measuredWidthPt
		});
		else if (r.kind === "unavailable-resource" || r.kind === "inline-drawing") D.push({
			kind: "drawing",
			range: r.range,
			drawingId: r.drawingId,
			bounds: {
				xPt: E,
				yPt: t.baselinePt + r.topOffsetPt,
				widthPt: r.widthPt,
				heightPt: r.heightPt
			},
			advancePt: r.measuredWidthPt
		});
		else if (r.kind === "anchor-host") D.push({
			kind: "anchor-host",
			range: r.range,
			bounds: {
				xPt: E,
				yPt: t.topPt,
				widthPt: 0,
				heightPt: t.advancePt
			},
			baselinePt: t.baselinePt,
			...r.sourceMetrics ? { sourceMetrics: r.sourceMetrics } : {},
			...r.anchorOccurrenceId ? { anchorOccurrenceId: r.anchorOccurrenceId } : {}
		});
		else {
			let { measuredWidthPt: n, breakBefore: o, rtl: c, digitsAsAN: l, fixedPitch: u, decorationTerminalAdvancePt: d, textLayoutService: f, textShapeRequest: p, selectedFaceFontBox: m, retainedGeometry: h, direction: g, ..._ } = r, y = Hg(r, a, v), b = i.rtl[e] ? "rtl" : "ltr", x = b === "rtl" ? Ug(y.paintOps, y.clusters) : y.paintOps, S = r.text.trimEnd().length, C = b === "rtl" ? (_.fitText?.trailingPadPt ?? 0) + r.clusters.filter((e) => e.range.start >= r.range.start + S).reduce((e, t) => e + t.advancePt, 0) : 0, w = a?.trailingGap ? v : 0, T = {
				xPt: E + C,
				yPt: t.baselinePt
			}, k = y.paintOps[0]?.offset.yPt ?? 0, A = {
				xPt: E,
				yPt: t.baselinePt + k
			}, j = h ? Vh({
				origin: A,
				advancePt: s + w,
				base: h.base,
				color: v_(_.color),
				...h.underline ? { underline: h.underline } : {},
				...h.strike ? { strike: h.strike } : {}
			}) : _.decorations, M = h?.emphasis ? {
				authored: h.emphasis.authored,
				glyphs: Hh({
					authored: h.emphasis.authored,
					glyph: h.emphasis.glyph,
					origin: {
						xPt: T.xPt,
						yPt: t.baselinePt + k
					},
					clusters: y.clusters,
					clusterInk: h.emphasis.clusterInk,
					mark: h.emphasis.mark,
					scaleX: r.basePaintOps[0]?.scaleX ?? 1
				})
			} : void 0, N = m ?? h?.base, ee = N ? {
				xPt: E,
				yPt: t.baselinePt + k - N.ascentPt,
				widthPt: s + w,
				heightPt: N.ascentPt + N.descentPt
			} : {
				xPt: E,
				yPt: t.topPt,
				widthPt: s + w,
				heightPt: t.advancePt
			}, te = {
				..._,
				kind: "text",
				origin: T,
				bounds: {
					xPt: E,
					yPt: t.topPt,
					widthPt: s,
					heightPt: t.advancePt
				},
				highlightBounds: ee,
				advancePt: s,
				clusters: y.clusters,
				paintOps: x.map((e) => ({
					...e,
					direction: b
				})),
				decorations: j,
				...M ? { emphasis: M } : {},
				direction: b,
				...w === 0 ? {} : { ownedTrailingSlackPt: w },
				..._.highlight || _.background ? { highlightFragments: [{
					rect: _.highlight ? ee : {
						xPt: E,
						yPt: t.topPt,
						widthPt: s + w,
						heightPt: t.advancePt
					},
					color: _.highlight ?? _.background
				}] } : {},
				..._.ruby ? { ruby: {
					..._.ruby,
					paintOps: _.ruby.paintOps.map((e) => ({
						...e,
						origin: {
							xPt: e.origin.xPt + E + (s - r.measuredWidthPt) / 2,
							yPt: e.origin.yPt + t.baselinePt
						}
					}))
				} } : {}
			}, P = d === void 0 ? 0 : Math.max(0, s + w - d);
			b === "ltr" && P > 0 && O.set(D.length, P), D.push(te);
		}
		E += s, a?.trailingGap && (E += v);
	}
	for (let [e, t] of O) {
		let n = D[e];
		if (n?.kind !== "text" || !n.decorations) continue;
		let r = D[e + 1], i = n.decorations.map((e) => e.kind === "underline" ? (r?.kind === "text" || r?.kind === "tab") && r.decorations?.some((t) => Gg(e, t)) ? e : qg(e, t) : e);
		D[e] = {
			...n,
			decorations: i
		};
	}
	for (let e = 0; e < D.length;) {
		let t = D[e];
		if (t?.kind !== "text" || !t.runBorder) {
			e += 1;
			continue;
		}
		let n = e + 1;
		for (; n < D.length;) {
			let e = D[n];
			if (e?.kind !== "text" || !e.runBorder) break;
			n += 1;
		}
		let r = Wh(D.slice(e, n).map((e) => ({
			bounds: e.bounds,
			trailingSlackPt: e.ownedTrailingSlackPt ?? 0,
			border: e.runBorder
		})));
		D[e] = {
			...t,
			runBorderFragments: r
		}, e = n;
	}
	return Jg(D), Pn({
		range: t.range,
		bounds: {
			xPt: w + T,
			yPt: t.topPt,
			widthPt: x,
			heightPt: t.advancePt
		},
		baselinePt: t.baselinePt,
		advancePt: t.advancePt,
		placements: D
	});
}
function Xg(e) {
	let t = e.continuation, n = t?.lineStart ?? 0, r = t?.lineEnd ?? e.lines.length;
	if (n < 0 || r < n || r > e.lines.length) throw RangeError("Paragraph continuation line range is outside the retained lines");
	let i = t?.continuesFromPrevious ? 0 : e.spacing.beforePt;
	for (let a = n; a < r; a += 1) {
		let r = e.lines[a];
		if (r) {
			if (a === 0 && !t?.continuesFromPrevious) i += Math.max(0, r.bounds.yPt - (e.flowBounds.yPt + e.spacing.beforePt));
			else if (a > n) {
				let t = e.lines[a - 1];
				i += Math.max(0, r.bounds.yPt - ((t?.bounds.yPt ?? r.bounds.yPt) + (t?.advancePt ?? 0)));
			}
			i += Pg(r.advancePt, "line.advancePt");
		}
	}
	return e.lines.length === 0 && e.paragraphMark && (i += Pg(e.paragraphMark.bounds.heightPt, "paragraphMark.heightPt")), t?.continuesOnNext || (i += e.spacing.afterPt), i;
}
function Zg(e) {
	let t = e.continuation?.lineStart ?? 0, n = e.continuation?.lineEnd ?? e.lines.length, r = e.lines.slice(t, n), i = e.continuation ? Xg(e) : Pg(e.flowBounds.heightPt, "flowBounds.heightPt");
	return Pn({
		kind: "paragraph",
		id: e.id,
		source: e.source,
		...e.paragraphId === void 0 ? {} : { paragraphId: e.paragraphId },
		flowDomainId: e.flowDomainId,
		ordinaryFlow: e.ordinaryFlow,
		...e.styleId === void 0 ? {} : { styleId: e.styleId },
		...e.bookmarkStarts?.length ? { bookmarkStarts: e.bookmarkStarts } : {},
		flowBounds: {
			...e.flowBounds,
			heightPt: i
		},
		inkBounds: e.inkBounds,
		...e.clipBounds ? { clipBounds: e.clipBounds } : {},
		advancePt: i,
		spacing: e.spacing,
		contextualSpacing: e.contextualSpacing ?? !1,
		lines: r,
		borders: e.borders,
		...e.shading ? { shading: e.shading } : {},
		resources: e.resources,
		drawings: e.drawings,
		textBoxes: e.textBoxes,
		events: e.events,
		exclusions: e.exclusions,
		...e.cellContainmentBounds ? { cellContainmentBounds: e.cellContainmentBounds } : {},
		...e.anchorCollisions?.length ? { anchorCollisions: e.anchorCollisions } : {},
		...e.anchorFrames ? { anchorFrames: e.anchorFrames } : {},
		...e.paragraphMark ? { paragraphMark: e.paragraphMark } : {},
		...e.continuation ? { continuation: e.continuation } : {}
	});
}
function Qg(e, t) {
	return {
		...e,
		path: [...e.path, t]
	};
}
function $g(e, t) {
	if (e.status === "planned") return Object.freeze([]);
	let n = Object.freeze({
		...t,
		path: Object.freeze([...t.path])
	});
	return Object.freeze(e.diagnostics.map((e) => Object.freeze({
		...e,
		source: n
	})));
}
function e_(e) {
	return rt(e);
}
function t_(e, t) {
	return it("unavailable-drawing", Qg(e, t));
}
function n_(e, t) {
	return Object.freeze({
		code: "MISSING_RESOURCE",
		severity: "warning",
		source: Object.freeze({
			...t,
			path: Object.freeze([...t.path])
		}),
		message: `Drawing ${e} resource is unavailable`
	});
}
function r_(e) {
	return xg(e) || (/^date$/i.test(e.fieldType) ? "date" : /^time$/i.test(e.fieldType) ? "time" : "document");
}
function i_(e) {
	return e.sourceRunIndex;
}
function a_(e) {
	if (!e.textLayoutService || !e.textShapeRequest) return;
	let t = e.textLayoutService.shape({
		...e.textShapeRequest,
		text: e.text,
		measure: !0
	});
	return {
		ascentPt: t.ascentPt,
		descentPt: t.descentPt
	};
}
var o_ = Object.freeze({
	yellow: "#FFFF00",
	cyan: "#00FFFF",
	green: "#00FF00",
	magenta: "#FF00FF",
	blue: "#0000FF",
	red: "#FF0000",
	darkBlue: "#000080",
	darkCyan: "#008080",
	darkGreen: "#008000",
	darkMagenta: "#800080",
	darkRed: "#800000",
	darkYellow: "#808000",
	darkGray: "#808080",
	lightGray: "#C0C0C0",
	black: "#000000",
	white: "#FFFFFF"
});
function s_(e) {
	return e.startsWith("#") ? e : o_[e] ?? "#FFFF00";
}
function c_(e) {
	let t = ps(e.vertAlign, e.fontSize) + (e.lineRelativePosition ?? e.position ?? 0);
	return t === 0 ? 0 : -t;
}
function l_(e, t, n, r, i, a, o) {
	let s = i_(e), c = s === void 0 ? void 0 : t.runs[s], l = Fg(c);
	if (e.metricOnly) {
		let t = a_(e);
		return {
			kind: "anchor-host",
			range: {
				start: n,
				end: n
			},
			bounds: {
				xPt: r,
				yPt: a,
				widthPt: 0,
				heightPt: o
			},
			baselinePt: i,
			...t ? { sourceMetrics: t } : {}
		};
	}
	let u = e.color ? {
		kind: "explicit",
		color: `#${e.color}`
	} : e.colorAuto ? {
		kind: "auto",
		...e.background ? { background: `#${e.background}` } : {}
	} : { kind: "default" }, d = e.fontRoute ?? ot(e.fontFamily ? `"${e.fontFamily.replaceAll("\"", "\\\"")}"` : "sans-serif", e.fontFamily ? "native" : "generic"), f = e.ruby && e.textLayoutService && e.textShapeRequest ? e.textLayoutService.shape({
		...e.textShapeRequest,
		text: e.text,
		measure: !0
	}) : void 0, p = e.ruby && e.textLayoutService && e.textShapeRequest ? e.textLayoutService.shape({
		...e.textShapeRequest,
		text: e.ruby.text,
		fontSizePt: e.ruby.fontSizePt,
		measure: !0
	}) : void 0, m = e.ruby && p ? (p.clusters ?? []).map((t) => {
		let n = p.spans.find((e) => e.start <= t.range.start && e.end >= t.range.end) ?? p.spans[0];
		if (!n) throw Error("Ruby shaping produced no selected-face span");
		return {
			text: e.ruby.text.slice(t.range.start, t.range.end),
			offsetPt: t.offsetPt,
			fontRoute: n.fontRoute,
			fontSizePt: e.ruby.fontSizePt,
			fontWeight: n.font.weight,
			fontStyle: n.font.style,
			color: u
		};
	}) : [], h = l?.ruby?.raisePt.status === "valid" ? l.ruby.raisePt.value ?? void 0 : e.ruby?.hpsRaisePt, g = e.ruby && p ? Fh({
		baseOrigin: {
			xPt: 0,
			yPt: 0
		},
		baseAdvancePt: e.measuredWidth,
		guideAdvancePt: p.advancePt,
		...h === void 0 ? {} : { raisePt: h },
		...f?.inkBounds && p.inkBounds ? {
			baseInkTopPt: -f.inkBounds.ascentPt,
			guideInkBottomFromBaselinePt: p.inkBounds.descentPt
		} : {},
		spans: m
	}) : [], _ = c_(e);
	return {
		kind: "text",
		text: e.text,
		...s === void 0 ? {} : { sourceRunIndex: s },
		...c?.type === "field" ? {
			role: "field-result",
			dependency: r_(c)
		} : {},
		...c?.type === "text" && (c.noteRef?.kind === "footnote" || c.noteRef?.kind === "endnote") ? { noteReference: {
			kind: c.noteRef.kind,
			id: c.noteRef.id
		} } : {},
		range: {
			start: n,
			end: n + e.text.length
		},
		origin: {
			xPt: r,
			yPt: i + _
		},
		bounds: {
			xPt: r,
			yPt: a,
			widthPt: e.measuredWidth,
			heightPt: o
		},
		advancePt: e.measuredWidth,
		clusters: [{
			range: {
				start: n,
				end: n + e.text.length
			},
			offset: {
				xPt: 0,
				yPt: 0
			},
			advancePt: e.measuredWidth
		}],
		color: u,
		fontRoute: d,
		fontSizePt: Ai(e, 1),
		fontWeight: e.bold ? 700 : 400,
		fontStyle: e.italic ? "italic" : "normal",
		direction: e.rtl ? "rtl" : "ltr",
		...e.verticalRun ? { writingMode: "vertical-rl" } : {},
		...e.charSpacing === void 0 ? {} : { characterSpacingPt: e.charSpacing },
		...e.charScale === void 0 ? {} : { characterScale: e.charScale },
		...e.fitTextRegionIndex === void 0 ? {} : { fitText: {
			regionIndex: e.fitTextRegionIndex,
			perGapPt: e.fitTextPerGapPx ?? 0,
			trailingPadPt: e.fitTextTrailingPadPx ?? 0
		} },
		...e.kerning === void 0 ? {} : { kerning: e.fontSize >= e.kerning },
		...e.position === void 0 ? {} : { positionPt: e.position },
		...e.vertAlign ? { verticalAlign: e.vertAlign } : {},
		...e.tateChuYoko ? { tateChuYoko: !0 } : {},
		...e.tateChuYokoCompress ? { tateChuYokoCompress: !0 } : {},
		...e.ruby && p ? { ruby: {
			text: e.ruby.text,
			advancePt: p.advancePt,
			authored: {
				...l?.ruby?.align.status === "valid" && l.ruby.align.value ? { align: l.ruby.align.value } : {},
				...l?.ruby?.baseFontSizePt.status === "valid" && l.ruby.baseFontSizePt.value !== null ? { baseFontSizePt: l.ruby.baseFontSizePt.value } : {},
				...h === void 0 ? {} : { raisePt: h },
				...l?.ruby?.language.status === "valid" && l.ruby.language.value ? { language: l.ruby.language.value } : {}
			},
			paintOps: g
		} } : {},
		...e.emphasisMark ? { emphasisMark: e.emphasisMark } : {},
		...e.highlight ? { highlight: s_(e.highlight) } : {},
		...e.background ? { background: `#${e.background}` } : {},
		...e.border ? { runBorder: {
			val: l?.border?.val.value ?? e.border.style,
			color: e.border.color ? `#${e.border.color}` : "#000000",
			widthPt: e.border.width,
			spacePt: e.border.space ?? 0,
			...l?.border?.themeColor.value ? { themeColor: l.border.themeColor.value } : {},
			...l?.border?.themeTint.value ? { themeTint: l.border.themeTint.value } : {},
			...l?.border?.themeShade.value ? { themeShade: l.border.themeShade.value } : {},
			...l?.border?.shadow.status === "valid" && l.border.shadow.value !== null ? { shadow: l.border.shadow.value } : {},
			...l?.border?.frame.status === "valid" && l.border.frame.value !== null ? { frame: l.border.frame.value } : {}
		} } : {},
		...e.revision ? { revision: e.revision } : {},
		typography: {
			caps: l?.caps ?? !1,
			smallCaps: l?.smallCaps ?? e.smallCaps === !0,
			strike: l?.strike ?? e.strikethrough,
			doubleStrike: l?.doubleStrike ?? e.doubleStrikethrough === !0,
			verticalAlign: l?.verticalAlign ?? {
				status: e.vertAlign ? "valid" : "missing",
				raw: e.vertAlign ?? null,
				value: e.vertAlign ?? null
			},
			positionPt: l?.positionPt ?? {
				status: e.position === void 0 ? "missing" : "valid",
				raw: e.position === void 0 ? null : String(e.position * 2),
				value: e.position ?? null
			},
			emphasis: l?.emphasis ?? {
				status: e.emphasisMark ? "valid" : "missing",
				raw: e.emphasisMark ?? null,
				value: e.emphasisMark ?? null
			},
			...l?.underline ? { underline: l.underline } : {}
		},
		decorations: [],
		paintOps: [{
			text: e.text,
			range: {
				start: n,
				end: n + e.text.length
			},
			offset: {
				xPt: 0,
				yPt: _
			},
			letterSpacingPt: Ys(e),
			scaleX: e.charScale ?? 1,
			direction: e.rtl ? "rtl" : "ltr",
			kerning: e.kerning === void 0 ? "auto" : e.fontSize >= e.kerning ? "normal" : "none",
			writingMode: e.verticalRun ? "vertical-rl" : "horizontal-tb"
		}],
		...e.hyperlink ? { hyperlink: e.hyperlink } : {}
	};
}
function u_(e, t) {
	let n = e.layout, r = n.visibleAscent ?? n.ascent, i = r + (n.visibleDescent ?? n.descent), a = t.lineSpacing?.rule === "auto" && !t.hasRuby && !t.lineGrid.active, o = a && (t.lineSpacing?.value ?? 1) < 1, s = a && !o ? Math.max(i, n.visibleIntendedSingle ?? n.intendedSingle) : e.advancePt;
	return e.topYPt + (s - i) / 2 + r;
}
function d_(e, t, n) {
	let r = e.numbering;
	if (!r) return;
	if (t.numberingMarkerGeometry) return t.numberingMarkerGeometry;
	let i = e.numberingMarkerShapeInput, a = n.environment.layoutServices?.text;
	if (!(!i || !a)) return fl(r, i, {
		authoredFirstIndentPt: e.indentFirst,
		physicalIndentLeftPt: t.physicalIndentLeftPt,
		tabStops: e.tabStops,
		defaultTabPt: t.defaultTabPt
	}, a);
}
function f_(e, t, n, r, i) {
	return i.bounds.widthPt <= 0 ? t.baseRtl ? n + r : n : t.baseRtl ? i.bounds.xPt + i.bounds.widthPt + e.bodyOffsetPt : i.bounds.xPt - e.bodyOffsetPt;
}
function p_(e, t, n, r, i, a) {
	if (!e.shape || e.markerText === "") return [];
	let o = e.shape, s = cl({
		baseRtl: n.baseRtl,
		alignedLeadingEdgePt: f_(e, n, r, i, a),
		authoredFirstIndentPt: t.indentFirst,
		markerShiftPt: e.markerShiftPt,
		markerWidthPt: e.markerWidthPt
	}), c = -e.markerText.length, l = t.numbering?.color ? {
		kind: "explicit",
		color: `#${t.numbering.color}`
	} : t.numbering?.colorAuto ? { kind: "auto" } : t.paragraphMarkColor ? {
		kind: "explicit",
		color: `#${t.paragraphMarkColor}`
	} : { kind: "default" }, u = 0;
	return o.spans.map((e) => {
		let r = u;
		u += e.advancePt;
		let i = o.clusters ? o.clusters.filter((t) => t.range.start >= e.start && t.range.end <= e.end).map((e) => ({
			range: {
				start: c + e.range.start,
				end: c + e.range.end
			},
			offset: {
				xPt: e.offsetPt - r,
				yPt: 0
			},
			advancePt: e.advancePt
		})) : [{
			range: {
				start: c + e.start,
				end: c + e.end
			},
			offset: {
				xPt: 0,
				yPt: 0
			},
			advancePt: e.advancePt
		}], d = s + r;
		return {
			kind: "text",
			role: "numbering-marker",
			text: e.text,
			range: {
				start: c + e.start,
				end: c + e.end
			},
			origin: {
				xPt: d,
				yPt: a.baselinePt
			},
			bounds: {
				xPt: d,
				yPt: a.baselinePt - e.ascentPt,
				widthPt: e.advancePt,
				heightPt: e.ascentPt + e.descentPt
			},
			advancePt: e.advancePt,
			clusters: i,
			paintOps: [{
				text: e.text,
				range: {
					start: c + e.start,
					end: c + e.end
				},
				offset: {
					xPt: 0,
					yPt: 0
				},
				letterSpacingPt: 0,
				scaleX: 1,
				direction: n.baseRtl ? "rtl" : "ltr",
				kerning: "auto",
				writingMode: "horizontal-tb"
			}],
			color: l,
			fontRoute: e.fontRoute,
			fontSizePt: t.numberingMarkerShapeInput?.fontSizePt ?? e.ascentPt + e.descentPt,
			fontWeight: e.font.weight,
			fontStyle: e.font.style,
			direction: n.baseRtl ? "rtl" : "ltr",
			decorations: []
		};
	});
}
function m_(e) {
	if (e) return e.startsWith("#") ? e : `#${e}`;
}
function h_(e, t, n) {
	let r = m_(t), i = m_(n);
	return e.map((e) => ({
		...e,
		placements: e.placements.map((e) => {
			if (e.kind !== "text") return e;
			let t = e.background ?? r ?? i;
			return !t || e.color.kind === "explicit" ? e : {
				...e,
				color: {
					kind: "auto",
					background: t
				}
			};
		})
	}));
}
function g_(e) {
	return e != null && e.style !== "none";
}
function __(e, t, n, r, i, a, o) {
	let s = n, c = n + r;
	e.indentFirst < 0 && (e.bidi ? c -= e.indentFirst : s += e.indentFirst);
	for (let e of t.flatMap((e) => e.placements)) !(e.kind === "text" && e.role === "numbering-marker" || e.kind === "resource" && e.resourceKind === "picture-bullet") || !e.bounds || (s = Math.min(s, e.bounds.xPt), c = Math.max(c, e.bounds.xPt + e.bounds.widthPt));
	let l = e.borders, u = o.top === "none" ? null : l?.[o.top] ?? null, d = o.bottom === "none" ? null : l?.bottom ?? null, f = g_(l?.left ?? null) ? l.left.space ?? 0 : 0, p = g_(l?.right ?? null) ? l.right.space ?? 0 : 0, m = g_(u) ? u.space ?? 0 : 0, h = g_(d) ? d.space ?? 0 : 0;
	return {
		xPt: s - f,
		yPt: i - m,
		widthPt: c - s + f + p,
		heightPt: a + m + h
	};
}
function v_(e) {
	return e.kind === "explicit" ? e.color : e.kind === "auto" ? Be(e.background ?? "#FFFFFF") : "#000000";
}
function y_(e) {
	return e.inkBounds ?? {
		xMinPt: 0,
		xMaxPt: e.advancePt,
		ascentPt: e.ascentPt,
		descentPt: e.descentPt
	};
}
function b_(e) {
	return e === "circle" ? "○" : e === "comma" ? "﹅" : "•";
}
function x_(e, t, n) {
	let r = e.trackChangesMarkup, i = Jm(r?.kind);
	if (!(e.highlight || e.underline || e.strikethrough || e.doubleStrikethrough || e.emphasisMark || i.underline || i.strike)) return;
	let a = e.textLayoutService, o = e.textShapeRequest;
	if (!a || !o) throw Error("Retained typography geometry requires TextLayoutService");
	let s = (e) => a.shape({
		...o,
		text: e,
		measure: !0
	}), c = (e) => {
		let t = s(e), n = t.spans[0];
		if (!n || t.spans.length !== 1 || n.start !== 0 || n.end !== e.length) throw Error("Retained decoration probe requires one selected-face span");
		return {
			ascentPt: n.ascentPt,
			descentPt: n.descentPt,
			...n.inkBounds ? { inkBounds: n.inkBounds } : {}
		};
	}, l = e.selectedFaceFontBox;
	if (!l || !e.selectedFaceInkBounds) throw Error("Retained typography geometry requires authoritative selected-face metrics");
	let u = {
		ascentPt: l.ascentPt,
		descentPt: l.descentPt,
		inkBounds: e.selectedFaceInkBounds
	}, d = v_(n), f = e.underline ? {
		...e.underlineStyle ? { authoredStyle: e.underlineStyle } : {},
		color: e.underlineColor && e.underlineColor !== "auto" ? `#${e.underlineColor}` : d,
		probe: c("_")
	} : r && i.underline ? {
		color: r.authorColor,
		probe: c("_")
	} : void 0, p = e.strikethrough || e.doubleStrikethrough ? {
		double: e.doubleStrikethrough === !0,
		probe: c("-"),
		...e.doubleStrikethrough ? { doubleProbe: c("=") } : {}
	} : r && i.strike ? {
		double: !1,
		probe: c("-"),
		color: r.authorColor
	} : void 0, m = e.emphasisMark ? (() => {
		let r = b_(e.emphasisMark), i = s(r), a = i.spans[0];
		if (!a) throw Error("Emphasis shaping produced no selected-face span");
		let c = (e.shapedClusters ?? []).map((n) => {
			let r = e.text.slice(n.range.start, n.range.end);
			return {
				text: r,
				range: {
					start: t + n.range.start,
					end: t + n.range.end
				},
				ink: y_(s(r))
			};
		});
		return {
			authored: e.emphasisMark,
			glyph: r,
			mark: {
				inkBounds: y_(i),
				fontRoute: a.fontRoute,
				fontSizePt: o.fontSizePt,
				fontWeight: a.font.weight,
				fontStyle: a.font.style,
				color: n
			},
			clusterInk: c
		};
	})() : void 0;
	return {
		base: u,
		...f ? { underline: f } : {},
		...p ? { strike: p } : {},
		...m ? { emphasis: m } : {}
	};
}
function S_(e, t, n, r, i, a) {
	if (e.metricOnly) {
		let t = a_(e);
		return {
			kind: "anchor-host",
			measuredWidthPt: 0,
			range: {
				start: n,
				end: n
			},
			...t ? { sourceMetrics: t } : {},
			...i?.type === "anchorHost" && i.anchorOccurrenceId ? { anchorOccurrenceId: i.anchorOccurrenceId } : {}
		};
	}
	let o = l_(e, t, n, 0, 0, 0, 0);
	if (o.kind !== "text") throw Error("Visible text segment projected as anchor host");
	let s = uc(e, r, 1), c = e.charScale ?? 1, l = c_(e), u = x_(e, n, o.color), d = e.shapedClusters, f = d?.length && d[0]?.range.start === 0 && d.at(-1)?.range.end === e.text.length && d.every((e, t) => t === 0 || d[t - 1]?.range.end === e.range.start) && d.every((e) => e.range.start < e.range.end && Number.isFinite(e.offsetPt) && Number.isFinite(e.advancePt)) ? d : void 0;
	if (e.text.length > 0 && !f) throw Error("Visible text acquisition requires complete authoritative grapheme clusters from TextLayoutService");
	let p = (f ?? []).map((t, i) => {
		let a = e.text.slice(0, t.range.start), o = e.text.slice(t.range.start, t.range.end), u = [...a].length, d = [...o].length, p = i === (f?.length ?? 0) - 1 ? e.fitTextTrailingPadPx ?? 0 : 0, m = e.punctuationCompressions?.filter((e) => e.end <= t.range.start).reduce((e, t) => e + t.adjustmentPt, 0) ?? 0, h = e.punctuationCompressions?.filter((e) => e.end > t.range.start && e.end <= t.range.end).reduce((e, t) => e + t.adjustmentPt, 0) ?? 0, g = Qs(e, a, r) * c, _ = Qs(e, o, r) * c;
		return {
			range: {
				start: n + t.range.start,
				end: n + t.range.end
			},
			offset: {
				xPt: t.offsetPt * c + u * s + g + m,
				yPt: l
			},
			advancePt: t.advancePt * c + d * s + _ + p + h
		};
	}), m = e.snapGridLeadingPadPx ?? 0, h = e.measuredWidth - (e.snapGridTrailingPadPx ?? 0), g;
	if (e.snapGridClass === "eastAsia" && e.snapGridCellPitchPx) {
		let t = e.snapGridCellPitchPx, r = 0;
		p = p.map((i, a) => {
			e.text.slice(i.range.start - n, i.range.end - n);
			let o = qo(i.advancePt, t), s = o * t, l = r * t + (s - i.advancePt) / 2;
			if (a === p.length - 1) {
				h = l + i.advancePt;
				let t = f?.[a]?.offsetPt;
				e.selectedFaceInkBounds && t !== void 0 && !/\s$/u.test(e.text) && (g = l + Math.max(0, (e.selectedFaceInkBounds.xMaxPt - t) * c));
			}
			let u = {
				...i,
				offset: {
					xPt: l,
					yPt: i.offset.yPt
				},
				advancePt: s
			};
			return r += o, u;
		});
	} else m !== 0 && (p = p.map((e) => ({
		...e,
		offset: {
			xPt: e.offset.xPt + m,
			yPt: e.offset.yPt
		}
	})));
	let { origin: _, bounds: v, advancePt: y, paintOps: b, clusters: x, ...S } = o, C = e.tateChuYoko && e.tateChuYokoCompress ? (() => {
		if (!e.textLayoutService || !e.textShapeRequest) throw Error("Tate-chu-yoko compression requires TextLayoutService");
		let t = e.textLayoutService.shape({
			...e.textShapeRequest,
			text: e.text,
			fontSizePt: o.fontSizePt,
			measure: !0,
			clusterGeometry: !1
		}), n = t.ascentPt + t.descentPt;
		return n > o.fontSizePt && n > 0 ? o.fontSizePt / n : 1;
	})() : 1, w = e.punctuationCompressions?.some((t) => t.end < e.text.length) ?? !1, T = e.verticalRun ? (() => {
		if (!a) throw Error("Vertical glyph planning capability is required for vertical text");
		let t = b[0];
		return a.planRun({
			text: e.text,
			font: st(o.fontRoute, o.fontSizePt, o.fontWeight, o.fontStyle),
			fontKerning: t.kerning,
			fontSizePt: o.fontSizePt,
			letterSpacingPt: s,
			charScale: c,
			growTrRotateInk: !0,
			writingMode: t.writingMode
		}).map((r) => ({
			...t,
			text: r.text,
			range: {
				start: n + r.range.start,
				end: n + r.range.end
			},
			offset: {
				xPt: r.originPt + (e.punctuationCompressions?.filter((e) => e.end <= r.range.start).reduce((e, t) => e + t.adjustmentPt, 0) ?? 0),
				yPt: l
			},
			letterSpacingPt: s,
			glyphOrientation: r.orientation,
			...r.verticalFeature ? { verticalFeature: !0 } : {},
			...r.blockAxisInkBounds ? { blockAxisInkBounds: r.blockAxisInkBounds } : {},
			...r.drawOffsetPt.xPt !== 0 || r.drawOffsetPt.yPt !== 0 ? { glyphOffsetPt: r.drawOffsetPt } : {}
		}));
	})() : e.tateChuYoko ? b.map((t) => ({
		...t,
		offset: {
			xPt: t.offset.xPt + e.measuredWidth / 2,
			yPt: t.offset.yPt
		},
		glyphOrientation: "upright",
		...C === 1 ? {} : { scaleY: C }
	})) : w ? (() => {
		let t = b[0], r = [];
		for (let t of p) {
			let i = t.range.end - n, a = e.punctuationCompressions?.find((e) => e.end === i)?.adjustmentPt ?? null, o = r.at(-1);
			o && o.adjustmentPt === a ? o.end = t.range.end : r.push({
				start: t.range.start,
				end: t.range.end,
				offset: t.offset,
				adjustmentPt: a
			});
		}
		return r.map((r) => ({
			...t,
			text: e.text.slice(r.start - n, r.end - n),
			range: {
				start: r.start,
				end: r.end
			},
			offset: r.offset,
			letterSpacingPt: s + (r.adjustmentPt ?? 0)
		}));
	})() : b, E = e.snapGridClass === "eastAsia" ? (() => {
		let t = T[0];
		return t ? p.map((r) => ({
			...t,
			text: e.text.slice(r.range.start - n, r.range.end - n),
			range: r.range,
			offset: r.offset
		})) : T;
	})() : m === 0 ? T : T.map((e) => ({
		...e,
		offset: {
			xPt: e.offset.xPt + m,
			yPt: e.offset.yPt
		}
	})), D = r?.type === "snapToChars" && e.underline && !e.verticalRun && t.bidi !== !0 && e.selectedFaceInkBounds ? g ?? (E.length === 1 ? E[0].offset.xPt + (E[0].glyphOffsetPt?.xPt ?? 0) + e.selectedFaceInkBounds.xMaxPt * (E[0].scaleX ?? 1) : h) : h;
	return {
		...S,
		kind: "text",
		measuredWidthPt: e.measuredWidth,
		clusters: p,
		basePaintOps: E.map((t) => ({
			...t,
			letterSpacingPt: e.verticalRun && t.glyphOrientation !== "sideways" ? 0 : w ? t.letterSpacingPt : s,
			...!e.verticalRun && e.selectedFaceInkBounds ? { inkBounds: e.selectedFaceInkBounds } : {},
			...!e.verticalRun && e.selectedFaceInkBounds && t.glyphOrientation === void 0 ? { blockAxisInkBounds: {
				startPt: (t.glyphOffsetPt?.yPt ?? 0) - e.selectedFaceInkBounds.ascentPt,
				endPt: (t.glyphOffsetPt?.yPt ?? 0) + e.selectedFaceInkBounds.descentPt
			} } : {}
		})),
		breakBefore: e.breakBefore !== !1 && !e.joinPrev,
		rtl: e.rtl,
		digitsAsAN: e.digitsAsAN,
		fixedPitch: e.fitTextRegionIndex !== void 0 || e.snapGridClass !== void 0,
		...r?.type === "snapToChars" && e.underline ? { decorationTerminalAdvancePt: D } : {},
		...u ? { retainedGeometry: u } : {},
		...e.selectedFaceFontBox ? { selectedFaceFontBox: e.selectedFaceFontBox } : {},
		...e.textLayoutService ? { textLayoutService: e.textLayoutService } : {},
		...e.textShapeRequest ? { textShapeRequest: e.textShapeRequest } : {}
	};
}
function C_(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let e of t.lines) for (let t of e.layout.segments) {
		let e = i_(t);
		if (e === void 0) continue;
		let r = "text" in t ? t.metricOnly ? 0 : t.text.length : "math" in t ? t.fallbackText.length : +("isTab" in t || "imagePath" in t);
		n.set(e, (n.get(e) ?? 0) + r);
	}
	let r = e.runs.map((e, t) => {
		let r = n.get(t);
		return r === void 0 ? e.type === "text" ? e.text.length : e.type === "field" ? e.fallbackText.length : e.type === "anchorHost" ? 0 : 1 : r;
	}), i = 0;
	return {
		runStarts: r.map((e) => {
			let t = i;
			return i += e, t;
		}),
		runLengths: r
	};
}
function w_(e) {
	return "text" in e ? e.metricOnly ? 0 : e.text.length : "math" in e ? e.fallbackText.length : 1;
}
function T_(e, t, n, r, i, a, o, s, c, l, u, d = !1) {
	let f = 0, p = /* @__PURE__ */ new Map(), m = e.lines.some((e) => e.layout.segments.some((e) => "isTab" in e)), h = t.tabStops?.reduce((e, t) => !e || t.pos < e.pos ? t : e, void 0), g = e.lines.flatMap((e) => e.layout.segments.flatMap((e) => "text" in e && !e.metricOnly ? [e.text] : [])).join("").trim(), _ = !m && h?.alignment === "decimal" && g !== "" && /^[+\-(]?[\d., ]+\)?%?$/u.test(g) ? h.pos - o.physicalIndentLeftPt : void 0;
	return e.lines.map((m, h) => {
		let g = m.layout, v = u_(m, o), y = Infinity, b = f, x = [];
		for (let e of g.segments) {
			let n = i_(e), r = n === void 0 ? void 0 : t.runs[n], c = w_(e), m = n === void 0 ? f : (s.runStarts[n] ?? f) + (p.get(n) ?? 0);
			if (n !== void 0 && p.set(n, (p.get(n) ?? 0) + c), y = Math.min(y, m), b = Math.max(b, m + c), "isTab" in e) {
				let t = e, n = t.leader ?? "none", i, a, o = r?.type === "text" || r?.type === "field" ? r : void 0, s = o, u = (e) => {
					if (!l) throw Error("Formatted tab acquisition requires TextLayoutService");
					return l.shape({
						text: e,
						fontSizePt: t.fontSize,
						fonts: s?.fontSlots?.direct ?? (o?.fontFamily ? { ascii: o.fontFamily } : {}),
						themeFonts: s?.fontSlots?.theme,
						themeFontPresence: s?.fontSlots?.themePresent,
						weight: t.bold ? 700 : 400,
						style: t.italic ? "italic" : "normal",
						measure: !0
					});
				}, d = (e) => {
					let t = u(e), n = t.spans[0];
					if (!n || t.spans.length !== 1 || n.start !== 0 || n.end !== e.length) throw Error("Formatted tab probe requires one selected-face span");
					return {
						ascentPt: n.ascentPt,
						descentPt: n.descentPt,
						...n.inkBounds ? { inkBounds: n.inkBounds } : {}
					};
				};
				if (o?.underline) {
					let e = o.color ? `#${o.color}` : "#000000";
					a = {
						base: d("M"),
						probe: d("_"),
						color: s?.underlineColor && s.underlineColor !== "auto" ? `#${s.underlineColor}` : e,
						...s?.underlineStyle ? { authoredStyle: s.underlineStyle } : {}
					};
				}
				if (n !== "none") {
					if (!l) throw Error("Tab leader acquisition requires TextLayoutService");
					let e = n === "hyphen" ? "-" : n === "underscore" || n === "heavy" ? "_" : n === "middleDot" ? "·" : ".", r = u(e), a = r.spans[0];
					if (!a || !Number.isFinite(r.advancePt) || r.advancePt <= 0) throw Error("Tab leader acquisition produced no shaped glyph advance");
					i = {
						glyph: e,
						advancePt: r.advancePt,
						fontRoute: a.fontRoute,
						fontSizePt: t.fontSize,
						fontWeight: a.font.weight,
						fontStyle: a.font.style,
						color: o?.color ? {
							kind: "explicit",
							color: `#${o.color}`
						} : s?.colorAuto ? { kind: "auto" } : { kind: "default" }
					};
				}
				x.push({
					kind: "tab",
					range: {
						start: m,
						end: m + c
					},
					measuredWidthPt: t.measuredWidth,
					leader: n,
					fontSizePt: t.fontSize,
					bold: t.bold,
					italic: t.italic,
					...a ? { underline: a } : {},
					...i ? { leaderShape: i } : {}
				});
			} else if ("imagePath" in e) {
				let t = e;
				if (t.anchor) continue;
				let n = i_(e), r = Qg(i, n ?? 0);
				if (t.inlineShape) {
					x.push({
						kind: "inline-drawing",
						range: {
							start: m,
							end: m + c
						},
						drawingId: `${a}:drawing:${n ?? 0}`,
						measuredWidthPt: t.measuredWidth,
						widthPt: t.widthPt,
						heightPt: t.heightPt,
						topOffsetPt: -t.heightPt
					}), f = Math.max(f, m + c);
					continue;
				}
				if (t.unavailableResourceKind) {
					x.push({
						kind: "unavailable-resource",
						range: {
							start: m,
							end: m + c
						},
						resourceKind: t.unavailableResourceKind,
						measuredWidthPt: t.measuredWidth,
						widthPt: t.widthPt,
						heightPt: t.heightPt,
						topOffsetPt: -t.heightPt,
						drawingId: t_(i, n ?? 0)
					}), f = Math.max(f, m + c);
					continue;
				}
				let o = t.chart ? "chart" : "image", s = t.chartResourceKey ?? (t.chart ? e_(r) : tt(r, t.imagePath));
				x.push({
					kind: "resource",
					range: {
						start: m,
						end: m + c
					},
					...n === void 0 ? {} : { sourceRunIndex: n },
					resourceKey: s,
					resourceKind: o,
					measuredWidthPt: t.measuredWidth,
					widthPt: t.widthPt,
					heightPt: t.heightPt,
					topOffsetPt: -t.heightPt,
					...d ? { orientation: "upright-physical" } : {}
				});
			} else if ("math" in e) {
				let t = e;
				x.push({
					kind: "resource",
					range: {
						start: m,
						end: m + c
					},
					...i_(e) === void 0 ? {} : { sourceRunIndex: i_(e) },
					resourceKey: t.mathResourceKey,
					resourceKind: "math",
					measuredWidthPt: t.measuredWidth,
					widthPt: t.measuredWidth,
					heightPt: t.mathAscent + t.mathDescent,
					topOffsetPt: -t.mathAscent
				});
			} else x.push(S_(e, t, m, rl(o), r, u));
			f = Math.max(f, m + c);
		}
		let S = g.segments.length === 1 && "math" in (g.segments[0] ?? {}) ? g.segments[0] : void 0;
		return Yg({
			paragraphXPt: n,
			availableWidthPt: r,
			alignment: t.alignment,
			baseRtl: o.baseRtl,
			isFirstLine: h === 0,
			isLastLine: h === e.lines.length - 1,
			stretchLastLine: o.stretchLastLine,
			firstLineIndentPt: o.firstIndentPt,
			...h === 0 && c ? { numbering: { bodyOffsetPt: c.bodyOffsetPt } } : {},
			..._ === void 0 ? {} : { decimalAutoTabPt: _ },
			...S?.display ? { displayMathJustification: S.jc ?? o.mathDefJc ?? "centerGroup" } : {},
			line: {
				range: {
					start: Number.isFinite(y) ? y : f,
					end: b
				},
				topPt: m.topYPt,
				baselinePt: v,
				advancePt: m.advancePt,
				xOffsetPt: g.xOffset,
				availableWidthPt: g.availWidth,
				endsWithBreak: g.endsWithBreak ?? !1,
				segments: x
			}
		});
	});
}
function E_(e, t, n, r, i) {
	let a = i.filter((e) => e.alignment === "bar");
	return a.length === 0 ? e : e.map((e) => ({
		...e,
		barTabRules: a.map((i) => {
			let a = r ? t + n - i.pos : t + i.pos;
			return {
				from: {
					xPt: a,
					yPt: e.bounds.yPt
				},
				to: {
					xPt: a,
					yPt: e.bounds.yPt + e.bounds.heightPt
				},
				color: "#000000",
				widthPt: 0,
				authoredStyle: "single",
				style: "solid"
			};
		})
	}));
}
function D_(e, t) {
	return {
		start: e.start + t,
		end: e.end + t
	};
}
function O_(e, t) {
	if (!Number.isFinite(t) || t < 0) throw RangeError("Paragraph continuation source range must be finite and non-negative");
	let n = e[0];
	if (!n) return e;
	let r = t - n.range.start;
	return r === 0 ? e : e.map((e) => ({
		...e,
		range: D_(e.range, r),
		placements: e.placements.map((e) => {
			let t = D_(e.range, r);
			return e.kind === "text" ? {
				...e,
				range: t,
				clusters: e.clusters.map((e) => ({
					...e,
					range: D_(e.range, r)
				})),
				paintOps: e.paintOps.map((e) => ({
					...e,
					range: D_(e.range, r)
				}))
			} : {
				...e,
				range: t
			};
		})
	}));
}
function k_(e, t, n, r, i) {
	let a = e.contentEndYPt - e.contentStartYPt;
	return Yg({
		paragraphXPt: n,
		availableWidthPt: r,
		alignment: t.alignment,
		baseRtl: i.baseRtl,
		isFirstLine: !0,
		isLastLine: !0,
		stretchLastLine: i.stretchLastLine,
		line: {
			range: {
				start: 0,
				end: 0
			},
			topPt: e.contentStartYPt,
			baselinePt: e.contentEndYPt - e.lastLineBelowBaselinePt,
			advancePt: a,
			xOffsetPt: 0,
			availableWidthPt: r,
			endsWithBreak: !1,
			segments: []
		}
	});
}
function A_(e, t) {
	let n = t.anchorFrames, r = e.anchorXRelativeFrom ?? (e.anchorXFromMargin ? "margin" : "page"), i = e.anchorYRelativeFrom ?? (e.anchorYFromPara ? "paragraph" : "page"), a = n?.page, o = n?.margin, s = a && o ? {
		xPt: a.xPt,
		yPt: a.yPt,
		widthPt: Math.max(0, o.xPt - a.xPt),
		heightPt: a.heightPt
	} : null, c = a && o ? {
		xPt: o.xPt + o.widthPt,
		yPt: a.yPt,
		widthPt: Math.max(0, a.xPt + a.widthPt - o.xPt - o.widthPt),
		heightPt: a.heightPt
	} : null, l = a && o ? {
		xPt: a.xPt,
		yPt: a.yPt,
		widthPt: a.widthPt,
		heightPt: Math.max(0, o.yPt - a.yPt)
	} : null, u = a && o ? {
		xPt: a.xPt,
		yPt: o.yPt + o.heightPt,
		widthPt: a.widthPt,
		heightPt: Math.max(0, a.yPt + a.heightPt - o.yPt - o.heightPt)
	} : null, d = n?.pageParity === "even", f = r === "page" ? a : r === "column" || r === "character" ? n?.column : r === "leftMargin" ? s : r === "rightMargin" ? c : r === "insideMargin" ? d ? c : s : r === "outsideMargin" ? d ? s : c : o, p = i === "paragraph" || i === "line" || i === "character" ? {
		xPt: t.placement.paragraphXPt,
		yPt: t.placement.startYPt,
		widthPt: t.placement.availableWidthPt,
		heightPt: 0
	} : i === "page" ? a : i === "column" ? n?.column : i === "topMargin" ? l : i === "bottomMargin" ? u : i === "insideMargin" ? d ? u : l : i === "outsideMargin" ? d ? l : u : o;
	if (!f || !p) return null;
	let m = e.widthPt, h = e.heightPt, g = e.anchorXPt ?? 0, _ = e.anchorYPt ?? 0, v = e.type === "shape" ? e.pctPosH : null, y = e.type === "shape" ? e.pctPosV : null;
	return {
		xPt: v == null ? e.anchorXAlign === "center" ? f.xPt + (f.widthPt - m) / 2 : e.anchorXAlign === "right" || e.anchorXAlign === "outside" && !d || e.anchorXAlign === "inside" && d ? f.xPt + f.widthPt - m : f.xPt + g : f.xPt + f.widthPt * v + g,
		yPt: y == null ? e.anchorYAlign === "center" ? p.yPt + (p.heightPt - h) / 2 : e.anchorYAlign === "bottom" || e.anchorYAlign === "outside" && !d || e.anchorYAlign === "inside" && d ? p.yPt + p.heightPt - h : p.yPt + _ : p.yPt + p.heightPt * y + _,
		widthPt: m,
		heightPt: h
	};
}
function j_(e, t) {
	return A_(e, t) ?? {
		xPt: e.anchorXPt + (e.anchorXFromMargin ? t.placement.paragraphXPt : 0),
		yPt: e.anchorYPt + (e.anchorYFromPara ? t.placement.startYPt : 0),
		widthPt: e.widthPt,
		heightPt: e.heightPt
	};
}
function M_(e, t, n, r, i = !1) {
	let a = Qg(n.source, r), o = jh(e, t, n.environment.layoutServices?.text, e.vmlTextPathInput, e.fill?.fillType === "image" ? tt(a, e.fill.imagePath) : void 0), s = [o.command], c = $g(o, a);
	return {
		kind: "drawing",
		id: `${n.id}:drawing:${r}`,
		source: a,
		flowDomainId: n.flowDomainId,
		flowBounds: t,
		inkBounds: t,
		advancePt: 0,
		ordinaryFlow: !1,
		commands: s,
		...c.length === 0 ? {} : { diagnostics: c },
		...i ? {} : { anchorLayer: {
			occurrenceId: `public-shape:${n.id}:${r}`,
			behindDoc: e.behindDoc === !0,
			relativeHeight: Number.isFinite(e.zOrder) ? e.zOrder : r,
			sourceOrder: r,
			horizontalOwnership: e.anchorXRelativeFrom === "character" || e.anchorXRelativeFrom === "column" ? "host" : "page",
			verticalOwnership: e.anchorYRelativeFrom === "paragraph" || e.anchorYRelativeFrom === "line" || e.anchorYRelativeFrom === "character" || !e.anchorYRelativeFrom && e.anchorYFromPara ? "host" : "page"
		} }
	};
}
function N_(e, t, n) {
	if (!e.anchor || e.anchorAcquisitionInput) return null;
	let r = A_(e, t);
	if (!r) return null;
	let i = e.anchorYRelativeFrom ?? (e.anchorYFromPara ? "paragraph" : "page"), a = Qg(t.source, n);
	return {
		kind: "drawing",
		id: `${t.id}:public-anchor-drawing:${n}`,
		source: a,
		flowDomainId: t.flowDomainId,
		flowBounds: r,
		inkBounds: r,
		advancePt: 0,
		ordinaryFlow: !1,
		commands: [{
			kind: "resource",
			resourceKind: e.type,
			resourceKey: e.type === "image" ? tt(a, e.imagePath) : e_(a),
			rect: r,
			...t.environment.verticalPageFrame ? { orientation: "upright-physical" } : {}
		}],
		anchorLayer: {
			occurrenceId: `public-anchor:${t.id}:${n}`,
			behindDoc: !1,
			relativeHeight: n,
			sourceOrder: n,
			horizontalOwnership: "page",
			verticalOwnership: i === "paragraph" ? "host" : "page"
		}
	};
}
function P_(e) {
	return (e.type === "image" || e.type === "chart" || e.type === "shape" || e.type === "unavailableDrawing") && e.anchorAcquisitionInput !== void 0;
}
function F_(e) {
	return [
		{
			xPt: e.xPt,
			yPt: e.yPt
		},
		{
			xPt: e.xPt + e.widthPt,
			yPt: e.yPt
		},
		{
			xPt: e.xPt + e.widthPt,
			yPt: e.yPt + e.heightPt
		},
		{
			xPt: e.xPt,
			yPt: e.yPt + e.heightPt
		}
	];
}
function I_(e, t, n) {
	let r = t.xPt - e.xPt, i = t.yPt - e.yPt, a = e.xPt + e.widthPt - t.xPt - t.widthPt, o = e.yPt + e.heightPt - t.yPt - t.heightPt;
	return {
		xPt: n.xPt - r,
		yPt: n.yPt - i,
		widthPt: Math.max(0, n.widthPt + r + a),
		heightPt: Math.max(0, n.heightPt + i + o)
	};
}
function L_(e, t) {
	return {
		a: t.a,
		b: t.b,
		c: t.c,
		d: t.d,
		e: e.xPt + e.widthPt / 2,
		f: e.yPt + e.heightPt / 2
	};
}
function R_(e, t) {
	let n = [
		Gd(t, e),
		Gd(t, {
			xPt: e.xPt + e.widthPt,
			yPt: e.yPt
		}),
		Gd(t, {
			xPt: e.xPt,
			yPt: e.yPt + e.heightPt
		}),
		Gd(t, {
			xPt: e.xPt + e.widthPt,
			yPt: e.yPt + e.heightPt
		})
	];
	if (n.some((e) => e === null)) throw Error("Upright drawing transform must be invertible");
	let r = n, i = Math.min(...r.map((e) => e.xPt)), a = Math.min(...r.map((e) => e.yPt));
	return {
		xPt: i,
		yPt: a,
		widthPt: Math.max(...r.map((e) => e.xPt)) - i,
		heightPt: Math.max(...r.map((e) => e.yPt)) - a
	};
}
function z_(e, t) {
	return wi(t, e);
}
function B_(e, t) {
	let n = (e) => {
		let n = Ti(t, {
			top: e.topPt,
			right: e.rightPt,
			bottom: e.bottomPt,
			left: e.leftPt
		});
		return {
			topPt: n.top,
			rightPt: n.right,
			bottomPt: n.bottom,
			leftPt: n.left
		};
	};
	return {
		...e,
		axes: {
			horizontal: e.axes.vertical,
			vertical: e.axes.horizontal
		},
		geometry: {
			...e.geometry,
			objectFrame: wi(t, e.geometry.objectFrame),
			inkBounds: wi(t, e.geometry.inkBounds),
			wrapBounds: e.geometry.wrapBounds ? wi(t, e.geometry.wrapBounds) : null,
			size: {
				horizontal: e.geometry.size.vertical,
				vertical: e.geometry.size.horizontal
			},
			parentEffectExtent: n(e.geometry.parentEffectExtent),
			wrap: {
				...e.geometry.wrap,
				distances: n(e.geometry.wrap.distances),
				distanceSources: Ti(t, e.geometry.wrap.distanceSources),
				effectExtent: n(e.geometry.wrap.effectExtent),
				...e.geometry.wrap.polygon ? { polygon: {
					...e.geometry.wrap.polygon,
					points: e.geometry.wrap.polygon.points.map((e) => Ci(t, e))
				} } : {}
			}
		}
	};
}
function V_(e, t) {
	let n = e.geometry.objectFrame;
	if (n.xPt === t.xPt && n.yPt === t.yPt && n.widthPt === t.widthPt && n.heightPt === t.heightPt) return e;
	let r = n.widthPt === 0 ? 1 : t.widthPt / n.widthPt, i = n.heightPt === 0 ? 1 : t.heightPt / n.heightPt, a = e.geometry.wrap.polygon;
	return {
		...e,
		geometry: {
			...e.geometry,
			objectFrame: t,
			inkBounds: I_(e.geometry.inkBounds, n, t),
			wrapBounds: e.geometry.wrapBounds ? I_(e.geometry.wrapBounds, n, t) : null,
			wrap: {
				...e.geometry.wrap,
				polygon: a ? {
					...a,
					points: a.points.map((e) => ({
						xPt: t.xPt + (e.xPt - n.xPt) * r,
						yPt: t.yPt + (e.yPt - n.yPt) * i
					}))
				} : null
			}
		}
	};
}
function H_(e, t, n) {
	let r = e.group?.resolvedChildFrame;
	if (!r) return t;
	let i = e.extent.widthPt, a = e.extent.heightPt;
	if (e.extent.widthStatus !== "valid" || e.extent.heightStatus !== "valid" || i === null || a === null || i <= 0 || a <= 0) throw Error("resolved grouped anchor requires its authored wp:extent");
	let o = n === void 0 ? t : wi(n.logicalToPhysical, t), s = o.widthPt / i, c = o.heightPt / a, l = {
		xPt: o.xPt + r.offsetXPt * s,
		yPt: o.yPt + r.offsetYPt * c,
		widthPt: r.widthPt * s,
		heightPt: r.heightPt * c
	};
	return n === void 0 ? l : wi(n.physicalToLogical, l);
}
function U_(e, t, n = !1) {
	let r = e.axes[t];
	return r.status !== "resolved" || n || r.referenceFrame === "paragraph" || r.referenceFrame === "line" || r.referenceFrame === "character" ? "host" : "page";
}
function W_(e, t, n, r, i, a, o, s, c, l) {
	let u = -1, d;
	for (let t = 0; t < n.length; t += 1) {
		let r = n[t]?.placements.find((t) => t.kind === "anchor-host" && t.anchorOccurrenceId === e);
		if (r?.kind === "anchor-host") {
			u = t, d = r;
			break;
		}
	}
	if (!d || u < 0) return null;
	let f = [...t].sort((e, t) => (e.run.anchorAcquisitionInput?.group?.sourceIndex ?? 0) - (t.run.anchorAcquisitionInput?.group?.sourceIndex ?? 0) || e.runIndex - t.runIndex), p = f[0];
	if (!p?.run.anchorAcquisitionInput) return null;
	let m = n[u], h = i.anchorFrames, g = p.run.anchorAcquisitionInput.behavior, _ = g.layoutInCellStatus === "valid" && g.layoutInCell === !0 && i.anchorCellBounds !== void 0 ? i.anchorCellBounds : null, v = _g({
		acquisition: p.run.anchorAcquisitionInput,
		frames: {
			page: h?.page ? _ ? {
				...h.page,
				..._
			} : h.page : null,
			margin: h?.margin ? _ ? {
				...h.margin,
				..._
			} : h.margin : null,
			column: h?.column ? _ ? {
				...h.column,
				..._
			} : h.column : null,
			paragraph: {
				xPt: i.placement.paragraphXPt,
				yPt: i.placement.startYPt,
				widthPt: i.placement.availableWidthPt,
				heightPt: Math.max(0, a)
			},
			line: m.bounds,
			character: d.bounds,
			pageParity: h?.pageParity ?? null
		}
	});
	if (v.status !== "resolved") return {
		result: v,
		textBoxes: [],
		hostLineIndex: u,
		hostRange: d.range
	};
	let y = i.environment.verticalPageFrame && h?.page ? bi(h.page, i.environment.pageWritingMode) : void 0, b = y === void 0 ? void 0 : Ei(i.environment.pageWritingMode, y), x = y === void 0 ? v : B_(v, b.physicalToLogical);
	if (g.behindDocStatus !== "valid" || g.relativeHeightStatus !== "valid" || g.behindDoc === null || g.relativeHeight === null) throw Error("resolved anchor frame must retain required CT_Anchor behavior");
	let S = x.geometry.objectFrame, C = y === void 0 ? void 0 : L_(S, b.physicalToLogical), w = C ? {
		...i.environment,
		verticalCJK: !1,
		verticalPageFrame: !1
	} : i.environment, T = [], E = [], D = [], O = [], k = /* @__PURE__ */ new Map(), A = S;
	if (p.run.type === "shape" && p.run.anchorAcquisitionInput.group === null) {
		let t = Qg(i.source, p.runIndex), n = C ? R_(S, C) : S, r = $_(p.run, n, {
			id: `${i.id}:anchor-textbox:${e}:${p.runIndex}`,
			source: t,
			flowDomainId: i.flowDomainId,
			context: i.context,
			measurer: i.measurer,
			environment: w,
			input: p.run.textBoxInput,
			acquireCompleteStory: i.acquireCompleteStory,
			...C ? { coordinateSpace: "upright-physical" } : {}
		});
		r && (k.set(p.runIndex, r), A = C ? z_(r.flowBounds, C) : r.flowBounds);
	}
	let j = V_(x, A);
	if (g.allowOverlapStatus !== "valid" || g.allowOverlap === null || g.layoutInCellStatus !== "valid" || g.layoutInCell === null) throw Error("resolved anchor frame must retain overlap and cell behavior");
	let M = j.geometry.wrapBounds, N = !g.allowOverlap, ee = g.allowOverlap && i.ordinaryFlow && M !== null;
	if (N || ee) {
		let t = U_(j, "vertical", g.layoutInCell && i.anchorCellBounds !== void 0), n = l.filter((e) => !Zh(t, g.relativeHeight, e.relativeHeight)), r = (N ? [...c, ...n].filter((t) => t.occurrenceId !== e).map((e) => ({
			occurrenceId: e.occurrenceId,
			bounds: e.bounds
		})) : o.filter((t) => t.anchorOccurrenceId !== e).map((e) => ({
			occurrenceId: e.anchorOccurrenceId ?? e.id,
			bounds: e.bounds
		}))).map((e) => ({
			occurrenceId: e.occurrenceId,
			kind: "drawingml",
			paragraphId: 0,
			bounds: e.bounds,
			exclusionBounds: e.bounds
		})), a = i.anchorFrames?.page, s = N && g.layoutInCell && i.anchorCellBounds ? i.anchorCellBounds.xPt + i.anchorCellBounds.widthPt : a ? a.xPt + a.widthPt : Infinity, u = Qa({
			moving: {
				occurrenceId: e,
				kind: "drawingml",
				paragraphId: 1,
				bounds: A,
				exclusionBounds: M ?? A
			},
			blockers: r,
			avoidance: N ? { kind: "drawingml-normative" } : {
				kind: "word-different-paragraph",
				paragraphId: 1
			},
			rightBoundaryPt: s
		}).displacement;
		if (u.xPt !== 0 || u.yPt !== 0) {
			if (A = X(A, u), C) C = {
				...C,
				e: C.e + u.xPt,
				f: C.f + u.yPt
			};
			else {
				let e = k.get(p.runIndex);
				e && k.set(p.runIndex, tm(e, u));
			}
			j = V_(x, A);
		}
	}
	for (let { run: t, runIndex: n } of f) {
		let r = Qg(i.source, n), a = t.anchorAcquisitionInput, o = H_(a, A, b), s = C ? R_(o, C) : o;
		if (t.type === "image") T.push({
			kind: "resource",
			resourceKind: "image",
			resourceKey: tt(r, t.imagePath),
			rect: s
		});
		else if (t.type === "chart") T.push({
			kind: "resource",
			resourceKind: "chart",
			resourceKey: e_(r),
			rect: s
		});
		else if (t.type === "unavailableDrawing") T.push({ kind: "noop" }), E.push(n_(t.resourceKind, r));
		else {
			let o = a.group?.resolvedChildFrame, c = jh(o ? {
				...t,
				rotation: o.rotationDeg,
				flipH: o.flipH,
				flipV: o.flipV
			} : t, s, i.environment.layoutServices?.text, t.vmlTextPathInput, t.fill?.fillType === "image" ? tt(r, t.fill.imagePath) : void 0);
			T.push(c.command), E.push(...$g(c, r));
			let l = `${i.id}:anchor-textbox:${e}:${n}`, u = k.get(n) ?? $_(t, s, {
				id: l,
				source: r,
				flowDomainId: i.flowDomainId,
				context: i.context,
				measurer: i.measurer,
				environment: w,
				input: t.textBoxInput,
				acquireCompleteStory: i.acquireCompleteStory,
				...C ? { coordinateSpace: "upright-physical" } : {}
			});
			u && (D.push(u), O.push(l));
		}
	}
	let te = {
		kind: "drawing",
		id: `${i.id}:anchor-drawing:${e}`,
		source: Qg(i.source, p.runIndex),
		flowDomainId: i.flowDomainId,
		flowBounds: A,
		inkBounds: j.geometry.inkBounds,
		advancePt: 0,
		ordinaryFlow: !1,
		...C ? {
			orientation: "upright-physical",
			transform: C
		} : {},
		commands: T,
		...E.length === 0 ? {} : { diagnostics: Object.freeze(E) },
		anchorLayer: {
			occurrenceId: e,
			behindDoc: g.behindDoc,
			relativeHeight: g.relativeHeight,
			sourceOrder: p.runIndex,
			horizontalOwnership: U_(j, "horizontal", g.layoutInCell && i.anchorCellBounds !== void 0),
			verticalOwnership: U_(j, "vertical", g.layoutInCell && i.anchorCellBounds !== void 0),
			...g.layoutInCell && Kh(g.allowOverlap, j.geometry.wrap.kind) && i.anchorCellBounds ? { cellContainment: !0 } : {}
		},
		...O.length ? { textBoxIds: O } : {}
	}, P = j.geometry.wrapBounds, ne = P && j.geometry.wrap.kind !== "none" ? {
		id: `${i.id}:anchor-exclusion:${e}`,
		wrap: j.geometry.wrap.kind,
		...j.geometry.wrap.side ? { wrapSide: j.geometry.wrap.side } : {},
		bounds: P,
		polygon: j.geometry.wrap.polygon?.points ?? F_(P),
		anchorOccurrenceId: e,
		verticalOwnership: U_(j, "vertical", g.layoutInCell && i.anchorCellBounds !== void 0)
	} : void 0, re = {
		occurrenceId: e,
		bounds: A,
		horizontalOwnership: U_(j, "horizontal", g.layoutInCell && i.anchorCellBounds !== void 0),
		verticalOwnership: U_(j, "vertical", g.layoutInCell && i.anchorCellBounds !== void 0),
		...g.relativeHeight === null ? {} : { relativeHeight: g.relativeHeight }
	};
	return {
		result: j,
		drawing: te,
		exclusion: ne,
		collision: re,
		textBoxes: D,
		...g.layoutInCell && Kh(g.allowOverlap, j.geometry.wrap.kind) && i.anchorCellBounds ? { cellContainmentBounds: A } : {},
		hostLineIndex: u,
		hostRange: d.range
	};
}
function G_(e, t) {
	let n = t.bidi === !0, r = t.runs.some((e) => e.type === "text" && !!e.ruby), i = t.runs.some((e) => e.type === "text" && ji.test(e.text));
	return {
		...e,
		rightIndentGrid: {
			...e.rightIndentGrid,
			paragraphAllowsAdjustment: t.adjustRightInd !== !1
		},
		physicalIndentLeftPt: n ? t.indentRight : t.indentLeft,
		physicalIndentRightPt: n ? t.indentLeft : t.indentRight,
		firstIndentPt: t.indentFirst,
		lineSpacing: t.lineSpacing,
		spaceBeforePt: t.spaceBefore,
		spaceAfterPt: t.spaceAfter,
		baseRtl: n,
		isJustified: el(t.alignment),
		stretchLastLine: tl(t.alignment),
		tabStops: cu(t),
		hasRuby: r,
		hasEastAsianText: i
	};
}
function K_(e) {
	return e === "vert" || e === "vert270" || e === "eaVert" || e === "mongolianVert" ? e : void 0;
}
function q_(e, t, n) {
	let r = Math.max(0, t - n);
	return e === "b" ? r : e === "ctr" ? r / 2 : 0;
}
function J_(e, t, n, r) {
	let i = t === "eaVert" || t === "mongolianVert", a = e.lines.map((e) => {
		let a = t === "mongolianVert" ? e.placements.reduce((t, n) => n.kind === "text" && n.ruby ? Math.max(t, e.baselinePt - Math.min(e.baselinePt, ...n.ruby.paintOps.map((e) => e.origin.yPt))) : t, 0) : 0, o = (t === "mongolianVert" ? 2 * n.yPt + n.heightPt - e.baselinePt + r.bottomPt - r.leftPt + a : e.baselinePt) - e.baselinePt, s = e.bounds.yPt + o, c = e.placements.map((e) => {
			if (e.kind !== "text") return "bounds" in e && e.bounds ? {
				...e,
				bounds: {
					...e.bounds,
					yPt: e.bounds.yPt + o
				}
			} : e;
			let t = i ? e.clusters.map((t) => {
				let n = e.text.slice(t.range.start - e.range.start, t.range.end - e.range.start), r = e.paintOps.find((e) => e.range.start <= t.range.start && e.range.end >= t.range.end) ?? e.paintOps[0], i = ji.test(n);
				return {
					...r,
					text: n,
					range: t.range,
					offset: i ? {
						xPt: t.offset.xPt + t.advancePt / 2,
						yPt: t.offset.yPt
					} : t.offset,
					glyphOrientation: i ? "upright" : "sideways"
				};
			}) : e.paintOps;
			return bv({
				...e,
				paintOps: t
			}, o);
		});
		return {
			...e,
			bounds: {
				...e.bounds,
				yPt: s
			},
			baselinePt: e.baselinePt + o,
			placements: c
		};
	});
	return {
		...e,
		lines: a
	};
}
function Y_(e, t) {
	let n = (e, n) => e.kind === "paragraph" ? J_(e, t === "mongolianVert" ? "eaVert" : t, n, {
		topPt: 0,
		rightPt: 0,
		bottomPt: 0,
		leftPt: 0
	}) : Y_(e, t), r = {
		...e,
		rows: e.rows.map((e) => ({
			...e,
			cells: e.cells.map((e) => ({
				...e,
				blocks: e.blocks.map((t) => ({
					...t,
					layout: n(t.layout, e.contentBounds)
				}))
			}))
		}))
	}, i = /* @__PURE__ */ new Map(), a = (e) => {
		let n = i.get(e);
		if (n) return n;
		let r = {
			...e,
			child: Y_(e.child, t)
		};
		return i.set(e, r), r;
	}, o = e.floatingTables?.map(a), s = e.resolvedFloatingTables?.map((e) => {
		let t = a(e.source);
		return {
			...e,
			source: t,
			child: t.child
		};
	});
	return {
		...r,
		...o ? { floatingTables: o } : {},
		...s ? { resolvedFloatingTables: s } : {}
	};
}
function X_(e, t, n, r) {
	return {
		...e,
		blocks: e.blocks.map((e) => {
			if (e.kind === "paragraph") return J_(e, t, n, r);
			if (e.kind === "table") return Y_(e, t);
			throw Error(`Text-box story contains unsupported retained node: ${e.kind}`);
		})
	};
}
function Z_(e, t, n = !0) {
	if (t === 0) return e;
	let r = {
		xPt: 0,
		yPt: t
	};
	return {
		...e,
		flowBounds: X(e.flowBounds, r),
		inkBounds: X(e.inkBounds, r),
		...e.clipBounds ? { clipBounds: n ? X(e.clipBounds, r) : e.clipBounds } : {},
		blocks: e.blocks.map((e) => {
			if (e.kind === "paragraph") return $p(e, r);
			if (e.kind === "table") return Q_(e, r);
			throw Error(`Text-box story contains unsupported retained node: ${e.kind}`);
		})
	};
}
function Q_(e, t) {
	let n = im(e, t), r = /* @__PURE__ */ new Map(), i = (e) => {
		let n = r.get(e);
		if (n) return n;
		let i = {
			...e,
			anchorBounds: X(e.anchorBounds, t),
			...e.columnBounds ? { columnBounds: X(e.columnBounds, t) } : {},
			child: Q_(e.child, t)
		};
		return r.set(e, i), i;
	}, a = e.floatingTables?.map(i), o = e.resolvedFloatingTables?.map((e) => {
		let n = i(e.source);
		return {
			...e,
			xPt: e.xPt + t.xPt,
			yPt: e.yPt + t.yPt,
			bounds: X(e.bounds, t),
			exclusionBounds: X(e.exclusionBounds, t),
			source: n,
			child: n.child
		};
	});
	return {
		...n,
		...a ? { floatingTables: a } : {},
		...o ? { resolvedFloatingTables: o } : {}
	};
}
function $_(e, t, n) {
	let r = n.source, i = n.input ?? {
		kind: "compatibility",
		source: {
			story: "textbox",
			storyInstance: `${r.story}:${r.storyInstance}:${r.path.join(".")}`,
			path: []
		},
		paragraphs: Nh(e, {
			story: "textbox",
			storyInstance: `${r.story}:${r.storyInstance}:${r.path.join(".")}`,
			path: []
		})
	}, a = i.source, o = i.kind === "complete" ? i.blockCount : i.paragraphs.length;
	if (o === 0) return;
	let s = K_(e.textVert), c = s ? {
		xPt: -t.heightPt / 2,
		yPt: -t.widthPt / 2,
		widthPt: t.heightPt,
		heightPt: t.widthPt
	} : t, l = i.kind === "compatibility" ? i.paragraphs : Object.freeze([]), u = {
		topPt: e.textInsetT ?? 0,
		rightPt: e.textInsetR ?? 0,
		bottomPt: e.textInsetB ?? 0,
		leftPt: e.textInsetL ?? 0
	}, d = {
		xPt: c.xPt + u.leftPt,
		yPt: c.yPt + u.topPt,
		widthPt: Math.max(0, c.widthPt - u.leftPt - u.rightPt),
		heightPt: Math.max(0, c.heightPt - u.topPt - u.bottomPt)
	}, f;
	if (i.kind === "complete") {
		if (!n.acquireCompleteStory) throw Error("Complete text-box content requires the shared story acquisition adapter");
		f = n.acquireCompleteStory({
			source: a,
			container: {
				id: `${n.id}:story`,
				kind: "textbox",
				bounds: d,
				capacity: "unbounded"
			},
			coordinateSpace: n.coordinateSpace ?? "section-logical"
		});
	}
	let p = c.yPt + u.topPt, m = null, h = l.map((t, r) => {
		let i = t.runs.map((t) => Pi({
			text: t.text,
			fontSizePt: t.fontSizePt,
			color: t.color?.slice(1) ?? null,
			fontFamily: t.fontFamily ?? null,
			fontFamilyEastAsia: t.fontFamilyEastAsia ?? null,
			bold: t.bold,
			italic: t.italic,
			ruby: t.ruby
		}, e.textVert)), a = Math.max(0, c.widthPt - u.leftPt - u.rightPt - t.indentLeftPt - t.indentRightPt - Math.max(0, t.indentFirstPt)), o = s ? t.image?.heightPt ?? 0 : t.image?.widthPt ?? 0, l = s ? t.image?.widthPt ?? 0 : t.image?.heightPt ?? 0, f = o > a && o > 0 ? a / o : 1, h = t.image ? [{
			type: "image",
			imagePath: t.image.imagePath,
			mimeType: t.image.mimeType,
			...t.image.svgImagePath ? { svgImagePath: t.image.svgImagePath } : {},
			widthPt: o > 0 ? o * f : a,
			heightPt: l > 0 ? l * f : a,
			anchor: !1
		}] : i, g = {
			alignment: t.alignment,
			indentLeft: t.indentLeftPt,
			indentRight: t.indentRightPt,
			indentFirst: t.indentFirstPt,
			spaceBefore: t.spacing.beforePt,
			spaceAfter: t.spacing.afterPt,
			lineSpacing: t.lineSpacing,
			numbering: t.numbering ?? null,
			numberingMarkerShapeInput: t.numberingMarkerShapeInput,
			tabStops: [...t.tabStops],
			bidi: t.bidi,
			contextualSpacing: t.contextualSpacing,
			styleId: t.styleId,
			runs: h
		}, _ = G_(n.context, g), v = vg(m, t, m?.spacing.afterPt ?? 0, t.spacing.beforePt);
		p += v;
		let y = dv(g, {
			id: `${n.id}:paragraph:${r}`,
			source: t.source,
			flowDomainId: `${n.flowDomainId}:textbox`,
			ordinaryFlow: !0,
			context: _,
			placement: {
				startYPt: p,
				paragraphXPt: c.xPt + u.leftPt,
				availableWidthPt: Math.max(0, c.widthPt - u.leftPt - u.rightPt),
				maximumYPt: c.yPt + c.heightPt - u.bottomPt,
				suppressSpaceBefore: !0
			},
			measurer: n.measurer,
			environment: n.environment,
			exclusions: []
		});
		return p += y.advancePt - y.spacing.afterPt, m = t, s ? J_(y, s, d, u) : y;
	}), g = f ? Math.max(0, f.advancePt + u.topPt + u.bottomPt) : Math.max(0, p - c.yPt + u.bottomPt), _ = e.textAutofit === "sp" && o > 0 && (!s || l.every((e) => e.image === void 0)) && Number.isFinite(g) && g > 0 ? s ? {
		...t,
		widthPt: g
	} : {
		...t,
		heightPt: g
	} : t, v = s ? {
		xPt: -_.heightPt / 2,
		yPt: -_.widthPt / 2,
		widthPt: _.heightPt,
		heightPt: _.widthPt
	} : _;
	if (s && _.widthPt !== t.widthPt && s !== "mongolianVert") {
		let e = v.yPt - c.yPt;
		h = h.map((t) => Sv(t, e));
	}
	let y = {
		xPt: v.xPt + u.leftPt,
		yPt: v.yPt + u.topPt,
		widthPt: Math.max(0, v.widthPt - u.leftPt - u.rightPt),
		heightPt: Math.max(0, v.heightPt - u.topPt - u.bottomPt)
	}, b = td(h.map((e) => e.flowBounds)) ?? {
		xPt: y.xPt,
		yPt: y.yPt,
		widthPt: 0,
		heightPt: 0
	}, x = td(h.map((e) => e.inkBounds)) ?? {
		xPt: y.xPt,
		yPt: y.yPt,
		widthPt: 0,
		heightPt: 0
	}, S = f ?? {
		story: "textbox",
		flowBounds: b,
		inkBounds: x,
		clipBounds: y,
		blocks: h,
		advancePt: Math.max(0, g - u.topPt - u.bottomPt),
		diagnostics: []
	}, C = Jh(S);
	return f && s && (S = X_(Z_(S, v.yPt - c.yPt), s, y, u)), S = Z_(S, q_(e.textAnchor, y.heightPt, C), !1), Pn({
		kind: "textbox",
		id: n.id,
		source: l[0]?.source ?? a,
		flowDomainId: `${n.flowDomainId}:textbox`,
		flowBounds: _,
		inkBounds: _,
		...e.defaultTextColor ? { defaultTextColor: `#${e.defaultTextColor.replace(/^#/u, "")}` } : {},
		...e.textAutofit === "none" ? { clipBounds: y } : {},
		advancePt: 0,
		ordinaryFlow: !1,
		story: S,
		transform: s ? {
			a: 0,
			b: s === "vert270" ? -1 : 1,
			c: s === "vert270" ? 1 : -1,
			d: 0,
			e: _.xPt + _.widthPt / 2,
			f: _.yPt + _.heightPt / 2
		} : {
			a: 1,
			b: 0,
			c: 0,
			d: 1,
			e: 0,
			f: 0
		},
		writingMode: e.textVert === "vert270" ? "vertical-lr" : e.textVert ? "vertical-rl" : "horizontal-tb",
		insets: u,
		contentBounds: v,
		...s ? { verticalMode: s } : {}
	});
}
var ev = class extends V {
	reason;
	states;
	occurrenceCapacity;
	constructor(e, t, n) {
		super("NON_CONVERGENCE", `parser-owned paragraph anchor reflow did not converge (${e}; ${n} occurrences; ${t.length} states)`), this.name = "ParagraphAnchorReflowNonConvergenceError", this.reason = e, this.states = Object.freeze([...t]), this.occurrenceCapacity = n;
	}
};
function tv(e, t) {
	if (t.length === 0) return e.placement;
	if (e.placement.wrap) throw Error("Conflicting paragraph wrap authorities: placement.wrap and effective exclusions");
	let n = e.anchorFrames?.page, r = nl(t.map((e, t) => ({
		kind: "shape",
		mode: e.wrap === "topAndBottom" ? "topAndBottom" : "square",
		authoredWrap: e.wrap,
		wrapPolygon: e.polygon,
		imageKey: e.id,
		imageX: e.bounds.xPt,
		imageY: e.bounds.yPt,
		imageW: e.bounds.widthPt,
		imageH: e.bounds.heightPt,
		xLeft: e.bounds.xPt,
		xRight: e.bounds.xPt + e.bounds.widthPt,
		yTop: e.bounds.yPt,
		yBottom: e.bounds.yPt + e.bounds.heightPt,
		side: e.wrapSide ?? "bothSides",
		distLeft: 0,
		distRight: 0,
		distTop: 0,
		distBottom: 0,
		paraId: t
	})), {
		xLeftPt: n?.xPt ?? e.placement.paragraphXPt,
		xRightPt: n ? n.xPt + n.widthPt : e.placement.paragraphXPt + e.placement.availableWidthPt,
		readingDirection: e.context.baseRtl ? "rtl" : "ltr"
	});
	return {
		...e.placement,
		wrap: r
	};
}
function nv(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e.exclusions) {
		let e = r.anchorOccurrenceId;
		if (!(!e || !t.has(e))) {
			if (n.has(e)) throw Error(`Paragraph anchor occurrence produced duplicate exclusions: ${e}`);
			n.set(e, r);
		}
	}
	return Object.freeze([...n.values()]);
}
function rv(e) {
	return it("paragraph-effective-wrap-exclusions", e.map((e) => ({
		id: e.id,
		...e.anchorOccurrenceId === void 0 ? {} : { occurrenceId: e.anchorOccurrenceId },
		wrap: e.wrap,
		...e.wrapSide === void 0 ? {} : { wrapSide: e.wrapSide },
		bounds: e.bounds,
		polygon: e.polygon,
		...e.verticalOwnership === void 0 ? {} : { verticalOwnership: e.verticalOwnership }
	})));
}
function iv(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		let e = n.anchorOccurrenceId;
		if (e) {
			if (t.has(e)) throw Error(`Duplicate external paragraph exclusion occurrence: ${e}`);
			t.add(e);
		}
	}
	return t;
}
function av(e, t) {
	let n = iv(e);
	return Object.freeze([...e, ...t.filter((e) => !e.anchorOccurrenceId || !n.has(e.anchorOccurrenceId))]);
}
function ov(e, t) {
	let n = /* @__PURE__ */ new Set();
	for (let t of e) {
		if (n.has(t.occurrenceId)) throw Error(`Duplicate external anchor collision occurrence: ${t.occurrenceId}`);
		n.add(t.occurrenceId);
	}
	return Object.freeze([...e, ...t.filter((e) => !n.has(e.occurrenceId))]);
}
function sv(e, t, n, r) {
	let i = n.environment.layoutServices, a = n.environment.verticalGlyphMeasurement, o = n.anchorFrames, s = t.runs.some(P_), c = t.runs.some((e) => e.type === "shape" && e.textBoxInput?.kind === "complete"), { wrap: l, ...u } = n.placement, d = n.context, f = n.environment;
	return `paragraph-acquisition-v1:${JSON.stringify([
		n.id,
		[
			n.source.story,
			n.source.storyInstance,
			n.source.path
		],
		n.flowDomainId,
		n.ordinaryFlow,
		[
			u.startYPt,
			u.paragraphXPt,
			u.availableWidthPt,
			u.maximumYPt,
			u.suppressSpaceBefore,
			l ? e.objectIdentity(l) : null
		],
		[
			d.lineGrid.active,
			d.lineGrid.pitchPt,
			d.characterGrid.active,
			d.characterGrid.kind,
			d.characterGrid.deltaPt,
			d.rightIndentGrid.pitchPt,
			d.rightIndentGrid.paragraphAllowsAdjustment,
			d.physicalIndentLeftPt,
			d.physicalIndentRightPt,
			d.firstIndentPt,
			d.lineSpacing ? [
				d.lineSpacing.value,
				d.lineSpacing.rule,
				d.lineSpacing.explicit ?? null
			] : null,
			d.spaceBeforePt,
			d.spaceAfterPt,
			d.baseRtl,
			d.isJustified,
			d.stretchLastLine,
			d.tabStops.map((e) => [
				e.pos,
				e.alignment,
				e.leader
			]),
			d.hasRuby,
			d.hasEastAsianText,
			[
				d.kinsoku.enabled,
				[...d.kinsoku.lineStartForbidden].sort((e, t) => e - t),
				[...d.kinsoku.lineEndForbidden].sort((e, t) => e - t)
			],
			d.defaultTabPt,
			d.overflowPunct !== !1,
			d.numberingMarkerGeometry ? JSON.stringify(d.numberingMarkerGeometry) : null,
			d.mathDefJc ?? null
		],
		[e.objectIdentity(n.measurer.context), e.objectIdentity(n.measurer.fontFamilyClasses)],
		[
			f.pageIndex,
			f.totalPages,
			f.displayPageNumber ?? null,
			f.pageNumberFormat ?? null,
			f.currentDateMs ?? null,
			f.noteNumbers ? [...f.noteNumbers.entries()].sort(([e], [t]) => e.localeCompare(t)) : null,
			f.noteReferenceNumber ?? null,
			f.pageWritingMode,
			f.verticalCJK ?? null,
			f.verticalPageFrame ?? null,
			f.documentHasEastAsianText,
			f.useFeLayout ?? null,
			f.balanceSingleByteDoubleByteWidth ?? null,
			f.characterSpacingControl ?? null,
			f.resolvedLocalFonts ? e.objectIdentity(f.resolvedLocalFonts) : null,
			i?.text.fingerprint ?? null,
			i?.images.fingerprint ?? null,
			i?.math.fingerprint ?? null,
			i?.verticalGlyphFingerprint ?? null,
			a?.fingerprint ?? null
		],
		JSON.stringify(n.exclusions),
		s ? JSON.stringify(n.anchorCollisions ?? []) : null,
		r ? JSON.stringify(r) : null,
		n.paragraphBorderEdges ? [n.paragraphBorderEdges.top, n.paragraphBorderEdges.bottom] : null,
		n.trailingExtentPt ?? null,
		n.containerShading ?? null,
		n.continuesFromPrevious ?? null,
		n.sourceRangeStart ?? null,
		o ? [
			o.page ? [
				o.page.xPt,
				o.page.yPt,
				o.page.widthPt,
				o.page.heightPt
			] : null,
			o.margin ? [
				o.margin.xPt,
				o.margin.yPt,
				o.margin.widthPt,
				o.margin.heightPt
			] : null,
			o.column ? [
				o.column.xPt,
				o.column.yPt,
				o.column.widthPt,
				o.column.heightPt
			] : null,
			o.pageParity
		] : null,
		s ? JSON.stringify(n.anchorCellBounds ?? null) : null,
		c && n.acquireCompleteStory ? e.objectIdentity(n.acquireCompleteStory) : null
	])}`;
}
function cv(e) {
	let t = e.src ? Object.freeze({ ...e.src }) : void 0;
	return "text" in e ? Object.freeze({
		...e,
		...t ? { src: t } : {},
		...e.shapedClusters ? { shapedClusters: Object.freeze(e.shapedClusters.map((e) => Object.freeze({
			...e,
			range: Object.freeze({ ...e.range })
		}))) } : {},
		...e.selectedFaceInkBounds ? { selectedFaceInkBounds: Object.freeze({ ...e.selectedFaceInkBounds }) } : {},
		...e.selectedFaceFontBox ? { selectedFaceFontBox: Object.freeze({ ...e.selectedFaceFontBox }) } : {},
		...e.ruby ? { ruby: Object.freeze({ ...e.ruby }) } : {},
		...e.border ? { border: Object.freeze({ ...e.border }) } : {},
		...e.revision ? { revision: Object.freeze({ ...e.revision }) } : {},
		...e.hyperlink ? { hyperlink: Object.freeze({ ...e.hyperlink }) } : {},
		...e.seaBreaks ? { seaBreaks: Object.freeze([...e.seaBreaks]) } : {}
	}) : "imagePath" in e ? Object.freeze({
		...e,
		...t ? { src: t } : {},
		...e.srcRect ? { srcRect: Object.freeze({ ...e.srcRect }) } : {},
		...e.duotone ? { duotone: Object.freeze({ ...e.duotone }) } : {}
	}) : "isTab" in e ? Object.freeze({
		...e,
		...t ? { src: t } : {},
		...e.ptab ? { ptab: Object.freeze({ ...e.ptab }) } : {}
	}) : Object.freeze({
		...e,
		...t ? { src: t } : {}
	});
}
function lv(e) {
	return Object.freeze({
		...e,
		layout: Object.freeze({
			...e.layout,
			segments: Object.freeze(e.layout.segments.map(cv)),
			...e.layout.consumedEnd ? { consumedEnd: Object.freeze({ ...e.layout.consumedEnd }) } : {}
		})
	});
}
function uv(e, t, n) {
	let r = t.environment.layoutServices ? Ar(t.environment.layoutServices) : void 0, i = r ? sv(r, e, t, n) : void 0, a = i === void 0 ? void 0 : r.get(e, i);
	if (a) return a;
	let o = iv(t.exclusions), s = new Set(e.runs.flatMap((e) => P_(e) ? [e.anchorAcquisitionInput.occurrenceId] : []));
	for (let e of o) s.delete(e);
	let c = s.size, l = Object.freeze([]), u = av(t.exclusions, l);
	try {
		let a = zo({
			seedState: rv(u),
			step: (r) => {
				let i = av(t.exclusions, r?.ownedExclusions ?? l), a = ol(e, t.context, tv(t, i), t.measurer, {
					...t.environment,
					paragraphMarkShapeInput: e.paragraphMarkShapeInput
				}, n), o = gv(e, t, a), c = nv(o, s), u = rv(av(t.exclusions, c));
				if (rv(o.exclusions) !== u) throw Error("Paragraph retained exclusions differ from the measured exclusion authority");
				return Object.freeze({
					measured: a,
					layout: o,
					ownedExclusions: c,
					state: u
				});
			},
			stateOf: (e) => e.state,
			limit: 16
		}).value, o = Object.freeze({
			...a.measured,
			lines: Object.freeze(a.measured.lines.map(lv)),
			placement: Object.freeze({ ...a.measured.placement })
		}), c = Object.freeze({
			measured: o,
			layout: a.layout
		});
		return i !== void 0 && r.set(e, i, c), c;
	} catch (e) {
		throw e instanceof Ro ? new ev(e.reason, e.states, c) : e;
	}
}
function dv(e, t) {
	return uv(e, t).layout;
}
function fv(e) {
	let t = 0;
	for (let n of e.members) for (let e of n.fragment.lines) for (let n of e.placements) n.kind === "text" && (t = Math.max(t, -(n.positionPt ?? 0)));
	return t;
}
var pv = /* @__PURE__ */ new WeakMap();
function mv(e) {
	return e === void 0 ? null : e instanceof Date ? { date: e.toISOString() } : e instanceof Set ? { set: [...e].map(mv).sort((e, t) => JSON.stringify(e).localeCompare(JSON.stringify(t))) } : e instanceof Map ? { map: [...e.entries()].map(([e, t]) => [mv(e), mv(t)]).sort((e, t) => JSON.stringify(e[0]).localeCompare(JSON.stringify(t[0]))) } : Array.isArray(e) ? e.map(mv) : e && typeof e == "object" ? Object.fromEntries(Object.entries(e).map(([e, t]) => [e, mv(t)])) : e;
}
function hv(e, t) {
	if (t.contexts.length !== e.members.length || t.inputs.length !== e.members.length || t.borderEdges.length !== e.members.length || t.borderExtentsPt.length !== e.members.length) throw Error("Frame acquisition metadata must align with every group member");
	if (!Number.isFinite(t.maximumWidthPt) || t.maximumWidthPt < 0) throw RangeError("Frame maximumWidthPt must be finite and non-negative");
	let n = pv.get(t.acquisitionSession);
	n || (n = /* @__PURE__ */ new Map(), pv.set(t.acquisitionSession, n));
	let r = it("w:frame-acquisition", [
		e.id,
		t.placementSignature,
		t.maximumWidthPt,
		t.environment.pageIndex,
		t.environment.totalPages,
		t.environment.displayPageNumber ?? null,
		t.environment.pageNumberFormat ?? null,
		t.environment.currentDateMs ?? null,
		t.environment.documentHasEastAsianText,
		t.environment.layoutServices?.text.fingerprint ?? null,
		t.environment.layoutServices?.images.fingerprint ?? null,
		t.environment.layoutServices?.math.fingerprint ?? null,
		t.environment.layoutServices?.verticalGlyphFingerprint ?? null,
		mv(t.contexts),
		mv(t.inputs),
		mv(t.borderEdges),
		mv(t.borderExtentsPt),
		t.containerShading ?? null,
		mv(t.anchorFrames)
	]), i = n.get(r);
	if (i) return i;
	let a = e.framePr, o = a.w == null ? Math.max(0, ...e.members.map((e, n) => Hl(e, t.contexts[n], t.maximumWidthPt, t.measurer, t.environment, d_(t.inputs[n], t.contexts[n], t)))) : Math.max(0, a.w), s = Math.max(1, o), c = (() => {
		let n = Ag(`body-frame:${e.id}`), r = 0, i = null, a = 0, o = 0, c = [];
		return e.members.forEach((l, u) => {
			let d = t.contexts[u], f = Math.max(vg(i, l, a, d.spaceBeforePt), o), p = {
				startYPt: r + f,
				paragraphXPt: 0,
				availableWidthPt: s,
				maximumYPt: Infinity,
				suppressSpaceBefore: !0
			}, m = t.borderExtentsPt[u] ?? 0, h = {
				story: "body",
				storyInstance: "body",
				path: [e.sourceIndices[u]]
			}, { measured: g, layout: _ } = uv(t.inputs[u], {
				id: `body-frame:${e.id}:${u}`,
				source: h,
				flowDomainId: `body-frame:${e.id}`,
				ordinaryFlow: !1,
				context: d,
				placement: p,
				measurer: t.measurer,
				environment: {
					...t.environment,
					positionExtendsLineBox: Mm(e.framePr.dropCap)
				},
				exclusions: n.exclusions,
				anchorCollisions: n.collisions,
				containerShading: t.containerShading,
				paragraphBorderEdges: t.borderEdges[u],
				trailingExtentPt: Math.max(d.spaceAfterPt, m),
				anchorFrames: t.anchorFrames
			});
			n = Ng(n, _), c.push({
				paragraph: l,
				fragment: _,
				source: h
			}), r = g.contentEndYPt, i = l, a = g.requestedSpaceAfterPt, o = m;
		}), {
			heightPt: Math.max(0, r + Math.max(a, o)),
			members: c
		};
	})(), l = t.place(o, c.heightPt), u = Object.freeze(c.members.map((e) => {
		let t = $p(e.fragment, {
			xPt: l.bounds.xPt,
			yPt: l.bounds.yPt
		}), n = Zg(a.hRule === "exact" && a.h != null ? {
			...t,
			clipBounds: l.bounds
		} : t), r = Object.freeze({
			...n,
			advancePt: 0
		});
		return Object.freeze({
			...e,
			fragment: r
		});
	})), d = Object.freeze({
		box: Object.freeze({
			bounds: l.bounds,
			exclusionBounds: l.exclusionBounds,
			exclusionId: `frame:${e.id}`
		}),
		members: u
	});
	return n.set(r, d), d;
}
function gv(e, t, n) {
	let r = t.continuesFromPrevious ? {
		...t.context,
		firstIndentPt: 0
	} : t.context, i = t.placement.paragraphXPt + r.physicalIndentLeftPt, a = lu(r, t.placement.availableWidthPt), o = t.placement.availableWidthPt - r.physicalIndentLeftPt - r.physicalIndentRightPt - a, s = C_(e, n), c = t.continuesFromPrevious ? void 0 : d_(e, r, t), l = T_(n, e, i, o, t.source, t.id, r, s, c, t.environment.layoutServices?.text, t.environment.verticalGlyphMeasurement, t.environment.verticalPageFrame);
	t.sourceRangeStart !== void 0 && (l = O_(l, t.sourceRangeStart)), l = E_(l, t.placement.paragraphXPt, t.placement.availableWidthPt, r.baseRtl, r.tabStops), c && n.markOnly && l.length === 0 && (c.markerText !== "" || e.numbering?.picBulletImagePath) && (l = [k_(n, e, i, o, r)]);
	let u = [], d = [], f = [], p = [], m = [], h = [], g = [], _ = e.runs.map((e, t) => e.type === "break" ? {
		kind: "break",
		breakKind: e.breakType,
		offset: s.runStarts[t] ?? 0
	} : void 0).filter((e) => e !== void 0), v = /* @__PURE__ */ new Map();
	e.runs.forEach((e, t) => {
		if (!P_(e)) return;
		let n = v.get(e.anchorAcquisitionInput.occurrenceId) ?? [];
		n.push({
			run: e,
			runIndex: t
		}), v.set(e.anchorAcquisitionInput.occurrenceId, n);
	});
	for (let [r, i] of v) {
		let a = W_(r, i, l, e, t, n.contentEndYPt - t.placement.startYPt, t.exclusions, m, t.anchorCollisions ?? [], h);
		a && (p.push(a.result), a.cellContainmentBounds && g.push(a.cellContainmentBounds), a.drawing && (d.push(a.drawing), f.push(...a.textBoxes), a.exclusion && m.push(a.exclusion), a.collision && h.push(a.collision), l[a.hostLineIndex] && (l = l.map((e, t) => t === a.hostLineIndex ? {
			...e,
			placements: [...e.placements, {
				kind: "drawing",
				range: a.hostRange,
				drawingId: a.drawing.id,
				bounds: a.drawing.inkBounds,
				advancePt: 0
			}]
		} : e))));
	}
	if (c && l[0]) {
		let n = p_(c, e, t.context, i, o, l[0]);
		n.length > 0 && (l = [{
			...l[0],
			placements: [...n, ...l[0].placements]
		}, ...l.slice(1)]);
	}
	if (e.runs.forEach((e, n) => {
		let r = Qg(t.source, n);
		if (e.type === "unavailableDrawing" && e.anchorAcquisitionInput === void 0) {
			let i = t_(t.source, n), a = l.flatMap((e) => e.placements).find((e) => e.kind === "drawing" && e.drawingId === i);
			a?.kind === "drawing" && d.push({
				kind: "drawing",
				id: i,
				source: r,
				flowDomainId: t.flowDomainId,
				flowBounds: a.bounds,
				inkBounds: a.bounds,
				advancePt: 0,
				ordinaryFlow: !1,
				commands: Object.freeze([{ kind: "noop" }]),
				diagnostics: Object.freeze([n_(e.resourceKind, r)])
			});
		}
		if (e.type === "image" && u.push({
			kind: "image",
			resourceKey: tt(r, e.imagePath),
			intrinsicSize: {
				widthPt: e.widthPt,
				heightPt: e.heightPt
			}
		}), e.type === "chart" && u.push({
			kind: "chart",
			resourceKey: e_(r),
			intrinsicSize: {
				widthPt: e.widthPt,
				heightPt: e.heightPt
			}
		}), e.type === "math" && u.push({
			kind: "math",
			resourceKey: e.resourceKey ?? it("math-resource", r),
			intrinsicSize: {
				widthPt: l.flatMap((e) => e.placements).find((e) => e.kind === "resource" && e.resourceKind === "math")?.bounds?.widthPt ?? 0,
				heightPt: e.fontSize
			}
		}), (e.type === "image" || e.type === "chart") && !t.continuesFromPrevious) {
			let r = N_(e, t, n);
			if (r) {
				d.push(r);
				let e = l[0];
				e && (l = [{
					...e,
					placements: [...e.placements, {
						kind: "drawing",
						range: {
							start: s.runStarts[n] ?? 0,
							end: (s.runStarts[n] ?? 0) + (s.runLengths[n] ?? 1)
						},
						drawingId: r.id,
						bounds: r.inkBounds,
						advancePt: 0
					}]
				}, ...l.slice(1)]);
			}
		}
		if (e.type === "shape" && !e.anchorAcquisitionInput && !t.continuesFromPrevious) {
			let i = `${t.id}:drawing:${n}`, a = e.inline === !0 ? l.flatMap((e) => e.placements).find((e) => e.kind === "drawing" && e.drawingId === i) : void 0;
			if (e.inline === !0 && !a) throw Error(`Inline shape ${i} has no retained line placement`);
			let o = a?.bounds ?? j_(e, t), c = `${t.id}:textbox:${n}`, u = $_(e, o, {
				id: c,
				source: r,
				flowDomainId: t.flowDomainId,
				context: t.context,
				measurer: t.measurer,
				environment: t.environment,
				input: e.textBoxInput,
				acquireCompleteStory: t.acquireCompleteStory
			}), p = M_(e, e.inline === !0 ? o : u?.flowBounds ?? o, t, n, e.inline === !0);
			u && (f.push(u), p = {
				...p,
				textBoxIds: [c]
			}), d.push(p);
			let m = e.inline === !0 ? void 0 : l[0];
			m && (l = [{
				...m,
				placements: [...m.placements, {
					kind: "drawing",
					range: {
						start: s.runStarts[n] ?? 0,
						end: (s.runStarts[n] ?? 0) + (s.runLengths[n] ?? 1)
					},
					drawingId: p.id,
					bounds: p.inkBounds,
					advancePt: 0
				}]
			}, ...l.slice(1)]);
		}
	}), e.numbering?.picBulletImagePath && !t.continuesFromPrevious && u.push({
		kind: "picture-bullet",
		resourceKey: tt(t.source, e.numbering.picBulletImagePath),
		intrinsicSize: {
			widthPt: e.numbering.picBulletWidthPt ?? e.numberingMarkerShapeInput?.fontSizePt ?? 0,
			heightPt: e.numbering.picBulletHeightPt ?? e.numberingMarkerShapeInput?.fontSizePt ?? 0
		}
	}), e.numbering?.picBulletImagePath && l[0] && !t.continuesFromPrevious) {
		if (!c) throw Error("Picture-bullet acquisition requires resolved marker font geometry");
		let n = e.numbering.picBulletWidthPt ?? c.markerWidthPt, r = e.numbering.picBulletHeightPt ?? e.numberingMarkerShapeInput?.fontSizePt;
		if (r === void 0) throw Error("Picture-bullet acquisition requires resolved marker height");
		let a = cl({
			baseRtl: t.context.baseRtl,
			alignedLeadingEdgePt: f_(c, t.context, i, o, l[0]),
			authoredFirstIndentPt: e.indentFirst,
			markerShiftPt: c.markerShiftPt,
			markerWidthPt: n
		});
		l = [{
			...l[0],
			placements: [{
				kind: "resource",
				resourceKind: "picture-bullet",
				range: {
					start: -1,
					end: 0
				},
				resourceKey: tt(t.source, e.numbering.picBulletImagePath),
				bounds: {
					xPt: a,
					yPt: l[0].baselinePt - r,
					widthPt: n,
					heightPt: r
				},
				advancePt: 0
			}, ...l[0].placements]
		}, ...l.slice(1)];
	}
	l = h_(l, e.shading, t.containerShading);
	let y = n.contentEndYPt - n.contentStartYPt, b = t.paragraphBorderEdges ?? {
		top: "top",
		bottom: "bottom"
	}, x = __(e, l, i, o, n.contentStartYPt, y, b), S = e.borders ? [
		...b.top === "none" ? [] : [[b.top, e.borders[b.top]]],
		["right", e.borders.right],
		...b.bottom === "none" ? [] : [["bottom", e.borders.bottom]],
		["left", e.borders.left]
	] : [], C = e.borders ? S.flatMap(([e, t]) => {
		if (!g_(t)) return [];
		let n = e === "top" || e === "between" || e === "bottom", r = e === "right" || e === "bottom", i = n ? x.yPt + (r ? x.heightPt : 0) : x.xPt + (r ? x.widthPt : 0);
		return [{
			edge: e,
			from: n ? {
				xPt: x.xPt,
				yPt: i
			} : {
				xPt: i,
				yPt: x.yPt
			},
			to: n ? {
				xPt: x.xPt + x.widthPt,
				yPt: i
			} : {
				xPt: i,
				yPt: x.yPt + x.heightPt
			},
			color: t.color ? `#${t.color}` : "#000000",
			widthPt: t.width,
			...ki(t.style, t.width)
		}];
	}) : [], w = t.trailingExtentPt ?? n.requestedSpaceAfterPt, T = td(g);
	return Zg({
		kind: "paragraph",
		id: t.id,
		source: t.source,
		...e.paragraphId === void 0 ? {} : { paragraphId: e.paragraphId },
		flowDomainId: t.flowDomainId,
		ordinaryFlow: t.ordinaryFlow,
		...e.styleId === void 0 ? {} : { styleId: e.styleId },
		...!t.continuesFromPrevious && e.bookmarks?.length ? { bookmarkStarts: e.bookmarks } : {},
		flowBounds: {
			xPt: t.placement.paragraphXPt,
			yPt: t.placement.startYPt,
			widthPt: t.placement.availableWidthPt,
			heightPt: n.contentEndYPt - t.placement.startYPt + w
		},
		inkBounds: { ...e.shading || e.borders ? x : {
			xPt: i,
			yPt: n.contentStartYPt,
			widthPt: Math.max(0, ...l.map((e) => e.bounds.widthPt)),
			heightPt: y
		} },
		spacing: {
			beforePt: t.placement.suppressSpaceBefore ? 0 : n.requestedSpaceBeforePt,
			afterPt: w
		},
		contextualSpacing: e.contextualSpacing ?? !1,
		lines: l,
		borders: C,
		shading: e.shading ? { color: `#${e.shading}` } : void 0,
		resources: u,
		drawings: d,
		textBoxes: f,
		events: _,
		exclusions: av(t.exclusions, m),
		...T ? { cellContainmentBounds: T } : {},
		anchorCollisions: ov(t.anchorCollisions ?? [], h),
		...p.length ? { anchorFrames: p } : {},
		paragraphMark: n.markOnly ? {
			hidden: e.markVanish === !0,
			bounds: {
				xPt: i,
				yPt: n.contentStartYPt,
				widthPt: 0,
				heightPt: y
			}
		} : void 0
	});
}
var _v = (e, t) => Y(e, {
	xPt: 0,
	yPt: t
}), vv = (e, t) => X(e, {
	xPt: 0,
	yPt: t
}), yv = (e, t) => qp(e, {
	xPt: 0,
	yPt: t
}), bv = (e, t) => Yp(e, {
	xPt: 0,
	yPt: t
}), xv = (e, t) => Xp(e, {
	xPt: 0,
	yPt: t
}), Sv = (e, t) => $p(e, {
	xPt: 0,
	yPt: t
}), Cv = (e, t) => tm(e, {
	xPt: 0,
	yPt: t
});
function wv(e, t, n, r) {
	if (!e.shading && e.borders.length === 0) return null;
	let i = t[0], a = t.at(-1);
	if (!i || !a) return {
		box: vv(e.inkBounds, n),
		borders: []
	};
	let o = e.inkBounds.yPt, s = o + e.inkBounds.heightPt, c = r.continuesFromPrevious ? Math.max(o, i.bounds.yPt) : o, l = r.continuesOnNext ? Math.min(s, a.bounds.yPt + a.advancePt) : s, u = {
		xPt: e.inkBounds.xPt,
		yPt: c + n,
		widthPt: e.inkBounds.widthPt,
		heightPt: Math.max(0, l - c)
	}, d = u.xPt, f = d + u.widthPt, p = u.yPt, m = p + u.heightPt;
	return {
		box: u,
		borders: e.borders.flatMap((e) => (e.edge === "top" || e.edge === "between") && r.continuesFromPrevious || e.edge === "bottom" && r.continuesOnNext ? [] : e.edge === "top" || e.edge === "between" ? [{
			...e,
			from: {
				xPt: d,
				yPt: p
			},
			to: {
				xPt: f,
				yPt: p
			}
		}] : e.edge === "bottom" ? [{
			...e,
			from: {
				xPt: d,
				yPt: m
			},
			to: {
				xPt: f,
				yPt: m
			}
		}] : e.edge === "left" ? [{
			...e,
			from: {
				xPt: d,
				yPt: p
			},
			to: {
				xPt: d,
				yPt: m
			}
		}] : e.edge === "right" ? [{
			...e,
			from: {
				xPt: f,
				yPt: p
			},
			to: {
				xPt: f,
				yPt: m
			}
		}] : [{
			...e,
			from: _v(e.from, n),
			to: _v(e.to, n)
		}])
	};
}
function Tv(e, t, n = `${e.id}:${t.lineStart}-${t.lineEnd}`) {
	let r = e.lines.slice(t.lineStart, t.lineEnd), i = r[0], a = r.at(-1), o = t.continuesFromPrevious && i ? e.flowBounds.yPt - i.bounds.yPt : 0, s = o === 0 ? r : r.map((e) => xv(e, o)), c = s[0], l = s.at(-1), u = e.lines.map((e, n) => n >= t.lineStart && n < t.lineEnd ? s[n - t.lineStart] : e), d = c && l ? {
		xPt: Math.min(...s.map((e) => e.bounds.xPt)),
		yPt: c.bounds.yPt,
		widthPt: Math.max(...s.map((e) => e.bounds.xPt + e.bounds.widthPt)) - Math.min(...s.map((e) => e.bounds.xPt)),
		heightPt: l.bounds.yPt + l.bounds.heightPt - c.bounds.yPt
	} : e.inkBounds, f = wv(e, r, o, t), p = new Set(r.flatMap((e) => e.placements.flatMap((e) => e.kind === "drawing" ? [e.drawingId] : []))), m = e.drawings.filter((e) => p.has(e.id)).map((e) => e.anchorLayer?.verticalOwnership === "page" ? e : yv(e, o)), h = td(m.filter((e) => e.anchorLayer?.cellContainment === !0).map((e) => e.flowBounds)), g = new Set(e.drawings.flatMap((e) => {
		if (e.anchorLayer?.verticalOwnership !== "host") return [];
		let t = e.anchorLayer.acquisitionOccurrenceId ?? e.anchorLayer.occurrenceId;
		return t === void 0 ? [] : [t];
	})), _ = new Set(m.flatMap((e) => {
		if (e.anchorLayer?.verticalOwnership !== "host") return [];
		let t = e.anchorLayer.acquisitionOccurrenceId ?? e.anchorLayer.occurrenceId;
		return t === void 0 ? [] : [t];
	})), v = new Set(r.flatMap((e) => e.placements.flatMap((e) => e.kind === "resource" ? [e.resourceKey] : [])));
	for (let e of m) for (let t of e.commands) t.kind === "resource" && v.add(t.resourceKey);
	let y = new Set(m.flatMap((e) => [e.id.replace(":drawing:", ":textbox:"), ...e.textBoxIds ?? []])), b = new Set(m.filter((e) => e.anchorLayer?.verticalOwnership === "page" || e.orientation === "upright-physical").flatMap((e) => e.textBoxIds ?? [])), x = new Set(m.map((e) => it("source-occurrence", e.source))), S = i?.range.start, C = a?.range.end, { bookmarkStarts: w, ...T } = e;
	return Zg({
		...T,
		kind: "paragraph",
		id: n,
		...!t.continuesFromPrevious && w?.length ? { bookmarkStarts: w } : {},
		lines: u,
		flowBounds: {
			...e.flowBounds,
			yPt: e.flowBounds.yPt
		},
		...e.clipBounds ? { clipBounds: vv(e.clipBounds, o) } : {},
		spacing: {
			beforePt: t.continuesFromPrevious ? 0 : e.spacing.beforePt,
			afterPt: t.continuesOnNext ? 0 : e.spacing.afterPt
		},
		inkBounds: f?.box ?? d,
		borders: f?.borders ?? e.borders.map((e) => ({
			...e,
			from: _v(e.from, o),
			to: _v(e.to, o)
		})),
		resources: e.resources.filter((e) => v.has(e.resourceKey)),
		drawings: m,
		cellContainmentBounds: h ?? void 0,
		textBoxes: e.textBoxes.filter((e) => y.has(e.id) || x.has(it("source-occurrence", e.source))).map((e) => b.has(e.id) ? e : Cv(e, o)),
		events: S === void 0 || C === void 0 ? [] : e.events.filter((e) => e.offset >= S && (e.offset < C || !t.continuesOnNext && e.offset === C)),
		exclusions: e.exclusions.filter((e) => e.verticalOwnership === "page" || e.anchorOccurrenceId === void 0 || !g.has(e.anchorOccurrenceId) || _.has(e.anchorOccurrenceId)).map((e) => ({
			...e,
			bounds: e.verticalOwnership === "page" ? e.bounds : vv(e.bounds, o),
			polygon: e.verticalOwnership === "page" ? e.polygon : e.polygon.map((e) => _v(e, o))
		})),
		anchorCollisions: (e.anchorCollisions ?? []).filter((e) => e.verticalOwnership === "page" || !g.has(e.occurrenceId) || _.has(e.occurrenceId)).map((e) => ({
			...e,
			bounds: e.verticalOwnership === "page" ? e.bounds : vv(e.bounds, o)
		})),
		...t.continuesOnNext ? { paragraphMark: void 0 } : e.paragraphMark ? { paragraphMark: {
			...e.paragraphMark,
			bounds: vv(e.paragraphMark.bounds, o)
		} } : {},
		continuation: t
	});
}
//#endregion
//#region packages/docx/src/layout/paragraph-pagination.ts
function Ev(e, t) {
	return e.segIndex - t.segIndex || e.charOffset - t.charOffset;
}
function Dv(e, t, n, r, i, a, o, s, c, l) {
	if (![r, i].every((e) => Number.isFinite(e) && e >= 0)) throw RangeError("Paragraph fragment extents must be finite and non-negative");
	if (n.kind === "splittable" && n.lineEndBoundaries.length !== e.lines.length) throw RangeError("Splittable paragraph source boundaries must align with retained lines");
	if (n.kind === "indivisible" && t.boundary !== null) throw RangeError("Indivisible paragraph cannot carry a continuation boundary");
	let u = o.authoredSpaceAfterPt ?? 0;
	if (!Number.isFinite(u) || u < 0) throw RangeError("Authored paragraph spaceAfter must be finite and non-negative");
	let d = e.lines.length, f = (n) => Tv(e, {
		lineStart: 0,
		lineEnd: n,
		continuesFromPrevious: t.boundary !== null,
		continuesOnNext: n < d
	}), p = (e) => {
		let t = s?.(e) ?? 0;
		if (!Number.isFinite(t) || t < 0) throw RangeError("Paragraph page-local reserve must be finite and non-negative");
		return t;
	}, m = (e) => l?.(e) ?? !0, h = (e, t) => {
		if (!t) return e.advancePt;
		let n = Nm({
			advancePt: e.advancePt,
			retainedSpaceAfterPt: e.spacing.afterPt,
			authoredSpaceAfterPt: u
		});
		return Im({
			paragraph: e,
			writingMode: o.writingMode ?? "horizontal-tb",
			logicalLineBoxExtentPt: n,
			availableBlockExtentPt: r
		});
	};
	if (n.kind === "indivisible") {
		let n = p(e), o = h(e, !0);
		return a && (o + n > r || !m(n)) && o + n <= i ? {
			fragment: null,
			nextCursor: t,
			requiresFreshFlowRegion: !0,
			additionalReservePt: 0,
			admittedBlockExtentPt: 0
		} : {
			fragment: e,
			nextCursor: null,
			requiresFreshFlowRegion: !1,
			additionalReservePt: n,
			admittedBlockExtentPt: Math.min(e.advancePt, r)
		};
	}
	if (d === 0) {
		let n = p(e), o = h(e, !0);
		return a && (o + n > r || !m(n)) && o + n <= i ? {
			fragment: null,
			nextCursor: t,
			requiresFreshFlowRegion: !0,
			additionalReservePt: 0,
			admittedBlockExtentPt: 0
		} : {
			fragment: e,
			nextCursor: null,
			requiresFreshFlowRegion: !1,
			additionalReservePt: n,
			admittedBlockExtentPt: Math.min(e.advancePt, r)
		};
	}
	let g = p(e), _ = h(e, !0);
	if (t.boundary === null && o.keepLines && a && (_ + g > r || !m(g)) && _ + g <= i) return {
		fragment: null,
		nextCursor: t,
		requiresFreshFlowRegion: !0,
		additionalReservePt: 0,
		admittedBlockExtentPt: 0
	};
	let v = km(0, d, r, (e) => (() => {
		let t = f(e), n = p(t);
		return m(n) ? h(t, e === d) + n : r + 1;
	})()).end;
	if (v === 0) {
		if (a) return {
			fragment: null,
			nextCursor: t,
			requiresFreshFlowRegion: !0,
			additionalReservePt: 0,
			admittedBlockExtentPt: 0
		};
		v = 1;
	}
	for (;;) {
		let e = Am({
			widowControl: o.widowControl,
			start: 0,
			end: v,
			totalLines: d,
			canRelocate: a
		});
		if (e.kind === "relocate") return {
			fragment: null,
			nextCursor: t,
			requiresFreshFlowRegion: !0,
			additionalReservePt: 0,
			admittedBlockExtentPt: 0
		};
		if (e.kind !== "dropLastLine") break;
		--v;
	}
	let y = f(v), b = v < d ? n.lineEndBoundaries[v - 1] : null;
	if (b !== null && t.boundary !== null && Ev(b, t.boundary) <= 0) throw Error("Paragraph continuation source boundary did not advance");
	return {
		fragment: y,
		nextCursor: b === null ? null : Object.freeze({
			boundary: b,
			sourceRangeStart: y.lines.at(-1).range.end,
			...c === void 0 ? {} : { uniformRubyAdvancePt: c }
		}),
		requiresFreshFlowRegion: !1,
		additionalReservePt: p(y),
		admittedBlockExtentPt: Math.min(y.advancePt, r)
	};
}
//#endregion
//#region packages/docx/src/layout/note-reference-ownership.ts
function Ov(e, t) {
	let n = /* @__PURE__ */ new Map();
	if (!e) return n;
	let r = new Set(e.map((e) => e.id));
	return t.forEach((e) => {
		r.has(e) && !n.has(e) && n.set(e, n.size + 1);
	}), n;
}
function kv(e) {
	let t = /* @__PURE__ */ new Map();
	if (!e) return t;
	for (let n of e) t.set(n.id, n);
	return t;
}
function Av(e, t) {
	let n = [], r = /* @__PURE__ */ new Set();
	for (let i of e) if (i.type === "paragraph" && "runs" in i) for (let e of i.runs) e.type !== "text" || e.noteRef?.kind !== t || e.noteRef.id.length === 0 || r.has(e.noteRef.id) || (r.add(e.noteRef.id), n.push(e.noteRef.id));
	else if (i.type === "table" && "rows" in i) for (let e of i.rows) for (let i of e.cells) for (let e of Av(i.content, t)) r.has(e) || (r.add(e), n.push(e));
	return Object.freeze(n);
}
function jv(e, t) {
	return Object.freeze([...new Set(e.flatMap((e) => e.placements.flatMap((e) => e.kind === "text" && e.noteReference?.kind === t ? [e.noteReference.id] : [])))]);
}
function Mv(e, t) {
	return e.rows.flatMap((e) => e.cells.flatMap((e) => e.blocks.flatMap((e) => Nv(e.layout, t))));
}
function Nv(e, t) {
	let n = e.kind === "paragraph" ? jv(e.lines, t) : Mv(e, t);
	return Object.freeze([...new Set(n)]);
}
function Pv(e) {
	return jv(e, "footnote");
}
function Fv(e) {
	return Nv(e, "footnote");
}
function Iv(e) {
	return Nv(e, "endnote");
}
//#endregion
//#region packages/docx/src/layout/column-balancing.ts
function Lv(e) {
	if (!Number.isInteger(e.columnCount) || e.columnCount <= 0) throw RangeError("Column count must be a positive integer");
	for (let t of e.fragments) if (!Number.isFinite(t.extentPt) || t.extentPt < 0) throw RangeError("Column balance fragment extents must be finite and non-negative");
	if (e.fragments.length === 0) return Object.freeze({
		targetPt: 0,
		cutIndexes: Object.freeze([]),
		transitionExpansions: 0
	});
	let t = [0], n = [0], r = [];
	e.fragments.forEach((i, a) => {
		t.push(t[a] + i.extentPt);
		let o = a + 1;
		(i.breakAfter !== "forbidden" || o === e.fragments.length) && n.push(o), i.breakAfter === "forced" && o < e.fragments.length && r.push(o);
	});
	let i = Math.min(e.columnCount, n.length - 1), a = Array.from({ length: i + 1 }, () => Array(n.length).fill(Infinity)), o = Array.from({ length: i + 1 }, () => Array(n.length).fill(-1));
	a[0][0] = 0;
	let s = 0;
	for (let e = 1; e <= i; e += 1) {
		let i = a[e - 1], c = a[e], l = i.flatMap((e, t) => Number.isFinite(e) ? [t] : []), u = 0, d = 0, f = 0, p = 0;
		for (let a = 1; a < n.length; a += 1) {
			let m = n[a];
			for (; d < r.length && r[d] < m;) f = r[d], d += 1;
			for (; n[p] < f;) p += 1;
			for (; u < l.length && l[u] < p;) u += 1;
			let h = l[u];
			if (h === void 0 || h >= a) continue;
			let g = (e) => {
				s += 1;
				let r = n[e];
				return Math.max(i[e], t[m] - t[r]);
			}, _ = h, v = g(_);
			for (; u + 1 < l.length;) {
				let e = l[u + 1];
				if (e >= a) break;
				let t = g(e);
				if (t > v) break;
				u += 1, _ = e, v = t;
			}
			c[a] = v, o[e][a] = _;
		}
	}
	let c = n.length - 1, l = -1, u = Infinity;
	for (let e = 1; e <= i; e += 1) {
		let t = a[e][c];
		t <= u && (u = t, l = e);
	}
	if (l < 0 || !Number.isFinite(u)) throw Error("Authored column breaks exceed the available column frontier");
	let d = [], f = c;
	for (let e = l; e > 0; --e) if (d.push(n[f]), f = o[e][f], f < 0) throw Error("Column balance frontier omitted a predecessor");
	return d.reverse(), Object.freeze({
		targetPt: u,
		cutIndexes: Object.freeze(d),
		transitionExpansions: s
	});
}
//#endregion
//#region packages/docx/src/layout/column-balance-frontier.ts
function Rv(e) {
	let t = /* @__PURE__ */ new Map();
	return e.sequence.forEach((e, n) => {
		if (e.kind === "body-block") {
			let r = e.block;
			t.set(z(r.source), Object.freeze({
				sequenceIndex: n,
				keepLines: r.kind === "paragraph" && r.keepLines,
				keepNext: r.kind === "paragraph" && r.keepNext,
				widowControl: r.kind === "paragraph" && r.widowControl
			}));
			return;
		}
		e.kind === "adjacent-table-group" && e.tables.forEach((e) => t.set(z(e.source), Object.freeze({
			sequenceIndex: n,
			keepLines: !1,
			keepNext: !1,
			widowControl: !1
		})));
	}), t;
}
function zv(e, t, n) {
	let r = t - e;
	if (n.length <= 1) return Object.freeze([r]);
	let i = [], a = e;
	for (let e of n) {
		if (!Number.isFinite(e) || e < a || e > t) return Object.freeze([r]);
		i.push(e - a), a = e;
	}
	return i[i.length - 1] = i.at(-1) + t - a, Object.freeze(i);
}
function Bv(e, t, n, r) {
	let i = new Set(r.flowDomainIds), a = new Map(n.layers.body.map((e) => [e.id, e])), o = Rv(e), s = [];
	for (let e of t) {
		if (!i.has(e.flowDomainId)) continue;
		let t = a.get(e.nodeId);
		if (!t || !t.ordinaryFlow) continue;
		let n = z(t.source), r = o.get(n);
		if (!r) continue;
		let c = t.kind === "paragraph" && !r.keepLines && t.lines.length > 1 ? t.lines.map((e) => e.bounds.yPt + e.advancePt) : t.kind === "table" && t.rows.length > 1 ? t.rows.map((e) => e.flowBounds.yPt + e.advancePt) : [e.blockEndPt];
		zv(e.blockStartPt, e.blockEndPt, c).forEach((e) => s.push({
			extentPt: e,
			breakAfter: "allowed",
			sequenceIndex: r.sequenceIndex,
			sourceIdentity: n,
			paragraphLine: t.kind === "paragraph" && !r.keepLines && t.lines.length > 0
		}));
	}
	let c = /* @__PURE__ */ new Map();
	s.forEach((e, t) => {
		let n = c.get(e.sourceIdentity) ?? [];
		n.push(t), c.set(e.sourceIdentity, n);
	});
	for (let [e, t] of c) {
		let n = o.get(e);
		if (!n) continue;
		let r = t.filter((e) => s[e].paragraphLine);
		n.keepLines && t.slice(0, -1).forEach((e) => {
			s[e].breakAfter = "forbidden";
		});
		for (let e = 0; e + 1 < r.length; e += 1) Am({
			widowControl: n.widowControl,
			start: 0,
			end: e + 1,
			totalLines: r.length,
			canRelocate: !0
		}).kind !== "keep" && (s[r[e]].breakAfter = "forbidden");
		n.keepNext && (s[t.at(-1)].breakAfter = "forbidden");
	}
	let l = e.initialSection.sectionOccurrenceId;
	return e.sequence.forEach((e, t) => {
		if (e.kind === "begin-section") {
			l = e.section.sectionOccurrenceId;
			return;
		}
		if (!(l !== r.sectionOccurrenceId || e.kind !== "authored-break" || e.break !== "column")) {
			for (let e = s.length - 1; e >= 0; --e) if (!(s[e].sequenceIndex >= t)) {
				s[e].breakAfter = "forced";
				break;
			}
		}
	}), Object.freeze(s.map((e) => Object.freeze(e)));
}
function Vv(e, t, n, r, i) {
	let a = Bv(e, t, r, i), o = n.get(r.pageIndex) ?? 0;
	return Lv({
		columnCount: i.flowDomainIds.length,
		fragments: a
	}).targetPt + o;
}
//#endregion
//#region packages/docx/src/layout/section-flow-composition.ts
function Hv(e, t, n, r, i) {
	let a = t, o = e.lines.map((t, o) => {
		let s = a++, c = String(s), l = i.measureLineNumberGlyph(c), u = Object.freeze({
			xPt: e.flowBounds.xPt - r,
			yPt: t.baselinePt
		});
		return Object.freeze({
			lineIndex: o,
			counterValue: s,
			bounds: Object.freeze({
				xPt: u.xPt - l.widthPt,
				yPt: u.yPt - l.ascentPt,
				widthPt: l.widthPt,
				heightPt: l.ascentPt + l.descentPt
			}),
			paintOps: s % n === 0 ? Object.freeze([Object.freeze({
				kind: "text",
				text: c,
				origin: u,
				font: l.font ?? "",
				color: "#000000",
				textAlign: "right"
			})]) : Object.freeze([])
		});
	});
	return Object.freeze({
		paragraph: Object.freeze({
			...e,
			lineNumbers: Object.freeze(o)
		}),
		counterEnd: a
	});
}
function Uv(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i, a = e.pages.map((e) => {
		if (e.parityBlank) return e;
		let a = [...e.layers.body];
		for (let o = 0; o < e.sectionRegions.length; o += 1) {
			let s = e.sectionRegions[o], c = new Set(s.flowDomainIds), l = a.flatMap((e, t) => c.has(e.flowDomainId) ? [t] : []), u = new Map(l.map((e) => [a[e].id, a[e]])), d = n.filter((e) => {
				let t = u.get(e.nodeId);
				return c.has(e.flowDomainId) && e.blockEndPt > e.blockStartPt && t !== void 0 && (t.ordinaryFlow || t.sectionFlowOwnership === "host-flow");
			}), f = d.length === 0 ? s.blockStartPt : Math.min(...d.map((e) => e.blockStartPt)), p = d.length === 0 ? f : Math.max(...d.map((e) => e.blockEndPt)), m = s.blockEndPt, h = Math.max(0, m - s.blockStartPt), g = Math.max(0, p - f), _ = s.section.verticalAlignment, v = d.length > 0 && g < h ? _ === "center" ? s.blockStartPt + (h - g) / 2 - f : _ === "bottom" ? m - g - f : 0 : 0, y = s.section.lineNumbering, b = y?.restart === "newPage" ? y.start : y?.restart === "newSection" ? r.get(s.sectionOccurrenceId) ?? y.start : r.get(s.sectionOccurrenceId) ?? i ?? y?.start ?? 1;
			b ??= 1;
			for (let e of l) {
				let n = a[e];
				if (n.kind === "paragraph" && n.ordinaryFlow && y) {
					let e = Hv(n, b, Math.max(1, y.countBy), uu(y.distance), t);
					n = e.paragraph, b = e.counterEnd;
				}
				v !== 0 && (n.ordinaryFlow || n.sectionFlowOwnership === "host-flow") && (n.kind === "paragraph" || n.kind === "table") && (n = dm(n, {
					xPt: 0,
					yPt: v
				})), a[e] = n;
			}
			y && (r.set(s.sectionOccurrenceId, b), i = b);
		}
		return Object.freeze({
			...e,
			layers: $r(e.layers, "body", a)
		});
	});
	return Object.freeze({
		...e,
		pages: Object.freeze(a)
	});
}
//#endregion
//#region packages/docx/src/layout/track-changes.ts
function Wv(e) {
	let t = /* @__PURE__ */ new Map(), n = (e) => {
		t.has(e) || t.set(e, t.size);
	}, r = (e) => {
		for (let t of e) if (t.type === "paragraph" && t.runs) for (let e of t.runs) e.revision?.kind && n(e.revision.author ?? "");
		else if (t.type === "table" && t.rows) for (let e of t.rows) for (let t of e.cells) r(t.content);
	};
	return r(e), (e) => {
		let r = e ?? "";
		return n(r), Wm[(t.get(r) ?? 0) % Wm.length];
	};
}
var Gv = .75;
function Kv(e) {
	return e.placements.some((e) => e.kind === "text" && e.revision !== void 0);
}
function qv(e) {
	return e.kind === "paragraph" ? e.lines.filter(Kv) : e.rows.flatMap((e) => e.cells.flatMap((e) => e.blocks.flatMap((e) => qv(e.layout))));
}
function Jv(e) {
	let t = !1, n = e.pages.map((e) => {
		let n = e.layers.body.flatMap((e) => e.kind === "paragraph" || e.kind === "table" ? qv(e) : []);
		if (n.length === 0) return e;
		t = !0;
		let r = Math.max(0, e.section.geometry.marginLeft / 2 - Gv / 2), i = Object.freeze(n.map((e) => Object.freeze({ bounds: Object.freeze({
			xPt: r,
			yPt: e.bounds.yPt,
			widthPt: Gv,
			heightPt: e.bounds.heightPt
		}) })));
		return Object.freeze({
			...e,
			changeBars: i
		});
	});
	return t ? Object.freeze({
		...e,
		pages: Object.freeze(n)
	}) : e;
}
//#endregion
//#region packages/docx/src/layout/section-page-identity.ts
function Yv(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = new Set(n.contentFlowDomainIds);
		for (let r of n.sectionRegions) !t.has(r.sectionOccurrenceId) && r.flowDomainIds.some((t) => e.has(t)) && t.set(r.sectionOccurrenceId, n.pageIndex);
	}
	return t;
}
function Xv(e, t) {
	let n = e[t];
	return n ? t === 0 || e[t - 1]?.sectionOccurrenceId !== n.sectionOccurrenceId : !1;
}
//#endregion
//#region packages/docx/src/layout/header-footer-reserve.ts
function Zv(e, t) {
	return t.titlePage && t.firstPageOfSection ? e.first : t.evenAndOddHeaders && t.displayPageNumber % 2 == 0 ? e.even : e.default;
}
function Qv(e, t) {
	if (![
		e.pageHeight,
		e.marginTop,
		e.marginBottom,
		t.top,
		t.bottom
	].every(Number.isFinite)) throw RangeError("Reserved body interval inputs must be finite");
	if (e.pageHeight <= 0 || t.top < 0 || t.bottom < 0) throw RangeError("Reserved body interval requires a positive page and non-negative reserves");
	let n = Math.min(e.pageHeight, Math.abs(e.marginTop) + t.top), r = e.pageHeight - Math.abs(e.marginBottom) - t.bottom;
	return Object.freeze({
		blockStartPt: n,
		blockEndPt: Math.max(n, Math.min(e.pageHeight, r))
	});
}
function $v(e, t, n) {
	if (![
		e,
		t,
		n
	].every(Number.isFinite)) throw RangeError("Header/footer reserve inputs must be finite");
	if (e < 0) throw RangeError("Story extent must be non-negative");
	return e === 0 || t < 0 ? 0 : Math.max(0, e - (t - n));
}
function* ey(e) {
	let t = (t) => {
		let n = Object.freeze(e.measure(t).map((e) => Object.freeze({ ...e })));
		return Object.freeze({
			result: t,
			reserves: n,
			pageCount: n.length,
			fingerprint: it("header-footer-reserve-v1", {
				identity: e.identity(t),
				reserves: n
			})
		});
	}, n = t(e.seed);
	return !e.requiresConvergence && n.reserves.every((e) => e.top === 0 && e.bottom === 0) ? n : yield* Vo(n, function* (n) {
		return t(yield* e.repaginate(n.reserves, n.result));
	}, e.limit ?? 16);
}
//#endregion
//#region packages/docx/src/layout/flow.ts
var ty = class extends V {
	constructor(e, t) {
		super("INVALID_GEOMETRY", `${t} exceeds the available flow capacity`), this.containerId = e, this.layoutId = t, this.name = "FlowCapacityExceededError";
	}
};
function ny(e, t) {
	if (e.length === 0) return {
		xPt: t.xPt,
		yPt: t.yPt,
		widthPt: 0,
		heightPt: 0
	};
	let n = Math.min(...e.map((e) => e.xPt)), r = Math.min(...e.map((e) => e.yPt)), i = Math.max(...e.map((e) => e.xPt + e.widthPt)), a = Math.max(...e.map((e) => e.yPt + e.heightPt));
	return {
		xPt: n,
		yPt: r,
		widthPt: i - n,
		heightPt: a - r
	};
}
function ry(e, t, n) {
	let r = [], i = e.cursor, a = e.container.bounds;
	if (![
		a.xPt,
		a.yPt,
		a.widthPt,
		a.heightPt
	].every(Number.isFinite) || a.widthPt < 0 || a.heightPt < 0) throw new V("INVALID_GEOMETRY", `${e.container.id} has invalid bounds`);
	let o = e.container.bounds.yPt + e.container.bounds.heightPt, s = e.container.capacity === "unbounded" ? 2 ** 53 - 1 : o, c = e.container.bounds.xPt + e.container.bounds.widthPt;
	if (!Number.isFinite(i.xPt) || !Number.isFinite(i.yPt) || i.xPt < a.xPt || i.xPt > c || i.yPt < a.yPt || i.yPt > o) throw new V("INVALID_GEOMETRY", `${e.container.id} has an invalid initial flow cursor`);
	for (let a of e.blocks) {
		let l = {
			container: e.container,
			cursor: i,
			availableBounds: {
				xPt: e.container.bounds.xPt,
				yPt: i.yPt,
				widthPt: e.container.bounds.widthPt,
				heightPt: Math.max(0, s - i.yPt)
			}
		}, u = a.kind === "paragraph" ? n.layoutParagraph(a, l, t) : n.layoutTable(a, l, t);
		if (u.layout.flowDomainId !== e.container.id) throw new V("INVALID_REFERENCE", `${u.layout.id} belongs to ${u.layout.flowDomainId}, not ${e.container.id}`);
		if (e.container.capacity !== "unbounded" && Number.isFinite(u.nextCursor.yPt) && u.nextCursor.yPt > o) throw new ty(e.container.id, u.layout.id);
		if (!Number.isFinite(u.nextCursor.xPt) || !Number.isFinite(u.nextCursor.yPt) || u.nextCursor.xPt < e.container.bounds.xPt || u.nextCursor.xPt > c || u.nextCursor.yPt < i.yPt) throw new V("INVALID_GEOMETRY", `${u.layout.id} returned an invalid flow cursor`);
		r.push(u.layout), i = u.nextCursor;
	}
	return {
		source: e.source,
		container: e.container,
		blocks: r,
		nextCursor: i,
		flowDomainId: e.container.id,
		flowBounds: ny(r.map((e) => e.flowBounds), e.container.bounds),
		inkBounds: ny(r.map((e) => e.inkBounds), e.container.bounds),
		...e.container.capacity === "unbounded" ? {} : { clipBounds: e.container.bounds },
		advancePt: i.yPt - e.cursor.yPt,
		ordinaryFlow: !0
	};
}
//#endregion
//#region packages/docx/src/layout/stories.ts
var iy = /* @__PURE__ */ new WeakMap(), ay = (e) => "type" in e && e.type === "unsupportedTextBoxBlock";
function oy(e, t) {
	if (iy.has(e)) throw Error("Story block layout algorithms are already attached");
	iy.set(e, Object.freeze({ ...t }));
}
function sy(e, t) {
	return Object.freeze({
		...e,
		flowBounds: X(e.flowBounds, t),
		inkBounds: X(e.inkBounds, t),
		...e.clipBounds ? { clipBounds: X(e.clipBounds, t) } : {},
		blocks: Object.freeze(e.blocks.map((e) => {
			if (e.kind === "paragraph") return rm(e, t);
			if (e.kind === "table") return im(e, t);
			throw Error(`Story contains unsupported retained node: ${e.kind}`);
		}))
	});
}
function cy(e, t) {
	return Object.freeze({
		...e,
		flowBounds: X(e.flowBounds, t),
		inkBounds: X(e.inkBounds, t),
		...e.clipBounds ? { clipBounds: X(e.clipBounds, t) } : {},
		separator: Object.freeze(e.separator.map((e) => Wp(e, t))),
		story: sy(e.story, t)
	});
}
function ly(e, t) {
	for (let t of e.blocks) if (!ay(t) && (t.source.story !== e.source.story || t.source.storyInstance !== e.source.storyInstance)) throw new V("INVALID_REFERENCE", `Story block ${t.source.story}:${t.source.storyInstance} is not owned by ${e.source.story}:${e.source.storyInstance}`);
	let n = iy.get(t);
	if (!n) throw Error("Story block layout algorithms are not attached to the supplied services");
	let r = e.blocks.filter(ay), i = ry({
		blocks: e.blocks.filter((e) => !ay(e)),
		container: e.container,
		cursor: {
			xPt: e.container.bounds.xPt,
			yPt: e.container.bounds.yPt
		},
		source: e.source
	}, t, n);
	return Object.freeze({
		story: e.source.story,
		flowBounds: i.flowBounds,
		inkBounds: i.inkBounds,
		...i.clipBounds ? { clipBounds: i.clipBounds } : {},
		blocks: Object.freeze([...i.blocks]),
		advancePt: i.advancePt,
		diagnostics: Object.freeze(r.map((t) => Object.freeze({
			code: "UNSUPPORTED_FEATURE",
			severity: "warning",
			source: Object.freeze({
				story: e.source.story,
				storyInstance: e.source.storyInstance,
				path: Object.freeze([...t.sourcePath])
			}),
			message: `Unsupported text-box block ${t.qName}`
		})))
	});
}
//#endregion
//#region packages/docx/src/layout/body-paginator.ts
var uy = class extends Error {
	code = "FOOTNOTE_RESERVE_EXCEEDS_FRESH_PAGE";
	constructor(e, t, n) {
		super(`Body footnote admission cannot fit a fresh physical page (reserve: ${e}, charge: ${t}, fresh page: ${n})`), this.reservePt = e, this.admissionChargePt = t, this.freshPageExtentPt = n, this.name = "FootnoteAdmissionOverflowError";
	}
};
function dy(e, t) {
	if (t.has(e)) return [];
	t.add(e);
	let n = e.diagnostics ?? [];
	return e.kind === "paragraph" ? [
		...n,
		...e.drawings.flatMap((e) => dy(e, t)),
		...e.textBoxes.flatMap((e) => dy(e, t))
	] : e.kind === "table" ? [
		...n,
		...e.rows.flatMap((e) => e.cells.flatMap((e) => e.blocks.flatMap((e) => dy(e.layout, t)))),
		...(e.floatingTables ?? []).flatMap((e) => dy(e.child, t)),
		...(e.resolvedFloatingTables ?? []).flatMap((e) => dy(e.child, t))
	] : e.kind === "textbox" || e.kind === "note" ? [
		...n,
		...e.story.diagnostics,
		...e.story.blocks.flatMap((e) => dy(e, t))
	] : n;
}
function fy(e, t, n) {
	if (e > 0 && t > n) throw new uy(e, t, n);
}
function py(e) {
	let t = /* @__PURE__ */ new Set(), n = (e) => {
		for (let r of e.resolvedFloatingTables ?? []) t.add(r.occurrenceId), n(r.child);
	};
	return n(e), t;
}
function my(e, t, n) {
	if (!e.floats) throw Error("Accepted floating table omitted its float registry delta");
	let r = py(t);
	return Object.freeze({
		...e,
		floats: Object.freeze({
			...e.floats,
			entries: Object.freeze(e.floats.entries.map((e) => {
				let i = r.has(e.occurrenceId) ? am(n, e.occurrenceId) : t.ordinaryFlow ? null : n;
				return i === null ? e : Object.freeze({
					...e,
					occurrenceId: i,
					exclusionId: i
				});
			}))
		})
	});
}
function hy(e, t) {
	let n = new Set(t.drawings.flatMap((e) => {
		let t = e.anchorLayer?.acquisitionOccurrenceId ?? e.anchorLayer?.occurrenceId;
		return t === void 0 ? [] : [t];
	})), r = e.floats?.entries.filter((e) => n.has(e.occurrenceId)) ?? [], i = e.drawingCollisions?.entries.filter((e) => n.has(e.occurrenceId)) ?? [];
	return r.length === 0 && i.length === 0 ? null : Object.freeze({
		...e.floats && r.length > 0 ? { floats: Object.freeze({
			...e.floats,
			entries: Object.freeze(r),
			nextParagraphId: e.floats.baseNextParagraphId + r.length
		}) } : {},
		...e.drawingCollisions && i.length > 0 ? { drawingCollisions: Object.freeze({
			...e.drawingCollisions,
			entries: Object.freeze(i)
		}) } : {}
	});
}
function gy(e) {
	let t = new Map([[e.initialSection.sectionOccurrenceId, e.initialSection]]);
	for (let n = 0; n < e.sequence.length; n += 1) {
		let r = e.sequence[n];
		r.kind === "begin-section" && t.set(r.section.sectionOccurrenceId, r.section);
	}
	return t;
}
function _y(e, t) {
	return Su(e.context, e.pageLayout, t);
}
function vy(e, t) {
	let n = _y(e, t);
	return mu({
		sectionOccurrenceId: e.sectionOccurrenceId,
		geometry: n.geometry,
		columns: n.columns,
		textDirection: n.textDirection,
		sectionBidi: n.sectionBidi === !0,
		grid: n.grid
	});
}
function yy(e, t, n, r = n.blockStartPt, i = _y(e, t).columns.map((e, t) => t)) {
	let a = _y(e, t);
	return Object.freeze({
		id: `page:${t}:section:${encodeURIComponent(e.sectionOccurrenceId)}`,
		sectionOccurrenceId: e.sectionOccurrenceId,
		section: a,
		pageBorders: e.pageBordersAuthored ? e.pageBorders : null,
		writingMode: mi(a.textDirection),
		blockStartPt: r,
		blockEndPt: n.blockEndPt,
		columnFlowDirection: a.sectionBidi === !0 ? "rtl" : "ltr",
		columnIndexes: Object.freeze([...i]),
		columns: Object.freeze(i.map((e) => {
			let t = a.columns[e];
			if (!t) throw Error("Missing authored section column");
			return Object.freeze({
				inlineStartPt: t.xPt,
				inlineExtentPt: t.wPt
			});
		}))
	});
}
function by(e, t) {
	let n = mi(e.textDirection), r = bi({
		widthPt: e.geometry.pageWidth,
		heightPt: e.geometry.pageHeight
	}, n);
	return Object.freeze(n === "horizontal-tb" ? {
		...r,
		contentTopPt: t.blockStartPt,
		contentBottomPt: t.blockEndPt
	} : {
		...r,
		contentTopPt: 0,
		contentBottomPt: r.heightPt
	});
}
function xy(e, t, n) {
	return Qv(_y(e, t).geometry, n);
}
function Sy(e, t, n) {
	let r = _y(e, t);
	return Lp({
		kind: "content",
		pageIndex: t,
		physicalPage: by(r, n),
		sectionOccurrenceId: e.sectionOccurrenceId,
		section: r,
		region: yy(e, t, n)
	});
}
function Cy(e) {
	let t = e.pages.at(-1), n = t?.accumulator.sectionRegions.at(-1);
	if (!t || t.kind !== "content" || !n) throw Error("Missing active body region");
	return n;
}
function wy(e) {
	let t = Cy(e), n = t.columnIndexes ?? t.section.columns.map((e, t) => t), r = (t.columnFlowDirection === "rtl" ? [...n].reverse() : [...n]).at(-1) === e.flow.columnIndex;
	return e.balanceTargetPt === null || r ? t.blockEndPt : Math.min(t.blockEndPt, t.blockStartPt + e.balanceTargetPt);
}
function Ty(e) {
	let t = Cy(e), n = t.columnIndexes ?? t.section.columns.map((e, t) => t), r = t.columns[n.indexOf(e.flow.columnIndex)];
	if (!r) throw Error("Missing active body column");
	return Object.freeze({
		pageIndex: e.flow.pageIndex,
		columnIndex: e.flow.columnIndex,
		flowDomainId: ju(e.flow.pageIndex, t.id, e.flow.columnIndex),
		section: t.section,
		cursorPt: Object.freeze({
			xPt: r.inlineStartPt,
			yPt: e.flow.cursorBlockPt
		}),
		availableBounds: Object.freeze({
			xPt: r.inlineStartPt,
			yPt: e.flow.cursorBlockPt,
			widthPt: r.inlineExtentPt,
			heightPt: Math.max(0, wy(e) - e.footnoteReservePt - e.flow.cursorBlockPt)
		})
	});
}
function Ey(e, t) {
	let n = (t) => {
		let n = e.get(t);
		if (!n) throw Error(`Unknown body section ${t}`);
		return n;
	};
	return {
		openContentPage(e) {
			let r = n(e.sectionOccurrenceId), i = t[e.pageIndex] ?? {
				top: 0,
				bottom: 0
			}, a = xy(r, e.pageIndex, i), o = gm(vy(r, e.pageIndex), {
				pageIndex: e.pageIndex,
				pageContentStartBlockPt: a.blockStartPt,
				pageContentEndBlockPt: a.blockEndPt
			});
			return {
				page: Sy(r, e.pageIndex, a),
				flow: o
			};
		},
		openParityBlankPage(e) {
			let r = n(e.sectionOccurrenceId), i = _y(r, e.pageIndex), a = xy(r, e.pageIndex, t[e.pageIndex] ?? {
				top: 0,
				bottom: 0
			});
			return Lp({
				kind: "parity-blank",
				pageIndex: e.pageIndex,
				physicalPage: by(i, a),
				sectionOccurrenceId: r.sectionOccurrenceId,
				section: i,
				pageBorders: r.pageBordersAuthored ? r.pageBorders : null
			});
		},
		openSamePageSectionRegion(e, t, r) {
			let i = n(t.section.sectionOccurrenceId), a = e.accumulator.sectionRegions, o = a.at(-1);
			if (!o || !("placement" in t)) throw Error("A same-page section requires explicit retained placement");
			let s = Object.freeze({
				blockStartPt: e.accumulator.sectionRegions[0].blockStartPt,
				blockEndPt: o.blockEndPt
			}), c = t.placement === "same-page-block" ? Object.freeze({
				...o,
				blockEndPt: r.regionStartBlockPt
			}) : (() => {
				let e = t.outgoingColumnSubset;
				if (!e || e.length === 0) throw Error("A same-page-column transition requires outgoing column ownership");
				return Object.freeze({
					...o,
					columnIndexes: Object.freeze([...e]),
					columns: Object.freeze(e.map((e) => {
						let t = o.section.columns[e];
						if (!t) throw Error("Missing outgoing authored column");
						return Object.freeze({
							inlineStartPt: t.xPt,
							inlineExtentPt: t.wPt
						});
					}))
				});
			})(), l = Object.freeze([...a.slice(0, -1), c]);
			return Object.freeze({
				...e,
				accumulator: Zu(Object.freeze({
					...e.accumulator,
					sectionRegions: l
				}), yy(i, r.pageIndex, s, r.regionStartBlockPt, t.columnSubset))
			});
		}
	};
}
function Dy(e, t, n, r, i, a, o, s) {
	let c = e.pages.at(-1);
	if (!c || c.kind !== "content") throw Error("Body content requires an active page");
	let l = Cy(e), u = l.columnIndexes ?? l.section.columns.map((e, t) => t), d = l.columns[u.indexOf(e.flow.columnIndex)], f = ju(e.flow.pageIndex, l.id, e.flow.columnIndex), p = nt(n, f, i);
	if (a.has(p)) throw Error(`Duplicate body occurrence acceptance: ${p}`);
	a.add(p);
	let m = fm(t, {
		occurrenceId: p,
		destination: {
			coordinateSpace: "logical-page-points",
			flowDomainId: f,
			translation: {
				xPt: s ? s.xPt - t.flowBounds.xPt : t.kind === "table" ? d.inlineStartPt : d.inlineStartPt - t.flowBounds.xPt,
				yPt: (s?.yPt ?? e.flow.cursorBlockPt) - t.flowBounds.yPt
			}
		}
	}), h = s?.sectionFlowOwnership === void 0 ? m : Object.freeze({
		...m,
		sectionFlowOwnership: s.sectionFlowOwnership
	}), g = s?.yPt ?? e.flow.cursorBlockPt, _ = h.kind === "paragraph" && h.ordinaryFlow ? (() => {
		let e = g + h.spacing.beforePt, t = g + r - h.spacing.afterPt;
		return Object.freeze({
			...h,
			flowBounds: Object.freeze({
				...h.flowBounds,
				yPt: e,
				heightPt: Math.max(0, t - e)
			})
		});
	})() : h, v = s?.coordinateSpace === "upright-physical" ? {
		..._,
		ordinaryFlow: !1,
		flowBounds: Object.freeze({
			..._.flowBounds,
			heightPt: r
		})
	} : _, y = vm(e.flow, v, r), b = y.events[0];
	if (!b || b.type !== "place") throw Error("Flow placement did not emit an allocation");
	o.push(Object.freeze({
		nodeId: v.id,
		flowDomainId: v.flowDomainId,
		blockStartPt: b.blockStartPt,
		blockEndPt: b.blockEndPt
	}));
	let x = Qu(c.accumulator, {
		layer: "body",
		node: v,
		...s?.coordinateSpace === "upright-physical" ? { coordinateSpace: "upright-physical" } : {}
	}, !0), S = [...e.pages];
	return S[S.length - 1] = Object.freeze({
		...c,
		accumulator: x
	}), Object.freeze({
		...e,
		flow: y.state,
		pages: Object.freeze(S)
	});
}
function Oy(e) {
	return e.boundary === null ? "root" : `paragraph:${e.boundary.segIndex}:${e.boundary.charOffset}`;
}
function ky(e, t) {
	for (let n = t; n < e.sequence.length; n += 1) {
		let t = e.sequence[n];
		if (t.kind === "consume-source") continue;
		if (t.kind === "authored-break") {
			if (t.break !== "lastRenderedPageBreak") return !1;
			continue;
		}
		if (t.kind === "begin-section") {
			if (t.section.startType !== "continuous") return !1;
			continue;
		}
		let r = t.kind === "adjacent-table-group" ? t : t.block;
		if (r.kind !== "paragraph") return !0;
		if (r.pageBreakBefore) return !1;
		if (r.inkless !== !0) return !0;
	}
	return !1;
}
function Ay(e) {
	return e.paragraphMark !== void 0 && e.lines.length === 0 && e.shading === void 0 && e.borders.length === 0 && e.resources.length === 0 && e.drawings.length === 0 && e.textBoxes.length === 0;
}
function jy(e) {
	return [
		e.rowIndex,
		e.rowFragmentIndex,
		e.cells.map((e) => [
			e.blockIndex,
			e.paragraphLineStart,
			e.nestedFragmentIndex,
			e.nestedCursor === null ? null : jy(e.nestedCursor)
		])
	];
}
function My(e) {
	if (e === void 0) return "root";
	if (e.kind === "table") return `table:${JSON.stringify(jy(e.cursor))}`;
	let t = e.cursor.tableCursor;
	return `adjacent-table:${e.cursor.tableIndex}:${e.cursor.sourceRowIndex}:${JSON.stringify(t === void 0 ? null : jy(t))}`;
}
function Ny(e, t) {
	let n = e.cursorPt.yPt + t, r = e.availableBounds.yPt + e.availableBounds.heightPt;
	return Object.freeze({
		...e,
		cursorPt: Object.freeze({
			...e.cursorPt,
			yPt: n
		}),
		availableBounds: Object.freeze({
			...e.availableBounds,
			yPt: n,
			heightPt: Math.max(0, r - n)
		})
	});
}
function Py(e, t) {
	let n = Yv(e.pages.map((e) => ({
		pageIndex: e.accumulator.pageIndex,
		sectionRegions: e.accumulator.sectionRegions.map((t) => ({
			sectionOccurrenceId: t.sectionOccurrenceId,
			flowDomainIds: (t.columnIndexes ?? t.section.columns.map((e, t) => t)).map((n) => ju(e.accumulator.pageIndex, t.id, n))
		})),
		contentFlowDomainIds: e.accumulator.readingOrder.map((e) => e.flowDomainId)
	}))), r = 0, i = null, a = e.pages.map((e) => {
		let a = t.get(e.accumulator.sectionOccurrenceId), o = a.sectionOccurrenceId !== i;
		a.sectionOccurrenceId !== i && a.pageNumbering.start !== null ? r = du(a.pageNumbering.start, e.accumulator.pageIndex, n.get(a.sectionOccurrenceId) ?? e.accumulator.pageIndex) : r += 1, i = a.sectionOccurrenceId;
		let s = {
			displayNumber: r,
			format: a.pageNumbering.format ?? "decimal",
			sectionOccurrenceId: a.sectionOccurrenceId
		};
		return e.kind === "parity-blank" ? ed({
			pageIndex: e.accumulator.pageIndex,
			physicalPage: e.accumulator.physicalPage,
			sectionOccurrenceId: e.accumulator.sectionOccurrenceId,
			section: e.accumulator.section,
			pageBorders: e.accumulator.pageBorders,
			firstSectionOwnedPage: o,
			pageNumber: s
		}) : $u(e.accumulator, s, o);
	}), o = /* @__PURE__ */ new WeakSet();
	return {
		pages: a,
		diagnostics: a.flatMap((e) => ei(e).flatMap(({ node: e }) => dy(e, o)))
	};
}
function Fy(e, t, n, r, i, a, o) {
	let s = Py(e, t), c = new Set(s.pages.map((e) => e.pageIndex)), l = new Set(s.pages.flatMap((e) => ei(e).map(({ node: e }) => e.id)));
	return Object.freeze({
		layout: s,
		session: n,
		allocations: Object.freeze(r.filter((e) => l.has(e.nodeId))),
		footnoteReserveByPage: new Map([...i].filter(([e]) => c.has(e))),
		footnoteLayoutsByPage: new Map([...a].filter(([e]) => c.has(e))),
		terminalDiagnostic: o
	});
}
function Iy(e) {
	let t = e.next();
	for (; !t.done;) t = e.next();
	return t.value;
}
function* Ly(e, t, n, r, i, a, o) {
	let s = _r(t);
	if (!s) throw Error("Body layout kernel is not attached to the supplied services");
	let c = gy(e), l = /* @__PURE__ */ new Set(), u = [], d = r[0] ?? {
		top: 0,
		bottom: 0
	}, f = xy(e.initialSection, 0, d), p = Rp(gm(vy(e.initialSection, 0), {
		pageContentStartBlockPt: f.blockStartPt,
		pageContentEndBlockPt: f.blockEndPt
	}), Sy(e.initialSection, 0, f)), m = (e) => {
		let t = a.get(e.flow.section.sectionOccurrenceId);
		return t?.pageIndex === e.flow.pageIndex ? t.targetPt : null;
	};
	p = zp(p, m(p));
	let h = Ey(c, r), g = null, _ = s.openBodyLayoutSession({
		source: e.source,
		section: e.initialSection.context,
		initialLocation: Ty(p)
	}, t, n), v = (e) => {
		let t = c.get(e.flow.section.sectionOccurrenceId);
		if (!t) throw Error(`Unknown body section ${e.flow.section.sectionOccurrenceId}`);
		let n = e.flow.pageIndex + 1, i = xy(t, n, r[n] ?? {
			top: 0,
			bottom: 0
		});
		return i.blockEndPt - i.blockStartPt;
	}, y = (t, n) => {
		if (i !== null) {
			let e = Ty(t);
			return Object.freeze([...i.values()].filter((t) => t.pageIndex === e.pageIndex && t.flowDomainId === e.flowDomainId).map(({ occurrenceId: e, paragraphSource: t }) => Object.freeze({
				occurrenceId: e,
				paragraphSource: t
			})));
		}
		let r = [];
		for (let t = n; t < e.sequence.length; t += 1) {
			let i = e.sequence[t];
			if (i.kind === "authored-break" && i.break !== "column" || i.kind === "begin-section" && i.section.startType !== "continuous") break;
			if (!(i.kind !== "body-block" || i.block.kind !== "paragraph")) {
				if (t > n && i.block.pageBreakBefore) break;
				i.block.pageOwnedAnchorOccurrenceIds?.forEach((e) => r.push(Object.freeze({
					occurrenceId: e,
					paragraphSource: i.block.source
				})));
			}
		}
		return Object.freeze(r);
	}, b = (e, t) => {
		let n = y(e, t);
		if (n.length === 0) return;
		if (!_.prescanPageAnchors) throw Error("Page-owned anchors require canonical prescan acquisition");
		let r = Ty(e), i = _.prescanPageAnchors({
			anchors: n,
			location: r,
			availableInlineExtentPt: r.availableBounds.widthPt
		});
		i && _.commitFlowRegistryDelta(i);
	};
	b(p, 0);
	let x = (e, t, n = !1) => {
		let r = p.flow.pageIndex, i = e.events.some((e) => e.type === "next-page" && e.reason === "overflow"), a = e.events.some((e) => e.type === "begin-section" && "placement" in e && e.placement === "same-page-column");
		p = Vp(p, e, h), p = zp(p, m(p));
		let o = Ty(p);
		p.flow.pageIndex === r ? (_.moveAcquisitionCursor(o), a && b(p, t)) : (g = i && n ? t : null, _.resetPageAcquisition(o), b(p, t));
	}, S = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Map(), w = /* @__PURE__ */ new Map(), T = (e) => (S.get(e)?.size ?? 0) > 0, E = (e, t, n) => D(n ?? Fv(e), t), D = (e, t) => {
		let n = S.get(p.flow.pageIndex) ?? /* @__PURE__ */ new Set(), r = [...new Set(e)].filter((e) => !n.has(e)), i = Ty(p);
		if (r.length > 0 && !_.layoutNotes) throw Error("Footnote layout requires a note-capable layout session");
		let a = r.length === 0 ? Object.freeze([]) : _.layoutNotes({
			kind: "footnote",
			referenceIds: Object.freeze(r),
			pageIndex: p.flow.pageIndex,
			section: i.section,
			container: {
				id: `notes:page:${p.flow.pageIndex}`,
				kind: "footnote",
				bounds: {
					xPt: i.availableBounds.xPt,
					yPt: 0,
					widthPt: t,
					heightPt: i.section.geometry.pageHeight
				}
			},
			firstOnPage: n.size === 0
		});
		return Object.freeze({
			ids: Object.freeze(r),
			layouts: a,
			reservePt: a.reduce((e, t) => e + t.advancePt, 0)
		});
	}, O = (e, t, n) => {
		let r = S.get(p.flow.pageIndex);
		r || (r = /* @__PURE__ */ new Set(), S.set(p.flow.pageIndex, r)), e.forEach((e) => r.add(e));
		let i = w.get(p.flow.pageIndex) ?? [];
		i.push(...t), w.set(p.flow.pageIndex, i), C.set(p.flow.pageIndex, (C.get(p.flow.pageIndex) ?? 0) + n), p = Bp(p, n);
	}, k = () => Math.max(0, wy(p) - p.footnoteReservePt - p.flow.deepestColumnBlockPt), A = (e) => e > k(), j = null, M = Um(e.sequence), N = null;
	bodyEntries: for (let t = 0; t < e.sequence.length; t += 1) {
		yield p.pages.length, o?.shouldPublish(p.pages.length) && o.publish(Fy(p, c, _, u, C, w, N), t);
		let n = e.sequence[t];
		if (n.kind === "consume-source") continue;
		if (n.kind === "authored-break") {
			if (j = null, n.break === "column" && !M.has(t)) continue;
			x(Dm(p.flow, n.break, n.parity), t + 1);
			continue;
		}
		if (n.kind === "begin-section") {
			j = null;
			let e = mi(Cy(p).section.textDirection), i = mi(_y(n.section, p.flow.pageIndex).textDirection), a = bi({
				widthPt: Cy(p).section.geometry.pageWidth,
				heightPt: Cy(p).section.geometry.pageHeight
			}, e), o = _y(n.section, p.flow.pageIndex), s = bi({
				widthPt: o.geometry.pageWidth,
				heightPt: o.geometry.pageHeight
			}, i), c = n.section.startType === "continuous" && (e !== i || a.widthPt !== s.widthPt || a.heightPt !== s.heightPt) ? "nextPage" : n.section.startType, l = xy(n.section, p.flow.pageIndex, r[p.flow.pageIndex] ?? {
				top: 0,
				bottom: 0
			});
			try {
				x(Om(p.flow, vy(n.section, p.flow.pageIndex), c, {
					hasFootnoteReferenceOnCurrentPage: T(p.flow.pageIndex),
					incomingPageContentStartBlockPt: l.blockStartPt,
					incomingPageContentEndBlockPt: l.blockEndPt
				}), t + 1);
			} catch (e) {
				if (!(e instanceof pm) || p.flow.pageIndex === 0) throw e;
				let t = p.flow.pageIndex;
				p = Object.freeze({
					...p,
					pages: Object.freeze(p.pages.filter((e) => e.accumulator.pageIndex < t))
				}), N = Object.freeze({
					code: "UNSUPPORTED_FEATURE",
					severity: "error",
					source: n.source,
					message: `Document layout stopped after the last complete page because a nextColumn section could not be placed safely (${e.reason})`
				});
				break bodyEntries;
			}
			continue;
		}
		let i = n.kind === "adjacent-table-group" ? n : n.block;
		if (i.kind === "paragraph") {
			if (i.continuousSectionRole === "collapse-mark") continue;
			i.pageBreakBefore && x(Dm(p.flow, "pageBreakBefore"), t);
			let n = j?.spaceAfterPt ?? 0, a = yg(j, i, n, i.continuousSectionRole === "suppress-before" ? 0 : i.spaceBeforePt), o = i.continuousSectionRole === "drop-previous-after" ? n : a.overlap;
			o > 0 && (p = Object.freeze({
				...p,
				flow: Object.freeze({
					...p.flow,
					cursorBlockPt: Math.max(p.flow.regionStartBlockPt, p.flow.cursorBlockPt - o)
				})
			}));
			let s = Object.freeze({ boundary: null });
			for (; s;) {
				let n = Oy(s), o = Ty(p), c = _.measureParagraph({
					input: i,
					location: o,
					availableInlineExtentPt: o.availableBounds.widthPt,
					suppressSpaceBefore: s.boundary !== null || i.continuousSectionRole === "suppress-before" || a.suppressBefore || s.boundary === null && !p.flow.pageHasContent && g === t,
					continuation: s
				});
				if (c.placement) {
					let e = E(c.layout, o.availableBounds.widthPt, c.retainedFootnoteReferenceIds), r = c.relocationBlockExtentPt, a = c.placement.sectionFlowOwnership === "page" ? e.reservePt : (r ?? c.blockExtentPt) + e.reservePt, d = v(p), f = A(e.reservePt);
					if (fy(e.reservePt, a, d), (a > o.availableBounds.heightPt || f) && a <= d && p.flow.pageHasContent) {
						x(f ? wm(p.flow, p.flow.section, "overflow") : ym(p.flow, "overflow"), t);
						continue;
					}
					p = Dy(p, c.layout, i.source, c.blockExtentPt, n, l, u, c.placement), O(e.ids, e.layouts, e.reservePt), c.flowRegistryDelta && _.commitFlowRegistryDelta(c.flowRegistryDelta), s = null, _.moveAcquisitionCursor(Ty(p));
					continue;
				}
				if (s.boundary === null && i.keepNext && p.flow.pageHasContent) {
					let n = c.blockExtentPt, r = new Set(Fv(c.layout)), a = !1, s = Lm({
						keepNext: i.keepNext,
						inkless: i.inkless === !0,
						undecoratedMark: Ay(c.layout)
					});
					for (let i = t + 1; i < e.sequence.length; i += 1) {
						let t = e.sequence[i];
						if (t.kind === "consume-source") continue;
						if (t.kind === "authored-break" || t.kind === "begin-section") break;
						let c = t.kind === "adjacent-table-group" ? t : t.block;
						if (c.kind === "paragraph" && c.pageBreakBefore) break;
						let l = _.measureFollowingBlock({
							input: c,
							location: o,
							availableInlineExtentPt: o.availableBounds.widthPt
						}), u = c.kind === "paragraph" && (c.keepNext || s);
						if (s = !1, n += u ? l.fullExtentPt : l.leadContentExtentPt, (u ? l.fullFootnoteReferenceIds : l.leadFootnoteReferenceIds)?.forEach((e) => r.add(e)), !u) {
							a = !0;
							break;
						}
					}
					let l = D([...r], o.availableBounds.widthPt).reservePt, u = n + l;
					if (a && u > o.availableBounds.heightPt && u <= v(p)) {
						x(ym(p.flow, "overflow"), t, !0);
						continue;
					}
				}
				let d = e.sequence[t + 1], f = e.sequence[t + 2], m = d?.kind === "body-block" && d.block.kind === "paragraph" && f?.kind === "authored-break" && f.break === "page" && f.sameSourceParagraphAsPrevious !== !0, h = Bm(c.layout);
				if (s.boundary === null && h && m && p.flow.pageHasContent) {
					let e = Ny(o, c.blockExtentPt), n = _.measureParagraph({
						input: d.block,
						location: e,
						availableInlineExtentPt: e.availableBounds.widthPt,
						suppressSpaceBefore: !1,
						continuation: Object.freeze({ boundary: null })
					});
					_.moveAcquisitionCursor(o);
					let r = Vm(n.layout, e.cursorPt.yPt);
					if (r !== null) {
						let e = c.blockExtentPt + r;
						if (e > o.availableBounds.heightPt && e <= v(p)) {
							x(ym(p.flow, "overflow"), t);
							continue;
						}
					}
				}
				let y = e.sequence[t + 1], b = y?.kind === "authored-break" && y.break === "page";
				if (s.boundary === null && b) {
					let e = Hm(c.layout);
					if (e !== null) {
						p = Dy(p, e, i.source, 0, n, l, u), c.flowRegistryDelta && _.commitFlowRegistryDelta(c.flowRegistryDelta), s = null, _.moveAcquisitionCursor(Ty(p));
						continue;
					}
				}
				let S = E(c.layout, o.availableBounds.widthPt).reservePt, C = (r[p.flow.pageIndex]?.bottom ?? 0) === 0 && p.footnoteReservePt === 0, w = wy(p) === Cy(p).blockEndPt, T = y?.kind === "begin-section" && y.section.startType === "nextPage", k = fu({
					hasContinuationBoundary: s.boundary !== null,
					inkless: i.inkless === !0,
					undecorated: Ay(c.layout),
					keepNext: i.keepNext,
					markReservePt: S,
					pageBottomIsUnreserved: C,
					physicalRegionBottomIsActive: w,
					hasFollowingInk: ky(e, t + 1),
					followsNextPageSectionBoundary: T,
					markExtentPt: c.blockExtentPt,
					markBelowBaselinePt: c.markBelowBaselinePt ?? 0
				}), j = Dv(c.layout, s, c.fragmentation, o.availableBounds.heightPt + k, v(p), p.flow.pageHasContent, {
					keepLines: i.keepLines,
					widowControl: i.widowControl,
					authoredSpaceAfterPt: i.spaceAfterPt,
					writingMode: Cy(p).writingMode
				}, (e) => E(e, o.availableBounds.widthPt).reservePt, c.uniformRubyAdvancePt, (e) => !A(e));
				if (j.requiresFreshFlowRegion) {
					x(ym(p.flow, "overflow"), t);
					continue;
				}
				if (!j.fragment) throw Error("Paragraph acquisition made no progress");
				p = Dy(p, j.fragment, i.source, Math.min(j.admittedBlockExtentPt, o.availableBounds.heightPt), n, l, u, c.placement);
				let M = E(j.fragment, o.availableBounds.widthPt);
				if (fy(M.reservePt, j.fragment.advancePt + M.reservePt, v(p)), O(M.ids, M.layouts, M.reservePt), c.flowRegistryDelta) {
					let e = hy(c.flowRegistryDelta, j.fragment);
					e && _.commitFlowRegistryDelta(e);
				}
				s = j.nextCursor, s && x(ym(p.flow, "overflow"), t), o = Ty(p), _.moveAcquisitionCursor(o);
			}
			j = i;
		} else {
			j = null;
			let e, n = !1;
			for (; !n;) {
				let r = My(e), a = Ty(p), o = (t) => _.measureTable({
					input: i,
					location: a,
					availableInlineExtentPt: a.availableBounds.widthPt,
					availableBlockExtentPt: t,
					freshPageBlockExtentPt: v(p),
					...e ? { cursor: e } : {}
				}), s = a.availableBounds.heightPt, c = o(s);
				if (c.retryAtBlockStartPt !== void 0) {
					if (!Number.isFinite(c.retryAtBlockStartPt) || c.retryAtBlockStartPt <= p.flow.cursorBlockPt) throw Error("Table repositioning must advance the block cursor");
					p = Object.freeze({
						...p,
						flow: Object.freeze({
							...p.flow,
							cursorBlockPt: c.retryAtBlockStartPt
						})
					}), _.moveAcquisitionCursor(Ty(p));
					continue;
				}
				let d = c.requiresFreshFlowRegion ? Object.freeze({
					ids: Object.freeze([]),
					layouts: Object.freeze([]),
					reservePt: 0
				}) : E(c.layout, a.availableBounds.widthPt), f = Object.freeze({
					reservePt: d.reservePt,
					chargePt: c.blockExtentPt + d.reservePt
				}), m = /* @__PURE__ */ new Set(), h = (e, t) => e <= t || e - t <= 2 ** -52 * Math.max(1, Math.abs(e), Math.abs(t));
				for (; !c.requiresFreshFlowRegion && !h(c.blockExtentPt + d.reservePt, a.availableBounds.heightPt);) {
					let e = JSON.stringify({
						advancePt: c.blockExtentPt,
						nextCursor: c.nextCursor ?? null,
						noteIds: d.ids,
						reservePt: d.reservePt
					});
					if (m.has(e)) throw fy(f.reservePt, f.chargePt, v(p)), Error("Table footnote admission did not converge");
					m.add(e), s = Math.max(0, a.availableBounds.heightPt - d.reservePt), c = o(s), d = c.requiresFreshFlowRegion ? Object.freeze({
						ids: Object.freeze([]),
						layouts: Object.freeze([]),
						reservePt: 0
					}) : E(c.layout, a.availableBounds.widthPt), c.requiresFreshFlowRegion || (f = Object.freeze({
						reservePt: d.reservePt,
						chargePt: c.blockExtentPt + d.reservePt
					}));
				}
				if (c.requiresFreshFlowRegion) {
					fy(f.reservePt, f.chargePt, v(p));
					let n = !p.flow.pageHasContent && c.nextCursor?.kind === "table" && c.nextCursor.floatingContinuationFrame === "fresh-text" && !(e?.kind === "table" && e.floatingContinuationFrame !== void 0);
					if (c.nextCursor?.kind === "table" && c.nextCursor.floatingContinuationFrame !== void 0 && (e = c.nextCursor), n) continue;
					x(ym(p.flow, "overflow"), t);
					continue;
				}
				if (A(d.reservePt) && p.flow.pageHasContent) {
					x(wm(p.flow, p.flow.section, "overflow"), t);
					continue;
				}
				p = Dy(p, c.layout, i.source, c.blockExtentPt, r, l, u, c.placement), O(d.ids, d.layouts, d.reservePt), c.flowRegistryDelta && _.commitFlowRegistryDelta(my(c.flowRegistryDelta, c.layout, nt(i.source, a.flowDomainId, r))), e = c.nextCursor ?? void 0, n = e === void 0, e && x(ym(p.flow, "overflow"), t);
			}
		}
		_.moveAcquisitionCursor(Ty(p));
	}
	let ee = new Set([...C.keys(), ...w.keys()]);
	for (let e of ee) {
		let t = C.get(e) ?? 0, n = (w.get(e) ?? []).reduce((e, t) => e + t.advancePt, 0);
		if (t !== n) throw new V("INVALID_GEOMETRY", `Page ${e} footnote reserve ${t} does not equal retained advance ${n}`);
	}
	return Fy(p, c, _, u, C, w, N);
}
function Ry(e, t) {
	return Object.freeze(e.layout.pages.map((n, r) => {
		if (n.parityBlank || mi(n.section.textDirection) !== "horizontal-tb") return Object.freeze({
			top: 0,
			bottom: 0
		});
		let i = t.get(n.sectionOccurrenceId);
		if (!i) throw Error(`Unknown body section ${n.sectionOccurrenceId}`);
		let a = Math.max(0, n.section.geometry.pageWidth - Math.abs(n.section.geometry.marginLeft) - Math.abs(n.section.geometry.marginRight)), o = (t) => {
			let o = Zv(t === "header" ? i.headers : i.footers, {
				titlePage: i.titlePage,
				firstPageOfSection: Xv(e.layout.pages, r),
				evenAndOddHeaders: i.evenAndOddHeaders,
				displayPageNumber: n.pageNumber.displayNumber
			});
			if (o === null) return 0;
			if (!e.session.layoutStory) throw Error("Header/footer story layout requires a story-capable layout session");
			return e.session.layoutStory({
				source: o,
				pageIndex: n.pageIndex,
				section: n.section,
				container: {
					id: `story:${t}:page:${n.pageIndex}`,
					kind: t,
					bounds: {
						xPt: Math.abs(n.section.geometry.marginLeft),
						yPt: 0,
						widthPt: a,
						heightPt: n.section.geometry.pageHeight
					}
				}
			}).advancePt;
		};
		return Object.freeze({
			top: $v(o("header"), n.section.geometry.marginTop, n.section.geometry.headerDistance),
			bottom: $v(o("footer"), n.section.geometry.marginBottom, n.section.geometry.footerDistance)
		});
	}));
}
function zy(e, t, n, r) {
	let i = e.pages.map((i, a) => {
		if (i.parityBlank) return i;
		let o = n.get(i.sectionOccurrenceId);
		if (!o) throw Error(`Unknown body section ${i.sectionOccurrenceId}`);
		if (!t.layoutStory) {
			if (!(Object.values(o.headers).some((e) => e !== null) || Object.values(o.footers).some((e) => e !== null) || (r.get(i.pageIndex)?.length ?? 0) > 0)) return i;
			throw Error("Page-story composition requires a story-capable layout session");
		}
		let s = mi(i.section.textDirection) !== "horizontal-tb", c = s ? yu(i.section.geometry) : i.section.geometry, l = Math.abs(c.marginLeft), u = Math.max(0, c.pageWidth - Math.abs(c.marginLeft) - Math.abs(c.marginRight)), d = s ? "upright-physical" : "section-logical", f = s ? Object.freeze({
			...i.section,
			geometry: Object.freeze({ ...c }),
			columns: Object.freeze([Object.freeze({
				xPt: l,
				wPt: u
			})]),
			textDirection: "lrTb"
		}) : i.section, p = (t) => Zv(t === "header" ? o.headers : o.footers, {
			titlePage: o.titlePage,
			firstPageOfSection: Xv(e.pages, a),
			evenAndOddHeaders: o.evenAndOddHeaders,
			displayPageNumber: i.pageNumber.displayNumber
		}), m = (e) => {
			let n = p(e);
			if (n === null) return null;
			let r = t.layoutStory({
				source: n,
				pageIndex: i.pageIndex,
				section: f,
				container: {
					id: `story:${e}:page:${i.pageIndex}`,
					kind: e,
					bounds: {
						xPt: l,
						yPt: 0,
						widthPt: u,
						heightPt: c.pageHeight
					}
				}
			});
			return sy(r, {
				xPt: 0,
				yPt: (e === "header" ? c.headerDistance : c.pageHeight - c.footerDistance - r.advancePt) - r.flowBounds.yPt
			});
		}, h = m("header"), g = m("footer"), _ = r.get(i.pageIndex) ?? [], v = _.reduce((e, t) => e + t.advancePt, 0), y = i.sectionRegions[0], b = (y?.blockEndPt ?? Math.max(0, i.section.geometry.pageHeight - Math.abs(i.section.geometry.marginBottom))) - v, x = b, S = _.map((e) => {
			let t = cy(e, {
				xPt: 0,
				yPt: x - e.flowBounds.yPt
			});
			return x += e.advancePt, t;
		}), C = S.length === 0 ? 0 : Math.min(...S.map((e) => e.flowBounds.xPt)), w = S.length === 0 ? 0 : Math.max(...S.map((e) => e.flowBounds.xPt + e.flowBounds.widthPt)), T = Object.freeze({
			xPt: C,
			yPt: b,
			widthPt: w - C,
			heightPt: v
		}), E = y ? Object.freeze(wi(y.coordinateSpace.logicalToPhysical, T)) : T, D = [
			...h ? [Object.freeze({
				id: `story:header:page:${i.pageIndex}`,
				kind: "header",
				logicalBounds: Object.freeze({
					xPt: l,
					yPt: h.flowBounds.yPt,
					widthPt: u,
					heightPt: h.advancePt
				}),
				physicalBounds: Object.freeze({
					xPt: l,
					yPt: h.flowBounds.yPt,
					widthPt: u,
					heightPt: h.advancePt
				})
			})] : [],
			...S.length > 0 ? [Object.freeze({
				id: `notes:page:${i.pageIndex}`,
				kind: "footnote",
				...y ? { sectionRegionId: y.id } : {},
				logicalBounds: T,
				physicalBounds: E
			})] : [],
			...g ? [Object.freeze({
				id: `story:footer:page:${i.pageIndex}`,
				kind: "footer",
				logicalBounds: Object.freeze({
					xPt: l,
					yPt: g.flowBounds.yPt,
					widthPt: u,
					heightPt: g.advancePt
				}),
				physicalBounds: Object.freeze({
					xPt: l,
					yPt: g.flowBounds.yPt,
					widthPt: u,
					heightPt: g.advancePt
				})
			})] : []
		], O = i.layers.roots.map((e) => e), k = O.findIndex((e) => e.layer !== "background" && e.layer !== "behindText"), A = k < 0 ? O.length : k, j = [
			...O.slice(0, A),
			...h?.blocks.map((e) => ({
				layer: "header",
				node: e,
				coordinateSpace: d
			})) ?? [],
			...O.slice(A)
		], M = -1;
		for (let e = 0; e < j.length; e += 1) j[e].layer === "body" && (M = e);
		let N = M < 0 ? j.length : M + 1, ee = [
			...j.slice(0, N),
			...S.map((e) => ({
				layer: "notes",
				node: e,
				coordinateSpace: "section-logical"
			})),
			...j.slice(N),
			...g?.blocks.map((e) => ({
				layer: "footer",
				node: e,
				coordinateSpace: d
			})) ?? []
		];
		return Object.freeze({
			...i,
			flowDomains: Object.freeze([...i.flowDomains, ...D]),
			layers: Qr(ee),
			readingOrder: Object.freeze([
				...h?.blocks.map((e) => e.id) ?? [],
				...i.readingOrder,
				...S.map((e) => e.id),
				...g?.blocks.map((e) => e.id) ?? []
			])
		});
	});
	return Object.freeze({
		...e,
		pages: Object.freeze(i)
	});
}
function By(e, t, n) {
	if (n.length === 0) return e;
	let r = -1;
	for (let t = e.pages.length - 1; t >= 0; --t) if (!e.pages[t].parityBlank) {
		r = t;
		break;
	}
	if (r < 0) return e;
	let i = e.pages[r];
	if (!t.layoutNotes) return Object.freeze({
		...e,
		diagnostics: Object.freeze([...e.diagnostics, Object.freeze({
			code: "UNSUPPORTED_FEATURE",
			severity: "error",
			source: Object.freeze({
				story: "endnote",
				storyInstance: n[0],
				path: Object.freeze([])
			}),
			message: "Document-end notes require a note-capable layout session"
		})])
	});
	let a = new Map(i.flowDomains.map((e) => [e.id, e])), o = i.layers.body.filter((e) => e.ordinaryFlow && a.get(e.flowDomainId)?.kind === "body").reduce((e, t) => e === null || t.flowBounds.yPt + t.flowBounds.heightPt > e.flowBounds.yPt + e.flowBounds.heightPt ? t : e, null), s = o ? a.get(o.flowDomainId) : [...i.flowDomains].reverse().find((e) => e.kind === "body");
	if (!s) return Object.freeze({
		...e,
		diagnostics: Object.freeze([...e.diagnostics, Object.freeze({
			code: "UNSUPPORTED_FEATURE",
			severity: "error",
			message: "Document-end notes require a retained body flow domain"
		})])
	});
	let c = i.sectionRegions.find((e) => e.flowDomainIds.includes(s.id)) ?? i.sectionRegions[0], l = o ? o.flowBounds.yPt + o.flowBounds.heightPt : s.logicalBounds.yPt, u = i.layers.notes.filter((e) => e.kind === "note" && e.source.story === "footnote").reduce((e, t) => Math.min(e, t.flowBounds.yPt), s.logicalBounds.yPt + s.logicalBounds.heightPt), d = Math.min(s.logicalBounds.yPt + s.logicalBounds.heightPt, u), f = `endnotes:page:${i.pageIndex}`;
	try {
		let a = t.layoutNotes({
			kind: "endnote",
			referenceIds: Object.freeze([...n]),
			pageIndex: i.pageIndex,
			section: c?.section ?? i.section,
			container: {
				id: f,
				kind: "endnote",
				bounds: {
					xPt: s.logicalBounds.xPt,
					yPt: l,
					widthPt: s.logicalBounds.widthPt,
					heightPt: Math.max(0, d - l)
				}
			},
			firstOnPage: !0
		});
		if (a.length === 0) return e;
		let o = a.reduce((e, t) => e + t.advancePt, 0), u = Object.freeze({
			xPt: s.logicalBounds.xPt,
			yPt: l,
			widthPt: s.logicalBounds.widthPt,
			heightPt: o
		}), p = Object.freeze({
			id: f,
			kind: "endnote",
			...c ? { sectionRegionId: c.id } : {},
			logicalBounds: u,
			physicalBounds: c ? Object.freeze(wi(c.coordinateSpace.logicalToPhysical, u)) : u
		}), m = i.layers.roots.map((e) => e), h = -1;
		for (let e = 0; e < m.length; e += 1) m[e].layer === "body" && (h = e);
		h += 1, m.splice(h, 0, ...a.map((e) => ({
			layer: "notes",
			node: e,
			coordinateSpace: "section-logical"
		})));
		let g = new Set(i.layers.body.map((e) => e.id)), _ = -1;
		for (let e = 0; e < i.readingOrder.length; e += 1) g.has(i.readingOrder[e]) && (_ = e);
		_ += 1;
		let v = [...i.readingOrder];
		v.splice(_, 0, ...a.map((e) => e.id));
		let y = [...e.pages];
		return y[r] = Object.freeze({
			...i,
			flowDomains: Object.freeze([...i.flowDomains, p]),
			layers: Qr(m),
			readingOrder: Object.freeze(v)
		}), Object.freeze({
			...e,
			pages: Object.freeze(y)
		});
	} catch (t) {
		if (!(t instanceof Fp) || t.kind !== "endnote" || t.pageIndex !== i.pageIndex || t.containerId !== f) throw t;
		return Object.freeze({
			...e,
			diagnostics: Object.freeze([...e.diagnostics, Object.freeze({
				code: "UNSUPPORTED_FEATURE",
				severity: "error",
				source: Object.freeze({
					story: "endnote",
					storyInstance: n[0],
					path: Object.freeze([])
				}),
				message: `Document-end notes do not fit the retained terminal flow region: ${t instanceof Error ? t.message : String(t)}`
			})])
		});
	}
}
function Vy(e, t, n, r) {
	return Object.freeze({
		...e,
		diagnostics: Object.freeze([...e.diagnostics, Object.freeze({
			code: "UNSUPPORTED_FEATURE",
			severity: "error",
			message: `Unsupported ${t} position ${JSON.stringify(n)}; retained layout uses the ${r} fallback`
		})])
	});
}
function Hy(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.pages) for (let e of n.layers.body) if (e.kind === "paragraph") for (let r of e.drawings) {
		let i = r.anchorLayer;
		if (!i || i.horizontalOwnership !== "page" || i.verticalOwnership !== "page") continue;
		let a = i.acquisitionOccurrenceId ?? i.occurrenceId;
		t.set(a, Object.freeze({
			occurrenceId: a,
			paragraphSource: e.source,
			pageIndex: n.pageIndex,
			flowDomainId: e.flowDomainId
		}));
	}
	return t;
}
function Uy(e) {
	return JSON.stringify([...e].sort(([e], [t]) => e.localeCompare(t)));
}
function* Wy(e, t, n, r, i, a) {
	if (!e.sequence.some((e) => e.kind === "body-block" && e.block.kind === "paragraph" && (e.block.pageOwnedAnchorOccurrenceIds?.length ?? 0) > 0)) return yield* Ly(e, t, n, r, null, i, a);
	try {
		return (yield* Bo({
			step: function* (o) {
				let s = yield* Ly(e, t, n, r, o?.plan ?? null, i, o === void 0 ? a : void 0);
				return Object.freeze({
					pass: s,
					plan: Hy(s.layout)
				});
			},
			stateOf: (e) => Uy(e.plan),
			limit: 16
		})).value.pass;
	} catch (e) {
		throw e instanceof Ro ? new V("NON_CONVERGENCE", e.reason === "cycle" ? "Page-anchor destination acquisition repeated an exact-state cycle" : "Page-anchor destination acquisition reached the operational pass limit 16") : e;
	}
}
function Gy(e) {
	let t = [], n = e.initialSection;
	for (let r of e.sequence) r.kind === "begin-section" && (r.section.startType === "continuous" && t.push(Object.freeze({
		outgoingSectionOccurrenceId: n.sectionOccurrenceId,
		incomingSectionOccurrenceId: r.section.sectionOccurrenceId
	})), n = r.section);
	return Object.freeze(t);
}
function Ky(e, t, n) {
	for (let r of e.pages) for (let e = 0; e + 1 < r.sectionRegions.length; e += 1) {
		let i = r.sectionRegions[e], a = r.sectionRegions[e + 1];
		if (i.sectionOccurrenceId === t && a.sectionOccurrenceId === n) return Object.freeze({
			page: r,
			outgoing: i
		});
	}
	return null;
}
function* qy(e, t, n, r, i) {
	let a = /* @__PURE__ */ new Map(), o = yield* Wy(e, t, n, r, a, i);
	if (o.terminalDiagnostic !== null) return o;
	for (let i of Gy(e)) {
		let s = Ky(o.layout, i.outgoingSectionOccurrenceId, i.incomingSectionOccurrenceId);
		if (s === null || s.outgoing.flowDomainIds.length < 2) continue;
		let c = s.page.pageIndex, l = Vv(e, o.allocations, o.footnoteReserveByPage, s.page, s.outgoing), u = new Map(a);
		if (u.set(i.outgoingSectionOccurrenceId, Object.freeze({
			pageIndex: c,
			targetPt: l
		})), a = u, o = yield* Wy(e, t, n, r, a), o.terminalDiagnostic !== null) return o;
	}
	return o;
}
function Jy(e, t, n, r, i) {
	let a = Uv(e.layout, e.session, e.allocations), o = t.noteLayoutSettings ?? Object.freeze({
		footnotePosition: "pageBottom",
		endnotePosition: "docEnd"
	}), s = zy(a, e.session, n, e.footnoteLayoutsByPage), c = s.pages.some((e) => e.layers.notes.some((e) => e.source.story === "footnote")) && o.footnotePosition !== "pageBottom" ? Vy(s, "footnote", o.footnotePosition, "pageBottom") : s, l = i ? new Set(a.pages.flatMap((e) => e.layers.body.flatMap((e) => e.kind === "paragraph" || e.kind === "table" ? Iv(e) : []))) : /* @__PURE__ */ new Set(), u = (t.endnoteIds ?? []).filter((e) => l.has(e)), d = By(c, e.session, u), f = u.length > 0 && o.endnotePosition !== "docEnd" ? Vy(d, "endnote", o.endnotePosition, "docEnd") : d, p = [...t.parserDiagnostics ?? [], ...e.terminalDiagnostic === null ? [] : [e.terminalDiagnostic]], m = p.length === 0 ? f : Object.freeze({
		...f,
		diagnostics: Object.freeze([...p, ...f.diagnostics])
	}), h = Object.freeze({
		...m,
		pages: Object.freeze(m.pages.map(Ju))
	});
	return r.showTrackedChanges === !0 ? Jv(h) : h;
}
function* Yy(e, t, n, r) {
	t = kr(t);
	let i = gy(e), a = 1, o = !1, s = !1, c = yield* qy(e, t, n, [], r ? {
		shouldPublish: (e) => !o && !s && e >= a,
		publish: (t, c) => {
			try {
				if (Ry(t, i).some((e) => e.top > 0 || e.bottom > 0)) {
					s = !0;
					return;
				}
				let o = Jy(t, e, i, n, !1), l = Object.freeze({
					...o,
					pages: Object.freeze(o.pages.slice(0, -1))
				});
				l.pages.length > 0 && r.onPages(l, c), a = Math.max(t.layout.pages.length + 1, t.layout.pages.length * 2);
			} catch {
				o = !0;
			}
		}
	} : void 0), l = (yield* ey({
		seed: c,
		measure: (e) => Ry(e, i),
		repaginate: function* (r, i) {
			let a = bg(i.layout);
			return yield* qy(e, jr(t, {
				totalPages: i.layout.pages.length,
				resolveDestinationPage: (e) => a[e]
			}), n, r);
		},
		identity: (e) => bg(e.layout),
		requiresConvergence: c.session.hasPaginationFields
	})).result;
	return Fd(Jy(l, e, i, n, !0));
}
function Xy(e, t, n) {
	return Iy(Yy(e, t, n));
}
//#endregion
//#region packages/docx/src/layout/pagination-scheduler.ts
var Zy = 16;
function Qy() {
	let e = globalThis.performance?.now;
	return e ? e.call(globalThis.performance) : Date.now();
}
function $y() {
	let e = globalThis.MessageChannel;
	return e ? new Promise((t) => {
		let n = new e();
		n.port1.onmessage = () => {
			n.port1.close(), n.port2.close(), t();
		}, n.port2.postMessage(null);
	}) : new Promise((e) => {
		setTimeout(e, 0);
	});
}
var eb = class extends Error {
	constructor() {
		super("Pagination was aborted"), this.name = "PaginationAbortError";
	}
};
async function tb(e, t = {}) {
	let n = t.sliceMs ?? Zy, r = t.now ?? Qy, i = t.yieldToHost ?? $y, { signal: a, onProgress: o } = t, s = r(), c = e.next();
	for (; !c.done;) {
		if (o?.(c.value), a?.aborted) throw e.return(void 0), new eb();
		r() - s >= n && (await i(), s = r()), c = e.next();
	}
	return c.value;
}
//#endregion
//#region packages/docx/src/layout/document.ts
function nb(e, t, n = ai(void 0, Date.now())) {
	return Xy(e, t, n);
}
function rb(e, t, n = ai(void 0, Date.now()), r) {
	return tb(Yy(e, t, n), r);
}
function ib(e, t, n) {
	if (Cr(e)) return;
	let r = n();
	Rd({
		source: r,
		services: e,
		defaultCurrentDateMs: t,
		buildLayout: (t) => nb(r.bodyLayoutInput, e, t)
	});
}
//#endregion
//#region packages/docx/src/paint/math-resources.ts
async function ab(e, t) {
	if (e.length === 0) return {
		records: [],
		drawables: /* @__PURE__ */ new Map()
	};
	await t.loadMathJax();
	let n = [], r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
	for (let a of e) {
		if (i.has(a.resourceKey)) throw Error(`Duplicate math occurrence: ${a.resourceKey}`);
		i.add(a.resourceKey);
		try {
			let e = await t.mathMLToSvg(F(a.nodes, a.display)), i = await fe(e, "#000000");
			n.push({
				resourceKey: a.resourceKey,
				widthEm: e.widthEm,
				ascentEm: e.ascentEm,
				descentEm: e.descentEm,
				diagnostics: []
			}), r.set(a.resourceKey, i.source);
		} catch {
			n.push({
				resourceKey: a.resourceKey,
				widthEm: 0,
				ascentEm: 0,
				descentEm: 0,
				available: !1,
				diagnostics: [{
					code: "UNSUPPORTED_FEATURE",
					severity: "warning",
					message: "Math conversion failed; using the deterministic text fallback"
				}]
			});
		}
	}
	return {
		records: n,
		drawables: r
	};
}
//#endregion
//#region packages/docx/src/frame-geometry.ts
function ob(e, t) {
	switch (e) {
		case "margin": return {
			left: t.marginLeft,
			right: t.pageWidth - t.marginRight
		};
		case "page": return {
			left: 0,
			right: t.pageWidth
		};
		default: return {
			left: t.contentX,
			right: t.contentX + t.contentW
		};
	}
}
function sb(e, t, n, r) {
	switch (e) {
		case "margin": return {
			start: r.marginTop,
			end: r.pageH - r.marginBottom
		};
		case "page": return {
			start: 0,
			end: r.pageH
		};
		default: return {
			start: t,
			end: t + n
		};
	}
}
function cb(e, t, n, r) {
	switch (e) {
		case "center": return t + (n - t - r) / 2;
		case "right":
		case "outside": return n - r;
		default: return t;
	}
}
function lb(e, t, n) {
	switch (e) {
		case "center": return t.start + (t.end - t.start - n) / 2;
		case "bottom":
		case "outside": return t.end - n;
		default: return t.start;
	}
}
function ub(e, t, n) {
	return e + t <= n.end ? e : Math.max(n.start, n.end - t);
}
function db(e, t, n, r, i, a) {
	let o = e.dropCap === "drop" || e.dropCap === "margin", s = ob(e.hAnchor, t), c = sb(e.vAnchor, n, i, t), l = e.w == null ? r : e.w, u;
	if (o) u = Math.max(1, e.lines) * a;
	else {
		let t = e.h ?? 0;
		u = e.hRule === "exact" ? t : e.hRule === "atLeast" ? Math.max(t, i) : i;
	}
	let d;
	d = e.dropCap === "drop" ? s.left : e.dropCap === "margin" ? s.left - l : e.xAlign ? cb(e.xAlign, s.left, s.right, l) : s.left + (e.x ?? 0);
	let f;
	f = o ? c.start : e.yAlign && e.vAnchor !== "text" ? lb(e.yAlign, c, u) : c.start + (e.y ?? 0), (e.vAnchor === "page" || e.vAnchor === "margin") && (f = ub(f, u, c));
	let p = e.wrap === "around" || e.wrap === "auto" ? e.hSpace : 0, m = e.vSpace;
	return {
		x: d,
		y: f,
		w: l,
		h: u,
		exLeft: d - p,
		exRight: d + l + p,
		exTop: f - m,
		exBottom: f + u + m
	};
}
function fb(e, t) {
	if (t.kind === "table" && t.tableOverlap === void 0) throw Error("Floating-table transport omitted tblOverlap");
	let n = t.x, r = t.y;
	if (t.avoidOverlap) {
		let i = {
			occurrenceId: "display-moving-float",
			paragraphId: t.paraId,
			bounds: {
				xPt: n,
				yPt: r,
				widthPt: t.w,
				heightPt: t.h
			},
			exclusionBounds: {
				xPt: n - t.dl,
				yPt: r - t.dt,
				widthPt: t.w + t.dl + t.dr,
				heightPt: t.h + t.dt + t.db
			}
		}, a = Qa({
			moving: t.kind === "table" ? {
				...i,
				kind: "table",
				tableOverlap: t.tableOverlap
			} : {
				...i,
				kind: t.kind === "frame" ? "frame" : "drawingml"
			},
			blockers: e.floats.map(Ka),
			avoidance: t.kind === "table" ? Ua(t.tableOverlap, t.paraId) : Wa(t.allowOverlap ?? !0, t.paraId),
			rightBoundaryPt: e.pageWidth,
			overlapEpsilonPt: Va,
			rightBoundarySlackPt: Ha
		});
		n = a.bounds.xPt, r = a.bounds.yPt;
	}
	let i = {
		mode: t.mode,
		imageKey: t.imageKey,
		imageX: n,
		imageY: r,
		imageW: t.w,
		imageH: t.h,
		xLeft: n - t.dl,
		xRight: n + t.w + t.dr,
		yTop: r - t.dt,
		yBottom: r + t.h + t.db,
		side: t.side,
		distLeft: t.dl,
		distRight: t.dr,
		distTop: t.dt,
		distBottom: t.db,
		paraId: t.paraId
	}, a = t.kind === "table" ? {
		...i,
		kind: "table",
		tableOverlap: t.tableOverlap
	} : {
		...i,
		kind: t.kind
	};
	return e.floats.push(a), a;
}
//#endregion
//#region packages/docx/src/layout/floating-table-transaction.ts
function pb(e) {
	return e.xPt + e.widthPt;
}
function mb(e) {
	return e.yPt + e.heightPt;
}
function hb(e, t, n, r) {
	return e === "center" ? t + (n - t - r) / 2 : e === "right" || e === "outside" ? n - r : t;
}
function gb(e, t, n, r) {
	return e === "center" ? t + (n - t - r) / 2 : e === "bottom" || e === "outside" ? n - r : t;
}
function _b(e, t, n, r, i = !1) {
	let a = e.horzSpecified ? e.horzAnchor === "page" ? t.page : e.horzAnchor === "margin" ? t.margin : t.text : t.text, o = e.vertAnchor === "page" ? t.page : e.vertAnchor === "margin" ? t.margin : t.text, s = e.xAlign ? hb(e.xAlign, a.xPt, pb(a), n) : a.xPt + e.xPt, c = e.yAlign && e.vertAnchor !== "text" ? gb(e.yAlign, o.yPt, mb(o), r) : o.yPt + e.yPt;
	return !i && (e.vertAnchor === "page" || e.vertAnchor === "margin") && c + r > mb(o) && (c = Math.max(o.yPt, mb(o) - r)), Object.freeze({
		x: s,
		y: c,
		w: n,
		h: r
	});
}
function vb(e, t, n, r) {
	return _b(e, t, n, r);
}
function yb(e, t, n) {
	let r = e.child.columnWidthsPt.reduce((e, t) => e + t, 0), i = e.child.advancePt, a = e.positioning, o = Object.freeze({
		xPt: t,
		yPt: n,
		widthPt: r,
		heightPt: i
	}), s = Object.freeze({
		xPt: t - a.leftFromTextPt,
		yPt: n - a.topFromTextPt,
		widthPt: r + a.leftFromTextPt + a.rightFromTextPt,
		heightPt: i + a.topFromTextPt + a.bottomFromTextPt
	});
	return Object.freeze({
		kind: "resolved-floating-table-placement",
		occurrenceId: e.occurrenceId,
		xPt: t,
		yPt: n,
		bounds: o,
		exclusionBounds: s,
		overlap: e.overlap,
		child: e.child,
		source: e
	});
}
function bb(e, t) {
	let n = e.child.columnWidthsPt.reduce((e, t) => e + t, 0), r = e.child.advancePt, i = vb(e.positioning, t, n, r), a = Up(e.positioning);
	return yb(e, a.x && e.acquiredTextOffsetPt ? t.text.xPt + e.acquiredTextOffsetPt.xPt : i.x, a.y && e.acquiredTextOffsetPt ? t.text.yPt + e.acquiredTextOffsetPt.yPt : i.y);
}
function xb(e, t, n) {
	return Object.freeze({
		coordinateSpace: e.coordinateSpace,
		flowDomainId: e.flowDomainId,
		baseEntries: e.entries,
		baseNextParagraphId: e.nextParagraphId,
		nextParagraphId: n,
		entries: Object.freeze([...t])
	});
}
function Sb(e, t) {
	if (t.coordinateSpace !== e.coordinateSpace || t.flowDomainId !== e.flowDomainId || t.entries !== e.baseEntries || t.nextParagraphId !== e.baseNextParagraphId) throw Error("Floating table registry delta base/domain mismatch");
	let n = new Set(t.entries.map((e) => e.occurrenceId));
	if (e.entries.some((e) => n.has(e.occurrenceId))) throw Error("Floating table registry delta was already committed");
	if (e.nextParagraphId !== e.baseNextParagraphId + e.entries.length) throw Error("Floating table registry delta sequence mismatch");
}
function Cb(e, t, n = "logical-page-points", r = "logical-page") {
	let i = /* @__PURE__ */ new Set();
	for (let t of e) {
		if (i.has(t.occurrenceId)) throw Error(`Duplicate float registry occurrence: ${t.occurrenceId}`);
		i.add(t.occurrenceId);
	}
	return Object.freeze({
		coordinateSpace: n,
		flowDomainId: r,
		base: Object.freeze([...e]),
		delta: Object.freeze([]),
		nextParagraphId: t
	});
}
function wb(e, t, n) {
	let r = [...n.base, ...n.delta], i = r.find((t) => t.occurrenceId === e.occurrenceId);
	if (i) return Object.freeze({
		placement: Object.freeze({
			...yb(e, i.bounds.xPt, i.bounds.yPt),
			bounds: i.bounds,
			exclusionBounds: i.exclusionBounds
		}),
		transaction: n
	});
	let a = bb(e, t), o = Qa({
		moving: {
			occurrenceId: e.occurrenceId,
			kind: "table",
			tableOverlap: e.overlap,
			paragraphId: n.nextParagraphId,
			bounds: a.bounds,
			exclusionBounds: a.exclusionBounds
		},
		blockers: r.filter((e) => e.kind !== "shape" || e.wrap !== void 0).map(Ga),
		avoidance: Ua(e.overlap, n.nextParagraphId),
		rightBoundaryPt: pb(t.page),
		overlapEpsilonPt: Va,
		rightBoundarySlackPt: Ha
	}), s = yb(e, o.bounds.xPt, o.bounds.yPt), c = Object.freeze({
		kind: "table",
		occurrenceId: e.occurrenceId,
		overlap: e.overlap,
		paragraphId: n.nextParagraphId,
		bounds: s.bounds,
		exclusionBounds: s.exclusionBounds
	});
	return Object.freeze({
		placement: s,
		transaction: Object.freeze({
			coordinateSpace: n.coordinateSpace,
			flowDomainId: n.flowDomainId,
			base: n.base,
			delta: Object.freeze([...n.delta, c]),
			nextParagraphId: n.nextParagraphId + 1
		})
	});
}
//#endregion
//#region packages/docx/src/anchor-geometry.ts
function Tb(e, t, n) {
	let r = n.pageWidth, i = n.marginLeft, a = n.marginRight;
	switch (e ?? (t ? "margin" : "page")) {
		case "page": return {
			start: 0,
			end: r
		};
		case "leftMargin": return {
			start: 0,
			end: i
		};
		case "rightMargin": return {
			start: r - a,
			end: r
		};
		case "insideMargin": return {
			start: 0,
			end: i
		};
		case "outsideMargin": return {
			start: r - a,
			end: r
		};
		case "character":
		case "column": return {
			start: n.contentX,
			end: n.contentX + n.contentW
		};
		default: return {
			start: i,
			end: r - a
		};
	}
}
function Eb(e, t, n, r) {
	let i = r.marginTop, a = r.marginBottom;
	switch (e ?? (t ? "paragraph" : "page")) {
		case "page": return {
			start: 0,
			end: r.pageH
		};
		case "topMargin": return {
			start: 0,
			end: i
		};
		case "bottomMargin": return {
			start: r.pageH - a,
			end: r.pageH
		};
		case "paragraph":
		case "line": return {
			start: n,
			end: r.pageH
		};
		default: return {
			start: i,
			end: r.pageH - a
		};
	}
}
function Db(e, t, n, r, i, a, o, s) {
	let c = Tb(a, t, i);
	if (o != null) return c.start + (c.end - c.start) * o + n;
	if (!e) return c.start + n;
	let l = c.end - c.start, u = s ?? r, d = s == null ? 0 : n;
	switch (e) {
		case "center": return c.start + (l - u) / 2 + d;
		case "right":
		case "outside": return c.end - u + d;
		default: return c.start + d;
	}
}
function Ob(e, t, n, r, i, a, o, s, c) {
	let l = Eb(o, t, i, a);
	if (s != null) return l.start + (l.end - l.start) * s + n;
	if (!e) return l.start + n;
	let u = l.end - l.start, d = c ?? r, f = c == null ? 0 : n;
	switch (e) {
		case "center": return l.start + (u - d) / 2 + f;
		case "bottom":
		case "outside": return l.end - d + f;
		default: return l.start + f;
	}
}
//#endregion
//#region packages/docx/src/layout/section-orientation.ts
function kb(e) {
	return Ab(e.textDirection);
}
function Ab(e) {
	return typeof e == "string" && bu(e);
}
function jb(e) {
	return e === "btLr";
}
function Mb(e) {
	return {
		...e,
		...vu(e)
	};
}
function Nb(e) {
	return {
		...e,
		...yu(e)
	};
}
//#endregion
//#region packages/docx/src/layout/measurement-environment.ts
function Pb(e) {
	for (let t of e.body) {
		if (t.type !== "paragraph") continue;
		let e = t;
		if (typeof e.defaultFontSize == "number") return e.defaultFontSize;
		for (let t of e.runs) if (t.type === "text") return t.fontSize;
	}
	return 10;
}
function Fb(e) {
	return {
		pageIndex: e.pageIndex,
		totalPages: e.totalPages,
		displayPageNumber: e.displayPageNumber,
		pageNumberFormat: e.pageNumberFormat,
		currentDateMs: e.currentDateMs,
		showTrackedChanges: e.showTrackedChanges,
		revisionAuthorColor: e.revisionAuthorColor,
		noteNumbers: e.noteNumbers,
		noteReferenceNumber: e.noteReferenceNumber,
		pageWritingMode: mi(e.sectionLayout.textDirection),
		verticalCJK: e.verticalCJK && !e.verticalAllRotated,
		verticalPageFrame: e.verticalCJK === !0,
		documentHasEastAsianText: e.docEastAsian,
		useFeLayout: e.layoutSettings.compat.useFeLayout,
		balanceSingleByteDoubleByteWidth: e.layoutSettings.compat.balanceSingleByteDoubleByteWidth,
		characterSpacingControl: e.layoutSettings.characterSpacingControl,
		resolvedLocalFonts: e.resolvedLocalFonts,
		layoutServices: e.layoutServices,
		verticalGlyphMeasurement: e.verticalGlyphMeasurement
	};
}
function Ib(e, t) {
	let n = rl(t);
	return {
		type: n ? n.type : t.lineGrid.active ? e.sectionLayout.grid.kind : null,
		linePitchPt: t.lineGrid.active ? t.lineGrid.pitchPt : null,
		characterPitchPt: n?.characterPitchPt ?? null,
		charSpacePt: n?.charSpacePt ?? null
	};
}
//#endregion
//#region packages/docx/src/layout/acquisition-state.ts
var Lb = Object.freeze({
	story: "body",
	containers: Object.freeze([]),
	lineNumberingEligible: !0
});
function Rb(e) {
	let t = Math.max(0, e.pageH - e.marginTop - e.marginBottom);
	return {
		page: {
			xPt: 0,
			yPt: 0,
			widthPt: e.pageWidth,
			heightPt: e.pageH
		},
		margin: {
			xPt: e.marginLeft,
			yPt: e.marginTop,
			widthPt: Math.max(0, e.pageWidth - e.marginLeft - e.marginRight),
			heightPt: t
		},
		column: {
			xPt: e.contentX,
			yPt: e.marginTop,
			widthPt: e.contentW,
			heightPt: t
		},
		pageParity: e.pageIndex % 2 == 0 ? "odd" : "even"
	};
}
function zb(e, t, n) {
	return ll(n, {
		numbering: t.numbering,
		...t.numbering ? { markerInput: e.acquisitionInputs.numberingMarkerShapeInput(t.numbering, Vs(t)) } : {},
		authoredFirstIndentPt: t.indentFirst,
		tabStops: t.tabStops,
		defaultTabPt: e.defaultTabPt,
		service: e.layoutServices?.text
	});
}
function Bb(e, t) {
	return zb(e, t, su(e.layoutSettings, e.sectionLayout, Lb, t));
}
function Vb(e, t) {
	return zb(e, t, su(e.layoutSettings, e.sectionLayout, e.storyContext ?? Lb, t));
}
function Hb(e) {
	return {
		...e,
		storyContext: Xl(e.storyContext ?? Lb)
	};
}
function Ub(e, t) {
	let n = e.retainedTablesBySourceIndex?.get(t);
	if (!n) throw Error("Table placement requires retained table acquisition");
	return n;
}
//#endregion
//#region packages/docx/src/layout/exact-length.ts
function Wb(e, t) {
	let n = e < 0n ? -e : e, r = t < 0n ? -t : t;
	for (; r !== 0n;) [n, r] = [r, n % r];
	return n === 0n ? 1n : n;
}
function Gb(e, t) {
	if (t === 0n) throw RangeError("Exact length denominator must not be zero");
	let n = t < 0n ? -1n : 1n, r = Wb(e, t);
	return Object.freeze({
		numerator: n * e / r,
		denominator: n * t / r
	});
}
var Kb = 768, qb = 1100;
function Jb(e) {
	let t = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(e);
	if (!t) return null;
	let n = t[1] === "-", r = t[2] ?? "", i = t[3] ?? t[4] ?? "", a = Number(t[5] ?? "0");
	if (!Number.isSafeInteger(a)) return null;
	let o = `${r}${i}`, s = 0;
	for (; s < o.length && o.charCodeAt(s) === 48;) s += 1;
	if (s === o.length) return Gb(0n, 1n);
	let c = o.length - 1;
	for (; c > s && o.charCodeAt(c) === 48;) --c;
	let l = o.slice(s, c + 1), u = o.length - 1 - c, d = a - i.length + u, f = d + l.length - 1;
	if (l.length > Kb || Math.abs(f) > qb) return null;
	let p = BigInt(l), m = 1n;
	return d >= 0 ? p *= 10n ** BigInt(d) : m = 10n ** BigInt(-d), n && (p = -p), Gb(p, m);
}
function Yb(e) {
	let t = /^(-?\d+)\/([1-9]\d*)$/.exec(e);
	if (!t) throw RangeError(`Invalid exact length key: ${e}`);
	return Gb(BigInt(t[1]), BigInt(t[2]));
}
function Xb(e) {
	let t = Gb(e.numerator, e.denominator);
	return `${t.numerator}/${t.denominator}`;
}
function Zb(e) {
	let t = Jb(e);
	return t ? Xb(t) : null;
}
function Qb(e) {
	if (!Number.isFinite(e) || e < 0) return null;
	let t = Jb(e.toString());
	return t ? Xb(t) : null;
}
function $b(e, t) {
	let n = e.toString(2).length - t.toString(2).length;
	return (n >= 0 ? e < t << BigInt(n) : e << BigInt(-n) < t) && --n, n;
}
function ex(e, t, n) {
	let r = n >= 0 ? e << BigInt(n) : e, i = n < 0 ? t << BigInt(-n) : t, a = r / i, o = r % i * 2n - i;
	return o > 0n || o === 0n && a % 2n != 0n ? a + 1n : a;
}
function tx(e) {
	let t = Yb(e);
	if (t.numerator === 0n) return 0;
	let n = t.numerator < 0n, r = n ? -t.numerator : t.numerator, i = $b(r, t.denominator), a;
	if (i < -1022) {
		let e = ex(r, t.denominator, 1074);
		a = Number(e) * Number.MIN_VALUE;
	} else {
		let e = ex(r, t.denominator, 52 - i);
		e === 1n << 53n && (e >>= 1n, i += 1), a = i > 1023 ? Infinity : Number(e) * 2 ** (i - 52);
	}
	return n ? -a : a;
}
function nx(e, t) {
	let n = Yb(e), r = Yb(t);
	return Xb(Gb(n.numerator * r.denominator + r.numerator * n.denominator, n.denominator * r.denominator));
}
function rx(e, t) {
	let n = Yb(e), r = Yb(t);
	return Xb(Gb(n.numerator * r.numerator, n.denominator * r.denominator));
}
function ix(e, t) {
	let n = Yb(e), r = Yb(t);
	return Xb(Gb(n.numerator * r.denominator - r.numerator * n.denominator, n.denominator * r.denominator));
}
function ax(e, t) {
	if (t === 0n) throw RangeError("Exact length divisor must not be zero");
	let n = Yb(e);
	return Xb(Gb(n.numerator, n.denominator * t));
}
function ox(e, t) {
	let n = Yb(e), r = Yb(t), i = n.numerator * r.denominator - r.numerator * n.denominator;
	return i < 0n ? -1 : +(i > 0n);
}
//#endregion
//#region packages/docx/src/layout/table-columns.ts
var $ = 1e-9;
function sx(e, t, n, r) {
	let i = Number.isFinite(e) ? Math.max(0, e) : 0, a = Math.max(0, t), o = a + Math.max(1, n);
	return {
		startPt: a === 0 ? i : i / 2,
		endPt: o >= Math.max(0, r) ? i : i / 2
	};
}
function cx(e) {
	return typeof e == "number" && Number.isFinite(e) ? Math.max(0, e) : 0;
}
function lx(e) {
	return e.map((e) => Math.abs(e) <= $ ? 0 : e);
}
function ux(e) {
	let t = e.gridWidthsPt.length;
	for (let n of e.rows) {
		for (let e of n.cells) t = Math.max(t, e.columnStart + Math.max(1, e.columnSpan));
		let e = n.cells.reduce((e, t) => Math.max(e, t.columnStart + Math.max(1, t.columnSpan)), n.before?.columnSpan ?? 0);
		t = Math.max(t, e + (n.after?.columnSpan ?? 0));
	}
	return t;
}
function dx(e, t, n) {
	let r = 0, i = Math.min(e.length, t + Math.max(1, n));
	for (let n = Math.max(0, t); n < i; n += 1) r += e[n] ?? 0;
	return r;
}
function fx(e, t) {
	return e ? e.kind === "pct" ? cx(e.value) * t : cx(e.value) : null;
}
function px(e, t, n, r) {
	let i = Math.max(0, t), a = Math.max(1, Math.min(n, e.length - i));
	if (a <= 0) return;
	let o = dx(e, i, a);
	if (o <= $) {
		e[i + a - 1] = r;
		return;
	}
	let s = r / o;
	for (let t = i; t < i + a; t += 1) e[t] = (e[t] ?? 0) * s;
}
function mx(e, t, n, r) {
	let i = Math.max(0, t), a = Math.max(1, Math.min(n, e.length - i));
	if (a <= 0) return;
	let o = dx(e, i, a);
	r <= o + $ || (e[i + a - 1] += r - o);
}
function hx(e, t) {
	let n = [];
	e.before && e.before.columnSpan > 0 && n.push({
		start: 0,
		span: e.before.columnSpan,
		preferred: e.before.preferredWidth
	});
	for (let t of e.cells) n.push({
		start: t.columnStart,
		span: t.columnSpan,
		preferred: t.preferredWidth
	});
	return e.after && e.after.columnSpan > 0 && n.push({
		start: Math.max(0, t - e.after.columnSpan),
		span: e.after.columnSpan,
		preferred: e.after.preferredWidth
	}), n;
}
function gx(e, t) {
	let n = Array.from({ length: t }, (t, n) => cx(e.gridWidthsPt[n] ?? 0)), r = n.reduce((e, t) => e + t, 0), i = e.tablePreferredWidthPt ?? (r > 0 ? r : cx(e.availableWidthPt));
	e.rows.forEach((e, r) => {
		for (let a of hx(e, t)) {
			let e = fx(a.preferred, i);
			e !== null && (r === 0 ? px(n, a.start, a.span, e) : mx(n, a.start, a.span, e));
		}
	}), e.tablePreferredWidthPt === null && _x(n, e.rows);
	let a = e.tablePreferredWidthPt, o = n.reduce((e, t) => e + t, 0);
	if (a !== null && a >= 0 && o <= $ && n.length > 0) return n.map(() => a / n.length);
	if (a !== null && a >= 0 && o > $) {
		let e = a / o;
		return n.map((t) => t * e);
	}
	return n;
}
function _x(e, t) {
	let n = Array(e.length).fill(0);
	for (let r of t) for (let t of r.cells) {
		if (t.columnSpan !== 1 || t.preferredWidth?.kind !== "pct") continue;
		let r = t.columnStart;
		r < 0 || r >= e.length || (n[r] = Math.max(n[r] ?? 0, cx(t.preferredWidth.value)));
	}
	let r = e.reduce((e, t) => e + t, 0), i = n.map((t, n) => t * r > e[n] + $), a = /* @__PURE__ */ new Set();
	for (; i.some(Boolean);) {
		let t = i.map((e) => e ? "1" : "0").join("");
		if (a.has(t)) return;
		a.add(t);
		let o = 0, s = 0;
		for (let t = 0; t < e.length; t += 1) i[t] ? s += n[t] ?? 0 : o += e[t] ?? 0;
		if (s >= 1 - $) return;
		r = o / (1 - s);
		let c = n.map((t, n) => t * r > e[n] + $);
		if (c.every((e, t) => e === i[t])) {
			for (let t = 0; t < e.length; t += 1) i[t] && (e[t] = n[t] * r);
			return;
		}
		i = c;
	}
}
function vx(e, t, n) {
	let r = Array(t).fill(0), i = Array(t).fill(0);
	for (let n of e) for (let e of n.cells) e.columnSpan !== 1 || e.columnStart < 0 || e.columnStart >= t || (r[e.columnStart] = Math.max(r[e.columnStart] ?? 0, cx(e.minContentWidthPt)), i[e.columnStart] = Math.max(i[e.columnStart] ?? 0, cx(e.maxContentWidthPt)));
	let a = Array(t).fill(!1);
	for (let o of e) for (let e of o.cells) {
		let o = e.columnStart;
		if (e.columnSpan !== 1 || o < 0 || o >= t || a[o] || e.preferredWidth === null) continue;
		let s = fx(e.preferredWidth, n);
		s !== null && (i[o] = Math.max(r[o] ?? 0, s), a[o] = !0);
	}
	for (let e = 0; e < t; e += 1) i[e] = Math.max(r[e] ?? 0, i[e] ?? 0);
	return {
		minimums: r,
		maximums: i
	};
}
function yx(e, t, n, r, i) {
	let a = Math.min(e.length, n + r), o = e.map((e, t) => t).filter((e) => e < n || e >= a), s = o.map((n) => Math.max(0, e[n] - (t[n] ?? 0))), c = s.reduce((e, t) => e + t, 0), l = Math.min(i, c);
	return l <= $ || c <= $ ? 0 : (o.forEach((t, n) => {
		e[t] -= l * ((s[n] ?? 0) / c);
	}), l);
}
function bx(e, t, n, r) {
	if (r <= $ || n <= 0) return;
	let i = dx(e, t, n);
	for (let a = 0; a < n; a += 1) {
		let o = t + a, s = i > $ ? (e[o] ?? 0) / i : 1 / n;
		e[o] += r * s;
	}
}
function xx(e) {
	let t = ux(e);
	if (e.layout === "fixed") {
		let n = gx(e, t).reduce((e, t) => e + t, 0);
		return Object.freeze({
			minWidthPt: n,
			maxWidthPt: n
		});
	}
	let n = Array(t).fill(0), r = Array(t).fill(0), i = e.rows.flatMap((e) => e.cells).sort((e, t) => e.columnSpan - t.columnSpan), a = (e, t, n) => {
		let r = Math.max(0, t.columnStart), i = Math.max(1, Math.min(t.columnSpan, e.length - r));
		if (i <= 0) return;
		let a = cx(n) - dx(e, r, i);
		a > $ && bx(e, r, i, a);
	};
	for (let e of i) a(n, e, e.minContentWidthPt), a(r, e, Math.max(e.minContentWidthPt, e.maxContentWidthPt));
	let o = n.reduce((e, t) => e + t, 0), s = Math.max(o, r.reduce((e, t) => e + t, 0));
	return Object.freeze({
		minWidthPt: o,
		maxWidthPt: s
	});
}
function Sx(e, t, n, r) {
	let i = Math.max(0, r.columnStart), a = Math.max(1, Math.min(r.columnSpan, e.length - i));
	if (a <= 0) return;
	let o = cx(r.minContentWidthPt), s = dx(e, i, a);
	if (o <= s + $) return;
	let c = a === 1 ? n[i] ?? o : Math.max(o, cx(r.maxContentWidthPt));
	bx(e, i, a, yx(e, t, i, a, Math.max(0, c - s)));
	let l = dx(e, i, a);
	l < o - $ && bx(e, i, a, o - l);
}
function Cx(e, t, n, r) {
	let i = e.reduce((e, t) => e + t, 0);
	if (i <= r + $ || i <= $) return e;
	let a = [...e], o = a.map((e, n) => Math.max(0, e - (t[n] ?? 0))), s = o.reduce((e, t) => e + t, 0), c = Math.min(i - r, s);
	c > $ && s > $ && a.forEach((e, t) => {
		a[t] -= c * ((o[t] ?? 0) / s);
	});
	for (let e of n) {
		if (e.columnSpan <= 1) continue;
		let n = Math.max(0, e.columnStart), r = Math.max(1, Math.min(e.columnSpan, a.length - n)), i = cx(e.minContentWidthPt) - dx(a, n, r);
		if (i <= $) continue;
		let o = yx(a, t, n, r, i);
		bx(a, n, r, o), o < i - $ && bx(a, n, r, i - o);
	}
	let l = a.reduce((e, t) => e + t, 0);
	if (l <= r + $ || l <= $) return lx(a);
	let u = Math.max(0, r) / l;
	return lx(a.map((e) => e * u));
}
function wx(e) {
	let t = ux(e);
	if (t === 0) return Object.freeze([]);
	let n = gx(e, t);
	if (e.layout === "fixed") {
		if (e.availableWidthPt === null) return Object.freeze(n);
		let t = n.reduce((e, t) => e + t, 0), r = cx(e.availableWidthPt);
		if (t <= r + $ || t <= $) return Object.freeze(n);
		let i = r / t;
		return Object.freeze(lx(n.map((e) => e * i)));
	}
	let r = n.reduce((e, t) => e + t, 0), { minimums: i, maximums: a } = vx(e.rows, t, r), o = e.rows.flatMap((e) => e.cells);
	o.sort((e, t) => e.columnSpan - t.columnSpan);
	for (let e of o) Sx(n, i, a, e);
	return Object.freeze(Cx(n, i, o, cx(e.availableWidthPt)));
}
function Tx(e) {
	let t = wx(e), n = t.map((t, n) => {
		let r = t !== e.gridWidthsPt[n];
		return !r && e.gridWidthKeys?.[n] === null ? null : !r && e.gridWidthKeys?.[n] !== void 0 ? e.gridWidthKeys[n] : Qb(t) ?? "0/1";
	});
	return Object.freeze({
		widthsPt: Object.freeze([...t]),
		widthKeys: Object.freeze(n)
	});
}
function Ex(e) {
	return Tx(e).widthsPt;
}
//#endregion
//#region packages/docx/src/layout/table-cell-blocks.ts
function Dx(e, t) {
	if (t !== e.length - 1 || t === 0) return !1;
	let n = e[t], r = e[t - 1];
	return n?.type === "paragraph" && r?.type === "table" && n.runs.length === 0;
}
function Ox(e, t) {
	let { cell: n, table: r, cellTotalWidthPt: i, outerState: a, sourcePath: o } = e, s = t.resolveContentWidthPt(n, r, i), c = t.createCellState(a, s, n), l = [];
	for (let e = 0; e < n.content.length; e += 1) {
		let r = n.content[e];
		if (!r) continue;
		let i = [...o, e];
		if (r.type === "paragraph") {
			let a = n.content[e - 1], o = n.content[e + 1], u = r, d = t.acquireParagraph(c, u, s, i, Vl(a?.type === "paragraph" ? a : null, u, o?.type === "paragraph" ? o : null));
			l.push(d), t.advanceState(c, d.advancePt);
			continue;
		}
		let a = r, u = r;
		l.push(t.acquireNestedTable(c, a, s, i, {
			fromPrevious: u.nestedSliceContinuesFromPrevious ?? !1,
			onNext: u.nestedSliceContinuesOnNext ?? !1
		}, (e, n, r, i, a) => Ox({
			cell: e,
			table: n,
			cellTotalWidthPt: r,
			outerState: i,
			sourcePath: a
		}, t)));
	}
	return l;
}
//#endregion
//#region packages/docx/src/cell-border-conflict.ts
function kx(e) {
	return wl(e.style, e.width);
}
function Ax(e) {
	let t = Sl.indexOf(e);
	return t === -1 ? Sl.length : t;
}
function jx(e) {
	if (!e) return {
		r: 0,
		g: 0,
		b: 0
	};
	let t = e.replace(/^#/, "");
	return t.length !== 6 || /[^0-9a-fA-F]/.test(t) ? {
		r: 0,
		g: 0,
		b: 0
	} : {
		r: parseInt(t.slice(0, 2), 16),
		g: parseInt(t.slice(2, 4), 16),
		b: parseInt(t.slice(4, 6), 16)
	};
}
function Mx(e, t) {
	let n = jx(e), r = jx(t), i = (e) => e.r + e.b + 2 * e.g, a = (e) => e.b + 2 * e.g, o = (e) => e.g;
	for (let e of [
		i,
		a,
		o
	]) {
		let t = e(n) - e(r);
		if (t !== 0) return t;
	}
	return 0;
}
function Nx(e, t) {
	let n = (e) => e && e.spec.style !== "nil" && e.spec.style !== "none" ? e : null, r = n(e), i = n(t);
	if (!r && !i) return null;
	if (!r) return i;
	if (!i || r.source === "cell" && i.source === "table") return r;
	if (i.source === "cell" && r.source === "table") return i;
	let a = kx(r.spec), o = kx(i.spec);
	if (a !== o) return a > o ? r : i;
	let s = Ax(r.spec.style), c = Ax(i.spec.style);
	if (s !== c) return s < c ? r : i;
	let l = Mx(r.spec.color, i.spec.color);
	return l === 0 || l < 0 ? r : i;
}
//#endregion
//#region packages/docx/src/layout/table-border-layer.ts
function Px(...e) {
	for (let t of e) if (t && gl(t.authoredStyle)) return t;
	return null;
}
//#endregion
//#region packages/docx/src/layout/table.ts
function Fx(e) {
	return Math.max(0, e.advancePt - e.spacing.beforePt - e.spacing.afterPt);
}
function Ix(e) {
	let t = [], n = 0, r = null, i = 0, a, o = 0, s = null, c = null;
	for (let l of e) {
		let e = l.layout;
		if (e.kind === "paragraph") {
			let u = e.spacing.beforePt, d = e.spacing.afterPt, f = r ? vg(r, e, i, u) : u, p = l.structuralTrailing ? 0 : Fx(e), m = n + (l.structuralTrailing ? 0 : f);
			if (t.push({
				layout: e,
				offsetPt: m,
				advancePt: p
			}), l.structuralTrailing || (n = m + p, a ??= m, o = Math.max(o, n), r = e, i = d), e.cellContainmentBounds) {
				let t = m + e.cellContainmentBounds.yPt - e.flowBounds.yPt, n = t + e.cellContainmentBounds.heightPt;
				a = a === void 0 ? t : Math.min(a, t), o = Math.max(o, n), s = s === null ? t : Math.min(s, t), c = c === null ? n : Math.max(c, n);
			}
			continue;
		}
		r && (n += i);
		let u = e.advancePt;
		t.push({
			layout: e,
			offsetPt: n,
			advancePt: u
		}), a ??= n, n += u, o = n, r = null, i = 0;
	}
	let l = n + (r ? i : 0), u = a ?? 0;
	return {
		blocks: t,
		flowHeightPt: l,
		inkTopPt: u,
		inkHeightPt: Math.max(0, o - u),
		cellContainmentTopPt: s,
		cellContainmentBottomPt: c
	};
}
function Lx(e) {
	let t = e.cellContainmentTopPt ?? 0, n = e.cellContainmentBottomPt ?? 0;
	return Math.max(e.flowHeightPt, n) - Math.min(0, t);
}
function Rx(e) {
	return Lx(Ix(e));
}
function zx(e) {
	return Number.isFinite(e?.cellSpacingPt) ? Math.max(0, e?.cellSpacingPt ?? 0) : 0;
}
function Bx(e, t) {
	let n = zx(e[t]), r = zx(e[t - 1]), i = zx(e[t + 1]);
	return {
		topPt: t === 0 ? n : Math.max(r, n) / 2,
		bottomPt: t === e.length - 1 ? n : Math.max(n, i) / 2
	};
}
function Vx(e, t, n) {
	return n.topPt + e.margins.topPt + Lx(t) + e.margins.bottomPt + n.bottomPt;
}
function Hx(e, t, n, r) {
	let i = t;
	for (let a = t + 1; a < e.length && e[a]?.cells.find((e) => e.columnStart === n && e.columnSpan === r && e.verticalMerge === "continue"); a += 1) i = a;
	return i;
}
function Ux(e) {
	return e.heightRule === "exact" ? ml(e.heightPt, e.cells.map((e) => e.margins.bottomPt)) : e.heightRule === "atLeast" ? Math.max(0, e.heightPt ?? 0) : 0;
}
function Wx(e, t, n) {
	let r = e.map((e) => Ux(e)), i = e.map((n, r) => Math.max(0, ...n.cells.filter((e) => e.verticalMerge !== "continue").map((n) => {
		let i = n.verticalMerge === "restart" ? Hx(e, r, n.columnStart, n.columnSpan) : r, a = Bx(e, r), o = Bx(e, i);
		return Vx(n, t.get(n.id) ?? Ix([]), {
			topPt: a.topPt,
			bottomPt: o.bottomPt
		});
	})));
	e.forEach((n, i) => {
		let a = Bx(e, i);
		for (let e of n.cells) {
			if (e.verticalMerge !== "none") continue;
			let o = Vx(e, t.get(e.id) ?? Ix([]), a);
			n.heightRule !== "exact" && (r[i] = Math.max(r[i] ?? 0, o));
		}
	});
	let a = [];
	e.forEach((n, r) => {
		for (let i of n.cells) i.verticalMerge === "restart" && a.push({
			start: r,
			end: Hx(e, r, i.columnStart, i.columnSpan),
			requiredPt: Vx(i, t.get(i.id) ?? Ix([]), {
				topPt: Bx(e, r).topPt,
				bottomPt: Bx(e, Hx(e, r, i.columnStart, i.columnSpan)).bottomPt
			})
		});
	}), a.sort((e, t) => e.end - t.end || e.start - t.start);
	for (let t of a) {
		let n = 0;
		for (let e = t.start; e <= t.end; e += 1) n += r[e] ?? 0;
		let i = t.requiredPt - n;
		if (!(i <= 0)) {
			for (let n = t.end; n >= t.start; --n) if (e[n]?.heightRule !== "exact") {
				r[n] = (r[n] ?? 0) + i;
				break;
			}
		}
	}
	return e.forEach((e, t) => {
		e.heightRule !== "exact" && (r[t] = (r[t] ?? 0) + (n[t] ?? 0));
	}), {
		heights: r,
		contentHeights: i
	};
}
function Gx(e, t) {
	return e ? {
		source: t,
		spec: {
			width: e.widthPt,
			color: e.color,
			style: e.authoredStyle
		}
	} : null;
}
function Kx(e, t, n, r, i, a, o, s) {
	let c = (e, t, n, r, i, a, o) => {
		let s = Px(e, o ? t : null);
		return s ? Gx(s, "cell") : Gx(o ? Px(r, a) : Px(n, i), "table");
	}, l = c(e.borders.top, e.borders.insideH, n?.top ?? null, n?.insideH ?? null, t.top, t.insideH, r !== 0), u = c(e.borders.bottom, e.borders.insideH, n?.bottom ?? null, n?.insideH ?? null, t.bottom, t.insideH, i !== a - 1), d = c(e.borders.left, e.borders.insideV, n?.left ?? null, n?.insideV ?? null, t.left, t.insideV, e.columnStart !== 0), f = c(e.borders.right, e.borders.insideV, n?.right ?? null, n?.insideV ?? null, t.right, t.insideV, e.columnStart + e.columnSpan !== o);
	return s ? {
		top: l,
		right: d,
		bottom: u,
		left: f
	} : {
		top: l,
		right: f,
		bottom: u,
		left: d
	};
}
function qx(e) {
	return e ? {
		widthPt: e.spec.width,
		color: e.spec.color ?? "#000000",
		authoredStyle: e.spec.style
	} : null;
}
function Jx(e, t, n) {
	let r = qx(Nx(e, t));
	return r ? {
		border: r,
		edge: n
	} : null;
}
function Yx(e) {
	let t = e.columnWidthsPt.length, n = [], r = e.rows.map(() => Array(t).fill(-1));
	return e.rows.forEach((i, a) => {
		for (let o of i.cells) {
			if (o.verticalMerge === "continue") continue;
			let i = o.verticalMerge === "restart" ? Hx(e.rows, a, o.columnStart, o.columnSpan) : a, s = n.length;
			n.push({
				input: o,
				rowIndex: a,
				lastRowIndex: i
			});
			let c = Math.min(t, o.columnStart + o.columnSpan);
			for (let e = a; e <= i; e += 1) for (let t = Math.max(0, o.columnStart); t < c; t += 1) r[e][t] = s;
		}
	}), {
		owners: n,
		occupancy: r
	};
}
function Xx(e, t) {
	return t.lastRowIndex === t.rowIndex ? t.input : e.rows[t.lastRowIndex]?.cells.find((e) => e.columnStart === t.input.columnStart && e.columnSpan === t.input.columnSpan && e.verticalMerge === "continue") ?? t.input;
}
function Zx(e) {
	let t = e.rows.length, n = e.columnWidthsPt.length, { owners: r, occupancy: i } = Yx(e), a = (i, a = !1) => {
		let o = r[i];
		if (!o) return null;
		let s = a ? Xx(e, o) : o.input, c = a && s !== o.input ? o.lastRowIndex : o.rowIndex;
		return Kx(s, e.borders, e.rows[c]?.exceptionBorders ?? null, o.rowIndex, o.lastRowIndex, t, n, e.bidiVisual);
	};
	return {
		horizontal: Array.from({ length: t + 1 }, (e, o) => Array.from({ length: n }, (e, n) => {
			let s = o > 0 ? i[o - 1]?.[n] ?? -1 : -1, c = o < t ? i[o]?.[n] ?? -1 : -1;
			if (s >= 0 && s === c) return null;
			let l = a(c), u = o === 0 ? "top" : o === t ? "bottom" : "between";
			return {
				above: {
					owner: r[s] ?? null,
					border: a(s, !0)?.bottom ?? null
				},
				below: {
					owner: r[c] ?? null,
					border: l?.top ?? null
				},
				edge: u
			};
		})),
		vertical: Array.from({ length: n + 1 }, (r, o) => Array.from({ length: t }, (t, r) => {
			let s = o > 0 ? i[r]?.[o - 1] ?? -1 : -1, c = o < n ? i[r]?.[o] ?? -1 : -1, l = e.bidiVisual ? c : s, u = e.bidiVisual ? s : c;
			return l >= 0 && l === u ? null : Jx(a(l)?.right ?? null, a(u)?.left ?? null, o === 0 ? e.bidiVisual ? "right" : "left" : o === n ? e.bidiVisual ? "left" : "right" : "between");
		})),
		occupancy: i
	};
}
function Qx(e, t) {
	return t.horizontal.map((t, n) => zx(e.rows[n - 1]) > 0 || zx(e.rows[n]) > 0 ? 0 : t.reduce((e, t) => {
		if (!t) return e;
		let n = Jx(t.above.border, t.below.border, t.edge);
		return Math.max(e, n?.border.widthPt ?? 0);
	}, 0));
}
function $x(e, t) {
	let n = Qx(e, t);
	return e.rows.map((e, t) => e.heightRule === "exact" ? 0 : hl(n[t] ?? 0, n[t + 1] ?? 0));
}
function eS(e) {
	return $x(e, Zx(e));
}
function tS(e, t, n) {
	return {
		edge: e.edge,
		from: t,
		to: n,
		color: e.border.color,
		widthPt: e.border.widthPt,
		...ki(e.border.authoredStyle, e.border.widthPt)
	};
}
var nS = Object.freeze({
	top: null,
	right: null,
	bottom: null,
	left: null,
	insideH: null,
	insideV: null
});
function rS(e) {
	let t = qx(e);
	return t && t.authoredStyle !== "nil" && t.authoredStyle !== "none" ? t : null;
}
function iS(e, t, n, r, i) {
	let a = [0];
	for (let t of e.columnWidthsPt) a.push((a.at(-1) ?? 0) + t);
	let o = [0];
	for (let e of r) o.push((o.at(-1) ?? 0) + e);
	let s = a.at(-1) ?? 0, c = (n, r) => (t[n] ?? 0) + (e.bidiVisual ? s - (a[r] ?? 0) : a[r] ?? 0), l = (e) => n + (o[e] ?? 0), u = [], d = (e, t, n, r) => {
		!e || e.authoredStyle === "nil" || e.authoredStyle === "none" || u.push(tS({
			border: e,
			edge: t
		}, n, r));
	}, f = /* @__PURE__ */ new Set(), p = (t, n, r, i) => {
		let a = t.owner;
		if (!a) return;
		let o = `${n}:${r}:${a.input.id}`;
		if (f.has(o)) return;
		f.add(o);
		let s = e.rows[a.rowIndex];
		if (!s) return;
		let u = zx(s), p = c(a.rowIndex, a.input.columnStart), m = c(a.rowIndex, Math.min(e.columnWidthsPt.length, a.input.columnStart + a.input.columnSpan)), { startPt: h, endPt: g } = sx(u, a.input.columnStart, a.input.columnSpan, e.columnWidthsPt.length), _ = Math.min(p, m) + (e.bidiVisual ? g : h), v = Math.max(p, m) - (e.bidiVisual ? h : g), y = l(a.rowIndex) + Bx(e.rows, a.rowIndex).topPt, b = l(a.lastRowIndex + 1) - Bx(e.rows, a.lastRowIndex).bottomPt, x = Kx(a.input, nS, null, a.rowIndex, a.lastRowIndex, e.rows.length, e.columnWidthsPt.length, e.bidiVisual), S = r === "top" ? x.top : x.bottom, C = r === "top" ? y : b;
		d(rS(S), i, {
			xPt: _,
			yPt: C
		}, {
			xPt: v,
			yPt: C
		});
	};
	return i.horizontal.forEach((n, r) => {
		let a = r > 0 && zx(e.rows[r - 1]) > 0, o = r < e.rows.length && zx(e.rows[r]) > 0;
		if (a || o) {
			let a = Math.max(zx(e.rows[r - 1]), zx(e.rows[r])), u = o ? r : r - 1, f = t[u] ?? 0, m = r === 0 ? "top" : r === e.rows.length ? "bottom" : "between";
			r === 0 || r === e.rows.length ? d(Px(r === 0 ? e.rows[0]?.exceptionBorders?.top ?? null : e.rows.at(-1)?.exceptionBorders?.bottom ?? null, r === 0 ? e.borders.top : e.borders.bottom), m, {
				xPt: f,
				yPt: l(r)
			}, {
				xPt: f + s,
				yPt: l(r)
			}) : n.forEach((t, n) => {
				let o = i.occupancy[r - 1]?.[n] ?? -1, s = i.occupancy[r]?.[n] ?? -1;
				if (!t || !(o !== s && (o >= 0 || s >= 0)) || [{
					side: t.above,
					directEdge: "bottom"
				}, {
					side: t.below,
					directEdge: "top"
				}].some(({ side: e, directEdge: t }) => {
					let n = e.owner;
					return n ? vl({
						spacingPt: a,
						directStyle: n.input.borders[t]?.authoredStyle,
						conditionalInsideStyle: n.input.borders.insideH?.authoredStyle
					}) : !1;
				})) return;
				let f = c(u, n), p = c(u, n + 1), h = Px(e.rows[r - 1]?.exceptionBorders?.insideH ?? null, e.borders.insideH), g = Px(e.rows[r]?.exceptionBorders?.insideH ?? null, e.borders.insideH);
				d(Jx(Gx(h, "table"), Gx(g, "table"), m)?.border ?? null, m, {
					xPt: Math.min(f, p),
					yPt: l(r)
				}, {
					xPt: Math.max(f, p),
					yPt: l(r)
				});
			}), n.forEach((e) => {
				e && (p(e.above, r, "bottom", e.edge), p(e.below, r, "top", e.edge));
			});
			return;
		}
		let f = [], m = /* @__PURE__ */ new Map();
		n.forEach((t) => {
			if (!t) return;
			let n = (t, n) => {
				if (!n.owner || !n.border) return;
				let r = `${t}:${n.owner.input.id}`;
				if (m.has(r)) return;
				let i = c(n.owner.rowIndex, n.owner.input.columnStart), a = c(n.owner.rowIndex, Math.min(e.columnWidthsPt.length, n.owner.input.columnStart + n.owner.input.columnSpan));
				m.set(r, {
					side: t,
					border: n.border,
					leftPt: Math.min(i, a),
					rightPt: Math.max(i, a)
				});
			};
			n("above", t.above), n("below", t.below);
		});
		let h = [...m.values()], g = [...new Set(h.flatMap((e) => [e.leftPt, e.rightPt]))].sort((e, t) => e - t), _ = r === 0 ? "top" : r === e.rows.length ? "bottom" : "between";
		for (let e = 1; e < g.length; e += 1) {
			let t = g[e - 1] ?? 0, n = g[e] ?? t;
			if (n <= t) continue;
			let r = (t + n) / 2, i = h.filter((e) => r > e.leftPt && r < e.rightPt), a = Jx(i.find((e) => e.side === "above")?.border ?? null, i.find((e) => e.side === "below")?.border ?? null, _);
			a && f.push({
				resolved: a,
				leftPt: t,
				rightPt: n
			});
		}
		f.sort((e, t) => e.leftPt - t.leftPt);
		let v = [];
		for (let e of f) {
			let t = v.at(-1);
			t && t.rightPt === e.leftPt && t.resolved.edge === e.resolved.edge && t.resolved.border.widthPt === e.resolved.border.widthPt && t.resolved.border.color === e.resolved.border.color && t.resolved.border.authoredStyle === e.resolved.border.authoredStyle ? t.rightPt = e.rightPt : v.push({ ...e });
		}
		for (let e of v) u.push(tS(e.resolved, {
			xPt: e.leftPt,
			yPt: l(r)
		}, {
			xPt: e.rightPt,
			yPt: l(r)
		}));
	}), i.vertical.forEach((t, n) => {
		t.forEach((t, r) => {
			zx(e.rows[r]) > 0 || t && u.push(tS(t, {
				xPt: c(r, n),
				yPt: l(r)
			}, {
				xPt: c(r, n),
				yPt: l(r + 1)
			}));
		});
	}), e.rows.forEach((n, r) => {
		let a = zx(n);
		if (a <= 0) return;
		let o = l(r), u = l(r + 1), f = t[r] ?? 0;
		d(Px(n.exceptionBorders?.left ?? null, e.borders.left), "left", {
			xPt: f,
			yPt: o
		}, {
			xPt: f,
			yPt: u
		}), d(Px(n.exceptionBorders?.right ?? null, e.borders.right), "right", {
			xPt: f + s,
			yPt: o
		}, {
			xPt: f + s,
			yPt: u
		});
		let p = /* @__PURE__ */ new Set();
		for (let e of n.cells) vl({
			spacingPt: a,
			directStyle: e.borders.left?.authoredStyle,
			conditionalInsideStyle: e.borders.insideV?.authoredStyle
		}) && p.add(e.columnStart), vl({
			spacingPt: a,
			directStyle: e.borders.right?.authoredStyle,
			conditionalInsideStyle: e.borders.insideV?.authoredStyle
		}) && p.add(e.columnStart + e.columnSpan);
		for (let t = 1; t < e.columnWidthsPt.length; t += 1) {
			let a = i.occupancy[r]?.[t - 1] ?? -1, s = i.occupancy[r]?.[t] ?? -1;
			if (!(a !== s && (a >= 0 || s >= 0))) continue;
			let l = c(r, t);
			p.has(t) || d(Px(n.exceptionBorders?.insideV ?? null, e.borders.insideV), "between", {
				xPt: l,
				yPt: o
			}, {
				xPt: l,
				yPt: u
			});
		}
		for (let t of n.cells) {
			if (t.verticalMerge === "continue") continue;
			let n = t.verticalMerge === "restart" ? Hx(e.rows, r, t.columnStart, t.columnSpan) : r, i = c(r, t.columnStart), o = c(r, Math.min(e.columnWidthsPt.length, t.columnStart + t.columnSpan)), { startPt: s, endPt: u } = sx(a, t.columnStart, t.columnSpan, e.columnWidthsPt.length), f = Math.min(i, o) + (e.bidiVisual ? u : s), p = Math.max(i, o) - (e.bidiVisual ? s : u), m = l(r) + Bx(e.rows, r).topPt, h = l(n + 1) - Bx(e.rows, n).bottomPt, g = Kx(t, nS, null, r, n, e.rows.length, e.columnWidthsPt.length, e.bidiVisual);
			d(rS(g.right), "right", {
				xPt: p,
				yPt: m
			}, {
				xPt: p,
				yPt: h
			}), d(rS(g.left), "left", {
				xPt: f,
				yPt: m
			}, {
				xPt: f,
				yPt: h
			});
		}
	}), u;
}
function aS(e, t, n, r, i) {
	let a = r.availableBounds, o = e === "center" ? a.xPt + (a.widthPt - i) / 2 : e === "right" ? a.xPt + a.widthPt - i : a.xPt;
	return t === 0 ? o : _l(o, t, n);
}
function oS(e, t) {
	if (t.length === 0) return e;
	let n = Math.min(e.xPt, ...t.map((e) => Math.min(e.from.xPt, e.to.xPt) - e.widthPt / 2)), r = Math.min(e.yPt, ...t.map((e) => Math.min(e.from.yPt, e.to.yPt) - e.widthPt / 2)), i = Math.max(e.xPt + e.widthPt, ...t.map((e) => Math.max(e.from.xPt, e.to.xPt) + e.widthPt / 2)), a = Math.max(e.yPt + e.heightPt, ...t.map((e) => Math.max(e.from.yPt, e.to.yPt) + e.widthPt / 2));
	return {
		xPt: n,
		yPt: r,
		widthPt: i - n,
		heightPt: a - r
	};
}
function sS(e) {
	let t = /* @__PURE__ */ new Map();
	e.forEach((e, n) => {
		if (e.style !== "compound" || !e.edge || e.edge === "between") return;
		let r = `${e.authoredStyle}\u0000${e.color}\u0000${e.widthPt}`, i = t.get(r) ?? [];
		i.push({
			border: e,
			index: n
		}), t.set(r, i);
	});
	let n = [];
	for (let e of t.values()) {
		let t = (t) => e.filter((e) => e.border.edge === t), r = t("top"), i = t("right"), a = t("bottom"), o = t("left");
		if (!r.length || !i.length || !a.length || !o.length) continue;
		let s = Math.min(...r.flatMap(({ border: e }) => [e.from.xPt, e.to.xPt])), c = Math.max(...r.flatMap(({ border: e }) => [e.from.xPt, e.to.xPt])), l = r[0].border.from.yPt, u = a[0].border.from.yPt, d = (e, t, n, r) => {
			let i = e.map(({ border: e }) => r(e)).map(([e, t]) => [Math.min(e, t), Math.max(e, t)]).sort((e, t) => e[0] - t[0]);
			if (i[0]?.[0] !== t) return !1;
			let a = t;
			for (let e of i) {
				if (e[0] > a) return !1;
				a = Math.max(a, e[1]);
			}
			return a === n;
		};
		if (!(r.every(({ border: e }) => e.from.yPt === l && e.to.yPt === l) && a.every(({ border: e }) => e.from.yPt === u && e.to.yPt === u) && o.every(({ border: e }) => e.from.xPt === s && e.to.xPt === s) && i.every(({ border: e }) => e.from.xPt === c && e.to.xPt === c) && d(r, s, c, (e) => [e.from.xPt, e.to.xPt]) && d(a, s, c, (e) => [e.from.xPt, e.to.xPt]) && d(o, l, u, (e) => [e.from.yPt, e.to.yPt]) && d(i, l, u, (e) => [e.from.yPt, e.to.yPt]))) continue;
		let f = e[0].border;
		n.push({
			bounds: {
				xPt: s,
				yPt: l,
				widthPt: c - s,
				heightPt: u - l
			},
			border: {
				authoredStyle: f.authoredStyle,
				color: f.color,
				widthPt: f.widthPt,
				style: f.style
			},
			segmentIndexes: e.map(({ index: e }) => e)
		});
	}
	return n;
}
function cS(e, t) {
	let n = Math.max(e.xPt, t.xPt), r = Math.max(e.yPt, t.yPt), i = Math.min(e.xPt + e.widthPt, t.xPt + t.widthPt), a = Math.min(e.yPt + e.heightPt, t.yPt + t.heightPt);
	return i > n && a > r ? {
		xPt: n,
		yPt: r,
		widthPt: i - n,
		heightPt: a - r
	} : null;
}
function lS(e, t, n) {
	let r = e.layout, i = t + (r.kind === "table" ? r.flowBounds.xPt : 0), a = n + e.offsetPt + (r.kind === "table" ? r.flowBounds.yPt : 0), o = i - r.flowBounds.xPt, s = a - r.flowBounds.yPt;
	return {
		xPt: r.inkBounds.xPt + o,
		yPt: r.inkBounds.yPt + s,
		widthPt: r.inkBounds.widthPt,
		heightPt: r.inkBounds.heightPt
	};
}
function uS(e, t, n) {
	let r = B(e, "TableLayoutInput");
	if (r.columnWidthsPt.some((e) => !Number.isFinite(e) || e < 0)) throw TypeError("TableLayoutInput.columnWidthsPt must contain finite non-negative widths");
	let i = /* @__PURE__ */ new Map();
	r.rows.forEach((e) => e.cells.forEach((e) => {
		i.set(e.id, Ix(e.verticalMerge === "continue" ? [] : e.blocks));
	}));
	let a = Zx(r), o = Wx(r.rows, i, $x(r, a)), s = o.heights, c = r.columnWidthsPt.reduce((e, t) => e + t, 0), l = s.reduce((e, t) => e + t, 0), u = t.cursor.yPt, d = r.rows.map((e) => aS(e.alignment ?? r.alignment, Number.isFinite(e.indentPt) ? e.indentPt : r.indentPt, r.bidiVisual, t, c)), f = d[0] ?? aS(r.alignment, r.indentPt, r.bidiVisual, t, c), p = iS(r, d, u, s, a), m = sS(p), h = [0];
	for (let e of r.columnWidthsPt) h.push((h.at(-1) ?? 0) + e);
	let g = [0];
	for (let e of s) g.push((g.at(-1) ?? 0) + e);
	let _ = (e, t) => (d[e] ?? f) + (r.bidiVisual ? c - (h[t] ?? 0) : h[t] ?? 0), v = r.rows.map((e, n) => {
		let a = u + (g[n] ?? 0), l = s[n] ?? 0, p = d[n] ?? f, m = Bx(r.rows, n), h = zx(e), v = e.cells.map((e) => {
			let o = e.verticalMerge === "restart" ? Hx(r.rows, n, e.columnStart, e.columnSpan) : n, s = Bx(r.rows, o), c = u + (g[o + 1] ?? g[n + 1] ?? 0) - s.bottomPt, d = _(n, e.columnStart), f = _(n, Math.min(r.columnWidthsPt.length, e.columnStart + e.columnSpan)), p = Math.min(d, f), v = Math.max(d, f), { startPt: y, endPt: b } = sx(h, e.columnStart, e.columnSpan, r.columnWidthsPt.length), x = p + (r.bidiVisual ? b : y), S = v - (r.bidiVisual ? y : b), C = Math.max(0, S - x), w = a + m.topPt, T = e.verticalMerge === "restart" ? Math.max(0, c - w) : Math.max(0, l - m.topPt - m.bottomPt), E = i.get(e.id) ?? Ix([]), D = Math.max(0, T - e.margins.topPt - e.margins.bottomPt), O = e.margins.topPt - Math.min(0, E.inkTopPt), k = E.inkHeightPt >= D ? O : e.vAlign === "center" ? e.margins.topPt + (D - E.inkHeightPt) / 2 - E.inkTopPt : e.vAlign === "bottom" ? T - e.margins.bottomPt - E.inkHeightPt - E.inkTopPt : O, A = {
				xPt: x + e.margins.leftPt,
				yPt: w + k,
				widthPt: Math.max(0, C - e.margins.leftPt - e.margins.rightPt),
				heightPt: D
			}, j = {
				xPt: x,
				yPt: w,
				widthPt: C,
				heightPt: T
			}, M = e.verticalMerge !== "continue" && r.rows.slice(n, o + 1).every((e) => e.heightRule === "exact") ? yl(j, t.availableBounds) : void 0, N = e.verticalMerge === "continue" ? [] : E.blocks.map((e) => ({
				...e,
				offsetPt: k + e.offsetPt
			})), ee = td([j, ...N.map((e) => lS(e, A.xPt, j.yPt)).map((e) => M ? cS(e, M) : e).filter((e) => e !== null)]) ?? j;
			return {
				kind: "table-cell",
				id: e.id,
				source: e.source,
				flowDomainId: r.flowDomainId,
				ordinaryFlow: r.ordinaryFlow,
				flowBounds: j,
				inkBounds: ee,
				...M ? { clipBounds: M } : {},
				contentBounds: A,
				advancePt: T,
				verticalMerge: e.verticalMerge,
				vAlign: e.vAlign,
				...e.background ? { background: e.background } : {},
				blocks: N
			};
		}), y = {
			xPt: p,
			yPt: a,
			widthPt: c,
			heightPt: l
		}, b = td([y, ...v.map((e) => e.inkBounds)]) ?? y;
		return {
			kind: "table-row",
			id: e.id,
			source: e.source,
			flowDomainId: r.flowDomainId,
			ordinaryFlow: r.ordinaryFlow,
			flowBounds: y,
			inkBounds: b,
			advancePt: l,
			heightPt: l,
			contentHeightPt: o.contentHeights[n] ?? 0,
			...e.repeatedHeader ? { repeatedHeader: !0 } : {},
			cells: v
		};
	}), y = d.length > 0 ? Math.min(...d) : f, b = d.length > 0 ? Math.max(...d.map((e) => e + c)) : f + c, x = {
		xPt: y,
		yPt: u,
		widthPt: Math.max(0, b - y),
		heightPt: l
	}, S = td([x, ...v.map((e) => e.inkBounds)]) ?? x;
	return B({
		layout: {
			kind: "table",
			id: r.id,
			source: r.source,
			flowDomainId: r.flowDomainId,
			ordinaryFlow: r.ordinaryFlow,
			flowBounds: x,
			inkBounds: oS(S, p),
			advancePt: l,
			columnWidthsPt: r.columnWidthsPt,
			rows: v,
			borders: p,
			...m.length ? { compoundBorderFrames: m } : {}
		},
		nextCursor: {
			xPt: t.cursor.xPt,
			yPt: t.cursor.yPt + l
		}
	}, "TableLayoutResult");
}
//#endregion
//#region packages/docx/src/layout/table-acquisition.ts
function dS(e, t) {
	return t.has(e) ? !0 : (t.add(e), e.kind === "drawing" ? e.anchorLayer === void 0 : e.kind === "paragraph" ? e.lines.every((e) => e.placements.every((e) => e.kind !== "text" || e.dependency !== "page")) && e.drawings.every((e) => dS(e, t)) && e.textBoxes.every((e) => dS(e, t)) : e.kind === "textbox" || e.kind === "note" ? e.story.blocks.every((e) => dS(e, t)) : e.rows.every((e) => e.cells.every((e) => e.blocks.every((e) => dS(e.layout, t)))) && (e.floatingTables ?? []).every((e) => dS(e.child, t)) && (e.resolvedFloatingTables ?? []).every((e) => dS(e.child, t)));
}
function fS(e, t) {
	return e.input.rows.every((e) => e.cells.every((e) => e.blocks.every((e) => e.pageDependent !== !0 && dS(e.layout, t)))) && Object.values(e.nestedById).every((e) => fS(e, t));
}
function pS(e) {
	return fS(e, /* @__PURE__ */ new Set());
}
function mS(e, t) {
	let n = e.findIndex((e, n) => n > t && e.type === "paragraph" && e.framePr == null);
	if (n < 0) throw Error("A nested floating table requires a following regular paragraph anchor");
	return n;
}
function hS(e) {
	if (!e) return null;
	let t = e.color ?? "000000";
	return Object.freeze({
		widthPt: e.width,
		color: t.startsWith("#") ? t : `#${t}`,
		authoredStyle: e.style
	});
}
function gS(e) {
	return Object.freeze({
		top: hS(e.top),
		right: hS(e.right),
		bottom: hS(e.bottom),
		left: hS(e.left),
		insideH: hS(e.insideH),
		insideV: hS(e.insideV)
	});
}
function _S(e, t) {
	if (e === "center") return "center";
	let n = e === "right" || e === "end";
	return (t ? !n : n) ? "right" : "left";
}
function vS(e) {
	return e.lines.some((e) => e.placements.some((e) => e.kind === "text" && e.dependency === "page"));
}
function yS(e, t, n, r, i, a) {
	let o = Array.isArray(i) ? {
		story: "body",
		storyInstance: "body",
		path: i
	} : i, s = o.path, c = (e) => ({
		story: o.story,
		storyInstance: o.storyInstance,
		path: e
	}), l = a.layoutServices(r);
	if (!l) throw Error("Retained table acquisition requires layout services");
	let u = o.story === "body" && o.storyInstance === "body" ? `table:${s.join(".")}` : `${o.story}:${o.storyInstance}:table:${s.join(".")}`, d = a.tableFormat(e), f = e.bidiVisual === !0, p = d.firstRowException, m = p?.indentAuthored ? p.indentPt ?? 0 : e.tblInd ?? 0, h = {}, g = [], _ = e.rows.map((n, i) => {
		let o = d.rows[i], l = Math.max(0, Math.min(t.length, n.gridBefore ?? 0)), p = n.cells.map((n, d) => {
			let f = o?.cells[d]?.marginsPt ?? {
				top: n.marginTop ?? e.cellMarginTop,
				right: n.marginRight ?? e.cellMarginRight,
				bottom: n.marginBottom ?? e.cellMarginBottom,
				left: n.marginLeft ?? e.cellMarginLeft
			}, p = l, m = Math.min(Math.max(1, n.colSpan), Math.max(0, t.length - p));
			l += m;
			let _ = t.slice(p, p + m).reduce((e, t) => e + t, 0), v = sx(o?.cellSpacingPt ?? 0, p, m, t.length), y = [
				...s,
				i,
				d
			], b = `${u}:cell:${i}.${d}`, x = n.vMerge === !1 ? [] : Ox({
				cell: n,
				table: e,
				cellTotalWidthPt: _,
				outerState: r,
				sourcePath: y
			}, {
				resolveContentWidthPt: (e, t, n) => Math.max(0, n - v.startPt - v.endPt - f.left - f.right),
				createCellState: a.createCellState,
				acquireParagraph: (e, t, n, r, o) => a.acquireParagraph(e, t, n, r, `${u}:cell:${i}.${d}`, o, void 0, c(r)),
				acquireNestedTable: (e, t, r, i) => {
					let o = yS(t, a.resolveColumns(t, r, e), r, e, c(i), a);
					h[o.layout.id] = o;
					let s = a.tableFormat(t).positioning;
					if (s) {
						let r = i[i.length - 1], c = s, l = t.overlap === "never" ? "never" : "overlap", u = a.registerFloatingTable(e, {
							child: o.layout,
							positioning: c,
							overlap: l
						}), d = {
							hostCellId: b,
							sourceBlockIndex: r,
							anchorBlockIndex: mS(n.content, r),
							tableId: o.layout.id,
							overlap: l,
							positioning: c,
							...u == null ? {} : { acquiredTextOffsetPt: Object.freeze({ ...u }) }
						};
						g.push(d);
					}
					return o.layout;
				},
				advanceState: a.advanceState
			});
			return {
				id: b,
				source: c(y),
				columnStart: p,
				columnSpan: m,
				verticalMerge: n.vMerge === !0 ? "restart" : n.vMerge === !1 ? "continue" : "none",
				margins: {
					topPt: f.top,
					rightPt: f.right,
					bottomPt: f.bottom,
					leftPt: f.left
				},
				vAlign: n.vAlign,
				...n.background ? { background: { color: n.background.startsWith("#") ? n.background : `#${n.background}` } } : {},
				borders: gS(n.borders),
				blocks: x.flatMap((e, t) => {
					let r = n.content[t];
					return r?.type === "table" && a.tableFormat(r).ordinaryFlow === !1 ? [] : [{
						layout: e,
						sourceBlockIndex: t,
						...e.kind === "paragraph" && vS(e) ? { pageDependent: !0 } : {},
						...Dx(n.content, t) ? { structuralTrailing: !0 } : {}
					}];
				})
			};
		}), _ = o?.height?.rule ?? "auto";
		return {
			id: `${u}:row:${i}`,
			source: c([...s, i]),
			logicalRowIndex: i,
			cantSplit: o?.cantSplit ?? n.cantSplit === !0,
			heightPt: o?.height?.valuePt ?? null,
			heightRule: _,
			cellSpacingPt: o?.cellSpacingPt ?? 0,
			exceptionBorders: o?.exception?.borders ? gS(o.exception.borders) : null,
			alignment: _S(o?.justification ?? e.jc, f),
			indentPt: m,
			cells: p,
			repeatedHeader: o?.repeatedHeader ?? n.isHeader === !0
		};
	}), v = B({
		kind: "table",
		id: u,
		source: c([...s]),
		flowDomainId: u,
		ordinaryFlow: d.ordinaryFlow,
		alignment: _S(e.jc, f),
		indentPt: m,
		bidiVisual: f,
		columnWidthsPt: t,
		borders: gS(e.borders),
		rows: _
	}, "RetainedTableAcquisition.input"), y = {
		xPt: 0,
		yPt: 0,
		widthPt: n,
		heightPt: 1
	}, b = uS(v, {
		container: {
			id: u,
			kind: "tableCell",
			bounds: y
		},
		cursor: {
			xPt: 0,
			yPt: 0
		},
		availableBounds: y
	}, l).layout;
	return Object.freeze({
		input: v,
		layout: b,
		nestedById: Object.freeze(h),
		floatingTables: B(g, "RetainedTableAcquisition.floatingTables")
	});
}
//#endregion
//#region packages/docx/src/layout/adjacent-table-layout-input.ts
function bS(e, t, n) {
	return t === n ? e : Object.freeze({
		...e,
		left: e.right,
		right: e.left
	});
}
function xS(e, t, n) {
	let r = bS(e.borders, e.bidiVisual, n), i = t.exceptionBorders == null ? null : bS(t.exceptionBorders, e.bidiVisual, n);
	return i ? Object.freeze({
		top: Px(i.top, r.top),
		right: Px(i.right, r.right),
		bottom: Px(i.bottom, r.bottom),
		left: Px(i.left, r.left),
		insideH: Px(i.insideH, r.insideH),
		insideV: Px(i.insideV, r.insideV)
	}) : r;
}
var SS = class {
	nodes = [Object.freeze({ kind: "zero" })];
	interned = new Map([["Z", 0]]);
	intern(e, t) {
		let n = this.interned.get(e);
		if (n !== void 0) return n;
		let r = this.nodes.length;
		return this.nodes.push(Object.freeze(t)), this.interned.set(e, r), r;
	}
	token(e, t) {
		return this.intern(`T:${e}:${t}`, { kind: "token" });
	}
	add(e, t) {
		if (e === 0) return t;
		if (t === 0) return e;
		let n = this.nodes[e], r = this.nodes[t];
		return n.kind === "sub" && n.right === t ? n.left : r.kind === "sub" && r.right === e ? r.left : this.intern(`A:${e}:${t}`, {
			kind: "add",
			left: e,
			right: t
		});
	}
	subtract(e, t) {
		if (e === t) return 0;
		if (t === 0) return e;
		let n = this.nodes[t];
		return n.kind === "sub" && n.left === e ? n.right : this.intern(`S:${e}:${t}`, {
			kind: "sub",
			left: e,
			right: t
		});
	}
	divide(e, t) {
		return e === 0 ? 0 : this.intern(`D:${e}:${t}`, {
			kind: "div",
			value: e,
			divisor: t
		});
	}
};
function CS(e, t = 0) {
	return Object.freeze({
		position: e,
		sym: t,
		identity: `${e}|${t}`
	});
}
function wS(e, t, n) {
	return CS(nx(t.position, n.position), e.add(t.sym, n.sym));
}
function TS(e, t, n) {
	return CS(ix(t.position, n.position), e.subtract(t.sym, n.sym));
}
function ES(e, t, n) {
	return CS(ax(t.position, n), e.divide(t.sym, n));
}
function DS(e, t, n) {
	let r = [CS("0/1")];
	return t.columnWidthsPt.forEach((i, a) => {
		let o = t.columnWidthKeys?.[a], s = Qb(i) ?? "0/1", c = o === null ? CS(s, e.token(n, a)) : CS(o ?? s);
		r.push(wS(e, r.at(-1), c));
	}), Object.freeze(r);
}
function OS(e, t, n, r) {
	let i = TS(e, r, n);
	return t.alignment === "right" ? i : t.alignment === "center" ? ES(e, i, 2n) : CS("0/1");
}
function kS(e, t, n, r, i) {
	return wS(e, i, r ? TS(e, n, t) : t);
}
function AS(e, t) {
	if (e.length === 0) throw RangeError("Adjacent table group id must not be empty");
	if (t.length === 0) throw RangeError("Adjacent table group requires at least one table");
	if (t.some((e) => !e.ordinaryFlow)) throw Error("An absolutely positioned table cannot join an adjacent table group");
	let n = t[0], r = n.bidiVisual, i = new SS(), a = CS("0/1"), o = t.map((e, t) => DS(i, e, t)), s = o.map((e) => e.at(-1) ?? a), c = s.reduce((e, t) => ox(t.position, e.position) > 0 ? t : e, a), l = (e, t, n, a) => {
		let o = kS(i, e, t, n, a);
		return r ? TS(i, c, o) : o;
	}, u = [];
	t.forEach((e, t) => {
		let n = o[t], a = s[t], d = e.bidiVisual !== r;
		e.rows.forEach((t) => {
			let r = OS(i, t, a, c), o = n.map((t) => l(t, a, e.bidiVisual, r));
			u.push({
				input: e,
				row: t,
				groupBoundaries: o,
				descending: d
			});
		});
	});
	let d = /* @__PURE__ */ new Map();
	for (let e of [a, c]) d.set(e.identity, {
		boundary: e,
		count: 1
	});
	for (let e of u) {
		let t = /* @__PURE__ */ new Map();
		for (let n of e.groupBoundaries) {
			let e = t.get(n.identity);
			t.set(n.identity, {
				boundary: n,
				count: (e?.count ?? 0) + 1
			});
		}
		for (let [e, n] of t) {
			let t = d.get(e);
			n.count > (t?.count ?? 0) && d.set(e, n);
		}
	}
	let f = /* @__PURE__ */ new Map(), p = (e) => {
		let t = f.get(e);
		return t || (t = {
			position: e,
			identities: /* @__PURE__ */ new Map(),
			edges: /* @__PURE__ */ new Map(),
			firstSeen: /* @__PURE__ */ new Map()
		}, f.set(e, t)), t;
	};
	for (let [e, t] of d) p(t.boundary.position).identities.set(e, t);
	let m = 0;
	for (let e of u) {
		let t = e.descending ? [...e.groupBoundaries].reverse() : e.groupBoundaries, n = null, r = null;
		for (let e of t) {
			let t = p(e.position);
			if (t.firstSeen.has(e.identity) || t.firstSeen.set(e.identity, m++), n !== e.position && (n = e.position, r = null), r !== null && r !== e.identity) {
				let n = t.edges.get(r);
				n || (n = /* @__PURE__ */ new Set(), t.edges.set(r, n)), n.add(e.identity);
			}
			r = e.identity;
		}
	}
	for (let e of f.values()) for (let t of e.identities.keys()) e.firstSeen.has(t) || e.firstSeen.set(t, m++);
	let h = [...f.values()].sort((e, t) => ox(e.position, t.position)), g = [], _ = /* @__PURE__ */ new Map();
	for (let e of h) {
		let t = new Map([...e.identities.keys()].map((e) => [e, 0]));
		for (let n of e.edges.values()) for (let e of n) t.set(e, (t.get(e) ?? 0) + 1);
		let n = [], r = (t) => {
			n.push(t);
			let r = n.length - 1;
			for (; r > 0;) {
				let t = Math.floor((r - 1) / 2);
				if (e.firstSeen.get(n[t]) <= e.firstSeen.get(n[r])) break;
				[n[t], n[r]] = [n[r], n[t]], r = t;
			}
		}, i = () => {
			let t = n[0], r = n.pop();
			if (n.length > 0) {
				n[0] = r;
				let t = 0;
				for (;;) {
					let r = t * 2 + 1, i = r + 1;
					if (r >= n.length) break;
					let a = r;
					if (i < n.length && e.firstSeen.get(n[i]) < e.firstSeen.get(n[r]) && (a = i), e.firstSeen.get(n[t]) <= e.firstSeen.get(n[a])) break;
					[n[t], n[a]] = [n[a], n[t]], t = a;
				}
			}
			return t;
		};
		for (let n of e.identities.keys()) t.get(n) === 0 && r(n);
		let a = [];
		for (; n.length > 0;) {
			let n = i();
			a.push(n);
			for (let i of e.edges.get(n) ?? []) {
				let e = t.get(i) - 1;
				t.set(i, e), e === 0 && r(i);
			}
		}
		if (a.length !== e.identities.size) throw Error(`Adjacent table symbolic boundary ordering cycle at ${e.position}`);
		for (let t of a) {
			let { boundary: n, count: r } = e.identities.get(t);
			_.set(t, g.length);
			for (let e = 0; e < r; e += 1) g.push(n);
		}
	}
	let v = g.slice(1).map((e, t) => {
		let n = g[t];
		return e.sym === n.sym ? ix(e.position, n.position) : null;
	}), y = g.slice(1).map((e, t) => tx(ix(e.position, g[t].position))), b = (e, t) => {
		let n = /* @__PURE__ */ new Map(), r = Array(e.length);
		return e.forEach((e, i) => {
			let a = n.get(e.identity) ?? 0;
			n.set(e.identity, a + 1);
			let o = _.get(e.identity), s = d.get(e.identity).count;
			r[i] = t ? o + (s - 1 - a) : o + a;
		}), r;
	}, x = 0, S = u.map((e) => {
		let { input: t, row: n, groupBoundaries: i, descending: a } = e, o = b(i, a), s = o[0], c = o[i.length - 1], l = n.cells.map((e) => {
			let n = o[e.columnStart], i = o[e.columnStart + e.columnSpan];
			if (n == null || i == null) throw RangeError(`Table cell ${e.id} exceeds its authored grid`);
			let a = Math.min(n, i), s = Math.max(n, i);
			if (s <= a) throw Error(`Table cell ${e.id} cannot be mapped into the logical group grid`);
			let c = bS(e.borders, t.bidiVisual, r);
			return Object.freeze({
				...e,
				columnStart: a,
				columnSpan: s - a,
				borders: c
			});
		});
		return Object.freeze({
			...n,
			logicalRowIndex: x++,
			exceptionBorders: null,
			sourceTableEdges: xS(t, n, r),
			indentPt: t.bidiVisual === r ? n.indentPt : -n.indentPt,
			sourceOuterColumnStart: Math.min(s, c),
			sourceOuterColumnEnd: Math.max(s, c),
			cells: Object.freeze(l)
		});
	});
	return i.nodes.length, Object.freeze({
		kind: "adjacent-table-group-grid",
		id: e,
		source: n.source,
		flowDomainId: `${n.flowDomainId}:adjacent-group:${e}`,
		alignment: n.alignment,
		indentPt: n.indentPt,
		bidiVisual: r,
		columnWidthsPt: Object.freeze(y),
		columnWidthKeys: Object.freeze(v),
		rows: Object.freeze(S)
	});
}
//#endregion
//#region packages/docx/src/layout/table-pagination.ts
var jS = 1e-4;
function MS() {
	return Object.freeze({
		blockIndex: 0,
		paragraphLineStart: 0,
		nestedCursor: null,
		nestedFragmentIndex: 0
	});
}
function NS() {
	return Object.freeze({
		rowIndex: 0,
		rowFragmentIndex: 0,
		cells: Object.freeze([])
	});
}
function PS(e) {
	let t = 0;
	for (; e.rows[t]?.repeatedHeader === !0;) t += 1;
	return t;
}
function FS(e, t) {
	let n = e.layout.rows[t];
	return n ? e.input.rows[t]?.heightRule === "exact" ? Math.max(0, n.heightPt) : Math.max(0, n.heightPt, n.contentHeightPt) : 0;
}
function IS(e, t, n, r) {
	let i = e.layout.rows.flatMap((e) => e.cells).find((e) => e.id === t.id);
	if (!i) throw new V("INVALID_REFERENCE", `nested table fragment lost parent cell geometry: ${t.id}`);
	let a = Object.freeze({
		xPt: 0,
		yPt: 0,
		widthPt: i.contentBounds.widthPt,
		heightPt: Math.max(0, r)
	});
	return Object.freeze({
		...n,
		availableHeightPt: a.heightPt,
		placement: Object.freeze({
			...n.placement,
			container: Object.freeze({
				...n.placement.container,
				bounds: a
			}),
			cursor: Object.freeze({
				xPt: 0,
				yPt: 0
			}),
			availableBounds: a
		})
	});
}
function LS(e, t, n, r) {
	if (t === e.input.rows[n]) return FS(e, n);
	let i = uS({
		...e.input,
		id: `${e.input.id}:row-occurrence:${r.page.occurrenceId}:${t.logicalRowIndex}`,
		rows: [t]
	}, r.placement, r.services).layout;
	return Math.max(0, i.rows[0]?.heightPt ?? i.advancePt);
}
function RS(e, t, n, r) {
	return t === e.input.rows[n] ? Math.max(0, e.layout.rows[n]?.heightPt ?? 0) : LS(e, t, n, r);
}
function zS(e, t, n) {
	let r = n;
	for (let i = n; i <= r && i < t.length; i += 1) {
		let a = i === n ? e.cells : t[i].cells;
		for (let e of a) e.verticalMerge === "restart" && (r = Math.max(r, Hx(t, i, e.columnStart, e.columnSpan)));
	}
	return r;
}
function BS(e, t, n, r) {
	let i = e.input.rows, a = zS(t, i, n), o = Math.min(i.length, a + 2), s = uS({
		...e.input,
		id: `${e.input.id}:completed-partial:${r.page.occurrenceId}:${t.logicalRowIndex}`,
		rows: [t, ...i.slice(n + 1, o)]
	}, r.placement, r.services).layout;
	return Math.max(0, s.rows[0]?.heightPt ?? 0);
}
function VS(e) {
	return e.cells.map((e) => e.blocks.map((e) => ({
		kind: "whole",
		blockIndex: e.sourceBlockIndex
	})));
}
function HS(e, t, n, r) {
	let i = r.reacquirePageDependentBlock;
	return !i || !t.cells.some((e) => e.blocks.some((e) => e.pageDependent === !0)) ? t : {
		...t,
		cells: t.cells.map((e, a) => ({
			...e,
			blocks: e.blocks.map((e) => e.pageDependent === !0 ? {
				...e,
				layout: i({
					logicalRowIndex: t.logicalRowIndex,
					logicalCellIndex: a,
					sourceBlockIndex: e.sourceBlockIndex,
					ownership: n,
					page: r.page,
					acquired: e.layout
				})
			} : e)
		}))
	};
}
function US(e) {
	let t = e.positioning.horzSpecified && (e.positioning.horzAnchor === "page" || e.positioning.horzAnchor === "margin"), n = e.positioning.vertAnchor === "page" || e.positioning.vertAnchor === "margin";
	return t || n;
}
function WS(e, t, n, r, i) {
	return {
		...t,
		heightPt: null,
		heightRule: "auto",
		cells: t.cells.map((t, a) => {
			let o = n.cells[a] ?? MS();
			return {
				...t,
				blocks: t.blocks.slice(o.blockIndex).map((n, a) => {
					if (a === 0 && o.nestedCursor && n.layout.kind === "table") {
						let a = e.nestedById[n.layout.id];
						if (a) {
							let s = nC(a, o.nestedCursor, IS(e, t, r, r.freshPageHeightPt)), c = i.get(t.id);
							if (s.nextCursor && c !== void 0 && n.sourceBlockIndex < c) throw Error("Floating table anchor cannot follow an incomplete nested-table candidate");
							if (s.fragment) return {
								...n,
								layout: s.fragment
							};
						}
					}
					return a !== 0 || o.paragraphLineStart === 0 || n.layout.kind !== "paragraph" ? n : {
						...n,
						layout: ZS(n.layout, o.paragraphLineStart, n.layout.lines.length)
					};
				})
			};
		})
	};
}
function GS(e, t, n, r, i, a, o, s, c) {
	let l = i.floatingTableFrames, u = i.reacquirePageDependentBlock, d = e.input.rows[t.logicalRowIndex];
	if (!l || !u || !d) return {
		row: t,
		resolved: [],
		registry: a,
		nextParagraphId: o
	};
	let f = e.floatingTables.filter((e) => d.cells.some((t) => t.id === e.hostCellId) && c(e));
	if (f.length === 0) return {
		row: t,
		resolved: [],
		registry: a,
		nextParagraphId: o
	};
	let p = /* @__PURE__ */ new Map();
	for (let e of f) p.set(e.hostCellId, Math.min(p.get(e.hostCellId) ?? Infinity, e.anchorBlockIndex));
	let m = {
		...i.placement,
		cursor: {
			...i.placement.cursor,
			yPt: i.placement.cursor.yPt + r
		}
	}, h = WS(e, t, s, i, p), g = uS({
		...e.input,
		id: `${e.input.id}:float-probe:${i.page.occurrenceId}:${t.logicalRowIndex}`,
		rows: [h]
	}, m, i.services).layout, _ = i.finalPlacementTranslationPt ?? {
		xPt: 0,
		yPt: 0
	}, v = (t, r, a) => {
		let o = a.cells.findIndex((e) => e.id === t.hostCellId), s = r.rows[0]?.cells[o], c = a.cells[o]?.blocks.findIndex((e) => e.sourceBlockIndex === t.anchorBlockIndex) ?? -1, l = c < 0 ? void 0 : s?.blocks[c], u = e.nestedById[t.tableId]?.layout;
		return !s || !l || !u ? null : Object.freeze({
			kind: "floating-table-placement",
			occurrenceId: [
				i.page.occurrenceId,
				t.hostCellId,
				t.sourceBlockIndex,
				t.tableId
			].join(":"),
			ownership: n,
			physicalPageIndex: i.page.physicalPageIndex,
			displayPageNumber: i.page.displayPageNumber,
			...t,
			columnBounds: Object.freeze({
				xPt: s.contentBounds.xPt + _.xPt,
				yPt: s.contentBounds.yPt + _.yPt,
				widthPt: s.contentBounds.widthPt,
				heightPt: s.contentBounds.heightPt
			}),
			anchorBounds: Object.freeze({
				xPt: s.contentBounds.xPt + _.xPt,
				yPt: s.flowBounds.yPt + l.offsetPt + _.yPt,
				widthPt: l.layout.flowBounds.widthPt,
				heightPt: l.layout.flowBounds.heightPt
			}),
			child: u
		});
	}, y = (n) => {
		let r = WS(e, n, s, i, p), c = n === t ? g : uS({
			...e.input,
			id: `${e.input.id}:float-converge:${i.page.occurrenceId}:${t.logicalRowIndex}`,
			rows: [r]
		}, m, i.services).layout, u = Cb(a, o, i.floatingTableRegistry?.coordinateSpace ?? "logical-page-points", i.floatingTableRegistry?.flowDomainId ?? e.input.flowDomainId), d = [];
		for (let e of f) {
			let t = v(e, c, r);
			if (!t || i.floatingTableRegistry?.coordinateSpace !== "upright-physical-page-points" && !US(t)) continue;
			let n = wb(t, {
				page: l.page,
				margin: l.margin,
				text: {
					xPt: t.columnBounds?.xPt ?? t.anchorBounds.xPt,
					yPt: t.anchorBounds.yPt,
					widthPt: t.columnBounds?.widthPt ?? t.anchorBounds.widthPt,
					heightPt: t.anchorBounds.heightPt
				}
			}, u);
			d.push(n.placement), u = n.transaction;
		}
		return {
			resolved: Object.freeze(d),
			transaction: u
		};
	}, b = (e) => ({
		...t,
		cells: t.cells.map((r, a) => ({
			...r,
			blocks: r.blocks.map((o) => {
				let s = e.filter((e) => e.source.hostCellId === r.id && e.source.anchorBlockIndex === o.sourceBlockIndex).map((e) => Object.freeze({
					xPt: e.exclusionBounds.xPt - e.source.anchorBounds.xPt,
					yPt: e.exclusionBounds.yPt - e.source.anchorBounds.yPt,
					widthPt: e.exclusionBounds.widthPt,
					heightPt: e.exclusionBounds.heightPt
				}));
				return s.length === 0 || o.layout.kind !== "paragraph" ? o : {
					...o,
					layout: u({
						logicalRowIndex: t.logicalRowIndex,
						logicalCellIndex: a,
						sourceBlockIndex: o.sourceBlockIndex,
						ownership: n,
						page: i.page,
						acquired: o.layout,
						floatingTableExclusions: Object.freeze(s)
					})
				};
			})
		}))
	}), x = (e, t) => JSON.stringify({
		blocks: e.cells.map((e) => e.blocks.map((e) => ({
			sourceBlockIndex: e.sourceBlockIndex,
			layout: e.layout
		}))),
		placements: t
	}), S = y(t);
	if (S.resolved.length === 0) return {
		row: t,
		resolved: [],
		registry: a,
		nextParagraphId: o
	};
	try {
		let e = zo({
			seedState: x(t, S.resolved),
			step: (e) => {
				let t = b(e?.resolution.resolved ?? S.resolved), n = y(t);
				return Object.freeze({
					candidate: t,
					resolution: n,
					state: x(t, n.resolved)
				});
			},
			stateOf: (e) => e.state,
			limit: 16
		}).value;
		return {
			row: e.candidate,
			resolved: e.resolution.resolved,
			registry: Object.freeze([...e.resolution.transaction.base, ...e.resolution.transaction.delta]),
			nextParagraphId: e.resolution.transaction.nextParagraphId
		};
	} catch (e) {
		throw e instanceof Ro ? new V("NON_CONVERGENCE", `floating table final-frame reflow did not converge (${e.reason}; ${e.states.length} states)`) : e;
	}
}
function KS(e, t, n) {
	let r = e.input.rows[t.logicalRowIndex]?.cells.findIndex((e) => e.id === n.hostCellId) ?? -1;
	return r >= 0 && (t.ranges[r]?.some((e) => e.blockIndex === n.anchorBlockIndex && (e.kind === "whole" || e.kind === "paragraph" && e.lineStart === 0 || e.kind === "nested-table" && e.childFragmentIndex === 0)) ?? !1);
}
function qS(e) {
	return `${e.hostCellId}:${e.sourceBlockIndex}:${e.tableId}`;
}
function JS(e, t) {
	return new Set(e.floatingTables.filter((n) => KS(e, t, n)).map(qS));
}
function YS(e, t) {
	return e.size === t.size && [...e].every((e) => t.has(e));
}
function XS(e, t, n = 0, r = !1, i = []) {
	return {
		input: e,
		logicalRowIndex: e.logicalRowIndex,
		fragmentIndex: n,
		ownership: t,
		ranges: VS(e),
		...r ? { clipAtPageEnd: !0 } : {},
		...i.length ? { resolvedFloatingTables: i } : {}
	};
}
function ZS(e, t, n) {
	return Tv(e, {
		lineStart: t,
		lineEnd: n,
		continuesFromPrevious: t > 0,
		continuesOnNext: n < e.lines.length
	});
}
function QS(e, t, n, r, i) {
	let a = null, o = n;
	for (let s = n + 1; s <= e.lines.length; s += 1) {
		let c = ZS(e, n, s), l = {
			layout: c,
			sourceBlockIndex: t
		};
		if (Rx([...r, l]) > i + jS) break;
		a = c, o = s;
	}
	return a ? {
		block: {
			layout: a,
			sourceBlockIndex: t
		},
		range: {
			kind: "paragraph",
			blockIndex: t,
			lineStart: n,
			lineEnd: o
		},
		lineEnd: o,
		advancePt: a.advancePt
	} : {
		block: null,
		range: null,
		lineEnd: n,
		advancePt: 0
	};
}
function $S(e, t, n, r, i) {
	if (t.verticalMerge === "continue") return {
		input: t,
		range: [],
		next: n,
		complete: !0
	};
	let a = [], o = [], s = n.blockIndex, c = n.paragraphLineStart, l = n.nestedCursor, u = n.nestedFragmentIndex;
	for (; s < t.blocks.length;) {
		let n = t.blocks[s], d = n.layout;
		if (d.kind === "paragraph") {
			if (n.structuralTrailing) {
				a.push(n), o.push({
					kind: "whole",
					blockIndex: n.sourceBlockIndex
				}), s += 1, c = 0;
				continue;
			}
			if (d.lines.length === 0) {
				if (Rx([...a, n]) > r + jS) break;
				a.push(n), o.push({
					kind: "whole",
					blockIndex: n.sourceBlockIndex
				}), s += 1, c = 0;
				continue;
			}
			let e = QS(d, n.sourceBlockIndex, c, a, r);
			if (!e.block || !e.range) break;
			if (a.push({
				...e.block,
				...n.structuralTrailing ? { structuralTrailing: !0 } : {}
			}), o.push(e.range), e.lineEnd < d.lines.length) {
				c = e.lineEnd;
				break;
			}
			s += 1, c = 0;
			continue;
		}
		let f = e.nestedById[d.id];
		if (f) {
			let c = Math.max(0, r - Rx(a)), d = nC(f, l ?? NS(), IS(e, t, i, c));
			if (!d.fragment) break;
			if (a.push({
				layout: d.fragment,
				sourceBlockIndex: n.sourceBlockIndex
			}), o.push({
				kind: "nested-table",
				blockIndex: n.sourceBlockIndex,
				childFragmentIndex: u
			}), d.nextCursor) {
				l = d.nextCursor, u += 1;
				break;
			}
			s += 1, l = null, u = 0;
			continue;
		}
		if (Rx([...a, n]) > r + jS) break;
		a.push(n), o.push({
			kind: "whole",
			blockIndex: n.sourceBlockIndex
		}), s += 1;
	}
	let d = s >= t.blocks.length;
	return {
		input: {
			...t,
			blocks: a
		},
		range: o,
		next: Object.freeze({
			blockIndex: s,
			paragraphLineStart: c,
			nestedCursor: l,
			nestedFragmentIndex: u
		}),
		complete: d
	};
}
function eC(e, t, n, r, i) {
	let a = t.cells.map((e, t) => n.cells[t] ?? MS()), o = Math.max(0, ...t.cells.map((e) => e.margins.topPt + e.margins.bottomPt)), s = Math.max(0, t.cellSpacingPt) * 2, c = {
		...t,
		heightPt: null,
		heightRule: "auto"
	}, l = eS({
		...e.input,
		rows: [c]
	})[0] ?? 0, u = Math.max(0, r - o - s - l), d = t.cells.map((t, n) => $S(e, t, a[n], u, i)), f = (e, t) => e.next.blockIndex !== a[t]?.blockIndex || e.next.paragraphLineStart !== a[t]?.paragraphLineStart || e.next.nestedFragmentIndex !== a[t]?.nestedFragmentIndex, p = d.some((e, n) => !e.complete && !f(e, n) && t.cells[n]?.blocks[a[n]?.blockIndex ?? 0]?.layout.kind === "paragraph");
	if (xl({
		compatibility: i.compatibility,
		hasUnfinishedParagraphWithoutProgress: p
	}) || !d.some(f)) return {
		selected: null,
		next: n,
		complete: !1
	};
	let m = d.every((e) => e.complete);
	return m && n.rowFragmentIndex === 0 ? {
		selected: XS(t, "source"),
		next: Object.freeze({
			rowIndex: n.rowIndex + 1,
			rowFragmentIndex: 0,
			cells: Object.freeze([])
		}),
		complete: !0
	} : {
		selected: {
			input: {
				...c,
				id: `${t.id}:fragment:${n.rowFragmentIndex}`,
				heightPt: null,
				heightRule: "auto",
				cells: d.map((e, t) => ({
					...e.input,
					id: `${e.input.id}:fragment:${n.rowFragmentIndex}:${t}`
				}))
			},
			logicalRowIndex: t.logicalRowIndex,
			fragmentIndex: n.rowFragmentIndex,
			ownership: "source",
			ranges: d.map((e) => e.range)
		},
		next: Object.freeze({
			rowIndex: m ? n.rowIndex + 1 : n.rowIndex,
			rowFragmentIndex: m ? 0 : n.rowFragmentIndex + 1,
			cells: Object.freeze(m ? [] : d.map((e) => e.next))
		}),
		complete: m
	};
}
function tC(e, t, n) {
	let r = uS({
		...e.input,
		id: `${e.input.id}:fragment:${n.page.occurrenceId}`,
		rows: t.map((e) => e.input)
	}, n.placement, n.services).layout, i = r.rows.map((e, r) => {
		let i = t[r];
		return Object.freeze({
			...e,
			logicalRowIndex: i.logicalRowIndex,
			fragmentIndex: i.fragmentIndex,
			ownership: i.ownership,
			occurrenceId: n.page.occurrenceId,
			physicalPageIndex: n.page.physicalPageIndex,
			displayPageNumber: n.page.displayPageNumber,
			cells: Object.freeze(e.cells.map((e, n) => {
				let a = i.input.cells[n]?.verticalMerge ?? "none", o = i.input.cells[n], s = a === "continue" && t.slice(0, r).some((e) => e.input.cells.some((e) => e.verticalMerge === "restart" && e.columnStart === o?.columnStart && e.columnSpan === o?.columnSpan));
				return Object.freeze({
					...e,
					contentRanges: Object.freeze([...i.ranges[n] ?? []]),
					...a === "continue" && !s ? { visualMergeOwnership: "continuation" } : {}
				});
			}))
		});
	}), a = t.flatMap((t, r) => {
		let a = e.input.rows[t.logicalRowIndex];
		return a ? e.floatingTables.flatMap((o) => {
			let s = a.cells.findIndex((e) => e.id === o.hostCellId);
			if (s < 0 || !(t.ranges[s]?.some((e) => e.blockIndex === o.anchorBlockIndex && (e.kind === "whole" || e.kind === "paragraph" && e.lineStart === 0)) ?? !1)) return [];
			let c = t.input.cells[s], l = i[r]?.cells[s], u = c?.blocks.findIndex((e) => e.sourceBlockIndex === o.anchorBlockIndex) ?? -1, d = u < 0 ? void 0 : l?.blocks[u], f = e.nestedById[o.tableId]?.layout;
			if (!l || !d || !f) throw Error("Floating table occurrence references missing retained layout data");
			let p = Object.freeze({
				xPt: l.contentBounds.xPt,
				yPt: l.flowBounds.yPt + d.offsetPt,
				widthPt: d.layout.flowBounds.widthPt,
				heightPt: d.layout.flowBounds.heightPt
			});
			return [Object.freeze({
				kind: "floating-table-placement",
				occurrenceId: [
					n.page.occurrenceId,
					o.hostCellId,
					o.sourceBlockIndex,
					o.tableId
				].join(":"),
				ownership: t.ownership,
				physicalPageIndex: n.page.physicalPageIndex,
				displayPageNumber: n.page.displayPageNumber,
				...o,
				anchorBounds: p,
				child: f
			})];
		}) : [];
	}), o = Object.freeze(t.flatMap((e) => e.resolvedFloatingTables ?? [])), s = new Set(o.map((e) => e.occurrenceId)), c = t.some((e) => e.clipAtPageEnd === !0), l = c ? Math.min(r.advancePt, n.availableHeightPt) : r.advancePt, u = c ? {
		...r.flowBounds,
		heightPt: l
	} : r.flowBounds;
	return Object.freeze({
		...r,
		flowBounds: u,
		...c ? {
			inkBounds: u,
			clipBounds: u,
			advancePt: l
		} : {},
		columnWidthsPt: e.layout.columnWidthsPt,
		rows: Object.freeze(i),
		floatingTables: Object.freeze(a.filter((e) => !s.has(e.occurrenceId))),
		resolvedFloatingTables: o,
		...n.floatingTableRegistry ? { resolvedFloatingTableCoordinateSpace: n.floatingTableRegistry.coordinateSpace } : {}
	});
}
function nC(e, t, n) {
	if (t.rowIndex >= e.input.rows.length) return {
		fragment: null,
		nextCursor: null,
		requiresFreshPage: !1
	};
	let r = [], i = n.floatingTableRegistry;
	if (i && i.flowDomainId.length === 0) throw Error("Floating table registry coordinate/domain mismatch");
	let a = Object.freeze([...i?.entries ?? []]), o = i?.nextParagraphId ?? 0, s = Math.max(0, n.availableHeightPt), c = PS(e.input);
	if (t.rowIndex >= c && t.rowIndex > 0 && c > 0) for (let i = 0; i < c; i += 1) {
		let c = GS(e, HS(e, e.input.rows[i], "repeated-header", n), "repeated-header", n.availableHeightPt - s, n, a, o, NS(), () => !0), l = c.row, u = LS(e, l, i, n);
		if (u > s + jS) return {
			fragment: null,
			nextCursor: t,
			requiresFreshPage: !0
		};
		r.push(XS(l, "repeated-header", 0, !1, c.resolved)), a = c.registry, o = c.nextParagraphId, s -= u;
	}
	let l = t, u = t.rowIndex, d = t.rowFragmentIndex === 0 && t.cells.length === 0 && e.layout.rows.slice(t.rowIndex).reduce((e, t) => e + Math.max(0, t.heightPt), 0) <= s + jS, f = !1;
	for (; u < e.input.rows.length;) {
		let i = "source", c = HS(e, e.input.rows[u], i, n), p = u === t.rowIndex ? t : Object.freeze({
			rowIndex: u,
			rowFragmentIndex: 0,
			cells: Object.freeze([])
		}), m = u !== t.rowIndex || t.rowFragmentIndex === 0, h = m ? GS(e, c, i, n.availableHeightPt - s, n, a, o, p, (e) => {
			let t = c.cells.findIndex((t) => t.id === e.hostCellId), n = c.cells[t]?.blocks.findIndex((t) => t.sourceBlockIndex === e.anchorBlockIndex) ?? -1;
			if (n < 0) return !1;
			let r = p.cells[t] ?? MS();
			return r.blockIndex < n || r.blockIndex === n && r.paragraphLineStart === 0;
		}) : {
			row: c,
			resolved: Object.freeze([]),
			registry: a,
			nextParagraphId: o
		}, g = h.row, _ = d || f ? RS(e, g, u, n) : LS(e, g, u, n);
		if (m && _ <= s + jS) {
			r.push(XS(g, "source", 0, !1, h.resolved)), a = h.registry, o = h.nextParagraphId, s -= _, u += 1, l = u < e.input.rows.length ? Object.freeze({
				rowIndex: u,
				rowFragmentIndex: 0,
				cells: Object.freeze([])
			}) : null;
			continue;
		}
		if (g.cantSplit) {
			if (r.some((e) => e.ownership === "source")) break;
			if (_ + (n.availableHeightPt - s) <= n.freshPageHeightPt + jS || n.availableHeightPt + jS < n.freshPageHeightPt) return {
				fragment: null,
				nextCursor: t,
				requiresFreshPage: !0
			};
			if (bl({
				compatibility: n.compatibility,
				availableHeightPt: n.availableHeightPt,
				freshPageHeightPt: n.freshPageHeightPt,
				epsilonPt: jS
			})) {
				r.push(XS(g, "source", 0, !0, h.resolved)), a = h.registry, o = h.nextParagraphId, l = u + 1 < e.input.rows.length ? Object.freeze({
					rowIndex: u + 1,
					rowFragmentIndex: 0,
					cells: Object.freeze([])
				}) : null;
				break;
			}
		}
		if (n.oversizedRowPolicy === "atomic" && r.every((e) => e.ownership === "repeated-header") && n.availableHeightPt + jS >= n.freshPageHeightPt && _ > n.freshPageHeightPt + jS) {
			r.push(XS(g, "source", 0, !1, h.resolved)), a = h.registry, o = h.nextParagraphId, l = u + 1 < e.input.rows.length ? Object.freeze({
				rowIndex: u + 1,
				rowFragmentIndex: 0,
				cells: Object.freeze([])
			}) : null;
			break;
		}
		let v = eC(e, c, p, s, n), y = null, b = /* @__PURE__ */ new Set();
		for (; v.selected;) {
			let t = JS(e, v.selected), r = JSON.stringify([...t].sort());
			if (b.has(r)) throw Error("Floating table selected ownership did not converge");
			b.add(r), y = GS(e, c, i, n.availableHeightPt - s, n, a, o, p, (e) => t.has(qS(e)));
			let l = eC(e, y.row, p, s, n);
			if (!l.selected) {
				v = l;
				break;
			}
			let u = JS(e, l.selected);
			if (v = l, YS(t, u)) break;
			y = null;
		}
		if (v.selected && y === null) throw Error("Floating table selected ownership did not converge");
		if (v.selected) {
			let t = y?.resolved ?? [];
			if (t.some((t) => !KS(e, v.selected, t.source))) throw Error("Floating table transaction included an unowned occurrence");
			let i = a.length, c = (y?.registry ?? a).slice(i);
			if (r.push({
				...v.selected,
				...t.length ? { resolvedFloatingTables: Object.freeze(t) } : {}
			}), a = Object.freeze([...a, ...c]), o += c.length, l = v.next.rowIndex >= e.input.rows.length ? null : v.next, v.complete && v.next.rowIndex < e.input.rows.length) {
				s = Math.max(0, s - BS(e, v.selected.input, u, n)), f = !0, u = v.next.rowIndex;
				continue;
			}
		}
		break;
	}
	if (r.filter((e) => e.ownership === "source").length === 0) {
		if (!(n.availableHeightPt + jS < n.freshPageHeightPt)) throw new V("NON_CONVERGENCE", "Table pagination cannot advance from a fresh page");
		return {
			fragment: null,
			nextCursor: t,
			requiresFreshPage: !0
		};
	}
	let p = tC(e, r, n);
	for (; p.advancePt > n.availableHeightPt + jS;) {
		let t = r.at(-1), i = r.filter((e) => e.ownership === "source").length;
		if (!(t?.ownership === "source" && t.fragmentIndex === 0) || i <= 1) break;
		r.pop(), l = Object.freeze({
			rowIndex: t.logicalRowIndex,
			rowFragmentIndex: 0,
			cells: Object.freeze([])
		}), p = tC(e, r, n);
	}
	return p.advancePt > n.availableHeightPt + jS && n.availableHeightPt + jS < n.freshPageHeightPt && p.advancePt <= n.freshPageHeightPt + jS ? {
		fragment: null,
		nextCursor: t,
		requiresFreshPage: !0
	} : {
		fragment: p,
		nextCursor: l,
		requiresFreshPage: !1,
		floatingTablePlacements: p.resolvedFloatingTables,
		...i ? { floatingTableRegistryDelta: (() => {
			let e = a.slice(i.entries.length).filter((e) => p.resolvedFloatingTables.some((t) => t.occurrenceId === e.occurrenceId));
			return xb(i, e, i.nextParagraphId + e.length);
		})() } : {}
	};
}
//#endregion
//#region packages/docx/src/layout/registered-paragraph-acquisition.ts
function rC(e, t, n, r) {
	let i = jg(e, n.flowDomainId), a = uv(t, {
		...n,
		exclusions: Object.freeze([
			...n.exclusions,
			...i.exclusions,
			...r?.exclusions ?? []
		]),
		anchorCollisions: Object.freeze([
			...n.anchorCollisions ?? [],
			...i.collisions,
			...r?.collisions ?? []
		])
	});
	return Mg(e, i, a.layout), a;
}
//#endregion
//#region packages/docx/src/layout/paragraph-float-authority.ts
function iC(e, t) {
	return e.flatMap((e, n) => e.kind === "shape" && e.anchorOccurrenceId && e.authoredWrap === void 0 ? [] : [{
		id: e.imageKey || `${t}:float:${n}`,
		wrap: e.authoredWrap ?? (e.mode === "topAndBottom" ? "topAndBottom" : "square"),
		wrapSide: oo(e.side),
		bounds: {
			xPt: e.xLeft,
			yPt: e.yTop,
			widthPt: Math.max(0, e.xRight - e.xLeft),
			heightPt: Math.max(0, e.yBottom - e.yTop)
		},
		polygon: e.wrapPolygon ?? [
			{
				xPt: e.xLeft,
				yPt: e.yTop
			},
			{
				xPt: e.xRight,
				yPt: e.yTop
			},
			{
				xPt: e.xRight,
				yPt: e.yBottom
			},
			{
				xPt: e.xLeft,
				yPt: e.yBottom
			}
		],
		...e.kind === "table" && !e.anchorOccurrenceId ? { verticalOwnership: "page" } : {},
		...e.anchorOccurrenceId ? {
			anchorOccurrenceId: e.anchorOccurrenceId,
			verticalOwnership: "page"
		} : {}
	}]);
}
function aC(e) {
	return e.flatMap((e) => e.kind !== "shape" || !e.anchorOccurrenceId ? [] : [{
		occurrenceId: e.anchorOccurrenceId,
		bounds: {
			xPt: e.imageX,
			yPt: e.imageY,
			widthPt: e.imageW,
			heightPt: e.imageH
		},
		horizontalOwnership: "page",
		verticalOwnership: "page"
	}]);
}
//#endregion
//#region packages/docx/src/layout/drawingml-collision-registry.ts
function oC(e) {
	if (e.occurrenceId.length === 0) throw Error("DrawingML collision occurrence ID must not be empty");
	let { xPt: t, yPt: n, widthPt: r, heightPt: i } = e.bounds;
	if (![
		t,
		n,
		r,
		i
	].every(Number.isFinite) || r < 0 || i < 0) throw Error(`DrawingML collision bounds are invalid: ${e.occurrenceId}`);
	if (e.horizontalOwnership !== "page" && e.horizontalOwnership !== "host" || e.verticalOwnership !== "page" && e.verticalOwnership !== "host") throw Error(`DrawingML collision ownership is invalid: ${e.occurrenceId}`);
}
function sC(e) {
	return oC(e), Object.freeze({
		occurrenceId: e.occurrenceId,
		bounds: Object.freeze({ ...e.bounds }),
		horizontalOwnership: e.horizontalOwnership,
		verticalOwnership: e.verticalOwnership,
		...e.relativeHeight === void 0 ? {} : { relativeHeight: e.relativeHeight }
	});
}
function cC(e, t) {
	return Object.freeze({
		coordinateSpace: t,
		flowDomainId: e,
		entries: Object.freeze([])
	});
}
function lC(e, t) {
	return Object.freeze({
		coordinateSpace: e.coordinateSpace,
		flowDomainId: e.flowDomainId,
		baseEntries: e.entries,
		baseEntryCount: e.entries.length,
		entries: Object.freeze(t.map(sC))
	});
}
function uC(e, t) {
	if (t.coordinateSpace !== e.coordinateSpace) throw Error("DrawingML collision registry coordinate space mismatch");
	if (t.flowDomainId !== e.flowDomainId) throw Error("DrawingML collision registry flow domain mismatch");
	if (t.baseEntries !== e.entries || t.baseEntryCount !== e.entries.length) throw Error("DrawingML collision registry delta is stale");
	let n = new Set(e.entries.map((e) => e.occurrenceId));
	for (let e of t.entries) {
		if (oC(e), n.has(e.occurrenceId)) throw Error(`DrawingML collision occurrence committed twice: ${e.occurrenceId}`);
		n.add(e.occurrenceId);
	}
}
function dC(e, t) {
	return uC(e, t), Object.freeze({
		coordinateSpace: e.coordinateSpace,
		flowDomainId: e.flowDomainId,
		entries: Object.freeze([...e.entries, ...t.entries])
	});
}
//#endregion
//#region packages/docx/src/layout/anchor-classification.ts
function fC(e, t) {
	return Xh(e, t);
}
function pC(e) {
	return so(e.wrapMode) && fC(e.anchorYRelativeFrom ?? null, e.anchorYFromPara ?? !1);
}
//#endregion
//#region packages/docx/src/vertical-text.ts
function mC(e) {
	let t = te(e);
	return t === "U" || t === "Tu" ? "upright" : t === "Tr" ? "rotate" : "sideways";
}
var hC = new Set([65294]);
function gC(e) {
	return hC.has(e) ? {
		dx: .4,
		dy: -.4
	} : {
		dx: 0,
		dy: 0
	};
}
function _C(e) {
	let t = [], n = "", r = null;
	for (let i of e) {
		let e = mC(i.codePointAt(0) ?? 0);
		r === null ? (r = e, n = i) : e === r ? n += i : (t.push({
			text: n,
			mode: r
		}), n = i, r = e);
	}
	return n !== "" && r !== null && t.push({
		text: n,
		mode: r
	}), t;
}
var vC = () => !1;
function yC(e, t, n) {
	let r = e.textBaseline;
	e.textBaseline = "alphabetic";
	let i = e.measureText(t);
	e.textBaseline = r;
	let a = i.fontBoundingBoxAscent, o = i.fontBoundingBoxDescent;
	return typeof a == "number" && typeof o == "number" && (a !== 0 || o !== 0) ? (a - o) / 2 : .38 * n;
}
function bC(e, t) {
	let n = e.textAlign, r = e.textBaseline;
	e.textAlign = "center", e.textBaseline = "middle";
	let i = e.measureText(t);
	e.textAlign = n, e.textBaseline = r;
	let a = i.actualBoundingBoxAscent, o = i.actualBoundingBoxDescent;
	return typeof a == "number" && typeof o == "number" ? (a - o) / 2 : 0;
}
function xC(e) {
	return mC(e) === "rotate" && ve(e) === null && !le(e);
}
function SC(e) {
	let t = te(e);
	return t === "Tu" || t === "Tr";
}
function CC(e, t) {
	let n = e.textAlign, r = e.textBaseline;
	e.textAlign = "center", e.textBaseline = "middle";
	let i = e.measureText(t);
	e.textAlign = n, e.textBaseline = r;
	let a = i.actualBoundingBoxLeft, o = i.actualBoundingBoxRight;
	return typeof a != "number" || typeof o != "number" || !Number.isFinite(a) || !Number.isFinite(o) ? null : {
		extentPx: a + o,
		shiftPx: (a - o) / 2
	};
}
function wC(e, t, n, r, i, a, o) {
	let s = e.textAlign, c = e.textBaseline, l = () => (e.textAlign = n === "sideways" ? "left" : "center", e.textBaseline = n === "sideways" ? "alphabetic" : "middle", e.measureText(t)), u;
	try {
		u = o ? j(e, l) : l();
	} finally {
		e.textAlign = s, e.textBaseline = c;
	}
	if (n === "upright") {
		if (!Number.isFinite(u.actualBoundingBoxLeft) || !Number.isFinite(u.actualBoundingBoxRight)) return;
		let e = u.actualBoundingBoxLeft, t = u.actualBoundingBoxRight, n = a === "vertical-rl" ? 1 : i, o = -(r.xPt - e) * n, s = -(r.xPt + t) * n;
		return Object.freeze({
			startPt: Math.min(o, s),
			endPt: Math.max(o, s)
		});
	}
	if (!Number.isFinite(u.actualBoundingBoxAscent) || !Number.isFinite(u.actualBoundingBoxDescent)) return;
	let d = u.actualBoundingBoxAscent, f = u.actualBoundingBoxDescent, p = r.yPt - d, m = r.yPt + f;
	return Object.freeze({
		startPt: Math.min(p, m),
		endPt: Math.max(p, m)
	});
}
function TC(e, t, n, r, i) {
	let a = e.measureText(t).width;
	if (SC(n) && r(n)) {
		let n = pe(e, t);
		return {
			naturalPx: n.cellAdvancePx,
			vert: n,
			rotateInkShiftPx: 0
		};
	}
	if (i && xC(n)) {
		let n = CC(e, t);
		if (n !== null && n.extentPx > a) return {
			naturalPx: n.extentPx,
			vert: null,
			rotateInkShiftPx: n.shiftPx
		};
	}
	return {
		naturalPx: a,
		vert: null,
		rotateInkShiftPx: 0
	};
}
function EC(e, t, n, r, i = 1, a = !1, o = vC, s = "vertical-rl") {
	let c = [], l = yC(e, t, n), u = 0, d = 0;
	for (let f of _C(t)) {
		if (f.mode === "sideways") {
			let t = [...f.text].length, n = e.measureText(f.text).width * i + r * t, a = {
				xPt: 0,
				yPt: l
			}, o = wC(e, f.text, "sideways", a, i, s, !1);
			c.push({
				range: {
					start: d,
					end: d + f.text.length
				},
				text: f.text,
				orientation: "sideways",
				originPt: u,
				advancePt: n,
				drawOffsetPt: a,
				verticalFeature: !1,
				...o ? { blockAxisInkBounds: o } : {}
			}), u += n, d += f.text.length;
			continue;
		}
		for (let t of f.text) {
			let l = t.codePointAt(0) ?? 0, f = mC(l), p = f === "rotate" ? ve(l) : null, m = f === "rotate" && p === null && le(l), h = TC(e, t, l, o, a), g = h.naturalPx * i + r, _ = {
				start: d,
				end: d + t.length
			};
			if (h.vert !== null) {
				let n = {
					xPt: 0,
					yPt: 0
				}, r = wC(e, t, "upright", n, i, s, !0);
				c.push({
					range: _,
					text: t,
					orientation: "upright",
					originPt: u + h.vert.originInCellPx * i,
					advancePt: g,
					drawOffsetPt: n,
					verticalFeature: !0,
					...r ? { blockAxisInkBounds: r } : {}
				});
			} else if (f === "upright" || p !== null || m) {
				let r = p === null ? M(l) : null, a = p ?? r, o = a === null ? t : String.fromCodePoint(a), d = a === null ? gC(l) : {
					dx: 0,
					dy: 0
				}, f = ws(r), m = d.dy === 0 && !f ? bC(e, o) / n : 0, h = {
					xPt: d.dx * n,
					yPt: (m + d.dy) * n
				}, v = wC(e, o, "upright", h, i, s, !1);
				c.push({
					range: _,
					text: o,
					orientation: "upright",
					originPt: u + g / 2,
					advancePt: g,
					drawOffsetPt: h,
					verticalFeature: !1,
					...v ? { blockAxisInkBounds: v } : {}
				});
			} else {
				let n = {
					xPt: 0,
					yPt: 0
				}, r = wC(e, t, "rotate", n, i, s, !1);
				c.push({
					range: _,
					text: t,
					orientation: "rotate",
					originPt: u + g / 2 + i * h.rotateInkShiftPx,
					advancePt: g,
					drawOffsetPt: n,
					verticalFeature: !1,
					...r ? { blockAxisInkBounds: r } : {}
				});
			}
			u += g, d += t.length;
		}
	}
	return c;
}
function DC(e, t, n) {
	let r = 0;
	for (let i of _C(t)) {
		if (i.mode === "sideways") {
			r += e.measureText(i.text).width;
			continue;
		}
		for (let t of i.text) {
			let i = TC(e, t, t.codePointAt(0) ?? 0, n, !0);
			r += i.naturalPx;
		}
	}
	return r - e.measureText(t).width;
}
function OC(e, t) {
	return DC(e, t, (t) => me(e, t));
}
function kC(e, t, n, r, i) {
	return {
		x: t,
		y: i - (e + n),
		w: r,
		h: n
	};
}
//#endregion
//#region packages/docx/src/layout/production-body-layout.ts
function AC(e, t, n) {
	ql(e.blocks.body);
	let r = e.acquisition, i = r.acquisitionInputs, a = r.effectiveTablePositioning, o = r.publicAnchorBridge, s = Fs(e.fonts.familyClasses, e.fonts.familyPitches), c = (e, t, n) => `${e}${t ? `|clr:${t}` : ""}${n ? `|duo:${n.clr1}:${n.clr2}` : ""}`;
	function l(e, t, n = {}, r, a = {}, s, c) {
		let l = au(r, t), u = s;
		return {
			ctx: e,
			verticalGlyphMeasurement: xr(u),
			acquisitionInputs: i,
			contentX: t.marginLeft,
			contentW: t.pageWidth - t.marginLeft - t.marginRight,
			y: 0,
			pageH: t.pageHeight,
			pageIndex: 0,
			totalPages: Mr(u).totalPages,
			marginLeft: t.marginLeft,
			marginRight: t.marginRight,
			marginTop: _u(t.marginTop),
			marginBottom: _u(t.marginBottom),
			pageWidth: t.pageWidth,
			floats: [],
			floatParaSeq: 0,
			layoutSettings: r,
			sectionLayout: l,
			storyContext: Lb,
			docEastAsian: r.documentHasEastAsianText,
			fontFamilyClasses: n,
			resolvedLocalFonts: a,
			layoutServices: u,
			retainedTableAcquisition: {
				layoutServices: (e) => e.layoutServices,
				tableFormat: i.tableFormatInput,
				resolveColumns: p,
				createCellState: (e, t, n) => ({
					...Hb(e),
					contentX: 0,
					contentW: t,
					y: 0,
					containerShading: n.background ?? e.containerShading,
					floats: [],
					floatParaSeq: 0,
					pageAnchorPrescanned: /* @__PURE__ */ new Set()
				}),
				acquireParagraph: (e, t, n, r, i, a, s, c) => {
					let l = c ?? {
						story: "body",
						storyInstance: "body",
						path: [...r]
					}, u = t.runs.filter((e, t) => o(l, t) !== null);
					u.length > 0 && T({
						...t,
						runs: u
					}, e, e.y);
					let d = Vb(e, t), f = rC(e, e.acquisitionInputs.paragraphAcquisitionInput(t, l), {
						id: `${l.story}:${l.storyInstance}:${l.path.join(".")}`,
						source: l,
						flowDomainId: i,
						ordinaryFlow: !0,
						context: d,
						placement: {
							startYPt: e.y,
							paragraphXPt: 0,
							availableWidthPt: n,
							maximumYPt: e.pageH,
							suppressSpaceBefore: !0
						},
						measurer: {
							context: e.ctx,
							fontFamilyClasses: e.fontFamilyClasses
						},
						environment: Fb(e),
						exclusions: iC(e.floats, i),
						anchorCollisions: aC(e.floats),
						anchorCellBounds: {
							xPt: 0,
							yPt: 0,
							widthPt: n,
							heightPt: e.pageH
						},
						containerShading: e.containerShading,
						...a ? { paragraphBorderEdges: a } : {},
						trailingExtentPt: Math.max(d.spaceAfterPt, a?.bottom === "none" ? 0 : Fl(t.borders)),
						continuesFromPrevious: !1,
						anchorFrames: Rb(e),
						acquireCompleteStory: e.acquireCompleteTextBoxStory
					}, s).layout;
					return t.spaceBefore === 0 ? f : Object.freeze({
						...f,
						flowBounds: Object.freeze({
							...f.flowBounds,
							heightPt: f.flowBounds.heightPt + t.spaceBefore
						}),
						advancePt: f.advancePt + t.spaceBefore,
						spacing: Object.freeze({
							...f.spacing,
							beforePt: t.spaceBefore
						})
					});
				},
				registerFloatingTable: (e, t) => {
					let n = !t.positioning.horzSpecified || t.positioning.horzAnchor !== "page" && t.positioning.horzAnchor !== "margin", r = t.positioning.vertAnchor !== "page" && t.positioning.vertAnchor !== "margin";
					if (!n || !r) return null;
					let i = e.pageH, a = {
						xPt: e.contentX,
						yPt: e.y,
						widthPt: e.contentW,
						heightPt: t.child.advancePt
					}, o = vb(t.positioning, {
						page: {
							xPt: 0,
							yPt: 0,
							widthPt: e.pageWidth,
							heightPt: i
						},
						margin: {
							xPt: e.marginLeft,
							yPt: e.marginTop,
							widthPt: Math.max(0, e.pageWidth - e.marginLeft - e.marginRight),
							heightPt: Math.max(0, i - e.marginTop - e.marginBottom)
						},
						text: a
					}, t.child.columnWidthsPt.reduce((e, t) => e + t, 0), t.child.advancePt), s = fb(e, {
						x: o.x,
						y: o.y,
						w: o.w,
						h: o.h,
						dl: t.positioning.leftFromTextPt,
						dr: t.positioning.rightFromTextPt,
						dt: t.positioning.topFromTextPt,
						db: t.positioning.bottomFromTextPt,
						kind: "table",
						mode: "square",
						side: "bothSides",
						imageKey: "",
						paraId: e.floatParaSeq++,
						avoidOverlap: !0,
						tableOverlap: t.overlap
					});
					return Object.freeze({
						xPt: s.imageX - a.xPt,
						yPt: s.imageY - a.yPt
					});
				},
				advanceState: (e, t) => {
					e.y += t;
				}
			},
			retainedTablesBySourceIndex: /* @__PURE__ */ new Map(),
			currentDateMs: c?.currentDateMs,
			showTrackedChanges: c?.showTrackedChanges,
			kinsoku: r.kinsoku,
			defaultTabPt: r.defaultTabPt,
			get verticalCJK() {
				return Ab(this.sectionLayout.textDirection);
			},
			get verticalAllRotated() {
				return Ab(this.sectionLayout.textDirection) && jb(this.sectionLayout.textDirection);
			},
			verticalPhys: kb(t) ? (() => {
				let e = Nb(t);
				return {
					pageWidth: e.pageWidth,
					pageHeight: e.pageHeight,
					marginLeft: e.marginLeft,
					marginRight: e.marginRight,
					marginTop: _u(e.marginTop),
					marginBottom: _u(e.marginBottom),
					physicalPageWidthPt: e.pageWidth
				};
			})() : void 0
		};
	}
	function u(e, t, n) {
		let r = (e) => {
			let t = Object.freeze({
				top: null,
				right: null,
				bottom: null,
				left: null,
				insideH: null,
				insideV: null
			});
			return Object.freeze({
				kind: "table",
				id: e.id,
				source: e.source,
				flowDomainId: e.flowDomainId,
				ordinaryFlow: !0,
				alignment: e.alignment,
				indentPt: e.indentPt,
				bidiVisual: e.bidiVisual,
				columnWidthsPt: e.columnWidthsPt,
				columnWidthKeys: e.columnWidthKeys,
				borders: t,
				rows: Object.freeze(e.rows.map((e) => Object.freeze({
					...e,
					exceptionBorders: e.sourceTableEdges
				})))
			});
		}, i = (t) => {
			if (t.story !== "body" || t.storyInstance !== "body" || t.path.length !== 1) throw Error("Body acquisition requires a top-level body source");
			let n = e.blocks.resolve(t);
			if (!n || n.type !== "paragraph" && n.type !== "table") throw Error(`Body source does not identify a flow block: ${t.path.join(".")}`);
			return n;
		}, c = (t) => e.blocks.resolve(t), u = (e, t, n, r, i, a, o = Object.freeze({ boundary: null }), s) => {
			let c = Yl(t) ?? {
				top: "top",
				bottom: "bottom"
			}, l = Bb(e, t);
			return uv(t, {
				id: `${n.story}:${n.storyInstance}:${n.path.join(".")}`,
				source: n,
				flowDomainId: r.flowDomainId,
				ordinaryFlow: !0,
				context: l,
				placement: {
					startYPt: e.y,
					paragraphXPt: r.availableBounds.xPt,
					availableWidthPt: i,
					maximumYPt: e.pageH,
					suppressSpaceBefore: a
				},
				measurer: {
					context: e.ctx,
					fontFamilyClasses: e.fontFamilyClasses
				},
				environment: Fb(e),
				exclusions: iC(e.floats, r.flowDomainId),
				anchorCollisions: s ?? aC(e.floats),
				containerShading: e.containerShading,
				paragraphBorderEdges: c,
				trailingExtentPt: Math.max(l.spaceAfterPt, c.bottom === "none" ? 0 : Fl(t.borders)),
				continuesFromPrevious: o.boundary !== null,
				...o.sourceRangeStart === void 0 ? {} : { sourceRangeStart: o.sourceRangeStart },
				anchorFrames: Rb(e),
				acquireCompleteStory: e.acquireCompleteTextBoxStory
			}, o.boundary === null ? void 0 : {
				boundary: o.boundary,
				...o.uniformRubyAdvancePt === void 0 ? {} : { uniformRubyAdvancePt: o.uniformRubyAdvancePt }
			});
		};
		return Object.freeze({ openBodyLayoutSession(d, g, _) {
			if (!t) throw Error("Body layout acquisition requires a measurement context");
			let v = {
				...e.section,
				...d.section.geometry,
				textDirection: d.section.textDirection,
				vAlign: d.section.verticalAlignment
			}, y = l(t, Ab(v.textDirection) ? Mb(v) : v, s, e.documentLayoutSettings, n, g, _);
			_.showTrackedChanges === !0 && (y.revisionAuthorColor = Wv(e.blocks.body));
			let b = e.blocks.footnotes, x = e.blocks.endnotes, S = kv(b);
			y.noteNumbers = new Map([...[...Ov(b, Av(e.blocks.body, "footnote"))].map(([e, t]) => [`footnote:${e}`, t]), ...[...Ov(x, Av(e.blocks.body, "endnote"))].map(([e, t]) => [`endnote:${e}`, t])]);
			let C = d.initialLocation, w = (e) => `body:page:${e}:registry`, D = Object.freeze({
				coordinateSpace: "logical-page-points",
				flowDomainId: w(C.pageIndex),
				entries: Object.freeze([]),
				nextParagraphId: 0
			}), O = cC(w(C.pageIndex), "logical-page-points"), k = (e, t) => {
				let n = t.section.geometry;
				e.sectionLayout = t.section, e.pageIndex = t.pageIndex;
				let r = Mr(g).resolveDestinationPage?.(t.pageIndex);
				e.displayPageNumber = r?.displayPageNumber ?? t.pageIndex + 1, e.pageNumberFormat = r?.pageNumberFormat ?? e.pageNumberFormat, e.pageWidth = n.pageWidth, e.pageH = n.pageHeight, e.marginLeft = n.marginLeft, e.marginRight = n.marginRight, e.marginTop = _u(n.marginTop), e.marginBottom = _u(n.marginBottom), e.contentX = t.availableBounds.xPt, e.contentW = t.availableBounds.widthPt, e.y = t.cursorPt.yPt;
			}, A = (e) => {
				C = e, k(y, e);
			};
			A(C);
			let j = (e, t, n, r, i = D.nextParagraphId) => {
				let a = new Set(D.entries.map((e) => e.occurrenceId)), s = e.runs.flatMap((i, s) => {
					if (i.type !== "shape" && i.type !== "image" && i.type !== "chart") return [];
					let c = o(t, s);
					return !c || r && !r.has(c.occurrenceId) || a.has(c.occurrenceId) || c.pageOwned && n.pageAnchorPrescanned?.has(e) ? [] : [{
						run: i,
						occurrenceId: c.occurrenceId
					}];
				});
				if (s.length === 0) return Object.freeze([]);
				let c = n.floats.length;
				T({
					...e,
					runs: s.map(({ run: e }) => e)
				}, n, n.y);
				let l = n.floats.slice(c);
				if (l.length !== s.length) throw Error("Public paragraph anchor acquisition did not retain every wrap float");
				return Object.freeze(l.map((e, t) => {
					let n = s[t].occurrenceId;
					return Object.freeze({
						kind: "shape",
						occurrenceId: n,
						exclusionId: n,
						paragraphId: i,
						bounds: Object.freeze({
							xPt: e.imageX,
							yPt: e.imageY,
							widthPt: e.imageW,
							heightPt: e.imageH
						}),
						exclusionBounds: Object.freeze({
							xPt: e.xLeft,
							yPt: e.yTop,
							widthPt: e.xRight - e.xLeft,
							heightPt: e.yBottom - e.yTop
						}),
						wrap: s[t].run.wrapMode,
						wrapSide: e.side,
						wrapDistances: Object.freeze({
							topPt: e.distTop,
							rightPt: e.distRight,
							bottomPt: e.distBottom,
							leftPt: e.distLeft
						}),
						...e.wrapPolygon ? { wrapPolygon: Object.freeze([...e.wrapPolygon]) } : {}
					});
				}));
			}, M = (e) => {
				let t = new Map((e.anchorFrames ?? []).flatMap((e) => {
					if (e.status !== "resolved") return [];
					let t = (e) => e.status === "resolved" && (e.referenceFrame === "paragraph" || e.referenceFrame === "line" || e.referenceFrame === "character");
					return t(e.axes.horizontal) || t(e.axes.vertical) ? [[e.occurrenceId, e]] : [];
				}));
				if (t.size === 0) return Object.freeze([]);
				let n = new Map(e.exclusions.flatMap((e) => e.anchorOccurrenceId ? [[e.anchorOccurrenceId, e]] : []));
				return Object.freeze((e.anchorCollisions ?? []).flatMap((e) => {
					let r = t.get(e.occurrenceId);
					if (!r || r.geometry.wrap.kind === "none") return [];
					let i = n.get(e.occurrenceId);
					if (!i) throw Error(`Wrapped anchor omitted exclusion geometry: ${e.occurrenceId}`);
					return [Object.freeze({
						kind: "shape",
						occurrenceId: e.occurrenceId,
						exclusionId: e.occurrenceId,
						paragraphId: D.nextParagraphId,
						bounds: e.bounds,
						exclusionBounds: i.bounds,
						horizontalOwnership: e.horizontalOwnership,
						verticalOwnership: e.verticalOwnership,
						wrap: r.geometry.wrap.kind,
						wrapSide: r.geometry.wrap.side,
						wrapDistances: r.geometry.wrap.distances,
						...r.geometry.wrap.polygon ? { wrapPolygon: r.geometry.wrap.polygon.points } : {}
					})];
				}));
			}, N = (e) => {
				if (e.acquired.kind !== "paragraph") return e.acquired;
				let t = c(e.acquired.source);
				if (t.type !== "paragraph") throw Error("Table paragraph re-acquisition source kind mismatch");
				let n = {
					...Hb(y),
					contentX: 0,
					contentW: e.acquired.flowBounds.widthPt,
					y: e.acquired.flowBounds.yPt,
					floats: (e.floatingTableExclusions ?? []).map((e, t) => ({
						kind: "table",
						tableOverlap: "never",
						mode: "square",
						imageKey: `${Tg}${t}`,
						imageX: e.xPt,
						imageY: e.yPt,
						imageW: e.widthPt,
						imageH: e.heightPt,
						xLeft: e.xPt,
						xRight: e.xPt + e.widthPt,
						yTop: e.yPt,
						yBottom: e.yPt + e.heightPt,
						side: "bothSides",
						distLeft: 0,
						distRight: 0,
						distTop: 0,
						distBottom: 0,
						paraId: t
					})),
					floatParaSeq: e.floatingTableExclusions?.length ?? 0,
					pageAnchorPrescanned: /* @__PURE__ */ new Set()
				}, r = Eg(e.acquired);
				return y.retainedTableAcquisition.acquireParagraph(n, t, e.acquired.flowBounds.widthPt, e.acquired.source.path, e.acquired.flowDomainId, void 0, r);
			}, ee = kv(e.blocks.endnotes), te = /* @__PURE__ */ new Map(), P = (t) => {
				if (t.path.length !== 0) throw Error("Story acquisition requires a story-root source");
				return e.blocks.storyRoot(t);
			}, ne = (t) => {
				if (t.path.length === 0 || (t.path.length - 1) % 3 != 0) throw Error("Story block acquisition requires a canonical source path");
				return e.blocks.resolve(t);
			}, re = (e) => {
				let t = JSON.stringify({
					source: e.source,
					pageIndex: e.pageIndex,
					section: e.section,
					container: e.container
				}), n = te.get(t);
				if (n) return n;
				let r = P(e.source), i = e.source.story === "footnote" || e.source.story === "endnote" ? y.noteNumbers?.get(`${e.source.story}:${e.source.storyInstance}`) : void 0, a = Mr(g), s = a.resolveDestinationPage?.(e.pageIndex), c = Ab(e.section.textDirection), l = {
					...y,
					sectionLayout: e.section,
					pageIndex: e.pageIndex,
					totalPages: a.totalPages,
					displayPageNumber: s?.displayPageNumber ?? e.pageIndex + 1,
					pageNumberFormat: s?.pageNumberFormat ?? y.pageNumberFormat,
					pageWidth: e.section.geometry.pageWidth,
					pageH: e.container.capacity === "unbounded" ? 2 ** 53 - 1 : e.section.geometry.pageHeight,
					marginLeft: e.section.geometry.marginLeft,
					marginRight: e.section.geometry.marginRight,
					marginTop: _u(e.section.geometry.marginTop),
					marginBottom: _u(e.section.geometry.marginBottom),
					contentX: e.container.bounds.xPt,
					contentW: e.container.bounds.widthPt,
					y: e.container.bounds.yPt,
					floats: [],
					floatParaSeq: 0,
					retainedTablesBySourceIndex: /* @__PURE__ */ new Map(),
					pageAnchorPrescanned: /* @__PURE__ */ new Set(),
					noteReferenceNumber: i,
					verticalCJK: c,
					verticalAllRotated: c && jb(e.section.textDirection),
					...c ? {} : { verticalPhys: void 0 },
					storyContext: {
						story: e.source.story,
						containers: [],
						lineNumberingEligible: !1
					}
				};
				E(r, 0, l);
				let u = Or(g);
				l.layoutServices = u;
				let d = r.flatMap((t, n) => {
					let r = {
						story: e.source.story,
						storyInstance: e.source.storyInstance,
						path: [n]
					};
					if (t.type === "unsupportedTextBoxBlock") return [{
						type: "unsupportedTextBoxBlock",
						qName: t.qName,
						sourcePath: t.sourcePath
					}];
					if (t.type === "paragraph") return [{
						kind: "paragraph",
						source: r
					}];
					if (t.type !== "table") throw Error(`Unsupported ${e.source.story} story block: ${t.type}`);
					let i = l.retainedTableAcquisition, a = t;
					return [yS(a, p(a, e.container.bounds.widthPt, l), e.container.bounds.widthPt, l, r, i).input];
				}), f = null;
				oy(u, {
					layoutParagraph(e, t) {
						let n = ne(e.source);
						if (n.type !== "paragraph") throw Error("Story paragraph source kind mismatch");
						let i = e.source.path[0], a = i > 0 ? r[i - 1] : void 0, s = a?.type === "paragraph" ? a : null, c = r[i + 1], u = c?.type === "paragraph" ? c : null, d = f?.spaceAfter ?? 0, p = yg(f, n, d, n.spaceBefore), m = Math.max(t.container.bounds.yPt, t.cursor.yPt - p.overlap);
						l.y = m, l.contentX = t.container.bounds.xPt, l.contentW = t.container.bounds.widthPt;
						let h = n.runs.filter((t, n) => o(e.source, n) !== null);
						h.length > 0 && T(Object.freeze({
							...n,
							runs: Object.freeze(h)
						}), l, l.y);
						let g = Vb(l, n), _ = Vl(s, n, u), v = rC(l, n, {
							id: `${e.source.story}:${e.source.storyInstance}:${e.source.path.join(".")}`,
							source: e.source,
							flowDomainId: t.container.id,
							ordinaryFlow: !0,
							context: g,
							placement: {
								startYPt: m,
								paragraphXPt: t.container.bounds.xPt,
								availableWidthPt: t.container.bounds.widthPt,
								maximumYPt: t.availableBounds.yPt + t.availableBounds.heightPt,
								suppressSpaceBefore: p.suppressBefore
							},
							measurer: {
								context: l.ctx,
								fontFamilyClasses: l.fontFamilyClasses
							},
							environment: Fb(l),
							exclusions: iC(l.floats, t.container.id),
							anchorCollisions: aC(l.floats),
							containerShading: l.containerShading,
							paragraphBorderEdges: _,
							trailingExtentPt: Math.max(g.spaceAfterPt, _.bottom === "none" ? 0 : Fl(n.borders)),
							continuesFromPrevious: !1,
							anchorFrames: Rb(l),
							acquireCompleteStory: l.acquireCompleteTextBoxStory
						});
						f = n;
						let y = {
							xPt: t.cursor.xPt,
							yPt: m + v.layout.advancePt
						};
						return l.y = y.yPt, {
							layout: v.layout,
							nextCursor: y
						};
					},
					layoutTable(e, t) {
						f = null;
						let n = uS({
							...e,
							flowDomainId: t.container.id
						}, t, u);
						return l.y = n.nextCursor.yPt, n;
					}
				});
				let m = ly({
					source: e.source,
					container: e.container,
					blocks: Object.freeze(d)
				}, u), h = Object.freeze({
					...m,
					blocks: Object.freeze(m.blocks.map((t, n) => {
						if (t.kind !== "paragraph" && t.kind !== "table") throw Error(`Shared story emitted unsupported node: ${t.kind}`);
						return fm(t, {
							occurrenceId: `${e.container.id}:block:${n}`,
							destination: {
								coordinateSpace: "logical-page-points",
								flowDomainId: e.container.id,
								translation: {
									xPt: 0,
									yPt: 0
								}
							}
						});
					}))
				});
				return te.set(t, h), h;
			};
			y.acquireCompleteTextBoxStory = (e) => {
				let t = e.coordinateSpace === "upright-physical" ? {
					...y.sectionLayout,
					geometry: yu(y.sectionLayout.geometry),
					textDirection: "lrTb"
				} : y.sectionLayout;
				return re({
					source: e.source,
					pageIndex: y.pageIndex,
					section: t,
					container: e.container
				});
			};
			let ie = {
				hasPaginationFields: e.hasPaginationFields,
				measureParagraph(t) {
					A(t.location);
					let n = i(t.input.source);
					if (n.type !== "paragraph") throw Error("Paragraph source kind mismatch");
					if (n.framePr) {
						if (t.continuation.boundary !== null) throw Error("Body frame acquisition cannot continue across flow regions");
						let r, i = Jl(n);
						if (!i) throw Error("Body frame acquisition requires an indexed adjacency group");
						let a = h(n, i, y, m(e.blocks.body, n, y), (e) => {
							r = e;
						});
						if (!r) throw Error("Body frame acquisition omitted its retained group");
						let o = r.members.find((e) => e.paragraph === n);
						if (!o) throw Error("Body frame acquisition omitted its retained member");
						let s = n === i.members.at(-1) && i.framePr.dropCap !== "none" ? jm(fv(r)) : 0, c = n.framePr.vAnchor === "page" || n.framePr.vAnchor === "margin", l = a.exclusionId ?? `frame:${t.input.source.path.join(":")}`, u = Object.freeze({
							kind: "frame",
							occurrenceId: l,
							exclusionId: l,
							paragraphId: D.nextParagraphId,
							bounds: Object.freeze({
								xPt: a.x,
								yPt: a.y,
								widthPt: a.w,
								heightPt: a.h
							}),
							exclusionBounds: Object.freeze({
								xPt: a.exLeft,
								yPt: a.exTop,
								widthPt: a.exRight - a.exLeft,
								heightPt: a.exBottom - a.exTop
							})
						});
						return Object.freeze({
							layout: o.fragment,
							blockExtentPt: s,
							fragmentation: Object.freeze({ kind: "indivisible" }),
							placement: Object.freeze({
								coordinateSpace: "logical-body",
								xPt: o.fragment.flowBounds.xPt,
								yPt: o.fragment.flowBounds.yPt,
								sectionFlowOwnership: c ? "page" : "host-flow"
							}),
							...n === i.owner ? { retainedFootnoteReferenceIds: Object.freeze([...new Set(r.members.flatMap((e) => Fv(e.fragment)))]) } : {},
							...c ? {} : { relocationBlockExtentPt: Math.max(0, a.y + a.h - t.location.cursorPt.yPt) },
							...a.registerExclusion === !1 ? {} : { flowRegistryDelta: Object.freeze({ floats: xb(D, Object.freeze([u]), D.nextParagraphId + 1) }) }
						});
					}
					let r = {
						...y,
						floats: [...y.floats],
						pageAnchorPrescanned: new Set(y.pageAnchorPrescanned)
					};
					k(r, t.location);
					let a = t.continuation.boundary === null ? j(n, t.input.source, r) : Object.freeze([]), { measured: o, layout: s } = u(r, n, t.input.source, t.location, t.availableInlineExtentPt, t.suppressSpaceBefore, t.continuation, O.entries), c = o.lines.map((e) => {
						let t = e.layout.consumedEnd;
						if (!t) throw Error("Measured line omitted its source boundary");
						return t;
					}), l = M(s), d = Object.freeze([...a, ...l]), f = Og(s);
					return Object.freeze({
						layout: s,
						blockExtentPt: s.advancePt,
						fragmentation: o.markOnly ? Object.freeze({ kind: "indivisible" }) : Object.freeze({
							kind: "splittable",
							lineEndBoundaries: Object.freeze(c)
						}),
						...o.markOnly ? { markBelowBaselinePt: o.lastLineBelowBaselinePt } : {},
						...o.uniformRubyAdvancePt == null ? {} : { uniformRubyAdvancePt: o.uniformRubyAdvancePt },
						...d.length === 0 && f.length === 0 ? {} : { flowRegistryDelta: Object.freeze({
							...d.length === 0 ? {} : { floats: xb(D, d, D.nextParagraphId + d.length) },
							...f.length === 0 ? {} : { drawingCollisions: lC(O, f) }
						}) }
					});
				},
				measureTable(e) {
					if (A(e.location), e.input.kind === "adjacent-table-group") {
						if (e.cursor && e.cursor.kind !== "adjacent-table-group") throw Error("Adjacent table group acquisition received an ordinary table cursor");
						let t = e.input.tables.map((t) => {
							let n = i(t.source);
							if (n.type !== "table") throw Error("Table source kind mismatch");
							let r = t.source.path[0];
							return f(y, n, e.availableInlineExtentPt, r), Ub(y, r).acquisition;
						}), n = r(AS(e.input.logicalSequenceId, t.map((e) => e.input))), a = {
							container: {
								id: e.location.flowDomainId,
								kind: "body",
								bounds: {
									xPt: 0,
									yPt: 0,
									widthPt: e.availableInlineExtentPt,
									heightPt: e.freshPageBlockExtentPt
								}
							},
							cursor: {
								xPt: 0,
								yPt: 0
							},
							availableBounds: {
								xPt: 0,
								yPt: 0,
								widthPt: e.availableInlineExtentPt,
								heightPt: e.freshPageBlockExtentPt
							}
						}, o = uS(n, a, g).layout, s = {};
						t.forEach((e) => Object.entries(e.nestedById).forEach(([e, t]) => {
							if (s[e] && s[e] !== t) throw Error(`Adjacent table group has duplicate nested table id: ${e}`);
							s[e] = t;
						}));
						let c = Object.freeze({
							input: n,
							layout: o,
							nestedById: Object.freeze(s),
							floatingTables: Object.freeze(t.flatMap((e) => e.floatingTables))
						}), l = e.cursor?.cursor ?? Object.freeze({
							tableIndex: 0,
							sourceRowIndex: 0
						}), u = e.input.tables.slice(0, l.tableIndex).reduce((e, t) => e + (t.rowCount ?? 0), 0) + l.sourceRowIndex, d = l.tableCursor ?? Object.freeze({
							...NS(),
							rowIndex: u
						});
						if (d.rowIndex !== u) throw Error("Adjacent-table group and table-fragment cursors disagree");
						let p = nC(c, d, {
							availableHeightPt: e.availableBlockExtentPt,
							freshPageHeightPt: e.freshPageBlockExtentPt,
							placement: a,
							services: g,
							compatibility: "word",
							page: {
								physicalPageIndex: e.location.pageIndex,
								displayPageNumber: e.location.pageIndex + 1,
								occurrenceId: `${n.id}:body:${e.location.pageIndex}`
							}
						});
						if (!p.fragment || p.requiresFreshPage) return Object.freeze({
							layout: c.layout,
							blockExtentPt: 0,
							nextCursor: Object.freeze({
								kind: "adjacent-table-group",
								cursor: l
							}),
							requiresFreshFlowRegion: !0
						});
						let m = p.nextCursor ? (() => {
							let t = 0, n = 0;
							for (; t < e.input.tables.length;) {
								let r = e.input.tables[t].rowCount ?? 0;
								if (p.nextCursor.rowIndex < n + r) break;
								n += r, t += 1;
							}
							return t >= e.input.tables.length ? null : Object.freeze({
								tableIndex: t,
								sourceRowIndex: p.nextCursor.rowIndex - n,
								tableCursor: p.nextCursor
							});
						})() : null;
						return Object.freeze({
							layout: p.fragment,
							blockExtentPt: p.fragment.advancePt,
							nextCursor: m ? Object.freeze({
								kind: "adjacent-table-group",
								cursor: m
							}) : null,
							...p.floatingTableRegistryDelta ? { flowRegistryDelta: Object.freeze({ floats: p.floatingTableRegistryDelta }) } : {}
						});
					}
					let t = i(e.input.source);
					if (t.type !== "table") throw Error("Table source kind mismatch");
					let n = e.input.source.path[0];
					f(y, t, e.availableInlineExtentPt, n);
					let o = Ub(y, n).acquisition;
					if (e.cursor && e.cursor.kind !== "table") throw Error("Ordinary table acquisition received an adjacent-group cursor");
					let s = e.cursor?.cursor ?? NS(), c = y.pageH, l = y.acquisitionInputs.tableFormatInput(t).positioning;
					if (l) {
						let n = e.cursor?.kind === "table" && e.cursor.floatingContinuationFrame === "fresh-text" ? Object.freeze({
							...l,
							vertAnchor: "text",
							yPt: 0,
							yAlign: void 0
						}) : l, r = o.layout.columnWidthsPt.reduce((e, t) => e + t, 0), i = Object.freeze({
							page: Object.freeze({
								xPt: 0,
								yPt: 0,
								widthPt: y.pageWidth,
								heightPt: c
							}),
							margin: Object.freeze({
								xPt: y.marginLeft,
								yPt: y.marginTop,
								widthPt: Math.max(0, y.pageWidth - y.marginLeft - y.marginRight),
								heightPt: Math.max(0, c - y.marginTop - y.marginBottom)
							}),
							text: Object.freeze({
								xPt: e.location.cursorPt.xPt,
								yPt: e.location.cursorPt.yPt,
								widthPt: e.availableInlineExtentPt,
								heightPt: o.layout.advancePt
							})
						}), a = vb(n, i, r, o.layout.advancePt);
						if (e.cursor?.kind !== "table" && (n.vertAnchor === "page" || n.vertAnchor === "margin") && eo({
							bounds: {
								xPt: a.x,
								yPt: a.y,
								widthPt: a.w,
								heightPt: a.h
							},
							blockers: D.entries.map(Ga),
							overlapEpsilonPt: .01
						}).defer) return Object.freeze({
							layout: o.layout,
							blockExtentPt: 0,
							nextCursor: Object.freeze({
								kind: "table",
								cursor: s,
								floatingContinuationFrame: "authored"
							}),
							requiresFreshFlowRegion: !0
						});
						let u = (n.vertAnchor === "page" || n.vertAnchor === "margin") && o.layout.advancePt > e.freshPageBlockExtentPt, d = u ? e.location.availableBounds.yPt + e.location.availableBounds.heightPt : n.vertAnchor === "page" ? i.page.yPt + i.page.heightPt : n.vertAnchor === "margin" ? i.margin.yPt + i.margin.heightPt : e.location.availableBounds.yPt + e.location.availableBounds.heightPt, f = u ? e.freshPageBlockExtentPt : n.vertAnchor === "page" ? i.page.heightPt : n.vertAnchor === "margin" ? i.margin.heightPt : e.freshPageBlockExtentPt, p;
						try {
							p = zo({
								step: (r) => {
									if (r?.kind === "fresh-flow-region" || r?.kind === "candidate" && r.resolved.placement.xPt === r.parentFrame.xPt && r.resolved.placement.yPt === r.parentFrame.yPt) return r;
									let c = r?.resolved.placement ?? {
										xPt: a.x,
										yPt: a.y
									}, l = Math.max(0, d - c.yPt), u = nC(o, s, {
										availableHeightPt: l,
										freshPageHeightPt: f,
										placement: {
											container: {
												id: `${e.location.flowDomainId}:floating-table`,
												kind: "body",
												bounds: {
													xPt: 0,
													yPt: 0,
													widthPt: e.availableInlineExtentPt,
													heightPt: l
												}
											},
											cursor: {
												xPt: 0,
												yPt: 0
											},
											availableBounds: {
												xPt: 0,
												yPt: 0,
												widthPt: e.availableInlineExtentPt,
												heightPt: l
											}
										},
										services: g,
										compatibility: "word",
										oversizedRowPolicy: "atomic",
										page: {
											physicalPageIndex: e.location.pageIndex,
											displayPageNumber: y.displayPageNumber ?? e.location.pageIndex + 1,
											occurrenceId: `${o.input.id}:fitting-outer:${e.location.pageIndex}:${s.rowIndex}:${s.rowFragmentIndex}`
										},
										floatingTableFrames: {
											page: i.page,
											margin: i.margin,
											column: i.text
										},
										floatingTableRegistry: D,
										finalPlacementTranslationPt: c,
										reacquirePageDependentBlock: N
									});
									if (!u.fragment || u.requiresFreshPage) return Object.freeze({
										kind: "fresh-flow-region",
										result: u
									});
									let p = Object.freeze({
										kind: "floating-table-placement",
										occurrenceId: `${o.input.id}:root:${e.location.pageIndex}:${s.rowIndex}:${s.rowFragmentIndex}`,
										ownership: "source",
										physicalPageIndex: e.location.pageIndex,
										displayPageNumber: y.displayPageNumber ?? e.location.pageIndex + 1,
										hostCellId: e.location.flowDomainId,
										sourceBlockIndex: e.input.source.path[0],
										anchorBlockIndex: e.input.source.path[0],
										tableId: u.fragment.id,
										overlap: t.overlap === "never" ? "never" : "overlap",
										positioning: n,
										anchorBounds: i.text,
										child: u.fragment
									}), m = u.floatingTableRegistryDelta?.entries ?? [], h = u.floatingTableRegistryDelta?.nextParagraphId ?? D.nextParagraphId, _ = wb(p, i, Cb(D.entries, h, D.coordinateSpace, D.flowDomainId)), v = JSON.stringify({
										parentFrame: {
											xPt: _.placement.xPt,
											yPt: _.placement.yPt
										},
										fragment: u.fragment,
										nestedEntries: m,
										resolvedBounds: _.placement.bounds
									});
									return Object.freeze({
										kind: "candidate",
										parentFrame: Object.freeze({
											xPt: c.xPt,
											yPt: c.yPt
										}),
										result: u,
										fragment: u.fragment,
										resolved: _,
										nestedEntries: m,
										fingerprint: v
									});
								},
								stateOf: (e) => e.kind === "fresh-flow-region" ? "fresh-flow-region" : e.fingerprint,
								limit: 16
							}).value;
						} catch (e) {
							throw e instanceof Ro ? new V("NON_CONVERGENCE", e.reason === "cycle" ? "Floating table parent/child transaction repeated an exact-state cycle" : "Floating table parent/child transaction reached the operational pass limit 16") : e;
						}
						if (p.kind === "fresh-flow-region") return Object.freeze({
							layout: o.layout,
							blockExtentPt: 0,
							nextCursor: Object.freeze({
								kind: "table",
								cursor: s,
								floatingContinuationFrame: "fresh-text"
							}),
							requiresFreshFlowRegion: !0
						});
						let { result: m, fragment: h, resolved: _, nestedEntries: v } = p, b = e.cursor?.kind === "table" && e.cursor.floatingContinuationFrame !== void 0, x = e.location.availableBounds.yPt + e.location.availableBounds.heightPt, S = [...h.resolvedFloatingTables ?? [], _.placement].filter((e) => e.source.positioning.vertAnchor === "text");
						return !b && S.some((e) => e.exclusionBounds.yPt + e.exclusionBounds.heightPt > x) ? Object.freeze({
							layout: h,
							blockExtentPt: 0,
							nextCursor: Object.freeze({
								kind: "table",
								cursor: s,
								floatingContinuationFrame: "fresh-text"
							}),
							requiresFreshFlowRegion: !0
						}) : Object.freeze({
							layout: h,
							blockExtentPt: 0,
							nextCursor: m.nextCursor ? Object.freeze({
								kind: "table",
								cursor: m.nextCursor,
								floatingContinuationFrame: "fresh-text"
							}) : null,
							flowRegistryDelta: Object.freeze({ floats: xb(D, Object.freeze([...v, ..._.transaction.delta]), _.transaction.nextParagraphId) }),
							placement: Object.freeze({
								coordinateSpace: "logical-body",
								xPt: _.placement.xPt,
								yPt: _.placement.yPt,
								sectionFlowOwnership: n.vertAnchor === "page" || n.vertAnchor === "margin" ? "page" : "host-flow"
							})
						});
					}
					if (y.verticalPhys && !a(t)) {
						if (e.cursor) throw Error("An upright physical table must remain atomic");
						let t = y.verticalPhys, n = o.layout.columnWidthsPt.reduce((e, t) => e + t, 0);
						if (n > e.availableBlockExtentPt && e.availableBlockExtentPt < e.freshPageBlockExtentPt) return Object.freeze({
							layout: o.layout,
							blockExtentPt: 0,
							nextCursor: Object.freeze({
								kind: "table",
								cursor: s
							}),
							requiresFreshFlowRegion: !0
						});
						let r = t.physicalPageWidthPt - e.location.cursorPt.yPt - n, i = e.location.cursorPt.xPt, a = Math.max(o.layout.advancePt, t.pageHeight - t.marginTop - t.marginBottom), c = `upright-physical-page:${e.location.pageIndex}`, l = nC(o, NS(), {
							availableHeightPt: a,
							freshPageHeightPt: a,
							placement: {
								container: {
									id: c,
									kind: "body",
									bounds: {
										xPt: 0,
										yPt: 0,
										widthPt: n,
										heightPt: a
									}
								},
								cursor: {
									xPt: 0,
									yPt: 0
								},
								availableBounds: {
									xPt: 0,
									yPt: 0,
									widthPt: n,
									heightPt: a
								}
							},
							services: g,
							compatibility: "word",
							oversizedRowPolicy: "atomic",
							page: {
								physicalPageIndex: e.location.pageIndex,
								displayPageNumber: y.displayPageNumber ?? e.location.pageIndex + 1,
								occurrenceId: `${o.input.id}:upright-page:${e.location.pageIndex}`
							},
							floatingTableFrames: {
								page: {
									xPt: 0,
									yPt: 0,
									widthPt: t.pageWidth,
									heightPt: t.pageHeight
								},
								margin: {
									xPt: t.marginLeft,
									yPt: t.marginTop,
									widthPt: Math.max(0, t.pageWidth - t.marginLeft - t.marginRight),
									heightPt: Math.max(0, t.pageHeight - t.marginTop - t.marginBottom)
								},
								column: {
									xPt: t.marginLeft,
									yPt: t.marginTop,
									widthPt: Math.max(0, t.pageWidth - t.marginLeft - t.marginRight),
									heightPt: Math.max(0, t.pageHeight - t.marginTop - t.marginBottom)
								}
							},
							floatingTableRegistry: Object.freeze({
								coordinateSpace: "upright-physical-page-points",
								flowDomainId: c,
								entries: Object.freeze([]),
								nextParagraphId: 0
							}),
							finalPlacementTranslationPt: {
								xPt: r,
								yPt: i
							},
							reacquirePageDependentBlock: N
						});
						if (!l.fragment || l.nextCursor || l.requiresFreshPage) throw Error("Upright table final-frame layout must remain atomic");
						return Object.freeze({
							layout: l.fragment,
							blockExtentPt: n,
							nextCursor: null,
							placement: Object.freeze({
								coordinateSpace: "upright-physical",
								xPt: r + l.fragment.flowBounds.xPt,
								yPt: i + l.fragment.flowBounds.yPt,
								sectionFlowOwnership: "host-flow"
							})
						});
					}
					let u = nC(o, s, {
						availableHeightPt: e.availableBlockExtentPt,
						freshPageHeightPt: e.freshPageBlockExtentPt,
						placement: {
							container: {
								id: e.location.flowDomainId,
								kind: "body",
								bounds: {
									xPt: 0,
									yPt: 0,
									widthPt: e.availableInlineExtentPt,
									heightPt: e.availableBlockExtentPt
								}
							},
							cursor: {
								xPt: 0,
								yPt: 0
							},
							availableBounds: {
								xPt: 0,
								yPt: 0,
								widthPt: e.availableInlineExtentPt,
								heightPt: e.availableBlockExtentPt
							}
						},
						services: g,
						compatibility: "word",
						page: {
							physicalPageIndex: e.location.pageIndex,
							displayPageNumber: e.location.pageIndex + 1,
							occurrenceId: `${o.input.id}:body:${e.location.pageIndex}`
						},
						floatingTableFrames: {
							page: {
								xPt: 0,
								yPt: 0,
								widthPt: y.pageWidth,
								heightPt: c
							},
							margin: {
								xPt: y.marginLeft,
								yPt: y.marginTop,
								widthPt: Math.max(0, y.pageWidth - y.marginLeft - y.marginRight),
								heightPt: Math.max(0, c - y.marginTop - y.marginBottom)
							},
							column: e.location.availableBounds
						},
						floatingTableRegistry: D,
						finalPlacementTranslationPt: {
							xPt: e.location.availableBounds.xPt,
							yPt: e.location.cursorPt.yPt
						},
						reacquirePageDependentBlock: N
					}), d = e.location.availableBounds.xPt + o.layout.flowBounds.xPt, p = d + o.layout.flowBounds.widthPt, m = u.fragment?.advancePt ?? 0, h = $a({
						inlineStartPt: d,
						inlineEndPt: p,
						blockStartPt: e.location.cursorPt.yPt,
						blockExtentPt: m,
						blockers: D.entries.map(Ga),
						overlapEpsilonPt: Va
					}).blockStartPt;
					return h > e.location.cursorPt.yPt ? Object.freeze({
						layout: o.layout,
						blockExtentPt: 0,
						nextCursor: e.cursor ?? null,
						retryAtBlockStartPt: h
					}) : !u.fragment || u.requiresFreshPage ? Object.freeze({
						layout: o.layout,
						blockExtentPt: 0,
						nextCursor: Object.freeze({
							kind: "table",
							cursor: s
						}),
						requiresFreshFlowRegion: !0
					}) : Object.freeze({
						layout: u.fragment,
						blockExtentPt: u.fragment.advancePt,
						nextCursor: u.nextCursor ? Object.freeze({
							kind: "table",
							cursor: u.nextCursor
						}) : null,
						...u.floatingTableRegistryDelta ? { flowRegistryDelta: Object.freeze({ floats: u.floatingTableRegistryDelta }) } : {}
					});
				},
				layoutStory: re,
				layoutNotes(e) {
					let t = [], n = e.container.bounds.yPt, r = e.firstOnPage;
					for (let i of e.referenceIds) {
						if (!(e.kind === "footnote" ? S : ee).has(i)) continue;
						let a = {
							story: e.kind,
							storyInstance: i,
							path: []
						}, o = r ? 6 : 0, s = {
							...e.container,
							id: `${e.container.id}:${e.kind}:${i}`,
							bounds: {
								...e.container.bounds,
								yPt: n + o,
								heightPt: Math.max(0, e.container.bounds.yPt + e.container.bounds.heightPt - n - o)
							}
						}, c;
						try {
							c = re({
								source: a,
								pageIndex: e.pageIndex,
								section: e.section,
								container: s
							});
						} catch (t) {
							throw t instanceof ty && t.containerId === s.id ? new Fp(e.kind, e.pageIndex, e.container.id) : t;
						}
						let l = Object.freeze(r ? [Object.freeze({
							edge: "top",
							from: Object.freeze({
								xPt: e.container.bounds.xPt,
								yPt: n + o / 2
							}),
							to: Object.freeze({
								xPt: e.container.bounds.xPt + e.container.bounds.widthPt / 3,
								yPt: n + o / 2
							}),
							color: "#000000",
							widthPt: .5,
							authoredStyle: "single",
							style: "solid"
						})] : []), u = o + c.advancePt, d = Object.freeze({
							xPt: e.container.bounds.xPt,
							yPt: n,
							widthPt: e.container.bounds.widthPt,
							heightPt: u
						}), f = Object.freeze({
							kind: "note",
							id: `${e.kind}:${i}:page:${e.pageIndex}`,
							source: a,
							flowDomainId: e.container.id,
							ordinaryFlow: !0,
							flowBounds: d,
							inkBounds: Object.freeze({
								xPt: Math.min(d.xPt, c.inkBounds.xPt),
								yPt: Math.min(d.yPt, c.inkBounds.yPt),
								widthPt: Math.max(d.xPt + d.widthPt, c.inkBounds.xPt + c.inkBounds.widthPt) - Math.min(d.xPt, c.inkBounds.xPt),
								heightPt: Math.max(d.yPt + d.heightPt, c.inkBounds.yPt + c.inkBounds.heightPt) - Math.min(d.yPt, c.inkBounds.yPt)
							}),
							clipBounds: e.container.bounds,
							advancePt: u,
							separator: l,
							story: c
						});
						t.push(f), n += u, r = !1;
					}
					return Object.freeze(t);
				},
				measureFollowingBlock(e) {
					let t = {
						...y,
						floats: [...y.floats],
						retainedTablesBySourceIndex: new Map(y.retainedTablesBySourceIndex)
					};
					if (k(t, e.location), e.input.kind === "adjacent-table-group") {
						let n = e.input.tables.map((n) => {
							let r = i(n.source);
							if (r.type !== "table") throw Error("Following table source kind mismatch");
							let a = n.source.path[0];
							return f(t, r, e.availableInlineExtentPt, a), Ub(t, a).acquisition;
						}), a = uS(r(AS(e.input.logicalSequenceId, n.map((e) => e.input))), {
							container: {
								id: e.location.flowDomainId,
								kind: "body",
								bounds: e.location.availableBounds
							},
							cursor: e.location.cursorPt,
							availableBounds: e.location.availableBounds
						}, g).layout;
						return Object.freeze({
							fullExtentPt: a.advancePt,
							leadContentExtentPt: a.rows[0]?.advancePt ?? a.advancePt,
							fullFootnoteReferenceIds: Fv(a),
							leadFootnoteReferenceIds: Fv({
								...a,
								rows: a.rows.slice(0, 1)
							})
						});
					}
					let n = i(e.input.source);
					if (e.input.kind === "paragraph") {
						if (n.type !== "paragraph") throw Error("Following paragraph source kind mismatch");
						let { layout: r } = u(t, n, e.input.source, e.location, e.availableInlineExtentPt, !1, void 0, O.entries), i = r.lines[0];
						return Object.freeze({
							fullExtentPt: r.advancePt,
							leadContentExtentPt: i ? i.bounds.yPt + i.advancePt - r.flowBounds.yPt : r.advancePt,
							fullFootnoteReferenceIds: Fv(r),
							leadFootnoteReferenceIds: i ? Pv([i]) : []
						});
					}
					if (n.type !== "table") throw Error("Following table source kind mismatch");
					let a = e.input.source.path[0];
					f(t, n, e.availableInlineExtentPt, a);
					let o = Ub(t, a).acquisition.layout;
					return Object.freeze({
						fullExtentPt: o.advancePt,
						leadContentExtentPt: o.rows[0]?.advancePt ?? o.advancePt,
						fullFootnoteReferenceIds: Fv(o),
						leadFootnoteReferenceIds: Fv({
							...o,
							rows: o.rows.slice(0, 1)
						})
					});
				},
				prescanPageAnchors(e) {
					let t = e.location.section.geometry, n = _u(t.marginTop), r = _u(t.marginBottom), a = Object.freeze({
						page: Object.freeze({
							xPt: 0,
							yPt: 0,
							widthPt: t.pageWidth,
							heightPt: t.pageHeight
						}),
						margin: Object.freeze({
							xPt: t.marginLeft,
							yPt: n,
							widthPt: Math.max(0, t.pageWidth - t.marginLeft - t.marginRight),
							heightPt: Math.max(0, t.pageHeight - n - r)
						}),
						column: Object.freeze({
							xPt: e.location.availableBounds.xPt,
							yPt: n,
							widthPt: e.availableInlineExtentPt,
							heightPt: Math.max(0, t.pageHeight - n - r)
						}),
						paragraph: null,
						line: null,
						character: null,
						pageParity: e.location.pageIndex % 2 == 0 ? "odd" : "even"
					}), s = /* @__PURE__ */ new Set(), c = (e) => `${e.story}:${e.storyInstance}:${e.path.join(".")}`, l = /* @__PURE__ */ new Map(), u = (e) => {
						let t = c(e);
						return l.has(t) || l.set(t, D.nextParagraphId + l.size), l.get(t);
					}, d = e.anchors.flatMap((t) => {
						let n = i(t.paragraphSource);
						if (n.type !== "paragraph") throw Error("Page-anchor prescan source kind mismatch");
						let r = n, c = r.runs.filter((e) => e.type === "anchorHost" && e.anchorOccurrenceId === t.occurrenceId), l = r.runs.map((e, t) => ({
							run: e,
							runIndex: t
						})).filter((e) => (e.run.type === "image" || e.run.type === "chart" || e.run.type === "shape" || e.run.type === "unavailableDrawing") && e.run.anchorAcquisitionInput?.occurrenceId === t.occurrenceId).sort((e, t) => (e.run.anchorAcquisitionInput.group?.sourceIndex ?? 0) - (t.run.anchorAcquisitionInput.group?.sourceIndex ?? 0) || e.runIndex - t.runIndex);
						if (c.length !== 1 || l.length === 0) {
							let r = n.runs.find((e, n) => o(t.paragraphSource, n)?.occurrenceId === t.occurrenceId);
							if (r) {
								if ((r.type === "image" || r.type === "chart" || r.type === "shape") && r.wrapMode === "none") return [];
								let i = {
									...y,
									floats: [...y.floats],
									pageAnchorPrescanned: new Set(y.pageAnchorPrescanned)
								};
								k(i, e.location);
								let a = j(n, t.paragraphSource, i, new Set([t.occurrenceId]), u(t.paragraphSource));
								if (a.length !== 1) throw Error(`Public page-anchor prescan occurrence mismatch: ${t.occurrenceId}`);
								return s.add(n), a;
							}
							throw Error(`Page-anchor prescan occurrence acquisition mismatch: ${t.occurrenceId}`);
						}
						let d = _g({
							acquisition: l[0].run.anchorAcquisitionInput,
							frames: a
						});
						if (d.status !== "resolved") throw Error(`Page-anchor prescan could not resolve occurrence: ${t.occurrenceId}`);
						let f = Ab(e.location.section.textDirection) ? (() => {
							let t = mi(e.location.section.textDirection);
							return B_(d, Si(t, bi({
								widthPt: a.page.widthPt,
								heightPt: a.page.heightPt
							}, t)));
						})() : d, p = f.geometry.wrapBounds;
						if (p === null || f.geometry.wrap.kind === "none") return [];
						let m = f.geometry.wrap.polygon?.points ?? Object.freeze([
							Object.freeze({
								xPt: p.xPt,
								yPt: p.yPt
							}),
							Object.freeze({
								xPt: p.xPt + p.widthPt,
								yPt: p.yPt
							}),
							Object.freeze({
								xPt: p.xPt + p.widthPt,
								yPt: p.yPt + p.heightPt
							}),
							Object.freeze({
								xPt: p.xPt,
								yPt: p.yPt + p.heightPt
							})
						]);
						return [Object.freeze({
							kind: "shape",
							occurrenceId: t.occurrenceId,
							paragraphId: u(t.paragraphSource),
							bounds: f.geometry.objectFrame,
							exclusionBounds: p,
							wrap: f.geometry.wrap.kind,
							wrapSide: f.geometry.wrap.side,
							wrapDistances: f.geometry.wrap.distances,
							wrapPolygon: Object.freeze([...m])
						})];
					});
					return s.forEach((e) => y.pageAnchorPrescanned?.add(e)), d.length === 0 ? null : Object.freeze({ floats: Object.freeze({
						coordinateSpace: "logical-page-points",
						flowDomainId: D.flowDomainId,
						baseEntries: D.entries,
						baseNextParagraphId: D.nextParagraphId,
						nextParagraphId: D.nextParagraphId + d.length,
						entries: Object.freeze(d)
					}) });
				},
				measureLineNumberGlyph(n) {
					let r = t.font;
					try {
						let r = e.fonts.defaultBodyFontSizePt, i = Rs(!1, !1, r, null, {});
						t.font = i;
						let a = t.measureText(n);
						return Object.freeze({
							widthPt: a.width,
							ascentPt: a.fontBoundingBoxAscent ?? a.actualBoundingBoxAscent ?? r * .8,
							descentPt: a.fontBoundingBoxDescent ?? a.actualBoundingBoxDescent ?? r * .2,
							font: i
						});
					} finally {
						t.font = r;
					}
				},
				resetPageAcquisition(e) {
					y.floats = [], y.floatParaSeq = 0, y.pageAnchorPrescanned = /* @__PURE__ */ new Set(), D = Object.freeze({
						coordinateSpace: "logical-page-points",
						flowDomainId: w(e.pageIndex),
						entries: Object.freeze([]),
						nextParagraphId: 0
					}), O = cC(w(e.pageIndex), "logical-page-points"), A(e);
				},
				moveAcquisitionCursor: A,
				flowRegistrySnapshot() {
					return Object.freeze({
						floats: D,
						drawingCollisions: O
					});
				},
				commitFlowRegistryDelta(e) {
					if (!e.floats && !e.drawingCollisions) throw Error("Body flow registry delta must update at least one registry");
					e.floats && Sb(e.floats, {
						coordinateSpace: D.coordinateSpace,
						flowDomainId: D.flowDomainId,
						entries: D.entries,
						nextParagraphId: D.nextParagraphId
					}), e.drawingCollisions && uC(O, e.drawingCollisions);
					let t = e.drawingCollisions ? dC(O, e.drawingCollisions) : O, n = (e.floats?.entries ?? []).map((e) => {
						let t = e.wrapDistances?.leftPt ?? e.bounds.xPt - e.exclusionBounds.xPt, n = e.wrapDistances?.topPt ?? e.bounds.yPt - e.exclusionBounds.yPt, r = e.wrapDistances?.rightPt ?? e.exclusionBounds.xPt + e.exclusionBounds.widthPt - e.bounds.xPt - e.bounds.widthPt, i = e.wrapDistances?.bottomPt ?? e.exclusionBounds.yPt + e.exclusionBounds.heightPt - e.bounds.yPt - e.bounds.heightPt, a = {
							mode: e.wrap === "topAndBottom" ? "topAndBottom" : "square",
							...e.kind === "shape" ? {
								anchorOccurrenceId: e.occurrenceId,
								acquisitionOccurrenceId: e.occurrenceId
							} : {},
							...e.wrap ? {
								authoredWrap: e.wrap,
								wrapPolygon: e.wrapPolygon
							} : {},
							imageKey: e.exclusionId ?? (e.kind === "table" ? `body:float:${e.paragraphId}` : ""),
							imageX: e.bounds.xPt,
							imageY: e.bounds.yPt,
							imageW: e.bounds.widthPt,
							imageH: e.bounds.heightPt,
							xLeft: e.exclusionBounds.xPt,
							xRight: e.exclusionBounds.xPt + e.exclusionBounds.widthPt,
							yTop: e.exclusionBounds.yPt,
							yBottom: e.exclusionBounds.yPt + e.exclusionBounds.heightPt,
							side: e.wrapSide ?? "bothSides",
							distLeft: t,
							distRight: r,
							distTop: n,
							distBottom: i,
							paraId: e.paragraphId
						};
						return e.kind === "table" ? {
							...a,
							kind: "table",
							tableOverlap: e.overlap
						} : {
							...a,
							kind: e.kind
						};
					});
					e.floats && (y.floats.push(...n), D = Object.freeze({
						...D,
						entries: Object.freeze([...D.entries, ...e.floats.entries]),
						nextParagraphId: e.floats.nextParagraphId
					}), y.floatParaSeq = e.floats.nextParagraphId), O = t;
				}
			};
			return Object.freeze(ie);
		} });
	}
	function d(e, t) {
		return Ib(t, Vb(t, e));
	}
	function f(e, t, n, r) {
		let i = e.retainedTablesBySourceIndex.get(r);
		if (i?.contentWidthPt === n && i.reusableAcrossPages) {
			let e = i.acquisition.layout.rows.map((e) => e.advancePt);
			return {
				colWidthsPt: [...i.acquisition.layout.columnWidthsPt],
				rowContentHeightsPt: e,
				rowHeightsPt: e
			};
		}
		let a = p(t, n, e), o = e.retainedTableAcquisition, s = yS(t, a, n, e, [r], o), c = i?.contentWidthPt === n ? Object.freeze({
			...s,
			layout: Object.freeze({
				...s.layout,
				columnWidthsPt: i.acquisition.layout.columnWidthsPt
			})
		}) : s;
		e.retainedTablesBySourceIndex.set(r, Object.freeze({
			sourceIndex: r,
			acquisition: c,
			contentWidthPt: n,
			reusableAcrossPages: pS(c),
			anchorYPt: e.y
		}));
		let l = c.layout.rows.map((e) => e.advancePt);
		return {
			colWidthsPt: a,
			rowContentHeightsPt: l,
			rowHeightsPt: l
		};
	}
	function p(e, t, n) {
		let r = n.acquisitionInputs.tableFormatInput(e), i = Number.isFinite(e.tblInd) ? e.tblInd ?? 0 : 0, a = r.rows.map((e) => {
			let t = e.exception;
			return t?.indentAuthored ? t.indentPt ?? 0 : i;
		}), o = n.storyContext?.story, s = n.storyContext?.containers.length === 0 && (o === "header" || o === "footer" || o === "body" && n.sectionLayout?.columns.length === 1), c = r.ordinaryFlow && s && !Ab(n.sectionLayout.textDirection) && [i, ...a].some((e) => e < 0), l = r.rows.length === 0 ? [{
			justification: e.jc,
			indentPt: i
		}] : r.rows.map((t, n) => ({
			justification: t.justification ?? e.jc,
			indentPt: a[n] ?? i
		})), u = e.bidiVisual === !0, d = Math.min(n.pageWidth, ...l.map(({ justification: e, indentPt: r }) => {
			let i = e === "right" || e === "end", a = e === "center" ? "center" : (u ? !i : i) ? "right" : "left", o = u ? -r : r;
			if (a === "left") {
				let e = n.contentX + o;
				return n.pageWidth - e;
			}
			if (a === "right") return n.contentX + t + o;
			let s = n.contentX + t / 2 + o;
			return 2 * Math.min(s, n.pageWidth - s);
		})), f = c ? Math.max(t, d) : t, p = (r.firstRowException?.layout === "fixed" ? "fixed" : e.layout) === "fixed" && n.storyContext?.containers.some((e) => e.kind === "tableCell"), m = (e, r = n.acquisitionInputs.tableFormatInput(e)) => {
			let i = /* @__PURE__ */ new WeakMap();
			return e.rows.forEach((t, n) => t.cells.forEach((t, a) => {
				let o = r.rows[n]?.cells[a]?.marginsPt;
				i.set(t, o ?? A(t, e));
			})), (r) => Ol(r, i.get(r) ?? A(r, e), {
				paragraph: (e) => {
					let r = su(n.layoutSettings, n.sectionLayout, n.storyContext ?? Lb, e), i = e.numbering ? n.acquisitionInputs.numberingMarkerShapeInput(e.numbering, Vs(e)) : void 0, a = ll(r, {
						numbering: e.numbering,
						...i ? { markerInput: i } : {},
						authoredFirstIndentPt: e.indentFirst,
						tabStops: e.tabStops,
						defaultTabPt: n.defaultTabPt,
						service: n.layoutServices?.text,
						clusterGeometry: !1
					}), o = a.numberingMarkerGeometry ?? (e.numbering && i && n.layoutServices?.text ? fl(e.numbering, i, {
						authoredFirstIndentPt: e.indentFirst,
						physicalIndentLeftPt: a.physicalIndentLeftPt,
						tabStops: e.tabStops,
						defaultTabPt: n.defaultTabPt
					}, n.layoutServices.text, !1) : void 0);
					return Pl(e, a, t, {
						context: n.ctx,
						fontFamilyClasses: n.fontFamilyClasses
					}, Fb(n), o, { preserveWhitespaceOnlyContent: !0 });
				},
				nestedTable: (e) => xx(n.acquisitionInputs.tableColumnLayoutInput(e, t, m(e), t))
			});
		};
		return [...Ex(n.acquisitionInputs.tableColumnLayoutInput(e, t, m(e, r), p ? null : n.acquisitionInputs.tableParticipatesInOrdinaryFlow(e) ? f : Math.max(t, n.pageWidth)))];
	}
	function m(e, t, n) {
		let r = e.indexOf(t);
		for (let t = r + 1; t < e.length; t++) {
			let r = e[t];
			if (r.type !== "paragraph") continue;
			let i = r;
			if (!i.framePr) return xc(i, 1, d(i, n), Bb(n, i).hasRuby, n.docEastAsian, n.ctx, n.fontFamilyClasses, i.lineSpacing, n.resolvedLocalFonts, n.layoutServices?.text, n.acquisitionInputs.paragraphMarkShapeInput(i), n.layoutSettings.compat.useFeLayout);
		}
		let i = t;
		return xc(i, 1, d(i, n), Bb(n, i).hasRuby, n.docEastAsian, n.ctx, n.fontFamilyClasses, i.lineSpacing, n.resolvedLocalFonts, n.layoutServices?.text, n.acquisitionInputs.paragraphMarkShapeInput(i), n.layoutSettings.compat.useFeLayout);
	}
	function h(e, t, n, r, i) {
		let a = {
			context: n.ctx,
			fontFamilyClasses: n.fontFamilyClasses
		}, o = Fb(n), s = t.members.map(Yl), c = ob(t.framePr.hAnchor, n), l = {
			contentXPt: n.contentX,
			contentWidthPt: n.contentW,
			pageHeightPt: n.pageH,
			yPt: n.y,
			anchorLineHeightPt: r
		}, u = hv(t, {
			contexts: t.members.map((e) => Bb(n, e)),
			inputs: t.members,
			borderEdges: s,
			borderExtentsPt: t.members.map((e, t) => s[t]?.bottom === "none" ? 0 : Fl(e.borders)),
			measurer: a,
			environment: o,
			containerShading: n.containerShading,
			maximumWidthPt: Math.max(0, c.right - c.left),
			acquisitionSession: n,
			placementSignature: [
				l.contentXPt,
				l.contentWidthPt,
				l.pageHeightPt,
				l.yPt,
				l.anchorLineHeightPt,
				n.pageWidth,
				n.marginLeft,
				n.marginRight,
				n.marginTop,
				n.marginBottom
			].join("|"),
			place: (e, r) => {
				let i = db(t.framePr, n, l.yPt, e, r, l.anchorLineHeightPt);
				return Object.freeze({
					bounds: Object.freeze({
						xPt: i.x,
						yPt: i.y,
						widthPt: i.w,
						heightPt: i.h
					}),
					exclusionBounds: Object.freeze({
						xPt: i.exLeft,
						yPt: i.exTop,
						widthPt: i.exRight - i.exLeft,
						heightPt: i.exBottom - i.exTop
					})
				});
			},
			anchorFrames: Rb(n)
		});
		i?.(u);
		let d = {
			x: u.box.bounds.xPt,
			y: u.box.bounds.yPt,
			w: u.box.bounds.widthPt,
			h: u.box.bounds.heightPt,
			exLeft: u.box.exclusionBounds.xPt,
			exTop: u.box.exclusionBounds.yPt,
			exRight: u.box.exclusionBounds.xPt + u.box.exclusionBounds.widthPt,
			exBottom: u.box.exclusionBounds.yPt + u.box.exclusionBounds.heightPt,
			registerExclusion: !0,
			exclusionId: u.box.exclusionId
		};
		return e === t.owner ? d : {
			...d,
			registerExclusion: !1
		};
	}
	function g(e, t, n) {
		if (t.verticalPhys) {
			let n = g(e, C(t), t.contentX);
			return kC(n.x, n.y, n.w, n.h, t.verticalPhys.physicalPageWidthPt);
		}
		let r = e.widthPt, i = e.heightPt, a = e.anchorXPt, o = e.anchorYPt, s = e.groupWidthPt ?? null, c = e.groupHeightPt ?? null;
		if (e.widthPct != null) {
			let n = Tb(e.widthRelativeFrom, !1, t), i = (n.end - n.start) * e.widthPct;
			if (e.groupWidthPt != null && e.groupWidthPt > 0) {
				let t = i / e.groupWidthPt;
				r = e.widthPt * t, a = e.anchorXPt * t;
			} else r = i;
			s = i;
		}
		if (e.heightPct != null) {
			let r = Eb(e.heightRelativeFrom, !1, n, t), a = (r.end - r.start) * e.heightPct;
			if (e.groupHeightPt != null && e.groupHeightPt > 0) {
				let t = a / e.groupHeightPt;
				i = e.heightPt * t, o = e.anchorYPt * t;
			} else i = a;
			c = a;
		}
		return {
			x: Db(e.anchorXAlign, e.anchorXFromMargin, a, r, t, e.anchorXRelativeFrom, e.pctPosH, s),
			y: Ob(e.anchorYAlign, e.anchorYFromPara, o, i, n, t, e.anchorYRelativeFrom, e.pctPosV, c),
			w: r,
			h: i
		};
	}
	let _ = (e, t, n) => w(e, t, n), v = (e, t, n) => g(e, t, n), y = (e) => Nb(e), b = (e) => Mb(e), x = (e, t, n) => E(e, t, n);
	function S(e) {
		let t = e.verticalPhys;
		return t ? {
			...e,
			pageWidth: t.pageWidth,
			marginLeft: t.marginLeft,
			marginRight: t.marginRight,
			marginTop: t.marginTop,
			marginBottom: t.marginBottom,
			pageH: t.pageHeight
		} : e;
	}
	function C(e) {
		let t = e.verticalPhys;
		return t ? {
			...S(e),
			contentX: t.marginLeft,
			contentW: t.pageWidth - t.marginLeft - t.marginRight,
			verticalCJK: !1,
			verticalAllRotated: !1,
			verticalPhys: void 0,
			floats: []
		} : e;
	}
	function w(e, t, n) {
		let r = e.widthPt, i = e.heightPt, a = e.distLeft ?? 0, o = e.distRight ?? 0, s = e.distTop ?? 0, c = e.distBottom ?? 0;
		if (t.verticalPhys) {
			let n = S(t), l = kC(Db(e.anchorXAlign, e.anchorXFromMargin ?? !1, e.anchorXPt ?? 0, r, n, e.anchorXRelativeFrom ?? null, null, null), Ob(e.anchorYAlign, e.anchorYFromPara ?? !1, e.anchorYPt ?? 0, i, t.contentX, n, e.anchorYRelativeFrom ?? null, null, null), r, i, t.verticalPhys.physicalPageWidthPt);
			return {
				x: l.x,
				y: l.y,
				w: l.w,
				h: l.h,
				dl: s,
				dr: c,
				dt: o,
				db: a
			};
		}
		return {
			x: Db(e.anchorXAlign, e.anchorXFromMargin ?? !1, e.anchorXPt ?? 0, r, t, e.anchorXRelativeFrom ?? null, null, null),
			y: Ob(e.anchorYAlign, e.anchorYFromPara ?? !1, e.anchorYPt ?? 0, i, n, t, e.anchorYRelativeFrom ?? null, null, null),
			w: r,
			h: i,
			dl: a,
			dr: o,
			dt: s,
			db: c
		};
	}
	function T(e, t, n) {
		let r = t.floatParaSeq++, i = t.pageAnchorPrescanned?.has(e) ?? !1;
		for (let a of e.runs) if (a.type === "image") {
			let e = a;
			if (i && pC(e)) continue;
			D(e, t, n, r);
		} else if (a.type === "chart") {
			let e = a;
			if (i && pC(e)) continue;
			O(e, t, n, r);
		} else if (a.type === "shape") {
			let e = a;
			if (i && pC(e)) continue;
			k(e, t, n, r);
		}
	}
	function E(e, t, n) {
		n.pageAnchorPrescanned ||= /* @__PURE__ */ new Set();
		for (let r = t; r < e.length; r++) {
			let t = e[r];
			if (!t) continue;
			if (t.type === "pageBreak") break;
			if (t.type === "sectionBreak") {
				let e = t;
				if (e.kind && e.kind !== "continuous") break;
				continue;
			}
			if (t.type !== "paragraph") continue;
			let i = t;
			if (n.pageAnchorPrescanned.has(i)) continue;
			let a = !1;
			for (let e of i.runs) if (e.type === "image") {
				if (pC(e)) {
					a = !0;
					break;
				}
			} else if (e.type === "chart") {
				if (pC(e)) {
					a = !0;
					break;
				}
			} else if (e.type === "shape" && pC(e)) {
				a = !0;
				break;
			}
			if (!a) continue;
			let o = n.floatParaSeq++;
			for (let e of i.runs) if (e.type === "image") {
				let t = e;
				if (!pC(t)) continue;
				D(t, n, 0, o);
			} else if (e.type === "chart") {
				let t = e;
				if (!pC(t)) continue;
				O(t, n, 0, o);
			} else if (e.type === "shape") {
				let t = e;
				if (!pC(t)) continue;
				k(t, n, 0, o);
			}
			n.pageAnchorPrescanned.add(i);
		}
	}
	function D(e, t, n, r) {
		if (!e.anchor || !so(e.wrapMode)) return;
		let i = e.wrapMode === "topAndBottom" ? "topAndBottom" : "square", a = w(e, t, n), { w: o, h: s, dl: l, dr: u, dt: d, db: f } = a, p = e.allowOverlap ?? !0, m = c(e.imagePath, e.colorReplaceFrom, e.duotone);
		fb(t, {
			x: a.x,
			y: a.y,
			w: o,
			h: s,
			dl: l,
			dr: u,
			dt: d,
			db: f,
			kind: "shape",
			mode: i,
			side: e.wrapSide ?? "bothSides",
			imageKey: m,
			paraId: r,
			avoidOverlap: !0,
			allowOverlap: p
		});
	}
	function O(e, t, n, r) {
		if (!e.anchor || !so(e.wrapMode)) return;
		let i = w(e, t, n), { w: a, h: o, dl: s, dr: c, dt: l, db: u } = i;
		a <= 0 || o <= 0 || fb(t, {
			x: i.x,
			y: i.y,
			w: a,
			h: o,
			dl: s,
			dr: c,
			dt: l,
			db: u,
			kind: "shape",
			mode: e.wrapMode === "topAndBottom" ? "topAndBottom" : "square",
			side: e.wrapSide ?? "bothSides",
			allowOverlap: e.allowOverlap ?? !0,
			avoidOverlap: !0,
			paraId: r,
			imageKey: ""
		});
	}
	function k(e, t, n, r) {
		if (!so(e.wrapMode)) return;
		let { x: i, y: a, w: o, h: s } = g(e, t, n);
		if (o <= 0 || s <= 0) return;
		let c = e.wrapMode === "topAndBottom" ? "topAndBottom" : "square", l = e.distLeft ?? 0, u = e.distRight ?? 0, d = e.distTop ?? 0, f = e.distBottom ?? 0, p = !!t.verticalPhys;
		fb(t, {
			x: i,
			y: a,
			w: o,
			h: s,
			dl: p ? d : l,
			dr: p ? f : u,
			dt: p ? u : d,
			db: p ? l : f,
			kind: "shape",
			mode: c,
			side: e.wrapSide ?? "bothSides",
			imageKey: "",
			paraId: r,
			avoidOverlap: !0,
			allowOverlap: !0
		});
	}
	function A(e, t) {
		return {
			top: e.marginTop ?? t.cellMarginTop,
			bottom: e.marginBottom ?? t.cellMarginBottom,
			left: e.marginLeft ?? t.cellMarginLeft,
			right: e.marginRight ?? t.cellMarginRight
		};
	}
	let j = u(e, t, n);
	return Object.freeze({
		kernel: j,
		internals: Object.freeze({
			resolveColumnWidths: p,
			resolveAnchorBox: _,
			resolveShapeBox: v,
			physicalLayoutSection: y,
			verticalLayoutSection: b,
			preRegisterPageFloats: x
		})
	});
}
//#endregion
//#region packages/docx/src/document-content.ts
function* jC(e) {
	e.textPath && (yield {
		text: e.textPath.string,
		fontFamilies: [e.textPath.fontFamily],
		bold: e.textPath.bold,
		italic: e.textPath.italic
	});
	for (let t of e.textBlocks ?? []) yield* MC(t);
}
function* MC(e) {
	if (e.numbering && (yield {
		text: e.numbering.text,
		fontFamilies: [e.numbering.fontFamily, e.numbering.fontFamilyEastAsia],
		bold: !1,
		italic: !1
	}), e.runs?.length) for (let t of e.runs) yield {
		text: t.text,
		fontFamilies: [
			t.fontFamily,
			t.fontFamilyEastAsia,
			e.fontFamily
		],
		bold: t.bold ?? e.bold,
		italic: t.italic ?? e.italic
	};
	else yield {
		text: e.text,
		fontFamilies: [e.fontFamily],
		bold: e.bold,
		italic: e.italic
	};
}
function* NC(e) {
	if (e.type === "text") {
		let t = e;
		yield {
			text: e.text,
			fontFamilies: [
				e.fontFamily,
				t.fontFamilyHighAnsi,
				e.fontFamilyEastAsia
			],
			bold: e.bold,
			italic: e.italic
		}, yield {
			text: e.text,
			fontFamilies: [e.fontFamilyCs],
			bold: e.boldCs ?? !1,
			italic: e.italicCs ?? !1
		};
	} else if (e.type === "field") {
		let t = e;
		yield {
			text: t.fallbackText,
			fontFamilies: [
				t.fontFamily,
				t.fontFamilyHighAnsi,
				t.fontFamilyEastAsia
			],
			bold: t.bold,
			italic: t.italic
		}, yield {
			text: t.fallbackText,
			fontFamilies: [t.fontFamilyCs],
			bold: t.boldCs ?? !1,
			italic: t.italicCs ?? !1
		};
	} else e.type === "shape" ? yield* jC(e) : e.type === "anchorHost" && (yield {
		text: "",
		fontFamilies: [e.fontFamily, e.fontFamilyEastAsia],
		bold: e.bold,
		italic: e.italic
	});
}
function* PC(e) {
	yield {
		text: "",
		fontFamilies: [e.defaultFontFamily, e.defaultFontFamilyEastAsia]
	}, e.numbering && (yield {
		text: e.numbering.text,
		fontFamilies: [e.numbering.fontFamily, e.numbering.fontFamilyEastAsia]
	});
	for (let t of e.runs) yield* NC(t);
}
function* FC(e) {
	for (let t of e.rows) for (let e of t.cells) yield* LC(e.content);
}
function* IC(e) {
	if (e) for (let t of [
		e.default,
		e.first,
		e.even
	]) t && (yield* LC(t.body));
}
function* LC(e) {
	for (let t of e) t.type === "paragraph" ? yield* PC(t) : t.type === "table" ? yield* FC(t) : t.type === "sectionBreak" && (yield* IC(t.headers), yield* IC(t.footers));
}
function* RC(e) {
	yield* LC(e.body ?? []), yield* IC(e.headers), yield* IC(e.footers);
	for (let t of [...e.footnotes ?? [], ...e.endnotes ?? []]) yield* LC(t.content);
}
function zC(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of RC(e)) for (let e of n.fontFamilies) {
		let n = e?.trim();
		n && t.add(n);
	}
	return [...t];
}
//#endregion
//#region packages/docx/src/google-fonts.ts
var BC = {
	...D,
	...x
};
function* VC(e) {
	for (let t of RC(e)) yield t.text;
}
function HC(e) {
	let t = E(e.majorFont) ?? E(e.minorFont) ?? null;
	return [
		e.majorFont,
		e.minorFont,
		...T(VC(e), t)
	];
}
//#endregion
//#region packages/docx/src/layout/font-service.ts
function UC(e) {
	return e.trim().toLocaleLowerCase("en-US");
}
function WC(e) {
	return e == null || !Number.isFinite(e) ? 400 : Math.min(900, Math.max(100, Math.round(e / 100) * 100));
}
function GC(e) {
	return Object.freeze({
		...e,
		diagnostics: Object.freeze([...e.diagnostics])
	});
}
function KC(e) {
	return `"${e.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
}
function qC(e, t) {
	return `${KC(e)}, ${t}`;
}
function JC(e, t = {}) {
	let n = {
		embedded: 0,
		local: 1,
		google: 2,
		substitute: 3
	}, r = e.filter((e) => e.requestedFamily.trim() && e.resolvedFamily.trim()).map((e) => Object.freeze({
		...e,
		weight: WC(e.weight),
		style: e.style ?? "normal"
	})).sort((e, t) => UC(e.requestedFamily).localeCompare(UC(t.requestedFamily)) || n[e.source] - n[t.source] || e.resolvedFamily.localeCompare(t.resolvedFamily) || e.weight - t.weight || e.style.localeCompare(t.style)), i = /* @__PURE__ */ new Map();
	for (let e of r) {
		let t = UC(e.requestedFamily);
		i.set(t, [...i.get(t) ?? [], e]);
	}
	let a = Object.freeze(Object.fromEntries(Object.entries(t.nativeFamilyLists ?? {}).filter(([e, t]) => e.trim() && t.trim()).map(([e, t]) => [UC(e), t]).sort(([e], [t]) => e.localeCompare(t)))), o = it("fonts", {
		faces: r,
		nativeFamilyLists: a
	});
	return Object.freeze({
		fingerprint: o,
		resolve(e) {
			let t = e.requestedFamily?.trim() || e.genericFamily || "sans-serif", n = WC(e.weight), r = e.style ?? "normal", o = (i.get(UC(t)) ?? []).find((e) => e.weight === n && e.style === r);
			if (o) {
				let i = o.source === "substitute" ? [{
					code: "UNSUPPORTED_FEATURE",
					severity: "warning",
					message: `ECMA-376 §17.8.2 implementation-dependent font substitution: ${t} resolved to ${o.resolvedFamily}`
				}] : [], a = qC(o.resolvedFamily, e.genericFamily ?? "sans-serif");
				return GC({
					requestedFamily: t,
					resolvedFamily: o.resolvedFamily,
					route: ot(a, "registered"),
					source: o.source,
					weight: n,
					style: r,
					diagnostics: i,
					genericFamily: e.genericFamily ?? "sans-serif"
				});
			}
			let s = e.genericFamily ?? "sans-serif", c = e.requestedFamily?.trim();
			return GC(c ? {
				requestedFamily: t,
				resolvedFamily: c,
				route: ot(a[UC(c)] ?? qC(c, s), "native"),
				source: "native",
				weight: n,
				style: r,
				diagnostics: [],
				genericFamily: s
			} : {
				requestedFamily: t,
				resolvedFamily: s,
				route: ot(s, "generic"),
				source: "generic",
				weight: n,
				style: r,
				diagnostics: [],
				genericFamily: s
			});
		}
	});
}
//#endregion
//#region packages/docx/src/layout/production-services.ts
function YC(e, t) {
	let n = Ri(t.localMetrics), r = Object.freeze(Object.fromEntries(Object.entries(e.fontFamilyCharsets).map(([e, t]) => [e.trim().toLowerCase(), t]))), i = (e) => e.trim().replace(/^(['"])(.*)\1$/, "$2"), a = (e) => i(e).toLocaleLowerCase("en-US"), o = (e) => {
		let t = e.style.trim().toLocaleLowerCase("en-US");
		return t === "normal" || t === "italic" ? t : null;
	}, s = (e) => {
		let t = e.weight.trim().toLocaleLowerCase("en-US");
		if (t === "normal") return 400;
		if (t === "bold") return 700;
		if (!/^\d+$/.test(t)) return null;
		let n = Number(t);
		return n >= 100 && n <= 900 ? n : null;
	}, c = (e) => e.flatMap((e) => {
		if (e.status !== "loaded") return [];
		let t = s(e), n = o(e);
		return t == null || n == null ? [] : [{
			family: a(e.family),
			displayFamily: i(e.family),
			weight: t,
			style: n
		}];
	}), l = new Map(c(t.embeddedFaces ?? []).map((e) => [`${e.family}:${e.weight}:${e.style}`, e])), u = e.fonts.embeddedFonts.flatMap((e) => {
		let t = e.style === "bold" || e.style === "boldItalic" ? 700 : 400, n = e.style === "italic" || e.style === "boldItalic" ? "italic" : "normal", r = l.get(`${a(e.fontName)}:${t}:${n}`);
		return r ? [{
			requestedFamily: e.fontName,
			resolvedFamily: r.displayFamily,
			source: "embedded",
			weight: t,
			style: n
		}] : [];
	});
	for (let [e, t] of Object.entries(n)) u.push({
		requestedFamily: t.requestedFamily ?? e,
		resolvedFamily: t.family,
		source: "local",
		weight: t.weight ?? 400,
		style: t.style ?? "normal"
	});
	if (t.useGoogleFonts) {
		let n = c(t.googleFaces ?? []), r = /* @__PURE__ */ new Set();
		for (let t of e.fonts.preloadNames) {
			if (!t) continue;
			let e = t.toLocaleLowerCase("en-US");
			if (r.has(e)) continue;
			r.add(e);
			let i = BC[e], o = i?.loadFamily ?? t;
			if (i) for (let e of n.filter((e) => e.family === a(o))) u.push({
				requestedFamily: t,
				resolvedFamily: e.displayFamily,
				source: a(o) === a(t) ? "google" : "substitute",
				weight: e.weight,
				style: e.style
			});
		}
	}
	let d = t.measureContext, f = [...new Set([
		...Object.keys(e.fonts.familyClasses),
		...Object.keys(e.fonts.familyPitches),
		...e.fonts.renderedFamilies,
		...e.fonts.majorFamily ? [e.fonts.majorFamily] : [],
		...e.fonts.minorFamily ? [e.fonts.minorFamily] : []
	])], p = Ui({
		fonts: JC(u, { nativeFamilyLists: Object.fromEntries(f.map((t) => [t, Ls(t, e.fonts.familyClasses, e.fonts.familyPitches)])) }),
		localMetrics: n,
		eastAsiaFontCharsets: r,
		genericFamilies: Object.fromEntries(f.map((t) => [t, Fi(t, e.fonts.familyClasses, e.fonts.familyPitches)])),
		measurer: {
			fingerprint: d ? "canvas-text-metrics-v1" : "deterministic-text-metrics-v1",
			measure(e) {
				if (!d) return {
					advancePt: [...e.text].length * e.fontSizePt * .5,
					ascentPt: e.fontSizePt * .8,
					descentPt: e.fontSizePt * .2
				};
				let t = d.font, n = d.letterSpacing, r = d.fontKerning;
				try {
					d.font = st(e.fontRoute, e.fontSizePt, e.weight, e.style), d.letterSpacing = `${e.letterSpacingPt}px`, e.kerning != null && (d.fontKerning = e.kerning ? "normal" : "none");
					let t = d.measureText(e.text), n = Number.isFinite(t.actualBoundingBoxLeft) && Number.isFinite(t.actualBoundingBoxRight), r = {
						xMinPt: n ? -t.actualBoundingBoxLeft : 0,
						xMaxPt: n ? t.actualBoundingBoxRight : t.width,
						ascentPt: t.actualBoundingBoxAscent,
						descentPt: t.actualBoundingBoxDescent
					};
					return {
						advancePt: t.width,
						ascentPt: t.fontBoundingBoxAscent ?? t.actualBoundingBoxAscent ?? 0,
						descentPt: t.fontBoundingBoxDescent ?? t.actualBoundingBoxDescent ?? 0,
						...Object.values(r).every(Number.isFinite) ? {
							inkBounds: r,
							...n ? { horizontalInkBoundsAreTight: !0 } : {}
						} : {}
					};
				} finally {
					d.font = t, d.letterSpacing = n, e.kerning != null && (d.fontKerning = r);
				}
			}
		}
	}), m = t.mathResources ?? e.mathOccurrences.map(({ display: e, source: t }) => ({
		resourceKey: et(t, e ? "display" : "inline"),
		widthEm: 0,
		ascentEm: 0,
		descentEm: 0,
		available: !1,
		diagnostics: [{
			code: "UNSUPPORTED_FEATURE",
			severity: "warning",
			message: "The optional math renderer is unavailable; using the deterministic text fallback"
		}]
	})), h = e.imageMetadata, g = Object.freeze({
		text: p,
		images: tr(h),
		math: nr(m),
		verticalGlyphFingerprint: t.verticalGlyphMeasurement.fingerprint
	}), _ = e.mathOccurrences.map(({ source: e, display: t }) => et(e, t ? "display" : "inline")), v = m.map((e) => e.resourceKey), y = _.filter((e) => !v.includes(e)), b = v.filter((e) => !_.includes(e));
	if (y.length || b.length) throw Error(`Math metadata membership mismatch: missing [${y.join(", ")}]; extra [${b.join(", ")}]`);
	return wr(g, t.mathDrawables ?? /* @__PURE__ */ new Map(), m.filter((e) => e.available !== !1).map((e) => e.resourceKey)), Nr(g, e.paintResources), br(g, t.verticalGlyphMeasurement), g;
}
//#endregion
//#region packages/docx/src/layout/table-source-acquisition.ts
function XC(e, t) {
	if (e === null) return null;
	let n = e.trim(), r = t && n.endsWith("%") ? n.slice(0, -1) : n;
	if (r.length === 0) return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}
function ZC(e) {
	return e.value?.trim().endsWith("%") ? "pct" : e.kind ?? "dxa";
}
function QC(e) {
	if (!e) return null;
	let t = e.value?.trim() ?? "", n = ZC(e);
	if (n === "dxa") {
		let t = XC(e.value ?? "0", !1);
		return t === null ? null : {
			kind: "dxa",
			value: t / 20
		};
	}
	if (n !== "pct") return null;
	let r = XC(e.value ?? "0", !0);
	return r === null ? null : {
		kind: "pct",
		value: t.endsWith("%") ? r / 100 : r / 5e3
	};
}
function $C(e) {
	let t = QC(e);
	return t?.kind === "dxa" ? t.value : null;
}
function ew(e) {
	return e.widthPt == null ? e.widthPct == null ? null : {
		kind: "pct",
		value: e.widthPct / 5e3
	} : {
		kind: "dxa",
		value: e.widthPt
	};
}
function tw(e, t) {
	let n = e.format.firstRowException?.preferredWidth ?? null;
	if (e.format.firstRowException?.preferredWidthAuthored) return n?.kind === "dxa" ? n.value > 0 ? n.value : null : n?.kind === "pct" && n.value > 0 ? n.value * t : null;
	let r = QC(e.lexical.table?.preferredWidth);
	return r?.kind === "dxa" ? r.value > 0 ? r.value : null : r?.kind === "pct" ? r.value > 0 ? r.value * t : null : e.semantic.widthPt != null && e.semantic.widthPt > 0 ? e.semantic.widthPt : e.semantic.widthPct != null && e.semantic.widthPct > 0 ? e.semantic.widthPct / 5e3 * t : null;
}
var nw = Object.freeze({
	pt: "1/1",
	in: "72/1",
	cm: "3600/127",
	mm: "360/127",
	pc: "12/1",
	pi: "12/1"
}), rw = "18446744073709551615";
function iw(e) {
	let t = e.replace(/[\u0009\u000a\u000d\u0020]+/g, " ").replace(/^ | $/g, ""), n = /^([+-]?)([0-9]+)$/.exec(t);
	if (!n) return null;
	let [, r, i] = n;
	if (r === "-" && /[1-9]/.test(i)) return null;
	let a = i.replace(/^0+/, "") || "0";
	return a.length > 20 || a.length === 20 && a > rw ? null : t;
}
var aw = {
	key: "0/1",
	widthPt: 0
};
function ow(e) {
	let t = tx(e);
	return Number.isFinite(t) ? {
		key: e,
		widthPt: t
	} : aw;
}
function sw(e, t) {
	let n = Number(e);
	if (!Number.isFinite(n)) return aw;
	let r = Qb(n), i = r === null ? 0 : tx(rx(r, t));
	return Number.isFinite(i) ? {
		key: null,
		widthPt: i
	} : aw;
}
function cw(e) {
	if (e == null) return aw;
	let t = iw(e);
	if (t !== null) {
		let e = Zb(t);
		return e === null ? aw : ow(ax(e, 20n));
	}
	let n = /^([0-9]+(?:\.[0-9]+)?)(mm|cm|in|pt|pc|pi)$/.exec(e);
	if (!n) return aw;
	let r = nw[n[2]], i = Zb(n[1]);
	return i === null ? sw(n[1], r) : ow(rx(i, r));
}
function lw(e) {
	let t = e.lexical.table?.grid;
	if (!t) {
		let t = e.semantic.colWidths.map((e) => Number.isFinite(e) && e >= 0 ? {
			widthPt: e,
			key: Qb(e) ?? "0/1"
		} : aw);
		return {
			widthsPt: t.map((e) => e.widthPt),
			widthKeys: t.map((e) => e.key)
		};
	}
	let n = Math.max(t.requiredColumnCount, t.columns.length), r = Array.from({ length: n }, (e, n) => cw(t.columns[n]?.width ?? null));
	return {
		widthsPt: r.map((e) => e.widthPt),
		widthKeys: r.map((e) => e.key)
	};
}
function uw(e, t) {
	let n = QC(e);
	return n?.kind === "pct" ? {
		kind: "dxa",
		value: Math.max(0, n.value) * Math.max(0, t)
	} : n;
}
function dw(e, t, n, r = t) {
	let i = e.semantic, { widthsPt: a, widthKeys: o } = lw(e), s = e.format.firstRowException?.layout === "fixed" ? "fixed" : e.lexical.table?.layout?.kind ?? i.layout, c = e.lexical.table?.grid.authored ? e.lexical.table.grid.columns.length : null, l = i.rows.map((e) => {
		let t = Math.max(0, e.gridBefore ?? 0);
		return c !== null && t > c ? 0 : t;
	}), u = Math.max(c ?? 0, e.lexical.table?.grid.requiredColumnCount ?? 0, ...i.rows.map((e, t) => (l[t] ?? 0) + e.cells.reduce((e, t) => e + Math.max(1, t.colSpan), 0)));
	return {
		layout: s === "fixed" ? "fixed" : "autofit",
		availableWidthPt: r === null ? null : Math.max(0, r),
		gridWidthsPt: a,
		gridWidthKeys: o,
		tablePreferredWidthPt: tw(e, t),
		rows: i.rows.map((r, i) => {
			let o = e.lexical.rows[i], d = l[i] ?? 0, f = Math.max(0, r.gridAfter ?? 0), p = d + r.cells.reduce((e, t) => e + Math.max(1, t.colSpan), 0), m = c !== null && p + f > u ? 0 : f, h = d;
			return {
				before: d > 0 ? {
					columnSpan: d,
					preferredWidth: uw(o?.row?.beforeWidth, t)
				} : null,
				after: m > 0 ? {
					columnSpan: m,
					preferredWidth: uw(o?.row?.afterWidth, t)
				} : null,
				cells: r.cells.map((t, r) => {
					let c = o?.cells[r] ?? null, l = Math.max(1, t.colSpan), u = s === "fixed" ? {
						minWidthPt: 0,
						maxWidthPt: 0
					} : n(i, r), d = sx(e.format.rows[i]?.cellSpacingPt ?? 0, h, l, a.length), f = d.startPt + d.endPt, p = {
						columnStart: h,
						columnSpan: l,
						preferredWidth: QC(c?.preferredWidth) ?? ew(t),
						minContentWidthPt: Math.max(0, u.minWidthPt) + f,
						maxContentWidthPt: Math.max(u.minWidthPt, u.maxWidthPt) + f
					};
					return h += l, p;
				})
			};
		})
	};
}
//#endregion
//#region packages/docx/src/layout/layout-source-store.ts
var fw = /* @__PURE__ */ new WeakSet();
function pw(e) {
	return typeof e == "object" && !!e && fw.has(e);
}
function mw(e, t, n) {
	let r = Object.keys(e).sort(), i = [...t].sort();
	if (r.length !== i.length || r.some((e, t) => e !== i[t])) throw TypeError(`${n} has unexpected fields: ${r.join(",")}`);
}
function hw(e, t, n) {
	let r = [...t].filter((t) => !e.has(t)), i = [...e].filter((e) => !t.has(e));
	if (r.length !== 0 || i.length !== 0) throw TypeError(`${n} membership mismatch; missing=${r.join(",")} extra=${i.join(",")}`);
}
function gw(e, t) {
	let n = (e) => {
		e && t.storyRoot(e);
	}, r = (e) => {
		if (e.story !== "body" || e.storyInstance !== "body" || e.path.length !== 1 || t.body[e.path[0]] === void 0) throw TypeError(`Unknown body layout occurrence source: ${z(e)}`);
	}, i = (e) => {
		for (let t of [
			e.headers.default,
			e.headers.first,
			e.headers.even,
			e.footers.default,
			e.footers.first,
			e.footers.even
		]) n(t);
	};
	if (e.source.story !== "body" || e.source.storyInstance !== "body" || e.source.path.length !== 0) throw TypeError("Body layout input requires the canonical body root");
	i(e.initialSection);
	for (let n of e.sequence) if (r(n.kind === "body-block" ? n.block.source : n.source), n.kind === "body-block") {
		if (t.resolve(n.block.source).type !== n.block.kind) throw TypeError("Body layout block source kind mismatch");
	} else if (n.kind === "adjacent-table-group") {
		for (let e of n.tables) if (t.resolve(e.source).type !== "table") throw TypeError("Adjacent table source kind mismatch");
	} else n.kind === "begin-section" && i(n.section);
}
function _w(e, t, n, r, i) {
	let a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map(), u = (e, t = "image") => {
		if (a.has(e)) throw TypeError(`Duplicate canonical image resource: ${e}`);
		a.add(e), o.set(e, t);
	};
	for (let n of t.paragraphs) {
		let t = e.resolve(n.source);
		if (t.type === "paragraph") {
			if (n.publicAnchorBridges.length !== t.runs.length) throw TypeError(`Paragraph anchor bridge cardinality mismatch: ${z(n.source)}`);
			t.numbering?.picBulletImagePath && u(tt(n.source, t.numbering.picBulletImagePath), "picture-bullet"), t.runs.forEach((e, t) => {
				let r = {
					...n.source,
					path: [...n.source.path, t]
				};
				if (e.type === "image" && u(tt(r, e.imagePath)), e.type === "chart") {
					if (s.has(e.resourceKey)) throw TypeError(`Duplicate canonical chart resource: ${e.resourceKey}`);
					s.add(e.resourceKey);
				}
				if (e.type === "math") {
					if (c.has(e.resourceKey)) throw TypeError(`Duplicate canonical math resource: ${e.resourceKey}`);
					c.add(e.resourceKey), l.set(e.resourceKey, z(e.source));
				}
				if (e.type === "shape" && e.textBoxInput?.kind === "compatibility") for (let t of e.textBoxInput.paragraphs) t.image && u(tt({
					...t.source,
					path: [...t.source.path, 0]
				}, t.image.imagePath));
				e.type === "shape" && e.fill?.fillType === "image" && u(tt(r, e.fill.imagePath));
			});
		}
	}
	let d = new Set(r.map((e) => e.resourceKey));
	if (d.size !== r.length) throw TypeError("Duplicate image metadata resource");
	hw(d, a, "Image metadata");
	let f = /* @__PURE__ */ new Set();
	for (let e of n) {
		if (f.has(e.resourceKey)) throw TypeError("Duplicate math occurrence resource");
		if (f.add(e.resourceKey), l.get(e.resourceKey) !== z(e.source)) throw TypeError(`Math occurrence source mismatch: ${e.resourceKey}`);
	}
	hw(f, c, "Math occurrence");
	let p = /* @__PURE__ */ new Set(), m = /* @__PURE__ */ new Set(), h = /* @__PURE__ */ new Set(), g = /* @__PURE__ */ new Set();
	for (let e of i) {
		if (p.has(e.resourceKey)) throw TypeError("Duplicate paint resource descriptor");
		if (p.add(e.resourceKey), e.kind === "image" || e.kind === "picture-bullet") {
			if (m.add(e.resourceKey), o.get(e.resourceKey) !== e.kind) throw TypeError(`Image paint resource kind mismatch: ${e.resourceKey}`);
		} else e.kind === "chart" ? h.add(e.resourceKey) : g.add(e.resourceKey);
	}
	hw(p, new Set([
		...a,
		...s,
		...c
	]), "Paint resource"), hw(m, a, "Image paint resource"), hw(h, s, "Chart paint resource"), hw(g, c, "Math paint resource");
}
function vw(e, t) {
	let n = xw(e.blockRepository);
	gw(t, n), In(e.acquisitionFacts, "layout source acquisition facts"), In(e.section, "layout source section"), In(e.documentLayoutFacts, "layout source document facts"), In(e.fonts, "layout source font facts"), In(e.fontFamilyCharsets, "layout source font charsets"), In(e.mathOccurrences, "layout source math facts"), In(e.imageMetadata, "layout source image facts"), In(e.paintDescriptors, "layout source paint descriptors"), e.fatalParse && In(e.fatalParse, "layout source fatal parse fact");
	for (let [t, r] of [
		["block repository", n],
		["body blocks", n.body],
		["footnotes", n.footnotes],
		["endnotes", n.endnotes],
		["acquisition facts", e.acquisitionFacts],
		["paragraph facts", e.acquisitionFacts.paragraphs],
		["table facts", e.acquisitionFacts.tables],
		["section", e.section],
		["document facts", e.documentLayoutFacts],
		["font facts", e.fonts],
		["math facts", e.mathOccurrences],
		["image facts", e.imageMetadata],
		["paint descriptors", e.paintDescriptors]
	]) if (!Object.isFrozen(r)) throw TypeError(`Layout source ${t} must be sealed`);
	let r = /* @__PURE__ */ new Map();
	for (let t of e.acquisitionFacts.paragraphs) {
		mw(t, [
			"source",
			"publicAnchorBridges",
			"numberingMarkerFallbackFontSizePt"
		], "Paragraph acquisition fact");
		let e = z(t.source);
		if (r.has(e)) throw TypeError(`Duplicate paragraph acquisition source: ${e}`);
		r.set(e, t);
	}
	let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new WeakMap();
	for (let t of e.acquisitionFacts.tables) {
		mw(t, ["source", "input"], "Table acquisition fact");
		let e = z(t.source);
		if (i.has(e)) throw TypeError(`Duplicate table acquisition source: ${e}`);
		i.add(e);
		let r = n.resolve(t.source);
		if (r.type !== "table") throw TypeError("Table acquisition fact must identify a table");
		a.set(r, t);
	}
	for (let e of n.sources) {
		let t = n.resolve(e), a = z(e);
		if (t.type === "paragraph" && !r.has(a)) throw TypeError(`Missing paragraph acquisition source: ${a}`);
		if (t.type === "table" && !i.has(a)) throw TypeError(`Missing table acquisition source: ${a}`);
	}
	_w(n, e.acquisitionFacts, e.mathOccurrences, e.imageMetadata, e.paintDescriptors);
	let o = /* @__PURE__ */ new WeakMap();
	for (let t of e.acquisitionFacts.paragraphs) {
		let e = n.resolve(t.source);
		if (e.type !== "paragraph") throw TypeError("Paragraph acquisition fact must identify a paragraph");
		for (let t of e.runs) {
			if (t.type !== "shape" || t.textBoxInput?.kind !== "complete") continue;
			let e;
			try {
				e = n.storyRoot(t.textBoxInput.source);
			} catch (e) {
				throw TypeError(`Missing complete text-box story source: ${z(t.textBoxInput.source)}`, { cause: e });
			}
			if (e.length !== t.textBoxInput.blockCount) throw TypeError(`Complete text-box block count mismatch: ${z(t.textBoxInput.source)}`);
		}
		if (e.numbering && e.numberingMarkerShapeInput && t.numberingMarkerFallbackFontSizePt !== null) {
			let n = o.get(e.numbering);
			n || (n = /* @__PURE__ */ new Map(), o.set(e.numbering, n)), n.set(t.numberingMarkerFallbackFontSizePt, e.numberingMarkerShapeInput);
		}
	}
	let s = Object.freeze({
		numberingMarkerShapeInput(e, t) {
			let n = o.get(e)?.get(t);
			if (n) return n;
			throw Error("Unknown numbering marker acquisition input");
		},
		paragraphMarkShapeInput(e) {
			return e.paragraphMarkShapeInput;
		},
		tableFormatInput(e) {
			let t = a.get(e);
			if (!t) throw Error("Unknown table acquisition input");
			return t.input.format;
		},
		tableColumnLayoutInput(e, t, n, r) {
			let i = a.get(e);
			if (!i) throw Error("Unknown table acquisition input");
			return dw(i.input, t, (t, r) => n(e.rows[t].cells[r]), r);
		},
		tableParticipatesInOrdinaryFlow(e) {
			let t = a.get(e);
			if (!t) throw Error("Unknown table acquisition input");
			return t.input.format.ordinaryFlow;
		},
		paragraphAcquisitionInput(e, t) {
			if (!r.get(z(t))) throw Error(`Unknown paragraph acquisition source: ${z(t)}`);
			let i = n.resolve(t);
			if (i.type !== "paragraph") throw Error(`Paragraph source kind mismatch: ${z(t)}`);
			return i;
		}
	}), c = Object.freeze({
		acquisitionInputs: s,
		effectiveTablePositioning(e) {
			let t = a.get(e);
			if (!t) throw Error("Unknown table acquisition input");
			return t.input.format.positioning === null ? null : e.tblpPr ?? null;
		},
		publicAnchorBridge(e, t) {
			let n = r.get(z(e));
			if (!n) throw Error(`Unknown paragraph acquisition source: ${z(e)}`);
			if (!Number.isSafeInteger(t) || t < 0 || t >= n.publicAnchorBridges.length) throw RangeError(`Unknown paragraph anchor bridge index: ${t}`);
			return n.publicAnchorBridges[t] ?? null;
		}
	}), l = (e) => {
		let t = new Set(e), n = Object.create(null);
		return Object.defineProperties(n, {
			size: { get: () => t.size },
			has: { value: (e) => t.has(e) },
			entries: { value: () => t.entries() },
			keys: { value: () => t.keys() },
			values: { value: () => t.values() },
			forEach: { value: (e, r) => {
				t.forEach((t) => e.call(r, t, t, n));
			} },
			[Symbol.iterator]: { value: () => t[Symbol.iterator]() },
			[Symbol.toStringTag]: { value: "Set" }
		}), Object.freeze(n);
	}, u = Object.freeze({
		...e.documentLayoutFacts,
		kinsoku: Object.freeze({
			enabled: e.documentLayoutFacts.kinsoku.enabled,
			lineStartForbidden: l(e.documentLayoutFacts.kinsoku.lineStartForbidden),
			lineEndForbidden: l(e.documentLayoutFacts.kinsoku.lineEndForbidden)
		})
	}), d = Object.freeze({
		blocks: n,
		bodyLayoutInput: t,
		section: e.section,
		documentLayoutSettings: u,
		fonts: e.fonts,
		fontFamilyCharsets: e.fontFamilyCharsets,
		mathOccurrences: e.mathOccurrences,
		imageMetadata: e.imageMetadata,
		hasPaginationFields: e.hasPaginationFields,
		requiresDomVerticalGlyphLayout: e.requiresDomVerticalGlyphLayout,
		fatalParse: e.fatalParse,
		acquisition: c,
		paintResources: Jn(e.paintDescriptors)
	});
	return fw.add(d), d;
}
function yw(e) {
	let { bodyLayoutInput: t, ...n } = e;
	return vw(n, In(t, "layout source body input"));
}
function bw(e) {
	return `${e.story}:${e.storyInstance}`;
}
function xw(e) {
	In(e.body, "layout source body blocks"), In(e.stories, "layout source story blocks"), In(e.footnotes, "layout source footnotes"), In(e.endnotes, "layout source endnotes");
	let t = /* @__PURE__ */ new Map();
	for (let { source: n, body: r } of e.stories) {
		if (n.path.length !== 0) throw TypeError("Story repository roots require an empty source path");
		if (n.story !== "header" && n.story !== "footer" && n.story !== "textbox") throw TypeError(`Unsupported repository story kind: ${n.story}`);
		let e = bw(n);
		if (t.has(e)) throw TypeError(`Duplicate story source: ${e}`);
		t.set(e, r);
	}
	let n = (e, t) => {
		let n = /* @__PURE__ */ new Map();
		for (let r of e) {
			if (n.has(r.id)) throw TypeError(`Duplicate ${t} story source: ${r.id}`);
			n.set(r.id, r.content);
		}
		return n;
	}, r = n(e.footnotes, "footnote"), i = n(e.endnotes, "endnote"), a = (n) => {
		if (n.path.length !== 0) throw Error("Story lookup requires a root-only source");
		if (n.story === "body" && n.storyInstance === "body") return e.body;
		if (n.story === "footnote") {
			let e = r.get(n.storyInstance);
			if (e) return e;
		}
		if (n.story === "endnote") {
			let e = i.get(n.storyInstance);
			if (e) return e;
		}
		let a = t.get(bw(n));
		if (a) return a;
		throw Error(`Unknown ${n.story} story source: ${n.storyInstance}`);
	}, o = /* @__PURE__ */ new Map(), s = [], c = (e, t, n = []) => {
		e.forEach((e, r) => {
			let i = [...n, r];
			if (e.type !== "paragraph" && e.type !== "table") return;
			let a = {
				...t,
				path: i
			}, l = z(a);
			if (o.has(l)) throw TypeError(`Duplicate block source: ${l}`);
			o.set(l, e), s.push(Object.freeze({
				...a,
				path: Object.freeze([...i])
			})), e.type === "table" && e.rows.forEach((e, n) => e.cells.forEach((e, r) => {
				c(e.content, t, [
					...i,
					n,
					r
				]);
			}));
		});
	};
	c(e.body, {
		story: "body",
		storyInstance: "body",
		path: []
	});
	for (let { source: t, body: n } of e.stories) c(n, t);
	for (let t of e.footnotes) c(t.content, {
		story: "footnote",
		storyInstance: t.id,
		path: []
	});
	for (let t of e.endnotes) c(t.content, {
		story: "endnote",
		storyInstance: t.id,
		path: []
	});
	return Object.freeze({
		body: e.body,
		footnotes: e.footnotes,
		endnotes: e.endnotes,
		sources: Object.freeze(s),
		resolve(e) {
			let t = o.get(z(e));
			if (!t) throw Error(`Unknown block source: ${z(e)}`);
			return t;
		},
		storyRoot: a
	});
}
//#endregion
//#region packages/docx/src/local-font-metrics.ts
function Sw(e) {
	let t = new Set((e.embeddedFonts ?? []).map((e) => {
		let t = e.style === "bold" || e.style === "boldItalic" ? 700 : 400, n = e.style === "italic" || e.style === "boldItalic" ? "italic" : "normal";
		return `${vn(e.fontName)}:${t}:${n}`;
	})), n = [], r = /* @__PURE__ */ new Set(), i = (e) => {
		let i = e?.trim();
		if (!i) return;
		let a = vn(i);
		if (!(a === "meiryo" || i === "メイリオ")) return;
		let o = `${a}:400:normal`;
		t.has(o) || r.has(o) || (r.add(o), n.push({
			family: i,
			localNames: ["Meiryo"],
			lineHeightMultiplier: 1.3
		}));
	};
	for (let t of RC(e)) if (!(t.bold || t.italic)) for (let e of t.fontFamilies) i(e);
	return n;
}
function Cw(e) {
	return Sn(Sw(e));
}
//#endregion
//#region packages/docx/src/layout/typography-input.ts
function ww(e) {
	let t = e.__typographyAcquisition;
	if (t !== void 0) return B({
		sourceText: "text" in e ? e.text : e.fallbackText,
		...t
	}, "DOCX run typography acquisition input");
}
function Tw(e) {
	let t = e.__paragraphTypographyAcquisition;
	if (t !== void 0) return B(t, "DOCX paragraph typography acquisition input");
}
//#endregion
//#region packages/docx/src/layout/adjacent-tables.ts
function Ew(e, t) {
	let n = t[0].logicalTotalRows, r = 0;
	for (let i of t) {
		if (i.logicalTotalRows !== n || !Number.isInteger(i.rowCount) || i.rowCount < 0 || i.logicalRowOffset !== r) throw Error(`Parser-owned adjacent table sequence ${e} is inconsistent`);
		r += i.rowCount;
	}
	if (r !== n) throw Error(`Parser-owned adjacent table sequence ${e} is incomplete`);
}
function Dw(e) {
	let t = [], n = null, r = [], i = () => {
		r.length > 0 && Ew(n, r), r.length === 1 ? t.push(Object.freeze({
			kind: "body-element",
			element: r[0].element
		})) : r.length > 1 && t.push(Object.freeze({
			kind: "adjacent-table-group",
			logicalSequenceId: n,
			tables: Object.freeze(r.map((e) => e.element))
		})), n = null, r = [];
	};
	for (let { element: a, table: o } of e) {
		if (a.type === "table" && o !== null) {
			r.length > 0 && n !== o.logicalSequenceId && i(), n = o.logicalSequenceId, r.push(Object.freeze({
				element: a,
				logicalRowOffset: o.logicalRowOffset,
				logicalTotalRows: o.logicalTotalRows,
				rowCount: o.rowCount
			}));
			continue;
		}
		i(), t.push(Object.freeze({
			kind: "body-element",
			element: a
		}));
	}
	return i(), Object.freeze(t);
}
//#endregion
//#region packages/docx/src/layout/body-layout-input.ts
function Ow(e) {
	switch (e) {
		case "continuous":
		case "nextColumn":
		case "nextPage":
		case "oddPage":
		case "evenPage": return e;
		default: return "nextPage";
	}
}
function kw(e, t, n) {
	let r = n === null ? null : `section:${n}`, i = (n) => e[n] === null ? null : {
		story: t,
		storyInstance: r === null ? n : `${r}:${n}`,
		path: []
	};
	return Object.freeze({
		default: i("default"),
		first: i("first"),
		even: i("even")
	});
}
function Aw(e) {
	return {
		...e.geometry,
		titlePage: e.titlePage,
		evenAndOddHeaders: !1,
		sectionStart: e.startType,
		columns: e.columns,
		textDirection: e.textDirection,
		docGridType: e.docGridType,
		docGridLinePitch: e.docGridLinePitch,
		docGridCharSpace: e.docGridCharSpace,
		pageNumType: e.pageNumType,
		vAlign: e.vAlign,
		lineNumbering: e.lineNumbering
	};
}
function jw(e, t) {
	let n = e.markerBodyIndex;
	return Object.freeze({
		sectionOccurrenceId: e.sectionOccurrenceId,
		source: Object.freeze(n === null ? {
			story: "body",
			storyInstance: "body",
			path: Object.freeze([])
		} : {
			story: "body",
			storyInstance: "body",
			path: Object.freeze([n])
		}),
		startType: Ow(e.startType),
		context: Object.freeze(Tu(Aw(e), e.sectionBidi)),
		pageNumbering: Object.freeze({
			start: e.pageNumType?.start ?? null,
			format: e.pageNumType?.fmt ?? null
		}),
		titlePage: e.titlePage,
		evenAndOddHeaders: t.evenAndOddHeaders,
		headers: kw(e.headers, "header", n),
		footers: kw(e.footers, "footer", n),
		pageBordersAuthored: e.pageBordersAuthored,
		pageBorders: e.pageBorders,
		pageLayout: Object.freeze({
			physicalGeometry: Object.freeze({ ...e.geometry }),
			columns: e.columns,
			textDirection: e.textDirection ?? "lrTb",
			gutterPt: e.gutterPt,
			rtlGutter: e.rtlGutter,
			...t.pageLayoutSettings
		})
	});
}
function Mw(e) {
	let t = new Map(e.sectionIndex.occurrences.map((t) => [t.sectionOccurrenceId, jw(t, e)])), n = e.sectionIndex.occurrences[0];
	if (!n) throw Error("DOCX body requires a final section owner");
	let r = t.get(n.sectionOccurrenceId), i = e.sequence.map((e) => {
		if (e.kind !== "begin-section") return e;
		let n = t.get(e.section.sectionOccurrenceId);
		if (!n) throw Error(`Missing body section owner: ${e.section.sectionOccurrenceId}`);
		return Object.freeze({
			...e,
			section: n
		});
	});
	return B({
		source: {
			story: "body",
			storyInstance: "body",
			path: []
		},
		initialSection: r,
		sequence: i.map((e, t) => {
			if (e.kind !== "body-block" || e.block.kind !== "paragraph") return e;
			let n = Rm(i, t);
			return n === void 0 ? e : Object.freeze({
				...e,
				block: Object.freeze({
					...e.block,
					continuousSectionRole: n
				})
			});
		}),
		parserDiagnostics: e.parserDiagnostics ?? [],
		endnoteIds: e.endnoteIds ?? [],
		noteLayoutSettings: e.noteLayoutSettings
	}, "DOCX body layout input");
}
//#endregion
//#region packages/docx/src/layout/paragraph-visibility.ts
function Nw(e) {
	return !(e.runs ?? []).some((e) => e.type === "text" ? e.text.length > 0 : !0);
}
//#endregion
//#region packages/docx/src/parser-model.ts
var Pw = /* @__PURE__ */ new WeakMap();
function Fw(e) {
	return Pw.get(e) ?? [];
}
function Iw(e) {
	let t = Fw(e);
	if (t.length === 0) return e.runs;
	let n = [], r = 0;
	for (let i = 0; i <= e.runs.length; i += 1) {
		for (; t[r]?.publicRunIndex === i;) n.push(t[r].run), r += 1;
		i < e.runs.length && n.push(e.runs[i]);
	}
	return n;
}
function Lw(e) {
	return Fw(e).length > 0;
}
function Rw(e) {
	let t = e.__documentTypographySettings?.normalStyleFontSizePt;
	return B({ normalStyleFontSizePt: typeof t == "number" && Number.isFinite(t) && t > 0 ? t : 10 }, "DOCX document typography settings input");
}
function zw(e) {
	let t = e.__pageLayoutSettings;
	return B({
		mirrorMargins: t?.mirrorMargins === !0,
		gutterAtTop: t?.gutterAtTop === !0,
		bookFoldPrinting: t?.bookFoldPrinting === !0,
		bookFoldRevPrinting: t?.bookFoldRevPrinting === !0,
		printTwoOnOne: t?.printTwoOnOne === !0
	}, "DOCX page layout settings input");
}
function Bw(e) {
	let t = e.__noteLayoutSettings;
	return B({
		footnotePosition: t?.footnotePosition ?? "pageBottom",
		endnotePosition: t?.endnotePosition ?? "docEnd"
	}, "DOCX note layout settings input");
}
function Vw(e) {
	return Object.freeze(e ? Object.fromEntries(Object.entries(e).filter((e) => typeof e[1] == "number")) : {});
}
function Hw(e) {
	return Object.freeze({
		...e,
		pageGeometry: Vw(e.pageGeometry)
	});
}
var Uw = /* @__PURE__ */ new WeakMap(), Ww = /* @__PURE__ */ new WeakMap(), Gw = /* @__PURE__ */ new WeakMap(), Kw = /* @__PURE__ */ new WeakMap(), qw = /* @__PURE__ */ new WeakMap();
function Jw(e) {
	let t = Gw.get(e);
	if (t) return t;
	let n = B({
		table: e.__tableLayout ?? null,
		rows: e.rows.map((e) => ({
			row: e.__tableRowLayout ?? null,
			cells: e.cells.map((e) => e.__tableCellLayout ?? null)
		}))
	}, "DOCX table acquisition input");
	return Gw.set(e, n), n;
}
var Yw = (e) => e != null && Number.isFinite(e) ? e : null;
function Xw(e) {
	return B({
		colWidths: (e.colWidths ?? []).map((e) => Number.isFinite(e) && e >= 0 ? e : 0),
		layout: e.layout ?? null,
		widthPt: Yw(e.widthPt),
		widthPct: Yw(e.widthPct),
		rows: e.rows.map((e) => ({
			gridBefore: Yw(e.gridBefore) ?? 0,
			gridAfter: Yw(e.gridAfter) ?? 0,
			cells: e.cells.map((e) => ({
				colSpan: Yw(e.colSpan) ?? 1,
				widthPt: Yw(e.widthPt),
				widthPct: Yw(e.widthPct)
			}))
		}))
	}, "DOCX table column semantic input");
}
function Zw(e) {
	let t = qw.get(e);
	if (t) return t;
	let n = Pn({
		semantic: Xw(e),
		lexical: Jw(e),
		format: uT(e)
	});
	return qw.set(e, n), n;
}
function Qw(e) {
	return Zw(e).format.ordinaryFlow;
}
function $w(e) {
	return Zw(e).format.positioning === null ? null : e.tblpPr ?? null;
}
function eT(e) {
	return {
		leftFromTextPt: e.leftFromText,
		rightFromTextPt: e.rightFromText,
		topFromTextPt: e.topFromText,
		bottomFromTextPt: e.bottomFromText,
		horzAnchor: e.horzAnchor,
		horzSpecified: e.horzSpecified,
		vertAnchor: e.vertAnchor,
		xPt: e.tblpX,
		yPt: e.tblpY,
		...e.tblpXSpec == null ? {} : { xAlign: e.tblpXSpec },
		...e.tblpYSpec == null ? {} : { yAlign: e.tblpYSpec }
	};
}
function tT(e, t) {
	if (e === null) return null;
	let n = e.trim(), r = t && n.endsWith("%") ? n.slice(0, -1) : n;
	if (r.length === 0) return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}
function nT(e) {
	let t = tT(e ?? null, !1);
	return t === null ? null : t / 20;
}
function rT(e) {
	return e === "exact" || e === "atLeast" ? e : "auto";
}
function iT(e) {
	return {
		rule: Tl(rT(e.rule), e.ruleAuthored),
		valuePt: nT(e.value)
	};
}
function aT(e) {
	if (e.rowHeight === null || !Number.isFinite(e.rowHeight)) return null;
	let t = rT(e.rowHeightRule);
	return {
		rule: t === "auto" ? "atLeast" : t,
		valuePt: e.rowHeight
	};
}
function oT(...e) {
	for (let t of e) {
		if (!t) continue;
		let e = El(ZC(t), $C(t));
		if (e !== null) return e;
	}
	return null;
}
function sT(e, t, n) {
	if (!e) return null;
	let r = ZC(e);
	return Dl({
		kind: r,
		dxaValuePt: r === "dxa" ? nT(e.value ?? "0") : null,
		scope: t,
		edge: n
	});
}
function cT(e, t, n, r, i, a, o) {
	let s = e.bidiVisual === !0, c = (e, t) => {
		let n = t === "left" ? s ? "end" : "start" : s ? "start" : "end";
		return {
			width: e?.[t] ?? e?.[n],
			edge: n
		};
	}, l = (e, ...t) => {
		for (let n of t) {
			let t = sT(n.width, n.scope, n.edge ?? e);
			if (t !== null) return t;
		}
		return null;
	}, u = c(r, "left"), d = c(i, "left"), f = c(a, "left"), p = c(o, "left"), m = c(r, "right"), h = c(i, "right"), g = c(a, "right"), _ = c(o, "right"), v = (e) => !n && e != null && Number.isFinite(e) ? e : null;
	return {
		top: l("top", {
			width: r?.top,
			scope: "cell"
		}) ?? v(t.marginTop) ?? l("top", {
			width: i?.top,
			scope: "exception"
		}, {
			width: a?.top,
			scope: "table"
		}, {
			width: o?.top,
			scope: "style"
		}) ?? e.cellMarginTop,
		bottom: l("bottom", {
			width: r?.bottom,
			scope: "cell"
		}) ?? v(t.marginBottom) ?? l("bottom", {
			width: i?.bottom,
			scope: "exception"
		}, {
			width: a?.bottom,
			scope: "table"
		}, {
			width: o?.bottom,
			scope: "style"
		}) ?? e.cellMarginBottom,
		left: l(u.edge, {
			...u,
			scope: "cell"
		}) ?? v(t.marginLeft) ?? l(d.edge, {
			...d,
			scope: "exception"
		}, {
			...f,
			scope: "table"
		}, {
			...p,
			scope: "style"
		}) ?? e.cellMarginLeft,
		right: l(m.edge, {
			...m,
			scope: "cell"
		}) ?? v(t.marginRight) ?? l(h.edge, {
			...h,
			scope: "exception"
		}, {
			...g,
			scope: "table"
		}, {
			..._,
			scope: "style"
		}) ?? e.cellMarginRight
	};
}
function lT(e) {
	if (!e) return null;
	let t = e.indent ? ZC(e.indent) : null;
	return {
		preferredWidthAuthored: e.preferredWidth != null,
		preferredWidth: QC(e.preferredWidth),
		layout: e.layout?.kind === "fixed" || e.layout?.kind === "autofit" ? e.layout.kind : null,
		justification: e.justification,
		indentAuthored: e.indent != null && (t === "dxa" || t === "nil"),
		indentPt: t === "nil" ? 0 : $C(e.indent),
		borders: e.borders
	};
}
function uT(e) {
	let t = Kw.get(e);
	if (t) return t;
	let n = Jw(e), r = n.table?.ordinaryFlow ?? e.tblpPr == null, i = e.rows.map((t, r) => {
		let i = n.rows[r]?.row ?? null, a = i?.exception ?? null;
		return {
			height: i?.height ? iT(i.height) : aT(t),
			cantSplit: t.cantSplit === !0,
			repeatedHeader: t.isHeader === !0,
			cellSpacingPt: oT(i?.cellSpacing, a?.cellSpacing, n.table?.cellSpacing, i?.styleCellSpacing) ?? 0,
			justification: i?.justification ?? a?.justification ?? null,
			exception: lT(a),
			cells: t.cells.map((t, o) => ({ marginsPt: cT(e, t, n.rows[r]?.cells[o] !== null && n.rows[r]?.cells[o] !== void 0, n.rows[r]?.cells[o]?.margins, a?.cellMargins, n.table?.cellMargins, i?.styleCellMargins) }))
		};
	}), a = B({
		effectiveStyleId: n.table?.effectiveStyleId ?? null,
		ordinaryFlow: r,
		logicalSequenceId: n.table?.logicalSequenceId ?? null,
		logicalRowOffset: n.table?.logicalRowOffset ?? 0,
		logicalTotalRows: n.table?.logicalTotalRows ?? 0,
		positioning: r || e.tblpPr == null ? null : eT(e.tblpPr),
		rows: i,
		firstRowException: i[0]?.exception ?? null
	}, "DOCX table format input");
	return Kw.set(e, a), a;
}
function dT(e) {
	return Object.freeze(e.map((e) => {
		if (e.type !== "table") return Object.freeze({
			element: e,
			table: null
		});
		let t = uT(e);
		return t.logicalSequenceId == null ? Object.freeze({
			element: e,
			table: null
		}) : Object.freeze({
			element: e,
			table: Object.freeze({
				logicalSequenceId: t.logicalSequenceId,
				logicalRowOffset: t.logicalRowOffset ?? 0,
				logicalTotalRows: t.logicalTotalRows ?? 0,
				rowCount: e.rows.length
			})
		});
	}));
}
var fT = (e) => Object.freeze({
	story: "body",
	storyInstance: "body",
	path: Object.freeze([e])
}), pT = new Set([
	"paragraph",
	"line",
	"character"
]);
function mT(e, t, n) {
	if (e.type !== "shape" && e.type !== "image" && e.type !== "chart" || TT(e) !== void 0 || !so(e.wrapMode) || e.type !== "shape" && !e.anchor || e.widthPt <= 0 || e.heightPt <= 0) return null;
	let r = e.anchorXRelativeFrom ?? (e.anchorXFromMargin ? "margin" : "page"), i = e.anchorYRelativeFrom ?? (e.anchorYFromPara ? "paragraph" : "page"), a = `${t.story}:${t.storyInstance}:${t.path.join(".")}`;
	return Object.freeze({
		occurrenceId: e.type === "shape" ? `public-shape:${a}:${n}` : `public-anchor:${a}:${n}`,
		pageOwned: !pT.has(r) && !pT.has(i)
	});
}
function hT(e, t) {
	let n = new Set([
		"paragraph",
		"line",
		"character"
	]), r = Object.freeze([...new Set(Iw(e).flatMap((e, r) => {
		let i = e;
		if (e.type !== "shape" && e.type !== "image" && e.type !== "chart" && i.type !== "unavailableDrawing") return [];
		let a = TT(i);
		if (!a) {
			let e = i.type === "unavailableDrawing" ? null : mT(i, t, r);
			return e?.pageOwned ? [e.occurrenceId] : [];
		}
		return a.horizontal.relativeFromStatus !== "valid" || a.vertical.relativeFromStatus !== "valid" || a.horizontal.relativeFrom === null || a.vertical.relativeFrom === null || a.wrap.kind === "none" || n.has(a.horizontal.relativeFrom) || n.has(a.vertical.relativeFrom) ? [] : [at(t, a.occurrenceId)];
	}))]);
	return Object.freeze({
		kind: "paragraph",
		source: t,
		pageBreakBefore: e.pageBreakBefore === !0,
		keepLines: e.keepLines === !0,
		keepNext: e.keepNext === !0,
		widowControl: e.widowControl !== !1,
		spaceBeforePt: e.spaceBefore ?? 0,
		spaceAfterPt: e.spaceAfter ?? 0,
		contextualSpacing: e.contextualSpacing === !0,
		styleId: e.styleId ?? null,
		inkless: !Lw(e) && Nw(e),
		...r.length === 0 ? {} : { pageOwnedAnchorOccurrenceIds: r }
	});
}
function gT(e) {
	return Object.freeze({
		kind: "table",
		source: e
	});
}
function _T(e, t) {
	let n = 0;
	return Object.freeze(Dw(dT(e)).map((e) => {
		if (e.kind === "adjacent-table-group") {
			let t = n;
			return n += e.tables.length, Object.freeze({
				kind: "adjacent-table-group",
				logicalSequenceId: e.logicalSequenceId,
				source: fT(t),
				tables: Object.freeze(e.tables.map((e, n) => Object.freeze({
					...gT(fT(t + n)),
					rowCount: e.rows.length
				})))
			});
		}
		let r = e.element, i = n, a = fT(i);
		if (n += 1, r.type === "paragraph") return r.markVanish === !0 && !Lw(r) && Nw(r) ? Object.freeze({
			kind: "consume-source",
			source: a,
			reason: "hidden-paragraph"
		}) : Object.freeze({
			kind: "body-block",
			block: hT(r, a)
		});
		if (r.type === "table") return Object.freeze({
			kind: "body-block",
			block: gT(a)
		});
		if (r.type === "pageBreak" || r.type === "columnBreak") return Object.freeze({
			kind: "authored-break",
			source: a,
			break: r.type === "pageBreak" ? "page" : "column",
			...r.type === "pageBreak" && r.parity !== void 0 ? { parity: r.parity } : {},
			...r.type === "pageBreak" && r.sameParagraphAsPrevious === !0 ? { sameSourceParagraphAsPrevious: !0 } : {}
		});
		if (r.type === "sectionBreak") return Object.freeze({
			kind: "begin-section",
			source: a,
			section: t(i)
		});
		throw Error(`Unsupported body layout source at ${i}`);
	}));
}
function vT(e, t, n, r = t) {
	return dw(Zw(e), t, (t, r) => n(e.rows[t].cells[r]), r);
}
function yT(e, t, n) {
	if (!t || typeof t != "object") return;
	let r = Ww.get(e);
	r || (r = /* @__PURE__ */ new WeakMap(), Ww.set(e, r)), r.set(t, n);
}
function bT(e) {
	let t = /* @__PURE__ */ new Map(), n = 0;
	e.body.forEach((e, r) => {
		if (e.type !== "sectionBreak") return;
		let i = e.__sectionPlacement;
		t.set(r, B({
			sectionId: i?.sectionId ?? `section:${n}`,
			sectionBidi: i?.sectionBidi === !0,
			vAlign: i?.vAlign ?? null,
			lineNumbering: i?.lineNumbering ?? null,
			docGridType: i?.docGridType ?? null,
			docGridLinePitch: i?.docGridLinePitch ?? null,
			docGridCharSpace: i?.docGridCharSpace ?? null,
			gutterPt: i?.gutterPt ?? null,
			rtlGutter: i?.rtlGutter ?? null,
			pageBordersAuthored: i?.pageBordersAuthored ?? !1,
			pageBorders: i?.pageBorders ?? null,
			pageGeometry: i?.pageGeometry ?? e.geom ?? {}
		}, "DOCX ending-section placement input")), n += 1;
	});
	let r = e.section?.__sectionPlacement;
	return Object.freeze({
		endingSections: t,
		finalSection: B({
			sectionId: r?.sectionId ?? `section:${n}`,
			sectionBidi: r?.sectionBidi === !0,
			vAlign: r?.vAlign ?? e.section?.vAlign ?? null,
			lineNumbering: r?.lineNumbering ?? e.section?.lineNumbering ?? null,
			docGridType: r?.docGridType ?? e.section?.docGridType ?? null,
			docGridLinePitch: r?.docGridLinePitch ?? e.section?.docGridLinePitch ?? null,
			docGridCharSpace: r?.docGridCharSpace ?? e.section?.docGridCharSpace ?? null,
			gutterPt: r?.gutterPt ?? null,
			rtlGutter: r?.rtlGutter ?? null,
			pageBordersAuthored: r?.pageBordersAuthored ?? e.section?.pageBorders != null,
			pageBorders: r?.pageBorders ?? e.section?.pageBorders ?? null,
			pageGeometry: r?.pageGeometry ?? (e.section ? Cu(e.section) : {})
		}, "DOCX final-section placement input")
	});
}
var xT = Object.freeze({
	default: null,
	first: null,
	even: null
});
function ST(e) {
	let t = [], n = bT(e), r = 0;
	e.body.forEach((e, i) => {
		if (e.type !== "sectionBreak") return;
		let a = n.endingSections.get(i) ?? n.finalSection, o = t.length;
		t.push({
			sectionOccurrenceId: a.sectionId,
			ordinal: o,
			startBodyIndex: r,
			endBodyIndex: i,
			markerBodyIndex: i,
			final: !1,
			startType: e.kind ?? "nextPage",
			columns: e.columns ?? null,
			authoredGeometry: Vw(a.pageGeometry),
			textDirection: e.textDirection ?? null,
			pageNumType: e.pageNumType ?? null,
			headers: e.headers ?? xT,
			footers: e.footers ?? xT,
			titlePage: e.titlePage ?? !1,
			sectionBidi: a.sectionBidi,
			vAlign: a.vAlign,
			lineNumbering: a.lineNumbering,
			docGridType: a.docGridType,
			docGridLinePitch: a.docGridLinePitch,
			docGridCharSpace: a.docGridCharSpace,
			authoredGutterPt: a.gutterPt,
			rtlGutter: a.rtlGutter === !0,
			pageBordersAuthored: a.pageBordersAuthored,
			pageBorders: a.pageBorders,
			placement: Hw(a)
		}), r = i + 1;
	});
	let i = n.finalSection;
	t.push({
		sectionOccurrenceId: i.sectionId,
		ordinal: t.length,
		startBodyIndex: r,
		endBodyIndex: e.body.length - 1,
		markerBodyIndex: null,
		final: !0,
		startType: e.section.sectionStart ?? "nextPage",
		columns: e.section.columns ?? null,
		authoredGeometry: i.pageGeometry == null ? Cu(e.section) : Vw(i.pageGeometry),
		textDirection: e.section.textDirection ?? null,
		pageNumType: e.section.pageNumType ?? null,
		headers: e.headers ?? xT,
		footers: e.footers ?? xT,
		titlePage: e.section.titlePage,
		sectionBidi: i.sectionBidi,
		vAlign: i.vAlign,
		lineNumbering: i.lineNumbering,
		docGridType: i.docGridType,
		docGridLinePitch: i.docGridLinePitch,
		docGridCharSpace: i.docGridCharSpace,
		authoredGutterPt: i.gutterPt,
		rtlGutter: i.rtlGutter === !0,
		pageBordersAuthored: i.pageBordersAuthored,
		pageBorders: i.pageBorders,
		placement: Hw(i)
	});
	let a = Array(t.length), o = Cu(e.section), s = null, c = null;
	for (let e = t.length - 1; e >= 0; --e) {
		let n = t[e], r = n.startType === "continuous" && s !== null ? s : o, i = n.authoredGeometry, l = {
			pageWidth: i.pageWidth ?? r.pageWidth,
			pageHeight: i.pageHeight ?? r.pageHeight,
			marginTop: i.marginTop ?? r.marginTop,
			marginRight: i.marginRight ?? r.marginRight,
			marginBottom: i.marginBottom ?? r.marginBottom,
			marginLeft: i.marginLeft ?? r.marginLeft,
			headerDistance: i.headerDistance ?? r.headerDistance,
			footerDistance: i.footerDistance ?? r.footerDistance
		}, u = n.authoredGutterPt ?? (n.startType === "continuous" ? c : null) ?? 0, { authoredGeometry: d, authoredGutterPt: f, ...p } = n;
		a[e] = {
			...p,
			geometry: l,
			gutterPt: u
		}, s = l, c = u;
	}
	return B({
		bodyLength: e.body.length,
		occurrences: a
	}, "DOCX body section index input");
}
function CT(e) {
	let t = ST(e), n = /* @__PURE__ */ new Map();
	for (let e of t.occurrences) e.startBodyIndex !== 0 && n.set(e.startBodyIndex - 1, e);
	let r = _T(e.body, (e) => {
		let t = n.get(e);
		if (!t) throw Error(`Missing incoming body section at ${e}`);
		return Object.freeze({
			sectionOccurrenceId: t.sectionOccurrenceId,
			startType: t.startType
		});
	});
	return B({
		sectionIndex: t,
		evenAndOddHeaders: e.section.evenAndOddHeaders,
		endnoteIds: (e.endnotes ?? []).map((e) => e.id),
		noteLayoutSettings: Bw(e),
		pageLayoutSettings: zw(e),
		parserDiagnostics: pi(e.diagnostics, e.body.length),
		sequence: r
	}, "DOCX body layout acquisition input");
}
function wT(e) {
	let t = e.textPath;
	if (t) return B({
		string: t.string,
		...t.fontFamily === void 0 ? {} : { fontFamily: t.fontFamily },
		bold: t.bold ?? !1,
		italic: t.italic ?? !1,
		...t.textPathOk === void 0 ? {} : { textPathOk: t.textPathOk },
		...t.on === void 0 ? {} : { on: t.on },
		...t.fitShape === void 0 ? {} : { fitShape: t.fitShape },
		...t.fitPath === void 0 ? {} : { fitPath: t.fitPath },
		...t.trim === void 0 ? {} : { trim: t.trim },
		...t.xScale === void 0 ? {} : { xScale: t.xScale },
		...t.fontSizePt === void 0 ? {} : { fontSizePt: t.fontSizePt }
	}, "DOCX VML text path acquisition input");
}
function TT(e) {
	let t = e.__anchorAcquisition;
	if (t !== void 0) return B(t, "DOCX anchor acquisition input");
}
function ET(e, t) {
	let n = PT(e).fontFacts, r = n?.rtl === !0 || n?.cs === !0, i = r ? n?.fontSizeCs ?? n?.fontSize ?? t : n?.fontSize ?? t, a = n?.fontFamily ?? e.fontFamily ?? null, o = {
		ascii: a,
		highAnsi: n?.fontFamilyHighAnsi ?? a,
		eastAsia: n?.fontFamilyEastAsia ?? e.fontFamilyEastAsia ?? a,
		complexScript: n?.fontFamilyCs ?? a
	}, s = n?.fontSlots;
	return Object.freeze({
		fontSizePt: i,
		fonts: Object.freeze({ ...s?.direct ?? o }),
		themeFonts: s?.theme ? Object.freeze({ ...s.theme }) : void 0,
		themeFontPresence: s?.themePresent ? Object.freeze({ ...s.themePresent }) : void 0,
		weight: (r ? n?.boldCs ?? !1 : n?.bold ?? !1) ? 700 : 400,
		style: (r ? n?.italicCs ?? !1 : n?.italic ?? !1) ? "italic" : "normal",
		complexScript: r,
		fontHint: n?.fontHint,
		eastAsiaLanguage: n?.langEastAsia,
		kerning: n?.kerning == null ? void 0 : i >= n.kerning
	});
}
function DT(e, t) {
	let n = e.textBoxContent;
	return n === void 0 ? B({
		kind: "compatibility",
		source: t,
		paragraphs: Nh(e, t, ET)
	}, "DOCX public text box acquisition input") : B({
		kind: "complete",
		source: t,
		blockCount: n.length
	}, "DOCX complete text box acquisition input");
}
function OT(e) {
	let t = FT(e).paragraphMarkFontFacts;
	if (!t) return;
	let n = t.rtl === !0 || t.cs === !0, r = e.runs.find((e) => e.type === "text" || e.type === "field")?.fontSize ?? e.defaultFontSize ?? 10, i = n ? t.fontSizeCs ?? t.fontSize ?? r : t.fontSize ?? r, a = t.fontFamily ?? e.defaultFontFamily ?? null, o = {
		ascii: a,
		highAnsi: t.fontFamilyHighAnsi ?? a,
		eastAsia: t.fontFamilyEastAsia ?? e.defaultFontFamilyEastAsia ?? a,
		complexScript: t.fontFamilyCs ?? a
	};
	return Object.freeze({
		fontSizePt: i,
		fonts: Object.freeze({ ...t.fontSlots?.direct ?? o }),
		themeFonts: t.fontSlots?.theme ? Object.freeze({ ...t.fontSlots.theme }) : void 0,
		themeFontPresence: t.fontSlots?.themePresent ? Object.freeze({ ...t.fontSlots.themePresent }) : void 0,
		weight: (n ? t.boldCs ?? !1 : t.bold ?? !1) ? 700 : 400,
		style: (n ? t.italicCs ?? !1 : t.italic ?? !1) ? "italic" : "normal",
		complexScript: n,
		fontHint: t.fontHint,
		eastAsiaLanguage: t.langEastAsia,
		kerning: t.kerning == null ? void 0 : i >= t.kerning
	});
}
function kT(e, t) {
	let n = e, { layoutLines: r, lineSlice: i, runs: a, paragraphMarkFontFacts: o, __paragraphTypographyAcquisition: s, __complexFieldBoundaries: c, __runRevisions: l, ...u } = e, d = Tw(n), f = e.__complexFieldBoundaries?.map((e) => ({
		occurrenceKey: [
			"complex-field",
			t.story,
			t.storyInstance,
			t.path.slice(0, -1).join("."),
			String(e.occurrenceId)
		].join(":"),
		boundary: e.boundary,
		runIndex: e.runIndex,
		fieldType: e.fieldType,
		instruction: e.instruction,
		...e.hyperlinkAnchor === void 0 ? {} : { hyperlinkAnchor: e.hyperlinkAnchor }
	})), p = u.numbering, m = p == null ? null : (({ fontFacts: e, ...t }) => t)(p), h = structuredClone({
		...u,
		numbering: m
	}), g = Fw(n), _ = [];
	if (g.length === 0) n.runs.forEach((e, t) => {
		_.push({
			run: e,
			originalRun: n.runs[t]
		});
	});
	else {
		let e = 0;
		for (let t = 0; t <= n.runs.length; t += 1) {
			for (; g[e]?.publicRunIndex === t;) {
				let t = g[e].run;
				_.push({
					run: t,
					originalRun: t
				}), e += 1;
			}
			t < n.runs.length && _.push({
				run: n.runs[t],
				originalRun: n.runs[t]
			});
		}
	}
	let v = _.map(({ run: e, originalRun: n }, r) => {
		let i = e;
		if (i.type === "unavailableDrawing") {
			let e = TT(n), r = e === void 0 ? void 0 : B({
				...e,
				occurrenceId: at(t, e.occurrenceId)
			}, "DOCX scoped unavailable drawing anchor acquisition input"), { __anchorAcquisition: a, ...o } = i;
			return Object.freeze({
				...o,
				...r === void 0 ? {} : { anchorAcquisitionInput: r }
			});
		}
		if (e.type === "math") {
			let n = Object.freeze({
				...t,
				path: Object.freeze([...t.path, r])
			}), i = e;
			return Object.freeze({
				type: "math",
				display: e.display,
				fontSize: e.fontSize,
				...e.jc === void 0 ? {} : { jc: e.jc },
				source: i.source ?? n,
				resourceKey: i.resourceKey ?? et(n, e.display ? "display" : "inline"),
				fallbackText: G(e.nodes)
			});
		}
		if (e.type === "anchorHost") {
			let { __anchorOccurrenceId: n, ...r } = e;
			return Object.freeze({
				...r,
				...n === void 0 ? {} : { anchorOccurrenceId: at(t, n) }
			});
		}
		if (e.type === "shape" || e.type === "image" || e.type === "chart") {
			let i = TT(n), a = i === void 0 ? void 0 : B({
				...i,
				occurrenceId: at(t, i.occurrenceId)
			}, "DOCX scoped anchor acquisition input"), { __anchorAcquisition: o, ...s } = e;
			if (e.type !== "shape") {
				let n = e.type === "chart" ? (({ chart: e, ...n }) => ({
					...n,
					resourceKey: rt({
						...t,
						path: [...t.path, r]
					})
				}))(s) : s;
				return Object.freeze({
					...structuredClone(n),
					...a === void 0 ? {} : { anchorAcquisitionInput: a }
				});
			}
			let c = n, l = wT(c), u = Object.freeze({
				...t,
				path: Object.freeze([...t.path, r])
			}), d = DT(c, {
				story: "textbox",
				storyInstance: `${u.story}:${u.storyInstance}:${u.path.join(".")}`,
				path: []
			}), { textBoxContent: f, textBlocks: p, textPath: m, ...h } = s;
			return Object.freeze({
				type: "shape",
				...structuredClone(h),
				...l === void 0 ? {} : { vmlTextPathInput: l },
				...(d.kind === "complete" ? d.blockCount : d.paragraphs.length) === 0 ? {} : { textBoxInput: d },
				...a === void 0 ? {} : { anchorAcquisitionInput: a }
			});
		}
		if (e.type === "text" || e.type === "field") {
			let t = ww(n), { __typographyAcquisition: r, __noBreakBefore: i, __noBreakAfter: a, __noBreakHyphenOffsets: o, ...s } = e, c = e.type === "text" ? o?.filter((t) => Number.isInteger(t) && t > 0 && t <= e.text.length).map((e) => Object.freeze({
				start: e - 1,
				end: e
			})) : void 0;
			return Object.freeze({
				...structuredClone(s),
				...i === !0 ? { noBreakBefore: !0 } : {},
				...a === !0 ? { noBreakAfter: !0 } : {},
				...c?.length ? { noBreakRanges: Object.freeze(c) } : {},
				...t === void 0 ? {} : { typographyInput: t }
			});
		}
		return Object.freeze(structuredClone(e));
	});
	return Pn({
		...h,
		runs: v,
		...f?.length ? { complexFieldBoundaries: f } : {},
		numberingMarkerShapeInput: e.numbering ? ET(e.numbering, n.runs.find((e) => e.type === "text" || e.type === "field")?.fontSize ?? e.defaultFontSize ?? 10) : void 0,
		paragraphMarkShapeInput: OT(e),
		...d === void 0 ? {} : { typographyInput: d }
	});
}
function AT(e) {
	return MT(e, !1);
}
function jT(e) {
	return MT(e, !0);
}
function MT(e, t) {
	let n = [], r = (e, a, o, s) => {
		if (e.type === "paragraph") {
			let i = e, c = i.__runRevisions ?? [], l = i.__runRevisions !== void 0, u = [], d = [], f = e.runs.some((e) => e.type === "unavailableDrawing");
			Iw(e).forEach((e, i) => {
				let p = c[i] ?? void 0, m = e.revision, h = p === void 0 || m !== void 0 ? e : {
					...e,
					revision: p
				};
				if (h !== e && (l = !0), h.type === "unavailableDrawing") {
					d.push(Object.freeze({
						publicRunIndex: u.length,
						run: B(h, "DOCX unavailable drawing parser sidecar")
					})), f && (l = !0);
					return;
				}
				if (h.type === "math") {
					l = !0;
					let e = Object.freeze({
						story: a,
						storyInstance: o,
						path: Object.freeze([...s, i])
					}), t = et(e, h.display ? "display" : "inline");
					n.push(Object.freeze({
						nodes: h.nodes,
						display: h.display,
						source: e,
						resourceKey: t
					})), u.push(Object.freeze({
						...h,
						source: e,
						resourceKey: t
					}));
					return;
				}
				if (h.type !== "shape") {
					u.push(h);
					return;
				}
				let g = h, _ = g.textBoxContent;
				if (_ === void 0) {
					u.push(h);
					return;
				}
				let v = {
					story: a,
					storyInstance: o,
					path: [...s, i]
				}, y = `${v.story}:${v.storyInstance}:${v.path.join(".")}`, b = !1, x = t ? _ : Array(_.length);
				if (_.forEach((e, t) => {
					if (e.type === "unsupportedTextBoxBlock") {
						x[t] = e;
						return;
					}
					let n = r(e, "textbox", y, [t]);
					n !== e && (b = !0), x[t] = n;
				}), !b) {
					u.push(h);
					return;
				}
				l = !0, t ? (g.textBoxContent = x, u.push(h)) : u.push({
					...h,
					textBoxContent: x
				});
			});
			let p;
			if (t) l && Object.assign(e, { runs: u }), delete e.__runRevisions, p = e;
			else if (l) {
				let { __runRevisions: e, ...t } = i;
				p = {
					...t,
					runs: u
				};
			} else p = e;
			return d.length > 0 && Pw.set(p, Object.freeze(d)), p;
		}
		if (e.type === "table") {
			if (t) return e.rows.forEach((e, t) => e.cells.forEach((e, n) => {
				e.content = i(e.content, a, o, [
					...s,
					t,
					n
				]);
			})), e;
			let n = !1, r = e.rows.map((e, t) => {
				let r = !1, c = e.cells.map((e, n) => {
					let c = i(e.content, a, o, [
						...s,
						t,
						n
					]);
					return c === e.content ? e : (r = !0, {
						...e,
						content: c
					});
				});
				return r ? (n = !0, {
					...e,
					cells: c
				}) : e;
			});
			return n ? {
				...e,
				rows: r
			} : e;
		}
		if (e.type !== "sectionBreak") return e;
		let c = s.at(-1) ?? 0, l = !1, u = (e, t) => {
			if (!e) return e;
			let n = e;
			for (let r of [
				"default",
				"first",
				"even"
			]) {
				let a = e[r];
				if (!a) continue;
				let o = i(a.body, t, `section:${c}:${r}`);
				o !== a.body && (n === e && (n = { ...e }), n[r] = {
					...a,
					body: o
				}, l = !0);
			}
			return n;
		}, d = u(e.headers, "header"), f = u(e.footers, "footer");
		return l ? {
			...e,
			headers: d,
			footers: f
		} : e;
	}, i = (e, n, i, a = []) => {
		if (t) {
			for (let t = 0; t < e.length; t += 1) e[t] = r(e[t], n, i, [...a, t]);
			return e;
		}
		let o = !1, s = e.map((e, t) => {
			let s = r(e, n, i, [...a, t]);
			return s !== e && (o = !0), s;
		});
		return o ? s : e;
	}, a = (e, t) => {
		if (!e) return {
			default: null,
			first: null,
			even: null
		};
		let n = e;
		for (let r of [
			"default",
			"first",
			"even"
		]) {
			let a = e[r];
			if (!a) continue;
			let o = i(a.body, t, r);
			o !== a.body && (n === e && (n = { ...e }), n[r] = {
				...a,
				body: o
			});
		}
		return n;
	}, o = i(e.body, "body", "body"), s = a(e.headers, "header"), c = a(e.footers, "footer"), l = (e, n) => {
		if (!e) return e;
		if (t) {
			for (let t of e) t.content = i(t.content, n, t.id);
			return e;
		}
		let r = !1, a = e.map((e) => {
			let t = i(e.content, n, e.id);
			return t === e.content ? e : (r = !0, {
				...e,
				content: t
			});
		});
		return r ? a : e;
	}, u = l(e.footnotes, "footnote"), d = l(e.endnotes, "endnote"), f = o !== e.body || s !== e.headers || c !== e.footers || u !== e.footnotes || d !== e.endnotes ? {
		...e,
		body: o,
		headers: s,
		footers: c,
		footnotes: u,
		endnotes: d
	} : e, p = bT(f);
	Uw.set(f, p), yT(f.body, f.section, p);
	let m, h = () => m ??= CT(f), g = RT();
	return Object.freeze({
		document: f,
		mathOccurrences: Object.freeze(n),
		fontFamilyCharsets: Object.freeze({ ...IT(f).fontFamilyCharsets ?? {} }),
		get bodyLayoutInput() {
			return Mw(h());
		},
		bodyModelGateway: Object.freeze({
			acquisitionInputs: g,
			get bodySectionIndex() {
				return h().sectionIndex;
			},
			effectiveTablePositioning: $w,
			publicAnchorBridge: mT
		})
	});
}
function NT(e) {
	return AT(e).document;
}
function PT(e) {
	return e;
}
function FT(e) {
	return e;
}
function IT(e) {
	return e;
}
var LT = Object.freeze({
	numberingMarkerShapeInput: ET,
	paragraphMarkShapeInput: OT,
	tableFormatInput: uT,
	tableColumnLayoutInput: vT,
	tableParticipatesInOrdinaryFlow: Qw,
	paragraphAcquisitionInput: kT
});
function RT() {
	let e = /* @__PURE__ */ new WeakMap(), t = (t, n) => {
		let r = e.get(t);
		r || (r = /* @__PURE__ */ new Map(), e.set(t, r));
		let i = z(n), a = r.get(i);
		if (a) return a;
		let o = kT(t, n);
		return r.set(i, o), o;
	};
	return Object.freeze({
		...LT,
		paragraphAcquisitionInput: t
	});
}
//#endregion
//#region packages/docx/src/vertical-render-capability.ts
var zT = new Set([
	"tbRl",
	"tbRlV",
	"tbLrV"
]);
function BT(e) {
	let t = [e], n = /* @__PURE__ */ new Set();
	for (; t.length > 0;) {
		let e = t.pop();
		if (!(typeof e != "object" || !e || n.has(e))) {
			if (n.add(e), !Array.isArray(e)) {
				let t = e;
				if (typeof t.textDirection == "string" && zT.has(t.textDirection)) return !0;
			}
			t.push(...Object.values(e));
		}
	}
	return !1;
}
//#endregion
//#region packages/docx/src/layout-source-model-adapter.ts
var VT = /* @__PURE__ */ new WeakMap();
function HT(e) {
	let t = wu(), n = e.section ?? {}, r = (e, t) => Number.isFinite(e) ? e : t, i = (e) => ({
		default: e?.default ?? null,
		first: e?.first ?? null,
		even: e?.even ?? null
	});
	return {
		...e,
		body: e.body ?? [],
		section: {
			...t,
			...n,
			pageWidth: r(n.pageWidth, t.pageWidth),
			pageHeight: r(n.pageHeight, t.pageHeight),
			marginTop: r(n.marginTop, t.marginTop),
			marginRight: r(n.marginRight, t.marginRight),
			marginBottom: r(n.marginBottom, t.marginBottom),
			marginLeft: r(n.marginLeft, t.marginLeft),
			headerDistance: r(n.headerDistance, t.headerDistance),
			footerDistance: r(n.footerDistance, t.footerDistance)
		},
		headers: i(e.headers),
		footers: i(e.footers)
	};
}
function UT(e, t, n, r) {
	if (e) for (let i of [
		"default",
		"first",
		"even"
	]) {
		let a = e[i];
		a && r(a.body, {
			story: t,
			storyInstance: n === null ? i : `${n}:${i}`,
			path: []
		});
	}
}
function WT(e, t, n, r = () => {}, i = () => {}) {
	let a = (e, o, s = []) => {
		e.forEach((c, l) => {
			let u = [...s, l];
			if (c.type === "paragraph") {
				let r = {
					...o,
					path: u
				}, s = t.paragraphAcquisitionInput(c, r), d = n(c, r, s);
				d && (e[l] = d);
				let f = 0;
				s.runs.forEach((e, t) => {
					if (e.type === "unavailableDrawing") return;
					let n = c.runs[f++];
					if (e.type !== "shape" || n?.type !== "shape") return;
					let r = n.textBoxContent;
					if (!r) return;
					let s = {
						story: "textbox",
						storyInstance: `${o.story}:${o.storyInstance}:${u.join(".")}.${t}`,
						path: []
					};
					i(r, s), a(r, s);
				});
			} else c.type === "table" ? (r(c, {
				...o,
				path: u
			}), c.rows.forEach((e, t) => e.cells.forEach((e, n) => {
				a(e.content, o, [
					...u,
					t,
					n
				]);
			}))) : c.type === "sectionBreak" && (UT(c.headers, "header", `section:${l}`, a), UT(c.footers, "footer", `section:${l}`, a));
		});
	};
	a(e.body, {
		story: "body",
		storyInstance: "body",
		path: []
	}), UT(e.headers, "header", null, a), UT(e.footers, "footer", null, a);
	for (let t of e.footnotes ?? []) a(t.content, {
		story: "footnote",
		storyInstance: t.id,
		path: []
	});
	for (let t of e.endnotes ?? []) a(t.content, {
		story: "endnote",
		storyInstance: t.id,
		path: []
	});
}
function GT(e) {
	let t = [], n = (e, n) => {
		t.push({
			source: n,
			body: e
		});
	};
	return UT(e.headers, "header", null, n), UT(e.footers, "footer", null, n), e.body.forEach((e, t) => {
		e.type === "sectionBreak" && (UT(e.headers, "header", `section:${t}`, n), UT(e.footers, "footer", `section:${t}`, n));
	}), t;
}
function KT(e) {
	return GT(e).map(({ body: e }) => e);
}
function qT(e) {
	return e ?? Object.freeze([]);
}
function JT(e, t, n, r = []) {
	let i = (e, t, r) => e && Object.fromEntries([
		"default",
		"first",
		"even"
	].map((i) => {
		let a = e[i];
		return [i, a ? {
			...structuredClone(Object.fromEntries(Object.entries(a).filter(([e]) => e !== "body"))),
			body: JT(a.body, {
				story: t,
				storyInstance: `${r}:${i}`,
				path: []
			}, n)
		} : null];
	}));
	return e.map((e, a) => {
		let o = [...r, a];
		if (e.type === "paragraph") {
			let e = n.get(z({
				...t,
				path: o
			}));
			if (!e) throw Error(`Missing canonical paragraph source: ${z({
				...t,
				path: o
			})}`);
			return e;
		}
		if (e.type === "table") {
			let r = structuredClone(e), { __tableLayout: i, ...a } = r;
			return {
				...a,
				rows: r.rows.map((e, r) => {
					let { __tableRowLayout: i, ...a } = e;
					return {
						...a,
						cells: e.cells.map((e, i) => {
							let { __tableCellLayout: a, ...s } = e;
							return {
								...s,
								content: JT(e.content, t, n, [
									...o,
									r,
									i
								])
							};
						})
					};
				})
			};
		}
		if (e.type !== "sectionBreak") return structuredClone(e);
		let { __sectionPlacement: s, headers: c, footers: l, ...u } = e;
		return {
			...structuredClone(u),
			headers: i(e.headers, "header", `section:${a}`),
			footers: i(e.footers, "footer", `section:${a}`)
		};
	});
}
function YT(e) {
	let { __sectionPlacement: t, ...n } = e;
	return structuredClone(n);
}
function XT(e) {
	let t = e;
	return delete t.__sectionPlacement, t;
}
function ZT(e, t, n) {
	return Object.fromEntries([
		"default",
		"first",
		"even"
	].map((r) => {
		let i = e[r];
		return [r, i ? {
			...structuredClone(Object.fromEntries(Object.entries(i).filter(([e]) => e !== "body"))),
			body: JT(i.body, {
				story: t,
				storyInstance: r,
				path: []
			}, n)
		} : null];
	}));
}
function QT(e, t, n, r = []) {
	let i = (e, t, r) => {
		if (!e) return e;
		for (let i of [
			"default",
			"first",
			"even"
		]) {
			let a = e[i];
			a && (a.body = QT(a.body, {
				story: t,
				storyInstance: `${r}:${i}`,
				path: []
			}, n));
		}
		return e;
	}, a = e;
	for (let e = 0; e < a.length; e += 1) {
		let o = a[e], s = [...r, e];
		if (o.type === "paragraph") {
			let r = n.get(z({
				...t,
				path: s
			}));
			if (!r) throw Error(`Missing canonical paragraph source: ${z({
				...t,
				path: s
			})}`);
			a[e] = r;
			continue;
		}
		if (o.type === "table") {
			let r = o;
			delete r.__tableLayout, r.rows.forEach((e, r) => {
				let i = e;
				delete i.__tableRowLayout, i.cells.forEach((e, i) => {
					let a = e;
					delete a.__tableCellLayout, a.content = QT(a.content, t, n, [
						...s,
						r,
						i
					]);
				});
			}), a[e] = r;
			continue;
		}
		if (o.type !== "sectionBreak") continue;
		let c = o;
		delete c.__sectionPlacement, c.headers = i(c.headers, "header", `section:${e}`), c.footers = i(c.footers, "footer", `section:${e}`);
	}
	return a;
}
function $T(e, t, n) {
	for (let r of [
		"default",
		"first",
		"even"
	]) {
		let i = e[r];
		i && (i.body = QT(i.body, {
			story: t,
			storyInstance: r,
			path: []
		}, n));
	}
	return e;
}
function eE(e) {
	let t = VT.get(e);
	if (t) return t;
	let n = AT(HT(e));
	return rE(n, n, !1, e);
}
function tE(e, t) {
	return VT.get(e) || rE(jT(HT(e)), jT(HT(t)), !0, e);
}
function nE(e) {
	let t = jT(HT(e));
	return rE(t, t, !0, e).source;
}
function rE(e, t, n, r) {
	let i = t.document, a = t.bodyModelGateway.acquisitionInputs, o = t.bodyLayoutInput, s = eu(i, Rw(i)), c = Qn(i, a, t.mathOccurrences, (e) => {
		let t = e.numbering;
		if (!t) throw Error("Picture-bullet metadata requires numbering");
		let n = a.numberingMarkerShapeInput(t, Vs(e));
		return {
			widthPt: t.picBulletWidthPt ?? n.fontSizePt,
			heightPt: t.picBulletHeightPt ?? n.fontSizePt
		};
	}), l = qT(i.footnotes), u = qT(i.endnotes), d = Cg(i.body, l, [...KT(i), ...u.map((e) => e.content)]), f = BT(i), p = i.parseError === void 0 ? null : {
		message: i.parseError,
		pageSize: {
			widthPt: i.section.pageWidth,
			heightPt: i.section.pageHeight
		}
	}, m = {
		familyClasses: { ...i.fontFamilyClasses ?? {} },
		familyPitches: { ...i.fontFamilyPitches ?? {} },
		majorFamily: i.majorFont ?? null,
		minorFamily: i.minorFont ?? null,
		embeddedFonts: [...i.embeddedFonts ?? []],
		renderedFamilies: zC(i),
		preloadNames: HC(i),
		localMetricRequests: Sw(i),
		defaultBodyFontSizePt: Pb(i)
	}, h = /* @__PURE__ */ new Map(), g = [], _ = [], v = [];
	WT(i, a, (e, r, i) => {
		let a = z(r);
		if (h.has(a)) throw Error(`Duplicate paragraph source: ${a}`);
		h.set(a, i);
		let o = 0, s = i.runs.map((n, i) => {
			if (n.type === "unavailableDrawing") return null;
			let a = e.runs[o++];
			return a ? t.bodyModelGateway.publicAnchorBridge(a, r, i) : null;
		});
		return g.push(Object.freeze({
			source: Pn({
				...r,
				path: [...r.path]
			}),
			publicAnchorBridges: Object.freeze(s),
			numberingMarkerFallbackFontSizePt: e.numbering ? Vs(e) : null
		})), n ? i : void 0;
	}, (e, t) => {
		_.push(Object.freeze({
			source: Pn({
				...t,
				path: [...t.path]
			}),
			input: Zw(e)
		}));
	}, (e, t) => {
		v.push({
			body: e,
			source: t
		});
	}), Object.freeze({
		...a,
		paragraphAcquisitionInput(e, t) {
			let n = h.get(z(t));
			if (!n) throw Error(`Unknown paragraph acquisition source: ${z(t)}`);
			return n;
		}
	});
	let y = n ? QT : JT, b = n ? $T : ZT, x = {
		...i,
		body: y(i.body, {
			story: "body",
			storyInstance: "body",
			path: []
		}, h),
		headers: b(i.headers, "header", h),
		footers: b(i.footers, "footer", h),
		footnotes: l.map(({ content: e, ...t }) => ({
			...structuredClone(t),
			content: y(e, {
				story: "footnote",
				storyInstance: t.id,
				path: []
			}, h)
		})),
		endnotes: u.map(({ content: e, ...t }) => ({
			...structuredClone(t),
			content: y(e, {
				story: "endnote",
				storyInstance: t.id,
				path: []
			}, h)
		}))
	}, S = v.map(({ source: e, body: t }) => ({
		source: e,
		body: y(t, e, h)
	}));
	Pn(h);
	let C = yw({
		bodyLayoutInput: o,
		blockRepository: {
			body: x.body,
			stories: [...GT(x).map(({ source: e, body: t }) => ({
				source: e,
				body: t
			})), ...S],
			footnotes: x.footnotes ?? [],
			endnotes: x.endnotes ?? []
		},
		section: n ? XT(i.section) : YT(i.section),
		documentLayoutFacts: Pn({
			...s,
			kinsoku: {
				enabled: s.kinsoku.enabled,
				lineStartForbidden: [...s.kinsoku.lineStartForbidden].sort((e, t) => e - t),
				lineEndForbidden: [...s.kinsoku.lineEndForbidden].sort((e, t) => e - t)
			}
		}),
		fonts: Pn(m),
		fontFamilyCharsets: t.fontFamilyCharsets,
		acquisitionFacts: Object.freeze({
			paragraphs: Object.freeze(g),
			tables: Object.freeze(_)
		}),
		mathOccurrences: t.mathOccurrences,
		imageMetadata: c.imageMetadata,
		paintDescriptors: c.paintResources.descriptors,
		hasPaginationFields: d,
		requiresDomVerticalGlyphLayout: f,
		fatalParse: p === null ? null : Pn(p)
	}), w = Object.freeze({
		document: e.document,
		source: C
	});
	return VT.set(r, w), VT.set(e.document, w), w;
}
function iE(e) {
	return eE(e).source;
}
//#endregion
//#region packages/docx/src/layout-runtime.ts
function aE(e, t, n) {
	return AC(e, t, n).kernel;
}
function oE(e, t = {}) {
	let n = pw(e) ? e : iE(e), r = t.measureContext ?? (() => {
		if (typeof document < "u") {
			let e = document.createElement("canvas").getContext("2d");
			if (e !== null) return e;
		}
		return typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1).getContext("2d") : null;
	})(), i = r === null ? null : Object.freeze({
		get font() {
			return r.font;
		},
		set font(e) {
			r.font = e;
		},
		get letterSpacing() {
			return r.letterSpacing;
		},
		set letterSpacing(e) {
			r.letterSpacing = e;
		},
		get fontKerning() {
			return r.fontKerning;
		},
		set fontKerning(e) {
			r.fontKerning = e;
		},
		measureText(e) {
			return r.measureText(e);
		}
	}), a = r?.canvas, o = a?.ownerDocument?.defaultView?.HTMLCanvasElement, s = r !== null && (typeof o == "function" && a instanceof o || typeof HTMLCanvasElement < "u" && a instanceof HTMLCanvasElement), c = Object.freeze({
		fingerprint: r === null ? "vertical-glyph-measurement:deterministic-v1" : s ? "vertical-glyph-measurement:dom-vert-probe-v2" : "vertical-glyph-measurement:no-dom-vert-probe-v1",
		measureRunInkExtra(e) {
			if (r === null) throw Error("Vertical glyph measurement requires a concrete text context");
			return ce(r, () => OC(r, e));
		},
		planRun(e) {
			if (r === null) throw Error("Vertical glyph planning requires a concrete text context");
			return ce(r, () => {
				let t = r.font, n = r.fontKerning;
				r.font = e.font, r.fontKerning = e.fontKerning;
				try {
					return EC(r, e.text, e.fontSizePt, e.letterSpacingPt, e.charScale, e.growTrRotateInk, (e) => me(r, e), e.writingMode);
				} finally {
					r.font = t, r.fontKerning = n;
				}
			});
		}
	}), l = Ri(t.localMetrics), u = YC(n, {
		...t,
		localMetrics: l,
		measureContext: i,
		verticalGlyphMeasurement: c
	});
	return vr(u, n), gr(u, aE(n, i, l)), u;
}
//#endregion
//#region packages/docx/src/renderer.ts
function sE(e) {
	return (Array.isArray(e) ? $n(e) : iE(e).mathOccurrences).length > 0;
}
async function cE(e, t) {
	if (Array.isArray(e)) throw TypeError("prepareMathRuns requires a document model so every story has an explicit structural source");
	return ab(iE(e).mathOccurrences, t);
}
function lE(e, t, n, r) {
	let i = r.layoutServices ?? oE(e, e.fatalParse === null ? { measureContext: t.getContext("2d") } : {}), a = yr(i);
	if (a && a !== e) throw Error("Layout services belong to a different document source");
	let o = r.defaultCurrentDateMs ?? Date.now();
	ib(i, o, () => e);
	let s = zd(i, {
		currentDate: r.currentDate,
		defaultCurrentDateMs: o,
		showTrackedChanges: r.showTrackedChanges
	}, n), c = kp(s.page, r.width);
	return {
		selection: s,
		paintOptions: {
			width: r.width,
			dpr: r.dpr,
			defaultTextColor: r.defaultTextColor,
			fetchImage: r.fetchImage,
			svgDecoder: r.svgDecoder,
			parseError: e.fatalParse !== null,
			registry: Pr(i),
			rasterPaintOccurrences: gf(s.layout, n),
			privateResources: Tr(i),
			textRuns: r.onTextRun ? yf(s.layout, n, { scale: c }) : [],
			onTextRun: r.onTextRun,
			threeD: r.threeD,
			regionMap: r.regionMap,
			chartEx: r.chartEx,
			tiff: r.tiff,
			imageResources: r.imageResources
		}
	};
}
async function uE(e, t, n, r = {}) {
	let i = lE(e, t, n, r);
	return Np(i.selection.layout, i.selection.page, t, i.paintOptions);
}
//#endregion
//#region packages/docx/src/document-layout.ts
function dE(e, t = oE(e), n) {
	let r = pw(e) ? e : iE(e), i = yr(t);
	if (i && i !== r) throw Error("Layout services belong to a different document source");
	return nb(r.bodyLayoutInput, t, n);
}
//#endregion
//#region packages/docx/src/render-worker-layout.ts
function fE(e, t, n) {
	let r = yr(t);
	if (r && r !== e) throw Error("Layout services belong to a different document source");
	let i = Rd({
		source: e,
		services: t,
		defaultCurrentDateMs: n,
		buildLayout: (n) => dE(e, t, n)
	});
	return Object.freeze({
		layoutServices: t,
		layoutVariants: i.store,
		defaultCurrentDateMs: n
	});
}
//#endregion
//#region packages/docx/src/document-pull-client.ts
var pE = 1024 * 1024, mE = Math.max(l, p);
async function hE(e, t, n = {}) {
	let r = [];
	return yE(e, t, n, {
		acceptBody: (e) => {
			r.push(...e);
		},
		complete: (e) => (e.body = r, e)
	});
}
async function gE(e, t, n = {}) {
	let r = [];
	return yE(e, t, n, {
		acceptBody: (e) => {
			r.push(...e);
		},
		complete: (e) => (e.body = r, nE(e))
	});
}
async function _E(e, t, n = {}) {
	let r = await vE(e, t, n);
	return tE(r.document, r.ownedLayoutDocument);
}
async function vE(e, t, n = {}) {
	let r = [], i = [];
	return yE(e, t, n, {
		acceptBody: (e) => {
			let t = structuredClone(e);
			for (let t of e) r.push(t);
			for (let e of t) i.push(e);
		},
		complete: (e) => {
			let t = structuredClone(e);
			return e.body = r, t.body = i, Object.freeze({
				document: e,
				ownedLayoutDocument: t
			});
		}
	});
}
async function yE(e, t, n, r) {
	let i = new _(e, {
		...t,
		maxByteCredit: mE,
		timeoutMs: n.timeoutMs
	});
	try {
		for (;;) {
			let e = await SE(i, n.signal);
			try {
				let t = e.usage ?? i.usageCheckpoint;
				t && n.onUsage?.(t);
				let a = xE(e.payload);
				if (e.done !== (a.kind === "complete")) throw TypeError("DOCX document unit terminal flag does not match its payload");
				if (a.kind === "body") {
					r.acceptBody(a.body), await e.ack({ signal: n.signal });
					continue;
				}
				if (!Array.isArray(a.document.body) || a.document.body.length !== 0) throw TypeError("DOCX terminal document must not duplicate streamed body blocks");
				let o = r.complete(a.document);
				return await e.ack({ signal: n.signal }), o;
			} finally {
				e.disposeTransferred();
			}
		}
	} catch (e) {
		throw await i.cancel("request-error").catch(() => void 0), e;
	}
}
function bE(e) {
	return !!e && typeof e == "object" && e.protocol === "ooxml-pull-v1";
}
function xE(e) {
	let t = JSON.parse(new TextDecoder().decode(new Uint8Array(e)));
	if (!t || typeof t != "object") throw TypeError("DOCX document unit must be an object");
	let n = t;
	if (n.kind === "body" && Array.isArray(n.body) || n.kind === "complete" && n.document && typeof n.document == "object") return n;
	throw TypeError("DOCX document unit has an unknown shape");
}
async function SE(e, t) {
	try {
		return await e.pull(pE, { signal: t });
	} catch (n) {
		let r = CE(n);
		if (r === void 0) throw n;
		return e.pull(r, { signal: t });
	}
}
function CE(e) {
	return f(e, pE, mE);
}
//#endregion
export { B as A, Wd as C, ar as D, ir as E, Cr as O, Gd as S, ai as T, Yy as _, fE as a, hf as b, uE as c, Cw as d, BC as f, tb as g, eb as h, hE as i, Cn as j, Pr as k, oE as l, rb as m, _E as n, sE as o, HC as p, gE as r, cE as s, bE as t, NT as u, Op as v, zd as w, mf as x, bf as y };
