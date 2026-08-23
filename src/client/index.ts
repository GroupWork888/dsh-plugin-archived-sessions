/**
 * Browser half: registers one `sidebar.footer.action` entry that opens a
 * panel listing every archived session, with click-to-open.
 *
 * Why this works as a plain plugin, with no Host or core changes:
 *
 * - `workspace.list` ships `archivedSessionIds` to the client as ordinary
 *   data, and the session list itself is never filtered — the store "carries
 *   every row" and the sidebar's own derivation is what hides archived ones
 *   at render time. So the rows are already in the browser.
 * - `sessions.open(id)` is `manager.select(id)`; it does not consult the
 *   archive set, so an archived session opens like any other.
 * - `sidebar.footer.action` is a `list` slot and supplies both `useSessions`
 *   and `useWorkspaces` as standard props, which is exactly the pair this
 *   panel needs.
 *
 * This plugin is strictly read-only: it never calls `archiveSession` and
 * never writes Host state. Restoring a session to the sidebar would require
 * an `unarchiveSession` RPC that does not exist upstream (the registry only
 * ever appends, its `setState` is private, and the workspace storage domain
 * is exclusively held), so this panel is a viewer by design rather than by
 * omission.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls in the SlotMap merge declaring `sidebar.footer.action`.
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
// Type-only: pulls in the Context merge providing `ctx.locale`.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { ArchivedSessionsPanel } from './ArchivedSessionsPanel.tsx'
import type { ArchivedPanelFace } from './face.ts'
import { en, NS, zh } from './locales.ts'
import { installStyles } from './styles.ts'

/** Required client services: the slot registry, the sessions domain, and locale. */
export const inject = ['slots', 'sessions', 'locale']

/**
 * Mount the archived-sessions footer action.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // The multi-locale overload registers the pair atomically, so a namespace
  // conflict cannot leave one locale installed without the other.
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'archived-sessions: dictionaries')
  ctx.effect(() => installStyles(), 'archived-sessions: styles')

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'archived-sessions',
    order: 50,
    locale: NS,
    label: () => ctx.locale.bind(NS)('nav'),
    inject: (): ArchivedPanelFace => ({
      // Opening an archived session is the one action this panel performs.
      // `open` fails loud on an id the list does not carry, so the panel
      // only ever calls it for rows it resolved from the store.
      openSession: (sessionId) => { ctx.sessions.open(sessionId) },
    }),
  }, ArchivedSessionsPanel))
}

export default { name: 'archived-sessions', inject, apply }
