import "./navbar.css";
import { Link, Outlet } from "react-router-dom";

function Navbar() {
  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            Natours
          </Link>
          <div className="nav-links">
            <Link to="/tours" className="nav-link">
              Tours
            </Link>
            <Link to="/about" className="nav-link">
              About
            </Link>
            <Link to="/contact" className="nav-link">
              Contact
            </Link>
            <Link to="/auth" className="nav-link nav-link-cta">
              Sign In
            </Link>
          </div>
        </div>
      </nav>
      <Outlet />
    </>
  );
}

export default Navbar;
