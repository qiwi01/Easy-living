import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { logout, user, token } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/dashboard" onClick={closeMobileMenu}>
            🏠 Easy Living
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-nav">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
            📊 Dashboard
          </Link>
          <Link to="/houses" className={`nav-link ${isActive('/houses')}`}>
            🏘️ My House
          </Link>
          <Link to="/bills" className={`nav-link ${isActive('/bills')}`}>
            💰 Bills
          </Link>
          <Link to="/wallet" className={`nav-link ${isActive('/wallet')}`}>
            👛 Wallet
          </Link>
          <Link to="/messages" className={`nav-link ${isActive('/messages')}`}>
            💬 Messages
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <div className="nav-actions">
          <span className="user-info">
            {user?.email && `Hi, ${user.email.split('@')[0]}`}
          </span>
          <ThemeToggle />
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <Link to="/dashboard" className={`mobile-nav-link ${isActive('/dashboard')}`} onClick={closeMobileMenu}>
          📊 Dashboard
        </Link>
        <Link to="/houses" className={`mobile-nav-link ${isActive('/houses')}`} onClick={closeMobileMenu}>
          🏘️ My House
        </Link>
        <Link to="/bills" className={`mobile-nav-link ${isActive('/bills')}`} onClick={closeMobileMenu}>
          💰 Bills
        </Link>
        <Link to="/wallet" className={`mobile-nav-link ${isActive('/wallet')}`} onClick={closeMobileMenu}>
          👛 Wallet
        </Link>
        <Link to="/messages" className={`mobile-nav-link ${isActive('/messages')}`} onClick={closeMobileMenu}>
          💬 Messages
        </Link>
        <div className="mobile-nav-divider"></div>
        <button onClick={handleLogout} className="mobile-logout-btn">
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
