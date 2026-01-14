import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { logout, user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/dashboard">Easy Living</Link>
        </div>

        <div className="nav-links">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
            <i className="icon-dashboard"></i>
            Dashboard
          </Link>
          <Link to="/houses" className={`nav-link ${isActive('/houses')}`}>
            <i className="icon-house"></i>
            My House
          </Link>
          <Link to="/bills" className={`nav-link ${isActive('/bills')}`}>
            <i className="icon-bill"></i>
            Bills
          </Link>
          <Link to="/wallet" className={`nav-link ${isActive('/wallet')}`}>
            <i className="icon-wallet"></i>
            Wallet
          </Link>
        </div>

        <div className="nav-actions">
          <span className="user-info">
            {user?.email && `Welcome, ${user.email.split('@')[0]}`}
          </span>
          <ThemeToggle />
          <button onClick={handleLogout} className="logout-btn">
            <i className="icon-logout"></i>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
