import React, { useState, useEffect } from 'react';
import { 
  FiShield, 
  FiUsers, 
  FiBookOpen, 
  FiActivity, 
  FiLogOut, 
  FiGrid, 
  FiPlus, 
  FiMenu, 
  FiX,
  FiBell,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLock,
  FiUser,
  FiCheckCircle,
  FiBarChart2,
  FiFileText,
  FiTrendingUp,
  FiAward
} from 'react-icons/fi';
import './Dashboard.css';
import { apiFetch } from './api';

const SchoolDashboard = ({ user, onLogout }) => {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, teachers, classes, students, reports, profile

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit
  const [editingId, setEditingId] = useState(null);

  // Data lists
  const [dashboardData, setDashboardData] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [grades, setGrades] = useState([]);

  // Reports state
  const [overviewReport, setOverviewReport] = useState(null);
  const [scenariosReport, setScenariosReport] = useState([]);
  const [classesReport, setClassesReport] = useState([]);
  const [studentsReport, setStudentsReport] = useState([]);

  // Detail modal states
  const [selectedScenarioDetail, setSelectedScenarioDetail] = useState(null);
  const [selectedClassDetail, setSelectedClassDetail] = useState(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  const [showScenarioDetailModal, setShowScenarioDetailModal] = useState(false);
  const [showClassDetailModal, setShowClassDetailModal] = useState(false);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    username: '', password: '', email: '', full_name: '', is_active: true, school: '', qualification: '', experience_years: 0
  });
  const [studentForm, setStudentForm] = useState({
    username: '', password: '', email: '', full_name: '', is_active: true
  });
  const [classForm, setClassForm] = useState({
    class_name: '', school: '', grade: '', academic_year: new Date().getFullYear().toString(), is_active: true
  });
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '', email: user?.email || '', full_name: user?.full_name || '', current_password: '', password: ''
  });

  // Loaders
  const loadDashboardData = async () => {
    try {
      const res = await apiFetch('/api/school/dashboard/');
      if (res.ok) {
        const result = await res.json();
        setDashboardData(result);
      }
    } catch (e) {
      console.error('Failed to load school dashboard data.', e);
    }
  };

  const loadSchools = async () => {
    try {
      const res = await apiFetch('/api/cms/schools/');
      if (res.ok) {
        const data = await res.json();
        setSchools(data.results || data);
      }
    } catch (e) {
      console.error('Failed to load schools.', e);
    }
  };

  const loadGrades = async () => {
    try {
      const res = await apiFetch('/api/cms/grades/');
      if (res.ok) {
        const data = await res.json();
        setGrades(data.results || data);
      }
    } catch (e) {
      console.error('Failed to load grades.', e);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await apiFetch('/api/cms/teachers/');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.results || data);
      }
    } catch (e) {
      console.error('Failed to load teachers.', e);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await apiFetch('/api/cms/students/');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.results || data);
      }
    } catch (e) {
      console.error('Failed to load students.', e);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await apiFetch('/api/cms/classes/');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.results || data);
      }
    } catch (e) {
      console.error('Failed to load classes.', e);
    }
  };

  const loadReportsData = async () => {
    try {
      const [overRes, scenRes, classRes, studRes] = await Promise.all([
        apiFetch('/api/v1/reports/overview/'),
        apiFetch('/api/v1/reports/scenarios/'),
        apiFetch('/api/v1/reports/classes/'),
        apiFetch('/api/v1/reports/students/')
      ]);
      if (overRes.ok) setOverviewReport(await overRes.json());
      if (scenRes.ok) setScenariosReport(await scenRes.json());
      if (classRes.ok) setClassesReport(await classRes.json());
      if (studRes.ok) setStudentsReport(await studRes.json());
    } catch (e) {
      console.error('Failed to load reports data', e);
    }
  };

  const handleFetchScenarioDetail = async (scenario_ref) => {
    try {
      const res = await apiFetch(`/api/v1/reports/scenarios/${scenario_ref}/`);
      if (res.ok) {
        setSelectedScenarioDetail(await res.json());
        setShowScenarioDetailModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchClassDetail = async (class_id) => {
    try {
      const res = await apiFetch(`/api/v1/reports/classes/${class_id}/`);
      if (res.ok) {
        setSelectedClassDetail(await res.json());
        setShowClassDetailModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchStudentDetail = async (student_id) => {
    try {
      const res = await apiFetch(`/api/v1/reports/students/${student_id}/`);
      if (res.ok) {
        setSelectedStudentDetail(await res.json());
        setShowStudentDetailModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = async (type) => {
    try {
      const res = await apiFetch(`/api/v1/reports/export/?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${type}_export.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export CSV.');
      }
    } catch (e) {
      console.error('Error exporting CSV', e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([
        loadDashboardData(),
        loadSchools(),
        loadGrades(),
        loadTeachers(),
        loadStudents(),
        loadClasses(),
        loadReportsData()
      ]);
    } catch (e) {
      setErrorMsg('Error loading dashboard data.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Alert Feedback
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

  // Setup form for add/edit modal
  const initForm = (tab, entity = null) => {
    setErrorMsg('');
    if (tab === 'teachers') {
      setTeacherForm(entity ? {
        username: entity.username || '',
        password: '',
        email: entity.email || '',
        full_name: entity.full_name || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true,
        school: entity.school || (schools[0]?.school_id || ''),
        qualification: entity.qualification || '',
        experience_years: entity.experience_years || 0
      } : {
        username: '',
        password: '',
        email: '',
        full_name: '',
        is_active: true,
        school: schools[0]?.school_id || '',
        qualification: '',
        experience_years: 0
      });
    } else if (tab === 'students') {
      setStudentForm(entity ? {
        username: entity.username || '',
        password: '',
        email: entity.email || '',
        full_name: entity.full_name || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : {
        username: '',
        password: '',
        email: '',
        full_name: '',
        is_active: true
      });
    } else if (tab === 'classes') {
      setClassForm(entity ? {
        class_name: entity.class_name || '',
        school: entity.school || (schools[0]?.school_id || ''),
        grade: entity.grade || (grades[0]?.id || ''),
        academic_year: entity.academic_year || new Date().getFullYear().toString(),
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : {
        class_name: '',
        school: schools[0]?.school_id || '',
        grade: grades[0]?.id || '',
        academic_year: new Date().getFullYear().toString(),
        is_active: true
      });
    }
  };

  const handleOpenAdd = () => {
    setModalType('add');
    setEditingId(null);
    initForm(activeSubTab);
    setShowModal(true);
  };

  const handleOpenEdit = (entity) => {
    setModalType('edit');
    setEditingId(entity.teacher_id || entity.id || entity.class_id);
    initForm(activeSubTab, entity);
    setShowModal(true);
  };

  // CRUD Submissions
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setActionLoading(true);
    let body = {};
    let url = `/api/cms/${activeSubTab}/`;
    
    if (modalType === 'edit') {
      url += `${editingId}/`;
    }

    try {
      if (activeSubTab === 'teachers') {
        body = { 
          ...teacherForm,
          school: parseInt(teacherForm.school),
          experience_years: parseInt(teacherForm.experience_years) || 0
        };
        // Remove password if empty during edit
        if (modalType === 'edit' && !body.password) {
          delete body.password;
        }
      } else if (activeSubTab === 'students') {
        body = { ...studentForm };
        if (modalType === 'edit' && !body.password) {
          delete body.password;
        }
      } else if (activeSubTab === 'classes') {
        body = { 
          ...classForm,
          school: parseInt(classForm.school),
          grade: parseInt(classForm.grade)
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
        // Refresh appropriate lists
        if (activeSubTab === 'teachers') await loadTeachers();
        else if (activeSubTab === 'students') await loadStudents();
        else if (activeSubTab === 'classes') await loadClasses();
        await loadDashboardData();
      } else {
        const errorDetail = typeof resData === 'object' ? JSON.stringify(resData) : resData;
        setErrorMsg(`Error: ${errorDetail}`);
      }
    } catch (err) {
      setErrorMsg('Failed to process request. Check connections.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Action
  const handleDelete = async (id) => {
    const tabName = activeSubTab.slice(0, -1);
    if (!window.confirm(`Are you sure you want to delete this ${tabName}?`)) return;
    setErrorMsg('');
    const url = `/api/cms/${activeSubTab}/${id}/`;
    
    try {
      const res = await apiFetch(url, { method: 'DELETE' });
      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Deleted successfully', null);
        if (activeSubTab === 'teachers') await loadTeachers();
        else if (activeSubTab === 'students') await loadStudents();
        else if (activeSubTab === 'classes') await loadClasses();
        await loadDashboardData();
      } else {
        setErrorMsg(resData.message || 'Delete operation failed.');
      }
    } catch (err) {
      setErrorMsg('Connection error.');
      console.error(err);
    }
  };

  // Broadcast Notice
  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    const input = e.target.elements.announcementMsg;
    if (!input || !input.value.trim()) return;

    const newAnnouncement = {
      id: Date.now(),
      title: input.value,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setDashboardData(prev => ({
      ...prev,
      announcements: [newAnnouncement, ...prev.announcements]
    }));
    
    input.value = '';
    showFeedback('Announcement broadcasted successfully!', null);
  };

  // Profile Form Handler
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setActionLoading(true);

    try {
      // 1. Update Profile (Name & Email)
      const profRes = await apiFetch('/api/users/profile/', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: profileForm.full_name,
          email: profileForm.email
        })
      });

      const profData = await profRes.json();
      if (!profRes.ok) {
        setErrorMsg(profData.message || 'Profile update failed.');
        setActionLoading(false);
        return;
      }

      // 2. Optional Password Update
      if (profileForm.password) {
        if (!profileForm.current_password) {
          setErrorMsg('Current password is required to set a new password.');
          setActionLoading(false);
          return;
        }

        const pwRes = await apiFetch('/api/users/change-password/', {
          method: 'POST',
          body: JSON.stringify({
            old_password: profileForm.current_password,
            new_password: profileForm.password
          })
        });

        const pwData = await pwRes.json();
        if (!pwRes.ok) {
          setErrorMsg(typeof pwData === 'object' ? JSON.stringify(pwData) : 'Password change failed.');
          setActionLoading(false);
          return;
        }
      }

      setProfileForm(prev => ({ ...prev, current_password: '', password: '' }));
      showFeedback('Profile updated successfully', null);
    } catch (err) {
      setErrorMsg('Connection error.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Search Filtered Data
  const getFilteredData = (dataList) => {
    if (!searchQuery) return dataList;
    return dataList.filter(item => {
      const name = (item.full_name || item.username || item.class_name || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const qualification = (item.qualification || '').toLowerCase();
      return name.includes(searchQuery.toLowerCase()) || 
             email.includes(searchQuery.toLowerCase()) || 
             qualification.includes(searchQuery.toLowerCase());
    });
  };

  if (loading) {
    return (
      <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#10b981' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading School Admin Portal...</h2>
          <p style={{ marginTop: '10px', color: '#64748b' }}>Fetching schools, teachers, students & classes...</p>
        </div>
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
          <div className="brand-logo-small" style={{ backgroundColor: '#10b981' }}>
            <FiShield />
          </div>
          <span className="brand-name-small">School Admin</span>
        </div>
        <div className="mobile-user-avatar" style={{ backgroundColor: '#10b981' }}>
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
            onClick={() => { setActiveSubTab('overview'); setIsSidebarOpen(false); setSearchQuery(''); }}
          >
            <FiGrid className="nav-icon" />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-link ${activeSubTab === 'teachers' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('teachers'); setIsSidebarOpen(false); setSearchQuery(''); }}
          >
            <FiUsers className="nav-icon" />
            <span>Teachers</span>
          </button>

          <button 
            className={`nav-link ${activeSubTab === 'classes' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('classes'); setIsSidebarOpen(false); setSearchQuery(''); }}
          >
            <FiBookOpen className="nav-icon" />
            <span>Classes</span>
          </button>

          <button 
            className={`nav-link ${activeSubTab === 'students' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('students'); setIsSidebarOpen(false); setSearchQuery(''); }}
          >
            <FiUser className="nav-icon" />
            <span>Students</span>
          </button>

          <button 
            className={`nav-link ${activeSubTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('reports'); setIsSidebarOpen(false); setSearchQuery(''); }}
          >
            <FiBarChart2 className="nav-icon" />
            <span>Reports</span>
          </button>

          <button 
            className={`nav-link ${activeSubTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('profile'); setIsSidebarOpen(false); setSearchQuery(''); }}
          >
            <FiLock className="nav-icon" />
            <span>Profile Setting</span>
          </button>
        </nav>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-avatar" style={{ backgroundColor: '#10b981' }}>
            {user.username ? user.username.slice(0, 2).toUpperCase() : 'SA'}
          </div>
          <div className="user-meta">
            <div className="user-name">{profileForm.full_name || user.username}</div>
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
              {activeSubTab === 'classes' && 'Manage Classes'}
              {activeSubTab === 'students' && 'Manage Students'}
              {activeSubTab === 'reports' && 'Academic Performance & Reports'}
              {activeSubTab === 'profile' && 'Profile Settings'}
            </h1>
            <p className="page-subtitle">
              {activeSubTab === 'overview' && `Welcome back, admin. Manage ${dashboardData?.school_name || 'your school'}.`}
              {activeSubTab === 'teachers' && 'Create, view, update, and remove language training faculty members.'}
              {activeSubTab === 'classes' && 'Create classes, assign grades, and configure learning tracks.'}
              {activeSubTab === 'students' && 'Register new learners, check activity status, and manage access details.'}
              {activeSubTab === 'reports' && 'Overall assessment scores, average scores, student evaluations, and workload reports.'}
              {activeSubTab === 'profile' && 'Update your name, email address, or change password keys.'}
            </p>
          </div>
        </header>

        {/* Feedback Messages */}
        {successMsg && <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiCheckCircle /> {successMsg}</div>}
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        {/* Tab content: Overview */}
        {activeSubTab === 'overview' && dashboardData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Stats Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Active Teachers</span>
                  <FiUsers style={{ color: '#10b981', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{teachers.length}</h2>
                <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>Faculty in laboratory</p>
              </div>

              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Enrolled Students</span>
                  <FiUsers style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{students.length}</h2>
                <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>Registered learners</p>
              </div>

              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Total Classes</span>
                  <FiBookOpen style={{ color: '#8b5cf6', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{classes.length}</h2>
                <p style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '0.25rem' }}>Grade-linked class lines</p>
              </div>

              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Engagement Rate</span>
                  <FiActivity style={{ color: '#f59e0b', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{dashboardData.monthly_engagement_rate}</h2>
                <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>Avg laboratory attendance</p>
              </div>
            </div>

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
              {/* Left Column: Recent Activities */}
              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiActivity style={{ color: '#10b981' }} /> Recent Lab Activities
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {dashboardData.recent_activities.map(act => (
                    <div key={act.id} style={{ display: 'flex', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #10b981', backgroundColor: '#f8fafc', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#334155' }}>{act.activity}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Notices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiBell style={{ color: '#f59e0b' }} /> School Notices
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {dashboardData.announcements.map(ann => (
                      <div key={ann.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{ann.title}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{ann.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Make Announcement Form */}
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Broadcast Announcement</h3>
                  <form onSubmit={handlePostAnnouncement}>
                    <textarea 
                      name="announcementMsg"
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

        {/* Tab Content: Teachers CRUD */}
        {activeSubTab === 'teachers' && (
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="search-box-relative" style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', width: '300px' }}>
                <FiSearch style={{ color: '#94a3b8', marginRight: '0.5rem' }} />
                <input 
                  type="text" 
                  placeholder="Search teachers..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '0.875rem', width: '100%' }}
                />
              </div>
              <button className="add-btn" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <FiPlus /> Add Teacher
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Username</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Qualification</th>
                    <th style={{ padding: '0.75rem 1rem' }}>School</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Experience</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(teachers).map((t, idx) => (
                    <tr key={t.teacher_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{t.full_name || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{t.username}</td>
                      <td style={{ padding: '1rem' }}>{t.email}</td>
                      <td style={{ padding: '1rem' }}>{t.qualification || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{t.school_name || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{t.experience_years} years</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ backgroundColor: t.is_active ? '#def7ec' : '#fde8e8', color: t.is_active ? '#03543f' : '#9b1c1c', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button onClick={() => handleOpenEdit(t)} title="Edit" style={{ padding: '0.375rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FiEdit2 style={{ color: '#4f46e5' }} />
                          </button>
                          <button onClick={() => handleDelete(t.teacher_id)} title="Delete" style={{ padding: '0.375rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FiTrash2 style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getFilteredData(teachers).length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No teachers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Classes CRUD */}
        {activeSubTab === 'classes' && (
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="search-box-relative" style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', width: '300px' }}>
                <FiSearch style={{ color: '#94a3b8', marginRight: '0.5rem' }} />
                <input 
                  type="text" 
                  placeholder="Search classes..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '0.875rem', width: '100%' }}
                />
              </div>
              <button className="add-btn" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <FiPlus /> Add Class
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Class Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>School Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Grade Level</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Academic Year</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(classes).map((c, idx) => (
                    <tr key={c.class_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{c.class_name}</td>
                      <td style={{ padding: '1rem' }}>{c.school_name || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{c.grade_name || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{c.academic_year}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ backgroundColor: c.is_active ? '#def7ec' : '#fde8e8', color: c.is_active ? '#03543f' : '#9b1c1c', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button onClick={() => handleOpenEdit(c)} title="Edit" style={{ padding: '0.375rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FiEdit2 style={{ color: '#4f46e5' }} />
                          </button>
                          <button onClick={() => handleDelete(c.class_id)} title="Delete" style={{ padding: '0.375rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FiTrash2 style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getFilteredData(classes).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No classes found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Students CRUD */}
        {activeSubTab === 'students' && (
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="search-box-relative" style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', width: '300px' }}>
                <FiSearch style={{ color: '#94a3b8', marginRight: '0.5rem' }} />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '0.875rem', width: '100%' }}
                />
              </div>
              <button className="add-btn" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <FiPlus /> Add Student
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Full Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Username</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(students).map((s, idx) => (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{s.full_name || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{s.username}</td>
                      <td style={{ padding: '1rem' }}>{s.email || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}><span style={{ textTransform: 'capitalize' }}>{s.role.toLowerCase()}</span></td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ backgroundColor: s.is_active ? '#def7ec' : '#fde8e8', color: s.is_active ? '#03543f' : '#9b1c1c', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button onClick={() => handleOpenEdit(s)} title="Edit" style={{ padding: '0.375rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FiEdit2 style={{ color: '#4f46e5' }} />
                          </button>
                          <button onClick={() => handleDelete(s.id)} title="Delete" style={{ padding: '0.375rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FiTrash2 style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getFilteredData(students).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Reports Dashboard */}
        {activeSubTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {(!overviewReport || overviewReport.total_attempts === 0) ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <FiFileText style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '1.25rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>No assessment data synced yet</h3>
                <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.875rem' }}>Data will appear here once the Electron LMS runs its monthly sync sequence.</p>
              </div>
            ) : (
              <>
                {/* Row 1: Metrics Overview Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '10px' }}>
                      <FiUsers style={{ fontSize: '1.25rem' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Students Attempted</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>{overviewReport.total_students}</h3>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '10px' }}>
                      <FiActivity style={{ fontSize: '1.25rem' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Attempts</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>{overviewReport.total_attempts}</h3>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '10px' }}>
                      <FiCheckCircle style={{ fontSize: '1.25rem' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Completed (Rate)</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                        {overviewReport.total_completed} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#16a34a' }}>({overviewReport.completion_rate}%)</span>
                      </h3>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#f3e8ff', color: '#7c3aed', borderRadius: '10px' }}>
                      <FiAward style={{ fontSize: '1.25rem' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Average Score</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>{overviewReport.average_score}%</h3>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '10px' }}>
                      <FiTrendingUp style={{ fontSize: '1.25rem' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{'Pass Rate (>=60%)'}</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>{overviewReport.pass_rate}%</h3>
                    </div>
                  </div>
                </div>

                {/* Section 1: Scenarios Report Table */}
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Scenario Performance Analysis</h3>
                    <button onClick={() => handleExportCSV('scenarios')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                      Export CSV
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Scenario Title</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Scenario ID (Ref)</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Total Attempts</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Completed</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Avg Score</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Pass Rate</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Highest / Lowest</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Avg Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenariosReport.map((s, idx) => (
                          <tr key={idx} onClick={() => handleFetchScenarioDetail(s.scenario_ref)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} className="hover-row">
                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{s.scenario_title}</td>
                            <td style={{ padding: '1rem', color: '#64748b' }}>{s.scenario_ref}</td>
                            <td style={{ padding: '1rem' }}>{s.total_attempts}</td>
                            <td style={{ padding: '1rem' }}>{s.completed}</td>
                            <td style={{ padding: '1rem', fontWeight: 700, color: '#7c3aed' }}>{s.average_score}%</td>
                            <td style={{ padding: '1rem' }}>{s.pass_rate}%</td>
                            <td style={{ padding: '1rem' }}>{s.highest_score}% / {s.lowest_score}%</td>
                            <td style={{ padding: '1rem' }}>{Math.round(s.average_time_seconds / 60)}m {s.average_time_seconds % 60}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Classes Performance Table */}
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Class Performance Analysis</h3>
                    <button onClick={() => handleExportCSV('classes')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                      Export CSV
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Class Name</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Students Attempted</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Completed Attempts</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Average Score</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Pass Rate</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Top Student</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Weakest Student</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classesReport.map((c, idx) => (
                          <tr key={idx} onClick={() => handleFetchClassDetail(c.class_id)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} className="hover-row">
                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{c.class_name}</td>
                            <td style={{ padding: '1rem' }}>{c.total_students}</td>
                            <td style={{ padding: '1rem' }}>{c.completed}</td>
                            <td style={{ padding: '1rem', fontWeight: 700, color: '#10b981' }}>{c.average_score}%</td>
                            <td style={{ padding: '1rem' }}>{c.pass_rate}%</td>
                            <td style={{ padding: '1rem', color: '#047857', fontWeight: 600 }}>{c.top_student}</td>
                            <td style={{ padding: '1rem', color: '#b91c1c' }}>{c.weakest_student}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Students Performance Table */}
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Student Performance Analysis</h3>
                    <button onClick={() => handleExportCSV('students')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                      Export CSV
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Class</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Total Attempts</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Completed</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Average Score</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Best Scenario</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Worst Scenario</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Last Attempt Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsReport.map((st, idx) => (
                          <tr key={idx} onClick={() => handleFetchStudentDetail(st.student_id)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} className="hover-row">
                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{st.student_name}</td>
                            <td style={{ padding: '1rem' }}>{st.class_name}</td>
                            <td style={{ padding: '1rem' }}>{st.total_attempts}</td>
                            <td style={{ padding: '1rem' }}>{st.completed}</td>
                            <td style={{ padding: '1rem', fontWeight: 700, color: '#3b82f6' }}>{st.average_score}%</td>
                            <td style={{ padding: '1rem', color: '#047857' }}>{st.best_scenario}</td>
                            <td style={{ padding: '1rem', color: '#b91c1c' }}>{st.worst_scenario}</td>
                            <td style={{ padding: '1rem' }}>{st.last_attempt_date ? new Date(st.last_attempt_date).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab Content: Profile Settings */}
        {activeSubTab === 'profile' && (
          <div style={{ maxWidth: '600px', backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>Account Information</h3>
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Username</label>
                <input 
                  type="text" 
                  value={profileForm.username} 
                  disabled 
                  style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'not-allowed', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                <input 
                  type="text" 
                  value={profileForm.full_name} 
                  onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Email Address</label>
                <input 
                  type="email" 
                  value={profileForm.email} 
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Update Password (Optional)</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Enter new password details only if you wish to change your current login credential.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Current Password</label>
                    <input 
                      type="password" 
                      value={profileForm.current_password} 
                      onChange={e => setProfileForm({ ...profileForm, current_password: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      placeholder="Verify current password"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>New Password</label>
                    <input 
                      type="password" 
                      value={profileForm.password} 
                      onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', marginTop: '1rem' }}
              >
                {actionLoading ? 'Updating Profile...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Global CRUD Modals */}
      {showModal && (
        <div className="modal-backdrop" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-container" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxOverflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {modalType === 'add' ? 'Add' : 'Edit'} {activeSubTab.slice(0, -1)}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Form elements for Teachers */}
              {activeSubTab === 'teachers' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Username</label>
                    <input 
                      type="text" 
                      value={teacherForm.username} 
                      onChange={e => setTeacherForm({ ...teacherForm, username: e.target.value })}
                      disabled={modalType === 'edit'}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: modalType === 'edit' ? '#f1f5f9' : '#fff' }}
                      required
                    />
                  </div>

                  {modalType === 'add' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Password</label>
                      <input 
                        type="password" 
                        value={teacherForm.password} 
                        onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
                        style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                        required
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={teacherForm.full_name} 
                      onChange={e => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Email</label>
                    <input 
                      type="email" 
                      value={teacherForm.email} 
                      onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>School</label>
                    <select 
                      value={teacherForm.school} 
                      onChange={e => setTeacherForm({ ...teacherForm, school: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      required
                    >
                      {schools.map(s => (
                        <option key={s.school_id} value={s.school_id}>{s.school_name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Qualification</label>
                    <input 
                      type="text" 
                      value={teacherForm.qualification} 
                      onChange={e => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Experience (Years)</label>
                    <input 
                      type="number" 
                      value={teacherForm.experience_years} 
                      onChange={e => setTeacherForm({ ...teacherForm, experience_years: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      min="0"
                    />
                  </div>

                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={teacherForm.is_active} 
                      onChange={e => setTeacherForm({ ...teacherForm, is_active: e.target.checked })}
                    />
                    <span>Active Status</span>
                  </label>
                </>
              )}

              {/* Form elements for Classes */}
              {activeSubTab === 'classes' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Class Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Class 6-A"
                      value={classForm.class_name} 
                      onChange={e => setClassForm({ ...classForm, class_name: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>School</label>
                    <select 
                      value={classForm.school} 
                      onChange={e => setClassForm({ ...classForm, school: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      required
                    >
                      {schools.map(s => (
                        <option key={s.school_id} value={s.school_id}>{s.school_name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Grade Level</label>
                    <select 
                      value={classForm.grade} 
                      onChange={e => setClassForm({ ...classForm, grade: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      required
                    >
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>{g.grade_name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Academic Year</label>
                    <input 
                      type="text" 
                      value={classForm.academic_year} 
                      onChange={e => setClassForm({ ...classForm, academic_year: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      required
                    />
                  </div>

                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={classForm.is_active} 
                      onChange={e => setClassForm({ ...classForm, is_active: e.target.checked })}
                    />
                    <span>Active Status</span>
                  </label>
                </>
              )}

              {/* Form elements for Students */}
              {activeSubTab === 'students' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Username</label>
                    <input 
                      type="text" 
                      value={studentForm.username} 
                      onChange={e => setStudentForm({ ...studentForm, username: e.target.value })}
                      disabled={modalType === 'edit'}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: modalType === 'edit' ? '#f1f5f9' : '#fff' }}
                      required
                    />
                  </div>

                  {modalType === 'add' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Password</label>
                      <input 
                        type="password" 
                        value={studentForm.password} 
                        onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                        style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                        required
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={studentForm.full_name} 
                      onChange={e => setStudentForm({ ...studentForm, full_name: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Email</label>
                    <input 
                      type="email" 
                      value={studentForm.email} 
                      onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                      required
                    />
                  </div>

                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={studentForm.is_active} 
                      onChange={e => setStudentForm({ ...studentForm, is_active: e.target.checked })}
                    />
                    <span>Active Status</span>
                  </label>
                </>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: '8px', backgroundColor: '#10b981', color: '#fff', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Scenario Detail Modal */}
      {showScenarioDetailModal && selectedScenarioDetail && (
        <div className="modal-backdrop" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-container" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Scenario Detail: {selectedScenarioDetail.scenario_title}
              </h3>
              <button onClick={() => setShowScenarioDetailModal(false)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>
                <FiX />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Attempts:</strong> {selectedScenarioDetail.total_attempts}</div>
              <div><strong>Completed:</strong> {selectedScenarioDetail.completed}</div>
              <div><strong>Avg Score:</strong> {selectedScenarioDetail.average_score}%</div>
              <div><strong>Pass Rate:</strong> {selectedScenarioDetail.pass_rate}%</div>
              <div><strong>High/Low:</strong> {selectedScenarioDetail.highest_score}% / {selectedScenarioDetail.lowest_score}%</div>
            </div>
            <h4 style={{ marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>Attempts History</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '0.5rem' }}>Student</th>
                    <th style={{ padding: '0.5rem' }}>Class</th>
                    <th style={{ padding: '0.5rem' }}>Percentage</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                    <th style={{ padding: '0.5rem' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedScenarioDetail.attempts.map((att, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{att.student_name}</td>
                      <td style={{ padding: '0.5rem' }}>{att.class_name}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 700 }}>{att.percentage !== null ? att.percentage + '%' : 'N/A'}</td>
                      <td style={{ padding: '0.5rem' }}>{att.status}</td>
                      <td style={{ padding: '0.5rem' }}>{att.time_spent_seconds ? Math.round(att.time_spent_seconds / 60) + 'm' : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowScenarioDetailModal(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Detail Modal */}
      {showClassDetailModal && selectedClassDetail && (
        <div className="modal-backdrop" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-container" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Class Detail: {selectedClassDetail.class_name}
              </h3>
              <button onClick={() => setShowClassDetailModal(false)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>
                <FiX />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Students:</strong> {selectedClassDetail.total_students}</div>
              <div><strong>Completed:</strong> {selectedClassDetail.completed}</div>
              <div><strong>Avg Score:</strong> {selectedClassDetail.average_score}%</div>
              <div><strong>Pass Rate:</strong> {selectedClassDetail.pass_rate}%</div>
            </div>
            <h4 style={{ marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>Students Performance</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '0.5rem' }}>Student</th>
                    <th style={{ padding: '0.5rem' }}>Total Attempts</th>
                    <th style={{ padding: '0.5rem' }}>Completed</th>
                    <th style={{ padding: '0.5rem' }}>Avg Score</th>
                    <th style={{ padding: '0.5rem' }}>Last Attempt Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClassDetail.students.map((st, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{st.student_name}</td>
                      <td style={{ padding: '0.5rem' }}>{st.total_attempts}</td>
                      <td style={{ padding: '0.5rem' }}>{st.completed}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 700, color: '#10b981' }}>{st.average_score}%</td>
                      <td style={{ padding: '0.5rem' }}>{st.last_attempt_date ? new Date(st.last_attempt_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowClassDetailModal(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {showStudentDetailModal && selectedStudentDetail && (
        <div className="modal-backdrop" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-container" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Student Detail: {selectedStudentDetail.student_name}
              </h3>
              <button onClick={() => setShowStudentDetailModal(false)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>
                <FiX />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Total Attempts:</strong> {selectedStudentDetail.total_attempts}</div>
              <div><strong>Completed:</strong> {selectedStudentDetail.completed}</div>
              <div><strong>Avg Score:</strong> {selectedStudentDetail.average_score}%</div>
            </div>
            <h4 style={{ marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>Attempt History</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '0.5rem' }}>Scenario</th>
                    <th style={{ padding: '0.5rem' }}>Class</th>
                    <th style={{ padding: '0.5rem' }}>Percentage</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                    <th style={{ padding: '0.5rem' }}>Started At</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudentDetail.attempts.map((att, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{att.scenario_title}</td>
                      <td style={{ padding: '0.5rem' }}>{att.class_name}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 700, color: '#3b82f6' }}>{att.percentage !== null ? att.percentage + '%' : 'N/A'}</td>
                      <td style={{ padding: '0.5rem' }}>{att.status}</td>
                      <td style={{ padding: '0.5rem' }}>{new Date(att.started_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowStudentDetailModal(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolDashboard;
