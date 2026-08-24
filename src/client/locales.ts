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
  note: 'Read-only. Opening a session here does not restore it to the sidebar or let you continue it.',
  read: 'Read transcript',
  loading: 'Loading…',
  loadError: 'Could not read this session log.',
  retry: 'Try again',
  loadOlder: 'Load earlier messages',
  transcriptEmpty: 'This session has no messages.',
  toolCall: 'called',
  contextNote: 'Injected context',
  reasoningNote: 'Reasoning',
  readOnly: 'Read-only',
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
  note: '只读。在此打开会话不会将其恢复到侧边栏，也无法继续对话。',
  read: '查看记录',
  loading: '加载中…',
  loadError: '无法读取该会话日志。',
  retry: '重试',
  loadOlder: '加载更早的消息',
  transcriptEmpty: '该会话没有消息。',
  toolCall: '调用了',
  contextNote: '注入的上下文',
  reasoningNote: '推理过程',
  readOnly: '只读',
}

/** One copy key in this namespace. */
export type ArchivedKey = keyof typeof en

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Archived-sessions panel copy. */
    'archived-sessions': ArchivedKey
  }
}
