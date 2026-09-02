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
          top: '20px',
          right: '24px',
          zIndex: 99999,
          maxWidth: '460px',
          width: 'calc(100% - 48px)',
          backgroundColor: '#fff1f2',
          border: '1px solid #fecdd3',
          borderRadius: '12px',
          padding: '0.85rem 1.1rem',
          boxShadow: '0 10px 25px -5px rgba(225, 29, 72, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#ffe4e6',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
              fontWeight: 700
            }}>
              ⚠️
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9f1239' }}>Session Notice</div>
              <div style={{ fontSize: '0.78rem', color: '#be123c', lineHeight: 1.35, whiteSpace: 'normal' }}>
                {sessionExpiredMsg}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={() => {
                setSessionExpiredMsg(null);
                handleLogout();
              }}
              style={{
                backgroundColor: '#e11d48',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Re-login
            </button>
            <button
              onClick={() => setSessionExpiredMsg(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9f1239',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 6px'
              }}
              title="Dismiss warning"
            >
              ✕
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
