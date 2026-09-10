import { t as e } from "./highlight-rect-DBcYVJDv.js";
import { o as t } from "./source-key-BkBB3X82.js";
import { n } from "./comments-Brfxa3hQ.js";
import { i as r, n as i, o as a, r as o, s, t as c } from "./read-only-comment-margin-Cqu-Ir0C.js";
import { i as l, n as u, r as d, t as f } from "./read-only-comment-decoration-Mv_SAiHy.js";
//#region packages/docx/src/comment-margin.ts
function p(e, r) {
	let i = /* @__PURE__ */ new Set();
	for (let e of r) e.source && i.add(t(e.source));
	if (i.size === 0) return [];
	let a = [];
	for (let o of e) {
		if (!(i.has(t(o.source)) || i.has(t(o.reference.source)) || o.geometryFallback !== void 0 && i.has(t(o.geometryFallback.source)))) continue;
		let e = n(o, r);
		e.length > 0 && a.push({
			anchor: o,
			runs: e
		});
	}
	return a;
}
function m(e, t) {
	let n = new Map(e.map((e) => [e.id, e])), r = e.filter((e) => e.parentId === void 0), i = /* @__PURE__ */ new Map();
	for (let t of e) {
		if (t.parentId === void 0) continue;
		let e = t, r = new Set([e.id]);
		for (; e.parentId !== void 0;) {
			let i = n.get(e.parentId);
			if (!i || r.has(i.id)) {
				e = t;
				break;
			}
			r.add(i.id), e = i;
		}
		if (e.parentId !== void 0 || e === t) continue;
		let a = i.get(e.id) ?? [];
		i.has(e.id) || i.set(e.id, a), a.push(t);
	}
	return r.filter((e) => t || e.resolved !== !0).map((e) => ({
		root: e,
		replies: Object.freeze(i.get(e.id) ?? [])
	}));
}
function h(e, t, n) {
	return {
		messageKey: n === 0 ? `${t}:root` : `${t}:reply:${e.id || n - 1}`,
		sourceId: e.id,
		author: e.author,
		date: e.date,
		text: e.paragraphs?.join("\n") ?? e.text,
		status: e.resolved ? "resolved" : "active"
	};
}
function g(t, n, r, i, a, o) {
	let s = t.ownerDocument.createElement("div");
	return s.style.cssText = `--ooxml-comment-author-accent:${o};left:${e(n.x, r)};top:${e(n.y, i)};width:${e(n.w, r)};height:${e(n.h, i)};`, s.dataset.ooxmlCommentHighlight = "", s.dataset.active = String(a), n.transform && (s.style.transform = n.transform), t.appendChild(s), s;
}
function _(e) {
	let t = e.highlightBounds;
	return {
		...e,
		x: t?.x ?? e.x,
		y: t?.y ?? e.y,
		w: t?.width ?? e.w,
		h: t?.height ?? e.h
	};
}
function v(e) {
	let t = [];
	for (let n of e) {
		let e = t.at(-1);
		if (e && e.y === n.y && e.h === n.h && e.transform === n.transform) {
			let r = Math.min(e.x, n.x), i = Math.max(e.x + e.w, n.x + n.w);
			t[t.length - 1] = {
				...e,
				x: r,
				w: i - r
			};
			continue;
		}
		t.push({ ...n });
	}
	return t;
}
function y(e, t, n, a, o, u, d, f, y, b, x, S = !1, C, w) {
	r(e.ownerDocument), t && (t.dataset.ooxmlCommentZoom = String(y)), e.innerHTML = "";
	let T = m(a.comments, S), E = new Map(T.map((e) => [e.root.id, s(e.root.author)])), D = new Set(T.map((e) => e.root.id)), O = /* @__PURE__ */ new Map();
	for (let e of a.anchors) D.has(e.commentId) && !O.has(e.commentId) && O.set(e.commentId, e);
	let k = p(a.anchors, n), A = new Set(k.map(({ anchor: e }) => e)), j = /* @__PURE__ */ new Map(), M = /* @__PURE__ */ new Map(), N = e.parentElement;
	for (let { anchor: t, runs: n } of k) {
		if (!D.has(t.commentId)) continue;
		let r = d === t.commentId;
		for (let i of v(n.map(_))) {
			let n = g(e, i, o, u, r, E.get(t.commentId) ?? s(void 0)), a = i.transform && N ? l(n, N) : Object.freeze({
				x: i.x,
				y: i.y,
				width: i.w,
				height: i.h
			}), c = j.get(t.commentId) ?? [];
			j.has(t.commentId) || j.set(t.commentId, c);
			let d = a ?? Object.freeze({
				x: i.x,
				y: i.y,
				width: i.w,
				height: i.h
			});
			c.push(d), M.has(t.commentId) || M.set(t.commentId, Object.freeze({
				rect: d,
				...i.direction ? { direction: i.direction } : {}
			}));
		}
	}
	let P = T.flatMap((e) => {
		let t = O.get(e.root.id);
		return !t || !A.has(t) ? [] : [{
			occurrenceKey: e.root.id,
			root: h(e.root, e.root.id, 0),
			replies: e.replies.map((t, n) => h(t, e.root.id, n + 1))
		}];
	}), F = t ? c(t, P, {
		activeId: d,
		zoom: y,
		logicalWidth: b,
		onSetActive: f,
		onGeometryChange: C,
		onScrollGeometryChange: w,
		preferredTopById: new Map(P.map((e) => {
			let t = j.get(e.occurrenceKey)?.[0];
			return [e.occurrenceKey, t?.y ?? 0];
		}))
	}) : /* @__PURE__ */ new Map();
	if (x) for (let [t, n] of P.entries()) {
		let r = M.get(n.occurrenceKey);
		if (!r) continue;
		let a = i(e.ownerDocument, {
			occurrenceKey: n.occurrenceKey,
			visibleIndex: t,
			author: n.root.author,
			active: d === n.occurrenceKey,
			zoom: y,
			onSetActive: f
		}), s = 24 * y / 2, c = 4 * y, l = e.ownerDocument.defaultView?.getComputedStyle?.(e).direction, p = (r.direction ?? l) === "rtl" ? r.rect.x - c - s : r.rect.x + r.rect.width + c + s, m = Math.max(s, Math.min(p, o - s)), h = Math.max(s, Math.min(r.rect.y + r.rect.height / 2, u - s));
		a.style.left = `${m / o * 100}%`, a.style.top = `${h / u * 100}%`;
		let g = F.get(n.occurrenceKey);
		g?.id && a.setAttribute("aria-controls", g.id), e.appendChild(a);
	}
	if (!C && !w) return Object.freeze({
		threads: Object.freeze(P.map((e) => Object.freeze({
			occurrenceKey: e.occurrenceKey,
			active: d === e.occurrenceKey,
			anchorRects: Object.freeze(j.get(e.occurrenceKey) ?? [])
		}))),
		scrollTop: t?.scrollTop ?? 0
	});
	let I = t && N ? l(t, N) : void 0, L = Object.freeze(P.map((e) => {
		let t = F.get(e.occurrenceKey), n = t && N ? l(t, N) : void 0;
		return Object.freeze({
			occurrenceKey: e.occurrenceKey,
			active: d === e.occurrenceKey,
			anchorRects: Object.freeze(j.get(e.occurrenceKey) ?? []),
			...n ? { cardRect: n } : {}
		});
	}));
	return Object.freeze({
		threads: L,
		...I ? { cardClipBounds: I } : {},
		scrollTop: t?.scrollTop ?? 0
	});
}
//#endregion
export { y as buildDocxCommentMargin, f as buildReadOnlyCommentDecoration, u as disposeReadOnlyCommentDecoration, o as disposeReadOnlyCommentMargin, a as previewReadOnlyCommentMargin, d as projectReadOnlyCommentMarginScroll };
