import { o as e } from "./source-key-BkBB3X82.js";
//#region packages/docx/src/review-id.ts
function t(e) {
	if (e === void 0) return;
	let t = e.replace(/^[\t\n\r ]+|[\t\n\r ]+$/g, "");
	if (/^[+-]?\d+$/.test(t)) try {
		return BigInt(t).toString();
	} catch {
		return;
	}
}
//#endregion
//#region packages/docx/src/comments.ts
function n(e) {
	return Object.freeze({
		...e,
		path: Object.freeze([...e.path])
	});
}
function r(e) {
	return Object.freeze({
		source: n(e.source),
		runIndex: e.boundary,
		affinity: e.boundary < e.runCount ? "following" : "preceding"
	});
}
function i(e, t) {
	let n = e.runs, r = 0;
	for (let e = 0; e < Math.min(t, n.length); e += 1) n[e]?.type !== "unavailableDrawing" && (r += 1);
	return r;
}
function a(e, t, i, a, o = t.boundary) {
	return Object.freeze({
		commentId: e,
		source: n(t.source),
		startRunIndex: t.boundary,
		endRunIndex: o,
		reference: r(i),
		...a === void 0 ? {} : { geometryFallback: Object.freeze({
			source: n(a.source),
			sourceRunIndex: a.boundary
		}) }
	});
}
function o(t, n) {
	let r = t.flatMap(({ paragraph: t, source: r }, a) => {
		let o = i(t, t.runs.length);
		return [...n.get(e(r)) ?? []].sort((e, t) => e - t).map((e) => ({
			paragraphIndex: a,
			source: r,
			boundary: e,
			runCount: o
		}));
	});
	return {
		locations: r,
		paragraphIndices: new Set(r.map(({ paragraphIndex: e }) => e))
	};
}
function s(e, t) {
	return e.paragraphIndex - t.paragraphIndex || e.boundary - t.boundary;
}
function c(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + Math.floor((r - n) / 2);
		s(e[i], t) < 0 ? n = i + 1 : r = i;
	}
	return n;
}
function l(e, t) {
	if (t.paragraphIndices.has(e.paragraphIndex)) return;
	let n = c(t.locations, e), i = t.locations[n], a = n > 0 ? t.locations[n - 1] : void 0;
	return r(e).affinity === "following" ? i ?? a : a ?? i;
}
function u(e, n, r) {
	let s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set();
	for (let e of n) {
		let n = t(e);
		n === void 0 || c.has(n) || (s.has(n) ? (s.delete(n), c.add(n)) : s.set(n, e));
	}
	let u = /* @__PURE__ */ new Map();
	for (let [n, { paragraph: r, source: a }] of e.entries()) for (let e of r.commentMarks ?? []) {
		let o = t(e.id);
		if (o === void 0) continue;
		let s = u.get(o) ?? {
			starts: [],
			ends: [],
			references: []
		};
		u.set(o, s);
		let c = {
			paragraphIndex: n,
			source: a,
			boundary: i(r, e.runIndex),
			runCount: i(r, r.runs.length)
		};
		e.kind === "rangeStart" ? s.starts.push(c) : e.kind === "rangeEnd" ? s.ends.push(c) : e.kind === "reference" && s.references.push(c);
	}
	let d = [], f = o(e, r);
	for (let [t, n] of u) {
		let r = s.get(t);
		if (r === void 0 || n.references.length !== 1) continue;
		let o = n.references[0];
		if (n.starts.length > 1 || n.ends.length > 1) continue;
		let c = n.starts.length === 1 ? n.starts[0] : void 0, u = n.ends.length === 1 ? n.ends[0] : void 0;
		if (c && u && (c.paragraphIndex < u.paragraphIndex || c.paragraphIndex === u.paragraphIndex && c.boundary <= u.boundary)) {
			let t = l(c.paragraphIndex === u.paragraphIndex && c.boundary === u.boundary ? c : o, f);
			for (let n = c.paragraphIndex; n <= u.paragraphIndex; n += 1) {
				let s = e[n], l = n === c.paragraphIndex ? c.boundary : 0, f = n === u.paragraphIndex ? u.boundary : i(s.paragraph, s.paragraph.runs.length);
				d.push(a(r, {
					paragraphIndex: n,
					source: s.source,
					boundary: l,
					runCount: i(s.paragraph, s.paragraph.runs.length)
				}, o, t, Math.max(l, f)));
			}
			continue;
		}
		let p = c && n.ends.length === 0 ? c : u && n.starts.length === 0 ? u : void 0;
		if (c && u) continue;
		let m = p ?? o, h = l(m, f);
		d.push(a(r, m, o, h));
	}
	return d;
}
function d(e, t, n = /* @__PURE__ */ new Map()) {
	let r = new Set(e.map(({ id: e }) => e)), i = /* @__PURE__ */ new Map();
	for (let e of t.blocks.sources) {
		let n = t.blocks.resolve(e);
		if (n.type !== "paragraph") continue;
		let r = `${e.story}\u0000${e.storyInstance}`, a = i.get(r) ?? [];
		i.has(r) || i.set(r, a), a.push({
			paragraph: n,
			source: e
		});
	}
	return [...i.values()].flatMap((e) => u(e, r, n));
}
function f(t, n, r = /* @__PURE__ */ new Map(), i = {}) {
	if ((t?.length ?? 0) === 0) return [];
	let a = d(t ?? [], n, r), o = i.completedSourceKeys;
	return o === void 0 ? a : a.filter((t) => {
		let n = r.get(e(t.source)) ?? /* @__PURE__ */ new Set(), i = t.startRunIndex < t.endRunIndex ? [...n].some((e) => e >= t.startRunIndex && e < t.endRunIndex) : n.has(t.reference.affinity === "following" ? t.startRunIndex : t.startRunIndex - 1), a = r.get(e(t.reference.source))?.has(t.reference.affinity === "following" ? t.reference.runIndex : t.reference.runIndex - 1) === !0;
		return i || a || o.has(e(t.source)) || o.has(e(t.reference.source));
	});
}
function p(e, t) {
	return e !== void 0 && e.story === t.story && e.storyInstance === t.storyInstance && e.path.length === t.path.length && e.path.every((e, n) => e === t.path[n]);
}
function m(e, t) {
	let n = t.filter((t) => t.sourceRunIndex !== void 0 && p(t.source, e.source)), r = n.filter((t) => t.sourceRunIndex >= e.startRunIndex && t.sourceRunIndex < e.endRunIndex);
	if (r.length > 0) return r;
	if (e.startRunIndex === e.endRunIndex && n.length > 0) {
		let t = n.reduce((t, n) => {
			let r = n.sourceRunIndex;
			return r < e.startRunIndex ? t : t === void 0 || r < t ? r : t;
		}, void 0), r = n.reduce((t, n) => {
			let r = n.sourceRunIndex;
			return r >= e.startRunIndex ? t : t === void 0 || r > t ? r : t;
		}, void 0), i = t ?? r;
		if (i !== void 0) return n.filter((e) => e.sourceRunIndex === i);
	}
	let i = t.filter((t) => t.sourceRunIndex !== void 0 && p(t.source, e.reference.source)), a = i.reduce((t, n) => {
		let r = n.sourceRunIndex;
		return r < e.reference.runIndex ? t : t === void 0 || r < t ? r : t;
	}, void 0), o = i.reduce((t, n) => {
		let r = n.sourceRunIndex;
		return r >= e.reference.runIndex ? t : t === void 0 || r > t ? r : t;
	}, void 0), s = e.reference.affinity === "following" ? a ?? o : o ?? a;
	if (s !== void 0) return i.filter((e) => e.sourceRunIndex === s);
	let c = e.geometryFallback;
	return c === void 0 ? [] : t.filter((e) => e.sourceRunIndex === c.sourceRunIndex && p(e.source, c.source));
}
function h(e, t) {
	return t.some((t) => t.sourceRunIndex !== void 0 && p(t.source, e.source) && t.sourceRunIndex >= e.startRunIndex && t.sourceRunIndex < e.endRunIndex) ? "range" : t.some((t) => p(t.source, e.source) || p(t.source, e.reference.source)) ? "point" : "fallback";
}
function g(e) {
	let t = e.map((e) => {
		let t = e.highlightBounds;
		return {
			x: t?.x ?? e.x,
			y: t?.y ?? e.y,
			width: t?.width ?? e.w,
			height: t?.height ?? e.h,
			...e.transform ? { transform: e.transform } : {}
		};
	}).filter(({ width: e, height: t }) => e > 0 && t > 0).sort((e, t) => e.y - t.y || e.x - t.x), n = [];
	for (let e of t) {
		let t = n.at(-1);
		if (t && t.y === e.y && t.height === e.height && t.transform === e.transform) {
			let r = Math.min(t.x, e.x), i = Math.max(t.x + t.width, e.x + e.width);
			n[n.length - 1] = Object.freeze({
				...t,
				x: r,
				width: i - r
			});
		} else n.push(Object.freeze({ ...e }));
	}
	return Object.freeze(n);
}
function _(t, n, r, i = {}) {
	let a = new Map(t.map((e) => [e.id, e])), o = t.filter((e) => e.parentId === void 0), s = new Map(o.map((e) => [e.id, e])), c = /* @__PURE__ */ new Map(), l = new Map(o.map((e) => [e.id, e.id]));
	for (let e of t) {
		if (e.parentId === void 0) continue;
		let t = new Set([e.id]), n = e;
		for (; n.parentId !== void 0;) {
			let r = a.get(n.parentId);
			if (!r || t.has(r.id)) {
				n = e;
				break;
			}
			t.add(r.id), n = r;
		}
		if (!s.has(n.id) || n === e) continue;
		l.set(e.id, n.id);
		let r = c.get(n.id) ?? [];
		c.has(n.id) || c.set(n.id, r), r.push(e);
	}
	let u = /* @__PURE__ */ new Set();
	for (let t of r) t.source && u.add(e(t.source));
	let d = /* @__PURE__ */ new Map();
	for (let t of n) {
		let n = l.get(t.commentId);
		if (n === void 0 || !(u.has(e(t.source)) || u.has(e(t.reference.source)) || t.geometryFallback !== void 0 && u.has(e(t.geometryFallback.source)))) continue;
		let i = m(t, r);
		if (i.length === 0) continue;
		let a = d.get(n) ?? [];
		d.has(n) || d.set(n, a), a.push(Object.freeze({
			anchor: t,
			kind: h(t, i),
			rects: g(i)
		}));
	}
	return Object.freeze(o.flatMap((e) => {
		if (i.includeResolved === !1 && e.resolved === !0) return [];
		let t = d.get(e.id);
		return t?.length ? [Object.freeze({
			root: e,
			replies: Object.freeze([...c.get(e.id) ?? []]),
			anchors: Object.freeze([...t])
		})] : [];
	}));
}
//#endregion
export { t as i, m as n, _ as r, f as t };
