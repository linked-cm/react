import {describe, expect, test, beforeEach, afterEach} from '@jest/globals';
import React from 'react';
import {render, cleanup, act} from '@testing-library/react';
import {cl} from '../utils/ClassNames.js';
import {useQueryContext} from '../utils/useQueryContext.js';
import {getQueryContext, setQueryContext} from '@_linked/core/queries/QueryContext';
import {Shape} from '@_linked/core/shapes/Shape';
import {linkedShape} from '../package.js';

// ── ClassNames ──

describe('ClassNames (cl)', () => {
  test('joins class names', () => {
    expect(cl('a', 'b', 'c')).toBe('a b c');
  });

  test('filters falsy values', () => {
    expect(cl('a', null, undefined, false, '', 'b')).toBe('a b');
  });

  test('supports object syntax', () => {
    expect(cl({active: true, disabled: false, visible: true})).toBe(
      'active visible',
    );
  });

  test('supports mixed args', () => {
    expect(cl('base', {active: true}, ['extra'])).toBe('base active extra');
  });

  test('returns empty string for no args', () => {
    expect(cl()).toBe('');
  });
});

// ── useQueryContext ──

const personClass = {id: 'urn:test:qctx:Person'};

@linkedShape
class TestPerson extends Shape {
  static targetClass = personClass;
}

// Helper component that calls useQueryContext
function ContextSetter({
  name,
  value,
  shapeType,
}: {
  name: string;
  value: any;
  shapeType?: new (...args: any[]) => Shape;
}) {
  useQueryContext(name, value, shapeType);
  return <div data-testid="setter">ok</div>;
}

describe('useQueryContext', () => {
  afterEach(() => {
    cleanup();
    // Clear context between tests by setting to null
    setQueryContext('testUser', null as any);
  });

  test('sets query context with a QResult-like value', async () => {
    const qResult = {id: 'urn:test:person:1', name: 'Alice'};

    await act(async () => {
      render(
        <ContextSetter name="testUser" value={qResult} shapeType={TestPerson} />,
      );
    });

    const ctx = getQueryContext('testUser');
    expect(ctx).not.toBeNull();
  });

  test('does not set context when value is falsy', async () => {
    // Clear any previous context
    setQueryContext('emptyCtx', null as any);

    await act(async () => {
      render(<ContextSetter name="emptyCtx" value={null} />);
    });

    const ctx = getQueryContext('emptyCtx');
    // Should still be null since we passed null value
    expect(ctx).toBeNull();
  });

  test('updates context when value changes', async () => {
    const value1 = {id: 'urn:test:person:1'};
    const value2 = {id: 'urn:test:person:2'};

    const {rerender} = render(
      <ContextSetter name="changing" value={value1} shapeType={TestPerson} />,
    );

    await act(async () => {
      rerender(
        <ContextSetter name="changing" value={value2} shapeType={TestPerson} />,
      );
    });

    const ctx = getQueryContext<TestPerson>('changing');
    expect(ctx).not.toBeNull();
  });
});
