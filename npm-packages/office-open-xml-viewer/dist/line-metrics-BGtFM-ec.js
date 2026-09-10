import { cn as e, dn as t, fn as n, hn as r, ln as i, mn as a, pn as o, un as s } from "./plot-area-frame-D5hEOgkJ.js";
import { a as c, c as l, i as u, l as d, n as f, o as p, r as m, s as h, t as g } from "./pixel-budget-Dgjw269h.js";
import { L as _ } from "./three-d-YYghQndN.js";
import { a as v, c as y, i as b, n as x, o as S, r as C, s as ee } from "./raster-target-ojDdQizC.js";
import { t as te } from "./mathjax-DS69BmJd.js";
//#region packages/core/src/errors/ooxml-error.ts
var w = class e extends Error {
	code;
	constructor(t, n) {
		super(n), this.name = "OoxmlError", this.code = t, Object.setPrototypeOf(this, e.prototype);
	}
}, T = class e extends Error {
	code = "ooxml-resource-limit";
	details;
	constructor(t, n) {
		super(t), this.name = "OoxmlResourceLimitError";
		let r = n.violation, i = Object.freeze({
			format: r.format,
			operation: r.operation,
			resource: r.resource,
			metric: r.metric,
			...r.part === void 0 ? {} : { part: r.part },
			limit: r.limit,
			observed: r.observed,
			configurable: r.configurable,
			usage: Object.freeze({
				archiveEntryCount: r.usage.archiveEntryCount,
				declaredInflatedBytes: r.usage.declaredInflatedBytes,
				...r.usage.largestInflatedEntryBytes === void 0 ? {} : { largestInflatedEntryBytes: r.usage.largestInflatedEntryBytes },
				distinctInflatedBytes: r.usage.distinctInflatedBytes,
				operationInflatedBytes: r.usage.operationInflatedBytes
			})
		});
		this.details = Object.freeze({
			stage: n.stage,
			violation: i
		}), Object.setPrototypeOf(this, e.prototype);
	}
}, ne = 134217728, re = 268435456, ie = 4096, ae = 2e4, oe = 67108864, se = 67108864, ce = 67108864, le = 67108864, ue = 134217728, de = 134217728, fe = 1e5, pe = 25e4, me = 33554432, he = 67108864, ge = 2e5, _e = 5e5, ve = 67108864, ye = 134217728, be = 25e4, xe = 31457280, Se = "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap", Ce = "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap", we = "https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap", Te = {
	calibri: {
		url: "https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap",
		loadFamily: "Carlito"
	},
	"calibri light": {
		url: "https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap",
		loadFamily: "Carlito"
	},
	cambria: {
		url: "https://fonts.googleapis.com/css2?family=Caladea:ital,wght@0,400;0,700;1,400;1,700&display=swap",
		loadFamily: "Caladea"
	},
	"cambria math": {
		url: "https://fonts.googleapis.com/css2?family=Caladea:ital,wght@0,400;0,700;1,400;1,700&display=swap",
		loadFamily: "Caladea"
	},
	"franklin gothic book": {
		url: we,
		loadFamily: "Libre Franklin"
	},
	"franklin gothic medium": {
		url: we,
		loadFamily: "Libre Franklin"
	},
	"nunito sans": { url: "https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	nunito: { url: "https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	"open sans": { url: "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	roboto: { url: "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	lato: { url: "https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	montserrat: { url: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	poppins: { url: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	raleway: { url: "https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	"playfair display": { url: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	ubuntu: { url: "https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,400;0,700;1,400;1,700&display=swap" },
	"sakkal majalla": {
		url: Se,
		loadFamily: "Noto Naskh Arabic"
	},
	"traditional arabic": {
		url: Se,
		loadFamily: "Noto Naskh Arabic"
	},
	"simplified arabic": {
		url: Se,
		loadFamily: "Noto Naskh Arabic"
	},
	"arabic typesetting": {
		url: Se,
		loadFamily: "Noto Naskh Arabic"
	},
	"univers next arabic": {
		url: Ce,
		loadFamily: "Noto Sans Arabic"
	},
	"noto naskh arabic": {
		url: Se,
		loadFamily: "Noto Naskh Arabic"
	},
	"noto sans arabic": {
		url: Ce,
		loadFamily: "Noto Sans Arabic"
	}
};
//#endregion
//#region packages/core/src/fonts/scripts.ts
function Ee(e) {
	if (!e) return null;
	let t = e.toLowerCase();
	return /[ᄀ-ᇿ㄰-㆏가-힯]/.test(e) ? "kr" : /[぀-ヿ]/.test(e) ? "jp" : /jhenghei|微軟正黑|新細明|細明|pmingliu|mingliu|dfkai|標楷|華康|cns11643|kaiti tc|ming\s*liu/.test(t) || /新細明體|細明體|標楷體|微軟正黑體|華康/.test(e) ? "tc" : /simsun|nsimsun|simhei|simkai|simfang|yahei|dengxian|fangsong|kaiti|youyuan|lisu|stsong|stkaiti|stfangsong|stheiti|stxihei|stzhongsong|songti sc|heiti sc|微软雅黑/.test(t) || /宋体|黑体|楷体|仿宋|等线|微软雅黑|隶书|幼圆/.test(e) ? "sc" : /malgun|batang|gulim|dotum|gungsuh|nanum|new gulim|hancom|hy(gothic|graphic|namu)?/.test(t) ? "kr" : /\bmeiryo\b|\byu\s*(gothic|mincho)\b|yugothic|yumincho|hiragino|\bms\s*(gothic|mincho|pgothic|pmincho|ui\s*gothic)\b|\bms[pg]?(gothic|mincho)\b|ipa(ex)?(gothic|mincho)|noto\s+(sans|serif)\s+jp|游ゴシック|游明朝|ＭＳ|メイリオ|ヒラギノ/.test(t) || /游ゴシック|游明朝|ＭＳ ゴシック|ＭＳ 明朝|ＭＳ Ｐゴシック|メイリオ|ヒラギノ/.test(e) ? "jp" : null;
}
function De(e) {
	if (!e) return "sans";
	let t = e.toLowerCase();
	return /mono|courier|consolas|等幅|gothic_m/.test(t) ? "mono" : /roman|times|cambria|caladea|georgia|garamond|century(?!\s*gothic)|palatino|antiqua|didot|bodoni|playfair|source serif|noto serif|min\s*cho|明朝体|明朝|song|sung|simsun|nsimsun|batang|gungsuh|ming\s*liu|mingliu|pmingliu|fang\s*song|fangsong|kai\s*ti|kaiti|simkai|simfang|stsong|stkaiti|stfangsong|stzhongsong|新細明|細明|宋体|楷体|楷體|仿宋|標楷|游明朝|ＭＳ 明朝|ms mincho|yu mincho|hiragino mincho|ヒラギノ明朝/.test(t) || /新細明體|細明體|宋体|明朝|楷体|楷體|仿宋|標楷體|游明朝|ＭＳ 明朝/.test(e) ? "serif" : "sans";
}
function Oe(e, t) {
	let n = t === "serif" ? "Noto Serif" : "Noto Sans", r = {
		jp: [
			"jp",
			"sc",
			"tc",
			"kr"
		],
		sc: [
			"sc",
			"tc",
			"jp",
			"kr"
		],
		tc: [
			"tc",
			"sc",
			"jp",
			"kr"
		],
		kr: [
			"kr",
			"jp",
			"sc",
			"tc"
		]
	}, i = {
		kr: "KR",
		sc: "SC",
		tc: "TC",
		jp: "JP"
	};
	return r[e].map((e) => `${n} ${i[e]}`);
}
var ke = [
	"Noto Sans",
	"Noto Sans Hebrew",
	"Noto Sans Thai",
	"Noto Sans Devanagari"
], Ae = ["Noto Serif", "Noto Serif Hebrew"], E = (e) => `https://fonts.googleapis.com/css2?family=${e}:wght@400;700&display=swap`, je = {
	"noto sans kr": { url: E("Noto+Sans+KR") },
	"noto sans sc": { url: E("Noto+Sans+SC") },
	"noto sans tc": { url: E("Noto+Sans+TC") },
	"noto sans jp": { url: E("Noto+Sans+JP") },
	"noto serif kr": { url: E("Noto+Serif+KR") },
	"noto serif sc": { url: E("Noto+Serif+SC") },
	"noto serif tc": { url: E("Noto+Serif+TC") },
	"noto serif jp": { url: E("Noto+Serif+JP") },
	"noto sans": { url: E("Noto+Sans") },
	"noto serif": { url: E("Noto+Serif") },
	"noto sans devanagari": { url: E("Noto+Sans+Devanagari") },
	"noto sans thai": { url: E("Noto+Sans+Thai") },
	"noto sans hebrew": { url: E("Noto+Sans+Hebrew") },
	"noto serif hebrew": { url: E("Noto+Serif+Hebrew") }
}, Me = class e {
	hasHan = !1;
	hasHangul = !1;
	hasKana = !1;
	hasArabic = !1;
	hasThai = !1;
	hasHebrew = !1;
	hasDevanagari = !1;
	hasCyrGreek = !1;
	constructor(e) {
		this.cjkLang = e;
	}
	clone() {
		let t = new e(this.cjkLang);
		return t.hasHan = this.hasHan, t.hasHangul = this.hasHangul, t.hasKana = this.hasKana, t.hasArabic = this.hasArabic, t.hasThai = this.hasThai, t.hasHebrew = this.hasHebrew, t.hasDevanagari = this.hasDevanagari, t.hasCyrGreek = this.hasCyrGreek, t;
	}
	addText(e) {
		let t = () => this.hasHan && this.hasHangul && this.hasKana && this.hasArabic && this.hasThai && this.hasHebrew && this.hasDevanagari && this.hasCyrGreek;
		outer: for (let n of e) if (n) for (let e of n) {
			let n = e.codePointAt(0);
			if (n !== void 0 && !(n <= 591) && (n >= 4352 && n <= 4607 || n >= 12592 && n <= 12687 || n >= 44032 && n <= 55215 ? this.hasHangul = !0 : n >= 12352 && n <= 12543 ? this.hasKana = !0 : n >= 13312 && n <= 19903 || n >= 19968 && n <= 40959 || n >= 63744 && n <= 64255 || n >= 131072 && n <= 195103 ? this.hasHan = !0 : n >= 1536 && n <= 1791 || n >= 1872 && n <= 1919 || n >= 2208 && n <= 2303 || n >= 64336 && n <= 65023 || n >= 65136 && n <= 65279 ? this.hasArabic = !0 : n >= 3584 && n <= 3711 ? this.hasThai = !0 : n >= 1424 && n <= 1535 || n >= 64285 && n <= 64335 ? this.hasHebrew = !0 : n >= 2304 && n <= 2431 ? this.hasDevanagari = !0 : (n >= 1024 && n <= 1279 || n >= 880 && n <= 1023) && (this.hasCyrGreek = !0), t())) break outer;
		}
	}
	names() {
		let e = [], t = /* @__PURE__ */ new Set();
		this.hasHangul && t.add("kr"), this.hasKana && t.add("jp"), this.hasHan && t.size === 0 && t.add(this.cjkLang ?? "jp");
		for (let n of [
			"kr",
			"sc",
			"tc",
			"jp"
		]) if (t.has(n)) {
			let t = {
				kr: "KR",
				sc: "SC",
				tc: "TC",
				jp: "JP"
			}[n];
			e.push(`Noto Sans ${t}`, `Noto Serif ${t}`);
		}
		return this.hasCyrGreek && e.push("Noto Sans", "Noto Serif"), this.hasArabic && e.push("Noto Naskh Arabic", "Noto Sans Arabic"), this.hasThai && e.push("Noto Sans Thai"), this.hasHebrew && e.push("Noto Sans Hebrew", "Noto Serif Hebrew"), this.hasDevanagari && e.push("Noto Sans Devanagari"), e;
	}
};
function Ne(e, t) {
	let n = new Me(t);
	return n.addText(e), n.names();
}
var Pe = {
	accentbordercallout1: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 112500"],
			["adj4", "val -38333"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"t"
					],
					["c"],
					[
						"l",
						"x1",
						"b"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [[
					"m",
					"x1",
					"y1"
				], [
					"l",
					"x2",
					"y2"
				]]
			}
		]
	},
	accentbordercallout2: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 18750"],
			["adj4", "val -16667"],
			["adj5", "val 112500"],
			["adj6", "val -46667"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"],
			["y3", "*/ h adj5 100000"],
			["x3", "*/ w adj6 100000"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"t"
					],
					["c"],
					[
						"l",
						"x1",
						"b"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"y1"
					],
					[
						"l",
						"x2",
						"y2"
					],
					[
						"l",
						"x3",
						"y3"
					]
				]
			}
		]
	},
	accentbordercallout3: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 18750"],
			["adj4", "val -16667"],
			["adj5", "val 100000"],
			["adj6", "val -16667"],
			["adj7", "val 112963"],
			["adj8", "val -8333"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"],
			["y3", "*/ h adj5 100000"],
			["x3", "*/ w adj6 100000"],
			["y4", "*/ h adj7 100000"],
			["x4", "*/ w adj8 100000"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"t"
					],
					["c"],
					[
						"l",
						"x1",
						"b"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"y1"
					],
					[
						"l",
						"x2",
						"y2"
					],
					[
						"l",
						"x3",
						"y3"
					],
					[
						"l",
						"x4",
						"y4"
					]
				]
			}
		]
	},
	accentcallout1: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 112500"],
			["adj4", "val -38333"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"t"
					],
					["c"],
					[
						"l",
						"x1",
						"b"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [[
					"m",
					"x1",
					"y1"
				], [
					"l",
					"x2",
					"y2"
				]]
			}
		]
	},
	accentcallout2: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 18750"],
			["adj4", "val -16667"],
			["adj5", "val 112500"],
			["adj6", "val -46667"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"],
			["y3", "*/ h adj5 100000"],
			["x3", "*/ w adj6 100000"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"t"
					],
					["c"],
					[
						"l",
						"x1",
						"b"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"y1"
					],
					[
						"l",
						"x2",
						"y2"
					],
					[
						"l",
						"x3",
						"y3"
					]
				]
			}
		]
	},
	accentcallout3: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 18750"],
			["adj4", "val -16667"],
			["adj5", "val 100000"],
			["adj6", "val -16667"],
			["adj7", "val 112963"],
			["adj8", "val -8333"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"],
			["y3", "*/ h adj5 100000"],
			["x3", "*/ w adj6 100000"],
			["y4", "*/ h adj7 100000"],
			["x4", "*/ w adj8 100000"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"t"
					],
					["c"],
					[
						"l",
						"x1",
						"b"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"y1"
					],
					[
						"l",
						"x2",
						"y2"
					],
					[
						"l",
						"x3",
						"y3"
					],
					[
						"l",
						"x4",
						"y4"
					]
				]
			}
		]
	},
	actionbuttonbackprevious: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g10", "+- vc dx2 0"],
			["g11", "+- hc 0 dx2"],
			["g12", "+- hc dx2 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"g11",
						"vc"
					],
					[
						"l",
						"g12",
						"g9"
					],
					[
						"l",
						"g12",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g11",
						"vc"
					],
					[
						"l",
						"g12",
						"g9"
					],
					[
						"l",
						"g12",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g11",
						"vc"
					],
					[
						"l",
						"g12",
						"g9"
					],
					[
						"l",
						"g12",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttonbeginning: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g10", "+- vc dx2 0"],
			["g11", "+- hc 0 dx2"],
			["g12", "+- hc dx2 0"],
			["g13", "*/ ss 3 4"],
			["g14", "*/ g13 1 8"],
			["g15", "*/ g13 1 4"],
			["g16", "+- g11 g14 0"],
			["g17", "+- g11 g15 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"g17",
						"vc"
					],
					[
						"l",
						"g12",
						"g9"
					],
					[
						"l",
						"g12",
						"g10"
					],
					["c"],
					[
						"m",
						"g16",
						"g9"
					],
					[
						"l",
						"g11",
						"g9"
					],
					[
						"l",
						"g11",
						"g10"
					],
					[
						"l",
						"g16",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g17",
						"vc"
					],
					[
						"l",
						"g12",
						"g9"
					],
					[
						"l",
						"g12",
						"g10"
					],
					["c"],
					[
						"m",
						"g16",
						"g9"
					],
					[
						"l",
						"g11",
						"g9"
					],
					[
						"l",
						"g11",
						"g10"
					],
					[
						"l",
						"g16",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g17",
						"vc"
					],
					[
						"l",
						"g12",
						"g9"
					],
					[
						"l",
						"g12",
						"g10"
					],
					["c"],
					[
						"m",
						"g16",
						"g9"
					],
					[
						"l",
						"g16",
						"g10"
					],
					[
						"l",
						"g11",
						"g10"
					],
					[
						"l",
						"g11",
						"g9"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttonblank: {
		adj: [],
		gd: [],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	actionbuttondocument: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g10", "+- vc dx2 0"],
			["dx1", "*/ ss 9 32"],
			["g11", "+- hc 0 dx1"],
			["g12", "+- hc dx1 0"],
			["g13", "*/ ss 3 16"],
			["g14", "+- g12 0 g13"],
			["g15", "+- g9 g13 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"g11",
						"g9"
					],
					[
						"l",
						"g14",
						"g9"
					],
					[
						"l",
						"g12",
						"g15"
					],
					[
						"l",
						"g12",
						"g10"
					],
					[
						"l",
						"g11",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g11",
						"g9"
					],
					[
						"l",
						"g14",
						"g9"
					],
					[
						"l",
						"g14",
						"g15"
					],
					[
						"l",
						"g12",
						"g15"
					],
					[
						"l",
						"g12",
						"g10"
					],
					[
						"l",
						"g11",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g14",
						"g9"
					],
					[
						"l",
						"g14",
						"g15"
					],
					[
						"l",
						"g12",
						"g15"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g11",
						"g9"
					],
					[
						"l",
						"g14",
						"g9"
					],
					[
						"l",
						"g12",
						"g15"
					],
					[
						"l",
						"g12",
						"g10"
					],
					[
						"l",
						"g11",
						"g10"
					],
					["c"],
					[
						"m",
						"g12",
						"g15"
					],
					[
						"l",
						"g14",
						"g15"
					],
					[
						"l",
						"g14",
						"g9"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttonend: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g10", "+- vc dx2 0"],
			["g11", "+- hc 0 dx2"],
			["g12", "+- hc dx2 0"],
			["g13", "*/ ss 3 4"],
			["g14", "*/ g13 3 4"],
			["g15", "*/ g13 7 8"],
			["g16", "+- g11 g14 0"],
			["g17", "+- g11 g15 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"g16",
						"vc"
					],
					[
						"l",
						"g11",
						"g9"
					],
					[
						"l",
						"g11",
						"g10"
					],
					["c"],
					[
						"m",
						"g17",
						"g9"
					],
					[
						"l",
						"g12",
						"g9"
					],
					[
						"l",
						"g12",
						"g10"
					],
					[
						"l",
						"g17",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g16",
						"vc"
					],
					[
						"l",
						"g11",
						"g9"
					],
					[
						"l",
						"g11",
						"g10"
					],
					["c"],
					[
						"m",
						"g17",
						"g9"
					],
					[
						"l",
						"g12",
						"g9"
					],
					[
						"l",
						"g12",
						"g10"
					],
					[
						"l",
						"g17",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g16",
						"vc"
					],
					[
						"l",
						"g11",
						"g10"
					],
					[
						"l",
						"g11",
						"g9"
					],
					["c"],
					[
						"m",
						"g17",
						"g9"
					],
					[
						"l",
						"g12",
						"g9"
					],
					[
						"l",
						"g12",
						"g10"
					],
					[
						"l",
						"g17",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttonforwardnext: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g10", "+- vc dx2 0"],
			["g11", "+- hc 0 dx2"],
			["g12", "+- hc dx2 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"g12",
						"vc"
					],
					[
						"l",
						"g11",
						"g9"
					],
					[
						"l",
						"g11",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g12",
						"vc"
					],
					[
						"l",
						"g11",
						"g9"
					],
					[
						"l",
						"g11",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g12",
						"vc"
					],
					[
						"l",
						"g11",
						"g10"
					],
					[
						"l",
						"g11",
						"g9"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttonhelp: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g11", "+- hc 0 dx2"],
			["g13", "*/ ss 3 4"],
			["g14", "*/ g13 1 7"],
			["g15", "*/ g13 3 14"],
			["g16", "*/ g13 2 7"],
			["g19", "*/ g13 3 7"],
			["g20", "*/ g13 4 7"],
			["g21", "*/ g13 17 28"],
			["g23", "*/ g13 21 28"],
			["g24", "*/ g13 11 14"],
			["g27", "+- g9 g16 0"],
			["g29", "+- g9 g21 0"],
			["g30", "+- g9 g23 0"],
			["g31", "+- g9 g24 0"],
			["g33", "+- g11 g15 0"],
			["g36", "+- g11 g19 0"],
			["g37", "+- g11 g20 0"],
			["g41", "*/ g13 1 14"],
			["g42", "*/ g13 3 28"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"g33",
						"g27"
					],
					[
						"a",
						"g16",
						"g16",
						"cd2",
						"cd2"
					],
					[
						"a",
						"g14",
						"g15",
						"0",
						"cd4"
					],
					[
						"a",
						"g41",
						"g42",
						"3cd4",
						"-5400000"
					],
					[
						"l",
						"g37",
						"g30"
					],
					[
						"l",
						"g36",
						"g30"
					],
					[
						"l",
						"g36",
						"g29"
					],
					[
						"a",
						"g14",
						"g15",
						"cd2",
						"cd4"
					],
					[
						"a",
						"g41",
						"g42",
						"cd4",
						"-5400000"
					],
					[
						"a",
						"g14",
						"g14",
						"0",
						"-10800000"
					],
					["c"],
					[
						"m",
						"hc",
						"g31"
					],
					[
						"a",
						"g42",
						"g42",
						"3cd4",
						"21600000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g33",
						"g27"
					],
					[
						"a",
						"g16",
						"g16",
						"cd2",
						"cd2"
					],
					[
						"a",
						"g14",
						"g15",
						"0",
						"cd4"
					],
					[
						"a",
						"g41",
						"g42",
						"3cd4",
						"-5400000"
					],
					[
						"l",
						"g37",
						"g30"
					],
					[
						"l",
						"g36",
						"g30"
					],
					[
						"l",
						"g36",
						"g29"
					],
					[
						"a",
						"g14",
						"g15",
						"cd2",
						"cd4"
					],
					[
						"a",
						"g41",
						"g42",
						"cd4",
						"-5400000"
					],
					[
						"a",
						"g14",
						"g14",
						"0",
						"-10800000"
					],
					["c"],
					[
						"m",
						"hc",
						"g31"
					],
					[
						"a",
						"g42",
						"g42",
						"3cd4",
						"21600000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g33",
						"g27"
					],
					[
						"a",
						"g16",
						"g16",
						"cd2",
						"cd2"
					],
					[
						"a",
						"g14",
						"g15",
						"0",
						"cd4"
					],
					[
						"a",
						"g41",
						"g42",
						"3cd4",
						"-5400000"
					],
					[
						"l",
						"g37",
						"g30"
					],
					[
						"l",
						"g36",
						"g30"
					],
					[
						"l",
						"g36",
						"g29"
					],
					[
						"a",
						"g14",
						"g15",
						"cd2",
						"cd4"
					],
					[
						"a",
						"g41",
						"g42",
						"cd4",
						"-5400000"
					],
					[
						"a",
						"g14",
						"g14",
						"0",
						"-10800000"
					],
					["c"],
					[
						"m",
						"hc",
						"g31"
					],
					[
						"a",
						"g42",
						"g42",
						"3cd4",
						"21600000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttonhome: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g10", "+- vc dx2 0"],
			["g11", "+- hc 0 dx2"],
			["g12", "+- hc dx2 0"],
			["g13", "*/ ss 3 4"],
			["g14", "*/ g13 1 16"],
			["g15", "*/ g13 1 8"],
			["g16", "*/ g13 3 16"],
			["g17", "*/ g13 5 16"],
			["g18", "*/ g13 7 16"],
			["g19", "*/ g13 9 16"],
			["g20", "*/ g13 11 16"],
			["g21", "*/ g13 3 4"],
			["g22", "*/ g13 13 16"],
			["g23", "*/ g13 7 8"],
			["g24", "+- g9 g14 0"],
			["g25", "+- g9 g16 0"],
			["g26", "+- g9 g17 0"],
			["g27", "+- g9 g21 0"],
			["g28", "+- g11 g15 0"],
			["g29", "+- g11 g18 0"],
			["g30", "+- g11 g19 0"],
			["g31", "+- g11 g20 0"],
			["g32", "+- g11 g22 0"],
			["g33", "+- g11 g23 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"hc",
						"g9"
					],
					[
						"l",
						"g11",
						"vc"
					],
					[
						"l",
						"g28",
						"vc"
					],
					[
						"l",
						"g28",
						"g10"
					],
					[
						"l",
						"g33",
						"g10"
					],
					[
						"l",
						"g33",
						"vc"
					],
					[
						"l",
						"g12",
						"vc"
					],
					[
						"l",
						"g32",
						"g26"
					],
					[
						"l",
						"g32",
						"g24"
					],
					[
						"l",
						"g31",
						"g24"
					],
					[
						"l",
						"g31",
						"g25"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g32",
						"g26"
					],
					[
						"l",
						"g32",
						"g24"
					],
					[
						"l",
						"g31",
						"g24"
					],
					[
						"l",
						"g31",
						"g25"
					],
					["c"],
					[
						"m",
						"g28",
						"vc"
					],
					[
						"l",
						"g28",
						"g10"
					],
					[
						"l",
						"g29",
						"g10"
					],
					[
						"l",
						"g29",
						"g27"
					],
					[
						"l",
						"g30",
						"g27"
					],
					[
						"l",
						"g30",
						"g10"
					],
					[
						"l",
						"g33",
						"g10"
					],
					[
						"l",
						"g33",
						"vc"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"hc",
						"g9"
					],
					[
						"l",
						"g11",
						"vc"
					],
					[
						"l",
						"g12",
						"vc"
					],
					["c"],
					[
						"m",
						"g29",
						"g27"
					],
					[
						"l",
						"g30",
						"g27"
					],
					[
						"l",
						"g30",
						"g10"
					],
					[
						"l",
						"g29",
						"g10"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"hc",
						"g9"
					],
					[
						"l",
						"g31",
						"g25"
					],
					[
						"l",
						"g31",
						"g24"
					],
					[
						"l",
						"g32",
						"g24"
					],
					[
						"l",
						"g32",
						"g26"
					],
					[
						"l",
						"g12",
						"vc"
					],
					[
						"l",
						"g33",
						"vc"
					],
					[
						"l",
						"g33",
						"g10"
					],
					[
						"l",
						"g28",
						"g10"
					],
					[
						"l",
						"g28",
						"vc"
					],
					[
						"l",
						"g11",
						"vc"
					],
					["c"],
					[
						"m",
						"g31",
						"g25"
					],
					[
						"l",
						"g32",
						"g26"
					],
					[
						"m",
						"g33",
						"vc"
					],
					[
						"l",
						"g28",
						"vc"
					],
					[
						"m",
						"g29",
						"g10"
					],
					[
						"l",
						"g29",
						"g27"
					],
					[
						"l",
						"g30",
						"g27"
					],
					[
						"l",
						"g30",
						"g10"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttoninformation: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g11", "+- hc 0 dx2"],
			["g13", "*/ ss 3 4"],
			["g14", "*/ g13 1 32"],
			["g17", "*/ g13 5 16"],
			["g18", "*/ g13 3 8"],
			["g19", "*/ g13 13 32"],
			["g20", "*/ g13 19 32"],
			["g22", "*/ g13 11 16"],
			["g23", "*/ g13 13 16"],
			["g24", "*/ g13 7 8"],
			["g25", "+- g9 g14 0"],
			["g28", "+- g9 g17 0"],
			["g29", "+- g9 g18 0"],
			["g30", "+- g9 g23 0"],
			["g31", "+- g9 g24 0"],
			["g32", "+- g11 g17 0"],
			["g34", "+- g11 g19 0"],
			["g35", "+- g11 g20 0"],
			["g37", "+- g11 g22 0"],
			["g38", "*/ g13 3 32"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"hc",
						"g9"
					],
					[
						"a",
						"dx2",
						"dx2",
						"3cd4",
						"21600000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"hc",
						"g9"
					],
					[
						"a",
						"dx2",
						"dx2",
						"3cd4",
						"21600000"
					],
					["c"],
					[
						"m",
						"hc",
						"g25"
					],
					[
						"a",
						"g38",
						"g38",
						"3cd4",
						"21600000"
					],
					[
						"m",
						"g32",
						"g28"
					],
					[
						"l",
						"g32",
						"g29"
					],
					[
						"l",
						"g34",
						"g29"
					],
					[
						"l",
						"g34",
						"g30"
					],
					[
						"l",
						"g32",
						"g30"
					],
					[
						"l",
						"g32",
						"g31"
					],
					[
						"l",
						"g37",
						"g31"
					],
					[
						"l",
						"g37",
						"g30"
					],
					[
						"l",
						"g35",
						"g30"
					],
					[
						"l",
						"g35",
						"g28"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "lighten",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"hc",
						"g25"
					],
					[
						"a",
						"g38",
						"g38",
						"3cd4",
						"21600000"
					],
					[
						"m",
						"g32",
						"g28"
					],
					[
						"l",
						"g35",
						"g28"
					],
					[
						"l",
						"g35",
						"g30"
					],
					[
						"l",
						"g37",
						"g30"
					],
					[
						"l",
						"g37",
						"g31"
					],
					[
						"l",
						"g32",
						"g31"
					],
					[
						"l",
						"g32",
						"g30"
					],
					[
						"l",
						"g34",
						"g30"
					],
					[
						"l",
						"g34",
						"g29"
					],
					[
						"l",
						"g32",
						"g29"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"hc",
						"g9"
					],
					[
						"a",
						"dx2",
						"dx2",
						"3cd4",
						"21600000"
					],
					["c"],
					[
						"m",
						"hc",
						"g25"
					],
					[
						"a",
						"g38",
						"g38",
						"3cd4",
						"21600000"
					],
					[
						"m",
						"g32",
						"g28"
					],
					[
						"l",
						"g35",
						"g28"
					],
					[
						"l",
						"g35",
						"g30"
					],
					[
						"l",
						"g37",
						"g30"
					],
					[
						"l",
						"g37",
						"g31"
					],
					[
						"l",
						"g32",
						"g31"
					],
					[
						"l",
						"g32",
						"g30"
					],
					[
						"l",
						"g34",
						"g30"
					],
					[
						"l",
						"g34",
						"g29"
					],
					[
						"l",
						"g32",
						"g29"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttonmovie: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g10", "+- vc dx2 0"],
			["g11", "+- hc 0 dx2"],
			["g12", "+- hc dx2 0"],
			["g13", "*/ ss 3 4"],
			["g14", "*/ g13 1455 21600"],
			["g15", "*/ g13 1905 21600"],
			["g16", "*/ g13 2325 21600"],
			["g17", "*/ g13 16155 21600"],
			["g18", "*/ g13 17010 21600"],
			["g19", "*/ g13 19335 21600"],
			["g20", "*/ g13 19725 21600"],
			["g21", "*/ g13 20595 21600"],
			["g22", "*/ g13 5280 21600"],
			["g23", "*/ g13 5730 21600"],
			["g24", "*/ g13 6630 21600"],
			["g25", "*/ g13 7492 21600"],
			["g26", "*/ g13 9067 21600"],
			["g27", "*/ g13 9555 21600"],
			["g28", "*/ g13 13342 21600"],
			["g29", "*/ g13 14580 21600"],
			["g30", "*/ g13 15592 21600"],
			["g31", "+- g11 g14 0"],
			["g32", "+- g11 g15 0"],
			["g33", "+- g11 g16 0"],
			["g34", "+- g11 g17 0"],
			["g35", "+- g11 g18 0"],
			["g36", "+- g11 g19 0"],
			["g37", "+- g11 g20 0"],
			["g38", "+- g11 g21 0"],
			["g39", "+- g9 g22 0"],
			["g40", "+- g9 g23 0"],
			["g41", "+- g9 g24 0"],
			["g42", "+- g9 g25 0"],
			["g43", "+- g9 g26 0"],
			["g44", "+- g9 g27 0"],
			["g45", "+- g9 g28 0"],
			["g46", "+- g9 g29 0"],
			["g47", "+- g9 g30 0"],
			["g48", "+- g9 g31 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"g11",
						"g39"
					],
					[
						"l",
						"g11",
						"g44"
					],
					[
						"l",
						"g31",
						"g44"
					],
					[
						"l",
						"g32",
						"g43"
					],
					[
						"l",
						"g33",
						"g43"
					],
					[
						"l",
						"g33",
						"g47"
					],
					[
						"l",
						"g35",
						"g47"
					],
					[
						"l",
						"g35",
						"g45"
					],
					[
						"l",
						"g36",
						"g45"
					],
					[
						"l",
						"g38",
						"g46"
					],
					[
						"l",
						"g12",
						"g46"
					],
					[
						"l",
						"g12",
						"g41"
					],
					[
						"l",
						"g38",
						"g41"
					],
					[
						"l",
						"g37",
						"g42"
					],
					[
						"l",
						"g35",
						"g42"
					],
					[
						"l",
						"g35",
						"g41"
					],
					[
						"l",
						"g34",
						"g40"
					],
					[
						"l",
						"g32",
						"g40"
					],
					[
						"l",
						"g31",
						"g39"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g11",
						"g39"
					],
					[
						"l",
						"g11",
						"g44"
					],
					[
						"l",
						"g31",
						"g44"
					],
					[
						"l",
						"g32",
						"g43"
					],
					[
						"l",
						"g33",
						"g43"
					],
					[
						"l",
						"g33",
						"g47"
					],
					[
						"l",
						"g35",
						"g47"
					],
					[
						"l",
						"g35",
						"g45"
					],
					[
						"l",
						"g36",
						"g45"
					],
					[
						"l",
						"g38",
						"g46"
					],
					[
						"l",
						"g12",
						"g46"
					],
					[
						"l",
						"g12",
						"g41"
					],
					[
						"l",
						"g38",
						"g41"
					],
					[
						"l",
						"g37",
						"g42"
					],
					[
						"l",
						"g35",
						"g42"
					],
					[
						"l",
						"g35",
						"g41"
					],
					[
						"l",
						"g34",
						"g40"
					],
					[
						"l",
						"g32",
						"g40"
					],
					[
						"l",
						"g31",
						"g39"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g11",
						"g39"
					],
					[
						"l",
						"g31",
						"g39"
					],
					[
						"l",
						"g32",
						"g40"
					],
					[
						"l",
						"g34",
						"g40"
					],
					[
						"l",
						"g35",
						"g41"
					],
					[
						"l",
						"g35",
						"g42"
					],
					[
						"l",
						"g37",
						"g42"
					],
					[
						"l",
						"g38",
						"g41"
					],
					[
						"l",
						"g12",
						"g41"
					],
					[
						"l",
						"g12",
						"g46"
					],
					[
						"l",
						"g38",
						"g46"
					],
					[
						"l",
						"g36",
						"g45"
					],
					[
						"l",
						"g35",
						"g45"
					],
					[
						"l",
						"g35",
						"g47"
					],
					[
						"l",
						"g33",
						"g47"
					],
					[
						"l",
						"g33",
						"g43"
					],
					[
						"l",
						"g32",
						"g43"
					],
					[
						"l",
						"g31",
						"g44"
					],
					[
						"l",
						"g11",
						"g44"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttonreturn: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g10", "+- vc dx2 0"],
			["g11", "+- hc 0 dx2"],
			["g12", "+- hc dx2 0"],
			["g13", "*/ ss 3 4"],
			["g14", "*/ g13 7 8"],
			["g15", "*/ g13 3 4"],
			["g16", "*/ g13 5 8"],
			["g17", "*/ g13 3 8"],
			["g18", "*/ g13 1 4"],
			["g19", "+- g9 g15 0"],
			["g20", "+- g9 g16 0"],
			["g21", "+- g9 g18 0"],
			["g22", "+- g11 g14 0"],
			["g23", "+- g11 g15 0"],
			["g24", "+- g11 g16 0"],
			["g25", "+- g11 g17 0"],
			["g26", "+- g11 g18 0"],
			["g27", "*/ g13 1 8"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"g12",
						"g21"
					],
					[
						"l",
						"g23",
						"g9"
					],
					[
						"l",
						"hc",
						"g21"
					],
					[
						"l",
						"g24",
						"g21"
					],
					[
						"l",
						"g24",
						"g20"
					],
					[
						"a",
						"g27",
						"g27",
						"0",
						"cd4"
					],
					[
						"l",
						"g25",
						"g19"
					],
					[
						"a",
						"g27",
						"g27",
						"cd4",
						"cd4"
					],
					[
						"l",
						"g26",
						"g21"
					],
					[
						"l",
						"g11",
						"g21"
					],
					[
						"l",
						"g11",
						"g20"
					],
					[
						"a",
						"g17",
						"g17",
						"cd2",
						"-5400000"
					],
					[
						"l",
						"hc",
						"g10"
					],
					[
						"a",
						"g17",
						"g17",
						"cd4",
						"-5400000"
					],
					[
						"l",
						"g22",
						"g21"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g12",
						"g21"
					],
					[
						"l",
						"g23",
						"g9"
					],
					[
						"l",
						"hc",
						"g21"
					],
					[
						"l",
						"g24",
						"g21"
					],
					[
						"l",
						"g24",
						"g20"
					],
					[
						"a",
						"g27",
						"g27",
						"0",
						"cd4"
					],
					[
						"l",
						"g25",
						"g19"
					],
					[
						"a",
						"g27",
						"g27",
						"cd4",
						"cd4"
					],
					[
						"l",
						"g26",
						"g21"
					],
					[
						"l",
						"g11",
						"g21"
					],
					[
						"l",
						"g11",
						"g20"
					],
					[
						"a",
						"g17",
						"g17",
						"cd2",
						"-5400000"
					],
					[
						"l",
						"hc",
						"g10"
					],
					[
						"a",
						"g17",
						"g17",
						"cd4",
						"-5400000"
					],
					[
						"l",
						"g22",
						"g21"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g12",
						"g21"
					],
					[
						"l",
						"g22",
						"g21"
					],
					[
						"l",
						"g22",
						"g20"
					],
					[
						"a",
						"g17",
						"g17",
						"0",
						"cd4"
					],
					[
						"l",
						"g25",
						"g10"
					],
					[
						"a",
						"g17",
						"g17",
						"cd4",
						"cd4"
					],
					[
						"l",
						"g11",
						"g21"
					],
					[
						"l",
						"g26",
						"g21"
					],
					[
						"l",
						"g26",
						"g20"
					],
					[
						"a",
						"g27",
						"g27",
						"cd2",
						"-5400000"
					],
					[
						"l",
						"hc",
						"g19"
					],
					[
						"a",
						"g27",
						"g27",
						"cd4",
						"-5400000"
					],
					[
						"l",
						"g24",
						"g21"
					],
					[
						"l",
						"hc",
						"g21"
					],
					[
						"l",
						"g23",
						"g9"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	actionbuttonsound: {
		adj: [],
		gd: [
			["dx2", "*/ ss 3 8"],
			["g9", "+- vc 0 dx2"],
			["g10", "+- vc dx2 0"],
			["g11", "+- hc 0 dx2"],
			["g12", "+- hc dx2 0"],
			["g13", "*/ ss 3 4"],
			["g14", "*/ g13 1 8"],
			["g15", "*/ g13 5 16"],
			["g16", "*/ g13 5 8"],
			["g17", "*/ g13 11 16"],
			["g18", "*/ g13 3 4"],
			["g19", "*/ g13 7 8"],
			["g20", "+- g9 g14 0"],
			["g21", "+- g9 g15 0"],
			["g22", "+- g9 g17 0"],
			["g23", "+- g9 g19 0"],
			["g24", "+- g11 g15 0"],
			["g25", "+- g11 g16 0"],
			["g26", "+- g11 g18 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"g11",
						"g21"
					],
					[
						"l",
						"g11",
						"g22"
					],
					[
						"l",
						"g24",
						"g22"
					],
					[
						"l",
						"g25",
						"g10"
					],
					[
						"l",
						"g25",
						"g9"
					],
					[
						"l",
						"g24",
						"g21"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g11",
						"g21"
					],
					[
						"l",
						"g11",
						"g22"
					],
					[
						"l",
						"g24",
						"g22"
					],
					[
						"l",
						"g25",
						"g10"
					],
					[
						"l",
						"g25",
						"g9"
					],
					[
						"l",
						"g24",
						"g21"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"g11",
						"g21"
					],
					[
						"l",
						"g24",
						"g21"
					],
					[
						"l",
						"g25",
						"g9"
					],
					[
						"l",
						"g25",
						"g10"
					],
					[
						"l",
						"g24",
						"g22"
					],
					[
						"l",
						"g11",
						"g22"
					],
					["c"],
					[
						"m",
						"g26",
						"g21"
					],
					[
						"l",
						"g12",
						"g20"
					],
					[
						"m",
						"g26",
						"vc"
					],
					[
						"l",
						"g12",
						"vc"
					],
					[
						"m",
						"g26",
						"g22"
					],
					[
						"l",
						"g12",
						"g23"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			}
		]
	},
	arc: {
		adj: [["adj1", "val 16200000"], ["adj2", "val 0"]],
		gd: [
			["stAng", "pin 0 adj1 21599999"],
			["enAng", "pin 0 adj2 21599999"],
			["sw11", "+- enAng 0 stAng"],
			["sw12", "+- sw11 21600000 0"],
			["swAng", "?: sw11 sw11 sw12"],
			["wt1", "sin wd2 stAng"],
			["ht1", "cos hd2 stAng"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["wt2", "sin wd2 enAng"],
			["ht2", "cos hd2 enAng"],
			["dx2", "cat2 wd2 ht2 wt2"],
			["dy2", "sat2 hd2 ht2 wt2"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"],
			["sw0", "+- 21600000 0 stAng"],
			["da1", "+- swAng 0 sw0"],
			["g1", "max x1 x2"],
			["ir", "?: da1 r g1"],
			["sw1", "+- cd4 0 stAng"],
			["sw2", "+- 27000000 0 stAng"],
			["sw3", "?: sw1 sw1 sw2"],
			["da2", "+- swAng 0 sw3"],
			["g5", "max y1 y2"],
			["ib", "?: da2 b g5"],
			["sw4", "+- cd2 0 stAng"],
			["sw5", "+- 32400000 0 stAng"],
			["sw6", "?: sw4 sw4 sw5"],
			["da3", "+- swAng 0 sw6"],
			["g9", "min x1 x2"],
			["il", "?: da3 l g9"],
			["sw7", "+- 3cd4 0 stAng"],
			["sw8", "+- 37800000 0 stAng"],
			["sw9", "?: sw7 sw7 sw8"],
			["da4", "+- swAng 0 sw9"],
			["g13", "min y1 y2"],
			["it", "?: da4 t g13"],
			["cang1", "+- stAng 0 cd4"],
			["cang2", "+- enAng cd4 0"],
			["cang3", "+/ cang1 cang2 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"a",
					"wd2",
					"hd2",
					"stAng",
					"swAng"
				],
				[
					"l",
					"hc",
					"vc"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x1",
				"y1"
			], [
				"a",
				"wd2",
				"hd2",
				"stAng",
				"swAng"
			]]
		}]
	},
	bentarrow: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"],
			["adj4", "val 43750"]
		],
		gd: [
			["a2", "pin 0 adj2 50000"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["a3", "pin 0 adj3 50000"],
			["th", "*/ ss a1 100000"],
			["aw2", "*/ ss a2 100000"],
			["th2", "*/ th 1 2"],
			["dh2", "+- aw2 0 th2"],
			["ah", "*/ ss a3 100000"],
			["bw", "+- r 0 ah"],
			["bh", "+- b 0 dh2"],
			["bs", "min bw bh"],
			["maxAdj4", "*/ 100000 bs ss"],
			["a4", "pin 0 adj4 maxAdj4"],
			["bd", "*/ ss a4 100000"],
			["bd3", "+- bd 0 th"],
			["bd2", "max bd3 0"],
			["x3", "+- th bd2 0"],
			["x4", "+- r 0 ah"],
			["y3", "+- dh2 th 0"],
			["y4", "+- y3 dh2 0"],
			["y5", "+- dh2 bd 0"],
			["y6", "+- y3 bd2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"b"
				],
				[
					"l",
					"l",
					"y5"
				],
				[
					"a",
					"bd",
					"bd",
					"cd2",
					"cd4"
				],
				[
					"l",
					"x4",
					"dh2"
				],
				[
					"l",
					"x4",
					"t"
				],
				[
					"l",
					"r",
					"aw2"
				],
				[
					"l",
					"x4",
					"y4"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"a",
					"bd2",
					"bd2",
					"3cd4",
					"-5400000"
				],
				[
					"l",
					"th",
					"b"
				],
				["c"]
			]
		}]
	},
	bentconnector2: {
		adj: [],
		gd: [],
		paths: [{
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				]
			]
		}]
	},
	bentconnector3: {
		adj: [["adj1", "val 50000"]],
		gd: [["x1", "*/ w adj1 100000"]],
		paths: [{
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"l",
					"r",
					"b"
				]
			]
		}]
	},
	bentconnector4: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["x1", "*/ w adj1 100000"],
			["x2", "+/ x1 r 2"],
			["y2", "*/ h adj2 100000"],
			["y1", "+/ t y2 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"r",
					"b"
				]
			]
		}]
	},
	bentconnector5: {
		adj: [
			["adj1", "val 50000"],
			["adj2", "val 50000"],
			["adj3", "val 50000"]
		],
		gd: [
			["x1", "*/ w adj1 100000"],
			["x3", "*/ w adj3 100000"],
			["x2", "+/ x1 x3 2"],
			["y2", "*/ h adj2 100000"],
			["y1", "+/ t y2 2"],
			["y3", "+/ b y2 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"x3",
					"b"
				],
				[
					"l",
					"r",
					"b"
				]
			]
		}]
	},
	bentuparrow: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"]
		],
		gd: [
			["a1", "pin 0 adj1 50000"],
			["a2", "pin 0 adj2 50000"],
			["a3", "pin 0 adj3 50000"],
			["y1", "*/ ss a3 100000"],
			["dx1", "*/ ss a2 50000"],
			["x1", "+- r 0 dx1"],
			["dx3", "*/ ss a2 100000"],
			["x3", "+- r 0 dx3"],
			["dx2", "*/ ss a1 200000"],
			["x2", "+- x3 0 dx2"],
			["x4", "+- x3 dx2 0"],
			["dy2", "*/ ss a1 100000"],
			["y2", "+- b 0 dy2"],
			["x0", "*/ x4 1 2"],
			["y3", "+/ y2 b 2"],
			["y15", "+/ y1 b 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"x3",
					"t"
				],
				[
					"l",
					"r",
					"y1"
				],
				[
					"l",
					"x4",
					"y1"
				],
				[
					"l",
					"x4",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	bevel: {
		adj: [["adj", "val 12500"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["x1", "*/ ss a 100000"],
			["x2", "+- r 0 x1"],
			["y2", "+- b 0 x1"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"x1"
					],
					[
						"l",
						"x2",
						"x1"
					],
					[
						"l",
						"x2",
						"y2"
					],
					[
						"l",
						"x1",
						"y2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "lightenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"x2",
						"x1"
					],
					[
						"l",
						"x1",
						"x1"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"b"
					],
					[
						"l",
						"x1",
						"y2"
					],
					[
						"l",
						"x2",
						"y2"
					],
					[
						"l",
						"r",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "lighten",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"x1",
						"x1"
					],
					[
						"l",
						"x1",
						"y2"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darken",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"x2",
						"y2"
					],
					[
						"l",
						"x2",
						"x1"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"x1",
						"x1"
					],
					[
						"l",
						"x2",
						"x1"
					],
					[
						"l",
						"x2",
						"y2"
					],
					[
						"l",
						"x1",
						"y2"
					],
					["c"],
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"x1",
						"x1"
					],
					[
						"m",
						"l",
						"b"
					],
					[
						"l",
						"x1",
						"y2"
					],
					[
						"m",
						"r",
						"t"
					],
					[
						"l",
						"x2",
						"x1"
					],
					[
						"m",
						"r",
						"b"
					],
					[
						"l",
						"x2",
						"y2"
					]
				]
			}
		]
	},
	blockarc: {
		adj: [
			["adj1", "val 10800000"],
			["adj2", "val 0"],
			["adj3", "val 25000"]
		],
		gd: [
			["stAng", "pin 0 adj1 21599999"],
			["istAng", "pin 0 adj2 21599999"],
			["a3", "pin 0 adj3 50000"],
			["sw11", "+- istAng 0 stAng"],
			["sw12", "+- sw11 21600000 0"],
			["swAng", "?: sw11 sw11 sw12"],
			["iswAng", "+- 0 0 swAng"],
			["wt1", "sin wd2 stAng"],
			["ht1", "cos hd2 stAng"],
			["wt3", "sin wd2 istAng"],
			["ht3", "cos hd2 istAng"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["dx3", "cat2 wd2 ht3 wt3"],
			["dy3", "sat2 hd2 ht3 wt3"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["x3", "+- hc dx3 0"],
			["y3", "+- vc dy3 0"],
			["dr", "*/ ss a3 100000"],
			["iwd2", "+- wd2 0 dr"],
			["ihd2", "+- hd2 0 dr"],
			["wt2", "sin iwd2 istAng"],
			["ht2", "cos ihd2 istAng"],
			["wt4", "sin iwd2 stAng"],
			["ht4", "cos ihd2 stAng"],
			["dx2", "cat2 iwd2 ht2 wt2"],
			["dy2", "sat2 ihd2 ht2 wt2"],
			["dx4", "cat2 iwd2 ht4 wt4"],
			["dy4", "sat2 ihd2 ht4 wt4"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"],
			["x4", "+- hc dx4 0"],
			["y4", "+- vc dy4 0"],
			["sw0", "+- 21600000 0 stAng"],
			["da1", "+- swAng 0 sw0"],
			["g1", "max x1 x2"],
			["g2", "max x3 x4"],
			["g3", "max g1 g2"],
			["ir", "?: da1 r g3"],
			["sw1", "+- cd4 0 stAng"],
			["sw2", "+- 27000000 0 stAng"],
			["sw3", "?: sw1 sw1 sw2"],
			["da2", "+- swAng 0 sw3"],
			["g5", "max y1 y2"],
			["g6", "max y3 y4"],
			["g7", "max g5 g6"],
			["ib", "?: da2 b g7"],
			["sw4", "+- cd2 0 stAng"],
			["sw5", "+- 32400000 0 stAng"],
			["sw6", "?: sw4 sw4 sw5"],
			["da3", "+- swAng 0 sw6"],
			["g9", "min x1 x2"],
			["g10", "min x3 x4"],
			["g11", "min g9 g10"],
			["il", "?: da3 l g11"],
			["sw7", "+- 3cd4 0 stAng"],
			["sw8", "+- 37800000 0 stAng"],
			["sw9", "?: sw7 sw7 sw8"],
			["da4", "+- swAng 0 sw9"],
			["g13", "min y1 y2"],
			["g14", "min y3 y4"],
			["g15", "min g13 g14"],
			["it", "?: da4 t g15"],
			["x5", "+/ x1 x4 2"],
			["y5", "+/ y1 y4 2"],
			["x6", "+/ x3 x2 2"],
			["y6", "+/ y3 y2 2"],
			["cang1", "+- stAng 0 cd4"],
			["cang2", "+- istAng cd4 0"],
			["cang3", "+/ cang1 cang2 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"a",
					"wd2",
					"hd2",
					"stAng",
					"swAng"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"a",
					"iwd2",
					"ihd2",
					"istAng",
					"iswAng"
				],
				["c"]
			]
		}]
	},
	bordercallout1: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 112500"],
			["adj4", "val -38333"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [[
				"m",
				"x1",
				"y1"
			], [
				"l",
				"x2",
				"y2"
			]]
		}]
	},
	bordercallout2: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 18750"],
			["adj4", "val -16667"],
			["adj5", "val 112500"],
			["adj6", "val -46667"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"],
			["y3", "*/ h adj5 100000"],
			["x3", "*/ w adj6 100000"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x3",
					"y3"
				]
			]
		}]
	},
	bordercallout3: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 18750"],
			["adj4", "val -16667"],
			["adj5", "val 100000"],
			["adj6", "val -16667"],
			["adj7", "val 112963"],
			["adj8", "val -8333"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"],
			["y3", "*/ h adj5 100000"],
			["x3", "*/ w adj6 100000"],
			["y4", "*/ h adj7 100000"],
			["x4", "*/ w adj8 100000"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x4",
					"y4"
				]
			]
		}]
	},
	bracepair: {
		adj: [["adj", "val 8333"]],
		gd: [
			["a", "pin 0 adj 25000"],
			["x1", "*/ ss a 100000"],
			["x2", "*/ ss a 50000"],
			["x3", "+- r 0 x2"],
			["x4", "+- r 0 x1"],
			["y2", "+- vc 0 x1"],
			["y3", "+- vc x1 0"],
			["y4", "+- b 0 x1"],
			["it", "*/ x1 29289 100000"],
			["il", "+- x1 it 0"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 it"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"x2",
					"b"
				],
				[
					"a",
					"x1",
					"x1",
					"cd4",
					"cd4"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"a",
					"x1",
					"x1",
					"0",
					"-5400000"
				],
				[
					"a",
					"x1",
					"x1",
					"cd4",
					"-5400000"
				],
				[
					"l",
					"x1",
					"x1"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"cd4"
				],
				[
					"l",
					"x3",
					"t"
				],
				[
					"a",
					"x1",
					"x1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"x4",
					"y2"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"-5400000"
				],
				[
					"a",
					"x1",
					"x1",
					"3cd4",
					"-5400000"
				],
				[
					"l",
					"x4",
					"y4"
				],
				[
					"a",
					"x1",
					"x1",
					"0",
					"cd4"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x2",
					"b"
				],
				[
					"a",
					"x1",
					"x1",
					"cd4",
					"cd4"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"a",
					"x1",
					"x1",
					"0",
					"-5400000"
				],
				[
					"a",
					"x1",
					"x1",
					"cd4",
					"-5400000"
				],
				[
					"l",
					"x1",
					"x1"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"cd4"
				],
				[
					"m",
					"x3",
					"t"
				],
				[
					"a",
					"x1",
					"x1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"x4",
					"y2"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"-5400000"
				],
				[
					"a",
					"x1",
					"x1",
					"3cd4",
					"-5400000"
				],
				[
					"l",
					"x4",
					"y4"
				],
				[
					"a",
					"x1",
					"x1",
					"0",
					"cd4"
				]
			]
		}]
	},
	bracketpair: {
		adj: [["adj", "val 16667"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["x1", "*/ ss a 100000"],
			["x2", "+- r 0 x1"],
			["y2", "+- b 0 x1"],
			["il", "*/ x1 29289 100000"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"l",
					"x1"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"cd4"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"a",
					"x1",
					"x1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"a",
					"x1",
					"x1",
					"0",
					"cd4"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"a",
					"x1",
					"x1",
					"cd4",
					"cd4"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"b"
				],
				[
					"a",
					"x1",
					"x1",
					"cd4",
					"cd4"
				],
				[
					"l",
					"l",
					"x1"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"cd4"
				],
				[
					"m",
					"x2",
					"t"
				],
				[
					"a",
					"x1",
					"x1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"a",
					"x1",
					"x1",
					"0",
					"cd4"
				]
			]
		}]
	},
	callout1: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 112500"],
			["adj4", "val -38333"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [[
				"m",
				"x1",
				"y1"
			], [
				"l",
				"x2",
				"y2"
			]]
		}]
	},
	callout2: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 18750"],
			["adj4", "val -16667"],
			["adj5", "val 112500"],
			["adj6", "val -46667"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"],
			["y3", "*/ h adj5 100000"],
			["x3", "*/ w adj6 100000"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x3",
					"y3"
				]
			]
		}]
	},
	callout3: {
		adj: [
			["adj1", "val 18750"],
			["adj2", "val -8333"],
			["adj3", "val 18750"],
			["adj4", "val -16667"],
			["adj5", "val 100000"],
			["adj6", "val -16667"],
			["adj7", "val 112963"],
			["adj8", "val -8333"]
		],
		gd: [
			["y1", "*/ h adj1 100000"],
			["x1", "*/ w adj2 100000"],
			["y2", "*/ h adj3 100000"],
			["x2", "*/ w adj4 100000"],
			["y3", "*/ h adj5 100000"],
			["x3", "*/ w adj6 100000"],
			["y4", "*/ h adj7 100000"],
			["x4", "*/ w adj8 100000"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x4",
					"y4"
				]
			]
		}]
	},
	can: {
		adj: [["adj", "val 25000"]],
		gd: [
			["maxAdj", "*/ 50000 h ss"],
			["a", "pin 0 adj maxAdj"],
			["y1", "*/ ss a 200000"],
			["y2", "+- y1 y1 0"],
			["y3", "+- b 0 y1"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"y1"
					],
					[
						"a",
						"wd2",
						"y1",
						"cd2",
						"-10800000"
					],
					[
						"l",
						"r",
						"y3"
					],
					[
						"a",
						"wd2",
						"y1",
						"0",
						"cd2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "lighten",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"y1"
					],
					[
						"a",
						"wd2",
						"y1",
						"cd2",
						"cd2"
					],
					[
						"a",
						"wd2",
						"y1",
						"0",
						"cd2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"r",
						"y1"
					],
					[
						"a",
						"wd2",
						"y1",
						"0",
						"cd2"
					],
					[
						"a",
						"wd2",
						"y1",
						"cd2",
						"cd2"
					],
					[
						"l",
						"r",
						"y3"
					],
					[
						"a",
						"wd2",
						"y1",
						"0",
						"cd2"
					],
					[
						"l",
						"l",
						"y1"
					]
				]
			}
		]
	},
	chartplus: {
		adj: [],
		gd: [],
		paths: [{
			w: 10,
			h: 10,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"5",
					"0"
				],
				[
					"l",
					"5",
					"10"
				],
				[
					"m",
					"0",
					"5"
				],
				[
					"l",
					"10",
					"5"
				]
			]
		}, {
			w: 10,
			h: 10,
			fill: null,
			stroke: !1,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"0",
					"10"
				],
				[
					"l",
					"10",
					"10"
				],
				[
					"l",
					"10",
					"0"
				],
				["c"]
			]
		}]
	},
	chartstar: {
		adj: [],
		gd: [],
		paths: [{
			w: 10,
			h: 10,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"10",
					"10"
				],
				[
					"m",
					"0",
					"10"
				],
				[
					"l",
					"10",
					"0"
				],
				[
					"m",
					"5",
					"0"
				],
				[
					"l",
					"5",
					"10"
				]
			]
		}, {
			w: 10,
			h: 10,
			fill: null,
			stroke: !1,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"0",
					"10"
				],
				[
					"l",
					"10",
					"10"
				],
				[
					"l",
					"10",
					"0"
				],
				["c"]
			]
		}]
	},
	chartx: {
		adj: [],
		gd: [],
		paths: [{
			w: 10,
			h: 10,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"10",
					"10"
				],
				[
					"m",
					"0",
					"10"
				],
				[
					"l",
					"10",
					"0"
				]
			]
		}, {
			w: 10,
			h: 10,
			fill: null,
			stroke: !1,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"0",
					"10"
				],
				[
					"l",
					"10",
					"10"
				],
				[
					"l",
					"10",
					"0"
				],
				["c"]
			]
		}]
	},
	chevron: {
		adj: [["adj", "val 50000"]],
		gd: [
			["maxAdj", "*/ 100000 w ss"],
			["a", "pin 0 adj maxAdj"],
			["x1", "*/ ss a 100000"],
			["x2", "+- r 0 x1"],
			["x3", "*/ x2 1 2"],
			["dx", "+- x2 0 x1"],
			["il", "?: dx x1 l"],
			["ir", "?: dx x2 r"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				[
					"l",
					"x1",
					"vc"
				],
				["c"]
			]
		}]
	},
	chord: {
		adj: [["adj1", "val 2700000"], ["adj2", "val 16200000"]],
		gd: [
			["stAng", "pin 0 adj1 21599999"],
			["enAng", "pin 0 adj2 21599999"],
			["sw1", "+- enAng 0 stAng"],
			["sw2", "+- sw1 21600000 0"],
			["swAng", "?: sw1 sw1 sw2"],
			["wt1", "sin wd2 stAng"],
			["ht1", "cos hd2 stAng"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["wt2", "sin wd2 enAng"],
			["ht2", "cos hd2 enAng"],
			["dx2", "cat2 wd2 ht2 wt2"],
			["dy2", "sat2 hd2 ht2 wt2"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"],
			["x3", "+/ x1 x2 2"],
			["y3", "+/ y1 y2 2"],
			["midAng0", "*/ swAng 1 2"],
			["midAng", "+- stAng midAng0 cd2"],
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"a",
					"wd2",
					"hd2",
					"stAng",
					"swAng"
				],
				["c"]
			]
		}]
	},
	circulararrow: {
		adj: [
			["adj1", "val 12500"],
			["adj2", "val 1142319"],
			["adj3", "val 20457681"],
			["adj4", "val 10800000"],
			["adj5", "val 12500"]
		],
		gd: [
			["a5", "pin 0 adj5 25000"],
			["maxAdj1", "*/ a5 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["enAng", "pin 1 adj3 21599999"],
			["stAng", "pin 0 adj4 21599999"],
			["th", "*/ ss a1 100000"],
			["thh", "*/ ss a5 100000"],
			["th2", "*/ th 1 2"],
			["rw1", "+- wd2 th2 thh"],
			["rh1", "+- hd2 th2 thh"],
			["rw2", "+- rw1 0 th"],
			["rh2", "+- rh1 0 th"],
			["rw3", "+- rw2 th2 0"],
			["rh3", "+- rh2 th2 0"],
			["wtH", "sin rw3 enAng"],
			["htH", "cos rh3 enAng"],
			["dxH", "cat2 rw3 htH wtH"],
			["dyH", "sat2 rh3 htH wtH"],
			["xH", "+- hc dxH 0"],
			["yH", "+- vc dyH 0"],
			["rI", "min rw2 rh2"],
			["u1", "*/ dxH dxH 1"],
			["u2", "*/ dyH dyH 1"],
			["u3", "*/ rI rI 1"],
			["u4", "+- u1 0 u3"],
			["u5", "+- u2 0 u3"],
			["u6", "*/ u4 u5 u1"],
			["u7", "*/ u6 1 u2"],
			["u8", "+- 1 0 u7"],
			["u9", "sqrt u8"],
			["u10", "*/ u4 1 dxH"],
			["u11", "*/ u10 1 dyH"],
			["u12", "+/ 1 u9 u11"],
			["u13", "at2 1 u12"],
			["u14", "+- u13 21600000 0"],
			["u15", "?: u13 u13 u14"],
			["u16", "+- u15 0 enAng"],
			["u17", "+- u16 21600000 0"],
			["u18", "?: u16 u16 u17"],
			["u19", "+- u18 0 cd2"],
			["u20", "+- u18 0 21600000"],
			["u21", "?: u19 u20 u18"],
			["maxAng", "abs u21"],
			["aAng", "pin 0 adj2 maxAng"],
			["ptAng", "+- enAng aAng 0"],
			["wtA", "sin rw3 ptAng"],
			["htA", "cos rh3 ptAng"],
			["dxA", "cat2 rw3 htA wtA"],
			["dyA", "sat2 rh3 htA wtA"],
			["xA", "+- hc dxA 0"],
			["yA", "+- vc dyA 0"],
			["wtE", "sin rw1 stAng"],
			["htE", "cos rh1 stAng"],
			["dxE", "cat2 rw1 htE wtE"],
			["dyE", "sat2 rh1 htE wtE"],
			["xE", "+- hc dxE 0"],
			["yE", "+- vc dyE 0"],
			["dxG", "cos thh ptAng"],
			["dyG", "sin thh ptAng"],
			["xG", "+- xH dxG 0"],
			["yG", "+- yH dyG 0"],
			["dxB", "cos thh ptAng"],
			["dyB", "sin thh ptAng"],
			["xB", "+- xH 0 dxB 0"],
			["yB", "+- yH 0 dyB 0"],
			["sx1", "+- xB 0 hc"],
			["sy1", "+- yB 0 vc"],
			["sx2", "+- xG 0 hc"],
			["sy2", "+- yG 0 vc"],
			["rO", "min rw1 rh1"],
			["x1O", "*/ sx1 rO rw1"],
			["y1O", "*/ sy1 rO rh1"],
			["x2O", "*/ sx2 rO rw1"],
			["y2O", "*/ sy2 rO rh1"],
			["dxO", "+- x2O 0 x1O"],
			["dyO", "+- y2O 0 y1O"],
			["dO", "mod dxO dyO 0"],
			["q1", "*/ x1O y2O 1"],
			["q2", "*/ x2O y1O 1"],
			["DO", "+- q1 0 q2"],
			["q3", "*/ rO rO 1"],
			["q4", "*/ dO dO 1"],
			["q5", "*/ q3 q4 1"],
			["q6", "*/ DO DO 1"],
			["q7", "+- q5 0 q6"],
			["q8", "max q7 0"],
			["sdelO", "sqrt q8"],
			["ndyO", "*/ dyO -1 1"],
			["sdyO", "?: ndyO -1 1"],
			["q9", "*/ sdyO dxO 1"],
			["q10", "*/ q9 sdelO 1"],
			["q11", "*/ DO dyO 1"],
			["dxF1", "+/ q11 q10 q4"],
			["q12", "+- q11 0 q10"],
			["dxF2", "*/ q12 1 q4"],
			["adyO", "abs dyO"],
			["q13", "*/ adyO sdelO 1"],
			["q14", "*/ DO dxO -1"],
			["dyF1", "+/ q14 q13 q4"],
			["q15", "+- q14 0 q13"],
			["dyF2", "*/ q15 1 q4"],
			["q16", "+- x2O 0 dxF1"],
			["q17", "+- x2O 0 dxF2"],
			["q18", "+- y2O 0 dyF1"],
			["q19", "+- y2O 0 dyF2"],
			["q20", "mod q16 q18 0"],
			["q21", "mod q17 q19 0"],
			["q22", "+- q21 0 q20"],
			["dxF", "?: q22 dxF1 dxF2"],
			["dyF", "?: q22 dyF1 dyF2"],
			["sdxF", "*/ dxF rw1 rO"],
			["sdyF", "*/ dyF rh1 rO"],
			["xF", "+- hc sdxF 0"],
			["yF", "+- vc sdyF 0"],
			["x1I", "*/ sx1 rI rw2"],
			["y1I", "*/ sy1 rI rh2"],
			["x2I", "*/ sx2 rI rw2"],
			["y2I", "*/ sy2 rI rh2"],
			["dxI", "+- x2I 0 x1I"],
			["dyI", "+- y2I 0 y1I"],
			["dI", "mod dxI dyI 0"],
			["v1", "*/ x1I y2I 1"],
			["v2", "*/ x2I y1I 1"],
			["DI", "+- v1 0 v2"],
			["v3", "*/ rI rI 1"],
			["v4", "*/ dI dI 1"],
			["v5", "*/ v3 v4 1"],
			["v6", "*/ DI DI 1"],
			["v7", "+- v5 0 v6"],
			["v8", "max v7 0"],
			["sdelI", "sqrt v8"],
			["v9", "*/ sdyO dxI 1"],
			["v10", "*/ v9 sdelI 1"],
			["v11", "*/ DI dyI 1"],
			["dxC1", "+/ v11 v10 v4"],
			["v12", "+- v11 0 v10"],
			["dxC2", "*/ v12 1 v4"],
			["adyI", "abs dyI"],
			["v13", "*/ adyI sdelI 1"],
			["v14", "*/ DI dxI -1"],
			["dyC1", "+/ v14 v13 v4"],
			["v15", "+- v14 0 v13"],
			["dyC2", "*/ v15 1 v4"],
			["v16", "+- x1I 0 dxC1"],
			["v17", "+- x1I 0 dxC2"],
			["v18", "+- y1I 0 dyC1"],
			["v19", "+- y1I 0 dyC2"],
			["v20", "mod v16 v18 0"],
			["v21", "mod v17 v19 0"],
			["v22", "+- v21 0 v20"],
			["dxC", "?: v22 dxC1 dxC2"],
			["dyC", "?: v22 dyC1 dyC2"],
			["sdxC", "*/ dxC rw2 rI"],
			["sdyC", "*/ dyC rh2 rI"],
			["xC", "+- hc sdxC 0"],
			["yC", "+- vc sdyC 0"],
			["ist0", "at2 sdxC sdyC"],
			["ist1", "+- ist0 21600000 0"],
			["istAng", "?: ist0 ist0 ist1"],
			["isw1", "+- stAng 0 istAng"],
			["isw2", "+- isw1 0 21600000"],
			["iswAng", "?: isw1 isw2 isw1"],
			["p1", "+- xF 0 xC"],
			["p2", "+- yF 0 yC"],
			["p3", "mod p1 p2 0"],
			["p4", "*/ p3 1 2"],
			["p5", "+- p4 0 thh"],
			["xGp", "?: p5 xF xG"],
			["yGp", "?: p5 yF yG"],
			["xBp", "?: p5 xC xB"],
			["yBp", "?: p5 yC yB"],
			["en0", "at2 sdxF sdyF"],
			["en1", "+- en0 21600000 0"],
			["en2", "?: en0 en0 en1"],
			["sw0", "+- en2 0 stAng"],
			["sw1", "+- sw0 21600000 0"],
			["swAng", "?: sw0 sw0 sw1"],
			["wtI", "sin rw3 stAng"],
			["htI", "cos rh3 stAng"],
			["dxI", "cat2 rw3 htI wtI"],
			["dyI", "sat2 rh3 htI wtI"],
			["xI", "+- hc dxI 0"],
			["yI", "+- vc dyI 0"],
			["aI", "+- stAng 0 cd4"],
			["aA", "+- ptAng cd4 0"],
			["aB", "+- ptAng cd2 0"],
			["idx", "cos rw1 2700000"],
			["idy", "sin rh1 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"xE",
					"yE"
				],
				[
					"a",
					"rw1",
					"rh1",
					"stAng",
					"swAng"
				],
				[
					"l",
					"xGp",
					"yGp"
				],
				[
					"l",
					"xA",
					"yA"
				],
				[
					"l",
					"xBp",
					"yBp"
				],
				[
					"l",
					"xC",
					"yC"
				],
				[
					"a",
					"rw2",
					"rh2",
					"istAng",
					"iswAng"
				],
				["c"]
			]
		}]
	},
	cloud: {
		adj: [],
		gd: [
			["il", "*/ w 2977 21600"],
			["it", "*/ h 3262 21600"],
			["ir", "*/ w 17087 21600"],
			["ib", "*/ h 17337 21600"],
			["g27", "*/ w 67 21600"],
			["g28", "*/ h 21577 21600"],
			["g29", "*/ w 21582 21600"],
			["g30", "*/ h 1235 21600"]
		],
		paths: [{
			w: 43200,
			h: 43200,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"3900",
					"14370"
				],
				[
					"a",
					"6753",
					"9190",
					"-11429249",
					"7426832"
				],
				[
					"a",
					"5333",
					"7267",
					"-8646143",
					"5396714"
				],
				[
					"a",
					"4365",
					"5945",
					"-8748475",
					"5983381"
				],
				[
					"a",
					"4857",
					"6595",
					"-7859164",
					"7034504"
				],
				[
					"a",
					"5333",
					"7273",
					"-4722533",
					"6541615"
				],
				[
					"a",
					"6775",
					"9220",
					"-2776035",
					"7816140"
				],
				[
					"a",
					"5785",
					"7867",
					"37501",
					"6842000"
				],
				[
					"a",
					"6752",
					"9215",
					"1347096",
					"6910353"
				],
				[
					"a",
					"7720",
					"10543",
					"3974558",
					"4542661"
				],
				[
					"a",
					"4360",
					"5918",
					"-16496525",
					"8804134"
				],
				[
					"a",
					"4345",
					"5945",
					"-14809710",
					"9151131"
				],
				["c"]
			]
		}, {
			w: 43200,
			h: 43200,
			fill: "none",
			stroke: !0,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"4693",
					"26177"
				],
				[
					"a",
					"4345",
					"5945",
					"5204520",
					"1585770"
				],
				[
					"m",
					"6928",
					"34899"
				],
				[
					"a",
					"4360",
					"5918",
					"4416628",
					"686848"
				],
				[
					"m",
					"16478",
					"39090"
				],
				[
					"a",
					"6752",
					"9215",
					"8257449",
					"844866"
				],
				[
					"m",
					"28827",
					"34751"
				],
				[
					"a",
					"6752",
					"9215",
					"387196",
					"959901"
				],
				[
					"m",
					"34129",
					"22954"
				],
				[
					"a",
					"5785",
					"7867",
					"-4217541",
					"4255042"
				],
				[
					"m",
					"41798",
					"15354"
				],
				[
					"a",
					"5333",
					"7273",
					"1819082",
					"1665090"
				],
				[
					"m",
					"38324",
					"5426"
				],
				[
					"a",
					"4857",
					"6595",
					"-824660",
					"891534"
				],
				[
					"m",
					"29078",
					"3952"
				],
				[
					"a",
					"4857",
					"6595",
					"-8950887",
					"1091722"
				],
				[
					"m",
					"22141",
					"4720"
				],
				[
					"a",
					"4365",
					"5945",
					"-9809656",
					"1061181"
				],
				[
					"m",
					"14000",
					"5192"
				],
				[
					"a",
					"6753",
					"9190",
					"-4002417",
					"739161"
				],
				[
					"m",
					"4127",
					"15789"
				],
				[
					"a",
					"6753",
					"9190",
					"9459261",
					"711490"
				]
			]
		}]
	},
	cloudcallout: {
		adj: [["adj1", "val -20833"], ["adj2", "val 62500"]],
		gd: [
			["dxPos", "*/ w adj1 100000"],
			["dyPos", "*/ h adj2 100000"],
			["xPos", "+- hc dxPos 0"],
			["yPos", "+- vc dyPos 0"],
			["ht", "cat2 hd2 dxPos dyPos"],
			["wt", "sat2 wd2 dxPos dyPos"],
			["g2", "cat2 wd2 ht wt"],
			["g3", "sat2 hd2 ht wt"],
			["g4", "+- hc g2 0"],
			["g5", "+- vc g3 0"],
			["g6", "+- g4 0 xPos"],
			["g7", "+- g5 0 yPos"],
			["g8", "mod g6 g7 0"],
			["g9", "*/ ss 6600 21600"],
			["g10", "+- g8 0 g9"],
			["g11", "*/ g10 1 3"],
			["g12", "*/ ss 1800 21600"],
			["g13", "+- g11 g12 0"],
			["g14", "*/ g13 g6 g8"],
			["g15", "*/ g13 g7 g8"],
			["g16", "+- g14 xPos 0"],
			["g17", "+- g15 yPos 0"],
			["g18", "*/ ss 4800 21600"],
			["g19", "*/ g11 2 1"],
			["g20", "+- g18 g19 0"],
			["g21", "*/ g20 g6 g8"],
			["g22", "*/ g20 g7 g8"],
			["g23", "+- g21 xPos 0"],
			["g24", "+- g22 yPos 0"],
			["g25", "*/ ss 1200 21600"],
			["g26", "*/ ss 600 21600"],
			["x23", "+- xPos g26 0"],
			["x24", "+- g16 g25 0"],
			["x25", "+- g23 g12 0"],
			["il", "*/ w 2977 21600"],
			["it", "*/ h 3262 21600"],
			["ir", "*/ w 17087 21600"],
			["ib", "*/ h 17337 21600"],
			["g27", "*/ w 67 21600"],
			["g28", "*/ h 21577 21600"],
			["g29", "*/ w 21582 21600"],
			["g30", "*/ h 1235 21600"],
			["pang", "at2 dxPos dyPos"]
		],
		paths: [
			{
				w: 43200,
				h: 43200,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"3900",
						"14370"
					],
					[
						"a",
						"6753",
						"9190",
						"-11429249",
						"7426832"
					],
					[
						"a",
						"5333",
						"7267",
						"-8646143",
						"5396714"
					],
					[
						"a",
						"4365",
						"5945",
						"-8748475",
						"5983381"
					],
					[
						"a",
						"4857",
						"6595",
						"-7859164",
						"7034504"
					],
					[
						"a",
						"5333",
						"7273",
						"-4722533",
						"6541615"
					],
					[
						"a",
						"6775",
						"9220",
						"-2776035",
						"7816140"
					],
					[
						"a",
						"5785",
						"7867",
						"37501",
						"6842000"
					],
					[
						"a",
						"6752",
						"9215",
						"1347096",
						"6910353"
					],
					[
						"a",
						"7720",
						"10543",
						"3974558",
						"4542661"
					],
					[
						"a",
						"4360",
						"5918",
						"-16496525",
						"8804134"
					],
					[
						"a",
						"4345",
						"5945",
						"-14809710",
						"9151131"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"x23",
						"yPos"
					],
					[
						"a",
						"g26",
						"g26",
						"0",
						"21600000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"x24",
						"g17"
					],
					[
						"a",
						"g25",
						"g25",
						"0",
						"21600000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"x25",
						"g24"
					],
					[
						"a",
						"g12",
						"g12",
						"0",
						"21600000"
					],
					["c"]
				]
			},
			{
				w: 43200,
				h: 43200,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"4693",
						"26177"
					],
					[
						"a",
						"4345",
						"5945",
						"5204520",
						"1585770"
					],
					[
						"m",
						"6928",
						"34899"
					],
					[
						"a",
						"4360",
						"5918",
						"4416628",
						"686848"
					],
					[
						"m",
						"16478",
						"39090"
					],
					[
						"a",
						"6752",
						"9215",
						"8257449",
						"844866"
					],
					[
						"m",
						"28827",
						"34751"
					],
					[
						"a",
						"6752",
						"9215",
						"387196",
						"959901"
					],
					[
						"m",
						"34129",
						"22954"
					],
					[
						"a",
						"5785",
						"7867",
						"-4217541",
						"4255042"
					],
					[
						"m",
						"41798",
						"15354"
					],
					[
						"a",
						"5333",
						"7273",
						"1819082",
						"1665090"
					],
					[
						"m",
						"38324",
						"5426"
					],
					[
						"a",
						"4857",
						"6595",
						"-824660",
						"891534"
					],
					[
						"m",
						"29078",
						"3952"
					],
					[
						"a",
						"4857",
						"6595",
						"-8950887",
						"1091722"
					],
					[
						"m",
						"22141",
						"4720"
					],
					[
						"a",
						"4365",
						"5945",
						"-9809656",
						"1061181"
					],
					[
						"m",
						"14000",
						"5192"
					],
					[
						"a",
						"6753",
						"9190",
						"-4002417",
						"739161"
					],
					[
						"m",
						"4127",
						"15789"
					],
					[
						"a",
						"6753",
						"9190",
						"9459261",
						"711490"
					]
				]
			}
		]
	},
	corner: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["maxAdj1", "*/ 100000 h ss"],
			["maxAdj2", "*/ 100000 w ss"],
			["a1", "pin 0 adj1 maxAdj1"],
			["a2", "pin 0 adj2 maxAdj2"],
			["x1", "*/ ss a2 100000"],
			["dy1", "*/ ss a1 100000"],
			["y1", "+- b 0 dy1"],
			["cx1", "*/ x1 1 2"],
			["cy1", "+/ y1 b 2"],
			["d", "+- w 0 h"],
			["it", "?: d y1 t"],
			["ir", "?: d r x1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"r",
					"y1"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	cornertabs: {
		adj: [],
		gd: [
			["md", "mod w h 0"],
			["dx", "*/ 1 md 20"],
			["y1", "+- 0 b dx"],
			["x1", "+- 0 r dx"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"dx",
						"t"
					],
					[
						"l",
						"l",
						"dx"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"y1"
					],
					[
						"l",
						"dx",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"x1",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"dx"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"r",
						"y1"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"x1",
						"b"
					],
					["c"]
				]
			}
		]
	},
	cube: {
		adj: [["adj", "val 25000"]],
		gd: [
			["a", "pin 0 adj 100000"],
			["y1", "*/ ss a 100000"],
			["y4", "+- b 0 y1"],
			["y2", "*/ y4 1 2"],
			["y3", "+/ y1 b 2"],
			["x4", "+- r 0 y1"],
			["x2", "*/ x4 1 2"],
			["x3", "+/ y1 r 2"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"y1"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"l",
						"x4",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x4",
						"y1"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"y4"
					],
					[
						"l",
						"x4",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "lightenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"y1"
					],
					[
						"l",
						"y1",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"x4",
						"y1"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"y1"
					],
					[
						"l",
						"y1",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"y4"
					],
					[
						"l",
						"x4",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"l",
						"y1"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"m",
						"x4",
						"y1"
					],
					[
						"l",
						"x4",
						"b"
					]
				]
			}
		]
	},
	curvedconnector2: {
		adj: [],
		gd: [],
		paths: [{
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"t"
			], [
				"C",
				"wd2",
				"t",
				"r",
				"hd2",
				"r",
				"b"
			]]
		}]
	},
	curvedconnector3: {
		adj: [["adj1", "val 50000"]],
		gd: [
			["x2", "*/ w adj1 100000"],
			["x1", "+/ l x2 2"],
			["x3", "+/ r x2 2"],
			["y3", "*/ h 3 4"]
		],
		paths: [{
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"C",
					"x1",
					"t",
					"x2",
					"hd4",
					"x2",
					"vc"
				],
				[
					"C",
					"x2",
					"y3",
					"x3",
					"b",
					"r",
					"b"
				]
			]
		}]
	},
	curvedconnector4: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["x2", "*/ w adj1 100000"],
			["x1", "+/ l x2 2"],
			["x3", "+/ r x2 2"],
			["x4", "+/ x2 x3 2"],
			["x5", "+/ x3 r 2"],
			["y4", "*/ h adj2 100000"],
			["y1", "+/ t y4 2"],
			["y2", "+/ t y1 2"],
			["y3", "+/ y1 y4 2"],
			["y5", "+/ b y4 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"C",
					"x1",
					"t",
					"x2",
					"y2",
					"x2",
					"y1"
				],
				[
					"C",
					"x2",
					"y3",
					"x4",
					"y4",
					"x3",
					"y4"
				],
				[
					"C",
					"x5",
					"y4",
					"r",
					"y5",
					"r",
					"b"
				]
			]
		}]
	},
	curvedconnector5: {
		adj: [
			["adj1", "val 50000"],
			["adj2", "val 50000"],
			["adj3", "val 50000"]
		],
		gd: [
			["x3", "*/ w adj1 100000"],
			["x6", "*/ w adj3 100000"],
			["x1", "+/ x3 x6 2"],
			["x2", "+/ l x3 2"],
			["x4", "+/ x3 x1 2"],
			["x5", "+/ x6 x1 2"],
			["x7", "+/ x6 r 2"],
			["y4", "*/ h adj2 100000"],
			["y1", "+/ t y4 2"],
			["y2", "+/ t y1 2"],
			["y3", "+/ y1 y4 2"],
			["y5", "+/ b y4 2"],
			["y6", "+/ y5 y4 2"],
			["y7", "+/ y5 b 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"C",
					"x2",
					"t",
					"x3",
					"y2",
					"x3",
					"y1"
				],
				[
					"C",
					"x3",
					"y3",
					"x4",
					"y4",
					"x1",
					"y4"
				],
				[
					"C",
					"x5",
					"y4",
					"x6",
					"y6",
					"x6",
					"y5"
				],
				[
					"C",
					"x6",
					"y7",
					"x7",
					"b",
					"r",
					"b"
				]
			]
		}]
	},
	curveddownarrow: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 50000"],
			["adj3", "val 25000"]
		],
		gd: [
			["maxAdj2", "*/ 50000 w ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["a1", "pin 0 adj1 100000"],
			["th", "*/ ss a1 100000"],
			["aw", "*/ ss a2 100000"],
			["q1", "+/ th aw 4"],
			["wR", "+- wd2 0 q1"],
			["q7", "*/ wR 2 1"],
			["q8", "*/ q7 q7 1"],
			["q9", "*/ th th 1"],
			["q10", "+- q8 0 q9"],
			["q11", "sqrt q10"],
			["idy", "*/ q11 h q7"],
			["maxAdj3", "*/ 100000 idy ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["ah", "*/ ss adj3 100000"],
			["x3", "+- wR th 0"],
			["q2", "*/ h h 1"],
			["q3", "*/ ah ah 1"],
			["q4", "+- q2 0 q3"],
			["q5", "sqrt q4"],
			["dx", "*/ q5 wR h"],
			["x5", "+- wR dx 0"],
			["x7", "+- x3 dx 0"],
			["q6", "+- aw 0 th"],
			["dh", "*/ q6 1 2"],
			["x4", "+- x5 0 dh"],
			["x8", "+- x7 dh 0"],
			["aw2", "*/ aw 1 2"],
			["x6", "+- r 0 aw2"],
			["y1", "+- b 0 ah"],
			["swAng", "at2 ah dx"],
			["mswAng", "+- 0 0 swAng"],
			["iy", "+- b 0 idy"],
			["ix", "+/ wR x3 2"],
			["q12", "*/ th 1 2"],
			["dang2", "at2 idy q12"],
			["stAng", "+- 3cd4 swAng 0"],
			["stAng2", "+- 3cd4 0 dang2"],
			["swAng2", "+- dang2 0 cd4"],
			["swAng3", "+- cd4 dang2 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x6",
						"b"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"l",
						"x5",
						"y1"
					],
					[
						"a",
						"wR",
						"h",
						"stAng",
						"mswAng"
					],
					[
						"l",
						"x3",
						"t"
					],
					[
						"a",
						"wR",
						"h",
						"3cd4",
						"swAng"
					],
					[
						"l",
						"x8",
						"y1"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"ix",
						"iy"
					],
					[
						"a",
						"wR",
						"h",
						"stAng2",
						"swAng2"
					],
					[
						"l",
						"l",
						"b"
					],
					[
						"a",
						"wR",
						"h",
						"cd2",
						"swAng3"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"ix",
						"iy"
					],
					[
						"a",
						"wR",
						"h",
						"stAng2",
						"swAng2"
					],
					[
						"l",
						"l",
						"b"
					],
					[
						"a",
						"wR",
						"h",
						"cd2",
						"cd4"
					],
					[
						"l",
						"x3",
						"t"
					],
					[
						"a",
						"wR",
						"h",
						"3cd4",
						"swAng"
					],
					[
						"l",
						"x8",
						"y1"
					],
					[
						"l",
						"x6",
						"b"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"l",
						"x5",
						"y1"
					],
					[
						"a",
						"wR",
						"h",
						"stAng",
						"mswAng"
					]
				]
			}
		]
	},
	curvedleftarrow: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 50000"],
			["adj3", "val 25000"]
		],
		gd: [
			["maxAdj2", "*/ 50000 h ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["a1", "pin 0 adj1 a2"],
			["th", "*/ ss a1 100000"],
			["aw", "*/ ss a2 100000"],
			["q1", "+/ th aw 4"],
			["hR", "+- hd2 0 q1"],
			["q7", "*/ hR 2 1"],
			["q8", "*/ q7 q7 1"],
			["q9", "*/ th th 1"],
			["q10", "+- q8 0 q9"],
			["q11", "sqrt q10"],
			["idx", "*/ q11 w q7"],
			["maxAdj3", "*/ 100000 idx ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["ah", "*/ ss a3 100000"],
			["y3", "+- hR th 0"],
			["q2", "*/ w w 1"],
			["q3", "*/ ah ah 1"],
			["q4", "+- q2 0 q3"],
			["q5", "sqrt q4"],
			["dy", "*/ q5 hR w"],
			["y5", "+- hR dy 0"],
			["y7", "+- y3 dy 0"],
			["q6", "+- aw 0 th"],
			["dh", "*/ q6 1 2"],
			["y4", "+- y5 0 dh"],
			["y8", "+- y7 dh 0"],
			["aw2", "*/ aw 1 2"],
			["y6", "+- b 0 aw2"],
			["x1", "+- l ah 0"],
			["swAng", "at2 ah dy"],
			["mswAng", "+- 0 0 swAng"],
			["ix", "+- l idx 0"],
			["iy", "+/ hR y3 2"],
			["q12", "*/ th 1 2"],
			["dang2", "at2 idx q12"],
			["swAng2", "+- dang2 0 swAng"],
			["swAng3", "+- swAng dang2 0"],
			["stAng3", "+- 0 0 dang2"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"y6"
					],
					[
						"l",
						"x1",
						"y4"
					],
					[
						"l",
						"x1",
						"y5"
					],
					[
						"a",
						"w",
						"hR",
						"swAng",
						"swAng2"
					],
					[
						"a",
						"w",
						"hR",
						"stAng3",
						"swAng3"
					],
					[
						"l",
						"x1",
						"y8"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"r",
						"y3"
					],
					[
						"a",
						"w",
						"hR",
						"0",
						"-5400000"
					],
					[
						"l",
						"l",
						"t"
					],
					[
						"a",
						"w",
						"hR",
						"3cd4",
						"cd4"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"r",
						"y3"
					],
					[
						"a",
						"w",
						"hR",
						"0",
						"-5400000"
					],
					[
						"l",
						"l",
						"t"
					],
					[
						"a",
						"w",
						"hR",
						"3cd4",
						"cd4"
					],
					[
						"l",
						"r",
						"y3"
					],
					[
						"a",
						"w",
						"hR",
						"0",
						"swAng"
					],
					[
						"l",
						"x1",
						"y8"
					],
					[
						"l",
						"l",
						"y6"
					],
					[
						"l",
						"x1",
						"y4"
					],
					[
						"l",
						"x1",
						"y5"
					],
					[
						"a",
						"w",
						"hR",
						"swAng",
						"swAng2"
					]
				]
			}
		]
	},
	curvedrightarrow: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 50000"],
			["adj3", "val 25000"]
		],
		gd: [
			["maxAdj2", "*/ 50000 h ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["a1", "pin 0 adj1 a2"],
			["th", "*/ ss a1 100000"],
			["aw", "*/ ss a2 100000"],
			["q1", "+/ th aw 4"],
			["hR", "+- hd2 0 q1"],
			["q7", "*/ hR 2 1"],
			["q8", "*/ q7 q7 1"],
			["q9", "*/ th th 1"],
			["q10", "+- q8 0 q9"],
			["q11", "sqrt q10"],
			["idx", "*/ q11 w q7"],
			["maxAdj3", "*/ 100000 idx ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["ah", "*/ ss a3 100000"],
			["y3", "+- hR th 0"],
			["q2", "*/ w w 1"],
			["q3", "*/ ah ah 1"],
			["q4", "+- q2 0 q3"],
			["q5", "sqrt q4"],
			["dy", "*/ q5 hR w"],
			["y5", "+- hR dy 0"],
			["y7", "+- y3 dy 0"],
			["q6", "+- aw 0 th"],
			["dh", "*/ q6 1 2"],
			["y4", "+- y5 0 dh"],
			["y8", "+- y7 dh 0"],
			["aw2", "*/ aw 1 2"],
			["y6", "+- b 0 aw2"],
			["x1", "+- r 0 ah"],
			["swAng", "at2 ah dy"],
			["stAng", "+- cd2 0 swAng"],
			["mswAng", "+- 0 0 swAng"],
			["ix", "+- r 0 idx"],
			["iy", "+/ hR y3 2"],
			["q12", "*/ th 1 2"],
			["dang2", "at2 idx q12"],
			["swAng2", "+- dang2 0 cd4"],
			["swAng3", "+- cd4 dang2 0"],
			["stAng3", "+- cd2 0 dang2"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"hR"
					],
					[
						"a",
						"w",
						"hR",
						"cd2",
						"mswAng"
					],
					[
						"l",
						"x1",
						"y4"
					],
					[
						"l",
						"r",
						"y6"
					],
					[
						"l",
						"x1",
						"y8"
					],
					[
						"l",
						"x1",
						"y7"
					],
					[
						"a",
						"w",
						"hR",
						"stAng",
						"swAng"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"r",
						"th"
					],
					[
						"a",
						"w",
						"hR",
						"3cd4",
						"swAng2"
					],
					[
						"a",
						"w",
						"hR",
						"stAng3",
						"swAng3"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"hR"
					],
					[
						"a",
						"w",
						"hR",
						"cd2",
						"mswAng"
					],
					[
						"l",
						"x1",
						"y4"
					],
					[
						"l",
						"r",
						"y6"
					],
					[
						"l",
						"x1",
						"y8"
					],
					[
						"l",
						"x1",
						"y7"
					],
					[
						"a",
						"w",
						"hR",
						"stAng",
						"swAng"
					],
					[
						"l",
						"l",
						"hR"
					],
					[
						"a",
						"w",
						"hR",
						"cd2",
						"cd4"
					],
					[
						"l",
						"r",
						"th"
					],
					[
						"a",
						"w",
						"hR",
						"3cd4",
						"swAng2"
					]
				]
			}
		]
	},
	curveduparrow: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 50000"],
			["adj3", "val 25000"]
		],
		gd: [
			["maxAdj2", "*/ 50000 w ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["a1", "pin 0 adj1 100000"],
			["th", "*/ ss a1 100000"],
			["aw", "*/ ss a2 100000"],
			["q1", "+/ th aw 4"],
			["wR", "+- wd2 0 q1"],
			["q7", "*/ wR 2 1"],
			["q8", "*/ q7 q7 1"],
			["q9", "*/ th th 1"],
			["q10", "+- q8 0 q9"],
			["q11", "sqrt q10"],
			["idy", "*/ q11 h q7"],
			["maxAdj3", "*/ 100000 idy ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["ah", "*/ ss adj3 100000"],
			["x3", "+- wR th 0"],
			["q2", "*/ h h 1"],
			["q3", "*/ ah ah 1"],
			["q4", "+- q2 0 q3"],
			["q5", "sqrt q4"],
			["dx", "*/ q5 wR h"],
			["x5", "+- wR dx 0"],
			["x7", "+- x3 dx 0"],
			["q6", "+- aw 0 th"],
			["dh", "*/ q6 1 2"],
			["x4", "+- x5 0 dh"],
			["x8", "+- x7 dh 0"],
			["aw2", "*/ aw 1 2"],
			["x6", "+- r 0 aw2"],
			["y1", "+- t ah 0"],
			["swAng", "at2 ah dx"],
			["mswAng", "+- 0 0 swAng"],
			["iy", "+- t idy 0"],
			["ix", "+/ wR x3 2"],
			["q12", "*/ th 1 2"],
			["dang2", "at2 idy q12"],
			["swAng2", "+- dang2 0 swAng"],
			["mswAng2", "+- 0 0 swAng2"],
			["stAng3", "+- cd4 0 swAng"],
			["swAng3", "+- swAng dang2 0"],
			["stAng2", "+- cd4 0 dang2"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x6",
						"t"
					],
					[
						"l",
						"x8",
						"y1"
					],
					[
						"l",
						"x7",
						"y1"
					],
					[
						"a",
						"wR",
						"h",
						"stAng3",
						"swAng3"
					],
					[
						"a",
						"wR",
						"h",
						"stAng2",
						"swAng2"
					],
					[
						"l",
						"x4",
						"y1"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"wR",
						"b"
					],
					[
						"a",
						"wR",
						"h",
						"cd4",
						"cd4"
					],
					[
						"l",
						"th",
						"t"
					],
					[
						"a",
						"wR",
						"h",
						"cd2",
						"-5400000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"ix",
						"iy"
					],
					[
						"a",
						"wR",
						"h",
						"stAng2",
						"swAng2"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"l",
						"x6",
						"t"
					],
					[
						"l",
						"x8",
						"y1"
					],
					[
						"l",
						"x7",
						"y1"
					],
					[
						"a",
						"wR",
						"h",
						"stAng3",
						"swAng"
					],
					[
						"l",
						"wR",
						"b"
					],
					[
						"a",
						"wR",
						"h",
						"cd4",
						"cd4"
					],
					[
						"l",
						"th",
						"t"
					],
					[
						"a",
						"wR",
						"h",
						"cd2",
						"-5400000"
					]
				]
			}
		]
	},
	decagon: {
		adj: [["vf", "val 105146"]],
		gd: [
			["shd2", "*/ hd2 vf 100000"],
			["dx1", "cos wd2 2160000"],
			["dx2", "cos wd2 4320000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"],
			["x4", "+- hc dx1 0"],
			["dy1", "sin shd2 4320000"],
			["dy2", "sin shd2 2160000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc dy2 0"],
			["y4", "+- vc dy1 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x3",
					"y1"
				],
				[
					"l",
					"x4",
					"y2"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"x3",
					"y4"
				],
				[
					"l",
					"x2",
					"y4"
				],
				[
					"l",
					"x1",
					"y3"
				],
				["c"]
			]
		}]
	},
	diagstripe: {
		adj: [["adj", "val 50000"]],
		gd: [
			["a", "pin 0 adj 100000"],
			["x2", "*/ w a 100000"],
			["x1", "*/ x2 1 2"],
			["x3", "+/ x2 r 2"],
			["y2", "*/ h a 100000"],
			["y1", "*/ y2 1 2"],
			["y3", "+/ y2 b 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y2"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	diamond: {
		adj: [],
		gd: [["ir", "*/ w 3 4"], ["ib", "*/ h 3 4"]],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"hc",
					"b"
				],
				["c"]
			]
		}]
	},
	dodecagon: {
		adj: [],
		gd: [
			["x1", "*/ w 2894 21600"],
			["x2", "*/ w 7906 21600"],
			["x3", "*/ w 13694 21600"],
			["x4", "*/ w 18706 21600"],
			["y1", "*/ h 2894 21600"],
			["y2", "*/ h 7906 21600"],
			["y3", "*/ h 13694 21600"],
			["y4", "*/ h 18706 21600"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y2"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"x3",
					"t"
				],
				[
					"l",
					"x4",
					"y1"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"r",
					"y3"
				],
				[
					"l",
					"x4",
					"y4"
				],
				[
					"l",
					"x3",
					"b"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"x1",
					"y4"
				],
				[
					"l",
					"l",
					"y3"
				],
				["c"]
			]
		}]
	},
	donut: {
		adj: [["adj", "val 25000"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dr", "*/ ss a 100000"],
			["iwd2", "+- wd2 0 dr"],
			["ihd2", "+- hd2 0 dr"],
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd2",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"3cd4",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"0",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd4",
					"cd4"
				],
				["c"],
				[
					"m",
					"dr",
					"vc"
				],
				[
					"a",
					"iwd2",
					"ihd2",
					"cd2",
					"-5400000"
				],
				[
					"a",
					"iwd2",
					"ihd2",
					"cd4",
					"-5400000"
				],
				[
					"a",
					"iwd2",
					"ihd2",
					"0",
					"-5400000"
				],
				[
					"a",
					"iwd2",
					"ihd2",
					"3cd4",
					"-5400000"
				],
				["c"]
			]
		}]
	},
	doublewave: {
		adj: [["adj1", "val 6250"], ["adj2", "val 0"]],
		gd: [
			["a1", "pin 0 adj1 12500"],
			["a2", "pin -10000 adj2 10000"],
			["y1", "*/ h a1 100000"],
			["dy2", "*/ y1 10 3"],
			["y2", "+- y1 0 dy2"],
			["y3", "+- y1 dy2 0"],
			["y4", "+- b 0 y1"],
			["y5", "+- y4 0 dy2"],
			["y6", "+- y4 dy2 0"],
			["dx1", "*/ w a2 100000"],
			["of2", "*/ w a2 50000"],
			["x1", "abs dx1"],
			["dx2", "?: of2 0 of2"],
			["x2", "+- l 0 dx2"],
			["dx8", "?: of2 of2 0"],
			["x8", "+- r 0 dx8"],
			["dx3", "+/ dx2 x8 6"],
			["x3", "+- x2 dx3 0"],
			["dx4", "+/ dx2 x8 3"],
			["x4", "+- x2 dx4 0"],
			["x5", "+/ x2 x8 2"],
			["x6", "+- x5 dx3 0"],
			["x7", "+/ x6 x8 2"],
			["x9", "+- l dx8 0"],
			["x15", "+- r dx2 0"],
			["x10", "+- x9 dx3 0"],
			["x11", "+- x9 dx4 0"],
			["x12", "+/ x9 x15 2"],
			["x13", "+- x12 dx3 0"],
			["x14", "+/ x13 x15 2"],
			["x16", "+- r 0 x1"],
			["xAdj", "+- hc dx1 0"],
			["il", "max x2 x9"],
			["ir", "min x8 x15"],
			["it", "*/ h a1 50000"],
			["ib", "+- b 0 it"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x2",
					"y1"
				],
				[
					"C",
					"x3",
					"y2",
					"x4",
					"y3",
					"x5",
					"y1"
				],
				[
					"C",
					"x6",
					"y2",
					"x7",
					"y3",
					"x8",
					"y1"
				],
				[
					"l",
					"x15",
					"y4"
				],
				[
					"C",
					"x14",
					"y6",
					"x13",
					"y5",
					"x12",
					"y4"
				],
				[
					"C",
					"x11",
					"y6",
					"x10",
					"y5",
					"x9",
					"y4"
				],
				["c"]
			]
		}]
	},
	downarrow: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["maxAdj2", "*/ 100000 h ss"],
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 0 adj2 maxAdj2"],
			["dy1", "*/ ss a2 100000"],
			["y1", "+- b 0 dy1"],
			["dx1", "*/ w a1 200000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc dx1 0"],
			["dy2", "*/ x1 dy1 wd2"],
			["y2", "+- y1 dy2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y1"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"r",
					"y1"
				],
				[
					"l",
					"hc",
					"b"
				],
				["c"]
			]
		}]
	},
	downarrowcallout: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"],
			["adj4", "val 64977"]
		],
		gd: [
			["maxAdj2", "*/ 50000 w ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["maxAdj3", "*/ 100000 h ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["q2", "*/ a3 ss h"],
			["maxAdj4", "+- 100000 0 q2"],
			["a4", "pin 0 adj4 maxAdj4"],
			["dx1", "*/ ss a2 100000"],
			["dx2", "*/ ss a1 200000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"],
			["x4", "+- hc dx1 0"],
			["dy3", "*/ ss a3 100000"],
			["y3", "+- b 0 dy3"],
			["y2", "*/ h a4 100000"],
			["y1", "*/ y2 1 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"x2",
					"y3"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"l",
					"y2"
				],
				["c"]
			]
		}]
	},
	ellipse: {
		adj: [],
		gd: [
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd2",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"3cd4",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"0",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd4",
					"cd4"
				],
				["c"]
			]
		}]
	},
	ellipseribbon: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 50000"],
			["adj3", "val 12500"]
		],
		gd: [
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 25000 adj2 75000"],
			["q10", "+- 100000 0 a1"],
			["q11", "*/ q10 1 2"],
			["q12", "+- a1 0 q11"],
			["minAdj3", "max 0 q12"],
			["a3", "pin minAdj3 adj3 a1"],
			["dx2", "*/ w a2 200000"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- x2 wd8 0"],
			["x4", "+- r 0 x3"],
			["x5", "+- r 0 x2"],
			["x6", "+- r 0 wd8"],
			["dy1", "*/ h a3 100000"],
			["f1", "*/ 4 dy1 w"],
			["q1", "*/ x3 x3 w"],
			["q2", "+- x3 0 q1"],
			["y1", "*/ f1 q2 1"],
			["cx1", "*/ x3 1 2"],
			["cy1", "*/ f1 cx1 1"],
			["cx2", "+- r 0 cx1"],
			["q1", "*/ h a1 100000"],
			["dy3", "+- q1 0 dy1"],
			["q3", "*/ x2 x2 w"],
			["q4", "+- x2 0 q3"],
			["q5", "*/ f1 q4 1"],
			["y3", "+- q5 dy3 0"],
			["q6", "+- dy1 dy3 y3"],
			["q7", "+- q6 dy1 0"],
			["cy3", "+- q7 dy3 0"],
			["rh", "+- b 0 q1"],
			["q8", "*/ dy1 14 16"],
			["y2", "+/ q8 rh 2"],
			["y5", "+- q5 rh 0"],
			["y6", "+- y3 rh 0"],
			["cx4", "*/ x2 1 2"],
			["q9", "*/ f1 cx4 1"],
			["cy4", "+- q9 rh 0"],
			["cx5", "+- r 0 cx4"],
			["cy6", "+- cy3 rh 0"],
			["y7", "+- y1 dy3 0"],
			["cy7", "+- q1 q1 y7"],
			["y8", "+- b 0 dy1"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"Q",
						"cx1",
						"cy1",
						"x3",
						"y1"
					],
					[
						"l",
						"x2",
						"y3"
					],
					[
						"Q",
						"hc",
						"cy3",
						"x5",
						"y3"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"Q",
						"cx2",
						"cy1",
						"r",
						"t"
					],
					[
						"l",
						"x6",
						"y2"
					],
					[
						"l",
						"r",
						"rh"
					],
					[
						"Q",
						"cx5",
						"cy4",
						"x5",
						"y5"
					],
					[
						"l",
						"x5",
						"y6"
					],
					[
						"Q",
						"hc",
						"cy6",
						"x2",
						"y6"
					],
					[
						"l",
						"x2",
						"y5"
					],
					[
						"Q",
						"cx4",
						"cy4",
						"l",
						"rh"
					],
					[
						"l",
						"wd8",
						"y2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x3",
						"y7"
					],
					[
						"l",
						"x3",
						"y1"
					],
					[
						"l",
						"x2",
						"y3"
					],
					[
						"Q",
						"hc",
						"cy3",
						"x5",
						"y3"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"l",
						"x4",
						"y7"
					],
					[
						"Q",
						"hc",
						"cy7",
						"x3",
						"y7"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"Q",
						"cx1",
						"cy1",
						"x3",
						"y1"
					],
					[
						"l",
						"x2",
						"y3"
					],
					[
						"Q",
						"hc",
						"cy3",
						"x5",
						"y3"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"Q",
						"cx2",
						"cy1",
						"r",
						"t"
					],
					[
						"l",
						"x6",
						"y2"
					],
					[
						"l",
						"r",
						"rh"
					],
					[
						"Q",
						"cx5",
						"cy4",
						"x5",
						"y5"
					],
					[
						"l",
						"x5",
						"y6"
					],
					[
						"Q",
						"hc",
						"cy6",
						"x2",
						"y6"
					],
					[
						"l",
						"x2",
						"y5"
					],
					[
						"Q",
						"cx4",
						"cy4",
						"l",
						"rh"
					],
					[
						"l",
						"wd8",
						"y2"
					],
					["c"],
					[
						"m",
						"x2",
						"y5"
					],
					[
						"l",
						"x2",
						"y3"
					],
					[
						"m",
						"x5",
						"y3"
					],
					[
						"l",
						"x5",
						"y5"
					],
					[
						"m",
						"x3",
						"y1"
					],
					[
						"l",
						"x3",
						"y7"
					],
					[
						"m",
						"x4",
						"y7"
					],
					[
						"l",
						"x4",
						"y1"
					]
				]
			}
		]
	},
	ellipseribbon2: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 50000"],
			["adj3", "val 12500"]
		],
		gd: [
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 25000 adj2 75000"],
			["q10", "+- 100000 0 a1"],
			["q11", "*/ q10 1 2"],
			["q12", "+- a1 0 q11"],
			["minAdj3", "max 0 q12"],
			["a3", "pin minAdj3 adj3 a1"],
			["dx2", "*/ w a2 200000"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- x2 wd8 0"],
			["x4", "+- r 0 x3"],
			["x5", "+- r 0 x2"],
			["x6", "+- r 0 wd8"],
			["dy1", "*/ h a3 100000"],
			["f1", "*/ 4 dy1 w"],
			["q1", "*/ x3 x3 w"],
			["q2", "+- x3 0 q1"],
			["u1", "*/ f1 q2 1"],
			["y1", "+- b 0 u1"],
			["cx1", "*/ x3 1 2"],
			["cu1", "*/ f1 cx1 1"],
			["cy1", "+- b 0 cu1"],
			["cx2", "+- r 0 cx1"],
			["q1", "*/ h a1 100000"],
			["dy3", "+- q1 0 dy1"],
			["q3", "*/ x2 x2 w"],
			["q4", "+- x2 0 q3"],
			["q5", "*/ f1 q4 1"],
			["u3", "+- q5 dy3 0"],
			["y3", "+- b 0 u3"],
			["q6", "+- dy1 dy3 u3"],
			["q7", "+- q6 dy1 0"],
			["cu3", "+- q7 dy3 0"],
			["cy3", "+- b 0 cu3"],
			["rh", "+- b 0 q1"],
			["q8", "*/ dy1 14 16"],
			["u2", "+/ q8 rh 2"],
			["y2", "+- b 0 u2"],
			["u5", "+- q5 rh 0"],
			["y5", "+- b 0 u5"],
			["u6", "+- u3 rh 0"],
			["y6", "+- b 0 u6"],
			["cx4", "*/ x2 1 2"],
			["q9", "*/ f1 cx4 1"],
			["cu4", "+- q9 rh 0"],
			["cy4", "+- b 0 cu4"],
			["cx5", "+- r 0 cx4"],
			["cu6", "+- cu3 rh 0"],
			["cy6", "+- b 0 cu6"],
			["u7", "+- u1 dy3 0"],
			["y7", "+- b 0 u7"],
			["cu7", "+- q1 q1 u7"],
			["cy7", "+- b 0 cu7"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"b"
					],
					[
						"Q",
						"cx1",
						"cy1",
						"x3",
						"y1"
					],
					[
						"l",
						"x2",
						"y3"
					],
					[
						"Q",
						"hc",
						"cy3",
						"x5",
						"y3"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"Q",
						"cx2",
						"cy1",
						"r",
						"b"
					],
					[
						"l",
						"x6",
						"y2"
					],
					[
						"l",
						"r",
						"q1"
					],
					[
						"Q",
						"cx5",
						"cy4",
						"x5",
						"y5"
					],
					[
						"l",
						"x5",
						"y6"
					],
					[
						"Q",
						"hc",
						"cy6",
						"x2",
						"y6"
					],
					[
						"l",
						"x2",
						"y5"
					],
					[
						"Q",
						"cx4",
						"cy4",
						"l",
						"q1"
					],
					[
						"l",
						"wd8",
						"y2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x3",
						"y7"
					],
					[
						"l",
						"x3",
						"y1"
					],
					[
						"l",
						"x2",
						"y3"
					],
					[
						"Q",
						"hc",
						"cy3",
						"x5",
						"y3"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"l",
						"x4",
						"y7"
					],
					[
						"Q",
						"hc",
						"cy7",
						"x3",
						"y7"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"b"
					],
					[
						"l",
						"wd8",
						"y2"
					],
					[
						"l",
						"l",
						"q1"
					],
					[
						"Q",
						"cx4",
						"cy4",
						"x2",
						"y5"
					],
					[
						"l",
						"x2",
						"y6"
					],
					[
						"Q",
						"hc",
						"cy6",
						"x5",
						"y6"
					],
					[
						"l",
						"x5",
						"y5"
					],
					[
						"Q",
						"cx5",
						"cy4",
						"r",
						"q1"
					],
					[
						"l",
						"x6",
						"y2"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"Q",
						"cx2",
						"cy1",
						"x4",
						"y1"
					],
					[
						"l",
						"x5",
						"y3"
					],
					[
						"Q",
						"hc",
						"cy3",
						"x2",
						"y3"
					],
					[
						"l",
						"x3",
						"y1"
					],
					[
						"Q",
						"cx1",
						"cy1",
						"l",
						"b"
					],
					["c"],
					[
						"m",
						"x2",
						"y3"
					],
					[
						"l",
						"x2",
						"y5"
					],
					[
						"m",
						"x5",
						"y5"
					],
					[
						"l",
						"x5",
						"y3"
					],
					[
						"m",
						"x3",
						"y7"
					],
					[
						"l",
						"x3",
						"y1"
					],
					[
						"m",
						"x4",
						"y1"
					],
					[
						"l",
						"x4",
						"y7"
					]
				]
			}
		]
	},
	flowchartalternateprocess: {
		adj: [],
		gd: [
			["x2", "+- r 0 ssd6"],
			["y2", "+- b 0 ssd6"],
			["il", "*/ ssd6 29289 100000"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"ssd6"
				],
				[
					"a",
					"ssd6",
					"ssd6",
					"cd2",
					"cd4"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"a",
					"ssd6",
					"ssd6",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"a",
					"ssd6",
					"ssd6",
					"0",
					"cd4"
				],
				[
					"l",
					"ssd6",
					"b"
				],
				[
					"a",
					"ssd6",
					"ssd6",
					"cd4",
					"cd4"
				],
				["c"]
			]
		}]
	},
	flowchartcollate: {
		adj: [],
		gd: [["ir", "*/ w 3 4"], ["ib", "*/ h 3 4"]],
		paths: [{
			w: 2,
			h: 2,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"2",
					"0"
				],
				[
					"l",
					"1",
					"1"
				],
				[
					"l",
					"2",
					"2"
				],
				[
					"l",
					"0",
					"2"
				],
				[
					"l",
					"1",
					"1"
				],
				["c"]
			]
		}]
	},
	flowchartconnector: {
		adj: [],
		gd: [
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd2",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"3cd4",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"0",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd4",
					"cd4"
				],
				["c"]
			]
		}]
	},
	flowchartdecision: {
		adj: [],
		gd: [["ir", "*/ w 3 4"], ["ib", "*/ h 3 4"]],
		paths: [{
			w: 2,
			h: 2,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"1"
				],
				[
					"l",
					"1",
					"0"
				],
				[
					"l",
					"2",
					"1"
				],
				[
					"l",
					"1",
					"2"
				],
				["c"]
			]
		}]
	},
	flowchartdelay: {
		adj: [],
		gd: [
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"a",
					"wd2",
					"hd2",
					"3cd4",
					"cd2"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	flowchartdisplay: {
		adj: [],
		gd: [["x2", "*/ w 5 6"]],
		paths: [{
			w: 6,
			h: 6,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"3"
				],
				[
					"l",
					"1",
					"0"
				],
				[
					"l",
					"5",
					"0"
				],
				[
					"a",
					"1",
					"3",
					"3cd4",
					"cd2"
				],
				[
					"l",
					"1",
					"6"
				],
				["c"]
			]
		}]
	},
	flowchartdocument: {
		adj: [],
		gd: [["y1", "*/ h 17322 21600"], ["y2", "*/ h 20172 21600"]],
		paths: [{
			w: 21600,
			h: 21600,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"21600",
					"0"
				],
				[
					"l",
					"21600",
					"17322"
				],
				[
					"C",
					"10800",
					"17322",
					"10800",
					"23922",
					"0",
					"20172"
				],
				["c"]
			]
		}]
	},
	flowchartextract: {
		adj: [],
		gd: [["x2", "*/ w 3 4"]],
		paths: [{
			w: 2,
			h: 2,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"2"
				],
				[
					"l",
					"1",
					"0"
				],
				[
					"l",
					"2",
					"2"
				],
				["c"]
			]
		}]
	},
	flowchartinputoutput: {
		adj: [],
		gd: [
			["x3", "*/ w 2 5"],
			["x4", "*/ w 3 5"],
			["x5", "*/ w 4 5"],
			["x6", "*/ w 9 10"]
		],
		paths: [{
			w: 5,
			h: 5,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"5"
				],
				[
					"l",
					"1",
					"0"
				],
				[
					"l",
					"5",
					"0"
				],
				[
					"l",
					"4",
					"5"
				],
				["c"]
			]
		}]
	},
	flowchartinternalstorage: {
		adj: [],
		gd: [],
		paths: [
			{
				w: 1,
				h: 1,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"0",
						"0"
					],
					[
						"l",
						"1",
						"0"
					],
					[
						"l",
						"1",
						"1"
					],
					[
						"l",
						"0",
						"1"
					],
					["c"]
				]
			},
			{
				w: 8,
				h: 8,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"1",
						"0"
					],
					[
						"l",
						"1",
						"8"
					],
					[
						"m",
						"0",
						"1"
					],
					[
						"l",
						"8",
						"1"
					]
				]
			},
			{
				w: 1,
				h: 1,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"0",
						"0"
					],
					[
						"l",
						"1",
						"0"
					],
					[
						"l",
						"1",
						"1"
					],
					[
						"l",
						"0",
						"1"
					],
					["c"]
				]
			}
		]
	},
	flowchartmagneticdisk: {
		adj: [],
		gd: [["y3", "*/ h 5 6"]],
		paths: [
			{
				w: 6,
				h: 6,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"0",
						"1"
					],
					[
						"a",
						"3",
						"1",
						"cd2",
						"cd2"
					],
					[
						"l",
						"6",
						"5"
					],
					[
						"a",
						"3",
						"1",
						"0",
						"cd2"
					],
					["c"]
				]
			},
			{
				w: 6,
				h: 6,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [[
					"m",
					"6",
					"1"
				], [
					"a",
					"3",
					"1",
					"0",
					"cd2"
				]]
			},
			{
				w: 6,
				h: 6,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"0",
						"1"
					],
					[
						"a",
						"3",
						"1",
						"cd2",
						"cd2"
					],
					[
						"l",
						"6",
						"5"
					],
					[
						"a",
						"3",
						"1",
						"0",
						"cd2"
					],
					["c"]
				]
			}
		]
	},
	flowchartmagneticdrum: {
		adj: [],
		gd: [["x2", "*/ w 2 3"]],
		paths: [
			{
				w: 6,
				h: 6,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"1",
						"0"
					],
					[
						"l",
						"5",
						"0"
					],
					[
						"a",
						"1",
						"3",
						"3cd4",
						"cd2"
					],
					[
						"l",
						"1",
						"6"
					],
					[
						"a",
						"1",
						"3",
						"cd4",
						"cd2"
					],
					["c"]
				]
			},
			{
				w: 6,
				h: 6,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [[
					"m",
					"5",
					"6"
				], [
					"a",
					"1",
					"3",
					"cd4",
					"cd2"
				]]
			},
			{
				w: 6,
				h: 6,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"1",
						"0"
					],
					[
						"l",
						"5",
						"0"
					],
					[
						"a",
						"1",
						"3",
						"3cd4",
						"cd2"
					],
					[
						"l",
						"1",
						"6"
					],
					[
						"a",
						"1",
						"3",
						"cd4",
						"cd2"
					],
					["c"]
				]
			}
		]
	},
	flowchartmagnetictape: {
		adj: [],
		gd: [
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"],
			["ang1", "at2 w h"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"hc",
					"b"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd4",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd2",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"3cd4",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"0",
					"ang1"
				],
				[
					"l",
					"r",
					"ib"
				],
				[
					"l",
					"r",
					"b"
				],
				["c"]
			]
		}]
	},
	flowchartmanualinput: {
		adj: [],
		gd: [],
		paths: [{
			w: 5,
			h: 5,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"1"
				],
				[
					"l",
					"5",
					"0"
				],
				[
					"l",
					"5",
					"5"
				],
				[
					"l",
					"0",
					"5"
				],
				["c"]
			]
		}]
	},
	flowchartmanualoperation: {
		adj: [],
		gd: [["x3", "*/ w 4 5"], ["x4", "*/ w 9 10"]],
		paths: [{
			w: 5,
			h: 5,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"5",
					"0"
				],
				[
					"l",
					"4",
					"5"
				],
				[
					"l",
					"1",
					"5"
				],
				["c"]
			]
		}]
	},
	flowchartmerge: {
		adj: [],
		gd: [["x2", "*/ w 3 4"]],
		paths: [{
			w: 2,
			h: 2,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"2",
					"0"
				],
				[
					"l",
					"1",
					"2"
				],
				["c"]
			]
		}]
	},
	flowchartmultidocument: {
		adj: [],
		gd: [
			["y2", "*/ h 3675 21600"],
			["y8", "*/ h 20782 21600"],
			["x3", "*/ w 9298 21600"],
			["x4", "*/ w 12286 21600"],
			["x5", "*/ w 18595 21600"]
		],
		paths: [
			{
				w: 21600,
				h: 21600,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"0",
						"20782"
					],
					[
						"C",
						"9298",
						"23542",
						"9298",
						"18022",
						"18595",
						"18022"
					],
					[
						"l",
						"18595",
						"3675"
					],
					[
						"l",
						"0",
						"3675"
					],
					["c"],
					[
						"m",
						"1532",
						"3675"
					],
					[
						"l",
						"1532",
						"1815"
					],
					[
						"l",
						"20000",
						"1815"
					],
					[
						"l",
						"20000",
						"16252"
					],
					[
						"C",
						"19298",
						"16252",
						"18595",
						"16352",
						"18595",
						"16352"
					],
					[
						"l",
						"18595",
						"3675"
					],
					["c"],
					[
						"m",
						"2972",
						"1815"
					],
					[
						"l",
						"2972",
						"0"
					],
					[
						"l",
						"21600",
						"0"
					],
					[
						"l",
						"21600",
						"14392"
					],
					[
						"C",
						"20800",
						"14392",
						"20000",
						"14467",
						"20000",
						"14467"
					],
					[
						"l",
						"20000",
						"1815"
					],
					["c"]
				]
			},
			{
				w: 21600,
				h: 21600,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"0",
						"3675"
					],
					[
						"l",
						"18595",
						"3675"
					],
					[
						"l",
						"18595",
						"18022"
					],
					[
						"C",
						"9298",
						"18022",
						"9298",
						"23542",
						"0",
						"20782"
					],
					["c"],
					[
						"m",
						"1532",
						"3675"
					],
					[
						"l",
						"1532",
						"1815"
					],
					[
						"l",
						"20000",
						"1815"
					],
					[
						"l",
						"20000",
						"16252"
					],
					[
						"C",
						"19298",
						"16252",
						"18595",
						"16352",
						"18595",
						"16352"
					],
					[
						"m",
						"2972",
						"1815"
					],
					[
						"l",
						"2972",
						"0"
					],
					[
						"l",
						"21600",
						"0"
					],
					[
						"l",
						"21600",
						"14392"
					],
					[
						"C",
						"20800",
						"14392",
						"20000",
						"14467",
						"20000",
						"14467"
					]
				]
			},
			{
				w: 21600,
				h: 21600,
				fill: "none",
				stroke: !1,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"0",
						"20782"
					],
					[
						"C",
						"9298",
						"23542",
						"9298",
						"18022",
						"18595",
						"18022"
					],
					[
						"l",
						"18595",
						"16352"
					],
					[
						"C",
						"18595",
						"16352",
						"19298",
						"16252",
						"20000",
						"16252"
					],
					[
						"l",
						"20000",
						"14467"
					],
					[
						"C",
						"20000",
						"14467",
						"20800",
						"14392",
						"21600",
						"14392"
					],
					[
						"l",
						"21600",
						"0"
					],
					[
						"l",
						"2972",
						"0"
					],
					[
						"l",
						"2972",
						"1815"
					],
					[
						"l",
						"1532",
						"1815"
					],
					[
						"l",
						"1532",
						"3675"
					],
					[
						"l",
						"0",
						"3675"
					],
					["c"]
				]
			}
		]
	},
	flowchartofflinestorage: {
		adj: [],
		gd: [["x4", "*/ w 3 4"]],
		paths: [
			{
				w: 2,
				h: 2,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"0",
						"0"
					],
					[
						"l",
						"2",
						"0"
					],
					[
						"l",
						"1",
						"2"
					],
					["c"]
				]
			},
			{
				w: 5,
				h: 5,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [[
					"m",
					"2",
					"4"
				], [
					"l",
					"3",
					"4"
				]]
			},
			{
				w: 2,
				h: 2,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"0",
						"0"
					],
					[
						"l",
						"2",
						"0"
					],
					[
						"l",
						"1",
						"2"
					],
					["c"]
				]
			}
		]
	},
	flowchartoffpageconnector: {
		adj: [],
		gd: [["y1", "*/ h 4 5"]],
		paths: [{
			w: 10,
			h: 10,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"10",
					"0"
				],
				[
					"l",
					"10",
					"8"
				],
				[
					"l",
					"5",
					"10"
				],
				[
					"l",
					"0",
					"8"
				],
				["c"]
			]
		}]
	},
	flowchartonlinestorage: {
		adj: [],
		gd: [["x2", "*/ w 5 6"]],
		paths: [{
			w: 6,
			h: 6,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"1",
					"0"
				],
				[
					"l",
					"6",
					"0"
				],
				[
					"a",
					"1",
					"3",
					"3cd4",
					"-10800000"
				],
				[
					"l",
					"1",
					"6"
				],
				[
					"a",
					"1",
					"3",
					"cd4",
					"cd2"
				],
				["c"]
			]
		}]
	},
	flowchartor: {
		adj: [],
		gd: [
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"vc"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd2",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"3cd4",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"0",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd4",
						"cd4"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"hc",
						"t"
					],
					[
						"l",
						"hc",
						"b"
					],
					[
						"m",
						"l",
						"vc"
					],
					[
						"l",
						"r",
						"vc"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"vc"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd2",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"3cd4",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"0",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd4",
						"cd4"
					],
					["c"]
				]
			}
		]
	},
	flowchartpredefinedprocess: {
		adj: [],
		gd: [["x2", "*/ w 7 8"]],
		paths: [
			{
				w: 1,
				h: 1,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"0",
						"0"
					],
					[
						"l",
						"1",
						"0"
					],
					[
						"l",
						"1",
						"1"
					],
					[
						"l",
						"0",
						"1"
					],
					["c"]
				]
			},
			{
				w: 8,
				h: 8,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"1",
						"0"
					],
					[
						"l",
						"1",
						"8"
					],
					[
						"m",
						"7",
						"0"
					],
					[
						"l",
						"7",
						"8"
					]
				]
			},
			{
				w: 1,
				h: 1,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"0",
						"0"
					],
					[
						"l",
						"1",
						"0"
					],
					[
						"l",
						"1",
						"1"
					],
					[
						"l",
						"0",
						"1"
					],
					["c"]
				]
			}
		]
	},
	flowchartpreparation: {
		adj: [],
		gd: [["x2", "*/ w 4 5"]],
		paths: [{
			w: 10,
			h: 10,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"5"
				],
				[
					"l",
					"2",
					"0"
				],
				[
					"l",
					"8",
					"0"
				],
				[
					"l",
					"10",
					"5"
				],
				[
					"l",
					"8",
					"10"
				],
				[
					"l",
					"2",
					"10"
				],
				["c"]
			]
		}]
	},
	flowchartprocess: {
		adj: [],
		gd: [],
		paths: [{
			w: 1,
			h: 1,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"0"
				],
				[
					"l",
					"1",
					"0"
				],
				[
					"l",
					"1",
					"1"
				],
				[
					"l",
					"0",
					"1"
				],
				["c"]
			]
		}]
	},
	flowchartpunchedcard: {
		adj: [],
		gd: [],
		paths: [{
			w: 5,
			h: 5,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"1"
				],
				[
					"l",
					"1",
					"0"
				],
				[
					"l",
					"5",
					"0"
				],
				[
					"l",
					"5",
					"5"
				],
				[
					"l",
					"0",
					"5"
				],
				["c"]
			]
		}]
	},
	flowchartpunchedtape: {
		adj: [],
		gd: [["y2", "*/ h 9 10"], ["ib", "*/ h 4 5"]],
		paths: [{
			w: 20,
			h: 20,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"0",
					"2"
				],
				[
					"a",
					"5",
					"2",
					"cd2",
					"-10800000"
				],
				[
					"a",
					"5",
					"2",
					"cd2",
					"cd2"
				],
				[
					"l",
					"20",
					"18"
				],
				[
					"a",
					"5",
					"2",
					"0",
					"-10800000"
				],
				[
					"a",
					"5",
					"2",
					"0",
					"cd2"
				],
				["c"]
			]
		}]
	},
	flowchartsort: {
		adj: [],
		gd: [["ir", "*/ w 3 4"], ["ib", "*/ h 3 4"]],
		paths: [
			{
				w: 2,
				h: 2,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"0",
						"1"
					],
					[
						"l",
						"1",
						"0"
					],
					[
						"l",
						"2",
						"1"
					],
					[
						"l",
						"1",
						"2"
					],
					["c"]
				]
			},
			{
				w: 2,
				h: 2,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [[
					"m",
					"0",
					"1"
				], [
					"l",
					"2",
					"1"
				]]
			},
			{
				w: 2,
				h: 2,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"0",
						"1"
					],
					[
						"l",
						"1",
						"0"
					],
					[
						"l",
						"2",
						"1"
					],
					[
						"l",
						"1",
						"2"
					],
					["c"]
				]
			}
		]
	},
	flowchartsummingjunction: {
		adj: [],
		gd: [
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"vc"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd2",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"3cd4",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"0",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd4",
						"cd4"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"il",
						"it"
					],
					[
						"l",
						"ir",
						"ib"
					],
					[
						"m",
						"ir",
						"it"
					],
					[
						"l",
						"il",
						"ib"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"vc"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd2",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"3cd4",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"0",
						"cd4"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd4",
						"cd4"
					],
					["c"]
				]
			}
		]
	},
	flowchartterminator: {
		adj: [],
		gd: [
			["il", "*/ w 1018 21600"],
			["ir", "*/ w 20582 21600"],
			["it", "*/ h 3163 21600"],
			["ib", "*/ h 18437 21600"]
		],
		paths: [{
			w: 21600,
			h: 21600,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"3475",
					"0"
				],
				[
					"l",
					"18125",
					"0"
				],
				[
					"a",
					"3475",
					"10800",
					"3cd4",
					"cd2"
				],
				[
					"l",
					"3475",
					"21600"
				],
				[
					"a",
					"3475",
					"10800",
					"cd4",
					"cd2"
				],
				["c"]
			]
		}]
	},
	foldedcorner: {
		adj: [["adj", "val 16667"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dy2", "*/ ss a 100000"],
			["dy1", "*/ dy2 1 5"],
			["x1", "+- r 0 dy2"],
			["x2", "+- x1 dy1 0"],
			["y2", "+- b 0 dy2"],
			["y1", "+- y2 dy1 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"y2"
					],
					[
						"l",
						"x1",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"b"
					],
					[
						"l",
						"x2",
						"y1"
					],
					[
						"l",
						"r",
						"y2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x1",
						"b"
					],
					[
						"l",
						"x2",
						"y1"
					],
					[
						"l",
						"r",
						"y2"
					],
					[
						"l",
						"x1",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					[
						"l",
						"l",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"y2"
					]
				]
			}
		]
	},
	frame: {
		adj: [["adj1", "val 12500"]],
		gd: [
			["a1", "pin 0 adj1 50000"],
			["x1", "*/ ss a1 100000"],
			["x4", "+- r 0 x1"],
			["y4", "+- b 0 x1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"],
				[
					"m",
					"x1",
					"x1"
				],
				[
					"l",
					"x1",
					"y4"
				],
				[
					"l",
					"x4",
					"y4"
				],
				[
					"l",
					"x4",
					"x1"
				],
				["c"]
			]
		}]
	},
	funnel: {
		adj: [],
		gd: [
			["d", "*/ ss 1 20"],
			["rw2", "+- wd2 0 d"],
			["rh2", "+- hd4 0 d"],
			["t1", "cos wd2 480000"],
			["t2", "sin hd4 480000"],
			["da", "at2 t1 t2"],
			["2da", "*/ da 2 1"],
			["stAng1", "+- cd2 0 da"],
			["swAng1", "+- cd2 2da 0"],
			["swAng3", "+- cd2 0 2da"],
			["rw3", "*/ wd2 1 4"],
			["rh3", "*/ hd4 1 4"],
			["ct1", "cos hd4 stAng1"],
			["st1", "sin wd2 stAng1"],
			["m1", "mod ct1 st1 0"],
			["n1", "*/ wd2 hd4 m1"],
			["dx1", "cos n1 stAng1"],
			["dy1", "sin n1 stAng1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- hd4 dy1 0"],
			["ct3", "cos rh3 da"],
			["st3", "sin rw3 da"],
			["m3", "mod ct3 st3 0"],
			["n3", "*/ rw3 rh3 m3"],
			["dx3", "cos n3 da"],
			["dy3", "sin n3 da"],
			["x3", "+- hc dx3 0"],
			["vc3", "+- b 0 rh3"],
			["y2", "+- vc3 dy3 0"],
			["x2", "+- wd2 0 rw2"],
			["cd", "*/ cd2 2 1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"a",
					"wd2",
					"hd4",
					"stAng1",
					"swAng1"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"a",
					"rw3",
					"rh3",
					"da",
					"swAng3"
				],
				["c"],
				[
					"m",
					"x2",
					"hd4"
				],
				[
					"a",
					"rw2",
					"rh2",
					"cd2",
					"-21600000"
				],
				["c"]
			]
		}]
	},
	gear6: {
		adj: [["adj1", "val 15000"], ["adj2", "val 3526"]],
		gd: [
			["a1", "pin 0 adj1 20000"],
			["a2", "pin 0 adj2 5358"],
			["th", "*/ ss a1 100000"],
			["lFD", "*/ ss a2 100000"],
			["th2", "*/ th 1 2"],
			["l2", "*/ lFD 1 2"],
			["l3", "+- th2 l2 0"],
			["rh", "+- hd2 0 th"],
			["rw", "+- wd2 0 th"],
			["dr", "+- rw 0 rh"],
			["maxr", "?: dr rh rw"],
			["ha", "at2 maxr l3"],
			["aA1", "+- 19800000 0 ha"],
			["aD1", "+- 19800000 ha 0"],
			["ta11", "cos rw aA1"],
			["ta12", "sin rh aA1"],
			["bA1", "at2 ta11 ta12"],
			["cta1", "cos rh bA1"],
			["sta1", "sin rw bA1"],
			["ma1", "mod cta1 sta1 0"],
			["na1", "*/ rw rh ma1"],
			["dxa1", "cos na1 bA1"],
			["dya1", "sin na1 bA1"],
			["xA1", "+- hc dxa1 0"],
			["yA1", "+- vc dya1 0"],
			["td11", "cos rw aD1"],
			["td12", "sin rh aD1"],
			["bD1", "at2 td11 td12"],
			["ctd1", "cos rh bD1"],
			["std1", "sin rw bD1"],
			["md1", "mod ctd1 std1 0"],
			["nd1", "*/ rw rh md1"],
			["dxd1", "cos nd1 bD1"],
			["dyd1", "sin nd1 bD1"],
			["xD1", "+- hc dxd1 0"],
			["yD1", "+- vc dyd1 0"],
			["xAD1", "+- xA1 0 xD1"],
			["yAD1", "+- yA1 0 yD1"],
			["lAD1", "mod xAD1 yAD1 0"],
			["a1", "at2 yAD1 xAD1"],
			["dxF1", "sin lFD a1"],
			["dyF1", "cos lFD a1"],
			["xF1", "+- xD1 dxF1 0"],
			["yF1", "+- yD1 dyF1 0"],
			["xE1", "+- xA1 0 dxF1"],
			["yE1", "+- yA1 0 dyF1"],
			["yC1t", "sin th a1"],
			["xC1t", "cos th a1"],
			["yC1", "+- yF1 yC1t 0"],
			["xC1", "+- xF1 0 xC1t"],
			["yB1", "+- yE1 yC1t 0"],
			["xB1", "+- xE1 0 xC1t"],
			["aD6", "+- 3cd4 ha 0"],
			["td61", "cos rw aD6"],
			["td62", "sin rh aD6"],
			["bD6", "at2 td61 td62"],
			["ctd6", "cos rh bD6"],
			["std6", "sin rw bD6"],
			["md6", "mod ctd6 std6 0"],
			["nd6", "*/ rw rh md6"],
			["dxd6", "cos nd6 bD6"],
			["dyd6", "sin nd6 bD6"],
			["xD6", "+- hc dxd6 0"],
			["yD6", "+- vc dyd6 0"],
			["xA6", "+- hc 0 dxd6"],
			["xF6", "+- xD6 0 lFD"],
			["xE6", "+- xA6 lFD 0"],
			["yC6", "+- yD6 0 th"],
			["swAng1", "+- bA1 0 bD6"],
			["aA2", "+- 1800000 0 ha"],
			["aD2", "+- 1800000 ha 0"],
			["ta21", "cos rw aA2"],
			["ta22", "sin rh aA2"],
			["bA2", "at2 ta21 ta22"],
			["yA2", "+- h 0 yD1"],
			["td21", "cos rw aD2"],
			["td22", "sin rh aD2"],
			["bD2", "at2 td21 td22"],
			["yD2", "+- h 0 yA1"],
			["yC2", "+- h 0 yB1"],
			["yB2", "+- h 0 yC1"],
			["xB2", "val xC1"],
			["swAng2", "+- bA2 0 bD1"],
			["aD3", "+- cd4 ha 0"],
			["td31", "cos rw aD3"],
			["td32", "sin rh aD3"],
			["bD3", "at2 td31 td32"],
			["yD3", "+- h 0 yD6"],
			["yB3", "+- h 0 yC6"],
			["aD4", "+- 9000000 ha 0"],
			["td41", "cos rw aD4"],
			["td42", "sin rh aD4"],
			["bD4", "at2 td41 td42"],
			["xD4", "+- w 0 xD1"],
			["xC4", "+- w 0 xC1"],
			["xB4", "+- w 0 xB1"],
			["aD5", "+- 12600000 ha 0"],
			["td51", "cos rw aD5"],
			["td52", "sin rh aD5"],
			["bD5", "at2 td51 td52"],
			["xD5", "+- w 0 xA1"],
			["xC5", "+- w 0 xB1"],
			["xB5", "+- w 0 xC1"],
			["xCxn1", "+/ xB1 xC1 2"],
			["yCxn1", "+/ yB1 yC1 2"],
			["yCxn2", "+- b 0 yCxn1"],
			["xCxn4", "+/ r 0 xCxn1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"xA1",
					"yA1"
				],
				[
					"l",
					"xB1",
					"yB1"
				],
				[
					"l",
					"xC1",
					"yC1"
				],
				[
					"l",
					"xD1",
					"yD1"
				],
				[
					"a",
					"rw",
					"rh",
					"bD1",
					"swAng2"
				],
				[
					"l",
					"xC1",
					"yB2"
				],
				[
					"l",
					"xB1",
					"yC2"
				],
				[
					"l",
					"xA1",
					"yD2"
				],
				[
					"a",
					"rw",
					"rh",
					"bD2",
					"swAng1"
				],
				[
					"l",
					"xF6",
					"yB3"
				],
				[
					"l",
					"xE6",
					"yB3"
				],
				[
					"l",
					"xA6",
					"yD3"
				],
				[
					"a",
					"rw",
					"rh",
					"bD3",
					"swAng1"
				],
				[
					"l",
					"xB4",
					"yC2"
				],
				[
					"l",
					"xC4",
					"yB2"
				],
				[
					"l",
					"xD4",
					"yA2"
				],
				[
					"a",
					"rw",
					"rh",
					"bD4",
					"swAng2"
				],
				[
					"l",
					"xB5",
					"yC1"
				],
				[
					"l",
					"xC5",
					"yB1"
				],
				[
					"l",
					"xD5",
					"yA1"
				],
				[
					"a",
					"rw",
					"rh",
					"bD5",
					"swAng1"
				],
				[
					"l",
					"xE6",
					"yC6"
				],
				[
					"l",
					"xF6",
					"yC6"
				],
				[
					"l",
					"xD6",
					"yD6"
				],
				[
					"a",
					"rw",
					"rh",
					"bD6",
					"swAng1"
				],
				["c"]
			]
		}]
	},
	gear9: {
		adj: [["adj1", "val 10000"], ["adj2", "val 1763"]],
		gd: [
			["a1", "pin 0 adj1 20000"],
			["a2", "pin 0 adj2 2679"],
			["th", "*/ ss a1 100000"],
			["lFD", "*/ ss a2 100000"],
			["th2", "*/ th 1 2"],
			["l2", "*/ lFD 1 2"],
			["l3", "+- th2 l2 0"],
			["rh", "+- hd2 0 th"],
			["rw", "+- wd2 0 th"],
			["dr", "+- rw 0 rh"],
			["maxr", "?: dr rh rw"],
			["ha", "at2 maxr l3"],
			["aA1", "+- 18600000 0 ha"],
			["aD1", "+- 18600000 ha 0"],
			["ta11", "cos rw aA1"],
			["ta12", "sin rh aA1"],
			["bA1", "at2 ta11 ta12"],
			["cta1", "cos rh bA1"],
			["sta1", "sin rw bA1"],
			["ma1", "mod cta1 sta1 0"],
			["na1", "*/ rw rh ma1"],
			["dxa1", "cos na1 bA1"],
			["dya1", "sin na1 bA1"],
			["xA1", "+- hc dxa1 0"],
			["yA1", "+- vc dya1 0"],
			["td11", "cos rw aD1"],
			["td12", "sin rh aD1"],
			["bD1", "at2 td11 td12"],
			["ctd1", "cos rh bD1"],
			["std1", "sin rw bD1"],
			["md1", "mod ctd1 std1 0"],
			["nd1", "*/ rw rh md1"],
			["dxd1", "cos nd1 bD1"],
			["dyd1", "sin nd1 bD1"],
			["xD1", "+- hc dxd1 0"],
			["yD1", "+- vc dyd1 0"],
			["xAD1", "+- xA1 0 xD1"],
			["yAD1", "+- yA1 0 yD1"],
			["lAD1", "mod xAD1 yAD1 0"],
			["a1", "at2 yAD1 xAD1"],
			["dxF1", "sin lFD a1"],
			["dyF1", "cos lFD a1"],
			["xF1", "+- xD1 dxF1 0"],
			["yF1", "+- yD1 dyF1 0"],
			["xE1", "+- xA1 0 dxF1"],
			["yE1", "+- yA1 0 dyF1"],
			["yC1t", "sin th a1"],
			["xC1t", "cos th a1"],
			["yC1", "+- yF1 yC1t 0"],
			["xC1", "+- xF1 0 xC1t"],
			["yB1", "+- yE1 yC1t 0"],
			["xB1", "+- xE1 0 xC1t"],
			["aA2", "+- 21000000 0 ha"],
			["aD2", "+- 21000000 ha 0"],
			["ta21", "cos rw aA2"],
			["ta22", "sin rh aA2"],
			["bA2", "at2 ta21 ta22"],
			["cta2", "cos rh bA2"],
			["sta2", "sin rw bA2"],
			["ma2", "mod cta2 sta2 0"],
			["na2", "*/ rw rh ma2"],
			["dxa2", "cos na2 bA2"],
			["dya2", "sin na2 bA2"],
			["xA2", "+- hc dxa2 0"],
			["yA2", "+- vc dya2 0"],
			["td21", "cos rw aD2"],
			["td22", "sin rh aD2"],
			["bD2", "at2 td21 td22"],
			["ctd2", "cos rh bD2"],
			["std2", "sin rw bD2"],
			["md2", "mod ctd2 std2 0"],
			["nd2", "*/ rw rh md2"],
			["dxd2", "cos nd2 bD2"],
			["dyd2", "sin nd2 bD2"],
			["xD2", "+- hc dxd2 0"],
			["yD2", "+- vc dyd2 0"],
			["xAD2", "+- xA2 0 xD2"],
			["yAD2", "+- yA2 0 yD2"],
			["lAD2", "mod xAD2 yAD2 0"],
			["a2", "at2 yAD2 xAD2"],
			["dxF2", "sin lFD a2"],
			["dyF2", "cos lFD a2"],
			["xF2", "+- xD2 dxF2 0"],
			["yF2", "+- yD2 dyF2 0"],
			["xE2", "+- xA2 0 dxF2"],
			["yE2", "+- yA2 0 dyF2"],
			["yC2t", "sin th a2"],
			["xC2t", "cos th a2"],
			["yC2", "+- yF2 yC2t 0"],
			["xC2", "+- xF2 0 xC2t"],
			["yB2", "+- yE2 yC2t 0"],
			["xB2", "+- xE2 0 xC2t"],
			["swAng1", "+- bA2 0 bD1"],
			["aA3", "+- 1800000 0 ha"],
			["aD3", "+- 1800000 ha 0"],
			["ta31", "cos rw aA3"],
			["ta32", "sin rh aA3"],
			["bA3", "at2 ta31 ta32"],
			["cta3", "cos rh bA3"],
			["sta3", "sin rw bA3"],
			["ma3", "mod cta3 sta3 0"],
			["na3", "*/ rw rh ma3"],
			["dxa3", "cos na3 bA3"],
			["dya3", "sin na3 bA3"],
			["xA3", "+- hc dxa3 0"],
			["yA3", "+- vc dya3 0"],
			["td31", "cos rw aD3"],
			["td32", "sin rh aD3"],
			["bD3", "at2 td31 td32"],
			["ctd3", "cos rh bD3"],
			["std3", "sin rw bD3"],
			["md3", "mod ctd3 std3 0"],
			["nd3", "*/ rw rh md3"],
			["dxd3", "cos nd3 bD3"],
			["dyd3", "sin nd3 bD3"],
			["xD3", "+- hc dxd3 0"],
			["yD3", "+- vc dyd3 0"],
			["xAD3", "+- xA3 0 xD3"],
			["yAD3", "+- yA3 0 yD3"],
			["lAD3", "mod xAD3 yAD3 0"],
			["a3", "at2 yAD3 xAD3"],
			["dxF3", "sin lFD a3"],
			["dyF3", "cos lFD a3"],
			["xF3", "+- xD3 dxF3 0"],
			["yF3", "+- yD3 dyF3 0"],
			["xE3", "+- xA3 0 dxF3"],
			["yE3", "+- yA3 0 dyF3"],
			["yC3t", "sin th a3"],
			["xC3t", "cos th a3"],
			["yC3", "+- yF3 yC3t 0"],
			["xC3", "+- xF3 0 xC3t"],
			["yB3", "+- yE3 yC3t 0"],
			["xB3", "+- xE3 0 xC3t"],
			["swAng2", "+- bA3 0 bD2"],
			["aA4", "+- 4200000 0 ha"],
			["aD4", "+- 4200000 ha 0"],
			["ta41", "cos rw aA4"],
			["ta42", "sin rh aA4"],
			["bA4", "at2 ta41 ta42"],
			["cta4", "cos rh bA4"],
			["sta4", "sin rw bA4"],
			["ma4", "mod cta4 sta4 0"],
			["na4", "*/ rw rh ma4"],
			["dxa4", "cos na4 bA4"],
			["dya4", "sin na4 bA4"],
			["xA4", "+- hc dxa4 0"],
			["yA4", "+- vc dya4 0"],
			["td41", "cos rw aD4"],
			["td42", "sin rh aD4"],
			["bD4", "at2 td41 td42"],
			["ctd4", "cos rh bD4"],
			["std4", "sin rw bD4"],
			["md4", "mod ctd4 std4 0"],
			["nd4", "*/ rw rh md4"],
			["dxd4", "cos nd4 bD4"],
			["dyd4", "sin nd4 bD4"],
			["xD4", "+- hc dxd4 0"],
			["yD4", "+- vc dyd4 0"],
			["xAD4", "+- xA4 0 xD4"],
			["yAD4", "+- yA4 0 yD4"],
			["lAD4", "mod xAD4 yAD4 0"],
			["a4", "at2 yAD4 xAD4"],
			["dxF4", "sin lFD a4"],
			["dyF4", "cos lFD a4"],
			["xF4", "+- xD4 dxF4 0"],
			["yF4", "+- yD4 dyF4 0"],
			["xE4", "+- xA4 0 dxF4"],
			["yE4", "+- yA4 0 dyF4"],
			["yC4t", "sin th a4"],
			["xC4t", "cos th a4"],
			["yC4", "+- yF4 yC4t 0"],
			["xC4", "+- xF4 0 xC4t"],
			["yB4", "+- yE4 yC4t 0"],
			["xB4", "+- xE4 0 xC4t"],
			["swAng3", "+- bA4 0 bD3"],
			["aA5", "+- 6600000 0 ha"],
			["aD5", "+- 6600000 ha 0"],
			["ta51", "cos rw aA5"],
			["ta52", "sin rh aA5"],
			["bA5", "at2 ta51 ta52"],
			["td51", "cos rw aD5"],
			["td52", "sin rh aD5"],
			["bD5", "at2 td51 td52"],
			["xD5", "+- w 0 xA4"],
			["xC5", "+- w 0 xB4"],
			["xB5", "+- w 0 xC4"],
			["swAng4", "+- bA5 0 bD4"],
			["aD6", "+- 9000000 ha 0"],
			["td61", "cos rw aD6"],
			["td62", "sin rh aD6"],
			["bD6", "at2 td61 td62"],
			["xD6", "+- w 0 xA3"],
			["xC6", "+- w 0 xB3"],
			["xB6", "+- w 0 xC3"],
			["aD7", "+- 11400000 ha 0"],
			["td71", "cos rw aD7"],
			["td72", "sin rh aD7"],
			["bD7", "at2 td71 td72"],
			["xD7", "+- w 0 xA2"],
			["xC7", "+- w 0 xB2"],
			["xB7", "+- w 0 xC2"],
			["aD8", "+- 13800000 ha 0"],
			["td81", "cos rw aD8"],
			["td82", "sin rh aD8"],
			["bD8", "at2 td81 td82"],
			["xA8", "+- w 0 xD1"],
			["xD8", "+- w 0 xA1"],
			["xC8", "+- w 0 xB1"],
			["xB8", "+- w 0 xC1"],
			["aA9", "+- 3cd4 0 ha"],
			["aD9", "+- 3cd4 ha 0"],
			["td91", "cos rw aD9"],
			["td92", "sin rh aD9"],
			["bD9", "at2 td91 td92"],
			["ctd9", "cos rh bD9"],
			["std9", "sin rw bD9"],
			["md9", "mod ctd9 std9 0"],
			["nd9", "*/ rw rh md9"],
			["dxd9", "cos nd9 bD9"],
			["dyd9", "sin nd9 bD9"],
			["xD9", "+- hc dxd9 0"],
			["yD9", "+- vc dyd9 0"],
			["ta91", "cos rw aA9"],
			["ta92", "sin rh aA9"],
			["bA9", "at2 ta91 ta92"],
			["xA9", "+- hc 0 dxd9"],
			["xF9", "+- xD9 0 lFD"],
			["xE9", "+- xA9 lFD 0"],
			["yC9", "+- yD9 0 th"],
			["swAng5", "+- bA9 0 bD8"],
			["xCxn1", "+/ xB1 xC1 2"],
			["yCxn1", "+/ yB1 yC1 2"],
			["xCxn2", "+/ xB2 xC2 2"],
			["yCxn2", "+/ yB2 yC2 2"],
			["xCxn3", "+/ xB3 xC3 2"],
			["yCxn3", "+/ yB3 yC3 2"],
			["xCxn4", "+/ xB4 xC4 2"],
			["yCxn4", "+/ yB4 yC4 2"],
			["xCxn5", "+/ r 0 xCxn4"],
			["xCxn6", "+/ r 0 xCxn3"],
			["xCxn7", "+/ r 0 xCxn2"],
			["xCxn8", "+/ r 0 xCxn1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"xA1",
					"yA1"
				],
				[
					"l",
					"xB1",
					"yB1"
				],
				[
					"l",
					"xC1",
					"yC1"
				],
				[
					"l",
					"xD1",
					"yD1"
				],
				[
					"a",
					"rw",
					"rh",
					"bD1",
					"swAng1"
				],
				[
					"l",
					"xB2",
					"yB2"
				],
				[
					"l",
					"xC2",
					"yC2"
				],
				[
					"l",
					"xD2",
					"yD2"
				],
				[
					"a",
					"rw",
					"rh",
					"bD2",
					"swAng2"
				],
				[
					"l",
					"xB3",
					"yB3"
				],
				[
					"l",
					"xC3",
					"yC3"
				],
				[
					"l",
					"xD3",
					"yD3"
				],
				[
					"a",
					"rw",
					"rh",
					"bD3",
					"swAng3"
				],
				[
					"l",
					"xB4",
					"yB4"
				],
				[
					"l",
					"xC4",
					"yC4"
				],
				[
					"l",
					"xD4",
					"yD4"
				],
				[
					"a",
					"rw",
					"rh",
					"bD4",
					"swAng4"
				],
				[
					"l",
					"xB5",
					"yC4"
				],
				[
					"l",
					"xC5",
					"yB4"
				],
				[
					"l",
					"xD5",
					"yA4"
				],
				[
					"a",
					"rw",
					"rh",
					"bD5",
					"swAng3"
				],
				[
					"l",
					"xB6",
					"yC3"
				],
				[
					"l",
					"xC6",
					"yB3"
				],
				[
					"l",
					"xD6",
					"yA3"
				],
				[
					"a",
					"rw",
					"rh",
					"bD6",
					"swAng2"
				],
				[
					"l",
					"xB7",
					"yC2"
				],
				[
					"l",
					"xC7",
					"yB2"
				],
				[
					"l",
					"xD7",
					"yA2"
				],
				[
					"a",
					"rw",
					"rh",
					"bD7",
					"swAng1"
				],
				[
					"l",
					"xB8",
					"yC1"
				],
				[
					"l",
					"xC8",
					"yB1"
				],
				[
					"l",
					"xD8",
					"yA1"
				],
				[
					"a",
					"rw",
					"rh",
					"bD8",
					"swAng5"
				],
				[
					"l",
					"xE9",
					"yC9"
				],
				[
					"l",
					"xF9",
					"yC9"
				],
				[
					"l",
					"xD9",
					"yD9"
				],
				[
					"a",
					"rw",
					"rh",
					"bD9",
					"swAng5"
				],
				["c"]
			]
		}]
	},
	halfframe: {
		adj: [["adj1", "val 33333"], ["adj2", "val 33333"]],
		gd: [
			["maxAdj2", "*/ 100000 w ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["x1", "*/ ss a2 100000"],
			["g1", "*/ h x1 w"],
			["g2", "+- h 0 g1"],
			["maxAdj1", "*/ 100000 g2 ss"],
			["a1", "pin 0 adj1 maxAdj1"],
			["y1", "*/ ss a1 100000"],
			["dx2", "*/ y1 w h"],
			["x2", "+- r 0 dx2"],
			["dy2", "*/ x1 h w"],
			["y2", "+- b 0 dy2"],
			["cx1", "*/ x1 1 2"],
			["cy1", "+/ y2 b 2"],
			["cx2", "+/ x2 r 2"],
			["cy2", "*/ y1 1 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	heart: {
		adj: [],
		gd: [
			["dx1", "*/ w 49 48"],
			["dx2", "*/ w 10 48"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"],
			["x4", "+- hc dx1 0"],
			["y1", "+- t 0 hd3"],
			["il", "*/ w 1 6"],
			["ir", "*/ w 5 6"],
			["ib", "*/ h 2 3"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"hc",
					"hd4"
				],
				[
					"C",
					"x3",
					"y1",
					"x4",
					"hd4",
					"hc",
					"b"
				],
				[
					"C",
					"x1",
					"hd4",
					"x2",
					"y1",
					"hc",
					"hd4"
				],
				["c"]
			]
		}]
	},
	heptagon: {
		adj: [["hf", "val 102572"], ["vf", "val 105210"]],
		gd: [
			["swd2", "*/ wd2 hf 100000"],
			["shd2", "*/ hd2 vf 100000"],
			["svc", "*/ vc  vf 100000"],
			["dx1", "*/ swd2 97493 100000"],
			["dx2", "*/ swd2 78183 100000"],
			["dx3", "*/ swd2 43388 100000"],
			["dy1", "*/ shd2 62349 100000"],
			["dy2", "*/ shd2 22252 100000"],
			["dy3", "*/ shd2 90097 100000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc 0 dx3"],
			["x4", "+- hc dx3 0"],
			["x5", "+- hc dx2 0"],
			["x6", "+- hc dx1 0"],
			["y1", "+- svc 0 dy1"],
			["y2", "+- svc dy2 0"],
			["y3", "+- svc dy3 0"],
			["ib", "+- b 0 y1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y2"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"x5",
					"y1"
				],
				[
					"l",
					"x6",
					"y2"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"x3",
					"y3"
				],
				["c"]
			]
		}]
	},
	hexagon: {
		adj: [["adj", "val 25000"], ["vf", "val 115470"]],
		gd: [
			["maxAdj", "*/ 50000 w ss"],
			["a", "pin 0 adj maxAdj"],
			["shd2", "*/ hd2 vf 100000"],
			["x1", "*/ ss a 100000"],
			["x2", "+- r 0 x1"],
			["dy1", "sin shd2 3600000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc dy1 0"],
			["q1", "*/ maxAdj -1 2"],
			["q2", "+- a q1 0"],
			["q3", "?: q2 4 2"],
			["q4", "?: q2 3 2"],
			["q5", "?: q2 q1 0"],
			["q6", "+/ a q5 q1"],
			["q7", "*/ q6 q4 -1"],
			["q8", "+- q3 q7 0"],
			["il", "*/ w q8 24"],
			["it", "*/ h q8 24"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 it"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x1",
					"y2"
				],
				["c"]
			]
		}]
	},
	homeplate: {
		adj: [["adj", "val 50000"]],
		gd: [
			["maxAdj", "*/ 100000 w ss"],
			["a", "pin 0 adj maxAdj"],
			["dx1", "*/ ss a 100000"],
			["x1", "+- r 0 dx1"],
			["ir", "+/ x1 r 2"],
			["x2", "*/ x1 1 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	horizontalscroll: {
		adj: [["adj", "val 12500"]],
		gd: [
			["a", "pin 0 adj 25000"],
			["ch", "*/ ss a 100000"],
			["ch2", "*/ ch 1 2"],
			["ch4", "*/ ch 1 4"],
			["y3", "+- ch ch2 0"],
			["y4", "+- ch ch 0"],
			["y6", "+- b 0 ch"],
			["y7", "+- b 0 ch2"],
			["y5", "+- y6 0 ch2"],
			["x3", "+- r 0 ch"],
			["x4", "+- r 0 ch2"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"r",
						"ch2"
					],
					[
						"a",
						"ch2",
						"ch2",
						"0",
						"cd4"
					],
					[
						"l",
						"x4",
						"ch2"
					],
					[
						"a",
						"ch4",
						"ch4",
						"0",
						"cd2"
					],
					[
						"l",
						"x3",
						"ch"
					],
					[
						"l",
						"ch2",
						"ch"
					],
					[
						"a",
						"ch2",
						"ch2",
						"3cd4",
						"-5400000"
					],
					[
						"l",
						"l",
						"y7"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd2",
						"-10800000"
					],
					[
						"l",
						"ch",
						"y6"
					],
					[
						"l",
						"x4",
						"y6"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd4",
						"-5400000"
					],
					["c"],
					[
						"m",
						"ch2",
						"y4"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd4",
						"-5400000"
					],
					[
						"a",
						"ch4",
						"ch4",
						"0",
						"-10800000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"ch2",
						"y4"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd4",
						"-5400000"
					],
					[
						"a",
						"ch4",
						"ch4",
						"0",
						"-10800000"
					],
					["c"],
					[
						"m",
						"x4",
						"ch"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd4",
						"-16200000"
					],
					[
						"a",
						"ch4",
						"ch4",
						"cd2",
						"-10800000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"y3"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd2",
						"cd4"
					],
					[
						"l",
						"x3",
						"ch"
					],
					[
						"l",
						"x3",
						"ch2"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd2",
						"cd2"
					],
					[
						"l",
						"r",
						"y5"
					],
					[
						"a",
						"ch2",
						"ch2",
						"0",
						"cd4"
					],
					[
						"l",
						"ch",
						"y6"
					],
					[
						"l",
						"ch",
						"y7"
					],
					[
						"a",
						"ch2",
						"ch2",
						"0",
						"cd2"
					],
					["c"],
					[
						"m",
						"x3",
						"ch"
					],
					[
						"l",
						"x4",
						"ch"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd4",
						"-5400000"
					],
					[
						"m",
						"x4",
						"ch"
					],
					[
						"l",
						"x4",
						"ch2"
					],
					[
						"a",
						"ch4",
						"ch4",
						"0",
						"cd2"
					],
					[
						"m",
						"ch2",
						"y4"
					],
					[
						"l",
						"ch2",
						"y3"
					],
					[
						"a",
						"ch4",
						"ch4",
						"cd2",
						"cd2"
					],
					[
						"a",
						"ch2",
						"ch2",
						"0",
						"cd2"
					],
					[
						"m",
						"ch",
						"y3"
					],
					[
						"l",
						"ch",
						"y6"
					]
				]
			}
		]
	},
	irregularseal1: {
		adj: [],
		gd: [
			["x5", "*/ w 4627 21600"],
			["x12", "*/ w 8485 21600"],
			["x21", "*/ w 16702 21600"],
			["x24", "*/ w 14522 21600"],
			["y3", "*/ h 6320 21600"],
			["y6", "*/ h 8615 21600"],
			["y9", "*/ h 13937 21600"],
			["y18", "*/ h 13290 21600"]
		],
		paths: [{
			w: 21600,
			h: 21600,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"10800",
					"5800"
				],
				[
					"l",
					"14522",
					"0"
				],
				[
					"l",
					"14155",
					"5325"
				],
				[
					"l",
					"18380",
					"4457"
				],
				[
					"l",
					"16702",
					"7315"
				],
				[
					"l",
					"21097",
					"8137"
				],
				[
					"l",
					"17607",
					"10475"
				],
				[
					"l",
					"21600",
					"13290"
				],
				[
					"l",
					"16837",
					"12942"
				],
				[
					"l",
					"18145",
					"18095"
				],
				[
					"l",
					"14020",
					"14457"
				],
				[
					"l",
					"13247",
					"19737"
				],
				[
					"l",
					"10532",
					"14935"
				],
				[
					"l",
					"8485",
					"21600"
				],
				[
					"l",
					"7715",
					"15627"
				],
				[
					"l",
					"4762",
					"17617"
				],
				[
					"l",
					"5667",
					"13937"
				],
				[
					"l",
					"135",
					"14587"
				],
				[
					"l",
					"3722",
					"11775"
				],
				[
					"l",
					"0",
					"8615"
				],
				[
					"l",
					"4627",
					"7617"
				],
				[
					"l",
					"370",
					"2295"
				],
				[
					"l",
					"7312",
					"6320"
				],
				[
					"l",
					"8352",
					"2295"
				],
				["c"]
			]
		}]
	},
	irregularseal2: {
		adj: [],
		gd: [
			["x2", "*/ w 9722 21600"],
			["x5", "*/ w 5372 21600"],
			["x16", "*/ w 11612 21600"],
			["x19", "*/ w 14640 21600"],
			["y2", "*/ h 1887 21600"],
			["y3", "*/ h 6382 21600"],
			["y8", "*/ h 12877 21600"],
			["y14", "*/ h 19712 21600"],
			["y16", "*/ h 18842 21600"],
			["y17", "*/ h 15935 21600"],
			["y24", "*/ h 6645 21600"]
		],
		paths: [{
			w: 21600,
			h: 21600,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"11462",
					"4342"
				],
				[
					"l",
					"14790",
					"0"
				],
				[
					"l",
					"14525",
					"5777"
				],
				[
					"l",
					"18007",
					"3172"
				],
				[
					"l",
					"16380",
					"6532"
				],
				[
					"l",
					"21600",
					"6645"
				],
				[
					"l",
					"16985",
					"9402"
				],
				[
					"l",
					"18270",
					"11290"
				],
				[
					"l",
					"16380",
					"12310"
				],
				[
					"l",
					"18877",
					"15632"
				],
				[
					"l",
					"14640",
					"14350"
				],
				[
					"l",
					"14942",
					"17370"
				],
				[
					"l",
					"12180",
					"15935"
				],
				[
					"l",
					"11612",
					"18842"
				],
				[
					"l",
					"9872",
					"17370"
				],
				[
					"l",
					"8700",
					"19712"
				],
				[
					"l",
					"7527",
					"18125"
				],
				[
					"l",
					"4917",
					"21600"
				],
				[
					"l",
					"4805",
					"18240"
				],
				[
					"l",
					"1285",
					"17825"
				],
				[
					"l",
					"3330",
					"15370"
				],
				[
					"l",
					"0",
					"12877"
				],
				[
					"l",
					"3935",
					"11592"
				],
				[
					"l",
					"1172",
					"8270"
				],
				[
					"l",
					"5372",
					"7817"
				],
				[
					"l",
					"4502",
					"3625"
				],
				[
					"l",
					"8550",
					"6382"
				],
				[
					"l",
					"9722",
					"1887"
				],
				["c"]
			]
		}]
	},
	leftarrow: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["maxAdj2", "*/ 100000 w ss"],
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 0 adj2 maxAdj2"],
			["dx2", "*/ ss a2 100000"],
			["x2", "+- l dx2 0"],
			["dy1", "*/ h a1 200000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc dy1 0"],
			["dx1", "*/ y1 dx2 hd2"],
			["x1", "+- x2  0 dx1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"r",
					"y1"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"b"
				],
				["c"]
			]
		}]
	},
	leftarrowcallout: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"],
			["adj4", "val 64977"]
		],
		gd: [
			["maxAdj2", "*/ 50000 h ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["maxAdj3", "*/ 100000 w ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["q2", "*/ a3 ss w"],
			["maxAdj4", "+- 100000 0 q2"],
			["a4", "pin 0 adj4 maxAdj4"],
			["dy1", "*/ ss a2 100000"],
			["dy2", "*/ ss a1 200000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc dy2 0"],
			["y4", "+- vc dy1 0"],
			["x1", "*/ ss a3 100000"],
			["dx2", "*/ w a4 100000"],
			["x2", "+- r 0 dx2"],
			["x3", "+/ x2 r 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"x2",
					"y3"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"x1",
					"y4"
				],
				["c"]
			]
		}]
	},
	leftbrace: {
		adj: [["adj1", "val 8333"], ["adj2", "val 50000"]],
		gd: [
			["a2", "pin 0 adj2 100000"],
			["q1", "+- 100000 0 a2"],
			["q2", "min q1 a2"],
			["q3", "*/ q2 1 2"],
			["maxAdj1", "*/ q3 h ss"],
			["a1", "pin 0 adj1 maxAdj1"],
			["y1", "*/ ss a1 100000"],
			["y3", "*/ h a2 100000"],
			["y4", "+- y3 y1 0"],
			["dx1", "cos wd2 2700000"],
			["dy1", "sin y1 2700000"],
			["il", "+- r 0 dx1"],
			["it", "+- y1 0 dy1"],
			["ib", "+- b dy1 y1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"r",
					"b"
				],
				[
					"a",
					"wd2",
					"y1",
					"cd4",
					"cd4"
				],
				[
					"l",
					"hc",
					"y4"
				],
				[
					"a",
					"wd2",
					"y1",
					"0",
					"-5400000"
				],
				[
					"a",
					"wd2",
					"y1",
					"cd4",
					"-5400000"
				],
				[
					"l",
					"hc",
					"y1"
				],
				[
					"a",
					"wd2",
					"y1",
					"cd2",
					"cd4"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"r",
					"b"
				],
				[
					"a",
					"wd2",
					"y1",
					"cd4",
					"cd4"
				],
				[
					"l",
					"hc",
					"y4"
				],
				[
					"a",
					"wd2",
					"y1",
					"0",
					"-5400000"
				],
				[
					"a",
					"wd2",
					"y1",
					"cd4",
					"-5400000"
				],
				[
					"l",
					"hc",
					"y1"
				],
				[
					"a",
					"wd2",
					"y1",
					"cd2",
					"cd4"
				]
			]
		}]
	},
	leftbracket: {
		adj: [["adj", "val 8333"]],
		gd: [
			["maxAdj", "*/ 50000 h ss"],
			["a", "pin 0 adj maxAdj"],
			["y1", "*/ ss a 100000"],
			["y2", "+- b 0 y1"],
			["dx1", "cos w 2700000"],
			["dy1", "sin y1 2700000"],
			["il", "+- r 0 dx1"],
			["it", "+- y1 0 dy1"],
			["ib", "+- b dy1 y1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"r",
					"b"
				],
				[
					"a",
					"w",
					"y1",
					"cd4",
					"cd4"
				],
				[
					"l",
					"l",
					"y1"
				],
				[
					"a",
					"w",
					"y1",
					"cd2",
					"cd4"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"r",
					"b"
				],
				[
					"a",
					"w",
					"y1",
					"cd4",
					"cd4"
				],
				[
					"l",
					"l",
					"y1"
				],
				[
					"a",
					"w",
					"y1",
					"cd2",
					"cd4"
				]
			]
		}]
	},
	leftcirculararrow: {
		adj: [
			["adj1", "val 12500"],
			["adj2", "val -1142319"],
			["adj3", "val 1142319"],
			["adj4", "val 10800000"],
			["adj5", "val 12500"]
		],
		gd: [
			["a5", "pin 0 adj5 25000"],
			["maxAdj1", "*/ a5 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["enAng", "pin 1 adj3 21599999"],
			["stAng", "pin 0 adj4 21599999"],
			["th", "*/ ss a1 100000"],
			["thh", "*/ ss a5 100000"],
			["th2", "*/ th 1 2"],
			["rw1", "+- wd2 th2 thh"],
			["rh1", "+- hd2 th2 thh"],
			["rw2", "+- rw1 0 th"],
			["rh2", "+- rh1 0 th"],
			["rw3", "+- rw2 th2 0"],
			["rh3", "+- rh2 th2 0"],
			["wtH", "sin rw3 enAng"],
			["htH", "cos rh3 enAng"],
			["dxH", "cat2 rw3 htH wtH"],
			["dyH", "sat2 rh3 htH wtH"],
			["xH", "+- hc dxH 0"],
			["yH", "+- vc dyH 0"],
			["rI", "min rw2 rh2"],
			["u1", "*/ dxH dxH 1"],
			["u2", "*/ dyH dyH 1"],
			["u3", "*/ rI rI 1"],
			["u4", "+- u1 0 u3"],
			["u5", "+- u2 0 u3"],
			["u6", "*/ u4 u5 u1"],
			["u7", "*/ u6 1 u2"],
			["u8", "+- 1 0 u7"],
			["u9", "sqrt u8"],
			["u10", "*/ u4 1 dxH"],
			["u11", "*/ u10 1 dyH"],
			["u12", "+/ 1 u9 u11"],
			["u13", "at2 1 u12"],
			["u14", "+- u13 21600000 0"],
			["u15", "?: u13 u13 u14"],
			["u16", "+- u15 0 enAng"],
			["u17", "+- u16 21600000 0"],
			["u18", "?: u16 u16 u17"],
			["u19", "+- u18 0 cd2"],
			["u20", "+- u18 0 21600000"],
			["u21", "?: u19 u20 u18"],
			["u22", "abs u21"],
			["minAng", "*/ u22 -1 1"],
			["u23", "abs adj2"],
			["a2", "*/ u23 -1 1"],
			["aAng", "pin minAng a2 0"],
			["ptAng", "+- enAng aAng 0"],
			["wtA", "sin rw3 ptAng"],
			["htA", "cos rh3 ptAng"],
			["dxA", "cat2 rw3 htA wtA"],
			["dyA", "sat2 rh3 htA wtA"],
			["xA", "+- hc dxA 0"],
			["yA", "+- vc dyA 0"],
			["wtE", "sin rw1 stAng"],
			["htE", "cos rh1 stAng"],
			["dxE", "cat2 rw1 htE wtE"],
			["dyE", "sat2 rh1 htE wtE"],
			["xE", "+- hc dxE 0"],
			["yE", "+- vc dyE 0"],
			["wtD", "sin rw2 stAng"],
			["htD", "cos rh2 stAng"],
			["dxD", "cat2 rw2 htD wtD"],
			["dyD", "sat2 rh2 htD wtD"],
			["xD", "+- hc dxD 0"],
			["yD", "+- vc dyD 0"],
			["dxG", "cos thh ptAng"],
			["dyG", "sin thh ptAng"],
			["xG", "+- xH dxG 0"],
			["yG", "+- yH dyG 0"],
			["dxB", "cos thh ptAng"],
			["dyB", "sin thh ptAng"],
			["xB", "+- xH 0 dxB 0"],
			["yB", "+- yH 0 dyB 0"],
			["sx1", "+- xB 0 hc"],
			["sy1", "+- yB 0 vc"],
			["sx2", "+- xG 0 hc"],
			["sy2", "+- yG 0 vc"],
			["rO", "min rw1 rh1"],
			["x1O", "*/ sx1 rO rw1"],
			["y1O", "*/ sy1 rO rh1"],
			["x2O", "*/ sx2 rO rw1"],
			["y2O", "*/ sy2 rO rh1"],
			["dxO", "+- x2O 0 x1O"],
			["dyO", "+- y2O 0 y1O"],
			["dO", "mod dxO dyO 0"],
			["q1", "*/ x1O y2O 1"],
			["q2", "*/ x2O y1O 1"],
			["DO", "+- q1 0 q2"],
			["q3", "*/ rO rO 1"],
			["q4", "*/ dO dO 1"],
			["q5", "*/ q3 q4 1"],
			["q6", "*/ DO DO 1"],
			["q7", "+- q5 0 q6"],
			["q8", "max q7 0"],
			["sdelO", "sqrt q8"],
			["ndyO", "*/ dyO -1 1"],
			["sdyO", "?: ndyO -1 1"],
			["q9", "*/ sdyO dxO 1"],
			["q10", "*/ q9 sdelO 1"],
			["q11", "*/ DO dyO 1"],
			["dxF1", "+/ q11 q10 q4"],
			["q12", "+- q11 0 q10"],
			["dxF2", "*/ q12 1 q4"],
			["adyO", "abs dyO"],
			["q13", "*/ adyO sdelO 1"],
			["q14", "*/ DO dxO -1"],
			["dyF1", "+/ q14 q13 q4"],
			["q15", "+- q14 0 q13"],
			["dyF2", "*/ q15 1 q4"],
			["q16", "+- x2O 0 dxF1"],
			["q17", "+- x2O 0 dxF2"],
			["q18", "+- y2O 0 dyF1"],
			["q19", "+- y2O 0 dyF2"],
			["q20", "mod q16 q18 0"],
			["q21", "mod q17 q19 0"],
			["q22", "+- q21 0 q20"],
			["dxF", "?: q22 dxF1 dxF2"],
			["dyF", "?: q22 dyF1 dyF2"],
			["sdxF", "*/ dxF rw1 rO"],
			["sdyF", "*/ dyF rh1 rO"],
			["xF", "+- hc sdxF 0"],
			["yF", "+- vc sdyF 0"],
			["x1I", "*/ sx1 rI rw2"],
			["y1I", "*/ sy1 rI rh2"],
			["x2I", "*/ sx2 rI rw2"],
			["y2I", "*/ sy2 rI rh2"],
			["dxI", "+- x2I 0 x1I"],
			["dyI", "+- y2I 0 y1I"],
			["dI", "mod dxI dyI 0"],
			["v1", "*/ x1I y2I 1"],
			["v2", "*/ x2I y1I 1"],
			["DI", "+- v1 0 v2"],
			["v3", "*/ rI rI 1"],
			["v4", "*/ dI dI 1"],
			["v5", "*/ v3 v4 1"],
			["v6", "*/ DI DI 1"],
			["v7", "+- v5 0 v6"],
			["v8", "max v7 0"],
			["sdelI", "sqrt v8"],
			["v9", "*/ sdyO dxI 1"],
			["v10", "*/ v9 sdelI 1"],
			["v11", "*/ DI dyI 1"],
			["dxC1", "+/ v11 v10 v4"],
			["v12", "+- v11 0 v10"],
			["dxC2", "*/ v12 1 v4"],
			["adyI", "abs dyI"],
			["v13", "*/ adyI sdelI 1"],
			["v14", "*/ DI dxI -1"],
			["dyC1", "+/ v14 v13 v4"],
			["v15", "+- v14 0 v13"],
			["dyC2", "*/ v15 1 v4"],
			["v16", "+- x1I 0 dxC1"],
			["v17", "+- x1I 0 dxC2"],
			["v18", "+- y1I 0 dyC1"],
			["v19", "+- y1I 0 dyC2"],
			["v20", "mod v16 v18 0"],
			["v21", "mod v17 v19 0"],
			["v22", "+- v21 0 v20"],
			["dxC", "?: v22 dxC1 dxC2"],
			["dyC", "?: v22 dyC1 dyC2"],
			["sdxC", "*/ dxC rw2 rI"],
			["sdyC", "*/ dyC rh2 rI"],
			["xC", "+- hc sdxC 0"],
			["yC", "+- vc sdyC 0"],
			["ist0", "at2 sdxC sdyC"],
			["ist1", "+- ist0 21600000 0"],
			["istAng0", "?: ist0 ist0 ist1"],
			["isw1", "+- stAng 0 istAng0"],
			["isw2", "+- isw1 21600000 0"],
			["iswAng0", "?: isw1 isw1 isw2"],
			["istAng", "+- istAng0 iswAng0 0"],
			["iswAng", "+- 0 0 iswAng0"],
			["p1", "+- xF 0 xC"],
			["p2", "+- yF 0 yC"],
			["p3", "mod p1 p2 0"],
			["p4", "*/ p3 1 2"],
			["p5", "+- p4 0 thh"],
			["xGp", "?: p5 xF xG"],
			["yGp", "?: p5 yF yG"],
			["xBp", "?: p5 xC xB"],
			["yBp", "?: p5 yC yB"],
			["en0", "at2 sdxF sdyF"],
			["en1", "+- en0 21600000 0"],
			["en2", "?: en0 en0 en1"],
			["sw0", "+- en2 0 stAng"],
			["sw1", "+- sw0 0 21600000"],
			["swAng", "?: sw0 sw1 sw0"],
			["stAng0", "+- stAng swAng 0"],
			["swAng0", "+- 0 0 swAng"],
			["wtI", "sin rw3 stAng"],
			["htI", "cos rh3 stAng"],
			["dxI", "cat2 rw3 htI wtI"],
			["dyI", "sat2 rh3 htI wtI"],
			["xI", "+- hc dxI 0"],
			["yI", "+- vc dyI 0"],
			["aI", "+- stAng cd4 0"],
			["aA", "+- ptAng 0 cd4"],
			["aB", "+- ptAng cd2 0"],
			["idx", "cos rw1 2700000"],
			["idy", "sin rh1 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"xE",
					"yE"
				],
				[
					"l",
					"xD",
					"yD"
				],
				[
					"a",
					"rw2",
					"rh2",
					"istAng",
					"iswAng"
				],
				[
					"l",
					"xBp",
					"yBp"
				],
				[
					"l",
					"xA",
					"yA"
				],
				[
					"l",
					"xGp",
					"yGp"
				],
				[
					"l",
					"xF",
					"yF"
				],
				[
					"a",
					"rw1",
					"rh1",
					"stAng0",
					"swAng0"
				],
				["c"]
			]
		}]
	},
	leftrightarrow: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["maxAdj2", "*/ 50000 w ss"],
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 0 adj2 maxAdj2"],
			["x2", "*/ ss a2 100000"],
			["x3", "+- r 0 x2"],
			["dy", "*/ h a1 200000"],
			["y1", "+- vc 0 dy"],
			["y2", "+- vc dy 0"],
			["dx1", "*/ y1 x2 hd2"],
			["x1", "+- x2 0 dx1"],
			["x4", "+- x3 dx1 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x3",
					"y1"
				],
				[
					"l",
					"x3",
					"t"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x3",
					"b"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"b"
				],
				["c"]
			]
		}]
	},
	leftrightarrowcallout: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"],
			["adj4", "val 48123"]
		],
		gd: [
			["maxAdj2", "*/ 50000 h ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["maxAdj3", "*/ 50000 w ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["q2", "*/ a3 ss wd2"],
			["maxAdj4", "+- 100000 0 q2"],
			["a4", "pin 0 adj4 maxAdj4"],
			["dy1", "*/ ss a2 100000"],
			["dy2", "*/ ss a1 200000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc dy2 0"],
			["y4", "+- vc dy1 0"],
			["x1", "*/ ss a3 100000"],
			["x4", "+- r 0 x1"],
			["dx2", "*/ w a4 200000"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"x3",
					"t"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"x4",
					"y2"
				],
				[
					"l",
					"x4",
					"y1"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x4",
					"y4"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x3",
					"b"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"x2",
					"y3"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"x1",
					"y4"
				],
				["c"]
			]
		}]
	},
	leftrightcirculararrow: {
		adj: [
			["adj1", "val 12500"],
			["adj2", "val 1142319"],
			["adj3", "val 20457681"],
			["adj4", "val 11942319"],
			["adj5", "val 12500"]
		],
		gd: [
			["a5", "pin 0 adj5 25000"],
			["maxAdj1", "*/ a5 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["enAng", "pin 1 adj3 21599999"],
			["stAng", "pin 0 adj4 21599999"],
			["th", "*/ ss a1 100000"],
			["thh", "*/ ss a5 100000"],
			["th2", "*/ th 1 2"],
			["rw1", "+- wd2 th2 thh"],
			["rh1", "+- hd2 th2 thh"],
			["rw2", "+- rw1 0 th"],
			["rh2", "+- rh1 0 th"],
			["rw3", "+- rw2 th2 0"],
			["rh3", "+- rh2 th2 0"],
			["wtH", "sin rw3 enAng"],
			["htH", "cos rh3 enAng"],
			["dxH", "cat2 rw3 htH wtH"],
			["dyH", "sat2 rh3 htH wtH"],
			["xH", "+- hc dxH 0"],
			["yH", "+- vc dyH 0"],
			["rI", "min rw2 rh2"],
			["u1", "*/ dxH dxH 1"],
			["u2", "*/ dyH dyH 1"],
			["u3", "*/ rI rI 1"],
			["u4", "+- u1 0 u3"],
			["u5", "+- u2 0 u3"],
			["u6", "*/ u4 u5 u1"],
			["u7", "*/ u6 1 u2"],
			["u8", "+- 1 0 u7"],
			["u9", "sqrt u8"],
			["u10", "*/ u4 1 dxH"],
			["u11", "*/ u10 1 dyH"],
			["u12", "+/ 1 u9 u11"],
			["u13", "at2 1 u12"],
			["u14", "+- u13 21600000 0"],
			["u15", "?: u13 u13 u14"],
			["u16", "+- u15 0 enAng"],
			["u17", "+- u16 21600000 0"],
			["u18", "?: u16 u16 u17"],
			["u19", "+- u18 0 cd2"],
			["u20", "+- u18 0 21600000"],
			["u21", "?: u19 u20 u18"],
			["maxAng", "abs u21"],
			["aAng", "pin 0 adj2 maxAng"],
			["ptAng", "+- enAng aAng 0"],
			["wtA", "sin rw3 ptAng"],
			["htA", "cos rh3 ptAng"],
			["dxA", "cat2 rw3 htA wtA"],
			["dyA", "sat2 rh3 htA wtA"],
			["xA", "+- hc dxA 0"],
			["yA", "+- vc dyA 0"],
			["dxG", "cos thh ptAng"],
			["dyG", "sin thh ptAng"],
			["xG", "+- xH dxG 0"],
			["yG", "+- yH dyG 0"],
			["dxB", "cos thh ptAng"],
			["dyB", "sin thh ptAng"],
			["xB", "+- xH 0 dxB 0"],
			["yB", "+- yH 0 dyB 0"],
			["sx1", "+- xB 0 hc"],
			["sy1", "+- yB 0 vc"],
			["sx2", "+- xG 0 hc"],
			["sy2", "+- yG 0 vc"],
			["rO", "min rw1 rh1"],
			["x1O", "*/ sx1 rO rw1"],
			["y1O", "*/ sy1 rO rh1"],
			["x2O", "*/ sx2 rO rw1"],
			["y2O", "*/ sy2 rO rh1"],
			["dxO", "+- x2O 0 x1O"],
			["dyO", "+- y2O 0 y1O"],
			["dO", "mod dxO dyO 0"],
			["q1", "*/ x1O y2O 1"],
			["q2", "*/ x2O y1O 1"],
			["DO", "+- q1 0 q2"],
			["q3", "*/ rO rO 1"],
			["q4", "*/ dO dO 1"],
			["q5", "*/ q3 q4 1"],
			["q6", "*/ DO DO 1"],
			["q7", "+- q5 0 q6"],
			["q8", "max q7 0"],
			["sdelO", "sqrt q8"],
			["ndyO", "*/ dyO -1 1"],
			["sdyO", "?: ndyO -1 1"],
			["q9", "*/ sdyO dxO 1"],
			["q10", "*/ q9 sdelO 1"],
			["q11", "*/ DO dyO 1"],
			["dxF1", "+/ q11 q10 q4"],
			["q12", "+- q11 0 q10"],
			["dxF2", "*/ q12 1 q4"],
			["adyO", "abs dyO"],
			["q13", "*/ adyO sdelO 1"],
			["q14", "*/ DO dxO -1"],
			["dyF1", "+/ q14 q13 q4"],
			["q15", "+- q14 0 q13"],
			["dyF2", "*/ q15 1 q4"],
			["q16", "+- x2O 0 dxF1"],
			["q17", "+- x2O 0 dxF2"],
			["q18", "+- y2O 0 dyF1"],
			["q19", "+- y2O 0 dyF2"],
			["q20", "mod q16 q18 0"],
			["q21", "mod q17 q19 0"],
			["q22", "+- q21 0 q20"],
			["dxF", "?: q22 dxF1 dxF2"],
			["dyF", "?: q22 dyF1 dyF2"],
			["sdxF", "*/ dxF rw1 rO"],
			["sdyF", "*/ dyF rh1 rO"],
			["xF", "+- hc sdxF 0"],
			["yF", "+- vc sdyF 0"],
			["x1I", "*/ sx1 rI rw2"],
			["y1I", "*/ sy1 rI rh2"],
			["x2I", "*/ sx2 rI rw2"],
			["y2I", "*/ sy2 rI rh2"],
			["dxI", "+- x2I 0 x1I"],
			["dyI", "+- y2I 0 y1I"],
			["dI", "mod dxI dyI 0"],
			["v1", "*/ x1I y2I 1"],
			["v2", "*/ x2I y1I 1"],
			["DI", "+- v1 0 v2"],
			["v3", "*/ rI rI 1"],
			["v4", "*/ dI dI 1"],
			["v5", "*/ v3 v4 1"],
			["v6", "*/ DI DI 1"],
			["v7", "+- v5 0 v6"],
			["v8", "max v7 0"],
			["sdelI", "sqrt v8"],
			["v9", "*/ sdyO dxI 1"],
			["v10", "*/ v9 sdelI 1"],
			["v11", "*/ DI dyI 1"],
			["dxC1", "+/ v11 v10 v4"],
			["v12", "+- v11 0 v10"],
			["dxC2", "*/ v12 1 v4"],
			["adyI", "abs dyI"],
			["v13", "*/ adyI sdelI 1"],
			["v14", "*/ DI dxI -1"],
			["dyC1", "+/ v14 v13 v4"],
			["v15", "+- v14 0 v13"],
			["dyC2", "*/ v15 1 v4"],
			["v16", "+- x1I 0 dxC1"],
			["v17", "+- x1I 0 dxC2"],
			["v18", "+- y1I 0 dyC1"],
			["v19", "+- y1I 0 dyC2"],
			["v20", "mod v16 v18 0"],
			["v21", "mod v17 v19 0"],
			["v22", "+- v21 0 v20"],
			["dxC", "?: v22 dxC1 dxC2"],
			["dyC", "?: v22 dyC1 dyC2"],
			["sdxC", "*/ dxC rw2 rI"],
			["sdyC", "*/ dyC rh2 rI"],
			["xC", "+- hc sdxC 0"],
			["yC", "+- vc sdyC 0"],
			["wtI", "sin rw3 stAng"],
			["htI", "cos rh3 stAng"],
			["dxI", "cat2 rw3 htI wtI"],
			["dyI", "sat2 rh3 htI wtI"],
			["xI", "+- hc dxI 0"],
			["yI", "+- vc dyI 0"],
			["lptAng", "+- stAng 0 aAng"],
			["wtL", "sin rw3 lptAng"],
			["htL", "cos rh3 lptAng"],
			["dxL", "cat2 rw3 htL wtL"],
			["dyL", "sat2 rh3 htL wtL"],
			["xL", "+- hc dxL 0"],
			["yL", "+- vc dyL 0"],
			["dxK", "cos thh lptAng"],
			["dyK", "sin thh lptAng"],
			["xK", "+- xI dxK 0"],
			["yK", "+- yI dyK 0"],
			["dxJ", "cos thh lptAng"],
			["dyJ", "sin thh lptAng"],
			["xJ", "+- xI 0 dxJ 0"],
			["yJ", "+- yI 0 dyJ 0"],
			["p1", "+- xF 0 xC"],
			["p2", "+- yF 0 yC"],
			["p3", "mod p1 p2 0"],
			["p4", "*/ p3 1 2"],
			["p5", "+- p4 0 thh"],
			["xGp", "?: p5 xF xG"],
			["yGp", "?: p5 yF yG"],
			["xBp", "?: p5 xC xB"],
			["yBp", "?: p5 yC yB"],
			["en0", "at2 sdxF sdyF"],
			["en1", "+- en0 21600000 0"],
			["en2", "?: en0 en0 en1"],
			["od0", "+- en2 0 enAng"],
			["od1", "+- od0 21600000 0"],
			["od2", "?: od0 od0 od1"],
			["st0", "+- stAng 0 od2"],
			["st1", "+- st0 21600000 0"],
			["st2", "?: st0 st0 st1"],
			["sw0", "+- en2 0 st2"],
			["sw1", "+- sw0 21600000 0"],
			["swAng", "?: sw0 sw0 sw1"],
			["ist0", "at2 sdxC sdyC"],
			["ist1", "+- ist0 21600000 0"],
			["istAng", "?: ist0 ist0 ist1"],
			["id0", "+- istAng 0 enAng"],
			["id1", "+- id0 0 21600000"],
			["id2", "?: id0 id1 id0"],
			["ien0", "+- stAng 0 id2"],
			["ien1", "+- ien0 0 21600000"],
			["ien2", "?: ien1 ien1 ien0"],
			["isw1", "+- ien2 0 istAng"],
			["isw2", "+- isw1 0 21600000"],
			["iswAng", "?: isw1 isw2 isw1"],
			["wtE", "sin rw1 st2"],
			["htE", "cos rh1 st2"],
			["dxE", "cat2 rw1 htE wtE"],
			["dyE", "sat2 rh1 htE wtE"],
			["xE", "+- hc dxE 0"],
			["yE", "+- vc dyE 0"],
			["wtD", "sin rw2 ien2"],
			["htD", "cos rh2 ien2"],
			["dxD", "cat2 rw2 htD wtD"],
			["dyD", "sat2 rh2 htD wtD"],
			["xD", "+- hc dxD 0"],
			["yD", "+- vc dyD 0"],
			["xKp", "?: p5 xE xK"],
			["yKp", "?: p5 yE yK"],
			["xJp", "?: p5 xD xJ"],
			["yJp", "?: p5 yD yJ"],
			["aL", "+- lptAng 0 cd4"],
			["aA", "+- ptAng cd4 0"],
			["aB", "+- ptAng cd2 0"],
			["aJ", "+- lptAng cd2 0"],
			["idx", "cos rw1 2700000"],
			["idy", "sin rh1 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"xL",
					"yL"
				],
				[
					"l",
					"xKp",
					"yKp"
				],
				[
					"l",
					"xE",
					"yE"
				],
				[
					"a",
					"rw1",
					"rh1",
					"st2",
					"swAng"
				],
				[
					"l",
					"xGp",
					"yGp"
				],
				[
					"l",
					"xA",
					"yA"
				],
				[
					"l",
					"xBp",
					"yBp"
				],
				[
					"l",
					"xC",
					"yC"
				],
				[
					"a",
					"rw2",
					"rh2",
					"istAng",
					"iswAng"
				],
				[
					"l",
					"xJp",
					"yJp"
				],
				["c"]
			]
		}]
	},
	leftrightribbon: {
		adj: [
			["adj1", "val 50000"],
			["adj2", "val 50000"],
			["adj3", "val 16667"]
		],
		gd: [
			["a3", "pin 0 adj3 33333"],
			["maxAdj1", "+- 100000 0 a3"],
			["a1", "pin 0 adj1 maxAdj1"],
			["w1", "+- wd2 0 wd32"],
			["maxAdj2", "*/ 100000 w1 ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["x1", "*/ ss a2 100000"],
			["x4", "+- r 0 x1"],
			["dy1", "*/ h a1 200000"],
			["dy2", "*/ h a3 -200000"],
			["ly1", "+- vc dy2 dy1"],
			["ry4", "+- vc dy1 dy2"],
			["ly2", "+- ly1 dy1 0"],
			["ry3", "+- b 0 ly2"],
			["ly4", "*/ ly2 2 1"],
			["ry1", "+- b 0 ly4"],
			["ly3", "+- ly4 0 ly1"],
			["ry2", "+- b 0 ly3"],
			["hR", "*/ a3 ss 400000"],
			["x2", "+- hc 0 wd32"],
			["x3", "+- hc wd32 0"],
			["y1", "+- ly1 hR 0"],
			["y2", "+- ry2 0 hR"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"ly2"
					],
					[
						"l",
						"x1",
						"t"
					],
					[
						"l",
						"x1",
						"ly1"
					],
					[
						"l",
						"hc",
						"ly1"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"cd2"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"-10800000"
					],
					[
						"l",
						"x4",
						"ry2"
					],
					[
						"l",
						"x4",
						"ry1"
					],
					[
						"l",
						"r",
						"ry3"
					],
					[
						"l",
						"x4",
						"b"
					],
					[
						"l",
						"x4",
						"ry4"
					],
					[
						"l",
						"hc",
						"ry4"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"cd4"
					],
					[
						"l",
						"x2",
						"ly3"
					],
					[
						"l",
						"x1",
						"ly3"
					],
					[
						"l",
						"x1",
						"ly4"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x3",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"0",
						"cd4"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"-10800000"
					],
					[
						"l",
						"x3",
						"ry2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"ly2"
					],
					[
						"l",
						"x1",
						"t"
					],
					[
						"l",
						"x1",
						"ly1"
					],
					[
						"l",
						"hc",
						"ly1"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"cd2"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"-10800000"
					],
					[
						"l",
						"x4",
						"ry2"
					],
					[
						"l",
						"x4",
						"ry1"
					],
					[
						"l",
						"r",
						"ry3"
					],
					[
						"l",
						"x4",
						"b"
					],
					[
						"l",
						"x4",
						"ry4"
					],
					[
						"l",
						"hc",
						"ry4"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"cd4"
					],
					[
						"l",
						"x2",
						"ly3"
					],
					[
						"l",
						"x1",
						"ly3"
					],
					[
						"l",
						"x1",
						"ly4"
					],
					["c"],
					[
						"m",
						"x3",
						"y1"
					],
					[
						"l",
						"x3",
						"ry2"
					],
					[
						"m",
						"x2",
						"y2"
					],
					[
						"l",
						"x2",
						"ly3"
					]
				]
			}
		]
	},
	leftrightuparrow: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"]
		],
		gd: [
			["a2", "pin 0 adj2 50000"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["q1", "+- 100000 0 maxAdj1"],
			["maxAdj3", "*/ q1 1 2"],
			["a3", "pin 0 adj3 maxAdj3"],
			["x1", "*/ ss a3 100000"],
			["dx2", "*/ ss a2 100000"],
			["x2", "+- hc 0 dx2"],
			["x5", "+- hc dx2 0"],
			["dx3", "*/ ss a1 200000"],
			["x3", "+- hc 0 dx3"],
			["x4", "+- hc dx3 0"],
			["x6", "+- r 0 x1"],
			["dy2", "*/ ss a2 50000"],
			["y2", "+- b 0 dy2"],
			["y4", "+- b 0 dx2"],
			["y3", "+- y4 0 dx3"],
			["y5", "+- y4 dx3 0"],
			["il", "*/ dx3 x1 dx2"],
			["ir", "+- r 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y4"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x3",
					"x1"
				],
				[
					"l",
					"x2",
					"x1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"x5",
					"x1"
				],
				[
					"l",
					"x4",
					"x1"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"x6",
					"y3"
				],
				[
					"l",
					"x6",
					"y2"
				],
				[
					"l",
					"r",
					"y4"
				],
				[
					"l",
					"x6",
					"b"
				],
				[
					"l",
					"x6",
					"y5"
				],
				[
					"l",
					"x1",
					"y5"
				],
				[
					"l",
					"x1",
					"b"
				],
				["c"]
			]
		}]
	},
	leftuparrow: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"]
		],
		gd: [
			["a2", "pin 0 adj2 50000"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["maxAdj3", "+- 100000 0 maxAdj1"],
			["a3", "pin 0 adj3 maxAdj3"],
			["x1", "*/ ss a3 100000"],
			["dx2", "*/ ss a2 50000"],
			["x2", "+- r 0 dx2"],
			["y2", "+- b 0 dx2"],
			["dx4", "*/ ss a2 100000"],
			["x4", "+- r 0 dx4"],
			["y4", "+- b 0 dx4"],
			["dx3", "*/ ss a1 200000"],
			["x3", "+- x4 0 dx3"],
			["x5", "+- x4 dx3 0"],
			["y3", "+- y4 0 dx3"],
			["y5", "+- y4 dx3 0"],
			["il", "*/ dx3 x1 dx4"],
			["cx1", "+/ x1 x5 2"],
			["cy1", "+/ x1 y5 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y4"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x3",
					"x1"
				],
				[
					"l",
					"x2",
					"x1"
				],
				[
					"l",
					"x4",
					"t"
				],
				[
					"l",
					"r",
					"x1"
				],
				[
					"l",
					"x5",
					"x1"
				],
				[
					"l",
					"x5",
					"y5"
				],
				[
					"l",
					"x1",
					"y5"
				],
				[
					"l",
					"x1",
					"b"
				],
				["c"]
			]
		}]
	},
	lightningbolt: {
		adj: [],
		gd: [
			["x1", "*/ w 5022 21600"],
			["x3", "*/ w 8472 21600"],
			["x4", "*/ w 8757 21600"],
			["x5", "*/ w 10012 21600"],
			["x8", "*/ w 12860 21600"],
			["x9", "*/ w 13917 21600"],
			["x11", "*/ w 16577 21600"],
			["y1", "*/ h 3890 21600"],
			["y2", "*/ h 6080 21600"],
			["y4", "*/ h 7437 21600"],
			["y6", "*/ h 9705 21600"],
			["y7", "*/ h 12007 21600"],
			["y10", "*/ h 14277 21600"],
			["y11", "*/ h 14915 21600"]
		],
		paths: [{
			w: 21600,
			h: 21600,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"8472",
					"0"
				],
				[
					"l",
					"12860",
					"6080"
				],
				[
					"l",
					"11050",
					"6797"
				],
				[
					"l",
					"16577",
					"12007"
				],
				[
					"l",
					"14767",
					"12877"
				],
				[
					"l",
					"21600",
					"21600"
				],
				[
					"l",
					"10012",
					"14915"
				],
				[
					"l",
					"12222",
					"13987"
				],
				[
					"l",
					"5022",
					"9705"
				],
				[
					"l",
					"7602",
					"8382"
				],
				[
					"l",
					"0",
					"3890"
				],
				["c"]
			]
		}]
	},
	line: {
		adj: [],
		gd: [],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"t"
			], [
				"l",
				"r",
				"b"
			]]
		}]
	},
	lineinv: {
		adj: [],
		gd: [],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"b"
			], [
				"l",
				"r",
				"t"
			]]
		}]
	},
	mathdivide: {
		adj: [
			["adj1", "val 23520"],
			["adj2", "val 5880"],
			["adj3", "val 11760"]
		],
		gd: [
			["a1", "pin 1000 adj1 36745"],
			["ma1", "+- 0 0 a1"],
			["ma3h", "+/ 73490 ma1 4"],
			["ma3w", "*/ 36745 w h"],
			["maxAdj3", "min ma3h ma3w"],
			["a3", "pin 1000 adj3 maxAdj3"],
			["m4a3", "*/ -4 a3 1"],
			["maxAdj2", "+- 73490 m4a3 a1"],
			["a2", "pin 0 adj2 maxAdj2"],
			["dy1", "*/ h a1 200000"],
			["yg", "*/ h a2 100000"],
			["rad", "*/ h a3 100000"],
			["dx1", "*/ w 73490 200000"],
			["y3", "+- vc 0 dy1"],
			["y4", "+- vc dy1 0"],
			["a", "+- yg rad 0"],
			["y2", "+- y3 0 a"],
			["y1", "+- y2 0 rad"],
			["y5", "+- b 0 y1"],
			["x1", "+- hc 0 dx1"],
			["x3", "+- hc dx1 0"],
			["x2", "+- hc 0 rad"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"hc",
					"y1"
				],
				[
					"a",
					"rad",
					"rad",
					"3cd4",
					"21600000"
				],
				["c"],
				[
					"m",
					"hc",
					"y5"
				],
				[
					"a",
					"rad",
					"rad",
					"cd4",
					"21600000"
				],
				["c"],
				[
					"m",
					"x1",
					"y3"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x3",
					"y4"
				],
				[
					"l",
					"x1",
					"y4"
				],
				["c"]
			]
		}]
	},
	mathequal: {
		adj: [["adj1", "val 23520"], ["adj2", "val 11760"]],
		gd: [
			["a1", "pin 0 adj1 36745"],
			["2a1", "*/ a1 2 1"],
			["mAdj2", "+- 100000 0 2a1"],
			["a2", "pin 0 adj2 mAdj2"],
			["dy1", "*/ h a1 100000"],
			["dy2", "*/ h a2 200000"],
			["dx1", "*/ w 73490 200000"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc dy2 0"],
			["y1", "+- y2 0 dy1"],
			["y4", "+- y3 dy1 0"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc dx1 0"],
			["yC1", "+/ y1 y2 2"],
			["yC2", "+/ y3 y4 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x1",
					"y2"
				],
				["c"],
				[
					"m",
					"x1",
					"y3"
				],
				[
					"l",
					"x2",
					"y3"
				],
				[
					"l",
					"x2",
					"y4"
				],
				[
					"l",
					"x1",
					"y4"
				],
				["c"]
			]
		}]
	},
	mathminus: {
		adj: [["adj1", "val 23520"]],
		gd: [
			["a1", "pin 0 adj1 100000"],
			["dy1", "*/ h a1 200000"],
			["dx1", "*/ w 73490 200000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc dy1 0"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc dx1 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x1",
					"y2"
				],
				["c"]
			]
		}]
	},
	mathmultiply: {
		adj: [["adj1", "val 23520"]],
		gd: [
			["a1", "pin 0 adj1 51965"],
			["th", "*/ ss a1 100000"],
			["a", "at2 w h"],
			["sa", "sin 1 a"],
			["ca", "cos 1 a"],
			["ta", "tan 1 a"],
			["dl", "mod w h 0"],
			["rw", "*/ dl 51965 100000"],
			["lM", "+- dl 0 rw"],
			["xM", "*/ ca lM 2"],
			["yM", "*/ sa lM 2"],
			["dxAM", "*/ sa th 2"],
			["dyAM", "*/ ca th 2"],
			["xA", "+- xM 0 dxAM"],
			["yA", "+- yM dyAM 0"],
			["xB", "+- xM dxAM 0"],
			["yB", "+- yM 0 dyAM"],
			["xBC", "+- hc 0 xB"],
			["yBC", "*/ xBC ta 1"],
			["yC", "+- yBC yB 0"],
			["xD", "+- r 0 xB"],
			["xE", "+- r 0 xA"],
			["yFE", "+- vc 0 yA"],
			["xFE", "*/ yFE 1 ta"],
			["xF", "+- xE 0 xFE"],
			["xL", "+- xA xFE 0"],
			["yG", "+- b 0 yA"],
			["yH", "+- b 0 yB"],
			["yI", "+- b 0 yC"],
			["xC2", "+- r 0 xM"],
			["yC3", "+- b 0 yM"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"xA",
					"yA"
				],
				[
					"l",
					"xB",
					"yB"
				],
				[
					"l",
					"hc",
					"yC"
				],
				[
					"l",
					"xD",
					"yB"
				],
				[
					"l",
					"xE",
					"yA"
				],
				[
					"l",
					"xF",
					"vc"
				],
				[
					"l",
					"xE",
					"yG"
				],
				[
					"l",
					"xD",
					"yH"
				],
				[
					"l",
					"hc",
					"yI"
				],
				[
					"l",
					"xB",
					"yH"
				],
				[
					"l",
					"xA",
					"yG"
				],
				[
					"l",
					"xL",
					"vc"
				],
				["c"]
			]
		}]
	},
	mathnotequal: {
		adj: [
			["adj1", "val 23520"],
			["adj2", "val 6600000"],
			["adj3", "val 11760"]
		],
		gd: [
			["a1", "pin 0 adj1 50000"],
			["crAng", "pin 4200000 adj2 6600000"],
			["2a1", "*/ a1 2 1"],
			["maxAdj3", "+- 100000 0 2a1"],
			["a3", "pin 0 adj3 maxAdj3"],
			["dy1", "*/ h a1 100000"],
			["dy2", "*/ h a3 200000"],
			["dx1", "*/ w 73490 200000"],
			["x1", "+- hc 0 dx1"],
			["x8", "+- hc dx1 0"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc dy2 0"],
			["y1", "+- y2 0 dy1"],
			["y4", "+- y3 dy1 0"],
			["cadj2", "+- crAng 0 cd4"],
			["xadj2", "tan hd2 cadj2"],
			["len", "mod xadj2 hd2 0"],
			["bhw", "*/ len dy1 hd2"],
			["bhw2", "*/ bhw 1 2"],
			["x7", "+- hc xadj2 bhw2"],
			["dx67", "*/ xadj2 y1 hd2"],
			["x6", "+- x7 0 dx67"],
			["dx57", "*/ xadj2 y2 hd2"],
			["x5", "+- x7 0 dx57"],
			["dx47", "*/ xadj2 y3 hd2"],
			["x4", "+- x7 0 dx47"],
			["dx37", "*/ xadj2 y4 hd2"],
			["x3", "+- x7 0 dx37"],
			["dx27", "*/ xadj2 2 1"],
			["x2", "+- x7 0 dx27"],
			["rx7", "+- x7 bhw 0"],
			["rx6", "+- x6 bhw 0"],
			["rx5", "+- x5 bhw 0"],
			["rx4", "+- x4 bhw 0"],
			["rx3", "+- x3 bhw 0"],
			["rx2", "+- x2 bhw 0"],
			["dx7", "*/ dy1 hd2 len"],
			["rxt", "+- x7 dx7 0"],
			["lxt", "+- rx7 0 dx7"],
			["rx", "?: cadj2 rxt rx7"],
			["lx", "?: cadj2 x7 lxt"],
			["dy3", "*/ dy1 xadj2 len"],
			["dy4", "+- 0 0 dy3"],
			["ry", "?: cadj2 dy3 t"],
			["ly", "?: cadj2 t dy4"],
			["dlx", "+- w 0 rx"],
			["drx", "+- w 0 lx"],
			["dly", "+- h 0 ry"],
			["dry", "+- h 0 ly"],
			["xC1", "+/ rx lx 2"],
			["xC2", "+/ drx dlx 2"],
			["yC1", "+/ ry ly 2"],
			["yC2", "+/ y1 y2 2"],
			["yC3", "+/ y3 y4 2"],
			["yC4", "+/ dry dly 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"l",
					"x6",
					"y1"
				],
				[
					"l",
					"lx",
					"ly"
				],
				[
					"l",
					"rx",
					"ry"
				],
				[
					"l",
					"rx6",
					"y1"
				],
				[
					"l",
					"x8",
					"y1"
				],
				[
					"l",
					"x8",
					"y2"
				],
				[
					"l",
					"rx5",
					"y2"
				],
				[
					"l",
					"rx4",
					"y3"
				],
				[
					"l",
					"x8",
					"y3"
				],
				[
					"l",
					"x8",
					"y4"
				],
				[
					"l",
					"rx3",
					"y4"
				],
				[
					"l",
					"drx",
					"dry"
				],
				[
					"l",
					"dlx",
					"dly"
				],
				[
					"l",
					"x3",
					"y4"
				],
				[
					"l",
					"x1",
					"y4"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"x5",
					"y2"
				],
				[
					"l",
					"x1",
					"y2"
				],
				["c"]
			]
		}]
	},
	mathplus: {
		adj: [["adj1", "val 23520"]],
		gd: [
			["a1", "pin 0 adj1 73490"],
			["dx1", "*/ w 73490 200000"],
			["dy1", "*/ h 73490 200000"],
			["dx2", "*/ ss a1 200000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"],
			["x4", "+- hc dx1 0"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc 0 dx2"],
			["y3", "+- vc dx2 0"],
			["y4", "+- vc dy1 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x3",
					"y1"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"x4",
					"y2"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x3",
					"y4"
				],
				[
					"l",
					"x2",
					"y4"
				],
				[
					"l",
					"x2",
					"y3"
				],
				[
					"l",
					"x1",
					"y3"
				],
				["c"]
			]
		}]
	},
	moon: {
		adj: [["adj", "val 50000"]],
		gd: [
			["a", "pin 0 adj 87500"],
			["g0", "*/ ss a 100000"],
			["g0w", "*/ g0 w ss"],
			["g1", "+- ss 0 g0"],
			["g2", "*/ g0 g0 g1"],
			["g3", "*/ ss ss g1"],
			["g4", "*/ g3 2 1"],
			["g5", "+- g4 0 g2"],
			["g6", "+- g5 0 g0"],
			["g6w", "*/ g6 w ss"],
			["g7", "*/ g5 1 2"],
			["g8", "+- g7 0 g0"],
			["dy1", "*/ g8 hd2 ss"],
			["g10h", "+- vc 0 dy1"],
			["g11h", "+- vc dy1 0"],
			["g12", "*/ g0 9598 32768"],
			["g12w", "*/ g12 w ss"],
			["g13", "+- ss 0 g12"],
			["q1", "*/ ss ss 1"],
			["q2", "*/ g13 g13 1"],
			["q3", "+- q1 0 q2"],
			["q4", "sqrt q3"],
			["dy4", "*/ q4 hd2 ss"],
			["g15h", "+- vc 0 dy4"],
			["g16h", "+- vc dy4 0"],
			["g17w", "+- g6w 0 g0w"],
			["g18w", "*/ g17w 1 2"],
			["dx2p", "+- g0w g18w w"],
			["dx2", "*/ dx2p -1 1"],
			["dy2", "*/ hd2 -1 1"],
			["stAng1", "at2 dx2 dy2"],
			["enAngp1", "at2 dx2 hd2"],
			["enAng1", "+- enAngp1 0 21600000"],
			["swAng1", "+- enAng1 0 stAng1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"r",
					"b"
				],
				[
					"a",
					"w",
					"hd2",
					"cd4",
					"cd2"
				],
				[
					"a",
					"g18w",
					"dy1",
					"stAng1",
					"swAng1"
				],
				["c"]
			]
		}]
	},
	nonisoscelestrapezoid: {
		adj: [["adj1", "val 25000"], ["adj2", "val 25000"]],
		gd: [
			["maxAdj", "*/ 50000 w ss"],
			["a1", "pin 0 adj1 maxAdj"],
			["a2", "pin 0 adj2 maxAdj"],
			["x1", "*/ ss a1 200000"],
			["x2", "*/ ss a1 100000"],
			["dx3", "*/ ss a2 100000"],
			["x3", "+- r 0 dx3"],
			["x4", "+/ r x3 2"],
			["il", "*/ wd3 a1 maxAdj"],
			["adjm", "max a1 a2"],
			["it", "*/ hd3 adjm maxAdj"],
			["irt", "*/ wd3 a2 maxAdj"],
			["ir", "+- r 0 irt"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"b"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"x3",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				["c"]
			]
		}]
	},
	nosmoking: {
		adj: [["adj", "val 18750"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dr", "*/ ss a 100000"],
			["iwd2", "+- wd2 0 dr"],
			["ihd2", "+- hd2 0 dr"],
			["ang", "at2 w h"],
			["ct", "cos ihd2 ang"],
			["st", "sin iwd2 ang"],
			["m", "mod ct st 0"],
			["n", "*/ iwd2 ihd2 m"],
			["drd2", "*/ dr 1 2"],
			["dang", "at2 n drd2"],
			["dang2", "*/ dang 2 1"],
			["swAng", "+- -10800000 dang2 0"],
			["t3", "at2 w h"],
			["stAng1", "+- t3 0 dang"],
			["stAng2", "+- stAng1 0 cd2"],
			["ct1", "cos ihd2 stAng1"],
			["st1", "sin iwd2 stAng1"],
			["m1", "mod ct1 st1 0"],
			["n1", "*/ iwd2 ihd2 m1"],
			["dx1", "cos n1 stAng1"],
			["dy1", "sin n1 stAng1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["x2", "+- hc 0 dx1"],
			["y2", "+- vc 0 dy1"],
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd2",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"3cd4",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"0",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd4",
					"cd4"
				],
				["c"],
				[
					"m",
					"x1",
					"y1"
				],
				[
					"a",
					"iwd2",
					"ihd2",
					"stAng1",
					"swAng"
				],
				["c"],
				[
					"m",
					"x2",
					"y2"
				],
				[
					"a",
					"iwd2",
					"ihd2",
					"stAng2",
					"swAng"
				],
				["c"]
			]
		}]
	},
	notchedrightarrow: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["maxAdj2", "*/ 100000 w ss"],
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 0 adj2 maxAdj2"],
			["dx2", "*/ ss a2 100000"],
			["x2", "+- r 0 dx2"],
			["dy1", "*/ h a1 200000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc dy1 0"],
			["x1", "*/ dy1 dx2 hd2"],
			["x3", "+- r 0 x1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y1"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"l",
					"y2"
				],
				[
					"l",
					"x1",
					"vc"
				],
				["c"]
			]
		}]
	},
	octagon: {
		adj: [["adj", "val 29289"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["x1", "*/ ss a 100000"],
			["x2", "+- r 0 x1"],
			["y2", "+- b 0 x1"],
			["il", "*/ x1 1 2"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"x1"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"r",
					"x1"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"l",
					"l",
					"y2"
				],
				["c"]
			]
		}]
	},
	parallelogram: {
		adj: [["adj", "val 25000"]],
		gd: [
			["maxAdj", "*/ 100000 w ss"],
			["a", "pin 0 adj maxAdj"],
			["x1", "*/ ss a 200000"],
			["x2", "*/ ss a 100000"],
			["x6", "+- r 0 x1"],
			["x5", "+- r 0 x2"],
			["x3", "*/ x5 1 2"],
			["x4", "+- r 0 x3"],
			["il", "*/ wd2 a maxAdj"],
			["q1", "*/ 5 a maxAdj"],
			["q2", "+/ 1 q1 12"],
			["il", "*/ q2 w 1"],
			["it", "*/ q2 h 1"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 it"],
			["q3", "*/ h hc x2"],
			["y1", "pin 0 q3 h"],
			["y2", "+- b 0 y1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"b"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"x5",
					"b"
				],
				["c"]
			]
		}]
	},
	pentagon: {
		adj: [["hf", "val 105146"], ["vf", "val 110557"]],
		gd: [
			["swd2", "*/ wd2 hf 100000"],
			["shd2", "*/ hd2 vf 100000"],
			["svc", "*/ vc  vf 100000"],
			["dx1", "cos swd2 1080000"],
			["dx2", "cos swd2 18360000"],
			["dy1", "sin shd2 1080000"],
			["dy2", "sin shd2 18360000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"],
			["x4", "+- hc dx1 0"],
			["y1", "+- svc 0 dy1"],
			["y2", "+- svc 0 dy2"],
			["it", "*/ y1 dx2 dx1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"x4",
					"y1"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				["c"]
			]
		}]
	},
	pie: {
		adj: [["adj1", "val 0"], ["adj2", "val 16200000"]],
		gd: [
			["stAng", "pin 0 adj1 21599999"],
			["enAng", "pin 0 adj2 21599999"],
			["sw1", "+- enAng 0 stAng"],
			["sw2", "+- sw1 21600000 0"],
			["swAng", "?: sw1 sw1 sw2"],
			["wt1", "sin wd2 stAng"],
			["ht1", "cos hd2 stAng"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["wt2", "sin wd2 enAng"],
			["ht2", "cos hd2 enAng"],
			["dx2", "cat2 wd2 ht2 wt2"],
			["dy2", "sat2 hd2 ht2 wt2"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"],
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"a",
					"wd2",
					"hd2",
					"stAng",
					"swAng"
				],
				[
					"l",
					"hc",
					"vc"
				],
				["c"]
			]
		}]
	},
	piewedge: {
		adj: [],
		gd: [
			["g1", "cos w 13500000"],
			["g2", "sin h 13500000"],
			["x1", "+- r g1 0"],
			["y1", "+- b g2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"b"
				],
				[
					"a",
					"w",
					"h",
					"cd2",
					"cd4"
				],
				[
					"l",
					"r",
					"b"
				],
				["c"]
			]
		}]
	},
	plaque: {
		adj: [["adj", "val 16667"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["x1", "*/ ss a 100000"],
			["x2", "+- r 0 x1"],
			["y2", "+- b 0 x1"],
			["il", "*/ x1 70711 100000"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"x1"
				],
				[
					"a",
					"x1",
					"x1",
					"cd4",
					"-5400000"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"-5400000"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"a",
					"x1",
					"x1",
					"3cd4",
					"-5400000"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"a",
					"x1",
					"x1",
					"0",
					"-5400000"
				],
				["c"]
			]
		}]
	},
	plaquetabs: {
		adj: [],
		gd: [
			["md", "mod w h 0"],
			["dx", "*/ 1 md 20"],
			["y1", "+- 0 b dx"],
			["x1", "+- 0 r dx"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"dx",
						"t"
					],
					[
						"a",
						"dx",
						"dx",
						"0",
						"cd4"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"y1"
					],
					[
						"a",
						"dx",
						"dx",
						"3cd4",
						"cd4"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"dx"
					],
					[
						"a",
						"dx",
						"dx",
						"cd4",
						"cd4"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"x1",
						"b"
					],
					[
						"a",
						"dx",
						"dx",
						"cd2",
						"cd4"
					],
					[
						"l",
						"r",
						"b"
					],
					["c"]
				]
			}
		]
	},
	plus: {
		adj: [["adj", "val 25000"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["x1", "*/ ss a 100000"],
			["x2", "+- r 0 x1"],
			["y2", "+- b 0 x1"],
			["d", "+- w 0 h"],
			["il", "?: d l x1"],
			["ir", "?: d r x2"],
			["it", "?: d x1 t"],
			["ib", "?: d y2 b"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"x1"
				],
				[
					"l",
					"x1",
					"x1"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"x2",
					"x1"
				],
				[
					"l",
					"r",
					"x1"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"l",
					"y2"
				],
				["c"]
			]
		}]
	},
	quadarrow: {
		adj: [
			["adj1", "val 22500"],
			["adj2", "val 22500"],
			["adj3", "val 22500"]
		],
		gd: [
			["a2", "pin 0 adj2 50000"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["q1", "+- 100000 0 maxAdj1"],
			["maxAdj3", "*/ q1 1 2"],
			["a3", "pin 0 adj3 maxAdj3"],
			["x1", "*/ ss a3 100000"],
			["dx2", "*/ ss a2 100000"],
			["x2", "+- hc 0 dx2"],
			["x5", "+- hc dx2 0"],
			["dx3", "*/ ss a1 200000"],
			["x3", "+- hc 0 dx3"],
			["x4", "+- hc dx3 0"],
			["x6", "+- r 0 x1"],
			["y2", "+- vc 0 dx2"],
			["y5", "+- vc dx2 0"],
			["y3", "+- vc 0 dx3"],
			["y4", "+- vc dx3 0"],
			["y6", "+- b 0 x1"],
			["il", "*/ dx3 x1 dx2"],
			["ir", "+- r 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x3",
					"x1"
				],
				[
					"l",
					"x2",
					"x1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"x5",
					"x1"
				],
				[
					"l",
					"x4",
					"x1"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"x6",
					"y3"
				],
				[
					"l",
					"x6",
					"y2"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x6",
					"y5"
				],
				[
					"l",
					"x6",
					"y4"
				],
				[
					"l",
					"x4",
					"y4"
				],
				[
					"l",
					"x4",
					"y6"
				],
				[
					"l",
					"x5",
					"y6"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"x2",
					"y6"
				],
				[
					"l",
					"x3",
					"y6"
				],
				[
					"l",
					"x3",
					"y4"
				],
				[
					"l",
					"x1",
					"y4"
				],
				[
					"l",
					"x1",
					"y5"
				],
				["c"]
			]
		}]
	},
	quadarrowcallout: {
		adj: [
			["adj1", "val 18515"],
			["adj2", "val 18515"],
			["adj3", "val 18515"],
			["adj4", "val 48123"]
		],
		gd: [
			["a2", "pin 0 adj2 50000"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["maxAdj3", "+- 50000 0 a2"],
			["a3", "pin 0 adj3 maxAdj3"],
			["q2", "*/ a3 2 1"],
			["maxAdj4", "+- 100000 0 q2"],
			["a4", "pin a1 adj4 maxAdj4"],
			["dx2", "*/ ss a2 100000"],
			["dx3", "*/ ss a1 200000"],
			["ah", "*/ ss a3 100000"],
			["dx1", "*/ w a4 200000"],
			["dy1", "*/ h a4 200000"],
			["x8", "+- r 0 ah"],
			["x2", "+- hc 0 dx1"],
			["x7", "+- hc dx1 0"],
			["x3", "+- hc 0 dx2"],
			["x6", "+- hc dx2 0"],
			["x4", "+- hc 0 dx3"],
			["x5", "+- hc dx3 0"],
			["y8", "+- b 0 ah"],
			["y2", "+- vc 0 dy1"],
			["y7", "+- vc dy1 0"],
			["y3", "+- vc 0 dx2"],
			["y6", "+- vc dx2 0"],
			["y4", "+- vc 0 dx3"],
			["y5", "+- vc dx3 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"ah",
					"y3"
				],
				[
					"l",
					"ah",
					"y4"
				],
				[
					"l",
					"x2",
					"y4"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x4",
					"y2"
				],
				[
					"l",
					"x4",
					"ah"
				],
				[
					"l",
					"x3",
					"ah"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"x6",
					"ah"
				],
				[
					"l",
					"x5",
					"ah"
				],
				[
					"l",
					"x5",
					"y2"
				],
				[
					"l",
					"x7",
					"y2"
				],
				[
					"l",
					"x7",
					"y4"
				],
				[
					"l",
					"x8",
					"y4"
				],
				[
					"l",
					"x8",
					"y3"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x8",
					"y6"
				],
				[
					"l",
					"x8",
					"y5"
				],
				[
					"l",
					"x7",
					"y5"
				],
				[
					"l",
					"x7",
					"y7"
				],
				[
					"l",
					"x5",
					"y7"
				],
				[
					"l",
					"x5",
					"y8"
				],
				[
					"l",
					"x6",
					"y8"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"x3",
					"y8"
				],
				[
					"l",
					"x4",
					"y8"
				],
				[
					"l",
					"x4",
					"y7"
				],
				[
					"l",
					"x2",
					"y7"
				],
				[
					"l",
					"x2",
					"y5"
				],
				[
					"l",
					"ah",
					"y5"
				],
				[
					"l",
					"ah",
					"y6"
				],
				["c"]
			]
		}]
	},
	ribbon: {
		adj: [["adj1", "val 16667"], ["adj2", "val 50000"]],
		gd: [
			["a1", "pin 0 adj1 33333"],
			["a2", "pin 25000 adj2 75000"],
			["x10", "+- r 0 wd8"],
			["dx2", "*/ w a2 200000"],
			["x2", "+- hc 0 dx2"],
			["x9", "+- hc dx2 0"],
			["x3", "+- x2 wd32 0"],
			["x8", "+- x9 0 wd32"],
			["x5", "+- x2 wd8 0"],
			["x6", "+- x9 0 wd8"],
			["x4", "+- x5 0 wd32"],
			["x7", "+- x6 wd32 0"],
			["y1", "*/ h a1 200000"],
			["y2", "*/ h a1 100000"],
			["y4", "+- b 0 y2"],
			["y3", "*/ y4 1 2"],
			["hR", "*/ h a1 400000"],
			["y5", "+- b 0 hR"],
			["y6", "+- y2 0 hR"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"x4",
						"t"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"cd2"
					],
					[
						"l",
						"x3",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"-10800000"
					],
					[
						"l",
						"x8",
						"y2"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"-10800000"
					],
					[
						"l",
						"x7",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"cd2"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"x10",
						"y3"
					],
					[
						"l",
						"r",
						"y4"
					],
					[
						"l",
						"x9",
						"y4"
					],
					[
						"l",
						"x9",
						"y5"
					],
					[
						"a",
						"wd32",
						"hR",
						"0",
						"cd4"
					],
					[
						"l",
						"x3",
						"b"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"cd4"
					],
					[
						"l",
						"x2",
						"y4"
					],
					[
						"l",
						"l",
						"y4"
					],
					[
						"l",
						"wd8",
						"y3"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x5",
						"hR"
					],
					[
						"a",
						"wd32",
						"hR",
						"0",
						"cd4"
					],
					[
						"l",
						"x3",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"-10800000"
					],
					[
						"l",
						"x5",
						"y2"
					],
					["c"],
					[
						"m",
						"x6",
						"hR"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd2",
						"-5400000"
					],
					[
						"l",
						"x8",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"cd2"
					],
					[
						"l",
						"x6",
						"y2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"x4",
						"t"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"cd2"
					],
					[
						"l",
						"x3",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"-10800000"
					],
					[
						"l",
						"x8",
						"y2"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"-10800000"
					],
					[
						"l",
						"x7",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"cd2"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"x10",
						"y3"
					],
					[
						"l",
						"r",
						"y4"
					],
					[
						"l",
						"x9",
						"y4"
					],
					[
						"l",
						"x9",
						"y5"
					],
					[
						"a",
						"wd32",
						"hR",
						"0",
						"cd4"
					],
					[
						"l",
						"x3",
						"b"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"cd4"
					],
					[
						"l",
						"x2",
						"y4"
					],
					[
						"l",
						"l",
						"y4"
					],
					[
						"l",
						"wd8",
						"y3"
					],
					["c"],
					[
						"m",
						"x5",
						"hR"
					],
					[
						"l",
						"x5",
						"y2"
					],
					[
						"m",
						"x6",
						"y2"
					],
					[
						"l",
						"x6",
						"hR"
					],
					[
						"m",
						"x2",
						"y4"
					],
					[
						"l",
						"x2",
						"y6"
					],
					[
						"m",
						"x9",
						"y6"
					],
					[
						"l",
						"x9",
						"y4"
					]
				]
			}
		]
	},
	ribbon2: {
		adj: [["adj1", "val 16667"], ["adj2", "val 50000"]],
		gd: [
			["a1", "pin 0 adj1 33333"],
			["a2", "pin 25000 adj2 75000"],
			["x10", "+- r 0 wd8"],
			["dx2", "*/ w a2 200000"],
			["x2", "+- hc 0 dx2"],
			["x9", "+- hc dx2 0"],
			["x3", "+- x2 wd32 0"],
			["x8", "+- x9 0 wd32"],
			["x5", "+- x2 wd8 0"],
			["x6", "+- x9 0 wd8"],
			["x4", "+- x5 0 wd32"],
			["x7", "+- x6 wd32 0"],
			["dy1", "*/ h a1 200000"],
			["y1", "+- b 0 dy1"],
			["dy2", "*/ h a1 100000"],
			["y2", "+- b 0 dy2"],
			["y4", "+- t dy2 0"],
			["y3", "+/ y4 b 2"],
			["hR", "*/ h a1 400000"],
			["y6", "+- b 0 hR"],
			["y7", "+- y1 0 hR"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"b"
					],
					[
						"l",
						"x4",
						"b"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"-10800000"
					],
					[
						"l",
						"x3",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"cd2"
					],
					[
						"l",
						"x8",
						"y2"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"cd2"
					],
					[
						"l",
						"x7",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"-10800000"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"x10",
						"y3"
					],
					[
						"l",
						"r",
						"y4"
					],
					[
						"l",
						"x9",
						"y4"
					],
					[
						"l",
						"x9",
						"hR"
					],
					[
						"a",
						"wd32",
						"hR",
						"0",
						"-5400000"
					],
					[
						"l",
						"x3",
						"t"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"-5400000"
					],
					[
						"l",
						"x2",
						"y4"
					],
					[
						"l",
						"l",
						"y4"
					],
					[
						"l",
						"wd8",
						"y3"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x5",
						"y6"
					],
					[
						"a",
						"wd32",
						"hR",
						"0",
						"-5400000"
					],
					[
						"l",
						"x3",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"cd2"
					],
					[
						"l",
						"x5",
						"y2"
					],
					["c"],
					[
						"m",
						"x6",
						"y6"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd2",
						"cd4"
					],
					[
						"l",
						"x8",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"-10800000"
					],
					[
						"l",
						"x6",
						"y2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"b"
					],
					[
						"l",
						"wd8",
						"y3"
					],
					[
						"l",
						"l",
						"y4"
					],
					[
						"l",
						"x2",
						"y4"
					],
					[
						"l",
						"x2",
						"hR"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd2",
						"cd4"
					],
					[
						"l",
						"x8",
						"t"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"cd4"
					],
					[
						"l",
						"x9",
						"y4"
					],
					[
						"l",
						"x9",
						"y4"
					],
					[
						"l",
						"r",
						"y4"
					],
					[
						"l",
						"x10",
						"y3"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"x7",
						"b"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"cd2"
					],
					[
						"l",
						"x8",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"cd4",
						"-10800000"
					],
					[
						"l",
						"x3",
						"y2"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"-10800000"
					],
					[
						"l",
						"x4",
						"y1"
					],
					[
						"a",
						"wd32",
						"hR",
						"3cd4",
						"cd2"
					],
					["c"],
					[
						"m",
						"x5",
						"y2"
					],
					[
						"l",
						"x5",
						"y6"
					],
					[
						"m",
						"x6",
						"y6"
					],
					[
						"l",
						"x6",
						"y2"
					],
					[
						"m",
						"x2",
						"y7"
					],
					[
						"l",
						"x2",
						"y4"
					],
					[
						"m",
						"x9",
						"y4"
					],
					[
						"l",
						"x9",
						"y7"
					]
				]
			}
		]
	},
	rightarrow: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["maxAdj2", "*/ 100000 w ss"],
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 0 adj2 maxAdj2"],
			["dx1", "*/ ss a2 100000"],
			["x1", "+- r 0 dx1"],
			["dy1", "*/ h a1 200000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc dy1 0"],
			["dx2", "*/ y1 dx1 hd2"],
			["x2", "+- x1 dx2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y1"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"l",
					"y2"
				],
				["c"]
			]
		}]
	},
	rightarrowcallout: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"],
			["adj4", "val 64977"]
		],
		gd: [
			["maxAdj2", "*/ 50000 h ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["maxAdj3", "*/ 100000 w ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["q2", "*/ a3 ss w"],
			["maxAdj4", "+- 100000 0 q2"],
			["a4", "pin 0 adj4 maxAdj4"],
			["dy1", "*/ ss a2 100000"],
			["dy2", "*/ ss a1 200000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc dy2 0"],
			["y4", "+- vc dy1 0"],
			["dx3", "*/ ss a3 100000"],
			["x3", "+- r 0 dx3"],
			["x2", "*/ w a4 100000"],
			["x1", "*/ x2 1 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"x3",
					"y1"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x3",
					"y4"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x2",
					"y3"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	rightbrace: {
		adj: [["adj1", "val 8333"], ["adj2", "val 50000"]],
		gd: [
			["a2", "pin 0 adj2 100000"],
			["q1", "+- 100000 0 a2"],
			["q2", "min q1 a2"],
			["q3", "*/ q2 1 2"],
			["maxAdj1", "*/ q3 h ss"],
			["a1", "pin 0 adj1 maxAdj1"],
			["y1", "*/ ss a1 100000"],
			["y3", "*/ h a2 100000"],
			["y2", "+- y3 0 y1"],
			["y4", "+- b 0 y1"],
			["dx1", "cos wd2 2700000"],
			["dy1", "sin y1 2700000"],
			["ir", "+- l dx1 0"],
			["it", "+- y1 0 dy1"],
			["ib", "+- b dy1 y1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"a",
					"wd2",
					"y1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"hc",
					"y2"
				],
				[
					"a",
					"wd2",
					"y1",
					"cd2",
					"-5400000"
				],
				[
					"a",
					"wd2",
					"y1",
					"3cd4",
					"-5400000"
				],
				[
					"l",
					"hc",
					"y4"
				],
				[
					"a",
					"wd2",
					"y1",
					"0",
					"cd4"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"a",
					"wd2",
					"y1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"hc",
					"y2"
				],
				[
					"a",
					"wd2",
					"y1",
					"cd2",
					"-5400000"
				],
				[
					"a",
					"wd2",
					"y1",
					"3cd4",
					"-5400000"
				],
				[
					"l",
					"hc",
					"y4"
				],
				[
					"a",
					"wd2",
					"y1",
					"0",
					"cd4"
				]
			]
		}]
	},
	rightbracket: {
		adj: [["adj", "val 8333"]],
		gd: [
			["maxAdj", "*/ 50000 h ss"],
			["a", "pin 0 adj maxAdj"],
			["y1", "*/ ss a 100000"],
			["y2", "+- b 0 y1"],
			["dx1", "cos w 2700000"],
			["dy1", "sin y1 2700000"],
			["ir", "+- l dx1 0"],
			["it", "+- y1 0 dy1"],
			["ib", "+- b dy1 y1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !1,
			extrusionOk: !1,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"a",
					"w",
					"y1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"a",
					"w",
					"y1",
					"0",
					"cd4"
				],
				["c"]
			]
		}, {
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"a",
					"w",
					"y1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"a",
					"w",
					"y1",
					"0",
					"cd4"
				]
			]
		}]
	},
	round1rect: {
		adj: [["adj", "val 16667"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dx1", "*/ ss a 100000"],
			["x1", "+- r 0 dx1"],
			["idx", "*/ dx1 29289 100000"],
			["ir", "+- r 0 idx"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"a",
					"dx1",
					"dx1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	round2diagrect: {
		adj: [["adj1", "val 16667"], ["adj2", "val 0"]],
		gd: [
			["a1", "pin 0 adj1 50000"],
			["a2", "pin 0 adj2 50000"],
			["x1", "*/ ss a1 100000"],
			["y1", "+- b 0 x1"],
			["a", "*/ ss a2 100000"],
			["x2", "+- r 0 a"],
			["y2", "+- b 0 a"],
			["dx1", "*/ x1 29289 100000"],
			["dx2", "*/ a 29289 100000"],
			["d", "+- dx1 0 dx2"],
			["dx", "?: d dx1 dx2"],
			["ir", "+- r 0 dx"],
			["ib", "+- b 0 dx"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"t"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"a",
					"a",
					"a",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"y1"
				],
				[
					"a",
					"x1",
					"x1",
					"0",
					"cd4"
				],
				[
					"l",
					"a",
					"b"
				],
				[
					"a",
					"a",
					"a",
					"cd4",
					"cd4"
				],
				[
					"l",
					"l",
					"x1"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"cd4"
				],
				["c"]
			]
		}]
	},
	round2samerect: {
		adj: [["adj1", "val 16667"], ["adj2", "val 0"]],
		gd: [
			["a1", "pin 0 adj1 50000"],
			["a2", "pin 0 adj2 50000"],
			["tx1", "*/ ss a1 100000"],
			["tx2", "+- r 0 tx1"],
			["bx1", "*/ ss a2 100000"],
			["bx2", "+- r 0 bx1"],
			["by1", "+- b 0 bx1"],
			["d", "+- tx1 0 bx1"],
			["tdx", "*/ tx1 29289 100000"],
			["bdx", "*/ bx1 29289 100000"],
			["il", "?: d tdx bdx"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 bdx"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"tx1",
					"t"
				],
				[
					"l",
					"tx2",
					"t"
				],
				[
					"a",
					"tx1",
					"tx1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"by1"
				],
				[
					"a",
					"bx1",
					"bx1",
					"0",
					"cd4"
				],
				[
					"l",
					"bx1",
					"b"
				],
				[
					"a",
					"bx1",
					"bx1",
					"cd4",
					"cd4"
				],
				[
					"l",
					"l",
					"tx1"
				],
				[
					"a",
					"tx1",
					"tx1",
					"cd2",
					"cd4"
				],
				["c"]
			]
		}]
	},
	roundrect: {
		adj: [["adj", "val 16667"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["x1", "*/ ss a 100000"],
			["x2", "+- r 0 x1"],
			["y2", "+- b 0 x1"],
			["il", "*/ x1 29289 100000"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"x1"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"cd4"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"a",
					"x1",
					"x1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"a",
					"x1",
					"x1",
					"0",
					"cd4"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"a",
					"x1",
					"x1",
					"cd4",
					"cd4"
				],
				["c"]
			]
		}]
	},
	rttriangle: {
		adj: [],
		gd: [
			["it", "*/ h 7 12"],
			["ir", "*/ w 7 12"],
			["ib", "*/ h 11 12"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"b"
				],
				[
					"l",
					"l",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				["c"]
			]
		}]
	},
	smileyface: {
		adj: [["adj", "val 4653"]],
		gd: [
			["a", "pin -4653 adj 4653"],
			["x1", "*/ w 4969 21699"],
			["x2", "*/ w 6215 21600"],
			["x3", "*/ w 13135 21600"],
			["x4", "*/ w 16640 21600"],
			["y1", "*/ h 7570 21600"],
			["y3", "*/ h 16515 21600"],
			["dy2", "*/ h a 100000"],
			["y2", "+- y3 0 dy2"],
			["y4", "+- y3 dy2 0"],
			["dy3", "*/ h a 50000"],
			["y5", "+- y4 dy3 0"],
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"],
			["wR", "*/ w 1125 21600"],
			["hR", "*/ h 1125 21600"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"l",
						"vc"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd2",
						"21600000"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x2",
						"y1"
					],
					[
						"a",
						"wR",
						"hR",
						"cd2",
						"21600000"
					],
					[
						"m",
						"x3",
						"y1"
					],
					[
						"a",
						"wR",
						"hR",
						"cd2",
						"21600000"
					]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [[
					"m",
					"x1",
					"y2"
				], [
					"Q",
					"hc",
					"y5",
					"x4",
					"y2"
				]]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"vc"
					],
					[
						"a",
						"wd2",
						"hd2",
						"cd2",
						"21600000"
					],
					["c"]
				]
			}
		]
	},
	snip1rect: {
		adj: [["adj", "val 16667"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dx1", "*/ ss a 100000"],
			["x1", "+- r 0 dx1"],
			["it", "*/ dx1 1 2"],
			["ir", "+/ x1 r 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"r",
					"dx1"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	snip2diagrect: {
		adj: [["adj1", "val 0"], ["adj2", "val 16667"]],
		gd: [
			["a1", "pin 0 adj1 50000"],
			["a2", "pin 0 adj2 50000"],
			["lx1", "*/ ss a1 100000"],
			["lx2", "+- r 0 lx1"],
			["ly1", "+- b 0 lx1"],
			["rx1", "*/ ss a2 100000"],
			["rx2", "+- r 0 rx1"],
			["ry1", "+- b 0 rx1"],
			["d", "+- lx1 0 rx1"],
			["dx", "?: d lx1 rx1"],
			["il", "*/ dx 1 2"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"lx1",
					"t"
				],
				[
					"l",
					"rx2",
					"t"
				],
				[
					"l",
					"r",
					"rx1"
				],
				[
					"l",
					"r",
					"ly1"
				],
				[
					"l",
					"lx2",
					"b"
				],
				[
					"l",
					"rx1",
					"b"
				],
				[
					"l",
					"l",
					"ry1"
				],
				[
					"l",
					"l",
					"lx1"
				],
				["c"]
			]
		}]
	},
	snip2samerect: {
		adj: [["adj1", "val 16667"], ["adj2", "val 0"]],
		gd: [
			["a1", "pin 0 adj1 50000"],
			["a2", "pin 0 adj2 50000"],
			["tx1", "*/ ss a1 100000"],
			["tx2", "+- r 0 tx1"],
			["bx1", "*/ ss a2 100000"],
			["bx2", "+- r 0 bx1"],
			["by1", "+- b 0 bx1"],
			["d", "+- tx1 0 bx1"],
			["dx", "?: d tx1 bx1"],
			["il", "*/ dx 1 2"],
			["ir", "+- r 0 il"],
			["it", "*/ tx1 1 2"],
			["ib", "+/ by1 b 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"tx1",
					"t"
				],
				[
					"l",
					"tx2",
					"t"
				],
				[
					"l",
					"r",
					"tx1"
				],
				[
					"l",
					"r",
					"by1"
				],
				[
					"l",
					"bx2",
					"b"
				],
				[
					"l",
					"bx1",
					"b"
				],
				[
					"l",
					"l",
					"by1"
				],
				[
					"l",
					"l",
					"tx1"
				],
				["c"]
			]
		}]
	},
	sniproundrect: {
		adj: [["adj1", "val 16667"], ["adj2", "val 16667"]],
		gd: [
			["a1", "pin 0 adj1 50000"],
			["a2", "pin 0 adj2 50000"],
			["x1", "*/ ss a1 100000"],
			["dx2", "*/ ss a2 100000"],
			["x2", "+- r 0 dx2"],
			["il", "*/ x1 29289 100000"],
			["ir", "+/ x2 r 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"t"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"r",
					"dx2"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				[
					"l",
					"l",
					"x1"
				],
				[
					"a",
					"x1",
					"x1",
					"cd2",
					"cd4"
				],
				["c"]
			]
		}]
	},
	squaretabs: {
		adj: [],
		gd: [
			["md", "mod w h 0"],
			["dx", "*/ 1 md 20"],
			["y1", "+- 0 b dx"],
			["x1", "+- 0 r dx"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"t"
					],
					[
						"l",
						"dx",
						"t"
					],
					[
						"l",
						"dx",
						"dx"
					],
					[
						"l",
						"l",
						"dx"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"l",
						"y1"
					],
					[
						"l",
						"dx",
						"y1"
					],
					[
						"l",
						"dx",
						"b"
					],
					[
						"l",
						"l",
						"b"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"x1",
						"t"
					],
					[
						"l",
						"r",
						"t"
					],
					[
						"l",
						"r",
						"dx"
					],
					[
						"l",
						"x1",
						"dx"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [
					[
						"m",
						"x1",
						"y1"
					],
					[
						"l",
						"r",
						"y1"
					],
					[
						"l",
						"r",
						"b"
					],
					[
						"l",
						"x1",
						"b"
					],
					["c"]
				]
			}
		]
	},
	star10: {
		adj: [["adj", "val 42533"], ["hf", "val 105146"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["swd2", "*/ wd2 hf 100000"],
			["dx1", "*/ swd2 95106 100000"],
			["dx2", "*/ swd2 58779 100000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"],
			["x4", "+- hc dx1 0"],
			["dy1", "*/ hd2 80902 100000"],
			["dy2", "*/ hd2 30902 100000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc dy2 0"],
			["y4", "+- vc dy1 0"],
			["iwd2", "*/ swd2 a 50000"],
			["ihd2", "*/ hd2 a 50000"],
			["sdx1", "*/ iwd2 80902 100000"],
			["sdx2", "*/ iwd2 30902 100000"],
			["sdy1", "*/ ihd2 95106 100000"],
			["sdy2", "*/ ihd2 58779 100000"],
			["sx1", "+- hc 0 iwd2"],
			["sx2", "+- hc 0 sdx1"],
			["sx3", "+- hc 0 sdx2"],
			["sx4", "+- hc sdx2 0"],
			["sx5", "+- hc sdx1 0"],
			["sx6", "+- hc iwd2 0"],
			["sy1", "+- vc 0 sdy1"],
			["sy2", "+- vc 0 sdy2"],
			["sy3", "+- vc sdy2 0"],
			["sy4", "+- vc sdy1 0"],
			["yAdj", "+- vc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y2"
				],
				[
					"l",
					"sx2",
					"sy2"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"sx3",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx4",
					"sy1"
				],
				[
					"l",
					"x3",
					"y1"
				],
				[
					"l",
					"sx5",
					"sy2"
				],
				[
					"l",
					"x4",
					"y2"
				],
				[
					"l",
					"sx6",
					"vc"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"sx5",
					"sy3"
				],
				[
					"l",
					"x3",
					"y4"
				],
				[
					"l",
					"sx4",
					"sy4"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"sx3",
					"sy4"
				],
				[
					"l",
					"x2",
					"y4"
				],
				[
					"l",
					"sx2",
					"sy3"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"sx1",
					"vc"
				],
				["c"]
			]
		}]
	},
	star12: {
		adj: [["adj", "val 37500"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dx1", "cos wd2 1800000"],
			["dy1", "sin hd2 3600000"],
			["x1", "+- hc 0 dx1"],
			["x3", "*/ w 3 4"],
			["x4", "+- hc dx1 0"],
			["y1", "+- vc 0 dy1"],
			["y3", "*/ h 3 4"],
			["y4", "+- vc dy1 0"],
			["iwd2", "*/ wd2 a 50000"],
			["ihd2", "*/ hd2 a 50000"],
			["sdx1", "cos iwd2 900000"],
			["sdx2", "cos iwd2 2700000"],
			["sdx3", "cos iwd2 4500000"],
			["sdy1", "sin ihd2 4500000"],
			["sdy2", "sin ihd2 2700000"],
			["sdy3", "sin ihd2 900000"],
			["sx1", "+- hc 0 sdx1"],
			["sx2", "+- hc 0 sdx2"],
			["sx3", "+- hc 0 sdx3"],
			["sx4", "+- hc sdx3 0"],
			["sx5", "+- hc sdx2 0"],
			["sx6", "+- hc sdx1 0"],
			["sy1", "+- vc 0 sdy1"],
			["sy2", "+- vc 0 sdy2"],
			["sy3", "+- vc 0 sdy3"],
			["sy4", "+- vc sdy3 0"],
			["sy5", "+- vc sdy2 0"],
			["sy6", "+- vc sdy1 0"],
			["yAdj", "+- vc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"sx1",
					"sy3"
				],
				[
					"l",
					"x1",
					"hd4"
				],
				[
					"l",
					"sx2",
					"sy2"
				],
				[
					"l",
					"wd4",
					"y1"
				],
				[
					"l",
					"sx3",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx4",
					"sy1"
				],
				[
					"l",
					"x3",
					"y1"
				],
				[
					"l",
					"sx5",
					"sy2"
				],
				[
					"l",
					"x4",
					"hd4"
				],
				[
					"l",
					"sx6",
					"sy3"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"sx6",
					"sy4"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"sx5",
					"sy5"
				],
				[
					"l",
					"x3",
					"y4"
				],
				[
					"l",
					"sx4",
					"sy6"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"sx3",
					"sy6"
				],
				[
					"l",
					"wd4",
					"y4"
				],
				[
					"l",
					"sx2",
					"sy5"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"sx1",
					"sy4"
				],
				["c"]
			]
		}]
	},
	star16: {
		adj: [["adj", "val 37500"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dx1", "*/ wd2 92388 100000"],
			["dx2", "*/ wd2 70711 100000"],
			["dx3", "*/ wd2 38268 100000"],
			["dy1", "*/ hd2 92388 100000"],
			["dy2", "*/ hd2 70711 100000"],
			["dy3", "*/ hd2 38268 100000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc 0 dx3"],
			["x4", "+- hc dx3 0"],
			["x5", "+- hc dx2 0"],
			["x6", "+- hc dx1 0"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc 0 dy3"],
			["y4", "+- vc dy3 0"],
			["y5", "+- vc dy2 0"],
			["y6", "+- vc dy1 0"],
			["iwd2", "*/ wd2 a 50000"],
			["ihd2", "*/ hd2 a 50000"],
			["sdx1", "*/ iwd2 98079 100000"],
			["sdx2", "*/ iwd2 83147 100000"],
			["sdx3", "*/ iwd2 55557 100000"],
			["sdx4", "*/ iwd2 19509 100000"],
			["sdy1", "*/ ihd2 98079 100000"],
			["sdy2", "*/ ihd2 83147 100000"],
			["sdy3", "*/ ihd2 55557 100000"],
			["sdy4", "*/ ihd2 19509 100000"],
			["sx1", "+- hc 0 sdx1"],
			["sx2", "+- hc 0 sdx2"],
			["sx3", "+- hc 0 sdx3"],
			["sx4", "+- hc 0 sdx4"],
			["sx5", "+- hc sdx4 0"],
			["sx6", "+- hc sdx3 0"],
			["sx7", "+- hc sdx2 0"],
			["sx8", "+- hc sdx1 0"],
			["sy1", "+- vc 0 sdy1"],
			["sy2", "+- vc 0 sdy2"],
			["sy3", "+- vc 0 sdy3"],
			["sy4", "+- vc 0 sdy4"],
			["sy5", "+- vc sdy4 0"],
			["sy6", "+- vc sdy3 0"],
			["sy7", "+- vc sdy2 0"],
			["sy8", "+- vc sdy1 0"],
			["idx", "cos iwd2 2700000"],
			["idy", "sin ihd2 2700000"],
			["il", "+- hc 0 idx"],
			["it", "+- vc 0 idy"],
			["ir", "+- hc idx 0"],
			["ib", "+- vc idy 0"],
			["yAdj", "+- vc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"sx1",
					"sy4"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"sx2",
					"sy3"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"sx3",
					"sy2"
				],
				[
					"l",
					"x3",
					"y1"
				],
				[
					"l",
					"sx4",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx5",
					"sy1"
				],
				[
					"l",
					"x4",
					"y1"
				],
				[
					"l",
					"sx6",
					"sy2"
				],
				[
					"l",
					"x5",
					"y2"
				],
				[
					"l",
					"sx7",
					"sy3"
				],
				[
					"l",
					"x6",
					"y3"
				],
				[
					"l",
					"sx8",
					"sy4"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"sx8",
					"sy5"
				],
				[
					"l",
					"x6",
					"y4"
				],
				[
					"l",
					"sx7",
					"sy6"
				],
				[
					"l",
					"x5",
					"y5"
				],
				[
					"l",
					"sx6",
					"sy7"
				],
				[
					"l",
					"x4",
					"y6"
				],
				[
					"l",
					"sx5",
					"sy8"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"sx4",
					"sy8"
				],
				[
					"l",
					"x3",
					"y6"
				],
				[
					"l",
					"sx3",
					"sy7"
				],
				[
					"l",
					"x2",
					"y5"
				],
				[
					"l",
					"sx2",
					"sy6"
				],
				[
					"l",
					"x1",
					"y4"
				],
				[
					"l",
					"sx1",
					"sy5"
				],
				["c"]
			]
		}]
	},
	star24: {
		adj: [["adj", "val 37500"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dx1", "cos wd2 900000"],
			["dx2", "cos wd2 1800000"],
			["dx3", "cos wd2 2700000"],
			["dx4", "val wd4"],
			["dx5", "cos wd2 4500000"],
			["dy1", "sin hd2 4500000"],
			["dy2", "sin hd2 3600000"],
			["dy3", "sin hd2 2700000"],
			["dy4", "val hd4"],
			["dy5", "sin hd2 900000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc 0 dx3"],
			["x4", "+- hc 0 dx4"],
			["x5", "+- hc 0 dx5"],
			["x6", "+- hc dx5 0"],
			["x7", "+- hc dx4 0"],
			["x8", "+- hc dx3 0"],
			["x9", "+- hc dx2 0"],
			["x10", "+- hc dx1 0"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc 0 dy3"],
			["y4", "+- vc 0 dy4"],
			["y5", "+- vc 0 dy5"],
			["y6", "+- vc dy5 0"],
			["y7", "+- vc dy4 0"],
			["y8", "+- vc dy3 0"],
			["y9", "+- vc dy2 0"],
			["y10", "+- vc dy1 0"],
			["iwd2", "*/ wd2 a 50000"],
			["ihd2", "*/ hd2 a 50000"],
			["sdx1", "*/ iwd2 99144 100000"],
			["sdx2", "*/ iwd2 92388 100000"],
			["sdx3", "*/ iwd2 79335 100000"],
			["sdx4", "*/ iwd2 60876 100000"],
			["sdx5", "*/ iwd2 38268 100000"],
			["sdx6", "*/ iwd2 13053 100000"],
			["sdy1", "*/ ihd2 99144 100000"],
			["sdy2", "*/ ihd2 92388 100000"],
			["sdy3", "*/ ihd2 79335 100000"],
			["sdy4", "*/ ihd2 60876 100000"],
			["sdy5", "*/ ihd2 38268 100000"],
			["sdy6", "*/ ihd2 13053 100000"],
			["sx1", "+- hc 0 sdx1"],
			["sx2", "+- hc 0 sdx2"],
			["sx3", "+- hc 0 sdx3"],
			["sx4", "+- hc 0 sdx4"],
			["sx5", "+- hc 0 sdx5"],
			["sx6", "+- hc 0 sdx6"],
			["sx7", "+- hc sdx6 0"],
			["sx8", "+- hc sdx5 0"],
			["sx9", "+- hc sdx4 0"],
			["sx10", "+- hc sdx3 0"],
			["sx11", "+- hc sdx2 0"],
			["sx12", "+- hc sdx1 0"],
			["sy1", "+- vc 0 sdy1"],
			["sy2", "+- vc 0 sdy2"],
			["sy3", "+- vc 0 sdy3"],
			["sy4", "+- vc 0 sdy4"],
			["sy5", "+- vc 0 sdy5"],
			["sy6", "+- vc 0 sdy6"],
			["sy7", "+- vc sdy6 0"],
			["sy8", "+- vc sdy5 0"],
			["sy9", "+- vc sdy4 0"],
			["sy10", "+- vc sdy3 0"],
			["sy11", "+- vc sdy2 0"],
			["sy12", "+- vc sdy1 0"],
			["idx", "cos iwd2 2700000"],
			["idy", "sin ihd2 2700000"],
			["il", "+- hc 0 idx"],
			["it", "+- vc 0 idy"],
			["ir", "+- hc idx 0"],
			["ib", "+- vc idy 0"],
			["yAdj", "+- vc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"sx1",
					"sy6"
				],
				[
					"l",
					"x1",
					"y5"
				],
				[
					"l",
					"sx2",
					"sy5"
				],
				[
					"l",
					"x2",
					"y4"
				],
				[
					"l",
					"sx3",
					"sy4"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"sx4",
					"sy3"
				],
				[
					"l",
					"x4",
					"y2"
				],
				[
					"l",
					"sx5",
					"sy2"
				],
				[
					"l",
					"x5",
					"y1"
				],
				[
					"l",
					"sx6",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx7",
					"sy1"
				],
				[
					"l",
					"x6",
					"y1"
				],
				[
					"l",
					"sx8",
					"sy2"
				],
				[
					"l",
					"x7",
					"y2"
				],
				[
					"l",
					"sx9",
					"sy3"
				],
				[
					"l",
					"x8",
					"y3"
				],
				[
					"l",
					"sx10",
					"sy4"
				],
				[
					"l",
					"x9",
					"y4"
				],
				[
					"l",
					"sx11",
					"sy5"
				],
				[
					"l",
					"x10",
					"y5"
				],
				[
					"l",
					"sx12",
					"sy6"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"sx12",
					"sy7"
				],
				[
					"l",
					"x10",
					"y6"
				],
				[
					"l",
					"sx11",
					"sy8"
				],
				[
					"l",
					"x9",
					"y7"
				],
				[
					"l",
					"sx10",
					"sy9"
				],
				[
					"l",
					"x8",
					"y8"
				],
				[
					"l",
					"sx9",
					"sy10"
				],
				[
					"l",
					"x7",
					"y9"
				],
				[
					"l",
					"sx8",
					"sy11"
				],
				[
					"l",
					"x6",
					"y10"
				],
				[
					"l",
					"sx7",
					"sy12"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"sx6",
					"sy12"
				],
				[
					"l",
					"x5",
					"y10"
				],
				[
					"l",
					"sx5",
					"sy11"
				],
				[
					"l",
					"x4",
					"y9"
				],
				[
					"l",
					"sx4",
					"sy10"
				],
				[
					"l",
					"x3",
					"y8"
				],
				[
					"l",
					"sx3",
					"sy9"
				],
				[
					"l",
					"x2",
					"y7"
				],
				[
					"l",
					"sx2",
					"sy8"
				],
				[
					"l",
					"x1",
					"y6"
				],
				[
					"l",
					"sx1",
					"sy7"
				],
				["c"]
			]
		}]
	},
	star32: {
		adj: [["adj", "val 37500"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dx1", "*/ wd2 98079 100000"],
			["dx2", "*/ wd2 92388 100000"],
			["dx3", "*/ wd2 83147 100000"],
			["dx4", "cos wd2 2700000"],
			["dx5", "*/ wd2 55557 100000"],
			["dx6", "*/ wd2 38268 100000"],
			["dx7", "*/ wd2 19509 100000"],
			["dy1", "*/ hd2 98079 100000"],
			["dy2", "*/ hd2 92388 100000"],
			["dy3", "*/ hd2 83147 100000"],
			["dy4", "sin hd2 2700000"],
			["dy5", "*/ hd2 55557 100000"],
			["dy6", "*/ hd2 38268 100000"],
			["dy7", "*/ hd2 19509 100000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc 0 dx3"],
			["x4", "+- hc 0 dx4"],
			["x5", "+- hc 0 dx5"],
			["x6", "+- hc 0 dx6"],
			["x7", "+- hc 0 dx7"],
			["x8", "+- hc dx7 0"],
			["x9", "+- hc dx6 0"],
			["x10", "+- hc dx5 0"],
			["x11", "+- hc dx4 0"],
			["x12", "+- hc dx3 0"],
			["x13", "+- hc dx2 0"],
			["x14", "+- hc dx1 0"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc 0 dy3"],
			["y4", "+- vc 0 dy4"],
			["y5", "+- vc 0 dy5"],
			["y6", "+- vc 0 dy6"],
			["y7", "+- vc 0 dy7"],
			["y8", "+- vc dy7 0"],
			["y9", "+- vc dy6 0"],
			["y10", "+- vc dy5 0"],
			["y11", "+- vc dy4 0"],
			["y12", "+- vc dy3 0"],
			["y13", "+- vc dy2 0"],
			["y14", "+- vc dy1 0"],
			["iwd2", "*/ wd2 a 50000"],
			["ihd2", "*/ hd2 a 50000"],
			["sdx1", "*/ iwd2 99518 100000"],
			["sdx2", "*/ iwd2 95694 100000"],
			["sdx3", "*/ iwd2 88192 100000"],
			["sdx4", "*/ iwd2 77301 100000"],
			["sdx5", "*/ iwd2 63439 100000"],
			["sdx6", "*/ iwd2 47140 100000"],
			["sdx7", "*/ iwd2 29028 100000"],
			["sdx8", "*/ iwd2 9802 100000"],
			["sdy1", "*/ ihd2 99518 100000"],
			["sdy2", "*/ ihd2 95694 100000"],
			["sdy3", "*/ ihd2 88192 100000"],
			["sdy4", "*/ ihd2 77301 100000"],
			["sdy5", "*/ ihd2 63439 100000"],
			["sdy6", "*/ ihd2 47140 100000"],
			["sdy7", "*/ ihd2 29028 100000"],
			["sdy8", "*/ ihd2 9802 100000"],
			["sx1", "+- hc 0 sdx1"],
			["sx2", "+- hc 0 sdx2"],
			["sx3", "+- hc 0 sdx3"],
			["sx4", "+- hc 0 sdx4"],
			["sx5", "+- hc 0 sdx5"],
			["sx6", "+- hc 0 sdx6"],
			["sx7", "+- hc 0 sdx7"],
			["sx8", "+- hc 0 sdx8"],
			["sx9", "+- hc sdx8 0"],
			["sx10", "+- hc sdx7 0"],
			["sx11", "+- hc sdx6 0"],
			["sx12", "+- hc sdx5 0"],
			["sx13", "+- hc sdx4 0"],
			["sx14", "+- hc sdx3 0"],
			["sx15", "+- hc sdx2 0"],
			["sx16", "+- hc sdx1 0"],
			["sy1", "+- vc 0 sdy1"],
			["sy2", "+- vc 0 sdy2"],
			["sy3", "+- vc 0 sdy3"],
			["sy4", "+- vc 0 sdy4"],
			["sy5", "+- vc 0 sdy5"],
			["sy6", "+- vc 0 sdy6"],
			["sy7", "+- vc 0 sdy7"],
			["sy8", "+- vc 0 sdy8"],
			["sy9", "+- vc sdy8 0"],
			["sy10", "+- vc sdy7 0"],
			["sy11", "+- vc sdy6 0"],
			["sy12", "+- vc sdy5 0"],
			["sy13", "+- vc sdy4 0"],
			["sy14", "+- vc sdy3 0"],
			["sy15", "+- vc sdy2 0"],
			["sy16", "+- vc sdy1 0"],
			["idx", "cos iwd2 2700000"],
			["idy", "sin ihd2 2700000"],
			["il", "+- hc 0 idx"],
			["it", "+- vc 0 idy"],
			["ir", "+- hc idx 0"],
			["ib", "+- vc idy 0"],
			["yAdj", "+- vc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"sx1",
					"sy8"
				],
				[
					"l",
					"x1",
					"y7"
				],
				[
					"l",
					"sx2",
					"sy7"
				],
				[
					"l",
					"x2",
					"y6"
				],
				[
					"l",
					"sx3",
					"sy6"
				],
				[
					"l",
					"x3",
					"y5"
				],
				[
					"l",
					"sx4",
					"sy5"
				],
				[
					"l",
					"x4",
					"y4"
				],
				[
					"l",
					"sx5",
					"sy4"
				],
				[
					"l",
					"x5",
					"y3"
				],
				[
					"l",
					"sx6",
					"sy3"
				],
				[
					"l",
					"x6",
					"y2"
				],
				[
					"l",
					"sx7",
					"sy2"
				],
				[
					"l",
					"x7",
					"y1"
				],
				[
					"l",
					"sx8",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx9",
					"sy1"
				],
				[
					"l",
					"x8",
					"y1"
				],
				[
					"l",
					"sx10",
					"sy2"
				],
				[
					"l",
					"x9",
					"y2"
				],
				[
					"l",
					"sx11",
					"sy3"
				],
				[
					"l",
					"x10",
					"y3"
				],
				[
					"l",
					"sx12",
					"sy4"
				],
				[
					"l",
					"x11",
					"y4"
				],
				[
					"l",
					"sx13",
					"sy5"
				],
				[
					"l",
					"x12",
					"y5"
				],
				[
					"l",
					"sx14",
					"sy6"
				],
				[
					"l",
					"x13",
					"y6"
				],
				[
					"l",
					"sx15",
					"sy7"
				],
				[
					"l",
					"x14",
					"y7"
				],
				[
					"l",
					"sx16",
					"sy8"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"sx16",
					"sy9"
				],
				[
					"l",
					"x14",
					"y8"
				],
				[
					"l",
					"sx15",
					"sy10"
				],
				[
					"l",
					"x13",
					"y9"
				],
				[
					"l",
					"sx14",
					"sy11"
				],
				[
					"l",
					"x12",
					"y10"
				],
				[
					"l",
					"sx13",
					"sy12"
				],
				[
					"l",
					"x11",
					"y11"
				],
				[
					"l",
					"sx12",
					"sy13"
				],
				[
					"l",
					"x10",
					"y12"
				],
				[
					"l",
					"sx11",
					"sy14"
				],
				[
					"l",
					"x9",
					"y13"
				],
				[
					"l",
					"sx10",
					"sy15"
				],
				[
					"l",
					"x8",
					"y14"
				],
				[
					"l",
					"sx9",
					"sy16"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"sx8",
					"sy16"
				],
				[
					"l",
					"x7",
					"y14"
				],
				[
					"l",
					"sx7",
					"sy15"
				],
				[
					"l",
					"x6",
					"y13"
				],
				[
					"l",
					"sx6",
					"sy14"
				],
				[
					"l",
					"x5",
					"y12"
				],
				[
					"l",
					"sx5",
					"sy13"
				],
				[
					"l",
					"x4",
					"y11"
				],
				[
					"l",
					"sx4",
					"sy12"
				],
				[
					"l",
					"x3",
					"y10"
				],
				[
					"l",
					"sx3",
					"sy11"
				],
				[
					"l",
					"x2",
					"y9"
				],
				[
					"l",
					"sx2",
					"sy10"
				],
				[
					"l",
					"x1",
					"y8"
				],
				[
					"l",
					"sx1",
					"sy9"
				],
				["c"]
			]
		}]
	},
	star4: {
		adj: [["adj", "val 12500"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["iwd2", "*/ wd2 a 50000"],
			["ihd2", "*/ hd2 a 50000"],
			["sdx", "cos iwd2 2700000"],
			["sdy", "sin ihd2 2700000"],
			["sx1", "+- hc 0 sdx"],
			["sx2", "+- hc sdx 0"],
			["sy1", "+- vc 0 sdy"],
			["sy2", "+- vc sdy 0"],
			["yAdj", "+- vc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"sx1",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx2",
					"sy1"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"sx2",
					"sy2"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"sx1",
					"sy2"
				],
				["c"]
			]
		}]
	},
	star5: {
		adj: [
			["adj", "val 19098"],
			["hf", "val 105146"],
			["vf", "val 110557"]
		],
		gd: [
			["a", "pin 0 adj 50000"],
			["swd2", "*/ wd2 hf 100000"],
			["shd2", "*/ hd2 vf 100000"],
			["svc", "*/ vc  vf 100000"],
			["dx1", "cos swd2 1080000"],
			["dx2", "cos swd2 18360000"],
			["dy1", "sin shd2 1080000"],
			["dy2", "sin shd2 18360000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"],
			["x4", "+- hc dx1 0"],
			["y1", "+- svc 0 dy1"],
			["y2", "+- svc 0 dy2"],
			["iwd2", "*/ swd2 a 50000"],
			["ihd2", "*/ shd2 a 50000"],
			["sdx1", "cos iwd2 20520000"],
			["sdx2", "cos iwd2 3240000"],
			["sdy1", "sin ihd2 3240000"],
			["sdy2", "sin ihd2 20520000"],
			["sx1", "+- hc 0 sdx1"],
			["sx2", "+- hc 0 sdx2"],
			["sx3", "+- hc sdx2 0"],
			["sx4", "+- hc sdx1 0"],
			["sy1", "+- svc 0 sdy1"],
			["sy2", "+- svc 0 sdy2"],
			["sy3", "+- svc ihd2 0"],
			["yAdj", "+- svc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y1"
				],
				[
					"l",
					"sx2",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx3",
					"sy1"
				],
				[
					"l",
					"x4",
					"y1"
				],
				[
					"l",
					"sx4",
					"sy2"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"hc",
					"sy3"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"sx1",
					"sy2"
				],
				["c"]
			]
		}]
	},
	star6: {
		adj: [["adj", "val 28868"], ["hf", "val 115470"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["swd2", "*/ wd2 hf 100000"],
			["dx1", "cos swd2 1800000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc dx1 0"],
			["y2", "+- vc hd4 0"],
			["iwd2", "*/ swd2 a 50000"],
			["ihd2", "*/ hd2 a 50000"],
			["sdx2", "*/ iwd2 1 2"],
			["sx1", "+- hc 0 iwd2"],
			["sx2", "+- hc 0 sdx2"],
			["sx3", "+- hc sdx2 0"],
			["sx4", "+- hc iwd2 0"],
			["sdy1", "sin ihd2 3600000"],
			["sy1", "+- vc 0 sdy1"],
			["sy2", "+- vc sdy1 0"],
			["yAdj", "+- vc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"hd4"
				],
				[
					"l",
					"sx2",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx3",
					"sy1"
				],
				[
					"l",
					"x2",
					"hd4"
				],
				[
					"l",
					"sx4",
					"vc"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"sx3",
					"sy2"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"sx2",
					"sy2"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"sx1",
					"vc"
				],
				["c"]
			]
		}]
	},
	star7: {
		adj: [
			["adj", "val 34601"],
			["hf", "val 102572"],
			["vf", "val 105210"]
		],
		gd: [
			["a", "pin 0 adj 50000"],
			["swd2", "*/ wd2 hf 100000"],
			["shd2", "*/ hd2 vf 100000"],
			["svc", "*/ vc  vf 100000"],
			["dx1", "*/ swd2 97493 100000"],
			["dx2", "*/ swd2 78183 100000"],
			["dx3", "*/ swd2 43388 100000"],
			["dy1", "*/ shd2 62349 100000"],
			["dy2", "*/ shd2 22252 100000"],
			["dy3", "*/ shd2 90097 100000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc 0 dx3"],
			["x4", "+- hc dx3 0"],
			["x5", "+- hc dx2 0"],
			["x6", "+- hc dx1 0"],
			["y1", "+- svc 0 dy1"],
			["y2", "+- svc dy2 0"],
			["y3", "+- svc dy3 0"],
			["iwd2", "*/ swd2 a 50000"],
			["ihd2", "*/ shd2 a 50000"],
			["sdx1", "*/ iwd2 97493 100000"],
			["sdx2", "*/ iwd2 78183 100000"],
			["sdx3", "*/ iwd2 43388 100000"],
			["sx1", "+- hc 0 sdx1"],
			["sx2", "+- hc 0 sdx2"],
			["sx3", "+- hc 0 sdx3"],
			["sx4", "+- hc sdx3 0"],
			["sx5", "+- hc sdx2 0"],
			["sx6", "+- hc sdx1 0"],
			["sdy1", "*/ ihd2 90097 100000"],
			["sdy2", "*/ ihd2 22252 100000"],
			["sdy3", "*/ ihd2 62349 100000"],
			["sy1", "+- svc 0 sdy1"],
			["sy2", "+- svc 0 sdy2"],
			["sy3", "+- svc sdy3 0"],
			["sy4", "+- svc ihd2 0"],
			["yAdj", "+- svc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x1",
					"y2"
				],
				[
					"l",
					"sx1",
					"sy2"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"sx3",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx4",
					"sy1"
				],
				[
					"l",
					"x5",
					"y1"
				],
				[
					"l",
					"sx6",
					"sy2"
				],
				[
					"l",
					"x6",
					"y2"
				],
				[
					"l",
					"sx5",
					"sy3"
				],
				[
					"l",
					"x4",
					"y3"
				],
				[
					"l",
					"hc",
					"sy4"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"sx2",
					"sy3"
				],
				["c"]
			]
		}]
	},
	star8: {
		adj: [["adj", "val 37500"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dx1", "cos wd2 2700000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc dx1 0"],
			["dy1", "sin hd2 2700000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc dy1 0"],
			["iwd2", "*/ wd2 a 50000"],
			["ihd2", "*/ hd2 a 50000"],
			["sdx1", "*/ iwd2 92388 100000"],
			["sdx2", "*/ iwd2 38268 100000"],
			["sdy1", "*/ ihd2 92388 100000"],
			["sdy2", "*/ ihd2 38268 100000"],
			["sx1", "+- hc 0 sdx1"],
			["sx2", "+- hc 0 sdx2"],
			["sx3", "+- hc sdx2 0"],
			["sx4", "+- hc sdx1 0"],
			["sy1", "+- vc 0 sdy1"],
			["sy2", "+- vc 0 sdy2"],
			["sy3", "+- vc sdy2 0"],
			["sy4", "+- vc sdy1 0"],
			["yAdj", "+- vc 0 ihd2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"sx1",
					"sy2"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"sx2",
					"sy1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"sx3",
					"sy1"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"sx4",
					"sy2"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"sx4",
					"sy3"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"sx3",
					"sy4"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"sx2",
					"sy4"
				],
				[
					"l",
					"x1",
					"y2"
				],
				[
					"l",
					"sx1",
					"sy3"
				],
				["c"]
			]
		}]
	},
	straightconnector1: {
		adj: [],
		gd: [],
		paths: [{
			w: null,
			h: null,
			fill: "none",
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"t"
			], [
				"l",
				"r",
				"b"
			]]
		}]
	},
	stripedrightarrow: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["maxAdj2", "*/ 84375 w ss"],
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 0 adj2 maxAdj2"],
			["x4", "*/ ss 5 32"],
			["dx5", "*/ ss a2 100000"],
			["x5", "+- r 0 dx5"],
			["dy1", "*/ h a1 200000"],
			["y1", "+- vc 0 dy1"],
			["y2", "+- vc dy1 0"],
			["dx6", "*/ dy1 dx5 hd2"],
			["x6", "+- r 0 dx6"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y1"
				],
				[
					"l",
					"ssd32",
					"y1"
				],
				[
					"l",
					"ssd32",
					"y2"
				],
				[
					"l",
					"l",
					"y2"
				],
				["c"],
				[
					"m",
					"ssd16",
					"y1"
				],
				[
					"l",
					"ssd8",
					"y1"
				],
				[
					"l",
					"ssd8",
					"y2"
				],
				[
					"l",
					"ssd16",
					"y2"
				],
				["c"],
				[
					"m",
					"x4",
					"y1"
				],
				[
					"l",
					"x5",
					"y1"
				],
				[
					"l",
					"x5",
					"t"
				],
				[
					"l",
					"r",
					"vc"
				],
				[
					"l",
					"x5",
					"b"
				],
				[
					"l",
					"x5",
					"y2"
				],
				[
					"l",
					"x4",
					"y2"
				],
				["c"]
			]
		}]
	},
	sun: {
		adj: [["adj", "val 25000"]],
		gd: [
			["a", "pin 12500 adj 46875"],
			["g0", "+- 50000 0 a"],
			["g1", "*/ g0 30274 32768"],
			["g2", "*/ g0 12540 32768"],
			["g3", "+- g1 50000 0"],
			["g4", "+- g2 50000 0"],
			["g5", "+- 50000 0 g1"],
			["g6", "+- 50000 0 g2"],
			["g7", "*/ g0 23170 32768"],
			["g8", "+- 50000 g7 0"],
			["g9", "+- 50000 0 g7"],
			["g10", "*/ g5 3 4"],
			["g11", "*/ g6 3 4"],
			["g12", "+- g10 3662 0"],
			["g13", "+- g11 3662 0"],
			["g14", "+- g11 12500 0"],
			["g15", "+- 100000 0 g10"],
			["g16", "+- 100000 0 g12"],
			["g17", "+- 100000 0 g13"],
			["g18", "+- 100000 0 g14"],
			["ox1", "*/ w 18436 21600"],
			["oy1", "*/ h 3163 21600"],
			["ox2", "*/ w 3163 21600"],
			["oy2", "*/ h 18436 21600"],
			["x8", "*/ w g8 100000"],
			["x9", "*/ w g9 100000"],
			["x10", "*/ w g10 100000"],
			["x12", "*/ w g12 100000"],
			["x13", "*/ w g13 100000"],
			["x14", "*/ w g14 100000"],
			["x15", "*/ w g15 100000"],
			["x16", "*/ w g16 100000"],
			["x17", "*/ w g17 100000"],
			["x18", "*/ w g18 100000"],
			["x19", "*/ w a 100000"],
			["wR", "*/ w g0 100000"],
			["hR", "*/ h g0 100000"],
			["y8", "*/ h g8 100000"],
			["y9", "*/ h g9 100000"],
			["y10", "*/ h g10 100000"],
			["y12", "*/ h g12 100000"],
			["y13", "*/ h g13 100000"],
			["y14", "*/ h g14 100000"],
			["y15", "*/ h g15 100000"],
			["y16", "*/ h g16 100000"],
			["y17", "*/ h g17 100000"],
			["y18", "*/ h g18 100000"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"r",
					"vc"
				],
				[
					"l",
					"x15",
					"y18"
				],
				[
					"l",
					"x15",
					"y14"
				],
				["c"],
				[
					"m",
					"ox1",
					"oy1"
				],
				[
					"l",
					"x16",
					"y13"
				],
				[
					"l",
					"x17",
					"y12"
				],
				["c"],
				[
					"m",
					"hc",
					"t"
				],
				[
					"l",
					"x18",
					"y10"
				],
				[
					"l",
					"x14",
					"y10"
				],
				["c"],
				[
					"m",
					"ox2",
					"oy1"
				],
				[
					"l",
					"x13",
					"y12"
				],
				[
					"l",
					"x12",
					"y13"
				],
				["c"],
				[
					"m",
					"l",
					"vc"
				],
				[
					"l",
					"x10",
					"y14"
				],
				[
					"l",
					"x10",
					"y18"
				],
				["c"],
				[
					"m",
					"ox2",
					"oy2"
				],
				[
					"l",
					"x12",
					"y17"
				],
				[
					"l",
					"x13",
					"y16"
				],
				["c"],
				[
					"m",
					"hc",
					"b"
				],
				[
					"l",
					"x14",
					"y15"
				],
				[
					"l",
					"x18",
					"y15"
				],
				["c"],
				[
					"m",
					"ox1",
					"oy2"
				],
				[
					"l",
					"x17",
					"y16"
				],
				[
					"l",
					"x16",
					"y17"
				],
				["c"],
				[
					"m",
					"x19",
					"vc"
				],
				[
					"a",
					"wR",
					"hR",
					"cd2",
					"21600000"
				],
				["c"]
			]
		}]
	},
	swoosharrow: {
		adj: [["adj1", "val 25000"], ["adj2", "val 16667"]],
		gd: [
			["a1", "pin 1 adj1 75000"],
			["maxAdj2", "*/ 70000 w ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["ad1", "*/ h a1 100000"],
			["ad2", "*/ ss a2 100000"],
			["xB", "+- r 0 ad2"],
			["yB", "+- t ssd8 0"],
			["alfa", "*/ cd4 1 14"],
			["dx0", "tan ssd8 alfa"],
			["xC", "+- xB 0 dx0"],
			["dx1", "tan ad1 alfa"],
			["yF", "+- yB ad1 0"],
			["xF", "+- xB dx1 0"],
			["xE", "+- xF dx0 0"],
			["yE", "+- yF ssd8 0"],
			["dy2", "+- yE 0 t"],
			["dy22", "*/ dy2 1 2"],
			["dy3", "*/ h 1 20"],
			["yD", "+- t dy22 dy3"],
			["dy4", "*/ hd6 1 1"],
			["yP1", "+- hd6 dy4 0"],
			["xP1", "val wd6"],
			["dy5", "*/ hd6 1 2"],
			["yP2", "+- yF dy5 0"],
			["xP2", "val wd4"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"b"
				],
				[
					"Q",
					"xP1",
					"yP1",
					"xB",
					"yB"
				],
				[
					"l",
					"xC",
					"t"
				],
				[
					"l",
					"r",
					"yD"
				],
				[
					"l",
					"xE",
					"yE"
				],
				[
					"l",
					"xF",
					"yF"
				],
				[
					"Q",
					"xP2",
					"yP2",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	teardrop: {
		adj: [["adj", "val 100000"]],
		gd: [
			["a", "pin 0 adj 200000"],
			["r2", "sqrt 2"],
			["tw", "*/ wd2 r2 1"],
			["th", "*/ hd2 r2 1"],
			["sw", "*/ tw a 100000"],
			["sh", "*/ th a 100000"],
			["dx1", "cos sw 2700000"],
			["dy1", "sin sh 2700000"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc 0 dy1"],
			["x2", "+/ hc x1 2"],
			["y2", "+/ vc y1 2"],
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"vc"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd2",
					"cd4"
				],
				[
					"Q",
					"x2",
					"t",
					"x1",
					"y1"
				],
				[
					"Q",
					"r",
					"y2",
					"r",
					"vc"
				],
				[
					"a",
					"wd2",
					"hd2",
					"0",
					"cd4"
				],
				[
					"a",
					"wd2",
					"hd2",
					"cd4",
					"cd4"
				],
				["c"]
			]
		}]
	},
	trapezoid: {
		adj: [["adj", "val 25000"]],
		gd: [
			["maxAdj", "*/ 50000 w ss"],
			["a", "pin 0 adj maxAdj"],
			["x1", "*/ ss a 200000"],
			["x2", "*/ ss a 100000"],
			["x3", "+- r 0 x2"],
			["x4", "+- r 0 x1"],
			["il", "*/ wd3 a maxAdj"],
			["it", "*/ hd3 a maxAdj"],
			["ir", "+- r 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"b"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"x3",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				["c"]
			]
		}]
	},
	triangle: {
		adj: [["adj", "val 50000"]],
		gd: [
			["a", "pin 0 adj 100000"],
			["x1", "*/ w a 200000"],
			["x2", "*/ w a 100000"],
			["x3", "+- x1 wd2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"b"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"r",
					"b"
				],
				["c"]
			]
		}]
	},
	uparrowcallout: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"],
			["adj4", "val 64977"]
		],
		gd: [
			["maxAdj2", "*/ 50000 w ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["maxAdj3", "*/ 100000 h ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["q2", "*/ a3 ss h"],
			["maxAdj4", "+- 100000 0 q2"],
			["a4", "pin 0 adj4 maxAdj4"],
			["dx1", "*/ ss a2 100000"],
			["dx2", "*/ ss a1 200000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"],
			["x4", "+- hc dx1 0"],
			["y1", "*/ ss a3 100000"],
			["dy2", "*/ h a4 100000"],
			["y2", "+- b 0 dy2"],
			["y3", "+/ y2 b 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"x4",
					"y1"
				],
				[
					"l",
					"x3",
					"y1"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				["c"]
			]
		}]
	},
	updownarrow: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["maxAdj2", "*/ 50000 h ss"],
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 0 adj2 maxAdj2"],
			["y2", "*/ ss a2 100000"],
			["y3", "+- b 0 y2"],
			["dx1", "*/ w a1 200000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc dx1 0"],
			["dy1", "*/ x1 y2 wd2"],
			["y1", "+- y2 0 dy1"],
			["y4", "+- y3 dy1 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y2"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"y3"
				],
				[
					"l",
					"r",
					"y3"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"l",
					"y3"
				],
				[
					"l",
					"x1",
					"y3"
				],
				[
					"l",
					"x1",
					"y2"
				],
				["c"]
			]
		}]
	},
	uparrow: {
		adj: [["adj1", "val 50000"], ["adj2", "val 50000"]],
		gd: [
			["maxAdj2", "*/ 100000 h ss"],
			["a1", "pin 0 adj1 100000"],
			["a2", "pin 0 adj2 maxAdj2"],
			["dy2", "*/ ss a2 100000"],
			["y2", "+- t dy2 0"],
			["dx1", "*/ w a1 200000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc dx1 0"],
			["dy1", "*/ x1 dy2 wd2"],
			["y1", "+- y2  0 dy1"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y2"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"l",
					"x1",
					"y2"
				],
				["c"]
			]
		}]
	},
	updownarrowcallout: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"],
			["adj4", "val 48123"]
		],
		gd: [
			["maxAdj2", "*/ 50000 w ss"],
			["a2", "pin 0 adj2 maxAdj2"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["maxAdj3", "*/ 50000 h ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["q2", "*/ a3 ss hd2"],
			["maxAdj4", "+- 100000 0 q2"],
			["a4", "pin 0 adj4 maxAdj4"],
			["dx1", "*/ ss a2 100000"],
			["dx2", "*/ ss a1 200000"],
			["x1", "+- hc 0 dx1"],
			["x2", "+- hc 0 dx2"],
			["x3", "+- hc dx2 0"],
			["x4", "+- hc dx1 0"],
			["y1", "*/ ss a3 100000"],
			["y4", "+- b 0 y1"],
			["dy2", "*/ h a4 200000"],
			["y2", "+- vc 0 dy2"],
			["y3", "+- vc dy2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y2"
				],
				[
					"l",
					"x2",
					"y2"
				],
				[
					"l",
					"x2",
					"y1"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"x4",
					"y1"
				],
				[
					"l",
					"x3",
					"y1"
				],
				[
					"l",
					"x3",
					"y2"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"r",
					"y3"
				],
				[
					"l",
					"x3",
					"y3"
				],
				[
					"l",
					"x3",
					"y4"
				],
				[
					"l",
					"x4",
					"y4"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"x1",
					"y4"
				],
				[
					"l",
					"x2",
					"y4"
				],
				[
					"l",
					"x2",
					"y3"
				],
				[
					"l",
					"l",
					"y3"
				],
				["c"]
			]
		}]
	},
	uturnarrow: {
		adj: [
			["adj1", "val 25000"],
			["adj2", "val 25000"],
			["adj3", "val 25000"],
			["adj4", "val 43750"],
			["adj5", "val 75000"]
		],
		gd: [
			["a2", "pin 0 adj2 25000"],
			["maxAdj1", "*/ a2 2 1"],
			["a1", "pin 0 adj1 maxAdj1"],
			["q2", "*/ a1 ss h"],
			["q3", "+- 100000 0 q2"],
			["maxAdj3", "*/ q3 h ss"],
			["a3", "pin 0 adj3 maxAdj3"],
			["q1", "+- a3 a1 0"],
			["minAdj5", "*/ q1 ss h"],
			["a5", "pin minAdj5 adj5 100000"],
			["th", "*/ ss a1 100000"],
			["aw2", "*/ ss a2 100000"],
			["th2", "*/ th 1 2"],
			["dh2", "+- aw2 0 th2"],
			["y5", "*/ h a5 100000"],
			["ah", "*/ ss a3 100000"],
			["y4", "+- y5 0 ah"],
			["x9", "+- r 0 dh2"],
			["bw", "*/ x9 1 2"],
			["bs", "min bw y4"],
			["maxAdj4", "*/ bs 100000 ss"],
			["a4", "pin 0 adj4 maxAdj4"],
			["bd", "*/ ss a4 100000"],
			["bd3", "+- bd 0 th"],
			["bd2", "max bd3 0"],
			["x3", "+- th bd2 0"],
			["x8", "+- r 0 aw2"],
			["x6", "+- x8 0 aw2"],
			["x7", "+- x6 dh2 0"],
			["x4", "+- x9 0 bd"],
			["x5", "+- x7 0 bd2"],
			["cx", "+/ th x7 2"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"b"
				],
				[
					"l",
					"l",
					"bd"
				],
				[
					"a",
					"bd",
					"bd",
					"cd2",
					"cd4"
				],
				[
					"l",
					"x4",
					"t"
				],
				[
					"a",
					"bd",
					"bd",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"x9",
					"y4"
				],
				[
					"l",
					"r",
					"y4"
				],
				[
					"l",
					"x8",
					"y5"
				],
				[
					"l",
					"x6",
					"y4"
				],
				[
					"l",
					"x7",
					"y4"
				],
				[
					"l",
					"x7",
					"x3"
				],
				[
					"a",
					"bd2",
					"bd2",
					"0",
					"-5400000"
				],
				[
					"l",
					"x3",
					"th"
				],
				[
					"a",
					"bd2",
					"bd2",
					"3cd4",
					"-5400000"
				],
				[
					"l",
					"th",
					"b"
				],
				["c"]
			]
		}]
	},
	verticalscroll: {
		adj: [["adj", "val 12500"]],
		gd: [
			["a", "pin 0 adj 25000"],
			["ch", "*/ ss a 100000"],
			["ch2", "*/ ch 1 2"],
			["ch4", "*/ ch 1 4"],
			["x3", "+- ch ch2 0"],
			["x4", "+- ch ch 0"],
			["x6", "+- r 0 ch"],
			["x7", "+- r 0 ch2"],
			["x5", "+- x6 0 ch2"],
			["y3", "+- b 0 ch"],
			["y4", "+- b 0 ch2"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"ch2",
						"b"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd4",
						"-5400000"
					],
					[
						"l",
						"ch2",
						"y4"
					],
					[
						"a",
						"ch4",
						"ch4",
						"cd4",
						"-10800000"
					],
					[
						"l",
						"ch",
						"y3"
					],
					[
						"l",
						"ch",
						"ch2"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd2",
						"cd4"
					],
					[
						"l",
						"x7",
						"t"
					],
					[
						"a",
						"ch2",
						"ch2",
						"3cd4",
						"cd2"
					],
					[
						"l",
						"x6",
						"ch"
					],
					[
						"l",
						"x6",
						"y4"
					],
					[
						"a",
						"ch2",
						"ch2",
						"0",
						"cd4"
					],
					["c"],
					[
						"m",
						"x4",
						"ch2"
					],
					[
						"a",
						"ch2",
						"ch2",
						"0",
						"cd4"
					],
					[
						"a",
						"ch4",
						"ch4",
						"cd4",
						"cd2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "darkenLess",
				stroke: !1,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"x4",
						"ch2"
					],
					[
						"a",
						"ch2",
						"ch2",
						"0",
						"cd4"
					],
					[
						"a",
						"ch4",
						"ch4",
						"cd4",
						"cd2"
					],
					["c"],
					[
						"m",
						"ch",
						"y4"
					],
					[
						"a",
						"ch2",
						"ch2",
						"0",
						"3cd4"
					],
					[
						"a",
						"ch4",
						"ch4",
						"3cd4",
						"cd2"
					],
					["c"]
				]
			},
			{
				w: null,
				h: null,
				fill: "none",
				stroke: !0,
				extrusionOk: !1,
				cmds: [
					[
						"m",
						"ch",
						"y3"
					],
					[
						"l",
						"ch",
						"ch2"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd2",
						"cd4"
					],
					[
						"l",
						"x7",
						"t"
					],
					[
						"a",
						"ch2",
						"ch2",
						"3cd4",
						"cd2"
					],
					[
						"l",
						"x6",
						"ch"
					],
					[
						"l",
						"x6",
						"y4"
					],
					[
						"a",
						"ch2",
						"ch2",
						"0",
						"cd4"
					],
					[
						"l",
						"ch2",
						"b"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd4",
						"cd2"
					],
					["c"],
					[
						"m",
						"x3",
						"t"
					],
					[
						"a",
						"ch2",
						"ch2",
						"3cd4",
						"cd2"
					],
					[
						"a",
						"ch4",
						"ch4",
						"cd4",
						"cd2"
					],
					[
						"l",
						"x4",
						"ch2"
					],
					[
						"m",
						"x6",
						"ch"
					],
					[
						"l",
						"x3",
						"ch"
					],
					[
						"m",
						"ch2",
						"y3"
					],
					[
						"a",
						"ch4",
						"ch4",
						"3cd4",
						"cd2"
					],
					[
						"l",
						"ch",
						"y4"
					],
					[
						"m",
						"ch2",
						"b"
					],
					[
						"a",
						"ch2",
						"ch2",
						"cd4",
						"-5400000"
					],
					[
						"l",
						"ch",
						"y3"
					]
				]
			}
		]
	},
	wave: {
		adj: [["adj1", "val 12500"], ["adj2", "val 0"]],
		gd: [
			["a1", "pin 0 adj1 20000"],
			["a2", "pin -10000 adj2 10000"],
			["y1", "*/ h a1 100000"],
			["dy2", "*/ y1 10 3"],
			["y2", "+- y1 0 dy2"],
			["y3", "+- y1 dy2 0"],
			["y4", "+- b 0 y1"],
			["y5", "+- y4 0 dy2"],
			["y6", "+- y4 dy2 0"],
			["dx1", "*/ w a2 100000"],
			["of2", "*/ w a2 50000"],
			["x1", "abs dx1"],
			["dx2", "?: of2 0 of2"],
			["x2", "+- l 0 dx2"],
			["dx5", "?: of2 of2 0"],
			["x5", "+- r 0 dx5"],
			["dx3", "+/ dx2 x5 3"],
			["x3", "+- x2 dx3 0"],
			["x4", "+/ x3 x5 2"],
			["x6", "+- l dx5 0"],
			["x10", "+- r dx2 0"],
			["x7", "+- x6 dx3 0"],
			["x8", "+/ x7 x10 2"],
			["x9", "+- r 0 x1"],
			["xAdj", "+- hc dx1 0"],
			["xAdj2", "+- hc 0 dx1"],
			["il", "max x2 x6"],
			["ir", "min x5 x10"],
			["it", "*/ h a1 50000"],
			["ib", "+- b 0 it"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x2",
					"y1"
				],
				[
					"C",
					"x3",
					"y2",
					"x4",
					"y3",
					"x5",
					"y1"
				],
				[
					"l",
					"x10",
					"y4"
				],
				[
					"C",
					"x8",
					"y6",
					"x7",
					"y5",
					"x6",
					"y4"
				],
				["c"]
			]
		}]
	},
	wedgeellipsecallout: {
		adj: [["adj1", "val -20833"], ["adj2", "val 62500"]],
		gd: [
			["dxPos", "*/ w adj1 100000"],
			["dyPos", "*/ h adj2 100000"],
			["xPos", "+- hc dxPos 0"],
			["yPos", "+- vc dyPos 0"],
			["sdx", "*/ dxPos h 1"],
			["sdy", "*/ dyPos w 1"],
			["pang", "at2 sdx sdy"],
			["stAng", "+- pang 660000 0"],
			["enAng", "+- pang 0 660000"],
			["dx1", "cos wd2 stAng"],
			["dy1", "sin hd2 stAng"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["dx2", "cos wd2 enAng"],
			["dy2", "sin hd2 enAng"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"],
			["stAng1", "at2 dx1 dy1"],
			["enAng1", "at2 dx2 dy2"],
			["swAng1", "+- enAng1 0 stAng1"],
			["swAng2", "+- swAng1 21600000 0"],
			["swAng", "?: swAng1 swAng1 swAng2"],
			["idx", "cos wd2 2700000"],
			["idy", "sin hd2 2700000"],
			["il", "+- hc 0 idx"],
			["ir", "+- hc idx 0"],
			["it", "+- vc 0 idy"],
			["ib", "+- vc idy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"xPos",
					"yPos"
				],
				[
					"l",
					"x1",
					"y1"
				],
				[
					"a",
					"wd2",
					"hd2",
					"stAng1",
					"swAng"
				],
				["c"]
			]
		}]
	},
	wedgerectcallout: {
		adj: [["adj1", "val -20833"], ["adj2", "val 62500"]],
		gd: [
			["dxPos", "*/ w adj1 100000"],
			["dyPos", "*/ h adj2 100000"],
			["xPos", "+- hc dxPos 0"],
			["yPos", "+- vc dyPos 0"],
			["dx", "+- xPos 0 hc"],
			["dy", "+- yPos 0 vc"],
			["dq", "*/ dxPos h w"],
			["ady", "abs dyPos"],
			["adq", "abs dq"],
			["dz", "+- ady 0 adq"],
			["xg1", "?: dxPos 7 2"],
			["xg2", "?: dxPos 10 5"],
			["x1", "*/ w xg1 12"],
			["x2", "*/ w xg2 12"],
			["yg1", "?: dyPos 7 2"],
			["yg2", "?: dyPos 10 5"],
			["y1", "*/ h yg1 12"],
			["y2", "*/ h yg2 12"],
			["t1", "?: dxPos l xPos"],
			["xl", "?: dz l t1"],
			["t2", "?: dyPos x1 xPos"],
			["xt", "?: dz t2 x1"],
			["t3", "?: dxPos xPos r"],
			["xr", "?: dz r t3"],
			["t4", "?: dyPos xPos x1"],
			["xb", "?: dz t4 x1"],
			["t5", "?: dxPos y1 yPos"],
			["yl", "?: dz y1 t5"],
			["t6", "?: dyPos t yPos"],
			["yt", "?: dz t6 t"],
			["t7", "?: dxPos yPos y1"],
			["yr", "?: dz y1 t7"],
			["t8", "?: dyPos yPos b"],
			["yb", "?: dz t8 b"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"t"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"xt",
					"yt"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"r",
					"t"
				],
				[
					"l",
					"r",
					"y1"
				],
				[
					"l",
					"xr",
					"yr"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"r",
					"b"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"xb",
					"yb"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"l",
					"l",
					"b"
				],
				[
					"l",
					"l",
					"y2"
				],
				[
					"l",
					"xl",
					"yl"
				],
				[
					"l",
					"l",
					"y1"
				],
				["c"]
			]
		}]
	},
	wedgeroundrectcallout: {
		adj: [
			["adj1", "val -20833"],
			["adj2", "val 62500"],
			["adj3", "val 16667"]
		],
		gd: [
			["dxPos", "*/ w adj1 100000"],
			["dyPos", "*/ h adj2 100000"],
			["xPos", "+- hc dxPos 0"],
			["yPos", "+- vc dyPos 0"],
			["dq", "*/ dxPos h w"],
			["ady", "abs dyPos"],
			["adq", "abs dq"],
			["dz", "+- ady 0 adq"],
			["xg1", "?: dxPos 7 2"],
			["xg2", "?: dxPos 10 5"],
			["x1", "*/ w xg1 12"],
			["x2", "*/ w xg2 12"],
			["yg1", "?: dyPos 7 2"],
			["yg2", "?: dyPos 10 5"],
			["y1", "*/ h yg1 12"],
			["y2", "*/ h yg2 12"],
			["t1", "?: dxPos l xPos"],
			["xl", "?: dz l t1"],
			["t2", "?: dyPos x1 xPos"],
			["xt", "?: dz t2 x1"],
			["t3", "?: dxPos xPos r"],
			["xr", "?: dz r t3"],
			["t4", "?: dyPos xPos x1"],
			["xb", "?: dz t4 x1"],
			["t5", "?: dxPos y1 yPos"],
			["yl", "?: dz y1 t5"],
			["t6", "?: dyPos t yPos"],
			["yt", "?: dz t6 t"],
			["t7", "?: dxPos yPos y1"],
			["yr", "?: dz y1 t7"],
			["t8", "?: dyPos yPos b"],
			["yb", "?: dz t8 b"],
			["u1", "*/ ss adj3 100000"],
			["u2", "+- r 0 u1"],
			["v2", "+- b 0 u1"],
			["il", "*/ u1 29289 100000"],
			["ir", "+- r 0 il"],
			["ib", "+- b 0 il"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"u1"
				],
				[
					"a",
					"u1",
					"u1",
					"cd2",
					"cd4"
				],
				[
					"l",
					"x1",
					"t"
				],
				[
					"l",
					"xt",
					"yt"
				],
				[
					"l",
					"x2",
					"t"
				],
				[
					"l",
					"u2",
					"t"
				],
				[
					"a",
					"u1",
					"u1",
					"3cd4",
					"cd4"
				],
				[
					"l",
					"r",
					"y1"
				],
				[
					"l",
					"xr",
					"yr"
				],
				[
					"l",
					"r",
					"y2"
				],
				[
					"l",
					"r",
					"v2"
				],
				[
					"a",
					"u1",
					"u1",
					"0",
					"cd4"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"xb",
					"yb"
				],
				[
					"l",
					"x1",
					"b"
				],
				[
					"l",
					"u1",
					"b"
				],
				[
					"a",
					"u1",
					"u1",
					"cd4",
					"cd4"
				],
				[
					"l",
					"l",
					"y2"
				],
				[
					"l",
					"xl",
					"yl"
				],
				[
					"l",
					"l",
					"y1"
				],
				["c"]
			]
		}]
	}
}, D = 216e5, Fe = Math.PI * 2 / D;
function Ie(e) {
	let t = e.trim().split(/\s+/);
	return {
		op: t[0],
		argTokens: t.slice(1)
	};
}
function Le(e, t, n) {
	let { w: r, h: i, adj: a } = e, o = Math.min(r, i), s = Math.max(r, i), c = Object.create(null);
	Object.assign(c, {
		w: r,
		h: i,
		l: 0,
		t: 0,
		r,
		b: i,
		hc: r / 2,
		vc: i / 2,
		wd2: r / 2,
		wd3: r / 3,
		wd4: r / 4,
		wd5: r / 5,
		wd6: r / 6,
		wd8: r / 8,
		wd10: r / 10,
		wd12: r / 12,
		wd16: r / 16,
		wd32: r / 32,
		hd2: i / 2,
		hd3: i / 3,
		hd4: i / 4,
		hd5: i / 5,
		hd6: i / 6,
		hd8: i / 8,
		hd10: i / 10,
		hd12: i / 12,
		hd16: i / 16,
		hd32: i / 32,
		ss: o,
		ssd2: o / 2,
		ssd4: o / 4,
		ssd6: o / 6,
		ssd8: o / 8,
		ssd16: o / 16,
		ssd32: o / 32,
		ls: s,
		lsd2: s / 2,
		lsd4: s / 4,
		lsd6: s / 6,
		lsd8: s / 8,
		lsd16: s / 16,
		lsd32: s / 32,
		cd: D,
		cd2: D / 2,
		cd4: D / 4,
		cd8: D / 8,
		"3cd4": 3 * D / 4,
		"3cd8": 3 * D / 8,
		"5cd8": 5 * D / 8,
		"7cd8": 7 * D / 8
	}), t.forEach(([e, t], n) => {
		let r = a[n];
		c[e] = typeof r == "number" ? r : u(t), e === "adj" && (c.adj1 = c.adj), e === "adj1" && (c.adj = c.adj1);
	});
	for (let [e, t] of n) c[e] = u(t);
	return {
		v: (e) => {
			if (e in c) return c[e];
			throw Error(`preset-shape: unknown name "${e}"`);
		},
		fmla: u,
		resolve: l
	};
	function l(e) {
		if (e in c) return c[e];
		let t = Number(e);
		if (Number.isFinite(t)) return t;
		throw Error(`preset-shape: cannot resolve "${e}"`);
	}
	function u(e) {
		let t = e.argTokens.map(l);
		return d(e.op, t, e);
	}
	function d(e, t, n) {
		switch (e) {
			case "val": return t[0];
			case "*/": return t[0] * t[1] / t[2];
			case "+-": return t[0] + t[1] - t[2];
			case "+/": return (t[0] + t[1]) / t[2];
			case "?:": return t[0] > 0 ? t[1] : t[2];
			case "abs": return Math.abs(t[0]);
			case "min": return Math.min(t[0], t[1]);
			case "max": return Math.max(t[0], t[1]);
			case "pin": return t[1] < t[0] ? t[0] : t[1] > t[2] ? t[2] : t[1];
			case "sqrt": return Math.sqrt(Math.max(0, t[0]));
			case "mod": return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
			case "sin": return t[0] * Math.sin(t[1] * Fe);
			case "cos": return t[0] * Math.cos(t[1] * Fe);
			case "tan": return t[0] * Math.tan(t[1] * Fe);
			case "at2": return Math.atan2(t[1], t[0]) / Fe;
			case "cat2": return t[0] * Math.cos(Math.atan2(t[2], t[1]));
			case "sat2": return t[0] * Math.sin(Math.atan2(t[2], t[1]));
			default: throw Error(`preset-shape: unknown operator "${e}" in "${[n.op, ...n.argTokens].join(" ")}"`);
		}
	}
}
//#endregion
//#region packages/core/src/shape/preset-geometry/path-executor.ts
var Re = Math.PI * 2 / 216e5;
function ze(e, t, n, r, i, a, o) {
	let s = t.w == null ? 1 : a / t.w, c = t.h == null ? 1 : o / t.h, l = (e) => r + e * s, u = (e) => i + e * c, d = 0, f = 0;
	for (let r of t.cmds) switch (r[0]) {
		case "m": {
			let t = l(n.resolve(r[1])), i = u(n.resolve(r[2]));
			e.moveTo(t, i), d = t, f = i;
			break;
		}
		case "l": {
			let t = l(n.resolve(r[1])), i = u(n.resolve(r[2]));
			e.lineTo(t, i), d = t, f = i;
			break;
		}
		case "C": {
			let t = l(n.resolve(r[1])), i = u(n.resolve(r[2])), a = l(n.resolve(r[3])), o = u(n.resolve(r[4])), s = l(n.resolve(r[5])), c = u(n.resolve(r[6]));
			e.bezierCurveTo(t, i, a, o, s, c), d = s, f = c;
			break;
		}
		case "Q": {
			let t = l(n.resolve(r[1])), i = u(n.resolve(r[2])), a = l(n.resolve(r[3])), o = u(n.resolve(r[4]));
			e.quadraticCurveTo(t, i, a, o), d = a, f = o;
			break;
		}
		case "a": {
			let t = n.resolve(r[1]), i = n.resolve(r[2]), a = t * s, o = i * c, l = n.resolve(r[3]) * Re, u = n.resolve(r[4]) * Re, p = Math.PI * 2, m = (e) => Math.atan2(t * Math.sin(e), i * Math.cos(e)), h = m(l), g = Math.trunc(u / p), _ = u - g * p, v = m(l + _) - h;
			_ > 0 && v < 0 ? v += p : _ < 0 && v > 0 && (v -= p);
			let y = h + v + g * p, b = d - a * Math.cos(h), x = f - o * Math.sin(h);
			Math.abs(a) > 1e-6 && Math.abs(o) > 1e-6 && (e.ellipse(b, x, Math.abs(a), Math.abs(o), 0, h, y, u < 0), d = b + a * Math.cos(y), f = x + o * Math.sin(y));
			break;
		}
		case "c":
			e.closePath();
			break;
	}
}
//#endregion
//#region packages/core/src/shape/preset-geometry/index.ts
var O = Pe, Be = /* @__PURE__ */ new WeakMap();
function Ve(e) {
	let t = Be.get(e);
	return t || (t = {
		adj: e.adj.map(([e, t]) => [e, Ie(t)]),
		gd: e.gd.map(([e, t]) => [e, Ie(t)])
	}, Be.set(e, t)), t;
}
function He(e, t, n, r) {
	let i = Ve(e);
	return Le({
		w: t,
		h: n,
		adj: r
	}, i.adj, i.gd);
}
function Ue(e) {
	return e.toLowerCase() in O;
}
function We(e, t, n, r, i, a, o = []) {
	let s = O[t.toLowerCase()];
	if (!s) return !1;
	let c = He(s, i, a, o);
	for (let t of s.paths) ze(e, t, c, n, r, i, a);
	return !0;
}
function Ge(e, t, n, r, i, a, o = []) {
	let s = O[t.toLowerCase()];
	if (!s) return !1;
	let c = He(s, i, a, o);
	for (let t of s.paths) t.fill !== "none" && ze(e, t, c, n, r, i, a);
	return !0;
}
var Ke = {
	wedgeroundrectcallout: "roundrect",
	wedgeellipsecallout: "ellipse",
	wedgerectcallout: null
}, qe = {
	adj: [],
	gd: [],
	paths: [{
		w: null,
		h: null,
		fill: null,
		stroke: !0,
		extrusionOk: !1,
		cmds: [
			[
				"m",
				"l",
				"t"
			],
			[
				"l",
				"r",
				"t"
			],
			[
				"l",
				"r",
				"b"
			],
			[
				"l",
				"l",
				"b"
			],
			["c"]
		]
	}]
};
function Je(e, t, n) {
	let r = e[n];
	if (typeof r == "number") return r;
	let i = t.adj[n];
	return i && Number(i[1].replace(/^val\s+/, "")) || 0;
}
function Ye(e, t, n, r) {
	let i = O[e];
	if (!i) return null;
	if (e in Ke) {
		let a = Je(r, i, 0), o = Je(r, i, 1), s = t / 2 + t * a / 1e5, c = n / 2 + n * o / 1e5;
		if (s >= 0 && s <= t && c >= 0 && c <= n) {
			let t = Ke[e];
			t === "roundrect" ? (i = O.roundrect, r = [Je(r, O[e], 2)]) : t && O[t] ? (i = O[t], r = []) : (i = qe, r = []);
		}
	}
	return {
		def: i,
		adj: r
	};
}
function Xe(e, t, n, r, i, a = []) {
	let o = Ye(e.toLowerCase(), r, i, a);
	if (!o) return null;
	let s = Infinity, c = Infinity, l = -Infinity, u = -Infinity, d = (e, t) => {
		!Number.isFinite(e) || !Number.isFinite(t) || (s = Math.min(s, e), c = Math.min(c, t), l = Math.max(l, e), u = Math.max(u, t));
	}, f = {
		moveTo: d,
		lineTo: d,
		bezierCurveTo(e, t, n, r, i, a) {
			d(e, t), d(n, r), d(i, a);
		},
		quadraticCurveTo(e, t, n, r) {
			d(e, t), d(n, r);
		},
		ellipse(e, t, n, r) {
			d(e - Math.abs(n), t - Math.abs(r)), d(e + Math.abs(n), t + Math.abs(r));
		},
		closePath() {}
	}, p = He(o.def, r, i, o.adj);
	for (let e of o.def.paths) ze(f, e, p, t, n, r, i);
	return Number.isFinite(s) ? {
		x: s,
		y: c,
		w: l - s,
		h: u - c
	} : {
		x: t,
		y: n,
		w: r,
		h: i
	};
}
function Ze(e, t, n, r, i, a, o, s, c, l, u) {
	let d = Ye(t.toLowerCase(), i, a, o);
	if (!d) return !1;
	let { def: f } = d;
	o = d.adj;
	let p = He(f, i, a, o), m = !1, h = f.paths.length - 1;
	for (let t = 0; t < f.paths.length; t++) {
		let o = f.paths[t];
		e.beginPath(), ze(e, o, p, n, r, i, a);
		let d = o.fill;
		if (d !== "none" && s != null) {
			e.save(), e.fillStyle = s, e.fill();
			let t = $e(d);
			t && (e.fillStyle = t, e.fill()), e.restore(), m ||= (l(), !0);
		}
		if (o.stroke && c) {
			let e = t === h && (o.fill === "none" || o.fill == null);
			u?.skipTrailingStroke && e || c();
		}
	}
	return !0;
}
function Qe(e, t, n, r, i, a) {
	let o = O[e.toLowerCase()];
	if (!o || o.paths.length === 0) return null;
	let s = o.paths[o.paths.length - 1], c = He(o, r, i, a), l = s.w == null ? 1 : r / s.w, u = s.h == null ? 1 : i / s.h, d = (e) => t + e * l, f = (e) => n + e * u, p = 0, m = 0, h = 0, g = 0, _ = 0, v = 0, y = !1, b = 0, x = 0, S = [];
	for (let e of s.cmds) switch (e[0]) {
		case "m":
			h = d(c.resolve(e[1])), g = f(c.resolve(e[2])), p = h, m = g, S.push({
				x: h,
				y: g
			});
			break;
		case "l": {
			let t = d(c.resolve(e[1])), n = f(c.resolve(e[2]));
			y ||= (_ = t - h, v = n - g, !0), b = t - h, x = n - g, h = t, g = n, S.push({
				x: h,
				y: g
			});
			break;
		}
		case "C": {
			let t = d(c.resolve(e[1])), n = f(c.resolve(e[2])), r = d(c.resolve(e[3])), i = f(c.resolve(e[4])), a = d(c.resolve(e[5])), o = f(c.resolve(e[6]));
			y ||= (_ = t - h, v = n - g, !0), b = a - r, x = o - i, h = a, g = o, S.push({
				x: h,
				y: g
			});
			break;
		}
	}
	let C = Math.atan2(v, _) + Math.PI;
	return {
		start: {
			x: p,
			y: m,
			angle: C
		},
		end: {
			x: h,
			y: g,
			angle: Math.atan2(x, b)
		},
		vertices: S
	};
}
function $e(e) {
	switch (e) {
		case "lighten": return "rgba(255,255,255,0.30)";
		case "lightenLess": return "rgba(255,255,255,0.15)";
		case "darken": return "rgba(0,0,0,0.30)";
		case "darkenLess": return "rgba(0,0,0,0.15)";
		default: return null;
	}
}
//#endregion
//#region packages/core/src/image/emf.ts
var k = {
	HEADER: 1,
	POLYBEZIER: 2,
	POLYGON: 3,
	POLYLINE: 4,
	POLYBEZIERTO: 5,
	POLYLINETO: 6,
	POLYPOLYLINE: 7,
	POLYPOLYGON: 8,
	SETWINDOWEXTEX: 9,
	SETWINDOWORGEX: 10,
	SETVIEWPORTEXTEX: 11,
	SETVIEWPORTORGEX: 12,
	EOF: 14,
	SETMAPMODE: 17,
	SETPOLYFILLMODE: 19,
	SETBKMODE: 18,
	SETTEXTALIGN: 22,
	SETTEXTCOLOR: 24,
	MOVETOEX: 27,
	SCALEVIEWPORTEXTEX: 31,
	SCALEWINDOWEXTEX: 32,
	SAVEDC: 33,
	RESTOREDC: 34,
	SETWORLDTRANSFORM: 35,
	MODIFYWORLDTRANSFORM: 36,
	SELECTOBJECT: 37,
	CREATEPEN: 38,
	CREATEBRUSHINDIRECT: 39,
	DELETEOBJECT: 40,
	ELLIPSE: 42,
	RECTANGLE: 43,
	LINETO: 54,
	BEGINPATH: 59,
	ENDPATH: 60,
	CLOSEFIGURE: 61,
	SELECTCLIPPATH: 67,
	EXTCREATEFONTINDIRECTW: 82,
	EXTTEXTOUTW: 84,
	POLYBEZIER16: 85,
	POLYGON16: 86,
	POLYLINE16: 87,
	POLYBEZIERTO16: 88,
	POLYLINETO16: 89,
	POLYPOLYLINE16: 90,
	POLYPOLYGON16: 91,
	CREATEMONOBRUSH: 93,
	CREATEDIBPATTERNBRUSHPT: 94,
	EXTCREATEPEN: 95,
	BITBLT: 76,
	STRETCHDIBITS: 81
}, A = {
	WHITE_BRUSH: 2147483648,
	LTGRAY_BRUSH: 2147483649,
	GRAY_BRUSH: 2147483650,
	DKGRAY_BRUSH: 2147483651,
	BLACK_BRUSH: 2147483652,
	NULL_BRUSH: 2147483653,
	WHITE_PEN: 2147483654,
	BLACK_PEN: 2147483655,
	NULL_PEN: 2147483656,
	DC_BRUSH: 2147483666,
	DC_PEN: 2147483662
}, j = {
	TEXT: 1,
	LOMETRIC: 2,
	HIMETRIC: 3,
	LOENGLISH: 4,
	HIENGLISH: 5,
	TWIPS: 6,
	ISOTROPIC: 7,
	ANISOTROPIC: 8
}, et = () => ({
	m11: 1,
	m12: 0,
	m21: 0,
	m22: 1,
	dx: 0,
	dy: 0
});
function tt(e, t) {
	return {
		m11: e.m11 * t.m11 + e.m21 * t.m12,
		m12: e.m12 * t.m11 + e.m22 * t.m12,
		m21: e.m11 * t.m21 + e.m21 * t.m22,
		m22: e.m12 * t.m21 + e.m22 * t.m22,
		dx: e.m11 * t.dx + e.m21 * t.dy + e.dx,
		dy: e.m12 * t.dx + e.m22 * t.dy + e.dy
	};
}
var nt = class {
	p;
	constructor(e, t, n) {
		this.dv = e, this.end = n, this.p = t;
	}
	get pos() {
		return this.p;
	}
	set pos(e) {
		this.p = e;
	}
	get remaining() {
		return this.end - this.p;
	}
	i16() {
		let e = this.dv.getInt16(this.p, !0);
		return this.p += 2, e;
	}
	i32() {
		let e = this.dv.getInt32(this.p, !0);
		return this.p += 4, e;
	}
	u32() {
		let e = this.dv.getUint32(this.p, !0);
		return this.p += 4, e;
	}
	f32() {
		let e = this.dv.getFloat32(this.p, !0);
		return this.p += 4, e;
	}
	xform() {
		return {
			m11: this.f32(),
			m12: this.f32(),
			m21: this.f32(),
			m22: this.f32(),
			dx: this.f32(),
			dy: this.f32()
		};
	}
	skip(e) {
		this.p += e;
	}
};
function rt(e, t, n) {
	return e.wt.m11 * t + e.wt.m21 * n + e.wt.dx;
}
function it(e, t, n) {
	return e.wt.m12 * t + e.wt.m22 * n + e.wt.dy;
}
function at(e) {
	return e.winExtX === 0 ? 1 : e.vpExtX / e.winExtX;
}
function ot(e) {
	return e.winExtY === 0 ? 1 : e.vpExtY / e.winExtY;
}
function st(e) {
	return Math.min(Math.abs(at(e)), Math.abs(ot(e)));
}
function ct(e) {
	return e.mapMode === j.ISOTROPIC ? at(e) < 0 ? -st(e) : st(e) : at(e);
}
function lt(e) {
	return e.mapMode === j.ISOTROPIC ? ot(e) < 0 ? -st(e) : st(e) : ot(e);
}
function ut(e, t) {
	return (t - e.winOrgX) * ct(e) + e.vpOrgX;
}
function dt(e, t) {
	return (t - e.winOrgY) * lt(e) + e.vpOrgY;
}
function M(e, t, n) {
	let r = ut(e, rt(e, t, n)), i = dt(e, it(e, t, n));
	return [(r - e.left) * e.W / e.boundsW, (i - e.top) * e.H / e.boundsH];
}
function ft(e) {
	return (Math.hypot(e.wt.m11, e.wt.m12) + Math.hypot(e.wt.m21, e.wt.m22)) / 2;
}
function pt(e) {
	return (Math.abs(ct(e)) + Math.abs(lt(e))) / 2;
}
function mt(e) {
	return (e.W / e.boundsW + e.H / e.boundsH) / 2;
}
function ht(e) {
	return Math.hypot(e.wt.m21, e.wt.m22);
}
function gt(e) {
	return e.H / e.boundsH;
}
function N(e, t) {
	let n = t * ft(e) * pt(e) * mt(e);
	return Math.max(.75, n);
}
function _t(e, t) {
	if (e.mapMode = t, t === j.TEXT) {
		e.winOrgX = 0, e.winOrgY = 0, e.vpOrgX = 0, e.vpOrgY = 0, e.winExtX = 1, e.winExtY = 1, e.vpExtX = 1, e.vpExtY = 1;
		return;
	}
	if (t === j.ANISOTROPIC || t === j.ISOTROPIC || e.devPxPerMmX <= 0 || e.devPxPerMmY <= 0) return;
	let n = 25.4, r = t === j.LOMETRIC ? .1 : t === j.HIMETRIC ? .01 : t === j.LOENGLISH ? .01 * n : t === j.HIENGLISH ? .001 * n : t === j.TWIPS ? n / 1440 : 0;
	r <= 0 || (e.winOrgX = 0, e.winOrgY = 0, e.vpOrgX = 0, e.vpOrgY = 0, e.winExtX = 1, e.winExtY = 1, e.vpExtX = r * e.devPxPerMmX, e.vpExtY = -(r * e.devPxPerMmY));
}
var vt = {
	[A.WHITE_BRUSH]: {
		kind: "brush",
		fill: "#ffffff"
	},
	[A.LTGRAY_BRUSH]: {
		kind: "brush",
		fill: "#c0c0c0"
	},
	[A.GRAY_BRUSH]: {
		kind: "brush",
		fill: "#808080"
	},
	[A.DKGRAY_BRUSH]: {
		kind: "brush",
		fill: "#404040"
	},
	[A.BLACK_BRUSH]: {
		kind: "brush",
		fill: "#000000"
	},
	[A.NULL_BRUSH]: {
		kind: "brush",
		fill: null
	}
}, yt = {
	[A.WHITE_PEN]: {
		kind: "pen",
		stroke: "#ffffff",
		width: 1
	},
	[A.BLACK_PEN]: {
		kind: "pen",
		stroke: "#000000",
		width: 1
	},
	[A.NULL_PEN]: {
		kind: "pen",
		stroke: null,
		width: 1
	},
	[A.DC_PEN]: {
		kind: "pen",
		stroke: "#000000",
		width: 1
	}
};
function bt(e, t) {
	let n = vt[t];
	if (n) {
		e.curBrush = n;
		return;
	}
	let r = yt[t];
	if (r) {
		e.curPen = r;
		return;
	}
	t === A.DC_BRUSH && (e.curBrush = e.curBrush ?? {
		kind: "brush",
		fill: "#000000"
	});
}
function xt(e) {
	let t = 0, n = 0, r = 0, i = 0;
	for (let a = 0; a < e.data.length; a += 4) e.data[a + 3] !== 0 && (t += e.data[a], n += e.data[a + 1], r += e.data[a + 2], i++);
	if (i === 0) return "#808080";
	let a = (e) => Math.round(e / i).toString(16).padStart(2, "0");
	return `#${a(t)}${a(n)}${a(r)}`;
}
var P = (e) => [e.i16(), e.i16()], F = (e) => [e.i32(), e.i32()];
function St(e, t, n) {
	t.skip(16);
	let r = t.u32();
	if (r < 2 || r > 1048576 || !e.curPen || e.curPen.stroke == null) return;
	let { ctx: i } = e;
	i.beginPath();
	let a = 0, o = 0;
	for (let s = 0; s < r && !(t.remaining < 4); s++) {
		let [r, c] = n(t), [l, u] = M(e, r, c);
		s === 0 ? i.moveTo(l, u) : i.lineTo(l, u), a = r, o = c;
	}
	i.strokeStyle = e.curPen.stroke, i.lineWidth = N(e, e.curPen.width), i.stroke(), e.drew = !0, e.curX = a, e.curY = o;
}
function Ct(e, t, n) {
	t.skip(16);
	let r = t.u32();
	if (r < 1 || r > 1048576) return;
	let { ctx: i } = e, a = e.curPen != null && e.curPen.stroke != null;
	if (a) {
		i.beginPath();
		let [t, n] = M(e, e.curX, e.curY);
		i.moveTo(t, n);
	}
	for (let o = 0; o < r && !(t.remaining < 4); o++) {
		let [r, o] = n(t);
		if (a) {
			let [t, n] = M(e, r, o);
			i.lineTo(t, n);
		}
		e.curX = r, e.curY = o;
	}
	a && e.curPen && (i.strokeStyle = e.curPen.stroke, i.lineWidth = N(e, e.curPen.width), i.stroke(), e.drew = !0);
}
function wt(e, t, n) {
	t.skip(16);
	let r = t.u32();
	if (r < 2 || r > 1048576) return;
	let { ctx: i } = e;
	e.inPath || i.beginPath();
	let a = !1;
	for (let o = 0; o < r && !(t.remaining < 4); o++) {
		let [r, o] = n(t), [s, c] = M(e, r, o);
		a ? i.lineTo(s, c) : (i.moveTo(s, c), a = !0);
	}
	a && (i.closePath(), !e.inPath && (e.curBrush && e.curBrush.fill != null && (i.fillStyle = e.curBrush.fill, i.fill(e.fillRule), e.drew = !0), e.curPen && e.curPen.stroke != null && (i.strokeStyle = e.curPen.stroke, i.lineWidth = N(e, e.curPen.width), i.stroke(), e.drew = !0)));
}
function Tt(e, t, n, r) {
	t.skip(16);
	let i = t.u32();
	if (i < 1 || i > 1048576) return;
	let a = [];
	for (let e = 0; e < i && !(t.remaining < 4); e++) a.push(n(t));
	if (a.length < (r ? 3 : 4)) {
		a.length && (e.curX = a[a.length - 1][0], e.curY = a[a.length - 1][1]);
		return;
	}
	let o = e.curPen != null && e.curPen.stroke != null, { ctx: s } = e;
	if (o) {
		s.beginPath();
		let t = r ? M(e, e.curX, e.curY) : M(e, a[0][0], a[0][1]);
		s.moveTo(t[0], t[1]);
	}
	let c = +!r;
	for (; c + 2 < a.length + +!!r; c += 3) {
		let t = a[c], n = a[c + 1], r = a[c + 2];
		if (!t || !n || !r) break;
		if (o) {
			let i = M(e, t[0], t[1]), a = M(e, n[0], n[1]), o = M(e, r[0], r[1]);
			s.bezierCurveTo(i[0], i[1], a[0], a[1], o[0], o[1]);
		}
		e.curX = r[0], e.curY = r[1];
	}
	o && e.curPen && (s.strokeStyle = e.curPen.stroke, s.lineWidth = N(e, e.curPen.width), s.stroke(), e.drew = !0);
}
function Et(e, t, n, r) {
	t.skip(16);
	let i = t.u32(), a = t.u32();
	if (i <= 0 || i > 65536 || a <= 0 || a > 2097152) return;
	let o = [];
	for (let e = 0; e < i; e++) {
		if (t.remaining < 4) return;
		o.push(t.u32());
	}
	let { ctx: s } = e;
	e.inPath || s.beginPath();
	let c = !1;
	for (let i of o) {
		if (i < 2) {
			for (let e = 0; e < i && t.remaining >= 4; e++) n(t);
			continue;
		}
		for (let r = 0; r < i && !(t.remaining < 4); r++) {
			let [i, a] = n(t), [o, c] = M(e, i, a);
			r === 0 ? s.moveTo(o, c) : s.lineTo(o, c);
		}
		r && s.closePath(), c = !0;
	}
	!c || e.inPath || (r && e.curBrush && e.curBrush.fill != null && (s.fillStyle = e.curBrush.fill, s.fill(e.fillRule), e.drew = !0), e.curPen && e.curPen.stroke != null && (s.strokeStyle = e.curPen.stroke, s.lineWidth = N(e, e.curPen.width), s.stroke(), e.drew = !0));
}
function Dt(e, t, n, r, i) {
	let { ctx: a } = e, o = M(e, t, n), s = M(e, r, n), c = M(e, r, i), l = M(e, t, i);
	e.inPath || a.beginPath(), a.moveTo(o[0], o[1]), a.lineTo(s[0], s[1]), a.lineTo(c[0], c[1]), a.lineTo(l[0], l[1]), a.closePath(), !e.inPath && (e.curBrush && e.curBrush.fill != null && (a.fillStyle = e.curBrush.fill, a.fill(e.fillRule), e.drew = !0), e.curPen && e.curPen.stroke != null && (a.strokeStyle = e.curPen.stroke, a.lineWidth = N(e, e.curPen.width), a.stroke(), e.drew = !0));
}
function Ot(t) {
	let n = t.u32(), r = t.u32(), i = t.i32();
	t.i32();
	let a = t.u32();
	return [n, {
		kind: "pen",
		stroke: (r & 255) == 5 ? null : e(a),
		width: Math.abs(i)
	}];
}
function kt(t) {
	let n = t.u32();
	t.skip(16);
	let r = t.u32(), i = t.u32();
	t.u32();
	let a = t.u32();
	return [n, {
		kind: "pen",
		stroke: (r & 255) == 5 ? null : e(a),
		width: Math.abs(i)
	}];
}
function At(t) {
	let n = t.u32(), r = t.u32(), i = t.u32();
	return t.u32(), [n, {
		kind: "brush",
		fill: r === 1 ? null : e(i)
	}];
}
function jt(e, t, n) {
	let r = e.u32();
	e.u32();
	let i = e.u32(), o = e.u32(), s = e.u32(), c = e.u32(), l = "#808080";
	try {
		let e = a(t, n + i, o, n + s, c);
		e && (l = xt(e));
	} catch {}
	return [r, {
		kind: "brush",
		fill: l
	}];
}
function Mt(e, t, n) {
	let r = e.u32(), i = n + 12, a = t.getInt32(i, !0), o = t.getInt32(i + 8, !0), s = t.getInt32(i + 16, !0), c = t.getUint8(i + 20), l = "";
	for (let e = 0; e < 32; e++) {
		let n = i + 28 + e * 2;
		if (n + 2 > t.byteLength) break;
		let r = t.getUint16(n, !0);
		if (r === 0) break;
		l += String.fromCharCode(r);
	}
	return [r, {
		kind: "font",
		height: Math.abs(a),
		weight: s,
		italic: c !== 0,
		face: l,
		escapement: o
	}];
}
function Nt(e, t, n, r) {
	t.skip(16), t.u32(), t.f32(), t.f32();
	let i = t.i32(), a = t.i32(), o = t.u32(), s = t.u32();
	if (t.u32(), o <= 0 || o > 65536) return;
	let c = "";
	for (let e = 0; e < o; e++) {
		let t = r + s + e * 2;
		if (t + 2 > n.byteLength) break;
		c += String.fromCharCode(n.getUint16(t, !0));
	}
	if (c.length === 0) return;
	let l = e.curFont, u = Math.abs(l?.height ?? 0) * ht(e) * Math.abs(lt(e)) * gt(e);
	if (!Number.isFinite(u) || u < 1) return;
	let { ctx: d } = e, [f, p] = M(e, i, a);
	d.fillStyle = e.textColor;
	let m = l && l.weight >= 700 ? "bold " : "";
	d.font = `${l?.italic ? "italic " : ""}${m}${u}px ${l?.face || "sans-serif"}`;
	let h = e.textAlign & 6;
	d.textAlign = h === 2 ? "right" : h === 6 ? "center" : "left", d.textBaseline = (e.textAlign & 24) == 24 ? "alphabetic" : "top";
	let g = l?.escapement ?? 0;
	try {
		if (g !== 0) {
			d.save();
			try {
				d.translate(f, p), d.rotate(-g / 10 * (Math.PI / 180)), d.fillText(c, 0, 0);
			} finally {
				d.restore();
			}
		} else d.fillText(c, f, p);
		e.drew = !0;
	} catch {}
}
function Pt(e, t, n, r, i, s, c, l, u, d, f) {
	if (i === 0 || c === 0) return;
	let p = a(t, n + r, i, n + s, c);
	if (!p) return;
	let [m, h] = M(e, l, u), [g, _] = M(e, d, f);
	o(e.ctx, p, m, h, g, _) && (e.drew = !0);
}
function Ft(e, t, n, r) {
	t.skip(16);
	let i = t.i32(), a = t.i32(), o = t.i32(), s = t.i32();
	t.u32(), t.i32(), t.i32(), t.skip(24), t.u32(), t.u32(), Pt(e, n, r, t.u32(), t.u32(), t.u32(), t.u32(), i, a, i + o, a + s);
}
function It(e, t, n, r) {
	t.skip(16);
	let i = t.i32(), a = t.i32();
	t.i32(), t.i32(), t.i32(), t.i32();
	let o = t.u32(), s = t.u32(), c = t.u32(), l = t.u32();
	t.u32(), t.u32();
	let u = t.i32(), d = t.i32();
	Pt(e, n, r, o, s, c, l, i, a, i + u, a + d);
}
function Lt(t, n, r, a) {
	if (!i(t) || r <= 0 || a <= 0) return !1;
	let o = new DataView(t.buffer, t.byteOffset, t.byteLength), s = {
		ctx: n,
		W: r,
		H: a,
		left: 0,
		top: 0,
		boundsW: r,
		boundsH: a,
		wt: et(),
		mapMode: j.TEXT,
		winOrgX: 0,
		winOrgY: 0,
		winExtX: 1,
		winExtY: 1,
		vpOrgX: 0,
		vpOrgY: 0,
		vpExtX: 1,
		vpExtY: 1,
		devPxPerMmX: 0,
		devPxPerMmY: 0,
		objects: /* @__PURE__ */ new Map(),
		curPen: null,
		curBrush: null,
		curFont: null,
		textColor: "#000000",
		bkMode: 1,
		textAlign: 0,
		fillRule: "nonzero",
		curX: 0,
		curY: 0,
		stack: [],
		drew: !1,
		inPath: !1
	}, c = 0;
	for (; c + 8 <= t.length;) {
		let r = o.getUint32(c, !0), i = o.getUint32(c + 4, !0);
		if (i < 8 || i & 3) break;
		let a = c + i;
		if (a > t.length || r === k.EOF) break;
		let l = new nt(o, c + 8, a);
		try {
			switch (r) {
				case k.HEADER: {
					let e = o.getInt32(c + 8, !0), t = o.getInt32(c + 12, !0), n = o.getInt32(c + 16, !0), r = o.getInt32(c + 20, !0);
					if (s.left = e, s.top = t, s.boundsW = Math.max(1, n - e), s.boundsH = Math.max(1, r - t), a >= c + 88) {
						let e = o.getInt32(c + 24, !0), t = o.getInt32(c + 28, !0), n = o.getInt32(c + 32, !0), r = o.getInt32(c + 36, !0), i = o.getInt32(c + 72, !0), a = o.getInt32(c + 76, !0), l = o.getInt32(c + 80, !0), u = o.getInt32(c + 84, !0), d = n - e, f = r - t;
						if (d > 0 && f > 0 && i > 0 && a > 0 && l > 0 && u > 0) {
							let n = i / (l * 100), r = a / (u * 100);
							s.left = e * n, s.top = t * r, s.boundsW = Math.max(1, d * n), s.boundsH = Math.max(1, f * r), s.devPxPerMmX = i / l, s.devPxPerMmY = a / u;
						}
					}
					break;
				}
				case k.SETWORLDTRANSFORM:
					s.wt = l.xform();
					break;
				case k.MODIFYWORLDTRANSFORM: {
					let e = l.xform(), t = l.u32();
					t === 1 ? s.wt = et() : t === 2 ? s.wt = tt(e, s.wt) : t === 3 ? s.wt = tt(s.wt, e) : t === 4 && (s.wt = e);
					break;
				}
				case k.SETMAPMODE:
					_t(s, l.u32());
					break;
				case k.SETWINDOWORGEX:
					s.winOrgX = l.i32(), s.winOrgY = l.i32();
					break;
				case k.SETWINDOWEXTEX: {
					let e = l.i32(), t = l.i32();
					e !== 0 && (s.winExtX = e), t !== 0 && (s.winExtY = t);
					break;
				}
				case k.SETVIEWPORTORGEX:
					s.vpOrgX = l.i32(), s.vpOrgY = l.i32();
					break;
				case k.SETVIEWPORTEXTEX: {
					let e = l.i32(), t = l.i32();
					e !== 0 && (s.vpExtX = e), t !== 0 && (s.vpExtY = t);
					break;
				}
				case k.SCALEWINDOWEXTEX: {
					let e = l.i32(), t = l.i32(), n = l.i32(), r = l.i32();
					t !== 0 && (s.winExtX = s.winExtX * e / t), r !== 0 && (s.winExtY = s.winExtY * n / r);
					break;
				}
				case k.SCALEVIEWPORTEXTEX: {
					let e = l.i32(), t = l.i32(), n = l.i32(), r = l.i32();
					t !== 0 && (s.vpExtX = s.vpExtX * e / t), r !== 0 && (s.vpExtY = s.vpExtY * n / r);
					break;
				}
				case k.SAVEDC:
					s.ctx.save(), s.stack.push({
						wt: { ...s.wt },
						mapMode: s.mapMode,
						winOrgX: s.winOrgX,
						winOrgY: s.winOrgY,
						winExtX: s.winExtX,
						winExtY: s.winExtY,
						vpOrgX: s.vpOrgX,
						vpOrgY: s.vpOrgY,
						vpExtX: s.vpExtX,
						vpExtY: s.vpExtY,
						curPen: s.curPen,
						curBrush: s.curBrush,
						curFont: s.curFont,
						textColor: s.textColor,
						bkMode: s.bkMode,
						textAlign: s.textAlign,
						fillRule: s.fillRule,
						curX: s.curX,
						curY: s.curY
					});
					break;
				case k.RESTOREDC: {
					let e = l.i32(), t = Math.min(Math.abs(e) || 1, s.stack.length), n;
					for (let e = 0; e < t; e++) n = s.stack.pop(), s.ctx.restore();
					n && (s.wt = n.wt, s.mapMode = n.mapMode, s.winOrgX = n.winOrgX, s.winOrgY = n.winOrgY, s.winExtX = n.winExtX, s.winExtY = n.winExtY, s.vpOrgX = n.vpOrgX, s.vpOrgY = n.vpOrgY, s.vpExtX = n.vpExtX, s.vpExtY = n.vpExtY, s.curPen = n.curPen, s.curBrush = n.curBrush, s.curFont = n.curFont, s.textColor = n.textColor, s.bkMode = n.bkMode, s.textAlign = n.textAlign, s.fillRule = n.fillRule, s.curX = n.curX, s.curY = n.curY);
					break;
				}
				case k.BEGINPATH:
					s.ctx.beginPath(), s.inPath = !0;
					break;
				case k.CLOSEFIGURE:
					s.inPath && s.ctx.closePath();
					break;
				case k.ENDPATH:
					s.inPath = !1;
					break;
				case k.SELECTCLIPPATH:
					try {
						s.ctx.clip(s.fillRule);
					} catch {}
					break;
				case k.SELECTOBJECT: {
					let e = l.u32();
					if (e & 2147483648) bt(s, e >>> 0);
					else {
						let t = s.objects.get(e);
						t?.kind === "pen" ? s.curPen = t : t?.kind === "brush" ? s.curBrush = t : t?.kind === "font" && (s.curFont = t);
					}
					break;
				}
				case k.DELETEOBJECT: {
					let e = l.u32(), t = s.objects.get(e);
					t && (t === s.curPen && (s.curPen = null), t === s.curBrush && (s.curBrush = null), t === s.curFont && (s.curFont = null), s.objects.delete(e));
					break;
				}
				case k.CREATEPEN: {
					let [e, t] = Ot(l);
					s.objects.set(e, t);
					break;
				}
				case k.EXTCREATEPEN: {
					let [e, t] = kt(l);
					s.objects.set(e, t);
					break;
				}
				case k.CREATEBRUSHINDIRECT: {
					let [e, t] = At(l);
					s.objects.set(e, t);
					break;
				}
				case k.CREATEMONOBRUSH:
				case k.CREATEDIBPATTERNBRUSHPT: {
					let [e, t] = jt(l, o, c);
					s.objects.set(e, t);
					break;
				}
				case k.EXTCREATEFONTINDIRECTW: {
					let [e, t] = Mt(l, o, c);
					s.objects.set(e, t);
					break;
				}
				case k.POLYLINE16:
					St(s, l, P);
					break;
				case k.POLYLINE:
					St(s, l, F);
					break;
				case k.POLYLINETO16:
					Ct(s, l, P);
					break;
				case k.POLYLINETO:
					Ct(s, l, F);
					break;
				case k.POLYGON16:
					wt(s, l, P);
					break;
				case k.POLYGON:
					wt(s, l, F);
					break;
				case k.POLYBEZIER16:
					Tt(s, l, P, !1);
					break;
				case k.POLYBEZIER:
					Tt(s, l, F, !1);
					break;
				case k.POLYBEZIERTO16:
					Tt(s, l, P, !0);
					break;
				case k.POLYBEZIERTO:
					Tt(s, l, F, !0);
					break;
				case k.POLYPOLYGON16:
					Et(s, l, P, !0);
					break;
				case k.POLYPOLYGON:
					Et(s, l, F, !0);
					break;
				case k.POLYPOLYLINE16:
					Et(s, l, P, !1);
					break;
				case k.POLYPOLYLINE:
					Et(s, l, F, !1);
					break;
				case k.MOVETOEX:
					s.curX = l.i32(), s.curY = l.i32();
					break;
				case k.LINETO: {
					let e = l.i32(), t = l.i32();
					if (s.curPen && s.curPen.stroke != null) {
						let [r, i] = M(s, s.curX, s.curY), [a, o] = M(s, e, t);
						n.beginPath(), n.moveTo(r, i), n.lineTo(a, o), n.strokeStyle = s.curPen.stroke, n.lineWidth = N(s, s.curPen.width), n.stroke(), s.drew = !0;
					}
					s.curX = e, s.curY = t;
					break;
				}
				case k.RECTANGLE:
					Dt(s, l.i32(), l.i32(), l.i32(), l.i32());
					break;
				case k.ELLIPSE: {
					let e = l.i32(), t = l.i32(), r = l.i32(), i = l.i32(), [a, o] = [(e + r) / 2, (t + i) / 2], [c, u] = M(s, a, o), [d] = M(s, r, o), [, f] = M(s, a, i), p = Math.abs(d - c), m = Math.abs(f - u);
					n.beginPath(), n.ellipse(c, u, p, m, 0, 0, Math.PI * 2), s.curBrush && s.curBrush.fill != null && (n.fillStyle = s.curBrush.fill, n.fill(s.fillRule), s.drew = !0), s.curPen && s.curPen.stroke != null && (n.strokeStyle = s.curPen.stroke, n.lineWidth = N(s, s.curPen.width), n.stroke(), s.drew = !0);
					break;
				}
				case k.SETPOLYFILLMODE:
					s.fillRule = l.u32() === 1 ? "evenodd" : "nonzero";
					break;
				case k.SETTEXTCOLOR:
					s.textColor = e(l.u32());
					break;
				case k.SETTEXTALIGN:
					s.textAlign = l.u32();
					break;
				case k.SETBKMODE:
					s.bkMode = l.u32();
					break;
				case k.EXTTEXTOUTW:
					Nt(s, l, o, c);
					break;
				case k.BITBLT:
					Ft(s, l, o, c);
					break;
				case k.STRETCHDIBITS:
					It(s, l, o, c);
					break;
				default: break;
			}
		} catch {}
		c = a;
	}
	return s.drew;
}
async function Rt(e, t, n) {
	if (!i(e) || t <= 0 || n <= 0) return null;
	let a = r(t, n);
	if (!a) return null;
	let o = a.getContext("2d");
	return !o || (o.lineJoin = "round", o.lineCap = "round", !Lt(e, o, t, n)) ? null : createImageBitmap(a);
}
//#endregion
//#region packages/core/src/image/image-bitmap-lifecycle.ts
function zt(e) {
	let t = e.close;
	typeof t == "function" && t.call(e);
}
//#endregion
//#region packages/core/src/image/raster-dimensions.ts
function Bt(e, t) {
	return e[t] << 8 | e[t + 1];
}
function Vt(e, t) {
	return (e[t] << 24 | e[t + 1] << 16 | e[t + 2] << 8 | e[t + 3]) >>> 0;
}
function I(e, t) {
	return e[t] | e[t + 1] << 8;
}
function Ht(e, t) {
	return e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24 | 0;
}
function Ut(e) {
	let t = e.length;
	return t >= 24 && e[0] === 137 && e[1] === 80 && e[2] === 78 && e[3] === 71 && e[4] === 13 && e[5] === 10 && e[6] === 26 && e[7] === 10 ? e[12] === 73 && e[13] === 72 && e[14] === 68 && e[15] === 82 ? {
		width: Vt(e, 16),
		height: Vt(e, 20)
	} : null : t >= 10 && e[0] === 71 && e[1] === 73 && e[2] === 70 && e[3] === 56 && (e[4] === 55 || e[4] === 57) && e[5] === 97 ? {
		width: I(e, 6),
		height: I(e, 8)
	} : t >= 26 && e[0] === 66 && e[1] === 77 ? Wt(e, 14) === 12 ? {
		width: I(e, 18),
		height: I(e, 20)
	} : {
		width: Math.abs(Ht(e, 18)),
		height: Math.abs(Ht(e, 22))
	} : t >= 16 && e[0] === 82 && e[1] === 73 && e[2] === 70 && e[3] === 70 && e[8] === 87 && e[9] === 69 && e[10] === 66 && e[11] === 80 ? Gt(e) : t >= 4 && e[0] === 255 && e[1] === 216 ? Jt(e) : t >= 4 && (e[0] === 73 && e[1] === 73 || e[0] === 77 && e[1] === 77) ? y(e) : null;
}
function Wt(e, t) {
	return (e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24) >>> 0;
}
function Gt(e) {
	let t = e.length, n = e[12], r = e[13], i = e[14], a = e[15];
	if (n === 86 && r === 80 && i === 56 && a === 32) return t < 30 ? null : {
		width: I(e, 26) & 16383,
		height: I(e, 28) & 16383
	};
	if (n === 86 && r === 80 && i === 56 && a === 76) {
		if (t < 25 || e[20] !== 47) return null;
		let n = Wt(e, 21);
		return {
			width: (n & 16383) + 1,
			height: (n >>> 14 & 16383) + 1
		};
	}
	return n === 86 && r === 80 && i === 56 && a === 88 ? t < 30 ? null : {
		width: (e[24] | e[25] << 8 | e[26] << 16) + 1,
		height: (e[27] | e[28] << 8 | e[29] << 16) + 1
	} : null;
}
function Kt(e) {
	return e.length >= 6 && e[0] === 69 && e[1] === 120 && e[2] === 105 && e[3] === 102 && e[4] === 0 && e[5] === 0;
}
function qt(e) {
	if (e.length < 14 || !Kt(e)) return null;
	let t = e[6] === 73 && e[7] === 73, n = e[6] === 77 && e[7] === 77;
	if (!t && !n) return null;
	let r = new DataView(e.buffer, e.byteOffset, e.byteLength);
	if (r.getUint16(8, t) !== 42) return null;
	let i = r.getUint32(10, t), a = 6 + i;
	if (i < 8 || a + 2 > e.length) return null;
	let o = r.getUint16(a, t), s = a + 2, c = Math.min(o, Math.floor((e.length - s) / 12));
	for (let e = 0; e < c; e++) {
		let n = s + e * 12;
		if (r.getUint16(n, t) !== 274 || r.getUint16(n + 2, t) !== 3 || r.getUint32(n + 4, t) !== 1) continue;
		let i = r.getUint16(n + 8, t);
		if (i >= 1 && i <= 8) return i;
	}
	return null;
}
function L(e, t) {
	return t !== null && t >= 5 && t <= 8 ? {
		width: e.height,
		height: e.width
	} : e;
}
function Jt(e) {
	let t = e.length, n = 2, r = null, i = !1, a = null;
	for (; n + 1 < t;) {
		if (e[n] !== 255) {
			n += 1;
			continue;
		}
		let o = e[n + 1];
		if (o === 255) {
			n += 1;
			continue;
		}
		if (o === 216 || o === 1 || o >= 208 && o <= 215) {
			n += 2;
			continue;
		}
		if (o === 217 || o === 218) return a ? L(a, r) : null;
		if (n + 3 >= t) return null;
		let s = Bt(e, n + 2);
		if (o >= 192 && o <= 207 && o !== 196 && o !== 200 && o !== 204) {
			if (s < 7 || n + 8 >= t) return null;
			let r = Bt(e, n + 5), i = Bt(e, n + 7);
			a ??= {
				width: i,
				height: r
			};
		}
		if (s < 2) return null;
		let c = n + 2 + s;
		if (c > t) return a ? L(a, r) : null;
		if (o === 225 && !i) {
			let t = e.subarray(n + 4, c);
			Kt(t) && (i = !0, r = qt(t));
		}
		n = c;
	}
	return a ? L(a, r) : null;
}
function Yt(e) {
	let { width: t, height: n } = e;
	return !Number.isFinite(t) || !Number.isFinite(n) || t <= 0 || n <= 0 || t > 32767 || n > 32767 ? !0 : t * n > u;
}
function Xt(e) {
	let { width: t, height: n } = e;
	return !Number.isFinite(t) || !Number.isFinite(n) || t <= 0 || n <= 0 || t > 134217728 || n > 134217728 ? !0 : t * n > p;
}
//#endregion
//#region packages/core/src/image/raster-blob-inspection.ts
function Zt(e) {
	switch (e.split(";", 1)[0]?.trim().toLowerCase()) {
		case "image/png":
		case "image/jpeg":
		case "image/jpg":
		case "image/gif":
		case "image/bmp":
		case "image/x-ms-bmp":
		case "image/webp": return !0;
		default: return !1;
	}
}
function Qt(e, t = !1) {
	return e !== null && e !== "wmf" && e !== "emf" && (e !== "tiff" || t);
}
var $t = 64 * 1024;
function en(e) {
	return s(e) ? "wmf" : i(e) ? "emf" : e.length >= 8 && e[0] === 137 && e[1] === 80 && e[2] === 78 && e[3] === 71 && e[4] === 13 && e[5] === 10 && e[6] === 26 && e[7] === 10 ? "png" : e.length >= 2 && e[0] === 255 && e[1] === 216 ? "jpeg" : e.length >= 6 && e[0] === 71 && e[1] === 73 && e[2] === 70 && e[3] === 56 && (e[4] === 55 || e[4] === 57) && e[5] === 97 ? "gif" : e.length >= 2 && e[0] === 66 && e[1] === 77 ? "bmp" : e.length >= 12 && e[0] === 82 && e[1] === 73 && e[2] === 70 && e[3] === 70 && e[8] === 87 && e[9] === 69 && e[10] === 66 && e[11] === 80 ? "webp" : S(e) ? "tiff" : null;
}
function tn(e) {
	return e >= 192 && e <= 207 && e !== 196 && e !== 200 && e !== 204;
}
async function nn(e) {
	let t = e.slice(2).stream().getReader(), n = !1, r = -1, i = -1, a = 0, o = null, s = 0, c = 0, l = null, u = null, d = 0, f = null, p = !1;
	try {
		for (;;) {
			let { value: e, done: m } = await t.read();
			if (m) return l ? L(l, f) : null;
			for (let m of e) {
				if (o) {
					if (o[s++] = m, s === o.length) {
						let e = o[1] << 8 | o[2], n = o[3] << 8 | o[4];
						if (l ??= {
							width: n,
							height: e
						}, o = null, s = 0, p) return await t.cancel(), L(l, f);
						a = c, c = 0;
					}
					continue;
				}
				if (u) {
					if (u[d++] = m, d === u.length && (Kt(u) && (p = !0, f = qt(u)), u = null, d = 0, p && l)) return await t.cancel(), L(l, f);
					continue;
				}
				if (a > 0) {
					a--;
					continue;
				}
				if (r >= 0) {
					if (i < 0) {
						i = m;
						continue;
					}
					let e = i << 8 | m;
					if (e < 2) return null;
					if (tn(r)) {
						if (e < 7) return null;
						l ? a = e - 2 : (o = new Uint8Array(5), s = 0, c = e - 7);
					} else r === 225 && !p && e > 2 ? (u = new Uint8Array(e - 2), d = 0) : a = e - 2;
					r = -1, i = -1;
					continue;
				}
				if (!n) {
					m === 255 && (n = !0);
					continue;
				}
				if (m !== 255 && (n = !1, m !== 0)) {
					if (m === 217 || m === 218) return await t.cancel(), l ? L(l, f) : null;
					m === 216 || m === 1 || m >= 208 && m <= 215 || (r = m);
				}
			}
		}
	} finally {
		t.releaseLock();
	}
}
async function rn(e, t) {
	if (t.length < 8 || !S(t)) return null;
	let n = t[0] === 73, r = new DataView(t.buffer, t.byteOffset, t.byteLength).getUint32(4, n);
	if (!Number.isSafeInteger(r) || r < 8 || r > e.size - 2) return null;
	let i = new Uint8Array(await e.slice(r, r + 2).arrayBuffer());
	if (i.length !== 2) return null;
	let a = new DataView(i.buffer, i.byteOffset, 2).getUint16(0, n), o = a * 12;
	if (r + 2 + o > e.size) return null;
	let s = new Uint8Array(await e.slice(r + 2, r + 2 + o).arrayBuffer()), c = new DataView(s.buffer, s.byteOffset, s.byteLength), l, u;
	for (let e = 0; e < a; e++) {
		let t = e * 12, r = c.getUint16(t, n);
		if (r !== 256 && r !== 257) continue;
		let i = c.getUint16(t + 2, n);
		if (c.getUint32(t + 4, n) !== 1 || i !== 1 && i !== 3 && i !== 4) return null;
		let a = i === 1 ? c.getUint8(t + 8) : i === 3 ? c.getUint16(t + 8, n) : c.getUint32(t + 8, n);
		r === 256 ? l = a : u = a;
	}
	return l === void 0 || u === void 0 ? null : {
		width: l,
		height: u
	};
}
async function an(e, t) {
	let n = t ?? new Uint8Array(await e.slice(0, $t).arrayBuffer()), r = en(n);
	if (!r) return {
		format: null,
		dimensions: null
	};
	let i = Ut(n);
	return r === "jpeg" ? {
		format: r,
		dimensions: await nn(e) ?? i
	} : i ? {
		format: r,
		dimensions: i
	} : r === "tiff" ? {
		format: r,
		dimensions: await rn(e, n)
	} : {
		format: r,
		dimensions: null
	};
}
//#endregion
//#region packages/core/src/image/optional-image-fallback.ts
var on = class e extends Error {
	code = "ooxml-optional-image-codec-unavailable";
	constructor(t) {
		super(`${t.toUpperCase()} image requires an optional codec`), this.codec = t, this.name = "OptionalImageCodecUnavailableError", Object.setPrototypeOf(this, e.prototype);
	}
};
function sn(e, t) {
	if (typeof e != "object" || !e) return !1;
	try {
		let n = e;
		return n.code === "ooxml-optional-image-codec-unavailable" && n.codec === "tiff" && (t === void 0 || n.codec === t);
	} catch {
		return !1;
	}
}
var cn = { tiff: "TIFF image unavailable" };
function ln(e, t, n) {
	if (!(![
		n.x,
		n.y,
		n.width,
		n.height
	].every(Number.isFinite) || n.width <= 0 || n.height <= 0)) {
		e.save();
		try {
			e.fillStyle = "#888", e.font = "11px sans-serif", e.textAlign = "center", e.textBaseline = "middle";
			let r = cn[t];
			e.fillText(r, n.x + n.width / 2, n.y + n.height / 2, n.width);
		} finally {
			e.restore();
		}
	}
}
//#endregion
//#region packages/core/src/image/raster-or-metafile.ts
function un(e, t) {
	return e.width <= 0 || e.height <= 0 || e.width > 32767 || e.height > 32767 || e.width * e.height > t;
}
function dn(e) {
	let t = e.split(";", 1)[0]?.trim().toLowerCase();
	return t === "image/tiff" || t === "image/x-tiff";
}
function fn(e, t, n, r = !1) {
	let i = {
		retainedDimensions: e,
		resizeOptions: null
	}, a = x(e, typeof t == "number" && Number.isFinite(t) && t > 0 ? t : void 0, typeof n == "number" && Number.isFinite(n) && n > 0 ? n : void 0, r);
	return a ? {
		retainedDimensions: a,
		resizeOptions: {
			resizeWidth: a.width,
			resizeHeight: a.height,
			resizeQuality: "high"
		}
	} : i;
}
function pn(e, t, n) {
	let r = Math.max(e.width, e.height);
	if (!Number.isFinite(r) || r > t) return new h("image-dimension", t, Number.isFinite(r) ? r : 2 ** 53 - 1);
	let i = e.width * e.height;
	return new h("image-pixels", n, Number.isSafeInteger(i) && i >= 0 ? i : 2 ** 53 - 1);
}
async function mn(e, t = {}) {
	return hn(e, t);
}
async function hn(e, r = {}, a) {
	let { widthPt: o = 0, heightPt: l = 0, suppressBoundaryFrame: f = !1, tiff: h, targetWidthPx: g, targetHeightPx: _, maxRetainedPixels: v = u } = r, y = Number.isSafeInteger(v) && v > 0 ? Math.min(v, u) : u, x = new Uint8Array(await e.slice(0, 64 * 1024).arrayBuffer());
	if (s(x)) {
		let { w: r, h: i } = n(o, l);
		return gn(await t(new Uint8Array(await e.arrayBuffer()), r, i, f), y);
	}
	if (i(x)) {
		let { w: t, h: r } = n(o, l);
		return gn(await Rt(new Uint8Array(await e.arrayBuffer()), t, r), y);
	}
	let C = (a ?? await an(e, x)).dimensions;
	if (C && Xt(C)) throw pn(C, c, p);
	let te = S(x) || dn(e.type), w = C ? fn(C, g, _, te) : null;
	if (w && un(w.retainedDimensions, y)) throw pn(w.retainedDimensions, m, y);
	if (te) {
		if (!h) throw new on("tiff");
		let t;
		try {
			t = await h.render(new Uint8Array(await e.arrayBuffer()), {
				targetWidthPx: g,
				targetHeightPx: _,
				maxRetainedPixels: y
			});
		} catch (e) {
			throw d(e) || ee(e) ? e : new b("TIFF codec failed to decode the image", { cause: e });
		}
		if (!t) throw new b("TIFF codec failed to decode the image");
		return gn(t, y);
	}
	return gn(w?.resizeOptions ? await createImageBitmap(e, w.resizeOptions) : await createImageBitmap(e), y);
}
function gn(e, t = u) {
	if (!e) return null;
	let n = {
		width: Number(e.width),
		height: Number(e.height)
	};
	if (!un(n, t)) return e;
	throw zt(e), pn(n, m, t);
}
//#endregion
//#region packages/core/src/image/decode-gate.ts
var _n = /* @__PURE__ */ new WeakMap();
async function vn(e, t) {
	let n = _n.get(e);
	n || (n = {
		active: 0,
		waiters: []
	}, _n.set(e, n)), n.active >= 2 || n.waiters.length > 0 ? await new Promise((e) => n.waiters.push(e)) : n.active++;
	try {
		return await Promise.resolve(), await t();
	} finally {
		let t = n.waiters.shift();
		t ? t() : (n.active--, n.active === 0 && _n.delete(e));
	}
}
//#endregion
//#region packages/core/src/image/adaptive-image-budget.ts
function yn(e = void 0) {
	if (e !== void 0 && (typeof e != "object" || !e || Array.isArray(e))) throw TypeError("imageResources must be an object when provided");
	let t = e?.decodedByteBudget ?? 134217728;
	if (!Number.isSafeInteger(t) || t < 4 || t > 536870912) throw RangeError(`imageResources.decodedByteBudget must be a safe integer from 4 to ${g} bytes`);
	let n = e?.strategy ?? "adaptive";
	if (n !== "adaptive" && n !== "strict") throw TypeError("imageResources.strategy must be 'adaptive' or 'strict'");
	let r = e?.resolution ?? "native-if-fit";
	if (r !== "native-if-fit" && r !== "display") throw TypeError("imageResources.resolution must be 'native-if-fit' or 'display'");
	return Object.freeze({
		decodedByteBudget: t,
		strategy: n,
		resolution: r
	});
}
function bn(e) {
	return Number.isFinite(e) && e > 0 ? Math.max(1, Math.ceil(e)) : 1;
}
function xn(e) {
	return Number.isSafeInteger(e) && (e ?? 0) > 0 ? e : 1;
}
function Sn(e, t) {
	let n = 0;
	for (let r of e.values()) {
		let e = t(r), i = e.width * e.height * r.surfaces * 4;
		n = Math.min(2 ** 53 - 1, n + i);
	}
	return n;
}
function Cn(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = bn(t.targetWidthPx), r = bn(t.targetHeightPx), i = t.sourceWidthPx !== void 0 && t.sourceHeightPx !== void 0, a = i ? bn(t.sourceWidthPx) : void 0, o = i ? bn(t.sourceHeightPx) : void 0, s = xn(t.retainedSurfaceCount), c = n.get(t.key);
		c ? (c.targetWidth = Math.max(c.targetWidth, e), c.targetHeight = Math.max(c.targetHeight, r), a !== void 0 && o !== void 0 && (c.sourceWidth = Math.max(c.sourceWidth ?? 0, a), c.sourceHeight = Math.max(c.sourceHeight ?? 0, o)), c.surfaces = Math.max(c.surfaces, s)) : n.set(t.key, {
			targetWidth: e,
			targetHeight: r,
			sourceWidth: a,
			sourceHeight: o,
			surfaces: s
		});
	}
	let r = (e) => ({
		width: e.sourceWidth ?? e.targetWidth,
		height: e.sourceHeight ?? e.targetHeight
	}), i = (e, t) => ({
		width: Math.max(1, Math.floor(e.targetWidth * t)),
		height: Math.max(1, Math.floor(e.targetHeight * t))
	}), a = (e, t) => {
		let n = i(e, t);
		return e.sourceWidth === void 0 || e.sourceHeight === void 0 ? n : x({
			width: e.sourceWidth,
			height: e.sourceHeight
		}, n.width, n.height) ?? {
			width: e.sourceWidth,
			height: e.sourceHeight
		};
	}, o = (e, t, n) => {
		let r = i(e, t), o = a(e, t), s = o.width * o.height;
		return Object.freeze({
			...r,
			retainedWidth: o.width,
			retainedHeight: o.height,
			retainedPixels: s,
			maxRetainedPixels: n ?? s
		});
	}, s = Sn(n, r), c = [...n.values()].every((e) => {
		let t = r(e);
		return t.width * t.height <= u;
	}), l = [...n.values()].some((e) => e.sourceWidth === void 0 || e.sourceHeight === void 0), d = t.resolution === "native-if-fit" && !l && c && s <= t.decodedByteBudget, f = Sn(n, (e) => a(e, 1));
	if (d) {
		let e = /* @__PURE__ */ new Map();
		for (let [t, i] of n) {
			let n = r(i);
			e.set(t, Object.freeze({
				width: n.width,
				height: n.height,
				retainedWidth: n.width,
				retainedHeight: n.height,
				retainedPixels: n.width * n.height,
				maxRetainedPixels: n.width * n.height
			}));
		}
		return Object.freeze({
			targets: e,
			idealBytes: f,
			plannedBytes: s,
			qualityScale: 1,
			degraded: !1
		});
	}
	if (t.resolution === "native-if-fit" && t.strategy === "adaptive" && l && f <= t.decodedByteBudget) {
		let e = Math.sqrt(t.decodedByteBudget / Math.max(1, f));
		for (let t of n.values()) {
			let n = a(t, 1);
			e = Math.min(e, Math.sqrt(u / (n.width * n.height)));
		}
		let r = /* @__PURE__ */ new Map(), i = Math.floor(t.decodedByteBudget / 4), s = 0;
		for (let [t, c] of n) {
			let n = a(c, 1), l = n.width * n.height, u = Math.max(l, Math.floor(l * e * e)), d = Math.max(1, Math.min(u, Math.floor(i / c.surfaces))), f = Math.min(2, Math.sqrt(d / l));
			r.set(t, o(c, f, d));
			let p = d * c.surfaces;
			i -= p, s += p * 4;
		}
		return Object.freeze({
			targets: r,
			idealBytes: f,
			plannedBytes: s,
			qualityScale: 1,
			degraded: !1
		});
	}
	if (t.strategy === "strict" && f > t.decodedByteBudget) throw new h("active-decoded-bytes", t.decodedByteBudget, f);
	if (t.strategy === "adaptive") {
		let e = Sn(n, (e) => a(e, 0));
		if (e > t.decodedByteBudget) throw new h("active-decoded-bytes", t.decodedByteBudget, e);
	}
	let p = 1;
	if (t.strategy === "adaptive" && f > t.decodedByteBudget) {
		let e = 0, r = 1;
		for (let i = 0; i < 40; i++) {
			let i = (e + r) / 2;
			Sn(n, (e) => a(e, i)) <= t.decodedByteBudget ? e = i : r = i;
		}
		p = e;
	}
	let m = /* @__PURE__ */ new Map();
	for (let [e, t] of n) m.set(e, o(t, p));
	let g = Sn(n, (e) => a(e, p)), _ = p < 1 && n.size > 0 ? Math.min(...[...n.entries()].flatMap(([e, t]) => {
		let n = m.get(e);
		return [n.width / t.targetWidth, n.height / t.targetHeight];
	})) : p;
	return Object.freeze({
		targets: m,
		idealBytes: f,
		plannedBytes: g,
		qualityScale: _,
		degraded: p < 1
	});
}
//#endregion
//#region packages/core/src/image/bitmap-image-by-path.ts
function wn(e) {
	return typeof e == "object" && !!e || typeof e == "function";
}
var Tn = 256, R = /* @__PURE__ */ new WeakMap(), En = /* @__PURE__ */ new WeakMap(), Dn = /* @__PURE__ */ new WeakMap(), On = /* @__PURE__ */ new WeakMap();
function z(e) {
	return Dn.get(e) ?? 0;
}
function kn(e, t) {
	return On.get(e)?.get(t) ?? 0;
}
function An(e, t) {
	if (z(e) !== t) throw Error("Decoded bitmap cache was dropped during raster inspection");
}
function jn(e, t) {
	return {
		owner: e,
		ownerGeneration: z(e),
		namespace: t,
		namespaceGeneration: kn(e, t)
	};
}
function Mn(e, t) {
	if (t.owner !== e || z(e) !== t.ownerGeneration) throw Error("Decoded bitmap cache was dropped during a derived image operation");
}
function Nn(e, t, n) {
	if (Mn(e, n), n.namespace !== t || kn(e, t) !== n.namespaceGeneration) throw Error("Decoded bitmap cache namespace was dropped during a derived image operation");
}
function Pn(e) {
	let t = En.get(e);
	if (t) for (let e of t.values()) e.then((e) => {
		e.initialBlob = void 0;
	}).catch(() => {});
}
function Fn(e, t, n, r) {
	let i = En.get(e);
	i || (i = /* @__PURE__ */ new Map(), En.set(e, i));
	let a = i.get(t);
	if (a) return a;
	let o = vn(e, async () => {
		let e = await r(t, n);
		return {
			inspection: await an(e),
			initialBlob: e
		};
	}).catch((e) => {
		throw i?.delete(t), e;
	});
	return i.set(t, o), o;
}
async function In(e, t, n, r = n) {
	return (await Fn(r, e, t, n)).inspection;
}
function Ln(e) {
	let t = R.get(e);
	return t || (t = {
		entries: /* @__PURE__ */ new Map(),
		retainedBytes: 0,
		retainedLimit: f
	}, R.set(e, t)), t;
}
var Rn = /* @__PURE__ */ new WeakMap(), zn = /* @__PURE__ */ new WeakMap();
async function Bn(e, t, n) {
	let r = zn.get(e);
	if (!r) {
		let i;
		r = {
			tail: new Promise((e) => {
				i = e;
			}),
			pending: 1
		}, zn.set(e, r);
		let a;
		try {
			return a = Wn(e, t), await n();
		} finally {
			Pn(e), a?.(), i(), r.pending--, r.pending === 0 && zn.delete(e);
		}
	}
	let i = r, a = i.tail.catch(() => {}), o, s = new Promise((e) => {
		o = e;
	});
	i.pending++, i.tail = a.then(() => s), await a;
	let c;
	try {
		return c = Wn(e, t), await n();
	} finally {
		Pn(e), c?.(), o(), i.pending--, i.pending === 0 && zn.delete(e);
	}
}
var Vn = /* @__PURE__ */ new WeakSet();
function Hn(e) {
	!e || Vn.has(e) || (Vn.add(e), zt(e));
}
function Un(e) {
	try {
		Hn(e);
	} catch {}
}
function Wn(e, t) {
	let n = yn(t), r = Rn.get(e);
	r || (r = {
		count: 0,
		deferred: [],
		activeBytes: 0,
		activeBitmaps: /* @__PURE__ */ new WeakSet(),
		limits: /* @__PURE__ */ new Map(),
		activeLimit: n.decodedByteBudget
	}, Rn.set(e, r));
	let i = r, a = Symbol("decoded-image-lease");
	i.limits.set(a, n.decodedByteBudget), i.activeLimit = Math.min(...i.limits.values());
	let o = Ln(e);
	for (o.retainedLimit = i.activeLimit; o.retainedBytes > o.retainedLimit && qn(e, o););
	i.count++;
	let s = !1;
	return () => {
		if (s) return;
		if (s = !0, i.count--, i.limits.delete(a), i.count > 0) {
			i.activeLimit = Math.min(...i.limits.values());
			let t = R.get(e);
			t && (t.retainedLimit = i.activeLimit);
			return;
		}
		for (let e of i.deferred) e.then((e) => Hn(e)).catch(() => {});
		i.deferred = [], i.activeBytes = 0, i.activeBitmaps = /* @__PURE__ */ new WeakSet(), Rn.delete(e);
		let t = R.get(e);
		t && (t.retainedLimit = f);
	};
}
function Gn(e) {
	if (!e) return 0;
	let t = Number(e.width), n = Number(e.height);
	return Number.isSafeInteger(t) && t > 0 && Number.isSafeInteger(n) && n > 0 ? t * n * 4 : 0;
}
function Kn(e, t) {
	if (!t) return;
	let n = Rn.get(e);
	if (!n || n.count === 0 || n.activeBitmaps.has(t)) return;
	let r = n.activeBytes + Gn(t);
	if (r > n.activeLimit) throw new h("active-decoded-bytes", n.activeLimit, r);
	n.activeBitmaps.add(t), n.activeBytes = r;
}
function qn(e, t, n) {
	let r = [...t.entries].find(([e]) => e !== n);
	if (!r) return !1;
	let [i, a] = r;
	return t.entries.delete(i), t.retainedBytes -= a.weight, Jn(e, a.ownedPromise), !0;
}
function Jn(e, t) {
	let n = Rn.get(e);
	if (n && n.count > 0) {
		n.deferred.push(t);
		return;
	}
	t.then((e) => Hn(e)).catch(() => {});
}
function B(e) {
	if (!(typeof e != "number" || !Number.isFinite(e) || !(e > 0))) return Math.ceil(e);
}
function Yn(e) {
	return {
		...e,
		targetWidthPx: B(e.targetWidthPx),
		targetHeightPx: B(e.targetHeightPx)
	};
}
function V(e) {
	let t = e.maxRetainedPixels;
	return typeof t == "number" && Number.isSafeInteger(t) && t > 0 ? Math.min(t, f / 4) : f / 4;
}
function Xn(e) {
	return V(e) < f / 4;
}
function Zn(e, t) {
	if (!e) return null;
	let n = V(t), r = Number(e.width), i = Number(e.height), a = Math.max(r, i);
	if (!Number.isFinite(a) || a > 32767) throw new h("image-dimension", m, Number.isFinite(a) ? a : 2 ** 53 - 1);
	let o = r * i;
	if (!(r > 0) || !(i > 0) || o > n) throw new h("image-pixels", n, Number.isSafeInteger(o) && o >= 0 ? o : 2 ** 53 - 1);
	return e;
}
function H(e, t = {}) {
	let n = B(t.targetWidthPx), r = B(t.targetHeightPx), i = `${e.length}:${e}`, a = V(t);
	return n || r ? `raster:${i}:${n ?? 0}x${r ?? 0}:p${a}` : `native:${i}`;
}
function Qn(e) {
	return e.inspection.format === "wmf" || e.inspection.format === "emf";
}
function $n(e) {
	let t = n(e.widthPt ?? 0, e.heightPt ?? 0);
	return {
		width: t.w,
		height: t.h,
		suppressBoundaryFrame: e.suppressBoundaryFrame === !0,
		pixelLimit: V(e)
	};
}
function er(e, t) {
	return `metafile:${`${e.length}:${e}`}:s${+!!t.suppressBoundaryFrame}:p${t.pixelLimit}:`;
}
function tr(e, t, n) {
	let r = $n(t), i = B(n?.width) ?? r.width, a = B(n?.height) ?? r.height;
	return `${er(e, r)}${i}x${a}`;
}
function nr(e, t, n) {
	let r = $n(n), i = `${U}${er(t, r)}`, a;
	for (let t of R.get(e)?.entries.keys() ?? []) {
		if (!t.startsWith(i)) continue;
		let e = /^(\d+)x(\d+)$/.exec(t.slice(i.length));
		if (!e) continue;
		let n = Number(e[1]), o = Number(e[2]);
		if (n < r.width || o < r.height) continue;
		let s = n * o;
		(!a || s < a.pixels) && (a = {
			key: t.slice(U.length),
			pixels: s
		});
	}
	return a?.key;
}
function rr(e, t, n, r) {
	let i = B(n.targetWidthPx), a = B(n.targetHeightPx);
	if (!i && !a) return;
	let o = V(n), s = `${U}raster:${`${t.length}:${t}`}:`, c;
	for (let [t, n] of R.get(e)?.entries ?? []) {
		if (!t.startsWith(s)) continue;
		let e = /^(\d+)x(\d+):p(\d+)$/.exec(t.slice(s.length));
		if (!e) continue;
		let l = Number(e[1]), u = Number(e[2]);
		if (Number(e[3]) !== o || l < (i ?? 0) || u < (a ?? 0)) continue;
		let d = Number(n.bitmap?.width), f = Number(n.bitmap?.height), p = Number.isFinite(d) && d > 0 && Number.isFinite(f) && f > 0, m = r ? x(r, l, u) ?? r : void 0, h = p ? d * f : m ? m.width * m.height : l * u;
		(!c || h < c.pixels) && (c = {
			key: t.slice(U.length),
			pixels: h
		});
	}
	return c?.key;
}
function ir(e, t = {}) {
	let n = V(t), r = e.inspection.dimensions;
	if (!r) return !1;
	let i = r.width * r.height;
	if (t.maxRetainedPixels !== void 0 && !Yt(r) && i <= n) return !1;
	let a = B(t.targetWidthPx), o = B(t.targetHeightPx);
	return (e.inspection.format === "tiff" ? (a !== void 0 || o !== void 0) && (a === void 0 || a < r.width) && (o === void 0 || o < r.height) : a !== void 0 && o !== void 0 && (a < r.width || o < r.height)) || Yt(r) || i > n;
}
async function ar(e, t, n, r = {}, i, a) {
	i && Mn(n, i);
	let o = Yn(r), s = i?.ownerGeneration ?? z(n), c = await Fn(n, e, t, n);
	i ? Mn(n, i) : An(n, s);
	let l = Qn(c);
	if (a) return l ? tr(e, o, {
		width: Number(a.width),
		height: Number(a.height)
	}) : H(e, {
		targetWidthPx: Number(a.width),
		targetHeightPx: Number(a.height),
		maxRetainedPixels: o.maxRetainedPixels
	});
	if (l) return nr(n, e, o) ?? tr(e, o);
	if (!o.targetWidthPx && !o.targetHeightPx) return H(e);
	let u = `${U}${H(e)}`;
	return !Xn(o) && R.get(n)?.entries.has(u) ? H(e) : ir(c, o) ? rr(n, e, o, c.inspection.dimensions) ?? H(e, o) : H(e);
}
function or(e, t, n) {
	let r = Ln(t), i = r.entries, a = i.get(e);
	if (a) return i.delete(e), i.set(e, a), a.promise.then((e) => (Kn(t, e), e));
	let o = vn(t, n), s = o.then(({ bitmap: e, owned: t }) => t ? e : null), c = o.then(({ bitmap: e, owned: n }) => {
		try {
			return Kn(t, e), e;
		} catch (t) {
			throw n && Hn(e), t;
		}
	}), l = {
		promise: c,
		ownedPromise: s,
		weight: 0
	};
	for (o.then(({ bitmap: n, owned: a }) => {
		if (i.get(e) === l) {
			if (l.bitmap = n, !a) {
				i.delete(e);
				return;
			}
			for (l.weight = Gn(n), r.retainedBytes += l.weight; r.retainedBytes > r.retainedLimit && qn(t, r, e););
		}
	}).catch(() => {}), c.catch(() => {
		i.get(e) === l && (i.delete(e), r.retainedBytes -= l.weight, Jn(t, s));
	}), i.set(e, l); i.size > Tn && qn(t, r, e););
	return c;
}
var sr = "base", U = `${sr}:`, cr = "derived:";
function lr(e, t, n, r) {
	return or(`${e}:${t}`, n, r);
}
function ur(e, t, n, r, i) {
	return i && Nn(n, e, i), lr(`${cr}${e}`, t, n, r);
}
function dr(e, t, n, r = {}, i = n) {
	let a = Yn(r), { widthPt: o = 0, heightPt: s = 0, suppressBoundaryFrame: c = !1, tiff: l, targetWidthPx: u, targetHeightPx: d, maxRetainedPixels: f, svgDecoder: p } = a;
	if (t === "image/svg+xml" && p) return lr(sr, H(e, a), i, async () => ({
		bitmap: await p(await n(e, t), {
			targetWidthPx: u,
			targetHeightPx: d
		}),
		owned: !0
	}));
	let m = (r, p, m = !0) => {
		let h = p?.initialBlob;
		return p && (p.initialBlob = void 0), lr(sr, r, i, async () => {
			let r = h ?? await n(e, t), i = {
				widthPt: o,
				heightPt: s,
				suppressBoundaryFrame: c,
				tiff: l,
				targetWidthPx: m ? u : void 0,
				targetHeightPx: m ? d : void 0,
				maxRetainedPixels: f
			};
			return {
				bitmap: p ? await hn(r, i, p.inspection) : await mn(r, i),
				owned: !0
			};
		}).then((e) => Zn(e, a));
	}, h = z(i);
	return Fn(i, e, t, n).then((t) => {
		if (An(i, h), Qn(t)) return m(nr(i, e, a) ?? tr(e, a), t);
		if (!u && !d) return m(H(e), t, !1);
		let n = `${U}${H(e)}`;
		if (!Xn(a) && R.get(i)?.entries.has(n)) return m(H(e), t, !1);
		let r = ir(t, a);
		return m(r ? rr(i, e, a, t.inspection.dimensions) ?? H(e, a) : H(e), t, r);
	});
}
function fr(e, t) {
	return R.get(t)?.entries.get(`${U}${H(e)}`)?.bitmap;
}
function pr(e) {
	if (!wn(e)) return;
	Dn.set(e, z(e) + 1), On.delete(e), En.delete(e);
	let t = R.get(e);
	if (t) {
		for (let n of t.entries.values()) Jn(e, n.ownedPromise);
		t.entries.clear(), t.retainedBytes = 0, R.delete(e);
	}
}
//#endregion
//#region packages/core/src/image/svg-image-by-path.ts
var mr = /* @__PURE__ */ new WeakMap(), hr = 256;
function gr(e) {
	let t = mr.get(e);
	return t || (t = { imgs: /* @__PURE__ */ new Map() }, mr.set(e, t)), t;
}
function _r(e, t, n = {}) {
	if (typeof Image > "u") return dr(e, "image/svg+xml", t, {
		targetWidthPx: n.targetWidthPx,
		targetHeightPx: n.targetHeightPx,
		maxRetainedPixels: n.maxRetainedPixels,
		svgDecoder: n.workerDecoder
	}).then((t) => {
		if (!t) throw Error(`svg decode failed: ${e}`);
		return t;
	});
	let r = gr(t), i = r.imgs.get(e);
	if (i) return r.imgs.delete(e), r.imgs.set(e, i), i.promise;
	let a = {};
	if (a.promise = vn(t, async () => {
		if (r.imgs.get(e) !== a) throw Error("SVG decode was superseded before it started");
		let n = await t(e, "image/svg+xml"), i = URL.createObjectURL(n);
		try {
			let t = new Image();
			return await new Promise((n, r) => {
				t.onload = () => {
					typeof t.decode == "function" ? t.decode().then(n).catch(n) : n();
				}, t.onerror = () => r(/* @__PURE__ */ Error(`svg load failed: ${e}`)), t.src = i;
			}), t;
		} finally {
			URL.revokeObjectURL(i);
		}
	}), a.promise.catch(() => {
		r.imgs.get(e) === a && r.imgs.delete(e);
	}), r.imgs.set(e, a), r.imgs.size > hr) {
		let e = r.imgs.keys().next().value;
		r.imgs.delete(e);
	}
	return a.promise;
}
function vr(e) {
	let t = mr.get(e);
	t && (t.imgs.clear(), mr.delete(e));
}
//#endregion
//#region packages/core/src/image/duotone.ts
function yr(e) {
	return /^[0-9a-fA-F]{6}$/.test(e) ? [
		parseInt(e.slice(0, 2), 16),
		parseInt(e.slice(2, 4), 16),
		parseInt(e.slice(4, 6), 16)
	] : null;
}
function br(e, t, n) {
	return (.299 * e + .587 * t + .114 * n) / 255;
}
function xr(e, t, n) {
	let r = yr(t), i = yr(n);
	if (!r || !i) return e;
	let [a, o, s] = r, [c, l, u] = i, d = e.data;
	for (let e = 0; e < d.length; e += 4) {
		if (d[e + 3] === 0) continue;
		let t = br(d[e], d[e + 1], d[e + 2]);
		d[e] = Math.round(a + (c - a) * t), d[e + 1] = Math.round(o + (l - o) * t), d[e + 2] = Math.round(s + (u - s) * t);
	}
	return e;
}
var Sr = (e, t) => typeof OffscreenCanvas > "u" ? null : new OffscreenCanvas(e, t);
async function Cr(e, t, n) {
	let { width: r, height: i } = n;
	if (r <= 0 || i <= 0 || typeof createImageBitmap > "u") return e;
	let a = (n.offscreenFactory ?? Sr)(r, i);
	if (!a) return e;
	let o = a.getContext("2d");
	if (!o) return e;
	o.drawImage(e, 0, 0);
	let s;
	try {
		s = o.getImageData(0, 0, r, i);
	} catch {
		return e;
	}
	xr(s, t.clr1, t.clr2), o.putImageData(s, 0, 0);
	let c = C(r, i, n.targetWidthPx, n.targetHeightPx);
	return c ? createImageBitmap(a, c) : createImageBitmap(a);
}
//#endregion
//#region packages/core/src/image/blip-gate.ts
function wr(e) {
	return e.svgImagePath != null && e.srcRect == null;
}
//#endregion
//#region packages/core/src/math/mathml.ts
var Tr = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;"
}, W = (e) => e.replace(/[&<>"]/g, (e) => Tr[e]);
function Er(e, t = "roman") {
	if (t === "double-struck" || t === "monospace") return t;
	if (t === "fraktur") return e === "bold" || e === "boldItalic" ? "bold-fraktur" : "fraktur";
	if (t === "script") return e === "bold" || e === "boldItalic" ? "bold-script" : "script";
	if (t === "sans-serif") switch (e) {
		case "roman": return "sans-serif";
		case "italic": return "sans-serif-italic";
		case "bold": return "bold-sans-serif";
		case "boldItalic": return "sans-serif-bold-italic";
	}
	switch (e) {
		case "roman": return "normal";
		case "bold": return "bold";
		case "boldItalic": return "bold-italic";
		case "italic": return null;
	}
}
var Dr = new Set([..."⏞⏟⎴⎵︷︸⏜⏝{}[]()¯_‾"]), Or = "+−±∓×÷·∗⋅∘∙*/", kr = "=≠<>≤≥≈≡∼≅≃→←↔⇒∈∉⊂⊆⊃⊇∝≪≫⊥≔", Ar = "([{⟨⌈⌊", jr = ")]}⟩⌉⌋", Mr = ",;";
function Nr(e, t, n) {
	let r = Er(t, n), i = r ? ` mathvariant="${r}"` : "", a = "", o = "", s = () => {
		o &&= (a += `<mn${i}>${W(o)}</mn>`, "");
	};
	for (let t of e) {
		if (t === " ") {
			s();
			continue;
		}
		if (t >= "0" && t <= "9") {
			o += t;
			continue;
		}
		s(), Or.includes(t) || kr.includes(t) || Mr.includes(t) ? a += `<mo>${W(t)}</mo>` : Ar.includes(t) || jr.includes(t) ? a += `<mo fence="true" stretchy="false">${W(t)}</mo>` : a += `<mi${i}>${W(t)}</mi>`;
	}
	return s(), a;
}
function G(e) {
	return e.map(Pr).join("");
}
function K(e) {
	return `<mrow>${G(e)}</mrow>`;
}
function Pr(e) {
	switch (e.kind) {
		case "run": return Nr(e.text, e.style, e.__script);
		case "group": return K(e.items);
		case "fraction": return `<mfrac${e.bar === !1 ? " linethickness=\"0\"" : ""}>${K(e.num)}${K(e.den)}</mfrac>`;
		case "sup": return `<msup>${K(e.base)}${K(e.sup ?? [])}</msup>`;
		case "sub": return `<msub>${K(e.base)}${K(e.sub ?? [])}</msub>`;
		case "subSup": return `<msubsup>${K(e.base)}${K(e.sub ?? [])}${K(e.sup ?? [])}</msubsup>`;
		case "nary": return Ur(e);
		case "delimiter": return Wr(e);
		case "radical": return e.index && e.index.length ? `<mroot>${K(e.radicand)}${K(e.index)}</mroot>` : `<msqrt>${G(e.radicand)}</msqrt>`;
		case "limit": return Br(e);
		case "array": return Vr(e);
		case "groupChr": {
			let t = K(e.base), n = Dr.has(e.char), r = e.pos === "top" ? "mover" : "munder", i = `<mo stretchy="${n}">${W(e.char)}</mo>`;
			return n ? `<${r}>${t}${i}</${r}>` : `<${r} accent="true">${t}${i}</${r}>`;
		}
		case "bar": {
			let t = K(e.base), n = "<mo stretchy=\"true\">&#x2015;</mo>";
			return e.pos === "bot" ? `<munder>${t}${n}</munder>` : `<mover>${t}${n}</mover>`;
		}
		case "accent": return zr(e);
		case "func": return `<mrow>${K(e.name)}<mo>&#x2061;</mo>${K(e.arg)}</mrow>`;
		case "phant": return Fr(e);
		case "sPre": return `<mmultiscripts>${K(e.base)}<mprescripts/>${K(e.sub)}${K(e.sup)}</mmultiscripts>`;
		case "box": return K(e.base);
		case "borderBox": return Ir(e);
	}
}
function Fr(e) {
	let t = e.show ? G(e.base) : `<mphantom>${G(e.base)}</mphantom>`, n = [];
	return e.zeroWid && n.push("width=\"0\""), e.zeroAsc && n.push("height=\"0\""), e.zeroDesc && n.push("depth=\"0\""), n.length ? `<mpadded ${n.join(" ")}>${t}</mpadded>` : `<mrow>${t}</mrow>`;
}
function Ir(e) {
	let t = [], n = !e.hideTop, r = !e.hideBot, i = !e.hideLeft, a = !e.hideRight;
	n && r && i && a ? t.push("box") : (n && t.push("top"), r && t.push("bottom"), i && t.push("left"), a && t.push("right")), e.strikeH && t.push("horizontalstrike"), e.strikeV && t.push("verticalstrike"), e.strikeBltr && t.push("updiagonalstrike"), e.strikeTlbr && t.push("downdiagonalstrike");
	let o = G(e.base);
	return t.length ? `<menclose notation="${t.join(" ")}">${o}</menclose>` : `<mrow>${o}</mrow>`;
}
var Lr = {
	"̀": "`",
	"́": "´",
	"̂": "^",
	"̃": "~",
	"̆": "˘",
	"̇": "˙",
	"̈": "¨",
	"̌": "ˇ",
	"⃗": "→",
	"⃖": "←"
}, Rr = new Set([
	"̅",
	"̄",
	"¯",
	"‾",
	"̲",
	"̳"
]);
function zr(e) {
	let t = K(e.base);
	if (Rr.has(e.char)) return `<mover>${t}<mo stretchy="true">&#x2015;</mo></mover>`;
	let n = Lr[e.char] ?? e.char;
	return `<mover accent="true">${t}<mo stretchy="${n === "→" || n === "←" ? "true" : "false"}">${W(n)}</mo></mover>`;
}
function Br(e) {
	let t = K(e.base), n = e.lower && e.lower.length ? K(e.lower) : null, r = e.upper && e.upper.length ? K(e.upper) : null;
	return n && r ? `<munderover>${t}${n}${r}</munderover>` : n ? `<munder>${t}${n}</munder>` : r ? `<mover>${t}${r}</mover>` : t;
}
function Vr(e) {
	let t = Math.max(1, ...e.rows.map((e) => e.length)), n;
	n = e.align === "eq" ? Array.from({ length: t }, (e, t) => t % 2 == 0 ? "right" : "left").join(" ") : e.align === "left" ? "left" : "center";
	let r = e.rows.map((e) => `<mtr>${e.map((e) => `<mtd>${G(e)}</mtd>`).join("")}</mtr>`).join("");
	return `<mtable columnalign="${n}" rowspacing="0.2em" columnspacing="0.3em">${r}</mtable>`;
}
var Hr = new Set([..."∫∬∭∮∯∰∱∲∳⨌⨍⨎⨏⨐⨑⨒⨓⨔⨕⨖⨗"]);
function Ur(e) {
	let t = e.limLoc === "subSup" ? !0 : e.limLoc === "undOvr" ? !1 : Hr.has(e.op), n = `<mo largeop="true">${W(e.op)}</mo>`, r = e.sub ?? [], i = e.sup ?? [], a;
	return a = t ? r.length && i.length ? `<msubsup>${n}${K(r)}${K(i)}</msubsup>` : r.length ? `<msub>${n}${K(r)}</msub>` : i.length ? `<msup>${n}${K(i)}</msup>` : n : r.length && i.length ? `<munderover>${n}${K(r)}${K(i)}</munderover>` : r.length ? `<munder>${n}${K(r)}</munder>` : i.length ? `<mover>${n}${K(i)}</mover>` : n, `<mrow>${a}${G(e.body)}</mrow>`;
}
function Wr(e) {
	let t = (e) => `<mo fence="true" stretchy="true">${W(e)}</mo>`, n = e.items.map((e) => K(e)).join("<mo separator=\"true\">,</mo>");
	return `<mrow>${t(e.begChar)}${n}${t(e.endChar)}</mrow>`;
}
function Gr(e, t) {
	return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="${t ? "block" : "inline"}">${G(e)}</math>`;
}
var Kr = 64;
function qr(e, t, n) {
	let r = Math.max(1, Math.round(t * 256)), i = Math.max(1, Math.round(n * 256));
	return e.replace(/<svg([^>]*?)>/, (e, t) => `<svg${t.replace(/\s(?:width|height)="[^"]*"/g, "")} width="${r}" height="${i}">`);
}
function q(e, t) {
	return RegExp(`(?:^|\\s)${t}="([^"]*)"`).exec(e)?.[1];
}
function J(e, t, n = 0) {
	let r = Number.parseFloat(q(e, t) ?? "");
	return Number.isFinite(r) ? r : n;
}
function Jr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of [
		"fill",
		"stroke",
		"stroke-width",
		"stroke-linecap",
		"stroke-linejoin",
		"fill-rule",
		"opacity"
	]) {
		let r = q(e, n);
		r !== void 0 && t.set(n, r);
	}
	let n = q(e, "style");
	if (n) for (let e of n.split(";")) {
		let n = e.indexOf(":");
		if (n < 0) continue;
		let r = e.slice(0, n).trim(), i = e.slice(n + 1).trim();
		r && i && t.set(r, i);
	}
	return t;
}
function Yr(e, t, n) {
	let r = Jr(t), i = { ...n }, a = r.get("fill");
	a === "none" ? i.fill = !1 : a && (i.fill = !0, e.fillStyle = a);
	let o = r.get("stroke");
	o === "none" ? i.stroke = !1 : o && (i.stroke = !0, e.strokeStyle = o);
	let s = Number.parseFloat(r.get("stroke-width") ?? "");
	Number.isFinite(s) && (e.lineWidth = s);
	let c = r.get("stroke-linecap");
	(c === "butt" || c === "round" || c === "square") && (e.lineCap = c);
	let l = r.get("stroke-linejoin");
	(l === "bevel" || l === "round" || l === "miter") && (e.lineJoin = l);
	let u = r.get("fill-rule");
	(u === "evenodd" || u === "nonzero") && (i.fillRule = u);
	let d = Number.parseFloat(r.get("opacity") ?? "");
	return Number.isFinite(d) && (e.globalAlpha *= Math.max(0, Math.min(1, d))), i;
}
function Xr(e, t) {
	if (!t) return;
	let n = /([a-zA-Z]+)\(([^)]*)\)/g;
	for (let r = n.exec(t); r; r = n.exec(t)) {
		let t = r[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
		if (!t.some((e) => !Number.isFinite(e))) switch (r[1]) {
			case "matrix":
				t.length >= 6 && e.transform(...t.slice(0, 6));
				break;
			case "translate":
				e.translate(t[0] ?? 0, t[1] ?? 0);
				break;
			case "scale": {
				let n = t[0] ?? 1;
				e.scale(n, t[1] ?? n);
				break;
			}
			case "rotate": {
				let n = (t[0] ?? 0) * Math.PI / 180;
				t.length >= 3 ? (e.translate(t[1], t[2]), e.rotate(n), e.translate(-t[1], -t[2])) : e.rotate(n);
				break;
			}
		}
	}
}
function Zr(e, t, n) {
	n.fill && e.fill(t, n.fillRule), n.stroke && e.lineWidth > 0 && e.stroke(t);
}
function Qr(e, t, n, r) {
	let i = q(t.slice(0, t.indexOf(">") + 1), "viewBox")?.trim().split(/[\s,]+/).map(Number);
	if (!i || i.length !== 4 || i.some((e) => !Number.isFinite(e))) throw TypeError("MathJax SVG must contain a finite viewBox");
	let [a, o, s, c] = i;
	if (!(s > 0) || !(c > 0)) throw TypeError("MathJax SVG viewBox must have positive dimensions");
	e.save(), e.setTransform(n / s, 0, 0, r / c, -a * n / s, -o * r / c), e.fillStyle = "#000000", e.strokeStyle = "#000000", e.lineWidth = 1;
	let l = {
		fill: !0,
		stroke: !1,
		fillRule: "nonzero"
	}, u = [], d = /<\/?([A-Za-z][\w:-]*)([^>]*)>/g;
	for (let n = d.exec(t); n; n = d.exec(t)) {
		let [t, r, i = ""] = n, a = r.toLowerCase(), o = t.startsWith("</");
		if (a === "svg") continue;
		if (o) {
			a === "g" && (e.restore(), l = u.pop() ?? l);
			continue;
		}
		if (a === "g") {
			u.push(l), e.save(), l = Yr(e, i, l), Xr(e, q(i, "transform"));
			continue;
		}
		if (a !== "path" && a !== "rect" && a !== "line") continue;
		e.save();
		let s = Yr(e, i, l);
		Xr(e, q(i, "transform"));
		let c = a === "path" ? new Path2D(q(i, "d") ?? "") : new Path2D();
		a === "rect" ? c.rect(J(i, "x"), J(i, "y"), J(i, "width"), J(i, "height")) : a === "line" && (c.moveTo(J(i, "x1"), J(i, "y1")), c.lineTo(J(i, "x2"), J(i, "y2"))), Zr(e, c, s), e.restore();
	}
	e.restore();
}
async function $r(e, t) {
	let { width: n, height: i } = _(e.widthEm * 256, (e.ascentEm + e.descentEm) * 256), a = r(n, i), o = a?.getContext("2d");
	if (!a || !o || typeof Path2D > "u") throw Error("Math SVG rasterization requires Canvas 2D and Path2D support");
	Qr(o, qr(te(e.svg, t), e.widthEm, e.ascentEm + e.descentEm), n, i);
	let s = a, c = n, l = i, u = Kr / 256, d = Math.max(1, Math.round(n * u)), f = Math.max(1, Math.round(i * u));
	for (; c > d || l > f;) {
		let e = Math.max(d, Math.ceil(c / 2)), t = Math.max(f, Math.ceil(l / 2)), n = r(e, t), i = n?.getContext("2d");
		if (!n || !i) break;
		i.imageSmoothingEnabled = !0, i.imageSmoothingQuality = "high", i.drawImage(s, 0, 0, e, t), s = n, c = e, l = t;
	}
	return {
		source: s,
		widthPx: c,
		heightPx: l
	};
}
function ei(e, t) {
	let n = r(e.widthPx, e.heightPx);
	if (!n) return e.source;
	let i = n.getContext("2d");
	return i ? (i.drawImage(e.source, 0, 0, e.widthPx, e.heightPx), i.globalCompositeOperation = "source-in", i.fillStyle = t, i.fillRect(0, 0, e.widthPx, e.heightPx), n) : e.source;
}
//#endregion
//#region packages/core/src/canvas/env.ts
function ti(e) {
	return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function ni(e = 1) {
	return typeof window < "u" && window.devicePixelRatio || e;
}
//#endregion
//#region packages/core/src/canvas/crisp.ts
function ri(e, t, n) {
	let r = Math.round(t * n) % 2 == 1 ? .5 : 0, i = e * n;
	return (Math.round(i - r) + r) / n - e;
}
//#endregion
//#region packages/core/src/internal/runtime-generation.ts
var ii = class {
	state = "uninitialized";
	generationValue = 0;
	readiness;
	poisonListeners = /* @__PURE__ */ new Set();
	constructor(e, t, n) {
		this.initialize = e, this.reinitialize = t, this.normalizeFailure = n;
	}
	get generation() {
		return this.generationValue;
	}
	get poisoned() {
		return this.state === "poisoned";
	}
	onPoison(e) {
		return this.poisonListeners.add(e), () => this.poisonListeners.delete(e);
	}
	async ensureReady() {
		if (this.state !== "ready") {
			if (!this.readiness) {
				let e = this.state === "uninitialized" ? this.initialize : this.reinitialize;
				this.readiness = Promise.resolve().then(e).then(() => {
					this.generationValue += 1, this.state = "ready", this.readiness = void 0;
				}, (e) => {
					throw this.readiness = void 0, e;
				});
			}
			await this.readiness;
		}
	}
	run(e) {
		try {
			return e();
		} catch (e) {
			let t = this.normalizeFailure(e);
			throw t ? (this.poison(t), t) : e;
		}
	}
	tryRunReady(e) {
		if (this.state !== "ready") return { current: !1 };
		let t = this.generationValue, n = this.run(e);
		return this.state !== "ready" || t !== this.generationValue ? { current: !1 } : {
			current: !0,
			generation: t,
			value: n
		};
	}
	poison(e) {
		this.state = "poisoned", this.readiness = void 0;
		for (let t of this.poisonListeners) t(e);
	}
	assertCurrent(e) {
		if (this.state !== "ready" || e !== this.generationValue) throw Error("WASM archive session belongs to a discarded runtime generation");
	}
}, ai = class e extends Error {
	code = "parser-crashed";
	constructor(t) {
		super(t), this.name = "WasmTrapError", Object.setPrototypeOf(this, e.prototype);
	}
};
function oi(e) {
	let t = globalThis.WebAssembly?.RuntimeError;
	return t && e instanceof t || e instanceof RangeError ? !0 : e instanceof Error ? e.name === "RuntimeError" || e.name === "CompileError" || e.name === "LinkError" || e.name === "InternalError" || e.name === "OOMError" : !1;
}
function si(e) {
	try {
		if ((typeof e != "object" || !e) && typeof e != "function") return;
		let t = Reflect.get(e, "__destroy_into_raw");
		typeof t == "function" && Reflect.apply(t, e, []);
	} catch {}
}
//#endregion
//#region packages/core/src/worker/pull-credit-error.ts
var ci = "ooxml-insufficient-credit", li = "OOXML_INSUFFICIENT_CREDIT:";
function ui(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e > 0;
}
function di(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = e;
	return ui(t.requiredBytes) && ui(t.offeredBytes) && t.requiredBytes > t.offeredBytes;
}
var fi = class e extends RangeError {
	code = ci;
	requiredBytes;
	offeredBytes;
	constructor(t) {
		super(`Pull unit requires ${t.requiredBytes} bytes but credit is ${t.offeredBytes}`), this.name = "PullSessionInsufficientCreditError", this.requiredBytes = t.requiredBytes, this.offeredBytes = t.offeredBytes, Object.setPrototypeOf(this, e.prototype);
	}
};
function pi(e) {
	if (e instanceof fi) return e;
	let t = e instanceof Error ? e.message : String(e);
	if (!t.startsWith(li)) return;
	let n;
	try {
		n = JSON.parse(t.slice(26));
	} catch {
		return;
	}
	if (!n || typeof n != "object" || Array.isArray(n)) return;
	let r = n;
	if (!(r.code !== "ooxml-insufficient-credit" || !di(r))) return new fi(r);
}
function mi(e, t, n) {
	let r = pi(e);
	if (!(!r || r.offeredBytes !== t || r.requiredBytes > n)) return r;
}
function hi(e, t, n) {
	if (gi(e)) return e.offeredBytes === t && e.requiredBytes <= n ? e.requiredBytes : void 0;
}
function gi(e) {
	return e instanceof fi || !!e && typeof e == "object" && e.code === "ooxml-insufficient-credit" && di(e);
}
//#endregion
//#region packages/core/src/worker/error-wire.ts
var _i = "OOXML_RESOURCE_LIMIT:", vi = 128, yi = 256, bi = 4096;
function Y(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function xi(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = e;
	return Y(t.archiveEntryCount) && Y(t.declaredInflatedBytes) && (t.largestInflatedEntryBytes === void 0 || Y(t.largestInflatedEntryBytes)) && Y(t.distinctInflatedBytes) && Y(t.operationInflatedBytes);
}
function Si(e) {
	let t;
	try {
		t = JSON.parse(new TextDecoder().decode(e));
	} catch {
		throw TypeError("OOXML resource usage checkpoint is not valid JSON");
	}
	if (!xi(t)) throw TypeError("OOXML resource usage checkpoint is invalid");
	return t;
}
function Ci(e) {
	return e === "docx" || e === "xlsx" || e === "pptx";
}
function wi(e) {
	return e === "container" || e === "decompression" || e === "parsing" || e === "serialization" || e === "layout" || e === "rendering" || e === "worker";
}
function Ti(e, t) {
	return typeof e == "string" && e.length > 0 && e.length <= t && !/[\u0000-\u001f\u007f]/u.test(e);
}
function Ei(e) {
	return Ti(e, vi) && /^[a-z0-9][a-z0-9-]*$/u.test(e);
}
function Di(e) {
	return !Ti(e, bi) || e.startsWith("/") || e.startsWith("\\") || e.includes("\\") || e.includes("?") || e.includes("#") || e.includes("://") || /^[a-z]:/iu.test(e) ? !1 : e.split("/").every((e) => e !== "" && e !== "." && e !== "..");
}
var Oi = new Map([
	["archive-entry:declared-inflated-bytes", {
		stage: "container",
		part: "required"
	}],
	["archive-entry:actual-inflated-bytes", {
		stage: "decompression",
		part: "required"
	}],
	["archive:entry-count", {
		stage: "container",
		part: "forbidden"
	}],
	["archive:central-directory-bytes", {
		stage: "container",
		part: "forbidden",
		configurable: !1
	}],
	["archive:distinct-inflated-bytes", {
		stage: "decompression",
		part: "required"
	}],
	["xml-event:bytes", {
		stage: "parsing",
		part: "optional",
		configurable: !1
	}],
	["xml-context:bytes", {
		stage: "parsing",
		part: "optional",
		configurable: !1
	}],
	["xml-tree:depth", {
		stage: "parsing",
		part: "optional",
		configurable: !1
	}],
	["worksheet-row:projected-bytes", {
		stage: "parsing",
		part: "optional",
		configurable: !1
	}],
	["worksheet-shell:projected-bytes", {
		stage: "parsing",
		part: "optional",
		configurable: !1
	}]
]), ki = new Set([...Oi.keys()].map((e) => e.slice(0, e.indexOf(":")))), Ai = new Set([...Oi.keys()].map((e) => e.slice(e.indexOf(":") + 1)));
function ji(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = e;
	return !Ci(t.format) || !Ti(t.operation, yi) || !Ei(t.resource) || !Ei(t.metric) || !Y(t.limit) || !Y(t.observed) || typeof t.configurable != "boolean" || !xi(t.usage) ? !1 : !("part" in t) || Di(t.part);
}
function Mi(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = e;
	if (!wi(t.stage) || !ji(t.violation)) return !1;
	let n = t.violation, r = Oi.get(`${n.resource}:${n.metric}`);
	return r ? t.stage !== r.stage || r.configurable === !1 && n.configurable !== !1 ? !1 : r.part === "required" ? n.part !== void 0 : r.part === "forbidden" ? n.part === void 0 : !0 : !(ki.has(n.resource) && Ai.has(n.metric));
}
function Ni(e) {
	return {
		archiveEntryCount: e.archiveEntryCount,
		declaredInflatedBytes: e.declaredInflatedBytes,
		...e.largestInflatedEntryBytes === void 0 ? {} : { largestInflatedEntryBytes: e.largestInflatedEntryBytes },
		distinctInflatedBytes: e.distinctInflatedBytes,
		operationInflatedBytes: e.operationInflatedBytes
	};
}
function Pi(e) {
	if (!Mi(e)) return;
	let t = e.violation, n = {
		stage: e.stage,
		violation: {
			format: t.format,
			operation: t.operation,
			resource: t.resource,
			metric: t.metric,
			...t.part === void 0 ? {} : { part: t.part },
			limit: t.limit,
			observed: t.observed,
			configurable: t.configurable,
			usage: Ni(t.usage)
		}
	};
	return Mi(n) ? n : void 0;
}
function Fi(e) {
	let t = e.violation;
	return `OOXML resource limit exceeded${t.part ? ` for ${t.part}` : ""}: ${t.metric} ${t.observed} > ${t.limit}`;
}
function Ii(e) {
	let t = e instanceof Error ? e.message : String(e);
	if (!t.startsWith(_i)) return;
	let n;
	try {
		n = JSON.parse(t.slice(21));
	} catch {
		return;
	}
	if (!n || typeof n != "object") return;
	let r = n;
	if (!(r.code !== "ooxml-resource-limit" || !Mi(r.details))) return new T(Fi(r.details), r.details);
}
function Li(e) {
	let t = l(e);
	if (t) {
		let e = new h(t.metric, t.limit, t.observed);
		return {
			message: e.message,
			errorName: e.name,
			code: e.code,
			decodedImage: t
		};
	}
	let n = v(e);
	if (n) return {
		message: n.message,
		errorName: "TiffDecodeError",
		code: "ooxml-tiff-decode"
	};
	let r = pi(e);
	if (r) return {
		message: r.message,
		errorName: r.name,
		code: r.code,
		insufficientCredit: {
			requiredBytes: r.requiredBytes,
			offeredBytes: r.offeredBytes
		}
	};
	let i = e instanceof w || e instanceof T ? e : Ii(e);
	if (i instanceof T) {
		let e = Pi(i.details);
		return e ? {
			message: typeof i.message == "string" ? i.message : Fi(e),
			errorName: "OoxmlResourceLimitError",
			code: "ooxml-resource-limit",
			resourceLimit: e
		} : {
			message: "Invalid OOXML resource-limit error payload",
			errorName: "Error"
		};
	}
	if (i instanceof w) return {
		message: typeof i.message == "string" ? i.message : String(i.message),
		errorName: Ti(i.name, vi) ? i.name : "OoxmlError",
		...Ei(i.code) ? { code: i.code } : {}
	};
	let a = e instanceof Error ? e.message : String(e);
	if (typeof a == "string" && a.startsWith(_i)) return {
		message: "Invalid OOXML resource-limit payload",
		errorName: "Error"
	};
	let o = e instanceof Error ? e : Error(a), s = o;
	return {
		message: typeof o.message == "string" ? o.message : String(o.message),
		errorName: Ti(o.name, vi) ? o.name : "Error",
		...typeof s.code == "string" ? { code: s.code } : {}
	};
}
function Ri(e) {
	try {
		return Li(e);
	} catch {
		return {
			message: "Worker operation failed with an unreadable error",
			errorName: "Error"
		};
	}
}
var zi = new Set([
	"encrypted",
	"invalid-password",
	"unsupported-encryption",
	"legacy-binary-format",
	"not-ooxml"
]), Bi = {
	"image-dimension": !0,
	"image-pixels": !0,
	"active-decoded-bytes": !0
};
function Vi(e) {
	return typeof e == "string" && Object.prototype.hasOwnProperty.call(Bi, e);
}
function Hi(e, t) {
	if (e !== "ooxml-decoded-image-limit" || !t || typeof t != "object") return;
	let n = t, r = n.metric, i = n.limit, a = n.observed;
	if (!(!Vi(r) || !Y(i) || !Y(a) || a <= i)) return {
		metric: r,
		limit: i,
		observed: a
	};
}
function Ui(e) {
	let t = e.message, n = e.errorName, r = e.code, i = e.decodedImage, a = e.insufficientCredit, o = e.resourceLimit, s = typeof t == "string" ? t : "Worker operation failed with an invalid error payload", c = Ti(n, vi) ? n : void 0, l = typeof r == "string" ? r : void 0, u = Hi(l, i);
	if (u) return new h(u.metric, u.limit, u.observed);
	if (l === "ooxml-tiff-decode") return new b(s);
	if (l === "ooxml-insufficient-credit" && di(a)) return new fi(a);
	if (l === "ooxml-resource-limit" && Mi(o)) return new T(s, o);
	if (l && zi.has(l)) return new w(l, s);
	let d = c === "TypeError" ? TypeError(s) : c === "RangeError" ? RangeError(s) : Error(s);
	return c && (d.name = c), l !== void 0 && Object.assign(d, { code: l }), d;
}
function Wi(e) {
	try {
		return Ui(e);
	} catch {
		return /* @__PURE__ */ Error("Worker operation failed with an unreadable error payload");
	}
}
//#endregion
//#region packages/core/src/worker/resource-policy.ts
var Gi = Object.freeze({
	maxArchiveEntryBytes: ne,
	maxTotalInflatedBytes: re,
	maxArchiveEntries: ie
});
function Ki(e, t, n) {
	if (t === void 0) return n;
	if (t === null) return null;
	if (!Number.isSafeInteger(t) || t <= 0) throw RangeError(`resourceLimits.${e} must be null or a positive safe integer number of bytes`);
	return t;
}
function qi(e) {
	if (e === void 0) return Gi.maxArchiveEntries;
	if (e === null) return null;
	if (!Number.isSafeInteger(e) || e <= 0) throw RangeError("resourceLimits.maxArchiveEntries must be null or a positive safe integer");
	if (e > 2e4) throw RangeError(`resourceLimits.maxArchiveEntries must not exceed the internal hard ceiling of ${ae}`);
	return e;
}
function Ji(e) {
	if (!(e === void 0 || !(e > 0))) {
		if (!Number.isSafeInteger(e)) throw RangeError("maxZipEntryBytes must be a positive safe integer number of bytes");
		return e;
	}
}
function Yi(e) {
	let t = e.resourceLimits;
	if (t !== void 0 && (typeof t != "object" || !t || Array.isArray(t))) throw TypeError("resourceLimits must be an object when provided");
	let n = Ji(e.maxZipEntryBytes), r = t?.maxArchiveEntryBytes;
	if (n !== void 0 && r !== void 0 && n !== r) throw RangeError("maxZipEntryBytes conflicts with resourceLimits.maxArchiveEntryBytes");
	return Object.freeze({
		maxArchiveEntryBytes: Ki("maxArchiveEntryBytes", r === void 0 ? n : r, Gi.maxArchiveEntryBytes),
		maxTotalInflatedBytes: Ki("maxTotalInflatedBytes", t?.maxTotalInflatedBytes, Gi.maxTotalInflatedBytes),
		maxArchiveEntries: qi(t?.maxArchiveEntries)
	});
}
function Xi(e) {
	if (e.debug !== void 0 && typeof e.debug != "boolean") throw TypeError("debug must be a boolean when provided");
	if (e.onResourceMetrics !== void 0 && typeof e.onResourceMetrics != "function") throw TypeError("onResourceMetrics must be a function when provided");
	return Object.freeze({
		policy: Yi(e),
		debug: e.debug ?? !1,
		...e.onResourceMetrics ? { onResourceMetrics: e.onResourceMetrics } : {}
	});
}
function Zi(e) {
	return [
		e.maxArchiveEntryBytes === null ? 0n : BigInt(e.maxArchiveEntryBytes),
		e.maxTotalInflatedBytes === null ? 0n : BigInt(e.maxTotalInflatedBytes),
		e.maxArchiveEntries === null ? 0n : BigInt(e.maxArchiveEntries)
	];
}
//#endregion
//#region packages/core/src/internal/console-tui.ts
var Qi = [
	"font-family: \"SFMono-Regular\", Menlo, Monaco, Consolas, monospace",
	"font-size: 12px",
	"line-height: 1.35",
	"font-variant-ligatures: none",
	"letter-spacing: 0",
	"white-space: pre"
].join(";");
function $i(e) {
	if (ea()) {
		console.log(`%c${e}`, Qi);
		return;
	}
	console.log(e);
}
function ea() {
	return typeof window < "u" && globalThis.process?.release?.name !== "node";
}
//#endregion
//#region packages/core/src/worker/resource-debug-view.ts
function ta(e) {
	let t = e.scope === "session" ? "SESSION" : "LOAD", n = e.status === "ok" ? e.scope === "session" ? "COMPLETE" : "READY" : "FAILED", r = [oa(` OOXML ${t}  ${e.format.toUpperCase()}  ${n} `, 68)];
	if (r.push(X(`mode ${e.mode.padEnd(8)}  elapsed ${ia(e.elapsedMs)}`, 68)), e.sourceBytes !== void 0 && r.push(X(`source ${ra(e.sourceBytes)}`, 68)), r.push(sa(" admission ", 68)), r.push(ca("largest entry", e.usage?.largestInflatedEntryBytes, e.policy.maxArchiveEntryBytes, 68)), r.push(ca("total inflated", e.usage?.distinctInflatedBytes, e.policy.maxTotalInflatedBytes, 68)), r.push(X(`entry count ${e.usage ? aa(e.usage.archiveEntryCount) : "—"} / ${e.policy.maxArchiveEntries === null ? "public off" : aa(e.policy.maxArchiveEntries)}`, 68)), e.usage ? r.push(X(`declared inflated ${ra(e.usage.declaredInflatedBytes)}`, 68)) : r.push(X("usage unavailable for this report", 68)), e.checkpoints.length > 0) {
		r.push(sa(" checkpoints ", 68));
		for (let t of e.checkpoints) {
			let e = t.usage ? ra(t.usage.distinctInflatedBytes) : "—";
			r.push(X(`${ia(t.elapsedMs).padStart(8)}  ${t.name.padEnd(25)} ${e.padStart(12)}`, 68));
		}
	}
	if (e.outcome && Object.keys(e.outcome).length > 0 && (r.push(sa(" result ", 68)), r.push(X(Object.entries(e.outcome).map(([e, t]) => `${e} ${aa(t)}`).join("  "), 68))), e.error) {
		r.push(sa(" failure ", 68));
		let t = [
			e.error.code,
			e.error.stage,
			e.error.resource,
			e.error.metric
		].filter((e) => !!e).join(" · ");
		r.push(X(t || "unclassified error", 68));
	}
	return r.push(`└${"─".repeat(68)}┘`), r.join("\n");
}
function na(e) {
	$i(ta(e));
}
function ra(e) {
	if (!Number.isFinite(e) || e < 0) return "—";
	let t = [
		"B",
		"KiB",
		"MiB",
		"GiB",
		"TiB"
	], n = e, r = 0;
	for (; n >= 1024 && r < t.length - 1;) n /= 1024, r += 1;
	let i = r === 0 || n >= 100 ? 0 : n >= 10 ? 1 : 2;
	return `${n.toFixed(i)} ${t[r]}`;
}
function ia(e) {
	return e < 1e3 ? `${Math.round(e)} ms` : `${(e / 1e3).toFixed(2)} s`;
}
function aa(e) {
	return Number.isSafeInteger(e) ? e.toLocaleString("en-US") : "—";
}
function oa(e, t) {
	let n = e.slice(0, t);
	return `┌${n}${"─".repeat(t - n.length)}┐`;
}
function sa(e, t) {
	let n = e.slice(0, t);
	return `├${n}${"─".repeat(t - n.length)}┤`;
}
function X(e, t) {
	let n = e.slice(0, t - 2);
	return `│ ${n}${" ".repeat(t - n.length - 2)} │`;
}
function ca(e, t, n, r) {
	let i = t === void 0 || n === null || n <= 0 ? 0 : Math.min(1, t / n), a = Math.round(i * 16), o = `${"█".repeat(a)}${"░".repeat(16 - a)}`, s = `${t === void 0 ? "—" : ra(t)} / ${n === null ? "public off" : ra(n)}`;
	return X(`${e.padEnd(14)} ${o}  ${s}`, r);
}
//#endregion
//#region packages/core/src/worker/resource-debug.ts
var la = 1e3;
async function ua(e, t) {
	e.observeUsage(await t(la));
	let n = e.current();
	if (!n) throw Error("OOXML resource metrics are not ready");
	return n;
}
var da = class {
	now;
	startedAt;
	policy;
	checkpoints = [];
	sourceBytes;
	lastUsage;
	mode;
	finished = !1;
	terminalStatus;
	terminalError;
	terminalOutcome;
	terminalElapsedMs;
	constructor(e) {
		this.options = e, this.now = e.now ?? ma, this.startedAt = this.now(), this.policy = Object.freeze({
			maxArchiveEntryBytes: e.policy.maxArchiveEntryBytes,
			maxTotalInflatedBytes: e.policy.maxTotalInflatedBytes,
			maxArchiveEntries: e.policy.maxArchiveEntries
		}), this.mode = e.mode;
	}
	setMode(e) {
		!this.options.enabled || this.finished || (this.mode = e);
	}
	setSourceBytes(e) {
		this.options.enabled && (!Number.isSafeInteger(e) || e < 0 || (this.sourceBytes = e));
	}
	checkpoint(e, t) {
		if (!this.options.enabled || this.finished) return;
		t && (this.lastUsage = ha(t));
		let n = this.lastUsage;
		this.checkpoints.push(Object.freeze({
			name: va(e),
			elapsedMs: _a(this.startedAt, this.now()),
			...n ? { usage: n } : {}
		}));
	}
	observeUsage(e) {
		!this.options.enabled || !e || (this.lastUsage = ha(e));
	}
	current() {
		if (!(!this.options.enabled || !this.terminalStatus)) return this.report(this.terminalStatus, this.terminalError, this.terminalOutcome);
	}
	succeed(e) {
		return this.finish("ok", void 0, e);
	}
	fail(e) {
		return this.finish("error", e);
	}
	finish(e, t, n) {
		if (!this.options.enabled || this.finished) return;
		this.finished = !0, this.terminalStatus = e, this.terminalError = t, this.terminalOutcome = n, this.terminalElapsedMs = _a(this.startedAt, this.now());
		let r = this.report(e, t, n);
		return this.options.onMetrics && fa(this.options.onMetrics, r), (this.options.emitToConsole ?? this.options.onMetrics === void 0) && fa(na, r), r;
	}
	report(e, t, n) {
		let r = ga(t) ?? this.lastUsage;
		return Object.freeze({
			schemaVersion: 1,
			scope: this.options.scope ?? "load",
			format: this.options.format,
			mode: this.mode,
			status: e,
			...this.sourceBytes === void 0 ? {} : { sourceBytes: this.sourceBytes },
			elapsedMs: this.terminalElapsedMs ?? _a(this.startedAt, this.now()),
			policy: this.policy,
			...r ? { usage: r } : {},
			checkpoints: Object.freeze([...this.checkpoints]),
			...n ? { outcome: ya(n) } : {},
			...e === "error" ? { error: ba(t) } : {}
		});
	}
};
function fa(e, t) {
	try {
		let n = e(t);
		pa(n) && Promise.resolve(n).catch(() => void 0);
	} catch {}
}
function pa(e) {
	return (typeof e == "object" && !!e || typeof e == "function") && typeof e.then == "function";
}
function ma() {
	return typeof performance > "u" ? Date.now() : performance.now();
}
function ha(e) {
	return Object.freeze({
		archiveEntryCount: e.archiveEntryCount,
		declaredInflatedBytes: e.declaredInflatedBytes,
		...e.largestInflatedEntryBytes === void 0 ? {} : { largestInflatedEntryBytes: e.largestInflatedEntryBytes },
		distinctInflatedBytes: e.distinctInflatedBytes,
		operationInflatedBytes: e.operationInflatedBytes
	});
}
function ga(e) {
	try {
		return e instanceof T ? ha(e.details.violation.usage) : void 0;
	} catch {
		return;
	}
}
function _a(e, t) {
	return Math.max(0, Math.round((t - e) * 10) / 10);
}
function va(e) {
	return e.replace(/[^a-z0-9 -]/giu, "").trim().slice(0, 32) || "checkpoint";
}
function ya(e) {
	return Object.freeze(Object.fromEntries(Object.entries(e).filter(([e, t]) => /^[a-z][a-z0-9-]{0,31}$/u.test(e) && Number.isSafeInteger(t) && t >= 0)));
}
function ba(e) {
	try {
		if (e instanceof T) {
			let t = e.details.violation;
			return Object.freeze({
				code: e.code,
				stage: e.details.stage,
				resource: t.resource,
				metric: t.metric
			});
		}
		if (e instanceof w || e instanceof h) return Object.freeze({ code: e.code });
		if (e instanceof ai || typeof e == "object" && e && e.code === "parser-crashed") return Object.freeze({ code: "parser-crashed" });
	} catch {}
	return Object.freeze({});
}
var Z = "ooxml-pull-v1";
function Q(e, t) {
	if (!Number.isSafeInteger(e) || e <= 0) throw RangeError(`${t} must be a positive safe integer`);
}
function xa(e) {
	if (!(typeof e == "string" && e.length > 0 || typeof e == "number" && Number.isSafeInteger(e) && e > 0)) throw RangeError("session id must be a non-empty string or positive safe integer");
}
var Sa = class {
	bridge;
	options;
	sequence = 0;
	pulling = !1;
	outstanding = !1;
	ending = !1;
	completed = !1;
	lifecyclePromise;
	usage;
	orphanedRequestIds = /* @__PURE__ */ new Set();
	transferDisposers = /* @__PURE__ */ new Set();
	constructor(e, t) {
		xa(t.sessionId), Q(t.operationId, "operation id"), Q(t.generation, "generation"), Q(t.maxByteCredit, "max byte credit"), t.cancelGraceMs !== void 0 && Q(t.cancelGraceMs, "cancel grace"), this.bridge = e, this.options = t;
	}
	async pull(e, t) {
		if (this.validateCredit(e), this.ending || this.completed) throw Error("pull session is closed");
		if (this.pulling) throw Error("a pull request is already in flight");
		if (this.outstanding) throw Error("acknowledge the current chunk before the next pull");
		this.pulling = !0;
		let n = this.sequence;
		try {
			let r = await this.request((t) => ({
				protocol: Z,
				kind: "pull",
				...this.identity(),
				requestId: t,
				sequence: n,
				byteCredit: e
			}), t);
			if (this.validateResponseIdentity(r), r.usage && (this.usage = r.usage), r.kind === "error") throw Wi(r.error);
			if (r.kind !== "chunk") throw Error(`expected chunk response, received ${r.kind}`);
			if (this.ending) throw this.disposePayload(r.payload), Error("pull session is closed");
			try {
				this.validateChunk(r, n, e);
			} catch (e) {
				throw this.disposePayload(r.payload), e;
			}
			return this.outstanding = !0, this.makeChunk(r);
		} catch (e) {
			throw !gi(e) && !this.ending && !this.completed && this.cancel("protocol-error").catch(() => void 0), e;
		} finally {
			this.pulling = !1;
		}
	}
	cancel(e = "closed", t) {
		return this.lifecyclePromise ? this.lifecyclePromise : (this.ending = !0, this.disposeAllTransferred(), this.lifecyclePromise = this.lifecycleControl(this.control("cancel", t, (t) => ({
			protocol: Z,
			kind: "cancel",
			...this.identity(),
			requestId: t,
			reason: e
		}))), this.lifecyclePromise);
	}
	close(e) {
		return this.lifecyclePromise ? this.lifecyclePromise : (this.ending = !0, this.disposeAllTransferred(), this.lifecyclePromise = this.lifecycleControl(this.control("close", e, (e) => ({
			protocol: Z,
			kind: "close",
			...this.identity(),
			requestId: e
		}))), this.lifecyclePromise);
	}
	get usageCheckpoint() {
		return this.usage;
	}
	makeChunk(e) {
		let t = !1, n, r, i = () => {
			t || (t = !0, this.transferDisposers.delete(i), this.disposePayload(e.payload));
		};
		return this.transferDisposers.add(i), {
			done: e.done,
			sequence: e.sequence,
			byteLength: e.byteLength,
			payload: e.payload,
			leaseId: e.leaseId,
			usage: e.usage,
			disposeTransferred: i,
			ack: (t) => n || (this.ending ? Promise.resolve() : (n = this.control("ack", t, (t) => ({
				protocol: Z,
				kind: "ack",
				...this.identity(),
				requestId: t,
				sequence: e.sequence
			})).then(() => {
				this.outstanding = !1, this.sequence++, e.done && (this.completed = !0);
			}).catch((e) => {
				throw this.ending || this.cancel("request-error").catch(() => void 0), e;
			}), n)),
			release: (t) => r || (e.leaseId === void 0 || this.ending ? Promise.resolve() : (r = this.control("release", t, (t) => ({
				protocol: Z,
				kind: "release",
				...this.identity(),
				requestId: t,
				leaseId: e.leaseId
			})).catch((e) => {
				throw this.ending || this.cancel("request-error").catch(() => void 0), e;
			}), r))
		};
	}
	async control(e, t, n) {
		let r = await this.request(n, t, e !== "cancel" && e !== "close");
		if (this.validateResponseIdentity(r), r.usage && (this.usage = r.usage), r.kind === "error") {
			if (r.error.code === "ooxml-stale-lifecycle" && (e === "cancel" || e === "close")) {
				this.forgetLifecycleOrphans();
				return;
			}
			throw Wi(r.error);
		}
		if (r.kind !== "accepted" || r.command !== e) throw Error(`expected ${e} acceptance`);
		(e === "cancel" || e === "close") && this.forgetLifecycleOrphans();
	}
	request(e, t, n = !0) {
		return this.bridge.request(e, void 0, {
			timeoutMs: n ? t?.timeoutMs ?? this.options.timeoutMs : !1,
			signal: t?.signal,
			onOrphanedResponse: (e) => {
				e.kind === "chunk" && this.disposePayload(e.payload);
			},
			onCancel: (e, n) => {
				this.orphanedRequestIds.add(e);
				try {
					t?.onCancel?.(e, n);
				} finally {
					!this.ending && !this.completed && this.cancel(n).catch(() => void 0);
				}
			}
		});
	}
	identity() {
		return {
			sessionId: this.options.sessionId,
			operationId: this.options.operationId,
			generation: this.options.generation
		};
	}
	validateResponseIdentity(e) {
		if (e.protocol !== "ooxml-pull-v1" || e.sessionId !== this.options.sessionId || e.operationId !== this.options.operationId || e.generation !== this.options.generation) throw e.kind === "chunk" && this.disposePayload(e.payload), Error("stale or mismatched pull session response");
	}
	validateCredit(e) {
		if (Q(e, "byte credit"), e > this.options.maxByteCredit) throw RangeError(`byte credit exceeds session maximum ${this.options.maxByteCredit}`);
	}
	validateChunk(e, t, n) {
		if (e.sequence !== t) throw Error("pull response sequence mismatch");
		if (!Number.isSafeInteger(e.byteLength) || e.byteLength < 0) throw RangeError("chunk byte length must be a non-negative safe integer");
		if (e.byteLength > n) throw RangeError("chunk exceeds byte credit");
		e.leaseId !== void 0 && Q(e.leaseId, "lease id");
	}
	disposeAllTransferred() {
		for (let e of [...this.transferDisposers]) e();
	}
	lifecycleControl(e) {
		let t = this.options.cancelGraceMs ?? 1e3, n, r = new Promise((e, r) => {
			n = setTimeout(() => {
				this.bridge.terminate(), r(/* @__PURE__ */ Error(`worker did not accept lifecycle command within ${t}ms`));
			}, t);
		});
		return Promise.race([e, r]).catch((e) => {
			throw this.bridge.terminate(), e;
		}).finally(() => {
			n !== void 0 && clearTimeout(n);
		});
	}
	forgetLifecycleOrphans() {
		this.bridge.forgetOrphaned(this.orphanedRequestIds), this.orphanedRequestIds.clear();
	}
	disposePayload(e) {
		try {
			this.options.disposeTransferred?.(e);
		} catch {}
	}
}, Ca = class {
	owner;
	queue = Promise.resolve();
	leases = /* @__PURE__ */ new Map();
	retainedBytes = 0;
	retainedCount = 0;
	maxRetainedBytes;
	maxRetainedCount;
	cleanups = /* @__PURE__ */ new Set();
	pendingFatalCleanups = [];
	poisonRunning = !1;
	fatal;
	constructor(e) {
		this.maxRetainedBytes = e?.maxRetainedBytes ?? 64 * 1024 * 1024, this.maxRetainedCount = e?.maxRetainedCount ?? 256, Q(this.maxRetainedBytes, "max retained lease bytes"), Q(this.maxRetainedCount, "max retained lease count");
	}
	enqueue(e) {
		let t = this.queue.then(e, e);
		return this.queue = t.then(() => void 0, () => void 0), t;
	}
	acquire(e) {
		return this.owner === void 0 ? (this.owner = e, !0) : this.owner === e;
	}
	release(e) {
		this.owner === e && (this.owner = void 0);
	}
	retainLease(e, t, n) {
		if (!Number.isSafeInteger(n) || n < 0) throw RangeError("retained lease bytes are invalid");
		let r = this.leases.get(e) ?? /* @__PURE__ */ new Map();
		if (r.has(t)) throw Error("driver returned a duplicate lease id");
		if (this.retainedCount + 1 > this.maxRetainedCount) throw RangeError("retained lease count exceeds limit");
		if (this.retainedBytes + n > this.maxRetainedBytes) throw RangeError("retained lease bytes exceed limit");
		r.set(t, n), this.leases.set(e, r), this.retainedCount++, this.retainedBytes += n;
	}
	releaseLease(e, t) {
		let n = this.leases.get(e), r = n?.get(t);
		r !== void 0 && (n?.delete(t), n?.size === 0 && this.leases.delete(e), this.retainedCount--, this.retainedBytes -= r);
	}
	registerCleanup(e) {
		return this.fatal ? (this.poisonRunning ? this.pendingFatalCleanups.push(e) : this.enqueue(e).catch(() => void 0), () => void 0) : (this.cleanups.add(e), () => this.cleanups.delete(e));
	}
	get fatalError() {
		return this.fatal;
	}
	get registeredHostCount() {
		return this.cleanups.size;
	}
	async poison(e) {
		if (this.fatal ??= e, this.poisonRunning) return this.fatal;
		this.poisonRunning = !0, this.pendingFatalCleanups.push(...this.cleanups);
		try {
			let e;
			for (; (e = this.pendingFatalCleanups.shift()) !== void 0;) await e().catch(() => void 0);
		} finally {
			this.poisonRunning = !1;
		}
		return this.fatal;
	}
}, wa = class {
	options;
	coordinator;
	coordinatorOwner = Symbol("pull-session-host");
	unregisterCleanup;
	sequence = 0;
	unacked;
	leases = /* @__PURE__ */ new Map();
	activeDriverLeases = /* @__PURE__ */ new Set();
	nextWireLeaseId;
	cancelRequested = !1;
	cancelComplete = !1;
	closeRequested = !1;
	closeComplete = !1;
	driverCancelComplete = !1;
	driverCloseComplete = !1;
	completed = !1;
	constructor(e) {
		xa(e.sessionId), Q(e.operationId, "operation id"), Q(e.generation, "generation"), Q(e.maxByteCredit, "max byte credit"), e.wireLeaseIdStart !== void 0 && Q(e.wireLeaseIdStart, "wire lease id start"), this.options = e, this.coordinator = e.coordinator, this.nextWireLeaseId = e.wireLeaseIdStart ?? 1, this.unregisterCleanup = this.coordinator.registerCleanup(() => this.forceFatalCleanup());
	}
	dispatch(e, t) {
		return this.coordinator.enqueue(async () => {
			let n = await this.execute(e);
			try {
				t(n.response, n.transfer);
			} catch (e) {
				throw await this.rollbackFailedPost(n), e;
			}
		});
	}
	async rollbackFailedPost(e) {
		let t = e.response;
		if (t.kind === "chunk") {
			let n = t.leaseId === void 0 ? void 0 : this.leases.get(t.leaseId);
			try {
				await this.options.driver.disposeInvalidChunk?.({
					payload: t.payload,
					byteLength: t.byteLength,
					done: t.done,
					leaseId: n?.driverLeaseId,
					retainedBytes: n?.retainedBytes,
					transfer: e.transfer
				});
			} catch {}
		}
		this.unacked = void 0, this.coordinator.release(this.coordinatorOwner);
		for (let [e, t] of [...this.leases]) try {
			await this.options.driver.releaseLease?.(t.driverLeaseId);
		} catch {} finally {
			this.leases.delete(e), this.activeDriverLeases.delete(t.driverLeaseId), this.coordinator.releaseLease(this.coordinatorOwner, e);
		}
		if (this.cancelRequested = !0, !this.driverCancelComplete) try {
			await this.options.driver.cancel?.(), this.driverCancelComplete = !0;
		} catch {}
		this.unregisterCleanup();
	}
	async execute(e) {
		try {
			if (this.isStaleLifecycle(e)) {
				let t = e.kind === "cancel" ? "cancel" : "close";
				return this.sameOperationIdentity(e) ? { response: this.accepted(e, t, !0) } : { response: this.errorResponse(e, {
					message: "stale lifecycle targets another session or operation",
					errorName: "PullSessionProtocolError",
					code: "ooxml-stale-lifecycle"
				}) };
			}
			this.validateCommandIdentity(e);
			let t = this.coordinator.fatalError;
			if (t) return e.kind === "pull" ? { response: this.errorResponse(e, t) } : (e.kind === "cancel" ? await this.cancel() : e.kind === "close" ? await this.close() : e.kind === "release" && await this.release(e.leaseId), { response: this.accepted(e, e.kind) });
			switch (e.kind) {
				case "pull": return await this.pull(e);
				case "ack": return await this.ack(e.sequence), { response: this.accepted(e, "ack") };
				case "release": return await this.release(e.leaseId), { response: this.accepted(e, "release") };
				case "cancel": return await this.cancel(), { response: this.accepted(e, "cancel") };
				case "close": return await this.close(), { response: this.accepted(e, "close") };
			}
		} catch (t) {
			let n = Ri(t);
			return n.code === "ooxml-resource-limit" && (n = await this.coordinator.poison(n)), { response: this.errorResponse(e, n) };
		}
	}
	async pull(e) {
		if (this.closeRequested || this.cancelRequested || this.completed) throw Error("pull session is closed");
		if (this.unacked) throw Error("previous chunk is not acknowledged");
		if (!Number.isSafeInteger(e.sequence) || e.sequence < 0 || e.sequence !== this.sequence) throw Error("pull command sequence mismatch");
		if (this.validateHostCredit(e.byteCredit), !this.coordinator.acquire(this.coordinatorOwner)) throw Error("another operation has an unacknowledged package chunk");
		let t;
		try {
			t = await this.options.driver.pull(e.byteCredit);
		} catch (e) {
			throw this.coordinator.release(this.coordinatorOwner), e;
		}
		let n = !1, r = !1, i, a;
		try {
			let o = this.options.driver.measureChunk(t), s = this.arrayBufferTransferBytes(t.transfer);
			if (o < s) throw RangeError("measured chunk bytes are below ArrayBuffer transfer bytes");
			if (a = Math.max(o, s), t.leaseId !== void 0) {
				if (Q(t.leaseId, "lease id"), t.retainedBytes === void 0) throw Error("retained lease bytes are required");
				if (this.activeDriverLeases.has(t.leaseId)) throw r = !0, Error("driver returned an active duplicate lease id");
				i = this.allocateWireLeaseId(), this.coordinator.retainLease(this.coordinatorOwner, i, t.retainedBytes), this.leases.set(i, {
					driverLeaseId: t.leaseId,
					retainedBytes: t.retainedBytes
				}), this.activeDriverLeases.add(t.leaseId), n = !0;
			} else if (t.retainedBytes !== void 0) throw Error("retained lease bytes require a lease id");
			if (!Number.isSafeInteger(a) || a < 0) throw RangeError("host chunk byte length must be a non-negative safe integer");
			if (a > e.byteCredit) throw RangeError("host chunk exceeds byte credit");
		} catch (e) {
			let a;
			try {
				await this.options.driver.disposeInvalidChunk?.(t);
			} catch (e) {
				a = e;
			}
			if (n && i !== void 0) try {
				await this.release(i);
			} catch (e) {
				a ??= e;
			}
			else if (t.leaseId !== void 0 && !r) try {
				await this.options.driver.releaseLease?.(t.leaseId);
			} catch (e) {
				a ??= e;
			}
			if (r) try {
				await this.cancel();
			} catch (e) {
				a ??= e;
			}
			throw this.coordinator.release(this.coordinatorOwner), a || e;
		}
		return this.unacked = {
			sequence: this.sequence,
			done: t.done
		}, {
			response: {
				kind: "chunk",
				protocol: Z,
				...this.identity(),
				requestId: e.requestId,
				sequence: this.sequence,
				byteLength: a,
				done: t.done,
				payload: t.payload,
				leaseId: i,
				usage: this.resourceUsage()
			},
			transfer: t.transfer
		};
	}
	async ack(e) {
		if (!Number.isSafeInteger(e) || e < 0) throw RangeError("invalid ack sequence");
		if (e < this.sequence) return;
		if (!this.unacked || e !== this.sequence) throw Error("ack sequence mismatch");
		let t = this.unacked.done;
		await this.options.driver.acknowledge?.(e), this.unacked = void 0, this.coordinator.release(this.coordinatorOwner), this.sequence++, t && (this.completed = !0, this.maybeUnregisterCompleted());
	}
	async release(e) {
		Q(e, "wire lease id");
		let t = this.leases.get(e);
		t && (await this.options.driver.releaseLease?.(t.driverLeaseId), this.leases.delete(e), this.activeDriverLeases.delete(t.driverLeaseId), this.coordinator.releaseLease(this.coordinatorOwner, e), this.maybeUnregisterCompleted());
	}
	async cancel() {
		if (this.cancelComplete) return;
		this.cancelRequested = !0, this.unacked = void 0, this.coordinator.release(this.coordinatorOwner);
		let e;
		try {
			await this.releaseAllLeases();
		} catch (t) {
			e = t;
		}
		if (!this.driverCancelComplete) try {
			await this.options.driver.cancel?.(), this.driverCancelComplete = !0;
		} catch (t) {
			e ??= t;
		}
		if (e) throw e;
		this.cancelComplete = !0, this.unregisterCleanup();
	}
	async close() {
		if (this.closeComplete) return;
		this.closeRequested = !0, this.unacked = void 0, this.coordinator.release(this.coordinatorOwner);
		let e;
		try {
			await this.releaseAllLeases();
		} catch (t) {
			e = t;
		}
		if (!this.driverCloseComplete) try {
			await this.options.driver.close?.(), this.driverCloseComplete = !0;
		} catch (t) {
			e ??= t;
		}
		if (e) throw e;
		this.closeComplete = !0, this.unregisterCleanup();
	}
	async releaseAllLeases() {
		let e;
		for (let t of [...this.leases.keys()]) try {
			await this.release(t);
		} catch (t) {
			e ??= t;
		}
		if (e) throw e;
	}
	validateCommandIdentity(e) {
		if (e.protocol !== "ooxml-pull-v1" || e.sessionId !== this.options.sessionId || e.operationId !== this.options.operationId || e.generation !== this.options.generation || !Number.isSafeInteger(e.requestId) || e.requestId <= 0) throw Error("stale or mismatched pull session command");
	}
	validateHostCredit(e) {
		if (Q(e, "byte credit"), e > this.options.maxByteCredit) throw RangeError("byte credit exceeds host maximum");
	}
	accepted(e, t, n = !1) {
		return {
			kind: "accepted",
			protocol: Z,
			...n ? {
				sessionId: e.sessionId,
				operationId: e.operationId,
				generation: e.generation
			} : this.identity(),
			requestId: e.requestId,
			command: t,
			usage: this.resourceUsage()
		};
	}
	identity() {
		return {
			sessionId: this.options.sessionId,
			operationId: this.options.operationId,
			generation: this.options.generation
		};
	}
	isStaleLifecycle(e) {
		return (e.kind === "cancel" || e.kind === "close") && e.protocol === "ooxml-pull-v1" && Number.isSafeInteger(e.requestId) && e.requestId > 0 && Number.isSafeInteger(e.generation) && e.generation > 0 && e.generation < this.options.generation;
	}
	sameOperationIdentity(e) {
		return e.sessionId === this.options.sessionId && e.operationId === this.options.operationId;
	}
	errorResponse(e, t) {
		return {
			kind: "error",
			protocol: Z,
			sessionId: e.sessionId,
			operationId: e.operationId,
			generation: e.generation,
			requestId: e.requestId,
			error: t,
			usage: this.errorResourceUsage()
		};
	}
	async forceFatalCleanup() {
		this.cancelRequested = !0, this.unacked = void 0, this.coordinator.release(this.coordinatorOwner);
		let e;
		for (let t of [...this.leases.keys()]) try {
			await this.release(t);
		} catch (t) {
			e ??= t;
		}
		if (!this.driverCancelComplete) try {
			await this.options.driver.cancel?.(), this.driverCancelComplete = !0;
		} catch (t) {
			e ??= t;
		}
		if (e) throw e;
		this.unregisterCleanup();
	}
	allocateWireLeaseId() {
		if (!Number.isSafeInteger(this.nextWireLeaseId) || this.nextWireLeaseId <= 0) throw RangeError("wire lease id space exhausted");
		return this.nextWireLeaseId++;
	}
	arrayBufferTransferBytes(e) {
		let t = 0;
		for (let n of e ?? []) if (n instanceof ArrayBuffer && (t += n.byteLength, !Number.isSafeInteger(t))) throw RangeError("ArrayBuffer transfer bytes overflow");
		return t;
	}
	maybeUnregisterCompleted() {
		this.completed && this.leases.size === 0 && this.unregisterCleanup();
	}
	resourceUsage() {
		return this.options.driver.resourceUsage?.();
	}
	errorResourceUsage() {
		try {
			return this.resourceUsage();
		} catch {
			return;
		}
	}
}, Ta = [
	"L",
	"R",
	"AL",
	"EN",
	"ES",
	"ET",
	"AN",
	"CS",
	"NSM",
	"BN",
	"B",
	"S",
	"WS",
	"ON",
	"LRE",
	"LRO",
	"RLE",
	"RLO",
	"PDF",
	"LRI",
	"RLI",
	"FSI",
	"PDI"
], Ea = [
	0,
	9,
	10,
	11,
	12,
	13,
	14,
	28,
	31,
	32,
	33,
	35,
	38,
	43,
	44,
	45,
	46,
	48,
	58,
	59,
	65,
	91,
	97,
	123,
	127,
	133,
	134,
	160,
	161,
	162,
	166,
	170,
	171,
	173,
	174,
	176,
	178,
	180,
	181,
	182,
	185,
	186,
	187,
	192,
	215,
	216,
	247,
	248,
	697,
	699,
	706,
	720,
	722,
	736,
	741,
	750,
	751,
	768,
	880,
	884,
	886,
	894,
	895,
	900,
	902,
	903,
	904,
	1014,
	1015,
	1155,
	1162,
	1418,
	1419,
	1421,
	1423,
	1424,
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
	1536,
	1542,
	1544,
	1545,
	1547,
	1548,
	1549,
	1550,
	1552,
	1563,
	1611,
	1632,
	1642,
	1643,
	1645,
	1648,
	1649,
	1750,
	1757,
	1758,
	1759,
	1765,
	1767,
	1769,
	1770,
	1774,
	1776,
	1786,
	1809,
	1810,
	1840,
	1867,
	1958,
	1969,
	1984,
	2027,
	2036,
	2038,
	2042,
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
	2137,
	2140,
	2144,
	2192,
	2194,
	2199,
	2208,
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
	2546,
	2548,
	2555,
	2556,
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
	2801,
	2802,
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
	3059,
	3065,
	3066,
	3067,
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
	3192,
	3199,
	3201,
	3202,
	3260,
	3261,
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
	3647,
	3648,
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
	3902,
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
	5008,
	5018,
	5120,
	5121,
	5760,
	5761,
	5787,
	5789,
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
	6107,
	6108,
	6109,
	6110,
	6128,
	6138,
	6144,
	6155,
	6158,
	6159,
	6160,
	6277,
	6279,
	6313,
	6314,
	6432,
	6435,
	6439,
	6441,
	6450,
	6451,
	6457,
	6460,
	6464,
	6465,
	6468,
	6470,
	6622,
	6656,
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
	8125,
	8126,
	8127,
	8130,
	8141,
	8144,
	8157,
	8160,
	8173,
	8176,
	8189,
	8191,
	8192,
	8203,
	8206,
	8207,
	8208,
	8232,
	8233,
	8234,
	8235,
	8236,
	8237,
	8238,
	8239,
	8240,
	8245,
	8260,
	8261,
	8287,
	8288,
	8294,
	8295,
	8296,
	8297,
	8298,
	8304,
	8305,
	8308,
	8314,
	8316,
	8319,
	8320,
	8330,
	8332,
	8335,
	8352,
	8400,
	8433,
	8448,
	8450,
	8451,
	8455,
	8456,
	8458,
	8468,
	8469,
	8470,
	8473,
	8478,
	8484,
	8485,
	8486,
	8487,
	8488,
	8489,
	8490,
	8494,
	8495,
	8506,
	8508,
	8512,
	8517,
	8522,
	8526,
	8528,
	8544,
	8585,
	8588,
	8592,
	8722,
	8723,
	8724,
	9014,
	9083,
	9109,
	9110,
	9258,
	9280,
	9291,
	9312,
	9352,
	9372,
	9450,
	9900,
	9901,
	10240,
	10496,
	11124,
	11126,
	11264,
	11493,
	11499,
	11503,
	11506,
	11513,
	11520,
	11647,
	11648,
	11744,
	11776,
	11870,
	11904,
	11930,
	11931,
	12020,
	12032,
	12246,
	12272,
	12288,
	12289,
	12293,
	12296,
	12321,
	12330,
	12334,
	12336,
	12337,
	12342,
	12344,
	12349,
	12352,
	12441,
	12443,
	12445,
	12448,
	12449,
	12539,
	12540,
	12736,
	12774,
	12783,
	12784,
	12829,
	12831,
	12880,
	12896,
	12924,
	12927,
	12977,
	12992,
	13004,
	13008,
	13175,
	13179,
	13278,
	13280,
	13311,
	13312,
	19904,
	19968,
	42128,
	42183,
	42509,
	42512,
	42607,
	42611,
	42612,
	42622,
	42624,
	42654,
	42656,
	42736,
	42738,
	42752,
	42786,
	42888,
	42889,
	43010,
	43011,
	43014,
	43015,
	43019,
	43020,
	43045,
	43047,
	43048,
	43052,
	43053,
	43064,
	43066,
	43124,
	43128,
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
	43882,
	43884,
	44005,
	44006,
	44008,
	44009,
	44013,
	44014,
	64285,
	64286,
	64287,
	64297,
	64298,
	64336,
	64451,
	64467,
	64830,
	64848,
	64912,
	64914,
	64968,
	64976,
	65008,
	65021,
	65024,
	65040,
	65050,
	65056,
	65072,
	65104,
	65105,
	65106,
	65107,
	65108,
	65109,
	65110,
	65119,
	65120,
	65122,
	65124,
	65127,
	65128,
	65129,
	65131,
	65132,
	65136,
	65279,
	65280,
	65281,
	65283,
	65286,
	65291,
	65292,
	65293,
	65294,
	65296,
	65306,
	65307,
	65313,
	65339,
	65345,
	65371,
	65382,
	65504,
	65506,
	65509,
	65511,
	65512,
	65519,
	65520,
	65529,
	65534,
	65536,
	65793,
	65794,
	65856,
	65933,
	65936,
	65949,
	65952,
	65953,
	66045,
	66046,
	66272,
	66273,
	66300,
	66422,
	66427,
	67584,
	67871,
	67872,
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
	68325,
	68327,
	68409,
	68416,
	68864,
	68900,
	68904,
	68912,
	68922,
	68928,
	68938,
	68969,
	68974,
	68975,
	69216,
	69247,
	69291,
	69293,
	69312,
	69328,
	69337,
	69370,
	69376,
	69424,
	69446,
	69457,
	69488,
	69506,
	69510,
	69632,
	69633,
	69634,
	69688,
	69703,
	69714,
	69734,
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
	71264,
	71277,
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
	72199,
	72201,
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
	73685,
	73693,
	73697,
	73714,
	78912,
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
	94178,
	94179,
	94180,
	94181,
	113821,
	113823,
	113824,
	113828,
	117760,
	117974,
	118e3,
	118010,
	118013,
	118016,
	118452,
	118458,
	118481,
	118496,
	118513,
	118528,
	118574,
	118576,
	118599,
	119143,
	119146,
	119155,
	119163,
	119171,
	119173,
	119180,
	119210,
	119214,
	119273,
	119275,
	119296,
	119362,
	119365,
	119366,
	119552,
	119639,
	120513,
	120514,
	120539,
	120540,
	120571,
	120572,
	120597,
	120598,
	120629,
	120630,
	120655,
	120656,
	120687,
	120688,
	120713,
	120714,
	120745,
	120746,
	120771,
	120772,
	120782,
	120832,
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
	123647,
	123648,
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
	124928,
	125136,
	125143,
	125252,
	125259,
	126064,
	126144,
	126208,
	126288,
	126464,
	126704,
	126706,
	126720,
	126976,
	127020,
	127024,
	127124,
	127136,
	127151,
	127153,
	127168,
	127169,
	127184,
	127185,
	127222,
	127232,
	127243,
	127248,
	127279,
	127280,
	127338,
	127344,
	127405,
	127406,
	127584,
	127590,
	127744,
	128729,
	128732,
	128749,
	128752,
	128765,
	128768,
	128986,
	128992,
	129004,
	129008,
	129009,
	129024,
	129036,
	129040,
	129096,
	129104,
	129114,
	129120,
	129160,
	129168,
	129198,
	129200,
	129212,
	129216,
	129218,
	129232,
	129241,
	129280,
	129624,
	129632,
	129646,
	129648,
	129661,
	129664,
	129675,
	129678,
	129735,
	129736,
	129737,
	129741,
	129757,
	129759,
	129771,
	129775,
	129785,
	129792,
	129939,
	129940,
	130032,
	130042,
	130043,
	131070,
	131072,
	196606,
	196608,
	262142,
	262144,
	327678,
	327680,
	393214,
	393216,
	458750,
	458752,
	524286,
	524288,
	589822,
	589824,
	655358,
	655360,
	720894,
	720896,
	786430,
	786432,
	851966,
	851968,
	917502,
	917760,
	918e3,
	921600,
	983038,
	983040,
	1048574,
	1048576,
	1114110
], Da = [
	9,
	11,
	10,
	11,
	12,
	10,
	9,
	10,
	11,
	12,
	13,
	5,
	13,
	4,
	7,
	4,
	7,
	3,
	7,
	13,
	0,
	13,
	0,
	13,
	9,
	10,
	9,
	7,
	13,
	5,
	13,
	0,
	13,
	9,
	13,
	5,
	3,
	13,
	0,
	13,
	3,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	8,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	8,
	0,
	13,
	0,
	13,
	5,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	6,
	13,
	2,
	5,
	2,
	7,
	2,
	13,
	8,
	2,
	8,
	6,
	5,
	6,
	2,
	8,
	2,
	8,
	6,
	13,
	8,
	2,
	8,
	13,
	8,
	2,
	3,
	2,
	8,
	2,
	8,
	2,
	8,
	2,
	1,
	8,
	1,
	13,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	2,
	6,
	2,
	8,
	2,
	8,
	6,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	5,
	0,
	5,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	5,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	5,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	5,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	13,
	0,
	12,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	5,
	0,
	8,
	0,
	13,
	0,
	13,
	8,
	9,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	12,
	9,
	0,
	1,
	13,
	12,
	10,
	14,
	16,
	18,
	15,
	17,
	7,
	5,
	13,
	7,
	13,
	12,
	9,
	19,
	20,
	21,
	22,
	9,
	3,
	0,
	3,
	4,
	13,
	0,
	3,
	4,
	13,
	0,
	5,
	8,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	5,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	4,
	5,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	3,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	8,
	0,
	13,
	0,
	8,
	0,
	8,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	12,
	13,
	0,
	13,
	0,
	8,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	8,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	8,
	13,
	8,
	13,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	8,
	0,
	5,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	1,
	8,
	1,
	4,
	1,
	2,
	13,
	2,
	13,
	2,
	13,
	2,
	13,
	9,
	2,
	13,
	8,
	13,
	0,
	8,
	13,
	7,
	13,
	7,
	0,
	13,
	7,
	13,
	5,
	13,
	4,
	13,
	0,
	13,
	5,
	13,
	0,
	2,
	9,
	0,
	13,
	5,
	13,
	4,
	7,
	4,
	7,
	3,
	7,
	13,
	0,
	13,
	0,
	13,
	0,
	5,
	13,
	5,
	0,
	13,
	0,
	9,
	13,
	9,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	8,
	0,
	8,
	3,
	0,
	8,
	0,
	1,
	13,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	8,
	1,
	13,
	1,
	2,
	8,
	2,
	6,
	2,
	6,
	1,
	8,
	13,
	1,
	6,
	1,
	8,
	1,
	2,
	13,
	2,
	8,
	1,
	2,
	8,
	2,
	1,
	8,
	1,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	5,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	9,
	0,
	13,
	0,
	3,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	9,
	8,
	0,
	8,
	0,
	8,
	0,
	13,
	0,
	13,
	8,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	3,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	5,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	8,
	0,
	1,
	8,
	1,
	8,
	1,
	2,
	1,
	2,
	1,
	2,
	13,
	2,
	1,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	3,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	0,
	13,
	3,
	13,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	0,
	9,
	8,
	9,
	0,
	9,
	0,
	9,
	0,
	9
], Oa = [
	40,
	41,
	41,
	40,
	60,
	62,
	62,
	60,
	91,
	93,
	93,
	91,
	123,
	125,
	125,
	123,
	171,
	187,
	187,
	171,
	3898,
	3899,
	3899,
	3898,
	3900,
	3901,
	3901,
	3900,
	5787,
	5788,
	5788,
	5787,
	8249,
	8250,
	8250,
	8249,
	8261,
	8262,
	8262,
	8261,
	8317,
	8318,
	8318,
	8317,
	8333,
	8334,
	8334,
	8333,
	8712,
	8715,
	8713,
	8716,
	8714,
	8717,
	8715,
	8712,
	8716,
	8713,
	8717,
	8714,
	8725,
	10741,
	8735,
	11262,
	8736,
	10659,
	8737,
	10651,
	8738,
	10656,
	8740,
	10990,
	8764,
	8765,
	8765,
	8764,
	8771,
	8909,
	8773,
	8780,
	8780,
	8773,
	8786,
	8787,
	8787,
	8786,
	8788,
	8789,
	8789,
	8788,
	8804,
	8805,
	8805,
	8804,
	8806,
	8807,
	8807,
	8806,
	8808,
	8809,
	8809,
	8808,
	8810,
	8811,
	8811,
	8810,
	8814,
	8815,
	8815,
	8814,
	8816,
	8817,
	8817,
	8816,
	8818,
	8819,
	8819,
	8818,
	8820,
	8821,
	8821,
	8820,
	8822,
	8823,
	8823,
	8822,
	8824,
	8825,
	8825,
	8824,
	8826,
	8827,
	8827,
	8826,
	8828,
	8829,
	8829,
	8828,
	8830,
	8831,
	8831,
	8830,
	8832,
	8833,
	8833,
	8832,
	8834,
	8835,
	8835,
	8834,
	8836,
	8837,
	8837,
	8836,
	8838,
	8839,
	8839,
	8838,
	8840,
	8841,
	8841,
	8840,
	8842,
	8843,
	8843,
	8842,
	8847,
	8848,
	8848,
	8847,
	8849,
	8850,
	8850,
	8849,
	8856,
	10680,
	8866,
	8867,
	8867,
	8866,
	8870,
	10974,
	8872,
	10980,
	8873,
	10979,
	8875,
	10981,
	8880,
	8881,
	8881,
	8880,
	8882,
	8883,
	8883,
	8882,
	8884,
	8885,
	8885,
	8884,
	8886,
	8887,
	8887,
	8886,
	8888,
	10204,
	8905,
	8906,
	8906,
	8905,
	8907,
	8908,
	8908,
	8907,
	8909,
	8771,
	8912,
	8913,
	8913,
	8912,
	8918,
	8919,
	8919,
	8918,
	8920,
	8921,
	8921,
	8920,
	8922,
	8923,
	8923,
	8922,
	8924,
	8925,
	8925,
	8924,
	8926,
	8927,
	8927,
	8926,
	8928,
	8929,
	8929,
	8928,
	8930,
	8931,
	8931,
	8930,
	8932,
	8933,
	8933,
	8932,
	8934,
	8935,
	8935,
	8934,
	8936,
	8937,
	8937,
	8936,
	8938,
	8939,
	8939,
	8938,
	8940,
	8941,
	8941,
	8940,
	8944,
	8945,
	8945,
	8944,
	8946,
	8954,
	8947,
	8955,
	8948,
	8956,
	8950,
	8957,
	8951,
	8958,
	8954,
	8946,
	8955,
	8947,
	8956,
	8948,
	8957,
	8950,
	8958,
	8951,
	8968,
	8969,
	8969,
	8968,
	8970,
	8971,
	8971,
	8970,
	9001,
	9002,
	9002,
	9001,
	10088,
	10089,
	10089,
	10088,
	10090,
	10091,
	10091,
	10090,
	10092,
	10093,
	10093,
	10092,
	10094,
	10095,
	10095,
	10094,
	10096,
	10097,
	10097,
	10096,
	10098,
	10099,
	10099,
	10098,
	10100,
	10101,
	10101,
	10100,
	10179,
	10180,
	10180,
	10179,
	10181,
	10182,
	10182,
	10181,
	10184,
	10185,
	10185,
	10184,
	10187,
	10189,
	10189,
	10187,
	10197,
	10198,
	10198,
	10197,
	10204,
	8888,
	10205,
	10206,
	10206,
	10205,
	10210,
	10211,
	10211,
	10210,
	10212,
	10213,
	10213,
	10212,
	10214,
	10215,
	10215,
	10214,
	10216,
	10217,
	10217,
	10216,
	10218,
	10219,
	10219,
	10218,
	10220,
	10221,
	10221,
	10220,
	10222,
	10223,
	10223,
	10222,
	10627,
	10628,
	10628,
	10627,
	10629,
	10630,
	10630,
	10629,
	10631,
	10632,
	10632,
	10631,
	10633,
	10634,
	10634,
	10633,
	10635,
	10636,
	10636,
	10635,
	10637,
	10640,
	10638,
	10639,
	10639,
	10638,
	10640,
	10637,
	10641,
	10642,
	10642,
	10641,
	10643,
	10644,
	10644,
	10643,
	10645,
	10646,
	10646,
	10645,
	10647,
	10648,
	10648,
	10647,
	10651,
	8737,
	10656,
	8738,
	10659,
	8736,
	10660,
	10661,
	10661,
	10660,
	10664,
	10665,
	10665,
	10664,
	10666,
	10667,
	10667,
	10666,
	10668,
	10669,
	10669,
	10668,
	10670,
	10671,
	10671,
	10670,
	10680,
	8856,
	10688,
	10689,
	10689,
	10688,
	10692,
	10693,
	10693,
	10692,
	10703,
	10704,
	10704,
	10703,
	10705,
	10706,
	10706,
	10705,
	10708,
	10709,
	10709,
	10708,
	10712,
	10713,
	10713,
	10712,
	10714,
	10715,
	10715,
	10714,
	10728,
	10729,
	10729,
	10728,
	10741,
	8725,
	10744,
	10745,
	10745,
	10744,
	10748,
	10749,
	10749,
	10748,
	10795,
	10796,
	10796,
	10795,
	10797,
	10798,
	10798,
	10797,
	10804,
	10805,
	10805,
	10804,
	10812,
	10813,
	10813,
	10812,
	10852,
	10853,
	10853,
	10852,
	10873,
	10874,
	10874,
	10873,
	10875,
	10876,
	10876,
	10875,
	10877,
	10878,
	10878,
	10877,
	10879,
	10880,
	10880,
	10879,
	10881,
	10882,
	10882,
	10881,
	10883,
	10884,
	10884,
	10883,
	10885,
	10886,
	10886,
	10885,
	10887,
	10888,
	10888,
	10887,
	10889,
	10890,
	10890,
	10889,
	10891,
	10892,
	10892,
	10891,
	10893,
	10894,
	10894,
	10893,
	10895,
	10896,
	10896,
	10895,
	10897,
	10898,
	10898,
	10897,
	10899,
	10900,
	10900,
	10899,
	10901,
	10902,
	10902,
	10901,
	10903,
	10904,
	10904,
	10903,
	10905,
	10906,
	10906,
	10905,
	10907,
	10908,
	10908,
	10907,
	10909,
	10910,
	10910,
	10909,
	10911,
	10912,
	10912,
	10911,
	10913,
	10914,
	10914,
	10913,
	10918,
	10919,
	10919,
	10918,
	10920,
	10921,
	10921,
	10920,
	10922,
	10923,
	10923,
	10922,
	10924,
	10925,
	10925,
	10924,
	10927,
	10928,
	10928,
	10927,
	10929,
	10930,
	10930,
	10929,
	10931,
	10932,
	10932,
	10931,
	10933,
	10934,
	10934,
	10933,
	10935,
	10936,
	10936,
	10935,
	10937,
	10938,
	10938,
	10937,
	10939,
	10940,
	10940,
	10939,
	10941,
	10942,
	10942,
	10941,
	10943,
	10944,
	10944,
	10943,
	10945,
	10946,
	10946,
	10945,
	10947,
	10948,
	10948,
	10947,
	10949,
	10950,
	10950,
	10949,
	10951,
	10952,
	10952,
	10951,
	10953,
	10954,
	10954,
	10953,
	10955,
	10956,
	10956,
	10955,
	10957,
	10958,
	10958,
	10957,
	10959,
	10960,
	10960,
	10959,
	10961,
	10962,
	10962,
	10961,
	10963,
	10964,
	10964,
	10963,
	10965,
	10966,
	10966,
	10965,
	10974,
	8870,
	10979,
	8873,
	10980,
	8872,
	10981,
	8875,
	10988,
	10989,
	10989,
	10988,
	10990,
	8740,
	10999,
	11e3,
	11e3,
	10999,
	11001,
	11002,
	11002,
	11001,
	11262,
	8735,
	11778,
	11779,
	11779,
	11778,
	11780,
	11781,
	11781,
	11780,
	11785,
	11786,
	11786,
	11785,
	11788,
	11789,
	11789,
	11788,
	11804,
	11805,
	11805,
	11804,
	11808,
	11809,
	11809,
	11808,
	11810,
	11811,
	11811,
	11810,
	11812,
	11813,
	11813,
	11812,
	11814,
	11815,
	11815,
	11814,
	11816,
	11817,
	11817,
	11816,
	11861,
	11862,
	11862,
	11861,
	11863,
	11864,
	11864,
	11863,
	11865,
	11866,
	11866,
	11865,
	11867,
	11868,
	11868,
	11867,
	12296,
	12297,
	12297,
	12296,
	12298,
	12299,
	12299,
	12298,
	12300,
	12301,
	12301,
	12300,
	12302,
	12303,
	12303,
	12302,
	12304,
	12305,
	12305,
	12304,
	12308,
	12309,
	12309,
	12308,
	12310,
	12311,
	12311,
	12310,
	12312,
	12313,
	12313,
	12312,
	12314,
	12315,
	12315,
	12314,
	65113,
	65114,
	65114,
	65113,
	65115,
	65116,
	65116,
	65115,
	65117,
	65118,
	65118,
	65117,
	65124,
	65125,
	65125,
	65124,
	65288,
	65289,
	65289,
	65288,
	65308,
	65310,
	65310,
	65308,
	65339,
	65341,
	65341,
	65339,
	65371,
	65373,
	65373,
	65371,
	65375,
	65376,
	65376,
	65375,
	65378,
	65379,
	65379,
	65378
], ka = [
	40,
	41,
	0,
	41,
	40,
	1,
	91,
	93,
	0,
	93,
	91,
	1,
	123,
	125,
	0,
	125,
	123,
	1,
	3898,
	3899,
	0,
	3899,
	3898,
	1,
	3900,
	3901,
	0,
	3901,
	3900,
	1,
	5787,
	5788,
	0,
	5788,
	5787,
	1,
	8261,
	8262,
	0,
	8262,
	8261,
	1,
	8317,
	8318,
	0,
	8318,
	8317,
	1,
	8333,
	8334,
	0,
	8334,
	8333,
	1,
	8968,
	8969,
	0,
	8969,
	8968,
	1,
	8970,
	8971,
	0,
	8971,
	8970,
	1,
	9001,
	9002,
	0,
	9002,
	9001,
	1,
	10088,
	10089,
	0,
	10089,
	10088,
	1,
	10090,
	10091,
	0,
	10091,
	10090,
	1,
	10092,
	10093,
	0,
	10093,
	10092,
	1,
	10094,
	10095,
	0,
	10095,
	10094,
	1,
	10096,
	10097,
	0,
	10097,
	10096,
	1,
	10098,
	10099,
	0,
	10099,
	10098,
	1,
	10100,
	10101,
	0,
	10101,
	10100,
	1,
	10181,
	10182,
	0,
	10182,
	10181,
	1,
	10214,
	10215,
	0,
	10215,
	10214,
	1,
	10216,
	10217,
	0,
	10217,
	10216,
	1,
	10218,
	10219,
	0,
	10219,
	10218,
	1,
	10220,
	10221,
	0,
	10221,
	10220,
	1,
	10222,
	10223,
	0,
	10223,
	10222,
	1,
	10627,
	10628,
	0,
	10628,
	10627,
	1,
	10629,
	10630,
	0,
	10630,
	10629,
	1,
	10631,
	10632,
	0,
	10632,
	10631,
	1,
	10633,
	10634,
	0,
	10634,
	10633,
	1,
	10635,
	10636,
	0,
	10636,
	10635,
	1,
	10637,
	10640,
	0,
	10638,
	10639,
	1,
	10639,
	10638,
	0,
	10640,
	10637,
	1,
	10641,
	10642,
	0,
	10642,
	10641,
	1,
	10643,
	10644,
	0,
	10644,
	10643,
	1,
	10645,
	10646,
	0,
	10646,
	10645,
	1,
	10647,
	10648,
	0,
	10648,
	10647,
	1,
	10712,
	10713,
	0,
	10713,
	10712,
	1,
	10714,
	10715,
	0,
	10715,
	10714,
	1,
	10748,
	10749,
	0,
	10749,
	10748,
	1,
	11810,
	11811,
	0,
	11811,
	11810,
	1,
	11812,
	11813,
	0,
	11813,
	11812,
	1,
	11814,
	11815,
	0,
	11815,
	11814,
	1,
	11816,
	11817,
	0,
	11817,
	11816,
	1,
	11861,
	11862,
	0,
	11862,
	11861,
	1,
	11863,
	11864,
	0,
	11864,
	11863,
	1,
	11865,
	11866,
	0,
	11866,
	11865,
	1,
	11867,
	11868,
	0,
	11868,
	11867,
	1,
	12296,
	12297,
	0,
	12297,
	12296,
	1,
	12298,
	12299,
	0,
	12299,
	12298,
	1,
	12300,
	12301,
	0,
	12301,
	12300,
	1,
	12302,
	12303,
	0,
	12303,
	12302,
	1,
	12304,
	12305,
	0,
	12305,
	12304,
	1,
	12308,
	12309,
	0,
	12309,
	12308,
	1,
	12310,
	12311,
	0,
	12311,
	12310,
	1,
	12312,
	12313,
	0,
	12313,
	12312,
	1,
	12314,
	12315,
	0,
	12315,
	12314,
	1,
	65113,
	65114,
	0,
	65114,
	65113,
	1,
	65115,
	65116,
	0,
	65116,
	65115,
	1,
	65117,
	65118,
	0,
	65118,
	65117,
	1,
	65288,
	65289,
	0,
	65289,
	65288,
	1,
	65339,
	65341,
	0,
	65341,
	65339,
	1,
	65371,
	65373,
	0,
	65373,
	65371,
	1,
	65375,
	65376,
	0,
	65376,
	65375,
	1,
	65378,
	65379,
	0,
	65379,
	65378,
	1
];
//#endregion
//#region packages/core/src/text/bidi/char-data.ts
function Aa(e) {
	let t = 0, n = Ea.length - 1;
	for (; t < n;) {
		let r = t + n + 1 >> 1;
		Ea[r] <= e ? t = r : n = r - 1;
	}
	return Da[t];
}
function ja(e) {
	return Ta[Aa(e)];
}
var Ma = (() => {
	let e = /* @__PURE__ */ new Map();
	for (let t = 0; t < Oa.length; t += 2) e.set(Oa[t], Oa[t + 1]);
	return e;
})();
function Na(e) {
	return Ma.get(e) ?? null;
}
var Pa = (() => {
	let e = /* @__PURE__ */ new Map();
	for (let t = 0; t < ka.length; t += 3) e.set(ka[t], {
		pair: ka[t + 1],
		type: ka[t + 2] === 0 ? "o" : "c"
	});
	return e;
})();
function Fa(e) {
	return Pa.get(e) ?? null;
}
var Ia = (e) => e === "RLE" || e === "LRE" || e === "RLO" || e === "LRO" || e === "PDF" || e === "BN", La = (e) => e === "LRI" || e === "RLI" || e === "FSI", Ra = (e) => e === "B" || e === "S" || e === "WS" || e === "ON" || e === "FSI" || e === "LRI" || e === "RLI" || e === "PDI", za = (e) => e & 1 ? e + 2 : e + 1, Ba = (e) => e & 1 ? e + 1 : e + 2;
function Va(e, t, n) {
	let r = 0;
	for (let i = t; i < n; i++) {
		let t = e[i];
		if (La(t)) r++;
		else if (t === "PDI") r > 0 && r--;
		else if (r === 0) {
			if (t === "L") return 0;
			if (t === "R" || t === "AL") return 1;
		}
	}
	return 0;
}
function Ha(e) {
	let t = e.length, n = new Int32Array(t).fill(t), r = new Int32Array(t).fill(-1), i = [];
	for (let a = 0; a < t; a++) {
		let t = e[a];
		if (La(t)) i.push(a);
		else if (t === "PDI" && i.length) {
			let e = i.pop();
			n[e] = a, r[a] = e;
		}
	}
	return {
		pdiOf: n,
		initOf: r
	};
}
function Ua(e, t, n) {
	let r = e.length, i = Array(r).fill(t), a = e.slice(), o = [{
		level: t,
		override: "neutral",
		isolate: !1
	}], s = 0, c = 0, l = 0, u = () => o[o.length - 1];
	for (let d = 0; d < r; d++) {
		let r = e[d];
		switch (r) {
			case "RLE":
			case "LRE":
			case "RLO":
			case "LRO": {
				i[d] = u().level;
				let e = r === "RLE" || r === "RLO" ? za(u().level) : Ba(u().level);
				e <= 125 && s === 0 && c === 0 ? o.push({
					level: e,
					override: r === "RLO" ? "R" : r === "LRO" ? "L" : "neutral",
					isolate: !1
				}) : s === 0 && c++;
				break;
			}
			case "RLI":
			case "LRI":
			case "FSI": {
				i[d] = u().level;
				let t = u().override;
				t !== "neutral" && (a[d] = t);
				let f;
				f = r === "RLI" ? "R" : r === "LRI" ? "L" : Va(e, d + 1, n[d]) === 1 ? "R" : "L";
				let p = f === "R" ? za(u().level) : Ba(u().level);
				p <= 125 && s === 0 && c === 0 ? (l++, o.push({
					level: p,
					override: "neutral",
					isolate: !0
				})) : s++;
				break;
			}
			case "PDI":
				if (s > 0) s--;
				else if (l > 0) {
					for (c = 0; !u().isolate;) o.pop();
					o.pop(), l--;
				}
				{
					i[d] = u().level;
					let e = u().override;
					e !== "neutral" && (a[d] = e);
				}
				break;
			case "PDF":
				i[d] = u().level, s > 0 || (c > 0 ? c-- : !u().isolate && o.length >= 2 && o.pop());
				break;
			case "B":
				o.length = 1, s = 0, c = 0, l = 0, i[d] = t;
				break;
			case "BN":
				i[d] = u().level;
				break;
			default: {
				i[d] = u().level;
				let e = u().override;
				e !== "neutral" && (a[d] = e);
				break;
			}
		}
	}
	return {
		levels: i,
		types: a
	};
}
function Wa(e) {
	return e === 9001 ? 12296 : e === 9002 ? 12297 : e;
}
function Ga(e, t, n, r, i, a) {
	let o = e.length, s = [];
	for (let e = 0; e < o; e++) n[e] || s.push(e);
	let c = [];
	for (let e = 0; e < s.length; e++) {
		let n = s[e];
		e === 0 || t[n] !== t[s[e - 1]] ? c.push([n]) : c[c.length - 1].push(n);
	}
	let l = /* @__PURE__ */ new Map();
	for (let e of c) l.set(e[0], e);
	let u = (e) => e & 1 ? "R" : "L", d = [];
	for (let s of c) {
		let c = s[0];
		if (e[c] === "PDI" && a[c] !== -1) continue;
		let f = [], p = s;
		for (;;) {
			for (let e of p) f.push(e);
			let t = p[p.length - 1];
			if (La(e[t]) && i[t] !== o) {
				let e = l.get(i[t]);
				if (e) {
					p = e;
					continue;
				}
			}
			break;
		}
		let m = t[f[0]], h = r;
		for (let e = f[0] - 1; e >= 0; e--) if (!n[e]) {
			h = t[e];
			break;
		}
		let g = u(Math.max(m, h)), _ = f[f.length - 1], v = r;
		if (!(La(e[_]) && i[_] === o)) {
			for (let e = _ + 1; e < o; e++) if (!n[e]) {
				v = t[e];
				break;
			}
		}
		let y = u(Math.max(m, v));
		d.push({
			indices: f,
			level: m,
			sos: g,
			eos: y
		});
	}
	return d;
}
var Ka = (e) => e === "L" ? "L" : e === "R" || e === "EN" || e === "AN" ? "R" : null;
function qa(e, t, n, r, i) {
	let a = e.indices, o = a.length, { sos: s, eos: c, level: l } = e;
	for (let e = 0; e < o; e++) {
		let t = a[e];
		if (r[t] === "NSM") if (e === 0) r[t] = s;
		else {
			let n = r[a[e - 1]];
			r[t] = n === "LRI" || n === "RLI" || n === "FSI" || n === "PDI" ? "ON" : n;
		}
	}
	{
		let e = s;
		for (let t = 0; t < o; t++) {
			let n = r[a[t]];
			n === "R" || n === "L" || n === "AL" ? e = n : n === "EN" && e === "AL" && (r[a[t]] = "AN");
		}
	}
	for (let e = 0; e < o; e++) r[a[e]] === "AL" && (r[a[e]] = "R");
	for (let e = 1; e < o - 1; e++) {
		let t = r[a[e]], n = r[a[e - 1]], i = r[a[e + 1]];
		t === "ES" && n === "EN" && i === "EN" || t === "CS" && n === "EN" && i === "EN" ? r[a[e]] = "EN" : t === "CS" && n === "AN" && i === "AN" && (r[a[e]] = "AN");
	}
	for (let e = 0; e < o; e++) {
		if (r[a[e]] !== "ET") continue;
		let t = e;
		for (; t < o && r[a[t]] === "ET";) t++;
		let n = e > 0 ? r[a[e - 1]] : s, i = t < o ? r[a[t]] : c;
		if (n === "EN" || i === "EN") for (let n = e; n < t; n++) r[a[n]] = "EN";
		e = t - 1;
	}
	for (let e = 0; e < o; e++) {
		let t = r[a[e]];
		(t === "ES" || t === "ET" || t === "CS") && (r[a[e]] = "ON");
	}
	{
		let e = s;
		for (let t = 0; t < o; t++) {
			let n = r[a[t]];
			n === "R" || n === "L" ? e = n : n === "EN" && e === "L" && (r[a[t]] = "L");
		}
	}
	let u = l & 1 ? "R" : "L", d = u === "R" ? "L" : "R", f = [];
	{
		let e = [];
		outer: for (let n = 0; n < o; n++) {
			let i = a[n];
			if (r[i] !== "ON") continue;
			let o = Fa(t[i]);
			if (o) if (o.type === "o") {
				if (e.length === 63) break outer;
				e.push({
					expect: Wa(o.pair),
					pos: n
				});
			} else {
				let r = Wa(t[i]);
				for (let t = e.length - 1; t >= 0; t--) if (e[t].expect === r) {
					f.push({
						open: e[t].pos,
						close: n
					}), e.length = t;
					break;
				}
			}
		}
		f.sort((e, t) => e.open - t.open);
	}
	let p = (e, t) => {
		for (let i = e + 1; i < o && n[a[i]] === "NSM"; i++) r[a[i]] = t;
	};
	for (let { open: e, close: t } of f) {
		let n = !1, i = !1;
		for (let o = e + 1; o < t; o++) {
			let e = Ka(r[a[o]]);
			e === u ? n = !0 : e === d && (i = !0);
		}
		let o = null;
		if (n) o = u;
		else if (i) {
			let t = s;
			for (let n = e - 1; n >= 0; n--) {
				let e = Ka(r[a[n]]);
				if (e) {
					t = e;
					break;
				}
			}
			o = t === d ? d : u;
		}
		o && (r[a[e]] = o, r[a[t]] = o, p(e, o), p(t, o));
	}
	for (let e = 0; e < o; e++) {
		if (!Ra(r[a[e]])) continue;
		let t = e;
		for (; t < o && Ra(r[a[t]]);) t++;
		let n = e > 0 ? Ka(r[a[e - 1]]) : s, i = t < o ? Ka(r[a[t]]) : c;
		if (n && i && n === i) for (let i = e; i < t; i++) r[a[i]] = n;
		e = t - 1;
	}
	for (let e = 0; e < o; e++) Ra(r[a[e]]) && (r[a[e]] = u);
	for (let e = 0; e < o; e++) {
		let t = a[e], n = r[t];
		l & 1 ? (n === "L" || n === "EN" || n === "AN") && (i[t] += 1) : n === "R" ? i[t] += 1 : (n === "AN" || n === "EN") && (i[t] += 2);
	}
}
function Ja(e, t, n) {
	let r = e.length, i = Array(r);
	for (let t = 0; t < r; t++) i[t] = n?.[t] ?? ja(e[t]);
	let a = t === "rtl" ? 1 : t === "ltr" ? 0 : Va(i, 0, r), { pdiOf: o, initOf: s } = Ha(i), { levels: c, types: l } = Ua(i, a, o), u = Array(r);
	for (let e = 0; e < r; e++) u[e] = Ia(i[e]);
	let d = Ga(i, c, u, a, o, s), f = l.slice();
	for (let t of d) qa(t, e, i, f, c);
	let p = (e) => {
		let t = i[e];
		return t === "WS" || La(t) || t === "PDI" || u[e];
	};
	for (let e = 0; e < r; e++) {
		let t = i[e];
		if (t === "B" || t === "S") {
			c[e] = a;
			for (let t = e - 1; t >= 0 && p(t); t--) u[t] || (c[t] = a);
		}
	}
	for (let e = r - 1; e >= 0 && p(e); e--) u[e] || (c[e] = a);
	for (let e = 0; e < r; e++) u[e] && (c[e] = -1);
	return {
		levels: c,
		paragraphLevel: a
	};
}
function Ya(e, t, n) {
	let r = [];
	for (let i = t; i < n; i++) {
		let t = e[i];
		t >= 0 && t <= 126 && r.push(i);
	}
	if (r.length === 0) return r;
	let i = 0, a = 127;
	for (let t of r) {
		let n = e[t];
		n > i && (i = n), n & 1 && n < a && (a = n);
	}
	for (let t = i; t >= a; t--) {
		let n = 0;
		for (; n < r.length;) if (e[r[n]] >= t) {
			let i = n + 1;
			for (; i < r.length && e[r[i]] >= t;) i++;
			for (let e = n, t = i - 1; e < t; e++, t--) {
				let n = r[e];
				r[e] = r[t], r[t] = n;
			}
			n = i;
		} else n++;
	}
	return r;
}
//#endregion
//#region packages/core/src/text/bidi/uax9/index.ts
function Xa(e) {
	let t = [], n = [], r = [];
	for (let i = 0; i < e.length;) {
		let a = e.codePointAt(i), o = a > 65535 ? 2 : 1;
		t.push(a), n.push(o), r.push(i), i += o;
	}
	return {
		cps: t,
		units: n,
		starts: r
	};
}
var Za = class {
	computeLevels(e, t, n) {
		let { cps: r, units: i, starts: a } = Xa(e), { levels: o, paragraphLevel: s } = Ja(r, t, n ? r.map((e, t) => n[a[t]] ?? null) : void 0), c = new Uint8Array(e.length), l = 0;
		for (let e = 0; e < o.length; e++) {
			let t = o[e] === -1 ? 255 : o[e];
			for (let n = 0; n < i[e]; n++) c[l++] = t;
		}
		return {
			levels: c,
			paragraphLevel: s
		};
	}
	reorderVisual(e, t, n) {
		return Ya(e, t, n);
	}
	getMirror(e) {
		return Na(e);
	}
};
function Qa() {
	return new Za();
}
//#endregion
//#region packages/core/src/text/bidi/engine.ts
var $a = null;
function eo() {
	return $a === null && ($a = Qa()), $a;
}
//#endregion
//#region packages/core/src/text/bidi/line-order.ts
var to = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u200F\u202B\u202E\u2067]|[\u{10800}-\u{10FFF}\u{1E800}-\u{1EFFF}]/u;
function no(e) {
	return to.test(e);
}
function ro(e, t, n) {
	let r = n.length, i = new Uint8Array(r);
	for (let a = 0; a < r; a++) {
		let r = e[n[a]];
		i[a] = r === 255 ? t : r;
	}
	return {
		order: eo().reorderVisual(i, 0, r),
		segLevels: i
	};
}
//#endregion
//#region packages/core/src/text/kinsoku/rules.ts
var io = "”’）〕］｝〉》」』】〙〗〟｠»、。，．・：；／？！‐ー゠–〜～ぁぃぅぇぉっゃゅょゎゕゖァィゥェォッャュョヮヵヶㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻ゝゞヽヾ゛゜％‰℃°′″｡｣､･ｰﾞﾟ!),.:;?]}｠", ao = "“‘（〔［｛〈《「『【〘〖〝｟«＄￥＃￡￠([{｟";
function oo(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) t.add(n.codePointAt(0));
	return t;
}
function so(e) {
	return {
		enabled: e?.kinsoku !== !1,
		lineStartForbidden: oo(e?.noLineBreaksBefore ?? io),
		lineEndForbidden: oo(e?.noLineBreaksAfter ?? ao)
	};
}
var co = so();
//#endregion
//#region packages/core/src/text/kinsoku/split.ts
function lo(e, t, n, r = 1) {
	if (!n.enabled || t <= 0 || t >= e.length) return t;
	let i = (t) => t < e.length && n.lineStartForbidden.has(e[t].codePointAt(0)), a = (t) => t >= 0 && n.lineEndForbidden.has(e[t].codePointAt(0)), o = t;
	for (; o > r && (i(o) || a(o - 1));) o--;
	return o <= r && (i(o) || a(o - 1)) ? t : o;
}
function uo(e, t, n) {
	if (!t.enabled) return 0;
	let r = e.length - n;
	for (let n = 1; n <= r; n++) {
		let r = e[e.length - n];
		if (/\s/.test(r) || t.lineStartForbidden.has(r.codePointAt(0))) continue;
		let i = e[e.length - n - 1];
		if (!(i && t.lineEndForbidden.has(i.codePointAt(0)))) return n;
	}
	return 0;
}
//#endregion
//#region packages/core/src/text/cjk-ranges.ts
function fo(e) {
	return e >= 12288 && e <= 40959 || e >= 44032 && e <= 55203 || e >= 63744 && e <= 64255 || e >= 65280 && e <= 65519;
}
function po(e) {
	return e === 32 || e === 9 || e === 10 || e === 13 ? !1 : !fo(e);
}
//#endregion
//#region packages/core/src/text/line-break-class.generated.ts
var mo = /* @__PURE__ */ "BK.CM.CR.GL.LF.NL.SP.WJ.ZW.ZWJ.AK.AL.AP.AS.B2.BA.BB.CB.CL.CP.EB.EM.EX.H2.H3.HL.HH.HY.ID.IN.IS.JL.JT.JV.NS.NU.OP.PO.PR.QU.RI.SY.VF.VI".split("."), ho = [
	0,
	9,
	10,
	11,
	13,
	14,
	32,
	33,
	34,
	35,
	36,
	37,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	46,
	47,
	48,
	58,
	60,
	63,
	64,
	91,
	92,
	93,
	94,
	123,
	124,
	125,
	126,
	127,
	133,
	134,
	160,
	161,
	162,
	163,
	166,
	171,
	172,
	173,
	174,
	176,
	177,
	178,
	180,
	181,
	187,
	188,
	191,
	192,
	712,
	713,
	716,
	717,
	735,
	736,
	768,
	860,
	867,
	880,
	894,
	895,
	1155,
	1162,
	1417,
	1418,
	1419,
	1423,
	1424,
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
	1488,
	1515,
	1519,
	1523,
	1536,
	1542,
	1545,
	1548,
	1550,
	1552,
	1563,
	1564,
	1565,
	1568,
	1611,
	1632,
	1642,
	1643,
	1645,
	1648,
	1649,
	1748,
	1749,
	1750,
	1757,
	1758,
	1759,
	1765,
	1767,
	1769,
	1770,
	1774,
	1776,
	1786,
	1809,
	1810,
	1840,
	1867,
	1958,
	1969,
	1984,
	1994,
	2027,
	2036,
	2040,
	2041,
	2042,
	2045,
	2046,
	2048,
	2070,
	2074,
	2075,
	2084,
	2085,
	2088,
	2089,
	2094,
	2137,
	2140,
	2192,
	2194,
	2199,
	2208,
	2250,
	2274,
	2275,
	2308,
	2362,
	2365,
	2366,
	2384,
	2385,
	2392,
	2402,
	2404,
	2406,
	2416,
	2433,
	2436,
	2492,
	2493,
	2494,
	2501,
	2503,
	2505,
	2507,
	2510,
	2519,
	2520,
	2530,
	2532,
	2534,
	2544,
	2546,
	2548,
	2553,
	2554,
	2555,
	2556,
	2558,
	2559,
	2561,
	2564,
	2620,
	2621,
	2622,
	2627,
	2631,
	2633,
	2635,
	2638,
	2641,
	2642,
	2662,
	2672,
	2674,
	2677,
	2678,
	2689,
	2692,
	2748,
	2749,
	2750,
	2758,
	2759,
	2762,
	2763,
	2766,
	2786,
	2788,
	2790,
	2800,
	2801,
	2802,
	2810,
	2816,
	2817,
	2820,
	2876,
	2877,
	2878,
	2885,
	2887,
	2889,
	2891,
	2894,
	2901,
	2904,
	2914,
	2916,
	2918,
	2928,
	2946,
	2947,
	3006,
	3011,
	3014,
	3017,
	3018,
	3022,
	3031,
	3032,
	3046,
	3056,
	3065,
	3066,
	3072,
	3077,
	3132,
	3133,
	3134,
	3141,
	3142,
	3145,
	3146,
	3150,
	3157,
	3159,
	3170,
	3172,
	3174,
	3184,
	3191,
	3192,
	3201,
	3204,
	3205,
	3260,
	3261,
	3262,
	3269,
	3270,
	3273,
	3274,
	3278,
	3285,
	3287,
	3298,
	3300,
	3302,
	3312,
	3315,
	3316,
	3328,
	3332,
	3387,
	3389,
	3390,
	3397,
	3398,
	3401,
	3402,
	3406,
	3415,
	3416,
	3426,
	3428,
	3430,
	3440,
	3449,
	3450,
	3457,
	3460,
	3530,
	3531,
	3535,
	3541,
	3542,
	3543,
	3544,
	3552,
	3558,
	3568,
	3570,
	3572,
	3633,
	3634,
	3636,
	3643,
	3647,
	3648,
	3655,
	3663,
	3664,
	3674,
	3676,
	3761,
	3762,
	3764,
	3773,
	3784,
	3791,
	3792,
	3802,
	3841,
	3845,
	3846,
	3848,
	3849,
	3851,
	3852,
	3853,
	3858,
	3859,
	3860,
	3861,
	3864,
	3866,
	3872,
	3882,
	3892,
	3893,
	3894,
	3895,
	3896,
	3897,
	3898,
	3899,
	3900,
	3901,
	3902,
	3904,
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
	4030,
	4032,
	4038,
	4039,
	4048,
	4050,
	4051,
	4052,
	4057,
	4059,
	4139,
	4159,
	4160,
	4170,
	4172,
	4182,
	4186,
	4190,
	4193,
	4194,
	4197,
	4199,
	4206,
	4209,
	4213,
	4226,
	4238,
	4239,
	4240,
	4250,
	4254,
	4352,
	4448,
	4520,
	4608,
	4957,
	4960,
	4961,
	4962,
	5120,
	5121,
	5760,
	5761,
	5787,
	5788,
	5789,
	5867,
	5870,
	5906,
	5910,
	5938,
	5941,
	5943,
	5970,
	5972,
	6002,
	6004,
	6068,
	6100,
	6102,
	6103,
	6104,
	6105,
	6106,
	6107,
	6108,
	6109,
	6110,
	6112,
	6122,
	6146,
	6148,
	6150,
	6151,
	6152,
	6154,
	6155,
	6158,
	6159,
	6160,
	6170,
	6277,
	6279,
	6313,
	6314,
	6432,
	6444,
	6448,
	6460,
	6468,
	6470,
	6480,
	6608,
	6619,
	6679,
	6684,
	6741,
	6751,
	6752,
	6781,
	6783,
	6784,
	6794,
	6800,
	6810,
	6832,
	6878,
	6880,
	6891,
	6892,
	6912,
	6917,
	6964,
	6980,
	6981,
	6989,
	6990,
	6992,
	7002,
	7004,
	7005,
	7009,
	7019,
	7028,
	7037,
	7040,
	7043,
	7073,
	7086,
	7088,
	7098,
	7104,
	7142,
	7154,
	7156,
	7204,
	7224,
	7227,
	7232,
	7242,
	7248,
	7258,
	7294,
	7296,
	7376,
	7379,
	7380,
	7401,
	7405,
	7406,
	7412,
	7413,
	7415,
	7418,
	7616,
	7629,
	7630,
	7676,
	7677,
	7680,
	8189,
	8190,
	8192,
	8199,
	8200,
	8203,
	8204,
	8205,
	8206,
	8208,
	8209,
	8210,
	8212,
	8213,
	8216,
	8218,
	8219,
	8222,
	8223,
	8224,
	8228,
	8231,
	8232,
	8234,
	8239,
	8240,
	8248,
	8249,
	8251,
	8252,
	8254,
	8260,
	8261,
	8262,
	8263,
	8266,
	8278,
	8279,
	8280,
	8284,
	8285,
	8288,
	8289,
	8294,
	8304,
	8317,
	8318,
	8319,
	8333,
	8334,
	8335,
	8352,
	8359,
	8360,
	8374,
	8375,
	8379,
	8380,
	8382,
	8383,
	8384,
	8385,
	8400,
	8433,
	8451,
	8452,
	8457,
	8458,
	8470,
	8471,
	8722,
	8724,
	8943,
	8944,
	8968,
	8969,
	8970,
	8971,
	8972,
	8986,
	8988,
	9001,
	9002,
	9003,
	9200,
	9204,
	9728,
	9732,
	9748,
	9750,
	9752,
	9753,
	9754,
	9757,
	9758,
	9760,
	9785,
	9788,
	9832,
	9833,
	9855,
	9856,
	9917,
	9929,
	9933,
	9934,
	9935,
	9938,
	9939,
	9941,
	9944,
	9946,
	9948,
	9949,
	9951,
	9954,
	9962,
	9963,
	9969,
	9974,
	9975,
	9977,
	9978,
	9979,
	9981,
	9989,
	9992,
	9994,
	9998,
	10075,
	10081,
	10082,
	10084,
	10085,
	10088,
	10089,
	10090,
	10091,
	10092,
	10093,
	10094,
	10095,
	10096,
	10097,
	10098,
	10099,
	10100,
	10101,
	10102,
	10181,
	10182,
	10183,
	10214,
	10215,
	10216,
	10217,
	10218,
	10219,
	10220,
	10221,
	10222,
	10223,
	10224,
	10240,
	10241,
	10627,
	10628,
	10629,
	10630,
	10631,
	10632,
	10633,
	10634,
	10635,
	10636,
	10637,
	10638,
	10639,
	10640,
	10641,
	10642,
	10643,
	10644,
	10645,
	10646,
	10647,
	10648,
	10649,
	10712,
	10713,
	10714,
	10715,
	10716,
	10748,
	10749,
	10750,
	11503,
	11506,
	11513,
	11514,
	11517,
	11518,
	11519,
	11520,
	11632,
	11633,
	11647,
	11648,
	11744,
	11776,
	11790,
	11798,
	11799,
	11800,
	11801,
	11802,
	11804,
	11806,
	11808,
	11810,
	11811,
	11812,
	11813,
	11814,
	11815,
	11816,
	11817,
	11818,
	11822,
	11823,
	11824,
	11826,
	11827,
	11829,
	11834,
	11836,
	11839,
	11840,
	11841,
	11842,
	11843,
	11851,
	11852,
	11853,
	11854,
	11856,
	11859,
	11861,
	11862,
	11863,
	11864,
	11865,
	11866,
	11867,
	11868,
	11869,
	11870,
	11904,
	11930,
	11931,
	12020,
	12032,
	12246,
	12272,
	12288,
	12289,
	12291,
	12293,
	12294,
	12296,
	12297,
	12298,
	12299,
	12300,
	12301,
	12302,
	12303,
	12304,
	12305,
	12306,
	12308,
	12309,
	12310,
	12311,
	12312,
	12313,
	12314,
	12315,
	12316,
	12317,
	12318,
	12320,
	12330,
	12336,
	12341,
	12342,
	12347,
	12349,
	12352,
	12353,
	12354,
	12355,
	12356,
	12357,
	12358,
	12359,
	12360,
	12361,
	12362,
	12387,
	12388,
	12419,
	12420,
	12421,
	12422,
	12423,
	12424,
	12430,
	12431,
	12437,
	12439,
	12441,
	12443,
	12447,
	12448,
	12450,
	12451,
	12452,
	12453,
	12454,
	12455,
	12456,
	12457,
	12458,
	12483,
	12484,
	12515,
	12516,
	12517,
	12518,
	12519,
	12520,
	12526,
	12527,
	12533,
	12535,
	12539,
	12543,
	12544,
	12549,
	12592,
	12593,
	12687,
	12688,
	12774,
	12783,
	12784,
	12800,
	12831,
	12832,
	12872,
	12880,
	19904,
	19968,
	40981,
	40982,
	42125,
	42128,
	42183,
	42238,
	42240,
	42509,
	42510,
	42511,
	42512,
	42528,
	42538,
	42607,
	42611,
	42612,
	42622,
	42654,
	42656,
	42736,
	42738,
	42739,
	42744,
	43010,
	43011,
	43014,
	43015,
	43019,
	43020,
	43043,
	43048,
	43052,
	43053,
	43064,
	43065,
	43124,
	43126,
	43128,
	43136,
	43138,
	43188,
	43206,
	43214,
	43216,
	43226,
	43232,
	43250,
	43260,
	43261,
	43263,
	43264,
	43274,
	43302,
	43310,
	43312,
	43335,
	43348,
	43360,
	43389,
	43392,
	43396,
	43443,
	43456,
	43457,
	43463,
	43466,
	43470,
	43471,
	43472,
	43482,
	43486,
	43488,
	43493,
	43494,
	43504,
	43514,
	43520,
	43561,
	43575,
	43584,
	43587,
	43588,
	43596,
	43598,
	43600,
	43610,
	43612,
	43613,
	43616,
	43643,
	43646,
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
	43755,
	43760,
	43762,
	43765,
	43767,
	44003,
	44011,
	44012,
	44014,
	44016,
	44026,
	44032,
	44033,
	44060,
	44061,
	44088,
	44089,
	44116,
	44117,
	44144,
	44145,
	44172,
	44173,
	44200,
	44201,
	44228,
	44229,
	44256,
	44257,
	44284,
	44285,
	44312,
	44313,
	44340,
	44341,
	44368,
	44369,
	44396,
	44397,
	44424,
	44425,
	44452,
	44453,
	44480,
	44481,
	44508,
	44509,
	44536,
	44537,
	44564,
	44565,
	44592,
	44593,
	44620,
	44621,
	44648,
	44649,
	44676,
	44677,
	44704,
	44705,
	44732,
	44733,
	44760,
	44761,
	44788,
	44789,
	44816,
	44817,
	44844,
	44845,
	44872,
	44873,
	44900,
	44901,
	44928,
	44929,
	44956,
	44957,
	44984,
	44985,
	45012,
	45013,
	45040,
	45041,
	45068,
	45069,
	45096,
	45097,
	45124,
	45125,
	45152,
	45153,
	45180,
	45181,
	45208,
	45209,
	45236,
	45237,
	45264,
	45265,
	45292,
	45293,
	45320,
	45321,
	45348,
	45349,
	45376,
	45377,
	45404,
	45405,
	45432,
	45433,
	45460,
	45461,
	45488,
	45489,
	45516,
	45517,
	45544,
	45545,
	45572,
	45573,
	45600,
	45601,
	45628,
	45629,
	45656,
	45657,
	45684,
	45685,
	45712,
	45713,
	45740,
	45741,
	45768,
	45769,
	45796,
	45797,
	45824,
	45825,
	45852,
	45853,
	45880,
	45881,
	45908,
	45909,
	45936,
	45937,
	45964,
	45965,
	45992,
	45993,
	46020,
	46021,
	46048,
	46049,
	46076,
	46077,
	46104,
	46105,
	46132,
	46133,
	46160,
	46161,
	46188,
	46189,
	46216,
	46217,
	46244,
	46245,
	46272,
	46273,
	46300,
	46301,
	46328,
	46329,
	46356,
	46357,
	46384,
	46385,
	46412,
	46413,
	46440,
	46441,
	46468,
	46469,
	46496,
	46497,
	46524,
	46525,
	46552,
	46553,
	46580,
	46581,
	46608,
	46609,
	46636,
	46637,
	46664,
	46665,
	46692,
	46693,
	46720,
	46721,
	46748,
	46749,
	46776,
	46777,
	46804,
	46805,
	46832,
	46833,
	46860,
	46861,
	46888,
	46889,
	46916,
	46917,
	46944,
	46945,
	46972,
	46973,
	47e3,
	47001,
	47028,
	47029,
	47056,
	47057,
	47084,
	47085,
	47112,
	47113,
	47140,
	47141,
	47168,
	47169,
	47196,
	47197,
	47224,
	47225,
	47252,
	47253,
	47280,
	47281,
	47308,
	47309,
	47336,
	47337,
	47364,
	47365,
	47392,
	47393,
	47420,
	47421,
	47448,
	47449,
	47476,
	47477,
	47504,
	47505,
	47532,
	47533,
	47560,
	47561,
	47588,
	47589,
	47616,
	47617,
	47644,
	47645,
	47672,
	47673,
	47700,
	47701,
	47728,
	47729,
	47756,
	47757,
	47784,
	47785,
	47812,
	47813,
	47840,
	47841,
	47868,
	47869,
	47896,
	47897,
	47924,
	47925,
	47952,
	47953,
	47980,
	47981,
	48008,
	48009,
	48036,
	48037,
	48064,
	48065,
	48092,
	48093,
	48120,
	48121,
	48148,
	48149,
	48176,
	48177,
	48204,
	48205,
	48232,
	48233,
	48260,
	48261,
	48288,
	48289,
	48316,
	48317,
	48344,
	48345,
	48372,
	48373,
	48400,
	48401,
	48428,
	48429,
	48456,
	48457,
	48484,
	48485,
	48512,
	48513,
	48540,
	48541,
	48568,
	48569,
	48596,
	48597,
	48624,
	48625,
	48652,
	48653,
	48680,
	48681,
	48708,
	48709,
	48736,
	48737,
	48764,
	48765,
	48792,
	48793,
	48820,
	48821,
	48848,
	48849,
	48876,
	48877,
	48904,
	48905,
	48932,
	48933,
	48960,
	48961,
	48988,
	48989,
	49016,
	49017,
	49044,
	49045,
	49072,
	49073,
	49100,
	49101,
	49128,
	49129,
	49156,
	49157,
	49184,
	49185,
	49212,
	49213,
	49240,
	49241,
	49268,
	49269,
	49296,
	49297,
	49324,
	49325,
	49352,
	49353,
	49380,
	49381,
	49408,
	49409,
	49436,
	49437,
	49464,
	49465,
	49492,
	49493,
	49520,
	49521,
	49548,
	49549,
	49576,
	49577,
	49604,
	49605,
	49632,
	49633,
	49660,
	49661,
	49688,
	49689,
	49716,
	49717,
	49744,
	49745,
	49772,
	49773,
	49800,
	49801,
	49828,
	49829,
	49856,
	49857,
	49884,
	49885,
	49912,
	49913,
	49940,
	49941,
	49968,
	49969,
	49996,
	49997,
	50024,
	50025,
	50052,
	50053,
	50080,
	50081,
	50108,
	50109,
	50136,
	50137,
	50164,
	50165,
	50192,
	50193,
	50220,
	50221,
	50248,
	50249,
	50276,
	50277,
	50304,
	50305,
	50332,
	50333,
	50360,
	50361,
	50388,
	50389,
	50416,
	50417,
	50444,
	50445,
	50472,
	50473,
	50500,
	50501,
	50528,
	50529,
	50556,
	50557,
	50584,
	50585,
	50612,
	50613,
	50640,
	50641,
	50668,
	50669,
	50696,
	50697,
	50724,
	50725,
	50752,
	50753,
	50780,
	50781,
	50808,
	50809,
	50836,
	50837,
	50864,
	50865,
	50892,
	50893,
	50920,
	50921,
	50948,
	50949,
	50976,
	50977,
	51004,
	51005,
	51032,
	51033,
	51060,
	51061,
	51088,
	51089,
	51116,
	51117,
	51144,
	51145,
	51172,
	51173,
	51200,
	51201,
	51228,
	51229,
	51256,
	51257,
	51284,
	51285,
	51312,
	51313,
	51340,
	51341,
	51368,
	51369,
	51396,
	51397,
	51424,
	51425,
	51452,
	51453,
	51480,
	51481,
	51508,
	51509,
	51536,
	51537,
	51564,
	51565,
	51592,
	51593,
	51620,
	51621,
	51648,
	51649,
	51676,
	51677,
	51704,
	51705,
	51732,
	51733,
	51760,
	51761,
	51788,
	51789,
	51816,
	51817,
	51844,
	51845,
	51872,
	51873,
	51900,
	51901,
	51928,
	51929,
	51956,
	51957,
	51984,
	51985,
	52012,
	52013,
	52040,
	52041,
	52068,
	52069,
	52096,
	52097,
	52124,
	52125,
	52152,
	52153,
	52180,
	52181,
	52208,
	52209,
	52236,
	52237,
	52264,
	52265,
	52292,
	52293,
	52320,
	52321,
	52348,
	52349,
	52376,
	52377,
	52404,
	52405,
	52432,
	52433,
	52460,
	52461,
	52488,
	52489,
	52516,
	52517,
	52544,
	52545,
	52572,
	52573,
	52600,
	52601,
	52628,
	52629,
	52656,
	52657,
	52684,
	52685,
	52712,
	52713,
	52740,
	52741,
	52768,
	52769,
	52796,
	52797,
	52824,
	52825,
	52852,
	52853,
	52880,
	52881,
	52908,
	52909,
	52936,
	52937,
	52964,
	52965,
	52992,
	52993,
	53020,
	53021,
	53048,
	53049,
	53076,
	53077,
	53104,
	53105,
	53132,
	53133,
	53160,
	53161,
	53188,
	53189,
	53216,
	53217,
	53244,
	53245,
	53272,
	53273,
	53300,
	53301,
	53328,
	53329,
	53356,
	53357,
	53384,
	53385,
	53412,
	53413,
	53440,
	53441,
	53468,
	53469,
	53496,
	53497,
	53524,
	53525,
	53552,
	53553,
	53580,
	53581,
	53608,
	53609,
	53636,
	53637,
	53664,
	53665,
	53692,
	53693,
	53720,
	53721,
	53748,
	53749,
	53776,
	53777,
	53804,
	53805,
	53832,
	53833,
	53860,
	53861,
	53888,
	53889,
	53916,
	53917,
	53944,
	53945,
	53972,
	53973,
	54e3,
	54001,
	54028,
	54029,
	54056,
	54057,
	54084,
	54085,
	54112,
	54113,
	54140,
	54141,
	54168,
	54169,
	54196,
	54197,
	54224,
	54225,
	54252,
	54253,
	54280,
	54281,
	54308,
	54309,
	54336,
	54337,
	54364,
	54365,
	54392,
	54393,
	54420,
	54421,
	54448,
	54449,
	54476,
	54477,
	54504,
	54505,
	54532,
	54533,
	54560,
	54561,
	54588,
	54589,
	54616,
	54617,
	54644,
	54645,
	54672,
	54673,
	54700,
	54701,
	54728,
	54729,
	54756,
	54757,
	54784,
	54785,
	54812,
	54813,
	54840,
	54841,
	54868,
	54869,
	54896,
	54897,
	54924,
	54925,
	54952,
	54953,
	54980,
	54981,
	55008,
	55009,
	55036,
	55037,
	55064,
	55065,
	55092,
	55093,
	55120,
	55121,
	55148,
	55149,
	55176,
	55177,
	55204,
	55216,
	55239,
	55243,
	55292,
	63744,
	64256,
	64285,
	64286,
	64287,
	64297,
	64298,
	64311,
	64312,
	64317,
	64318,
	64319,
	64320,
	64322,
	64323,
	64325,
	64326,
	64336,
	64830,
	64831,
	64832,
	65020,
	65021,
	65024,
	65040,
	65043,
	65045,
	65047,
	65048,
	65049,
	65050,
	65056,
	65057,
	65058,
	65059,
	65060,
	65061,
	65062,
	65064,
	65065,
	65066,
	65067,
	65068,
	65069,
	65071,
	65072,
	65077,
	65078,
	65079,
	65080,
	65081,
	65082,
	65083,
	65084,
	65085,
	65086,
	65087,
	65088,
	65089,
	65090,
	65091,
	65092,
	65093,
	65095,
	65096,
	65097,
	65104,
	65105,
	65106,
	65107,
	65108,
	65110,
	65112,
	65113,
	65114,
	65115,
	65116,
	65117,
	65118,
	65119,
	65127,
	65128,
	65129,
	65130,
	65131,
	65132,
	65279,
	65280,
	65281,
	65282,
	65284,
	65285,
	65286,
	65288,
	65289,
	65290,
	65292,
	65293,
	65294,
	65295,
	65306,
	65308,
	65311,
	65312,
	65339,
	65340,
	65341,
	65342,
	65371,
	65372,
	65373,
	65374,
	65375,
	65376,
	65378,
	65379,
	65381,
	65382,
	65383,
	65393,
	65438,
	65440,
	65471,
	65474,
	65480,
	65482,
	65488,
	65490,
	65496,
	65498,
	65501,
	65504,
	65505,
	65506,
	65509,
	65511,
	65529,
	65532,
	65533,
	65792,
	65795,
	66045,
	66046,
	66272,
	66273,
	66422,
	66427,
	66463,
	66464,
	66512,
	66513,
	66720,
	66730,
	67671,
	67672,
	67871,
	67872,
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
	68176,
	68184,
	68325,
	68327,
	68336,
	68342,
	68343,
	68409,
	68416,
	68900,
	68904,
	68912,
	68922,
	68928,
	68938,
	68969,
	68974,
	68975,
	69291,
	69293,
	69294,
	69328,
	69329,
	69370,
	69376,
	69446,
	69457,
	69506,
	69510,
	69632,
	69635,
	69637,
	69688,
	69702,
	69703,
	69705,
	69710,
	69714,
	69734,
	69744,
	69745,
	69747,
	69749,
	69750,
	69759,
	69760,
	69763,
	69808,
	69819,
	69821,
	69822,
	69826,
	69827,
	69837,
	69838,
	69872,
	69882,
	69888,
	69891,
	69927,
	69941,
	69942,
	69952,
	69956,
	69957,
	69959,
	70003,
	70004,
	70005,
	70006,
	70016,
	70019,
	70067,
	70081,
	70085,
	70087,
	70088,
	70089,
	70093,
	70094,
	70096,
	70106,
	70107,
	70108,
	70109,
	70112,
	70188,
	70200,
	70202,
	70203,
	70205,
	70206,
	70207,
	70209,
	70210,
	70313,
	70314,
	70367,
	70379,
	70384,
	70394,
	70400,
	70404,
	70405,
	70413,
	70415,
	70417,
	70419,
	70441,
	70442,
	70449,
	70450,
	70452,
	70453,
	70458,
	70459,
	70461,
	70462,
	70469,
	70471,
	70473,
	70475,
	70477,
	70478,
	70480,
	70481,
	70487,
	70488,
	70493,
	70494,
	70496,
	70498,
	70500,
	70502,
	70509,
	70512,
	70517,
	70528,
	70538,
	70539,
	70540,
	70542,
	70543,
	70544,
	70546,
	70582,
	70583,
	70584,
	70593,
	70594,
	70595,
	70597,
	70598,
	70599,
	70603,
	70604,
	70608,
	70609,
	70610,
	70611,
	70614,
	70615,
	70617,
	70625,
	70627,
	70709,
	70727,
	70731,
	70735,
	70736,
	70746,
	70748,
	70750,
	70751,
	70832,
	70852,
	70864,
	70874,
	71087,
	71094,
	71096,
	71105,
	71106,
	71108,
	71110,
	71113,
	71128,
	71132,
	71134,
	71216,
	71233,
	71235,
	71248,
	71258,
	71264,
	71277,
	71339,
	71352,
	71360,
	71370,
	71376,
	71396,
	71453,
	71468,
	71472,
	71482,
	71484,
	71487,
	71724,
	71739,
	71904,
	71914,
	71936,
	71943,
	71945,
	71946,
	71948,
	71956,
	71957,
	71959,
	71960,
	71984,
	71990,
	71991,
	71993,
	71995,
	71998,
	71999,
	72e3,
	72001,
	72002,
	72004,
	72007,
	72016,
	72026,
	72145,
	72152,
	72154,
	72161,
	72162,
	72163,
	72164,
	72165,
	72193,
	72203,
	72243,
	72250,
	72251,
	72255,
	72256,
	72257,
	72261,
	72262,
	72263,
	72264,
	72273,
	72284,
	72330,
	72346,
	72349,
	72350,
	72353,
	72355,
	72448,
	72458,
	72544,
	72552,
	72688,
	72698,
	72751,
	72759,
	72760,
	72768,
	72769,
	72774,
	72784,
	72794,
	72816,
	72817,
	72818,
	72850,
	72872,
	72873,
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
	73040,
	73050,
	73098,
	73103,
	73104,
	73106,
	73107,
	73112,
	73120,
	73130,
	73184,
	73194,
	73440,
	73458,
	73459,
	73463,
	73465,
	73472,
	73474,
	73475,
	73476,
	73489,
	73490,
	73524,
	73531,
	73534,
	73538,
	73539,
	73541,
	73552,
	73562,
	73563,
	73693,
	73697,
	73727,
	73728,
	74864,
	74869,
	78424,
	78427,
	78430,
	78466,
	78467,
	78470,
	78471,
	78472,
	78473,
	78474,
	78713,
	78714,
	78716,
	78895,
	78896,
	78903,
	78904,
	78905,
	78908,
	78909,
	78910,
	78911,
	78912,
	78913,
	78919,
	78934,
	83406,
	83407,
	83408,
	90368,
	90398,
	90416,
	90426,
	92768,
	92778,
	92782,
	92784,
	92864,
	92874,
	92912,
	92917,
	92918,
	92976,
	92983,
	92986,
	92996,
	92997,
	93008,
	93018,
	93550,
	93552,
	93562,
	93847,
	93849,
	94031,
	94032,
	94033,
	94088,
	94095,
	94099,
	94176,
	94180,
	94181,
	94192,
	94194,
	94196,
	94199,
	94208,
	101120,
	101632,
	101663,
	101760,
	101875,
	110592,
	110883,
	110898,
	110899,
	110928,
	110931,
	110933,
	110934,
	110948,
	110952,
	110960,
	111356,
	113821,
	113823,
	113824,
	113828,
	118e3,
	118010,
	118528,
	118574,
	118576,
	118599,
	119141,
	119146,
	119149,
	119171,
	119173,
	119180,
	119210,
	119214,
	119362,
	119365,
	120782,
	120832,
	121344,
	121399,
	121403,
	121453,
	121461,
	121462,
	121476,
	121477,
	121479,
	121483,
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
	123200,
	123210,
	123566,
	123567,
	123628,
	123632,
	123642,
	123647,
	123648,
	124140,
	124144,
	124154,
	124398,
	124400,
	124401,
	124411,
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
	125252,
	125259,
	125264,
	125274,
	125278,
	125280,
	126124,
	126125,
	126128,
	126129,
	126976,
	127232,
	127406,
	127462,
	127488,
	127877,
	127878,
	127900,
	127902,
	127925,
	127927,
	127932,
	127933,
	127938,
	127941,
	127943,
	127944,
	127946,
	127949,
	127995,
	128e3,
	128066,
	128068,
	128070,
	128081,
	128102,
	128121,
	128124,
	128125,
	128129,
	128132,
	128133,
	128136,
	128143,
	128144,
	128145,
	128146,
	128160,
	128161,
	128162,
	128163,
	128164,
	128165,
	128170,
	128171,
	128175,
	128176,
	128177,
	128179,
	128256,
	128263,
	128279,
	128293,
	128306,
	128330,
	128372,
	128374,
	128378,
	128379,
	128400,
	128401,
	128405,
	128407,
	128468,
	128476,
	128500,
	128506,
	128581,
	128584,
	128587,
	128592,
	128630,
	128633,
	128636,
	128640,
	128675,
	128676,
	128692,
	128695,
	128704,
	128705,
	128716,
	128717,
	128768,
	128884,
	128887,
	128891,
	128896,
	128981,
	129024,
	129292,
	129293,
	129295,
	129296,
	129304,
	129312,
	129318,
	129319,
	129328,
	129338,
	129340,
	129343,
	129399,
	129400,
	129461,
	129463,
	129464,
	129466,
	129467,
	129468,
	129485,
	129488,
	129489,
	129502,
	129536,
	129624,
	129731,
	129734,
	129776,
	129785,
	129792,
	130032,
	130042,
	130048,
	131070,
	131072,
	196606,
	196608,
	262142,
	917505,
	917506,
	917536,
	917632,
	917760,
	918e3
], go = [
	1,
	15,
	4,
	0,
	2,
	1,
	6,
	22,
	39,
	11,
	38,
	37,
	11,
	39,
	36,
	19,
	11,
	38,
	30,
	27,
	30,
	41,
	35,
	30,
	11,
	22,
	11,
	36,
	38,
	19,
	11,
	36,
	15,
	18,
	11,
	1,
	5,
	1,
	3,
	36,
	37,
	38,
	11,
	39,
	11,
	15,
	11,
	37,
	38,
	11,
	16,
	11,
	39,
	11,
	36,
	11,
	16,
	11,
	16,
	11,
	16,
	11,
	1,
	3,
	1,
	11,
	30,
	11,
	1,
	11,
	30,
	26,
	11,
	38,
	11,
	1,
	26,
	1,
	11,
	1,
	11,
	1,
	22,
	1,
	11,
	25,
	11,
	25,
	11,
	35,
	11,
	37,
	30,
	11,
	1,
	22,
	1,
	22,
	11,
	1,
	35,
	37,
	35,
	11,
	1,
	11,
	22,
	11,
	1,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	30,
	22,
	11,
	1,
	38,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	35,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	15,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	37,
	11,
	37,
	11,
	38,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	38,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	38,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	16,
	11,
	1,
	16,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	37,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	38,
	11,
	1,
	11,
	35,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	16,
	11,
	16,
	3,
	16,
	15,
	3,
	22,
	3,
	11,
	22,
	11,
	1,
	11,
	35,
	11,
	15,
	1,
	11,
	1,
	11,
	1,
	36,
	18,
	36,
	18,
	1,
	11,
	1,
	15,
	1,
	15,
	1,
	11,
	1,
	11,
	1,
	11,
	15,
	11,
	1,
	11,
	16,
	15,
	16,
	11,
	3,
	11,
	1,
	11,
	35,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	35,
	1,
	11,
	31,
	33,
	32,
	11,
	1,
	11,
	15,
	11,
	26,
	11,
	15,
	11,
	36,
	18,
	11,
	15,
	11,
	1,
	11,
	1,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	15,
	34,
	11,
	15,
	11,
	15,
	38,
	11,
	1,
	11,
	35,
	11,
	22,
	15,
	16,
	11,
	22,
	11,
	1,
	3,
	1,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	22,
	35,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	35,
	11,
	35,
	11,
	1,
	11,
	1,
	3,
	11,
	1,
	10,
	1,
	43,
	10,
	11,
	15,
	13,
	15,
	28,
	15,
	28,
	1,
	28,
	15,
	1,
	11,
	1,
	11,
	35,
	11,
	13,
	1,
	42,
	11,
	1,
	11,
	15,
	35,
	11,
	35,
	11,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	3,
	1,
	3,
	1,
	11,
	16,
	11,
	15,
	3,
	15,
	8,
	1,
	9,
	1,
	26,
	3,
	26,
	14,
	11,
	39,
	36,
	39,
	36,
	39,
	11,
	29,
	15,
	0,
	1,
	3,
	37,
	11,
	39,
	11,
	34,
	11,
	30,
	36,
	18,
	34,
	11,
	15,
	37,
	15,
	11,
	15,
	7,
	11,
	1,
	11,
	36,
	18,
	11,
	36,
	18,
	11,
	38,
	37,
	38,
	37,
	38,
	37,
	38,
	37,
	38,
	37,
	38,
	1,
	11,
	37,
	11,
	37,
	11,
	38,
	11,
	38,
	11,
	29,
	11,
	36,
	18,
	36,
	18,
	11,
	28,
	11,
	36,
	18,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	20,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	20,
	28,
	11,
	28,
	11,
	28,
	20,
	11,
	39,
	11,
	22,
	28,
	11,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	11,
	36,
	18,
	11,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	11,
	15,
	11,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	11,
	36,
	18,
	36,
	18,
	11,
	36,
	18,
	11,
	1,
	11,
	22,
	15,
	11,
	22,
	15,
	11,
	15,
	11,
	1,
	11,
	1,
	39,
	15,
	11,
	26,
	36,
	15,
	11,
	39,
	11,
	39,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	15,
	22,
	11,
	15,
	11,
	15,
	11,
	14,
	15,
	11,
	26,
	15,
	36,
	15,
	11,
	15,
	11,
	15,
	11,
	22,
	36,
	19,
	36,
	19,
	36,
	19,
	36,
	19,
	26,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	15,
	18,
	28,
	34,
	28,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	28,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	34,
	36,
	18,
	28,
	1,
	28,
	1,
	28,
	34,
	28,
	11,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	11,
	1,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	34,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	34,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	34,
	28,
	11,
	28,
	11,
	15,
	11,
	15,
	22,
	15,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	37,
	11,
	16,
	22,
	11,
	1,
	11,
	1,
	11,
	15,
	35,
	11,
	1,
	11,
	16,
	11,
	1,
	35,
	11,
	1,
	15,
	11,
	1,
	11,
	31,
	11,
	1,
	10,
	1,
	43,
	28,
	15,
	28,
	11,
	15,
	13,
	11,
	28,
	11,
	1,
	11,
	35,
	11,
	13,
	1,
	11,
	15,
	1,
	15,
	1,
	11,
	13,
	11,
	28,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	15,
	11,
	1,
	11,
	1,
	15,
	1,
	11,
	35,
	11,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	23,
	24,
	11,
	33,
	11,
	32,
	11,
	28,
	11,
	25,
	1,
	25,
	11,
	25,
	11,
	25,
	11,
	25,
	11,
	25,
	11,
	25,
	11,
	25,
	11,
	18,
	36,
	11,
	37,
	11,
	1,
	18,
	34,
	22,
	36,
	18,
	29,
	11,
	3,
	1,
	3,
	1,
	3,
	1,
	3,
	1,
	3,
	1,
	3,
	1,
	3,
	1,
	28,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	36,
	18,
	28,
	36,
	18,
	28,
	18,
	28,
	18,
	11,
	34,
	22,
	28,
	36,
	18,
	36,
	18,
	36,
	18,
	28,
	11,
	28,
	38,
	37,
	28,
	11,
	7,
	11,
	22,
	28,
	38,
	37,
	28,
	36,
	18,
	28,
	18,
	28,
	18,
	28,
	34,
	28,
	22,
	28,
	36,
	28,
	18,
	28,
	36,
	28,
	18,
	28,
	36,
	18,
	36,
	18,
	34,
	28,
	34,
	28,
	34,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	37,
	38,
	28,
	38,
	11,
	1,
	17,
	11,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	15,
	11,
	15,
	11,
	35,
	11,
	15,
	11,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	15,
	11,
	1,
	11,
	15,
	29,
	11,
	15,
	11,
	1,
	11,
	35,
	11,
	35,
	11,
	1,
	26,
	11,
	1,
	26,
	11,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	12,
	10,
	1,
	43,
	15,
	28,
	11,
	28,
	13,
	1,
	10,
	1,
	10,
	11,
	3,
	1,
	11,
	1,
	11,
	35,
	15,
	1,
	11,
	35,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	35,
	15,
	11,
	1,
	11,
	1,
	11,
	16,
	11,
	1,
	11,
	1,
	11,
	15,
	11,
	15,
	1,
	11,
	1,
	35,
	11,
	16,
	11,
	15,
	11,
	1,
	15,
	11,
	15,
	11,
	1,
	11,
	1,
	11,
	15,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	10,
	11,
	10,
	11,
	10,
	11,
	10,
	11,
	10,
	11,
	10,
	11,
	1,
	15,
	1,
	11,
	1,
	11,
	1,
	43,
	11,
	13,
	11,
	1,
	11,
	15,
	13,
	10,
	1,
	11,
	1,
	11,
	1,
	11,
	13,
	11,
	13,
	11,
	13,
	11,
	13,
	10,
	11,
	28,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	43,
	12,
	1,
	28,
	11,
	28,
	11,
	1,
	11,
	1,
	11,
	15,
	11,
	35,
	15,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	16,
	15,
	22,
	11,
	15,
	11,
	1,
	11,
	1,
	15,
	11,
	35,
	11,
	16,
	11,
	1,
	11,
	35,
	11,
	35,
	11,
	1,
	11,
	35,
	11,
	15,
	11,
	1,
	11,
	35,
	11,
	10,
	11,
	10,
	11,
	10,
	11,
	10,
	11,
	10,
	1,
	11,
	1,
	11,
	1,
	43,
	12,
	1,
	12,
	1,
	15,
	11,
	13,
	11,
	1,
	11,
	1,
	11,
	16,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	16,
	11,
	15,
	16,
	11,
	1,
	11,
	1,
	11,
	1,
	15,
	11,
	16,
	15,
	11,
	16,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	15,
	11,
	35,
	11,
	16,
	22,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	35,
	11,
	13,
	15,
	1,
	15,
	11,
	1,
	12,
	1,
	10,
	11,
	10,
	1,
	11,
	1,
	43,
	15,
	28,
	13,
	1,
	11,
	37,
	11,
	15,
	11,
	15,
	11,
	36,
	18,
	11,
	18,
	11,
	36,
	18,
	36,
	18,
	11,
	36,
	18,
	11,
	36,
	3,
	36,
	18,
	3,
	36,
	18,
	36,
	18,
	1,
	11,
	1,
	11,
	36,
	18,
	11,
	13,
	1,
	13,
	11,
	35,
	11,
	15,
	11,
	35,
	11,
	1,
	15,
	11,
	1,
	15,
	11,
	15,
	11,
	35,
	11,
	15,
	35,
	11,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	34,
	3,
	11,
	1,
	34,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	34,
	11,
	34,
	11,
	34,
	11,
	34,
	11,
	28,
	11,
	1,
	15,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	15,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	35,
	11,
	38,
	11,
	1,
	35,
	11,
	1,
	11,
	35,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	1,
	11,
	35,
	11,
	36,
	11,
	37,
	11,
	37,
	11,
	28,
	11,
	28,
	40,
	28,
	20,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	21,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	20,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	11,
	28,
	11,
	28,
	20,
	28,
	20,
	11,
	39,
	34,
	11,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	20,
	28,
	11,
	28,
	20,
	28,
	20,
	28,
	11,
	35,
	11,
	28,
	11,
	28,
	11,
	28,
	11,
	1,
	11,
	1,
	11,
	1,
	11
], _o = [
	4352,
	8361,
	8986,
	9001,
	9193,
	9200,
	9203,
	9725,
	9748,
	9776,
	9800,
	9855,
	9866,
	9875,
	9889,
	9898,
	9917,
	9924,
	9934,
	9940,
	9962,
	9970,
	9973,
	9978,
	9981,
	9989,
	9994,
	10024,
	10060,
	10062,
	10067,
	10071,
	10133,
	10160,
	10175,
	11035,
	11088,
	11093,
	11904,
	11931,
	12032,
	12272,
	12353,
	12441,
	12549,
	12593,
	12688,
	12783,
	12832,
	12880,
	42128,
	43360,
	44032,
	63744,
	65040,
	65072,
	65108,
	65128,
	65281,
	65474,
	65482,
	65490,
	65498,
	65504,
	65512,
	94176,
	94192,
	94208,
	101631,
	101760,
	110576,
	110581,
	110589,
	110592,
	110898,
	110928,
	110933,
	110948,
	110960,
	119552,
	119648,
	126980,
	127183,
	127374,
	127377,
	127488,
	127504,
	127552,
	127568,
	127584,
	127744,
	127789,
	127799,
	127870,
	127904,
	127951,
	127968,
	127988,
	127992,
	128064,
	128066,
	128255,
	128331,
	128336,
	128378,
	128405,
	128420,
	128507,
	128640,
	128716,
	128720,
	128725,
	128732,
	128747,
	128756,
	128992,
	129008,
	129292,
	129340,
	129351,
	129648,
	129664,
	129678,
	129736,
	129741,
	129759,
	129775,
	131072,
	196608
], vo = [
	4448,
	8362,
	8988,
	9003,
	9197,
	9201,
	9204,
	9727,
	9750,
	9784,
	9812,
	9856,
	9872,
	9876,
	9890,
	9900,
	9919,
	9926,
	9935,
	9941,
	9963,
	9972,
	9974,
	9979,
	9982,
	9990,
	9996,
	10025,
	10061,
	10063,
	10070,
	10072,
	10136,
	10161,
	10176,
	11037,
	11089,
	11094,
	11930,
	12020,
	12246,
	12351,
	12439,
	12544,
	12592,
	12687,
	12774,
	12831,
	12872,
	42125,
	42183,
	43389,
	55204,
	64256,
	65050,
	65107,
	65127,
	65132,
	65471,
	65480,
	65488,
	65496,
	65501,
	65511,
	65519,
	94181,
	94199,
	101590,
	101663,
	101875,
	110580,
	110588,
	110591,
	110883,
	110899,
	110931,
	110934,
	110952,
	111356,
	119639,
	119671,
	126981,
	127184,
	127375,
	127387,
	127491,
	127548,
	127561,
	127570,
	127590,
	127777,
	127798,
	127869,
	127892,
	127947,
	127956,
	127985,
	127989,
	128063,
	128065,
	128253,
	128318,
	128335,
	128360,
	128379,
	128407,
	128421,
	128592,
	128710,
	128717,
	128723,
	128729,
	128736,
	128749,
	128765,
	129004,
	129009,
	129339,
	129350,
	129536,
	129661,
	129675,
	129735,
	129737,
	129757,
	129771,
	129785,
	196606,
	262142
];
//#endregion
//#region packages/core/src/text/line-break.ts
function yo(e) {
	let t = 0, n = ho.length - 1;
	for (; t < n;) {
		let r = t + n + 1 >> 1;
		ho[r] <= e ? t = r : n = r - 1;
	}
	return mo[go[t]];
}
function bo(e) {
	let t = 0, n = _o.length - 1;
	if (n < 0 || e < _o[0]) return !1;
	for (; t < n;) {
		let r = t + n + 1 >> 1;
		_o[r] <= e ? t = r : n = r - 1;
	}
	return e < vo[t];
}
function xo(e, t) {
	let n = yo(e);
	if (n === "OP") return !0;
	let r = yo(t), i = n === "AL" || n === "HL", a = r === "AL" || r === "HL";
	return !!(i && (a || r === "NU" || r === "PR" || r === "PO") || a && (n === "NU" || n === "PR" || n === "PO") || n === "PR" && (r === "ID" || r === "EB" || r === "EM") || (n === "ID" || n === "EB" || n === "EM") && r === "PO" || n === "NU" && (r === "NU" || r === "PO" || r === "PR") || r === "NU" && (n === "PO" || n === "PR" || n === "HY" || n === "IS") || (i || n === "NU") && r === "OP" && !bo(t) || n === "CP" && !bo(e) && (a || r === "NU"));
}
//#endregion
//#region packages/core/src/text/sea-break.ts
function So(e) {
	return e === "my" || e === "bo";
}
function $(e) {
	return e >= 3584 && e <= 3711 || e >= 3712 && e <= 3839 || e >= 6016 && e <= 6143 || e >= 4096 && e <= 4255 || e >= 43616 && e <= 43647 || e >= 43488 && e <= 43519 || e >= 3840 && e <= 4095;
}
function Co(e) {
	return e === 3633 || e >= 3635 && e <= 3642 || e >= 3655 && e <= 3662 || e === 3761 || e >= 3763 && e <= 3772 || e >= 3784 && e <= 3790 || e >= 6068 && e <= 6099 || e === 6109;
}
function wo(e) {
	return e <= 3711 ? "th" : e <= 3839 ? "lo" : e <= 4095 ? "bo" : e <= 4255 ? "my" : e <= 6143 ? "km" : "my";
}
function To(e) {
	for (let t of e) if ($(t.codePointAt(0))) return !0;
	return !1;
}
function Eo(e) {
	for (let t of e) {
		let e = t.codePointAt(0);
		if ($(e)) return So(wo(e));
	}
	return !1;
}
function Do(e) {
	let t = !1;
	for (let n of e) {
		let e = n.codePointAt(0);
		if ($(e)) {
			if (So(wo(e))) return !1;
			t = !0;
		}
	}
	return t;
}
var Oo, ko = /* @__PURE__ */ new Map();
function Ao(e) {
	let t = ko.get(e);
	if (t !== void 0) return t;
	let n = null;
	try {
		typeof Intl < "u" && typeof Intl.Segmenter == "function" && (n = new Intl.Segmenter(e, { granularity: "word" }));
	} catch {
		n = null;
	}
	return ko.set(e, n), n;
}
function jo(e) {
	if (Oo === null) return null;
	if (typeof Oo == "function") {
		let t = Oo;
		return (n) => t(n, e);
	}
	let t = Ao(e);
	return t ? (e) => t.segment(e) : null;
}
function Mo(e) {
	if (!To(e)) return [];
	let t = [], n = e.length, r = 0;
	for (; r < n;) {
		let i = e.codePointAt(r), a = i > 65535 ? 2 : 1;
		if (!$(i)) {
			r += a;
			continue;
		}
		let o = wo(i), s = So(o), c = r + a;
		for (; c < n;) {
			let t = e.codePointAt(c);
			if (!$(t) || So(wo(t)) !== s) break;
			c += t > 65535 ? 2 : 1;
		}
		let l = e.slice(r, c);
		if (s) for (let e of Bo(l)) t.push(r + e);
		else {
			let e = jo(o);
			if (e) {
				let n = [];
				try {
					for (let t of e(l)) t.index > 0 && (t.isWordLike ?? !0) && n.push(r + t.index);
					for (let e of n) t.push(e);
				} catch {}
			}
		}
		r = c;
	}
	return t;
}
function No(e) {
	if (!To(e)) return [];
	let t = [], n = e.length, r = e.codePointAt(0), i = r > 65535 ? 2 : 1;
	for (; i < n;) {
		let n = e.codePointAt(i), a = n > 65535 ? 2 : 1;
		$(r) !== $(n) && !Po(r) && !Po(n) && t.push(i), r = n, i += a;
	}
	return t;
}
function Po(e) {
	return e === 32 || e === 9 || e === 10 || e === 13 || e === 12288 || e === 160 || e === 8199 || e === 8239 || e === 8288 || e === 65279;
}
function Fo(e, t) {
	if (!To(e)) return [];
	let n = e.length, r = new Set(Mo(e)), i = new Set(Bo(e)), a = (e) => {
		i.has(e) && r.add(e);
	};
	for (let t of No(e)) a(t);
	if (t?.cjk) {
		let t = e.codePointAt(0), r = t > 65535 ? 2 : 1;
		for (; r < n;) {
			let n = e.codePointAt(r);
			(fo(n) || fo(t)) && a(r), t = n, r += n > 65535 ? 2 : 1;
		}
	}
	let o = t?.kinsoku, s = o != null && o.enabled !== !1, c = [];
	for (let t of r) if (!(t <= 0 || t >= n)) {
		if (s) {
			let n = e.codePointAt(t), r = Io(e, t);
			if (r !== void 0 && o.lineEndForbidden.has(r) || o.lineStartForbidden.has(n)) continue;
		}
		c.push(t);
	}
	return c.sort((e, t) => e - t), c;
}
function Io(e, t) {
	if (t <= 0) return;
	let n = e.charCodeAt(t - 1);
	if (n >= 56320 && n <= 57343 && t >= 2) {
		let n = e.charCodeAt(t - 2);
		if (n >= 55296 && n <= 56319) return e.codePointAt(t - 2);
	}
	return n;
}
function Lo(e, t, n, r, i, a = !1) {
	let o = e.length;
	if (n >= o) return n;
	if (a) {
		if (i(e.slice(n, o)) <= r) return o;
		let a = 0, s = t.length - 1, c = n;
		for (; a <= s;) {
			let l = a + s >> 1, u = t[l];
			u <= n ? a = l + 1 : u >= o ? s = l - 1 : i(e.slice(n, u)) <= r ? (c = u, a = l + 1) : s = l - 1;
		}
		return c;
	}
	let s = n;
	for (let a of t) a <= n || a >= o || i(e.slice(n, a)) <= r && (s = a);
	return i(e.slice(n, o)) <= r && (s = o), s;
}
var Ro;
function zo() {
	if (Ro !== void 0) return Ro;
	let e = null;
	try {
		typeof Intl < "u" && typeof Intl.Segmenter == "function" && (e = new Intl.Segmenter(void 0, { granularity: "grapheme" }));
	} catch {
		e = null;
	}
	return Ro = e, e;
}
function Bo(e) {
	let t = zo();
	if (t) try {
		let n = [];
		for (let r of t.segment(e)) r.index > 0 && n.push(r.index);
		return n;
	} catch {}
	let n = [];
	for (let t = 0; t < e.length;) {
		let r = e.codePointAt(t);
		t += r > 65535 ? 2 : 1, t < e.length && n.push(t);
	}
	return n;
}
//#endregion
//#region packages/core/src/text/vertical-orientation.generated.ts
var Vo = [
	"U",
	"R",
	"Tu",
	"Tr"
], Ho = [
	0,
	167,
	168,
	169,
	170,
	174,
	175,
	177,
	178,
	188,
	191,
	215,
	216,
	247,
	248,
	746,
	748,
	4352,
	4608,
	5121,
	5760,
	6320,
	6400,
	8214,
	8215,
	8216,
	8218,
	8220,
	8222,
	8224,
	8226,
	8240,
	8242,
	8251,
	8253,
	8258,
	8259,
	8263,
	8266,
	8273,
	8274,
	8293,
	8294,
	8413,
	8417,
	8418,
	8421,
	8448,
	8450,
	8451,
	8458,
	8463,
	8464,
	8467,
	8469,
	8470,
	8472,
	8478,
	8484,
	8485,
	8486,
	8487,
	8488,
	8489,
	8490,
	8494,
	8495,
	8501,
	8512,
	8517,
	8523,
	8524,
	8526,
	8527,
	8586,
	8588,
	8592,
	8734,
	8735,
	8756,
	8758,
	8960,
	8968,
	8972,
	8992,
	8996,
	9001,
	9003,
	9004,
	9085,
	9115,
	9150,
	9166,
	9167,
	9168,
	9169,
	9180,
	9186,
	9251,
	9252,
	9472,
	9632,
	9754,
	9760,
	10088,
	10102,
	10132,
	11026,
	11056,
	11088,
	11098,
	11159,
	11160,
	11192,
	11218,
	11219,
	11244,
	11248,
	11264,
	11856,
	11858,
	11904,
	12289,
	12291,
	12296,
	12306,
	12308,
	12320,
	12336,
	12337,
	12353,
	12354,
	12355,
	12356,
	12357,
	12358,
	12359,
	12360,
	12361,
	12362,
	12387,
	12388,
	12419,
	12420,
	12421,
	12422,
	12423,
	12424,
	12430,
	12431,
	12437,
	12439,
	12443,
	12445,
	12448,
	12449,
	12450,
	12451,
	12452,
	12453,
	12454,
	12455,
	12456,
	12457,
	12458,
	12483,
	12484,
	12515,
	12516,
	12517,
	12518,
	12519,
	12520,
	12526,
	12527,
	12533,
	12535,
	12540,
	12541,
	12583,
	12584,
	12724,
	12728,
	12731,
	12732,
	12784,
	12800,
	13055,
	13144,
	13179,
	13184,
	42192,
	43360,
	43392,
	44032,
	55296,
	57344,
	64256,
	65040,
	65056,
	65072,
	65097,
	65104,
	65107,
	65112,
	65113,
	65119,
	65123,
	65127,
	65136,
	65281,
	65282,
	65288,
	65290,
	65292,
	65293,
	65294,
	65295,
	65306,
	65308,
	65311,
	65312,
	65339,
	65340,
	65341,
	65342,
	65343,
	65344,
	65371,
	65377,
	65504,
	65507,
	65508,
	65512,
	65520,
	65529,
	65532,
	65534,
	67968,
	68e3,
	71040,
	71168,
	72192,
	72384,
	77824,
	83584,
	94176,
	101888,
	110576,
	110898,
	110899,
	110928,
	110931,
	110933,
	110934,
	110948,
	110952,
	111360,
	118464,
	118736,
	118784,
	119296,
	119520,
	119680,
	120832,
	121520,
	126976,
	127488,
	127490,
	129024,
	129280,
	129792,
	131072,
	196606,
	196608,
	262142,
	983040,
	1048574,
	1048576,
	1114110
], Uo = [
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	3,
	1,
	3,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	3,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	2,
	0,
	3,
	0,
	3,
	0,
	3,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	3,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	3,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	2,
	0,
	1,
	3,
	0,
	1,
	0,
	1,
	2,
	0,
	3,
	0,
	2,
	1,
	2,
	0,
	3,
	1,
	2,
	0,
	3,
	0,
	3,
	0,
	3,
	0,
	3,
	1,
	0,
	3,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	2,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	2,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1
];
//#endregion
//#region packages/core/src/text/vertical-orientation.ts
function Wo(e) {
	let t = 0, n = Ho.length - 1;
	for (; t < n;) {
		let r = t + n + 1 >> 1;
		Ho[r] <= e ? t = r : n = r - 1;
	}
	return Uo[t];
}
function Go(e) {
	return Vo[Wo(e)];
}
function Ko(e) {
	return qo.get(e) ?? null;
}
var qo = new Map([
	[65292, 65040],
	[12289, 65041],
	[12290, 65042]
]);
function Jo(e) {
	return Yo.get(e) ?? null;
}
var Yo = new Map([
	[65288, 65077],
	[65289, 65078],
	[65371, 65079],
	[65373, 65080],
	[12308, 65081],
	[12309, 65082],
	[12304, 65083],
	[12305, 65084],
	[12298, 65085],
	[12299, 65086],
	[12296, 65087],
	[12297, 65088],
	[12300, 65089],
	[12301, 65090],
	[12302, 65091],
	[12303, 65092],
	[12310, 65047],
	[12311, 65048]
]), Xo = new Set([65307]);
function Zo(e) {
	return Xo.has(e);
}
var Qo = new Set([
	12540,
	12316,
	65374
]);
function $o(e) {
	return Qo.has(e);
}
//#endregion
//#region packages/core/src/text/vertical-vert-feature.ts
var es = 256, ts = 200, ns = /* @__PURE__ */ new WeakMap();
function rs(e) {
	let t = e.canvas, n = t?.ownerDocument?.defaultView?.HTMLCanvasElement;
	return typeof n == "function" && t instanceof n || typeof HTMLCanvasElement < "u" && t instanceof HTMLCanvasElement ? t : null;
}
function is(e, t) {
	return e.replace(/(^|\s)\d*\.?\d+(?:px|pt|pc|in|cm|mm|q|em|rem|%)(?:\/[^\s]+)?(?=\s)/i, `$1${t}`);
}
function as(e, t = !0) {
	let n = e.trim();
	return [...n === "" || n.toLowerCase() === "normal" ? [] : n.split(",").map((e) => e.trim()).filter((e) => !/^(["'])vert\1(?:\s+(?:on|off|\d+))?$/i.test(e)), `"vert" ${+!!t}`].join(", ");
}
function os(e) {
	try {
		let t = e.ownerDocument?.defaultView, n = t?.getComputedStyle ? t.getComputedStyle(e) : typeof getComputedStyle == "function" ? getComputedStyle(e) : null;
		if (n?.fontFeatureSettings) return n.fontFeatureSettings;
	} catch {}
	return e.style.fontFeatureSettings;
}
function ss(e, t) {
	if (e.isConnected) return t();
	let n = e.ownerDocument ?? (typeof document > "u" ? null : document), r = n?.body ?? n?.documentElement;
	if (!r) return t();
	let i = e.parentNode, a = e.nextSibling, o = e.style, s = {
		position: o.position,
		left: o.left,
		top: o.top,
		opacity: o.opacity,
		pointerEvents: o.pointerEvents
	};
	Object.assign(o, {
		position: "fixed",
		left: "-99999px",
		top: "0",
		opacity: "0",
		pointerEvents: "none"
	}), r.appendChild(e);
	let c = !1;
	try {
		return t();
	} catch (e) {
		throw c = !0, e;
	} finally {
		let t;
		try {
			if (i) {
				let t = a?.parentNode === i ? a : null;
				i.insertBefore(e, t);
			} else e.remove();
		} catch (n) {
			t = n;
			try {
				e.remove();
			} catch {}
		} finally {
			Object.assign(o, s);
		}
		if (t !== void 0 && !c) throw t;
	}
}
function cs(e, t) {
	let n = rs(e);
	return n === null ? t() : ss(n, t);
}
function ls(e) {
	let t = ns.get(e);
	if (t) return t;
	let n = e.createElement("canvas");
	n.width = es, n.height = es, n.setAttribute("aria-hidden", "true"), Object.assign(n.style, {
		position: "fixed",
		left: "-99999px",
		top: "0",
		opacity: "0",
		pointerEvents: "none"
	});
	let r = {
		canvas: n,
		cache: /* @__PURE__ */ new Map(),
		epoch: 0
	}, i = () => {
		r.epoch += 1, r.cache.clear();
	};
	return e.fonts?.addEventListener?.("loadingdone", i), e.fonts?.addEventListener?.("loadingerror", i), ns.set(e, r), r;
}
function us(e, t) {
	let { width: n, height: r } = e.canvas, i = e.getImageData(0, 0, n, r).data, a = new Uint8ClampedArray(n * r), o = n, s = r, c = -1, l = -1, u = 0, d = 0, f = 0;
	for (let e = 0; e < r; e += 1) for (let t = 0; t < n; t += 1) {
		let r = i[(e * n + t) * 4 + 3];
		a[e * n + t] = r, r !== 0 && (o = Math.min(o, t), s = Math.min(s, e), c = Math.max(c, t), l = Math.max(l, e), u += r, d += t * r, f += e * r);
	}
	if (c < o || l < s || u === 0) return null;
	let p = e.measureText(t), m = (e) => typeof e == "number" && Number.isFinite(e) ? e : 0;
	return {
		alpha: a,
		geometry: [
			o,
			s,
			c,
			l,
			d / u,
			f / u
		],
		metrics: [
			m(p.width),
			m(p.actualBoundingBoxLeft),
			m(p.actualBoundingBoxRight),
			m(p.actualBoundingBoxAscent),
			m(p.actualBoundingBoxDescent)
		]
	};
}
function ds(e, t, n) {
	let r = e.canvas;
	r.style.fontFeatureSettings = n, e.font = e.font, e.clearRect(0, 0, r.width, r.height);
	let i = String.fromCodePoint(t);
	return e.fillText(i, r.width / 2, r.height / 2), us(e, i);
}
function fs(e, t) {
	let n = 0, r = Math.min(e.length, t.length);
	for (let i = 0; i < r; i += 1) n += Math.abs(e[i] - t[i]);
	return n;
}
function ps(e, t, n, r) {
	let i = (e, t, n, r) => {
		let i = Math.max(fs(e, t), fs(n, r));
		return Math.min(fs(e, n), fs(e, r), fs(t, n), fs(t, r)) > i;
	};
	return i(e.alpha, t.alpha, n.alpha, r.alpha) || i(e.geometry, t.geometry, n.geometry, r.geometry) || i(e.metrics, t.metrics, n.metrics, r.metrics);
}
function ms(e, t) {
	let n = rs(e);
	if (n === null || typeof document > "u") return !1;
	let r = n.ownerDocument ?? document, i = ls(r), a = os(n), o = `${i.epoch}:${is(e.font, "<size>")}:${a}:${t}`, s = i.cache.get(o);
	if (s !== void 0) return s;
	let c = !1, l = r.body ?? r.documentElement;
	if (!l) return !1;
	let u = i.canvas.isConnected;
	u || l.appendChild(i.canvas);
	let d = i.canvas.getContext("2d", { willReadFrequently: !0 });
	if (d !== null) {
		let n = i.canvas.style.fontFeatureSettings;
		try {
			d.font = is(e.font, `${ts}px`), d.fillStyle = "#000", d.textAlign = "center", d.textBaseline = "middle";
			let n = as(a, !1), r = as(a, !0), i = ds(d, t, n), o = ds(d, t, n), s = ds(d, t, r), l = ds(d, t, r);
			c = i !== null && o !== null && s !== null && l !== null && ps(i, o, s, l);
		} catch {
			c = !1;
		} finally {
			i.canvas.style.fontFeatureSettings = n, d.font = d.font, d.clearRect(0, 0, i.canvas.width, i.canvas.height), u || i.canvas.remove();
		}
	}
	return i.cache.set(o, c), c;
}
function hs(e, t) {
	let n = e.canvas;
	return n?.style ? cs(e, () => {
		let r = n.style, i = r.fontFeatureSettings;
		r.fontFeatureSettings = as(os(n)), e.font = e.font;
		try {
			return t();
		} finally {
			r.fontFeatureSettings = i, e.font = e.font;
		}
	}) : t();
}
function gs(e, t) {
	return hs(e, () => {
		let n = e.textAlign, r = e.textBaseline;
		e.textAlign = "center", e.textBaseline = "middle";
		try {
			let n = e.measureText(t), r = Number.isFinite(n.width) ? Math.max(0, n.width) : 0, i = typeof n.actualBoundingBoxAscent == "number" && Number.isFinite(n.actualBoundingBoxAscent) && typeof n.actualBoundingBoxDescent == "number" && Number.isFinite(n.actualBoundingBoxDescent);
			return {
				advancePx: r,
				inkBeforePx: i ? n.actualBoundingBoxAscent : 0,
				inkAfterPx: i ? n.actualBoundingBoxDescent : 0,
				cellAdvancePx: r,
				originInCellPx: r / 2
			};
		} finally {
			e.textAlign = n, e.textBaseline = r;
		}
	});
}
//#endregion
//#region packages/core/src/interaction/hyperlink.ts
var _s = [
	"http",
	"https",
	"mailto",
	"tel"
];
function vs(e) {
	let t = "";
	for (let n of e) {
		let e = n.codePointAt(0);
		e !== void 0 && e > 32 && (t += n);
	}
	let n = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(t);
	return n ? n[1].toLowerCase() : null;
}
function ys(e, t = _s) {
	if (e === "") return null;
	let n = vs(e);
	return n === null || t.includes(n) ? e : null;
}
function bs(e, t = _s, n = typeof window < "u" ? window : void 0) {
	let r = ys(e, t);
	return r === null || !n ? !1 : (n.open(r, "_blank", "noopener,noreferrer"), !0);
}
//#endregion
//#region packages/core/src/text/line-metrics.ts
var xs = [
	[(e) => e.includes("meiryo ui") || e.includes("meiryoui") || e.includes("メイリオ") && e.includes("ui"), {
		asc: 2171 * 1.3 / 2048,
		desc: 430 * 1.3 / 2048,
		eaOnly: !0
	}],
	[(e) => e.includes("meiryo") || e.includes("メイリオ"), {
		asc: 2210 / 2048,
		desc: 1059 / 2048
	}],
	[(e) => !e.includes("ui") && (e.includes("yu mincho") || e.includes("yumincho") || e.includes("游明朝") || e.includes("yu gothic") || e.includes("yugothic") || e.includes("游ゴシック")), {
		asc: 1802 * 1.3 / 2048,
		desc: 455 * 1.3 / 2048,
		eaOnly: !0
	}],
	[(e) => e.includes("sakkal majalla") || e.includes("majalla"), {
		asc: 1810 / 2048,
		desc: 1050 / 2048
	}],
	[(e) => e === "times new roman", {
		asc: 1825 / 2048,
		desc: 530 / 2048
	}],
	[(e) => e === "arial", {
		asc: 1854 / 2048,
		desc: 501 / 2048
	}]
];
function Ss(e, t) {
	if (!e) return null;
	let n = e.toLowerCase();
	for (let [e, r] of xs) if (e(n) && (t || !r.eaOnly)) return r;
	return null;
}
function Cs(e, t = !1) {
	let n = Ss(e, t);
	return n === null ? null : n.asc + n.desc;
}
function ws(e, t, n = !1) {
	let r = Cs(e, n);
	return r === null ? 0 : r * t;
}
function Ts(e, t, n, r, i = !1) {
	let a = Ss(e, i);
	if (a === null) return {
		ascent: n,
		descent: r
	};
	let o = (a.asc + a.desc) * t;
	return n + r <= o ? {
		ascent: n,
		descent: r
	} : {
		ascent: a.asc * t,
		descent: a.desc * t
	};
}
//#endregion
export { ri as $, _e as $t, ro as A, Qe as At, Xi as B, Oe as Bt, xo as C, sn as Ct, lo as D, zt as Dt, uo as E, Qt as Et, wa as F, Le as Ft, Ii as G, oe as Gt, Zi as H, De as Ht, Ca as I, ke as It, hi as J, ue as Jt, Ri as K, se as Kt, la as L, Ae as Lt, eo as M, Ue as Mt, Sa as N, Ze as Nt, co as O, Ge as Ot, Z as P, Ie as Pt, ii as Q, be as Qt, da as R, je as Rt, Fo as S, Cn as St, po as T, Zt as Tt, Si as U, Ne as Ut, Yi as V, Ee as Vt, Wi as W, Te as Wt, si as X, ce as Xt, ai as Y, le as Yt, oi as Z, de as Zt, Bo as _, fr as _t, bs as a, he as an, wr as at, Co as b, Bn as bt, hs as c, T as cn, yr as ct, Ko as d, _r as dt, ve as en, ni as et, Go as f, jn as ft, Lo as g, In as gt, To as h, ur as ht, vs as i, me as in, Gr as it, no as j, Xe as jt, so as k, We as kt, cs as l, br as lt, Zo as m, dr as mt, ws as n, ge as nn, $r as nt, gs as o, fe as on, Cr as ot, $o as p, pr as pt, mi as q, xe as qt, _s as r, pe as rn, ei as rt, ms as s, w as sn, xr as st, Ts as t, ye as tn, ti as tt, Jo as u, vr as ut, Do as v, Un as vt, fo as w, ln as wt, $ as x, yn as xt, Eo as y, ar as yt, ua as z, Me as zt };
