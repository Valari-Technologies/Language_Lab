import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiUsers, FiBookOpen, FiBarChart2, FiUser,
  FiSettings, FiHelpCircle, FiLogOut, FiSearch,
  FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiCalendar, FiBell, FiFilter,
  FiCheckCircle, FiMonitor, FiSmartphone, FiFileText,
  FiActivity, FiTrendingUp, FiClock, FiAward,
  FiChevronLeft, FiChevronRight, FiLock, FiArrowRight, FiDownload
} from 'react-icons/fi';
import './SchoolDashboard.css';
import { apiFetch } from './api';
import teacherHeaderBanner from './assets/teacher_header_banner.png';
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
  const [searchQuery, setSearchQuery]     = useState('');

  /* ── Pagination ── */
  const [studentPage,  setStudentPage]  = useState(1);
  const [classPage,    setClassPage]    = useState(1);
  const PER_PAGE = 4;

  /* ── Modals ── */
  const [showModal,   setShowModal]   = useState(false);
  const [modalType,   setModalType]   = useState('add');
  const [editingId,   setEditingId]   = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);

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
    full_name: user?.full_name || '', current_password: '', password: ''
  });

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

  useEffect(() => { loadAllData(); }, []);

  /* ── Feedback ── */
  const showFeedback = (success, error) => {
    if (success) { setSuccessMsg(success); setTimeout(() => setSuccessMsg(''), 4000); }
    if (error)   { setErrorMsg(error);   setTimeout(() => setErrorMsg(''),   4000); }
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
        const errorData = await res.json();
        setErrorMsg(errorData.message || 'Action failed. Please check inputs.');
      }
    } catch { setErrorMsg('Network error occurred.'); }
    finally { setActionLoading(false); }
  };

  /* ── Delete ── */
  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const res = await apiFetch(`/api/cms/v1/${type}s/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        showFeedback(`${type} deleted successfully!`, null);
        if (type === 'student') loadStudents();
        else if (type === 'class') loadClasses();
      } else { showFeedback(null, 'Delete failed.'); }
    } catch { showFeedback(null, 'Network error.'); }
  };

  /* ── Profile update ── */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/users/profile/', {
        method: 'PUT',
        body: JSON.stringify({ full_name: profileForm.full_name, email: profileForm.email })
      });
      if (res.ok) showFeedback('Profile updated successfully!', null);
      else showFeedback(null, 'Failed to update profile.');
    } catch { showFeedback(null, 'Network error.'); }
    finally { setActionLoading(false); }
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
        .sd-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
          z-index: 5;
        }
        .sd-footer-link {
          color: rgba(255, 255, 255, 0.7) !important;
          padding: 0.75rem 1rem !important;
          font-size: 0.9rem !important;
        }
        .sd-footer-link svg {
          color: rgba(255, 255, 255, 0.7) !important;
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
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
          background: rgba(255, 255, 255, 0.01) !important;
          padding: 1.1rem 1.25rem !important;
          z-index: 5;
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
        <div className="sd-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img src={logoIcon} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
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

        {/* Footer links */}
        <div className="sd-footer">
          <button className="sd-footer-link danger" onClick={onLogout}><FiLogOut/><span>Logout</span></button>
        </div>

        {/* User card */}
        <div className="sd-user-card">
          <div className="sd-user-avatar">
            {(user?.username || 'TE').slice(0, 2).toUpperCase()}
          </div>
          <div className="sd-user-meta">
            <div className="sd-user-name">{profileForm.full_name || user?.username || 'Teacher'}</div>
            <div className="sd-user-role">Teacher</div>
          </div>
          <FiChevronDown className="sd-user-chevron"/>
        </div>
      </aside>

      {/* ═════════════════
          MAIN
          ═════════════════ */}
      <main className="sd-main">

        {/* ── Top Bar ── */}
        <div className="sd-topbar">
          <div className="sd-search">
            <FiSearch/>
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {activeSubTab === 'overview' ? (
            <div className="sd-topbar-right">
              <button className="sd-year-badge"><FiCalendar/>2024 · 2025<FiChevronDown/></button>
              <button className="sd-icon-btn"><FiSettings/></button>
              <button className="sd-icon-btn"><FiBell/></button>
            </div>
          ) : (
            <div className="sd-topbar-right">
              <button className="sd-notif-btn"><FiBell/>Notification</button>
              <button className="sd-notif-btn"><FiHelpCircle/>Support</button>
            </div>
          )}
        </div>

        {/* ── Page Content ── */}
        <div className={`sd-content${activeSubTab === 'overview' ? ' sd-content--dashboard' : ''}`}>

          {/* Alerts */}
          {successMsg && <div className="sd-alert sd-alert-success"><FiCheckCircle/>{successMsg}</div>}
          {errorMsg   && <div className="sd-alert sd-alert-error"><FiX/>{errorMsg}</div>}

          {/* ══════════ OVERVIEW / DASHBOARD ══════════ */}
          {activeSubTab === 'overview' && (
            <>
              {/* Premium Dashboard Header Card with Background Image */}
              <div className="sd-dashboard-header-card" style={{ backgroundImage: `url(${teacherHeaderBanner})` }}>
                <div className="sd-header-text-section">
                  <h1>Welcome back, Teacher 01!</h1>
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
                    <button className="sd-btn-filter"><FiFilter/>Filters</button>
                    <button className="sd-btn-primary" onClick={openAddModal}><FiPlus/>Add Student</button>
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Full Name</th>
                        <th>Username</th>
                        <th>Email Address</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(students), studentPage).map((s, i) => (
                        <tr key={s.id || i}>
                          <td>
                            <span className="sd-name-cell-primary">{s.full_name || 'N/A'}</span>
                          </td>
                          <td>{s.username}</td>
                          <td>{s.email || <span style={{ color:'#9ca3af', fontStyle:'italic' }}>Not provided</span>}</td>
                          <td>
                            <span className={`sd-badge ${s.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                              {s.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit"   onClick={() => openEditModal(s)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => handleDelete(s.id, 'student')} title="Delete"><FiTrash2/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterList(students).length === 0 && (
                        <tr><td colSpan="5" className="sd-empty-state">No students found.</td></tr>
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
                    <button className="sd-btn-filter"><FiFilter/>Filters</button>
                    <button className="sd-btn-primary" onClick={openAddModal}><FiPlus/>Add Class</button>
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Grade Level</th>
                        <th>School</th>
                        <th>Academic Year</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(classes), classPage).map((c, i) => (
                        <tr key={c.id || i}>
                          <td>
                            <span className="sd-name-cell-primary">{c.class_name}</span>
                          </td>
                          <td>{grades.find(g => g.id === c.grade)?.grade_name || c.grade || 'N/A'}</td>
                          <td>{schools.find(s => s.school_id === c.school)?.school_name || c.school || 'N/A'}</td>
                          <td>{c.academic_year}</td>
                          <td>
                            <span className={`sd-badge ${c.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                              {c.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit"   onClick={() => openEditModal(c)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => handleDelete(c.id, 'class')} title="Delete"><FiTrash2/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterList(classes).length === 0 && (
                        <tr><td colSpan="6" className="sd-empty-state">No classes found.</td></tr>
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
                    <span className="sd-verified-badge"><FiCheckCircle/>Verified Teacher</span>
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
                  </div>

                  {/* Change password row */}
                  <div className="sd-pw-row">
                    <div>
                      <div className="sd-pw-row-title">Change Password</div>
                      <div className="sd-pw-row-sub">Update your password to stay secure</div>
                    </div>
                    <button type="button" className="sd-btn-outline" onClick={() => setShowPwModal(true)}>Update</button>
                  </div>

                  {/* Recent Login Activity */}
                  <div className="sd-login-activity-section">
                    <div className="sd-login-activity-title">Recent Login Activity</div>
                    <div className="sd-login-item">
                      <div className="sd-login-icon"><FiMonitor/></div>
                      <div className="sd-login-details">
                        <div className="sd-login-device">Chrome on MacOS • New York, USA</div>
                        <div className="sd-login-time">Today, 10:45 AM</div>
                      </div>
                    </div>
                    <div className="sd-login-item">
                      <div className="sd-login-icon"><FiSmartphone/></div>
                      <div className="sd-login-details">
                        <div className="sd-login-device">iPhone 14 Pro • New York, USA</div>
                        <div className="sd-login-time">Yesterday, 08:22 PM</div>
                      </div>
                    </div>
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
              setActionLoading(true);
              try {
                const res = await apiFetch('/api/users/change-password/', {
                  method: 'POST',
                  body: JSON.stringify({ old_password: profileForm.current_password, new_password: profileForm.password })
                });
                if (res.ok) {
                  showFeedback('Password changed successfully!', null);
                  setProfileForm(p => ({ ...p, current_password: '', password: '' }));
                  setShowPwModal(false);
                } else {
                  const d = await res.json();
                  showFeedback(null, d.error || 'Password change failed.');
                }
              } catch { showFeedback(null, 'Network error.'); }
              finally { setActionLoading(false); }
            }}>
              <div className="sd-form-group">
                <label className="sd-form-label">Current Password</label>
                <input className="sd-form-input" type="password" value={profileForm.current_password}
                  onChange={e => setProfileForm({ ...profileForm, current_password: e.target.value })}
                  placeholder="Enter current password" required/>
              </div>
              <div className="sd-form-group">
                <label className="sd-form-label">New Password</label>
                <input className="sd-form-input" type="password" value={profileForm.password}
                  onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                  placeholder="Minimum 6 characters" required minLength={6}/>
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

    </div>
  );
};

export default TeacherDashboard;
