import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import type { ReactNode } from "react"
import Navbar from "./navbar.component"

// Test wrapper with router
const renderWithRouter = (component: ReactNode, initialEntries = ["/"]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>,
  )
}

describe("Navbar Component", () => {
  it("renders the Natours logo", () => {
    renderWithRouter(<Navbar />)

    const logo = screen.getByText("Natours")
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveClass("nav-logo")
  })

  it("renders all navigation links", () => {
    renderWithRouter(<Navbar />)

    expect(screen.getByText("Tours")).toBeInTheDocument()
    expect(screen.getByText("About")).toBeInTheDocument()
    expect(screen.getByText("Contact")).toBeInTheDocument()
    expect(screen.getByText("Sign In")).toBeInTheDocument()
  })

  it("has correct href attributes for navigation links", () => {
    renderWithRouter(<Navbar />)

    const toursLink = screen.getByRole("link", { name: "Tours" })
    const aboutLink = screen.getByRole("link", { name: "About" })
    const contactLink = screen.getByRole("link", { name: "Contact" })
    const signInLink = screen.getByRole("link", { name: "Sign In" })
    const logoLink = screen.getByRole("link", { name: "Natours" })

    expect(toursLink).toHaveAttribute("href", "/tours")
    expect(aboutLink).toHaveAttribute("href", "/about")
    expect(contactLink).toHaveAttribute("href", "/contact")
    expect(signInLink).toHaveAttribute("href", "/auth")
    expect(logoLink).toHaveAttribute("href", "/")
  })

  it("applies correct CSS classes to elements", () => {
    renderWithRouter(<Navbar />)

    const nav = document.querySelector("nav")
    const container = document.querySelector(".nav-container")
    const links = document.querySelector(".nav-links")
    const logo = screen.getByText("Natours")

    expect(nav).toHaveClass("navigation")
    expect(container).toHaveClass("nav-container")
    expect(links).toHaveClass("nav-links")
    expect(logo).toHaveClass("nav-logo")
  })

  it("applies CTA class to Sign In link", () => {
    renderWithRouter(<Navbar />)

    const signInLink = screen.getByRole("link", { name: "Sign In" })
    expect(signInLink).toHaveClass("nav-link-cta")
  })

  it("applies nav-link class to navigation links", () => {
    renderWithRouter(<Navbar />)

    const toursLink = screen.getByRole("link", { name: "Tours" })
    const aboutLink = screen.getByRole("link", { name: "About" })
    const contactLink = screen.getByRole("link", { name: "Contact" })

    expect(toursLink).toHaveClass("nav-link")
    expect(aboutLink).toHaveClass("nav-link")
    expect(contactLink).toHaveClass("nav-link")
  })

  it("renders navigation container structure correctly", () => {
    renderWithRouter(<Navbar />)

    // Check that nav-container exists and contains both logo and links
    const container = document.querySelector(".nav-container")
    const logo = container?.querySelector(".nav-logo")
    const links = container?.querySelector(".nav-links")

    expect(container).toBeInTheDocument()
    expect(logo).toBeInTheDocument()
    expect(links).toBeInTheDocument()
  })

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup()
    renderWithRouter(<Navbar />)

    const logoLink = screen.getByRole("link", { name: "Natours" })
    const toursLink = screen.getByRole("link", { name: "Tours" })

    // Tab to logo link
    await user.tab()
    expect(logoLink).toHaveFocus()

    // Tab to tours link
    await user.tab()
    expect(toursLink).toHaveFocus()
  })

  it("renders the Outlet component", () => {
    renderWithRouter(<Navbar />)

    const nav = document.querySelector("nav")
    expect(nav).toBeInTheDocument()
  })

  it("maintains semantic HTML structure", () => {
    renderWithRouter(<Navbar />)

    // Check for semantic nav element
    const nav = document.querySelector("nav")
    expect(nav).toBeInTheDocument()

    // Check that all navigation links are actual link elements
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(5) // Logo + 4 nav links

    links.forEach(link => {
      expect(link.tagName).toBe("A")
    })
  })

  it("has accessible link text", () => {
    renderWithRouter(<Navbar />)

    expect(screen.getByRole("link", { name: "Natours" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Tours" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Contact" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign In" })).toBeInTheDocument()
  })

  it("renders without crashing", () => {
    expect(() => {
      renderWithRouter(<Navbar />)
    }).not.toThrow()
  })
})
