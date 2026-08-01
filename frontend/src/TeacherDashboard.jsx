import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiUsers, FiBookOpen, FiBarChart2, FiUser,
  FiSettings, FiHelpCircle, FiLogOut, FiSearch,
  FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiCalendar, FiBell, FiFilter,
  FiCheckCircle, FiMonitor, FiSmartphone, FiFileText,
  FiActivity, FiTrendingUp, FiClock, FiAward,
  FiChevronLeft, FiChevronRight, FiLock, FiArrowRight, FiDownload, FiAlertTriangle,
  FiEye, FiEyeOff, FiUpload, FiRefreshCw, FiMoreVertical
} from 'react-icons/fi';
import './SchoolDashboard.css';
import { apiFetch } from './api';
import teacherHeaderBanner from './assets/6.jpeg';
import logoIcon from './assets/icon.png';
import AvatarCropperModal from './AvatarCropperModal';

/* ─── Auto-generate a student roll no from their name, e.g. "Rahul" -> "RAH001" ───
   The numeric part continues from the total number of existing students (school-wide),
   so it never restarts at 001 once other students already exist — e.g. with 4 students
   already in the school, the next one becomes ...005, not 001. If that exact roll no is
   somehow already taken, it keeps incrementing until a free one is found. */
const generateRollNo = (fullName, existingStudents = []) => {
  const cleanName = (fullName || '').trim().replace(/[^a-zA-Z]/g, '');
  if (!cleanName) return '';
  const prefix = cleanName.slice(0, 3).toUpperCase().padEnd(3, 'X');
  const takenRollNos = new Set((existingStudents || []).map(s => (s.roll_no || '').toUpperCase()));
  let n = (existingStudents || []).length + 1;
  let candidate = `${prefix}${String(n).padStart(3, '0')}`;
  while (takenRollNos.has(candidate)) {
    n += 1;
    candidate = `${prefix}${String(n).padStart(3, '0')}`;
  }
  return candidate;
};

