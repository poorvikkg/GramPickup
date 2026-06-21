import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on startup
  useEffect(() => {
    const storedUser = localStorage.getItem('grampickup_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('grampickup_user');
      }
    }
    setLoading(false);
  }, []);

  // Standard API call helper
  const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle unauthorized session expiration
        if (response.status === 401) {
          logout();
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Fetch Error [${endpoint}]:`, error);
      throw error;
    }
  };

  // Login action
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('grampickup_user', JSON.stringify(data));
      setUser(data);
      return data;
    } catch (error) {
      console.error('Login action error:', error);
      throw error;
    }
  };

  // Register action
  const register = async (name, email, phone, password, role) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('grampickup_user', JSON.stringify(data));
      setUser(data);
      return data;
    } catch (error) {
      console.error('Register action error:', error);
      throw error;
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('grampickup_user');
    setUser(null);
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const data = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      // Update cached user data but retain role/shop if applicable
      const updatedUser = {
        ...user,
        ...data,
      };
      localStorage.setItem('grampickup_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Sync shop registration in user context (for shopkeeper flow)
  const syncShopContext = (shopData) => {
    const updatedUser = {
      ...user,
      shop: shopData,
    };
    localStorage.setItem('grampickup_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, apiFetch, updateProfile, syncShopContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
