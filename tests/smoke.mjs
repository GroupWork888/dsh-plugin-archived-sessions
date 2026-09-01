/**
 * Smoke test for the BUILT artifact (not the sources): loads lib/client.js
 * the way the DSH web shell does — via a fake __ModuleLoader__ whose require
 * answers exactly the shared module table — then drives the registered slot
 * component in jsdom.
 *
 * This checks the parts a typecheck cannot: that the bundle registers under
 * the right id, requests only modules the loader can answer, registers into
 * `sidebar.footer.action`, lists archived rows, and — the regression this
 * suite exists for — renders a transcript READ-ONLY without ever touching
 * the shell's current session.
 *
 * Why that last assertion matters: the first version of this plugin called
 * `sessions.open(id)` on row click. That call succeeds, but
 * `WorkspaceRuntime.project()` clears any current selection contained in
 * `archivedSessionIds`, and it runs on every sessions-store notification —
 * so the selection was reverted before paint and clicking a row visibly did
 * nothing. A test that only asserted "openSession was called" passed anyway.
 * The `sessionsTouched` guard below is the falsifiable form of that bug: the
 * fake context fails loud if the plugin reaches for any session-mutating
 * verb at all.
 *
 * Run: node tests/smoke.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import React from 'react'
import { createRoot } from 'react-dom/client'

/** React 18.3+ exposes act on the React namespace. */
const { act } = React

const here = dirname(fileURLToPath(import.meta.url))
const bundlePath = resolve(here, '../lib/client.js')

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://127.0.0.1:3080/',
  pretendToBeVisual: true,
})
globalThis.window = dom.window
globalThis.document = dom.window.document
// navigator is a getter-only global on modern Node; define it instead.
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator, configurable: true, writable: true,
})
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Node = dom.window.Node
globalThis.getComputedStyle = dom.window.getComputedStyle
globalThis.IS_REACT_ACT_ENVIRONMENT = true

/** Minimal stand-ins for the primitives the panel actually uses. */
const primitives = {
  IconArchiveOutline20: ({ size }) => React.createElement('svg', { 'data-icon': 'archive', width: size }),
  IconCloseOutline16: ({ size }) => React.createElement('svg', { 'data-icon': 'close', width: size }),
  Tooltip: ({ children }) => children,
  useAnchoredPosition: () => ({ left: 0, top: 0 }),
  useDismissOnOutsidePointer: () => {},
}

const moduleTable = {
  react: React,
  'react/jsx-runtime': await import('react/jsx-runtime'),
  '@deepseek-ai/dsh-client-ui-primitives': primitives,
}

let registered
window.__ModuleLoader__ = {
  load({ id, factory }) {
    const require = (specifier) => {
      const mod = moduleTable[specifier]
      // The real loader throws on an unanswerable specifier; mirroring that
      // is the point — it catches a bundle that inlined the wrong thing.
      if (mod === undefined) throw new Error(`module table cannot answer "${specifier}"`)
      return mod
    }
    registered = { id, exports: factory(require) }
  },
}

// Execute the built bundle exactly as a <script> would.
new dom.window.Function(readFileSync(bundlePath, 'utf8'))()

assert.equal(registered.id, 'dsh-plugin-archived-sessions', 'registers under its package id')
const plugin = registered.exports
assert.deepEqual(plugin.inject, ['slots', 'remote', 'remote.session', 'locale'],
  'declares its service edges')

// --- fake client context -------------------------------------------------
/** Raw events shaped exactly like a real archived session log. */
const LOG = [
  { seq: 7, time: 1000, type: 'user/message', data: {
    content: [{ type: 'text', text: 'is there a good way to view archived sessions' }],
    source: { kind: 'user', rpcId: 'r1' },
  } },
  { seq: 8, time: 1100, type: 'user/message', data: {
    content: [{ type: 'text', text: '<system-reminder>workspace instructions</system-reminder>' }],
    source: { kind: 'agent-instructions', form: 'instructions' },
  } },
  { seq: 9, time: 1200, type: 'assistant/message', data: { message: { content: [
    { type: 'reasoning', text: 'The question is ambiguous.' },
    { type: 'text', text: 'Let me check what DSH ships.' },
  ] } } },
  // Chunks must be skipped: they replay the same text token by token.
  { seq: 10, time: 1250, type: 'assistant/chunk', data: { chunk: { text: 'Let me' } } },
  { seq: 11, time: 1300, type: 'tool/call', data: { name: 'bash', callId: 'c1', arguments: '{}' } },
]

const historyCalls = []
const remote = {
  session: {
    follow: (payload) => {
      historyCalls.push({ method: 'follow', payload })
      return (async function * () {
        yield {
          type: 'snapshot',
          cursor: 11,
          records: [
            ...LOG.map(event => ({ type: 'event', event })),
            // Packed chunk runs are lossless transport records but do not
            // belong in the assembled transcript.
            { type: 'chunks', event: {
              type: 'chunkrow/assistant-text', seq: 10, time: 1250, data: {},
            } },
          ],
          hasMore: true,
        }
      })()
    },
    page: (payload) => {
      historyCalls.push({ method: 'page', payload })
      return Promise.resolve({ ok: true, value: {
        records: [{ type: 'event', event: {
          seq: 3, time: 500, type: 'user/message', data: {
            content: [{ type: 'text', text: 'earlier question' }],
            source: { kind: 'user' },
          },
        } }],
        hasMore: false,
      } })
    },
  },
}

