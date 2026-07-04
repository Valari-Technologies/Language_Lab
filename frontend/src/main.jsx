import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'

const App = () => {
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (!window.location.pathname.startsWith('/dashboard')) {
        window.history.replaceState({}, '', '/dashboard/grades');
        setCurrentPath('/dashboard/grades');
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
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    window.history.pushState({}, '', '/dashboard/grades');
    setCurrentPath('/dashboard/grades');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    window.history.pushState({}, '', '/login');
    setCurrentPath('/login');
  };

  const handleTabChange = (tabName) => {
    window.history.pushState({}, '', `/dashboard/${tabName}`);
    setCurrentPath(`/dashboard/${tabName}`);
  };

  const activeTab = currentPath.startsWith('/dashboard')
    ? currentPath.split('/')[2] || 'grades'
    : 'grades';

  return (
    <>
      {user && currentPath.startsWith('/dashboard') ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
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
