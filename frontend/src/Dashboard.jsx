import React, { useState, useEffect } from 'react';
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
  FiUser
} from 'react-icons/fi';
import './Dashboard.css';
import { apiFetch } from './api';

const Dashboard = ({ user, onLogout, activeTab, onTabChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data lists
  const [grades, setGrades] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [scenarioBuilders, setScenarioBuilders] = useState([]);
  const [schools, setSchools] = useState([]);
  const [publishContents, setPublishContents] = useState([]);
  const [schoolAdmins, setSchoolAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ total_schools: 0, total_school_admins: 0, total_publish_contents: 0, total_grades: 0 });
  const [previewScenario, setPreviewScenario] = useState(null);
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '', full_name: user?.full_name || '', current_password: '', password: '' });
  const [schoolForm, setSchoolForm] = useState({
    school_name: '', address: '', phone: '', email: '', logo: '', is_active: true
  });
  const [publishForm, setPublishForm] = useState({
    release_name: '', grade: '', total_scenarios: 0, status: 'DRAFT', export_file: '', checksum: ''
  });


  // Filter overrides for nested navigation
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [selectedScenarioFilter, setSelectedScenarioFilter] = useState('');

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
  const [scenarioForm, setScenarioForm] = useState({
    grade: '', title: '', description: '', objective: '', estimated_duration: 15, difficulty: 'MEDIUM', status: 'DRAFT', thumbnail: ''
  });
  const [scenarioBuilderForm, setScenarioBuilderForm] = useState({
    scenario: '', block_type: 'VIDEO', title: '', content: '', media_url: '', display_order: 1, settings: '{}'
  });
  const [schoolAdminForm, setSchoolAdminForm] = useState({
    username: '', email: '', full_name: '', is_active: true, school: '', password: ''
  });
  const [teacherForm, setTeacherForm] = useState({
    full_name: '', email: '', is_active: true, school: '', qualification: '', experience_years: 0
  });

  // Fetch all helper loaders
  const loadSchools = async () => {
    try {
      const res = await apiFetch('/api/cms/schools/');
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
      const res = await apiFetch(`/api/cms/scenario-builders/?scenario=${scenario.id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewScenario({ ...scenario, steps: data.results || data });
      } else {
        setPreviewScenario({ ...scenario, steps: [] });
      }
    } catch (e) {
      console.error('Failed to load scenario steps', e);
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

  const loadScenarios = async () => {
    try {
      const res = await apiFetch('/api/cms/scenarios/');
      if (res.ok) {
        const data = await res.json();
        setScenarios(data.results || data);
      }
    } catch (e) { console.error('Failed to load scenarios', e); }
  };

  const loadScenarioBuilders = async () => {
    try {
      const res = await apiFetch('/api/cms/scenario-builders/');
      if (res.ok) {
        const data = await res.json();
        setScenarioBuilders(data.results || data);
      }
    } catch (e) { console.error('Failed to load scenario builders', e); }
  };

  const loadSchoolAdmins = async () => {
    try {
      const res = await apiFetch('/api/cms/school-admins/');
      if (res.ok) {
        const data = await res.json();
        setSchoolAdmins(data.results || data);
      }
    } catch (e) { console.error('Failed to load school admins', e); }
  };

  const loadTeachers = async () => {
    try {
      const res = await apiFetch('/api/cms/teachers/');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.results || data);
      }
    } catch (e) { console.error('Failed to load teachers', e); }
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
        loadScenarios(),
        loadScenarioBuilders(),
        loadSchoolAdmins(),
        loadTeachers(),
      ]);
    } catch (e) {
      console.error('Failed to load data from backend server.', e);
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
    if (tab === 'schools') {
      setSchoolForm(entity ? {
        school_name: entity.school_name || '',
        address: entity.address || '',
        phone: entity.phone || '',
        email: entity.email || '',
        logo: entity.logo || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : { school_name: '', address: '', phone: '', email: '', logo: '', is_active: true });
    } else if (tab === 'publish-contents') {
      setPublishForm(entity ? {
        release_name: entity.release_name || '',
        grade: entity.grade || '',
        total_scenarios: entity.total_scenarios || 0,
        status: entity.status || 'DRAFT',
        export_file: entity.export_file || '',
        checksum: entity.checksum || ''
      } : { release_name: '', grade: '', total_scenarios: 0, status: 'DRAFT', export_file: '', checksum: '' });
    } else if (tab === 'grades') {
      setGradeForm(entity ? {
        grade_name: entity.grade_name || '',
        description: entity.description || '',
        sort_order: entity.sort_order || 1
      } : { grade_name: '', description: '', sort_order: grades.length + 1 });
    } else if (tab === 'scenarios') {
      setScenarioForm(entity ? {
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
    } else if (tab === 'scenario-builders') {
      setScenarioBuilderForm(entity ? {
        scenario: entity.scenario?.id || entity.scenario || '',
        block_type: entity.block_type || 'VIDEO',
        title: entity.title || '',
        content: entity.content || '',
        media_url: entity.media_url || '',
        display_order: entity.display_order || 1,
        settings: JSON.stringify(entity.settings || {}, null, 2)
      } : {
        scenario: selectedScenarioFilter || (scenarios[0]?.id || ''),
        block_type: 'VIDEO',
        title: '',
        content: '',
        media_url: '',
        display_order: scenarioBuilders.filter(s => s.scenario?.id === parseInt(selectedScenarioFilter) || s.scenario === parseInt(selectedScenarioFilter)).length + 1,
        settings: '{}'
      });
    } else if (tab === 'school-admins') {
      setSchoolAdminForm(entity ? {
        username: entity.username || '',
        email: entity.email || '',
        full_name: entity.full_name || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true,
        school: entity.school_id || entity.school || (schools[0]?.school_id || ''),
        password: ''
      } : {
        username: '', email: '', full_name: '', is_active: true,
        school: schools[0]?.school_id || '', password: ''
      });
    } else if (tab === 'teachers') {
      setTeacherForm(entity ? {
        username: entity.username || '',
        full_name: entity.full_name || '',
        email: entity.email || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true,
        school: entity.school || '',
        qualification: entity.qualification || '',
        experience_years: entity.experience_years || 0
      } : { username: '', full_name: '', email: '', is_active: true, school: '', qualification: '', experience_years: 0, password: '' });
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
    setEditingId(entity.id || entity.school_id || entity.publish_id || entity.teacher_id);
    initForm(activeTab, entity);
    setShowModal(true);
  };

  // Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    let body = {};
    let url = `/api/cms/${activeTab}/`;
    
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
      } else if (activeTab === 'scenarios') {
        body = { ...scenarioForm, grade: parseInt(scenarioForm.grade) };
      } else if (activeTab === 'scenario-builders') {
        let settingsJson = {};
        try {
          settingsJson = JSON.parse(scenarioBuilderForm.settings || '{}');
        } catch {
          setErrorMsg('Settings must be valid JSON object.');
          return;
        }
        body = { 
          ...scenarioBuilderForm, 
          scenario: parseInt(scenarioBuilderForm.scenario),
          settings: settingsJson 
        };
      } else if (activeTab === 'school-admins') {
        body = {
          ...schoolAdminForm,
          school: parseInt(schoolAdminForm.school, 10),
        };
        if (modalType === 'edit') {
          delete body.password;
        }
      } else if (activeTab === 'teachers') {
        body = { 
          ...teacherForm,
          school: parseInt(teacherForm.school),
          experience_years: parseInt(teacherForm.experience_years) || 0
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
        else if (activeTab === 'grades') await loadGrades();
        else if (activeTab === 'scenarios') await loadScenarios();
        else if (activeTab === 'scenario-builders') await loadScenarioBuilders();
        else if (activeTab === 'school-admins') await loadSchoolAdmins();
        else if (activeTab === 'teachers') await loadTeachers();
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
    const url = `/api/cms/${activeTab}/${id}/`;
    
    try {
      const res = await apiFetch(url, { method: 'DELETE' });
      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Deleted successfully', null);
        if (activeTab === 'schools') { await loadSchools(); await loadDashboardStats(); }
        else if (activeTab === 'publish-contents') { await loadPublishContents(); await loadDashboardStats(); }
        else if (activeTab === 'grades') await loadGrades();
        else if (activeTab === 'scenarios') await loadScenarios();
        else if (activeTab === 'scenario-builders') await loadScenarioBuilders();
        else if (activeTab === 'school-admins') await loadSchoolAdmins();
        else if (activeTab === 'teachers') await loadTeachers();
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
      grades: grades.length,
      scenarios: scenarios.length,
      scenarioBuilders: scenarioBuilders.length,
      publish_contents: publishContents.length,
      schoolAdmins: schoolAdmins.length,
      teachers: teachers.length
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
            className={`nav-link ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => { onTabChange('scenarios'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiBookOpen className="nav-icon" />
            <span>Scenarios</span>
            <span className="nav-count">{stats.scenarios}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'scenario-builders' ? 'active' : ''}`}
            onClick={() => { onTabChange('scenario-builders'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiList className="nav-icon" />
            <span>Scenario Builders</span>
            <span className="nav-count">{stats.scenarioBuilders}</span>
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
            className={`nav-link ${activeTab === 'school-admins' ? 'active' : ''}`}
            onClick={() => { onTabChange('school-admins'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiUser className="nav-icon" />
            <span>School Admins</span>
            <span className="nav-count">{stats.schoolAdmins}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => { onTabChange('teachers'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiUser className="nav-icon" />
            <span>Teachers</span>
            <span className="nav-count">{stats.teachers}</span>
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
              {activeTab === 'scenarios' && 'Scenarios'}
              {activeTab === 'scenario-builders' && 'Scenario Builders Content'}
              {activeTab === 'school-admins' && 'Manage School Admins'}
              {activeTab === 'teachers' && 'Manage Teachers'}
              {activeTab === 'profile' && 'Profile Settings'}
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
        {!['dashboard', 'profile'].includes(activeTab) && (
        <div className="filters-row">
          <div className="filter-tags">
            {/* Grade Filter */}
            {activeTab === 'scenarios' && (
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

            {/* Scenario Filter */}
            {activeTab === 'scenario-builders' && (
              <div className="filter-group">
                <span className="filter-label">Scenario:</span>
                <select 
                  value={selectedScenarioFilter} 
                  onChange={(e) => setSelectedScenarioFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Scenarios</option>
                  {scenarios.map(ex => (
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
        )}

        {/* Data Container Panel */}
        {loading ? (
          <div className="table-card">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching resources from the REST server...</p>
            </div>
          </div>
        ) : (
          <>
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
                  
                  <div className="recent-scenarios-card" style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>Welcome to Language Lab Admin Panel</h3>
                    <p style={{ marginTop: '10px', color: '#64748b' }}>Use the sidebar navigation to manage schools, grades, scenarios, scenario builders, and release publish packages.</p>
                  </div>
                </div>
              )}

              {/* PROFILE SETTINGS TAB */}
              {activeTab === 'profile' && (
                <div className="profile-wrapper" style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                  <div className="profile-card" style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>Profile Settings</h3>
                    <p style={{marginTop:'10px', color:'#64748b', marginBottom: '20px'}}>View and update your account details.</p>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setErrorMsg('');

                      if (profileForm.password && !profileForm.current_password) {
                        setErrorMsg('Enter your current password to set a new one.');
                        return;
                      }

                      try {
                        const res = await apiFetch('/api/users/profile/', {
                           method: 'PUT',
                           body: JSON.stringify({ full_name: profileForm.full_name, email: profileForm.email })
                        });
                        const resData = await res.json();
                        if (!res.ok) {
                          setErrorMsg(typeof resData === 'object' ? JSON.stringify(resData) : 'Failed to update profile.');
                          return;
                        }

                        if (profileForm.password) {
                          const pwRes = await apiFetch('/api/users/change-password/', {
                            method: 'POST',
                            body: JSON.stringify({ old_password: profileForm.current_password, new_password: profileForm.password })
                          });
                          const pwData = await pwRes.json();
                          if (!pwRes.ok) {
                            setErrorMsg(typeof pwData === 'object' ? JSON.stringify(pwData) : 'Profile saved, but password change failed.');
                            return;
                          }
                        }

                        setProfileForm({ ...profileForm, current_password: '', password: '' });
                        showFeedback('Profile updated successfully', null);
                      } catch {
                        setErrorMsg('Error connecting to backend.');
                      }
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="form-group">
                          <label>Username</label>
                          <input type="text" value={profileForm?.username || ''} disabled className="disabled-input" />
                          <small style={{ color: '#64748b', marginTop: '2px' }}>Username cannot be changed.</small>
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
                          <label>Current Password</label>
                          <input type="password" placeholder="Required only to set a new password" value={profileForm?.current_password || ''} onChange={e => setProfileForm({...profileForm, current_password: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>New Password (Optional)</label>
                          <input type="password" placeholder="Leave blank to keep current password" value={profileForm?.password || ''} onChange={e => setProfileForm({...profileForm, password: e.target.value})} />
                        </div>
                      </div>
                      <div style={{marginTop:'25px'}}>
                        <button type="submit" className="btn-primary" style={{padding:'0.75rem 1.5rem', width: '100%'}}>Update Profile</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Data Container Panel for CRUD */}
              {!['dashboard', 'profile'].includes(activeTab) && (
                <div className="table-card">
                  <div className="data-table-wrapper">
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
                              onClick={() => { setSelectedGradeFilter(g.id); onTabChange('scenarios'); }}
                              className="btn-link"
                            >
                              <FiCornerDownRight /> Scenarios
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

              {/* SCENARIOS TAB */}
              {activeTab === 'scenarios' && (
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
                    {scenarios
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
                              onClick={() => { setSelectedScenarioFilter(ex.id); onTabChange('scenario-builders'); }}
                              className="btn-link"
                            >
                              Scenario Builders
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

              {/* SCENARIO BUILDERS TAB */}
              {activeTab === 'scenario-builders' && (
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
                    {scenarioBuilders
                      .filter(s => !selectedScenarioFilter || s.scenario?.id === parseInt(selectedScenarioFilter) || s.scenario === parseInt(selectedScenarioFilter))
                      .filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(s => (
                        <tr key={s.id}>
                          <td className="bold-text">#{s.display_order}</td>
                          <td className="dim-text">{s.scenario_detail?.title || s.experience_detail?.title || `Scenario ID: ${s.scenario}`}</td>
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

              {/* SCHOOL ADMINS TAB */}
              {activeTab === 'school-admins' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolAdmins
                      .filter(sa => sa.username?.toLowerCase().includes(searchQuery.toLowerCase()) || sa.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || sa.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(sa => (
                        <tr key={sa.id}>
                          <td className="bold-text">{sa.username}</td>
                          <td className="highlight-text">{sa.full_name || <span className="dim-text">N/A</span>}</td>
                          <td>{sa.email || <span className="dim-text">N/A</span>}</td>
                          <td>
                            <span className={`badge-pill status ${sa.is_active ? 'published' : 'draft'}`}>
                              {sa.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(sa)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(sa.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TEACHERS TAB */}
              {activeTab === 'teachers' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>School</th>
                      <th>Qualification</th>
                      <th>Experience</th>
                      <th>Status</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers
                      .filter(t => t.username?.toLowerCase().includes(searchQuery.toLowerCase()) || t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || t.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(t => (
                        <tr key={t.teacher_id}>
                          <td className="bold-text">{t.username}</td>
                          <td className="highlight-text">{t.full_name || <span className="dim-text">N/A</span>}</td>
                          <td>{t.email || <span className="dim-text">N/A</span>}</td>
                          <td>
                            <span className="badge-pill grade">
                              {t.school_name || `School ID: ${t.school}`}
                            </span>
                          </td>
                          <td>{t.qualification || <span className="dim-text">N/A</span>}</td>
                          <td>{t.experience_years} years</td>
                          <td>
                            <span className={`badge-pill status ${t.is_active ? 'published' : 'draft'}`}>
                              {t.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(t)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(t.teacher_id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          </div>
        )}
      </>
    )}
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

              {/* SCENARIOS FORM FIELDS */}
              {activeTab === 'scenarios' && (
                <>
                  <div className="form-group">
                    <label>Grade Level *</label>
                    <select 
                      required 
                      value={scenarioForm.grade}
                      onChange={e => setScenarioForm({ ...scenarioForm, grade: e.target.value })}
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
                      value={scenarioForm.title} 
                      onChange={e => setScenarioForm({ ...scenarioForm, title: e.target.value })}
                      placeholder="e.g. Beginner Vocabulary"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      value={scenarioForm.description} 
                      onChange={e => setScenarioForm({ ...scenarioForm, description: e.target.value })}
                      placeholder="Enter description"
                    />
                  </div>
                  <div className="form-group">
                    <label>Objective</label>
                    <textarea 
                      value={scenarioForm.objective} 
                      onChange={e => setScenarioForm({ ...scenarioForm, objective: e.target.value })}
                      placeholder="Pedagogical objectives"
                    />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Duration (Minutes) *</label>
                      <input 
                        type="number" 
                        required 
                        value={scenarioForm.estimated_duration} 
                        onChange={e => setScenarioForm({ ...scenarioForm, estimated_duration: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Difficulty *</label>
                      <select 
                        value={scenarioForm.difficulty} 
                        onChange={e => setScenarioForm({ ...scenarioForm, difficulty: e.target.value })}
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
                      value={scenarioForm.status} 
                      onChange={e => setScenarioForm({ ...scenarioForm, status: e.target.value })}
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
                      value={scenarioForm.thumbnail} 
                      onChange={e => setScenarioForm({ ...scenarioForm, thumbnail: e.target.value })}
                      placeholder="https://example.com/cover.png"
                    />
                  </div>
                </>
              )}

              {/* SCENARIO BUILDERS FORM FIELDS */}
              {activeTab === 'scenario-builders' && (
                <>
                  <div className="form-group">
                    <label>Scenario *</label>
                    <select 
                      required 
                      value={scenarioBuilderForm.scenario}
                      onChange={e => setScenarioBuilderForm({ ...scenarioBuilderForm, scenario: e.target.value })}
                    >
                      <option value="">Select Scenario</option>
                      {scenarios.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Block Type *</label>
                      <select 
                        value={scenarioBuilderForm.block_type} 
                        onChange={e => setScenarioBuilderForm({ ...scenarioBuilderForm, block_type: e.target.value })}
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
                        value={scenarioBuilderForm.display_order} 
                        onChange={e => setScenarioBuilderForm({ ...scenarioBuilderForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Step Title *</label>
                    <input 
                      type="text" 
                      required 
                      value={scenarioBuilderForm.title} 
                      onChange={e => setScenarioBuilderForm({ ...scenarioBuilderForm, title: e.target.value })}
                      placeholder="e.g. Introduce vocabulary"
                    />
                  </div>
                  <div className="form-group">
                    <label>Body Content</label>
                    <textarea 
                      value={scenarioBuilderForm.content} 
                      onChange={e => setScenarioBuilderForm({ ...scenarioBuilderForm, content: e.target.value })}
                      placeholder="Enter body content or text story"
                    />
                  </div>
                  <div className="form-group">
                    <label>Media File URL</label>
                    <input 
                      type="url" 
                      value={scenarioBuilderForm.media_url} 
                      onChange={e => setScenarioBuilderForm({ ...scenarioBuilderForm, media_url: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Configuration Settings (JSON) *</label>
                    <textarea 
                      value={scenarioBuilderForm.settings} 
                      onChange={e => setScenarioBuilderForm({ ...scenarioBuilderForm, settings: e.target.value })}
                      placeholder='{ "autoplay": true }'
                      className="monospace-textarea"
                    />
                  </div>
                </>
              )}

              {/* SCHOOL ADMINS FORM FIELDS */}
              {activeTab === 'school-admins' && (
                <>
                  <div className="form-group">
                    <label>Username *</label>
                    <input 
                      type="text" 
                      required
                      disabled={modalType === 'edit'} 
                      value={schoolAdminForm.username} 
                      onChange={e => setSchoolAdminForm({ ...schoolAdminForm, username: e.target.value })}
                      placeholder="e.g. schooladmin123"
                      className={modalType === 'edit' ? "disabled-input" : ""}
                    />
                  </div>
                  {modalType === 'add' && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input 
                        type="password" 
                        required 
                        value={schoolAdminForm.password || ''} 
                        onChange={e => setSchoolAdminForm({ ...schoolAdminForm, password: e.target.value })}
                        placeholder="Enter password"
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={schoolAdminForm.full_name} 
                      onChange={e => setSchoolAdminForm({ ...schoolAdminForm, full_name: e.target.value })}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input 
                      type="email" 
                      required 
                      value={schoolAdminForm.email} 
                      onChange={e => setSchoolAdminForm({ ...schoolAdminForm, email: e.target.value })}
                      placeholder="e.g. admin@school.edu"
                    />
                  </div>
                  <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="school_admin_is_active"
                      checked={schoolAdminForm.is_active} 
                      onChange={e => setSchoolAdminForm({ ...schoolAdminForm, is_active: e.target.checked })}
                    />
                    <label htmlFor="school_admin_is_active" style={{ margin: 0 }}>Active User Account</label>
                  </div>
                </>
              )}

              {/* TEACHERS FORM FIELDS */}
              {activeTab === 'teachers' && (
                <>
                  <div className="form-group">
                    <label>Username *</label>
                    <input 
                      type="text" 
                      required
                      disabled={modalType === 'edit'} 
                      value={teacherForm.username || ''} 
                      onChange={e => setTeacherForm({ ...teacherForm, username: e.target.value })}
                      placeholder="e.g. teacher123"
                      className={modalType === 'edit' ? "disabled-input" : ""}
                    />
                  </div>
                  {modalType === 'add' && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input 
                        type="password" 
                        required 
                        value={teacherForm.password || ''} 
                        onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
                        placeholder="Enter password"
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={teacherForm.full_name} 
                      onChange={e => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                      placeholder="e.g. Sarah Connor"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input 
                      type="email" 
                      required 
                      value={teacherForm.email} 
                      onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      placeholder="e.g. sarah@school.edu"
                    />
                  </div>
                  <div className="form-group">
                    <label>School *</label>
                    <select 
                      required 
                      value={teacherForm.school}
                      onChange={e => setTeacherForm({ ...teacherForm, school: e.target.value })}
                    >
                      <option value="">Select School</option>
                      {schools.map(s => (
                        <option key={s.school_id} value={s.school_id}>{s.school_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Qualification *</label>
                      <input 
                        type="text" 
                        required 
                        value={teacherForm.qualification} 
                        onChange={e => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                        placeholder="e.g. B.Ed in English"
                      />
                    </div>
                    <div className="form-group">
                      <label>Years of Experience *</label>
                      <input 
                        type="number" 
                        required 
                        value={teacherForm.experience_years} 
                        onChange={e => setTeacherForm({ ...teacherForm, experience_years: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="teacher_is_active"
                      checked={teacherForm.is_active} 
                      onChange={e => setTeacherForm({ ...teacherForm, is_active: e.target.checked })}
                    />
                    <label htmlFor="teacher_is_active" style={{ margin: 0 }}>Active User Account</label>
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
