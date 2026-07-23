import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiUsers, FiBookOpen, FiBarChart2, FiUser,
  FiSettings, FiHelpCircle, FiLogOut, FiSearch,
  FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiCalendar, FiBell, FiFilter,
  FiCheckCircle, FiMonitor, FiSmartphone, FiFileText,
  FiActivity, FiTrendingUp, FiClock, FiAward,
  FiChevronLeft, FiChevronRight, FiLock, FiArrowRight, FiDownload, FiAlertTriangle,
  FiEye, FiEyeOff
} from 'react-icons/fi';
import './SchoolDashboard.css';
import { apiFetch } from './api';
import teacherHeaderBanner from './assets/6.jpeg';
import logoIcon from './assets/icon.png';

/* ─── Static chart data (same as SchoolDashboard reference) ─── */
const CHART_MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
const CHART_LINES = [
  { label: 'Weekly',    color: '#2563eb', points: [40, 55, 45, 70, 60, 80] },
  { label: 'Monthly',   color: '#10b981', points: [30, 40, 55, 45, 65, 55] },
  { label: 'Ability',   color: '#f97316', points: [55, 35, 60, 50, 40, 70] },
  { label: 'Authority', color: '#a855f7', points: [25, 45, 35, 60, 50, 45] },
];
const RECENT_ACTIVITY = [
  { id: 1, name: 'John Doe',      color: '#6366f1', desc: 'Completed lesson on "Tenses"',  time: '10:32 AM' },
  { id: 2, name: 'Sarah Smith',   color: '#22c55e', desc: 'Submitted vocabulary test',      time: '10:18 AM' },
  { id: 3, name: 'Michael Brown', color: '#f97316', desc: 'Completed a speaking exercise',  time: 'Yesterday' },
  { id: 4, name: 'Jessica White', color: '#a78bfa', desc: 'Reviewed grammar assignment',    time: '2 hours ago' },
];

/* ─── SVG Donut Chart ─── */
const DonutChart = ({ pct = 68 }) => {
  const R = 46, CX = 60, CY = 60;
  const circ = 2 * Math.PI * R;
  const filled = (pct / 100) * circ;
  return (
    <svg viewBox="0 0 120 120" width="160" height="160" className="sd-donut-svg" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <filter id="donutShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#2563eb" floodOpacity="0.45" />
        </filter>
      </defs>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth="10"/>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#donutGrad)" strokeWidth="12"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${CX} ${CY})`}
        filter="url(#donutShadow)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={CX} y={CY - 5} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 17, fontWeight: 800, fill: '#0f172a', fontFamily: 'Outfit,Inter,sans-serif' }}>
        {pct}%
      </text>
      <text x={CX} y={CY + 12} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 9, fill: '#6b7280', fontFamily: 'Outfit,Inter,sans-serif', fontWeight: 600 }}>
        Completed
      </text>
    </svg>
  );
};

