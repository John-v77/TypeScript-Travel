import { Navigate, Route, Routes } from "react-router-dom";
import { useAppSelector } from "./app/hooks";
import { selectTheme } from "./features/theme/themeSlice";
import Navbar from "./components/Navbar/navbar.component";
import Home from "./routes/Home/home.page";
import Footer from "./components/Footer/footer.component";
import ToursPage from "./routes/Tours/tours.page";
import TourDetails from "./routes/TourDetails/singleTourPage.page";
import BookTour from "./routes/BookTour/book-tour.page";
import TourCheckout from "./routes/TourCheckout/tour-checkout.page";
import GearPage from "./routes/Gear/gear.page";
import Cart from "./routes/Cart/cart.page";
import CartCheckout from "./routes/CartCheckout/cart-checkout.page";
import { useCartSync } from "./features/cartSlice/useCart";
import About from "./routes/About/about.page";
import Login from "./routes/Login/login.page";
import Register from "./routes/Register/register.page";
import ForgotPassword from "./routes/ForgotPassword/forgot-password.page";
import MyAccount from "./routes/Account/my-account.page";
import Settings from "./routes/Account/settings.tab";
import MyBookings from "./routes/Account/my-bookings.tab";
import MyFavorites from "./routes/Account/my-favorites.tab";
import MyReviews from "./routes/Account/my-reviews.tab";
import Billing from "./routes/Account/billing.tab";
import AuthGuard from "./components/AuthGuard/auth-guard.component";

export const App = () => {
  const theme = useAppSelector(selectTheme);
  // Merges the guest cart into the stored one when someone signs in.
  useCartSync();

  // `data-theme` switches every `dark:` class inside this div.
  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white"
    >
      <AuthGuard>
        <Routes>
          <Route path="/" element={<Navbar />}>
            <Route index element={<Home />} />
            <Route path="tours" element={<ToursPage />} />
            <Route path="tour/:slug" element={<TourDetails />} />
            <Route path="tour/:slug/book" element={<BookTour />} />
            <Route path="checkout/:slug" element={<TourCheckout />} />
            <Route path="gear" element={<GearPage />} />
            <Route path="cart" element={<Cart />} />
            <Route path="cart/checkout" element={<CartCheckout />} />
            <Route path="about" element={<About />} />
            <Route path="auth" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="myaccount" element={<MyAccount />}>
              <Route index element={<Navigate to="my-bookings" replace />} />
              <Route path="settings" element={<Settings />} />
              <Route path="my-bookings" element={<MyBookings />} />
              <Route path="my-favorites" element={<MyFavorites />} />
              <Route path="my-reviews" element={<MyReviews />} />
              <Route path="billing" element={<Billing />} />
            </Route>
          </Route>
        </Routes>
        <Footer />
      </AuthGuard>
    </div>
  );
};
