import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { API_BASE_URL } from './config';
import {
  FiGrid, FiBookOpen, FiActivity, FiMonitor, FiFileText,
  FiCheckCircle, FiDownload, FiSettings, FiHelpCircle, FiLogOut,
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiChevronUp, FiCalendar, FiBell, FiFilter, FiEye, FiEyeOff,
  FiAlertTriangle, FiFolder, FiImage, FiSend, FiPlusCircle,
  FiArrowLeft, FiSmartphone, FiTablet, FiInfo, FiUpload,
  FiPlay, FiCheck, FiFolderPlus, FiShare2, FiHelpCircle as FiQuestion,
  FiUser, FiClock, FiMoreVertical, FiVolume2, FiMic, FiCopy, FiColumns,
  FiMove, FiEdit, FiGitCommit, FiList, FiLayers, FiType, FiLock, FiRefreshCw
} from 'react-icons/fi';
import './Dashboard.css';
import contentCreatorHeaderBanner from './assets/3.jpeg';
import logoIcon from './assets/icon.png';
import ReportsAnalytics from './ReportsAnalytics';

const incrementVersion = (versionStr) => {
  if (!versionStr) return "1.0.0";
  const parts = versionStr.split('.').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    parts[2] += 1;
    return parts.join('.');
  }
  return versionStr + ".1";
};

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = url.startsWith('/') ? url : '/' + url;
  return `${base}${path}`;
};

/* ═══════════════════════════════════════════════════════════
   CONTENT STUDIO COMPONENT
   ═══════════════════════════════════════════════════════════ */
