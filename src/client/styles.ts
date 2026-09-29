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
const STYLE_ID = 'dsh-plugin-archived-sessions-styles'

/** Class-name map mirroring the stylesheet's selectors. */
export const css = {
  badge: 'dsh-arch-badge',
  badgeCount: 'dsh-arch-badgeCount',
  badgeLabel: 'dsh-arch-badgeLabel',
  empty: 'dsh-arch-empty',
  emptyHint: 'dsh-arch-emptyHint',
  head: 'dsh-arch-head',
  headCount: 'dsh-arch-headCount',
  layer: 'dsh-arch-layer',
  list: 'dsh-arch-list',
  note: 'dsh-arch-note',
  panel: 'dsh-arch-panel',
  rail: 'dsh-arch-rail',
  row: 'dsh-arch-row',
  rowMeta: 'dsh-arch-rowMeta',
  rowTime: 'dsh-arch-rowTime',
  rowTitle: 'dsh-arch-rowTitle',
  rowWorkspace: 'dsh-arch-rowWorkspace',
  search: 'dsh-arch-search',
  searchRow: 'dsh-arch-searchRow',
  title: 'dsh-arch-title',
  // Transcript viewer (the read-only reader this plugin opens on row click).
  loadOlder: 'dsh-arch-loadOlder',
  node: 'dsh-arch-node',
  nodeAssistant: 'dsh-arch-nodeAssistant',
  nodeBody: 'dsh-arch-nodeBody',
  nodeContext: 'dsh-arch-nodeContext',
  nodeHead: 'dsh-arch-nodeHead',
  nodeReasoning: 'dsh-arch-nodeReasoning',
  nodeRole: 'dsh-arch-nodeRole',
  nodeTime: 'dsh-arch-nodeTime',
  nodeTool: 'dsh-arch-nodeTool',
  nodeUser: 'dsh-arch-nodeUser',
  reader: 'dsh-arch-reader',
  readerBody: 'dsh-arch-readerBody',
  readerClose: 'dsh-arch-readerClose',
  readerHead: 'dsh-arch-readerHead',
  readerMask: 'dsh-arch-readerMask',
  readerMeta: 'dsh-arch-readerMeta',
  readerTitle: 'dsh-arch-readerTitle',
  retry: 'dsh-arch-retry',
  transcript: 'dsh-arch-transcript',
  transcriptState: 'dsh-arch-transcriptState',
} as const

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
   left/bottom offsets are measured from the trigger before paint.
   Do not use --dsw-specific-menu here: on web that token is a 45–58%
   glass fill for MenuSurface-backed menus. A 60vh list over the session
   tree then either bleeds titles (no filter) or reads as a dim sheet
   (with the shared backdrop filter). An opaque layer fill keeps the
   original card readable. */
.dsh-arch-panel {
  position: fixed;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: 380px;
  max-width: calc(100vw - 24px);
  max-height: 60vh;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  box-shadow: var(--dsw-elevation-panel);
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
  border: 0;
  border-radius: 14px;
  background: var(--dsw-alias-bg-layer-1);
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  box-shadow: var(--dsw-elevation-prominent);
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
`

/**
 * Inject the stylesheet once and remove it when the plugin unloads.
 * @returns a disposer detaching the style element.
 */
export function installStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  const existing = document.getElementById(STYLE_ID)
  if (existing !== null) return () => {}
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = SHEET
  document.head.append(style)
  return () => { style.remove() }
}
