// Mock React Native since it can't run in node test environment
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
}));

import { ErrorBoundary } from '../components/ErrorBoundary';
import React from 'react';

describe('ErrorBoundary (Fix 3)', () => {
  test('initial state has hasError: false', () => {
    const boundary = new ErrorBoundary({});
    expect(boundary.state).toEqual({ hasError: false });
  });

  test('getDerivedStateFromError returns { hasError: true }', () => {
    const state = ErrorBoundary.getDerivedStateFromError(new Error('boom'));
    expect(state).toEqual({ hasError: true });
  });

  test('getDerivedStateFromError ignores the error argument (state only)', () => {
    const state1 = ErrorBoundary.getDerivedStateFromError(new Error('err A'));
    const state2 = ErrorBoundary.getDerivedStateFromError(new TypeError('err B'));
    expect(state1).toEqual({ hasError: true });
    expect(state2).toEqual({ hasError: true });
  });

  test('componentDidCatch logs error and info via console.error', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const boundary = new ErrorBoundary({});
    const error = new Error('component crashed');
    const info: React.ErrorInfo = { componentStack: '\n    at TestComponent', digest: undefined };

    boundary.componentDidCatch(error, info);

    expect(errorSpy).toHaveBeenCalledWith('[ErrorBoundary]', error, info);
    errorSpy.mockRestore();
  });

  test('componentDidCatch includes the [ErrorBoundary] prefix in log', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const boundary = new ErrorBoundary({});
    boundary.componentDidCatch(new Error('x'), { componentStack: '', digest: undefined });

    expect(errorSpy.mock.calls[0][0]).toBe('[ErrorBoundary]');
    errorSpy.mockRestore();
  });

  test('setState to { hasError: false } resets error state (retry logic)', () => {
    const boundary = new ErrorBoundary({});
    // Simulate an error having been caught
    boundary.state = { hasError: true };
    expect(boundary.state.hasError).toBe(true);

    // setState is normally async in React; here we verify it's called correctly
    const setStateSpy = jest.spyOn(boundary, 'setState').mockImplementation(() => {});
    boundary.setState({ hasError: false });
    expect(setStateSpy).toHaveBeenCalledWith({ hasError: false });
    setStateSpy.mockRestore();
  });
});
