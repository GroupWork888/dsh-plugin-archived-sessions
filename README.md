# dsh-plugin-archived-sessions

Browse and read archived [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) sessions from a sidebar panel.

DSH provides archived-session filters and an unarchive action. This plugin adds a separate read-only transcript reader that leaves the session archived and preserves the current conversation.

![The archived-sessions panel, listing archived sessions with a search box](docs/panel.png)

## What it does

Adds an **Archived** entry beside Settings at the foot of the sidebar, with a live count of how many sessions are hidden there:

![The Archived entry at the sidebar foot, showing a count of 53](docs/sidebar-entry.png)

Opening it shows every archived session, newest activity first, with:

- title and workspace for each row, plus a search box to filter them
- click a row to read that session's transcript in a read-only reader
- backwards pagination through the whole log
- a live count on the trigger
- English and Chinese copy, following the app's active language
- theme-aware styling via the shell's own design tokens

Clicking a row opens that session's transcript in a read-only reader:

![The read-only transcript reader, showing a prompt and labelled injected context](docs/reader.png)

The reader shows human prompts, assistant replies, reasoning, injected context (labelled and clamped), and the names of tools that were called. It is plain text: no markdown rendering and no tool cards, because those surfaces live in the shell's conversation packages and reproducing them here would mean vendoring code this plugin does not own.

## What it deliberately does not do

The reader uses `session.follow` and `session.page` without making the archived session current, unarchiving it, or sending it a prompt. Use DSH's built-in unarchive action when you want to resume a conversation. The built-artifact smoke test rejects calls to session-mutating services.

Rows whose session has left the session list entirely are shown but disabled: their log may be gone from disk, and the list is the only evidence the client has either way.

## Why it works without touching harness code

- `workspace.list` already ships `archivedSessionIds` to every client as ordinary data
- the session list is never filtered host-side — the store carries every row, and the sidebar's own derivation is what hides archived ones at render time
- `sidebar.footer.action` is a `list` slot that supplies both `useSessions` and `useWorkspaces` as standard props
- `session.follow` and `session.page` read a log from persistence without waking an agent

So the rows are already sitting in your browser; this plugin draws them, and pages the log for the one you pick. It is strictly read-only: it never calls `archiveSession`, never changes the current session, and never writes host state. The node half is deliberately empty.

### A note on page size

The reader requests 30 messages per page and loads earlier history on demand. DSH 0.2 embeds compact assistant streams in persisted events; the reader renders assembled assistant messages rather than their stream deltas.

## Install

With an installed `dsh` command:

```sh
dsh plugin --profile web add https://github.com/GroupWork888/dsh-plugin-archived-sessions
```

If you run DSH from a source checkout instead, invoke the same CLI through its package script:

```sh
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add https://github.com/GroupWork888/dsh-plugin-archived-sessions
```

Then restart the Web profile (`dsh web`, or `pnpm dsh web` from a source checkout) and refresh the page. The built bundle is committed, so there is no plugin build step.

From a local clone instead, if you want to read or change the source:

```sh
git clone https://github.com/GroupWork888/dsh-plugin-archived-sessions
cd dsh-plugin-archived-sessions && pnpm install
dsh plugin --profile web add "$PWD"
```

Installing writes only to `$DSH_HOME/profiles/web` (its `package.json`, `node_modules`, and lockfile). Nothing in the harness checkout is modified.

To remove it, run `dsh plugin --profile web remove dsh-plugin-archived-sessions` and restart. Source-checkout users run the equivalent `pnpm dsh plugin ...` command from the harness root.

## Requirements

- A DSH `web` profile. The panel is browser-only.
- Built against the `0.2.0-rc.1` client packages. The slot contract it uses (`sidebar.footer.action`) is a declared extension seam, but DSH is pre-1.0 and seams may move between releases.

## Develop

```sh
pnpm install      # no harness checkout required
pnpm build        # emits lib/index.js (node half) and lib/client.js (browser half)
pnpm test         # load the BUILT bundle in jsdom and drive the panel
pnpm verify       # build + test — works anywhere
```

**You do not need a `deepseek-harness` checkout to hack on this.** The `link:` dev dependencies point at one, but they are type-only: `pnpm install`, `pnpm build`, and `pnpm test` all succeed with those links dangling, and the resulting `lib/client.js` is byte-identical to one built with the checkout present (verified). The checkout is only ever read, never written.

The one thing that needs it is type resolution:

```sh
pnpm typecheck     # requires ../deepseek-harness (else ~5 cannot-find-module errors)
pnpm verify:types  # build + typecheck + test
```

If you want it, clone the harness as a sibling directory (`../deepseek-harness`) or repoint the `link:` paths in `package.json`. Worth doing before sending a PR — it typechecks against the real DSH contracts and catches wrong prop names and missing locale declarations that a build will happily emit.

`tests/smoke.mjs` executes `lib/client.js` through a fake `__ModuleLoader__` whose `require` answers exactly the shared module table the web shell provides, then renders the registered component and drives a full read. That catches what a typecheck cannot: registering under the wrong id, requesting a module the loader cannot answer, filling the wrong slot, mis-sorting rows, duplicating replies from stream chunks, mislabelling injected context as a human prompt, paging from the wrong cursor — and, above all, reaching for the sessions service, which is the exact bug that made an earlier version's rows unclickable.

The history types are type-only imports from the Remote assembly and Session controller, so the built browser bundle adds no value import that must be present in the shell's shared module table.

## License

MIT
