window.__ModuleLoader__.load({ id: "dsh-plugin-archived-sessions", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
Object.defineProperty(exports, '__esModule', { value: true });
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react = require("react");
react = __toESM(react);
let __deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
__deepseek_ai_dsh_client_ui_primitives = __toESM(__deepseek_ai_dsh_client_ui_primitives);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region src/client/history.ts
/**
* Messages per page. Deliberately smaller than the shell's own 60-message
* window: history pages return every raw event, and `assistant/chunk`
* dominates a real log by roughly 20:1 (one measured tool-heavy session:
* 6,239 events per 60-message page, 5,917 of them chunks). This viewer folds
* chunks away, so those bytes are transferred only to be discarded.
*
* Measured against that session: 60 messages = 1.7 MB for 109 nodes, while
* 30 = 0.84 MB for 50 nodes. Loopback hides the difference, but DSH web is
* routinely reached over Tailscale, where the smaller first page is the
* difference between an instant reader and a visible stall. Paging older is
* one click, so the smaller page costs little.
*/
const PAGE_MESSAGES = 30;
/** Text parts of a content array, joined; non-text parts are ignored. */
function textOf(content, want) {
	if (!Array.isArray(content)) return "";
	const parts = [];
	for (const part of content) {
		if (part === null || typeof part !== "object") continue;
		const { type, text } = part;
		if (type === want && typeof text === "string") parts.push(text);
	}
	return parts.join("");
}
/**
* Whether a `user/message` event is a real human prompt. The same event type
* also carries synthetic injections (workspace instructions, skill catalogs,
* runtime-context snapshots); `source.kind` is what tells them apart, and a
* transcript that showed them inline would bury the conversation.
*/
function isHumanPrompt(data) {
	if (data === null || typeof data !== "object") return false;
	const { source } = data;
	if (source === null || typeof source !== "object") return false;
	return source.kind === "user";
}
/**
* Fold raw session events into displayable transcript nodes.
*
* Only the conversation-bearing event types are projected. Stream chunks are
* skipped on purpose: `assistant/chunk` replays the same text token by token
* that `assistant/message` already carries assembled, so including both would
* duplicate every reply.
* @param events - raw events in ascending seq order.
* @returns nodes in the same order.
*/
function foldTranscript(events) {
	const nodes = [];
	for (const event of events) {
		const { seq, time, type, data } = event;
		if (type === "user/message") {
			const text = textOf(data?.content, "text");
			if (text === "") continue;
			nodes.push({
				seq,
				time,
				kind: isHumanPrompt(data) ? "user" : "context",
				text
			});
			continue;
		}
		if (type === "assistant/message") {
			const content = data?.message?.content;
			const reasoning = textOf(content, "reasoning");
			if (reasoning !== "") nodes.push({
				seq,
				time,
				kind: "reasoning",
				text: reasoning
			});
			const text = textOf(content, "text");
			if (text !== "") nodes.push({
				seq: seq + .5,
				time,
				kind: "assistant",
				text
			});
			continue;
		}
		if (type === "tool/call") {
			const name = data?.name;
			nodes.push({
				seq,
				time,
				kind: "tool",
				text: "",
				tool: typeof name === "string" ? name : "tool"
			});
		}
	}
	return nodes;
}
/**
* Convert one wire history page into the reader's projection.
* @param records - raw events and packed chunk runs.
* @param hasMore - whether an older page exists.
* @param throughSeq - stable inclusive cut for subsequent pages.
* @returns the folded page.
*/
function transcriptPage(records, hasMore, throughSeq) {
	const events = records.filter((record) => record.type === "event").map((record) => record.event);
	return {
		nodes: foldTranscript(events),
		hasMore,
		throughSeq,
		firstSeq: events[0]?.seq
	};
}
/**
* Open an archived session's current transcript window.
* @param remote - generated Session Remote namespace.
* @param sessionId - archived session to read.
* @returns the folded page.
* @throws when the stream closes without its required opening snapshot.
*/
async function loadTranscriptTail(remote, sessionId) {
	const controller = new AbortController();
	try {
		for await (const frame of remote.follow({
			address: {
				kind: "session",
				sessionId
			},
			maxMessages: PAGE_MESSAGES
		}, controller.signal)) {
			if (frame.type !== "snapshot") throw new Error("session.follow did not begin with a snapshot");
			return transcriptPage(frame.records, frame.hasMore, frame.cursor);
		}
		throw new Error("session.follow closed before its opening snapshot");
	} finally {
		controller.abort();
	}
}
/**
* Load one older transcript page against the opening snapshot's stable cut.
* @param remote - generated Session Remote namespace.
* @param sessionId - archived session to read.
* @param throughSeq - inclusive cut returned by the opening snapshot.
* @param beforeSeq - page backwards from this sequence.
* @returns the folded page.
* @throws when the Remote reports a business or carrier error.
*/
async function loadOlderTranscript(remote, sessionId, throughSeq, beforeSeq) {
	const result = await remote.page({
		address: {
			kind: "session",
			sessionId
		},
		throughSeq,
		beforeSeq,
		maxMessages: PAGE_MESSAGES
	});
	if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
	return transcriptPage(result.value.records, result.value.hasMore, throughSeq);
}

//#endregion
//#region src/client/styles.ts
/**
* Panel styles as one plugin-owned stylesheet.
*
* A prefixed global sheet is used instead of CSS Modules so this plugin
* builds with plain tsdown and no bespoke CSS pipeline — which keeps it
* forkable by anyone who wants to adapt it. Every selector is namespaced
* `dsh-arch-*`, and all colours come from the shell's `--dsw-*` design
* tokens so the panel follows the active theme.
*/
/** Element id of the injected <style>, so mounting twice cannot duplicate it. */
const STYLE_ID = "dsh-plugin-archived-sessions-styles";
/** Class-name map mirroring the stylesheet's selectors. */
const css = {
	badge: "dsh-arch-badge",
	badgeCount: "dsh-arch-badgeCount",
	badgeLabel: "dsh-arch-badgeLabel",
	empty: "dsh-arch-empty",
	emptyHint: "dsh-arch-emptyHint",
	head: "dsh-arch-head",
	headCount: "dsh-arch-headCount",
	layer: "dsh-arch-layer",
	list: "dsh-arch-list",
	note: "dsh-arch-note",
	panel: "dsh-arch-panel",
	rail: "dsh-arch-rail",
	row: "dsh-arch-row",
	rowMeta: "dsh-arch-rowMeta",
	rowTime: "dsh-arch-rowTime",
	rowTitle: "dsh-arch-rowTitle",
	rowWorkspace: "dsh-arch-rowWorkspace",
	search: "dsh-arch-search",
	searchRow: "dsh-arch-searchRow",
	title: "dsh-arch-title",
	loadOlder: "dsh-arch-loadOlder",
	node: "dsh-arch-node",
	nodeAssistant: "dsh-arch-nodeAssistant",
	nodeBody: "dsh-arch-nodeBody",
	nodeContext: "dsh-arch-nodeContext",
	nodeHead: "dsh-arch-nodeHead",
	nodeReasoning: "dsh-arch-nodeReasoning",
	nodeRole: "dsh-arch-nodeRole",
	nodeTime: "dsh-arch-nodeTime",
	nodeTool: "dsh-arch-nodeTool",
	nodeUser: "dsh-arch-nodeUser",
	reader: "dsh-arch-reader",
	readerBody: "dsh-arch-readerBody",
	readerClose: "dsh-arch-readerClose",
	readerHead: "dsh-arch-readerHead",
	readerMask: "dsh-arch-readerMask",
	readerMeta: "dsh-arch-readerMeta",
	readerTitle: "dsh-arch-readerTitle",
	retry: "dsh-arch-retry",
	transcript: "dsh-arch-transcript",
	transcriptState: "dsh-arch-transcriptState"
};
const SHEET = `/* Sidebar-foot archived-sessions action and the fixed list it opens above
   the footer. Geometry and tokens follow the shipped footer-action surface
   so the entry sits naturally beside Settings in both sidebar widths. */

.dsh-arch-layer {
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  width: 100%;
  height: 42px;
  margin: 8px 0 0;
}

.dsh-arch-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: calc(100% + 4px);
  height: 42px;
  margin: 0 -2px;
  padding: 0 10px 0 8px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  overflow: hidden;
}

.dsh-arch-badge:hover,
.dsh-arch-badge[data-active] {
  background: var(--dsw-alias-interactive-bg-hover);
}

.dsh-arch-badgeLabel {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-arch-badgeCount {
  flex: none;
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}

.dsh-arch-layer.dsh-arch-rail {
  width: 36px;
  height: 36px;
  margin: 0;
}

.dsh-arch-rail .dsh-arch-badge {
  justify-content: center;
  gap: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
}

/* Fixed so the sidebar's overflow clip cannot cut the surface; the
   left/bottom offsets are measured from the trigger before paint. */
.dsh-arch-panel {
  position: fixed;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: 380px;
  max-width: calc(100vw - 24px);
  max-height: 60vh;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-inverted);
  border-radius: 12px;
  background: var(--dsw-specific-menu);
  box-shadow: var(--dsw-shadow-lv3);
}

.dsh-arch-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 8px;
}

.dsh-arch-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}

.dsh-arch-headCount {
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.dsh-arch-searchRow {
  flex: none;
  padding: 0 12px 8px;
}

.dsh-arch-search {
  width: 100%;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-inverted);
  border-radius: 8px;
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 13px;
  outline: none;
}

.dsh-arch-search::placeholder {
  color: var(--dsw-alias-label-tertiary);
}

.dsh-arch-search:focus {
  border-color: var(--dsw-alias-label-tertiary);
}

.dsh-arch-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.dsh-arch-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.dsh-arch-row:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}

.dsh-arch-row:disabled {
  cursor: default;
  opacity: 0.55;
}

.dsh-arch-row:disabled:hover {
  background: transparent;
}

.dsh-arch-rowTitle {
  font-size: 13px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-arch-rowMeta {
  display: flex;
  gap: 6px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 15px;
}

.dsh-arch-rowWorkspace {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-arch-rowTime {
  flex: none;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.dsh-arch-empty {
  padding: 16px 12px 20px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 17px;
  text-align: center;
}

.dsh-arch-emptyHint {
  margin-top: 4px;
  font-size: 11px;
}

.dsh-arch-note {
  flex: none;
  padding: 8px 12px 10px;
  border-top: 1px solid var(--dsw-alias-border-inverted);
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 15px;
}

/* ---- Read-only transcript reader ----------------------------------------
   A plugin-owned overlay rather than the shell's conversation view: the core
   projection sweep clears any archived session made current, so an archived
   transcript can only be shown somewhere the sweep does not reach. */

.dsh-arch-readerMask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(0 0 0 / 45%);
}

.dsh-arch-reader {
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
  height: min(78vh, 100%);
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-inverted);
  border-radius: 14px;
  background: var(--dsw-specific-menu);
  box-shadow: var(--dsw-shadow-lv3);
}

.dsh-arch-readerHead {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--dsw-alias-border-inverted);
}

.dsh-arch-readerTitle {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  font-weight: 600;
}

.dsh-arch-readerMeta {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

.dsh-arch-readerClose {
  flex: none;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}

.dsh-arch-readerClose:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}

.dsh-arch-readerBody {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.dsh-arch-transcript {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}

.dsh-arch-transcriptState {
  padding: 32px 16px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  text-align: center;
}

.dsh-arch-retry,
.dsh-arch-loadOlder {
  align-self: center;
  margin-top: 10px;
  padding: 6px 14px;
  border: 1px solid var(--dsw-alias-border-inverted);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.dsh-arch-retry:hover,
.dsh-arch-loadOlder:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}

.dsh-arch-loadOlder:disabled {
  cursor: default;
  opacity: 0.55;
}

.dsh-arch-node {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 10px;
  border-left: 2px solid transparent;
}

.dsh-arch-nodeHead {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.dsh-arch-nodeRole {
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.dsh-arch-nodeTime {
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

/* Transcripts are plain text here (no markdown pipeline in this plugin), so
   the source's own line breaks are the only structure worth preserving. */
.dsh-arch-nodeBody {
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.dsh-arch-nodeUser {
  border-left-color: var(--dsw-alias-label-primary);
}

.dsh-arch-nodeAssistant {
  border-left-color: var(--dsw-alias-border-inverted);
}

.dsh-arch-nodeReasoning {
  border-left-color: var(--dsw-alias-border-inverted);
}

.dsh-arch-nodeReasoning .dsh-arch-nodeBody {
  color: var(--dsw-alias-label-tertiary);
  font-style: italic;
}

.dsh-arch-nodeContext .dsh-arch-nodeBody {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  /* Injected context can be enormous (whole instruction files); cap it so one
     snapshot cannot push the whole conversation off the screen. */
  max-height: 120px;
  overflow: hidden;
}

.dsh-arch-nodeTool .dsh-arch-nodeRole {
  color: var(--dsw-alias-label-tertiary);
  font-weight: 500;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: none;
}
`;
/**
* Inject the stylesheet once and remove it when the plugin unloads.
* @returns a disposer detaching the style element.
*/
function installStyles() {
	if (typeof document === "undefined") return () => {};
	if (document.getElementById(STYLE_ID) !== null) return () => {};
	const style = document.createElement("style");
	style.id = STYLE_ID;
	style.textContent = SHEET;
	document.head.append(style);
	return () => {
		style.remove();
	};
}

//#endregion
//#region src/client/TranscriptView.tsx
/** Clock time for a transcript node. */
function nodeTime(at) {
	if (!Number.isFinite(at) || at <= 0) return "";
	return new Date(at).toLocaleTimeString(void 0, {
		hour: "numeric",
		minute: "2-digit"
	});
}
/** Role label class for one node kind. */
const KIND_CLASS = {
	user: css.nodeUser,
	assistant: css.nodeAssistant,
	reasoning: css.nodeReasoning,
	tool: css.nodeTool,
	context: css.nodeContext
};
function TranscriptView({ sessionId, history, t }) {
	const [nodes, setNodes] = (0, react.useState)([]);
	const [phase, setPhase] = (0, react.useState)("loading");
	const [hasMore, setHasMore] = (0, react.useState)(false);
	const [loadingOlder, setLoadingOlder] = (0, react.useState)(false);
	const firstSeq = (0, react.useRef)(void 0);
	const throughSeq = (0, react.useRef)(void 0);
	const generation = (0, react.useRef)(0);
	const loadTail = (0, react.useCallback)(() => {
		const mine = ++generation.current;
		setPhase("loading");
		setNodes([]);
		firstSeq.current = void 0;
		throughSeq.current = void 0;
		loadTranscriptTail(history, sessionId).then((page) => {
			if (generation.current !== mine) return;
			setNodes(page.nodes);
			setHasMore(page.hasMore);
			firstSeq.current = page.firstSeq;
			throughSeq.current = page.throughSeq;
			setPhase("ready");
		}, (reason) => {
			if (generation.current !== mine) return;
			console.warn("[archived-sessions] history failed:", reason);
			setPhase("error");
		});
	}, [history, sessionId]);
	(0, react.useEffect)(() => {
		loadTail();
	}, [loadTail]);
	const onLoadOlder = () => {
		const cursor = firstSeq.current;
		const cut = throughSeq.current;
		if (cursor === void 0 || cut === void 0 || loadingOlder) return;
		const mine = generation.current;
		setLoadingOlder(true);
		loadOlderTranscript(history, sessionId, cut, cursor).then((page) => {
			if (generation.current !== mine) return;
			setNodes((previous) => [...page.nodes, ...previous]);
			setHasMore(page.hasMore);
			if (page.firstSeq !== void 0) firstSeq.current = page.firstSeq;
			setLoadingOlder(false);
		}, (reason) => {
			if (generation.current !== mine) return;
			console.warn("[archived-sessions] loadOlder failed:", reason);
			setLoadingOlder(false);
		});
	};
	if (phase === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: css.transcriptState,
		children: t("loading")
	});
	if (phase === "error") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: css.transcriptState,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("loadError") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			type: "button",
			className: css.retry,
			onClick: loadTail,
			children: t("retry")
		})]
	});
	if (nodes.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: css.transcriptState,
		children: t("transcriptEmpty")
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: css.transcript,
		children: [hasMore ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			type: "button",
			className: css.loadOlder,
			disabled: loadingOlder,
			onClick: onLoadOlder,
			children: loadingOlder ? t("loading") : t("loadOlder")
		}) : null, nodes.map((node) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: `${css.node} ${KIND_CLASS[node.kind]}`,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.nodeHead,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: css.nodeRole,
					children: node.kind === "tool" ? `${t("toolCall")} ${node.tool ?? ""}`.trim() : node.kind === "context" ? t("contextNote") : node.kind === "reasoning" ? t("reasoningNote") : node.kind
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: css.nodeTime,
					children: nodeTime(node.time)
				})]
			}), node.kind === "tool" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: css.nodeBody,
				children: node.text
			})]
		}, node.seq))]
	});
}

