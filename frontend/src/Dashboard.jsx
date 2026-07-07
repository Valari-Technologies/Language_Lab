import React, { useState, useEffect } from 'react';
import { 
  FiShield, 
  FiLayers, 
  FiBarChart2, 
  FiClock,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLogOut,
  FiGrid,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiBookOpen,
  FiList,
  FiHelpCircle,
  FiFileText,
  FiCornerDownRight,
  FiMenu,
  FiX,
  FiUser
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

const Dashboard = ({ user, onLogout, activeTab, onTabChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data lists
  const [grades, setGrades] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [steps, setSteps] = useState([]);
  const [schools, setSchools] = useState([]);
  const [publishContents, setPublishContents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ total_schools: 0, total_school_admins: 0, total_publish_contents: 0, total_grades: 0 });
  const [previewScenario, setPreviewScenario] = useState(null);
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '', full_name: user?.full_name || '', password: '' });
  const [schoolForm, setSchoolForm] = useState({
    school_name: '', address: '', phone: '', email: '', logo: '', is_active: true
  });
  const [publishForm, setPublishForm] = useState({
    release_name: '', grade: '', total_scenarios: 0, status: 'DRAFT', export_file: '', checksum: ''
  });


  // Filter overrides for nested navigation
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [selectedExperienceFilter, setSelectedExperienceFilter] = useState('');

  // Loading & error feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal forms management
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [gradeForm, setGradeForm] = useState({ grade_name: '', description: '', sort_order: 1 });
  const [experienceForm, setExperienceForm] = useState({
    grade: '', title: '', description: '', objective: '', estimated_duration: 15, difficulty: 'MEDIUM', status: 'DRAFT', thumbnail: ''
  });
  const [stepForm, setStepForm] = useState({
    experience: '', block_type: 'VIDEO', title: '', content: '', media_url: '', display_order: 1, settings: '{}'
  });

  // Fetch all helper loaders
    const loadSchools = async () => {
    try {
      const res = await apiFetch('/api/schools/');
      if (res.ok) {
        const data = await res.json();
        setSchools(data.results || data);
      }
    } catch (e) { console.error('Failed to load schools', e); }
  };

  const loadPublishContents = async () => {
    try {
      const res = await apiFetch('/api/cms/publish-contents/');
      if (res.ok) {
        const data = await res.json();
        setPublishContents(data.results || data);
      }
    } catch (e) { console.error('Failed to load publish contents', e); }
  };

  const loadDashboardStats = async () => {
    try {
      const res = await apiFetch('/api/cms/dashboard-stats/');
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
      }
    } catch (e) { console.error('Failed to load dashboard stats', e); }
  };

  const handlePreviewScenario = async (scenario) => {
    try {
      const res = await apiFetch(`/api/cms/scenario-builders/?experience=${scenario.id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewScenario({ ...scenario, steps: data.results || data });
      } else {
        setPreviewScenario({ ...scenario, steps: [] });
      }
    } catch (e) {
      setPreviewScenario({ ...scenario, steps: [] });
    }
  };

  const loadGrades = async () => {
    try {
      const res = await apiFetch('/api/cms/grades/');
      if (res.ok) {
        const data = await res.json();
        setGrades(data.results || data);
      }
    } catch (e) { console.error('Failed to load grades', e); }
  };

  const loadExperiences = async () => {
    try {
      const res = await apiFetch('/api/cms/learning-experiences/');
      if (res.ok) {
        const data = await res.json();
        setExperiences(data.results || data);
      }
    } catch (e) { console.error('Failed to load experiences', e); }
  };

  const loadSteps = async () => {
    try {
      const res = await apiFetch('/api/cms/experience-steps/');
      if (res.ok) {
        const data = await res.json();
        setSteps(data.results || data);
      }
    } catch (e) { console.error('Failed to load steps', e); }
  };




  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([
        loadSchools(),
        loadPublishContents(),
        loadDashboardStats(),
        loadGrades(),
        loadExperiences(),
        loadSteps(),
      ]);
    } catch (e) {
      setErrorMsg('Failed to load data from backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Load everything on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Show temporary success/error alerts
  const showFeedback = (success, error) => {
    if (success) {
      setSuccessMsg(success);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
    if (error) {
      setErrorMsg(error);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Clean form values
  const initForm = (tab, entity = null) => {
    setErrorMsg('');
    if (tab === 'grades') {
      setGradeForm(entity ? {
        grade_name: entity.grade_name || '',
        description: entity.description || '',
        sort_order: entity.sort_order || 1
      } : { grade_name: '', description: '', sort_order: grades.length + 1 });
    } else if (tab === 'experiences') {
      setExperienceForm(entity ? {
        grade: entity.grade?.id || entity.grade || '',
        title: entity.title || '',
        description: entity.description || '',
        objective: entity.objective || '',
        estimated_duration: entity.estimated_duration || 15,
        difficulty: entity.difficulty || 'MEDIUM',
        status: entity.status || 'DRAFT',
        thumbnail: entity.thumbnail || ''
      } : {
        grade: selectedGradeFilter || (grades[0]?.id || ''),
        title: '',
        description: '',
        objective: '',
        estimated_duration: 15,
        difficulty: 'MEDIUM',
        status: 'DRAFT',
        thumbnail: ''
      });
    } else if (tab === 'steps') {
      setStepForm(entity ? {
        experience: entity.experience?.id || entity.experience || '',
        block_type: entity.block_type || 'VIDEO',
        title: entity.title || '',
        content: entity.content || '',
        media_url: entity.media_url || '',
        display_order: entity.display_order || 1,
        settings: JSON.stringify(entity.settings || {}, null, 2)
      } : {
        experience: selectedExperienceFilter || (experiences[0]?.id || ''),
        block_type: 'VIDEO',
        title: '',
        content: '',
        media_url: '',
        display_order: steps.filter(s => s.experience?.id === selectedExperienceFilter).length + 1,
        settings: '{}'
      });
    }
  };

  const handleOpenAdd = () => {
    setModalType('add');
    setEditingId(null);
    initForm(activeTab);
    setShowModal(true);
  };

  const handleOpenEdit = (entity) => {
    setModalType('edit');
    setEditingId(entity.id || entity.school_id || entity.publish_id);
    initForm(activeTab, entity);
    setShowModal(true);
  };

  // Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    let body = {};
    let url = `/api/cms/${activeTab === 'experiences' ? 'learning-experiences' : activeTab === 'steps' ? 'experience-steps' : activeTab}/`;
    
    if (modalType === 'edit') {
      url += `${editingId}/`;
    }

    try {
            if (activeTab === 'schools') {
        body = { ...schoolForm };
      } else if (activeTab === 'publish-contents') {
        body = { 
          ...publishForm, 
          grade: parseInt(publishForm.grade), 
          total_scenarios: parseInt(publishForm.total_scenarios) 
        };
      } else if (activeTab === 'grades') {
        body = { ...gradeForm };
      } else if (activeTab === 'experiences') {
        body = { ...experienceForm, grade: parseInt(experienceForm.grade) };
      } else if (activeTab === 'steps') {
        let settingsJson = {};
        try {
          settingsJson = JSON.parse(stepForm.settings || '{}');
        } catch (err) {
          setErrorMsg('Settings must be valid JSON object.');
          return;
        }
        body = { 
          ...stepForm, 
          experience: parseInt(stepForm.experience),
          settings: settingsJson 
        };
      }

      const method = modalType === 'add' ? 'POST' : 'PUT';
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(body)
      });

      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Operation successful', null);
        setShowModal(false);
        // Refresh data lists
        if (activeTab === 'schools') { await loadSchools(); await loadDashboardStats(); }
        else if (activeTab === 'publish-contents') { await loadPublishContents(); await loadDashboardStats(); }
        else if (activeTab === 'schools') { await loadSchools(); await loadDashboardStats(); }
        else if (activeTab === 'publish-contents') { await loadPublishContents(); await loadDashboardStats(); }
        else if (activeTab === 'grades') await loadGrades();
        else if (activeTab === 'experiences') await loadExperiences();
        else if (activeTab === 'steps') await loadSteps();
      } else {
        const errorDetail = typeof resData === 'object' ? JSON.stringify(resData) : resData;
        setErrorMsg(`Error: ${errorDetail}`);
      }
    } catch (err) {
      setErrorMsg('Failed to process request. Make sure form data is correct.');
      console.error(err);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    setErrorMsg('');
    const url = `/api/cms/${activeTab === 'experiences' ? 'learning-experiences' : activeTab === 'steps' ? 'experience-steps' : activeTab}/${id}/`;
    
    try {
      const res = await apiFetch(url, { method: 'DELETE' });
      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Deleted successfully', null);
        if (activeTab === 'schools') { await loadSchools(); await loadDashboardStats(); }
        else if (activeTab === 'publish-contents') { await loadPublishContents(); await loadDashboardStats(); }
        else if (activeTab === 'schools') { await loadSchools(); await loadDashboardStats(); }
        else if (activeTab === 'publish-contents') { await loadPublishContents(); await loadDashboardStats(); }
        else if (activeTab === 'grades') await loadGrades();
        else if (activeTab === 'experiences') await loadExperiences();
        else if (activeTab === 'steps') await loadSteps();
      } else {
        setErrorMsg(resData.message || 'Failed to delete record.');
      }
    } catch (err) {
      setErrorMsg('Error communicating with backend.');
      console.error(err);
    }
  };

  // Stats generators
  const getStats = () => {
    return {
      schools: schools.length,
      schools: schools.length,
      grades: grades.length,
      experiences: experiences.length,
      steps: steps.length,
      publish_contents: publishContents.length
    };
  };
  const stats = getStats();

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
          <span className="brand-name-small">Language Lab</span>
        </div>
        <div className="mobile-user-avatar">
          {user.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
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
            <FiShield />
          </div>
          <div>
            <h3 className="brand-name">Language Lab</h3>
            <span className="brand-badge">CMS Portal</span>
          </div>
          {/* Mobile Close Button */}
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
                    <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { onTabChange('dashboard'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiShield className="nav-icon" />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'schools' ? 'active' : ''}`}
            onClick={() => { onTabChange('schools'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiGrid className="nav-icon" />
            <span>Schools</span>
            <span className="nav-count">{stats.schools}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => { onTabChange('grades'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiGrid className="nav-icon" />
            <span>Grades</span>
            <span className="nav-count">{stats.grades}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'experiences' ? 'active' : ''}`}
            onClick={() => { onTabChange('experiences'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiBookOpen className="nav-icon" />
            <span>Learning Exp.</span>
            <span className="nav-count">{stats.experiences}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'steps' ? 'active' : ''}`}
            onClick={() => { onTabChange('steps'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiList className="nav-icon" />
            <span>Exp. Steps</span>
            <span className="nav-count">{stats.steps}</span>
          </button>



          <button 
            className={`nav-link ${activeTab === 'publish-contents' ? 'active' : ''}`}
            onClick={() => { onTabChange('publish-contents'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiFileText className="nav-icon" />
            <span>Publish Content</span>
            <span className="nav-count">{stats.publish_contents}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { onTabChange('profile'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiUser className="nav-icon" />
            <span>Profile Settings</span>
          </button>

        </nav>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="user-meta">
            <div className="user-name">{user.username}</div>
            <div className="user-role">{user.role || 'Super Admin'}</div>
          </div>
          <button onClick={() => { setIsSidebarOpen(false); onLogout(); }} className="logout-btn" title="Sign Out">
            <FiLogOut />
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-info">
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Super Admin Overview'}
              {activeTab === 'schools' && 'Manage Schools'}
              {activeTab === 'publish-contents' && 'Publish History'}
              {activeTab === 'grades' && 'Manage Grades'}
              {activeTab === 'experiences' && 'Scenarios'}
              {activeTab === 'steps' && 'Experience Steps Content'}
            </h1>
            <p className="page-subtitle">Configure English Learning Content and structures dynamically</p>
          </div>

          {/* Search Box */}
          <div className="header-search">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </header>

        {/* Notifications */}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        {/* Nested Nav Badges / Filters */}
        <div className="filters-row">
          <div className="filter-tags">
            {/* Grade Filter */}
            {activeTab === 'experiences' && (
              <div className="filter-group">
                <span className="filter-label">Grade:</span>
                <select 
                  value={selectedGradeFilter} 
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Grades</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.grade_name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Experience Filter */}
            {activeTab === 'steps' && (
              <div className="filter-group">
                <span className="filter-label">Experience:</span>
                <select 
                  value={selectedExperienceFilter} 
                  onChange={(e) => setSelectedExperienceFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Experiences</option>
                  {experiences.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>
            )}

          </div>
          <button onClick={handleOpenAdd} className="btn-add">
            <FiPlus />
            <span>Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}</span>
          </button>
        </div>

        {/* Data Container Panel */}
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching resources from the REST server...</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
                            {/* DASHBOARD OVERVIEW TAB */}
              {activeTab === 'dashboard' && (
                <div className="dashboard-wrapper">
                  <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                    <div className="stats-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Total Schools</h4>
                      <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 600, color: '#0f172a' }}>{dashboardStats.total_schools}</p>
                    </div>
                    <div className="stats-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>School Admins</h4>
                      <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 600, color: '#0f172a' }}>{dashboardStats.total_school_admins}</p>
                    </div>
                    <div className="stats-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Publish Contents</h4>
                      <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 600, color: '#0f172a' }}>{dashboardStats.total_publish_contents}</p>
                    </div>
                    <div className="stats-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Total Grades</h4>
                      <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 600, color: '#0f172a' }}>{dashboardStats.total_grades}</p>
                    </div>
                  </div>
                  
                  <div className="recent-scenarios-card">
                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>Welcome to Language Lab Admin Panel</h3>
                    <p style={{ marginTop: '10px', color: '#64748b' }}>Use the sidebar navigation to manage schools, grades, scenarios, scenario builders, and release publish packages.</p>
                  </div>
                </div>
              )}

              {/* PROFILE SETTINGS TAB */}
              {activeTab === 'profile' && (
                <div className="dashboard-wrapper">
                  <div className="recent-scenarios-card">
                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>Profile Settings</h3>
                    <p style={{marginTop:'10px', color:'#64748b'}}>View and update your account details.</p>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await apiFetch('/api/users/profile/', {
                           method: 'PUT',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify(profileForm)
                        });
                        if(res.ok) {
                           alert('Profile updated successfully!');
                        } else {
                           alert('Failed to update profile.');
                        }
                      } catch(e) {
                        alert('Error connecting to backend.');
                      }
                    }}>
                      <div style={{marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                          <div className="form-group">
                            <label>Username</label>
                            <input type="text" value={profileForm?.username || ''} disabled style={{background:'#e2e8f0', cursor:'not-allowed'}} />
                            <small>Username cannot be changed.</small>
                          </div>
                          <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" value={profileForm?.full_name || ''} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={profileForm?.email || ''} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label>New Password (Optional)</label>
                            <input type="password" placeholder="Leave blank to keep current password" value={profileForm?.password || ''} onChange={e => setProfileForm({...profileForm, password: e.target.value})} />
                          </div>
                        </div>
                      </div>
                      <div style={{marginTop:'20px'}}>
                        <button type="submit" className="btn-primary" style={{padding:'0.75rem 1.5rem'}}>Update Profile</button>
                      </div>
                    </form>

                  </div>
                </div>
              )}

              {/* SCHOOLS TAB */}
              {activeTab === 'schools' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>School Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools
                      .filter(s => s.school_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(s => (
                        <tr key={s.school_id || s.id}>
                          <td className="bold-text">{s.school_name}</td>
                          <td>{s.email}</td>
                          <td>{s.phone}</td>
                          <td>
                            <span className={`badge-pill status ${s.is_active ? 'published' : 'draft'}`}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(s)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(s.school_id || s.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* PUBLISH CONTENT TAB */}
              {activeTab === 'publish-contents' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Release Name</th>
                      <th>Grade</th>
                      <th>Total Scenarios</th>
                      <th>Status</th>
                      <th>Checksum</th>
                      <th>Package</th>
                      <th>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publishContents
                      .filter(p => p.release_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(p => (
                        <tr key={p.publish_id || p.id}>
                          <td className="bold-text">{p.release_name}</td>
                          <td>{p.grade_name || p.grade}</td>
                          <td>{p.total_scenarios}</td>
                          <td>
                            <span className={`badge-pill status ${p.status?.toLowerCase()}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="dim-text">{p.checksum || 'N/A'}</td>
                          <td>
                            {p.export_file ? (
                              <a href={p.export_file} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FiFileText /> Download
                              </a>
                            ) : (
                              <span className="dim-text">No package</span>
                            )}
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(p)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(p.publish_id || p.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* GRADES TAB */}
              {activeTab === 'grades' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Grade Name</th>
                      <th>Description</th>
                      <th>Direct Navigation</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades
                      .filter(g => g.grade_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(g => (
                        <tr key={g.id}>
                          <td className="bold-text">#{g.sort_order}</td>
                          <td className="highlight-text">{g.grade_name}</td>
                          <td>{g.description || <span className="dim-text">No description</span>}</td>
                          <td>
                            <button 
                              onClick={() => { setSelectedGradeFilter(g.id); setActiveTab('experiences'); }}
                              className="btn-link"
                            >
                              <FiCornerDownRight /> Experiences
                            </button>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(g)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(g.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* EXPERIENCES TAB */}
              {activeTab === 'experiences' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th>Title</th>
                      <th>Duration</th>
                      <th>Difficulty</th>
                      <th>Status</th>
                      <th>Components</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experiences
                      .filter(ex => !selectedGradeFilter || ex.grade?.id === parseInt(selectedGradeFilter) || ex.grade === parseInt(selectedGradeFilter))
                      .filter(ex => ex.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(ex => (
                        <tr key={ex.id}>
                          <td className="badge-cell">
                            <span className="badge-pill grade">
                              {ex.grade_detail?.grade_name || ex.grade_name || `Grade ID: ${ex.grade}`}
                            </span>
                          </td>
                          <td className="bold-text">{ex.title}</td>
                          <td>
                            <span className="duration-tag">
                              <FiClock /> {ex.estimated_duration} mins
                            </span>
                          </td>
                          <td>
                            <span className={`badge-pill difficulty ${ex.difficulty?.toLowerCase()}`}>
                              {ex.difficulty}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-pill status ${ex.status?.toLowerCase()}`}>
                              {ex.status}
                            </span>
                          </td>
                          <td className="navigation-shortcuts">
                            <button 
                              onClick={() => { setSelectedExperienceFilter(ex.id); setActiveTab('steps'); }}
                              className="btn-link"
                            >
                              Steps
                            </button>
                            <span className="divider">|</span>
                            <button 
                              className="btn-link"
                            >
                              Assessments
                            </button>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handlePreviewScenario(ex)} className="action-btn preview" title="Preview" style={{ background: '#3b82f6', color: '#fff' }}><FiBookOpen /></button>
                            <button onClick={() => handleOpenEdit(ex)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(ex.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* STEPS TAB */}
              {activeTab === 'steps' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Scenario</th>
                      <th>Block Type</th>
                      <th>Scenario Builder Title</th>
                      <th>Content Preview</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps
                      .filter(s => !selectedExperienceFilter || s.experience?.id === parseInt(selectedExperienceFilter) || s.experience === parseInt(selectedExperienceFilter))
                      .filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(s => (
                        <tr key={s.id}>
                          <td className="bold-text">#{s.display_order}</td>
                          <td className="dim-text">{s.experience_detail?.title || `Exp ID: ${s.experience}`}</td>
                          <td>
                            <span className={`badge-pill block-type ${s.block_type?.toLowerCase()}`}>
                              {s.block_type}
                            </span>
                          </td>
                          <td className="highlight-text">{s.title}</td>
                          <td className="content-cell">{s.content || <span className="dim-text">No content</span>}</td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(s)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(s.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          )}
        </div>
      </main>

            {/* SCENARIO PREVIEW MODAL */}
      {previewScenario && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '800px', width: '90%' }}>
            <header className="modal-header">
              <h3>Preview Scenario: {previewScenario.title}</h3>
              <button onClick={() => setPreviewScenario(null)} className="close-modal-btn"><FiXCircle /></button>
            </header>
            <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '70vh' }}>
              <p><strong>Grade:</strong> {previewScenario.grade_detail?.grade_name || `Grade ID: ${previewScenario.grade}`}</p>
              <p><strong>Objective:</strong> {previewScenario.objective || 'No objective specified'}</p>
              <p><strong>Description:</strong> {previewScenario.description || 'No description specified'}</p>
              <p><strong>Estimated Duration:</strong> {previewScenario.estimated_duration} mins</p>
              <p><strong>Difficulty:</strong> {previewScenario.difficulty}</p>
              <p><strong>Status:</strong> {previewScenario.status}</p>
              
              <h4 style={{ marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Scenario Steps</h4>
              {previewScenario.steps && previewScenario.steps.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                  {previewScenario.steps.map((s, idx) => (
                    <div key={s.id || idx} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h5 style={{ margin: 0 }}>Step #{s.display_order}: {s.title} ({s.block_type})</h5>
                      {s.content && <p style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap', color: '#475569' }}>{s.content}</p>}
                      {s.media_url && <a href={s.media_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '10px', fontSize: '14px', color: '#3b82f6' }}>View Media Link</a>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ marginTop: '10px', color: '#64748b' }}>No scenario builder steps found for this scenario.</p>
              )}
            </div>
            <footer className="modal-actions">
              <button onClick={() => setPreviewScenario(null)} className="btn-secondary">Close Preview</button>
            </footer>
          </div>
        </div>
      )}

      {/* DYNAMIC FORM MODAL OVERLAY */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h3>{modalType === 'add' ? 'Create' : 'Edit'} {activeTab.slice(0, -1).toUpperCase()}</h3>
              <button onClick={() => setShowModal(false)} className="close-modal-btn"><FiXCircle /></button>
            </header>
            
            <form onSubmit={handleFormSubmit} className="modal-form">
                            {/* SCHOOLS FORM FIELDS */}
              {activeTab === 'schools' && (
                <>
                  <div className="form-group">
                    <label>School Name *</label>
                    <input type="text" required value={schoolForm.school_name} onChange={e => setSchoolForm({ ...schoolForm, school_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Address *</label>
                    <input type="text" required value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Phone *</label>
                      <input type="text" required value={schoolForm.phone} onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" required value={schoolForm.email} onChange={e => setSchoolForm({ ...schoolForm, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Logo URL</label>
                    <input type="text" value={schoolForm.logo} onChange={e => setSchoolForm({ ...schoolForm, logo: e.target.value })} />
                  </div>
                  <div className="form-group" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <input type="checkbox" checked={schoolForm.is_active} onChange={e => setSchoolForm({ ...schoolForm, is_active: e.target.checked })} id="is_active_school"/>
                    <label htmlFor="is_active_school" style={{marginBottom:0}}>Is Active</label>
                  </div>
                </>
              )}

              {/* PUBLISH CONTENT FORM FIELDS */}
              {activeTab === 'publish-contents' && (
                <>
                  <div className="form-group">
                    <label>Release Name *</label>
                    <input type="text" required value={publishForm.release_name} onChange={e => setPublishForm({ ...publishForm, release_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Grade *</label>
                    <select required value={publishForm.grade} onChange={e => setPublishForm({ ...publishForm, grade: e.target.value })}>
                      <option value="">Select Grade</option>
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>{g.grade_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Total Scenarios *</label>
                      <input type="number" required value={publishForm.total_scenarios} onChange={e => setPublishForm({ ...publishForm, total_scenarios: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label>Status *</label>
                      <select value={publishForm.status} onChange={e => setPublishForm({ ...publishForm, status: e.target.value })}>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Export File URL</label>
                    <input type="text" value={publishForm.export_file} onChange={e => setPublishForm({ ...publishForm, export_file: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Checksum</label>
                    <input type="text" value={publishForm.checksum} onChange={e => setPublishForm({ ...publishForm, checksum: e.target.value })} />
                  </div>
                </>
              )}

              {/* GRADES FORM FIELDS */}
              {activeTab === 'grades' && (
                <>
                  <div className="form-group">
                    <label>Grade Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={gradeForm.grade_name} 
                      onChange={e => setGradeForm({ ...gradeForm, grade_name: e.target.value })}
                      placeholder="e.g. Grade 1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      value={gradeForm.description} 
                      onChange={e => setGradeForm({ ...gradeForm, description: e.target.value })}
                      placeholder="Enter description of this grade level"
                    />
                  </div>
                  <div className="form-group">
                    <label>Sort Order *</label>
                    <input 
                      type="number" 
                      required 
                      value={gradeForm.sort_order} 
                      onChange={e => setGradeForm({ ...gradeForm, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </>
              )}

              {/* EXPERIENCES FORM FIELDS */}
              {activeTab === 'experiences' && (
                <>
                  <div className="form-group">
                    <label>Grade Level *</label>
                    <select 
                      required 
                      value={experienceForm.grade}
                      onChange={e => setExperienceForm({ ...experienceForm, grade: e.target.value })}
                    >
                      <option value="">Select Grade</option>
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>{g.grade_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input 
                      type="text" 
                      required 
                      value={experienceForm.title} 
                      onChange={e => setExperienceForm({ ...experienceForm, title: e.target.value })}
                      placeholder="e.g. Beginner Vocabulary"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      value={experienceForm.description} 
                      onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })}
                      placeholder="Enter description"
                    />
                  </div>
                  <div className="form-group">
                    <label>Objective</label>
                    <textarea 
                      value={experienceForm.objective} 
                      onChange={e => setExperienceForm({ ...experienceForm, objective: e.target.value })}
                      placeholder="Pedagogical objectives"
                    />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Duration (Minutes) *</label>
                      <input 
                        type="number" 
                        required 
                        value={experienceForm.estimated_duration} 
                        onChange={e => setExperienceForm({ ...experienceForm, estimated_duration: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Difficulty *</label>
                      <select 
                        value={experienceForm.difficulty} 
                        onChange={e => setExperienceForm({ ...experienceForm, difficulty: e.target.value })}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Lifecycle Status *</label>
                    <select 
                      value={experienceForm.status} 
                      onChange={e => setExperienceForm({ ...experienceForm, status: e.target.value })}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="REVIEW">Review</option>
                      <option value="TESTING">Testing</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Thumbnail Cover URL</label>
                    <input 
                      type="url" 
                      value={experienceForm.thumbnail} 
                      onChange={e => setExperienceForm({ ...experienceForm, thumbnail: e.target.value })}
                      placeholder="https://example.com/cover.png"
                    />
                  </div>
                </>
              )}

              {/* STEPS FORM FIELDS */}
              {activeTab === 'steps' && (
                <>
                  <div className="form-group">
                    <label>Scenario *</label>
                    <select 
                      required 
                      value={stepForm.experience}
                      onChange={e => setStepForm({ ...stepForm, experience: e.target.value })}
                    >
                      <option value="">Select Scenario</option>
                      {experiences.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Block Type *</label>
                      <select 
                        value={stepForm.block_type} 
                        onChange={e => setStepForm({ ...stepForm, block_type: e.target.value })}
                      >
                        <option value="VIDEO">Video</option>
                        <option value="STORY">Story</option>
                        <option value="AUDIO">Audio</option>
                        <option value="VOCABULARY">Vocabulary</option>
                        <option value="GRAMMAR_GAME">Grammar Game</option>
                        <option value="SPEAKING">Speaking</option>
                        <option value="WRITING">Writing</option>
                        <option value="MCQ">MCQ Block</option>
                        <option value="SUMMARY">Summary</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Display Order *</label>
                      <input 
                        type="number" 
                        required 
                        value={stepForm.display_order} 
                        onChange={e => setStepForm({ ...stepForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Step Title *</label>
                    <input 
                      type="text" 
                      required 
                      value={stepForm.title} 
                      onChange={e => setStepForm({ ...stepForm, title: e.target.value })}
                      placeholder="e.g. Introduce vocabulary"
                    />
                  </div>
                  <div className="form-group">
                    <label>Body Content</label>
                    <textarea 
                      value={stepForm.content} 
                      onChange={e => setStepForm({ ...stepForm, content: e.target.value })}
                      placeholder="Enter body content or text story"
                    />
                  </div>
                  <div className="form-group">
                    <label>Media File URL</label>
                    <input 
                      type="url" 
                      value={stepForm.media_url} 
                      onChange={e => setStepForm({ ...stepForm, media_url: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Configuration Settings (JSON) *</label>
                    <textarea 
                      value={stepForm.settings} 
                      onChange={e => setStepForm({ ...stepForm, settings: e.target.value })}
                      placeholder='{ "autoplay": true }'
                      className="monospace-textarea"
                    />
                  </div>
                </>
              )}

              <footer className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Entity</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
