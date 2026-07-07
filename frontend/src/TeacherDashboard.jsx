import React, { useState, useEffect } from 'react';
import { 
  FiShield, 
  FiUsers, 
  FiBookOpen, 
  FiActivity, 
  FiLogOut, 
  FiGrid, 
  FiClock,
  FiCheckCircle, 
  FiMenu, 
  FiX,
  FiCheck,
  FiFileText
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

const TeacherDashboard = ({ user, onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, queue
  const [successMsg, setSuccessMsg] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/teacher/dashboard/');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        setErrorMsg('Failed to load teacher dashboard data.');
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



  if (loading) {
    return (
      <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#4f46e5' }}>
        <h2>Loading Teacher Portal...</h2>
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
          <span className="brand-name-small">Teacher Portal</span>
        </div>
        <div className="mobile-user-avatar">
          {user.username ? user.username.slice(0, 2).toUpperCase() : 'TE'}
        </div>
      </header>

      {/* Sidebar Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Panel */}
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
            <FiShield />
          </div>
          <div>
            <h3 className="brand-name">Language Lab</h3>
            <span className="brand-badge" style={{ backgroundColor: '#8b5cf6' }}>Teacher Portal</span>
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
            className={`nav-link ${activeSubTab === 'queue' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('queue'); setIsSidebarOpen(false); }}
          >
            <FiFileText className="nav-icon" />
            <span>Grading Queue</span>
            <span className="nav-count" style={{ backgroundColor: '#ef4444' }}>{data?.grading_queue_count}</span>
          </button>
        </nav>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-avatar" style={{ backgroundColor: '#8b5cf6' }}>
            {user.username ? user.username.slice(0, 2).toUpperCase() : 'TE'}
          </div>
          <div className="user-meta">
            <div className="user-name">{user.full_name || user.username}</div>
            <div className="user-role">Teacher</div>
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
              {activeSubTab === 'overview' && 'Teacher Dashboard'}
              {activeSubTab === 'queue' && 'Grading Queue'}
            </h1>
            <p className="page-subtitle">
              {activeSubTab === 'overview' && 'Monitor class performance, review upcoming lessons, and grade students.'}
              {activeSubTab === 'queue' && 'Review and assign scores for open response submissions.'}
            </p>
          </div>
        </header>

        {/* Feedback Messages */}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        {activeSubTab === 'overview' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Assigned Classes</span>
                  <FiUsers style={{ color: '#8b5cf6', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{data.assigned_classes.length}</h2>
                <p style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '0.25rem' }}>{data.assigned_classes.join(', ')}</p>
              </div>

              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Scenarios</span>
                  <FiBookOpen style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{data.active_scenarios}</h2>
                <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>Assigned lessons in lab</p>
              </div>


            </div>

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              
              {/* Left Column: Upcoming Classes */}
              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiClock style={{ color: '#8b5cf6' }} /> Today's Lab Schedule
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.upcoming_lessons.map(lesson => (
                    <div key={lesson.id} style={{ display: 'flex', padding: '0.9rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6', backgroundColor: '#f8fafc', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{lesson.class}</h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>Topic: {lesson.topic}</p>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#8b5cf6', backgroundColor: '#f5f3ff', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{lesson.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Student Rankings */}
              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiActivity style={{ color: '#10b981' }} /> Top Performing Students
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.student_rankings.map((rank, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx < data.student_rankings.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309', backgroundColor: '#f8fafc', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{rank.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981' }}>{rank.score}</span>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{rank.progress}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeSubTab === 'queue' && (
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Ungraded English Submissions</h3>
            {data && data.grading_queue_count > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>John Doe</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Submitted 3 hours ago</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', marginBottom: '1rem' }}>
                    "The journey to the old castle was long and full of danger, but the young knight never lost hope because his heart was pure."
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      <FiCheck /> Approve & Grade (5/5)
                    </button>
                  </div>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>Lisa Ray</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Submitted 5 hours ago</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', marginBottom: '1rem' }}>
                    "Although he had never spoken in public before, David spoke with absolute confidence during the language test."
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      <FiCheck /> Approve & Grade (4/5)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <FiCheckCircle style={{ color: '#10b981', fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                <p>Grading queue is completely clear!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
