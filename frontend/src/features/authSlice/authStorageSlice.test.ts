import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authStorageReducer, {
  loginSuccess,
  checkTokenExpiry,
  refreshToken,
  selectUser,
  selectToken,
  selectIsAuthenticated,
} from './authStorageSlice'
import { User } from './authApiSlice'

const mockUser: User = {
  _id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  active: true,
}

const createTestStore = () =>
  configureStore({ reducer: { authStorage: authStorageReducer } })

describe('authStorageSlice reducer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts unauthenticated with no user or token', () => {
    const store = createTestStore()
    const state = store.getState()

    expect(selectIsAuthenticated(state)).toBe(false)
    expect(selectUser(state)).toBeNull()
    expect(selectToken(state)).toBeNull()
  })

  describe('loginSuccess', () => {
    it('marks the user as authenticated and stores the token', () => {
      const store = createTestStore()

      store.dispatch(loginSuccess({ user: mockUser, token: 'jwt-token' }))
      const state = store.getState()

      expect(selectIsAuthenticated(state)).toBe(true)
      expect(selectUser(state)).toEqual(mockUser)
      expect(selectToken(state)).toBe('jwt-token')
    })

    it('persists the token, user, and expiry to localStorage', () => {
      const store = createTestStore()

      store.dispatch(
        loginSuccess({ user: mockUser, token: 'jwt-token', expiresInHours: 2 }),
      )

      expect(localStorage.getItem('token')).toBe('jwt-token')
      expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser)
      const storedExpiry = Number(localStorage.getItem('tokenExpiresAt'))
      expect(storedExpiry).toBeGreaterThan(Date.now())
    })
  })

  describe('checkTokenExpiry', () => {
    it('clears auth state when the token has expired', () => {
      const store = createTestStore()
      // negative expiresInHours puts the computed expiry in the past
      store.dispatch(
        loginSuccess({ user: mockUser, token: 'jwt-token', expiresInHours: -1 }),
      )

      store.dispatch(checkTokenExpiry())
      const state = store.getState()

      expect(selectIsAuthenticated(state)).toBe(false)
      expect(selectUser(state)).toBeNull()
      expect(selectToken(state)).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
    })

    it('leaves auth state untouched when the token is still valid', () => {
      const store = createTestStore()
      store.dispatch(
        loginSuccess({ user: mockUser, token: 'jwt-token', expiresInHours: 1 }),
      )

      store.dispatch(checkTokenExpiry())
      const state = store.getState()

      expect(selectIsAuthenticated(state)).toBe(true)
      expect(selectToken(state)).toBe('jwt-token')
    })
  })

  describe('refreshToken', () => {
    it('updates the stored token and expiry', () => {
      const store = createTestStore()
      store.dispatch(loginSuccess({ user: mockUser, token: 'old-token' }))

      store.dispatch(refreshToken({ token: 'new-token', expiresInHours: 5 }))
      const state = store.getState()

      expect(selectToken(state)).toBe('new-token')
      expect(localStorage.getItem('token')).toBe('new-token')
    })
  })
})

describe('authStorageSlice hydration from localStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('hydrates authenticated state from a valid stored token', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem('tokenExpiresAt', (Date.now() + 60_000).toString())

    const fresh = await import('./authStorageSlice')
    const store = configureStore({
      reducer: { authStorage: fresh.default },
    })
    const state = store.getState()

    expect(fresh.selectIsAuthenticated(state)).toBe(true)
    expect(fresh.selectToken(state)).toBe('stored-token')
    expect(fresh.selectUser(state)).toEqual(mockUser)
  })

  it('discards an expired stored token on load', async () => {
    localStorage.setItem('token', 'stale-token')
    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem('tokenExpiresAt', (Date.now() - 60_000).toString())

    const fresh = await import('./authStorageSlice')
    const store = configureStore({
      reducer: { authStorage: fresh.default },
    })
    const state = store.getState()

    expect(fresh.selectIsAuthenticated(state)).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })
})
