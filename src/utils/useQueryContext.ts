import {useEffect} from 'react';
import {setQueryContext} from '@_linked/core/queries/QueryContext';
import type {Shape} from '@_linked/core/shapes/Shape';

/**
 * React hook that registers a value in the global query context.
 * Keeps the context in sync with the component's state — sets on
 * mount / value change and clears on unmount.
 */
export function useQueryContext(
  name: string,
  value: any,
  shapeType?: new (...args: any[]) => Shape,
): void {
  useEffect(() => {
    if (value) {
      setQueryContext(name, value, shapeType);
    }
  }, [name, value, shapeType]);
}
