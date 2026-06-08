---
"@_linked/react": patch
---

Fixed an infinite recursion in `linkedPackage`. The exported function was spreading `linkedPackage(packageName)` (itself) into its own return value instead of delegating to `coreLinkedPackage(packageName)` from `@_linked/core`, so any call to `import { linkedPackage } from '@_linked/react/package'` followed by `linkedPackage(...)` immediately blew the stack with `Maximum call stack size exceeded`. Almost certainly the root cause of the "stack overflow during client hydration" symptom reported against 1.3.0.

`linkedPackage(name)` now correctly returns `{ linkedComponent, linkedSetComponent, ...coreLinkedPackage(name) }` — i.e. the React-only helpers plus everything `@_linked/core`'s `linkedPackage` provides (`linkedShape`, `linkedUtil`, `linkedOntology`, `registerPackageExport`, `packageExports`, `packageName`, …).
