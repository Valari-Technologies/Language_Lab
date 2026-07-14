import React, { useState, useEffect, useRef } from 'react';
import { 
  FiShield, 
  FiClock, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiLogOut, 
  FiGrid, 
  FiXCircle, 
  FiBookOpen, 
  FiList, 
  FiFileText, 
  FiCornerDownRight, 
  FiMenu, 
  FiX, 
  FiCopy,
  FiUser, 
  FiArrowUp, 
  FiArrowDown,
  FiActivity,
  FiPlayCircle,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import './Dashboard.css';
import { apiFetch } from './api';
import { API_BASE_URL } from './config';

const ContentStudio = ({ user, onLogout, currentPath, setCurrentPath }) => {
  const [view, setView] = useState('dashboard'); // dashboard, scenarios, scenario-builder, media, validation, preview, publish
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Status & error tracking
  const [lastApiCall, setLastApiCall] = useState(null); // { method, url, status }
  const [apiError, setApiError] = useState(null); // { status, url, body }

  // Global shared states
  const [grades, setGrades] = useState([]);
  const [scenariosList, setScenariosList] = useState([]); // for dropdown pickers

  // Helper to wrap API calls and track status/errors
  const request = async (url, options = {}) => {
    setApiError(null);
    setLastApiCall({ method: options.method || 'GET', url });
    try {
      const res = await apiFetch(url, options);
      setLastApiCall(prev => ({ ...prev, status: res.status }));
      if (!res.ok) {
        let bodyText = '';
        try {
          bodyText = await res.text();
        } catch (_) {}
        const errorData = { status: res.status, url, body: bodyText };
        setApiError(errorData);
        return { ok: false, status: res.status, rawBody: bodyText };
      }
      if (res.status === 204) {
        return { ok: true, status: 204, data: null };
      }
      const data = await res.json();
      return { ok: true, status: res.status, data };
    } catch (err) {
      setLastApiCall(prev => ({ ...prev, status: 'NETWORK_ERROR' }));
      const errorData = { status: 'NETWORK_ERROR', url, body: err.message };
      setApiError(errorData);
      return { ok: false, status: 'NETWORK_ERROR', rawBody: err.message };
    }
  };

  // Load baseline grades and scenario list for dropdowns
  const loadBaseData = async () => {
    const gradesRes = await request('/api/cms/grades/');
    if (gradesRes.ok && gradesRes.data) {
      setGrades(gradesRes.data.results || gradesRes.data);
    }
    const scenRes = await request('/api/v1/content/scenarios/?page_size=100');
    if (scenRes.ok && scenRes.data) {
      setScenariosList(scenRes.data.results || scenRes.data);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  // BUG 4 FIX: Back button / logout confirm
  // On mount, push a sentinel so the back button hits us before leaving.
  // On popstate, if destination is no longer /content-studio, show confirm.
  useEffect(() => {
    // Push a "guard" entry so we have something to pop before truly leaving.
    window.history.pushState({ contentStudioGuard: true }, '', window.location.href);

    const handlePopState = (e) => {
      const nextPath = window.location.pathname;
      if (!nextPath.startsWith('/content-studio')) {
        // Browser tried to navigate away – restore our guard position first
        window.history.pushState({ contentStudioGuard: true }, '', '/content-studio');
        const confirmed = window.confirm(
          'Do you want to log out?\n\nOK = log out and go to login.\nCancel = stay in Content Studio.'
        );
        if (confirmed) {
          onLogout();
        }
        // Either way, we stay – onLogout() handles the redirect if confirmed
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onLogout]);

  return (
    // BUG 3 FIX: height: 100vh + overflow: hidden bounds the flex container so
    // .main-content's overflow-y: auto can actually clip and scroll.
    // This inline style is ContentStudio-only — Dashboard.css is untouched.
    <div className="dashboard-layout" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Mobile Header Bar */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
          <FiMenu />
        </button>
        <div className="mobile-brand">
          <div className="brand-logo-small">
            <FiBookOpen />
          </div>
          <span className="brand-name-small">Content Studio</span>
        </div>
        <div className="mobile-user-avatar">
          {user.username ? user.username.slice(0, 2).toUpperCase() : 'CC'}
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Panel */}
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <FiBookOpen />
          </div>
          <div>
            <h3 className="brand-name">Content Studio</h3>
            <span className="brand-badge">Authoring Portal</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }}
          >
            <FiGrid className="nav-icon" />
            <span>Studio Dashboard</span>
          </button>

          <button 
            className={`nav-link ${view === 'scenarios' || view === 'scenario-builder' ? 'active' : ''}`}
            onClick={() => { setView('scenarios'); setIsSidebarOpen(false); }}
          >
            <FiBookOpen className="nav-icon" />
            <span>Scenarios & Editor</span>
          </button>

          <button 
            className={`nav-link ${view === 'media' ? 'active' : ''}`}
            onClick={() => { setView('media'); setIsSidebarOpen(false); }}
          >
            <FiFileText className="nav-icon" />
            <span>Media Library</span>
          </button>

          <button 
            className={`nav-link ${view === 'validation' ? 'active' : ''}`}
            onClick={() => { setView('validation'); setIsSidebarOpen(false); }}
          >
            <FiCheckCircle className="nav-icon" />
            <span>Validation Center</span>
          </button>

          <button 
            className={`nav-link ${view === 'preview' ? 'active' : ''}`}
            onClick={() => { setView('preview'); setIsSidebarOpen(false); }}
          >
            <FiPlayCircle className="nav-icon" />
            <span>Runtime Preview</span>
          </button>

          <button 
            className={`nav-link ${view === 'publish' ? 'active' : ''}`}
            onClick={() => { setView('publish'); setIsSidebarOpen(false); }}
          >
            <FiDownload className="nav-icon" />
            <span>Publish Center</span>
          </button>

          {user.role === 'SUPER_ADMIN' && (
            <button 
              className="nav-link"
              onClick={() => { window.location.pathname = '/dashboard/grades'; }}
              style={{ marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '15px' }}
            >
              <FiShield className="nav-icon" />
              <span>Admin Dashboard</span>
            </button>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user.username ? user.username.slice(0, 2).toUpperCase() : 'CC'}
          </div>
          <div className="user-meta">
            <div className="user-name">{user.username}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <button onClick={onLogout} className="logout-btn" title="Sign Out">
            <FiLogOut />
          </button>
        </div>
      </aside>

      {/* Main Content Area — overflow-y:auto from Dashboard.css handles scroll */}
      <div className="main-content">
        
        {/* Status Tracker and Error Display (Crucial for Testing) */}
        <div style={{ background: '#0f172a', color: '#94a3b8', padding: '8px 20px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #1e293b' }}>
          <div>
            <strong>Last API request: </strong>
            {lastApiCall ? (
              <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8' }}>
                [{lastApiCall.method}] {lastApiCall.url}
              </code>
            ) : <span style={{ fontStyle: 'italic' }}>None</span>}
          </div>
          <div>
            <strong>HTTP Status: </strong>
            {lastApiCall?.status ? (
              <span style={{ 
                background: typeof lastApiCall.status === 'number' && lastApiCall.status < 300 ? '#065f46' : '#991b1b', 
                color: '#fff', 
                padding: '2px 8px', 
                borderRadius: '4px',
                fontWeight: 'bold' 
              }}>
                {lastApiCall.status}
              </span>
            ) : <span style={{ fontStyle: 'italic' }}>N/A</span>}
          </div>
        </div>

        {apiError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '15px 20px', margin: '15px 20px 0 20px', borderRadius: '8px', color: '#991b1b' }}>
            <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiXCircle /> API Error Response Details ({apiError.status})
            </h4>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
              <strong>Endpoint:</strong> <code>{apiError.url}</code>
            </p>
            <pre style={{ margin: '10px 0 0 0', padding: '10px', background: '#fff', border: '1px solid #fee2e2', borderRadius: '4px', overflowX: 'auto', fontSize: '12px', color: '#7f1d1d', whiteSpace: 'pre-wrap' }}>
              {apiError.body}
            </pre>
          </div>
        )}

        <div style={{ padding: '20px', flex: 1 }}>
          {view === 'dashboard' && <StudioDashboard request={request} setView={setView} setSelectedScenarioId={setSelectedScenarioId} />}
          {view === 'scenarios' && <ScenariosPage request={request} setView={setView} setSelectedScenarioId={setSelectedScenarioId} grades={grades} refreshBase={loadBaseData} />}
          {view === 'scenario-builder' && <ScenarioBuilderPage request={request} setView={setView} scenarioId={selectedScenarioId} grades={grades} />}
          {view === 'media' && <MediaPage request={request} />}
          {view === 'validation' && <ValidationPage request={request} scenarios={scenariosList} selectedId={selectedScenarioId} setSelectedId={setSelectedScenarioId} />}
          {view === 'preview' && <PreviewPage request={request} scenarios={scenariosList} selectedId={selectedScenarioId} setSelectedId={setSelectedScenarioId} />}
          {view === 'publish' && <PublishPage request={request} scenarios={scenariosList} selectedId={selectedScenarioId} setSelectedId={setSelectedScenarioId} />}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. STUDIO DASHBOARD VIEW
// ---------------------------------------------------------------------------
const StudioDashboard = ({ request, setView, setSelectedScenarioId }) => {
  const [summary, setSummary] = useState(null);
  const [recentScenarios, setRecentScenarios] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const loadDashboardData = async () => {
    const sRes = await request('/api/v1/dashboard/summary');
    if (sRes.ok) setSummary(sRes.data);

    const rsRes = await request('/api/v1/dashboard/recent-scenarios');
    if (rsRes.ok) setRecentScenarios(rsRes.data);

    const raRes = await request('/api/v1/dashboard/recent-activity');
    if (raRes.ok) setRecentActivity(raRes.data);

    const nRes = await request('/api/v1/dashboard/notifications');
    if (nRes.ok) setNotifications(nRes.data);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Studio Dashboard Summary</h2>
      
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>Total Scenarios</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>{summary.total_scenarios}</div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>Draft Scenarios</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>{summary.draft_scenarios}</div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>Published Scenarios</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>{summary.published_scenarios}</div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>Media Assets</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>{summary.total_media_assets}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '30px' }}>
        
        {/* Recent Scenarios */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>Recent Scenarios</h3>
          {recentScenarios.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentScenarios.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{s.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Grade: {s.grade_name} | {s.difficulty}</div>
                  </div>
                  <button 
                    onClick={() => { setSelectedScenarioId(s.id); setView('scenario-builder'); }} 
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#64748b', fontSize: '14px' }}>No scenarios available.</p>}
        </div>

        {/* Notifications and Logs */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>Activity Logs & Notifications</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <h4 style={{ color: '#475569', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>Recent Activities</h4>
              {recentActivity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {recentActivity.map((a, idx) => (
                    <div key={idx} style={{ fontSize: '13px', color: '#334155', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid #64748b' }}>
                      <strong>[{a.activity_type}]</strong> {a.message} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({new Date(a.timestamp).toLocaleTimeString()})</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: '#94a3b8', fontSize: '12px' }}>No recent activities.</p>}
            </div>

            <div>
              <h4 style={{ color: '#475569', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>System Alerts</h4>
              {notifications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ fontSize: '13px', color: '#334155', background: '#fffbeb', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                      <strong>{n.title}</strong>: {n.message}
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: '#94a3b8', fontSize: '12px' }}>No alerts or notifications.</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. SCENARIOS LIST VIEW
// ---------------------------------------------------------------------------
const ScenariosPage = ({ request, setView, setSelectedScenarioId, grades, refreshBase }) => {
  const [scenarios, setScenarios] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New Scenario Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade: '',
    subject: 'English',
    language: 'English',
    difficulty: 'MEDIUM',
    estimated_duration: 15,
    status: 'DRAFT',
    tags: []
  });

  const loadScenarios = async () => {
    let url = `/api/v1/content/scenarios/?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    
    const res = await request(url);
    if (res.ok && res.data) {
      setScenarios(res.data.results || []);
      setTotalPages(Math.ceil((res.data.count || 0) / 10) || 1);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadScenarios();
  };

  const handleCreateScenario = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      grade: parseInt(formData.grade, 10),
      estimated_duration: parseInt(formData.estimated_duration, 10)
    };
    const res = await request('/api/v1/content/scenarios/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        grade: grades[0]?.id || '',
        subject: 'English',
        language: 'English',
        difficulty: 'MEDIUM',
        estimated_duration: 15,
        status: 'DRAFT',
        tags: []
      });
      loadScenarios();
      refreshBase();
    }
  };

  const handleDuplicate = async (id) => {
    const res = await request(`/api/v1/content/scenarios/${id}/duplicate/`, { method: 'POST' });
    if (res.ok) {
      loadScenarios();
      refreshBase();
    }
  };

  const handleArchive = async (id) => {
    const res = await request(`/api/v1/content/scenarios/${id}/archive/`, { method: 'POST' });
    if (res.ok) loadScenarios();
  };

  const handlePublishToggle = async (id) => {
    const res = await request(`/api/v1/content/scenarios/${id}/publish/`, { method: 'POST' });
    if (res.ok) loadScenarios();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this scenario? This will cascade-delete activities and screens!")) {
      const res = await request(`/api/v1/content/scenarios/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        loadScenarios();
        refreshBase();
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2>Scenarios List</h2>
        <button 
          onClick={() => {
            setFormData(prev => ({ ...prev, grade: grades[0]?.id || '' }));
            setShowCreateForm(!showCreateForm);
          }} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <FiPlus /> {showCreateForm ? "Close Form" : "New Scenario"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateScenario} style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <h3 style={{ marginBottom: '15px' }}>Create New Scenario</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div className="form-group">
              <label>Title *</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Scenario Title" />
            </div>
            <div className="form-group">
              <label>Grade Level *</label>
              <select required value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}>
                <option value="">Select Grade</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.grade_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject *</label>
              <input type="text" required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Language *</label>
              <input type="text" required value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Difficulty *</label>
              <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label>Duration (min) *</label>
              <input type="number" required value={formData.estimated_duration} onChange={e => setFormData({ ...formData, estimated_duration: e.target.value })} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Scenario summary / overview..." />
          </div>
          <button type="submit" className="btn-primary">Save Scenario</button>
        </form>
      )}

      {/* Filter and Search controls */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input 
            type="text" 
            placeholder="Search scenarios by title, subject..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ margin: 0 }}
          />
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FiSearch /> Search
          </button>
        </form>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Status:</span>
          <select 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }} 
            style={{ margin: 0, width: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table className="dashboard-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Grade</th>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 'bold' }}>{s.title}</td>
                <td>{s.grade_name || s.grade}</td>
                <td>{s.subject}</td>
                <td>{s.difficulty}</td>
                <td>
                  <span className={`badge-pill status ${s.status?.toLowerCase()}`}>
                    {s.status}
                  </span>
                </td>
                <td>{new Date(s.updated_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setSelectedScenarioId(s.id); setView('scenario-builder'); }} className="action-btn edit" title="Open in Builder"><FiEdit2 /></button>
                    <button onClick={() => handleDuplicate(s.id)} className="action-btn" title="Duplicate" style={{ background: '#eff6ff', color: '#1d4ed8' }}><FiCopy /></button>
                    <button onClick={() => handleArchive(s.id)} className="action-btn" title="Archive" style={{ background: '#fef2f2', color: '#991b1b' }}>Arc</button>
                    <button onClick={() => handlePublishToggle(s.id)} className="action-btn" title="Quick Publish Status" style={{ background: '#ecfdf5', color: '#065f46' }}>Pub</button>
                    <button onClick={() => handleDelete(s.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
            {scenarios.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No scenarios found match the criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary" style={{ padding: '6px 12px' }}>Previous</button>
        <span style={{ alignSelf: 'center', fontSize: '14px' }}>Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary" style={{ padding: '6px 12px' }}>Next</button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. SCENARIO BUILDER (DETAILED VIEW)
// ---------------------------------------------------------------------------
const ScenarioBuilderPage = ({ request, setView, scenarioId, grades }) => {
  const [scenario, setScenario] = useState(null);
  const [activities, setActivities] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  
  // Tag / Outcome forms
  const [newTag, setNewTag] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  // Expand states for activity accordion
  const [expandedActivityId, setExpandedActivityId] = useState(null);

  // Forms
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ title: '', learning_objective: '', estimated_duration: 15, mastery_threshold: 80, skills: [] });
  const [editingActivityId, setEditingActivityId] = useState(null);

  const [showAddScreenForm, setShowAddScreenForm] = useState(false);
  const [screenForm, setScreenForm] = useState({ title: '', screen_type: 'INFORMATION', estimated_duration: 10, content: '{}' });
  const [editingScreenId, setEditingScreenId] = useState(null);
  const [screenActivityId, setScreenActivityId] = useState(null);

  const loadScenarioDetails = async () => {
    const sRes = await request(`/api/v1/content/scenarios/${scenarioId}/`);
    if (sRes.ok) setScenario(sRes.data);

    // Use ActivityDetailSerializer endpoint to get screens nested inside each activity
    const aRes = await request(`/api/v1/content/scenarios/${scenarioId}/activities/`);
    if (aRes.ok) {
      // ActivitySerializer doesn't include screens — fetch each activity's detail for screens
      const baseActivities = aRes.data || [];
      const detailed = await Promise.all(
        baseActivities.map(async (act) => {
          const dRes = await request(`/api/v1/content/activities/${act.id}/`);
          return dRes.ok ? dRes.data : act;
        })
      );
      setActivities(detailed);
    }
  };

  const loadMediaOptions = async () => {
    const mRes = await request('/api/v1/content/media/?page_size=100');
    if (mRes.ok && mRes.data) {
      setMediaList(mRes.data.results || mRes.data);
    }
  };

  useEffect(() => {
    loadScenarioDetails();
    loadMediaOptions();
  }, [scenarioId]);

  // Patch Scenario Metadata
  const handleUpdateScenario = async (fields) => {
    const res = await request(`/api/v1/content/scenarios/${scenarioId}/`, {
      method: 'PATCH',
      body: JSON.stringify(fields)
    });
    if (res.ok) setScenario(res.data);
  };

  // Tags Actions
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const res = await request(`/api/v1/content/scenarios/${scenarioId}/tags/`, {
      method: 'POST',
      body: JSON.stringify({ tags: [newTag.trim()] })
    });
    if (res.ok) {
      setNewTag('');
      setScenario(res.data);
    }
  };

  const handleRemoveTag = async (tag) => {
    const res = await request(`/api/v1/content/scenarios/${scenarioId}/tags/`, {
      method: 'DELETE',
      body: JSON.stringify({ tags: [tag] })
    });
    if (res.ok) setScenario(res.data);
  };

  // Outcome Actions
  const handleAddOutcome = async () => {
    if (!newOutcome.trim()) return;
    const res = await request(`/api/v1/content/scenarios/${scenarioId}/learning-outcomes/`, {
      method: 'POST',
      body: JSON.stringify({ text: newOutcome.trim() })
    });
    if (res.ok) {
      setNewOutcome('');
      loadScenarioDetails();
    }
  };

  const handleDeleteOutcome = async (outcomeId) => {
    const res = await request(`/api/v1/content/learning-outcomes/${outcomeId}/`, {
      method: 'DELETE'
    });
    if (res.ok) loadScenarioDetails();
  };

  // Activity Actions
  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (editingActivityId) {
      const res = await request(`/api/v1/content/activities/${editingActivityId}/`, {
        method: 'PATCH',
        body: JSON.stringify(activityForm)
      });
      if (res.ok) {
        setEditingActivityId(null);
        setShowAddActivityForm(false);
        loadScenarioDetails();
      }
    } else {
      const res = await request('/api/v1/content/activities/', {
        method: 'POST',
        body: JSON.stringify({ ...activityForm, scenario: scenarioId })
      });
      if (res.ok) {
        setShowAddActivityForm(false);
        loadScenarioDetails();
      }
    }
  };

  const handleReorderActivities = async (direction, index) => {
    const newActs = [...activities];
    if (direction === 'up' && index > 0) {
      const temp = newActs[index];
      newActs[index] = newActs[index - 1];
      newActs[index - 1] = temp;
    } else if (direction === 'down' && index < newActs.length - 1) {
      const temp = newActs[index];
      newActs[index] = newActs[index + 1];
      newActs[index + 1] = temp;
    } else {
      return;
    }
    const ids = newActs.map(a => a.id);
    const res = await request('/api/v1/content/activities/reorder/', {
      method: 'PATCH',
      body: JSON.stringify({ ids })
    });
    if (res.ok) setActivities(res.data);
  };

  const handleDeleteActivity = async (id) => {
    if (window.confirm("Delete this activity? All screens inside it will be permanently deleted!")) {
      const res = await request(`/api/v1/content/activities/${id}/`, { method: 'DELETE' });
      if (res.ok) loadScenarioDetails();
    }
  };

  // Screen Actions
  const handleSaveScreen = async (e) => {
    e.preventDefault();
    let contentObj = {};
    try {
      contentObj = JSON.parse(screenForm.content);
    } catch {
      alert("Invalid JSON content format.");
      return;
    }
    const payload = { ...screenForm, content: contentObj };

    if (editingScreenId) {
      const res = await request(`/api/v1/content/screens/${editingScreenId}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingScreenId(null);
        setShowAddScreenForm(false);
        loadScenarioDetails();
      }
    } else {
      const res = await request('/api/v1/content/screens/', {
        method: 'POST',
        body: JSON.stringify({ ...payload, activity: screenActivityId })
      });
      if (res.ok) {
        setShowAddScreenForm(false);
        loadScenarioDetails();
      }
    }
  };

  const handleDuplicateScreen = async (screenId) => {
    const res = await request(`/api/v1/content/screens/${screenId}/duplicate/`, { method: 'POST' });
    if (res.ok) loadScenarioDetails();
  };

  const handleDeleteScreen = async (screenId) => {
    if (window.confirm("Delete this screen?")) {
      const res = await request(`/api/v1/content/screens/${screenId}/`, { method: 'DELETE' });
      if (res.ok) loadScenarioDetails();
    }
  };

  const handleReorderScreens = async (direction, activityIndex, screenIndex) => {
    const act = activities[activityIndex];
    const screens = [...act.screens];
    if (direction === 'up' && screenIndex > 0) {
      const temp = screens[screenIndex];
      screens[screenIndex] = screens[screenIndex - 1];
      screens[screenIndex - 1] = temp;
    } else if (direction === 'down' && screenIndex < screens.length - 1) {
      const temp = screens[screenIndex];
      screens[screenIndex] = screens[screenIndex + 1];
      screens[screenIndex + 1] = temp;
    } else {
      return;
    }
    const ids = screens.map(s => s.id);
    const res = await request('/api/v1/content/screens/reorder/', {
      method: 'PATCH',
      body: JSON.stringify({ ids })
    });
    if (res.ok) loadScenarioDetails();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setView('scenarios')} className="btn-secondary" style={{ padding: '6px 12px' }}>&larr; Back</button>
        <h2>Scenario Builder</h2>
      </div>

      {scenario && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start' }}>
          
          {/* Main workspace */}
          <div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
              <h3>Scenario Properties</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={scenario.title} onChange={e => handleUpdateScenario({ title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Grade Level</label>
                  <select value={scenario.grade?.id || scenario.grade} onChange={e => handleUpdateScenario({ grade: parseInt(e.target.value) })}>
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.grade_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" value={scenario.subject} onChange={e => handleUpdateScenario({ subject: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select value={scenario.difficulty} onChange={e => handleUpdateScenario({ difficulty: e.target.value })}>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Activities Section */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Scenario Activities</h3>
                <button 
                  onClick={() => {
                    setEditingActivityId(null);
                    setActivityForm({ title: '', learning_objective: '', estimated_duration: 15, mastery_threshold: 80, skills: [] });
                    setShowAddActivityForm(true);
                  }}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <FiPlus /> Add Activity
                </button>
              </div>

              {showAddActivityForm && (
                <form onSubmit={handleSaveActivity} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <h4>{editingActivityId ? "Edit Activity" : "Create Activity"}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '10px', marginBottom: '15px' }}>
                    <div className="form-group">
                      <label>Title *</label>
                      <input type="text" required value={activityForm.title} onChange={e => setActivityForm({ ...activityForm, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Objective *</label>
                      <input type="text" required value={activityForm.learning_objective} onChange={e => setActivityForm({ ...activityForm, learning_objective: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Duration (min)</label>
                      <input type="number" value={activityForm.estimated_duration} onChange={e => setActivityForm({ ...activityForm, estimated_duration: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label>Mastery Thresh (%)</label>
                      <input type="number" value={activityForm.mastery_threshold} onChange={e => setActivityForm({ ...activityForm, mastery_threshold: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary">Save Activity</button>
                    <button type="button" onClick={() => setShowAddActivityForm(false)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              )}

              {/* Accordion List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {activities.map((act, actIdx) => (
                  <div key={act.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 20px', borderBottom: expandedActivityId === act.id ? '1px solid #e2e8f0' : 'none' }}>
                      <div 
                        onClick={() => setExpandedActivityId(expandedActivityId === act.id ? null : act.id)}
                        style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <FiActivity style={{ color: '#3b82f6' }} />
                        <strong>{act.display_order}. {act.title}</strong>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>({act.estimated_duration} mins)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => handleReorderActivities('up', actIdx)} className="action-btn" title="Move Up" style={{ padding: '4px' }}><FiArrowUp /></button>
                        <button onClick={() => handleReorderActivities('down', actIdx)} className="action-btn" title="Move Down" style={{ padding: '4px' }}><FiArrowDown /></button>
                        <button 
                          onClick={() => {
                            setEditingActivityId(act.id);
                            setActivityForm({ title: act.title, learning_objective: act.learning_objective || '', estimated_duration: act.estimated_duration, mastery_threshold: act.mastery_threshold, skills: [] });
                            setShowAddActivityForm(true);
                          }} 
                          className="action-btn edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDeleteActivity(act.id)} className="action-btn delete"><FiTrash2 /></button>
                      </div>
                    </div>

                    {expandedActivityId === act.id && (
                      <div style={{ padding: '20px', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h4 style={{ margin: 0, color: '#475569' }}>Activity Screens</h4>
                          <button 
                            onClick={() => {
                              setEditingScreenId(null);
                              setScreenActivityId(act.id);
                              setScreenForm({ title: '', screen_type: 'INFORMATION', estimated_duration: 10, content: '{}' });
                              setShowAddScreenForm(true);
                            }}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '13px' }}
                          >
                            <FiPlus /> Add Screen
                          </button>
                        </div>

                        {showAddScreenForm && screenActivityId === act.id && (
                          <form onSubmit={handleSaveScreen} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                            <h5>{editingScreenId ? "Edit Screen" : "Create Screen"}</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '10px', marginBottom: '15px' }}>
                              <div className="form-group">
                                <label>Title *</label>
                                <input type="text" required value={screenForm.title} onChange={e => setScreenForm({ ...screenForm, title: e.target.value })} />
                              </div>
                              <div className="form-group">
                                <label>Type *</label>
                                <select value={screenForm.screen_type} onChange={e => setScreenForm({ ...screenForm, screen_type: e.target.value })}>
                                  <option value="INFORMATION">Information</option>
                                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                  <option value="FILL_IN_BLANKS">Fill in Blanks</option>
                                  <option value="SPEAKING_PRACTICE">Speaking Practice</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Duration (sec) *</label>
                                <input type="number" required value={screenForm.estimated_duration} onChange={e => setScreenForm({ ...screenForm, estimated_duration: parseInt(e.target.value) || 0 })} />
                              </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                <label style={{ margin: 0 }}>Content (JSON) *</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12px', color: '#64748b' }}>Insert Media:</span>
                                  <select 
                                    onChange={e => {
                                      if (e.target.value) {
                                        const insertText = `{"media_id": ${e.target.value}}`;
                                        setScreenForm(prev => ({
                                          ...prev,
                                          content: prev.content.slice(0, -1) ? prev.content.trim().replace(/\}$/, `, "media_id": ${e.target.value}}`) : insertText
                                        }));
                                        e.target.value = "";
                                      }
                                    }} 
                                    style={{ margin: 0, padding: '2px', fontSize: '12px' }}
                                  >
                                    <option value="">Select Asset</option>
                                    {mediaList.map(m => (
                                      <option key={m.id} value={m.id}>{m.name} ({m.media_type})</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <textarea 
                                style={{ fontFamily: 'monospace', fontSize: '13px', minHeight: '120px' }}
                                value={screenForm.content} 
                                onChange={e => setScreenForm({ ...screenForm, content: e.target.value })}
                              />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button type="submit" className="btn-primary">Save Screen</button>
                              <button type="button" onClick={() => setShowAddScreenForm(false)} className="btn-secondary">Cancel</button>
                            </div>
                          </form>
                        )}

                        {/* Screen Rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {act.screens && act.screens.map((scr, scrIdx) => (
                            <div key={scr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{scr.display_order}. {scr.title}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>Type: {scr.screen_type} | Duration: {scr.estimated_duration}s</div>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleReorderScreens('up', actIdx, scrIdx)} className="action-btn" title="Move Up"><FiArrowUp /></button>
                                <button onClick={() => handleReorderScreens('down', actIdx, scrIdx)} className="action-btn" title="Move Down"><FiArrowDown /></button>
                                <button onClick={() => handleDuplicateScreen(scr.id)} className="action-btn" title="Duplicate Screen" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Copy</button>
                                <button 
                                  onClick={() => {
                                    setEditingScreenId(scr.id);
                                    setScreenActivityId(act.id);
                                    setScreenForm({ title: scr.title, screen_type: scr.screen_type, estimated_duration: scr.estimated_duration, content: JSON.stringify(scr.content || {}, null, 2) });
                                    setShowAddScreenForm(true);
                                  }} 
                                  className="action-btn edit"
                                >
                                  <FiEdit2 />
                                </button>
                                <button onClick={() => handleDeleteScreen(scr.id)} className="action-btn delete"><FiTrash2 /></button>
                              </div>
                            </div>
                          ))}
                          {(!act.screens || act.screens.length === 0) && (
                            <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>No screens in this activity.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {activities.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b' }}>
                    This scenario has no activities. Create one to get started!
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right sidebar details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Tags card */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4>Scenario Tags</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '15px 0' }}>
                {scenario.tags && scenario.tags.map(t => (
                  <span key={t} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t}
                    <FiX style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} />
                  </span>
                ))}
                {(!scenario.tags || scenario.tags.length === 0) && <span style={{ color: '#94a3b8', fontSize: '13px' }}>No tags.</span>}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="text" placeholder="Add tag" value={newTag} onChange={e => setNewTag(e.target.value)} style={{ margin: 0, padding: '4px 8px', fontSize: '13px' }} />
                <button onClick={handleAddTag} className="btn-primary" style={{ padding: '6px 10px', fontSize: '13px' }}>Add</button>
              </div>
            </div>

            {/* Learning Outcomes card */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4>Learning Outcomes</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '15px 0' }}>
                {scenario.learning_outcomes && scenario.learning_outcomes.map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '13px', color: '#334155' }}>{o.text}</span>
                    <button onClick={() => handleDeleteOutcome(o.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 0 }}><FiTrash2 /></button>
                  </div>
                ))}
                {(!scenario.learning_outcomes || scenario.learning_outcomes.length === 0) && <span style={{ color: '#94a3b8', fontSize: '13px' }}>No outcomes.</span>}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="text" placeholder="Add outcome text" value={newOutcome} onChange={e => setNewOutcome(e.target.value)} style={{ margin: 0, padding: '4px 8px', fontSize: '13px' }} />
                <button onClick={handleAddOutcome} className="btn-primary" style={{ padding: '6px 10px', fontSize: '13px' }}>Add</button>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. MEDIA LIBRARY VIEW
// ---------------------------------------------------------------------------
const MediaPage = ({ request }) => {
  const [media, setMedia] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Usage tracking
  const [selectedUsageMedia, setSelectedUsageMedia] = useState(null);
  const [usagesList, setUsagesList] = useState([]);

  // File Upload fields
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFields, setUploadFields] = useState({ name: '', folder: 'General', tags: '' });
  const [uploadError, setUploadError] = useState('');

  // Replace file fields
  const [replaceFile, setReplaceFile] = useState(null);
  const [replacingId, setReplacingId] = useState(null);

  const loadMedia = async () => {
    let url = '/api/v1/content/media/?page_size=100';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (typeFilter) url += `&media_type=${typeFilter}`;

    const res = await request(url);
    if (res.ok && res.data) {
      setMedia(res.data.results || res.data);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMedia();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (!uploadFile) return;

    const fd = new FormData();
    fd.append('file', uploadFile);
    if (uploadFields.name) fd.append('name', uploadFields.name);
    fd.append('folder', uploadFields.folder);
    
    // Parse tags string into list
    const tagsArr = uploadFields.tags.split(',').map(t => t.trim()).filter(Boolean);
    fd.append('tags', JSON.stringify(tagsArr));

    const res = await request('/api/v1/content/media/upload/', {
      method: 'POST',
      body: fd
    });
    if (res.ok) {
      setUploadFile(null);
      setUploadFields({ name: '', folder: 'General', tags: '' });
      loadMedia();
    } else {
      setUploadError(res.rawBody || 'Upload failed');
    }
  };

  const handleReplaceSubmit = async (id) => {
    if (!replaceFile) return;
    const fd = new FormData();
    fd.append('file', replaceFile);

    const res = await request(`/api/v1/content/media/${id}/replace/`, {
      method: 'POST',
      body: fd
    });
    if (res.ok) {
      setReplacingId(null);
      setReplaceFile(null);
      loadMedia();
    }
  };

  const handleCheckUsage = async (item) => {
    const res = await request(`/api/v1/content/media/${item.id}/usage/`);
    if (res.ok) {
      setSelectedUsageMedia(item);
      setUsagesList(res.data);
    }
  };

  const handleDeleteMedia = async (id, force = false) => {
    let url = `/api/v1/content/media/${id}/`;
    if (force) url += '?force=true';

    const res = await request(url, { method: 'DELETE' });
    if (res.ok) {
      setSelectedUsageMedia(null);
      setUsagesList([]);
      loadMedia();
    } else if (res.status === 409) {
      const info = JSON.parse(res.rawBody);
      setUsagesList(info.usages || []);
      // Auto open modal warning
      const targetItem = media.find(m => m.id === id);
      setSelectedUsageMedia(targetItem);
    }
  };

  return (
    <div>
      <h2>Media Library Management</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', marginTop: '20px', alignItems: 'start' }}>
        
        {/* Gallery */}
        <div>
          {/* Filters */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <input type="text" placeholder="Search files, folders..." value={search} onChange={e => setSearch(e.target.value)} style={{ margin: 0 }} />
              <button type="submit" className="btn-primary">Search</button>
            </form>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ margin: 0, width: '130px' }}>
              <option value="">All Types</option>
              <option value="IMAGE">Images</option>
              <option value="AUDIO">Audio</option>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Documents</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {media.map(item => (
              <div key={item.id} style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ height: '140px', background: '#f8fafc', borderRadius: '6px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f1f5f9' }}>
                  {item.media_type === 'IMAGE' && <img src={item.file} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
                  {item.media_type === 'AUDIO' && <audio src={item.file} controls style={{ width: '90%' }} />}
                  {item.media_type === 'VIDEO' && <video src={item.file} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />}
                  {item.media_type === 'DOCUMENT' && <FiFileText style={{ fontSize: '48px', color: '#64748b' }} />}
                </div>

                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Type: {item.media_type} | Size: {(item.file_size / 1024).toFixed(1)} KB</div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <button onClick={() => handleCheckUsage(item)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>Usage</button>
                  <button onClick={() => setReplacingId(replacingId === item.id ? null : item.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>Replace</button>
                  <button onClick={() => handleDeleteMedia(item.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}>Delete</button>
                </div>

                {replacingId === item.id && (
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1', marginTop: '10px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Replace File:</label>
                    <input type="file" required onChange={e => setReplaceFile(e.target.files[0])} style={{ fontSize: '11px', padding: '5px 0' }} />
                    <button onClick={() => handleReplaceSubmit(item.id)} className="btn-primary" style={{ padding: '3px 8px', fontSize: '11px' }} disabled={!replaceFile}>Upload Replace</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upload Form Panel */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3>Upload Media</h3>
          {uploadError && (
            <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', fontSize: '12px', margin: '10px 0', whiteSpace: 'pre-wrap' }}>
              <strong>Error Code: 400</strong><br />
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label>Select File *</label>
              <input type="file" required onChange={e => setUploadFile(e.target.files[0])} />
            </div>
            <div className="form-group">
              <label>Name (Optional)</label>
              <input type="text" value={uploadFields.name} onChange={e => setUploadFields({ ...uploadFields, name: e.target.value })} placeholder="Original name used if empty" />
            </div>
            <div className="form-group">
              <label>Folder Name</label>
              <input type="text" value={uploadFields.folder} onChange={e => setUploadFields({ ...uploadFields, folder: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Tags (Comma separated)</label>
              <input type="text" value={uploadFields.tags} onChange={e => setUploadFields({ ...uploadFields, tags: e.target.value })} placeholder="e.g. tag1, tag2" />
            </div>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <FiPlus /> Upload Asset
            </button>
          </form>
        </div>

      </div>

      {/* Usage Modal & Conflict Warnings */}
      {selectedUsageMedia && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <header className="modal-header">
              <h3>Media Usage Check: {selectedUsageMedia.name}</h3>
              <button onClick={() => { setSelectedUsageMedia(null); setUsagesList([]); }} className="close-modal-btn"><FiXCircle /></button>
            </header>
            <div style={{ padding: '20px' }}>
              {usagesList.length > 0 ? (
                <div>
                  <div style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px' }}>
                    <FiAlertTriangle /> This media asset is in use by {usagesList.length} screen(s):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                    {usagesList.map((u, i) => (
                      <div key={i} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <strong>Scenario:</strong> {u.scenario_title}<br />
                        <strong>Activity:</strong> {u.activity_title}<br />
                        <strong>Screen:</strong> {u.screen_title}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleDeleteMedia(selectedUsageMedia.id, true)} className="btn-primary" style={{ background: '#dc2626', color: '#fff', border: 'none' }}>Force Delete anyway (?force=true)</button>
                    <button onClick={() => { setSelectedUsageMedia(null); setUsagesList([]); }} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px' }}>
                    <FiCheckCircle /> This asset is clean and not referenced by any screen in the workspace.
                  </div>
                  <button onClick={() => { setSelectedUsageMedia(null); setUsagesList([]); }} className="btn-primary">OK</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 7. VALIDATION ENGINE VIEW
// ---------------------------------------------------------------------------
const ValidationPage = ({ request, scenarios, selectedId, setSelectedId }) => {
  const [report, setReport] = useState(null);

  const handleRunValidation = async () => {
    if (!selectedId) return;
    const res = await request(`/api/v1/content/validation/${selectedId}/run/`, { method: 'POST' });
    if (res.ok) setReport(res.data);
  };

  const loadLatestReport = async () => {
    if (!selectedId) {
      setReport(null);
      return;
    }
    const res = await request(`/api/v1/content/validation/${selectedId}/`);
    if (res.ok) {
      setReport(res.data);
    } else {
      setReport(null);
    }
  };

  useEffect(() => {
    loadLatestReport();
  }, [selectedId]);

  return (
    <div>
      <h2>Validation Center Engine</h2>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Choose Scenario to Validate:</label>
          <select value={selectedId || ''} onChange={e => setSelectedId(e.target.value)} style={{ margin: 0 }}>
            <option value="">Select Scenario...</option>
            {scenarios.map(s => (
              <option key={s.id} value={s.id}>{s.title} ({s.status})</option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleRunValidation} 
          disabled={!selectedId} 
          className="btn-primary" 
          style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <FiRefreshCw /> Run Validation Engine
        </button>
      </div>

      {report ? (
        <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ 
            background: report.status === 'FAILED' ? '#fef2f2' : report.status === 'PASSED_WITH_WARNINGS' ? '#fffbeb' : '#f0fdf4',
            border: `1px solid ${report.status === 'FAILED' ? '#fca5a5' : report.status === 'PASSED_WITH_WARNINGS' ? '#fde047' : '#bbf7d0'}`,
            padding: '15px 20px',
            borderRadius: '6px',
            color: report.status === 'FAILED' ? '#991b1b' : report.status === 'PASSED_WITH_WARNINGS' ? '#713f12' : '#166534',
            fontWeight: 'bold',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            {report.status === 'FAILED' ? <FiXCircle /> : report.status === 'PASSED_WITH_WARNINGS' ? <FiAlertTriangle /> : <FiCheckCircle />}
            Validation Engine Result: {report.status}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px', background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#64748b', fontSize: '12px' }}>Total Checks</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{report.total_checks}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#166534', fontSize: '12px' }}>Passed</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>{report.passed}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#854d0e', fontSize: '12px' }}>Warnings</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#854d0e' }}>{report.warnings}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#991b1b', fontSize: '12px' }}>Errors</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#991b1b' }}>{report.errors}</div>
            </div>
          </div>

          <h3>Report Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            {report.results && report.results.map((r, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                gap: '12px', 
                alignItems: 'start', 
                padding: '12px 15px', 
                borderRadius: '6px', 
                background: r.severity === 'ERROR' ? '#fef2f2' : r.severity === 'WARNING' ? '#fffbeb' : '#f0fdf4',
                borderLeft: `4px solid ${r.severity === 'ERROR' ? '#ef4444' : r.severity === 'WARNING' ? '#f59e0b' : '#10b981'}`,
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px', background: r.severity === 'ERROR' ? '#fee2e2' : r.severity === 'WARNING' ? '#fef3c7' : '#dcfce7', padding: '2px 6px', borderRadius: '4px', color: r.severity === 'ERROR' ? '#b91c1c' : r.severity === 'WARNING' ? '#b45309' : '#15803d' }}>
                  {r.severity}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#1e293b' }}>{r.message}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Rule: {r.rule} | Target: {r.item}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : selectedId ? (
        <p style={{ color: '#64748b', fontStyle: 'italic' }}>No validation report has been generated for this scenario yet.</p>
      ) : <p style={{ color: '#64748b' }}>Select a scenario to analyze.</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 8. RUNTIME PREVIEW VIEW
// ---------------------------------------------------------------------------
const PreviewPage = ({ request, scenarios, selectedId, setSelectedId }) => {
  const [payload, setPayload] = useState(null);

  const loadPreview = async () => {
    if (!selectedId) {
      setPayload(null);
      return;
    }
    const res = await request(`/api/v1/content/scenarios/${selectedId}/preview/`);
    if (res.ok) setPayload(res.data);
  };

  useEffect(() => {
    loadPreview();
  }, [selectedId]);

  return (
    <div>
      <h2>Runtime Preview Studio</h2>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Choose Scenario to Preview:</label>
        <select value={selectedId || ''} onChange={e => setSelectedId(e.target.value)} style={{ margin: 0 }}>
          <option value="">Select Scenario...</option>
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.title} ({s.status})</option>
          ))}
        </select>
      </div>

      {payload ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', alignItems: 'start' }}>
          
          {/* Main Renderer emulator */}
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#64748b', color: '#fff', padding: '10px 20px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiPlayCircle /> LMS Renderer Emulator
            </div>
            
            <div style={{ padding: '20px' }}>
              <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                <h1 style={{ margin: '0 0 5px 0' }}>{payload.scenario.title}</h1>
                <p style={{ color: '#64748b', margin: 0 }}>{payload.scenario.description || "No description provided."}</p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '13px' }}>
                  <span><strong>Subject:</strong> {payload.scenario.subject}</span>
                  <span><strong>Duration:</strong> {payload.scenario.estimated_duration}m</span>
                  <span><strong>Difficulty:</strong> {payload.scenario.difficulty}</span>
                </div>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {payload.activities.map((a, aIdx) => (
                  <div key={a.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Activity #{aIdx + 1}: {a.title}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 15px 0' }}><em>Objective: {a.learning_objective}</em></p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {a.screens.map((scr, sIdx) => (
                        <div key={scr.id} style={{ background: '#fff', padding: '12px 15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Screen #{sIdx + 1}: {scr.title} ({scr.screen_type})</h4>
                          <pre style={{ background: '#f1f5f9', padding: '8px', borderRadius: '4px', fontSize: '12px', overflowX: 'auto', margin: '0 0 10px 0' }}>
                            {JSON.stringify(scr.content, null, 2)}
                          </pre>
                          
                          {/* Render Resolved Media assets */}
                          {scr.resolved_media && scr.resolved_media.length > 0 && (
                            <div style={{ marginTop: '10px', padding: '8px', border: '1px solid #dbeafe', background: '#eff6ff', borderRadius: '4px' }}>
                              <strong style={{ fontSize: '11px', color: '#1e40af', display: 'block', marginBottom: '5px' }}>Resolved Media:</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {scr.resolved_media.map((m, mIdx) => (
                                  <div key={mIdx}>
                                    {m.missing ? (
                                      <span style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 'bold' }}>Broken ID: {m.media_id}</span>
                                    ) : (
                                      <div style={{ maxWidth: '120px' }}>
                                        {m.type === 'IMAGE' && <img src={m.url} alt="" style={{ maxWidth: '100px', maxHeight: '60px', objectFit: 'contain' }} />}
                                        {m.type === 'AUDIO' && <audio src={m.url} controls style={{ width: '100px', transform: 'scale(0.8)', transformOrigin: 'left' }} />}
                                        {m.type === 'VIDEO' && <video src={m.url} controls style={{ width: '100px', height: '60px' }} />}
                                        <div style={{ fontSize: '9px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>Media ID: {m.media_id}</div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Debug panel */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4>Debug Panel</h4>
              <div style={{ marginTop: '15px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Validation Status: <strong>{payload.debug.validation_status}</strong></span>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h5 style={{ color: '#b91c1c', borderBottom: '1px solid #fee2e2', paddingBottom: '5px', marginBottom: '10px' }}>Missing Assets ({payload.debug.missing_assets.length})</h5>
                {payload.debug.missing_assets.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {payload.debug.missing_assets.map((m, idx) => (
                      <div key={idx} style={{ background: '#fef2f2', padding: '8px', borderRadius: '4px', border: '1px solid #fca5a5', fontSize: '12px', color: '#991b1b' }}>
                        <strong>{m.type}:</strong> {m.reference}<br />
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Screen: {m.screen_title}</span>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ color: '#166534', fontSize: '13px', fontStyle: 'italic' }}>No missing assets detected.</p>}
              </div>
            </div>

          </div>

        </div>
      ) : selectedId ? (
        <p style={{ color: '#64748b' }}>Loading preview payload...</p>
      ) : <p style={{ color: '#64748b' }}>Choose a scenario to preview.</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 9. PUBLISH CENTER VIEW
// ---------------------------------------------------------------------------
const PublishPage = ({ request, scenarios, selectedId, setSelectedId }) => {
  const [statusInfo, setStatusInfo] = useState(null);
  const [history, setHistory] = useState([]);

  // Form Fields
  const [manualVersion, setManualVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [pubErrors, setPubErrors] = useState(null);

  const loadPublishDetails = async () => {
    if (!selectedId) {
      setStatusInfo(null);
      setHistory([]);
      return;
    }
    const sRes = await request(`/api/v1/content/publish/${selectedId}/`);
    if (sRes.ok) setStatusInfo(sRes.data);

    const hRes = await request(`/api/v1/content/publish/history/${selectedId}/`);
    if (hRes.ok) setHistory(hRes.data.versions || []);
  };

  useEffect(() => {
    loadPublishDetails();
  }, [selectedId]);

  const handlePublish = async (e) => {
    e.preventDefault();
    setPubErrors(null);
    const payload = {};
    if (manualVersion.trim()) payload.version = manualVersion.trim();
    if (releaseNotes.trim()) payload.release_notes = releaseNotes.trim();

    const res = await request(`/api/v1/content/publish/${selectedId}/`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setManualVersion('');
      setReleaseNotes('');
      loadPublishDetails();
    } else if (res.status === 422) {
      const errInfo = JSON.parse(res.rawBody);
      setPubErrors(errInfo);
    }
  };

  const handleRegenerate = async (versionId) => {
    const res = await request(`/api/v1/content/packages/${versionId}/regenerate/`, {
      method: 'POST'
    });
    if (res.ok) {
      loadPublishDetails();
    }
  };

  const handleDownloadFile = async (versionId, filename) => {
    try {
      const token = localStorage.getItem('access_token');
      // API_BASE_URL is imported from ./config at the top of this file
      const targetUrl = `${API_BASE_URL}/api/v1/content/packages/${versionId}/download/`;
      
      const response = await fetch(targetUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        alert("Failed to download package from server.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `package_${versionId}.elab`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error", e);
      alert("Error occurred during download.");
    }
  };

  return (
    <div>
      <h2>Publish Center Pipeline</h2>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Choose Scenario to Package & Publish:</label>
        <select value={selectedId || ''} onChange={e => setSelectedId(e.target.value)} style={{ margin: 0 }}>
          <option value="">Select Scenario...</option>
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.title} ({s.status})</option>
          ))}
        </select>
      </div>

      {selectedId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', alignItems: 'start' }}>
          
          {/* History and details */}
          <div>
            {statusInfo && (
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                <h3>Publish Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                  <div><strong>Scenario Status:</strong> {statusInfo.status}</div>
                  <div><strong>Latest Version:</strong> {statusInfo.latest_version ? statusInfo.latest_version.version_number : "N/A"}</div>
                </div>
              </div>
            )}

            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3>Version History</h3>
              <table className="dashboard-table" style={{ width: '100%', marginTop: '15px' }}>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Build</th>
                    <th>Size (KB)</th>
                    <th>Release Notes</th>
                    <th>Published At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 'bold' }}>{v.version_number}</td>
                      <td>{v.build_number}</td>
                      <td>{(v.package_size / 1024).toFixed(1)} KB</td>
                      <td>{v.release_notes || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None</span>}</td>
                      <td>{new Date(v.published_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleDownloadFile(v.id, `${v.version_number}.elab`)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><FiDownload /> Download</button>
                          <button onClick={() => handleRegenerate(v.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><FiRefreshCw /> Regenerate</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No versions published.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Publish Controls */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3>Publish Package</h3>
            
            {pubErrors && (
              <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', padding: '15px', borderRadius: '6px', fontSize: '13px', margin: '15px 0' }}>
                <strong>Publish Blocked by Validation errors:</strong>
                <ul style={{ paddingLeft: '20px', margin: '10px 0 0 0' }}>
                  {pubErrors.validation_report?.results?.filter(r => r.severity === 'ERROR').map((err, idx) => (
                    <li key={idx} style={{ marginBottom: '5px' }}>{err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div className="form-group">
                <label>Manual Version String (Optional)</label>
                <input type="text" value={manualVersion} onChange={e => setManualVersion(e.target.value)} placeholder="e.g. 1.0 (auto-bumps if empty)" />
              </div>
              <div className="form-group">
                <label>Release Notes</label>
                <textarea value={releaseNotes} onChange={e => setReleaseNotes(e.target.value)} placeholder="Release notes summary..." />
              </div>
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <FiPlayCircle /> Compile & Publish Package
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};

export default ContentStudio;
