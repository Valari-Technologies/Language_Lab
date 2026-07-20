import React, { useState } from 'react';
import { apiFetch } from './api';
import { 
  FiGrid, FiBookOpen, FiActivity, FiMonitor, FiFileText, 
  FiCheckCircle, FiDownload, FiSettings, FiHelpCircle, FiLogOut, 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiMenu, 
  FiChevronDown, FiCalendar, FiBell, FiFilter, FiEye, 
  FiAlertTriangle, FiFolder, FiImage, FiSend, FiPlusCircle, 
  FiArrowLeft, FiSmartphone, FiTablet, FiInfo, FiUpload,
  FiPlay, FiCheck, FiFolderPlus, FiShare2, FiHelpCircle as FiQuestion,
  FiUser, FiClock
} from 'react-icons/fi';
import './Dashboard.css';
import contentCreatorHeaderBanner from './assets/content_creator_header_banner.png';
import logoIcon from './assets/icon.png';

/* ═══════════════════════════════════════════════════════════
   CONTENT STUDIO COMPONENT
   ═══════════════════════════════════════════════════════════ */
const ContentStudio = ({ user = { username: 'Aisha Khan', role: 'Content Creator' }, onLogout }) => {
  // Views: dashboard, experiences, experience-builder, activity-builder, screen-builder, preview, media, publish, profile
  const [view, setView] = useState('dashboard');
  const [selectedExperience, setSelectedExperience] = useState('At the Restaurant');
  const [selectedActivity, setSelectedActivity] = useState('Dialogue with Waiter');

  // Profile / Password states
  const [profileForm, setProfileForm] = useState({
    username: user?.username || 'content_creator',
    email: user?.email || '',
    full_name: user?.full_name || 'Aisha Khan'
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  const showFeedback = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 4000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/users/profile/', {
        method: 'PUT',
        body: JSON.stringify({ full_name: profileForm.full_name, email: profileForm.email })
      });
      if (res.ok) {
        showFeedback('Profile updated successfully!');
      } else {
        const data = await res.json();
        showFeedback(data.error || 'Failed to update profile.', 'error');
      }
    } catch {
      showFeedback('Network error occurred.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/users/change-password/', {
        method: 'POST',
        body: JSON.stringify({ old_password: passwordForm.current_password, new_password: passwordForm.password })
      });
      if (res.ok) {
        showFeedback('Password changed successfully!');
        setPasswordForm({ current_password: '', password: '' });
      } else {
        const data = await res.json();
        showFeedback(data.error || 'Password change failed.', 'error');
      }
    } catch {
      showFeedback('Network error occurred.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Media Library specific state
  const [selectedAsset, setSelectedAsset] = useState({
    name: 'restaurant_scene_01.jpg',
    type: 'Image (JPG)',
    size: '2.4 MB',
    dimensions: '1920 x 1080',
    date: 'May 20, 2025 10:15 AM',
    usage: '3 screens across 2 activities',
    tags: ['restaurant', 'scene', 'dining']
  });

  // Local Form states
  const [experienceForm, setExperienceForm] = useState({
    title: 'At the Restaurant',
    description: 'Students will learn how to order food and have polite conversations in a restaurant.',
    grade: 'Grade 4',
    subject: 'Speaking & Listening',
    language: 'English',
    difficulty: 'Medium',
    duration: 25,
    tags: ['real-life', 'conversation', 'polite', 'speaking']
  });

  const [activityForm, setActivityForm] = useState({
    title: 'Dialogue with Waiter',
    description: 'Learners will practice ordering food and interacting politely with a waiter.',
    objective: 'Students can order food and respond appropriately in a restaurant.',
    skills: ['Speaking', 'Listening'],
    duration: 15,
    mastery: 80
  });

  const [screenForm, setScreenForm] = useState({
    title: 'At the Café',
    content: 'At the Café',
    tag: 'H1',
    font: 'Poppins',
    weight: 'Bold',
    size: 48,
    color: '#1F2937'
  });

  // Runtime Preview state
  const [previewScreenNum, setPreviewScreenNum] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState('B');

  return (
    <div className="cs-layout">
      {/* Scope CSS variables & scoped rules */}
      <style>{`
        .cs-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #e5ecf4;
          color: #1e293b;
        }

        /* ── Sidebar ── */
        .cs-sidebar {
          width: 260px;
          background: linear-gradient(180deg, #006aa6 0%, #005080 100%);
          color: #cbd5e1;
          display: flex;
          flex-direction: column;
          height: 100%;
          border-right: 1px solid rgba(255, 255, 255, 0.03);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .cs-brand {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .cs-brand-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .cs-brand-sub {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.75);
          margin-top: 1px;
          font-weight: 500;
          display: block;
        }
        .cs-nav {
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .cs-nav::-webkit-scrollbar {
          display: none;
        }
        .cs-nav-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          color: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          text-align: left;
          transition: all 0.2s ease;
          width: 100%;
        }
        .cs-nav-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        .cs-nav-item.active {
          background: #ffffff !important;
          color: #006aa6 !important;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0, 106, 166, 0.15) !important;
        }
        .cs-nav-item svg { font-size: 1.15rem; flex-shrink: 0; color: rgba(255, 255, 255, 0.85); transition: color 0.18s; }
        .cs-nav-item:hover svg { color: #ffffff; }
        .cs-nav-item.active svg { color: #006aa6 !important; }
        .cs-sidebar-footer {
          padding: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          z-index: 5;
        }
        .cs-footer-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.55rem 0.85rem;
          color: #cbd5e1;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.82rem;
          text-align: left;
          border-radius: 6px;
          transition: all 0.2s;
          width: 100%;
        }
        .cs-footer-item:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.04);
        }
        .cs-profile-card {
          margin-top: 0.5rem;
          padding: 0.65rem 0.75rem;
          background: rgba(255, 255, 255, 0.01);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          transition: background 0.18s;
          cursor: pointer;
          z-index: 5;
        }
        .cs-profile-card:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .cs-profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #0284c7;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: bold;
          font-size: 0.85rem;
        }
        .cs-profile-info {
          flex: 1;
          min-width: 0;
        }
        .cs-profile-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cs-profile-desc {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
        }

        /* ── Main Area ── */
        .cs-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .cs-header {
          height: 60px;
          border-bottom: none;
          background-color: #e5ecf4;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .cs-header-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .cs-header-search-icon {
          position: absolute;
          left: 12px;
          color: #64748b;
          font-size: 0.95rem;
        }
        .cs-search-input {
          width: 380px;
          background-color: #ffffff;
          border: none;
          border-radius: 20px;
          padding: 0.5rem 1rem 0.5rem 2.25rem;
          font-size: 0.84rem;
          transition: all 0.2s;
          color: #0f172a;
        }
        .cs-search-input::placeholder {
          color: #94a3b8;
        }
        .cs-search-input:focus {
          background-color: #ffffff;
          border-color: #0284c7;
          outline: none;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }
        .cs-header-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .cs-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #475569;
          font-size: 1.15rem;
          display: flex;
          transition: color 0.2s;
          position: relative;
        }
        .cs-icon-btn:hover {
          color: #0284c7;
        }
        .cs-avatar-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid #e2e8f0;
        }



        .cs-body {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
        }

        /* Override banner card to remove border */
        .sd-dashboard-header-card {
          border: none !important;
          background-size: cover !important;
          background-position: center right !important;
          background-color: transparent !important;
        }

        /* ── Custom Cards ── */
        .cs-card {
          background-color: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02);
          padding: 1.25rem 1.5rem;
          transition: box-shadow 0.3s ease;
        }
        .cs-card:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05), 0 2px 5px rgba(0, 0, 0, 0.02);
        }
        .cs-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.75rem;
        }
        .cs-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .cs-card-sub {
          font-size: 0.78rem;
          color: #64748b;
          margin-top: 2px;
        }

        /* Buttons */
        .cs-btn-primary {
          background-color: #0252cc;
          color: #ffffff;
          border: none;
          padding: 0.55rem 1.1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          transition: background-color 0.2s;
        }
        .cs-btn-primary:hover {
          background-color: #0141a3;
        }
        .cs-btn-outline {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 0.55rem 1.1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cs-btn-outline:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
        }

        /* ── Grid/Layout lists ── */
        .cs-stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .cs-stat-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease;
          overflow: hidden;
        }
        .cs-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background-color: #0284c7;
          opacity: 0.8;
          transition: height 0.3s ease;
        }
        .cs-stat-card:hover {
          transform: translateY(-6px);
          border-color: #bae6fd;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.06), 0 5px 10px rgba(0, 0, 0, 0.02);
        }
        .cs-stat-card:hover::before {
          height: 6px;
        }
        .cs-stat-val-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .cs-stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
          margin-top: 0.25rem;
        }
        .cs-stat-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .cs-stat-trend {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.15rem 0.45rem;
          border-radius: 12px;
        }

        /* Tables */
        .cs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.84rem;
        }
        .cs-table th {
          color: #64748b;
          font-weight: 600;
          padding: 0.75rem 1rem;
          border-bottom: 1.5px solid #e2e8f0;
          text-transform: uppercase;
          font-size: 0.72rem;
          letter-spacing: 0.05em;
        }
        .cs-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
          vertical-align: middle;
        }
        .cs-table tr:hover td {
          background-color: #f8fafc;
        }

        /* Badges */
        .cs-badge {
          padding: 0.25rem 0.55rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
        }
        .cs-badge-draft {
          background-color: #ffedd5;
          color: #d97706;
        }
        .cs-badge-published {
          background-color: #dcfce7;
          color: #15803d;
        }

        /* Form Controls */
        .cs-form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.35rem;
        }
        .cs-form-input {
          width: 100%;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.84rem;
          font-family: inherit;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .cs-form-input:focus {
          border-color: #0284c7;
          outline: none;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
        }

        /* Pagination Styling */
        .cs-pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.25rem;
          padding-top: 0.75rem;
          border-top: 1px solid #f1f5f9;
        }
        .cs-page-link {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          background: #ffffff;
        }
        .cs-page-link.active {
          background-color: #0252cc;
          color: #ffffff;
          border-color: #0252cc;
        }

        /* Quick Actions Card */
        .cs-quick-action-card {
          cursor: pointer;
          padding: 1.5rem 1.25rem;
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #f1f5f9;
          background: #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        .cs-quick-action-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background-color: #0284c7;
          opacity: 0.8;
          transition: height 0.3s ease;
        }
        .cs-quick-action-card:hover {
          transform: translateY(-6px);
          border-color: #bae6fd;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.03);
          background-color: #fbfcfe;
        }
        .cs-quick-action-card:hover::before {
          height: 6px;
        }

        /* Screen Builder Elements */
        .cs-element-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem;
          text-align: center;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
        }
        .cs-element-card:hover {
          border-color: #0ea5e9;
          background-color: #f0f9ff;
        }
        .cs-element-icon {
          font-size: 1.25rem;
          color: #0ea5e9;
        }
        .cs-element-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #475569;
        }
      `}</style>

      {/* ── Sidebar ── */}
      <aside className="cs-sidebar">
        <div className="cs-brand">
          <img src={logoIcon} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <div>
            <h2 className="cs-brand-title">LinguaLab</h2>
            <span className="cs-brand-sub">Content Studio</span>
          </div>
        </div>

        <nav className="cs-nav">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: <FiGrid/> },
            { key: 'experiences', label: 'Experience Library', icon: <FiBookOpen/> },
            { key: 'experience-builder', label: 'Experience Builder', icon: <FiActivity/> },
            { key: 'activity-builder', label: 'Activity Builder', icon: <FiSettings/> },
            { key: 'screen-builder', label: 'Screen Builder', icon: <FiMonitor/> },
            { key: 'preview', label: 'Runtime Preview', icon: <FiPlay/> },
            { key: 'media', label: 'Media Library', icon: <FiImage/> },
            { key: 'publish', label: 'Publish Center', icon: <FiDownload/> },
            { key: 'profile', label: 'Profile Settings', icon: <FiUser/> },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`cs-nav-item ${view === item.key ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Locked nav options for reference */}
          <button className="cs-nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
            <FiCheckCircle/><span>Validation Center</span>
          </button>
        </nav>

        <div className="cs-sidebar-footer">
          <button className="cs-footer-item" onClick={onLogout} style={{ color: '#ef4444' }}><FiLogOut/>Logout</button>

          <div className="cs-profile-card">
            <div className="cs-profile-avatar">CC</div>
            <div className="cs-profile-info">
              <div className="cs-profile-name">Institute Name</div>
              <div className="cs-profile-desc">Location</div>
            </div>
            <FiChevronDown style={{ color: '#94a3b8' }}/>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="cs-content-area">
        {/* Header Bar */}
        <header className="cs-header">
          <div className="cs-header-search-wrap">
            <FiSearch className="cs-header-search-icon" />
            <input 
              className="cs-search-input" 
              type="text" 
              placeholder={view === 'experiences' ? "Search experiences by title, grade, subject" : "Search experiences, activities..."} 
            />
          </div>
          <div className="cs-header-actions">
            <button className="cs-icon-btn">
              <FiBell />
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>3</span>
            </button>
            <button className="cs-icon-btn"><FiHelpCircle /></button>
          </div>
        </header>

        {/* Content Body Router */}
        <div className="cs-body">

          {/* ───────────────── VIEW 1: STUDIO DASHBOARD (Image 2) ───────────────── */}
          {view === 'dashboard' && (
            <>
              {/* Premium Dashboard Header Card with Background Image */}
              <div className="sd-dashboard-header-card" style={{ backgroundImage: `url(${contentCreatorHeaderBanner})`, position: 'relative' }}>
                <div className="sd-header-text-section" style={{ maxWidth: '60%' }}>
                  <h1>Welcome back, Aisha!</h1>
                  <p>Empowering Better Learning Experiences.<br />Create, organize, and publish engaging educational content with ease.</p>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div className="cs-stat-row">
                {[
                  { label: 'Total Experiences', value: '128', icon: <FiFileText style={{ color: '#0284c7', fontSize: '1.5rem' }}/>, bg: '#e0f2fe', trend: '↑ 12 this month', trendBg: '#dcfce7', trendColor: '#15803d' },
                  { label: 'Draft Experiences', value: '42', icon: <FiFileText style={{ color: '#ea580c', fontSize: '1.5rem' }}/>, bg: '#ffedd5', trend: '↑ 5 this week', trendBg: '#ffedd5', trendColor: '#ea580c' },
                  { label: 'Published Experiences', value: '86', icon: <FiCheckCircle style={{ color: '#16a34a', fontSize: '1.5rem' }}/>, bg: '#dcfce7', trend: '↑ 10 this month', trendBg: '#dcfce7', trendColor: '#16a34a' },
                  { label: 'Total Media Assets', value: '532', icon: <FiImage style={{ color: '#7c3aed', fontSize: '1.5rem' }}/>, bg: '#f3e8ff', trend: '↑ 20 this month', trendBg: '#f3e8ff', trendColor: '#7c3aed' },
                ].map((stat, idx) => (
                  <div className="cs-stat-card" key={idx}>
                    <div className="cs-stat-val-row">
                      <div>
                        <span className="cs-stat-label">{stat.label}</span>
                        <div className="cs-stat-value">{stat.value}</div>
                      </div>
                      <div style={{ background: stat.bg, padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                        {stat.icon}
                      </div>
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>
                      <span className="cs-stat-trend" style={{ background: stat.trendBg, color: stat.trendColor }}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Grid row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Quick Actions Card */}
                  <div className="cs-card">
                    <div className="cs-card-header" style={{ marginBottom: '1.25rem' }}>
                      <h3 className="cs-card-title">Quick Actions</h3>
                      <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>View All</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
                      {[
                        { label: 'New Experience', desc: 'Create a new lesson', icon: <FiPlusCircle style={{ fontSize: '1.5rem', color: '#0284c7' }}/>, bg: '#e0f2fe', action: () => setView('experience-builder') },
                        { label: 'Experience Library', desc: 'Manage your content', icon: <FiFolder style={{ fontSize: '1.5rem', color: '#16a34a' }}/>, bg: '#dcfce7', action: () => setView('experiences') },
                        { label: 'Media Library', desc: 'Upload assets', icon: <FiImage style={{ fontSize: '1.5rem', color: '#7c3aed' }}/>, bg: '#f3e8ff', action: () => setView('media') },
                        { label: 'Publish Center', desc: 'Go live with content', icon: <FiSend style={{ fontSize: '1.5rem', color: '#ea580c' }}/>, bg: '#ffedd5', action: () => setView('publish') },
                      ].map((qa, idx) => (
                        <div key={idx} onClick={qa.action} className="cs-quick-action-card">
                          <div style={{ background: qa.bg, padding: '0.6rem', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto' }}>
                            {qa.icon}
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{qa.label}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>{qa.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Experiences Card */}
                  <div className="cs-card">
                    <div className="cs-card-header">
                      <h3 className="cs-card-title">Recent Experiences</h3>
                      <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }} onClick={() => setView('experiences')}>View All</button>
                    </div>
                    <div className="cs-table-wrap" style={{ overflowX: 'auto' }}>
                      <table className="cs-table">
                        <thead>
                          <tr>
                            <th>Experience Name</th>
                            <th>Grade</th>
                            <th>Status</th>
                            <th>Last Modified</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: 'Greetings - Level 1', grade: 'Grade 3', status: 'DRAFT', date: 'May 20, 2025' },
                            { name: 'At the Restaurant', grade: 'Grade 4', status: 'PUBLISHED', date: 'May 19, 2025' },
                            { name: 'Asking for Directions', grade: 'Grade 5', status: 'DRAFT', date: 'May 18, 2025' }
                          ].map((row, idx) => (
                            <tr key={idx}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{ width: 36, height: 26, background: '#f1f5f9', borderRadius: 4 }}/>
                                  <span style={{ fontWeight: 600 }}>{row.name}</span>
                                </div>
                              </td>
                              <td>{row.grade}</td>
                              <td>
                                <span className={`cs-badge ${row.status === 'PUBLISHED' ? 'cs-badge-published' : 'cs-badge-draft'}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td>{row.date}</td>
                              <td>
                                <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setSelectedExperience(row.name); setView('experience-builder'); }}>Open</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Recent Activity Card */}
                  <div className="cs-card">
                    <div className="cs-card-header">
                      <h3 className="cs-card-title">Recent Activity</h3>
                      <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>View All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { title: 'You edited "Greetings - Level 1"', time: '2 hours ago', icon: <FiEdit2 style={{ color: '#0284c7' }}/>, bg: '#e0f2fe', color: '#0284c7' },
                        { title: 'You uploaded "restaurant_scene.jpg"', time: '4 hours ago', icon: <FiUpload style={{ color: '#ea580c' }}/>, bg: '#ffedd5', color: '#ea580c' },
                        { title: '"At the Restaurant" published successfully', time: '1 day ago', icon: <FiCheckCircle style={{ color: '#16a34a' }}/>, bg: '#dcfce7', color: '#16a34a' },
                        { title: 'You edited "Food Vocabulary - Level 2"', time: '2 days ago', icon: <FiEdit2 style={{ color: '#7c3aed' }}/>, bg: '#f3e8ff', color: '#7c3aed' },
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                          <div style={{ background: item.bg, color: item.color, padding: '0.45rem', borderRadius: '50%', display: 'flex' }}>
                            {item.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{item.title}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{item.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notifications Card */}
                  <div className="cs-card">
                    <div className="cs-card-header">
                      <h3 className="cs-card-title">Notifications</h3>
                      <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>View All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[
                        { title: '3 experiences have validation errors', date: 'May 20, 2025', icon: <FiAlertTriangle/>, bg: '#fee2e2', color: '#b91c1c' },
                        { title: '"At the Restaurant" is ready to publish', date: 'May 19, 2025', icon: <FiInfo/>, bg: '#fef3c7', color: '#d97706' },
                        { title: 'System maintenance on May 25, 2025', date: 'May 18, 2025', icon: <FiSettings/>, bg: '#e0f2fe', color: '#0369a1' }
                      ].map((notif, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.65rem', padding: '0.75rem', borderRadius: '8px', background: notif.bg, color: notif.color, alignItems: 'center' }}>
                          <div style={{ fontSize: '1.1rem', display: 'flex' }}>{notif.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{notif.title}</div>
                            <div style={{ fontSize: '0.68rem', opacity: 0.8, marginTop: '2px' }}>{notif.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───────────────── VIEW 2: EXPERIENCE LIBRARY (Image 1) ───────────────── */}
          {view === 'experiences' && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Experience Library</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Create, manage and organize all learning experiences.</p>
              </div>

              {/* Filters list row */}
              <div className="cs-card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <select className="cs-filter-select"><option>All Grades</option></select>
                    <select className="cs-filter-select"><option>All Subjects</option></select>
                    <select className="cs-filter-select"><option>All Levels</option></select>
                    <select className="cs-filter-select"><option>All Status</option></select>
                    <select className="cs-filter-select"><option>All Tags</option></select>
                    <button style={{ border: 'none', background: 'none', color: '#0ea5e9', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ↺ Reset
                    </button>
                  </div>
                  <button className="cs-btn-primary" onClick={() => setView('experience-builder')}>+ New Experience</button>
                </div>
              </div>

              {/* Main table container */}
              <div className="cs-card" style={{ padding: '0' }}>
                <table className="cs-table">
                  <thead>
                    <tr>
                      <th>Experience</th>
                      <th>Grade</th>
                      <th>Subject</th>
                      <th>Difficulty</th>
                      <th>Status</th>
                      <th>Version</th>
                      <th>Last Modified</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Greetings and Introductions', desc: 'Basic greetings and self introduction', grade: 'Grade 3', sub: 'Speaking & Listening', diff: 'Easy', diffColor: '#10b981', status: 'DRAFT', ver: '1.0.0', date: 'May 20, 2025', tag: 'COMMUNICATION' },
                      { name: 'At the Restaurant', desc: 'Ordering food and polite conversation', grade: 'Grade 4', sub: 'Speaking & Listening', diff: 'Medium', diffColor: '#3b82f6', status: 'PUBLISHED', ver: '1.2.0', date: 'May 19, 2025', tag: 'REAL-LIFE' },
                      { name: 'Asking for Directions', desc: 'How to ask and give directions', grade: 'Grade 5', sub: 'Speaking & Listening', diff: 'Medium', diffColor: '#3b82f6', status: 'DRAFT', ver: '1.0.0', date: 'May 18, 2025', tag: 'COMMUNICATION' },
                      { name: 'Shopping for Clothes', desc: 'Shopping and talking about clothes', grade: 'Grade 3', sub: 'Reading', diff: 'Easy', diffColor: '#10b981', status: 'DRAFT', ver: '0.9.0', date: 'May 17, 2025', tag: 'VOCABULARY' }
                    ].map((row, idx) => (
                      <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => { setSelectedExperience(row.name); setView('experience-builder'); }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 48, height: 34, background: '#f1f5f9', borderRadius: 6 }}/>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {row.desc} &nbsp;
                                <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: 4 }}>{row.tag}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{row.grade}</td>
                        <td>{row.sub}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.diffColor }}/>
                            {row.diff}
                          </span>
                        </td>
                        <td>
                          <span className={`cs-badge ${row.status === 'PUBLISHED' ? 'cs-badge-published' : 'cs-badge-draft'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.ver}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{row.date}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>by Aisha Khan</div>
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <button className="cs-icon-btn" style={{ marginLeft: 'auto' }}>⋮</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Table Footer */}
                <div style={{ padding: '1rem 1.5rem' }}>
                  <div className="cs-pagination-bar">
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing 1 to 6 of 24 experiences</span>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button className="cs-page-link">&lt;</button>
                      <button className="cs-page-link active">1</button>
                      <button className="cs-page-link">2</button>
                      <button className="cs-page-link">3</button>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', padding: '0 4px' }}>...</span>
                      <button className="cs-page-link">&gt;</button>

                      <select className="cs-filter-select" style={{ height: 28, padding: '0 0.5rem', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                        <option>10 per page</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───────────────── VIEW 3: EXPERIENCE BUILDER (Image 3) ───────────────── */}
          {view === 'experience-builder' && (
            <>
              {/* Top breadcrumb navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="cs-icon-btn" onClick={() => setView('experiences')}><FiArrowLeft/></button>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Experience Library &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Experience Builder</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{experienceForm.title}</h1>
                      <button className="cs-icon-btn" style={{ fontSize: '0.85rem' }}><FiEdit2/></button>
                      <span className="cs-badge cs-badge-draft">Draft</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      {experienceForm.grade} · {experienceForm.subject} · {experienceForm.difficulty} · Estimated Duration: {experienceForm.duration} min
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="cs-btn-outline" onClick={() => setView('preview')}>Preview</button>
                  <button className="cs-btn-outline">Save Draft</button>
                  <button className="cs-btn-primary" style={{ background: '#4f46e5' }} onClick={() => setView('publish')}>Publish</button>
                </div>
              </div>

              {/* Layout grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem' }}>
                {/* Left Card: Form */}
                <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: 0 }}>Experience Information</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Experience Title <span style={{ color: '#ef4444' }}>*</span></label>
                        <input className="cs-form-input" type="text" value={experienceForm.title}
                          onChange={e => setExperienceForm({ ...experienceForm, title: e.target.value })}/>
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
                        <textarea className="cs-form-input" style={{ minHeight: '75px', resize: 'vertical' }} value={experienceForm.description}
                          onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })}/>
                        <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>78 / 200</div>
                      </div>
                    </div>

                    {/* Thumbnail box */}
                    <div>
                      <label className="cs-form-label">Thumbnail</label>
                      <div style={{ border: '1.5px dashed #cbd5e1', borderRadius: '10px', padding: '1rem', textAlign: 'center', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 44, height: 34, background: '#f1f5f9', borderRadius: 4, marginBottom: 8 }}/>
                        <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, cursor: 'pointer' }}>Change Thumbnail</span>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>JPG, PNG (Max 2MB)</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Grade <span style={{ color: '#ef4444' }}>*</span></label>
                      <select className="cs-form-input" value={experienceForm.grade}
                        onChange={e => setExperienceForm({ ...experienceForm, grade: e.target.value })}>
                        <option value="Grade 3">Grade 3</option>
                        <option value="Grade 4">Grade 4</option>
                        <option value="Grade 5">Grade 5</option>
                      </select>
                    </div>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Subject <span style={{ color: '#ef4444' }}>*</span></label>
                      <select className="cs-form-input" value={experienceForm.subject}
                        onChange={e => setExperienceForm({ ...experienceForm, subject: e.target.value })}>
                        <option value="Speaking & Listening">Speaking & Listening</option>
                        <option value="Reading">Reading</option>
                        <option value="Writing">Writing</option>
                      </select>
                    </div>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Language</label>
                      <select className="cs-form-input" value={experienceForm.language}
                        onChange={e => setExperienceForm({ ...experienceForm, language: e.target.value })}>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                      </select>
                    </div>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Difficulty <span style={{ color: '#ef4444' }}>*</span></label>
                      <select className="cs-form-input" value={experienceForm.difficulty}
                        onChange={e => setExperienceForm({ ...experienceForm, difficulty: e.target.value })}>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Estimated Duration (min)</label>
                      <input className="cs-form-input" type="number" value={experienceForm.duration}
                        onChange={e => setExperienceForm({ ...experienceForm, duration: parseInt(e.target.value) || 0 })}/>
                    </div>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Tags</label>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 4 }}>
                        {experienceForm.tags.map(t => (
                          <span key={t} style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            {t} <span style={{ cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Learning outcomes */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className="cs-form-label" style={{ margin: 0 }}>Learning Outcomes</span>
                      <button className="cs-btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}>+ Add Outcome</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[
                        'Students can greet and respond politely in a restaurant.',
                        'Students can order food and drinks using correct expressions.',
                        'Students can understand and follow restaurant conversations.'
                      ].map((out, idx) => (
                        <div key={idx} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 8, fontSize: '0.8rem', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                          <span style={{ color: '#334155' }}>{out}</span>
                          <div style={{ display: 'flex', gap: '0.45rem' }}>
                            <button className="cs-icon-btn" style={{ fontSize: '0.78rem' }}><FiEdit2/></button>
                            <button className="cs-icon-btn" style={{ fontSize: '0.78rem' }}><FiTrash2/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom tags */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {experienceForm.tags.map(t => (
                        <span key={t} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                          {t}
                        </span>
                      ))}
                      <button style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>+ Add Tag</button>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCheckCircle/> All changes saved &nbsp;•&nbsp; <span style={{ color: '#64748b' }}>Last saved: May 20, 2025 10:42 AM</span>
                    </span>
                  </div>
                </div>

                {/* Right Card: Activity Timeline */}
                <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className="cs-card-title">Activity Overview</h3>
                      <div className="cs-card-sub">Total Activities: 5 · Total Duration: 25 min</div>
                    </div>
                    <button className="cs-btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setView('activity-builder')}>+ Add Activity</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1rem', marginTop: '0.75rem' }}>
                    {/* Timeline Line */}
                    <div style={{ position: 'absolute', left: 23, top: 10, bottom: 10, width: 2, background: '#cbd5e1', zIndex: 1 }}/>

                    {[
                      { num: 1, title: 'Introduction', desc: 'Introduction to the restaurant experience', type: 'Video', time: '02:30' },
                      { num: 2, title: 'Dialogue', desc: 'Watch and listen to the conversation', type: 'Interactive', time: '08:00', active: true },
                      { num: 3, title: 'Comprehension Check', desc: 'Answer questions about the dialogue', type: 'Quiz', time: '04:00' },
                      { num: 4, title: 'Speaking Practice', desc: 'Practice ordering food', type: 'Speaking', time: '08:00' },
                      { num: 5, title: 'Wrap Up', desc: 'Key takeaways and recap', type: 'Summary', time: '02:30' }
                    ].map(act => (
                      <div
                        key={act.num}
                        onClick={() => { setSelectedActivity(act.title); setView('activity-builder'); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          position: 'relative',
                          zIndex: 2,
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: 8,
                          background: act.active ? '#f0f9ff' : 'none',
                          border: act.active ? '1.5px solid #0ea5e9' : '1.5px solid transparent'
                        }}
                      >
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: act.active ? '#0ea5e9' : '#ffffff',
                          border: '2px solid #0ea5e9',
                          color: act.active ? '#ffffff' : '#0ea5e9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {act.num}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{act.title}</span>
                            <span style={{ fontSize: '0.72rem', background: '#e2e8f0', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>{act.type}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{act.desc}</span>
                            <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>{act.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: '0.85rem', textAlign: 'center', marginTop: '1rem', fontSize: '0.72rem', color: '#64748b' }}>
                    Drag and drop activities to reorder. The order of activities defines the flow for learners.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───────────────── VIEW 4: ACTIVITY BUILDER (Image 4) ───────────────── */}
          {view === 'activity-builder' && (
            <>
              {/* Top breadcrumbs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="cs-icon-btn" onClick={() => setView('experience-builder')}><FiArrowLeft/></button>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Experience Library &nbsp;&gt;&nbsp; Experience Builder &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Activity Builder</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{activityForm.title}</h1>
                      <button className="cs-icon-btn" style={{ fontSize: '0.85rem' }}><FiEdit2/></button>
                      <span className="cs-badge cs-badge-draft">Draft</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      Grade 4 · Speaking &amp; Listening · Medium · Estimated Duration: {activityForm.duration} min
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="cs-btn-outline" onClick={() => setView('preview')}>Preview</button>
                  <button className="cs-btn-outline">Save Draft</button>
                  <button className="cs-btn-primary" style={{ background: '#4f46e5' }} onClick={() => setView('publish')}>Publish</button>
                </div>
              </div>

              {/* Layout grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}>
                {/* Left Column: Form and Timeline Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Activity Title <span style={{ color: '#ef4444' }}>*</span></label>
                        <input className="cs-form-input" type="text" value={activityForm.title}
                          onChange={e => setActivityForm({ ...activityForm, title: e.target.value })}/>
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Skills</label>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 4 }}>
                          {activityForm.skills.map(s => (
                            <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                              {s} <span style={{ cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Description</label>
                        <textarea className="cs-form-input" style={{ minHeight: '65px' }} value={activityForm.description}
                          onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}/>
                        <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>66 / 300</div>
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Learning Objective</label>
                        <textarea className="cs-form-input" style={{ minHeight: '65px' }} value={activityForm.objective}
                          onChange={e => setActivityForm({ ...activityForm, objective: e.target.value })}/>
                        <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>67 / 300</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Estimated Duration (min)</label>
                        <input className="cs-form-input" type="number" value={activityForm.duration}
                          onChange={e => setActivityForm({ ...activityForm, duration: parseInt(e.target.value) || 0 })}/>
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Mastery Threshold (%)</label>
                        <input className="cs-form-input" type="number" value={activityForm.mastery}
                          onChange={e => setActivityForm({ ...activityForm, mastery: parseInt(e.target.value) || 0 })}/>
                      </div>
                    </div>
                  </div>

                  {/* Screen Timeline list */}
                  <div className="cs-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h3 className="cs-card-title">Screen Timeline</h3>
                        <div className="cs-card-sub">Drag and drop to reorder screens</div>
                      </div>
                      <button className="cs-btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>+ Add Screen</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {[
                        { num: 1, title: 'Welcome Screen', type: 'Information', dur: '01:00', status: 'Complete', dotColor: '#16a34a' },
                        { num: 2, title: 'Restaurant Introduction', type: 'Image', dur: '01:20', status: 'Complete', dotColor: '#16a34a', active: true },
                        { num: 3, title: 'Conversation Video', type: 'Video', dur: '03:00', status: 'Complete', dotColor: '#16a34a' },
                        { num: 4, title: 'Comprehension Quiz', type: 'Quiz', dur: '04:00', status: 'In Progress', dotColor: '#ea580c' },
                        { num: 5, title: 'Speaking Practice', type: 'Speaking', dur: '03:30', status: 'Not Started', dotColor: '#94a3b8' },
                        { num: 6, title: 'Writing Exercise', type: 'Writing', dur: '02:00', status: 'Not Started', dotColor: '#94a3b8' }
                      ].map(sc => (
                        <div
                          key={sc.num}
                          onClick={() => setView('screen-builder')}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: sc.active ? '#f0f9ff' : '#f8fafc',
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            border: sc.active ? '1.5px solid #0ea5e9' : '1px solid #e2e8f0',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ color: '#94a3b8', cursor: 'grab' }}>☰</span>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                              {sc.num}
                            </div>
                            <span style={{ fontWeight: 600 }}>{sc.title}</span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b', background: '#fff', padding: '1px 5px', borderRadius: 4, border: '1px solid #e2e8f0' }}>{sc.type}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <span style={{ color: '#64748b', fontSize: '0.72rem' }}>🕒 {sc.dur}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dotColor }}/>
                              {sc.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', marginTop: '1rem', paddingTop: '0.75rem', fontSize: '0.72rem', color: '#64748b' }}>
                      <span>AUTO SAVE: <span style={{ color: '#16a34a', fontWeight: 600 }}>All changes saved 10:42 AM</span></span>
                      <span>VALIDATION STATUS: <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ No issues found (Last validated: 10:40 AM)</span></span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Overview cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Activity Overview Metadata Card */}
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0' }}>Activity Overview</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.78rem' }}>
                      {[
                        { label: 'Activity ID', value: 'ACT-00057' },
                        { label: 'Created By', value: 'Aisha Khan' },
                        { label: 'Created On', value: 'May 20, 2025 10:15 AM' },
                        { label: 'Last Modified', value: 'May 20, 2025 10:42 AM' }
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>{row.label}</span>
                          <span style={{ fontWeight: 600 }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips Card */}
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0' }}>Tips for Activity Builder</h3>
                    <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      <li style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ color: '#0ea5e9' }}>✓</span> Arrange screens in the order you want learners to experience them.</li>
                      <li style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ color: '#0ea5e9' }}>✓</span> Use different screen types to create engaging activities.</li>
                      <li style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ color: '#0ea5e9' }}>✓</span> Validate your activity before publishing.</li>
                    </ul>
                  </div>

                  {/* Screen Types Card */}
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0' }}>Screen Types</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                      {[
                        { label: 'Information', desc: 'Display text instructions', icon: <FiInfo style={{ color: '#0284c7' }}/>, bg: '#e0f2fe' },
                        { label: 'Image', desc: 'Show images with explanations', icon: <FiImage style={{ color: '#16a34a' }}/>, bg: '#dcfce7' },
                        { label: 'Video', desc: 'Play video content', icon: <FiMonitor style={{ color: '#7c3aed' }}/>, bg: '#f3e8ff' },
                        { label: 'Quiz', desc: 'Ask questions & evaluate', icon: <FiCheckCircle style={{ color: '#ea580c' }}/>, bg: '#ffedd5' },
                        { label: 'Speaking', desc: 'Record & evaluate speech', icon: <FiActivity style={{ color: '#be123c' }}/>, bg: '#ffe4e6' },
                        { label: 'Writing', desc: 'Type descriptive responses', icon: <FiFileText style={{ color: '#0369a1' }}/>, bg: '#e0f2fe' }
                      ].map(type => (
                        <div key={type.label} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ background: type.bg, padding: '0.35rem', borderRadius: 6, display: 'flex' }}>{type.icon}</div>
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>{type.label}</div>
                            <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '1px' }}>{type.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───────────────── VIEW 5: SCREEN BUILDER (Image 5) ───────────────── */}
          {view === 'screen-builder' && (
            <>
              {/* Top navigation header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="cs-icon-btn" onClick={() => setView('activity-builder')}><FiArrowLeft/></button>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      All Experiences &nbsp;&gt;&nbsp; Beginner English &nbsp;&gt;&nbsp; Daily Conversations &nbsp;&gt;&nbsp; Activity 2 &nbsp;&gt;&nbsp; Conversation 1 &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Screen 2</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Dialogue with Waiter</h1>
                      <button className="cs-icon-btn" style={{ fontSize: '0.85rem' }}><FiEdit2/></button>
                      <span className="cs-badge cs-badge-draft">Draft</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>✓ Saved 2 min ago</span>
                  <button className="cs-btn-outline" onClick={() => setView('preview')}>Preview</button>
                  <button className="cs-btn-outline">Save Draft</button>
                  <button className="cs-btn-primary" style={{ background: '#4f46e5' }} onClick={() => setView('publish')}>Publish</button>
                </div>
              </div>

              {/* 3 Column Builder Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: '1.25rem', height: 'calc(100vh - 165px)', minHeight: 520 }}>
                
                {/* Column 1: Add Elements */}
                <div className="cs-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Add Elements</span>
                  <div style={{ position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', left: 8, top: 9, color: '#94a3b8', fontSize: '0.85rem' }}/>
                    <input className="cs-form-input" style={{ paddingLeft: '1.75rem', height: 28, fontSize: '0.75rem' }} type="text" placeholder="Search elements..."/>
                  </div>
                  
                  {/* Sub-tabs header */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '0.35rem', paddingBottom: 2 }}>
                    <button style={{ border: 'none', background: 'none', borderBottom: '2px solid #0284c7', color: '#0284c7', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer', padding: '0.2rem' }}>BASICS</button>
                    {['INTERACTIVE', 'MEDIA', 'LAYOUT'].map(tab => (
                      <button key={tab} style={{ border: 'none', background: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.65rem', cursor: 'pointer', padding: '0.2rem' }}>{tab}</button>
                    ))}
                  </div>

                  {/* Elements Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', overflowY: 'auto' }}>
                    {[
                      { label: 'TEXT', icon: <FiFileText/> },
                      { label: 'HEADING', icon: <FiFileText/> },
                      { label: 'IMAGE', icon: <FiImage/> },
                      { label: 'AUDIO', icon: <FiSend/> },
                      { label: 'VIDEO', icon: <FiMonitor/> },
                      { label: 'CHARACTER', icon: <FiUser/> },
                      { label: 'MCQ', icon: <FiCheckCircle/> },
                      { label: 'DRAG & DROP', icon: <FiGrid/> },
                      { label: 'FILL BLANKS', icon: <FiPlusCircle/> },
                      { label: 'ROW', icon: <FiGrid/> },
                      { label: 'COLUMN', icon: <FiGrid/> },
                      { label: 'CARD', icon: <FiFolder/> },
                    ].map(el => (
                      <div className="cs-element-card" key={el.label}>
                        <span className="cs-element-icon" style={{ display: 'flex' }}>{el.icon}</span>
                        <span className="cs-element-label">{el.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Center Canvas Screen Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
                  {/* Canvas Toolbar Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.45rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Screen Title: <span style={{ color: '#0284c7' }}>{screenForm.title}</span></span>
                    
                    {/* Device selector buttons */}
                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                      <button className="cs-icon-btn" style={{ fontSize: '0.95rem' }}><FiMonitor/></button>
                      <button className="cs-icon-btn" style={{ fontSize: '0.95rem' }}><FiTablet/></button>
                      <button className="cs-icon-btn" style={{ fontSize: '0.95rem' }}><FiSmartphone/></button>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', padding: '0 0.25rem' }}>|</span>
                      <select className="cs-filter-select" style={{ height: 24, fontSize: '0.7rem', padding: '0 0.35rem' }} defaultValue="1280 px">
                        <option>1280 px</option>
                        <option>1920 px</option>
                      </select>
                    </div>
                  </div>

                  {/* Main illustrated canvas container */}
                  <div style={{ flex: 1, border: '1.5px dashed #cbd5e1', background: '#ffffff', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                    {/* Canvas Inner container */}
                    <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                      
                      {/* Floating toolbar */}
                      <div style={{ position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', background: '#ffffff', padding: '0.35rem 0.75rem', borderRadius: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', gap: '0.65rem', zIndex: 10, alignItems: 'center' }}>
                        <button style={{ border: 'none', background: 'none', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>T</button>
                        <button style={{ border: 'none', background: 'none', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>=</button>
                        <button style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex' }}><FiEdit2 style={{ fontSize: '0.78rem' }}/></button>
                        <button style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex' }}><FiTrash2 style={{ fontSize: '0.78rem' }}/></button>
                      </div>

                      {/* Header block */}
                      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: screenForm.color, fontFamily: screenForm.font }}>At the Café</h2>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Listen to the conversation and answer the questions.</p>
                      </div>

                      {/* Illustrated Characters dialogue scene mockup */}
                      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', flex: 1, marginBottom: '1rem', position: 'relative', minHeight: 200 }}>
                        {/* Waiter (Ben) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                          {/* Dialogue bubble */}
                          <div style={{ position: 'absolute', top: -45, left: 30, background: '#e0f2fe', border: '1.5px solid #0ea5e9', padding: '0.45rem 0.75rem', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, color: '#0369a1', whiteSpace: 'nowrap' }}>
                            Ben: Hi! What would you like to order?
                          </div>
                          {/* Avatar figure placeholder */}
                          <div style={{ width: 72, height: 110, background: '#bae6fd', borderRadius: '12px 12px 0 0', border: '2px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1' }}>Waiter (Ben)</span>
                          </div>
                        </div>

                        {/* Customer (Anna) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                          {/* Dialogue bubble */}
                          <div style={{ position: 'absolute', top: -45, right: 30, background: '#fef3c7', border: '1.5px solid #d97706', padding: '0.45rem 0.75rem', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, color: '#b45309', whiteSpace: 'nowrap' }}>
                            Anna: I'd like a cup of coffee, please.
                          </div>
                          {/* Avatar figure placeholder */}
                          <div style={{ width: 72, height: 110, background: '#fef3c7', borderRadius: '12px 12px 0 0', border: '2px solid #d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309' }}>Anna</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline steps slider panel */}
                    <div style={{ borderTop: '1.5px solid #cbd5e1', background: '#f8fafc', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Timeline / Steps (For Conversation Screens)</span>
                        <button className="cs-btn-outline" style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem' }}>+ Add Step</button>
                      </div>
                      <div style={{ display: 'flex', gap: '0.55rem' }}>
                        {[
                          { step: 1, name: 'Ben', text: 'Hi! What would you like to order?' },
                          { step: 2, name: 'Anna', text: 'I\'d like a cup of coffee, please.' }
                        ].map(st => (
                          <div key={st.step} style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '0.45rem', fontSize: '0.7rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 2, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, color: '#0284c7' }}>Step {st.step}: {st.name}</span>
                              <span style={{ color: '#94a3b8' }}>✏️</span>
                            </div>
                            <span style={{ color: '#475569' }}>{st.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Right Properties Panel */}
                <div className="cs-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                  {/* Tabs header */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '0.35rem', paddingBottom: 4 }}>
                    <button style={{ border: 'none', background: 'none', borderBottom: '2.5px solid #0284c7', color: '#0284c7', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', padding: '0.2rem' }}>PROPERTIES</button>
                    {['STYLE', 'ANIMATION', 'ADVANCED'].map(tab => (
                      <button key={tab} style={{ border: 'none', background: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer', padding: '0.2rem' }}>{tab}</button>
                    ))}
                  </div>

                  {/* Properties form fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Content</label>
                      <textarea className="cs-form-input" style={{ minHeight: '50px', fontSize: '0.78rem' }} value={screenForm.content}
                        onChange={e => setScreenForm({ ...screenForm, content: e.target.value })}/>
                    </div>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Tag</label>
                      <input className="cs-form-input" style={{ height: 26, fontSize: '0.78rem' }} type="text" value={screenForm.tag}
                        onChange={e => setScreenForm({ ...screenForm, tag: e.target.value })}/>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                      <span className="cs-form-label">Alignment</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem' }}>
                        {['Left', 'Center', 'Right', 'Justify'].map(align => (
                          <button key={align} className="cs-btn-outline" style={{ padding: '0.25rem 0', fontSize: '0.68rem', fontWeight: 500 }}>{align}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      <span className="cs-form-label" style={{ margin: 0 }}>Typography</span>
                      <div className="cs-form-group">
                        <label className="cs-form-label" style={{ fontSize: '0.7rem' }}>Font Family</label>
                        <select className="cs-form-input" style={{ height: 26, fontSize: '0.78rem', padding: '0 0.5rem' }} value={screenForm.font}
                          onChange={e => setScreenForm({ ...screenForm, font: e.target.value })}>
                          <option value="Poppins">Poppins</option>
                          <option value="Inter">Inter</option>
                          <option value="Roboto">Roboto</option>
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="cs-form-group">
                          <label className="cs-form-label" style={{ fontSize: '0.7rem' }}>Weight</label>
                          <select className="cs-form-input" style={{ height: 26, fontSize: '0.78rem', padding: '0 0.5rem' }} value={screenForm.weight}
                            onChange={e => setScreenForm({ ...screenForm, weight: e.target.value })}>
                            <option value="Bold">Bold</option>
                            <option value="SemiBold">SemiBold</option>
                            <option value="Normal">Normal</option>
                          </select>
                        </div>
                        <div className="cs-form-group">
                          <label className="cs-form-label" style={{ fontSize: '0.7rem' }}>Size (px)</label>
                          <input className="cs-form-input" style={{ height: 26, fontSize: '0.78rem' }} type="number" value={screenForm.size}
                            onChange={e => setScreenForm({ ...screenForm, size: parseInt(e.target.value) || 0 })}/>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.5rem' }}>
                        <div className="cs-form-group">
                          <label className="cs-form-label" style={{ fontSize: '0.7rem' }}>Line Height</label>
                          <input className="cs-form-input" style={{ height: 26, fontSize: '0.78rem' }} type="text" defaultValue="1.3"/>
                        </div>
                        <div className="cs-form-group">
                          <label className="cs-form-label" style={{ fontSize: '0.7rem' }}>Text Color</label>
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <div style={{ width: 18, height: 18, borderRadius: 4, background: screenForm.color, border: '1px solid #cbd5e1' }}/>
                            <input className="cs-form-input" style={{ height: 26, fontSize: '0.75rem', padding: '2px 4px' }} type="text" value={screenForm.color}
                              onChange={e => setScreenForm({ ...screenForm, color: e.target.value })}/>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Margin & Padding Grid visual mock */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                      <span className="cs-form-label">Spacing</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem', fontSize: '0.7rem' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#64748b' }}>MARGIN</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginTop: 2 }}>
                            {['10', '10', '0', '10'].map((val, idx) => (
                              <input key={idx} style={{ height: 22, textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: 4, width: '100%', fontSize: '0.72rem' }} type="text" defaultValue={val}/>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#64748b' }}>PADDING</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginTop: 2 }}>
                            {['12', '16', '12', '16'].map((val, idx) => (
                              <input key={idx} style={{ height: 22, textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: 4, width: '100%', fontSize: '0.72rem' }} type="text" defaultValue={val}/>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ───────────────── VIEW 6: RUNTIME PREVIEW (Image 1 of remaining) ───────────────── */}
          {view === 'preview' && (
            <>
              {/* Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Experience Builder &nbsp;&gt;&nbsp; At the Restaurant (Grade 4) &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Runtime Preview</span>
                  </div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '4px 0 0 0' }}>Runtime Preview</h1>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Preview the experience exactly as students will see it in the EnglishLab Desktop Application.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.55rem' }}>
                  <button className="cs-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setView('experience-builder')}>
                    <FiX/> Exit Preview
                  </button>
                  <button className="cs-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setPreviewScreenNum(3); setSelectedAnswer('B'); }}>
                    ↺ Restart Experience
                  </button>
                  <button className="cs-btn-primary" style={{ background: '#4f46e5', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setView('experience-builder')}>
                    End Preview
                  </button>
                </div>
              </div>

              {/* Main Preview layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem' }}>
                
                {/* Left Workspace */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Info Row Bar */}
                  <div className="cs-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '2.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>EXPERIENCE</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>At the Restaurant (Grade 4)</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>ACTIVITY</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>Dialogue with Waiter</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>SCREEN</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{previewScreenNum} of 6 • Conversation Video</div>
                      </div>
                    </div>
                    {/* Toggle button */}
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 20, padding: 2 }}>
                      <button style={{ border: 'none', background: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '0.35rem 0.85rem', borderRadius: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                        Student View
                      </button>
                    </div>
                  </div>

                  {/* Device Workspace container */}
                  <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', background: '#ffffff', minHeight: 480, border: '1.5px solid #cbd5e1' }}>
                    {/* Workspace Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
                        <FiBell style={{ color: '#0284c7' }}/>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Listen to the conversation.</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Then answer the question.</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>1 / 1</span>
                    </div>

                    {/* Illustrated Café Video preview */}
                    <div style={{ flex: 1, background: '#1e293b', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#fff', position: 'relative', minHeight: 220 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#0b092b' }}>
                        {/* Mock characters video frame */}
                        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', position: 'relative', width: '100%', justifyContent: 'space-around' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 64, height: 90, background: '#bae6fd', borderRadius: 8, border: '2px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}>Ben</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', display: 'block', marginTop: 4 }}>Waiter</span>
                          </div>
                          
                          {/* Play overlay button */}
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <span style={{ fontSize: '1.25rem' }}>▶</span>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 64, height: 90, background: '#fef3c7', borderRadius: 8, border: '2px solid #d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>Anna</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', display: 'block', marginTop: 4 }}>Customer</span>
                          </div>
                        </div>
                      </div>

                      {/* Video progress controls bar */}
                      <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span>00:12 / 00:45</span>
                        <div style={{ flex: 1, margin: '0 1rem', height: 4, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: '27%', height: '100%', background: '#6366f1' }}/>
                        </div>
                        <div style={{ display: 'flex', gap: '0.55rem' }}>
                          <span>🔊</span>
                          <span>⚙️</span>
                          <span>⛶</span>
                        </div>
                      </div>
                    </div>

                    {/* Question text */}
                    <div style={{ margin: '1.25rem 0 0.75rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <FiHelpCircle style={{ color: '#6366f1' }}/>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>What would the boy like to order?</h4>
                    </div>

                    {/* Radio responses list */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      {[
                        { key: 'A', text: 'Pizza' },
                        { key: 'B', text: 'Burger' },
                        { key: 'C', text: 'Sandwich' },
                        { key: 'D', text: 'Salad' }
                      ].map(ans => (
                        <div
                          key={ans.key}
                          onClick={() => setSelectedAnswer(ans.key)}
                          style={{
                            border: selectedAnswer === ans.key ? '2px solid #6366f1' : '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: selectedAnswer === ans.key ? '#f5f3ff' : '#ffffff',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%',
                            border: selectedAnswer === ans.key ? '5px solid #6366f1' : '1.5px solid #94a3b8',
                            background: '#ffffff',
                            boxSizing: 'border-box'
                          }}/>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{ans.key}. {ans.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Submit action button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="cs-btn-primary" style={{ background: '#4f46e5', padding: '0.5rem 1.75rem' }} onClick={() => alert('Answer Submitted!')}>
                        Submit
                      </button>
                    </div>
                  </div>

                  {/* Previous / Next footer controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="cs-btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}
                      disabled={previewScreenNum <= 1} onClick={() => setPreviewScreenNum(prev => prev - 1)}>
                      ← Previous Screen
                    </button>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <div
                          key={num}
                          onClick={() => setPreviewScreenNum(num)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: previewScreenNum === num ? '#6366f1' : '#fff',
                            border: '1.5px solid #cbd5e1',
                            color: previewScreenNum === num ? '#ffffff' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                    <button className="cs-btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}
                      disabled={previewScreenNum >= 6} onClick={() => setPreviewScreenNum(prev => prev + 1)}>
                      Next Screen →
                    </button>
                  </div>
                </div>

                {/* Right Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Runtime Information Card */}
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      📊 Runtime Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.78rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ color: '#64748b' }}>ACTIVITY PROGRESS</span>
                          <span style={{ fontWeight: 700 }}>60%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: '60%', height: '100%', background: '#6366f1' }}/>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ color: '#64748b' }}>SCREEN PROGRESS</span>
                          <span style={{ fontWeight: 700 }}>50%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: '50%', height: '100%', background: '#0ea5e9' }}/>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ color: '#64748b' }}>SCORE</span>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>70 / 100</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>TIME SPENT</span>
                        <span style={{ fontWeight: 700 }}>02:15 / 05:00</span>
                      </div>
                    </div>
                  </div>

                  {/* Debug Panel Card */}
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0' }}>Debug Panel</h3>
                    <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '0.45rem', paddingBottom: 3, marginBottom: 8 }}>
                      <button style={{ border: 'none', background: 'none', borderBottom: '2px solid #6366f1', color: '#6366f1', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer', padding: '0.2rem' }}>Validation</button>
                      {['Missing Assets', 'Runtime Logs'].map(tab => (
                        <button key={tab} style={{ border: 'none', background: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.65rem', cursor: 'pointer', padding: '0.2rem' }}>{tab}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.72rem' }}>
                      {[
                        { title: 'JSON Validation', desc: 'Valid JSON structure', icon: '✓', color: '#16a34a', bg: '#dcfce7' },
                        { title: 'Screens', desc: 'All 6 screens loaded successfully', icon: '✓', color: '#16a34a', bg: '#dcfce7' },
                        { title: 'Media References', desc: 'No missing media found', icon: '✓', color: '#16a34a', bg: '#dcfce7' },
                        { title: 'Warnings (1)', desc: 'Audio file "dialogue_01.mp3" is large (2.8 MB)', icon: '⚠', color: '#ea580c', bg: '#ffedd5' },
                        { title: 'Info', desc: 'Preview using Runtime-Engine v2.1.0', icon: 'i', color: '#0369a1', bg: '#e0f2fe' }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
                          <span style={{ background: item.bg, color: item.color, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '8px', flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                          <div>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.title}</span>
                            <div style={{ color: '#64748b', marginTop: '1px' }}>{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Keyboard Shortcuts Card */}
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0' }}>Keyboard Shortcuts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.75rem' }}>
                      {[
                        { label: 'Previous Screen', key: '←' },
                        { label: 'Next Screen', key: '→' },
                        { label: 'Restart Experience', key: 'R' },
                        { label: 'Exit Preview', key: 'Esc' }
                      ].map(shortcut => (
                        <div key={shortcut.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>{shortcut.label}</span>
                          <span style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '1px 5px', fontSize: '0.68rem', fontWeight: 700 }}>{shortcut.key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ───────────────── VIEW 7: MEDIA LIBRARY (Image 2 of remaining) ───────────────── */}
          {view === 'media' && (
            <>
              {/* Layout grid for media library */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 300px', gap: '1.25rem', height: 'calc(100vh - 110px)', minHeight: 540 }}>
                
                {/* Column 1: Left folder list pane */}
                <div className="cs-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FOLDERS</span>
                    <button className="cs-icon-btn" style={{ fontSize: '0.9rem' }}><FiPlus/></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <button style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '0.5rem 0.65rem', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiFolder/> All Files</span>
                      <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>1,248</span>
                    </button>
                    <button style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', background: 'none', color: '#475569', border: 'none', padding: '0.5rem 0.65rem', borderRadius: 6, fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiBookOpen/> Favorites</span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>24</span>
                    </button>
                    <button style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', background: 'none', color: '#475569', border: 'none', padding: '0.5rem 0.65rem', borderRadius: 6, fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiClock/> Recently Uploaded</span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>68</span>
                    </button>
                  </div>

                  {/* Folders Tree hierarchy */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>- FOLDERS</span>
                    {[
                      { name: 'Images', count: 542, childs: ['Characters (128)', 'Backgrounds (156)', 'Objects (132)', 'UI Elements (126)'] },
                      { name: 'Audio', count: 318 },
                      { name: 'Videos', count: 216 }
                    ].map(fld => (
                      <div key={fld.name} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiFolder/> {fld.name}</span>
                          <span style={{ color: '#94a3b8' }}>{fld.count}</span>
                        </div>
                        {fld.childs && fld.childs.map(subf => (
                          <span key={subf} style={{ paddingLeft: '1.5rem', fontSize: '0.72rem', color: '#64748b', paddingBottom: '0.25rem' }}>
                            ↳ {subf}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Storage Usage meter */}
                  <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600 }}>
                      <span style={{ color: '#64748b' }}>Storage Used</span>
                      <span>25%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: '25%', height: '100%', background: '#6366f1' }}/>
                    </div>
                    <span style={{ color: '#94a3b8' }}>12.4 GB / 50 GB</span>
                  </div>
                </div>

                {/* Column 2: Center assets grid workspace */}
                <div className="cs-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
                  {/* Top toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Media Library</h2>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>Manage and reuse media assets across all experiences.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.55rem' }}>
                      <button className="cs-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiUpload/> Upload</button>
                      <button className="cs-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiFolderPlus/> Create Folder</button>
                      <button className="cs-btn-outline">⋮</button>
                    </div>
                  </div>

                  {/* Filtering / controls row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.55rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>TYPE</span>
                      <select className="cs-filter-select" style={{ height: 26, fontSize: '0.78rem', padding: '0 0.5rem' }} defaultValue="All Types">
                        <option>All Types</option>
                        <option>Images</option>
                        <option>Audio</option>
                        <option>Videos</option>
                      </select>
                      <span style={{ color: '#64748b', fontWeight: 600, marginLeft: '0.5rem' }}>SORT BY</span>
                      <select className="cs-filter-select" style={{ height: 26, fontSize: '0.78rem', padding: '0 0.5rem' }} defaultValue="Newest First">
                        <option>Newest First</option>
                        <option>Oldest First</option>
                      </select>
                      {/* View options layout switcher */}
                      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2, marginLeft: '0.5rem' }}>
                        <button style={{ border: 'none', background: '#fff', fontSize: '0.7rem', padding: '2px 5px', borderRadius: 4, cursor: 'pointer' }}>Grid</button>
                        <button style={{ border: 'none', background: 'none', fontSize: '0.7rem', padding: '2px 5px', borderRadius: 4, cursor: 'pointer', color: '#64748b' }}>List</button>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontWeight: 600 }}>
                      <input type="checkbox"/> Select All
                    </label>
                  </div>

                  {/* Grid layout of media files (1,248 Items) */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {[
                      { name: 'restaurant_scene_01.jpg', size: '2.4MB', date: 'May 20, 2025', type: 'Image', ext: 'JPG', active: true },
                      { name: 'activity_instructions.docx', size: '1.3MB', date: 'May 17, 2026', type: 'Document', ext: 'DOCX' },
                      { name: 'pronunciation_tip.mp3', size: '1.5MB', date: 'May 18, 2025', type: 'Audio', ext: 'MP3' },
                      { name: 'pronunciation_tip_02.mp3', size: '1.5MB', date: 'May 16, 2025', type: 'Audio', ext: 'MP3' },
                      { name: 'dialogue_example.mp4', size: '1.3MB', date: 'May 17, 2026', type: 'Video', ext: 'MP4' },
                      { name: 'speaking_prompt.wav', size: '1.3MB', date: 'May 17, 2026', type: 'Audio', ext: 'WAV' },
                      { name: 'ns.pdf', size: '1.3MB', date: 'May 17, 2026', type: 'Document', ext: 'PDF' },
                      { name: 'speech_bubble.png', size: '245KB', date: 'May 17, 2025', type: 'Image', ext: 'PNG' },
                      { name: 'restaurant_exterior.png', size: '2.7MB', date: 'May 16, 2025', type: 'Image', ext: 'PNG' },
                      { name: 'pronunciation_tip_03.mp3', size: '1.5MB', date: 'May 15, 2025', type: 'Audio', ext: 'MP3' },
                      { name: 'menu_example.jpg', size: '1.9MB', date: 'May 15, 2025', type: 'Image', ext: 'JPG' },
                      { name: 'people_group.png', size: '1.6MB', date: 'May 15, 2025', type: 'Image', ext: 'PNG' }
                    ].map(item => (
                      <div
                        key={item.name}
                        onClick={() => setSelectedAsset({
                          name: item.name,
                          type: `${item.type} (${item.ext})`,
                          size: item.size,
                          dimensions: item.type === 'Image' ? '1920 x 1080' : '—',
                          date: `${item.date} 10:15 AM`,
                          usage: '3 screens across 2 activities',
                          tags: ['restaurant', 'scene', 'dining']
                        })}
                        style={{
                          border: item.active || selectedAsset.name === item.name ? '2px solid #6366f1' : '1px solid #e2e8f0',
                          borderRadius: 8,
                          background: '#ffffff',
                          padding: '0.65rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Thumbnail placeholder */}
                        <div style={{ height: 80, background: '#f8fafc', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '0.5rem', border: '1px solid #f1f5f9' }}>
                          {item.type === 'Image' ? (
                            <div style={{ width: '100%', height: '100%', background: '#bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1', fontSize: '1rem', fontWeight: 'bold' }}>
                              🌅 Image
                            </div>
                          ) : item.type === 'Audio' ? (
                            <span style={{ fontSize: '1.5rem' }}>🎵</span>
                          ) : item.type === 'Video' ? (
                            <span style={{ fontSize: '1.5rem' }}>🎬</span>
                          ) : (
                            <span style={{ fontSize: '1.5rem' }}>📄</span>
                          )}
                        </div>

                        {/* Title details */}
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: '0.65rem', color: '#64748b' }}>
                            <span>{item.size} • {item.date}</span>
                            <span style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 4, fontWeight: 700, fontSize: '8px' }}>{item.ext}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grid Footer pagination */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Showing 1 to 24 of 1,248 items</span>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button className="cs-page-link">&lt;</button>
                      <button className="cs-page-link active">1</button>
                      <button className="cs-page-link">2</button>
                      <button className="cs-page-link">3</button>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', padding: '0 4px' }}>...</span>
                      <button className="cs-page-link">52</button>
                      <button className="cs-page-link">&gt;</button>
                      <select className="cs-filter-select" style={{ height: 26, fontSize: '0.75rem', padding: '0 0.5rem', marginLeft: '0.5rem' }}>
                        <option>24 per page</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Column 3: Right selected asset preview sidebar */}
                <div className="cs-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Preview</span>
                    <button className="cs-icon-btn"><FiX/></button>
                  </div>

                  {/* Large preview image */}
                  <div style={{ height: 140, background: '#bae6fd', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1', border: '1px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 4 }}>🌅</div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{selectedAsset.name}</span>
                    </div>
                  </div>

                  {/* Media Details */}
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>MEDIA INFORMATION</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                      {[
                        { label: 'Type', value: selectedAsset.type },
                        { label: 'Size', value: selectedAsset.size },
                        { label: 'Dimensions', value: selectedAsset.dimensions },
                        { label: 'Uploaded By', value: 'Aisha Khan' },
                        { label: 'Upload Date', value: selectedAsset.date },
                        { label: 'Used In', value: selectedAsset.usage }
                      ].map(inf => (
                        <div key={inf.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>{inf.label}</span>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{inf.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>TAGS</h4>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {selectedAsset.tags.map(tag => (
                        <span key={tag} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                          {tag}
                        </span>
                      ))}
                      <button style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>+ Add Tag</button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button className="cs-btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem 0' }}>🔄 Replace</button>
                      <button className="cs-btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem 0' }}>📥 Download</button>
                    </div>
                    <button className="cs-btn-outline" style={{ color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2', fontSize: '0.75rem', padding: '0.4rem 0', width: '100%' }}>
                      🗑 Delete
                    </button>
                  </div>

                  {/* Used in locations box */}
                  <div style={{ background: '#f0f9ff', padding: '0.75rem', borderRadius: 8, fontSize: '0.72rem', border: '1px solid #b3e0ff', marginTop: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FiInfo/> This media is used in:</div>
                    <ul style={{ paddingLeft: '1rem', margin: 0, color: '#0369a1', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <li>At the Restaurant &gt; Introduction &gt; Screen 1</li>
                      <li>At the Restaurant &gt; Dialogue &gt; Screen 2</li>
                      <li>At the Restaurant &gt; Quiz &gt; Screen 4</li>
                    </ul>
                    <a href="#usage" style={{ color: '#0284c7', fontWeight: 600, display: 'block', marginTop: 6, textDecoration: 'none' }}>View all usage →</a>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ───────────────── VIEW 8: PUBLISH CENTER (Image 3 of remaining) ───────────────── */}
          {view === 'publish' && (
            <>
              {/* Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Experience Builder &nbsp;&gt;&nbsp; At the Restaurant (Grade 4) &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Publish Center</span>
                  </div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
                    Publish Center <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '10px', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>✓ Validation Passed</span>
                  </h1>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Package and publish validated experiences for distribution to schools.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.55rem' }}>
                  <button className="cs-btn-outline" onClick={() => alert('Refreshing publish center...')}>Refresh</button>
                  <button className="cs-btn-primary" style={{ background: '#4f46e5' }} onClick={() => alert('Compiling new package...')}>Generate Package</button>
                </div>
              </div>

              {/* Top Layout: 3 Columns widgets */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {/* Widget 1: Experience summary card */}
                <div className="cs-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 110, height: 80, background: '#bae6fd', borderRadius: 8, flexShrink: 0, border: '1px solid #e2e8f0' }}/>
                  <div>
                    <span className="cs-badge cs-badge-published" style={{ fontSize: '8px' }}>EXPERIENCE</span>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>At the Restaurant (Grade 4)</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                      Learners will practice ordering food and interacting politely with a waiter.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: 8, fontSize: '0.72rem', fontWeight: 600 }}>
                      <span>Target Grade: <span style={{ color: '#0284c7' }}>Grade 4</span></span>
                      <span>Language: <span style={{ color: '#0284c7' }}>English</span></span>
                    </div>
                  </div>
                </div>

                {/* Widget 2: Stats counters card */}
                <div className="cs-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', alignContent: 'center' }}>
                  {[
                    { label: 'Activities', count: '5', bg: '#f1f5f9' },
                    { label: 'Screens', count: '32', bg: '#f1f5f9' },
                    { label: 'Media Assets', count: '48', bg: '#f1f5f9' }
                  ].map(stat => (
                    <div key={stat.label} style={{ background: stat.bg, padding: '0.5rem', borderRadius: 8 }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{stat.count}</div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                  <div style={{ gridColumn: 'span 3', borderTop: '1px solid #f1f5f9', marginTop: 6, paddingTop: 6, fontSize: '0.7rem', color: '#64748b' }}>
                    Last Updated: <span style={{ fontWeight: 600, color: '#334155' }}>May 20, 2025 10:42 AM</span>
                  </div>
                </div>

                {/* Widget 3: Package Preview card */}
                <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.7rem' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>Package Preview</span>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', flex: 1, fontFamily: 'monospace', overflowY: 'auto' }}>
                    <div style={{ color: '#0369a1', fontWeight: 'bold' }}>📁 At_the_Restaurant_Grade4_v1.0.0.elab</div>
                    <div style={{ paddingLeft: '0.75rem' }}>📁 content / experience.json</div>
                    <div style={{ paddingLeft: '0.75rem' }}>📁 media / images (24), audio (15)</div>
                    <div style={{ paddingLeft: '0.75rem' }}>📁 resources / fonts (5)</div>
                  </div>
                  <span style={{ color: '#64748b' }}>Total Size: <span style={{ fontWeight: 600, color: '#334155' }}>85.6 MB</span></span>
                </div>
              </div>

              {/* Bottom Layout: 3 Columns Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                {/* Column 1: Version & Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0' }}>Version Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Current Version</span>
                        <span style={{ fontWeight: 700, color: '#0284c7' }}>v1.0.0</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Build Number</span>
                        <span style={{ fontWeight: 700 }}>1001</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>RELEASE NOTES</span>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem', borderRadius: 6, color: '#475569', fontSize: '0.72rem' }}>
                          Initial release of the experience with all activities and assessments.
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', fontSize: '0.72rem' }}>
                        <span style={{ color: '#64748b' }}>Published By</span>
                        <span style={{ fontWeight: 600 }}>Aisha Khan (May 20, 2025 10:15 AM)</span>
                      </div>
                    </div>
                  </div>

                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0' }}>Package Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.75rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label" style={{ fontSize: '0.7rem' }}>Package Name</label>
                        <input className="cs-form-input" style={{ height: 26, fontSize: '0.75rem' }} type="text" defaultValue="At_the_Restaurant_Grade4_v1.0.0.elab"/>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Output Format</span>
                        <span style={{ fontWeight: 600 }}>.elab (EnglishLab Package)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Compression</span>
                        <span style={{ fontWeight: 600 }}>ZIP (Recommended)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Package Size (Estimated)</span>
                        <span style={{ fontWeight: 700 }}>85.6 MB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Include Analytics Configuration</span>
                        <input type="checkbox" defaultChecked/>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Progress steps */}
                <div className="cs-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0' }}>Publish Progress</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', paddingLeft: '1rem', flex: 1, marginTop: '0.5rem' }}>
                    {/* Line */}
                    <div style={{ position: 'absolute', left: 23, top: 10, bottom: 10, width: 2, background: '#16a34a' }}/>
                    
                    {[
                      { num: 1, label: 'Validating Experience', desc: 'Validation passed successfully' },
                      { num: 2, label: 'Packaging Content', desc: 'experience.json generated' },
                      { num: 3, label: 'Packaging Media', desc: '48 media files packaged' },
                      { num: 4, label: 'Generating Manifest', desc: 'manifest.json generated' }
                    ].map(step => (
                      <div key={step.num} style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 2 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.72rem' }}>✓</div>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>{step.label}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 1 }}>{step.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.5rem', borderRadius: 6, fontWeight: 700, fontSize: '0.72rem', textAlign: 'center', marginTop: '1rem' }}>
                    ✓ PACKAGE GENERATED SUCCESSFULLY
                  </div>
                </div>

                {/* Column 3: Rules & Help */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0' }}>Publishing Rules</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.72rem', color: '#475569' }}>
                      {[
                        'Experience validated',
                        'All required fields completed',
                        'No blocking errors',
                        'Media files available',
                        'Manifest generation successful'
                      ].map(rule => (
                        <div key={rule} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                    <div style={{ display: 'flex', gap: 6, color: '#7c3aed', fontWeight: 700, fontSize: '0.8rem' }}><FiQuestion/> Need Help?</div>
                    <p style={{ fontSize: '0.72rem', color: '#5b21b6', margin: 0 }}>
                      Learn how publishing works and how to distribute packages.
                    </p>
                    <a href="#help" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7c3aed', textDecoration: 'none' }}>View Publishing Guide →</a>
                  </div>
                </div>
              </div>

              {/* Published Packages Table */}
              <div className="cs-card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Published Packages</h3>
                <div className="cs-table-wrap">
                  <table className="cs-table">
                    <thead>
                      <tr>
                        <th>BUILD #</th>
                        <th>PACKAGE NAME</th>
                        <th>SIZE</th>
                        <th>PUBLISHED ON</th>
                        <th>PUBLISHED BY</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { b: '1001', name: 'At_the_Restaurant_Grade4_v1.0.0.elab', size: '85.6 MB', date: 'May 20, 2025 10:42 AM', user: 'Aisha Khan', status: 'Latest', color: 'cs-badge-published' },
                        { b: '1000', name: 'At_the_Restaurant_Grade4_v0.9.0.elab', size: '82.1 MB', date: 'May 18, 2025 03:20 PM', user: 'Aisha Khan', status: 'Archived', color: 'cs-badge-draft' },
                        { b: '999',  name: 'At_the_Restaurant_Grade4_v0.8.0.elab', size: '78.3 MB', date: 'May 16, 2025 11:05 AM', user: 'Aisha Khan', status: 'Archived', color: 'cs-badge-draft' }
                      ].map(pkg => (
                        <tr key={pkg.b}>
                          <td style={{ fontWeight: 700 }}>{pkg.b}</td>
                          <td style={{ color: '#0284c7', fontWeight: 600 }}>{pkg.name}</td>
                          <td>{pkg.size}</td>
                          <td>{pkg.date}</td>
                          <td>{pkg.user}</td>
                          <td><span className={`cs-badge ${pkg.color}`}>{pkg.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Sticky action footer bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', background: '#fff', padding: '0.75rem 1.25rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <button className="cs-btn-outline" style={{ fontSize: '0.78rem' }} onClick={() => setView('experience-builder')}>
                  ← Back to Experience Builder
                </button>
                <button className="cs-btn-primary" style={{ background: '#4f46e5', padding: '0.5rem 1.5rem' }} onClick={() => alert('Downloading Package...')}>
                  Download Latest Package
                </button>
              </div>
            </>
          )}

          {/* ── View 9: Profile Settings ── */}
          {view === 'profile' && (
            <div className="sd-card" style={{ maxWidth: 800, margin: '0 auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                Profile Settings
              </h2>
              
              {feedbackMsg.text && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 6,
                  marginBottom: '1.5rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: feedbackMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  color: feedbackMsg.type === 'error' ? '#ef4444' : '#15803d',
                  border: feedbackMsg.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0'
                }}>
                  {feedbackMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiUser/> Personal Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Username</label>
                    <input className="sd-form-input" type="text" value={profileForm.username} disabled style={{ background: '#f1f5f9', cursor: 'not-allowed' }}/>
                  </div>
                </div>
                <button type="submit" className="cs-btn-primary" disabled={actionLoading} style={{ background: '#4f46e5', padding: '0.5rem 1.5rem', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>

              <form onSubmit={handlePasswordUpdate} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiSettings/> Change Password
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Current Password</label>
                    <input className="sd-form-input" type="password" value={passwordForm.current_password}
                      onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      placeholder="Enter current password" required/>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">New Password</label>
                    <input className="sd-form-input" type="password" value={passwordForm.password}
                      onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                      placeholder="Minimum 6 characters" required minLength={6}/>
                  </div>
                </div>
                <button type="submit" className="cs-btn-primary" disabled={actionLoading} style={{ background: '#4f46e5', padding: '0.5rem 1.5rem', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  {actionLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ContentStudio;
