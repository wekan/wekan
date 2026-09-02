//#region packages/core/src/fonts/font-registry.ts
var e = /* @__PURE__ */ new Map();
function t(t, n, r) {
	let i = e.get(t), a = i?.get(n);
	if (a) return a.refs++, {
		face: a.face,
		isNew: !1
	};
	let o = r(), s = i ?? /* @__PURE__ */ new Map();
	return s.set(n, {
		face: o,
		set: n,
		refs: 1
	}), e.set(t, s), {
		face: o,
		isNew: !0
	};
}
function n(t) {
	let n = /* @__PURE__ */ new Set();
	for (let r of t) if (!n.has(r)) {
		n.add(r);
		for (let [t, n] of e) {
			let i = !1;
			for (let [a, o] of n) if (o.face === r) {
				if (i = !0, o.refs--, o.refs <= 0) {
					try {
						o.set.delete(r);
					} catch {}
					n.delete(a), n.size === 0 && e.delete(t);
				}
				break;
			}
			if (i) break;
		}
	}
}
//#endregion
//#region packages/core/src/fonts/preload.ts
var r = 15e3;
function i(e) {
	return Promise.race([e, new Promise((e) => setTimeout(e, r))]);
}
var a = /* @__PURE__ */ new Map();
function o(e) {
	let t = [], n = /@font-face\s*\{([^}]*)\}/g, r;
	for (; r = n.exec(e);) {
		let e = r[1], n = (t) => e.match(RegExp(`(?:^|;|\\n)\\s*${t}\\s*:\\s*([^;]+)`, "i"))?.[1].trim(), i = n("font-family"), a = n("src");
		if (!i || !a) continue;
		let o = {}, s = n("font-style");
		s && (o.style = s);
		let c = n("font-weight");
		c && (o.weight = c);
		let l = n("font-stretch");
		l && (o.stretch = l);
		let u = n("unicode-range");
		u && (o.unicodeRange = u), t.push({
			family: i.replace(/^['"]|['"]$/g, ""),
			src: a,
			descriptors: o
		});
	}
	return t;
}
function s() {
	return typeof document < "u" && document && document.fonts ? document.fonts : typeof self < "u" && self && "fonts" in self ? self.fonts : null;
}
function c(e, t) {
	let n = t.descriptors;
	return [
		"gfonts",
		e,
		t.family.toLowerCase(),
		n.style ?? "",
		n.weight ?? "",
		n.stretch ?? "",
		n.unicodeRange ?? "",
		t.src
	].join("|");
}
async function l(e, n, r = s()) {
	let l = r;
	if (!l || typeof FontFace > "u" || typeof fetch > "u") return [];
	let u = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Set();
	for (let t of e) {
		if (!t) continue;
		let e = t.toLowerCase();
		if (u.has(e)) continue;
		u.add(e);
		let r = n[e];
		if (!r) continue;
		f.add(r.url);
		let i = (r.loadFamily ?? t).toLowerCase();
		d.add(i);
		let a = p.get(r.url);
		a || (a = /* @__PURE__ */ new Set(), p.set(r.url, a)), a.add(i);
	}
	if (d.size === 0) return [];
	let h = await i(Promise.all([...f].map(async (e) => {
		let t = a.get(e);
		if (t) return {
			url: e,
			rules: await t
		};
		let n = (async () => {
			try {
				let t = await fetch(e);
				if (!t.ok) throw Error(`HTTP ${t.status}`);
				return o(await t.text());
			} catch {
				a.delete(e);
				for (let t of p.get(e) ?? []) m.add(t);
				return [];
			}
		})();
		return a.set(e, n), {
			url: e,
			rules: await n
		};
	}))), g = [], _ = [];
	for (let e of Array.isArray(h) ? h : []) for (let n of e.rules) {
		let { face: r, isNew: i } = t(c(e.url, n), l, () => {
			let e = new FontFace(n.family, n.src, n.descriptors);
			return l.add(e), e;
		});
		g.push(r), i && _.push(r);
	}
	return _.length > 0 && await i(Promise.allSettled(_.map((e) => e.load())).then((e) => (e.forEach((e, t) => {
		e.status === "rejected" && m.add(_[t].family.replace(/['"]/g, "").toLowerCase());
	}), l.ready))), m.size > 0 && console.warn(`[ooxml] failed to preload web font(s): ${[...m].join(", ")}; falling back to system fonts (text may shift or differ).`), g;
}
function u(e) {
	n(e);
}
//#endregion
//#region packages/core/src/internal/bounded-async-lru-cache.ts
function d(e, t) {
	if (!Number.isSafeInteger(e) || e <= 0) throw TypeError(`${t} must be a positive safe integer`);
}
function f(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw TypeError("cache entry weight must be a non-negative safe integer");
}
var p = class {
	#e;
	#t;
	#n;
	#r;
	#i = /* @__PURE__ */ new Map();
	#a = /* @__PURE__ */ new Map();
	#o = 0;
	constructor(e) {
		d(e.maxEntries, "maxEntries"), d(e.maxWeight, "maxWeight"), this.#e = e.maxEntries, this.#t = e.maxWeight, this.#n = e.measure, this.#r = e.onRemove;
	}
	get usage() {
		return {
			entries: this.#i.size,
			weight: this.#o,
			pending: this.#a.size
		};
	}
	has(e) {
		return this.#i.has(e);
	}
	get(e) {
		let t = this.#i.get(e);
		if (t !== void 0) return this.#i.delete(e), this.#i.set(e, t), t.value;
	}
	getOrLoad(e, t) {
		let n = this.get(e);
		if (n !== void 0 || this.#i.has(e)) return Promise.resolve(n);
		let r = this.#a.get(e);
		if (r !== void 0) return r.promise;
		let i = {}, a = Promise.resolve().then(t).then((t) => this.#c(e, i, t), (t) => {
			throw this.#s(e, i), t;
		});
		return this.#a.set(e, {
			token: i,
			promise: a
		}), a;
	}
	delete(e) {
		let t = this.#a.delete(e), n = this.#i.get(e);
		return n === void 0 ? t : (this.#i.delete(e), this.#o -= n.weight, this.#l(n.value, e, "deleted"), !0);
	}
	clear() {
		this.#a.clear();
		let e = [...this.#i];
		this.#i.clear(), this.#o = 0;
		for (let [t, n] of e) this.#l(n.value, t, "cleared");
	}
	#s(e, t) {
		this.#a.get(e)?.token === t && this.#a.delete(e);
	}
	#c(e, t, n) {
		if (this.#a.get(e)?.token !== t) return n;
		let r;
		try {
			r = this.#n(n), f(r);
		} catch (n) {
			throw this.#s(e, t), n;
		}
		if (this.#a.get(e)?.token !== t || (this.#a.delete(e), r > this.#t)) return n;
		let i = [];
		for (; this.#i.size >= this.#e || r > this.#t - this.#o;) {
			let e = this.#i.entries().next().value;
			if (e === void 0) break;
			let [t, n] = e;
			this.#i.delete(t), this.#o -= n.weight, i.push([t, n]);
		}
		this.#i.set(e, {
			value: n,
			weight: r
		}), this.#o += r;
		for (let [e, t] of i) this.#l(t.value, e, "evicted");
		return n;
	}
	#l(e, t, n) {
		try {
			this.#r?.(e, t, n);
		} catch {}
	}
}, m = class {
	#e;
	constructor(e) {
		this.#e = new p({
			maxEntries: e.maxEntries,
			maxWeight: e.maxBytes,
			measure: (e) => e.size
		});
	}
	get usage() {
		let e = this.#e.usage;
		return {
			entries: e.entries,
			bytes: e.weight,
			pending: e.pending
		};
	}
	async get(e, t, n) {
		if (typeof e != "string" || e.length === 0) throw TypeError("raw package part path must be a non-empty string");
		if (typeof t != "string") throw TypeError("raw package part MIME type must be a string");
		let r = await this.#e.getOrLoad(e, async () => {
			let e = await n();
			if (!(e instanceof Blob)) throw TypeError("raw package part loader must return a Blob");
			return e;
		});
		return t === "" || r.type === t ? r : r.slice(0, r.size, t);
	}
	clear() {
		this.#e.clear();
	}
};
//#endregion
export { u as a, t as c, l as i, p as n, i as o, s as r, n as s, m as t };
