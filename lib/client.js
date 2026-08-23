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
	title: "dsh-arch-title"
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
function ArchivedSessionsPanel({ wide, useSessions, useWorkspaces, openSession, t }) {
	const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
	const byId = useSessions((state) => state.byId);
	const [open, setOpen] = (0, react.useState)(false);
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
		openSession(row.id);
		setOpen(false);
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: wide ? css.layer : `${css.layer} ${css.rail}`,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.Tooltip, {
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
		}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
						title: row.missing ? t("missing") : t("open"),
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
		}) : null]
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
	note: "Opening an archived session does not restore it to the sidebar."
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
	note: "打开已归档会话不会将其恢复到侧边栏。"
};

//#endregion
//#region src/client/index.ts
/** Required client services: the slot registry, the sessions domain, and locale. */
const inject = [
	"slots",
	"sessions",
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
		inject: () => ({ openSession: (sessionId) => {
			ctx.sessions.open(sessionId);
		} })
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