function ContentStudio({ user, onLogout, currentPath, setCurrentPath, onUpdateUser }) {
  // Views: dashboard, experiences, experience-builder, activity-builder, screen-builder, preview, media, publish, profile
  const [view, setView] = useState('dashboard');
  const [isNewExperience, setIsNewExperience] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);

  // Backend Integration States
  const [experiences, setExperiences] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  const [activities, setActivities] = useState([]);
  const [screens, setScreens] = useState([]);
  const [isEditingScreen, setIsEditingScreen] = useState(false);
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [outcomesText, setOutcomesText] = useState('');
  const [gradesList, setGradesList] = useState([]);
  const [recentExperiences, setRecentExperiences] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [publishStatus, setPublishStatus] = useState(null);
  const [publishHistory, setPublishHistory] = useState([]);
  const [validationReport, setValidationReport] = useState(null);

  // Experience Assignment state
  const [assignSchools, setAssignSchools] = useState([]);
  const [assignGrades, setAssignGrades] = useState([]);
  const [assignHistory, setAssignHistory] = useState([]);
  const [targetSchoolId, setTargetSchoolId] = useState('');
  const [targetGradeId, setTargetGradeId] = useState('');

  // Filter states for Experience Library
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Previewer session payload track
  const [previewPayload, setPreviewPayload] = useState(null);
  const [previewActivityIndex, setPreviewActivityIndex] = useState(0);
  const [previewScreenIndex, setPreviewScreenIndex] = useState(0);
  const [previewAnswerIndex, setPreviewAnswerIndex] = useState(null);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [voiceRecordingStates, setVoiceRecordingStates] = useState({});

  const loadExperiencesData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterGrade) params.append('grade', filterGrade);
      if (filterSubject) params.append('subject', filterSubject);
      if (filterDifficulty) params.append('difficulty', filterDifficulty.toUpperCase());
      if (filterStatus) params.append('status', filterStatus.toUpperCase());
      if (filterTag) params.append('tags', filterTag);

      const url = `/api/v1/content/experiences/?${params.toString()}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setExperiences(data.results || data);
      }
    } catch (e) {
      console.error('Failed to load experiences in Content Studio', e);
    }
  };

  const loadMediaData = async () => {
    try {
      const res = await apiFetch('/api/v1/content/media/');
      if (res.ok) {
        const data = await res.json();
        setMediaAssets(data.results || data);
      }
    } catch (e) {
      console.error('Failed to load media in Content Studio', e);
    }
  };

  const loadSummaryData = async () => {
    try {
      const res = await apiFetch('/api/v1/dashboard/summary');
      if (res.ok) {
        setDashboardSummary(await res.json());
      }
    } catch (e) {
      console.error('Failed to load dashboard summary', e);
    }
  };

  const loadRecentExperiences = async () => {
    try {
      const res = await apiFetch('/api/v1/dashboard/recent-experiences');
      if (res.ok) {
        setRecentExperiences(await res.json());
      }
    } catch (e) {
      console.error('Failed to load recent experiences', e);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const res = await apiFetch('/api/v1/dashboard/recent-activity');
      if (res.ok) {
        setRecentActivities(await res.json());
      }
    } catch (e) {
      console.error('Failed to load recent activity', e);
    }
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

  const loadGrades = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/grades/');
      if (res.ok) {
        const data = await res.json();
        const rawList = data.results || data;
        const filtered = (Array.isArray(rawList) ? rawList : []).filter(g => {
          const match = g.grade_name.match(/^Grade\s+(\d+)$/i);
          if (match) {
            const num = parseInt(match[1]);
            return num >= 3 && num <= 8;
          }
          return false;
        }).sort((a, b) => {
          const numA = parseInt(a.grade_name.match(/\d+/)[0]);
          const numB = parseInt(b.grade_name.match(/\d+/)[0]);
          return numA - numB;
        });
        setGradesList(filtered);
      }
    } catch (e) {
      console.error('Failed to load grades', e);
    }
  };

  useEffect(() => {
    loadExperiencesData();
    loadMediaData();
    loadSummaryData();
    loadRecentExperiences();
    loadRecentActivity();
    loadNotifications();
    loadGrades();
  }, []);

  /* ── Clock ticker ── */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ── Sync profileForm state with user prop updates ── */
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || 'content_creator',
        email: user.email || '',
        full_name: user.full_name || '',
        phone_no: user.phone_no || ''
      });
      setCurrentUserState(user);
    }
  }, [user]);

  /* ── Dismiss notification dropdown on outside click ── */
  useEffect(() => {
    const handler = () => setShowNotifDropdown(false);
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

  useEffect(() => {
    loadExperiencesData();
  }, [filterGrade, filterSubject, filterDifficulty, filterStatus, filterTag]);

  useEffect(() => {
    if (currentPath && currentPath.startsWith('/content-studio/editor/')) {
      const parts = currentPath.split('/');
      const screenId = parts[parts.length - 1];
      if (screenId && (!selectedScreen || selectedScreen.id !== parseInt(screenId))) {
        const fetchScreenData = async () => {
          try {
            const res = await apiFetch(`/api/v1/content/screens/${screenId}/`);
            if (res.ok) {
              const sc = await res.json();
              setSelectedScreen(sc);
              
              const content = sc.content || {};
              let activeElements = [];
              if (content.elements && Array.isArray(content.elements)) {
                activeElements = JSON.parse(JSON.stringify(content.elements)).map(el => ({
                  ...el,
                  slot: el.slot || (['image', 'video', 'audio'].includes(el.type) ? 'right' : 'left')
                }));
              }
              setScreenForm({
                id: sc.id,
                title: sc.title,
                screen_type: sc.screen_type,
                layout: content.layout || '1-column',
                columnRatio: content.columnRatio || '50-50',
                content: content.text || content.content || '',
                tag: content.tag || 'H1',
                font: content.font || 'Poppins',
                weight: content.weight || 'Bold',
                size: content.size || 48,
                color: content.color || '#1F2937',
                alignment: content.alignment || 'Center',
                steps: content.steps || [],
                media_url: content.media_url || '',
                media_id: content.media_id || '',
                media_type: content.media_type || '',
                quiz_question: content.quiz_question || '',
                quiz_options: content.quiz_options || ['', '', '', ''],
                quiz_correct_index: content.quiz_correct_index !== undefined ? content.quiz_correct_index : 0,
                elements: activeElements
              });

              if (activeElements.length > 0) {
                setSelectedBlockId(activeElements[0].id);
              } else {
                setSelectedBlockId(null);
              }

              setView('screen-builder');
              setIsEditingScreen(true);

              if (sc.activity && (!selectedActivity || selectedActivity.id !== sc.activity)) {
                const actRes = await apiFetch(`/api/v1/content/activities/${sc.activity}/`);
                if (actRes.ok) {
                  const actData = await actRes.json();
                  setSelectedActivity(actData);
                  
                  if (actData.experience && (!selectedExperience || selectedExperience.id !== actData.experience)) {
                    const expRes = await apiFetch(`/api/v1/content/experiences/${actData.experience}/`);
                    if (expRes.ok) {
                      const expData = await expRes.json();
                      setSelectedExperience(expData);
                    }
                  }
                }
              }
            } else {
              showFeedback('Failed to fetch screen details or invalid screen ID', 'error');
            }
          } catch (err) {
            console.error('Error fetching screen details on route load', err);
          }
        };
        fetchScreenData();
      }
    } else if (currentPath === '/content-studio' && view === 'screen-builder' && isEditingScreen) {
      // If user navigated away via URL to content studio root, clear screen editing state
      setIsEditingScreen(false);
      setView('dashboard');
    }
  }, [currentPath]);

  // ── Full Screen Studio States ──
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elementsHistory, setElementsHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

  const pushHistory = (elements) => {
    setElementsHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(elements)));
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setScreenForm(prev => ({ ...prev, elements: JSON.parse(JSON.stringify(elementsHistory[newIndex])) }));
  };

  const handleRedo = () => {
    if (historyIndex >= elementsHistory.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setScreenForm(prev => ({ ...prev, elements: JSON.parse(JSON.stringify(elementsHistory[newIndex])) }));
  };

  // Tab keyboard shortcut for panel collapse in Full Screen Studio
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isEditingScreen || !view === 'screen-builder') return;
      if (e.key === 'Tab' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'SELECT') {
        e.preventDefault();
        setLeftPanelCollapsed(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingScreen, view, historyIndex, elementsHistory]);



  // Profile / Password states
  const [profileForm, setProfileForm] = useState({
    username: user?.username || 'content_creator',
    email: user?.email || '',
    full_name: user?.full_name || '',
    phone_no: user?.phone_no || ''
  });
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwModalError, setPwModalError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  const showFeedback = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 3000);
  };

  const extractErrorMessage = (errData, defaultMsg = 'An error occurred') => {
    if (!errData) return defaultMsg;
    if (typeof errData === 'string') return errData;
    if (errData.error) return String(errData.error);
    if (errData.detail) return String(errData.detail);
    if (typeof errData === 'object') {
      const parts = Object.entries(errData).map(([key, val]) => {
        const field = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
        const message = Array.isArray(val) ? val.join(', ') : String(val);
        return `${field}: ${message}`;
      });
      if (parts.length > 0) {
        return parts.join(' | ');
      }
    }
    return defaultMsg;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
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
        showFeedback(msg, 'error');
        return;
      }
      const updatedUser = resData.user || { ...user, full_name: profileForm.full_name, email: profileForm.email, phone_no: profileForm.phone_no };
      if (onUpdateUser) onUpdateUser(updatedUser);
      setCurrentUserState(updatedUser);
      showFeedback('Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err);
      showFeedback('Failed to update profile.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setAvatarUploading(true);
    try {
      const res = await apiFetch('/api/users/profile/avatar/', {
        method: 'POST',
        body: formData
      });
      let resData = {};
      try { resData = await res.json(); } catch { resData = {}; }
      if (res.ok) {
        const updatedUser = { ...currentUserState, profile_picture: resData.profile_picture };
        setCurrentUserState(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);
        showFeedback('Profile picture updated successfully!');
      } else {
        showFeedback(resData.error || 'Failed to upload profile picture.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Upload error: ' + err.message, 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/users/change-password/', {
        method: 'POST',
        body: JSON.stringify({ old_password: pwForm.current_password, new_password: pwForm.new_password })
      });
      if (res.ok) {
        showFeedback('Password changed successfully!');
        setPwForm({ current_password: '', new_password: '', confirm_password: '' });
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
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Local Form states
  const [experienceForm, setExperienceForm] = useState({
    title: '',
    description: '',
    grade: '',
    subject: [],
    language: 'English',
    difficulty: 'Medium',
    duration: 15,
    tags: []
  });

  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    objective: '',
    skills: [],
    duration: 5,
    mastery: 80
  });

  const [screenForm, setScreenForm] = useState({
    title: '',
    screen_type: 'INFORMATION',
    layout: '1-column',
    columnRatio: '50-50',
    content: '',
    tag: 'H1',
    font: 'Poppins',
    weight: 'Bold',
    size: 48,
    color: '#1F2937',
    alignment: 'Center',
    steps: [],
    media_url: '',
    media_id: '',
    media_type: '',
    quiz_question: '',
    quiz_options: ['', '', '', ''],
    quiz_correct_index: 0,
    elements: []
  });

  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [propertiesTab, setPropertiesTab] = useState('content'); // 'content' | 'style' | 'advanced'

  const [previewScreenNum, setPreviewScreenNum] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState('B');
  const [flippedCards, setFlippedCards] = useState({});
  const [blankAnswers, setBlankAnswers] = useState({});
  const [dragDropSelections, setDragDropSelections] = useState({});
  const [currentTime, setCurrentTime]             = useState(new Date());
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showHelpModal,     setShowHelpModal]     = useState(false);
  const [currentUserState,  setCurrentUserState]  = useState(user);
  const [avatarUploading,   setAvatarUploading]   = useState(false);

  const triggerAutoSave = () => {
    setAutoSaveStatus('unsaved');
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving');
      setTimeout(() => setAutoSaveStatus('saved'), 600);
    }, 1800);
    setAutoSaveTimer(timer);
  };



  const loadExperienceDetail = async (expObjOrId, changeViewToBuilder = false) => {
    const expId = typeof expObjOrId === 'object' ? expObjOrId.id : expObjOrId;
    try {
      const res = await apiFetch(`/api/v1/content/experiences/${expId}/`);
      if (res.ok) {
        const data = await res.json();
        // Parse subject from backend (may be string or array) into array
        const rawSubject = data.subject || '';
        let subjectArray = [];
        if (Array.isArray(rawSubject)) {
          subjectArray = rawSubject;
        } else if (typeof rawSubject === 'string' && rawSubject) {
          subjectArray = rawSubject.split(/,\s*|\s*&\s*/).map(s => s.trim()).filter(Boolean);
        }
        setSelectedExperience(data);
        setExperienceForm({
          id: data.id,
          title: data.title,
          description: data.description || '',
          grade: data.grade || '',
          subject: subjectArray,
          language: data.language || 'English',
          difficulty: data.difficulty || 'Medium',
          duration: data.estimated_duration || 0,
          tags: data.tags || [],
          thumbnail: data.thumbnail || ''
        });
        setActivities(data.activities || []);
        const rawOutcomes = data.learning_outcomes || [];
        setLearningOutcomes(rawOutcomes);
        // Convert to plain text — support {text}, {description}, {outcome}, raw strings
        const textStr = rawOutcomes.map(o => {
          if (typeof o === 'string') return o;
          return o.text || o.description || o.outcome || o.name || '';
        }).filter(Boolean).join('\n');
        setOutcomesText(textStr);
        setIsNewExperience(false);
        if (changeViewToBuilder) {
          setView('experience-builder');
        }
      } else {
        showFeedback('Failed to load experience details', 'error');
      }
    } catch (e) {
      console.error(e);
      showFeedback('Error loading experience details', 'error');
    }
  };

  const handleSaveExperience = async () => {
    setActionLoading(true);
    try {
      let diff = (experienceForm.difficulty || 'Medium').toUpperCase();
      if (diff !== 'EASY' && diff !== 'MEDIUM' && diff !== 'HARD') {
        diff = 'MEDIUM';
      }

      const payload = {
        title: experienceForm.title,
        description: experienceForm.description || '',
        grade: parseInt(experienceForm.grade) || null,
        subject: Array.isArray(experienceForm.subject) ? experienceForm.subject.join(', ') : (experienceForm.subject || ''),
        language: experienceForm.language || 'English',
        difficulty: diff,
        estimated_duration: parseInt(experienceForm.duration) || 15,
        tags: experienceForm.tags || [],
        thumbnail: experienceForm.thumbnail || ''
      };

      let res;
      if (selectedExperience && selectedExperience.id) {
        res = await apiFetch(`/api/v1/content/experiences/${selectedExperience.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/v1/content/experiences/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const data = await res.json();

        // Sync learning outcomes textarea with backend (replace existing set with current lines)
        const desiredLines = (outcomesText || '').split('\n').map(l => l.trim()).filter(Boolean);
        const existingOutcomes = data.learning_outcomes || [];
        try {
          await Promise.all(existingOutcomes.map(o => apiFetch(`/api/v1/content/learning-outcomes/${o.id}/`, { method: 'DELETE' })));
          await Promise.all(desiredLines.map(text => apiFetch('/api/v1/content/learning-outcomes/', {
            method: 'POST',
            body: JSON.stringify({ experience: data.id, text })
          })));
        } catch (outcomeErr) {
          console.error('Failed to sync learning outcomes', outcomeErr);
        }

        await loadExperienceDetail(data.id);
        showFeedback('Experience saved successfully');
        loadExperiencesData();
        loadRecentExperiences();
      } else {
        const errData = await res.json().catch(() => ({}));
        showFeedback(extractErrorMessage(errData, 'Failed to save experience'), 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Network error occurred while saving experience', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: '', title: '', message: '', isConflict: false, usages: [] });
  const [customAlert, setCustomAlert] = useState({ show: false, title: 'Attention', message: '', type: 'warning' });
  const [customPrompt, setCustomPrompt] = useState({ show: false, title: 'Input Required', message: '', value: '', placeholder: '', onConfirm: null });
  const triggerPrompt = (message, title = 'Input Required', defaultValue = '', placeholder = '', onConfirm = null) => {
    setCustomPrompt({ show: true, title, message, value: defaultValue, placeholder, onConfirm });
  };
  const triggerAlert = (message, title = 'Attention', type = 'warning') => {
    setCustomAlert({ show: true, title, message, type });
  };
  const [publishVersion, setPublishVersion] = useState('');
  const [publishNotes, setPublishNotes] = useState('Initial release of the experience.');

  useEffect(() => {
    if (view === 'publish' && selectedExperience?.id) {
      loadPublishData(selectedExperience.id);
    }
  }, [view, selectedExperience?.id]);

  const executeDeleteAction = async () => {
    const { id, type, isConflict } = deleteConfirm;
    if (!id) return;
    setActionLoading(true);
    try {
      let url = '';
      let options = { method: 'DELETE' };

      if (type === 'experience') {
        url = `/api/v1/content/experiences/${id}/`;
      } else if (type === 'activity') {
        url = `/api/v1/content/activities/${id}/`;
      } else if (type === 'screen') {
        url = `/api/v1/content/screens/${id}/`;
      } else if (type === 'outcome') {
        url = `/api/v1/content/learning-outcomes/${id}/`;
      } else if (type === 'media') {
        url = `/api/v1/content/media/${id}/` + (isConflict ? '?force=true' : '');
      }

      const res = await apiFetch(url, options);
      if (res.ok) {
        showFeedback(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
        setDeleteConfirm({ show: false, id: null, type: '', title: '', message: '', isConflict: false, usages: [] });

        // Refresh based on type
        if (type === 'experience') {
          loadExperiencesData();
          loadRecentExperiences();
          if (selectedExperience?.id === id) setSelectedExperience(null);
        } else if (type === 'activity') {
          loadExperienceDetail(selectedExperience.id);
          if (selectedActivity?.id === id) setSelectedActivity(null);
        } else if (type === 'screen') {
          loadActivityDetail(selectedActivity.id, false);
          if (selectedScreen?.id === id) setSelectedScreen(null);
        } else if (type === 'outcome') {
          loadExperienceDetail(selectedExperience.id);
        } else if (type === 'media') {
          loadMediaData();
          if (selectedAsset?.id === id) setSelectedAsset(null);
        }
      } else if (res.status === 409 && type === 'media') {
        const errData = await res.json().catch(() => ({}));
        setDeleteConfirm({
          ...deleteConfirm,
          isConflict: true,
          title: 'Asset Currently In Use',
          message: errData.error || 'This media asset is currently in use by one or more screens. Deleting it may cause layout issues.',
          usages: errData.usages || []
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        showFeedback(extractErrorMessage(errData, `Failed to delete ${type}`), 'error');
        setDeleteConfirm({ show: false, id: null, type: '', title: '', message: '', isConflict: false, usages: [] });
      }
    } catch (err) {
      console.error(err);
      showFeedback('Network error occurred during deletion', 'error');
      setDeleteConfirm({ show: false, id: null, type: '', title: '', message: '', isConflict: false, usages: [] });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExperience = (id) => {
    const exp = experiences.find(e => e.id === id);
    setDeleteConfirm({
      show: true,
      id,
      type: 'experience',
      title: 'Delete Experience',
      message: `Are you sure you want to delete the experience "${exp?.title || ''}"? This action cannot be undone.`
    });
  };

  const loadActivityDetail = async (actObjOrId, shouldChangeView = true) => {
    const actId = typeof actObjOrId === 'object' ? actObjOrId.id : actObjOrId;
    try {
      const res = await apiFetch(`/api/v1/content/activities/${actId}/`);
      if (res.ok) {
        const data = await res.json();
        setSelectedActivity(data);
        setActivityForm({
          id: data.id,
          title: data.title,
          description: data.description || '',
          objective: data.learning_objective || '',
          skills: data.skills ? data.skills.map(s => s.name) : [],
          duration: data.estimated_duration || 5,
          mastery: data.mastery_threshold || 80
        });
        setScreens(data.screens || []);
        if (shouldChangeView) {
          setView('activity-builder');
        }
      } else {
        showFeedback('Failed to load activity details', 'error');
      }
    } catch (e) {
      console.error(e);
      showFeedback('Error loading activity details', 'error');
    }
  };

  const handleSaveActivity = async () => {
    if (!selectedExperience || !selectedExperience.id) {
      triggerAlert("Please save the experience first before adding activities.", "Save Experience Required", "warning");
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        experience: selectedExperience.id,
        title: activityForm.title,
        description: activityForm.description || '',
        learning_objective: activityForm.objective || '',
        estimated_duration: parseInt(activityForm.duration) || 5,
        mastery_threshold: parseInt(activityForm.mastery) || 80
      };

      let res;
      if (selectedActivity && selectedActivity.id) {
        res = await apiFetch(`/api/v1/content/activities/${selectedActivity.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/v1/content/activities/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const data = await res.json();
        setSelectedActivity(data);
        showFeedback('Activity saved successfully');
        loadExperienceDetail(selectedExperience.id);
        const activityScreens = data.screens || [];
        setScreens(activityScreens);
        
        if (activityScreens.length > 0) {
          loadScreenDetail(activityScreens[0]);
        } else {
          setView('screen-builder');
          setIsEditingScreen(false);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showFeedback(extractErrorMessage(errData, 'Failed to save activity'), 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Network error occurred while saving activity', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteActivity = (id) => {
    const act = activities.find(a => a.id === id);
    setDeleteConfirm({
      show: true,
      id,
      type: 'activity',
      title: 'Delete Activity',
      message: `Are you sure you want to delete the activity "${act?.title || ''}"? This action cannot be undone.`
    });
  };

  const handleMoveActivity = async (index, direction) => {
    if (!activities || activities.length < 2) return;
    const newActivities = [...activities];
    const temp = newActivities[index];
    newActivities[index] = newActivities[index + direction];
    newActivities[index + direction] = temp;

    try {
      const res = await apiFetch('/api/v1/content/activities/reorder/', {
        method: 'PATCH',
        body: JSON.stringify({ ids: newActivities.map(a => a.id) })
      });
      if (res.ok) {
        showFeedback('Activities reordered');
        setActivities(newActivities);
      } else {
        const errData = await res.json().catch(() => ({}));
        showFeedback(extractErrorMessage(errData, 'Failed to reorder activities'), 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadScreenDetail = (sc) => {
    setSelectedScreen(sc);
    const content = sc.content || {};

    // Compile modular blocks list with backward compatibility
    let activeElements = [];
    if (content.elements && Array.isArray(content.elements)) {
      activeElements = JSON.parse(JSON.stringify(content.elements)).map(el => ({
        ...el,
        slot: el.slot || (['image', 'video', 'audio'].includes(el.type) ? 'right' : 'left')
      }));
    }

    if (activeElements.length === 0) {
      if (sc.screen_type === 'INFORMATION') {
        activeElements.push({
          id: 'block-' + Date.now() + '-1',
          type: 'dialogue',
          slot: 'left',
          content: {
            steps: content.steps || [
              { step: 1, name: 'Ben', text: 'Hi! What would you like to order?', avatarColor: '#0ea5e9', side: 'left' },
              { step: 2, name: 'Anna', text: "I'd like a cup of coffee, please.", avatarColor: '#ea580c', side: 'right' }
            ]
          }
        });
      } else if (sc.screen_type === 'IMAGE') {
        activeElements.push({
          id: 'block-' + Date.now() + '-2',
          type: 'image',
          slot: 'right',
          content: {
            url: content.media_url || '',
            media_id: content.media_id || '',
            caption: content.text || ''
          }
        });
      } else if (sc.screen_type === 'VIDEO') {
        activeElements.push({
          id: 'block-' + Date.now() + '-3',
          type: 'video',
          slot: 'right',
          content: {
            url: content.media_url || '',
            media_id: content.media_id || ''
          }
        });
      } else if (sc.screen_type === 'SPEAKING') {
        activeElements.push({
          id: 'block-' + Date.now() + '-4',
          type: 'audio',
          slot: 'right',
          content: {
            title: content.title || 'Listening Clip',
            url: content.media_url || '',
            media_id: content.media_id || ''
          }
        });
      } else if (sc.screen_type === 'QUIZ') {
        activeElements.push({
          id: 'block-' + Date.now() + '-5',
          type: 'quiz',
          slot: 'left',
          content: {
            question: content.quiz_question || 'Question label?',
            options: content.quiz_options || ['', '', '', ''],
            correctAnswerIndex: content.quiz_correct_index !== undefined ? content.quiz_correct_index : 0
          }
        });
      } else if (sc.screen_type === 'WRITING') {
        activeElements.push({
          id: 'block-' + Date.now() + '-6',
          type: 'text',
          slot: 'left',
          content: {
            text: content.text || ''
          },
          styles: {
            fontFamily: content.font || 'Poppins',
            fontSize: (content.size || 18) + 'px',
            color: content.color || '#334155',
            alignment: content.alignment || 'Left',
            fontWeight: content.weight || 'Regular'
          }
        });
      }
    }

    setScreenForm({
      id: sc.id,
      title: sc.title,
      screen_type: sc.screen_type,
      layout: content.layout || '1-column',
      columnRatio: content.columnRatio || '50-50',
      content: content.text || content.content || '',
      tag: content.tag || 'H1',
      font: content.font || 'Poppins',
      weight: content.weight || 'Bold',
      size: content.size || 48,
      color: content.color || '#1F2937',
      alignment: content.alignment || 'Center',
      steps: content.steps || [],
      media_url: content.media_url || '',
      media_id: content.media_id || '',
      media_type: content.media_type || '',
      quiz_question: content.quiz_question || '',
      quiz_options: content.quiz_options || ['', '', '', ''],
      quiz_correct_index: content.quiz_correct_index !== undefined ? content.quiz_correct_index : 0,
      elements: activeElements
    });

    if (activeElements.length > 0) {
      setSelectedBlockId(activeElements[0].id);
    } else {
      setSelectedBlockId(null);
    }
    setView('screen-builder');
    setIsEditingScreen(true);

    const targetPath = `/content-studio/editor/${sc.id}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
      setCurrentPath(targetPath);
    }
  };

  const handleAddBlock = (type) => {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type.toLowerCase(),
      content: {},
      styles: {}
    };

    if (type.toLowerCase() === 'heading') {
      newBlock.content = { text: 'New Heading', tag: 'H2' };
      newBlock.styles = { fontFamily: 'Poppins', fontSize: '32px', color: '#1F2937', alignment: 'Center', fontWeight: 'Bold' };
    } else if (type.toLowerCase() === 'text') {
      newBlock.content = { text: 'New text block body...' };
      newBlock.styles = { fontFamily: 'Poppins', fontSize: '16px', color: '#334155', alignment: 'Left', fontWeight: 'Normal' };
    } else if (type.toLowerCase() === 'image') {
      newBlock.content = { url: '', caption: '' };
    } else if (type.toLowerCase() === 'audio') {
      newBlock.content = { url: '', title: 'Audio Clip' };
    } else if (type.toLowerCase() === 'video') {
      newBlock.content = { url: '' };
    } else if (type.toLowerCase() === 'dialogue') {
      newBlock.content = {
        steps: [
          { step: 1, name: 'Ben', text: 'Hello!', avatarColor: '#3b82f6', side: 'left' }
        ]
      };
    } else if (type.toLowerCase() === 'quiz' || type.toLowerCase() === 'mcq') {
      newBlock.type = 'quiz';
      newBlock.content = {
        question: 'Question text?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswerIndex: 0
      };
    } else if (type.toLowerCase() === 'voice_recorder' || type.toLowerCase() === 'voice recorder') {
      newBlock.type = 'voice_recorder';
      newBlock.content = { prompt: 'Please record your response.' };
    } else if (type.toLowerCase() === 'drag_drop' || type.toLowerCase() === 'drag and drop' || type.toLowerCase() === 'drag_and_drop') {
      newBlock.type = 'drag_drop';
      newBlock.content = {
        question: 'Drag the correct words to their destinations.',
        pairs: [
          { id: 'pair-1', source: 'Apple', target: 'Fruit' },
          { id: 'pair-2', source: 'Carrot', target: 'Vegetable' }
        ]
      };
    } else if (type.toLowerCase() === 'fill_blank' || type.toLowerCase() === 'fill in blanks' || type.toLowerCase() === 'fill_in_blanks') {
      newBlock.type = 'fill_blank';
      newBlock.content = {
        question: 'Complete the sentence by filling in the blanks.',
        text: 'The quick brown [fox] jumps over the lazy [dog].'
      };
    } else if (type.toLowerCase() === 'match_items' || type.toLowerCase() === 'match items') {
      newBlock.type = 'match_items';
      newBlock.content = {
        question: 'Match the items in Column A with Column B.',
        pairs: [
          { id: 'match-1', left: 'Dog', right: 'Bark' },
          { id: 'match-2', left: 'Cat', right: 'Meow' }
        ]
      };
    } else if (type.toLowerCase() === 'sequence' || type.toLowerCase() === 'sequence / order') {
      newBlock.type = 'sequence';
      newBlock.content = {
        question: 'Arrange the items in the correct order.',
        items: ['Step 1: Get out of bed', 'Step 2: Brush your teeth', 'Step 3: Eat breakfast']
      };
    } else if (type.toLowerCase() === 'flashcard') {
      newBlock.type = 'flashcard';
      newBlock.content = {
        cards: [
          { id: 'card-1', front: 'Hello', back: 'Greeting in English' },
          { id: 'card-2', front: 'Bonjour', back: 'Greeting in French' }
        ]
      };
    } else if (type.toLowerCase() === 'sentence_builder' || type.toLowerCase() === 'sentence builder') {
      newBlock.type = 'sentence_builder';
      newBlock.content = {
        question: 'Reorder the words to make a correct sentence.',
        sentence: 'Learning English is fun and easy',
        words: ['Learning', 'English', 'is', 'fun', 'and', 'easy']
      };
    } else if (type.toLowerCase() === 'word_search' || type.toLowerCase() === 'word search / crossword') {
      newBlock.type = 'word_search';
      newBlock.content = {
        question: 'Find the hidden words in the grid.',
        words: ['DASHBOARD', 'STUDIO', 'TEACHER'],
        gridSize: 8
      };
    }

    const updatedElements = [...(screenForm.elements || []), newBlock];
    setScreenForm(prev => ({
      ...prev,
      elements: updatedElements
    }));
    setSelectedBlockId(newBlock.id);
    showFeedback(`Added ${type.replace('_', ' ')} block`);
  };

  const handleDropBlock = (type) => {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type.toLowerCase(),
      content: {},
      styles: {}
    };

    if (type.toLowerCase() === 'heading') {
      newBlock.content = { text: 'New Heading', tag: 'H2' };
      newBlock.styles = { fontFamily: 'Poppins', fontSize: '32px', color: '#1F2937', alignment: 'Center', fontWeight: 'Bold' };
    } else if (type.toLowerCase() === 'text') {
      newBlock.content = { text: 'New text block body...' };
      newBlock.styles = { fontFamily: 'Poppins', fontSize: '16px', color: '#334155', alignment: 'Left', fontWeight: 'Normal' };
    } else if (type.toLowerCase() === 'image') {
      newBlock.content = { url: '', caption: '' };
    } else if (type.toLowerCase() === 'audio') {
      newBlock.content = { url: '', title: 'Audio Clip' };
    } else if (type.toLowerCase() === 'video') {
      newBlock.content = { url: '' };
    } else if (type.toLowerCase() === 'dialogue') {
      newBlock.content = {
        steps: [
          { step: 1, name: 'Ben', text: 'Hello!', avatarColor: '#3b82f6', side: 'left' }
        ]
      };
    } else if (type.toLowerCase() === 'quiz' || type.toLowerCase() === 'mcq') {
      newBlock.type = 'quiz';
      newBlock.content = {
        question: 'Question text?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswerIndex: 0
      };
    } else if (type.toLowerCase() === 'voice_recorder' || type.toLowerCase() === 'voice recorder') {
      newBlock.type = 'voice_recorder';
      newBlock.content = { prompt: 'Please record your response.' };
    } else if (type.toLowerCase() === 'drag_drop' || type.toLowerCase() === 'drag and drop' || type.toLowerCase() === 'drag_and_drop') {
      newBlock.type = 'drag_drop';
      newBlock.content = {
        question: 'Drag the correct words to their destinations.',
        pairs: [
          { id: 'pair-1', source: 'Apple', target: 'Fruit' },
          { id: 'pair-2', source: 'Carrot', target: 'Vegetable' }
        ]
      };
    } else if (type.toLowerCase() === 'fill_blank' || type.toLowerCase() === 'fill in blanks' || type.toLowerCase() === 'fill_in_blanks') {
      newBlock.type = 'fill_blank';
      newBlock.content = {
        question: 'Complete the sentence by filling in the blanks.',
        text: 'The quick brown [fox] jumps over the lazy [dog].'
      };
    } else if (type.toLowerCase() === 'match_items' || type.toLowerCase() === 'match items') {
      newBlock.type = 'match_items';
      newBlock.content = {
        question: 'Match the items in Column A with Column B.',
        pairs: [
          { id: 'match-1', left: 'Dog', right: 'Bark' },
          { id: 'match-2', left: 'Cat', right: 'Meow' }
        ]
      };
    } else if (type.toLowerCase() === 'sequence' || type.toLowerCase() === 'sequence / order') {
      newBlock.type = 'sequence';
      newBlock.content = {
        question: 'Arrange the items in the correct order.',
        items: ['Step 1: Get out of bed', 'Step 2: Brush your teeth', 'Step 3: Eat breakfast']
      };
    } else if (type.toLowerCase() === 'flashcard') {
      newBlock.type = 'flashcard';
      newBlock.content = {
        cards: [
          { id: 'card-1', front: 'Hello', back: 'Greeting in English' },
          { id: 'card-2', front: 'Bonjour', back: 'Greeting in French' }
        ]
      };
    } else if (type.toLowerCase() === 'sentence_builder' || type.toLowerCase() === 'sentence builder') {
      newBlock.type = 'sentence_builder';
      newBlock.content = {
        question: 'Reorder the words to make a correct sentence.',
        sentence: 'Learning English is fun and easy',
        words: ['Learning', 'English', 'is', 'fun', 'and', 'easy']
      };
    } else if (type.toLowerCase() === 'word_search' || type.toLowerCase() === 'word search / crossword') {
      newBlock.type = 'word_search';
      newBlock.content = {
        question: 'Find the hidden words in the grid.',
        words: ['DASHBOARD', 'STUDIO', 'TEACHER'],
        gridSize: 8
      };
    }

    const updatedElements = [...(screenForm.elements || []), newBlock];
    setScreenForm(prev => ({
      ...prev,
      elements: updatedElements
    }));
    setSelectedBlockId(newBlock.id);
    showFeedback(`Added ${type.replace('_', ' ')} block`);
  };

  const handleDropOnSlot = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;

    if (data.startsWith("block:")) {
      // Reordering is handled via the move up/down controls; dropping back onto the canvas is a no-op.
    } else if (data.startsWith("type:")) {
      const type = data.replace("type:", "");
      handleDropBlock(type);
    } else {
      handleDropBlock(data);
    }
  };

  const renderCanvasBlock = (block, idx) => {
    const isSelected = selectedBlockId === block.id;
    return (
      <div
        key={block.id}
        draggable={true}
        onDragStart={e => {
          e.dataTransfer.setData("text/plain", `block:${block.id}`);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          handleDropOnSlot(e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBlockId(block.id);
        }}
        style={{
          position: 'relative',
          padding: '0.85rem',
          borderRadius: '12px',
          border: isSelected ? '2px solid #0b57d0' : '1.5px solid #e2e8f0',
          background: isSelected ? '#f8fafc' : '#ffffff',
          boxShadow: isSelected ? '0 4px 12px rgba(11,87,208,0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
          cursor: 'pointer',
          transition: 'border 0.15s, box-shadow 0.15s',
          ...(block.styles?.blockWidth ? { width: block.styles.blockWidth } : {}),
          ...(block.styles?.minHeight ? { minHeight: block.styles.minHeight } : {}),
        }}
      >
        {/* Selection Indicator / Action Toolbar */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: '#0b57d0',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.65rem',
            fontWeight: 700,
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            <span style={{ marginRight: '4px', textTransform: 'uppercase', fontSize: '0.58rem' }}>{block.type}</span>
            
            <button
              disabled={idx === 0}
              onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, -1); }}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex', padding: '1px' }}
              title="Move Up"
            >
              <FiChevronUp style={{ fontSize: '0.8rem' }} />
            </button>
            
            <button
              disabled={idx === screenForm.elements.length - 1}
              onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, 1); }}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: idx === screenForm.elements.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', padding: '1px' }}
              title="Move Down"
            >
              <FiChevronDown style={{ fontSize: '0.8rem' }} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleCloneBlock(block); }}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', padding: '1px' }}
              title="Clone Block"
            >
              <FiCopy style={{ fontSize: '0.72rem' }} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
              style={{ background: 'none', border: 'none', color: '#ff8a8a', cursor: 'pointer', display: 'flex', padding: '1px' }}
              title="Delete Block"
            >
              <FiTrash2 style={{ fontSize: '0.72rem' }} />
            </button>
          </div>
        )}

        {/* Block Specific Previews */}
        {block.type === 'heading' && (
          <div style={{ textAlign: (block.styles?.alignment || 'Center').toLowerCase() }}>
            <span style={{
              fontFamily: block.styles?.fontFamily || 'Poppins',
              fontSize: `${(parseInt(block.styles?.fontSize) || 28) * 0.7}px`,
              fontWeight: block.styles?.fontWeight === 'Bold' ? 800 : block.styles?.fontWeight === 'SemiBold' ? 600 : 400,
              color: block.styles?.color || '#1e293b',
              lineHeight: 1.2,
              display: 'inline-block'
            }}>
              {block.content?.text || 'Heading text...'}
            </span>
          </div>
        )}

        {block.type === 'text' && (
          <div style={{
            textAlign: (block.styles?.alignment || 'Left').toLowerCase(),
            fontFamily: block.styles?.fontFamily || 'Poppins',
            fontSize: block.styles?.fontSize || '15px',
            fontWeight: block.styles?.fontWeight === 'Bold' ? 700 : block.styles?.fontWeight === 'SemiBold' ? 600 : 400,
            color: block.styles?.color || '#334155',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap'
          }}>
            {block.content?.text || 'Standard paragraph writing text...'}
          </div>
        )}

        {block.type === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            {block.content?.url ? (
              <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={resolveMediaUrl(block.content.url)}
                  alt="Canvas block illustration"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ width: '100%', padding: '1.25rem 0', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <FiImage style={{ fontSize: '1.8rem', marginBottom: '4px', opacity: 0.6 }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>No Image Loaded</span>
              </div>
            )}
            {block.content?.caption && (
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic' }}>{block.content.caption}</span>
            )}
          </div>
        )}

        {block.type === 'audio' && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.9rem' }}>
              <FiVolume2 />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.content?.title || 'Voice Instruction'}</div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 1 }}>{block.content?.url ? 'Audio track attached' : 'Click to select track'}</div>
            </div>
            {block.content?.url && (
              <audio src={resolveMediaUrl(block.content.url)} controls style={{ width: '100px', height: '24px' }} />
            )}
          </div>
        )}

        {block.type === 'video' && (
          <div style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '8px', overflow: 'hidden' }}>
            {block.content?.url ? (
              <video src={resolveMediaUrl(block.content.url)} controls style={{ width: '100%', height: '140px', display: 'block' }} />
            ) : (
              <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', gap: '0.35rem' }}>
                <FiMonitor style={{ fontSize: '1.75rem' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>No Video Source Configured</span>
              </div>
            )}
          </div>
        )}

        {block.type === 'dialogue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {(block.content?.steps || []).map((stepObj, sIdx) => {
              const isLeft = stepObj.side === 'left';
              return (
                <div key={sIdx} style={{ display: 'flex', gap: '0.5rem', justifyContent: isLeft ? 'flex-start' : 'flex-end', alignItems: 'flex-start' }}>
                  {isLeft && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: stepObj.avatarColor || '#3b82f6', color: '#fff', fontSize: '0.55rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {stepObj.name ? stepObj.name.slice(0, 2).toUpperCase() : 'CC'}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '80%',
                    background: isLeft ? '#f1f5f9' : '#0b57d0',
                    color: isLeft ? '#1e293b' : '#ffffff',
                    borderRadius: '10px',
                    padding: '0.4rem 0.65rem',
                    fontSize: '0.72rem',
                    lineHeight: 1.3
                  }}>
                    {stepObj.text}
                  </div>
                  {!isLeft && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: stepObj.avatarColor || '#ea580c', color: '#fff', fontSize: '0.55rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {stepObj.name ? stepObj.name.slice(0, 2).toUpperCase() : 'ST'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {block.type === 'quiz' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <div style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: '#c2410c' }}>
              ❓ {block.content?.question || 'Empty Quiz Question Description'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {(block.content?.options || ['', '', '', '']).map((opt, oIdx) => {
                const isCorrect = parseInt(block.content?.correctAnswerIndex) === oIdx;
                return (
                  <div
                    key={oIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#ffffff',
                      border: isCorrect ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '0.45rem 0.65rem',
                      fontSize: '0.72rem'
                    }}
                  >
                    <span style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '1px solid #cbd5e1',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.55rem',
                      fontWeight: 'bold',
                      background: isCorrect ? '#dcfce7' : 'none',
                      color: isCorrect ? '#16a34a' : '#64748b',
                      borderColor: isCorrect ? '#16a34a' : '#cbd5e1'
                    }}>{String.fromCharCode(65 + oIdx)}</span>
                    <span style={{ color: opt ? '#334155' : '#94a3b8' }}>{opt || `Option ${oIdx + 1}`}</span>
                    {isCorrect && <span style={{ marginLeft: 'auto', color: '#16a34a', fontSize: '0.58rem', fontWeight: 'bold' }}>✓ Correct</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {block.type === 'voice_recorder' && (
          <div style={{ border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <FiMic style={{ fontSize: '1.8rem', color: '#d97706' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309' }}>Speaking Practice Module</div>
              <div style={{ fontSize: '0.68rem', color: '#b45309', marginTop: '2px' }}>{block.content?.prompt || 'Record your response.'}</div>
            </div>
          </div>
        )}

        {block.type === 'drag_drop' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af' }}>
              Drag & Drop: {block.content?.question || 'Match items by dragging'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569' }}>Sources (Draggable):</span>
              {(block.content?.pairs || []).map((p, pIdx) => (
                <span key={pIdx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600, color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FiMove style={{ fontSize: '0.65rem', color: '#94a3b8' }} /> {p.source || `Item ${pIdx + 1}`}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569' }}>Targets (Dropzones):</span>
              {(block.content?.pairs || []).map((p, pIdx) => (
                <span key={pIdx} style={{ background: '#f8fafc', border: '1px dashed #3b82f6', borderRadius: '6px', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600, color: '#3b82f6' }}>
                  [{p.target || `Zone ${pIdx + 1}`}]
                </span>
              ))}
            </div>
          </div>
        )}

        {block.type === 'fill_blank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #a7f3d0', background: '#ecfdf5', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46' }}>
              Fill in the Blanks: {block.content?.question || 'Complete the text template'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#374151', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem', lineHeight: 1.6 }}>
              {(() => {
                const text = block.content?.text || '';
                const parts = text.split(/(\[[^\]]+\])/);
                return parts.map((part, pIdx) => {
                  if (part.startsWith('[') && part.endsWith(']')) {
                    const word = part.slice(1, -1);
                    return (
                      <input
                        key={pIdx}
                        type="text"
                        disabled
                        placeholder={word}
                        style={{
                          width: `${Math.max(word.length * 8 + 12, 50)}px`,
                          height: '18px',
                          border: 'none',
                          borderBottom: '2px solid #059669',
                          background: '#f0fdf4',
                          textAlign: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#059669',
                          margin: '0 4px',
                          outline: 'none',
                          padding: 0
                        }}
                      />
                    );
                  }
                  return <span key={pIdx}>{part}</span>;
                });
              })()}
            </div>
          </div>
        )}

        {block.type === 'match_items' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #e9d5ff', background: '#f3e8ff', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b21a8' }}>
              Match Items: {block.content?.question || 'Pair Column A with Column B'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>Column A</span>
                {(block.content?.pairs || []).map((p, pIdx) => (
                  <div key={pIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{p.left || `Item ${pIdx + 1}`}</span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>Column B</span>
                {(block.content?.pairs || []).map((p, pIdx) => (
                  <div key={pIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                    <span>{p.right || `Match ${pIdx + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {block.type === 'sequence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
              Sequence / Order: {block.content?.question || 'Reorder steps to solve'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
              {(block.content?.items || []).map((item, iIdx) => (
                <div key={iIdx} style={{ background: '#ffffff', border: '1px solid #fef3c7', borderRadius: '6px', padding: '6px 8px', fontSize: '0.72rem', fontWeight: 600, color: '#451a03', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiList style={{ color: '#d97706', fontSize: '0.8rem' }} />
                  <span style={{ background: '#fef3c7', color: '#b45309', borderRadius: '4px', padding: '1px 5px', fontSize: '0.62rem', fontWeight: 800 }}>{iIdx + 1}</span>
                  <span>{item || `Step description ${iIdx + 1}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {block.type === 'flashcard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fbcfe8', background: '#fce7f3', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9d174d' }}>
              Flashcard Cards Deck
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.25rem', marginTop: '0.25rem' }}>
              {(block.content?.cards || []).map((card, cIdx) => (
                <div key={cIdx} style={{ flexShrink: 0, width: '120px', height: '80px', background: '#ffffff', border: '1px solid #fbcfe8', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 4px rgba(157, 23, 77, 0.05)' }}>
                  <div style={{ flex: 1, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #fce7f3', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9d174d' }}>{card.front || 'Front'}</span>
                  </div>
                  <div style={{ background: '#fdf2f8', padding: '4px 6px', fontSize: '0.58rem', color: '#64748b', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={card.back}>
                    {card.back || 'Back description'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {block.type === 'sentence_builder' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #b3e5fc', background: '#e1f5fe', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0277bd' }}>
              Sentence Builder: {block.content?.question || 'Order the scattered words'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: '#ffffff', border: '1px solid #b3e5fc', borderRadius: '8px', padding: '0.6rem', marginTop: '0.25rem' }}>
              {(block.content?.words || []).map((word, wIdx) => (
                <span key={wIdx} style={{ background: '#f1f5f9', border: '1px dashed #0284c7', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, color: '#0284c7' }}>
                  {word}
                </span>
              ))}
            </div>
            <div style={{ fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic' }}>
              Target: "{block.content?.sentence || 'No sentence typed'}"
            </div>
          </div>
        )}

        {block.type === 'word_search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #c7d2fe', background: '#e0e7ff', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3730a3' }}>
              Word Search Puzzle: {block.content?.question || 'Find all hidden words'}
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 18px)', gap: '2px', background: '#ffffff', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                {['A', 'B', 'C', 'D', 'E', 'S', 'F', 'G', 'H', 'I', 'T', 'J', 'K', 'L', 'M', 'O'].map((char, charIdx) => (
                  <div key={charIdx} style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#4f46e5', background: '#f5f3ff', borderRadius: '2px' }}>
                    {char}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Hidden Words</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {(block.content?.words || []).map((w, wIdx) => (
                    <span key={wIdx} style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '1px 4px', fontSize: '0.62rem', fontWeight: 600, color: '#4f46e5' }}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Universal Resize / Crop Handles (all elements) ── */}
        {isSelected && (() => {
          const handleH = {
            position: 'absolute',
            background: '#ffffff',
            border: '1.5px solid #0b57d0',
            width: '8px',
            height: '8px',
            zIndex: 20,
            borderRadius: '1px',
            pointerEvents: 'none',
          };

          const makeBottomDragger = () => (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const startY = e.clientY;
                const el = e.currentTarget.parentElement;
                const initH = el.offsetHeight;
                const move = (mv) => {
                  const newH = Math.max(60, initH + (mv.clientY - startY));
                  el.style.minHeight = `${newH}px`;
                  handleUpdateBlockStyles('minHeight', `${newH}px`);
                };
                const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '12px', cursor: 'ns-resize', zIndex: 15, background: 'transparent' }}
              title="Drag to resize height"
            />
          );

          const makeRightDragger = () => (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const startX = e.clientX;
                const el = e.currentTarget.parentElement;
                const initW = el.offsetWidth;
                const move = (mv) => {
                  const newW = Math.max(120, initW + (mv.clientX - startX));
                  el.style.width = `${newW}px`;
                  handleUpdateBlockStyles('blockWidth', `${newW}px`);
                };
                const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
              style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '12px', cursor: 'ew-resize', zIndex: 15, background: 'transparent' }}
              title="Drag to resize width"
            />
          );

          const makeCornerDragger = () => (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const startX = e.clientX;
                const startY = e.clientY;
                const el = e.currentTarget.parentElement;
                const initW = el.offsetWidth;
                const initH = el.offsetHeight;
                const move = (mv) => {
                  const newW = Math.max(120, initW + (mv.clientX - startX));
                  const newH = Math.max(60, initH + (mv.clientY - startY));
                  el.style.width = `${newW}px`;
                  el.style.minHeight = `${newH}px`;
                  const elements = (screenForm.elements || []).map(el2 =>
                    el2.id === block.id ? { ...el2, styles: { ...el2.styles, blockWidth: `${newW}px`, minHeight: `${newH}px` } } : el2
                  );
                  setScreenForm(prev => ({ ...prev, elements }));
                };
                const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
              style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', cursor: 'nwse-resize', zIndex: 16, background: 'transparent' }}
              title="Drag corner to resize"
            />
          );

          return (
            <>
              {/* 4 corners */}
              <div style={{ ...handleH, top: '-1px', left: '-1px' }} />
              <div style={{ ...handleH, top: '-1px', right: '-1px' }} />
              <div style={{ ...handleH, bottom: '-1px', left: '-1px' }} />
              <div style={{ ...handleH, bottom: '-1px', right: '-1px' }} />
              {/* 4 mid-edge handles */}
              <div style={{ ...handleH, top: '-1px', left: 'calc(50% - 4px)' }} />
              <div style={{ ...handleH, bottom: '-1px', left: 'calc(50% - 4px)' }} />
              <div style={{ ...handleH, top: 'calc(50% - 4px)', left: '-1px' }} />
              <div style={{ ...handleH, top: 'calc(50% - 4px)', right: '-1px' }} />
              {/* Drag zones */}
              {makeBottomDragger()}
              {makeRightDragger()}
              {makeCornerDragger()}
            </>
          );
        })()}

      </div>
    );
  };

  const handleMoveBlock = (index, direction) => {
    const elements = [...(screenForm.elements || [])];
    if (index + direction < 0 || index + direction >= elements.length) return;
    const temp = elements[index];
    elements[index] = elements[index + direction];
    elements[index + direction] = temp;
    setScreenForm(prev => ({ ...prev, elements }));
  };

  const handleCloneBlock = (block) => {
    const elements = [...(screenForm.elements || [])];
    const idx = elements.findIndex(el => el.id === block.id);
    if (idx === -1) return;
    const cloned = JSON.parse(JSON.stringify(block));
    cloned.id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    elements.splice(idx + 1, 0, cloned);
    setScreenForm(prev => ({ ...prev, elements }));
    setSelectedBlockId(cloned.id);
    showFeedback(`Cloned block`);
  };

  const handleDeleteBlock = (blockId) => {
    const elements = (screenForm.elements || []).filter(el => el.id !== blockId);
    setScreenForm(prev => ({ ...prev, elements }));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(elements.length > 0 ? elements[0].id : null);
    }
    showFeedback(`Deleted block`);
  };

  const handleUpdateBlockContent = (field, value) => {
    const elements = (screenForm.elements || []).map(el => {
      if (el.id === selectedBlockId) {
        return {
          ...el,
          content: {
            ...el.content,
            [field]: value
          }
        };
      }
      return el;
    });
    setScreenForm(prev => ({ ...prev, elements }));
  };

  const handleUpdateBlockMultipleContent = (updates) => {
    setScreenForm(prev => {
      const elements = (prev.elements || []).map(el => {
        if (el.id === selectedBlockId) {
          return {
            ...el,
            content: {
              ...el.content,
              ...updates
            }
          };
        }
        return el;
      });
      return { ...prev, elements };
    });
  };

  const handleUpdateBlockStyles = (field, value) => {
    const elements = (screenForm.elements || []).map(el => {
      if (el.id === selectedBlockId) {
        return {
          ...el,
          styles: {
            ...el.styles,
            [field]: value
          }
        };
      }
      return el;
    });
    setScreenForm(prev => ({ ...prev, elements }));
  };

  const handleSaveScreen = async (redirectToLibrary = true) => {
    if (!selectedScreen || !selectedScreen.id) return;
    setActionLoading(true);
    try {
      // Build backward-compatible single element fallbacks from the blocks list
      let fallbackText = screenForm.content;
      let fallbackSteps = screenForm.steps || [];
      let fallbackMediaUrl = screenForm.media_url || '';
      let fallbackMediaId = screenForm.media_id || '';
      let fallbackMediaType = screenForm.media_type || '';
      let fallbackQuizQuestion = screenForm.quiz_question || '';
      let fallbackQuizOptions = screenForm.quiz_options || ['', '', '', ''];
      let fallbackQuizCorrectIndex = screenForm.quiz_correct_index !== undefined ? screenForm.quiz_correct_index : 0;

      const blocks = screenForm.elements || [];
      const dialogueBlock = blocks.find(b => b.type === 'dialogue');
      if (dialogueBlock) {
        fallbackSteps = dialogueBlock.content?.steps || [];
      }
      const imageBlock = blocks.find(b => b.type === 'image');
      if (imageBlock) {
        fallbackMediaUrl = imageBlock.content?.url || '';
        fallbackMediaId = imageBlock.content?.media_id || '';
        fallbackMediaType = 'IMAGE';
      }
      const videoBlock = blocks.find(b => b.type === 'video');
      if (videoBlock) {
        fallbackMediaUrl = videoBlock.content?.url || '';
        fallbackMediaId = videoBlock.content?.media_id || '';
        fallbackMediaType = 'VIDEO';
      }
      const audioBlock = blocks.find(b => b.type === 'audio');
      if (audioBlock) {
        fallbackMediaUrl = audioBlock.content?.url || '';
        fallbackMediaId = audioBlock.content?.media_id || '';
        fallbackMediaType = 'AUDIO';
      }
      const quizBlock = blocks.find(b => b.type === 'quiz');
      if (quizBlock) {
        fallbackQuizQuestion = quizBlock.content?.question || '';
        fallbackQuizOptions = quizBlock.content?.options || ['', '', '', ''];
        fallbackQuizCorrectIndex = quizBlock.content?.correctAnswerIndex !== undefined ? quizBlock.content.correctAnswerIndex : 0;
      }
      const textBlock = blocks.find(b => b.type === 'text');
      if (textBlock) {
        fallbackText = textBlock.content?.text || '';
      }

      const payload = {
        title: screenForm.title,
        screen_type: screenForm.screen_type || 'INFORMATION',
        content: {
          layout: screenForm.layout || '1-column',
          columnRatio: screenForm.columnRatio || '50-50',
          elements: blocks,
          text: fallbackText,
          title: screenForm.title,
          tag: screenForm.tag,
          font: screenForm.font,
          weight: screenForm.weight,
          size: screenForm.size,
          color: screenForm.color,
          alignment: screenForm.alignment || 'Center',
          steps: fallbackSteps,
          media_url: fallbackMediaUrl,
          media_id: fallbackMediaId,
          media_type: fallbackMediaType,
          quiz_question: fallbackQuizQuestion,
          quiz_options: fallbackQuizOptions,
          quiz_correct_index: fallbackQuizCorrectIndex
        },
        estimated_duration: selectedScreen.estimated_duration || 60
      };

      const res = await apiFetch(`/api/v1/content/screens/${selectedScreen.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedScreen(data);
        showFeedback('Screen saved successfully');
        if (redirectToLibrary) {
          loadExperiencesData();
          setView('experiences');
        } else {
          loadActivityDetail(selectedActivity.id, false);
          setIsEditingScreen(false);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showFeedback(extractErrorMessage(errData, 'Failed to save screen'), 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Network error occurred while saving screen', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNewScreen = async () => {
    if (!selectedActivity || !selectedActivity.id) {
      triggerAlert("Please save the activity first before adding screens.", "Save Activity Required", "warning");
      return;
    }
    triggerPrompt(
      "Enter a title for the new screen:",
      "Create New Screen",
      "",
      "e.g. Grammar Challenge",
      async (title) => {
        if (!title || !title.trim()) return;
        try {
          const res = await apiFetch('/api/v1/content/screens/', {
            method: 'POST',
            body: JSON.stringify({
              activity: selectedActivity.id,
              title: title.trim(),
              screen_type: 'INFORMATION',
              content: {
                text: 'Welcome Screen Text',
                title: title.trim(),
                tag: 'H1',
                font: 'Poppins',
                weight: 'Bold',
                size: 48,
                color: '#1F2937',
                alignment: 'Center',
                steps: [
                  { step: 1, name: 'Ben', text: 'Hi! What would you like to order?' },
                  { step: 2, name: 'Anna', text: "I'd like a cup of coffee, please." }
                ]
              },
              estimated_duration: 60
            })
          });
          if (res.ok) {
            showFeedback('Screen added successfully');
            loadActivityDetail(selectedActivity.id, false);
          } else {
            const errData = await res.json().catch(() => ({}));
            showFeedback(extractErrorMessage(errData, 'Failed to add screen'), 'error');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleDeleteScreen = (id) => {
    const scr = screens.find(s => s.id === id);
    setDeleteConfirm({
      show: true,
      id,
      type: 'screen',
      title: 'Delete Screen',
      message: `Are you sure you want to delete the screen "${scr?.title || ''}"? This action cannot be undone.`
    });
  };

  const handleMoveScreen = async (index, direction) => {
    if (!screens || screens.length < 2) return;
    const newScreens = [...screens];
    const temp = newScreens[index];
    newScreens[index] = newScreens[index + direction];
    newScreens[index + direction] = temp;

    try {
      const res = await apiFetch('/api/v1/content/screens/reorder/', {
        method: 'PATCH',
        body: JSON.stringify({ ids: newScreens.map(s => s.id) })
      });
      if (res.ok) {
        showFeedback('Screens reordered');
        setScreens(newScreens);
      } else {
        showFeedback('Failed to reorder screens', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOutcome = async () => {
    if (!selectedExperience || !selectedExperience.id) {
      triggerAlert("Please save the experience first before adding learning outcomes.", "Save Experience Required", "warning");
      return;
    }
    triggerPrompt(
      "Enter learning outcome text:",
      "Add Learning Outcome",
      "",
      "e.g. Can express opinions clearly...",
      async (text) => {
        if (!text || !text.trim()) return;
        try {
          const res = await apiFetch('/api/v1/content/learning-outcomes/', {
            method: 'POST',
            body: JSON.stringify({ experience: selectedExperience.id, text: text.trim() })
          });
          if (res.ok) {
            showFeedback('Learning outcome added');
            loadExperienceDetail(selectedExperience.id);
          } else {
            const errData = await res.json().catch(() => ({}));
            showFeedback(extractErrorMessage(errData, 'Failed to add learning outcome'), 'error');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleEditOutcome = async (outcome) => {
    triggerPrompt(
      "Edit learning outcome text:",
      "Edit Learning Outcome",
      outcome.text,
      "e.g. Can express opinions clearly...",
      async (text) => {
        if (!text || !text.trim()) return;
        try {
          const res = await apiFetch(`/api/v1/content/learning-outcomes/${outcome.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ text: text.trim() })
          });
          if (res.ok) {
            showFeedback('Learning outcome updated');
            loadExperienceDetail(selectedExperience.id);
          } else {
            const errData = await res.json().catch(() => ({}));
            showFeedback(extractErrorMessage(errData, 'Failed to update learning outcome'), 'error');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleDeleteOutcome = (id) => {
    const out = learningOutcomes.find(o => o.id === id);
    setDeleteConfirm({
      show: true,
      id,
      type: 'outcome',
      title: 'Delete Learning Outcome',
      message: `Are you sure you want to delete this learning outcome: "${out?.text || ''}"? This action cannot be undone.`
    });
  };

  const handleAddStep = () => {
    triggerPrompt(
      "Enter character name (e.g. Ben):",
      "Add Character Name",
      "",
      "Character Name",
      (name) => {
        if (!name || !name.trim()) return;
        triggerPrompt(
          "Enter dialogue text:",
          "Add Dialogue Text",
          "",
          "Speech text...",
          (text) => {
            if (!text || !text.trim()) return;
            const newSteps = [...(screenForm.steps || [])];
            newSteps.push({
              step: newSteps.length + 1,
              name: name.trim(),
              text: text.trim()
            });
            setScreenForm({ ...screenForm, steps: newSteps });
          }
        );
      }
    );
  };

  const handleEditStep = (idx) => {
    const step = screenForm.steps[idx];
    triggerPrompt(
      "Edit character name:",
      "Edit Character Name",
      step.name,
      "Character Name",
      (name) => {
        if (!name || !name.trim()) return;
        triggerPrompt(
          "Edit dialogue text:",
          "Edit Dialogue Text",
          step.text,
          "Speech text...",
          (text) => {
            if (!text || !text.trim()) return;
            const newSteps = [...(screenForm.steps || [])];
            newSteps[idx] = {
              ...step,
              name: name.trim(),
              text: text.trim()
            };
            setScreenForm({ ...screenForm, steps: newSteps });
          }
        );
      }
    );
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset the input so the same file can be uploaded again if needed
    e.target.value = null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    // The backend auto-detects media_type from the file content; folder is optional
    formData.append('folder', '');

    setActionLoading(true);
    try {
      // Correct endpoint: /upload/ (POST /api/v1/content/media/ returns 405)
      const res = await apiFetch('/api/v1/content/media/upload/', {
        method: 'POST',
        body: formData
      });
      if (res.status === 201 || res.ok) {
        showFeedback('File uploaded successfully!');
        loadMediaData();
      } else {
        const errData = await res.json().catch(() => ({}));
        showFeedback(errData.error || 'Failed to upload file', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Upload error occurred', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', `thumb_${Date.now()}_${file.name.split('.')[0]}`);

      const res = await apiFetch('/api/v1/content/media/upload/', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        let thumbUrl = data.url || data.file || '';
        if (thumbUrl && !thumbUrl.startsWith('http')) {
          thumbUrl = `${API_BASE_URL}${thumbUrl}`;
        }
        setExperienceForm(prev => ({ ...prev, thumbnail: thumbUrl }));
        showFeedback('Thumbnail uploaded successfully');
      } else {
        const errData = await res.json().catch(() => ({}));
        showFeedback(extractErrorMessage(errData, 'Failed to upload thumbnail'), 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Network error occurred during thumbnail upload', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPackageJSON = async (versionId, filename) => {
    try {
      const res = await apiFetch(`/api/v1/content/packages/${versionId}/preview-json/`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showFeedback(errData.error || 'Failed to fetch package JSON', 'error');
        return;
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ? filename.replace('.elab', '.json') : `package_${versionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback('Package JSON downloaded!');
    } catch (err) {
      console.error(err);
      showFeedback('Download error occurred', 'error');
    }
  };

  const handleDownloadPackageElab = async (versionId, filename) => {
    try {
      const res = await apiFetch(`/api/v1/content/packages/${versionId}/download/`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showFeedback(errData.error || 'Failed to download .elab package', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `package_${versionId}.elab`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback('.elab package downloaded!');
    } catch (err) {
      console.error(err);
      showFeedback('Download error occurred', 'error');
    }
  };

  const handleDeleteMedia = (id) => {
    const asset = mediaAssets.find(m => m.id === id);
    setDeleteConfirm({
      show: true,
      id,
      type: 'media',
      title: 'Delete Media Asset',
      message: `Are you sure you want to delete the media asset "${asset?.name || ''}"? This action cannot be undone.`
    });
  };

  const loadPublishData = async (experienceId) => {
    if (!experienceId) return;
    try {
      const resStatus = await apiFetch(`/api/v1/content/publish/${experienceId}/`);
      if (resStatus.ok) {
        const statusData = await resStatus.json();
        setPublishStatus(statusData);
        if (statusData?.latest_version) {
          setPublishVersion(incrementVersion(statusData.latest_version.version_number));
        } else {
          setPublishVersion("1.0.0");
        }
      } else {
        setPublishVersion("1.0.0");
      }
      const resHistory = await apiFetch(`/api/v1/content/publish/history/${experienceId}/`);
      if (resHistory.ok) {
        const histData = await resHistory.json();
        setPublishHistory(histData.versions || []);
        if (histData.versions && histData.versions.length > 0 && !publishVersion) {
          setPublishVersion(incrementVersion(histData.versions[0].version_number));
        }
      }
      // Load validation report dynamically on entering publish center
      const resVal = await apiFetch(`/api/v1/content/validation/${experienceId}/run/`, { method: 'POST' });
      if (resVal.ok) {
        setValidationReport(await resVal.json());
      }
      // Load assignment options
      const resAssign = await apiFetch(`/api/v1/content/assignment-options/`);
      if (resAssign.ok) {
        const assignData = await resAssign.json();
        setAssignSchools(assignData.schools || []);
        const rawGrades = assignData.grades || [];
        const filteredGrades = rawGrades.filter(g => {
          const match = g.grade_name.match(/^Grade\s+(\d+)$/i);
          if (match) {
            const num = parseInt(match[1]);
            return num >= 3 && num <= 8;
          }
          return false;
        }).sort((a, b) => {
          const numA = parseInt(a.grade_name.match(/\d+/)[0]);
          const numB = parseInt(b.grade_name.match(/\d+/)[0]);
          return numA - numB;
        });
        setAssignGrades(filteredGrades);
        const expAssignments = (assignData.assignments || []).filter(
          a => String(a.experience_ref) === String(experienceId)
        );
        setAssignHistory(expAssignments);
      }
    } catch (e) {
      console.error('Failed to load publish status, history, validation or assignment data', e);
    }
  };

  const handlePublishExperience = async () => {
    if (!selectedExperience || !selectedExperience.id) {
      triggerAlert("No active experience selected.", "No Experience Selected", "warning");
      return;
    }
    if (!publishVersion || !publishVersion.trim()) {
      triggerAlert("Please enter a valid version number (e.g. 1.0.0).", "Invalid Version", "warning");
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/v1/content/publish/${selectedExperience.id}/`, {
        method: 'POST',
        body: JSON.stringify({ version: publishVersion.trim(), release_notes: publishNotes })
      });
      if (res.status === 201) {
        showFeedback('Package published successfully!');
        setPublishNotes('Initial release of the experience.');
        loadPublishData(selectedExperience.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.validation_report) {
          setValidationReport(errData.validation_report);
        }
        showFeedback(errData.error || 'Publishing failed. Make sure experience has no validation errors.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Network error occurred during packaging', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignExperience = async () => {
    if (!selectedExperience || !selectedExperience.id) {
      triggerAlert("No active experience selected.", "No Experience Selected", "warning");
      return;
    }
    if (!targetSchoolId) {
      triggerAlert("Please select a target school.", "School Required", "warning");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/v1/content/assign-experience/`, {
        method: 'POST',
        body: JSON.stringify({
          experience_id: selectedExperience.id,
          school_id: targetSchoolId,
          grade_id: targetGradeId || null
        })
      });
      if (res.ok) {
        showFeedback("Experience assigned successfully!");
        setTargetSchoolId('');
        setTargetGradeId('');
        loadPublishData(selectedExperience.id);
      } else {
        const data = await res.json().catch(() => ({}));
        showFeedback(data.error || "Failed to assign experience.", "error");
      }
    } catch (err) {
      console.error(err);
      showFeedback("Failed to assign experience due to a network error.", "error");
    } finally {
      setActionLoading(false);
    }
  };



  const handleStartPreview = async (targetActId = null, targetScrId = null) => {
    const expId = selectedExperience?.id;
    if (!expId) {
      triggerAlert("Please select or create an experience first.", "No Experience Selected", "warning");
      return;
    }
    try {
      const res = await apiFetch(`/api/v1/content/experiences/${expId}/preview/`);
      if (res.ok) {
        const payload = await res.json();
        setPreviewPayload(payload);

        let actIdx = 0;
        let scrIdx = 0;

        if (targetActId && payload.activities) {
          const aIndex = payload.activities.findIndex(a => a.id === targetActId);
          if (aIndex !== -1) {
            actIdx = aIndex;
            if (targetScrId && payload.activities[aIndex].screens) {
              const sIndex = payload.activities[aIndex].screens.findIndex(s => s.id === targetScrId);
              if (sIndex !== -1) {
                scrIdx = sIndex;
              }
            }
          }
        }

        setPreviewActivityIndex(actIdx);
        setPreviewScreenIndex(scrIdx);
        setPreviewAnswerIndex(null);
        setView('preview');
      } else {
        showFeedback('Failed to start preview', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Preview error occurred', 'error');
    }
  };



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
          padding: 0.65rem 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          transition: background 0.18s;
          cursor: default;
        }
        .cs-logout-btn {
          color: rgba(255, 255, 255, 0.4) !important;
          background: transparent !important;
        }
        .cs-logout-btn:hover {
          color: #f87171 !important;
          background: rgba(239, 68, 68, 0.15) !important;
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
        <div className="cs-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
          <img src={logoIcon} alt="Logo" style={{ width: '62px', height: '100px', objectFit: 'contain' }} />
          <div>
            <h2 className="cs-brand-title">LinguaLab</h2>
            <span className="cs-brand-sub">Content Studio</span>
          </div>
        </div>

        <nav className="cs-nav">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: <FiGrid /> },
            { key: 'experiences', label: 'Experience Library', icon: <FiBookOpen /> },
            { key: 'experience-builder', label: 'Experience Builder', icon: <FiActivity /> },
            { key: 'activity-builder', label: 'Activity Builder', icon: <FiSettings /> },
            { key: 'screen-builder', label: 'Screen Builder', icon: <FiMonitor /> },
            { key: 'preview', label: 'Runtime Preview', icon: <FiPlay /> },
            { key: 'media', label: 'Media Library', icon: <FiImage /> },
            { key: 'publish', label: 'Publish Center', icon: <FiDownload /> },
            { key: 'reports', label: 'Sync Reports', icon: <FiFileText /> },
            { key: 'profile', label: 'Profile Settings', icon: <FiUser /> },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === 'preview') {
                  handleStartPreview();
                } else {
                  if (item.key === 'screen-builder') {
                    setIsEditingScreen(false);
                    if (selectedActivity && selectedActivity.id) {
                      loadActivityDetail(selectedActivity.id, false);
                    }
                  }
                  setView(item.key);
                }
              }}
              className={`cs-nav-item ${view === item.key ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="cs-sidebar-footer">
          <div className="cs-profile-card">
            <div className="cs-profile-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {currentUserState?.profile_picture ? (
                <img src={resolveMediaUrl(currentUserState.profile_picture)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
              ) : (
                (currentUserState?.username || 'CC').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="cs-profile-info">
              <div className="cs-profile-name">{currentUserState?.full_name || currentUserState?.username || 'Content Creator'}</div>
              <div className="cs-profile-desc">Content Creator</div>
            </div>
            <button className="sd-logout-icon-btn cs-logout-btn" onClick={onLogout} title="Logout">
              <FiLogOut />
            </button>
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
          <div className="cs-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            <div className="sd-year-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
              <FiCalendar/> {formatDateTime(currentTime)}
            </div>

            <div style={{ position: 'relative' }}>
              <button className="sd-icon-btn" style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); setShowNotifDropdown(!showNotifDropdown); }}>
                <FiBell/>
                {notifications.some(n => !(n.read || n.is_read)) && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                )}
              </button>
              {showNotifDropdown && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '300px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 1000, padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Notifications</span>
                    <button style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true, is_read: true })))}>Mark all read</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No new notifications.</div>
                    ) : (
                      notifications.map(n => {
                        const text = n.text || n.message || 'Notification';
                        const time = n.time || (n.created_at ? new Date(n.created_at).toLocaleTimeString() : 'Recently');
                        const read = n.read !== undefined ? n.read : n.is_read;
                        return (
                          <div key={n.id} style={{ padding: '8px', borderRadius: '6px', backgroundColor: read ? 'transparent' : '#f0fdf4', borderLeft: read ? 'none' : '3px solid #22c55e', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                            <span style={{ fontSize: '0.8rem', color: '#334155' }}>{text}</span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{time}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="sd-icon-btn" onClick={() => setShowHelpModal(true)} title="Help & Support"><FiHelpCircle/></button>
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
                  <h1>{getGreeting()}, {currentUserState?.full_name || currentUserState?.username || user?.full_name || user?.username || 'Creator'}!</h1>
                  <p>Empowering Better Learning Experiences.<br />Create, organize, and publish engaging educational content with ease.</p>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div className="cs-stat-row">
                {[
                  { label: 'Total Experiences', value: dashboardSummary?.total_experiences || 0, icon: <FiFileText style={{ color: '#0284c7', fontSize: '1.5rem' }} />, bg: '#e0f2fe', trend: 'Active', trendBg: '#dcfce7', trendColor: '#15803d' },
                  { label: 'Draft Experiences', value: dashboardSummary?.draft_experiences || 0, icon: <FiFileText style={{ color: '#ea580c', fontSize: '1.5rem' }} />, bg: '#ffedd5', trend: 'Editing', trendBg: '#ffedd5', trendColor: '#ea580c' },
                  { label: 'Published Experiences', value: dashboardSummary?.published_experiences || 0, icon: <FiCheckCircle style={{ color: '#16a34a', fontSize: '1.5rem' }} />, bg: '#dcfce7', trend: 'Live', trendBg: '#dcfce7', trendColor: '#16a34a' },
                  { label: 'Total Media Assets', value: dashboardSummary?.total_media_assets || 0, icon: <FiImage style={{ color: '#7c3aed', fontSize: '1.5rem' }} />, bg: '#f3e8ff', trend: 'Library', trendBg: '#f3e8ff', trendColor: '#7c3aed' },
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
                          {recentExperiences.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', padding: '1rem' }}>No recent experiences.</td>
                            </tr>
                          ) : (
                            recentExperiences.map((row, idx) => (
                              <tr key={idx}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: 36, height: 26, background: '#f1f5f9', borderRadius: 4 }} />
                                    <span style={{ fontWeight: 600 }}>{row.title}</span>
                                  </div>
                                </td>
                                <td>{row.grade_name || `Grade ${row.grade}`}</td>
                                <td>
                                  <span className={`cs-badge ${row.status === 'PUBLISHED' ? 'cs-badge-published' : 'cs-badge-draft'}`}>
                                    {row.status}
                                  </span>
                                </td>
                                <td>{new Date(row.updated_at).toLocaleDateString()}</td>
                                <td>
                                  <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => loadExperienceDetail(row, true)}>Open</button>
                                </td>
                              </tr>
                            ))
                          )}
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
                      {recentActivities.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No recent activity.</div>
                      ) : (
                        recentActivities.map((item, idx) => {
                          const isEdit = item.activity_type === 'experience_edited';
                          return (
                            <div key={idx} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                              <div style={{ background: isEdit ? '#e0f2fe' : '#ffedd5', color: isEdit ? '#0284c7' : '#ea580c', padding: '0.45rem', borderRadius: '50%', display: 'flex' }}>
                                {isEdit ? <FiEdit2 /> : <FiUpload />}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{item.message}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{new Date(item.timestamp).toLocaleDateString()}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
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
              <div style={{ marginBottom: '1.5rem', padding: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.25rem' }}>

                  {/* Left Side: Filter inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>

                    {/* Row 1: Grade, Subject, Difficulty, Status - all equal width */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: 160, minWidth: 130 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>Grade</span>
                        <select className="cs-filter-select" style={{ width: '100%', height: '36px', fontSize: '0.78rem', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 0.5rem', color: '#1e293b', cursor: 'pointer' }} value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
                          <option value="">All Grades</option>
                          {gradesList.map(g => (
                            <option key={g.id} value={g.id}>{g.grade_name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: 160, minWidth: 130 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>Subject</span>
                        <select className="cs-filter-select" style={{ width: '100%', height: '36px', fontSize: '0.78rem', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 0.5rem', color: '#1e293b', cursor: 'pointer' }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                          <option value="">All Subjects</option>
                          <option value="Speaking & Listening">Speaking & Listening</option>
                          <option value="Reading">Reading</option>
                          <option value="Writing">Writing</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: 160, minWidth: 130 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>Difficulty</span>
                        <select className="cs-filter-select" style={{ width: '100%', height: '36px', fontSize: '0.78rem', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 0.5rem', color: '#1e293b', cursor: 'pointer' }} value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                          <option value="">All Levels</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: 160, minWidth: 130 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>Status</span>
                        <select className="cs-filter-select" style={{ width: '100%', height: '36px', fontSize: '0.78rem', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 0.5rem', color: '#1e293b', cursor: 'pointer' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                          <option value="">All Status</option>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Tags + Reset */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: 160, minWidth: 130 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>Tags</span>
                        <select className="cs-filter-select" style={{ width: '100%', height: '36px', fontSize: '0.78rem', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 0.5rem', color: '#1e293b', cursor: 'pointer' }} value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                          <option value="">All Tags</option>
                          {Array.from(new Set(experiences.flatMap(e => e.tags || []))).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        style={{
                          border: '1px solid #d1d5db', background: '#ffffff', color: '#374151', fontSize: '0.78rem',
                          cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center',
                          gap: '5px', height: '36px', padding: '0 0.85rem', borderRadius: '8px',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => {
                          setFilterGrade('');
                          setFilterSubject('');
                          setFilterDifficulty('');
                          setFilterStatus('');
                          setFilterTag('');
                        }}
                      >
                        ↺ Reset
                      </button>
                    </div>

                  </div>

                  {/* Right Side: Action Button */}
                  <div style={{ paddingBottom: '4px' }}>
                    <button
                      className="cs-btn-primary"
                      style={{ background: '#0b57d0', color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                      onClick={() => {
                        setIsNewExperience(true);
                        setSelectedExperience(null);
                        setExperienceForm({
                          title: '',
                          description: '',
                          grade: '',
                          subject: [],
                          language: 'English',
                          difficulty: 'Medium',
                          duration: 15,
                          tags: []
                        });
                        setLearningOutcomes([]);
                        setOutcomesText('');
                        setView('experience-builder');
                      }}
                    >
                      + New Experience
                    </button>
                  </div>

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
                    {experiences.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '2rem', fontSize: '0.8rem' }}>No experiences found. Click "+ New Experience" to create one!</td>
                      </tr>
                    ) : (
                      experiences.map((row) => (
                        <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => loadExperienceDetail(row, true)}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: 48, height: 34, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                                {row.thumbnail ? <img src={row.thumbnail.startsWith('http') ? row.thumbnail : `${API_BASE_URL}${row.thumbnail}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.title}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {row.description || 'No description provided.'} &nbsp;
                                  {row.tags && row.tags.map(t => (
                                    <span key={t} style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: 4 }}>{t}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{row.grade_name || `Grade ${row.grade}`}</td>
                          <td>{row.subject}</td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.difficulty === 'EASY' ? '#10b981' : row.difficulty === 'HARD' ? '#ef4444' : '#3b82f6' }} />
                              {row.difficulty_display || row.difficulty}
                            </span>
                          </td>
                          <td>
                            <span className={`cs-badge ${row.status === 'PUBLISHED' ? 'cs-badge-published' : 'cs-badge-draft'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td>v1.0.0</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{new Date(row.updated_at).toLocaleDateString()}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>by {row.created_by_name || 'Content Creator'}</div>
                          </td>
                          <td style={{ textAlign: 'right', position: 'relative' }} onClick={e => e.stopPropagation()}>
                            <button
                              className="cs-icon-btn"
                              onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                              style={{ padding: '6px 10px', fontSize: '1.2rem', cursor: 'pointer', border: 'none', background: 'none', color: '#64748b' }}
                            >
                              <FiMoreVertical />
                            </button>
                            {activeMenuId === row.id && (
                              <div style={{
                                position: 'absolute', right: '16px', top: '75%', background: '#ffffff',
                                border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                zIndex: 100, display: 'flex', flexDirection: 'column', width: '110px', overflow: 'hidden'
                              }}>
                                <button
                                  onClick={() => { setActiveMenuId(null); loadExperienceDetail(row, true); }}
                                  style={{ background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.78rem', textAlign: 'left', cursor: 'pointer', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
                                >
                                  <FiEdit2 style={{ fontSize: '0.85rem' }} /> Edit
                                </button>
                                <button
                                  onClick={() => { setActiveMenuId(null); handleDeleteExperience(row.id); }}
                                  style={{ background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.78rem', textAlign: 'left', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6, width: '100%', borderTop: '1px solid #f1f5f9' }}
                                >
                                  <FiTrash2 style={{ fontSize: '0.85rem' }} /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Table Footer */}
                <div style={{ padding: '1rem 1.5rem' }}>
                  <div className="cs-pagination-bar">
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing {experiences.length > 0 ? 1 : 0} to {experiences.length} of {experiences.length} experiences</span>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button className="cs-page-link">&lt;</button>
                      <button className="cs-page-link active">1</button>
                      <button className="cs-page-link">&gt;</button>


                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───────────────── VIEW 3: EXPERIENCE BUILDER (Image 3) ───────────────── */}
          {view === 'experience-builder' && (
            <>
              {/* Top header - breadcrumb only for new experience */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isNewExperience && (
                    <button className="cs-icon-btn" onClick={() => setView('experiences')}><FiArrowLeft /></button>
                  )}
                  <div>
                    {isNewExperience && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => setView('experiences')}>Experience Library</span> &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Experience Builder</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: isNewExperience ? '4px' : 0 }}>
                      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                        {isNewExperience ? 'New Experience' : 'Experience Builder'}
                      </h1>
                    </div>
                    {experienceForm.grade && Array.isArray(experienceForm.subject) && experienceForm.subject.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {gradesList.find(g => String(g.id) === String(experienceForm.grade))?.grade_name}
                        {` · ${experienceForm.subject.join(' & ')}`}
                        {experienceForm.difficulty ? ` · ${experienceForm.difficulty}` : ''}
                        {experienceForm.duration ? ` · Est. ${experienceForm.duration} min` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={async () => {
                      await handleSaveExperience();
                      setSelectedActivity(null);
                      const defaultSkills = Array.isArray(experienceForm.subject) && experienceForm.subject.length > 0
                        ? [...experienceForm.subject]
                        : [];
                      setActivityForm({ title: '', description: '', objective: '', skills: defaultSkills, duration: 5, mastery: 80 });
                      setView('activity-builder');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'linear-gradient(135deg, #0b57d0, #1d4ed8)',
                      color: '#ffffff', border: 'none', borderRadius: '10px',
                      padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.82rem',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(11,87,208,0.25)'
                    }}
                  >
                    Save &amp; Continue to Activities &nbsp;<span style={{ fontSize: '1rem' }}>→</span>
                  </button>
                </div>
              </div>

              {/* Layout: full-width single column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Experience Information Card */}
                <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: 0 }}>Experience Information</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Experience Title <span style={{ color: '#ef4444' }}>*</span></label>
                        <input className="cs-form-input" type="text" value={experienceForm.title}
                          onChange={e => setExperienceForm({ ...experienceForm, title: e.target.value })} />
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
                        <textarea className="cs-form-input" style={{ minHeight: '75px', resize: 'vertical' }} value={experienceForm.description}
                          onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })} />
                        <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>{experienceForm.description?.length || 0} / 200</div>
                      </div>
                    </div>

                    {/* Thumbnail box */}
                    <div>
                      <label className="cs-form-label">Thumbnail</label>
                      <input
                        type="file"
                        id="thumb-file-input"
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                      />
                      <div
                        onClick={() => document.getElementById('thumb-file-input').click()}
                        style={{ border: '1.5px dashed #cbd5e1', borderRadius: '10px', padding: '0.5rem', textAlign: 'center', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#ffffff', position: 'relative' }}
                      >
                        {experienceForm.thumbnail ? (
                          <img src={experienceForm.thumbnail} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <>
                            <div style={{ width: 44, height: 34, background: '#f1f5f9', borderRadius: 4, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🌅</div>
                            <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>Upload Thumbnail</span>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>JPG, PNG (Max 2MB)</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Grade <span style={{ color: '#ef4444' }}>*</span></label>
                      <select className="cs-form-input" value={experienceForm.grade}
                        onChange={e => setExperienceForm({ ...experienceForm, grade: e.target.value })}>
                        <option value="">Select Grade</option>
                        {gradesList.length > 0 ? (
                          gradesList.map(g => (
                            <option key={g.id} value={g.id}>{g.grade_name}</option>
                          ))
                        ) : (
                          <>
                            <option value="40">Grade 3</option>
                            <option value="41">Grade 4</option>
                            <option value="42">Grade 5</option>
                            <option value="17">Grade 6</option>
                            <option value="43">Grade 7</option>
                            <option value="44">Grade 8</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Language</label>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.75rem',
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
                        fontSize: '0.82rem', color: '#374151', fontWeight: 600, height: '36px'
                      }}>
                        🌐 English
                        <FiLock style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.75rem' }} />
                      </div>
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
                        onChange={e => setExperienceForm({ ...experienceForm, duration: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>

                  {/* Subject Checkboxes — full width row */}
                  <div className="cs-form-group">
                    <label className="cs-form-label">Subject <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {['Speak', 'Listen', 'Read', 'Write', 'Grammar', 'Vocabulary', 'Phonetics'].map(skill => {
                        const isChecked = Array.isArray(experienceForm.subject) && experienceForm.subject.includes(skill);
                        return (
                          <label
                            key={skill}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                              cursor: 'pointer', fontSize: '0.82rem',
                              padding: '5px 14px', borderRadius: '20px',
                              border: isChecked ? '1.5px solid #0b57d0' : '1.5px solid #e2e8f0',
                              background: isChecked ? '#e0f2fe' : '#f8fafc',
                              color: isChecked ? '#0369a1' : '#374151',
                              fontWeight: isChecked ? 600 : 400,
                              transition: 'all 0.15s', userSelect: 'none'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                const current = Array.isArray(experienceForm.subject) ? experienceForm.subject : [];
                                if (e.target.checked) {
                                  setExperienceForm({ ...experienceForm, subject: [...current, skill] });
                                } else {
                                  setExperienceForm({ ...experienceForm, subject: current.filter(s => s !== skill) });
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                            {isChecked && <FiCheck style={{ fontSize: '0.75rem', color: '#0b57d0' }} />}
                            {skill}
                          </label>
                        );
                      })}
                    </div>
                    {Array.isArray(experienceForm.subject) && experienceForm.subject.length === 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '0.35rem' }}>
                        Please select at least one subject skill.
                      </div>
                    )}
                  </div>

                  <div className="cs-form-group" style={{ display: 'none' }}>
                    {/* tags hidden placeholder */}
                  </div>


                  {/* Learning outcomes - simple textarea */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <label className="cs-form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Learning Outcomes</label>
                    <textarea
                      className="cs-form-input"
                      placeholder="Enter each learning outcome on a new line..."
                      style={{ minHeight: '90px', resize: 'vertical', fontSize: '0.82rem', lineHeight: 1.6, fontFamily: 'inherit' }}
                      value={outcomesText}
                      onChange={e => {
                        setOutcomesText(e.target.value);
                        // Also keep learningOutcomes in sync as structured objects for Save
                        const lines = e.target.value.split('\n').filter(l => l.trim() !== '');
                        setLearningOutcomes(lines.map((l, i) => ({ id: i, text: l })));
                      }}
                    />
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>One outcome per line. Press Enter to add more.</div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* ───────────────── VIEW 4: ACTIVITY BUILDER (Image 4) ───────────────── */}
          {view === 'activity-builder' && (
            <>
              {/* Activity Builder header — breadcrumb only when experience is saved */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {selectedExperience?.id && (
                    <button className="cs-icon-btn" onClick={() => setView('experience-builder')}><FiArrowLeft /></button>
                  )}
                  <div>
                    {selectedExperience?.id && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => setView('experiences')}>Experience Library</span> &nbsp;&gt;&nbsp;
                        <span style={{ cursor: 'pointer' }} onClick={() => setView('experience-builder')}>Experience Builder</span> &nbsp;&gt;&nbsp;
                        <span style={{ fontWeight: 600 }}>Activity Builder</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: selectedExperience?.id ? '4px' : 0 }}>
                      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Activity Builder</h1>
                    </div>
                    {(activityForm.title || selectedExperience) && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {activityForm.title && <span>{activityForm.title} · </span>}
                        {gradesList.find(g => String(g.id) === String(selectedExperience?.grade_id || selectedExperience?.grade))?.grade_name || ''}
                        {selectedExperience?.subject ? ` · ${Array.isArray(experienceForm.subject) && experienceForm.subject.length > 0 ? experienceForm.subject.join(' & ') : selectedExperience.subject}` : ''}
                        {selectedExperience?.difficulty ? ` · ${selectedExperience.difficulty}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  {selectedExperience?.id && (
                    <button
                      onClick={() => setView('experience-builder')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: '#ffffff', color: '#374151',
                        border: '1px solid #d1d5db', borderRadius: '10px',
                        padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>←</span>&nbsp; Back to Experience
                    </button>
                  )}
                  <button
                    onClick={handleSaveActivity}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'linear-gradient(135deg, #0b57d0, #1d4ed8)',
                      color: '#ffffff', border: 'none', borderRadius: '10px',
                      padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.82rem',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(11,87,208,0.25)'
                    }}
                  >
                    Save Activity
                  </button>
                </div>
              </div>

              {/* Layout grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
                {/* LEFT COLUMN: Activity Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="cs-form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="cs-form-label">Activity Title <span style={{ color: '#ef4444' }}>*</span></label>
                        <input className="cs-form-input" type="text" value={activityForm.title}
                          onChange={e => setActivityForm({ ...activityForm, title: e.target.value })} />
                      </div>
                      <div className="cs-form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="cs-form-label">Skills</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                          {(() => {
                            const displaySkills = Array.isArray(experienceForm.subject) && experienceForm.subject.length > 0
                              ? experienceForm.subject
                              : (Array.isArray(activityForm.skills) && activityForm.skills.length > 0 ? activityForm.skills : []);
                            if (displaySkills.length === 0) {
                              return <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>Select subjects in Experience Builder to set skills.</span>;
                            }
                            return displaySkills.map(skill => (
                              <span
                                key={skill}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                  fontSize: '0.82rem', padding: '4px 12px', borderRadius: '20px',
                                  border: '1.5px solid #0b57d0',
                                  background: '#e0f2fe', color: '#0369a1', fontWeight: 600
                                }}
                              >
                                <FiCheck style={{ fontSize: '0.72rem', color: '#0b57d0' }} />
                                {skill}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Description</label>
                        <textarea className="cs-form-input" style={{ minHeight: '65px' }} value={activityForm.description}
                          onChange={e => setActivityForm({ ...activityForm, description: e.target.value })} />
                        <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>{activityForm.description?.length || 0} / 300</div>
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Learning Objective</label>
                        <textarea className="cs-form-input" style={{ minHeight: '65px' }} value={activityForm.objective}
                          onChange={e => setActivityForm({ ...activityForm, objective: e.target.value })} />
                        <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>{activityForm.objective?.length || 0} / 300</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Estimated Duration (min)</label>
                        <input className="cs-form-input" type="number" value={activityForm.duration}
                          onChange={e => setActivityForm({ ...activityForm, duration: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Mastery Threshold (%)</label>
                        <input className="cs-form-input" type="number" value={activityForm.mastery}
                          onChange={e => setActivityForm({ ...activityForm, mastery: parseInt(e.target.value) || 0 })} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Activity Timeline */}
                <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 className="cs-card-title" style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>Activity Timeline</h3>
                        <div className="cs-card-sub" style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Sequence of activities within this experience</div>
                      </div>
                      <button
                        type="button"
                        className="cs-btn-outline"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => {
                          setSelectedActivity(null);
                          const defaultSkills = Array.isArray(experienceForm.subject) && experienceForm.subject.length > 0
                            ? [...experienceForm.subject]
                            : [];
                          setActivityForm({ title: '', description: '', objective: '', skills: defaultSkills, duration: 5, mastery: 80 });
                          setScreens([]);
                        }}
                      >
                        + Add New Activity
                      </button>
                    </div>

                    {activities.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', padding: '1.5rem', border: '1.5px dashed #cbd5e1', borderRadius: '8px' }}>
                        No activities added yet. Save the current form above to add your first activity.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activities.map((act, index) => {
                          const isSelected = selectedActivity?.id === act.id;
                          return (
                            <div
                              key={act.id || index}
                              onClick={() => loadActivityDetail(act)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: isSelected ? '1.5px solid #0b57d0' : '1px solid #e2e8f0',
                                background: isSelected ? '#f0f9ff' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {/* Reorder Arrows */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }} onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleMoveActivity(index, -1)}
                                  disabled={index === 0}
                                  style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#cbd5e1' : '#64748b', padding: '2px', display: 'flex' }}
                                >
                                  <FiChevronUp />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveActivity(index, 1)}
                                  disabled={index === activities.length - 1}
                                  style={{ background: 'none', border: 'none', cursor: index === activities.length - 1 ? 'not-allowed' : 'pointer', color: index === activities.length - 1 ? '#cbd5e1' : '#64748b', padding: '2px', display: 'flex' }}
                                >
                                  <FiChevronDown />
                                </button>
                              </div>

                              {/* Index badge */}
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? '#0b57d0' : '#f1f5f9', color: isSelected ? '#ffffff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem' }}>
                                {index + 1}
                              </div>

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{act.title}</span>
                                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({act.estimated_duration || 5} min)</span>
                                </div>
                                <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {act.learning_objective || act.description || 'No objective set.'}
                                </p>
                              </div>

                              {/* Actions */}
                              <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="cs-icon-btn"
                                  onClick={() => loadActivityDetail(act)}
                                  title="Edit Activity"
                                  style={{ padding: '4px' }}
                                >
                                  <FiEdit2 />
                                </button>
                                <button
                                  type="button"
                                  className="cs-icon-btn"
                                  onClick={() => handleDeleteActivity(act.id)}
                                  title="Delete Activity"
                                  style={{ padding: '4px', color: '#ef4444' }}
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>

              </div>
            </>
          )}

          {view === 'screen-builder' && (
            isEditingScreen ? (
            <>
              {/* ═══════════════════════════════════════════════════════════
                  FULL SCREEN STUDIO OVERLAY
                  Adobe Photoshop / Figma / Framer / Webflow inspired editor
                  ═══════════════════════════════════════════════════════════ */}
              <style>{`
                /* ── Full Screen Studio ── */
                @keyframes fss-fade-in { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
                .fss-overlay {
                  position: fixed;
                  inset: 0;
                  width: 100vw;
                  height: 100vh;
                  background: #ECEFF3;
                  z-index: 9999;
                  display: flex;
                  flex-direction: column;
                  font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                  animation: fss-fade-in 0.18s ease-out;
                  overflow: hidden;
                }

                /* Top Toolbar */
                .fss-toolbar {
                  height: 52px;
                  background: #ffffff;
                  border-bottom: 1px solid #e2e8f0;
                  display: flex;
                  align-items: center;
                  gap: 0;
                  padding: 0;
                  flex-shrink: 0;
                  box-shadow: 0 1px 4px rgba(15,23,42,0.06);
                  z-index: 10;
                  position: relative;
                }
                .fss-toolbar-left {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  padding: 0 1rem;
                  border-right: 1px solid #f1f5f9;
                  height: 100%;
                  min-width: 240px;
                }
                .fss-toolbar-center {
                  flex: 1;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.4rem;
                  padding: 0 1rem;
                }
                .fss-toolbar-right {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  padding: 0 1rem;
                  border-left: 1px solid #f1f5f9;
                  height: 100%;
                }
                .fss-toolbar-btn {
                  display: flex;
                  align-items: center;
                  gap: 0.35rem;
                  background: none;
                  border: none;
                  padding: 0.4rem 0.7rem;
                  border-radius: 7px;
                  cursor: pointer;
                  font-size: 0.8rem;
                  font-weight: 600;
                  color: #475569;
                  transition: all 0.15s;
                  white-space: nowrap;
                }
                .fss-toolbar-btn:hover {
                  background: #f1f5f9;
                  color: #0f172a;
                }
                .fss-toolbar-btn:disabled {
                  opacity: 0.4;
                  cursor: not-allowed;
                }
                .fss-toolbar-btn.active {
                  background: #eff6ff;
                  color: #1d4ed8;
                }
                .fss-toolbar-btn.primary {
                  background: linear-gradient(135deg, #1d4ed8, #2563eb);
                  color: #ffffff;
                  box-shadow: 0 2px 6px rgba(29,78,216,0.3);
                }
                .fss-toolbar-btn.primary:hover {
                  background: linear-gradient(135deg, #1e40af, #1d4ed8);
                  color: #ffffff;
                }
                .fss-toolbar-divider {
                  width: 1px;
                  height: 24px;
                  background: #e2e8f0;
                  margin: 0 0.25rem;
                  flex-shrink: 0;
                }
                .fss-screen-name-btn {
                  background: none;
                  border: none;
                  font-size: 0.88rem;
                  font-weight: 700;
                  color: #0f172a;
                  cursor: pointer;
                  padding: 0.3rem 0.5rem;
                  border-radius: 6px;
                  max-width: 220px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  transition: background 0.15s;
                }
                .fss-screen-name-btn:hover {
                  background: #f1f5f9;
                }
                .fss-autosave {
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  font-size: 0.72rem;
                  font-weight: 600;
                  color: #16a34a;
                  white-space: nowrap;
                }
                .fss-autosave.saving { color: #ca8a04; }
                .fss-autosave.unsaved { color: #dc2626; }
                .fss-autosave-dot {
                  width: 6px; height: 6px;
                  border-radius: 50%;
                  background: currentColor;
                  display: inline-block;
                }

                /* Viewport badge buttons */
                .fss-viewport-btn {
                  display: flex;
                  align-items: center;
                  gap: 0.3rem;
                  background: none;
                  border: 1px solid transparent;
                  padding: 0.3rem 0.6rem;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 0.75rem;
                  font-weight: 600;
                  color: #64748b;
                  transition: all 0.15s;
                }
                .fss-viewport-btn:hover { background: #f1f5f9; color: #1e293b; }
                .fss-viewport-btn.active {
                  background: #eff6ff;
                  border-color: #bfdbfe;
                  color: #1d4ed8;
                }

                /* Main body */
                .fss-body {
                  flex: 1;
                  display: flex;
                  overflow: hidden;
                }

                /* Left Panel */
                .fss-left {
                  background: #ffffff;
                  border-right: 1px solid #e2e8f0;
                  display: flex;
                  flex-direction: column;
                  flex-shrink: 0;
                  overflow: hidden;
                  position: relative;
                  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                  box-shadow: 2px 0 8px rgba(15,23,42,0.04);
                  z-index: 2;
                }
                .fss-left.expanded { width: 280px; }
                .fss-left.collapsed { width: 60px; }

                /* Collapsed icon toolbar */
                .fss-icon-toolbar {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  padding: 0.75rem 0;
                  gap: 0.25rem;
                  height: 100%;
                  overflow-y: auto;
                }
                .fss-icon-tool {
                  width: 44px;
                  height: 44px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  gap: 2px;
                  border: none;
                  background: none;
                  border-radius: 8px;
                  cursor: pointer;
                  color: #64748b;
                  font-size: 1.1rem;
                  transition: all 0.15s;
                  position: relative;
                }
                .fss-icon-tool:hover {
                  background: #eff6ff;
                  color: #1d4ed8;
                }
                .fss-icon-tool-label {
                  font-size: 0.48rem;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.03em;
                  color: inherit;
                  line-height: 1;
                }
                .fss-panel-toggle {
                  width: 44px;
                  height: 44px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: none;
                  background: none;
                  border-radius: 8px;
                  cursor: pointer;
                  color: #64748b;
                  font-size: 1.1rem;
                  transition: all 0.15s;
                  flex-shrink: 0;
                }
                .fss-panel-toggle:hover { background: #f1f5f9; color: #0f172a; }

                /* Full left panel when expanded */
                .fss-left-inner {
                  display: flex;
                  flex-direction: column;
                  height: 100%;
                  overflow: hidden;
                }
                .fss-left-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 0.75rem 0.85rem;
                  border-bottom: 1px solid #f1f5f9;
                  flex-shrink: 0;
                }
                .fss-left-title {
                  font-size: 0.75rem;
                  font-weight: 700;
                  color: #0f172a;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                }
                .fss-left-scroll {
                  flex: 1;
                  overflow-y: auto;
                  padding: 0.85rem;
                  scrollbar-width: thin;
                  scrollbar-color: #cbd5e1 transparent;
                }
                .fss-left-scroll::-webkit-scrollbar { width: 4px; }
                .fss-left-scroll::-webkit-scrollbar-track { background: transparent; }
                .fss-left-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

                /* Center workspace */
                .fss-workspace {
                  flex: 1;
                  background: #ECEFF3;
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                  position: relative;
                }
                .fss-workspace-inner {
                  flex: 1;
                  overflow-y: auto;
                  overflow-x: auto;
                  display: flex;
                  align-items: flex-start;
                  justify-content: center;
                  padding: 2rem 2rem 4rem 2rem;
                  scrollbar-width: thin;
                  scrollbar-color: #94a3b8 transparent;
                }
                .fss-workspace-inner::-webkit-scrollbar { width: 6px; height: 6px; }
                .fss-workspace-inner::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
                .fss-canvas-shell {
                  background: #ffffff;
                  border-radius: 12px;
                  box-shadow: 0 4px 24px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.06);
                  width: 100%;
                  min-height: 600px;
                  position: relative;
                  flex-shrink: 0;
                  transition: max-width 0.3s ease;
                }
                .fss-canvas-shell.desktop { max-width: 1440px; }
                .fss-canvas-shell.tablet { max-width: 768px; }
                .fss-canvas-shell.mobile { max-width: 390px; }
                .fss-canvas-content {
                  padding: 2rem;
                  min-height: 580px;
                }
                .fss-canvas-bar {
                  height: 38px;
                  background: #f8fafc;
                  border-bottom: 1px solid #e2e8f0;
                  border-radius: 12px 12px 0 0;
                  display: flex;
                  align-items: center;
                  padding: 0 1rem;
                  gap: 0.5rem;
                  flex-shrink: 0;
                }
                .fss-canvas-dot {
                  width: 10px; height: 10px;
                  border-radius: 50%;
                }
                .fss-canvas-url {
                  flex: 1;
                  height: 22px;
                  background: #e2e8f0;
                  border-radius: 11px;
                  margin: 0 0.5rem;
                  display: flex;
                  align-items: center;
                  padding: 0 0.75rem;
                  font-size: 0.65rem;
                  color: #64748b;
                  font-weight: 500;
                }

                /* Right Panel */
                .fss-right {
                  width: 340px;
                  flex-shrink: 0;
                  background: #ffffff;
                  border-left: 1px solid #e2e8f0;
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                  box-shadow: -2px 0 8px rgba(15,23,42,0.04);
                  z-index: 2;
                }
                .fss-right-header {
                  padding: 0.85rem 0.95rem 0.6rem 0.95rem;
                  border-bottom: 1px solid #f1f5f9;
                  flex-shrink: 0;
                }
                .fss-right-scroll {
                  flex: 1;
                  overflow-y: auto;
                  padding: 0.85rem;
                  scrollbar-width: thin;
                  scrollbar-color: #cbd5e1 transparent;
                }
                .fss-right-scroll::-webkit-scrollbar { width: 4px; }
                .fss-right-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

                .fss-block-palette-item {
                  border: 1px solid #e2e8f0;
                  border-radius: 10px;
                  padding: 0.6rem 0.75rem;
                  cursor: pointer;
                  display: flex;
                  gap: 0.65rem;
                  align-items: center;
                  background: #ffffff;
                  transition: all 0.15s;
                  margin-bottom: 0.4rem;
                }
                .fss-block-palette-item:hover {
                  border-color: #3b82f6;
                  background: #eff6ff;
                  transform: translateX(2px);
                }
              `}</style>

              <div className="fss-overlay">

                {/* ── TOP TOOLBAR ── */}
                <header className="fss-toolbar">
                  {/* Left: Back + breadcrumb + name */}
                  <div className="fss-toolbar-left">
                    <button
                      className="fss-toolbar-btn"
                      title="Back to Activity Builder (saves first)"
                      onClick={() => {
                        handleSaveScreen(false);
                        window.history.pushState({}, '', '/content-studio');
                        setCurrentPath('/content-studio');
                      }}
                    >
                      <FiArrowLeft style={{ fontSize: '1rem' }} />
                      <span>Back</span>
                    </button>
                    <div className="fss-toolbar-divider" />
                    <button
                      className="fss-screen-name-btn"
                      title="Rename screen"
                      onClick={() => triggerPrompt(
                        "Enter new screen title:", "Rename Screen Title", screenForm.title, "Screen Title",
                        (newTitle) => { if (newTitle && newTitle.trim()) setScreenForm({ ...screenForm, title: newTitle.trim() }); }
                      )}
                    >
                      {screenForm.title || 'Untitled Screen'}
                    </button>
                    <FiEdit2 style={{ fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }} onClick={() => triggerPrompt(
                      "Enter new screen title:", "Rename Screen Title", screenForm.title, "Screen Title",
                      (newTitle) => { if (newTitle && newTitle.trim()) setScreenForm({ ...screenForm, title: newTitle.trim() }); }
                    )} />
                    <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.62rem', padding: '2px 7px', borderRadius: '10px', fontWeight: 700, flexShrink: 0 }}>{screenForm.screen_type}</span>
                  </div>

                  {/* Center: Tools */}
                  <div className="fss-toolbar-center">
                    {/* Undo/Redo */}
                    <button className="fss-toolbar-btn" title="Undo (Ctrl+Z)" disabled={historyIndex <= 0} onClick={handleUndo}>
                      <span style={{ fontSize: '1rem' }}>↩</span>
                    </button>
                    <button className="fss-toolbar-btn" title="Redo (Ctrl+Y)" disabled={historyIndex >= elementsHistory.length - 1} onClick={handleRedo}>
                      <span style={{ fontSize: '1rem' }}>↪</span>
                    </button>
                    <div className="fss-toolbar-divider" />

                    {/* Viewport Switcher */}
                    <button className={`fss-viewport-btn${viewportMode === 'desktop' ? ' active' : ''}`} onClick={() => setViewportMode('desktop')} title="Desktop view">
                      <FiMonitor style={{ fontSize: '0.9rem' }} /> Desktop
                    </button>
                    <button className={`fss-viewport-btn${viewportMode === 'tablet' ? ' active' : ''}`} onClick={() => setViewportMode('tablet')} title="Tablet view">
                      <FiTablet style={{ fontSize: '0.9rem' }} /> Tablet
                    </button>
                    <button className={`fss-viewport-btn${viewportMode === 'mobile' ? ' active' : ''}`} onClick={() => setViewportMode('mobile')} title="Mobile view">
                      <FiSmartphone style={{ fontSize: '0.9rem' }} /> Mobile
                    </button>

                    <div className="fss-toolbar-divider" />

                    {/* Zoom */}
                    <button className="fss-toolbar-btn" onClick={() => setZoomLevel(z => Math.max(50, z - 10))} title="Zoom out" style={{ padding: '0.3rem 0.5rem' }}>−</button>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', minWidth: '38px', textAlign: 'center' }}>{zoomLevel}%</span>
                    <button className="fss-toolbar-btn" onClick={() => setZoomLevel(z => Math.min(150, z + 10))} title="Zoom in" style={{ padding: '0.3rem 0.5rem' }}>+</button>
                  </div>

                  {/* Right: Save / Publish */}
                  <div className="fss-toolbar-right">
                    {/* Autosave */}
                    <span className={`fss-autosave${autoSaveStatus !== 'saved' ? ` ${autoSaveStatus}` : ''}`}>
                      <span className="fss-autosave-dot" />
                      {autoSaveStatus === 'saved' ? 'Autosaved' : autoSaveStatus === 'saving' ? 'Saving…' : 'Unsaved'}
                    </span>
                    <div className="fss-toolbar-divider" />
                    <button className="fss-toolbar-btn" title="Save as Draft" onClick={() => { triggerAutoSave(); handleSaveScreen(false); }}>
                      <FiCheck style={{ fontSize: '0.9rem' }} /> Save Draft
                    </button>
                    <button className="fss-toolbar-btn primary" title="Save and return" onClick={() => handleSaveScreen(true)}>
                      <FiDownload style={{ fontSize: '0.85rem' }} /> Publish
                    </button>
                    <div className="fss-toolbar-divider" />
                    <button className="fss-toolbar-btn" title="Toggle left panel (Tab)" onClick={() => setLeftPanelCollapsed(c => !c)} style={{ padding: '0.35rem 0.5rem' }}>
                      <FiMenu style={{ fontSize: '1rem' }} />
                    </button>
                  </div>
                </header>

                {/* ── BODY ── */}
                <div className="fss-body">

                  {/* ── LEFT PANEL ── */}
                  <div className={`fss-left ${leftPanelCollapsed ? 'collapsed' : 'expanded'}`}>
                    {leftPanelCollapsed ? (
                      /* Collapsed: icon-only toolbar */
                      <div className="fss-icon-toolbar">
                        <button className="fss-panel-toggle" title="Expand Panel (Tab)" onClick={() => setLeftPanelCollapsed(false)}>
                          <FiMenu />
                        </button>
                        <div style={{ width: '100%', height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                        {[
                          { icon: <FiFileText />, label: 'Layout' },
                          { icon: <FiType />, label: 'Text' },
                          { icon: <FiImage />, label: 'Image' },
                          { icon: <FiPlay />, label: 'Video' },
                          { icon: <FiVolume2 />, label: 'Audio' },
                          { icon: <FiActivity />, label: 'Quiz' },
                          { icon: <FiGrid />, label: 'More' },
                        ].map((t, i) => (
                          <button key={i} className="fss-icon-tool" title={t.label} onClick={() => setLeftPanelCollapsed(false)}>
                            {t.icon}
                            <span className="fss-icon-tool-label">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Expanded: full element palette (identical to existing content) */
                      <div className="fss-left-inner">
                        <div className="fss-left-header">
                          <span className="fss-left-title">Elements</span>
                          <button className="fss-panel-toggle" title="Collapse Panel (Tab)" onClick={() => setLeftPanelCollapsed(true)}>
                            <FiX style={{ fontSize: '0.95rem' }} />
                          </button>
                        </div>
                        <div className="fss-left-scroll">
                          {/* Add Elements */}
                          <div>
                            <h3 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add Elements</h3>
                            <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0 0 0.65rem 0' }}>Append layout blocks to canvas</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {[
                                {
                                  title: "Presentation & Media",
                                  items: [
                                    { type: 'Heading', desc: 'Main titles or section headers', icon: <FiFileText style={{ color: '#0b57d0' }} />, bg: '#e0f2fe' },
                                    { type: 'Text', desc: 'Standard paragraphs of text', icon: <FiFileText style={{ color: '#64748b' }} />, bg: '#f1f5f9' },
                                    { type: 'Image', desc: 'Display pictures and illustrations', icon: <FiImage style={{ color: '#16a34a' }} />, bg: '#dcfce7' },
                                    { type: 'Audio', desc: 'Voice instructions or speech files', icon: <FiVolume2 style={{ color: '#0ea5e9' }} />, bg: '#e0f9ff' },
                                    { type: 'Video', desc: 'Play embedded video presentations', icon: <FiMonitor style={{ color: '#7c3aed' }} />, bg: '#f3e8ff' },
                                    { type: 'Dialogue', desc: 'Interactive character chat bubbles', icon: <FiActivity style={{ color: '#db2777' }} />, bg: '#fce7f3' }
                                  ]
                                },
                                {
                                  title: "Assessment Blocks",
                                  items: [
                                    { type: 'Quiz', desc: 'Interactive MCQ quiz question', icon: <FiCheckCircle style={{ color: '#ea580c' }} />, bg: '#ffedd5' },
                                    { type: 'Voice_Recorder', desc: 'Speaking practice recording input', icon: <FiMic style={{ color: '#d97706' }} />, bg: '#fef3c7' },
                                    { type: 'Drag_Drop', desc: 'Drag items to correct targets', icon: <FiMove style={{ color: '#2563eb' }} />, bg: '#dbeafe' },
                                    { type: 'Fill_Blank', desc: 'Fill in missing words in text', icon: <FiEdit style={{ color: '#059669' }} />, bg: '#d1fae5' },
                                    { type: 'Match_Items', desc: 'Pair items in Column A & B', icon: <FiGitCommit style={{ color: '#7c3aed' }} />, bg: '#f3e8ff' },
                                    { type: 'Sequence', desc: 'Reorder items sequentially', icon: <FiList style={{ color: '#b45309' }} />, bg: '#fef3c7' }
                                  ]
                                },
                                {
                                  title: "Gamification Blocks",
                                  items: [
                                    { type: 'Flashcard', desc: 'Flip cards for front & back', icon: <FiLayers style={{ color: '#db2777' }} />, bg: '#fce7f3' },
                                    { type: 'Sentence_Builder', desc: 'Build sentences with word badges', icon: <FiType style={{ color: '#0284c7' }} />, bg: '#e0f2fe' },
                                    { type: 'Word_Search', desc: 'Simulated letter-grid puzzle', icon: <FiGrid style={{ color: '#4f46e5' }} />, bg: '#e0e7ff' }
                                  ]
                                }
                              ].map(cat => (
                                <div key={cat.title}>
                                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2px' }}>{cat.title}</span>
                                  {cat.items.map(tmpl => (
                                    <div
                                      key={tmpl.type}
                                      onClick={() => handleAddBlock(tmpl.type)}
                                      draggable={true}
                                      onDragStart={e => { e.dataTransfer.setData("text/plain", `type:${tmpl.type}`); e.dataTransfer.effectAllowed = "move"; }}
                                      className="fss-block-palette-item"
                                    >
                                      <div style={{ background: tmpl.bg, padding: '0.3rem', borderRadius: '6px', display: 'flex', flexShrink: 0 }}>{tmpl.icon}</div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>{tmpl.type.replace('_', ' ')}</div>
                                        <div style={{ fontSize: '0.58rem', color: '#64748b', marginTop: '1px', lineHeight: 1.3 }}>{tmpl.desc}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>

                            {/* Pro-tip */}
                            <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.65rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>💡 Pro-Tip</span>
                              <span style={{ fontSize: '0.6rem', color: '#64748b', lineHeight: 1.4, display: 'block' }}>Click or drag elements onto the canvas. Press <strong>Tab</strong> to collapse this panel.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── CENTER WORKSPACE ── */}
                  <div className="fss-workspace">
                    {/* Workspace status bar */}
                    <div style={{ height: '34px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 1.25rem', gap: '1rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
                        {viewportMode === 'desktop' ? '🖥 Desktop — 1440px' : viewportMode === 'tablet' ? '📱 Tablet — 768px' : '📱 Mobile — 390px'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>·</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {(screenForm.elements || []).length} element{(screenForm.elements || []).length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 'auto' }}>Press <kbd style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0 4px', fontSize: '0.62rem' }}>Tab</kbd> to toggle panel</span>
                    </div>

                    {/* Scrollable canvas area */}
                    <div className="fss-workspace-inner">
                      <div className={`fss-canvas-shell ${viewportMode}`} style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
                        {/* Browser chrome bar */}
                        <div className="fss-canvas-bar">
                          <div className="fss-canvas-dot" style={{ background: '#ef4444' }} />
                          <div className="fss-canvas-dot" style={{ background: '#f59e0b' }} />
                          <div className="fss-canvas-dot" style={{ background: '#10b981' }} />
                          <div className="fss-canvas-url">
                            lingualab.edu / experiences / {selectedExperience?.title ? selectedExperience.title.toLowerCase().replace(/\s+/g, '-') : 'screen'}
                          </div>
                        </div>

                        {/* Canvas content */}
                        <div className="fss-canvas-content">
                          <div
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => handleDropOnSlot(e)}
                            style={{ flex: 1, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', background: '#ffffff', minHeight: '500px' }}
                          >
                            {(!screenForm.elements || screenForm.elements.length === 0) ? (
                              <div
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => handleDropOnSlot(e)}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#94a3b8', padding: '4rem 2rem', textAlign: 'center', gap: '1rem', minHeight: '400px', background: '#fafbfc', width: '100%' }}
                              >
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <FiPlusCircle style={{ fontSize: '2rem', color: '#3b82f6' }} />
                                </div>
                                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>Your Canvas is Empty</span>
                                <span style={{ fontSize: '0.82rem', maxWidth: '320px', color: '#64748b', lineHeight: 1.5 }}>Click or drag layout elements from the left panel to start building your screen.</span>
                                <button
                                  onClick={() => setLeftPanelCollapsed(false)}
                                  style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
                                >
                                  Open Element Panel
                                </button>
                              </div>
                            ) : (
                              screenForm.elements.map((block, idx) => renderCanvasBlock(block, idx))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT PROPERTIES PANEL ── */}
                  <div className="fss-right">
                    <div className="fss-right-header">
                      <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>Configuration Properties</h3>
                      <span style={{ fontSize: '0.62rem', color: '#64748b' }}>Edit details for the active element</span>

                      {/* Tab Selector */}
                      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem', gap: '0.75rem', marginTop: '0.6rem' }}>
                        {['content', 'style', 'advanced'].map(t => (
                          <button
                            key={t}
                            onClick={() => setPropertiesTab(t)}
                            style={{
                              background: 'none', border: 'none',
                              borderBottom: propertiesTab === t ? '2px solid #2563eb' : '2px solid transparent',
                              color: propertiesTab === t ? '#2563eb' : '#64748b',
                              fontSize: '0.68rem', fontWeight: 700, padding: '3px 2px',
                              cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s'
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="fss-right-scroll">
                      {(() => {
                        const selectedBlock = (screenForm.elements || []).find(el => el.id === selectedBlockId);
                        if (!selectedBlock) {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.72rem', textAlign: 'center', padding: '2rem 1rem', gap: '0.75rem' }}>
                              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiLayers style={{ color: '#cbd5e1', fontSize: '1.4rem' }} />
                              </div>
                              <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>No Element Selected</span>
                              <span style={{ color: '#94a3b8', fontSize: '0.7rem', lineHeight: 1.5 }}>Click any element on the canvas to configure its properties here.</span>
                            </div>
                          );
                        }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                            {selectedBlock.type.replace('_', ' ')} Settings
                          </span>
                        </div>

                        {propertiesTab === 'content' && (
                          <>

                        {/* BLOCK TYPE 1: HEADING */}
                        {selectedBlock.type === 'heading' && (
                          <>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Heading Text</label>
                              <input
                                className="cs-form-input"
                                style={{ height: '28px', fontSize: '0.78rem' }}
                                type="text"
                                value={selectedBlock.content?.text || ''}
                                onChange={e => handleUpdateBlockContent('text', e.target.value)}
                                placeholder="Enter heading title..."
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Text Tag</label>
                                <select
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.75rem', padding: '0 0.25rem' }}
                                  value={selectedBlock.content?.tag || 'H2'}
                                  onChange={e => handleUpdateBlockContent('tag', e.target.value)}
                                >
                                  <option value="H1">H1 (Large)</option>
                                  <option value="H2">H2 (Medium)</option>
                                  <option value="H3">H3 (Small)</option>
                                </select>
                              </div>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Color Hex</label>
                                <input
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.72rem', padding: '0 4px' }}
                                  type="text"
                                  value={selectedBlock.styles?.color || '#1F2937'}
                                  onChange={e => handleUpdateBlockStyles('color', e.target.value)}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Weight</label>
                                <select
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.75rem', padding: '0 0.25rem' }}
                                  value={selectedBlock.styles?.fontWeight || 'Bold'}
                                  onChange={e => handleUpdateBlockStyles('fontWeight', e.target.value)}
                                >
                                  <option value="Bold">Bold</option>
                                  <option value="SemiBold">SemiBold</option>
                                  <option value="Normal">Normal</option>
                                </select>
                              </div>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Size (px)</label>
                                <input
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.72rem', padding: '0 4px' }}
                                  type="number"
                                  value={parseInt(selectedBlock.styles?.fontSize) || 32}
                                  onChange={e => handleUpdateBlockStyles('fontSize', `${parseInt(e.target.value) || 32}px`)}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Alignment</label>
                                <select
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.75rem', padding: '0 0.25rem' }}
                                  value={selectedBlock.styles?.alignment || 'Center'}
                                  onChange={e => handleUpdateBlockStyles('alignment', e.target.value)}
                                >
                                  <option value="Left">Left</option>
                                  <option value="Center">Center</option>
                                  <option value="Right">Right</option>
                                </select>
                              </div>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Font Family</label>
                                <select
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.75rem', padding: '0 0.25rem' }}
                                  value={selectedBlock.styles?.fontFamily || 'Poppins'}
                                  onChange={e => handleUpdateBlockStyles('fontFamily', e.target.value)}
                                >
                                  <option value="Poppins">Poppins</option>
                                  <option value="Inter">Inter</option>
                                  <option value="Roboto">Roboto</option>
                                </select>
                              </div>
                            </div>
                          </>
                        )}

                        {/* BLOCK TYPE 2: TEXT */}
                        {selectedBlock.type === 'text' && (
                          <>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Paragraph Content</label>
                              <textarea
                                className="cs-form-input"
                                style={{ minHeight: '80px', fontSize: '0.78rem', lineHeight: 1.4 }}
                                value={selectedBlock.content?.text || ''}
                                onChange={e => handleUpdateBlockContent('text', e.target.value)}
                                placeholder="Type paragraphs of body text here..."
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Font Family</label>
                                <select
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.75rem', padding: '0 0.25rem' }}
                                  value={selectedBlock.styles?.fontFamily || 'Poppins'}
                                  onChange={e => handleUpdateBlockStyles('fontFamily', e.target.value)}
                                >
                                  <option value="Poppins">Poppins</option>
                                  <option value="Inter">Inter</option>
                                  <option value="Roboto">Roboto</option>
                                </select>
                              </div>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Color Hex</label>
                                <input
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.72rem', padding: '0 4px' }}
                                  type="text"
                                  value={selectedBlock.styles?.color || '#334155'}
                                  onChange={e => handleUpdateBlockStyles('color', e.target.value)}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Weight</label>
                                <select
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.75rem', padding: '0 0.25rem' }}
                                  value={selectedBlock.styles?.fontWeight || 'Normal'}
                                  onChange={e => handleUpdateBlockStyles('fontWeight', e.target.value)}
                                >
                                  <option value="Bold">Bold</option>
                                  <option value="SemiBold">SemiBold</option>
                                  <option value="Normal">Normal</option>
                                </select>
                              </div>
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Size (px)</label>
                                <input
                                  className="cs-form-input"
                                  style={{ height: 24, fontSize: '0.72rem', padding: '0 4px' }}
                                  type="number"
                                  value={parseInt(selectedBlock.styles?.fontSize) || 16}
                                  onChange={e => handleUpdateBlockStyles('fontSize', `${parseInt(e.target.value) || 16}px`)}
                                />
                              </div>
                            </div>

                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Alignment</label>
                              <select
                                className="cs-form-input"
                                style={{ height: 24, fontSize: '0.75rem', padding: '0 0.25rem' }}
                                value={selectedBlock.styles?.alignment || 'Left'}
                                onChange={e => handleUpdateBlockStyles('alignment', e.target.value)}
                              >
                                <option value="Left">Left</option>
                                <option value="Center">Center</option>
                                <option value="Right">Right</option>
                              </select>
                            </div>
                          </>
                        )}

                        {/* BLOCK TYPE 3: IMAGE / VIDEO / AUDIO */}
                        {(selectedBlock.type === 'image' || selectedBlock.type === 'video' || selectedBlock.type === 'audio') && (
                          <>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Choose Media Asset</label>
                              <select
                                className="cs-form-input"
                                style={{ height: '30px', fontSize: '0.75rem', padding: '0 0.25rem' }}
                                value={selectedBlock.content?.media_id || ''}
                                onChange={e => {
                                  const selectedAsset = mediaAssets.find(m => String(m.id) === String(e.target.value));
                                  if (selectedAsset) {
                                    const assetUrl = selectedAsset.file || selectedAsset.url || '';
                                    handleUpdateBlockMultipleContent({
                                      url: assetUrl,
                                      media_id: selectedAsset.id,
                                      media_type: selectedAsset.media_type
                                    });
                                  } else {
                                    handleUpdateBlockMultipleContent({
                                      url: '',
                                      media_id: '',
                                      media_type: ''
                                    });
                                  }
                                }}
                              >
                                <option value="">-- Select File --</option>
                                {mediaAssets
                                  .filter(m => {
                                    if (selectedBlock.type === 'image') return m.media_type === 'IMAGE';
                                    if (selectedBlock.type === 'video') return m.media_type === 'VIDEO';
                                    if (selectedBlock.type === 'audio') return m.media_type === 'AUDIO';
                                    return true;
                                  })
                                  .map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.media_type})</option>
                                  ))
                                }
                              </select>
                            </div>

                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Or Enter External URL</label>
                              <input
                                className="cs-form-input"
                                style={{ height: '28px', fontSize: '0.78rem' }}
                                type="text"
                                value={selectedBlock.content?.url && !mediaAssets.some(m => (m.file === selectedBlock.content.url || m.url === selectedBlock.content.url)) ? selectedBlock.content.url : ''}
                                onChange={e => {
                                  handleUpdateBlockMultipleContent({
                                    url: e.target.value,
                                    media_id: ''
                                  });
                                }}
                                placeholder="https://example.com/asset.mp3"
                              />
                            </div>

                            {selectedBlock.content?.url && (
                              <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.65rem', wordBreak: 'break-all' }}>
                                <span style={{ fontWeight: 'bold', color: '#475569' }}>Selected Asset URL:</span><br />
                                <span style={{ color: '#0b57d0' }}>{selectedBlock.content.url}</span>
                              </div>
                            )}

                            {selectedBlock.type === 'image' && (
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Caption Text</label>
                                <input
                                  className="cs-form-input"
                                  style={{ height: '28px', fontSize: '0.78rem' }}
                                  type="text"
                                  value={selectedBlock.content?.caption || ''}
                                  onChange={e => handleUpdateBlockContent('caption', e.target.value)}
                                  placeholder="Enter caption..."
                                />
                              </div>
                            )}

                            {selectedBlock.type === 'audio' && (
                              <div className="cs-form-group">
                                <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Audio Title Label</label>
                                <input
                                  className="cs-form-input"
                                  style={{ height: '28px', fontSize: '0.78rem' }}
                                  type="text"
                                  value={selectedBlock.content?.title || ''}
                                  onChange={e => handleUpdateBlockContent('title', e.target.value)}
                                  placeholder="e.g. Activity Instructions Voiceover"
                                />
                              </div>
                            )}
                          </>
                        )}

                        {/* BLOCK TYPE 4: DIALOGUE */}
                        {selectedBlock.type === 'dialogue' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Dialogue Steps</span>
                              <button
                                className="cs-btn-outline"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                onClick={() => {
                                  const steps = [...(selectedBlock.content?.steps || [])];
                                  steps.push({
                                    step: steps.length + 1,
                                    name: 'Ben',
                                    text: 'Dialogue text...',
                                    avatarColor: '#3b82f6',
                                    side: 'left'
                                  });
                                  handleUpdateBlockContent('steps', steps);
                                }}
                              >
                                + Add Speech
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '2px' }}>
                              {(selectedBlock.content?.steps || []).map((step, sIdx) => (
                                <div key={sIdx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#475569' }}>Speech Bubble #{sIdx + 1}</span>
                                    <button
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}
                                      onClick={() => {
                                        const updated = (selectedBlock.content.steps || []).filter((_, i) => i !== sIdx).map((s, idx) => ({ ...s, step: idx + 1 }));
                                        handleUpdateBlockContent('steps', updated);
                                      }}
                                    >
                                      <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                    </button>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                                    <div className="cs-form-group">
                                      <label style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b' }}>Speaker</label>
                                      <input
                                        className="cs-form-input"
                                        style={{ height: '22px', fontSize: '0.72rem', padding: '0 4px' }}
                                        type="text"
                                        value={step.name}
                                        onChange={e => {
                                          const steps = [...selectedBlock.content.steps];
                                          steps[sIdx].name = e.target.value;
                                          handleUpdateBlockContent('steps', steps);
                                        }}
                                      />
                                    </div>
                                    <div className="cs-form-group">
                                      <label style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b' }}>Bubble Side</label>
                                      <select
                                        className="cs-form-input"
                                        style={{ height: '22px', fontSize: '0.72rem', padding: '0' }}
                                        value={step.side || 'left'}
                                        onChange={e => {
                                          const steps = [...selectedBlock.content.steps];
                                          steps[sIdx].side = e.target.value;
                                          handleUpdateBlockContent('steps', steps);
                                        }}
                                      >
                                        <option value="left">Left Speaker</option>
                                        <option value="right">Right Speaker</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="cs-form-group">
                                    <label style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b' }}>Avatar Color</label>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                      {['#3b82f6', '#ea580c', '#16a34a', '#8b5cf6', '#ec4899', '#14b8a6'].map(col => (
                                        <button
                                          key={col}
                                          onClick={() => {
                                            const steps = [...selectedBlock.content.steps];
                                            steps[sIdx].avatarColor = col;
                                            handleUpdateBlockContent('steps', steps);
                                          }}
                                          style={{ width: '16px', height: '16px', borderRadius: '50%', background: col, border: step.avatarColor === col ? '1.5px solid #1e293b' : '1px solid transparent', cursor: 'pointer', padding: 0 }}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div className="cs-form-group">
                                    <label style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b' }}>Speech Text</label>
                                    <textarea
                                      className="cs-form-input"
                                      style={{ minHeight: '36px', fontSize: '0.72rem', padding: '4px', lineHeight: 1.3 }}
                                      value={step.text}
                                      onChange={e => {
                                        const steps = [...selectedBlock.content.steps];
                                        steps[sIdx].text = e.target.value;
                                        handleUpdateBlockContent('steps', steps);
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BLOCK TYPE 5: QUIZ */}
                        {selectedBlock.type === 'quiz' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Quiz Question Config</span>

                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question Description</label>
                              <textarea
                                className="cs-form-input"
                                style={{ minHeight: '44px', fontSize: '0.75rem' }}
                                value={selectedBlock.content?.question || ''}
                                onChange={e => handleUpdateBlockContent('question', e.target.value)}
                                placeholder="e.g. Which of these is a correct response?"
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                              <label className="cs-form-label" style={{ fontSize: '0.68rem', margin: 0 }}>Options List (Mark Correct)</label>
                              {(selectedBlock.content?.options || ['', '', '', '']).map((opt, oIdx) => (
                                <div key={oIdx} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                  <input
                                    type="radio"
                                    name={`quiz_correct_${selectedBlock.id}`}
                                    checked={parseInt(selectedBlock.content?.correctAnswerIndex) === oIdx}
                                    onChange={() => handleUpdateBlockContent('correctAnswerIndex', oIdx)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#475569' }}>{String.fromCharCode(65 + oIdx)}:</span>
                                  <input
                                    className="cs-form-input"
                                    style={{ height: '24px', fontSize: '0.72rem', flex: 1 }}
                                    type="text"
                                    value={opt}
                                    onChange={e => {
                                      const options = [...(selectedBlock.content?.options || ['', '', '', ''])];
                                      options[oIdx] = e.target.value;
                                      handleUpdateBlockContent('options', options);
                                    }}
                                    placeholder={`Option text ${oIdx + 1}...`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BLOCK TYPE 6: VOICE RECORDER */}
                        {selectedBlock.type === 'voice_recorder' && (
                          <div className="cs-form-group">
                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Voice Instruction Prompt</label>
                            <textarea
                              className="cs-form-input"
                              style={{ minHeight: '80px', fontSize: '0.75rem' }}
                              value={selectedBlock.content?.prompt || ''}
                              onChange={e => handleUpdateBlockContent('prompt', e.target.value)}
                              placeholder="e.g. Repeat after the recording: 'Good morning, class!'"
                            />
                          </div>
                        )}

                        {/* BLOCK TYPE: DRAG DROP */}
                        {selectedBlock.type === 'drag_drop' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Drag & Drop Settings</span>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question Instruction</label>
                              <textarea className="cs-form-input" style={{ minHeight: '44px', fontSize: '0.75rem' }}
                                value={selectedBlock.content?.question || ''}
                                onChange={e => handleUpdateBlockContent('question', e.target.value)}
                                placeholder="e.g. Drag the correct label to matching container" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Match Pairs</span>
                              <button type="button" className="cs-btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                onClick={() => { const pairs = [...(selectedBlock.content?.pairs || [])]; pairs.push({ id: `pair-${Date.now()}`, source: 'New Item', target: 'New Destination' }); handleUpdateBlockContent('pairs', pairs); }}>
                                + Add Pair
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '200px', overflowY: 'auto' }}>
                              {(selectedBlock.content?.pairs || []).map((p, pIdx) => (
                                <div key={p.id || pIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b' }}>Pair #{pIdx + 1}</span>
                                    <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                      onClick={() => { const pairs = (selectedBlock.content.pairs || []).filter((_, i) => i !== pIdx); handleUpdateBlockContent('pairs', pairs); }}>
                                      <FiTrash2 style={{ fontSize: '0.72rem' }} /></button>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                                    <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem' }} type="text" placeholder="Source (Drag)" value={p.source}
                                      onChange={e => { const pairs = [...selectedBlock.content.pairs]; pairs[pIdx].source = e.target.value; handleUpdateBlockContent('pairs', pairs); }} />
                                    <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem' }} type="text" placeholder="Target (Drop)" value={p.target}
                                      onChange={e => { const pairs = [...selectedBlock.content.pairs]; pairs[pIdx].target = e.target.value; handleUpdateBlockContent('pairs', pairs); }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BLOCK TYPE: FILL BLANK */}
                        {selectedBlock.type === 'fill_blank' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Fill in Blanks Config</span>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question Instruction</label>
                              <textarea className="cs-form-input" style={{ minHeight: '44px', fontSize: '0.75rem' }} value={selectedBlock.content?.question || ''}
                                onChange={e => handleUpdateBlockContent('question', e.target.value)} placeholder="e.g. Complete the sentences with correct terms" />
                            </div>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Text Template (Use [ ] for blanks)</label>
                              <textarea className="cs-form-input" style={{ minHeight: '80px', fontSize: '0.75rem', lineHeight: 1.4 }} value={selectedBlock.content?.text || ''}
                                onChange={e => handleUpdateBlockContent('text', e.target.value)} placeholder="e.g. The quick brown [fox] jumps over the lazy [dog]." />
                              <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                                Wrap correct answers in square brackets. Users will see empty input boxes.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* BLOCK TYPE: MATCH ITEMS */}
                        {selectedBlock.type === 'match_items' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Match Column Pairs</span>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question Instruction</label>
                              <textarea className="cs-form-input" style={{ minHeight: '44px', fontSize: '0.75rem' }} value={selectedBlock.content?.question || ''}
                                onChange={e => handleUpdateBlockContent('question', e.target.value)} placeholder="e.g. Match left side options with correct right answers" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Match Pairs</span>
                              <button type="button" className="cs-btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                onClick={() => { const pairs = [...(selectedBlock.content?.pairs || [])]; pairs.push({ id: `match-${Date.now()}`, left: 'Left Option', right: 'Right Match' }); handleUpdateBlockContent('pairs', pairs); }}>
                                + Add Match
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '200px', overflowY: 'auto' }}>
                              {(selectedBlock.content?.pairs || []).map((p, pIdx) => (
                                <div key={p.id || pIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b' }}>Pair #{pIdx + 1}</span>
                                    <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                      onClick={() => { const pairs = (selectedBlock.content.pairs || []).filter((_, i) => i !== pIdx); handleUpdateBlockContent('pairs', pairs); }}>
                                      <FiTrash2 style={{ fontSize: '0.72rem' }} /></button>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                                    <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem' }} type="text" placeholder="Column A (Left)" value={p.left}
                                      onChange={e => { const pairs = [...selectedBlock.content.pairs]; pairs[pIdx].left = e.target.value; handleUpdateBlockContent('pairs', pairs); }} />
                                    <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem' }} type="text" placeholder="Column B (Right)" value={p.right}
                                      onChange={e => { const pairs = [...selectedBlock.content.pairs]; pairs[pIdx].right = e.target.value; handleUpdateBlockContent('pairs', pairs); }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BLOCK TYPE: SEQUENCE */}
                        {selectedBlock.type === 'sequence' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Ordering / Sequence Config</span>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question Instruction</label>
                              <textarea className="cs-form-input" style={{ minHeight: '44px', fontSize: '0.75rem' }} value={selectedBlock.content?.question || ''}
                                onChange={e => handleUpdateBlockContent('question', e.target.value)} placeholder="e.g. Sort the steps in correct chronological order" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Sequence Steps</span>
                              <button type="button" className="cs-btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                onClick={() => { const items = [...(selectedBlock.content?.items || [])]; items.push('New step text...'); handleUpdateBlockContent('items', items); }}>
                                + Add Step
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '200px', overflowY: 'auto' }}>
                              {(selectedBlock.content?.items || []).map((item, iIdx) => (
                                <div key={iIdx} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', minWidth: '14px' }}>{iIdx + 1}:</span>
                                  <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem', flex: 1 }} type="text" value={item}
                                    onChange={e => { const items = [...selectedBlock.content.items]; items[iIdx] = e.target.value; handleUpdateBlockContent('items', items); }} placeholder="Enter step details..." />
                                  <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    onClick={() => { const items = (selectedBlock.content.items || []).filter((_, i) => i !== iIdx); handleUpdateBlockContent('items', items); }}>
                                    <FiTrash2 style={{ fontSize: '0.72rem' }} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BLOCK TYPE: FLASHCARD */}
                        {selectedBlock.type === 'flashcard' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Flashcard Deck Configuration</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Flashcards List</span>
                              <button type="button" className="cs-btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                onClick={() => { const cards = [...(selectedBlock.content?.cards || [])]; cards.push({ id: `card-${Date.now()}`, front: 'Front word', back: 'Back definition or context' }); handleUpdateBlockContent('cards', cards); }}>
                                + Add Card
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '240px', overflowY: 'auto' }}>
                              {(selectedBlock.content?.cards || []).map((card, cIdx) => (
                                <div key={card.id || cIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b' }}>Card #{cIdx + 1}</span>
                                    <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                      onClick={() => { const cards = (selectedBlock.content.cards || []).filter((_, i) => i !== cIdx); handleUpdateBlockContent('cards', cards); }}>
                                      <FiTrash2 style={{ fontSize: '0.72rem' }} /></button>
                                  </div>
                                  <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem' }} type="text" placeholder="Front Text (Question/Word)" value={card.front}
                                    onChange={e => { const cards = [...selectedBlock.content.cards]; cards[cIdx].front = e.target.value; handleUpdateBlockContent('cards', cards); }} />
                                  <textarea className="cs-form-input" style={{ minHeight: '36px', fontSize: '0.72rem', lineHeight: 1.3 }} placeholder="Back Text (Answer/Meaning)" value={card.back}
                                    onChange={e => { const cards = [...selectedBlock.content.cards]; cards[cIdx].back = e.target.value; handleUpdateBlockContent('cards', cards); }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BLOCK TYPE: SENTENCE BUILDER */}
                        {selectedBlock.type === 'sentence_builder' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Sentence Builder Config</span>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question Instruction</label>
                              <textarea className="cs-form-input" style={{ minHeight: '44px', fontSize: '0.75rem' }} value={selectedBlock.content?.question || ''}
                                onChange={e => handleUpdateBlockContent('question', e.target.value)} placeholder="e.g. Reorder words to form a correct sentence" />
                            </div>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Full Target Sentence</label>
                              <input className="cs-form-input" style={{ height: '28px', fontSize: '0.78rem' }} type="text" value={selectedBlock.content?.sentence || ''}
                                onChange={e => {
                                  const text = e.target.value;
                                  const splitWords = text.trim() ? text.split(' ').filter(w => w.length > 0) : [];
                                  handleUpdateBlockMultipleContent({ sentence: text, words: splitWords });
                                }} placeholder="Learning English is fun and easy" />
                            </div>
                            {selectedBlock.content?.words?.length > 0 && (
                              <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>Scrambled Words Preview:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                  {selectedBlock.content.words.map((w, wIdx) => (
                                    <span key={wIdx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 600, color: '#334155' }}>{w}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* BLOCK TYPE: WORD SEARCH */}
                        {selectedBlock.type === 'word_search' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Word Search Configuration</span>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question Instruction</label>
                              <textarea className="cs-form-input" style={{ minHeight: '44px', fontSize: '0.75rem' }} value={selectedBlock.content?.question || ''}
                                onChange={e => handleUpdateBlockContent('question', e.target.value)} placeholder="e.g. Find all educational terms in the puzzle" />
                            </div>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Grid Dimensions Size</label>
                              <select className="cs-form-input" style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.25rem' }}
                                value={selectedBlock.content?.gridSize || 8}
                                onChange={e => handleUpdateBlockContent('gridSize', parseInt(e.target.value))}>
                                <option value={6}>6 x 6 grid</option>
                                <option value={8}>8 x 8 grid</option>
                                <option value={10}>10 x 10 grid</option>
                                <option value={12}>12 x 12 grid</option>
                              </select>
                            </div>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Words List (Comma Separated)</label>
                              <input className="cs-form-input" style={{ height: '28px', fontSize: '0.78rem' }} type="text"
                                value={selectedBlock.content?.words?.join(', ') || ''}
                                onChange={e => { const list = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean); handleUpdateBlockContent('words', list); }}
                                placeholder="e.g. DASHBOARD, STUDIO, TEACHER" />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                        {propertiesTab === 'style' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Font Family</label>
                              <select
                                className="cs-form-input"
                                style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.25rem' }}
                                value={selectedBlock.styles?.fontFamily || 'Poppins'}
                                onChange={e => handleUpdateBlockStyles('fontFamily', e.target.value)}
                              >
                                <option value="Poppins">Poppins</option>
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Georgia">Georgia</option>
                              </select>
                            </div>

                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Font Size</label>
                              <input
                                className="cs-form-input"
                                style={{ height: '28px', fontSize: '0.75rem' }}
                                type="text"
                                value={selectedBlock.styles?.fontSize || ''}
                                onChange={e => handleUpdateBlockStyles('fontSize', e.target.value)}
                                placeholder="e.g. 16px, 1.25rem"
                              />
                            </div>

                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Font Weight</label>
                              <select
                                className="cs-form-input"
                                style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.25rem' }}
                                value={selectedBlock.styles?.fontWeight || 'Normal'}
                                onChange={e => handleUpdateBlockStyles('fontWeight', e.target.value)}
                              >
                                <option value="Normal">Normal</option>
                                <option value="SemiBold">SemiBold</option>
                                <option value="Bold">Bold</option>
                              </select>
                            </div>

                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Text Color</label>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                  type="color"
                                  value={selectedBlock.styles?.color && selectedBlock.styles.color.startsWith('#') ? selectedBlock.styles.color : '#1e293b'}
                                  onChange={e => handleUpdateBlockStyles('color', e.target.value)}
                                  style={{ border: 'none', width: '32px', height: '32px', padding: 0, cursor: 'pointer', borderRadius: '4px' }}
                                />
                                <input
                                  className="cs-form-input"
                                  style={{ height: '28px', fontSize: '0.75rem', flex: 1 }}
                                  type="text"
                                  value={selectedBlock.styles?.color || ''}
                                  onChange={e => handleUpdateBlockStyles('color', e.target.value)}
                                  placeholder="Hex color code"
                                />
                              </div>
                            </div>

                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Alignment</label>
                              <select
                                className="cs-form-input"
                                style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.25rem' }}
                                value={selectedBlock.styles?.alignment || 'Left'}
                                onChange={e => handleUpdateBlockStyles('alignment', e.target.value)}
                              >
                                <option value="Left">Left</option>
                                <option value="Center">Center</option>
                                <option value="Right">Right</option>
                                <option value="Justify">Justify</option>
                              </select>
                            </div>

                            {selectedBlock.type === 'image' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                                <div className="cs-form-group">
                                  <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Image Crop / Fit Mode</label>
                                  <select
                                    className="cs-form-input"
                                    style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.25rem' }}
                                    value={selectedBlock.styles?.objectFit || 'cover'}
                                    onChange={e => handleUpdateBlockStyles('objectFit', e.target.value)}
                                  >
                                    <option value="cover">Crop to Fit (Cover)</option>
                                    <option value="contain">Show Entire Image (Contain)</option>
                                    <option value="fill">Stretch to Fill (Fill)</option>
                                  </select>
                                </div>

                                <div className="cs-form-group">
                                  <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Image Height</label>
                                  <select
                                    className="cs-form-input"
                                    style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.25rem' }}
                                    value={selectedBlock.styles?.height || '220px'}
                                    onChange={e => handleUpdateBlockStyles('height', e.target.value)}
                                  >
                                    <option value="120px">Small (120px)</option>
                                    <option value="220px">Medium (220px)</option>
                                    <option value="320px">Large (320px)</option>
                                    <option value="420px">X-Large (420px)</option>
                                    <option value="auto">Auto Height</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {propertiesTab === 'advanced' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {screenForm.layout === '2-column' && (
                              <div className="cs-form-group" style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Layout Display Column</label>
                                <select
                                  className="cs-form-input"
                                  style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.25rem' }}
                                  value={selectedBlock.slot || 'left'}
                                  onChange={e => handleUpdateBlockMultipleContent({ slot: e.target.value })}
                                >
                                  <option value="left">Left Column</option>
                                  <option value="right">Right Column</option>
                                </select>
                              </div>
                            )}

                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Custom Developer CSS Class</label>
                              <input
                                className="cs-form-input"
                                style={{ height: '28px', fontSize: '0.75rem' }}
                                type="text"
                                value={selectedBlock.styles?.customClass || ''}
                                onChange={e => handleUpdateBlockStyles('customClass', e.target.value)}
                                placeholder="e.g. animated-card custom-btn"
                              />
                            </div>

                            <div className="cs-form-group">
                              <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Raw JSON Attributes Editor</span>
                                <span style={{ color: '#0b57d0', fontSize: '0.6rem' }}>Developer Mode</span>
                              </label>
                              <textarea
                                className="cs-form-input"
                                style={{ minHeight: '140px', fontSize: '0.68rem', fontFamily: 'monospace', lineHeight: 1.3, background: '#1e293b', color: '#38bdf8', padding: '0.5rem' }}
                                value={JSON.stringify({ content: selectedBlock.content, styles: selectedBlock.styles }, null, 2)}
                                onChange={e => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    if (parsed.content || parsed.styles) {
                                      const elements = (screenForm.elements || []).map(el => {
                                        if (el.id === selectedBlockId) {
                                          return {
                                            ...el,
                                            content: parsed.content || el.content,
                                            styles: parsed.styles || el.styles
                                          };
                                        }
                                        return el;
                                      });
                                      setScreenForm(prev => ({ ...prev, elements }));
                                    }
                                  } catch (err) {
                                    // Ignore parse errors while typing
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              </div>

              </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 'calc(100vh - 120px)' }}>
              {/* Breadcrumbs and Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => setView('experiences')}>Experience Library</span> &nbsp;&gt;&nbsp; <span style={{ cursor: 'pointer' }} onClick={() => setView('experience-builder')}>{selectedExperience?.title || 'Experience Builder'}</span> &nbsp;&gt;&nbsp; <span style={{ cursor: 'pointer' }} onClick={() => setView('activity-builder')}>{selectedActivity?.title || 'Activity Builder'}</span> &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Screen Builder Overview</span>
                  </div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '6px 0 0 0', color: '#0f172a', letterSpacing: '-0.02em' }}>Screen Library</h1>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    className="cs-btn-outline"
                    onClick={() => setView('activity-builder')}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: '#334155' }}
                  >
                    Back to Activity
                  </button>
                  <button
                    onClick={handleAddNewScreen}
                    disabled={!selectedActivity?.id}
                    style={{
                      background: 'linear-gradient(135deg, #0b57d0, #1d4ed8)',
                      color: '#ffffff', border: 'none', borderRadius: '10px',
                      padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.82rem',
                      cursor: !selectedActivity?.id ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(11,87,208,0.25)',
                      opacity: !selectedActivity?.id ? 0.6 : 1
                    }}
                  >
                    + Add New Screen
                  </button>
                </div>
              </div>

              {/* Main Content Body */}
              {!selectedActivity?.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', gap: '1rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <FiAlertTriangle style={{ fontSize: '2rem' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>No Active Activity Selected</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '380px', margin: 0 }}>Please select or create an activity in the **Activity Builder** first to manage and design screens.</p>
                  </div>
                  <button className="cs-btn-primary" onClick={() => setView('activity-builder')} style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', background: '#0b57d0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Go to Activity Builder</button>
                </div>
              ) : screens.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '4rem 2rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <FiMonitor style={{ fontSize: '2.5rem', opacity: 0.8 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>This Activity Has No Screens Yet</h3>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '340px', margin: '0 auto' }}>Design immersive, interactive screens (quizzes, dialogues, media) for your learners.</p>
                  </div>
                  <button
                    onClick={handleAddNewScreen}
                    style={{
                      background: 'linear-gradient(135deg, #0b57d0, #1d4ed8)',
                      color: '#ffffff', border: 'none', borderRadius: '10px',
                      padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '0.85rem',
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(11,87,208,0.2)'
                    }}
                  >
                    + Create First Screen
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Activity context card */}
                  <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>Active Activity</span>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '2px 0 0 0' }}>{selectedActivity.title}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Total Screens</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{screens.length}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Total Duration</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{Math.ceil(screens.reduce((acc, scr) => acc + (scr.estimated_duration || 60), 0) / 60)} min</span>
                      </div>
                    </div>
                  </div>

                  {/* List of Screen Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {screens.map((scr, idx) => {
                      const elementsCount = scr.content?.elements?.length || 0;
                      return (
                        <div
                          key={scr.id}
                          onClick={() => loadScreenDetail(scr)}
                          style={{
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            borderRadius: '12px',
                            border: '1.5px solid #e2e8f0',
                            background: '#ffffff',
                            transition: 'all 0.15s',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                            gap: '1.5rem'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#0b57d0';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(11,87,208,0.06)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
                          }}
                        >
                          {/* Left section: Index and info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#f1f5f9',
                              border: '1.5px solid #cbd5e1',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              flexShrink: 0
                            }}>
                              {idx + 1}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {scr.title || 'Untitled Screen'}
                              </h3>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: '#64748b', marginTop: '2px', alignItems: 'center' }}>
                                <span className="cs-badge" style={{
                                  background: scr.screen_type === 'INFORMATION' ? '#e0f2fe' :
                                    scr.screen_type === 'IMAGE' ? '#dcfce7' :
                                      scr.screen_type === 'VIDEO' ? '#f3e8ff' :
                                        scr.screen_type === 'SPEAKING' ? '#e0f9ff' :
                                          scr.screen_type === 'QUIZ' ? '#ffedd5' : '#f1f5f9',
                                  color: scr.screen_type === 'INFORMATION' ? '#0369a1' :
                                    scr.screen_type === 'IMAGE' ? '#15803d' :
                                      scr.screen_type === 'VIDEO' ? '#7c3aed' :
                                        scr.screen_type === 'SPEAKING' ? '#0891b2' :
                                          scr.screen_type === 'QUIZ' ? '#ea580c' : '#475569',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}>
                                  {scr.screen_type}
                                </span>
                                <span>⏱️ {scr.estimated_duration || 60}s</span>
                                <span>•</span>
                                <span>🧱 {elementsCount} Blocks</span>
                              </div>
                            </div>
                          </div>

                          {/* Right section: Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className="cs-icon-btn" disabled={idx === 0} onClick={() => handleMoveScreen(idx, -1)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 6px', fontSize: '0.75rem', fontWeight: 700 }} title="Move Up">↑</button>
                              <button className="cs-icon-btn" disabled={idx === screens.length - 1} onClick={() => handleMoveScreen(idx, 1)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 6px', fontSize: '0.75rem', fontWeight: 700 }} title="Move Down">↓</button>
                              <button
                                className="cs-icon-btn"
                                onClick={() => {
                                  triggerPrompt(
                                    "Enter new title for this screen:",
                                    "Rename Screen",
                                    scr.title,
                                    "Screen Title",
                                    async (newTitle) => {
                                      if (!newTitle || !newTitle.trim() || newTitle.trim() === scr.title) return;
                                      try {
                                        const res = await apiFetch(`/api/v1/content/screens/${scr.id}/`, {
                                          method: 'PATCH',
                                          body: JSON.stringify({ title: newTitle.trim() })
                                        });
                                        if (res.ok) {
                                          showFeedback('Screen renamed');
                                          loadActivityDetail(selectedActivity.id, false);
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }
                                  );
                                }}
                                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 6px' }}
                                title="Rename"
                              >
                                <FiEdit2 style={{ color: '#475569', fontSize: '0.75rem' }} />
                              </button>
                              <button
                                className="cs-icon-btn"
                                onClick={() => handleDeleteScreen(scr.id)}
                                style={{ background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '6px', padding: '4px 6px' }}
                                title="Delete"
                              >
                                <FiTrash2 style={{ color: '#ef4444', fontSize: '0.75rem' }} />
                              </button>
                            </div>

                            <button
                              onClick={() => loadScreenDetail(scr)}
                              style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#166534',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.4rem 0.85rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#dcfce7';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#f0fdf4';
                              }}
                            >
                              Edit Layout →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        )}

          {/* ───────────────── VIEW 6: RUNTIME PREVIEW (Image 1 of remaining) ───────────────── */}
          {view === 'preview' && (() => {
            const activeActivity = previewPayload?.activities?.[previewActivityIndex];
            const activeScreen = activeActivity?.screens?.[previewScreenIndex];
            const totalScreens = activeActivity?.screens?.length || 1;

            return (
              <>
                {/* Top Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Experience Library &nbsp;&gt;&nbsp; {previewPayload?.experience?.title || selectedExperience?.title || 'Experiences'} &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Runtime Simulator Preview</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Runtime Preview Simulator</h1>
                      <span className="cs-badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Student App Mode</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      className="cs-btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: '#374151' }}
                      onClick={() => {
                        setPreviewActivityIndex(0);
                        setPreviewScreenIndex(0);
                        setPreviewAnswerIndex(null);
                      }}
                    >
                      ↺ Restart Experience
                    </button>
                    <button
                      className="cs-btn-primary"
                      style={{ background: 'linear-gradient(135deg, #0b57d0, #1d4ed8)', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(11,87,208,0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => setView('experience-builder')}
                    >
                      <FiX style={{ fontSize: '1rem' }} /> Exit Simulator
                    </button>
                  </div>
                </div>

                {/* Main Preview layout - side outline + center workspace */}
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem' }}>

                  {/* Left Side: Experience outline navigation */}
                  <div className="cs-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
                    <div>
                      <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>Experience Outline</h3>
                      <p style={{ fontSize: '0.65rem', color: '#64748b', margin: 0 }}>Click to jump directly to any screen</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {previewPayload?.activities && previewPayload.activities.map((act, actIdx) => (
                        <div key={act.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', borderLeft: previewActivityIndex === actIdx ? '3px solid #0b57d0' : '3px solid transparent' }}>
                            {actIdx + 1}. {act.title}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '0.5rem' }}>
                            {act.screens && act.screens.map((scr, scrIdx) => {
                              const isActive = previewActivityIndex === actIdx && previewScreenIndex === scrIdx;
                              return (
                                <button
                                  key={scr.id}
                                  onClick={() => {
                                    setPreviewActivityIndex(actIdx);
                                    setPreviewScreenIndex(scrIdx);
                                    setPreviewAnswerIndex(null);
                                  }}
                                  style={{
                                    border: 'none',
                                    background: isActive ? '#f0f9ff' : 'none',
                                    color: isActive ? '#0b57d0' : '#64748b',
                                    fontSize: '0.68rem',
                                    fontWeight: isActive ? 700 : 500,
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    width: '100%',
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  • {scr.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress tracking information */}
                    <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Current Activity:</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{previewActivityIndex + 1} of {previewPayload?.activities?.length || 1}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Screen Progress:</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{previewScreenIndex + 1} of {totalScreens}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Center Simulator Canvas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                    {/* Device Simulator Shell frame wrapper */}
                    <div style={{ width: '100%', background: '#ffffff', borderRadius: '16px', border: '6px solid #1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '480px', position: 'relative' }}>

                      {/* Device top status bar */}
                      <div style={{ height: '28px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.25rem', color: '#94a3b8', fontSize: '0.65rem' }}>
                        <span>⚡ EnglishLab Desktop Application Simulator (Runtime v2.1)</span>
                        <span>📶 5G &nbsp;•&nbsp; 100% 🔋</span>
                      </div>

                      {/* Content Preview Canvas body */}
                      <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', background: '#ffffff', fontFamily: activeScreen?.content?.font || 'Poppins' }}>
                        <style>{`
                          @keyframes pulse {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.08); }
                            100% { transform: scale(1); }
                          }
                          @keyframes bounceWave {
                            0% { height: 4px; }
                            100% { height: 20px; }
                          }
                        `}</style>

                        {(!activeScreen?.elements || activeScreen.elements.length === 0) ? (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #cbd5e1', borderRadius: '12px', color: '#94a3b8', fontSize: '0.78rem', minHeight: '120px' }}>
                            This screen has no content elements configured.
                          </div>
                        ) : (
                          activeScreen.elements.map((block) => {
                            return (
                              <div key={block.id} style={{ width: '100%', marginBottom: '0.25rem' }}>
                                {/* HEADING BLOCK */}
                                {block.type === 'heading' && (
                                  <div style={{ textAlign: (block.styles?.alignment || 'Center').toLowerCase(), marginBottom: '0.5rem' }}>
                                    <span style={{
                                      fontFamily: block.styles?.fontFamily || 'Poppins',
                                      fontSize: `${(parseInt(block.styles?.fontSize) || 36) * 0.72}px`,
                                      fontWeight: block.styles?.fontWeight === 'Bold' ? 800 : block.styles?.fontWeight === 'SemiBold' ? 600 : 400,
                                      color: block.styles?.color || '#1e293b',
                                      lineHeight: 1.25,
                                      display: 'inline-block'
                                    }}>
                                      {block.content?.text || ''}
                                    </span>
                                  </div>
                                )}

                                {/* TEXT BLOCK */}
                                {block.type === 'text' && (
                                  <div style={{
                                    textAlign: (block.styles?.alignment || 'Left').toLowerCase(),
                                    fontFamily: block.styles?.fontFamily || 'Poppins',
                                    fontSize: block.styles?.fontSize || '15px',
                                    fontWeight: block.styles?.fontWeight === 'Bold' ? 700 : block.styles?.fontWeight === 'SemiBold' ? 600 : 400,
                                    color: block.styles?.color || '#334155',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                    marginBottom: '0.5rem'
                                  }}>
                                    {block.content?.text || ''}
                                  </div>
                                )}

                                {/* IMAGE BLOCK */}
                                {block.type === 'image' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {block.content?.url ? (
                                      <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img
                                          src={resolveMediaUrl(block.content.url)}
                                          alt="Visual presentation"
                                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        />
                                      </div>
                                    ) : (
                                      <div style={{ width: '100%', height: '120px', border: '1.5px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        <FiImage style={{ fontSize: '2rem', marginBottom: '4px', opacity: 0.6 }} />
                                        <span style={{ fontSize: '0.72rem' }}>No image asset configured.</span>
                                      </div>
                                    )}
                                    {block.content?.caption && (
                                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>{block.content.caption}</span>
                                    )}
                                  </div>
                                )}

                                {/* AUDIO BLOCK */}
                                {block.type === 'audio' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.5rem 0' }}>
                                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '1.25rem 1.5rem', width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(2,132,199,0.06)' }}>
                                      <FiVolume2 style={{ fontSize: '2rem', color: '#0284c7' }} />
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369a1' }}>{block.content?.title || 'Listening Clip'}</div>
                                      </div>
                                      {block.content?.url ? (
                                        <audio src={resolveMediaUrl(block.content.url)} controls style={{ width: '100%' }} />
                                      ) : (
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic' }}>Instruction voiceover is missing.</div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* VIDEO BLOCK */}
                                {block.type === 'video' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    {block.content?.url ? (
                                      <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#000000' }}>
                                        <video src={resolveMediaUrl(block.content.url)} controls style={{ width: '100%', height: '220px', display: 'block' }} />
                                      </div>
                                    ) : (
                                      <div style={{ width: '100%', height: '120px', border: '1.5px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        <FiMonitor style={{ fontSize: '2rem', marginBottom: '4px', opacity: 0.6 }} />
                                        <span style={{ fontSize: '0.72rem' }}>No video asset configured.</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* DIALOGUE BLOCK */}
                                {block.type === 'dialogue' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.5rem 0' }}>
                                    {(block.content?.steps || []).map((st, i) => {
                                      const isLeft = st.side !== 'right';
                                      return (
                                        <div
                                          key={i}
                                          style={{
                                            display: 'flex',
                                            justifyContent: isLeft ? 'flex-start' : 'flex-end',
                                            alignItems: 'flex-start',
                                            gap: '0.65rem',
                                            flexDirection: isLeft ? 'row' : 'row-reverse'
                                          }}
                                        >
                                          <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: st.avatarColor || '#0ea5e9',
                                            color: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            flexShrink: 0
                                          }}>{st.name ? st.name.charAt(0).toUpperCase() : '?'}</div>
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isLeft ? 'flex-start' : 'flex-end' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginBottom: '2px', padding: '0 4px' }}>{st.name}</span>
                                            <div style={{
                                              background: isLeft ? '#f1f5f9' : '#0b57d0',
                                              color: isLeft ? '#1e293b' : '#ffffff',
                                              padding: '0.65rem 0.95rem',
                                              borderRadius: isLeft ? '0 12px 12px 12px' : '12px 0 12px 12px',
                                              fontSize: '0.82rem',
                                              lineHeight: 1.45,
                                              maxWidth: '340px',
                                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                              border: isLeft ? '1px solid #e2e8f0' : 'none'
                                            }}>{st.text}</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* QUIZ MULTIPLE CHOICE BLOCK */}
                                {block.type === 'quiz' && (() => {
                                  const blockAnswerKey = `${activeScreen.id}_${block.id}`;
                                  const selectedAnsIndex = previewAnswers[blockAnswerKey];
                                  const hasSelected = selectedAnsIndex !== undefined;

                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
                                      <div style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: '10px', padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 700, color: '#c2410c', boxShadow: '0 2px 4px rgba(249,115,22,0.04)' }}>
                                        ❓ {block.content?.question || 'Quiz question text label...'}
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                        {(block.content?.options || ['', '', '', '']).map((opt, oIdx) => {
                                          const isCorrectAnswer = parseInt(block.content?.correctAnswerIndex) === oIdx;
                                          const isSelected = selectedAnsIndex === oIdx;

                                          let borderCol = '#cbd5e1';
                                          let bgCol = '#ffffff';
                                          let textCol = '#1e293b';

                                          if (hasSelected) {
                                            if (isCorrectAnswer) {
                                              borderCol = '#16a34a';
                                              bgCol = '#ecfdf5';
                                              textCol = '#15803d';
                                            } else if (isSelected) {
                                              borderCol = '#ef4444';
                                              bgCol = '#fef2f2';
                                              textCol = '#b91c1c';
                                            }
                                          }

                                          return (
                                            <div
                                              key={oIdx}
                                              onClick={() => {
                                                if (!hasSelected) {
                                                  setPreviewAnswers(prev => ({
                                                    ...prev,
                                                    [blockAnswerKey]: oIdx
                                                  }));
                                                }
                                              }}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.85rem',
                                                background: bgCol,
                                                border: `2px solid ${borderCol}`,
                                                borderRadius: '10px',
                                                padding: '0.85rem 1.1rem',
                                                fontSize: '0.82rem',
                                                cursor: hasSelected ? 'default' : 'pointer',
                                                transition: 'all 0.15s',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                              }}
                                            >
                                              <span style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: '1.5px solid #cbd5e1',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.72rem',
                                                fontWeight: 'bold',
                                                background: isSelected || (hasSelected && isCorrectAnswer) ? borderCol : 'none',
                                                color: isSelected || (hasSelected && isCorrectAnswer) ? '#ffffff' : '#64748b',
                                                borderColor: borderCol
                                              }}>
                                                {String.fromCharCode(65 + oIdx)}
                                              </span>
                                              <span style={{ fontWeight: 600, color: textCol }}>{opt || `Quiz Option ${oIdx + 1}`}</span>

                                              {hasSelected && isCorrectAnswer && (
                                                <span style={{ marginLeft: 'auto', color: '#16a34a', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                  ✓ Correct Choice
                                                </span>
                                              )}
                                              {hasSelected && isSelected && !isCorrectAnswer && (
                                                <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: '0.72rem', fontWeight: 'bold' }}>
                                                  ✗ Incorrect Choice
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {hasSelected && (
                                        <button
                                          onClick={() => {
                                            setPreviewAnswers(prev => {
                                              const updated = { ...prev };
                                              delete updated[blockAnswerKey];
                                              return updated;
                                            });
                                          }}
                                          style={{ alignSelf: 'flex-end', border: 'none', background: 'none', color: '#0b57d0', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                          ↺ Reset Answer Choice
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* VOICE RECORDING BLOCK */}
                                {block.type === 'voice_recorder' && (() => {
                                  const blockRecordKey = `${activeScreen.id}_${block.id}`;
                                  const isRecording = voiceRecordingStates[blockRecordKey];

                                  return (
                                    <div style={{ border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 12px rgba(217,119,6,0.05)', margin: '0.5rem 0' }}>
                                      <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        background: isRecording ? '#ef4444' : '#d97706',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.2)' : '0 2px 8px rgba(217,119,6,0.2)',
                                        animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                                        transition: 'all 0.2s'
                                      }} onClick={() => {
                                        setVoiceRecordingStates(prev => ({
                                          ...prev,
                                          [blockRecordKey]: !isRecording
                                        }));
                                      }}>
                                        <FiMic />
                                      </div>

                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#b45309' }}>
                                          {isRecording ? 'Recording audio response...' : 'Microphone Speaking Practice'}
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px', maxWidth: '320px' }}>
                                          {block.content?.prompt || 'Record your response now.'}
                                        </p>
                                      </div>

                                      {isRecording && (
                                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '20px' }}>
                                          {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                                            <span
                                              key={i}
                                              style={{
                                                width: '3px',
                                                height: `${h * 4}px`,
                                                background: '#ef4444',
                                                borderRadius: '3px',
                                                animation: `bounceWave 0.6s infinite alternate ${i * 0.08}s`
                                              }}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* DRAG & DROP BLOCK */}
                                {block.type === 'drag_drop' && (() => {
                                  const list = block.content?.pairs || [];
                                  const question = block.content?.question || 'Match items by dragging';
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe', marginTop: '0.5rem' }}>
                                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af' }}>
                                        🔀 {question}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {list.map((pair, pIdx) => {
                                          const selected = dragDropSelections[`${block.id}_${pair.id || pIdx}`] || '';
                                          return (
                                            <div key={pair.id || pIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.72rem' }}>
                                              <span style={{ fontWeight: 600, color: '#1e293b' }}>{pair.source || pair.left}</span>
                                              <select
                                                value={selected}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setDragDropSelections(prev => ({
                                                    ...prev,
                                                    [`${block.id}_${pair.id || pIdx}`]: val
                                                  }));
                                                }}
                                                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.7rem', color: '#1e293b', outline: 'none' }}
                                              >
                                                <option value="">Select match...</option>
                                                {list.map((p, idx) => (
                                                  <option key={idx} value={p.target || p.right}>{p.target || p.right}</option>
                                                ))}
                                              </select>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* FILL IN BLANKS BLOCK */}
                                {(['fill_blank', 'fill_blanks'].includes(block.type)) && (() => {
                                  const text = block.content?.text || 'Type the blanks [blank1]';
                                  const question = block.content?.question || 'Fill in the missing words';
                                  const parts = text.split(/(\[.*?\])/g);
                                  
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f0fdfa', padding: '1rem', borderRadius: '12px', border: '1px solid #ccfbf1', marginTop: '0.5rem' }}>
                                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f766e' }}>
                                        ✏️ {question}
                                      </div>
                                      <div style={{ fontSize: '0.78rem', lineHeight: 1.8, color: '#1e293b', background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccfbf1' }}>
                                        {parts.map((part, pIdx) => {
                                          if (part.startsWith('[') && part.endsWith(']')) {
                                            const key = `${block.id}-${pIdx}`;
                                            const ans = blankAnswers[key] || '';
                                            return (
                                              <input
                                                key={pIdx}
                                                type="text"
                                                value={ans}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setBlankAnswers(prev => ({
                                                    ...prev,
                                                    [key]: val
                                                  }));
                                                }}
                                                placeholder="..."
                                                style={{ width: '80px', borderBottom: '2px solid #0d9488', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'center', fontWeight: 700, color: '#0f766e', outline: 'none', padding: '0 4px', margin: '0 4px', fontSize: '0.75rem' }}
                                              />
                                            );
                                          }
                                          return <span key={pIdx}>{part}</span>;
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* MATCH ITEMS BLOCK */}
                                {block.type === 'match_items' && (() => {
                                  const pairs = block.content?.pairs || [];
                                  const question = block.content?.question || 'Match the columns';
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fdf2f8', padding: '1rem', borderRadius: '12px', border: '1px solid #fbcfe8', marginTop: '0.5rem' }}>
                                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#9d174d' }}>
                                        🔗 {question}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {pairs.map((pair, pIdx) => {
                                          const selected = dragDropSelections[`${block.id}_${pair.id || pIdx}`] || '';
                                          return (
                                            <div key={pair.id || pIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #fbcfe8', fontSize: '0.72rem' }}>
                                              <span style={{ fontWeight: 600, color: '#9d174d' }}>{pair.left}</span>
                                              <select
                                                value={selected}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setDragDropSelections(prev => ({
                                                    ...prev,
                                                    [`${block.id}_${pair.id || pIdx}`]: val
                                                  }));
                                                }}
                                                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #fbcfe8', fontSize: '0.7rem', color: '#9d174d', outline: 'none' }}
                                              >
                                                <option value="">Select match...</option>
                                                {pairs.map((p, idx) => (
                                                  <option key={idx} value={p.right}>{p.right}</option>
                                                ))}
                                              </select>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* SEQUENCE BLOCK */}
                                {block.type === 'sequence' && (() => {
                                  const items = block.content?.items || [];
                                  const question = block.content?.question || 'Sort items in correct sequence';
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a', marginTop: '0.5rem' }}>
                                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>
                                        🔢 {question}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {items.map((item, idx) => (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.55rem 0.75rem', borderRadius: '8px', fontSize: '0.72rem', color: '#1e293b' }}>
                                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.68rem' }}>
                                              {idx + 1}
                                            </span>
                                            <span>{item}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* FLASHCARD BLOCK */}
                                {block.type === 'flashcard' && (() => {
                                  const cards = block.content?.cards || [];
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#be185d', textAlign: 'center' }}>🗂️ Interactive Flashcards</div>
                                      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', width: '100%' }}>
                                        {cards.map((card, cIdx) => {
                                          const isFlipped = flippedCards[`${block.id}-${cIdx}`];
                                          return (
                                            <div
                                              key={card.id || cIdx}
                                              onClick={() => {
                                                setFlippedCards(prev => ({
                                                  ...prev,
                                                  [`${block.id}-${cIdx}`]: !prev[`${block.id}-${cIdx}`]
                                                }));
                                              }}
                                              style={{
                                                flexShrink: 0,
                                                width: '130px',
                                                height: '90px',
                                                background: isFlipped ? '#fdf2f8' : '#ffffff',
                                                border: isFlipped ? '2px solid #ec4899' : '1px solid #cbd5e1',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0.5rem',
                                                textAlign: 'center',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                                transition: 'all 0.2s'
                                              }}
                                            >
                                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isFlipped ? '#be185d' : '#1e293b' }}>
                                                {isFlipped ? card.back : card.front}
                                              </span>
                                              <span style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '8px' }}>
                                                {isFlipped ? 'Show front' : 'Click to flip'}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* SENTENCE BUILDER BLOCK */}
                                {block.type === 'sentence_builder' && (() => {
                                  const question = block.content?.question || 'Reorder the words to make a correct sentence.';
                                  const words = block.content?.words || [];
                                  const selection = dragDropSelections[block.id] || [];
                                  
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ecfeff', padding: '1rem', borderRadius: '12px', border: '1px solid #a5f3fc', marginTop: '0.5rem' }}>
                                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0891b2' }}>
                                        🧩 {question}
                                      </div>
                                      
                                      <div style={{ minHeight: '38px', padding: '0.5rem', background: '#ffffff', borderRadius: '8px', border: '1.5px dashed #06b6d4', display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
                                        {selection.length === 0 ? (
                                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Click words below...</span>
                                        ) : (
                                          selection.map((word, wIdx) => (
                                            <button
                                              key={wIdx}
                                              type="button"
                                              onClick={() => {
                                                setDragDropSelections(prev => ({
                                                  ...prev,
                                                  [block.id]: (prev[block.id] || []).filter((_, idx) => idx !== wIdx)
                                                }));
                                              }}
                                              style={{ background: '#06b6d4', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                              {word} ×
                                            </button>
                                          ))
                                        )}
                                      </div>

                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                        {words.map((word, wIdx) => {
                                          const isUsed = selection.includes(word);
                                          return (
                                            <button
                                              key={wIdx}
                                              type="button"
                                              disabled={isUsed}
                                              onClick={() => {
                                                setDragDropSelections(prev => ({
                                                  ...prev,
                                                  [block.id]: [...(prev[block.id] || []), word]
                                                }));
                                              }}
                                              style={{
                                                background: isUsed ? '#e2e8f0' : '#ffffff',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                padding: '3px 8px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                color: isUsed ? '#94a3b8' : '#0891b2',
                                                cursor: isUsed ? 'default' : 'pointer'
                                              }}
                                            >
                                              {word}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* WORD SEARCH / CROSSWORD BLOCK */}
                                {(['word_search', 'crossword'].includes(block.type)) && (() => {
                                  const question = block.content?.question || 'Word Search Puzzle';
                                  const grid = [
                                    ['L', 'A', 'N', 'G', 'U', 'A', 'G', 'E'],
                                    ['E', 'X', 'P', 'E', 'R', 'I', 'E', 'N'],
                                    ['A', 'C', 'T', 'I', 'V', 'I', 'T', 'Y'],
                                    ['S', 'C', 'R', 'E', 'E', 'N', 'P', 'C']
                                  ];
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#faf5ff', padding: '1rem', borderRadius: '12px', border: '1px solid #f3e8ff', marginTop: '0.5rem' }}>
                                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6b21a8' }}>
                                        🔍 {question}
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', maxWidth: '240px', margin: '0 auto', background: '#f3e8ff', padding: '4px', borderRadius: '8px' }}>
                                        {grid.flatMap((row, rIdx) => row.map((char, cIdx) => (
                                          <div
                                            key={`${rIdx}-${cIdx}`}
                                            style={{
                                              aspectRatio: '1',
                                              background: '#ffffff',
                                              borderRadius: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: '0.68rem',
                                              fontWeight: 800,
                                              color: '#6b21a8',
                                              border: '1px solid #cbd5e1',
                                              cursor: 'pointer'
                                            }}
                                            onClick={(e) => {
                                              const currBg = e.currentTarget.style.backgroundColor;
                                              e.currentTarget.style.backgroundColor = currBg === 'rgb(216, 180, 254)' ? '#ffffff' : '#d8b4fe';
                                            }}
                                          >
                                            {char}
                                          </div>
                                        )))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })
                        )}

                      </div>

                      {/* Device bottom navigation control bar */}
                      <div style={{ borderTop: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                        <button
                          className="cs-btn-outline"
                          disabled={previewScreenIndex <= 0}
                          onClick={() => {
                            setPreviewScreenIndex(prev => prev - 1);
                            setPreviewAnswerIndex(null);
                          }}
                          style={{ padding: '0.45rem 1.1rem', fontSize: '0.78rem', background: '#ffffff', cursor: 'pointer', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                          ← Previous Screen
                        </button>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                          Screen {previewScreenIndex + 1} of {totalScreens}
                        </span>
                        <button
                          className="cs-btn-outline"
                          disabled={previewScreenIndex >= totalScreens - 1}
                          onClick={() => {
                            setPreviewScreenIndex(prev => prev + 1);
                            setPreviewAnswerIndex(null);
                          }}
                          style={{ padding: '0.45rem 1.1rem', fontSize: '0.78rem', background: '#ffffff', cursor: 'pointer', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                          Next Screen →
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              </>
            );
          })()}

          {/* ───────────────── VIEW 7: MEDIA LIBRARY ───────────────── */}
          {view === 'media' && (
            <>
              {/* Layout grid for media library */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 300px', gap: '1.25rem', height: 'calc(100vh - 110px)', minHeight: 540 }}>

                {/* Column 1: Left folder list pane */}
                <div className="cs-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FOLDERS</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <button style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '0.5rem 0.65rem', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiFolder /> All Files</span>
                      <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>{mediaAssets.length}</span>
                    </button>
                  </div>

                  {/* Folders Tree hierarchy */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>- CATEGORIES</span>
                    {[
                      { name: 'Images', count: mediaAssets.filter(m => m.media_type === 'IMAGE').length },
                      { name: 'Audio', count: mediaAssets.filter(m => m.media_type === 'AUDIO').length },
                      { name: 'Videos', count: mediaAssets.filter(m => m.media_type === 'VIDEO').length }
                    ].map(fld => (
                      <div key={fld.name} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiFolder /> {fld.name}</span>
                          <span style={{ color: '#94a3b8' }}>{fld.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Storage Usage meter */}
                  <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600 }}>
                      <span style={{ color: '#64748b' }}>Storage Used</span>
                      <span>1%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: '1%', height: '100%', background: '#6366f1' }} />
                    </div>
                    <span style={{ color: '#94a3b8' }}>Realtime Cloud Enabled</span>
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
                      {/* Hidden file input – triggered by Upload button below */}
                      <input
                        type="file"
                        id="media-file-input"
                        style={{ display: 'none' }}
                        accept="image/*,audio/*,video/*,.pdf,.docx,.doc,.txt"
                        onChange={handleMediaUpload}
                      />
                      <button
                        className="cs-btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        disabled={actionLoading}
                        onClick={() => document.getElementById('media-file-input').click()}
                      >
                        <FiUpload /> {actionLoading ? 'Uploading…' : 'Upload'}
                      </button>
                    </div>
                  </div>

                  {/* Filtering / controls row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.55rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>SORT BY</span>
                      <select className="cs-filter-select" style={{ height: 26, fontSize: '0.78rem', padding: '0 0.5rem' }} defaultValue="Newest First">
                        <option>Newest First</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid layout of media files */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'max-content', gap: '0.85rem', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {mediaAssets.length === 0 ? (
                      <div style={{ gridColumn: 'span 4', fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '3rem' }}>
                        No media assets found. Click "Upload" to add some!
                      </div>
                    ) : (
                      mediaAssets.map(item => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedAsset(item)}
                          style={{
                            border: (selectedAsset?.id === item.id) ? '2px solid #6366f1' : '1px solid #e2e8f0',
                            borderRadius: 8,
                            background: '#ffffff',
                            padding: '0.65rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '145px',
                            justifyContent: 'space-between',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Thumbnail placeholder */}
                          <div style={{ height: 80, background: '#f8fafc', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '0.35rem', border: '1px solid #f1f5f9' }}>
                            {item.media_type === 'IMAGE' ? (
                              item.url ? (
                                <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : item.file ? (
                                <img src={item.file} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: '#bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1', fontSize: '1rem', fontWeight: 'bold' }}>
                                  🌅 Image
                                </div>
                              )
                            ) : item.media_type === 'AUDIO' ? (
                              <span style={{ fontSize: '1.5rem' }}>🎵</span>
                            ) : item.media_type === 'VIDEO' ? (
                              <span style={{ fontSize: '1.5rem' }}>🎬</span>
                            ) : (
                              <span style={{ fontSize: '1.5rem' }}>📄</span>
                            )}
                          </div>

                          {/* Title details */}
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, fontSize: '0.62rem', color: '#64748b' }}>
                              <span>{item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'N/A'} • {new Date(item.uploaded_at || item.upload_date || new Date()).toLocaleDateString()}</span>
                              <span style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 4, fontWeight: 700, fontSize: '7px' }}>{item.media_type}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Grid Footer pagination */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Showing {mediaAssets.length} of {mediaAssets.length} items</span>
                  </div>
                </div>

                {/* Column 3: Right selected asset preview sidebar */}
                <div className="cs-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Preview</span>
                  </div>

                  {selectedAsset ? (
                    <>
                      {/* Large preview image */}
                      <div style={{ height: 140, background: '#bae6fd', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1', border: '1px solid #e2e8f0' }}>
                        {selectedAsset.media_type === 'IMAGE' && (selectedAsset.url || selectedAsset.file) ? (
                          <img src={selectedAsset.url || selectedAsset.file} alt={selectedAsset.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: 4 }}>
                              {selectedAsset.media_type === 'AUDIO' ? '🎵' : selectedAsset.media_type === 'VIDEO' ? '🎬' : '📄'}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, maxWidth: '240px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedAsset.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Media Details */}
                      <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>MEDIA INFORMATION</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.75rem' }}>
                          {[
                            { label: 'Name', value: selectedAsset.name },
                            { label: 'Type', value: selectedAsset.media_type },
                            { label: 'Size', value: selectedAsset.file_size ? `${(selectedAsset.file_size / 1024).toFixed(1)} KB` : 'N/A' },
                            { label: 'Upload Date', value: new Date(selectedAsset.uploaded_at || selectedAsset.upload_date || new Date()).toLocaleString() }
                          ].map(inf => (
                            <div key={inf.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#64748b' }}>{inf.label}</span>
                              <span style={{ fontWeight: 600, color: '#1e293b', maxWidth: '70%', wordBreak: 'break-all', textAlign: 'right' }}>{inf.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                        <button className="cs-btn-outline" style={{ color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2', fontSize: '0.75rem', padding: '0.4rem 0', width: '100%' }} onClick={() => handleDeleteMedia(selectedAsset.id)}>
                          🗑 Delete Asset
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                      Select an asset to view preview and options.
                    </div>
                  )}
                </div>

              </div>
            </>
          )}

          {/* ───────────────── VIEW 8: PUBLISH CENTER ───────────────── */}
          {view === 'publish' && (
            <>
              {/* Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => setView('experiences')}>Experience Library</span> &nbsp;&gt;&nbsp; <span style={{ cursor: 'pointer' }} onClick={() => setView('experience-builder')}>{selectedExperience?.title || 'Experience'}</span> &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Publish Center</span>
                  </div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
                    Publish Center
                    {validationReport ? (
                      <span
                        style={{
                          background: validationReport.status === 'FAILED' ? '#fee2e2' : '#dcfce7',
                          color: validationReport.status === 'FAILED' ? '#b91c1c' : '#15803d',
                          fontSize: '10px',
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontWeight: 700
                        }}
                      >
                        {validationReport.status === 'FAILED' ? '✗ Validation Failed' : '✓ Validation Passed'}
                      </span>
                    ) : (
                      <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '10px', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>
                        Running validation...
                      </span>
                    )}
                  </h1>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Verify layout structure, media files, and compile final package version distribution.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.55rem' }}>
                  <button className="cs-btn-outline" onClick={() => setView('experiences')}>Back to Library</button>
                </div>
              </div>

              {/* Main 2-Column Dashboard Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                {/* LEFT COLUMN: Compile Form & Build History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Card 1: Experience Build & Compiler Form */}
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 1rem 0', color: '#0f172a' }}>
                      Generate New EnglishLab Package (.elab)
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 84, height: 64, background: '#f1f5f9', borderRadius: 6, flexShrink: 0, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: '1.25rem' }}>
                        {selectedExperience?.thumbnail ? (
                          <img
                            src={selectedExperience.thumbnail.startsWith('http') ? selectedExperience.thumbnail : `${API_BASE_URL}${selectedExperience.thumbnail}`}
                            alt={selectedExperience?.title || 'Experience'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <FiDownload />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px 0', color: '#1e293b' }}>
                          {selectedExperience?.title || 'Experience'}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                          {selectedExperience?.description || 'No description provided.'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.72rem', color: '#475569' }}>
                          <span>Target: <strong>{gradesList.find(g => String(g.id) === String(selectedExperience?.grade_id || selectedExperience?.grade))?.grade_name || 'Grade 4'}</strong></span>
                          <span>Activities: <strong>{activities.length}</strong></span>
                          <span>Screens: <strong>{activities.reduce((acc, act) => acc + (act.screens?.length || 0), 0)}</strong></span>
                          <span>Media: <strong>{mediaAssets.length}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label" style={{ fontSize: '0.75rem' }}>Version Number <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          className="cs-form-input"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                          type="text"
                          placeholder="e.g. 1.0.0"
                          value={publishVersion}
                          onChange={e => setPublishVersion(e.target.value)}
                        />
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label" style={{ fontSize: '0.75rem' }}>Release Notes <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          className="cs-form-input"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                          type="text"
                          placeholder="Describe build updates..."
                          value={publishNotes}
                          onChange={e => setPublishNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="cs-btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #4f46e5, #3730a3)',
                          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                          padding: '0.6rem 1.5rem',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          borderRadius: '10px'
                        }}
                        onClick={handlePublishExperience}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Compiling Build...' : 'Build & Publish .elab Package'}
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Published Packages Build Table */}
                  <div className="cs-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Published Build History</h3>
                      {publishHistory.length > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{publishHistory.length} build{publishHistory.length !== 1 ? 's' : ''} total</span>
                      )}
                    </div>
                    <div className="cs-table-wrap">
                      <table className="cs-table">
                        <thead>
                          <tr>
                            <th>VERSION</th>
                            <th>BUILD #</th>
                            <th>PACKAGE FILE</th>
                            <th>SIZE</th>
                            <th>PUBLISHED ON</th>
                            <th>STATUS</th>
                            <th>DOWNLOAD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {publishHistory.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem', fontSize: '0.82rem' }}>
                                No builds published yet. Specify a version above to compile.
                              </td>
                            </tr>
                          ) : (
                            publishHistory.map((pkg, idx) => {
                              const elabFilename = `${selectedExperience?.title?.replace(/\s+/g, '_') || 'Experience'}_v${pkg.version_number || '1.0.0'}.elab`;
                              const isLatest = idx === 0;
                              return (
                                <tr key={pkg.id}>
                                  <td style={{ fontWeight: 700, color: '#0284c7' }}>v{pkg.version_number || '—'}</td>
                                  <td style={{ fontWeight: 700 }}>#{pkg.build_number || (1000 + idx)}</td>
                                  <td style={{ color: '#475569', fontSize: '0.72rem', fontFamily: 'monospace' }}>{elabFilename}</td>
                                  <td>{pkg.package_size ? formatBytes(pkg.package_size) : '—'}</td>
                                  <td style={{ whiteSpace: 'nowrap' }}>{pkg.published_at ? new Date(pkg.published_at).toLocaleString() : '—'}</td>
                                  <td>
                                    <span className={`cs-badge ${isLatest ? 'cs-badge-published' : ''}`}
                                      style={isLatest ? {} : { background: '#f1f5f9', color: '#64748b' }}>
                                      {isLatest ? 'Latest' : `Build ${pkg.build_number}`}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <button
                                        title="Download .elab package"
                                        onClick={() => handleDownloadPackageElab(pkg.id, elabFilename)}
                                        style={{
                                          background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                                          borderRadius: 5, padding: '3px 7px', fontSize: '0.68rem',
                                          fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                                        }}
                                      >
                                        ⬇ .elab
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Assign, Validation & Reports */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Card 5: Assign Experience to School/Grade */}
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0', color: '#0f172a' }}>
                      Assign Experience to Tenant School
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>Select School <span style={{ color: '#ef4444' }}>*</span></label>
                        <select
                          value={targetSchoolId}
                          onChange={e => setTargetSchoolId(e.target.value)}
                          style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', padding: '0 0.5rem', background: '#fff' }}
                        >
                          <option value="">-- Choose School --</option>
                          {assignSchools.map(s => (
                            <option key={s.school_id} value={s.school_id}>{s.school_name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleAssignExperience}
                        disabled={actionLoading}
                        style={{
                          width: '100%',
                          height: '36px',
                          borderRadius: '8px',
                          background: '#4f46e5',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        {actionLoading ? 'Assigning...' : 'Assign Experience'}
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Validation Check Report */}
                  <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0', color: '#0f172a' }}>
                      Experience Validation Status
                    </h3>

                    {validationReport ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem', flex: 1, minHeight: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>OVERALL CHECK</span>
                          <span className={`cs-badge`}
                            style={{
                              background: validationReport.status === 'FAILED' ? '#fee2e2' : (validationReport.status === 'PASSED' ? '#dcfce7' : '#fef3c7'),
                              color: validationReport.status === 'FAILED' ? '#991b1b' : (validationReport.status === 'PASSED' ? '#166534' : '#92400e'),
                              fontWeight: 700,
                              fontSize: '9px'
                            }}>
                            {validationReport.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', textAlign: 'center', background: '#f8fafc', padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '1rem' }}>{validationReport.passed}</div>
                            <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700 }}>PASSED</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#d97706', fontSize: '1rem' }}>{validationReport.warnings}</div>
                            <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700 }}>WARNINGS</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1rem' }}>{validationReport.errors}</div>
                            <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700 }}>ERRORS</div>
                          </div>
                        </div>

                        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '140px', paddingRight: '4px' }}>
                          {validationReport.results && validationReport.results.filter(r => r.severity !== 'PASSED').length === 0 ? (
                            <div style={{ color: '#16a34a', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', fontWeight: 600, padding: '1rem 0', justifyContent: 'center', textAlign: 'center' }}>
                              <span style={{ fontSize: '1.5rem' }}>✓</span>
                              <span style={{ fontSize: '0.75rem' }}>Ready for compilation & distribution!</span>
                            </div>
                          ) : (
                            validationReport.results && validationReport.results.filter(r => r.severity !== 'PASSED').map((res, i) => (
                              <div key={i} style={{
                                padding: '6px 8px',
                                borderRadius: 6,
                                background: res.severity === 'ERROR' ? '#fef2f2' : '#fffbeb',
                                color: res.severity === 'ERROR' ? '#991b1b' : '#92400e',
                                borderLeft: `3px solid ${res.severity === 'ERROR' ? '#ef4444' : '#f59e0b'}`,
                                fontSize: '0.7rem',
                                lineHeight: '1.3'
                              }}>
                                <span style={{ fontWeight: 800 }}>{res.severity === 'ERROR' ? '🚨 ERROR: ' : '⚠️ WARNING: '}</span>
                                {res.message}
                              </div>
                            ))
                          )}
                        </div>

                        {assignHistory.length > 0 && (
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', margin: '0 0 0.5rem 0' }}>Current Assignments</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '90px', overflowY: 'auto' }}>
                              {assignHistory.map(a => (
                                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.7rem' }}>
                                  <span style={{ fontWeight: 600 }}>{a.school__school_name}</span>
                                  <span style={{ color: '#64748b' }}>{a.grade__grade_name || 'All Grades'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', fontSize: '0.75rem' }}>
                        Running validation check...
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ── View 10: Sync Reports & Analytics ── */}
          {view === 'reports' && (
            <div style={{ padding: '0.5rem', width: '100%', margin: '0 auto' }}>
              <ReportsAnalytics />
            </div>
          )}

          {/* ── View 9: Profile Settings ── */}
          {view === 'profile' && (
            <div style={{ padding: '0.5rem', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
              <div className="sd-page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="sd-page-title" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Profile Settings</h1>
                <p className="sd-page-sub" style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>Manage your personal details and authentication options</p>
              </div>

              {feedbackMsg.text && (
                <div style={{
                  padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem',
                  fontSize: '0.85rem', fontWeight: 600,
                  background: feedbackMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  color: feedbackMsg.type === 'error' ? '#ef4444' : '#15803d',
                  border: feedbackMsg.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>{feedbackMsg.type === 'error' ? '⚠️' : '✅'}</span>
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

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
                        {currentUserState?.profile_picture ? (
                          <img src={resolveMediaUrl(currentUserState.profile_picture)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#0b75b3', color: '#fff', fontWeight: 800, fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(currentUserState?.username || 'CC').slice(0, 2).toUpperCase()}
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
                    
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '1rem 0 0.25rem 0' }}>
                      {profileForm.full_name || currentUserState?.username || 'Content Creator'}
                    </h3>
                    
                    <div style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }}></span>
                      <span>Content Creator</span>
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
                        <input className="sd-form-input" type="text" value={currentUserState?.username || 'content_creator'} disabled
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

          {/* ── Change Password Modal ── */}
          {showPwModal && (
            <div className="sd-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowPwModal(false); }}>
              <div className="sd-modal" style={{ maxWidth: 420 }}>
                <div className="sd-modal-header">
                  <span className="sd-modal-title">Change Password</span>
                  <button className="sd-modal-close" onClick={() => setShowPwModal(false)}><FiX /></button>
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
                      showFeedback('Password changed successfully!');
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
                      placeholder="Enter current password" required />
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">New Password</label>
                    <input className="sd-form-input" type="password"
                      value={pwForm.new_password}
                      onChange={e => { setPwForm({ ...pwForm, new_password: e.target.value }); setPwModalError(''); }}
                      placeholder="Minimum 6 characters" required minLength={6} />
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Confirm Password</label>
                    <input className="sd-form-input" type="password"
                      value={pwForm.confirm_password}
                      onChange={e => { setPwForm({ ...pwForm, confirm_password: e.target.value }); setPwModalError(''); }}
                      placeholder="Confirm new password" required minLength={6} />
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
              onClick={() => setDeleteConfirm({ show: false, id: null, type: '', title: '', message: '', isConflict: false, usages: [] })}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: deleteConfirm.isConflict ? '420px' : '360px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.75rem 1.5rem',
                  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
                  textAlign: 'center'
                }}
                onClick={e => e.stopPropagation()}
              >
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

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  {deleteConfirm.title}
                </h3>

                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: deleteConfirm.isConflict ? '1rem' : '1.5rem', lineHeight: 1.5 }}>
                  {deleteConfirm.message}
                </p>

                {deleteConfirm.isConflict && deleteConfirm.usages.length > 0 && (
                  <div style={{ textAlign: 'left', marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>ASSET IN USE BY:</div>
                    <div style={{ maxHeight: 100, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {deleteConfirm.usages.map((use, idx) => (
                        <div key={idx} style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          • <strong>{use.experience_title}</strong> &gt; {use.activity_title} &gt; {use.screen_title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                    onClick={() => setDeleteConfirm({ show: false, id: null, type: '', title: '', message: '', isConflict: false, usages: [] })}
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
                    onClick={executeDeleteAction}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Deleting...' : (deleteConfirm.isConflict ? 'Force Delete' : 'Delete')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Custom Alert Modal ── */}
          {customAlert.show && (
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
              onClick={() => setCustomAlert({ ...customAlert, show: false })}
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
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: customAlert.type === 'error' ? '#fee2e2' : (customAlert.type === 'success' ? '#dcfce7' : '#fef3c7'),
                    color: customAlert.type === 'error' ? '#ef4444' : (customAlert.type === 'success' ? '#22c55e' : '#f59e0b'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    fontSize: '1.5rem'
                  }}
                >
                  {customAlert.type === 'error' && <FiX />}
                  {customAlert.type === 'success' && <FiCheckCircle />}
                  {customAlert.type === 'info' && <FiInfo />}
                  {customAlert.type === 'warning' && <FiAlertTriangle />}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  {customAlert.title}
                </h3>

                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  {customAlert.message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '0.65rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: customAlert.type === 'error' ? '#ef4444' : (customAlert.type === 'success' ? '#22c55e' : '#f59e0b'),
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => setCustomAlert({ ...customAlert, show: false })}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Custom Prompt Modal ── */}
          {customPrompt.show && (
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
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.75rem 1.5rem',
                  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
                  textAlign: 'left'
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', textAlign: 'center' }}>
                  {customPrompt.title}
                </h3>
                {customPrompt.message && (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5, textAlign: 'center' }}>
                    {customPrompt.message}
                  </p>
                )}
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      height: '38px',
                      fontSize: '0.88rem',
                      padding: '0 0.75rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    value={customPrompt.value}
                    onChange={e => setCustomPrompt(prev => ({ ...prev, value: e.target.value }))}
                    placeholder={customPrompt.placeholder || 'Enter value...'}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        customPrompt.onConfirm && customPrompt.onConfirm(customPrompt.value);
                        setCustomPrompt(prev => ({ ...prev, show: false }));
                      }
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                    onClick={() => setCustomPrompt(prev => ({ ...prev, show: false }))}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '0.65rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: '#0b57d0',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                    onClick={() => {
                      customPrompt.onConfirm && customPrompt.onConfirm(customPrompt.value);
                      setCustomPrompt(prev => ({ ...prev, show: false }));
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

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
                <a key={idx} href={item.action} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#334155', transition: 'background 0.15s' }}
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
    </div>
  );

};

export default ContentStudio;
