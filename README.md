# dsh-plugin-archived-sessions

Browse and read archived [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) sessions from a sidebar panel.

Archiving a session in DSH hides it from every grouping surface — the workspace tree, the flat list, and search. The session log is kept, but the UI ships no way back: there is no unarchive action, no "show archived" toggle, and no way to reach an archived session once it disappears. This plugin gives those sessions a drawer, and a reader.

<!-- A screenshot belongs here once the panel is captured in a real profile. -->

## What it does

Adds an **Archived** entry beside Settings at the foot of the sidebar. Opening it shows every archived session, newest activity first, with:

- title and workspace for each row, plus a search box to filter them
- click a row to read that session's transcript in a read-only reader
- backwards pagination through the whole log
- a live count on the trigger
- English and Chinese copy, following the app's active language
- theme-aware styling via the shell's own design tokens

The reader shows human prompts, assistant replies, reasoning, injected context (labelled and clamped), and the names of tools that were called. It is plain text: no markdown rendering and no tool cards, because those surfaces live in the shell's conversation packages and reproducing them here would mean vendoring code this plugin does not own.

## What it deliberately does not do

### It does not open archived sessions in the main conversation view

This is the one design decision worth reading before forking, because the obvious implementation looks like it works and does not.

`sessions.open(id)` succeeds on an archived id — `manager.select()` validates only that the id is in the list, and archived sessions stay in the list. But the client runtime sweeps the selection away immediately afterwards, in `WorkspaceRuntime.project()`:

```ts
// packages/client/runtime/src/client/workspaces/service.ts
if (sessions.current !== undefined
    && workspace.archivedSessionIds.includes(sessions.current)) {
  this.sessions.clear()
}
```

`project()` runs on every sessions-store notification, and `select()` ends with `notifier.notifyNow()`. So the sequence is: click → select → notify → sweep → clear, all before React paints. **The click looks completely dead.**

That sweep is deliberate core behaviour — it is how the UI drops a session that another tab just archived, and how a reconnect discards a stale persisted selection. It is not a bug to route around from a plugin, and it fires on every projection rather than only on archive events, so no amount of plugin-side sequencing survives it.

So this plugin does not make archived sessions current at all. It reads the log directly through the `session.history` RPC — whose contract states it "uses an attached Session or persistence inspection and never resumes or publishes an Agent" — and renders the transcript in its own overlay. `tests/smoke.mjs` asserts the plugin never touches the sessions service, so this cannot silently regress.

Making archived sessions genuinely openable is a ~5-line upstream change: make the sweep transition-based (clear when the archive set *changes* to include the current session) instead of state-based. That preserves all three documented sweep cases while letting a deliberate open stick.

### It does not restore sessions to the sidebar

Un-archiving needs a host-side write, and every route into that state is sealed to a plugin:

- `WorkspaceRegistry.archiveSession()` only ever appends — there is no removal method
- its `setState` is private, and the state is written as a whole blob
- `storageDomain.open('workspace')` throws `already-open`, so a plugin cannot open the domain the registry holds
- editing `workspace.json` directly is clobbered, because the registry caches state in memory and rewrites the entire blob on its next mutation

Adding real unarchive means an `unarchiveSession` RPC upstream (registry method, API proxy handler, wire schemas, client manager) — a patch to the harness, not a plugin. Notably the rest of the plumbing already exists: the host frame producer watches `domain/changed` and emits `host/archived-sessions-changed`, and the client manager handles it, so a restored session would appear in the sidebar immediately, in its original position.

Rows whose session has left the session list entirely are shown but disabled: their log may be gone from disk, and the list is the only evidence the client has either way.

## Why it works without touching harness code

- `workspace.list` already ships `archivedSessionIds` to every client as ordinary data
- the session list is never filtered host-side — the store carries every row, and the sidebar's own derivation is what hides archived ones at render time
- `sidebar.footer.action` is a `list` slot that supplies both `useSessions` and `useWorkspaces` as standard props
- `session.history` reads a log from persistence without waking an agent

So the rows are already sitting in your browser; this plugin draws them, and pages the log for the one you pick. It is strictly read-only: it never calls `archiveSession`, never changes the current session, and never writes host state. The node half is deliberately empty.

### A note on page size

`session.history` returns every raw event, and `assistant/chunk` dominates a real log by roughly 20:1 — one measured tool-heavy session returned 6,239 events for a 60-message page, 5,917 of them chunks that this viewer folds away. That is 1.7 MB transferred to render 109 lines. The page size is therefore 30 rather than the shell's 60 (0.84 MB for 50 lines). Loopback hides the difference; a Tailscale-reached web UI does not.

## Install

```sh
dsh plugin --profile web add dsh-plugin-archived-sessions
```

Then restart `dsh web` and refresh the page. From a local checkout:

```sh
git clone https://github.com/<you>/dsh-plugin-archived-sessions
cd dsh-plugin-archived-sessions && pnpm install && pnpm build
dsh plugin --profile web add /absolute/path/to/dsh-plugin-archived-sessions
```

Installing writes only to `$DSH_HOME/profiles/web` (its `package.json`, `node_modules`, and lockfile). Nothing in the harness checkout is modified.

To remove it, drop the bundle from `dsh.profile.bundles` in the profile's `package.json` (or `dsh plugin --profile web remove dsh-plugin-archived-sessions`) and restart.

## Requirements

- A DSH `web` profile. The panel is browser-only.
- Built against the `0.1.1-rc.2` client packages. The slot contract it uses (`sidebar.footer.action`) is a declared extension seam, but DSH is pre-1.0 and seams may move between releases.

## Develop

```sh
pnpm install      # links against a local deepseek-harness checkout
pnpm build        # emits lib/index.js (node half) and lib/client.js (browser half)
pnpm typecheck    # typecheck against the real DSH contracts
pnpm test         # load the BUILT bundle in jsdom and drive the panel
pnpm verify       # all three
```

The dev dependencies use `link:` paths into a `deepseek-harness` checkout; point them at your own before building. The checkout is only ever read — as a type reference and a source of shared packages.

`tests/smoke.mjs` executes `lib/client.js` through a fake `__ModuleLoader__` whose `require` answers exactly the shared module table the web shell provides, then renders the registered component and drives a full read. That catches what a typecheck cannot: registering under the wrong id, requesting a module the loader cannot answer, filling the wrong slot, mis-sorting rows, duplicating replies from stream chunks, mislabelling injected context as a human prompt, paging from the wrong cursor — and, above all, reaching for the sessions service, which is the exact bug that made an earlier version's rows unclickable.

Note that `@deepseek-ai/dsh-client-connection` is **not** in the shell's shared module table (`PLATFORM_MODULES`), so the wire types are declared structurally in `src/client/history.ts` and the service is resolved at runtime with `ctx.get('connection')`. A value import of that package would not resolve in the browser.

## License

MIT
