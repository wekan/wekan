import { t as e } from "./chunk-DmhlhrBa.js";
import { B as t, R as n, W as r, Zt as i, a, cn as o, et as s, pt as c, sn as l, ut as u, vt as d, z as f } from "./line-metrics-BGtFM-ec.js";
import { C as p, D as m, E as h, S as g, T as _, _ as v, a as y, b, c as x, d as ee, f as te, g as ne, h as re, i as S, l as C, m as ie, n as ae, o as oe, p as se, r as ce, s as le, t as ue, u as de, v as fe, w as pe, x as me, y as he } from "./canvas-viewer-mechanics-CDNMJ-Yz.js";
import { a as ge, i as _e, t as ve } from "./bounded-raw-part-cache-C6ro6Ezf.js";
import { c as ye, i as be, l as xe, n as Se, o as w, r as Ce, s as we, t as Te } from "./dom-interaction-boundary-CDGegIB5.js";
import { A as Ee, C as T, D as E, E as De, O as D, S as Oe, T as O, _ as ke, a as Ae, b as je, c as Me, d as Ne, f as Pe, g as Fe, h as Ie, j as Le, k as Re, l as ze, m as Be, n as k, o as Ve, p as He, s as Ue, t as A, v as We, w as Ge, x as Ke, y as qe } from "./document-pull-client-BssAk95w.js";
import { l as Je, s as Ye } from "./pixel-budget-Dgjw269h.js";
import { a as j } from "./units-EJdC96r6.js";
import { i as Xe, s as Ze } from "./raster-target-ojDdQizC.js";
import { n as Qe } from "./renderer-module-contract-Cu-GKuPd.js";
import { n as $e, t as M } from "./highlight-rect-DBcYVJDv.js";
import { o as N } from "./source-key-BkBB3X82.js";
import { i as et, n as P, r as tt, t as nt } from "./comments-Brfxa3hQ.js";
//#region packages/docx/src/worker.ts?worker&inline
var rt = "var e=(e,t)=>()=>(e&&(t=e(e=0)),t),t=class{__destroy_into_raw(){let e=this.__wbg_ptr;return this.__wbg_ptr=0,r.unregister(this),e}free(){let e=this.__destroy_into_raw();v.__wbg_docxarchive_free(e,0)}acknowledge_document_chunk(e,t,n){let r=v.docxarchive_acknowledge_document_chunk(this.__wbg_ptr,e,t,n);if(r[1])throw p(r[0])}assert_healthy(){let e=v.docxarchive_assert_healthy(this.__wbg_ptr);if(e[1])throw p(e[0])}cancel_document_cursor(){v.docxarchive_cancel_document_cursor(this.__wbg_ptr)}close_document_session(){v.docxarchive_close_document_session(this.__wbg_ptr)}document_chunk_done(){let e=v.docxarchive_document_chunk_done(this.__wbg_ptr);if(e[2])throw p(e[1]);return e[0]!==0}document_cursor_resource_usage(){let e=v.docxarchive_document_cursor_resource_usage(this.__wbg_ptr);if(e[3])throw p(e[2]);var t=i(e[0],e[1]).slice();return v.__wbindgen_free(e[0],e[1]*1,1),t}extract_image(e){let t=f(e,v.__wbindgen_malloc,v.__wbindgen_realloc),n=_,r=v.docxarchive_extract_image(this.__wbg_ptr,t,n);if(r[3])throw p(r[2]);var a=i(r[0],r[1]).slice();return v.__wbindgen_free(r[0],r[1]*1,1),a}constructor(e,t,n,i){let a=d(e,v.__wbindgen_malloc),o=_,s=v.docxarchive_new(a,o,!u(t),u(t)?BigInt(0):t,!u(n),u(n)?BigInt(0):n,!u(i),u(i)?BigInt(0):i);if(s[2])throw p(s[1]);return this.__wbg_ptr=s[0]>>>0,r.register(this,this.__wbg_ptr,this),this}open_document_cursor(e,t){let n=v.docxarchive_open_document_cursor(this.__wbg_ptr,e,t);if(n[1])throw p(n[0])}parse(){let e=v.docxarchive_parse(this.__wbg_ptr);if(e[3])throw p(e[2]);var t=i(e[0],e[1]).slice();return v.__wbindgen_free(e[0],e[1]*1,1),t}pull_document_chunk(e,t,n,r){let a=v.docxarchive_pull_document_chunk(this.__wbg_ptr,e,t,n,r);if(a[3])throw p(a[2]);var o=i(a[0],a[1]).slice();return v.__wbindgen_free(a[0],a[1]*1,1),o}resource_usage(){let e=v.docxarchive_resource_usage(this.__wbg_ptr);if(e[3])throw p(e[2]);var t=i(e[0],e[1]).slice();return v.__wbindgen_free(e[0],e[1]*1,1),t}to_markdown(){let e,t;try{let i=v.docxarchive_to_markdown(this.__wbg_ptr);var n=i[0],r=i[1];if(i[3])throw n=0,r=0,p(i[2]);return e=n,t=r,s(n,r)}finally{v.__wbindgen_free(e,t,1)}}};Symbol.dispose&&(t.prototype[Symbol.dispose]=t.prototype.free);function n(){return{__proto__:null,\"./docx_parser_bg.js\":{__proto__:null,__wbg___wbindgen_throw_6b64449b9b9ed33c:function(e,t){throw Error(s(e,t))},__wbg_error_a6fa202b58aa1cd3:function(e,t){let n,r;try{n=e,r=t,console.error(s(e,t))}finally{v.__wbindgen_free(n,r,1)}},__wbg_new_227d7c05414eb861:function(){return Error()},__wbg_stack_3b0d974bbf31e44f:function(e,t){let n=t.stack,r=f(n,v.__wbindgen_malloc,v.__wbindgen_realloc),i=_;o().setInt32(e+4,i,!0),o().setInt32(e+0,r,!0)},__wbindgen_cast_0000000000000001:function(e,t){return s(e,t)},__wbindgen_init_externref_table:function(){let e=v.__wbindgen_externrefs,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)}}}}const r=typeof FinalizationRegistry>`u`?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(e=>v.__wbg_docxarchive_free(e>>>0,1));function i(e,t){return e>>>=0,l().subarray(e/1,e/1+t)}let a=null;function o(){return(a===null||a.buffer.detached===!0||a.buffer.detached===void 0&&a.buffer!==v.memory.buffer)&&(a=new DataView(v.memory.buffer)),a}function s(e,t){return e>>>=0,ee(e,t)}let c=null;function l(){return(c===null||c.byteLength===0)&&(c=new Uint8Array(v.memory.buffer)),c}function u(e){return e==null}function d(e,t){let n=t(e.length*1,1)>>>0;return l().set(e,n/1),_=e.length,n}function f(e,t,n){if(n===void 0){let n=g.encode(e),r=t(n.length,1)>>>0;return l().subarray(r,r+n.length).set(n),_=n.length,r}let r=e.length,i=t(r,1)>>>0,a=l(),o=0;for(;o<r;o++){let t=e.charCodeAt(o);if(t>127)break;a[i+o]=t}if(o!==r){o!==0&&(e=e.slice(o)),i=n(i,r,r=o+e.length*3,1)>>>0;let t=l().subarray(i+o,i+r),a=g.encodeInto(e,t);o+=a.written,i=n(i,r,o,1)>>>0}return _=o,i}function p(e){let t=v.__wbindgen_externrefs.get(e);return v.__externref_table_dealloc(e),t}let m=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0});m.decode();let h=0;function ee(e,t){return h+=t,h>=2146435072&&(m=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0}),m.decode(),h=t),m.decode(l().subarray(e,e+t))}const g=new TextEncoder;`encodeInto`in g||(g.encodeInto=function(e,t){let n=g.encode(e);return t.set(n),{read:e.length,written:n.length}});let _=0,v;function te(e,t){return v=e.exports,a=null,c=null,v.__wbindgen_start(),v}async function ne(e,t){if(typeof Response==`function`&&e instanceof Response){if(typeof WebAssembly.instantiateStreaming==`function`)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if(e.ok&&n(e.type)&&e.headers.get(`Content-Type`)!==`application/wasm`)console.warn(\"`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\\n\",t);else throw t}let r=await e.arrayBuffer();return await WebAssembly.instantiate(r,t)}else{let n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}function n(e){switch(e){case`basic`:case`cors`:case`default`:return!0}return!1}}async function y(e){if(v!==void 0)return v;e!==void 0&&(Object.getPrototypeOf(e)===Object.prototype?{module_or_path:e}=e:console.warn(`using deprecated parameters for the initialization function; pass a single object instead`));let t=n();(typeof e==`string`||typeof Request==`function`&&e instanceof Request||typeof URL==`function`&&e instanceof URL)&&(e=fetch(e));let{instance:r,module:i}=await ne(await e,t);return te(r,i)}async function b(e){return v=void 0,a=null,c=null,y(e)}var x=class e extends Error{code;constructor(t,n){super(n),this.name=`OoxmlError`,this.code=t,Object.setPrototypeOf(this,e.prototype)}},S=class e extends Error{code=`ooxml-resource-limit`;details;constructor(t,n){super(t),this.name=`OoxmlResourceLimitError`;let r=n.violation,i=Object.freeze({format:r.format,operation:r.operation,resource:r.resource,metric:r.metric,...r.part===void 0?{}:{part:r.part},limit:r.limit,observed:r.observed,configurable:r.configurable,usage:Object.freeze({archiveEntryCount:r.usage.archiveEntryCount,declaredInflatedBytes:r.usage.declaredInflatedBytes,...r.usage.largestInflatedEntryBytes===void 0?{}:{largestInflatedEntryBytes:r.usage.largestInflatedEntryBytes},distinctInflatedBytes:r.usage.distinctInflatedBytes,operationInflatedBytes:r.usage.operationInflatedBytes})});this.details=Object.freeze({stage:n.stage,violation:i}),Object.setPrototypeOf(this,e.prototype)}};function re(e){return e===`image-dimension`||e===`image-pixels`||e===`active-decoded-bytes`}function C(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>=0}function ie(e){if(!(!e||typeof e!=`object`))try{let t=e,n=t.code,r=t.metric,i=t.limit,a=t.observed;return n!==`ooxml-decoded-image-limit`||!re(r)||!C(i)||!C(a)||a<=i?void 0:{metric:r,limit:i,observed:a}}catch{return}}var w,T,E,D=e((()=>{w=1<<25,T=1<<27,w*4,T*4,E=class e extends RangeError{code=`ooxml-decoded-image-limit`;constructor(t,n,r){super(`OOXML decoded image limit exceeded: ${t} ${r} > ${n}`),this.metric=t,this.limit=n,this.observed=r,this.name=`OoxmlDecodedImageLimitError`,Object.setPrototypeOf(this,e.prototype)}}}));function O(e){if(!(typeof e!=`object`||!e))try{let t=e,n=t.code,r=t.message;return n===`ooxml-tiff-decode`&&typeof r==`string`?{message:r}:void 0}catch{return}}var ae=e((()=>{}));function oe(e){if(!e.startsWith(`data:`))return null;let t=e.indexOf(`,`);if(t===-1)return null;let n=atob(e.slice(t+1)),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}var se=class{state=`uninitialized`;generationValue=0;readiness;poisonListeners=new Set;constructor(e,t,n){this.initialize=e,this.reinitialize=t,this.normalizeFailure=n}get generation(){return this.generationValue}get poisoned(){return this.state===`poisoned`}onPoison(e){return this.poisonListeners.add(e),()=>this.poisonListeners.delete(e)}async ensureReady(){if(this.state!==`ready`){if(!this.readiness){let e=this.state===`uninitialized`?this.initialize:this.reinitialize;this.readiness=Promise.resolve().then(e).then(()=>{this.generationValue+=1,this.state=`ready`,this.readiness=void 0},e=>{throw this.readiness=void 0,e})}await this.readiness}}run(e){try{return e()}catch(e){let t=this.normalizeFailure(e);throw t?(this.poison(t),t):e}}tryRunReady(e){if(this.state!==`ready`)return{current:!1};let t=this.generationValue,n=this.run(e);return this.state!==`ready`||t!==this.generationValue?{current:!1}:{current:!0,generation:t,value:n}}poison(e){this.state=`poisoned`,this.readiness=void 0;for(let t of this.poisonListeners)t(e)}assertCurrent(e){if(this.state!==`ready`||e!==this.generationValue)throw Error(`WASM archive session belongs to a discarded runtime generation`)}},k=class e extends Error{code=`parser-crashed`;constructor(t){super(t),this.name=`WasmTrapError`,Object.setPrototypeOf(this,e.prototype)}};function ce(e){let t=globalThis.WebAssembly?.RuntimeError;return t&&e instanceof t||e instanceof RangeError?!0:e instanceof Error?e.name===`RuntimeError`||e.name===`CompileError`||e.name===`LinkError`||e.name===`InternalError`||e.name===`OOMError`:!1}function le(e){try{if((typeof e!=`object`||!e)&&typeof e!=`function`)return;let t=Reflect.get(e,`__destroy_into_raw`);typeof t==`function`&&Reflect.apply(t,e,[])}catch{}}function ue(e,t){return e({module_or_path:t})}var de=class{runtime;wasmInput=null;currentArchive=null;constructor(e,t={}){this.init=e,this.options=t,this.runtime=new se(()=>this.invokeConfigured(this.init),()=>this.invokeConfigured(this.options.reinit??this.init),fe),this.runtime.onPoison(()=>this.dropPoisonedArchive())}setWasmInput(e){this.wasmInput=e,this.runtime.ensureReady().catch(()=>void 0)}setWasmUrl(e){this.setWasmInput(e)}get archive(){return this.currentArchive}setArchive(e){this.freeArchive(),this.currentArchive=e}disposeArchive(){this.freeArchive()}get poisoned(){return this.runtime.poisoned}async ensureReady(){await this.runtime.ensureReady()}run(e){return this.runtime.run(e)}poison(){this.runtime.poison(new k(`WASM parser was recycled`))}invokeConfigured(e){return this.wasmInput===null?Promise.reject(Error(`WasmParserHost: setWasmInput was never called`)):ue(e,this.wasmInput)}freeArchive(){this.currentArchive!==null&&this.options.freeArchive&&this.options.freeArchive(this.currentArchive),this.currentArchive=null}dropPoisonedArchive(){let e=this.currentArchive;this.currentArchive=null,le(e)}};function fe(e){return ce(e)?new k(`WASM parser trapped and was recycled: ${e instanceof Error?e.message:String(e)}`):null}function A(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>0}function pe(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return A(t.requiredBytes)&&A(t.offeredBytes)&&t.requiredBytes>t.offeredBytes}var j=class e extends RangeError{code=`ooxml-insufficient-credit`;requiredBytes;offeredBytes;constructor(t){super(`Pull unit requires ${t.requiredBytes} bytes but credit is ${t.offeredBytes}`),this.name=`PullSessionInsufficientCreditError`,this.requiredBytes=t.requiredBytes,this.offeredBytes=t.offeredBytes,Object.setPrototypeOf(this,e.prototype)}};function M(e){if(e instanceof j)return e;let t=e instanceof Error?e.message:String(e);if(!t.startsWith(`OOXML_INSUFFICIENT_CREDIT:`))return;let n;try{n=JSON.parse(t.slice(26))}catch{return}if(!n||typeof n!=`object`||Array.isArray(n))return;let r=n;if(!(r.code!==`ooxml-insufficient-credit`||!pe(r)))return new j(r)}function me(e,t,n){let r=M(e);if(!(!r||r.offeredBytes!==t||r.requiredBytes>n))return r}D(),ae();const N=`OOXML_RESOURCE_LIMIT:`;function P(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>=0}function F(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return P(t.archiveEntryCount)&&P(t.declaredInflatedBytes)&&(t.largestInflatedEntryBytes===void 0||P(t.largestInflatedEntryBytes))&&P(t.distinctInflatedBytes)&&P(t.operationInflatedBytes)}function I(e){let t;try{t=JSON.parse(new TextDecoder().decode(e))}catch{throw TypeError(`OOXML resource usage checkpoint is not valid JSON`)}if(!F(t))throw TypeError(`OOXML resource usage checkpoint is invalid`);return t}function L(e){return e===`docx`||e===`xlsx`||e===`pptx`}function R(e){return e===`container`||e===`decompression`||e===`parsing`||e===`serialization`||e===`layout`||e===`rendering`||e===`worker`}function z(e,t){return typeof e==`string`&&e.length>0&&e.length<=t&&!/[\\u0000-\\u001f\\u007f]/u.test(e)}function B(e){return z(e,128)&&/^[a-z0-9][a-z0-9-]*$/u.test(e)}function he(e){return!z(e,4096)||e.startsWith(`/`)||e.startsWith(`\\\\`)||e.includes(`\\\\`)||e.includes(`?`)||e.includes(`#`)||e.includes(`://`)||/^[a-z]:/iu.test(e)?!1:e.split(`/`).every(e=>e!==``&&e!==`.`&&e!==`..`)}const V=new Map([[`archive-entry:declared-inflated-bytes`,{stage:`container`,part:`required`}],[`archive-entry:actual-inflated-bytes`,{stage:`decompression`,part:`required`}],[`archive:entry-count`,{stage:`container`,part:`forbidden`}],[`archive:central-directory-bytes`,{stage:`container`,part:`forbidden`,configurable:!1}],[`archive:distinct-inflated-bytes`,{stage:`decompression`,part:`required`}],[`xml-event:bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`xml-context:bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`xml-tree:depth`,{stage:`parsing`,part:`optional`,configurable:!1}],[`worksheet-row:projected-bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`worksheet-shell:projected-bytes`,{stage:`parsing`,part:`optional`,configurable:!1}]]),ge=new Set([...V.keys()].map(e=>e.slice(0,e.indexOf(`:`)))),_e=new Set([...V.keys()].map(e=>e.slice(e.indexOf(`:`)+1)));function ve(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return!L(t.format)||!z(t.operation,256)||!B(t.resource)||!B(t.metric)||!P(t.limit)||!P(t.observed)||typeof t.configurable!=`boolean`||!F(t.usage)?!1:!(`part`in t)||he(t.part)}function H(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;if(!R(t.stage)||!ve(t.violation))return!1;let n=t.violation,r=V.get(`${n.resource}:${n.metric}`);return r?t.stage!==r.stage||r.configurable===!1&&n.configurable!==!1?!1:r.part===`required`?n.part!==void 0:r.part===`forbidden`?n.part===void 0:!0:!(ge.has(n.resource)&&_e.has(n.metric))}function ye(e){return{archiveEntryCount:e.archiveEntryCount,declaredInflatedBytes:e.declaredInflatedBytes,...e.largestInflatedEntryBytes===void 0?{}:{largestInflatedEntryBytes:e.largestInflatedEntryBytes},distinctInflatedBytes:e.distinctInflatedBytes,operationInflatedBytes:e.operationInflatedBytes}}function be(e){if(!H(e))return;let t=e.violation,n={stage:e.stage,violation:{format:t.format,operation:t.operation,resource:t.resource,metric:t.metric,...t.part===void 0?{}:{part:t.part},limit:t.limit,observed:t.observed,configurable:t.configurable,usage:ye(t.usage)}};return H(n)?n:void 0}function U(e){let t=e.violation;return`OOXML resource limit exceeded${t.part?` for ${t.part}`:``}: ${t.metric} ${t.observed} > ${t.limit}`}function xe(e){let t=e instanceof Error?e.message:String(e);if(!t.startsWith(N))return;let n;try{n=JSON.parse(t.slice(21))}catch{return}if(!n||typeof n!=`object`)return;let r=n;if(!(r.code!==`ooxml-resource-limit`||!H(r.details)))return new S(U(r.details),r.details)}function Se(e){let t=ie(e);if(t){let e=new E(t.metric,t.limit,t.observed);return{message:e.message,errorName:e.name,code:e.code,decodedImage:t}}let n=O(e);if(n)return{message:n.message,errorName:`TiffDecodeError`,code:`ooxml-tiff-decode`};let r=M(e);if(r)return{message:r.message,errorName:r.name,code:r.code,insufficientCredit:{requiredBytes:r.requiredBytes,offeredBytes:r.offeredBytes}};let i=e instanceof x||e instanceof S?e:xe(e);if(i instanceof S){let e=be(i.details);return e?{message:typeof i.message==`string`?i.message:U(e),errorName:`OoxmlResourceLimitError`,code:`ooxml-resource-limit`,resourceLimit:e}:{message:`Invalid OOXML resource-limit error payload`,errorName:`Error`}}if(i instanceof x)return{message:typeof i.message==`string`?i.message:String(i.message),errorName:z(i.name,128)?i.name:`OoxmlError`,...B(i.code)?{code:i.code}:{}};let a=e instanceof Error?e.message:String(e);if(typeof a==`string`&&a.startsWith(N))return{message:`Invalid OOXML resource-limit payload`,errorName:`Error`};let o=e instanceof Error?e:Error(a),s=o;return{message:typeof o.message==`string`?o.message:String(o.message),errorName:z(o.name,128)?o.name:`Error`,...typeof s.code==`string`?{code:s.code}:{}}}function W(e){try{return Se(e)}catch{return{message:`Worker operation failed with an unreadable error`,errorName:`Error`}}}function Ce(e){return e.byteOffset===0&&e.byteLength===e.buffer.byteLength&&e.buffer instanceof ArrayBuffer?e.buffer:e.slice().buffer}Object.freeze({maxArchiveEntryBytes:134217728,maxTotalInflatedBytes:268435456,maxArchiveEntries:4096});function we(e){return[e.maxArchiveEntryBytes===null?0n:BigInt(e.maxArchiveEntryBytes),e.maxTotalInflatedBytes===null?0n:BigInt(e.maxTotalInflatedBytes),e.maxArchiveEntries===null?0n:BigInt(e.maxArchiveEntries)]}const G=`ooxml-pull-v1`;function K(e,t){if(!Number.isSafeInteger(e)||e<=0)throw RangeError(`${t} must be a positive safe integer`)}function Te(e){if(!(typeof e==`string`&&e.length>0||typeof e==`number`&&Number.isSafeInteger(e)&&e>0))throw RangeError(`session id must be a non-empty string or positive safe integer`)}var q=class{owner;queue=Promise.resolve();leases=new Map;retainedBytes=0;retainedCount=0;maxRetainedBytes;maxRetainedCount;cleanups=new Set;pendingFatalCleanups=[];poisonRunning=!1;fatal;constructor(e){this.maxRetainedBytes=e?.maxRetainedBytes??64*1024*1024,this.maxRetainedCount=e?.maxRetainedCount??256,K(this.maxRetainedBytes,`max retained lease bytes`),K(this.maxRetainedCount,`max retained lease count`)}enqueue(e){let t=this.queue.then(e,e);return this.queue=t.then(()=>void 0,()=>void 0),t}acquire(e){return this.owner===void 0?(this.owner=e,!0):this.owner===e}release(e){this.owner===e&&(this.owner=void 0)}retainLease(e,t,n){if(!Number.isSafeInteger(n)||n<0)throw RangeError(`retained lease bytes are invalid`);let r=this.leases.get(e)??new Map;if(r.has(t))throw Error(`driver returned a duplicate lease id`);if(this.retainedCount+1>this.maxRetainedCount)throw RangeError(`retained lease count exceeds limit`);if(this.retainedBytes+n>this.maxRetainedBytes)throw RangeError(`retained lease bytes exceed limit`);r.set(t,n),this.leases.set(e,r),this.retainedCount++,this.retainedBytes+=n}releaseLease(e,t){let n=this.leases.get(e),r=n?.get(t);r!==void 0&&(n?.delete(t),n?.size===0&&this.leases.delete(e),this.retainedCount--,this.retainedBytes-=r)}registerCleanup(e){return this.fatal?(this.poisonRunning?this.pendingFatalCleanups.push(e):this.enqueue(e).catch(()=>void 0),()=>void 0):(this.cleanups.add(e),()=>this.cleanups.delete(e))}get fatalError(){return this.fatal}get registeredHostCount(){return this.cleanups.size}async poison(e){if(this.fatal??=e,this.poisonRunning)return this.fatal;this.poisonRunning=!0,this.pendingFatalCleanups.push(...this.cleanups);try{let e;for(;(e=this.pendingFatalCleanups.shift())!==void 0;)await e().catch(()=>void 0)}finally{this.poisonRunning=!1}return this.fatal}},Ee=class{options;coordinator;coordinatorOwner=Symbol(`pull-session-host`);unregisterCleanup;sequence=0;unacked;leases=new Map;activeDriverLeases=new Set;nextWireLeaseId;cancelRequested=!1;cancelComplete=!1;closeRequested=!1;closeComplete=!1;driverCancelComplete=!1;driverCloseComplete=!1;completed=!1;constructor(e){Te(e.sessionId),K(e.operationId,`operation id`),K(e.generation,`generation`),K(e.maxByteCredit,`max byte credit`),e.wireLeaseIdStart!==void 0&&K(e.wireLeaseIdStart,`wire lease id start`),this.options=e,this.coordinator=e.coordinator,this.nextWireLeaseId=e.wireLeaseIdStart??1,this.unregisterCleanup=this.coordinator.registerCleanup(()=>this.forceFatalCleanup())}dispatch(e,t){return this.coordinator.enqueue(async()=>{let n=await this.execute(e);try{t(n.response,n.transfer)}catch(e){throw await this.rollbackFailedPost(n),e}})}async rollbackFailedPost(e){let t=e.response;if(t.kind===`chunk`){let n=t.leaseId===void 0?void 0:this.leases.get(t.leaseId);try{await this.options.driver.disposeInvalidChunk?.({payload:t.payload,byteLength:t.byteLength,done:t.done,leaseId:n?.driverLeaseId,retainedBytes:n?.retainedBytes,transfer:e.transfer})}catch{}}this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);for(let[e,t]of[...this.leases])try{await this.options.driver.releaseLease?.(t.driverLeaseId)}catch{}finally{this.leases.delete(e),this.activeDriverLeases.delete(t.driverLeaseId),this.coordinator.releaseLease(this.coordinatorOwner,e)}if(this.cancelRequested=!0,!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch{}this.unregisterCleanup()}async execute(e){try{if(this.isStaleLifecycle(e)){let t=e.kind===`cancel`?`cancel`:`close`;return this.sameOperationIdentity(e)?{response:this.accepted(e,t,!0)}:{response:this.errorResponse(e,{message:`stale lifecycle targets another session or operation`,errorName:`PullSessionProtocolError`,code:`ooxml-stale-lifecycle`})}}this.validateCommandIdentity(e);let t=this.coordinator.fatalError;if(t)return e.kind===`pull`?{response:this.errorResponse(e,t)}:(e.kind===`cancel`?await this.cancel():e.kind===`close`?await this.close():e.kind===`release`&&await this.release(e.leaseId),{response:this.accepted(e,e.kind)});switch(e.kind){case`pull`:return await this.pull(e);case`ack`:return await this.ack(e.sequence),{response:this.accepted(e,`ack`)};case`release`:return await this.release(e.leaseId),{response:this.accepted(e,`release`)};case`cancel`:return await this.cancel(),{response:this.accepted(e,`cancel`)};case`close`:return await this.close(),{response:this.accepted(e,`close`)}}}catch(t){let n=W(t);return n.code===`ooxml-resource-limit`&&(n=await this.coordinator.poison(n)),{response:this.errorResponse(e,n)}}}async pull(e){if(this.closeRequested||this.cancelRequested||this.completed)throw Error(`pull session is closed`);if(this.unacked)throw Error(`previous chunk is not acknowledged`);if(!Number.isSafeInteger(e.sequence)||e.sequence<0||e.sequence!==this.sequence)throw Error(`pull command sequence mismatch`);if(this.validateHostCredit(e.byteCredit),!this.coordinator.acquire(this.coordinatorOwner))throw Error(`another operation has an unacknowledged package chunk`);let t;try{t=await this.options.driver.pull(e.byteCredit)}catch(e){throw this.coordinator.release(this.coordinatorOwner),e}let n=!1,r=!1,i,a;try{let o=this.options.driver.measureChunk(t),s=this.arrayBufferTransferBytes(t.transfer);if(o<s)throw RangeError(`measured chunk bytes are below ArrayBuffer transfer bytes`);if(a=Math.max(o,s),t.leaseId!==void 0){if(K(t.leaseId,`lease id`),t.retainedBytes===void 0)throw Error(`retained lease bytes are required`);if(this.activeDriverLeases.has(t.leaseId))throw r=!0,Error(`driver returned an active duplicate lease id`);i=this.allocateWireLeaseId(),this.coordinator.retainLease(this.coordinatorOwner,i,t.retainedBytes),this.leases.set(i,{driverLeaseId:t.leaseId,retainedBytes:t.retainedBytes}),this.activeDriverLeases.add(t.leaseId),n=!0}else if(t.retainedBytes!==void 0)throw Error(`retained lease bytes require a lease id`);if(!Number.isSafeInteger(a)||a<0)throw RangeError(`host chunk byte length must be a non-negative safe integer`);if(a>e.byteCredit)throw RangeError(`host chunk exceeds byte credit`)}catch(e){let a;try{await this.options.driver.disposeInvalidChunk?.(t)}catch(e){a=e}if(n&&i!==void 0)try{await this.release(i)}catch(e){a??=e}else if(t.leaseId!==void 0&&!r)try{await this.options.driver.releaseLease?.(t.leaseId)}catch(e){a??=e}if(r)try{await this.cancel()}catch(e){a??=e}throw this.coordinator.release(this.coordinatorOwner),a||e}return this.unacked={sequence:this.sequence,done:t.done},{response:{kind:`chunk`,protocol:G,...this.identity(),requestId:e.requestId,sequence:this.sequence,byteLength:a,done:t.done,payload:t.payload,leaseId:i,usage:this.resourceUsage()},transfer:t.transfer}}async ack(e){if(!Number.isSafeInteger(e)||e<0)throw RangeError(`invalid ack sequence`);if(e<this.sequence)return;if(!this.unacked||e!==this.sequence)throw Error(`ack sequence mismatch`);let t=this.unacked.done;await this.options.driver.acknowledge?.(e),this.unacked=void 0,this.coordinator.release(this.coordinatorOwner),this.sequence++,t&&(this.completed=!0,this.maybeUnregisterCompleted())}async release(e){K(e,`wire lease id`);let t=this.leases.get(e);t&&(await this.options.driver.releaseLease?.(t.driverLeaseId),this.leases.delete(e),this.activeDriverLeases.delete(t.driverLeaseId),this.coordinator.releaseLease(this.coordinatorOwner,e),this.maybeUnregisterCompleted())}async cancel(){if(this.cancelComplete)return;this.cancelRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;try{await this.releaseAllLeases()}catch(t){e=t}if(!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch(t){e??=t}if(e)throw e;this.cancelComplete=!0,this.unregisterCleanup()}async close(){if(this.closeComplete)return;this.closeRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;try{await this.releaseAllLeases()}catch(t){e=t}if(!this.driverCloseComplete)try{await this.options.driver.close?.(),this.driverCloseComplete=!0}catch(t){e??=t}if(e)throw e;this.closeComplete=!0,this.unregisterCleanup()}async releaseAllLeases(){let e;for(let t of[...this.leases.keys()])try{await this.release(t)}catch(t){e??=t}if(e)throw e}validateCommandIdentity(e){if(e.protocol!==`ooxml-pull-v1`||e.sessionId!==this.options.sessionId||e.operationId!==this.options.operationId||e.generation!==this.options.generation||!Number.isSafeInteger(e.requestId)||e.requestId<=0)throw Error(`stale or mismatched pull session command`)}validateHostCredit(e){if(K(e,`byte credit`),e>this.options.maxByteCredit)throw RangeError(`byte credit exceeds host maximum`)}accepted(e,t,n=!1){return{kind:`accepted`,protocol:G,...n?{sessionId:e.sessionId,operationId:e.operationId,generation:e.generation}:this.identity(),requestId:e.requestId,command:t,usage:this.resourceUsage()}}identity(){return{sessionId:this.options.sessionId,operationId:this.options.operationId,generation:this.options.generation}}isStaleLifecycle(e){return(e.kind===`cancel`||e.kind===`close`)&&e.protocol===`ooxml-pull-v1`&&Number.isSafeInteger(e.requestId)&&e.requestId>0&&Number.isSafeInteger(e.generation)&&e.generation>0&&e.generation<this.options.generation}sameOperationIdentity(e){return e.sessionId===this.options.sessionId&&e.operationId===this.options.operationId}errorResponse(e,t){return{kind:`error`,protocol:G,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:t,usage:this.errorResourceUsage()}}async forceFatalCleanup(){this.cancelRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;for(let t of[...this.leases.keys()])try{await this.release(t)}catch(t){e??=t}if(!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch(t){e??=t}if(e)throw e;this.unregisterCleanup()}allocateWireLeaseId(){if(!Number.isSafeInteger(this.nextWireLeaseId)||this.nextWireLeaseId<=0)throw RangeError(`wire lease id space exhausted`);return this.nextWireLeaseId++}arrayBufferTransferBytes(e){let t=0;for(let n of e??[])if(n instanceof ArrayBuffer&&(t+=n.byteLength,!Number.isSafeInteger(t)))throw RangeError(`ArrayBuffer transfer bytes overflow`);return t}maybeUnregisterCompleted(){this.completed&&this.leases.size===0&&this.unregisterCleanup()}resourceUsage(){return this.options.driver.resourceUsage?.()}errorResourceUsage(){try{return this.resourceUsage()}catch{return}}};const J=67108864;var De=class{coordinator=new q;host=null;identity=null;constructor(e,t=e=>e(this.requireArchive())){this.archive=e,this.executeArchive=t}open(e){if(this.host)throw Error(`a DOCX document pull session is already active`);this.executeArchive(t=>{t.open_document_cursor(e.operationId,e.generation)});let t=0;this.identity=e,this.host=new Ee({...e,maxByteCredit:J,coordinator:this.coordinator,driver:{pull:n=>{let r;try{r=this.executeArchive(r=>r.pull_document_chunk(t,e.operationId,e.generation,n))}catch(e){throw me(e,n,J)||e}let i=Ce(r);return{payload:i,byteLength:i.byteLength,done:this.executeArchive(e=>e.document_chunk_done()),transfer:[i]}},measureChunk:({payload:e})=>e.byteLength,acknowledge:n=>{if(n!==t)throw Error(`DOCX document acknowledgement sequence mismatch`);this.executeArchive(n=>n.acknowledge_document_chunk(t,e.operationId,e.generation)),t+=1},cancel:()=>this.executeArchive(e=>e.cancel_document_cursor()),close:()=>this.executeArchive(e=>e.close_document_session()),resourceUsage:()=>{let e=this.executeArchive(e=>e.document_cursor_resource_usage?.());return e?I(e):void 0}}})}dispatch(e,t){return!this.host||!this.identity?(t({protocol:G,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:W(Error(`DOCX document pull session is not open`))}),Promise.resolve()):this.host.dispatch(e,t)}async reset(){if(this.host)try{this.archive()&&this.executeArchive(e=>e.close_document_session())}finally{this.host=null,this.identity=null,this.coordinator=new q}}requireArchive(){let e=this.archive();if(!e)throw Error(`No docx loaded`);return e}};function Y(e){return!!e&&typeof e==`object`&&e.protocol===`ooxml-pull-v1`}const X=new de(y,{freeArchive:e=>e.free(),reinit:b}),Z=new De(()=>X.archive,e=>X.run(()=>{let t=X.archive;if(!t)throw Error(`No docx loaded`);return e(t)}));let Q=0;const $=(e,t)=>self.postMessage(e,t);self.onmessage=async e=>{let n=e.data;if(Y(n)){try{await Z.dispatch(n,$)}catch(e){$({protocol:G,kind:`error`,sessionId:n.sessionId,operationId:n.operationId,generation:n.generation,requestId:n.requestId,error:W(e)})}return}if(n.type===`init`){X.setWasmInput(oe(n.wasmUrl)??n.wasmUrl);return}let r=n.id;try{if(await X.ensureReady(),n.type!==`parse`&&X.archive){let e=X.archive;X.run(()=>e.assert_healthy())}if(n.type===`parse`){await Z.reset();let[e,i,a]=we(n.resourcePolicy),o=new Uint8Array(n.data);X.run(()=>{let n=new t(o,e,i,a);X.setArchive(n)}),Q+=1;let s={sessionId:Q,operationId:Q,generation:Q};Z.open(s),$({type:`documentSessionOpened`,id:r,...s});return}let e=X.archive;if(n.type===`extractImage`){if(!e)throw Error(`No docx loaded`);let t=X.run(()=>e.extract_image(n.path).buffer),i={type:`imageExtracted`,id:r,bytes:t};self.postMessage(i,[t]);return}if(n.type===`resourceUsage`){if(!e)throw Error(`No docx loaded`);$({type:`resourceUsage`,id:r,usage:I(X.run(()=>e.resource_usage()))});return}if(n.type===`toMarkdown`){if(!e)throw Error(`No docx loaded`);$({type:`markdownRendered`,id:r,markdown:X.run(()=>e.to_markdown())});return}}catch(e){$({type:`error`,id:r,...W(e)})}};", it = typeof self < "u" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", rt], { type: "text/javascript;charset=utf-8" });
function at(e) {
	let t;
	try {
		if (t = it && (self.URL || self.webkitURL).createObjectURL(it), !t) throw "";
		let n = new Worker(t, {
			type: "module",
			name: e?.name
		});
		return n.addEventListener("error", () => {
			(self.URL || self.webkitURL).revokeObjectURL(t);
		}), n;
	} catch {
		return new Worker("data:text/javascript;charset=utf-8," + encodeURIComponent(rt), {
			type: "module",
			name: e?.name
		});
	}
}
//#endregion
//#region packages/docx/src/wasm/docx_parser_bg.wasm?url
var ot = new URL("docx_parser_bg.wasm", import.meta.url).href;
//#endregion
//#region packages/docx/src/bookmark-nav.ts
function st(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.pages) for (let e of n.bookmarkStarts) e.name !== "" && !t.has(e.name) && t.set(e.name, n.pageIndex);
	return t;
}
//#endregion
//#region packages/docx/src/embedded-fonts.ts
async function ct(e, t) {
	let n = e.embeddedFonts;
	if (!n || n.length === 0) return [];
	let r = (await Promise.all(n.map(async (e) => {
		try {
			let n = await t(e.partPath);
			return {
				family: e.fontName,
				bytes: n,
				odttf: e.partPath.toLowerCase().endsWith(".odttf"),
				fontKey: e.fontKey,
				weight: lt(e.style),
				style: ut(e.style)
			};
		} catch {
			return null;
		}
	}))).filter((e) => e !== null);
	return r.length === 0 ? [] : ye(r);
}
function lt(e) {
	return e === "bold" || e === "boldItalic" ? "bold" : "normal";
}
function ut(e) {
	return e === "italic" || e === "boldItalic" ? "italic" : "normal";
}
//#endregion
//#region packages/docx/src/element-context.ts
var F = de, dt = 16384;
function ft(e, t) {
	let n = Math.min(e.length, t);
	if (n > 0 && n < e.length) {
		let t = e.charCodeAt(n - 1), r = e.charCodeAt(n);
		t >= 55296 && t <= 56319 && r >= 56320 && r <= 57343 && n--;
	}
	return e.slice(0, n);
}
function pt(e, t) {
	let n = [], r = 0, i = !1;
	for (let a of e) {
		if (a.length === 0) continue;
		if (r > 0) {
			if (r >= t) {
				i = !0;
				break;
			}
			n.push("\n"), r++;
		}
		let e = ft(a, Math.max(0, t - r));
		if (n.push(e), r += e.length, e.length < a.length) {
			i = !0;
			break;
		}
	}
	let a = n.join("");
	return {
		...a.length === 0 ? {} : { text: a },
		truncated: i
	};
}
function* I(e) {
	if (e.kind === "paragraph") {
		for (let t of e.lines) {
			let e = t.placements.flatMap((e) => e.kind === "text" ? [e.text] : []).join("");
			e && (yield e);
		}
		return;
	}
	if (e.kind === "table") {
		for (let t of e.rows) for (let e of t.cells) for (let t of e.blocks) yield* I(t.layout);
		return;
	}
	if (e.kind === "note" || e.kind === "textbox") for (let t of e.story.blocks) yield* I(t);
}
function* mt(e) {
	for (let t of e.drawing.commands) (t.kind === "text" || t.kind === "watermark-text") && (yield t.text);
	for (let t of e.textBoxes) yield* I(t);
}
function ht(e) {
	let t = e ?? dt;
	if (!Number.isFinite(t) || t < 0) throw RangeError("maxTextCharacters must be a finite non-negative number.");
	return Math.min(F, Math.floor(t));
}
function gt(e) {
	return {
		story: e.story,
		storyInstance: e.storyInstance,
		path: [...e.path]
	};
}
function _t(e) {
	return "drawing" in e ? e.drawing.inkBounds : e.placement.bounds;
}
function vt(e) {
	let t = _t(e), n = [
		T(e.pointToPage, t),
		T(e.pointToPage, {
			xPt: t.xPt + t.widthPt,
			yPt: t.yPt
		}),
		T(e.pointToPage, {
			xPt: t.xPt,
			yPt: t.yPt + t.heightPt
		}),
		T(e.pointToPage, {
			xPt: t.xPt + t.widthPt,
			yPt: t.yPt + t.heightPt
		})
	], r = Math.min(...n.map((e) => e.xPt)), i = Math.min(...n.map((e) => e.yPt)), a = Math.max(...n.map((e) => e.xPt)), o = Math.max(...n.map((e) => e.yPt));
	return {
		xPt: r,
		yPt: i,
		widthPt: a - r,
		heightPt: o - i
	};
}
function L(e, t) {
	return t.xPt >= e.xPt && t.xPt <= e.xPt + e.widthPt && t.yPt >= e.yPt && t.yPt <= e.yPt + e.heightPt;
}
function yt(e, t) {
	let n = !1;
	for (let r = 0, i = t.length - 1; r < t.length; i = r++) {
		let a = t[r], o = t[i];
		a.yPt > e.yPt != o.yPt > e.yPt && e.xPt < (o.xPt - a.xPt) * (e.yPt - a.yPt) / (o.yPt - a.yPt) + a.xPt && (n = !n);
	}
	return n;
}
function bt(e, t) {
	return L(e.inkBounds, t) ? e.clip ? e.clip.kind === "rect" ? L(e.clip.rect, t) : yt(t, e.clip.points) : !0 : !1;
}
function xt(e, t, n) {
	for (let n of e.clips) {
		let e = Oe(n.pointToPage, t);
		if (!e || !L(n.bounds, e)) return !1;
	}
	return "drawing" in e ? bt(e.drawing, n) : L(e.placement.bounds, n);
}
function R(e, t) {
	return e.commands.find((e) => e.kind === "resource" && e.resourceKind === t);
}
function St(e) {
	return R(e, "chart") ? "chart" : e.commands.some((e) => e.kind === "drawingml-shape" || e.kind === "drawingml-image-fill" || e.kind === "fill-rect" || e.kind === "stroke-rect" || e.kind === "text" || e.kind === "watermark-text") ? "shape" : R(e, "image") ? "image" : null;
}
function Ct(e, t, n, r, i, a) {
	let o = "drawing" in e ? St(e.drawing) : e.placement.resourceKind;
	if (!o) return null;
	let s, c = !1, l, u;
	if (o === "chart") {
		let t = "drawing" in e ? R(e.drawing, "chart").resourceKey : e.placement.resourceKey, n = i.resolve(t, "chart"), r = ee(n.model, a);
		s = r.text, c = r.truncated, u = n.model.series.length;
	} else if (o === "image") {
		let t = "drawing" in e ? R(e.drawing, "image").resourceKey : e.placement.resourceKey, n = i.descriptors.find((e) => e.resourceKey === t && e.kind === "image" && "mimeType" in e);
		if (!n) throw Error(`Unknown image paint resource: ${t}`);
		l = n.mimeType;
	} else {
		let t = pt(mt(e), a);
		s = t.text, c = t.truncated;
	}
	return {
		format: "docx",
		kind: "element",
		pageIndex: t,
		elementIndex: n,
		elementType: o,
		point: { ...r },
		bounds: vt(e),
		source: gt("drawing" in e ? e.drawing.source : e.source),
		...s === void 0 ? {} : { text: s },
		...l === void 0 ? {} : { mimeType: l },
		...u === void 0 ? {} : { seriesCount: u },
		truncated: c,
		truncationReasons: c ? ["text"] : [],
		textCharacters: s?.length ?? 0,
		maxTextCharacters: a
	};
}
function wt(e, t, n, r, i = {}) {
	if (!Number.isFinite(n.xPt) || !Number.isFinite(n.yPt)) throw RangeError("DOCX hit-test point must contain finite page coordinates.");
	let a = ht(i.maxTextCharacters), o = je(e, t);
	for (let e = o.length - 1; e >= 0; e--) {
		let i = o[e], s = Oe(i.pointToPage, n);
		if (!s || !xt(i, n, s)) continue;
		let c = Ct(i, t, e, n, r, a);
		if (c) return c;
	}
	return null;
}
function Tt(e, t, n, r) {
	return wt(Ge(e, {
		currentDate: r.currentDate,
		defaultCurrentDateMs: r.defaultCurrentDateMs,
		showTrackedChanges: r.showTrackedChanges
	}, t).layout, t, n, Re(e), r);
}
function Et(e, t) {
	let n = ht(t), r = e.text === void 0 ? void 0 : ft(e.text, n), i = e.truncated || e.text !== void 0 && r.length < e.text.length;
	return {
		...structuredClone(e),
		...r === void 0 ? {} : { text: r },
		truncated: i,
		truncationReasons: i ? ["text"] : [],
		textCharacters: r?.length ?? 0,
		maxTextCharacters: n
	};
}
//#endregion
//#region packages/docx/src/revisions.ts
function z(e) {
	let t = et(e.id);
	return t === void 0 ? void 0 : `${e.kind}\u0000${t}`;
}
function B(e) {
	return Object.freeze({
		...e,
		path: Object.freeze([...e.path])
	});
}
function Dt(e, t) {
	return e !== void 0 && e.story === t.story && e.storyInstance === t.storyInstance && e.path.length === t.path.length && e.path.every((e, n) => e === t.path[n]);
}
function V(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + Math.floor((r - n) / 2);
		e[i] < t ? n = i + 1 : r = i;
	}
	return n;
}
function Ot(e, t) {
	let n = Array(e.length), r;
	for (let i = e.length - 1; i >= 0; --i) {
		n[i] = r;
		let a = e[i], o = t.get(N(a.source))?.[0];
		o !== void 0 && (r = Object.freeze({
			source: B(a.source),
			sourceRunIndex: o
		}));
	}
	let i = Array(e.length), a;
	for (let n = 0; n < e.length; n += 1) {
		i[n] = a;
		let r = e[n], o = t.get(N(r.source))?.at(-1);
		o !== void 0 && (a = Object.freeze({
			source: B(r.source),
			sourceRunIndex: o
		}));
	}
	return {
		following: n,
		preceding: i
	};
}
function kt(e, t, n, r, i, a) {
	let o = r[e], s = i.get(N(o.source)) ?? [], c = s[V(s, n)], l = s[V(s, t) - 1], u = c ?? l;
	return u === void 0 ? a.following[e] ?? a.preceding[e] : Object.freeze({
		source: B(o.source),
		sourceRunIndex: u
	});
}
function At(e, t, n = /* @__PURE__ */ new Map()) {
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
	e.forEach((e, t) => {
		let n = z(e);
		n === void 0 || i.has(n) || (r.has(n) ? (r.delete(n), i.add(n)) : r.set(n, t));
	});
	let a = t.blocks.sources.flatMap((e) => {
		if (e.story !== "body") return [];
		let n = t.blocks.resolve(e);
		return n.type === "paragraph" ? [{
			source: e,
			runs: n.runs
		}] : [];
	}), o = new Map([...n].map(([e, t]) => [e, Object.freeze([...t].sort((e, t) => e - t))])), s = Ot(a, o), c = [];
	for (let [e, t] of a.entries()) {
		let n = 0;
		for (; n < t.runs.length;) {
			let i = t.runs[n], l = i.revision?.kind ? z({
				kind: i.revision.kind,
				id: i.revision.id
			}) : void 0, u = l === void 0 ? void 0 : r.get(l);
			if (u === void 0) {
				n += 1;
				continue;
			}
			let d = n;
			for (n += 1; n < t.runs.length;) {
				let e = t.runs[n].revision;
				if (!e?.kind || z({
					kind: e.kind,
					id: e.id
				}) !== l) break;
				n += 1;
			}
			let f = n, p = o.get(N(t.source)) ?? [], m = (p[V(p, d)] ?? f) < f ? void 0 : kt(e, d, f, a, o, s);
			c.push(Object.freeze({
				revisionIndex: u,
				source: B(t.source),
				startRunIndex: d,
				endRunIndex: f,
				...m === void 0 ? {} : { geometryFallback: m }
			}));
		}
	}
	return c;
}
function jt(e, t, n = /* @__PURE__ */ new Map(), r = {}) {
	if ((e?.length ?? 0) === 0) return [];
	let i = At(e ?? [], t, n), a = r.completedSourceKeys;
	return a === void 0 ? i : i.filter((e) => {
		let t = n.get(N(e.source));
		return t !== void 0 && [...t].some((t) => t >= e.startRunIndex && t < e.endRunIndex) || a.has(N(e.source));
	});
}
function Mt(e, t) {
	let n = t.filter((t) => t.sourceRunIndex !== void 0 && Dt(t.source, e.source) && t.sourceRunIndex >= e.startRunIndex && t.sourceRunIndex < e.endRunIndex);
	if (n.length > 0) return n;
	let r = e.geometryFallback;
	return r === void 0 ? [] : t.filter((e) => e.sourceRunIndex === r.sourceRunIndex && Dt(e.source, r.source));
}
//#endregion
//#region packages/docx/src/layout/progressive.ts
var Nt = 12;
async function Pt(e, t, n, r = {}) {
	let { onPreview: i, scheduler: a } = r;
	return Fe(ke(e, t, n, i && e.sequence.length > Nt ? { onPages: (e, t) => {
		i(Object.freeze({
			layout: e,
			exact: !1,
			coveredEntries: t
		}));
	} } : void 0), a);
}
//#endregion
//#region packages/docx/src/document-layout-events.ts
var H = /* @__PURE__ */ new WeakMap();
function U(e, t) {
	let n = Object.freeze({ ...t });
	for (let t of [...H.get(e) ?? []]) try {
		t.notify(n);
	} catch (e) {
		try {
			t.report(e);
		} catch {}
	}
}
function Ft(e, t, n, r) {
	let i = H.get(e);
	i || (i = /* @__PURE__ */ new Set(), H.set(e, i));
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
		i?.delete(a), i?.size === 0 && H.delete(e);
	};
}
//#endregion
//#region packages/docx/src/document-layout-view.ts
var W = /* @__PURE__ */ new WeakMap(), It = /* @__PURE__ */ new WeakMap(), Lt = Symbol("docxLayoutViewRequester");
function G(e) {
	let t = E(e), n = t.activeLayoutOptions;
	return {
		showTrackedChanges: n?.showTrackedChanges === !0,
		currentDate: n?.currentDateMs ?? t.defaultCurrentDateMs
	};
}
async function K(e, t, n) {
	let r = E(e), i = O(t.currentDate, r.defaultCurrentDateMs, t.showTrackedChanges === !0), a = Object.freeze({
		showTrackedChanges: i.showTrackedChanges === !0,
		currentDate: i.currentDateMs
	}), o = {
		showTrackedChanges: a.showTrackedChanges,
		currentDate: a.currentDate,
		[Lt]: n
	};
	await e.setLayoutView(o);
	let s = G(e);
	return s.currentDate === a.currentDate && s.showTrackedChanges === a.showTrackedChanges;
}
function Rt(e, t) {
	let n = Object.freeze({ ...G(e) }), r = (It.get(e) ?? 0) + 1;
	It.set(e, r);
	let i = Object.freeze({
		view: n,
		generation: r,
		requester: t
	});
	for (let t of [...W.get(e) ?? []]) try {
		t.notify(i);
	} catch (e) {
		try {
			t.report(e);
		} catch {}
	}
}
function zt(e, t, n) {
	let r = W.get(e);
	r || (r = /* @__PURE__ */ new Set(), W.set(e, r));
	let i = Object.freeze({
		notify: t,
		report: n
	});
	return r.add(i), () => {
		r?.delete(i), r?.size === 0 && W.delete(e);
	};
}
//#endregion
//#region packages/docx/src/document.ts
function Bt(e, t) {
	return e !== null && e.currentDateMs === t.currentDateMs && e.showTrackedChanges === !0 == (t.showTrackedChanges === !0);
}
function Vt() {
	let e, t;
	return {
		promise: new Promise((n, r) => {
			e = n, t = r;
		}),
		resolve: e,
		reject: t
	};
}
var Ht = Object.freeze([]), Ut = Object.freeze([]), Wt = Object.freeze({
	comments: Object.freeze([]),
	revisions: Object.freeze([])
});
function q(e, t) {
	return Ee({
		comments: e,
		revisions: t
	}, "DOCX review metadata");
}
var J = class e {
	_metrics = null;
	_document = null;
	_source = null;
	_meta = null;
	_review = Wt;
	_layoutLifecycle = new be();
	_layoutObservers = new Ce();
	_layoutCompletion = null;
	_layoutAbort = null;
	_bookmarkPages = null;
	_commentAnchorRanges = null;
	_revisionAnchorRanges = null;
	_reviewProjectionIndex = null;
	_parseRequestId = null;
	_progressive = null;
	_parseWatchdog;
	_parseWatchdogMs;
	_layoutViewGeneration = 0;
	_mode = "main";
	_threeD;
	_regionMap;
	_chartEx;
	_tiff;
	_worker;
	_bridge;
	_rawParts = new ve({
		maxEntries: 64,
		maxBytes: i
	});
	_embeddedFontFaces = [];
	_googleFontFaces = [];
	_localMetricFontFaces = [];
	_fetchImage = (e, t) => this.getImage(e, t);
	constructor(e, t, n, i) {
		this._worker = e, this._mode = t, De(this, n), this._bridge = new pe(this._worker, {
			correlate: (e) => "protocol" in e && e.protocol === "ooxml-pull-v1" ? e.requestId : "id" in e ? e.id : void 0,
			onUnsolicited: (e) => this._onWorkerLayoutPush(e),
			toError: (e) => {
				if (!("protocol" in e || e.type !== "error")) return Object.assign(r(e), {
					...e.reason === void 0 ? {} : { reason: e.reason },
					...e.outgoingColumnIndex === void 0 ? {} : { outgoingColumnIndex: e.outgoingColumnIndex },
					...e.outgoingColumnCount === void 0 ? {} : { outgoingColumnCount: e.outgoingColumnCount },
					...e.incomingColumnCount === void 0 ? {} : { incomingColumnCount: e.incomingColumnCount }
				});
			}
		});
		let a = new URL(i ?? ot, location.href).href;
		this._bridge.post({
			type: "init",
			wasmUrl: a
		});
	}
	static async load(r, i = {}) {
		let a = t(i), o = Date.now(), s = i.mode ?? "main", c = new n({
			enabled: !0,
			format: "docx",
			mode: s,
			policy: a.policy,
			onMetrics: a.onResourceMetrics,
			emitToConsole: a.debug
		});
		try {
			if (s === "worker" && (typeof Worker > "u" || typeof OffscreenCanvas > "u")) throw Error("mode: 'worker' requires Worker and OffscreenCanvas support");
			let t;
			if (typeof r == "string") {
				let e = await fetch(r);
				if (!e.ok) throw Error(`Failed to fetch: ${e.status} ${e.statusText}`);
				t = await e.arrayBuffer();
			} else t = r;
			t = m(await h(t, i.password)), c.setSourceBytes(t.byteLength), c.checkpoint("container ready");
			let n = s === "worker" ? (await import("./render-worker-host-BAXcBGq3.js")).createRenderWorker() : new at(), l = s === "worker" ? Qe(i) : void 0, u = s === "worker" && !!i.progressiveLayout, d;
			try {
				d = new e(n, s, o, i.wasmUrl), d._metrics = c;
				let r = E(d), f = O(i.currentDate, r.defaultCurrentDateMs, i.showTrackedChanges === !0);
				if (r.activeLayoutOptions = f, await d._parse(t, a.policy, s === "worker" ? !!i.useGoogleFonts : !1, i.workerTimeoutMs, (e) => c.observeUsage(e), l, u ? {
					onPartial: i.onLayoutPartial,
					onComplete: i.onLayoutComplete,
					onProgress: i.onLayoutProgress,
					layoutOptions: f,
					abort: new AbortController(),
					firstPublication: Vt(),
					published: !1,
					settled: !1
				} : void 0), s === "worker" && d._mode === "main" && (c.setMode("main"), console.warn("[ooxml] mode: 'worker' fell back to main-thread rendering because this document requires DOM OpenType vertical glyph selection.")), i.math && d._mode === "worker" && !l?.math && console.warn("[ooxml] a custom math renderer cannot cross the worker boundary; equations will be skipped in mode: 'worker'. Use the math renderer from @silurus/ooxml/math."), i.threeD && d._mode === "worker" && !l?.threeD && console.warn("[ooxml] a custom 3-D chart renderer cannot cross the worker boundary; charts use their 2-D family fallback in mode: 'worker'. Use the renderer from @silurus/ooxml/three-d."), d._threeD = d._mode === "worker" ? void 0 : i.threeD, i.regionMap && d._mode === "worker" && !l?.regionMap && console.warn("[ooxml] a custom Region Map renderer cannot cross the worker boundary; geospatial charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/region-map."), d._regionMap = d._mode === "worker" ? void 0 : i.regionMap, i.chartEx && d._mode === "worker" && !l?.chartEx && console.warn("[ooxml] a custom ChartEx renderer cannot cross the worker boundary; ChartEx charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/chart-ex."), d._chartEx = d._mode === "worker" ? void 0 : i.chartEx, i.tiff && d._mode === "worker" && !l?.tiff && console.warn("[ooxml] a custom TIFF codec cannot cross the worker boundary; recognized TIFF images will use an unavailable-image placeholder in mode: 'worker'. Use the codec from @silurus/ooxml/tiff to display them."), d._tiff = d._mode === "worker" ? void 0 : i.tiff, d._mode === "main" && i.useGoogleFonts && d._document && (d._googleFontFaces = await _e(He(d._document), Pe)), d._mode === "main" && d._document?.embeddedFonts?.length) {
					let e = d;
					d._embeddedFontFaces = await ct(d._document, (t) => e.getFontBytes(t));
				}
				let p;
				d._mode === "main" && d._document && (p = await Ne(d._document), d._localMetricFontFaces = p.faces);
				let m;
				if (d._mode === "main" && i.math && d._document && Ve(d._document) && (m = await Ue(d._document, i.math)), d._mode === "main" && d._document && d._source) {
					let e = d, t = E(d);
					t.services = ze(d._source, {
						localMetrics: p?.metrics,
						useGoogleFonts: !!i.useGoogleFonts,
						embeddedFaces: d._embeddedFontFaces,
						googleFaces: d._googleFontFaces,
						mathResources: m?.records,
						mathDrawables: m?.drawables
					});
					let n = t.services, r = Ae(d._source, n, t.defaultCurrentDateMs), a = d._source.fatalParse === null, o = t.activeLayoutOptions;
					if (!o) throw Error("Active layout view was not recorded at load");
					let s = { onProgress: i.onLayoutProgress ? (t) => e._layoutObservers.notify("onLayoutProgress", i.onLayoutProgress, { committedUnits: t }) : void 0 };
					if (a && i.progressiveLayout) {
						let e = r.layoutVariants, t = d, a = new AbortController();
						t._layoutAbort = a;
						let c = Vt(), l = null, u = !0;
						t._layoutCompletion = Pt(d._source.bodyLayoutInput, n, o, {
							scheduler: {
								...s,
								signal: a.signal
							},
							onPreview: (n) => {
								if (!u) return;
								let r = l === null, a = t._replaceMainLayoutPublication(e, o, l, n.layout);
								if (a === null) {
									u = !1;
									return;
								}
								if (l = a, r) t._layoutLifecycle.begin(), U(t, {
									pageCount: n.layout.pages.length,
									exact: n.exact,
									complete: !1
								}), c.resolve();
								else {
									if (!t._isLayoutViewActive(o)) return;
									U(t, {
										pageCount: n.layout.pages.length,
										exact: n.exact,
										complete: !1
									}), t._layoutObservers.notify("onLayoutPartial", i.onLayoutPartial, {
										availableUnits: n.layout.pages.length,
										exact: n.exact
									});
								}
							}
						}).then((n) => {
							u && t._replaceMainLayoutPublication(e, o, l, n) === null && (u = !1), t._layoutLifecycle.succeed(), U(t, {
								pageCount: t.pageCount,
								exact: !0,
								complete: !0
							}), l !== null && t._layoutObservers.notify("onLayoutComplete", i.onLayoutComplete), c.resolve();
						}).catch((e) => {
							if (l === null) {
								c.reject(e);
								return;
							}
							if (e instanceof Ie) {
								t._layoutLifecycle.succeed();
								return;
							}
							let n = t._layoutLifecycle.fail(e);
							U(t, {
								pageCount: t.pageCount,
								exact: !1,
								complete: !1,
								error: n
							}), t._layoutObservers.notify("onLayoutComplete", i.onLayoutComplete, n);
						}), await c.promise;
					} else if (a && (i.sliceLayout || i.onLayoutProgress)) {
						let e = await Be(d._source.bodyLayoutInput, n, o, s);
						r.layoutVariants.prime(o, e);
					} else r.layoutVariants.layoutFor(o);
				}
				return await d._resourceUsage(i.workerTimeoutMs ?? 1e3).then((e) => c.observeUsage(e), () => void 0), c.checkpoint("model and layout ready"), c.succeed({ pages: d.pageCount }), d;
			} catch (e) {
				let t = d;
				throw p(n, t ? () => t.destroy() : void 0), e;
			}
		} catch (e) {
			throw c.fail(e), e;
		}
	}
	async _parse(e, t, n = !1, r, i, a, o) {
		if (o) {
			await this._parseProgressively(e, t, n, r, i, a, o);
			return;
		}
		let s = await this._bridge.request((r) => this._mode === "worker" ? {
			type: "parse",
			id: r,
			data: e,
			resourcePolicy: t,
			useGoogleFonts: n,
			defaultCurrentDateMs: E(this).defaultCurrentDateMs,
			...this._parseViewFields(),
			renderers: a
		} : {
			type: "parse",
			id: r,
			data: e,
			resourcePolicy: t
		}, [e], { timeoutMs: r });
		if ("protocol" in s) throw Error("DOCX parse open returned a pull-protocol response");
		if (this._mode === "worker") if ("usage" in s && s.usage && i?.(s.usage), s.type === "mainThreadVerticalFallback") {
			let e = await k(this._bridge.transport(A), s, {
				timeoutMs: r,
				onUsage: i
			});
			this._source = e.source, this._document = e.document, this._meta = null, this._mode = "main";
		} else this._meta = s.meta;
		else {
			let e = s, t = await k(this._bridge.transport(A), e, {
				timeoutMs: r,
				onUsage: i
			});
			this._source = t.source, this._document = t.document;
		}
		this._review = q(this._meta?.comments ?? this._document?.comments ?? [], this._meta?.revisions ?? this._document?.revisions ?? []);
	}
	_onWorkerLayoutPush(e) {
		if (g((e, t) => this._worker.postMessage(e, t), e) || !("forId" in e) || e.forId !== this._parseRequestId) return;
		this._rearmParseWatchdog();
		let t = this._progressive;
		if (t?.settled) return;
		if (e.type === "layoutProgress") {
			this._layoutObservers.notify("onLayoutProgress", t?.onProgress, { committedUnits: e.committedPages });
			return;
		}
		if (e.type !== "layoutPartial" || !t) return;
		let n = !t.published || this._isLayoutViewActive(t.layoutOptions);
		if (n && this._applyLayoutPartial(e.partial), t.published) {
			if (!n) return;
			U(this, {
				pageCount: e.partial.pageCount,
				exact: e.partial.exact,
				complete: !1
			}), this._layoutObservers.notify("onLayoutPartial", t.onPartial, {
				availableUnits: e.partial.pageCount,
				exact: e.partial.exact
			});
			return;
		}
		t.published = !0, this._layoutLifecycle.begin(), U(this, {
			pageCount: e.partial.pageCount,
			exact: e.partial.exact,
			complete: !1
		}), t.firstPublication.resolve();
	}
	_applyLayoutPartial(e) {
		let t = e.review ?? this._meta;
		this._meta = {
			pageCount: e.pageCount,
			pageSizes: e.pageSizes,
			bookmarkPages: e.bookmarkPages,
			revisions: t?.revisions ?? [],
			comments: t?.comments ?? [],
			footnotes: t?.footnotes ?? [],
			endnotes: t?.endnotes ?? [],
			commentAnchorRanges: e.commentAnchorRanges,
			revisionAnchorRanges: e.revisionAnchorRanges
		}, e.review && (this._review = q(e.review.comments, e.review.revisions)), this._invalidateLayoutDerivedCaches();
	}
	_onAuthoritativeMeta(e) {
		this._clearParseWatchdog();
		let t = this._progressive;
		if (!t?.settled) {
			if (!t || this._isLayoutViewActive(t.layoutOptions) || !this._meta) this._meta = e;
			else {
				let t = this._meta;
				this._meta = {
					...e,
					pageCount: t.pageCount,
					pageSizes: t.pageSizes,
					bookmarkPages: t.bookmarkPages,
					commentAnchorRanges: t.commentAnchorRanges,
					revisionAnchorRanges: t.revisionAnchorRanges
				};
			}
			this._invalidateLayoutDerivedCaches(), this._review = q(e.comments, e.revisions), t && (t.settled = !0, this._layoutLifecycle.succeed(), U(this, {
				pageCount: this.pageCount,
				exact: !0,
				complete: !0
			}), t.firstPublication.resolve(), t.published && this._layoutObservers.notify("onLayoutComplete", t.onComplete));
		}
	}
	_invalidateLayoutDerivedCaches() {
		this._bookmarkPages = null, this._commentAnchorRanges = null, this._revisionAnchorRanges = null, this._reviewProjectionIndex = null;
	}
	_replaceMainLayoutPublication(e, t, n, r) {
		let i = e.replaceIfCurrent(t, n, r);
		return i !== null && this._isLayoutViewActive(t) && this._invalidateLayoutDerivedCaches(), i;
	}
	_isLayoutViewActive(e) {
		return Bt(E(this).activeLayoutOptions, e);
	}
	_rearmParseWatchdog() {
		this._parseWatchdogMs !== void 0 && (clearTimeout(this._parseWatchdog), this._parseWatchdog = setTimeout(() => this._onParseWentSilent(), this._parseWatchdogMs));
	}
	_clearParseWatchdog() {
		clearTimeout(this._parseWatchdog), this._parseWatchdog = void 0, this._parseWatchdogMs = void 0;
	}
	_onParseWentSilent() {
		let e = this._progressive, t = this._parseWatchdogMs;
		this._clearParseWatchdog();
		let n = /* @__PURE__ */ Error(`worker layout produced no progress for ${t}ms`);
		e && this._failWorkerProgressive(e, n), this._bridge.terminate();
	}
	_failWorkerProgressive(e, t) {
		if (e.settled) return;
		if (e.settled = !0, this._clearParseWatchdog(), !e.published) {
			e.firstPublication.reject(t);
			return;
		}
		let n = this._layoutLifecycle.fail(t);
		U(this, {
			pageCount: this.pageCount,
			exact: !1,
			complete: !1,
			error: n
		}), this._layoutObservers.notify("onLayoutComplete", e.onComplete, n);
	}
	_parseViewFields() {
		let e = E(this), t = e.activeLayoutOptions;
		return t ? {
			...t.currentDateMs === e.defaultCurrentDateMs ? {} : { currentDateMs: t.currentDateMs },
			...t.showTrackedChanges === !0 ? { showTrackedChanges: !0 } : {}
		} : {};
	}
	async _parseProgressively(e, t, n, r, i, a, o) {
		this._progressive = o, this._layoutAbort = o.abort, this._parseWatchdogMs = r, this._layoutCompletion = this._bridge.request((r) => (this._parseRequestId = r, {
			type: "parse",
			id: r,
			data: e,
			resourcePolicy: t,
			useGoogleFonts: n,
			defaultCurrentDateMs: E(this).defaultCurrentDateMs,
			...this._parseViewFields(),
			renderers: a,
			progressiveLayout: !0
		}), [e], { timeoutMs: !1 }).then(async (e) => {
			if (this._parseRequestId = null, "protocol" in e) throw Error("DOCX parse open returned a pull-protocol response");
			if ("usage" in e && e.usage && i?.(e.usage), e.type === "mainThreadVerticalFallback") {
				this._clearParseWatchdog(), o.settled = !0, this._progressive = null, this._layoutAbort = null;
				let t = await k(this._bridge.transport(A), e, {
					timeoutMs: r,
					onUsage: i
				});
				this._source = t.source, this._document = t.document, this._meta = null, this._mode = "main", this._review = q(t.document.comments ?? [], t.document.revisions ?? []), o.firstPublication.resolve();
				return;
			}
			this._onAuthoritativeMeta(e.meta);
		}, (e) => {
			if (this._parseRequestId = null, this._clearParseWatchdog(), !o.settled) {
				if (o.abort.signal.aborted) {
					o.settled = !0, this._layoutLifecycle.succeed(), o.firstPublication.resolve();
					return;
				}
				this._failWorkerProgressive(o, e);
			}
		}), this._rearmParseWatchdog(), await o.firstPublication.promise;
	}
	destroy() {
		this._layoutAbort?.abort(), this._layoutAbort = null, this._clearParseWatchdog(), this._parseRequestId = null, this._progressive = null, this._layoutViewGeneration++, this._bridge.terminate(), this._document = null, this._source = null, this._meta = null, this._review = Wt, E(this).services = null, this._bookmarkPages = null, this._commentAnchorRanges = null, this._revisionAnchorRanges = null, this._reviewProjectionIndex = null, this._rawParts.clear(), this._embeddedFontFaces.length > 0 && (xe(this._embeddedFontFaces), this._embeddedFontFaces = []), this._googleFontFaces.length > 0 && (ge(this._googleFontFaces), this._googleFontFaces = []), this._localMetricFontFaces.length > 0 && (Le(this._localMetricFontFaces), this._localMetricFontFaces = []), c(this._fetchImage), u(this._fetchImage);
	}
	async getImage(e, t) {
		return this._rawParts.get(e, t, () => this._bridge.request((t) => ({
			type: "extractImage",
			id: t,
			path: e
		})).then((e) => {
			let n = e.bytes;
			return new Blob([n], { type: t });
		}));
	}
	async getFontBytes(e) {
		let t = (await this._bridge.request((t) => ({
			type: "extractImage",
			id: t,
			path: e
		}))).bytes;
		return new Uint8Array(t);
	}
	async _resourceUsage(e) {
		return (await this._bridge.request((e) => ({
			type: "resourceUsage",
			id: e
		}), void 0, { timeoutMs: e })).usage;
	}
	async getResourceMetrics() {
		let e = this._metrics;
		if (!e) throw Error("Document not loaded");
		return f(e, (e) => this._resourceUsage(e));
	}
	async toMarkdown() {
		return (await this._bridge.request((e) => ({
			type: "toMarkdown",
			id: e
		}))).markdown;
	}
	get pageCount() {
		return this._meta ? this._meta.pageCount : this._document ? this._getLayout()?.pages.length ?? 0 : 0;
	}
	get layoutComplete() {
		return this._layoutLifecycle.complete;
	}
	async waitUntilLayoutComplete() {
		this._layoutCompletion && await this._layoutCompletion, this._layoutLifecycle.throwIfFailed();
	}
	get mode() {
		return this._mode;
	}
	get document() {
		if (this._meta && !this._document) throw Error("the raw document model stays in the worker in mode: 'worker'; use mode: 'main' if you need direct model access");
		if (!this._document) throw Error("Document not loaded");
		return this._document;
	}
	get comments() {
		return this._reviewSnapshot().comments;
	}
	get revisions() {
		return this._reviewSnapshot().revisions;
	}
	commentAnchorRanges() {
		if (this._meta) return this._meta.commentAnchorRanges ?? Ht;
		if (!this._document || !this._source) return [];
		let e = this._reviewSnapshot().comments;
		if (e.length === 0) return Ht;
		let t = E(this), n = t.services;
		if (!n) throw Error("Document layout services are not initialized");
		let r = D(n);
		if (!r) throw Error("Document layout variant store is not initialized");
		let i = t.activeLayoutOptions, a = i ? r.layoutFor(i) : r.defaultLayout;
		this._reviewProjectionIndex ??= Ke(a);
		let o = this._layoutLifecycle?.complete ?? !0 ? void 0 : { completedSourceKeys: this._reviewProjectionIndex.completedSourceKeys };
		return this._commentAnchorRanges ??= nt(e, this._source, this._reviewProjectionIndex.renderedRunIndex, o), this._commentAnchorRanges;
	}
	revisionAnchorRanges() {
		if (this._meta) return this._meta.revisionAnchorRanges ?? Ut;
		if (!this._document || !this._source) return [];
		let e = this._reviewSnapshot().revisions;
		if (e.length === 0) return Ut;
		let t = E(this), n = t.services;
		if (!n) throw Error("Document layout services are not initialized");
		let r = D(n);
		if (!r) throw Error("Document layout variant store is not initialized");
		let i = t.activeLayoutOptions, a = i ? r.layoutFor(i) : r.defaultLayout;
		this._reviewProjectionIndex ??= Ke(a);
		let o = this._layoutLifecycle?.complete ?? !0 ? void 0 : { completedSourceKeys: this._reviewProjectionIndex.completedSourceKeys };
		return this._revisionAnchorRanges ??= jt(e, this._source, this._reviewProjectionIndex.renderedRunIndex, o), this._revisionAnchorRanges;
	}
	_reviewSnapshot() {
		return this._review ||= q(this._meta?.comments ?? this._document?.comments ?? [], this._meta?.revisions ?? this._document?.revisions ?? []), this._review;
	}
	get footnotes() {
		return this._meta?.footnotes ?? this._document?.footnotes ?? [];
	}
	get endnotes() {
		return this._meta?.endnotes ?? this._document?.endnotes ?? [];
	}
	_getLayout() {
		if (!this._document) return null;
		let e = E(this), t = e.services;
		if (!t) throw Error("Document layout services are not initialized");
		let n = D(t);
		if (!n) throw Error("Document layout variant store is not initialized");
		let r = e.activeLayoutOptions;
		return r ? n.layoutFor(r) : n.defaultLayout;
	}
	async setLayoutView(e = {}) {
		let t = e[Lt], n = E(this), r = O(e.currentDate, n.defaultCurrentDateMs, e.showTrackedChanges === !0), i = ++this._layoutViewGeneration, a = n.activeLayoutOptions;
		if (!Bt(a, r)) {
			if (this._mode === "worker" && this._meta) {
				let e = await this._bridge.request((e) => ({
					type: "selectLayoutView",
					id: e,
					currentDateMs: r.currentDateMs,
					showTrackedChanges: r.showTrackedChanges === !0
				}));
				if (i !== this._layoutViewGeneration) return;
				let a = e;
				n.activeLayoutOptions = r, this._meta = {
					...this._meta,
					...a.meta
				}, this._invalidateLayoutDerivedCaches(), Rt(this, t);
				return;
			}
			n.activeLayoutOptions = r, this._invalidateLayoutDerivedCaches(), Rt(this, t);
		}
	}
	_getBookmarkPages() {
		if (this._bookmarkPages) return this._bookmarkPages;
		if (this._meta) return this._bookmarkPages = new Map(this._meta.bookmarkPages), this._bookmarkPages;
		let e = this._getLayout();
		return e ? (this._bookmarkPages = st(e), this._bookmarkPages) : null;
	}
	getBookmarkPage(e) {
		return this._getBookmarkPages()?.get(e);
	}
	pageSize(e) {
		if (this._meta) {
			let t = this._meta.pageSizes, n = t[Math.max(0, Math.min(e, t.length - 1))];
			return n ? {
				widthPt: n.widthPt,
				heightPt: n.heightPt
			} : {
				widthPt: 0,
				heightPt: 0
			};
		}
		if (!this._document) return {
			widthPt: 0,
			heightPt: 0
		};
		let t = this._getLayout();
		if (!t || t.pages.length === 0) return {
			widthPt: 0,
			heightPt: 0
		};
		let n = Math.max(0, Math.min(e, t.pages.length - 1)), r = t.pages[n].geometry;
		return {
			widthPt: r.widthPt,
			heightPt: r.heightPt
		};
	}
	_withActiveView(e) {
		let t = E(this).activeLayoutOptions;
		if (!t) return e;
		let n = { ...e };
		return e.currentDate === void 0 && (n.currentDate = t.currentDateMs), e.showTrackedChanges === void 0 && t.showTrackedChanges === !0 && (n.showTrackedChanges = !0), n;
	}
	renderPage(e, t, n = {}) {
		if (this._mode === "worker") throw Error("renderPage(canvas) is unavailable in mode: 'worker'; use renderPageToBitmap() and paint it via an ImageBitmapRenderingContext");
		if (!this._source) throw Error("Document not loaded");
		return Me(this._source, e, t, {
			...this._withActiveView(n),
			fetchImage: this._fetchImage,
			layoutServices: E(this).services ?? void 0,
			defaultCurrentDateMs: E(this).defaultCurrentDateMs,
			threeD: this._threeD,
			regionMap: this._regionMap,
			chartEx: this._chartEx,
			tiff: this._tiff
		});
	}
	async renderPageToBitmap(e, t = {}) {
		let { onTextRun: n, ...r } = t, i = {
			...this._withActiveView(r),
			dpr: r.dpr ?? s()
		};
		if (this._mode === "worker") {
			let t = await this._bridge.request((t) => ({
				type: "renderPage",
				id: t,
				pageIndex: e,
				opts: i
			}));
			try {
				if (n) for (let e of t.runs) n(e);
			} catch (e) {
				throw d(t.bitmap), e;
			}
			return t.bitmap;
		}
		let a = new OffscreenCanvas(1, 1);
		return await this.renderPage(a, e, {
			...i,
			onTextRun: n
		}), a.transferToImageBitmap();
	}
	async collectPageRuns(e, t = {}) {
		let n = { ...this._withActiveView(t) };
		if (this._mode === "worker") return (await this._bridge.request((t) => ({
			type: "collectRuns",
			id: t,
			pageIndex: e,
			opts: n
		}))).runs;
		let r = E(this), i = r.services;
		if (!i) throw Error("Document layout services are not initialized");
		return qe(i, e, {
			currentDate: n.currentDate,
			defaultCurrentDateMs: r.defaultCurrentDateMs,
			width: n.width,
			showTrackedChanges: n.showTrackedChanges
		});
	}
	async getCommentThreads(e, t = {}) {
		let { includeResolved: n, ...r } = t, i = await this.collectPageRuns(e, r);
		return tt(this.comments, this.commentAnchorRanges(), i, { includeResolved: n });
	}
	async getElementContextAt(e, t, n = {}) {
		let r = this._withActiveView(n);
		if (this._mode === "worker") return (await this._bridge.request((n) => ({
			type: "hitTestElement",
			id: n,
			pageIndex: e,
			point: t,
			opts: r
		}))).context;
		let i = E(this), a = i.services;
		if (!a) throw Error("Document layout services are not initialized");
		return Tt(a, e, t, {
			...r,
			defaultCurrentDateMs: i.defaultCurrentDateMs
		});
	}
};
//#endregion
//#region packages/docx/src/tate-chu-yoko-overlay.ts
function Gt(e, t) {
	if (!e.eastAsianVert) return 1;
	let n = t(e.text);
	return !(n > 0) || e.w >= n ? 1 : e.w / n;
}
//#endregion
//#region packages/docx/src/text-layer.ts
function Y(e, t, n) {
	e.dataset ? n === void 0 ? delete e.dataset[t] : e.dataset[t] = n : n !== void 0 && e.setAttribute?.(`data-${t.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`)}`, n);
}
function X(e, t, n, r, i, a, o) {
	e.innerHTML = "", Y(e, "ooxmlSelectionSurface", "docx"), Y(e, "pageIndex", o === void 0 ? void 0 : String(o));
	let s = e.ownerDocument ?? document;
	for (let [o, c] of t.entries()) {
		let t = s.createElement("span");
		Y(t, "ooxmlSelectionRun", "docx"), Y(t, "runIndex", String(o)), c.paragraphId !== void 0 && Y(t, "paragraphId", c.paragraphId), c.source !== void 0 && (Y(t, "sourceStory", c.source.story), Y(t, "sourceStoryInstance", c.source.storyInstance), Y(t, "sourcePath", JSON.stringify(c.source.path))), t.textContent = c.text;
		let l = c.transform ?? "";
		if (a && c.eastAsianVert) {
			let e = Gt(c, a(c.font));
			e !== 1 && (l = `${l ? `${l} ` : ""}scaleX(${e})`);
		}
		let u = l ? `transform:${l};transform-origin:top left;` : "", d = i ? c.hyperlink : void 0, f = d ? "pointer" : "text", p = c.letterSpacingPx === void 0 ? "0" : `${c.letterSpacingPx}px`;
		t.style.cssText = `position:absolute;left:${M(c.x, n)};top:${M(c.y, r)};font:${c.font};line-height:${c.h}px;letter-spacing:${p};` + u + `white-space:pre;color:transparent;cursor:${f};pointer-events:all;`, d && i && (t.title = d.kind === "external" ? d.url : d.ref, t.addEventListener("click", (e) => {
			e.preventDefault(), i(d);
		})), e.appendChild(t);
	}
}
function Z(e, t, n, r, i, a, o = {}) {
	e.innerHTML = "";
	let s = o.match ?? "rgba(255, 214, 0, 0.42)", c = o.active ?? "rgba(255, 140, 0, 0.55)";
	for (let o of n) {
		let n = o.active ? c : s;
		for (let s of o.slices) {
			let o = t[s.runIndex];
			if (!o) continue;
			let c = a(o.font), l = $e(o.text, s.start, s.end, c), u = o.letterSpacingPx ?? 0, d = Math.max(0, Math.min(s.start, o.text.length)), f = Math.max(d, Math.min(s.end, o.text.length)), p = [...o.text.slice(0, d)].length, m = [...o.text.slice(d, f)].length, h = l.x + p * u, g = l.width + Math.max(0, m - 1) * u, _ = Gt(o, c), v = h * _, y = g * _;
			if (y <= 0) continue;
			let b = document.createElement("div"), x = o.transform ? `transform:${o.transform};transform-origin:top left;` : "";
			b.style.cssText = `position:absolute;left:${M(o.x + v, r)};top:${M(o.y, i)};width:${M(y, r)};height:${M(o.h, i)};` + x + `background:${n};pointer-events:none;`, e.appendChild(b);
		}
	}
}
//#endregion
//#region packages/docx/src/find.ts
var Kt = class {
	_pageRuns = /* @__PURE__ */ new Map();
	_matches = [];
	_active = -1;
	_generation = 0;
	_runsRevision = 0;
	constructor(e, t) {
		this._pageCount = e, this._collectPageRuns = t;
	}
	invalidate() {
		this._generation++, this._runsRevision++, this._pageRuns.clear(), this._matches = [], this._active = -1;
	}
	pageRuns(e) {
		return this._pageRuns.get(e);
	}
	setPageRuns(e, t) {
		this._runsRevision++, this._pageRuns.set(e, t);
	}
	_matchAt(e) {
		return this._matches[e];
	}
	pageHighlights(e) {
		let t = [];
		for (let n = 0; n < this._matches.length; n++) {
			let r = this._matches[n];
			r.page === e && t.push({
				slices: r.slices,
				active: n === this._active
			});
		}
		return t;
	}
	activePage() {
		let e = this._matchAt(this._active);
		return e ? e.page : null;
	}
	matches() {
		return this._matches.map((e, t) => ({
			matchIndex: t,
			text: e.text,
			location: { page: e.page }
		}));
	}
	async find(e, t = {}) {
		let n = ++this._generation;
		if (e.length === 0) return this._runsRevision++, this._pageRuns.clear(), this._matches = [], this._active = -1, [];
		let r = this._runsRevision, i = new Map(this._pageRuns), a = this._pageCount();
		for (let e = 0; e < a; e++) {
			let t = i.get(e);
			if (!t) {
				try {
					t = await this._collectPageRuns(e);
				} catch (e) {
					if (n !== this._generation) return [];
					throw e;
				}
				if (n !== this._generation) return [];
				i.set(e, t);
			}
		}
		if (n !== this._generation) return [];
		let o = r === this._runsRevision ? i : new Map([...i, ...this._pageRuns]), s = [];
		for (let n = 0; n < a; n++) {
			let r = o.get(n) ?? [], i = ie(r);
			for (let a of re(i, e, t)) {
				let e = a.slices.map((e) => r[e.runIndex].text.slice(e.start, e.end)).join("");
				s.push({
					page: n,
					text: e,
					slices: a.slices
				});
			}
		}
		return this._runsRevision++, this._pageRuns = o, this._matches = s, this._active = -1, this.matches();
	}
	next() {
		return this._active = te(this._active, this._matches.length), this._activePublic();
	}
	prev() {
		return this._active = se(this._active, this._matches.length), this._activePublic();
	}
	_activePublic() {
		let e = this._matchAt(this._active);
		return e ? {
			matchIndex: this._active,
			text: e.text,
			location: { page: e.page }
		} : null;
	}
};
//#endregion
//#region packages/docx/src/selection-context.ts
function qt(e, t, n, r, i = {}) {
	let a = e.find((e) => e.id === n && e.parentId === void 0);
	if (!a) return null;
	let o = new Map(e.map((e) => [e.id, e])), s = e.filter((e) => {
		if (e.parentId === void 0) return !1;
		let t = e, n = /* @__PURE__ */ new Set();
		for (; t.parentId !== void 0 && !n.has(t.id);) {
			n.add(t.id);
			let e = o.get(t.parentId);
			if (!e) return !1;
			if (e.id === a.id) return !0;
			t = e;
		}
		return !1;
	}), c = Se({
		id: a.id,
		author: a.author,
		date: a.date,
		text: a.paragraphs?.join("\n") ?? a.text,
		status: a.resolved ? "resolved" : "active"
	}, s.map((e) => ({
		id: e.id,
		author: e.author,
		date: e.date,
		text: e.paragraphs?.join("\n") ?? e.text,
		status: e.resolved ? "resolved" : "active"
	})), i.maxTextCharacters), l = t.find((e) => e.commentId === n)?.source;
	return Object.freeze({
		format: "docx",
		kind: "comment",
		pageIndex: r,
		commentId: n,
		...l ? { source: Object.freeze({
			...l,
			path: Object.freeze([...l.path])
		}) } : {},
		thread: c.thread,
		truncated: c.truncated,
		truncationReasons: c.truncated ? ["text"] : [],
		textCharacters: c.textCharacters,
		maxTextCharacters: c.maxTextCharacters
	});
}
function Jt(e) {
	if (e === void 0 || !/^\d+$/.test(e)) return null;
	let t = Number(e);
	return Number.isSafeInteger(t) ? t : null;
}
function Yt(e) {
	for (let t = e; t; t = t.parentElement) {
		let e = Jt(t.dataset.pageIndex);
		if (e !== null) return e;
	}
	return null;
}
var Xt = new Set([
	"body",
	"header",
	"footer",
	"footnote",
	"endnote",
	"textbox"
]);
function Zt(e) {
	let t = e.dataset.sourceStory, n = e.dataset.sourceStoryInstance, r = e.dataset.sourcePath;
	if (!t || !Xt.has(t) || !n || !r) return null;
	try {
		let e = JSON.parse(r);
		return !Array.isArray(e) || e.length === 0 || e.length > 32 || !e.every((e) => Number.isSafeInteger(e) && e >= 0) ? null : {
			story: t,
			storyInstance: n,
			path: [...e]
		};
	} catch {
		return null;
	}
}
function Q(e, t, n = {}) {
	let r = le(e, t, (e) => {
		let t = Yt(e), n = Jt(e.dataset.runIndex);
		return t === null || n === null ? null : {
			pageIndex: t,
			runIndex: n,
			...e.dataset.paragraphId === void 0 ? {} : { paragraphId: e.dataset.paragraphId },
			...Zt(e) === null ? {} : { source: Zt(e) }
		};
	}, {
		maxChars: n.maxTextCharacters,
		maxLocators: n.maxRunLocators
	});
	if (!r) return null;
	let i = [...r.locators].sort((e, t) => e.pageIndex - t.pageIndex || e.runIndex - t.runIndex);
	return {
		format: "docx",
		kind: "text",
		text: r.text,
		pageIndexes: [...new Set(i.map((e) => e.pageIndex))],
		paragraphIds: [...new Set(i.flatMap((e) => e.paragraphId ? [e.paragraphId] : []))],
		runs: i,
		truncated: r.truncated,
		truncationReasons: r.truncationReasons,
		textCharacters: r.textCharacters,
		maxTextCharacters: r.maxTextCharacters,
		maxRunLocators: r.maxLocators
	};
}
//#endregion
//#region packages/docx/src/focused-view-runtime.ts
function $(e, t, n, r, i) {
	return r === "worker" ? e.renderPageToBitmap(n, i) : e.renderPage(t, n, i);
}
//#endregion
//#region packages/docx/src/viewer.ts
var Qt = Symbol("DocxViewer.borrowedDocument"), $t = class e {
	_documentOwner;
	get _doc() {
		return this._documentOwner.current;
	}
	_borrowed;
	_hostWindow;
	_currentPage = 0;
	_scale = null;
	_canvas;
	_wrapper;
	_canvasMount;
	_textLayer = null;
	_highlightLayer = null;
	_elementLayer = null;
	_find;
	_findRequestGeneration = 0;
	_measureCtx = null;
	_opts;
	_mode;
	_renderDispatcher;
	_errorRouter;
	_destroyed = !1;
	_selectionChangeListener = null;
	_selectionContextKey = "null";
	_elementContext = null;
	_elementHitGeneration = 0;
	_layoutViewGeneration = 0;
	_layoutViewPublicationGeneration = 0;
	_navigationGeneration = 0;
	_layoutUnsubscribe = null;
	_internalHyperlinkGeneration = 0;
	_layoutWaiters = /* @__PURE__ */ new Set();
	_layoutFailed = !1;
	_loadingLayer;
	_elementClickListener = null;
	_contextMenuListener = null;
	static fromDocument(t, n, r = {}) {
		let i = G(n);
		return new e(t, {
			...r,
			currentDate: i.currentDate,
			showTrackedChanges: i.showTrackedChanges,
			[Qt]: n
		});
	}
	constructor(e, t = {}) {
		this._canvas = e, this._opts = t;
		let n = t[Qt];
		this._borrowed = n !== void 0, this._mode = C("DocxViewer", t.mode, n), this._documentOwner = new y("DocxViewer", n ?? null, !1);
		let r = e.ownerDocument?.defaultView ?? (typeof window < "u" ? window : null);
		if (!r) throw Error("DocxViewer requires a canvas with an active Window");
		this._hostWindow = r, this._canvasMount = new ue(e, {
			wrapperCssText: "position:relative;display:inline-block;vertical-align:top;",
			forceDisplayBlock: !0
		}), this._wrapper = this._canvasMount.wrapper, this._renderDispatcher = new S(e, this._mode === "worker"), this._errorRouter = new ce("DocxViewer", t.onError);
		let i = new ae(this._wrapper, t.enableTextSelection === !0, t.enableElementSelection === !0);
		this._textLayer = i.textLayer, this._highlightLayer = i.highlightLayer, this._elementLayer = i.elementLayer, this._loadingLayer = this._wrapper.ownerDocument.createElement("div"), this._loadingLayer.style.cssText = [
			"position:absolute",
			"inset:0",
			"display:none",
			"align-items:center",
			"justify-content:center",
			"background:rgba(255,255,255,0.72)",
			"pointer-events:none",
			"z-index:4"
		].join(";"), this._loadingLayer.setAttribute("role", "status"), this._loadingLayer.setAttribute("aria-live", "polite"), this._loadingLayer.setAttribute("aria-label", "Loading page");
		let a = this._wrapper.ownerDocument.createElement("progress");
		a.setAttribute("aria-hidden", "true"), this._loadingLayer.appendChild(a), this._wrapper.insertBefore(this._loadingLayer, this._elementLayer), this._textLayer && (t.onSelectionContextChange || t.enableElementSelection) && (this._selectionChangeListener = () => this._emitSelectionContextChange(), this._wrapper.ownerDocument.addEventListener("selectionchange", this._selectionChangeListener)), t.enableElementSelection && (this._elementClickListener = (e) => {
			this._onElementClick(e).catch((e) => this._reportRenderError(e));
		}, this._wrapper.addEventListener("click", this._elementClickListener)), t.onContextMenu && (this._contextMenuListener = (e) => this._onContextMenu(e), this._wrapper.addEventListener("contextmenu", this._contextMenuListener)), this._find = new Kt(() => this.pageCount, (e) => this._collectPageRuns(e)), n && this._bindLayoutDocument(n);
	}
	async load(e) {
		if (this._destroyed) throw Error("DocxViewer is destroyed");
		if (this._borrowed) throw Error("DocxViewer.load() is unsupported on a Viewer created by fromDocument(); the borrowed document is already loaded.");
		let t = !1;
		try {
			let n = await this._documentOwner.replace(() => J.load(e, {
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
				...this._opts.progressiveLayout ? { progressiveLayout: !0 } : {},
				...this._opts.sliceLayout ? { sliceLayout: !0 } : {},
				onLayoutProgress: this._opts.onLayoutProgress,
				onLayoutPartial: this._opts.onLayoutPartial,
				onLayoutComplete: this._opts.onLayoutComplete,
				...this._opts.showTrackedChanges === !0 ? { showTrackedChanges: !0 } : {},
				...this._opts.currentDate === void 0 ? {} : { currentDate: this._opts.currentDate }
			}), () => {
				this._invalidateElementContext(!1), t = !0, this._renderDispatcher.begin(), this._findRequestGeneration++, this._find.invalidate(), this._unbindLayoutDocument();
			});
			if (!n) return;
			if (this._destroyed) throw Error("DocxViewer is destroyed");
			this._currentPage = 0, this._bindLayoutDocument(n), this._find.invalidate(), await this._render();
		} catch (e) {
			throw this._destroyed ? Error("DocxViewer is destroyed") : e instanceof Error ? e : Error(String(e));
		}
		t && !this._destroyed && this._emitSelectionContextChange();
	}
	get pageCount() {
		return this._doc?.pageCount ?? 0;
	}
	get currentPage() {
		return this._currentPage;
	}
	get layoutComplete() {
		return this._doc?.layoutComplete ?? !0;
	}
	async waitUntilLayoutComplete() {
		await this._errorRouter.ownBackgroundLifecycle(async () => {
			await this._doc?.waitUntilLayoutComplete?.();
		});
	}
	get canvasElement() {
		return this._canvas;
	}
	async goToPage(e) {
		let t = this._doc;
		if (!t) return;
		let n = this._cancelPendingNavigation(), r = Math.max(0, Number.isNaN(e) ? 0 : Math.trunc(e));
		if (r >= this.pageCount && !this.layoutComplete) {
			this._setLoading(!0);
			try {
				await this._waitForPage(t, r, n);
			} finally {
				n === this._navigationGeneration && this._setLoading(!1);
			}
		}
		if (this._destroyed || n !== this._navigationGeneration || t !== this._doc) return;
		let i = Math.max(0, Math.min(r, this.pageCount - 1)), a = i !== this._currentPage;
		a && this._invalidateElementContext(!1), this._currentPage = i, await this._render(), a && !this._destroyed && this._emitSelectionContextChange();
	}
	async nextPage() {
		await this.goToPage(this._currentPage + 1);
	}
	async prevPage() {
		await this.goToPage(this._currentPage - 1);
	}
	_naturalWidthPx() {
		return !this._doc || this._doc.pageCount === 0 ? 0 : this._doc.pageSize(this._currentPage).widthPt * j;
	}
	_renderWidth() {
		if (this._scale === null) return this._opts.width;
		let e = this._naturalWidthPx();
		return e <= 0 ? this._opts.width : Math.round(e * this._scale);
	}
	getScale() {
		if (this._scale !== null) return this._scale;
		let e = this._naturalWidthPx();
		return e <= 0 ? 1 : this._opts.width && this._opts.width > 0 ? this._opts.width / e : 1;
	}
	_zoomMin() {
		return this._opts.zoomMin ?? .1;
	}
	_zoomMax() {
		return this._opts.zoomMax ?? 4;
	}
	async setScale(e) {
		let t = ne(e, this._zoomMin(), this._zoomMax()), n = t !== this.getScale();
		this._scale = t, await this._render(), n && this._opts.onScaleChange?.(t);
	}
	async zoomIn() {
		await this.setScale(fe(this.getScale()));
	}
	async zoomOut() {
		await this.setScale(he(this.getScale()));
	}
	async fitWidth() {
		await this._fit("width");
	}
	async fitPage() {
		await this._fit("page");
	}
	async _fit(e) {
		if (!this._doc || this._doc.pageCount === 0) return;
		let t = this._doc.pageSize(this._currentPage), n = this._fitContainer();
		if (!n) return;
		let r = v({
			contentWidth: t.widthPt * j,
			contentHeight: t.heightPt * j,
			containerWidth: n.clientWidth,
			containerHeight: n.clientHeight
		}, e);
		r <= 0 || await this.setScale(r);
	}
	_fitContainer() {
		return this._opts.container ?? this._wrapper.parentElement ?? null;
	}
	async findText(e, t = {}) {
		let n = this._doc;
		if (!n) return [];
		let r = ++this._findRequestGeneration;
		if (e.length > 0 && !n.layoutComplete && (await this._errorRouter.ownBackgroundLifecycle(() => n.waitUntilLayoutComplete()), this._destroyed || this._doc !== n || r !== this._findRequestGeneration)) return [];
		let i = await this._errorRouter.ownAwaitable(() => this._find.find(e, t));
		return this._redrawHighlights(), i;
	}
	async findNext() {
		return this._activateMatch(this._find.next());
	}
	async findPrev() {
		return this._activateMatch(this._find.prev());
	}
	clearFind() {
		this._findRequestGeneration++, this._find.invalidate(), this._redrawHighlights();
	}
	async _activateMatch(e) {
		return e ? (e.location.page === this._currentPage ? this._redrawHighlights() : await this.goToPage(e.location.page), e) : (this._redrawHighlights(), null);
	}
	_redrawHighlights() {
		let e = this._find.pageRuns(this._currentPage) ?? [];
		this._buildHighlightLayer(e);
	}
	async getResourceMetrics() {
		if (!this._doc) throw Error("Document not loaded");
		return await this._doc.getResourceMetrics();
	}
	getSelectionContext(e = {}) {
		if (this._destroyed) throw Error("DocxViewer is destroyed");
		return (this._textLayer ? Q(this._wrapper, this._wrapper.ownerDocument?.getSelection?.() ?? null, e) : null) ?? (this._elementContext ? Et(this._elementContext, e.maxTextCharacters) : null);
	}
	_emitSelectionContextChange() {
		let e = this.getSelectionContext();
		e?.kind === "text" && (this._elementHitGeneration++, this._elementContext = null, this._redrawElementOutline());
		let t = JSON.stringify(e);
		t !== this._selectionContextKey && (this._selectionContextKey = t, this._opts.onSelectionContextChange?.(e ? structuredClone(e) : null));
	}
	_setElementContext(e) {
		this._elementContext = e ? structuredClone(e) : null, this._redrawElementOutline(), this._emitSelectionContextChange();
	}
	_invalidateElementContext(e = !0) {
		this._elementHitGeneration++, this._elementContext = null, this._redrawElementOutline(), e && this._emitSelectionContextChange();
	}
	_redrawElementOutline() {
		let e = this._elementContext, t = this._doc;
		if (!e || !t || e.pageIndex !== this._currentPage) {
			x(this._elementLayer, null);
			return;
		}
		let n = t.pageSize(e.pageIndex);
		x(this._elementLayer, {
			x: e.bounds.xPt / n.widthPt,
			y: e.bounds.yPt / n.heightPt,
			width: e.bounds.widthPt / n.widthPt,
			height: e.bounds.heightPt / n.heightPt
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
		let t = this._doc;
		if (this._destroyed || !t) return null;
		if (this._textLayer && Q(this._wrapper, this._wrapper.ownerDocument?.getSelection?.() ?? null)) return this._emitSelectionContextChange(), this._destroyed ? null : this.getSelectionContext();
		if (!this._opts.enableElementSelection) return this.getSelectionContext();
		let n = this._canvas.getBoundingClientRect();
		if (n.width <= 0 || n.height <= 0) return this._invalidateElementContext(), null;
		let r = e.clientX - n.left, i = e.clientY - n.top;
		if (r < 0 || i < 0 || r > n.width || i > n.height) return this._invalidateElementContext(), null;
		let a = ++this._elementHitGeneration, o = this._currentPage, s = t.pageSize(o), c;
		try {
			c = await t.getElementContextAt(o, {
				xPt: r / n.width * s.widthPt,
				yPt: i / n.height * s.heightPt
			}, {
				currentDate: this._opts.currentDate,
				showTrackedChanges: this._opts.showTrackedChanges,
				maxTextCharacters: F
			});
		} catch (e) {
			if (this._destroyed || a !== this._elementHitGeneration || o !== this._currentPage || t !== this._doc) return null;
			throw e;
		}
		return this._destroyed || a !== this._elementHitGeneration || o !== this._currentPage || t !== this._doc ? null : (this._setElementContext(c), this._destroyed ? null : this.getSelectionContext());
	}
	destroy() {
		this._destroyed || (this._destroyed = !0, this._findRequestGeneration++, this._layoutViewGeneration++, this._unbindLayoutDocument(), this._errorRouter.close(), this._renderDispatcher.destroy(), We(this._canvas), this._documentOwner.close(), this._find.invalidate(), this._selectionChangeListener &&= (this._wrapper.ownerDocument.removeEventListener("selectionchange", this._selectionChangeListener), null), this._elementHitGeneration++, this._elementClickListener &&= (this._wrapper.removeEventListener("click", this._elementClickListener), null), this._contextMenuListener &&= (this._wrapper.removeEventListener("contextmenu", this._contextMenuListener), null), this._elementContext = null, this._canvasMount.restore());
	}
	async _render() {
		let e = this._renderDispatcher.begin();
		try {
			await this._renderPage(e);
		} catch (t) {
			if (!this._renderDispatcher.isCurrent(e)) return;
			throw t;
		}
	}
	_reportRenderError(e) {
		this._errorRouter.report(e);
	}
	async _renderPage(e) {
		if (!this._doc) return;
		let t = this._mode === "worker", n = this._renderWidth(), r = this._doc.pageSize(this._currentPage), i = n ?? r.widthPt * 1.3333333333333333, a = r.widthPt > 0 ? i * r.heightPt / r.widthPt : 0, o = [], s = (e) => o.push(e), c = this._opts.dpr ?? (typeof window < "u" && window.devicePixelRatio || 1), l = {
			width: n,
			dpr: this._opts.dpr,
			imageResources: this._opts.imageResources,
			defaultTextColor: this._opts.defaultTextColor,
			currentDate: this._opts.currentDate,
			showTrackedChanges: this._opts.showTrackedChanges,
			onTextRun: s
		};
		if (t) {
			let t = await $(this._doc, this._canvas, this._currentPage, "worker", l);
			if (!this._renderDispatcher.commitBitmap(e, t, {
				cssWidth: i > 0 ? i : Math.round(t.width / c),
				cssHeight: a > 0 ? a : Math.round(t.height / c)
			})) return;
		} else if (await $(this._doc, this._canvas, this._currentPage, "main", l), !this._renderDispatcher.isCurrent(e)) return;
		this._textLayer && this._buildTextLayer(this._textLayer, o), this._find.setPageRuns(this._currentPage, o), this._buildHighlightLayer(o), this._opts.onPageChange?.(this._currentPage, this.pageCount, this.layoutComplete);
	}
	_bindLayoutDocument(e) {
		this._unbindLayoutDocument(), this._layoutFailed = !1, this._layoutViewPublicationGeneration = 0;
		let t = zt(e, (t) => this._onLayoutViewPublication(e, t), (e) => this._reportRenderError(e)), n = !0, r = Ft(e, () => ({
			pageCount: e.pageCount,
			exact: e.layoutComplete,
			complete: e.layoutComplete
		}), (t) => {
			if (n) {
				n = !1;
				return;
			}
			this._onLayoutPublication(e, t);
		}, (e) => this._reportRenderError(e));
		this._layoutUnsubscribe = () => {
			r(), t();
		};
	}
	_unbindLayoutDocument() {
		this._layoutUnsubscribe?.(), this._layoutUnsubscribe = null, this._layoutFailed = !1, this._cancelPendingNavigation();
	}
	_onLayoutPublication(e, t) {
		if (!(this._destroyed || e !== this._doc)) {
			if (this._wakeLayoutWaiters(), t.error !== void 0) {
				this._layoutFailed = !0, this._errorRouter.reportBackground(t.error, this._opts.onLayoutComplete !== void 0);
				return;
			}
			this._find.invalidate(), this._currentPage = Math.max(0, Math.min(this._currentPage, t.pageCount - 1)), this._render().catch((e) => this._reportRenderError(e));
		}
	}
	_onLayoutViewPublication(e, t) {
		this._destroyed || e !== this._doc || t.generation <= this._layoutViewPublicationGeneration || (this._layoutViewPublicationGeneration = t.generation, t.requester !== this && (this._layoutViewGeneration++, this._opts = {
			...this._opts,
			currentDate: t.view.currentDate,
			showTrackedChanges: t.view.showTrackedChanges
		}, this._find.invalidate(), this._currentPage = Math.max(0, Math.min(this._currentPage, e.pageCount - 1)), this._render().catch((e) => this._reportRenderError(e))));
	}
	async _waitForPage(e, t, n) {
		await this._errorRouter.ownBackgroundLifecycle(async () => {
			for (; !this._destroyed && n === this._navigationGeneration && e === this._doc && t >= e.pageCount && !e.layoutComplete && !this._layoutFailed;) await new Promise((e) => {
				this._layoutWaiters.add(e);
			});
			e === this._doc && (e.layoutComplete || this._layoutFailed) && await e.waitUntilLayoutComplete();
		});
	}
	_wakeLayoutWaiters() {
		for (let e of this._layoutWaiters) e();
		this._layoutWaiters.clear();
	}
	_cancelPendingNavigation() {
		let e = ++this._navigationGeneration;
		return this._wakeLayoutWaiters(), this._setLoading(!1), e;
	}
	_setLoading(e) {
		this._loadingLayer.style.display = e ? "flex" : "none";
	}
	async setShowTrackedChanges(e) {
		let t = ++this._layoutViewGeneration, n = this._doc;
		if (this._opts.showTrackedChanges === !0 === e) {
			n && await K(n, {
				showTrackedChanges: e,
				currentDate: this._opts.currentDate
			}, this);
			return;
		}
		let r = {
			...this._opts,
			showTrackedChanges: e
		};
		(!n || await K(n, {
			showTrackedChanges: e,
			currentDate: r.currentDate
		}, this)) && (this._destroyed || t !== this._layoutViewGeneration || n !== this._doc || (this._opts = r, this._find.invalidate(), this._currentPage = Math.max(0, Math.min(this._currentPage, this.pageCount - 1)), await this._render()));
	}
	_buildHighlightLayer(e) {
		let t = this._highlightLayer;
		if (!t) return;
		let { width: n, height: r } = this._canvasCssPx();
		Z(t, e, this._find.pageHighlights(this._currentPage), n, r, (e) => this._measureForFont(e), this._opts.findHighlightColors);
	}
	_canvasCssPx() {
		return {
			width: parseFloat(this._canvas.style.width) || this._canvas.width,
			height: parseFloat(this._canvas.style.height) || this._canvas.height
		};
	}
	_measureForFont(e) {
		this._measureCtx ||= document.createElement("canvas").getContext("2d");
		let t = this._measureCtx;
		return t ? (t.font = e, (e) => t.measureText(e).width) : (e) => e.length;
	}
	async _collectPageRuns(e) {
		return this._doc ? this._doc.collectPageRuns(e, {
			width: this._renderWidth(),
			currentDate: this._opts.currentDate,
			showTrackedChanges: this._opts.showTrackedChanges
		}) : [];
	}
	_buildTextLayer(e, t) {
		let { width: n, height: r } = this._canvasCssPx();
		X(e, t, n, r, this._hyperlinkHandler(), (e) => this._measureForFont(e), this._currentPage);
	}
	_hyperlinkHandler() {
		return this._opts.enableHyperlinks === !1 ? void 0 : this._opts.onHyperlinkClick || ((e) => {
			if (e.kind === "external") {
				a(e.url, void 0, this._hostWindow);
				return;
			}
			let t = this._doc;
			if (!t) return;
			let n = ++this._internalHyperlinkGeneration;
			this._navigateInternalHyperlink(t, e.ref, n).catch((e) => this._reportRenderError(e));
		});
	}
	async _navigateInternalHyperlink(e, t, n) {
		if (e.layoutComplete || await e.waitUntilLayoutComplete(), this._destroyed || this._doc !== e || n !== this._internalHyperlinkGeneration) return;
		let r = e.getBookmarkPage(t);
		r !== void 0 && await this.goToPage(r);
	}
}, en = 150, tn = "0 1px 3px rgba(0,0,0,0.2)", nn = 12, rn = 13, an = Symbol("DocxScrollViewer.borrowedDocument"), on;
function sn() {
	return on ??= import("./comment-ui-runtime-DAKBCpsM.js");
}
var cn = class e {
	_documentOwner;
	get _doc() {
		return this._documentOwner.current;
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
	_heights = [];
	_scrollGeometry = {
		offsets: [],
		totalHeight: 0
	};
	_lastRange = null;
	_lastTopIndex = -1;
	_lastReportedTotal = -1;
	_lastReportedLayoutComplete = null;
	_layoutUnsubscribe = null;
	_presentedPageCount = 0;
	_scrollListener = null;
	_selectionChangeListener = null;
	_selectionContextKey = "null";
	_elementClickListener = null;
	_contextMenuListener = null;
	_commentOutsidePointerListener = null;
	_elementContext = null;
	_activeCommentId = null;
	_activeCommentPage = null;
	_commentUi = null;
	_commentPageById = /* @__PURE__ */ new Map();
	_commentRunsByPage = /* @__PURE__ */ new Map();
	_commentIndexedPages = /* @__PURE__ */ new Set();
	_commentScanFrontier = 0;
	_commentNavigationGeneration = 0;
	_internalHyperlinkGeneration = 0;
	_commentAnchorRangesForMargin = null;
	_commentAnchorIds = /* @__PURE__ */ new Set();
	_reviewOriginPx = 0;
	_commentGeometryScheduled = !1;
	_commentGeometryFrame = null;
	_pendingCommentGeometry = /* @__PURE__ */ new Map();
	_elementHitGeneration = 0;
	_destroyed = !1;
	_measureCtx;
	_bitmapInFlight = /* @__PURE__ */ new Set();
	_renderEpoch = 0;
	_settleTimer = null;
	_wheelListener = null;
	_pendingZoomAnchor = null;
	_resizeObserver = null;
	_prevBase = 0;
	_lastFitWidth = 0;
	_pageShadow;
	_find = new Kt(() => this.pageCount, (e) => this._collectPageRuns(e));
	_findActive = !1;
	_findRequestGeneration = 0;
	_showTrackedChanges;
	_currentDate;
	_layoutViewGeneration = 0;
	_layoutViewPublicationGeneration = 0;
	static fromDocument(t, n, r = {}) {
		let i = G(n);
		return new e(t, {
			...r,
			currentDate: i.currentDate,
			showTrackedChanges: i.showTrackedChanges,
			[an]: n
		});
	}
	constructor(e, t = {}) {
		if (e.tagName === "CANVAS") throw Error("DocxScrollViewer takes a container element (e.g. a <div>), not a <canvas> — the viewer creates and manages its own canvases. Pass a block container; for the single-page canvas API use DocxViewer.");
		this._container = e, this._opts = t, this._errorRouter = new ce("DocxScrollViewer", t.onError), this._showTrackedChanges = t.showTrackedChanges === !0, this._currentDate = t.currentDate, this._pageShadow = t.pageShadow ?? tn;
		let n = t[an];
		this._borrowed = n !== void 0, n ? (this._documentOwner = new y("DocxScrollViewer", n, !1), this._mode = C("DocxScrollViewer", t.mode, n)) : (this._documentOwner = new y("DocxScrollViewer"), this._mode = C("DocxScrollViewer", t.mode, void 0)), this._wrapper = document.createElement("div"), this._wrapper.style.cssText = "position:relative;width:100%;height:100%;overflow:hidden;", this._scrollHost = document.createElement("div"), this._scrollHost.style.cssText = "position:absolute;inset:0;overflow:auto;", this._scrollHost.style.scrollbarGutter = "stable", t.background && (this._scrollHost.style.background = t.background), this._spacer = document.createElement("div"), this._spacer.style.cssText = "position:absolute;top:0;left:0;width:1px;height:0;pointer-events:none;", this._scrollHost.appendChild(this._spacer), this._wrapper.appendChild(this._scrollHost), this._container.appendChild(this._wrapper), this._commentsEnabled() && sn().then((e) => {
			if (!this._destroyed) {
				this._commentUi = e;
				for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
			}
		}).catch((e) => this._reportRenderError(e)), t.enableTextSelection && (t.onSelectionContextChange || t.enableElementSelection) && (this._selectionChangeListener = () => this._emitSelectionContextChange(), this._wrapper.ownerDocument.addEventListener("selectionchange", this._selectionChangeListener)), t.enableElementSelection && (this._elementClickListener = (e) => {
			this._onElementClick(e).catch((e) => this._reportRenderError(e));
		}, this._scrollHost.addEventListener("click", this._elementClickListener)), t.onContextMenu && (this._contextMenuListener = (e) => this._onContextMenu(e), this._scrollHost.addEventListener("contextmenu", this._contextMenuListener)), this._scrollListener = () => this._onScroll(), this._scrollHost.addEventListener("scroll", this._scrollListener), t.comments && (this._commentOutsidePointerListener = (e) => {
			if (!Te(e, this._wrapper, "ooxmlCommentId") && this._activeCommentId !== null) {
				this._activeCommentId = null, this._activeCommentPage = null;
				for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
				this._emitSelectionContextChange();
			}
		}, this._wrapper.ownerDocument.addEventListener("pointerdown", this._commentOutsidePointerListener)), this._opts.enableZoom !== !1 && (this._wheelListener = (e) => {
			if (!(e.ctrlKey || e.metaKey) || (e.preventDefault(), e.deltaY === 0)) return;
			let t = this._scrollHost.getBoundingClientRect(), n = e.clientX - t.left, r = e.clientY - t.top;
			this._pendingZoomAnchor = Number.isFinite(n) && Number.isFinite(r) ? {
				x: n,
				y: r
			} : null, this.setScale(me(this._scale, e.deltaY, e.deltaMode));
		}, this._scrollHost.addEventListener("wheel", this._wheelListener, { passive: !1 })), typeof ResizeObserver < "u" && (this._resizeObserver = new ResizeObserver(() => this._onResize()), this._resizeObserver.observe(this._container)), this._borrowed && (this._bindLayoutDocument(n), this.relayout());
	}
	async load(e) {
		if (this._destroyed) throw Error("DocxScrollViewer is destroyed");
		if (this._borrowed) throw Error("DocxScrollViewer.load() is unsupported on a Viewer created by fromDocument(); the borrowed document is already loaded.");
		let t = !1;
		try {
			let n = await this._documentOwner.replace(() => J.load(e, {
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
				...this._showTrackedChanges ? { showTrackedChanges: !0 } : {},
				...this._currentDate === void 0 ? {} : { currentDate: this._currentDate },
				...this._opts.progressiveLayout ? { progressiveLayout: !0 } : {},
				...this._opts.sliceLayout ? { sliceLayout: !0 } : {},
				onLayoutProgress: this._opts.onLayoutProgress,
				onLayoutPartial: this._opts.onLayoutPartial,
				onLayoutComplete: this._opts.onLayoutComplete
			}), (e) => {
				if (this._invalidateElementContext(!1), t = !0, this._findRequestGeneration++, this._find.invalidate(), this._findActive = !1, this._activeCommentId = null, this._activeCommentPage = null, this._resetCommentNavigation(), this._unbindLayoutDocument(), e) {
					for (let [e, t] of [...this._slots]) this._recycleSlot(e, t);
					this._lastTopIndex = -1, this._lastReportedTotal = -1, this._lastReportedLayoutComplete = null;
				}
			});
			if (!n) return;
			if (this._destroyed) throw Error("DocxScrollViewer is destroyed");
			this._bindLayoutDocument(n), this._find.invalidate(), this._findActive = !1, this._activeCommentId = null, this._activeCommentPage = null, this._resetCommentNavigation();
			let r = [];
			this._relayout(r), await Promise.all(r);
		} catch (e) {
			throw this._destroyed ? Error("DocxScrollViewer is destroyed") : e instanceof Error ? e : Error(String(e));
		}
		t && !this._destroyed && this._emitSelectionContextChange();
	}
	get pageCount() {
		return this._doc?.pageCount ?? 0;
	}
	get layoutComplete() {
		return this._doc?.layoutComplete ?? !0;
	}
	async waitUntilLayoutComplete() {
		await this._errorRouter.ownBackgroundLifecycle(async () => {
			await this._doc?.waitUntilLayoutComplete?.();
		});
	}
	_bindLayoutDocument(e) {
		this._unbindLayoutDocument(), this._layoutViewPublicationGeneration = 0, this._presentedPageCount = e.pageCount;
		let t = zt(e, (t) => this._onLayoutViewPublication(e, t), (e) => this._reportRenderError(e)), n = !0, r = Ft(e, () => ({
			pageCount: e.pageCount,
			exact: e.layoutComplete,
			complete: e.layoutComplete
		}), (t) => {
			if (n) {
				n = !1;
				return;
			}
			this._onLayoutPublication(e, t);
		}, (e) => this._reportRenderError(e));
		this._layoutUnsubscribe = () => {
			r(), t();
		};
	}
	_unbindLayoutDocument() {
		this._layoutUnsubscribe?.(), this._layoutUnsubscribe = null, this._presentedPageCount = 0;
	}
	_onLayoutPublication(e, t) {
		if (!(this._destroyed || e !== this._doc)) {
			if (t.error !== void 0) {
				this._errorRouter.reportBackground(t.error, this._opts.onLayoutComplete !== void 0);
				return;
			}
			this._find.invalidate(), this._refreshCommentSurface(), this._applyLayoutPublication(t);
		}
	}
	_onLayoutViewPublication(e, t) {
		this._destroyed || e !== this._doc || t.generation <= this._layoutViewPublicationGeneration || (this._layoutViewPublicationGeneration = t.generation, t.requester !== this && (this._layoutViewGeneration++, this._showTrackedChanges = t.view.showTrackedChanges, this._currentDate = t.view.currentDate, this._find.invalidate(), this._applyLayoutPublication({
			pageCount: e.pageCount,
			exact: !0,
			complete: e.layoutComplete
		})));
	}
	_refreshCommentSurface() {
		if (!(!this._commentsEnabled() || this._slots.size === 0)) {
			this._syncSpacerWidth();
			for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
		}
	}
	_applyLayoutPublication(e) {
		let t = [...this._slots];
		this._presentedPageCount = e.pageCount, this._renderEpoch++, this.relayout();
		for (let [e, n] of t) e >= this._presentedPageCount || this._slots.get(e) !== n || this._refreshSlotAtomically(e, n);
	}
	_pageWidthPx(e) {
		return this._doc.pageSize(e).widthPt * j * this._scale;
	}
	_pageHeightPx(e) {
		return this._doc.pageSize(e).heightPt * j * this._scale;
	}
	_fitWidthPx() {
		if (this._opts.width && this._opts.width > 0) return this._opts.width;
		let e = this._scrollHost.clientWidth || this._container.clientWidth;
		if (e <= 0) return 0;
		let { left: t, right: n } = this._padH(), r = e - t - n;
		return r <= 0 ? 0 : r;
	}
	_hasCommentMargin() {
		return this._hasDisplayableComments() && this._commentsOptions()?.cards !== !1;
	}
	_hasDisplayableComments() {
		if (!this._commentsEnabled()) return !1;
		let e = this._doc;
		if (!e) return !1;
		let t = e.commentAnchorRanges();
		if (this._commentAnchorRangesForMargin !== t && (this._commentAnchorRangesForMargin = t, this._commentAnchorIds = new Set(t.map((e) => e.commentId))), this._commentAnchorIds.size === 0) return !1;
		let n = this._commentsOptions()?.includeResolved === !0;
		return e.comments.some((e) => this._commentAnchorIds.has(e.id) && e.parentId === void 0 && (n || e.resolved !== !0));
	}
	_commentMarginExtent() {
		return this._hasCommentMargin() ? (nn + 280) * this._commentZoom() : 0;
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
		let t = this._commentZoom(), n = `calc(100% + ${nn * t}px)`;
		e.style.left = this._commentSide() === "right" ? n : "", e.style.right = this._commentSide() === "left" ? n : "", e.style.width = `${280 * t}px`, e.style.fontSize = `${rn}px`, e.dataset.ooxmlCommentZoom = String(t);
	}
	_widestPageWidthPt() {
		if (!this._doc) return 0;
		let e = 0, t = this._presentedPageCount || this._doc.pageCount;
		for (let n = 0; n < t; n++) {
			let t = this._doc.pageSize(n).widthPt;
			t > e && (e = t);
		}
		return e;
	}
	_baseScale() {
		if (!this._doc || this._doc.pageCount === 0) return 0;
		let e = this._fitWidthPx();
		if (e <= 0) return 0;
		let t = this._widestPageWidthPt();
		return t <= 0 ? 0 : e / (t * j);
	}
	relayout() {
		this._relayout();
	}
	_relayout(e) {
		if (this._doc) {
			if (this._doc.layoutComplete !== !1 && (this._presentedPageCount = this._doc.pageCount), this._scaleEstablished) {
				let e = this._baseScale();
				if (e > 0 && e !== this._prevBase) {
					let t = this._prevBase > 0 ? this._scale / this._prevBase : 1;
					this._prevBase = e, this.setScale(e * t);
				}
			} else {
				let e = this._baseScale();
				if (e > 0) {
					if (this._scale = e, this._prevBase = e, this._lastFitWidth = this._fitWidthPx(), this._scaleEstablished = !0, this._pendingScale !== null) {
						let e = this._pendingScale;
						this._pendingScale = null, e !== this._scale && (this._scale = e, this._opts.onScaleChange?.(e));
					}
				} else return;
			}
			this._recomputeHeights(), this._syncSpacer(), this._mountVisible(e);
			for (let [e, t] of this._slots) t.renderedPage === e && t.renderedScale >= 0 && this._redrawSlotComments(e, t);
		}
	}
	_recomputeHeights() {
		let e = Math.min(this._presentedPageCount, this._doc.pageCount), t = Array(e);
		for (let n = 0; n < e; n++) t[n] = this._pageHeightPx(n);
		this._heights = t, this._scrollGeometry = we(t, this._gap(), this._pad());
	}
	_gap() {
		return this._opts.gap ?? 16;
	}
	_overscan() {
		return this._opts.overscan ?? 1;
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
	_pageIndexAtOffset(e, t) {
		let { offsets: n } = e, r = 0, i = n.length - 1, a = 0;
		for (; r <= i;) {
			let e = r + i >> 1;
			n[e] <= t ? (a = e, r = e + 1) : i = e - 1;
		}
		return a;
	}
	_range() {
		return w(this._scrollGeometry, this._scrollHost.scrollTop, this._scrollHost.clientHeight, this._overscan());
	}
	_syncSpacer() {
		let e = this._range();
		this._lastRange = e, this._spacer.style.height = `${e.totalHeight}px`, this._syncSpacerWidth();
	}
	_syncSpacerWidth() {
		let { left: e, right: t } = this._padH(), n = 0;
		for (let e = 0; e < this._heights.length; e++) {
			let t = this._pageWidthPx(e);
			t > n && (n = t);
		}
		let r = this._commentMarginExtent(), i = this._commentSide() === "left" ? r : 0, a = i - this._reviewOriginPx, o = Math.max(0, this._scrollHost.scrollLeft + a);
		this._spacer.style.width = `${n + r + e + t}px`, a !== 0 && (this._reviewOriginPx = i, this._scrollHost.style["--ooxml-review-origin-x"] = `${i}px`, this._scrollHost.scrollLeft = o);
	}
	_onScroll() {
		!this._doc || !this._scaleEstablished || this._mountVisible(void 0, !1);
	}
	_mountVisible(e, t = !0) {
		if (!this._doc || this._doc.pageCount === 0) return;
		let n = this._range();
		this._lastRange = n;
		for (let [e, t] of [...this._slots]) (e < n.start || e > n.end) && this._recycleSlot(e, t);
		for (let r = n.start; r <= n.end; r++) if (!this._slots.has(r)) {
			let t = this._acquireSlot();
			this._positionSlot(t, r, n), this._slots.set(r, t);
			let i = this._renderSlot(r, t, e === void 0);
			e && i && e.push(i);
		} else if (t) {
			let t = this._slots.get(r);
			this._positionSlot(t, r, n);
			let i = this._renderSlot(r, t, e === void 0);
			e && i && e.push(i);
		}
		this._emitVisiblePageChange(n);
	}
	_emitVisiblePageChange(e) {
		if (!this._doc) return;
		let t = this._doc.pageCount, n = this.layoutComplete;
		e.topIndex === this._lastTopIndex && t === this._lastReportedTotal && n === this._lastReportedLayoutComplete || (this._lastTopIndex = e.topIndex, this._lastReportedTotal = t, this._lastReportedLayoutComplete = n, this._opts.onVisiblePageChange?.(e.topIndex, t, n));
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
		let a = null, o = null, s = null;
		this._commentsEnabled() && (a = document.createElement("div"), a.style.cssText = "position:absolute;inset:0;overflow:hidden;pointer-events:none;", t.appendChild(a), this._commentsOptions()?.cards !== !1 && (o = document.createElement("div"), o.style.cssText = "position:absolute;top:0;height:100%;box-sizing:border-box;overflow-x:hidden;overflow-y:auto;pointer-events:auto;", this._syncCommentMarginGeometry(o), this._commentsOptions()?.connectors !== void 0 && (s = document.createElement("div"), s.style.cssText = "position:absolute;top:0;left:0;overflow:visible;pointer-events:none;", t.appendChild(s)), t.appendChild(o)));
		let c = oe(t, this._opts.enableElementSelection === !0);
		return this._scrollHost.appendChild(t), {
			wrapper: t,
			canvas: n,
			textLayer: r,
			highlightLayer: i,
			elementLayer: c,
			commentTintLayer: a,
			commentMargin: o,
			commentDecorationLayer: s,
			commentRuns: Object.freeze([]),
			commentGeometry: null,
			renderedPage: -1,
			renderedScale: -1,
			dispatcher: new S(n, this._mode === "worker")
		};
	}
	_recycleSlot(e, t) {
		this._slots.delete(e), t.dispatcher.destroy(), this._destroyed || (t.dispatcher = new S(t.canvas, this._mode === "worker")), t.textLayer && (t.textLayer.innerHTML = "", this._clearTextLayerPreview(t.textLayer)), t.highlightLayer.innerHTML = "", t.highlightLayer.style.transform = "", t.highlightLayer.style.transformOrigin = "", t.commentTintLayer && (t.commentTintLayer.replaceChildren(), t.commentTintLayer.style.transform = "", t.commentTintLayer.style.transformOrigin = "", t.commentTintLayer.style.visibility = ""), t.commentMargin && (this._commentUi?.disposeReadOnlyCommentMargin(t.commentMargin), this._commentUi || t.commentMargin.replaceChildren(), t.commentMargin.style.visibility = ""), t.commentDecorationLayer && (this._commentUi?.disposeReadOnlyCommentDecoration(t.commentDecorationLayer), this._commentUi || t.commentDecorationLayer.replaceChildren()), t.commentRuns = Object.freeze([]), t.commentGeometry = null, x(t.elementLayer, null), t.renderedPage = -1, t.renderedScale = -1, t.wrapper.remove(), this._free.push(t);
	}
	_positionSlot(e, t, n) {
		e.wrapper.style.top = `${n.offsets[t]}px`;
		let r = this._pageWidthPx(t), i = this._pageHeightPx(t);
		if (e.wrapper.style.width = `${r}px`, e.wrapper.style.height = `${i}px`, this._syncCommentMarginGeometry(e.commentMargin), e.commentDecorationLayer) {
			let t = this._commentMarginExtent();
			e.commentDecorationLayer.style.left = this._commentSide() === "left" ? `${-t}px` : "0px", e.commentDecorationLayer.style.width = `${r + t}px`, e.commentDecorationLayer.style.height = `${i}px`;
		}
		this._redrawElementOutlineForSlot(t, e);
		let { left: a } = this._padH(), o = Math.max(a, (this._scrollHost.clientWidth - r) / 2);
		e.wrapper.style.left = this._commentSide() === "left" && this._commentsEnabled() ? `calc(${o}px + var(--ooxml-review-origin-x, 0px))` : `${o}px`;
	}
	_dpr() {
		return this._opts.dpr ?? (typeof window < "u" && window.devicePixelRatio || 1);
	}
	_renderSlot(e, t, n = !0) {
		if (!this._doc || t.renderedPage === e) return null;
		t.renderedPage = e;
		let r = this._dpr(), i = this._pageWidthPx(e), a = this._renderEpoch, o = this._scale, s = t.dispatcher, c = s.begin();
		if (this._mode === "worker") return this._renderSlotBitmap(e, t, i, r, o, s, c, n);
		let l = [], u = !!this._opts.enableTextSelection && !!t.textLayer, d = u || this._findActive || !!t.commentTintLayer, f = d ? (e) => l.push(e) : void 0, p;
		try {
			p = $(this._doc, t.canvas, e, "main", {
				width: i,
				dpr: r,
				imageResources: this._opts.imageResources,
				defaultTextColor: this._opts.defaultTextColor,
				currentDate: this._currentDate,
				...this._showTrackedChanges ? { showTrackedChanges: !0 } : {},
				onTextRun: f
			});
		} catch (e) {
			return n ? (this._reportRenderError(e), Promise.resolve()) : Promise.reject(e);
		}
		return p.then(() => {
			if (!(!s.isCurrent(c) || a !== this._renderEpoch || this._slots.get(e) !== t || t.renderedPage !== e)) {
				if (t.renderedScale = o, u && t.textLayer) {
					let { width: n, height: r } = this._canvasCssPx(t.canvas);
					X(t.textLayer, l, n, r, this._hyperlinkHandler(), (e) => this._measureForFont(e), e);
				}
				d && this._refreshFindRuns(e, l), this._commitCommentRuns(e, t, l), this._redrawSlotHighlights(e, t);
			}
		}).catch((r) => {
			if (s.isCurrent(c) && a === this._renderEpoch && this._slots.get(e) === t && t.renderedPage === e) if (n) this._reportRenderError(r);
			else throw r;
		});
	}
	_hyperlinkHandler() {
		return this._opts.enableHyperlinks === !1 ? void 0 : this._opts.onHyperlinkClick || ((e) => {
			if (e.kind === "external") {
				a(e.url);
				return;
			}
			let t = this._doc;
			if (!t) return;
			let n = ++this._internalHyperlinkGeneration;
			this._navigateInternalHyperlink(t, e.ref, n).catch((e) => this._reportRenderError(e));
		});
	}
	async _navigateInternalHyperlink(e, t, n) {
		if (e.layoutComplete || await e.waitUntilLayoutComplete(), this._destroyed || this._doc !== e || n !== this._internalHyperlinkGeneration) return;
		let r = e.getBookmarkPage(t);
		r !== void 0 && this.scrollToPage(r);
	}
	_measureForFont(e) {
		this._measureCtx === void 0 && (this._measureCtx = document.createElement("canvas").getContext("2d"));
		let t = this._measureCtx;
		return !t || typeof t.measureText != "function" ? (e) => e.length : (t.font = e, (e) => t.measureText(e).width);
	}
	_canvasCssPx(e) {
		return {
			width: parseFloat(e.style.width) || e.width,
			height: parseFloat(e.style.height) || e.height
		};
	}
	_reportRenderError(e) {
		this._errorRouter.report(e);
	}
	async _renderSlotBitmap(e, t, n, r, i, a = t.dispatcher, o = a.begin(), s = !0) {
		if (this._bitmapInFlight.has(e) || this._slots.get(e) !== t) return;
		let c = this._renderEpoch, l = this._pageHeightPx(e);
		this._bitmapInFlight.add(e);
		let u = !1, d = !!this._opts.enableTextSelection && !!t.textLayer, f = d || this._findActive || !!t.commentTintLayer, p = [];
		try {
			let s = await $(this._doc, t.canvas, e, "worker", {
				width: n,
				dpr: r,
				imageResources: this._opts.imageResources,
				defaultTextColor: this._opts.defaultTextColor,
				currentDate: this._currentDate,
				...this._showTrackedChanges ? { showTrackedChanges: !0 } : {},
				onTextRun: f ? (e) => p.push(e) : void 0
			});
			if (!a.isCurrent(o) || c !== this._renderEpoch || this._slots.get(e) !== t || t.renderedPage !== e) {
				s.close();
				return;
			}
			if (!a.commitBitmap(o, s, {
				cssWidth: n,
				cssHeight: l
			})) return;
			if (t.renderedScale = i, t.textLayer && (this._clearTextLayerPreview(t.textLayer), d)) {
				let { width: n, height: r } = this._canvasCssPx(t.canvas);
				X(t.textLayer, p, n, r, this._hyperlinkHandler(), (e) => this._measureForFont(e), e);
			}
			f && this._refreshFindRuns(e, p), this._commitCommentRuns(e, t, p), this._redrawSlotHighlights(e, t), u = !0;
		} catch (n) {
			if (a.isCurrent(o) && c === this._renderEpoch && this._slots.get(e) === t && t.renderedPage === e) if (s) this._reportRenderError(n);
			else throw n;
		} finally {
			this._bitmapInFlight.delete(e);
			let n = this._slots.get(e);
			!u && n && (n !== t || c !== this._renderEpoch || !a.isCurrent(o)) && !this._bitmapInFlight.has(e) && !this._destroyed && this._renderSlotBitmap(e, n, this._pageWidthPx(e), this._dpr(), this._scale);
		}
	}
	setScale(e) {
		let t = this._effectiveZoomMin(), n = this._opts.zoomMax ?? 4, r = Math.min(n, Math.max(t, e)), i = this._pendingZoomAnchor;
		if (this._pendingZoomAnchor = null, !this._doc || this._doc.pageCount === 0 || !this._scaleEstablished) {
			this._pendingScale = r;
			return;
		}
		if (r === this._scale) return;
		let a = this._scale, o = i ? i.y : 0, s = this._range(), c = this._scrollHost.scrollTop, l = c + o, u = this._pageIndexAtOffset(s, l), d = this._heights[u] || 0, f = d > 0 ? (l - s.offsets[u]) / d : 0;
		f = Math.min(1, Math.max(0, f));
		let p = this._padH().left, m = this._scrollHost.scrollLeft || 0;
		this._renderEpoch++, this._scale = r, this._recomputeHeights();
		let h = w(this._scrollGeometry, 0, this._scrollHost.clientHeight, this._overscan());
		this._spacer.style.height = `${h.totalHeight}px`, this._syncSpacerWidth();
		let g = Math.max(0, h.totalHeight - this._scrollHost.clientHeight), _ = (h.offsets[u] ?? 0) + f * (this._heights[u] || 0), v = l < (s.offsets[0] ?? 0) ? c : _ - o;
		if (this._scrollHost.scrollTop = Math.min(g, Math.max(0, v)), i) {
			let e = Math.max(0, (this._spacer.offsetWidth || 0) - this._scrollHost.clientWidth);
			this._scrollHost.scrollLeft = b(m, i.x - p, a, r, { maxScroll: e });
		}
		this._previewVisible(), this._scheduleSettle(), this._opts.onScaleChange?.(r);
	}
	getScale() {
		return this._scaleEstablished ? this._scale : this._pendingScale ?? 1;
	}
	zoomIn() {
		this.setScale(fe(this.getScale()));
	}
	zoomOut() {
		this.setScale(he(this.getScale(), this._effectiveZoomMin()));
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
		if (!this._doc || this._doc.pageCount === 0) return;
		let t = this._doc.pageSize(0), n = v({
			contentWidth: (e === "width" ? this._widestPageWidthPt() : t.widthPt) * j,
			contentHeight: t.heightPt * j,
			containerWidth: this._fitWidthPx(),
			containerHeight: this._scrollHost.clientHeight
		}, e);
		n <= 0 || this.setScale(n);
	}
	_previewVisible() {
		if (!this._doc || this._doc.pageCount === 0) return;
		let e = this._range();
		this._lastRange = e;
		for (let [t, n] of [...this._slots]) (t < e.start || t > e.end) && this._recycleSlot(t, n);
		for (let t = e.start; t <= e.end; t++) {
			let n = this._slots.get(t);
			if (n) this._previewSlot(n, t, e);
			else {
				let n = this._acquireSlot();
				this._positionSlot(n, t, e), this._slots.set(t, n), this._renderSlot(t, n);
			}
		}
		this._emitVisiblePageChange(e);
	}
	_previewSlot(e, t, n) {
		if (this._positionSlot(e, t, n), e.canvas.style.width = `${this._pageWidthPx(t)}px`, e.canvas.style.height = `${this._pageHeightPx(t)}px`, e.renderedScale > 0) {
			let n = this._scale / e.renderedScale;
			e.textLayer && (e.textLayer.style.transformOrigin = "0 0", e.textLayer.style.width = `${this._pageWidthPx(t) / n}px`, e.textLayer.style.height = `${this._pageHeightPx(t) / n}px`, e.textLayer.style.transform = `scale(${n})`), e.commentMargin && this._commentUi?.previewReadOnlyCommentMargin(e.commentMargin, n);
			for (let t of e.commentTintLayer?.children ?? []) t.dataset.ooxmlCommentMarker !== void 0 && (t.style.transform = `translate(-50%,-50%) scale(${n})`);
			e.commentTintLayer && (e.commentTintLayer.style.visibility = ""), e.commentMargin && (e.commentMargin.style.visibility = ""), e.commentDecorationLayer && (e.commentDecorationLayer.style.visibility = "");
			return;
		}
		e.commentTintLayer && (e.commentTintLayer.style.visibility = "hidden"), e.commentMargin && (e.commentMargin.style.visibility = "hidden"), e.commentDecorationLayer && (e.commentDecorationLayer.style.visibility = "hidden");
	}
	_clearTextLayerPreview(e) {
		e.style.transform = "", e.style.transformOrigin = "", e.style.width = "100%", e.style.height = "100%";
	}
	_scheduleSettle() {
		this._settleTimer !== null && clearTimeout(this._settleTimer), this._settleTimer = setTimeout(() => {
			this._settleTimer = null, this._settleRender();
		}, en);
	}
	_settleRender() {
		if (!(this._destroyed || !this._doc || this._doc.pageCount === 0)) for (let [e, t] of [...this._slots]) t.renderedScale !== this._scale && this._refreshSlotAtomically(e, t);
	}
	_refreshSlotAtomically(e, t) {
		if (!this._doc) return;
		let n = this._dpr(), r = this._pageWidthPx(e), i = this._scale, a = this._renderEpoch;
		if (this._mode === "worker") {
			this._renderSlotBitmap(e, t, r, n, i);
			return;
		}
		let o = document.createElement("canvas");
		o.style.cssText = "display:block;background:#fff;", this._applyPageShadow(o);
		let s = new S(o, !1), c = s.begin(), l = [], u = !!this._opts.enableTextSelection && !!t.textLayer, d = u || this._findActive || !!t.commentTintLayer, f = d ? (e) => l.push(e) : void 0;
		$(this._doc, o, e, "main", {
			width: r,
			dpr: n,
			imageResources: this._opts.imageResources,
			defaultTextColor: this._opts.defaultTextColor,
			currentDate: this._currentDate,
			...this._showTrackedChanges ? { showTrackedChanges: !0 } : {},
			onTextRun: f
		}).then(() => {
			if (!s.isCurrent(c) || a !== this._renderEpoch || this._slots.get(e) !== t || t.renderedPage !== e) {
				s.destroy();
				return;
			}
			let n = t.canvas;
			if (t.dispatcher.destroy(), t.wrapper.insertBefore(o, n), n.remove(), t.canvas = o, t.dispatcher = s, t.renderedScale = i, t.textLayer && (this._clearTextLayerPreview(t.textLayer), u)) {
				let { width: n, height: r } = this._canvasCssPx(o);
				X(t.textLayer, l, n, r, this._hyperlinkHandler(), (e) => this._measureForFont(e), e);
			}
			d && this._refreshFindRuns(e, l), this._commitCommentRuns(e, t, l), this._redrawSlotHighlights(e, t);
		}).catch((n) => {
			s.isCurrent(c) && a === this._renderEpoch && this._slots.get(e) === t && t.renderedPage === e && this._reportRenderError(n), s.destroy();
		});
	}
	async setShowTrackedChanges(e) {
		let t = ++this._layoutViewGeneration, n = this._doc;
		if (this._showTrackedChanges === e) {
			n && await K(n, {
				showTrackedChanges: e,
				currentDate: this._currentDate
			}, this);
			return;
		}
		(!n || await K(n, {
			showTrackedChanges: e,
			currentDate: this._currentDate
		}, this)) && (this._destroyed || t !== this._layoutViewGeneration || n !== this._doc || (this._showTrackedChanges = e, this._find.invalidate(), this._applyLayoutPublication({
			pageCount: n?.pageCount ?? 0,
			exact: !0,
			complete: n?.layoutComplete !== !1
		})));
	}
	scrollToPage(e, t) {
		if (!this._doc || this._doc.pageCount === 0 || !this._scaleEstablished) return;
		let n = Math.max(0, Math.min(e, this._doc.pageCount - 1)), r = w(this._scrollGeometry, 0, this._scrollHost.clientHeight, this._overscan()), i = r.offsets[n] ?? 0, a = Math.max(0, r.totalHeight - this._scrollHost.clientHeight), o = Math.min(a, Math.max(0, i)), s = this._scrollHost;
		typeof s.scrollTo == "function" ? s.scrollTo({
			top: o,
			behavior: t?.behavior ?? "auto"
		}) : this._scrollHost.scrollTop = o, this._mountVisible();
	}
	_scrollToPageTarget(e, t, n) {
		let r = w(this._scrollGeometry, 0, this._scrollHost.clientHeight, this._overscan()), i = this._pageWidthPx(e), { left: a } = this._padH(), o = Math.max(a, (this._scrollHost.clientWidth - i) / 2) + this._reviewOriginPx, s = Math.max(0, r.totalHeight - this._scrollHost.clientHeight), c = this._spacer.offsetWidth || Number.parseFloat(this._spacer.style.width) || 0, l = Math.max(0, c - this._scrollHost.clientWidth), u = Math.min(s, Math.max(0, (r.offsets[e] ?? 0) + t.y + t.h / 2 - this._scrollHost.clientHeight / 2)), d = Math.min(l, Math.max(0, o + t.x + t.w / 2 - this._scrollHost.clientWidth / 2)), f = this._scrollHost;
		typeof f.scrollTo == "function" ? f.scrollTo({
			top: u,
			left: d,
			behavior: n?.behavior ?? "auto"
		}) : (this._scrollHost.scrollTop = u, this._scrollHost.scrollLeft = d), this._mountVisible();
	}
	_resetCommentNavigation() {
		this._commentNavigationGeneration++, this._commentPageById.clear(), this._commentRunsByPage.clear(), this._commentIndexedPages.clear(), this._commentScanFrontier = 0;
	}
	_advanceCommentScanFrontier() {
		for (; this._commentIndexedPages.has(this._commentScanFrontier);) this._commentScanFrontier++;
	}
	_indexCommentPages(e, t, n) {
		if (!this._commentIndexedPages.has(e)) {
			for (let r of n) this._commentPageById.has(r.commentId) || P(r, t).length > 0 && this._commentPageById.set(r.commentId, e);
			this._commentIndexedPages.add(e), this._advanceCommentScanFrontier();
		}
	}
	async _commentRunsForPage(e, t) {
		for (; !this._destroyed && this._doc === t;) {
			let n = this._scale, r = this._commentRunsByPage.get(e);
			(!r || r.scale !== n) && (r = {
				scale: n,
				runs: t.collectPageRuns(e, {
					width: this._pageWidthPx(e),
					currentDate: this._currentDate,
					...this._showTrackedChanges ? { showTrackedChanges: !0 } : {}
				})
			}, this._commentRunsByPage.set(e, r));
			try {
				let e = await r.runs;
				if (this._destroyed || this._doc !== t) return null;
				if (this._scale !== n) continue;
				return e;
			} catch (t) {
				throw this._commentRunsByPage.get(e) === r && this._commentRunsByPage.delete(e), t;
			}
		}
		return null;
	}
	async goToComment(e, t) {
		if (this._destroyed) throw Error("DocxScrollViewer is destroyed");
		let n = this._doc;
		if (!n || !n.comments.some((t) => t.id === e && t.parentId === void 0)) return !1;
		let r = ++this._commentNavigationGeneration, i = !n.layoutComplete, a = n.commentAnchorRanges().filter((t) => t.commentId === e), o = t?.pageIndex;
		if (o !== void 0 && (!Number.isInteger(o) || o < 0)) return !1;
		let s = o ?? this._commentPageById.get(e), c, l = async () => {
			let t = n.commentAnchorRanges();
			for (; s === void 0 && this._commentScanFrontier < n.pageCount;) {
				let i = this._commentScanFrontier, a = await this._commentRunsForPage(i, n);
				if (this._destroyed) throw Error("DocxScrollViewer is destroyed");
				if (this._doc !== n || r !== this._commentNavigationGeneration || !a) return;
				this._indexCommentPages(i, a, t), s = this._commentPageById.get(e);
			}
			return s;
		};
		if (o === void 0 && s === void 0 && a.length > 0 && await l(), i && (o !== void 0 && o >= n.pageCount || o === void 0 && s === void 0)) {
			if (await this._errorRouter.ownBackgroundLifecycle(() => n.waitUntilLayoutComplete()), this._destroyed) throw Error("DocxScrollViewer is destroyed");
			if (this._doc !== n || r !== this._commentNavigationGeneration) return !1;
			a = n.commentAnchorRanges().filter((t) => t.commentId === e), this._commentPageById.clear(), this._commentRunsByPage.clear(), this._commentIndexedPages.clear(), this._commentScanFrontier = 0, s = o, o === void 0 && a.length > 0 && await l();
		}
		if (a.length === 0 || o !== void 0 && o >= n.pageCount || s === void 0) return !1;
		let u = await this._commentRunsForPage(s, n);
		if (this._destroyed) throw Error("DocxScrollViewer is destroyed");
		if (this._doc !== n || r !== this._commentNavigationGeneration || !u || (c = a.flatMap((e) => P(e, u))[0], !c)) return !1;
		this._activeCommentId = e, this._activeCommentPage = s, this._elementContext = null, this._scrollToPageTarget(s, c, t);
		for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
		return this._emitSelectionContextChange(), !0;
	}
	async findText(e, t = {}) {
		if (!this._doc) return [];
		let n = ++this._findRequestGeneration;
		if (this._doc.layoutComplete === !1) {
			let e = this._doc;
			if (await this._errorRouter.ownBackgroundLifecycle(() => e.waitUntilLayoutComplete()), this._destroyed || this._doc !== e || n !== this._findRequestGeneration) return [];
		}
		this._findActive = e.length > 0;
		let r = await this._errorRouter.ownAwaitable(() => this._find.find(e, t));
		return this._redrawHighlights(), r;
	}
	async findNext() {
		return this._activateMatch(this._find.next());
	}
	async findPrev() {
		return this._activateMatch(this._find.prev());
	}
	clearFind() {
		this._findRequestGeneration++, this._findActive = !1, this._find.invalidate(), this._redrawHighlights();
	}
	async _activateMatch(e) {
		return e && this.scrollToPage(e.location.page), this._redrawHighlights(), e;
	}
	async _collectPageRuns(e) {
		return this._doc ? this._doc.collectPageRuns(e, {
			width: this._pageWidthPx(e),
			currentDate: this._currentDate,
			...this._showTrackedChanges ? { showTrackedChanges: !0 } : {}
		}) : [];
	}
	_redrawHighlights() {
		for (let [e, t] of this._slots) this._redrawSlotHighlights(e, t);
	}
	_refreshFindRuns(e, t) {
		this._findActive && this._find.setPageRuns(e, t);
	}
	_commitCommentRuns(e, t, n) {
		t.commentTintLayer && (t.commentRuns = Object.freeze([...n]), this._commentRunsByPage.set(e, {
			scale: this._scale,
			runs: Promise.resolve(t.commentRuns)
		}), this._doc && e === this._commentScanFrontier && this._indexCommentPages(e, t.commentRuns, this._doc.commentAnchorRanges()), t.commentTintLayer.style.transform = "", t.commentTintLayer.style.transformOrigin = "", this._redrawSlotComments(e, t), t.commentTintLayer.style.visibility = "", t.commentMargin && (t.commentMargin.style.visibility = ""), t.commentDecorationLayer && (t.commentDecorationLayer.style.visibility = ""));
	}
	_redrawSlotComments(e, t) {
		if (!this._doc || !t.commentTintLayer) return;
		this._syncCommentMarginGeometry(t.commentMargin);
		let n = this._commentUi;
		if (!n) {
			t.commentTintLayer.replaceChildren(), t.commentMargin?.replaceChildren(), t.commentDecorationLayer?.replaceChildren(), t.commentGeometry = null;
			return;
		}
		t.commentGeometry = n.buildDocxCommentMargin(t.commentTintLayer, t.commentMargin, t.commentRuns, {
			comments: this._doc.comments,
			anchors: this._doc.commentAnchorRanges()
		}, this._pageWidthPx(e), this._pageHeightPx(e), this._activeCommentId, (t, n) => {
			let r = n ? t : this._activeCommentId === t ? null : this._activeCommentId;
			if (r !== this._activeCommentId) {
				this._activeCommentId = r, this._activeCommentPage = r ? e : null, this._elementContext = null;
				for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
				this._emitSelectionContextChange();
			}
		}, this._commentZoom(), 280, this._commentsOptions()?.markers !== !1, this._commentsOptions()?.includeResolved === !0, t.commentDecorationLayer ? () => this._scheduleCommentGeometry(e, t, !1) : void 0, t.commentDecorationLayer ? () => this._scheduleCommentGeometry(e, t, !0) : void 0), this._redrawSlotCommentConnectors(e, t);
	}
	_redrawSlotCommentConnectors(e, t) {
		let n = t.commentDecorationLayer, r = t.commentMargin, i = t.commentGeometry, a = this._commentsOptions()?.connectors;
		if (!n || !r || !i || !a) return;
		let o = this._pageWidthPx(e), s = this._pageHeightPx(e), c = this._commentSide(), l = this._commentMarginExtent(), u = this._commentUi;
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
		let n = this._find.pageRuns(e);
		if (!n) {
			t.highlightLayer.innerHTML = "";
			return;
		}
		Z(t.highlightLayer, n, this._find.pageHighlights(e), this._pageWidthPx(e), this._pageHeightPx(e), (e) => this._measureForFont(e), this._opts.findHighlightColors);
	}
	_onResize() {
		if (!this._doc || this._doc.pageCount === 0) return;
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
	get topVisiblePage() {
		return this._lastRange?.topIndex ?? 0;
	}
	mountedPageIndicesForTest() {
		return [...this._slots.keys()];
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
		let t = this._range(), n = this._scrollHost.scrollTop + e, r = this._pageIndexAtOffset(t, n), i = this._heights[r] || 0;
		return {
			page: r,
			frac: i > 0 ? Math.min(1, Math.max(0, (n - t.offsets[r]) / i)) : 0
		};
	}
	viewportYOfForTest(e, t) {
		return (this._range().offsets[e] ?? 0) + t * (this._heights[e] || 0) - this._scrollHost.scrollTop;
	}
	async getResourceMetrics() {
		if (!this._doc) throw Error("Document not loaded");
		return await this._doc.getResourceMetrics();
	}
	getSelectionContext(e = {}) {
		if (this._destroyed) throw Error("DocxScrollViewer is destroyed");
		return (this._doc && this._activeCommentId !== null && this._activeCommentPage !== null ? qt(this._doc.comments, this._doc.commentAnchorRanges(), this._activeCommentId, this._activeCommentPage, e) : null) || ((this._opts.enableTextSelection ? Q(this._wrapper, this._wrapper.ownerDocument?.getSelection?.() ?? null, e) : null) ?? (this._elementContext ? Et(this._elementContext, e.maxTextCharacters) : null));
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
	_invalidateElementContext(e = !0) {
		this._elementHitGeneration++, this._elementContext = null, this._redrawElementOutlines(), e && this._emitSelectionContextChange();
	}
	_redrawElementOutlines() {
		for (let [e, t] of this._slots) this._redrawElementOutlineForSlot(e, t);
	}
	_redrawElementOutlineForSlot(e, t) {
		let n = this._elementContext, r = this._doc;
		if (!n || !r || n.pageIndex !== e) {
			x(t.elementLayer, null);
			return;
		}
		let i = r.pageSize(e);
		x(t.elementLayer, {
			x: n.bounds.xPt / i.widthPt,
			y: n.bounds.yPt / i.heightPt,
			width: n.bounds.widthPt / i.widthPt,
			height: n.bounds.heightPt / i.heightPt
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
		let t = this._doc;
		if (this._destroyed || !t) return null;
		if (this._opts.enableTextSelection && Q(this._wrapper, this._wrapper.ownerDocument?.getSelection?.() ?? null)) return this._emitSelectionContextChange(), this._destroyed ? null : this.getSelectionContext();
		if (!this._opts.enableElementSelection) return this.getSelectionContext();
		let n = e.target, r = [...this._slots].find(([, e]) => n !== null && e.wrapper.contains(n));
		if (!r) return this._invalidateElementContext(), null;
		let [i, a] = r, o = a.canvas.getBoundingClientRect();
		if (o.width <= 0 || o.height <= 0) return this._invalidateElementContext(), null;
		let s = e.clientX - o.left, c = e.clientY - o.top;
		if (s < 0 || c < 0 || s > o.width || c > o.height) return this._invalidateElementContext(), null;
		let l = ++this._elementHitGeneration, u = t.pageSize(i), d;
		try {
			d = await t.getElementContextAt(i, {
				xPt: s / o.width * u.widthPt,
				yPt: c / o.height * u.heightPt
			}, {
				currentDate: this._currentDate,
				...this._showTrackedChanges ? { showTrackedChanges: !0 } : {},
				maxTextCharacters: F
			});
		} catch (e) {
			if (this._destroyed || l !== this._elementHitGeneration || t !== this._doc) return null;
			throw e;
		}
		return this._destroyed || l !== this._elementHitGeneration || t !== this._doc ? null : (this._setElementContext(d), this._destroyed ? null : this.getSelectionContext());
	}
	destroy() {
		if (!this._destroyed) {
			this._destroyed = !0, this._findRequestGeneration++, this._errorRouter.close(), this._unbindLayoutDocument(), this._layoutViewGeneration++, this._resetCommentNavigation(), this._find.invalidate(), this._findActive = !1, this._selectionChangeListener &&= (this._wrapper.ownerDocument.removeEventListener("selectionchange", this._selectionChangeListener), null), this._elementHitGeneration++, this._elementClickListener &&= (this._scrollHost.removeEventListener("click", this._elementClickListener), null), this._contextMenuListener &&= (this._scrollHost.removeEventListener("contextmenu", this._contextMenuListener), null), this._commentOutsidePointerListener &&= (this._wrapper.ownerDocument.removeEventListener("pointerdown", this._commentOutsidePointerListener), null), this._commentGeometryFrame !== null && (this._wrapper.ownerDocument.defaultView?.cancelAnimationFrame?.(this._commentGeometryFrame), this._commentGeometryFrame = null), this._commentGeometryScheduled = !1, this._pendingCommentGeometry.clear(), this._elementContext = null, this._scrollListener &&= (this._scrollHost.removeEventListener("scroll", this._scrollListener), null), this._wheelListener &&= (this._scrollHost.removeEventListener("wheel", this._wheelListener), null), this._resizeObserver?.disconnect(), this._resizeObserver = null, this._settleTimer !== null && (clearTimeout(this._settleTimer), this._settleTimer = null);
			for (let [e, t] of [...this._slots]) this._recycleSlot(e, t);
			this._free.length = 0, this._documentOwner.close(), this._wrapper.remove();
		}
	}
};
//#endregion
//#region packages/docx/src/types.ts
function ln(e) {
	let t = [];
	for (let n of e.content) {
		if (n.type !== "paragraph") continue;
		let e = "";
		for (let t of n.runs) t.type === "text" && !t.noteRef && (e += t.text);
		e = e.trim(), e && t.push(e);
	}
	return t.join(" ");
}
//#endregion
//#region src/docx.ts
var un = /* @__PURE__ */ e({
	DocxDocument: () => J,
	DocxScrollViewer: () => cn,
	DocxViewer: () => $t,
	OoxmlDecodedImageLimitError: () => Ye,
	OoxmlError: () => l,
	OoxmlResourceLimitError: () => o,
	TiffDecodeError: () => Xe,
	autoResize: () => _,
	buildDocxHighlightLayer: () => Z,
	buildDocxTextLayer: () => X,
	isOoxmlDecodedImageLimitError: () => Je,
	isTiffDecodeError: () => Ze,
	noteText: () => ln,
	openExternalHyperlink: () => a,
	readDocxTextSelectionContext: () => Q,
	resolveCommentAnchorRuns: () => P,
	resolveDocxCommentThreads: () => tt,
	resolveRevisionAnchorRuns: () => Mt
});
//#endregion
export { Q as a, J as c, $t as i, Mt as l, ln as n, Z as o, cn as r, X as s, un as t };
