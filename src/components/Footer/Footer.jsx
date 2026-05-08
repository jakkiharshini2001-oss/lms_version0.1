import React from 'react';
import '../Footer/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-section">
            <h4>LMS</h4>
            <p className="footer-description">The premier learning management system for Osmania University, empowering educators and students to succeed.</p>
          </div>
          
          <div className="footer-section">
            <h5>Platform</h5>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#security">Security</a></li>
              <li><a href="#roadmap">Roadmap</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h5>Company</h5>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h5>Resources</h5>
            <ul className="footer-links">
              <li><a href="#docs">Documentation</a></li>
              <li><a href="#api">API Reference</a></li>
              <li><a href="#community">Community</a></li>
              <li><a href="#support">Support</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 LMS - Osmania University. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#cookies">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