const localeRegistrations = []
let slotEntry
/** Any read of a session-mutating service is a regression; fail loud. */
let sessionsTouched = false
const ctx = {
  effect: (fn) => { fn() },
  get: (name) => {
    if (name === 'sessions') { sessionsTouched = true; return {} }
    return undefined
  },
  remote,
  locale: {
    register: (ns, dicts) => { localeRegistrations.push([ns, Object.keys(dicts)]); return () => {} },
    bind: () => (key) => key,
  },
  // If the plugin ever reaches for session mutation again, these trip.
  get sessions() {
    sessionsTouched = true
    return { open: () => { throw new Error('the plugin must not open sessions') } }
  },
  slots: {
    inject: (_name, fn) => { const it = fn(); if (it?.next) while (!it.next().done); },
    register: (options, component) => { slotEntry = { options, component }; return () => {} },
  },
}

plugin.apply(ctx)

assert.equal(localeRegistrations.length, 1, 'registers one locale namespace')
assert.deepEqual(localeRegistrations[0], ['archived-sessions', ['en', 'zh']], 'registers both locales atomically')
assert.equal(slotEntry.options.name, 'sidebar.footer.action', 'fills the footer-action slot')
assert.equal(slotEntry.options.id, 'archived-sessions', 'uses a fresh entry id (does not replace a shipped cell)')

// --- render with a realistic store shape --------------------------------
const archivedSessionIds = ['session-a', 'session-b', 'session-ghost']
const byId = {
  'session-a': { id: 'session-a', displayTitle: 'Older work', cwd: '/Users/me/Projects', updatedAt: 1000 },
  'session-b': { id: 'session-b', displayTitle: 'Newer work', cwd: '/Users/me/.dsh', updatedAt: 5000 },
  // 'session-ghost' intentionally absent: archived but no longer listed.
}
const face = slotEntry.options.inject()
const props = {
  wide: true,
  useSessions: (select) => select({ ids: Object.keys(byId), byId, current: undefined }),
  useWorkspaces: (select) => select({ archivedSessionIds }),
  t: (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key),
  ...face,
}

const container = document.getElementById('root')
const root = createRoot(container)
act(() => { root.render(React.createElement(slotEntry.component, props)) })

const trigger = container.querySelector('button')
assert.ok(trigger, 'renders a trigger button')
assert.match(trigger.textContent, /3/, 'trigger shows the archived count')

act(() => { trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })

const dialog = container.querySelector('[role="dialog"]')
assert.ok(dialog, 'opens the panel')

const rows = [...dialog.querySelectorAll('button')]
assert.equal(rows.length, 3, 'lists every archived session')
assert.match(rows[0].textContent, /Newer work/, 'sorts newest activity first')
assert.match(rows[1].textContent, /Older work/, 'then older')
const ghost = rows[2]
assert.ok(ghost.disabled, 'a row missing from the session list is inert')

// --- clicking a row opens the read-only transcript -----------------------
await act(async () => {
  rows[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
})

assert.deepEqual(
  historyCalls,
  [{ method: 'follow', payload: {
    address: { kind: 'session', sessionId: 'session-b' }, maxMessages: 30,
  } }],
  'opens that session log through session.follow (not sessions.open)',
)

const reader = document.querySelector('[aria-modal="true"]')
assert.ok(reader, 'opens the transcript reader')
const body = reader.textContent

assert.match(body, /is there a good way to view archived sessions/, 'renders the human prompt')
assert.match(body, /Let me check what DSH ships/, 'renders the assistant reply')
assert.match(body, /The question is ambiguous/, 'renders reasoning')
assert.match(body, /bash/, 'names the tool that was called')
assert.match(body, /workspace instructions/, 'shows injected context, marked as such')
assert.match(body, /contextNote/, 'labels injected context distinctly from a human prompt')

// The chunk event must not duplicate the assembled message text.
const occurrences = body.split('Let me check what DSH ships').length - 1
assert.equal(occurrences, 1, 'stream chunks do not duplicate the assembled reply')

// --- the regression guard ------------------------------------------------
assert.equal(sessionsTouched, false,
  'never touches the sessions service: opening an archived session as current '
  + 'is reverted by the core archived-selection sweep')

// --- pagination ----------------------------------------------------------
const olderButton = [...reader.querySelectorAll('button')]
  .find(b => b.textContent.includes('loadOlder'))
assert.ok(olderButton, 'offers to page older when hasMore')
await act(async () => {
  olderButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
})
assert.deepEqual(historyCalls[1], { method: 'page', payload: {
  address: { kind: 'session', sessionId: 'session-b' },
  throughSeq: 11,
  beforeSeq: 7,
  maxMessages: 30,
} }, 'pages backwards from the window head against the opening cut')
assert.match(reader.textContent, /earlier question/, 'prepends the older page')
assert.equal([...reader.querySelectorAll('button')].filter(b => b.textContent.includes('loadOlder')).length,
  0, 'hides the pager once the log start is reached')

// --- closing -------------------------------------------------------------
const closeButton = [...reader.querySelectorAll('button')]
  .find(b => b.getAttribute('aria-label') === 'close')
assert.ok(closeButton, 'the reader has a close control')
act(() => { closeButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
assert.equal(document.querySelector('[aria-modal="true"]'), null, 'closes the reader')

// A disabled row must never reach the history RPC either.
act(() => { trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
const ghostRow = [...container.querySelector('[role="dialog"]').querySelectorAll('button')][2]
act(() => { ghostRow.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
assert.equal(historyCalls.length, 2, 'the missing row never reads a log')

// Styles install into the document rather than leaking global class names.
assert.ok(document.getElementById('dsh-plugin-archived-sessions-styles'), 'injects its stylesheet once')

console.log('ok - built bundle lists archived sessions and reads transcripts read-only')
