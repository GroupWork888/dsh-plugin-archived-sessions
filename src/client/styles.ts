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
