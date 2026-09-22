import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiUsers, FiBookOpen, FiBarChart2, FiUser,
  FiHelpCircle, FiLogOut, FiSearch,
  FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiBell,
  FiFileText,
  FiTrendingUp, FiClock,
  FiChevronLeft, FiChevronRight, FiLock, FiAlertTriangle,
  FiEye, FiEyeOff, FiUpload, FiDownload, FiRefreshCw, FiMoreVertical
} from 'react-icons/fi';
import './SchoolDashboard.css';
import { apiFetch } from './api';
import { API_BASE_URL } from './config';

const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = url.startsWith('/') ? url : '/' + url;
  return `${base}${path}`;
};
import teacherHeaderBanner from './assets/6.jpeg';
import teacherBg from './assets/teacher_bg.png';
import logoIcon from './assets/icon.png';
import roundLogo from './assets/favicon.png';
import AvatarCropperModal from './AvatarCropperModal';
import HelpSupportModal from './HelpSupportModal';

const sortClasses = (classesList) => {
  if (!Array.isArray(classesList)) return [];
  return [...classesList].sort((a, b) => {
    const getGradeNum = (c) => {
      if (c?.grade?.sort_order !== undefined && c.grade?.sort_order !== null) {
        return Number(c.grade.sort_order);
      }
      if (c?.grade_sort_order !== undefined && c.grade_sort_order !== null) {
        return Number(c.grade_sort_order);
      }
      const gStr = c?.grade_name || c?.grade?.grade_name || c?.class_name || '';
      const match = gStr.match(/\d+/);
      return match ? parseInt(match[0], 10) : 999;
    };

    const getSectionStr = (c) => {
      const sec = c?.section ? String(c.section).replace(/^Section\s+/i, '').trim() : '';
      if (sec) return sec.toUpperCase();
      const name = c?.class_name || '';
      if (name.includes('-')) {
        const parts = name.split('-');
        const lastPart = parts[parts.length - 1].trim();
        const match = lastPart.match(/^[A-Za-z]+/);
        if (match) return match[0].toUpperCase();
      }
      const alphaMatch = name.match(/\b([A-Za-z])\b/);
      if (alphaMatch) return alphaMatch[1].toUpperCase();
      return name.toUpperCase();
    };

    const gradeA = getGradeNum(a);
    const gradeB = getGradeNum(b);
    if (gradeA !== gradeB) {
      return gradeA - gradeB;
    }

    const secA = getSectionStr(a);
    const secB = getSectionStr(b);
    if (secA !== secB) {
      return secA.localeCompare(secB, undefined, { numeric: true, sensitivity: 'base' });
    }

    const yearA = a?.academic_year || '';
    const yearB = b?.academic_year || '';
    return yearB.localeCompare(yearA);
  });
};

