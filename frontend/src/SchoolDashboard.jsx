import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiUsers, FiBookOpen, FiBarChart2, FiUser,
  FiSettings, FiHelpCircle, FiLogOut, FiSearch,
  FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiCalendar, FiBell, FiFilter,
  FiCheckCircle, FiMonitor, FiSmartphone, FiFileText,
  FiActivity, FiTrendingUp, FiAward, FiLock, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import './SchoolDashboard.css';
import { apiFetch } from './api';

/* ─── Static chart data (reference-matched visual) ─── */
const CHART_MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
const CHART_LINES = [
  { label: 'Weekly',    color: '#6366f1', points: [40,55,45,70,60,80] },
  { label: 'Monthly',   color: '#22c55e', points: [30,40,55,45,65,55] },
  { label: 'Ability',   color: '#f97316', points: [55,35,60,50,40,70] },
  { label: 'Authority', color: '#a78bfa', points: [25,45,35,60,50,45] },
];
const TEACHER_ACTIVITY = [
  { id:1, name:'John Doe',      color:'#6366f1', desc:'Completed lesson on "Tenses"',    time:'10:32 AM' },
  { id:2, name:'Sarah Smith',   color:'#22c55e', desc:'Updated new Table M',              time:'10:18 AM' },
  { id:3, name:'Michael Brown', color:'#f97316', desc:'Completed a cooking fest',         time:'Yesterday' },
  { id:4, name:'Jessica White', color:'#a78bfa', desc:'Marked assignments',               time:'2 hours ago' },
];

/* ─── SVG Donut helper ─── */
const DonutChart = ({ pct = 68 }) => {
  const R = 46; const CX = 60; const CY = 60;
  const circ = 2 * Math.PI * R;
  const filled = (pct / 100) * circ;
  return (
    <svg viewBox="0 0 120 120" width="130" height="130" className="sd-donut-svg">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e8edf5" strokeWidth="12"/>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#6366f1" strokeWidth="12"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={CX} y={CY - 5} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 14, fontWeight: 700, fill: '#0f172a', fontFamily: 'Outfit,Inter,sans-serif' }}>
        {pct}%
      </text>
      <text x={CX} y={CY + 12} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 8, fill: '#6b7280', fontFamily: 'Outfit,Inter,sans-serif' }}>
        Completed
      </text>
    </svg>
  );
};

