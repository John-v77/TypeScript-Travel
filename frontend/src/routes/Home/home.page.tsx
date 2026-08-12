import React from "react";
import "./home.css";
import { Link } from "react-router-dom";

type TourCard = {
  id: number;
  title: string;
  imageUrl: string;
  duration: string;
  difficulty: string;
  price: number;
  route: string;
};

const featuredTours: TourCard[] = [
  {
    id: 1,
    title: "The Forest Hiker",
    imageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
    duration: "5 days",
    difficulty: "Easy",
    price: 397,
    route: "/tours/forest-hiker",
  },
  {
    id: 2,
    title: "The Sea Explorer",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    duration: "7 days",
    difficulty: "Medium",
    price: 497,
    route: "/tours/sea-explorer",
  },
  {
    id: 3,
    title: "The Snow Adventurer",
    imageUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    duration: "4 days",
    difficulty: "Difficult",
    price: 897,
    route: "/tours/snow-adventurer",
  },
];

function Home() {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Outdoors
            <span className="hero-subtitle">is where life happens</span>
          </h1>
          <Link to="/tours" className="btn btn-primary">
            Discover our tours
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">
                Exciting tours for adventurous people
              </h2>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Aperiam, ipsum sapiente aspernatur libero repellat quis
                consequatur ducimus quam nisi exercitationem omnis earum qui.
              </p>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Asperiores nulla deserunt voluptatum nam.
              </p>
              <Link to="/about" className="btn btn-text">
                Learn more &rarr;
              </Link>
            </div>
            <div className="about-images">
              <img
                src="https://images.unsplash.com/photo-1464822759844-d150baec328b?w=300"
                alt="Nature 1"
                className="about-image about-image-1"
              />
              <img
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300"
                alt="Nature 2"
                className="about-image about-image-2"
              />
              <img
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300"
                alt="Nature 3"
                className="about-image about-image-3"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="tours-section">
        <div className="page-container">
          <h2 className="section-title center">Most popular tours</h2>
          <div className="tours-grid">
            {featuredTours.map(tour => (
              <div key={tour.id} className="tour-card">
                <div className="tour-card-side tour-card-front">
                  <div
                    className="tour-card-picture"
                    style={{ backgroundImage: `url(${tour.imageUrl})` }}
                  >
                    &nbsp;
                  </div>
                  <h4 className="tour-card-heading">
                    <span className="tour-card-heading-span">{tour.title}</span>
                  </h4>
                  <div className="tour-card-details">
                    <ul>
                      <li>{tour.duration} tour</li>
                      <li>Up to 30 people</li>
                      <li>2 tour guides</li>
                      <li>Sleep in cozy hotels</li>
                      <li>Difficulty: {tour.difficulty}</li>
                    </ul>
                  </div>
                </div>
                <div className="tour-card-side tour-card-back">
                  <div className="tour-card-cta">
                    <div className="tour-card-price-box">
                      <p className="tour-card-price-only">Only</p>
                      <p className="tour-card-price-value">${tour.price}</p>
                    </div>
                    <Link to={tour.route} className="btn btn-primary">
                      Book now!
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="center" style={{ marginTop: "5rem" }}>
            <Link to="/tours" className="btn btn-primary">
              Discover all tours
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
