# Changelog

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
