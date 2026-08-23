/**
 * Sidebar-foot action listing every archived session, with click-to-open.
 *
 * Data comes entirely from two standard props the `sidebar.footer.action`
 * slot already supplies: `useWorkspaces` carries the registry-global
 * `archivedSessionIds`, and `useSessions` carries the unfiltered session
 * list (the store keeps every row; the sidebar's own derivation is what
 * hides archived ones). Joining them locally reconstructs exactly the rows
 * the browser is refusing to draw — no new Host call, no extra wire traffic.
 */
import { useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  IconArchiveOutline20, Tooltip, useAnchoredPosition, useDismissOnOutsidePointer,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { ArchivedPanelFace } from './face.ts'
import { css } from './styles.ts'

/** Full panel props composed by the sidebar footer-action slot. */
export type ArchivedSessionsPanelProps =
  PropsRuntime<'sidebar.footer.action'>
  & InjectFace<ArchivedPanelFace>
  & PropsLocale<'archived-sessions'>

/** Distance between the trigger and the panel, and from each viewport edge. */
const PANEL_GAP = 8
const PANEL_MARGIN = 12

/** One archived row projected for display. */
interface ArchivedRow {
  id: SessionId
  title: string
  workspace: string
  updatedAt: number
  /** The archive set names it, but the session list no longer carries it. */
  missing: boolean
}

/**
 * Directory display label: basename of the path (both separators accepted).
 * @param cwd - directory path, when the summary carries one.
 * @returns the basename, the raw path when it has none, or an empty label.
 */
function workspaceLabel(cwd: string | undefined): string {
  if (cwd === undefined || cwd === '') return ''
  const base = cwd.replace(/[/\\]+$/, '').split(/[/\\]/).pop()
  return base !== undefined && base !== '' ? base : cwd
}

/**
 * Compact absolute date for an archived row (archives are browsed by "when",
 * and a relative label goes stale while the panel stays open).
 * @param at - epoch milliseconds.
 * @returns a short localized date, or an empty string when unknown.
 */
function shortDate(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return ''
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ArchivedSessionsPanel({
  wide, useSessions, useWorkspaces, openSession, t,
}: ArchivedSessionsPanelProps) {
  const archivedSessionIds = useWorkspaces(state => state.archivedSessionIds)
  const byId = useSessions(state => state.byId)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useDismissOnOutsidePointer(rootRef, open, setOpen)
  const position = useAnchoredPosition({
    open, anchorRef: triggerRef, panelRef, gap: PANEL_GAP, margin: PANEL_MARGIN,
  })

  // Archive order is insertion order (oldest archived first); newest activity
  // first is the useful reading order for a drawer.
  const rows = useMemo<ArchivedRow[]>(() => {
    const projected = archivedSessionIds.map((id) => {
      const summary = byId[id]
      return {
        id,
        title: summary?.displayTitle ?? summary?.title ?? t('untitled'),
        workspace: workspaceLabel(summary?.cwd),
        updatedAt: summary?.updatedAt ?? 0,
        missing: summary === undefined,
      }
    })
    projected.sort((a, b) => (b.updatedAt - a.updatedAt) || (a.id < b.id ? -1 : 1))
    return projected
  }, [archivedSessionIds, byId, t])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return rows
    return rows.filter(row =>
      row.title.toLowerCase().includes(q) || row.workspace.toLowerCase().includes(q))
  }, [rows, query])

  const label = t('nav')
  const total = rows.length

  // A row the session list no longer carries cannot be opened: `sessions.open`
  // fails loud on an unknown id, so the row stays visible but inert.
  const onRowClick = (row: ArchivedRow): void => {
    if (row.missing) return
    openSession(row.id)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={wide ? css.layer : `${css.layer} ${css.rail}`}>
      <Tooltip label={label} side="right" disabled={wide}>
        <button
          ref={triggerRef}
          type="button"
          className={css.badge}
          aria-label={label}
          aria-expanded={open}
          {...open ? { 'data-active': '' } : {}}
          onClick={() => { setOpen(!open) }}
        >
          <IconArchiveOutline20 size={wide ? 16 : 18} />
          {wide ? <span className={css.badgeLabel}>{label}</span> : null}
          {wide && total > 0 ? <span className={css.badgeCount}>{total}</span> : null}
        </button>
      </Tooltip>

      {open ? (
        <div
          ref={panelRef}
          className={css.panel}
          style={position ?? ({ visibility: 'hidden' } as CSSProperties)}
          role="dialog"
          aria-label={t('title')}
        >
          <div className={css.head}>
            <span className={css.title}>{t('title')}</span>
            {total > 0 ? <span className={css.headCount}>{total}</span> : null}
          </div>

          {total > 0 ? (
            <div className={css.searchRow}>
              <input
                className={css.search}
                type="search"
                value={query}
                placeholder={t('search')}
                aria-label={t('search')}
                onChange={(event) => { setQuery(event.target.value) }}
              />
            </div>
          ) : null}

          <div className={css.list}>
            {total === 0 ? (
              <div className={css.empty}>
                <div>{t('empty')}</div>
                <div className={css.emptyHint}>{t('emptyHint')}</div>
              </div>
            ) : visible.length === 0 ? (
              <div className={css.empty}>{t('noMatch')}</div>
            ) : (
              visible.map(row => (
                <button
                  key={row.id}
                  type="button"
                  className={css.row}
                  disabled={row.missing}
                  title={row.missing ? t('missing') : t('open')}
                  onClick={() => { onRowClick(row) }}
                >
                  <span className={css.rowTitle}>{row.title}</span>
                  <span className={css.rowMeta}>
                    <span className={css.rowWorkspace}>{row.workspace}</span>
                    <span className={css.rowTime}>{shortDate(row.updatedAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>

          {total > 0 ? <div className={css.note}>{t('note')}</div> : null}
        </div>
      ) : null}
    </div>
  )
}
