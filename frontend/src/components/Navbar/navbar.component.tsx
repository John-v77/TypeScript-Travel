import "./navbar.css";
import { Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../features/authSlice/authStorageSlice";
import { useLogoutMutation } from "../../features/authSlice/authApiSlice";

function Navbar() {
  const user = useSelector(selectUser);
  const [logout] = useLogoutMutation();

  const handleLogout = () => {
    logout();
  };

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
            {user ? (
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            ) : (
              <Link to="/auth" className="nav-link nav-link-cta">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
      <Outlet />
    </>
  );
}

export default Navbar;
