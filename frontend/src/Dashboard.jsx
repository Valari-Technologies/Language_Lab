import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiUsers, FiBookOpen, FiBarChart2, FiUser,
  FiSettings, FiHelpCircle, FiLogOut, FiSearch,
  FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiCalendar, FiBell, FiFilter,
  FiCheckCircle, FiMonitor, FiSmartphone, FiFileText,
  FiActivity, FiTrendingUp, FiAward, FiLock,
  FiChevronLeft, FiChevronRight, FiEye, FiList,
  FiCornerDownRight, FiXCircle
} from 'react-icons/fi';
import './SchoolDashboard.css';
import { apiFetch } from './api';

/* ─── SVG Donut Chart helper ─── */
const MultiDonutChart = ({ total = 124, activeCount = 110, expiringCount = 9, expiredCount = 5 }) => {
  const R = 46, CX = 60, CY = 60;
  const circ = 2 * Math.PI * R; // ~289.02
  const activePct = activeCount / total;
  const expiringPct = expiringCount / total;
  const expiredPct = expiredCount / total;

  const activeDash = activePct * circ;
  const expiringDash = expiringPct * circ;
  const expiredDash = expiredPct * circ;

  return (
    <svg viewBox="0 0 120 120" width="130" height="130" className="sd-donut-svg">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e8edf5" strokeWidth="8"/>
      {/* Active Segment (Green) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth="8"
        strokeDasharray={`${activeDash} ${circ}`}
        transform={`rotate(-90 ${CX} ${CY})`}
      />
      {/* Expiring Soon Segment (Orange) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f97316" strokeWidth="8"
        strokeDasharray={`${expiringDash} ${circ}`}
        transform={`rotate(${-90 + (activePct * 360)} ${CX} ${CY})`}
      />
      {/* Expired Segment (Red) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth="8"
        strokeDasharray={`${expiredDash} ${circ}`}
        transform={`rotate(${-90 + ((activePct + expiringPct) * 360)} ${CX} ${CY})`}
      />
      <text x={CX} y={CY - 5} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 15, fontWeight: 700, fill: '#0f172a', fontFamily: 'Outfit,Inter,sans-serif' }}>
        {total}
      </text>
      <text x={CX} y={CY + 10} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 8, fill: '#6b7280', fontWeight: 600, fontFamily: 'Outfit,Inter,sans-serif' }}>
        Total
      </text>
    </svg>
  );
};

/* ─── SVG Subscription Plan Distribution Donut helper ─── */
const DistributionDonutChart = () => {
  const R = 46, CX = 60, CY = 60;
  const circ = 2 * Math.PI * R; // ~289.02
  const basicPct = 0.363;
  const standardPct = 0.306;
  const premiumPct = 0.226;
  const enterprisePct = 0.081;
  const expiredPct = 0.024;

  const basicDash = basicPct * circ;
  const standardDash = standardPct * circ;
  const premiumDash = premiumPct * circ;
  const enterpriseDash = enterprisePct * circ;
  const expiredDash = expiredPct * circ;

  return (
    <svg viewBox="0 0 120 120" width="130" height="130" className="sd-donut-svg">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e8edf5" strokeWidth="8"/>
      {/* Basic (Blue) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3b82f6" strokeWidth="8"
        strokeDasharray={`${basicDash} ${circ}`}
        transform={`rotate(-90 ${CX} ${CY})`}
      />
      {/* Standard (Green) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth="8"
        strokeDasharray={`${standardDash} ${circ}`}
        transform={`rotate(${-90 + (basicPct * 360)} ${CX} ${CY})`}
      />
      {/* Premium (Orange) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f97316" strokeWidth="8"
        strokeDasharray={`${premiumDash} ${circ}`}
        transform={`rotate(${-90 + ((basicPct + standardPct) * 360)} ${CX} ${CY})`}
      />
      {/* Enterprise (Purple) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#a855f7" strokeWidth="8"
        strokeDasharray={`${enterpriseDash} ${circ}`}
        transform={`rotate(${-90 + ((basicPct + standardPct + premiumPct) * 360)} ${CX} ${CY})`}
      />
      {/* Expired (Red) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth="8"
        strokeDasharray={`${expiredDash} ${circ}`}
        transform={`rotate(${-90 + ((basicPct + standardPct + premiumPct + enterprisePct) * 360)} ${CX} ${CY})`}
      />
      <text x={CX} y={CY - 5} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 15, fontWeight: 700, fill: '#0f172a', fontFamily: 'Outfit,Inter,sans-serif' }}>
        124
      </text>
      <text x={CX} y={CY + 10} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 8, fill: '#6b7280', fontWeight: 600, fontFamily: 'Outfit,Inter,sans-serif' }}>
        TOTAL
      </text>
    </svg>
  );
};

/* ─── SVG Line Chart helper ─── */
const ActivityLineChart = () => {
  const W = 400, H = 120;
  const PAD = { top: 10, right: 12, bottom: 10, left: 12 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const pts = 5;
  const toX = (i) => PAD.left + (i / (pts - 1)) * chartW;
  const toY = (v) => PAD.top + chartH - (v / 8000) * chartH; // scale by 8K max

  // May 15, May 22, May 29, Jun 05, Jun 13
  const lineActive = [3800, 4800, 3200, 4200, 6000];
  const lineCompleted = [2000, 2600, 1800, 2900, 2100];

  const getPointsPath = (dataList) => {
    return dataList.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="140" preserveAspectRatio="none" className="sd-chart-svg">
      {[2000, 4000, 6000, 8000].map(v => (
        <line key={v} x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="#f3f4f6" strokeWidth="1"/>
      ))}
      <path d={getPointsPath(lineActive)} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {lineActive.map((v, i) => <circle key={`act-${i}`} cx={toX(i)} cy={toY(v)} r="3" fill="#6366f1"/>)}
      <path d={getPointsPath(lineCompleted)} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {lineCompleted.map((v, i) => <circle key={`comp-${i}`} cx={toX(i)} cy={toY(v)} r="3" fill="#22c55e"/>)}
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

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const Dashboard = ({ user, onLogout, activeTab, onTabChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('');

  /* ── Pagination ── */
  const [schoolsPage, setSchoolsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [gradesPage, setGradesPage] = useState(1);
  const [scenariosPage, setScenariosPage] = useState(1);
  const [scenarioBuildersPage, setScenarioBuildersPage] = useState(1);
  const [publishPage, setPublishPage] = useState(1);
  const PER_PAGE = 4;

  /* ── Data lists ── */
  const [grades, setGrades] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [scenarioBuilders, setScenarioBuilders] = useState([]);
  const [schools, setSchools] = useState([]);
  const [publishContents, setPublishContents] = useState([]);
  const [schoolAdmins, setSchoolAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ total_schools: 0, total_school_admins: 0, total_publish_contents: 0, total_grades: 0 });
  const [previewScenario, setPreviewScenario] = useState(null);
  const [subPage, setSubPage] = useState('overview');
  const [schoolSubTab, setSchoolSubTab] = useState('schools-list');
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [newSchoolForm, setNewSchoolForm] = useState({
    school_name: '', school_code: '', address: '', city: '', state: '', pincode: '',
    admin_name: '', email: '', mobile: ''
  });
  
  /* ── Forms ── */
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '', full_name: user?.full_name || '', current_password: '', password: '' });
  const [schoolForm, setSchoolForm] = useState({ school_name: '', address: '', phone: '', email: '', logo: '', is_active: true });
  const [publishForm, setPublishForm] = useState({ release_name: '', grade: '', total_scenarios: 0, status: 'DRAFT', export_file: '', checksum: '' });
  const [gradeForm, setGradeForm] = useState({ grade_name: '', description: '', sort_order: 1 });
  const [scenarioForm, setScenarioForm] = useState({ grade: '', title: '', description: '', objective: '', estimated_duration: 15, difficulty: 'MEDIUM', status: 'DRAFT', thumbnail: '' });
  const [scenarioBuilderForm, setScenarioBuilderForm] = useState({ scenario: '', block_type: 'VIDEO', title: '', content: '', media_url: '', display_order: 1, settings: '{}' });
  const [schoolAdminForm, setSchoolAdminForm] = useState({ username: '', email: '', full_name: '', is_active: true, school: '', password: '' });
  const [teacherForm, setTeacherForm] = useState({ username: '', full_name: '', email: '', is_active: true, school: '', qualification: '', experience_years: 0, password: '' });

  /* ── Filter overrides for nested navigation ── */
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [selectedScenarioFilter, setSelectedScenarioFilter] = useState('');

  /* ── Loading & error feedback ── */
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /* ── Modal management ── */
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);

  /* ══════════════════════════════════
     DATA LOADERS (unchanged from original)
     ══════════════════════════════════ */
  const loadSchools = async () => {
    try {
      const res = await apiFetch('/api/cms/schools/');
      if (res.ok) { const data = await res.json(); setSchools(data.results || data); }
    } catch (e) { console.error('Failed to load schools', e); }
  };

  const loadPublishContents = async () => {
    try {
      const res = await apiFetch('/api/cms/publish-contents/');
      if (res.ok) { const data = await res.json(); setPublishContents(data.results || data); }
    } catch (e) { console.error('Failed to load publish contents', e); }
  };

  const loadDashboardStats = async () => {
    try {
      const res = await apiFetch('/api/cms/dashboard-stats/');
      if (res.ok) { const data = await res.json(); setDashboardStats(data); }
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
      if (res.ok) { const data = await res.json(); setGrades(data.results || data); }
    } catch (e) { console.error('Failed to load grades', e); }
  };

  const loadScenarios = async () => {
    try {
      const res = await apiFetch('/api/cms/scenarios/');
      if (res.ok) { const data = await res.json(); setScenarios(data.results || data); }
    } catch (e) { console.error('Failed to load scenarios', e); }
  };

  const loadScenarioBuilders = async () => {
    try {
      const res = await apiFetch('/api/cms/scenario-builders/');
      if (res.ok) { const data = await res.json(); setScenarioBuilders(data.results || data); }
    } catch (e) { console.error('Failed to load scenario builders', e); }
  };

  const loadSchoolAdmins = async () => {
    try {
      const res = await apiFetch('/api/cms/school-admins/');
      if (res.ok) { const data = await res.json(); setSchoolAdmins(data.results || data); }
    } catch (e) { console.error('Failed to load school admins', e); }
  };

  const loadTeachers = async () => {
    try {
      const res = await apiFetch('/api/cms/teachers/');
      if (res.ok) { const data = await res.json(); setTeachers(data.results || data); }
    } catch (e) { console.error('Failed to load teachers', e); }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([
        loadSchools(), loadPublishContents(), loadDashboardStats(),
        loadGrades(), loadScenarios(), loadScenarioBuilders(),
        loadSchoolAdmins(), loadTeachers(),
      ]);
    } catch (e) {
      console.error('Failed to load data from backend server.', e);
      setErrorMsg('Failed to load data from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  const showFeedback = (success, error) => {
    if (success) { setSuccessMsg(success); setTimeout(() => setSuccessMsg(''), 4000); }
    if (error)   { setErrorMsg(error);   setTimeout(() => setErrorMsg(''),   4000); }
  };

  /* ── Form Clean/Init ── */
  const initForm = (tab, entity = null) => {
    setErrorMsg('');
    if (tab === 'schools') {
      setSchoolForm(entity ? {
        school_name: entity.school_name || '', address: entity.address || '',
        phone: entity.phone || '', email: entity.email || '', logo: entity.logo || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : { school_name: '', address: '', phone: '', email: '', logo: '', is_active: true });
    } else if (tab === 'publish-contents' || tab === 'reports') {
      setPublishForm(entity ? {
        release_name: entity.release_name || '', grade: entity.grade || '',
        total_scenarios: entity.total_scenarios || 0, status: entity.status || 'DRAFT',
        export_file: entity.export_file || '', checksum: entity.checksum || ''
      } : { release_name: '', grade: '', total_scenarios: 0, status: 'DRAFT', export_file: '', checksum: '' });
    } else if (tab === 'grades') {
      setGradeForm(entity ? {
        grade_name: entity.grade_name || '', description: entity.description || '',
        sort_order: entity.sort_order || 1
      } : { grade_name: '', description: '', sort_order: grades.length + 1 });
    } else if (tab === 'scenarios') {
      setScenarioForm(entity ? {
        grade: entity.grade?.id || entity.grade || '', title: entity.title || '',
        description: entity.description || '', objective: entity.objective || '',
        estimated_duration: entity.estimated_duration || 15, difficulty: entity.difficulty || 'MEDIUM',
        status: entity.status || 'DRAFT', thumbnail: entity.thumbnail || ''
      } : {
        grade: selectedGradeFilter || (grades[0]?.id || ''), title: '', description: '',
        objective: '', estimated_duration: 15, difficulty: 'MEDIUM', status: 'DRAFT', thumbnail: ''
      });
    } else if (tab === 'scenario-builders') {
      setScenarioBuilderForm(entity ? {
        scenario: entity.scenario?.id || entity.scenario || '', block_type: entity.block_type || 'VIDEO',
        title: entity.title || '', content: entity.content || '', media_url: entity.media_url || '',
        display_order: entity.display_order || 1, settings: JSON.stringify(entity.settings || {}, null, 2)
      } : {
        scenario: selectedScenarioFilter || (scenarios[0]?.id || ''), block_type: 'VIDEO', title: '',
        content: '', media_url: '',
        display_order: scenarioBuilders.filter(s => s.scenario?.id === parseInt(selectedScenarioFilter) || s.scenario === parseInt(selectedScenarioFilter)).length + 1,
        settings: '{}'
      });
    } else if (tab === 'school-admins' || tab === 'users-roles') {
      setSchoolAdminForm(entity ? {
        username: entity.username || '', email: entity.email || '', full_name: entity.full_name || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true,
        school: entity.school_id || entity.school || (schools[0]?.school_id || ''), password: ''
      } : { username: '', email: '', full_name: '', is_active: true, school: schools[0]?.school_id || '', password: '' });
    }
  };

  const handleOpenAdd = () => { setModalType('add'); setEditingId(null); initForm(activeTab); setShowModal(true); };
  const handleOpenEdit = (entity) => {
    setModalType('edit');
    setEditingId(entity.id || entity.school_id || entity.publish_id || entity.teacher_id);
    initForm(activeTab, entity);
    setShowModal(true);
  };

  /* ── CRUD Submit ── */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    let body = {};
    const targetTab = activeTab === 'users-roles' ? 'school-admins' : (activeTab === 'reports' ? 'publish-contents' : activeTab);
    let url = `/api/cms/${targetTab}/`;
    if (modalType === 'edit') url += `${editingId}/`;

    try {
      if (activeTab === 'schools') {
        body = { ...schoolForm };
      } else if (activeTab === 'publish-contents' || activeTab === 'reports') {
        body = { ...publishForm, grade: parseInt(publishForm.grade), total_scenarios: parseInt(publishForm.total_scenarios) };
      } else if (activeTab === 'grades') {
        body = { ...gradeForm };
      } else if (activeTab === 'scenarios') {
        body = { ...scenarioForm, grade: parseInt(scenarioForm.grade) };
      } else if (activeTab === 'scenario-builders') {
        let settingsJson = {};
        try { settingsJson = JSON.parse(scenarioBuilderForm.settings || '{}'); }
        catch { setErrorMsg('Settings must be valid JSON object.'); return; }
        body = { ...scenarioBuilderForm, scenario: parseInt(scenarioBuilderForm.scenario), settings: settingsJson };
      } else if (activeTab === 'school-admins' || activeTab === 'users-roles') {
        body = { ...schoolAdminForm, school: parseInt(schoolAdminForm.school, 10) };
        if (modalType === 'edit') delete body.password;
      }

      const method = modalType === 'add' ? 'POST' : 'PUT';
      const res = await apiFetch(url, { method, body: JSON.stringify(body) });
      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Operation successful', null);
        setShowModal(false);
        if (targetTab === 'schools') { await loadSchools(); await loadDashboardStats(); }
        else if (targetTab === 'publish-contents') { await loadPublishContents(); await loadDashboardStats(); }
        else if (targetTab === 'grades') await loadGrades();
        else if (targetTab === 'scenarios') await loadScenarios();
        else if (targetTab === 'scenario-builders') await loadScenarioBuilders();
        else if (targetTab === 'school-admins') { await loadSchoolAdmins(); await loadDashboardStats(); }
      } else {
        const errorDetail = typeof resData === 'object' ? JSON.stringify(resData) : resData;
        setErrorMsg(`Error: ${errorDetail}`);
      }
    } catch (err) {
      setErrorMsg('Failed to process request. Make sure form data is correct.');
      console.error(err);
    }
  };

  /* ── Delete Handler ── */
  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this?`)) return;
    setErrorMsg('');
    const targetTab = activeTab === 'users-roles' ? 'school-admins' : (activeTab === 'reports' ? 'publish-contents' : activeTab);
    const url = `/api/cms/${targetTab}/${id}/`;
    try {
      const res = await apiFetch(url, { method: 'DELETE' });
      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Deleted successfully', null);
        if (targetTab === 'schools') { await loadSchools(); await loadDashboardStats(); }
        else if (targetTab === 'publish-contents') { await loadPublishContents(); await loadDashboardStats(); }
        else if (targetTab === 'grades') await loadGrades();
        else if (targetTab === 'scenarios') await loadScenarios();
        else if (targetTab === 'scenario-builders') await loadScenarioBuilders();
        else if (targetTab === 'school-admins') { await loadSchoolAdmins(); await loadDashboardStats(); }
      } else { setErrorMsg(resData.message || 'Failed to delete record.'); }
    } catch (err) { setErrorMsg('Error communicating with backend.'); console.error(err); }
  };

  /* ── Profile settings handler ── */
  const handleProfileUpdate = async (e) => {
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
      if (!res.ok) { setErrorMsg(typeof resData === 'object' ? JSON.stringify(resData) : 'Failed to update profile.'); return; }
      if (profileForm.password) {
        const pwRes = await apiFetch('/api/users/change-password/', {
          method: 'POST',
          body: JSON.stringify({ old_password: profileForm.current_password, new_password: profileForm.password })
        });
        const pwData = await pwRes.json();
        if (!pwRes.ok) { setErrorMsg(typeof pwData === 'object' ? JSON.stringify(pwData) : 'Profile saved, but password change failed.'); return; }
      }
      setProfileForm({ ...profileForm, current_password: '', password: '' });
      showFeedback('Profile updated successfully', null);
    } catch { setErrorMsg('Error connecting to backend.'); }
  };

  /* ── Custom School & Admin Creator ── */
  const handleAddNewSchoolWithAdmin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const schoolPayload = {
        school_name: newSchoolForm.school_name,
        address: `${newSchoolForm.address}, ${newSchoolForm.city}, ${newSchoolForm.state} - ${newSchoolForm.pincode}`,
        phone: newSchoolForm.mobile || '0000000000',
        email: newSchoolForm.email || 'school@example.com',
        logo: '',
        is_active: true
      };

      const sRes = await apiFetch('/api/cms/schools/', {
        method: 'POST',
        body: JSON.stringify(schoolPayload)
      });
      const sData = await sRes.json();
      if (!sRes.ok) {
        setErrorMsg(sData.message || 'Failed to create school');
        setLoading(false);
        return;
      }

      const createdSchoolId = sData.school_id || sData.id;

      const adminPayload = {
        username: newSchoolForm.email ? newSchoolForm.email.split('@')[0] : `admin_${Date.now()}`,
        email: newSchoolForm.email,
        full_name: newSchoolForm.admin_name,
        school: createdSchoolId,
        password: 'SchoolAdmin123!',
        is_active: true
      };

      const aRes = await apiFetch('/api/cms/school-admins/', {
        method: 'POST',
        body: JSON.stringify(adminPayload)
      });

      if (aRes.ok) {
        showFeedback('School and School Admin created successfully!', null);
        setIsAddingSchool(false);
        setNewSchoolForm({
          school_name: '', school_code: '', address: '', city: '', state: '', pincode: '',
          admin_name: '', email: '', mobile: ''
        });
        await loadSchools();
        await loadSchoolAdmins();
      } else {
        const aData = await aRes.json();
        setErrorMsg(aData.message || 'School was created, but Admin account failed to register.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Users & Roles List Merger ── */
  const getMergedUsers = () => {
    const list = [];
    // Add current super admin
    list.push({
      id: 'super-admin-row',
      full_name: profileForm.full_name || 'Super Admin',
      username: user?.username || 'superadmin',
      email: user?.email || 'superadmin@englishlab.com',
      role: 'Super Admin',
      school_name: 'Global',
      is_active: true
    });
    // Add School Admins
    schoolAdmins.forEach(sa => {
      list.push({
        id: sa.id,
        full_name: sa.full_name || sa.username,
        username: sa.username,
        email: sa.email,
        role: 'School Admin',
        school_name: sa.school_name || `School ID: ${sa.school}`,
        is_active: sa.is_active,
        school_id: sa.school_id || sa.school
      });
    });
    // Add Teachers (just to have a full platform list)
    teachers.forEach(t => {
      list.push({
        id: t.teacher_id,
        full_name: t.full_name || t.username,
        username: t.username,
        email: t.email,
        role: 'Teacher',
        school_name: t.school_name || `School ID: ${t.school}`,
        is_active: t.is_active,
        school_id: t.school
      });
    });
    return list;
  };

  /* ── Filters and helpers ── */
  const filterList = (list) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item =>
      (item.full_name || item.username || item.school_name || item.email || item.title || item.release_name || '').toLowerCase().includes(q)
    );
  };
  const paginate = (list, page) => list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ── Sidebar redirect / tab changes ── */
  const goTo = (tab) => {
    setSearchQuery('');
    setSelectedRoleFilter('');
    setSelectedStatusFilter('');
    setSelectedLocationFilter('');
    setSchoolSubTab('schools-list');
    setIsAddingSchool(false);
    setSchoolsPage(1); setUsersPage(1); setGradesPage(1);
    setScenariosPage(1); setScenarioBuildersPage(1); setPublishPage(1);
    setIsSidebarOpen(false);
    onTabChange(tab);
  };

  const stats = {
    schools: schools.length,
    schoolAdmins: schoolAdmins.length,
    teachers: teachers.length,
    publish_contents: publishContents.length,
    grades: grades.length,
    scenarios: scenarios.length,
  };

  /* ══════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════ */
  return (
    <div className="sd-layout">

      {/* ── Mobile top bar ── */}
      <header className="sd-mobile-header">
        <button className="sd-hamburger" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu"><FiMenu/></button>
        <span className="sd-mobile-brand">LinguaLab</span>
        <div style={{ width: 34 }}/>
      </header>

      {/* ── Sidebar backdrop (mobile) ── */}
      <div className={`sd-sidebar-backdrop${isSidebarOpen ? ' open' : ''}`} onClick={() => setIsSidebarOpen(false)}/>

      {/* ═════════════════
          SIDEBAR
          ═════════════════ */}
      <aside className={`sd-sidebar${isSidebarOpen ? ' open' : ''}`}>
        <div className="sd-brand">
          <div className="sd-brand-name">LinguaLab</div>
          <div className="sd-brand-sub">Admin Portal</div>
        </div>

        <nav className="sd-nav">
          <button className={`sd-nav-item${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => goTo('dashboard')}>
            <FiGrid/><span>Dashboard</span>
          </button>
          <button className={`sd-nav-item${activeTab === 'schools' ? ' active' : ''}`} onClick={() => goTo('schools')}>
            <FiGrid/><span>Manage Schools</span>
          </button>
          <button className={`sd-nav-item${activeTab === 'subscriptions' ? ' active' : ''}`} onClick={() => goTo('subscriptions')}>
            <FiCheckCircle/><span>Subscriptions</span>
          </button>
          <button className={`sd-nav-item${activeTab === 'users-roles' ? ' active' : ''}`} onClick={() => goTo('users-roles')}>
            <FiUsers/><span>Users &amp; Roles</span>
          </button>
          <button className={`sd-nav-item${activeTab === 'reports' ? ' active' : ''}`} onClick={() => goTo('reports')}>
            <FiFileText/><span>Reports</span>
          </button>
          <button className={`sd-nav-item${activeTab === 'profile' ? ' active' : ''}`} onClick={() => goTo('profile')}>
            <FiSettings/><span>System Settings</span>
          </button>
        </nav>

        {/* Footer links */}
        <div className="sd-footer">
          <button className="sd-footer-link danger" onClick={onLogout}><FiLogOut/><span>Logout</span></button>
        </div>

        {/* User card */}
        <div className="sd-user-card">
          <div className="sd-user-avatar">
            {(user?.username || 'AD').slice(0, 2).toUpperCase()}
          </div>
          <div className="sd-user-meta">
            <div className="sd-user-name">{user?.username || 'Super Admin'}</div>
            <div className="sd-user-role">Location</div>
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
              placeholder="Search media by name, tag, or type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sd-topbar-right">
            <button className="sd-icon-btn"><FiBell/></button>
            <button className="sd-icon-btn"><FiHelpCircle/></button>
          </div>
        </div>

        {/* ── Page Content ── */}
        <div className={`sd-content${activeTab === 'dashboard' ? ' sd-content--dashboard' : ''}`}>

          {/* Alerts */}
          {successMsg && <div className="sd-alert sd-alert-success"><FiCheckCircle/>{successMsg}</div>}
          {errorMsg   && <div className="sd-alert sd-alert-error"><FiX/>{errorMsg}</div>}

          {/* ══════════ OVERVIEW / DASHBOARD TAB ══════════ */}
          {activeTab === 'dashboard' && (
            <>
              <div className="sd-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 className="sd-page-title">Dashboard</h1>
                    <p className="sd-page-sub">Welcome back, Super Admin! Here's what's happening.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <button className="sd-year-badge"><FiCalendar/>May 15 - Jun 13, 2025<FiChevronDown/></button>
                    <button className="sd-btn-outline" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>Export Report</button>
                    <button className="sd-icon-btn" style={{ position: 'relative' }}>
                      <FiBell/>
                      <span style={{ position: 'absolute', top: -3, right: -3, background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 4px', borderRadius: '50%' }}>12</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="sd-stat-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[
                  { label: 'Total Schools',       value: dashboardStats.total_schools || 128,   color: '#3b82f6', bg: '#e0f2fe', icon: <FiGrid/>,     trend: '+8 this month' },
                  { label: 'Total Students',      value: '34,567',                              color: '#22c55e', bg: '#dcfce7', icon: <FiUsers/>,    trend: '+1,345 this month' },
                  { label: 'Active Subscriptions', value: '124',                                 color: '#f97316', bg: '#ffedd5', icon: <FiUser/>,     trend: '+6 this month' },
                  { label: 'Total Revenue',       value: '₹12,45,000',                          color: '#a855f7', bg: '#f3e8ff', icon: <FiAward/>,    trend: '15% this month' },
                ].map((s, i) => (
                  <div className="sd-stat-card" key={i}>
                    <div className="sd-stat-icon-row">
                      <div className="sd-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                    </div>
                    <div className="sd-stat-value">{s.value}</div>
                    <div className="sd-stat-label">{s.label}</div>
                    <span className="sd-stat-trend">{s.trend}</span>
                  </div>
                ))}
              </div>

              {/* Middle Row Charts */}
              <div className="sd-bottom-grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
                {/* Students Activity Overview */}
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div>
                      <div className="sd-card-title">Students Activity Overview</div>
                    </div>
                    <div className="sd-chart-legend" style={{ marginBottom: 0 }}>
                      <div className="sd-chart-legend-item">
                        <div className="sd-chart-legend-dot" style={{ background: '#6366f1' }}/>
                        Active Students
                      </div>
                      <div className="sd-chart-legend-item">
                        <div className="sd-chart-legend-dot" style={{ background: '#22c55e' }}/>
                        Completed Activities
                      </div>
                    </div>
                  </div>
                  <div className="sd-chart-wrap" style={{ marginTop: '1rem' }}>
                    <ActivityLineChart/>
                  </div>
                  <div className="sd-x-labels">
                    {['May 15', 'May 22', 'May 29', 'Jun 05', 'Jun 13'].map(m => <span className="sd-x-label" key={m}>{m}</span>)}
                  </div>
                </div>

                {/* Subscription Status Donut */}
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div className="sd-card-title">Subscription Status</div>
                  </div>
                  <div className="sd-completion-grid">
                    <div className="sd-donut-wrap">
                      <MultiDonutChart total={124} activeCount={110} expiringCount={9} expiredCount={5}/>
                    </div>
                    <div className="sd-legend">
                      {[
                        { label: 'Active',        color: '#22c55e', pct: '110 (88.7%)' },
                        { label: 'Expiring Soon', color: '#f97316', pct: '9 (7.3%)' },
                        { label: 'Expired',       color: '#ef4444', pct: '5 (4.0%)' },
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
              </div>

              {/* Bottom Row Lists */}
              <div className="sd-bottom-grid">
                {/* Recent Activity */}
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div className="sd-card-title">Recent Activity</div>
                    <button className="sd-view-all">View All</button>
                  </div>
                  <div className="sd-activity-list">
                    {[
                      { id: 1, name: 'GP', color: '#22c55e', desc: 'Greenfield Public School renewed Premium Plan', time: '2 min ago' },
                      { id: 2, name: 'HV', color: '#3b82f6', desc: 'New school registered: Happy Valley School', time: '15 min ago' },
                      { id: 3, name: 'DC', color: '#f97316', desc: 'Content published: Daily Conversation - Level 2', time: '1 hour ago' },
                    ].map(act => (
                      <div className="sd-activity-item" key={act.id}>
                        <div className="sd-activity-avatar" style={{ background: act.color }}>{act.name}</div>
                        <div className="sd-activity-body">
                          <div className="sd-activity-name">{act.desc}</div>
                        </div>
                        <div className="sd-activity-time">{act.time}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Performing Schools */}
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div className="sd-card-title">Top Performing Schools</div>
                    <button className="sd-view-all">View All</button>
                  </div>
                  <div className="sd-table-wrap">
                    <table className="sd-table">
                      <thead>
                        <tr>
                          <th>School Name</th>
                          <th>Students Active</th>
                          <th>Activities Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Sunshine High School', active: '987', completed: '4,582' },
                          { name: 'Greenfield Public School', active: '1,245', completed: '4,120' },
                          { name: 'Bright Future Academy', active: '758', completed: '3,245' },
                        ].map((sch, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600, color: '#1e293b' }}>{sch.name}</td>
                            <td>{sch.active}</td>
                            <td>{sch.completed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══════════ USERS & ROLES TAB ══════════ */}
          {activeTab === 'users-roles' && (
            <>
              <div className="sd-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 className="sd-page-title">Users &amp; Roles</h1>
                    <p className="sd-page-sub">Manage platform users and their roles.</p>
                  </div>
                  <button className="sd-btn-primary" onClick={handleOpenAdd}><FiPlus/>Add User</button>
                </div>
              </div>

              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                {/* Tabs inside card */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem', gap: '1.5rem' }}>
                  <button style={{ paddingBottom: '0.75rem', borderBottom: '2.5px solid #6366f1', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, color: '#4f46e5', fontSize: '0.85rem' }}>Users</button>
                  <button style={{ paddingBottom: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, color: '#64748b', fontSize: '0.85rem' }}>Roles &amp; Permissions</button>
                </div>

                {/* Filters toolbar */}
                <div className="sd-table-toolbar">
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', flex: 1 }}>
                    <div className="sd-table-search">
                      <FiSearch/>
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setUsersPage(1); }}
                      />
                    </div>
                    <select className="sd-btn-filter" style={{ border: '1.5px solid #e8edf5', background: '#fff', fontSize: '0.8rem', fontWeight: 500 }}
                      value={selectedRoleFilter} onChange={e => { setSelectedRoleFilter(e.target.value); setUsersPage(1); }}>
                      <option value="">All Roles</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="School Admin">School Admin</option>
                      <option value="Teacher">Teacher</option>
                    </select>
                    <select className="sd-btn-filter" style={{ border: '1.5px solid #e8edf5', background: '#fff', fontSize: '0.8rem', fontWeight: 500 }}
                      value={selectedStatusFilter} onChange={e => { setSelectedStatusFilter(e.target.value); setUsersPage(1); }}>
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <button className="sd-btn-filter"><FiFilter/>Filter</button>
                </div>

                {/* Users Table */}
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>School / Scope</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(getMergedUsers()).filter(u => {
                        if (selectedRoleFilter && u.role !== selectedRoleFilter) return false;
                        if (selectedStatusFilter) {
                          const wantActive = selectedStatusFilter === 'active';
                          if (u.is_active !== wantActive) return false;
                        }
                        return true;
                      }), usersPage).map((u, i) => (
                        <tr key={u.id || i}>
                          <td style={{ fontWeight: 600, color: '#1e293b' }}>{u.full_name}</td>
                          <td>{u.email}</td>
                          <td>{u.role}</td>
                          <td>{u.school_name}</td>
                          <td>
                            <span className={`sd-badge ${u.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action" title="View"><FiEye/></button>
                              {u.id !== 'super-admin-row' && (
                                <>
                                  <button className="sd-icon-action edit" onClick={() => handleOpenEdit(saFromMerged(u))} title="Edit"><FiEdit2/></button>
                                  <button className="sd-icon-action delete" onClick={() => handleDelete(u.id)} title="Delete"><FiTrash2/></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterList(getMergedUsers()).length === 0 && (
                        <tr><td colSpan="6" className="sd-empty-state">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  total={filterList(getMergedUsers()).filter(u => {
                    if (selectedRoleFilter && u.role !== selectedRoleFilter) return false;
                    if (selectedStatusFilter) {
                      const wantActive = selectedStatusFilter === 'active';
                      if (u.is_active !== wantActive) return false;
                    }
                    return true;
                  }).length}
                  perPage={PER_PAGE}
                  page={usersPage}
                  onPage={setUsersPage}
                />
              </div>
            </>
          )}

          {/* ══════════ MANAGE SCHOOLS TAB ══════════ */}
          {activeTab === 'schools' && (
            <>
              {isAddingSchool ? (
                /* ───────────────── ADD NEW SCHOOL SCREEN (Image 2) ───────────────── */
                <>
                  <div className="sd-page-header">
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      Manage Schools &nbsp;&gt;&nbsp; <span style={{ color: '#4f46e5', fontWeight: 600 }}>Add School</span>
                    </p>
                    <h1 className="sd-page-title">Add New School</h1>
                    <p className="sd-page-sub">Register a new school to the EnglishLab platform.</p>
                  </div>

                  <form onSubmit={handleAddNewSchoolWithAdmin}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* School Information Card */}
                      <div className="sd-card" style={{ padding: '1.5rem 2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>School Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div className="sd-form-group">
                            <label className="sd-form-label">School Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter school name" required
                              value={newSchoolForm.school_name} onChange={e => setNewSchoolForm({ ...newSchoolForm, school_name: e.target.value })}/>
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">School Code <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter unique code" required
                              value={newSchoolForm.school_code} onChange={e => setNewSchoolForm({ ...newSchoolForm, school_code: e.target.value })}/>
                          </div>
                          <div className="sd-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="sd-form-label">Address <span style={{ color: '#ef4444' }}>*</span></label>
                            <textarea className="sd-form-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Enter full address" required
                              value={newSchoolForm.address} onChange={e => setNewSchoolForm({ ...newSchoolForm, address: e.target.value })}/>
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">City <span style={{ color: '#ef4444' }}>*</span></label>
                            <select className="sd-form-input" required value={newSchoolForm.city} onChange={e => setNewSchoolForm({ ...newSchoolForm, city: e.target.value })}>
                              <option value="">Select city</option>
                              <option value="Chennai">Chennai</option>
                              <option value="Coimbatore">Coimbatore</option>
                              <option value="Madurai">Madurai</option>
                              <option value="Salem">Salem</option>
                              <option value="Bangalore">Bangalore</option>
                              <option value="Hyderabad">Hyderabad</option>
                              <option value="Trichy">Trichy</option>
                            </select>
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">State <span style={{ color: '#ef4444' }}>*</span></label>
                            <select className="sd-form-input" required value={newSchoolForm.state} onChange={e => setNewSchoolForm({ ...newSchoolForm, state: e.target.value })}>
                              <option value="">Select state</option>
                              <option value="Tamil Nadu">Tamil Nadu</option>
                              <option value="Karnataka">Karnataka</option>
                              <option value="Telangana">Telangana</option>
                              <option value="Kerala">Kerala</option>
                            </select>
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">Pincode <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter pincode" required
                              value={newSchoolForm.pincode} onChange={e => setNewSchoolForm({ ...newSchoolForm, pincode: e.target.value })}/>
                          </div>
                        </div>
                      </div>

                      {/* School Admin Information Card */}
                      <div className="sd-card" style={{ padding: '1.5rem 2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>School Admin Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                          <div className="sd-form-group">
                            <label className="sd-form-label">Admin Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter admin name" required
                              value={newSchoolForm.admin_name} onChange={e => setNewSchoolForm({ ...newSchoolForm, admin_name: e.target.value })}/>
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">Email <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="email" placeholder="Enter email address" required
                              value={newSchoolForm.email} onChange={e => setNewSchoolForm({ ...newSchoolForm, email: e.target.value })}/>
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter mobile number" required
                              value={newSchoolForm.mobile} onChange={e => setNewSchoolForm({ ...newSchoolForm, mobile: e.target.value })}/>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginBottom: '2rem' }}>
                        <button type="button" className="sd-btn-outline" onClick={() => setIsAddingSchool(false)}>Cancel</button>
                        <button type="submit" className="sd-btn-primary" style={{ background: '#4f46e5' }}>Save School</button>
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                /* ───────────────── LISTS SCREEN (Image 1) ───────────────── */
                <>
                  <div className="sd-page-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h1 className="sd-page-title">Manage Schools &amp; Admins</h1>
                        <p className="sd-page-sub">Configure English Learning Content and structures dynamically</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {schoolSubTab === 'schools-list' ? (
                          <button className="sd-btn-primary" onClick={() => setIsAddingSchool(true)}>+ Add School</button>
                        ) : (
                          <button className="sd-btn-primary" onClick={() => setIsAddingSchool(true)}>+ Add New School Admin</button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                    {/* Inner tab switcher */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem', gap: '1.5rem' }}>
                      <button
                        onClick={() => { setSchoolSubTab('schools-list'); setSearchQuery(''); }}
                        style={{
                          paddingBottom: '0.75rem',
                          borderBottom: schoolSubTab === 'schools-list' ? '2.5px solid #6366f1' : 'none',
                          background: 'none',
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontWeight: schoolSubTab === 'schools-list' ? 600 : 500,
                          color: schoolSubTab === 'schools-list' ? '#4f46e5' : '#64748b',
                          fontSize: '0.85rem'
                        }}
                      >
                        Schools List
                      </button>
                      <button
                        onClick={() => { setSchoolSubTab('school-admins'); setSearchQuery(''); }}
                        style={{
                          paddingBottom: '0.75rem',
                          borderBottom: schoolSubTab === 'school-admins' ? '2.5px solid #6366f1' : 'none',
                          background: 'none',
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontWeight: schoolSubTab === 'school-admins' ? 600 : 500,
                          color: schoolSubTab === 'school-admins' ? '#4f46e5' : '#64748b',
                          fontSize: '0.85rem'
                        }}
                      >
                        School Admins
                      </button>
                    </div>

                    {/* SCHOOLS LIST TAB VIEW */}
                    {schoolSubTab === 'schools-list' && (
                      <>
                        <div className="sd-table-toolbar">
                          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', flex: 1 }}>
                            <div className="sd-table-search">
                              <FiSearch/>
                              <input
                                type="text"
                                placeholder="Search schools..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setSchoolsPage(1); }}
                              />
                            </div>
                            <select className="sd-btn-filter" style={{ border: '1.5px solid #e8edf5', background: '#fff', fontSize: '0.8rem', fontWeight: 500 }}
                              value={selectedStatusFilter} onChange={e => { setSelectedStatusFilter(e.target.value); setSchoolsPage(1); }}>
                              <option value="">All Status</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                            <select className="sd-btn-filter" style={{ border: '1.5px solid #e8edf5', background: '#fff', fontSize: '0.8rem', fontWeight: 500 }}
                              value={selectedLocationFilter} onChange={e => { setSelectedLocationFilter(e.target.value); setSchoolsPage(1); }}>
                              <option value="">All Locations</option>
                              <option value="Chennai">Chennai</option>
                              <option value="Coimbatore">Coimbatore</option>
                              <option value="Madurai">Madurai</option>
                              <option value="Salem">Salem</option>
                              <option value="Bangalore">Bangalore</option>
                              <option value="Hyderabad">Hyderabad</option>
                              <option value="Trichy">Trichy</option>
                            </select>
                          </div>
                          <button className="sd-btn-filter"><FiFilter/>Filter</button>
                        </div>
                        <div className="sd-table-wrap">
                          <table className="sd-table">
                            <thead>
                              <tr>
                                <th>School Name</th>
                                <th>Admin Name</th>
                                <th>Location</th>
                                <th>Students</th>
                                <th>Teachers</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginate(filterList(schools).filter(s => {
                                if (selectedStatusFilter) {
                                  const wantActive = selectedStatusFilter === 'active';
                                  if (s.is_active !== wantActive) return false;
                                }
                                if (selectedLocationFilter) {
                                  if (!(s.address || '').toLowerCase().includes(selectedLocationFilter.toLowerCase())) return false;
                                }
                                return true;
                              }), schoolsPage).map((s, i) => {
                                const admin = schoolAdmins.find(sa => sa.school === s.school_id || sa.school_id === s.school_id);
                                const adminName = admin ? (admin.full_name || admin.username) : '—';
                                const teachersCount = teachers.filter(t => t.school === s.school_id || t.school_id === s.school_id).length;
                                const studentCount = s.school_id ? (s.school_id * 127 + 288) % 1500 : 0;

                                return (
                                  <tr key={s.school_id || i}>
                                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{s.school_name}</td>
                                    <td>{adminName}</td>
                                    <td>{s.address}</td>
                                    <td>{studentCount || '—'}</td>
                                    <td>{teachersCount}</td>
                                    <td>
                                      <span className={`sd-badge ${s.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                                        {s.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="sd-action-cell">
                                        <button className="sd-icon-action edit" onClick={() => handleOpenEdit(s)} title="Edit"><FiEdit2/></button>
                                        <button className="sd-icon-action delete" onClick={() => handleDelete(s.school_id || s.id)} title="Delete"><FiTrash2/></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                              {filterList(schools).length === 0 && (
                                <tr><td colSpan="7" className="sd-empty-state">No schools found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <Pagination total={filterList(schools).filter(s => {
                          if (selectedStatusFilter) {
                            const wantActive = selectedStatusFilter === 'active';
                            if (s.is_active !== wantActive) return false;
                          }
                          if (selectedLocationFilter) {
                            if (!(s.address || '').toLowerCase().includes(selectedLocationFilter.toLowerCase())) return false;
                          }
                          return true;
                        }).length} perPage={PER_PAGE} page={schoolsPage} onPage={setSchoolsPage}/>
                      </>
                    )}

                    {/* SCHOOL ADMINS TAB VIEW (Image 1 list style) */}
                    {schoolSubTab === 'school-admins' && (
                      <>
                        <div className="sd-table-toolbar">
                          <div className="sd-table-search">
                            <FiSearch/>
                            <input
                              type="text"
                              placeholder="Search admins..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="sd-table-wrap">
                          <table className="sd-table">
                            <thead>
                              <tr>
                                <th>USERNAME</th>
                                <th>FULL NAME</th>
                                <th>EMAIL</th>
                                <th>SCHOOL</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginate(filterList(schoolAdmins), usersPage).map((sa, i) => (
                                <tr key={sa.id || i}>
                                  <td style={{ fontWeight: 600, color: '#1e293b' }}>{sa.username}</td>
                                  <td>{sa.full_name || 'N/A'}</td>
                                  <td>{sa.email || 'N/A'}</td>
                                  <td>{sa.school_name || `School ID: ${sa.school}`}</td>
                                  <td>
                                    <span className="sd-badge sd-badge-active">ACTIVE</span>
                                  </td>
                                  <td>
                                    <div className="sd-action-cell">
                                      <button className="sd-icon-action edit" onClick={() => handleOpenEdit(sa)} title="Edit"><FiEdit2/></button>
                                      <button className="sd-icon-action delete" onClick={() => handleDelete(sa.id)} title="Delete"><FiTrash2/></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {filterList(schoolAdmins).length === 0 && (
                                <tr><td colSpan="6" className="sd-empty-state">No school admins found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <Pagination total={filterList(schoolAdmins).length} perPage={PER_PAGE} page={usersPage} onPage={setUsersPage}/>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ══════════ SUBSCRIPTIONS TAB ══════════ */}
          {activeTab === 'subscriptions' && (
            <>
              {/* Header with action button (except on Create Plan page) */}
              {subPage !== 'create-plan' ? (
                <div className="sd-page-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h1 className="sd-page-title">
                        {subPage === 'overview' && 'Subscriptions'}
                        {subPage === 'all-subscriptions' && 'Greenfield Public School'}
                        {subPage === 'plan-details' && 'Subscription Plans'}
                      </h1>
                      <p className="sd-page-sub">
                        {subPage === 'overview' && 'Manage all subscription plans and renewals.'}
                        {subPage === 'all-subscriptions' && 'Subscriptions / Greenfield Public School'}
                        {subPage === 'plan-details' && 'Create and manage subscription plans.'}
                      </p>
                    </div>
                    {subPage !== 'all-subscriptions' ? (
                      <button className="sd-btn-primary" onClick={() => setSubPage('create-plan')}>+ Create Plan</button>
                    ) : (
                      <button className="sd-btn-outline">Actions</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="sd-page-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h1 className="sd-page-title">Create New Plan</h1>
                      <p className="sd-page-sub">Define a new subscription plan.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button className="sd-btn-outline" onClick={() => setSubPage('overview')}>Cancel</button>
                      <button className="sd-btn-primary" onClick={() => { alert('Plan Created!'); setSubPage('plan-details'); }}>Next: Features</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub tabs (only shown when not creating a plan) */}
              {subPage !== 'create-plan' && (
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '1.5rem' }}>
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'all-subscriptions', label: 'All Subscriptions' },
                    { key: 'plan-details', label: 'Plan Details' },
                    { key: 'expiring-soon', label: 'Expiring Soon' },
                    { key: 'expired-cancelled', label: 'Expired / Cancelled' }
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setSubPage(t.key)}
                      style={{
                        paddingBottom: '0.75rem',
                        borderBottom: subPage === t.key ? '2.5px solid #6366f1' : 'none',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: subPage === t.key ? 600 : 500,
                        color: subPage === t.key ? '#4f46e5' : '#64748b',
                        fontSize: '0.85rem'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* ───────────────── SUB-PAGE: OVERVIEW (Image 1) ───────────────── */}
              {subPage === 'overview' && (
                <>
                  {/* 4 Stat Cards */}
                  <div className="sd-stat-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {[
                      { label: 'TOTAL ACTIVE',    value: '124',          color: '#3b82f6', bg: '#e0f2fe', icon: <FiUser/>,     trend: '↑ 6 this month', trendColor: '#22c55e' },
                      { label: 'EXPIRING SOON',   value: '9',            color: '#f97316', bg: '#ffedd5', icon: <FiBell/>,     trend: 'Within 30 days', trendColor: '#64748b' },
                      { label: 'EXPIRED',         value: '5',            color: '#ef4444', bg: '#fee2e2', icon: <FiXCircle/>,  trend: 'Needs attention', trendColor: '#ef4444' },
                      { label: 'TOTAL REVENUE',   value: '₹12,45,000',   color: '#a855f7', bg: '#f3e8ff', icon: <FiAward/>,    trend: '↑ 15% this month', trendColor: '#22c55e' },
                    ].map((s, i) => (
                      <div className="sd-stat-card" key={i}>
                        <div className="sd-stat-icon-row">
                          <div className="sd-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        </div>
                        <div className="sd-stat-value">{s.value}</div>
                        <div className="sd-stat-label" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>{s.label}</div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.trendColor }}>{s.trend}</span>
                      </div>
                    ))}
                  </div>

                  {/* Donut and Activity row */}
                  <div className="sd-bottom-grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
                    {/* Subscription Plan Distribution Card */}
                    <div className="sd-card">
                      <div className="sd-card-header">
                        <div className="sd-card-title">Subscription Plan Distribution</div>
                        <button className="sd-view-all" onClick={() => setSubPage('plan-details')}>VIEW ALL</button>
                      </div>
                      <div className="sd-completion-grid" style={{ margin: '1rem 0' }}>
                        <div className="sd-donut-wrap">
                          <DistributionDonutChart/>
                        </div>
                        <div className="sd-legend">
                          {[
                            { label: 'Basic Plan',          color: '#3b82f6', pct: '45 (36.3%)' },
                            { label: 'Standard Plan',       color: '#22c55e', pct: '38 (30.6%)' },
                            { label: 'Premium Plan',        color: '#f97316', pct: '28 (22.6%)' },
                            { label: 'Enterprise Plan',     color: '#a855f7', pct: '10 (8.1%)' },
                            { label: 'Expired / Cancelled', color: '#ef4444', pct: '3 (2.4%)' },
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
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex' }}>
                        <button style={{ border: 'none', background: 'none', color: '#4f46e5', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => setSubPage('plan-details')}>
                          <FiSettings/> Manage All Subscriptions
                        </button>
                      </div>
                    </div>

                    {/* Activity Card */}
                    <div className="sd-card">
                      <div className="sd-card-header">
                        <div className="sd-card-title">Activity</div>
                        <button className="sd-view-all">View All</button>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                        <h4 style={{ color: '#4f46e5', margin: 0, fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: 700 }}>ONLINE EXAM</h4>
                      </div>
                      <div className="sd-activity-list">
                        {[
                          { id: 1, name: 'Python',     time: '2 min ago',    color: '#22c55e' },
                          { id: 2, name: 'SQL',        time: '15 min ago',   color: '#22c55e' },
                          { id: 3, name: 'C++',        time: '1 hour ago',   color: '#22c55e' },
                          { id: 4, name: 'JavaScript', time: '3 hours ago',  color: '#22c55e' },
                        ].map(act => (
                          <div className="sd-activity-item" key={act.id}>
                            <div className="sd-activity-avatar" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                              <FiCheckCircle/>
                            </div>
                            <div className="sd-activity-body">
                              <div className="sd-activity-name">{act.name}</div>
                              <div className="sd-activity-desc">{act.time}</div>
                            </div>
                            <div style={{ color: '#22c55e', fontSize: '1.1rem' }}><FiCheckCircle/></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ───────────────── SUB-PAGE: ALL SUBSCRIPTIONS (Image 2) ───────────────── */}
              {subPage === 'all-subscriptions' && (
                <>
                  {/* Plan metadata row */}
                  <div className="sd-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                    {[
                      { label: 'PLAN', value: 'Premium Plan' },
                      { label: 'DURATION', value: 'May 20, 2025 - May 20, 2026' },
                      { label: 'AMOUNT', value: '25,000' },
                      { label: 'STUDENTS', value: '1,245' },
                      { label: 'TEACHERS', value: '45' }
                    ].map(meta => (
                      <div key={meta.label}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{meta.label}</div>
                        <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 700, marginTop: '4px' }}>{meta.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sub tab headers nested */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem', gap: '1.5rem' }}>
                    <button style={{ paddingBottom: '0.6rem', borderBottom: '2.5px solid #6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, color: '#4f46e5', fontSize: '0.8rem' }}>Overview</button>
                    {['Usage', 'Payments', 'Renewals', 'History'].map(tab => (
                      <button key={tab} style={{ paddingBottom: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, color: '#64748b', fontSize: '0.8rem' }}>{tab}</button>
                    ))}
                  </div>

                  {/* Usage layout */}
                  <div className="sd-bottom-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                    {/* Usage overview card */}
                    <div className="sd-card">
                      <div className="sd-card-header">
                        <div>
                          <div className="sd-card-title">Usage Overview</div>
                          <div className="sd-card-sub">As of today</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', margin: '1rem 0' }}>
                        {[
                          { label: 'Students', value: '1,245 / 2,000', pct: 62.2, color: '#6366f1' },
                          { label: 'Teachers', value: '45 / 100', pct: 45.0, color: '#22c55e' },
                          { label: 'Storage', value: '12.4 GB / 50 GB', pct: 24.8, color: '#f97316' },
                          { label: 'API Calls', value: '2,450 / 10,000', pct: 24.5, color: '#3b82f6' }
                        ].map(bar => (
                          <div key={bar.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{bar.label}</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{bar.value}</span>
                            </div>
                            <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${bar.pct}%`, height: '100%', background: bar.color, borderRadius: 4 }}/>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button style={{ border: 'none', background: 'none', color: '#4f46e5', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', padding: 0 }}>View Full Usage</button>
                    </div>

                    {/* Renewal and Payment cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="sd-card">
                        <div className="sd-card-header"><div className="sd-card-title">Next Renewal</div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0 1rem 0' }}>
                          <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}><FiCalendar/></div>
                          <div>
                            <div style={{ fontSize: '1rem', fontWeight: 700 }}>May 20, 2026</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>364 days remaining</div>
                          </div>
                        </div>
                        <button className="sd-btn-outline" style={{ width: '100%' }}>Renew Now</button>
                      </div>

                      <div className="sd-card">
                        <div className="sd-card-header"><div className="sd-card-title">Payment Information</div></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', margin: '0.5rem 0' }}>
                          {[
                            { label: 'Last Payment', value: 'May 20, 2025' },
                            { label: 'Amount', value: '25,000' },
                            { label: 'Transaction ID', value: 'TXN1234567890' }
                          ].map(pay => (
                            <div key={pay.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span style={{ color: '#64748b' }}>{pay.label}</span>
                              <span style={{ fontWeight: 600 }}>{pay.value}</span>
                            </div>
                          ))}
                        </div>
                        <button style={{ border: 'none', background: 'none', color: '#4f46e5', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: '0.5rem' }}>View Payment History</button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ───────────────── SUB-PAGE: PLAN DETAILS (Image 3) ───────────────── */}
              {subPage === 'plan-details' && (
                <>
                  {/* Subscription Plans Table */}
                  <div className="sd-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Plan Name</th>
                            <th>Duration</th>
                            <th>Schools</th>
                            <th>Price (₹)</th>
                            <th>Features</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: 'Basic Plan',      dur: '1 Year', schools: '45', price: '8,000',  feat: '6',    active: true },
                            { name: 'Standard Plan',   dur: '1 Year', schools: '38', price: '15,000', feat: '10',   active: true },
                            { name: 'Premium Plan',    dur: '1 Year', schools: '28', price: '25,000', feat: '15',   active: true },
                            { name: 'Enterprise Plan', dur: '1 Year', schools: '10', price: '50,000', feat: 'All',  active: true },
                            { name: 'Custom Plan',     dur: 'Custom', schools: '3',  price: '-',      feat: 'Custom', active: true }
                          ].map((p, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{p.name}</td>
                              <td>{p.dur}</td>
                              <td>{p.schools}</td>
                              <td>{p.price}</td>
                              <td>{p.feat}</td>
                              <td>
                                <span className={`sd-badge ${p.active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>Active</span>
                              </td>
                              <td>
                                <div className="sd-action-cell">
                                  <button className="sd-icon-action" title="View"><FiEye/></button>
                                  <button className="sd-icon-action edit" title="Edit"><FiEdit2/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Plan Features Comparison Card */}
                  <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="sd-card-header" style={{ marginBottom: '1.25rem' }}>
                      <div className="sd-card-title">Plan Features Comparison</div>
                      <button className="sd-btn-outline" style={{ fontSize: '0.78rem' }}>Compare All</button>
                    </div>
                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Features</th>
                            <th>Basic</th>
                            <th>Standard</th>
                            <th>Premium</th>
                            <th>Enterprise</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: 'Access to Content Library', b: true,  s: true,  p: true,  e: true },
                            { name: 'Activity Reports',          b: true,  s: true,  p: true,  e: true },
                            { name: 'Advanced Analytics',        b: false, s: false, p: true,  e: true },
                            { name: 'Custom Assessments',        b: false, s: true,  p: true,  e: true },
                            { name: 'Priority Support',          b: false, s: false, p: true,  e: true },
                            { name: 'API Access',                b: false, s: false, p: false, e: true }
                          ].map((f, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 500 }}>{f.name}</td>
                              <td>{f.b ? <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✓</span> : '—'}</td>
                              <td>{f.s ? <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✓</span> : '—'}</td>
                              <td>{f.p ? <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✓</span> : '—'}</td>
                              <td>{f.e ? <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✓</span> : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ───────────────── SUB-PAGE: CREATE PLAN (Image 4) ───────────────── */}
              {subPage === 'create-plan' && (
                <>
                  {/* Progress steps */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '1.5rem' }}>
                    <button style={{ paddingBottom: '0.6rem', borderBottom: '2.5px solid #6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, color: '#4f46e5', fontSize: '0.8rem' }}>Plan Details</button>
                    {['Features', 'Limits', 'Pricing'].map(tab => (
                      <button key={tab} style={{ paddingBottom: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, color: '#64748b', fontSize: '0.8rem' }} disabled>{tab}</button>
                    ))}
                  </div>

                  {/* Form card */}
                  <div className="sd-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                      {/* Left form inputs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="sd-form-group">
                          <label className="sd-form-label">Plan Name <span style={{ color: '#ef4444' }}>*</span></label>
                          <input className="sd-form-input" type="text" placeholder="Enter plan name" required/>
                        </div>
                        <div className="sd-form-group">
                          <label className="sd-form-label">Duration <span style={{ color: '#ef4444' }}>*</span></label>
                          <select className="sd-form-input" required defaultValue="1 Year">
                            <option value="1 Year">1 Year</option>
                            <option value="6 Months">6 Months</option>
                            <option value="Custom">Custom</option>
                          </select>
                        </div>
                      </div>

                      {/* Right form inputs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="sd-form-group">
                          <label className="sd-form-label">Description</label>
                          <textarea className="sd-form-input" style={{ minHeight: '85px', resize: 'vertical' }} placeholder="Enter plan description"/>
                        </div>
                        <div className="sd-form-group">
                          <label className="sd-form-label">Status</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                            {/* Toggle Switch */}
                            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                              <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }}/>
                              <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#6366f1', borderRadius: 24, transition: '0.3s' }}>
                                <span style={{ position: 'absolute', content: '""', height: 18, width: 18, left: 22, bottom: 3, backgroundColor: '#fff', borderRadius: '50%', transition: '0.3s' }}/>
                              </span>
                            </label>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ══════════ REPORTS TAB (Publish contents list) ══════════ */}
          {activeTab === 'reports' && (
            <>
              <div className="sd-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 className="sd-page-title">Reports &amp; Releases</h1>
                    <p className="sd-page-sub">Release publish history, package checksums, and grade release files.</p>
                  </div>
                  <button className="sd-btn-primary" onClick={handleOpenAdd}><FiPlus/>Add Release</button>
                </div>
              </div>

              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div className="sd-table-search">
                    <FiSearch/>
                    <input
                      type="text"
                      placeholder="Search releases..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setPublishPage(1); }}
                    />
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Release Name</th>
                        <th>Grade</th>
                        <th>Total Scenarios</th>
                        <th>Status</th>
                        <th>Checksum</th>
                        <th>Package</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(publishContents), publishPage).map((p, i) => (
                        <tr key={p.publish_id || i}>
                          <td style={{ fontWeight: 600, color: '#1e293b' }}>{p.release_name}</td>
                          <td>{p.grade_name || p.grade}</td>
                          <td>{p.total_scenarios}</td>
                          <td>
                            <span className={`sd-badge ${p.status === 'PUBLISHED' ? 'sd-badge-published' : 'sd-badge-draft'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ color: '#6b7280', fontSize: '0.75rem' }}>{p.checksum || 'N/A'}</td>
                          <td>
                            {p.export_file ? (
                              <a href={p.export_file} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <FiFileText/> Download
                              </a>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>No package</span>
                            )}
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit" onClick={() => handleOpenEdit(p)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => handleDelete(p.publish_id || p.id)} title="Delete"><FiTrash2/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterList(publishContents).length === 0 && (
                        <tr><td colSpan="7" className="sd-empty-state">No release logs found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={filterList(publishContents).length} perPage={PER_PAGE} page={publishPage} onPage={setPublishPage}/>
              </div>
            </>
          )}

          {/* ══════════ SYSTEM SETTINGS / PROFILE TAB ══════════ */}
          {activeTab === 'profile' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">System Settings</h1>
                <p className="sd-page-sub">View and update your administrator account details.</p>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="sd-profile-card">
                  <div className="sd-profile-section-header">
                    <div className="sd-profile-section-title">
                      <FiUser/>Personal Details
                    </div>
                    <span className="sd-verified-badge"><FiCheckCircle/>Verified Admin</span>
                  </div>

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
                        placeholder="your@email.com" required/>
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

                  <div className="sd-profile-save-row">
                    <button type="submit" className="sd-btn-primary">Save Changes</button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* ══════════ GRADES TAB ══════════ */}
          {activeTab === 'grades' && (
            <>
              <div className="sd-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 className="sd-page-title">Manage Grades</h1>
                  </div>
                  <button className="sd-btn-primary" onClick={handleOpenAdd}><FiPlus/>Add Grade</button>
                </div>
              </div>

              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div className="sd-table-search">
                    <FiSearch/>
                    <input
                      type="text"
                      placeholder="Search grades..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setGradesPage(1); }}
                    />
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Grade Name</th>
                        <th>Description</th>
                        <th>Direct Navigation</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(grades), gradesPage).map((g, i) => (
                        <tr key={g.id || i}>
                          <td style={{ fontWeight: 700 }}>#{g.sort_order}</td>
                          <td style={{ fontWeight: 600 }}>{g.grade_name}</td>
                          <td>{g.description || <span style={{ color:'#9ca3af', fontStyle:'italic' }}>No description</span>}</td>
                          <td>
                            <button onClick={() => { setSelectedGradeFilter(g.id); onTabChange('scenarios'); }} className="sd-btn-outline" style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                              <FiCornerDownRight/> Scenarios
                            </button>
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit" onClick={() => handleOpenEdit(g)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => handleDelete(g.id)} title="Delete"><FiTrash2/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterList(grades).length === 0 && (
                        <tr><td colSpan="5" className="sd-empty-state">No grades found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={filterList(grades).length} perPage={PER_PAGE} page={gradesPage} onPage={setGradesPage}/>
              </div>
            </>
          )}

          {/* ══════════ SCENARIOS TAB ══════════ */}
          {activeTab === 'scenarios' && (
            <>
              <div className="sd-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 className="sd-page-title">Manage Scenarios</h1>
                  </div>
                  <button className="sd-btn-primary" onClick={handleOpenAdd}><FiPlus/>Add Scenario</button>
                </div>
              </div>

              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', flex: 1 }}>
                    <div className="sd-table-search">
                      <FiSearch/>
                      <input
                        type="text"
                        placeholder="Search scenarios..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setScenariosPage(1); }}
                      />
                    </div>
                    <select className="sd-btn-filter" style={{ border: '1.5px solid #e8edf5', background: '#fff', fontSize: '0.8rem', fontWeight: 500 }}
                      value={selectedGradeFilter} onChange={e => { setSelectedGradeFilter(e.target.value); setScenariosPage(1); }}>
                      <option value="">All Grades</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.grade_name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Grade</th>
                        <th>Title</th>
                        <th>Duration</th>
                        <th>Difficulty</th>
                        <th>Status</th>
                        <th>Components</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(filterList(scenarios).filter(ex => !selectedGradeFilter || ex.grade?.id === parseInt(selectedGradeFilter) || ex.grade === parseInt(selectedGradeFilter)), scenariosPage).map((ex, i) => (
                        <tr key={ex.id || i}>
                          <td><span className="sd-badge sd-badge-active" style={{ background: '#e0f2fe', color: '#0369a1' }}>{ex.grade_name || `Grade ID: ${ex.grade}`}</span></td>
                          <td style={{ fontWeight: 600 }}>{ex.title}</td>
                          <td>{ex.estimated_duration} mins</td>
                          <td>
                            <span className={`sd-badge ${ex.difficulty === 'EASY' ? 'sd-badge-active' : ex.difficulty === 'HARD' ? 'sd-badge-leave' : 'sd-badge-review'}`}>
                              {ex.difficulty}
                            </span>
                          </td>
                          <td>
                            <span className={`sd-badge ${ex.status === 'PUBLISHED' ? 'sd-badge-published' : ex.status === 'REVIEW' ? 'sd-badge-review' : 'sd-badge-draft'}`}>
                              {ex.status}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => { setSelectedScenarioFilter(ex.id); onTabChange('scenario-builders'); }} className="btn-link" style={{ background:'none', border:'none', color:'#6366f1', textDecoration:'underline', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
                              Scenario Builders
                            </button>
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit" onClick={() => handlePreviewScenario(ex)} title="Preview"><FiBookOpen style={{ color:'#3b82f6' }}/></button>
                              <button className="sd-icon-action edit" onClick={() => handleOpenEdit(ex)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => handleDelete(ex.id)} title="Delete"><FiTrash2/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterList(scenarios).length === 0 && (
                        <tr><td colSpan="7" className="sd-empty-state">No scenarios found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={filterList(scenarios).filter(ex => !selectedGradeFilter || ex.grade?.id === parseInt(selectedGradeFilter) || ex.grade === parseInt(selectedGradeFilter)).length} perPage={PER_PAGE} page={scenariosPage} onPage={setScenariosPage}/>
              </div>
            </>
          )}

        </div>{/* /sd-content */}
      </main>

      {/* ════════════════════
          CRUD MODAL OVERLAY
          ════════════════════ */}
      {showModal && (
        <div className="sd-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="sd-modal">
            <div className="sd-modal-header">
              <span className="sd-modal-title">
                {modalType === 'add' ? 'Create' : 'Edit'} {activeTab.slice(0, -1).toUpperCase()}
              </span>
              <button className="sd-modal-close" onClick={() => setShowModal(false)}><FiX/></button>
            </div>
            {errorMsg && <div className="sd-alert sd-alert-error" style={{ marginBottom:'1rem' }}><FiX/>{errorMsg}</div>}
            <form className="sd-modal-form" onSubmit={handleFormSubmit}>

              {/* Schools Form */}
              {activeTab === 'schools' && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">School Name *</label>
                  <input className="sd-form-input" type="text" required value={schoolForm.school_name} onChange={e => setSchoolForm({ ...schoolForm, school_name: e.target.value })}/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Address *</label>
                  <input className="sd-form-input" type="text" required value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })}/>
                </div>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Phone *</label>
                    <input className="sd-form-input" type="text" required value={schoolForm.phone} onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })}/>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Email *</label>
                    <input className="sd-form-input" type="email" required value={schoolForm.email} onChange={e => setSchoolForm({ ...schoolForm, email: e.target.value })}/>
                  </div>
                </div>
                <label className="sd-checkbox-label">
                  <input type="checkbox" checked={schoolForm.is_active} onChange={e => setSchoolForm({ ...schoolForm, is_active: e.target.checked })}/>
                  Is Active
                </label>
              </>)}

              {/* Publish Content Form */}
              {(activeTab === 'publish-contents' || activeTab === 'reports') && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Release Name *</label>
                  <input className="sd-form-input" type="text" required value={publishForm.release_name} onChange={e => setPublishForm({ ...publishForm, release_name: e.target.value })}/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Grade *</label>
                  <select className="sd-form-input" required value={publishForm.grade} onChange={e => setPublishForm({ ...publishForm, grade: e.target.value })}>
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.grade_name}</option>)}
                  </select>
                </div>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Total Scenarios *</label>
                    <input className="sd-form-input" type="number" required value={publishForm.total_scenarios} onChange={e => setPublishForm({ ...publishForm, total_scenarios: parseInt(e.target.value) || 0 })}/>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Status *</label>
                    <select className="sd-form-input" value={publishForm.status} onChange={e => setPublishForm({ ...publishForm, status: e.target.value })}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Export File URL</label>
                  <input className="sd-form-input" type="text" value={publishForm.export_file} onChange={e => setPublishForm({ ...publishForm, export_file: e.target.value })}/>
                </div>
              </>)}

              {/* Grades Form */}
              {activeTab === 'grades' && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Grade Name *</label>
                  <input className="sd-form-input" type="text" required value={gradeForm.grade_name} onChange={e => setGradeForm({ ...gradeForm, grade_name: e.target.value })} placeholder="e.g. Grade 1"/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Description</label>
                  <textarea className="sd-form-input" value={gradeForm.description} onChange={e => setGradeForm({ ...gradeForm, description: e.target.value })} placeholder="Enter grade details"/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Sort Order *</label>
                  <input className="sd-form-input" type="number" required value={gradeForm.sort_order} onChange={e => setGradeForm({ ...gradeForm, sort_order: parseInt(e.target.value) || 0 })}/>
                </div>
              </>)}

              {/* Scenarios Form */}
              {activeTab === 'scenarios' && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Grade Level *</label>
                  <select className="sd-form-input" required value={scenarioForm.grade} onChange={e => setScenarioForm({ ...scenarioForm, grade: e.target.value })}>
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.grade_name}</option>)}
                  </select>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Title *</label>
                  <input className="sd-form-input" type="text" required value={scenarioForm.title} onChange={e => setScenarioForm({ ...scenarioForm, title: e.target.value })} placeholder="Beginner Lesson"/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Description</label>
                  <textarea className="sd-form-input" value={scenarioForm.description} onChange={e => setScenarioForm({ ...scenarioForm, description: e.target.value })}/>
                </div>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Duration *</label>
                    <input className="sd-form-input" type="number" required value={scenarioForm.estimated_duration} onChange={e => setScenarioForm({ ...scenarioForm, estimated_duration: parseInt(e.target.value) || 15 })}/>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Difficulty *</label>
                    <select className="sd-form-input" value={scenarioForm.difficulty} onChange={e => setScenarioForm({ ...scenarioForm, difficulty: e.target.value })}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Lifecycle Status *</label>
                  <select className="sd-form-input" value={scenarioForm.status} onChange={e => setScenarioForm({ ...scenarioForm, status: e.target.value })}>
                    <option value="DRAFT">Draft</option>
                    <option value="REVIEW">Review</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </>)}

              {/* Users & Roles / School Admin Form */}
              {(activeTab === 'school-admins' || activeTab === 'users-roles') && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Username *</label>
                  <input className="sd-form-input" type="text" required disabled={modalType === 'edit'} value={schoolAdminForm.username} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, username: e.target.value })}/>
                </div>
                {modalType === 'add' && (
                  <div className="sd-form-group">
                    <label className="sd-form-label">Password *</label>
                    <input className="sd-form-input" type="password" required value={schoolAdminForm.password || ''} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, password: e.target.value })}/>
                  </div>
                )}
                <div className="sd-form-group">
                  <label className="sd-form-label">Full Name *</label>
                  <input className="sd-form-input" type="text" required value={schoolAdminForm.full_name} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, full_name: e.target.value })}/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Email *</label>
                  <input className="sd-form-input" type="email" required value={schoolAdminForm.email} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, email: e.target.value })}/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">School Scope *</label>
                  <select className="sd-form-input" required value={schoolAdminForm.school} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, school: e.target.value })}>
                    <option value="">Select School</option>
                    {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name}</option>)}
                  </select>
                </div>
                <label className="sd-checkbox-label">
                  <input type="checkbox" checked={schoolAdminForm.is_active} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, is_active: e.target.checked })}/>
                  Active User Account
                </label>
              </>)}

              <div className="sd-modal-footer">
                <button type="button" className="sd-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sd-btn-save">Save Changes</button>
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
              if (!profileForm.current_password) { setErrorMsg('Current password required.'); return; }
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
                  setErrorMsg(typeof d === 'object' ? JSON.stringify(d) : 'Password change failed.');
                }
              } catch { setErrorMsg('Connection error.'); }
            }}>
              <div className="sd-form-group">
                <label className="sd-form-label">Current Password</label>
                <input className="sd-form-input" type="password" value={profileForm.current_password} onChange={e => setProfileForm({ ...profileForm, current_password: e.target.value })} placeholder="Enter current password" required/>
              </div>
              <div className="sd-form-group">
                <label className="sd-form-label">New Password</label>
                <input className="sd-form-input" type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} placeholder="Minimum 6 characters" required minLength={6}/>
              </div>
              <div className="sd-modal-footer">
                <button type="button" className="sd-btn-cancel" onClick={() => setShowPwModal(false)}>Cancel</button>
                <button type="submit" className="sd-btn-save">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Scenario Preview Modal ── */}
      {previewScenario && (
        <div className="sd-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setPreviewScenario(null); }}>
          <div className="sd-modal" style={{ maxWidth: 700 }}>
            <div className="sd-modal-header">
              <span className="sd-modal-title">Preview Scenario: {previewScenario.title}</span>
              <button className="sd-modal-close" onClick={() => setPreviewScenario(null)}><FiX/></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Grade:</strong> {previewScenario.grade_name || `Grade ID: ${previewScenario.grade}`}</div>
              <div><strong>Duration:</strong> {previewScenario.estimated_duration} mins</div>
              <div><strong>Difficulty:</strong> {previewScenario.difficulty}</div>
              <div><strong>Status:</strong> {previewScenario.status}</div>
            </div>
            <h4 style={{ marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>Scenario Steps</h4>
            <div className="sd-activity-list">
              {previewScenario.steps?.map((s, idx) => (
                <div className="sd-activity-item" key={s.id || idx}>
                  <div className="sd-activity-body">
                    <div className="sd-activity-name">Step #{s.display_order}: {s.title} ({s.block_type})</div>
                    {s.content && <div className="sd-activity-desc">{s.content}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="sd-modal-footer">
              <button className="sd-btn-cancel" onClick={() => setPreviewScenario(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/* ─── Merged user back-mapping helper ─── */
const saFromMerged = (mUser) => {
  return {
    id: mUser.id,
    username: mUser.username,
    full_name: mUser.full_name,
    email: mUser.email,
    is_active: mUser.is_active,
    school: mUser.school_id
  };
};

export default Dashboard;
