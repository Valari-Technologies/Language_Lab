import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import SchoolDashboard from './SchoolDashboard.jsx'
import TeacherDashboard from './TeacherDashboard.jsx'

const App = () => {
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Role-based route correction
      const path = window.location.pathname;
      if (parsedUser.role === 'SUPER_ADMIN') {
        if (!path.startsWith('/dashboard')) {
          window.history.replaceState({}, '', '/dashboard/grades');
          setCurrentPath('/dashboard/grades');
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
        // Fallback for students or invalid roles
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
    const handlePageShow = (event) => {
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
    setUser(loggedInUser);

    let dest = '/login';
    if (loggedInUser.role === 'SUPER_ADMIN') {
      dest = '/dashboard/grades';
    } else if (loggedInUser.role === 'SCHOOL_ADMIN') {
      dest = '/school-dashboard';
    } else if (loggedInUser.role === 'TEACHER') {
      dest = '/teacher-dashboard';
    }

    window.history.pushState({}, '', dest);
    setCurrentPath(dest);
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
      const allowedPrefix = 
        user.role === 'SUPER_ADMIN' ? '/dashboard' : 
        user.role === 'SCHOOL_ADMIN' ? '/school-dashboard' : 
        user.role === 'TEACHER' ? '/teacher-dashboard' : '/not-found';
      
      if (!currentPath.startsWith(allowedPrefix)) {
        handleLogout();
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
            />
          )}
          {user.role === 'SCHOOL_ADMIN' && currentPath.startsWith('/school-dashboard') && (
            <SchoolDashboard
              user={user}
              onLogout={handleLogout}
            />
          )}
          {user.role === 'TEACHER' && currentPath.startsWith('/teacher-dashboard') && (
            <TeacherDashboard
              user={user}
              onLogout={handleLogout}
            />
          )}
        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
