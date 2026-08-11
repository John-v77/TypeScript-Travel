import "./footer.css"

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo-section">
          <div className="footer-logo">Natours</div>
          <p className="footer-description">
            Unforgettable tours for adventurous people
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h3 className="footer-title">Company</h3>
            <ul className="footer-list">
              <li>
                <a href="/about">About Us</a>
              </li>
              <li>
                <a href="/careers">Careers</a>
              </li>
              <li>
                <a href="/press">Press</a>
              </li>
              <li>
                <a href="/news">News</a>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Support</h3>
            <ul className="footer-list">
              <li>
                <a href="/help">Help Center</a>
              </li>
              <li>
                <a href="/contact">Contact</a>
              </li>
              <li>
                <a href="/privacy">Privacy</a>
              </li>
              <li>
                <a href="/terms">Terms</a>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Follow Us</h3>
            <ul className="footer-list">
              <li>
                <a href="#">Facebook</a>
              </li>
              <li>
                <a href="#">Instagram</a>
              </li>
              <li>
                <a href="#">Twitter</a>
              </li>
              <li>
                <a href="#">YouTube</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Natours. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
