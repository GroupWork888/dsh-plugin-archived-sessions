/**
 * Browser half: registers one `sidebar.footer.action` entry that opens a
 * panel listing every archived session, each row opening a read-only
 * transcript of that session's log.
 *
 * Why this works as a plain plugin, with no Host or core changes:
 *
 * - `workspace.list` ships `archivedSessionIds` to the client as ordinary
 *   data, and the session list itself is never filtered — the store "carries
 *   every row" and the sidebar's own derivation is what hides archived ones
 *   at render time. So the rows are already in the browser.
 * - `sidebar.footer.action` is a `list` slot and supplies both `useSessions`
 *   and `useWorkspaces` as standard props, which is exactly the pair this
 *   panel needs to reconstruct those rows.
 * - `session.history` reads a session log from persistence and explicitly
 *   "never resumes or publishes an Agent", so a viewer can page an archived
 *   transcript without waking anything up.
 *
 * Why the transcript is plugin-owned rather than the shell's chat view:
 * `WorkspaceRuntime.project()` clears any current selection contained in
 * `archivedSessionIds`, and it runs on every sessions-store notification —
 * so `sessions.open()` on an archived row is undone before paint. Rendering
 * the log in this plugin's own overlay is the only way to show an archived
 * session without patching the core sweep. (An earlier revision of this
 * plugin called `sessions.open()` and appeared to do nothing when clicked;
 * that is the bug this design fixes.)
 *
 * This plugin is strictly read-only: it never calls `archiveSession`, never
 * changes the current session, and never writes Host state. Restoring a
 * session to the sidebar would require an `unarchiveSession` RPC that does
 * not exist upstream (the registry only ever appends, its `setState` is
 * private, and the workspace storage domain is exclusively held).
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the slot registry's Context merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls in the SlotMap merge declaring `sidebar.footer.action`.
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
// Type-only: pulls in the Context merge providing `ctx.locale`.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls in the GlobalStandardProps merge for useSessions.
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
// Type-only: pulls in the GlobalStandardProps merge for useWorkspaces.
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { ArchivedSessionsPanel } from './ArchivedSessionsPanel.tsx'
import type { ArchivedPanelFace } from './face.ts'
import type { HistoryConnection } from './history.ts'
import { en, NS, zh } from './locales.ts'
import { installStyles } from './styles.ts'

/**
 * Required client services. `connection` carries the wire client; the
 * sessions service is no longer needed, because this plugin deliberately
 * never changes the current session.
 */
export const inject = ['slots', 'connection', 'locale']

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
    // `connection` is published by the client connection plugin but declares
    // no Context merge, so it is read through `get` like the core runtime
    // does. Resolved per render pass, not captured at mount, so a rebuilt
    // handle is picked up.
    inject: (): ArchivedPanelFace => ({
      connection: ctx.get('connection') as unknown as HistoryConnection,
    }),
  }, ArchivedSessionsPanel))
}

export default { name: 'archived-sessions', inject, apply }
