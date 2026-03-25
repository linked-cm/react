---
"@_linked/react": minor
---

Migrate from `SelectQueryFactory` to `QueryBuilder` for compatibility with `@_linked/core` v2.x. Replace removed `Shape.queryParser` with `getQueryDispatch()`, update all type signatures and runtime code to use the immutable `QueryBuilder` API (`.for()`, `.forAll()`, `.limit()`, `.offset()`, `.build()`). Query result types are now correctly inferred from `QueryBuilder` generic parameters. Requires `@_linked/core` ^2.2.0 as peer dependency.
