import { screen, within } from "@testing-library/react"
import { App } from "./App"
import { renderWithProviders } from "./utils/test-utils"

test("App should have correct initial render", () => {
  renderWithProviders(<App />)

  // Check that the Natours app is rendered correctly
  expect(screen.getByRole("link", { name: "Natours" })).toBeInTheDocument()
  expect(screen.getByText(/Outdoors/)).toBeInTheDocument()
  expect(screen.getByText("is where life happens")).toBeInTheDocument()
})

test("Navigation links are present", () => {
  renderWithProviders(<App />)

  // Footer also has a "Contact" link, so scope to the nav bar
  const nav = within(screen.getByRole("navigation"))
  expect(nav.getByRole("link", { name: "Tours" })).toBeInTheDocument()
  expect(nav.getByRole("link", { name: "About" })).toBeInTheDocument()
  expect(nav.getByRole("link", { name: "Contact" })).toBeInTheDocument()
  expect(nav.getByRole("link", { name: "Sign In" })).toBeInTheDocument()
})

test("Footer is rendered", () => {
  renderWithProviders(<App />)

  // Check footer content
  expect(
    screen.getByText("Unforgettable tours for adventurous people"),
  ).toBeInTheDocument()
  expect(screen.getByText("Company")).toBeInTheDocument()
  expect(screen.getByText("Support")).toBeInTheDocument()
  expect(screen.getByText("Follow Us")).toBeInTheDocument()
})

test("Home page content is displayed", () => {
  renderWithProviders(<App />)

  // Check main call-to-action
  expect(
    screen.getByRole("link", { name: "Discover our tours" }),
  ).toBeInTheDocument()
  expect(
    screen.getByText("Exciting tours for adventurous people"),
  ).toBeInTheDocument()
})
