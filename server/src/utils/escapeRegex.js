/**
 * Escapes special regex metacharacters in a user-supplied string so it can
 * be used safely in a MongoDB $regex query without enabling injection.
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
