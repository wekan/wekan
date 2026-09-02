import { $ as e, A as t, At as n, Bt as r, C as i, Ct as a, D as o, Et as s, Ft as c, Ht as l, It as u, J as d, Lt as f, M as p, Mt as m, N as h, Nt as g, O as _, Ot as v, Pt as y, Rt as b, S as x, St as S, Tt as C, Vt as w, Wt as T, Xt as E, Yt as D, _ as O, _t as k, at as A, bt as j, c as M, cn as N, ct as P, d as F, dt as I, et as L, f as R, g as z, gt as B, h as V, i as H, it as U, j as ee, jt as W, lt as te, m as G, mt as K, n as q, nt as ne, p as re, r as ie, rt as ae, s as oe, tt as se, u as ce, w as le, wt as ue, xt as de, y as fe, zt as pe } from "./line-metrics-BGtFM-ec.js";
import { a as me, c as he, d as ge, f as _e, i as ve, l as ye, o as be, p as xe, r as Se, s as Ce, t as we, u as Te } from "./line-distribute-BsV4MVZ2.js";
import { A as Ee, D as De, S as Oe, _ as ke, h as Ae, hn as je, in as Me, j as Ne, on as Pe, sn as Fe, v as Ie, w as Le } from "./plot-area-frame-D5hEOgkJ.js";
import { l as Re } from "./pixel-budget-Dgjw269h.js";
import { r as J } from "./units-EJdC96r6.js";
import { A as ze, F as Be, I as Ve, L as He, M as Ue, N as We, P as Ge, j as Ke } from "./three-d-YYghQndN.js";
import { k as qe } from "./renderer-XFSCOT6m.js";
import { s as Je } from "./raster-target-ojDdQizC.js";
import { a as Ye, i as Xe, n as Ze, t as Qe } from "./resource-measurement-D41R-0Bl.js";
//#region packages/pptx/src/types.ts
function $e(e) {
	return e;
}
var et = {
	textarchdown: {
		adj: [["adj", "val 0"]],
		gd: [
			["adval", "pin 0 adj 21599999"],
			["v1", "+- 10800000 0 adval"],
			["v2", "+- 32400000 0 adval"],
			["nv1", "+- 0 0 v1"],
			["stAng", "?: nv1 v2 v1"],
			["w1", "+- 5400000 0 adval"],
			["w2", "+- 16200000 0 adval"],
			["d1", "+- adval 0 stAng"],
			["d2", "+- d1 0 21600000"],
			["v3", "+- 0 0 10800000"],
			["c2", "?: w2 d1 d2"],
			["c1", "?: v1 d2 c2"],
			["c0", "?: w1 d1 c1"],
			["swAng", "?: stAng c0 v3"],
			["wt1", "sin wd2 adj"],
			["ht1", "cos hd2 adj"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["wt2", "sin wd2 stAng"],
			["ht2", "cos hd2 stAng"],
			["dx2", "cat2 wd2 ht2 wt2"],
			["dy2", "sat2 hd2 ht2 wt2"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x2",
				"y2"
			], [
				"a",
				"wd2",
				"hd2",
				"stAng",
				"swAng"
			]]
		}]
	},
	textarchdownpour: {
		adj: [["adj1", "val 0"], ["adj2", "val 25000"]],
		gd: [
			["adval", "pin 0 adj1 21599999"],
			["v1", "+- 10800000 0 adval"],
			["v2", "+- 32400000 0 adval"],
			["nv1", "+- 0 0 v1"],
			["stAng", "?: nv1 v2 v1"],
			["w1", "+- 5400000 0 adval"],
			["w2", "+- 16200000 0 adval"],
			["d1", "+- adval 0 stAng"],
			["d2", "+- d1 0 21600000"],
			["v3", "+- 0 0 10800000"],
			["c2", "?: w2 d1 d2"],
			["c1", "?: v1 d2 c2"],
			["c0", "?: w1 d1 c1"],
			["swAng", "?: stAng c0 v3"],
			["wt1", "sin wd2 stAng"],
			["ht1", "cos hd2 stAng"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["adval2", "pin 0 adj2 99000"],
			["ratio", "*/ adval2 1 100000"],
			["iwd2", "*/ wd2 ratio 1"],
			["ihd2", "*/ hd2 ratio 1"],
			["wt2", "sin iwd2 adval"],
			["ht2", "cos ihd2 adval"],
			["dx2", "cat2 iwd2 ht2 wt2"],
			["dy2", "sat2 ihd2 ht2 wt2"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"],
			["wt3", "sin iwd2 stAng"],
			["ht3", "cos ihd2 stAng"],
			["dx3", "cat2 iwd2 ht3 wt3"],
			["dy3", "sat2 ihd2 ht3 wt3"],
			["x3", "+- hc dx3 0"],
			["y3", "+- vc dy3 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x3",
				"y3"
			], [
				"a",
				"iwd2",
				"ihd2",
				"stAng",
				"swAng"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
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
	textarchup: {
		adj: [["adj", "val cd2"]],
		gd: [
			["adval", "pin 0 adj 21599999"],
			["v1", "+- 10800000 0 adval"],
			["v2", "+- 32400000 0 adval"],
			["end", "?: v1 v1 v2"],
			["w1", "+- 5400000 0 adval"],
			["w2", "+- 16200000 0 adval"],
			["d1", "+- end 0 adval"],
			["d2", "+- 21600000 d1 0"],
			["c2", "?: w2 d1 d2"],
			["c1", "?: v1 d2 c2"],
			["swAng", "?: w1 d1 c1"],
			["wt1", "sin wd2 adj"],
			["ht1", "cos hd2 adj"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
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
				"adval",
				"swAng"
			]]
		}]
	},
	textarchuppour: {
		adj: [["adj1", "val cd2"], ["adj2", "val 50000"]],
		gd: [
			["adval", "pin 0 adj1 21599999"],
			["v1", "+- 10800000 0 adval"],
			["v2", "+- 32400000 0 adval"],
			["end", "?: v1 v1 v2"],
			["w1", "+- 5400000 0 adval"],
			["w2", "+- 16200000 0 adval"],
			["d1", "+- end 0 adval"],
			["d2", "+- 21600000 d1 0"],
			["c2", "?: w2 d1 d2"],
			["c1", "?: v1 d2 c2"],
			["swAng", "?: w1 d1 c1"],
			["wt1", "sin wd2 adval"],
			["ht1", "cos hd2 adval"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["adval2", "pin 0 adj2 99000"],
			["ratio", "*/ adval2 1 100000"],
			["iwd2", "*/ wd2 ratio 1"],
			["ihd2", "*/ hd2 ratio 1"],
			["wt2", "sin iwd2 adval"],
			["ht2", "cos ihd2 adval"],
			["dx2", "cat2 iwd2 ht2 wt2"],
			["dy2", "sat2 ihd2 ht2 wt2"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
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
				"adval",
				"swAng"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x2",
				"y2"
			], [
				"a",
				"iwd2",
				"ihd2",
				"adval",
				"swAng"
			]]
		}]
	},
	textbutton: {
		adj: [["adj", "val 10800000"]],
		gd: [
			["adval", "pin 0 adj 21599999"],
			["bot", "+- 5400000 0 adval"],
			["lef", "+- 10800000 0 adval"],
			["top", "+- 16200000 0 adval"],
			["rig", "+- 21600000 0 adval"],
			["c3", "?: top adval 0"],
			["c2", "?: lef 10800000 c3"],
			["c1", "?: bot rig c2"],
			["stAng", "?: adval c1 0"],
			["w1", "+- 21600000 0 stAng"],
			["stAngB", "?: stAng w1 0"],
			["td1", "*/ bot 2 1"],
			["td2", "*/ top 2 1"],
			["ntd2", "+- 0 0 td2"],
			["w2", "+- 0 0 10800000"],
			["c6", "?: top ntd2 w2"],
			["c5", "?: lef 10800000 c6"],
			["c4", "?: bot td1 c5"],
			["v1", "?: adval c4 10800000"],
			["swAngT", "+- 0 0 v1"],
			["stT", "?: lef stAngB stAng"],
			["stB", "?: lef stAng stAngB"],
			["swT", "?: lef v1 swAngT"],
			["swB", "?: lef swAngT v1"],
			["wt1", "sin wd2 stT"],
			["ht1", "cos hd2 stT"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["wt2", "sin wd2 stB"],
			["ht2", "cos hd2 stB"],
			["dx2", "cat2 wd2 ht2 wt2"],
			["dy2", "sat2 hd2 ht2 wt2"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"],
			["wt3", "sin wd2 adj"],
			["ht3", "cos hd2 adj"],
			["dx3", "cat2 wd2 ht3 wt3"],
			["dy3", "sat2 hd2 ht3 wt3"],
			["x3", "+- hc dx3 0"],
			["y3", "+- vc dy3 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
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
					"stT",
					"swT"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"l",
					"vc"
				], [
					"l",
					"r",
					"vc"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"x2",
					"y2"
				], [
					"a",
					"wd2",
					"hd2",
					"stB",
					"swB"
				]]
			}
		]
	},
	textbuttonpour: {
		adj: [["adj1", "val cd2"], ["adj2", "val 50000"]],
		gd: [
			["adval", "pin 0 adj1 21599999"],
			["bot", "+- 5400000 0 adval"],
			["lef", "+- 10800000 0 adval"],
			["top", "+- 16200000 0 adval"],
			["rig", "+- 21600000 0 adval"],
			["c3", "?: top adval 0"],
			["c2", "?: lef 10800000 c3"],
			["c1", "?: bot rig c2"],
			["stAng", "?: adval c1 0"],
			["w1", "+- 21600000 0 stAng"],
			["stAngB", "?: stAng w1 0"],
			["td1", "*/ bot 2 1"],
			["td2", "*/ top 2 1"],
			["ntd2", "+- 0 0 td2"],
			["w2", "+- 0 0 10800000"],
			["c6", "?: top ntd2 w2"],
			["c5", "?: lef 10800000 c6"],
			["c4", "?: bot td1 c5"],
			["v1", "?: adval c4 10800000"],
			["swAngT", "+- 0 0 v1"],
			["stT", "?: lef stAngB stAng"],
			["stB", "?: lef stAng stAngB"],
			["swT", "?: lef v1 swAngT"],
			["swB", "?: lef swAngT v1"],
			["wt1", "sin wd2 stT"],
			["ht1", "cos hd2 stT"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["wt6", "sin wd2 stB"],
			["ht6", "cos hd2 stB"],
			["dx6", "cat2 wd2 ht6 wt6"],
			["dy6", "sat2 hd2 ht6 wt6"],
			["x6", "+- hc dx6 0"],
			["y6", "+- vc dy6 0"],
			["adval2", "pin 40000 adj2 99000"],
			["ratio", "*/ adval2 1 100000"],
			["iwd2", "*/ wd2 ratio 1"],
			["ihd2", "*/ hd2 ratio 1"],
			["wt2", "sin iwd2 stT"],
			["ht2", "cos ihd2 stT"],
			["dx2", "cat2 iwd2 ht2 wt2"],
			["dy2", "sat2 ihd2 ht2 wt2"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"],
			["wt5", "sin iwd2 stB"],
			["ht5", "cos ihd2 stB"],
			["dx5", "cat2 iwd2 ht5 wt5"],
			["dy5", "sat2 ihd2 ht5 wt5"],
			["x5", "+- hc dx5 0"],
			["y5", "+- vc dy5 0"],
			["d1", "+- hd2 0 ihd2"],
			["d12", "*/ d1 1 2"],
			["yu", "+- vc 0 d12"],
			["yd", "+- vc d12 0"],
			["v1", "*/ d12 d12 1"],
			["v2", "*/ ihd2 ihd2 1"],
			["v3", "*/ v1 1 v2"],
			["v4", "+- 1 0 v3"],
			["v5", "*/ iwd2 iwd2 1"],
			["v6", "*/ v4 v5 1"],
			["v7", "sqrt v6"],
			["xl", "+- hc 0 v7"],
			["xr", "+- hc v7 0"],
			["wtadj", "sin iwd2 adj1"],
			["htadj", "cos ihd2 adj1"],
			["dxadj", "cat2 iwd2 htadj wtadj"],
			["dyadj", "sat2 ihd2 htadj wtadj"],
			["xadj", "+- hc dxadj 0"],
			["yadj", "+- vc dyadj 0"]
		],
		paths: [
			{
				w: null,
				h: null,
				fill: null,
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
					"stT",
					"swT"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"x2",
					"y2"
				], [
					"a",
					"iwd2",
					"ihd2",
					"stT",
					"swT"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"xl",
					"yu"
				], [
					"l",
					"xr",
					"yu"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"xl",
					"yd"
				], [
					"l",
					"xr",
					"yd"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"x5",
					"y5"
				], [
					"a",
					"iwd2",
					"ihd2",
					"stB",
					"swB"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"x6",
					"y6"
				], [
					"a",
					"wd2",
					"hd2",
					"stB",
					"swB"
				]]
			}
		]
	},
	textcandown: {
		adj: [["adj", "val 14286"]],
		gd: [
			["a", "pin 0 adj 33333"],
			["dy", "*/ a h 100000"],
			["y0", "+- t dy 0"],
			["y1", "+- b 0 dy"],
			["ncd2", "*/ cd2 -1 1"]
		],
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
				"a",
				"wd2",
				"dy",
				"cd2",
				"ncd2"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y1"
			], [
				"a",
				"wd2",
				"dy",
				"cd2",
				"ncd2"
			]]
		}]
	},
	textcanup: {
		adj: [["adj", "val 85714"]],
		gd: [
			["a", "pin 66667 adj 100000"],
			["dy1", "*/ a h 100000"],
			["dy", "+- h 0 dy1"],
			["y0", "+- t dy1 0"],
			["y1", "+- t dy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y1"
			], [
				"a",
				"wd2",
				"dy",
				"cd2",
				"cd2"
			]]
		}, {
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
				"a",
				"wd2",
				"dy",
				"cd2",
				"cd2"
			]]
		}]
	},
	textcascadedown: {
		adj: [["adj", "val 44444"]],
		gd: [
			["a", "pin 28570 adj 100000"],
			["dy", "*/ a h 100000"],
			["y1", "+- t dy 0"],
			["dy2", "+- h 0 dy"],
			["dy3", "*/ dy2 1 4"],
			["y2", "+- t dy3 0"]
		],
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
				"y2"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y1"
			], [
				"l",
				"r",
				"b"
			]]
		}]
	},
	textcascadeup: {
		adj: [["adj", "val 44444"]],
		gd: [
			["a", "pin 28570 adj 100000"],
			["dy", "*/ a h 100000"],
			["y1", "+- t dy 0"],
			["dy2", "+- h 0 dy"],
			["dy3", "*/ dy2 1 4"],
			["y2", "+- t dy3 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y2"
			], [
				"l",
				"r",
				"t"
			]]
		}, {
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
				"y1"
			]]
		}]
	},
	textchevron: {
		adj: [["adj", "val 25000"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["y", "*/ a h 100000"],
			["y1", "+- t b y"]
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
					"y"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"r",
					"y"
				]
			]
		}, {
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
					"hc",
					"y1"
				],
				[
					"l",
					"r",
					"b"
				]
			]
		}]
	},
	textchevroninverted: {
		adj: [["adj", "val 75000"]],
		gd: [
			["a", "pin 50000 adj 100000"],
			["y", "*/ a h 100000"],
			["y1", "+- b 0 y"]
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
					"y1"
				],
				[
					"l",
					"r",
					"t"
				]
			]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"r",
					"y"
				]
			]
		}]
	},
	textcircle: {
		adj: [["adj", "val 10800000"]],
		gd: [
			["adval", "pin 0 adj 21599999"],
			["d0", "+- adval 0 10800000"],
			["d1", "+- 10800000 0 adval"],
			["d2", "+- 21600000 0 adval"],
			["d3", "?: d1 d1 10799999"],
			["d4", "?: d0 d2 d3"],
			["swAng", "*/ d4 2 1"],
			["wt1", "sin wd2 adj"],
			["ht1", "cos hd2 adj"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
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
				"adval",
				"swAng"
			]]
		}]
	},
	textcirclepour: {
		adj: [["adj1", "val cd2"], ["adj2", "val 50000"]],
		gd: [
			["adval", "pin 0 adj1 21599999"],
			["d0", "+- adval 0 10800000"],
			["d1", "+- 10800000 0 adval"],
			["d2", "+- 21600000 0 adval"],
			["d3", "?: d1 d1 10799999"],
			["d4", "?: d0 d2 d3"],
			["swAng", "*/ d4 2 1"],
			["wt1", "sin wd2 adval"],
			["ht1", "cos hd2 adval"],
			["dx1", "cat2 wd2 ht1 wt1"],
			["dy1", "sat2 hd2 ht1 wt1"],
			["x1", "+- hc dx1 0"],
			["y1", "+- vc dy1 0"],
			["adval2", "pin 0 adj2 99000"],
			["ratio", "*/ adval2 1 100000"],
			["iwd2", "*/ wd2 ratio 1"],
			["ihd2", "*/ hd2 ratio 1"],
			["wt2", "sin iwd2 adval"],
			["ht2", "cos ihd2 adval"],
			["dx2", "cat2 iwd2 ht2 wt2"],
			["dy2", "sat2 ihd2 ht2 wt2"],
			["x2", "+- hc dx2 0"],
			["y2", "+- vc dy2 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
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
				"adval",
				"swAng"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x2",
				"y2"
			], [
				"a",
				"iwd2",
				"ihd2",
				"adval",
				"swAng"
			]]
		}]
	},
	textcurvedown: {
		adj: [["adj", "val 45977"]],
		gd: [
			["a", "pin 0 adj 56338"],
			["dy", "*/ a h 100000"],
			["gd1", "*/ dy 3 4"],
			["gd2", "*/ dy 5 4"],
			["gd3", "*/ dy 3 8"],
			["gd4", "*/ dy 1 8"],
			["gd5", "+- h 0 gd3"],
			["gd6", "+- gd4 h 0"],
			["y0", "+- t dy 0"],
			["y1", "+- t gd1 0"],
			["y2", "+- t gd2 0"],
			["y3", "+- t gd3 0"],
			["y4", "+- t gd4 0"],
			["y5", "+- t gd5 0"],
			["y6", "+- t gd6 0"],
			["x1", "+- l wd3 0"],
			["x2", "+- r 0 wd3"]
		],
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
				"C",
				"x1",
				"y1",
				"x2",
				"y2",
				"r",
				"y0"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y5"
			], [
				"C",
				"x1",
				"y6",
				"x2",
				"y6",
				"r",
				"y5"
			]]
		}]
	},
	textcurveup: {
		adj: [["adj", "val 45977"]],
		gd: [
			["a", "pin 0 adj 56338"],
			["dy", "*/ a h 100000"],
			["gd1", "*/ dy 3 4"],
			["gd2", "*/ dy 5 4"],
			["gd3", "*/ dy 3 8"],
			["gd4", "*/ dy 1 8"],
			["gd5", "+- h 0 gd3"],
			["gd6", "+- gd4 h 0"],
			["y0", "+- t dy 0"],
			["y1", "+- t gd1 0"],
			["y2", "+- t gd2 0"],
			["y3", "+- t gd3 0"],
			["y4", "+- t gd4 0"],
			["y5", "+- t gd5 0"],
			["y6", "+- t gd6 0"],
			["x1", "+- l wd3 0"],
			["x2", "+- r 0 wd3"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y0"
			], [
				"C",
				"x1",
				"y2",
				"x2",
				"y1",
				"r",
				"t"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y5"
			], [
				"C",
				"x1",
				"y6",
				"x2",
				"y6",
				"r",
				"y5"
			]]
		}]
	},
	textdeflate: {
		adj: [["adj", "val 18750"]],
		gd: [
			["a", "pin 0 adj 37500"],
			["dy", "*/ a ss 100000"],
			["gd0", "*/ dy 4 3"],
			["gd1", "+- h 0 gd0"],
			["adjY", "+- t dy 0"],
			["y0", "+- t gd0 0"],
			["y1", "+- t gd1 0"],
			["x0", "+- l wd3 0"],
			["x1", "+- r 0 wd3"]
		],
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
				"C",
				"x0",
				"y0",
				"x1",
				"y0",
				"r",
				"t"
			]]
		}, {
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
				"C",
				"x0",
				"y1",
				"x1",
				"y1",
				"r",
				"b"
			]]
		}]
	},
	textdeflatebottom: {
		adj: [["adj", "val 50000"]],
		gd: [
			["a", "pin 6250 adj 100000"],
			["dy", "*/ a ss 100000"],
			["dy2", "+- h 0 dy"],
			["y1", "+- t dy 0"],
			["cp", "+- y1 0 dy2"]
		],
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
				"t"
			]]
		}, {
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
				"Q",
				"hc",
				"cp",
				"r",
				"b"
			]]
		}]
	},
	textdeflateinflate: {
		adj: [["adj", "val 35000"]],
		gd: [
			["a", "pin 5000 adj 95000"],
			["dy", "*/ a h 100000"],
			["del", "*/ h 5 100"],
			["dh1", "*/ h 45 100"],
			["dh2", "*/ h 55 100"],
			["yh", "+- dy 0 del"],
			["yl", "+- dy del 0"],
			["y3", "+- yh yh dh1"],
			["y4", "+- yl yl dh2"]
		],
		paths: [
			{
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
					"t"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"l",
					"dh1"
				], [
					"Q",
					"hc",
					"y3",
					"r",
					"dh1"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"l",
					"dh2"
				], [
					"Q",
					"hc",
					"y4",
					"r",
					"dh2"
				]]
			},
			{
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
					"b"
				]]
			}
		]
	},
	textdeflateinflatedeflate: {
		adj: [["adj", "val 25000"]],
		gd: [
			["a", "pin 3000 adj 47000"],
			["dy", "*/ a h 100000"],
			["del", "*/ h 3 100"],
			["ey1", "*/ h 30 100"],
			["ey2", "*/ h 36 100"],
			["ey3", "*/ h 63 100"],
			["ey4", "*/ h 70 100"],
			["by", "+- b 0 dy"],
			["yh1", "+- dy 0 del"],
			["yl1", "+- dy del 0"],
			["yh2", "+- by 0 del"],
			["yl2", "+- by del 0"],
			["y1", "+- yh1 yh1 ey1"],
			["y2", "+- yl1 yl1 ey2"],
			["y3", "+- yh2 yh2 ey3"],
			["y4", "+- yl2 yl2 ey4"]
		],
		paths: [
			{
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
					"t"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"l",
					"ey1"
				], [
					"Q",
					"hc",
					"y1",
					"r",
					"ey1"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"l",
					"ey2"
				], [
					"Q",
					"hc",
					"y2",
					"r",
					"ey2"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"l",
					"ey3"
				], [
					"Q",
					"hc",
					"y3",
					"r",
					"ey3"
				]]
			},
			{
				w: null,
				h: null,
				fill: null,
				stroke: !0,
				extrusionOk: !0,
				cmds: [[
					"m",
					"l",
					"ey4"
				], [
					"Q",
					"hc",
					"y4",
					"r",
					"ey4"
				]]
			},
			{
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
					"b"
				]]
			}
		]
	},
	textdeflatetop: {
		adj: [["adj", "val 50000"]],
		gd: [
			["a", "pin 0 adj 93750"],
			["dy", "*/ a h 100000"],
			["y1", "+- t dy 0"],
			["cp", "+- y1 dy 0"]
		],
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
				"Q",
				"hc",
				"cp",
				"r",
				"t"
			]]
		}, {
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
				"b"
			]]
		}]
	},
	textdoublewave1: {
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
			["of", "*/ w a2 100000"],
			["of2", "*/ w a2 50000"],
			["x1", "abs of"],
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
			["xAdj", "+- hc of 0"]
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
				]
			]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x9",
					"y4"
				],
				[
					"C",
					"x10",
					"y5",
					"x11",
					"y6",
					"x12",
					"y4"
				],
				[
					"C",
					"x13",
					"y5",
					"x14",
					"y6",
					"x15",
					"y4"
				]
			]
		}]
	},
	textfadedown: {
		adj: [["adj", "val 33333"]],
		gd: [
			["a", "pin 0 adj 49999"],
			["dx", "*/ a w 100000"],
			["x1", "+- l dx 0"],
			["x2", "+- r 0 dx"]
		],
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
				"t"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x1",
				"b"
			], [
				"l",
				"x2",
				"b"
			]]
		}]
	},
	textfadeleft: {
		adj: [["adj", "val 33333"]],
		gd: [
			["a", "pin 0 adj 49999"],
			["dy", "*/ a h 100000"],
			["y1", "+- t dy 0"],
			["y2", "+- b 0 dy"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y1"
			], [
				"l",
				"r",
				"t"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y2"
			], [
				"l",
				"r",
				"b"
			]]
		}]
	},
	textfaderight: {
		adj: [["adj", "val 33333"]],
		gd: [
			["a", "pin 0 adj 49999"],
			["dy", "*/ a h 100000"],
			["y1", "+- t dy 0"],
			["y2", "+- b 0 dy"]
		],
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
				"y1"
			]]
		}, {
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
				"y2"
			]]
		}]
	},
	textfadeup: {
		adj: [["adj", "val 33333"]],
		gd: [
			["a", "pin 0 adj 49999"],
			["dx", "*/ a w 100000"],
			["x1", "+- l dx 0"],
			["x2", "+- r 0 dx"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x1",
				"t"
			], [
				"l",
				"x2",
				"t"
			]]
		}, {
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
				"b"
			]]
		}]
	},
	textinflate: {
		adj: [["adj", "val 18750"]],
		gd: [
			["a", "pin 0 adj 20000"],
			["dy", "*/ a h 100000"],
			["gd", "*/ dy 1 3"],
			["gd0", "+- 0 0 gd"],
			["gd1", "+- h 0 gd0"],
			["ty", "+- t dy 0"],
			["by", "+- b 0 dy"],
			["y0", "+- t gd0 0"],
			["y1", "+- t gd1 0"],
			["x0", "+- l wd3 0"],
			["x1", "+- r 0 wd3"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"ty"
			], [
				"C",
				"x0",
				"y0",
				"x1",
				"y0",
				"r",
				"ty"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"by"
			], [
				"C",
				"x0",
				"y1",
				"x1",
				"y1",
				"r",
				"by"
			]]
		}]
	},
	textinflatebottom: {
		adj: [["adj", "val 60000"]],
		gd: [
			["a", "pin 60000 adj 100000"],
			["dy", "*/ a h 100000"],
			["ty", "+- t dy 0"]
		],
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
				"t"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"ty"
			], [
				"Q",
				"hc",
				"b",
				"r",
				"ty"
			]]
		}]
	},
	textinflatetop: {
		adj: [["adj", "val 40000"]],
		gd: [
			["a", "pin 0 adj 50000"],
			["dy", "*/ a h 100000"],
			["ty", "+- t dy 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"ty"
			], [
				"Q",
				"hc",
				"t",
				"r",
				"ty"
			]]
		}, {
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
				"b"
			]]
		}]
	},
	textplain: {
		adj: [["adj", "val 50000"]],
		gd: [
			["a", "pin 30000 adj 70000"],
			["mid", "*/ a w 100000"],
			["midDir", "+- mid 0 hc"],
			["dl", "+- mid 0 l"],
			["dr", "+- r 0 mid"],
			["dl2", "*/ dl 2 1"],
			["dr2", "*/ dr 2 1"],
			["dx", "?: midDir dr2 dl2"],
			["xr", "+- l dx 0"],
			["xl", "+- r 0 dx"],
			["tlx", "?: midDir l xl"],
			["trx", "?: midDir xr r"],
			["blx", "?: midDir xl l"],
			["brx", "?: midDir r xr"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"tlx",
				"t"
			], [
				"l",
				"trx",
				"t"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"blx",
				"b"
			], [
				"l",
				"brx",
				"b"
			]]
		}]
	},
	textringinside: {
		adj: [["adj", "val 60000"]],
		gd: [
			["a", "pin 50000 adj 99000"],
			["dy", "*/ a h 100000"],
			["y", "+- t dy 0"],
			["r", "*/ dy 1 2"],
			["y1", "+- t r 0"],
			["y2", "+- b 0 r"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y1"
			], [
				"a",
				"wd2",
				"r",
				"10800000",
				"21599999"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y2"
			], [
				"a",
				"wd2",
				"r",
				"10800000",
				"21599999"
			]]
		}]
	},
	textringoutside: {
		adj: [["adj", "val 60000"]],
		gd: [
			["a", "pin 50000 adj 99000"],
			["dy", "*/ a h 100000"],
			["y", "+- t dy 0"],
			["r", "*/ dy 1 2"],
			["y1", "+- t r 0"],
			["y2", "+- b 0 r"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y1"
			], [
				"a",
				"wd2",
				"r",
				"10800000",
				"-21599999"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y2"
			], [
				"a",
				"wd2",
				"r",
				"10800000",
				"-21599999"
			]]
		}]
	},
	textslantdown: {
		adj: [["adj", "val 44445"]],
		gd: [
			["a", "pin 28569 adj 100000"],
			["dy", "*/ a h 100000"],
			["y1", "+- t dy 0"],
			["y2", "+- b 0 dy"]
		],
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
				"y2"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y1"
			], [
				"l",
				"r",
				"b"
			]]
		}]
	},
	textslantup: {
		adj: [["adj", "val 55555"]],
		gd: [
			["a", "pin 0 adj 71431"],
			["dy", "*/ a h 100000"],
			["y1", "+- t dy 0"],
			["y2", "+- b 0 dy"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"l",
				"y1"
			], [
				"l",
				"r",
				"t"
			]]
		}, {
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
				"y2"
			]]
		}]
	},
	textstop: {
		adj: [["adj", "val 25000"]],
		gd: [
			["a", "pin 14286 adj 50000"],
			["dx", "*/ w 1 3"],
			["dy", "*/ a h 100000"],
			["x1", "+- l dx 0"],
			["x2", "+- r 0 dx"],
			["y1", "+- t dy 0"],
			["y2", "+- b 0 dy"]
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
					"y1"
				]
			]
		}, {
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
					"b"
				],
				[
					"l",
					"x2",
					"b"
				],
				[
					"l",
					"r",
					"y2"
				]
			]
		}]
	},
	texttriangle: {
		adj: [["adj", "val 50000"]],
		gd: [["a", "pin 0 adj 100000"], ["y", "*/ a h 100000"]],
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
					"y"
				],
				[
					"l",
					"hc",
					"t"
				],
				[
					"l",
					"r",
					"y"
				]
			]
		}, {
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
				"b"
			]]
		}]
	},
	texttriangleinverted: {
		adj: [["adj", "val 50000"]],
		gd: [["a", "pin 0 adj 100000"], ["y", "*/ a h 100000"]],
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
				"t"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"l",
					"y"
				],
				[
					"l",
					"hc",
					"b"
				],
				[
					"l",
					"r",
					"y"
				]
			]
		}]
	},
	textwave1: {
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
			["of", "*/ w a2 100000"],
			["of2", "*/ w a2 50000"],
			["x1", "abs of"],
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
			["xAdj", "+- hc of 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x2",
				"y1"
			], [
				"C",
				"x3",
				"y2",
				"x4",
				"y3",
				"x5",
				"y1"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x6",
				"y4"
			], [
				"C",
				"x7",
				"y5",
				"x8",
				"y6",
				"x10",
				"y4"
			]]
		}]
	},
	textwave2: {
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
			["of", "*/ w a2 100000"],
			["of2", "*/ w a2 50000"],
			["x1", "abs of"],
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
			["xAdj", "+- hc of 0"]
		],
		paths: [{
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x2",
				"y1"
			], [
				"C",
				"x3",
				"y3",
				"x4",
				"y2",
				"x5",
				"y1"
			]]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [[
				"m",
				"x6",
				"y4"
			], [
				"C",
				"x7",
				"y6",
				"x8",
				"y5",
				"x10",
				"y4"
			]]
		}]
	},
	textwave4: {
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
			["of", "*/ w a2 100000"],
			["of2", "*/ w a2 50000"],
			["x1", "abs of"],
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
			["xAdj", "+- hc of 0"]
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
					"y3",
					"x4",
					"y2",
					"x5",
					"y1"
				],
				[
					"C",
					"x6",
					"y3",
					"x7",
					"y2",
					"x8",
					"y1"
				]
			]
		}, {
			w: null,
			h: null,
			fill: null,
			stroke: !0,
			extrusionOk: !0,
			cmds: [
				[
					"m",
					"x9",
					"y4"
				],
				[
					"C",
					"x10",
					"y6",
					"x11",
					"y5",
					"x12",
					"y4"
				],
				[
					"C",
					"x13",
					"y6",
					"x14",
					"y5",
					"x15",
					"y4"
				]
			]
		}]
	}
}, tt = Math.PI * 2 / 216e5, nt = et, rt = /* @__PURE__ */ new Map();
function it(e) {
	return e.toLowerCase() in nt;
}
function at(e) {
	let t = rt.get(e);
	if (t) return t;
	let n = nt[e];
	return n ? (t = {
		adj: n.adj.map(([e, t]) => [e, y(t)]),
		gd: n.gd.map(([e, t]) => [e, y(t)]),
		paths: n.paths
	}, rt.set(e, t), t) : null;
}
var ot = 48;
function st(e, t, n, r) {
	let i = e.w == null ? 1 : n / e.w, a = e.h == null ? 1 : r / e.h, o = (e) => e * i, s = (e) => e * a, c = [], l = 0, u = 0;
	for (let n of e.cmds) switch (n[0]) {
		case "m":
			l = o(t.resolve(n[1])), u = s(t.resolve(n[2])), c.push({
				x: l,
				y: u
			});
			break;
		case "l":
			l = o(t.resolve(n[1])), u = s(t.resolve(n[2])), c.push({
				x: l,
				y: u
			});
			break;
		case "C": {
			let e = o(t.resolve(n[1])), r = s(t.resolve(n[2])), i = o(t.resolve(n[3])), a = s(t.resolve(n[4])), d = o(t.resolve(n[5])), f = s(t.resolve(n[6]));
			for (let t = 1; t <= ot; t++) {
				let n = t / ot, o = 1 - n, s = o * o * o * l + 3 * o * o * n * e + 3 * o * n * n * i + n * n * n * d, p = o * o * o * u + 3 * o * o * n * r + 3 * o * n * n * a + n * n * n * f;
				c.push({
					x: s,
					y: p
				});
			}
			l = d, u = f;
			break;
		}
		case "Q": {
			let e = o(t.resolve(n[1])), r = s(t.resolve(n[2])), i = o(t.resolve(n[3])), a = s(t.resolve(n[4]));
			for (let t = 1; t <= ot; t++) {
				let n = t / ot, o = 1 - n, s = o * o * l + 2 * o * n * e + n * n * i, d = o * o * u + 2 * o * n * r + n * n * a;
				c.push({
					x: s,
					y: d
				});
			}
			l = i, u = a;
			break;
		}
		case "a": {
			let e = t.resolve(n[1]), r = t.resolve(n[2]), o = e * i, s = r * a, d = t.resolve(n[3]) * tt, f = t.resolve(n[4]) * tt, p = (t) => Math.atan2(e * Math.sin(t), r * Math.cos(t)), m = Math.PI * 2, h = p(d), g = Math.trunc(f / m), _ = f - g * m, v = p(d + _) - h;
			_ > 0 && v < 0 ? v += m : _ < 0 && v > 0 && (v -= m);
			let y = v + g * m, b = l - o * Math.cos(h), x = u - s * Math.sin(h), S = Math.max(ot, Math.ceil(Math.abs(y) / m * 96));
			for (let e = 1; e <= S; e++) {
				let t = h + y * e / S;
				c.push({
					x: b + o * Math.cos(t),
					y: x + s * Math.sin(t)
				});
			}
			l = b + o * Math.cos(h + y), u = x + s * Math.sin(h + y);
			break;
		}
		case "c": break;
	}
	return c;
}
function ct(e) {
	let t = [0];
	for (let n = 1; n < e.length; n++) {
		let r = e[n].x - e[n - 1].x, i = e[n].y - e[n - 1].y;
		t.push(t[n - 1] + Math.hypot(r, i));
	}
	return t;
}
function lt(e, t, n, r) {
	let i = at(e.toLowerCase());
	if (!i || i.paths.length === 0) return null;
	let a = c({
		w: n,
		h: r,
		adj: t
	}, i.adj, i.gd), o = i.paths.length === 1, s = st(i.paths[0], a, n, r), l = o ? s : st(i.paths[i.paths.length - 1], a, n, r);
	return {
		top: s,
		bottom: l,
		topLen: ct(s),
		bottomLen: ct(l),
		singleEdge: o
	};
}
function ut(e, t, n) {
	let r = t[t.length - 1];
	if (e.length === 1 || r === 0) return {
		x: e[0].x,
		y: e[0].y,
		tx: 1,
		ty: 0
	};
	let i = Math.max(0, Math.min(1, n)) * r, a = 0, o = t.length - 1;
	for (; a < o - 1;) {
		let e = a + o >> 1;
		t[e] <= i ? a = e : o = e;
	}
	let s = t[o] - t[a] || 1, c = (i - t[a]) / s, l = e[a], u = e[o], d = u.x - l.x, f = u.y - l.y, p = Math.hypot(d, f) || 1;
	return {
		x: l.x + d * c,
		y: l.y + f * c,
		tx: d / p,
		ty: f / p
	};
}
function dt(e) {
	return e.topLen[e.topLen.length - 1] ?? 0;
}
function ft(e, t) {
	if (!e.singleEdge) return 1;
	let n = dt(e);
	return n <= 0 ? 1 : Math.max(0, Math.min(1, t / n));
}
function pt(e, t, n, r) {
	if (e.singleEdge) {
		let i = ut(e.top, e.topLen, t), a = Math.atan2(i.ty, i.tx), o = i.ty, s = -i.tx, c = n * (1 - r);
		return {
			x: i.x - o * c,
			y: i.y - s * c,
			angle: a,
			vScale: 1,
			shear: 0
		};
	}
	let i = ut(e.top, e.topLen, t), a = ut(e.bottom, e.bottomLen, t), o = a.x - i.x, s = a.y - i.y, c = i.x + o * r, l = i.y + s * r, u = i.tx + a.tx, d = i.ty + a.ty, f = Math.atan2(d, u), p = Math.cos(f), m = Math.sin(f), h = (p * o + m * s) / (n > 0 ? n : 1), g = (-m * o + p * s) / (n > 0 ? n : 1);
	return {
		x: c,
		y: l,
		angle: f,
		vScale: g === 0 ? n > 0 ? Math.hypot(o, s) / n : 1 : g,
		shear: g === 0 ? 0 : h / g
	};
}
//#endregion
//#region packages/core/src/shape/scene3d-camera.ts
var mt = 26, ht = {
	orthographicFront: {
		kind: "orthographic",
		baseLat: 0,
		baseLon: 0,
		baseRev: 0,
		fovDeg: 0
	},
	perspectiveFront: {
		kind: "perspective",
		baseLat: 0,
		baseLon: 0,
		baseRev: 0,
		fovDeg: mt
	},
	perspectiveRelaxed: {
		kind: "perspective",
		baseLat: 0,
		baseLon: 0,
		baseRev: 0,
		fovDeg: mt
	},
	perspectiveRelaxedModerately: {
		kind: "perspective",
		baseLat: 0,
		baseLon: 0,
		baseRev: 0,
		fovDeg: mt
	},
	perspectiveAbove: {
		kind: "perspective",
		baseLat: -20,
		baseLon: 0,
		baseRev: 0,
		fovDeg: mt
	},
	perspectiveBelow: {
		kind: "perspective",
		baseLat: 20,
		baseLon: 0,
		baseRev: 0,
		fovDeg: mt
	},
	perspectiveLeft: {
		kind: "perspective",
		baseLat: 0,
		baseLon: -20,
		baseRev: 0,
		fovDeg: mt
	},
	perspectiveRight: {
		kind: "perspective",
		baseLat: 0,
		baseLon: 20,
		baseRev: 0,
		fovDeg: mt
	}
};
function gt(e, t) {
	let n = Array(9).fill(0);
	for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) {
		let a = 0;
		for (let n = 0; n < 3; n++) a += e[r * 3 + n] * t[n * 3 + i];
		n[r * 3 + i] = a;
	}
	return n;
}
function _t(e) {
	let t = e * Math.PI / 180, n = Math.cos(t), r = Math.sin(t);
	return [
		1,
		0,
		0,
		0,
		n,
		-r,
		0,
		r,
		n
	];
}
function vt(e) {
	let t = e * Math.PI / 180, n = Math.cos(t), r = Math.sin(t);
	return [
		n,
		0,
		r,
		0,
		1,
		0,
		-r,
		0,
		n
	];
}
function yt(e) {
	let t = e * Math.PI / 180, n = Math.cos(t), r = Math.sin(t);
	return [
		n,
		-r,
		0,
		r,
		n,
		0,
		0,
		0,
		1
	];
}
function bt(e, t, n, r) {
	return [
		e[0] * t + e[1] * n + e[2] * r,
		e[3] * t + e[4] * n + e[5] * r,
		e[6] * t + e[7] * n + e[8] * r
	];
}
function xt(e, t) {
	let n = t ? t.lat : e.baseLat, r = t ? t.lon : e.baseLon;
	return gt(yt(-(t ? t.rev : e.baseRev)), gt(_t(-n), vt(-r)));
}
function St(e) {
	return ht[e] || (e.startsWith("perspective") ? ht.perspectiveFront : ht.orthographicFront);
}
function Ct(e, t, n) {
	let r = St(e.prst), i = xt(r, e.rot);
	if (t <= 0 || n <= 0) return {
		corners: [
			{
				x: 0,
				y: 0
			},
			{
				x: t,
				y: 0
			},
			{
				x: t,
				y: n
			},
			{
				x: 0,
				y: n
			}
		],
		isAffine: !0,
		isIdentity: !0
	};
	let a = t / 2, o = n / 2, s = [
		[-a, -o],
		[a, -o],
		[a, o],
		[-a, o]
	], c = e.zoom ?? 1, l = Math.max(a, o), u;
	if (r.kind === "perspective") {
		let t = e.fov ?? r.fovDeg, n = Math.max(1, Math.min(179, t)) * Math.PI / 180, a = l / Math.tan(n / 2);
		u = s.map(([e, t]) => {
			let [n, r, o] = bt(i, e, t, 0), s = a - o, c = a / (Math.abs(s) < 1e-6 ? 1e-6 * Math.sign(s || 1) : s);
			return [n * c, r * c];
		});
	} else u = s.map(([e, t]) => {
		let [n, r] = bt(i, e, t, 0);
		return [n, r];
	});
	u = u.map(([e, t]) => [e * c, t * c]);
	let d = u.map(([e, r]) => ({
		x: t / 2 + e,
		y: n / 2 + r
	})), f = .001 * Math.max(t, n), p = d[0].x + d[2].x - (d[1].x + d[3].x), m = d[0].y + d[2].y - (d[1].y + d[3].y), h = Math.abs(p) < f && Math.abs(m) < f, g = [
		[0, 0],
		[t, 0],
		[t, n],
		[0, n]
	], _ = !0;
	for (let e = 0; e < 4; e++) if (Math.abs(d[e].x - g[e][0]) > f || Math.abs(d[e].y - g[e][1]) > f) {
		_ = !1;
		break;
	}
	return {
		corners: d,
		isAffine: h,
		isIdentity: _
	};
}
function wt(e) {
	let { isIdentity: t } = Ct(e, 1e3, 1e3);
	return !t;
}
function Tt(e, t, n, r) {
	let i = St(e.prst), a = xt(i, e.rot);
	if (t <= 0 || n <= 0 || r === 0) return {
		x: 0,
		y: 0
	};
	let o = t / 2, s = n / 2, c = Math.max(o, s), l = e.zoom ?? 1, u = (t) => {
		let [n, r, o] = bt(a, 0, 0, t);
		if (i.kind === "perspective") {
			let t = e.fov ?? i.fovDeg, a = Math.max(1, Math.min(179, t)) * Math.PI / 180, s = c / Math.tan(a / 2), u = s - o, d = s / (Math.abs(u) < 1e-6 ? 1e-6 * Math.sign(u || 1) : u);
			return [n * d * l, r * d * l];
		}
		return [n * l, r * l];
	}, [d, f] = u(0), [p, m] = u(-r);
	return {
		x: p - d,
		y: m - f
	};
}
//#endregion
//#region packages/core/src/shape/bevel-shading.ts
function Et(e, t) {
	if (t <= 0) return () => 1;
	let n = (e) => Math.max(0, Math.min(1, e / t));
	switch (e) {
		case "hardEdge": {
			let e = Pt;
			return (t) => {
				let r = Math.min(1, n(t) / e);
				return r * r * (3 - 2 * r);
			};
		}
		case "angle":
		case "slope": return (e) => n(e);
		case "circle":
		case "convex":
		case "softRound": return (e) => {
			let t = 1 - n(e);
			return Math.sqrt(Math.max(0, 1 - t * t));
		};
		default: return (e) => {
			let t = n(e);
			return t * t * (3 - 2 * t);
		};
	}
}
function Dt(e) {
	let t = e.length, n = new Float64Array(t);
	if (t === 0) return n;
	let r = new Int32Array(t), i = new Float64Array(t + 1), a = 0;
	r[0] = 0, i[0] = -Infinity, i[1] = Infinity;
	for (let n = 1; n < t; n++) {
		let t = (e[n] + n * n - (e[r[a]] + r[a] * r[a])) / (2 * n - 2 * r[a]);
		for (; t <= i[a];) a--, t = (e[n] + n * n - (e[r[a]] + r[a] * r[a])) / (2 * n - 2 * r[a]);
		a++, r[a] = n, i[a] = t, i[a + 1] = Infinity;
	}
	a = 0;
	for (let o = 0; o < t; o++) {
		for (; i[a + 1] < o;) a++;
		let t = o - r[a];
		n[o] = t * t + e[r[a]];
	}
	return n;
}
function Ot(e, t = 3) {
	if (e <= 0) return Array(t).fill(1);
	let n = Math.sqrt(12 * e * e / t + 1), r = Math.floor(n);
	r % 2 == 0 && r--;
	let i = r + 2, a = (12 * e * e - t * r * r - 4 * t * r - 3 * t) / (-4 * r - 4), o = Math.round(a), s = [];
	for (let e = 0; e < t; e++) s.push(e < o ? r : i);
	return s;
}
function kt(e, t, n, r, i, a) {
	let o = 1 / (2 * i + 1);
	if (a) for (let a = 0; a < r; a++) {
		let r = a * n, s = 0;
		for (let t = 0; t <= i; t++) t < n && (s += e[r + t]);
		for (let a = 0; a < n; a++) {
			t[r + a] = s * o;
			let c = a + i + 1, l = a - i;
			c < n && (s += e[r + c]), l >= 0 && (s -= e[r + l]);
		}
	}
	else for (let a = 0; a < n; a++) {
		let s = 0;
		for (let t = 0; t <= i; t++) t < r && (s += e[t * n + a]);
		for (let c = 0; c < r; c++) {
			t[c * n + a] = s * o;
			let l = c + i + 1, u = c - i;
			l < r && (s += e[l * n + a]), u >= 0 && (s -= e[u * n + a]);
		}
	}
}
function At(e, t, n, r) {
	let i = Float64Array.from(e);
	if (r <= 0 || t <= 0 || n <= 0) return i;
	let a = new Float64Array(t * n);
	for (let e of Ot(r, 3)) {
		let r = Math.max(1, (e - 1) / 2);
		kt(i, a, t, n, r, !0), kt(a, i, t, n, r, !1);
	}
	return i;
}
function jt(e, t, n, r = 128) {
	let i = new Float64Array(t * n);
	for (let a = 0; a < t * n; a++) i[a] = (e[a] ?? 0) >= r ? 0x56bc75e2d63100000 : 0;
	let a = new Float64Array(n);
	for (let e = 0; e < t; e++) {
		for (let r = 0; r < n; r++) a[r] = i[r * t + e];
		let r = Dt(a);
		for (let a = 0; a < n; a++) i[a * t + e] = r[a];
	}
	let o = new Float64Array(t);
	for (let e = 0; e < n; e++) {
		for (let n = 0; n < t; n++) o[n] = i[e * t + n];
		let n = Dt(o);
		for (let r = 0; r < t; r++) i[e * t + r] = n[r];
	}
	for (let e = 0; e < n; e++) for (let r = 0; r < t; r++) {
		let a = e * t + r;
		if (i[a] === 0) continue;
		let o = (e + 1) * (e + 1), s = (n - e) * (n - e), c = (r + 1) * (r + 1), l = (t - r) * (t - r), u = Math.min(o, s, c, l);
		u < i[a] && (i[a] = u);
	}
	for (let e = 0; e < t * n; e++) i[e] = Math.sqrt(i[e]);
	return i;
}
var Mt = .25, Nt = .35, Pt = .5;
function Ft(e, t, n, r, i, a) {
	let o = new Float32Array(t * n * 3), s = new Uint8Array(t * n), c = new Float32Array(t * n);
	if (t <= 0 || n <= 0) return {
		normals: o,
		bandMask: s,
		bandWeight: c
	};
	let l = jt(e, t, n), u = Et(i, r), d = (n, r) => (e[r * t + n] ?? 0) >= 128, f = (r > 0 ? a / r : 0) * r, p = At(l, t, n, Math.max(1, r * Mt)), m = (e) => {
		let t = u(Math.max(0, e - .5));
		return u(e + .5) - t;
	};
	for (let e = 0; e < n; e++) for (let i = 0; i < t; i++) {
		let a = e * t + i;
		if (!d(i, e)) {
			o[a * 3 + 2] = 1;
			continue;
		}
		let u = l[a], h = u > 0 && u < r;
		if (s[a] = +!!h, !h) {
			o[a * 3 + 2] = 1;
			continue;
		}
		let g = u / r, _ = 1 - Nt, v = 1;
		if (g > _) {
			let e = Math.min(1, (g - _) / Nt);
			v = 1 - e * e * (3 - 2 * e);
		}
		c[a] = v;
		let y = i > 0 ? i - 1 : i, b = i < t - 1 ? i + 1 : i, x = e > 0 ? e - 1 : e, S = e < n - 1 ? e + 1 : e, C = (p[e * t + b] - p[e * t + y]) / (b - y || 1), w = (p[S * t + i] - p[x * t + i]) / (S - x || 1), T = Math.hypot(C, w), E = 0, D = 0;
		T > 1e-9 && (E = -C / T, D = -w / T);
		let O = m(u) * f, k = O * E, A = O * D, j = 1, M = Math.hypot(k, A, j) || 1;
		k /= M, A /= M, j /= M, o[a * 3] = k, o[a * 3 + 1] = A, o[a * 3 + 2] = j;
	}
	return {
		normals: o,
		bandMask: s,
		bandWeight: c
	};
}
var It = 35 * Math.PI / 180, Lt = 12 * Math.PI / 180, Rt = {
	t: {
		x: 0,
		y: -1
	},
	b: {
		x: 0,
		y: 1
	},
	l: {
		x: -1,
		y: 0
	},
	r: {
		x: 1,
		y: 0
	},
	tl: {
		x: -1,
		y: -1
	},
	tr: {
		x: 1,
		y: -1
	},
	bl: {
		x: -1,
		y: 1
	},
	br: {
		x: 1,
		y: 1
	}
};
function zt(e, t, n) {
	let r = n * Math.PI / 180, i = Math.cos(r), a = Math.sin(r);
	return {
		x: e * i - t * a,
		y: e * a + t * i
	};
}
function Bt(e, t, n) {
	let r = Rt[t] ?? Rt.t;
	return n && n.rev && (r = zt(r.x, r.y, n.rev)), Ht(r.x, r.y, It);
}
function Vt(e) {
	let t = Math.hypot(e.x, e.y) || 1;
	return Ht(-e.x / t, -e.y / t, Lt);
}
function Ht(e, t, n) {
	let r = Math.hypot(e, t) || 1, i = Math.cos(n), a = Math.sin(n), o = e / r * i, s = t / r * i, c = a, l = Math.hypot(o, s, c) || 1;
	return {
		x: o / l,
		y: s / l,
		z: c / l
	};
}
var Ut = 2, Wt = {
	matte: {
		ambient: .62,
		diffuse: .45,
		specular: 0,
		shininess: 8
	},
	plastic: {
		ambient: .55,
		diffuse: .5,
		specular: .35,
		shininess: 22
	}
}, Gt = .8;
function Kt(e) {
	switch (e) {
		case "plastic":
		case "metal":
		case "clear":
		case "softEdge":
		case "shiny":
		case "softmetal": return "plastic";
		default: return "matte";
	}
}
function qt(e, t, n = !0) {
	let r = Wt[e], i = {
		light: t,
		material: e,
		ambient: r.ambient,
		diffuse: r.diffuse,
		specular: r.specular,
		shininess: r.shininess
	};
	return n && (i.fillLight = Vt(t), i.fillDiffuse = i.diffuse * Gt), i;
}
function Jt(e, t) {
	let n = e.x * t.light.x + e.y * t.light.y + e.z * t.light.z, r = t.diffuse * Math.max(0, n), i = 0;
	if (t.fillLight && t.fillDiffuse) {
		let n = e.x * t.fillLight.x + e.y * t.fillLight.y + e.z * t.fillLight.z;
		i = t.fillDiffuse * Math.max(0, n);
	}
	let a = 0;
	if (t.specular > 0) {
		let n = t.light.x, r = t.light.y, i = t.light.z + 1, o = Math.hypot(n, r, i) || 1, s = (e.x * n + e.y * r + e.z * i) / o;
		a = t.specular * Math.max(0, s) ** +t.shininess;
	}
	return Math.max(0, t.ambient + r + i + a);
}
function Yt(e, t, n) {
	if (!e) return {
		x: 0,
		y: 0,
		w: t,
		h: n
	};
	let r = Math.max(0, Math.floor(e.x)), i = Math.max(0, Math.floor(e.y)), a = Math.min(t, Math.ceil(e.x + e.w)), o = Math.min(n, Math.ceil(e.y + e.h));
	return {
		x: r,
		y: i,
		w: Math.max(0, a - r),
		h: Math.max(0, o - i)
	};
}
function Xt(e, t, n) {
	let r = e.canvas.width, i = e.canvas.height;
	if (r <= 0 || i <= 0) return;
	let a = t.widthPx;
	if (a < .75) return;
	let { x: o, y: s, w: c, h: l } = Yt(n, r, i);
	if (c <= 0 || l <= 0) return;
	let u = e.getImageData(o, s, c, l), d = u.data, f = new Uint8ClampedArray(c * l);
	for (let e = 0; e < c * l; e++) f[e] = d[e * 4 + 3];
	let { bandMask: p, bandWeight: m, normals: h } = Ft(f, c, l, a, t.prst, t.heightPx), g = qt(t.material, t.light), _ = Jt({
		x: 0,
		y: 0,
		z: 1
	}, g) || 1;
	for (let e = 0; e < c * l; e++) {
		if (p[e] === 0) continue;
		let n = m[e];
		if (n <= 0) continue;
		let r = h[e * 3], i = h[e * 3 + 1], a = h[e * 3 + 2];
		t.bottom && (r = -r, i = -i);
		let o = 1 + (Jt({
			x: r,
			y: i,
			z: a
		}, g) / _ - 1) * n, s = e * 4;
		if (o >= 1) {
			let e = Math.min(1, (o - 1) * Ut);
			for (let t = 0; t < 3; t++) {
				let n = Math.min(255, d[s + t] * o);
				d[s + t] = n + (255 - n) * e;
			}
		} else d[s] = Math.max(0, d[s] * o), d[s + 1] = Math.max(0, d[s + 1] * o), d[s + 2] = Math.max(0, d[s + 2] * o);
	}
	e.putImageData(u, o, s);
}
function Zt(e, t, n) {
	let r = e.canvas.width, i = e.canvas.height;
	if (r <= 0 || i <= 0) return;
	let a = t.offsetX, o = t.offsetY, s = Math.hypot(a, o);
	if (s < .75) return;
	let { x: c, y: l, w: u, h: d } = Yt(n, r, i);
	if (u <= 0 || d <= 0) return;
	let f = e.getImageData(c, l, u, d), p = f.data, m = new Uint8ClampedArray(u * d);
	for (let e = 0; e < u * d; e++) m[e] = p[e * 4 + 3];
	let h = Math.max(1, Math.ceil(s)), [g, _, v] = t.rgb;
	for (let e = 0; e < d; e++) for (let t = 0; t < u; t++) {
		let n = e * u + t;
		if (m[n] >= 128) continue;
		let r = !1;
		for (let n = 1; n <= h; n++) {
			let i = n / h, s = Math.round(t - a * i), c = Math.round(e - o * i);
			if (!(s < 0 || c < 0 || s >= u || c >= d) && m[c * u + s] >= 128) {
				r = !0;
				break;
			}
		}
		if (!r) continue;
		let i = n * 4;
		p[i] = g, p[i + 1] = _, p[i + 2] = v, p[i + 3] = 255;
	}
	e.putImageData(f, c, l);
}
//#endregion
//#region packages/core/src/text/underline.ts
function Qt(t, n, r, i, a, o, s, c = 1) {
	let l = Math.max(1, a * .05), u = s === "heavy" || (s?.endsWith("Heavy") ?? !1) ? l * 1.8 : l, d = r + Math.max(2, u), f = e(d, u, c);
	if (t.strokeStyle = o, t.lineWidth = u, t.setLineDash([]), s && s.startsWith("wavy")) {
		let e = u, r = u * 6;
		t.beginPath(), t.moveTo(n, d);
		let a = Math.max(1, u * .5);
		for (let o = 0; o <= i; o += a) {
			let i = d + Math.sin(o / r * Math.PI * 2) * e;
			t.lineTo(n + o, i);
		}
		if (t.stroke(), s === "wavyDbl") {
			t.beginPath(), t.moveTo(n, d + e * 2.5);
			for (let o = 0; o <= i; o += a) {
				let i = d + e * 2.5 + Math.sin(o / r * Math.PI * 2) * e;
				t.lineTo(n + o, i);
			}
			t.stroke();
		}
		return;
	}
	if (s === "dbl") {
		let r = u * 1.4, a = d - r / 2, o = d + r / 2;
		t.beginPath(), t.moveTo(n, a + e(a, u, c)), t.lineTo(n + i, a + e(a, u, c)), t.moveTo(n, o + e(o, u, c)), t.lineTo(n + i, o + e(o, u, c)), t.stroke();
		return;
	}
	t.setLineDash(Oe(s ?? "sng", u)), t.beginPath(), t.moveTo(n, d + f), t.lineTo(n + i, d + f), t.stroke(), t.setLineDash([]);
}
//#endregion
//#region packages/core/src/text/highlight-box.ts
function $t(e, t) {
	return {
		top: e - t * .85,
		height: t * 1.1
	};
}
//#endregion
//#region packages/core/src/text/justify-positions.ts
function en(e, t, n, r, i = 0) {
	let a = [], o = 0, s = 0;
	for (let c of t) a.push({
		text: e.slice(o, c).join(""),
		dx: r(e.slice(0, o).join("")) + o * i + s * n
	}), o = c, s++;
	return a.push({
		text: e.slice(o).join(""),
		dx: r(e.slice(0, o).join("")) + o * i + s * n
	}), a;
}
//#endregion
//#region packages/pptx/src/reflection-blur.ts
var tn = .5;
function nn(e, t) {
	if (!(t > 0) || !(e.h > 0)) return [{
		y: e.y,
		h: Math.max(0, e.h),
		radius: 0
	}];
	let n = Math.max(4, Math.min(24, Math.ceil(t / tn) + 1)), r = e.y + e.h, i = [];
	for (let a = 0; a < n; a++) {
		let o = Math.sqrt(a / (n - 1)), s = a === 0 ? 0 : Math.sqrt((a - 1) / (n - 1)), c = a === n - 1 ? 1 : Math.sqrt((a + 1) / (n - 1)), l = a === 0 ? 0 : (s + o) / 2, u = a === n - 1 ? 1 : (o + c) / 2, d = r - u * e.h;
		i.push({
			y: d,
			h: (u - l) * e.h,
			radius: t * a / (n - 1)
		});
	}
	return i;
}
function rn(e, t, n, r, i) {
	for (let a of nn(n, r)) e.save(), e.beginPath(), e.rect(0, a.y, i, a.h), e.clip(), e.filter = a.radius > 0 ? `blur(${a.radius}px)` : "none", e.drawImage(t, 0, 0), e.restore();
}
//#endregion
//#region packages/pptx/src/hyperlink.ts
function an(e, t) {
	let n = e !== void 0 && e !== "" ? e : void 0, r = t !== void 0 && t !== "" ? t : void 0;
	if (n === void 0 && r === void 0) return;
	if (r !== void 0) return {
		kind: "internal",
		ref: n ?? r
	};
	let i = n, a = H(i);
	return a !== null && ie.includes(a) ? {
		kind: "external",
		url: i
	} : {
		kind: "internal",
		ref: i
	};
}
//#endregion
//#region packages/pptx/src/media-chrome.ts
function on(e, t, n, r, i, a) {
	let o = Math.max(18, Math.min(32, Math.min(r, i) * .25));
	if (e.save(), e.shadowColor = "rgba(0, 0, 0, 0.3)", e.shadowBlur = o * .35, e.fillStyle = "rgba(20, 20, 20, 0.7)", e.beginPath(), e.arc(t, n, o, 0, Math.PI * 2), e.fill(), e.shadowColor = "transparent", e.shadowBlur = 0, e.fillStyle = "#fff", a === "paused") {
		e.beginPath();
		let r = o * .48;
		e.moveTo(t - r * .4, n - r), e.lineTo(t - r * .4, n + r), e.lineTo(t + r * .75, n), e.closePath(), e.fill();
	} else {
		let r = o * .2, i = o * .8, a = o * .15;
		e.fillRect(t - a - r, n - i / 2, r, i), e.fillRect(t + a, n - i / 2, r, i);
	}
	e.restore();
}
//#endregion
//#region packages/pptx/src/bidi-line.ts
var sn = (e) => {
	let t = e.text;
	return typeof t == "string" ? t : void 0;
}, cn = (e) => "isTab" in e;
function ln(e) {
	for (let t of e) {
		let e = sn(t);
		if (e !== void 0 && ee(e)) return !0;
	}
	return !1;
}
function un(e, n) {
	let r = e.length;
	if (r === 0) return {
		order: [],
		rtl: []
	};
	let i = "", a = Array(r), o;
	for (let t = 0; t < r; t++) {
		a[t] = i.length;
		let n = sn(e[t]) ?? "";
		if (i += n.length > 0 ? n : "￼", cn(e[t])) {
			for (o ??= []; o.length < i.length;) o.push(null);
			o[a[t]] = "S";
		}
	}
	if (o) for (; o.length < i.length;) o.push(null);
	let { levels: s, paragraphLevel: c } = p().computeLevels(i, n ? "rtl" : "ltr", o), { order: l, segLevels: u } = t(s, c, a), d = Array(r);
	for (let e = 0; e < r; e++) d[e] = (u[e] & 1) == 1;
	return {
		order: l,
		rtl: d
	};
}
//#endregion
//#region packages/pptx/src/cjk-wrap.ts
function dn(e, t, n, r, i = 0, a = !1) {
	if (e.length === 0) return 0;
	let s = t === 0, c = 0, l = t;
	for (let t of e) {
		let e = c > 0 || a ? i : 0;
		if (l + e + t.w > n) {
			if (c > 0 || !s) break;
			l += e + t.w, c++;
			break;
		}
		l += e + t.w, c++;
	}
	return c === 0 ? 0 : c >= e.length ? e.length : o(e.map((e) => e.ch), c, r, +!!s);
}
//#endregion
//#region packages/pptx/src/text-justify.ts
var fn = (e) => /\s/.test(String.fromCodePoint(e));
function pn(e, t, n, r, i) {
	if (r === "just" && i) return null;
	let a = t - n;
	if (a <= .5) return null;
	let o = we(e, a, {
		firstContentSi: 0,
		lastDrawnSi: e.length,
		isGapChar: le,
		isWhitespace: fn,
		seaClusterGaps: r === "thaiDist"
	});
	if (!o) return null;
	let { perGap: s, perSeg: c } = o, l = [];
	for (let t = 0; t < e.length; t++) {
		let n = e[t], r = c.get(t), i = r?.trailingGap ? s : 0, a = r?.splitBefore;
		a && a.length > 0 ? l.push({
			...n,
			jext: i,
			splitBefore: [...a],
			perGap: s
		}) : l.push({
			...n,
			jext: i
		});
	}
	return l;
}
//#endregion
//#region packages/pptx/src/table-border-conflict.ts
function mn(e) {
	if (!e) return {
		r: 0,
		g: 0,
		b: 0
	};
	let t = e.replace(/^#/, "");
	return t.length < 6 || /[^0-9a-fA-F]/.test(t.slice(0, 6)) ? {
		r: 0,
		g: 0,
		b: 0
	} : {
		r: parseInt(t.slice(0, 2), 16),
		g: parseInt(t.slice(2, 4), 16),
		b: parseInt(t.slice(4, 6), 16)
	};
}
function hn(e) {
	let t = mn(e);
	return .299 * t.r + .587 * t.g + .114 * t.b;
}
function gn(e, t) {
	if (!e && !t) return null;
	if (!e) return t;
	if (!t) return e;
	if (e.width !== t.width) return e.width > t.width ? e : t;
	let n = hn(e.color), r = hn(t.color);
	return n === r || n < r ? e : t;
}
//#endregion
//#region packages/pptx/src/smartart-fallback-contrast.ts
function _n(e) {
	let t = P(e.length === 8 ? e.slice(0, 6) : e);
	if (!t) return null;
	let n = te(t[0], t[1], t[2]);
	if (e.length !== 8) return n;
	let r = Number.parseInt(e.slice(6, 8), 16);
	if (Number.isNaN(r)) return null;
	let i = r / 255;
	return i * n + (1 - i);
}
function vn(e) {
	if (!e) return null;
	if (e.fillType === "solid") return _n(e.color);
	if (e.fillType === "gradient") {
		let t = e.stops.map((e) => ({
			p: Math.min(1, Math.max(0, e.position)),
			l: _n(e.color)
		})).filter((e) => e.l !== null).sort((e, t) => e.p - t.p);
		if (t.length === 0) return null;
		let n = t[0], r = t[t.length - 1], i = n.l * n.p + r.l * (1 - r.p);
		for (let e = 0; e + 1 < t.length; e++) i += (t[e].l + t[e + 1].l) / 2 * (t[e + 1].p - t[e].p);
		return i;
	}
	return null;
}
function yn(e) {
	return e.name === "SmartArt" && e.id === void 0;
}
function bn(e, t) {
	let n = vn(e);
	if (n === null || n >= .5) return null;
	let r = _n(t.replace(/^#/, ""));
	return r !== null && r >= .5 ? null : "#FFFFFF";
}
//#endregion
//#region packages/pptx/src/tab-layout.ts
function xn(e, t, n, r, i, a = 0) {
	let o = e.map((e) => e.width), s = (t) => {
		let n = 0;
		for (let r = t; r < e.length && !e[r].isTab; r++) n += o[r];
		return n;
	}, c = n;
	for (let n = 0; n < e.length; n++) {
		if (!e[n].isTab) {
			c += o[n];
			continue;
		}
		let l = null;
		for (let e of t) e.pos > c && (l === null || e.pos < l.pos) && (l = e);
		if (l === null) if (a > 0) l = {
			pos: (Math.floor(c / a) + 1) * a,
			algn: "l"
		};
		else {
			o[n] = i, c += i;
			continue;
		}
		let u = s(n + 1), d = l.algn === "ctr" ? .5 : +(l.algn === "r" || l.algn === "dec"), f = l.pos - u * d;
		f + u > r && (f = r - u), f < c && (f = c), o[n] = f - c, c = f;
	}
	return o;
}
//#endregion
//#region packages/pptx/src/vertical-text.ts
var Sn = () => !1;
function Cn(e, t, n) {
	let r = e.textBaseline;
	e.textBaseline = "alphabetic";
	let i = e.measureText(t);
	e.textBaseline = r;
	let a = i.fontBoundingBoxAscent, o = i.fontBoundingBoxDescent;
	return typeof a == "number" && typeof o == "number" && (a !== 0 || o !== 0) ? (a - o) / 2 : .38 * n;
}
function wn(e, t) {
	let n = e.textAlign, r = e.textBaseline;
	e.textAlign = "center", e.textBaseline = "middle";
	let i = e.measureText(t);
	e.textAlign = n, e.textBaseline = r;
	let a = i.actualBoundingBoxAscent, o = i.actualBoundingBoxDescent;
	return typeof a == "number" && typeof o == "number" ? (a - o) / 2 : 0;
}
function Tn(e, t, n, r, i, a, o = "fill", s = Sn) {
	let c = e.textAlign, l = e.textBaseline, u = o === "stroke" ? e.strokeText.bind(e) : e.fillText.bind(e), d = r - Cn(e, t, i), f = 0;
	for (let o of t) {
		let t = o.codePointAt(0) ?? 0, l = R(t), p = e.measureText(o).width + a, m = l === "Tr" ? ce(t) : null, h = l === "Tr" && m === null && G(t), g = l === "U" || l === "Tu" || m !== null || h;
		if (re(t) && s(t)) {
			let t = n + f + p / 2;
			e.save(), e.translate(t, d), e.rotate(-Math.PI / 2), e.textAlign = "center", e.textBaseline = "middle", M(e, () => u(o, 0, 0)), e.restore();
		} else if (g) {
			let r = m === null && l === "Tu" ? F(t) : null, a = m === null ? r : m, s = a === null ? o : String.fromCodePoint(a), c = n + f + p / 2, h = r === null ? wn(e, s) / i : 0;
			e.save(), e.translate(c, d), e.rotate(-Math.PI / 2), e.textAlign = "center", e.textBaseline = "middle", u(s, 0, h * i), e.restore();
		} else if (l === "Tr") {
			let t = n + f + p / 2;
			e.textAlign = "center", e.textBaseline = "middle", u(o, t, d);
		} else e.textAlign = c, e.textBaseline = "alphabetic", u(o, n + f, r);
		f += p;
	}
	e.textAlign = c, e.textBaseline = l;
}
function En(e, t, n, r, i, a, o = "fill") {
	Tn(e, t, n, r, i, a, o, (t) => oe(e, t));
}
//#endregion
//#region packages/pptx/src/renderer.ts
function Y(e, t) {
	return e * t;
}
function Dn(e, t, n, r) {
	let i = Fe(Math.abs(e * n), Math.abs(t * n), r);
	return i ? {
		targetWidthPx: i.width,
		targetHeightPx: i.height
	} : void 0;
}
function X(e, t) {
	return Xe(e, t);
}
function On(e, t) {
	let n = e.targets.get(t);
	return n ? {
		targetWidthPx: n.width,
		targetHeightPx: n.height,
		maxRetainedPixels: n.maxRetainedPixels
	} : void 0;
}
function kn(e) {
	return A(e) ? e.svgImagePath : e.imagePath;
}
function An(e, t, n, r) {
	let i = $e(t.bullet);
	if (i.type !== "blip") return;
	let a;
	for (let e of t.runs) if (e.type === "text" && e.fontSize != null) {
		a = e.fontSize;
		break;
	}
	let o = a ?? t.defFontSize ?? e.defaultFontSize ?? 18, s = i.sizePts == null ? o * ((i.sizePct ?? 100) / 100) : i.sizePts;
	return Math.max(1, s * J * n * r);
}
async function jn(e, t, n, r, i, a, o, c, l, u) {
	let d = de(a), f = [], p = [], m = (e, t, n, r, i, a = 1, o = i) => {
		if (!(!t || !i)) {
			if (C(r) && (d.resolution === "display" || d.strategy === "adaptive")) {
				f.push({
					key: e,
					...t,
					retainedSurfaceCount: a
				});
				return;
			}
			p.push(B(n, r, i, o).then((n) => n.dimensions && s(n.format, u !== void 0) ? {
				key: e,
				...t,
				sourceWidthPx: n.dimensions.width,
				sourceHeightPx: n.dimensions.height,
				retainedSurfaceCount: a
			} : null).catch(() => null));
		}
	}, h = e.background;
	if (h?.fillType === "image" && h.imagePath && !h.tile && !h.duotone) {
		let e = h.fillRect ?? {}, r = t * (1 - (e.l ?? 0) - (e.r ?? 0)), a = n * (1 - (e.t ?? 0) - (e.b ?? 0));
		m(X(h.imagePath, h.duotone), Dn(r, a, i, h.srcRect), h.imagePath, h.mimeType, o, 1);
	}
	for (let t of e.elements) if (t.type === "picture") !(A(t) || t.mimeType === "image/svg+xml") && !t.duotone && m(X(t.imagePath, t.duotone), Dn(Y(t.width, r), Y(t.height, r), i, t.srcRect), t.imagePath, t.mimeType, o, 1);
	else if (t.type === "media" && t.posterPath) {
		let e = c ? Jr(c) : void 0;
		m(X(t.posterPath), Dn(Y(t.width, r), Y(t.height, r), i), t.posterPath, t.posterMimeType || "application/octet-stream", e, 1, l ?? e);
	} else if (t.type === "chart") {
		let e = {
			widthPt: t.width / J,
			heightPt: t.height / J,
			targetWidthPx: Y(t.width, r) * i,
			targetHeightPx: Y(t.height, r) * i
		};
		for (let n of Ee(t.chart)) {
			let t = n.fill, r = De(n, e);
			!(t.mimeType === "image/svg+xml" || A({
				svgImagePath: t.svgImagePath,
				srcRect: n.hasSourceCrop ? !0 : null
			})) && !t.duotone && !n.preserveNaturalSize && r?.targetWidthPx && r.targetHeightPx && m(X(t.imagePath, t.duotone), {
				targetWidthPx: r.targetWidthPx,
				targetHeightPx: r.targetHeightPx
			}, t.imagePath, t.mimeType, o, 1);
		}
	} else if (t.type === "shape" && t.textBody) for (let e of t.textBody.paragraphs) {
		let n = $e(e.bullet);
		if (n.type !== "blip") continue;
		let a = An(t.textBody, e, r, i);
		!a || !o || p.push(B(n.imagePath, n.mimeType, o).then((e) => e.dimensions && e.dimensions.width > 0 && e.dimensions.height > 0 && s(e.format, u !== void 0) ? {
			key: X(n.imagePath),
			targetWidthPx: a * e.dimensions.width / e.dimensions.height,
			targetHeightPx: a,
			sourceWidthPx: e.dimensions.width,
			sourceHeightPx: e.dimensions.height
		} : null).catch(() => null));
	}
	return f.push(...(await Promise.all(p)).filter((e) => e !== null)), S(f, d);
}
function Mn(e) {
	return e.background?.fillType === "image" ? !0 : e.elements.some((e) => e.type === "picture" ? !0 : e.type === "media" ? !!e.posterPath : e.type === "chart" ? Ee(e.chart).length > 0 : e.type === "shape" && !!e.textBody?.paragraphs.some((e) => $e(e.bullet).type === "blip"));
}
var Z = ke;
function Nn(e, t, n, r, i, a, o) {
	let { top: s, height: c } = $t(n, i);
	e.fillStyle = a, e.fillRect(t, s, r, c), e.fillStyle = o;
}
function Pn(e, t, n, r, i, a, o = 0) {
	return Ie(e, t, n, r, i, a, o);
}
var Fn = /* @__PURE__ */ new WeakMap();
function In(e, t) {
	let n = e.tinted.get(t);
	if (n) return n;
	let r = ae(e.raster, t);
	return e.tinted.set(t, r), r;
}
function Ln(e) {
	let t = [], n = (e) => {
		if (e) for (let n of e.paragraphs) for (let e of n.runs) e.type === "math" && t.push({
			nodes: e.nodes,
			display: e.display
		});
	};
	for (let t of e.elements) if (t.type === "shape") n(t.textBody);
	else if (t.type === "table") for (let e of t.rows) for (let t of e.cells) n(t.textBody);
	return t;
}
async function Rn(e, t) {
	let n = Ln(e);
	if (n.length !== 0) {
		await t.loadMathJax();
		for (let e of n) if (!Fn.has(e.nodes)) try {
			let n = await t.mathMLToSvg(U(e.nodes, e.display)), r = await ne(n, "#000000");
			Fn.set(e.nodes, {
				raster: r,
				widthEm: n.widthEm,
				ascentEm: n.ascentEm,
				descentEm: n.descentEm,
				tinted: /* @__PURE__ */ new Map()
			});
		} catch {}
	}
}
function zn(e, t) {
	let n = (e) => t.embeddedFontAliases?.get(e.trim().toLowerCase()) ?? e;
	if (!e) return n(t.themeMinorFont ?? "sans-serif");
	if (e.startsWith("+")) return n(e === "+mj-lt" || e === "+mj-ea" || e === "+mj-cs" ? t.themeMajorFont ?? "sans-serif" : t.themeMinorFont ?? "sans-serif");
	let r = e.split(",")[0].trim();
	return r ? n(r) : t.themeMinorFont ?? "sans-serif";
}
var Bn = new Set([
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui"
]);
function Vn(e) {
	let t = l(e);
	return t === "mono" ? "monospace" : t === "serif" ? "serif" : "sans-serif";
}
var Hn = {
	calibri: "Carlito",
	"calibri light": "Carlito",
	cambria: "Caladea",
	"cambria math": "Caladea",
	"franklin gothic book": "Libre Franklin",
	"franklin gothic medium": "Libre Franklin",
	"sakkal majalla": "Noto Naskh Arabic",
	"traditional arabic": "Noto Naskh Arabic",
	"simplified arabic": "Noto Naskh Arabic",
	"arabic typesetting": "Noto Naskh Arabic",
	"univers next arabic": "Noto Sans Arabic"
}, Un = "\"Noto Naskh Arabic\", \"Noto Sans Arabic\"";
function Wn(e) {
	if (Hn[e.toLowerCase()]?.includes("Arabic")) return !0;
	let t = e.toLowerCase();
	return /arabic|naskh|kufi|nastaliq|amiri|scheherazade|lateef|aldhabi|urdu|farsi|العرب|[؀-ۿ]/.test(t);
}
function Gn(e) {
	return e.map((e) => `"${e}"`).join(", ");
}
function Kn(e, t = e) {
	let n = Vn(t), i = Hn[t.toLowerCase()], a = i ? `"${i}", ` : "";
	if (Wn(t)) return `"${e}", ${a}${Un}, ${n}`;
	let o = n === "serif" ? "serif" : "sans", s = w(t);
	return `"${e}", ${a}${s ? `${Gn(r(s, o))}, ` : ""}${`${Gn(o === "serif" ? f : u)}, `}${n}`;
}
function qn(e) {
	return e ? e.kind === "external" ? `e:${e.url}` : `i:${e.ref}` : "";
}
function Jn(e) {
	let t = e.toLowerCase();
	return /\b(thin|hairline)\b/.test(t) ? 100 : /\b(extra[- ]?light|ultra[- ]?light)\b/.test(t) ? 200 : /\blight\b/.test(t) ? 300 : /\b(black|heavy)\b/.test(t) ? 900 : /\b(extra[- ]?bold|ultra[- ]?bold)\b/.test(t) ? 800 : /\b(semi[- ]?bold|demi[- ]?bold)\b/.test(t) ? 600 : /\bbold\b/.test(t) ? 700 : /\bmedium\b/.test(t) ? 600 : null;
}
function Yn(e, t, n, r, i, a, o, s) {
	let c = Math.max(0, r.blur * i), l = Math.ceil(c * 3) + 2, u = Math.max(0, Math.floor(n.x - l)), d = Math.max(0, Math.floor(n.y - l)), f = Math.min(o, Math.ceil(n.x + n.w + l)), p = Math.min(s, Math.ceil(n.y + n.h + l)), m = Math.max(1, f - u), h = Math.max(1, p - d), g = je(m, h), _ = g?.getContext("2d");
	if (!g || !_) return;
	_.save(), _.setTransform(a.a, a.b, a.c, a.d, a.e - u, a.f - d), t(_), _.restore();
	let v = n.y - d, y = v + n.h, b = g, x = _;
	if (c > 0) {
		let e = je(m, h), t = e?.getContext("2d");
		e && t && (b = e, x = t);
	}
	b !== g && rn(x, g, {
		x: n.x - u,
		y: v,
		w: n.w,
		h: n.h
	}, c, m);
	let S = Math.max(0, Math.min(1, r.stPos)), C = Math.max(0, Math.min(1, r.endPos)), w = Math.max(1, y - v);
	try {
		let e = x.getImageData(0, 0, m, h);
		for (let t = 0; t < h; t++) {
			let n = Math.max(0, Math.min(1, (y - (t + .5)) / w)), i;
			if (n <= S) i = r.stA;
			else if (n >= C || C <= S) i = r.endA;
			else {
				let e = (n - S) / (C - S);
				i = r.stA + (r.endA - r.stA) * e;
			}
			let a = Math.max(0, Math.min(1, i));
			for (let n = t * m * 4 + 3; n < (t + 1) * m * 4; n += 4) e.data[n] = Math.round(e.data[n] * a);
		}
		x.putImageData(e, 0, 0);
	} catch {
		x.save(), x.globalCompositeOperation = "destination-in", x.fillStyle = `rgba(0,0,0,${Math.max(0, Math.min(1, r.stA))})`, x.fillRect(0, 0, m, h), x.restore();
	}
	let T = r.dist * i, E = r.dir * Math.PI / 180, D = n.y + n.h;
	e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.translate(n.x + Math.cos(E) * T, D + Math.sin(E) * T), e.scale(r.sx, r.sy), e.translate(-n.x, -D), e.drawImage(b, u, d), e.restore();
}
function Xn(e, t, n, r, i) {
	let a = t ? "italic " : "", o = zn(r, i), s = i.embeddedFontAuthoredFamilies?.get(o) ?? o, c = Jn(s), l = e ? "bold " : c ? `${c} ` : "";
	return Bn.has(o) ? `${a}${l}${n}px ${o}` : `${a}${l}${n}px ${Kn(o, s)}`;
}
function Zn(e) {
	return e.bullet.type === "char" || e.bullet.type === "autoNum" || $e(e.bullet).type === "blip";
}
function Qn(e, t, n) {
	let r = null;
	for (let e of t.runs) if (e.type === "text" && e.fontSize != null) {
		r = e.fontSize;
		break;
	}
	let i = r ?? t.defFontSize ?? e.defaultFontSize ?? 18;
	return n.sizePts == null ? i * ((n.sizePct ?? 100) / 100) : n.sizePts;
}
function $n(e, t) {
	return e ? 0 : Math.max(0, t);
}
function er(e, t) {
	return t != null && t !== 0 ? e * .65 : e;
}
function tr(e, t, n, r, i, a, o) {
	let s = (t.defaultFontSize ?? 18) * J * a;
	for (let c of t.paragraphs) {
		let l = Y(c.marL, a), u = Y(c.marR, a), d = Y(c.indent, a), f = $n(Zn(c), d), p = n - r - i - l - u - f, m = 0;
		for (let n of c.runs) {
			if (n.type !== "text") continue;
			let r = n.fontSize == null ? c.defFontSize == null ? s : c.defFontSize * J * a : n.fontSize * J * a, i = zn(n.fontFamily ?? c.defFontFamily ?? null, o);
			e.font = Xn(n.bold ?? c.defBold ?? t.defaultBold ?? !1, n.italic ?? c.defItalic ?? t.defaultItalic ?? !1, er(r, n.baseline ?? void 0), i, o);
			let l = (n.letterSpacing ?? 0) * J * a;
			if (m += Q(e, n.text, l), m > p) return !0;
		}
	}
	return !1;
}
function nr(e) {
	for (let t of e) if (le(t.codePointAt(0) ?? 0)) return !0;
	return !1;
}
function rr(e) {
	let t = 0;
	for (let n of e) t++;
	return t;
}
var ir = /* @__PURE__ */ new WeakMap();
function ar(e) {
	let t = ir.get(e);
	if (t != null) return t;
	let n = e, r = n.letterSpacing;
	if (typeof r != "string") return ir.set(e, !1), !1;
	let i = !1;
	try {
		n.letterSpacing = "0px";
		let t = e.measureText("ii").width;
		n.letterSpacing = "1px";
		let r = e.measureText("ii").width;
		i = Number.isFinite(t) && Number.isFinite(r) && r !== t;
	} catch {
		i = !1;
	} finally {
		try {
			n.letterSpacing = r;
		} catch {}
	}
	return ir.set(e, i), i;
}
function Q(e, t, n) {
	let r = e, i = r.letterSpacing;
	if (n !== 0 && ar(e)) try {
		r.letterSpacing = `${n}px`;
		let i = e.measureText(t).width;
		if (Number.isFinite(i)) return t.length > 0 ? i - n : i;
	} finally {
		try {
			r.letterSpacing = i;
		} catch {}
	}
	let a = Math.max(0, rr(t) - 1);
	return e.measureText(t).width + n * a;
}
function or(e, t, n, r, a, o, s, c = !1, l = !1, u = 1, d, f = {
	themeMajorFont: null,
	themeMinorFont: null,
	dpr: 1
}, p = 0) {
	let m = [], h = /* @__PURE__ */ new Map(), g = !0;
	for (let e = t.runs.length - 1; e >= 0 && g; e--) {
		let n = t.runs[e];
		if (n.type === "break") continue;
		if (n.type === "math") break;
		let r = n.text.replace(/ +$/u, "");
		r !== n.text && h.set(n, r), (r.length > 0 || n.fieldType != null) && (g = !1);
	}
	let v = () => n - (m.length === 0 ? p : 0), y = { segments: [] }, b = 0, S = !1, C = t.rtl === !0, w = Y(t.marR, o), T = (t.tabStops ?? []).map((e) => ({
		pos: Y(e.pos, o),
		algn: e.algn
	})), E = Y(t.defTabSz ?? 914400, o), D = !1, k = [], A = 0, j = () => C ? w : s + (m.length === 0 ? p : 0), M = (e = 0) => {
		let t = xn(e > 0 ? [...k, {
			isTab: !1,
			width: e
		}] : k, T, j(), Infinity, A, E), n = 0;
		for (let e of t) n += e;
		return n;
	}, N = (e) => {
		let t = v();
		return Number.isFinite(t) ? D ? M(e) <= t : b + e <= t : !0;
	}, P = () => {
		let e = v();
		if (!D) return e - b;
		if (!Number.isFinite(e)) return Infinity;
		if (M(0) >= e) return 0;
		let t = 0, n = e;
		for (let r = 0; r < 40; r++) {
			let r = (t + n) / 2;
			M(r) <= e ? t = r : n = r;
		}
		return t;
	}, F = (e = !1) => {
		e && (y.endsWithBreak = !0), m.push(y), y = { segments: [] }, b = 0, D = !1, k = [], S = !1;
	}, I = (t, n, r, i) => {
		e.font = n;
		let a = Q(e, t, r), o = y.segments.at(-1);
		return !o || o.isTab || o.math || o.sourceRunId !== i ? a : o.font === n && (o.letterSpacingPx ?? 0) === r ? Q(e, o.text + t, r) - Q(e, o.text, r) : a + r;
	}, L = (t, n, r, i, a, o, s, c) => {
		if (!t) return;
		e.font = n;
		let l = c?.letterSpacingPx ?? 0, u = c?.sourceRunId, d = c?.strikeDouble, f = c?.underlineStyle, p = c?.underlineColor, m = c?.shadow, h = c?.reflection, g = c?.outline, _ = c?.highlight, v = c?.fontFamily, x = c?.hyperlink, S = c?.drawSizePx ?? r, C = (e) => !e.math && !e.isTab && e.font === n && e.color === i && e.underline === a && (e.underlineStyle ?? "") === (f ?? "") && (e.underlineColor ?? "") === (p ?? "") && e.strikethrough === o && (e.strikeDouble ?? !1) === (d ?? !1) && (e.letterSpacingPx ?? 0) === l && e.baseline === s && e.shadow === m && e.reflection === h && e.outline === g && (e.highlight ?? "") === (_ ?? "") && (e.fontFamily ?? "") === (v ?? "") && (e.drawSizePx ?? e.sizePx) === S && qn(e.hyperlink) === qn(x) && (l === 0 || e.sourceRunId === u), w = y.segments.at(-1), T = Q(e, t, l);
		if (w && C(w) ? T = Q(e, w.text + t, l) - Q(e, w.text, l) : w && !w.isTab && !w.math && u != null && w.sourceRunId === u && (T += l), b += T, k.push({
			isTab: !1,
			width: T
		}), w && C(w)) w.text += t;
		else {
			let e = w && !w.isTab && !w.math && u != null && w.sourceRunId === u ? l : 0;
			y.segments.push({
				text: t,
				font: n,
				fontFamily: v,
				sizePx: r,
				drawSizePx: S,
				color: i,
				underline: a,
				underlineStyle: f,
				underlineColor: p,
				strikethrough: o,
				strikeDouble: d,
				letterSpacingPx: l || void 0,
				sourceRunId: u,
				leadingLetterSpacingPx: e || void 0,
				baseline: s,
				shadow: m,
				reflection: h,
				outline: g,
				highlight: _,
				hyperlink: x
			});
		}
	}, R = () => {
		let e = y.segments.at(-1);
		if (!e || e.math) return !1;
		let t = /^(.*\s)(\S+)$/s.exec(e.text), n;
		if (t) e.text = t[1], n = t[2];
		else if (y.segments.length > 1) y.segments.pop(), n = e.text;
		else return !1;
		return F(), L(n, e.font, e.sizePx, e.color, e.underline, e.strikethrough, e.baseline, {
			strikeDouble: e.strikeDouble,
			letterSpacingPx: e.letterSpacingPx,
			underlineStyle: e.underlineStyle,
			underlineColor: e.underlineColor,
			shadow: e.shadow,
			reflection: e.reflection,
			outline: e.outline,
			highlight: e.highlight,
			fontFamily: e.fontFamily,
			sourceRunId: e.sourceRunId,
			drawSizePx: e.drawSizePx
		}), !0;
	};
	for (let [n, s] of t.runs.entries()) {
		if (s.type === "break") {
			F(!0);
			continue;
		}
		if (s.type === "math") {
			let e = Fn.get(s.nodes), t = s.fontSize == null ? r : s.fontSize * J * o * u, n = e ? e.widthEm * t : 0, i = e ? e.ascentEm * t : 0, c = e ? e.descentEm * t : 0;
			(s.display && b > 0 || !N(n) && b > 0) && F(), k.push({
				isTab: !1,
				width: n
			}), y.segments.push({
				text: "",
				font: `${t}px sans-serif`,
				sizePx: t,
				color: s.color ? Z(s.color) : a,
				underline: !1,
				strikethrough: !1,
				math: {
					nodes: s.nodes,
					display: s.display,
					width: n,
					ascent: i,
					descent: c
				}
			}), b += n, s.display && F();
			continue;
		}
		let p = s.fontSize == null ? r : s.fontSize * J * o * u, m = er(p, s.baseline ?? void 0), g = zn(s.fontFamily ?? t.defFontFamily ?? null, f), C = s.fontFamilyEa ? zn(s.fontFamilyEa, f) : null, w = s.fontFamilySym ? zn(s.fontFamilySym, f) : null, T;
		T = s.color ? Z(s.color) : s.hyperlink && f.themeHlinkColor ? Z(f.themeHlinkColor) : a;
		let E = s.bold ?? t.defBold ?? c, j = s.italic ?? t.defItalic ?? l, M = Xn(E, j, m, g, f), B = C ? Xn(E, j, m, C, f) : M;
		e.font = M;
		let H = s.caps, U = h.get(s) ?? s.text;
		(H === "all" || H === "small") && (U = U.toUpperCase());
		let ee = s.fieldType === "slidenum" && d !== void 0 ? String(d) : U, W = s.underline || s.hyperlink !== void 0, te = s.strikeDouble === !0, G = s.letterSpacing == null ? 0 : s.letterSpacing * J * o, K = {
			strikeDouble: te,
			letterSpacingPx: G,
			underlineStyle: s.underlineStyle,
			underlineColor: s.underlineColor ? Z(s.underlineColor) : void 0,
			shadow: s.shadow,
			reflection: s.reflection,
			outline: s.outline,
			fontFamily: g,
			highlight: s.highlight ? Z(s.highlight) : void 0,
			hyperlink: an(s.hyperlink),
			sourceRunId: n,
			drawSizePx: m
		}, q = ee.split(/(\s+)/);
		for (let r of q) {
			if (!r) continue;
			if (/^\t+$/.test(r)) {
				D || (e.font = M, A = e.measureText(" ").width);
				for (let e of r) y.segments.push({
					text: "",
					isTab: !0,
					font: M,
					fontFamily: g,
					sizePx: p,
					color: T,
					underline: !1,
					strikethrough: !1
				}), k.push({
					isTab: !0,
					width: 0
				});
				D = !0;
				continue;
			}
			e.font = M;
			let a = I(r, M, G, n), o = /^\s+$/.test(r), c = /[-]/;
			if (c.test(r) && (w != null || _e(g))) {
				let t = w ?? g;
				for (let i of r) {
					let r = i, a = M;
					if (c.test(i)) {
						let e = xe(i, t);
						e === i ? a = Xn(E, j, m, t, f) : (r = e, a = Xn(E, j, m, "sans-serif", f));
					}
					e.font = a, !N(I(r, a, G, n)) && b > 0 && F(), L(r, a, p, T, W, s.strikethrough, s.baseline ?? void 0, K);
				}
				continue;
			}
			if (nr(r) && (!V(r) || t.eaLnBrk === !1)) {
				let i = [];
				for (let t of r) {
					let n = le(t.codePointAt(0) ?? 0) && C != null, r = n ? B : M, a = n ? C : g;
					e.font = r, i.push({
						ch: t,
						w: Q(e, t, 0),
						font: r,
						family: a
					});
				}
				if (t.eaLnBrk === !1) {
					let e = y.segments.at(-1), t = !!e && !e.isTab && !e.math && e.sourceRunId === n, r = i.reduce((e, t) => e + t.w, 0) + Math.max(0, i.length - 1) * G + (t && i.length > 0 ? G : 0);
					b > 0 && !N(r) && F();
					for (let e of i) L(e.ch, e.font, p, T, W, s.strikethrough, s.baseline ?? void 0, {
						...K,
						fontFamily: e.family
					});
					continue;
				}
				let a = i;
				for (; a.length > 0;) {
					let e = Number.isFinite(v()) ? v() - P() : b, t = y.segments.at(-1), r = !!t && !t.isTab && !t.math && t.sourceRunId === n, i = dn(a, e, v(), _, G, r);
					if (i === 0) {
						if (b > 0) {
							F();
							continue;
						}
						i = 1;
					}
					for (let e = 0; e < i; e++) {
						let t = a[e];
						L(t.ch, t.font, p, T, W, s.strikethrough, s.baseline ?? void 0, {
							...K,
							fontFamily: t.family
						});
					}
					a = a.slice(i), a.length > 0 && F();
				}
				continue;
			}
			if (V(r)) {
				let t = x(r, {
					cjk: !0,
					kinsoku: _
				}), i = C != null && B !== M, a = (e) => i && le(e.codePointAt(0) ?? 0), o = (t) => {
					let r = 0, i = y.segments.at(-1), o = !!i && !i.isTab && !i.math && i.sourceRunId === n, s = "", c = null, l = () => {
						s !== "" && (e.font = c ? B : M, r += Q(e, s, G), o && (r += G), o = !0, s = "");
					};
					for (let e of t) {
						let t = a(e);
						c === null || t === c ? (s += e, c = t) : (l(), s = e, c = t);
					}
					return l(), r;
				}, c = (e) => {
					let t = "", n = null, r = () => {
						if (t === "") return;
						let e = n ? B : M, r = n ? C : g;
						L(t, e, p, T, W, s.strikethrough, s.baseline ?? void 0, {
							...K,
							fontFamily: r
						}), t = "";
					};
					for (let i of e) {
						let e = a(i);
						n === null || e === n ? (t += i, n = e) : (r(), t = i, n = e);
					}
					r();
				}, l = fe(r), u = r.length, d = 0;
				for (; d < u;) {
					let e = P(), n = z(r, t, d, e, o, l);
					if (n <= d) {
						if (b > 0) {
							F();
							continue;
						}
						let i = t.find((e) => e > d) ?? u, a = r.slice(d, i), s = O(a), c = z(a, s, 0, e, o, l);
						c <= 0 && (c = s.length > 0 ? s[0] : a.length), n = d + c;
					}
					c(r.slice(d, n)), d = n, d < u && F();
				}
				continue;
			}
			if (N(a)) L(r, M, p, T, W, s.strikethrough, s.baseline ?? void 0, K), o && (S = !0);
			else if (o) b > 0 && F();
			else if (a > v()) {
				b > 0 && F();
				for (let t of r) e.font = M, !N(I(t, M, G, n)) && b > 0 && F(), L(t, M, p, T, W, s.strikethrough, s.baseline ?? void 0, K);
			} else if (!S) L(r, M, p, T, W, s.strikethrough, s.baseline ?? void 0, K);
			else {
				let e = y.segments.at(-1)?.text ?? "", t = r.codePointAt(0), n = [...e].at(-1)?.codePointAt(0), a = /\S$/u.test(e) && /^\S/u.test(r) && n !== 8203 && t !== 8203, o = t !== void 0 && _.lineStartForbidden.has(t) && a, c = n !== void 0 && t !== void 0 && a && !V(e) && !V(r) && i(n, t);
				(o || c) && R() || F(), L(r, M, p, T, W, s.strikethrough, s.baseline ?? void 0, K);
			}
		}
	}
	return m.push(y), m;
}
async function sr(e, t, n, r, i, o, s, c, l, u) {
	if (t && t.fillType === "image") {
		if (e.fillStyle = "#FFFFFF", e.fillRect(0, 0, n, r), !t.imagePath || !t.mimeType || !s) return;
		try {
			let a = t.fillRect ?? {}, d = a.l ?? 0, f = a.t ?? 0, p = a.r ?? 0, m = a.b ?? 0, h = d * n, g = f * r, _ = n * (1 - d - p), v = r * (1 - f - m), y = u && !t.duotone ? On(u, X(t.imagePath, t.duotone)) : void 0, b = t.tile ? await B(t.imagePath, t.mimeType, s) : void 0, x = await Ye(t.imagePath, t.mimeType, t.duotone, s, {
				widthPt: n / i / J,
				heightPt: r / i / J,
				...y ?? {},
				tiff: c,
				svgDecoder: l
			});
			if (o() || !x) return;
			e.save(), e.beginPath(), e.rect(0, 0, n, r), e.clip(), t.alpha != null && (e.globalAlpha = t.alpha), t.tile ? dr(e, x, t.tile, n, r, i, t.srcRect, b?.dimensions ?? void 0) : Me(e, x, t.srcRect, h, g, _, v), e.restore();
		} catch (t) {
			if (a(t, "tiff")) {
				ue(e, "tiff", {
					x: 0,
					y: 0,
					width: n,
					height: r
				});
				return;
			}
			if (Re(t) || Je(t)) throw t;
		}
		return;
	}
	e.fillStyle = Pn(t, e, 0, 0, n, r) ?? "#FFFFFF", e.fillRect(0, 0, n, r);
}
var cr = 9525;
function lr(e, t, n, r, i) {
	let a;
	a = e === "t" || e === "ctr" || e === "b" ? (t - r) / 2 : e === "tr" || e === "r" || e === "br" ? t - r : 0;
	let o;
	return o = e === "l" || e === "ctr" || e === "r" ? (n - i) / 2 : e === "bl" || e === "b" || e === "br" ? n - i : 0, {
		ax: a,
		ay: o
	};
}
function ur(e, t, n) {
	return {
		width: e * (n ? 1 - n.l - n.r : 1),
		height: t * (n ? 1 - n.t - n.b : 1)
	};
}
function dr(e, t, n, r, i, a, o, s) {
	let c = ur(s?.width ?? t.width, s?.height ?? t.height, o), l = c.width * cr * (n.sx ?? 1) * a, u = c.height * cr * (n.sy ?? 1) * a;
	if (!(l > 0) || !(u > 0)) return;
	let d = n.flip === "x" || n.flip === "xy", f = n.flip === "y" || n.flip === "xy", p = je(l * (d ? 2 : 1), u * (f ? 2 : 1));
	if (!p) return;
	let m = p.getContext("2d");
	if (!m) return;
	let h = (e, n, r, i) => {
		m.save(), m.translate(e + (r ? l : 0), n + (i ? u : 0)), m.scale(r ? -1 : 1, i ? -1 : 1), Me(m, t, o, 0, 0, l, u), m.restore();
	};
	h(0, 0, !1, !1), d && h(l, 0, !0, !1), f && h(0, u, !1, !0), d && f && h(l, u, !0, !0);
	let g = e.createPattern(p, "repeat");
	if (!g) return;
	let { ax: _, ay: v } = lr(n.algn ?? "tl", r, i, l, u), y = _ + Y(n.tx ?? 0, a), b = v + Y(n.ty ?? 0, a);
	typeof g.setTransform == "function" && typeof DOMMatrix < "u" ? (g.setTransform(new DOMMatrix().translateSelf(y, b)), e.fillStyle = g, e.fillRect(0, 0, r, i)) : (e.save(), e.translate(y, b), e.fillStyle = g, e.fillRect(-y, -b, r, i), e.restore());
}
function fr(e, t, n) {
	if (!t) return;
	let r = t.dir * Math.PI / 180, i = Y(t.dist, n);
	e.shadowColor = Z(t.color, t.alpha), e.shadowBlur = 0, e.shadowOffsetX = Math.cos(r) * i, e.shadowOffsetY = Math.sin(r) * i;
}
function pr(e, t, n) {
	t && (e.shadowColor = Z(t.color, t.alpha), e.shadowBlur = Y(t.radius, n), e.shadowOffsetX = 0, e.shadowOffsetY = 0);
}
function mr(e) {
	e.shadowColor = "transparent", e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0;
}
var hr = 8, gr = 1, _r = 1, vr = 256;
function yr(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m) {
	if (r <= 0) return;
	let h = e.measureText(t), g = h.actualBoundingBoxAscent > 0 ? h.actualBoundingBoxAscent : r, _ = h.actualBoundingBoxDescent > 0 ? h.actualBoundingBoxDescent : r * .25, v = h.actualBoundingBoxLeft > 0 ? h.actualBoundingBoxLeft : 0, y = h.actualBoundingBoxRight > 0 ? h.actualBoundingBoxRight : r, b = r * l * i, x = Math.min(vr, Math.max(1, Math.round(b / hr))), S = (e) => Sr(e, a, r, o, s, c, u, d), C = S(x), w = wr(C, a, o, s, c, u, d, l, i, -g, _);
	for (; w > _r && x < vr;) {
		let e = Math.min(vr, x * 2), t = S(e), n = wr(t, a, o, s, c, u, d, l, i, -g, _);
		if (n >= w * .75) {
			C = t;
			break;
		}
		x = e, C = t, w = n;
	}
	let T = 1e4, E = gr / (l * i), D = C.length - 1, O = (e, t, n) => e === 0 ? -T : t - n - E, k = (e, t, n) => e === D ? T : t - n + E, A = (e, r) => {
		e.fillStyle = r;
		for (let r = 0; r <= D; r++) {
			let { s0: i, s1: a, g: o } = C[r], s = (i + a) / 2;
			e.save(), e.translate(f + o.x, p + o.y), e.rotate(o.angle), o.shear !== 0 && e.transform(1, 0, o.shear, 1, 0, 0), (l !== 1 || o.vScale !== 1) && e.scale(l, o.vScale), e.beginPath();
			let c = O(r, i, s), u = k(r, a, s);
			e.rect(c, -T, u - c, 2 * T), e.clip(), e.fillText(t, -s + n / 2, 0), e.restore();
		}
	}, j = br(m), M = typeof e.globalAlpha == "number" ? e.globalAlpha : 1;
	if (j >= 1 && M >= 1) {
		A(e, m);
		return;
	}
	if (j <= 0 || M <= 0) return;
	let N = typeof e.getTransform == "function" ? e.getTransform() : null;
	if (!N) {
		A(e, m);
		return;
	}
	let P = Infinity, F = Infinity, I = -Infinity, L = -Infinity;
	for (let e = 0; e <= D; e++) {
		let { s0: t, s1: r, g: i } = C[e], a = (t + r) / 2, o = -a + n / 2, s = Math.max(O(e, t, a), o - v), c = Math.min(k(e, r, a), o + y);
		if (!(c <= s)) for (let [e, t] of [
			[s, -g],
			[c, -g],
			[s, _],
			[c, _]
		]) {
			let n = Cr(i, l, e, t), r = f + n.x, a = p + n.y, o = N.a * r + N.c * a + N.e, s = N.b * r + N.d * a + N.f;
			o < P && (P = o), o > I && (I = o), s < F && (F = s), s > L && (L = s);
		}
	}
	if (!(I > P && L > F)) return;
	let R = Math.floor(P - 2), z = Math.floor(F - 2), B = je(Math.ceil(I + 2) - R, Math.ceil(L + 2) - z), V = B ? B.getContext("2d") : null;
	if (!B || !V) {
		A(e, m);
		return;
	}
	V.font = e.font, V.textAlign = "left", V.textBaseline = "alphabetic", V.setTransform(N.a, N.b, N.c, N.d, N.e - R, N.f - z), A(V, xr(m)), e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = M * j, e.drawImage(B, R, z), e.restore();
}
function br(e) {
	let t = /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(e);
	if (!t) return 1;
	let n = parseFloat(t[1]);
	return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
}
function xr(e) {
	let t = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(e);
	return t ? `rgb(${t[1]}, ${t[2]}, ${t[3]})` : e;
}
function Sr(e, t, n, r, i, a, o, s) {
	let c = Array(e);
	for (let l = 0; l < e; l++) {
		let u = l / e * n, d = (l + 1) / e * n;
		c[l] = {
			s0: u,
			s1: d,
			g: pt(t, (r + (u + d) / 2) / i * a, o, s)
		};
	}
	return c;
}
function Cr(e, t, n, r) {
	let i = n * t, a = r * e.vScale, o = i + e.shear * a, s = Math.cos(e.angle), c = Math.sin(e.angle);
	return {
		x: e.x + s * o - c * a,
		y: e.y + c * o + s * a
	};
}
function wr(e, t, n, r, i, a, o, s, c, l, u) {
	let d = 0;
	for (let f of e) {
		let e = (f.s0 + f.s1) / 2;
		for (let p of [f.s0, f.s1]) {
			let m = pt(t, (n + p) / r * i, a, o);
			for (let t of [l, u]) {
				let n = Cr(m, s, 0, t), r = Cr(f.g, s, p - e, t), i = Math.hypot(r.x - n.x, r.y - n.y) * c;
				i > d && (d = i);
			}
		}
	}
	return d;
}
function Tr(e, t, n, r, i, a, o, s, c, l, u) {
	let d = i, f = a, p = Math.max(1, o), m = Math.max(1, s), h = lt(n, r, p, m);
	if (!h) return;
	let g = t.defaultBold ?? !1, _ = t.defaultItalic ?? !1, v = (t.defaultFontSize ?? 18) * J * c, y = [];
	for (let n of t.paragraphs) {
		let t = or(e, n, Infinity, n.defFontSize == null ? v : n.defFontSize * J * c, n.defColor ? Z(n.defColor) : l, c, 0, g, _, 1, void 0, u, 0);
		for (let e of t) y.push(e);
	}
	if (y.length === 0) return;
	e.save(), e.textAlign = "left", e.textBaseline = "alphabetic";
	let b = -1, x = () => {
		if (b >= 0) return b;
		let t = typeof e.getTransform == "function" ? e.getTransform() : null, n = t ? Math.abs(t.a * t.d - t.b * t.c) : 1;
		return b = n > 0 ? Math.sqrt(n) : 1, b;
	}, S = y.length;
	for (let t = 0; t < S; t++) {
		let n = y[t], r = t / S, i = (t + 1) / S, a = 0, o = 0, s = 0, c = 0;
		for (let t of n.segments) {
			if (t.math) {
				a += t.math.width, o = Math.max(o, t.sizePx), s = Math.max(s, t.math.ascent), c = Math.max(c, t.math.descent);
				continue;
			}
			e.font = t.font;
			let n = t.letterSpacingPx ?? 0, r = e.measureText(t.text);
			a += r.width + n * rr(t.text), o = Math.max(o, t.sizePx), r.actualBoundingBoxAscent > 0 && (s = Math.max(s, r.actualBoundingBoxAscent)), r.actualBoundingBoxDescent > 0 && (c = Math.max(c, r.actualBoundingBoxDescent));
		}
		if (a <= 0) continue;
		let l = s + c > 0 ? s + c : o, u = h.singleEdge ? .8 : l > 0 ? s / l : .8, g = h.singleEdge ? 1 : p / a, _ = h.singleEdge ? m : l / (i - r), v = ft(h, a), b = 0;
		for (let t of n.segments) {
			if (t.math) {
				b += t.math.width;
				continue;
			}
			e.font = t.font, e.fillStyle = t.color;
			let n = t.letterSpacingPx ?? 0, o = [...t.text];
			for (let s of o) {
				let o = e.measureText(s).width + n, c = r + u * (i - r);
				if (!h.singleEdge && o > 0) {
					yr(e, s, n, o, x(), h, b, a, v, g, _, c, d, f, t.color), b += o;
					continue;
				}
				let l = pt(h, (b + o / 2) / a * v, _, c);
				e.save(), e.translate(d + l.x, f + l.y), e.rotate(l.angle), l.shear !== 0 && e.transform(1, 0, l.shear, 1, 0, 0), (g !== 1 || l.vScale !== 1) && e.scale(g, l.vScale), e.fillText(s, -o / 2 + n / 2, 0), e.restore(), b += o;
			}
		}
	}
	e.restore();
}
function Er(e, t, n, r, i, a, o) {
	let s = Math.min(r, i);
	switch (e) {
		case "rightarrow":
		case "leftarrow": {
			let c = Math.min(Math.max(a ?? 5e4, 0), 1e5), l = s * Math.min(Math.max(o ?? 5e4, 0), 1e5) / 1e5, u = i * c / 2e5, d = n + i / 2 - u, f = 2 * u, p = Math.max(0, r - l);
			return e === "rightarrow" ? {
				tx: t,
				ty: d,
				tw: p,
				th: f
			} : {
				tx: t + l,
				ty: d,
				tw: p,
				th: f
			};
		}
		case "roundrect": {
			let e = s * Math.min(Math.max(a ?? 16667, 0), 1e5) / 1e5 * (1 - 1 / Math.SQRT2);
			return {
				tx: t + e,
				ty: n + e,
				tw: Math.max(0, r - 2 * e),
				th: Math.max(0, i - 2 * e)
			};
		}
		default: return null;
	}
}
function Dr(e, t) {
	return e.defaultTextColor ? Z(e.defaultTextColor) : t.smartArtFallbackTextColor != null && yn(e) ? t.smartArtFallbackTextColor : null;
}
function Or(e, t, n) {
	return {
		outerRotation: e,
		localFlipH: t,
		localFlipV: n
	};
}
function kr(e, t, n, r, i) {
	let a = [
		{
			x: t,
			y: n
		},
		{
			x: t + r,
			y: n
		},
		{
			x: t,
			y: n + i
		},
		{
			x: t + r,
			y: n + i
		}
	].map((t) => ({
		x: e.a * t.x + e.c * t.y + e.e,
		y: e.b * t.x + e.d * t.y + e.f
	})), o = Math.min(...a.map((e) => e.x)), s = Math.min(...a.map((e) => e.y)), c = Math.max(...a.map((e) => e.x)), l = Math.max(...a.map((e) => e.y));
	return {
		x: o,
		y: s,
		w: c - o,
		h: l - s
	};
}
var Ar = {
	tl: [0, 0],
	t: [.5, 0],
	tr: [1, 0],
	l: [0, .5],
	ctr: [.5, .5],
	r: [1, .5],
	bl: [0, 1],
	b: [.5, 1],
	br: [1, 1]
};
function jr(e, t, n) {
	return [e.a * t + e.c * n + e.e, e.b * t + e.d * n + e.f];
}
function Mr(e, t, n, r, i, a) {
	let [o, s] = Ar[a ?? "b"];
	return jr(e, t + o * r, n + s * i);
}
function Nr(e, t, n, r, i, a, o, s) {
	let c = Ct(e, i, a).corners, l = (o > 0 ? Ke(c, o / i, o / a) ?? c : c).map((e) => jr(t, n + e.x, r + e.y)), u = l.map(([e]) => e), d = l.map(([, e]) => e), f = Math.min(...u), p = Math.min(...d), m = Math.max(...u), h = Math.max(...d), [g, _] = Ar[s ?? "b"], v = Ue(c, g, _);
	return {
		bbox: {
			x: f,
			y: p,
			w: m - f,
			h: h - p
		},
		anchor: v ? jr(t, n + v.x, r + v.y) : Mr(t, n, r, i, a, s)
	};
}
function Pr(e, t, n, r) {
	let i = Math.floor(n.x) - 1, a = Math.floor(n.y) - 1, o = Math.max(1, Math.ceil(n.x + n.w) - i + 1), s = Math.max(1, Math.ceil(n.y + n.h) - a + 1);
	if (r && (i + o <= 0 || a + s <= 0 || i >= r.w || a >= r.h) || He(o, s).clamped) return e;
	let c = null;
	try {
		c = je(o, s);
	} catch {
		return e;
	}
	let l = c?.getContext("2d");
	if (!c || !l) return e;
	l.setTransform(t.a, t.b, t.c, t.d, t.e - i, t.f - a), e(l);
	let u = {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: 0,
		f: 0
	};
	return (e) => {
		e.save(), e.setTransform(u), e.drawImage(c, i, a), e.restore();
	};
}
function Fr(e, t, n, r, i, a, o, s, c, l = !0, u = r) {
	let d = e.canvas.width || 0, f = e.canvas.height || 0, p = d > 0 && f > 0, m = {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: 0,
		f: 0
	}, h = (e) => e.setTransform(c), g = (e) => {
		h(e), n(e);
	}, _ = (e) => {
		h(e), r(e);
	}, v = (e) => {
		h(e), u(e);
	}, y = !1;
	t.shadow && p ? (e.save(), e.setTransform(m), y = !Ge(e, g, i, t.shadow, s, d, f, Math.atan2(c.b, c.a) * 180 / Math.PI, a), e.restore()) : t.shadow && (y = !0), t.reflection && p && (e.save(), e.setTransform(m), Be(e, g, i, t.reflection, s, d, f), e.restore()), y ? fr(e, t.shadow ?? null, o) : t.glow && pr(e, t.glow, o), t.softEdge && p ? (e.save(), e.setTransform(m), Ve(e, g, i, t.softEdge, s, d, f, _), e.restore()) : n(e), (y || t.glow) && mr(e), t.innerShadow && l && p && (e.save(), e.setTransform(m), We(e, v, i, t.innerShadow, s, d, f), e.restore());
}
function Ir(e, t, r, i = "#000000", a, o = {
	themeMajorFont: null,
	themeMinorFont: null,
	dpr: 1
}, s, c) {
	let l = Y(t.x, r), u = Y(t.y, r), d = Y(t.width, r), f = Y(t.height, r), p = s && t.id !== void 0 ? (e) => s({
		...e,
		shapeId: t.id
	}) : s;
	if (f === 0 && t.textBody?.verticalAnchor === "b") {
		if (t.stroke && (e.save(), ei(e, t.stroke, r, {
			x: l,
			y: u,
			w: d,
			h: 1
		}, t.rotation), e.beginPath(), e.moveTo(l, u), e.lineTo(l + d, u), e.stroke(), e.restore()), t.textBody) {
			let n = Dr(t, o);
			Hr(e, t.textBody, l, u, d, f, r, n, t.rotation, t.flipH, t.flipV, i, a, o, p, !1, c);
		}
		return;
	}
	let h = t.scene3d && wt(t.scene3d.camera) ? t.scene3d : null;
	if (h && d > 0 && f > 0) {
		let n = e.getTransform(), s = Math.abs(n.a * n.d - n.b * n.c), c = s > 0 ? Math.sqrt(s) : 1, p = Ur(t.sp3d, t.scene3d?.lightRig, t.sp3d?.prstMaterial, r, c), m = Wr(t.sp3d, h.camera, d, f, r, c), g = Or(t.rotation, t.flipH, t.flipV);
		e.save(), g.outerRotation !== 0 && (e.translate(l + d / 2, u + f / 2), e.rotate(g.outerRotation * Math.PI / 180), e.translate(-(l + d / 2), -(u + f / 2)));
		let _ = {
			...t,
			x: 0,
			y: 0,
			rotation: 0,
			flipH: g.localFlipH,
			flipV: g.localFlipV,
			scene3d: void 0,
			sp3d: void 0,
			shadow: null,
			innerShadow: void 0,
			glow: void 0,
			softEdge: void 0,
			reflection: void 0
		}, v = {
			..._,
			textBody: null
		}, y = {
			..._,
			fill: null,
			stroke: null
		}, b = (t.stroke ? t.stroke.width * r / 2 : 0) + (t.sp3d?.contourW ? t.sp3d.contourW * r : 0) + (m ? Math.hypot(m.offsetX, m.offsetY) / c : 0) + 2, x = (e, t, n) => Gr(e, h.camera, l, u, d, f, (e) => {
			Ir(e, t, r, i, a, o, void 0);
		}, n ? {
			bevels: p,
			extrusion: m ?? void 0,
			edgePadCss: b
		} : {}), S = (e) => x(e, v, !0), C = (e) => !t.textBody || x(e, y, !1);
		if (t.shadow || t.innerShadow || t.glow || t.softEdge || t.reflection) {
			let n = e.getTransform(), i = Math.abs(n.a * n.d - n.b * n.c), a = i > 0 ? Math.sqrt(i) : 1, o = Nr(h.camera, n, l, u, d, f, b, t.shadow?.algn), s = !1, c = Pr((e) => {
				s = S(e) || s;
			}, n, o.bbox, {
				w: e.canvas.width || 0,
				h: e.canvas.height || 0
			});
			if (Fr(e, t, c, c, o.bbox, o.anchor, r, r * a, n, !!t.fill), s) {
				C(e), e.restore();
				return;
			}
		} else if (x(e, _, !0)) {
			e.restore();
			return;
		}
		e.restore();
	}
	e.save(), (t.rotation !== 0 || t.flipH || t.flipV) && (e.translate(l + d / 2, u + f / 2), e.rotate(t.rotation * Math.PI / 180), t.flipH && e.scale(-1, 1), t.flipV && e.scale(1, -1), e.translate(-(l + d / 2), -(u + f / 2)));
	let _ = t.geometry.toLowerCase(), v = Pn(t.fill, e, l, u, d, f, t.rotation);
	t.shadow || pr(e, t.glow ?? null, r);
	let y = new Set([
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
	]), b = new Set([
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
	]), x = (e) => b.has(e) || e === "line" || e === "straightconnector1" || e.startsWith("bentconnector"), S = !t.custGeom && m(_), C = (n, i, a = {
		x: l,
		y: u,
		w: d,
		h: f
	}) => {
		let { x: o, y: s, w: c, h: p } = a, m = i ?? (n === e && o === l && s === u && c === d && p === f ? v : Pn(t.fill, n, o, s, c, p, t.rotation)), h = i ? null : t.stroke ? () => {
			ei(n, t.stroke, r, {
				x: o,
				y: s,
				w: c,
				h: p
			}, t.rotation), n.stroke();
		} : null, y = () => mr(n);
		if (S && !i) {
			g(n, _, o, s, c, p, [
				t.adj,
				t.adj2,
				t.adj3,
				t.adj4,
				t.adj5,
				t.adj6,
				t.adj7,
				t.adj8
			], m, h, y, x(_) ? { skipTrailingStroke: !0 } : void 0);
			return;
		}
		n.beginPath(), t.custGeom && t.custGeom.length > 0 ? Lr(n, t.custGeom, o, s, c, p) : he(n, _, o, s, c, p, t.adj, t.adj2, t.adj3, t.adj4), m && _ !== "arc" && (n.fillStyle = m, _ === "donut" || _ === "smileyface" || _ === "frame" ? n.fill("evenodd") : n.fill(), i || y()), h && h();
	}, w = e.getTransform(), T = Math.abs(w.a * w.d - w.b * w.c), E = T > 0 ? Math.sqrt(T) : 1, D = (t.shadow || t.reflection || t.softEdge || t.innerShadow ? S ? W(_, l, u, d, f, [
		t.adj,
		t.adj2,
		t.adj3,
		t.adj4,
		t.adj5,
		t.adj6,
		t.adj7,
		t.adj8
	]) : t.custGeom && t.custGeom.length > 0 ? ge(t.custGeom, l, u, d, f) : null : null) ?? {
		x: l,
		y: u,
		w: d,
		h: f
	}, O = t.stroke ? t.stroke.width * r / 2 : 0, k = t.stroke ? Math.max(t.stroke.headEnd ? me(t.stroke.headEnd, t.stroke, r) : 0, t.stroke.tailEnd ? me(t.stroke.tailEnd, t.stroke, r) : 0) : 0, A = t.sp3d?.contourW ? t.sp3d.contourW * r : 0, j = Math.max(O, k, A), M = j > 0 ? {
		x: D.x - j,
		y: D.y - j,
		w: D.w + j * 2,
		h: D.h + j * 2
	} : D, N = kr(w, M.x, M.y, M.w, M.h), P = r * E, F = h ? [] : Ur(t.sp3d, t.scene3d?.lightRig, t.sp3d?.prstMaterial, r, E), I = (t.stroke ? t.stroke.width * r / 2 : 0) + 2, L = (e) => {
		let i = t.stroke?.fill ? Pn(t.stroke.fill, e, l, u, d, f, t.rotation) ?? void 0 : void 0;
		if (t.stroke && (y.has(_) || b.has(_))) {
			let a = n(_, l, u, d, f, [
				t.adj,
				t.adj2,
				t.adj3,
				t.adj4,
				t.adj5,
				t.adj6,
				t.adj7,
				t.adj8
			]);
			if (!a) return;
			let o = t.stroke.cmpd, s = _ === "line" || _ === "straightconnector1";
			if (x(_) && a.vertices.length >= 2 && !(o && s)) {
				let n = a.vertices.map((e) => ({
					x: e.x,
					y: e.y
				}));
				if (t.stroke.tailEnd) {
					let e = be(t.stroke.tailEnd, t.stroke, r);
					n[n.length - 1] = Ce(n[n.length - 1], n[n.length - 2], e);
				}
				if (t.stroke.headEnd) {
					let e = be(t.stroke.headEnd, t.stroke, r);
					n[0] = Ce(n[0], n[1], e);
				}
				ei(e, t.stroke, r, {
					x: l,
					y: u,
					w: d,
					h: f
				}, t.rotation), e.beginPath(), e.moveTo(n[0].x, n[0].y);
				for (let t = 1; t < n.length; t++) e.lineTo(n[t].x, n[t].y);
				e.stroke();
			}
			o && s && $r(e, a.start, a.end, t.stroke, o, r, t.rotation), t.stroke.tailEnd && ve(e, a.end.x, a.end.y, a.end.angle, t.stroke.tailEnd, t.stroke, r, i), t.stroke.headEnd && ve(e, a.start.x, a.start.y, a.start.angle, t.stroke.headEnd, t.stroke, r, i);
			return;
		}
		if (!t.stroke || !t.custGeom || t.custGeom.length === 0 || (!t.stroke.headEnd || t.stroke.headEnd.type === "none") && (!t.stroke.tailEnd || t.stroke.tailEnd.type === "none")) return;
		let { start: a, end: o } = ye(t.custGeom);
		a && t.stroke.headEnd && t.stroke.headEnd.type !== "none" && ve(e, l + a.x * d, u + a.y * f, Math.atan2(a.dy * f, a.dx * d), t.stroke.headEnd, t.stroke, r, i), o && t.stroke.tailEnd && t.stroke.tailEnd.type !== "none" && ve(e, l + o.x * d, u + o.y * f, Math.atan2(o.dy * f, o.dx * d), t.stroke.tailEnd, t.stroke, r, i);
	}, R = (e) => {
		if (F.length > 0 && Kr(e, l, u, d, f, F, (e, t, n, r, i) => C(e, void 0, {
			x: t,
			y: n,
			w: r,
			h: i
		}), void 0, I)) {
			L(e), mr(e);
			return;
		}
		C(e), L(e);
	};
	if (Fr(e, t, R, R, N, Mr(w, l, u, d, f, t.shadow?.algn), r, P, w, !!v, (e) => C(e, "#000")), t.textBody) {
		let n = Dr(t, o);
		if (e.save(), t.flipH || t.flipV) {
			let n = l + d / 2, r = u + f / 2;
			e.translate(n, r), t.flipH && e.scale(-1, 1), t.flipV && e.scale(1, -1), e.translate(-n, -r);
		}
		let s = l, m = u, h = d, g = f;
		if (t.textRect) s = Y(t.textRect.x, r), m = Y(t.textRect.y, r), h = Y(t.textRect.width, r), g = Y(t.textRect.height, r);
		else if (_ === "ellipse") {
			let e = d * (1 - 1 / Math.SQRT2) / 2, t = f * (1 - 1 / Math.SQRT2) / 2;
			s = l + e, m = u + t, h = d / Math.SQRT2, g = f / Math.SQRT2;
		} else {
			let e = Er(_, l, u, d, f, t.adj, t.adj2);
			e && (s = e.tx, m = e.ty, h = e.tw, g = e.th);
		}
		Hr(e, t.textBody, s, m, h, g, r, n, t.rotation, !1, !1, i, a, o, p, !1, c), e.restore();
	}
	e.restore();
}
var Lr = Te;
function Rr(e, t) {
	let n = `${e}`, r = e >= 1 && e <= 26 ? String.fromCharCode(96 + e) : n, i = e >= 1 && e <= 26 ? String.fromCharCode(64 + e) : n, a = zr(e).toLowerCase(), o = zr(e), s = n.replace(/[0-9]/g, (e) => String.fromCharCode(65296 + (e.charCodeAt(0) - 48)));
	switch (t) {
		case "arabicPlain": return n;
		case "arabicPeriod": return `${n}.`;
		case "arabicParenR": return `${n})`;
		case "arabicParenBoth": return `(${n})`;
		case "arabicDbPlain": return s;
		case "arabicDbPeriod": return `${s}.`;
		case "alphaLcPlain": return r;
		case "alphaLcPeriod": return `${r}.`;
		case "alphaLcParenR": return `${r})`;
		case "alphaLcParenBoth": return `(${r})`;
		case "alphaUcPlain": return i;
		case "alphaUcPeriod": return `${i}.`;
		case "alphaUcParenR": return `${i})`;
		case "alphaUcParenBoth": return `(${i})`;
		case "romanLcPlain": return a;
		case "romanLcPeriod": return `${a}.`;
		case "romanLcParenR": return `${a})`;
		case "romanLcParenBoth": return `(${a})`;
		case "romanUcPlain": return o;
		case "romanUcPeriod": return `${o}.`;
		case "romanUcParenR": return `${o})`;
		case "romanUcParenBoth": return `(${o})`;
		default: return `${n}.`;
	}
}
function zr(e) {
	let t = [
		1e3,
		900,
		500,
		400,
		100,
		90,
		50,
		40,
		10,
		9,
		5,
		4,
		1
	], n = [
		"M",
		"CM",
		"D",
		"CD",
		"C",
		"XC",
		"L",
		"XL",
		"X",
		"IX",
		"V",
		"IV",
		"I"
	], r = "";
	for (let i = 0; i < t.length; i++) for (; e >= t[i];) r += n[i], e -= t[i];
	return r;
}
function Br(e) {
	for (let t of e.runs) if (t.type === "text" && t.text !== "" || t.type === "math") return !0;
	return !1;
}
function Vr(e, t) {
	let n = Br(e);
	if (e.bullet.type === "char") return t.clear(), n ? xe(e.bullet.char, e.bullet.fontFamily ?? null) : "";
	if (e.bullet.type === "autoNum") {
		if (!n) return "";
		let r = e.lvl;
		return t.has(r) ? t.set(r, t.get(r) + 1) : t.set(r, e.bullet.startAt ?? 1), Rr(t.get(r), e.bullet.numType);
	}
	return t.clear(), "";
}
function Hr(t, n, r, i, a, o, s, c = null, l = 0, u = !1, d = !1, f = "#000000", p, m = {
	themeMajorFont: null,
	themeMinorFont: null,
	dpr: 1
}, h, g = !1, _, v = !1, y = g) {
	let b = n.vert === "vert" || n.vert === "eaVert", x = n.vert === "vert270";
	if (b || x) {
		let e = r + a / 2, u = i + o / 2, d = b ? 90 : -90, v = h ? (e) => h({
			...e,
			inShapeX: e.inShapeX - o / 2 + a / 2,
			inShapeY: e.inShapeY - a / 2 + o / 2,
			shapeX: r,
			shapeY: i,
			shapeW: a,
			shapeH: o,
			rotation: l,
			textBodyRotation: d
		}) : void 0;
		if (g) return a;
		t.save(), t.translate(e, u), t.rotate(x ? -Math.PI / 2 : Math.PI / 2), Hr(t, {
			...n,
			vert: "horz"
		}, -o / 2, -a / 2, o, a, s, c, 0, !1, !1, f, p, m, v, !1, _, n.vert === "eaVert"), t.restore();
		return;
	}
	let S = n.textWarp;
	if (!g && S && it(S.preset)) {
		Tr(t, n, S.preset, S.adj ?? [], r, i, a, o, s, c ?? f, m);
		return;
	}
	let C = Y(n.lIns, s), w = Y(n.rIns, s), T = Y(n.tIns, s), E = Y(n.bIns, s), D = n.wrap !== "none", O = n.autoFit === "sp" ? D && tr(t, n, a, C, w, s, m) : D, A = Math.max(1, n.numCol ?? 1), j = Y(n.spcCol ?? 0, s), M = n.defaultBold ?? !1, N = n.defaultItalic ?? !1, P = c ?? f, F = (e) => {
		let i = (n.defaultFontSize ?? 18) * J * s * e, o = [], c = 0, l = /* @__PURE__ */ new Map();
		for (let u = 0; u < n.paragraphs.length; u++) {
			let d = n.paragraphs[u], f = Y(d.marL, s), h = Y(d.marR, s), _ = Y(d.indent, s), v = d.defFontSize == null ? i : d.defFontSize * J * s * e, b = d.defColor ? Z(d.defColor) : P, x = Zn(d), S = (() => {
				for (let e of d.runs) if (e.type === "text" && e.fontSize != null) return e.fontSize;
				return d.defFontSize ?? n.defaultFontSize ?? 18;
			})() * J * s * e, T = (() => {
				for (let e of d.runs) if (e.type === "text" && e.color) return e.color;
				return null;
			})(), E = T ? Z(T) : b, D = (() => {
				for (let e of d.runs) if (e.type === "text" && e.fontFamily) return e.fontFamily;
				return d.defFontFamily ?? null;
			})(), k = "", F = Xn(!1, !1, S, "sans-serif", m), I = E, L = null;
			k = Vr(d, l);
			let R = $e(d.bullet);
			if (R.type === "char") {
				let t = R;
				F = Xn(!1, !1, t.sizePts == null ? t.sizePct == null ? S : S * (t.sizePct / 100) : t.sizePts * J * s * e, k === t.char ? zn(t.fontFamily ?? null, m) : "sans-serif", m), I = t.color ? Z(t.color) : E;
			} else if (R.type === "autoNum") {
				let t = R;
				F = Xn(!1, !1, t.sizePts == null ? t.sizePct == null ? S : S * (t.sizePct / 100) : t.sizePts * J * s * e, zn(t.fontFamily ?? D, m), m), I = R.color ? Z(R.color) : E;
			} else if (R.type === "blip") {
				let t = R, r = Qn(n, d, t) * J * s * e;
				L = {
					imagePath: t.imagePath,
					mimeType: t.mimeType,
					sizePx: r
				};
			}
			let z = A > 1 ? (a - C - w - (A - 1) * j) / A : a - C - w, B = r + C + f, V = r + C + f + _, H = z - f - h, U = or(t, d, O ? H : Infinity, v, b, s, f, M, N, e, p, m, $n(x, _)), ee = d.spaceBefore == null ? 0 : d.spaceBefore / 100 * J * s * e, W = d.spaceAfter == null ? 0 : d.spaceAfter / 100 * J * s * e;
			for (let e = 0; e < U.length; e++) {
				let r = U[e], i = e === 0, a = e === U.length - 1, l = 0, f = 0;
				for (let e of r.segments) {
					let t = e.math ? Math.max(e.sizePx, (e.math.ascent + e.math.descent) / 1.2) : e.sizePx;
					if (t > l && (l = t), !e.math) {
						let t = q(e.fontFamily, e.sizePx);
						t > f && (f = t);
					}
				}
				if (l === 0 && (l = v), i && k) {
					t.font = F;
					let e = t.measureText("M"), n = e.actualBoundingBoxAscent + e.actualBoundingBoxDescent;
					n > l && (l = n);
				}
				i && L && L.sizePx > l && (l = L.sizePx);
				let p = l * 1.2, m = Math.max(p, f), h;
				h = d.spaceLine ? d.spaceLine.type === "pct" ? (g ? l : p) * (d.spaceLine.val / 1e5) : d.spaceLine.val * J * s : g ? y ? p : l : m, n.autoFit === "norm" && n.lnSpcReduction != null && d.spaceLine?.type !== "pts" && (h *= 1 - n.lnSpcReduction);
				let b = h + (a ? W : 0), S = i && u > 0 ? ee : 0, C = i ? $n(x, _) : 0, w = r.segments.some((e) => e.text && e.text.length > 0 || e.math != null), T = i && w ? L : null;
				o.push({
					line: r,
					linePx: b,
					lineHeight: h,
					topGapPx: S,
					textXOffset: C,
					bulletLabel: i ? k : "",
					bulletFont: F,
					bulletColor: I,
					bulletX: V,
					bulletImage: T,
					textX: B,
					textMaxW: H,
					alignment: d.alignment,
					isLastLine: a,
					para: d
				}), c += b + S;
			}
		}
		return {
			allLines: o,
			totalHeight: c
		};
	}, { allLines: I, totalHeight: L } = F(1);
	if (n.autoFit === "norm") if (n.fontScale != null && n.fontScale > 0) n.fontScale < 1 && ({allLines: I, totalHeight: L} = F(n.fontScale));
	else {
		let e = o - T - E;
		if (L > e && e > 0) {
			let t = .1, n = 1;
			for (let r = 0; r < 6; r++) {
				let r = (t + n) / 2;
				F(r).totalHeight <= e ? t = r : n = r;
			}
			({allLines: I, totalHeight: L} = F(t));
		}
	}
	if (g) return T + L + E;
	let R = n.verticalAnchor ?? "t", z = i, B;
	o === 0 && R === "b" ? (B = T + L + E, z = i - B) : B = n.autoFit === "sp" ? Math.max(o, T + L + E) : o;
	let V, H = Math.max(0, B - T - E);
	V = R === "ctr" ? z + T + (H - L) / 2 : R === "b" ? z + B - E - L : z + T, t.save(), t.textAlign = "left", t.textBaseline = "alphabetic";
	let U = V, ee = A > 1 ? (a - C - w - (A - 1) * j) / A + j : 0, W = Math.max(0, B - T - E), te = I[I.length - 1], G = te ? Math.max(0, te.linePx - te.lineHeight) : 0, K = L - G, ne = o === 0 || K <= W + .5, re = A > 1 && !ne ? Math.ceil(I.length / A) : I.length, ie = 0, ae = 0;
	for (let c of I) {
		let { line: u, linePx: d, lineHeight: f, topGapPx: p, textXOffset: g, bulletLabel: y, bulletFont: b, bulletColor: x, bulletImage: S, alignment: C, isLastLine: w } = c;
		A > 1 && ie < A - 1 && ae >= re && (ie++, ae = 0, V = U), V += p, ae++;
		let T = (n.rtlCol ? A - 1 - ie : ie) * ee, E = c.textX + T, D = c.bulletX + T, O = c.textMaxW, j = c.para.rtl === !0, M = j || ln(u.segments), N = u.segments.some((e) => e.isTab);
		if (N) {
			let e = Y(c.para.marL, s), n = Y(c.para.marR, s), r = j ? n : e + g, i = O + e + n;
			t.font = u.segments.find((e) => e.isTab).font;
			let a = t.measureText(" ").width, o = xn(u.segments.map((e) => {
				if (e.isTab) return {
					isTab: !0,
					width: 0
				};
				if (e.math) return {
					isTab: !1,
					width: e.math.width
				};
				t.font = e.font;
				let n = e.letterSpacingPx ?? 0;
				return {
					isTab: !1,
					width: e.text ? (e.leadingLetterSpacingPx ?? 0) + Q(t, e.text, n) : 0
				};
			}), (c.para.tabStops ?? []).map((e) => ({
				pos: Y(e.pos, s),
				algn: e.algn
			})), r, i, a, Y(c.para.defTabSz ?? 914400, s));
			for (let e = 0; e < u.segments.length; e++) u.segments[e].isTab && (u.segments[e].tabWidthPx = o[e]);
		}
		let P = 0, F = f * .8;
		for (let e of u.segments) {
			if (e.isTab) {
				P += e.tabWidthPx ?? 0;
				continue;
			}
			if (e.math) {
				P += e.math.width, F = Math.max(F, e.math.ascent);
				continue;
			}
			t.font = e.font;
			let n = t.measureText(e.text || "M"), r = e.letterSpacingPx ?? 0;
			P += e.leadingLetterSpacingPx ?? 0, P += e.text ? Q(t, e.text, r) : 0, n.actualBoundingBoxAscent > 0 && (F = Math.max(F, n.actualBoundingBoxAscent));
		}
		let I = V + F, L = E + O, R = S && _ ? m.pictureBulletImages?.has(S.imagePath) ? m.pictureBulletImages.get(S.imagePath) : k(S.imagePath, _) : void 0, z = 0;
		if (M && j) {
			if (y) t.font = b, z = t.measureText(y).width;
			else if (S && R) {
				let e = S.sizePx;
				z = R.height > 0 ? e * (R.width / R.height) : e;
			}
		}
		if (y) if (t.font = b, t.fillStyle = x, M && j) {
			let e = t.direction;
			t.direction = "rtl", t.fillText(y, L - z, I), t.direction = e;
		} else t.fillText(y, D, I);
		if (S && _ && R) {
			let e = S.sizePx, n = R.height > 0 ? e * (R.width / R.height) : e, r = I - e;
			M && j ? t.drawImage(R, L - n, r, n, e) : t.drawImage(R, D, r, n, e);
		}
		let B = E + g, H;
		H = N ? j ? E + O - z - P : B : C === "ctr" ? B + (O - g - P) / 2 : C === "r" ? E + O - z - P : B;
		let W = C === "just" || C === "justLow" ? "just" : C === "thaiDist" ? "thaiDist" : C === "dist" ? "dist" : null, te = w || (u.endsWithBreak ?? !1), G = (W && !M && !N ? pn(u.segments, O - g, P, W, te) : null) ?? u.segments, K = M ? un(u.segments, j) : null, q = (e, t) => {
			if (Math.abs(e - t) !== 1) return 0;
			let n = u.segments[Math.min(e, t)], r = u.segments[Math.max(e, t)];
			return n.isTab || n.math || r.isTab || r.math || n.sourceRunId == null || n.sourceRunId !== r.sourceRunId ? 0 : r.leadingLetterSpacingPx ?? 0;
		}, ne = G.length;
		for (let n = 0; n < ne; n++) {
			let c = K ? K.order[n] : n, u = G[c], d = K ? K.rtl[c] : !1;
			if (M && (t.direction = d ? "rtl" : "ltr"), n > 0) {
				let e = K ? K.order[n - 1] : n - 1;
				H += q(e, c);
			}
			if (u.isTab) {
				H += u.tabWidthPx ?? 0;
				continue;
			}
			let p = u.jext ?? 0, g = u.splitBefore, _ = u.perGap ?? 0, y = g && g.length > 0 ? g.length * _ : 0;
			if (u.math) {
				let e = Fn.get(u.math.nodes), n = u.math.width, r = u.math.ascent + u.math.descent;
				if (e && n > 0 && r > 0) {
					let i = I - u.math.ascent, a = In(e, u.color);
					t.drawImage(a, H, i, n, r);
				}
				H += n, H += p;
				continue;
			}
			t.font = u.font, t.fillStyle = u.color;
			let b = u.drawSizePx ?? u.sizePx, x = I + (u.baseline ? -(u.baseline / 1e5) * u.sizePx : 0), S = u.letterSpacingPx ?? 0;
			if (u.highlight && u.text) {
				let e = Q(t, u.text, S) + y + p;
				Nn(t, H, x, e, b, u.highlight, u.color);
			}
			let C = u.shadow, w = (e, t, n, r) => {
				let i = r === "fill" ? e.fillText.bind(e) : e.strokeText.bind(e);
				if (S !== 0 && rr(t) > 1) {
					let r = e, a = r.letterSpacing;
					if (ar(e)) {
						r.letterSpacing = `${S}px`, i(t, n, x);
						try {
							r.letterSpacing = a;
						} catch {}
					} else {
						let r = n, a = [...t];
						for (let t = 0; t < a.length; t++) {
							let n = a[t];
							i(n, r, x), t < a.length - 1 && (r += e.measureText(n).width + S);
						}
					}
				} else i(t, n, x);
			}, T = (e) => Q(t, e, S), E = g && g.length > 0 ? en([...u.text], g, _, T) : null, D = [...u.text], O = !!g && g.length === D.length - 1 && D.length > 1, k = (e, t) => {
				if (v) {
					let n = O ? S + _ : S;
					En(e, u.text, H, x, b, n, t);
					return;
				}
				if (O) {
					let n = t === "fill" ? e.fillText.bind(e) : e.strokeText.bind(e), r = S + _;
					if (ar(e)) {
						let t = e, i = t.letterSpacing;
						t.letterSpacing = `${r}px`, n(u.text, H, x);
						try {
							t.letterSpacing = i;
						} catch {}
					} else {
						let t = H;
						for (let i = 0; i < D.length; i++) {
							let a = D[i];
							n(a, t, x), i < D.length - 1 && (t += e.measureText(a).width + r);
						}
					}
				} else if (E) for (let { text: n, dx: r } of E) w(e, n, H + r, t);
				else w(e, u.text, H, t);
			}, A = u.reflection;
			if (A && u.text) {
				let e = t.canvas.width || 0, n = t.canvas.height || 0;
				if (e > 0 && n > 0) {
					t.font = u.font;
					let r = t.measureText(u.text), i = Number.isFinite(r.actualBoundingBoxAscent) ? r.actualBoundingBoxAscent : b * .8, a = Number.isFinite(r.actualBoundingBoxDescent) ? r.actualBoundingBoxDescent : b * .2, o = Number.isFinite(r.actualBoundingBoxLeft) ? r.actualBoundingBoxLeft : 0, c = Number.isFinite(r.actualBoundingBoxRight) ? r.actualBoundingBoxRight : r.width, l = t.getTransform(), d = Math.abs(l.a * l.d - l.b * l.c), f = d > 0 ? Math.sqrt(d) : 1;
					Yn(t, (e) => {
						e.font = u.font, e.fillStyle = u.color, k(e, "fill");
					}, {
						x: (H - o) * f,
						y: (x - i) * f,
						w: Math.max(1, o + c) * f,
						h: Math.max(1, i + a) * f
					}, A, s * f, l, e, n), t.font = u.font, t.fillStyle = u.color;
				}
			}
			if (C) {
				let e = C.dir * Math.PI / 180, n = Y(C.dist, s);
				t.save(), t.shadowColor = Z(C.color, C.alpha), t.shadowBlur = Y(C.blur, s), t.shadowOffsetX = Math.cos(e) * n, t.shadowOffsetY = Math.sin(e) * n;
			}
			k(t, "fill"), C && t.restore();
			let j = u.outline;
			j && j.width > 0 && (t.save(), t.lineWidth = Math.max(.5, Y(j.width, s)), t.strokeStyle = j.color ? `#${j.color}` : u.color, t.lineJoin = "round", k(t, "stroke"), t.restore()), t.font = u.font;
			let N = Q(t, u.text, S) + y;
			if (h && u.text && h({
				text: u.text,
				inShapeX: H - r,
				inShapeY: V - i,
				w: N + p,
				h: f,
				fontSize: b,
				font: u.font,
				shapeX: r,
				shapeY: i,
				shapeW: a,
				shapeH: o,
				rotation: l,
				hyperlink: u.hyperlink
			}), u.underline && Qt(t, H, x, N + p, b, u.underlineColor ?? u.color, u.underlineStyle, m.dpr), u.strikethrough) {
				let n = Math.max(1, b * .05);
				t.strokeStyle = u.color, t.lineWidth = n, t.setLineDash([]);
				let r = x - b * .32;
				if (u.strikeDouble) {
					let i = n * .9, a = r - i, o = r + i;
					t.beginPath(), t.moveTo(H, a + e(a, n, m.dpr)), t.lineTo(H + N + p, a + e(a, n, m.dpr)), t.moveTo(H, o + e(o, n, m.dpr)), t.lineTo(H + N + p, o + e(o, n, m.dpr)), t.stroke();
				} else {
					let i = r + e(r, n, m.dpr);
					t.beginPath(), t.moveTo(H, i), t.lineTo(H + N + p, i), t.stroke();
				}
			}
			H += N, H += p;
		}
		M && (t.direction = "ltr"), V += d;
	}
	t.restore();
}
function Ur(e, t, n, r, i) {
	if (!e) return [];
	let a = Bt(t?.rig ?? "threePt", t?.dir ?? "t", t?.rot), o = Kt(n), s = r * i, c = [];
	return e.bevelT && e.bevelT.w > 0 && e.bevelT.h > 0 && c.push({
		widthPx: e.bevelT.w * s,
		heightPx: e.bevelT.h * s,
		prst: e.bevelT.prst || "circle",
		material: o,
		light: a
	}), e.bevelB && e.bevelB.w > 0 && e.bevelB.h > 0 && c.push({
		widthPx: e.bevelB.w * s,
		heightPx: e.bevelB.h * s,
		prst: e.bevelB.prst || "circle",
		material: o,
		light: a,
		bottom: !0
	}), c;
}
function Wr(e, t, n, r, i, a) {
	if (!e || !e.extrusionH || e.extrusionH <= 0) return null;
	let o = e.extrusionH * i * a, s = Tt(t, n * a, r * a, o);
	if (Math.hypot(s.x, s.y) < .75) return null;
	let c = [
		64,
		64,
		64
	];
	if (e.extrusionClr) {
		let t = e.extrusionClr.replace("#", "");
		t.length >= 6 && (c = [
			parseInt(t.slice(0, 2), 16),
			parseInt(t.slice(2, 4), 16),
			parseInt(t.slice(4, 6), 16)
		]);
	}
	return {
		offsetX: s.x,
		offsetY: s.y,
		rgb: c
	};
}
function Gr(e, t, n, r, i, a, o, s = {}) {
	if (i <= 0 || a <= 0) return !1;
	let c = e.getTransform(), l = Math.abs(c.a * c.d - c.b * c.c), u = l > 0 ? Math.sqrt(l) : 1, d = Math.max(0, Math.ceil((s.edgePadCss ?? 0) * u)), f = Ct(t, i, a), p = f.corners;
	if (d > 0) {
		let e = d / u, t = Ke(f.corners, e / i, e / a);
		t ? p = t : d = 0;
	}
	let m = d / u, h = Math.max(1, Math.ceil(i * u) + 2 * d), g = Math.max(1, Math.ceil(a * u) + 2 * d), _ = je(h, g);
	if (!_) return !1;
	let v = _.getContext("2d");
	if (!v) return !1;
	v.save(), v.scale(u, u), v.translate(m, m), o(v, 0, 0, i, a), v.restore();
	let y = Math.ceil(i * u), b = Math.ceil(a * u), x = (e) => ({
		x: d - e,
		y: d - e,
		w: y + 2 * e,
		h: b + 2 * e
	});
	if (s.extrusion) {
		let e = Math.ceil(Math.hypot(s.extrusion.offsetX, s.extrusion.offsetY)) + 2;
		Zt(v, s.extrusion, x(e));
	}
	if (s.bevels && s.bevels.length > 0) for (let e of s.bevels) Xt(v, e, x(Math.ceil(e.widthPx) + 2));
	return s.paintEdges && (v.save(), v.scale(u, u), v.translate(m, m), s.paintEdges(v, 0, 0, i, a), v.restore()), ze(_, e, h, g, p.map((e) => ({
		x: n + e.x,
		y: r + e.y
	}))), !0;
}
function Kr(e, t, n, r, i, a, o, s, c = 0) {
	if (r <= 0 || i <= 0 || a.length === 0) return !1;
	let l = e.getTransform(), u = Math.abs(l.a * l.d - l.b * l.c), d = u > 0 ? Math.sqrt(u) : 1, f = Math.max(0, Math.ceil(c * d)), p = f / d, m = Math.max(1, Math.ceil(r * d) + 2 * f), h = Math.max(1, Math.ceil(i * d) + 2 * f), g = je(m, h);
	if (!g) return !1;
	let _ = g.getContext("2d");
	if (!_) return !1;
	_.save(), _.scale(d, d), _.translate(p, p), o(_, 0, 0, r, i), _.restore();
	let v = Math.ceil(r * d), y = Math.ceil(i * d);
	for (let e of a) {
		let t = Math.ceil(e.widthPx) + 2;
		Xt(_, e, {
			x: f - t,
			y: f - t,
			w: v + 2 * t,
			h: y + 2 * t
		});
	}
	return s && (_.save(), _.scale(d, d), _.translate(p, p), s(_, 0, 0, r, i), _.restore()), e.drawImage(g, t - p, n - p, m / d, h / d), !0;
}
var qr = /* @__PURE__ */ new WeakMap();
function Jr(e) {
	let t = qr.get(e);
	return t || (t = async (t, n) => {
		let r = await e(t);
		return r.type === n ? r : new Blob([r], { type: n });
	}, qr.set(e, t)), t;
}
function Yr(e, t, n = Jr(t), r, i, a) {
	let o = Jr(t);
	return K(e.posterPath, e.posterMimeType || "application/octet-stream", o, {
		tiff: r,
		svgDecoder: a,
		...i ?? {}
	}, n).then((e) => {
		if (!e) throw Error("Media poster could not be decoded");
		return e;
	});
}
function Xr(e, t, n) {
	let r = Y(t.x, n), i = Y(t.y, n), a = Y(t.width, n), o = Y(t.height, n);
	e.save();
	try {
		t.alpha != null && (e.globalAlpha *= t.alpha), (t.rotation !== 0 || t.flipH || t.flipV) && (e.translate(r + a / 2, i + o / 2), e.rotate(t.rotation * Math.PI / 180), e.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1), e.translate(-(r + a / 2), -(i + o / 2))), ue(e, "tiff", {
			x: r,
			y: i,
			width: a,
			height: o
		});
	} finally {
		e.restore();
	}
}
async function Zr(e, t, n, r, i, o, s = 1, c, l) {
	if (i) try {
		let a = t.mimeType === "image/svg+xml", u = Pe(t.mimeType, t.srcRect, t.width / J, t.height / J);
		if (!u) return;
		let { widthPt: d, heightPt: f } = u, p = Dn(Y(t.width, n), Y(t.height, n), s, t.srcRect), h = A(t) || a, g = h ? p : l && !t.duotone ? On(l, X(kn(t), h ? void 0 : t.duotone)) : void 0, _ = g && "maxRetainedPixels" in g ? g.maxRetainedPixels : void 0, y = {
			...g ? {
				targetWidthPx: g.targetWidthPx,
				targetHeightPx: g.targetHeightPx,
				..._ === void 0 ? {} : { maxRetainedPixels: _ }
			} : {},
			workerDecoder: c
		}, b;
		if (A(t)) try {
			b = await I(t.svgImagePath, i, y);
		} catch {
			b = a ? await I(t.imagePath, i, y) : await Ye(t.imagePath, t.mimeType, t.duotone, i, {
				widthPt: d,
				heightPt: f,
				...g ?? {},
				tiff: o
			});
		}
		else b = a ? await I(t.imagePath, i, y) : await Ye(t.imagePath, t.mimeType, t.duotone, i, {
			widthPt: d,
			heightPt: f,
			...g ?? {},
			tiff: o
		});
		if (!b || r()) return;
		e.save(), t.alpha != null && (e.globalAlpha *= t.alpha);
		let x = Y(t.x, n), S = Y(t.y, n), C = Y(t.width, n), w = Y(t.height, n);
		(t.rotation !== 0 || t.flipH || t.flipV) && (e.translate(x + C / 2, S + w / 2), e.rotate(t.rotation * Math.PI / 180), t.flipH && e.scale(-1, 1), t.flipV && e.scale(1, -1), e.translate(-(x + C / 2), -(S + w / 2)));
		let T = (e, n, r, i, a) => {
			t.custGeom && t.custGeom.length > 0 ? Lr(e, t.custGeom, n, r, i, a) : t.prstGeom && v(e, t.prstGeom, n, r, i, a, t.prstAdjust ?? []) || e.rect(n, r, i, a);
		}, E = (e, t, n, r, i) => {
			e.beginPath(), T(e, t, n, r, i);
		}, D = (e, n, r, i, a) => {
			(t.prstGeom || t.custGeom && t.custGeom.length > 0) && (E(e, n, r, i, a), e.clip());
		}, O = (e, r, i, a, o) => {
			t.stroke && (e.save(), ei(e, t.stroke, n, {
				x: r,
				y: i,
				w: a,
				h: o
			}, t.rotation), E(e, r, i, a, o), e.stroke(), e.restore());
		}, k = (e, r, i, a, o) => {
			let s = t.sp3d;
			if (s && (s.contourW ?? 0) > 0 && s.contourClr) {
				let t = Math.max(.5, s.contourW * n);
				e.save(), e.beginPath();
				let c = t * 2 + Math.max(a, o);
				e.rect(r - c, i - c, a + 2 * c, o + 2 * c), T(e, r, i, a, o), e.clip("evenodd"), e.beginPath(), E(e, r, i, a, o), e.strokeStyle = Z(s.contourClr), e.lineWidth = t * 2, e.setLineDash([]), e.stroke(), e.restore();
			}
		}, j = t.scene3d && wt(t.scene3d.camera) ? t.scene3d : null, M = (e, n, r, i, a) => {
			e.save(), D(e, n, r, i, a), Me(e, b, t.srcRect, n, r, i, a), e.restore();
		}, N = (e, t, n, r, i) => {
			M(e, t, n, r, i), O(e, t, n, r, i), k(e, t, n, r, i);
		}, P = (e, t, n, r, i) => {
			M(e, t, n, r, i), O(e, t, n, r, i);
		}, F = e.getTransform(), L = Math.abs(F.a * F.d - F.b * F.c), R = L > 0 ? Math.sqrt(L) : 1, z = Ur(t.sp3d, t.scene3d?.lightRig, t.sp3d ? t.sp3d.prstMaterial : void 0, n, R), B = j ? Wr(t.sp3d, j.camera, C, w, n, R) : null, V = t.stroke ? t.stroke.width * n / 2 : 0, H = t.sp3d?.contourW ? t.sp3d.contourW * n : 0, U = B ? Math.hypot(B.offsetX, B.offsetY) / R : 0, ee = V + H + U + 2, te = (e) => {
			if (j) {
				if (Gr(e, j.camera, x, S, C, w, P, {
					bevels: z,
					extrusion: B ?? void 0,
					paintEdges: k,
					edgePadCss: ee
				})) return;
			} else if (z.length > 0 && Kr(e, x, S, C, w, z, P, k, ee)) return;
			N(e, x, S, C, w);
		}, G = (e, t, n, r, i, a) => {
			e.save(), D(e, n, r, i, a), e.fillStyle = t, e.fillRect(n, r, i, a), e.restore();
		}, K = (e, t) => {
			j && Gr(e, j.camera, x, S, C, w, (e, n, r, i, a) => G(e, t, n, r, i, a)) || G(e, t, x, S, C, w);
		}, q = e.getTransform(), ne = Math.abs(q.a * q.d - q.b * q.c), re = ne > 0 ? Math.sqrt(ne) : 1, ie = V + H, ae = (t.custGeom && t.custGeom.length > 0 ? ge(t.custGeom, x, S, C, w) : t.prstGeom && m(t.prstGeom.toLowerCase()) ? W(t.prstGeom.toLowerCase(), x, S, C, w, t.prstAdjust ?? []) : null) ?? {
			x,
			y: S,
			w: C,
			h: w
		}, oe = j ? Nr(j.camera, q, x, S, C, w, ee, t.shadow?.algn) : {
			bbox: kr(q, ae.x - ie, ae.y - ie, ae.w + ie * 2, ae.h + ie * 2),
			anchor: Mr(q, x, S, C, w, t.shadow?.algn)
		}, se = n * re, ce = !!(t.shadow || t.innerShadow || t.glow || t.softEdge || t.reflection), le = (e) => K(e, "#000");
		Fr(e, t, j && ce ? Pr(te, q, oe.bbox, {
			w: e.canvas.width || 0,
			h: e.canvas.height || 0
		}) : te, j && ce ? Pr(le, q, oe.bbox, {
			w: e.canvas.width || 0,
			h: e.canvas.height || 0
		}) : le, oe.bbox, oe.anchor, n, se, q), e.restore();
	} catch (i) {
		if (a(i, "tiff")) {
			r() || Xr(e, t, n);
			return;
		}
		if (Re(i) || Je(i)) throw i;
	}
}
async function Qr(e, t, n, r, i, o, s, c, l = 1, u, d) {
	let f = Y(t.x, n), p = Y(t.y, n), m = Y(t.width, n), h = Y(t.height, n), g, _ = !1;
	if (t.posterPath && i) try {
		g = await Yr(t, i, s, c, t.posterMimeType === "image/svg+xml" ? Dn(m, h, l) : d ? On(d, X(t.posterPath)) : void 0, u);
	} catch (e) {
		if (a(e, "tiff")) _ = !0;
		else if (Re(e) || Je(e)) throw e;
	}
	r() || (e.save(), ti(e, t, n), g ? e.drawImage(g, f, p, m, h) : (e.fillStyle = t.mediaKind === "video" ? "#111" : "#f0f0f0", e.fillRect(f, p, m, h), _ && ue(e, "tiff", {
		x: f,
		y: p,
		width: m,
		height: h
	})), o || on(e, f + m / 2, p + h / 2, m, h, "paused"), e.restore());
}
function $r(e, t, n, r, i, a, o) {
	let s = Math.max(.5, Y(r.width, a)), c = n.x - t.x, l = n.y - t.y, u = Math.hypot(c, l);
	if (u === 0) return;
	let d = -l / u, f = c / u, p;
	switch (i) {
		case "dbl":
			p = [{
				offset: -1 / 3,
				widthFrac: 1 / 3
			}, {
				offset: 1 / 3,
				widthFrac: 1 / 3
			}];
			break;
		case "thinThick":
			p = [{
				offset: -3 / 8,
				widthFrac: 1 / 4
			}, {
				offset: 1 / 4,
				widthFrac: 1 / 2
			}];
			break;
		case "thickThin":
			p = [{
				offset: -1 / 4,
				widthFrac: 1 / 2
			}, {
				offset: 3 / 8,
				widthFrac: 1 / 4
			}];
			break;
		case "tri":
			p = [
				{
					offset: -2 / 5,
					widthFrac: 1 / 5
				},
				{
					offset: 0,
					widthFrac: 3 / 5
				},
				{
					offset: 2 / 5,
					widthFrac: 1 / 5
				}
			];
			break;
		default: return;
	}
	e.save(), e.globalCompositeOperation = "destination-out", e.strokeStyle = "#000", e.lineWidth = s + .5, e.setLineDash([]), e.beginPath(), e.moveTo(t.x, t.y), e.lineTo(n.x, n.y), e.stroke(), e.globalCompositeOperation = "source-over", e.strokeStyle = (r.fill ? Pn(r.fill, e, Math.min(t.x, n.x), Math.min(t.y, n.y), Math.max(1, Math.abs(n.x - t.x)), Math.max(1, Math.abs(n.y - t.y)), o) : null) ?? Z(r.color);
	for (let r of p) {
		let i = d * (s * r.offset), a = f * (s * r.offset);
		e.lineWidth = Math.max(.5, s * r.widthFrac), e.beginPath(), e.moveTo(t.x + i, t.y + a), e.lineTo(n.x + i, n.y + a), e.stroke();
	}
	e.restore();
}
function ei(e, t, n, r, i = 0) {
	if (Ae(e, t, n), t?.fill && r) {
		let n = Pn(t.fill, e, r.x, r.y, r.w, r.h, i);
		n && (e.strokeStyle = n);
	}
}
function ti(e, t, n) {
	if (t.rotation === 0 && !t.flipH && !t.flipV) return;
	let r = Y(t.x, n), i = Y(t.y, n), a = Y(t.width, n), o = Y(t.height, n);
	e.translate(r + a / 2, i + o / 2), e.rotate(t.rotation * Math.PI / 180), t.flipH && e.scale(-1, 1), t.flipV && e.scale(1, -1), e.translate(-(r + a / 2), -(i + o / 2));
}
function ni(t, n, r, i, a = {
	themeMajorFont: null,
	themeMinorFont: null,
	dpr: 1
}, o) {
	t.save(), ti(t, n, r);
	let s = Y(n.x, r), c = Y(n.y, r), l = n.cols.map((e) => Y(e, r)), u = l.length, d = (e, t) => {
		let n = 0;
		for (let r = 0; r < t; r++) n += l[e + r] ?? 0;
		return n;
	}, f = n.rows.map((e) => Y(e.height, r));
	for (let e = 0; e < n.rows.length; e++) {
		let o = n.rows[e];
		for (let n = 0; n < o.cells.length; n++) {
			let s = o.cells[n];
			if (s.hMerge || s.vMerge || (s.rowSpan || 1) > 1 || !s.textBody) continue;
			let c = d(n, s.gridSpan || 1), l = Hr(t, s.textBody, 0, 0, c, 0, r, null, 0, !1, !1, "#000000", i, a, void 0, !0, void 0, !1, o.height === 0) || 0;
			l > f[e] && (f[e] = l);
		}
	}
	for (let e = 0; e < n.rows.length; e++) {
		let o = n.rows[e];
		for (let s = 0; s < o.cells.length; s++) {
			let c = o.cells[s];
			if (c.hMerge || c.vMerge) continue;
			let l = c.rowSpan || 1;
			if (l <= 1 || !c.textBody) continue;
			let u = d(s, c.gridSpan || 1), p = n.rows.slice(e, Math.min(n.rows.length, e + l)).some((e) => e.height === 0), m = Hr(t, c.textBody, 0, 0, u, 0, r, null, 0, !1, !1, "#000000", i, a, void 0, !0, void 0, !1, p) || 0, h = 0;
			for (let t = 0; t < l && e + t < f.length; t++) h += f[e + t];
			if (m > h) {
				let t = (m - h) / l;
				for (let n = 0; n < l && e + n < f.length; n++) f[e + n] += t;
			}
		}
	}
	let p = l.reduce((e, t) => e + t, 0), m = Array(u);
	if (n.rtl) {
		let e = s + p;
		for (let t = 0; t < u; t++) e -= l[t], m[t] = e;
	} else {
		let e = s;
		for (let t = 0; t < u; t++) m[t] = e, e += l[t];
	}
	let h = (e, t) => n.rtl ? m[e + t - 1] : m[e], g = Array(n.rows.length);
	{
		let e = c;
		for (let t = 0; t < n.rows.length; t++) g[t] = e, e += f[t];
	}
	let _, v = {
		row: 0,
		column: 0
	};
	if (o) {
		let e = Y(n.width, r), t = Y(n.height, r), i = s + e / 2, a = c + t / 2, l = n.rotation * Math.PI / 180, u = Math.cos(l), d = Math.sin(l);
		_ = (e) => {
			let t = e.shapeX + e.shapeW / 2 - i, r = e.shapeY + e.shapeH / 2 - a;
			n.flipH && (t = -t), n.flipV && (r = -r);
			let s = i + u * t - d * r, c = a + d * t + u * r;
			o({
				...e,
				...n.id === void 0 ? {} : { shapeId: n.id },
				shapeX: s - e.shapeW / 2,
				shapeY: c - e.shapeH / 2,
				rotation: n.rotation,
				...n.flipH ? { shapeFlipH: !0 } : {},
				...n.flipV ? { shapeFlipV: !0 } : {},
				tableCell: v
			});
		};
	}
	let y = [], b = n.rows.map(() => Array(u).fill(-1));
	for (let e = 0; e < n.rows.length; e++) {
		let t = n.rows[e], r = g[e];
		for (let i = 0; i < t.cells.length; i++) {
			let a = t.cells[i];
			if (a.hMerge || a.vMerge) continue;
			let o = a.gridSpan || 1, s = a.rowSpan || 1, c = d(i, o), l = 0;
			for (let t = 0; t < s; t++) l += f[e + t] ?? 0;
			let p = h(i, o), m = Math.min(e + s - 1, n.rows.length - 1), g = y.length;
			y.push({
				cell: a,
				colX: p,
				rowY: r,
				cellW: c,
				cellH: l,
				ci: i,
				ri: e,
				span: o,
				lastRi: m
			});
			for (let t = e; t <= m; t++) for (let e = i; e < i + o && e < u; e++) b[t][e] = g;
		}
	}
	for (let { cell: e, colX: o, rowY: s, cellW: c, cellH: l, ci: u, ri: d } of y) {
		let f = Pn(e.fill, t, o, s, c, l, n.rotation);
		if (f && (t.fillStyle = f, t.fillRect(o, s, c, l)), e.textBody) {
			_ && (v = {
				row: d,
				column: u
			});
			let n = e.textColor ? Z(e.textColor) : null;
			Hr(t, e.textBody, o, s, c, l, r, n, 0, !1, !1, "#000000", i, a, _);
		}
	}
	let x = a.dpr, S = (e, t) => {
		if (e < 0 || e >= b.length || t < 0 || t >= u) return null;
		let n = b[e][t];
		return n < 0 ? null : y[n];
	}, C = (i, a, o, s, c) => {
		if (ei(t, i, r, {
			x: Math.min(a, s),
			y: Math.min(o, c),
			w: Math.max(1, Math.abs(s - a)),
			h: Math.max(1, Math.abs(c - o))
		}, n.rotation), i.cmpd === "dbl" && !i.dashStyle && !i.customDash?.length && (a === s || o === c)) {
			t.fillStyle = t.strokeStyle, Se(t, a, o, s, c, Math.max(.5, Y(i.width, r)), x);
			return;
		}
		let l = a === s ? e(a, t.lineWidth, x) : 0, u = o === c ? e(o, t.lineWidth, x) : 0;
		t.beginPath(), t.moveTo(a + l, o + u), t.lineTo(s + l, c + u), t.stroke();
	};
	for (let e of y) {
		let { cell: i, colX: a, rowY: o, cellW: s, cellH: c } = e;
		t.save();
		let l = n.rtl ? i.borderR : i.borderL, p = n.rtl ? i.borderL : i.borderR, m = n.rtl ? e.ci + e.span === u : e.ci === 0, _ = n.rtl ? e.ci === 0 : e.ci + e.span === u, v = n.rtl ? e.ci - 1 : e.ci + e.span, y = (e) => n.rtl ? e.borderR : e.borderL;
		if (e.ri === 0 && i.borderT && C(i.borderT, a, o, a + s, o), m && l && C(l, a, o, a, o + c), e.lastRi === n.rows.length - 1) {
			let e = i.borderB;
			e && C(e, a, o + c, a + s, o + c);
		} else {
			let t = e.lastRi + 1, n = o + c, r = Math.min(e.ci + e.span, u), a = e.ci;
			for (; a < r;) {
				let e = b[t][a], o = a + 1;
				for (; o < r && b[t][o] === e;) o++;
				let s = S(t, a), c = gn(i.borderB, s ? s.cell.borderT : null);
				if (c) {
					let e = h(a, o - a);
					C(c, e, n, e + d(a, o - a), n);
				}
				a = o;
			}
		}
		if (_) {
			let e = p;
			e && C(e, a + s, o, a + s, o + c);
		} else {
			let t = a + s, n = e.ri;
			for (; n <= e.lastRi;) {
				let r = b[n][v], i = n;
				for (; i + 1 <= e.lastRi && b[i + 1][v] === r;) i++;
				let a = S(n, v), o = gn(p, a ? y(a.cell) : null);
				o && C(o, t, g[n], t, g[i] + f[i]), n = i + 1;
			}
		}
		i.diagonalTL && (ei(t, i.diagonalTL, r, {
			x: a,
			y: o,
			w: s,
			h: c
		}, n.rotation), t.beginPath(), t.moveTo(a, o), t.lineTo(a + s, o + c), t.stroke()), i.diagonalTR && (ei(t, i.diagonalTR, r, {
			x: a,
			y: o,
			w: s,
			h: c
		}, n.rotation), t.beginPath(), t.moveTo(a + s, o), t.lineTo(a, o + c), t.stroke()), t.restore();
	}
	t.restore();
}
function ri(e, t, n, r) {
	e.save(), e.globalAlpha = t.opacity, e.fillStyle = t.color, e.fillRect(0, 0, n, r), e.restore();
}
var ii = /* @__PURE__ */ new WeakMap();
function ai(e) {
	ii.set(e, (ii.get(e) ?? 0) + 1);
}
function oi(e, t, n, r, i) {
	e.save(), e.fillStyle = "#f7f7f8", e.fillRect(0, 0, t, n);
	let a = Math.max(12, Math.min(t, n) * .04);
	e.strokeStyle = "#c8ccd2", e.lineWidth = Math.max(1, Math.min(t, n) * .004), e.setLineDash([e.lineWidth * 6, e.lineWidth * 5]), e.strokeRect(a, a, t - a * 2, n - a * 2), e.setLineDash([]);
	let o = t / 2, s = Math.max(18, Math.min(t, n) * .14);
	e.fillStyle = "#b23b3b", e.textAlign = "center", e.textBaseline = "middle", e.font = `${s}px sans-serif`, e.fillText("⚠", o, n * .34);
	let c = Math.max(11, Math.min(t, n) * .045);
	e.fillStyle = "#333333", e.font = `600 ${c}px sans-serif`, e.fillText(`Slide ${r} could not be displayed`, o, n * .52);
	let l = Math.max(9, Math.min(t, n) * .028);
	e.fillStyle = "#666666", e.font = `${l}px sans-serif`;
	let u = t - a * 4, d = i.split(/\s+/), f = [], p = "";
	for (let t of d) {
		let n = p ? `${p} ${t}` : t;
		if (e.measureText(n).width > u && p ? (f.push(p), p = t) : p = n, f.length >= 4) break;
	}
	p && f.length < 4 && f.push(p);
	let m = l * 1.35, h = n * .6 + m;
	for (let t of f.slice(0, 4)) e.fillText(t, o, h), h += m;
	e.restore();
}
async function si(e, t, n, r, i = {}, a) {
	return ci(e, t, n, r, i, a);
}
async function ci(e, t, n, r, i = {}, a) {
	let o = i.fetchImage ?? (i.fetchMedia ? Jr(i.fetchMedia) : void 0), s = (ii.get(e) ?? 0) + 1;
	ii.set(e, s);
	let c = () => ii.get(e) !== s, l = () => c() ? Promise.resolve(e) : li(e, t, n, r, i, a, o, c);
	return o && Mn(t) ? j(o, i.imageResources, l) : l();
}
async function li(e, t, n, r, i = {}, o, s, c = () => !1) {
	let l = i.width ?? ((se(e) ? e.offsetWidth : 0) || 960), u = l / n, d = Math.round(l), f = Math.round(r * u), p = i.dpr ?? L(), m = He(d * p, f * p), h = m.clamped ? p * m.scale : p, g = await jn(t, d, f, u, h, i.imageResources, i.fetchImage, i.fetchMedia, s, i.tiff);
	e.width = m.width, e.height = m.height, se(e) && (e.style.width = `${d}px`, e.style.display || (e.style.display = "block"));
	let _ = e.getContext("2d");
	if (!_) throw Error("Could not get 2D context");
	if (_.scale(h, h), t.parseError) return oi(_, d, f, t.slideNumber, t.parseError), e;
	let v = i.defaultTextColor ? `#${i.defaultTextColor}` : "#000000", y = /* @__PURE__ */ new Map(), b = {
		themeMajorFont: i.majorFont ?? null,
		themeMinorFont: i.minorFont ?? null,
		themeHlinkColor: i.hlinkColor ?? null,
		embeddedFontAliases: i.embeddedFontAliases,
		embeddedFontAuthoredFamilies: i.embeddedFontAuthoredFamilies,
		dpr: h,
		smartArtFallbackTextColor: bn(t.background, v),
		pictureBulletImages: y
	};
	if (await sr(_, t.background, d, f, u, c, i.fetchImage, i.tiff, i.svgDecoder, g), c() || (i.math && await Rn(t, i.math), c())) return e;
	let x = t.slideNumber;
	for (let e of t.elements) if (e.type === "picture" && i.fetchImage) {
		let t = e, n = t.mimeType === "image/svg+xml", r = A(t) || n, a = !r && !t.duotone ? On(g, X(kn(t), t.duotone)) : void 0, o = Dn(Y(t.width, u), Y(t.height, u), h, t.srcRect), s = r ? o : a, c = s && "maxRetainedPixels" in s ? s.maxRetainedPixels : void 0, l = {
			...s ? {
				targetWidthPx: s.targetWidthPx,
				targetHeightPx: s.targetHeightPx,
				...c === void 0 ? {} : { maxRetainedPixels: c }
			} : {},
			workerDecoder: i.svgDecoder
		};
		if (A(t)) I(t.svgImagePath, i.fetchImage, l).catch(() => void 0);
		else if (n) I(t.imagePath, i.fetchImage, l).catch(() => void 0);
		else {
			let e = Pe(t.mimeType, t.srcRect, t.width / J, t.height / J);
			if (!e) continue;
			Ye(t.imagePath, t.mimeType, t.duotone, i.fetchImage, {
				widthPt: e.widthPt,
				heightPt: e.heightPt,
				...s ?? {},
				tiff: i.tiff,
				svgDecoder: i.svgDecoder
			}).catch(() => void 0);
		}
	} else if (e.type === "media") {
		let t = e;
		t.posterPath && i.fetchMedia && Yr(t, i.fetchMedia, s, i.tiff, t.posterMimeType === "image/svg+xml" ? Dn(Y(t.width, u), Y(t.height, u), h) : On(g, X(t.posterPath)), i.svgDecoder).catch(() => void 0);
	}
	let S = /* @__PURE__ */ new Map();
	if (i.fetchImage) {
		let n = i.fetchImage, r = /* @__PURE__ */ new Map(), o = [];
		for (let e of t.elements) {
			if (e.type !== "chart" || !Number.isFinite(e.width) || e.width <= 0 || !Number.isFinite(e.height) || e.height <= 0) continue;
			let t = {
				widthPt: e.width / J,
				heightPt: e.height / J,
				targetWidthPx: Y(e.width, u) * h,
				targetHeightPx: Y(e.height, u) * h
			}, n = [], r = !0;
			for (let i of Ee(e.chart)) {
				let e = De(i, t);
				if (!e) {
					r = !1;
					break;
				}
				n.push({
					usage: i,
					size: e
				});
			}
			r && o.push({
				element: e,
				frame: t,
				usages: n
			});
		}
		let s = /* @__PURE__ */ new Map();
		for (let e of Ne(o.map(({ element: e }) => e.chart), (e, t) => De(e, o[t].frame) != null)) {
			let { fill: t } = e, n = Le(t);
			s.has(n) || s.set(n, {
				fill: t,
				widthPt: 0,
				heightPt: 0,
				preserveNaturalSize: e.preserveNaturalSize,
				hasSourceCrop: e.hasSourceCrop
			});
		}
		for (let { usages: e } of o) for (let { usage: t, size: n } of e) {
			let { fill: e } = t, r = Le(e), i = s.get(r);
			if (!i) continue;
			let a = i.preserveNaturalSize || t.preserveNaturalSize, o = i.hasSourceCrop || t.hasSourceCrop, c = a || e.duotone ? void 0 : On(g, X(e.imagePath, e.duotone)), l = !e.duotone && (e.mimeType === "image/svg+xml" || A({
				svgImagePath: e.svgImagePath,
				srcRect: o ? !0 : null
			}));
			s.set(r, {
				...i,
				widthPt: Math.max(i.widthPt, n.widthPt),
				heightPt: Math.max(i.heightPt, n.heightPt),
				targetWidthPx: a ? void 0 : c?.targetWidthPx ?? (l && Math.max(i.targetWidthPx ?? 0, n.targetWidthPx ?? 0) || void 0),
				targetHeightPx: a ? void 0 : c?.targetHeightPx ?? (l && Math.max(i.targetHeightPx ?? 0, n.targetHeightPx ?? 0) || void 0),
				maxRetainedPixels: c?.maxRetainedPixels,
				preserveNaturalSize: a,
				hasSourceCrop: o
			});
		}
		for (let e of t.elements) if (!(e.type !== "shape" || !e.textBody)) for (let t of e.textBody.paragraphs) {
			let n = $e(t.bullet);
			if (n.type === "blip") {
				let i = Qn(e.textBody, t, n) * J * u * h, a = r.get(n.imagePath);
				a ? Number.isFinite(i) && i > 0 && (a.targetHeightPx = Math.max(a.targetHeightPx ?? 0, i)) : r.set(n.imagePath, {
					mimeType: n.mimeType,
					...Number.isFinite(i) && i > 0 ? { targetHeightPx: i } : {}
				});
			}
		}
		if (r.size > 0 || s.size > 0) {
			let t = [...r].map(async ([e, { mimeType: t, targetHeightPx: r }]) => {
				try {
					let a = t === "image/svg+xml" ? r === void 0 ? {} : {
						targetWidthPx: 1,
						targetHeightPx: r
					} : On(g, X(e)) ?? {}, o = t === "image/svg+xml" ? await I(e, n, {
						...a,
						workerDecoder: i.svgDecoder
					}) : await K(e, t, n, {
						tiff: i.tiff,
						...a
					});
					y.set(e, o);
				} catch (t) {
					if (a(t, "tiff")) {
						y.set(e, null);
						return;
					}
					if (Re(t) || Je(t)) throw t;
					y.set(e, null);
				}
			}), o = [...s].map(async ([e, t]) => {
				let { fill: r, widthPt: o, heightPt: s, targetWidthPx: c, targetHeightPx: l, maxRetainedPixels: u, hasSourceCrop: d } = t, f = c && l ? {
					targetWidthPx: c,
					targetHeightPx: l,
					...u === void 0 ? {} : { maxRetainedPixels: u }
				} : void 0;
				try {
					let t = () => r.mimeType === "image/svg+xml" ? r.duotone ? Promise.resolve(null) : I(r.imagePath, n, {
						...f ?? {},
						workerDecoder: i.svgDecoder
					}) : Ye(r.imagePath, r.mimeType, r.duotone, n, {
						widthPt: o,
						heightPt: s,
						...f ?? {},
						failClosedOnDuotoneFailure: !0,
						tiff: i.tiff
					}), a, c = {
						svgImagePath: r.svgImagePath,
						srcRect: d ? !0 : null
					};
					if (!r.duotone && A(c)) try {
						a = await I(c.svgImagePath, n, {
							...f ?? {},
							workerDecoder: i.svgDecoder
						});
					} catch {
						a = await t();
					}
					else a = await t();
					S.set(e, a);
				} catch (t) {
					if (a(t, "tiff")) {
						S.set(e, null);
						return;
					}
					if (Re(t) || Je(t)) throw t;
					S.set(e, null);
				}
			});
			if (await Promise.all([...t, ...o]), c()) return e;
		}
	}
	for (let [n, r] of t.elements.entries()) {
		if (c()) return e;
		if (r.type === "shape") Ir(_, r, u, v, x, b, o ? (e) => o({
			...e,
			elementIndex: n,
			origin: t.elementSources?.[n]?.origin ?? "slide"
		}) : void 0, i.fetchImage);
		else if (r.type === "picture") await Zr(_, r, u, c, i.fetchImage, i.tiff, h, i.svgDecoder, g);
		else if (r.type === "table") ni(_, r, u, x, b, o ? (e) => o({
			...e,
			elementIndex: n,
			origin: t.elementSources?.[n]?.origin ?? "slide"
		}) : void 0);
		else if (r.type === "media") await Qr(_, r, u, c, i.fetchMedia, i.skipMediaControls, i.fetchImage, i.tiff, h, i.svgDecoder, g);
		else if (r.type === "chart") {
			let e = J * u;
			_.save(), ti(_, r, u), qe(_, r.chart, {
				x: Y(r.x, u),
				y: Y(r.y, u),
				w: Y(r.width, u),
				h: Y(r.height, u)
			}, e, r.rotation, i.threeD, i.regionMap, (e) => S.get(Le(e)), i.chartEx), _.restore();
		}
	}
	return c() || i.dim && ri(_, i.dim, d, f), e;
}
//#endregion
//#region packages/pptx/src/google-fonts.ts
var ui = {
	...T,
	...b
};
function* di(e) {
	for (let t of e?.paragraphs ?? []) for (let e of t.runs) e.type === "text" && (yield e.text);
}
function* fi(e) {
	for (let t of e?.paragraphs ?? []) {
		t.defFontFamily && (yield t.defFontFamily);
		for (let e of t.runs) e.type === "text" && (e.fontFamily && (yield e.fontFamily), e.fontFamilyEa && (yield e.fontFamilyEa), e.fontFamilySym && (yield e.fontFamilySym));
	}
}
function* pi(e) {
	for (let t of e.elements) if (t.type === "shape") yield* di(t.textBody);
	else if (t.type === "table") for (let e of t.rows) for (let t of e.cells) yield* di(t.textBody);
	else if (t.type === "chart") {
		t.chart.title && (yield t.chart.title);
		for (let e of t.chart.categories) yield e;
		for (let e of t.chart.series) e.name && (yield e.name);
	}
}
var mi = class e {
	scripts;
	families;
	constructor(e, t, n, r) {
		this.majorFont = e, this.minorFont = t;
		let i = w(e) ?? w(t) ?? null;
		this.scripts = n ?? new pe(i), this.families = r ?? /* @__PURE__ */ new Set(), e && this.families.add(e), t && this.families.add(t);
	}
	addSlide(e) {
		this.scripts.addText(pi(e));
		for (let t of e.elements) if (t.type === "shape") for (let e of fi(t.textBody)) this.families.add(e);
		else if (t.type === "table") for (let e of t.rows) for (let t of e.cells) for (let e of fi(t.textBody)) this.families.add(e);
	}
	names() {
		return [...this.families, ...this.scripts.names()];
	}
	withSlide(t) {
		let n = new e(this.majorFont, this.minorFont, this.scripts.clone(), new Set(this.families));
		return n.addSlide(t), n;
	}
}, hi = Object.freeze({
	archiveEntryCount: 0,
	declaredInflatedBytes: 0,
	distinctInflatedBytes: 0,
	operationInflatedBytes: 0
}), gi = D;
function $(e, t) {
	if (e !== null && typeof e != "string") throw Error(`invalid PPTX presentation bootstrap ${t}`);
}
function _i(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation bootstrap slide at ${t}`);
	let n = e;
	if (n.index !== t) throw Error(`invalid PPTX presentation bootstrap slide index ${n.index}`);
	if (n.partName !== void 0 && typeof n.partName != "string") throw Error(`invalid PPTX presentation bootstrap slide partName at ${t}`);
	return Object.freeze({
		index: n.index,
		...n.partName === void 0 ? {} : { partName: n.partName }
	});
}
function vi(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation bootstrap embedded font at ${t}`);
	let n = e;
	if (typeof n.fontName != "string" || n.fontName.length === 0 || ![
		"regular",
		"bold",
		"italic",
		"boldItalic"
	].includes(n.style ?? "") || typeof n.partPath != "string" || n.partPath.length === 0 || n.partPath.startsWith("/") || n.partPath.split("/").includes("..") || !["application/x-font-ttf", "application/x-fontdata"].includes(n.contentType ?? "")) throw Error(`invalid PPTX presentation bootstrap embedded font fields at ${t}`);
	return Object.freeze({
		fontName: n.fontName,
		style: n.style,
		partPath: n.partPath,
		contentType: n.contentType
	});
}
function yi(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error("invalid PPTX presentation bootstrap payload");
	let t = e;
	if (!Number.isSafeInteger(t.slideCount) || (t.slideCount ?? -1) < 0 || !Number.isSafeInteger(t.slideWidth) || (t.slideWidth ?? 0) <= 0 || !Number.isSafeInteger(t.slideHeight) || (t.slideHeight ?? 0) <= 0 || !Array.isArray(t.embeddedFonts) || !Array.isArray(t.slides) || t.slides.length !== t.slideCount) throw Error("invalid PPTX presentation bootstrap dimensions or slide count");
	return $(t.defaultTextColor, "defaultTextColor"), $(t.majorFont, "majorFont"), $(t.minorFont, "minorFont"), $(t.hlinkColor, "hlinkColor"), $(t.folHlinkColor, "folHlinkColor"), Object.freeze({
		slideCount: t.slideCount,
		slideWidth: t.slideWidth,
		slideHeight: t.slideHeight,
		defaultTextColor: t.defaultTextColor,
		majorFont: t.majorFont,
		minorFont: t.minorFont,
		hlinkColor: t.hlinkColor,
		folHlinkColor: t.folHlinkColor,
		embeddedFonts: Object.freeze(t.embeddedFonts.map(vi)),
		slides: Object.freeze(t.slides.map(_i))
	});
}
function bi(e) {
	return Object.freeze({
		type: "media",
		x: e.x,
		y: e.y,
		width: e.width,
		height: e.height,
		rotation: e.rotation,
		flipH: e.flipH,
		flipV: e.flipV,
		mediaKind: e.mediaKind,
		posterPath: e.posterPath,
		posterMimeType: e.posterMimeType,
		mediaPath: e.mediaPath,
		mimeType: e.mimeType
	});
}
function xi(e) {
	return Object.freeze({
		...e.id === void 0 ? {} : { id: e.id },
		...e.authorId === void 0 ? {} : { authorId: e.authorId },
		...e.author === void 0 ? {} : { author: e.author },
		...e.date === void 0 ? {} : { date: e.date },
		...e.status === void 0 ? {} : { status: e.status },
		text: e.text
	});
}
function Si(e) {
	return Object.freeze({ ...e });
}
function Ci(e) {
	return Object.freeze({
		...e.authorId === void 0 ? {} : { authorId: e.authorId },
		...e.modernAuthorId === void 0 ? {} : { modernAuthorId: e.modernAuthorId },
		...e.id === void 0 ? {} : { id: e.id },
		...e.index === void 0 ? {} : { index: e.index },
		...e.author === void 0 ? {} : { author: e.author },
		...e.date === void 0 ? {} : { date: e.date },
		...e.x === void 0 ? {} : { x: e.x },
		...e.y === void 0 ? {} : { y: e.y },
		...e.anchors?.length ? { anchors: Object.freeze(e.anchors.map(Si)) } : {},
		...e.status === void 0 ? {} : { status: e.status },
		text: e.text,
		...e.replies?.length ? { replies: Object.freeze(e.replies.map(xi)) } : {}
	});
}
function wi(e, t, n) {
	if (e !== void 0 && typeof e != "string") throw Error(`invalid PPTX presentation preflight comment ${t} at slide ${n}`);
}
function Ti(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight comment reply at slide ${t}`);
	let n = e;
	for (let e of [
		"id",
		"authorId",
		"author",
		"date",
		"status"
	]) wi(n[e], e, t);
	if (typeof n.text != "string") throw Error(`invalid PPTX presentation preflight comment reply text at slide ${t}`);
	if (n.status !== void 0 && ![
		"active",
		"resolved",
		"closed"
	].includes(n.status)) throw Error(`invalid PPTX presentation preflight comment reply status at slide ${t}`);
	return xi(n);
}
function Ei(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight comment at slide ${t}`);
	let n = e;
	for (let e of [
		"modernAuthorId",
		"id",
		"author",
		"date",
		"status"
	]) wi(n[e], e, t);
	for (let e of [
		"authorId",
		"index",
		"x",
		"y"
	]) {
		let r = n[e];
		if (r !== void 0 && (typeof r != "number" || !Number.isSafeInteger(r))) throw Error(`invalid PPTX presentation preflight comment ${e} at slide ${t}`);
	}
	if (typeof n.text != "string" || n.replies !== void 0 && !Array.isArray(n.replies) || n.anchors !== void 0 && !Array.isArray(n.anchors)) throw Error(`invalid PPTX presentation preflight comment fields at slide ${t}`);
	if (n.status !== void 0 && ![
		"active",
		"resolved",
		"closed"
	].includes(n.status)) throw Error(`invalid PPTX presentation preflight comment status at slide ${t}`);
	return Ci({
		...n,
		...n.anchors?.length ? { anchors: n.anchors.map((e) => Di(e, t)) } : {},
		...n.replies?.length ? { replies: n.replies.map((e) => Ti(e, t)) } : {}
	});
}
function Di(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight comment anchor at slide ${t}`);
	let n = e;
	if (n.type === "slide" || n.type === "unknown") return Object.freeze({ type: n.type });
	if (n.type === "drawingElement") return wi(n.elementId, "anchor.elementId", t), wi(n.creationId, "anchor.creationId", t), Object.freeze({
		type: "drawingElement",
		...n.elementId === void 0 ? {} : { elementId: n.elementId },
		...n.creationId === void 0 ? {} : { creationId: n.creationId }
	});
	if (n.type === "textRange") {
		wi(n.elementId, "anchor.elementId", t);
		for (let e of ["start", "length"]) {
			let r = n[e];
			if (r !== void 0 && (typeof r != "number" || !Number.isSafeInteger(r))) throw Error(`invalid PPTX presentation preflight comment anchor.${e} at slide ${t}`);
		}
		return Object.freeze({
			type: "textRange",
			...n.elementId === void 0 ? {} : { elementId: n.elementId },
			...n.start === void 0 ? {} : { start: n.start },
			...n.length === void 0 ? {} : { length: n.length }
		});
	}
	throw Error(`invalid PPTX presentation preflight comment anchor type at slide ${t}`);
}
function Oi(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight media at slide ${t}`);
	let n = e;
	for (let e of [
		"x",
		"y",
		"width",
		"height",
		"rotation"
	]) if (typeof n[e] != "number" || !Number.isFinite(n[e])) throw Error(`invalid PPTX presentation preflight media ${e} at slide ${t}`);
	if (n.type !== "media" || typeof n.flipH != "boolean" || typeof n.flipV != "boolean" || n.mediaKind !== "audio" && n.mediaKind !== "video" || typeof n.posterPath != "string" || typeof n.posterMimeType != "string" || typeof n.mediaPath != "string" || typeof n.mimeType != "string") throw Error(`invalid PPTX presentation preflight media fields at slide ${t}`);
	return bi(n);
}
function ki(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error("invalid PPTX presentation preflight payload");
	let n = e;
	if (!Number.isSafeInteger(n.slideCount) || (n.slideCount ?? -1) < 0 || !Number.isSafeInteger(n.slideWidth) || (n.slideWidth ?? 0) <= 0 || !Number.isSafeInteger(n.slideHeight) || (n.slideHeight ?? 0) <= 0 || !Array.isArray(n.embeddedFonts) || !Array.isArray(n.slides) || (t ? n.slides.length > (n.slideCount ?? -1) : n.slides.length !== n.slideCount) || !Array.isArray(n.fontPreloadNames)) throw Error("invalid PPTX presentation preflight dimensions or slide count");
	$(n.defaultTextColor, "defaultTextColor"), $(n.majorFont, "majorFont"), $(n.minorFont, "minorFont"), $(n.hlinkColor, "hlinkColor"), $(n.folHlinkColor, "folHlinkColor");
	let r = n.slides.map((e, t) => {
		if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight slide at ${t}`);
		let n = e;
		if (n.index !== t || n.partName !== void 0 && typeof n.partName != "string" || n.notes !== null && typeof n.notes != "string" || typeof n.hidden != "boolean" || !Array.isArray(n.mediaElements) || n.comments !== void 0 && !Array.isArray(n.comments)) throw Error(`invalid PPTX presentation preflight slide fields at ${t}`);
		return Object.freeze({
			index: t,
			...n.partName === void 0 ? {} : { partName: n.partName },
			notes: n.notes,
			hidden: n.hidden,
			mediaElements: Object.freeze(n.mediaElements.map((e) => Oi(e, t))),
			...n.comments?.length ? { comments: Object.freeze(n.comments.map((e) => Ei(e, t))) } : {}
		});
	}), i = n.fontPreloadNames.map((e, t) => {
		if (e !== null && typeof e != "string") throw Error(`invalid PPTX presentation preflight font at ${t}`);
		return e;
	});
	return Object.freeze({
		slideCount: n.slideCount,
		slideWidth: n.slideWidth,
		slideHeight: n.slideHeight,
		defaultTextColor: n.defaultTextColor,
		majorFont: n.majorFont,
		minorFont: n.minorFont,
		hlinkColor: n.hlinkColor,
		folHlinkColor: n.folHlinkColor,
		embeddedFonts: Object.freeze(n.embeddedFonts.map(vi)),
		slides: Object.freeze(r),
		fontPreloadNames: Object.freeze(i)
	});
}
function Ai(e) {
	return ki(e, !1);
}
function ji(e) {
	return ki(e, !0);
}
function Mi(e, t) {
	for (let n of e.slides) for (let e of n.mediaElements) {
		if (e.mediaPath === t) return e.mimeType;
		if (e.posterPath === t) return e.posterMimeType;
	}
	return "";
}
function Ni(e, t) {
	if (e.index !== t.index || e.partName !== t.partName) throw Error(`PPTX pulled slide identity does not match bootstrap index ${t.index}`);
	return Object.freeze({
		index: t.index,
		...t.partName === void 0 ? {} : { partName: t.partName },
		notes: e.notes ?? null,
		hidden: e.hidden ?? !1,
		mediaElements: Object.freeze(e.elements.filter((e) => e.type === "media").map(bi)),
		...e.comments?.length ? { comments: Object.freeze(e.comments.map(Ci)) } : {}
	});
}
function Pi(e, t, n) {
	if (!(e <= t)) throw new N(`PPTX presentation preflight exceeded its hard limit of ${t} projected bytes`, {
		stage: "parsing",
		violation: {
			format: "pptx",
			operation: "presentation-preflight",
			resource: "presentation-preflight",
			metric: "projected-bytes",
			limit: t,
			observed: Math.min(e, t + 1),
			configurable: !1,
			usage: n
		}
	});
}
var Fi = class {
	slideCountValue;
	slideWidthValue;
	slideHeightValue;
	defaultTextColorValue;
	majorFontValue;
	minorFontValue;
	hlinkColorValue;
	folHlinkColorValue;
	embeddedFontsValue;
	descriptors;
	slides = [];
	fonts;
	fontPreloadNames;
	fontProjectionBytes;
	projectionBytesValue;
	limit;
	pending = null;
	finished = null;
	constructor(e, t = {}) {
		let n = yi(e), r = t.hardLimitForTesting ?? gi;
		if (!Number.isSafeInteger(r) || r <= 0 || r > gi) throw Error("invalid PPTX presentation preflight test limit");
		this.limit = r, this.slideCountValue = n.slideCount, this.slideWidthValue = n.slideWidth, this.slideHeightValue = n.slideHeight, this.defaultTextColorValue = n.defaultTextColor, this.majorFontValue = n.majorFont, this.minorFontValue = n.minorFont, this.hlinkColorValue = n.hlinkColor, this.folHlinkColorValue = n.folHlinkColor, this.embeddedFontsValue = n.embeddedFonts, this.descriptors = [...n.slides], this.fonts = new mi(this.majorFontValue, this.minorFontValue), this.fontPreloadNames = Object.freeze(this.fonts.names()), this.fontProjectionBytes = Ze(this.fontPreloadNames, this.limit).jsonBytes, this.projectionBytesValue = Ze({
			slideCount: this.slideCountValue,
			slideWidth: this.slideWidthValue,
			slideHeight: this.slideHeightValue,
			defaultTextColor: this.defaultTextColorValue,
			majorFont: this.majorFontValue,
			minorFont: this.minorFontValue,
			hlinkColor: this.hlinkColorValue,
			folHlinkColor: this.folHlinkColorValue,
			embeddedFonts: this.embeddedFontsValue,
			remainingSlides: this.descriptors,
			slides: [],
			fontPreloadNames: this.fontPreloadNames
		}, this.limit).jsonBytes, Pi(this.projectionBytesValue, this.limit, hi);
	}
	get acceptedSlideCount() {
		return this.finished?.slideCount ?? this.slides.length;
	}
	get projectedBytes() {
		return this.projectionBytesValue;
	}
	get remainingDescriptorCount() {
		return this.descriptors.reduce((e, t) => e + Number(t !== void 0), 0);
	}
	get latestSlide() {
		return this.slides[this.slides.length - 1];
	}
	get currentFontPreloadNames() {
		return this.fontPreloadNames;
	}
	snapshot() {
		if (this.finished) return this.finished;
		if (this.pending) throw Error("PPTX presentation preflight has an uncommitted slide");
		return Object.freeze({
			slideCount: this.slideCountValue,
			slideWidth: this.slideWidthValue,
			slideHeight: this.slideHeightValue,
			defaultTextColor: this.defaultTextColorValue,
			majorFont: this.majorFontValue,
			minorFont: this.minorFontValue,
			hlinkColor: this.hlinkColorValue,
			folHlinkColor: this.folHlinkColorValue,
			embeddedFonts: this.embeddedFontsValue,
			slides: Object.freeze([...this.slides]),
			fontPreloadNames: this.fontPreloadNames
		});
	}
	addSlide(e, t = hi) {
		this.prepareSlide(e, t).commit();
	}
	prepareSlide(e, t = hi) {
		if (this.finished) throw Error("PPTX presentation preflight is already finished");
		if (this.pending) throw Error("PPTX presentation preflight already has a prepared slide");
		let n = this.slides.length, r = this.descriptors[n];
		if (!r) throw Error("PPTX presentation preflight received an extra slide");
		let i = Ni(e, r), a = this.fonts.withSlide(e), o = Object.freeze(a.names()), s = Ze(o, this.limit).jsonBytes, c = Ze(i, this.limit).jsonBytes, l = this.projectionBytesValue - this.fontProjectionBytes - Ze(r, this.limit).jsonBytes + 4;
		l = Qe(l, s, this.limit), l = Qe(l, c, this.limit), this.slides.length !== 0 && (l = Qe(l, 1, this.limit));
		let u = Ze({
			slide: i,
			fontPreloadNames: o
		}, this.limit).jsonBytes, d = Qe(this.projectionBytesValue, u, this.limit);
		Pi(Math.max(d, l), this.limit, t);
		let f = {
			state: "prepared",
			fact: i,
			fonts: a,
			fontNames: o,
			fontBytes: s,
			committedBytes: l
		};
		return this.pending = f, {
			projectedBytes: d,
			commit: () => {
				if (f.state !== "committed") {
					if (f.state === "rolled-back") throw Error("PPTX presentation preflight cannot commit a rolled-back slide");
					if (this.pending !== f) throw Error("PPTX presentation preflight prepared slide is stale");
					this.descriptors[n] = void 0, this.slides.push(f.fact), this.fonts = f.fonts, this.fontPreloadNames = f.fontNames, this.fontProjectionBytes = f.fontBytes, this.projectionBytesValue = f.committedBytes, f.state = "committed", this.pending = null;
				}
			},
			rollback: () => {
				if (f.state !== "rolled-back") {
					if (f.state === "committed") throw Error("PPTX presentation preflight cannot roll back a committed slide");
					if (this.pending !== f) throw Error("PPTX presentation preflight prepared slide is stale");
					f.state = "rolled-back", this.pending = null;
				}
			}
		};
	}
	finish() {
		if (this.finished) return this.finished;
		if (this.pending) throw Error("PPTX presentation preflight has an uncommitted slide");
		if (this.slides.length !== this.slideCountValue) throw Error(`PPTX presentation preflight is incomplete: ${this.slides.length}/${this.slideCountValue} slides`);
		return this.finished = Object.freeze({
			slideCount: this.slideCountValue,
			slideWidth: this.slideWidthValue,
			slideHeight: this.slideHeightValue,
			defaultTextColor: this.defaultTextColorValue,
			majorFont: this.majorFontValue,
			minorFont: this.minorFontValue,
			hlinkColor: this.hlinkColorValue,
			folHlinkColor: this.folHlinkColorValue,
			embeddedFonts: this.embeddedFontsValue,
			slides: Object.freeze([...this.slides]),
			fontPreloadNames: this.fontPreloadNames
		}), this.descriptors = [], this.slides = [], this.projectionBytesValue = Ze(this.finished, this.limit).jsonBytes, this.finished;
	}
}, Ii = 1024 * 1024, Li = class {
	active = /* @__PURE__ */ new Set();
	nextSessionId = 1;
	constructor(e) {
		if (this.options = e, !Number.isSafeInteger(e.slideCount) || e.slideCount < 0) throw TypeError("slideCount must be a non-negative safe integer");
		if (e.generation !== void 0 && (!Number.isSafeInteger(e.generation) || e.generation <= 0)) throw TypeError("generation must be a positive safe integer");
	}
	async load(e, t = !0, n) {
		this.assertSlideIndex(e);
		let r = this.nextSessionId++, i = {
			sessionId: r,
			operationId: r,
			generation: this.options.generation ?? 1
		}, a = new h(this.options.transport, {
			...i,
			maxByteCredit: E,
			timeoutMs: n
		});
		this.active.add(a);
		try {
			await this.options.open(e, i, n);
			let r = await zi(a);
			try {
				let e = r.usage ?? a.usageCheckpoint;
				e && this.options.onUsage?.(e);
				let n = t ? JSON.parse(new TextDecoder().decode(new Uint8Array(r.payload))) : void 0;
				return await r.ack(), n;
			} finally {
				r.disposeTransferred();
			}
		} catch (e) {
			throw await a.cancel("request-error").catch(() => void 0), e;
		} finally {
			this.active.delete(a);
		}
	}
	cancelAll() {
		for (let e of this.active) e.cancel("closed").catch(() => void 0);
		this.active.clear();
	}
	assertSlideIndex(e) {
		if (!Number.isSafeInteger(e) || e < 0 || e >= this.options.slideCount) throw RangeError(`Slide index ${e} out of range (count: ${this.options.slideCount})`);
	}
};
function Ri(e) {
	return !!e && typeof e == "object" && e.protocol === "ooxml-pull-v1";
}
async function zi(e) {
	try {
		return await e.pull(Ii);
	} catch (t) {
		let n = Bi(t);
		if (n === void 0) throw t;
		return e.pull(n);
	}
}
function Bi(e) {
	return d(e, Ii, E);
}
//#endregion
export { yi as a, ui as c, ci as d, on as f, Mi as i, ai as l, Ri as n, Ai as o, Fi as r, ji as s, Li as t, si as u };
