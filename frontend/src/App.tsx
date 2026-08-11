import { Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar/navbar.component";
import Home from "./routes/Home/home.page";
import Footer from "./components/Footer/footer.component";
import ToursPage from "./routes/Tours/tours.page";
import TourDetails from "./routes/TourDetails/singleTourPage.page";

export const App = () => (
  <div className="App">
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<Home />} />
        <Route path="tours" element={<ToursPage />} />
        <Route path="tour/:slug" element={<TourDetails />} />
      </Route>
    </Routes>
    <Footer />
  </div>
);
