import React, { useState } from 'react';
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiLayers,
  FiBarChart2,
  FiClock
} from 'react-icons/fi';
import './Login.css';
import loginpageimg from './assets/lOGIN.jpeg';
import icon from './assets/icon.png';

const Login = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SUPER_ADMIN');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        setError(data.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError('Connection to backend failed. Please make sure the server is running.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      {/* LEFT SIDE: Content Panel */}
      <div className="left-panel">
        {/* Brand Header */}
        <div className="brand-header">
          <div className="brand-icon-box">
            <div className="svg-icon" >
              <img src={icon} alt='icon' className='brand-icon' />
            </div>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">English Language Lab</h1>
          </div>

        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <h2 className="hero-heading">
            Learning Begins <br />
            with <span style={{ color: '#fbbf24' }}>Experience.</span>
          </h2>
          <p className="hero-description">
            Welcome to the Content Management System. Manage grades, learning experiences, assessments and more  all in one place.
          </p>

          {/* Mockup Area */}
          <div className="mockup-container">
            <img src={loginpageimg} alt="Dashboard Mockup" className="mockup-image" />
          </div>
        </div>

        {/* Bottom Feature Grid */}
        <div className="feature-grid">
          <div className="feature-item">
            <FiShield className="feature-icon" />
            <span className="feature-text">Secure & Reliable</span>
          </div>
          <div className="feature-item">
            <FiLayers className="feature-icon" />
            <span className="feature-text">Organized Content</span>
          </div>
          <div className="feature-item">
            <FiBarChart2 className="feature-icon" />
            <span className="feature-text">Track Progress</span>
          </div>
          <div className="feature-item">
            <FiClock className="feature-icon" />
            <span className="feature-text">Save Time & Effort</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form Panel */}
      <div className="right-panel">
        {/* Form Container (Zoom optimized) */}
        <div className="form-wrapper">
          <div className="form-header">
            <div className="avatar-outer">
              <div className="avatar-inner">
                <img src={icon} alt="Logo" className="brand-icon" />
              </div>
            </div>
            <h2 className="welcome-title">Welcome Back!</h2>
            <p className="welcome-subtitle">Sign in to access the English Language Lab CMS</p>
          </div>

          {error && <div className="error-message-box">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username Input */}
            <div className="input-group">
              <label className="input-label" htmlFor="username">Username</label>
              <div className="input-relative">
                <FiUser className="input-icon-left" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Role Selection Dropdown */}
            <div className="input-group">
              <label className="input-label" htmlFor="role">Role</label>
              <div className="input-relative">
                <FiLayers className="input-icon-left" />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-input select-dropdown"
                  disabled={loading}
                >
                  <option value="SUPER_ADMIN">👑 Super Admin</option>
                  <option value="INSTITUTE_ADMIN">🏫 Institute Admin</option>
                  <option value="TEACHER">👨‍🏫 Teacher</option>
                </select>
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div className="input-relative">
                <FiLock className="input-icon-left" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="form-checkbox"
                  disabled={loading}
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              <a href="#forgot" className="forgot-link">Forgot password?</a>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={loading}>
              <FiLock className="btn-icon" />
              <span>{loading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          {/* Secure Access Indicator */}
          <div className="divider-container">
            <div className="divider-line"></div>
            <span className="divider-text">
              <FiShield className="shield-small" /> Secure Access
            </span>
          </div>

        </div>

        {/* Footer Text */}
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} English Language Lab
        </div>
      </div>

    </div>
  );
};

export default Login;