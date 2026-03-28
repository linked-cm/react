---
"@_linked/react": patch
---

`linkedComponent` now shows a loading spinner while a `PendingQueryContext` resolves instead of logging a warning and returning null. `loadData` handles null/error results gracefully. Fuseki test URL uses shared `FUSEKI_BASE_URL` constant.