/* ─── SVG Line Chart helper ─── */
const LineChart = ({ lines = CHART_LINES }) => {
  const W = 400; const H = 120;
  const PAD = { top: 10, right: 8, bottom: 10, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const pts = 6;
  const toX = (i) => PAD.left + (i / (pts - 1)) * chartW;
  const toY = (v) => PAD.top + chartH - (v / 100) * chartH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="140" preserveAspectRatio="none" className="sd-chart-svg">
      {/* grid lines */}
      {[25,50,75].map(v => (
        <line key={v} x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
          stroke="#f3f4f6" strokeWidth="1"/>
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

/* ─── Pagination helper ─── */
const Pagination = ({ total, perPage = 4, page, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const items = [];
  if (pages <= 5) {
    for (let i = 1; i <= pages; i++) items.push(i);
  } else {
    items.push(1, 2, 3, '...', pages);
  }
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);
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

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const SchoolDashboard = ({ user, onLogout }) => {
  /* ── Navigation ── */
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ── UI ── */
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Pagination ── */
  const [teacherPage, setTeacherPage]   = useState(1);
  const [studentPage, setStudentPage]   = useState(1);
  const [classPage,   setClassPage]     = useState(1);
  const [experiencePage,setExperiencePage]  = useState(1);
  const PER_PAGE = 4;

  /* ── Bulk Upload ── */
  const [importActive, setImportActive]   = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);

  /* ── Modals ── */
  const [showModal,   setShowModal]   = useState(false);
  const [modalType,   setModalType]   = useState('add');
  const [editingId,   setEditingId]   = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: null });

  /* ── Data ── */
  const [dashboardData,  setDashboardData]  = useState(null);
  const [teachers,       setTeachers]       = useState([]);
  const [students,       setStudents]       = useState([]);
  const [classes,        setClasses]        = useState([]);
  const [experiences,      setExperiences]      = useState([]);
  const [schools,        setSchools]        = useState([]);
  const [grades,         setGrades]         = useState([]);

  /* ── Reports ── */
  const [overviewReport,          setOverviewReport]          = useState(null);
  const [experiencesReport,         setExperiencesReport]         = useState([]);
  const [classesReport,           setClassesReport]           = useState([]);
  const [studentsReport,          setStudentsReport]          = useState([]);
  const [studentCompletionReport, setStudentCompletionReport] = useState([]);

  /* ── Detail modals ── */
  const [selectedExperienceDetail, setSelectedExperienceDetail] = useState(null);
  const [selectedClassDetail,    setSelectedClassDetail]    = useState(null);
  const [selectedStudentDetail,  setSelectedStudentDetail]  = useState(null);
  const [showExperienceDetailModal, setShowExperienceDetailModal] = useState(false);
  const [showClassDetailModal,    setShowClassDetailModal]    = useState(false);
  const [showStudentDetailModal,  setShowStudentDetailModal]  = useState(false);

  /* ── Forms ── */
  const [teacherForm, setTeacherForm] = useState({
    username:'', password:'', email:'', full_name:'', is_active:true, school:'', qualification:'', experience_years:0, assigned_class_ids: []
  });
  const [studentForm, setStudentForm] = useState({
    username:'', password:'', email:'', full_name:'', is_active:true
  });
  const [classForm, setClassForm] = useState({
    class_name:'', school:'', grade:'', academic_year: new Date().getFullYear().toString(), is_active:true, assigned_teacher_ids: []
  });
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '', email: user?.email || '', full_name: user?.full_name || '',
    current_password:'', password:''
  });

  /* ══════════════════════════════════
     DATA LOADERS (unchanged from original)
     ══════════════════════════════════ */
  const loadDashboardData = async () => {
    try {
      const res = await apiFetch('/api/school/dashboard/');
      if (res.ok) setDashboardData(await res.json());
    } catch (e) { console.error('Failed to load school dashboard data.', e); }
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

  const loadTeachers = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/teachers/');
      if (res.ok) { const d = await res.json(); setTeachers(d.results || d); }
    } catch (e) { console.error('Failed to load teachers.', e); }
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

  const loadExperiences = async () => {
    try {
      const res = await apiFetch('/api/v1/content/experiences/');
      if (res.ok) { const d = await res.json(); setExperiences(d.results || d); }
    } catch (e) { console.error('Failed to load experiences.', e); }
  };

  const loadStudentCompletionReport = async () => {
    try {
      const res = await apiFetch('/api/v1/reports/student-completion/');
      if (res.ok) {
        const d = await res.json();
        setStudentCompletionReport(d.results || d);
      }
    } catch (e) { console.error('Failed to load student completion report', e); }
  };

  const loadReportsData = async () => {
    try {
      const [overRes, scenRes, classRes, studRes] = await Promise.all([
        apiFetch('/api/v1/reports/overview/'),
        apiFetch('/api/v1/reports/experiences/'),
        apiFetch('/api/v1/reports/classes/'),
        apiFetch('/api/v1/reports/students/')
      ]);
      if (overRes.ok)  setOverviewReport(await overRes.json());
      if (scenRes.ok)  setExperiencesReport(await scenRes.json());
      if (classRes.ok) setClassesReport(await classRes.json());
      if (studRes.ok)  setStudentsReport(await studRes.json());
    } catch (e) { console.error('Failed to load reports data', e); }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([
        loadDashboardData(), loadSchools(), loadGrades(),
        loadTeachers(), loadStudents(), loadClasses(),
        loadExperiences(), loadReportsData(), loadStudentCompletionReport()
      ]);
    } catch (e) { setErrorMsg('Error loading dashboard data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAllData(); }, []);

  /* ── Feedback helpers ── */
  const showFeedback = (success, error) => {
    if (success) { setSuccessMsg(success); setTimeout(() => setSuccessMsg(''), 4000); }
    if (error)   { setErrorMsg(error);   setTimeout(() => setErrorMsg(''),   4000); }
  };

  /* ── Init forms ── */
  const initForm = (tab, entity = null) => {
    setErrorMsg('');
    if (tab === 'teachers') {
      setTeacherForm(entity ? {
        username: entity.username || '', password: '',
        email: entity.email || '', full_name: entity.full_name || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true,
        school: entity.school || (schools[0]?.school_id || ''),
        qualification: entity.qualification || '',
        experience_years: entity.experience_years || 0,
        assigned_class_ids: entity.assigned_class_ids || []
      } : { username:'', password:'', email:'', full_name:'', is_active:true,
            school: schools[0]?.school_id || '', qualification:'', experience_years:0, assigned_class_ids: [] });
    } else if (tab === 'students') {
      setStudentForm(entity ? {
        username: entity.username || '', password: '', email: entity.email || '',
        full_name: entity.full_name || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : { username:'', password:'', email:'', full_name:'', is_active:true });
    } else if (tab === 'classes') {
      setClassForm(entity ? {
        class_name: entity.class_name || '',
        school: entity.school || (schools[0]?.school_id || ''),
        grade: entity.grade || (grades[0]?.id || ''),
        academic_year: entity.academic_year || new Date().getFullYear().toString(),
        is_active: entity.is_active !== undefined ? entity.is_active : true,
        assigned_teacher_ids: entity.assigned_teacher_ids || []
      } : {
        class_name:'', school: schools[0]?.school_id || '',
        grade: grades[0]?.id || '', academic_year: new Date().getFullYear().toString(), is_active:true,
        assigned_teacher_ids: []
      });
    }
  };

  const handleOpenAdd = () => { setModalType('add'); setEditingId(null); initForm(activeSubTab); setShowModal(true); };
  const handleOpenEdit = (entity) => {
    setModalType('edit');
    setEditingId(entity.student_id || entity.teacher_id || entity.class_id || entity.id);
    initForm(activeSubTab, entity);
    setShowModal(true);
  };

  /* ── CRUD Submit ── */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setActionLoading(true);
    let body = {};
    let url = `/api/cms/v1/${activeSubTab}/`;
    if (modalType === 'edit') url += `${editingId}/`;

    try {
      if (activeSubTab === 'teachers') {
        body = { ...teacherForm, school: parseInt(teacherForm.school), experience_years: parseInt(teacherForm.experience_years) || 0 };
        if (modalType === 'edit' && !body.password) delete body.password;
      } else if (activeSubTab === 'students') {
        body = { ...studentForm };
        if (modalType === 'edit' && !body.password) delete body.password;
      } else if (activeSubTab === 'classes') {
        body = { ...classForm, school: parseInt(classForm.school), grade: parseInt(classForm.grade) };
      }

      const method = modalType === 'add' ? 'POST' : 'PUT';
      const res = await apiFetch(url, { method, body: JSON.stringify(body) });
      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Operation successful', null);
        setShowModal(false);
        if (activeSubTab === 'teachers') await loadTeachers();
        else if (activeSubTab === 'students') await loadStudents();
        else if (activeSubTab === 'classes') await loadClasses();
        await loadDashboardData();
      } else {
        if (resData && typeof resData === 'object') {
          const errs = Object.entries(resData).map(([k, v]) => {
            const field = k.charAt(0).toUpperCase() + k.slice(1);
            const msg = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
            return `${field}: ${msg}`;
          });
          setErrorMsg(errs.join(' | ') || 'Operation failed.');
        } else {
          setErrorMsg(resData.message || 'Operation failed.');
        }
      }
    } catch (err) {
      setErrorMsg('Failed to process request. Check connections.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg('');
    setSuccessMsg('');
    setUploadSummary(null);
    setActionLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_type', activeSubTab === 'teachers' ? 'teacher' : 'student');

    try {
      const res = await apiFetch('/api/cms/v1/bulk-upload/', {
        method: 'POST',
        body: formData
      });
      const resData = await res.json();
      if (res.ok) {
        setUploadSummary(resData);
        if (resData.created > 0) {
          showFeedback(`Ingested ${resData.created} record(s) successfully.`, null);
          if (activeSubTab === 'teachers') await loadTeachers();
          else if (activeSubTab === 'students') await loadStudents();
          await loadDashboardData();
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

  /* ── Delete ── */
  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, id, type: activeSubTab.slice(0, -1) });
  };

  const confirmDeleteAction = async () => {
    const { id, type } = deleteConfirm;
    if (!id || !type) return;
    setActionLoading(true);
    setErrorMsg('');
    const url = `/api/cms/v1/${activeSubTab}/${id}/`;
    try {
      const res = await apiFetch(url, { method: 'DELETE' });
      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Deleted successfully', null);
        setDeleteConfirm({ show: false, id: null, type: null });
        if (activeSubTab === 'teachers') await loadTeachers();
        else if (activeSubTab === 'students') await loadStudents();
        else if (activeSubTab === 'classes') await loadClasses();
        await loadDashboardData();
      } else {
        setErrorMsg(resData.message || 'Delete operation failed.');
        setDeleteConfirm({ show: false, id: null, type: null });
      }
    } catch (err) {
      setErrorMsg('Connection error.');
      setDeleteConfirm({ show: false, id: null, type: null });
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Reports detail ── */
  const handleFetchExperienceDetail = async (experience_ref) => {
    try {
      const res = await apiFetch(`/api/v1/reports/experiences/${experience_ref}/`);
      if (res.ok) { setSelectedExperienceDetail(await res.json()); setShowExperienceDetailModal(true); }
    } catch (e) { console.error(e); }
  };
  const handleFetchClassDetail = async (class_id) => {
    try {
      const res = await apiFetch(`/api/v1/reports/classes/${class_id}/`);
      if (res.ok) { setSelectedClassDetail(await res.json()); setShowClassDetailModal(true); }
    } catch (e) { console.error(e); }
  };
  const handleFetchStudentDetail = async (student_id) => {
    try {
      const res = await apiFetch(`/api/v1/reports/students/${student_id}/`);
      if (res.ok) { setSelectedStudentDetail(await res.json()); setShowStudentDetailModal(true); }
    } catch (e) { console.error(e); }
  };
  const handleExportCSV = async (type) => {
    try {
      const res = await apiFetch(`/api/v1/reports/export/?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `report_${type}_export.csv`;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
      } else { alert('Failed to export CSV.'); }
    } catch (e) { console.error(e); }
  };

  /* ── Announcement ── */
  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    const input = e.target.elements.announcementMsg;
    if (!input || !input.value.trim()) return;
    const newAnn = { id: Date.now(), title: input.value, date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) };
    setDashboardData(prev => ({ ...prev, announcements: [newAnn, ...prev.announcements] }));
    input.value = '';
    showFeedback('Announcement broadcasted!', null);
  };

  /* ── Profile update ── */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setActionLoading(true);
    try {
      const profRes = await apiFetch('/api/users/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: profileForm.full_name, email: profileForm.email })
      });
      const profData = await profRes.json();
      if (!profRes.ok) { setErrorMsg(profData.message || 'Profile update failed.'); setActionLoading(false); return; }
      if (profileForm.password) {
        if (!profileForm.current_password) { setErrorMsg('Current password is required.'); setActionLoading(false); return; }
        const pwRes = await apiFetch('/api/users/change-password/', {
          method: 'POST',
          body: JSON.stringify({ old_password: profileForm.current_password, new_password: profileForm.password })
        });
        const pwData = await pwRes.json();
        if (!pwRes.ok) { setErrorMsg(typeof pwData === 'object' ? JSON.stringify(pwData) : 'Password change failed.'); setActionLoading(false); return; }
      }
      setProfileForm(prev => ({ ...prev, current_password:'', password:'' }));
      showFeedback('Profile updated successfully', null);
    } catch (err) { setErrorMsg('Connection error.'); }
    finally { setActionLoading(false); }
  };

  /* ── Filter helpers ── */
  const filterList = (list) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item =>
      (item.full_name || item.username || item.class_name || item.title || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.qualification || '').toLowerCase().includes(q)
    );
  };

  const paginate = (list, page) => list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ── Stat values (from real API or fallbacks) ── */
  const statTeachers  = teachers.length;
  const statStudents  = students.length;
  const statClasses   = classes.length;
  const statExperiences = experiences.length;
  const statSchools   = schools.length;
  const statAttend    = dashboardData?.monthly_engagement_rate || '—';

  /* ── Nav helper ── */
  const goTo = (tab) => {
    setActiveSubTab(tab);
    setSearchQuery('');
    setIsSidebarOpen(false);
    setTeacherPage(1);
    setStudentPage(1);
    setClassPage(1);
    setExperiencePage(1);
    setImportActive(false);
    setUploadSummary(null);
  };

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh',
        background:'linear-gradient(135deg,#0b1437 0%,#1a2c7a 100%)', flexDirection:'column', gap:'1rem' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid rgba(99,102,241,0.3)',
          borderTopColor:'#6366f1', animation:'spin 0.8s linear infinite' }}/>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.9rem', fontFamily:'Outfit,sans-serif' }}>
          Loading LinguaLab...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════ */
  return (
    <div className="sd-layout">

      {/* ── Mobile top bar ── */}
      <header className="sd-mobile-header">
        <button className="sd-hamburger" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu"><FiMenu/></button>
        <span className="sd-mobile-brand">LinguaLab</span>
        <div style={{ width:34 }}/>
      </header>

      {/* ── Sidebar backdrop (mobile) ── */}
      <div className={`sd-sidebar-backdrop${isSidebarOpen ? ' open' : ''}`} onClick={() => setIsSidebarOpen(false)}/>

      {/* ════════════════════════
          SIDEBAR
          ════════════════════════ */}
      <aside className={`sd-sidebar${isSidebarOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div className="sd-brand">
          <div className="sd-brand-name">LinguaLab</div>
          <div className="sd-brand-sub">School Admin Portal</div>
        </div>

        {/* Nav */}
        <nav className="sd-nav">
          <button className={`sd-nav-item${activeSubTab==='overview' ? ' active' : ''}`} onClick={() => goTo('overview')}>
            <FiGrid/><span>Dashboard</span>
          </button>
          <button className={`sd-nav-item${activeSubTab==='teachers' ? ' active' : ''}`} onClick={() => goTo('teachers')}>
            <FiUsers/><span>Teachers</span>
          </button>
          <button className={`sd-nav-item${activeSubTab==='students' ? ' active' : ''}`} onClick={() => goTo('students')}>
            <FiUsers/><span>Students</span>
          </button>
          <button className={`sd-nav-item${activeSubTab==='classes' ? ' active' : ''}`} onClick={() => goTo('classes')}>
            <FiBookOpen/><span>Classes</span>
          </button>
          <button className={`sd-nav-item${activeSubTab==='experiences' ? ' active' : ''}`} onClick={() => goTo('experiences')}>
            <FiFileText/><span>Experiences</span>
          </button>
          <button className={`sd-nav-item${activeSubTab==='reports' ? ' active' : ''}`} onClick={() => goTo('reports')}>
            <FiBarChart2/><span>Reports</span>
          </button>
          <button className={`sd-nav-item${activeSubTab==='profile' ? ' active' : ''}`} onClick={() => goTo('profile')}>
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
            {(user?.username || 'SA').slice(0, 2).toUpperCase()}
          </div>
          <div className="sd-user-meta">
            <div className="sd-user-name">{profileForm.full_name || user?.username || 'Institute Name'}</div>
            <div className="sd-user-role">Location</div>
          </div>
          <FiChevronDown className="sd-user-chevron"/>
        </div>
      </aside>

      {/* ════════════════════════
          MAIN
          ════════════════════════ */}
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

          {/* ══════════ OVERVIEW / DASHBOARD TAB ══════════ */}
          {activeSubTab === 'overview' && (
            <>
              {/* Page header */}
              <div className="sd-page-header">
                <h1 className="sd-page-title">Schools</h1>
                <p className="sd-page-sub">Manage your Institute profile, contact information, courses, and academic details from one centralized dashboard.</p>
              </div>

              {/* Stat cards */}
              <div className="sd-stat-row">
                {[
                  { label:'Total School',        value: statSchools,   color:'#22c55e', bg:'#dcfce7', icon:<FiGrid/>,       trend:'+4%' },
                  { label:'Total Teachers',      value: statTeachers,  color:'#3b82f6', bg:'#dbeafe', icon:<FiUsers/>,      trend:'+8%' },
                  { label:'Total Students',      value: statStudents,  color:'#a855f7', bg:'#f3e8ff', icon:<FiUsers/>,      trend:'+86%' },
                  { label:'Active Batches',      value: statClasses,   color:'#10b981', bg:'#d1fae5', icon:<FiActivity/>,   trend:'+6%' },
                  { label:'Total Courses',       value: statExperiences, color:'#f97316', bg:'#ffedd5', icon:<FiBookOpen/>,   trend:'+8%' },
                  { label:'Average Attendance',  value: statAttend,    color:'#06b6d4', bg:'#cffafe', icon:<FiTrendingUp/>, trend:'+5%' },
                ].map((s, i) => (
                  <div className="sd-stat-card" key={i}>
                    <div className="sd-stat-icon-row">
                      <div className="sd-stat-icon" style={{ background: s.bg, color: s.color }}>
                        {s.icon}
                      </div>
                    </div>
                    <div className="sd-stat-value">{s.value}</div>
                    <div className="sd-stat-label">{s.label}</div>
                    <span className="sd-stat-trend">{s.trend}</span>
                  </div>
                ))}
              </div>

              {/* Course Completion card */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <div>
                    <div className="sd-card-title">Course Completion</div>
                    <div className="sd-card-sub">Course Progress</div>
                  </div>
                  <span className="sd-card-meta">This Month</span>
                </div>
                <div className="sd-completion-grid">
                  <div className="sd-donut-wrap">
                    <DonutChart pct={68}/>
                  </div>
                  <div className="sd-legend">
                    {[
                      { label:'Completed',   color:'#6366f1', pct:'86%' },
                      { label:'In Progress', color:'#22c55e', pct:'22%' },
                      { label:'Not Started', color:'#cbd5e1', pct:'10%' },
                    ].map(l => (
                      <div className="sd-legend-row" key={l.label}>
                        <div className="sd-legend-dot-label">
                          <div className="sd-legend-dot" style={{ background: l.color }}/>
                          {l.label}
                        </div>
                        <span className="sd-legend-pct">{l.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom two-col grid */}
              <div className="sd-bottom-grid">
                {/* Student Performance */}
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div>
                      <div className="sd-card-title">Student Performance</div>
                      <div className="sd-card-sub">Active Users</div>
                    </div>
                    <span className="sd-card-meta">This Month</span>
                  </div>
                  <div className="sd-chart-legend">
                    {CHART_LINES.map(l => (
                      <div className="sd-chart-legend-item" key={l.label}>
                        <div className="sd-chart-legend-dot" style={{ background: l.color }}/>
                        {l.label}
                      </div>
                    ))}
                  </div>
                  <div className="sd-chart-wrap">
                    <LineChart lines={CHART_LINES}/>
                  </div>
                  <div className="sd-x-labels">
                    {CHART_MONTHS.map(m => <span className="sd-x-label" key={m}>{m}</span>)}
                  </div>
                </div>

                {/* Teacher Activity */}
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div className="sd-card-title">Teacher Activity</div>
                    <button className="sd-view-all" onClick={() => goTo('teachers')}>View All</button>
                  </div>
                  <div className="sd-activity-list">
                    {(dashboardData?.recent_activities?.length
                      ? dashboardData.recent_activities.slice(0, 4).map((act, i) => ({
                          id: act.id || i,
                          name: act.teacher_name || act.activity?.split(' ')[0] || 'Teacher',
                          color: TEACHER_ACTIVITY[i % TEACHER_ACTIVITY.length].color,
                          desc: act.activity || '',
                          time: act.time || ''
                        }))
                      : TEACHER_ACTIVITY
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
            </>
          )}

          {/* ══════════ TEACHERS TAB ══════════ */}
          {activeSubTab === 'teachers' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Teachers Management</h1>
              </div>
              <div className="sd-card" style={{ padding:'1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div className="sd-table-search">
                    <FiSearch/>
                    <input
                      type="text"
                      placeholder="Search teachers..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setTeacherPage(1); }}
                    />
                  </div>
                  <div className="sd-table-actions">
                    <button className="sd-btn-filter"><FiFilter/>Filters</button>
                    <button className="sd-btn-outline" onClick={() => { setImportActive(!importActive); setUploadSummary(null); }}>
                      Excel Import
                    </button>
                    <button className="sd-btn-primary" onClick={handleOpenAdd}><FiPlus/>Add Teacher</button>
                  </div>
                </div>

                {importActive && (
                  <div className="sd-import-panel" style={{
                    border: '2px dashed #6366f1',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    background: '#f8fafc',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Bulk Excel Upload</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: '#64748b' }}>
                      Upload a genuine <code>.xlsx</code> or <code>.xls</code> spreadsheet containing at least <code>username</code> and <code>password</code> columns.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleBulkUpload}
                        disabled={actionLoading}
                        style={{ display: 'none' }}
                        id="bulk-upload-teacher-input"
                      />
                      <label htmlFor="bulk-upload-teacher-input" className="sd-btn-primary" style={{ cursor: 'pointer' }}>
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
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Qualification</th>
                        <th>School</th>
                        <th>Assigned Classes</th>
                        <th>Status</th>
                        <th style={{ textAlign:'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(teachers), teacherPage).map((t, i) => (
                        <tr key={t.teacher_id || i}>
                          <td>
                            <span className="sd-name-cell-primary">{t.full_name || t.username || 'N/A'}</span>
                            <span className="sd-name-cell-email">{t.email}</span>
                          </td>
                          <td>{t.qualification || 'N/A'}</td>
                          <td>{t.school_name || '—'}</td>
                          <td>{t.assigned_classes || '—'}</td>
                          <td>
                            <span className={`sd-badge ${t.is_active ? 'sd-badge-active' : 'sd-badge-leave'}`}>
                              {t.is_active ? 'Active' : 'On Leave'}
                            </span>
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit" onClick={() => handleOpenEdit(t)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => handleDelete(t.teacher_id)} title="Delete"><FiTrash2/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterList(teachers).length === 0 && (
                        <tr><td colSpan="6" className="sd-empty-state">No teachers found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  total={filterList(teachers).length}
                  perPage={PER_PAGE}
                  page={teacherPage}
                  onPage={setTeacherPage}
                />
              </div>
            </>
          )}

          {/* ══════════ STUDENTS TAB ══════════ */}
          {activeSubTab === 'students' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Students Management</h1>
              </div>
              <div className="sd-card" style={{ padding:'1.25rem 1.5rem' }}>
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
                    <button className="sd-btn-outline" onClick={() => { setImportActive(!importActive); setUploadSummary(null); }}>
                      Excel Import
                    </button>
                    <button className="sd-btn-primary" onClick={handleOpenAdd}><FiPlus/>Add Student</button>
                  </div>
                </div>

                {importActive && (
                  <div className="sd-import-panel" style={{
                    border: '2px dashed #6366f1',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    background: '#f8fafc',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Bulk Excel Upload</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: '#64748b' }}>
                      Upload a genuine <code>.xlsx</code> or <code>.xls</code> spreadsheet containing at least <code>username</code> and <code>password</code> columns.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleBulkUpload}
                        disabled={actionLoading}
                        style={{ display: 'none' }}
                        id="bulk-upload-student-input"
                      />
                      <label htmlFor="bulk-upload-student-input" className="sd-btn-primary" style={{ cursor: 'pointer' }}>
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
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th style={{ textAlign:'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(students), studentPage).map((s, i) => (
                        <tr key={s.student_id || i}>
                          <td>
                            <span className="sd-name-cell-primary">{s.full_name || s.username || 'N/A'}</span>
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
                              <button className="sd-icon-action edit" onClick={() => handleOpenEdit(s)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => handleDelete(s.student_id)} title="Delete"><FiTrash2/></button>
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
                <Pagination
                  total={filterList(students).length}
                  perPage={PER_PAGE}
                  page={studentPage}
                  onPage={setStudentPage}
                />
              </div>
            </>
          )}

          {/* ══════════ CLASSES TAB ══════════ */}
          {activeSubTab === 'classes' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Manage Classes</h1>
              </div>
              <div className="sd-card" style={{ padding:'1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div className="sd-table-search">
                    <FiSearch/>
                    <input
                      type="text"
                      placeholder="Search Classes..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setClassPage(1); }}
                    />
                  </div>
                  <div className="sd-table-actions">
                    <button className="sd-btn-filter"><FiFilter/>Filters</button>
                    <button className="sd-btn-primary" onClick={handleOpenAdd}><FiPlus/>Add Class</button>
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Grade Level</th>
                        <th>Assigned Teachers</th>
                        <th>Academic Year</th>
                        <th style={{ textAlign:'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(classes), classPage).map((c, i) => (
                        <tr key={c.class_id || i}>
                          <td>
                            <span className="sd-name-cell-primary">{c.class_name}</span>
                            <span className="sd-name-cell-email">{c.school_name || ''}</span>
                          </td>
                          <td>{c.grade_name || 'N/A'}</td>
                          <td>{c.teacher_name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>}</td>
                          <td>{c.academic_year}</td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit" onClick={() => handleOpenEdit(c)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => handleDelete(c.class_id)} title="Delete"><FiTrash2/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterList(classes).length === 0 && (
                        <tr><td colSpan="5" className="sd-empty-state">No classes found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  total={filterList(classes).length}
                  perPage={PER_PAGE}
                  page={classPage}
                  onPage={setClassPage}
                />
              </div>
            </>
          )}

          {/* ══════════ EXPERIENCES TAB ══════════ */}
          {activeSubTab === 'experiences' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Manage Experience</h1>
              </div>
              <div className="sd-card" style={{ padding:'1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div className="sd-table-search">
                    <FiSearch/>
                    <input
                      type="text"
                      placeholder="Search experiences..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setExperiencePage(1); }}
                    />
                  </div>
                  <div className="sd-table-actions">
                    <button className="sd-btn-filter"><FiFilter/>Filters</button>
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Experience Title</th>
                        <th>Grade Level</th>
                        <th>Difficulty</th>
                        <th>Status</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(experiences), experiencePage).map((s, i) => (
                        <tr key={s.id || i}>
                          <td>
                            <span className="sd-name-cell-primary">{s.title}</span>
                            <span className="sd-name-cell-email">{s.description?.slice(0, 50) || ''}</span>
                          </td>
                          <td>{s.grade_name || (s.grade && `Grade ${s.grade}`) || 'N/A'}</td>
                          <td>
                            <span className={`sd-badge ${s.difficulty === 'EASY' ? 'sd-badge-active' : s.difficulty === 'HARD' ? 'sd-badge-leave' : 'sd-badge-review'}`}>
                              {s.difficulty || 'MEDIUM'}
                            </span>
                          </td>
                          <td>
                            <span className={`sd-badge ${s.status === 'PUBLISHED' ? 'sd-badge-published' : s.status === 'REVIEW' ? 'sd-badge-review' : 'sd-badge-draft'}`}>
                              {s.status || 'DRAFT'}
                            </span>
                          </td>
                          <td>{s.estimated_duration ? `${s.estimated_duration} min` : '—'}</td>
                        </tr>
                      ))}
                      {filterList(experiences).length === 0 && (
                        <tr><td colSpan="5" className="sd-empty-state">No experiences found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  total={filterList(experiences).length}
                  perPage={PER_PAGE}
                  page={experiencePage}
                  onPage={setExperiencePage}
                />
              </div>
            </>
          )}

          {/* ══════════ REPORTS TAB ══════════ */}
          {activeSubTab === 'reports' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Academic Performance &amp; Reports</h1>
                <p className="sd-page-sub">Overall assessment scores, average scores, student evaluations, and workload reports.</p>
              </div>
              {(!overviewReport || overviewReport.total_attempts === 0) ? (
                <div className="sd-card sd-reports-empty">
                  <FiFileText/>
                  <h3>No assessment data synced yet</h3>
                  <p>Data will appear here once the Electron LMS runs its monthly sync sequence.</p>
                </div>
              ) : (
                <>
                  {/* Metrics overview */}
                  <div className="sd-stat-row" style={{ gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    {[
                      { label:'Students Attempted', value: overviewReport.total_students,  color:'#0284c7', bg:'#e0f2fe', icon:<FiUsers/> },
                      { label:'Total Attempts',     value: overviewReport.total_attempts,   color:'#d97706', bg:'#fef3c7', icon:<FiActivity/> },
                      { label:'Completion Rate',    value: `${overviewReport.completion_rate}%`, color:'#16a34a', bg:'#dcfce7', icon:<FiCheckCircle/> },
                      { label:'Average Score',      value: `${overviewReport.average_score}%`,   color:'#7c3aed', bg:'#f3e8ff', icon:<FiAward/> },
                      { label:'Pass Rate',          value: `${overviewReport.pass_rate}%`,       color:'#0284c7', bg:'#e0f2fe', icon:<FiTrendingUp/> },
                    ].map((s, i) => (
                      <div className="sd-stat-card" key={i}>
                        <div className="sd-stat-icon-row">
                          <div className="sd-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        </div>
                        <div className="sd-stat-value">{s.value}</div>
                        <div className="sd-stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Experience Report Table */}
                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-title">Experience Performance Analysis</div>
                      <button className="sd-btn-outline" onClick={() => handleExportCSV('experiences')}>Export CSV</button>
                    </div>
                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Experience Title</th><th>Experience Ref</th><th>Attempts</th>
                            <th>Completed</th><th>Avg Score</th><th>Pass Rate</th>
                            <th>High / Low</th><th>Avg Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {experiencesReport.map((s, i) => (
                            <tr key={i} onClick={() => handleFetchExperienceDetail(s.experience_ref)} style={{ cursor:'pointer' }}>
                              <td><span className="sd-name-cell-primary">{s.experience_title}</span></td>
                              <td style={{ color:'#6b7280' }}>{s.experience_ref}</td>
                              <td>{s.total_attempts}</td>
                              <td>{s.completed}</td>
                              <td style={{ fontWeight:700, color:'#7c3aed' }}>{s.average_score}%</td>
                              <td>{s.pass_rate}%</td>
                              <td>{s.highest_score}% / {s.lowest_score}%</td>
                              <td>{Math.round(s.average_time_seconds/60)}m {s.average_time_seconds%60}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Classes Report Table */}
                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-title">Class Performance Analysis</div>
                      <button className="sd-btn-outline" onClick={() => handleExportCSV('classes')}>Export CSV</button>
                    </div>
                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Class Name</th><th>Students</th><th>Completed</th>
                            <th>Avg Score</th><th>Pass Rate</th><th>Top Student</th><th>Weakest</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classesReport.map((c, i) => (
                            <tr key={i} onClick={() => handleFetchClassDetail(c.class_id)} style={{ cursor:'pointer' }}>
                              <td><span className="sd-name-cell-primary">{c.class_name}</span></td>
                              <td>{c.total_students}</td>
                              <td>{c.completed}</td>
                              <td style={{ fontWeight:700, color:'#10b981' }}>{c.average_score}%</td>
                              <td>{c.pass_rate}%</td>
                              <td style={{ color:'#047857', fontWeight:600 }}>{c.top_student}</td>
                              <td style={{ color:'#b91c1c' }}>{c.weakest_student}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Students Report Table */}
                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-title">Student Performance Analysis</div>
                      <button className="sd-btn-outline" onClick={() => handleExportCSV('students')}>Export CSV</button>
                    </div>
                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Student</th><th>Class</th><th>Attempts</th><th>Completed</th>
                            <th>Avg Score</th><th>Best Experience</th><th>Worst Experience</th><th>Last Attempt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsReport.map((st, i) => (
                            <tr key={i} onClick={() => handleFetchStudentDetail(st.student_id)} style={{ cursor:'pointer' }}>
                              <td><span className="sd-name-cell-primary">{st.student_name}</span></td>
                              <td>{st.class_name}</td>
                              <td>{st.total_attempts}</td>
                              <td>{st.completed}</td>
                              <td style={{ fontWeight:700, color:'#3b82f6' }}>{st.average_score}%</td>
                              <td style={{ color:'#047857' }}>{st.best_experience}</td>
                              <td style={{ color:'#b91c1c' }}>{st.worst_experience}</td>
                              <td>{st.last_attempt_date ? new Date(st.last_attempt_date).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Student Experience Completion Table */}
                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-title">Student Experience Completion</div>
                      <span className="sd-card-meta">{studentCompletionReport.length} student{studentCompletionReport.length !== 1 ? 's' : ''}</span>
                    </div>
                    {studentCompletionReport.length === 0 ? (
                      <div className="sd-reports-empty" style={{ padding: '2rem 1rem' }}>
                        <FiFileText/>
                        <h3>No experience assignments yet</h3>
                        <p>Completion data will appear once experiences are assigned and synced from the LMS.</p>
                      </div>
                    ) : (
                      <div className="sd-table-wrap">
                        <table className="sd-table">
                          <thead>
                            <tr>
                              <th>Student Profile</th>
                              <th>Assigned Experiences</th>
                              <th>Completed</th>
                              <th>Completion Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentCompletionReport.map((row) => {
                              const pct = row.total_assigned_experiences > 0
                                ? Math.round((row.completed_experiences_count / row.total_assigned_experiences) * 100)
                                : 0;
                              const barColor = pct === 100 ? '#16a34a' : pct >= 60 ? '#f59e0b' : '#ef4444';
                              return (
                                <tr key={row.student_id}>
                                  <td>
                                    <span className="sd-name-cell-primary">{row.student_name}</span>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                    {row.total_assigned_experiences}
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>
                                    {row.completed_experiences_count}
                                  </td>
                                  <td style={{ minWidth: 160 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{
                                          width: `${pct}%`, height: '100%',
                                          background: barColor, borderRadius: 4,
                                          transition: 'width 0.6s ease'
                                        }}/>
                                      </div>
                                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: barColor, minWidth: 34 }}>
                                        {pct}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ══════════ PROFILE / ACCOUNT SETTINGS TAB ══════════ */}
          {activeSubTab === 'profile' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Account Settings</h1>
                <p className="sd-page-sub">Manage your personal information, security preferences, and administrative profile.</p>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="sd-profile-card">
                  {/* Section header */}
                  <div className="sd-profile-section-header">
                    <div className="sd-profile-section-title">
                      <FiUser/>Personal Details
                    </div>
                    <span className="sd-verified-badge"><FiCheckCircle/>Verified Admin</span>
                  </div>

                  {/* Full Name + Email */}
                  <div className="sd-form-row">
                    <div className="sd-form-group">
                      <label className="sd-form-label">Full Name</label>
                      <input
                        className="sd-form-input"
                        type="text"
                        value={profileForm.full_name}
                        onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Email Address</label>
                      <input
                        className="sd-form-input"
                        type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone (username shown as reference) */}
                  <div className="sd-form-row">
                    <div className="sd-form-group">
                      <label className="sd-form-label">Phone Number</label>
                      <input
                        className="sd-form-input"
                        type="text"
                        value={profileForm.username}
                        disabled
                        placeholder="+1 (555) 0123-4567"
                      />
                    </div>
                  </div>

                  {/* Change Password row */}
                  <div className="sd-pw-row">
                    <div>
                      <div className="sd-pw-row-title">Change Password</div>
                      <div className="sd-pw-row-sub">Update your password to stay secure</div>
                    </div>
                    <button type="button" className="sd-btn-outline" onClick={() => setShowPwModal(true)}>
                      Update
                    </button>
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

      {/* ════════════════════════
          CRUD MODAL (Teachers / Classes)
          ════════════════════════ */}
      {showModal && (
        <div className="sd-modal-backdrop" onClick={e => { if(e.target === e.currentTarget) setShowModal(false); }}>
          <div className="sd-modal">
            <div className="sd-modal-header">
              <span className="sd-modal-title">
                {modalType === 'add' ? 'Add' : 'Edit'} {activeSubTab === 'teachers' ? 'Teacher' : activeSubTab === 'students' ? 'Student' : 'Class'}
              </span>
              <button className="sd-modal-close" onClick={() => setShowModal(false)}><FiX/></button>
            </div>
            {errorMsg && <div className="sd-alert sd-alert-error" style={{ marginBottom:'1rem' }}><FiX/>{errorMsg}</div>}
            <form className="sd-modal-form" onSubmit={handleFormSubmit}>
              {/* Teacher fields */}
              {activeSubTab === 'teachers' && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Username</label>
                  <input className="sd-form-input" type="text" value={teacherForm.username}
                    onChange={e => setTeacherForm({...teacherForm, username:e.target.value})}
                    disabled={modalType==='edit'} required/>
                </div>
                {modalType==='add' && (
                  <div className="sd-form-group">
                    <label className="sd-form-label">Password</label>
                    <input className="sd-form-input" type="password" value={teacherForm.password}
                      onChange={e => setTeacherForm({...teacherForm, password:e.target.value})} required/>
                  </div>
                )}
                <div className="sd-form-group">
                  <label className="sd-form-label">Full Name</label>
                  <input className="sd-form-input" type="text" value={teacherForm.full_name}
                    onChange={e => setTeacherForm({...teacherForm, full_name:e.target.value})} required/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Email</label>
                  <input className="sd-form-input" type="email" value={teacherForm.email}
                    onChange={e => setTeacherForm({...teacherForm, email:e.target.value})} required/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">School</label>
                  <select className="sd-form-input" value={teacherForm.school}
                    onChange={e => setTeacherForm({...teacherForm, school:e.target.value})} required>
                    {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name}</option>)}
                  </select>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Qualification</label>
                  <input className="sd-form-input" type="text" value={teacherForm.qualification}
                    onChange={e => setTeacherForm({...teacherForm, qualification:e.target.value})}/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Assign Classes</label>
                  <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem', background: '#fff' }}>
                    {classes.map(c => (
                      <label key={c.class_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={teacherForm.assigned_class_ids?.includes(c.class_id)}
                          onChange={e => {
                            const checked = e.target.checked;
                            const currentIds = teacherForm.assigned_class_ids || [];
                            if (checked) {
                              setTeacherForm({ ...teacherForm, assigned_class_ids: [...currentIds, c.class_id] });
                            } else {
                              setTeacherForm({ ...teacherForm, assigned_class_ids: currentIds.filter(id => id !== c.class_id) });
                            }
                          }}
                        />
                        <span>{c.class_name} ({c.grade_name || ''})</span>
                      </label>
                    ))}
                    {classes.length === 0 && <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>No classes available</span>}
                  </div>
                </div>

                <label className="sd-checkbox-label">
                  <input type="checkbox" checked={teacherForm.is_active}
                    onChange={e => setTeacherForm({...teacherForm, is_active:e.target.checked})}/>
                  Active Status
                </label>
              </>)}

              {/* Student fields */}
              {activeSubTab === 'students' && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Username *</label>
                  <input className="sd-form-input" type="text" value={studentForm.username}
                    onChange={e => setStudentForm({...studentForm, username:e.target.value})}
                    disabled={modalType==='edit'} required/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Full Name</label>
                  <input className="sd-form-input" type="text" value={studentForm.full_name}
                    onChange={e => setStudentForm({...studentForm, full_name:e.target.value})}/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Email</label>
                  <input className="sd-form-input" type="email" value={studentForm.email}
                    onChange={e => setStudentForm({...studentForm, email:e.target.value})}/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">{modalType === 'add' ? 'Password *' : 'New Password'}</label>
                  <input className="sd-form-input" type="password" value={studentForm.password}
                    onChange={e => setStudentForm({...studentForm, password:e.target.value})}
                    required={modalType === 'add'} placeholder={modalType === 'edit' ? 'Leave blank to keep current' : ''}/>
                </div>
                <label className="sd-checkbox-label">
                  <input type="checkbox" checked={studentForm.is_active}
                    onChange={e => setStudentForm({...studentForm, is_active:e.target.checked})}/>
                  Active Status
                </label>
              </>)}

              {/* Class fields */}
              {activeSubTab === 'classes' && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Class Name</label>
                  <input className="sd-form-input" type="text" placeholder="e.g. Class 6-A"
                    value={classForm.class_name}
                    onChange={e => setClassForm({...classForm, class_name:e.target.value})} required/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">School</label>
                  <select className="sd-form-input" value={classForm.school}
                    onChange={e => setClassForm({...classForm, school:e.target.value})} required>
                    {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name}</option>)}
                  </select>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Grade Level</label>
                  <select className="sd-form-input" value={classForm.grade}
                    onChange={e => setClassForm({...classForm, grade:e.target.value})} required>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.grade_name}</option>)}
                  </select>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Academic Year</label>
                  <input className="sd-form-input" type="text" value={classForm.academic_year}
                    onChange={e => setClassForm({...classForm, academic_year:e.target.value})} required/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Assign Teachers</label>
                  <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem', background: '#fff' }}>
                    {teachers.map(t => (
                      <label key={t.teacher_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={classForm.assigned_teacher_ids?.includes(t.teacher_id)}
                          onChange={e => {
                            const checked = e.target.checked;
                            const currentIds = classForm.assigned_teacher_ids || [];
                            if (checked) {
                              setClassForm({ ...classForm, assigned_teacher_ids: [...currentIds, t.teacher_id] });
                            } else {
                              setClassForm({ ...classForm, assigned_teacher_ids: currentIds.filter(id => id !== t.teacher_id) });
                            }
                          }}
                        />
                        <span>{t.full_name || t.username}</span>
                      </label>
                    ))}
                    {teachers.length === 0 && <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>No teachers available</span>}
                  </div>
                </div>
                <label className="sd-checkbox-label">
                  <input type="checkbox" checked={classForm.is_active}
                    onChange={e => setClassForm({...classForm, is_active:e.target.checked})}/>
                  Active Status
                </label>
              </>)}

              <div className="sd-modal-footer">
                <button type="button" className="sd-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sd-btn-save" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPwModal && (
        <div className="sd-modal-backdrop" onClick={e => { if(e.target === e.currentTarget) setShowPwModal(false); }}>
          <div className="sd-modal" style={{ maxWidth:420 }}>
            <div className="sd-modal-header">
              <span className="sd-modal-title">Change Password</span>
              <button className="sd-modal-close" onClick={() => setShowPwModal(false)}><FiX/></button>
            </div>
            <form className="sd-modal-form" onSubmit={async e => {
              e.preventDefault();
              if (!profileForm.current_password) { setErrorMsg('Current password required.'); return; }
              setActionLoading(true);
              try {
                const res = await apiFetch('/api/users/change-password/', {
                  method:'POST',
                  body: JSON.stringify({ old_password: profileForm.current_password, new_password: profileForm.password })
                });
                const d = await res.json();
                if (res.ok) {
                  showFeedback('Password changed successfully!', null);
                  setProfileForm(p => ({ ...p, current_password:'', password:'' }));
                  setShowPwModal(false);
                } else {
                  setErrorMsg(typeof d==='object' ? JSON.stringify(d) : 'Password change failed.');
                }
              } catch { setErrorMsg('Connection error.'); }
              finally { setActionLoading(false); }
            }}>
              <div className="sd-form-group">
                <label className="sd-form-label">Current Password</label>
                <input className="sd-form-input" type="password" value={profileForm.current_password}
                  onChange={e => setProfileForm({...profileForm, current_password:e.target.value})}
                  placeholder="Enter current password" required/>
              </div>
              <div className="sd-form-group">
                <label className="sd-form-label">New Password</label>
                <input className="sd-form-input" type="password" value={profileForm.password}
                  onChange={e => setProfileForm({...profileForm, password:e.target.value})}
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

      {/* ── Experience Detail Modal ── */}
      {showExperienceDetailModal && selectedExperienceDetail && (
        <div className="sd-modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setShowExperienceDetailModal(false); }}>
          <div className="sd-modal" style={{ maxWidth:700 }}>
            <div className="sd-modal-header">
              <span className="sd-modal-title">Experience: {selectedExperienceDetail.experience_title}</span>
              <button className="sd-modal-close" onClick={() => setShowExperienceDetailModal(false)}><FiX/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))', gap:'0.75rem', marginBottom:'1.25rem', padding:'0.85rem', background:'#f8fafc', borderRadius:8, fontSize:'0.84rem' }}>
              <div><strong>Attempts:</strong> {selectedExperienceDetail.total_attempts}</div>
              <div><strong>Completed:</strong> {selectedExperienceDetail.completed}</div>
              <div><strong>Avg Score:</strong> {selectedExperienceDetail.average_score}%</div>
              <div><strong>Pass Rate:</strong> {selectedExperienceDetail.pass_rate}%</div>
              <div><strong>High/Low:</strong> {selectedExperienceDetail.highest_score}% / {selectedExperienceDetail.lowest_score}%</div>
            </div>
            <div className="sd-table-wrap">
              <table className="sd-table">
                <thead><tr><th>Student</th><th>Class</th><th>Score</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {selectedExperienceDetail.attempts?.map((att, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:600 }}>{att.student_name}</td>
                      <td>{att.class_name}</td>
                      <td style={{ fontWeight:700 }}>{att.percentage != null ? att.percentage+'%' : 'N/A'}</td>
                      <td>{att.status}</td>
                      <td>{att.time_spent_seconds ? Math.round(att.time_spent_seconds/60)+'m' : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sd-modal-footer">
              <button className="sd-btn-cancel" onClick={() => setShowExperienceDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Class Detail Modal ── */}
      {showClassDetailModal && selectedClassDetail && (
        <div className="sd-modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setShowClassDetailModal(false); }}>
          <div className="sd-modal" style={{ maxWidth:700 }}>
            <div className="sd-modal-header">
              <span className="sd-modal-title">Class: {selectedClassDetail.class_name}</span>
              <button className="sd-modal-close" onClick={() => setShowClassDetailModal(false)}><FiX/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'0.75rem', marginBottom:'1.25rem', padding:'0.85rem', background:'#f8fafc', borderRadius:8, fontSize:'0.84rem' }}>
              <div><strong>Students:</strong> {selectedClassDetail.total_students}</div>
              <div><strong>Completed:</strong> {selectedClassDetail.completed}</div>
              <div><strong>Avg Score:</strong> {selectedClassDetail.average_score}%</div>
              <div><strong>Pass Rate:</strong> {selectedClassDetail.pass_rate}%</div>
            </div>
            <div className="sd-table-wrap">
              <table className="sd-table">
                <thead><tr><th>Student</th><th>Attempts</th><th>Completed</th><th>Avg Score</th><th>Last Attempt</th></tr></thead>
                <tbody>
                  {selectedClassDetail.students?.map((st, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:600 }}>{st.student_name}</td>
                      <td>{st.total_attempts}</td>
                      <td>{st.completed}</td>
                      <td style={{ fontWeight:700, color:'#10b981' }}>{st.average_score}%</td>
                      <td>{st.last_attempt_date ? new Date(st.last_attempt_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sd-modal-footer">
              <button className="sd-btn-cancel" onClick={() => setShowClassDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Detail Modal ── */}
      {showStudentDetailModal && selectedStudentDetail && (
        <div className="sd-modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setShowStudentDetailModal(false); }}>
          <div className="sd-modal" style={{ maxWidth:700 }}>
            <div className="sd-modal-header">
              <span className="sd-modal-title">Student: {selectedStudentDetail.student_name}</span>
              <button className="sd-modal-close" onClick={() => setShowStudentDetailModal(false)}><FiX/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'0.75rem', marginBottom:'1.25rem', padding:'0.85rem', background:'#f8fafc', borderRadius:8, fontSize:'0.84rem' }}>
              <div><strong>Attempts:</strong> {selectedStudentDetail.total_attempts}</div>
              <div><strong>Completed:</strong> {selectedStudentDetail.completed}</div>
              <div><strong>Avg Score:</strong> {selectedStudentDetail.average_score}%</div>
            </div>
            <div className="sd-table-wrap">
              <table className="sd-table">
                <thead><tr><th>Experience</th><th>Class</th><th>Score</th><th>Status</th><th>Started At</th></tr></thead>
                <tbody>
                  {selectedStudentDetail.attempts?.map((att, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:600 }}>{att.experience_title}</td>
                      <td>{att.class_name}</td>
                      <td style={{ fontWeight:700, color:'#3b82f6' }}>{att.percentage != null ? att.percentage+'%' : 'N/A'}</td>
                      <td>{att.status}</td>
                      <td>{new Date(att.started_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sd-modal-footer">
              <button className="sd-btn-cancel" onClick={() => setShowStudentDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Delete Confirmation Modal ── */}
      {deleteConfirm.show && (
        <div className="sd-modal-backdrop" style={{ backdropFilter: 'blur(5px)' }} onClick={() => setDeleteConfirm({ show: false, id: null, type: null })}>
          <div className="sd-modal" style={{ maxWidth: 400, textAlign: 'center', padding: '2rem 1.5rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}><FiTrash2 /></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Are you sure?</h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Do you really want to delete this {deleteConfirm.type}? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button className="sd-btn-cancel" onClick={() => setDeleteConfirm({ show: false, id: null, type: null })}>
                Cancel
              </button>
              <button className="sd-btn-primary" style={{ background: '#ef4444' }} onClick={confirmDeleteAction} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolDashboard;
