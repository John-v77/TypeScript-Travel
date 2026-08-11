import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "./footer.component";

// Mock current date for consistent copyright year testing
const mockDate = new Date("2024-01-01");

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);
});

afterAll(() => {
  vi.useRealTimers();
});

describe("Footer Component", () => {
  it("renders the Natours logo", () => {
    render(<Footer />);

    const logo = screen.getByText("Natours");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass("footer-logo");
  });

  it("renders the footer description", () => {
    render(<Footer />);

    const description = screen.getByText(
      "Unforgettable tours for adventurous people",
    );
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass("footer-description");
  });

  it("renders all footer link sections", () => {
    render(<Footer />);

    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByText("Follow Us")).toBeInTheDocument();
  });

  it("renders all company links", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "About Us" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Careers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Press" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "News" })).toBeInTheDocument();
  });

  it("renders all support links", () => {
    render(<Footer />);

    expect(
      screen.getByRole("link", { name: "Help Center" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toBeInTheDocument();
  });

  it("renders all social media links", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "Facebook" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Instagram" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Twitter" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "YouTube" })).toBeInTheDocument();
  });

  it("has correct href attributes for company links", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "About Us" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.getByRole("link", { name: "Careers" })).toHaveAttribute(
      "href",
      "/careers",
    );
    expect(screen.getByRole("link", { name: "Press" })).toHaveAttribute(
      "href",
      "/press",
    );
    expect(screen.getByRole("link", { name: "News" })).toHaveAttribute(
      "href",
      "/news",
    );
  });

  it("has correct href attributes for support links", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute(
      "href",
      "/help",
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
  });

  it("social media links use placeholder hrefs", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute(
      "href",
      "#",
    );
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "#",
    );
    expect(screen.getByRole("link", { name: "Twitter" })).toHaveAttribute(
      "href",
      "#",
    );
    expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      "#",
    );
  });

  it("displays current year in copyright", () => {
    render(<Footer />);

    const copyrightText = screen.getByText(
      /© \d{4} Natours\. All rights reserved\./,
    );
    expect(copyrightText).toBeInTheDocument();
  });

  it("applies correct CSS classes to main structure", () => {
    render(<Footer />);

    const footer = document.querySelector("footer");
    const container = document.querySelector(".footer-container");
    const logoSection = document.querySelector(".footer-logo-section");
    const links = document.querySelector(".footer-links");

    expect(footer).toHaveClass("footer");
    expect(container).toHaveClass("footer-container");
    expect(logoSection).toHaveClass("footer-logo-section");
    expect(links).toHaveClass("footer-links");
  });

  it("applies correct CSS classes to footer columns", () => {
    render(<Footer />);

    const columns = document.querySelectorAll(".footer-column");
    expect(columns).toHaveLength(3);

    columns.forEach(column => {
      expect(column).toHaveClass("footer-column");
    });
  });

  it("applies correct CSS classes to footer titles", () => {
    render(<Footer />);

    const titles = document.querySelectorAll(".footer-title");
    expect(titles).toHaveLength(3);

    const titleTexts = Array.from(titles).map(title => title.textContent);
    expect(titleTexts).toEqual(["Company", "Support", "Follow Us"]);
  });

  it("applies correct CSS classes to footer lists", () => {
    render(<Footer />);

    const lists = document.querySelectorAll(".footer-list");
    expect(lists).toHaveLength(3);

    lists.forEach(list => {
      expect(list).toHaveClass("footer-list");
    });
  });

  it("renders footer bottom section with correct class", () => {
    render(<Footer />);

    const footerBottom = document.querySelector(".footer-bottom");
    expect(footerBottom).toBeInTheDocument();
    expect(footerBottom).toHaveClass("footer-bottom");
  });

  it("has focusable links for keyboard navigation", () => {
    render(<Footer />);

    // Check that links are focusable
    const firstLink = screen.getByRole("link", { name: "About Us" });
    expect(firstLink).toBeInTheDocument();
    expect(firstLink).not.toHaveAttribute("tabIndex", "-1"); // Not disabled for keyboard nav
  });

  it("maintains semantic HTML structure", () => {
    render(<Footer />);

    // Check for semantic footer element
    const footer = document.querySelector("footer");
    expect(footer).toBeInTheDocument();

    // Check for proper heading elements
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(3);

    const headingTexts = headings.map(h => h.textContent);
    expect(headingTexts).toEqual(["Company", "Support", "Follow Us"]);
  });

  it("renders all links as proper anchor elements", () => {
    render(<Footer />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(12); // 4 company + 4 support + 4 social

    links.forEach(link => {
      expect(link.tagName).toBe("A");
    });
  });

  it("has accessible structure with proper lists", () => {
    render(<Footer />);

    const lists = document.querySelectorAll("ul");
    expect(lists).toHaveLength(3);

    lists.forEach(list => {
      const items = list.querySelectorAll("li");
      expect(items.length).toBeGreaterThan(0);

      items.forEach(item => {
        const link = item.querySelector("a");
        expect(link).toBeInTheDocument();
      });
    });
  });

  it("renders without crashing", () => {
    expect(() => {
      render(<Footer />);
    }).not.toThrow();
  });

  it("updates copyright year dynamically", () => {
    // Test with different year
    const futureDate = new Date("2025-06-15");
    vi.setSystemTime(futureDate);

    render(<Footer />);

    expect(
      screen.getByText(/© 2025 Natours\. All rights reserved\./),
    ).toBeInTheDocument();
  });
});