/* ─── SVG Line Chart ─── */
const LineChart = ({ lines = CHART_LINES }) => {
  const W = 400, H = 120;
  const PAD = { top: 10, right: 8, bottom: 10, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const pts = 6;
  const toX = (i) => PAD.left + (i / (pts - 1)) * chartW;
  const toY = (v) => PAD.top + chartH - (v / 100) * chartH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="140" preserveAspectRatio="none" className="sd-chart-svg">
      {[25, 50, 75].map(v => (
        <line key={v} x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="#f3f4f6" strokeWidth="1"/>
      ))}
      {lines.map(line => {
        const d = line.points.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
        return (
          <g key={line.label}>
            <path d={d} fill="none" stroke={line.color} strokeWidth="2.2"
              strokeLinejoin="round" strokeLinecap="round"/>
            {line.points.map((v, i) => (
              <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={line.color}/>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

/* ─── Pagination ─── */
const Pagination = ({ total, perPage = 4, page, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const items = pages <= 5 ? Array.from({ length: pages }, (_, i) => i + 1) : [1, 2, 3, '...', pages];
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="sd-pagination-bar">
      <span className="sd-pagination-info">
        Showing {from} to {to} of {total} {total === 1 ? 'record' : 'records'}
      </span>
      <div className="sd-pagination-pages">
        <button className="sd-page-btn arrow" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <FiChevronLeft/>
        </button>
        {items.map((it, i) =>
          it === '...'
            ? <span key={i} className="sd-page-btn ellipsis">…</span>
            : <button key={it} className={`sd-page-btn${page === it ? ' active' : ''}`} onClick={() => onPage(it)}>{it}</button>
        )}
        <button className="sd-page-btn arrow" disabled={page === pages} onClick={() => onPage(page + 1)}>
          <FiChevronRight/>
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   TEACHER DASHBOARD COMPONENT
   ═══════════════════════════════════════════ */
const TeacherDashboard = ({ user, onLogout }) => {
  /* ── Navigation ── */
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ── UI ── */
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const [successMsg, setSuccessMsg]       = useState('');

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);
  const [searchQuery, setSearchQuery]     = useState('');

  /* ── Pagination ── */
  const [studentPage,  setStudentPage]  = useState(1);
  const [classPage,    setClassPage]    = useState(1);
  const PER_PAGE = 4;

  /* ── Selection ── */
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedClassIds,   setSelectedClassIds]   = useState([]);

  /* ── Bulk Upload ── */
  const [importActive,   setImportActive]   = useState(false);
  const [uploadSummary,  setUploadSummary]  = useState(null);

  /* ── Modals ── */
  const [showModal,   setShowModal]   = useState(false);
  const [modalType,   setModalType]   = useState('add');
  const [editingId,   setEditingId]   = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: '' });

  /* ── Data ── */
  const [data,     setData]     = useState(null);
  const [students, setStudents] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [schools,  setSchools]  = useState([]);
  const [grades,   setGrades]   = useState([]);

  /* ── Forms ── */
  const [studentForm, setStudentForm] = useState({
    username: '', password: '', email: '', full_name: '', is_active: true
  });
  const [classForm, setClassForm] = useState({
    class_name: '', school: '', grade: '',
    academic_year: new Date().getFullYear().toString(), is_active: true
  });
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '', email: user?.email || '',
    full_name: user?.full_name || '', phone_no: user?.phone_no || '',
    current_password: '', password: ''
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwModalError, setPwModalError] = useState('');

  /* ══════════════════
     DATA LOADERS (unchanged from original)
     ══════════════════ */
  const loadDashboardData = async () => {
    try {
      const res = await apiFetch('/api/teacher/dashboard/');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error('Failed to load teacher dashboard data.', e); }
  };

  const loadSchools = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/schools/');
      if (res.ok) { const d = await res.json(); setSchools(d.results || d); }
    } catch (e) { console.error('Failed to load schools.', e); }
  };

  const loadGrades = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/grades/');
      if (res.ok) { const d = await res.json(); setGrades(d.results || d); }
    } catch (e) { console.error('Failed to load grades.', e); }
  };

  const loadStudents = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/students/');
      if (res.ok) { const d = await res.json(); setStudents(d.results || d); }
    } catch (e) { console.error('Failed to load students.', e); }
  };

  const loadClasses = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/classes/');
      if (res.ok) { const d = await res.json(); setClasses(d.results || d); }
    } catch (e) { console.error('Failed to load classes.', e); }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([loadDashboardData(), loadSchools(), loadGrades(), loadStudents(), loadClasses()]);
    } catch (e) { setErrorMsg('Error loading dashboard data.'); console.error(e); }
    finally { setLoading(false); }
  };

  const formatErrorMsg = (err) => {
    if (!err) return '';
    let msg = typeof err === 'object' ? (err.detail || err.error || err.message || JSON.stringify(err)) : String(err);
    if (msg.startsWith('{') || msg.startsWith('[')) {
      try {
        const parsed = JSON.parse(msg);
        msg = parsed.detail || parsed.error || Object.values(parsed).flat().join(', ');
      } catch {
        // use raw
      }
    }
    if (msg.length > 85) msg = msg.slice(0, 80) + '...';
    return msg;
  };

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => { loadAllData(); }, []);

  /* ── Feedback ── */
  const showFeedback = (success, error) => {
    if (success) { setSuccessMsg(success); }
    if (error)   { setErrorMsg(formatErrorMsg(error)); }
  };

  /* ── Form init ── */
  const initForm = (tab, entity = null) => {
    setErrorMsg('');
    if (tab === 'students') {
      setStudentForm(entity ? {
        username: entity.username || '', password: '',
        email: entity.email || '', full_name: entity.full_name || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : { username: '', password: '', email: '', full_name: '', is_active: true });
    } else if (tab === 'classes') {
      setClassForm(entity ? {
        class_name: entity.class_name || '',
        school: entity.school || (schools[0]?.school_id || ''),
        grade: entity.grade || (grades[0]?.id || ''),
        academic_year: entity.academic_year || new Date().getFullYear().toString(),
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : {
        class_name: '', school: schools[0]?.school_id || '',
        grade: grades[0]?.id || '', academic_year: new Date().getFullYear().toString(), is_active: true
      });
    }
  };

  const openAddModal = () => { initForm(activeSubTab); setModalType('add'); setEditingId(null); setShowModal(true); };
  const openEditModal = (entity) => { initForm(activeSubTab, entity); setModalType('edit'); setEditingId(entity.id); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setErrorMsg(''); };

  /* ── CRUD Submit ── */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    let endpoint = '';
    const method = modalType === 'add' ? 'POST' : 'PUT';
    let payload = {};
    if (activeSubTab === 'students') {
      endpoint = modalType === 'add' ? '/api/cms/v1/students/' : `/api/cms/v1/students/${editingId}/`;
      payload = { ...studentForm, role: 'STUDENT' };
      if (modalType === 'edit' && !payload.password) delete payload.password;
    } else if (activeSubTab === 'classes') {
      endpoint = modalType === 'add' ? '/api/cms/v1/classes/' : `/api/cms/v1/classes/${editingId}/`;
      payload = { ...classForm };
    }
    try {
      const res = await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        showFeedback(`${activeSubTab.slice(0, -1)} ${modalType === 'add' ? 'added' : 'updated'} successfully!`, null);
        closeModal();
        if (activeSubTab === 'students') loadStudents();
        else if (activeSubTab === 'classes') loadClasses();
      } else {
        const errorData = await res.json().catch(() => ({}));
        showFeedback(null, errorData.detail || errorData.error || errorData.message ||
          Object.values(errorData).flat().join(', ') || 'Action failed. Please check inputs.');
      }
    } catch { setErrorMsg('Network error occurred.'); }
    finally { setActionLoading(false); }
  };

  /* ── Delete ── */
  const openDeleteModal = (id, type) => {
    setDeleteConfirm({ show: true, id, type });
  };

  const confirmDeleteAction = async () => {
    if (!deleteConfirm.show) return;
    setActionLoading(true);
    try {
      if (deleteConfirm.isBulk) {
        const { id: bulkType, ids, count } = deleteConfirm;
        if (bulkType === 'bulk-students') {
          await Promise.all(ids.map(id => apiFetch(`/api/cms/v1/students/${id}/`, { method: 'DELETE' })));
          showFeedback(`Successfully deleted ${count} student(s).`, null);
          setSelectedStudentIds([]);
          await loadStudents();
        } else if (bulkType === 'bulk-classes') {
          await Promise.all(ids.map(id => apiFetch(`/api/cms/v1/classes/${id}/`, { method: 'DELETE' })));
          showFeedback(`Successfully deleted ${count} class(es).`, null);
          setSelectedClassIds([]);
          await loadClasses();
        }
        setDeleteConfirm({ show: false, id: null, type: '', isBulk: false, ids: [], count: 0 });
        return;
      }
      const { id, type } = deleteConfirm;
      if (!id) return;
      const res = await apiFetch(`/api/cms/v1/${type}s/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        showFeedback(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`, null);
        setDeleteConfirm({ show: false, id: null, type: '' });
        if (type === 'student') await loadStudents();
        else if (type === 'class') await loadClasses();
      } else {
        const data = await res.json().catch(() => ({}));
        showFeedback(null, data.error || data.detail || 'Delete failed.');
      }
    } catch {
      showFeedback(null, 'Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Bulk Upload ── */
  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg('');
    setSuccessMsg('');
    setUploadSummary(null);
    setActionLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_type', 'student');

    try {
      const res = await apiFetch('/api/cms/v1/bulk-upload/', {
        method: 'POST',
        body: formData
      });
      const resData = await res.json();
      if (res.ok) {
        setUploadSummary(resData);
        if (resData.created > 0) {
          showFeedback(`Imported ${resData.created} student(s) successfully.`, null);
          await loadStudents();
        } else {
          setErrorMsg('Bulk upload complete with 0 records imported.');
        }
      } else {
        setErrorMsg(resData.error || 'Failed to process spreadsheet.');
      }
    } catch (err) {
      setErrorMsg('Failed to upload file. Check connections.');
    } finally {
      setActionLoading(false);
      e.target.value = '';
    }
  };

  /* ── Selection Handlers ── */
  const handleSelectAllStudents = (e) => {
    if (e.target.checked) {
      const filtered = filterList(students);
      setSelectedStudentIds(filtered.map(s => s.student_id || s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudentRow = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAllClasses = (e) => {
    if (e.target.checked) {
      const filtered = filterList(classes);
      setSelectedClassIds(filtered.map(c => c.class_id || c.id));
    } else {
      setSelectedClassIds([]);
    }
  };

  const handleSelectClassRow = (id) => {
    setSelectedClassIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  /* ── Bulk Delete Handlers ── */
  const handleBulkDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    setDeleteConfirm({ show: true, id: 'bulk-students', type: 'students', isBulk: true, count: selectedStudentIds.length, ids: [...selectedStudentIds] });
  };

  const handleBulkDeleteClasses = () => {
    if (selectedClassIds.length === 0) return;
    setDeleteConfirm({ show: true, id: 'bulk-classes', type: 'classes', isBulk: true, count: selectedClassIds.length, ids: [...selectedClassIds] });
  };

  /* ── Profile update ── */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/users/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: profileForm.full_name, email: profileForm.email, phone_no: profileForm.phone_no })
      });
      let resData = {};
      try { resData = await res.json(); } catch { resData = {}; }
      if (!res.ok) {
        let msg = 'Failed to update profile.';
        if (resData.email) msg = Array.isArray(resData.email) ? resData.email.join(' ') : resData.email;
        else if (resData.phone_no) msg = Array.isArray(resData.phone_no) ? resData.phone_no.join(' ') : resData.phone_no;
        else if (resData.full_name) msg = Array.isArray(resData.full_name) ? resData.full_name.join(' ') : resData.full_name;
        else if (resData.detail) msg = String(resData.detail);
        else if (resData.error) msg = String(resData.error);
        else if (typeof resData === 'object' && Object.keys(resData).length > 0) {
          const firstVal = Object.values(resData)[0];
          msg = Array.isArray(firstVal) ? firstVal.join(' ') : String(firstVal);
        }
        setErrorMsg(msg);
        return;
      }
      const updatedUser = resData.user || { ...user, full_name: profileForm.full_name, email: profileForm.email, phone_no: profileForm.phone_no };
      try { localStorage.setItem('user', JSON.stringify(updatedUser)); } catch {}
      showFeedback('Profile updated successfully', null);
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorMsg('Failed to update profile.');
    } finally { setActionLoading(false); }
  };

  /* ── Filter helpers ── */
  const filterList = (list) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item =>
      (item.full_name || '').toLowerCase().includes(q) ||
      (item.username || '').toLowerCase().includes(q) ||
      (item.class_name || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q)
    );
  };
  const paginate = (list, page) => list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ── Nav helper ── */
  const goTo = (tab) => { setActiveSubTab(tab); setSearchQuery(''); setIsSidebarOpen(false); setStudentPage(1); setClassPage(1); };

  /* ── Stat values ── */
  const statClasses  = data?.assigned_classes?.length || classes.length;
  const statStudents = students.length;
  const statExperiences = data?.active_experiences || 0;
  const statLessons  = data?.upcoming_lessons?.length || 0;

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh',
        background:'linear-gradient(135deg,#0b1437 0%,#1a2c7a 100%)', flexDirection:'column', gap:'1rem' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid rgba(99,102,241,0.3)',
          borderTopColor:'#6366f1', animation:'spin 0.8s linear infinite' }}/>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.9rem', fontFamily:'Outfit,sans-serif' }}>
          Loading Teacher Portal...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <div className="sd-layout">
      {/* ── Scoped Teacher Dashboard Luminous Slate Theme Styling ── */}
      <style>{`
        /* Scoped Teacher Dashboard Style Overrides matching the reference image */
        :root {
          --main-bg: #e5ecf4 !important; 
          --accent: #2563eb !important;  
          --accent-hover: #1d4ed8 !important;
          --sidebar-bg-top: #006aa6;
          --sidebar-bg-bot: #005080;
        }

        /* ── Premium Dashboard Header Card ── */
        .sd-dashboard-header-card {
          background-color: #d5e3f2 !important;
          background-size: cover !important;
          background-position: center right !important;
          background-repeat: no-repeat !important;
          border: 1px solid #b9cde3 !important;
          border-radius: 16px !important;
          padding: 2.2rem 2.5rem !important;
          position: relative !important;
          min-height: 180px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          margin-bottom: 1.5rem !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
          overflow: hidden !important;
        }
        .sd-header-text-section {
          max-width: 50% !important;
          z-index: 2 !important;
        }
        .sd-header-text-section h1 {
          font-size: 1.85rem !important;
          font-weight: 800 !important;
          color: #0f172a !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          margin: 0 !important;
        }
        .sd-header-text-section p {
          font-size: 0.9rem !important;
          color: #475569 !important;
          line-height: 1.5 !important;
          margin-top: 8px !important;
        }
        .sd-platform-status-widget {
          position: absolute !important;
          top: 1.5rem !important;
          right: 2.5rem !important;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          padding: 0.65rem 1rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03) !important;
          z-index: 2 !important;
        }
        .sd-status-dot-glowing {
          width: 8px !important;
          height: 8px !important;
          background-color: #10b981 !important;
          border-radius: 50% !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25) !important;
          animation: sd-pulse 2s infinite !important;
        }
        @keyframes sd-pulse {
          0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); }
        }
        .sd-status-text-stack {
          display: flex !important;
          flex-direction: column !important;
        }
        .sd-status-text-title {
          font-size: 0.85rem !important;
          font-weight: 700 !important;
        }
        .sd-status-text-sub {
          font-size: 0.72rem !important;
          color: #64748b !important;
          margin-top: 1px !important;
        }
        .sd-header-actions-widget {
          position: absolute !important;
          bottom: 1.5rem !important;
          right: 2.5rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          z-index: 2 !important;
        }

        /* ── Sidebar Pane (Solid/Deep Navy Blue) ── */
        .sd-sidebar {
          background: linear-gradient(180deg, #006aa6 0%, #005080 100%) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.03) !important;
          position: relative;
          overflow: hidden;
          width: 260px !important;
        }

        .sd-brand {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 1.75rem 1.5rem 1.5rem !important;
        }
        .sd-brand-name {
          color: #ffffff !important;
          font-size: 1.35rem !important;
          font-weight: 800 !important;
          letter-spacing: -0.02em !important;
        }
        .sd-brand-sub {
          color: rgba(255, 255, 255, 0.6) !important;
          font-size: 0.78rem !important;
          font-weight: 500 !important;
        }
        .sd-nav {
          padding: 1.5rem 1rem !important;
          gap: 4px !important;
        }
        .sd-nav-item {
          color: rgba(255, 255, 255, 0.9) !important;
          padding: 0.75rem 1rem !important;
          font-size: 0.9rem !important;
          font-weight: 500 !important;
          border-radius: 8px !important;
          background: transparent !important;
        }
        .sd-nav-item svg {
          color: rgba(255, 255, 255, 0.85) !important;
          font-size: 1.15rem !important;
        }
        .sd-nav-item:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
        .sd-nav-item.active {
          background: #ffffff !important;
          color: #006aa6 !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 12px rgba(0, 106, 166, 0.15) !important;
        }
        .sd-nav-item.active svg {
          color: #006aa6 !important;
        }
        .sd-sidebar-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .sd-footer {
          padding: 0.35rem 0.75rem 0.75rem !important;
        }
        .sd-footer-link {
          color: rgba(255, 255, 255, 0.7) !important;
          padding: 0.6rem 1rem !important;
          font-size: 0.88rem !important;
        }
        .sd-footer-link svg {
          color: inherit !important;
        }
        .sd-footer-link:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }
        .sd-footer-link.danger {
          color: #f87171 !important;
        }
        .sd-footer-link.danger:hover {
          background-color: rgba(239, 68, 68, 0.1) !important;
          color: #f87171 !important;
        }
        .sd-user-card {
          background: transparent !important;
          padding: 0.9rem 1.1rem !important;
        }
        .sd-user-card:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .sd-user-name {
          color: #ffffff !important;
          font-size: 0.9rem !important;
        }
        .sd-user-role {
          color: rgba(255, 255, 255, 0.5) !important;
          font-size: 0.75rem !important;
        }
        .sd-user-avatar {
          background: linear-gradient(135deg, #2563eb, #0ea5e9) !important;
          color: #ffffff !important;
          width: 38px !important;
          height: 38px !important;
          font-size: 0.85rem !important;
        }
        .sd-user-chevron {
          color: rgba(255, 255, 255, 0.5) !important;
        }

        /* ── Top Header Navbar ── */
        .sd-topbar {
          background: var(--main-bg) !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .sd-search {
          background: #ffffff !important;
          border: 1px solid #d2e1f0 !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03) !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .sd-search:focus-within {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }
        .sd-search svg {
          color: #94a3b8 !important;
        }
        .sd-search input {
          color: #0f172a !important;
        }
        .sd-search input::placeholder {
          color: #94a3b8 !important;
        }

        /* Card shadows and style matches */
        .sd-card {
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
        }
        .sd-stat-row {
          display: grid !important;
          grid-template-columns: repeat(6, 1fr) !important;
          gap: 0.75rem !important;
          margin-bottom: 1.5rem !important;
        }
        @media (max-width: 1200px) {
          .sd-stat-row {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .sd-stat-row {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        .sd-stat-card {
          display: flex !important;
          flex-direction: row !important;
          align-items: flex-start !important;
          gap: 0.75rem !important;
          padding: 1rem 0.65rem !important;
          border: 1px solid #e2e8f0 !important;
          border-top: 3px solid #2563eb !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
          background: #ffffff !important;
          border-radius: 12px !important;
          min-height: 96px !important;
        }
        .sd-stat-card-icon-part {
          flex-shrink: 0 !important;
          width: 38px !important;
          height: 38px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.015) !important;
        }
        .sd-stat-card-icon-part svg {
          font-size: 1.25rem !important;
        }
        .sd-stat-card-content-part {
          display: flex !important;
          flex-direction: column !important;
          gap: 0.15rem !important;
          align-items: flex-start !important;
          flex: 1 !important;
          overflow: hidden !important;
        }
        .sd-stat-value {
          font-size: 1.35rem !important;
          font-weight: 800 !important;
          color: #0f172a !important;
          line-height: 1.1 !important;
        }
        .sd-stat-label {
          font-size: 0.64rem !important;
          color: #64748b !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.01em !important;
          margin: 0 !important;
          white-space: nowrap !important;
          text-overflow: ellipsis !important;
          overflow: hidden !important;
          width: 100% !important;
        }
        .sd-stat-trend {
          font-size: 0.68rem !important;
          font-weight: 700 !important;
          padding: 2px 8px !important;
          border-radius: 20px !important;
          margin-top: 3px !important;
          display: inline-flex !important;
        }
        .sd-btn-primary {
          background: #2563eb !important;
        }
        .sd-btn-primary:hover {
          background: #1d4ed8 !important;
        }
        .sd-tab.active {
          color: #2563eb !important;
          border-bottom-color: #2563eb !important;
        }
        .sd-badge-active {
          background-color: rgba(37, 99, 235, 0.1) !important;
          color: #2563eb !important;
        }
      `}</style>

      {/* ── Mobile top bar ── */}
      <header className="sd-mobile-header">
        <button className="sd-hamburger" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu"><FiMenu/></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logoIcon} alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
          <span className="sd-mobile-brand">LinguaLab</span>
        </div>
        <div style={{ width: 34 }}/>
      </header>

      {/* ── Sidebar backdrop (mobile) ── */}
      <div className={`sd-sidebar-backdrop${isSidebarOpen ? ' open' : ''}`} onClick={() => setIsSidebarOpen(false)}/>

      {/* ═════════════════
          SIDEBAR
          ═════════════════ */}
      <aside className={`sd-sidebar${isSidebarOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div className="sd-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
          <img src={logoIcon} alt="Logo" style={{ width: '62px', height: '100px', objectFit: 'contain' }} />
          <div>
            <div className="sd-brand-name">LinguaLab</div>
            <div className="sd-brand-sub">Teacher Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sd-nav">
          <button className={`sd-nav-item${activeSubTab === 'overview'  ? ' active' : ''}`} onClick={() => goTo('overview')}>
            <FiGrid/><span>Dashboard</span>
          </button>
          <button className={`sd-nav-item${activeSubTab === 'students'  ? ' active' : ''}`} onClick={() => goTo('students')}>
            <FiUsers/><span>Students</span>
          </button>
          <button className={`sd-nav-item${activeSubTab === 'classes'   ? ' active' : ''}`} onClick={() => goTo('classes')}>
            <FiBookOpen/><span>Classes</span>
          </button>
          <button className={`sd-nav-item${activeSubTab === 'reports'   ? ' active' : ''}`} onClick={() => goTo('reports')}>
            <FiBarChart2/><span>Reports</span>
          </button>
          <button className={`sd-nav-item${activeSubTab === 'profile'   ? ' active' : ''}`} onClick={() => goTo('profile')}>
            <FiUser/><span>Profile Settings</span>
          </button>
        </nav>

        {/* Sidebar bottom: user card with logout icon */}
        <div className="sd-sidebar-bottom">
          <div className="sd-user-card">
            <div className="sd-user-avatar">
              {(user?.username || 'TE').slice(0, 2).toUpperCase()}
            </div>
            <div className="sd-user-meta">
              <div className="sd-user-name">{profileForm.full_name || user?.username || 'Teacher'}</div>
              <div className="sd-user-role">Teacher</div>
            </div>
            <button className="sd-logout-icon-btn" onClick={onLogout} title="Logout">
              <FiLogOut/>
            </button>
          </div>
        </div>
      </aside>

      {/* ═════════════════
          MAIN
          ═════════════════ */}
      <main className="sd-main">

        {/* ── Top Bar ── */}
        <div className="sd-topbar">
          {/* <div className="sd-search">
            <FiSearch/>
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div> */}
          <div className="sd-topbar-right" style={{ marginLeft: 'auto' }}>
            <button className="sd-year-badge"><FiCalendar/>2024 · 2025<FiChevronDown/></button>
            <button className="sd-icon-btn"><FiSettings/></button>
            <button className="sd-icon-btn"><FiBell/></button>
          </div>
        </div>

        {/* ── Page Content ── */}
        <div className={`sd-content${activeSubTab === 'overview' ? ' sd-content--dashboard' : ''}`}>

          {/* Alerts */}
          {successMsg && (
            <div className="sd-alert sd-alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiCheckCircle/> <span>{successMsg}</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', color: 'inherit', display: 'flex', alignItems: 'center' }} onClick={() => setSuccessMsg('')}><FiX/></button>
            </div>
          )}
          {errorMsg && (
            <div className="sd-alert sd-alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{errorMsg}</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', color: 'inherit', display: 'flex', alignItems: 'center' }} onClick={() => setErrorMsg('')}><FiX/></button>
            </div>
          )}

          {/* ══════════ OVERVIEW / DASHBOARD ══════════ */}
          {activeSubTab === 'overview' && (
            <>
              {/* Premium Dashboard Header Card with Background Image */}
              <div className="sd-dashboard-header-card" style={{ backgroundImage: `url(${teacherHeaderBanner})` }}>
                <div className="sd-header-text-section">
                  <h1>Welcome back, { profileForm.username || user?.username || 'Teacher' }!</h1>
                  <p>Manage classes, track student progress, coordinate learning scenarios, and review academic performance.</p>
                </div>

                {/* Header Actions Widget (Export Report only) */}
                <div className="sd-header-actions-widget">
                  <button className="sd-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    Export Report <FiDownload style={{ fontSize: '0.9rem' }}/>
                  </button>
                </div>
              </div>

              {/* Stat cards */}
              <div className="sd-stat-row">
                {[
                  { label: 'Assigned Classes', value: statClasses, color: '#22c55e', bg: '#dcfce7', icon: <FiBookOpen />, trend: '+2%' },
                  { label: 'Total Students', value: statStudents, color: '#3b82f6', bg: '#dbeafe', icon: <FiUsers />, trend: '+12%' },
                  { label: 'Active Experiences', value: statExperiences, color: '#a855f7', bg: '#f3e8ff', icon: <FiFileText />, trend: '+5%' },
                  { label: "Today's Lessons",   value: statLessons,   color: '#f97316', bg: '#ffedd5', icon: <FiClock/>,      trend: '0%'   },
                  { label: 'Avg Student Score', value: '—',           color: '#06b6d4', bg: '#cffafe', icon: <FiAward/>,      trend: '—'    },
                  { label: 'Completion Rate',   value: '—',           color: '#10b981', bg: '#d1fae5', icon: <FiTrendingUp/>, trend: '—'    },
                ].map((s, i) => (
                  <div className="sd-stat-card" key={i}>
                    <div className="sd-stat-card-icon-part" style={{ background: s.bg, color: s.color }}>
                      {s.icon}
                    </div>
                    <div className="sd-stat-card-content-part">
                      <div className="sd-stat-value">{s.value}</div>
                      <div className="sd-stat-label">{s.label}</div>
                      <span className="sd-stat-trend">{s.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Course Completion donut (Full Width Card) */}
              <div className="sd-card" style={{ width: '100%', marginBottom: '1.5rem' }}>
                <div className="sd-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="sd-card-title">Course Completion</div>
                    <div className="sd-card-sub">Class Progress Overview</div>
                  </div>
                  <button className="sd-year-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>This Month <FiChevronDown/></button>
                </div>
                <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '0.5rem 0' }}>
                  {/* Left: Donut wrapper */}
                  <div className="sd-donut-wrap" style={{ display: 'flex', justifyContent: 'center', padding: '0 0.5rem' }}>
                    <DonutChart pct={68}/>
                  </div>
                  
                  {/* Middle: Legend with progress bars */}
                  <div className="sd-legend" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1.5', minWidth: '300px' }}>
                    {[
                      { label: 'Completed',   color: '#2563eb', pct: '68%' },
                      { label: 'In Progress', color: '#10b981', pct: '22%' },
                      { label: 'Not Started', color: '#cbd5e1', pct: '10%' },
                    ].map(l => (
                      <div className="sd-legend-row" key={l.label} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 1.5fr', alignItems: 'center', gap: '1rem', width: '100%' }}>
                        <div className="sd-legend-dot-label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                          <div className="sd-legend-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }}/>
                          {l.label}
                        </div>
                        <span className="sd-legend-pct" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', textAlign: 'right' }}>{l.pct}</span>
                        <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{ width: l.pct, height: '100%', background: l.color, borderRadius: 5 }}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right: Completion Insights Box */}
                  <div style={{
                    background: '#eff6ff',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    flex: '2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid #dbeafe',
                    minWidth: '320px',
                    height: '140px'
                  }}>
                    <div style={{ position: 'absolute', right: '12px', bottom: '12px', opacity: 0.15 }}>
                      <svg width="130" height="80" viewBox="0 0 110 70" fill="none">
                        <path d="M10 60 L28 42 L46 50 L64 25 L82 33 L100 8" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M100 8 L90 8 M100 8 L100 18" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="23" y="47" width="7" height="13" fill="#2563eb" rx="1"/>
                        <rect x="41" y="52" width="7" height="8" fill="#2563eb" rx="1"/>
                        <rect x="59" y="30" width="7" height="30" fill="#2563eb" rx="1"/>
                        <rect x="77" y="38" width="7" height="22" fill="#2563eb" rx="1"/>
                        <rect x="95" y="13" width="7" height="47" fill="#2563eb" rx="1"/>
                      </svg>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: '#dbeafe', borderRadius: '50%', color: '#2563eb' }}>
                        <FiActivity style={{ fontSize: '1rem' }}/>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e40af' }}>Completion Insights</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.4, zIndex: 1 }}>
                      Great job! <span style={{ color: '#2563eb' }}>68%</span> of the coursework has been completed this month.
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 500, zIndex: 1 }}>
                      Keep encouraging your students to stay on track.
                    </p>
                  </div>
                </div>
              </div>



              {/* Row 3: Student Performance (left) and Student Activity (right) side by side */}
              <div className="sd-bottom-grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginBottom: '1.5rem' }}>
                {/* Student Performance Chart */}
                <div className="sd-card" style={{ margin: 0 }}>
                  <div className="sd-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem' }}>
                    <div>
                      <div className="sd-card-title">Student Performance</div>
                      <div className="sd-card-sub">Active Students</div>
                    </div>
                    <button className="sd-year-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>This Month <FiChevronDown/></button>
                  </div>
                  
                  {/* Legend items directly under the header */}
                  <div className="sd-chart-legend" style={{ display: 'flex', gap: '1rem', border: 'none', margin: '0.25rem 0 1rem 0', padding: 0 }}>
                    {CHART_LINES.map(l => (
                      <div className="sd-chart-legend-item" key={l.label} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                        <div className="sd-chart-legend-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }}/>
                        {l.label}
                      </div>
                    ))}
                  </div>

                  <div className="sd-chart-wrap" style={{ marginTop: '0.5rem' }}>
                    <LineChart lines={CHART_LINES}/>
                  </div>
                  <div className="sd-x-labels">
                    {CHART_MONTHS.map(m => <span className="sd-x-label" key={m}>{m}</span>)}
                  </div>
                </div>

                {/* Recent Student Activity */}
                <div className="sd-card" style={{ margin: 0 }}>
                  <div className="sd-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="sd-card-title">Student Activity</div>
                      <div className="sd-card-sub">Recent Activities</div>
                    </div>
                    <button className="sd-view-all" onClick={() => goTo('students')}>View All</button>
                  </div>
                  <div className="sd-activity-list">
                    {(data?.student_rankings?.length
                      ? data.student_rankings.slice(0, 4).map((rank, i) => ({
                          id: i,
                          name: rank.name,
                          color: RECENT_ACTIVITY[i % RECENT_ACTIVITY.length].color,
                          desc: `Score: ${rank.score} — ${rank.progress || 'Progress tracked'}`,
                          time: `#${i + 1}`
                        }))
                      : RECENT_ACTIVITY
                    ).map(act => (
                      <div className="sd-activity-item" key={act.id}>
                        <div className="sd-activity-avatar" style={{ background: act.color }}>
                          {act.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="sd-activity-body">
                          <div className="sd-activity-name">{act.name}</div>
                          <div className="sd-activity-desc">{act.desc}</div>
                        </div>
                        <div className="sd-activity-time">{act.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Today's Schedule card */}
              {(data?.upcoming_lessons?.length > 0) && (
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div>
                      <div className="sd-card-title">Today's Lab Schedule</div>
                      <div className="sd-card-sub">Upcoming lessons</div>
                    </div>
                  </div>
                  <div className="sd-activity-list">
                    {data.upcoming_lessons.map((lesson, i) => (
                      <div className="sd-activity-item" key={lesson.id || i}>
                        <div className="sd-activity-avatar" style={{ background: '#6366f1' }}>
                          <FiClock style={{ fontSize:'0.85rem' }}/>
                        </div>
                        <div className="sd-activity-body">
                          <div className="sd-activity-name">{lesson.class}</div>
                          <div className="sd-activity-desc">Topic: {lesson.topic}</div>
                        </div>
                        <div className="sd-activity-time" style={{ color:'#6366f1', fontWeight:600 }}>{lesson.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Banner removed */}
            </>
          )}

          {/* ══════════ STUDENTS TAB ══════════ */}
          {activeSubTab === 'students' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Manage Students</h1>
              </div>
              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div className="sd-table-search">
                    <FiSearch/>
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setStudentPage(1); }}
                    />
                  </div>
                  <div className="sd-table-actions">
                    {selectedStudentIds.length > 0 && (
                      <button className="sd-btn-outline" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleBulkDeleteStudents}>
                        <FiTrash2/> Delete Selected ({selectedStudentIds.length})
                      </button>
                    )}
                    <button className="sd-btn-outline" onClick={() => { setImportActive(!importActive); setUploadSummary(null); }}>
                      Excel Import
                    </button>
                    <button className="sd-btn-primary" onClick={openAddModal}><FiPlus/>Add Student</button>
                  </div>
                </div>

                {importActive && (
                  <div style={{
                    border: '2px dashed #2563eb',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    background: '#f8fafc',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Bulk Excel Upload</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: '#64748b' }}>
                      Upload an <code>.xlsx</code> or <code>.xls</code> spreadsheet with at least <code>username</code> and <code>password</code> columns.<br/>
                      Optional columns: <code>full_name</code>, <code>email</code>, <code>is_active</code>, <code>class_id</code>.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleBulkUpload}
                        disabled={actionLoading}
                        style={{ display: 'none' }}
                        id="teacher-bulk-upload-student-input"
                      />
                      <label htmlFor="teacher-bulk-upload-student-input" className="sd-btn-primary" style={{ cursor: 'pointer' }}>
                        {actionLoading ? 'Uploading...' : 'Choose Excel File'}
                      </label>
                      <button className="sd-btn-cancel" onClick={() => { setImportActive(false); setUploadSummary(null); }}>
                        Cancel
                      </button>
                    </div>
                    {uploadSummary && (
                      <div style={{
                        marginTop: '1.25rem',
                        padding: '1rem',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        textAlign: 'left',
                        fontSize: '0.84rem'
                      }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Upload Result:</div>
                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>Created: {uploadSummary.created}</span>
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Failed: {uploadSummary.failed}</span>
                        </div>
                        {uploadSummary.errors && uploadSummary.errors.length > 0 && (
                          <div style={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            background: '#fff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '0.5rem'
                          }}>
                            {uploadSummary.errors.map((err, idx) => (
                              <div key={idx} style={{ color: '#b91c1c', marginBottom: '0.25rem' }}>
                                Row {err.row}: {err.error}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <colgroup>
                      <col style={{ width: '4%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '31%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '13%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="sd-checkbox-cell">
                          <input
                            type="checkbox"
                            checked={students.length > 0 && selectedStudentIds.length === filterList(students).length}
                            onChange={handleSelectAllStudents}
                          />
                        </th>
                        <th>Full Name</th>
                        <th>Username</th>
                        <th>Email Address</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(students), studentPage).map((s, i) => {
                        const sid = s.student_id || s.id;
                        return (
                          <tr key={sid || i}>
                            <td className="sd-checkbox-cell">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(sid)}
                                onChange={() => handleSelectStudentRow(sid)}
                              />
                            </td>
                            <td>
                              <span className="sd-name-cell-primary">{s.full_name || 'N/A'}</span>
                            </td>
                            <td>{s.username}</td>
                            <td>{s.email || <span style={{ color:'#9ca3af', fontStyle:'italic' }}>Not provided</span>}</td>
                            <td style={{ overflow: 'visible', textOverflow: 'clip' }}>
                              <span className={`sd-badge ${s.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                                {s.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td>
                              <div className="sd-action-cell" style={{ justifyContent: 'center' }}>
                                <button className="sd-icon-action edit"   onClick={() => openEditModal(s)} title="Edit"><FiEdit2/></button>
                                <button className="sd-icon-action delete" onClick={() => openDeleteModal(sid, 'student')} title="Delete"><FiTrash2/></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filterList(students).length === 0 && (
                        <tr><td colSpan="6" className="sd-empty-state">No students found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={filterList(students).length} perPage={PER_PAGE} page={studentPage} onPage={setStudentPage}/>
              </div>
            </>
          )}

          {/* ══════════ CLASSES TAB ══════════ */}
          {activeSubTab === 'classes' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Manage Classes</h1>
              </div>
              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div className="sd-table-search">
                    <FiSearch/>
                    <input
                      type="text"
                      placeholder="Search classes..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setClassPage(1); }}
                    />
                  </div>
                  <div className="sd-table-actions">
                    {selectedClassIds.length > 0 && (
                      <button className="sd-btn-outline" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleBulkDeleteClasses}>
                        <FiTrash2/> Delete Selected ({selectedClassIds.length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <colgroup>
                      <col style={{ width: '4%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '33%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '13%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="sd-checkbox-cell">
                          <input
                            type="checkbox"
                            checked={classes.length > 0 && selectedClassIds.length === filterList(classes).length}
                            onChange={handleSelectAllClasses}
                          />
                        </th>
                        <th>Class Name</th>
                        <th>Grade Level</th>
                        <th>School Name</th>
                        <th>Academic Year</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(classes), classPage).map((c, i) => {
                        const cid = c.class_id || c.id;
                        return (
                          <tr key={cid || i}>
                            <td className="sd-checkbox-cell">
                              <input
                                type="checkbox"
                                checked={selectedClassIds.includes(cid)}
                                onChange={() => handleSelectClassRow(cid)}
                              />
                            </td>
                            <td>
                              <span className="sd-name-cell-primary">{c.class_name}</span>
                            </td>
                            <td>{grades.find(g => g.id === c.grade)?.grade_name || c.grade || 'N/A'}</td>
                            <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {schools.find(s => s.school_id === c.school)?.school_name || c.school || 'N/A'}
                            </td>
                            <td>{c.academic_year}</td>
                            <td style={{ overflow: 'visible', textOverflow: 'clip' }}>
                              <span className={`sd-badge ${c.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                                {c.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td>
                              <div className="sd-action-cell" style={{ justifyContent: 'center' }}>
                                <button className="sd-icon-action edit"   onClick={() => openEditModal(c)} title="Edit"><FiEdit2/></button>
                                <button className="sd-icon-action delete" onClick={() => openDeleteModal(cid, 'class')} title="Delete"><FiTrash2/></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filterList(classes).length === 0 && (
                        <tr><td colSpan="7" className="sd-empty-state">No classes found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={filterList(classes).length} perPage={PER_PAGE} page={classPage} onPage={setClassPage}/>
              </div>
            </>
          )}

          {/* ══════════ REPORTS TAB ══════════ */}
          {activeSubTab === 'reports' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Student Performance Reports</h1>
                <p className="sd-page-sub">Monitor evaluation metrics and student progression.</p>
              </div>

              {/* Skill breakdown cards */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <div className="sd-card-title">Overall Student Marks</div>
                  <span className="sd-card-meta">This Semester</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Speaking',      pct: 85, color: '#6366f1' },
                    { label: 'Vocabulary',    pct: 72, color: '#22c55e' },
                    { label: 'Comprehension', pct: 90, color: '#3b82f6' },
                    { label: 'Writing',       pct: 68, color: '#f59e0b' },
                  ].map(skill => (
                    <div key={skill.label}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:'0.83rem', fontWeight:600, color:'#374151' }}>{skill.label}</span>
                        <span style={{ fontSize:'0.83rem', fontWeight:700, color: skill.color }}>{skill.pct}%</span>
                      </div>
                      <div style={{ width:'100%', height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ width:`${skill.pct}%`, height:'100%', background: skill.color, borderRadius:4, transition:'width 0.6s ease' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top students */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <div className="sd-card-title">Top 5 Students by Grade</div>
                  <span className="sd-card-meta">All Classes</span>
                </div>
                <div className="sd-activity-list">
                  {(data?.student_rankings?.length
                    ? data.student_rankings.slice(0, 5)
                    : [
                        { name: 'Sarah Jenkins', score: '95%' },
                        { name: 'Michael Chen',  score: '92%' },
                        { name: 'Emma Watson',   score: '89%' },
                        { name: 'David Miller',  score: '87%' },
                        { name: 'Jessica Lee',   score: '85%' },
                      ]
                  ).map((rank, idx) => (
                    <div className="sd-activity-item" key={idx}>
                      <div className="sd-activity-avatar"
                        style={{ background: ['#f59e0b','#94a3b8','#b45309','#6366f1','#22c55e'][idx] || '#6366f1',
                          fontSize:'0.78rem', fontWeight:700 }}>
                        {idx + 1}
                      </div>
                      <div className="sd-activity-body">
                        <div className="sd-activity-name">{rank.name}</div>
                        <div className="sd-activity-desc">{rank.progress || 'Top performer'}</div>
                      </div>
                      <div className="sd-activity-time" style={{ color:'#10b981', fontWeight:700, fontSize:'0.85rem' }}>
                        {rank.score || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grading queue empty state */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <div className="sd-card-title">Grading Queue</div>
                </div>
                <div className="sd-reports-empty" style={{ padding:'2.5rem 1rem' }}>
                  <FiFileText/>
                  <h3>No pending submissions</h3>
                  <p>Grading data will appear here once students complete their experience assessments.</p>
                </div>
              </div>
            </>
          )}

          {/* ══════════ PROFILE / ACCOUNT SETTINGS ══════════ */}
          {activeSubTab === 'profile' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Account Settings</h1>
                <p className="sd-page-sub">Manage your personal information, security preferences, and teacher profile.</p>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="sd-profile-card">
                  {/* Header */}
                  <div className="sd-profile-section-header">
                    <div className="sd-profile-section-title">
                      <FiUser/>Personal Details
                    </div>
                    {/* <span className="sd-verified-badge"><FiCheckCircle/>Verified Teacher</span> */}
                  </div>

                  {/* Fields */}
                  <div className="sd-form-row">
                    <div className="sd-form-group">
                      <label className="sd-form-label">Full Name</label>
                      <input className="sd-form-input" type="text"
                        value={profileForm.full_name}
                        onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Your full name" required/>
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Email Address</label>
                      <input className="sd-form-input" type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="your@email.com"/>
                    </div>
                  </div>
                  <div className="sd-form-row">
                    <div className="sd-form-group">
                      <label className="sd-form-label">Username</label>
                      <input className="sd-form-input" type="text" value={profileForm.username} disabled/>
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Phone Number</label>
                      <input className="sd-form-input" type="tel"
                        value={profileForm.phone_no}
                        onChange={e => setProfileForm({ ...profileForm, phone_no: e.target.value })}
                        placeholder="+91 98765 43210"/>
                    </div>
                  </div>

                  {/* Change password row */}
                  <div className="sd-pw-row">
                    <div>
                      <div className="sd-pw-row-title">Change Password</div>
                      <div className="sd-pw-row-sub">Update your password to stay secure</div>
                    </div>
                    <button type="button" className="sd-btn-outline" onClick={() => {
                      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
                      setPwModalError('');
                      setShowPwModal(true);
                    }}>Update</button>
                  </div>



                  <div className="sd-profile-save-row">
                    <button type="submit" className="sd-btn-primary" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

        </div>{/* /sd-content */}
      </main>

      {/* ════════════════════
          CRUD MODAL (Students / Classes)
          ════════════════════ */}
      {showModal && (
        <div className="sd-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="sd-modal">
            <div className="sd-modal-header">
              <span className="sd-modal-title">
                {modalType === 'add' ? 'Add' : 'Edit'} {activeSubTab === 'students' ? 'Student' : 'Class'}
              </span>
              <button className="sd-modal-close" onClick={closeModal}><FiX/></button>
            </div>
            {errorMsg && <div className="sd-alert sd-alert-error" style={{ marginBottom:'1rem' }}><FiX/>{errorMsg}</div>}
            <form className="sd-modal-form" onSubmit={handleFormSubmit}>

              {/* Student fields */}
              {activeSubTab === 'students' && (<>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Username *</label>
                    <input className="sd-form-input" type="text" value={studentForm.username}
                      onChange={e => setStudentForm({ ...studentForm, username: e.target.value })}
                      disabled={modalType === 'edit'} required/>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Full Name</label>
                    <input className="sd-form-input" type="text" value={studentForm.full_name}
                      onChange={e => setStudentForm({ ...studentForm, full_name: e.target.value })}/>
                  </div>
                </div>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Email</label>
                    <input className="sd-form-input" type="email" value={studentForm.email}
                      onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}/>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">{modalType === 'add' ? 'Password *' : 'New Password'}</label>
                    <input className="sd-form-input" type="password" value={studentForm.password}
                      onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                      required={modalType === 'add'} placeholder={modalType === 'edit' ? 'Leave blank to keep current' : ''}/>
                  </div>
                </div>
                <label className="sd-checkbox-label">
                  <input type="checkbox" checked={studentForm.is_active}
                    onChange={e => setStudentForm({ ...studentForm, is_active: e.target.checked })}/>
                  Account is Active
                </label>
              </>)}

              {/* Class fields */}
              {activeSubTab === 'classes' && (<>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Class Name *</label>
                    <input className="sd-form-input" type="text" value={classForm.class_name}
                      onChange={e => setClassForm({ ...classForm, class_name: e.target.value })}
                      placeholder="e.g. 10A Science" required/>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Academic Year</label>
                    <input className="sd-form-input" type="text" value={classForm.academic_year}
                      onChange={e => setClassForm({ ...classForm, academic_year: e.target.value })}/>
                  </div>
                </div>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">School *</label>
                    <select className="sd-form-input" value={classForm.school}
                      onChange={e => setClassForm({ ...classForm, school: e.target.value })} required>
                      {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name}</option>)}
                    </select>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Grade Level *</label>
                    <select className="sd-form-input" value={classForm.grade}
                      onChange={e => setClassForm({ ...classForm, grade: e.target.value })} required>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.grade_name}</option>)}
                    </select>
                  </div>
                </div>
                <label className="sd-checkbox-label">
                  <input type="checkbox" checked={classForm.is_active}
                    onChange={e => setClassForm({ ...classForm, is_active: e.target.checked })}/>
                  Class is Active
                </label>
              </>)}

              <div className="sd-modal-footer">
                <button type="button" className="sd-btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="sd-btn-save" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : modalType === 'add' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPwModal && (
        <div className="sd-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowPwModal(false); }}>
          <div className="sd-modal" style={{ maxWidth: 420 }}>
            <div className="sd-modal-header">
              <span className="sd-modal-title">Change Password</span>
              <button className="sd-modal-close" onClick={() => setShowPwModal(false)}><FiX/></button>
            </div>

            <form className="sd-modal-form" onSubmit={async e => {
              e.preventDefault();
              setPwModalError('');
              if (!pwForm.current_password) { setPwModalError('Current password is required.'); return; }
              if (!pwForm.new_password) { setPwModalError('New password is required.'); return; }
              if (!pwForm.confirm_password) { setPwModalError('Confirm password is required.'); return; }
              if (pwForm.new_password.length < 6) { setPwModalError('New password must be at least 6 characters.'); return; }

              setActionLoading(true);
              try {
                const res = await apiFetch('/api/users/change-password/', {
                  method: 'POST',
                  body: JSON.stringify({ old_password: pwForm.current_password, new_password: pwForm.new_password, confirm_password: pwForm.confirm_password })
                });
                let d = {};
                try { d = await res.json(); } catch { d = {}; }
                if (res.ok) {
                  showFeedback('Password changed successfully!', null);
                  setPwForm({ current_password: '', new_password: '', confirm_password: '' });
                  setShowPwModal(false);
                } else {
                  let msg = 'Current password is incorrect.';
                  if (d) {
                    if (d.confirm_password) {
                      msg = Array.isArray(d.confirm_password) ? d.confirm_password.join(' ') : String(d.confirm_password);
                    } else if (d.new_password) {
                      msg = Array.isArray(d.new_password) ? d.new_password.join(' ') : String(d.new_password);
                    } else if (d.old_password) {
                      const raw = Array.isArray(d.old_password) ? d.old_password.join(' ') : String(d.old_password);
                      msg = (raw.toLowerCase().includes('incorrect') || raw.toLowerCase().includes('wrong') || raw.toLowerCase().includes('current')) ? 'Current password is incorrect.' : raw;
                    } else if (d.non_field_errors) {
                      msg = Array.isArray(d.non_field_errors) ? d.non_field_errors.join(' ') : String(d.non_field_errors);
                    } else if (d.detail) {
                      const dt = String(d.detail);
                      msg = (dt.toLowerCase().includes('incorrect') || dt.toLowerCase().includes('wrong')) ? 'Current password is incorrect.' : dt;
                    } else if (d.error) {
                      const er = String(d.error);
                      msg = (er.toLowerCase().includes('incorrect') || er.toLowerCase().includes('wrong')) ? 'Current password is incorrect.' : er;
                    }
                  }
                  setPwModalError(msg);
                }
              } catch (err) {
                console.error('Password change error:', err);
                setPwModalError('Current password is incorrect.');
              }
              finally { setActionLoading(false); }
            }}>
              {pwModalError && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxSizing: 'border-box'
                }}>
                  <FiAlertTriangle style={{ flexShrink: 0, color: '#ef4444', fontSize: '1rem' }} />
                  <span style={{ lineHeight: 1.4 }}>{pwModalError}</span>
                </div>
              )}
              <div className="sd-form-group">
                <label className="sd-form-label">Current Password</label>
                <input className="sd-form-input" type="password"
                  value={pwForm.current_password}
                  onChange={e => { setPwForm({ ...pwForm, current_password: e.target.value }); setPwModalError(''); }}
                  placeholder="Enter current password" required/>
              </div>
              <div className="sd-form-group">
                <label className="sd-form-label">New Password</label>
                <input className="sd-form-input" type="password"
                  value={pwForm.new_password}
                  onChange={e => { setPwForm({ ...pwForm, new_password: e.target.value }); setPwModalError(''); }}
                  placeholder="Minimum 6 characters" required minLength={6}/>
              </div>
              <div className="sd-form-group">
                <label className="sd-form-label">Confirm Password</label>
                <input className="sd-form-input" type="password"
                  value={pwForm.confirm_password}
                  onChange={e => { setPwForm({ ...pwForm, confirm_password: e.target.value }); setPwModalError(''); }}
                  placeholder="Confirm new password" required minLength={6}/>
              </div>
              <div className="sd-modal-footer">
                <button type="button" className="sd-btn-cancel" onClick={() => setShowPwModal(false)}>Cancel</button>
                <button type="submit" className="sd-btn-save" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Centered Blurred Delete Confirmation Modal ── */}
      {deleteConfirm.show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setDeleteConfirm({ show: false, id: null, type: '' })}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem 1.5rem',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
              textAlign: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Delete Symbol */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '1.5rem'
              }}
            >
              <FiTrash2 />
            </div>

            {/* Title & Warning */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
              Are you sure?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to delete {deleteConfirm.isBulk ? `${deleteConfirm.count} selected ${deleteConfirm.type}` : `this ${deleteConfirm.type}`}? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
                onClick={() => setDeleteConfirm({ show: false, id: null, type: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
                onClick={confirmDeleteAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherDashboard;
