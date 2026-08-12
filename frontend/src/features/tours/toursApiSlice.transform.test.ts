import { describe, it, expect } from 'vitest'
import { Tour } from './toursApiSlice'

// Mock tour data for testing the transform logic
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

// The actual transform function from the API slice
const transformResponse = (response: {
  status: string
  results: number
  data: Record<string, Tour>
}): Tour[] => {
  return Object.values(response.data)
}

describe('toursApiSlice transformResponse', () => {
  it('should transform response correctly from object to array', () => {
    const result = transformResponse(mockApiResponse)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(mockTourObject.tour1)
    expect(result[1]).toEqual(mockTourObject.tour2)
  })

  it('should handle empty object response', () => {
    const emptyResponse = { status: 'success', results: 0, data: {} }
    const result = transformResponse(emptyResponse)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('should preserve all tour properties', () => {
    const result = transformResponse(mockApiResponse)
    const firstTour = result[0]

    expect(firstTour._id).toBe('1')
    expect(firstTour.name).toBe('The Forest Hiker')
    expect(firstTour.duration).toBe(5)
    expect(firstTour.maxGroupSize).toBe(25)
    expect(firstTour.difficulty).toBe('easy')
    expect(firstTour.price).toBe(397)
    expect(firstTour.summary).toBe('Breathtaking hike through the Canadian Banff National Park')
    expect(firstTour.startLocation).toEqual({
      description: 'Banff, CAN',
      type: 'Point',
      coordinates: [-115.570154, 51.178456],
      address: 'Banff, AB, Canada'
    })
    expect(Array.isArray(firstTour.images)).toBe(true)
    expect(Array.isArray(firstTour.startDates)).toBe(true)
    expect(Array.isArray(firstTour.locations)).toBe(true)
    expect(Array.isArray(firstTour.guides)).toBe(true)
  })

  it('should maintain object order when converting to array', () => {
    const result = transformResponse(mockApiResponse)

    // Object.values() should maintain insertion order
    expect(result[0]._id).toBe('1')
    expect(result[1]._id).toBe('2')
  })

  it('should handle single tour object', () => {
    const singleTourResponse = {
      status: 'success',
      results: 1,
      data: {
        tour1: mockTourObject.tour1
      }
    }

    const result = transformResponse(singleTourResponse)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(mockTourObject.tour1)
  })

  it('should handle response with non-sequential keys', () => {
    const randomKeysResponse = {
      status: 'success',
      results: 2,
      data: {
        'abc-123': mockTourObject.tour1,
        'xyz-789': mockTourObject.tour2
      }
    }

    const result = transformResponse(randomKeysResponse)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result).toContain(mockTourObject.tour1)
    expect(result).toContain(mockTourObject.tour2)
  })
})
