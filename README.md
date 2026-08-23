# dsh-plugin-archived-sessions

Browse and reopen archived [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) sessions from a sidebar panel.

Archiving a session in DSH hides it from every grouping surface — the workspace tree, the flat list, and search. The session log is kept, but the UI ships no way back: there is no unarchive action, no "show archived" toggle, and no way to open an archived session once it disappears. This plugin gives those sessions a drawer.

<!-- A screenshot belongs here once the panel is captured in a real profile. -->

## What it does

Adds an **Archived** entry beside Settings at the foot of the sidebar. Opening it shows every archived session, newest activity first, with:

- title and workspace for each row, plus a search box to filter them
- click a row to open that session in the normal conversation view
- a live count on the trigger
- English and Chinese copy, following the app's active language
- theme-aware styling via the shell's own design tokens

## What it deliberately does not do

**It does not restore sessions to the sidebar.** This is a viewer, and that limit is architectural rather than an oversight.

Un-archiving needs a host-side write, and every route into that state is sealed to a plugin:

- `WorkspaceRegistry.archiveSession()` only ever appends — there is no removal method
- its `setState` is private, and the state is written as a whole blob
- `storageDomain.open('workspace')` throws `already-open`, so a plugin cannot open the domain the registry holds
- editing `workspace.json` directly is clobbered, because the registry caches state in memory and rewrites the entire blob on its next mutation

Adding real unarchive means an `unarchiveSession` RPC upstream (registry method, API proxy handler, wire schemas, client manager) — a patch to the harness, not a plugin. Notably the rest of the plumbing already exists: the host frame producer watches `domain/changed` and emits `host/archived-sessions-changed`, and the client manager handles it, so a restored session would appear in the sidebar immediately, in its original position.

Rows whose session has left the session list entirely are shown but disabled, since opening an unknown id fails loud in the host.

## Why it works without touching harness code

- `workspace.list` already ships `archivedSessionIds` to every client as ordinary data
- the session list is never filtered host-side — the store carries every row, and the sidebar's own derivation is what hides archived ones at render time
- `sessions.open(id)` does not consult the archive set, so an archived session opens like any other
- `sidebar.footer.action` is a `list` slot that supplies both `useSessions` and `useWorkspaces` as standard props

So the rows are already sitting in your browser; this plugin just draws them. It is strictly read-only: it never calls `archiveSession` and never writes host state. The node half is deliberately empty.

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
npx tsc -p tsconfig.json   # typecheck against the real DSH contracts
node tests/smoke.mjs       # load the BUILT bundle in jsdom and drive the panel
```

The dev dependencies use `link:` paths into a `deepseek-harness` checkout; point them at your own before building. The checkout is only ever read — as a type reference and a source of shared packages.

`tests/smoke.mjs` executes `lib/client.js` through a fake `__ModuleLoader__` whose `require` answers exactly the shared module table the web shell provides, then renders the registered component. That catches what a typecheck cannot: registering under the wrong id, requesting a module the loader cannot answer, filling the wrong slot, mis-sorting rows, or letting a disabled row call `sessions.open`.

## License

MIT
