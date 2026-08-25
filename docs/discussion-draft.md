# DRAFT — for posting to GitHub Discussions

Not part of the plugin. This file is a working draft; delete it before
publishing the repo, or keep it as a record of what was posted.

Where: https://github.com/deepseek-ai/deepseek-harness/discussions
(CONTRIBUTING.md says bugs go in Discussions, not Issues.)

Verified against public master on 2026-08-25:
`packages/client/runtime/src/client/workspaces/service.ts` line 342 — the
quoted block is byte-identical to the copy served from raw.githubusercontent.com.

Suggested title:

  sessions.open() on an archived session is silently reverted by the
  archived-selection sweep in WorkspaceRuntime.project()

---

## Body

**Summary:** calling `ctx.sessions.open(id)` on an archived session appears to do nothing at all — no error, no warning, no navigation. The selection is made and then immediately cleared within the same notification cycle. I hit this building a plugin and it took a while to find, so I wanted to write it up in case it saves someone else the time.

### What happens

`sessions.open(id)` → `manager.select(id)` succeeds: archived sessions stay in the session list, so the `select()` validation passes and `this.selected` is set.

But `select()` ends with `notifier.notifyNow()`, and `WorkspaceRuntime` subscribes to the sessions store. Its `project()` runs on every notification, and contains this sweep — `packages/client/runtime/src/client/workspaces/service.ts:342`:

```ts
// An archived current selection clears into the New Session view state —
// a hidden row must not stay open behind the list. Sweeping here covers
// every install path with one rule: the local unary echo, another tab's
// changed frame, and a reconnect baseline restoring a persisted
// selection that was archived while this client was away.
if (sessions.current !== undefined && workspace.archivedSessionIds.includes(sessions.current)) {
  this.sessions.clear()
}
```

So the sequence is: click → `select()` → `notifyNow()` → `project()` → `clear()`, all synchronously, before React paints. From the outside the click is simply dead.

### Why I think this is worth a look

The sweep is clearly deliberate, and the comment documents three real cases it covers: the local unary echo, another tab's `host/archived-sessions-changed` frame, and a reconnect baseline restoring a selection that was archived while the client was away. No argument with any of those.

The subtlety is that the condition is **state-based** rather than **transition-based**. It doesn't ask "did the archive set just change to include the current session?" — it asks "is the current session archived?", on every projection, forever. All three documented cases are transitions, but the check also catches a deliberate, explicit open that happens long afterwards.

### Possible fix

Comparing against the previous archive set, and clearing only when the current session newly enters it, would preserve all three cases while letting an intentional open stick. Roughly:

```ts
const newlyArchived = workspace.archivedSessionIds.includes(sessions.current)
  && !this.previousArchivedIds.includes(sessions.current)
```

I haven't opened a PR because I'm not sure whether "an archived session can be current at all" is a decision the team wants to change — it's plausible that keeping archived sessions strictly unreachable is the intended invariant, in which case the current code is correct and this is just a documentation gap for plugin authors. Happy to be told it's working as designed.

### Workaround for plugin authors

If you need to *show* an archived session without changing the current selection, `session.history` works and doesn't touch the sweep at all. Its contract explicitly states it "uses an attached Session or persistence inspection and never resumes or publishes an Agent", so you can page a log into your own UI safely. That's what I ended up doing.

### Environment

- DSH client packages `0.1.1-rc.2`
- Web profile, Chromium
- Confirmed present on `master` as of 2026-08-25

---

## Notes to self before posting

- Read it once more in your own voice — change anything that doesn't sound
  like you. It's your post.
- Optionally link the plugin as a concrete example, once the repo is public.
- Expect no reply. CONTRIBUTING.md says the team is small and monitors
  Discussions rather than answering every post. Upvotes are how things get
  triaged, so it is not a bad sign if it sits quietly.