const getUserInitials = (u, defaultVal = 'U') => {
  if (!u) return defaultVal;
  const name = (u.full_name || u.username || '').trim();
  if (!name) return defaultVal;
  
  const parts = name.split(/[\s_\-]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  const lower = name.toLowerCase();
  if (lower.startsWith('prakash') && lower.includes('raj')) {
    return 'PR';
  }
  if (lower.startsWith('super') && lower.includes('admin')) {
    return 'SA';
  }
  
  return name.slice(0, 2).toUpperCase();
};

const UserAvatar = ({ user, size = 'small', initials = 'U' }) => {
  const [hasError, setHasError] = useState(false);
  const pic = user?.profile_picture;
  const validPic = pic && pic.toLowerCase() !== 'avatar' && !pic.toLowerCase().endsWith('/avatar') && !pic.toLowerCase().endsWith('/avatar/');

  useEffect(() => {
    setHasError(false);
  }, [pic]);

  if (!validPic || hasError) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: '#0b75b3',
        color: '#fff',
        fontWeight: 800,
        fontSize: size === 'small' ? '0.9rem' : '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%'
      }}>
        {getUserInitials(user, initials)}
      </div>
    );
  }

  return (
    <img
      src={resolveMediaUrl(pic)}
      alt=""
      onError={() => setHasError(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
    />
  );
};

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

const generateLmsLoginCode = (fullName, existingStudents = []) => {
  const cleanName = (fullName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleanName) return '';
  const takenUsernames = new Set((existingStudents || []).map(s => (s.username || '').toLowerCase()));
  let candidate = cleanName;
  let suffix = 1;
  while (takenUsernames.has(candidate)) {
    candidate = `${cleanName}${suffix}`;
    suffix += 1;
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
  const [navCollapsed, setNavCollapsed] = useState(() => {
    return localStorage.getItem('teacherd_nav_collapsed') === 'true';
  });
  const toggleNavCollapsed = () => {
    setNavCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('teacherd_nav_collapsed', String(next));
      return next;
    });
  };

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
  const [isSelectModeStudents, setIsSelectModeStudents] = useState(false);
  const [isSelectModeClasses, setIsSelectModeClasses] = useState(false);

  /* ── Bulk Upload ── */
  const [importActive,   setImportActive]   = useState(false);
  const [uploadSummary,  setUploadSummary]  = useState(null);
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  /* ── Modals ── */
  const [showModal,   setShowModal]   = useState(false);
  const [modalType,   setModalType]   = useState('add');
  const [editingId,   setEditingId]   = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: '' });
  const [showRecentActivityModal, setShowRecentActivityModal] = useState(false);

  /* ── Data ── */
  const [data,     setData]     = useState(null);
  const [students, setStudents] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [tchClassFilter, setTchClassFilter] = useState('');
  const [tchSectionFilter, setTchSectionFilter] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('');
  const [studentSectionFilter, setStudentSectionFilter] = useState('');
  const [schools,  setSchools]  = useState([]);
  const [grades,   setGrades]   = useState([]);

  /* ── Forms ── */
  const [selectedClassCrudDetail, setSelectedClassCrudDetail] = useState(null);
  const [showClassCrudDetailModal, setShowClassCrudDetailModal] = useState(false);
  const [selectedStudentCrudDetail, setSelectedStudentCrudDetail] = useState(null);
  const [showStudentCrudDetailModal, setShowStudentCrudDetailModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // { id, type }
  const isAnyOverlayOpen = showModal || showClassCrudDetailModal || showStudentCrudDetailModal;

  const [studentForm, setStudentForm] = useState({
    class_id: '', username: '', password: '', email: '', full_name: '', roll_no: '', grade: '', section: '', academic_year: '2026-2027', is_active: true
  });
  const [classForm, setClassForm] = useState({
    class_name: '', school: '', grade: '', section: 'A',
    academic_year: '2026-2027', is_active: true
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '', email: user?.email || '',
    full_name: user?.full_name || '', phone_no: user?.phone_no || '',
    current_password: '', password: ''
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwModalError, setPwModalError] = useState('');
  const [currentTime, setCurrentTime]             = useState(new Date());
  const [notifications, setNotifications]         = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showHelpModal,     setShowHelpModal]     = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  /* ══════════════════
     DATA LOADERS (unchanged from original)
     ══════════════════ */
  const loadDashboardData = async () => {
    try {
      const res = await apiFetch('/api/teacher/dashboard/');
      if (res.ok) {
        const d = await res.json();
        const actRes = await apiFetch('/api/v1/dashboard/recent-activity');
        if (actRes.ok) {
          d.recent_activities = await actRes.json();
        }
        setData(d);
      }
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
      if (res.ok) {
        const d = await res.json();
        const allCls = d.results || d;
        const currentUserId = user?.id || user?.pk || propUser?.id || propUser?.pk;
        const myClasses = allCls.filter(c => {
          if (Array.isArray(c.assigned_teacher_user_ids) && currentUserId) {
            return c.assigned_teacher_user_ids.includes(currentUserId);
          }
          if (!c.teacher_name) return false;
          const tNames = c.teacher_name.split(',').map(n => n.trim().toLowerCase());
          const userFull = (user?.full_name || propUser?.full_name || '').trim().toLowerCase();
          const userUsername = (user?.username || propUser?.username || '').trim().toLowerCase();
          return (userFull && tNames.includes(userFull)) || (userUsername && tNames.includes(userUsername));
        });
        setClasses(sortClasses(myClasses));
      }
    } catch (e) { console.error('Failed to load classes.', e); }
  };

  const handleViewClassCrud = async (class_id) => {
    try {
      const res = await apiFetch(`/api/cms/v1/classes/${class_id}/`);
      if (res.ok) {
        setSelectedClassCrudDetail(await res.json());
        setShowClassCrudDetailModal(true);
      }
    } catch (e) { console.error('Failed to load class detail', e); }
  };

  const loadNotifications = async () => {
    try {
      const res = await apiFetch('/api/v1/dashboard/notifications');
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch('/api/v1/dashboard/notifications', { method: 'POST' });
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error('Failed to mark notifications read', e);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await apiFetch(`/api/v1/dashboard/notifications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const res = await apiFetch('/api/v1/dashboard/notifications', { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (e) {
      console.error('Failed to clear notifications', e);
    }
  };

  const loadUserProfile = async () => {
    try {
      const res = await apiFetch('/api/users/profile/');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (onUpdateUser) onUpdateUser(data);
        setProfileForm({
          username: data.username || '',
          email: data.email || '',
          full_name: data.full_name || '',
          phone_no: data.phone_no || '',
          current_password: '',
          password: ''
        });
      }
    } catch (e) {
      console.error('Failed to load user profile', e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([
        loadUserProfile(), loadDashboardData(), loadSchools(),
        loadGrades(), loadStudents(), loadClasses(), loadNotifications()
      ]);
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
      setShowProfileDropdown(false);
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
    if (success) { 
      setSuccessMsg(success); 
      const t = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(t);
    }
    if (error) { 
      setErrorMsg(formatErrorMsg(error)); 
      const t = setTimeout(() => setErrorMsg(''), 4000);
      return () => clearTimeout(t);
    }
  };

  /* ── Form init ── */
  const initForm = (tab, entity = null) => {
    setErrorMsg('');
    if (tab === 'students') {
      let matchedClassId = '';
      if (entity) {
        const studentGradeVal = entity.grade ? (entity.grade.startsWith('Grade') ? entity.grade.replace('Grade', 'Class') : entity.grade) : '';
        const matchedClass = classes.find(c => {
          const classGradeVal = c.grade_name ? c.grade_name.replace('Grade', 'Class') : `Class ${c.grade}`;
          return studentGradeVal === classGradeVal &&
                 (entity.section || '').toUpperCase() === (c.section || '').toUpperCase() &&
                 (entity.academic_year || '').replace(" ", "") === (c.academic_year || '').replace(" ", "");
        });
        if (matchedClass) matchedClassId = matchedClass.class_id;
      }
      const defaultSchoolAcademicYear = schools[0]?.academic_year || '2026-2027';
      setStudentForm(entity ? {
        class_id: matchedClassId,
        username: entity.username || '', password: '',
        email: entity.email || '', full_name: entity.full_name || '',
        roll_no: entity.roll_no || '',
        grade: entity.grade ? (entity.grade.startsWith('Grade') ? entity.grade.replace('Grade', 'Class') : entity.grade) : '',
        section: entity.section || '',
        academic_year: entity.academic_year || defaultSchoolAcademicYear,
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : { class_id: '', username: '', password: '', email: '', full_name: '', roll_no: '', grade: '', section: '', academic_year: defaultSchoolAcademicYear, is_active: true });
    } else if (tab === 'classes') {
      const defaultSchoolAcademicYear = schools[0]?.academic_year || '2026-2027';
      const extractedSec = entity && entity.class_name && ['A','B','C','D'].includes(entity.class_name.slice(-1).toUpperCase()) ? entity.class_name.slice(-1).toUpperCase() : 'A';
      const defaultGradeId = grades[0]?.id || '';
      const defaultGradeNum = grades[0] ? (grades[0].grade_name.match(/\d+/)?.[0] || '3') : '3';
      setClassForm(entity ? {
        class_name: entity.class_name || '',
        school: entity.school || (schools[0]?.school_id || ''),
        grade: entity.grade || defaultGradeId,
        section: extractedSec,
        academic_year: entity.academic_year || defaultSchoolAcademicYear,
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : {
        class_name: `Class ${defaultGradeNum}-A`, school: schools[0]?.school_id || '',
        grade: defaultGradeId, section: 'A', academic_year: defaultSchoolAcademicYear, is_active: true
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
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setSelectedFileName(file.name);
    setUploadSummary(null);
    setErrorMsg('');
  };

  const handleBulkImport = async () => {
    if (!selectedFile) return;
    setErrorMsg('');
    setSuccessMsg('');
    setUploadSummary(null);
    setActionLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
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
      setSelectedFile(null);
      setSelectedFileName('');
    }
  };

  const handleDownloadTemplate = async (type) => {
    try {
      const res = await apiFetch(`/api/cms/v1/bulk-upload/?type=${type}`);
      if (!res.ok) { setErrorMsg('Failed to download template.'); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_import_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('Failed to download template.');
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
    if (profileForm.phone_no && profileForm.phone_no.replace(/\D/g, '').length !== 10) {
      setErrorMsg('Phone number must be exactly 10 numeric digits.');
      return;
    }
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

  const getFilteredClasses = () => {
    return classes.filter(c => {
      if (tchClassFilter) {
        const name = c.class_name || '';
        const match = name.match(/\d+/);
        const gradeNum = match ? match[0] : '';
        if (gradeNum !== tchClassFilter) return false;
      }
      if (tchSectionFilter) {
        const sec = c.section ? c.section.replace('Section', '').trim() : '';
        if (sec !== tchSectionFilter) return false;
      }
      return true;
    });
  };

  const getFilteredStudents = () => {
    let list = students;
    if (studentClassFilter) {
      list = list.filter(s => {
        const gradeVal = s.grade ? String(s.grade).replace('Grade', 'Class').replace(' ', '').toUpperCase() : '';
        const filterVal = String(studentClassFilter).replace('Grade', 'Class').replace(' ', '').toUpperCase();
        return gradeVal === filterVal;
      });
    }
    if (studentSectionFilter) {
      list = list.filter(s => {
        const secVal = s.section ? String(s.section).replace('Section', '').trim().toUpperCase() : '';
        const filterVal = String(studentSectionFilter).toUpperCase();
        return secVal === filterVal;
      });
    }
    return filterList(list);
  };

  const handleExportStudents = () => {
    const list = getFilteredStudents();
    if (list.length === 0) {
      showFeedback('No students to export', 'warning');
      return;
    }
    
    // Headers
    const headers = ['Full Name', 'Roll No', 'LMS Login Code', 'Class', 'Section', 'Academic Year', 'Status'];
    
    // Helper to escape CSV values
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const rows = list.map(s => {
      const fullName = s.full_name || s.username || 'N/A';
      const rollNo = s.roll_no || 'N/A';
      const loginCode = s.username || 'N/A';
      const className = s.grade ? (String(s.grade).startsWith('Class') || String(s.grade).startsWith('Grade') ? String(s.grade).replace('Grade', 'Class') : `Class ${s.grade}`) : 'N/A';
      const section = s.section ? (String(s.section).startsWith('Section') ? s.section : `Section ${s.section}`) : 'N/A';
      const academicYear = s.academic_year || '2025 - 2026';
      const status = s.is_active ? 'Active' : 'Inactive';
      
      return [
        escapeCSV(fullName),
        escapeCSV(rollNo),
        escapeCSV(loginCode),
        escapeCSV(className),
        escapeCSV(section),
        escapeCSV(academicYear),
        escapeCSV(status)
      ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  const goTo = (tab) => {
    setActiveSubTab(tab);
    setSearchQuery('');
    setTchClassFilter('');
    setTchSectionFilter('');
    setStudentClassFilter('');
    setStudentSectionFilter('');
    setIsSidebarOpen(false);
    setStudentPage(1);
    setClassPage(1);
    setShowClassCrudDetailModal(false);
    setShowStudentCrudDetailModal(false);
  };

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
    <div className="sd-layout" style={{ backgroundImage: `url(${teacherBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* ── Scoped Teacher Dashboard Luminous Slate Theme Styling ── */}
      <style>{`
         :root {
          --main-bg: #e5ecf4 !important; 
          --accent: #2563eb !important;  
          --accent-hover: #1d4ed8 !important;
          --sidebar-bg-top: #006aa6;
          --sidebar-bg-bot: #005080;
        }

        .sd-main {
          background-image: none !important;
          background-color: transparent !important;
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
          width: 260px;
        }

        .sd-brand {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 1.75rem 1.5rem 1.5rem;
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
          padding: 1.5rem 1rem;
          gap: 4px !important;
        }
        .sd-nav-item {
          color: rgba(255, 255, 255, 0.9) !important;
          padding: 0.75rem 1rem;
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
          grid-template-columns: repeat(3, 1fr) !important;
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
      <aside
        className={`sd-sidebar${isSidebarOpen ? ' open' : ''}`}
        style={{
          width: navCollapsed ? '72px' : '260px',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: showProfileDropdown ? 'visible' : 'hidden'
        }}
      >
        {/* Brand */}
        <div
          className="sd-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: navCollapsed ? 'center' : 'space-between',
            gap: '0.75rem',
            padding: navCollapsed ? '1rem 0.5rem' : '1.75rem 1.5rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden'
          }}
        >
          {!navCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={logoIcon} alt="Logo" style={{ width: '48px', height: '76px', objectFit: 'contain' }} />
              <div>
                <div className="sd-brand-name">LinguaLab</div>
                <div className="sd-brand-sub">Teacher Portal</div>
              </div>
            </div>
          ) : (
            <img 
              src={roundLogo} 
              alt="Logo" 
              onClick={toggleNavCollapsed} 
              style={{ width: '28px', height: '28px', objectFit: 'contain', cursor: 'pointer' }} 
              title="Expand sidebar"
            />
          )}
          {!navCollapsed && (
            <button
              onClick={toggleNavCollapsed}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.75)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              title={navCollapsed ? 'Expand sidebar' : 'Close sidebar'}
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="sd-nav" style={{ padding: navCollapsed ? '1rem 0.5rem' : '1.5rem 1rem' }}>
          <button className={`sd-nav-item${activeSubTab === 'overview'  ? ' active' : ''}`} onClick={() => goTo('overview')} title={navCollapsed ? 'Dashboard' : undefined} style={navCollapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}>
            <FiGrid/>{!navCollapsed && <span>Dashboard</span>}
          </button>
          <button className={`sd-nav-item${activeSubTab === 'students'  ? ' active' : ''}`} onClick={() => goTo('students')} title={navCollapsed ? 'Students' : undefined} style={navCollapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}>
            <FiUsers/>{!navCollapsed && <span>Students</span>}
          </button>
          <button className={`sd-nav-item${activeSubTab === 'classes'   ? ' active' : ''}`} onClick={() => goTo('classes')} title={navCollapsed ? 'Classes' : undefined} style={navCollapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}>
            <FiBookOpen/>{!navCollapsed && <span>Classes</span>}
          </button>
          <button className={`sd-nav-item${activeSubTab === 'reports'   ? ' active' : ''}`} onClick={() => goTo('reports')} title={navCollapsed ? 'Reports' : undefined} style={navCollapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}>
            <FiBarChart2/>{!navCollapsed && <span>Reports</span>}
          </button>
          <button className={`sd-nav-item${activeSubTab === 'profile'   ? ' active' : ''}`} onClick={() => goTo('profile')} title={navCollapsed ? 'Profile Settings' : undefined} style={navCollapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}>
            <FiUser/>{!navCollapsed && <span>Profile Settings</span>}
          </button>
        </nav>

        {/* Sidebar bottom: user card with logout icon */}
        <div className="sd-sidebar-bottom" style={{ position: 'relative', padding: navCollapsed ? '0.5rem' : '0.75rem' }}>
          {showProfileDropdown && (
            <div style={{
              position: 'absolute',
              bottom: navCollapsed ? '10px' : '100%',
              left: navCollapsed ? '76px' : '0.5rem',
              right: navCollapsed ? 'auto' : '0.5rem',
              width: navCollapsed ? '180px' : 'auto',
              background: '#095d8f',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '6px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginBottom: navCollapsed ? '0' : '8px'
            }} onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => { goTo('profile'); setShowProfileDropdown(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <FiUser style={{ fontSize: '1rem', color: '#cbd5e1' }} />
                <span>View Profile</span>
              </button>
              <button 
                onClick={() => { setShowProfileDropdown(false); onLogout(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <FiLogOut style={{ fontSize: '1rem', color: '#f87171' }} />
                <span>Logout</span>
              </button>
            </div>
          )}

          <div
            className="sd-user-card"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: navCollapsed ? 'center' : 'flex-start',
              padding: navCollapsed ? '0.5rem' : '0.75rem 1rem',
              gap: '0.75rem',
              transition: 'all 0.2s',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)'
            }}
            onClick={(e) => { e.stopPropagation(); setShowProfileDropdown(!showProfileDropdown); }}
          >
            <div className="sd-user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <UserAvatar user={user} size="small" initials="TE" />
            </div>
            {!navCollapsed && (
              <>
                <div className="sd-user-meta" style={{ flex: 1, minWidth: 0 }}>
                  <div className="sd-user-name" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profileForm.full_name || user?.full_name || user?.username || 'Teacher'}</div>
                  <div className="sd-user-role" style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>Teacher</div>
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.75)', display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                  <FiChevronDown />
                </div>
              </>
            )}
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
                    <button style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }} onClick={handleMarkAllRead}>Mark all read</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '10px 0' }}>No new notifications.</span>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{ padding: '8px', borderRadius: '6px', backgroundColor: n.read ? 'transparent' : '#f0fdf4', borderLeft: n.read ? 'none' : '3px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', textAlign: 'left' }}>
                           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                             <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: n.read ? 600 : 700 }}>{n.title || 'Notification'}</span>
                             <span style={{ fontSize: '0.75rem', color: '#475569' }}>{n.message || n.text}</span>
                             <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.time || new Date(n.created_at).toLocaleDateString()}</span>
                           </div>
                           <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }} title="Delete">
                             <FiX size={14} />
                           </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '10px', paddingTop: '8px', textAlign: 'center' }}>
                    <button style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setShowNotifDropdown(false); setShowNotifModal(true); }}>View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            <button className="sd-icon-btn" onClick={() => setShowHelpModal(true)} title="Help & Support"><FiHelpCircle/></button>
          </div>
        </div>

        {/* ── Page Content ── */}
        <div className={`sd-content${activeSubTab === 'overview' ? ' sd-content--dashboard' : ''}`} style={{ position: 'relative' }}>

          {/* Floating Toast Alerts */}
          {successMsg && (
            <div
              style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 99999,
                padding: '12px 20px',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              }}
            >
              <span>✅</span>
              <span>{successMsg}</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', color: 'inherit', display: 'flex', alignItems: 'center' }} onClick={() => setSuccessMsg('')}><FiX/></button>
            </div>
          )}
          {errorMsg && (
            <div
              style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 99999,
                padding: '12px 20px',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', color: 'inherit', display: 'flex', alignItems: 'center' }} onClick={() => setErrorMsg('')}><FiX/></button>
            </div>
          )}

          {/* ══════════ OVERVIEW / DASHBOARD ══════════ */}
          {activeSubTab === 'overview' && !isAnyOverlayOpen && (
            <>
              {/* Premium Dashboard Header Card with Background Image */}
              <div className="sd-dashboard-header-card" style={{ backgroundImage: `url(${teacherHeaderBanner})` }}>
                <div className="sd-header-text-section">
                   <h1>{getGreeting()}, {profileForm.full_name || profileForm.username || user?.full_name || user?.username || 'Teacher'}!</h1>
                  <p>Manage classes, track student progress, coordinate learning scenarios, and review academic performance.</p>
                </div>
              </div>

              {/* Stat cards */}
              <div className="sd-stat-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[
                  { label: 'Assigned Classes', value: statClasses, color: '#22c55e', bg: '#dcfce7', icon: <FiBookOpen /> },
                  { label: 'Total Students', value: statStudents, color: '#3b82f6', bg: '#dbeafe', icon: <FiUsers /> },
                  { label: 'Active Lessons', value: statExperiences, color: '#a855f7', bg: '#f3e8ff', icon: <FiFileText /> },


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

              {/* Recent Activity */}
              <div className="sd-bottom-grid" style={{ gridTemplateColumns: '1fr', marginTop: '1.5rem' }}>
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div className="sd-card-title">Recent Activity</div>
                    <button className="sd-view-all" onClick={() => setShowRecentActivityModal(true)}>View All</button>
                  </div>
                  <div className="sd-activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {data?.recent_activities?.length ? (
                      data.recent_activities.slice(0, 6).map((act, i) => (
                        <div className="sd-activity-item" key={act.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                            <div className="sd-activity-icon-container" style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '0.85rem' }}>
                              ST
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div className="sd-activity-desc" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.message}</div>
                              <div className="sd-activity-meta" style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>{new Date(act.timestamp).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <span className="sd-activity-badge" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: '#ffedd5', color: '#ea580c', flexShrink: 0 }}>
                            Student
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="sd-empty-state" style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No recent activity yet.
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
          {activeSubTab === 'students' && !isAnyOverlayOpen && (
            <>
              
              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <div className="sd-table-search" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '300px' }}>
                    <FiSearch/>
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setStudentPage(1); }}
                    />
                  </div>
                  <select
                    className="sd-form-input"
                    style={{ width: '130px', height: '38px', padding: '0 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    value={studentClassFilter}
                    onChange={e => { setStudentClassFilter(e.target.value); setStudentPage(1); }}
                  >
                    <option value="">All Classes</option>
                    {[3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={`Class ${num}`}>Class {num}</option>
                    ))}
                  </select>

                  <select
                    className="sd-form-input"
                    style={{ width: '130px', height: '38px', padding: '0 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    value={studentSectionFilter}
                    onChange={e => { setStudentSectionFilter(e.target.value); setStudentPage(1); }}
                  >
                    <option value="">All Sections</option>
                    {['A', 'B', 'C', 'D'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>

                  <div className="sd-table-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="sd-btn-outline"
                      style={{
                        background: isSelectModeStudents ? '#e2e8f0' : '#ffffff',
                        color: '#374151',
                        borderColor: '#cbd5e1'
                      }}
                      onClick={() => {
                        setIsSelectModeStudents(!isSelectModeStudents);
                        if (isSelectModeStudents) setSelectedStudentIds([]);
                      }}
                    >
                      {isSelectModeStudents ? '✓ Done Selecting' : 'Select'}
                    </button>
                    {selectedStudentIds.length > 0 && (
                      <button className="sd-btn-outline" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleBulkDeleteStudents}>
                        <FiTrash2/> Delete Selected ({selectedStudentIds.length})
                      </button>
                    )}
                    <button className="sd-btn-outline" onClick={() => { setImportActive(!importActive); setUploadSummary(null); }}>
                      Excel Import
                    </button>
                    <button className="sd-btn-outline" onClick={handleExportStudents} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiDownload /> Export
                    </button>
                    <button className="sd-btn-primary" onClick={openAddModal}><FiPlus/>Add Student</button>
                  </div>
                </div>

                {importActive && (
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Bulk Import Students</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                          Upload a file to import many students at once. Supported formats: Excel (.xlsx/.xls).
                        </p>
                      </div>
                      <button
                        className="sd-btn-cancel"
                        style={{ marginLeft: '1rem', flexShrink: 0 }}
                        onClick={() => { setImportActive(false); setUploadSummary(null); setSelectedFile(null); setSelectedFileName(''); }}
                      >
                        <FiX /> Close
                      </button>
                    </div>

                    {/* Expected columns table */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginTop: '1rem' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.85rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0'
                      }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>Expected columns</span>
                        <button
                          className="sd-btn-outline"
                          style={{ fontSize: '0.82rem', gap: '0.4rem', display: 'flex', alignItems: 'center' }}
                          onClick={() => handleDownloadTemplate('student')}
                        >
                          <FiUpload style={{ transform: 'rotate(180deg)' }} /> Download Template
                        </button>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ textAlign: 'left', padding: '0.6rem 1.25rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>Column</th>
                            <th style={{ textAlign: 'left', padding: '0.6rem 1.25rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>Required</th>
                            <th style={{ textAlign: 'left', padding: '0.6rem 1.25rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { col: 'fullname', req: true, desc: 'Full name of the student' },
                            { col: 'class', req: true, desc: 'Class/Grade name' },
                            { col: 'section', req: true, desc: 'Section (e.g. A, B, C)' },
                            { col: 'roll no', req: true, desc: 'Roll number' },
                            { col: 'status', req: true, desc: 'Status (e.g. active, inactive)' },
                            { col: 'academy year', req: true, desc: 'Academic year (e.g. 2025-2026)' },
                          ].map((item, idx) => (
                            <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.55rem 1.25rem' }}>
                                <code style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', fontSize: '0.82rem', color: '#334155', fontFamily: 'monospace' }}>{item.col}</code>
                              </td>
                              <td style={{ padding: '0.55rem 1.25rem' }}>
                                <span style={{
                                  display: 'inline-block', padding: '2px 10px', borderRadius: '4px',
                                  fontSize: '0.75rem', fontWeight: 600,
                                  background: item.req ? '#dbeafe' : '#f1f5f9',
                                  color: item.req ? '#1d4ed8' : '#64748b',
                                }}>{item.req ? 'Required' : 'Optional'}</span>
                              </td>
                              <td style={{ padding: '0.55rem 1.25rem', color: '#475569' }}>{item.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ padding: '0.75rem 1.25rem', background: '#fffbeb', borderTop: '1px solid #fef3c7', fontSize: '0.8rem', color: '#92400e' }}>
                        LMS login code is auto-generated from <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: '3px' }}>fullname</code>.
                      </div>
                    </div>

                    {/* File upload section */}
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Student File</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={handleFileSelect}
                          disabled={actionLoading}
                          style={{ display: 'none' }}
                          id="teacher-bulk-upload-student-input"
                        />
                        <label htmlFor="teacher-bulk-upload-student-input" className="sd-btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          Choose File
                        </label>
                        <span style={{ color: '#64748b', fontSize: '0.84rem' }}>{selectedFileName || 'No file selected'}</span>
                      </div>
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Supported formats: .xlsx, .xls</p>
                    </div>

                    <div style={{ marginTop: '1.25rem' }}>
                      <button
                        className="sd-btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        disabled={!selectedFile || actionLoading}
                        onClick={handleBulkImport}
                      >
                        <FiUpload /> {actionLoading ? 'Importing...' : 'Import Students'}
                      </button>
                    </div>

                    {uploadSummary && (
                      <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px', textAlign: 'left', fontSize: '0.84rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Upload Result:</div>
                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>Created: {uploadSummary.created}</span>
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Failed: {uploadSummary.failed}</span>
                        </div>
                        {uploadSummary.errors && uploadSummary.errors.length > 0 && (
                          <div style={{ maxHeight: '120px', overflowY: 'auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem' }}>
                            {uploadSummary.errors.map((err, idx) => (
                              <div key={idx} style={{ color: '#b91c1c', marginBottom: '0.25rem' }}>Row {err.row}: {err.error}</div>
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
                        {isSelectModeStudents && (
                          <th className="sd-checkbox-cell">
                            <input
                              type="checkbox"
                              checked={students.length > 0 && selectedStudentIds.length === getFilteredStudents().length}
                              onChange={handleSelectAllStudents}
                            />
                          </th>
                        )}
                        <th>Full Name</th>
                        <th>Roll No</th>
                        <th>LMS Login Code</th>
                        <th>Class</th>
                        <th>Section</th>
                        <th style={{ textAlign: 'center' }}>Academic Year</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(getFilteredStudents(), studentPage).map((s, i) => {
                        const sid = s.student_id || s.id;
                        return (
                          <tr key={sid || i}>
                            {isSelectModeStudents && (
                              <td className="sd-checkbox-cell">
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.includes(sid)}
                                  onChange={() => handleSelectStudentRow(sid)}
                                />
                              </td>
                            )}
                            <td>
                              <span className="sd-name-cell-primary">{s.full_name || 'N/A'}</span>
                            </td>
                            <td>{s.roll_no || 'N/A'}</td>
                            <td><span style={{ fontWeight: 600, color: '#0b75b3', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{s.username || 'N/A'}</span></td>
                            <td>{s.grade ? (String(s.grade).startsWith('Class') || String(s.grade).startsWith('Grade') ? String(s.grade).replace('Grade', 'Class') : `Class ${s.grade}`) : 'N/A'}</td>
                            <td>{s.section ? (String(s.section).startsWith('Section') ? s.section : `Section ${s.section}`) : 'N/A'}</td>
                            <td style={{ textAlign: 'center' }}>{s.academic_year || '2025 - 2026'}</td>
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
                                        color: '#4f46e5',
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
                      {getFilteredStudents().length === 0 && (
                        <tr>
                          <td colSpan={isSelectModeStudents ? "7" : "6"} className="sd-empty-state">No students found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={getFilteredStudents().length} perPage={PER_PAGE} page={studentPage} onPage={setStudentPage}/>
              </div>
            </>
          )}

          {/* ══════════ CLASSES TAB ══════════ */}
          {activeSubTab === 'classes' && !isAnyOverlayOpen && (
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
                  <div className="sd-table-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {selectedClassIds.length > 0 && (
                      <button className="sd-btn-outline" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleBulkDeleteClasses}>
                        <FiTrash2/> Delete Selected ({selectedClassIds.length})
                      </button>
                    )}
                    <select
                      className="sd-form-input"
                      style={{ width: '130px', height: '38px', padding: '0 0.5rem', fontSize: '0.82rem', borderRadius: '8px' }}
                      value={tchClassFilter}
                      onChange={e => { setTchClassFilter(e.target.value); setClassPage(1); }}
                    >
                      <option value="">All Classes</option>
                      {[3, 4, 5, 6, 7, 8].map(n => (
                        <option key={n} value={String(n)}>Class {n}</option>
                      ))}
                    </select>

                    <select
                      className="sd-form-input"
                      style={{ width: '130px', height: '38px', padding: '0 0.5rem', fontSize: '0.82rem', borderRadius: '8px' }}
                      value={tchSectionFilter}
                      onChange={e => { setTchSectionFilter(e.target.value); setClassPage(1); }}
                    >
                      <option value="">All Sections</option>
                      {['A', 'B', 'C', 'D'].map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                      <col style={{ width: '16.6%' }} />
                      <col style={{ width: '16.6%' }} />
                      <col style={{ width: '16.7%' }} />
                      <col style={{ width: '16.7%' }} />
                      <col style={{ width: '16.7%' }} />
                      <col style={{ width: '16.7%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th style={{ textAlign: 'center' }}>Section</th>
                        <th>Assigned Teachers</th>
                        <th style={{ textAlign: 'center' }}>Academic Year</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(getFilteredClasses()), classPage).map((c, i) => {
                        const cid = c.class_id || c.id;
                        return (
                          <tr key={cid || i}>
                            <td>
                              <span className="sd-name-cell-primary">{c.class_name ? String(c.class_name).replace('Grade', 'Class').split('-')[0].trim() : '—'}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontWeight: 600, color: '#4f46e5', background: '#ede9fe', padding: '2px 10px', borderRadius: '20px', fontSize: '0.82rem' }}>
                                {c.section ? (c.section.startsWith('Section') ? c.section : `Section ${c.section}`) : (c.class_name && c.class_name.includes('-') ? `Section ${c.class_name.split('-').pop().trim()}` : '—')}
                              </span>
                            </td>
                            <td>{c.teacher_name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>}</td>
                            <td style={{ textAlign: 'center' }}>{c.academic_year}</td>
                            <td style={{ textAlign: 'center', overflow: 'visible', textOverflow: 'clip' }}>
                              <span className={`sd-badge ${c.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                                {c.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="sd-action-cell" style={{ justifyContent: 'center' }}>
                                <button className="sd-icon-action view" style={{ color: '#0b75b3' }} onClick={() => handleViewClassCrud(c.class_id || c.id)} title="View">
                                  <FiEye/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filterList(getFilteredClasses()).length === 0 && (
                        <tr><td colSpan="6" className="sd-empty-state">No classes found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={filterList(getFilteredClasses()).length} perPage={PER_PAGE} page={classPage} onPage={setClassPage}/>
              </div>
            </>
          )}

          {/* ══════════ REPORTS TAB ══════════ */}
          {activeSubTab === 'reports' && !isAnyOverlayOpen && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Student Performance Reports</h1>
                <p className="sd-page-sub">Monitor evaluation metrics and student progression.</p>
              </div>

              <div className="sd-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <FiBarChart2 style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>No Reports Available</h3>
                <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto' }}>
                  Student progression and evaluation reports will appear here once assignments are completed and submitted.
                </p>
              </div>
            </>
          )}

{/* ══════════ PROFILE TAB ══════════ */}
          {activeSubTab === 'profile' && !isAnyOverlayOpen && (
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
                      style={{ position: 'relative', margin: '0.5rem 0' }}
                    >
                      <div style={{ width: '96px', height: '96px', borderRadius: '50%', border: '4px solid #eff6ff', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(11, 117, 179, 0.2)', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserAvatar user={user} size="large" initials="U" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowAvatarMenu(!showAvatarMenu); }}
                        style={{ position: 'absolute', bottom: 0, right: 0, background: '#0b75b3', color: '#fff', padding: '0.45rem', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '2px solid #fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                        title="Edit Profile Picture"
                      >
                        <FiEdit2 />
                      </button>

                      {showAvatarMenu && (
                        <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', width: '150px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100, padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAvatarMenu(false);
                              document.getElementById('profile-avatar-input').click();
                            }}
                            style={{ background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', color: '#334155', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FiUpload size={14} /> Upload New
                          </button>
                          {user?.profile_picture && user.profile_picture.toLowerCase() !== 'avatar' && !user.profile_picture.toLowerCase().endsWith('/avatar') && !user.profile_picture.toLowerCase().endsWith('/avatar/') && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowAvatarMenu(false);
                                handleRemoveAvatar();
                              }}
                              style={{ background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', color: '#ef4444', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <FiTrash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <input 
                      type="file" 
                      id="profile-avatar-input" 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                    />
                    
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
                          maxLength={10}
                          value={profileForm.phone_no || ''}
                          onChange={e => {
                            const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setProfileForm({ ...profileForm, phone_no: cleaned });
                          }}
                          placeholder="Enter 10 digit phone number" 
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
          {/* ════════════════════
              CRUD MODAL (Students / Classes) - RENDERED AS INLINE PAGE
              ════════════════════ */}
          {showModal && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', minHeight: '600px', backgroundColor: 'transparent', zIndex: 900, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem', padding: 0 }}
                >
                  ← Back to {activeSubTab === 'students' ? 'Students' : 'Classes'}
                </button>
              </div>
              <div className="sd-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {modalType === 'add' ? 'Add' : 'Edit'} {activeSubTab === 'students' ? 'Student' : 'Class'}
                  </h3>
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
                              username: modalType === 'add' ? generateRollNo(full_name, students) : prev.username
                            }));
                          }} required placeholder="e.g. Arjun Sharma"/>
                      </div>
                      <div className="sd-form-group">
                        <label className="sd-form-label">Roll No *</label>
                        <input className="sd-form-input" type="text" value={studentForm.roll_no}
                          onChange={e => setStudentForm({...studentForm, roll_no: e.target.value})} placeholder="e.g. 12" required/>
                      </div>
                    </div>
                    <div className="sd-form-row">
                      <div className="sd-form-group">
                        <label className="sd-form-label">LMS Login Code (Auto Generated)</label>
                        <input className="sd-form-input" type="text" value={studentForm.username || ''} readOnly style={{ backgroundColor:'#e2e8f0', cursor:'not-allowed' }}/>
                      </div>
                      <div className="sd-form-group">
                        <label className="sd-form-label">Class *</label>
                        <select className="sd-form-input" value={studentForm.class_id || ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (val) {
                              const selectedClass = classes.find(c => String(c.class_id) === String(val));
                              if (selectedClass) {
                                setStudentForm(prev => ({
                                  ...prev,
                                  class_id: val,
                                  grade: selectedClass.grade_name ? selectedClass.grade_name.replace('Grade', 'Class') : `Class ${selectedClass.grade}`,
                                  section: selectedClass.section || '',
                                  academic_year: selectedClass.academic_year || '2025 - 2026'
                                }));
                              }
                            } else {
                              setStudentForm(prev => ({
                                ...prev,
                                class_id: '',
                                grade: '',
                                section: '',
                                academic_year: '2025 - 2026'
                              }));
                            }
                          }} required>
                          <option value="">-- Select Class --</option>
                          {classes.map(c => (
                            <option key={c.class_id} value={c.class_id}>{c.class_name} ({c.academic_year})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="sd-form-row">
                      <div className="sd-form-group">
                        <label className="sd-form-label">Section</label>
                        <input className="sd-form-input" type="text" value={studentForm.section || ''} readOnly style={{ backgroundColor:'#e2e8f0', cursor:'not-allowed' }} placeholder="Auto-populated from Class"/>
                      </div>
                      <div className="sd-form-group">
                        <label className="sd-form-label">Academic Year</label>
                        <input className="sd-form-input" type="text" value={studentForm.academic_year || ''} readOnly style={{ backgroundColor:'#e2e8f0', cursor:'not-allowed' }} placeholder="Auto-populated from Class"/>
                      </div>
                    </div>

                    <label className="sd-checkbox-label" style={{marginTop:'0.5rem'}}>
                      <input type="checkbox" checked={studentForm.is_active}
                        onChange={e => setStudentForm({ ...studentForm, is_active: e.target.checked })}/>
                      Account is Active
                    </label>
                   
                  </>)}

                  {/* Class fields */}
                  {activeSubTab === 'classes' && (<>
                    <div className="sd-form-row">
                      <div className="sd-form-group">
                        <label className="sd-form-label">Class *</label>
                        <select className="sd-form-input" value={classForm.grade || ''}
                          onChange={e => {
                            const selectedGradeId = parseInt(e.target.value);
                            const gObj = grades.find(g => g.id === selectedGradeId);
                            const match = gObj ? gObj.grade_name.match(/\d+/) : null;
                            const num = match ? match[0] : selectedGradeId;
                            const sec = classForm.section || 'A';
                            setClassForm({
                              ...classForm,
                              grade: selectedGradeId,
                              class_name: `Class ${num}-${sec}`
                            });
                          }} required>
                          <option value="">-- Select Class --</option>
                          {grades.map(g => {
                            const match = g.grade_name.match(/\d+/);
                            const num = match ? match[0] : g.id;
                            return (
                              <option key={g.id} value={g.id}>Class {num}</option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="sd-form-group">
                        <label className="sd-form-label">Section *</label>
                        <select className="sd-form-input" value={classForm.section || 'A'}
                          onChange={e => {
                            const selectedSecVal = e.target.value;
                            const gObj = grades.find(g => g.id === classForm.grade);
                            const match = gObj ? gObj.grade_name.match(/\d+/) : null;
                            const num = match ? match[0] : (classForm.grade || 3);
                            setClassForm({
                              ...classForm,
                              section: selectedSecVal,
                              class_name: `Class ${num}-${selectedSecVal}`
                            });
                          }} required>
                          {['A', 'B', 'C', 'D'].map(letter => (
                            <option key={letter} value={letter}>Section {letter}</option>
                          ))}
                        </select>
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
                        <label className="sd-form-label">Academic Year *</label>
                        <input className="sd-form-input" type="text" maxLength={9} value={classForm.academic_year || ''}
                          onChange={e => {
                            const clean = e.target.value.replace(/\D/g, '').slice(0, 8);
                            const formatted = clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
                            setClassForm({ ...classForm, academic_year: formatted });
                          }} placeholder="2026-2027" required/>
                      </div>
                    </div>
                    <label className="sd-checkbox-label">
                      <input type="checkbox" checked={classForm.is_active}
                        onChange={e => setClassForm({ ...classForm, is_active: e.target.checked })}/>
                      Class is Active
                    </label>
                  </>)}

                  <div className="sd-modal-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.5rem', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" className="sd-btn-cancel" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="sd-btn-save" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : modalType === 'add' ? 'Create' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Class CRUD Detail Modal ── */}
          {showClassCrudDetailModal && selectedClassCrudDetail && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', minHeight: '600px', backgroundColor: 'transparent', zIndex: 900, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => setShowClassCrudDetailModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem', padding: 0 }}
                >
                  ← Back to Classes
                </button>
              </div>
              <div className="sd-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Class Details</h3>
                </div>
                <div style={{ padding: '0.5rem 0', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Class:</span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{grades.find(g => g.id === selectedClassCrudDetail.grade)?.grade_name ? String(grades.find(g => g.id === selectedClassCrudDetail.grade)?.grade_name).replace('Grade', 'Class') : selectedClassCrudDetail.grade || 'N/A'}</span>
                    
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Section:</span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedClassCrudDetail.section ? (selectedClassCrudDetail.section.startsWith('Section') ? selectedClassCrudDetail.section : `Section ${selectedClassCrudDetail.section}`) : (selectedClassCrudDetail.class_name && selectedClassCrudDetail.class_name.includes('-') ? `Section ${selectedClassCrudDetail.class_name.split('-').pop().trim()}` : '—')}</span>
                    
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

                  <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiBookOpen style={{ color: '#4f46e5' }} /> Assigned Lessons
                    </h4>
                    {selectedClassCrudDetail.assigned_lessons && selectedClassCrudDetail.assigned_lessons.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
                        {selectedClassCrudDetail.assigned_lessons.map((lesson, idx) => (
                          <div
                            key={lesson.id || idx}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              padding: '0.75rem 1rem',
                              background: '#f8fafc',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                              {lesson.experience_title}
                            </span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                              <span>Ref: {lesson.experience_ref}</span>
                              <span>Assigned: {new Date(lesson.assigned_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      }
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No lessons assigned to this class or grade.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Student CRUD Detail Modal ── */}
          {showStudentCrudDetailModal && selectedStudentCrudDetail && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', minHeight: '600px', backgroundColor: 'transparent', zIndex: 900, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => setShowStudentCrudDetailModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem', padding: 0 }}
                >
                  ← Back to Students
                </button>
              </div>
              <div className="sd-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Student Details</h3>
                </div>
                <div style={{ padding: '0.5rem 0', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Full Name:</span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedStudentCrudDetail.full_name || 'N/A'}</span>
                    
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Roll No:</span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedStudentCrudDetail.roll_no || 'N/A'}</span>
                    
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Class:</span>
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
              </div>
            </div>
          )}

        </div>{/* /sd-content */}
      </main>



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
                <div style={{ position: 'relative' }}>
                  <input className="sd-form-input" type={showCurrentPassword ? "text" : "password"}
                    value={pwForm.current_password}
                    onChange={e => { setPwForm({ ...pwForm, current_password: e.target.value }); setPwModalError(''); }}
                    placeholder="Enter current password" required style={{ width: '100%', paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    {showCurrentPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <div className="sd-form-group">
                <label className="sd-form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="sd-form-input" type={showNewPassword ? "text" : "password"}
                    value={pwForm.new_password}
                    onChange={e => { setPwForm({ ...pwForm, new_password: e.target.value }); setPwModalError(''); }}
                    placeholder="Minimum 6 characters" required minLength={6} style={{ width: '100%', paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <div className="sd-form-group">
                <label className="sd-form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="sd-form-input" type={showConfirmPassword ? "text" : "password"}
                    value={pwForm.confirm_password}
                    onChange={e => { setPwForm({ ...pwForm, confirm_password: e.target.value }); setPwModalError(''); }}
                    placeholder="Confirm new password" required minLength={6} style={{ width: '100%', paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
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



      {/* ── Help & Support Modal ── */}
      <HelpSupportModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {cropImageSrc && (
        <AvatarCropperModal 
          src={cropImageSrc}
          onCrop={handleCropSave}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

      {showNotifModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundImage: `url(${teacherBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: 'transparent', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(15,23,42,0.08)', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#4f46e5', color: '#ffffff', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <FiBell />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Teacher Notifications</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Stay updated with class notifications</p>
                </div>
              </div>
              <button style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }} onClick={() => setShowNotifModal(false)}>
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', justifyContent: 'center', flex: 1, overflow: 'hidden', backgroundColor: 'transparent', padding: '24px' }}>
              {/* Left Column: Notifications */}
              <div style={{ width: '100%', maxWidth: '800px', padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#334155' }}>Recent Activity</h4>
                  {notifications.length > 0 && (
                    <button style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleClearAllNotifications}>
                      <FiTrash2 size={14} /> Clear all
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {notifications.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', gap: '8px' }}>
                      <FiBell size={36} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: '0.9rem' }}>All caught up! No notifications.</span>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: n.read ? '#ffffff' : '#f0fdf4', border: `1px solid ${n.read ? '#e2e8f0' : '#bbf7d0'}`, position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: n.read ? 600 : 700 }}>{n.title || 'Notification'}</span>
                          <span style={{ fontSize: '0.8rem', color: '#475569' }}>{n.message || n.text}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{n.time || new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {!n.read && (
                            <button style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }} onClick={async () => {
                              try {
                                await apiFetch('/api/v1/dashboard/notifications', { method: 'POST' });
                                setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true } : item));
                              } catch (e) { console.error(e); }
                            }}>
                              Mark read
                            </button>
                          )}
                          <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.8, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleDeleteNotification(n.id)} title="Delete">
                            <FiX size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRecentActivityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundImage: `url(${teacherBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(15, 23, 42, 0.08)', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: '#ea580c', color: '#ffffff', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                <FiClock />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Recent Activity History</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Detailed history of student enrollments and activity updates in your classes</p>
              </div>
            </div>
            <button style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowRecentActivityModal(false)}>
              <FiX size={18} />
            </button>
          </div>
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: 'transparent' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', padding: '24px' }}>
              {!data?.recent_activities?.length ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <FiClock size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ margin: 0 }}>No recent activities found.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  {data.recent_activities.map((act, i) => {
                    const actDate = new Date(act.timestamp);
                    return (
                      <div key={act.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i === data.recent_activities.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            ST
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{act.message}</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>{actDate.toLocaleDateString()} at {actDate.toLocaleTimeString()}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', backgroundColor: '#ffedd5', color: '#ea580c' }}>
                          Student
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default TeacherDashboard;
