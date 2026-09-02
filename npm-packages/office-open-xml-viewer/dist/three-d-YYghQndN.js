import { F as e, Ht as t, I as n, L as r, O as i, P as a, R as o, _ as s, a as c, an as l, b as u, gn as d, hn as f, in as p, k as m, rn as h, v as g } from "./plot-area-frame-D5hEOgkJ.js";
import { r as _ } from "./units-EJdC96r6.js";
//#region packages/core/src/canvas/clamp.ts
var v = 32767, y = 1 << 24;
function b(e, t) {
	let n = Number.isFinite(e) && e > 0 ? Math.max(1, Math.round(e)) : 1, r = Number.isFinite(t) && t > 0 ? Math.max(1, Math.round(t)) : 1, i = Math.min(1, v / n, v / r), a = n * r, o = a > 16777216 ? Math.sqrt(y / a) : 1, s = Math.min(i, o);
	return s >= 1 ? {
		width: n,
		height: r,
		scale: 1,
		clamped: !1
	} : {
		width: Math.max(1, Math.floor(n * s)),
		height: Math.max(1, Math.floor(r * s)),
		scale: s,
		clamped: !0
	};
}
//#endregion
//#region packages/core/src/shape/effects.ts
function x(e, t) {
	return [t === "tl" || t === "l" || t === "bl" ? e.x : t === "tr" || t === "r" || t === "br" ? e.x + e.w : e.x + e.w / 2, t === "tl" || t === "t" || t === "tr" ? e.y : t === "l" || t === "ctr" || t === "r" ? e.y + e.h / 2 : e.y + e.h];
}
function S(e, t) {
	return e * t;
}
function C(e) {
	return e.getContext("2d") ?? null;
}
function w(e, t, n, r) {
	let i = Math.max(0, Math.floor(e.x - t)), a = Math.max(0, Math.floor(e.y - t)), o = Math.min(n, Math.ceil(e.x + e.w + t)), s = Math.min(r, Math.ceil(e.y + e.h + t));
	return {
		x: i,
		y: a,
		w: Math.max(1, o - i),
		h: Math.max(1, s - a)
	};
}
function T(e, t) {
	if (t.x === 0 && t.y === 0) return e;
	let n = t.x, r = t.y;
	return new Proxy(e, {
		get(e, t) {
			if (t === "setTransform") return (t) => {
				e.setTransform(t.a, t.b, t.c, t.d, t.e - n, t.f - r);
			};
			let i = Reflect.get(e, t);
			return typeof i == "function" ? i.bind(e) : i;
		},
		set(e, t, n) {
			return e[t] = n, !0;
		}
	});
}
function E(e, t, n, r, i, a, o, c = 0, l) {
	let u = Math.max(0, S(r.blur, i)), d = S(r.dist, i), p = r.rotWithShape === !1 ? 0 : c, m = (r.dir + p) * Math.PI / 180, h = Math.cos(m) * d, g = Math.sin(m) * d, _ = w(n, Math.ceil(u * 3 + Math.max(Math.abs(h), Math.abs(g))) + 2, a, o), v = f(_.w, _.h);
	if (!v) return !1;
	let y = C(v);
	if (!y) return !1;
	t(T(y, _)), y.save(), y.setTransform(1, 0, 0, 1, 0, 0), y.globalCompositeOperation = "source-in", y.fillStyle = s(r.color, r.alpha), y.fillRect(0, 0, _.w, _.h), y.restore(), e.save(), u > 0 && (e.filter = `blur(${u}px)`);
	let [b, E] = l ?? x(n, r.algn ?? "b"), D = r.sx ?? 1, O = r.sy ?? 1, k = Math.tan((r.kx ?? 0) * Math.PI / 180), A = Math.tan((r.ky ?? 0) * Math.PI / 180);
	return e.translate(h, g), e.translate(b, E), p !== 0 && e.rotate(p * Math.PI / 180), e.transform(D, A, k, O, 0, 0), p !== 0 && e.rotate(-p * Math.PI / 180), e.translate(-b, -E), e.drawImage(v, _.x, _.y), e.restore(), !0;
}
function D(e, t, n, r, i, a, o) {
	let c = S(r.blur, i), l = S(r.dist, i), u = r.dir * Math.PI / 180, d = Math.cos(u) * l, p = Math.sin(u) * l, m = w(n, Math.ceil(3 * c + Math.abs(l)) + 2, a, o), h = f(m.w, m.h);
	if (!h) return;
	let g = C(h);
	if (!g) return;
	let _ = T(g, m);
	_.save(), _.fillStyle = s(r.color, r.alpha), t(_), _.restore(), _.save(), _.globalCompositeOperation = "destination-out", _.filter = c > 0 ? `blur(${c}px)` : "none", _.translate(d, p), _.fillStyle = "#000", t(_), _.restore(), _.save(), _.globalCompositeOperation = "destination-in", _.filter = "none", _.fillStyle = "#000", t(_), _.restore(), e.save(), e.drawImage(h, m.x, m.y), e.restore();
}
function O(e, t, n, r, i, a, o, s) {
	let c = S(r.radius, i);
	if (c <= 0) {
		t(e);
		return;
	}
	let l = w(n, Math.ceil(c) + 2, a, o), u = n.x - l.x, d = n.y - l.y, p = f(l.w, l.h);
	if (!p) {
		t(e);
		return;
	}
	let m = C(p);
	if (!m) {
		t(e);
		return;
	}
	let h = T(m, l), g = s ?? t;
	t(h);
	let _ = f(l.w, l.h), v = f(l.w, l.h), y = _ ? C(_) : null, b = v ? C(v) : null;
	if (_ && y && v && b) {
		let t = T(y, l);
		t.fillStyle = "#000", g(t), b.drawImage(p, u, d, n.w, n.h, u - c, d - c, n.w + c * 2, n.h + c * 2), b.drawImage(p, 0, 0), b.globalCompositeOperation = "destination-in", b.filter = `blur(${c / 3}px)`, b.drawImage(_, 0, 0), b.filter = "none", b.globalCompositeOperation = "source-over", e.save(), e.drawImage(v, l.x, l.y), e.restore();
		return;
	}
	e.save(), e.drawImage(p, 0, 0), e.restore();
}
function k(e, t, n, r, i, a, o) {
	let s = f(a, o);
	if (!s) return;
	let c = C(s);
	if (!c) return;
	let l = S(r.blur, i);
	c.save(), l > 0 && (c.filter = `blur(${l}px)`), t(c), c.restore(), c.save(), c.globalCompositeOperation = "destination-in";
	let u = n.y, d = n.y + n.h, p = c.createLinearGradient(0, d, 0, u), m = A(r.stPos), h = A(r.endPos);
	p.addColorStop(0, `rgba(0,0,0,${r.stA})`), m > 0 && p.addColorStop(m, `rgba(0,0,0,${r.stA})`), h < 1 && h > m && p.addColorStop(h, `rgba(0,0,0,${r.endA})`), p.addColorStop(1, `rgba(0,0,0,${r.endA})`), c.fillStyle = p, c.fillRect(0, 0, a, o), c.restore();
	let g = S(r.dist, i), _ = r.dir * Math.PI / 180, v = Math.cos(_) * g, y = Math.sin(_) * g;
	e.save(), e.translate(n.x + v, d + y), e.scale(r.sx, r.sy), e.translate(-n.x, -d), e.drawImage(s, 0, 0), e.restore();
}
function A(e) {
	return e < 0 ? 0 : e > 1 ? 1 : e;
}
//#endregion
//#region packages/core/src/shape/scene3d-draw.ts
function j(e, t, n, r) {
	let i = e.x, a = e.y, o = t.x, s = t.y, c = n.x, l = n.y, u = r.x, d = r.y, f = o - c, p = u - c, m = i - o + c - u, h = s - l, g = d - l, _ = a - s + l - d, v, y;
	if (Math.abs(m) < 1e-12 && Math.abs(_) < 1e-12) v = 0, y = 0;
	else {
		let e = f * g - p * h;
		if (Math.abs(e) < 1e-12) return null;
		v = (m * g - p * _) / e, y = (f * _ - m * h) / e;
	}
	return [
		o - i + v * o,
		u - i + y * u,
		i,
		s - a + v * s,
		d - a + y * d,
		a,
		v,
		y,
		1
	];
}
function M(e, t, n) {
	let r = e[6] * t + e[7] * n + e[8];
	return {
		x: (e[0] * t + e[1] * n + e[2]) / r,
		y: (e[3] * t + e[4] * n + e[5]) / r
	};
}
var N = 1;
function P(e, t) {
	let [n, r, i, a, o, s] = e, [c, l, u, d, f, p] = t;
	return [
		n * c + i * l,
		r * c + a * l,
		n * u + i * d,
		r * u + a * d,
		n * f + i * p + o,
		r * f + a * p + s
	];
}
function F(e, t, n, r, i, a, o, s, c, l, u, d, f) {
	let p = c - o, m = l - s;
	if (p <= 0 || m <= 0) return;
	let h = (d.x - u.x) / p, g = (d.y - u.y) / p, _ = (f.x - u.x) / m, v = (f.y - u.y) / m, y = (Math.hypot(d.x - u.x, d.y - u.y) || 1) * a, b = (Math.hypot(f.x - u.x, f.y - u.y) || 1) * a, x = N * p / y, S = N * m / b, C = Math.max(0, o - x), w = Math.max(0, s - S), T = Math.min(n, c + x), E = Math.min(r, l + S), D = T - C, O = E - w;
	if (D <= 0 || O <= 0) return;
	e.save();
	let [k, A, j, M, F, I] = P(i, [
		h,
		g,
		_,
		v,
		u.x - o * h - s * _,
		u.y - o * g - s * v
	]);
	e.setTransform(k, A, j, M, F, I), e.drawImage(t, C, w, D, O, C, w, D, O), e.restore();
}
function I(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
	let m = M(o, c, l), h = M(o, u, l), g = M(o, c, d), _ = M(o, u, d), v = (c + u) / 2, y = (l + d) / 2, b = M(o, v, y), x = {
		x: (m.x + h.x + g.x + _.x) / 4,
		y: (m.y + h.y + g.y + _.y) / 4
	}, S = R(i), C = Math.hypot(b.x - x.x, b.y - x.y) * S;
	if (p <= 0 || C <= f) {
		let o = s.x1 - s.x0, f = s.y1 - s.y0;
		F(e, t, n, r, i, a, s.x0 + c * o, s.y0 + l * f, s.x0 + u * o, s.y0 + d * f, m, h, g);
		return;
	}
	u - c >= d - l ? (I(e, t, n, r, i, a, o, s, c, l, v, d, f, p - 1), I(e, t, n, r, i, a, o, s, v, l, u, d, f, p - 1)) : (I(e, t, n, r, i, a, o, s, c, l, u, y, f, p - 1), I(e, t, n, r, i, a, o, s, c, y, u, d, f, p - 1));
}
function L(e, t, n, r, i, a = .5, o) {
	if (n <= 0 || r <= 0) return;
	let s = o ?? {
		x0: 0,
		y0: 0,
		x1: n,
		y1: r
	};
	if (![
		s.x0,
		s.y0,
		s.x1,
		s.y1
	].every(Number.isFinite) || s.x0 < 0 || s.y0 < 0 || s.x1 > n || s.y1 > r || s.x1 <= s.x0 || s.y1 <= s.y0) return;
	let [c, l, u, d] = i;
	if (Math.abs(c.x * l.y - l.x * c.y + l.x * u.y - u.x * l.y + u.x * d.y - d.x * u.y + d.x * c.y - c.x * d.y) / 2 < 1e-6) return;
	let f = j(i[0], i[1], i[2], i[3]);
	if (!f) return;
	let p = t.getTransform(), m = [
		p.a,
		p.b,
		p.c,
		p.d,
		p.e,
		p.f
	], h = R(m);
	W(e, t, n, r, i, m, h, f, s, a, 14) || (H(), t.save(), t.beginPath(), t.moveTo(i[0].x, i[0].y), t.lineTo(i[1].x, i[1].y), t.lineTo(i[2].x, i[2].y), t.lineTo(i[3].x, i[3].y), t.closePath(), t.clip(), I(t, e, n, r, m, h, f, s, 0, 0, 1, 1, a, 14), t.restore());
}
function R(e) {
	return Math.sqrt(Math.abs(e[0] * e[3] - e[1] * e[2])) || 1;
}
function z(e, t, n) {
	let r = j(e[0], e[1], e[2], e[3]);
	if (!r) return null;
	let i = [
		[-t, -n],
		[1 + t, -n],
		[1 + t, 1 + n],
		[-t, 1 + n]
	], a = [];
	for (let [e, t] of i) {
		if (!(r[6] * e + r[7] * t + r[8] > 1e-9)) return null;
		a.push(M(r, e, t));
	}
	return a;
}
function B(e, t, n) {
	let r = j(e[0], e[1], e[2], e[3]);
	return r && r[6] * t + r[7] * n + r[8] > 1e-9 ? M(r, t, n) : null;
}
var V = !1;
function H() {
	V || (V = !0, typeof console < "u" && typeof console.warn == "function" && console.warn("[ooxml] scene3d: no offscreen canvas available — using the direct warp fallback (per-cell bleed only, no supersample). Textured-source seams may be faintly visible; the silhouette and geometry are unaffected."));
}
var U = 2;
function W(e, t, n, r, i, a, o, s, c, l, u) {
	let d = i.map((e) => ({
		x: a[0] * e.x + a[2] * e.y + a[4],
		y: a[1] * e.x + a[3] * e.y + a[5]
	})), p = Infinity, m = Infinity, h = -Infinity, g = -Infinity;
	for (let e of d) e.x < p && (p = e.x), e.y < m && (m = e.y), e.x > h && (h = e.x), e.y > g && (g = e.y);
	p = Math.floor(p) - 1, m = Math.floor(m) - 1, h = Math.ceil(h) + 1, g = Math.ceil(g) + 1;
	let _ = h - p, v = g - m;
	if (_ <= 0 || v <= 0) return !1;
	let y = Math.max(1, Math.ceil(_ * U)), b = Math.max(1, Math.ceil(v * U)), x = f(y, b);
	if (!x || x.width !== y || x.height !== b) return !1;
	let S = x.getContext("2d") ?? null;
	if (!S) return !1;
	let C = U, w = [
		a[0] * C,
		a[1] * C,
		a[2] * C,
		a[3] * C,
		(a[4] - p) * C,
		(a[5] - m) * C
	];
	S.save(), S.setTransform(w[0], w[1], w[2], w[3], w[4], w[5]), S.beginPath(), S.moveTo(i[0].x, i[0].y), S.lineTo(i[1].x, i[1].y), S.lineTo(i[2].x, i[2].y), S.lineTo(i[3].x, i[3].y), S.closePath(), S.clip(), I(S, e, n, r, w, o, s, c, 0, 0, 1, 1, l * C, u), S.restore(), t.save(), t.setTransform(1, 0, 0, 1, 0, 0);
	let T = t.imageSmoothingEnabled, E = t.imageSmoothingQuality;
	return t.imageSmoothingEnabled = !0, t.imageSmoothingQuality = "high", t.drawImage(x, 0, 0, _ * C, v * C, p, m, _, v), t.imageSmoothingEnabled = T, t.imageSmoothingQuality = E, t.restore(), !0;
}
//#endregion
//#region packages/core/src/chart/three-d-surface-picture.ts
function ee(e, t) {
	if (!t || ![
		t.l,
		t.t,
		t.r,
		t.b
	].some((e) => (e ?? 0) !== 0)) return e;
	let n = t.l ?? 0, r = t.t ?? 0, i = 1 - (t.r ?? 0), a = 1 - (t.b ?? 0), o = [
		B(e, n, r),
		B(e, i, r),
		B(e, i, a),
		B(e, n, a)
	];
	return o.every((e) => e != null) ? o : null;
}
function te(e, t) {
	if (e.length !== 4) return null;
	let n = e.map((e, n) => ({
		scenePoint: e,
		projected: t(e),
		index: n
	})).sort((e, t) => e.projected.y - t.projected.y || e.projected.x - t.projected.x), r = n.slice(0, 2).sort((e, t) => e.projected.x - t.projected.x), i = n.slice(2).sort((e, t) => e.projected.x - t.projected.x);
	return new Set([...r, ...i].map((e) => e.index)).size === 4 ? [
		r[0].scenePoint,
		r[1].scenePoint,
		i[1].scenePoint,
		i[0].scenePoint
	] : null;
}
function G(e, t, n, r) {
	if (e.thickness === 0 && n === 0) return [
		e.inner[3],
		e.inner[2],
		e.inner[1],
		e.inner[0]
	];
	let i = te(e.faces[n] ?? [], r);
	return !i || t !== "backWall" || n !== 4 ? i : [
		i[1],
		i[2],
		i[3],
		i[0]
	];
}
function ne(e, t, n) {
	if (!(e != null && Number.isFinite(e) && e > 0) || !(t > 0) || !(n > 0)) return null;
	let r = e * n / t;
	return Number.isFinite(r) && r > 0 ? r : null;
}
function re(e, t, n) {
	return Math.hypot(e.x - t.x, e.y - t.y, (e.depth - t.depth) * n);
}
function ie(t, s, c, u, f, g, _, v, y) {
	let b = a(s, u, f, y);
	if (!b || g.inner.length !== 4) return !1;
	let x = l(c);
	if (!(x.w > 0) || !(x.h > 0)) return !1;
	let S = h(c, s.srcRect), C = S ? {
		x0: S.sx,
		y0: S.sy,
		x1: S.sx + S.sw,
		y1: S.sy + S.sh
	} : void 0, w = [
		v(g.inner[3]),
		v(g.inner[2]),
		v(g.inner[1]),
		v(g.inner[0])
	], T = (e, t, n) => ({
		x: e.x + (t.x - e.x) * n,
		y: e.y + (t.y - e.y) * n,
		depth: e.depth + (t.depth - e.depth) * n
	}), E = (e, t, n) => [
		v(T(e[3], e[0], n)),
		v(T(e[2], e[1], n)),
		v(T(e[2], e[1], t)),
		v(T(e[3], e[0], t))
	], D = b.mode === "stack" ? ne(g.pictureStackAspect, x.w, x.h) : null, O = b.mode === "tile" ? i(s, c) : null, k = [];
	if (b.mode === "stack") {
		if (D == null) return !1;
		let t = 0, n = !1;
		for (let i of _) {
			if (!e(b, i) || !G(g, f, i, v)) continue;
			let a = r(b, i) ? Math.ceil(1 / D) : 1;
			if (!Number.isSafeInteger(a) || a < 1 || (t += a, t > 4096)) return !1;
			n = !0;
		}
		if (!n) return !1;
	}
	if (b.mode === "tile") {
		if (!O) return !1;
		let n = 0, r = 0, i = !1;
		for (let a of _) {
			if (!e(b, a)) continue;
			let o = G(g, f, a, v);
			if (!o) continue;
			let s = re(o[0], o[1], g.modelDepth), c = re(o[0], o[3], g.modelDepth);
			if (!(s > 0) || !(c > 0)) continue;
			let l = m(O, s, c), u = Math.floor(-l.x / O.tileW), p = Math.floor(-l.y / O.tileH), h = Math.ceil((s - l.x) / O.tileW), _ = Math.ceil((c - l.y) / O.tileH), y = Math.max(0, h - u) * Math.max(0, _ - p);
			if (!Number.isSafeInteger(y) || (n += y, n > 4096)) return !1;
			if (y === 0) continue;
			let x = Math.ceil(s), S = Math.ceil(c);
			if (!(x > 0 && x <= 32767) || !(S > 0 && S <= 32767) || x > Math.floor((16777216 - r) / S)) return !1;
			r += x * S;
			let C = d(t, x, S), w = C?.getContext("2d");
			if (!C || !w) return !1;
			k.push({
				faceIndex: a,
				width: s,
				height: c,
				origin: l,
				firstColumn: u,
				firstRow: p,
				lastColumn: h,
				lastRow: _,
				canvas: C,
				context: w
			}), i = !0;
		}
		if (!i) return !1;
	}
	if (t.save(), s.alpha != null && (t.globalAlpha *= s.alpha), b.mode === "stretch") for (let n of _) {
		if (!e(b, n)) continue;
		let r = G(g, f, n, v), i = g.thickness === 0 && n === 0 ? w : r?.map(v);
		if (!i) continue;
		let a = ee(i, s.fillRect);
		if (!a) continue;
		let o = S ? ee(a, {
			l: S.dxFraction,
			t: S.dyFraction,
			r: 1 - S.dxFraction - S.dwFraction,
			b: 1 - S.dyFraction - S.dhFraction
		}) : a;
		if (o) {
			t.save(), t.beginPath(), t.moveTo(i[0].x, i[0].y);
			for (let e = 1; e < i.length; e++) t.lineTo(i[e].x, i[e].y);
			t.closePath(), t.clip(), L(c, t, x.w, x.h, o, .5, C), t.restore();
		}
	}
	else for (let i of _) {
		if (!e(b, i)) continue;
		let a = G(g, f, i, v);
		if (!a) continue;
		let l = a.map(v);
		t.save(), t.beginPath(), t.moveTo(l[0].x, l[0].y);
		for (let e = 1; e < l.length; e++) t.lineTo(l[e].x, l[e].y);
		t.closePath(), t.clip();
		let u = n(b, i);
		if (b.mode === "tile") {
			if (!O) continue;
			let e = k.find((e) => e.faceIndex === i);
			if (!e) continue;
			let n = e.canvas.width / e.width, r = e.canvas.height / e.height;
			e.context.save(), e.context.scale(n, r);
			for (let t = e.firstRow; t < e.lastRow; t++) for (let n = e.firstColumn; n < e.lastColumn; n++) {
				let r = e.origin.x + n * O.tileW, i = e.origin.y + t * O.tileH, a = O.flipX && Math.abs(n) % 2 == 1, o = O.flipY && Math.abs(t) % 2 == 1;
				e.context.save(), e.context.translate(r + (a ? O.tileW : 0), i + (o ? O.tileH : 0)), e.context.scale(a ? -1 : 1, o ? -1 : 1), p(e.context, c, s.srcRect, 0, 0, O.tileW, O.tileH), e.context.restore();
			}
			e.context.restore(), L(e.canvas, t, e.canvas.width, e.canvas.height, l, .5);
		} else if (b.mode === "stack") {
			if (D == null) continue;
			if (r(b, i)) for (let e = 0; e < Math.ceil(1 / D); e++) L(c, t, x.w, x.h, E(a, e * D, (e + 1) * D), .5, C);
			else L(c, t, x.w, x.h, l, .5, C);
		} else if (b.stackUnit != null && o(b, i)) for (let e = 0; e < u; e++) {
			let n = e * b.stackUnit / y, r = (e + 1) * b.stackUnit / y;
			L(c, t, x.w, x.h, E(a, n, r), .5, C);
		}
		else b.stackUnit != null && L(c, t, x.w, x.h, l, .5, C);
		t.restore();
	}
	return t.restore(), !0;
}
//#endregion
//#region packages/core/src/chart/label-box.ts
function K(e, t) {
	if (!e) return t ?? void 0;
	if (!t) return e;
	let n = e.fillPaintAuthored === !0 || e.fill != null || e.fillPaint != null || e.fillHidden === !0, r = e.borderPaintAuthored === !0 || e.borderColor != null || e.borderFill != null || e.borderHidden === !0, i = e.borderDashAuthored === !0 || e.borderDash != null || e.borderCustomDash != null;
	return {
		...t,
		...e,
		fill: n ? e.fill : t.fill,
		fillPaint: n ? e.fillPaint : t.fillPaint,
		fillHidden: n ? e.fillHidden : t.fillHidden,
		fillPaintAuthored: n ? e.fillPaintAuthored : t.fillPaintAuthored,
		borderColor: r ? e.borderColor : t.borderColor,
		borderFill: r ? e.borderFill : t.borderFill,
		borderHidden: r ? e.borderHidden : t.borderHidden,
		borderPaintAuthored: r ? e.borderPaintAuthored : t.borderPaintAuthored,
		borderWidthEmu: e.borderWidthEmu ?? t.borderWidthEmu,
		borderDash: i ? e.borderDash : t.borderDash,
		borderCustomDash: i ? e.borderCustomDash : t.borderCustomDash,
		borderDashAuthored: i ? e.borderDashAuthored : t.borderDashAuthored,
		borderCap: e.borderCap ?? t.borderCap,
		borderJoin: e.borderJoin ?? t.borderJoin,
		borderCompound: e.borderCompound ?? t.borderCompound
	};
}
function ae(e, t, n, r, i = 0) {
	if (!t) return;
	if (t.fillHidden !== !0) {
		let r = t.fillPaint ? g(t.fillPaint, e, n.x, n.y, n.w, n.h, i) : t.fill ? `#${t.fill}` : null;
		r && (e.fillStyle = r, e.fillRect(n.x, n.y, n.w, n.h));
	}
	if (t.borderHidden === !0) return;
	let a = t.borderFill ? g(t.borderFill, e, n.x, n.y, n.w, n.h, i) : t.borderColor ? `#${t.borderColor}` : null;
	a && (e.save(), e.strokeStyle = a, e.lineWidth = t.borderWidthEmu == null ? Math.max(.25, .75 * r) : Math.max(.25, t.borderWidthEmu / _ * r), e.setLineDash(u(t.borderCustomDash, t.borderDash, e.lineWidth)), t.borderCap === "rnd" ? e.lineCap = "round" : t.borderCap === "sq" ? e.lineCap = "square" : t.borderCap === "flat" && (e.lineCap = "butt"), t.borderJoin === "round" ? e.lineJoin = "round" : t.borderJoin === "bevel" ? e.lineJoin = "bevel" : t.borderJoin === "miter" && (e.lineJoin = "miter"), e.strokeRect(n.x, n.y, n.w, n.h), e.restore());
}
//#endregion
//#region packages/core/src/chart/axis-scale.ts
function oe(e, t = {
	min: 0,
	max: 1
}) {
	let n = Infinity, r = -Infinity;
	for (let t of e) t == null || !Number.isFinite(t) || (t < n && (n = t), t > r && (r = t));
	return Number.isFinite(n) && Number.isFinite(r) ? {
		min: n,
		max: r
	} : t;
}
function q(e, t = 5) {
	if (e === 0) return 1;
	let n = e / t, r = 10 ** Math.floor(Math.log10(n)), i = n / r;
	return (i < 1.5 ? 1 : i < 3.5 ? 2 : i < 7.5 ? 5 : 10) * r;
}
function se(e, t, n, r) {
	let i = Number.isFinite(e) ? e : 0, a = Number.isFinite(t) ? t : 100, o = a > i ? a - i : 100, s = i < 0 && a > 0, c = n === "horizontal" || r == null || !Number.isFinite(r) || r < 120 ? s ? 4 : 5 : 10;
	return J(a > i ? Z(i, a, c) : o / c);
}
function ce(e, t, n) {
	let r = Number.isFinite(e) ? e : 0, i = Number.isFinite(t) ? t : 1, a = i > r ? null : 1, o = n != null && Number.isFinite(n) ? n < 45 ? 4 : n < 90 ? 8 : 10 : 8;
	return J(i > r ? Z(r, i, o) : (a ?? 1) / o);
}
function le(e, t, n) {
	let r = Number.isFinite(e) ? e : 0, i = Number.isFinite(t) ? t : 1;
	return J((i > r ? i - r : 1) / (n != null && Number.isFinite(n) && n > 0 ? Math.max(5, Math.round(n / 28)) : 5));
}
function J(e) {
	if (!(e > 0) || !isFinite(e)) return 1;
	let t = 10 ** Math.floor(Math.log10(e));
	if (!(t > 0) || !isFinite(t)) return e;
	let n = e / t, r = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
	return Math.min(Number.MAX_VALUE, r * t);
}
function Y(e) {
	return e != null && isFinite(e) ? e : null;
}
function X(e) {
	return e != null && isFinite(e) && e > 0 ? e : null;
}
function Z(e, t, n) {
	let r = t - e, i = isFinite(r) ? r / n : t / n - e / n;
	return i > 0 && isFinite(i) ? i : r > 0 && isFinite(r) ? Number.MIN_VALUE : Number.MAX_VALUE;
}
function ue(e, t, n) {
	if (!isFinite(e) || !isFinite(t) || !(t >= e) || !(n > 0) || !isFinite(n)) return 0;
	let r = t - e, i = isFinite(r) ? r / n : t / n - e / n;
	return !isFinite(i) || i > 2 ** 53 - 1 ? Infinity : Math.max(1, Math.floor(i + 1e-9) + 1);
}
function de(e, t, n, r, i) {
	let a = ue(e, t, n);
	if (a === 0 || a > 512 && r === "skip") return [];
	let o = Math.min(a, 512), s = [], c = t - e, l = Math.max(Math.abs(n), isFinite(c) ? Math.abs(c) : Math.max(Math.abs(e), Math.abs(t))) * 1e-9, u = -Infinity;
	for (let r = 0; r < o; r++) {
		let a = r * n, o = e + a;
		if ((!isFinite(a) || !isFinite(o) || r > 0 && !(o > u)) && (o = (e / n + r) * n), !isFinite(o) || o > t + l || r > 0 && !(o > u)) break;
		if (u = o, i != null) {
			if (o >= t - l) break;
			let n = o - e, r = isFinite(n) ? n / i : o / i - e / i;
			if (isFinite(r) && Math.abs(r - Math.round(r)) <= 1e-8) continue;
		}
		s.push(o);
	}
	return s;
}
function fe(e) {
	let t = isFinite(e.dataMin) ? e.dataMin : 0, n = isFinite(e.dataMax) ? e.dataMax : 1;
	t > n && ([t, n] = [n, t]);
	let r, i, a;
	if (t === 0 && n === 0) r = 0, i = 1, a = .1;
	else {
		t === n && (t = Math.min(0, t), n = Math.max(0, n));
		let e = t >= 0 && (t === 0 || n > 1.2 * t), o = n <= 0 && (n === 0 || Math.abs(t) > 1.2 * Math.abs(n)), s = e ? 0 : t, c = o ? 0 : n, l = c - s, u = isFinite(l) ? l * .05 : c * .05 - s * .05, d = e ? 0 : t - u, f = o ? 0 : n + u;
		a = J(f / 10 - d / 10), r = Math.floor(d / a) * a, i = Math.ceil(f / a) * a, (!isFinite(r) || !isFinite(i) || !(i > r)) && (r = Math.min(t, 0), i = Math.max(n, r + a));
	}
	let o = Y(e.explicitMin), s = Y(e.explicitMax), c = X(e.majorUnit), l = o ?? (c == null ? r : Math.floor(r / c) * c), u = s ?? (c == null ? i : Math.ceil(i / c) * c), d = a;
	if (c == null && o != null && s != null && s > o) {
		if (e.axisOrientation === "horizontal") d = J(Z(o, s, e.axisLenPt != null && isFinite(e.axisLenPt) && e.axisLenPt > 0 ? Math.max(5, Math.round(e.axisLenPt / 38)) : 8));
		else if (e.axisOrientation === "vertical") {
			let t = e.axisLenPt != null && isFinite(e.axisLenPt) && e.axisLenPt > 0 ? Math.max(5, Math.round(e.axisLenPt / 28)) : 7;
			d = Math.max(J(Z(o, s, 10)), Math.min(Number.MAX_VALUE, q(Z(o, s, t), 1)));
		}
	}
	let f = c ?? d;
	c == null && ue(l, u, f) > 512 && (f = J(u / 511 - l / 511));
	let p = X(e.minorUnit);
	e.needMinor && c == null && p == null && ue(l, u, f / 5) > 512 && (f = J(u / 102 - l / 102));
	let m = f / 5, h = e.needMinor ? p ?? (m > 0 && isFinite(m) ? m : f) : null, g = de(l, u, f, c == null ? "skip" : "truncate"), _ = h == null ? [] : de(l, u, h, "skip", f);
	return {
		min: l,
		max: u,
		majorUnit: f,
		minorUnit: h,
		majorTicks: g,
		minorTicks: _
	};
}
function pe(e, t, n, r) {
	let i, a = r?.logBase;
	if (a != null && isFinite(a) && a >= 2 && t > 0 && n > 0) {
		let r = Math.log(t), a = Math.log(n) - r;
		i = a === 0 ? 0 : (Math.log(Math.max(e, Number.MIN_VALUE)) - r) / a;
	} else {
		let r = n - t;
		if (r === 0) i = 0;
		else if (Number.isFinite(r) && Number.isFinite(e - t)) i = (e - t) / r;
		else {
			let r = Math.max(Math.abs(e), Math.abs(t), Math.abs(n)), a = n / r - t / r;
			i = a === 0 ? 0 : (e / r - t / r) / a;
		}
	}
	return r?.reversed ? 1 - i : i;
}
function me(e, t, n, r, i) {
	let a = isFinite(n) && n >= 2 ? n : 10, o = (e) => Math.log(e) / Math.log(a), s = t > 0 ? t : 1, c = Math.floor(o(e > 0 ? e : s)), l = Math.ceil(o(s)), u = (e) => {
		let t = a ** +e;
		return t === 0 ? Number.MIN_VALUE : isFinite(t) ? t : Number.MAX_VALUE;
	}, d = r ?? u(c), f = i ?? u(Math.max(l, c + 1)), p = [], m = Math.ceil(o(d) - 1e-9), h = Math.floor(o(f) + 1e-9);
	if (!isFinite(m) || !isFinite(h) || h < m) return {
		min: d,
		max: f,
		lines: p
	};
	let g = h - m + 1, _ = Math.max(1, Math.ceil((g - 1) / 511)), v = Math.min(512, Math.floor((g - 1) / _) + 1);
	for (let e = 0; e < v; e++) {
		let t = u(m + e * _);
		t >= d && t <= f && (p.length === 0 || t > p[p.length - 1]) && p.push(t);
	}
	let y = u(h);
	return p.length < 512 && y >= d && y <= f && y > (p[p.length - 1] ?? 0) && p.push(y), {
		min: d,
		max: f,
		lines: p
	};
}
function he(e) {
	let t = e.logBase;
	if (t != null && Number.isFinite(t) && t >= 2) {
		let { min: n, max: r, lines: i } = me(e.dataMin, e.dataMax, t, Y(e.explicitMin), Y(e.explicitMax));
		return {
			min: n,
			max: r,
			majorUnit: i.length > 1 ? i[1] - i[0] : r - n,
			minorUnit: null,
			majorTicks: i,
			minorTicks: [],
			fraction: (i) => pe(i, n, r, {
				logBase: t,
				reversed: e.reversed
			})
		};
	}
	let n = fe(e);
	return {
		...n,
		fraction: (t) => pe(t, n.min, n.max, { reversed: e.reversed })
	};
}
function ge(e, t, n) {
	let r = Math.min(e.length, t.length);
	if (r < 2) return null;
	let i = 0, a = 0, o = 0, s = 0;
	for (let n = 0; n < r; n++) i += e[n], a += t[n], o += e[n] * e[n], s += e[n] * t[n];
	let c, l;
	if (n != null && isFinite(n)) c = o === 0 ? 0 : (s - n * i) / o, l = n;
	else {
		let e = r * o - i * i;
		c = e === 0 ? 0 : (r * s - i * a) / e, l = (a - c * i) / r;
	}
	let u = a / r, d = 0, f = 0;
	for (let n = 0; n < r; n++) {
		let r = t[n] - (c * e[n] + l);
		d += r * r;
		let i = t[n] - u;
		f += i * i;
	}
	let p = f === 0 ? +(d === 0) : 1 - d / f;
	return {
		slope: c,
		intercept: l,
		rSquared: p
	};
}
function _e(e, t, n, r) {
	let i = Math.min(e.length, t.length);
	if (i < 2) return {
		xs: [],
		ys: []
	};
	if (n === "linear") {
		let n = ge(e, t, r?.intercept);
		if (!n) return {
			xs: [],
			ys: []
		};
		let a = e[0], o = e[i - 1];
		return {
			xs: [a, o],
			ys: [n.slope * a + n.intercept, n.slope * o + n.intercept]
		};
	}
	if (n === "movingAvg") {
		let n = Math.max(2, Math.round(r?.period ?? 2));
		if (i < n) return {
			xs: [],
			ys: []
		};
		let a = [], o = [], s = 0;
		for (let e = 0; e < n; e++) s += t[e];
		for (let r = n - 1; r < i; r++) {
			a.push(e[r]), o.push(s / n);
			let c = r + 1;
			c < i && (s += t[c] - t[c - n]);
		}
		return {
			xs: a,
			ys: o
		};
	}
	let a = [];
	for (let r = 0; r < i; r++) {
		let i = e[r], o = t[r];
		!Number.isFinite(i) || !Number.isFinite(o) || n === "log" && i <= 0 || n === "exp" && o <= 0 || n === "power" && (i <= 0 || o <= 0) || a.push({
			x: i,
			y: o
		});
	}
	if (a.length < 2) return {
		xs: [],
		ys: []
	};
	let o = Infinity, s = -Infinity;
	for (let e of a) o = Math.min(o, e.x), s = Math.max(s, e.x);
	if (!Number.isFinite(o) || !Number.isFinite(s) || s <= o) return {
		xs: [],
		ys: []
	};
	let c = Number.isFinite(r?.backward) ? Math.max(0, r?.backward ?? 0) : 0, l = Number.isFinite(r?.forward) ? Math.max(0, r?.forward ?? 0) : 0, u = o - c, d = s + l;
	if ((n === "log" || n === "power") && (u = Math.max(Number.MIN_VALUE, u)), !Number.isFinite(u) || !Number.isFinite(d) || d <= u) return {
		xs: [],
		ys: []
	};
	let f = (e) => {
		let t = [], n = [];
		for (let r = 0; r <= 64; r++) {
			let i = r / 64, a = u * (1 - i) + d * i, o = e(a);
			if (!Number.isFinite(a) || !Number.isFinite(o)) return {
				xs: [],
				ys: []
			};
			t.push(a), n.push(o);
		}
		return {
			xs: t,
			ys: n
		};
	};
	if (n === "exp" || n === "log" || n === "power") {
		let e = ge(a.map((e) => n === "log" || n === "power" ? Math.log(e.x) : e.x), a.map((e) => n === "exp" || n === "power" ? Math.log(e.y) : e.y));
		if (!e || ![e.slope, e.intercept].every(Number.isFinite)) return {
			xs: [],
			ys: []
		};
		if (n === "exp") {
			let t = Math.exp(e.intercept);
			return f((n) => t * Math.exp(e.slope * n));
		}
		if (n === "log") return f((t) => e.slope * Math.log(t) + e.intercept);
		let t = Math.exp(e.intercept);
		return f((n) => t * n ** e.slope);
	}
	if (n === "poly") {
		let e = Math.min(6, a.length - 1, Math.max(2, Math.round(r?.order ?? 2)));
		if (e < 2) return {
			xs: [],
			ys: []
		};
		let t = o / 2 + s / 2, n = Math.max(Math.abs(o - t), Math.abs(s - t));
		if (!Number.isFinite(t) || !Number.isFinite(n) || n <= 0) return {
			xs: [],
			ys: []
		};
		let i = a.length, c = e + 1, l = Array.from({ length: c }, () => Array(i).fill(0));
		for (let e = 0; e < i; e++) {
			let r = (a[e].x - t) / n, i = 1;
			for (let t = 0; t < c; t++) l[t][e] = i, i *= r;
		}
		let u = [], d = Array.from({ length: c }, () => Array(c).fill(0)), p = Array(c).fill(0);
		for (let e = 0; e < c; e++) {
			let t = l[e].slice();
			for (let n = 0; n < e; n++) {
				let r = 0;
				for (let e = 0; e < i; e++) r += u[n][e] * t[e];
				d[n][e] = r;
				for (let e = 0; e < i; e++) t[e] -= r * u[n][e];
			}
			let n = 0;
			for (let e of t) n += e * e;
			let r = Math.sqrt(n);
			if (!Number.isFinite(r) || r <= 2 ** -52 * Math.sqrt(i)) return {
				xs: [],
				ys: []
			};
			d[e][e] = r;
			let o = t.map((e) => e / r);
			u.push(o);
			let s = 0;
			for (let e = 0; e < i; e++) s += o[e] * a[e].y;
			if (!Number.isFinite(s)) return {
				xs: [],
				ys: []
			};
			p[e] = s;
		}
		let m = Array(c).fill(0);
		for (let e = c - 1; e >= 0; e--) {
			let t = p[e];
			for (let n = e + 1; n < c; n++) t -= d[e][n] * m[n];
			if (m[e] = t / d[e][e], !Number.isFinite(m[e])) return {
				xs: [],
				ys: []
			};
		}
		return f((r) => {
			let i = (r - t) / n, a = m[e];
			for (let t = e - 1; t >= 0; t--) a = a * i + m[t];
			return a;
		});
	}
	return {
		xs: [],
		ys: []
	};
}
//#endregion
//#region packages/core/src/chart/text-elide.ts
var ve = "…";
function ye(e, t, n) {
	if (t === "" || n <= 0) return "";
	if (e.measureText(t).width <= n) return t;
	if (e.measureText(ve).width > n) return "";
	let r = 0, i = t.length - 1, a = 0;
	for (; r <= i;) {
		let o = r + i >> 1;
		e.measureText(t.slice(0, o) + ve).width <= n ? (a = o, r = o + 1) : i = o - 1;
	}
	let o = a > 0 ? t.charCodeAt(a - 1) : 0;
	return o >= 55296 && o <= 56319 && a--, t.slice(0, a) + ve;
}
//#endregion
//#region packages/core/src/chart/rich-data-label.ts
var be = 4096, xe = 4, Se = be;
function Ce(e, n, r, i) {
	let a = [[]], o = [null], s = 0, c = (e) => {
		if (!e) return null;
		let t = e.startsWith("#") ? e.slice(1) : e;
		return /^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(t) ? `#${t}` : null;
	};
	outer: for (let l = 0; l < n.runs.length && l < Se; l++) {
		let u = n.runs[l];
		u.text !== "\n" && o[a.length - 1] == null && (o[a.length - 1] = u.paragraphAlign ?? null);
		let d = t(u.fontSizeHpt, n.ptToPx) ?? r, f = u.fontFace?.trim().replaceAll("\"", ""), p = f && !f.startsWith("+") ? f : null, m = f && n.fontFamilyForFace ? n.fontFamilyForFace(f) : p ? `"${p}", Calibri, Arial, sans-serif` : n.fontFamily, h = `${u.italic ?? n.fallbackItalic ?? !1 ? "italic " : ""}${u.bold ?? n.fallbackBold ? "bold " : ""}${d}px ${m}`, g = (u.baseline ?? n.fallbackBaseline ?? 0) * d, _ = u.colorPaintAuthored === !0 || u.color != null || u.colorHidden === !0 ? u.colorHidden === !0 ? null : c(u.color) : n.fallbackColorHidden === !0 ? null : i, v = "", y = () => {
			v &&= (e.font = h, a[a.length - 1].push({
				text: v,
				font: h,
				fillStyle: _,
				width: e.measureText(v).width,
				fontSizePx: d,
				baselineShiftPx: g
			}), "");
		}, b = !1;
		for (let e of u.text) {
			if (b && e === "\n") {
				b = !1;
				continue;
			}
			b = !1;
			let t = e === "\r" ? "\n" : e;
			if (e === "\r" && (b = !0), s >= be) {
				y();
				break outer;
			}
			if (s++, t === "\n") {
				if (y(), a.length >= xe) break outer;
				a.push([]), o.push(u.paragraphAlign ?? null);
			} else v += t;
		}
		y();
	}
	if (!a.some((e) => e.length > 0)) return null;
	let l = a.map((e) => Math.max(r * 1.15, ...e.map((e) => e.fontSizePx * 1.15 + Math.abs(e.baselineShiftPx)))), u = a.map((e) => e.reduce((e, t) => e + t.width, 0));
	return {
		lines: a,
		lineAligns: o,
		lineHeights: l,
		lineWidths: u,
		width: Math.max(0, ...u),
		height: l.reduce((e, t) => e + t, 0)
	};
}
function we(e, t, n, r, i = "center", a = "middle", o = t.width) {
	let s = a === "top" ? r : a === "bottom" ? r - t.height : r - t.height / 2;
	for (let r = 0; r < t.lines.length; r++) {
		let c = t.lines[r], l = t.lineWidths[r], u = t.lineAligns[r], d = u === "l" ? "left" : u === "r" ? "right" : u === "ctr" ? "center" : i, f = i === "left" ? n : i === "right" ? n - o : n - o / 2, p = f + o, m = d === "left" ? f : d === "right" ? p - l : f + (o - l) / 2, h = a === "top" ? s : a === "bottom" ? s + t.lineHeights[r] : s + t.lineHeights[r] / 2;
		for (let t of c) {
			if (e.font = t.font, t.fillStyle == null) {
				m += t.width;
				continue;
			}
			e.fillStyle = t.fillStyle, e.textAlign = "left", e.textBaseline = a, e.fillText(t.text, m, h - t.baselineShiftPx), m += t.width;
		}
		s += t.lineHeights[r];
	}
}
//#endregion
//#region packages/core/src/chart/data-label-content.ts
function Te(e) {
	if (e.customText) return e.customText;
	let t = [];
	if (e.showCategory && e.category && t.push(e.category), e.showSeries && e.seriesName && t.push(e.seriesName), e.showValue && e.sourceValue != null) {
		let n = e.valueDivisor != null && Number.isFinite(e.valueDivisor) && e.valueDivisor > 0 ? e.valueDivisor : 1;
		t.push(c(e.sourceValue / n, e.formatCode ?? null, e.date1904));
	}
	return e.showPercent && e.percentRatio != null && t.push(c(e.percentRatio, e.percentFormatCode ?? e.formatCode ?? "0%", e.date1904)), e.showBubbleSize && e.bubbleSize != null && t.push(c(e.bubbleSize, e.formatCode ?? null, e.date1904)), t.filter((e) => e !== "").join(e.separator ?? e.defaultSeparator ?? " ");
}
//#endregion
//#region packages/core/src/chart/material-color.ts
function Ee(e) {
	return e.rotationX === 15 && e.rotationY === 20 && e.rightAngleAxes === !1 && e.perspective === 30;
}
function De(e) {
	return Ee(e) ? 2 : 1;
}
function Oe(e, t) {
	let n = e.replace(/^#/, "");
	if (!/^[0-9a-f]{6}$/i.test(n) || !Number.isFinite(t)) return e;
	let r = Math.max(0, t), i = (e) => Math.max(0, Math.min(255, Math.round(Number.parseInt(n.slice(e, e + 2), 16) * r))).toString(16).padStart(2, "0");
	return `#${i(0)}${i(2)}${i(4)}`.toUpperCase();
}
var ke = (e) => e <= .04045 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4, Ae = (e) => e <= .0031308 ? e * 12.92 : 1.055 * e ** (1 / 2.4) - .055;
function je(e, t) {
	let n = e.replace(/^#/, "");
	if (!/^[0-9a-f]{6}$/i.test(n) || !Number.isFinite(t)) return e;
	let r = Math.max(-1, Math.min(1, t)), i = (e) => {
		let t = ke(Number.parseInt(n.slice(e, e + 2), 16) / 255), i = r < 0 ? t * (1 + r) : t * (1 - r) + r;
		return Math.round(Math.max(0, Math.min(1, Ae(i))) * 255).toString(16).padStart(2, "0");
	};
	return `#${i(0)}${i(2)}${i(4)}`.toUpperCase();
}
function Me(e, t, n, r) {
	if (e.length < 6 || t < 0 || n <= 0) return null;
	let i = e[t % 6];
	if (!i) return null;
	if (![
		2,
		10,
		18,
		26,
		34,
		42
	].includes(r ?? -1)) return `#${i}`.toUpperCase();
	let a = Math.floor(n / 6);
	return je(i, -.7 + 1.4 * ((Math.floor(t / 6) + 1) / (a + 2)));
}
function Ne(e) {
	if (!e) return 1;
	let t = e.z < 0 ? {
		x: -e.x,
		y: -e.y,
		z: -e.z
	} : e, n = {
		x: .24,
		y: .42,
		z: .88
	}, r = Math.hypot(n.x, n.y, n.z), i = Math.max(0, (t.x * n.x + t.y * n.y + t.z * n.z) / r);
	return Math.max(.48, Math.min(1.22, .48 + .78 * i));
}
//#endregion
//#region packages/core/src/chart/three-d.ts
function Pe(e, t, n, r, i) {
	let a = Number.isFinite(e) && e > 0 ? e : 0, o = Number.isFinite(t) ? $(t, 0, 500) : 150, s = Math.max(1, Math.trunc(r)), c = $(Math.trunc(n), 0, s - 1), l = i ? 1 : s, u = a / (l + o / 100);
	return {
		offset: (a - u * l) / 2 + (i ? 0 : c * u),
		size: u
	};
}
function Fe(e, t, n) {
	if (![
		e,
		t,
		n
	].every(Number.isFinite)) return 1;
	let r = e >= 0 ? n : t;
	return 1 - Math.min(1, Math.abs(e) / Math.max(Number.MIN_VALUE, Math.abs(r)));
}
function Ie(e) {
	return !(e.heightPercentAuthored ?? e.heightPercent != null) || e.heightPercent == null || !Number.isFinite(e.heightPercent) || e.heightPercent < 5 || e.heightPercent > 500 ? 1 : e.heightPercent / 100;
}
function Le(e, t, n, r) {
	if (!t.length || t.length > 1e5 || ![
		n.x,
		n.y,
		n.w,
		n.h
	].every(Number.isFinite) || n.w <= 0 || n.h <= 0 || !t.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y))) return e;
	let i = Infinity, a = -Infinity, o = Infinity, s = -Infinity;
	for (let e of t) i = Math.min(i, e.x), a = Math.max(a, e.x), o = Math.min(o, e.y), s = Math.max(s, e.y);
	let c = a - i, l = s - o;
	if (!(c > 2 ** -52) || !(l > 2 ** -52)) return e;
	let u = $(Q(r, .06), 0, .45), d = n.w * (1 - 2 * u), f = n.h * (1 - 2 * u), p = Math.min(d / c, f / l);
	if (!(p > 0) || !Number.isFinite(p)) return e;
	let m = {
		x: (i + a) / 2,
		y: (o + s) / 2
	}, h = {
		x: n.x + n.w / 2,
		y: n.y + n.h / 2
	}, g = (e) => (t, n, r) => {
		let i = e(t, n, r);
		return {
			x: h.x + (i.x - m.x) * p,
			y: h.y + (i.y - m.y) * p
		};
	};
	return {
		...e,
		project: g(e.project),
		projectUnbounded: g(e.projectUnbounded),
		depthX: e.depthX * p,
		depthY: e.depthY * p
	};
}
function Re(e, t, n, r = .06) {
	return !t.length || t.length > 1e5 ? e : Le(e, t.map((t) => e.project(t.x, t.y, t.depth)), n, r);
}
var ze = 4294967295;
function Be(e, t, n) {
	let { front: r } = e, i = r.x, a = r.x + r.w, o = e.topology.farX === "min" ? i : a, s = e.topology.axisY === "min" ? r.y : r.y + r.h, c = s === r.y ? r.y + r.h : r.y, { nearDepth: l, farDepth: u } = e.topology, d = [
		e.projectUnbounded(i, c, u),
		e.projectUnbounded(a, c, u),
		e.projectUnbounded(i, s, u)
	], f = [i, a].flatMap((t) => [c, s].flatMap((n) => [l, u].map((r) => e.projectUnbounded(t, n, r).x))), p = Math.max(...f) - Math.min(...f), m = Math.hypot(d[0].x - d[2].x, d[0].y - d[2].y), h = p > 0 && m > 0 ? p / m : null, g = n ?? 0, _ = Number.isFinite(g) && g >= 0 && g <= ze ? g : 0, v = Math.max(r.w, r.h, e.modelDepth) * _ / 100, y, b;
	if (t === "floor") {
		y = [
			{
				x: i,
				y: s,
				depth: l
			},
			{
				x: a,
				y: s,
				depth: l
			},
			{
				x: a,
				y: s,
				depth: u
			},
			{
				x: i,
				y: s,
				depth: u
			}
		];
		let e = s + (s === r.y ? -v : v);
		b = y.map((t) => ({
			...t,
			y: e
		}));
	} else if (t === "sideWall") {
		y = [
			{
				x: o,
				y: s,
				depth: l
			},
			{
				x: o,
				y: s,
				depth: u
			},
			{
				x: o,
				y: c,
				depth: u
			},
			{
				x: o,
				y: c,
				depth: l
			}
		];
		let e = o + (o === i ? -v : v);
		b = y.map((t) => ({
			...t,
			x: e
		}));
	} else {
		y = [
			{
				x: i,
				y: s,
				depth: u
			},
			{
				x: a,
				y: s,
				depth: u
			},
			{
				x: a,
				y: c,
				depth: u
			},
			{
				x: i,
				y: c,
				depth: u
			}
		];
		let t = e.modelDepth > 0 ? v / e.modelDepth : 0, n = u === 0 ? -t : 1 + t;
		b = y.map((e) => ({
			...e,
			depth: n
		}));
	}
	if (!(v > 0)) return {
		thickness: 0,
		inner: y,
		outer: [...y],
		faces: [y],
		pictureStackAspect: h,
		modelDepth: e.modelDepth
	};
	let x = y.map((e, t) => [
		e,
		y[(t + 1) % y.length],
		b[(t + 1) % b.length],
		b[t]
	]), S = [
		y,
		b,
		...x
	], C = [...y, ...b].reduce((e, t) => ({
		x: e.x + t.x / 8,
		y: e.y + t.y / 8,
		depth: e.depth + t.depth / 8
	}), {
		x: 0,
		y: 0,
		depth: 0
	}), w = S.map((e) => {
		let [t, n, r] = e, i = {
			x: n.x - t.x,
			y: n.y - t.y,
			depth: n.depth - t.depth
		}, a = {
			x: r.x - t.x,
			y: r.y - t.y,
			depth: r.depth - t.depth
		}, o = {
			x: i.y * a.depth - i.depth * a.y,
			y: i.depth * a.x - i.x * a.depth,
			depth: i.x * a.y - i.y * a.x
		}, s = e.reduce((t, n) => ({
			x: t.x + n.x / e.length,
			y: t.y + n.y / e.length,
			depth: t.depth + n.depth / e.length
		}), {
			x: 0,
			y: 0,
			depth: 0
		}), c = {
			x: s.x - C.x,
			y: s.y - C.y,
			depth: s.depth - C.depth
		};
		return o.x * c.x + o.y * c.y + o.depth * c.depth < 0 ? [...e].reverse() : e;
	});
	return {
		thickness: v,
		inner: y,
		outer: b,
		faces: w,
		pictureStackAspect: h,
		modelDepth: e.modelDepth
	};
}
function Ve(e, t, n, r) {
	if (!Number.isFinite(r) || r < 0 || r > 1 || n === "x" && t === "sideWall" || n === "y" && t === "floor") return [];
	let i = (e, t) => ({
		x: e.x + (t.x - e.x) * r,
		y: e.y + (t.y - e.y) * r,
		depth: e.depth + (t.depth - e.depth) * r
	}), a, o, s, c, l, u;
	n === "x" ? (a = i(e.inner[0], e.inner[1]), o = i(e.inner[3], e.inner[2]), s = i(e.outer[0], e.outer[1]), c = i(e.outer[3], e.outer[2]), l = 2, u = 4) : (a = i(e.inner[0], e.inner[3]), o = i(e.inner[1], e.inner[2]), s = i(e.outer[0], e.outer[3]), c = i(e.outer[1], e.outer[2]), l = 5, u = 3);
	let d = [{
		faceIndex: 0,
		scenePoints: [a, o]
	}];
	return e.thickness > 0 && d.push({
		faceIndex: 1,
		scenePoints: [s, c]
	}, {
		faceIndex: l,
		scenePoints: [a, s]
	}, {
		faceIndex: u,
		scenePoints: [o, c]
	}), d;
}
function He(e, t, n) {
	let r = [
		["floor", t.floor?.thicknessPercent],
		["sideWall", t.sideWall?.thicknessPercent],
		["backWall", t.backWall?.thicknessPercent]
	].map(([t, n]) => Be(e, t, n));
	return r.some((e) => e.thickness > 0) ? Le(e, r.flatMap((e) => e.faces.flat()).map((t) => e.projectUnbounded(t.x, t.y, t.depth)), n, .03) : e;
}
var Q = (e, t) => typeof e == "number" && Number.isFinite(e) ? e : t, $ = (e, t, n) => Math.min(n, Math.max(t, e));
function Ue(e, t, n = {}) {
	if (![
		t.x,
		t.y,
		t.w,
		t.h
	].every(Number.isFinite) || t.w <= 0 || t.h <= 0) return null;
	let r = $(Q(e.rotationX, 15), -90, 90), i = ($(Q(e.rotationY, 20), 0, 360) + 180) % 360 - 180, a = $(Q(e.depthPercent, 100), 20, 2e3), o = $(Q(e.perspective, 30), 0, 240), s = $(Q(e.gapDepthPercent, 150), 0, 500), c = (e.heightPercentAuthored ?? e.heightPercent != null) && e.heightPercent != null && Number.isFinite(e.heightPercent) ? $(e.heightPercent, 5, 500) : null, l = n.sceneHeightScale != null && Number.isFinite(n.sceneHeightScale) ? $(n.sceneHeightScale * 100, 5, 500) : null, u = c ?? l, d = t;
	if (u != null) {
		let e = u / 100, n = Math.min(t.w, t.h / e), r = n * e;
		d = {
			x: t.x + (t.w - n) / 2,
			y: t.y + (t.h - r) / 2,
			w: n,
			h: r
		};
	}
	let f = Math.PI / 180, p = $(Q(n.sceneDepthScale, .1), .01, 2), m = d.w * p * (a / 100), h = d.x + d.w / 2, g = d.y + d.h / 2, _ = -i * f, v = r * f, y = Math.cos(_), b = Math.sin(_), x = Math.cos(v), S = Math.sin(v), C = e.rightAngleAxes !== !0 && o > 0, w = $(o * .25, .25, 60) * f, T = $(Q(n.perspectiveTangentGain, 2), .25, 4), E = Math.atan(T * Math.tan(w)), D = Math.hypot(d.w, d.h, m), O = C ? D * .5 / Math.tan(E) : Infinity, k = (e, t, n, r = !0) => {
		let i = e - h, a = g - t, o = Number.isFinite(n) ? n : 0, s = (.5 - (r ? $(o, 0, 1) : o)) * m, c = y * i + b * s, l = -b * i + y * s;
		return {
			x: c,
			y: x * a - S * l,
			z: S * a + x * l
		};
	}, A = (e) => {
		if (e.length < 3) return null;
		let t = e.map((e) => k(e.x, e.y, e.depth, !1)), n = t[0], r = null;
		for (let e = 1; e + 1 < t.length && !r; e++) for (let i = e + 1; i < t.length; i++) {
			let a = t[e], o = t[i], s = {
				x: a.x - n.x,
				y: a.y - n.y,
				z: a.z - n.z
			}, c = {
				x: o.x - n.x,
				y: o.y - n.y,
				z: o.z - n.z
			}, l = {
				x: s.y * c.z - s.z * c.y,
				y: s.z * c.x - s.x * c.z,
				z: s.x * c.y - s.y * c.x
			}, u = Math.hypot(l.x, l.y, l.z);
			if (u > 2 ** -52) {
				r = {
					x: l.x / u,
					y: l.y / u,
					z: l.z / u
				};
				break;
			}
		}
		return r ? {
			normal: r,
			centroid: t.reduce((e, n) => ({
				x: e.x + n.x / t.length,
				y: e.y + n.y / t.length,
				z: e.z + n.z / t.length
			}), {
				x: 0,
				y: 0,
				z: 0
			})
		} : null;
	}, j = -Infinity;
	for (let e of [d.x, d.x + d.w]) for (let t of [d.y, d.y + d.h]) for (let n of [0, 1]) j = Math.max(j, k(e, t, n).z);
	let M = C ? Math.max(O, j + D * .01) : Infinity, N = (e, t, n, r = !0) => {
		let i = k(e, t, n, r);
		if (!C) return {
			x: i.x,
			y: -i.y
		};
		let a = M / Math.max(M * 1e-9, M - i.z);
		return {
			x: i.x * a,
			y: -i.y * a
		};
	}, P = [];
	for (let e of [d.x, d.x + d.w]) for (let t of [d.y, d.y + d.h]) for (let n of [0, 1]) P.push(N(e, t, n));
	let F = Math.min(...P.map((e) => e.x)), I = Math.max(...P.map((e) => e.x)), L = Math.min(...P.map((e) => e.y)), R = Math.max(...P.map((e) => e.y)), z = Math.max(Number.MIN_VALUE, I - F), B = Math.max(Number.MIN_VALUE, R - L), V = Math.min(t.w / z, t.h / B) * .94, H = t.x + (t.w - z * V) / 2 - F * V, U = t.y + (t.h - B * V) / 2 - L * V, W = (e, t, n) => {
		let r = N(e, t, n);
		return {
			x: H + r.x * V,
			y: U + r.y * V
		};
	}, ee = (e, t, n) => {
		let r = N(e, t, n, !1);
		return {
			x: H + r.x * V,
			y: U + r.y * V
		};
	}, te = { ...d }, G = W(h, g, 0), ne = W(h, g, 1), re = ne.x - G.x, ie = ne.y - G.y, K = (e, t) => k(e === "x" ? t === "min" ? d.x : d.x + d.w : h, e === "y" ? t === "min" ? d.y : d.y + d.h : g, e === "depth" ? t === "min" ? 0 : 1 : .5).z, ae = K("x", "min") <= K("x", "max") ? "min" : "max", oe = K("y", "min") <= K("y", "max") ? "min" : "max", q = K("depth", "min") >= K("depth", "max") ? 0 : 1, se = +(q === 0), ce = (e) => {
		let t = e === "min" ? d.x : d.x + d.w, n = W(t, d.y, q), r = W(t, d.y + d.h, q);
		return (n.x + r.x) / 2;
	}, le = (e) => {
		let t = e === "min" ? d.y : d.y + d.h, n = W(d.x, t, q), r = W(d.x + d.w, t, q);
		return (n.y + r.y) / 2;
	}, J = ce("min") <= ce("max") ? "min" : "max", Y = le("min") >= le("max") ? "min" : "max", X = (e) => 1 / Math.max(1, Math.trunc(e)) / (1 + s / 100), Z = (e, t, n = !1) => n || t <= 1 ? .5 : ($(Math.trunc(e), 0, Math.max(0, t - 1)) + .5) / t;
	return {
		scene: d,
		front: te,
		depthX: re,
		depthY: ie,
		modelDepth: m,
		pieScaleY: $(Math.sin(Math.max(1, Math.abs(r)) * f) ** 1.15, .2, 1),
		pieThicknessFraction: .3 * Math.max(0, Math.cos(Math.abs(r) * f)),
		project: W,
		projectUnbounded: ee,
		cameraDepth(e, t, n) {
			return k(e, t, n, !1).z;
		},
		cameraProjectionWeight(e, t, n) {
			if (!C) return 1;
			let r = k(e, t, n, !1).z;
			return 1 / Math.max(M * 1e-9, M - r);
		},
		cameraFacing(e) {
			let t = A(e);
			if (!t) return !1;
			let { normal: n, centroid: r } = t, i = C ? {
				x: -r.x,
				y: -r.y,
				z: M - r.z
			} : {
				x: 0,
				y: 0,
				z: 1
			}, a = n.x * i.x + n.y * i.y + n.z * i.z, o = Math.hypot(i.x, i.y, i.z);
			return o > 0 && a > o * 1e-10;
		},
		cameraNormal(e) {
			return A(e)?.normal ?? null;
		},
		topology: {
			farX: ae,
			farY: oe,
			axisX: J,
			axisY: Y,
			nearDepth: q,
			farDepth: se
		},
		seriesDepth: Z,
		prismDepth: X,
		prismInterval(e, t, n = !1) {
			let r = Z(e, t, n), i = X(n ? 1 : t) / 2;
			return {
				near: $(r - i, 0, 1),
				far: $(r + i, 0, 1)
			};
		}
	};
}
//#endregion
export { L as A, ge as C, K as D, he as E, k as F, O as I, b as L, B as M, D as N, ae as O, E as P, _e as S, fe as T, ye as _, Be as a, le as b, Fe as c, Oe as d, Ne as f, Ce as g, we as h, Ue as i, z as j, ie as k, Ee as l, Te as m, He as n, Ve as o, De as p, Ie as r, Pe as s, Re as t, Me as u, se as v, q as w, oe as x, ce as y };
