import React from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS
import '../Header/Header.css';
import oulogo from "../../assets/images/Eng_college_log.png";


const Header = () => {
  const navigate = useNavigate(); // ✅ ADD THIS

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <img src={oulogo} alt="OU Logo" className="logo-icon" />
          <h1 className="site-title">LMS</h1>
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