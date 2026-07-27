import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import SchoolDashboard from './SchoolDashboard.jsx'
import TeacherDashboard from './TeacherDashboard.jsx'
import ContentStudio from './ContentStudio.jsx'
import { logoutSession } from './api'
import { FiBell, FiHelpCircle, FiX, FiCalendar } from 'react-icons/fi'


export const StudentDashboard = ({ user, onLogout }) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New lesson assigned: Listening - Unit 1.', time: '2 hours ago', read: false },
    { id: 2, text: 'Your score for "Speaking 1" has been graded.', time: '1 day ago', read: true },
  ]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowNotifDropdown(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs >= 5 && hrs < 12) return 'Good morning';
    if (hrs >= 12 && hrs < 17) return 'Good afternoon';
    if (hrs >= 17 && hrs < 22) return 'Good evening';
    return 'Good night';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navbar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #0b57d0)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1.2rem'
          }}>
            L
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            LanguageLab <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.85rem', marginLeft: '4px' }}>STUDENT</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
            <FiCalendar/> {formatDateTime(currentTime)}
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#475569',
                fontSize: '1.15rem',
                display: 'flex',
                position: 'relative',
                padding: '4px'
              }} 
              onClick={(e) => { e.stopPropagation(); setShowNotifDropdown(!showNotifDropdown); }}
            >
              <FiBell />
              {notifications.some(n => !n.read) && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              )}
            </button>
            {showNotifDropdown && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '300px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 1000, padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Notifications</span>
                  <button style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}>Mark all read</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: '8px', borderRadius: '6px', backgroundColor: n.read ? 'transparent' : '#f0fdf4', borderLeft: n.read ? 'none' : '3px solid #22c55e', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.8rem', color: '#334155' }}>{n.text}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#475569',
              fontSize: '1.15rem',
              display: 'flex',
              padding: '4px'
            }} 
            onClick={() => setShowHelpModal(true)} 
            title="Help & Support"
          >
            <FiHelpCircle />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #e2e8f0' }}
              />
            ) : (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}>
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
              {user.full_name || user.username}
            </span>
          </div>

          <button
            onClick={onLogout}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3.5rem',
            marginBottom: '1rem',
            display: 'inline-block'
          }}>
            👋
          </div>
          
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            {getGreeting()}, {user.full_name || user.username}!
          </h1>
          
          <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0 0 2rem 0', lineHeight: 1.6 }}>
            You have successfully authenticated via Google OAuth. Your account has been registered with the <strong>Student</strong> role.
          </p>

          <div style={{
            background: '#f8fafc',
            border: '1.5px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Account Information
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.88rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Name:</strong> {user.full_name || 'N/A'}</li>
              <li><strong>Email:</strong> {user.email}</li>
              <li><strong>Username:</strong> {user.username}</li>
              <li><strong>Role:</strong> {user.role}</li>
            </ul>
          </div>

          <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            Learning modules and assignments are configured by your School Administrator. Check back soon for updates!
          </div>
        </div>
      </main>

      {/* Help Modal */}
      {showHelpModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }} 
          onClick={e => { if(e.target===e.currentTarget) setShowHelpModal(false); }}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>Help & Support Center</span>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }} 
                onClick={() => setShowHelpModal(false)}
              >
                <FiX/>
              </button>
            </div>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto', fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Frequently Asked Questions</h3>
                <details style={{ marginBottom: '8px', cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 600, color: '#1e293b' }}>How to start a lesson?</summary>
                  <p style={{ margin: '4px 0 0 16px', color: '#64748b' }}>Click on the assigned lessons in your home portal and follow the audio/visual prompts on the screen.</p>
                </details>
                <details style={{ cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 600, color: '#1e293b' }}>How to record audio responses?</summary>
                  <p style={{ margin: '4px 0 0 16px', color: '#64748b' }}>Ensure your microphone permissions are allowed in the browser. Click the microphone icon to record your response.</p>
                </details>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: 0 }} />
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Terms of Service & Agreements</h3>
                <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                  All student accounts registered under schools must maintain guidelines for educational purposes only. Unauthorized extraction of media content is strictly prohibited.
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Contact Support</h3>
                <p style={{ margin: 0, color: '#64748b' }}>Email: <a href="mailto:support@lingualab.edu" style={{ color: '#4f46e5', fontWeight: 600 }}>support@lingualab.edu</a></p>
                <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Hotline: 1-800-LINGUA-LAB</p>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }} 
                onClick={() => setShowHelpModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const App = () => {
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
      } else if (parsedUser.role === 'STUDENT') {
        if (!path.startsWith('/student')) {
          window.history.replaceState({}, '', '/student');
          setCurrentPath('/student');
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
    } else if (loggedInUser.role === 'STUDENT') {
      dest = '/student';
    }

    window.history.pushState({}, '', dest);
    setCurrentPath(dest);
    setUser(loggedInUser);
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
      else if (user.role === 'STUDENT') defaultDest = '/student';

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
            />
          )}
          {(user.role === 'CONTENT_CREATOR' || user.role === 'SUPER_ADMIN') && currentPath.startsWith('/content-studio') && (
            <ContentStudio
              user={user}
              onLogout={handleLogout}
              currentPath={currentPath}
              setCurrentPath={setCurrentPath}
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
          {user.role === 'STUDENT' && currentPath.startsWith('/student') && (
            <StudentDashboard
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
