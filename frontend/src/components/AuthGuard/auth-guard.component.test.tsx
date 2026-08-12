import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import authStorageReducer, { checkTokenExpiry } from '../../features/authSlice/authStorageSlice'
import AuthGuard from './auth-guard.component'

const createTestStore = () =>
  configureStore({ reducer: { authStorage: authStorageReducer } })

describe('AuthGuard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders its children', () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </Provider>,
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('checks token expiry on mount', () => {
    const store = createTestStore()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    render(
      <Provider store={store}>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </Provider>,
    )

    expect(dispatchSpy).toHaveBeenCalledWith(checkTokenExpiry())
  })

  it('checks token expiry again every 5 minutes', () => {
    const store = createTestStore()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    render(
      <Provider store={store}>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </Provider>,
    )

    dispatchSpy.mockClear()

    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(dispatchSpy).toHaveBeenCalledWith(checkTokenExpiry())

    dispatchSpy.mockClear()
    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(dispatchSpy).toHaveBeenCalledWith(checkTokenExpiry())
  })

  it('stops checking token expiry after unmount', () => {
    const store = createTestStore()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    const { unmount } = render(
      <Provider store={store}>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </Provider>,
    )

    unmount()
    dispatchSpy.mockClear()

    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(dispatchSpy).not.toHaveBeenCalled()
  })
})
