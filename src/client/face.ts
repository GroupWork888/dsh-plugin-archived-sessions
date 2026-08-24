/** The registrant's business face handed to the panel component. */
import type { HistoryConnection } from './history.ts'

/**
 * Injected share for the archived-sessions panel.
 *
 * Just the wire handle: this plugin reads Host-published list state through
 * standard props and reads session logs through `session.history`. It holds
 * no session-mutating verb at all — notably not `sessions.open`, which
 * cannot show an archived session (the core projection sweep reverts the
 * selection; see `history.ts`).
 */
export interface ArchivedPanelFace {
  /** The `connection` service, carrying the `session.history` RPC. */
  connection: HistoryConnection
}
