import React, { useState, useEffect } from 'react';
import { 
  FiShield, 
  FiUsers, 
  FiBookOpen, 
  FiActivity, 
  FiLogOut, 
  FiGrid, 
  FiFileText, 
  FiPlus, 
  FiCheckCircle, 
  FiMenu, 
  FiX,
  FiBell
} from 'react-icons/fi';
import './Dashboard.css';

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.reload();
    throw new Error('Session expired');
  }

  return response;
};

const SchoolDashboard = ({ user, onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, teachers, settings
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/school/dashboard/');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        setErrorMsg('Failed to load school dashboard data.');
      }
    } catch (e) {
      setErrorMsg('Error connecting to backend.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;

    // Simulate sending announcement to server
    const newAnnouncement = {
      id: Date.now(),
      title: announcementMsg,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setData(prev => ({
      ...prev,
      announcements: [newAnnouncement, ...prev.announcements]
    }));
    
    setAnnouncementMsg('');
    setSuccessMsg('Announcement broadcasted successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  if (loading) {
    return (
      <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#4f46e5' }}>
        <h2>Loading School Admin Portal...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Header Bar */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
          <FiMenu />
        </button>
        <div className="mobile-brand">
          <div className="brand-logo-small">
            <FiShield />
          </div>
          <span className="brand-name-small">School Admin</span>
        </div>
        <div className="mobile-user-avatar">
          {user.username ? user.username.slice(0, 2).toUpperCase() : 'SA'}
        </div>
      </header>

      {/* Sidebar Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Panel */}
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
            <FiShield />
          </div>
          <div>
            <h3 className="brand-name">Language Lab</h3>
            <span className="brand-badge" style={{ backgroundColor: '#10b981' }}>School Portal</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-link ${activeSubTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('overview'); setIsSidebarOpen(false); }}
          >
            <FiGrid className="nav-icon" />
            <span>Overview</span>
          </button>

          <button 
            className={`nav-link ${activeSubTab === 'teachers' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('teachers'); setIsSidebarOpen(false); }}
          >
            <FiUsers className="nav-icon" />
            <span>Teachers</span>
          </button>
        </nav>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-avatar" style={{ backgroundColor: '#10b981' }}>
            {user.username ? user.username.slice(0, 2).toUpperCase() : 'SA'}
          </div>
          <div className="user-meta">
            <div className="user-name">{user.full_name || user.username}</div>
            <div className="user-role">School Admin</div>
          </div>
          <button onClick={onLogout} className="logout-btn" title="Sign Out">
            <FiLogOut />
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-info">
            <h1 className="page-title">
              {activeSubTab === 'overview' && 'School Dashboard'}
              {activeSubTab === 'teachers' && 'Manage Instructors'}
            </h1>
            <p className="page-subtitle">
              {activeSubTab === 'overview' && `Welcome back, admin. Manage ${data?.school_name || 'your school'}.`}
              {activeSubTab === 'teachers' && 'View and manage language training faculty members.'}
            </p>
          </div>
        </header>

        {/* Feedback Messages */}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        {activeSubTab === 'overview' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Stats Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Total Teachers</span>
                  <FiUsers style={{ color: '#10b981', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{data.total_teachers}</h2>
                <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>Active faculty members</p>
              </div>

              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Enrolled Students</span>
                  <FiUsers style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{data.total_students}</h2>
                <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>Registered learners</p>
              </div>

              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Active Classes</span>
                  <FiBookOpen style={{ color: '#8b5cf6', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{data.active_classes}</h2>
                <p style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '0.25rem' }}>Lab sessions this week</p>
              </div>

              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Monthly Engagement</span>
                  <FiActivity style={{ color: '#f59e0b', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{data.monthly_engagement_rate}</h2>
                <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>Average time in lab</p>
              </div>
            </div>

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
              
              {/* Left Column: Recent Activities */}
              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiActivity style={{ color: '#10b981' }} /> Recent Lab Activities
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.recent_activities.map(act => (
                    <div key={act.id} style={{ display: 'flex', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #10b981', backgroundColor: '#f8fafc', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#334155' }}>{act.activity}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Announcements */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Board */}
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiBell style={{ color: '#f59e0b' }} /> School Notices
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {data.announcements.map(ann => (
                      <div key={ann.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{ann.title}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{ann.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Make Announcement Form */}
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Broadcast Announcement</h3>
                  <form onSubmit={handlePostAnnouncement}>
                    <textarea 
                      value={announcementMsg}
                      onChange={e => setAnnouncementMsg(e.target.value)}
                      placeholder="Type announcement here..."
                      style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontSize: '0.875rem', fontFamily: 'inherit', marginBottom: '0.75rem' }}
                      required
                    />
                    <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                      <FiPlus /> Send Notice
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'teachers' && (
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Active Language Instructors</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Assigned Classes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>Sarah Miller</td>
                    <td style={{ padding: '1rem' }}>Elementary English</td>
                    <td style={{ padding: '1rem' }}><span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>Active</span></td>
                    <td style={{ padding: '1rem' }}>Class 6-A, Class 6-B</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>David Lee</td>
                    <td style={{ padding: '1rem' }}>Intermediate Grammar</td>
                    <td style={{ padding: '1rem' }}><span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>Active</span></td>
                    <td style={{ padding: '1rem' }}>Class 7-C</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>Emma Watson</td>
                    <td style={{ padding: '1rem' }}>Advanced Vocabulary</td>
                    <td style={{ padding: '1rem' }}><span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>Active</span></td>
                    <td style={{ padding: '1rem' }}>Grade 8 Speaking</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SchoolDashboard;
