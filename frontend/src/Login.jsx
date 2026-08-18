import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiMail,
  FiKey,
  FiCheck,
  FiX
} from 'react-icons/fi';
import './Login.css';
import logoIcon from './assets/icon.png';
import { API_BASE_URL } from './config';

const Login = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password views and form inputs state
  const [view, setView] = useState('login'); // 'login' | 'forgot_email' | 'forgot_otp_reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [otpStatus, setOtpStatus] = useState('idle'); // 'idle' | 'verifying' | 'valid' | 'invalid'

  const handleOtpChange = async (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setOtpCode(val);

    if (val.length === 6) {
      setOtpStatus('verifying');
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: forgotEmail, otp_code: val }),
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok && data.valid) {
          setOtpStatus('valid');
        } else {
          setOtpStatus('invalid');
        }
      } catch (err) {
        console.error('Verify OTP error:', err);
        setOtpStatus('invalid');
      }
    } else {
      setOtpStatus('idle');
    }
  };

  const handleBackToLogin = () => {
    setView('login');
    setError('');
    setSuccessMessage('');
    setOtpStatus('idle');
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setError('');
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/google-login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: codeResponse.code }),
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
          localStorage.setItem('user', JSON.stringify(data.user));
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          }
        } else {
          setError(data.error || data.message || 'Google Authentication failed. Please try again.');
        }
      } catch (err) {
        console.error('Google login error:', err);
        setError('Connection to backend failed. Please make sure the server is running.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Sign-in failed. Please try again.');
    },
    flow: 'auth-code',
  });


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || data.detail || 'Invalid username or password.');
      }
    } catch (err) {
      console.error('Backend login error:', err);
      setError('Connection to backend failed. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setSuccessMessage(data.message || 'OTP has been generated and sent to your email successfully.');
        setView('forgot_otp_reset');
      } else {
        setError(data.message || 'Email address not found or an error occurred.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Connection to backend failed. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail,
          otp_code: otpCode,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setSuccessMessage(data.message || 'Your password has been reset successfully.');
        setView('login');
        // Clear inputs
        setForgotEmail('');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Connection to backend failed. Please make sure the server is running.');
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
        
        {/* Form Wrap */}
        <div className="login-form-section">
          
          {view === 'login' && (
            <>
              <h2 className="welcome-title">Welcome Back</h2>
              <p className="welcome-subtitle">Sign in to continue your learning journey.</p>
            </>
          )}

          {view === 'forgot_email' && (
            <>
              <h2 className="welcome-title">Forgot Password</h2>
              <p className="welcome-subtitle">Enter your registered email address to receive a 6-digit OTP code.</p>
            </>
          )}

          {view === 'forgot_otp_reset' && (
            <>
              <h2 className="welcome-title">Reset Password</h2>
              <p className="welcome-subtitle">An OTP has been sent to {forgotEmail}. Verify and set your new password.</p>
            </>
          )}

          {error && <div className="error-message-box">{error}</div>}
          {successMessage && <div className="success-message-box">{successMessage}</div>}

          {/* VIEW 1: Standard Login Form */}
          {view === 'login' && (
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
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot_email');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="forgot-password-link-btn"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button type="submit" className="signin-submit-btn" disabled={loading}>
                <span>Sign In</span>
                <FiArrowRight className="btn-arrow-icon" />
              </button>
            </form>
          )}

          {/* VIEW 2: Forgot Password - Request OTP */}
          {view === 'forgot_email' && (
            <form onSubmit={handleForgotEmailSubmit} className="signin-form">
              <div className="signin-input-group">
                <label className="input-field-label" htmlFor="forgot-email-input">Email Address</label>
                <div className="input-with-icon">
                  <FiMail className="input-field-icon" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={loading}
                    className="signin-input"
                    id="forgot-email-input"
                  />
                </div>
              </div>

              <button type="submit" className="signin-submit-btn" disabled={loading}>
                <span>Send OTP Code</span>
                <FiArrowRight className="btn-arrow-icon" />
              </button>

              <div className="form-options-row back-to-login-row">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="back-to-login-btn"
                  disabled={loading}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: Verify OTP & Reset Password */}
          {view === 'forgot_otp_reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="signin-form">
              
              {/* OTP Code Input */}
              <div className="signin-input-group">
                <label className="input-field-label" htmlFor="otp-input">Verification Code (OTP)</label>
                <div className="input-with-icon">
                  <FiKey className="input-field-icon" />
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={handleOtpChange}
                    disabled={loading}
                    className={`signin-input ${otpStatus === 'valid' ? 'otp-input-valid' : ''} ${otpStatus === 'invalid' ? 'otp-input-invalid' : ''}`}
                    id="otp-input"
                  />
                  {otpStatus === 'valid' && <FiCheck className="otp-status-icon success-tick" />}
                  {otpStatus === 'invalid' && <FiX className="otp-status-icon error-cross" />}
                </div>
              </div>

              {/* New Password Input */}
              <div className="signin-input-group">
                <label className="input-field-label" htmlFor="new-password-input">New Password</label>
                <div className="input-with-icon">
                  <FiLock className="input-field-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="signin-input"
                    id="new-password-input"
                  />
                  <button
                    type="button"
                    className="password-visibility-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={loading}
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="signin-input-group">
                <label className="input-field-label" htmlFor="confirm-password-input">Confirm New Password</label>
                <div className="input-with-icon">
                  <FiLock className="input-field-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="signin-input"
                    id="confirm-password-input"
                  />
                  <button
                    type="button"
                    className="password-visibility-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="signin-submit-btn" disabled={loading}>
                <span>Reset Password</span>
                <FiArrowRight className="btn-arrow-icon" />
              </button>

              <div className="form-options-row back-to-login-row">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="back-to-login-btn"
                  disabled={loading}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Social Divider & Google Sign-in - only visible on Login view */}
          {view === 'login' && (
            <>
              <div className="social-divider-container" style={{ margin: '1.25rem 0' }}>
                <span className="social-divider-text">or continue with</span>
              </div>

              <button type="button" className="google-signin-btn" disabled={loading} onClick={handleGoogleLogin}>
                <svg viewBox="0 0 24 24" className="google-logo-svg" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}

        </div>

      </div>


    </div>
  );
};

export default Login;
