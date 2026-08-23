/** Copy for the archived-sessions panel. */

/** Locale namespace owned by this plugin. */
export const NS = 'archived-sessions'

/** English strings (the key-set source of truth for this pair). */
export const en = {
  nav: 'Archived',
  title: 'Archived sessions',
  count: '{n} archived',
  empty: 'No archived sessions.',
  emptyHint: 'Archiving a session from the sidebar hides it here.',
  search: 'Search archived sessions',
  noMatch: 'No archived session matches that search.',
  open: 'Open',
  close: 'Close',
  untitled: 'Untitled session',
  missing: 'This session is archived but is no longer in the session list.',
  note: 'Opening an archived session does not restore it to the sidebar.',
}

/** Chinese strings (same key set as {@link en}). */
export const zh: typeof en = {
  nav: '已归档',
  title: '已归档会话',
  count: '{n} 个已归档',
  empty: '没有已归档的会话。',
  emptyHint: '从侧边栏归档会话后会显示在这里。',
  search: '搜索已归档会话',
  noMatch: '没有匹配的已归档会话。',
  open: '打开',
  close: '关闭',
  untitled: '未命名会话',
  missing: '该会话已归档，但已不在会话列表中。',
  note: '打开已归档会话不会将其恢复到侧边栏。',
}

/** One copy key in this namespace. */
export type ArchivedKey = keyof typeof en

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Archived-sessions panel copy. */
    'archived-sessions': ArchivedKey
  }
}
