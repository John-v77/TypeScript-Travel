import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReviewCard, { type Review } from "./reviewCard.component";

const baseReview: Review = {
  _id: "1",
  review: "Amazing trip, would book again!",
  rating: 4,
  user: {
    _id: "u1",
    name: "Jim Brown",
    photo: "user-1.jpg",
  },
};

describe("ReviewCard Component", () => {
  it("renders the reviewer name", () => {
    render(<ReviewCard review={baseReview} />);

    const name = screen.getByText("Jim Brown");
    expect(name).toBeInTheDocument();
    expect(name).toHaveClass("reviews__user");
  });

  it("renders the review text", () => {
    render(<ReviewCard review={baseReview} />);

    const text = screen.getByText("Amazing trip, would book again!");
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass("reviews__text");
  });

  it("renders the reviewer avatar with correct src and alt", () => {
    render(<ReviewCard review={baseReview} />);

    const avatar = screen.getByAltText("Jim Brown");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "/img/users/user-1.jpg");
    expect(avatar).toHaveClass("reviews__avatar-img");
  });

  it("applies correct CSS classes to main structure", () => {
    render(<ReviewCard review={baseReview} />);

    const card = document.querySelector(".reviews__card");
    const avatarSection = document.querySelector(".reviews__avatar");
    const rating = document.querySelector(".reviews__rating");

    expect(card).toBeInTheDocument();
    expect(avatarSection).toBeInTheDocument();
    expect(rating).toBeInTheDocument();
  });

  it("renders 5 star icons", () => {
    render(<ReviewCard review={baseReview} />);

    const stars = document.querySelectorAll(".reviews__star");
    expect(stars).toHaveLength(5);
  });

  it("marks stars up to the rating as active and the rest inactive", () => {
    render(<ReviewCard review={baseReview} />);

    const stars = Array.from(document.querySelectorAll(".reviews__star"));
    const activeCount = stars.filter(star =>
      star.classList.contains("reviews__star--active"),
    ).length;
    const inactiveCount = stars.filter(star =>
      star.classList.contains("reviews__star--inactive"),
    ).length;

    expect(activeCount).toBe(baseReview.rating);
    expect(inactiveCount).toBe(5 - baseReview.rating);
  });

  it("marks all 5 stars active for a perfect rating", () => {
    const perfectReview: Review = { ...baseReview, rating: 5 };
    render(<ReviewCard review={perfectReview} />);

    const activeStars = document.querySelectorAll(".reviews__star--active");
    expect(activeStars).toHaveLength(5);
  });

  it("marks all 5 stars inactive for a zero rating", () => {
    const zeroReview: Review = { ...baseReview, rating: 0 };
    render(<ReviewCard review={zeroReview} />);

    const inactiveStars = document.querySelectorAll(
      ".reviews__star--inactive",
    );
    expect(inactiveStars).toHaveLength(5);
  });

  it("renders without crashing", () => {
    expect(() => {
      render(<ReviewCard review={baseReview} />);
    }).not.toThrow();
  });
});
