import { describe, it, expect, vi, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { authApiSlice, AuthResponse, LoginCredentials } from './authApiSlice'
import authStorageReducer, {
  loginSuccess,
  selectIsAuthenticated,
} from './authStorageSlice'

// fetchBaseQuery reads the body via response.text() (then JSON.parse's it itself),
// and calls response.clone() to read the raw text alongside the parsed result.
const mockFetchResponse = (body: unknown, { ok = true, status = 200 } = {}) => {
  const response = {
    ok,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers({ 'content-type': 'application/json' }),
    clone: () => response,
  }
  return response
}

const mockCredentials: LoginCredentials = {
  email: 'jane@example.com',
  password: 'correct-password',
}

const mockAuthResponse: AuthResponse = {
  status: 'success',
  token: 'mock-jwt-token',
  data: {
    user: {
      _id: '1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'user',
      active: true,
    },
  },
}

const createTestStore = () =>
  configureStore({
    reducer: { [authApiSlice.reducerPath]: authApiSlice.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(authApiSlice.middleware),
  })

describe('authApiSlice configuration', () => {
  it('has the correct reducer path', () => {
    expect(authApiSlice.reducerPath).toBe('authApi')
  })

  it('defines the login endpoint', () => {
    expect(authApiSlice.endpoints.login).toBeDefined()
    expect(authApiSlice.endpoints.login.name).toBe('login')
  })

  it('exports the useLoginMutation hook', () => {
    expect(authApiSlice.useLoginMutation).toBeDefined()
    expect(typeof authApiSlice.useLoginMutation).toBe('function')
  })

  it('defines the logout endpoint', () => {
    expect(authApiSlice.endpoints.logout).toBeDefined()
    expect(authApiSlice.endpoints.logout.name).toBe('logout')
  })

  it('exports the useLogoutMutation hook', () => {
    expect(authApiSlice.useLogoutMutation).toBeDefined()
    expect(typeof authApiSlice.useLogoutMutation).toBe('function')
  })
})

describe('authApiSlice logout', () => {
  const mockUser = {
    _id: '1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'user',
    active: true,
  }

  const createCombinedStore = () =>
    configureStore({
      reducer: {
        [authApiSlice.reducerPath]: authApiSlice.reducer,
        authStorage: authStorageReducer,
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(authApiSlice.middleware),
    })

  it('clears the authStorage auth state', async () => {
    const store = createCombinedStore()
    store.dispatch(loginSuccess({ user: mockUser, token: 'jwt-token' }))
    expect(selectIsAuthenticated(store.getState())).toBe(true)

    await store.dispatch(authApiSlice.endpoints.logout.initiate())

    expect(selectIsAuthenticated(store.getState())).toBe(false)
  })

  it('clears localStorage', async () => {
    const store = createCombinedStore()
    store.dispatch(loginSuccess({ user: mockUser, token: 'jwt-token' }))

    await store.dispatch(authApiSlice.endpoints.logout.initiate())

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('tokenExpiresAt')).toBeNull()
  })
})

describe('authApiSlice login (fetch integration)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a POST request to the correct endpoint with the credentials as the body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(mockAuthResponse)))

    const store = createTestStore()
    await store.dispatch(authApiSlice.endpoints.login.initiate(mockCredentials))

    const request = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as Request
    expect(String(request.url)).toContain('/api/v1/users/login')
    expect(request.method).toBe('POST')
    expect(await request.clone().json()).toEqual(mockCredentials)
  })

  it('returns the auth token and user on a successful login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(mockAuthResponse)))

    const store = createTestStore()
    const result = await store.dispatch(
      authApiSlice.endpoints.login.initiate(mockCredentials),
    )

    expect('error' in result).toBe(false)
    expect(result.data).toEqual(mockAuthResponse)
  })

  it('surfaces an error when the backend rejects the credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse(
          { status: 'fail', message: 'Incorrect email or password' },
          { ok: false, status: 401 },
        ),
      ),
    )

    const store = createTestStore()
    const result = await store.dispatch(
      authApiSlice.endpoints.login.initiate(mockCredentials),
    )

    expect('error' in result).toBe(true)
    expect(result.error).toMatchObject({ status: 401 })
  })
})
