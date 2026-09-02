//#region packages/core/src/internal/dom-geometry.ts
function e(e, t) {
	let n = Math.max(e.x, t.x), r = Math.max(e.y, t.y), i = Math.min(e.x + e.width, t.x + t.width), a = Math.min(e.y + e.height, t.y + t.height);
	if (!(i <= n || a <= r)) return Object.freeze({
		x: n,
		y: r,
		width: i - n,
		height: a - r
	});
}
function t(e, t) {
	let n = e.getBoundingClientRect(), r = t.getBoundingClientRect();
	if ([
		n.left,
		n.top,
		n.width,
		n.height,
		r.left,
		r.top
	].every(Number.isFinite) && !(n.width <= 0 || n.height <= 0)) return Object.freeze({
		x: n.left - r.left,
		y: n.top - r.top,
		width: n.width,
		height: n.height
	});
}
//#endregion
//#region packages/core/src/internal/read-only-comment-decoration.ts
function n(t, n) {
	let r = t.scrollTop - n;
	return Object.freeze(t.threads.map((n) => {
		if (!n.cardRect) return n;
		let i = Object.freeze({
			...n.cardRect,
			y: n.cardRect.y + r
		}), a = t.cardClipBounds ? e(i, t.cardClipBounds) : i, { cardRect: o, ...s } = n;
		return Object.freeze({
			...s,
			...a ? { cardRect: a } : {}
		});
	}));
}
var r = "http://www.w3.org/2000/svg", i = /* @__PURE__ */ new WeakMap();
function a(e) {
	let t = Math.round(e * 1e3) / 1e3;
	return Object.is(t, -0) ? "0" : String(t);
}
function o(e, t) {
	let n = (t.x - e.x) * .5;
	return [{
		x: e.x + n,
		y: e.y
	}, {
		x: t.x - n,
		y: t.y
	}];
}
function s(e, t, n) {
	let r = e.x + (t.x - e.x) * .55;
	if (n === "orthogonal") return `M ${a(e.x)} ${a(e.y)} H ${a(r)} V ${a(t.y)} H ${a(t.x)}`;
	let [i, s] = o(e, t);
	return `M ${a(e.x)} ${a(e.y)} C ${a(i.x)} ${a(i.y)}, ${a(s.x)} ${a(s.y)}, ${a(t.x)} ${a(t.y)}`;
}
function c(e) {
	i.delete(e), e.replaceChildren();
}
function l(e, t, n) {
	e.dataset.ooxmlCommentConnectors = "";
	let a = i.get(e);
	if (!a) {
		let t = e.ownerDocument.createElementNS(r, "svg");
		t.setAttribute("aria-hidden", "true"), t.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;", a = {
			svg: t,
			paths: /* @__PURE__ */ new Map()
		}, i.set(e, a), e.replaceChildren(t);
	}
	a.svg.setAttribute("viewBox", `${t.surfaceBounds.x} ${t.surfaceBounds.y} ${t.surfaceBounds.width} ${t.surfaceBounds.height}`);
	let o = [], c = /* @__PURE__ */ new Set();
	for (let i of t.threads) {
		let l = i.anchorRects.at(-1), u = i.cardRect;
		if (!l || !u) continue;
		c.add(i.occurrenceKey);
		let d = t.side === "left" ? l.x : l.x + l.width, f = l.y + l.height / 2, p = t.side === "left" ? u.x + u.width : u.x, m = u.y + Math.min(u.height / 2, 25), h = a.paths.get(i.occurrenceKey);
		h || (h = e.ownerDocument.createElementNS(r, "path"), a.paths.set(i.occurrenceKey, h)), h.dataset.ooxmlCommentConnector = i.occurrenceKey, h.dataset.active = String(i.active), h.setAttribute("d", s({
			x: d,
			y: f
		}, {
			x: p,
			y: m
		}, n.route)), h.style.cssText = `fill:none;vector-effect:non-scaling-stroke;stroke:${i.active ? n.activeColor ?? n.color ?? "#2563eb" : n.color ?? "#94a3b8"};stroke-width:${i.active ? "1.5px" : "1px"};stroke-dasharray:${n.stroke === "dashed" ? "4 4" : "none"};opacity:${i.active ? ".9" : ".45"};`, o.push(h);
	}
	for (let [e, t] of [...a.paths]) c.has(e) || (a.paths.delete(e), t.remove());
	(o.length !== a.svg.children.length || o.some((e, t) => a.svg.children[t] !== e)) && a.svg.replaceChildren(...o);
}
//#endregion
export { t as i, c as n, n as r, l as t };
