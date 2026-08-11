import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReviewCard, { type Review } from "../../components/ReviewCard/reviewCard.component";
import "./singleTourPage.css";

type Guide = {
  _id: string;
  name: string;
  email: string;
  photo: string;
  role: "lead-guide" | "guide";
};

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
  guides: Guide[];
  ratingsAverage: number;
  ratingsQuantity: number;
  slug?: string;
  reviews: Review[];
};

// Mock tour data - we'll replace this with actual API data later
const mockTour: Tour = {
  _id: "1",
  name: "The Forest Hiker",
  duration: 5,
  maxGroupSize: 25,
  difficulty: "easy",
  price: 397,
  summary: "Breathtaking hike through the Canadian Banff National Park",
  description:
    "Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\nIrure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
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
  locations: [
    {
      _id: "1",
      description: "Banff National Park",
      type: "Point",
      coordinates: [-115.570154, 51.178456],
      day: 1,
    },
    {
      _id: "2",
      description: "Jasper National Park",
      type: "Point",
      coordinates: [-118.081777, 52.873917],
      day: 3,
    },
  ],
  guides: [
    {
      _id: "1",
      name: "Steve T. Scaife",
      email: "steve@natours.io",
      photo: "user-19.jpg",
      role: "lead-guide",
    },
    {
      _id: "2",
      name: "Aarav Lynn",
      email: "aarav@natours.io",
      photo: "user-18.jpg",
      role: "guide",
    },
  ],
  ratingsAverage: 4.5,
  ratingsQuantity: 37,
  slug: "the-forest-hiker",
  reviews: [
    {
      _id: "1",
      review:
        "Cras mollis nisi parturient mi nec aliquet suspendisse sagittis eros condimentum scelerisque taciti mattis praesent feugiat eu nascetur a tincidunt",
      rating: 5,
      user: {
        _id: "1",
        name: "Jim Brown",
        photo: "user-1.jpg",
      },
    },
    {
      _id: "2",
      review:
        "Blandit varius nascetur est felis praesent lorem himenaeos pretium dapibus tellus bibendum consequat ac duis",
      rating: 5,
      user: {
        _id: "2",
        name: "Sophie Louise Hart",
        photo: "user-2.jpg",
      },
    },
  ],
};

// Overview Box Component
const OverviewBox = ({
  label,
  text,
  icon,
}: {
  label: string;
  text: string;
  icon: string;
}) => {
  return (
    <div className="overview-box__detail">
      <svg className="overview-box__icon">
        <use xlinkHref={`/img/icons.svg#icon-${icon}`}></use>
      </svg>
      <span className="overview-box__label">{label}</span>
      <span className="overview-box__text">{text}</span>
    </div>
  );
};

const TourDetails = () => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    // Simulate loading tour data based on slug
    const fetchTour = async () => {
      setTimeout(() => {
        setTour(mockTour);
        setLoading(false);
      }, 500);
    };

    fetchTour();
  }, [slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-us", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <main className="main">
        <div style={{ textAlign: "center", padding: "5rem" }}>
          Loading tour details...
        </div>
      </main>
    );
  }

  if (!tour) {
    return (
      <main className="main">
        <div style={{ textAlign: "center", padding: "5rem" }}>
          Tour not found.
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      {/* Header Section */}
      <section className="section-header">
        <div className="header__hero">
          <div className="header__hero-overlay">&nbsp;</div>
          <img
            className="header__hero-img"
            src={`/img/tours/${tour.imageCover}`}
            alt={tour.name}
          />
        </div>

        <div className="heading-box">
          <h1 className="heading-primary">
            <span>{tour.name} tour</span>
          </h1>
          <div className="heading-box__group">
            <div className="heading-box__detail">
              <svg className="heading-box__icon">
                <use xlinkHref="/img/icons.svg#icon-clock"></use>
              </svg>
              <span className="heading-box__text">{tour.duration} days</span>

              <svg className="heading-box__icon">
                <use xlinkHref="/img/icons.svg#icon-map-pin"></use>
              </svg>
              <span className="heading-box__text">
                {tour.startLocation.description}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="section-description">
        <div className="overview-box">
          <div>
            <div className="overview-box__group">
              <h2 className="heading-secondary ma-bt-lg">Quick facts</h2>

              <OverviewBox
                label="Next date"
                text={formatDate(tour.startDates[0])}
                icon="calendar"
              />
              <OverviewBox
                label="Difficulty"
                text={tour.difficulty}
                icon="trending-up"
              />
              <OverviewBox
                label="Participants"
                text={`${tour.maxGroupSize} people`}
                icon="user"
              />
              <OverviewBox
                label="Rating"
                text={`${tour.ratingsAverage.toFixed(1)} / 5`}
                icon="star"
              />
            </div>

            <div className="overview-box__group">
              <h2 className="heading-secondary ma-bt-lg">Your tour guides</h2>

              {tour.guides.map(guide => (
                <div key={guide._id} className="overview-box__detail">
                  <img
                    className="overview-box__img"
                    src={`/img/users/${guide.photo}`}
                    alt={guide.name}
                  />
                  <span className="overview-box__label">
                    {guide.role === "lead-guide" ? "Lead guide" : "Tour guide"}
                  </span>
                  <span className="overview-box__text">{guide.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="description-box">
          <h2 className="heading-secondary ma-bt-lg">About {tour.name} tour</h2>
          {tour.description.split("\n").map((paragraph, index) => (
            <p key={index} className="description__text">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Pictures Section */}
      <section className="section-pictures">
        {tour.images.map((img, index) => (
          <div key={index} className="picture-box">
            <img
              className={`picture-box__img picture-box__img--${index + 1}`}
              src={`/img/tours/${img}`}
              alt={`${tour.name} ${index + 1}`}
            />
          </div>
        ))}
      </section>

      {/* Map Section - Placeholder for now */}
      <section className="section-map">
        <div id="map" data-locations={JSON.stringify(tour.locations)}>
          <p style={{ textAlign: "center", padding: "10rem", color: "#777" }}>
            Map will be implemented here
          </p>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="section-reviews">
        <div className="reviews">
          {tour.reviews.slice(0, 3).map(review => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="section-cta">
        <div className="cta">
          <div className="cta__img cta__img--logo">
            <img src="/img/logo-white.png" alt="Natours logo" />
          </div>
          <img
            className="cta__img cta__img--1"
            src={`/img/tours/${tour.images[1]}`}
            alt="Tour picture"
          />
          <img
            className="cta__img cta__img--2"
            src={`/img/tours/${tour.images[2]}`}
            alt="Tour picture"
          />
          <div className="cta__content">
            <h2 className="heading-secondary">What are you waiting for?</h2>
            <p className="cta__text">
              {tour.duration} days. 1 adventure. Infinite memories. Make it
              yours today!
            </p>
            <button
              className="btn btn--green span-all-rows"
              data-tour-id={tour._id}
            >
              Book tour now!
            </button>
          </div>
        </div>
      </section>

      {/* Mobile CTA Section */}
      <section className="section-cta_mobile">
        <div className="cta__content">
          <h2 className="heading-secondary">What are you waiting for?</h2>
          <p className="cta__text">
            {tour.duration} days. 1 adventure. Infinite memories. Make it yours
            today!
          </p>
        </div>
        <div className="cta__content-mobile-btn">
          <button
            className="btn btn--green span-all-rows"
            data-tour-id={tour._id}
          >
            Book tour now!
          </button>
        </div>
      </section>
    </main>
  );
};

export default TourDetails;
