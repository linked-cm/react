---
"@_linked/react": patch
---

Fix build against current `@_linked/core`: define the query-driven-component types (`QueryController`, `QueryControllerProps`, `ToQueryResultSet`, `GetCustomObjectKeys`) locally instead of importing them from `@_linked/core/queries/SelectQuery`, where core removed them as "dead" (only react used them; same pattern as the already-local `GetQueryResponseType`/`QueryWrapperObject`). Bump the `@_linked/core` peer to `^2.13`. Also drops the dead `development` export condition.
