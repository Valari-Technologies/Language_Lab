import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { API_BASE_URL } from './config';
import PreviewCanvasRenderer from './PreviewCanvasRenderer';
import {
  FiGrid, FiBookOpen, FiActivity, FiMonitor, FiFileText,
  FiCheckCircle, FiDownload, FiSettings, FiHelpCircle, FiLogOut,
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiBell, FiEye, FiEyeOff,
  FiAlertTriangle, FiImage, FiPlusCircle,
  FiArrowLeft, FiInfo, FiUpload,
  FiPlay, FiPause, FiCheck,
  FiUser, FiUsers, FiClock, FiMoreVertical, FiVolume2, FiMic, FiCopy,
  FiMove, FiEdit, FiGitCommit, FiList, FiLayers, FiType, FiLock, FiRefreshCw,
  FiCornerUpLeft, FiCornerUpRight, FiMaximize, FiMinimize
} from 'react-icons/fi';
import './Dashboard.css';
import contentCreatorHeaderBanner from './assets/3.jpeg';
import contentStudioBg from './assets/contentbg.png';
import logoIcon from './assets/icon.png';
import roundLogo from './assets/favicon.png';
import AvatarCropperModal from './AvatarCropperModal';
import HelpSupportModal from './HelpSupportModal';

const getScrambledWords = (wordsList) => {
  if (!wordsList || wordsList.length <= 1) return wordsList || [];
  const str = wordsList.join('|');
  let hash = 0;
  for (let k = 0; k < str.length; k++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(k);
    hash |= 0;
  }
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  const shuffled = [...wordsList];
  let currentSeed = Math.abs(hash) + 1;
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  if (shuffled.length > 1 && shuffled.every((w, idx) => w === wordsList[idx])) {
    const temp = shuffled[0];
    shuffled[0] = shuffled[shuffled.length - 1];
    shuffled[shuffled.length - 1] = temp;
  }
  return shuffled;
};

const COMMON_IPA_DICT = {
  hello: '/həˈloʊ/',
  world: '/wɜːrld/',
  extraordinary: '/ɪkˈstrɔːrdn-eri/',
  water: '/ˈwɔː.tər/',
  apple: '/ˈæp.əl/',
  cat: '/kæt/',
  dog: '/dɔːɡ/',
  book: '/bʊk/',
  pronunciation: '/prəˌnʌn.siˈeɪ.ʃən/',
  language: '/ˈlæŋ.ɡwɪdʒ/',
  student: '/ˈstjuː.dənt/',
  teacher: '/ˈtiː.tʃər/',
  school: '/skuːl/',
  computer: '/kəmˈpjuː.tər/',
  science: '/ˈsaɪ.əns/',
  english: '/ˈɪŋ.ɡlɪʃ/',
  elephant: '/ˈel.ɪ.fənt/',
  lion: '/ˈlaɪ.ən/',
  tiger: '/ˈtaɪ.ɡər/',
  monkey: '/ˈmʌŋ.ki/',
  beautiful: '/ˈbjuː.tɪ.fəl/',
  welcome: '/ˈwel.kəm/',
  morning: '/ˈmɔːr.nɪŋ/',
  night: '/naɪt/',
  friend: '/frend/',
  happy: '/ˈhæp.i/',
  family: '/ˈfæm.əl.i/',
  good: '/ɡʊd/',
  bye: '/baɪ/',
  goodbye: '/ˌɡʊdˈbaɪ/',
  thank: '/θæŋk/',
  you: '/juː/',
  thanks: '/θæŋks/',
  please: '/pliːz/',
  sorry: '/ˈsɔːr.i/',
  yes: '/jes/',
  no: '/noʊ/',
  name: '/neɪm/',
  time: '/taɪm/',
  day: '/deɪ/',
  today: '/təˈdeɪ/',
  tomorrow: '/təˈmɔːr.oʊ/',
  yesterday: '/ˈjes.tər.deɪ/',
  listen: '/ˈlɪs.ən/',
  speak: '/spiːk/',
  read: '/riːd/',
  write: '/raɪt/',
  practice: '/ˈpræk.tɪs/'
};

const getPhoneticGuide = (text) => {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return '';
  
  if (COMMON_IPA_DICT[trimmed]) {
    return COMMON_IPA_DICT[trimmed];
  }
  
  const words = trimmed.split(/\s+/);
  const phonetics = words.map(w => {
    if (COMMON_IPA_DICT[w]) {
      return COMMON_IPA_DICT[w].replace(/^\/|\/$/g, '');
    }
    let p = w
      .replace(/tion/g, 'ʃən')
      .replace(/sion/g, 'ʒən')
      .replace(/ture/g, 'tʃər')
      .replace(/sure/g, 'ʒər')
      .replace(/ph/g, 'f')
      .replace(/sh/g, 'ʃ')
      .replace(/ch/g, 'tʃ')
      .replace(/th/g, 'θ')
      .replace(/ck/g, 'k')
      .replace(/ng/g, 'ŋ')
      .replace(/igh/g, 'aɪ')
      .replace(/ee/g, 'iː')
      .replace(/ea/g, 'iː')
      .replace(/oo/g, 'uː')
      .replace(/ou/g, 'aʊ')
      .replace(/ow/g, 'aʊ')
      .replace(/oi/g, 'ɔɪ')
      .replace(/oy/g, 'ɔɪ')
      .replace(/ai/g, 'eɪ')
      .replace(/ay/g, 'eɪ')
      .replace(/qu/g, 'kw')
      .replace(/x/g, 'ks')
      .replace(/c(?=[iey])/g, 's')
      .replace(/c/g, 'k')
      .replace(/y$/g, 'i');
    return p;
  });
  
  return `/${phonetics.join(' ')}/`;
};

const CustomAudioPlayer = ({ src, style = {} }) => {
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '0.4rem 0.6rem',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: '#0ea5e9',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          flexShrink: 0
        }}
      >
        {isPlaying ? <FiPause /> : <FiPlay style={{ marginLeft: '2px' }} />}
      </button>

      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', minWidth: '60px', flexShrink: 0 }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <input
        type="range"
        min="0"
        max={duration || 100}
        step="0.1"
        value={currentTime}
        onChange={handleSeek}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          height: '5px',
          accentColor: '#0ea5e9',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};

