/** The registrant's business face handed to the panel component. */
import type { HistoryRemote } from './history.ts'

/**
 * Injected share for the archived-sessions panel.
 *
 * Just the wire handle: this plugin reads Host-published list state through
 * standard props and reads session logs through `session.follow` and
 * `session.page`. It holds
 * no session-mutating verb at all — notably not `sessions.open`, which
 * cannot show an archived session (the core projection sweep reverts the
 * selection; see `history.ts`).
 */
export interface ArchivedPanelFace {
  /** The generated read-only Session Remote namespace. */
  history: HistoryRemote
}
