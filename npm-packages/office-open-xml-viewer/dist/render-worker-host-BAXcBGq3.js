//#region packages/docx/src/render-worker.ts?worker&url
var e = "" + new URL("assets/render-worker-CV9Mg4j9.js", import.meta.url).href;
//#endregion
//#region packages/docx/src/render-worker-host.ts
function t() {
	return new Worker(e, { type: "module" });
}
//#endregion
export { t as createRenderWorker };
