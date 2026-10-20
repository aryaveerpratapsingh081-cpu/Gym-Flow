import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('gymflow_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('gymflow_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    if (response.data.success) {
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('gymflow_user', JSON.stringify(userData));
      return userData;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  };

  const register = async (formData) => {
    const response = await API.post('/auth/register', formData);
    if (response.data.success) {
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('gymflow_user', JSON.stringify(userData));
      return userData;
    } else {
      throw new Error(response.data.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gymflow_user');
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isTrainer: user?.role === 'Trainer',
    isMember: user?.role === 'Member',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
