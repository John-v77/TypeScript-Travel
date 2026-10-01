import { Route, Routes } from "react-router-dom";
import { useAppSelector } from "./app/hooks";
import { selectTheme } from "./features/theme/themeSlice";
import Navbar from "./components/Navbar/navbar.component";
import Home from "./routes/Home/home.page";
import Footer from "./components/Footer/footer.component";
import ToursPage from "./routes/Tours/tours.page";
import TourDetails from "./routes/TourDetails/singleTourPage.page";
import Login from "./routes/Login/login.page";
import AuthGuard from "./components/AuthGuard/auth-guard.component";

export const App = () => {
  const theme = useAppSelector(selectTheme);

  // `data-theme` switches every `dark:` class inside this div.
  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white"
    >
      <h1 className="text-3xl font-bold text-w_primary-600">Hello Tailwind</h1>
      {/* <AuthGuard>
        <Routes>
          <Route path="/" element={<Navbar />}>
            <Route index element={<Home />} />
            <Route path="tours" element={<ToursPage />} />
            <Route path="tour/:slug" element={<TourDetails />} />
            <Route path="auth" element={<Login />} />
          </Route>
        </Routes>
        <Footer />
      </AuthGuard> */}
    </div>
  );
};
