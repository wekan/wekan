import { i as e } from "./units-EJdC96r6.js";
import { t } from "./highlight-rect-DBcYVJDv.js";
import { t as n } from "./comment-occurrence-tj54AXXB.js";
import { i as r, n as i, o as a, r as o, t as s } from "./read-only-comment-margin-Cqu-Ir0C.js";
import { i as c, n as l, r as u, t as d } from "./read-only-comment-decoration-Mv_SAiHy.js";
//#region packages/pptx/src/comment-margin.ts
function f(e, t, n) {
	return {
		messageKey: `${t}:reply:${e.id ?? n}`,
		sourceId: e.id,
		author: e.author,
		date: e.date,
		text: e.text,
		status: e.status
	};
}
function p(a, o, l, u, d, p, m, h, g, _, v, y, b = !1, x, S) {
	r(a.ownerDocument), o && (o.dataset.ooxmlCommentZoom = String(_)), a.replaceChildren();
	let C = l.map((e, t) => ({
		comment: e,
		index: t,
		id: n(e, t, d)
	})).filter(({ comment: e }) => b || e.status !== "resolved" && e.status !== "closed"), w = /* @__PURE__ */ new Map(), T = /* @__PURE__ */ new Map(), E = new Map(u.map((e) => [e.elementId, e])), D = a.parentElement;
	for (let [n, r] of C.entries()) {
		let { comment: o, id: s } = r, c = (o.anchors ?? []).flatMap((e) => {
			if (e.type !== "drawingElement" && e.type !== "textRange" || !e.elementId) return [];
			let t = E.get(e.elementId);
			return t ? [t] : [];
		});
		if (h === s) for (let e of c) {
			let n = a.ownerDocument.createElement("div");
			n.dataset.ooxmlCommentTarget = s, n.style.cssText = `left:${t(e.bounds.x, p)};top:${t(e.bounds.y, m)};width:${t(e.bounds.width, p)};height:${t(e.bounds.height, m)};border-width:${2 * _}px;transform:rotate(${e.bounds.rotation}deg);`, a.appendChild(n);
		}
		let l = c[0]?.bounds, u = Number.isFinite(o.x) && Number.isFinite(o.y);
		if (!u && !l) continue;
		let d = Math.max(0, Math.min(l ? l.x + (u ? o.x : l.width) : o.x, p)), f = Math.max(0, Math.min(l ? l.y + (u ? o.y : 0) : o.y, m));
		if (w.set(s, Object.freeze({
			x: d / e * _ - 24 * _ / 2,
			y: f / e * _ - 24 * _ / 2,
			width: 24 * _,
			height: 24 * _
		})), h === s && c.length === 0 && !y) {
			let e = a.ownerDocument.createElement("div");
			e.dataset.ooxmlCommentTarget = s, e.style.cssText = `left:${t(d, p)};top:${t(f, m)};width:${24 * _}px;height:${24 * _}px;border-width:${2 * _}px;border-radius:50%;transform:translate(-50%,-50%);`, a.appendChild(e);
		}
		if (y) {
			let e = i(a.ownerDocument, {
				occurrenceKey: s,
				visibleIndex: n,
				author: o.author,
				active: h === s,
				zoom: _,
				onSetActive: g
			});
			e.style.left = t(d, p), e.style.top = t(f, m), a.appendChild(e), T.set(s, e);
		}
	}
	let O = C.map(({ comment: e, id: t }) => ({
		occurrenceKey: t,
		root: {
			messageKey: `${t}:root`,
			sourceId: e.id,
			author: e.author,
			date: e.date,
			text: e.text,
			status: e.status
		},
		replies: e.replies?.map((e, n) => f(e, t, n)) ?? []
	})), k = o ? s(o, O, {
		activeId: h,
		zoom: _,
		logicalWidth: v,
		onSetActive: g,
		onGeometryChange: x,
		onScrollGeometryChange: S,
		preferredTopById: new Map(O.map((e) => {
			let t = w.get(e.occurrenceKey);
			return [e.occurrenceKey, t?.y ?? 0];
		}))
	}) : /* @__PURE__ */ new Map();
	for (let e of C) {
		let t = k.get(e.id), n = T.get(e.id);
		t?.id && n && n.setAttribute("aria-controls", t.id);
	}
	if (!x && !S) return Object.freeze({
		threads: Object.freeze(O.map((e) => {
			let t = w.get(e.occurrenceKey);
			return Object.freeze({
				occurrenceKey: e.occurrenceKey,
				active: h === e.occurrenceKey,
				anchorRects: Object.freeze(t ? [t] : [])
			});
		})),
		scrollTop: o?.scrollTop ?? 0
	});
	let A = o && D ? c(o, D) : void 0, j = Object.freeze(O.map((e) => {
		let t = k.get(e.occurrenceKey), n = t && D ? c(t, D) : void 0, r = w.get(e.occurrenceKey);
		return Object.freeze({
			occurrenceKey: e.occurrenceKey,
			active: h === e.occurrenceKey,
			anchorRects: Object.freeze(r ? [r] : []),
			...n ? { cardRect: n } : {}
		});
	}));
	return Object.freeze({
		threads: j,
		...A ? { cardClipBounds: A } : {},
		scrollTop: o?.scrollTop ?? 0
	});
}
//#endregion
export { p as buildPptxCommentMargin, d as buildReadOnlyCommentDecoration, l as disposeReadOnlyCommentDecoration, o as disposeReadOnlyCommentMargin, a as previewReadOnlyCommentMargin, u as projectReadOnlyCommentMarginScroll };
