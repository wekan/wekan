//#region packages/docx/src/layout/fingerprint.ts
function e(t, n = "$") {
	if (t === null || typeof t == "boolean" || typeof t == "number" || typeof t == "string") return JSON.stringify(t);
	if (Array.isArray(t)) return `[${t.map((t, r) => e(t, `${n}[${r}]`)).join(",")}]`;
	if (typeof t == "object") {
		let r = t;
		return `{${Object.keys(r).sort().map((t) => `${JSON.stringify(t)}:${e(r[t], `${n}.${t}`)}`).join(",")}}`;
	}
	throw TypeError(`Cannot fingerprint ${typeof t} at ${n}`);
}
function t(t, n) {
	let r = e(n);
	return `${t}:${encodeURIComponent(r)}`;
}
//#endregion
//#region packages/docx/src/layout/source-key.ts
function n(e) {
	return `${e.story}:${encodeURIComponent(e.storyInstance)}:${e.path.join(".")}`;
}
function r(e, t, r) {
	if (t.length === 0 || r.length === 0) throw RangeError("Body occurrence identity requires a flow domain and fragment start");
	return [
		"body-occurrence",
		encodeURIComponent(n(e)),
		encodeURIComponent(t),
		encodeURIComponent(r)
	].join("/");
}
function i(e, t) {
	return `image:${n(e)}:${encodeURIComponent(t)}`;
}
function a(e, t) {
	return `math:${n(e)}:${encodeURIComponent(t)}`;
}
function o(e) {
	return t("chart-resource", e);
}
function s(e, t) {
	return `anchor:${n(e)}:${encodeURIComponent(t)}`;
}
//#endregion
export { a, i, r as n, n as o, o as r, t as s, s as t };
