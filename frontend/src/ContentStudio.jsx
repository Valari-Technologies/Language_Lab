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
  FiUser, FiClock, FiMoreVertical, FiVolume2, FiMic, FiCopy, FiColumns
} from 'react-icons/fi';
import './Dashboard.css';
import contentCreatorHeaderBanner from './assets/3.jpeg';
import logoIcon from './assets/icon.png';

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
function ContentStudio({ user, onLogout }) {
  // Views: dashboard, experiences, experience-builder, activity-builder, screen-builder, preview, media, publish, profile
  const [view, setView] = useState('dashboard');
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);

  // Backend Integration States
  const [experiences, setExperiences] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  const [activities, setActivities] = useState([]);
  const [screens, setScreens] = useState([]);
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [outcomesText, setOutcomesText] = useState('');
  const [gradesList, setGradesList] = useState([]);
  const [recentExperiences, setRecentExperiences] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [publishStatus, setPublishStatus] = useState(null);
  const [publishHistory, setPublishHistory] = useState([]);
  const [validationReport, setValidationReport] = useState(null);

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
            return num >= 1 && num <= 10;
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

  useEffect(() => {
    loadExperiencesData();
  }, [filterGrade, filterSubject, filterDifficulty, filterStatus, filterTag]);

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
      try { localStorage.setItem('user', JSON.stringify(updatedUser)); } catch { }
      showFeedback('Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err);
      showFeedback('Failed to update profile.', 'error');
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
    subject: 'Speaking & Listening',
    language: 'English',
    difficulty: 'Medium',
    duration: 15,
    tags: []
  });

  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    objective: '',
    skills: ['Speaking', 'Listening'],
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

  const [previewScreenNum, setPreviewScreenNum] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState('B');

  const loadExperienceDetail = async (expObjOrId, changeViewToBuilder = false) => {
    const expId = typeof expObjOrId === 'object' ? expObjOrId.id : expObjOrId;
    try {
      const res = await apiFetch(`/api/v1/content/experiences/${expId}/`);
      if (res.ok) {
        const data = await res.json();
        setSelectedExperience(data);
        setExperienceForm({
          id: data.id,
          title: data.title,
          description: data.description || '',
          grade: data.grade || '',
          subject: data.subject || '',
          language: data.language || '',
          difficulty: data.difficulty || 'Medium',
          duration: data.estimated_duration || 0,
          tags: data.tags || [],
          thumbnail: data.thumbnail || ''
        });
        setActivities(data.activities || []);
        const rawOutcomes = data.learning_outcomes || [];
        setLearningOutcomes(rawOutcomes);
        // Convert to plain text for the textarea — support both {text}, {description} and raw strings
        const textStr = rawOutcomes.map(o => (typeof o === 'string' ? o : (o.text || o.description || ''))).join('\n');
        setOutcomesText(textStr);
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
        subject: experienceForm.subject || 'Speaking & Listening',
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
        setSelectedExperience(data);
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
          loadActivityDetail(selectedActivity.id);
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

  const loadActivityDetail = async (actObjOrId) => {
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
        setView('activity-builder');
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

        const activeScreens = data.screens || [];
        if (activeScreens.length === 0) {
          try {
            const screenRes = await apiFetch('/api/v1/content/screens/', {
              method: 'POST',
              body: JSON.stringify({
                activity: data.id,
                title: 'Screen 1',
                screen_type: 'INFORMATION',
                content: {
                  text: 'Welcome to this screen!',
                  title: 'Screen 1',
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
            if (screenRes.ok) {
              const newScreen = await screenRes.json();
              loadScreenDetail(newScreen);
            } else {
              setScreens([]);
              setView('activity-builder');
            }
          } catch (e) {
            console.error("Auto screen creation failed", e);
            setScreens([]);
            setView('activity-builder');
          }
        } else {
          loadScreenDetail(activeScreens[0]);
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
  };

  const handleAddBlock = (type) => {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type.toLowerCase(),
      slot: screenForm.layout === '2-column' ? (['image', 'audio', 'video'].includes(type.toLowerCase()) ? 'right' : 'left') : 'left',
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
    }

    const updatedElements = [...(screenForm.elements || []), newBlock];
    setScreenForm(prev => ({
      ...prev,
      elements: updatedElements
    }));
    setSelectedBlockId(newBlock.id);
    showFeedback(`Added ${type} block`);
  };

  const handleDropBlock = (type, slot) => {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type.toLowerCase(),
      slot: slot,
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
    }

    const updatedElements = [...(screenForm.elements || []), newBlock];
    setScreenForm(prev => ({
      ...prev,
      elements: updatedElements
    }));
    setSelectedBlockId(newBlock.id);
    showFeedback(`Added ${type} block`);
  };

  const handleDropOnSlot = (e, slot) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;

    if (data.startsWith("block:")) {
      const blockId = data.replace("block:", "");
      setScreenForm(prev => {
        const elements = (prev.elements || []).map(el => {
          if (el.id === blockId) {
            return { ...el, slot };
          }
          return el;
        });
        return { ...prev, elements };
      });
      showFeedback(`Moved block to ${slot} column`);
    } else if (data.startsWith("type:")) {
      const type = data.replace("type:", "");
      handleDropBlock(type, slot);
    } else {
      handleDropBlock(data, slot);
    }
  };

  const handleSetLayout = (layoutType, ratio = '50-50') => {
    setScreenForm(prev => {
      const elements = (prev.elements || []).map(el => {
        if (!el.slot) {
          const isMedia = ['image', 'audio', 'video'].includes(el.type);
          el.slot = isMedia ? 'right' : 'left';
        }
        return el;
      });
      return {
        ...prev,
        layout: layoutType,
        columnRatio: ratio,
        elements
      };
    });
    showFeedback(`Switched layout to ${layoutType === '2-column' ? '2-Column (' + ratio + ')' : 'Single Column'}`);
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
          handleDropOnSlot(e, block.slot || 'left');
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
          transition: 'all 0.15s',
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
          loadActivityDetail(selectedActivity.id);
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
            loadActivityDetail(selectedActivity.id);
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
    } catch (e) {
      console.error('Failed to load publish status, history or validation report', e);
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
            { key: 'profile', label: 'Profile Settings', icon: <FiUser /> },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === 'preview') {
                  handleStartPreview();
                } else {
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
            <div className="cs-profile-avatar">{(user?.username || 'CC').slice(0, 2).toUpperCase()}</div>
            <div className="cs-profile-info">
              <div className="cs-profile-name">{user?.full_name || user?.username || 'Content Creator'}</div>
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
          <div className="cs-header-actions" style={{ marginLeft: 'auto' }}>
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
                  {/* Quick Actions Card */}
                  <div className="cs-card">
                    <div className="cs-card-header" style={{ marginBottom: '1.25rem' }}>
                      <h3 className="cs-card-title">Quick Actions</h3>
                      <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>View All</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
                      {[
                        {
                          label: 'New Experience', desc: 'Create a new lesson', icon: <FiPlusCircle style={{ fontSize: '1.5rem', color: '#0284c7' }} />, bg: '#e0f2fe', action: () => {
                            setSelectedExperience(null);
                            setExperienceForm({
                              title: '',
                              description: '',
                              grade: '',
                              subject: 'Speaking & Listening',
                              language: 'English',
                              difficulty: 'Medium',
                              duration: 15,
                              tags: []
                            });
                            setView('experience-builder');
                          }
                        },
                        { label: 'Experience Library', desc: 'Manage your content', icon: <FiFolder style={{ fontSize: '1.5rem', color: '#16a34a' }} />, bg: '#dcfce7', action: () => setView('experiences') },
                        { label: 'Media Library', desc: 'Upload assets', icon: <FiImage style={{ fontSize: '1.5rem', color: '#7c3aed' }} />, bg: '#f3e8ff', action: () => setView('media') },
                        { label: 'Publish Center', desc: 'Go live with content', icon: <FiSend style={{ fontSize: '1.5rem', color: '#ea580c' }} />, bg: '#ffedd5', action: () => setView('publish') },
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

                  {/* Notifications Card */}
                  <div className="cs-card">
                    <div className="cs-card-header">
                      <h3 className="cs-card-title">Notifications</h3>
                      <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>View All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {notifications.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No new notifications.</div>
                      ) : (
                        notifications.map((notif, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '0.65rem', padding: '0.75rem', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.1rem', display: 'flex' }}><FiAlertTriangle /></div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{notif.message}</div>
                              <div style={{ fontSize: '0.68rem', opacity: 0.8, marginTop: '2px' }}>{new Date(notif.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))
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
                        setSelectedExperience(null);
                        setExperienceForm({
                          title: '',
                          description: '',
                          grade: '',
                          subject: 'Speaking & Listening',
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
              {/* Top breadcrumb navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="cs-icon-btn" onClick={() => setView('experiences')}><FiArrowLeft /></button>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Experience Library &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Experience Builder</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{experienceForm.title}</h1>
                      <button className="cs-icon-btn" style={{ fontSize: '0.85rem' }}><FiEdit2 /></button>
                      <span className="cs-badge cs-badge-draft">Draft</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      {gradesList.find(g => String(g.id) === String(experienceForm.grade))?.grade_name || `Grade ${experienceForm.grade}`} · {experienceForm.subject} · {experienceForm.difficulty} · Estimated Duration: {experienceForm.duration} min
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={async () => {
                      await handleSaveExperience();
                      setSelectedActivity(null);
                      setActivityForm({ title: '', description: '', objective: '', skills: ['Speaking', 'Listening'], duration: 5, mastery: 80 });
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
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
                            <option value="38">Grade 1</option>
                            <option value="39">Grade 2</option>
                            <option value="40">Grade 3</option>
                            <option value="41">Grade 4</option>
                            <option value="42">Grade 5</option>
                            <option value="17">Grade 6</option>
                            <option value="43">Grade 7</option>
                            <option value="44">Grade 8</option>
                            <option value="30">Grade 9</option>
                            <option value="45">Grade 10</option>
                          </>
                        )}
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
                        onChange={e => setExperienceForm({ ...experienceForm, duration: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="cs-form-group">

                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 4 }}>
                        {experienceForm.tags && experienceForm.tags.map(t => (
                          <span key={t} style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            {t} <span style={{ cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                          </span>
                        ))}
                      </div>
                    </div>
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

                  {/* Bottom status bar */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCheckCircle /> All changes saved &nbsp;•&nbsp; <span style={{ color: '#64748b' }}>Last saved: May 20, 2025 10:42 AM</span>
                    </span>
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
                  <button className="cs-icon-btn" onClick={() => setView('experience-builder')}><FiArrowLeft /></button>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Experience Library &nbsp;&gt;&nbsp; Experience Builder &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Activity Builder</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{activityForm.title}</h1>
                      <button className="cs-icon-btn" style={{ fontSize: '0.85rem' }}><FiEdit2 /></button>
                      <span className="cs-badge cs-badge-draft">Draft</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      {gradesList.find(g => String(g.id) === String(selectedExperience?.grade_id || selectedExperience?.grade))?.grade_name || 'Grade 4'} · {selectedExperience?.subject || 'Speaking & Listening'} · {selectedExperience?.difficulty || 'Medium'} · Estimated Duration: {activityForm.duration} min
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}>
                {/* Left Column: Form and Timeline Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Activity Title <span style={{ color: '#ef4444' }}>*</span></label>
                        <input className="cs-form-input" type="text" value={activityForm.title}
                          onChange={e => setActivityForm({ ...activityForm, title: e.target.value })} />
                      </div>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Skills</label>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 4 }}>
                          {activityForm.skills.map(s => (
                            <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                              {s}
                            </span>
                          ))}
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

                {/* Right Column: Screen Overview list timeline */}
                <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className="cs-card-title">Screen Overview</h3>
                      <div className="cs-card-sub">Total Screens: {screens.length} · Total Duration: {Math.ceil(screens.reduce((acc, scr) => acc + (scr.estimated_duration || 60), 0) / 60)} min</div>
                    </div>
                    <button className="cs-btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #0b57d0, #1d4ed8)', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#fff', cursor: 'pointer' }} onClick={handleAddNewScreen}>+ Add Screen</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1rem', marginTop: '0.75rem' }}>
                    {/* Timeline Line */}
                    <div style={{ position: 'absolute', left: 23, top: 10, bottom: 10, width: 2, background: '#cbd5e1', zIndex: 1 }} />

                    {screens.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', padding: '1.5rem', zIndex: 2, border: '1.5px dashed #cbd5e1', borderRadius: '8px' }}>No screens added yet. Click "+ Add Screen" to begin.</div>
                    ) : (
                      screens.map((scr, idx) => (
                        <div
                          key={scr.id}
                          onClick={() => loadScreenDetail(scr)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            position: 'relative',
                            zIndex: 2,
                            cursor: 'pointer',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 12,
                            background: selectedScreen?.id === scr.id ? '#f0f9ff' : '#ffffff',
                            border: selectedScreen?.id === scr.id ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: selectedScreen?.id === scr.id ? '#0ea5e9' : '#f1f5f9',
                            border: '1.5px solid #cbd5e1',
                            color: selectedScreen?.id === scr.id ? '#ffffff' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scr.title || 'Untitled Screen'}</span>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <button className="cs-icon-btn" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); handleMoveScreen(idx, -1); }} title="Move Up">↑</button>
                                <button className="cs-icon-btn" disabled={idx === screens.length - 1} onClick={(e) => { e.stopPropagation(); handleMoveScreen(idx, 1); }} title="Move Down">↓</button>
                                <button className="cs-icon-btn" onClick={(e) => { e.stopPropagation(); handleDeleteScreen(scr.id); }} title="Delete">
                                  <FiTrash2 style={{ color: '#ef4444', fontSize: '0.85rem' }} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                              <span className="cs-badge" style={{
                                background: scr.screen_type === 'INFORMATION' ? '#e0f2fe' :
                                  scr.screen_type === 'IMAGE' ? '#dcfce7' :
                                    scr.screen_type === 'VIDEO' ? '#f3e8ff' :
                                      scr.screen_type === 'SPEAKING' ? '#e0f9ff' :
                                        scr.screen_type === 'QUIZ' ? '#ffedd5' : '#f1f5f9',
                                color: scr.screen_type === 'INFORMATION' ? '#0369a1' :
                                  scr.screen_type === 'IMAGE' ? '#15803d' :
                                    scr.screen_type === 'VIDEO' ? '#7c3aed' :
                                      scr.screen_type === 'SPEAKING' ? '#0369a1' :
                                        scr.screen_type === 'QUIZ' ? '#c2410c' : '#475569',
                                fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600
                              }}>{scr.screen_type}</span>
                              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{(scr.estimated_duration || 60)}s</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: '0.85rem', textAlign: 'center', marginTop: '1rem', fontSize: '0.72rem', color: '#64748b' }}>
                    Use the up and down arrows (↑ / ↓) to reorder screens. The order defines the flow for learners.
                  </div>
                </div>
              </div>
            </>
          )}

          {view === 'screen-builder' && (
            <>
              {/* Top navigation header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    className="cs-icon-btn"
                    onClick={() => setView('activity-builder')}
                    style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                  >
                    <FiArrowLeft style={{ fontSize: '1rem', color: '#475569' }} />
                  </button>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      All Experiences &nbsp;&gt;&nbsp; {selectedExperience?.title || 'Experience Builder'} &nbsp;&gt;&nbsp; {selectedActivity?.title || 'Activity Builder'} &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Screen Editor</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>{screenForm.title || 'Untitled Screen'}</h1>
                      <button className="cs-icon-btn" style={{ fontSize: '0.85rem', color: '#0b57d0' }} onClick={() => {
                        triggerPrompt(
                          "Enter new screen title:",
                          "Rename Screen Title",
                          screenForm.title,
                          "Screen Title",
                          (newTitle) => {
                            if (newTitle && newTitle.trim()) setScreenForm({ ...screenForm, title: newTitle.trim() });
                          }
                        );
                      }}><FiEdit2 /></button>
                      <span className="cs-badge cs-badge-draft" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{screenForm.screen_type}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '6px', height: '6px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span> Autosaved
                  </span>
                  <button
                    className="cs-btn-outline"
                    onClick={() => {
                      handleSaveScreen(false);
                    }}
                    style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: '#374151' }}
                  >
                    Back to Activity
                  </button>

                  <button
                    onClick={() => handleSaveScreen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'linear-gradient(135deg, #0b57d0, #1d4ed8)',
                      color: '#ffffff', border: 'none', borderRadius: '10px',
                      padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.82rem',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(11,87,208,0.25)'
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* 3 Column Builder Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 310px', gap: '1.25rem', height: 'calc(100vh - 180px)', minHeight: 600 }}>

                {/* Column 1: Add Elements Palette */}
                <div className="cs-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Screen Layout</h3>
                    <p style={{ fontSize: '0.68rem', color: '#64748b', margin: 0 }}>Configure viewport column split</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                    {[
                      { key: '1-column', ratio: '100', label: 'Single Column', desc: 'Standard single-panel layout', icon: <FiFileText style={{ color: '#0284c7' }} />, bg: '#e0f2fe' },
                      { key: '2-column', ratio: '50-50', label: '2-Column Split [50/50]', desc: 'Equal split columns', icon: <FiColumns style={{ color: '#16a34a' }} />, bg: '#dcfce7' },
                      { key: '2-column', ratio: '60-40', label: '2-Column Split [60/40]', desc: '60% Left, 40% Right panels', icon: <FiColumns style={{ color: '#7c3aed' }} />, bg: '#f3e8ff' },
                    ].map(lay => {
                      const isActive = screenForm.layout === lay.key && (lay.key === '1-column' || screenForm.columnRatio === lay.ratio);
                      return (
                        <div
                          key={`${lay.key}-${lay.ratio}`}
                          onClick={() => handleSetLayout(lay.key, lay.ratio)}
                          className="cs-block-palette-item"
                          style={{
                            border: isActive ? '2px solid #0b57d0' : '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '0.65rem',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'center',
                            background: isActive ? '#f0f9ff' : '#ffffff',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ background: lay.bg, padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                            {lay.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{lay.label}</div>
                            <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '1px' }}>{lay.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Add Elements</h3>
                    <p style={{ fontSize: '0.68rem', color: '#64748b', margin: 0 }}>Append layout blocks to canvas</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {[
                      { type: 'Heading', desc: 'Main titles or section headers', icon: <FiFileText style={{ color: '#0b57d0' }} />, bg: '#e0f2fe' },
                      { type: 'Text', desc: 'Standard paragraphs of text', icon: <FiFileText style={{ color: '#64748b' }} />, bg: '#f1f5f9' },
                      { type: 'Image', desc: 'Display pictures and illustrations', icon: <FiImage style={{ color: '#16a34a' }} />, bg: '#dcfce7' },
                      { type: 'Audio', desc: 'Voice instructions or speech files', icon: <FiVolume2 style={{ color: '#0ea5e9' }} />, bg: '#e0f9ff' },
                      { type: 'Video', desc: 'Play embedded video presentations', icon: <FiMonitor style={{ color: '#7c3aed' }} />, bg: '#f3e8ff' },
                      { type: 'Dialogue', desc: 'Interactive character chat bubbles', icon: <FiActivity style={{ color: '#db2777' }} />, bg: '#fce7f3' },
                      { type: 'Quiz', desc: 'Interactive MCQ quiz question', icon: <FiCheckCircle style={{ color: '#ea580c' }} />, bg: '#ffedd5' },
                      { type: 'Voice_Recorder', desc: 'Speaking practice recording input', icon: <FiMic style={{ color: '#d97706' }} />, bg: '#fef3c7' },
                    ].map(tmpl => (
                      <div
                        key={tmpl.type}
                        onClick={() => handleAddBlock(tmpl.type)}
                        draggable={true}
                        onDragStart={e => {
                          e.dataTransfer.setData("text/plain", `type:${tmpl.type}`);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="cs-block-palette-item"
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'center',
                          background: '#ffffff',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ background: tmpl.bg, padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                          {tmpl.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>{tmpl.type.replace('_', ' ')}</div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '1px' }}>{tmpl.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>💡 Pro-Tip</span>
                    <span style={{ fontSize: '0.62rem', color: '#64748b', lineHeight: 1.4, display: 'block' }}>
                      Click on any element block inside the viewport screen to select it and configure its properties.
                    </span>
                  </div>
                </div>

                {/* Column 2: Center Canvas Screen Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
                  {/* Canvas Device Switcher Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Live Viewport Preview</span>
                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                      <button className="cs-icon-btn" style={{ fontSize: '0.95rem', color: '#0b57d0' }} title="Desktop Mode"><FiMonitor /></button>
                      <button className="cs-icon-btn" style={{ fontSize: '0.95rem', color: '#64748b' }} title="Tablet Mode"><FiTablet /></button>
                      <button className="cs-icon-btn" style={{ fontSize: '0.95rem', color: '#64748b' }} title="Mobile Mode"><FiSmartphone /></button>
                      <span style={{ fontSize: '0.72rem', color: '#cbd5e1', padding: '0 0.25rem' }}>|</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>100% Fit</span>
                    </div>
                  </div>

                  {/* Main illustrated canvas container */}
                  <div style={{ flex: 1, border: '1.5px solid #cbd5e1', background: '#f1f5f9', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center', padding: '0.5rem' }}>

                    {/* Simulated Tablet/Mobile Frame wrapper */}
                    <div style={{ width: '100%', height: '100%', background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '4px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

                      {/* Screen Top Bar */}
                      <div style={{ height: '24px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', color: '#94a3b8', fontSize: '0.6rem' }}>
                        <span>⚡ LinguaLab Player</span>
                        <span>10:42 AM</span>
                      </div>

                      {/* Canvas Screen Content Area */}
                      <div
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => handleDropOnSlot(e, 'left')}
                        style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', background: '#ffffff' }}
                      >

                        {(!screenForm.elements || screenForm.elements.length === 0) ? (
                          <div
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => handleDropOnSlot(e, 'left')}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#94a3b8', padding: '2rem', textAlign: 'center', gap: '0.5rem' }}
                          >
                            <FiPlusCircle style={{ fontSize: '2.5rem', opacity: 0.6, color: '#0b57d0' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Your Screen Canvas is Empty</span>
                            <span style={{ fontSize: '0.68rem', maxWidth: '240px' }}>Click elements in the left panel to build your screen layout.</span>
                          </div>
                        ) : screenForm.layout === '2-column' ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: screenForm.columnRatio === '60-40' ? '6fr 4fr' : '1fr 1fr',
                            gap: '1rem',
                            height: '100%',
                            overflow: 'hidden'
                          }}>
                            {/* Left Column Drop / Display Zone */}
                            <div
                              onDragOver={e => e.preventDefault()}
                              onDrop={e => handleDropOnSlot(e, 'left')}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                overflowY: 'hidden',
                                height: '100%',
                                borderRight: '1px dashed #cbd5e1',
                                paddingRight: '0.5rem'
                              }}
                            >
                              {screenForm.elements.filter(block => (block.slot || 'left') === 'left').length === 0 ? (
                                <div
                                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                  onDrop={e => handleDropOnSlot(e, 'left')}
                                  style={{ flex: 1, border: '1.5px dashed #cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.72rem', fontStyle: 'italic', background: '#f8fafc' }}
                                >
                                  Left Column Elements
                                </div>
                              ) : (
                                screenForm.elements.map((block, idx) => {
                                  if ((block.slot || 'left') !== 'left') return null;
                                  return renderCanvasBlock(block, idx);
                                })
                              )}
                            </div>

                            {/* Right Column Drop / Display Zone */}
                            <div
                              onDragOver={e => e.preventDefault()}
                              onDrop={e => handleDropOnSlot(e, 'right')}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                overflowY: 'hidden',
                                height: '100%'
                              }}
                            >
                              {screenForm.elements.filter(block => (block.slot || 'left') === 'right').length === 0 ? (
                                <div
                                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                  onDrop={e => handleDropOnSlot(e, 'right')}
                                  style={{ flex: 1, border: '1.5px dashed #cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.72rem', fontStyle: 'italic', background: '#f8fafc' }}
                                >
                                  Right Column Elements (Media)
                                </div>
                              ) : (
                                screenForm.elements.map((block, idx) => {
                                  if ((block.slot || 'left') !== 'right') return null;
                                  return renderCanvasBlock(block, idx);
                                })
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => handleDropOnSlot(e, 'left')}
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'hidden', height: '100%' }}
                          >
                            {screenForm.elements.map((block, idx) => renderCanvasBlock(block, idx))}
                          </div>
                        )}

                      </div>
                    </div>

                  </div>
                </div>

                                {/* Column 3: Right Properties Panel */}
                <div className="cs-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>

                  {/* Panel Section Head */}
                  <div>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>Configuration Properties</h3>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Edit details for the active screen mode</span>
                  </div>

                  {(() => {
                    const selectedBlock = (screenForm.elements || []).find(el => el.id === selectedBlockId);
                    if (!selectedBlock) {
                      return (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.72rem', textAlign: 'center', padding: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                          No block selected. Click any block in the canvas to configure it.
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

                        {/* Global Slot Selection for 2-column layout */}
                        {screenForm.layout === '2-column' && (
                          <div className="cs-form-group" style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: '0.25rem' }}>
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
                      </div>
                    );
                  })()}

                </div>

              </div>
            </>
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
                    Experience Library &nbsp;&gt;&nbsp; {selectedExperience?.title || 'Experience'} &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Publish Center</span>
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
                      <div style={{ width: 84, height: 64, background: '#bae6fd', borderRadius: 6, flexShrink: 0, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: '1.25rem' }}>
                        <FiDownload />
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
                                        title="Download JSON (for testing)"
                                        onClick={() => handleDownloadPackageJSON(pkg.id, elabFilename)}
                                        style={{
                                          background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                                          borderRadius: 5, padding: '3px 7px', fontSize: '0.68rem',
                                          fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                                        }}
                                      >
                                        ⬇ JSON
                                      </button>
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

                {/* RIGHT COLUMN: Validation Status & Reports */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Card 3: Validation Check Report */}
                  <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '260px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0', color: '#0f172a' }}>
                      Experience Validation Status
                    </h3>
                    
                    {validationReport ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem', flex: 1 }}>
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

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '200px', paddingRight: '4px' }}>
                          {validationReport.results && validationReport.results.filter(r => r.severity !== 'PASSED').length === 0 ? (
                            <div style={{ color: '#16a34a', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', fontWeight: 600, padding: '1.5rem 0', justifyContent: 'center', textAlign: 'center' }}>
                              <span style={{ fontSize: '1.75rem' }}>✓</span>
                              <span style={{ fontSize: '0.78rem' }}>Ready for compilation & distribution!</span>
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
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', fontSize: '0.75rem' }}>
                        Running validation check...
                      </div>
                    )}
                  </div>

                  {/* Card 4: Compiler Status / Format preview */}
                  <div className="cs-card" style={{ fontSize: '0.72rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 0.75rem 0', color: '#0f172a' }}>
                      Package Format Preview
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Format:</span>
                        <span style={{ fontWeight: 700 }}>.elab (EnglishLab ZIP Package)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Encryption:</span>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>Off (Clear Manifest)</span>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                        <div style={{ color: '#0369a1', fontWeight: 'bold' }}>📁 [Package_Archive].elab</div>
                        <div style={{ paddingLeft: '0.75rem', color: '#475569' }}>📄 manifest.json (V1 specs)</div>
                        <div style={{ paddingLeft: '0.75rem', color: '#475569' }}>📄 experience.json (atomic payload)</div>
                        <div style={{ paddingLeft: '0.75rem', color: '#475569' }}>📁 media / files ({mediaAssets.length})</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ── View 9: Profile Settings ── */}
          {view === 'profile' && (
            <>
              <div className="sd-page-header">
                <h1 className="sd-page-title">Profile Settings</h1>
                <p className="sd-page-sub">Manage your personal information and account security.</p>
              </div>

              {feedbackMsg.text && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.25rem',
                  fontSize: '0.84rem', fontWeight: 600,
                  background: feedbackMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  color: feedbackMsg.type === 'error' ? '#ef4444' : '#15803d',
                  border: feedbackMsg.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0'
                }}>
                  {feedbackMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileUpdate}>
                <div className="sd-profile-card">
                  {/* Section Header */}
                  <div className="sd-profile-section-header">
                    <div className="sd-profile-section-title">
                      <FiUser /> Personal Details
                    </div>

                  </div>

                  {/* Full Name + Email */}
                  <div className="sd-form-row">
                    <div className="sd-form-group">
                      <label className="sd-form-label">Full Name</label>
                      <input className="sd-form-input" type="text"
                        value={profileForm.full_name}
                        onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Your full name" required />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Email Address</label>
                      <input className="sd-form-input" type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="your@email.com" />
                    </div>
                  </div>

                  {/* Username + Phone Number */}
                  <div className="sd-form-row">
                    <div className="sd-form-group">
                      <label className="sd-form-label">Username</label>
                      <input className="sd-form-input" type="text" value={profileForm.username} disabled
                        style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Phone Number</label>
                      <input className="sd-form-input" type="tel"
                        value={profileForm.phone_no}
                        onChange={e => setProfileForm({ ...profileForm, phone_no: e.target.value })}
                        placeholder="+91 98765 43210" />
                    </div>
                  </div>

                  {/* Change Password Row */}
                  <div className="sd-pw-row">
                    <div>
                      <div className="sd-pw-row-title">Change Password</div>
                      <div className="sd-pw-row-sub">Update your password to stay secure</div>
                    </div>
                    <button type="button" className="sd-btn-outline"
                      onClick={() => {
                        setPwForm({ current_password: '', new_password: '', confirm_password: '' });
                        setPwModalError('');
                        setShowPwModal(true);
                      }}
                    >Update</button>
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
    </div>
  );

};

export default ContentStudio;
