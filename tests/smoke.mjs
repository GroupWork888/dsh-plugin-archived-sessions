/**
 * Smoke test for the BUILT artifact (not the sources): loads lib/client.js
 * the way the DSH web shell does — via a fake __ModuleLoader__ whose require
 * answers exactly the shared module table — then drives the registered slot
 * component in jsdom.
 *
 * This checks the parts a typecheck cannot: that the bundle registers under
 * the right id, requests only modules the loader can answer, registers into
 * `sidebar.footer.action`, and renders archived rows that open on click.
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
assert.deepEqual(plugin.inject, ['slots', 'sessions', 'locale'], 'declares its service edges')

// --- fake client context -------------------------------------------------
const opened = []
const localeRegistrations = []
let slotEntry
const ctx = {
  effect: (fn) => { fn() },
  locale: {
    register: (ns, dicts) => { localeRegistrations.push([ns, Object.keys(dicts)]); return () => {} },
    bind: () => (key) => key,
  },
  sessions: { open: (id) => { opened.push(id) } },
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

act(() => { rows[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
assert.deepEqual(opened, ['session-b'], 'clicking a row opens that session')

// A disabled row must never reach sessions.open (it would throw host-side).
act(() => { ghost.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
assert.deepEqual(opened, ['session-b'], 'the missing row never calls open')

// Styles install into the document rather than leaking global class names.
assert.ok(document.getElementById('dsh-plugin-archived-sessions-styles'), 'injects its stylesheet once')

console.log('ok - built bundle registers, renders, sorts, and opens sessions')
