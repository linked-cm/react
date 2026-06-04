import React from 'react';

/**
 * Branded infinity-symbol loader. Opt-in: set
 * `LinkedComponentDefaults.loader = <LinkedInfinityLoader />` to use it as
 * the app-wide loading element, or pass `<X loader={<LinkedInfinityLoader/>}/>`
 * per-instance.
 *
 * Uses `stroke: currentColor` and an animated `stroke-dashoffset` that
 * traces along the figure-8 path. Styled by `.ld-loader--infinity` in
 * `@_linked/css/loader.css`.
 */
export function LinkedInfinityLoader(): React.ReactElement {
  return (
    <svg
      className="ld-loader ld-loader--infinity"
      aria-label="Loading"
      role="status"
      viewBox="0 0 64 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 16 C 16 4, 30 4, 32 16 C 34 28, 48 28, 48 16 C 48 4, 34 4, 32 16 C 30 28, 16 28, 16 16 Z"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  );
}