//#endregion
//#region src/client/ArchivedSessionsPanel.tsx
/** Distance between the trigger and the panel, and from each viewport edge. */
const PANEL_GAP = 8;
const PANEL_MARGIN = 12;
/**
* Directory display label: basename of the path (both separators accepted).
* @param cwd - directory path, when the summary carries one.
* @returns the basename, the raw path when it has none, or an empty label.
*/
function workspaceLabel(cwd) {
	if (cwd === void 0 || cwd === "") return "";
	const base = cwd.replace(/[/\\]+$/, "").split(/[/\\]/).pop();
	return base !== void 0 && base !== "" ? base : cwd;
}
/**
* Compact absolute date for an archived row (archives are browsed by "when",
* and a relative label goes stale while the panel stays open).
* @param at - epoch milliseconds.
* @returns a short localized date, or an empty string when unknown.
*/
function shortDate(at) {
	if (!Number.isFinite(at) || at <= 0) return "";
	return new Date(at).toLocaleDateString(void 0, {
		month: "short",
		day: "numeric"
	});
}
function ArchivedSessionsPanel({ wide, useSessions, useWorkspaces, history, t }) {
	const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
	const byId = useSessions((state) => state.byId);
	const [open, setOpen] = (0, react.useState)(false);
	const [reading, setReading] = (0, react.useState)(null);
	const [query, setQuery] = (0, react.useState)("");
	const rootRef = (0, react.useRef)(null);
	const triggerRef = (0, react.useRef)(null);
	const panelRef = (0, react.useRef)(null);
	(0, __deepseek_ai_dsh_client_ui_primitives.useDismissOnOutsidePointer)(rootRef, open, setOpen);
	const position = (0, __deepseek_ai_dsh_client_ui_primitives.useAnchoredPosition)({
		open,
		anchorRef: triggerRef,
		panelRef,
		gap: PANEL_GAP,
		margin: PANEL_MARGIN
	});
	const rows = (0, react.useMemo)(() => {
		const projected = archivedSessionIds.map((id) => {
			const summary = byId[id];
			return {
				id,
				title: summary?.displayTitle ?? summary?.title ?? t("untitled"),
				workspace: workspaceLabel(summary?.cwd),
				updatedAt: summary?.updatedAt ?? 0,
				missing: summary === void 0
			};
		});
		projected.sort((a, b) => b.updatedAt - a.updatedAt || (a.id < b.id ? -1 : 1));
		return projected;
	}, [
		archivedSessionIds,
		byId,
		t
	]);
	const visible = (0, react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (q === "") return rows;
		return rows.filter((row) => row.title.toLowerCase().includes(q) || row.workspace.toLowerCase().includes(q));
	}, [rows, query]);
	const label = t("nav");
	const total = rows.length;
	const onRowClick = (row) => {
		if (row.missing) return;
		setReading(row);
		setOpen(false);
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: wide ? css.layer : `${css.layer} ${css.rail}`,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label,
				side: "right",
				disabled: wide,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					ref: triggerRef,
					type: "button",
					className: css.badge,
					"aria-label": label,
					"aria-expanded": open,
					...open ? { "data-active": "" } : {},
					onClick: () => {
						setOpen(!open);
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: wide ? 16 : 18 }),
						wide ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: css.badgeLabel,
							children: label
						}) : null,
						wide && total > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: css.badgeCount,
							children: total
						}) : null
					]
				})
			}),
			open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: panelRef,
				className: css.panel,
				style: position ?? { visibility: "hidden" },
				role: "dialog",
				"aria-label": t("title"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.head,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: css.title,
							children: t("title")
						}), total > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: css.headCount,
							children: total
						}) : null]
					}),
					total > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.searchRow,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: css.search,
							type: "search",
							value: query,
							placeholder: t("search"),
							"aria-label": t("search"),
							onChange: (event) => {
								setQuery(event.target.value);
							}
						})
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.list,
						children: total === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.empty,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("empty") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: css.emptyHint,
								children: t("emptyHint")
							})]
						}) : visible.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.empty,
							children: t("noMatch")
						}) : visible.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: css.row,
							disabled: row.missing,
							title: row.missing ? t("missing") : t("read"),
							onClick: () => {
								onRowClick(row);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.rowTitle,
								children: row.title
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: css.rowMeta,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.rowWorkspace,
									children: row.workspace
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: css.rowTime,
									children: shortDate(row.updatedAt)
								})]
							})]
						}, row.id))
					}),
					total > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.note,
						children: t("note")
					}) : null
				]
			}) : null,
			reading !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: css.readerMask,
				role: "presentation",
				onClick: (event) => {
					if (event.target === event.currentTarget) setReading(null);
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: css.reader,
					role: "dialog",
					"aria-modal": "true",
					"aria-label": reading.title,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.readerHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.readerTitle,
								children: reading.title
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.readerMeta,
								children: t("readOnly")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: css.readerClose,
								"aria-label": t("close"),
								onClick: () => {
									setReading(null);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, { size: 14 })
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.readerBody,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TranscriptView, {
							sessionId: reading.id,
							history,
							t
						})
					})]
				})
			}) : null
		]
	});
}

