/**
 * Node half of dsh-plugin-archived-sessions.
 *
 * Deliberately inert. Everything this plugin does happens in the browser
 * (see src/client/index.ts): it reads the archive set the Host already
 * publishes to every client, then reads archived logs through the existing
 * generated Session Remote. There is no Host-side state to own and nothing to write.
 *
 * This entry exists so the bundle has a loadable row; keeping it empty is
 * what makes the plugin safe to install and trivial to remove.
 */

export const name = 'archived-sessions'

/** No Host services are registered, consumed, or mutated. */
export function apply(): void {}

export default { name, apply }
