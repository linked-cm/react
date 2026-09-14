/**
 * React Native entry point: `import {...} from '@_linked/react/native'`.
 *
 * Re-exports the full root API and, on import, installs React Native render
 * defaults. The built-in loader and error elements (and `LinkedInfinityLoader`)
 * render `<svg>` host elements, which crash on React Native
 * (`View config getter callback for component 'svg'`).
 *
 * The defaults are written to `LinkedComponentDefaults` only where the app has
 * not already set them, so the normal resolution order still applies:
 *   instance prop > definition options > LinkedComponentDefaults > built-in
 *
 * The root barrel (`@_linked/react`) never imports `react-native`; web
 * behaviour is unchanged.
 */
import React from 'react';
import {ActivityIndicator, Text} from 'react-native';
import {LinkedComponentDefaults} from './utils/LinkedComponent.js';

export * from './index.js';

/** React Native loading element: an `ActivityIndicator` (`testID="linked-loader"`). */
export function createNativeLoader(): React.ReactElement {
  return React.createElement(ActivityIndicator, {
    testID: 'linked-loader',
    accessibilityLabel: 'Loading',
  });
}

/** React Native error element: an alert `Text` (`testID="linked-error"`). */
export function createNativeErrorElement(): React.ReactElement {
  return React.createElement(
    Text,
    {testID: 'linked-error', accessibilityRole: 'alert'},
    'Failed to load',
  );
}

/**
 * React Native stand-in for the web `LinkedInfinityLoader` (an SVG), so code
 * that opts into it keeps working on native. Shadows the root re-export.
 */
export function LinkedInfinityLoader(): React.ReactElement {
  return createNativeLoader();
}

if (LinkedComponentDefaults.loader === undefined) {
  LinkedComponentDefaults.loader = createNativeLoader();
}
if (LinkedComponentDefaults.errorElement === undefined) {
  LinkedComponentDefaults.errorElement = createNativeErrorElement();
}
