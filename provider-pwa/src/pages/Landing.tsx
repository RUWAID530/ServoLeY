import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>Service Provider Portal</h1>
        <p>Join our platform as a service provider and grow your business!</p>
        <div className="cta-buttons">
          <Link to="/provider-login-signup" className="cta-button primary">Register as Provider</Link>
          <Link to="/login" className="cta-button secondary">Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
