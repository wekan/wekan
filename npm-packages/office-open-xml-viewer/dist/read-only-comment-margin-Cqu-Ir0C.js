//#region packages/core/src/internal/read-only-comment-margin.ts
var e = 1, t = "\n:where(.ooxml-comment-marker) {\n  padding: 0;\n  border: 0;\n  cursor: pointer;\n  pointer-events: auto;\n  background: transparent;\n  box-shadow: none;\n  color: var(--ooxml-comment-marker-color, var(--ooxml-comment-author-accent));\n}\n:where([data-ooxml-comment-highlight]) {\n  position: absolute;\n  pointer-events: none;\n  background: var(--ooxml-comment-highlight, color-mix(in srgb, var(--ooxml-comment-author-accent) 18%, transparent));\n  transform-origin: top left;\n}\n:where([data-ooxml-comment-highlight][data-active=\"true\"]) {\n  background: var(--ooxml-comment-highlight-active, color-mix(in srgb, var(--ooxml-comment-author-accent) 34%, transparent));\n}\n:where([data-ooxml-comment-target]) {\n  position: absolute;\n  box-sizing: border-box;\n  pointer-events: none;\n  border-style: solid;\n  border-color: var(--ooxml-comment-target-border, #2563eb);\n  background: var(--ooxml-comment-target-background, rgba(37, 99, 235, .06));\n  transform-origin: center;\n}\n:where(.ooxml-comment-card) {\n  position: relative;\n  display: block;\n  width: 100%;\n  margin: 0 0 var(--ooxml-comment-card-gap, .42em);\n  box-sizing: border-box;\n  padding: var(--ooxml-comment-card-padding, .56em .68em);\n  border: 0;\n  border-radius: var(--ooxml-comment-card-radius, .3em);\n  text-align: start;\n  cursor: default;\n  font: inherit;\n  outline: none;\n  background: var(--ooxml-comment-card-background, #fff);\n  box-shadow: var(--ooxml-comment-card-shadow, none);\n}\n:where(button.ooxml-comment-card) {\n  cursor: pointer;\n}\n:where(.ooxml-comment-card[data-standalone=\"true\"]) {\n  position: absolute;\n  width: max-content;\n  max-width: 100%;\n  margin: 0;\n  z-index: 3;\n  pointer-events: none;\n  overflow: hidden;\n  font-size: 13px;\n}\n:where(.ooxml-comment-card[data-active=\"true\"]) {\n  background: var(--ooxml-comment-card-active-background, #eff6ff);\n  box-shadow: var(--ooxml-comment-card-active-shadow, none);\n}\n:where(.ooxml-comment-card[data-focused=\"true\"]) {\n  box-shadow: var(--ooxml-comment-card-focus-shadow, 0 0 0 .12em rgba(37, 99, 235, .65));\n}\n:where(.ooxml-comment-card [data-ooxml-comment-part=\"content\"]) {\n  min-width: 0;\n  flex: 1;\n}\n:where(.ooxml-comment-card [data-ooxml-comment-part=\"identity\"]) {\n  display: flex;\n  align-items: baseline;\n  gap: .48em;\n  min-width: 0;\n}\n:where(.ooxml-comment-card__author) {\n  min-width: 0;\n  font: 700 .84em/1.3 var(--ooxml-comment-font-family, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif);\n  color: var(--ooxml-comment-author-color, #0f172a);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n:where(.ooxml-comment-card__date) {\n  font: 500 .66em/1.35 var(--ooxml-comment-date-font-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);\n  color: var(--ooxml-comment-muted-color, #64748b);\n  white-space: nowrap;\n}\n:where(.ooxml-comment-card__body) {\n  margin-top: .28em;\n  font: 400 .84em/1.45 var(--ooxml-comment-font-family, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif);\n  color: var(--ooxml-comment-body-color, #334155);\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n:where(.ooxml-comment-card__reply) {\n  margin: .55em 0 0 .45em;\n  padding: .08em 0 0 .65em;\n  border-left: .08em solid var(--ooxml-comment-reply-border, rgba(100, 116, 139, .24));\n}\n:where(.ooxml-comment-card [data-ooxml-comment-part=\"frame\"]) {\n  position: absolute;\n  inset: 0;\n  box-sizing: border-box;\n  pointer-events: none;\n  border-radius: inherit;\n  border: var(--ooxml-comment-card-border, 1px solid rgba(148, 163, 184, .34));\n  border-left: var(--ooxml-comment-card-border-left, .14em solid var(--ooxml-comment-author-accent));\n  border-right: var(--ooxml-comment-card-border-right, var(--ooxml-comment-card-border, 1px solid rgba(148, 163, 184, .34)));\n}\n:where(.ooxml-comment-card[data-active=\"true\"] [data-ooxml-comment-part=\"frame\"]) {\n  border: var(--ooxml-comment-card-active-border, 1px solid rgba(37, 99, 235, .5));\n  border-left: var(--ooxml-comment-card-border-left, .14em solid var(--ooxml-comment-author-accent));\n  border-right: var(--ooxml-comment-card-border-right, var(--ooxml-comment-card-active-border, 1px solid rgba(37, 99, 235, .5)));\n}\n:where([data-ooxml-comment-ui=\"margin\"] > [data-ooxml-comment-item]) {\n  position: absolute;\n  left: 0;\n  padding: 0 .14em;\n  box-sizing: border-box;\n  transform-origin: 0 0;\n}\n:where([data-ooxml-comment-ui=\"margin\"] > [data-ooxml-comment-item]:last-child > .ooxml-comment-card) {\n  margin-bottom: 0;\n}\n";
function n(e) {
	let n = e.head;
	if (!n || n.querySelector("style[data-ooxml-comment-styles]")) return;
	let r = e.createElement("style");
	r.dataset.ooxmlCommentStyles = "", r.textContent = t, n.appendChild(r);
}
function r(e) {
	if (!e) return "#2563eb";
	let t = 2166136261;
	for (let n of e.normalize("NFKC")) t ^= n.codePointAt(0) ?? 0, t = Math.imul(t, 16777619);
	return `hsl(${(t >>> 0) % 360} 68% 42%)`;
}
function i(e, t) {
	n(e);
	let i = e.createElement("button");
	return i.type = "button", i.setAttribute("class", "ooxml-comment-marker"), i.dataset.ooxmlCommentId = t.occurrenceKey, i.dataset.ooxmlCommentMarker = "", i.dataset.active = String(t.active), i.setAttribute("aria-label", `Comment ${t.visibleIndex + 1}`), i.setAttribute("aria-pressed", String(t.active)), i.style.cssText = `--ooxml-comment-author-accent:${r(t.author)};position:absolute;transform:translate(-50%,-50%);width:${24 * t.zoom}px;height:${24 * t.zoom}px;`, i.innerHTML = "<svg viewBox=\"0 0 24 24\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><path fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M18 4C18.7956 4 19.5587 4.31607 20.1213 4.87868C20.6839 5.44129 21 6.20435 21 7V15C21 15.7956 20.6839 16.5587 20.1213 17.1213C19.5587 17.6839 18.7956 18 18 18H13L8 21V18H6C5.20435 18 4.44129 17.6839 3.87868 17.1213C3.31607 16.5587 3 15.7956 3 15V7C3 6.20435 3.31607 5.44129 3.87868 4.87868C4.44129 4.31607 5.20435 4 6 4H18Z\"/></svg>", i.addEventListener("click", () => t.onSetActive(t.occurrenceKey, !t.active)), i;
}
var a = /* @__PURE__ */ new WeakMap();
function o(e, t) {
	t && typeof t.unobserve == "function" && t.unobserve(e.card), e.card.removeEventListener("click", e.onClick), e.card.removeEventListener("focus", e.onFocus), e.card.removeEventListener("blur", e.onBlur), e.item.remove();
}
function s(e) {
	let t = a.get(e);
	a.delete(e);
	for (let e of t?.cards.values() ?? []) o(e, t?.resizeObserver);
	t?.cards.clear(), t && e.removeEventListener("scroll", t.onScroll), t?.resizeObserver?.disconnect(), e.replaceChildren();
}
function c(e, t) {
	let n = a.get(e);
	if (!n || n.cards.size === 0 || !Number.isFinite(t) || t <= 0) return !1;
	let r = Number.parseFloat(e.dataset.ooxmlCommentZoom ?? ""), i = Number.isFinite(r) && r > 0 ? r : n.zoom * t;
	for (let e of n.cards.values()) e.item.style.top = `${e.committedTop * i}px`, e.item.style.transform = `scale(${i})`;
	return !0;
}
function l(e, t = "") {
	let n = e.createElement("div");
	return n.style.cssText = t, n;
}
function u(e) {
	if (!e) return;
	let t = new Date(e);
	return Number.isFinite(t.getTime()) ? new Intl.DateTimeFormat(void 0, {
		dateStyle: "medium",
		timeStyle: "short"
	}).format(t) : e;
}
function d(e, t) {
	return e.messageKey === t.messageKey && e.sourceId === t.sourceId && e.author === t.author && e.date === t.date && e.text === t.text && e.status === t.status;
}
function f(e, t) {
	return e.occurrenceKey === t.occurrenceKey && d(e.root, t.root) && e.replies.length === t.replies.length && e.replies.every((e, n) => d(e, t.replies[n]));
}
function p(e, t, n) {
	let r = e.map((e, t) => ({
		...e,
		index: t
	})).sort((e, t) => e.preferredTop - t.preferredTop || e.index - t.index), i = Math.max(0, n), a = r.reduce((e, t) => e + Math.max(0, t.height), 0) + i * Math.max(0, r.length - 1);
	if (t <= 0 || a > t) {
		let e = 0;
		return new Map(r.map((t) => {
			let n = [t.occurrenceKey, e];
			return e += Math.max(0, t.height) + i, n;
		}));
	}
	let o = r.map((e) => Math.max(0, Math.min(e.preferredTop, t - e.height)));
	for (let e = 1; e < r.length; e++) {
		let t = o[e - 1] + r[e - 1].height + i;
		o[e] = Math.max(o[e], t);
	}
	if (r.length > 0) {
		let e = r.length - 1;
		o[e] = Math.min(o[e], t - r[e].height);
		for (let t = e - 1; t >= 0; t--) o[t] = Math.min(o[t], o[t + 1] - i - r[t].height);
		if (o[0] < 0) {
			let e = -o[0];
			for (let t = 0; t < o.length; t++) o[t] += e;
		}
	}
	return new Map(r.map((e, t) => [e.occurrenceKey, o[t]]));
}
function m(e, t, n) {
	let r = e.ownerDocument, i = l(r);
	n && i.setAttribute("class", "ooxml-comment-card__reply"), i.dataset.ooxmlCommentPart = n ? "reply" : "comment";
	let a = l(r);
	a.dataset.ooxmlCommentPart = "content";
	let o = l(r);
	o.dataset.ooxmlCommentPart = "identity";
	let s = l(r);
	s.setAttribute("class", "ooxml-comment-card__author"), s.dataset.ooxmlCommentPart = "author", s.textContent = t.author || "Comment", o.appendChild(s);
	let c = u(t.date);
	if (c) {
		let e = l(r);
		e.setAttribute("class", "ooxml-comment-card__date"), e.dataset.ooxmlCommentPart = "date", e.textContent = c, e.setAttribute("title", t.date), o.appendChild(e);
	}
	let d = l(r);
	d.setAttribute("class", "ooxml-comment-card__body"), d.dataset.ooxmlCommentPart = "body", d.textContent = t.text, a.appendChild(o), a.appendChild(d), i.appendChild(a), e.appendChild(i);
}
function h(e, t, i = {}) {
	n(e.ownerDocument);
	let a = i.active ?? !1, o = i.focused ?? !1, s = i.interactive ?? e.tagName === "BUTTON", c = r(t.root.author);
	e.setAttribute("class", "ooxml-comment-card"), e.dataset.ooxmlCommentId = t.occurrenceKey, e.dataset.active = String(a), e.dataset.focused = String(o), e.dataset.standalone = String(i.standalone ?? !1), e.dataset.ooxmlCommentCard = "", s ? e.setAttribute("aria-pressed", String(a)) : e.removeAttribute("aria-pressed"), e.style.cssText = `--ooxml-comment-author-accent:${c};`, e.replaceChildren(), m(e, t.root, !1);
	for (let n of t.replies) m(e, n, !0);
	let u = l(e.ownerDocument);
	u.dataset.ooxmlCommentPart = "frame", u.setAttribute("aria-hidden", "true"), e.appendChild(u);
}
function g(t, n, r) {
	t.setAttribute("role", "list"), t.setAttribute("aria-label", "Comments"), t.dataset.ooxmlCommentUi = "margin", t.dataset.ooxmlCommentZoom = String(r.zoom);
	let i = a.get(t);
	if (!i) {
		let e = {
			cards: /* @__PURE__ */ new Map(),
			onScroll: () => e.onScrollGeometryChange?.(),
			zoom: r.zoom,
			onGeometryChange: r.onGeometryChange,
			onScrollGeometryChange: r.onScrollGeometryChange
		};
		if ((r.onGeometryChange || r.onScrollGeometryChange) && t.addEventListener("scroll", e.onScroll, { passive: !0 }), r.onGeometryChange) {
			let n = t.ownerDocument.defaultView?.ResizeObserver ?? globalThis.ResizeObserver;
			n && (e.resizeObserver = new n(() => e.onGeometryChange?.()));
		}
		i = e, a.set(t, i);
	}
	i.zoom = r.zoom, i.onGeometryChange = r.onGeometryChange, i.onScrollGeometryChange = r.onScrollGeometryChange;
	let s = /* @__PURE__ */ new Set();
	for (let e of n) {
		if (s.has(e.occurrenceKey)) throw Error(`Duplicate comment occurrence key: ${e.occurrenceKey}`);
		s.add(e.occurrenceKey);
	}
	for (let [e, t] of [...i.cards]) s.has(e) || (i.cards.delete(e), o(t, i.resizeObserver));
	for (let a of n) {
		let n = i.cards.get(a.occurrenceKey);
		if (!n) {
			let o = l(t.ownerDocument);
			o.setAttribute("role", "listitem"), o.dataset.ooxmlCommentItem = "";
			let s = t.ownerDocument.createElement("button");
			s.type = "button", s.id = `ooxml-comment-card-${e++}`, s.dataset.ooxmlCommentCard = "";
			let c = {
				item: o,
				card: s,
				thread: a,
				painted: !1,
				focused: !1,
				active: !1,
				committedTop: 0,
				onSetActive: r.onSetActive,
				onClick: () => c.onSetActive(a.occurrenceKey, !c.active),
				onFocus: () => {
					c.focused = !0, c.card.dataset.focused = "true";
				},
				onBlur: () => {
					c.focused = !1, c.card.dataset.focused = "false";
				}
			};
			s.addEventListener("click", c.onClick), s.addEventListener("focus", c.onFocus), s.addEventListener("blur", c.onBlur), o.appendChild(s), i.cards.set(a.occurrenceKey, c), i.resizeObserver?.observe(s), n = c;
		}
		let o = r.activeId === a.occurrenceKey;
		n.onSetActive = r.onSetActive, (!n.painted || n.active !== o || !f(n.thread, a)) && h(n.card, a, {
			active: o,
			focused: n.focused,
			interactive: !0
		}), n.painted = !0, n.active = o, n.thread = a;
	}
	let c = n.map((e, t) => ({
		thread: e,
		index: t
	})).sort((e, t) => (r.preferredTopById?.get(e.thread.occurrenceKey) ?? 0) - (r.preferredTopById?.get(t.thread.occurrenceKey) ?? 0) || e.index - t.index).map(({ thread: e }) => e).flatMap((e) => {
		let t = i.cards.get(e.occurrenceKey);
		return t ? [t.item] : [];
	});
	(c.length !== t.children.length || c.some((e, n) => t.children[n] !== e)) && t.replaceChildren(...c);
	for (let e of i.cards.values()) e.item.style.cssText = `width:${r.logicalWidth}px;top:${e.committedTop * r.zoom}px;`;
	let u = c[0]?.children[0], d = u && t.ownerDocument.defaultView?.getComputedStyle ? Number.parseFloat(t.ownerDocument.defaultView.getComputedStyle(u).marginBottom) : 0, m = p(n.map((e) => {
		let t = i.cards.get(e.occurrenceKey);
		return {
			occurrenceKey: e.occurrenceKey,
			preferredTop: (r.preferredTopById?.get(e.occurrenceKey) ?? 0) / r.zoom,
			height: t?.card.getBoundingClientRect().height ?? 0
		};
	}), t.clientHeight / r.zoom, Number.isFinite(d) ? d : 0);
	for (let e of i.cards.values()) e.committedTop = m.get(e.thread.occurrenceKey) ?? 0, e.item.style.top = `${e.committedTop * r.zoom}px`, e.item.style.transform = `scale(${r.zoom})`;
	return new Map(n.flatMap((e) => {
		let t = i.cards.get(e.occurrenceKey);
		return t ? [[e.occurrenceKey, t.card]] : [];
	}));
}
//#endregion
export { h as a, n as i, i as n, c as o, s as r, r as s, g as t };
