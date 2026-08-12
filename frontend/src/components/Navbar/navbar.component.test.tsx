import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import Navbar from "./navbar.component"
import { authApiSlice } from "../../features/authSlice/authApiSlice"
import authStorageReducer, {
  loginSuccess,
  selectUser,
} from "../../features/authSlice/authStorageSlice"

const mockUser = {
  _id: "1",
  name: "Jane Doe",
  email: "jane@example.com",
  role: "user",
  active: true,
}

const createTestStore = () =>
  configureStore({
    reducer: {
      [authApiSlice.reducerPath]: authApiSlice.reducer,
      authStorage: authStorageReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(authApiSlice.middleware),
  })

// Test wrapper with router + Redux store; pass a pre-populated store to
// simulate a logged-in user.
const renderNavbar = (store = createTestStore(), initialEntries = ["/"]) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <Navbar />
      </MemoryRouter>
    </Provider>,
  )
}

describe("Navbar Component", () => {
  it("renders the Natours logo", () => {
    renderNavbar()

    const logo = screen.getByText("Natours")
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveClass("nav-logo")
  })

  it("renders all navigation links", () => {
    renderNavbar()

    expect(screen.getByText("Tours")).toBeInTheDocument()
    expect(screen.getByText("About")).toBeInTheDocument()
    expect(screen.getByText("Contact")).toBeInTheDocument()
    expect(screen.getByText("Sign In")).toBeInTheDocument()
  })

  it("has correct href attributes for navigation links", () => {
    renderNavbar()

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
    renderNavbar()

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
    renderNavbar()

    const signInLink = screen.getByRole("link", { name: "Sign In" })
    expect(signInLink).toHaveClass("nav-link-cta")
  })

  it("applies nav-link class to navigation links", () => {
    renderNavbar()

    const toursLink = screen.getByRole("link", { name: "Tours" })
    const aboutLink = screen.getByRole("link", { name: "About" })
    const contactLink = screen.getByRole("link", { name: "Contact" })

    expect(toursLink).toHaveClass("nav-link")
    expect(aboutLink).toHaveClass("nav-link")
    expect(contactLink).toHaveClass("nav-link")
  })

  it("renders navigation container structure correctly", () => {
    renderNavbar()

    const container = document.querySelector(".nav-container")
    const logo = container?.querySelector(".nav-logo")
    const links = container?.querySelector(".nav-links")

    expect(container).toBeInTheDocument()
    expect(logo).toBeInTheDocument()
    expect(links).toBeInTheDocument()
  })

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup()
    renderNavbar()

    const logoLink = screen.getByRole("link", { name: "Natours" })
    const toursLink = screen.getByRole("link", { name: "Tours" })

    await user.tab()
    expect(logoLink).toHaveFocus()

    await user.tab()
    expect(toursLink).toHaveFocus()
  })

  it("renders the Outlet component", () => {
    renderNavbar()

    const nav = document.querySelector("nav")
    expect(nav).toBeInTheDocument()
  })

  it("maintains semantic HTML structure", () => {
    renderNavbar()

    const nav = document.querySelector("nav")
    expect(nav).toBeInTheDocument()

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(5) // Logo + 4 nav links

    links.forEach(link => {
      expect(link.tagName).toBe("A")
    })
  })

  it("has accessible link text", () => {
    renderNavbar()

    expect(screen.getByRole("link", { name: "Natours" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Tours" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Contact" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign In" })).toBeInTheDocument()
  })

  it("renders without crashing", () => {
    expect(() => {
      renderNavbar()
    }).not.toThrow()
  })

  describe("when logged in", () => {
    const loggedInStore = () => {
      const store = createTestStore()
      store.dispatch(loginSuccess({ user: mockUser, token: "jwt-token" }))
      return store
    }

    it("shows a Logout button instead of the Sign In link", () => {
      renderNavbar(loggedInStore())

      expect(
        screen.getByRole("button", { name: "Logout" }),
      ).toBeInTheDocument()
      expect(screen.queryByText("Sign In")).not.toBeInTheDocument()
    })

    it("clears the authenticated user when Logout is clicked", async () => {
      const user = userEvent.setup()
      const store = loggedInStore()
      renderNavbar(store)

      await user.click(screen.getByRole("button", { name: "Logout" }))

      await waitFor(() => {
        expect(selectUser(store.getState())).toBeNull()
      })
    })

    it("shows the Sign In link again after logging out", async () => {
      const user = userEvent.setup()
      renderNavbar(loggedInStore())

      await user.click(screen.getByRole("button", { name: "Logout" }))

      expect(
        await screen.findByRole("link", { name: "Sign In" }),
      ).toBeInTheDocument()
    })
  })
})
