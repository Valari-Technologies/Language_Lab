import React, { useState, useEffect } from 'react';
import { 
  FiShield, FiUsers, FiBookOpen, FiActivity, FiLogOut, FiGrid, 
  FiClock, FiMenu, FiX,
  FiEdit2, FiTrash2, FiSearch, FiLock, FiUser,
  FiBarChart2, FiPlus
} from 'react-icons/fi';
import './Dashboard.css';
import { apiFetch } from './api';

const TeacherDashboard = ({ user, onLogout }) => {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, classes, students, reports, profile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit
  const [editingId, setEditingId] = useState(null);

  // Data lists
  const [data, setData] = useState(null); // overview data
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [grades, setGrades] = useState([]);

  // Form states
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
      const res = await apiFetch('/api/teacher/dashboard/');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error('Failed to load dashboard data.', e);
    }
  };

  const loadSchools = async () => {
    try {
      const res = await apiFetch('/api/cms/schools/');
      if (res.ok) {
        const d = await res.json();
        setSchools(d.results || d);
      }
    } catch (e) {
      console.error('Failed to load schools.', e);
    }
  };

  const loadGrades = async () => {
    try {
      const res = await apiFetch('/api/cms/grades/');
      if (res.ok) {
        const d = await res.json();
        setGrades(d.results || d);
      }
    } catch (e) {
      console.error('Failed to load grades.', e);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await apiFetch('/api/cms/students/');
      if (res.ok) {
        const d = await res.json();
        setStudents(d.results || d);
      }
    } catch (e) {
      console.error('Failed to load students.', e);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await apiFetch('/api/cms/classes/');
      if (res.ok) {
        const d = await res.json();
        setClasses(d.results || d);
      }
    } catch (e) {
      console.error('Failed to load classes.', e);
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
        loadStudents(),
        loadClasses()
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

  // Form Setup
  const initForm = (tab, entity = null) => {
    setErrorMsg('');
    if (tab === 'students') {
      setStudentForm(entity ? {
        username: entity.username || '',
        password: '',
        email: entity.email || '',
        full_name: entity.full_name || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : {
        username: '', password: '', email: '', full_name: '', is_active: true
      });
    } else if (tab === 'classes') {
      setClassForm(entity ? {
        class_name: entity.class_name || '',
        school: entity.school || (schools[0]?.school_id || ''),
        grade: entity.grade || (grades[0]?.id || ''),
        academic_year: entity.academic_year || new Date().getFullYear().toString(),
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : {
        class_name: '', school: schools[0]?.school_id || '', grade: grades[0]?.id || '', academic_year: new Date().getFullYear().toString(), is_active: true
      });
    }
  };

  const openAddModal = () => {
    initForm(activeSubTab);
    setModalType('add');
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (entity) => {
    initForm(activeSubTab, entity);
    setModalType('edit');
    setEditingId(entity.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setErrorMsg('');
  };

  // Generic Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    let endpoint = '';
    let method = modalType === 'add' ? 'POST' : 'PUT';
    let payload = {};

    if (activeSubTab === 'students') {
      endpoint = modalType === 'add' ? '/api/cms/students/' : `/api/cms/students/${editingId}/`;
      payload = { ...studentForm, role: 'STUDENT' };
      if (modalType === 'edit' && !payload.password) delete payload.password;
    } else if (activeSubTab === 'classes') {
      endpoint = modalType === 'add' ? '/api/cms/classes/' : `/api/cms/classes/${editingId}/`;
      payload = { ...classForm };
    }

    try {
      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showFeedback(`${activeSubTab.slice(0, -1)} ${modalType === 'add' ? 'added' : 'updated'} successfully!`, null);
        closeModal();
        if (activeSubTab === 'students') loadStudents();
        else if (activeSubTab === 'classes') loadClasses();
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.message || 'Action failed. Please check inputs.');
      }
    } catch {
      setErrorMsg('Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Item
  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    let endpoint = `/api/cms/${type}s/${id}/`;
    
    try {
      const res = await apiFetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        showFeedback(`${type} deleted successfully!`, null);
        if (type === 'student') loadStudents();
        else if (type === 'class') loadClasses();
      } else {
        showFeedback(null, 'Delete failed.');
      }
    } catch {
      showFeedback(null, 'Network error.');
    }
  };

  // Update Profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/users/profile/', {
        method: 'PUT',
        body: JSON.stringify({ full_name: profileForm.full_name, email: profileForm.email })
      });
      if (res.ok) {
        showFeedback('Profile updated successfully!', null);
      } else {
        showFeedback(null, 'Failed to update profile.');
      }
    } catch {
      showFeedback(null, 'Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/users/change-password/', {
        method: 'POST',
        body: JSON.stringify({ old_password: profileForm.current_password, new_password: profileForm.password })
      });
      if (res.ok) {
        showFeedback('Password changed successfully!', null);
        setProfileForm({ ...profileForm, current_password: '', password: '' });
      } else {
        const errorData = await res.json();
        showFeedback(null, errorData.error || 'Password change failed.');
      }
    } catch {
      showFeedback(null, 'Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter lists
  const filteredStudents = students.filter(s => 
    (s.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredClasses = classes.filter(c => 
    (c.class_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#4f46e5' }}>
        <h2>Loading Teacher Portal...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
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

      {/* Sidebar Backdrop */}
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
            className={`nav-link ${activeSubTab === 'students' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('students'); setIsSidebarOpen(false); }}
          >
            <FiUsers className="nav-icon" />
            <span>Students</span>
          </button>

          <button 
            className={`nav-link ${activeSubTab === 'classes' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('classes'); setIsSidebarOpen(false); }}
          >
            <FiBookOpen className="nav-icon" />
            <span>Classes</span>
          </button>

          <button 
            className={`nav-link ${activeSubTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('reports'); setIsSidebarOpen(false); }}
          >
            <FiBarChart2 className="nav-icon" />
            <span>Reports</span>
          </button>

          <div className="nav-divider"></div>
          
          <button 
            className={`nav-link ${activeSubTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveSubTab('profile'); setIsSidebarOpen(false); }}
          >
            <FiUser className="nav-icon" />
            <span>Profile Setting</span>
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
              {activeSubTab === 'students' && 'Manage Students'}
              {activeSubTab === 'classes' && 'Manage Classes'}
              {activeSubTab === 'reports' && 'Student Performance Reports'}
              {activeSubTab === 'profile' && 'Profile Settings'}
            </h1>
            <p className="page-subtitle">
              {activeSubTab === 'overview' && 'Monitor class performance, review upcoming lessons, and grade students.'}
              {activeSubTab === 'students' && 'View and manage student profiles and access.'}
              {activeSubTab === 'classes' && 'Configure and manage language classes.'}
              {activeSubTab === 'reports' && 'Monitor evaluation metrics and student progression.'}
              {activeSubTab === 'profile' && 'Update your personal information and security credentials.'}
            </p>
          </div>
          
          {['students', 'classes'].includes(activeSubTab) && (
            <div className="header-actions">
              <div className="search-bar">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeSubTab}...`} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="primary-btn" onClick={openAddModal}>
                <FiPlus /> Add {activeSubTab.slice(0, -1)}
              </button>
            </div>
          )}
        </header>

        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* --- OVERVIEW TAB --- */}
        {activeSubTab === 'overview' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Assigned Classes</span>
                  <FiUsers style={{ color: '#8b5cf6', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{data.assigned_classes?.length || 0}</h2>
                <p style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '0.25rem' }}>{(data.assigned_classes || []).join(', ') || 'None'}</p>
              </div>

              <div className="stats-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Scenarios</span>
                  <FiBookOpen style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{data.active_scenarios || 0}</h2>
                <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>Assigned lessons in lab</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiClock style={{ color: '#8b5cf6' }} /> Today's Lab Schedule
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(data.upcoming_lessons || []).map(lesson => (
                    <div key={lesson.id} style={{ display: 'flex', padding: '0.9rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6', backgroundColor: '#f8fafc', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{lesson.class}</h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>Topic: {lesson.topic}</p>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#8b5cf6', backgroundColor: '#f5f3ff', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{lesson.time}</span>
                    </div>
                  ))}
                  {(!data.upcoming_lessons || data.upcoming_lessons.length === 0) && (
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No lessons scheduled for today.</p>
                  )}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiActivity style={{ color: '#10b981' }} /> Top Performing Students
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(data.student_rankings || []).map((rank, idx) => (
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
                  {(!data.student_rankings || data.student_rankings.length === 0) && (
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No student rankings available yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STUDENTS TAB --- */}
        {activeSubTab === 'students' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="table-avatar">{student.full_name ? student.full_name.charAt(0).toUpperCase() : (student.username ? student.username.charAt(0).toUpperCase() : 'S')}</div>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{student.full_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{student.username}</td>
                    <td>{student.email || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}</td>
                    <td>
                      <span className={`status-badge ${student.is_active ? 'active' : 'inactive'}`}>
                        {student.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn edit-btn" onClick={() => openEditModal(student)} title="Edit"><FiEdit2 /></button>
                        <button className="icon-btn delete-btn" onClick={() => handleDelete(student.id, 'student')} title="Delete"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- CLASSES TAB --- */}
        {activeSubTab === 'classes' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Grade Level</th>
                  <th>School</th>
                  <th>Academic Year</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.length > 0 ? filteredClasses.map(cls => (
                  <tr key={cls.id}>
                    <td><span style={{ fontWeight: 600, color: '#1e293b' }}>{cls.class_name}</span></td>
                    <td>{grades.find(g => g.id === cls.grade)?.grade_name || cls.grade}</td>
                    <td>{schools.find(s => s.school_id === cls.school)?.school_name || cls.school}</td>
                    <td>{cls.academic_year}</td>
                    <td>
                      <span className={`status-badge ${cls.is_active ? 'active' : 'inactive'}`}>
                        {cls.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn edit-btn" onClick={() => openEditModal(cls)} title="Edit"><FiEdit2 /></button>
                        <button className="icon-btn delete-btn" onClick={() => handleDelete(cls.id, 'class')} title="Delete"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No classes found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- REPORTS TAB --- */}
        {activeSubTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Overall Student Marks</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Speaking</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#8b5cf6' }}>85%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '85%', height: '100%', backgroundColor: '#8b5cf6' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Vocabulary</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981' }}>72%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '72%', height: '100%', backgroundColor: '#10b981' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Comprehension</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#3b82f6' }}>90%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '90%', height: '100%', backgroundColor: '#3b82f6' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Writing</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f59e0b' }}>68%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '68%', height: '100%', backgroundColor: '#f59e0b' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Top 5 Students by Grade</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['Sarah Jenkins - Grade 10', 'Michael Chen - Grade 9', 'Emma Watson - Grade 8', 'David Miller - Grade 10', 'Jessica Lee - Grade 11'].map((student, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx < 4 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b', backgroundColor: '#f8fafc', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{student}</span>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981' }}>{95 - idx}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeSubTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiUser style={{ color: '#8b5cf6' }} /> Update Personal Information
              </h3>
              <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <FiUser className="input-icon" />
                    <input type="text" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <FiLock className="input-icon" />
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiLock style={{ color: '#ef4444' }} /> Change Password
              </h3>
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="input-with-icon">
                    <FiLock className="input-icon" />
                    <input type="password" value={profileForm.current_password} onChange={e => setProfileForm({...profileForm, current_password: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-with-icon">
                    <FiLock className="input-icon" />
                    <input type="password" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} required minLength="6" />
                  </div>
                </div>
                <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', backgroundColor: '#ef4444' }} disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* --- CRUD MODALS --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modalType === 'add' ? 'Add New' : 'Edit'} {activeSubTab.slice(0, -1)}</h3>
              <button className="close-modal-btn" onClick={closeModal}><FiX /></button>
            </div>
            <div className="modal-body">
              {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{errorMsg}</div>}
              
              <form onSubmit={handleFormSubmit} id="crud-form">
                
                {/* Student Fields */}
                {activeSubTab === 'students' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Username *</label>
                        <input type="text" value={studentForm.username} onChange={e => setStudentForm({...studentForm, username: e.target.value})} required disabled={modalType === 'edit'} />
                      </div>
                      <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={studentForm.full_name} onChange={e => setStudentForm({...studentForm, full_name: e.target.value})} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>{modalType === 'add' ? 'Password *' : 'New Password (leave blank to keep current)'}</label>
                        <input type="password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} required={modalType === 'add'} />
                      </div>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={studentForm.is_active} onChange={e => setStudentForm({...studentForm, is_active: e.target.checked})} />
                        Account is Active
                      </label>
                    </div>
                  </>
                )}

                {/* Class Fields */}
                {activeSubTab === 'classes' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Class Name *</label>
                        <input type="text" value={classForm.class_name} onChange={e => setClassForm({...classForm, class_name: e.target.value})} required placeholder="e.g. 10A Science" />
                      </div>
                      <div className="form-group">
                        <label>Academic Year</label>
                        <input type="text" value={classForm.academic_year} onChange={e => setClassForm({...classForm, academic_year: e.target.value})} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>School *</label>
                        <select value={classForm.school} onChange={e => setClassForm({...classForm, school: e.target.value})} required>
                          {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Grade Level *</label>
                        <select value={classForm.grade} onChange={e => setClassForm({...classForm, grade: e.target.value})} required>
                          {grades.map(g => <option key={g.id} value={g.id}>{g.grade_name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={classForm.is_active} onChange={e => setClassForm({...classForm, is_active: e.target.checked})} />
                        Class is Active
                      </label>
                    </div>
                  </>
                )}

              </form>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={closeModal} type="button">Cancel</button>
              <button className="primary-btn" type="submit" form="crud-form" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : (modalType === 'add' ? 'Create' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
