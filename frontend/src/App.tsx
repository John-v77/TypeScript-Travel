import { Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar/navbar.component";
import Home from "./routes/Home/home.page";
import Footer from "./components/Footer/footer.component";
import ToursPage from "./routes/Tours/tours.page";
import TourDetails from "./routes/TourDetails/singleTourPage.page";
import Login from "./routes/Login/login.page";
import AuthGuard from "./components/AuthGuard/auth-guard.component";

export const App = () => (
  <div className="App">
    <AuthGuard>
      <Routes>
        <Route path="/" element={<Navbar />}>
          <Route index element={<Home />} />
          <Route path="tours" element={<ToursPage />} />
          <Route path="tour/:slug" element={<TourDetails />} />
          <Route path="auth" element={<Login />} />
        </Route>
      </Routes>
      <Footer />
    </AuthGuard>
  </div>
);