/* ─── Static chart data (same as SchoolDashboard reference) ─── */
const CHART_MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
const CHART_LINES = [
  { label: 'Weekly',    color: '#2563eb', points: [40, 55, 45, 70, 60, 80] },
  { label: 'Monthly',   color: '#10b981', points: [30, 40, 55, 45, 65, 55] },
  { label: 'Ability',   color: '#f97316', points: [55, 35, 60, 50, 40, 70] },
  { label: 'Authority', color: '#a855f7', points: [25, 45, 35, 60, 50, 45] },
];
/* Cycling avatar colors for the Student Activity list (not tied to any specific student data) */
const ACTIVITY_AVATAR_COLORS = ['#6366f1', '#22c55e', '#f97316', '#a78bfa'];

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
const TeacherDashboard = ({ user: propUser, onLogout, onUpdateUser }) => {
  const [user, setUser] = useState(propUser);
  useEffect(() => {
    setUser(propUser);
  }, [propUser]);

  /* ── Navigation ── */
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ── UI ── */
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const [successMsg, setSuccessMsg]       = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showFeedback(null, "Image is too large. Max size is 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropSave = async (blob) => {
    setCropImageSrc(null);
    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.jpg');
    setAvatarUploading(true);
    try {
      const res = await apiFetch('/api/users/profile/avatar/', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, profile_picture: data.profile_picture };
        setUser(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);
        setSuccessMsg('');
        showFeedback('Profile picture updated successfully!', null);
      } else {
        const text = await res.text();
        let errMsg = 'Failed to upload profile picture.';
        try {
          const d = JSON.parse(text);
          errMsg = d.error || d.detail || errMsg;
        } catch {
          errMsg = text.slice(0, 100) || errMsg;
        }
        showFeedback(null, errMsg);
      }
    } catch (err) {
      console.error(err);
      showFeedback(null, `Upload error: ${err.message}`);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setDeleteConfirm({
      show: true,
      id: 'profile-avatar',
      type: 'profile picture'
    });
  };

  const handleRemoveAvatarConfirm = async () => {
    setAvatarUploading(true);
    try {
      const res = await apiFetch('/api/users/profile/avatar/', {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, profile_picture: null };
        setUser(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);
        showFeedback('Profile picture removed successfully!', null);
      } else {
        const d = await res.json().catch(() => ({}));
        showFeedback(null, d.error || 'Failed to remove profile picture.');
      }
    } catch (err) {
      console.error(err);
      showFeedback(null, "Failed to remove profile picture.");
    } finally {
      setAvatarUploading(false);
    }
  };

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
  const [selectedClassCrudDetail, setSelectedClassCrudDetail] = useState(null);
  const [showClassCrudDetailModal, setShowClassCrudDetailModal] = useState(false);
  const [selectedStudentCrudDetail, setSelectedStudentCrudDetail] = useState(null);
  const [showStudentCrudDetailModal, setShowStudentCrudDetailModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // { id, type }

  const [studentForm, setStudentForm] = useState({
    username: '', password: '', email: '', full_name: '', roll_no: '', grade: '', section: '', is_active: true
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
  const [currentTime, setCurrentTime]             = useState(new Date());
  const [notifications, setNotifications]         = useState([
    { id: 1, text: 'New student enrolled in your class.',     time: '5 min ago', read: false },
    { id: 2, text: 'Lesson plan approved by school admin.',   time: '2 hrs ago', read: false },
    { id: 3, text: 'Student completed an experience today.',  time: '4 hrs ago', read: true  },
  ]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showHelpModal,     setShowHelpModal]     = useState(false);

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
      if (res.ok) {
        const d = await res.json();
        const rawList = d.results || d;
        const filtered = (Array.isArray(rawList) ? rawList : []).filter(g => {
          const match = g.grade_name.match(/^Grade\s+(\d+)$/i);
          if (match) {
            const num = parseInt(match[1]);
            return num >= 1 && num <= 10;
          }
          return false;
        }).sort((a, b) => {
          const numA = parseInt(a.grade_name.match(/\d+/)[0]);
          const numB = parseInt(b.grade_name.match(/\d+/)[0]);
          return numA - numB;
        });
        setGrades(filtered);
      }
    } catch (e) {
      console.error('Failed to load grades.', e);
    }
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

  /* ── Clock ticker ── */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = () => {
      setShowNotifDropdown(false);
      setActiveDropdown(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs >= 5  && hrs < 12) return 'Good morning';
    if (hrs >= 12 && hrs < 17) return 'Good afternoon';
    if (hrs >= 17 && hrs < 22) return 'Good evening';
    return 'Good night';
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
        roll_no: entity.roll_no || '',
        grade: entity.grade || '',
        section: entity.section || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : { username: '', password: '', email: '', full_name: '', roll_no: '', grade: '', section: '', is_active: true });
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
      if (modalType === 'add') {
        if (!payload.username) payload.username = payload.roll_no;
        if (!payload.password) payload.password = payload.roll_no;
        if (!payload.email) payload.email = `${payload.roll_no}@school.com`;
      } else if (modalType === 'edit' && !payload.password) {
        delete payload.password;
      }
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
      if (id === 'profile-avatar') {
        setDeleteConfirm({ show: false, id: null, type: '' });
        await handleRemoveAvatarConfirm();
        return;
      }
      if (!id) return;
      const cleanType = type.endsWith('s') ? type.slice(0, -1) : type;
      const res = await apiFetch(`/api/cms/v1/${cleanType}s/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        showFeedback(`${cleanType.charAt(0).toUpperCase() + cleanType.slice(1)} deleted successfully!`, null);
        setDeleteConfirm({ show: false, id: null, type: '' });
        if (cleanType === 'student') await loadStudents();
        else if (cleanType === 'class') await loadClasses();
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

  const toggleActiveStatus = async (id, currentStatus, type) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const url = `/api/cms/v1/${type}/${id}/`;
      const res = await apiFetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        showFeedback('Status updated successfully.', null);
        if (type === 'students') { await loadStudents(); }
      } else {
        const resData = await res.json().catch(() => ({}));
        setErrorMsg(resData.detail || 'Failed to update status.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Network error while updating status.');
    } finally {
      setActionLoading(false);
    }
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
      if (onUpdateUser) onUpdateUser(updatedUser);
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
          top: 1.5rem !important;
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
          grid-template-columns: repeat(5, 1fr) !important;
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
            <div className="sd-user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {user?.profile_picture ? (
                <img src={user.profile_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
              ) : (
                (user?.username || 'TE').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="sd-user-meta">
              <div className="sd-user-name">{profileForm.full_name || user?.full_name || user?.username || 'Teacher'}</div>
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
          <div className="sd-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className="sd-topbar-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {activeSubTab === 'overview' ? 'Teacher Dashboard' :
               activeSubTab === 'students' ? 'Manage Students' :
               activeSubTab === 'classes' ? 'Manage Classes' :
               activeSubTab === 'reports' ? 'Reports & Analytics' :
               activeSubTab === 'profile' ? 'Profile Settings' : 'Teacher Portal'}
            </h2>
          </div>
          {/* <div className="sd-search">
            <FiSearch/>
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div> */}
          <div className="sd-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            <div className="sd-year-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
              <FiCalendar/> {formatDateTime(currentTime)}
            </div>

            <div style={{ position: 'relative' }}>
              <button className="sd-icon-btn" style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); setShowNotifDropdown(!showNotifDropdown); }}>
                <FiBell/>
                {notifications.some(n => !n.read) && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                )}
              </button>
              {showNotifDropdown && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '300px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 1000, padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Notifications</span>
                    <button style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}>Mark all read</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ padding: '8px', borderRadius: '6px', backgroundColor: n.read ? 'transparent' : '#f0fdf4', borderLeft: n.read ? 'none' : '3px solid #22c55e', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.8rem', color: '#334155' }}>{n.text}</span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="sd-icon-btn" onClick={() => setShowHelpModal(true)} title="Help & Support"><FiHelpCircle/></button>
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
                   <h1>{getGreeting()}, {profileForm.full_name || profileForm.username || user?.full_name || user?.username || 'Teacher'}!</h1>
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
              <div className="sd-stat-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {[
                  { label: 'Assigned Classes', value: statClasses, color: '#22c55e', bg: '#dcfce7', icon: <FiBookOpen /> },
                  { label: 'Total Students', value: statStudents, color: '#3b82f6', bg: '#dbeafe', icon: <FiUsers /> },
                  { label: 'Active Experiences', value: statExperiences, color: '#a855f7', bg: '#f3e8ff', icon: <FiFileText /> },
                  { label: "Today's Lessons",   value: statLessons,   color: '#f97316', bg: '#ffedd5', icon: <FiClock/> },
                  { label: 'Completion Rate',   value: '—',           color: '#10b981', bg: '#d1fae5', icon: <FiTrendingUp/> },
                ].map((s, i) => (
                  <div className="sd-stat-card" key={i}>
                    <div className="sd-stat-card-icon-part" style={{ background: s.bg, color: s.color }}>
                      {s.icon}
                    </div>
                    <div className="sd-stat-card-content-part">
                      <div className="sd-stat-value">{s.value}</div>
                      <div className="sd-stat-label">{s.label}</div>
                      {s.trend && <span className="sd-stat-trend">{s.trend}</span>}
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
                    {data?.student_rankings?.length ? (
                      data.student_rankings.slice(0, 4).map((rank, i) => (
                        <div className="sd-activity-item" key={i}>
                          <div className="sd-activity-avatar" style={{ background: ACTIVITY_AVATAR_COLORS[i % ACTIVITY_AVATAR_COLORS.length] }}>
                            {rank.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="sd-activity-body">
                            <div className="sd-activity-name">{rank.name}</div>
                            <div className="sd-activity-desc">{`Score: ${rank.score} — ${rank.progress || 'Progress tracked'}`}</div>
                          </div>
                          <div className="sd-activity-time">{`#${i + 1}`}</div>
                        </div>
                      ))
                    ) : (
                      <div className="sd-empty-state" style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No recent student activity yet.
                      </div>
                    )}
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
                      Upload an <code>.xlsx</code> or <code>.xls</code> spreadsheet.<br/>
                      <strong style={{ color: '#ef4444' }}>Mandatory fields:</strong> <code>fullname</code>, <code>grade</code>, <code>section</code>.<br/>
                      Roll No is auto-generated from <code>fullname</code> (any <code>rollno</code> column is ignored). Optional fields: <code>username</code>, <code>password</code>, <code>email</code>, <code>is_active</code>.
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
                  <table className="sd-table" style={{ tableLayout: 'auto' }}>
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
                        <th>Roll No</th>
                        <th>Grade</th>
                        <th>Section</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
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
                            <td>{s.roll_no || 'N/A'}</td>
                            <td>{s.grade || 'N/A'}</td>
                            <td>{s.section || 'N/A'}</td>
                            <td style={{ overflow: 'visible', textOverflow: 'clip' }}>
                              <span className={`sd-badge ${s.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                                {s.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={{ overflow: 'visible' }}>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  className="sd-action-trigger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(
                                      activeDropdown && activeDropdown.id === sid
                                        ? null
                                        : { id: sid, type: 'students' }
                                    );
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748b'
                                  }}
                                >
                                  <FiMoreVertical style={{ fontSize: '1.1rem' }} />
                                </button>
                                {activeDropdown && activeDropdown.id === sid && activeDropdown.type === 'students' && (
                                  <div
                                    className="sd-action-menu"
                                    style={{
                                      position: 'absolute',
                                      right: 0,
                                      top: '100%',
                                      background: '#ffffff',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '8px',
                                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                      zIndex: 100,
                                      minWidth: '130px',
                                      padding: '0.4rem 0'
                                    }}
                                  >
                                    <button
                                      className="sd-menu-item"
                                      onClick={() => {
                                        setSelectedStudentCrudDetail(s);
                                        setShowStudentCrudDetailModal(true);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        background: 'none',
                                        textAlign: 'left',
                                        fontSize: '0.85rem',
                                        color: '#0f172a',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <FiEye style={{ color: '#0284c7' }} /> View
                                    </button>
                                    <button
                                      className="sd-menu-item"
                                      onClick={() => openEditModal(s)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        background: 'none',
                                        textAlign: 'left',
                                        fontSize: '0.85rem',
                                        color: '#0f172a',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <FiEdit2 style={{ color: '#4f46e5' }} /> Edit
                                    </button>
                                    <button
                                      className="sd-menu-item"
                                      onClick={() => toggleActiveStatus(sid, s.is_active, 'students')}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        background: 'none',
                                        textAlign: 'left',
                                        fontSize: '0.85rem',
                                        color: s.is_active ? '#ef4444' : '#16a34a',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <FiLock /> {s.is_active ? 'Block' : 'Unblock'}
                                    </button>
                                    <button
                                      className="sd-menu-item"
                                      onClick={() => openDeleteModal(sid, 'students', s.full_name || s.username)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        background: 'none',
                                        textAlign: 'left',
                                        fontSize: '0.85rem',
                                        color: '#dc2626',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <FiTrash2 /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filterList(students).length === 0 && (
                        <tr>
                          <td colSpan="7" className="sd-empty-state">No students found.</td>
                        </tr>
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
                  <table className="sd-table" style={{ tableLayout: 'auto' }}>
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Grade Level</th>
                        <th>School Name</th>
                        <th>Academic Year</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(classes), classPage).map((c, i) => {
                        const cid = c.class_id || c.id;
                        return (
                          <tr key={cid || i}>
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
                                {c.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="sd-action-cell" style={{ justifyContent: 'center' }}>
                                <button className="sd-icon-action view" style={{ color: '#0b75b3' }} onClick={() => { setSelectedClassCrudDetail(c); setShowClassCrudDetailModal(true); }} title="View">
                                  <FiEye/>
                                </button>
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

          {activeSubTab === 'profile' && (
            <div style={{ padding: '0.5rem', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
              <form onSubmit={handleProfileUpdate} style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
                  {/* Left Column: Avatar & Summary Card */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '300px', flexShrink: 0, position: 'relative' }}>
                    {avatarUploading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', borderRadius: '16px', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiRefreshCw className="spin-anim" style={{ color: '#0b75b3', fontSize: '1.5rem' }} />
                      </div>
                    )}
                    <div 
                      style={{ position: 'relative', margin: '0.5rem 0', cursor: 'pointer' }}
                      onClick={() => document.getElementById('profile-avatar-input').click()}
                    >
                      <div style={{ width: '96px', height: '96px', borderRadius: '50%', border: '4px solid #eff6ff', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(11, 117, 179, 0.2)', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {user?.profile_picture ? (
                          <img src={user.profile_picture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#0b75b3', color: '#fff', fontWeight: 800, fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(user?.username || 'U').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div 
                        style={{ position: 'absolute', bottom: 0, right: 0, background: '#0b75b3', color: '#fff', padding: '0.45rem', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '2px solid #fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Upload Photo"
                      >
                        <FiUpload />
                      </div>
                    </div>

                    <input 
                      type="file" 
                      id="profile-avatar-input" 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                    />
                    
                    {user?.profile_picture && (
                      <button 
                        type="button"
                        onClick={handleRemoveAvatar}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FiTrash2 /> Remove Photo
                      </button>
                    )}
                    
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '1rem 0 0.25rem 0' }}>
                      {profileForm.full_name || user?.username || 'User'}
                    </h3>
                    
                    <div style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }}></span>
                      <span>{user?.role?.replace('_', ' ') || 'User'}</span>
                    </div>

                    <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', margin: '1.5rem 0' }}></div>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', background: '#f0f9ff', color: '#0369a1', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.82rem', textAlign: 'left' }}>
                        <FiUser style={{ fontSize: '1rem' }} />
                        <span>Account Details</span>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => {
                          setPwForm({ current_password: '', new_password: '', confirm_password: '' });
                          setPwModalError('');
                          setShowPwModal(true);
                        }} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', background: 'transparent', color: '#475569', borderRadius: '8px', border: 'none', fontWeight: 500, fontSize: '0.82rem', textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <FiLock style={{ fontSize: '1rem', color: '#94a3b8' }} />
                        <span>Security & Password</span>
                      </button>
                      
                      <button 
                        type="button" 
                        onClick={onLogout} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', background: 'transparent', color: '#ef4444', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.82rem', textAlign: 'left', cursor: 'pointer', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}
                      >
                        <FiLogOut style={{ fontSize: '1rem' }} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Edit Form Details Card */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minWidth: '320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                      <FiUser style={{ color: '#0b75b3', fontSize: '1.25rem' }} />
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>Personal Information</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                      <div className="sd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="sd-form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                        <input className="sd-form-input" type="text"
                          value={profileForm.full_name}
                          onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                          placeholder="Your full name" required 
                          style={{ width: '100%', height: '42px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 0.85rem', fontSize: '0.85rem', transition: 'border-color 0.2s', outline: 'none' }}
                          onFocus={e => e.currentTarget.style.borderColor = '#0b75b3'}
                          onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                        />
                      </div>
                      <div className="sd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="sd-form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Email Address</label>
                        <input className="sd-form-input" type="email"
                          value={profileForm.email}
                          onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                          placeholder="your@email.com" 
                          style={{ width: '100%', height: '42px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 0.85rem', fontSize: '0.85rem', transition: 'border-color 0.2s', outline: 'none' }}
                          onFocus={e => e.currentTarget.style.borderColor = '#0b75b3'}
                          onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                      <div className="sd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="sd-form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Username</label>
                        <input className="sd-form-input" type="text" value={profileForm.username || user?.username} disabled
                          style={{ width: '100%', height: '42px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 0.85rem', fontSize: '0.85rem', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} />
                      </div>
                      <div className="sd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="sd-form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Phone Number</label>
                        <input className="sd-form-input" type="tel"
                          value={profileForm.phone_no}
                          onChange={e => setProfileForm({ ...profileForm, phone_no: e.target.value })}
                          placeholder="+91 98765 43210" 
                          style={{ width: '100%', height: '42px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 0.85rem', fontSize: '0.85rem', transition: 'border-color 0.2s', outline: 'none' }}
                          onFocus={e => e.currentTarget.style.borderColor = '#0b75b3'}
                          onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                        />
                      </div>
                    </div>

                    {(profileForm.school_name || user?.school_name) && (
                      <div className="sd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="sd-form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>School Tenant</label>
                        <input className="sd-form-input" type="text" value={profileForm.school_name || user?.school_name} disabled
                          style={{ width: '100%', height: '42px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 0.85rem', fontSize: '0.85rem', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                      <button type="submit" className="sd-btn-primary" disabled={actionLoading} style={{ padding: '0.75rem 2rem', background: '#0b75b3', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(11, 117, 179, 0.2)' }}>
                        {actionLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
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
                    <label className="sd-form-label">Full Name *</label>
                    <input className="sd-form-input" type="text" value={studentForm.full_name}
                      onChange={e => {
                        const full_name = e.target.value;
                        setStudentForm(prev => ({
                          ...prev,
                          full_name,
                          roll_no: modalType === 'add' ? generateRollNo(full_name, students) : prev.roll_no
                        }));
                      }} required placeholder="e.g. Arjun Sharma"/>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Roll No *</label>
                    <input className="sd-form-input" type="text" value={studentForm.roll_no}
                      onChange={e => setStudentForm({ ...studentForm, roll_no: e.target.value })} required placeholder="Auto-generated from name"/>
                  </div>
                </div>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Grade *</label>
                    <select
                      className="sd-form-input"
                      value={studentForm.grade}
                      onChange={e => setStudentForm({ ...studentForm, grade: e.target.value })}
                      required
                    >
                      <option value="">-- Select Grade ──</option>
                      {[3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>Grade {num}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Section *</label>
                    <input className="sd-form-input" type="text" value={studentForm.section}
                      onChange={e => setStudentForm({ ...studentForm, section: e.target.value })} required placeholder="e.g. A"/>
                  </div>
                </div>

                <label className="sd-checkbox-label" style={{marginTop:'0.5rem'}}>
                  <input type="checkbox" checked={studentForm.is_active}
                    onChange={e => setStudentForm({ ...studentForm, is_active: e.target.checked })}/>
                  Account is Active
                </label>
                {modalType === 'add' && (
                  <p style={{fontSize:'0.75rem',color:'#2563eb',margin:'0.5rem 0 0',fontStyle:'italic',background:'#eff6ff',padding:'0.4rem 0.6rem',borderRadius:'6px'}}>
                    🔑 Login: <strong>Roll No</strong> is used as both username and initial password.
                  </p>
                )}
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

      {/* ── Class CRUD Detail Modal ── */}
      {showClassCrudDetailModal && selectedClassCrudDetail && (
        <div className="sd-modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setShowClassCrudDetailModal(false); }}>
          <div className="sd-modal" style={{ maxWidth:500 }}>
            <div className="sd-modal-header">
              <span className="sd-modal-title">Class Details</span>
              <button className="sd-modal-close" onClick={() => setShowClassCrudDetailModal(false)}><FiX/></button>
            </div>
            <div style={{ padding: '1rem', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Class Name:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedClassCrudDetail.class_name || 'N/A'}</span>
                
                <span style={{ color: '#64748b', fontWeight: 600 }}>Grade Level:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{grades.find(g => g.id === selectedClassCrudDetail.grade)?.grade_name || selectedClassCrudDetail.grade || 'N/A'}</span>
                
                <span style={{ color: '#64748b', fontWeight: 600 }}>School Name:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{schools.find(s => s.school_id === selectedClassCrudDetail.school)?.school_name || selectedClassCrudDetail.school || 'N/A'}</span>
                
                <span style={{ color: '#64748b', fontWeight: 600 }}>Academic Year:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedClassCrudDetail.academic_year || 'N/A'}</span>
                
                <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
                <span>
                  <span className={`sd-badge ${selectedClassCrudDetail.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                    {selectedClassCrudDetail.is_active ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
            </div>
            <div className="sd-modal-footer">
              <button className="sd-btn-cancel" onClick={() => setShowClassCrudDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}


      {/* ── Student CRUD Detail Modal ── */}
      {showStudentCrudDetailModal && selectedStudentCrudDetail && (
        <div className="sd-modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setShowStudentCrudDetailModal(false); }}>
          <div className="sd-modal" style={{ maxWidth:500 }}>
            <div className="sd-modal-header">
              <span className="sd-modal-title">Student Details</span>
              <button className="sd-modal-close" onClick={() => setShowStudentCrudDetailModal(false)}><FiX/></button>
            </div>
            <div style={{ padding: '1.5rem', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Full Name:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedStudentCrudDetail.full_name || 'N/A'}</span>
                
                <span style={{ color: '#64748b', fontWeight: 600 }}>Roll No:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedStudentCrudDetail.roll_no || 'N/A'}</span>
                
                <span style={{ color: '#64748b', fontWeight: 600 }}>Grade Level:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedStudentCrudDetail.grade || 'N/A'}</span>
                
                <span style={{ color: '#64748b', fontWeight: 600 }}>Section:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedStudentCrudDetail.section || 'N/A'}</span>

                <span style={{ color: '#64748b', fontWeight: 600 }}>Username:</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedStudentCrudDetail.username || 'N/A'}</span>
                
                <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
                <span>
                  <span className={`sd-badge ${selectedStudentCrudDetail.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                    {selectedStudentCrudDetail.is_active ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
            </div>
            <div className="sd-modal-footer">
              <button className="sd-btn-cancel" onClick={() => setShowStudentCrudDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Help & Support Modal ── */}
      {showHelpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowHelpModal(false)}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', width: '480px', maxWidth: '90vw', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Help & Support</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.25rem' }} onClick={() => setShowHelpModal(false)}><FiX/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '📧', title: 'Email Support', desc: 'support@languagelab.edu', action: 'mailto:support@languagelab.edu' },
                { icon: '📚', title: 'Documentation', desc: 'Browse our knowledge base and guides', action: '#' },
                { icon: '💬', title: 'Live Chat', desc: 'Chat with our support team', action: '#' },
              ].map((item, idx) => (
                <a key={idx} href={item.action} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#334155' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                  <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {cropImageSrc && (
        <AvatarCropperModal 
          src={cropImageSrc}
          onCrop={handleCropSave}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
}
export default TeacherDashboard;
