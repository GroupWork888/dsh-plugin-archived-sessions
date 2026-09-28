/** Browser entry for an archived-session list and read-only transcript overlay.
 * Reads the workspace archive set and Session history without unarchiving,
 * selecting, or prompting a Session. DSH's built-in archive controls remain available.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: supplies ctx.remote and the generated namespace assembly.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: supplies the generated Session Remote namespace declarations.
import type {} from '@deepseek-ai/dsh-api-session-controller/remote'
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
import { en, NS, zh } from './locales.ts'
import { installStyles } from './styles.ts'

/**
 * Required client services. The sessions object layer is not needed because
 * this plugin deliberately never changes the current session.
 */
export const inject = ['slots', 'remote', 'remote.session', 'locale']

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
      history: ctx.remote.session,
    }),
  }, ArchivedSessionsPanel))
}

export default { name: 'archived-sessions', inject, apply }
