import type { User } from "../features/authSlice/authApiSlice";
import type { CartItem } from "../features/cartSlice/cartSlice";
import type { Gear } from "../features/gear/gearApiSlice";
import type { TourReview } from "../features/reviews/reviewsApiSlice";
import type { Tour } from "../features/tours/toursApiSlice";

/**
 * Fixtures for the component tests. Each builder returns a complete, valid
 * record shaped like the real API response and takes an override object, so a
 * test states only the field it cares about:
 *
 *   makeTour({ name: "The Snow Adventurer", price: 2599 })
 */

export const makeTour = (overrides: Partial<Tour> = {}): Tour => ({
  id: "5c88fa8cf4afda39709c2955",
  name: "The Sea Explorer",
  duration: 7,
  maxGroupSize: 15,
  difficulty: "medium",
  price: 599,
  summary: "Exploring the jaw-dropping US east coast by foot and by boat",
  description: "First paragraph.\nSecond paragraph.",
  imageCover: "tour-2-cover.jpg",
  images: ["tour-2-1.jpg", "tour-2-2.jpg", "tour-2-3.jpg"],
  startDates: [
    {
      _id: "sd-1",
      id: "sd-1",
      date: "2027-05-01T09:00:00.000Z",
      participants: 0,
      soldOut: false,
    },
  ],
  startLocation: {
    description: "Miami, USA",
    type: "Point",
    coordinates: [-80.185942, 25.774772],
    address: "301 Biscayne Blvd, Miami, FL 33132, USA",
  },
  locations: [
    {
      _id: "loc-1",
      description: "Lummus Park Beach",
      type: "Point",
      coordinates: [-80.128473, 25.781842],
      day: 1,
    },
    {
      _id: "loc-2",
      description: "Islamorada",
      type: "Point",
      coordinates: [-80.647885, 24.909047],
      day: 2,
    },
  ],
  guides: [
    {
      _id: "guide-1",
      name: "Miyah Myles",
      email: "miyah@example.com",
      photo: "user-12.jpg",
      role: "lead-guide",
    },
  ],
  ratingsAverage: 4.8,
  ratingsQuantity: 6,
  slug: "the-sea-explorer",
  ...overrides,
});

export const makeUser = (overrides: Partial<User> = {}): User => ({
  _id: "user-1",
  name: "Laura Wilson",
  email: "laura@example.com",
  role: "user",
  photo: "user-2.jpg",
  active: true,
  ...overrides,
});

/** Preloaded state for a signed-in visitor. */
export const signedInState = (user = makeUser()) => ({
  authStorage: {
    user,
    token: "test-token",
    isAuthenticated: true,
    expiresAt: Date.now() + 60 * 60 * 1000,
  },
});

export const makeGear = (overrides: Partial<Gear> = {}): Gear => ({
  _id: "gear-1",
  name: "Alpine Blue Jacket",
  price: 199.99,
  image: "/img/gear/jacket-blue.avif",
  description: "Waterproof and breathable jacket.",
  category: "jacket",
  ...overrides,
});

export const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: "gear-1",
  name: "Alpine Blue Jacket",
  price: 199.99,
  image: "/img/gear/jacket-blue.avif",
  description: "Waterproof and breathable jacket.",
  category: "jacket",
  quantity: 1,
  ...overrides,
});

/** Preloaded state for a cart holding `items`. */
export const cartState = (items: CartItem[] = [makeCartItem()]) => ({
  cart: { items, userId: null, lastUpdated: Date.now() },
});

export const makeReview = (
  overrides: Partial<TourReview> = {},
): TourReview => ({
  _id: "review-1",
  review: "Every day was better than the last.",
  rating: 5,
  createdAt: "2026-07-12T10:00:00.000Z",
  user: { _id: "user-2", name: "Max Smith", photo: "user-3.jpg" },
  ...overrides,
});
