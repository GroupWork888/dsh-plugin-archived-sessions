/** Cold-safe history reads and plain-text transcript projection for archived Sessions.
 * The Session Remote reads durable history without resuming an Agent.
 */

import type { ClientRemote, SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type {
  SessionHistoryRecord, SessionPage, SessionFollowFrame,
} from '@deepseek-ai/dsh-api-session-controller/types'

/** One history page entry: the raw persisted event (the `view` slot is unused here). */
export interface HistoryEvent {
  seq: number
  time: number
  type: string
  data?: unknown
}

/** Generated Session Remote namespace used for cold-safe history reads. */
export type HistoryRemote = ClientRemote['session']

/** Messages requested per page; older history is loaded on demand. */
export const PAGE_MESSAGES = 30

/** A rendered transcript line. */
export interface TranscriptNode {
  /** Stable key: the source event's seq. */
  seq: number
  kind: 'user' | 'assistant' | 'reasoning' | 'tool' | 'context'
  /** Display text; empty for tool nodes, which carry `tool` instead. */
  text: string
  /** Tool name, for `kind === 'tool'`. */
  tool?: string
  /** Epoch ms of the source event. */
  time: number
}

/** One page of transcript plus the backwards-pagination cursor. */
export interface TranscriptPage {
  nodes: TranscriptNode[]
  hasMore: boolean
  /** Inclusive log cut held stable while older pages are loaded. */
  throughSeq: number
  /** Seq of the page's first event — the `beforeSeq` for the next older page. */
  firstSeq: number | undefined
}

/** Text parts of a content array, joined; non-text parts are ignored. */
function textOf(content: unknown, want: string): string {
  if (!Array.isArray(content)) return ''
  const parts: string[] = []
  for (const part of content) {
    if (part === null || typeof part !== 'object') continue
    const { type, text } = part as { type?: unknown, text?: unknown }
    if (type === want && typeof text === 'string') parts.push(text)
  }
  return parts.join('')
}

/**
 * Whether a `user/message` event is a real human prompt. The same event type
 * also carries synthetic injections (workspace instructions, skill catalogs,
 * runtime-context snapshots); `source.kind` is what tells them apart, and a
 * transcript that showed them inline would bury the conversation.
 */
function isHumanPrompt(data: unknown): boolean {
  if (data === null || typeof data !== 'object') return false
  const { source } = data as { source?: unknown }
  if (source === null || typeof source !== 'object') return false
  return (source as { kind?: unknown }).kind === 'user'
}

/**
 * Fold raw session events into displayable transcript nodes.
 *
 * Only the conversation-bearing event types are projected. Stream chunks are
 * skipped on purpose: `assistant/chunk` replays the same text token by token
 * that `assistant/message` already carries assembled, so including both would
 * duplicate every reply.
 * @param events - raw events in ascending seq order.
 * @returns nodes in the same order.
 */
export function foldTranscript(events: readonly HistoryEvent[]): TranscriptNode[] {
  const nodes: TranscriptNode[] = []
  for (const event of events) {
    const { seq, time, type, data } = event
    if (type === 'user/message') {
      const text = textOf((data as { content?: unknown } | undefined)?.content, 'text')
      if (text === '') continue
      nodes.push({ seq, time, kind: isHumanPrompt(data) ? 'user' : 'context', text })
      continue
    }
    if (type === 'assistant/message') {
      const content = (data as { message?: { content?: unknown } } | undefined)?.message?.content
      const reasoning = textOf(content, 'reasoning')
      if (reasoning !== '') nodes.push({ seq, time, kind: 'reasoning', text: reasoning })
      const text = textOf(content, 'text')
      if (text !== '') nodes.push({ seq: seq + 0.5, time, kind: 'assistant', text })
      continue
    }
    if (type === 'tool/call') {
      const name = (data as { name?: unknown } | undefined)?.name
      nodes.push({ seq, time, kind: 'tool', text: '', tool: typeof name === 'string' ? name : 'tool' })
    }
  }
  return nodes
}

/**
 * Convert one wire history page into the reader's projection.
 * @param records - raw events and packed chunk runs.
 * @param hasMore - whether an older page exists.
 * @param throughSeq - stable inclusive cut for subsequent pages.
 * @returns the folded page.
 */
function transcriptPage(
  records: readonly SessionHistoryRecord[],
  hasMore: boolean,
  throughSeq: number,
): TranscriptPage {
  const events = records
    .filter(record => record.type === 'event')
    .map(record => record.event as HistoryEvent)
  return {
    nodes: foldTranscript(events),
    hasMore,
    throughSeq,
    firstSeq: events[0]?.seq,
  }
}

/**
 * Open an archived session's current transcript window.
 * @param remote - generated Session Remote namespace.
 * @param sessionId - archived session to read.
 * @returns the folded page.
 * @throws when the stream closes without its required opening snapshot.
 */
export async function loadTranscriptTail(
  remote: HistoryRemote,
  sessionId: SessionId,
): Promise<TranscriptPage> {
  const controller = new AbortController()
  try {
    for await (const frame of remote.follow({
      address: { kind: 'session', sessionId },
      maxMessages: PAGE_MESSAGES,
    }, controller.signal)) {
      if (frame.type !== 'snapshot') {
        throw new Error('session.follow did not begin with a snapshot')
      }
      return transcriptPage(frame.records, frame.hasMore, frame.cursor)
    }
    throw new Error('session.follow closed before its opening snapshot')
  } finally {
    controller.abort()
  }
}

/**
 * Load one older transcript page against the opening snapshot's stable cut.
 * @param remote - generated Session Remote namespace.
 * @param sessionId - archived session to read.
 * @param throughSeq - inclusive cut returned by the opening snapshot.
 * @param beforeSeq - page backwards from this sequence.
 * @returns the folded page.
 * @throws when the Remote reports a business or carrier error.
 */
export async function loadOlderTranscript(
  remote: HistoryRemote,
  sessionId: SessionId,
  throughSeq: number,
  beforeSeq: number,
): Promise<TranscriptPage> {
  const result = await remote.page({
    address: { kind: 'session', sessionId },
    throughSeq,
    beforeSeq,
    maxMessages: PAGE_MESSAGES,
  })
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  return transcriptPage(
    (result.value as SessionPage).records,
    (result.value as SessionPage).hasMore,
    throughSeq,
  )
}
