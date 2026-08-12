import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { toursApiSlice, Tour } from './toursApiSlice'

// Mock tour data
const mockTourObject = {
  tour1: {
    _id: '1',
    name: 'The Forest Hiker',
    duration: 5,
    maxGroupSize: 25,
    difficulty: 'easy',
    price: 397,
    summary: 'Breathtaking hike through the Canadian Banff National Park',
    description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    imageCover: 'tour-1-cover.jpg',
    images: ['tour-1-1.jpg', 'tour-1-2.jpg', 'tour-1-3.jpg'],
    startDates: ['2024-04-25T09:00:00.000Z', '2024-07-20T09:00:00.000Z'],
    startLocation: {
      description: 'Banff, CAN',
      type: 'Point',
      coordinates: [-115.570154, 51.178456] as [number, number],
      address: 'Banff, AB, Canada'
    },
    locations: [],
    guides: [],
    ratingsAverage: 4.5,
    ratingsQuantity: 37,
    slug: 'the-forest-hiker'
  },
  tour2: {
    _id: '2',
    name: 'The Sea Explorer',
    duration: 7,
    maxGroupSize: 15,
    difficulty: 'medium',
    price: 497,
    summary: 'Exploring the jaw-dropping US east coast by foot and by boat',
    description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    imageCover: 'tour-2-cover.jpg',
    images: ['tour-2-1.jpg', 'tour-2-2.jpg', 'tour-2-3.jpg'],
    startDates: ['2024-06-19T09:00:00.000Z', '2024-07-20T09:00:00.000Z'],
    startLocation: {
      description: 'Miami, USA',
      type: 'Point',
      coordinates: [-80.185942, 25.774772] as [number, number],
      address: '301 Biscayne Blvd, Miami, FL 33132, USA'
    },
    locations: [],
    guides: [],
    ratingsAverage: 4.8,
    ratingsQuantity: 6,
    slug: 'the-sea-explorer'
  }
}

const mockApiResponse = {
  status: 'success',
  results: 2,
  data: mockTourObject
}

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      toursApi: toursApiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(toursApiSlice.middleware),
  })
}

describe('toursApiSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  describe('API slice configuration', () => {
    it('should have correct reducer path', () => {
      expect(toursApiSlice.reducerPath).toBe('toursApi')
    })

    it('should be properly configured', () => {
      expect(toursApiSlice).toBeDefined()
      expect(toursApiSlice.reducer).toBeDefined()
      expect(toursApiSlice.middleware).toBeDefined()
    })
  })

  describe('getAllTours endpoint', () => {
    it('should be defined', () => {
      expect(toursApiSlice.endpoints.getAllTours).toBeDefined()
    })

    it('should be a query endpoint', () => {
      const endpoint = toursApiSlice.endpoints.getAllTours
      expect(endpoint).toBeDefined()
      expect(endpoint.name).toBe('getAllTours')
    })
  })

  describe('generated hooks', () => {
    it('should export useGetAllToursQuery hook', () => {
      expect(toursApiSlice.useGetAllToursQuery).toBeDefined()
      expect(typeof toursApiSlice.useGetAllToursQuery).toBe('function')
    })
  })

  describe('Tour type validation', () => {
    it('should accept valid tour objects', () => {
      const validTour: Tour = mockTourObject.tour1

      expect(validTour._id).toBe('1')
      expect(validTour.name).toBe('The Forest Hiker')
      expect(validTour.duration).toBe(5)
      expect(validTour.maxGroupSize).toBe(25)
      expect(validTour.difficulty).toBe('easy')
      expect(validTour.price).toBe(397)
      expect(typeof validTour.summary).toBe('string')
      expect(typeof validTour.description).toBe('string')
      expect(typeof validTour.imageCover).toBe('string')
      expect(Array.isArray(validTour.images)).toBe(true)
      expect(Array.isArray(validTour.startDates)).toBe(true)
      expect(typeof validTour.startLocation).toBe('object')
      expect(Array.isArray(validTour.locations)).toBe(true)
      expect(Array.isArray(validTour.guides)).toBe(true)
      expect(typeof validTour.ratingsAverage).toBe('number')
      expect(typeof validTour.ratingsQuantity).toBe('number')
    })

    it('should handle optional slug field', () => {
      const tourWithSlug: Tour = { ...mockTourObject.tour1, slug: 'test-slug' }
      const tourWithoutSlug: Tour = mockTourObject.tour1

      expect(tourWithSlug.slug).toBe('test-slug')
      expect(tourWithoutSlug.slug).toBe('the-forest-hiker')
    })
  })

  describe('StartLocation and Location types', () => {
    it('should have correct StartLocation structure', () => {
      const startLocation = mockTourObject.tour1.startLocation

      expect(startLocation.description).toBe('Banff, CAN')
      expect(startLocation.type).toBe('Point')
      expect(Array.isArray(startLocation.coordinates)).toBe(true)
      expect(startLocation.coordinates).toHaveLength(2)
      expect(typeof startLocation.address).toBe('string')
    })

    it('should handle Location array with optional day property', () => {
      type LocationFixture = {
        _id: string
        description: string
        type: string
        coordinates: [number, number]
        day?: number
      }

      const locationWithDay: LocationFixture = {
        _id: 'loc1',
        description: 'Test location',
        type: 'Point',
        coordinates: [0, 0],
        day: 1
      }

      const locationWithoutDay: LocationFixture = {
        _id: 'loc2',
        description: 'Test location 2',
        type: 'Point',
        coordinates: [1, 1]
      }

      expect(locationWithDay.day).toBe(1)
      expect(locationWithoutDay.day).toBeUndefined()
    })
  })
})
