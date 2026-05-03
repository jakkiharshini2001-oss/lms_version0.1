import React from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS
import '../Header/Header.css';

const Header = () => {
  const navigate = useNavigate(); // ✅ ADD THIS

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <div className="logo-icon">OU</div>
          <h1 className="site-title">Luma</h1>
        </div>
        
        <nav className="nav-links">
          {/* ❌ avoid <a href="#"> */}
          <span className="nav-link" onClick={() => navigate("/")}>Home</span>
          <span className="nav-link">Courses</span>
          <span className="nav-link">FAQ</span>
        </nav>

        <div className="header-actions">
          <button className="btn-sign-in" onClick={() => navigate("/faculty/login")}>
            Sign in
          </button>

          {/* ✅ THIS IS YOUR MAIN FIX */}
          <button 
            className="btn-get-started"
            onClick={() => navigate("/faculty/signup")}
          >
            Get started
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;