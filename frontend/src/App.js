import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import Houses from './pages/Houses';
import Bills from './pages/Bills';
import Wallet from './pages/Wallet';
import MessageBoard from './pages/MessageBoard';
import Navbar from './components/Navbar';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return token ? children : <Navigate to="/login" />;
};

// Main App Component
function AppContent() {
  const { token } = useAuth();

  return (
    <div className="App">
      {token && <Navbar />}
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/houses"
            element={
              <ProtectedRoute>
                <Houses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bills"
            element={
              <ProtectedRoute>
                <Bills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessageBoard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
