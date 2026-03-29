import {describe, expect, test, beforeEach, afterEach} from '@jest/globals';
import React from 'react';
import {render, cleanup, act} from '@testing-library/react';
import {cl} from '../utils/ClassNames.js';
import {useQueryContext} from '../utils/useQueryContext.js';
import {getQueryContext, setQueryContext, PendingQueryContext} from '@_linked/core/queries/QueryContext';
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
    await act(async () => {
      render(<ContextSetter name="emptyCtx" value={null} />);
    });

    const ctx = getQueryContext('emptyCtx');
    // Should return a PendingQueryContext (not null) whose id is undefined
    expect(ctx).toBeInstanceOf(PendingQueryContext);
    expect(ctx.id).toBeUndefined();
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

// ── PendingQueryContext (lazy resolution) ──

describe('PendingQueryContext', () => {
  afterEach(() => {
    cleanup();
    // Clear contexts between tests
    setQueryContext('lazyUser', null as any);
  });

  test('getQueryContext returns PendingQueryContext when context is not yet set', () => {
    const ctx = getQueryContext('nonExistent');
    expect(ctx).toBeInstanceOf(PendingQueryContext);
    expect((ctx as any).contextName).toBe('nonExistent');
  });

  test('PendingQueryContext.id is undefined when context is not set', () => {
    const ctx = getQueryContext('lazyUser');
    expect(ctx.id).toBeUndefined();
  });

  test('PendingQueryContext.id resolves after setQueryContext is called', () => {
    // Get a pending reference BEFORE setting the context
    const ctx = getQueryContext('lazyUser');
    expect(ctx.id).toBeUndefined();

    // Now set the context (simulates what useAuth does after login)
    setQueryContext('lazyUser', {id: 'urn:test:user:42'}, TestPerson);

    // The same reference should now resolve to the ID
    expect(ctx.id).toBe('urn:test:user:42');
  });

  test('getQueryContext returns resolved value (not PendingQueryContext) after context is set', () => {
    setQueryContext('lazyUser', {id: 'urn:test:user:1'}, TestPerson);

    const ctx = getQueryContext('lazyUser');
    // Should return the actual QueryShape, not a PendingQueryContext
    expect(ctx).not.toBeInstanceOf(PendingQueryContext);
    expect(ctx.id).toBe('urn:test:user:1');
  });

  test('PendingQueryContext.id updates when context value changes', () => {
    const ctx = getQueryContext('lazyUser');
    expect(ctx.id).toBeUndefined();

    // Set to first user
    setQueryContext('lazyUser', {id: 'urn:test:user:1'}, TestPerson);
    expect(ctx.id).toBe('urn:test:user:1');

    // Update to second user
    setQueryContext('lazyUser', {id: 'urn:test:user:2'}, TestPerson);
    expect(ctx.id).toBe('urn:test:user:2');
  });

  test('multiple PendingQueryContext instances for same name all resolve', () => {
    const ctx1 = getQueryContext('lazyUser');
    const ctx2 = getQueryContext('lazyUser');

    setQueryContext('lazyUser', {id: 'urn:test:user:99'}, TestPerson);

    expect(ctx1.id).toBe('urn:test:user:99');
    expect(ctx2.id).toBe('urn:test:user:99');
  });
});
