/** The registrant's business face handed to the panel component. */
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'

/**
 * Injected share for the archived-sessions panel. Deliberately one action:
 * this plugin reads Host-published state and opens sessions, nothing else.
 */
export interface ArchivedPanelFace {
  /**
   * Select an archived session as current.
   * @param sessionId - a session id resolved from the list store.
   */
  openSession: (sessionId: SessionId) => void
}
