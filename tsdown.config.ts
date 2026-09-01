/**
 * Two artifacts from one build:
 *
 * - `lib/index.js` — the node half. Inert by design (see src/index.ts).
 * - `lib/client.js` — the browser half, emitted as the closure-factory shape
 *   the DSH web module loader expects: the bundle calls
 *   `window.__ModuleLoader__.load({ id, factory })` and resolves shared
 *   modules through the injected `require` rather than an import map.
 *
 * The externals list mirrors the platform module table plus this package's
 * declared `dsh.client.inject` edges. Anything not in that table must be
 * inlined, because a `require()` the loader cannot answer throws at boot.
 */
import type { UserConfig } from 'tsdown'

const ID = 'dsh-plugin-archived-sessions'

/** Specifiers the web shell shares into the frozen client module table. */
const EXTERNALS = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
])

const isShared = (specifier: string): boolean => EXTERNALS.has(specifier)

const node: UserConfig = {
  name: `${ID}/node`,
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: 'esm',
  platform: 'neutral',
  dts: false,
  clean: true,
}

const client: UserConfig = {
  name: `${ID}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  // clean must stay off here: the node half above already emitted into lib/.
  clean: false,
  // `external` is the decisive rule: shared specifiers must stay `require()`
  // calls answered by the loader's module table. Bundling one instead would
  // inline a duplicate React/primitives runtime — a different module identity
  // from the shell's, which breaks hooks and theming.
  external: (specifier: string) => isShared(specifier),
  deps: {
    neverBundle: isShared,
    alwaysBundle: (specifier: string) => !isShared(specifier),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default [node, client]
