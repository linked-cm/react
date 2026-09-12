---
'@_linked/react': patch
---

Improve `linkedComponent` behavior when query context is not yet resolved.

- Show a loading state while `PendingQueryContext` is unresolved instead of warning and returning `null`
- Retry loading when the resolved subject ID becomes available
- Handle `null` and error results more safely during linked component data loading
- Fix Fuseki-backed React integration test auto-start by ensuring the shared Fuseki test helper can locate `docker-compose.test.yml` from compiled package layouts