const HintLadderForm = ({ block, onChange }) => {
  const hints = Array.isArray(block?.content?.hints) ? block.content.hints : [];
  return (
    <div style={{ marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Hint Ladder</span>
        <button
          type="button"
          className="cs-btn-outline"
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
          onClick={() => {
            const updated = [...hints, ''];
            onChange('hints', updated);
          }}
        >
          + Add Hint
        </button>
      </div>
      {hints.length === 0 ? (
        <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>No progressive hints configured.</span>
      ) : (
        hints.map((hint, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <input
              className="cs-form-input"
              style={{ height: '28px', fontSize: '0.72rem', flex: 1 }}
              type="text"
              value={typeof hint === 'string' ? hint : (hint?.text || '')}
              placeholder={`Hint #${idx + 1}`}
              onChange={(e) => {
                const updated = [...hints];
                updated[idx] = e.target.value;
                onChange('hints', updated);
              }}
            />
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
              onClick={() => {
                const updated = hints.filter((_, i) => i !== idx);
                onChange('hints', updated);
              }}
            >
              <FiTrash2 style={{ fontSize: '0.72rem' }} />
            </button>
          </div>
        ))
      )}
    </div>
  );
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

const getThumbnailUrl = (thumbnail) => {
  if (!thumbnail || thumbnail === 'None' || thumbnail === 'null') return null;
  const clean = thumbnail.trim().toLowerCase();
  if (clean.endsWith('.pdf') || clean.endsWith('.doc') || clean.endsWith('.docx') || clean.endsWith('.txt')) return null;
  return resolveMediaUrl(thumbnail);
};



const MediaUploadField = ({ label, value, mediaType, onChange, actionLoading, setActionLoading, showFeedback }) => {
  const uploadId = `upload-${Math.random().toString(36).substr(2, 9)}`;
  const acceptPattern =
    mediaType === 'image' ? 'image/*' :
      mediaType === 'audio' ? 'audio/*' :
        mediaType === 'video' ? 'video/*' : '*';

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const detectFileType = (f) => {
      const mime = f.type || '';
      if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/')) return 'video';
      if (mime.startsWith('audio/')) return 'audio';
      const ext = f.name.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) return 'image';
      if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'wmv'].includes(ext)) return 'video';
      if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
      return 'other';
    };

    const fType = detectFileType(file);
    if (fType === 'image' && file.size > 10 * 1024 * 1024) {
      showFeedback("Image is too large. Upload less than 10MB.", "error");
      e.target.value = null;
      return;
    }
    if (fType === 'video' && file.size > 200 * 1024 * 1024) {
      showFeedback("Video is too large. Upload less than 200MB.", "error");
      e.target.value = null;
      return;
    }
    if (fType === 'audio' && file.size > 50 * 1024 * 1024) {
      showFeedback("Audio is too large. Upload less than 50MB.", "error");
      e.target.value = null;
      return;
    }

    e.target.value = null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('folder', 'screen_builder');

    setActionLoading(true);
    try {
      const res = await apiFetch('/api/v1/content/media/upload/', {
        method: 'POST',
        body: formData
      });
      if (res.ok || res.status === 201) {
        const uploadedAsset = await res.json();
        showFeedback('File uploaded successfully!');
        const assetUrl = uploadedAsset.file || uploadedAsset.url || '';
        onChange(assetUrl);
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

  return (
    <div className="cs-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
      <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', margin: 0 }}>
        {label}
      </label>
      <input
        type="file"
        id={uploadId}
        style={{ display: 'none' }}
        accept={acceptPattern}
        onChange={handleFileChange}
      />
      {value ? (
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.5rem',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {mediaType === 'image' && (
              <img
                src={resolveMediaUrl(value)}
                alt="Preview"
                style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f1f5f9' }}
              />
            )}
            {mediaType === 'audio' && <span style={{ fontSize: '1rem' }}>🎵</span>}
            {mediaType === 'video' && <span style={{ fontSize: '1rem' }}>🎬</span>}
            {mediaType !== 'image' && mediaType !== 'audio' && mediaType !== 'video' && <span style={{ fontSize: '1rem' }}>📄</span>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {value.split('/').pop()}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="cs-btn-outline"
            style={{ fontSize: '0.68rem', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
            disabled={actionLoading}
            onClick={() => document.getElementById(uploadId).click()}
          >
            <FiUpload style={{ fontSize: '0.72rem' }} /> {actionLoading ? 'Uploading...' : 'Replace File'}
          </button>
        </div>
      ) : (
        <div
          onClick={() => document.getElementById(uploadId).click()}
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '0.75rem 0.5rem',
            textAlign: 'center',
            background: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.7rem',
            color: '#64748b',
            transition: 'border-color 0.2s, background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.backgroundColor = '#f5f3ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
        >
          <FiUpload style={{ fontSize: '1rem', marginBottom: '2px' }} />
          <div>{actionLoading ? 'Uploading...' : 'Click to upload file'}</div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CONTENT STUDIO COMPONENT
   ═══════════════════════════════════════════════════════════ */
function ContentStudio({ user, onLogout, currentPath, setCurrentPath, onUpdateUser }) {
  // Views: dashboard, experiences, experience-builder, activity-builder, screen-builder, preview, media, publish, profile
  const [view, setView] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(() => {
    return localStorage.getItem('cs_nav_collapsed') === 'true';
  });
  const toggleNavCollapsed = () => {
    setNavCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('cs_nav_collapsed', String(next));
      return next;
    });
  };
  const [previousView, setPreviousView] = useState('dashboard');
  const [activeHotspotIndex, setActiveHotspotIndex] = useState(0);
  const [isNewExperience, setIsNewExperience] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Backend Integration States
  const [experiences, setExperiences] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  const [activities, setActivities] = useState([]);
  const [screens, setScreens] = useState([]);
  const [isEditingScreen, setIsEditingScreen] = useState(false);
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [originalOutcomes, setOriginalOutcomes] = useState([]);
  const [outcomesText, setOutcomesText] = useState('');
  const [gradesList, setGradesList] = useState([]);
  const [activitySkillOptions, setActivitySkillOptions] = useState([]);
  const [recentExperiences, setRecentExperiences] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showRecentActivityModal, setShowRecentActivityModal] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Lesson Published", message: "Lesson 'Present Continuous Tense - Speaking' published to Library successfully.", time: "15 mins ago", type: "success", read: false, is_read: false },
    { id: 2, title: "AI Assistant Ready", message: "AI generated 8 interactive quiz items for 'Reading Passage - Chapter 3'.", time: "1 hour ago", type: "info", read: false, is_read: false },
    { id: 3, title: "Validation Warning", message: "Draft Lesson 'Audio Listening 1' is missing a media attachment in Screen 2.", time: "3 hours ago", type: "warning", read: true, is_read: true },
    { id: 4, title: "Platform Update", message: "Lesson Builder v2.4 features and new speech blocks are now live.", time: "2 days ago", type: "system", read: true, is_read: true },
  ]);

  const [publishStatus, setPublishStatus] = useState(null);
  const [publishHistory, setPublishHistory] = useState([]);
  const [validationReport, setValidationReport] = useState(null);



  // Filter states for Experience Library
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [publishPage, setPublishPage] = useState(1);

  // Multi-select and View Details states for Experiences
  const [selectedExperienceIds, setSelectedExperienceIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailExperience, setDetailExperience] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // AI Content Assistant states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState(null);
  const [aiForm, setAiForm] = useState({
    topic: '',
    content_type: 'quiz',
    target_level: 'Beginner / Grade 5'
  });

  const handleGenerateAIContent = async (e) => {
    e.preventDefault();
    if (!aiForm.topic.trim()) {
      showFeedback('Please enter a topic or prompt.', 'error');
      return;
    }
    setAiLoading(true);
    setAiPreviewData(null);
    try {
      const res = await apiFetch('/api/v1/cms/ai-generate/', {
        method: 'POST',
        body: JSON.stringify({
          topic: aiForm.topic,
          target_level: aiForm.target_level,
          content_type: aiForm.content_type
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAiPreviewData(data);
        showFeedback('Content generated successfully!');
      } else {
        showFeedback(data.error || 'Failed to generate content', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Network error occurred during generation', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const updateElementProperties = (elementId, newProps) => {
    setScreenForm(prev => {
      const elements = (prev.elements || []).map(el => {
        if (el.id === elementId) {
          return {
            ...el,
            content: {
              ...el.content,
              ...newProps
            }
          };
        }
        return el;
      });
      return { ...prev, elements };
    });
  };

  const handleAcceptAIContent = () => {
    if (!aiPreviewData) return;

    // Auto-fill Title: Prioritize keeping the existing screen title
    const generatedTitle = screenForm.title || aiPreviewData.title || 'AI Generated Screen';

    let updatedForm = {
      ...screenForm,
      title: generatedTitle
    };

    const type = aiForm.content_type;

    const addOrUpdateBlock = (blockType, newProps) => {
      const activeBlock = (screenForm.elements || []).find(el => el.id === selectedBlockId);
      if (activeBlock && activeBlock.type === blockType) {
        updateElementProperties(selectedBlockId, newProps);
      } else {
        const newId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let maxTop = 0;
        if (screenForm.elements && screenForm.elements.length > 0) {
          screenForm.elements.forEach(el => {
            const topVal = parseInt(el.styles?.top) || 0;
            const blockH = el.styles?.minHeight ? (parseInt(el.styles.minHeight) || 100) : 100;
            if (topVal + blockH > maxTop) {
              maxTop = topVal + blockH;
            }
          });
        }
        const nextTop = maxTop === 0 ? 20 : maxTop + 16;
        const generatedBlock = {
          id: newId,
          type: blockType,
          slot: 'left',
          content: newProps,
          styles: { top: `${nextTop}px`, left: '20px' }
        };
        updatedForm.elements = [...(screenForm.elements || []), generatedBlock];
        setSelectedBlockId(newId);
      }
    };

    if (type === 'quiz' || type === 'quiz_listening') {
      const newProps = {
        question: aiPreviewData.question || '',
        options: (aiPreviewData.options || ['', '', '', '']).map(opt => typeof opt === 'object' ? opt : { text: opt }),
        correctAnswerIndex: aiPreviewData.correct_option_index !== undefined ? aiPreviewData.correct_option_index : 0,
        explanation: aiPreviewData.explanation || ''
      };
      addOrUpdateBlock('quiz', newProps);
    }
    else if (type === 'roleplay_simulation') {
      const newProps = {
        scenario: aiPreviewData.scenario || 'Practice conversation with NPC',
        objectives: aiPreviewData.objectives || ['Introduce yourself', 'Ask a question'],
        npcCharacter: aiPreviewData.npcCharacter || 'Alex',
        conversation: aiPreviewData.conversation || [
          { turn: 1, speaker: 'npc', text: 'Hello! Welcome.', audio: '', expectedStudentResponses: [] },
          { turn: 2, speaker: 'student', recordingRequired: true, prompt: 'Greet the NPC back.' }
        ]
      };
      addOrUpdateBlock('roleplay_simulation', newProps);
    }
    else if (type === 'fill_in_blanks' || type === 'fill_blank') {
      const newProps = {
        question: aiPreviewData.question_instruction || aiPreviewData.question || '',
        text: aiPreviewData.text_template || aiPreviewData.text || ''
      };
      addOrUpdateBlock('fill_blank', newProps);
    }
    else if (type === 'dictation') {
      const newProps = {
        question: aiPreviewData.question || 'Listen and type what you hear.'
      };
      addOrUpdateBlock('dictation', newProps);
    }
    else if (type === 'sequence_audio') {
      const newProps = {
        question: aiPreviewData.question || 'Arrange the items in the correct order.',
        items: aiPreviewData.items || []
      };
      addOrUpdateBlock('sequence', newProps);
    }
    else if (type === 'functional_reading') {
      const newProps = {
        docTitle: aiPreviewData.docTitle || aiPreviewData.title || 'Functional Reading Document',
        docCategory: aiPreviewData.docCategory || 'Notice / Document',
        passage: aiPreviewData.passage || aiPreviewData.text || '',
        question: aiPreviewData.question || 'What is the main purpose of this document?'
      };
      addOrUpdateBlock('functional_reading', newProps);
    }
    else if (type === 'pronunciation') {
      const newProps = {
        word: aiPreviewData.word || '',
        phonetic: aiPreviewData.phonetic || ''
      };
      addOrUpdateBlock('pronunciation', newProps);
    }
    else if (type === 'reading_passage') {
      const newProps = {
        title: aiPreviewData.title || '',
        passage: aiPreviewData.passage || '',
        question: aiPreviewData.question || ''
      };
      addOrUpdateBlock('reading_passage', newProps);
    }
    else if (type === 'match') {
      const newProps = {
        question: aiPreviewData.question || '',
        leftItems: aiPreviewData.leftItems || [],
        rightItems: aiPreviewData.rightItems || []
      };
      addOrUpdateBlock('match', newProps);
    }
    else if (type === 'flashcards') {
      const newProps = {
        cards: (aiPreviewData.cards || []).map((card, i) => ({
          id: card.id || `card-${i}`,
          front: card.front || '',
          back: card.back || ''
        }))
      };
      addOrUpdateBlock('flashcard', newProps);
    }
    else if (type === 'wordsearch') {
      const newProps = {
        question: aiPreviewData.question || '',
        words: aiPreviewData.words || [],
        gridSize: aiPreviewData.gridSize || 8
      };
      addOrUpdateBlock('word_search', newProps);
    }
    else if (type === 'crossword') {
      const newProps = {
        question: aiPreviewData.question || '',
        words: aiPreviewData.words || []
      };
      addOrUpdateBlock('crossword', newProps);
    }
    else if (type === 'writing_prompt') {
      const newProps = {
        prompt: aiPreviewData.prompt || '',
        placeholder: aiPreviewData.placeholder || '',
        minWords: aiPreviewData.minWords || 10
      };
      addOrUpdateBlock('writing_prompt', newProps);
    }
    else if (type === 'sentence_builder') {
      const newProps = {
        question: aiPreviewData.question || '',
        sentence: aiPreviewData.sentence || '',
        words: aiPreviewData.words || []
      };
      addOrUpdateBlock('sentence_builder', newProps);
    }
    else if (type === 'grammar_correction') {
      const newProps = {
        incorrectSentence: aiPreviewData.incorrectSentence || '',
        correctedSentence: aiPreviewData.correctedSentence || ''
      };
      addOrUpdateBlock('grammar_correction', newProps);
    }
    else if (type === 'true_false') {
      const newProps = {
        question: aiPreviewData.question || '',
        correctAnswer: aiPreviewData.correctAnswer !== undefined ? aiPreviewData.correctAnswer : true
      };
      addOrUpdateBlock('true_false', newProps);
    }
    else if (type === 'drag_drop') {
      const newProps = {
        question: aiPreviewData.question || '',
        pairs: (aiPreviewData.pairs || []).map((pair, i) => ({
          id: pair.id || `pair-${i}`,
          source: pair.source || '',
          target: pair.target || ''
        }))
      };
      addOrUpdateBlock('drag_drop', newProps);
    }
    else if (type === 'full_screen') {
      const elements = [
        {
          id: `block-${Date.now()}-h`,
          type: 'heading',
          slot: 'left',
          content: { text: aiPreviewData.heading || aiPreviewData.title || '', tag: 'H1' },
          styles: { color: '#0f172a', fontWeight: 'Bold', alignment: 'Center', fontSize: '36px', top: '20px', left: '20px' }
        },
        {
          id: `block-${Date.now()}-t`,
          type: 'text',
          slot: 'left',
          content: { text: aiPreviewData.body || '' },
          styles: { color: '#334155', fontWeight: 'Normal', alignment: 'Left', fontSize: '16px', top: '140px', left: '20px' }
        }
      ];

      if (aiPreviewData.dialogue_steps) {
        elements.push({
          id: `block-${Date.now()}-d`,
          type: 'dialogue',
          slot: 'left',
          content: {
            steps: aiPreviewData.dialogue_steps.map((step, idx) => ({
              step: idx + 1,
              name: step.speaker || 'A',
              text: step.text || '',
              avatarColor: '#3b82f6',
              side: 'left'
            }))
          },
          styles: { top: '260px', left: '20px' }
        });
      }

      if (aiPreviewData.quiz) {
        elements.push({
          id: `block-${Date.now()}-q`,
          type: 'quiz',
          slot: 'left',
          content: {
            question: aiPreviewData.quiz.question || '',
            options: (aiPreviewData.quiz.options || ['', '', '', '']).map(opt => typeof opt === 'object' ? opt : { text: opt }),
            correctAnswerIndex: aiPreviewData.quiz.correct_option_index !== undefined ? aiPreviewData.quiz.correct_option_index : 0
          },
          styles: { top: '380px', left: '20px' }
        });
      }

      updatedForm.elements = elements;
    }

    setScreenForm(updatedForm);
    pushHistory(updatedForm.elements);
    setShowAiModal(false);
    showFeedback('Editor populated with generated AI content!');
  };

  const formatDifficulty = (val) => {
    if (!val) return '';
    const lower = val.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const handleSelectExperience = (id) => {
    setSelectedExperienceIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllExperiences = async () => {
    const allCurrentSelected = experiences.length > 0 && experiences.every(e => selectedExperienceIds.includes(e.id));
    if (allCurrentSelected) {
      setSelectedExperienceIds([]);
    } else {
      try {
        const params = new URLSearchParams();
        if (filterGrade) params.append('grade', filterGrade);
        if (filterSubject) params.append('subject', filterSubject);
        if (filterDifficulty) params.append('difficulty', filterDifficulty.toUpperCase());
        if (filterStatus) params.append('status', filterStatus.toUpperCase());
        if (filterTag) params.append('tags', filterTag);
        if (filterSearch) params.append('search', filterSearch);
        params.append('page_size', '100'); // fetch all up to backend max_page_size

        const res = await apiFetch(`/api/v1/content/experiences/?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const allItems = data.results || data;
          setSelectedExperienceIds(allItems.map(e => e.id));
        }
      } catch (err) {
        console.error('Failed to select all experiences', err);
        // fallback to current page only
        const currentIds = experiences.map(e => e.id);
        setSelectedExperienceIds(prev => {
          const next = [...prev];
          currentIds.forEach(id => {
            if (!next.includes(id)) next.push(id);
          });
          return next;
        });
      }
    }
  };

  const handleViewDetails = async (id) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await apiFetch(`/api/v1/content/experiences/${id}/`);
      if (res.ok) {
        const data = await res.json();
        setDetailExperience(data);
      } else {
        showFeedback('Failed to load experience details', 'error');
        setShowDetailModal(false);
      }
    } catch (e) {
      console.error(e);
      showFeedback('Error loading experience details', 'error');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Previewer session payload track
  const [previewPayload, setPreviewPayload] = useState(null);
  const [previewActivityIndex, setPreviewActivityIndex] = useState(0);
  const [previewScreenIndex, setPreviewScreenIndex] = useState(0);
  const [previewAnswerIndex, setPreviewAnswerIndex] = useState(null);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [voiceRecordingStates, setVoiceRecordingStates] = useState({});

  // Dynamic scale factor calculation for preview canvas (locks to 1000px base width)
  const [previewScaleFactor, setPreviewScaleFactor] = useState(1);
  const previewScaleRef = React.useRef(null);
  const previewContainerRef = React.useRef(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPreviewFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePreviewFullscreen = () => {
    if (!document.fullscreenElement) {
      if (previewContainerRef.current?.requestFullscreen) {
        previewContainerRef.current.requestFullscreen().catch(err => {
          console.error("Error attempting to enable fullscreen:", err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    if (view !== 'preview' || !previewScaleRef.current) return;
    const updateScale = () => {
      if (previewScaleRef.current) {
        const width = previewScaleRef.current.clientWidth;
        setPreviewScaleFactor(width > 0 ? width / 1000 : 1);
      }
    };
    // Run after a short timeout to make sure DOM is fully rendered
    const timer = setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [view, previewActivityIndex, previewScreenIndex, isPreviewFullscreen]);

  const getCanvasHeight = (elements) => {
    if (!elements || elements.length === 0) return 600;
    let lastBottom = 0;
    elements.forEach((block, idx) => {
      const top = (block.styles?.top !== undefined && block.styles?.top !== 'auto' && block.styles?.top !== null) ? parseInt(block.styles.top) : 0;
      let height = parseInt(block.styles?.minHeight || block.styles?.height);
      if (isNaN(height)) {
        if (block.type === 'video' || block.type === 'image' || block.type === 'hotspot_explorer') {
          const extraQ = block.content?.hasQuestion ? 120 : 0;
          height = Math.max(450, (parseInt(block.styles?.height) || 450) + extraQ);
        }
        else if (block.type === 'functional_reading') {
          const qCount = (block.content?.questions || []).length || 1;
          height = 360 + qCount * 140;
        } else if (block.type === 'match' || block.type === 'matching') {
          const pairsCount = (block.content?.leftItems || block.content?.pairs || block.content?.items || []).length || 3;
          height = 100 + pairsCount * 70;
        } else if (block.type === 'word_search') {
          const gridRows = parseInt(block.content?.gridSize) || (block.content?.grid || []).length || 8;
          height = 480 + gridRows * 10;
        } else if (block.type === 'grammar_correction') {
          const sCount = (block.content?.sentences || []).length || 2;
          height = 110 + sCount * 75;
        } else if (block.type === 'fill_blank' || block.type === 'fill_blanks' || block.type === 'fill_in_blanks' || block.type === 'categorization') {
          const itemsCount = (block.content?.items || block.content?.blanks || []).length || 2;
          height = 120 + itemsCount * 70;
        } else if (block.type === 'dialogue' || block.type === 'roleplay_simulation') {
          const stepsCount = (block.content?.steps || block.content?.dialogue || []).length || 2;
          height = Math.max(200, stepsCount * 90);
        } else if (block.type === 'quiz' || block.type === 'true_false' || block.type === 'writing_prompt' || block.type === 'quiz_listening') {
          const optsCount = (block.content?.options || []).length || 4;
          height = 140 + optsCount * 40;
        } else if (block.type === 'reading_passage') height = 320;
        else if (block.type === 'heading' || block.type === 'text') height = 60;
        else height = 160;
      }

      let computedTop = top;
      if (idx > 0 && computedTop < lastBottom + 24) {
        computedTop = lastBottom + 24;
      }
      lastBottom = computedTop + height;
    });
    return Math.max(600, lastBottom + 220);
  };


  const loadExperiencesData = async (targetPage = page) => {
    try {
      const params = new URLSearchParams();
      if (filterGrade) params.append('grade', filterGrade);
      if (filterSubject) params.append('subject', filterSubject);
      if (filterDifficulty) params.append('difficulty', filterDifficulty.toUpperCase());
      if (filterStatus) params.append('status', filterStatus.toUpperCase());
      if (filterTag) params.append('tags', filterTag);
      if (filterSearch) params.append('search', filterSearch);
      params.append('page', targetPage);

      const url = `/api/v1/content/experiences/?${params.toString()}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          setExperiences(data.results);
          setTotalCount(data.count || 0);
        } else {
          setExperiences(data);
          setTotalCount(data.length || 0);
        }
      }
    } catch (e) {
      console.error('Failed to load experiences in Content Studio', e);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadExperiencesData(newPage);
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

  const loadActivitySkills = async () => {
    try {
      const res = await apiFetch('/api/v1/content/activity-skills/');
      if (res.ok) {
        const data = await res.json();
        setActivitySkillOptions(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (e) {
      console.error('Failed to load activity skills', e);
    }
  };

  const loadUserProfile = async () => {
    try {
      const res = await apiFetch('/api/users/profile/');
      if (res.ok) {
        const data = await res.json();
        setCurrentUserState(data);
        if (onUpdateUser) onUpdateUser(data);
        setProfileForm({
          username: data.username || 'content_creator',
          email: data.email || '',
          full_name: data.full_name || '',
          phone_no: data.phone_no || ''
        });
      }
    } catch (e) {
      console.error('Failed to load user profile', e);
    }
  };

  useEffect(() => {
    loadUserProfile();
    loadExperiencesData();
    loadMediaData();
    loadSummaryData();
    loadRecentExperiences();
    loadRecentActivity();
    loadNotifications();
    loadGrades();
    loadActivitySkills();
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
    const handler = () => {
      setShowNotifDropdown(false);
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
    if (hrs >= 5 && hrs < 12) return 'Good morning';
    if (hrs >= 12 && hrs < 17) return 'Good afternoon';
    if (hrs >= 17 && hrs < 22) return 'Good evening';
    return 'Good night';
  };

  useEffect(() => {
    setPage(1);
    loadExperiencesData(1);
  }, [filterGrade, filterSubject, filterDifficulty, filterStatus, filterTag, filterSearch]);

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
                activeElements = JSON.parse(JSON.stringify(content.elements)).map(el => {
                  if (el.type === 'quiz' && el.content && Array.isArray(el.content.options)) {
                    el.content.options = el.content.options.map(opt => typeof opt === 'object' ? opt : { text: opt });
                  }
                  return {
                    ...el,
                    slot: el.slot || (['image', 'video', 'audio'].includes(el.type) ? 'right' : 'left')
                  };
                });
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

                  if (actData.experience) {
                    await loadExperienceDetail(actData.experience, false);
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
      // If user navigated away via URL/browser back to content studio root, clear screen editing state and preserve active builder view
      setIsEditingScreen(false);
      if (selectedActivity) {
        setView('activity-builder');
      } else if (selectedExperience) {
        setView('experience-builder');
      } else {
        setView('dashboard');
      }
    }
  }, [currentPath]);

  /* ── Clear editor path from URL when navigating away & sync history ── */
  useEffect(() => {
    if (view !== 'screen-builder') {
      if (window.location.pathname.startsWith('/content-studio/editor/')) {
        window.history.replaceState({ csView: view }, '', '/content-studio');
        setCurrentPath('/content-studio');
      }
    }
  }, [view]);

  /* ── Listen for browser Back/Forward navigation ── */
  useEffect(() => {
    const handlePopState = (e) => {
      const stateView = e.state?.csView;
      if (stateView) {
        setView(stateView);
        if (stateView !== 'screen-builder') {
          setIsEditingScreen(false);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── Full Screen Studio States ──
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: user?.username || 'content_creator',
    email: user?.email || '',
    full_name: user?.full_name || '',
    phone_no: user?.phone_no || ''
  });
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewTypeFilter, setPreviewTypeFilter] = useState('LESSON'); // 'LESSON' | 'ASSESSMENT'
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
    if (profileForm.phone_no && profileForm.phone_no.replace(/\D/g, '').length !== 10) {
      showFeedback('Phone number must be exactly 10 numeric digits.', 'error');
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showFeedback("Image is too large. Max size is 3MB.", "error");
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
      const text = await res.text();
      let resData = {};
      try { resData = JSON.parse(text); } catch { resData = {}; }
      if (res.ok) {
        const updatedUser = { ...currentUserState, profile_picture: resData.profile_picture };
        setCurrentUserState(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);
        showFeedback('Profile picture updated successfully!');
      } else {
        showFeedback(resData.error || resData.detail || text.slice(0, 100) || 'Failed to upload profile picture.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Upload error: ' + err.message, 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setDeleteConfirm({
      show: true,
      id: 'profile-avatar',
      type: 'profile picture',
      title: 'Are you sure?',
      message: 'Are you sure you want to delete this profile picture? This action cannot be undone.',
      isConflict: false,
      usages: []
    });
  };

  const handleRemoveAvatarConfirm = async () => {
    setAvatarUploading(true);
    try {
      const res = await apiFetch('/api/users/profile/avatar/', {
        method: 'DELETE',
      });
      if (res.ok) {
        const updatedUser = { ...currentUserState, profile_picture: null };
        setCurrentUserState(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);
        showFeedback('Profile picture removed successfully!');
      } else {
        const d = await res.json();
        showFeedback(d.error || 'Failed to remove profile picture.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback("Failed to remove profile picture.", 'error');
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
    difficulty: 'INTERMEDIATE',
    duration: 15,
    tags: [],
    experience_type: 'LESSON',
    mastery_threshold: 70
  });

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    objective: '',
    skills: [],
    duration: 5,
    mastery: 80,
    activity_type: 'LISTENING'
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

  const workspaceRef = React.useRef(null);

  React.useEffect(() => {
    if (view !== 'experience-builder' || !workspaceRef.current) return;
    const updateZoomToFit = () => {
      if (workspaceRef.current) {
        const availableWidth = workspaceRef.current.clientWidth - 80;
        if (availableWidth > 0) {
          const fitZoom = Math.min(100, Math.floor((availableWidth / 1000) * 100));
          setZoomLevel(Math.max(30, fitZoom));
        }
      }
    };
    const timer = setTimeout(updateZoomToFit, 100);
    window.addEventListener('resize', updateZoomToFit);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateZoomToFit);
    };
  }, [view, leftPanelCollapsed, screenForm?.id]);

  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [pendingBlock, setPendingBlock] = useState(null);
  const [propertiesTab, setPropertiesTab] = useState('content'); // 'content' | 'style' | 'advanced'
  const [remedialOpen, setRemedialOpen] = useState(false);

  const [previewScreenNum, setPreviewScreenNum] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState('B');
  const [flippedCards, setFlippedCards] = useState({});
  const [blankAnswers, setBlankAnswers] = useState({});
  const [dragDropSelections, setDragDropSelections] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentUserState, setCurrentUserState] = useState(user);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

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
          difficulty: data.difficulty || 'INTERMEDIATE',
          duration: data.estimated_duration || 0,
          tags: data.tags || [],
          thumbnail: data.thumbnail || '',
          experience_type: data.experience_type || 'LESSON',
          mastery_threshold: data.mastery_threshold !== undefined ? data.mastery_threshold : 70
        });
        setActivities(data.activities || []);
        const rawOutcomes = data.learning_outcomes || [];
        setLearningOutcomes(rawOutcomes);
        setOriginalOutcomes(rawOutcomes);
        // Convert to plain text — support {text}, {description}, {outcome}, raw strings
        const textStr = rawOutcomes.map(o => {
          if (typeof o === 'string') return o;
          return o.text || o.description || o.outcome || o.name || '';
        }).filter(Boolean).join('\n');
        setOutcomesText(textStr);
        setIsNewExperience(false);
        if (changeViewToBuilder) {
          if (data.experience_type === 'ASSESSMENT') {
            const defaultActivity = (data.activities || []).find(a =>
              (a.skills && a.skills.some(s => s.name === 'assessment' || s === 'assessment')) ||
              (a.activity_type === 'ASSESSMENT')
            );
            if (defaultActivity) {
              await loadActivityDetail(defaultActivity.id, 'screen-builder');
            } else {
              window.history.pushState({ csView: 'experience-builder' }, '', '/content-studio');
              setView('experience-builder');
            }
          } else {
            window.history.pushState({ csView: 'experience-builder' }, '', '/content-studio');
            setView('experience-builder');
          }
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
    if ((experienceForm.description || '').length > 200) {
      showFeedback('Description must not exceed 200 characters.', 'error');
      setActionLoading(false);
      return null;
    }
    setActionLoading(true);
    try {
      let diff = (experienceForm.difficulty || 'Intermediate').toUpperCase();
      if (diff !== 'BEGINNER' && diff !== 'INTERMEDIATE' && diff !== 'MASTER') {
        diff = 'INTERMEDIATE';
      }

      const payload = {
        title: experienceForm.title,
        description: experienceForm.description || '',
        grade: parseInt(experienceForm.grade) || null,
        subject: (Array.isArray(experienceForm.subject) ? experienceForm.subject.join(', ') : (experienceForm.subject || '')) || 'General',
        language: experienceForm.language || 'English',
        difficulty: diff,
        estimated_duration: parseInt(experienceForm.duration) || 15,
        tags: experienceForm.tags || [],
        thumbnail: experienceForm.thumbnail || '',
        experience_type: experienceForm.experience_type || 'LESSON',
        mastery_threshold: parseInt(experienceForm.mastery_threshold) || 70
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
        const existingOutcomes = originalOutcomes || [];
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
        const detailRes = await apiFetch(`/api/v1/content/experiences/${data.id}/`);
        if (detailRes.ok) {
          return await detailRes.json();
        }
        return data;
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
  const [customPrompt, setCustomPrompt] = useState({ show: false, title: 'Input Required', message: '', value: '', placeholder: '', onConfirm: null, error: '' });
  const triggerPrompt = (message, title = 'Input Required', defaultValue = '', placeholder = '', onConfirm = null) => {
    setCustomPrompt({ show: true, title, message, value: defaultValue, placeholder, onConfirm, error: '' });
  };
  const triggerAlert = (message, title = 'Attention', type = 'warning') => {
    setCustomAlert({ show: true, title, message, type });
  };
  const [publishVersion, setPublishVersion] = useState('');
  const [publishNotes, setPublishNotes] = useState('');

  useEffect(() => {
    if (view === 'publish') {
      loadPublishData(selectedExperience?.id);
    }
  }, [view, selectedExperience?.id]);

  const executeDeleteAction = async () => {
    const { id, type, isConflict } = deleteConfirm;
    if (id === 'profile-avatar') {
      setDeleteConfirm({ show: false, id: null, type: '', title: '', message: '', isConflict: false, usages: [] });
      await handleRemoveAvatarConfirm();
      return;
    }
    if (!id) return;
    setActionLoading(true);
    try {
      let url = '';
      let options = { method: 'DELETE' };

      if (type === 'bulk-experiences') {
        const ids = selectedExperienceIds;
        await Promise.all(ids.map(itemId => apiFetch(`/api/v1/content/experiences/${itemId}/`, options)));
        showFeedback(`${ids.length} experiences deleted successfully!`);
        setSelectedExperienceIds([]);
        setDeleteConfirm({ show: false, id: null, type: '', title: '', message: '', isConflict: false, usages: [] });
        loadExperiencesData();
        loadRecentExperiences();
        if (selectedExperience && ids.includes(selectedExperience.id)) {
          setSelectedExperience(null);
        }
        return;
      }

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

  const handleBulkDeleteExperiences = () => {
    setDeleteConfirm({
      show: true,
      id: 'bulk',
      type: 'bulk-experiences',
      title: 'Delete Selected Experiences',
      message: `Are you sure you want to delete the ${selectedExperienceIds.length} selected experiences? This action cannot be undone.`
    });
  };

  const loadActivityDetail = async (actObjOrId, targetView = 'activity-builder') => {
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
          mastery: data.mastery_threshold || 80,
          activity_type: data.activity_type || 'LISTENING'
        });
        const activityScreens = data.screens || [];
        setScreens(activityScreens);
        if (targetView === 'activity-builder') {
          setShowActivityModal(true);
        }
        if (targetView === 'screen-builder') {
          setView('screen-builder');
          setIsEditingScreen(false);
        } else if (targetView) {
          setView(targetView);
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
      let selectedSkillNames = Array.isArray(activityForm.skills) ? activityForm.skills : [];
      if (selectedExperience?.experience_type === 'ASSESSMENT') {
        selectedSkillNames = ['assessment'];
      }
      if (selectedSkillNames.length === 0) {
        showFeedback('Please select a Module for this activity first.', 'error');
        setActionLoading(false);
        return;
      }

      const expDuration = selectedExperience?.estimated_duration || parseInt(experienceForm.duration) || 0;
      const actDuration = parseInt(activityForm.duration) || 5;
      const existingDuration = activities
        .filter(a => selectedActivity ? a.id !== selectedActivity.id : true)
        .reduce((sum, a) => sum + (a.estimated_duration || 0), 0);
      const projectedTotal = existingDuration + actDuration;

      if (expDuration > 0 && projectedTotal > expDuration) {
        showFeedback(`Cannot save activity: Combined total duration (${projectedTotal} min) exceeds lesson duration limit (${expDuration} min).`, 'error');
        setActionLoading(false);
        return;
      }
      const skillIds = activitySkillOptions
        .filter(s => selectedSkillNames.includes(s.name))
        .map(s => s.id);

      const moduleName = selectedSkillNames[0] || 'listening';
      const displayTitle = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

      const payload = {
        experience: selectedExperience.id,
        title: displayTitle,
        description: activityForm.description || '',
        learning_objective: activityForm.objective || '',
        estimated_duration: parseInt(activityForm.duration) || 5,
        mastery_threshold: parseInt(activityForm.mastery) || 80,
        skill_ids: skillIds,
        activity_type: moduleName.toUpperCase()
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

    let activeElements = [];
    if (content.elements && Array.isArray(content.elements)) {
      activeElements = JSON.parse(JSON.stringify(content.elements)).map(el => {
        const rawType = (el.type || '').toLowerCase();
        let normalizedType = rawType;
        if (['roleplay_simulation', 'roleplay simulation', 'roleplay', 'role_play', 'dialogue'].includes(rawType)) {
          normalizedType = 'roleplay_simulation';
        } else if (['sentence_builder', 'sentence builder'].includes(rawType)) {
          normalizedType = 'sentence_builder';
        } else if (['fill_blank', 'fill_blanks', 'fill_in_blanks'].includes(rawType)) {
          normalizedType = 'fill_blank';
        } else if (['audio_mystery', 'audio mystery'].includes(rawType)) {
          normalizedType = 'audio_mystery';
        } else if (['hotspot_explorer', 'hotspot explorer'].includes(rawType)) {
          normalizedType = 'hotspot_explorer';
        } else if (['functional_reading', 'functional reading'].includes(rawType)) {
          normalizedType = 'functional_reading';
        }
        return {
          ...el,
          type: normalizedType,
          slot: el.slot || (['image', 'video', 'audio'].includes(normalizedType) ? 'right' : 'left')
        };
      });
    }

    if (activeElements.length === 0) {
      if (sc.screen_type === 'IMAGE') {
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
            options: (content.quiz_options || ['', '', '', '']).map(opt => typeof opt === 'object' ? opt : { text: opt }),
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

    setElementsHistory([JSON.parse(JSON.stringify(activeElements))]);
    setHistoryIndex(0);

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

  const createDefaultBlock = (type) => {
    if (!type) return null;
    let normalizedType = type.toLowerCase().replace(' ', '_');
    if (normalizedType === 'fill_in_blanks' || normalizedType === 'fill in blanks') normalizedType = 'fill_blank';
    if (normalizedType === 'match_items' || normalizedType === 'match items') normalizedType = 'match';

    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: normalizedType,
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

    } else if (type.toLowerCase() === 'quiz' || type.toLowerCase() === 'mcq') {
      newBlock.type = 'quiz';
      newBlock.content = {
        question: 'Enter question text here...',
        options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
        correctAnswerIndex: 0
      };
    } else if (type.toLowerCase() === 'dictation') {
      newBlock.type = 'dictation';
      newBlock.content = {
        question: 'Listen and type what you hear.',
        items: [{ id: 'dict-1', audioUrl: '', text: '' }]
      };
    } else if (type.toLowerCase() === 'grammar_correction') {
      newBlock.type = 'grammar_correction';
      newBlock.content = { incorrectSentence: '', correctedSentence: '' };
    } else if (type.toLowerCase() === 'reading_passage') {
      newBlock.type = 'reading_passage';
      newBlock.content = { title: '', passage: '', question: '' };
    } else if (type.toLowerCase() === 'writing_prompt') {
      newBlock.type = 'writing_prompt';
      newBlock.content = { prompt: '', placeholder: 'Start writing here...', minWords: 10 };
    } else if (type.toLowerCase() === 'voice_recorder' || type.toLowerCase() === 'voice recorder') {
      newBlock.type = 'voice_recorder';
      newBlock.content = { prompt: '', targetAnswer: '', maxDuration: 10 };
    } else if (type.toLowerCase() === 'drag_drop' || type.toLowerCase() === 'drag and drop' || type.toLowerCase() === 'drag_and_drop') {
      newBlock.type = 'drag_drop';
      newBlock.content = {
        question: 'Drag the correct items to their destinations.',
        pairs: [
          { id: 'pair-1', source: '', target: '' }
        ]
      };
    } else if (type.toLowerCase() === 'fill_blank' || type.toLowerCase() === 'fill in blanks' || type.toLowerCase() === 'fill_in_blanks') {
      newBlock.type = 'fill_blank';
      newBlock.content = {
        question: 'Complete the sentence by filling in the blanks.',
        items: [{ id: 'item-1', text: '' }]
      };
    } else if (type.toLowerCase() === 'match_items' || type.toLowerCase() === 'match items' || type.toLowerCase() === 'match') {
      newBlock.type = 'match';
      newBlock.content = {
        question: 'Match the items in Column A with Column B.',
        leftItems: [''],
        rightItems: ['']
      };
    } else if (type.toLowerCase() === 'sequence' || type.toLowerCase() === 'sequence / order') {
      newBlock.type = 'sequence';
      newBlock.content = {
        question: 'Arrange the items in the correct order.',
        items: ['']
      };
    } else if (type.toLowerCase() === 'flashcard') {
      newBlock.type = 'flashcard';
      newBlock.content = {
        cards: [
          { id: 'card-1', front: '', back: '' }
        ]
      };
    } else if (type.toLowerCase() === 'sentence_builder' || type.toLowerCase() === 'sentence builder') {
      newBlock.type = 'sentence_builder';
      newBlock.content = {
        question: 'Reorder the words to make a correct sentence.',
        sentence: '',
        words: []
      };
    } else if (type.toLowerCase() === 'word_search' || type.toLowerCase() === 'word search / crossword') {
      newBlock.type = 'word_search';
      newBlock.content = {
        question: 'Find the hidden words in the grid.',
        words: [],
        gridSize: 8
      };
    } else if (type.toLowerCase() === 'pronunciation') {
      newBlock.type = 'pronunciation';
      newBlock.content = {
        question: 'Practice pronouncing words correctly',
        items: [{ id: 'item-1', word: '', phonetic: '' }]
      };

    } else if (type.toLowerCase() === 'input') {
      newBlock.type = 'input';
      newBlock.content = { placeholder: '' };
    } else if (type.toLowerCase() === 'crossword') {
      newBlock.type = 'crossword';
      newBlock.content = { question: 'Solve the crossword grid.', words: [] };
    } else if (type.toLowerCase() === 'true_false' || type.toLowerCase() === 'true false' || type.toLowerCase() === 'true/false') {
      newBlock.type = 'true_false';
      newBlock.content = { statements: [{ question: '', correctAnswer: true }] };
    } else if (type.toLowerCase() === 'you_ask' || type.toLowerCase() === 'you ask' || type.toLowerCase() === 'youask') {
      newBlock.type = 'you_ask';
      newBlock.content = {
        prompt: 'Ask a question about the topic',
        recordingRequired: true,
        maxDuration: 10
      };
    } else if (type.toLowerCase() === 'roleplay_simulation' || type.toLowerCase() === 'roleplay simulation') {
      newBlock.type = 'roleplay_simulation';
      newBlock.content = {
        scenario: 'You are ordering food at a restaurant',
        objectives: ['Greet the waiter', 'Place order'],
        npcCharacter: 'Waiter',
        npcImage: '',
        conversation: [
          {
            turn: 1,
            speaker: 'npc',
            text: 'Good evening! How can I help you?',
            audio: '',
            expectedStudentResponses: [{ text: "I'd like a table for two", hint: "Specify your request" }]
          },
          {
            turn: 2,
            speaker: 'student',
            recordingRequired: true,
            prompt: 'Respond to the waiter'
          }
        ]
      };
    } else if (type.toLowerCase() === 'hotspot_explorer' || type.toLowerCase() === 'hotspot explorer') {
      newBlock.type = 'hotspot_explorer';
      newBlock.content = {
        imageUrl: '',
        hotspots: [
          {
            id: 'hotspot_1',
            name: 'Target 1',
            x: 100,
            y: 100,
            width: 80,
            height: 80,
            info: 'Exploration description here...',
            hint: 'Click on the highlighted object'
          }
        ]
      };
    } else if (type.toLowerCase() === 'functional_reading' || type.toLowerCase() === 'functional reading') {
      newBlock.type = 'functional_reading';
      newBlock.content = {
        documentUrl: '',
        documentType: 'form',
        scenario: 'Read the document and answer the questions',
        questions: [
          {
            id: 'q1',
            type: 'mcq',
            question: 'What is the date on the document?',
            options: ['Option A', 'Option B'],
            correctAnswer: 0
          }
        ]
      };
    } else if (type.toLowerCase() === 'audio_mystery' || type.toLowerCase() === 'audio mystery') {
      newBlock.type = 'audio_mystery';
      newBlock.content = {
        clues: [
          { audio: '', duration: 5, description: 'Short introductory sound' },
          { audio: '', duration: 10, description: 'Clearer clue' }
        ],
        question: 'What is being described?',
        options: ['Option A', 'Option B'],
        correctAnswer: 0,
        hints: {
          replay: 'Listen again carefully',
          visualClue: 'Look at the pattern in the sound',
          sentenceStarter: 'The sound indicates...',
          modelAnswer: 'The correct answer is Option A'
        }
      };
    }

    return newBlock;
  };

  const appendBlockToCanvas = (newBlock, dropX = null, dropY = null) => {
    let nextTop = 20;
    let nextLeft = 20;

    if (dropX !== null && dropY !== null) {
      const blockWidth = parseInt(newBlock.styles?.blockWidth) || 400;
      nextTop = Math.max(0, dropY);
      nextLeft = Math.max(0, Math.min(dropX, 936 - blockWidth));
    } else {
      let maxTop = 0;
      if (screenForm.elements && screenForm.elements.length > 0) {
        screenForm.elements.forEach(el => {
          const topVal = parseInt(el.styles?.top) || 0;
          const blockH = el.styles?.minHeight ? (parseInt(el.styles.minHeight) || 100) : 100;
          if (topVal + blockH > maxTop) {
            maxTop = topVal + blockH;
          }
        });
      }
      nextTop = maxTop === 0 ? 20 : maxTop + 16;
    }

    newBlock.styles = {
      ...newBlock.styles,
      top: `${nextTop}px`,
      left: `${nextLeft}px`
    };

    const updatedElements = [...(screenForm.elements || []), newBlock];
    setScreenForm(prev => ({
      ...prev,
      elements: updatedElements
    }));
    pushHistory(updatedElements);
    setSelectedBlockId(newBlock.id);
    setRightPanelCollapsed(false);
    showFeedback(`Added ${newBlock.type.replace('_', ' ')} block`);
  };

  const handleAddBlock = (type, dropX = null, dropY = null) => {
    if (!type) return;
    const newBlock = createDefaultBlock(type);
    appendBlockToCanvas(newBlock, dropX, dropY);
  };

  const handleSelectBlockType = (type) => {
    const defaultBlock = createDefaultBlock(type);
    setSelectedBlockId(null);
    setPendingBlock(defaultBlock);
    setRightPanelCollapsed(false);
  };

  const handleAddPendingBlock = () => {
    if (!pendingBlock) return;
    appendBlockToCanvas(pendingBlock);
    const addedId = pendingBlock.id;
    setPendingBlock(null);
    setSelectedBlockId(addedId);
  };

  const handleCancelPendingBlock = () => {
    setPendingBlock(null);
  };
  const handleDropBlock = (type, dropX = null, dropY = null) => {
    handleAddBlock(type, dropX, dropY);
  };

  const handleDropOnSlot = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;

    const canvasEl = e.currentTarget.closest('[data-canvas-area="true"]') || e.currentTarget;
    const rect = canvasEl.getBoundingClientRect();
    const scale = (zoomLevel / 100) || 1;

    // Account for absolute editor canvas coordinate scaling
    let dropX = (e.clientX - rect.left) / scale;
    let dropY = (e.clientY - rect.top) / scale;

    // Keep the dropped elements within the canvas area boundary
    const canvasW = canvasEl.offsetWidth || 936;
    const canvasH = canvasEl.offsetHeight || 600;
    const defaultBlockW = 400;
    const defaultBlockH = 140;

    dropX = Math.max(0, Math.min(dropX, canvasW - defaultBlockW));
    dropY = Math.max(0, Math.min(dropY, canvasH - defaultBlockH));

    const handleDropWithFixedStyles = (type, dx, dy) => {
      const newBlock = createDefaultBlock(type);
      if (newBlock) {
        newBlock.styles = {
          ...newBlock.styles,
          blockWidth: newBlock.styles?.blockWidth || `${defaultBlockW}px`,
          minHeight: newBlock.styles?.minHeight || `${defaultBlockH}px`
        };
        appendBlockToCanvas(newBlock, dx, dy);
      }
    };

    if (data.startsWith("block:")) {
      // Reordering via move controls
    } else if (data.startsWith("type:")) {
      const type = data.replace("type:", "");
      handleDropWithFixedStyles(type, dropX, dropY);
    } else {
      handleDropWithFixedStyles(data, dropX, dropY);
    }
  };

  const renderCanvasBlock = (block, idx) => {
    const isSelected = selectedBlockId === block.id;

    const makeMoveDragger = () => (
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const initLeft = parseInt(block.styles?.left) || 0;
          const initTop = parseInt(block.styles?.top) || 0;
          // Capture DOM references at mousedown time (before synthetic event is recycled)
          const draggerEl = e.currentTarget;
          const canvasEl = draggerEl.closest('[data-canvas-area="true"]');
          const elWrapper = draggerEl.closest('[data-block-id]');
          const scale = (zoomLevel / 100) || 1;
          const move = (mv) => {
            const canvasW = canvasEl ? canvasEl.offsetWidth : 9999;
            const canvasH = canvasEl ? canvasEl.offsetHeight : 9999;
            const elW = elWrapper ? elWrapper.offsetWidth : 200;
            const elH = elWrapper ? elWrapper.offsetHeight : 60;
            const rawLeft = initLeft + (mv.clientX - startX) / scale;
            const rawTop = initTop + (mv.clientY - startY) / scale;
            const newLeft = Math.max(0, Math.min(rawLeft, canvasW - elW));
            const newTop = Math.max(0, Math.min(rawTop, canvasH - elH));
            const elements = (screenForm.elements || []).map(el2 =>
              el2.id === block.id ? { ...el2, styles: { ...el2.styles, left: `${newLeft}px`, top: `${newTop}px`, blockWidth: el2.styles?.blockWidth || `${elW}px` } } : el2
            );
            setScreenForm(prev => ({ ...prev, elements }));
          };
          const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            setScreenForm(prev => {
              pushHistory(prev.elements);
              return prev;
            });
          };
          window.addEventListener('mousemove', move);
          window.addEventListener('mouseup', up);
        }}
        style={{ cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', marginRight: '4px' }}
        title="Drag to move element"
      >
        <FiMove style={{ fontSize: '0.85rem', color: '#ffffff' }} />
      </div>
    );

    return (
      <div
        key={block.id}
        data-block-id={block.id}
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
          setPendingBlock(null);
          setRightPanelCollapsed(false);
        }}
        style={{
          position: 'absolute',
          left: block.styles?.left || '0px',
          top: block.styles?.top || '0px',
          padding: '0.85rem',
          borderRadius: '12px',
          border: isSelected ? '2px solid #0b57d0' : '1.5px solid #e2e8f0',
          background: isSelected ? '#f8fafc' : '#ffffff',
          boxShadow: isSelected ? '0 4px 12px rgba(11,87,208,0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
          cursor: 'pointer',
          transition: 'border 0.15s, box-shadow 0.15s',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
          ...(block.styles?.blockWidth ? { width: block.styles.blockWidth } : { width: '100%' }),
          minHeight: block.styles?.height || block.styles?.minHeight || 'auto',
          height: 'auto',

          fontFamily: block.styles?.fontFamily || 'inherit',
          fontSize: block.styles?.fontSize || 'inherit',
          fontWeight: block.styles?.fontWeight === 'Bold' ? 700 : block.styles?.fontWeight === 'SemiBold' ? 600 : block.styles?.fontWeight === 'Normal' ? 400 : 'inherit',
          color: block.styles?.color || '#1e293b',
          textAlign: (block.styles?.alignment || 'Left').toLowerCase()
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
            {makeMoveDragger()}
            <span style={{ marginRight: '4px', textTransform: 'uppercase', fontSize: '0.58rem' }}>{block.type}</span>



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
          <div style={{ textAlign: (block.styles?.alignment || 'Center').toLowerCase(), flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', wordBreak: 'break-all' }}>
            <span style={{
              fontFamily: block.styles?.fontFamily === 'Georgia' ? 'Georgia, serif' : block.styles?.fontFamily === 'Inter' ? "'Inter', sans-serif" : block.styles?.fontFamily === 'Roboto' ? "'Roboto', sans-serif" : block.styles?.fontFamily ? `'${block.styles.fontFamily}', sans-serif` : "'Poppins', sans-serif",
              fontSize: `${(parseInt(block.styles?.fontSize) || 28) * 0.7}px`,
              fontWeight: (block.styles?.fontWeight || '').toLowerCase() === 'bold' || block.styles?.fontWeight === '700' ? 700 : (block.styles?.fontWeight || '').toLowerCase() === 'semibold' || block.styles?.fontWeight === '600' ? 600 : 400,
              color: block.styles?.color || '#1e293b',
              lineHeight: 1.2,
              wordBreak: 'break-all',
              overflowWrap: 'anywhere'
            }}>
              {block.content?.text || 'Heading text...'}
            </span>
          </div>
        )}

        {block.type === 'text' && (
          <div style={{
            textAlign: (block.styles?.alignment || 'Left').toLowerCase(),
            fontFamily: block.styles?.fontFamily === 'Georgia' ? 'Georgia, serif' : block.styles?.fontFamily === 'Inter' ? "'Inter', sans-serif" : block.styles?.fontFamily === 'Roboto' ? "'Roboto', sans-serif" : block.styles?.fontFamily ? `'${block.styles.fontFamily}', sans-serif` : "'Poppins', sans-serif",
            fontSize: block.styles?.fontSize || '15px',
            fontWeight: (block.styles?.fontWeight || '').toLowerCase() === 'bold' || block.styles?.fontWeight === '700' ? 700 : (block.styles?.fontWeight || '').toLowerCase() === 'semibold' || block.styles?.fontWeight === '600' ? 600 : 400,
            color: block.styles?.color || '#334155',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            flex: 1,
            height: '100%',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            overflow: 'hidden'
          }}>
            {block.content?.text || 'Standard paragraph writing text...'}
          </div>
        )}

        {block.type === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1, minHeight: 0, height: '100%', width: '100%' }}>
            {block.content?.url ? (
              <div style={{ width: '100%', flex: 1, minHeight: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={resolveMediaUrl(block.content.url)}
                  alt="Canvas block illustration"
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: block.styles?.objectFit || 'contain', display: 'block', pointerEvents: 'none' }}
                />
              </div>
            ) : (
              <div style={{ width: '100%', flex: 1, minHeight: '60px', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <FiImage style={{ fontSize: '1.8rem', marginBottom: '4px', opacity: 0.6 }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>No Image Loaded</span>
              </div>
            )}
            {block.content?.caption && (
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic' }}>{block.content.caption}</span>
            )}
            {block.content?.hasQuestion && (
              <div style={{ width: '100%', marginTop: '0.35rem', padding: '0.4rem 0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {block.content.questionText || 'Answer the question:'}
                </div>
                {block.content.questionOptions && block.content.questionOptions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {block.content.questionOptions.map((opt, oIdx) => (
                      <span key={oIdx} style={{ fontSize: '0.6rem', padding: '1px 5px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', color: '#475569' }}>
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {block.type === 'audio' && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, height: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.95rem', flexShrink: 0 }}>
                <FiVolume2 />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.content?.title || 'Voice Instruction'}</div>
                <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: 1 }}>{(block.content?.url || block.content?.audio) ? 'Audio track ready' : 'No track attached'}</div>
              </div>
            </div>
            {(block.content?.url || block.content?.audio) ? (
              <CustomAudioPlayer src={resolveMediaUrl(block.content?.url || block.content?.audio)} />
            ) : (
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', background: '#ffffff', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
                Select track in right properties panel to play audio
              </div>
            )}
          </div>
        )}

        {block.type === 'video' && (
          <div style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '8px', overflow: 'hidden', flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {block.content?.url ? (
              <video src={resolveMediaUrl(block.content.url)} controls controlsList="nodownload noplaybackrate noremoteplayback" disablePictureInPicture onContextMenu={e => e.preventDefault()} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', flex: 1, display: 'block', objectFit: block.styles?.objectFit || 'contain' }} />
            ) : (
              <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', gap: '0.35rem', flex: 1 }}>
                <FiMonitor style={{ fontSize: '1.75rem' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>No Video Source Configured</span>
              </div>
            )}
          </div>
        )}

        {block.type === 'quiz' && (() => {
          const rawQuestions = block.content?.questions;
          const questionsList = rawQuestions && rawQuestions.length > 0
            ? rawQuestions
            : [{
              question: block.content?.question || 'Empty Quiz Question Description',
              options: block.content?.options || ['', '', '', ''],
              correctAnswerIndex: block.content?.correctAnswerIndex ?? 0
            }];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, height: '100%', overflowY: 'auto' }}>
              {questionsList.map((qObj, qIdx) => {
                const qText = qObj.question || `Question #${qIdx + 1}`;
                const options = qObj.options || ['', '', '', ''];
                const correctIdx = parseInt(qObj.correctAnswerIndex ?? qObj.correctAnswer) || 0;

                return (
                  <div key={qIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: '8px', padding: '0.65rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c2410c' }}>
                      {questionsList.length > 1 ? `#${qIdx + 1}: ` : ''}{qText}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {options.map((opt, oIdx) => {
                        const isCorrect = correctIdx === oIdx;
                        const optionText = typeof opt === 'object' ? opt?.text : opt;
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
                              fontSize: '0.72rem',
                              boxSizing: 'border-box'
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
                            <span style={{ color: optionText ? '#334155' : '#94a3b8' }}>{optionText || `Option ${oIdx + 1}`}</span>
                            {isCorrect && <span style={{ marginLeft: 'auto', color: '#16a34a', fontSize: '0.58rem', fontWeight: 'bold' }}>✓ Correct</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {block.type === 'dictation' && (() => {
          const rawItems = block.content?.items;
          const items = Array.isArray(rawItems) && rawItems.length > 0 
            ? rawItems 
            : [{ id: 'dict-1', audioUrl: block.content?.url || block.content?.audioUrl || '', text: block.content?.text || block.content?.targetText || '' }];
          const responseType = block.content?.responseType || (block.content?.options && block.content.options.length > 0 ? 'quiz' : 'text');
          const isQuizMode = responseType === 'quiz';
          const quizOptions = isQuizMode ? (block.content?.options || []) : [];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiVolume2 /> Dictation (Listening Module)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                <strong>Prompt/Question:</strong> {block.content?.question || 'Listen and type what you hear.'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {items.map((item, idx) => {
                  const audioSrc = item.audioUrl || item.url;
                  return (
                    <div key={item.id || idx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0284c7' }}>Track #{idx + 1}</div>
                      {audioSrc ? (
                        <CustomAudioPlayer src={resolveMediaUrl(audioSrc)} />
                      ) : (
                        <div style={{ fontSize: '0.64rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.2rem 0' }}>
                          Attach dictation audio file in right properties panel
                        </div>
                      )}

                      {quizOptions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '4px' }}>
                          <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#1e40af' }}>Quiz Options:</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.35rem' }}>
                            {quizOptions.map((opt, oIdx) => {
                              const isCorrect = (block.content?.correctAnswer ?? 0) === oIdx;
                              const optText = typeof opt === 'object' ? opt?.text || '' : opt;
                              return (
                                <div key={oIdx} style={{ fontSize: '0.68rem', padding: '0.3rem 0.5rem', background: isCorrect ? '#dcfce7' : '#f8fafc', border: isCorrect ? '1.5px solid #22c55e' : '1px solid #cbd5e1', borderRadius: '6px', color: isCorrect ? '#15803d' : '#334155', fontWeight: isCorrect ? 700 : 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + oIdx)}.</span> {optText} {isCorrect && '✓'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <input type="text" disabled placeholder="User types response here..." style={{ width: '100%', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '0.7rem', background: '#f8fafc' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {block.type === 'grammar_correction' && (
          <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #a7f3d0', background: '#ecfdf5', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCheckCircle /> Grammar Correction
            </div>
            <div style={{ fontSize: '0.72rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '6px' }}>
              <strong>Incorrect:</strong> {block.content?.incorrectSentence || 'They is going to school.'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#15803d', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '6px', padding: '6px' }}>
              <strong>Corrected:</strong> {block.content?.correctedSentence || 'They are going to school.'}
            </div>
          </div>
        )}

        {block.type === 'reading_passage' && (() => {
          const rawPassages = block.content?.passages;
          const passages = rawPassages && rawPassages.length > 0
            ? rawPassages
            : [{
                title: block.content?.title || '',
                passage: block.content?.passage || '',
                question: block.content?.question || ''
              }];

          return (
            <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #cbd5e1', background: '#f1f5f9', borderRadius: '8px', padding: '0.75rem', overflowY: 'auto' }}>
              {passages.map((p, pIdx) => {
                const passageText = p.passage || 'Read this text carefully...';
                return (
                  <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: pIdx < passages.length - 1 ? '1px dashed #cbd5e1' : 'none', paddingBottom: pIdx < passages.length - 1 ? '0.5rem' : 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiFileText /> Reading Passage{passages.length > 1 ? ` #${pIdx + 1}` : ''}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#334155', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                      {passageText}
                    </div>
                    {p.question && (
                      <div style={{ fontSize: '0.7rem', color: '#475569', fontStyle: 'italic', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px' }}>
                        Question: {p.question}
                      </div>
                    )}
                  </div>
                );
              })}
              <button disabled style={{ width: 'fit-content', padding: '4px 12px', borderRadius: '20px', background: '#10b981', color: '#fff', border: 'none', fontSize: '0.68rem', fontWeight: 600, marginTop: '4px' }}>Mark as Read</button>
            </div>
          );
        })()}

        {block.type === 'writing_prompt' && (() => {
          const userText = block.content?.text || block.content?.value || block.content?.placeholder || '';
          const currentWords = userText.trim() ? userText.trim().split(/\s+/).filter(Boolean).length : 0;
          return (
            <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fbcfe8', background: '#fdf2f8', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9d174d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiEdit2 /> Writing Prompt (Word Count Gate)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                Prompt: {block.content?.prompt || 'Write about your favorite hobby.'}
              </div>
              <textarea
                value={block.content?.text || block.content?.value || ''}
                onChange={e => handleUpdateBlockContent('text', e.target.value)}
                placeholder={block.content?.placeholder || 'Start writing here...'}
                style={{ width: '100%', height: '50px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '6px', fontSize: '0.72rem', background: '#ffffff', resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#9d174d', fontWeight: 600 }}>
                <span>Minimum word count: {block.content?.minWords || 10} words</span>
                <span>{currentWords} words</span>
              </div>
            </div>
          );
        })()}

        {block.type === 'voice_recorder' && (
          <div style={{ flex: 1, height: '100%', minHeight: 0, border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <FiMic style={{ fontSize: '1.8rem', color: '#d97706' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309' }}>Speaking Practice Module</div>
              <div style={{ fontSize: '0.68rem', color: '#b45309', marginTop: '2px' }}>{block.content?.prompt || 'Record your response.'}</div>
            </div>
          </div>
        )}

        {block.type === 'drag_drop' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af' }}>
              Drag & Drop: {block.content?.question || 'Match items by dragging'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569' }}>Sources (Draggable):</span>
              {(block.content?.pairs || []).map((p, pIdx) => (
                <span key={pIdx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600, color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {(p.sourceImage || p.source_image) && (
                    <img src={resolveMediaUrl(p.sourceImage || p.source_image)} alt="" style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover' }} />
                  )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #a7f3d0', background: '#ecfdf5', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46' }}>
              Fill in the Blanks: {block.content?.question || 'Complete the text template'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(() => {
                const items = block.content?.items || (block.content?.text ? [{ id: 'migrated', text: block.content.text }] : []);
                return items.map((item, itemIdx) => {
                  const text = item.text || '';
                  const parts = text.split(/(\[[^\]]+\])/);
                  return (
                    <div key={item.id || itemIdx} style={{ fontSize: '0.75rem', color: '#374151', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.6rem 0.75rem', lineHeight: 1.8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px' }}>
                      {parts.map((part, pIdx) => {
                        if (part.startsWith('[') && part.endsWith(']')) {
                          return (
                            <span
                              key={pIdx}
                              style={{
                                display: 'inline-block',
                                minWidth: '60px',
                                height: '22px',
                                borderBottom: '2px dashed #059669',
                                background: '#f0fdf4',
                                borderRadius: '4px',
                                margin: '0 4px',
                                padding: '0 6px',
                                verticalAlign: 'middle'
                              }}
                              title="Blank input slot"
                            />
                          );
                        }
                        return <span key={pIdx}>{part}</span>;
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {block.type === 'match' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #e9d5ff', background: '#f3e8ff', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b21a8' }}>
              Match Items: {block.content?.question || 'Pair Column A with Column B'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>Column A</span>
                {(block.content?.leftItems || []).map((left, pIdx) => (
                  <div key={pIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{left || `Item ${pIdx + 1}`}</span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>Column B</span>
                {(block.content?.rightItems || []).map((right, pIdx) => (
                  <div key={pIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                    <span>{right || `Match ${pIdx + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {block.type === 'sequence' && (
          <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '8px', padding: '0.75rem' }}>
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
          <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fbcfe8', background: '#fce7f3', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9d174d' }}>
              Flashcard Cards Deck
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.25rem', marginTop: '0.25rem' }}>
              {(block.content?.cards || []).map((card, cIdx) => {
                const cardImg = resolveMediaUrl(card.imageUrl || card.image);
                return (
                  <div key={cIdx} style={{ flexShrink: 0, width: '130px', height: '95px', background: '#ffffff', border: '1px solid #fbcfe8', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 4px rgba(157, 23, 77, 0.05)' }}>
                    <div style={{ flex: 1, padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #fce7f3', textAlign: 'center', gap: '2px' }}>
                      {cardImg && (
                        <img src={cardImg} alt="" style={{ width: '28px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                      )}
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9d174d' }}>{card.front || 'Front'}</span>
                    </div>
                    <div style={{ background: '#fdf2f8', padding: '4px 6px', fontSize: '0.58rem', color: '#64748b', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={card.back}>
                      {card.back || 'Back description'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {block.type === 'sentence_builder' && (() => {
          const rawSentences = block.content?.sentences;
          const sentences = rawSentences && rawSentences.length > 0
            ? rawSentences
            : [{ question: block.content?.question || '', sentence: block.content?.sentence || '', words: block.content?.words || [] }];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #b3e5fc', background: '#e1f5fe', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%', overflowY: 'auto' }}>
              {sentences.map((item, sIdx) => {
                const questionText = item.question?.trim();
                const sentenceText = item.sentence || 'No sentence typed';
                const originalWords = item.words && item.words.length > 0
                  ? item.words
                  : (item.sentence?.trim() ? item.sentence.trim().split(' ').filter(Boolean) : []);
                const wordsList = getScrambledWords(originalWords);

                return (
                  <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: sIdx < sentences.length - 1 ? '1px dashed #93c5fd' : 'none', paddingBottom: sIdx < sentences.length - 1 ? '0.5rem' : 0 }}>
                    {questionText && (
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0277bd' }}>
                        {questionText}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: '#ffffff', border: '1px solid #b3e5fc', borderRadius: '8px', padding: '0.5rem' }}>
                      {wordsList.length > 0 ? (
                        wordsList.map((word, wIdx) => (
                          <span key={wIdx} style={{ background: '#f1f5f9', border: '1px dashed #0284c7', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, color: '#0284c7' }}>
                            {word}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Type a target sentence in sidebar to generate words...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {block.type === 'word_search' && (() => {
          const wordQuestion = block.content?.question || 'Word Search Puzzle: Find the hidden words in the grid.';
          const gridSize = block.content?.gridSize || 8;
          const rawWords = block.content?.words || ['ROBOT', 'AI', 'CODE', 'FUTURE'];
          const words = Array.isArray(rawWords) && rawWords.length > 0 ? rawWords : ['ROBOT', 'AI', 'CODE', 'FUTURE'];

          // Generate a realistic grid preview
          const seedString = words.join(',') + '_' + gridSize;
          let h = 1779033703 ^ seedString.length;
          for (let i = 0; i < seedString.length; i++) {
            h = Math.imul(h ^ seedString.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
          }
          const seededRandom = () => {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return ((h ^= h >>> 16) >>> 0) / 4294967296;
          };

          const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
          const directions = [[1, 0], [0, 1]];

          words.forEach(wStr => {
            const cleanWord = (wStr || '').toUpperCase().replace(/[^A-Z]/g, '');
            if (!cleanWord) return;
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 80) {
              attempts++;
              const dir = directions[Math.floor(seededRandom() * directions.length)];
              const dx = dir[0];
              const dy = dir[1];
              const startX = Math.floor(seededRandom() * (gridSize - (dx === 1 ? cleanWord.length : 0)));
              const startY = Math.floor(seededRandom() * (gridSize - (dy === 1 ? cleanWord.length : 0)));
              let canPlace = true;
              for (let i = 0; i < cleanWord.length; i++) {
                const x = startX + i * dx;
                const y = startY + i * dy;
                if (grid[y][x] !== '' && grid[y][x] !== cleanWord[i]) {
                  canPlace = false;
                  break;
                }
              }
              if (canPlace) {
                for (let i = 0; i < cleanWord.length; i++) {
                  const x = startX + i * dx;
                  const y = startY + i * dy;
                  grid[y][x] = cleanWord[i];
                }
                placed = true;
              }
            }
          });

          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
              if (grid[r][c] === '') {
                grid[r][c] = alphabet[Math.floor(seededRandom() * alphabet.length)];
              }
            }
          }

          return (
            <div style={{
              flex: 1,
              height: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              border: '1.5px solid #c7d2fe',
              background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
              borderRadius: '12px',
              padding: '0.85rem',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.06)',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff', paddingBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3730a3', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.95rem' }}>🔍</span> Word Search Puzzle
                </div>
                <span style={{ background: '#4f46e5', color: '#ffffff', fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(79,70,229,0.2)' }}>
                  {words.length} {words.length === 1 ? 'Word' : 'Words'}
                </span>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#4338ca', fontWeight: 600, background: '#ffffff', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid #e0e7ff' }}>
                {wordQuestion}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: '0.2rem' }}>
                {/* Letter Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  gap: '3px',
                  background: '#ffffff',
                  padding: '6px',
                  border: '1.5px solid #c7d2fe',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  width: gridSize > 8 ? '200px' : '170px',
                  maxWidth: '100%'
                }}>
                  {grid.flatMap((row, rIdx) => row.map((char, cIdx) => (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      style={{
                        aspectRatio: '1',
                        background: '#f5f3ff',
                        border: '1px solid #e0e7ff',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: gridSize > 8 ? '0.58rem' : '0.68rem',
                        fontWeight: 800,
                        color: '#3730a3',
                        userSelect: 'none'
                      }}
                    >
                      {char}
                    </div>
                  )))}
                </div>

                {/* Word Bank */}
                <div style={{ flex: 1, minWidth: '120px', background: '#ffffff', border: '1px solid #e0e7ff', borderRadius: '10px', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    📋 Hidden Words
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {words.map((w, wIdx) => (
                      <span
                        key={wIdx}
                        style={{
                          background: '#f5f3ff',
                          border: '1px solid #c7d2fe',
                          borderRadius: '16px',
                          padding: '2px 8px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: '#4338ca',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6366f1' }}></span>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {block.type === 'pronunciation' && (
          <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiMic /> Pronunciation: {block.content?.question || 'Practice pronouncing words correctly'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(() => {
                const items = block.content?.items || (block.content?.word ? [{ id: 'migrated', word: block.content.word, phonetic: block.content.phonetic }] : []);
                return items.map((item, itemIdx) => (
                  <div key={item.id || itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '6px', padding: '0.45rem 0.65rem' }}>
                    <div style={{
                      fontFamily: block.styles?.fontFamily || 'inherit',
                      fontSize: block.styles?.fontSize || '0.82rem',
                      fontWeight: block.styles?.fontWeight === 'Bold' ? 700 : block.styles?.fontWeight === 'SemiBold' ? 600 : block.styles?.fontWeight === 'Normal' ? 400 : 700,
                      color: block.styles?.color || '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <span style={{ color: '#b45309', fontWeight: 800 }}>{itemIdx + 1}.</span>
                      <span>{item.word || `Word ${itemIdx + 1}`}</span>
                    </div>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#f59e0b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem'
                    }} title="Record Audio">
                      <FiMic />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {block.type === 'input' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            border: '1.5px solid #60a5fa',
            background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
            borderRadius: '12px',
            padding: '1.1rem',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem'
                }}>
                  <FiType />
                </div>
                <span>{block.content?.label || block.content?.question || 'Text Input Field'}</span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#3b82f6', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px' }}>
                {block.content?.inputType === 'textarea' ? 'Multi-line Text' : 'Single Line Input'}
              </span>
            </div>

            {block.content?.prompt && (
              <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.45, fontWeight: 500 }}>
                {block.content.prompt}
              </div>
            )}

            <div style={{ position: 'relative', width: '100%' }}>
              {block.content?.inputType === 'textarea' ? (
                <textarea
                  disabled
                  placeholder={block.content?.placeholder || 'Type your response here...'}
                  rows={block.content?.rows || 3}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    padding: '10px 12px',
                    fontSize: '0.78rem',
                    background: '#ffffff',
                    color: '#334155',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
                  }}
                />
              ) : (
                <input
                  type="text"
                  disabled
                  placeholder={block.content?.placeholder || 'Type your response here...'}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    padding: '0 12px',
                    fontSize: '0.78rem',
                    background: '#ffffff',
                    color: '#334155',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
                  }}
                />
              )}
            </div>

            {(block.content?.maxLength || block.content?.correctAnswer) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', paddingTop: '2px' }}>
                {block.content?.correctAnswer ? (
                  <span><strong style={{ color: '#059669' }}>Target Answer:</strong> {block.content.correctAnswer}</span>
                ) : <span />}
                {block.content?.maxLength ? (
                  <span>Max characters: <strong>{block.content.maxLength}</strong></span>
                ) : null}
              </div>
            )}
          </div>
        )}



        {block.type === 'true_false' && (() => {
          const rawStatements = block.content?.statements;
          const statements = rawStatements && rawStatements.length > 0
            ? rawStatements
            : [{ question: block.content?.question || 'Is this statement true?', correctAnswer: block.content?.correctAnswer !== undefined ? block.content.correctAnswer : true }];

          return (
            <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: '8px', padding: '0.75rem', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCheckCircle /> True / False Challenge ({statements.length} Statement{statements.length > 1 ? 's' : ''})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {statements.map((stmt, sIdx) => (
                  <div key={sIdx} style={{ background: '#ffffff', border: '1px solid #ffedd5', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155' }}>
                      <span style={{ fontWeight: 700, color: '#ea580c', marginRight: '4px' }}>#{sIdx + 1}:</span>
                      {stmt.question || 'Is this statement true?'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button disabled style={{ flex: 1, padding: '4px', borderRadius: '6px', border: stmt.correctAnswer ? '1.5px solid #16a34a' : '1px solid #cbd5e1', background: stmt.correctAnswer ? '#dcfce7' : '#fff', color: stmt.correctAnswer ? '#16a34a' : '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>
                        True {stmt.correctAnswer && '✓'}
                      </button>
                      <button disabled style={{ flex: 1, padding: '4px', borderRadius: '6px', border: !stmt.correctAnswer ? '1.5px solid #16a34a' : '1px solid #cbd5e1', background: !stmt.correctAnswer ? '#dcfce7' : '#fff', color: !stmt.correctAnswer ? '#16a34a' : '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>
                        False {!stmt.correctAnswer && '✓'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {block.type === 'you_ask' && (
          <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiHelpCircle /> You Ask Block
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              {block.content?.prompt || 'Ask a question about the topic'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem', color: '#64748b' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: block.content?.recordingRequired ? '#10b981' : '#ef4444' }}></span>
              Recording Required | Max Duration: {block.content?.maxDuration || 10}s
            </div>
          </div>
        )}

        {block.type === 'roleplay_simulation' && (() => {
          const npcName = block.content?.npcCharacter !== undefined ? block.content.npcCharacter : 'NPC';
          const userRole = block.content?.userRole !== undefined ? block.content.userRole : 'Student';
          const npcAvatarUrl = resolveMediaUrl(block.content?.npcImage || block.content?.npcAvatarUrl || block.content?.speakerAAvatarUrl);
          const studentAvatarUrl = resolveMediaUrl(block.content?.userAvatarUrl || block.content?.speakerBAvatarUrl);
          const turns = block.content?.conversation || [];

          return (
            <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', border: '1px solid #c084fc', background: '#faf5ff', borderRadius: '8px', padding: '0.75rem', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiUsers /> Roleplay Simulation
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {npcAvatarUrl && (
                    <img
                      src={npcAvatarUrl}
                      alt={npcName}
                      title={`NPC: ${npcName}`}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #a855f7' }}
                    />
                  )}
                  {studentAvatarUrl && (
                    <img
                      src={studentAvatarUrl}
                      alt={userRole}
                      title={`Student: ${userRole}`}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }}
                    />
                  )}
                </div>
              </div>

              {block.content?.scenario && (
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                  <strong>Scenario:</strong> {block.content.scenario}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                {turns.length > 0 ? (
                  turns.map((t, tIdx) => {
                    const isNpc = t.speaker === 'npc' || t.speaker === 'NPC Speaker' || !t.speaker;
                    const speakerName = isNpc ? npcName : userRole;
                    const text = t.text || t.prompt || '(No dialogue provided)';
                    const currentAvatar = isNpc ? npcAvatarUrl : studentAvatarUrl;

                    return (
                      <div
                        key={tIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: isNpc ? 'flex-start' : 'flex-end',
                          gap: '0.5rem',
                          alignSelf: isNpc ? 'flex-start' : 'flex-end',
                          maxWidth: '85%'
                        }}
                      >
                        {isNpc && (
                          currentAvatar ? (
                            <img
                              src={currentAvatar}
                              alt={speakerName}
                              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#e9d5ff', color: '#6b21a8', flexShrink: 0 }}>
                              {speakerName}
                            </span>
                          )
                        )}

                        <div style={{
                          background: isNpc ? '#ffffff' : '#3b82f6',
                          color: isNpc ? '#1e293b' : '#ffffff',
                          border: isNpc ? '1px solid #e9d5ff' : 'none',
                          borderRadius: isNpc ? '10px 10px 10px 2px' : '10px 10px 2px 10px',
                          padding: '0.45rem 0.65rem',
                          textAlign: isNpc ? 'left' : 'right',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: isNpc ? '#6b21a8' : '#e0f2fe' }}>{speakerName}</div>
                          <div style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>{text}</div>

                          {!isNpc && (block.content?.allowAudioRecord !== false) && (t.allowAudioRecord !== false) && (
                            <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <button
                                type="button"
                                style={{
                                  background: 'rgba(255,255,255,0.25)',
                                  border: 'none',
                                  borderRadius: '12px',
                                  padding: '2px 8px',
                                  color: '#ffffff',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                <FiMic style={{ fontSize: '0.7rem' }} /> Record Answer
                              </button>
                            </div>
                          )}
                        </div>

                        {!isNpc && (
                          currentAvatar ? (
                            <img
                              src={currentAvatar}
                              alt={speakerName}
                              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#3b82f6', color: '#ffffff', flexShrink: 0 }}>
                              {speakerName}
                            </span>
                          )
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>
                    No dialogue turns added yet.
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {block.type === 'hotspot_explorer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', position: 'relative', overflow: 'hidden', flex: 1, height: '100%', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiGrid /> Hotspot Explorer
              </div>
              {block.content?.hotspots && block.content.hotspots.length > 0 && (
                <div style={{ fontSize: '0.65rem', background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af', borderRadius: '12px', padding: '2px 8px', fontWeight: 600 }}>
                  🎯 Click image to set target #{(activeHotspotIndex < block.content.hotspots.length ? activeHotspotIndex : 0) + 1}
                </div>
              )}
            </div>
            {block.content?.imageUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relX = Math.round(((e.clientX - rect.left) / rect.width) * 400);
                    const relY = Math.round(((e.clientY - rect.top) / rect.height) * 250);
                    const hotspots = [...(block.content.hotspots || [])];
                    if (hotspots.length > 0) {
                      const targetIdx = activeHotspotIndex < hotspots.length ? activeHotspotIndex : 0;
                      hotspots[targetIdx] = { ...hotspots[targetIdx], x: relX, y: relY };
                      handleUpdateBlockContent('hotspots', hotspots);
                    }
                  }}
                  style={{ position: 'relative', width: '100%', height: block.styles?.height || 'auto', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'block', cursor: 'crosshair' }}
                >
                  <img
                    src={resolveMediaUrl(block.content.imageUrl)}
                    alt="Hotspot explorer source"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: block.styles?.height && block.styles?.height !== 'auto' ? block.styles.height : 'auto',
                      maxHeight: '450px',
                      objectFit: block.styles?.objectFit || 'cover',
                      display: 'block',
                      pointerEvents: 'none'
                    }}
                  />
                  {(block.content.hotspots || []).map((h, hidx) => {
                    const isActive = hidx === (activeHotspotIndex < (block.content.hotspots || []).length ? activeHotspotIndex : 0);
                    return (
                      <div
                        key={h.id || hidx}
                        title={h.name || `Target ${hidx + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveHotspotIndex(hidx);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${(h.x / 400) * 100}%`,
                          top: `${(h.y / 250) * 100}%`,
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isActive
                            ? 'radial-gradient(circle, #2563eb 0%, #1d4ed8 100%)'
                            : 'radial-gradient(circle, #ef4444 0%, #dc2626 100%)',
                          border: isActive ? '3px solid #60a5fa' : '2px solid #ffffff',
                          boxShadow: isActive
                            ? '0 0 12px rgba(37, 99, 235, 0.9), 0 2px 6px rgba(0,0,0,0.4)'
                            : '0 0 10px rgba(239, 68, 68, 0.7), 0 2px 4px rgba(0,0,0,0.3)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          transform: 'translate(-50%, -50%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 5,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {hidx + 1}
                      </div>
                    );
                  })}
                </div>

                {/* Compact Column-Wise Target Name Chips below Image */}
                {block.content?.hotspots && block.content.hotspots.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {block.content.hotspots.map((hs, idx) => {
                      const isActive = idx === (activeHotspotIndex < block.content.hotspots.length ? activeHotspotIndex : 0);
                      return (
                        <div
                          key={hs.id || idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveHotspotIndex(idx);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.75rem',
                            background: isActive ? '#eff6ff' : '#ffffff',
                            border: isActive ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                            borderRadius: '20px',
                            boxShadow: isActive ? '0 2px 6px rgba(59, 130, 246, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: isActive ? '#1d4ed8' : '#334155',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          <span style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: isActive ? '#2563eb' : '#ef4444',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {idx + 1}
                          </span>
                          <span>{hs.name || `Target ${idx + 1}`}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#94a3b8', fontSize: '0.7rem' }}>
                No target explorer image selected
              </div>
            )}
          </div>
        )}

        {block.type === 'functional_reading' && (() => {
          const docType = (block.content?.documentType || 'poster').toLowerCase();
          const isTextDoc = docType === 'text';
          const docUrl = block.content?.documentUrl || block.content?.url || '';
          const resolvedDocImg = docUrl ? resolveMediaUrl(docUrl) : '';
          const docText = block.content?.documentText || '';
          const questionsList = block.content?.questions || [];

          return (
            <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid #818cf8', background: '#eef2ff', borderRadius: '8px', padding: '0.75rem', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiFileText /> Functional Reading
                </div>
                <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: '#c7d2fe', color: '#312e81', borderRadius: '8px', textTransform: 'uppercase', fontWeight: 700 }}>
                  {isTextDoc ? 'TEXT' : 'POSTER'}
                </span>
              </div>

              {block.content?.scenario && (
                <div style={{ fontSize: '0.68rem', color: '#475569', background: '#ffffff', padding: '4px 6px', borderRadius: '4px', borderLeft: '2px solid #6366f1' }}>
                  {block.content.scenario}
                </div>
              )}

              {isTextDoc ? (
                docText ? (
                  <div style={{ width: '100%', borderRadius: '6px', border: '1px solid #c7d2fe', background: '#ffffff', padding: '0.6rem', fontSize: '0.72rem', color: '#1e293b', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>
                    {docText}
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '70px', border: '1px dashed #a5b4fc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '0.68rem', background: '#ffffff' }}>
                    No document text provided
                  </div>
                )
              ) : (
                resolvedDocImg ? (
                  <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid #c7d2fe', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                    <img
                      src={resolvedDocImg}
                      alt="Functional Reading Document"
                      style={{ width: '100%', maxHeight: '160px', objectFit: block.styles?.objectFit || 'contain', borderRadius: '4px' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '70px', border: '1px dashed #a5b4fc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '0.68rem', background: '#ffffff' }}>
                    No document file selected
                  </div>
                )
              )}

              {questionsList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px dashed #c7d2fe', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#3730a3' }}>Questions ({questionsList.length}):</span>
                  {questionsList.map((q, qIdx) => (
                    <div key={q.id || qIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #c7d2fe' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#1e293b' }}>
                        {qIdx + 1}. {q.question || 'Question prompt...'}
                      </div>
                      <input
                        type="text"
                        disabled
                        placeholder="Write answer here..."
                        style={{ height: '24px', fontSize: '0.65rem', borderRadius: '4px', border: '1px solid #cbd5e1', padding: '0 6px', background: '#f8fafc' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {block.type === 'audio_mystery' && (
          <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #67e8f9', background: '#ecfeff', borderRadius: '8px', padding: '0.75rem', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0891b2', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiVolume2 /> Audio Mystery
            </div>

            {/* Main Audio file if present */}
            {(block.content?.url || block.content?.audio) && (
              <div style={{ background: '#ffffff', padding: '0.4rem', borderRadius: '6px', border: '1px solid #7dd3fc' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0369a1', marginBottom: '2px' }}>Main Audio Track:</div>
                <CustomAudioPlayer src={resolveMediaUrl(block.content?.url || block.content?.audio)} />
              </div>
            )}

            {/* Progressive Audios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0e7490' }}>
                Progressive Audios ({(block.content?.clues || []).length}):
              </div>
              {(block.content?.clues && block.content.clues.length > 0 ? block.content.clues : [
                { audio: '', duration: 5, description: 'Audio 1: Introductory Sound' },
                { audio: '', duration: 10, description: 'Audio 2: Distinct Pattern' }
              ]).map((c, cIdx) => (
                <div key={cIdx} style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '0.4rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', fontWeight: 600, color: '#0369a1' }}>
                    <span>🔊 Audio #{cIdx + 1}: {c.description || `Audio track (${c.duration || 5}s)`}</span>
                  </div>
                  {c.audio ? (
                    <div>
                      <CustomAudioPlayer src={resolveMediaUrl(c.audio)} />
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontStyle: 'italic' }}>No audio file uploaded for Audio #{cIdx + 1}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Question displayed directly above Options */}
            <div style={{ fontSize: '0.72rem', color: '#334155', background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #bae6fd', marginTop: '0.2rem' }}>
              <strong>Question:</strong> {block.content?.question || 'What is being described in the audio?'}
            </div>

            {/* Answer Options displayed like Quiz Options */}
            {block.content?.options && block.content.options.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0e7490' }}>Options:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
                  {block.content.options.map((opt, oIdx) => {
                    const isCorrect = (block.content?.correctAnswer ?? 0) === oIdx;
                    const optText = typeof opt === 'object' ? opt?.text || '' : opt;
                    return (
                      <div
                        key={oIdx}
                        style={{
                          padding: '0.4rem 0.6rem',
                          background: isCorrect ? '#ecfdf5' : '#ffffff',
                          border: isCorrect ? '1.5px solid #10b981' : '1px solid #bae6fd',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: isCorrect ? '#047857' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: isCorrect ? '#10b981' : '#cbd5e1',
                          color: isCorrect ? '#ffffff' : '#475569',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{optText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

          const makeTopDragger = () => (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const startY = e.clientY;
                const el = e.currentTarget.parentElement;
                const initH = el.offsetHeight;
                const initTop = parseInt(block.styles?.top) || 0;
                const scale = (zoomLevel / 100) || 1;
                const move = (mv) => {
                  const deltaY = (mv.clientY - startY) / scale;
                  const newH = Math.max(60, initH - deltaY);
                  const newTop = Math.max(0, initTop + deltaY);
                  el.style.minHeight = `${newH}px`;
                  el.style.height = `${newH}px`;
                  el.style.top = `${newTop}px`;
                  const elements = (screenForm.elements || []).map(el2 =>
                    el2.id === block.id ? { ...el2, styles: { ...el2.styles, minHeight: `${newH}px`, top: `${newTop}px` } } : el2
                  );
                  setScreenForm(prev => ({ ...prev, elements }));
                };
                const up = () => {
                  window.removeEventListener('mousemove', move);
                  window.removeEventListener('mouseup', up);
                  setScreenForm(prev => {
                    pushHistory(prev.elements);
                    return prev;
                  });
                };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '12px', cursor: 'ns-resize', zIndex: 15, background: 'transparent' }}
              title="Drag top side to resize height"
            />
          );

          const makeBottomDragger = () => (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const startY = e.clientY;
                const el = e.currentTarget.parentElement;
                const initH = el.offsetHeight;
                const canvasEl = el.closest('[data-canvas-area="true"]');
                const canvasH = canvasEl ? canvasEl.offsetHeight : 9999;
                const elTop = parseInt(block.styles?.top) || 0;
                const scale = (zoomLevel / 100) || 1;
                const move = (mv) => {
                  const maxH = Math.max(60, canvasH - elTop);
                  const newH = Math.min(maxH, Math.max(60, initH + (mv.clientY - startY) / scale));
                  el.style.minHeight = `${newH}px`;
                  el.style.height = `${newH}px`;
                  const elements = (screenForm.elements || []).map(el2 =>
                    el2.id === block.id ? { ...el2, styles: { ...el2.styles, minHeight: `${newH}px` } } : el2
                  );
                  setScreenForm(prev => ({ ...prev, elements }));
                };
                const up = () => {
                  window.removeEventListener('mousemove', move);
                  window.removeEventListener('mouseup', up);
                  setScreenForm(prev => {
                    pushHistory(prev.elements);
                    return prev;
                  });
                };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '12px', cursor: 'ns-resize', zIndex: 15, background: 'transparent' }}
              title="Drag to resize height"
            />
          );

          const makeLeftDragger = () => (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const startX = e.clientX;
                const el = e.currentTarget.parentElement;
                const initW = el.offsetWidth;
                const initLeft = parseInt(block.styles?.left) || 0;
                const scale = (zoomLevel / 100) || 1;
                const move = (mv) => {
                  const deltaX = (mv.clientX - startX) / scale;
                  const newW = Math.max(120, initW - deltaX);
                  const newLeft = Math.max(0, initLeft + (initW - newW));
                  el.style.width = `${newW}px`;
                  el.style.left = `${newLeft}px`;
                  const elements = (screenForm.elements || []).map(el2 =>
                    el2.id === block.id ? { ...el2, styles: { ...el2.styles, blockWidth: `${newW}px`, left: `${newLeft}px` } } : el2
                  );
                  setScreenForm(prev => ({ ...prev, elements }));
                };
                const up = () => {
                  window.removeEventListener('mousemove', move);
                  window.removeEventListener('mouseup', up);
                  setScreenForm(prev => {
                    pushHistory(prev.elements);
                    return prev;
                  });
                };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '12px', cursor: 'ew-resize', zIndex: 15, background: 'transparent' }}
              title="Drag left side to resize width"
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
                const canvasEl = el.closest('[data-canvas-area="true"]');
                const canvasW = canvasEl ? canvasEl.offsetWidth : 9999;
                const elLeft = parseInt(block.styles?.left) || 0;
                const scale = (zoomLevel / 100) || 1;
                const move = (mv) => {
                  const maxW = Math.max(120, canvasW - elLeft);
                  const newW = Math.min(maxW, Math.max(120, initW + (mv.clientX - startX) / scale));
                  el.style.width = `${newW}px`;
                  const elements = (screenForm.elements || []).map(el2 =>
                    el2.id === block.id ? { ...el2, styles: { ...el2.styles, blockWidth: `${newW}px` } } : el2
                  );
                  setScreenForm(prev => ({ ...prev, elements }));
                };
                const up = () => {
                  window.removeEventListener('mousemove', move);
                  window.removeEventListener('mouseup', up);
                  setScreenForm(prev => {
                    pushHistory(prev.elements);
                    return prev;
                  });
                };
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
                const canvasEl = el.closest('[data-canvas-area="true"]');
                const canvasW = canvasEl ? canvasEl.offsetWidth : 9999;
                const canvasH = canvasEl ? canvasEl.offsetHeight : 9999;
                const elLeft = parseInt(block.styles?.left) || 0;
                const elTop = parseInt(block.styles?.top) || 0;
                const scale = (zoomLevel / 100) || 1;
                const move = (mv) => {
                  const maxW = Math.max(120, canvasW - elLeft);
                  const maxH = Math.max(60, canvasH - elTop);
                  const newW = Math.min(maxW, Math.max(120, initW + (mv.clientX - startX) / scale));
                  const newH = Math.min(maxH, Math.max(60, initH + (mv.clientY - startY) / scale));
                  el.style.width = `${newW}px`;
                  el.style.minHeight = `${newH}px`;
                  el.style.height = `${newH}px`;
                  const elements = (screenForm.elements || []).map(el2 =>
                    el2.id === block.id ? { ...el2, styles: { ...el2.styles, blockWidth: `${newW}px`, minHeight: `${newH}px` } } : el2
                  );
                  setScreenForm(prev => ({ ...prev, elements }));
                };
                const up = () => {
                  window.removeEventListener('mousemove', move);
                  window.removeEventListener('mouseup', up);
                  setScreenForm(prev => {
                    pushHistory(prev.elements);
                    return prev;
                  });
                };
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
              {makeTopDragger()}
              {makeBottomDragger()}
              {makeLeftDragger()}
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
    pushHistory(elements);
  };

  const handleCloneBlock = (block) => {
    const elements = [...(screenForm.elements || [])];
    const idx = elements.findIndex(el => el.id === block.id);
    if (idx === -1) return;
    const cloned = JSON.parse(JSON.stringify(block));
    cloned.id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Shift top and left of the cloned block to avoid exact overlap
    if (cloned.styles) {
      if (cloned.styles.top) {
        const topVal = parseInt(cloned.styles.top) || 0;
        cloned.styles.top = `${topVal + 30}px`;
      } else {
        cloned.styles.top = '30px';
      }
      if (cloned.styles.left) {
        const leftVal = parseInt(cloned.styles.left) || 0;
        cloned.styles.left = `${leftVal + 30}px`;
      } else {
        cloned.styles.left = '30px';
      }
    } else {
      cloned.styles = { top: '30px', left: '30px' };
    }

    elements.splice(idx + 1, 0, cloned);
    setScreenForm(prev => ({ ...prev, elements }));
    pushHistory(elements);
    setSelectedBlockId(cloned.id);
    showFeedback(`Cloned block`);
  };

  const handleDeleteBlock = (blockId) => {
    const elements = (screenForm.elements || []).filter(el => el.id !== blockId);
    setScreenForm(prev => ({ ...prev, elements }));
    pushHistory(elements);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(elements.length > 0 ? elements[0].id : null);
    }
    showFeedback(`Deleted block`);
  };

  const handleUpdateBlockContent = (field, value) => {
    if (pendingBlock) {
      setPendingBlock(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [field]: value
        }
      }));
      return;
    }
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
    pushHistory(elements);
  };

  const handleUpdateBlockRemedial = (field, value) => {
    if (pendingBlock) {
      setPendingBlock(prev => {
        if (field === 'enableRemedial') {
          return {
            ...prev,
            enableRemedial: value,
            remedialConfig: prev.remedialConfig || { mode: 'ai_runtime', hintText: '', foundationQuestion: '', foundationOptions: [] }
          };
        } else {
          return {
            ...prev,
            remedialConfig: {
              ...(prev.remedialConfig || { mode: 'ai_runtime', hintText: '', foundationQuestion: '', foundationOptions: [] }),
              [field]: value
            }
          };
        }
      });
      return;
    }
    const elements = (screenForm.elements || []).map(el => {
      if (el.id === selectedBlockId) {
        if (field === 'enableRemedial') {
          return {
            ...el,
            enableRemedial: value,
            remedialConfig: el.remedialConfig || { mode: 'ai_runtime', hintText: '', foundationQuestion: '', foundationOptions: [] }
          };
        } else {
          return {
            ...el,
            remedialConfig: {
              ...(el.remedialConfig || { mode: 'ai_runtime', hintText: '', foundationQuestion: '', foundationOptions: [] }),
              [field]: value
            }
          };
        }
      }
      return el;
    });
    setScreenForm(prev => ({ ...prev, elements }));
  };

  const handleGenerateRemedialWithAI = async (block) => {
    setActionLoading(true);
    try {
      const topicText = block.content?.question || block.content?.text || block.content?.prompt || block.type;
      const targetLevel = selectedExperience?.difficulty || 'Intermediate';
      const res = await apiFetch('/api/v1/cms/ai-generate/', {
        method: 'POST',
        body: JSON.stringify({
          topic: topicText,
          target_level: targetLevel,
          content_type: 'remedial'
        })
      });
      const data = await res.json();
      if (res.ok) {
        const elements = (screenForm.elements || []).map(el => {
          if (el.id === block.id) {
            return {
              ...el,
              remedialConfig: {
                ...(el.remedialConfig || {}),
                hintText: data.hintText || '',
                foundationQuestion: data.foundationQuestion || '',
                foundationOptions: data.foundationOptions || [],
                correctAnswerIndex: data.correctAnswerIndex !== undefined ? data.correctAnswerIndex : 0
              }
            };
          }
          return el;
        });
        setScreenForm(prev => ({ ...prev, elements }));
        showFeedback('Remedial question pre-generated successfully!');
      } else {
        showFeedback(data.error || 'Failed to generate remedial question', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Network error occurred during remedial generation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBlockMultipleContent = (updates) => {
    if (pendingBlock) {
      setPendingBlock(prev => ({
        ...prev,
        content: {
          ...prev.content,
          ...updates
        }
      }));
      return;
    }
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
      pushHistory(elements);
      return { ...prev, elements };
    });
  };

  const handleUpdateBlockStyles = (field, value) => {
    if (pendingBlock) {
      setPendingBlock(prev => ({
        ...prev,
        styles: {
          ...prev.styles,
          [field]: value
        }
      }));
      return;
    }
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
    pushHistory(elements);
  };

  const handleSaveScreen = async (redirectToLibrary = true) => {
    if (!selectedScreen || !selectedScreen.id) return;
    setActionLoading(true);
    try {
      // Build backward-compatible single element fallbacks from the blocks list
      let fallbackText = screenForm.content || '';
      let fallbackSteps = [];
      let fallbackMediaUrl = screenForm.media_url || '';
      let fallbackMediaId = screenForm.media_id || '';
      let fallbackMediaType = screenForm.media_type || '';
      let fallbackQuizQuestion = screenForm.quiz_question || '';
      let fallbackQuizOptions = screenForm.quiz_options || ['', '', '', ''];
      let fallbackQuizCorrectIndex = screenForm.quiz_correct_index !== undefined ? screenForm.quiz_correct_index : 0;

      const blocks = screenForm.elements || [];
      const dialogueBlock = blocks.find(b => ['dialogue', 'roleplay_simulation', 'roleplay', 'role_play'].includes((b.type || '').toLowerCase()));
      if (dialogueBlock) {
        fallbackSteps = dialogueBlock.content?.steps || dialogueBlock.content?.conversation || [];
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
        fallbackQuizOptions = (quizBlock.content?.options || []).map(opt => typeof opt === 'object' ? (opt.text || '') : opt);
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
      console.error('Error saving screen:', err);
      showFeedback(err?.message || 'Network error occurred while saving screen', 'error');
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

    const detectFileType = (f) => {
      const mime = f.type || '';
      if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/')) return 'video';
      if (mime.startsWith('audio/')) return 'audio';
      const ext = f.name.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) return 'image';
      if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'wmv'].includes(ext)) return 'video';
      if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
      return 'other';
    };

    const fType = detectFileType(file);
    if (fType === 'image' && file.size > 10 * 1024 * 1024) {
      showFeedback("Image is too large. Upload less than 10MB.", "error");
      e.target.value = null;
      return;
    }
    if (fType === 'video' && file.size > 200 * 1024 * 1024) {
      showFeedback("Video is too large. Upload less than 200MB.", "error");
      e.target.value = null;
      return;
    }
    if (fType === 'audio' && file.size > 50 * 1024 * 1024) {
      showFeedback("Audio is too large. Upload less than 50MB.", "error");
      e.target.value = null;
      return;
    }

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

    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    const validImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    if (!file.type.startsWith('image/') || !validImageExts.includes(ext)) {
      showFeedback("Invalid file type. Thumbnails must be image files (JPG, PNG, WEBP). PDF and document files are not supported.", "error");
      e.target.value = null;
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showFeedback("Image is too large. Maximum thumbnail size allowed is 10MB.", "error");
      e.target.value = null;
      return;
    }
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
        showFeedback(errData.error || 'Failed to download package', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const targetFilename = filename
        ? filename.replace(/\.elab$/, '.zip')
        : `package_${versionId}.zip`;
      a.download = targetFilename.endsWith('.zip') ? targetFilename : `${targetFilename}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback('Package (.zip) downloaded!');
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
    setPublishPage(1);
    try {
      if (experienceId) {
        const resStatus = await apiFetch(`/api/v1/content/publish/${experienceId}/`);
        if (resStatus.ok) {
          const statusData = await resStatus.json();
          setPublishStatus(statusData);
          // Clear defaults — user must enter version/notes manually
          setPublishVersion('');
          setPublishNotes('');
        } else {
          setPublishVersion('');
          setPublishNotes('');
        }
      } else {
        setPublishStatus(null);
        setPublishVersion('');
        setPublishNotes('');
      }

      // Fetch GLOBAL history (all lessons) for the build history table
      const resHistory = await apiFetch(`/api/v1/content/publish/history/all/`);
      if (resHistory.ok) {
        const histData = await resHistory.json();
        setPublishHistory(histData.versions || []);
      }

      if (experienceId) {
        // Fetch this lesson's activities with real screen_count from backend
        const resActs = await apiFetch(`/api/v1/content/experiences/${experienceId}/activities/`);
        if (resActs.ok) {
          const actsData = await resActs.json();
          const actsArr = actsData.results || actsData || [];
          setActivities(actsArr);
        }
      } else {
        setActivities([]);
      }

    } catch (e) {
      console.error('Failed to load publish status, history, validation or assignment data', e);
    }
  };

  const handlePublishExperience = async () => {
    if (!selectedExperience || !selectedExperience.id) {
      triggerAlert('No active experience selected.', 'No Experience Selected', 'warning');
      return;
    }
    if (!publishVersion || !publishVersion.trim()) {
      triggerAlert('Please enter a valid version number (e.g. 1.0.0).', 'Version Required', 'warning');
      return;
    }
    if (!publishNotes || !publishNotes.trim()) {
      triggerAlert('Please enter release notes describing what changed in this build.', 'Release Notes Required', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/v1/content/publish/${selectedExperience.id}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: publishVersion.trim(), release_notes: publishNotes })
      });
      if (res.status === 200 || res.status === 201) {
        showFeedback('Experience submitted to Super Admin for approval.');
        setPublishNotes('');
        setPublishVersion('');
        loadPublishData(selectedExperience.id);
        loadExperiencesData();
      } else {
        const errData = await res.json().catch(() => ({}));
        // Handle empty-screen error with detailed list
        if (errData.empty_screens && errData.empty_screens.length > 0) {
          const screenList = errData.empty_screens
            .map(s => `• ${s.activity} → "${s.screen}"`)
            .join('\n');
          triggerAlert(
            `The following screens have no content blocks. Please add at least one block to each screen before submitting for approval:\n\n${screenList}`,
            'Empty Screens Detected',
            'error'
          );
          return;
        }
        if (errData.validation_report) {
          setValidationReport(errData.validation_report);
        }
        showFeedback(errData.error || 'Publishing failed. Make sure all screens have content blocks.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Network error occurred during packaging', 'error');
    } finally {
      setActionLoading(false);
    }
  };





  const handleStartPreview = async (targetExpId = null, targetActId = null, targetScrId = null) => {
    if (selectedScreen && selectedScreen.id && isEditingScreen) {
      try {
        await handleSaveScreen(false);
      } catch (err) {
        console.warn('Auto-save before preview error:', err);
      }
    }
    const expId = targetExpId || selectedExperience?.id;
    if (!expId) {
      setPreviewPayload(null);
      if (view !== 'preview') setPreviousView(view);
      setView('preview');
      return;
    }
    try {
      const res = await apiFetch(`/api/v1/content/experiences/${expId}/preview/`);
      if (res.ok) {
        const payload = await res.json();
        setPreviewPayload(payload);
        if (targetExpId && (!selectedExperience || selectedExperience.id !== targetExpId)) {
          const expObj = experiences.find(e => e.id === targetExpId);
          if (expObj) setSelectedExperience(expObj);
        }

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
        } else if (payload.activities) {
          const firstWithScreens = payload.activities.findIndex(a => a.screens && a.screens.length > 0);
          if (firstWithScreens !== -1) {
            actIdx = firstWithScreens;
          }
        }

        setPreviewActivityIndex(actIdx);
        setPreviewScreenIndex(scrIdx);
        setPreviewAnswerIndex(null);
        if (view !== 'preview') setPreviousView(view);
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
    <div className="cs-layout" style={{ backgroundImage: `url(${contentStudioBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
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
          background: linear-gradient(180deg, rgba(0, 106, 166, 0.82) 0%, rgba(0, 80, 128, 0.9) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: #cbd5e1;
          display: flex;
          flex-direction: column;
          height: 100%;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cs-sidebar.collapsed {
          width: 72px;
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
          background-color: transparent !important;
        }
        .cs-header {
          height: 60px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.07);
          background-color: rgba(248, 250, 252, 0.72) !important;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 1px 12px rgba(15, 23, 42, 0.05);
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
          grid-template-columns: repeat(3, 1fr);
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
        .cs-stat-card:hover {
          transform: translateY(-6px);
          border-color: #bae6fd;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.06), 0 5px 10px rgba(0, 0, 0, 0.02);
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
        .cs-badge-published, .cs-badge-approved {
          background-color: #dcfce7;
          color: #15803d;
        }
        .cs-badge-pending {
          background-color: #fef9c3;
          color: #854d0e;
        }
        .cs-badge-rejected {
          background-color: #fee2e2;
          color: #b91c1c;
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

        /* ── Responsive Mobile Media Queries ── */
        .cs-mobile-hamburger {
          display: none;
          background: transparent;
          border: none;
          color: #0f172a;
          font-size: 1.4rem;
          cursor: pointer;
          padding: 0.35rem;
          margin-right: 0.5rem;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }
        .cs-mobile-hamburger:hover {
          background-color: rgba(15, 23, 42, 0.06);
        }

        .cs-sidebar-overlay {
          display: none;
        }

        @media (max-width: 900px) {
          .cs-stat-row {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .cs-layout {
            position: relative;
            overflow-x: hidden;
          }

          .cs-mobile-hamburger {
            display: flex !important;
          }

          .cs-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            z-index: 9999 !important;
            width: 260px !important;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 8px 0 32px rgba(0, 0, 0, 0.3) !important;
          }

          .cs-sidebar.mobile-open {
            transform: translateX(0) !important;
          }

          .cs-sidebar-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 9998;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }

          .cs-sidebar-overlay.active {
            opacity: 1;
            pointer-events: auto;
          }

          .cs-header {
            padding: 0 0.85rem !important;
            height: 56px !important;
          }

          .cs-header-search-wrap {
            max-width: 160px;
          }

          .cs-search-input {
            width: 100% !important;
          }

          .cs-body {
            padding: 0.85rem !important;
          }

          .cs-stat-row {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }

          .cs-card {
            padding: 1rem !important;
          }

          /* Responsive Tables & Grids */
          .cs-table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          /* Studio builders split view mobile stack */
          .fss-container, .fss-split-view {
            flex-direction: column !important;
          }
          .fss-left, .fss-right, .fss-middle {
            width: 100% !important;
            max-width: 100% !important;
          }
        }

        @media (max-width: 480px) {
          .cs-header h2 {
            font-size: 1.05rem !important;
          }
          .cs-header-actions {
            gap: 0.5rem !important;
          }
          .cs-btn-primary, .cs-btn-outline {
            padding: 0.45rem 0.75rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>

      {/* ── Sidebar Mobile Backdrop Overlay ── */}
      <div
        className={`cs-sidebar-overlay ${mobileNavOpen ? 'active' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* ── Sidebar ── */}
      {true && (
        <aside className={`cs-sidebar ${navCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'mobile-open' : ''}`} style={{ overflow: showProfileDropdown ? 'visible' : 'hidden' }}>
          <div
            className="cs-brand"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: navCollapsed ? 'center' : 'space-between',
              gap: '0.75rem',
              padding: navCollapsed ? '1rem 0.5rem' : '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              overflow: 'hidden'
            }}
          >
            {!navCollapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src={logoIcon}
                  alt="Logo"
                  style={{
                    width: '48px',
                    height: '76px',
                    objectFit: 'contain'
                  }}
                />
                <div>
                  <h2 className="cs-brand-title">LinguaLab</h2>
                  <span className="cs-brand-sub">Content Studio</span>
                </div>
              </div>
            ) : (
              <img
                src={roundLogo}
                alt="Logo"
                onClick={toggleNavCollapsed}
                style={{
                  width: '28px',
                  height: '28px',
                  objectFit: 'contain',
                  cursor: 'pointer'
                }}
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

          <nav className="cs-nav" style={{ padding: navCollapsed ? '1rem 0.5rem' : '1.5rem 1rem' }}>
            {[
              { key: 'dashboard', label: 'Dashboard', icon: <FiGrid /> },
              { key: 'experiences', label: 'Lesson Library', icon: <FiBookOpen /> },
              { key: 'experience-builder', label: 'Lesson Builder', icon: <FiActivity /> },
              { key: 'activity-builder', label: 'Activity Builder', icon: <FiSettings /> },
              { key: 'screen-builder', label: 'Screen Builder', icon: <FiMonitor /> },
              { key: 'preview', label: 'Runtime Preview', icon: <FiPlay /> },
              { key: 'publish', label: 'Publish Center', icon: <FiDownload /> },
              { key: 'profile', label: 'Profile Settings', icon: <FiUser /> },
            ].filter(item => {
              if (selectedExperience?.experience_type === 'ASSESSMENT' && item.key === 'activity-builder') {
                return false;
              }
              return true;
            }).map(item => (
              <button
                key={item.key}
                onClick={() => {
                  setMobileNavOpen(false);
                  if (item.key === 'preview') {
                    if (view !== 'preview') setPreviousView(view);
                    if (selectedExperience?.id) {
                      handleStartPreview();
                    } else {
                      setPreviewPayload(null);
                      setView('preview');
                    }
                  } else {
                    if (item.key === 'screen-builder') {
                      setIsEditingScreen(false);
                      let activeAct = selectedActivity;
                      if ((!activeAct || !activeAct.id) && activities && activities.length > 0) {
                        activeAct = activities[0];
                      }
                      if (activeAct && activeAct.id) {
                        loadActivityDetail(activeAct.id, false);
                      }
                    }
                    setView(item.key);
                  }
                }}
                className={`cs-nav-item ${view === item.key ? 'active' : ''}`}
                data-testid={`cs-nav-${item.key}`}
                title={navCollapsed ? item.label : undefined}
                style={navCollapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}
              >
                {item.icon}
                {!navCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="cs-sidebar-footer" style={{ position: 'relative', padding: navCollapsed ? '0.5rem' : '0.75rem' }}>
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
                  onClick={() => { setMobileNavOpen(false); setView('profile'); setShowProfileDropdown(false); }}
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
                  onClick={() => { setMobileNavOpen(false); setShowProfileDropdown(false); onLogout(); }}
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
              className="cs-profile-card"
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
              <div className="cs-profile-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <UserAvatar user={currentUserState} size="small" initials="CC" />
              </div>
              {!navCollapsed && (
                <>
                  <div className="cs-profile-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="cs-profile-name" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUserState?.full_name || currentUserState?.username || 'Content Creator'}</div>
                    <div className="cs-profile-desc" style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>Content Creator</div>
                  </div>
                  <div className="cs-dropdown-icon" style={{ color: 'rgba(255, 255, 255, 0.75)', display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                    <FiChevronDown />
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ── Main Area ── */}
      <div
        className="cs-content-area"
        style={{
          backgroundImage: `url(${contentStudioBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Global feedback toast — visible across every view, not just Profile */}
        {feedbackMsg.text && (
          <div
            data-testid="cs-toast"
            className={`cs-toast cs-toast-${feedbackMsg.type === 'error' ? 'error' : 'success'}`}
            style={{
              position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 10000,
              padding: '0.85rem 1.25rem', borderRadius: '12px',
              fontSize: '0.85rem', fontWeight: 600,
              background: feedbackMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
              color: feedbackMsg.type === 'error' ? '#ef4444' : '#15803d',
              border: feedbackMsg.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            <span>{feedbackMsg.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Header Bar */}
        {true && (
          <header className="cs-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button className="cs-mobile-hamburger" onClick={() => setMobileNavOpen(prev => !prev)} title="Toggle menu">
                <FiMenu />
              </button>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {view === 'dashboard' && 'Dashboard'}
                {view === 'experiences' && 'Lesson Library'}
                {view === 'experience-builder' && 'Lesson Builder'}
                {view === 'activity-builder' && 'Activity Builder'}
                {view === 'screen-builder' && 'Screen Builder'}
                {view === 'media' && 'Media Library'}
                {view === 'publish' && 'Publish Center'}
                {view === 'profile' && 'Profile Settings'}
                {view === 'preview' && 'Runtime Preview'}
              </h2>
            </div>
            <div className="cs-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
              <div style={{ position: 'relative' }}>
                <button className="sd-icon-btn" style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); setShowNotifDropdown(!showNotifDropdown); }}>
                  <FiBell />
                  {notifications.some(n => !(n.read || n.is_read)) && (
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
                        <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No new notifications.</div>
                      ) : (
                        notifications.map(n => {
                          const title = n.title || 'Notification';
                          const message = n.message || n.text || '';
                          const time = n.time || (n.created_at ? new Date(n.created_at).toLocaleTimeString() : 'Recently');
                          const read = n.read !== undefined ? n.read : n.is_read;
                          return (
                            <div key={n.id} style={{ padding: '8px', borderRadius: '6px', backgroundColor: read ? 'transparent' : '#f0fdf4', borderLeft: read ? 'none' : '3px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', textAlign: 'left' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: read ? 600 : 700 }}>{title}</span>
                                <span style={{ fontSize: '0.75rem', color: '#475569' }}>{message}</span>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{time}</span>
                              </div>
                              <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }} title="Delete">
                                <FiX size={14} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '10px', paddingTop: '8px', textAlign: 'center' }}>
                      <button style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setShowNotifDropdown(false); setShowNotifModal(true); }}>View all notifications</button>
                    </div>
                  </div>
                )}
              </div>

              <button className="sd-icon-btn" onClick={() => setShowHelpModal(true)} title="Help & Support"><FiHelpCircle /></button>
            </div>
          </header>
        )}

        {/* Content Body Router */}
        <div className={(view === 'preview' && previewPayload && selectedExperience) ? "" : "cs-body"} style={(view === 'preview' && previewPayload && selectedExperience) ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}}>

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
                  { label: 'Total Lessons', value: dashboardSummary?.total_experiences || 0, trend: 'Active', trendBg: '#dcfce7', trendColor: '#15803d', icon: <FiBookOpen />, iconBg: '#e0f2fe', iconColor: '#0284c7' },
                  { label: 'Draft Lessons', value: dashboardSummary?.draft_experiences || 0, trend: 'Editing', trendBg: '#ffedd5', trendColor: '#ea580c', icon: <FiFileText />, iconBg: '#ffedd5', iconColor: '#ea580c' },
                  { label: 'Published Lessons', value: dashboardSummary?.published_experiences || 0, trend: 'Live', trendBg: '#dcfce7', trendColor: '#16a34a', icon: <FiActivity />, iconBg: '#dcfce7', iconColor: '#16a34a' },
                ].map((stat, idx) => (
                  <div
                    className="cs-stat-card"
                    key={idx}
                  >
                    <div className="cs-stat-val-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div>
                        <span className="cs-stat-label" style={{ color: '#64748b', fontWeight: 600 }}>{stat.label}</span>
                        <div className="cs-stat-value" style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.75rem', marginTop: '4px' }}>{stat.value}</div>
                      </div>
                      <div style={{ background: stat.iconBg, color: stat.iconColor, width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                        {stat.icon}
                      </div>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
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
                      <h3 className="cs-card-title">Recent Lessons</h3>
                      <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }} onClick={() => setView('experiences')}>View All</button>
                    </div>
                    <div className="cs-table-wrap" style={{ overflowX: 'auto' }}>
                      <table className="cs-table">
                        <thead>
                          <tr>
                            <th>Lessons Name</th>
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
                                    <div style={{ width: 36, height: 26, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {getThumbnailUrl(row.thumbnail) ? (
                                        <img src={getThumbnailUrl(row.thumbnail)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>📖</span>
                                      )}
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{row.title}</span>
                                  </div>
                                </td>
                                <td>{row.grade_name || `Grade ${row.grade}`}</td>
                                <td>
                                  <span className={`cs-badge ${row.status === 'APPROVED' || row.status === 'PUBLISHED' ? 'cs-badge-approved' : row.status === 'PENDING_APPROVAL' ? 'cs-badge-pending' : row.status === 'REJECTED' ? 'cs-badge-rejected' : 'cs-badge-draft'}`}>
                                    {row.status === 'PENDING_APPROVAL' ? 'PENDING' : row.status}
                                  </span>
                                </td>
                                <td>{new Date(row.updated_at).toLocaleDateString()}</td>
                                <td>
                                  <button
                                    className="cs-btn-outline"
                                    style={{ padding: '0.35rem 0.55rem', fontSize: '0.85rem', color: '#0b57d0', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    onClick={() => {
                                      setView('experiences');
                                      handleViewDetails(row.id);
                                    }}
                                    title="View Lesson Details"
                                  >
                                    <FiEye />
                                  </button>
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
                      <button className="cs-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }} onClick={() => setShowRecentActivityModal(true)}>View All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {recentActivities.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No recent activity.</div>
                      ) : (
                        recentActivities.slice(0, 6).map((item, idx) => {
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

          {view === 'experiences' && (
            <>
              {showDetailModal && detailExperience ? (
                <div style={{ background: 'transparent', width: '100%', minHeight: '500px' }}>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#0b57d0',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        padding: 0
                      }}
                    >
                      ← Back to Lessons
                    </button>
                  </div>

                  <div className="cs-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Lesson Details</h3>
                    </div>

                    {detailLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem' }}>
                        <FiRefreshCw className="spin" style={{ fontSize: '2rem', color: '#0b57d0' }} />
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading details...</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Header Summary */}
                        <div style={{ display: 'flex', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                          <div style={{ width: 80, height: 60, background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                            {getThumbnailUrl(detailExperience.thumbnail) ? (
                              <img
                                src={getThumbnailUrl(detailExperience.thumbnail)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : null}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{detailExperience.title}</h4>
                            <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>{detailExperience.description || 'No description provided.'}</p>
                          </div>
                        </div>

                        {/* Metadata Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Grade</span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1e293b', marginTop: '2px' }}>{detailExperience.grade_name || `Grade ${detailExperience.grade}`}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Subject</span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1e293b', marginTop: '2px' }}>{Array.isArray(detailExperience.subject) ? detailExperience.subject.join(', ') : (detailExperience.subject || 'N/A')}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Difficulty</span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1e293b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: detailExperience.difficulty === 'BEGINNER' ? '#10b981' : detailExperience.difficulty === 'MASTER' ? '#ef4444' : '#3b82f6' }} />
                              {detailExperience.difficulty_display || formatDifficulty(detailExperience.difficulty)}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Language</span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1e293b', marginTop: '2px' }}>{detailExperience.language || 'English'}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Duration</span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1e293b', marginTop: '2px' }}>{detailExperience.estimated_duration || 0} mins</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</span>
                            <div style={{ marginTop: '2px' }}>
                              <span className={`cs-badge ${detailExperience.status === 'APPROVED' || detailExperience.status === 'PUBLISHED' ? 'cs-badge-approved' : detailExperience.status === 'PENDING_APPROVAL' ? 'cs-badge-pending' : detailExperience.status === 'REJECTED' ? 'cs-badge-rejected' : 'cs-badge-draft'}`} style={{ display: 'inline-block' }}>
                                {detailExperience.status === 'PENDING_APPROVAL' ? 'PENDING' : detailExperience.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        {detailExperience.tags && detailExperience.tags.length > 0 && (
                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Tags</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '4px' }}>
                              {detailExperience.tags.map(t => (
                                <span key={t} style={{ background: '#e2e8f0', color: '#475569', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Learning Outcomes */}
                        {detailExperience.learning_outcomes && detailExperience.learning_outcomes.length > 0 && (
                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Learning Outcomes</span>
                            <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {detailExperience.learning_outcomes.map((o, idx) => (
                                <li key={idx}>{typeof o === 'string' ? o : (o.text || o.description || o.outcome || o.name || '')}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Activities list */}
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>Activities ({detailExperience.activities?.length || 0})</h4>
                          {!detailExperience.activities || detailExperience.activities.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontStyle: 'italic' }}>No activities in this experience.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {detailExperience.activities.map((act, idx) => (
                                <div key={act.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{act.title}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                      {act.estimated_duration || 5} mins | {act.screen_count ?? act.screens?.length ?? 0} {((act.screen_count ?? act.screens?.length ?? 0) === 1) ? 'screen' : 'screens'}
                                    </span>
                                  </div>
                                  {act.description && <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 6px 0' }}>{act.description}</p>}
                                  {act.skills && act.skills.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {act.skills.map((sk, sidx) => (
                                        <span key={sidx} style={{ background: '#f0fdf4', color: '#166534', fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                                          {typeof sk === 'string' ? sk : (sk.name || '')}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>

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
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>Difficulty</span>
                            <select className="cs-filter-select" style={{ width: '100%', height: '36px', fontSize: '0.78rem', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 0.5rem', color: '#1e293b', cursor: 'pointer' }} value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                              <option value="">All Levels</option>
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="master">Master</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: 160, minWidth: 130 }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>Status</span>
                            <select className="cs-filter-select" style={{ width: '100%', height: '36px', fontSize: '0.78rem', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 0.5rem', color: '#1e293b', cursor: 'pointer' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                              <option value="">All Status</option>
                              <option value="approved">Approved</option>
                              <option value="draft">Draft</option>
                              <option value="pending">Pending</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>

                          {/* Search input for lessons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 180 }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>Search</span>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <FiSearch style={{ position: 'absolute', left: 10, color: '#94a3b8', fontSize: '0.85rem', pointerEvents: 'none' }} />
                              <input
                                type="text"
                                value={filterSearch}
                                onChange={e => setFilterSearch(e.target.value)}
                                placeholder="Search lessons..."
                                style={{ width: '100%', height: '36px', fontSize: '0.78rem', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 0.75rem 0 2rem', color: '#1e293b', outline: 'none' }}
                              />
                            </div>
                          </div>
                        </div>


                      </div>

                      {/* Right Side: Action Button */}
                      <div style={{ paddingBottom: '4px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            if (isSelectMode) setSelectedExperienceIds([]);
                          }}
                          style={{
                            background: isSelectMode ? '#e2e8f0' : '#ffffff',
                            border: '1px solid #d1d5db',
                            color: '#374151',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            padding: '0.55rem 1.25rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {isSelectMode ? '✓ Done Selecting' : 'Select'}
                        </button>
                        {selectedExperienceIds.length > 0 && (
                          <button
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              padding: '0.55rem 1.25rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onClick={handleBulkDeleteExperiences}
                          >
                            <FiTrash2 /> Delete Selected ({selectedExperienceIds.length})
                          </button>
                        )}
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
                              difficulty: 'INTERMEDIATE',
                              duration: 15,
                              tags: [],
                              experience_type: 'LESSON',
                              mastery_threshold: 70
                            });
                            setLearningOutcomes([]);
                            setOutcomesText('');
                            setView('experience-builder');
                          }}
                        >
                          + New Lesson
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Main table container */}
                  <div className="cs-card" style={{ padding: '0' }}>
                    <table className="cs-table">
                      <thead>
                        <tr>
                          {isSelectMode && (
                            <th style={{ width: '40px', paddingLeft: '1.5rem' }}>
                              <input
                                type="checkbox"
                                checked={experiences.length > 0 && experiences.every(exp => selectedExperienceIds.includes(exp.id))}
                                onChange={handleSelectAllExperiences}
                                style={{ cursor: 'pointer' }}
                              />
                            </th>
                          )}
                          <th style={{ width: '60px', paddingLeft: '1.25rem' }}>S.No</th>
                          <th>Lessons</th>
                          <th>Type</th>
                          <th>Grade</th>
                          <th>Difficulty</th>
                          <th>Status</th>
                          <th>Last Modified</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experiences.length === 0 ? (
                          <tr>
                            <td colSpan={isSelectMode ? "9" : "8"} style={{ textAlign: 'center', color: '#64748b', padding: '2rem', fontSize: '0.8rem' }}>No lessons found. Click "+ New Lesson" to create one!</td>
                          </tr>
                        ) : (
                          experiences.map((row, idx) => (
                            <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => handleViewDetails(row.id)}>
                              {isSelectMode && (
                                <td style={{ paddingLeft: '1.5rem' }} onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedExperienceIds.includes(row.id)}
                                    onChange={() => handleSelectExperience(row.id)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                </td>
                              )}
                              <td style={{ paddingLeft: '1.25rem', fontWeight: 800, color: '#0284c7', fontSize: '0.84rem' }}>
                                {(page - 1) * 10 + idx + 1}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{ width: 44, height: 32, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                                    {getThumbnailUrl(row.thumbnail) ? <img src={getThumbnailUrl(row.thumbnail)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                  </div>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
                                    {row.title}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  background: row.experience_type === 'ASSESSMENT' ? '#f3e8ff' : '#e0f2fe',
                                  color: row.experience_type === 'ASSESSMENT' ? '#7c3aed' : '#0284c7'
                                }}>
                                  {row.experience_type === 'ASSESSMENT' ? 'Assessment' : 'Lesson'}
                                </span>
                              </td>
                              <td>{row.grade_name || `Grade ${row.grade}`}</td>
                              <td>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.difficulty === 'BEGINNER' ? '#10b981' : row.difficulty === 'MASTER' ? '#ef4444' : '#3b82f6' }} />
                                  {row.difficulty_display || formatDifficulty(row.difficulty)}
                                </span>
                              </td>
                              <td>
                                <span className={`cs-badge ${row.status === 'APPROVED' || row.status === 'PUBLISHED' ? 'cs-badge-approved' : row.status === 'PENDING_APPROVAL' ? 'cs-badge-pending' : row.status === 'REJECTED' ? 'cs-badge-rejected' : 'cs-badge-draft'}`}>
                                  {row.status === 'PENDING_APPROVAL' ? 'PENDING' : row.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 500 }}>{new Date(row.updated_at).toLocaleDateString()}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>by {row.created_by_name || 'Content Creator'}</div>
                              </td>
                              <td style={{ textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <button
                                    className="cs-icon-btn"
                                    onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                                    style={{ padding: '6px', fontSize: '1.15rem', cursor: 'pointer', border: 'none', background: 'none', color: '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <FiMoreVertical />
                                  </button>
                                </div>
                                {activeMenuId === row.id && (
                                  <div style={{
                                    position: 'absolute', right: '50%', transform: 'translateX(50%)', top: '75%', background: '#ffffff',
                                    border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                    zIndex: 100, display: 'flex', flexDirection: 'column', width: '110px', overflow: 'hidden'
                                  }}>
                                    <button
                                      onClick={() => { setActiveMenuId(null); handleStartPreview(row.id); }}
                                      style={{ background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.78rem', textAlign: 'left', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
                                    >
                                      <FiPlay style={{ fontSize: '0.85rem' }} /> Preview
                                    </button>
                                    <button
                                      onClick={() => { setActiveMenuId(null); loadExperienceDetail(row, true); }}
                                      style={{ background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.78rem', textAlign: 'left', cursor: 'pointer', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, width: '100%', borderTop: '1px solid #f1f5f9' }}
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
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing {experiences.length > 0 ? (page - 1) * 10 + 1 : 0} to {(page - 1) * 10 + experiences.length} of {totalCount} experiences</span>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            className="cs-page-link"
                            disabled={page === 1}
                            onClick={() => handlePageChange(page - 1)}
                            style={{ cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                          >
                            &lt;
                          </button>
                          {Array.from({ length: Math.max(1, Math.ceil(totalCount / 10)) }, (_, i) => i + 1).map(pageNum => (
                            <button
                              key={pageNum}
                              className={`cs-page-link ${page === pageNum ? 'active' : ''}`}
                              onClick={() => handlePageChange(pageNum)}
                              style={{ cursor: 'pointer' }}
                            >
                              {pageNum}
                            </button>
                          ))}
                          <button
                            className="cs-page-link"
                            disabled={page >= Math.ceil(totalCount / 10)}
                            onClick={() => handlePageChange(page + 1)}
                            style={{ cursor: page >= Math.ceil(totalCount / 10) ? 'not-allowed' : 'pointer', opacity: page >= Math.ceil(totalCount / 10) ? 0.5 : 1 }}
                          >
                            &gt;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ───────────────── VIEW 3: EXPERIENCE BUILDER (Image 3) ───────────────── */}
          {view === 'experience-builder' && (
            <>
              {/* Top header - breadcrumb only for new experience */}
              {isNewExperience && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="cs-icon-btn" onClick={() => setView('experiences')}><FiArrowLeft /></button>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                          New Lesson
                        </h1>
                      </div>
                      {experienceForm.grade && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {gradesList.find(g => String(g.id) === String(experienceForm.grade))?.grade_name}
                          {experienceForm.difficulty ? ` · ${formatDifficulty(experienceForm.difficulty)}` : ''}
                          {experienceForm.duration ? ` · Est. ${experienceForm.duration} min` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Layout: full-width single column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Lesson Information Card */}
                <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: 0 }}>Lesson Information</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label">Lesson Title <span style={{ color: '#ef4444' }}>*</span></label>
                        <input className="cs-form-input" type="text" value={experienceForm.title}
                          onChange={e => setExperienceForm({ ...experienceForm, title: e.target.value })} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="cs-form-group">
                          <label className="cs-form-label">Experience Type <span style={{ color: '#ef4444' }}>*</span></label>
                          <select className="cs-form-input" value={experienceForm.experience_type || 'LESSON'}
                            onChange={e => setExperienceForm({ ...experienceForm, experience_type: e.target.value })}>
                            <option value="LESSON">Lesson</option>
                            <option value="ASSESSMENT">Assessment</option>
                          </select>
                        </div>
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
                      </div>
                    </div>

                    {/* Thumbnail box */}
                    <div>
                      <label className="cs-form-label">Thumbnail</label>
                      <input
                        type="file"
                        id="thumb-file-input"
                        style={{ display: 'none' }}
                        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                        onChange={handleThumbnailUpload}
                      />
                      <div
                        onClick={() => document.getElementById('thumb-file-input').click()}
                        style={{ border: '1.5px dashed #cbd5e1', borderRadius: '10px', padding: '0.5rem', textAlign: 'center', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#ffffff', position: 'relative' }}
                      >
                        {getThumbnailUrl(experienceForm.thumbnail) ? (
                          <img src={getThumbnailUrl(experienceForm.thumbnail)} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <>
                            <div style={{ width: 44, height: 34, background: '#f1f5f9', borderRadius: 4, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🌅</div>
                            <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>Upload Thumbnail</span>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>JPG, PNG (Max 10MB)</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Difficulty <span style={{ color: '#ef4444' }}>*</span></label>
                      <select className="cs-form-input" value={experienceForm.difficulty}
                        onChange={e => setExperienceForm({ ...experienceForm, difficulty: e.target.value })}>
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="MASTER">Master</option>
                      </select>
                    </div>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Estimated Duration (min)</label>
                      <input
                        className="cs-form-input"
                        type="number"
                        min="0"
                        step="1"
                        value={experienceForm.duration === 0 ? '' : experienceForm.duration}
                        onChange={e => {
                          const val = e.target.value;
                          setExperienceForm({ ...experienceForm, duration: val === '' ? '' : Math.max(0, parseInt(val) || 0) });
                        }}
                      />
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>Maximum total duration allowed for all activities in this lesson.</div>
                    </div>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Mastery Threshold (%)</label>
                      <input
                        className="cs-form-input"
                        type="number"
                        min="0"
                        max="100"
                        value={experienceForm.mastery_threshold === undefined ? 70 : experienceForm.mastery_threshold}
                        onChange={e => {
                          const val = e.target.value;
                          setExperienceForm({
                            ...experienceForm,
                            mastery_threshold: val === '' ? '' : Math.min(100, Math.max(0, parseInt(val) || 0))
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* Description & Learning Outcomes in a 2-column row (No top/bottom border line) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1rem' }}>
                    <div className="cs-form-group">
                      <label className="cs-form-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
                      <textarea
                        className="cs-form-input"
                        style={{
                          minHeight: '90px',
                          resize: 'vertical',
                          borderColor: (experienceForm.description?.length || 0) > 200 ? '#ef4444' : undefined,
                          boxShadow: (experienceForm.description?.length || 0) > 200 ? '0 0 0 1px #ef4444' : undefined
                        }}
                        value={experienceForm.description}
                        onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        {(experienceForm.description?.length || 0) > 200 ? (
                          <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 600 }}>Description must not exceed 200 characters.</span>
                        ) : <span />}
                        <span style={{ fontSize: '0.68rem', color: (experienceForm.description?.length || 0) > 200 ? '#ef4444' : '#94a3b8', fontWeight: (experienceForm.description?.length || 0) > 200 ? 700 : 400 }}>
                          {experienceForm.description?.length || 0} / 200
                        </span>
                      </div>
                    </div>

                    <div className="cs-form-group">
                      <label className="cs-form-label">Learning Outcomes</label>
                      <textarea
                        className="cs-form-input"
                        placeholder="Enter each learning outcome on a new line..."
                        style={{ minHeight: '90px', resize: 'vertical', fontSize: '0.82rem', lineHeight: 1.6, fontFamily: 'inherit' }}
                        value={outcomesText}
                        onChange={e => {
                          setOutcomesText(e.target.value);
                          const lines = e.target.value.split('\n').filter(l => l.trim() !== '');
                          setLearningOutcomes(lines.map((l, i) => ({ id: i, text: l })));
                        }}
                      />
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>One outcome per line. Press Enter to add more.</div>
                    </div>
                  </div>

                  {/* Save button at the bottom (No top border line) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                    <button
                      disabled={actionLoading || (experienceForm.description?.length || 0) > 200}
                      onClick={async () => {
                        if ((experienceForm.description?.length || 0) > 200) {
                          showFeedback('Description must not exceed 200 characters.', 'error');
                          return;
                        }
                        const savedExp = await handleSaveExperience();
                        if (savedExp) {
                          const expType = savedExp.experience_type || 'LESSON';
                          if (expType === 'ASSESSMENT') {
                            let defaultActivity = (savedExp.activities || []).find(a =>
                              (a.skills && a.skills.some(s => s.name === 'assessment' || s === 'assessment')) ||
                              (a.activity_type === 'ASSESSMENT')
                            );
                            if (!defaultActivity) {
                              const skillIds = activitySkillOptions
                                .filter(s => s.name === 'assessment')
                                .map(s => s.id);
                              const payload = {
                                experience: savedExp.id,
                                title: 'Assessment',
                                description: 'Default assessment activity',
                                learning_objective: 'Assessment',
                                estimated_duration: savedExp.estimated_duration || 30,
                                mastery_threshold: savedExp.mastery_threshold || 70,
                                skill_ids: skillIds,
                                activity_type: 'ASSESSMENT'
                              };
                              const createRes = await apiFetch('/api/v1/content/activities/', {
                                method: 'POST',
                                body: JSON.stringify(payload)
                              });
                              if (createRes.ok) {
                                defaultActivity = await createRes.json();
                              }
                            }
                            if (defaultActivity) {
                              setSelectedActivity(defaultActivity);
                              setScreens(defaultActivity.screens || []);
                              setView('screen-builder');
                              setIsEditingScreen(false);
                            } else {
                              showFeedback('Failed to initialize assessment activity.', 'error');
                            }
                          } else {
                            setSelectedActivity(null);
                            setActivityForm({ title: '', description: '', objective: '', skills: [], duration: 5, mastery: 80 });
                            setView('activity-builder');
                          }
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: (experienceForm.description?.length || 0) > 200 ? '#94a3b8' : 'linear-gradient(135deg, #0b57d0, #1d4ed8)',
                        color: '#ffffff', border: 'none', borderRadius: '10px',
                        padding: '0.6rem 1.75rem', fontWeight: 700, fontSize: '0.86rem',
                        cursor: (experienceForm.description?.length || 0) > 200 ? 'not-allowed' : 'pointer',
                        opacity: (experienceForm.description?.length || 0) > 200 ? 0.65 : 1,
                        boxShadow: (experienceForm.description?.length || 0) > 200 ? 'none' : '0 2px 8px rgba(11,87,208,0.25)'
                      }}
                    >
                      Save &amp; Continue to Activities &nbsp;<span style={{ fontSize: '1.1rem' }}>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───────────────── VIEW 4: ACTIVITY BUILDER (Image 4) ───────────────── */}
          {view === 'activity-builder' && (
            <>
              {/* Activity Builder header — breadcrumb only when experience is saved */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {selectedExperience?.id && (
                    <button className="cs-icon-btn" onClick={() => setView('experience-builder')}><FiArrowLeft /></button>
                  )}
                  <div>
                    {selectedExperience?.id && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => setView('experiences')}>Lessons Library</span> &nbsp;&gt;&nbsp;
                        <span style={{ fontWeight: 600 }}>Activity Builder</span>
                      </div>
                    )}

                    {(activityForm.title || selectedExperience) && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {activityForm.title && <span>{activityForm.title} · </span>}
                        {gradesList.find(g => String(g.id) === String(selectedExperience?.grade_id || selectedExperience?.grade))?.grade_name || ''}
                        {selectedExperience?.difficulty ? ` · ${formatDifficulty(selectedExperience.difficulty_display || selectedExperience.difficulty)}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                </div>
              </div>

              {/* Layout grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', alignItems: 'start' }}>
                {/* RIGHT COLUMN: Activities */}
                <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 className="cs-card-title" style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>
                        {selectedExperience?.experience_type === 'ASSESSMENT' ? 'Assessment Activities' : 'Activities'}
                      </h3>
                      <div className="cs-card-sub" style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                        Sequence of activities ({selectedExperience?.experience_type === 'ASSESSMENT' ? 'Assessment Module' : `1 to 6 allowed. Current: ${activities.length}/6`})
                      </div>
                      {(() => {
                        const totalDur = activities.reduce((sum, a) => sum + (a.estimated_duration || 0), 0);
                        const limitDur = selectedExperience?.estimated_duration || parseInt(experienceForm.duration) || 0;
                        const isOver = limitDur > 0 && totalDur > limitDur;
                        return (
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isOver ? '#dc2626' : '#475569', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Total Duration: <strong>{totalDur}</strong> / <strong>{limitDur || '—'}</strong> min</span>
                            {isOver && (
                              <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                                ⚠️ Exceeds Lesson Limit
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      disabled={activities.length >= 6}
                      onClick={() => {
                        if (activities.length >= 6) return;
                        setSelectedActivity(null);
                        setActivityForm({ title: '', description: '', objective: '', skills: [], duration: 5, mastery: 80 });
                        setScreens([]);
                        setShowActivityModal(true);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: activities.length >= 6 ? '#e2e8f0' : '#0b57d0',
                        color: activities.length >= 6 ? '#94a3b8' : '#ffffff',
                        border: 'none', borderRadius: '6px',
                        padding: '0.35rem 0.75rem', fontWeight: 700, fontSize: '0.75rem',
                        cursor: activities.length >= 6 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <FiPlus /> New
                    </button>
                  </div>

                  {activities.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', padding: '1.5rem', border: '1.5px dashed #cbd5e1', borderRadius: '8px' }}>
                      No activities added yet. Click "+ New" above to add an activity.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {activities.map((act, index) => {
                        const isSelected = selectedActivity?.id === act.id;
                        return (
                          <div
                            key={act.id || index}
                            onClick={() => loadActivityDetail(act, 'screen-builder')}
                            data-testid="activity-card"
                            data-activity-title={act.title}
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
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="cs-icon-btn"
                                onClick={() => loadActivityDetail(act, 'activity-builder')}
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

                {/* Activity Settings Modal */}
                {showActivityModal && (
                  <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
                  }}>
                    <div style={{
                      background: '#ffffff', borderRadius: '16px', width: '450px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                          {selectedActivity ? 'Edit Activity Settings' : 'Create New Activity'}
                        </h3>
                        <button
                          onClick={() => setShowActivityModal(false)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', fontSize: '1.1rem' }}
                        >
                          <FiX />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="cs-form-group">
                          <label className="cs-form-label">Modules</label>
                          <select
                            className="cs-form-input"
                            style={{ height: '36px', fontSize: '0.78rem', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 0.5rem', background: '#fff' }}
                            value={Array.isArray(activityForm.skills) && activityForm.skills.length > 0 ? activityForm.skills[0] : ''}
                            onChange={e => {
                              const val = e.target.value;
                              setActivityForm({ ...activityForm, skills: val ? [val] : [] });
                            }}
                          >
                            <option value="">-- Choose Module --</option>
                            {activitySkillOptions.length > 0 ? (
                              activitySkillOptions
                                .filter(skill => skill.name !== 'assessment')
                                .filter((skill, idx, self) =>
                                  self.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase()) === idx
                                )
                                .map(skill => (
                                  <option key={skill.id} value={skill.name}>
                                    {skill.name.charAt(0).toUpperCase() + skill.name.slice(1)}
                                  </option>
                                ))
                            ) : (
                              ['listening', 'speaking', 'reading', 'writing', 'grammar', 'phonetics'].map(name => (
                                <option key={name} value={name}>
                                  {name.charAt(0).toUpperCase() + name.slice(1)}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <div className="cs-form-group">
                          <label className="cs-form-label">Estimated Duration (min)</label>
                          <input
                            className="cs-form-input"
                            type="number"
                            min="0"
                            step="1"
                            value={activityForm.duration === 0 ? '' : activityForm.duration}
                            onChange={e => {
                              const val = e.target.value;
                              setActivityForm({ ...activityForm, duration: val === '' ? '' : Math.max(0, parseInt(val) || 0) });
                            }}
                          />
                          {(() => {
                            const expDuration = selectedExperience?.estimated_duration || parseInt(experienceForm.duration) || 0;
                            const currentActDur = parseInt(activityForm.duration) || 0;
                            const otherActivitiesDuration = activities
                              .filter(a => selectedActivity ? a.id !== selectedActivity.id : true)
                              .reduce((sum, a) => sum + (a.estimated_duration || 0), 0);
                            const projectedTotal = otherActivitiesDuration + currentActDur;
                            const isOver = expDuration > 0 && projectedTotal > expDuration;
                            return (
                              <div style={{ marginTop: '4px' }}>
                                <div style={{ fontSize: '0.68rem', color: isOver ? '#dc2626' : '#64748b' }}>
                                  Projected total: {projectedTotal} / {expDuration || '—'} min
                                </div>
                                {isOver && (
                                  <div style={{ fontSize: '0.72rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '6px', marginTop: '4px', fontWeight: 600 }}>
                                    ⚠️ Exceeds lesson estimated duration ({expDuration} min). Please reduce duration.
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => setShowActivityModal(false)}
                          className="cs-btn-outline"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            await handleSaveActivity();
                            setShowActivityModal(false);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #0b57d0, #1d4ed8)',
                            color: '#ffffff', border: 'none', borderRadius: '8px',
                            padding: '0.45rem 1.25rem', fontWeight: 700, fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                  background: #ffffff;
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                  position: relative;
                }
                .fss-workspace-inner {
                  flex: 1;
                  overflow-y: auto;
                  overflow-x: hidden;
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
                  min-height: 600px;
                  position: relative;
                  flex-shrink: 0;
                  width: 1000px;
                  border: 1px solid #e2e8f0;
                }
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
                  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-left-width 0.25s;
                }
                .fss-right.collapsed {
                  width: 0px !important;
                  border-left-width: 0px !important;
                }
                .fss-right-header {
                  padding: 0.85rem 0.95rem 0.6rem 0.95rem;
                  border-bottom: 1px solid #f1f5f9;
                  flex-shrink: 0;
                  min-width: 340px;
                }
                .fss-right-scroll {
                  flex: 1;
                  overflow-y: auto;
                  padding: 0.85rem;
                  scrollbar-width: thin;
                  min-width: 340px;
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
                .fss-block-palette-item.active {
                  border-color: #2563eb;
                  background: #eff6ff;
                  box-shadow: 0 0 0 1.5px #2563eb;
                }
              `}</style>

                <div className="fss-overlay">

                  {/* ── TOP TOOLBAR ── */}
                  <header className="fss-toolbar">
                    {/* Left: Back + breadcrumb + name */}
                    <div className="fss-toolbar-left">
                      <button
                        className="fss-toolbar-btn"
                        title={selectedExperience?.experience_type === 'ASSESSMENT' ? "Back to Lesson Builder (saves first)" : "Back to Activity Builder (saves first)"}
                        onClick={() => {
                          handleSaveScreen(false);
                          setView(selectedExperience?.experience_type === 'ASSESSMENT' ? 'experience-builder' : 'activity-builder');
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
                    </div>

                    {/* Center: Tools */}
                    <div className="fss-toolbar-center">
                      {/* Undo/Redo */}
                      <button className="fss-toolbar-btn" title="Undo (Ctrl+Z)" disabled={historyIndex <= 0} onClick={handleUndo} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
                        <FiCornerUpLeft style={{ fontSize: '0.85rem' }} />
                        <span>Undo</span>
                      </button>
                      <button className="fss-toolbar-btn" title="Redo (Ctrl+Y)" disabled={historyIndex >= elementsHistory.length - 1} onClick={handleRedo} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
                        <FiCornerUpRight style={{ fontSize: '0.85rem' }} />
                        <span>Redo</span>
                      </button>
                      <div className="fss-toolbar-divider" />

                      {selectedBlockId && (
                        <>
                          <button
                            className="fss-toolbar-btn"
                            title="Delete Selected Element"
                            onClick={() => handleDeleteBlock(selectedBlockId)}
                            style={{
                              color: '#dc2626',
                              background: '#fef2f2',
                              border: '1px solid #fee2e2',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              padding: '0.35rem 0.6rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <FiTrash2 style={{ fontSize: '0.85rem' }} />
                            <span>Delete Element</span>
                          </button>
                          <div className="fss-toolbar-divider" />
                        </>
                      )}



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
                      <button
                        data-testid="ai-assistant-btn"
                        className="fss-toolbar-btn"
                        style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="AI Content Assistant"
                        onClick={() => {
                          setAiForm({ topic: '', content_type: 'quiz', target_level: 'Beginner / Grade 5' });
                          setAiPreviewData(null);
                          setShowAiModal(true);
                        }}
                      >
                        ✨ AI Assistant
                      </button>
                      <div className="fss-toolbar-divider" />
                      <button data-testid="save-draft-btn" className="fss-toolbar-btn" title="Save as Draft" onClick={() => { triggerAutoSave(); handleSaveScreen(false); }}>
                        <FiCheck style={{ fontSize: '0.9rem' }} /> Save Draft
                      </button>
                      <div className="fss-toolbar-divider" />
                      <button className="fss-toolbar-btn" title="Toggle Right Panel" onClick={() => setRightPanelCollapsed(c => !c)} style={{ padding: '0.35rem 0.5rem', background: rightPanelCollapsed ? 'none' : '#f1f5f9' }}>
                        <FiMenu style={{ fontSize: '1rem', transform: 'scaleX(-1)' }} />
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
                          <button className="fss-panel-toggle" data-testid="expand-elements-panel-btn" title="Expand Panel (Tab)" onClick={() => setLeftPanelCollapsed(false)}>
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
                        /* Expanded: full element palette */
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
                                      { type: 'Reading_Passage', desc: 'Read a text passage and mark complete', icon: <FiFileText style={{ color: '#6366f1' }} />, bg: '#e0e7ff' }
                                    ]
                                  },
                                  {
                                    title: "Assessment & Module Blocks",
                                    items: [
                                      { type: 'Quiz', desc: 'Interactive MCQ quiz question', icon: <FiCheckCircle style={{ color: '#ea580c' }} />, bg: '#ffedd5' },
                                      { type: 'Voice_Recorder', desc: 'Speaking practice recording input', icon: <FiMic style={{ color: '#d97706' }} />, bg: '#fef3c7' },
                                      { type: 'Dictation', desc: 'Listen and type what you hear', icon: <FiVolume2 style={{ color: '#0b57d0' }} />, bg: '#e0f2fe' },
                                      { type: 'Grammar_Correction', desc: 'Find and fix incorrect grammar', icon: <FiCheckCircle style={{ color: '#10b981' }} />, bg: '#d1fae5' },
                                      { type: 'Writing_Prompt', desc: 'Write responses with word count limits', icon: <FiEdit2 style={{ color: '#ec4899' }} />, bg: '#fce7f3' },
                                      { type: 'Drag_Drop', desc: 'Drag items to correct targets', icon: <FiMove style={{ color: '#2563eb' }} />, bg: '#dbeafe' },
                                      { type: 'Fill_Blank', desc: 'Fill in missing words in text', icon: <FiEdit style={{ color: '#059669' }} />, bg: '#d1fae5' },
                                      { type: 'Match_Items', desc: 'Pair items in Column A & B', icon: <FiGitCommit style={{ color: '#7c3aed' }} />, bg: '#f3e8ff' },
                                      { type: 'Sequence', desc: 'Reorder items sequentially', icon: <FiList style={{ color: '#b45309' }} />, bg: '#fef3c7' },
                                      { type: 'True_False', desc: 'True or False question', icon: <FiCheckCircle style={{ color: '#ea580c' }} />, bg: '#ffedd5' },
                                      { type: 'Pronunciation', desc: 'Practice pronouncing words correctly', icon: <FiMic style={{ color: '#d97706' }} />, bg: '#fef3c7' },
                                      { type: 'Input', desc: 'Free text typing input area', icon: <FiType style={{ color: '#0ea5e9' }} />, bg: '#e0f9ff' },
                                      { type: 'Roleplay_Simulation', desc: 'Ordered npc-student conversation roleplay', icon: <FiUsers style={{ color: '#3b82f6' }} />, bg: '#dbeafe' },
                                      { type: 'Hotspot_Explorer', desc: 'Click/explore hotspots on a target image', icon: <FiGrid style={{ color: '#ea580c' }} />, bg: '#ffedd5' },
                                      { type: 'Functional_Reading', desc: 'Read document and answer dynamic questions', icon: <FiFileText style={{ color: '#6366f1' }} />, bg: '#e0e7ff' }
                                    ]
                                  },
                                  {
                                    title: "Gamification Blocks",
                                    items: [
                                      { type: 'Flashcard', desc: 'Flip cards for front & back', icon: <FiLayers style={{ color: '#db2777' }} />, bg: '#fce7f3' },
                                      { type: 'Sentence_Builder', desc: 'Build sentences with word badges', icon: <FiType style={{ color: '#0284c7' }} />, bg: '#e0f2fe' },
                                      { type: 'Word_Search', desc: 'Simulated letter-grid puzzle', icon: <FiGrid style={{ color: '#4f46e5' }} />, bg: '#e0e7ff' },
                                    ]
                                  }
                                ].map(cat => {
                                  const activeModule = (() => {
                                    // 1. Check selectedActivity/activityForm skills
                                    const rawSkills = selectedActivity?.skills || activityForm?.skills || [];
                                    if (Array.isArray(rawSkills) && rawSkills.length > 0) {
                                      const first = rawSkills[0];
                                      const name = typeof first === 'object' && first !== null ? (first.name || '') : String(first);
                                      const nameLower = name.toLowerCase();
                                      if (['listening', 'speaking', 'reading', 'writing', 'grammar', 'phonetics'].includes(nameLower)) {
                                        return nameLower;
                                      }
                                    }
                                    // 2. Check selectedExperience subject
                                    const subj = selectedExperience?.subject;
                                    const subjStr = Array.isArray(subj) ? subj.join(' ') : String(subj || '');
                                    const subjLower = subjStr.toLowerCase();
                                    for (const m of ['listening', 'speaking', 'reading', 'writing', 'grammar', 'phonetics']) {
                                      if (subjLower.includes(m)) {
                                        return m;
                                      }
                                    }
                                    return '';
                                  })();

                                  const MODULE_ELEMENTS = {
                                    listening: [
                                      'heading', 'text', 'image', 'audio', 'video',
                                      'audio_mystery', 'quiz', 'true_false', 'fill_blank',
                                      'match_items', 'sequence', 'dictation', 'hotspot_explorer',
                                      'roleplay_simulation'
                                    ],
                                    speaking: [
                                      'heading', 'text', 'image', 'audio', 'video',
                                      'voice_recorder', 'you_ask', 'hotspot_explorer',
                                      'roleplay_simulation', 'pronunciation', 'quiz', 'input'
                                    ],
                                    reading: [
                                      'heading', 'text', 'image', 'audio', 'video', 'reading_passage',
                                      'functional_reading', 'quiz', 'true_false', 'fill_blank',
                                      'match_items', 'sequence', 'drag_drop', 'hotspot_explorer',
                                      'input', 'word_search'
                                    ],
                                    writing: [
                                      'heading', 'text', 'image', 'audio', 'video', 'writing_prompt',
                                      'sentence_starter', 'input', 'sentence_builder', 'fill_blank',
                                      'sequence', 'drag_drop'
                                    ],
                                    grammar: [
                                      'heading', 'text', 'image', 'audio', 'video',
                                      'grammar_correction', 'quiz', 'fill_blank', 'true_false',
                                      'match_items', 'sequence', 'drag_drop', 'sentence_builder',
                                      'input', 'dictation'
                                    ],
                                    phonetics: [
                                      'heading', 'text', 'image', 'audio', 'video',
                                      'pronunciation', 'voice_recorder', 'listen_repeat', 'minimal_pair',
                                      'identify_sound', 'quiz', 'dictation', 'match_items'
                                    ]
                                  };

                                  const allowedTypes = MODULE_ELEMENTS[activeModule] || [];

                                  const isAllowed = (tmplType) => {
                                    if (selectedExperience?.experience_type === 'ASSESSMENT') return true;
                                    if (!activeModule) return true;
                                    const mapped = tmplType.toLowerCase();
                                    if (mapped === 'quiz') return allowedTypes.includes('quiz') || allowedTypes.includes('mcq');
                                    if (mapped === 'match_items') return allowedTypes.includes('match') || allowedTypes.includes('match_items');
                                    if (mapped === 'roleplay_simulation') return allowedTypes.includes('roleplay_simulation');
                                    return allowedTypes.includes(mapped);
                                  };

                                  return {
                                    ...cat,
                                    items: cat.items.filter(tmpl => isAllowed(tmpl.type))
                                  };
                                }).filter(cat => cat.items.length > 0).map(cat => (
                                  <div key={cat.title}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2px' }}>{cat.title}</span>
                                    {cat.items.map(tmpl => {
                                      const isSelected = (() => {
                                        const selBlock = (screenForm.elements || []).find(el => el.id === selectedBlockId) || pendingBlock;
                                        if (!selBlock) return false;
                                        let normalizedTmpl = tmpl.type.toLowerCase().replace(' ', '_');
                                        if (normalizedTmpl === 'fill_in_blanks') normalizedTmpl = 'fill_blank';
                                        if (normalizedTmpl === 'match_items') normalizedTmpl = 'match';
                                        return (selBlock.type || '').toLowerCase() === normalizedTmpl;
                                      })();
                                      return (
                                        <div
                                          key={tmpl.type}
                                          onClick={() => handleSelectBlockType(tmpl.type)}
                                          draggable={true}
                                          onDragStart={e => { e.dataTransfer.setData("text/plain", `type:${tmpl.type}`); e.dataTransfer.effectAllowed = "move"; }}
                                          className={`fss-block-palette-item${isSelected ? ' active' : ''}`}
                                          data-testid={`add-block-${tmpl.type.toLowerCase()}`}
                                        >
                                          <div style={{ background: tmpl.bg, padding: '0.3rem', borderRadius: '6px', display: 'flex', flexShrink: 0 }}>{tmpl.icon}</div>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>{tmpl.type.replace('_', ' ')}</div>
                                            <div style={{ fontSize: '0.58rem', color: '#64748b', marginTop: '1px', lineHeight: 1.3 }}>{tmpl.desc}</div>
                                          </div>
                                        </div>
                                      );
                                    })}
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
                      <div ref={workspaceRef} className="fss-workspace-inner">
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
                              data-canvas-area="true"
                              onDragOver={e => e.preventDefault()}
                              onDrop={e => handleDropOnSlot(e)}
                              style={{
                                flex: 1,
                                position: 'relative',
                                background: '#ffffff',
                                minHeight: '600px',
                                height: `${getCanvasHeight(screenForm.elements)}px`,
                                overflow: 'visible',
                              }}
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
                    {(() => {
                      const hasActiveSelection = !!pendingBlock || !!(screenForm.elements || []).find(el => el.id === selectedBlockId);
                      const isCollapsed = rightPanelCollapsed || !hasActiveSelection;
                      return (
                        <div className={`fss-right ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                          <div className="fss-right-header" style={{ paddingBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                                  Configuration Properties
                                </h3>
                                <span style={{ fontSize: '0.62rem', color: '#64748b' }}>
                                  Edit details for the active element
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {pendingBlock && (
                                  <button
                                    onClick={handleAddPendingBlock}
                                    style={{
                                      padding: '0.28rem 0.7rem',
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      borderRadius: '6px',
                                      background: '#2563eb',
                                      color: '#ffffff',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                  >
                                    <FiPlus style={{ fontSize: '0.75rem' }} /> Add
                                  </button>
                                )}
                                <button
                                  className="fss-panel-toggle"
                                  title="Close Properties Panel"
                                  onClick={() => {
                                    if (pendingBlock) handleCancelPendingBlock();
                                    setRightPanelCollapsed(true);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <FiX style={{ fontSize: '0.95rem' }} />
                                </button>
                              </div>
                            </div>

                            {/* Tab Selector */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '0.75rem', marginTop: '0.6rem' }}>
                              {[{ id: 'content', label: 'Design' }, { id: 'details', label: 'Details' }].map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => setPropertiesTab(t.id)}
                                  style={{
                                    background: 'none', border: 'none',
                                    borderBottom: (propertiesTab === t.id || (propertiesTab === 'style' && t.id === 'content')) ? '2px solid #2563eb' : '2px solid transparent',
                                    color: (propertiesTab === t.id || (propertiesTab === 'style' && t.id === 'content')) ? '#2563eb' : '#64748b',
                                    fontSize: '0.68rem', fontWeight: 700, padding: '4px 2px',
                                    marginBottom: '-1px',
                                    cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s'
                                  }}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="fss-right-scroll">
                            {(() => {
                              const selectedBlock = pendingBlock || (screenForm.elements || []).find(el => el.id === selectedBlockId);
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.75rem' }}>
                                  {propertiesTab === 'content' && (
                                    <>

                                      {/* BLOCK TYPE 1: HEADING */}
                                      {['heading'].includes((selectedBlock.type || '').toLowerCase()) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Heading Text</label>
                                            <input
                                              className="cs-form-input"
                                              style={{ height: '28px', fontSize: '0.78rem' }}
                                              type="text"
                                              value={selectedBlock.content?.text || ''}
                                              onChange={e => handleUpdateBlockContent('text', e.target.value)}
                                              placeholder="Enter heading title..."
                                            />
                                          </div>

                                          {/* Integrated Typography & Styling */}
                                          <div style={{ marginTop: '0.4rem', paddingTop: '0.6rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                              🎨 Typography & Style
                                            </span>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Font Family</label>
                                                <select
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.25rem' }}
                                                  value={selectedBlock.styles?.fontFamily || 'Poppins'}
                                                  onChange={e => handleUpdateBlockStyles('fontFamily', e.target.value)}
                                                >
                                                  <option value="Poppins">Poppins</option>
                                                  <option value="Inter">Inter</option>
                                                  <option value="Roboto">Roboto</option>
                                                  <option value="Outfit">Outfit</option>
                                                  <option value="Open Sans">Open Sans</option>
                                                  <option value="Lato">Lato</option>
                                                  <option value="Montserrat">Montserrat</option>
                                                  <option value="Georgia">Georgia</option>
                                                  <option value="Lora">Lora</option>
                                                  <option value="Merriweather">Merriweather</option>
                                                  <option value="Playfair Display">Playfair Display</option>
                                                  <option value="Courier New">Courier New</option>
                                                </select>
                                              </div>

                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Font Size</label>
                                                <input
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem' }}
                                                  type="text"
                                                  value={selectedBlock.styles?.fontSize || '28px'}
                                                  onChange={e => handleUpdateBlockStyles('fontSize', e.target.value)}
                                                  placeholder="e.g. 28px"
                                                />
                                              </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Font Weight</label>
                                                <select
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.25rem' }}
                                                  value={selectedBlock.styles?.fontWeight || 'Bold'}
                                                  onChange={e => handleUpdateBlockStyles('fontWeight', e.target.value)}
                                                >
                                                  <option value="Normal">Normal</option>
                                                  <option value="SemiBold">SemiBold</option>
                                                  <option value="Bold">Bold</option>
                                                </select>
                                              </div>

                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Alignment</label>
                                                <select
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.25rem' }}
                                                  value={selectedBlock.styles?.alignment || 'Center'}
                                                  onChange={e => handleUpdateBlockStyles('alignment', e.target.value)}
                                                >
                                                  <option value="Left">Left</option>
                                                  <option value="Center">Center</option>
                                                  <option value="Right">Right</option>
                                                </select>
                                              </div>
                                            </div>

                                            <div className="cs-form-group">
                                              <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Text Color</label>
                                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                  type="color"
                                                  value={selectedBlock.styles?.color && selectedBlock.styles.color.startsWith('#') ? selectedBlock.styles.color : '#1e293b'}
                                                  onChange={e => handleUpdateBlockStyles('color', e.target.value)}
                                                  style={{ border: 'none', width: '28px', height: '28px', padding: 0, cursor: 'pointer', borderRadius: '4px' }}
                                                />
                                                <input
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem', flex: 1 }}
                                                  type="text"
                                                  value={selectedBlock.styles?.color || '#1e293b'}
                                                  onChange={e => handleUpdateBlockStyles('color', e.target.value)}
                                                  placeholder="Hex color code e.g. #1e293b"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* BLOCK TYPE 2: TEXT */}
                                      {['text'].includes((selectedBlock.type || '').toLowerCase()) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 700 }}>Paragraph Content</label>
                                            <textarea
                                              className="cs-form-input"
                                              style={{ minHeight: '80px', fontSize: '0.78rem', lineHeight: 1.4 }}
                                              value={selectedBlock.content?.text || ''}
                                              onChange={e => handleUpdateBlockContent('text', e.target.value)}
                                              placeholder="Type paragraphs of body text here..."
                                            />
                                          </div>

                                          {/* Integrated Typography & Styling */}
                                          <div style={{ marginTop: '0.4rem', paddingTop: '0.6rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                              🎨 Typography & Style
                                            </span>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Font Family</label>
                                                <select
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.25rem' }}
                                                  value={selectedBlock.styles?.fontFamily || 'Poppins'}
                                                  onChange={e => handleUpdateBlockStyles('fontFamily', e.target.value)}
                                                >
                                                  <option value="Poppins">Poppins</option>
                                                  <option value="Inter">Inter</option>
                                                  <option value="Roboto">Roboto</option>
                                                  <option value="Outfit">Outfit</option>
                                                  <option value="Open Sans">Open Sans</option>
                                                  <option value="Lato">Lato</option>
                                                  <option value="Montserrat">Montserrat</option>
                                                  <option value="Georgia">Georgia</option>
                                                  <option value="Lora">Lora</option>
                                                  <option value="Merriweather">Merriweather</option>
                                                  <option value="Playfair Display">Playfair Display</option>
                                                  <option value="Courier New">Courier New</option>
                                                </select>
                                              </div>

                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Font Size</label>
                                                <input
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem' }}
                                                  type="text"
                                                  value={selectedBlock.styles?.fontSize || '15px'}
                                                  onChange={e => handleUpdateBlockStyles('fontSize', e.target.value)}
                                                  placeholder="e.g. 15px"
                                                />
                                              </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Font Weight</label>
                                                <select
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.25rem' }}
                                                  value={selectedBlock.styles?.fontWeight || 'Normal'}
                                                  onChange={e => handleUpdateBlockStyles('fontWeight', e.target.value)}
                                                >
                                                  <option value="Normal">Normal</option>
                                                  <option value="SemiBold">SemiBold</option>
                                                  <option value="Bold">Bold</option>
                                                </select>
                                              </div>

                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Alignment</label>
                                                <select
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.25rem' }}
                                                  value={selectedBlock.styles?.alignment || 'Left'}
                                                  onChange={e => handleUpdateBlockStyles('alignment', e.target.value)}
                                                >
                                                  <option value="Left">Left</option>
                                                  <option value="Center">Center</option>
                                                  <option value="Right">Right</option>
                                                  <option value="Justify">Justify</option>
                                                </select>
                                              </div>
                                            </div>

                                            <div className="cs-form-group">
                                              <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Text Color</label>
                                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                  type="color"
                                                  value={selectedBlock.styles?.color && selectedBlock.styles.color.startsWith('#') ? selectedBlock.styles.color : '#334155'}
                                                  onChange={e => handleUpdateBlockStyles('color', e.target.value)}
                                                  style={{ border: 'none', width: '28px', height: '28px', padding: 0, cursor: 'pointer', borderRadius: '4px' }}
                                                />
                                                <input
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem', flex: 1 }}
                                                  type="text"
                                                  value={selectedBlock.styles?.color || '#334155'}
                                                  onChange={e => handleUpdateBlockStyles('color', e.target.value)}
                                                  placeholder="Hex color code e.g. #334155"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* BLOCK TYPE 3: IMAGE / VIDEO / AUDIO */}
                                      {(selectedBlock.type === 'image' || selectedBlock.type === 'video' || selectedBlock.type === 'audio') && (
                                        <>
                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569' }}>
                                              Media Asset
                                            </label>
                                            <input
                                              type="file"
                                              id={`screen-editor-upload-${selectedBlock.id}`}
                                              style={{ display: 'none' }}
                                              accept={
                                                selectedBlock.type === 'image' ? 'image/*' :
                                                  selectedBlock.type === 'video' ? 'video/*' :
                                                    selectedBlock.type === 'audio' ? 'audio/*' : '*'
                                              }
                                              onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                const detectFileType = (f) => {
                                                  const mime = f.type || '';
                                                  if (mime.startsWith('image/')) return 'image';
                                                  if (mime.startsWith('video/')) return 'video';
                                                  if (mime.startsWith('audio/')) return 'audio';
                                                  const ext = f.name.split('.').pop().toLowerCase();
                                                  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) return 'image';
                                                  if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'wmv'].includes(ext)) return 'video';
                                                  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
                                                  return 'other';
                                                };

                                                const fType = detectFileType(file);
                                                if (fType === 'image' && file.size > 10 * 1024 * 1024) {
                                                  showFeedback("Image is too large. Upload less than 10MB.", "error");
                                                  e.target.value = null;
                                                  return;
                                                }
                                                if (fType === 'video' && file.size > 200 * 1024 * 1024) {
                                                  showFeedback("Video is too large. Upload less than 200MB.", "error");
                                                  e.target.value = null;
                                                  return;
                                                }
                                                if (fType === 'audio' && file.size > 50 * 1024 * 1024) {
                                                  showFeedback("Audio is too large. Upload less than 50MB.", "error");
                                                  e.target.value = null;
                                                  return;
                                                }
                                                e.target.value = null;

                                                const formData = new FormData();
                                                formData.append('file', file);
                                                formData.append('name', file.name);
                                                formData.append('folder', 'screen_builder');

                                                setActionLoading(true);
                                                try {
                                                  const res = await apiFetch('/api/v1/content/media/upload/', {
                                                    method: 'POST',
                                                    body: formData
                                                  });
                                                  if (res.ok || res.status === 201) {
                                                    const uploadedAsset = await res.json();
                                                    showFeedback('Media uploaded and assigned successfully!');
                                                    await loadMediaData();
                                                    const assetUrl = uploadedAsset.file || uploadedAsset.url || '';
                                                    handleUpdateBlockMultipleContent({
                                                      url: assetUrl,
                                                      media_id: uploadedAsset.id,
                                                      media_type: uploadedAsset.media_type
                                                    });
                                                  } else {
                                                    const errData = await res.json().catch(() => ({}));
                                                    showFeedback(errData.error || 'Failed to upload media', 'error');
                                                  }
                                                } catch (err) {
                                                  console.error(err);
                                                  showFeedback('Upload error occurred', 'error');
                                                } finally {
                                                  setActionLoading(false);
                                                }
                                              }}
                                            />

                                            {selectedBlock.content?.url ? (
                                              // Uploaded state preview card
                                              <div style={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                padding: '0.75rem',
                                                background: '#ffffff',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                              }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                  {selectedBlock.type === 'image' && (
                                                    <img
                                                      src={resolveMediaUrl(selectedBlock.content.url)}
                                                      alt="Preview"
                                                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f1f5f9' }}
                                                    />
                                                  )}
                                                  {selectedBlock.type === 'audio' && (
                                                    <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0f2fe', color: '#0284c7', borderRadius: '4px', fontSize: '1.25rem' }}>
                                                      🎵
                                                    </div>
                                                  )}
                                                  {selectedBlock.type === 'video' && (
                                                    <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontSize: '1.25rem' }}>
                                                      🎬
                                                    </div>
                                                  )}
                                                  <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                      {selectedBlock.content.url.split('/').pop()}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                                                      {selectedBlock.type} file
                                                    </div>
                                                  </div>
                                                </div>
                                                <button
                                                  type="button"
                                                  className="cs-btn-outline"
                                                  style={{
                                                    fontSize: '0.72rem',
                                                    padding: '4px 8px',
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    justifyContent: 'center',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                  }}
                                                  disabled={actionLoading}
                                                  onClick={() => document.getElementById(`screen-editor-upload-${selectedBlock.id}`).click()}
                                                >
                                                  <FiUpload style={{ fontSize: '0.8rem' }} /> {actionLoading ? 'Uploading...' : 'Replace File'}
                                                </button>
                                              </div>
                                            ) : (
                                              // Empty upload state drop-zone style
                                              <div
                                                onClick={() => document.getElementById(`screen-editor-upload-${selectedBlock.id}`).click()}
                                                style={{
                                                  border: '2px dashed #cbd5e1',
                                                  borderRadius: '10px',
                                                  padding: '1.25rem 0.75rem',
                                                  textAlign: 'center',
                                                  background: '#f8fafc',
                                                  cursor: 'pointer',
                                                  transition: 'border-color 0.2s, background-color 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.borderColor = '#6366f1';
                                                  e.currentTarget.style.backgroundColor = '#f5f3ff';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                                  e.currentTarget.style.backgroundColor = '#f8fafc';
                                                }}
                                              >
                                                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                                                  {selectedBlock.type === 'image' ? '🌅' : selectedBlock.type === 'audio' ? '🎵' : '🎬'}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', display: 'block', marginBottom: '2px' }}>
                                                  {actionLoading ? 'Uploading...' : `Upload ${selectedBlock.type}`}
                                                </span>
                                                <span style={{ fontSize: '0.62rem', color: '#64748b' }}>
                                                  Click to select local file
                                                </span>
                                              </div>
                                            )}
                                          </div>

                                          {selectedBlock.type === 'image' && (
                                            <>
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

                                            </>
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

                                          {/* Integrated Layout & Media Styling */}
                                          <div style={{ marginTop: '0.4rem', paddingTop: '0.6rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                              🎨 Layout & Style
                                            </span>
                                            {['image', 'media', 'hotspot_explorer', 'functional_reading'].includes((selectedBlock.type || '').toLowerCase()) && (
                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Crop / Fit Mode</label>
                                                <select
                                                  className="cs-form-input"
                                                  style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.25rem' }}
                                                  value={selectedBlock.styles?.objectFit || 'cover'}
                                                  onChange={e => handleUpdateBlockStyles('objectFit', e.target.value)}
                                                >
                                                  <option value="cover">Crop to Fit (Cover)</option>
                                                  <option value="contain">Show Entire Element (Contain)</option>
                                                  <option value="fill">Stretch to Fill (Fill)</option>
                                                </select>
                                              </div>
                                            )}

                                            <div className="cs-form-group">
                                              <label className="cs-form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Element Height</label>
                                              <select
                                                className="cs-form-input"
                                                style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.25rem' }}
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
                                        </>
                                      )}

                                      {/* BLOCK TYPE 5: QUIZ */}
                                      {(['quiz', 'mcq'].includes((selectedBlock.type || '').toLowerCase())) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Quiz Questions Config</span>
                                            <button
                                              type="button"
                                              className="cs-btn-outline"
                                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0', display: 'flex', alignItems: 'center', gap: '3px' }}
                                              onClick={() => {
                                                const questions = [...(selectedBlock.content?.questions || [
                                                  {
                                                    question: selectedBlock.content?.question || 'Question text?',
                                                    options: selectedBlock.content?.options || [{ text: 'Option A' }, { text: 'Option B' }, { text: 'Option C' }, { text: 'Option D' }],
                                                    correctAnswerIndex: selectedBlock.content?.correctAnswerIndex ?? 0
                                                  }
                                                ])];
                                                questions.push({
                                                  question: `Question ${questions.length + 1}?`,
                                                  options: [{ text: 'Option A' }, { text: 'Option B' }, { text: 'Option C' }, { text: 'Option D' }],
                                                  correctAnswerIndex: 0
                                                });
                                                handleUpdateBlockMultipleContent({ questions });
                                              }}
                                            >
                                              <FiPlus style={{ fontSize: '0.72rem' }} /> Add Question
                                            </button>
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
                                            {(() => {
                                              const rawQuestions = selectedBlock.content?.questions;
                                              const questions = rawQuestions && rawQuestions.length > 0
                                                ? rawQuestions
                                                : [{
                                                  question: selectedBlock.content?.question || 'Question text?',
                                                  options: selectedBlock.content?.options || [{ text: 'Option A' }, { text: 'Option B' }, { text: 'Option C' }, { text: 'Option D' }],
                                                  correctAnswerIndex: selectedBlock.content?.correctAnswerIndex ?? 0
                                                }];

                                              return questions.map((qItem, qIdx) => (
                                                <div key={qIdx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Question #{qIdx + 1}</span>
                                                    {questions.length > 1 && (
                                                      <button
                                                        type="button"
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                        onClick={() => {
                                                          const updated = questions.filter((_, i) => i !== qIdx);
                                                          handleUpdateBlockMultipleContent({ questions: updated });
                                                        }}
                                                        title="Delete Question"
                                                      >
                                                        <FiTrash2 style={{ fontSize: '0.75rem' }} />
                                                      </button>
                                                    )}
                                                  </div>

                                                  <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                    <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Prompt / Question</label>
                                                    <textarea
                                                      className="cs-form-input"
                                                      style={{ minHeight: '38px', fontSize: '0.72rem' }}
                                                      value={qItem.question || ''}
                                                      onChange={e => {
                                                        const updated = questions.map((q, i) => i === qIdx ? { ...q, question: e.target.value } : q);
                                                        handleUpdateBlockMultipleContent({ questions: updated });
                                                      }}
                                                      placeholder="e.g. Which of these is a correct response?"
                                                    />
                                                  </div>

                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                      <label className="cs-form-label" style={{ fontSize: '0.65rem', margin: 0 }}>Options (Mark Correct)</label>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const currOpts = [...(qItem.options || [{ text: 'Option A' }, { text: 'Option B' }])];
                                                          const labelChar = String.fromCharCode(65 + currOpts.length);
                                                          currOpts.push(typeof currOpts[0] === 'object' ? { text: `Option ${labelChar}` } : `Option ${labelChar}`);
                                                          const updated = questions.map((q, i) => i === qIdx ? { ...q, options: currOpts } : q);
                                                          handleUpdateBlockMultipleContent({ questions: updated });
                                                        }}
                                                        style={{
                                                          background: '#eff6ff',
                                                          border: '1px solid #bfdbfe',
                                                          borderRadius: '4px',
                                                          padding: '0.15rem 0.45rem',
                                                          fontSize: '0.65rem',
                                                          fontWeight: 700,
                                                          color: '#2563eb',
                                                          cursor: 'pointer',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: '3px'
                                                        }}
                                                      >
                                                        <FiPlus style={{ fontSize: '0.7rem' }} /> Add Option
                                                      </button>
                                                    </div>

                                                    {(qItem.options || [{ text: 'Option A' }, { text: 'Option B' }]).map((opt, oIdx) => (
                                                      <div key={oIdx} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                                        <input
                                                          type="radio"
                                                          name={`quiz_correct_${selectedBlock.id}_q${qIdx}`}
                                                          checked={parseInt(qItem.correctAnswerIndex ?? 0) === oIdx}
                                                          onChange={() => {
                                                            const updated = questions.map((q, i) => i === qIdx ? { ...q, correctAnswerIndex: oIdx } : q);
                                                            handleUpdateBlockMultipleContent({ questions: updated });
                                                          }}
                                                          style={{ cursor: 'pointer' }}
                                                        />
                                                        <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#475569' }}>{String.fromCharCode(65 + oIdx)}:</span>
                                                        <input
                                                          className="cs-form-input"
                                                          style={{ height: '24px', fontSize: '0.7rem', flex: 1 }}
                                                          type="text"
                                                          value={typeof opt === 'object' ? (opt?.text || '') : opt}
                                                          onChange={e => {
                                                            const currOpts = [...(qItem.options || [])];
                                                            if (typeof currOpts[oIdx] === 'object') {
                                                              currOpts[oIdx] = { ...currOpts[oIdx], text: e.target.value };
                                                            } else {
                                                              currOpts[oIdx] = { text: e.target.value };
                                                            }
                                                            const updated = questions.map((q, i) => i === qIdx ? { ...q, options: currOpts } : q);
                                                            handleUpdateBlockMultipleContent({ questions: updated });
                                                          }}
                                                          placeholder={`Option ${oIdx + 1}...`}
                                                        />
                                                        {(qItem.options || []).length > 2 && (
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              const currOpts = [...(qItem.options || [])];
                                                              currOpts.splice(oIdx, 1);
                                                              let nextCorrect = parseInt(qItem.correctAnswerIndex || 0);
                                                              if (nextCorrect >= currOpts.length) nextCorrect = Math.max(0, currOpts.length - 1);
                                                              const updated = questions.map((q, i) => i === qIdx ? { ...q, options: currOpts, correctAnswerIndex: nextCorrect } : q);
                                                              handleUpdateBlockMultipleContent({ questions: updated });
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                            title="Delete option"
                                                          >
                                                            <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                          </button>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              ));
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                      {/* BLOCK TYPE: DICTATION */}
                                      {selectedBlock.type === 'dictation' && (() => {
                                        const rawItems = selectedBlock.content?.items;
                                        const items = Array.isArray(rawItems) && rawItems.length > 0 
                                          ? rawItems 
                                          : [{ id: 'dict-1', audioUrl: selectedBlock.content?.url || selectedBlock.content?.audioUrl || '', text: selectedBlock.content?.text || selectedBlock.content?.targetText || '' }];

                                        return (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Dictation Settings</span>
                                              <button
                                                type="button"
                                                className="cs-btn-outline"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                                onClick={() => {
                                                  const newItems = [...items, { id: `dict-${Date.now()}`, audioUrl: '', text: '' }];
                                                  handleUpdateBlockContent('items', newItems);
                                                }}
                                              >
                                                + Add Audio Track
                                              </button>
                                            </div>

                                            <div className="cs-form-group">
                                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question / Instruction</label>
                                              <textarea
                                                className="cs-form-input"
                                                style={{ minHeight: '44px', fontSize: '0.75rem' }}
                                                value={selectedBlock.content?.question || ''}
                                                onChange={e => handleUpdateBlockContent('question', e.target.value)}
                                                placeholder="e.g. Listen to the audio tracks and answer."
                                              />
                                            </div>

                                            <div className="cs-form-group">
                                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Answer Input Mode</label>
                                              <select
                                                className="cs-form-input"
                                                style={{ height: '32px', fontSize: '0.75rem', fontWeight: 600, color: '#0b57d0' }}
                                                value={selectedBlock.content?.responseType || (selectedBlock.content?.options && selectedBlock.content.options.length > 0 ? 'quiz' : 'text')}
                                                onChange={e => {
                                                  const mode = e.target.value;
                                                  if (mode === 'quiz') {
                                                    const opts = selectedBlock.content?.options && selectedBlock.content.options.length > 0
                                                      ? selectedBlock.content.options
                                                      : ['Option A', 'Option B'];
                                                    handleUpdateBlockMultipleContent({ responseType: 'quiz', options: opts });
                                                  } else {
                                                    handleUpdateBlockContent('responseType', 'text');
                                                  }
                                                }}
                                              >
                                                <option value="text">Text Input (Typing)</option>
                                                <option value="quiz">Quiz (Multiple Choice)</option>
                                              </select>
                                            </div>

                                            {/* If Quiz Mode is Selected */}
                                            {(selectedBlock.content?.responseType === 'quiz' || (selectedBlock.content?.options && selectedBlock.content.options.length > 0 && selectedBlock.content?.responseType !== 'text')) && (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.6rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#15803d' }}>Quiz MCQ Options</span>
                                                  <button
                                                    type="button"
                                                    className="cs-btn-outline"
                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #16a34a', color: '#16a34a', background: '#ffffff' }}
                                                    onClick={() => {
                                                      const opts = [...(selectedBlock.content?.options || [])];
                                                      opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
                                                      handleUpdateBlockContent('options', opts);
                                                    }}
                                                  >
                                                    + Add Quiz Option
                                                  </button>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                  {(selectedBlock.content?.options || []).map((opt, optIdx) => {
                                                    const isCorrect = (selectedBlock.content?.correctAnswer ?? 0) === optIdx;
                                                    return (
                                                      <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', border: isCorrect ? '1.5px solid #22c55e' : '1px solid #cbd5e1', borderRadius: '6px', padding: '0.35rem 0.5rem' }}>
                                                        <input
                                                          type="radio"
                                                          name={`dictation_correct_${selectedBlock.id}`}
                                                          checked={isCorrect}
                                                          onChange={() => handleUpdateBlockContent('correctAnswer', optIdx)}
                                                          title="Mark as correct answer"
                                                        />
                                                        <input
                                                          className="cs-form-input"
                                                          style={{ height: '26px', fontSize: '0.72rem', flex: 1 }}
                                                          type="text"
                                                          value={typeof opt === 'object' ? opt?.text || '' : opt}
                                                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                          onChange={(e) => {
                                                            const opts = [...(selectedBlock.content?.options || [])];
                                                            opts[optIdx] = e.target.value;
                                                            handleUpdateBlockContent('options', opts);
                                                          }}
                                                        />
                                                        <button
                                                          type="button"
                                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px' }}
                                                          onClick={() => {
                                                            const opts = (selectedBlock.content?.options || []).filter((_, i) => i !== optIdx);
                                                            handleUpdateBlockContent('options', opts);
                                                            if ((selectedBlock.content?.correctAnswer ?? 0) >= opts.length) {
                                                              handleUpdateBlockContent('correctAnswer', Math.max(0, opts.length - 1));
                                                            }
                                                          }}
                                                        >
                                                          <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                        </button>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                              {items.map((item, idx) => (
                                                <div key={item.id || idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#0284c7' }}>Audio Track #{idx + 1}</span>
                                                    {items.length > 1 && (
                                                      <button
                                                        type="button"
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                        onClick={() => {
                                                          const filtered = items.filter((_, i) => i !== idx);
                                                          handleUpdateBlockContent('items', filtered);
                                                        }}
                                                      >
                                                        <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                      </button>
                                                    )}
                                                  </div>

                                                  <MediaUploadField
                                                    label="Audio File"
                                                    value={item.audioUrl || item.url || ''}
                                                    mediaType="audio"
                                                    onChange={newUrl => {
                                                      const updated = [...items];
                                                      updated[idx] = { ...updated[idx], audioUrl: newUrl, url: newUrl };
                                                      handleUpdateBlockContent('items', updated);
                                                    }}
                                                    actionLoading={actionLoading}
                                                    setActionLoading={setActionLoading}
                                                    showFeedback={showFeedback}
                                                  />

                                                  <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                    <label className="cs-form-label" style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 600 }}>Target Correct Text (Optional)</label>
                                                    <input
                                                      className="cs-form-input"
                                                      style={{ height: '26px', fontSize: '0.72rem' }}
                                                      type="text"
                                                      value={item.text || item.targetText || ''}
                                                      onChange={e => {
                                                        const updated = [...items];
                                                        updated[idx] = { ...updated[idx], text: e.target.value, targetText: e.target.value };
                                                        handleUpdateBlockContent('items', updated);
                                                      }}
                                                      placeholder="e.g. Expected text transcription..."
                                                    />
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      {/* BLOCK TYPE: GRAMMAR CORRECTION */}
                                      {selectedBlock.type === 'grammar_correction' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Grammar Correction Settings</span>
                                            <button type="button" className="cs-btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                              onClick={() => {
                                                const pairs = [...(selectedBlock.content?.pairs || [{ incorrectSentence: selectedBlock.content?.incorrectSentence || '', correctedSentence: selectedBlock.content?.correctedSentence || '' }])];
                                                pairs.push({ incorrectSentence: '', correctedSentence: '' });
                                                handleUpdateBlockMultipleContent({ pairs, incorrectSentence: undefined, correctedSentence: undefined });
                                              }}>
                                              + Add Pair
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '360px', overflowY: 'auto' }}>
                                            {(() => {
                                              const rawPairs = selectedBlock.content?.pairs;
                                              const pairs = rawPairs && rawPairs.length > 0 ? rawPairs : [{ incorrectSentence: selectedBlock.content?.incorrectSentence || '', correctedSentence: selectedBlock.content?.correctedSentence || '' }];
                                              return pairs.map((pair, pIdx) => (
                                                <div key={pIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>Pair #{pIdx + 1}</span>
                                                    {pairs.length > 1 && (
                                                      <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                        onClick={() => {
                                                          const updated = pairs.filter((_, i) => i !== pIdx);
                                                          handleUpdateBlockMultipleContent({ pairs: updated });
                                                        }}>
                                                        <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                      </button>
                                                    )}
                                                  </div>
                                                  <label className="cs-form-label" style={{ fontSize: '0.65rem', margin: 0 }}>Incorrect Sentence</label>
                                                  <textarea className="cs-form-input" style={{ minHeight: '38px', fontSize: '0.72rem' }} value={pair.incorrectSentence || ''}
                                                    onChange={e => {
                                                      const updated = pairs.map((p, i) => i === pIdx ? { ...p, incorrectSentence: e.target.value } : p);
                                                      handleUpdateBlockMultipleContent({ pairs: updated });
                                                    }} placeholder="e.g. They is going to school." />
                                                  <label className="cs-form-label" style={{ fontSize: '0.65rem', margin: 0 }}>Corrected Sentence</label>
                                                  <textarea className="cs-form-input" style={{ minHeight: '38px', fontSize: '0.72rem' }} value={pair.correctedSentence || ''}
                                                    onChange={e => {
                                                      const updated = pairs.map((p, i) => i === pIdx ? { ...p, correctedSentence: e.target.value } : p);
                                                      handleUpdateBlockMultipleContent({ pairs: updated });
                                                    }} placeholder="e.g. They are going to school." />
                                                </div>
                                              ));
                                            })()}
                                          </div>
                                        </div>
                                      )}

                                      {/* BLOCK TYPE: READING PASSAGE */}
                                      {selectedBlock.type === 'reading_passage' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Reading Passage Settings</span>
                                            <button type="button" className="cs-btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                              onClick={() => {
                                                const passages = [...(selectedBlock.content?.passages || [{ title: selectedBlock.content?.title || '', passage: selectedBlock.content?.passage || '', question: selectedBlock.content?.question || '' }])];
                                                passages.push({ title: '', passage: '', question: '' });
                                                handleUpdateBlockMultipleContent({ passages, title: undefined, passage: undefined, question: undefined });
                                              }}>
                                              + Add Passage
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
                                            {(() => {
                                              const rawPassages = selectedBlock.content?.passages;
                                              const passages = rawPassages && rawPassages.length > 0 ? rawPassages : [{ title: selectedBlock.content?.title || '', passage: selectedBlock.content?.passage || '', question: selectedBlock.content?.question || '' }];
                                              return passages.map((p, pIdx) => (
                                                <div key={pIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>Passage #{pIdx + 1}</span>
                                                    {passages.length > 1 && (
                                                      <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                        onClick={() => {
                                                          const updated = passages.filter((_, i) => i !== pIdx);
                                                          handleUpdateBlockMultipleContent({ passages: updated });
                                                        }}>
                                                        <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                      </button>
                                                    )}
                                                  </div>
                                                  <label className="cs-form-label" style={{ fontSize: '0.65rem', margin: 0 }}>Passage Content</label>
                                                  <textarea className="cs-form-input" style={{ minHeight: '80px', fontSize: '0.72rem', lineHeight: 1.4 }} value={p.passage || ''}
                                                    onChange={e => {
                                                      const updated = passages.map((item, i) => i === pIdx ? { ...item, passage: e.target.value } : item);
                                                      handleUpdateBlockMultipleContent({ passages: updated });
                                                    }} placeholder="Type the text passage here..." />
                                                  <label className="cs-form-label" style={{ fontSize: '0.65rem', margin: 0 }}>Follow-up Question (Optional)</label>
                                                  <textarea className="cs-form-input" style={{ minHeight: '36px', fontSize: '0.72rem' }} value={p.question || ''}
                                                    onChange={e => {
                                                      const updated = passages.map((item, i) => i === pIdx ? { ...item, question: e.target.value } : item);
                                                      handleUpdateBlockMultipleContent({ passages: updated });
                                                    }} placeholder="e.g. Did you understand the text?" />
                                                </div>
                                              ));
                                            })()}
                                          </div>
                                        </div>
                                      )}

                                      {/* BLOCK TYPE: WRITING PROMPT */}
                                      {selectedBlock.type === 'writing_prompt' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155' }}>Writing Prompt Settings</span>
                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.62rem' }}>Prompt Instruction</label>
                                            <input className="cs-form-input" style={{ height: '32px', fontSize: '0.75rem' }} type="text" value={selectedBlock.content?.prompt || ''}
                                              onChange={e => handleUpdateBlockContent('prompt', e.target.value)} placeholder="e.g. Describe your favorite memory from childhood." />
                                          </div>
                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.62rem' }}>Placeholder Text</label>
                                            <textarea className="cs-form-input" style={{ minHeight: '54px', fontSize: '0.75rem' }} value={selectedBlock.content?.placeholder || ''}
                                              onChange={e => handleUpdateBlockContent('placeholder', e.target.value)} placeholder="e.g. Start writing your description here..." />
                                          </div>
                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.62rem' }}>Minimum Words Required</label>
                                            <input className="cs-form-input" style={{ height: '32px', fontSize: '0.75rem' }} type="number" value={selectedBlock.content?.minWords || 10}
                                              onChange={e => handleUpdateBlockContent('minWords', parseInt(e.target.value) || 0)} placeholder="e.g. 10" />
                                          </div>
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
                                              onClick={() => { const pairs = [...(selectedBlock.content?.pairs || [])]; pairs.push({ id: `pair-${Date.now()}`, source: 'New Item', target: 'New Destination', sourceImage: '', targetImage: '' }); handleUpdateBlockContent('pairs', pairs); }}>
                                              + Add Pair
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '320px', overflowY: 'auto' }}>
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
                                                <MediaUploadField
                                                   label="Source Image (Optional)"
                                                   value={p.sourceImage || p.source_image || ''}
                                                   mediaType="image"
                                                   onChange={url => {
                                                     const pairs = [...selectedBlock.content.pairs];
                                                     pairs[pIdx] = { ...pairs[pIdx], sourceImage: url, source_image: url };
                                                     handleUpdateBlockContent('pairs', pairs);
                                                   }}
                                                   actionLoading={actionLoading}
                                                   setActionLoading={setActionLoading}
                                                   showFeedback={showFeedback}
                                                 />
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
                                            <textarea
                                              className="cs-form-input"
                                              style={{ minHeight: '44px', fontSize: '0.75rem' }}
                                              value={selectedBlock.content?.question || ''}
                                              onChange={e => handleUpdateBlockContent('question', e.target.value)}
                                              placeholder="e.g. Complete the sentence by filling in the blanks."
                                            />
                                          </div>

                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Sentences List (Use [ ] for blanks)</span>
                                            <button
                                              type="button"
                                              className="cs-btn-outline"
                                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0', background: 'none', cursor: 'pointer' }}
                                              onClick={() => {
                                                const oldItems = selectedBlock.content?.items || (selectedBlock.content?.text ? [{ id: 'migrated', text: selectedBlock.content.text }] : []);
                                                const items = [...oldItems, { id: `item-${Date.now()}`, text: 'Sentence with [blank].' }];
                                                handleUpdateBlockContent('items', items);
                                              }}
                                            >
                                              + Add Sentence
                                            </button>
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                                            {(() => {
                                              const items = selectedBlock.content?.items || (selectedBlock.content?.text ? [{ id: 'migrated', text: selectedBlock.content.text }] : []);
                                              return items.map((item, idx) => (
                                                <div key={item.id || idx} style={{ display: 'flex', gap: '0.35rem', alignItems: 'start', background: '#f8fafc', padding: '0.4rem', borderRadius: '6px', border: '1px solid #e2e8f0', flexDirection: 'column' }}>
                                                  <div style={{ display: 'flex', width: '100%', gap: '0.35rem', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>Sentence #{idx + 1}</span>
                                                    <button
                                                      type="button"
                                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: 'auto', padding: '2px' }}
                                                      onClick={() => {
                                                        const newItems = items.filter((_, i) => i !== idx);
                                                        handleUpdateBlockContent('items', newItems);
                                                      }}
                                                      title="Delete sentence"
                                                    >
                                                      <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                    </button>
                                                  </div>
                                                  <textarea
                                                    className="cs-form-input"
                                                    style={{ minHeight: '46px', fontSize: '0.72rem', width: '100%', lineHeight: 1.3 }}
                                                    value={item.text || ''}
                                                    onChange={e => {
                                                      const newItems = [...items];
                                                      newItems[idx] = { ...item, text: e.target.value };
                                                      handleUpdateBlockContent('items', newItems);
                                                    }}
                                                    placeholder="e.g. The quick [fox] jumps."
                                                  />
                                                </div>
                                              ));
                                            })()}
                                          </div>
                                        </div>
                                      )}

                                      {/* BLOCK TYPE: MATCH ITEMS */}
                                      {selectedBlock.type === 'match' && (
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
                                              onClick={() => {
                                                const leftItems = [...(selectedBlock.content?.leftItems || []), 'Left Option'];
                                                const rightItems = [...(selectedBlock.content?.rightItems || []), 'Right Match'];
                                                handleUpdateBlockMultipleContent({ leftItems, rightItems });
                                              }}>
                                              + Add Match
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '200px', overflowY: 'auto' }}>
                                            {(selectedBlock.content?.leftItems || []).map((left, pIdx) => (
                                              <div key={pIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b' }}>Pair #{pIdx + 1}</span>
                                                  <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    onClick={() => {
                                                      const leftItems = (selectedBlock.content.leftItems || []).filter((_, i) => i !== pIdx);
                                                      const rightItems = (selectedBlock.content.rightItems || []).filter((_, i) => i !== pIdx);
                                                      handleUpdateBlockMultipleContent({ leftItems, rightItems });
                                                    }}>
                                                    <FiTrash2 style={{ fontSize: '0.72rem' }} /></button>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                                                  <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem' }} type="text" placeholder="Column A (Left)" value={left}
                                                    onChange={e => { const leftItems = [...selectedBlock.content.leftItems]; leftItems[pIdx] = e.target.value; handleUpdateBlockContent('leftItems', leftItems); }} />
                                                  <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem' }} type="text" placeholder="Column B (Right)" value={(selectedBlock.content?.rightItems || [])[pIdx] || ''}
                                                    onChange={e => { const rightItems = [...(selectedBlock.content.rightItems || [])]; rightItems[pIdx] = e.target.value; handleUpdateBlockContent('rightItems', rightItems); }} />
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
                                          <span style={{ fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic', display: 'block', margin: '-4px 0 4px 0' }}>
                                            * Arrange items in the CORRECT order here. The simulator will shuffle them for students.
                                          </span>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '200px', overflowY: 'auto' }}>
                                            {(selectedBlock.content?.items || []).map((item, iIdx) => (
                                              <div key={iIdx} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', minWidth: '14px' }}>{iIdx + 1}:</span>
                                                <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem', flex: 1 }} type="text" value={item}
                                                  onChange={e => { const items = [...selectedBlock.content.items]; items[iIdx] = e.target.value; handleUpdateBlockContent('items', items); }} placeholder="Enter step details..." />
                                                <button type="button" disabled={iIdx === 0} style={{ background: 'none', border: 'none', color: iIdx === 0 ? '#cbd5e1' : '#0b57d0', cursor: iIdx === 0 ? 'default' : 'pointer', fontSize: '0.7rem' }}
                                                  onClick={() => {
                                                    const items = [...selectedBlock.content.items];
                                                    const temp = items[iIdx];
                                                    items[iIdx] = items[iIdx - 1];
                                                    items[iIdx - 1] = temp;
                                                    handleUpdateBlockContent('items', items);
                                                  }}>
                                                  ▲
                                                </button>
                                                <button type="button" disabled={iIdx === (selectedBlock.content?.items || []).length - 1} style={{ background: 'none', border: 'none', color: iIdx === (selectedBlock.content?.items || []).length - 1 ? '#cbd5e1' : '#0b57d0', cursor: iIdx === (selectedBlock.content?.items || []).length - 1 ? 'default' : 'pointer', fontSize: '0.7rem' }}
                                                  onClick={() => {
                                                    const items = [...selectedBlock.content.items];
                                                    const temp = items[iIdx];
                                                    items[iIdx] = items[iIdx + 1];
                                                    items[iIdx + 1] = temp;
                                                    handleUpdateBlockContent('items', items);
                                                  }}>
                                                  ▼
                                                </button>
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
                                              onClick={() => { const cards = [...(selectedBlock.content?.cards || [])]; cards.push({ id: `card-${Date.now()}`, front: 'Front word', imageUrl: '' }); handleUpdateBlockContent('cards', cards); }}>
                                              + Add Card
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '340px', overflowY: 'auto' }}>
                                            {(selectedBlock.content?.cards || []).map((card, cIdx) => (
                                              <div key={card.id || cIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b' }}>Card #{cIdx + 1}</span>
                                                  <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    onClick={() => { const cards = (selectedBlock.content.cards || []).filter((_, i) => i !== cIdx); handleUpdateBlockContent('cards', cards); }}>
                                                    <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                  </button>
                                                </div>
                                                <input className="cs-form-input" style={{ height: '24px', fontSize: '0.72rem' }} type="text" placeholder="Front Text (Question/Word)" value={card.front || ''}
                                                   onChange={e => { const cards = [...selectedBlock.content.cards]; cards[cIdx] = { ...cards[cIdx], front: e.target.value }; handleUpdateBlockContent('cards', cards); }} />
                                                <MediaUploadField
                                                   label="Card Image (Optional)"
                                                   value={card.imageUrl || card.image || ''}
                                                   mediaType="image"
                                                   onChange={url => {
                                                     const cards = [...selectedBlock.content.cards];
                                                     cards[cIdx] = { ...cards[cIdx], imageUrl: url, image: url };
                                                     handleUpdateBlockContent('cards', cards);
                                                   }}
                                                   actionLoading={actionLoading}
                                                   setActionLoading={setActionLoading}
                                                   showFeedback={showFeedback}
                                                 />
                                               </div>
                                             ))}
                                           </div>
                                         </div>
                                       )}

                                       {/* BLOCK TYPE: VOICE RECORDER */}
                                       {(selectedBlock.type === 'voice_recorder' || selectedBlock.type?.toLowerCase() === 'voice_recorder' || selectedBlock.type === 'audio_response') && (
                                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                           <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Voice Recorder Settings</span>

                                           <div className="cs-form-group">
                                             <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question Instruction</label>
                                             <textarea
                                               className="cs-form-input"
                                               style={{ minHeight: '44px', fontSize: '0.75rem' }}
                                               value={selectedBlock.content?.question || selectedBlock.content?.prompt || ''}
                                               onChange={e => {
                                                 handleUpdateBlockContent('question', e.target.value);
                                                 handleUpdateBlockContent('prompt', e.target.value);
                                               }}
                                               placeholder="e.g. Record yourself speaking about..."
                                             />
                                           </div>

                                           <div className="cs-form-group">
                                             <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Targeted Answer</label>
                                             <textarea
                                               className="cs-form-input"
                                               style={{ minHeight: '54px', fontSize: '0.75rem' }}
                                               value={selectedBlock.content?.targetAnswer || selectedBlock.content?.targetText || selectedBlock.content?.correctAnswer || ''}
                                               onChange={e => {
                                                 handleUpdateBlockMultipleContent({
                                                   targetAnswer: e.target.value,
                                                   targetText: e.target.value,
                                                   correctAnswer: e.target.value
                                                 });
                                               }}
                                               placeholder="e.g. Enter expected target answer for evaluation..."
                                             />
                                           </div>

                                           <div className="cs-form-group">
                                             <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Max Duration Limit (Seconds)</label>
                                             <input
                                               className="cs-form-input"
                                               style={{ height: '32px', fontSize: '0.75rem' }}
                                               type="number"
                                               value={selectedBlock.content?.maxDuration || 60}
                                               onChange={e => handleUpdateBlockContent('maxDuration', parseInt(e.target.value) || 60)}
                                               placeholder="60"
                                             />
                                           </div>
                                         </div>
                                       )}

                                       {/* BLOCK TYPE: WORD SEARCH */}
                                       {(selectedBlock.type === 'word_search' || selectedBlock.type?.toLowerCase() === 'word_search' || selectedBlock.type === 'Word_Search') && (
                                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                             <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Word Search Settings</span>
                                           </div>


                                           <div className="cs-form-group">
                                             <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Grid Size (Dimensions)</label>
                                             <select
                                               className="cs-form-input"
                                               style={{ height: '32px', fontSize: '0.75rem' }}
                                               value={selectedBlock.content?.gridSize || 10}
                                               onChange={e => handleUpdateBlockContent('gridSize', parseInt(e.target.value) || 10)}
                                             >
                                               <option value={8}>8 x 8 Grid</option>
                                               <option value={10}>10 x 10 Grid</option>
                                               <option value={12}>12 x 12 Grid</option>
                                             </select>
                                           </div>

                                           {/* Target Words Manager */}
                                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                               <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Target Hidden Words</span>
                                               <button
                                                 type="button"
                                                 className="cs-btn-outline"
                                                 style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                                 onClick={() => {
                                                   const current = selectedBlock.content?.words || selectedBlock.content?.targetWords || ['ROAD', 'BOAT', 'GAMING'];
                                                   const updated = [...current, `WORD${current.length + 1}`];
                                                   handleUpdateBlockMultipleContent({ words: updated, targetWords: updated });
                                                 }}
                                               >
                                                 + Add Word
                                               </button>
                                             </div>

                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                               {(() => {
                                                 const rawWords = selectedBlock.content?.words || selectedBlock.content?.targetWords || ['ROAD', 'BOAT', 'GAMING'];
                                                 return rawWords.map((w, wIdx) => (
                                                   <div key={wIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                     <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b', minWidth: '24px' }}>#{wIdx + 1}</span>
                                                     <input
                                                       className="cs-form-input"
                                                       style={{ height: '28px', fontSize: '0.72rem', textTransform: 'uppercase', flex: 1 }}
                                                       type="text"
                                                       value={w}
                                                       onChange={e => {
                                                         const updated = [...rawWords];
                                                         updated[wIdx] = e.target.value.toUpperCase();
                                                         handleUpdateBlockMultipleContent({ words: updated, targetWords: updated });
                                                       }}
                                                       placeholder="ENTER WORD"
                                                     />
                                                     <button
                                                       type="button"
                                                       style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px' }}
                                                       onClick={() => {
                                                         const updated = rawWords.filter((_, i) => i !== wIdx);
                                                         handleUpdateBlockMultipleContent({ words: updated, targetWords: updated });
                                                       }}
                                                     >
                                                       <FiTrash2 style={{ fontSize: '0.75rem' }} />
                                                     </button>
                                                   </div>
                                                 ));
                                               })()}
                                             </div>
                                           </div>
                                         </div>
                                       )}

                                       {/* BLOCK TYPE: SENTENCE BUILDER */}
                                       {selectedBlock.type === 'sentence_builder' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Sentence Builder Config</span>
                                            <button type="button" className="cs-btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                              onClick={() => {
                                                const sentences = [...(selectedBlock.content?.sentences || [{ question: selectedBlock.content?.question || '', sentence: selectedBlock.content?.sentence || '', words: selectedBlock.content?.words || [] }])];
                                                sentences.push({ question: '', sentence: '', words: [] });
                                                handleUpdateBlockMultipleContent({ sentences, question: undefined, sentence: undefined, words: undefined });
                                              }}>
                                              + Add Sentence
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
                                            {(() => {
                                              const rawSentences = selectedBlock.content?.sentences;
                                              const sentences = rawSentences && rawSentences.length > 0 ? rawSentences : [{ question: selectedBlock.content?.question || '', sentence: selectedBlock.content?.sentence || '', words: selectedBlock.content?.words || [] }];
                                              return sentences.map((item, sIdx) => (
                                                <div key={sIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>Sentence #{sIdx + 1}</span>
                                                    {sentences.length > 1 && (
                                                      <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                        onClick={() => {
                                                          const updated = sentences.filter((_, i) => i !== sIdx);
                                                          handleUpdateBlockMultipleContent({ sentences: updated });
                                                        }}>
                                                        <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                      </button>
                                                    )}
                                                  </div>
                                                  <label className="cs-form-label" style={{ fontSize: '0.65rem', margin: 0 }}>Question Instruction</label>
                                                  <textarea className="cs-form-input" style={{ minHeight: '36px', fontSize: '0.72rem' }} value={item.question || ''}
                                                    onChange={e => {
                                                      const updated = sentences.map((s, i) => i === sIdx ? { ...s, question: e.target.value } : s);
                                                      handleUpdateBlockMultipleContent({ sentences: updated });
                                                    }} placeholder="e.g. Reorder words to form a correct sentence" />
                                                  <label className="cs-form-label" style={{ fontSize: '0.65rem', margin: 0 }}>Full Target Sentence</label>
                                                  <input className="cs-form-input" style={{ height: '26px', fontSize: '0.72rem' }} type="text" value={item.sentence || ''}
                                                    onChange={e => {
                                                      const text = e.target.value;
                                                      const splitWords = text.trim() ? text.split(' ').filter(w => w.length > 0) : [];
                                                      const updated = sentences.map((s, i) => i === sIdx ? { ...s, sentence: text, words: splitWords } : s);
                                                      handleUpdateBlockMultipleContent({ sentences: updated });
                                                    }} placeholder="Learning English is fun and easy" />
                                                  {item.words?.length > 0 && (
                                                    <div style={{ background: '#ffffff', padding: '4px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '2px' }}>Scrambled Preview:</span>
                                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                                        {getScrambledWords(item.words).map((w, wIdx) => (
                                                          <span key={wIdx} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '1px 5px', fontSize: '0.62rem', fontWeight: 600, color: '#0284c7' }}>{w}</span>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              ));
                                            })()}
                                          </div>
                                        </div>
                                      )}

                                      {/* BLOCK TYPE: ROLEPLAY SIMULATION */}
                                      {(['roleplay_simulation', 'roleplay simulation', 'roleplay'].includes((selectedBlock.type || '').toLowerCase())) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Roleplay Simulation Settings</span>

                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Scenario Description</label>
                                            <textarea
                                              className="cs-form-input"
                                              style={{ minHeight: '48px', fontSize: '0.75rem' }}
                                              value={selectedBlock.content?.scenario || ''}
                                              onChange={e => handleUpdateBlockContent('scenario', e.target.value)}
                                              placeholder="e.g. You are ordering food at a restaurant."
                                            />
                                          </div>

                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                                            <div className="cs-form-group">
                                              <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Speaker A Name</label>
                                              <input
                                                className="cs-form-input"
                                                style={{ height: '28px', fontSize: '0.75rem' }}
                                                type="text"
                                                value={selectedBlock.content?.npcCharacter !== undefined ? selectedBlock.content.npcCharacter : ''}
                                                onChange={e => handleUpdateBlockContent('npcCharacter', e.target.value)}
                                                placeholder="e.g. Waiter / Receptionist"
                                              />
                                            </div>
                                            <div className="cs-form-group">
                                              <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Speaker B Name</label>
                                              <input
                                                className="cs-form-input"
                                                style={{ height: '28px', fontSize: '0.75rem' }}
                                                type="text"
                                                value={selectedBlock.content?.userRole !== undefined ? selectedBlock.content.userRole : ''}
                                                onChange={e => handleUpdateBlockContent('userRole', e.target.value)}
                                                placeholder="e.g. Customer / Student"
                                              />
                                            </div>
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                            <input
                                              type="checkbox"
                                              id={`roleplay-audio-rec-${selectedBlock.id}`}
                                              checked={selectedBlock.content?.allowAudioRecord !== false}
                                              onChange={e => handleUpdateBlockContent('allowAudioRecord', e.target.checked)}
                                            />
                                            <label htmlFor={`roleplay-audio-rec-${selectedBlock.id}`} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <FiMic style={{ color: '#0284c7' }} /> Enable Student Audio Record Answer
                                            </label>
                                          </div>

                                          <MediaUploadField
                                            label="Speaker A Avatar (Optional)"
                                            value={selectedBlock.content?.npcAvatarUrl || selectedBlock.content?.speakerAAvatarUrl || ''}
                                            mediaType="image"
                                            onChange={url => handleUpdateBlockMultipleContent({ npcAvatarUrl: url, speakerAAvatarUrl: url })}
                                            actionLoading={actionLoading}
                                            setActionLoading={setActionLoading}
                                            showFeedback={showFeedback}
                                          />

                                          <MediaUploadField
                                            label="Speaker B Avatar (Optional)"
                                            value={selectedBlock.content?.userAvatarUrl || selectedBlock.content?.speakerBAvatarUrl || ''}
                                            mediaType="image"
                                            onChange={url => handleUpdateBlockMultipleContent({ userAvatarUrl: url, speakerBAvatarUrl: url })}
                                            actionLoading={actionLoading}
                                            setActionLoading={setActionLoading}
                                            showFeedback={showFeedback}
                                          />

                                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Conversation Dialogue Turns</span>
                                              <button
                                                type="button"
                                                className="cs-btn-outline"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0', display: 'flex', alignItems: 'center', gap: '3px' }}
                                                onClick={() => {
                                                  const conversation = [...(selectedBlock.content?.conversation || [
                                                    { speaker: 'npc', prompt: 'Hello! How can I help you today?', expectedResponse: '', allowAudioRecord: true }
                                                  ])];
                                                  conversation.push({
                                                    speaker: conversation.length % 2 === 0 ? 'npc' : 'user',
                                                    prompt: '',
                                                    expectedResponse: '',
                                                    allowAudioRecord: true
                                                  });
                                                  handleUpdateBlockMultipleContent({ conversation });
                                                }}
                                              >
                                                <FiPlus style={{ fontSize: '0.7rem' }} /> Add Dialogue Turn
                                              </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto' }}>
                                              {(() => {
                                                const rawConv = selectedBlock.content?.conversation;
                                                const conversation = rawConv && rawConv.length > 0
                                                  ? rawConv
                                                  : [
                                                    { speaker: 'npc', prompt: 'Hello! Welcome to our restaurant. What would you like to order?', expectedResponse: 'I would like to order...' }
                                                  ];

                                                return conversation.map((turn, tIdx) => (
                                                  <div key={tIdx} style={{ background: turn.speaker === 'npc' ? '#f5f3ff' : '#eff6ff', border: turn.speaker === 'npc' ? '1px solid #ddd6fe' : '1px solid #bfdbfe', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: turn.speaker === 'npc' ? '#6b21a8' : '#1e40af' }}>
                                                        Turn #{tIdx + 1} ({turn.speaker === 'npc' ? (selectedBlock.content?.npcCharacter || 'NPC') : (selectedBlock.content?.userRole || 'User')})
                                                      </span>
                                                      {conversation.length > 1 && (
                                                        <button
                                                          type="button"
                                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                          onClick={() => {
                                                            const updated = conversation.filter((_, i) => i !== tIdx);
                                                            handleUpdateBlockMultipleContent({ conversation: updated });
                                                          }}
                                                          title="Delete turn"
                                                        >
                                                          <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                        </button>
                                                      )}
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.4rem' }}>
                                                      <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                        <label className="cs-form-label" style={{ fontSize: '0.6rem' }}>Speaker</label>
                                                        <select
                                                          className="cs-form-input"
                                                          style={{ height: '24px', fontSize: '0.7rem', padding: '0 2px' }}
                                                          value={turn.speaker || 'npc'}
                                                          onChange={e => {
                                                            const updated = conversation.map((t, i) => i === tIdx ? { ...t, speaker: e.target.value } : t);
                                                            handleUpdateBlockMultipleContent({ conversation: updated });
                                                          }}
                                                        >
                                                          <option value="npc">Speaker A ({selectedBlock.content?.npcCharacter || 'Speaker 1'})</option>
                                                          <option value="user">Speaker B ({selectedBlock.content?.userRole || 'Speaker 2'})</option>
                                                        </select>
                                                      </div>
                                                      <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                        <label className="cs-form-label" style={{ fontSize: '0.6rem' }}>Prompt / Dialogue Text</label>
                                                        <input
                                                          className="cs-form-input"
                                                          style={{ height: '24px', fontSize: '0.7rem' }}
                                                          type="text"
                                                          value={turn.prompt || ''}
                                                          onChange={e => {
                                                            const updated = conversation.map((t, i) => i === tIdx ? { ...t, prompt: e.target.value } : t);
                                                            handleUpdateBlockMultipleContent({ conversation: updated });
                                                          }}
                                                          placeholder={turn.speaker === 'npc' ? 'What Speaker A says...' : 'Speaker B response prompt...'}
                                                        />
                                                      </div>
                                                    </div>

                                                    {turn.speaker === 'user' && (
                                                      <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                        <label className="cs-form-label" style={{ fontSize: '0.6rem' }}>Expected Model Answer</label>
                                                        <input
                                                          className="cs-form-input"
                                                          style={{ height: '24px', fontSize: '0.7rem' }}
                                                          type="text"
                                                          value={turn.expectedResponse || ''}
                                                          onChange={e => {
                                                            const updated = conversation.map((t, i) => i === tIdx ? { ...t, expectedResponse: e.target.value } : t);
                                                            handleUpdateBlockMultipleContent({ conversation: updated });
                                                          }}
                                                          placeholder="e.g. Can I please get a glass of water?"
                                                        />
                                                      </div>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                                                       <input
                                                         type="checkbox"
                                                         id={`turn-audio-rec-${tIdx}-${selectedBlock.id}`}
                                                         checked={turn.allowAudioRecord !== false}
                                                         onChange={e => {
                                                           const updated = conversation.map((t, i) => i === tIdx ? { ...t, allowAudioRecord: e.target.checked } : t);
                                                           handleUpdateBlockMultipleContent({ conversation: updated });
                                                         }}
                                                       />
                                                       <label htmlFor={`turn-audio-rec-${tIdx}-${selectedBlock.id}`} style={{ fontSize: '0.62rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                                                         Audio Record Answer Option Enabled
                                                       </label>
                                                     </div>
                                                  </div>
                                                ));
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* BLOCK TYPE: TEXT INPUT */}
                                      {(selectedBlock.type === 'input' || selectedBlock.type?.toLowerCase() === 'input') && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Text Input Settings</span>

                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Field Label / Title</label>
                                            <input
                                              className="cs-form-input"
                                              style={{ height: '32px', fontSize: '0.75rem' }}
                                              type="text"
                                              value={selectedBlock.content?.label || selectedBlock.content?.question || ''}
                                              onChange={e => {
                                                handleUpdateBlockMultipleContent({ label: e.target.value, question: e.target.value });
                                              }}
                                              placeholder="e.g. Student Name / Answer Box"
                                            />
                                          </div>

                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question / Prompt Description</label>
                                            <textarea
                                              className="cs-form-input"
                                              style={{ minHeight: '44px', fontSize: '0.75rem' }}
                                              value={selectedBlock.content?.prompt || ''}
                                              onChange={e => handleUpdateBlockContent('prompt', e.target.value)}
                                              placeholder="e.g. Type your response below in complete sentences."
                                            />
                                          </div>

                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Input Mode</label>
                                            <select
                                              className="cs-form-input"
                                              style={{ height: '32px', fontSize: '0.75rem' }}
                                              value={selectedBlock.content?.inputType || 'text'}
                                              onChange={e => handleUpdateBlockContent('inputType', e.target.value)}
                                            >
                                              <option value="text">Single Line Input</option>
                                              <option value="textarea">Multi-line Text (Paragraph)</option>
                                            </select>
                                          </div>

                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Placeholder Text</label>
                                            <input
                                              className="cs-form-input"
                                              style={{ height: '32px', fontSize: '0.75rem' }}
                                              type="text"
                                              value={selectedBlock.content?.placeholder || ''}
                                              onChange={e => handleUpdateBlockContent('placeholder', e.target.value)}
                                              placeholder="e.g. Type your answer here..."
                                            />
                                          </div>

                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Target / Correct Answer (Optional)</label>
                                            <input
                                              className="cs-form-input"
                                              style={{ height: '32px', fontSize: '0.75rem' }}
                                              type="text"
                                              value={selectedBlock.content?.correctAnswer || ''}
                                              onChange={e => handleUpdateBlockContent('correctAnswer', e.target.value)}
                                              placeholder="e.g. Expected correct answer text"
                                            />
                                          </div>

                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Max Character Limit</label>
                                            <input
                                              className="cs-form-input"
                                              style={{ height: '32px', fontSize: '0.75rem' }}
                                              type="number"
                                              value={selectedBlock.content?.maxLength || ''}
                                              onChange={e => handleUpdateBlockContent('maxLength', parseInt(e.target.value) || '')}
                                              placeholder="e.g. 200"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* BLOCK TYPE: FUNCTIONAL READING */}
                                      {selectedBlock.type === 'functional_reading' && (() => {
                                        const docType = (selectedBlock.content?.documentType || 'poster').toLowerCase();
                                        const isTextDoc = docType === 'text';

                                        return (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Functional Reading Settings</span>

                                            <div className="cs-form-group">
                                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Document Type</label>
                                              <select
                                                className="cs-form-input"
                                                style={{ height: '32px', fontSize: '0.75rem' }}
                                                value={docType === 'text' ? 'text' : 'poster'}
                                                onChange={e => handleUpdateBlockContent('documentType', e.target.value)}
                                              >
                                                <option value="poster">Poster</option>
                                                <option value="text">Text</option>
                                              </select>
                                            </div>

                                            {isTextDoc ? (
                                              <div className="cs-form-group">
                                                <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Document Text</label>
                                                <textarea
                                                  className="cs-form-input"
                                                  style={{ minHeight: '80px', fontSize: '0.75rem' }}
                                                  value={selectedBlock.content?.documentText || ''}
                                                  onChange={e => handleUpdateBlockContent('documentText', e.target.value)}
                                                  placeholder="Type or paste document text here..."
                                                />
                                              </div>
                                            ) : (
                                              <MediaUploadField
                                                label="Document File (Image)"
                                                value={selectedBlock.content?.documentUrl || ''}
                                                mediaType="image"
                                                onChange={url => handleUpdateBlockContent('documentUrl', url)}
                                                actionLoading={actionLoading}
                                                setActionLoading={setActionLoading}
                                                showFeedback={showFeedback}
                                              />
                                            )}

                                            <div className="cs-form-group">
                                              <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Scenario</label>
                                              <textarea
                                                className="cs-form-input"
                                                style={{ minHeight: '44px', fontSize: '0.75rem' }}
                                                value={selectedBlock.content?.scenario || ''}
                                                onChange={e => handleUpdateBlockContent('scenario', e.target.value)}
                                                placeholder="e.g. Read the document and answer the questions"
                                              />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Questions List</span>
                                              <button
                                                type="button"
                                                className="cs-btn-outline"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                                onClick={() => {
                                                  const questions = [...(selectedBlock.content?.questions || [])];
                                                  questions.push({ id: `q_${Date.now()}`, type: 'text', question: 'New Question?', targetAnswer: '' });
                                                  handleUpdateBlockContent('questions', questions);
                                                }}
                                              >
                                                + Add Question
                                              </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                              {(selectedBlock.content?.questions || []).map((q, qIdx) => (
                                                <div key={q.id || qIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b' }}>Question #{qIdx + 1}</span>
                                                    <button
                                                      type="button"
                                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                      onClick={() => {
                                                        const questions = (selectedBlock.content.questions || []).filter((_, i) => i !== qIdx);
                                                        handleUpdateBlockContent('questions', questions);
                                                      }}
                                                    >
                                                      <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                    </button>
                                                  </div>
                                                  <div className="cs-form-group">
                                                    <label style={{ fontSize: '0.6rem' }}>Question Prompt</label>
                                                    <input
                                                      className="cs-form-input"
                                                      style={{ height: '26px', fontSize: '0.72rem' }}
                                                      type="text"
                                                      value={q.question || ''}
                                                      onChange={e => {
                                                        const qs = [...selectedBlock.content.questions];
                                                        qs[qIdx] = { ...qs[qIdx], type: 'text', question: e.target.value };
                                                        handleUpdateBlockContent('questions', qs);
                                                      }}
                                                      placeholder="Enter question..."
                                                    />
                                                  </div>
                                                  <div className="cs-form-group">
                                                    <label style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 600 }}>Target / Correct Answer (Optional)</label>
                                                    <input
                                                      className="cs-form-input"
                                                      style={{ height: '26px', fontSize: '0.72rem' }}
                                                      type="text"
                                                      value={q.targetAnswer || q.correctAnswer || ''}
                                                      onChange={e => {
                                                        const qs = [...selectedBlock.content.questions];
                                                        qs[qIdx] = { ...qs[qIdx], targetAnswer: e.target.value, correctAnswer: e.target.value };
                                                        handleUpdateBlockContent('questions', qs);
                                                      }}
                                                      placeholder="e.g. Expected correct answer text..."
                                                    />
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      {selectedBlock.type === 'audio_mystery' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Audio Mystery Settings</span>

                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Progressive Audios (Max 4)</span>
                                            <button type="button" className="cs-btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                              onClick={() => {
                                                const clues = [...(selectedBlock.content?.clues || [])];
                                                if (clues.length < 4) {
                                                  clues.push({ audio: '', duration: 5, description: '' });
                                                  handleUpdateBlockContent('clues', clues);
                                                }
                                              }}>
                                              + Add Audio
                                            </button>
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                            {(selectedBlock.content?.clues || []).map((c, cIdx) => (
                                              <div key={cIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b' }}>Audio #{cIdx + 1}</span>
                                                  <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    onClick={() => {
                                                      const clues = (selectedBlock.content.clues || []).filter((_, i) => i !== cIdx);
                                                      handleUpdateBlockContent('clues', clues);
                                                    }}>
                                                    <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                  </button>
                                                </div>
                                                <MediaUploadField
                                                  label="Audio File"
                                                  value={c.audio || ''}
                                                  mediaType="audio"
                                                  onChange={url => {
                                                    const clues = [...selectedBlock.content.clues];
                                                    clues[cIdx].audio = url;
                                                    handleUpdateBlockContent('clues', clues);
                                                  }}
                                                  actionLoading={actionLoading}
                                                  setActionLoading={setActionLoading}
                                                  showFeedback={showFeedback}
                                                />
                                                <div className="cs-form-group">
                                                  <label style={{ fontSize: '0.6rem' }}>Duration (Seconds)</label>
                                                  <input className="cs-form-input" style={{ height: '22px', fontSize: '0.72rem' }} type="number" value={c.duration || 5}
                                                    onChange={e => { const clues = [...selectedBlock.content.clues]; clues[cIdx].duration = parseInt(e.target.value) || 0; handleUpdateBlockContent('clues', clues); }} />
                                                </div>
                                                <div className="cs-form-group">
                                                  <label style={{ fontSize: '0.6rem' }}>Description</label>
                                                  <input className="cs-form-input" style={{ height: '22px', fontSize: '0.72rem' }} type="text" value={c.description || ''}
                                                    onChange={e => { const clues = [...selectedBlock.content.clues]; clues[cIdx].description = e.target.value; handleUpdateBlockContent('clues', clues); }} />
                                                </div>
                                              </div>
                                            ))}
                                          </div>

                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question</label>
                                            <input className="cs-form-input" style={{ height: '32px', fontSize: '0.75rem' }} type="text" value={selectedBlock.content?.question || ''}
                                              onChange={e => handleUpdateBlockContent('question', e.target.value)} />
                                          </div>

                                          {/* Quiz Style Answer Options Config */}
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Answer Options</span>
                                              <button
                                                type="button"
                                                className="cs-btn-outline"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                                onClick={() => {
                                                  const opts = [...(selectedBlock.content?.options || [])];
                                                  opts.push(`Option ${opts.length + 1}`);
                                                  handleUpdateBlockContent('options', opts);
                                                }}
                                              >
                                                + Add Option
                                              </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                              {(selectedBlock.content?.options || []).map((opt, optIdx) => {
                                                const isCorrect = (selectedBlock.content?.correctAnswer ?? 0) === optIdx;
                                                return (
                                                  <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: isCorrect ? '1.5px solid #22c55e' : '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem 0.5rem' }}>
                                                    <input
                                                      type="radio"
                                                      name={`audio_mystery_correct_${selectedBlock.id}`}
                                                      checked={isCorrect}
                                                      onChange={() => handleUpdateBlockContent('correctAnswer', optIdx)}
                                                      title="Mark as correct answer"
                                                    />
                                                    <input
                                                      className="cs-form-input"
                                                      style={{ height: '26px', fontSize: '0.72rem', flex: 1 }}
                                                      type="text"
                                                      value={typeof opt === 'object' ? opt?.text || '' : opt}
                                                      placeholder={`Option ${optIdx + 1}`}
                                                      onChange={(e) => {
                                                        const opts = [...(selectedBlock.content?.options || [])];
                                                        opts[optIdx] = e.target.value;
                                                        handleUpdateBlockContent('options', opts);
                                                      }}
                                                    />
                                                    <button
                                                      type="button"
                                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                                      onClick={() => {
                                                        const opts = (selectedBlock.content?.options || []).filter((_, i) => i !== optIdx);
                                                        handleUpdateBlockContent('options', opts);
                                                        if (selectedBlock.content?.correctAnswer >= opts.length) {
                                                          handleUpdateBlockContent('correctAnswer', Math.max(0, opts.length - 1));
                                                        }
                                                      }}
                                                      title="Delete option"
                                                    >
                                                      <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      )}                                      {/* BLOCK TYPE: TRUE FALSE */}
                                      {(['true_false', 'true false', 'true/false'].includes((selectedBlock.type || '').toLowerCase())) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>True / False Statements</span>
                                            <button
                                              type="button"
                                              className="cs-btn-outline"
                                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                              onClick={() => {
                                                const stmts = [...(selectedBlock.content?.statements || [{ question: selectedBlock.content?.question || '', correctAnswer: selectedBlock.content?.correctAnswer ?? true }])];
                                                stmts.push({ question: '', correctAnswer: true });
                                                handleUpdateBlockContent('statements', stmts);
                                              }}
                                            >
                                              + Add Statement
                                            </button>
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '380px', overflowY: 'auto' }}>
                                            {(() => {
                                              const rawStmts = selectedBlock.content?.statements;
                                              const stmts = rawStmts && rawStmts.length > 0
                                                ? rawStmts
                                                : [{ question: selectedBlock.content?.question || '', correctAnswer: selectedBlock.content?.correctAnswer ?? true }];

                                              return stmts.map((stmt, sIdx) => (
                                                <div key={sIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>Statement #{sIdx + 1}</span>
                                                    {stmts.length > 1 && (
                                                      <button
                                                        type="button"
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                        onClick={() => {
                                                          const updated = stmts.filter((_, i) => i !== sIdx);
                                                          handleUpdateBlockContent('statements', updated);
                                                        }}
                                                        title="Delete statement"
                                                      >
                                                        <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                      </button>
                                                    )}
                                                  </div>

                                                  <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                    <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Question / Statement Text</label>
                                                    <textarea
                                                      className="cs-form-input"
                                                      style={{ minHeight: '38px', fontSize: '0.72rem' }}
                                                      value={stmt.question || ''}
                                                      onChange={e => {
                                                        const updated = stmts.map((s, i) => i === sIdx ? { ...s, question: e.target.value } : s);
                                                        handleUpdateBlockContent('statements', updated);
                                                      }}
                                                      placeholder="e.g. The Earth orbits around the Sun."
                                                    />
                                                  </div>

                                                  <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                    <label className="cs-form-label" style={{ fontSize: '0.65rem' }}>Correct Answer</label>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <input
                                                          type="radio"
                                                          name={`tf_correct_${selectedBlock.id}_stmt_${sIdx}`}
                                                          checked={stmt.correctAnswer === true || stmt.correctAnswer === 'true'}
                                                          onChange={() => {
                                                            const updated = stmts.map((s, i) => i === sIdx ? { ...s, correctAnswer: true } : s);
                                                            handleUpdateBlockContent('statements', updated);
                                                          }}
                                                        /> True
                                                      </label>
                                                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#991b1b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <input
                                                          type="radio"
                                                          name={`tf_correct_${selectedBlock.id}_stmt_${sIdx}`}
                                                          checked={stmt.correctAnswer === false || stmt.correctAnswer === 'false'}
                                                          onChange={() => {
                                                            const updated = stmts.map((s, i) => i === sIdx ? { ...s, correctAnswer: false } : s);
                                                            handleUpdateBlockContent('statements', updated);
                                                          }}
                                                        /> False
                                                      </label>
                                                    </div>
                                                  </div>
                                                </div>
                                              ));
                                            })()}
                                          </div>
                                        </div>
                                      )}

                                      {/* BLOCK TYPE: PRONUNCIATION */}
                                      {(['pronunciation', 'pronunciation_block'].includes((selectedBlock.type || '').toLowerCase())) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Pronunciation Words Config</span>
                                            <button
                                              type="button"
                                              className="cs-btn-outline"
                                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                              onClick={() => {
                                                const items = [...(selectedBlock.content?.items || [{ id: `item-1`, word: selectedBlock.content?.word || '', phonetic: selectedBlock.content?.phonetic || '' }])];
                                                items.push({ id: `item-${Date.now()}`, word: '', phonetic: '' });
                                                handleUpdateBlockContent('items', items);
                                              }}
                                            >
                                              + Add Word
                                            </button>
                                          </div>

                                          <div className="cs-form-group">
                                            <label className="cs-form-label" style={{ fontSize: '0.68rem' }}>Question / Prompt Instruction</label>
                                            <textarea
                                              className="cs-form-input"
                                              style={{ minHeight: '44px', fontSize: '0.75rem' }}
                                              value={selectedBlock.content?.question || ''}
                                              onChange={e => handleUpdateBlockContent('question', e.target.value)}
                                              placeholder="e.g. Listen and practice pronouncing the target words correctly."
                                            />
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '350px', overflowY: 'auto' }}>
                                            {(() => {
                                              const rawItems = selectedBlock.content?.items;
                                              const items = rawItems && rawItems.length > 0
                                                ? rawItems
                                                : [{ id: 'item-1', word: selectedBlock.content?.word || '', phonetic: selectedBlock.content?.phonetic || '' }];

                                              return items.map((item, idx) => (
                                                <div key={item.id || idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#0284c7' }}>Word Item #{idx + 1}</span>
                                                    {items.length > 1 && (
                                                      <button
                                                        type="button"
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                        onClick={() => {
                                                          const updated = items.filter((_, i) => i !== idx);
                                                          handleUpdateBlockContent('items', updated);
                                                        }}
                                                      >
                                                        <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                      </button>
                                                    )}
                                                  </div>

                                                  <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                    <label className="cs-form-label" style={{ fontSize: '0.62rem' }}>Target Word / Phrase</label>
                                                    <input
                                                      className="cs-form-input"
                                                      style={{ height: '26px', fontSize: '0.72rem' }}
                                                      type="text"
                                                      value={item.word || ''}
                                                      onChange={e => {
                                                        const val = e.target.value;
                                                        const updated = [...items];
                                                        const autoPhonetic = getPhoneticGuide(val);
                                                        updated[idx] = { ...updated[idx], word: val, phonetic: autoPhonetic };
                                                        handleUpdateBlockContent('items', updated);
                                                      }}
                                                      placeholder="e.g. Extraordinary"
                                                    />
                                                  </div>

                                                  <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                    <label className="cs-form-label" style={{ fontSize: '0.62rem' }}>Phonetic Guide / IPA (Optional)</label>
                                                    <input
                                                      className="cs-form-input"
                                                      style={{ height: '26px', fontSize: '0.72rem' }}
                                                      type="text"
                                                      value={item.phonetic || ''}
                                                      onChange={e => {
                                                        const updated = [...items];
                                                        updated[idx] = { ...updated[idx], phonetic: e.target.value };
                                                        handleUpdateBlockContent('items', updated);
                                                      }}
                                                      placeholder="e.g. /ɪkˈstrɔːrdn-eri/"
                                                    />
                                                  </div>

                                                  <MediaUploadField
                                                    label="Target Audio Sample (Optional)"
                                                    value={item.audioUrl || item.audio || ''}
                                                    mediaType="audio"
                                                    onChange={url => {
                                                      const updated = [...items];
                                                      updated[idx] = { ...updated[idx], audioUrl: url, audio: url };
                                                      handleUpdateBlockContent('items', updated);
                                                    }}
                                                    actionLoading={actionLoading}
                                                    setActionLoading={setActionLoading}
                                                    showFeedback={showFeedback}
                                                  />
                                                </div>
                                              ));
                                            })()}
                                          </div>
                                        </div>
                                      )}


                                      {/* BLOCK TYPE: HOTSPOT EXPLORER */}
                                      {(['hotspot_explorer', 'hotspot explorer', 'hotspot'].includes((selectedBlock.type || '').toLowerCase())) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Hotspot Explorer Settings</span>

                                          <MediaUploadField
                                            label="Base Background Image"
                                            value={selectedBlock.content?.imageUrl || ''}
                                            mediaType="image"
                                            onChange={url => handleUpdateBlockContent('imageUrl', url)}
                                            actionLoading={actionLoading}
                                            setActionLoading={setActionLoading}
                                            showFeedback={showFeedback}
                                          />

                                          {selectedBlock.content?.imageUrl && (selectedBlock.content?.hotspots || []).length > 0 && (
                                            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#0b57d0' }}>
                                                  🎯 Click Image to Set Target #{ (activeHotspotIndex < selectedBlock.content.hotspots.length ? activeHotspotIndex : 0) + 1 } Position
                                                </span>
                                              </div>
                                              <div
                                                onClick={(e) => {
                                                  const rect = e.currentTarget.getBoundingClientRect();
                                                  const relX = Math.round(((e.clientX - rect.left) / rect.width) * 400);
                                                  const relY = Math.round(((e.clientY - rect.top) / rect.height) * 250);
                                                  const hotspots = [...selectedBlock.content.hotspots];
                                                  const targetIdx = activeHotspotIndex < hotspots.length ? activeHotspotIndex : 0;
                                                  hotspots[targetIdx] = { ...hotspots[targetIdx], x: relX, y: relY };
                                                  handleUpdateBlockContent('hotspots', hotspots);
                                                }}
                                                style={{ position: 'relative', width: '100%', height: '140px', background: '#0f172a', borderRadius: '6px', overflow: 'hidden', cursor: 'crosshair' }}
                                              >
                                                <img
                                                  src={resolveMediaUrl(selectedBlock.content.imageUrl)}
                                                  alt="Hotspot target selector"
                                                  draggable={false}
                                                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                                                />
                                                {(selectedBlock.content.hotspots || []).map((h, hidx) => {
                                                  const isActive = hidx === (activeHotspotIndex < selectedBlock.content.hotspots.length ? activeHotspotIndex : 0);
                                                  return (
                                                    <div
                                                      key={h.id || hidx}
                                                      style={{
                                                        position: 'absolute',
                                                        left: `${(h.x / 400) * 100}%`,
                                                        top: `${(h.y / 250) * 100}%`,
                                                        width: '18px',
                                                        height: '18px',
                                                        borderRadius: '50%',
                                                        background: isActive ? '#2563eb' : '#ef4444',
                                                        border: '2px solid #ffffff',
                                                        color: '#ffffff',
                                                        fontSize: '9px',
                                                        fontWeight: 'bold',
                                                        transform: 'translate(-50%, -50%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        pointerEvents: 'none'
                                                      }}
                                                    >
                                                      {hidx + 1}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Interactive Hotspots List</span>
                                            <button
                                              type="button"
                                              className="cs-btn-outline"
                                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', border: '1px solid #0b57d0', color: '#0b57d0' }}
                                              onClick={() => {
                                                const hotspots = [...(selectedBlock.content?.hotspots || [])];
                                                hotspots.push({
                                                  id: `hotspot_${Date.now()}`,
                                                  name: `Target ${hotspots.length + 1}`,
                                                  x: 100,
                                                  y: 100,
                                                  width: 80,
                                                  height: 80,
                                                  info: 'Exploration info description...',
                                                  hint: 'Click to explore'
                                                });
                                                handleUpdateBlockContent('hotspots', hotspots);
                                                setActiveHotspotIndex(hotspots.length - 1);
                                              }}
                                            >
                                              + Add Hotspot
                                            </button>
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '350px', overflowY: 'auto' }}>
                                            {(selectedBlock.content?.hotspots || []).map((hs, hIdx) => {
                                              const isActive = hIdx === (activeHotspotIndex < (selectedBlock.content.hotspots || []).length ? activeHotspotIndex : 0);
                                              return (
                                                <div key={hs.id || hIdx} style={{ background: isActive ? '#eff6ff' : '#f8fafc', border: isActive ? '1.5px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: isActive ? '#1d4ed8' : '#0284c7', cursor: 'pointer' }} onClick={() => setActiveHotspotIndex(hIdx)}>
                                                      {isActive ? '🎯' : '📍'} Hotspot #{hIdx + 1} ({hs.name || 'Target'})
                                                    </span>
                                                    <button
                                                      type="button"
                                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                      onClick={() => {
                                                        const hotspots = (selectedBlock.content.hotspots || []).filter((_, i) => i !== hIdx);
                                                        handleUpdateBlockContent('hotspots', hotspots);
                                                      }}
                                                    >
                                                      <FiTrash2 style={{ fontSize: '0.72rem' }} />
                                                    </button>
                                                  </div>

                                                  <button
                                                    type="button"
                                                    onClick={() => setActiveHotspotIndex(hIdx)}
                                                    style={{
                                                      background: isActive ? '#3b82f6' : '#ffffff',
                                                      color: isActive ? '#ffffff' : '#3b82f6',
                                                      border: '1px solid #3b82f6',
                                                      borderRadius: '4px',
                                                      padding: '2px 6px',
                                                      fontSize: '0.6rem',
                                                      fontWeight: 600,
                                                      cursor: 'pointer',
                                                      alignSelf: 'flex-start'
                                                    }}
                                                  >
                                                    {isActive ? '🎯 Selected (Click image to set position)' : 'Select to Position'}
                                                  </button>

                                                  <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                    <label className="cs-form-label" style={{ fontSize: '0.6rem' }}>Label / Name</label>
                                                    <input
                                                      className="cs-form-input"
                                                      style={{ height: '24px', fontSize: '0.72rem' }}
                                                      type="text"
                                                      value={hs.name || ''}
                                                      onChange={e => {
                                                        const hotspots = [...selectedBlock.content.hotspots];
                                                        hotspots[hIdx] = { ...hotspots[hIdx], name: e.target.value };
                                                        handleUpdateBlockContent('hotspots', hotspots);
                                                      }}
                                                      placeholder="Target name..."
                                                    />
                                                  </div>

                                                  <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                    <label className="cs-form-label" style={{ fontSize: '0.6rem' }}>Info Text on Click</label>
                                                    <textarea
                                                      className="cs-form-input"
                                                      style={{ minHeight: '34px', fontSize: '0.72rem' }}
                                                      value={hs.info || ''}
                                                      onChange={e => {
                                                        const hotspots = [...selectedBlock.content.hotspots];
                                                        hotspots[hIdx] = { ...hotspots[hIdx], info: e.target.value };
                                                        handleUpdateBlockContent('hotspots', hotspots);
                                                      }}
                                                      placeholder="Detailed info shown when clicked..."
                                                    />
                                                  </div>

                                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                                                    <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                      <label className="cs-form-label" style={{ fontSize: '0.58rem' }}>X Position (px)</label>
                                                      <input
                                                        className="cs-form-input"
                                                        style={{ height: '22px', fontSize: '0.7rem' }}
                                                        type="number"
                                                        value={hs.x ?? 100}
                                                        onChange={e => {
                                                          const hotspots = [...selectedBlock.content.hotspots];
                                                          hotspots[hIdx] = { ...hotspots[hIdx], x: parseInt(e.target.value) || 0 };
                                                          handleUpdateBlockContent('hotspots', hotspots);
                                                        }}
                                                      />
                                                    </div>
                                                    <div className="cs-form-group" style={{ marginBottom: 0 }}>
                                                      <label className="cs-form-label" style={{ fontSize: '0.58rem' }}>Y Position (px)</label>
                                                      <input
                                                        className="cs-form-input"
                                                        style={{ height: '22px', fontSize: '0.7rem' }}
                                                        type="number"
                                                        value={hs.y ?? 100}
                                                        onChange={e => {
                                                          const hotspots = [...selectedBlock.content.hotspots];
                                                          hotspots[hIdx] = { ...hotspots[hIdx], y: parseInt(e.target.value) || 0 };
                                                          handleUpdateBlockContent('hotspots', hotspots);
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}


                                    </>
                                  )}
                                  {propertiesTab === 'details' && (() => {
                                    const getElementDetails = (type) => {
                                      const t = (type || '').toLowerCase();
                                      switch (t) {
                                        case 'heading':
                                          return {
                                            what: 'Used for titles, section dividers, and primary header labels on the screen.',
                                            does: 'Renders a large typography heading block (H1, H2, or H3) styled with selected fonts and colors.',
                                            how: 'Set the text content in the Content tab and configure typography size, alignment, and color in the Style tab.'
                                          };
                                        case 'text':
                                          return {
                                            what: 'Standard body text block for paragraphs, explanations, and general reading content.',
                                            does: 'Renders blocks of clean paragraph text with adjustable alignment, sizes, and fonts.',
                                            how: 'Type your main body text inside the Content tab editor area. Change alignment or typography under the Style tab.'
                                          };
                                        case 'image':
                                          return {
                                            what: 'Renders pictures, photos, or illustrations on the screen.',
                                            does: 'Displays a media image asset with optional captions.',
                                            how: 'Upload an image file or provide a web URL in the Content tab settings. Captions can be written below it.'
                                          };
                                        case 'audio':
                                          return {
                                            what: 'Adds an audio player block to play sound clips or speech instructions.',
                                            does: 'Provides a speaker icon or play bar that students can click to trigger listening activity playback.',
                                            how: 'Upload/select an audio file in the Content tab. Set the title or label for the audio clip.'
                                          };
                                        case 'video':
                                          return {
                                            what: 'Adds a video player component to stream visual instructions or tutorials.',
                                            does: 'Embeds a playable video screen with controls.',
                                            how: 'Provide a video source link or upload a video file under the Content tab.'
                                          };
                                        case 'dialogue':
                                          return {
                                            what: 'Renders a simulated dialogue or roleplay conversation between characters.',
                                            does: 'Displays character chat bubbles with name labels, text contents, avatars, and audio controls.',
                                            how: 'Add conversational turns/steps. Define name, side (left/right), chat bubble text, and link optional voice files for each step.'
                                          };
                                        case 'quiz':
                                          return {
                                            what: 'An interactive Multiple Choice Question (MCQ) assessment block.',
                                            does: 'Presents a question with multiple options. Validates student selection and records scores.',
                                            how: 'Write the question text, define option answers, and select the correct answer index radio button.'
                                          };
                                        case 'dictation':
                                          return {
                                            what: 'An assessment block where students listen and write down the audio clip.',
                                            does: 'Plays an audio file and displays a text entry field, checking spelling accuracy.',
                                            how: 'Upload the target listening audio clip and set the correct transcription text for matching.'
                                          };
                                        case 'voice_recorder':
                                          return {
                                            what: 'Renders a recording block for speaking practice assessment.',
                                            does: 'Provides a microphone record button and captures student voice input for grading.',
                                            how: 'Configure the prompt or question instructions telling the student what phrase they need to speak.'
                                          };
                                        case 'grammar_correction':
                                          return {
                                            what: 'An exercise where students find and correct grammatically incorrect text.',
                                            does: 'Displays an incorrect sentence and prompts the student to type the corrected version.',
                                            how: 'Provide the incorrect sentence format and specify the correct sentence to check answers against.'
                                          };
                                        case 'reading_passage':
                                          return {
                                            what: 'Displays a reading comprehension layout block.',
                                            does: 'Presents a long passage with a target question for students to answer.',
                                            how: 'Input the passage title, the long reading text body, and the validation question.'
                                          };
                                        case 'drag_drop':
                                          return {
                                            what: 'An interactive drag-and-drop matching assessment block.',
                                            does: 'Renders draggable words that students match into destination category slots.',
                                            how: 'Specify the question/prompt instruction and set source-to-target pairs (e.g. Apple -> Fruit).'
                                          };
                                        case 'fill_blank':
                                          return {
                                            what: 'Renders a fill-in-the-blanks reading assessment.',
                                            does: 'Replaces words wrapped in brackets with blank inputs for students to type in.',
                                            how: 'Write the sentence and place brackets around target words, e.g. "The quick [brown] fox [jumps] over the lazy dog."'
                                          };
                                        case 'match':
                                          return {
                                            what: 'A column matching game/activity (Column A to Column B).',
                                            does: 'Renders items in a left and right list, allowing students to draw links or match pairs.',
                                            how: 'Define Left Items and Right Items in correct order; the system randomizes positions during student runtime.'
                                          };
                                        case 'sequence':
                                          return {
                                            what: 'A chronological ordering or sequencing assessment.',
                                            does: 'Presents mixed-up steps and requires students to reorder them sequentially.',
                                            how: 'Enter the steps in their correct chronological order. The engine handles randomizing during student play.'
                                          };
                                        case 'flashcard':
                                          return {
                                            what: 'A gamified vocabulary revision card deck.',
                                            does: 'Renders cards that students can click to flip, revealing vocabulary meanings or translations.',
                                            how: 'Add flashcard items specifying the front face text (e.g. Word) and back face text (e.g. Definition).'
                                          };
                                        case 'sentence_builder':
                                          return {
                                            what: 'A sentence construction block.',
                                            does: 'Renders mixed words as badges and asks students to arrange them to form a grammatically correct sentence.',
                                            how: 'Enter the correct full sentence. The system automatically splits it into draggable word badges.'
                                          };
                                        case 'word_search':
                                          return {
                                            what: 'A vocabulary word search grid puzzle.',
                                            does: 'Presents a grid of letters where students search for hidden vocabulary words.',
                                            how: 'Provide the list of target words to hide and set the grid dimension size (e.g. 8x8 or 10x10).'
                                          };
                                        case 'pronunciation':
                                          return {
                                            what: 'Speaking pronunciation trainer.',
                                            does: 'Renders target words with phonetic spelling and records student speaking attempt to check accuracy.',
                                            how: 'Input words/sentences, write the phonetic hint guide (e.g. /həˈloʊ/), and configure voice settings.'
                                          };
                                        case 'role_play':
                                          return {
                                            what: 'Interactive role play practice.',
                                            does: 'Requires students to select character roles and read aloud the conversation script.',
                                            how: 'Provide the conversation script specifying the speaker label (e.g. A, B) and the spoken script lines.'
                                          };
                                        case 'input':
                                          return {
                                            what: 'A basic text entry area.',
                                            does: 'Renders a text box letting the user type a free-text response.',
                                            how: 'Provide the default placeholder text and limits/validation options in the properties panel.'
                                          };
                                        case 'true_false':
                                          return {
                                            what: 'True or False question block.',
                                            does: 'Presents a statement and lets the user choose between True and False buttons.',
                                            how: 'Input the statement question, and select the correct boolean value (True or False).'
                                          };
                                        case 'you_ask':
                                          return {
                                            what: 'Ask a question activity.',
                                            does: 'Prompts students to formulate and ask a question based on a given topic, capturing their voice.',
                                            how: 'Provide the topic prompt and configure maximum recording duration parameters.'
                                          };
                                        case 'roleplay_simulation':
                                          return {
                                            what: 'Advanced npc-led conversation simulation.',
                                            does: 'Provides a structured conversation tree where the bot speaks and student replies via microphone.',
                                            how: 'Define the NPC details, initial dialogue steps, and correct/expected student responses for evaluation.'
                                          };
                                        case 'hotspot_explorer':
                                          return {
                                            what: 'Image hotspot click discovery.',
                                            does: 'Loads an image and highlights interactive hotspots that students click to explore descriptive hints.',
                                            how: 'Upload the target base image, and configure absolute coordinates (x, y, width, height) for hotspots.'
                                          };
                                        case 'functional_reading':
                                          return {
                                            what: 'Document reading comprehension block.',
                                            does: 'Loads a document form or poster alongside multiple comprehension check questions.',
                                            how: 'Upload/set the document URL, document category, and write the associated validation questions.'
                                          };
                                        case 'audio_mystery':
                                          return {
                                            what: 'Listen to progressive audio clues game.',
                                            does: 'Plays audio hints one by one and requires students to guess the mystery item/word.',
                                            how: 'Upload clues, define mystery question, configure correct answer and sentence starter hints.'
                                          };
                                        default:
                                          return {
                                            what: 'Interactive page element.',
                                            does: 'Renders a block element inside the screen canvas.',
                                            how: 'Configure content parameters in the Content tab and design styles in the Style tab.'
                                          };
                                      }
                                    };
                                    const details = getElementDetails(selectedBlock.type);
                                    return (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {selectedBlock.type.replace('_', ' ')} Settings
                                          </span>
                                        </div>
                                        <div>
                                          <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            📝 What is it?
                                          </h4>
                                          <p style={{ fontSize: '0.7rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{details.what}</p>
                                        </div>
                                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                                          <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            ⚙️ What it does?
                                          </h4>
                                          <p style={{ fontSize: '0.7rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{details.does}</p>
                                        </div>
                                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                                          <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🚀 How to configure?
                                          </h4>
                                          <p style={{ fontSize: '0.7rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{details.how}</p>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })()}

                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 'calc(100vh - 120px)' }}>
                {/* Breadcrumbs and Top Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      className="cs-icon-btn"
                      onClick={() => setView(selectedExperience?.experience_type === 'ASSESSMENT' ? 'experience-builder' : 'activity-builder')}
                      title={selectedExperience?.experience_type === 'ASSESSMENT' ? "Back to Lesson Builder" : "Back to Activity Builder"}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      <FiArrowLeft style={{ fontSize: '1.1rem' }} />
                    </button>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => setView('experiences')}>Lessons Library</span> &nbsp;&gt;&nbsp; <span style={{ cursor: 'pointer' }} onClick={() => setView('experience-builder')}>{selectedExperience?.title || 'Lesson Builder'}</span> {selectedExperience?.experience_type !== 'ASSESSMENT' && (<>&nbsp;&gt;&nbsp; <span style={{ cursor: 'pointer' }} onClick={() => setView('activity-builder')}>{selectedActivity?.title || 'Activity Builder'}</span></>)} &nbsp;&gt;&nbsp; <span style={{ fontWeight: 600 }}>Screen Builder Overview</span>
                      </div>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '6px 0 0 0', color: '#0f172a', letterSpacing: '-0.02em' }}>Screen Library</h1>
                    </div>
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
                      <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '380px', margin: 0 }}>
                        {selectedExperience?.experience_type === 'ASSESSMENT'
                          ? 'Please select or create an assessment in the Lesson Builder first.'
                          : 'Please select or create an activity in the Activity Builder first to manage and design screens.'}
                      </p>
                    </div>
                    <button className="cs-btn-primary" onClick={() => setView(selectedExperience?.experience_type === 'ASSESSMENT' ? 'experience-builder' : 'activity-builder')} style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', background: '#0b57d0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                      {selectedExperience?.experience_type === 'ASSESSMENT' ? 'Go to Lesson Builder' : 'Go to Activity Builder'}
                    </button>
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
                      data-testid="add-new-screen-btn"
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
                    <div style={{ background: '#f8fafc', padding: '1.0rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>Active Activity</span>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '2px 0 0 0' }}>{selectedActivity.title}</h2>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Total Screens</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{screens.length}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Total Duration</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{selectedActivity.estimated_duration || selectedActivity.duration || 0} min</span>
                        </div>
                        <button
                          onClick={handleAddNewScreen}
                          disabled={!selectedActivity?.id}
                          data-testid="add-new-screen-btn"
                          style={{
                            background: 'linear-gradient(135deg, #0b57d0, #1d4ed8)',
                            color: '#ffffff', border: 'none', borderRadius: '10px',
                            padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.82rem',
                            cursor: !selectedActivity?.id ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 8px rgba(11,87,208,0.25)',
                            opacity: !selectedActivity?.id ? 0.6 : 1,
                            marginLeft: '0.5rem'
                          }}
                        >
                          + Add New Screen
                        </button>
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
                            data-testid="screen-card"
                            data-screen-title={scr.title}
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
                                  <span>🧱 {elementsCount} {elementsCount === 1 ? 'Block' : 'Blocks'}</span>
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

          {/* ───────────────── VIEW 6: RUNTIME PREVIEW ───────────────── */}
          {view === 'preview' && (() => {
            // Sort and filter experiences by chosen experience type (LESSON or ASSESSMENT) - Newest / Most Recent first
            const sortedExperiences = [...(experiences || [])]
              .sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at || 0).getTime() || (typeof a.id === 'number' ? a.id : 0);
                const dateB = new Date(b.updated_at || b.created_at || 0).getTime() || (typeof b.id === 'number' ? b.id : 0);
                return dateB - dateA;
              })
              .filter(exp => {
                const expType = exp.experience_type || 'LESSON';
                if (expType !== previewTypeFilter) return false;

                const searchLower = previewSearch.toLowerCase().trim();
                if (!searchLower) return true;
                return (
                  (exp.title || '').toLowerCase().includes(searchLower) ||
                  (exp.description || '').toLowerCase().includes(searchLower)
                );
              });

            // If no experience payload is loaded, show the selector grid view
            if (!previewPayload || !selectedExperience) {
              return (
                <div style={{ padding: '0.5rem 1rem', background: 'transparent', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.25rem', borderBottom: '1.5px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <button
                        onClick={() => { setPreviewTypeFilter('LESSON'); setPreviewSearch(''); }}
                        style={{
                          padding: '0.75rem 0.5rem',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: previewTypeFilter === 'LESSON' ? '#0284c7' : '#64748b',
                          border: 'none',
                          background: 'none',
                          borderBottom: previewTypeFilter === 'LESSON' ? '3px solid #0284c7' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          marginBottom: '-3.5px'
                        }}
                      >
                        Lessons
                      </button>
                      <button
                        onClick={() => { setPreviewTypeFilter('ASSESSMENT'); setPreviewSearch(''); }}
                        style={{
                          padding: '0.75rem 0.5rem',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: previewTypeFilter === 'ASSESSMENT' ? '#e11d48' : '#64748b',
                          border: 'none',
                          background: 'none',
                          borderBottom: previewTypeFilter === 'ASSESSMENT' ? '3px solid #e11d48' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          marginBottom: '-3.5px'
                        }}
                      >
                        Assessments
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      {/* Small Search Bar */}
                      <div style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-55%)', color: '#64748b', fontSize: '0.9rem' }} />
                        <input
                          type="text"
                          placeholder={previewTypeFilter === 'ASSESSMENT' ? "Search assessments..." : "Search lessons..."}
                          value={previewSearch}
                          onChange={e => setPreviewSearch(e.target.value)}
                          style={{
                            padding: '0.4rem 0.75rem 0.4rem 2.2rem',
                            fontSize: '0.82rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            width: '200px',
                            background: '#ffffff',
                            color: '#1e293b'
                          }}
                        />
                      </div>
                      <button className="cs-btn-outline" onClick={() => setView('experiences')}>
                        View Full Library
                      </button>
                    </div>
                  </div>

                  {sortedExperiences.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', gap: '1.25rem' }}>
                      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: previewTypeFilter === 'ASSESSMENT' ? '#ffe4e6' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: previewTypeFilter === 'ASSESSMENT' ? '#e11d48' : '#0284c7' }}>
                        {previewTypeFilter === 'ASSESSMENT' ? <FiFileText style={{ fontSize: '2.2rem' }} /> : <FiBookOpen style={{ fontSize: '2.2rem' }} />}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                          No {previewTypeFilter === 'ASSESSMENT' ? 'Assessments' : 'Lessons'} Created Yet
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '360px', margin: '0 auto' }}>
                          Create your first {previewTypeFilter === 'ASSESSMENT' ? 'assessment' : 'lesson'} in the Builder to test interactive screens here.
                        </p>
                      </div>
                      <button className="cs-btn-primary" onClick={() => setView('experience-builder')}>
                        + Create First {previewTypeFilter === 'ASSESSMENT' ? 'Assessment' : 'Lesson'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {sortedExperiences.map((exp, idx) => {
                        const gradeObj = gradesList.find(g => String(g.id) === String(exp.grade_id || exp.grade));
                        const gradeName = gradeObj ? gradeObj.grade_name : 'Grade Level';
                        const thumbUrl = getThumbnailUrl(exp.thumbnail);
                        const lessonNumber = idx + 1;
                        const isAssessment = exp.experience_type === 'ASSESSMENT';
                        return (
                          <div
                            key={exp.id}
                            style={{
                              background: '#ffffff',
                              borderRadius: '16px',
                              border: '1.5px solid #e2e8f0',
                              padding: '1.25rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.03)',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = isAssessment ? '#e11d48' : '#0284c7';
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = isAssessment ? '0 10px 20px rgba(225, 29, 72, 0.1)' : '0 10px 20px rgba(2, 132, 199, 0.1)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.03)';
                            }}
                            onClick={() => handleStartPreview(exp.id)}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span className="cs-badge" style={{ background: isAssessment ? '#e11d48' : '#0284c7', color: '#ffffff', fontWeight: 800 }}>
                                    {isAssessment ? 'Assessment' : 'Lesson'} #{lessonNumber}
                                  </span>
                                  <span className="cs-badge cs-badge-published" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                                    {gradeName}
                                  </span>
                                </div>
                                <span className={`cs-badge ${exp.status === 'APPROVED' ? 'cs-badge-approved' : 'cs-badge-draft'}`}>
                                  {exp.status || 'DRAFT'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '0.85rem' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#f1f5f9', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAssessment ? '#e11d48' : '#0284c7', fontSize: '1.5rem', border: '1px solid #e2e8f0' }}>
                                  {thumbUrl ? (
                                    <img src={thumbUrl} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    isAssessment ? <FiFileText /> : <FiBookOpen />
                                  )}
                                </div>
                                <div>
                                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                                    {exp.title}
                                  </h3>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {exp.subject || 'English'} · {exp.difficulty || 'Beginner'}
                                  </div>
                                </div>
                              </div>

                              <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0 0 1rem 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {exp.description || 'No description provided.'}
                              </p>
                            </div>

                            <button
                              className="cs-btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartPreview(exp.id);
                              }}
                              style={{
                                width: '100%',
                                background: isAssessment ? 'linear-gradient(135deg, #e11d48, #be123c)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0.6rem',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: isAssessment ? '0 2px 8px rgba(225, 29, 72, 0.25)' : '0 2px 8px rgba(2, 132, 199, 0.25)'
                              }}
                            >
                              <FiPlay style={{ fontSize: '0.9rem' }} /> Preview {isAssessment ? 'Assessment' : 'Lesson'} Screens
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const activeActivity = previewPayload?.activities?.[previewActivityIndex];
            const activeScreen = activeActivity?.screens?.[previewScreenIndex];
            const totalScreens = activeActivity?.screens?.length || 1;
            const activeScreenElements = (selectedScreen && activeScreen && (selectedScreen.id === activeScreen.id || selectedScreen.title === activeScreen.title) && screenForm?.elements)
              ? screenForm.elements
              : (activeScreen?.elements || []);

            const getNextScreenTarget = () => {
              const activities = previewPayload?.activities;
              if (!activities || activities.length === 0) return null;
              const currentAct = activities[previewActivityIndex];
              if (currentAct && currentAct.screens && previewScreenIndex < currentAct.screens.length - 1) {
                return { activityIndex: previewActivityIndex, screenIndex: previewScreenIndex + 1 };
              }
              for (let a = previewActivityIndex + 1; a < activities.length; a++) {
                const nextAct = activities[a];
                if (nextAct && nextAct.screens && nextAct.screens.length > 0) {
                  return { activityIndex: a, screenIndex: 0 };
                }
              }
              return null;
            };

            const getPrevScreenTarget = () => {
              const activities = previewPayload?.activities;
              if (!activities || activities.length === 0) return null;
              if (previewScreenIndex > 0) {
                const currentAct = activities[previewActivityIndex];
                if (currentAct && currentAct.screens && previewScreenIndex <= currentAct.screens.length) {
                  return { activityIndex: previewActivityIndex, screenIndex: previewScreenIndex - 1 };
                }
              }
              for (let a = previewActivityIndex - 1; a >= 0; a--) {
                const prevAct = activities[a];
                if (prevAct && prevAct.screens && prevAct.screens.length > 0) {
                  return { activityIndex: a, screenIndex: prevAct.screens.length - 1 };
                }
              }
              return null;
            };

            const nextTarget = getNextScreenTarget();
            const prevTarget = getPrevScreenTarget();

            return (
              <div ref={previewContainerRef} style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#ffffff', overflow: 'hidden' }}>
                {/* Top Header Toolbar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 2rem',
                  height: '64px',
                  backgroundColor: '#ffffff',
                  borderBottom: '1px solid #cbd5e1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  flexShrink: 0,
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      className="cs-btn-outline"
                      onClick={() => {
                        if (document.fullscreenElement && document.exitFullscreen) {
                          document.exitFullscreen().catch(() => {});
                        }
                        setPreviewPayload(null);
                      }}
                      style={{
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: '#0369a1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FiArrowLeft /> Select Different Lesson
                    </button>

                    <div style={{ borderLeft: '1px solid #cbd5e1', height: '24px' }} />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Previewing Lesson:
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                        {previewPayload?.experience?.title || selectedExperience?.title || 'Experience Preview'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '6px 16px',
                      borderRadius: '20px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 4px rgba(3,105,161,0.05)'
                    }}>
                      🖥️ Student App Simulator
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      className="cs-btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isPreviewFullscreen ? '#eff6ff' : '#ffffff', border: '1px solid #0b57d0', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: '#0b57d0' }}
                      onClick={togglePreviewFullscreen}
                      title="Toggle Fullscreen (or press F11)"
                    >
                      {isPreviewFullscreen ? <FiMinimize style={{ fontSize: '1rem' }} /> : <FiMaximize style={{ fontSize: '1rem' }} />}
                      {isPreviewFullscreen ? 'Exit Fullscreen' : 'Full Screen'}
                    </button>

                    <button
                      className="cs-btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: '#374151' }}
                      onClick={() => {
                        setPreviewActivityIndex(0);
                        setPreviewScreenIndex(0);
                        setPreviewAnswerIndex(null);
                        setPreviewAnswers({});
                        setVoiceRecordingStates({});
                        setDragDropSelections({});
                        setBlankAnswers({});
                        setFlippedCards({});
                      }}
                    >
                      ↺ Restart Experience
                    </button>
                  </div>
                </div>

                {/* Main Preview layout - side outline + center workspace */}
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, flex: 1, overflow: 'hidden', height: 'calc(100vh - 64px)' }}>

                  {/* Left Side: Experience outline navigation */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#ffffff', borderRight: '1px solid #cbd5e1', overflowY: 'auto', boxSizing: 'border-box' }}>
                    <div>
                      <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>Experience Navigator</h3>
                      <p style={{ fontSize: '0.65rem', color: '#64748b', margin: 0 }}>Click to jump directly to any screen</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {previewPayload?.activities && previewPayload.activities.map((act, actIdx) => (
                        <div key={act.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', borderLeft: previewActivityIndex === actIdx ? '3px solid #0b57d0' : '3px solid transparent' }}>
                            {actIdx + 1}. {act.title}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '0.5rem' }}>
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
                                    fontSize: '0.7rem',
                                    fontWeight: isActive ? 700 : 500,
                                    padding: '6px 10px',
                                    borderRadius: '6px',
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
                    <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.72rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Current Act:</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{previewActivityIndex + 1} of {previewPayload?.activities?.length || 1}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Screen Progress:</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{previewScreenIndex + 1} of {totalScreens}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Center Simulator Canvas */}
                  <div className="preview-viewport-main" style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>

                    {/* Scrollable Workspace Container */}
                    <div className="preview-workspace-scrollable" style={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '2rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      backgroundColor: '#ffffff'
                    }}>
                      {/* Device Simulator Card Wrapper */}
                      <div
                        ref={previewScaleRef}
                        style={{
                          width: '1000px',
                          maxWidth: '100%',
                          backgroundColor: '#ffffff',
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                          padding: '0',
                          boxSizing: 'border-box',
                          margin: '0 auto',
                          position: 'relative'
                        }}
                      >
                        {/* Content Preview Canvas body */}
                        {(() => {
                          const baseCanvasHeight = getCanvasHeight(activeScreenElements);
                          const scaledHeight = baseCanvasHeight * previewScaleFactor;
                          return (
                            <div style={{
                              width: '100%',
                              height: `${scaledHeight}px`,
                              position: 'relative',
                              overflow: 'visible'
                            }}>
                              <div
                                className="preview-canvas-viewport"
                                style={{
                                  width: '1000px',
                                  height: `${baseCanvasHeight}px`,
                                  padding: '2rem',
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  transform: `scale(${previewScaleFactor})`,
                                  transformOrigin: 'top left',
                                  background: '#ffffff',
                                  fontFamily: activeScreen?.content?.font || 'Poppins',
                                  boxSizing: 'border-box',
                                  overflow: 'visible'
                                }}
                              >
                                <PreviewCanvasRenderer
                                  elements={activeScreenElements}
                                  activeScreenId={activeScreen?.id || ''}
                                  previewAnswers={previewAnswers}
                                  setPreviewAnswers={setPreviewAnswers}
                                  voiceRecordingStates={voiceRecordingStates}
                                  setVoiceRecordingStates={setVoiceRecordingStates}
                                  dragDropSelections={dragDropSelections}
                                  setDragDropSelections={setDragDropSelections}
                                  blankAnswers={blankAnswers}
                                  flippedCards={flippedCards}
                                  setFlippedCards={setFlippedCards}
                                  resolveUrl={resolveMediaUrl}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Device bottom navigation control bar */}
                    <div className="preview-footer-sticky" style={{
                      position: 'sticky',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: '#ffffff',
                      borderTop: '1px solid #e2e8f0',
                      padding: '1rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      zIndex: 50,
                      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)',
                      boxSizing: 'border-box',
                      width: '100%'
                    }}>
                      <button
                        className="cs-btn-outline"
                        disabled={!prevTarget}
                        onClick={() => {
                          if (prevTarget) {
                            setPreviewActivityIndex(prevTarget.activityIndex);
                            setPreviewScreenIndex(prevTarget.screenIndex);
                          }
                          setPreviewAnswerIndex(null);
                        }}
                        style={{ padding: '0.45rem 1.1rem', fontSize: '0.78rem', background: '#ffffff', cursor: !prevTarget ? 'not-allowed' : 'pointer', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#334155' }}
                      >
                        ← Previous Screen
                      </button>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                        Screen {previewScreenIndex + 1} of {totalScreens} (Act {previewActivityIndex + 1} of {previewPayload?.activities?.length || 1})
                      </span>
                      <button
                        className="cs-btn-outline"
                        disabled={!nextTarget}
                        onClick={() => {
                          if (nextTarget) {
                            setPreviewActivityIndex(nextTarget.activityIndex);
                            setPreviewScreenIndex(nextTarget.screenIndex);
                          }
                          setPreviewAnswerIndex(null);
                        }}
                        style={{ padding: '0.45rem 1.1rem', fontSize: '0.78rem', background: '#ffffff', cursor: !nextTarget ? 'not-allowed' : 'pointer', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#334155' }}
                      >
                        Next Screen →
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            );
          })()}

          {/* ───────────────── VIEW 8: PUBLISH CENTER ───────────────── */}
          {view === 'publish' && (
            <>
              {/* Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.5rem' }}>

                <div style={{ display: 'flex', gap: '0.55rem' }}>
                  <button className="cs-btn-outline" onClick={() => setView('experiences')}>Back to Library</button>
                </div>
              </div>

              {/* Main Content: single full-width column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>

                {/* LEFT COLUMN: Compile Form & Build History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Card 1: Experience Build & Compiler Form */}
                  <div className="cs-card">
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0 0 1rem 0', color: '#0f172a' }}>
                      Generate New EnglishLab Package (.zip)
                    </h3>

                    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 84, height: 64, background: '#f1f5f9', borderRadius: 6, flexShrink: 0, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: '1.25rem' }}>
                        {getThumbnailUrl(selectedExperience?.thumbnail) ? (
                          <img
                            src={getThumbnailUrl(selectedExperience.thumbnail)}
                            alt={selectedExperience?.title || 'Lesson'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <FiDownload />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px 0', color: '#1e293b' }}>
                          {selectedExperience?.title || 'Lesson'}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.72rem', color: '#475569', marginTop: '6px' }}>
                          <span>Target: <strong>{selectedExperience?.grade_name || gradesList.find(g => String(g.id) === String(selectedExperience?.grade_id || selectedExperience?.grade))?.grade_name || '—'}</strong></span>
                          <span>Difficulty: <strong>{selectedExperience?.difficulty_display || selectedExperience?.difficulty || '—'}</strong></span>
                          <span>Activities: <strong>{activities.length}</strong></span>
                          <span>Screens: <strong>{activities.reduce((acc, act) => acc + (act.screen_count ?? act.screens?.length ?? 0), 0)}</strong></span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="cs-btn-outline"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.72rem',
                          borderColor: '#cbd5e1',
                          color: '#dc2626',
                          background: '#fff5f5',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          alignSelf: 'center'
                        }}
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            const res = await apiFetch(`/api/v1/content/validation/${selectedExperience.id}/run/`, { method: 'POST' });
                            if (res.ok) {
                              const report = await res.json();
                              setValidationReport(report);
                              setView('validation-report');
                            } else {
                              showFeedback('Failed to run validation.', 'error');
                            }
                          } catch (err) {
                            showFeedback('Error running validation.', 'error');
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                      >
                        🔍 Check Validation
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                      <div className="cs-form-group">
                        <label className="cs-form-label" style={{ fontSize: '0.75rem' }}>Version Number <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          className="cs-form-input"
                          data-testid="publish-version-input"
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
                        data-testid="build-publish-package-btn"
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
                        {actionLoading ? 'Compiling Build...' : 'Build & Publish the Package'}
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
                            <th>L.No</th>
                            <th>LESSON</th>
                            <th>VERSION</th>
                            <th>PACKAGE FILE</th>
                            <th>SIZE</th>
                            <th>PUBLISHED ON</th>
                            <th>STATUS</th>
                            <th>DOWNLOAD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const PUBLISH_PER_PAGE = 5;
                            const paginatedHistory = publishHistory.slice((publishPage - 1) * PUBLISH_PER_PAGE, publishPage * PUBLISH_PER_PAGE);
                            if (paginatedHistory.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem', fontSize: '0.82rem' }}>
                                    No builds published yet. Specify a version above to compile.
                                  </td>
                                </tr>
                              );
                            }
                            return paginatedHistory.map((pkg, idx) => {
                              const lessonTitle = pkg.experience_title || selectedExperience?.title || 'Experience';
                              const zipFilename = `${lessonTitle.replace(/\s+/g, '_')}_v${pkg.version_number || '1.0.0'}.zip`;
                              // The actual overall list index for the current item
                              const overallIdx = (publishPage - 1) * PUBLISH_PER_PAGE + idx;
                              const isLatest = overallIdx === 0;
                              return (
                                <tr key={pkg.id}>
                                  <td style={{ fontWeight: 700, color: '#475569' }}>{overallIdx + 1}</td>
                                  <td
                                    style={{ fontWeight: 700, color: '#0f172a', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    title={lessonTitle}
                                  >
                                    {lessonTitle}
                                  </td>
                                  <td style={{ fontWeight: 700, color: '#0284c7' }}>v{pkg.version_number || '—'}</td>
                                  <td style={{ color: '#475569', fontSize: '0.72rem', fontFamily: 'monospace' }}>{zipFilename}</td>
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
                                        title="Download package (.zip)"
                                        data-testid="download-elab-btn"
                                        onClick={() => handleDownloadPackageElab(pkg.id, zipFilename)}
                                        style={{
                                          background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                                          borderRadius: 5, padding: '3px 7px', fontSize: '0.68rem',
                                          fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                                        }}
                                      >
                                        ⬇ .zip
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    {publishHistory.length > 5 && (
                      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
                        <div className="cs-pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Showing {publishHistory.length > 0 ? (publishPage - 1) * 5 + 1 : 0} to {Math.min(publishPage * 5, publishHistory.length)} of {publishHistory.length} builds
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <button
                              className="cs-page-link"
                              disabled={publishPage === 1}
                              onClick={() => setPublishPage(publishPage - 1)}
                              style={{ cursor: publishPage === 1 ? 'not-allowed' : 'pointer', opacity: publishPage === 1 ? 0.5 : 1 }}
                            >
                              &lt;
                            </button>
                            {Array.from({ length: Math.max(1, Math.ceil(publishHistory.length / 5)) }, (_, i) => i + 1).map(pageNum => (
                              <button
                                key={pageNum}
                                className={`cs-page-link ${publishPage === pageNum ? 'active' : ''}`}
                                onClick={() => setPublishPage(pageNum)}
                                style={{ cursor: 'pointer' }}
                              >
                                {pageNum}
                              </button>
                            ))}
                            <button
                              className="cs-page-link"
                              disabled={publishPage >= Math.ceil(publishHistory.length / 5)}
                              onClick={() => setPublishPage(publishPage + 1)}
                              style={{ cursor: publishPage >= Math.ceil(publishHistory.length / 5) ? 'not-allowed' : 'pointer', opacity: publishPage >= Math.ceil(publishHistory.length / 5) ? 0.5 : 1 }}
                            >
                              &gt;
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───────────────── VIEW: VALIDATION REPORT ───────────────── */}
          {view === 'validation-report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
              {/* Top Header / Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="cs-btn-outline"
                  onClick={() => setView('publish')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600 }}
                >
                  ← Back to Publish Center
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                  EXPERIENCE VALIDATION ENGINE v1.0
                </span>
              </div>

              {/* Summary Card */}
              <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: validationReport?.status === 'PASSED' ? '4px solid #10b981' : '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                    Validation Report for "{selectedExperience?.title}"
                  </h3>
                  <span
                    className={`cs-badge ${validationReport?.status === 'PASSED' ? 'cs-badge-published' : ''}`}
                    style={validationReport?.status === 'PASSED' ? {} : { background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}
                  >
                    {validationReport?.status === 'PASSED' ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: '#475569', marginTop: '0.25rem' }}>
                  <span style={{ color: '#f59e0b' }}>Warnings: <strong>{validationReport?.warnings || 0}</strong></span>
                  <span style={{ color: '#ef4444' }}>Errors: <strong>{validationReport?.errors || 0}</strong></span>
                </div>
              </div>

              {/* Errors & Warnings List */}
              <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', color: '#0f172a' }}>
                  Identified Validation Issues
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(() => {
                    const results = validationReport?.results || [];
                    const issues = results.filter(r => r.severity === 'ERROR' || r.severity === 'WARNING');
                    if (issues.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.5rem' }}>
                            ✓
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>All Checks Passed!</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '300px' }}>Your experience metadata, activities, media files, and screen layout are valid and ready to publish.</span>
                        </div>
                      );
                    }

                    return issues.map((issue, idx) => {
                      const isError = issue.severity === 'ERROR';
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: isError ? '#fef2f2' : '#fffbeb',
                            border: isError ? '1px solid #fee2e2' : '1px solid #fef3c7',
                            alignItems: 'flex-start'
                          }}
                        >
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.58rem',
                              fontWeight: 800,
                              color: '#ffffff',
                              background: isError ? '#ef4444' : '#f59e0b',
                              textTransform: 'uppercase',
                              marginTop: '2px'
                            }}
                          >
                            {issue.severity}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isError ? '#991b1b' : '#92400e' }}>
                              {issue.message}
                            </span>
                            {issue.check_name && (
                              <span style={{ fontSize: '0.62rem', color: '#64748b' }}>
                                Rule: {issue.check_name}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}


          {/* ── View 9: Profile Settings ── */}
          {view === 'profile' && (
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
                        <UserAvatar user={currentUserState} size="large" initials="CC" />
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
                          {currentUserState?.profile_picture && currentUserState.profile_picture.toLowerCase() !== 'avatar' && !currentUserState.profile_picture.toLowerCase().endsWith('/avatar') && !currentUserState.profile_picture.toLowerCase().endsWith('/avatar/') && (
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
                          maxLength={10}
                          value={profileForm.phone_no || ''}
                          onChange={e => {
                            const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setProfileForm({ ...profileForm, phone_no: cleaned });
                          }}
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



          {/* ── AI Content Generator Assistant Modal ── */}
          {showAiModal && (
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
              onClick={() => setShowAiModal(false)}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '650px',
                  maxHeight: '90vh',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  overflowY: 'auto'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>AI Assistant</span>
                  </h3>
                  <button
                    onClick={() => setShowAiModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                  >
                    <FiX />
                  </button>
                </div>

                <form onSubmit={handleGenerateAIContent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="cs-form-group">
                    <label className="cs-form-label" style={{ fontWeight: 600 }}>Topic / Prompt</label>
                    <input
                      data-testid="ai-topic-input"
                      type="text"
                      className="cs-form-input"
                      value={aiForm.topic}
                      onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                      placeholder="e.g. English Grammar - Present Continuous Tense"
                      style={{ height: '36px' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="cs-form-group">
                      <label className="cs-form-label" style={{ fontWeight: 600 }}>Content Type</label>
                      <select
                        data-testid="ai-type-select"
                        className="cs-form-input"
                        value={aiForm.content_type}
                        onChange={e => setAiForm({ ...aiForm, content_type: e.target.value })}
                        style={{ height: '36px' }}
                      >
                        <option value="quiz_listening">Quiz</option>
                        <option value="sequence_audio">Sequence / Order</option>
                        <option value="pronunciation">Pronunciation Practice</option>
                        <option value="reading_passage">Reading Passage & Questions</option>
                        <option value="match">Match the Following / Pairs</option>
                        <option value="flashcards">Flashcard Deck</option>
                        <option value="wordsearch">Word Search Puzzle</option>
                        <option value="fill_blank">Fill in the Blanks</option>
                        <option value="writing_prompt">Writing Prompt & Essay</option>
                        <option value="sentence_builder">Sentence Builder / Unscramble</option>
                        <option value="grammar_correction">Grammar Correction</option>
                        <option value="true_false">True / False Challenge</option>
                        <option value="drag_drop">Drag & Drop Classification</option>
                      </select>
                    </div>

                    <div className="cs-form-group">
                      <label className="cs-form-label" style={{ fontWeight: 600 }}>Target Level</label>
                      <select
                        data-testid="ai-level-select"
                        className="cs-form-input"
                        value={aiForm.target_level}
                        onChange={e => setAiForm({ ...aiForm, target_level: e.target.value })}
                        style={{ height: '36px' }}
                      >
                        <option value="Beginner / Grade 5">Beginner (Grade 3-5)</option>
                        <option value="Intermediate / Grade 7">Intermediate (Grade 6-7)</option>
                        <option value="Advanced / Grade 8">Advanced (Grade 8)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="sd-btn-cancel"
                      onClick={() => setShowAiModal(false)}
                      style={{ padding: '0.55rem 1.25rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      data-testid="ai-submit-btn"
                      type="submit"
                      className="cs-btn-primary"
                      disabled={aiLoading}
                      style={{ background: '#7c3aed', color: '#ffffff', fontWeight: 600, padding: '0.55rem 1.25rem', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {aiLoading ? (
                        <>
                          <FiRefreshCw className="spin" /> Generating...
                        </>
                      ) : 'Generate with AI'}
                    </button>
                  </div>
                </form>

                {/* Preview Section */}
                {aiPreviewData && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>AI Preview Results</div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #cbd5e1', maxHeight: '200px', overflowY: 'auto' }}>
                      <pre style={{ fontSize: '0.78rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                        {JSON.stringify(aiPreviewData, null, 2)}
                      </pre>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        data-testid="ai-accept-btn"
                        onClick={handleAcceptAIContent}
                        style={{
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.55rem 1.5rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(22,163,74,0.25)'
                        }}
                      >
                        Accept & Insert
                      </button>
                    </div>
                  </div>
                )}
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

                <div style={{ marginBottom: customPrompt.error ? '0.4rem' : '1.5rem' }}>
                  <input
                    type="text"
                    data-testid="prompt-modal-input"
                    style={{
                      width: '100%',
                      height: '38px',
                      fontSize: '0.88rem',
                      padding: '0 0.75rem',
                      borderRadius: '8px',
                      border: customPrompt.error ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    value={customPrompt.value}
                    onChange={e => setCustomPrompt(prev => ({ ...prev, value: e.target.value, error: '' }))}
                    placeholder={customPrompt.placeholder || 'Enter value...'}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (!customPrompt.value || !customPrompt.value.trim()) {
                          setCustomPrompt(prev => ({ ...prev, error: 'This field is required.' }));
                          return;
                        }
                        customPrompt.onConfirm && customPrompt.onConfirm(customPrompt.value);
                        setCustomPrompt(prev => ({ ...prev, show: false }));
                      }
                    }}
                  />
                  {customPrompt.error && (
                    <p data-testid="prompt-modal-error" style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.35rem 0 0 0' }}>
                      {customPrompt.error}
                    </p>
                  )}
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
                    data-testid="prompt-modal-confirm"
                    style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', backgroundColor: '#0b57d0', color: '#ffffff', border: 'none', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'center' }}
                    onClick={() => {
                      if (!customPrompt.value || !customPrompt.value.trim()) {
                        setCustomPrompt(prev => ({ ...prev, error: 'This field is required.' }));
                        return;
                      }
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

      {/* -- Help & Support Modal -- */}
      <HelpSupportModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      {cropImageSrc && (
        <AvatarCropperModal
          src={cropImageSrc}
          onCrop={handleCropSave}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

      {showNotifModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundImage: `url(${contentStudioBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: 'transparent', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(15,23,42,0.08)', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#4f46e5', color: '#ffffff', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <FiBell />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Content Studio Notifications</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Stay updated with scenario building and media assets alerts</p>
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
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#334155' }}>Recent Studio Alerts</h4>
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
                    notifications.map(n => {
                      const title = n.title || 'Notification';
                      const message = n.message || n.text || '';
                      const time = n.time || (n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recently');
                      const read = n.read !== undefined ? n.read : n.is_read;
                      return (
                        <div key={n.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: read ? '#ffffff' : '#f0fdf4', border: `1px solid ${read ? '#e2e8f0' : '#bbf7d0'}`, position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: read ? 600 : 700 }}>{title}</span>
                            <span style={{ fontSize: '0.8rem', color: '#475569' }}>{message}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{time}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {!read && (
                              <button style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }} onClick={async () => {
                                try {
                                  await apiFetch('/api/v1/dashboard/notifications', { method: 'POST' });
                                  setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true, is_read: true } : item));
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
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRecentActivityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundImage: `url(${contentStudioBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(15, 23, 42, 0.08)', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: '#0284c7', color: '#ffffff', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                <FiClock />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Recent Activity History</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Detailed view of recent updates and media assets uploaded</p>
              </div>
            </div>
            <button style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowRecentActivityModal(false)}>
              <FiX size={18} />
            </button>
          </div>
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: 'transparent' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', padding: '24px' }}>
              {recentActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <FiClock size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ margin: 0 }}>No recent activities found.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  {recentActivities.map((act, i) => {
                    const isEdit = act.activity_type === 'experience_edited';
                    const actDate = new Date(act.timestamp);
                    return (
                      <div key={act.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i === recentActivities.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: isEdit ? '#e0f2fe' : '#ffedd5', color: isEdit ? '#0284c7' : '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isEdit ? <FiEdit2 /> : <FiUpload />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{act.message}</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>{actDate.toLocaleDateString()} at {actDate.toLocaleTimeString()}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', backgroundColor: isEdit ? '#e0f2fe' : '#ffedd5', color: isEdit ? '#0369a1' : '#ea580c' }}>
                          {isEdit ? 'Experience' : 'Media'}
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

};

export default ContentStudio;