//#endregion
//#region src/client/locales.ts
/** Copy for the archived-sessions panel. */
/** Locale namespace owned by this plugin. */
const NS = "archived-sessions";
/** English strings (the key-set source of truth for this pair). */
const en = {
	nav: "Archived",
	title: "Archived sessions",
	count: "{n} archived",
	empty: "No archived sessions.",
	emptyHint: "Archiving a session from the sidebar hides it here.",
	search: "Search archived sessions",
	noMatch: "No archived session matches that search.",
	open: "Open",
	close: "Close",
	untitled: "Untitled session",
	missing: "This session is archived but is no longer in the session list.",
	note: "Read-only. Opening a session here does not restore it to the sidebar or let you continue it.",
	read: "Read transcript",
	loading: "Loading…",
	loadError: "Could not read this session log.",
	retry: "Try again",
	loadOlder: "Load earlier messages",
	transcriptEmpty: "This session has no messages.",
	toolCall: "called",
	contextNote: "Injected context",
	reasoningNote: "Reasoning",
	readOnly: "Read-only"
};
/** Chinese strings (same key set as {@link en}). */
const zh = {
	nav: "已归档",
	title: "已归档会话",
	count: "{n} 个已归档",
	empty: "没有已归档的会话。",
	emptyHint: "从侧边栏归档会话后会显示在这里。",
	search: "搜索已归档会话",
	noMatch: "没有匹配的已归档会话。",
	open: "打开",
	close: "关闭",
	untitled: "未命名会话",
	missing: "该会话已归档，但已不在会话列表中。",
	note: "只读。在此打开会话不会将其恢复到侧边栏，也无法继续对话。",
	read: "查看记录",
	loading: "加载中…",
	loadError: "无法读取该会话日志。",
	retry: "重试",
	loadOlder: "加载更早的消息",
	transcriptEmpty: "该会话没有消息。",
	toolCall: "调用了",
	contextNote: "注入的上下文",
	reasoningNote: "推理过程",
	readOnly: "只读"
};

//#endregion
//#region src/client/index.ts
/**
* Required client services. The sessions object layer is not needed because
* this plugin deliberately never changes the current session.
*/
const inject = [
	"slots",
	"remote",
	"remote.session",
	"locale"
];
/**
* Mount the archived-sessions footer action.
* @param ctx - client root context.
*/
function apply(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		en,
		zh
	}), "archived-sessions: dictionaries");
	ctx.effect(() => installStyles(), "archived-sessions: styles");
	ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
		name: "sidebar.footer.action",
		id: "archived-sessions",
		order: 50,
		locale: NS,
		label: () => ctx.locale.bind(NS)("nav"),
		inject: () => ({ history: ctx.remote.session })
	}, ArchivedSessionsPanel));
}
var client_default = {
	name: "archived-sessions",
	inject,
	apply
};

//#endregion
exports.apply = apply;
exports.default = client_default;
exports.inject = inject;
return module.exports; } });
//# sourceMappingURL=client.js.map