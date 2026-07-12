# Changelog

## 1.4.2

### Patch Changes

- [#31](https://github.com/linked-cm/react/pull/31) [`efed05e`](https://github.com/linked-cm/react/commit/efed05ec8bfe539dd718344e5fd3c7508312705e) Thanks [@flyon](https://github.com/flyon)! - `classnames` is now inlined (the `cl` helper's API is unchanged) and the external `classnames` dependency is dropped. The external package is CJS and broke native-ESM standalone bundles; consumers already import `cl` from `@_linked/react/utils/ClassNames`, so no change is needed on their side.

## 1.4.1

### Patch Changes

- [#26](https://github.com/linked-cm/react/pull/26) [`c7d61ff`](https://github.com/linked-cm/react/commit/c7d61ff7c72874e18b657dc54886b11cbdd814ce) Thanks [@flyon](https://github.com/flyon)! - Fix build against current `@_linked/core`: define the query-driven-component types (`QueryController`, `QueryControllerProps`, `ToQueryResultSet`, `GetCustomObjectKeys`) locally instead of importing them from `@_linked/core/queries/SelectQuery`, where core removed them as "dead" (only react used them; same pattern as the already-local `GetQueryResponseType`/`QueryWrapperObject`). Bump the `@_linked/core` peer to `^2.13`. Also drops the dead `development` export condition.

## 1.4.0

### Minor Changes

- [#23](https://github.com/linked-cm/react/pull/23) [`b436d21`](https://github.com/linked-cm/react/commit/b436d21eccd4241b208e60dae1e25524783d1f2c) Thanks [@flyon](https://github.com/flyon)! - ESM-only build + core 2.10.x compatibility fix.

  - **`.build()` removal:** the client preload path in `LinkedComponent` called
    `getQueryDispatch().selectQuery(requestQuery.build())`. `QueryBuilder.build()`
    was removed in `@_linked/core` 2.10.x — datasets now receive the live/closed
    query directly. Both the single and set component paths now pass `requestQuery`
    straight to `selectQuery`. Required for consumers on core ≥ 2.10.x.
  - **ESM-only:** the package now ships ESM only. `package.json` gains
    `"type": "module"`, `main`/`module`/`types` point at `lib/esm`, and every
    `require` condition is dropped from `exports`. The dual (CJS+ESM) build and the
    `dual-package` post-step are removed; `build` is a single `tsc -p tsconfig-esm.json`.

## 1.3.1

### Patch Changes

- [#17](https://github.com/linked-cm/react/pull/17) [`582f100`](https://github.com/linked-cm/react/commit/582f100932e432a49a75c038b3e9d564245bcccb) Thanks [@flyon](https://github.com/flyon)! - Fixed an infinite recursion in `linkedPackage`. The exported function was spreading `linkedPackage(packageName)` (itself) into its own return value instead of delegating to `coreLinkedPackage(packageName)` from `@_linked/core`, so any call to `import { linkedPackage } from '@_linked/react/package'` followed by `linkedPackage(...)` immediately blew the stack with `Maximum call stack size exceeded`. Almost certainly the root cause of the "stack overflow during client hydration" symptom reported against 1.3.0.

  `linkedPackage(name)` now correctly returns `{ linkedComponent, linkedSetComponent, ...coreLinkedPackage(name) }` — i.e. the React-only helpers plus everything `@_linked/core`'s `linkedPackage` provides (`linkedShape`, `linkedUtil`, `linkedOntology`, `registerPackageExport`, `packageExports`, `packageName`, …).

## 1.3.0

### Minor Changes

- [#13](https://github.com/linked-cm/react/pull/13) [`f4688d5`](https://github.com/linked-cm/react/commit/f4688d5c04f97070318f58fceae61d0280562b27) Thanks [@flyon](https://github.com/flyon)! - Loader / errorElement resolution chain, `_refresh` on `linkedSetComponent`, factory overloads, `LinkedInfinityLoader` opt-in export.

  **New: factory overloads.** `linkedComponent` and `linkedSetComponent` now accept three forms:

  ```ts
  linkedComponent(query, fn); // existing
  linkedComponent(query, fn, { loader, errorElement }); // new — positional options
  linkedComponent({ query, component, loader, errorElement }); // new — config object
  ```

  **New: loader resolution.** Resolves in order — per-instance `loader={<X/>}` prop → factory `options.loader` → `LinkedComponentDefaults.loader` → built-in `<svg class="ld-loader"/>`. Apps style `.ld-loader` (default styles ship in `@_linked/css`'s `loader.css`) or replace the element via `LinkedComponentDefaults.loader = <MyLoader />`.

  **New: error handling.** Both wrappers now capture query errors and resolve an `errorElement` in the same chain (per-instance prop → factory option → global default → built-in `<svg class="ld-error"/>`). Pass the sentinel `'rethrow'` (per-instance or as a global default) to let an external `<ErrorBoundary>` handle the error instead.

  **New: `_refresh` on `linkedSetComponent`.** Mirrors the `linkedComponent` API — `_refresh()` re-runs the query, `_refresh(updatedProps)` patches local query-result state for optimistic UI.

  **New: `LinkedInfinityLoader`.** Opt-in branded loader exported from `@_linked/react`. Tree-shake-safe via the package's new `sideEffects` array form.

  **Tree-shaking.** `package.json` now declares `"sideEffects": ["./lib/cjs/package.js", "./lib/esm/package.js"]` so bundlers drop unused named exports (the package-registration module is whitelisted).

  No breaking changes — all existing `linkedComponent(query, fn)` and `linkedSetComponent(query, fn)` call sites work unchanged.

## 1.2.1

### Patch Changes

- [#8](https://github.com/Semantu/linked-react/pull/8) [`fac333c`](https://github.com/Semantu/linked-react/commit/fac333c81c913d515ad70af53c13f0e9bc8737a4) Thanks [@flyon](https://github.com/flyon)! - `linkedComponent` now shows a loading spinner while a `PendingQueryContext` resolves instead of logging a warning and returning null. `loadData` handles null/error results gracefully. Fuseki test URL uses shared `FUSEKI_BASE_URL` constant.

## 1.2.0

### Minor Changes

- [#5](https://github.com/Semantu/linked-react/pull/5) [`ed0e99d`](https://github.com/Semantu/linked-react/commit/ed0e99d942fd9b5dfc936a5759d5c591ac470a04) Thanks [@linked-cm](https://github.com/linked-cm)! - Migrate from `SelectQueryFactory` to `QueryBuilder` for compatibility with `@_linked/core` v2.x. Replace removed `Shape.queryParser` with `getQueryDispatch()`, update all type signatures and runtime code to use the immutable `QueryBuilder` API (`.for()`, `.forAll()`, `.limit()`, `.offset()`, `.build()`). Query result types are now correctly inferred from `QueryBuilder` generic parameters. Requires `@_linked/core` ^2.2.0 as peer dependency.

### Patch Changes

- [#4](https://github.com/Semantu/linked-react/pull/4) [`58522a9`](https://github.com/Semantu/linked-react/commit/58522a9b7be5a2c7d8e279704da7dd2bc371cba4) Thanks [@flyon](https://github.com/flyon)! - Upgrade to @\_linked/core@2.2.1
  Fix `preloadFor` rendering wrong entity and add Fuseki integration tests.
  Added 7 Fuseki-backed integration tests covering `linkedComponent` and `linkedSetComponent`:
  Tests use a custom Jest environment (`jest-environment-jsdom-with-fetch`) that restores Node's native `fetch` in jsdom, and auto-start Fuseki via Docker when needed.

## 1.0.0

### Major Changes

Initial extraction from the LINCD monolith. Moves React-specific linked component wrappers into a standalone package.

- `linkedComponent(...)` and `linkedSetComponent(...)` extracted from `lincd`.
- `LinkedComponentClass` base class for class-based linked components.
- `useStyles(...)` hook for component styling.
- Pagination API (`nextPage`, `previousPage`, `setPage`, `setLimit`) on linked set components.
- `_refresh(updatedProps?)` for optimistic UI updates on linked components.
