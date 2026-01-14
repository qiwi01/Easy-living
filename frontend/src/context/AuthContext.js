import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        // Set token in axios defaults for backward compatibility
        axios.defaults.headers.common['x-auth-token'] = storedToken;
        setToken(storedToken);

        try {
          // Verify token is still valid by calling a protected endpoint
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
            headers: { 'x-auth-token': storedToken }
          });
          setUser(response.data);
        } catch (error) {
          // Token is invalid or expired, clear it
          console.log('Token expired or invalid, clearing...');
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['x-auth-token'];
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    axios.defaults.headers.common['x-auth-token'] = newToken;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
