import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import SchoolDashboard from './SchoolDashboard.jsx'
import TeacherDashboard from './TeacherDashboard.jsx'
import ContentStudio from './ContentStudio.jsx'


export const App = () => {
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(null);

  useEffect(() => {
    const handleSessionExpired = (e) => {
      setSessionExpiredMsg(e.detail?.message || 'Your session has expired due to inactivity. Please log in again to continue.');
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Role-based route correction
      const path = window.location.pathname;
      if (parsedUser.role === 'SUPER_ADMIN') {
        if (!path.startsWith('/dashboard') && !path.startsWith('/content-studio')) {
          window.history.replaceState({}, '', '/dashboard/grades');
          setCurrentPath('/dashboard/grades');
        }
      } else if (parsedUser.role === 'CONTENT_CREATOR') {
        if (!path.startsWith('/content-studio')) {
          window.history.replaceState({}, '', '/content-studio');
          setCurrentPath('/content-studio');
        }
      } else if (parsedUser.role === 'SCHOOL_ADMIN') {
        if (!path.startsWith('/school-dashboard')) {
          window.history.replaceState({}, '', '/school-dashboard');
          setCurrentPath('/school-dashboard');
        }
      } else if (parsedUser.role === 'TEACHER') {
        if (!path.startsWith('/teacher-dashboard')) {
          window.history.replaceState({}, '', '/teacher-dashboard');
          setCurrentPath('/teacher-dashboard');
        }

      } else {
        // Fallback for invalid roles
        localStorage.clear();
        setUser(null);
        window.history.replaceState({}, '', '/login');
        setCurrentPath('/login');
      }
    } else {
      setUser(null);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/login');
        setCurrentPath('/login');
      }
    }

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    const handlePageShow = () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      if (!token || !storedUser) {
        setUser(null);
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.history.replaceState({}, '', '/login');
          setCurrentPath('/login');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    let dest = '/login';
    if (loggedInUser.role === 'SUPER_ADMIN') {
      dest = '/dashboard/dashboard';
    } else if (loggedInUser.role === 'CONTENT_CREATOR') {
      dest = '/content-studio';
    } else if (loggedInUser.role === 'SCHOOL_ADMIN') {
      dest = '/school-dashboard';
    } else if (loggedInUser.role === 'TEACHER') {
      dest = '/teacher-dashboard';
    }

    window.history.pushState({}, '', dest);
    setCurrentPath(dest);
    setUser(loggedInUser);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    window.history.pushState({}, '', '/login');
    setCurrentPath('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (user && (!token || !storedUser)) {
      handleLogout();
      return;
    }

    if (user) {
      let defaultDest = '/login';
      if (user.role === 'SUPER_ADMIN') defaultDest = '/dashboard/dashboard';
      else if (user.role === 'CONTENT_CREATOR') defaultDest = '/content-studio';
      else if (user.role === 'SCHOOL_ADMIN') defaultDest = '/school-dashboard';
      else if (user.role === 'TEACHER') defaultDest = '/teacher-dashboard';

      if (currentPath === '/login' || currentPath === '/') {
        window.history.replaceState({}, '', defaultDest);
        setCurrentPath(defaultDest);
        return;
      }

      let isAllowed = false;
      if (user.role === 'SUPER_ADMIN') {
        isAllowed = currentPath.startsWith('/dashboard') || currentPath.startsWith('/content-studio');
      } else if (user.role === 'CONTENT_CREATOR') {
        isAllowed = currentPath.startsWith('/content-studio');
      } else if (user.role === 'SCHOOL_ADMIN') {
        isAllowed = currentPath.startsWith('/school-dashboard');
      } else if (user.role === 'TEACHER') {
        isAllowed = currentPath.startsWith('/teacher-dashboard');
      }

      if (!isAllowed) {
        window.history.replaceState({}, '', defaultDest);
        setCurrentPath(defaultDest);
      }
    } else {
      if (!token || !storedUser) {
        if (currentPath !== '/login' && currentPath !== '/') {
          window.history.replaceState({}, '', '/login');
          setCurrentPath('/login');
        }
      }
    }
  }, [currentPath, user]);

  const handleTabChange = (tabName) => {
    window.history.pushState({}, '', `/dashboard/${tabName}`);
    setCurrentPath(`/dashboard/${tabName}`);
  };

  const activeTab = currentPath.startsWith('/dashboard')
    ? currentPath.split('/')[2] || 'dashboard'
    : 'dashboard';

  return (
    <>
      {user ? (
        <>
          {user.role === 'SUPER_ADMIN' && currentPath.startsWith('/dashboard') && (
            <Dashboard
              user={user}
              onLogout={handleLogout}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onUpdateUser={handleUpdateUser}
            />
          )}
          {(user.role === 'CONTENT_CREATOR' || user.role === 'SUPER_ADMIN') && currentPath.startsWith('/content-studio') && (
            <ContentStudio
              user={user}
              onLogout={handleLogout}
              currentPath={currentPath}
              setCurrentPath={setCurrentPath}
              onUpdateUser={handleUpdateUser}
            />
          )}
          {user.role === 'SCHOOL_ADMIN' && currentPath.startsWith('/school-dashboard') && (
            <SchoolDashboard
              user={user}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
            />
          )}
          {user.role === 'TEACHER' && currentPath.startsWith('/teacher-dashboard') && (
            <TeacherDashboard
              user={user}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
            />
          )}

        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {sessionExpiredMsg && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #fee2e2',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              margin: '0 auto 1rem auto'
            }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Session Expired
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              {sessionExpiredMsg}
            </p>
            <button
              onClick={() => {
                setSessionExpiredMsg(null);
                handleLogout();
              }}
              style={{
                width: '100%',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
                transition: 'background-color 0.2s'
              }}
            >
              Log In Again
            </button>
          </div>
        </div>
      )}
    </>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
