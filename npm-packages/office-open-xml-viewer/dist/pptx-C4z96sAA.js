import { t as e } from "./chunk-DmhlhrBa.js";
import { a as t, c as n, d as r, f as i, i as a, l as o, n as s, o as c, r as l, s as u, t as d, u as f } from "./slide-pull-client-RTwQbJiy.js";
import { B as p, G as m, Jt as h, R as g, W as _, Zt as v, a as y, cn as b, et as x, pt as S, sn as C, tt as w, ut as ee, vt as te, z as ne } from "./line-metrics-BGtFM-ec.js";
import { C as re, D as ie, E as ae, S as oe, T as se, _ as ce, a as T, b as le, c as E, d as ue, f as de, g as fe, h as pe, i as D, l as O, m as me, n as he, o as ge, p as _e, r as ve, s as ye, t as be, v as xe, w as Se, x as Ce, y as we } from "./canvas-viewer-mechanics-CDNMJ-Yz.js";
import { a as Te, i as k, n as Ee, t as De } from "./bounded-raw-part-cache-C6ro6Ezf.js";
import { a as A, c as Oe, i as ke, l as j, n as Ae, r as je, t as Me } from "./dom-interaction-boundary-CDGegIB5.js";
import { l as Ne, s as Pe } from "./pixel-budget-Dgjw269h.js";
import { i as M } from "./units-EJdC96r6.js";
import { i as Fe, s as Ie } from "./raster-target-ojDdQizC.js";
import { n as Le } from "./resource-measurement-D41R-0Bl.js";
import { n as Re } from "./renderer-module-contract-Cu-GKuPd.js";
import { t as ze } from "./visible-index-DPoQYSDt.js";
import { n as Be, t as N } from "./highlight-rect-DBcYVJDv.js";
import { t as P } from "./comment-occurrence-tj54AXXB.js";
//#region packages/core/src/nav/internal-target.ts
function Ve(e, t) {
	let n = t.startsWith("/") ? [] : e.split("/").filter((e) => e !== "");
	for (let e of t.split("/")) if (e === "..") n.pop();
	else if (e === "." || e === "") continue;
	else n.push(e);
	return n.join("/");
}
function He(e) {
	let t = /[?&]jump=([a-zA-Z]+)/.exec(e);
	if (!t) return null;
	let n = t[1].toLowerCase();
	return n === "firstslide" || n === "lastslide" || n === "nextslide" || n === "previousslide" ? n : null;
}
function Ue(e, t, n) {
	if (!(n <= 0)) switch (e) {
		case "firstslide": return 0;
		case "lastslide": return n - 1;
		case "nextslide": return Math.min(t + 1, n - 1);
		case "previousslide": return Math.max(t - 1, 0);
	}
}
//#endregion
//#region packages/pptx/src/run-frame-transform.ts
function We(e) {
	let t = e.textBodyRotation ?? 0, n = e.shapeFlipH === !0, r = e.shapeFlipV === !0;
	if (n || r) return `rotate(${e.rotation}deg) scale(${n ? -1 : 1}, ${r ? -1 : 1})` + (t === 0 ? "" : ` rotate(${t}deg)`);
	let i = e.rotation + t;
	return i === 0 ? "" : `rotate(${i}deg)`;
}
function Ge(e, t) {
	return `${e.shapeX},${e.shapeY},${e.shapeW},${e.shapeH},` + t;
}
//#endregion
//#region packages/pptx/src/text-layer.ts
function F(e, t, n) {
	e.dataset ? n === void 0 ? delete e.dataset[t] : e.dataset[t] = n : n !== void 0 && e.setAttribute?.(`data-${t.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`)}`, n);
}
function I(e, t, n, r, i, a) {
	e.innerHTML = "", F(e, "ooxmlSelectionSurface", "pptx"), F(e, "slideIndex", a === void 0 ? void 0 : String(a));
	let o = /* @__PURE__ */ new Map(), s = e.ownerDocument ?? document;
	for (let [a, c] of t.entries()) {
		let t = We(c), l = Ge(c, t), u = o.get(l);
		if (!u) {
			let i = s.createElement("div");
			i.style.cssText = `position:absolute;left:${N(c.shapeX, n)};top:${N(c.shapeY, r)};width:${N(c.shapeW, n)};height:${N(c.shapeH, r)};pointer-events:all;overflow:visible;`, t && (i.style.transformOrigin = "center center", i.style.transform = t), u = {
				div: i,
				w: c.shapeW,
				h: c.shapeH
			}, o.set(l, u), e.appendChild(i);
		}
		let d = s.createElement("span");
		F(d, "ooxmlSelectionRun", "pptx"), F(d, "runIndex", String(a)), c.shapeId !== void 0 && F(d, "shapeId", c.shapeId), c.elementIndex !== void 0 && F(d, "elementIndex", String(c.elementIndex)), c.origin !== void 0 && F(d, "elementOrigin", c.origin), d.textContent = c.text;
		let f = i ? c.hyperlink : void 0;
		d.style.cssText = `position:absolute;left:${N(c.inShapeX, u.w)};top:${N(c.inShapeY, u.h)};font:${c.font};line-height:${c.h}px;letter-spacing:0;white-space:pre;color:transparent;cursor:${f ? "pointer" : "text"};`, f && i && (d.title = f.kind === "external" ? f.url : f.ref, d.addEventListener("click", (e) => {
			e.preventDefault(), i(f);
		})), u.div.appendChild(d);
	}
}
function L(e, t, n, r, i, a, o = {}) {
	e.innerHTML = "";
	let s = o.match ?? "rgba(255, 214, 0, 0.42)", c = o.active ?? "rgba(255, 140, 0, 0.55)", l = /* @__PURE__ */ new Map(), u = (t) => {
		let n = We(t), a = Ge(t, n), o = l.get(a);
		if (!o) {
			let s = document.createElement("div");
			s.style.cssText = `position:absolute;left:${N(t.shapeX, r)};top:${N(t.shapeY, i)};width:${N(t.shapeW, r)};height:${N(t.shapeH, i)};pointer-events:none;overflow:hidden;`, n && (s.style.transformOrigin = "center center", s.style.transform = n), o = {
				div: s,
				w: t.shapeW,
				h: t.shapeH
			}, l.set(a, o), e.appendChild(s);
		}
		return o;
	};
	for (let e of n) {
		let n = e.active ? c : s;
		for (let r of e.slices) {
			let e = t[r.runIndex];
			if (!e) continue;
			let i = a(e.font), { x: o, width: s } = Be(e.text, r.start, r.end, i);
			if (s <= 0) continue;
			let c = u(e), l = document.createElement("div");
			l.style.cssText = `position:absolute;left:${N(e.inShapeX + o, c.w)};top:${N(e.inShapeY, c.h)};width:${N(s, c.w)};height:${N(e.h, c.h)};background:${n};pointer-events:none;`, c.div.appendChild(l);
		}
	}
}
//#endregion
//#region packages/pptx/src/find.ts
function Ke(e, t) {
	let n = e.tableCell, r = t.tableCell;
	return !n && !r ? !0 : !n || !r ? !1 : e.elementIndex === t.elementIndex && e.origin === t.origin && e.shapeId === t.shapeId && n.row === r.row && n.column === r.column;
}
function qe(e, t) {
	for (let n = 1; n < t.length; n++) {
		let r = e[t[n - 1].runIndex], i = e[t[n].runIndex];
		if (!r || !i || !Ke(r, i)) return !1;
	}
	return !0;
}
var Je = class {
	_slideRuns = /* @__PURE__ */ new Map();
	_matches = [];
	_active = -1;
	_generation = 0;
	_runsRevision = 0;
	constructor(e, t) {
		this._slideCount = e, this._collectSlideRuns = t;
	}
	invalidate() {
		this._generation++, this._runsRevision++, this._slideRuns.clear(), this._matches = [], this._active = -1;
	}
	slideRuns(e) {
		return this._slideRuns.get(e);
	}
	setSlideRuns(e, t) {
		this._runsRevision++, this._slideRuns.set(e, t);
	}
	slideHighlights(e) {
		let t = [];
		for (let n = 0; n < this._matches.length; n++) {
			let r = this._matches[n];
			r.slide === e && t.push({
				slices: r.slices,
				active: n === this._active
			});
		}
		return t;
	}
	activeSlide() {
		let e = this._matches[this._active];
		return e ? e.slide : null;
	}
	matches() {
		return this._matches.map((e, t) => ({
			matchIndex: t,
			text: e.text,
			location: { slide: e.slide }
		}));
	}
	async find(e, t = {}) {
		let n = ++this._generation;
		if (e.length === 0) return this._runsRevision++, this._slideRuns.clear(), this._matches = [], this._active = -1, [];
		let r = this._runsRevision, i = new Map(this._slideRuns), a = this._slideCount();
		for (let e = 0; e < a; e++) {
			let t = i.get(e);
			if (!t) {
				try {
					t = await this._collectSlideRuns(e);
				} catch (e) {
					if (n !== this._generation) return [];
					throw e;
				}
				if (n !== this._generation) return [];
				i.set(e, t);
			}
		}
		if (n !== this._generation) return [];
		let o = r === this._runsRevision ? i : new Map([...i, ...this._slideRuns]), s = [];
		for (let n = 0; n < a; n++) {
			let r = o.get(n) ?? [], i = me(r);
			for (let a of pe(i, e, t)) {
				if (!qe(r, a.slices)) continue;
				let e = a.slices.map((e) => r[e.runIndex].text.slice(e.start, e.end)).join("");
				s.push({
					slide: n,
					text: e,
					slices: a.slices
				});
			}
		}
		return this._runsRevision++, this._slideRuns = o, this._matches = s, this._active = -1, this.matches();
	}
	next() {
		return this._active = de(this._active, this._matches.length), this._activePublic();
	}
	prev() {
		return this._active = _e(this._active, this._matches.length), this._activePublic();
	}
	_activePublic() {
		let e = this._matches[this._active];
		return e ? {
			matchIndex: this._active,
			text: e.text,
			location: { slide: e.slide }
		} : null;
	}
}, Ye = (e) => e >= "0" && e <= "9";
function Xe(e) {
	let t = 0;
	for (let n = 0; n < 10; n++) t = Math.max(t, e.measureText(String(n)).width);
	return t;
}
function Ze(e, t, n) {
	let r = 0;
	for (let i of t) r += Ye(i) ? n : e.measureText(i).width;
	return r;
}
function Qe(e, t, n, r, i) {
	let a = e.textAlign;
	e.textAlign = "left";
	let o = n;
	for (let n of t) if (Ye(n)) {
		let t = e.measureText(n).width;
		e.fillText(n, o + (i - t) / 2, r), o += i;
	} else e.fillText(n, o, r), o += e.measureText(n).width;
	e.textAlign = a;
}
//#endregion
//#region packages/pptx/src/presentation-handle.ts
var R = (e, t) => e / M * t;
async function $e(e, t, n) {
	let r = e.getContext("2d");
	if (!r) throw Error("2D context not available");
	let a = n.width / (n.slideWidthEmu / M);
	await n.drawBase();
	let o = document.createElement("canvas");
	o.width = e.width, o.height = e.height;
	let s = o.getContext("2d");
	if (!s) throw Error("base 2D context not available");
	s.drawImage(e, 0, 0);
	let c = [], l = !1, u = () => {
		for (let e of c) {
			e.detachListeners(), e.media.pause(), e.media.removeAttribute("src");
			try {
				e.media.load();
			} catch {}
			URL.revokeObjectURL(e.objectUrl);
		}
		c.length = 0;
	}, d = (e) => {
		l || (n.onError ? n.onError(e) : console.error("[ooxml] PPTX embedded media failed:", e));
	};
	for (let e of t) {
		let t;
		try {
			t = await n.fetchMedia(e.mediaPath);
		} catch (t) {
			throw u(), nt(e, t);
		}
		let r = e.mimeType || t.type, i = t.type === r ? t : new Blob([t], { type: r }), o = URL.createObjectURL(i), s = e.mediaKind === "video" ? document.createElement("video") : document.createElement("audio");
		s.src = o, s.preload = "metadata", e.mediaKind === "video" && (s.playsInline = !0);
		let f = et(e, a), p = {
			el: e,
			rect: e.mediaKind === "audio" ? {
				x: f.x + f.w / 2 - Math.max(f.w, 260) / 2,
				y: f.y,
				w: Math.max(f.w, 260),
				h: f.h + 36
			} : f,
			posterRect: f,
			media: s,
			objectUrl: o,
			loadState: "loading",
			detachListeners: () => {}
		}, m = () => {
			l || (p.loadState = "metadata");
		}, h = () => {
			l || (p.loadState = "ready");
		}, g = () => {
			l || (p.loadState = "error", d(z(e, s, "decode")));
		};
		s.addEventListener("loadedmetadata", m), s.addEventListener("canplay", h), s.addEventListener("error", g), p.detachListeners = () => {
			s.removeEventListener("loadedmetadata", m), s.removeEventListener("canplay", h), s.removeEventListener("error", g);
		}, c.push(p);
		try {
			s.load();
		} catch (t) {
			let n = z(e, s, "load", t);
			throw u(), n;
		}
	}
	let f = null, p = null, m = () => {
		r.setTransform(e.width / n.width, 0, 0, e.height / n.height, 0, 0), r.drawImage(o, 0, 0, e.width, e.height, 0, 0, n.width, n.height);
		for (let e of c) {
			let t = e.media;
			if (e.loadState !== "loading") {
				if (e.loadState === "error") {
					tt(r, e.posterRect, "Media unavailable");
					continue;
				}
				if (e.el.mediaKind === "video" && t.readyState >= 2) {
					let { x: n, y: i, w: a, h: o } = e.posterRect;
					r.drawImage(t, n, i, a, o);
				}
				if (e === p || v?.state === e) st(r, e, t);
				else if (t.paused) {
					let { x: t, y: n, w: a, h: o } = e.posterRect;
					i(r, t + a / 2, n + o / 2, a, o, "paused");
				}
			}
		}
	}, h = () => {
		l || (m(), f = requestAnimationFrame(h));
	}, g = (t, r) => {
		let i = e.getBoundingClientRect();
		return {
			x: (t - i.left) / i.width * n.width,
			y: (r - i.top) / i.height * n.height
		};
	}, _ = (e, t) => {
		for (let n of c) {
			let { x: r, y: i, w: a, h: o } = n.rect;
			if (e < r || e > r + a || t < i || t > i + o) continue;
			let s = H(n), c = s.y - 12, l = s.y + s.h + 8;
			return (Number.isFinite(n.media.duration) ? n.media.duration : 0) > 0 && e >= s.x && e <= s.x + s.w && t >= c && t <= l ? {
				kind: "seek",
				state: n,
				fraction: Math.max(0, Math.min(1, (e - s.x) / s.w))
			} : {
				kind: "toggle",
				state: n
			};
		}
		return null;
	}, v = null, y = (e, t) => {
		let n = Number.isFinite(e.media.duration) ? e.media.duration : 0;
		n <= 0 || (e.media.currentTime = n * t);
	}, b = (e) => {
		try {
			e.media.play().catch((t) => {
				d(z(e.el, e.media, "play", t));
			});
		} catch (t) {
			d(z(e.el, e.media, "play", t));
		}
	}, x = (t) => {
		let { x: n, y: r } = g(t.clientX, t.clientY), i = _(n, r);
		i && (i.kind === "seek" ? (v = {
			state: i.state,
			wasPlaying: !i.state.media.paused
		}, i.state.media.pause(), y(i.state, i.fraction), e.setPointerCapture(t.pointerId), t.preventDefault()) : i.state.media.paused ? b(i.state) : i.state.media.pause());
	}, S = (e) => {
		let { x: t, y: n } = g(e.clientX, e.clientY);
		p = null;
		for (let e of c) {
			let { x: r, y: i, w: a, h: o } = e.rect;
			if (t >= r && t <= r + a && n >= i && n <= i + o) {
				p = e;
				break;
			}
		}
		if (v) {
			let e = H(v.state), n = Math.max(0, Math.min(1, (t - e.x) / e.w));
			y(v.state, n);
		}
	}, C = () => {
		p = null;
	}, w = (t) => {
		if (!v) return;
		let { wasPlaying: n, state: r } = v;
		v = null, e.releasePointerCapture(t.pointerId), n && b(r);
	};
	return c.length > 0 && (e.addEventListener("pointerdown", x), e.addEventListener("pointermove", S), e.addEventListener("pointerleave", C), e.addEventListener("pointerup", w), e.addEventListener("pointercancel", w), e.style.cursor = "pointer", h()), {
		play(e) {
			for (let t of c) (!e || t.el.mediaPath === e) && b(t);
		},
		pause(e) {
			for (let t of c) (!e || t.el.mediaPath === e) && t.media.pause();
		},
		destroy() {
			l || (l = !0, f !== null && cancelAnimationFrame(f), e.removeEventListener("pointerdown", x), e.removeEventListener("pointermove", S), e.removeEventListener("pointerleave", C), e.removeEventListener("pointerup", w), e.removeEventListener("pointercancel", w), e.style.cursor = "", u());
		}
	};
}
function et(e, t) {
	return {
		x: R(e.x, t),
		y: R(e.y, t),
		w: R(e.width, t),
		h: R(e.height, t)
	};
}
function tt(e, t, n) {
	let r = Math.max(10, Math.min(14, t.h * .12));
	e.save(), e.font = `500 ${r}px system-ui, -apple-system, sans-serif`, e.textAlign = "center", e.textBaseline = "middle";
	let i = r + 12, a = Math.min(t.w, Math.max(100, e.measureText(n).width + 24));
	U(e, t.x + (t.w - a) / 2, t.y + (t.h - i) / 2, a, i, i / 2), e.fillStyle = "rgba(20, 20, 20, 0.72)", e.fill(), e.fillStyle = "rgba(255, 255, 255, 0.95)", e.fillText(n, t.x + t.w / 2, t.y + t.h / 2), e.restore();
}
function nt(e, t) {
	return /* @__PURE__ */ Error(`Embedded ${e.mediaKind} fetch failed for "${e.mediaPath}" (mime=${e.mimeType || "unknown"}): ${rt(t)}`);
}
function z(e, t, n, r) {
	let i = "";
	try {
		i = e.mimeType ? t.canPlayType(e.mimeType) : "";
	} catch {}
	let a = t.error, o = [
		`mime=${e.mimeType || "unknown"}`,
		`canPlayType=${i || "no"}`,
		`readyState=${t.readyState}`,
		`networkState=${t.networkState}`
	];
	a && o.push(`mediaError=${a.code}${a.message ? ` ${a.message}` : ""}`);
	let s = r === void 0 ? "" : `: ${rt(r)}`;
	return /* @__PURE__ */ Error(`Embedded ${e.mediaKind} ${n} failed for "${e.mediaPath}" (${o.join("; ")})${s}`);
}
function rt(e) {
	return e instanceof Error ? `${e.name || "Error"}${e.message ? `: ${e.message}` : ""}` : String(e);
}
var it = 28, B = 14, at = 72, ot = 10, V = 3;
function st(e, t, n) {
	let r = Number.isFinite(n.duration) ? n.duration : 0, a = r > 0 ? Math.min(1, n.currentTime / r) : 0, o = t.posterRect;
	i(e, o.x + o.w / 2, o.y + o.h / 2, o.w, o.h, n.paused ? "paused" : "playing"), t.el.mediaKind === "audio" ? lt(e, t, n, r, a) : ct(e, t, n, r, a);
}
function ct(e, t, n, r, i) {
	let { x: a, y: o, w: s, h: c } = t.rect, l = Math.max(28, Math.min(56, c * .22)), u = o + c - l;
	e.save();
	let d = e.createLinearGradient(0, u, 0, o + c);
	d.addColorStop(0, "rgba(0, 0, 0, 0)"), d.addColorStop(1, "rgba(0, 0, 0, 0.55)"), e.fillStyle = d, e.fillRect(a, u, s, l), e.restore();
	let f = H(t);
	dt(e, f, i, r > 0), e.save(), e.font = "500 11px system-ui, -apple-system, sans-serif", e.textBaseline = "middle", e.shadowColor = "rgba(0, 0, 0, 0.75)", e.shadowBlur = 3, e.fillStyle = "rgba(255, 255, 255, 0.95)", ut(e, n.currentTime, r, f.x, f.y - 10, "bottom"), e.restore();
}
function lt(e, t, n, r, i) {
	let a = ft(t.rect);
	e.save(), U(e, a.x, a.y, a.w, a.h, a.h / 2), e.fillStyle = "rgba(20, 20, 20, 0.72)", e.fill(), e.font = "500 11px system-ui, -apple-system, sans-serif", e.textBaseline = "middle", e.fillStyle = "rgba(255, 255, 255, 0.95)", ut(e, n.currentTime, r, a.x + B, a.y + a.h / 2, "middle"), e.restore(), dt(e, H(t), i, r > 0);
}
function ut(e, t, n, r, i, a) {
	let o = pt(t), s = pt(n), c = Xe(e), l = Ze(e, o, c), u = Ze(e, s, c), d = e.measureText(" / ").width, f = Math.max(l, u);
	Qe(e, o, r + f - l, i, c);
	let p = e.textAlign;
	e.textAlign = "left", e.fillText(" / ", r + f, i), e.textAlign = p, Qe(e, s, r + f + d, i, c);
}
function dt(e, t, n, r) {
	let i = t.h / 2;
	if (e.save(), U(e, t.x, t.y, t.w, t.h, i), e.fillStyle = "rgba(255, 255, 255, 0.35)", e.fill(), n > 0 && (U(e, t.x, t.y, t.w * n, t.h, i), e.fillStyle = "#fff", e.fill()), r) {
		let r = Math.max(t.x + 5, Math.min(t.x + t.w - 5, t.x + t.w * n));
		e.shadowColor = "rgba(0, 0, 0, 0.3)", e.shadowBlur = 3, e.fillStyle = "#fff", e.beginPath(), e.arc(r, t.y + t.h / 2, 5, 0, Math.PI * 2), e.fill();
	}
	e.restore();
}
function ft(e) {
	let t = Math.max(220, e.w - 24);
	return {
		x: e.x + e.w / 2 - t / 2,
		y: e.y + e.h - it - 4,
		w: t,
		h: it
	};
}
function H(e) {
	if (e.el.mediaKind === "audio") {
		let t = ft(e.rect), n = t.x + B + at + ot, r = Math.max(40, t.x + t.w - B - n);
		return {
			x: n,
			y: t.y + (t.h - V) / 2,
			w: r,
			h: V
		};
	}
	let t = e.rect, n = Math.max(12, t.w * .025), r = Math.max(12, Math.min(18, t.h * .05));
	return {
		x: t.x + n,
		y: t.y + t.h - V - r,
		w: t.w - n * 2,
		h: V
	};
}
function U(e, t, n, r, i, a) {
	let o = Math.min(a, i / 2, r / 2);
	e.beginPath(), e.moveTo(t + o, n), e.lineTo(t + r - o, n), e.quadraticCurveTo(t + r, n, t + r, n + o), e.lineTo(t + r, n + i - o), e.quadraticCurveTo(t + r, n + i, t + r - o, n + i), e.lineTo(t + o, n + i), e.quadraticCurveTo(t, n + i, t, n + i - o), e.lineTo(t, n + o), e.quadraticCurveTo(t, n, t + o, n), e.closePath();
}
function pt(e) {
	if (!Number.isFinite(e) || e < 0) return "0:00";
	let t = Math.floor(e);
	return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;
}
//#endregion
//#region packages/pptx/src/slide-nav.ts
function mt(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		r !== void 0 && r !== "" && !t.has(r) && t.set(r, n);
	}
	return t;
}
function ht(e, t) {
	if (e === "") return;
	let n = Ve("ppt/slides", e);
	return t.get(n);
}
function gt(e, t, n) {
	let r = He(e);
	return r === null ? ht(e, t) : Ue(r, n, t.size);
}
//#endregion
//#region packages/pptx/src/slide-repository.ts
var _t = class {
	#e;
	#t;
	#n;
	#r = 0;
	#i = Promise.resolve();
	#a;
	#o;
	constructor(e) {
		if (!Number.isSafeInteger(e.slideCount) || e.slideCount < 0) throw TypeError("slideCount must be a non-negative safe integer");
		this.#e = e.slideCount, this.#t = e.loadSlide, this.#n = new Ee({
			maxEntries: e.maxCachedSlides,
			maxWeight: e.maxCachedStructuralBytes,
			measure: (e) => Le(e).jsonBytes
		});
	}
	get slideCount() {
		return this.#e;
	}
	get usage() {
		return this.#n.usage;
	}
	withSlide(e, t) {
		this.#c(e);
		let n = this.#r, r = this.#i.then(async () => {
			if (n !== this.#r) throw this.#a ? this.#a : Error("PPTX slide repository generation is stale");
			if (this.#a) throw this.#a;
			let r = await this.#s(e, n);
			try {
				return await t(r);
			} catch (e) {
				let t = vt(e);
				throw t ? (this.#l(t, n), this.#o === n ? this.#a ?? t : t) : e;
			}
		});
		return this.#i = r.then(() => void 0, () => void 0), r;
	}
	async #s(e, t) {
		return this.#n.getOrLoad(e, async () => {
			let n;
			try {
				n = await this.#t(e);
			} catch (e) {
				let n = vt(e);
				throw n ? (this.#l(n, t), this.#o === t ? this.#a ?? n : n) : e;
			}
			if (this.#o === t && this.#a) throw this.#a;
			return n;
		});
	}
	clear() {
		this.#r += 1, this.#a = void 0, this.#o = void 0, this.#n.clear();
	}
	#c(e) {
		if (!Number.isSafeInteger(e) || e < 0 || e >= this.#e) throw RangeError(`Slide index ${e} out of range (count: ${this.#e})`);
	}
	#l(e, t) {
		t !== this.#r || this.#a || (this.#a = e, this.#o = t, this.#r += 1, this.#n.clear());
	}
};
function vt(e) {
	return e instanceof b ? e : m(e);
}
//#endregion
//#region packages/pptx/src/embedded-fonts.ts
var yt = 1;
function W(e) {
	return e.trim().toLowerCase();
}
async function bt(e, t) {
	if (e.length === 0) return {
		faces: [],
		aliases: /* @__PURE__ */ new Map(),
		authoredFamilies: /* @__PURE__ */ new Map()
	};
	let n = yt++, r = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = W(t.fontName);
		r.has(e) || r.set(e, `__ooxml_pptx_${n}_${r.size + 1}`);
	}
	let i = [], a = /* @__PURE__ */ new Set();
	for (let n = 0; n < e.length; n += 2) {
		let o = (await Promise.all(e.slice(n, n + 2).map(async (e) => {
			try {
				return {
					family: r.get(W(e.fontName)),
					bytes: await t(e.partPath),
					odttf: !1,
					weight: e.style === "bold" || e.style === "boldItalic" ? "bold" : "normal",
					style: e.style === "italic" || e.style === "boldItalic" ? "italic" : "normal"
				};
			} catch {
				return null;
			}
		}))).filter((e) => e !== null);
		if (o.length !== 0) for (let e of await Oe(o)) a.has(e) ? j([e]) : (a.add(e), i.push(e));
	}
	let o = new Set(i.map((e) => W(e.family))), s = new Map([...r].filter(([, e]) => o.has(W(e))));
	return {
		faces: i,
		aliases: s,
		authoredFamilies: new Map([...s].map(([e, t]) => [t, e]))
	};
}
function xt(e, t) {
	return e.filter((e) => e === null || !t.has(e.trim().toLowerCase()));
}
//#endregion
//#region packages/pptx/src/worker.ts?worker&inline
var St = "var e=(e,t)=>()=>(e&&(t=e(e=0)),t),t=class e extends Error{code;constructor(t,n){super(n),this.name=`OoxmlError`,this.code=t,Object.setPrototypeOf(this,e.prototype)}},n=class e extends Error{code=`ooxml-resource-limit`;details;constructor(t,n){super(t),this.name=`OoxmlResourceLimitError`;let r=n.violation,i=Object.freeze({format:r.format,operation:r.operation,resource:r.resource,metric:r.metric,...r.part===void 0?{}:{part:r.part},limit:r.limit,observed:r.observed,configurable:r.configurable,usage:Object.freeze({archiveEntryCount:r.usage.archiveEntryCount,declaredInflatedBytes:r.usage.declaredInflatedBytes,...r.usage.largestInflatedEntryBytes===void 0?{}:{largestInflatedEntryBytes:r.usage.largestInflatedEntryBytes},distinctInflatedBytes:r.usage.distinctInflatedBytes,operationInflatedBytes:r.usage.operationInflatedBytes})});this.details=Object.freeze({stage:n.stage,violation:i}),Object.setPrototypeOf(this,e.prototype)}};const r=67108864,i=`https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap`,a=`https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap`,o=`https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap`,s={calibri:{url:`https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap`,loadFamily:`Carlito`},\"calibri light\":{url:`https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap`,loadFamily:`Carlito`},cambria:{url:`https://fonts.googleapis.com/css2?family=Caladea:ital,wght@0,400;0,700;1,400;1,700&display=swap`,loadFamily:`Caladea`},\"cambria math\":{url:`https://fonts.googleapis.com/css2?family=Caladea:ital,wght@0,400;0,700;1,400;1,700&display=swap`,loadFamily:`Caladea`},\"franklin gothic book\":{url:o,loadFamily:`Libre Franklin`},\"franklin gothic medium\":{url:o,loadFamily:`Libre Franklin`},\"nunito sans\":{url:`https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap`},nunito:{url:`https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,700;1,400;1,700&display=swap`},\"open sans\":{url:`https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap`},roboto:{url:`https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap`},lato:{url:`https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap`},montserrat:{url:`https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&display=swap`},poppins:{url:`https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,700;1,400;1,700&display=swap`},raleway:{url:`https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,700;1,400;1,700&display=swap`},\"playfair display\":{url:`https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap`},ubuntu:{url:`https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,400;0,700;1,400;1,700&display=swap`},\"sakkal majalla\":{url:i,loadFamily:`Noto Naskh Arabic`},\"traditional arabic\":{url:i,loadFamily:`Noto Naskh Arabic`},\"simplified arabic\":{url:i,loadFamily:`Noto Naskh Arabic`},\"arabic typesetting\":{url:i,loadFamily:`Noto Naskh Arabic`},\"univers next arabic\":{url:a,loadFamily:`Noto Sans Arabic`},\"noto naskh arabic\":{url:i,loadFamily:`Noto Naskh Arabic`},\"noto sans arabic\":{url:a,loadFamily:`Noto Sans Arabic`}};function c(e){if(!e)return null;let t=e.toLowerCase();return/[ᄀ-ᇿ㄰-㆏가-힯]/.test(e)?`kr`:/[぀-ヿ]/.test(e)?`jp`:/jhenghei|微軟正黑|新細明|細明|pmingliu|mingliu|dfkai|標楷|華康|cns11643|kaiti tc|ming\\s*liu/.test(t)||/新細明體|細明體|標楷體|微軟正黑體|華康/.test(e)?`tc`:/simsun|nsimsun|simhei|simkai|simfang|yahei|dengxian|fangsong|kaiti|youyuan|lisu|stsong|stkaiti|stfangsong|stheiti|stxihei|stzhongsong|songti sc|heiti sc|微软雅黑/.test(t)||/宋体|黑体|楷体|仿宋|等线|微软雅黑|隶书|幼圆/.test(e)?`sc`:/malgun|batang|gulim|dotum|gungsuh|nanum|new gulim|hancom|hy(gothic|graphic|namu)?/.test(t)?`kr`:/\\bmeiryo\\b|\\byu\\s*(gothic|mincho)\\b|yugothic|yumincho|hiragino|\\bms\\s*(gothic|mincho|pgothic|pmincho|ui\\s*gothic)\\b|\\bms[pg]?(gothic|mincho)\\b|ipa(ex)?(gothic|mincho)|noto\\s+(sans|serif)\\s+jp|游ゴシック|游明朝|ＭＳ|メイリオ|ヒラギノ/.test(t)||/游ゴシック|游明朝|ＭＳ ゴシック|ＭＳ 明朝|ＭＳ Ｐゴシック|メイリオ|ヒラギノ/.test(e)?`jp`:null}const l=e=>`https://fonts.googleapis.com/css2?family=${e}:wght@400;700&display=swap`,u={\"noto sans kr\":{url:l(`Noto+Sans+KR`)},\"noto sans sc\":{url:l(`Noto+Sans+SC`)},\"noto sans tc\":{url:l(`Noto+Sans+TC`)},\"noto sans jp\":{url:l(`Noto+Sans+JP`)},\"noto serif kr\":{url:l(`Noto+Serif+KR`)},\"noto serif sc\":{url:l(`Noto+Serif+SC`)},\"noto serif tc\":{url:l(`Noto+Serif+TC`)},\"noto serif jp\":{url:l(`Noto+Serif+JP`)},\"noto sans\":{url:l(`Noto+Sans`)},\"noto serif\":{url:l(`Noto+Serif`)},\"noto sans devanagari\":{url:l(`Noto+Sans+Devanagari`)},\"noto sans thai\":{url:l(`Noto+Sans+Thai`)},\"noto sans hebrew\":{url:l(`Noto+Sans+Hebrew`)},\"noto serif hebrew\":{url:l(`Noto+Serif+Hebrew`)}};var d=class e{hasHan=!1;hasHangul=!1;hasKana=!1;hasArabic=!1;hasThai=!1;hasHebrew=!1;hasDevanagari=!1;hasCyrGreek=!1;constructor(e){this.cjkLang=e}clone(){let t=new e(this.cjkLang);return t.hasHan=this.hasHan,t.hasHangul=this.hasHangul,t.hasKana=this.hasKana,t.hasArabic=this.hasArabic,t.hasThai=this.hasThai,t.hasHebrew=this.hasHebrew,t.hasDevanagari=this.hasDevanagari,t.hasCyrGreek=this.hasCyrGreek,t}addText(e){let t=()=>this.hasHan&&this.hasHangul&&this.hasKana&&this.hasArabic&&this.hasThai&&this.hasHebrew&&this.hasDevanagari&&this.hasCyrGreek;outer:for(let n of e)if(n)for(let e of n){let n=e.codePointAt(0);if(n!==void 0&&!(n<=591)&&(n>=4352&&n<=4607||n>=12592&&n<=12687||n>=44032&&n<=55215?this.hasHangul=!0:n>=12352&&n<=12543?this.hasKana=!0:n>=13312&&n<=19903||n>=19968&&n<=40959||n>=63744&&n<=64255||n>=131072&&n<=195103?this.hasHan=!0:n>=1536&&n<=1791||n>=1872&&n<=1919||n>=2208&&n<=2303||n>=64336&&n<=65023||n>=65136&&n<=65279?this.hasArabic=!0:n>=3584&&n<=3711?this.hasThai=!0:n>=1424&&n<=1535||n>=64285&&n<=64335?this.hasHebrew=!0:n>=2304&&n<=2431?this.hasDevanagari=!0:(n>=1024&&n<=1279||n>=880&&n<=1023)&&(this.hasCyrGreek=!0),t()))break outer}}names(){let e=[],t=new Set;this.hasHangul&&t.add(`kr`),this.hasKana&&t.add(`jp`),this.hasHan&&t.size===0&&t.add(this.cjkLang??`jp`);for(let n of[`kr`,`sc`,`tc`,`jp`])if(t.has(n)){let t={kr:`KR`,sc:`SC`,tc:`TC`,jp:`JP`}[n];e.push(`Noto Sans ${t}`,`Noto Serif ${t}`)}return this.hasCyrGreek&&e.push(`Noto Sans`,`Noto Serif`),this.hasArabic&&e.push(`Noto Naskh Arabic`,`Noto Sans Arabic`),this.hasThai&&e.push(`Noto Sans Thai`),this.hasHebrew&&e.push(`Noto Sans Hebrew`,`Noto Serif Hebrew`),this.hasDevanagari&&e.push(`Noto Sans Devanagari`),e}};function f(e){return e===`image-dimension`||e===`image-pixels`||e===`active-decoded-bytes`}function p(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>=0}function ee(e){if(!(!e||typeof e!=`object`))try{let t=e,n=t.code,r=t.metric,i=t.limit,a=t.observed;return n!==`ooxml-decoded-image-limit`||!f(r)||!p(i)||!p(a)||a<=i?void 0:{metric:r,limit:i,observed:a}}catch{return}}var te,ne,m,re=e((()=>{te=1<<25,ne=1<<27,te*4,ne*4,m=class e extends RangeError{code=`ooxml-decoded-image-limit`;constructor(t,n,r){super(`OOXML decoded image limit exceeded: ${t} ${r} > ${n}`),this.metric=t,this.limit=n,this.observed=r,this.name=`OoxmlDecodedImageLimitError`,Object.setPrototypeOf(this,e.prototype)}}}));function ie(e){if(!(typeof e!=`object`||!e))try{let t=e,n=t.code,r=t.message;return n===`ooxml-tiff-decode`&&typeof r==`string`?{message:r}:void 0}catch{return}}var ae,oe=e((()=>{ae=class e extends Error{code=`ooxml-tiff-decode`;constructor(t,n){super(t,n),this.name=`TiffDecodeError`,Object.setPrototypeOf(this,e.prototype)}}}));function se(e){if(!e.startsWith(`data:`))return null;let t=e.indexOf(`,`);if(t===-1)return null;let n=atob(e.slice(t+1)),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}var ce=class{state=`uninitialized`;generationValue=0;readiness;poisonListeners=new Set;constructor(e,t,n){this.initialize=e,this.reinitialize=t,this.normalizeFailure=n}get generation(){return this.generationValue}get poisoned(){return this.state===`poisoned`}onPoison(e){return this.poisonListeners.add(e),()=>this.poisonListeners.delete(e)}async ensureReady(){if(this.state!==`ready`){if(!this.readiness){let e=this.state===`uninitialized`?this.initialize:this.reinitialize;this.readiness=Promise.resolve().then(e).then(()=>{this.generationValue+=1,this.state=`ready`,this.readiness=void 0},e=>{throw this.readiness=void 0,e})}await this.readiness}}run(e){try{return e()}catch(e){let t=this.normalizeFailure(e);throw t?(this.poison(t),t):e}}tryRunReady(e){if(this.state!==`ready`)return{current:!1};let t=this.generationValue,n=this.run(e);return this.state!==`ready`||t!==this.generationValue?{current:!1}:{current:!0,generation:t,value:n}}poison(e){this.state=`poisoned`,this.readiness=void 0;for(let t of this.poisonListeners)t(e)}assertCurrent(e){if(this.state!==`ready`||e!==this.generationValue)throw Error(`WASM archive session belongs to a discarded runtime generation`)}},le=class e extends Error{code=`parser-crashed`;constructor(t){super(t),this.name=`WasmTrapError`,Object.setPrototypeOf(this,e.prototype)}};function ue(e){let t=globalThis.WebAssembly?.RuntimeError;return t&&e instanceof t||e instanceof RangeError?!0:e instanceof Error?e.name===`RuntimeError`||e.name===`CompileError`||e.name===`LinkError`||e.name===`InternalError`||e.name===`OOMError`:!1}function de(e){try{if((typeof e!=`object`||!e)&&typeof e!=`function`)return;let t=Reflect.get(e,`__destroy_into_raw`);typeof t==`function`&&Reflect.apply(t,e,[])}catch{}}function fe(e,t){return e({module_or_path:t})}var pe=class{runtime;wasmInput=null;currentArchive=null;constructor(e,t={}){this.init=e,this.options=t,this.runtime=new ce(()=>this.invokeConfigured(this.init),()=>this.invokeConfigured(this.options.reinit??this.init),me),this.runtime.onPoison(()=>this.dropPoisonedArchive())}setWasmInput(e){this.wasmInput=e,this.runtime.ensureReady().catch(()=>void 0)}setWasmUrl(e){this.setWasmInput(e)}get archive(){return this.currentArchive}setArchive(e){this.freeArchive(),this.currentArchive=e}disposeArchive(){this.freeArchive()}get poisoned(){return this.runtime.poisoned}async ensureReady(){await this.runtime.ensureReady()}run(e){return this.runtime.run(e)}poison(){this.runtime.poison(new le(`WASM parser was recycled`))}invokeConfigured(e){return this.wasmInput===null?Promise.reject(Error(`WasmParserHost: setWasmInput was never called`)):fe(e,this.wasmInput)}freeArchive(){this.currentArchive!==null&&this.options.freeArchive&&this.options.freeArchive(this.currentArchive),this.currentArchive=null}dropPoisonedArchive(){let e=this.currentArchive;this.currentArchive=null,de(e)}};function me(e){return ue(e)?new le(`WASM parser trapped and was recycled: ${e instanceof Error?e.message:String(e)}`):null}function h(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>0}function he(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return h(t.requiredBytes)&&h(t.offeredBytes)&&t.requiredBytes>t.offeredBytes}var g=class e extends RangeError{code=`ooxml-insufficient-credit`;requiredBytes;offeredBytes;constructor(t){super(`Pull unit requires ${t.requiredBytes} bytes but credit is ${t.offeredBytes}`),this.name=`PullSessionInsufficientCreditError`,this.requiredBytes=t.requiredBytes,this.offeredBytes=t.offeredBytes,Object.setPrototypeOf(this,e.prototype)}};function ge(e){if(e instanceof g)return e;let t=e instanceof Error?e.message:String(e);if(!t.startsWith(`OOXML_INSUFFICIENT_CREDIT:`))return;let n;try{n=JSON.parse(t.slice(26))}catch{return}if(!n||typeof n!=`object`||Array.isArray(n))return;let r=n;if(!(r.code!==`ooxml-insufficient-credit`||!he(r)))return new g(r)}function _e(e,t,n){let r=ge(e);if(!(!r||r.offeredBytes!==t||r.requiredBytes>n))return r}re(),oe();const _=`OOXML_RESOURCE_LIMIT:`;function v(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>=0}function ve(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return v(t.archiveEntryCount)&&v(t.declaredInflatedBytes)&&(t.largestInflatedEntryBytes===void 0||v(t.largestInflatedEntryBytes))&&v(t.distinctInflatedBytes)&&v(t.operationInflatedBytes)}function ye(e){let t;try{t=JSON.parse(new TextDecoder().decode(e))}catch{throw TypeError(`OOXML resource usage checkpoint is not valid JSON`)}if(!ve(t))throw TypeError(`OOXML resource usage checkpoint is invalid`);return t}function be(e){return e===`docx`||e===`xlsx`||e===`pptx`}function xe(e){return e===`container`||e===`decompression`||e===`parsing`||e===`serialization`||e===`layout`||e===`rendering`||e===`worker`}function y(e,t){return typeof e==`string`&&e.length>0&&e.length<=t&&!/[\\u0000-\\u001f\\u007f]/u.test(e)}function b(e){return y(e,128)&&/^[a-z0-9][a-z0-9-]*$/u.test(e)}function Se(e){return!y(e,4096)||e.startsWith(`/`)||e.startsWith(`\\\\`)||e.includes(`\\\\`)||e.includes(`?`)||e.includes(`#`)||e.includes(`://`)||/^[a-z]:/iu.test(e)?!1:e.split(`/`).every(e=>e!==``&&e!==`.`&&e!==`..`)}const x=new Map([[`archive-entry:declared-inflated-bytes`,{stage:`container`,part:`required`}],[`archive-entry:actual-inflated-bytes`,{stage:`decompression`,part:`required`}],[`archive:entry-count`,{stage:`container`,part:`forbidden`}],[`archive:central-directory-bytes`,{stage:`container`,part:`forbidden`,configurable:!1}],[`archive:distinct-inflated-bytes`,{stage:`decompression`,part:`required`}],[`xml-event:bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`xml-context:bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`xml-tree:depth`,{stage:`parsing`,part:`optional`,configurable:!1}],[`worksheet-row:projected-bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`worksheet-shell:projected-bytes`,{stage:`parsing`,part:`optional`,configurable:!1}]]),Ce=new Set([...x.keys()].map(e=>e.slice(0,e.indexOf(`:`)))),we=new Set([...x.keys()].map(e=>e.slice(e.indexOf(`:`)+1)));function Te(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return!be(t.format)||!y(t.operation,256)||!b(t.resource)||!b(t.metric)||!v(t.limit)||!v(t.observed)||typeof t.configurable!=`boolean`||!ve(t.usage)?!1:!(`part`in t)||Se(t.part)}function S(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;if(!xe(t.stage)||!Te(t.violation))return!1;let n=t.violation,r=x.get(`${n.resource}:${n.metric}`);return r?t.stage!==r.stage||r.configurable===!1&&n.configurable!==!1?!1:r.part===`required`?n.part!==void 0:r.part===`forbidden`?n.part===void 0:!0:!(Ce.has(n.resource)&&we.has(n.metric))}function Ee(e){return{archiveEntryCount:e.archiveEntryCount,declaredInflatedBytes:e.declaredInflatedBytes,...e.largestInflatedEntryBytes===void 0?{}:{largestInflatedEntryBytes:e.largestInflatedEntryBytes},distinctInflatedBytes:e.distinctInflatedBytes,operationInflatedBytes:e.operationInflatedBytes}}function De(e){if(!S(e))return;let t=e.violation,n={stage:e.stage,violation:{format:t.format,operation:t.operation,resource:t.resource,metric:t.metric,...t.part===void 0?{}:{part:t.part},limit:t.limit,observed:t.observed,configurable:t.configurable,usage:Ee(t.usage)}};return S(n)?n:void 0}function Oe(e){let t=e.violation;return`OOXML resource limit exceeded${t.part?` for ${t.part}`:``}: ${t.metric} ${t.observed} > ${t.limit}`}function C(e){let t=e instanceof Error?e.message:String(e);if(!t.startsWith(_))return;let r;try{r=JSON.parse(t.slice(21))}catch{return}if(!r||typeof r!=`object`)return;let i=r;if(!(i.code!==`ooxml-resource-limit`||!S(i.details)))return new n(Oe(i.details),i.details)}function ke(e){let r=ee(e);if(r){let e=new m(r.metric,r.limit,r.observed);return{message:e.message,errorName:e.name,code:e.code,decodedImage:r}}let i=ie(e);if(i)return{message:i.message,errorName:`TiffDecodeError`,code:`ooxml-tiff-decode`};let a=ge(e);if(a)return{message:a.message,errorName:a.name,code:a.code,insufficientCredit:{requiredBytes:a.requiredBytes,offeredBytes:a.offeredBytes}};let o=e instanceof t||e instanceof n?e:C(e);if(o instanceof n){let e=De(o.details);return e?{message:typeof o.message==`string`?o.message:Oe(e),errorName:`OoxmlResourceLimitError`,code:`ooxml-resource-limit`,resourceLimit:e}:{message:`Invalid OOXML resource-limit error payload`,errorName:`Error`}}if(o instanceof t)return{message:typeof o.message==`string`?o.message:String(o.message),errorName:y(o.name,128)?o.name:`OoxmlError`,...b(o.code)?{code:o.code}:{}};let s=e instanceof Error?e.message:String(e);if(typeof s==`string`&&s.startsWith(_))return{message:`Invalid OOXML resource-limit payload`,errorName:`Error`};let c=e instanceof Error?e:Error(s),l=c;return{message:typeof c.message==`string`?c.message:String(c.message),errorName:y(c.name,128)?c.name:`Error`,...typeof l.code==`string`?{code:l.code}:{}}}function w(e){try{return ke(e)}catch{return{message:`Worker operation failed with an unreadable error`,errorName:`Error`}}}const Ae=new Set([`encrypted`,`invalid-password`,`unsupported-encryption`,`legacy-binary-format`,`not-ooxml`]),je={\"image-dimension\":!0,\"image-pixels\":!0,\"active-decoded-bytes\":!0};function Me(e){return typeof e==`string`&&Object.prototype.hasOwnProperty.call(je,e)}function Ne(e,t){if(e!==`ooxml-decoded-image-limit`||!t||typeof t!=`object`)return;let n=t,r=n.metric,i=n.limit,a=n.observed;if(!(!Me(r)||!v(i)||!v(a)||a<=i))return{metric:r,limit:i,observed:a}}function Pe(e){let r=e.message,i=e.errorName,a=e.code,o=e.decodedImage,s=e.insufficientCredit,c=e.resourceLimit,l=typeof r==`string`?r:`Worker operation failed with an invalid error payload`,u=y(i,128)?i:void 0,d=typeof a==`string`?a:void 0,f=Ne(d,o);if(f)return new m(f.metric,f.limit,f.observed);if(d===`ooxml-tiff-decode`)return new ae(l);if(d===`ooxml-insufficient-credit`&&he(s))return new g(s);if(d===`ooxml-resource-limit`&&S(c))return new n(l,c);if(d&&Ae.has(d))return new t(d,l);let p=u===`TypeError`?TypeError(l):u===`RangeError`?RangeError(l):Error(l);return u&&(p.name=u),d!==void 0&&Object.assign(p,{code:d}),p}function Fe(e){try{return Pe(e)}catch{return Error(`Worker operation failed with an unreadable error payload`)}}function Ie(e){return e.byteOffset===0&&e.byteLength===e.buffer.byteLength&&e.buffer instanceof ArrayBuffer?e.buffer:e.slice().buffer}Object.freeze({maxArchiveEntryBytes:134217728,maxTotalInflatedBytes:268435456,maxArchiveEntries:4096});function Le(e){return[e.maxArchiveEntryBytes===null?0n:BigInt(e.maxArchiveEntryBytes),e.maxTotalInflatedBytes===null?0n:BigInt(e.maxTotalInflatedBytes),e.maxArchiveEntries===null?0n:BigInt(e.maxArchiveEntries)]}const T=`ooxml-pull-v1`;function E(e,t){if(!Number.isSafeInteger(e)||e<=0)throw RangeError(`${t} must be a positive safe integer`)}function Re(e){if(!(typeof e==`string`&&e.length>0||typeof e==`number`&&Number.isSafeInteger(e)&&e>0))throw RangeError(`session id must be a non-empty string or positive safe integer`)}var ze=class{owner;queue=Promise.resolve();leases=new Map;retainedBytes=0;retainedCount=0;maxRetainedBytes;maxRetainedCount;cleanups=new Set;pendingFatalCleanups=[];poisonRunning=!1;fatal;constructor(e){this.maxRetainedBytes=e?.maxRetainedBytes??64*1024*1024,this.maxRetainedCount=e?.maxRetainedCount??256,E(this.maxRetainedBytes,`max retained lease bytes`),E(this.maxRetainedCount,`max retained lease count`)}enqueue(e){let t=this.queue.then(e,e);return this.queue=t.then(()=>void 0,()=>void 0),t}acquire(e){return this.owner===void 0?(this.owner=e,!0):this.owner===e}release(e){this.owner===e&&(this.owner=void 0)}retainLease(e,t,n){if(!Number.isSafeInteger(n)||n<0)throw RangeError(`retained lease bytes are invalid`);let r=this.leases.get(e)??new Map;if(r.has(t))throw Error(`driver returned a duplicate lease id`);if(this.retainedCount+1>this.maxRetainedCount)throw RangeError(`retained lease count exceeds limit`);if(this.retainedBytes+n>this.maxRetainedBytes)throw RangeError(`retained lease bytes exceed limit`);r.set(t,n),this.leases.set(e,r),this.retainedCount++,this.retainedBytes+=n}releaseLease(e,t){let n=this.leases.get(e),r=n?.get(t);r!==void 0&&(n?.delete(t),n?.size===0&&this.leases.delete(e),this.retainedCount--,this.retainedBytes-=r)}registerCleanup(e){return this.fatal?(this.poisonRunning?this.pendingFatalCleanups.push(e):this.enqueue(e).catch(()=>void 0),()=>void 0):(this.cleanups.add(e),()=>this.cleanups.delete(e))}get fatalError(){return this.fatal}get registeredHostCount(){return this.cleanups.size}async poison(e){if(this.fatal??=e,this.poisonRunning)return this.fatal;this.poisonRunning=!0,this.pendingFatalCleanups.push(...this.cleanups);try{let e;for(;(e=this.pendingFatalCleanups.shift())!==void 0;)await e().catch(()=>void 0)}finally{this.poisonRunning=!1}return this.fatal}},Be=class{options;coordinator;coordinatorOwner=Symbol(`pull-session-host`);unregisterCleanup;sequence=0;unacked;leases=new Map;activeDriverLeases=new Set;nextWireLeaseId;cancelRequested=!1;cancelComplete=!1;closeRequested=!1;closeComplete=!1;driverCancelComplete=!1;driverCloseComplete=!1;completed=!1;constructor(e){Re(e.sessionId),E(e.operationId,`operation id`),E(e.generation,`generation`),E(e.maxByteCredit,`max byte credit`),e.wireLeaseIdStart!==void 0&&E(e.wireLeaseIdStart,`wire lease id start`),this.options=e,this.coordinator=e.coordinator,this.nextWireLeaseId=e.wireLeaseIdStart??1,this.unregisterCleanup=this.coordinator.registerCleanup(()=>this.forceFatalCleanup())}dispatch(e,t){return this.coordinator.enqueue(async()=>{let n=await this.execute(e);try{t(n.response,n.transfer)}catch(e){throw await this.rollbackFailedPost(n),e}})}async rollbackFailedPost(e){let t=e.response;if(t.kind===`chunk`){let n=t.leaseId===void 0?void 0:this.leases.get(t.leaseId);try{await this.options.driver.disposeInvalidChunk?.({payload:t.payload,byteLength:t.byteLength,done:t.done,leaseId:n?.driverLeaseId,retainedBytes:n?.retainedBytes,transfer:e.transfer})}catch{}}this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);for(let[e,t]of[...this.leases])try{await this.options.driver.releaseLease?.(t.driverLeaseId)}catch{}finally{this.leases.delete(e),this.activeDriverLeases.delete(t.driverLeaseId),this.coordinator.releaseLease(this.coordinatorOwner,e)}if(this.cancelRequested=!0,!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch{}this.unregisterCleanup()}async execute(e){try{if(this.isStaleLifecycle(e)){let t=e.kind===`cancel`?`cancel`:`close`;return this.sameOperationIdentity(e)?{response:this.accepted(e,t,!0)}:{response:this.errorResponse(e,{message:`stale lifecycle targets another session or operation`,errorName:`PullSessionProtocolError`,code:`ooxml-stale-lifecycle`})}}this.validateCommandIdentity(e);let t=this.coordinator.fatalError;if(t)return e.kind===`pull`?{response:this.errorResponse(e,t)}:(e.kind===`cancel`?await this.cancel():e.kind===`close`?await this.close():e.kind===`release`&&await this.release(e.leaseId),{response:this.accepted(e,e.kind)});switch(e.kind){case`pull`:return await this.pull(e);case`ack`:return await this.ack(e.sequence),{response:this.accepted(e,`ack`)};case`release`:return await this.release(e.leaseId),{response:this.accepted(e,`release`)};case`cancel`:return await this.cancel(),{response:this.accepted(e,`cancel`)};case`close`:return await this.close(),{response:this.accepted(e,`close`)}}}catch(t){let n=w(t);return n.code===`ooxml-resource-limit`&&(n=await this.coordinator.poison(n)),{response:this.errorResponse(e,n)}}}async pull(e){if(this.closeRequested||this.cancelRequested||this.completed)throw Error(`pull session is closed`);if(this.unacked)throw Error(`previous chunk is not acknowledged`);if(!Number.isSafeInteger(e.sequence)||e.sequence<0||e.sequence!==this.sequence)throw Error(`pull command sequence mismatch`);if(this.validateHostCredit(e.byteCredit),!this.coordinator.acquire(this.coordinatorOwner))throw Error(`another operation has an unacknowledged package chunk`);let t;try{t=await this.options.driver.pull(e.byteCredit)}catch(e){throw this.coordinator.release(this.coordinatorOwner),e}let n=!1,r=!1,i,a;try{let o=this.options.driver.measureChunk(t),s=this.arrayBufferTransferBytes(t.transfer);if(o<s)throw RangeError(`measured chunk bytes are below ArrayBuffer transfer bytes`);if(a=Math.max(o,s),t.leaseId!==void 0){if(E(t.leaseId,`lease id`),t.retainedBytes===void 0)throw Error(`retained lease bytes are required`);if(this.activeDriverLeases.has(t.leaseId))throw r=!0,Error(`driver returned an active duplicate lease id`);i=this.allocateWireLeaseId(),this.coordinator.retainLease(this.coordinatorOwner,i,t.retainedBytes),this.leases.set(i,{driverLeaseId:t.leaseId,retainedBytes:t.retainedBytes}),this.activeDriverLeases.add(t.leaseId),n=!0}else if(t.retainedBytes!==void 0)throw Error(`retained lease bytes require a lease id`);if(!Number.isSafeInteger(a)||a<0)throw RangeError(`host chunk byte length must be a non-negative safe integer`);if(a>e.byteCredit)throw RangeError(`host chunk exceeds byte credit`)}catch(e){let a;try{await this.options.driver.disposeInvalidChunk?.(t)}catch(e){a=e}if(n&&i!==void 0)try{await this.release(i)}catch(e){a??=e}else if(t.leaseId!==void 0&&!r)try{await this.options.driver.releaseLease?.(t.leaseId)}catch(e){a??=e}if(r)try{await this.cancel()}catch(e){a??=e}throw this.coordinator.release(this.coordinatorOwner),a||e}return this.unacked={sequence:this.sequence,done:t.done},{response:{kind:`chunk`,protocol:T,...this.identity(),requestId:e.requestId,sequence:this.sequence,byteLength:a,done:t.done,payload:t.payload,leaseId:i,usage:this.resourceUsage()},transfer:t.transfer}}async ack(e){if(!Number.isSafeInteger(e)||e<0)throw RangeError(`invalid ack sequence`);if(e<this.sequence)return;if(!this.unacked||e!==this.sequence)throw Error(`ack sequence mismatch`);let t=this.unacked.done;await this.options.driver.acknowledge?.(e),this.unacked=void 0,this.coordinator.release(this.coordinatorOwner),this.sequence++,t&&(this.completed=!0,this.maybeUnregisterCompleted())}async release(e){E(e,`wire lease id`);let t=this.leases.get(e);t&&(await this.options.driver.releaseLease?.(t.driverLeaseId),this.leases.delete(e),this.activeDriverLeases.delete(t.driverLeaseId),this.coordinator.releaseLease(this.coordinatorOwner,e),this.maybeUnregisterCompleted())}async cancel(){if(this.cancelComplete)return;this.cancelRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;try{await this.releaseAllLeases()}catch(t){e=t}if(!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch(t){e??=t}if(e)throw e;this.cancelComplete=!0,this.unregisterCleanup()}async close(){if(this.closeComplete)return;this.closeRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;try{await this.releaseAllLeases()}catch(t){e=t}if(!this.driverCloseComplete)try{await this.options.driver.close?.(),this.driverCloseComplete=!0}catch(t){e??=t}if(e)throw e;this.closeComplete=!0,this.unregisterCleanup()}async releaseAllLeases(){let e;for(let t of[...this.leases.keys()])try{await this.release(t)}catch(t){e??=t}if(e)throw e}validateCommandIdentity(e){if(e.protocol!==`ooxml-pull-v1`||e.sessionId!==this.options.sessionId||e.operationId!==this.options.operationId||e.generation!==this.options.generation||!Number.isSafeInteger(e.requestId)||e.requestId<=0)throw Error(`stale or mismatched pull session command`)}validateHostCredit(e){if(E(e,`byte credit`),e>this.options.maxByteCredit)throw RangeError(`byte credit exceeds host maximum`)}accepted(e,t,n=!1){return{kind:`accepted`,protocol:T,...n?{sessionId:e.sessionId,operationId:e.operationId,generation:e.generation}:this.identity(),requestId:e.requestId,command:t,usage:this.resourceUsage()}}identity(){return{sessionId:this.options.sessionId,operationId:this.options.operationId,generation:this.options.generation}}isStaleLifecycle(e){return(e.kind===`cancel`||e.kind===`close`)&&e.protocol===`ooxml-pull-v1`&&Number.isSafeInteger(e.requestId)&&e.requestId>0&&Number.isSafeInteger(e.generation)&&e.generation>0&&e.generation<this.options.generation}sameOperationIdentity(e){return e.sessionId===this.options.sessionId&&e.operationId===this.options.operationId}errorResponse(e,t){return{kind:`error`,protocol:T,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:t,usage:this.errorResourceUsage()}}async forceFatalCleanup(){this.cancelRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;for(let t of[...this.leases.keys()])try{await this.release(t)}catch(t){e??=t}if(!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch(t){e??=t}if(e)throw e;this.unregisterCleanup()}allocateWireLeaseId(){if(!Number.isSafeInteger(this.nextWireLeaseId)||this.nextWireLeaseId<=0)throw RangeError(`wire lease id space exhausted`);return this.nextWireLeaseId++}arrayBufferTransferBytes(e){let t=0;for(let n of e??[])if(n instanceof ArrayBuffer&&(t+=n.byteLength,!Number.isSafeInteger(t)))throw RangeError(`ArrayBuffer transfer bytes overflow`);return t}maybeUnregisterCompleted(){this.completed&&this.leases.size===0&&this.unregisterCleanup()}resourceUsage(){return this.options.driver.resourceUsage?.()}errorResourceUsage(){try{return this.resourceUsage()}catch{return}}};function D(e,t){if(!Number.isSafeInteger(e)||e<0)throw Error(`${t} must be a non-negative safe integer`)}function O(e,t,n){return D(e,`resource measurement`),D(t,`resource measurement`),D(n,`resource measurement limit`),e>n||t>n||t>n-e?n===2**53-1?n:n+1:e+t}function Ve(e,t=2**53-1){D(t,`resource measurement limit`);let n=0;for(let r=0;r<e.length;r+=1){let i=e.charCodeAt(r),a;if(i<=127)a=1;else if(i<=2047)a=2;else if(i>=55296&&i<=56319&&r+1<e.length){let t=e.charCodeAt(r+1);t>=56320&&t<=57343?(a=4,r+=1):a=3}else a=3;if(n=O(n,a,t),n>t)return n}return n}function He(e,t=2**53-1){D(t,`resource measurement limit`);let n=O(0,2,t);if(n>t)return n;for(let r=0;r<e.length;r+=1){let i=e.charCodeAt(r),a;if(i===34||i===92||i===8||i===9||i===10||i===12||i===13)a=2;else if(i<=31)a=6;else if(i<=127)a=1;else if(i<=2047)a=2;else if(i>=55296&&i<=56319&&r+1<e.length){let t=e.charCodeAt(r+1);t>=56320&&t<=57343?(a=4,r+=1):a=6}else a=i>=55296&&i<=57343?6:3;if(n=O(n,a,t),n>t)return n}return n}function k(e,t){return O(0,e,t)}function A(e,t=2**53-1,n=!1){if(D(t,`resource measurement limit`),e===null)return{jsonBytes:k(4,t),stringValueUtf8Bytes:0};if(typeof e==`string`)return{jsonBytes:He(e,t),stringValueUtf8Bytes:Ve(e,t)};if(typeof e==`boolean`)return{jsonBytes:k(e?4:5,t),stringValueUtf8Bytes:0};if(typeof e==`number`)return{jsonBytes:k((Number.isFinite(e)?String(Object.is(e,-0)?0:e):`null`).length,t),stringValueUtf8Bytes:0};if(typeof e==`bigint`)throw TypeError(`BigInt values cannot be serialized to JSON`);if(Array.isArray(e)){let n=k(2,t),r=0;for(let i=0;i<e.length;i+=1){i!==0&&(n=O(n,1,t));let a=A(e[i],t,!0);n=O(n,a.jsonBytes,t),r=O(r,a.stringValueUtf8Bytes,t)}return{jsonBytes:n,stringValueUtf8Bytes:r}}if(typeof e==`object`){let n=k(2,t),r=0,i=0;for(let[a,o]of Object.entries(e)){if(o===void 0||typeof o==`function`||typeof o==`symbol`)continue;i++!==0&&(n=O(n,1,t)),n=O(n,He(a,t),t),n=O(n,1,t);let e=A(o,t);n=O(n,e.jsonBytes,t),r=O(r,e.stringValueUtf8Bytes,t)}return{jsonBytes:n,stringValueUtf8Bytes:r}}return{jsonBytes:n?k(4,t):0,stringValueUtf8Bytes:0}}({...s,...u});function*Ue(e){for(let t of e?.paragraphs??[])for(let e of t.runs)e.type===`text`&&(yield e.text)}function*j(e){for(let t of e?.paragraphs??[]){t.defFontFamily&&(yield t.defFontFamily);for(let e of t.runs)e.type===`text`&&(e.fontFamily&&(yield e.fontFamily),e.fontFamilyEa&&(yield e.fontFamilyEa),e.fontFamilySym&&(yield e.fontFamilySym))}}function*We(e){for(let t of e.elements)if(t.type===`shape`)yield*Ue(t.textBody);else if(t.type===`table`)for(let e of t.rows)for(let t of e.cells)yield*Ue(t.textBody);else if(t.type===`chart`){t.chart.title&&(yield t.chart.title);for(let e of t.chart.categories)yield e;for(let e of t.chart.series)e.name&&(yield e.name)}}var Ge=class e{scripts;families;constructor(e,t,n,r){this.majorFont=e,this.minorFont=t;let i=c(e)??c(t)??null;this.scripts=n??new d(i),this.families=r??new Set,e&&this.families.add(e),t&&this.families.add(t)}addSlide(e){this.scripts.addText(We(e));for(let t of e.elements)if(t.type===`shape`)for(let e of j(t.textBody))this.families.add(e);else if(t.type===`table`)for(let e of t.rows)for(let t of e.cells)for(let e of j(t.textBody))this.families.add(e)}names(){return[...this.families,...this.scripts.names()]}withSlide(t){let n=new e(this.majorFont,this.minorFont,this.scripts.clone(),new Set(this.families));return n.addSlide(t),n}};const M=Object.freeze({archiveEntryCount:0,declaredInflatedBytes:0,distinctInflatedBytes:0,operationInflatedBytes:0}),Ke=67108864;function N(e,t){if(e!==null&&typeof e!=`string`)throw Error(`invalid PPTX presentation bootstrap ${t}`)}function qe(e,t){if(!e||typeof e!=`object`||Array.isArray(e))throw Error(`invalid PPTX presentation bootstrap slide at ${t}`);let n=e;if(n.index!==t)throw Error(`invalid PPTX presentation bootstrap slide index ${n.index}`);if(n.partName!==void 0&&typeof n.partName!=`string`)throw Error(`invalid PPTX presentation bootstrap slide partName at ${t}`);return Object.freeze({index:n.index,...n.partName===void 0?{}:{partName:n.partName}})}function Je(e,t){if(!e||typeof e!=`object`||Array.isArray(e))throw Error(`invalid PPTX presentation bootstrap embedded font at ${t}`);let n=e;if(typeof n.fontName!=`string`||n.fontName.length===0||![`regular`,`bold`,`italic`,`boldItalic`].includes(n.style??``)||typeof n.partPath!=`string`||n.partPath.length===0||n.partPath.startsWith(`/`)||n.partPath.split(`/`).includes(`..`)||![`application/x-font-ttf`,`application/x-fontdata`].includes(n.contentType??``))throw Error(`invalid PPTX presentation bootstrap embedded font fields at ${t}`);return Object.freeze({fontName:n.fontName,style:n.style,partPath:n.partPath,contentType:n.contentType})}function Ye(e){if(!e||typeof e!=`object`||Array.isArray(e))throw Error(`invalid PPTX presentation bootstrap payload`);let t=e;if(!Number.isSafeInteger(t.slideCount)||(t.slideCount??-1)<0||!Number.isSafeInteger(t.slideWidth)||(t.slideWidth??0)<=0||!Number.isSafeInteger(t.slideHeight)||(t.slideHeight??0)<=0||!Array.isArray(t.embeddedFonts)||!Array.isArray(t.slides)||t.slides.length!==t.slideCount)throw Error(`invalid PPTX presentation bootstrap dimensions or slide count`);return N(t.defaultTextColor,`defaultTextColor`),N(t.majorFont,`majorFont`),N(t.minorFont,`minorFont`),N(t.hlinkColor,`hlinkColor`),N(t.folHlinkColor,`folHlinkColor`),Object.freeze({slideCount:t.slideCount,slideWidth:t.slideWidth,slideHeight:t.slideHeight,defaultTextColor:t.defaultTextColor,majorFont:t.majorFont,minorFont:t.minorFont,hlinkColor:t.hlinkColor,folHlinkColor:t.folHlinkColor,embeddedFonts:Object.freeze(t.embeddedFonts.map(Je)),slides:Object.freeze(t.slides.map(qe))})}function Xe(e){return Object.freeze({type:`media`,x:e.x,y:e.y,width:e.width,height:e.height,rotation:e.rotation,flipH:e.flipH,flipV:e.flipV,mediaKind:e.mediaKind,posterPath:e.posterPath,posterMimeType:e.posterMimeType,mediaPath:e.mediaPath,mimeType:e.mimeType})}function Ze(e){return Object.freeze({...e.id===void 0?{}:{id:e.id},...e.authorId===void 0?{}:{authorId:e.authorId},...e.author===void 0?{}:{author:e.author},...e.date===void 0?{}:{date:e.date},...e.status===void 0?{}:{status:e.status},text:e.text})}function Qe(e){return Object.freeze({...e})}function $e(e){return Object.freeze({...e.authorId===void 0?{}:{authorId:e.authorId},...e.modernAuthorId===void 0?{}:{modernAuthorId:e.modernAuthorId},...e.id===void 0?{}:{id:e.id},...e.index===void 0?{}:{index:e.index},...e.author===void 0?{}:{author:e.author},...e.date===void 0?{}:{date:e.date},...e.x===void 0?{}:{x:e.x},...e.y===void 0?{}:{y:e.y},...e.anchors?.length?{anchors:Object.freeze(e.anchors.map(Qe))}:{},...e.status===void 0?{}:{status:e.status},text:e.text,...e.replies?.length?{replies:Object.freeze(e.replies.map(Ze))}:{}})}function et(e,t){if(e.index!==t.index||e.partName!==t.partName)throw Error(`PPTX pulled slide identity does not match bootstrap index ${t.index}`);return Object.freeze({index:t.index,...t.partName===void 0?{}:{partName:t.partName},notes:e.notes??null,hidden:e.hidden??!1,mediaElements:Object.freeze(e.elements.filter(e=>e.type===`media`).map(Xe)),...e.comments?.length?{comments:Object.freeze(e.comments.map($e))}:{}})}function tt(e,t,r){if(!(e<=t))throw new n(`PPTX presentation preflight exceeded its hard limit of ${t} projected bytes`,{stage:`parsing`,violation:{format:`pptx`,operation:`presentation-preflight`,resource:`presentation-preflight`,metric:`projected-bytes`,limit:t,observed:Math.min(e,t+1),configurable:!1,usage:r}})}var nt=class{slideCountValue;slideWidthValue;slideHeightValue;defaultTextColorValue;majorFontValue;minorFontValue;hlinkColorValue;folHlinkColorValue;embeddedFontsValue;descriptors;slides=[];fonts;fontPreloadNames;fontProjectionBytes;projectionBytesValue;limit;pending=null;finished=null;constructor(e,t={}){let n=Ye(e),r=t.hardLimitForTesting??Ke;if(!Number.isSafeInteger(r)||r<=0||r>Ke)throw Error(`invalid PPTX presentation preflight test limit`);this.limit=r,this.slideCountValue=n.slideCount,this.slideWidthValue=n.slideWidth,this.slideHeightValue=n.slideHeight,this.defaultTextColorValue=n.defaultTextColor,this.majorFontValue=n.majorFont,this.minorFontValue=n.minorFont,this.hlinkColorValue=n.hlinkColor,this.folHlinkColorValue=n.folHlinkColor,this.embeddedFontsValue=n.embeddedFonts,this.descriptors=[...n.slides],this.fonts=new Ge(this.majorFontValue,this.minorFontValue),this.fontPreloadNames=Object.freeze(this.fonts.names()),this.fontProjectionBytes=A(this.fontPreloadNames,this.limit).jsonBytes,this.projectionBytesValue=A({slideCount:this.slideCountValue,slideWidth:this.slideWidthValue,slideHeight:this.slideHeightValue,defaultTextColor:this.defaultTextColorValue,majorFont:this.majorFontValue,minorFont:this.minorFontValue,hlinkColor:this.hlinkColorValue,folHlinkColor:this.folHlinkColorValue,embeddedFonts:this.embeddedFontsValue,remainingSlides:this.descriptors,slides:[],fontPreloadNames:this.fontPreloadNames},this.limit).jsonBytes,tt(this.projectionBytesValue,this.limit,M)}get acceptedSlideCount(){return this.finished?.slideCount??this.slides.length}get projectedBytes(){return this.projectionBytesValue}get remainingDescriptorCount(){return this.descriptors.reduce((e,t)=>e+Number(t!==void 0),0)}get latestSlide(){return this.slides[this.slides.length-1]}get currentFontPreloadNames(){return this.fontPreloadNames}snapshot(){if(this.finished)return this.finished;if(this.pending)throw Error(`PPTX presentation preflight has an uncommitted slide`);return Object.freeze({slideCount:this.slideCountValue,slideWidth:this.slideWidthValue,slideHeight:this.slideHeightValue,defaultTextColor:this.defaultTextColorValue,majorFont:this.majorFontValue,minorFont:this.minorFontValue,hlinkColor:this.hlinkColorValue,folHlinkColor:this.folHlinkColorValue,embeddedFonts:this.embeddedFontsValue,slides:Object.freeze([...this.slides]),fontPreloadNames:this.fontPreloadNames})}addSlide(e,t=M){this.prepareSlide(e,t).commit()}prepareSlide(e,t=M){if(this.finished)throw Error(`PPTX presentation preflight is already finished`);if(this.pending)throw Error(`PPTX presentation preflight already has a prepared slide`);let n=this.slides.length,r=this.descriptors[n];if(!r)throw Error(`PPTX presentation preflight received an extra slide`);let i=et(e,r),a=this.fonts.withSlide(e),o=Object.freeze(a.names()),s=A(o,this.limit).jsonBytes,c=A(i,this.limit).jsonBytes,l=this.projectionBytesValue-this.fontProjectionBytes-A(r,this.limit).jsonBytes+4;l=O(l,s,this.limit),l=O(l,c,this.limit),this.slides.length!==0&&(l=O(l,1,this.limit));let u=A({slide:i,fontPreloadNames:o},this.limit).jsonBytes,d=O(this.projectionBytesValue,u,this.limit);tt(Math.max(d,l),this.limit,t);let f={state:`prepared`,fact:i,fonts:a,fontNames:o,fontBytes:s,committedBytes:l};return this.pending=f,{projectedBytes:d,commit:()=>{if(f.state!==`committed`){if(f.state===`rolled-back`)throw Error(`PPTX presentation preflight cannot commit a rolled-back slide`);if(this.pending!==f)throw Error(`PPTX presentation preflight prepared slide is stale`);this.descriptors[n]=void 0,this.slides.push(f.fact),this.fonts=f.fonts,this.fontPreloadNames=f.fontNames,this.fontProjectionBytes=f.fontBytes,this.projectionBytesValue=f.committedBytes,f.state=`committed`,this.pending=null}},rollback:()=>{if(f.state!==`rolled-back`){if(f.state===`committed`)throw Error(`PPTX presentation preflight cannot roll back a committed slide`);if(this.pending!==f)throw Error(`PPTX presentation preflight prepared slide is stale`);f.state=`rolled-back`,this.pending=null}}}}finish(){if(this.finished)return this.finished;if(this.pending)throw Error(`PPTX presentation preflight has an uncommitted slide`);if(this.slides.length!==this.slideCountValue)throw Error(`PPTX presentation preflight is incomplete: ${this.slides.length}/${this.slideCountValue} slides`);return this.finished=Object.freeze({slideCount:this.slideCountValue,slideWidth:this.slideWidthValue,slideHeight:this.slideHeightValue,defaultTextColor:this.defaultTextColorValue,majorFont:this.majorFontValue,minorFont:this.minorFontValue,hlinkColor:this.hlinkColorValue,folHlinkColor:this.folHlinkColorValue,embeddedFonts:this.embeddedFontsValue,slides:Object.freeze([...this.slides]),fontPreloadNames:this.fontPreloadNames}),this.descriptors=[],this.slides=[],this.projectionBytesValue=A(this.finished,this.limit).jsonBytes,this.finished}};function rt(e){try{return ye(e(e=>e.slide_cursor_resource_usage()))}catch(e){if(String(e).includes(`slide cursor usage is unavailable`))return;throw e}}function it(e,t,n,r,i){let a,o;try{if(i){if(!r)throw Error(`slide payload is missing before acknowledgement`);let t=i(n,r,rt(e));typeof t==`function`?a=t:t&&({rollback:a,commit:o}=t)}e(e=>e.acknowledge_slide(t.operationId,t.generation)),o?.()}catch(e){try{a?.()}catch{}throw e}}var at=class{coordinatorGeneration=new ze;sessions=new Map;pendingOpens=new Map;operationTail=Promise.resolve();resourceFailure;lifecycleState=`ready`;resetBarrier;resetIdentities=new Map;constructor(e,t,n=e=>e(this.requireArchive())){this.archive=e,this.acceptSlide=t,this.executeArchive=n}get coordinator(){return this.coordinatorGeneration}reserveOpen(e){if(this.assertReady(),st(e),this.pendingOpens.has(e.sessionId)||this.sessions.has(e.sessionId))throw Error(`slide pull session id is already reserved`);this.pendingOpens.set(e.sessionId,{identity:e,canceled:!1})}abandonOpen(e){this.pendingOpens.delete(e)}get pendingOpenCount(){return this.pendingOpens.size}async open(e,t){if(this.assertReady(),this.resourceFailure)throw this.resourceFailure;if(!Number.isSafeInteger(e)||e<0)throw RangeError(`slide index must be a non-negative safe integer`);let n=this.pendingOpens.get(t.sessionId);if(!n||!P(n.identity,t))throw Error(`slide pull session open reservation is stale or missing`);let i,a=new Promise(e=>{i=e}),o=this.operationTail.then(()=>this.coordinator.enqueue(async()=>{if(n.canceled)throw Error(`slide pull session open was canceled`);let a,o=!1,s=new Be({...t,maxByteCredit:r,coordinator:this.coordinator,driver:{pull:n=>{let i;try{i=this.executeArchive(r=>r.pull_slide(e,t.operationId,t.generation,n))}catch(e){throw _e(e,n,r)||(this.latchResourceFailure(e),e)}let s=Ie(i);return this.acceptSlide&&(a=JSON.parse(new TextDecoder().decode(new Uint8Array(s)))),o=!0,{payload:s,byteLength:s.byteLength,done:!0,transfer:[s]}},measureChunk:({payload:e})=>e.byteLength,acknowledge:()=>{if(!o)throw Error(`slide unit is not awaiting acknowledgement`);try{it(this.executeArchive,t,e,a,this.acceptSlide)}catch(e){throw this.latchResourceFailure(e),e}o=!1,a=void 0,this.sessions.delete(t.sessionId),i()},cancel:async()=>{try{this.archive()&&await this.executeArchive(e=>e.cancel_slide())}finally{a=void 0,o=!1,this.sessions.delete(t.sessionId),i()}},close:async()=>{try{this.archive()&&await this.executeArchive(e=>e.cancel_slide())}finally{a=void 0,o=!1,this.sessions.delete(t.sessionId),i()}},resourceUsage:()=>{try{return this.readResourceUsage()}catch(e){throw this.latchResourceFailure(e),e}}}});this.sessions.set(t.sessionId,{host:s,identity:t}),this.pendingOpens.delete(t.sessionId)}));this.operationTail=o.then(()=>a,()=>void 0);try{await o}catch(e){throw this.pendingOpens.delete(t.sessionId),i(),e}}async postOpenedSafely(e,t,n){if(this.lifecycleState!==`ready`){try{n(this.lifecycleError())}catch{}return}try{t()}catch(t){await this.closeIdentity(e);try{n(t)}catch{}}}dispatch(e,t){if(this.lifecycleState!==`ready`)return t(this.responseDuringReset(e)),Promise.resolve();let n=this.sessions.get(e.sessionId);if(n)return n.host.dispatch(e,t);let r=this.pendingOpens.get(e.sessionId);if(r&&(e.kind===`cancel`||e.kind===`close`)){let n=P(r.identity,e);return n&&(r.canceled=!0),t(n?{protocol:T,kind:`accepted`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,command:e.kind}:this.staleLifecycleResponse(e)),Promise.resolve()}return e.kind===`cancel`||e.kind===`close`?(t({protocol:T,kind:`accepted`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,command:e.kind}),Promise.resolve()):(t({protocol:T,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:w(Error(`slide pull session is not open`))}),Promise.resolve())}async dispatchSafely(e,t){try{await this.dispatch(e,t)}catch(n){try{t({protocol:T,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:w(n)})}catch{}}}run(e){if(this.lifecycleState!==`ready`)return Promise.reject(this.lifecycleError());let t=this.operationTail.then(()=>this.coordinator.enqueue(async()=>{if(this.resourceFailure)throw this.resourceFailure;return e()})).catch(e=>{throw this.latchResourceFailure(e),e});return this.operationTail=t.then(()=>void 0,()=>void 0),t}reset(){if(this.resetBarrier)return this.resetBarrier;this.lifecycleState=`resetting`,this.captureResetIdentities();let e=this.performReset().then(()=>{this.resetIdentities.clear(),this.lifecycleState=`ready`},e=>{throw this.lifecycleState=`reset-failed`,e}).finally(()=>{this.resetBarrier===e&&(this.resetBarrier=void 0)});return this.resetBarrier=e,e}async performReset(){for(let e of this.pendingOpens.values())e.canceled=!0;let e=1;for(let{host:t,identity:n}of[...this.sessions.values()]){let r;if(await t.dispatch({protocol:T,kind:`close`,...n,requestId:e++},e=>{e.kind===`error`&&(r=Fe(e.error))}),r)throw r}this.sessions.clear(),await this.operationTail,this.pendingOpens.clear(),this.archive()&&await this.executeArchive(e=>e.close_presentation_session()),this.coordinatorGeneration=new ze,this.resourceFailure=void 0}assertReady(){if(this.lifecycleState!==`ready`)throw this.lifecycleError()}lifecycleError(){let e=this.lifecycleState===`reset-failed`,t=Error(e?`slide pull worker reset failed; retry reset before new work`:`slide pull worker reset is in progress`);return t.name=`PullSessionLifecycleError`,Object.assign(t,{code:e?`ooxml-pull-reset-failed`:`ooxml-pull-resetting`})}captureResetIdentities(){for(let{identity:e}of this.sessions.values())this.resetIdentities.set(e.sessionId,e);for(let{identity:e}of this.pendingOpens.values())this.resetIdentities.set(e.sessionId,e)}responseDuringReset(e){if(e.kind===`cancel`||e.kind===`close`){let t=this.resetIdentities.get(e.sessionId);return t&&!P(t,e)?this.staleLifecycleResponse(e):{protocol:T,kind:`accepted`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,command:e.kind}}return{protocol:T,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:w(this.lifecycleError())}}requireArchive(){let e=this.archive();if(!e)throw Error(`Presentation not loaded`);return e}async closeIdentity(e){if(this.lifecycleState!==`ready`)return;let t=this.sessions.get(e.sessionId);if(t){await t.host.dispatch({protocol:T,kind:`close`,...e,requestId:1},()=>void 0);return}let n=this.pendingOpens.get(e.sessionId);n&&P(n.identity,e)&&(n.canceled=!0)}readResourceUsage(){return rt(this.executeArchive)}latchResourceFailure(e){let t=e instanceof n?e:C(e);t&&(this.resourceFailure??=t)}staleLifecycleResponse(e){return{protocol:T,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:{message:`stale lifecycle targets another slide operation`,errorName:`PullSessionProtocolError`,code:`ooxml-stale-lifecycle`}}}};function ot(e){return!!e&&typeof e==`object`&&e.protocol===`ooxml-pull-v1`}function st(e){if(!Number.isSafeInteger(e.sessionId)||e.sessionId<=0)throw RangeError(`session id must be a positive safe integer`);if(!Number.isSafeInteger(e.operationId)||e.operationId<=0)throw RangeError(`operation id must be a positive safe integer`);if(!Number.isSafeInteger(e.generation)||e.generation<=0)throw RangeError(`generation must be a positive safe integer`)}function P(e,t){return e.sessionId===t.sessionId&&e.operationId===t.operationId&&e.generation===t.generation}var F=class{__destroy_into_raw(){let e=this.__wbg_ptr;return this.__wbg_ptr=0,lt.unregister(this),e}free(){let e=this.__destroy_into_raw();J.__wbg_pptxarchive_free(e,0)}acknowledge_slide(e,t){let n=J.pptxarchive_acknowledge_slide(this.__wbg_ptr,e,t);if(n[1])throw U(n[0])}assert_healthy(){let e=J.pptxarchive_assert_healthy(this.__wbg_ptr);if(e[1])throw U(e[0])}cancel_slide(){J.pptxarchive_cancel_slide(this.__wbg_ptr)}close_presentation_session(){J.pptxarchive_close_presentation_session(this.__wbg_ptr)}extract_font(e){let t=H(e,J.__wbindgen_malloc,J.__wbindgen_realloc),n=q,r=J.pptxarchive_extract_font(this.__wbg_ptr,t,n);if(r[3])throw U(r[2]);var i=I(r[0],r[1]).slice();return J.__wbindgen_free(r[0],r[1]*1,1),i}extract_image(e){let t=H(e,J.__wbindgen_malloc,J.__wbindgen_realloc),n=q,r=J.pptxarchive_extract_image(this.__wbg_ptr,t,n);if(r[3])throw U(r[2]);var i=I(r[0],r[1]).slice();return J.__wbindgen_free(r[0],r[1]*1,1),i}extract_media(e){let t=H(e,J.__wbindgen_malloc,J.__wbindgen_realloc),n=q,r=J.pptxarchive_extract_media(this.__wbg_ptr,t,n);if(r[3])throw U(r[2]);var i=I(r[0],r[1]).slice();return J.__wbindgen_free(r[0],r[1]*1,1),i}constructor(e,t,n,r){let i=dt(e,J.__wbindgen_malloc),a=q,o=J.pptxarchive_new(i,a,!V(t),V(t)?BigInt(0):t,!V(n),V(n)?BigInt(0):n,!V(r),V(r)?BigInt(0):r);if(o[2])throw U(o[1]);return this.__wbg_ptr=o[0]>>>0,lt.register(this,this.__wbg_ptr,this),this}parse(){let e=J.pptxarchive_parse(this.__wbg_ptr);if(e[3])throw U(e[2]);var t=I(e[0],e[1]).slice();return J.__wbindgen_free(e[0],e[1]*1,1),t}presentation_bootstrap(){let e=J.pptxarchive_presentation_bootstrap(this.__wbg_ptr);if(e[3])throw U(e[2]);var t=I(e[0],e[1]).slice();return J.__wbindgen_free(e[0],e[1]*1,1),t}pull_slide(e,t,n,r){let i=J.pptxarchive_pull_slide(this.__wbg_ptr,e,t,n,r);if(i[3])throw U(i[2]);var a=I(i[0],i[1]).slice();return J.__wbindgen_free(i[0],i[1]*1,1),a}resource_usage(){let e=J.pptxarchive_resource_usage(this.__wbg_ptr);if(e[3])throw U(e[2]);var t=I(e[0],e[1]).slice();return J.__wbindgen_free(e[0],e[1]*1,1),t}slide_cursor_resource_usage(){let e=J.pptxarchive_slide_cursor_resource_usage(this.__wbg_ptr);if(e[3])throw U(e[2]);var t=I(e[0],e[1]).slice();return J.__wbindgen_free(e[0],e[1]*1,1),t}to_markdown(){let e,t;try{let i=J.pptxarchive_to_markdown(this.__wbg_ptr);var n=i[0],r=i[1];if(i[3])throw n=0,r=0,U(i[2]);return e=n,t=r,R(n,r)}finally{J.__wbindgen_free(e,t,1)}}};Symbol.dispose&&(F.prototype[Symbol.dispose]=F.prototype.free);function ct(){return{__proto__:null,\"./pptx_parser_bg.js\":{__proto__:null,__wbg___wbindgen_throw_6b64449b9b9ed33c:function(e,t){throw Error(R(e,t))},__wbg_error_a6fa202b58aa1cd3:function(e,t){let n,r;try{n=e,r=t,console.error(R(e,t))}finally{J.__wbindgen_free(n,r,1)}},__wbg_new_227d7c05414eb861:function(){return Error()},__wbg_stack_3b0d974bbf31e44f:function(e,t){let n=t.stack,r=H(n,J.__wbindgen_malloc,J.__wbindgen_realloc),i=q;ut().setInt32(e+4,i,!0),ut().setInt32(e+0,r,!0)},__wbindgen_cast_0000000000000001:function(e,t){return R(e,t)},__wbindgen_init_externref_table:function(){let e=J.__wbindgen_externrefs,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)}}}}const lt=typeof FinalizationRegistry>`u`?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(e=>J.__wbg_pptxarchive_free(e>>>0,1));function I(e,t){return e>>>=0,B().subarray(e/1,e/1+t)}let L=null;function ut(){return(L===null||L.buffer.detached===!0||L.buffer.detached===void 0&&L.buffer!==J.memory.buffer)&&(L=new DataView(J.memory.buffer)),L}function R(e,t){return e>>>=0,ft(e,t)}let z=null;function B(){return(z===null||z.byteLength===0)&&(z=new Uint8Array(J.memory.buffer)),z}function V(e){return e==null}function dt(e,t){let n=t(e.length*1,1)>>>0;return B().set(e,n/1),q=e.length,n}function H(e,t,n){if(n===void 0){let n=K.encode(e),r=t(n.length,1)>>>0;return B().subarray(r,r+n.length).set(n),q=n.length,r}let r=e.length,i=t(r,1)>>>0,a=B(),o=0;for(;o<r;o++){let t=e.charCodeAt(o);if(t>127)break;a[i+o]=t}if(o!==r){o!==0&&(e=e.slice(o)),i=n(i,r,r=o+e.length*3,1)>>>0;let t=B().subarray(i+o,i+r),a=K.encodeInto(e,t);o+=a.written,i=n(i,r,o,1)>>>0}return q=o,i}function U(e){let t=J.__wbindgen_externrefs.get(e);return J.__externref_table_dealloc(e),t}let W=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0});W.decode();let G=0;function ft(e,t){return G+=t,G>=2146435072&&(W=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0}),W.decode(),G=t),W.decode(B().subarray(e,e+t))}const K=new TextEncoder;`encodeInto`in K||(K.encodeInto=function(e,t){let n=K.encode(e);return t.set(n),{read:e.length,written:n.length}});let q=0,J;function pt(e,t){return J=e.exports,L=null,z=null,J.__wbindgen_start(),J}async function mt(e,t){if(typeof Response==`function`&&e instanceof Response){if(typeof WebAssembly.instantiateStreaming==`function`)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if(e.ok&&n(e.type)&&e.headers.get(`Content-Type`)!==`application/wasm`)console.warn(\"`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\\n\",t);else throw t}let r=await e.arrayBuffer();return await WebAssembly.instantiate(r,t)}else{let n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}function n(e){switch(e){case`basic`:case`cors`:case`default`:return!0}return!1}}async function ht(e){if(J!==void 0)return J;e!==void 0&&(Object.getPrototypeOf(e)===Object.prototype?{module_or_path:e}=e:console.warn(`using deprecated parameters for the initialization function; pass a single object instead`));let t=ct();(typeof e==`string`||typeof Request==`function`&&e instanceof Request||typeof URL==`function`&&e instanceof URL)&&(e=fetch(e));let{instance:n,module:r}=await mt(await e,t);return pt(n,r)}async function gt(e){return J=void 0,L=null,z=null,ht(e)}const Y=new pe(ht,{freeArchive:e=>e.free(),reinit:gt});let X=null,Z=`empty`;function _t(){if(Z!==`empty`){let e=Error(`this PPTX worker already owns a presentation parse`);throw e.name=`PptxWorkerStateError`,Object.assign(e,{code:`ooxml-pptx-parse-already-started`})}Z=`opening`}const Q=new at(()=>Y.archive,(e,t,n)=>{if(X){if(e!==X.acceptedSlideCount)throw Error(`PPTX preflight expected slide ${X.acceptedSlideCount}, received ${e}`);return X.prepareSlide(t,n)}},e=>{let t=Y.archive;if(!t)throw Error(`Presentation not loaded`);return Y.run(()=>e(t))}),$=(e,t)=>self.postMessage(e,t);self.onmessage=async e=>{let t=e.data;if(ot(t)){await Q.dispatchSafely(t,$);return}if(t.kind===`init`){Y.setWasmInput(se(t.wasmUrl)??t.wasmUrl);return}let n=t.id,r=!1;try{if(t.kind===`openSlideSession`&&Q.reserveOpen(t),t.kind===`parse`&&(_t(),r=!0),t.kind===`openSlideSession`){await Y.ensureReady(),await Q.open(t.slideIndex,t),await Q.postOpenedSafely(t,()=>$({kind:`slideSessionOpened`,id:n,sessionId:t.sessionId,operationId:t.operationId,generation:t.generation}),e=>$({kind:`error`,id:n,...w(e)}));return}t.kind===`parse`&&await Q.reset(),await Q.run(async()=>{if(await Y.ensureReady(),t.kind!==`parse`&&Y.archive){let e=Y.archive;Y.run(()=>e.assert_healthy())}if(t.kind===`parse`){X=null;let[e,r,i]=Le(t.resourcePolicy),a=Y.run(()=>{let n=new F(new Uint8Array(t.buffer),e,r,i);return Y.setArchive(n),JSON.parse(new TextDecoder().decode(n.presentation_bootstrap()))});X=t.progressiveLayout?null:new nt(a),$({kind:`presentationOpened`,id:n,bootstrap:a}),Z=`ready`;return}let e=Y.archive;if(!e)throw Error(`No pptx loaded`);if(t.kind===`finishPresentationPreflight`){if(!X)throw Error(`PPTX presentation preflight is not active`);let e=X.finish();X=null,$({kind:`presentationPreflightReady`,id:n,preflight:e});return}if(t.kind===`extractMedia`){let r=Y.run(()=>e.extract_media(t.path).buffer);$({kind:`mediaExtracted`,id:n,bytes:r},[r]);return}if(t.kind===`extractImage`){let r=Y.run(()=>e.extract_image(t.path).buffer);$({kind:`imageExtracted`,id:n,bytes:r},[r]);return}if(t.kind===`extractFont`){let r=Y.run(()=>e.extract_font(t.path).buffer);$({kind:`fontExtracted`,id:n,bytes:r},[r]);return}if(t.kind===`resourceUsage`){$({kind:`resourceUsage`,id:n,usage:ye(Y.run(()=>e.resource_usage()))});return}t.kind===`toMarkdown`&&$({kind:`markdownRendered`,id:n,markdown:Y.run(()=>e.to_markdown())})})}catch(e){r&&(Z=`failed`),t.kind===`openSlideSession`&&Q.abandonOpen(t.sessionId);try{$({kind:`error`,id:n,...w(e)})}catch{}}};", Ct = typeof self < "u" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", St], { type: "text/javascript;charset=utf-8" });
function wt(e) {
	let t;
	try {
		if (t = Ct && (self.URL || self.webkitURL).createObjectURL(Ct), !t) throw "";
		let n = new Worker(t, {
			type: "module",
			name: e?.name
		});
		return n.addEventListener("error", () => {
			(self.URL || self.webkitURL).revokeObjectURL(t);
		}), n;
	} catch {
		return new Worker("data:text/javascript;charset=utf-8," + encodeURIComponent(St), {
			type: "module",
			name: e?.name
		});
	}
}
//#endregion
//#region packages/pptx/src/wasm/pptx_parser_bg.wasm?url
var Tt = new URL("pptx_parser_bg.wasm", import.meta.url).href, G = 65536, Et = 16384, Dt = new Set(["line", "straightconnector1"]);
function Ot(e, t) {
	let n = e.x + e.width / 2, r = e.y + e.height / 2, i = -e.rotation * Math.PI / 180, a = Math.cos(i), o = Math.sin(i), s = t.x - n, c = t.y - r, l = n + a * s - o * c, u = r + o * s + a * c;
	return e.flipH && (l = 2 * n - l), e.flipV && (u = 2 * r - u), {
		x: l,
		y: u
	};
}
function kt(e, t, n) {
	let r = n.x - t.x, i = n.y - t.y, a = r * r + i * i;
	if (a === 0) return Math.hypot(e.x - t.x, e.y - t.y);
	let o = Math.max(0, Math.min(1, ((e.x - t.x) * r + (e.y - t.y) * i) / a));
	return Math.hypot(e.x - (t.x + o * r), e.y - (t.y + o * i));
}
function At(e, t, n = 0) {
	if (!Number.isFinite(t.x) || !Number.isFinite(t.y)) return !1;
	let r = Ot(e, t), i = Number.isFinite(n) && n > 0 ? n : 0;
	if (e.type === "shape" && (Dt.has(e.geometry.toLowerCase()) || e.width === 0 || e.height === 0)) return kt(r, {
		x: e.x,
		y: e.y
	}, {
		x: e.x + e.width,
		y: e.y + e.height
	}) <= i;
	let a = Math.min(e.x, e.x + e.width), o = Math.max(e.x, e.x + e.width), s = Math.min(e.y, e.y + e.height), c = Math.max(e.y, e.y + e.height);
	return r.x >= a && r.x <= o && r.y >= s && r.y <= c;
}
function* jt(e) {
	if (e) for (let t of e.paragraphs) {
		let e = !0;
		for (let n of t.runs) {
			let t = n.type === "text" ? n.text : n.type === "break" ? "\n" : "[equation]";
			t && (yield {
				text: t,
				beginsPart: e
			}, e = !1);
		}
	}
}
function* Mt(e) {
	if (e.type === "shape") {
		yield* jt(e.textBody);
		return;
	}
	if (e.type === "table") {
		for (let t of e.rows) for (let e of t.cells) yield* jt(e.textBody);
		return;
	}
}
function Nt(e, t) {
	let n = Math.min(e.length, t);
	if (n > 0 && n < e.length) {
		let t = e.charCodeAt(n - 1), r = e.charCodeAt(n);
		t >= 55296 && t <= 56319 && r >= 56320 && r <= 57343 && n--;
	}
	return e.slice(0, n);
}
function Pt(e, t = Et) {
	if (!Number.isFinite(t) || t < 0) throw RangeError("maxTextCharacters must be a finite non-negative number.");
	let n = Math.min(G, Math.floor(t)), r = e.text, i = r === void 0 ? void 0 : Nt(r, n), a = r !== void 0 && i.length < r.length;
	return {
		...structuredClone(e),
		...i === void 0 ? {} : { text: i },
		truncated: e.truncated || a,
		truncationReasons: e.truncated || a ? ["text"] : [],
		textCharacters: i?.length ?? 0,
		maxTextCharacters: n
	};
}
function Ft(e, t) {
	let n = [], r = 0, i = !1, a = !1;
	for (let o of e) {
		if (a = !0, o.beginsPart && n.length > 0) {
			if (r >= t) {
				i = !0;
				break;
			}
			n.push("\n"), r++;
		}
		let e = Math.max(0, t - r), s = Nt(o.text, e);
		if (n.push(s), r += s.length, s.length < o.text.length) {
			i = !0;
			break;
		}
	}
	return a ? {
		text: n.join(""),
		truncated: i,
		textCharacters: r
	} : {
		truncated: !1,
		textCharacters: 0
	};
}
function It(e, t, n, r = {}) {
	if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) throw RangeError("PPTX hit-test point must contain finite coordinates.");
	let i = r.maxTextCharacters ?? Et;
	if (!Number.isFinite(i) || i < 0) throw RangeError("maxTextCharacters must be a finite non-negative number.");
	let a = Math.min(G, Math.floor(i)), o = r.tolerance ?? 0;
	if (!Number.isFinite(o) || o < 0) throw RangeError("tolerance must be a finite non-negative number.");
	for (let r = t.elements.length - 1; r >= 0; r--) {
		let i = t.elements[r];
		if (!At(i, n, o)) continue;
		let s = i.type === "chart" ? ue(i.chart, a) : Ft(Mt(i), a);
		return {
			format: "pptx",
			kind: "element",
			slideIndex: e,
			elementIndex: r,
			origin: t.elementSources?.[r]?.origin ?? "unknown",
			elementType: i.type,
			point: { ...n },
			bounds: {
				x: i.x,
				y: i.y,
				width: i.width,
				height: i.height,
				rotation: i.rotation,
				flipH: i.flipH,
				flipV: i.flipV
			},
			...i.type === "shape" ? {
				...i.id === void 0 ? {} : { shapeId: i.id },
				...i.name === void 0 ? {} : { name: i.name },
				geometry: i.geometry
			} : {},
			...s.text === void 0 ? {} : { text: s.text },
			...i.type === "picture" ? { mimeType: i.mimeType } : {},
			...i.type === "media" ? {
				mimeType: i.mimeType,
				mediaKind: i.mediaKind
			} : {},
			...i.type === "table" ? {
				rowCount: i.rows.length,
				columnCount: i.cols.length
			} : {},
			...i.type === "chart" ? { seriesCount: i.chart.series.length } : {},
			truncated: s.truncated,
			truncationReasons: s.truncated ? ["text"] : [],
			textCharacters: s.textCharacters,
			maxTextCharacters: a
		};
	}
	return null;
}
function Lt(e, t) {
	let n = new Set(t.filter((e) => e.length > 0));
	if (n.size === 0) return Object.freeze([]);
	let r = /* @__PURE__ */ new Map();
	for (let [t, i] of e.elements.entries()) {
		let a = i.id;
		if (!a || !n.has(a)) continue;
		let o = e.elementSources?.[t]?.origin ?? "unknown", s = o === "slide" ? 3 : o === "layout" ? 2 : +(o === "master"), c = r.get(a), l = c?.origin === "slide" ? 3 : c?.origin === "layout" ? 2 : +(c?.origin === "master");
		c && l > s || r.set(a, Object.freeze({
			elementId: a,
			elementIndex: t,
			origin: o,
			elementType: i.type,
			bounds: Object.freeze({
				x: i.x,
				y: i.y,
				width: i.width,
				height: i.height,
				rotation: i.rotation,
				flipH: i.flipH,
				flipV: i.flipV
			})
		}));
	}
	return Object.freeze(t.flatMap((e) => {
		let t = r.get(e);
		return t ? [t] : [];
	}));
}
//#endregion
//#region packages/pptx/src/presentation-layout-events.ts
var K = /* @__PURE__ */ new WeakMap();
function q(e, t) {
	let n = Object.freeze({ ...t });
	for (let t of [...K.get(e) ?? []]) try {
		t.notify(n);
	} catch (e) {
		try {
			t.report(e);
		} catch {}
	}
}
function Rt(e, t, n, r) {
	let i = K.get(e);
	i || (i = /* @__PURE__ */ new Set(), K.set(e, i));
	let a = Object.freeze({
		notify: n,
		report: r
	});
	i.add(a);
	try {
		n(Object.freeze({ ...t() }));
	} catch (e) {
		try {
			r(e);
		} catch {}
	}
	return () => {
		i?.delete(a), i?.size === 0 && K.delete(e);
	};
}
//#endregion
//#region packages/pptx/src/worker-task-scheduler.ts
function zt() {
	return new Promise((e) => {
		let t = new MessageChannel();
		t.port1.onmessage = () => {
			t.port1.close(), t.port2.close(), e();
		}, t.port2.postMessage(void 0);
	});
}
//#endregion
//#region packages/pptx/src/presentation.ts
function Bt() {
	let e, t;
	return {
		promise: new Promise((n, r) => {
			e = n, t = r;
		}),
		resolve: e,
		reject: t
	};
}
var J = class e {
	_metrics = null;
	_worker;
	_bridge;
	_mode = "main";
	_bootstrap = null;
	_preflight = null;
	_availableSlideCount = 0;
	_layoutLifecycle = new ke();
	_layoutObservers = new je();
	_layoutCompletion = null;
	_parseRequestId = null;
	_progressive = null;
	_progressiveWatchdog;
	_progressiveWatchdogMs;
	_layoutWaiters = /* @__PURE__ */ new Set();
	_slides = null;
	_slidePullClient = null;
	_resourceFailure = null;
	_slidePartIndex = null;
	_rawParts = new De({
		maxEntries: 64,
		maxBytes: v
	});
	_googleFontFaces = [];
	_embeddedFontFaces = [];
	_embeddedFontAliases = /* @__PURE__ */ new Map();
	_embeddedFontAuthoredFamilies = /* @__PURE__ */ new Map();
	_destroyed = !1;
	_fetchImage = (e, t) => this.getImage(e, t);
	_fetchMedia = (e) => this.getMedia(e);
	_math;
	_threeD;
	_regionMap;
	_chartEx;
	_tiff;
	constructor(e, t, n) {
		this._worker = e, this._mode = t, this._bridge = new Se(this._worker, {
			correlate: (e) => "protocol" in e && e.protocol === "ooxml-pull-v1" ? e.requestId : "id" in e ? e.id : void 0,
			toError: (e) => !("protocol" in e) && e.kind === "error" ? _(e) : void 0,
			onUnsolicited: (e) => this._onWorkerLayoutPush(e)
		});
		let r = new URL(n ?? Tt, location.href).href;
		this._bridge.post({
			kind: "init",
			wasmUrl: r
		});
	}
	_assertResourceHealthy() {
		if (this._resourceFailure) throw this._resourceFailure;
	}
	_rethrowWithResourceFailure(e) {
		let t = e instanceof b ? e : m(e);
		throw t ? (this._resourceFailure ??= t, this._resourceFailure) : e;
	}
	static async load(t, r = {}) {
		let i = p(r), a = r.mode ?? "main", o = new g({
			enabled: !0,
			format: "pptx",
			mode: a,
			policy: i.policy,
			onMetrics: i.onResourceMetrics,
			emitToConsole: i.debug
		});
		try {
			if (a === "worker" && (typeof Worker > "u" || typeof OffscreenCanvas > "u")) throw Error("mode: 'worker' requires Worker and OffscreenCanvas support");
			let s;
			if (typeof t == "string") {
				let e = await fetch(t);
				if (!e.ok) throw Error(`Failed to fetch: ${e.status} ${e.statusText}`);
				s = await e.arrayBuffer();
			} else s = t;
			s = ie(await ae(s, r.password)), o.setSourceBytes(s.byteLength), o.checkpoint("container ready");
			let c = a === "worker" ? (await import("./render-worker-host-CXTCU4PO.js")).createRenderWorker() : new wt(), l = a === "worker" ? Re(r) : void 0, u;
			try {
				u = new e(c, a, r.wasmUrl), u._metrics = o, r.math && a === "worker" && !l?.math && console.warn("[ooxml] a custom math renderer cannot cross the worker boundary; equations will be skipped in mode: 'worker'. Use the math renderer from @silurus/ooxml/math."), r.threeD && a === "worker" && !l?.threeD && console.warn("[ooxml] a custom 3-D chart renderer cannot cross the worker boundary; charts use their 2-D family fallback in mode: 'worker'. Use the renderer from @silurus/ooxml/three-d."), u._math = a === "worker" ? void 0 : r.math, u._threeD = a === "worker" ? void 0 : r.threeD, r.regionMap && a === "worker" && !l?.regionMap && console.warn("[ooxml] a custom Region Map renderer cannot cross the worker boundary; geospatial charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/region-map."), u._regionMap = a === "worker" ? void 0 : r.regionMap, r.chartEx && a === "worker" && !l?.chartEx && console.warn("[ooxml] a custom ChartEx renderer cannot cross the worker boundary; ChartEx charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/chart-ex."), u._chartEx = a === "worker" ? void 0 : r.chartEx, r.tiff && a === "worker" && !l?.tiff && console.warn("[ooxml] a custom TIFF codec cannot cross the worker boundary; recognized TIFF images will use an unavailable-image placeholder in mode: 'worker'. Use the codec from @silurus/ooxml/tiff to display them."), u._tiff = a === "worker" ? void 0 : r.tiff;
				let t = r.progressiveLayout ? {
					onProgress: r.onLayoutProgress,
					onPartial: r.onLayoutPartial,
					onComplete: r.onLayoutComplete,
					firstPublication: Bt(),
					published: !1,
					deferred: !1,
					settled: !1
				} : void 0;
				return await u._parse(s, i.policy, !!r.useGoogleFonts, r.workerTimeoutMs, (e) => o.observeUsage(e), l, t), o.checkpoint("presentation preflight ready"), a === "main" && r.useGoogleFonts && u._preflight && !t && (u._googleFontFaces = await k(xt(u._preflight.fontPreloadNames, u._embeddedFontAliases), n)), o.succeed({ slides: u.slideCount }), u;
			} catch (e) {
				let t = u;
				throw re(c, t ? () => t.destroy() : void 0), e;
			}
		} catch (e) {
			throw o.fail(e), e;
		}
	}
	async _parse(e, n, r = !1, i, a, o, l) {
		if (l) {
			this._progressive = l, this._mode === "worker" ? await this._parseWorkerProgressively(e, n, r, i, a, o, l) : await this._parseMainProgressively(e, n, r, i, a, l);
			return;
		}
		let u = await this._bridge.request((t) => this._mode === "worker" ? {
			kind: "parse",
			id: t,
			buffer: e,
			resourcePolicy: n,
			useGoogleFonts: r,
			renderers: o
		} : {
			kind: "parse",
			id: t,
			buffer: e,
			resourcePolicy: n
		}, [e], { timeoutMs: i });
		if (this._mode === "worker") {
			let e = u;
			e.usage && a?.(e.usage), this._preflight = c(u.preflight), this._bootstrap = this._preflight, this._availableSlideCount = this._preflight.slideCount;
			return;
		}
		let f = t(u.bootstrap);
		this._bootstrap = f;
		let p = bt(f.embeddedFonts, (e) => this.getFontBytes(e)).then((e) => {
			this._destroyed ? j(e.faces) : (this._embeddedFontFaces = e.faces, this._embeddedFontAliases = e.aliases, this._embeddedFontAuthoredFamilies = e.authoredFamilies);
		});
		this._slidePullClient = new d({
			slideCount: f.slideCount,
			transport: this._bridge.transport(s),
			open: async (e, t, n) => {
				await this._bridge.request((n) => ({
					kind: "openSlideSession",
					id: n,
					slideIndex: e,
					...t
				}), void 0, { timeoutMs: n });
			},
			onUsage: a
		});
		let m;
		try {
			for (let e = 0; e < f.slideCount; e += 1) await this._slidePullClient.load(e, !1, i);
			m = await this._bridge.request((e) => ({
				kind: "finishPresentationPreflight",
				id: e
			}), void 0, { timeoutMs: i }), await p;
		} catch (e) {
			throw p.catch(() => void 0), e;
		}
		this._preflight = c(m.preflight), this._availableSlideCount = this._preflight.slideCount, this._slides = new _t({
			slideCount: this._preflight.slideCount,
			maxCachedSlides: 8,
			maxCachedStructuralBytes: h,
			loadSlide: async (e) => {
				let t = await this._slidePullClient?.load(e, !0, i);
				if (!t) throw Error("PPTX slide pull client is unavailable");
				return t;
			}
		});
	}
	async _parseMainProgressively(e, r, i, a, o, s) {
		let c = t((await this._bridge.request((t) => ({
			kind: "parse",
			id: t,
			buffer: e,
			resourcePolicy: r,
			progressiveLayout: !0
		}), [e], { timeoutMs: a })).bootstrap);
		this._bootstrap = c;
		let u = bt(c.embeddedFonts, (e) => this.getFontBytes(e)).then((e) => {
			this._destroyed ? j(e.faces) : (this._embeddedFontFaces = e.faces, this._embeddedFontAliases = e.aliases, this._embeddedFontAuthoredFamilies = e.authoredFamilies);
		});
		this._slidePullClient = this._createSlidePullClient(c.slideCount, a, o), this._slides = new _t({
			slideCount: c.slideCount,
			maxCachedSlides: 8,
			maxCachedStructuralBytes: h,
			loadSlide: async (e) => {
				let t = await this._slidePullClient?.load(e, !0, a);
				if (!t) throw Error("PPTX slide pull client is unavailable");
				return t;
			}
		});
		let d = new l(c), f = /* @__PURE__ */ new Set(), p = async () => {
			if (await u, !i) return;
			let e = xt(d.currentFontPreloadNames, this._embeddedFontAliases).filter((e) => !!e && !f.has(e));
			if (e.length !== 0) {
				for (let t of e) f.add(t);
				this._googleFontFaces.push(...await k(e, n));
			}
		};
		this._layoutCompletion = (async () => {
			for (let e = 0; e < c.slideCount; e += 1) await this._slides.withSlide(e, (e) => {
				d.addSlide(e);
			}), await p(), this._applyProgressivePrefix(d.snapshot(), s), e === 0 && s.deferred && await zt();
			await u, this._finishProgressiveLayout(d.finish(), s);
		})().then(() => void 0, (e) => this._failProgressiveLayout(e, s)), await s.firstPublication.promise;
	}
	async _parseWorkerProgressively(e, t, n, r, i, a, o) {
		this._progressiveWatchdogMs = r;
		let s = this._bridge.request((r) => (this._parseRequestId = r, {
			kind: "parse",
			id: r,
			buffer: e,
			resourcePolicy: t,
			useGoogleFonts: n,
			renderers: a,
			progressiveLayout: !0
		}), [e], { timeoutMs: !1 });
		this._rearmProgressiveWatchdog(), this._layoutCompletion = s.then((e) => {
			this._parseRequestId = null;
			let t = e;
			t.usage && i?.(t.usage), this._finishProgressiveLayout(c(t.preflight), o);
		}, (e) => {
			this._parseRequestId = null, this._failProgressiveLayout(e, o);
		}), await o.firstPublication.promise;
	}
	_createSlidePullClient(e, t, n) {
		return new d({
			slideCount: e,
			transport: this._bridge.transport(s),
			open: async (e, n, r) => {
				await this._bridge.request((t) => ({
					kind: "openSlideSession",
					id: t,
					slideIndex: e,
					...n
				}), void 0, { timeoutMs: r ?? t });
			},
			onUsage: n
		});
	}
	_onWorkerLayoutPush(e) {
		if (!oe((e, t) => this._worker.postMessage(e, t), e) && !(!("kind" in e) || e.kind !== "presentationLayoutPartial" || e.forId !== this._parseRequestId || !this._progressive)) try {
			this._rearmProgressiveWatchdog(), e.usage && this._metrics?.observeUsage(e.usage), e.bootstrap && (this._bootstrap = t(e.bootstrap));
			let n = this._bootstrap;
			if (!n) throw Error("PPTX progressive worker published before bootstrap");
			let r = this._preflight?.slides ?? [];
			if (e.availableSlides !== r.length + 1 || e.slide.index !== r.length) throw Error("PPTX progressive worker published a non-sequential slide");
			this._applyProgressivePrefix(u({
				...n,
				slides: [...r, e.slide],
				fontPreloadNames: e.fontPreloadNames
			}), this._progressive), zt().then(() => {
				this._destroyed || this._parseRequestId !== e.forId || this._bridge.post({
					kind: "continuePresentationPreflight",
					forId: e.forId,
					availableSlides: e.availableSlides
				});
			}).catch((t) => {
				this._destroyed || this._parseRequestId !== e.forId || !this._progressive || (this._failProgressiveLayout(t, this._progressive), this._bridge.terminate());
			});
		} catch (e) {
			this._failProgressiveLayout(e, this._progressive), this._bridge.terminate();
		}
	}
	_applyProgressivePrefix(e, t) {
		if (!(t.settled || this._destroyed)) {
			if (this._preflight = e, this._availableSlideCount = e.slides.length, !t.published && e.slides.length === e.slideCount) {
				t.published = !0, t.deferred = !1;
				return;
			}
			if (this._layoutLifecycle.begin(), this._wakeLayoutWaiters(), this._layoutObservers.notify("onLayoutProgress", t.onProgress, { committedUnits: this._availableSlideCount }), q(this, {
				availableSlides: this._availableSlideCount,
				slideCount: this.slideCount,
				exact: !1,
				complete: !1
			}), !t.published) {
				t.published = !0, t.deferred = e.slides.length < e.slideCount, t.firstPublication.resolve();
				return;
			}
			this._layoutObservers.notify("onLayoutPartial", t.onPartial, {
				availableUnits: this._availableSlideCount,
				totalUnits: this.slideCount,
				exact: !1
			});
		}
	}
	_finishProgressiveLayout(e, t) {
		t.settled || this._destroyed || (t.settled = !0, this._clearProgressiveWatchdog(), this._preflight = e, this._bootstrap ??= e, this._availableSlideCount = e.slideCount, this._layoutLifecycle.succeed(), this._wakeLayoutWaiters(), t.firstPublication.resolve(), q(this, {
			availableSlides: this._availableSlideCount,
			slideCount: this.slideCount,
			exact: !0,
			complete: !0
		}), t.deferred && this._layoutObservers.notify("onLayoutComplete", t.onComplete));
	}
	_failProgressiveLayout(e, t) {
		if (t.settled || (t.settled = !0, this._clearProgressiveWatchdog(), this._destroyed)) return;
		if (!t.published) {
			t.firstPublication.reject(e);
			return;
		}
		let n = this._layoutLifecycle.fail(e);
		this._wakeLayoutWaiters(), q(this, {
			availableSlides: this._availableSlideCount,
			slideCount: this.slideCount,
			exact: !1,
			complete: !1,
			error: n
		}), this._layoutObservers.notify("onLayoutComplete", t.onComplete, n);
	}
	_wakeLayoutWaiters() {
		for (let e of this._layoutWaiters) e();
		this._layoutWaiters.clear();
	}
	_rearmProgressiveWatchdog() {
		this._progressiveWatchdogMs !== void 0 && (clearTimeout(this._progressiveWatchdog), this._progressiveWatchdog = setTimeout(() => {
			let e = this._progressive, t = this._progressiveWatchdogMs;
			if (!e || e.settled || t === void 0 || this._destroyed) return;
			let n = /* @__PURE__ */ Error(`worker layout produced no progress for ${t}ms`);
			this._failProgressiveLayout(n, e), this._bridge.terminate();
		}, this._progressiveWatchdogMs));
	}
	_clearProgressiveWatchdog() {
		clearTimeout(this._progressiveWatchdog), this._progressiveWatchdog = void 0, this._progressiveWatchdogMs = void 0;
	}
	async _waitForSlide(e) {
		for (; !this._destroyed && e >= this._availableSlideCount && !this._layoutLifecycle.settled;) await new Promise((e) => this._layoutWaiters.add(e));
		e >= this._availableSlideCount && await this.waitUntilLayoutComplete();
	}
	_assertSlideIndex(e) {
		if (!Number.isInteger(e) || e < 0 || e >= this.slideCount) throw Error(`Slide index ${e} out of range (count: ${this.slideCount})`);
	}
	get slideCount() {
		return this._bootstrap?.slideCount ?? this._preflight?.slideCount ?? 0;
	}
	get availableSlideCount() {
		return this._availableSlideCount;
	}
	get layoutComplete() {
		return this._layoutLifecycle.complete;
	}
	async waitUntilLayoutComplete() {
		this._layoutCompletion && await this._layoutCompletion, this._layoutLifecycle.throwIfFailed();
	}
	get slideWidth() {
		return this._bootstrap?.slideWidth ?? this._preflight?.slideWidth ?? 0;
	}
	get slideHeight() {
		return this._bootstrap?.slideHeight ?? this._preflight?.slideHeight ?? 0;
	}
	get mode() {
		return this._mode;
	}
	getNotes(e) {
		return Number.isInteger(e) ? this._preflight?.slides[e]?.notes ?? null : null;
	}
	getComments(e) {
		return Number.isInteger(e) ? this._preflight?.slides[e]?.comments ?? [] : [];
	}
	isHidden(e) {
		return Number.isInteger(e) ? this._preflight?.slides[e]?.hidden ?? !1 : !1;
	}
	_partNames() {
		return (this._bootstrap?.slides ?? this._preflight?.slides ?? []).map((e) => e.partName);
	}
	_partIndex() {
		return this._slidePartIndex ||= mt(this._partNames()), this._slidePartIndex;
	}
	getSlideIndexByPartName(e) {
		return this._partIndex().get(e);
	}
	resolveInternalTarget(e, t = 0) {
		return gt(e, this._partIndex(), t);
	}
	async renderSlide(e, t, n = {}) {
		this._assertResourceHealthy();
		try {
			if (this._mode === "worker") throw Error("renderSlide(canvas) is unavailable in mode: 'worker'; use renderSlideToBitmap() and paint it via an ImageBitmapRenderingContext");
			this._assertSlideIndex(t), await this._waitForSlide(t);
			let i = this._preflight, a = this._slides;
			if (!i || !a) throw Error("Presentation not loaded");
			let o = n.dpr ?? x(), s = n.width ?? ((w(e) ? e.offsetWidth : 0) || 960);
			await a.withSlide(t, (t) => (this._assertResourceHealthy(), r(e, t, i.slideWidth, i.slideHeight, {
				width: s,
				dpr: o,
				defaultTextColor: i.defaultTextColor,
				majorFont: i.majorFont,
				minorFont: i.minorFont,
				hlinkColor: i.hlinkColor,
				embeddedFontAliases: this._embeddedFontAliases,
				embeddedFontAuthoredFamilies: this._embeddedFontAuthoredFamilies,
				fetchMedia: this._fetchMedia,
				fetchImage: this._fetchImage,
				skipMediaControls: n.skipMediaControls,
				dim: n.dim,
				math: this._math,
				threeD: this._threeD,
				regionMap: this._regionMap,
				chartEx: this._chartEx,
				tiff: this._tiff,
				imageResources: n.imageResources
			}, n.onTextRun)));
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async renderSlideToBitmap(e, t = {}) {
		this._assertResourceHealthy();
		try {
			this._assertSlideIndex(e), await this._waitForSlide(e);
			let n = t.width ?? 960, r = t.dpr ?? x();
			if (this._mode === "worker") {
				let i = await this._bridge.request((i) => ({
					kind: "renderSlide",
					id: i,
					slideIndex: e,
					width: n,
					dpr: r,
					imageResources: t.imageResources,
					skipMediaControls: t.skipMediaControls,
					dim: t.dim
				}));
				try {
					if (t.onTextRun) for (let e of i.runs) t.onTextRun(e);
				} catch (e) {
					throw te(i.bitmap), e;
				}
				return i.bitmap;
			}
			let i = new OffscreenCanvas(1, 1);
			return await this.renderSlide(i, e, {
				width: n,
				dpr: r,
				imageResources: t.imageResources,
				skipMediaControls: t.skipMediaControls,
				dim: t.dim,
				onTextRun: t.onTextRun
			}), i.transferToImageBitmap();
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async collectSlideRuns(e, t = 960) {
		this._assertResourceHealthy();
		try {
			if (this._assertSlideIndex(e), await this._waitForSlide(e), this._mode === "worker") return (await this._bridge.request((n) => ({
				kind: "collectRuns",
				id: n,
				slideIndex: e,
				width: t
			}))).runs;
			let n = [], r = new OffscreenCanvas(1, 1);
			return await this.renderSlide(r, e, {
				width: t,
				onTextRun: (e) => n.push(e)
			}), n;
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getElementContextAt(e, t, n = {}) {
		this._assertResourceHealthy(), this._assertSlideIndex(e);
		try {
			if (await this._waitForSlide(e), this._mode === "worker") return (await this._bridge.request((r) => ({
				kind: "hitTestElement",
				id: r,
				slideIndex: e,
				point: t,
				options: n
			}))).context;
			if (!this._slides) throw Error("Presentation not loaded");
			return await this._slides.withSlide(e, (r) => It(e, r, t, n));
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getElementBoundsByIds(e, t) {
		this._assertResourceHealthy(), this._assertSlideIndex(e);
		let n = Object.freeze(t.filter((e) => typeof e == "string" && e.length > 0));
		if (n.length === 0) return Object.freeze([]);
		try {
			if (await this._waitForSlide(e), this._mode === "worker") return (await this._bridge.request((t) => ({
				kind: "resolveElementBounds",
				id: t,
				slideIndex: e,
				elementIds: n
			}))).bounds;
			if (!this._slides) throw Error("Presentation not loaded");
			return await this._slides.withSlide(e, (e) => Lt(e, n));
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getMedia(e) {
		this._assertResourceHealthy();
		try {
			let t = this._findMimeTypeForPath(e);
			return await this._rawParts.get(e, t, async () => {
				let n = (await this._bridge.request((t) => ({
					kind: "extractMedia",
					id: t,
					path: e
				}))).bytes;
				return new Blob([n], { type: t });
			});
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	_findMimeTypeForPath(e) {
		return this._preflight ? a(this._preflight, e) : "";
	}
	async getImage(e, t) {
		this._assertResourceHealthy();
		try {
			return await this._rawParts.get(e, t, async () => {
				let n = (await this._bridge.request((t) => ({
					kind: "extractImage",
					id: t,
					path: e
				}))).bytes;
				return new Blob([n], { type: t });
			});
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getFontBytes(e) {
		this._assertResourceHealthy();
		try {
			let t = await this._bridge.request((t) => ({
				kind: "extractFont",
				id: t,
				path: e
			}));
			return new Uint8Array(t.bytes);
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getResourceMetrics() {
		let e = this._metrics;
		if (!e) throw Error("Presentation not loaded");
		return ne(e, async (e) => (await this._bridge.request((e) => ({
			kind: "resourceUsage",
			id: e
		}), void 0, { timeoutMs: e })).usage);
	}
	async toMarkdown() {
		this._assertResourceHealthy();
		try {
			return (await this._bridge.request((e) => ({
				kind: "toMarkdown",
				id: e
			}))).markdown;
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async presentSlide(e, t, n = {}) {
		this._assertResourceHealthy();
		try {
			if (this._assertSlideIndex(t), await this._waitForSlide(t), !this._preflight) throw Error("Presentation not loaded");
			let r = n.dpr ?? x(), i = n.width ?? (e.offsetWidth || 960), a = this.slideWidth > 0 ? i * this.slideHeight / this.slideWidth : 0;
			e.style.width = `${Math.round(i)}px`, e.style.height = `${Math.round(a)}px`, e.style.display || (e.style.display = "block");
			let o = this._mode === "worker" ? async () => {
				let a = await this.renderSlideToBitmap(t, {
					width: i,
					dpr: r,
					imageResources: n.imageResources,
					skipMediaControls: !0,
					dim: n.dim,
					onTextRun: n.onTextRun
				});
				try {
					e.width = a.width, e.height = a.height;
					let t = e.getContext("2d");
					if (!t) throw Error("2D context not available");
					t.drawImage(a, 0, 0);
				} finally {
					te(a);
				}
			} : () => this.renderSlide(e, t, {
				width: i,
				dpr: r,
				imageResources: n.imageResources,
				skipMediaControls: !0,
				dim: n.dim,
				onTextRun: n.onTextRun
			});
			return await $e(e, this._preflight.slides[t]?.mediaElements ?? [], {
				width: i,
				height: a,
				slideWidthEmu: this.slideWidth,
				fetchMedia: this._fetchMedia,
				fetchImage: this._fetchImage,
				drawBase: o,
				onError: n.onError
			});
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	destroy() {
		this._destroyed = !0, this._clearProgressiveWatchdog(), this._slidePullClient?.cancelAll(), this._bridge.terminate(), this._slides?.clear(), this._slides = null, this._slidePullClient = null, this._bootstrap = null, this._preflight = null, this._availableSlideCount = 0, this._layoutLifecycle.succeed(), this._layoutCompletion = null, this._progressive = null, this._parseRequestId = null, this._wakeLayoutWaiters(), this._resourceFailure = null, this._slidePartIndex = null, this._rawParts.clear(), this._googleFontFaces.length > 0 && (Te(this._googleFontFaces), this._googleFontFaces = []), this._embeddedFontFaces.length > 0 && (j(this._embeddedFontFaces), this._embeddedFontFaces = []), this._embeddedFontAliases = /* @__PURE__ */ new Map(), this._embeddedFontAuthoredFamilies = /* @__PURE__ */ new Map(), S(this._fetchImage), ee(this._fetchImage);
	}
};
//#endregion
//#region packages/pptx/src/selection-context.ts
function Vt(e, t, n, r, i = {}) {
	let a = Ae({
		id: e.id,
		author: e.author,
		date: e.date,
		text: e.text,
		status: e.status ?? "active"
	}, (e.replies ?? []).map((e) => ({
		id: e.id,
		author: e.author,
		date: e.date,
		text: e.text,
		status: e.status ?? "active"
	})), i.maxTextCharacters);
	return Object.freeze({
		format: "pptx",
		kind: "comment",
		slideIndex: t,
		commentIndex: n,
		occurrenceId: r,
		...e.id ? { commentId: e.id } : {},
		...Number.isFinite(e.x) && Number.isFinite(e.y) ? { point: Object.freeze({
			x: e.x,
			y: e.y
		}) } : {},
		thread: a.thread,
		truncated: a.truncated,
		truncationReasons: a.truncated ? ["text"] : [],
		textCharacters: a.textCharacters,
		maxTextCharacters: a.maxTextCharacters
	});
}
function Y(e) {
	if (e === void 0 || !/^\d+$/.test(e)) return null;
	let t = Number(e);
	return Number.isSafeInteger(t) ? t : null;
}
function Ht(e) {
	for (let t = e; t; t = t.parentElement) {
		let e = Y(t.dataset.slideIndex);
		if (e !== null) return e;
	}
	return null;
}
function X(e, t, n = {}) {
	let r = ye(e, t, (e) => {
		let t = Ht(e), n = Y(e.dataset.runIndex);
		if (t === null || n === null) return null;
		let r = Y(e.dataset.elementIndex), i = e.dataset.elementOrigin, a = r !== null && (i === "master" || i === "layout" || i === "slide");
		return {
			slideIndex: t,
			runIndex: n,
			...e.dataset.shapeId === void 0 ? {} : { shapeId: e.dataset.shapeId },
			...a ? {
				elementIndex: r,
				origin: i
			} : {}
		};
	}, {
		maxChars: n.maxTextCharacters,
		maxLocators: n.maxRunLocators
	});
	if (!r) return null;
	let i = [...r.locators].sort((e, t) => e.slideIndex - t.slideIndex || e.runIndex - t.runIndex);
	return {
		format: "pptx",
		kind: "text",
		text: r.text,
		slideIndexes: [...new Set(i.map((e) => e.slideIndex))],
		shapeIds: [...new Set(i.flatMap((e) => e.shapeId ? [e.shapeId] : []))],
		runs: i,
		truncated: r.truncated,
		truncationReasons: r.truncationReasons,
		textCharacters: r.textCharacters,
		maxTextCharacters: r.maxTextCharacters,
		maxRunLocators: r.maxLocators
	};
}
//#endregion
//#region packages/pptx/src/focused-view-runtime.ts
function Z(e, t, n, r, i) {
	return r === "worker" ? e.renderSlideToBitmap(n, i) : e.renderSlide(t, n, i);
}
//#endregion
//#region packages/pptx/src/viewer.ts
var Ut = Symbol("PptxViewer.borrowedPresentation"), Wt = {
	color: "#ffffff",
	opacity: .6
}, Gt = class e {
	canvas;
	wrapper;
	canvasMount;
	_scale = null;
	textLayer = null;
	highlightLayer = null;
	elementLayer = null;
	_find;
	_findGeneration = 0;
	_measureCtx = null;
	presentationOwner;
	get engine() {
		return this.presentationOwner.current;
	}
	borrowed;
	hostWindow;
	opts;
	currentSlide = 0;
	_renderedSlide = -1;
	_hiddenMode;
	handle = null;
	_mode;
	renderDispatcher;
	errorRouter;
	destroyed = !1;
	selectionChangeListener = null;
	selectionContextKey = "null";
	elementClickListener = null;
	contextMenuListener = null;
	elementContext = null;
	elementHitGeneration = 0;
	elementHitTolerance;
	_loadingLayer;
	_layoutUnsubscribe = null;
	_layoutWaiters = /* @__PURE__ */ new Set();
	_layoutFailed = !1;
	_navigationGeneration = 0;
	_renderProgressGeneration = 0;
	_lastReportedSlide = -1;
	_lastReportedTotal = -1;
	_lastReportedAvailable = -1;
	_lastReportedLayoutComplete = null;
	static fromPresentation(t, n, r = {}) {
		return new e(t, {
			...r,
			[Ut]: n
		});
	}
	constructor(e, t = {}) {
		this.opts = t, this.canvas = e;
		let n = t[Ut];
		this.borrowed = n !== void 0, this._mode = O("PptxViewer", t.mode, n), this.presentationOwner = new T("PptxViewer", n ?? null, !1);
		let r = e.ownerDocument?.defaultView ?? (typeof window < "u" ? window : null);
		if (!r) throw Error("PptxViewer requires a canvas with an active Window");
		this.hostWindow = r;
		let i = t.elementHitTolerance ?? 6;
		if (!Number.isFinite(i) || i < 0) throw RangeError("elementHitTolerance must be a finite non-negative number.");
		this.elementHitTolerance = i, this._hiddenMode = t.hiddenSlideMode ?? "show", this.canvasMount = new be(e, {
			wrapperCssText: "position:relative;display:inline-block;vertical-align:top;",
			forceDisplayBlock: !0
		}), this.wrapper = this.canvasMount.wrapper, this.renderDispatcher = new D(e, this._mode === "worker" && !t.enableMediaPlayback), this.errorRouter = new ve("PptxViewer", t.onError);
		let a = new he(this.wrapper, t.enableTextSelection === !0, t.enableElementSelection === !0);
		this.textLayer = a.textLayer, this.highlightLayer = a.highlightLayer, this.elementLayer = a.elementLayer, this._loadingLayer = this.wrapper.ownerDocument.createElement("span"), this._loadingLayer.style.cssText = [
			"position:absolute",
			"inset:0",
			"display:none",
			"align-items:center",
			"justify-content:center",
			"background:rgba(255,255,255,0.72)",
			"pointer-events:none",
			"z-index:4"
		].join(";"), this._loadingLayer.setAttribute("role", "status"), this._loadingLayer.setAttribute("aria-live", "polite"), this._loadingLayer.setAttribute("aria-label", "Loading slide");
		let o = this.wrapper.ownerDocument.createElement("progress");
		o.setAttribute("aria-hidden", "true"), this._loadingLayer.appendChild(o), this.wrapper.insertBefore(this._loadingLayer, this.elementLayer), this.textLayer && (t.onSelectionContextChange || t.enableElementSelection) && (this.selectionChangeListener = () => this._emitSelectionContextChange(), this.wrapper.ownerDocument.addEventListener("selectionchange", this.selectionChangeListener)), t.enableElementSelection && (this.elementClickListener = (e) => {
			this._onElementClick(e).catch((e) => this._reportRenderError(e));
		}, this.wrapper.addEventListener("click", this.elementClickListener)), t.onContextMenu && (this.contextMenuListener = (e) => this._onContextMenu(e), this.wrapper.addEventListener("contextmenu", this.contextMenuListener)), this._find = new Je(() => this.slideCount, (e) => this._collectSlideRuns(e)), n && this._bindLayoutPresentation(n);
	}
	async load(e) {
		if (this.destroyed) throw Error("PptxViewer is destroyed");
		if (this.borrowed) throw Error("PptxViewer.load() is unsupported on a Viewer created by fromPresentation(); the borrowed presentation is already loaded.");
		let t = !1;
		try {
			let n = await this.presentationOwner.replace(() => J.load(e, {
				password: this.opts.password,
				useGoogleFonts: this.opts.useGoogleFonts,
				maxZipEntryBytes: this.opts.maxZipEntryBytes,
				resourceLimits: this.opts.resourceLimits,
				debug: this.opts.debug,
				onResourceMetrics: this.opts.onResourceMetrics,
				workerTimeoutMs: this.opts.workerTimeoutMs,
				wasmUrl: this.opts.wasmUrl,
				math: this.opts.math,
				threeD: this.opts.threeD,
				regionMap: this.opts.regionMap,
				chartEx: this.opts.chartEx,
				tiff: this.opts.tiff,
				mode: this._mode,
				progressiveLayout: this.opts.progressiveLayout,
				onLayoutProgress: this.opts.onLayoutProgress,
				onLayoutPartial: this.opts.onLayoutPartial,
				onLayoutComplete: this.opts.onLayoutComplete
			}), () => {
				this._invalidateElementSelection(!1), t = !0, this.renderDispatcher.begin(), this._invalidateFind(), this.handle?.destroy(), this.handle = null, this._unbindLayoutPresentation();
			});
			if (!n) return;
			if (this.destroyed) throw Error("PptxViewer is destroyed");
			this._bindLayoutPresentation(n);
			let r = this._beginNavigation();
			if (this.currentSlide = await this._initialSlide(r), r !== this._navigationGeneration || n !== this.engine) return;
			this._renderedSlide = -1, this._invalidateFind(), await this.renderCurrentSlide();
		} catch (e) {
			throw this.destroyed ? Error("PptxViewer is destroyed") : e instanceof Error ? e : Error(String(e));
		}
		t && !this.destroyed && this._emitSelectionContextChange();
	}
	async goToSlide(e) {
		let t = this._beginNavigation();
		await this._goToSlide(e, t);
	}
	async _goToSlide(e, t) {
		if (t !== this._navigationGeneration || !this.engine || this.slideCount === 0) return;
		let n = Math.max(0, Math.min(e, this.slideCount - 1)), r = n !== this.currentSlide;
		r && this._invalidateElementSelection(!1), this.currentSlide = n, await this.renderCurrentSlide(), r && !this.destroyed && this._emitSelectionContextChange();
	}
	async nextSlide() {
		let e = this._beginNavigation(), t = await this._step(1, e);
		await this._goToSlide(t, e);
	}
	async prevSlide() {
		let e = this._beginNavigation(), t = await this._step(-1, e);
		await this._goToSlide(t, e);
	}
	async _step(e, t) {
		let n = this.engine, r = this.currentSlide;
		if (this._hiddenMode !== "skip" || !n) return r + e;
		for (let i = r + e; i >= 0 && i < this.slideCount; i += e) {
			if (i >= n.availableSlideCount && (n.layoutComplete || this._setLoading(!0), !await this._waitForSlide(n, i, () => t === this._navigationGeneration))) return r;
			if (!n.isHidden(i)) return i;
		}
		return r;
	}
	async _initialSlide(e) {
		let t = this.engine;
		if (this._hiddenMode !== "skip" || !t || this.slideCount === 0 || t.availableSlideCount === 0 && !await this._waitForSlide(t, 0, () => e === this._navigationGeneration) || !t.isHidden(0)) return 0;
		let n = await this._step(1, e);
		return n === 0 ? 0 : n;
	}
	_dim() {
		return {
			color: this.opts.hiddenSlideDim?.color ?? Wt.color,
			opacity: this.opts.hiddenSlideDim?.opacity ?? Wt.opacity
		};
	}
	async setHiddenSlideMode(e) {
		let t = this._beginNavigation();
		this._hiddenMode = e;
		let n = this.currentSlide;
		if (e === "skip" && this.engine) {
			let e = this.engine;
			if (this.currentSlide >= e.availableSlideCount && !await this._waitForSlide(e, this.currentSlide, () => t === this._navigationGeneration)) return;
			e.isHidden(this.currentSlide) && (n = await this._step(1, t), n === this.currentSlide && (n = await this._step(-1, t)));
		}
		if (t !== this._navigationGeneration) return;
		let r = n !== this.currentSlide;
		r && this._invalidateElementSelection(!1), this.currentSlide = n, await this.renderCurrentSlide(), r && !this.destroyed && this._emitSelectionContextChange();
	}
	get hiddenSlideMode() {
		return this._hiddenMode;
	}
	get visibleSlideCount() {
		if (!this.engine) return 0;
		let e = this.engine;
		return ze((t) => e.isHidden(t), this.slideCount);
	}
	get slideIndex() {
		return this.currentSlide;
	}
	get slideCount() {
		return this.engine?.slideCount ?? 0;
	}
	get availableSlideCount() {
		return this.engine?.availableSlideCount ?? this.slideCount;
	}
	get layoutComplete() {
		return this.engine?.layoutComplete ?? !0;
	}
	async waitUntilLayoutComplete() {
		await this.errorRouter.ownBackgroundLifecycle(async () => {
			await this.engine?.waitUntilLayoutComplete?.();
		});
	}
	getNotes(e) {
		return this.engine?.getNotes(e) ?? null;
	}
	get canvasElement() {
		return this.canvas;
	}
	_naturalWidthPx() {
		let e = this.engine?.slideWidth ?? 0;
		return e > 0 ? e / M : 0;
	}
	_targetWidth() {
		if (this._scale === null) return this.opts.width ?? (this.canvas.offsetWidth || 960);
		let e = this._naturalWidthPx();
		return e <= 0 ? this.opts.width ?? (this.canvas.offsetWidth || 960) : Math.round(e * this._scale);
	}
	getScale() {
		if (this._scale !== null) return this._scale;
		let e = this._naturalWidthPx();
		return e <= 0 ? 1 : this._targetWidth() / e;
	}
	_zoomMin() {
		return this.opts.zoomMin ?? .1;
	}
	_zoomMax() {
		return this.opts.zoomMax ?? 4;
	}
	async setScale(e) {
		let t = fe(e, this._zoomMin(), this._zoomMax()), n = t !== this.getScale();
		this._scale = t, await this.renderCurrentSlide(), n && this.opts.onScaleChange?.(t);
	}
	async zoomIn() {
		await this.setScale(xe(this.getScale()));
	}
	async zoomOut() {
		await this.setScale(we(this.getScale()));
	}
	async fitWidth() {
		await this._fit("width");
	}
	async fitPage() {
		await this._fit("page");
	}
	async _fit(e) {
		if (!this.engine) return;
		let t = this.wrapper.parentElement;
		if (!t) return;
		let n = ce({
			contentWidth: this.engine.slideWidth / M,
			contentHeight: this.engine.slideHeight / M,
			containerWidth: t.clientWidth,
			containerHeight: t.clientHeight
		}, e);
		n <= 0 || await this.setScale(n);
	}
	async renderCurrentSlide() {
		let e = this.engine;
		if (!e) return;
		let t = this.currentSlide, n = ++this._renderProgressGeneration;
		this._setLoading(t >= this.availableSlideCount && !this.layoutComplete);
		let r = this.renderDispatcher.begin();
		try {
			if (t >= e.availableSlideCount && !await this._waitForSlide(e, t, () => n === this._renderProgressGeneration && this.renderDispatcher.isCurrent(r) && e === this.engine && t === this.currentSlide)) return;
			let i = this._hiddenMode === "dim" && e.isHidden(t) ? this._dim() : void 0, a = this._targetWidth(), o = this.opts.dpr ?? (window.devicePixelRatio || 1), s = a / e.slideWidth, c = Math.round(e.slideHeight * s);
			this.canvas.style.width = `${a}px`, this.canvas.style.height = `${c}px`, this.handle?.destroy(), this.handle = null;
			let l = this._mode === "worker", u = [], d = (e) => u.push(e);
			if (this.opts.enableMediaPlayback) {
				let n = await e.presentSlide(this.canvas, t, {
					width: a,
					dpr: o,
					imageResources: this.opts.imageResources,
					dim: i,
					onTextRun: d,
					onError: (e) => {
						this.renderDispatcher.isCurrent(r) && this._reportRenderError(e);
					}
				});
				if (!this.renderDispatcher.isCurrent(r)) {
					n.destroy();
					return;
				}
				this.handle = n;
			} else if (l) {
				let e = await Z(this.engine, this.canvas, t, "worker", {
					width: a,
					dpr: o,
					imageResources: this.opts.imageResources,
					dim: i,
					onTextRun: d
				});
				if (!this.renderDispatcher.commitBitmap(r, e)) return;
			} else if (await Z(this.engine, this.canvas, t, "main", {
				width: a,
				dpr: o,
				imageResources: this.opts.imageResources,
				onTextRun: d,
				dim: i
			}), !this.renderDispatcher.isCurrent(r)) return;
			this._renderedSlide = t, this._emitSlideChange(!0), this.textLayer && this._buildTextLayer(this.textLayer, u, a, c), this._find.setSlideRuns(t, u), this._buildHighlightLayer(u, a, c);
		} catch (t) {
			if (!this.renderDispatcher.isCurrent(r) && !(e === this.engine && this._layoutFailed)) return;
			throw t;
		} finally {
			n === this._renderProgressGeneration && this._setLoading(!1);
		}
	}
	_bindLayoutPresentation(e) {
		this._unbindLayoutPresentation(), this._layoutFailed = !1;
		let t = !0;
		this._layoutUnsubscribe = Rt(e, () => ({
			availableSlides: e.availableSlideCount,
			slideCount: e.slideCount,
			exact: e.layoutComplete,
			complete: e.layoutComplete
		}), (n) => {
			if (t) {
				t = !1;
				return;
			}
			this._onLayoutPublication(e, n);
		}, (e) => this._reportRenderError(e));
	}
	_unbindLayoutPresentation() {
		this._layoutUnsubscribe?.(), this._layoutUnsubscribe = null, this._layoutFailed = !1, this._navigationGeneration++, this._renderProgressGeneration++, this._wakeLayoutWaiters(), this._setLoading(!1);
	}
	_beginNavigation() {
		let e = ++this._navigationGeneration;
		return this._wakeLayoutWaiters(), e;
	}
	_onLayoutPublication(e, t) {
		if (!(this.destroyed || e !== this.engine)) {
			if (this._wakeLayoutWaiters(), t.error !== void 0) {
				this._layoutFailed = !0, this.errorRouter.reportBackground(t.error, this.opts.onLayoutComplete !== void 0);
				return;
			}
			this._renderedSlide === this.currentSlide && this._emitSlideChange();
		}
	}
	async _waitForSlide(e, t, n) {
		return await this.errorRouter.ownBackgroundLifecycle(async () => {
			for (; !this.destroyed && n() && e === this.engine && t >= e.availableSlideCount && !e.layoutComplete && !this._layoutFailed;) await new Promise((e) => this._layoutWaiters.add(e));
			return this.destroyed || e !== this.engine || ((e.layoutComplete || this._layoutFailed) && await e.waitUntilLayoutComplete?.(), !n()) ? !1 : t < e.availableSlideCount;
		});
	}
	_wakeLayoutWaiters() {
		for (let e of this._layoutWaiters) e();
		this._layoutWaiters.clear();
	}
	_emitSlideChange(e = !1) {
		let t = this.slideCount, n = this.availableSlideCount, r = this.layoutComplete;
		!e && this.currentSlide === this._lastReportedSlide && t === this._lastReportedTotal && n === this._lastReportedAvailable && r === this._lastReportedLayoutComplete || (this._lastReportedSlide = this.currentSlide, this._lastReportedTotal = t, this._lastReportedAvailable = n, this._lastReportedLayoutComplete = r, this.opts.onSlideChange?.(this.currentSlide, t, r));
	}
	_setLoading(e) {
		this._loadingLayer.style.display = e ? "flex" : "none";
	}
	_buildHighlightLayer(e, t, n) {
		let r = this.highlightLayer;
		r && L(r, e, this._find.slideHighlights(this.currentSlide), t, n, (e) => this._measureForFont(e), this.opts.findHighlightColors);
	}
	_measureForFont(e) {
		this._measureCtx ||= document.createElement("canvas").getContext("2d");
		let t = this._measureCtx;
		return t ? (t.font = e, (e) => t.measureText(e).width) : (e) => e.length;
	}
	async _collectSlideRuns(e) {
		return this.engine ? this.engine.collectSlideRuns(e, this._targetWidth()) : [];
	}
	async findText(e, t = {}) {
		let n = this.engine;
		if (!n) return [];
		let r = ++this._findGeneration;
		if (e.length === 0) return this._find.invalidate(), this._redrawHighlights(), [];
		if (n.layoutComplete || await this.errorRouter.ownBackgroundLifecycle(() => n.waitUntilLayoutComplete()), this.destroyed || r !== this._findGeneration || n !== this.engine) return [];
		let i = await this.errorRouter.ownAwaitable(() => this._find.find(e, t));
		return this.destroyed || r !== this._findGeneration || n !== this.engine ? [] : (this._redrawHighlights(), i);
	}
	async findNext() {
		return this._activateMatch(this._find.next());
	}
	async findPrev() {
		return this._activateMatch(this._find.prev());
	}
	clearFind() {
		this._invalidateFind(), this._redrawHighlights();
	}
	_invalidateFind() {
		this._findGeneration++, this._find.invalidate();
	}
	async _activateMatch(e) {
		return e ? (e.location.slide === this.currentSlide ? this._redrawHighlights() : await this.goToSlide(e.location.slide), e) : (this._redrawHighlights(), null);
	}
	_redrawHighlights() {
		let e = this._find.slideRuns(this.currentSlide) ?? [], t = this._targetWidth(), n = this.engine ? Math.round(this.engine.slideHeight * (t / this.engine.slideWidth)) : 0;
		this._buildHighlightLayer(e, t, n);
	}
	_buildTextLayer(e, t, n, r) {
		I(e, t, n, r, this._hyperlinkHandler(), this.currentSlide);
	}
	_hyperlinkHandler() {
		if (this.opts.enableHyperlinks !== !1) return (e) => this._onHyperlinkClick(e);
	}
	_onHyperlinkClick(e) {
		let t = this._resolveInternalSlideIndex(e);
		if (this.opts.onHyperlinkClick) {
			this.opts.onHyperlinkClick(t);
			return;
		}
		if (t.kind === "external") {
			y(t.url, void 0, this.hostWindow);
			return;
		}
		t.slideIndex !== void 0 && this.goToSlide(t.slideIndex).catch((e) => this._reportRenderError(e));
	}
	_resolveInternalSlideIndex(e) {
		if (e.kind !== "internal" || e.slideIndex !== void 0) return e;
		let t = this.engine?.resolveInternalTarget(e.ref, this.currentSlide);
		return t === void 0 ? e : {
			...e,
			slideIndex: t
		};
	}
	_reportRenderError(e) {
		this.errorRouter.report(e);
	}
	async getResourceMetrics() {
		if (!this.engine) throw Error("Presentation not loaded");
		return await this.engine.getResourceMetrics();
	}
	getSelectionContext(e = {}) {
		if (this.destroyed) throw Error("PptxViewer is destroyed");
		return (this.textLayer ? X(this.wrapper, this.wrapper.ownerDocument?.getSelection?.() ?? null, e) : null) ?? (this.elementContext ? Pt(this.elementContext, e.maxTextCharacters) : null);
	}
	_emitSelectionContextChange() {
		let e = this.getSelectionContext();
		e?.kind === "text" && (this.elementHitGeneration++, this.elementContext = null, this._redrawElementOutline());
		let t = JSON.stringify(e);
		t !== this.selectionContextKey && (this.selectionContextKey = t, this.opts.onSelectionContextChange?.(e ? structuredClone(e) : null));
	}
	_setElementContext(e) {
		this.elementContext = e ? structuredClone(e) : null, this._redrawElementOutline(), this._emitSelectionContextChange();
	}
	_invalidateElementSelection(e = !0) {
		this.elementHitGeneration++, this.elementContext = null, this._redrawElementOutline(), e && this._emitSelectionContextChange();
	}
	_redrawElementOutline() {
		let e = this.elementContext, t = this.engine;
		if (!e || !t || e.slideIndex !== this.currentSlide) {
			E(this.elementLayer, null);
			return;
		}
		E(this.elementLayer, {
			x: e.bounds.x / t.slideWidth,
			y: e.bounds.y / t.slideHeight,
			width: e.bounds.width / t.slideWidth,
			height: e.bounds.height / t.slideHeight,
			rotation: e.bounds.rotation
		});
	}
	async _onElementClick(e) {
		this.destroyed || e.defaultPrevented || e.button !== 0 || await this._resolveContextAt(e);
	}
	_onContextMenu(e) {
		let t;
		this.opts.onContextMenu?.({
			originalEvent: e,
			getContext: () => t ??= this._resolveContextAt(e)
		});
	}
	async _resolveContextAt(e) {
		let t = this.engine;
		if (this.destroyed || !t) return null;
		if (this.textLayer && X(this.wrapper, this.wrapper.ownerDocument?.getSelection?.() ?? null)) return this._emitSelectionContextChange(), this.destroyed ? null : this.getSelectionContext();
		if (!this.opts.enableElementSelection) return this.getSelectionContext();
		let n = this.canvas.getBoundingClientRect();
		if (n.width <= 0 || n.height <= 0) return this._invalidateElementSelection(), null;
		let r = e.clientX - n.left, i = e.clientY - n.top;
		if (r < 0 || i < 0 || r > n.width || i > n.height) return this._invalidateElementSelection(), null;
		let a = ++this.elementHitGeneration, o = this.currentSlide, s = {
			x: r / n.width * t.slideWidth,
			y: i / n.height * t.slideHeight
		}, c;
		try {
			c = await t.getElementContextAt(o, s, {
				tolerance: this.elementHitTolerance / n.width * t.slideWidth,
				maxTextCharacters: G
			});
		} catch (e) {
			if (this.destroyed || a !== this.elementHitGeneration || o !== this.currentSlide || t !== this.engine) return null;
			throw e;
		}
		return this.destroyed || a !== this.elementHitGeneration || o !== this.currentSlide || t !== this.engine ? null : (this._setElementContext(c), this.destroyed ? null : this.getSelectionContext());
	}
	destroy() {
		this.destroyed || (this.destroyed = !0, this.errorRouter.close(), this.renderDispatcher.destroy(), o(this.canvas), this.handle?.destroy(), this.handle = null, this._unbindLayoutPresentation(), this.presentationOwner.close(), this._invalidateFind(), this.selectionChangeListener &&= (this.wrapper.ownerDocument.removeEventListener("selectionchange", this.selectionChangeListener), null), this.elementHitGeneration++, this.elementClickListener &&= (this.wrapper.removeEventListener("click", this.elementClickListener), null), this.contextMenuListener &&= (this.wrapper.removeEventListener("contextmenu", this.contextMenuListener), null), this.elementContext = null, this.canvasMount.restore());
	}
}, Kt = 150, qt = "0 1px 3px rgba(0,0,0,0.2)", Q = 12, Jt;
function Yt() {
	return Jt ??= import("./comment-ui-runtime-CAbpuWi_.js");
}
var $ = 440, Xt = 20, Zt = Symbol("PptxScrollViewer.borrowedPresentation"), Qt = class e {
	_presentationOwner;
	get _pres() {
		return this._presentationOwner.current;
	}
	_borrowed;
	_opts;
	_errorRouter;
	_container;
	_wrapper;
	_scrollHost;
	_spacer;
	_mode;
	_scale = 1;
	_scaleEstablished = !1;
	_pendingScale = null;
	_slots = /* @__PURE__ */ new Map();
	_free = [];
	_uniformSlideHeight = 0;
	_lastRange = null;
	_lastTopIndex = -1;
	_lastReportedTotal = -1;
	_lastReportedLayoutComplete = null;
	_layoutUnsubscribe = null;
	_scrollListener = null;
	_selectionChangeListener = null;
	_selectionContextKey = "null";
	_elementClickListener = null;
	_contextMenuListener = null;
	_commentOutsidePointerListener = null;
	_elementContext = null;
	_activeCommentId = null;
	_activeCommentSlide = null;
	_commentNavigationGeneration = 0;
	_commentUi = null;
	_commentGeometryScheduled = !1;
	_commentGeometryFrame = null;
	_pendingCommentGeometry = /* @__PURE__ */ new Map();
	_hasComments = !1;
	_reviewOriginPx = 0;
	_commentScanFrontier = 0;
	_layoutWaiters = /* @__PURE__ */ new Set();
	_layoutFailed = !1;
	_elementHitGeneration = 0;
	_elementHitTolerance;
	_destroyed = !1;
	_slideInFlight = /* @__PURE__ */ new Set();
	_renderEpoch = 0;
	_settleTimer = null;
	_wheelListener = null;
	_pendingZoomAnchor = null;
	_resizeObserver = null;
	_prevBase = 0;
	_lastFitWidth = 0;
	_pageShadow;
	_find = new Je(() => this.slideCount, (e) => this._collectSlideRuns(e));
	_findGeneration = 0;
	_findActive = !1;
	_findMeasureCtx;
	static fromPresentation(t, n, r = {}) {
		return new e(t, {
			...r,
			[Zt]: n
		});
	}
	constructor(e, t = {}) {
		if (e.tagName === "CANVAS") throw Error("PptxScrollViewer takes a container element (e.g. a <div>), not a <canvas> — the viewer creates and manages its own canvases. Pass a block container; for the single-slide canvas API use PptxViewer.");
		this._container = e, this._opts = t, this._errorRouter = new ve("PptxScrollViewer", t.onError);
		let n = t.elementHitTolerance ?? 6;
		if (!Number.isFinite(n) || n < 0) throw RangeError("elementHitTolerance must be a finite non-negative number.");
		this._elementHitTolerance = n, this._pageShadow = t.pageShadow ?? qt;
		let r = t[Zt];
		this._borrowed = r !== void 0, r ? (this._presentationOwner = new T("PptxScrollViewer", r, !1), this._mode = O("PptxScrollViewer", t.mode, r), this._scanAvailableComments(r, !1)) : (this._presentationOwner = new T("PptxScrollViewer"), this._mode = O("PptxScrollViewer", t.mode, void 0)), this._wrapper = document.createElement("div"), this._wrapper.style.cssText = "position:relative;width:100%;height:100%;overflow:hidden;", this._scrollHost = document.createElement("div"), this._scrollHost.style.cssText = "position:absolute;inset:0;overflow:auto;", this._scrollHost.style.scrollbarGutter = "stable", t.background && (this._scrollHost.style.background = t.background), this._spacer = document.createElement("div"), this._spacer.style.cssText = "position:absolute;top:0;left:0;width:1px;height:0;pointer-events:none;", this._scrollHost.appendChild(this._spacer), this._wrapper.appendChild(this._scrollHost), this._container.appendChild(this._wrapper), this._commentsEnabled() && Yt().then((e) => {
			if (!this._destroyed) {
				this._commentUi = e;
				for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
			}
		}).catch((e) => this._reportRenderError(e)), t.enableTextSelection && (t.onSelectionContextChange || t.enableElementSelection) && (this._selectionChangeListener = () => this._emitSelectionContextChange(), this._wrapper.ownerDocument.addEventListener("selectionchange", this._selectionChangeListener)), t.enableElementSelection && (this._elementClickListener = (e) => {
			this._onElementClick(e).catch((e) => this._reportRenderError(e));
		}, this._scrollHost.addEventListener("click", this._elementClickListener)), t.onContextMenu && (this._contextMenuListener = (e) => this._onContextMenu(e), this._scrollHost.addEventListener("contextmenu", this._contextMenuListener)), this._scrollListener = () => this._onScroll(), this._scrollHost.addEventListener("scroll", this._scrollListener), t.comments && (this._commentOutsidePointerListener = (e) => {
			if (!Me(e, this._wrapper, "ooxmlCommentId") && this._activeCommentId !== null) {
				this._activeCommentId = null, this._activeCommentSlide = null;
				for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
				this._emitSelectionContextChange();
			}
		}, this._wrapper.ownerDocument.addEventListener("pointerdown", this._commentOutsidePointerListener)), this._opts.enableZoom !== !1 && (this._wheelListener = (e) => {
			if (!(e.ctrlKey || e.metaKey) || (e.preventDefault(), e.deltaY === 0)) return;
			let t = this._scrollHost.getBoundingClientRect(), n = e.clientX - t.left, r = e.clientY - t.top;
			this._pendingZoomAnchor = Number.isFinite(n) && Number.isFinite(r) ? {
				x: n,
				y: r
			} : null, this.setScale(Ce(this._scale, e.deltaY, e.deltaMode));
		}, this._scrollHost.addEventListener("wheel", this._wheelListener, { passive: !1 })), typeof ResizeObserver < "u" && (this._resizeObserver = new ResizeObserver(() => this._onResize()), this._resizeObserver.observe(this._container)), this._borrowed && (this._bindLayoutPresentation(r), this.relayout());
	}
	async load(e) {
		if (this._destroyed) throw Error("PptxScrollViewer is destroyed");
		if (this._borrowed) throw Error("PptxScrollViewer.load() is unsupported on a Viewer created by fromPresentation(); the borrowed presentation is already loaded.");
		let t = !1;
		try {
			let n = await this._presentationOwner.replace(() => J.load(e, {
				password: this._opts.password,
				useGoogleFonts: this._opts.useGoogleFonts,
				maxZipEntryBytes: this._opts.maxZipEntryBytes,
				resourceLimits: this._opts.resourceLimits,
				debug: this._opts.debug,
				onResourceMetrics: this._opts.onResourceMetrics,
				workerTimeoutMs: this._opts.workerTimeoutMs,
				wasmUrl: this._opts.wasmUrl,
				math: this._opts.math,
				threeD: this._opts.threeD,
				regionMap: this._opts.regionMap,
				chartEx: this._opts.chartEx,
				tiff: this._opts.tiff,
				mode: this._mode,
				progressiveLayout: this._opts.progressiveLayout,
				onLayoutProgress: this._opts.onLayoutProgress,
				onLayoutPartial: this._opts.onLayoutPartial,
				onLayoutComplete: this._opts.onLayoutComplete
			}), (e) => {
				if (this._invalidateElementSelection(!1), t = !0, this._invalidateFind(), this._findActive = !1, this._activeCommentId = null, this._activeCommentSlide = null, this._hasComments = !1, this._commentScanFrontier = 0, this._beginCommentNavigation(), this._unbindLayoutPresentation(), e) {
					for (let [e, t] of [...this._slots]) this._recycleSlot(e, t);
					this._lastTopIndex = -1;
				}
			});
			if (!n) return;
			if (this._destroyed) throw Error("PptxScrollViewer is destroyed");
			this._invalidateFind(), this._findActive = !1, this._activeCommentId = null, this._activeCommentSlide = null, this._hasComments = !1, this._commentScanFrontier = 0, this._scanAvailableComments(n, !1), this._bindLayoutPresentation(n);
			let r = [];
			this._relayout(r), await Promise.all(r);
		} catch (e) {
			throw this._destroyed ? Error("PptxScrollViewer is destroyed") : e instanceof Error ? e : Error(String(e));
		}
		t && !this._destroyed && this._emitSelectionContextChange();
	}
	get slideCount() {
		return this._pres?.slideCount ?? 0;
	}
	get availableSlideCount() {
		return this._pres?.availableSlideCount ?? this.slideCount;
	}
	get layoutComplete() {
		return this._pres?.layoutComplete ?? !0;
	}
	async waitUntilLayoutComplete() {
		await this._errorRouter.ownBackgroundLifecycle(async () => {
			await this._pres?.waitUntilLayoutComplete?.();
		});
	}
	_slideWidthPx() {
		return this._pres.slideWidth / M * this._scale;
	}
	_slideHeightPx() {
		return this._pres.slideHeight / M * this._scale;
	}
	_fitWidthPx() {
		if (this._opts.width && this._opts.width > 0) return this._opts.width;
		let e = this._scrollHost.clientWidth || this._container.clientWidth;
		if (e <= 0) return 0;
		let { left: t, right: n } = this._padH(), r = e - t - n;
		return r <= 0 ? 0 : r;
	}
	_commentMarginExtent() {
		return this._hasCommentMargin() ? (Q + $) * this._commentZoom() : 0;
	}
	_hasCommentMargin() {
		return this._commentsEnabled() && this._hasComments && this._commentsOptions()?.cards !== !1;
	}
	_commentZoom() {
		return this._scaleEstablished ? this._scale : 1;
	}
	_commentsEnabled() {
		return this._opts.comments === !0 || typeof this._opts.comments == "object";
	}
	_commentsOptions() {
		return typeof this._opts.comments == "object" ? this._opts.comments : void 0;
	}
	_commentSide() {
		let e = this._commentsOptions()?.side;
		return e === "left" || e === "right" ? e : (this._container.ownerDocument.defaultView?.getComputedStyle?.(this._container).direction || this._container.dir || this._container.style.direction) === "rtl" ? "left" : "right";
	}
	_syncCommentMarginGeometry(e) {
		if (!e) return;
		e.style.display = this._hasCommentMargin() ? "" : "none";
		let t = this._commentZoom(), n = `calc(100% + ${Q * t}px)`;
		e.style.left = this._commentSide() === "right" ? n : "", e.style.right = this._commentSide() === "left" ? n : "", e.style.width = `${$ * t}px`, e.style.fontSize = `${Xt}px`, e.dataset.ooxmlCommentZoom = String(t);
	}
	_scanAvailableComments(e, t) {
		if (!this._commentsEnabled() || this._hasComments) return;
		let n = this._commentsOptions()?.includeResolved === !0, r = Math.min(e.availableSlideCount, e.slideCount);
		for (let i = this._commentScanFrontier; i < r; i++) if (e.getComments(i).some((e) => n || e.status !== "resolved" && e.status !== "closed")) {
			this._commentScanFrontier = r, this._hasComments = !0, t && this._refreshDiscoveredComments();
			return;
		}
		this._commentScanFrontier = Math.max(this._commentScanFrontier, r);
	}
	_refreshDiscoveredComments() {
		this._syncSpacerWidth();
		for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
	}
	_baseScale() {
		if (!this._pres || this._pres.slideCount === 0) return 0;
		let e = this._fitWidthPx(), t = this._pres.slideWidth / M;
		return e <= 0 || t <= 0 ? 0 : e / t;
	}
	relayout() {
		this._relayout();
	}
	_relayout(e) {
		if (this._pres) {
			if (!this._scaleEstablished) {
				let e = this._baseScale();
				if (e > 0) {
					if (this._scale = e, this._prevBase = e, this._lastFitWidth = this._fitWidthPx(), this._scaleEstablished = !0, this._pendingScale !== null) {
						let e = this._pendingScale;
						this._pendingScale = null, e !== this._scale && (this._scale = e, this._opts.onScaleChange?.(e));
					}
				} else return;
			}
			this._recomputeHeights(), this._syncSpacer(), this._mountVisible(e);
		}
	}
	_recomputeHeights() {
		this._uniformSlideHeight = this._slideHeightPx();
	}
	_gap() {
		return this._opts.gap ?? 16;
	}
	_overscan() {
		return this._opts.overscan ?? 1;
	}
	_mediaOverscan() {
		return this._opts.mediaOverscan ?? 1;
	}
	_pad() {
		let e = this._gap();
		return {
			leading: this._opts.paddingTop ?? e,
			trailing: this._opts.paddingBottom ?? e
		};
	}
	_padH() {
		let e = this._gap();
		return {
			left: this._opts.paddingLeft ?? e,
			right: this._opts.paddingRight ?? e
		};
	}
	_slideOffset(e) {
		return this._pad().leading + e * (this._uniformSlideHeight + this._gap());
	}
	_slideIndexAtOffset(e) {
		return A(this._pres?.slideCount ?? 0, this._uniformSlideHeight, this._gap(), e, 0, 0, this._pad()).topIndex;
	}
	_rangeAt(e, t) {
		return A(this._pres?.slideCount ?? 0, this._uniformSlideHeight, this._gap(), e, this._scrollHost.clientHeight, t, this._pad());
	}
	_range() {
		return this._rangeAt(this._scrollHost.scrollTop, this._overscan());
	}
	_mediaRange() {
		return this._rangeAt(this._scrollHost.scrollTop, this._mediaOverscan());
	}
	_rangeContains(e, t) {
		return t >= e.start && t <= e.end;
	}
	_syncSpacer() {
		let e = this._range();
		this._lastRange = e, this._spacer.style.height = `${e.totalHeight}px`, this._syncSpacerWidth();
	}
	_syncSpacerWidth() {
		let { left: e, right: t } = this._padH(), n = this._commentMarginExtent(), r = this._commentSide() === "left" ? n : 0, i = r - this._reviewOriginPx, a = Math.max(0, this._scrollHost.scrollLeft + i);
		this._spacer.style.width = `${this._slideWidthPx() + n + e + t}px`, i !== 0 && (this._reviewOriginPx = r, this._scrollHost.style["--ooxml-review-origin-x"] = `${r}px`, this._scrollHost.scrollLeft = a);
	}
	_onScroll() {
		!this._pres || !this._scaleEstablished || this._mountVisible(void 0, !1);
	}
	_mountVisible(e, t = !0) {
		if (!this._pres || this._pres.slideCount === 0) return;
		let n = this._range(), r = this._opts.enableMediaPlayback ? this._mediaRange() : null;
		this._lastRange = n;
		for (let [e, t] of [...this._slots]) (e < n.start || e > n.end) && this._recycleSlot(e, t);
		for (let i = n.start; i <= n.end; i++) if (this._slots.has(i)) t && this._positionSlot(this._slots.get(i), i, n);
		else {
			let t = this._acquireSlot();
			this._positionSlot(t, i, n), this._slots.set(i, t), this._redrawSlotComments(i, t);
			let a = this._renderSlot(i, t, !!r && this._rangeContains(r, i), e === void 0);
			e && a && i < this.availableSlideCount && e.push(a);
		}
		r && this._syncMediaPlayback(r), this._emitVisibleSlideChange(n);
	}
	_applyPageShadow(e) {
		this._pageShadow !== !1 && (e.style.boxShadow = this._pageShadow);
	}
	_acquireSlot() {
		let e = this._free.pop();
		if (e) return this._scrollHost.appendChild(e.wrapper), e;
		let t = document.createElement("div");
		t.style.cssText = "position:absolute;";
		let n = document.createElement("canvas");
		n.style.cssText = "display:block;background:#fff;", this._applyPageShadow(n), t.appendChild(n);
		let r = null;
		this._opts.enableTextSelection && (r = document.createElement("div"), r.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none;user-select:text;-webkit-user-select:text;", t.appendChild(r));
		let i = document.createElement("div");
		i.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none;", t.appendChild(i);
		let a = document.createElement("span");
		a.style.cssText = [
			"position:absolute",
			"top:0",
			"right:0",
			"bottom:0",
			"left:0",
			"display:none",
			"align-items:center",
			"justify-content:center",
			"background:rgba(255,255,255,0.72)",
			"pointer-events:none",
			"z-index:4"
		].join(";"), a.setAttribute("role", "status"), a.setAttribute("aria-live", "polite"), a.setAttribute("aria-label", "Loading slide");
		let o = document.createElement("progress");
		o.setAttribute("aria-hidden", "true"), a.appendChild(o), t.appendChild(a);
		let s = null, c = null, l = null;
		this._commentsEnabled() && (s = document.createElement("div"), s.style.cssText = "position:absolute;inset:0;overflow:hidden;pointer-events:none;", t.appendChild(s), this._commentsOptions()?.cards !== !1 && (c = document.createElement("div"), c.style.cssText = "position:absolute;top:0;height:100%;box-sizing:border-box;overflow-x:hidden;overflow-y:auto;pointer-events:auto;", this._syncCommentMarginGeometry(c), this._commentsOptions()?.connectors !== void 0 && (l = document.createElement("div"), l.style.cssText = "position:absolute;top:0;left:0;overflow:visible;pointer-events:none;", t.appendChild(l)), t.appendChild(c)));
		let u = ge(t, this._opts.enableElementSelection === !0);
		return this._scrollHost.appendChild(t), {
			wrapper: t,
			canvas: n,
			textLayer: r,
			highlightLayer: i,
			elementLayer: u,
			loadingLayer: a,
			commentMarkerLayer: s,
			commentMargin: c,
			commentDecorationLayer: l,
			commentElementBounds: Object.freeze([]),
			commentGeometry: null,
			commentAnchorSlide: -1,
			commentAnchorGeneration: 0,
			renderedSlide: -1,
			renderedScale: -1,
			dispatcher: new D(n, this._mode === "worker" && !this._opts.enableMediaPlayback),
			presentationHandle: null,
			mediaInteractive: !1,
			renderGeneration: 0,
			presentationGeneration: 0
		};
	}
	_recycleSlot(e, t) {
		this._slots.delete(e), t.renderGeneration++, t.presentationGeneration++, t.presentationHandle?.destroy(), t.presentationHandle = null, t.mediaInteractive = !1, t.dispatcher.destroy(), this._destroyed || (t.dispatcher = new D(t.canvas, this._mode === "worker" && !this._opts.enableMediaPlayback)), t.textLayer && (t.textLayer.innerHTML = "", this._clearTextLayerPreview(t.textLayer)), t.highlightLayer.innerHTML = "", t.highlightLayer.style.transform = "", t.highlightLayer.style.transformOrigin = "", t.loadingLayer.style.display = "none", t.commentMarkerLayer && (t.commentMarkerLayer.replaceChildren(), t.commentMarkerLayer.style.visibility = ""), t.commentMargin && (this._commentUi?.disposeReadOnlyCommentMargin(t.commentMargin), this._commentUi || t.commentMargin.replaceChildren(), t.commentMargin.style.visibility = ""), t.commentDecorationLayer && (this._commentUi?.disposeReadOnlyCommentDecoration(t.commentDecorationLayer), this._commentUi || t.commentDecorationLayer.replaceChildren(), t.commentDecorationLayer.style.visibility = ""), t.commentElementBounds = Object.freeze([]), t.commentGeometry = null, t.commentAnchorSlide = -1, t.commentAnchorGeneration++, E(t.elementLayer, null), t.canvas.style.height = "", t.renderedSlide = -1, t.renderedScale = -1, t.wrapper.remove(), this._free.push(t);
	}
	_positionSlot(e, t, n) {
		e.wrapper.dataset.slideIndex = String(t), e.wrapper.style.top = `${this._slideOffset(t)}px`;
		let r = this._slideWidthPx();
		if (e.wrapper.style.width = `${r}px`, e.wrapper.style.height = `${this._slideHeightPx()}px`, this._syncCommentMarginGeometry(e.commentMargin), e.commentDecorationLayer) {
			let t = this._commentMarginExtent();
			e.commentDecorationLayer.style.left = this._commentSide() === "left" ? `${-t}px` : "0px", e.commentDecorationLayer.style.width = `${r + t}px`, e.commentDecorationLayer.style.height = `${this._slideHeightPx()}px`;
		}
		this._redrawElementOutlineForSlot(t, e);
		let { left: i } = this._padH(), a = Math.max(i, (this._scrollHost.clientWidth - r) / 2);
		e.wrapper.style.left = this._commentSide() === "left" && this._commentsEnabled() ? `calc(${a}px + var(--ooxml-review-origin-x, 0px))` : `${a}px`;
	}
	_dpr() {
		return this._opts.dpr ?? (typeof window < "u" && window.devicePixelRatio || 1);
	}
	_renderSlot(e, t, n = !1, r = !0) {
		if (!this._pres || t.renderedSlide === e) return null;
		if (e >= this.availableSlideCount && !this.layoutComplete) return t.renderedSlide = -1, t.mediaInteractive = !1, t.loadingLayer.style.display = "flex", null;
		t.renderedSlide = e;
		let i = ++t.renderGeneration;
		t.loadingLayer.style.display = e >= this.availableSlideCount && !this.layoutComplete ? "flex" : "none";
		let a = this._dpr(), o = this._slideWidthPx(), s = this._renderEpoch, c = this._scale, l = t.dispatcher, u = l.begin();
		if (this._opts.enableMediaPlayback && n) return t.mediaInteractive = !0, this._trackSlotLoading(e, t, i, this._renderInteractiveSlot(e, t, o, a, c, s, r));
		if (t.mediaInteractive = !1, this._mode === "worker") return this._trackSlotLoading(e, t, i, this._renderSlotBitmap(e, t, o, a, c, i, l, u, r));
		let d = [], f = !!this._opts.enableTextSelection && !!t.textLayer, p = f || this._findActive, m = p ? (e) => d.push(e) : void 0, h = t.canvas;
		return this._trackSlotLoading(e, t, i, Z(this._pres, h, e, "main", {
			width: o,
			dpr: a,
			imageResources: this._opts.imageResources,
			onTextRun: m
		}).then(() => {
			i !== t.renderGeneration || !l.isCurrent(u) || h !== t.canvas || s !== this._renderEpoch || this._slots.get(e) !== t || t.renderedSlide !== e || (t.renderedScale = c, f && t.textLayer && I(t.textLayer, d, Math.round(o), Math.round(this._slideHeightPx()), this._hyperlinkHandler(), e), p && this._refreshFindRuns(e, d), this._commitSlotComments(e, t), this._redrawSlotHighlights(e, t));
		}).catch((n) => {
			if (i === t.renderGeneration && l.isCurrent(u) && h === t.canvas && s === this._renderEpoch && this._slots.get(e) === t && t.renderedSlide === e) if (r) this._reportRenderError(n);
			else throw n;
		}));
	}
	async _trackSlotLoading(e, t, n, r) {
		try {
			await r;
		} finally {
			n === t.renderGeneration && this._slots.get(e) === t && t.renderedSlide === e && (t.loadingLayer.style.display = "none");
		}
	}
	_bindLayoutPresentation(e) {
		this._unbindLayoutPresentation();
		let t = !0;
		this._layoutUnsubscribe = Rt(e, () => ({
			availableSlides: e.availableSlideCount,
			slideCount: e.slideCount,
			exact: e.layoutComplete,
			complete: e.layoutComplete
		}), (n) => {
			if (t) {
				t = !1;
				return;
			}
			this._onLayoutPublication(e, n);
		}, (e) => this._reportRenderError(e));
	}
	_unbindLayoutPresentation() {
		this._layoutUnsubscribe?.(), this._layoutUnsubscribe = null, this._layoutFailed = !1, this._wakeLayoutWaiters();
	}
	_onLayoutPublication(e, t) {
		if (this._destroyed || e !== this._pres) return;
		if (this._wakeLayoutWaiters(), t.error !== void 0) {
			this._layoutFailed = !0, this._errorRouter.reportBackground(t.error, this._opts.onLayoutComplete !== void 0);
			return;
		}
		this._scanAvailableComments(e, !0);
		let n = this._opts.enableMediaPlayback ? this._mediaRange() : null;
		for (let [t, r] of this._slots) t >= e.availableSlideCount || r.renderedSlide === t || this._renderSlot(t, r, !!n && this._rangeContains(n, t));
		this._lastRange && this._emitVisibleSlideChange(this._lastRange);
	}
	_wakeLayoutWaiters() {
		for (let e of this._layoutWaiters) e();
		this._layoutWaiters.clear();
	}
	_beginCommentNavigation() {
		let e = ++this._commentNavigationGeneration;
		return this._wakeLayoutWaiters(), e;
	}
	async _waitForSlideMetadata(e, t, n) {
		return await this._errorRouter.ownBackgroundLifecycle(async () => {
			for (; !this._destroyed && n === this._commentNavigationGeneration && e === this._pres && t >= e.availableSlideCount && !e.layoutComplete && !this._layoutFailed;) await new Promise((e) => this._layoutWaiters.add(e));
			return this._destroyed || e !== this._pres || ((e.layoutComplete || this._layoutFailed) && await e.waitUntilLayoutComplete?.(), n !== this._commentNavigationGeneration) ? !1 : t < e.availableSlideCount;
		});
	}
	_emitVisibleSlideChange(e) {
		if (!this._pres) return;
		let t = this._pres.slideCount, n = this.layoutComplete;
		e.topIndex === this._lastTopIndex && t === this._lastReportedTotal && n === this._lastReportedLayoutComplete || (this._lastTopIndex = e.topIndex, this._lastReportedTotal = t, this._lastReportedLayoutComplete = n, this._opts.onVisibleSlideChange?.(e.topIndex, t, n));
	}
	_renderInteractiveSlot(e, t, n, r, i, a, o = !0) {
		if (!this._pres) return Promise.resolve();
		let s = ++t.presentationGeneration;
		t.presentationHandle?.destroy(), t.presentationHandle = null;
		let c = [], l = !!this._opts.enableTextSelection && !!t.textLayer, u = l || this._findActive, d = u ? (e) => c.push(e) : void 0;
		return this._pres.presentSlide(t.canvas, e, {
			width: n,
			dpr: r,
			imageResources: this._opts.imageResources,
			onTextRun: d,
			onError: (e) => {
				s === t.presentationGeneration && this._reportRenderError(e);
			}
		}).then((r) => {
			if (s !== t.presentationGeneration || !t.mediaInteractive || a !== this._renderEpoch || this._slots.get(e) !== t || t.renderedSlide !== e) {
				r.destroy();
				return;
			}
			t.presentationHandle = r, t.renderedScale = i, l && t.textLayer && I(t.textLayer, c, Math.round(n), Math.round(this._slideHeightPx()), this._hyperlinkHandler(), e), u && this._refreshFindRuns(e, c), this._commitSlotComments(e, t), this._redrawSlotHighlights(e, t);
		}).catch((e) => {
			if (s === t.presentationGeneration) if (o) this._reportRenderError(e);
			else throw e;
		});
	}
	_syncMediaPlayback(e = this._mediaRange()) {
		if (this._opts.enableMediaPlayback) for (let [t, n] of this._slots) {
			let r = this._rangeContains(e, t);
			r !== n.mediaInteractive && (r ? (n.mediaInteractive = !0, this._settleInteractiveSlot(t, n, this._slideWidthPx(), this._dpr(), this._scale, this._renderEpoch)) : (n.mediaInteractive = !1, n.presentationGeneration++, n.presentationHandle?.destroy(), n.presentationHandle = null));
		}
	}
	_reportRenderError(e) {
		this._errorRouter.report(e);
	}
	async _renderSlotBitmap(e, t, n, r, i, a = ++t.renderGeneration, o = t.dispatcher, s = o.begin(), c = !0) {
		if (this._slideInFlight.has(e) || this._slots.get(e) !== t) return;
		let l = this._renderEpoch;
		this._slideInFlight.add(e);
		let u = t.canvas, d = !1, f = !!this._opts.enableTextSelection && !!t.textLayer, p = f || this._findActive, m = [];
		try {
			let c = await Z(this._pres, u, e, "worker", {
				width: n,
				dpr: r,
				imageResources: this._opts.imageResources,
				onTextRun: p ? (e) => m.push(e) : void 0
			});
			if (a !== t.renderGeneration || !o.isCurrent(s) || u !== t.canvas || l !== this._renderEpoch || this._slots.get(e) !== t || t.renderedSlide !== e) {
				c.close();
				return;
			}
			let h = {
				cssWidth: Math.round(n),
				cssHeight: Math.round(this._slideHeightPx())
			};
			if (!(this._opts.enableMediaPlayback ? o.commitBitmapTo2d(s, c, h) : o.commitBitmap(s, c, h))) return;
			t.renderedScale = i, t.textLayer && (this._clearTextLayerPreview(t.textLayer), f && I(t.textLayer, m, Math.round(n), Math.round(this._slideHeightPx()), this._hyperlinkHandler(), e)), p && this._refreshFindRuns(e, m), this._commitSlotComments(e, t), this._redrawSlotHighlights(e, t), d = !0;
		} catch (n) {
			if (a === t.renderGeneration && o.isCurrent(s) && u === t.canvas && l === this._renderEpoch && this._slots.get(e) === t && t.renderedSlide === e) if (c) this._reportRenderError(n);
			else throw n;
		} finally {
			this._slideInFlight.delete(e);
			let n = this._slots.get(e);
			!d && n && (n !== t || l !== this._renderEpoch || a !== n.renderGeneration || !o.isCurrent(s)) && !this._slideInFlight.has(e) && !this._destroyed && !(this._opts.enableMediaPlayback && n.mediaInteractive) && this._renderSlotBitmap(e, n, this._slideWidthPx(), this._dpr(), this._scale);
		}
	}
	setScale(e) {
		let t = this._effectiveZoomMin(), n = this._opts.zoomMax ?? 4, r = Math.min(n, Math.max(t, e)), i = this._pendingZoomAnchor;
		if (this._pendingZoomAnchor = null, !this._pres || this._pres.slideCount === 0 || !this._scaleEstablished) {
			this._pendingScale = r;
			return;
		}
		if (r === this._scale) return;
		let a = this._scale, o = i ? i.y : 0, s = this._scrollHost.scrollTop, c = s + o, l = this._slideIndexAtOffset(c), u = this._uniformSlideHeight, d = u > 0 ? (c - this._slideOffset(l)) / u : 0;
		d = Math.min(1, Math.max(0, d));
		let f = this._padH().left, p = this._scrollHost.scrollLeft || 0;
		this._renderEpoch++, this._scale = r, this._recomputeHeights();
		let m = this._rangeAt(0, this._overscan());
		this._spacer.style.height = `${m.totalHeight}px`, this._syncSpacerWidth();
		let h = Math.max(0, m.totalHeight - this._scrollHost.clientHeight), g = this._slideOffset(l) + d * this._uniformSlideHeight, _ = c < this._slideOffset(0) ? s : g - o;
		if (this._scrollHost.scrollTop = Math.min(h, Math.max(0, _)), i) {
			let e = Math.max(0, (this._spacer.offsetWidth || 0) - this._scrollHost.clientWidth);
			this._scrollHost.scrollLeft = le(p, i.x - f, a, r, { maxScroll: e });
		}
		this._previewVisible(), this._scheduleSettle(), this._opts.onScaleChange?.(r);
	}
	getScale() {
		return this._scaleEstablished ? this._scale : this._pendingScale ?? 1;
	}
	zoomIn() {
		this.setScale(xe(this.getScale()));
	}
	zoomOut() {
		this.setScale(we(this.getScale(), this._effectiveZoomMin()));
	}
	_effectiveZoomMin() {
		let e = this._opts.zoomMin ?? .1;
		return this._scaleEstablished && this._prevBase > 0 ? Math.min(e, this._prevBase) : e;
	}
	fitWidth() {
		this._fit("width");
	}
	fitPage() {
		this._fit("page");
	}
	_fit(e) {
		if (!this._pres || this._pres.slideCount === 0) return;
		let t = ce({
			contentWidth: this._pres.slideWidth / M,
			contentHeight: this._pres.slideHeight / M,
			containerWidth: this._fitWidthPx(),
			containerHeight: this._scrollHost.clientHeight
		}, e);
		t <= 0 || this.setScale(t);
	}
	_previewVisible() {
		if (!this._pres || this._pres.slideCount === 0) return;
		let e = this._range(), t = this._opts.enableMediaPlayback ? this._mediaRange() : null;
		this._lastRange = e;
		for (let [t, n] of [...this._slots]) (t < e.start || t > e.end) && this._recycleSlot(t, n);
		for (let n = e.start; n <= e.end; n++) {
			let r = this._slots.get(n);
			if (r) this._previewSlot(r, n, e);
			else {
				let r = this._acquireSlot();
				this._positionSlot(r, n, e), this._slots.set(n, r), this._redrawSlotComments(n, r), this._renderSlot(n, r, !!t && this._rangeContains(t, n));
			}
		}
		t && this._syncMediaPlayback(t), this._emitVisibleSlideChange(e);
	}
	_previewSlot(e, t, n) {
		if (this._positionSlot(e, t, n), e.canvas.style.width = `${this._slideWidthPx()}px`, e.canvas.style.height = `${this._slideHeightPx()}px`, e.textLayer && e.renderedScale > 0) {
			let t = this._scale / e.renderedScale;
			e.textLayer.style.transformOrigin = "0 0", e.textLayer.style.width = `${this._slideWidthPx() / t}px`, e.textLayer.style.height = `${this._slideHeightPx() / t}px`, e.textLayer.style.transform = `scale(${t})`;
		}
		if (e.renderedScale > 0) {
			let t = this._scale / e.renderedScale, n = Math.round(t * 1e6) / 1e6;
			e.commentMargin && this._commentUi?.previewReadOnlyCommentMargin(e.commentMargin, t);
			for (let t of e.commentMarkerLayer?.children ?? []) t.dataset.ooxmlCommentMarker !== void 0 && (t.style.transform = `translate(-50%,-50%) scale(${n})`);
			e.commentMarkerLayer && (e.commentMarkerLayer.style.visibility = ""), e.commentMargin && (e.commentMargin.style.visibility = ""), e.commentDecorationLayer && (e.commentDecorationLayer.style.visibility = "");
			return;
		}
		e.commentMarkerLayer && (e.commentMarkerLayer.style.visibility = "hidden"), e.commentMargin && (e.commentMargin.style.visibility = "hidden"), e.commentDecorationLayer && (e.commentDecorationLayer.style.visibility = "hidden");
	}
	_clearTextLayerPreview(e) {
		e.style.transform = "", e.style.transformOrigin = "", e.style.width = "100%", e.style.height = "100%";
	}
	_scheduleSettle() {
		this._settleTimer !== null && clearTimeout(this._settleTimer), this._settleTimer = setTimeout(() => {
			this._settleTimer = null, this._settleRender();
		}, Kt);
	}
	_settleRender() {
		if (this._destroyed || !this._pres || this._pres.slideCount === 0) return;
		let e = this._opts.enableMediaPlayback ? this._mediaRange() : null;
		for (let [t, n] of [...this._slots]) e && !this._rangeContains(e, t) || n.renderedScale !== this._scale && this._settleSlot(t, n);
	}
	_settleSlot(e, t) {
		if (!this._pres) return;
		let n = this._dpr(), r = this._slideWidthPx(), i = this._scale, a = this._renderEpoch;
		if (this._opts.enableMediaPlayback && t.mediaInteractive) {
			this._settleInteractiveSlot(e, t, r, n, i, a);
			return;
		}
		if (this._opts.enableMediaPlayback) return;
		if (this._mode === "worker") {
			this._renderSlotBitmap(e, t, r, n, i);
			return;
		}
		let o = document.createElement("canvas"), s = ++t.renderGeneration;
		o.style.cssText = "display:block;background:#fff;", this._applyPageShadow(o);
		let c = new D(o, !1), l = c.begin(), u = [], d = !!this._opts.enableTextSelection && !!t.textLayer, f = d || this._findActive, p = f ? (e) => u.push(e) : void 0;
		Z(this._pres, o, e, "main", {
			width: r,
			dpr: n,
			onTextRun: p
		}).then(() => {
			if (s !== t.renderGeneration || !c.isCurrent(l) || a !== this._renderEpoch || this._slots.get(e) !== t || t.renderedSlide !== e) {
				c.destroy();
				return;
			}
			let n = t.canvas;
			t.dispatcher.destroy(), t.wrapper.insertBefore(o, n), n.remove(), t.canvas = o, t.dispatcher = c, t.renderedScale = i, t.textLayer && (this._clearTextLayerPreview(t.textLayer), d && I(t.textLayer, u, Math.round(r), Math.round(this._slideHeightPx()), this._hyperlinkHandler(), e)), f && this._refreshFindRuns(e, u), this._commitSlotComments(e, t), this._redrawSlotHighlights(e, t);
		}).catch((n) => {
			s === t.renderGeneration && c.isCurrent(l) && a === this._renderEpoch && this._slots.get(e) === t && t.renderedSlide === e && this._reportRenderError(n), c.destroy();
		});
	}
	_settleInteractiveSlot(e, t, n, r, i, a) {
		if (!this._pres) return;
		let o = ++t.presentationGeneration, s = document.createElement("canvas");
		s.style.cssText = "display:block;background:#fff;", this._applyPageShadow(s);
		let c = [], l = !!this._opts.enableTextSelection && !!t.textLayer, u = l || this._findActive, d = u ? (e) => c.push(e) : void 0;
		this._pres.presentSlide(s, e, {
			width: n,
			dpr: r,
			onTextRun: d,
			onError: (e) => {
				o === t.presentationGeneration && this._reportRenderError(e);
			}
		}).then((r) => {
			if (o !== t.presentationGeneration || !t.mediaInteractive || a !== this._renderEpoch || this._slots.get(e) !== t || t.renderedSlide !== e) {
				r.destroy();
				return;
			}
			let d = t.canvas, f = t.presentationHandle;
			t.dispatcher.destroy(), t.wrapper.insertBefore(s, d), d.remove(), t.canvas = s, t.dispatcher = new D(s, !1), t.presentationHandle = r, t.renderedScale = i, f?.destroy(), t.textLayer && (this._clearTextLayerPreview(t.textLayer), l && I(t.textLayer, c, Math.round(n), Math.round(this._slideHeightPx()), this._hyperlinkHandler(), e)), u && this._refreshFindRuns(e, c), this._commitSlotComments(e, t), this._redrawSlotHighlights(e, t);
		}).catch((e) => {
			o === t.presentationGeneration && this._reportRenderError(e);
		});
	}
	scrollToSlide(e, t) {
		if (!this._pres || this._pres.slideCount === 0 || !this._scaleEstablished) return;
		let n = Math.max(0, Math.min(e, this._pres.slideCount - 1)), r = this._rangeAt(0, this._overscan()), i = this._slideOffset(n), a = Math.max(0, r.totalHeight - this._scrollHost.clientHeight), o = Math.min(a, Math.max(0, i)), s = this._scrollHost;
		typeof s.scrollTo == "function" ? s.scrollTo({
			top: o,
			behavior: t?.behavior ?? "auto"
		}) : this._scrollHost.scrollTop = o, this._mountVisible();
	}
	_scrollToSlideCommentTarget(e, t, n, r) {
		if (!this._pres) return !1;
		let i = this._slots.get(e), a = new Map((i?.commentElementBounds ?? []).map((e) => [e.elementId, e.bounds])), o = r ?? (t.anchors ?? []).flatMap((e) => {
			if (e.type !== "drawingElement" && e.type !== "textRange" || !e.elementId) return [];
			let t = a.get(e.elementId);
			return t ? [t] : [];
		})[0], s = t.anchors ?? [], c = Number.isFinite(t.x) && Number.isFinite(t.y) && (s.length === 0 || s.some((e) => e.type === "slide"));
		if (!o && !c) return !1;
		let l = o ? o.x + (c ? t.x : o.width) : t.x, u = o ? o.y + (c ? t.y : 0) : t.y, d = this._slideWidthPx(), { left: f } = this._padH(), p = Math.max(f, (this._scrollHost.clientWidth - d) / 2) + this._reviewOriginPx, m = this._rangeAt(0, this._overscan()), h = Math.max(0, m.totalHeight - this._scrollHost.clientHeight), g = this._spacer.offsetWidth || Number.parseFloat(this._spacer.style.width) || 0, _ = Math.max(0, g - this._scrollHost.clientWidth), v = l / M * this._scale, y = u / M * this._scale, b = Math.min(h, Math.max(0, this._slideOffset(e) + y - this._scrollHost.clientHeight / 2)), x = Math.min(_, Math.max(0, p + v - this._scrollHost.clientWidth / 2)), S = this._scrollHost;
		return typeof S.scrollTo == "function" ? S.scrollTo({
			top: b,
			left: x,
			behavior: n?.behavior ?? "auto"
		}) : (this._scrollHost.scrollTop = b, this._scrollHost.scrollLeft = x), this._mountVisible(), !0;
	}
	async _resolveSlideCommentElementBounds(e, t) {
		let n = this._pres;
		if (!n) return;
		let r = (t.anchors ?? []).flatMap((e) => (e.type === "drawingElement" || e.type === "textRange") && e.elementId ? [e.elementId] : []);
		if (r.length === 0) return;
		let i = new Map((this._slots.get(e)?.commentElementBounds ?? []).map((e) => [e.elementId, e.bounds])), a = r.flatMap((e) => {
			let t = i.get(e);
			return t ? [t] : [];
		})[0];
		if (a) return a;
		let o = await n.getElementBoundsByIds(e, r);
		return r.flatMap((e) => {
			let t = o.find((t) => t.elementId === e);
			return t ? [t.bounds] : [];
		})[0];
	}
	async goToComment(e, t, n) {
		if (this._destroyed) throw Error("PptxScrollViewer is destroyed");
		let r = this._pres;
		if (!r || !Number.isInteger(e) || !Number.isInteger(t) || e < 0 || e >= r.slideCount || t < 0) return !1;
		let i = this._beginCommentNavigation();
		if (e >= r.availableSlideCount && !r.layoutComplete && !await this._waitForSlideMetadata(r, e, i)) return !1;
		if (this._destroyed) throw Error("PptxScrollViewer is destroyed");
		if (i !== this._commentNavigationGeneration || r !== this._pres) return !1;
		let a = r.getComments(e)[t];
		if (!a) return !1;
		let o = await this._resolveSlideCommentElementBounds(e, a);
		if (this._destroyed) throw Error("PptxScrollViewer is destroyed");
		if (i !== this._commentNavigationGeneration || r !== this._pres) return !1;
		let s = a.anchors ?? [], c = Number.isFinite(a.x) && Number.isFinite(a.y) && (s.length === 0 || s.some((e) => e.type === "slide"));
		if (!o && !c || (this.scrollToSlide(e, n), !this._scrollToSlideCommentTarget(e, a, n, o))) return !1;
		this._activeCommentId = P(a, t, e), this._activeCommentSlide = e, this._elementContext = null;
		for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
		return this._emitSelectionContextChange(), !0;
	}
	async findText(e, t = {}) {
		let n = this._pres;
		if (!n) return [];
		let r = ++this._findGeneration;
		if (this._findActive = e.length > 0, e.length === 0) return this._find.invalidate(), this._redrawHighlights(), [];
		if (n.layoutComplete || await this._errorRouter.ownBackgroundLifecycle(() => n.waitUntilLayoutComplete()), this._destroyed || r !== this._findGeneration || n !== this._pres) return [];
		let i = await this._errorRouter.ownAwaitable(() => this._find.find(e, t));
		return this._destroyed || r !== this._findGeneration || n !== this._pres ? [] : (this._redrawHighlights(), i);
	}
	async findNext() {
		return this._activateMatch(this._find.next());
	}
	async findPrev() {
		return this._activateMatch(this._find.prev());
	}
	clearFind() {
		this._findActive = !1, this._invalidateFind(), this._redrawHighlights();
	}
	_invalidateFind() {
		this._findGeneration++, this._find.invalidate();
	}
	async _activateMatch(e) {
		return e && this.scrollToSlide(e.location.slide), this._redrawHighlights(), e;
	}
	async _collectSlideRuns(e) {
		return this._pres ? this._pres.collectSlideRuns(e, this._slideWidthPx()) : [];
	}
	_redrawHighlights() {
		for (let [e, t] of this._slots) this._redrawSlotHighlights(e, t);
	}
	_refreshFindRuns(e, t) {
		this._findActive && this._find.setSlideRuns(e, t);
	}
	_redrawSlotComments(e, t) {
		if (!this._pres || !t.commentMarkerLayer) return;
		this._syncCommentMarginGeometry(t.commentMargin);
		let n = this._commentUi;
		if (!n) {
			t.commentMarkerLayer.replaceChildren(), t.commentMargin?.replaceChildren(), t.commentDecorationLayer?.replaceChildren(), t.commentGeometry = null;
			return;
		}
		t.commentGeometry = n.buildPptxCommentMargin(t.commentMarkerLayer, t.commentMargin, this._pres.getComments(e), t.commentElementBounds, e, this._pres.slideWidth, this._pres.slideHeight, this._activeCommentId, (t, n) => {
			let r = n ? t : this._activeCommentId === t ? null : this._activeCommentId;
			if (r !== this._activeCommentId) {
				this._activeCommentId = r, this._activeCommentSlide = r ? e : null, this._elementContext = null;
				for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
				this._emitSelectionContextChange();
			}
		}, this._commentZoom(), $, this._commentsOptions()?.markers !== !1, this._commentsOptions()?.includeResolved === !0, t.commentDecorationLayer ? () => this._scheduleCommentGeometry(e, t, !1) : void 0, t.commentDecorationLayer ? () => this._scheduleCommentGeometry(e, t, !0) : void 0), this._redrawSlotCommentConnectors(e, t);
	}
	_redrawSlotCommentConnectors(e, t) {
		let n = t.commentDecorationLayer, r = t.commentMargin, i = t.commentGeometry, a = this._commentsOptions()?.connectors;
		if (!n || !r || !i || !a) return;
		let o = this._slideWidthPx(), s = this._slideHeightPx(), c = this._commentSide(), l = this._commentMarginExtent(), u = this._commentUi;
		u && u.buildReadOnlyCommentDecoration(n, Object.freeze({
			surfaceBounds: Object.freeze({
				x: c === "left" ? -l : 0,
				y: 0,
				width: o + l,
				height: s
			}),
			contentBounds: Object.freeze({
				x: 0,
				y: 0,
				width: o,
				height: s
			}),
			side: c,
			threads: u.projectReadOnlyCommentMarginScroll(i, r.scrollTop)
		}), {
			route: a.route ?? "bezier",
			stroke: a.stroke ?? "solid",
			color: a.color,
			activeColor: a.activeColor
		});
	}
	_commitSlotComments(e, t) {
		this._ensureSlotCommentAnchors(e, t), this._redrawSlotComments(e, t), t.commentMarkerLayer && (t.commentMarkerLayer.style.visibility = ""), t.commentMargin && (t.commentMargin.style.visibility = ""), t.commentDecorationLayer && (t.commentDecorationLayer.style.visibility = "");
	}
	_ensureSlotCommentAnchors(e, t) {
		let n = this._pres;
		if (!n || t.commentAnchorSlide === e) return;
		t.commentAnchorSlide = e, t.commentElementBounds = Object.freeze([]);
		let r = [...new Set(n.getComments(e).flatMap((e) => (e.anchors ?? []).flatMap((e) => (e.type === "drawingElement" || e.type === "textRange") && e.elementId ? [e.elementId] : [])))];
		if (r.length === 0) return;
		let i = ++t.commentAnchorGeneration;
		n.getElementBoundsByIds(e, r).then((r) => {
			if (this._destroyed || i !== t.commentAnchorGeneration || n !== this._pres || this._slots.get(e) !== t || t.commentAnchorSlide !== e) return;
			t.commentElementBounds = r, this._redrawSlotComments(e, t);
			let a = n.getComments(e).find((t, n) => P(t, n, e) === this._activeCommentId);
			a && this._scrollToSlideCommentTarget(e, a);
		}).catch((e) => {
			!this._destroyed && i === t.commentAnchorGeneration && this._reportRenderError(e);
		});
	}
	_scheduleCommentGeometry(e, t, n = !1) {
		let r = this._pendingCommentGeometry.get(e);
		if (this._pendingCommentGeometry.set(e, {
			slot: t,
			connectorsOnly: r?.slot === t ? r.connectorsOnly && n : n
		}), this._commentGeometryScheduled) return;
		this._commentGeometryScheduled = !0;
		let i = () => {
			this._commentGeometryScheduled = !1, this._commentGeometryFrame = null;
			let e = [...this._pendingCommentGeometry];
			if (this._pendingCommentGeometry.clear(), !this._destroyed) for (let [t, n] of e) {
				let { slot: e, connectorsOnly: r } = n;
				this._slots.get(t) === e && e.renderedScale === this._scale && (r ? this._redrawSlotCommentConnectors(t, e) : this._redrawSlotComments(t, e));
			}
		}, a = this._wrapper.ownerDocument.defaultView;
		a?.requestAnimationFrame ? this._commentGeometryFrame = a.requestAnimationFrame(i) : queueMicrotask(i);
	}
	_redrawSlotHighlights(e, t) {
		if (!this._findActive) {
			t.highlightLayer.innerHTML = "";
			return;
		}
		let n = this._find.slideRuns(e);
		if (!n) {
			t.highlightLayer.innerHTML = "";
			return;
		}
		L(t.highlightLayer, n, this._find.slideHighlights(e), this._slideWidthPx(), this._slideHeightPx(), (e) => this._measureForFind(e), this._opts.findHighlightColors);
	}
	_measureForFind(e) {
		this._findMeasureCtx === void 0 && (this._findMeasureCtx = document.createElement("canvas").getContext("2d"));
		let t = this._findMeasureCtx;
		return !t || typeof t.measureText != "function" ? (e) => e.length : (t.font = e, (e) => t.measureText(e).width);
	}
	_hyperlinkHandler() {
		if (this._opts.enableHyperlinks !== !1) return (e) => this._onHyperlinkClick(e);
	}
	_onHyperlinkClick(e) {
		let t = this._resolveInternalSlideIndex(e);
		if (this._opts.onHyperlinkClick) {
			this._opts.onHyperlinkClick(t);
			return;
		}
		if (t.kind === "external") {
			y(t.url);
			return;
		}
		t.slideIndex !== void 0 && this.scrollToSlide(t.slideIndex);
	}
	_resolveInternalSlideIndex(e) {
		if (e.kind !== "internal" || e.slideIndex !== void 0) return e;
		let t = this._pres?.resolveInternalTarget(e.ref, this._range().topIndex);
		return t === void 0 ? e : {
			...e,
			slideIndex: t
		};
	}
	_onResize() {
		if (!this._pres || this._pres.slideCount === 0) return;
		if (!this._scaleEstablished) {
			this.relayout();
			return;
		}
		if (this._opts.refitOnResize === !1) {
			this._lastFitWidth = this._fitWidthPx(), this._mountVisible();
			return;
		}
		let e = this._baseScale();
		if (e <= 0) return;
		let t = this._fitWidthPx();
		if (t === this._lastFitWidth) {
			this._mountVisible();
			return;
		}
		this._lastFitWidth = t;
		let n = this._prevBase > 0 ? this._scale / this._prevBase : 1;
		this._prevBase = e, this.setScale(e * n), this._mountVisible();
	}
	get topVisibleSlide() {
		return this._lastRange?.topIndex ?? 0;
	}
	mountedSlideIndicesForTest() {
		return [...this._slots.keys()];
	}
	interactiveSlideIndicesForTest() {
		return [...this._slots].filter(([, e]) => e.mediaInteractive).map(([e]) => e);
	}
	scaleForTest() {
		return this._scale;
	}
	baseScaleForTest() {
		return this._baseScale();
	}
	renderEpochForTest() {
		return this._renderEpoch;
	}
	resizeForTest() {
		this._onResize();
	}
	contentAtViewportYForTest(e) {
		let t = this._scrollHost.scrollTop + e, n = this._slideIndexAtOffset(t), r = this._uniformSlideHeight;
		return {
			slide: n,
			frac: r > 0 ? Math.min(1, Math.max(0, (t - this._slideOffset(n)) / r)) : 0
		};
	}
	viewportYOfForTest(e, t) {
		return this._slideOffset(e) + t * this._uniformSlideHeight - this._scrollHost.scrollTop;
	}
	async getResourceMetrics() {
		if (!this._pres) throw Error("Presentation not loaded");
		return await this._pres.getResourceMetrics();
	}
	getSelectionContext(e = {}) {
		if (this._destroyed) throw Error("PptxScrollViewer is destroyed");
		if (this._pres && this._activeCommentId !== null && this._activeCommentSlide !== null) {
			let t = this._pres.getComments(this._activeCommentSlide), n = t.findIndex((e, t) => P(e, t, this._activeCommentSlide) === this._activeCommentId), r = t[n];
			if (r && n >= 0) return Vt(r, this._activeCommentSlide, n, this._activeCommentId, e);
		}
		return (this._opts.enableTextSelection ? X(this._wrapper, this._wrapper.ownerDocument?.getSelection?.() ?? null, e) : null) ?? (this._elementContext ? Pt(this._elementContext, e.maxTextCharacters) : null);
	}
	_emitSelectionContextChange() {
		let e = this.getSelectionContext();
		e?.kind === "text" && (this._elementHitGeneration++, this._elementContext = null, this._redrawElementOutlines());
		let t = JSON.stringify(e);
		t !== this._selectionContextKey && (this._selectionContextKey = t, this._opts.onSelectionContextChange?.(e ? structuredClone(e) : null));
	}
	_setElementContext(e) {
		this._elementContext = e ? structuredClone(e) : null, this._redrawElementOutlines(), this._emitSelectionContextChange();
	}
	_invalidateElementSelection(e = !0) {
		this._elementHitGeneration++, this._elementContext = null, this._redrawElementOutlines(), e && this._emitSelectionContextChange();
	}
	_redrawElementOutlines() {
		for (let [e, t] of this._slots) this._redrawElementOutlineForSlot(e, t);
	}
	_redrawElementOutlineForSlot(e, t) {
		let n = this._elementContext, r = this._pres;
		if (!n || !r || n.slideIndex !== e) {
			E(t.elementLayer, null);
			return;
		}
		E(t.elementLayer, {
			x: n.bounds.x / r.slideWidth,
			y: n.bounds.y / r.slideHeight,
			width: n.bounds.width / r.slideWidth,
			height: n.bounds.height / r.slideHeight,
			rotation: n.bounds.rotation
		});
	}
	async _onElementClick(e) {
		this._destroyed || e.defaultPrevented || e.button !== 0 || await this._resolveContextAt(e);
	}
	_onContextMenu(e) {
		let t;
		this._opts.onContextMenu?.({
			originalEvent: e,
			getContext: () => t ??= this._resolveContextAt(e)
		});
	}
	async _resolveContextAt(e) {
		let t = this._pres;
		if (this._destroyed || !t) return null;
		if (this._opts.enableTextSelection && X(this._wrapper, this._wrapper.ownerDocument?.getSelection?.() ?? null)) return this._emitSelectionContextChange(), this._destroyed ? null : this.getSelectionContext();
		if (!this._opts.enableElementSelection) return this.getSelectionContext();
		let n = e.target, r = [...this._slots].find(([, e]) => n !== null && e.wrapper.contains(n));
		if (!r) return this._invalidateElementSelection(), null;
		let [i, a] = r, o = a.canvas.getBoundingClientRect();
		if (o.width <= 0 || o.height <= 0) return this._invalidateElementSelection(), null;
		let s = e.clientX - o.left, c = e.clientY - o.top;
		if (s < 0 || c < 0 || s > o.width || c > o.height) return this._invalidateElementSelection(), null;
		let l = ++this._elementHitGeneration, u = {
			x: s / o.width * t.slideWidth,
			y: c / o.height * t.slideHeight
		}, d;
		try {
			d = await t.getElementContextAt(i, u, {
				tolerance: this._elementHitTolerance / o.width * t.slideWidth,
				maxTextCharacters: G
			});
		} catch (e) {
			if (this._destroyed || l !== this._elementHitGeneration || t !== this._pres) return null;
			throw e;
		}
		return this._destroyed || l !== this._elementHitGeneration || t !== this._pres ? null : (this._setElementContext(d), this._destroyed ? null : this.getSelectionContext());
	}
	destroy() {
		if (!this._destroyed) {
			this._destroyed = !0, this._beginCommentNavigation(), this._errorRouter.close(), this._invalidateFind(), this._findActive = !1, this._unbindLayoutPresentation(), this._selectionChangeListener &&= (this._wrapper.ownerDocument.removeEventListener("selectionchange", this._selectionChangeListener), null), this._elementHitGeneration++, this._elementClickListener &&= (this._scrollHost.removeEventListener("click", this._elementClickListener), null), this._contextMenuListener &&= (this._scrollHost.removeEventListener("contextmenu", this._contextMenuListener), null), this._commentOutsidePointerListener &&= (this._wrapper.ownerDocument.removeEventListener("pointerdown", this._commentOutsidePointerListener), null), this._commentGeometryFrame !== null && (this._wrapper.ownerDocument.defaultView?.cancelAnimationFrame?.(this._commentGeometryFrame), this._commentGeometryFrame = null), this._commentGeometryScheduled = !1, this._pendingCommentGeometry.clear(), this._elementContext = null, this._scrollListener &&= (this._scrollHost.removeEventListener("scroll", this._scrollListener), null), this._wheelListener &&= (this._scrollHost.removeEventListener("wheel", this._wheelListener), null), this._resizeObserver?.disconnect(), this._resizeObserver = null, this._settleTimer !== null && (clearTimeout(this._settleTimer), this._settleTimer = null);
			for (let [e, t] of [...this._slots]) this._recycleSlot(e, t);
			this._free.length = 0, this._presentationOwner.close(), this._wrapper.remove();
		}
	}
}, $t = /* @__PURE__ */ e({
	OoxmlDecodedImageLimitError: () => Pe,
	OoxmlError: () => C,
	OoxmlResourceLimitError: () => b,
	PptxPresentation: () => J,
	PptxScrollViewer: () => Qt,
	PptxViewer: () => Gt,
	TiffDecodeError: () => Fe,
	autoResize: () => se,
	buildPptxHighlightLayer: () => L,
	buildPptxTextLayer: () => I,
	isOoxmlDecodedImageLimitError: () => Ne,
	isTiffDecodeError: () => Ie,
	openExternalHyperlink: () => y,
	readPptxTextSelectionContext: () => X,
	renderSlide: () => f
});
//#endregion
export { J as a, X as i, Qt as n, L as o, Gt as r, I as s, $t as t };
