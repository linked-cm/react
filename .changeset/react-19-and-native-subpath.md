---
"@_linked/react": minor
---

Support React 19 and React Native.

- The `react` peer range is now `^18.2.0 || ^19.0.0`. On React 19 apps (such as any current Expo SDK), `npm install` no longer fails with `ERESOLVE`, so you can remove the `overrides` workaround.
- New `@_linked/react/native` entry point. It exports the same API as `@_linked/react`. Importing it sets `LinkedComponentDefaults.loader` to an `ActivityIndicator` (`testID="linked-loader"`) and `LinkedComponentDefaults.errorElement` to an alert `Text` reading "Failed to load" (`testID="linked-error"`), unless your app has already set them. It also replaces `LinkedInfinityLoader` with an `ActivityIndicator`. The built-in `<svg>` loader and error elements crash on React Native, so React Native apps should import from `@_linked/react/native`. If your app set these defaults itself as a workaround, you can remove that code.
- `react-native` (`>=0.76`) is an optional peer dependency. The root entry doesn't import it, so web behaviour is unchanged.
