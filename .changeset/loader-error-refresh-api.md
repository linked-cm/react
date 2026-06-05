---
'@_linked/react': minor
---

Loader / errorElement resolution chain, `_refresh` on `linkedSetComponent`, factory overloads, `LinkedInfinityLoader` opt-in export.

**New: factory overloads.** `linkedComponent` and `linkedSetComponent` now accept three forms:

```ts
linkedComponent(query, fn);                                  // existing
linkedComponent(query, fn, { loader, errorElement });        // new — positional options
linkedComponent({ query, component, loader, errorElement }); // new — config object
```

**New: loader resolution.** Resolves in order — per-instance `loader={<X/>}` prop → factory `options.loader` → `LinkedComponentDefaults.loader` → built-in `<svg class="ld-loader"/>`. Apps style `.ld-loader` (default styles ship in `@_linked/css`'s `loader.css`) or replace the element via `LinkedComponentDefaults.loader = <MyLoader />`.

**New: error handling.** Both wrappers now capture query errors and resolve an `errorElement` in the same chain (per-instance prop → factory option → global default → built-in `<svg class="ld-error"/>`). Pass the sentinel `'rethrow'` (per-instance or as a global default) to let an external `<ErrorBoundary>` handle the error instead.

**New: `_refresh` on `linkedSetComponent`.** Mirrors the `linkedComponent` API — `_refresh()` re-runs the query, `_refresh(updatedProps)` patches local query-result state for optimistic UI.

**New: `LinkedInfinityLoader`.** Opt-in branded loader exported from `@_linked/react`. Tree-shake-safe via the package's new `sideEffects` array form.

**Tree-shaking.** `package.json` now declares `"sideEffects": ["./lib/cjs/package.js", "./lib/esm/package.js"]` so bundlers drop unused named exports (the package-registration module is whitelisted).

No breaking changes — all existing `linkedComponent(query, fn)` and `linkedSetComponent(query, fn)` call sites work unchanged.
