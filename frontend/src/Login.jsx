import React, { useState } from 'react';
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiGlobe,
  FiChevronDown
} from 'react-icons/fi';
import './Login.css';
import logoIcon from './assets/icon.png';
import { API_BASE_URL } from './config';

const Login = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
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
    <div className="login-page-container">
      
      {/* LEFT PANEL: Branding & Study Illustration */}
      <div className="login-left-panel">
        
        {/* Brand Header */}
        <div className="brand-logo-container">
          <img src={logoIcon} alt="English Lab Logo" className="brand-logo-img" />
          <div className="brand-text-container">
            <div className="brand-main-title">
              <span className="brand-english">English</span><span className="brand-lab">Lab</span>
            </div>
            <div className="brand-subtitle">Language Learning Platform</div>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="login-hero-section">
          <h1 className="hero-title-main">
            Learn English.<br />
            <span className="hero-title-accent">Build Confidence.</span>
          </h1>
          <div className="hero-underline"></div>
          <p className="hero-desc">
            Interactive lessons to help you read, listen, speak and write better.
          </p>
        </div>

      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="login-right-panel">
        
        {/* Top-Right Language Selector */}
        {/* <div className="language-selector-container">
          <FiGlobe className="lang-globe-icon" />
          <span className="lang-text">English</span>
          <FiChevronDown className="lang-arrow-icon" />
        </div> */}

        {/* Form Wrap */}
        <div className="login-form-section">
          <h2 className="welcome-title">Welcome Back</h2>
          <p className="welcome-subtitle">Sign in to continue your learning journey.</p>

          {error && <div className="error-message-box">{error}</div>}

          <form onSubmit={handleSubmit} className="signin-form">
            
            {/* Username Input */}
            <div className="signin-input-group">
              <label className="input-field-label" htmlFor="username-input">Email or Username</label>
              <div className="input-with-icon">
                <FiUser className="input-field-icon" />
                <input
                  type="text"
                  required
                  placeholder="Enter your email or username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="signin-input"
                  id="username-input"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="signin-input-group">
              <label className="input-field-label" htmlFor="password-input">Password</label>
              <div className="input-with-icon">
                <FiLock className="input-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="signin-input"
                  id="password-input"
                />
                <button
                  type="button"
                  className="password-visibility-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="form-options-row">
              <label className="remember-me-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="remember-me-checkbox"
                />
                <span className="remember-me-text">Remember me</span>
              </label>
              <a href="#forgot" className="forgot-password-link">Forgot Password?</a>
            </div>

            {/* Submit Button */}
            <button type="submit" className="signin-submit-btn" disabled={loading}>
              <span>Sign In</span>
              <FiArrowRight className="btn-arrow-icon" />
            </button>
          </form>

          {/* Social Divider */}
          <div className="social-divider-container">
            <span className="social-divider-text">or continue with</span>
          </div>

          {/* Google Login Button */}
          <button type="button" className="google-signin-btn" disabled={loading}>
            <svg viewBox="0 0 24 24" className="google-logo-svg" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Create Account Footer Link */}
          {/* <div className="create-account-footer">
            Don't have an account? <a href="#register" className="create-account-link">Create one</a>
          </div> */}
        </div>

      </div>
    </div>
  );
};

export default Login;
