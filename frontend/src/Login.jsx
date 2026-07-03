import React, { useState } from 'react';
import { 
  FiMail, 
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

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password, rememberMe });
  };

  return (
    <div className="login-container">
      
      {/* LEFT SIDE: Content Panel */}
      <div className="left-panel">
        {/* Brand Header */}
        <div className="brand-header">
          <div className="brand-icon-box">
            <svg className="svg-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.82 9L12 4.54 20.18 9 12 13.46 3.82 9zM12 15.56l-6-3.27V15c0 1.66 2.69 3 6 3s6-1.34 6-3v-2.71l-6 3.27z"/>
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">English Language Lab</h1>
          </div>
        
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <h2 className="hero-heading">
            Learning Begins <br />
            with <span className="highlight-text">Experience.</span>
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
                <svg className="svg-icon" fill="currentColor" viewBox="0 0 24 24">
                  {/* <path d="M2 22h20v-2H2v2zm1-3h18V8l-4 4-5-7-5 7-4-4v11z"/> */}
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.82 9L12 4.54 20.18 9 12 13.46 3.82 9zM12 15.56l-6-3.27V15c0 1.66 2.69 3 6 3s6-1.34 6-3v-2.71l-6 3.27z"/>
                </svg>
              </div>
            </div>
            {/* <span className="badge-role">Super Admin Login</span> */}
            <h2 className="welcome-title">Welcome Back!</h2>
            <p className="welcome-subtitle">Sign in to access the English Language Lab CMS</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Input */}
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <div className="input-relative">
                <FiMail className="input-icon-left" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter your email address"
                />
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
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
                  onChange={(e) => setRememberMe(e.checked)}
                  className="form-checkbox"
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              <a href="#forgot" className="forgot-link">Forgot password?</a>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              <FiLock className="btn-icon" />
              <span>Sign In to Dashboard</span>
            </button>
          </form>

          {/* Secure Access Indicator */}
          <div className="divider-container">
            <div className="divider-line"></div>
            <span className="divider-text">
              <FiShield className="shield-small" /> Secure Access
            </span>
          </div>

          {/* Restricted Notice Box */}
          
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