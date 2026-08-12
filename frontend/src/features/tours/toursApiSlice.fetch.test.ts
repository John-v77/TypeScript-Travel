import { describe, it, expect, vi, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { toursApiSlice } from './toursApiSlice'

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

const mockApiResponse = {
  status: 'success',
  results: 1,
  data: {
    tour1: {
      _id: '1',
      name: 'The Forest Hiker',
      duration: 5,
      maxGroupSize: 25,
      difficulty: 'easy',
      price: 397,
      summary: 'Breathtaking hike through the Canadian Banff National Park',
      description: 'Lorem ipsum dolor sit amet.',
      imageCover: 'tour-1-cover.jpg',
      images: ['tour-1-1.jpg'],
      startDates: ['2024-04-25T09:00:00.000Z'],
      startLocation: {
        description: 'Banff, CAN',
        type: 'Point',
        coordinates: [-115.570154, 51.178456] as [number, number],
        address: 'Banff, AB, Canada',
      },
      locations: [],
      guides: [],
      ratingsAverage: 4.5,
      ratingsQuantity: 37,
      slug: 'the-forest-hiker',
    },
  },
}

const createTestStore = () =>
  configureStore({
    reducer: { [toursApiSlice.reducerPath]: toursApiSlice.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(toursApiSlice.middleware),
  })

describe('toursApiSlice getAllTours (fetch integration)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests the correct backend endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(mockApiResponse)))

    const store = createTestStore()
    await store.dispatch(toursApiSlice.endpoints.getAllTours.initiate())

    const requestedUrl = String((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0].url)
    expect(requestedUrl).toContain('/api/v1/tours')
  })

  it('transforms the fetched response into a Tour array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(mockApiResponse)))

    const store = createTestStore()
    const result = await store.dispatch(
      toursApiSlice.endpoints.getAllTours.initiate(),
    )

    expect(result.status).toBe('fulfilled')
    expect(result.data).toEqual([mockApiResponse.data.tour1])
  })

  it('surfaces an error state when the backend request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({ status: 'error' }, { ok: false, status: 500 }),
      ),
    )

    const store = createTestStore()
    const result = await store.dispatch(
      toursApiSlice.endpoints.getAllTours.initiate(),
    )

    expect(result.status).toBe('rejected')
    expect(result.error).toBeDefined()
  })
})
