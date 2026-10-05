import { Navigate, Route, Routes } from "react-router-dom";
import { useAppSelector } from "./app/hooks";
import { selectTheme } from "./features/theme/themeSlice";
import Navbar from "./components/Navbar/navbar.component";
import Home from "./routes/Home/home.page";
import Footer from "./components/Footer/footer.component";
import ToursPage from "./routes/Tours/tours.page";
import TourDetails from "./routes/TourDetails/singleTourPage.page";
import GearPage from "./routes/Gear/gear.page";
import Login from "./routes/Login/login.page";
import Register from "./routes/Register/register.page";
import MyAccount from "./routes/Account/my-account.page";
import Settings from "./routes/Account/settings.tab";
import AuthGuard from "./components/AuthGuard/auth-guard.component";

export const App = () => {
  const theme = useAppSelector(selectTheme);

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
            <Route path="tour/:id" element={<TourDetails />} />
            <Route path="gear" element={<GearPage />} />
            <Route path="auth" element={<Login />} />
            <Route path="register" element={<Register />} />

            <Route path="myaccount" element={<MyAccount />}>
              <Route index element={<Navigate to="settings" replace />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
        <Footer />
      </AuthGuard>
    </div>
  );
};
