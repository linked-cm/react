---
'@_linked/react': minor
---

ESM-only build + core 2.10.x compatibility fix.

- **`.build()` removal:** the client preload path in `LinkedComponent` called
  `getQueryDispatch().selectQuery(requestQuery.build())`. `QueryBuilder.build()`
  was removed in `@_linked/core` 2.10.x — datasets now receive the live/closed
  query directly. Both the single and set component paths now pass `requestQuery`
  straight to `selectQuery`. Required for consumers on core ≥ 2.10.x.
- **ESM-only:** the package now ships ESM only. `package.json` gains
  `"type": "module"`, `main`/`module`/`types` point at `lib/esm`, and every
  `require` condition is dropped from `exports`. The dual (CJS+ESM) build and the
  `dual-package` post-step are removed; `build` is a single `tsc -p tsconfig-esm.json`.
