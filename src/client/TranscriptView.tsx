/**
 * Read-only transcript for one archived session, rendered inside the
 * plugin's own modal rather than the shell's conversation view.
 *
 * See `history.ts` for why the main view cannot host an archived session:
 * the core projection sweep clears any archived current selection, so this
 * plugin renders the log itself instead of fighting that rule.
 *
 * This is deliberately a *viewer*: plain text, no markdown rendering, no
 * tool cards, no input. Those live in the shell's conversation packages and
 * reproducing them here would mean vendoring surfaces this plugin does not
 * own — and an archived session has nothing to send to anyway.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TranscriptNode } from './history.ts'
import { loadTranscript, type HistoryConnection } from './history.ts'
import { css } from './styles.ts'

/** Copy accessor supplied by the panel (already bound to this namespace). */
type Translate = (key: 'loading' | 'loadError' | 'retry' | 'loadOlder'
  | 'transcriptEmpty' | 'toolCall' | 'contextNote' | 'reasoningNote' | 'close') => string

export interface TranscriptViewProps {
  /** Archived session to read. */
  sessionId: string
  /** Resolved connection service carrying the `session.history` RPC. */
  connection: HistoryConnection
  /** Bound copy accessor. */
  t: Translate
}

/** Clock time for a transcript node. */
function nodeTime(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return ''
  return new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** Role label class for one node kind. */
const KIND_CLASS: Record<TranscriptNode['kind'], string> = {
  user: css.nodeUser,
  assistant: css.nodeAssistant,
  reasoning: css.nodeReasoning,
  tool: css.nodeTool,
  context: css.nodeContext,
}

export function TranscriptView({ sessionId, connection, t }: TranscriptViewProps) {
  const [nodes, setNodes] = useState<TranscriptNode[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const firstSeq = useRef<number | undefined>(undefined)
  // Guards against a resolved page from a previous session landing after the
  // viewer already moved to another row.
  const generation = useRef(0)

  const loadTail = useCallback(() => {
    const mine = ++generation.current
    setPhase('loading')
    setNodes([])
    firstSeq.current = undefined
    loadTranscript(connection, sessionId).then(
      (page) => {
        if (generation.current !== mine) return
        setNodes(page.nodes)
        setHasMore(page.hasMore)
        firstSeq.current = page.firstSeq
        setPhase('ready')
      },
      (reason: unknown) => {
        if (generation.current !== mine) return
        console.warn('[archived-sessions] history failed:', reason)
        setPhase('error')
      },
    )
  }, [connection, sessionId])

  useEffect(() => { loadTail() }, [loadTail])

  const onLoadOlder = (): void => {
    const cursor = firstSeq.current
    if (cursor === undefined || loadingOlder) return
    const mine = generation.current
    setLoadingOlder(true)
    loadTranscript(connection, sessionId, cursor).then(
      (page) => {
        if (generation.current !== mine) return
        setNodes(previous => [...page.nodes, ...previous])
        setHasMore(page.hasMore)
        // An empty older page must not re-arm the same cursor forever.
        if (page.firstSeq !== undefined) firstSeq.current = page.firstSeq
        setLoadingOlder(false)
      },
      (reason: unknown) => {
        if (generation.current !== mine) return
        console.warn('[archived-sessions] loadOlder failed:', reason)
        setLoadingOlder(false)
      },
    )
  }

  if (phase === 'loading') {
    return <div className={css.transcriptState}>{t('loading')}</div>
  }

  if (phase === 'error') {
    return (
      <div className={css.transcriptState}>
        <div>{t('loadError')}</div>
        <button type="button" className={css.retry} onClick={loadTail}>{t('retry')}</button>
      </div>
    )
  }

  if (nodes.length === 0) {
    return <div className={css.transcriptState}>{t('transcriptEmpty')}</div>
  }

  return (
    <div className={css.transcript}>
      {hasMore ? (
        <button
          type="button"
          className={css.loadOlder}
          disabled={loadingOlder}
          onClick={onLoadOlder}
        >
          {loadingOlder ? t('loading') : t('loadOlder')}
        </button>
      ) : null}

      {nodes.map(node => (
        <div key={node.seq} className={`${css.node} ${KIND_CLASS[node.kind]}`}>
          <div className={css.nodeHead}>
            <span className={css.nodeRole}>
              {node.kind === 'tool'
                ? `${t('toolCall')} ${node.tool ?? ''}`.trim()
                : node.kind === 'context'
                  ? t('contextNote')
                  : node.kind === 'reasoning'
                    ? t('reasoningNote')
                    : node.kind}
            </span>
            <span className={css.nodeTime}>{nodeTime(node.time)}</span>
          </div>
          {node.kind === 'tool' ? null : <div className={css.nodeBody}>{node.text}</div>}
        </div>
      ))}
    </div>
  )
}
