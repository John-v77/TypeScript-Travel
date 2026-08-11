import React, { useEffect, useState } from "react";
import "./tours-page.css";

type Location = {
  _id: string;
  description: string;
  type: string;
  coordinates: [number, number];
  day?: number;
};

type StartLocation = {
  description: string;
  type: string;
  coordinates: [number, number];
  address: string;
};

type Tour = {
  _id: string;
  name: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  price: number;
  summary: string;
  description: string;
  imageCover: string;
  images: string[];
  startDates: string[];
  startLocation: StartLocation;
  locations: Location[];
  guides: string[];
  ratingsAverage: number;
  ratingsQuantity: number;
  slug?: string;
};

// Mock tours data - we'll replace this with actual data later
const mockTours: Tour[] = [
  {
    _id: "1",
    name: "The Forest Hiker",
    duration: 5,
    maxGroupSize: 25,
    difficulty: "easy",
    price: 397,
    summary: "Breathtaking hike through the Canadian Banff National Park",
    description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
    imageCover: "tour-1-cover.jpg",
    images: ["tour-1-1.jpg", "tour-1-2.jpg", "tour-1-3.jpg"],
    startDates: [
      "2024-04-25T09:00:00.000Z",
      "2024-07-20T09:00:00.000Z",
      "2024-10-05T09:00:00.000Z",
    ],
    startLocation: {
      description: "Banff, CAN",
      type: "Point",
      coordinates: [-115.570154, 51.178456],
      address: "Banff, AB, Canada",
    },
    locations: [],
    guides: [],
    ratingsAverage: 4.5,
    ratingsQuantity: 37,
    slug: "the-forest-hiker",
  },
  {
    _id: "2",
    name: "The Sea Explorer",
    duration: 7,
    maxGroupSize: 15,
    difficulty: "medium",
    price: 497,
    summary: "Exploring the jaw-dropping US east coast by foot and by boat",
    description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
    imageCover: "tour-2-cover.jpg",
    images: ["tour-2-1.jpg", "tour-2-2.jpg", "tour-2-3.jpg"],
    startDates: [
      "2024-06-19T09:00:00.000Z",
      "2024-07-20T09:00:00.000Z",
      "2024-08-18T09:00:00.000Z",
    ],
    startLocation: {
      description: "Miami, USA",
      type: "Point",
      coordinates: [-80.185942, 25.774772],
      address: "301 Biscayne Blvd, Miami, FL 33132, USA",
    },
    locations: [],
    guides: [],
    ratingsAverage: 4.8,
    ratingsQuantity: 6,
    slug: "the-sea-explorer",
  },
  {
    _id: "3",
    name: "The Snow Adventurer",
    duration: 4,
    maxGroupSize: 10,
    difficulty: "difficult",
    price: 897,
    summary: "Exciting adventure in the snow with snowboarding and skiing",
    description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
    imageCover: "tour-3-cover.jpg",
    images: ["tour-3-1.jpg", "tour-3-2.jpg", "tour-3-3.jpg"],
    startDates: [
      "2024-01-05T10:00:00.000Z",
      "2024-02-12T10:00:00.000Z",
      "2024-03-20T10:00:00.000Z",
    ],
    startLocation: {
      description: "Aspen, USA",
      type: "Point",
      coordinates: [-106.822318, 39.190872],
      address: "419 S Mill St, Aspen, CO 81611, USA",
    },
    locations: [],
    guides: [],
    ratingsAverage: 4.9,
    ratingsQuantity: 12,
    slug: "the-snow-adventurer",
  },
];

const ToursPage = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading tours data
    const fetchTours = async () => {
      // for now, we'll use mock data
      setTimeout(() => {
        setTours(mockTours);
        setLoading(false);
      }, 500);
    };

    fetchTours();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-us", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <main className="main">
        <div style={{ textAlign: "center", padding: "5rem" }}>
          Loading tours...
        </div>
      </main>
    );
  }
  return (
    <main className="main">
      <div className="card-container">
        {tours.map(tour => (
          <div key={tour._id} className="card">
            <div className="card__header">
              <div className="card__picture">
                <div className="card__picture-overlay">&nbsp;</div>
                <img
                  className="card__picture-img"
                  src={`/img/tours/${tour.imageCover}`}
                  alt={tour.name}
                />
              </div>
              <h3 className="heading-tertirary">
                <span>{tour.name}</span>
              </h3>
            </div>

            <div className="card__details">
              <h4 className="card__sub-heading">
                {tour.difficulty} {tour.duration}-day tour
              </h4>
              <p className="card__text">{tour.summary}</p>

              <div className="card__data">
                <svg className="card__icon">
                  <use xlinkHref="/img/icons.svg#icon-map-pin"></use>
                </svg>
                <span>{tour.startLocation.description}</span>
              </div>

              <div className="card__data">
                <svg className="card__icon">
                  <use xlinkHref="/img/icons.svg#icon-calendar"></use>
                </svg>
                <span>{formatDate(tour.startDates[0])}</span>
              </div>

              <div className="card__data">
                <svg className="card__icon">
                  <use xlinkHref="/img/icons.svg#icon-flag"></use>
                </svg>
                <span>{tour.locations.length || 3} stops</span>
              </div>

              <div className="card__data">
                <svg className="card__icon">
                  <use xlinkHref="/img/icons.svg#icon-user"></use>
                </svg>
                <span>{tour.maxGroupSize} people</span>
              </div>
            </div>

            <div className="card__footer">
              <p>
                <span className="card__footer-value">${tour.price}</span>
                <span className="card__footer-text"> per person</span>
              </p>
              <p className="card__ratings">
                <span className="card__footer-value">
                  {parseFloat(tour.ratingsAverage.toString()).toFixed(1)}
                </span>
                <span className="card__footer-text">
                  {" "}
                  rating ({tour.ratingsQuantity})
                </span>
              </p>
              <a
                className="btn btn--green btn--small"
                href={`/tour/${tour.slug}`}
              >
                Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default ToursPage;
