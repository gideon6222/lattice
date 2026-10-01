/* The version line, and which kind of build this is.

   His bar (studio-knowledge checklists/launch.md section 2, 2026-10-01): the
   version line sits in Settings (the pause sheet) and says
   `v<version> | <commit> | debug|release`, the kind read from the build itself,
   never a value a script fills in. The old stamp read "build <sha> · <time>"
   and fell back to "unbuilt", with nothing saying whether the build on the
   phone was the Play release.

   Vite's `define` fills __BUILD_SHA__ (the commit, with + for a dirty tree) and
   __BUILD_KIND__ (`release` from `vite build`, `debug` from the dev server).
   The typeof guards keep it harmless loaded unbuilt, in the node suite. */

import { VERSION } from './changelog';

export function buildSha(): string {
  return typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : 'dev';
}

export function buildKind(): 'debug' | 'release' {
  return typeof __BUILD_KIND__ === 'string' && __BUILD_KIND__ === 'release' ? 'release' : 'debug';
}

export function buildLine(version = VERSION, sha = buildSha(), kind = buildKind()): string {
  return 'v' + version + ' | ' + sha + ' | ' + kind;
}

/* The dev tools a player never sees (the run log's balance table, the error
   overlay): on under the dev server, or with ?debug on the address. */
export function debugTools(search = typeof location === 'object' ? location.search : ''): boolean {
  if (buildKind() === 'debug') return true;
  try { return new URLSearchParams(search).has('debug'); } catch (e) { return false; }
}
