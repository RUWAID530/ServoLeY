import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo">
          <h1>ServoLeY</h1>
        </div>
        <nav className="nav-links">
          <Link to="/about">About</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </header>

      <main className="landing-main">
        <div className="hero-content">
          <h1>Find Trusted Services Near You</h1>
          <p>Connect with verified service providers for all your home and business needs. Book appointments, track progress, and pay securely all in one place.</p>
          <div className="cta-buttons">
            <Link to="/customer-login-signup" className="cta-button primary">Get Started</Link>
            <Link to="/services" className="cta-button secondary">Browse Services</Link>
          </div>
        </div>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3>Verified Professionals</h3>
            <p>All service providers are background-checked and verified for your safety and peace of mind.</p>
          </div>

          <div className="feature">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3>Easy Scheduling</h3>
            <p>Book appointments at your convenience with real-time availability updates from service providers.</p>
          </div>

          <div className="feature">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <h3>Secure Payments</h3>
            <p>Pay safely through our platform with multiple payment options and transparent pricing.</p>
          </div>
        </div>

        <div className="testimonial">
          <h2>What Our Customers Say</h2>
          <blockquote>
            "ServiceHub made finding a reliable plumber so easy! The booking process was simple, and I could track when they would arrive. Highly recommend!"
          </blockquote>
          <cite>- Sarah Johnson</cite>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>ServoLeY</h2>
            <p>Connecting customers with trusted service providers</p>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h3>Company</h3>
              <Link to="/about">About Us</Link>
              <Link to="/careers">Careers</Link>
              <Link to="/press">Press</Link>
            </div>
            <div className="link-group">
              <h3>Partners</h3>
              <a href="/provider-pwa" target="_blank" rel="noopener noreferrer">Become a Provider</a>
            </div>
            <div className="link-group">
              <h3>Support</h3>
              <Link to="/help">Help Center</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/faq">FAQ</Link>
            </div>
            <div className="link-group">
              <h3>Legal</h3>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/cookies">Cookie Policy</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2023 ServoLeY. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
