---
"@_linked/react": patch
---

`classnames` is now inlined (the `cl` helper's API is unchanged) and the external `classnames` dependency is dropped. The external package is CJS and broke native-ESM standalone bundles; consumers already import `cl` from `@_linked/react/utils/ClassNames`, so no change is needed on their side.
