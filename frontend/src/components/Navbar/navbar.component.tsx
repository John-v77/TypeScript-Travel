import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectUser } from "../../features/authSlice/authStorageSlice";
import { selectTheme, toggleTheme } from "../../features/theme/themeSlice";
import {
  ctaClass,
  iconButtonClass,
  linkBase,
  mobileLinkBase,
  overlayIconButtonClass,
  overlayLinkBase,
} from "./navbar.styles";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/tours", label: "Tours" },
  { to: "/gear", label: "Gear" },
  { to: "/rentals", label: "Stays" },
  { to: "/map", label: "Map" },
  { to: "/feedback", label: "Feedback" },
];

const overlayRoutes = ["/"];
const overlayScrollLimit = 40;

const Navbar = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const theme = useAppSelector(selectTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  // Transparent only at the top of an overlay page, and never while the
  // mobile menu is open, so the menu always sits on a solid bar.
  const overlayRoute = overlayRoutes.includes(pathname);
  const overlay = overlayRoute && !scrolled && !menuOpen;

  useEffect(() => {
    if (!overlayRoute) return;

    const onScroll = () => {
      setScrolled(window.scrollY > overlayScrollLimit);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [overlayRoute]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => {
    if (overlay) {
      return isActive
        ? `${overlayLinkBase} text-white underline decoration-2 underline-offset-8`
        : `${overlayLinkBase} text-white/85`;
    }
    return isActive
      ? `${linkBase} text-w_primary-600 dark:text-w_primary-400`
      : `${linkBase} text-gray-700 dark:text-gray-300`;
  };

  const iconClass = overlay ? overlayIconButtonClass : iconButtonClass;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? `${mobileLinkBase} text-w_primary-600 dark:text-w_primary-400`
      : `${mobileLinkBase} text-gray-900 dark:text-white`;

  const accountActions = (className: string) =>
    user ? (
      <div className={className}>
        <Link to="/myaccount" aria-label="My Account" onClick={closeMenu}>
          <img
            src={`/img/users/${user.photo ?? "Default.jpg"}`}
            alt={user.name}
            className="size-9 rounded-full object-cover ring-2 ring-w_primary-600"
          />
        </Link>
      </div>
    ) : (
      <Link
        to="/auth"
        className={`${ctaClass} ${className}`}
        onClick={closeMenu}
      >
        Sign In
      </Link>
    );

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition duration-300 ${
          overlay
            ? "border-transparent bg-transparent"
            : "border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95"
        }`}
      >
        <nav className="mx-auto flex min-h-[72px] w-full max-w-page items-center justify-between gap-6 px-4 py-4 md:px-8">
          <Link
            to="/"
            className={`shrink-0 font-sans text-3xl leading-10 font-bold tracking-tight transition-colors duration-300 ${
              overlay
                ? "text-white text-shadow-md hover:text-w_primary-600"
                : "text-w_primary-600 hover:text-w_primary-700 dark:hover:text-w_primary-400"
            }`}
            onClick={closeMenu}
          >
            Voyara
          </Link>

          <div className="hidden flex-wrap items-center gap-6 md:flex">
            {navLinks.map(link => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                className={linkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              className={iconClass}
              onClick={() => dispatch(toggleTheme())}
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              aria-pressed={theme === "dark"}
            >
              {theme === "dark" ? (
                <svg className="size-5 fill-current">
                  <use href="/img/icons.svg#icon-sun" />
                </svg>
              ) : (
                <svg className="size-5 fill-current">
                  <use href="/img/icons.svg#icon-moon" />
                </svg>
              )}
            </button>

            {/* TODO: item-count badge once the cart slice exists. */}
            <Link
              to="/cart"
              className={iconClass}
              aria-label="Cart"
              onClick={closeMenu}
            >
              <svg className="size-5 fill-current">
                <use href="/img/icons.svg#icon-shopping-cart" />
              </svg>
            </Link>

            <div className="hidden md:block">
              {accountActions("flex items-center gap-2.5")}
            </div>

            <button
              type="button"
              className={`${iconClass} md:hidden`}
              onClick={() => {
                setMenuOpen(open => !open);
              }}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="app-mobile-menu"
            >
              {menuOpen ? (
                <svg className="size-6 fill-current">
                  <use href="/img/icons.svg#icon-x" />
                </svg>
              ) : (
                <svg className="size-6 fill-current">
                  <use href="/img/icons.svg#icon-menu" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        <div
          id="app-mobile-menu"
          hidden={!menuOpen}
          className="border-t border-gray-200 bg-white py-6 md:hidden dark:border-gray-800 dark:bg-gray-950"
        >
          <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 md:px-8">
            {navLinks.map(link => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                className={mobileLinkClass}
                onClick={closeMenu}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-2 border-t border-gray-200 pt-6 dark:border-gray-800">
              {accountActions(user ? "flex items-center gap-3" : "w-full py-3")}
            </div>
          </div>
        </div>
      </header>

      <Outlet />
    </>
  );
};

export default Navbar;
