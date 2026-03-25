---
"@_linked/react": patch
---

Upgrade to @_linked/core@2.2.1
Fix `preloadFor` rendering wrong entity and add Fuseki integration tests.
Added 7 Fuseki-backed integration tests covering `linkedComponent` and `linkedSetComponent`:
Tests use a custom Jest environment (`jest-environment-jsdom-with-fetch`) that restores Node's native `fetch` in jsdom, and auto-start Fuseki via Docker when needed.
