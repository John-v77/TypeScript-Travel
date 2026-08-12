import "./tours-page.css";
import { useGetAllToursQuery } from "../../features/tours/toursApiSlice";
import TourCard from "../../components/TourCard/tour.card.component";

const ToursPage = () => {
  console.log("[ToursPage] render");

  const { data: tours, error, isLoading } = useGetAllToursQuery();
  console.log("[ToursPage] query state:", { tours, error, isLoading });

  if (isLoading) {
    console.log("[ToursPage] loading tours...");
    return (
      <main className="main">
        <div style={{ textAlign: "center", padding: "5rem" }}>
          Loading tours...
        </div>
      </main>
    );
  }

  if (error) {
    console.log("[ToursPage] failed to load tours:", error);
    return (
      <main className="main">
        <div style={{ textAlign: "center", padding: "5rem" }}>
          Could not load tours. Please try again later.
        </div>
      </main>
    );
  }

  console.log("[ToursPage] rendering tours:", tours);
  return (
    <main className="main">
      <div className="card-container">
        {(tours ?? []).map(tour => (
          <TourCard key={tour._id} tour={tour} />
        ))}
      </div>
    </main>
  );
};

export default ToursPage;
