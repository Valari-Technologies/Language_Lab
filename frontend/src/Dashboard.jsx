import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiUsers, FiBookOpen, FiBarChart2, FiUser,
  FiSettings, FiHelpCircle, FiLogOut, FiSearch,
  FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiCalendar, FiBell, FiFilter,
  FiCheckCircle, FiMonitor, FiSmartphone, FiFileText,
  FiActivity, FiTrendingUp, FiAward, FiLock,
  FiChevronLeft, FiChevronRight, FiEye, FiEyeOff, FiList,
  FiCornerDownRight, FiXCircle, FiMoreVertical, FiDownload, FiAlertTriangle, FiKey, FiInfo, FiRefreshCw, FiUpload, FiVolume2
} from 'react-icons/fi';
import PreviewCanvasRenderer from './PreviewCanvasRenderer';
import './Dashboard.css';
import { apiFetch } from './api';
import { API_BASE_URL } from './config';
import dashboardHeaderBanner from './assets/1.jpeg';
import superAdminBg from './assets/superadminbg.png';

const resolvePreviewUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = url.startsWith('/') ? url : '/' + url;
  return `${base}${path}`;
};

const getPreviewMediaUrl = (screen, type) => {
  if (!screen) return '';
  const element = screen.elements?.find(el => el.type === type);
  if (element && element.content?.url) {
    return resolvePreviewUrl(element.content.url);
  }
  const mediaItem = screen.resolved_media?.find(m => m.type?.toLowerCase() === type.toLowerCase() || (type === 'audio' && m.type?.toLowerCase() === 'speaking'));
  if (mediaItem && mediaItem.url) {
    return resolvePreviewUrl(mediaItem.url);
  }
  if (screen.resolved_media?.[0]?.url) {
    return resolvePreviewUrl(screen.resolved_media[0].url);
  }
  return resolvePreviewUrl(screen.content?.media_url || '');
};

import logoIcon from './assets/icon.png';
import AvatarCropperModal from './AvatarCropperModal';

const INDIAN_STATES_AND_CITIES = {
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tirunelveli", "Salem", "Tiruchirappalli (Trichy)",
    "Tiruppur", "Erode", "Vellore", "Thanjavur", "Tuticorin (Thoothukudi)", "Dindigul",
    "Nagercoil", "Kanchipuram", "Karur", "Cuddalore", "Kumbakonam", "Neyveli"
  ],
  "Karnataka": [
    "Bangalore (Bengaluru)", "Mysore (Mysuru)", "Hubli-Dharwad", "Mangalore (Mangaluru)",
    "Belgaum (Belagavi)", "Gulbarga (Kalaburagi)", "Davangere", "Bellary (Ballari)",
    "Shimoga (Shivamogga)", "Tumkur (Tumakuru)", "Udupi"
  ],
  "Kerala": [
    "Thiruvananthapuram (Trivandrum)", "Kochi (Cochin)", "Kozhikode (Calicut)",
    "Thrissur", "Kollam", "Kannur", "Alappuzha", "Kottayam", "Palakkad", "Malappuram"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry",
    "Tirupati", "Kakinada", "Kadapa", "Anantapur"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Pimpri-Chinchwad", "Nashik", "Kalyan-Dombivli",
    "Vasai-Virar", "Aurangabad", "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Amravati", "Nanded", "Kolhapur"
  ],
  "Delhi (UT)": [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
    "North West Delhi", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara (Baroda)", "Rajkot", "Bhavnagar", "Jamnagar",
    "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda",
    "Kharagpur", "Haldia"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj (Allahabad)",
    "Noida", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Jhansi"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara",
    "Alwar", "Sikar", "Bharatpur"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali",
    "Pathankot", "Hoshiarpur"
  ],
  "Haryana": [
    "Gurugram (Gurgaon)", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak",
    "Hisar", "Karnal", "Panchkula"
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah"
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur"
  ],
  "Goa": [
    "Panaji (Panjim)", "Margao", "Vasco da Gama", "Mapusa", "Ponda"
  ],
  "Puducherry (UT)": [
    "Puducherry", "Karaikal", "Mahe", "Yanam"
  ],
  "Chandigarh (UT)": [
    "Chandigarh"
  ],
  "Jammu & Kashmir (UT)": [
    "Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Kashipur"
  ],
  "Himachal Pradesh": [
    "Shimla", "Dharamshala", "Mandi", "Solan", "Baddi", "Kullu"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Hazaribagh", "Deoghar"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Durg"
  ],
  "Tripura": [
    "Agartala"
  ],
  "Meghalaya": [
    "Shillong", "Tura"
  ],
  "Manipur": [
    "Imphal"
  ],
  "Nagaland": [
    "Dimapur", "Kohima"
  ],
  "Arunachal Pradesh": [
    "Itanagar"
  ],
  "Mizoram": [
    "Aizawl"
  ],
  "Sikkim": [
    "Gangtok"
  ],
  "Ladakh (UT)": [
    "Leh", "Kargil"
  ],
  "Andaman & Nicobar (UT)": [
    "Port Blair"
  ]
};

/* ─── SVG Donut Chart helper ─── */
const MultiDonutChart = ({ total = 124, activeCount = 78, expiringCount = 28, expiredCount = 18 }) => {
  const R = 44, CX = 60, CY = 60;
  const circ = 2 * Math.PI * R; // ~276.46
  const activePct = activeCount / total;
  const expiringPct = expiringCount / total;
  const expiredPct = expiredCount / total;

  const activeDash = activePct * circ;
  const expiringDash = expiringPct * circ;
  const expiredDash = expiredPct * circ;

  return (
    <svg viewBox="0 0 120 120" width="135" height="135" className="sd-donut-svg">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth="12" />
      {/* Active Segment (Deep Blue) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#006aa6" strokeWidth="12"
        strokeDasharray={`${activeDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${CX} ${CY})`}
      />
      {/* Expiring Soon Segment (Medium Blue-Cyan) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#0ea5e9" strokeWidth="12"
        strokeDasharray={`${expiringDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(${-90 + (activePct * 360)} ${CX} ${CY})`}
      />
      {/* Expired Segment (Light Sky Blue) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#38bdf8" strokeWidth="12"
        strokeDasharray={`${expiredDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(${-90 + ((activePct + expiringPct) * 360)} ${CX} ${CY})`}
      />

      {/* Inner circle for cleaner donut hole */}
      <circle cx={CX} cy={CY} r={R - 6} fill="#ffffff" />

      <text x={CX} y={CY - 4} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 16, fontWeight: 800, fill: '#0f172a', fontFamily: 'Outfit,Inter,sans-serif' }}>
        {total}
      </text>
      <text x={CX} y={CY + 11} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 9, fill: '#64748b', fontWeight: 600, fontFamily: 'Outfit,Inter,sans-serif', letterSpacing: '0.02em' }}>
        Total
      </text>
    </svg>
  );
};

/* ─── SVG Subscription Plan Distribution Donut helper ─── */
const DistributionDonutChart = () => {
  const R = 44, CX = 60, CY = 60;
  const circ = 2 * Math.PI * R; // ~276.46
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
    <svg viewBox="0 0 120 120" width="135" height="135" className="sd-donut-svg" style={{ filter: 'drop-shadow(0px 6px 12px rgba(3, 105, 161, 0.15))', transition: 'all 0.3s ease' }}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth="12" />
      {/* Basic (Dark Navy Blue) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#004e75" strokeWidth="12"
        strokeDasharray={`${basicDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${CX} ${CY})`}
      />
      {/* Standard (Deep Blue) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#006aa6" strokeWidth="12"
        strokeDasharray={`${standardDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(${-90 + (basicPct * 360)} ${CX} ${CY})`}
      />
      {/* Premium (Medium Blue-Cyan) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#0ea5e9" strokeWidth="12"
        strokeDasharray={`${premiumDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(${-90 + ((basicPct + standardPct) * 360)} ${CX} ${CY})`}
      />
      {/* Enterprise (Light Sky Blue) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#38bdf8" strokeWidth="12"
        strokeDasharray={`${enterpriseDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(${-90 + ((basicPct + standardPct + premiumPct) * 360)} ${CX} ${CY})`}
      />
      {/* Expired / Cancelled (Very Light Blue) */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#bae6fd" strokeWidth="12"
        strokeDasharray={`${expiredDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(${-90 + ((basicPct + standardPct + premiumPct + enterprisePct) * 360)} ${CX} ${CY})`}
      />

      {/* Inner circle for cleaner donut hole */}
      <circle cx={CX} cy={CY} r={R - 6} fill="#ffffff" />

      <text x={CX} y={CY - 4} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 16, fontWeight: 800, fill: '#0f172a', fontFamily: 'Outfit,Inter,sans-serif' }}>
        124
      </text>
      <text x={CX} y={CY + 11} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 9, fill: '#64748b', fontWeight: 600, fontFamily: 'Outfit,Inter,sans-serif', letterSpacing: '0.02em' }}>
        TOTAL
      </text>
    </svg>
  );
};

/* ─── SVG Stat Card Mini Charts ─── */
const MiniLineChart = ({ color, fillGradId, points }) => {
  return (
    <svg viewBox="0 0 100 40" width="95" height="38" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d={points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * 25},${40 - p}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * 25},${40 - p}`).join(' ')} L100,40 L0,40 Z`}
        fill={`url(#${fillGradId})`}
      />
      <circle cx="100" cy={40 - points[points.length - 1]} r="3.5" fill={color} stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
};

const MiniBarChart = ({ color, values }) => {
  return (
    <svg viewBox="0 0 80 40" width="75" height="38">
      {values.map((v, i) => (
        <rect
          key={i}
          x={i * 12 + 6}
          y={40 - v}
          width="6"
          height={v}
          rx="2.5"
          fill={color}
        />
      ))}
    </svg>
  );
};

/* ─── SVG Line Chart helper ─── */
const ActivityLineChart = () => {
  return (
    <svg viewBox="0 0 500 160" width="100%" height="180" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="shadow-blue" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4.5" flood-color="#3b82f6" flood-opacity="0.32" />
        </filter>
        <filter id="shadow-green" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4.5" flood-color="#10b981" flood-opacity="0.32" />
        </filter>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Y-Axis Labels */}
      <text x="15" y="20" textAnchor="end" dominantBaseline="middle" style={{ fontSize: 10, fill: '#64748b', fontWeight: 600, fontFamily: 'Outfit,Inter,sans-serif' }}>80K</text>
      <text x="15" y="52.5" textAnchor="end" dominantBaseline="middle" style={{ fontSize: 10, fill: '#64748b', fontWeight: 600, fontFamily: 'Outfit,Inter,sans-serif' }}>60K</text>
      <text x="15" y="85" textAnchor="end" dominantBaseline="middle" style={{ fontSize: 10, fill: '#64748b', fontWeight: 600, fontFamily: 'Outfit,Inter,sans-serif' }}>40K</text>
      <text x="15" y="117.5" textAnchor="end" dominantBaseline="middle" style={{ fontSize: 10, fill: '#64748b', fontWeight: 600, fontFamily: 'Outfit,Inter,sans-serif' }}>20K</text>
      <text x="15" y="150" textAnchor="end" dominantBaseline="middle" style={{ fontSize: 10, fill: '#64748b', fontWeight: 600, fontFamily: 'Outfit,Inter,sans-serif' }}>0</text>

      {/* Grid lines starting at x1="30" */}
      <line x1="30" y1="150" x2="500" y2="150" stroke="#dbe3f0" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="30" y1="117.5" x2="500" y2="117.5" stroke="#dbe3f0" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="30" y1="85" x2="500" y2="85" stroke="#dbe3f0" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="30" y1="52.5" x2="500" y2="52.5" stroke="#dbe3f0" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="30" y1="20" x2="500" y2="20" stroke="#dbe3f0" strokeWidth="1" strokeOpacity="0.6" />

      {/* Blue Path (Active Students) */}
      <path
        d="M 35 85 C 95 70, 115 50, 155 55 C 195 60, 235 100, 275 90 C 315 80, 355 50, 395 45 C 435 40, 455 25, 495 20"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#shadow-blue)"
      />
      <path
        d="M 35 85 C 95 70, 115 50, 155 55 C 195 60, 235 100, 275 90 C 315 80, 355 50, 395 45 C 435 40, 455 25, 495 20 L 495 150 L 35 150 Z"
        fill="url(#blueGrad)"
      />
      {/* Dots on Blue Path */}
      <circle cx="35" cy="85" r="4.5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
      <circle cx="155" cy="55" r="4.5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
      <circle cx="275" cy="90" r="4.5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
      <circle cx="395" cy="45" r="4.5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
      <circle cx="495" cy="20" r="4.5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />

      {/* Green Path (Completed Activities) */}
      <path
        d="M 35 115 C 95 110, 115 95, 155 102 C 195 110, 235 128, 275 120 C 315 112, 355 98, 395 102 C 435 106, 455 108, 495 110"
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#shadow-green)"
      />
      <path
        d="M 35 115 C 95 110, 115 95, 155 102 C 195 110, 235 128, 275 120 C 315 112, 355 98, 395 102 C 435 106, 455 108, 495 110 L 495 150 L 35 150 Z"
        fill="url(#greenGrad)"
      />
      {/* Dots on Green Path */}
      <circle cx="35" cy="115" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
      <circle cx="155" cy="102" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
      <circle cx="275" cy="120" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
      <circle cx="395" cy="102" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
      <circle cx="495" cy="110" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
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
          <FiChevronLeft />
        </button>
        {items.map((it, i) =>
          it === '...'
            ? <span key={i} className="sd-page-btn ellipsis">…</span>
            : <button key={it} className={`sd-page-btn${page === it ? ' active' : ''}`} onClick={() => onPage(it)}>{it}</button>
        )}
        <button className="sd-page-btn arrow" disabled={page === pages} onClick={() => onPage(page + 1)}>
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const Dashboard = ({ user: propUser, onLogout, activeTab, onTabChange, onUpdateUser }) => {
  const [user, setUser] = useState(propUser);
  useEffect(() => {
    setUser(propUser);
  }, [propUser]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customAlert, setCustomAlert] = useState({ show: false, title: 'Attention', message: '', type: 'warning' });
  const triggerAlert = (message, title = 'Attention', type = 'warning') => {
    setCustomAlert({ show: true, title, message, type });
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('');

  /* ── Pagination ── */
  const [schoolsPage, setSchoolsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [gradesPage, setGradesPage] = useState(1);
  const [experiencesPage, setExperiencesPage] = useState(1);
  const [experienceBuildersPage, setExperienceBuildersPage] = useState(1);
  const [publishPage, setPublishPage] = useState(1);
  const PER_PAGE = 4;

  /* ── Data lists ── */
  const [grades, setGrades] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [submittedExperiences, setSubmittedExperiences] = useState([]);
  const [saExpFilter, setSaExpFilter] = useState('');
  const [saExpPage, setSaExpPage] = useState(1);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectRemark, setRejectRemark] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [experienceBuilders, setExperienceBuilders] = useState([]);
  const [schools, setSchools] = useState([]);
  const [publishContents, setPublishContents] = useState([]);
  const [schoolAdmins, setSchoolAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ total_schools: 0, total_school_admins: 0, total_publish_contents: 0, total_grades: 0, total_experiences: 0, draft_experiences: 0, published_experiences: 0 });
  const [previewExperience, setPreviewExperience] = useState(null);

  // Interactive widget states for Super Admin preview
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [voiceRecordingStates, setVoiceRecordingStates] = useState({});
  const [dragDropSelections, setDragDropSelections] = useState({});
  const [blankAnswers, setBlankAnswers] = useState({});
  const [flippedCards, setFlippedCards] = useState({});


  const [selectedSchoolDetail, setSelectedSchoolDetail] = useState(null);
  const [showSchoolDetailModal, setShowSchoolDetailModal] = useState(false);
  const [selectedSchoolAdminDetail, setSelectedSchoolAdminDetail] = useState(null);
  const [showSchoolAdminDetailModal, setShowSchoolAdminDetailModal] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState(null); // { id, type }
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "School Onboarding Request", message: "New school onboarding request received from Apex International Academy.", time: "30 mins ago", type: "info", read: false },
    { id: 2, title: "Sync Ingestion Completed", message: "SCAD World School completed offline data ingestion (142 student logs synced).", time: "2 hours ago", type: "success", read: false },
    { id: 3, title: "System Sync Warning", message: "Apex International Academy reported offline telemetry synchronization timeout.", time: "1 day ago", type: "warning", read: true },
    { id: 4, title: "System Maintenance", message: "Database backup & system optimization completed successfully.", time: "Yesterday", type: "system", read: true },
  ]);
  const [recentActivitiesList, setRecentActivitiesList] = useState([
    { id: 1, icon: <FiGrid />, color: '#3b82f6', bg: '#eff6ff', desc: "School \"Greenfield Academy\" registered", meta: 'Super Admin • 10 mins ago', tag: 'School', tagBg: '#dcfce7', tagColor: '#15803d' },
    { id: 2, icon: <FiCheckCircle />, color: '#10b981', bg: '#e0fdf4', desc: "Lesson \"The Lost Picnic\" approved by Super Admin", meta: 'Super Admin • 1 hour ago', tag: 'Approval', tagBg: '#e0f2fe', tagColor: '#0369a1' },
    { id: 3, icon: <FiUser />, color: '#8b5cf6', bg: '#f5f3ff', desc: "Super Admin profile settings updated", meta: 'Super Admin • 3 hours ago', tag: 'Profile', tagBg: '#f3e8ff', tagColor: '#6b21a8' },
    { id: 4, icon: <FiXCircle />, color: '#ef4444', bg: '#fee2e2', desc: "Lesson \"Audio Listening 1\" rejected by Super Admin", meta: 'Super Admin • 5 hours ago', tag: 'Rejection', tagBg: '#fecaca', tagColor: '#b91c1c' },
  ]);

  const addRecentActivity = (desc, tag, tagBg, tagColor, icon, color, bg) => {
    const newActivity = {
      id: Date.now(),
      icon: icon || <FiGrid />,
      color: color || '#3b82f6',
      bg: bg || '#eff6ff',
      desc,
      meta: `Super Admin • Just now`,
      tag,
      tagBg: tagBg || '#dcfce7',
      tagColor: tagColor || '#15803d'
    };
    setRecentActivitiesList(prev => [newActivity, ...prev.slice(0, 9)]);
  };
  const [subPage, setSubPage] = useState('overview');
  const [schoolSubTab, setSchoolSubTab] = useState('schools-list');
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [newSchoolForm, setNewSchoolForm] = useState({
    school_name: '', school_code: '', phone: '', address: '', city: '', state: '', pincode: '',
    admin_name: '', email: '', password: ''
  });

  const generateSchoolAdminPassword = (name) => {
    const clean = (name || 'Admin').trim().replace(/[^a-zA-Z]/g, '');
    const prefix = (clean.length >= 3 ? clean.slice(0, 3) : (clean + 'adm').slice(0, 3)).toLowerCase();
    const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `${capitalized}@${digits}!`;
  };

  /* ── Forms ── */
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
        showFeedback('Profile picture updated successfully!', null);
        addRecentActivity("Profile picture updated", 'Profile', '#f3e8ff', '#6b21a8', <FiUser />, '#8b5cf6', '#f5f3ff');
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
        addRecentActivity("Profile picture removed", 'Profile', '#fee2e2', '#b91c1c', <FiUser />, '#ef4444', '#fee2e2');
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

  const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '', full_name: user?.full_name || '', phone_no: user?.phone_no || '', current_password: '', password: '' });
  const [schoolForm, setSchoolForm] = useState({ school_name: '', school_code: '', address: '', phone: '', email: '', logo: '', is_active: true });
  const [publishForm, setPublishForm] = useState({ release_name: '', grade: '', total_experiences: 0, status: 'DRAFT', export_file: '', checksum: '' });
  const [gradeForm, setGradeForm] = useState({ grade_name: '', description: '', sort_order: 1 });
  const [experienceForm, setExperienceForm] = useState({ grade: '', title: '', description: '', objective: '', estimated_duration: 15, difficulty: 'INTERMEDIATE', status: 'DRAFT', thumbnail: '' });
  const [experienceBuilderForm, setExperienceBuilderForm] = useState({ experience: '', block_type: 'VIDEO', title: '', content: '', media_url: '', display_order: 1, settings: '{}' });
  const [schoolAdminForm, setSchoolAdminForm] = useState({ username: '', email: '', full_name: '', is_active: true, school: '', password: '', role: 'school-admins' });
  const [teacherForm, setTeacherForm] = useState({ username: '', full_name: '', email: '', is_active: true, school: '', qualification: '', experience_years: 0, password: '' });

  /* ── Filter overrides for nested navigation ── */
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [selectedExperienceFilter, setSelectedExperienceFilter] = useState('');

  /* ── Loading & error feedback ── */
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  /* ── Selection State ── */
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSelectModeSchools, setIsSelectModeSchools] = useState(false);
  const [isSelectModeUsers, setIsSelectModeUsers] = useState(false);

  /* ── Modal management ── */
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwModalError, setPwModalError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: '' });
  const [activePreviewScreen, setActivePreviewScreen] = useState(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const isAnyOverlayOpen = showModal;
  const isSchoolDetailOpen = showSchoolDetailModal || showSchoolAdminDetailModal;

  // Dynamic scale factor calculation for preview canvas (locks to 1440px base width)
  const [previewScaleFactor, setPreviewScaleFactor] = useState(1);
  const previewScaleRef = React.useRef(null);

  useEffect(() => {
    if (!previewExperience || !previewScaleRef.current) return;
    const updateScale = () => {
      if (previewScaleRef.current) {
        const width = previewScaleRef.current.clientWidth;
        setPreviewScaleFactor(width > 0 ? width / 1000 : 1);
      }
    };
    const timer = setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [previewExperience, activePreviewScreen]);

  const getCanvasHeight = (elements) => {
    if (!elements || elements.length === 0) return 600;
    let maxBottom = 600;
    elements.forEach(block => {
      const top = parseInt(block.styles?.top) || 0;
      const height = parseInt(block.styles?.minHeight) || 150;
      if (top + height > maxBottom) {
        maxBottom = top + height;
      }
    });
    return maxBottom + 80;
  };


  /* ══════════════════════════════════
     DATA LOADERS (unchanged from original)
     ══════════════════════════════════ */
  const loadSchools = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/schools/');
      if (res.ok) { const data = await res.json(); setSchools(data.results || data); }
    } catch (e) { console.error('Failed to load schools', e); }
  };

  const loadPublishContents = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/publish-contents/');
      if (res.ok) { const data = await res.json(); setPublishContents(data.results || data); }
    } catch (e) { console.error('Failed to load publish contents', e); }
  };

  const loadDashboardStats = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/dashboard-stats/');
      if (res.ok) { const data = await res.json(); setDashboardStats(data); }
    } catch (e) { console.error('Failed to load dashboard stats', e); }
  };

  const handleSelectPreviewScreen = (scr) => {
    setActivePreviewScreen(scr);
    setSelectedQuizOption(null);
    setQuizChecked(false);
    setAudioPlaying(false);
  };

  const getFlatScreens = () => {
    if (!previewExperience || !previewExperience.steps) return [];
    const flat = [];
    previewExperience.steps.forEach(act => {
      if (act.screens) {
        act.screens.forEach(scr => {
          flat.push({ ...scr, actTitle: act.title });
        });
      }
    });
    return flat;
  };

  const handleNextScreen = () => {
    const flat = getFlatScreens();
    const idx = flat.findIndex(s => s.id === activePreviewScreen?.id);
    if (idx !== -1 && idx < flat.length - 1) {
      handleSelectPreviewScreen(flat[idx + 1]);
    }
  };

  const handlePrevScreen = () => {
    const flat = getFlatScreens();
    const idx = flat.findIndex(s => s.id === activePreviewScreen?.id);
    if (idx > 0) {
      handleSelectPreviewScreen(flat[idx - 1]);
    }
  };

  const handlePreviewExperience = async (experience) => {
    setSelectedQuizOption(null);
    setQuizChecked(false);
    setAudioPlaying(false);
    try {
      const res = await apiFetch(`/api/v1/content/experiences/${experience.id}/preview/`);
      if (res.ok) {
        const data = await res.json();
        const steps = data.activities || data.payload?.activities || data.results || [];
        setPreviewExperience({ ...experience, steps });
        if (steps.length > 0 && steps[0].screens && steps[0].screens.length > 0) {
          handleSelectPreviewScreen(steps[0].screens[0]);
        } else {
          setActivePreviewScreen(null);
        }
      } else {
        setPreviewExperience({ ...experience, steps: [] });
        setActivePreviewScreen(null);
      }
    } catch (e) {
      console.error('Failed to load experience steps', e);
      setPreviewExperience({ ...experience, steps: [] });
      setActivePreviewScreen(null);
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
        setGrades(filtered);
      }
    } catch (e) {
      console.error('Failed to load grades', e);
    }
  };

  const loadExperiences = async () => {
    try {
      const res = await apiFetch('/api/v1/content/experiences/');
      if (res.ok) { const data = await res.json(); setExperiences(data.results || data); }
    } catch (e) { console.error('Failed to load experiences', e); }
  };

  const loadSuperAdminExperiences = async () => {
    try {
      const url = saExpFilter
        ? `/api/v1/super-admin/experiences/?status=${saExpFilter}`
        : '/api/v1/super-admin/experiences/';
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setSubmittedExperiences(data.results || data);
      }
    } catch (e) {
      console.error('Failed to load submitted experiences', e);
    }
  };

  const handleApproveExperience = async (id) => {
    try {
      const res = await apiFetch(`/api/v1/super-admin/experiences/${id}/approve/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        showFeedback('Experience approved and package generated successfully.');
        const exp = submittedExperiences.find(e => e.id === id);
        const title = exp ? exp.title : 'Lesson';
        addRecentActivity(`Lesson "${title}" approved by Super Admin`, 'Approval', '#e0f2fe', '#0369a1', <FiCheckCircle />, '#10b981', '#e0fdf4');
        loadSuperAdminExperiences();
        loadAllData();
      } else {
        const err = await res.json().catch(() => ({}));
        showFeedback(null, err.error || 'Failed to approve experience.');
      }
    } catch (e) {
      console.error('Error approving experience', e);
      showFeedback(null, 'Network error occurred during approval.');
    }
  };

  const handleRejectExperienceSubmit = async () => {
    if (!rejectingId) return;
    try {
      const res = await apiFetch(`/api/v1/super-admin/experiences/${rejectingId}/reject/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_remark: rejectRemark })
      });
      if (res.ok) {
        showFeedback('Experience rejected successfully.');
        const exp = submittedExperiences.find(e => e.id === rejectingId);
        const title = exp ? exp.title : 'Lesson';
        addRecentActivity(`Lesson "${title}" rejected by Super Admin`, 'Rejection', '#fecaca', '#b91c1c', <FiX />, '#ef4444', '#fee2e2');
        setShowRejectModal(false);
        setRejectingId(null);
        setRejectRemark('');
        loadSuperAdminExperiences();
        loadAllData();
      } else {
        const err = await res.json().catch(() => ({}));
        showFeedback(null, err.error || 'Failed to reject experience.');
      }
    } catch (e) {
      console.error('Error rejecting experience', e);
      showFeedback(null, 'Network error occurred during rejection.');
    }
  };

  const loadExperienceBuilders = async () => {
    try {
      const res = await apiFetch('/api/v1/content/experiences/');
      if (res.ok) { const data = await res.json(); setExperienceBuilders(data.results || data); }
    } catch (e) { console.error('Failed to load experience builders', e); }
  };

  const loadSchoolAdmins = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/school-admins/');
      if (res.ok) { const data = await res.json(); setSchoolAdmins(data.results || data); }
    } catch (e) { console.error('Failed to load school admins', e); }
  };

  const loadTeachers = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/teachers/');
      if (res.ok) { const data = await res.json(); setTeachers(data.results || data); }
    } catch (e) { console.error('Failed to load teachers', e); }
  };

  const loadStudents = async () => {
    try {
      const res = await apiFetch('/api/cms/v1/students/');
      if (res.ok) { const data = await res.json(); setStudents(data.results || data); }
    } catch (e) { console.error('Failed to load students', e); }
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

  /* ── Selection Handlers ── */
  const handleSelectAllSchools = (e) => {
    if (e.target.checked) {
      const filtered = filterList(schools);
      setSelectedSchoolIds(filtered.map(s => s.school_id || s.id));
    } else {
      setSelectedSchoolIds([]);
    }
  };

  const handleSelectSchoolRow = (id) => {
    setSelectedSchoolIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      const filtered = filterList(getMergedUsers()).filter(u => {
        if (selectedRoleFilter && u.role !== selectedRoleFilter) return false;
        if (selectedStatusFilter) {
          const wantActive = selectedStatusFilter === 'active';
          if (u.is_active !== wantActive) return false;
        }
        return true;
      });
      setSelectedUserIds(filtered.map(u => u.id).filter(id => id !== 'super-admin-row'));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUserRow = (id) => {
    if (id === 'super-admin-row') return;
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  /* ── Bulk Delete Handlers ── */
  const handleBulkDeleteSchools = () => {
    if (selectedSchoolIds.length === 0) return;
    setDeleteConfirm({ show: true, id: 'bulk-schools', type: 'schools', isBulk: true, count: selectedSchoolIds.length, ids: [...selectedSchoolIds] });
  };

  const handleBulkDeleteUsers = () => {
    if (selectedUserIds.length === 0) return;
    setDeleteConfirm({ show: true, id: 'bulk-users', type: 'users', isBulk: true, count: selectedUserIds.length, ids: [...selectedUserIds] });
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        loadSchools(), loadPublishContents(), loadDashboardStats(),
        loadGrades(), loadExperiences(), loadExperienceBuilders(),
        loadSchoolAdmins(), loadTeachers(), loadStudents(),
        loadSuperAdminExperiences(),
      ]);
    } catch (e) {
      console.error('Failed to load data from backend server.', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);
  useEffect(() => {
    if (activeTab === 'experiences') {
      loadSuperAdminExperiences();
    }
  }, [saExpFilter, activeTab]);
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
      setShowNotifDropdown(false);
      setShowProfileDropdown(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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

  /* ── Form Clean/Init ── */
  const initForm = (tab, entity = null) => {
    setErrorMsg('');
    if (tab === 'schools') {
      setSchoolForm(entity ? {
        school_name: entity.school_name || '', school_code: entity.school_code || '', address: entity.address || '',
        phone: entity.phone || '', email: entity.email || '', logo: entity.logo || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true
      } : { school_name: '', school_code: '', address: '', phone: '', email: '', logo: '', is_active: true });
    } else if (tab === 'publish-contents' || tab === 'reports') {
      setPublishForm(entity ? {
        release_name: entity.release_name || '', grade: entity.grade || '',
        total_experiences: entity.total_experiences || 0, status: entity.status || 'DRAFT',
        export_file: entity.export_file || '', checksum: entity.checksum || ''
      } : { release_name: '', grade: '', total_experiences: 0, status: 'DRAFT', export_file: '', checksum: '' });
    } else if (tab === 'grades') {
      setGradeForm(entity ? {
        grade_name: entity.grade_name || '', description: entity.description || '',
        sort_order: entity.sort_order || 1
      } : { grade_name: '', description: '', sort_order: grades.length + 1 });
    } else if (tab === 'experiences') {
      setExperienceForm(entity ? {
        grade: entity.grade?.id || entity.grade || '', title: entity.title || '',
        description: entity.description || '', objective: entity.objective || '',
        estimated_duration: entity.estimated_duration || 15, difficulty: entity.difficulty || 'INTERMEDIATE',
        status: entity.status || 'DRAFT', thumbnail: entity.thumbnail || ''
      } : {
        grade: selectedGradeFilter || (grades[0]?.id || ''), title: '', description: '',
        objective: '', estimated_duration: 15, difficulty: 'INTERMEDIATE', status: 'DRAFT', thumbnail: ''
      });
    } else if (tab === 'experience-builders') {
      setExperienceBuilderForm(entity ? {
        experience: entity.experience?.id || entity.experience || '', block_type: entity.block_type || 'VIDEO',
        title: entity.title || '', content: entity.content || '', media_url: entity.media_url || '',
        display_order: entity.display_order || 1, settings: JSON.stringify(entity.settings || {}, null, 2)
      } : {
        experience: selectedExperienceFilter || (experiences[0]?.id || ''), block_type: 'VIDEO', title: '',
        content: '', media_url: '',
        display_order: experienceBuilders.filter(s => s.experience?.id === parseInt(selectedExperienceFilter) || s.experience === parseInt(selectedExperienceFilter)).length + 1,
        settings: '{}'
      });
    } else if (tab === 'school-admins') {
      setSchoolAdminForm(entity ? {
        username: entity.username || '', email: entity.email || '', full_name: entity.full_name || '',
        is_active: entity.is_active !== undefined ? entity.is_active : true,
        school: entity.school_id || entity.school || (schools[0]?.school_id || ''), password: '',
        role: entity.role || 'school-admins'
      } : { username: '', email: '', full_name: '', is_active: true, school: schools[0]?.school_id || '', password: '', role: 'school-admins' });
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
    const targetTab = (activeTab === 'reports' ? 'publish-contents' : activeTab);
    let url = (targetTab === 'experiences' || targetTab === 'experience-builders')
      ? '/api/v1/content/experiences/'
      : `/api/cms/v1/${targetTab}/`;
    if (modalType === 'edit') url += `${editingId}/`;

    try {
      if (activeTab === 'schools') {
        body = { ...schoolForm };
      } else if (activeTab === 'publish-contents' || activeTab === 'reports') {
        body = { ...publishForm, grade: parseInt(publishForm.grade), total_experiences: parseInt(publishForm.total_experiences) };
      } else if (activeTab === 'grades') {
        body = { ...gradeForm };
      } else if (activeTab === 'experiences') {
        body = { ...experienceForm, grade: parseInt(experienceForm.grade) };
      } else if (activeTab === 'experience-builders') {
        let settingsJson = {};
        try { settingsJson = JSON.parse(experienceBuilderForm.settings || '{}'); }
        catch { setErrorMsg('Settings must be valid JSON object.'); return; }
        body = { ...experienceBuilderForm, experience: parseInt(experienceBuilderForm.experience), settings: settingsJson };
      } else if (activeTab === 'school-admins') {
        body = { ...schoolAdminForm, school: parseInt(schoolAdminForm.school, 10) };
        delete body.role;
        if (modalType === 'edit') delete body.password;
      }

      const method = modalType === 'add' ? 'POST' : 'PUT';
      const res = await apiFetch(url, { method, body: JSON.stringify(body) });
      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Operation successful', null);
        setShowModal(false);
        if (targetTab === 'schools') {
          if (modalType === 'add') {
            addRecentActivity(`School "${schoolForm.school_name}" registered`, 'School', '#dcfce7', '#15803d', <FiGrid />, '#3b82f6', '#eff6ff');
          } else {
            addRecentActivity(`School "${schoolForm.school_name}" details updated`, 'School', '#dcfce7', '#15803d', <FiEdit2 />, '#3b82f6', '#eff6ff');
          }
          await loadSchools();
          await loadDashboardStats();
        }
        else if (targetTab === 'publish-contents') { await loadPublishContents(); await loadDashboardStats(); }
        else if (targetTab === 'grades') await loadGrades();
        else if (targetTab === 'experiences') await loadExperiences();
        else if (targetTab === 'experience-builders') await loadExperienceBuilders();
        else if (targetTab === 'school-admins' || targetTab === 'teachers' || targetTab === 'students') {
          await loadSchoolAdmins();
          await loadTeachers();
          await loadStudents();
          await loadDashboardStats();
        }
      } else {
        const errorDetail = typeof resData === 'object' ? JSON.stringify(resData) : resData;
        setErrorMsg(`Error: ${errorDetail}`);
      }
    } catch (err) {
      setErrorMsg('Failed to process request. Make sure form data is correct.');
      console.error(err);
    }
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
        if (type === 'schools') { await loadSchools(); await loadDashboardStats(); }
        else if (type === 'school-admins') { await loadSchoolAdmins(); }
        else if (type === 'teachers') { await loadTeachers(); }
        else if (type === 'students') { await loadStudents(); }
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

  /* ── Delete Handler ── */
  const openDeleteModal = (id, type = 'item') => {
    setDeleteConfirm({ show: true, id, type });
  };

  const confirmDeleteAction = async () => {
    if (!deleteConfirm.show) return;
    setErrorMsg('');
    setLoading(true);
    try {
      if (deleteConfirm.isBulk) {
        const { id: bulkType, ids, count } = deleteConfirm;
        if (bulkType === 'bulk-schools') {
          await Promise.all(ids.map(id => apiFetch(`/api/cms/v1/schools/${id}/`, { method: 'DELETE' })));
          showFeedback(`Successfully deleted ${count} school(s).`, null);
          setSelectedSchoolIds([]);
          await loadSchools();
          await loadDashboardStats();
        } else if (bulkType === 'bulk-users') {
          await Promise.all(ids.map(async id => {
            const isTeacher = teachers.some(t => t.teacher_id === id);
            const isStudent = students.some(s => s.student_id === id);
            const path = isTeacher ? 'teachers' : isStudent ? 'students' : 'school-admins';
            return apiFetch(`/api/cms/v1/${path}/${id}/`, { method: 'DELETE' });
          }));
          showFeedback(`Successfully deleted ${count} user(s).`, null);
          setSelectedUserIds([]);
          await loadSchoolAdmins();
          await loadTeachers();
        }
        setDeleteConfirm({ show: false, id: null, type: '', isBulk: false, ids: [], count: 0 });
        return;
      }
      const { id } = deleteConfirm;
      if (id === 'profile-avatar') {
        setDeleteConfirm({ show: false, id: null, type: '' });
        await handleRemoveAvatarConfirm();
        setLoading(false);
        return;
      }
      if (!id) return;
      let targetTab = activeTab === 'reports' ? 'publish-contents' : activeTab;

      const url = (targetTab === 'experiences' || targetTab === 'experience-builders')
        ? `/api/v1/content/experiences/${id}/`
        : `/api/cms/v1/${targetTab}/${id}/`;
      const res = await apiFetch(url, { method: 'DELETE' });
      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
        showFeedback(resData.message || 'Deleted successfully', null);
        setDeleteConfirm({ show: false, id: null, type: '' });
        if (targetTab === 'schools') {
          const sch = schools.find(s => s.school_id === id || s.id === id);
          const name = sch ? sch.school_name : 'School';
          addRecentActivity(`School "${name}" deleted`, 'School', '#fee2e2', '#dc2626', <FiTrash2 />, '#ef4444', '#fee2e2');
          await loadSchools();
          await loadDashboardStats();
        }
        else if (targetTab === 'publish-contents') { await loadPublishContents(); await loadDashboardStats(); }
        else if (targetTab === 'grades') await loadGrades();
        else if (targetTab === 'experiences') await loadExperiences();
        else if (targetTab === 'experience-builders') await loadExperienceBuilders();
        else if (targetTab === 'school-admins' || targetTab === 'teachers' || targetTab === 'students') {
          await loadSchoolAdmins();
          await loadTeachers();
          await loadStudents();
          await loadDashboardStats();
        }
      } else { setErrorMsg(resData.message || resData.error || resData.detail || 'Failed to delete record.'); }
    } catch (err) { setErrorMsg('Error communicating with backend.'); console.error(err); }
    finally { setLoading(false); }
  };

  /* ── Profile settings handler ── */
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
      addRecentActivity("Super Admin profile settings updated", 'Profile', '#f3e8ff', '#6b21a8', <FiUser />, '#8b5cf6', '#f5f3ff');
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorMsg('Failed to update profile.');
    } finally { setActionLoading(false); }
  };

  /* ── Custom School & Admin Creator ── */
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs >= 5 && hrs < 12) return 'Good morning';
    if (hrs >= 12 && hrs < 17) return 'Good afternoon';
    if (hrs >= 17 && hrs < 22) return 'Good evening';
    return 'Good night';
  };

  const generateSchoolCode = (name) => {
    const clean = (name || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = clean.substring(0, 3).padEnd(3, 'X');
    const num = (schools.length + 1).toString().padStart(3, '0');
    return `${prefix}_${num}`;
  };



  const handleAddNewSchoolWithAdmin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const schoolPayload = {
        school_name: newSchoolForm.school_name,
        school_code: newSchoolForm.school_code || '',
        address: `${newSchoolForm.address}, ${newSchoolForm.city}, ${newSchoolForm.state} - ${newSchoolForm.pincode}`,
        phone: newSchoolForm.phone || '0000000000',
        email: newSchoolForm.email || 'school@example.com',
        logo: '',
        is_active: true
      };

      const sRes = await apiFetch('/api/cms/v1/schools/', {
        method: 'POST',
        body: JSON.stringify(schoolPayload)
      });
      let sData = {};
      try { sData = await sRes.json(); } catch { sData = {}; }

      if (!sRes.ok) {
        let msg = 'Failed to create school.';
        if (sData.school_name) msg = Array.isArray(sData.school_name) ? sData.school_name.join(' ') : sData.school_name;
        else if (sData.detail) msg = String(sData.detail);
        else if (sData.error) msg = String(sData.error);
        else if (typeof sData === 'object' && Object.keys(sData).length > 0) {
          const firstVal = Object.values(sData)[0];
          msg = Array.isArray(firstVal) ? firstVal.join(' ') : String(firstVal);
        }
        setErrorMsg(msg);
        setLoading(false);
        return;
      }

      const schoolObj = sData.data || sData;
      const createdSchoolId = schoolObj.school_id || schoolObj.id || sData.school_id || sData.id;
      const adminPassword = generateSchoolAdminPassword(newSchoolForm.admin_name);
      const exactAdminUsername = (newSchoolForm.admin_name || 'admin').trim();

      const adminPayload = {
        username: exactAdminUsername,
        email: newSchoolForm.email,
        full_name: exactAdminUsername,
        school: createdSchoolId,
        password: adminPassword,
        is_active: true
      };

      const aRes = await apiFetch('/api/cms/v1/school-admins/', {
        method: 'POST',
        body: JSON.stringify(adminPayload)
      });
      let aData = {};
      try { aData = await aRes.json(); } catch { aData = {}; }

      if (aRes.ok) {
        showFeedback(`School and School Admin created successfully! Login credentials have been sent to ${newSchoolForm.email}.`, null);
        addRecentActivity(`School "${newSchoolForm.school_name}" registered`, 'School', '#dcfce7', '#15803d', <FiGrid />, '#3b82f6', '#eff6ff');
        setIsAddingSchool(false);
        setNewSchoolForm({
          school_name: '', phone: '', address: '', city: '', state: '', pincode: '',
          admin_name: '', email: '', password: ''
        });
        await loadSchools();
        await loadSchoolAdmins();
      } else {
        let msg = 'Failed to create school admin.';
        if (aData.email) msg = Array.isArray(aData.email) ? aData.email.join(' ') : aData.email;
        else if (aData.username) msg = Array.isArray(aData.username) ? aData.username.join(' ') : aData.username;
        else if (aData.password) msg = Array.isArray(aData.password) ? aData.password.join(' ') : aData.password;
        else if (aData.detail) msg = String(aData.detail);
        else if (aData.error) msg = String(aData.error);
        else if (typeof aData === 'object' && Object.keys(aData).length > 0) {
          const firstVal = Object.values(aData)[0];
          msg = Array.isArray(firstVal) ? firstVal.join(' ') : String(firstVal);
        }
        setErrorMsg(msg);
      }
    } catch (err) {
      console.error('Error adding school:', err);
      setErrorMsg(formatErrorMsg(err?.message || 'Failed to create school. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const getMergedUsers = () => {
    const list = [];
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
    // Add Students
    students.forEach(s => {
      list.push({
        id: s.student_id,
        full_name: s.full_name || s.username,
        username: s.username,
        email: s.email,
        role: 'Student',
        school_name: s.school_name || `School ID: ${s.school}`,
        is_active: s.is_active,
        school_id: s.school
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
    setShowSchoolDetailModal(false);
    setShowSchoolAdminDetailModal(false);
    setShowModal(false);
    setSchoolsPage(1); setUsersPage(1); setGradesPage(1);
    setExperiencesPage(1); setExperienceBuildersPage(1); setPublishPage(1);
    setIsSidebarOpen(false);
    onTabChange(tab);
  };

  const stats = {
    schools: schools.length,
    schoolAdmins: schoolAdmins.length,
    teachers: teachers.length,
    publish_contents: publishContents.length,
    grades: grades.length,
    experiences: experiences.length,
  };

  /* ══════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════ */
  return (
    <div className="sd-layout" style={{ backgroundImage: `url(${superAdminBg})`, backgroundSize: 'cover', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat' }}>


      {/* ── Mobile top bar ── */}
      <header className="sd-mobile-header">
        <button className="sd-hamburger" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu"><FiMenu /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logoIcon} alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
          <span className="sd-mobile-brand">LinguaLab</span>
        </div>
        <div style={{ width: 34 }} />
      </header>

      {/* ── Sidebar backdrop (mobile) ── */}
      <div className={`sd-sidebar-backdrop${isSidebarOpen ? ' open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      {/* ═════════════════
          SIDEBAR
          ═════════════════ */}
      <aside className={`sd-sidebar${isSidebarOpen ? ' open' : ''}`}>
        <div className="sd-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
          <img src={logoIcon} alt="Logo" style={{ width: '62px', height: '100px', objectFit: 'contain' }} />
          <div>
            <div className="sd-brand-name">LinguaLab</div>
            <div className="sd-brand-sub">Admin Portal</div>
          </div>
        </div>

        <nav className="sd-nav">
          <button className={`sd-nav-item${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => goTo('dashboard')}>
            <FiGrid /><span>Dashboard</span>
          </button>
          <button className={`sd-nav-item${activeTab === 'schools' ? ' active' : ''}`} onClick={() => goTo('schools')}>
            <FiBookOpen /><span>Manage Schools</span>
          </button>
          <button className={`sd-nav-item${activeTab === 'experiences' ? ' active' : ''}`} onClick={() => goTo('experiences')}>
            <FiFileText /><span>Manage Lessons</span>
          </button>
          {/* Subscriptions tab temporarily removed */}
          {/* <button className={`sd-nav-item${activeTab === 'subscriptions' ? ' active' : ''}`} onClick={() => goTo('subscriptions')}>
            <FiCheckCircle /><span>Subscriptions</span>
          </button> */}
          <button className={`sd-nav-item${activeTab === 'profile' ? ' active' : ''}`} onClick={() => goTo('profile')}>
            <FiUser /><span>Profile Settings</span>
          </button>
        </nav>

        <div className="sd-sidebar-bottom" style={{ position: 'relative' }}>
          {showProfileDropdown && (
            <div style={{
              position: 'absolute',
              bottom: '75px',
              left: '0.75rem',
              right: '0.75rem',
              background: '#095d8f',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '6px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
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

          <div className="sd-user-card" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowProfileDropdown(!showProfileDropdown); }}>
            <div className="sd-user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {user?.profile_picture ? (
                <img src={user.profile_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
              ) : (
                (user?.username || 'AD').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="sd-user-meta" style={{ flex: 1 }}>
              <div className="sd-user-name">{profileForm.full_name || user?.full_name || user?.username || 'Super Admin'}</div>
              <div className="sd-user-role">Super Admin</div>
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.75)', display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
              <FiChevronDown />
            </div>
          </div>
        </div>
      </aside>

      {/* ═════════════════
          MAIN
          ═════════════════ */}
      <main className="sd-main">
        {/* ── Top Bar ── */}
        <div className="sd-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {activeTab === 'schools' && isAddingSchool && (
              <button
                type="button"
                onClick={() => setIsAddingSchool(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#475569',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <FiChevronLeft style={{ fontSize: '1rem' }} /> Back
              </button>
            )}
            {activeTab === 'subscriptions' && subPage === 'create-plan' && (
              <button
                type="button"
                onClick={() => setSubPage('overview')}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#475569',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <FiChevronLeft style={{ fontSize: '1rem' }} /> Back
              </button>
            )}
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {activeTab === 'dashboard' ? 'Dashboard Overview' :
                activeTab === 'schools' ? (isAddingSchool ? 'Add New School' : 'Manage Schools') :
                  activeTab === 'experiences' ? 'Manage Lessons' :
                    activeTab === 'subscriptions' ? (subPage === 'create-plan' ? 'Create New Plan' : 'Subscriptions & Plans') :

                      activeTab === 'reports' ? 'Reports & Releases' :
                        activeTab === 'profile' ? 'Profile Settings' : 'Super Admin Portal'}
            </h2>
          </div>
          <div className="sd-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            <div className="sd-year-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
              <FiCalendar /> {formatDateTime(currentTime)}
            </div>

            <div style={{ position: 'relative' }}>
              <button className="sd-icon-btn" style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); setShowNotifDropdown(!showNotifDropdown); }}>
                <FiBell />
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
                          <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); setNotifications(notifications.filter(item => item.id !== n.id)); }} title="Delete">
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

            <button className="sd-icon-btn" onClick={() => setShowHelpModal(true)} title="Help & Support"><FiHelpCircle /></button>
          </div>
        </div>

        {/* ── Page Content ── */}
        <div className={`sd-content${activeTab === 'dashboard' ? ' sd-content--dashboard' : ''}`} style={{ position: 'relative' }}>

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
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', color: 'inherit', display: 'flex', alignItems: 'center' }} onClick={() => setSuccessMsg('')}><FiX /></button>
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
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', color: 'inherit', display: 'flex', alignItems: 'center' }} onClick={() => setErrorMsg('')}><FiX /></button>
            </div>
          )}

          {/* ══════════ OVERVIEW / DASHBOARD TAB ══════════ */}
          {activeTab === 'dashboard' && !isAnyOverlayOpen && (
            <>
              {/* Premium Dashboard Header Card with Background Image */}
              <div className="sd-dashboard-header-card" style={{ backgroundImage: `url(${dashboardHeaderBanner})`, position: 'relative' }}>
                <div className="sd-header-text-section" style={{ maxWidth: '50%' }}>
                  <h1>{getGreeting()}, {profileForm.full_name || profileForm.username || user?.full_name || user?.username || 'Super Admin'}!</h1>
                  <p>Monitor schools, track student engagement, analyze subscriptions, and make data-driven decisions from one unified dashboard.</p>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="sd-stat-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {[
                  {
                    label: 'Total Schools',
                    value: dashboardStats.total_schools || 0,
                    color: '#4f46e5',
                    bg: '#eef2ff',
                    icon: (
                      <svg stroke="currentColor" fill="none" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18" />
                        <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Total Lessons',
                    value: submittedExperiences.length,
                    color: '#0ea5e9',
                    bg: '#e0f2fe',
                    icon: <FiFileText />,
                  },
                  {
                    label: 'Draft Lessons',
                    value: submittedExperiences.filter(e => e.status?.toUpperCase() === 'DRAFT').length,
                    color: '#f59e0b',
                    bg: '#fffbeb',
                    icon: <FiEdit2 />,
                  },
                  {
                    label: 'Approved Lessons',
                    value: submittedExperiences.filter(e => e.status?.toUpperCase() === 'APPROVED').length,
                    color: '#10b981',
                    bg: '#e0fdf4',
                    icon: <FiCheckCircle />,
                  },
                ].map((s, i) => (
                  <div className="sd-stat-card sd-stat-card--horizontal" key={i} style={{ alignItems: 'center' }}>
                    <div className="sd-stat-card-left" style={{ gap: '0.45rem' }}>
                      <div className="sd-stat-label" style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.label}</div>
                      <div className="sd-stat-value" style={{ fontSize: '2rem', marginTop: 0 }}>{s.value}</div>
                    </div>
                    <div className="sd-stat-card-right">
                      <div className="sd-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Middle Row Charts */}
              <div className="sd-bottom-grid" style={{ gridTemplateColumns: '1fr' }}>
                {/* Recent Activity */}
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div className="sd-card-title">Recent Activity</div>
                    <button className="sd-view-all">View All</button>
                  </div>
                  <div className="sd-activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {recentActivitiesList.map(act => (
                      <div className="sd-activity-item" key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                          <div className="sd-activity-icon-container" style={{ width: 36, height: 36, borderRadius: '50%', background: act.bg, color: act.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {act.icon}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="sd-activity-desc" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.desc}</div>
                            <div className="sd-activity-meta" style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>{act.meta}</div>
                          </div>
                        </div>
                        <span className="sd-activity-badge" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: act.tagBg, color: act.tagColor, flexShrink: 0 }}>
                          {act.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription Status Donut temporarily removed */}
                {/* 
                <div className="sd-card sd-card--subscription-donut" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  ...
                </div>
                */}
              </div>
            </>
          )}


          {/* ══════════ MANAGE SCHOOLS TAB ══════════ */}
          {activeTab === 'schools' && !isAnyOverlayOpen && !isAddingSchool && isSchoolDetailOpen ? (
            /* ══════════ SCHOOL DETAIL INLINE VIEW ══════════ */
            <div style={{ padding: '0' }}>
              {showSchoolDetailModal && selectedSchoolDetail ? (
                <div style={{ background: 'transparent', width: '100%' }}>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => setShowSchoolDetailModal(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#0f766e',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        padding: 0
                      }}
                    >
                      ← Back to Schools
                    </button>
                  </div>
                  
                  <div className="sd-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>School Details</h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {selectedSchoolDetail.school_name ? selectedSchoolDetail.school_name[0].toUpperCase() : 'S'}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedSchoolDetail.school_name}</h3>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedSchoolDetail.email || 'No email provided'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.55rem', fontSize: '0.85rem', color: '#334155' }}>
                      <div>
                        <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>School Code</span>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a', fontFamily: 'monospace' }}>{selectedSchoolDetail.school_code || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Location / Address</span>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{selectedSchoolDetail.address || selectedSchoolDetail.city || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Phone</span>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{selectedSchoolDetail.phone || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Active Status</span>
                        <span className={`sd-badge ${selectedSchoolDetail.is_active !== false ? 'sd-badge-active' : 'sd-badge-inactive'}`} style={{ display: 'inline-flex', marginTop: '4px' }}>
                          {selectedSchoolDetail.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Teachers</span>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{teachers.filter(t => t.school === selectedSchoolDetail.school_id || t.school_id === selectedSchoolDetail.school_id).length} Teachers</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : activeTab === 'schools' && !isAnyOverlayOpen && (
            <>
              {isAddingSchool ? (
                /* ───────────────── ADD NEW SCHOOL SCREEN (Image 2) ───────────────── */
                <>


                  <form onSubmit={handleAddNewSchoolWithAdmin}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* School Information Card */}
                      <div className="sd-card" style={{ padding: '1.5rem 2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>School Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div className="sd-form-group">
                            <label className="sd-form-label">School Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter school name" required
                              value={newSchoolForm.school_name} onChange={e => {
                                const name = e.target.value;
                                const code = generateSchoolCode(name);
                                setNewSchoolForm(prev => ({
                                  ...prev,
                                  school_name: name,
                                  school_code: code
                                }));
                              }} />
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">School Code</label>
                            <input className="sd-form-input" type="text" placeholder="Automatically generated" readOnly
                              value={newSchoolForm.school_code || ''} style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                          </div>
                          <div className="sd-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="sd-form-label">Address <span style={{ color: '#ef4444' }}>*</span></label>
                            <textarea className="sd-form-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Enter full address" required
                              value={newSchoolForm.address} onChange={e => setNewSchoolForm({ ...newSchoolForm, address: e.target.value })} />
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">State <span style={{ color: '#ef4444' }}>*</span></label>
                            <select
                              className="sd-form-input"
                              required
                              value={newSchoolForm.state}
                              onChange={e => {
                                const selectedState = e.target.value;
                                const availableCities = INDIAN_STATES_AND_CITIES[selectedState] || [];
                                setNewSchoolForm(prev => ({
                                  ...prev,
                                  state: selectedState,
                                  city: availableCities[0] || ''
                                }));
                              }}
                            >
                              <option value="">Select state</option>
                              {Object.keys(INDIAN_STATES_AND_CITIES).map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">City <span style={{ color: '#ef4444' }}>*</span></label>
                            <select
                              className="sd-form-input"
                              required
                              value={newSchoolForm.city}
                              onChange={e => setNewSchoolForm({ ...newSchoolForm, city: e.target.value })}
                            >
                              <option value="">Select city</option>
                              {(newSchoolForm.state && INDIAN_STATES_AND_CITIES[newSchoolForm.state]
                                ? INDIAN_STATES_AND_CITIES[newSchoolForm.state]
                                : Object.values(INDIAN_STATES_AND_CITIES).flat()
                              ).map(ct => (
                                <option key={ct} value={ct}>{ct}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">Pincode <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter pincode" required
                              value={newSchoolForm.pincode} onChange={e => setNewSchoolForm({ ...newSchoolForm, pincode: e.target.value })} />
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter phone number" required
                              value={newSchoolForm.phone || ''} onChange={e => setNewSchoolForm({ ...newSchoolForm, phone: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      {/* School Admin Information Card */}
                      <div className="sd-card" style={{ padding: '1.5rem 2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>School Admin Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div className="sd-form-group">
                            <label className="sd-form-label">Admin Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter admin name" required
                              value={newSchoolForm.admin_name}
                              onChange={e => setNewSchoolForm({ ...newSchoolForm, admin_name: e.target.value })}
                            />
                          </div>
                          <div className="sd-form-group">
                            <label className="sd-form-label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="email" placeholder="Enter email address" required
                              value={newSchoolForm.email} onChange={e => setNewSchoolForm({ ...newSchoolForm, email: e.target.value })} />
                          </div>
                        </div>
                        <div style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: '#475569', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <FiCheckCircle style={{ color: '#16a34a', flexShrink: 0, fontSize: '1rem' }} />
                          <span>Account credentials will be automatically generated and sent to {newSchoolForm.email ? <strong style={{ color: '#4f46e5' }}>{newSchoolForm.email}</strong> : 'the School Admin email'}.</span>
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
                /* ───────────────── MANAGE SCHOOLS SCREEN (Image 2) ───────────────── */
                <>


                  <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="sd-table-toolbar">
                      <div className="sd-table-search">
                        <FiSearch />
                        <input
                          type="text"
                          placeholder="Search schools..."
                          value={searchQuery}
                          onChange={e => { setSearchQuery(e.target.value); setSchoolsPage(1); }}
                        />
                      </div>
                      <div className="sd-table-actions">
                        <button
                          className="sd-btn-outline"
                          style={{
                            background: isSelectModeSchools ? '#e2e8f0' : '#ffffff',
                            color: '#374151',
                            borderColor: '#d1d5db'
                          }}
                          onClick={() => {
                            setIsSelectModeSchools(!isSelectModeSchools);
                            if (isSelectModeSchools) setSelectedSchoolIds([]);
                          }}
                        >
                          {isSelectModeSchools ? '✓ Done Selecting' : 'Select'}
                        </button>
                        {selectedSchoolIds.length > 0 && (
                          <button className="sd-btn-outline" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleBulkDeleteSchools}>
                            <FiTrash2 /> Delete Selected ({selectedSchoolIds.length})
                          </button>
                        )}
                        <button className="sd-btn-primary" onClick={() => setIsAddingSchool(true)}><FiPlus />Add School</button>
                      </div>
                    </div>

                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <colgroup>
                          {isSelectModeSchools && <col style={{ width: '4%' }} />}
                          <col style={{ width: '22%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '12%' }} />
                          <col style={{ width: '12%' }} />
                        </colgroup>
                        <thead>
                          <tr>
                            {isSelectModeSchools && (
                              <th className="sd-checkbox-cell">
                                <input
                                  type="checkbox"
                                  checked={schools.length > 0 && selectedSchoolIds.length === filterList(schools).length}
                                  onChange={handleSelectAllSchools}
                                />
                              </th>
                            )}
                            <th>SCHOOL NAME</th>
                            <th>SCHOOL CODE</th>
                            <th>ADMIN NAME</th>
                            <th>EMAIL</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'center' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(filterList(schools), schoolsPage).map((s, i) => {
                            const sid = s.school_id || s.id;
                            const admin = schoolAdmins.find(sa => sa.school === s.school_id || sa.school_id === s.school_id);
                            const adminName = admin ? (admin.full_name || admin.username) : (s.admin_name || 'N/A');
                            const adminEmail = admin ? admin.email : (s.email || 'admin@example.com');
                            const isSchoolActive = s.is_active !== false;

                            return (
                              <tr key={sid || i}>
                                {isSelectModeSchools && (
                                  <td className="sd-checkbox-cell">
                                    <input
                                      type="checkbox"
                                      checked={selectedSchoolIds.includes(sid)}
                                      onChange={() => handleSelectSchoolRow(sid)}
                                    />
                                  </td>
                                )}
                                <td style={{ fontWeight: 600, color: '#1e293b' }}>{s.school_name}</td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>{s.school_code || '—'}</td>
                                <td>{adminName}</td>
                                <td>{adminEmail}</td>
                                <td>
                                  <span className={`sd-badge ${isSchoolActive ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                                    {isSchoolActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td style={{ overflow: 'visible' }}>
                                  <div className="sd-action-cell" style={{ justifyContent: 'center', overflow: 'visible' }}>
                                    <div className="sd-action-dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                                      <button
                                        type="button"
                                        className="sd-action-dots-btn"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          padding: '4px 8px',
                                          fontSize: '1.2rem',
                                          color: '#64748b',
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'background-color 0.15s'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdown(activeDropdown?.id === sid ? null : { id: sid, type: 'school' });
                                        }}
                                      >
                                        <FiMoreVertical />
                                      </button>
                                      {activeDropdown?.id === sid && (
                                        <div
                                          style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: '100%',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                            zIndex: 100,
                                            minWidth: '120px',
                                            padding: '4px 0',
                                            display: 'flex',
                                            flexDirection: 'column'
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <button
                                            type="button"
                                            style={{
                                              padding: '8px 12px',
                                              textAlign: 'left',
                                              background: 'none',
                                              border: 'none',
                                              fontSize: '0.85rem',
                                              color: '#334155',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              width: '100%'
                                            }}
                                            onClick={() => {
                                              setActiveDropdown(null);
                                              setSelectedSchoolDetail(s);
                                              setShowSchoolDetailModal(true);
                                            }}
                                          >
                                            <FiEye style={{ fontSize: '0.95rem' }} /> View
                                          </button>
                                          <button
                                            type="button"
                                            style={{
                                              padding: '8px 12px',
                                              textAlign: 'left',
                                              background: 'none',
                                              border: 'none',
                                              fontSize: '0.85rem',
                                              color: '#334155',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              width: '100%'
                                            }}
                                            onClick={() => {
                                              setActiveDropdown(null);
                                              handleOpenEdit(s);
                                            }}
                                          >
                                            <FiEdit2 style={{ fontSize: '0.95rem' }} /> Edit
                                          </button>
                                          <button
                                            type="button"
                                            style={{
                                              padding: '8px 12px',
                                              textAlign: 'left',
                                              background: 'none',
                                              border: 'none',
                                              fontSize: '0.85rem',
                                              color: '#334155',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              width: '100%'
                                            }}
                                            onClick={() => {
                                              setActiveDropdown(null);
                                              toggleActiveStatus(sid, isSchoolActive, 'schools');
                                            }}
                                          >
                                            <FiLock style={{ fontSize: '0.95rem' }} /> {isSchoolActive ? 'Block' : 'Unblock'}
                                          </button>
                                          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }}></div>
                                          <button
                                            type="button"
                                            style={{
                                              padding: '8px 12px',
                                              textAlign: 'left',
                                              background: 'none',
                                              border: 'none',
                                              fontSize: '0.85rem',
                                              color: '#ef4444',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              width: '100%'
                                            }}
                                            onClick={() => {
                                              setActiveDropdown(null);
                                              openDeleteModal(sid, 'school');
                                            }}
                                          >
                                            <FiTrash2 style={{ fontSize: '0.95rem' }} /> Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {filterList(schools).length === 0 && (
                            <tr><td colSpan={isSelectModeSchools ? "7" : "6"} className="sd-empty-state">No schools found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination total={filterList(schools).length} perPage={PER_PAGE} page={schoolsPage} onPage={setSchoolsPage} />
                  </div>
                </>
              )}
            </>
          )}

          {/* ══════════ SUBSCRIPTIONS TAB ══════════ */}
          {activeTab === 'subscriptions' && !isAnyOverlayOpen && (
            <>
              {/* Header with action button (except on Create Plan page) */}
              {subPage !== 'create-plan' ? (
                <div className="sd-page-header" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                    {subPage !== 'all-subscriptions' ? (
                      <button className="sd-btn-primary" onClick={() => setSubPage('create-plan')}>+ Create Plan</button>
                    ) : (
                      <button className="sd-btn-outline">Actions</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="sd-page-header" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button className="sd-btn-outline" onClick={() => setSubPage('overview')}>Cancel</button>
                      <button className="sd-btn-primary" onClick={() => { triggerAlert('Plan Created!', 'Success', 'success'); setSubPage('plan-details'); }}>Next: Features</button>
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
                  <div className="sd-stat-row sd-stat-row--4col">
                    {[
                      { label: 'TOTAL ACTIVE', value: '124', color: '#3b82f6', bg: '#e0f2fe', icon: <FiUser />, trend: '↑ 6 this month', trendColor: '#22c55e' },
                      { label: 'EXPIRING SOON', value: '9', color: '#f97316', bg: '#ffedd5', icon: <FiBell />, trend: 'Within 30 days', trendColor: '#64748b' },
                      { label: 'EXPIRED', value: '5', color: '#ef4444', bg: '#fee2e2', icon: <FiXCircle />, trend: 'Needs attention', trendColor: '#ef4444' },
                      { label: 'TOTAL REVENUE', value: '₹12,45,000', color: '#a855f7', bg: '#f3e8ff', icon: <FiAward />, trend: '↑ 15% this month', trendColor: '#22c55e' },
                    ].map((s, i) => (
                      <div className="sd-sub-stat-card" key={i}>
                        <div className="sd-sub-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div className="sd-sub-stat-content">
                          <div className="sd-sub-stat-value">{s.value}</div>
                          <div className="sd-sub-stat-label">{s.label}</div>
                          <span className="sd-sub-stat-trend" style={{ color: s.trendColor }}>{s.trend}</span>
                        </div>
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
                          <DistributionDonutChart />
                        </div>
                        <div className="sd-legend">
                          {[
                            { label: 'Basic Plan', color: '#004e75', pct: '45 (36.3%)' },
                            { label: 'Standard Plan', color: '#006aa6', pct: '38 (30.6%)' },
                            { label: 'Premium Plan', color: '#0ea5e9', pct: '28 (22.6%)' },
                            { label: 'Enterprise Plan', color: '#38bdf8', pct: '10 (8.1%)' },
                            { label: 'Expired / Cancelled', color: '#bae6fd', pct: '3 (2.4%)' },
                          ].map(l => (
                            <div className="sd-legend-row" key={l.label}>
                              <div className="sd-legend-dot-label">
                                <div className="sd-legend-dot" style={{ background: l.color }} />
                                {l.label}
                              </div>
                              <span className="sd-legend-pct">{l.pct}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex' }}>
                        <button style={{ border: 'none', background: 'none', color: '#4f46e5', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => setSubPage('plan-details')}>
                          <FiSettings /> Manage All Subscriptions
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
                          { id: 1, name: 'Python', time: '2 min ago', color: '#22c55e' },
                          { id: 2, name: 'SQL', time: '15 min ago', color: '#22c55e' },
                          { id: 3, name: 'C++', time: '1 hour ago', color: '#22c55e' },
                          { id: 4, name: 'JavaScript', time: '3 hours ago', color: '#22c55e' },
                        ].map(act => (
                          <div className="sd-activity-item" key={act.id}>
                            <div className="sd-activity-avatar" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                              <FiCheckCircle />
                            </div>
                            <div className="sd-activity-body">
                              <div className="sd-activity-name">{act.name}</div>
                              <div className="sd-activity-desc">{act.time}</div>
                            </div>
                            <div style={{ color: '#22c55e', fontSize: '1.1rem' }}><FiCheckCircle /></div>
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
                              <div style={{ width: `${bar.pct}%`, height: '100%', background: bar.color, borderRadius: 4 }} />
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
                          <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}><FiCalendar /></div>
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
                            { name: 'Basic Plan', dur: '1 Year', schools: '45', price: '8,000', feat: '6', active: true },
                            { name: 'Standard Plan', dur: '1 Year', schools: '38', price: '15,000', feat: '10', active: true },
                            { name: 'Premium Plan', dur: '1 Year', schools: '28', price: '25,000', feat: '15', active: true },
                            { name: 'Enterprise Plan', dur: '1 Year', schools: '10', price: '50,000', feat: 'All', active: true },
                            { name: 'Custom Plan', dur: 'Custom', schools: '3', price: '-', feat: 'Custom', active: true }
                          ].map((p, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{p.name}</td>
                              <td>{p.dur}</td>
                              <td>{p.schools}</td>
                              <td>{p.price}</td>
                              <td>{p.feat}</td>
                              <td style={{ overflow: 'visible', textOverflow: 'clip' }}>
                                <span className={`sd-badge ${p.active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>Active</span>
                              </td>
                              <td>
                                <div className="sd-action-cell">
                                  <button className="sd-icon-action edit" title="Edit"><FiEdit2 /></button>
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
                            { name: 'Access to Content Library', b: true, s: true, p: true, e: true },
                            { name: 'Activity Reports', b: true, s: true, p: true, e: true },
                            { name: 'Advanced Analytics', b: false, s: false, p: true, e: true },
                            { name: 'Custom Assessments', b: false, s: true, p: true, e: true },
                            { name: 'Priority Support', b: false, s: false, p: true, e: true },
                            { name: 'API Access', b: false, s: false, p: false, e: true }
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
                          <input className="sd-form-input" type="text" placeholder="Enter plan name" required />
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
                          <textarea className="sd-form-input" style={{ minHeight: '85px', resize: 'vertical' }} placeholder="Enter plan description" />
                        </div>
                        <div className="sd-form-group">
                          <label className="sd-form-label">Status</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                            {/* Toggle Switch */}
                            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                              <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                              <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#6366f1', borderRadius: 24, transition: '0.3s' }}>
                                <span style={{ position: 'absolute', content: '""', height: 18, width: 18, left: 22, bottom: 3, backgroundColor: '#fff', borderRadius: '50%', transition: '0.3s' }} />
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


          {/* ══════════ MANAGE EXPERIENCES TAB ══════════ */}
          {activeTab === 'experiences' && !isAnyOverlayOpen && (
            <>
              <div className="sd-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                      Review and approve lesson publishing requests for LMS synchronization.
                    </p>
                  </div>
                </div>
              </div>

              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <div className="sd-table-search">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search lessons..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setSaExpPage(1); }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Status Filter:</span>
                    <select
                      className="sd-form-input"
                      style={{ width: '180px', height: '38px', padding: '0 0.75rem', fontSize: '0.82rem', borderRadius: '8px' }}
                      value={saExpFilter}
                      onChange={e => { setSaExpFilter(e.target.value); setSaExpPage(1); }}
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING_APPROVAL">Pending Approval</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="sd-table-wrap sd-table-wrap-scrollable">
                  <table className="sd-table sd-table-compact">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Grade</th>
                        <th>Created By</th>
                        <th>Status</th>
                        <th>Pending/Active Version</th>
                        <th>Date Submitted</th>
                        <th style={{ textAlign: 'right', width: '160px', minWidth: '160px', paddingRight: '1rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submittedExperiences.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            <FiFileText style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem' }} />
                            <div style={{ fontWeight: 600 }}>No lessons found</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Try changing the filter criteria.</div>
                          </td>
                        </tr>
                      ) : (
                        paginate(filterList(submittedExperiences), saExpPage).map((exp, idx) => (
                          <tr key={exp.id || idx}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{exp.title}</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{exp.subject} • {exp.estimated_duration} mins</span>
                              </div>
                            </td>
                            <td>{exp.grade_name || `Grade ${exp.grade}`}</td>
                            <td>{exp.created_by_name || exp.created_by?.username || 'Content Creator'}</td>
                            <td>
                              <span className={`sd-badge ${exp.status === 'APPROVED' ? 'sd-badge-published' :
                                exp.status === 'PENDING_APPROVAL' ? 'sd-badge-review' : 'sd-badge-draft'
                                }`}>
                                {exp.status === 'PENDING_APPROVAL' ? 'PENDING' : exp.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600 }}>{exp.pending_version || exp.version_number || '1.0'}</span>
                                {exp.pending_release_notes && (
                                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.pending_release_notes}>
                                    Notes: {exp.pending_release_notes}
                                  </span>
                                )}
                                {exp.review_remark && exp.status === 'REJECTED' && (
                                  <span style={{ fontSize: '0.72rem', color: '#ef4444', fontStyle: 'italic', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.review_remark}>
                                    Reason: {exp.review_remark}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{new Date(exp.updated_at).toLocaleDateString()}</td>
                            <td style={{ textAlign: 'right', width: '160px', minWidth: '160px', paddingRight: '1rem' }}>
                              <div className="sd-action-cell" style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                  className="sd-btn-outline"
                                  style={{ 
                                    padding: '0.35rem 0.75rem', 
                                    fontSize: '0.78rem', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '0.35rem' 
                                  }}
                                  onClick={() => handlePreviewExperience(exp)}
                                >
                                  <span style={{ fontSize: '0.9rem' }}>👁️</span>
                                  <span>Preview Screen</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {submittedExperiences.length > PER_PAGE && (
                  <div className="sd-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Showing {(saExpPage - 1) * PER_PAGE + 1} to {Math.min(saExpPage * PER_PAGE, submittedExperiences.length)} of {submittedExperiences.length} lessons
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="sd-btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        disabled={saExpPage === 1}
                        onClick={() => setSaExpPage(prev => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </button>
                      <button
                        className="sd-btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        disabled={saExpPage * PER_PAGE >= submittedExperiences.length}
                        onClick={() => setSaExpPage(prev => prev + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════ SYSTEM SETTINGS / PROFILE TAB ══════════ */}
          {activeTab === 'profile' && !isAnyOverlayOpen && (
            <>
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
            </>
          )}

          {/* ══════════ GRADES TAB ══════════ */}
          {activeTab === 'grades' && !isAnyOverlayOpen && (
            <>
              <div className="sd-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 className="sd-page-title">Manage Grades</h1>
                  </div>
                  <button className="sd-btn-primary" onClick={handleOpenAdd}><FiPlus />Add Grade</button>
                </div>
              </div>

              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div className="sd-table-search">
                    <FiSearch />
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
                          <td>{g.description || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No description</span>}</td>
                          <td>
                            <button onClick={() => { setSelectedGradeFilter(g.id); onTabChange('experiences'); }} className="sd-btn-outline" style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                              <FiCornerDownRight /> Experiences
                            </button>
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit" onClick={() => handleOpenEdit(g)} title="Edit"><FiEdit2 /></button>
                              <button className="sd-icon-action delete" onClick={() => openDeleteModal(g.id, 'grade')} title="Delete"><FiTrash2 /></button>
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
                <Pagination total={filterList(grades).length} perPage={PER_PAGE} page={gradesPage} onPage={setGradesPage} />
              </div>
            </>
          )}




          {/* ════════════════════
              CRUD MODAL OVERLAY - RENDERED AS INLINE PAGE
              ════════════════════ */}
          {showModal && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', minHeight: '600px', backgroundColor: 'transparent', zIndex: 900, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f766e', fontWeight: 600, fontSize: '0.9rem', padding: 0 }}
                >
                  ← Back to {activeTab === 'schools' ? 'Schools' : activeTab === 'school-admins' ? 'School Admins' : 'Content Creators'}
                </button>
              </div>
              <div className="sd-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {modalType === 'add' ? 'Create' : 'Edit'} {activeTab.slice(0, -1).toUpperCase()}
                  </h3>
                </div>
                {errorMsg && <div className="sd-alert sd-alert-error" style={{ marginBottom: '1rem' }}><FiX />{errorMsg}</div>}
                <form className="sd-modal-form" onSubmit={handleFormSubmit}>

                  {/* Schools Form */}
                  {activeTab === 'schools' && (<>
                    <div className="sd-form-group">
                      <label className="sd-form-label">School Name *</label>
                      <input className="sd-form-input" type="text" required value={schoolForm.school_name} onChange={e => {
                        const name = e.target.value;
                        const code = generateSchoolCode(name);
                        setSchoolForm({ ...schoolForm, school_name: name, school_code: code });
                      }} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">School ID / Slug *</label>
                      <input className="sd-form-input" type="text" required placeholder="e.g. nirmala (no spaces/special chars)" disabled={modalType === 'edit'} value={schoolForm.school_id} onChange={e => setSchoolForm({ ...schoolForm, school_id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Unique School Code *</label>
                      <input className="sd-form-input" type="text" required placeholder="Auto-generated" value={schoolForm.school_code} onChange={e => setSchoolForm({ ...schoolForm, school_code: e.target.value })} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Email Address *</label>
                      <input className="sd-form-input" type="email" required value={schoolForm.email} onChange={e => setSchoolForm({ ...schoolForm, email: e.target.value })} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Phone Number</label>
                      <input className="sd-form-input" type="text" value={schoolForm.phone} onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">City Scope</label>
                      <input className="sd-form-input" type="text" value={schoolForm.city} onChange={e => setSchoolForm({ ...schoolForm, city: e.target.value })} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Address</label>
                      <input className="sd-form-input" type="text" value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} />
                    </div>
                    <label className="sd-checkbox-label">
                      <input type="checkbox" checked={schoolForm.is_active} onChange={e => setSchoolForm({ ...schoolForm, is_active: e.target.checked })} />
                      Active / Enable Tenant Scoping
                    </label>
                  </>)}

                  {/* School Admins Form */}
                  {activeTab === 'school-admins' && !isAnyOverlayOpen && (<>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Full Name *</label>
                      <input className="sd-form-input" type="text" required value={schoolAdminForm.full_name} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, full_name: e.target.value })} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Username *</label>
                      <input className="sd-form-input" type="text" required disabled={modalType === 'edit'} value={schoolAdminForm.username} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, username: e.target.value })} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Password {modalType === 'add' ? '*' : '(Leave blank to keep unchanged)'}</label>
                      <input className="sd-form-input" type="password" required={modalType === 'add'} value={schoolAdminForm.password} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, password: e.target.value })} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Email Address *</label>
                      <input className="sd-form-input" type="email" required value={schoolAdminForm.email} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, email: e.target.value })} />
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">Select Role *</label>
                      <select className="sd-form-input" required disabled={modalType === 'edit'} value={schoolAdminForm.role || 'school-admins'} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, role: e.target.value })}>
                        <option value="school-admins">School Admin</option>
                        <option value="teachers">Teacher</option>
                        <option value="students">Student</option>
                      </select>
                    </div>
                    <div className="sd-form-group">
                      <label className="sd-form-label">School Scope *</label>
                      <select className="sd-form-input" required value={schoolAdminForm.school} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, school: e.target.value })}>
                        <option value="">Select School</option>
                        {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name}</option>)}
                      </select>
                    </div>
                    <label className="sd-checkbox-label">
                      <input type="checkbox" checked={schoolAdminForm.is_active} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, is_active: e.target.checked })} />
                      Active User Account
                    </label>
                  </>)}

                  <div className="sd-modal-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.5rem', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" className="sd-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="sd-btn-save">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>{/* /sd-content */}
      </main>

      {/* ════════════════════
          CRUD MODAL OVERLAY - REMOVED
          ════════════════════ */}
      {false && (
        <div className="sd-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="sd-modal">
            <div className="sd-modal-header">
              <span className="sd-modal-title">
                {modalType === 'add' ? 'Create' : 'Edit'} {activeTab.slice(0, -1).toUpperCase()}
              </span>
              <button className="sd-modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            {errorMsg && <div className="sd-alert sd-alert-error" style={{ marginBottom: '1rem' }}><FiX />{errorMsg}</div>}
            <form className="sd-modal-form" onSubmit={handleFormSubmit}>

              {/* Schools Form */}
              {activeTab === 'schools' && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">School Name *</label>
                  <input className="sd-form-input" type="text" required value={schoolForm.school_name} onChange={e => {
                    const name = e.target.value;
                    const code = generateSchoolCode(name);
                    setSchoolForm({ ...schoolForm, school_name: name, school_code: code });
                  }} />
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">School Code</label>
                  <input className="sd-form-input" type="text" readOnly value={schoolForm.school_code || ''} style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Address *</label>
                  <input className="sd-form-input" type="text" required value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} />
                </div>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Phone *</label>
                    <input className="sd-form-input" type="text" required value={schoolForm.phone} onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })} />
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Email *</label>
                    <input className="sd-form-input" type="email" required value={schoolForm.email} onChange={e => setSchoolForm({ ...schoolForm, email: e.target.value })} />
                  </div>
                </div>
                <label className="sd-checkbox-label">
                  <input type="checkbox" checked={schoolForm.is_active} onChange={e => setSchoolForm({ ...schoolForm, is_active: e.target.checked })} />
                  Is Active
                </label>
              </>)}

              {/* Publish Content Form */}
              {(activeTab === 'publish-contents' || activeTab === 'reports') && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Release Name *</label>
                  <input className="sd-form-input" type="text" required value={publishForm.release_name} onChange={e => setPublishForm({ ...publishForm, release_name: e.target.value })} />
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
                    <label className="sd-form-label">Total Experiences *</label>
                    <input className="sd-form-input" type="number" required value={publishForm.total_experiences} onChange={e => setPublishForm({ ...publishForm, total_experiences: parseInt(e.target.value) || 0 })} />
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
                  <input className="sd-form-input" type="text" value={publishForm.export_file} onChange={e => setPublishForm({ ...publishForm, export_file: e.target.value })} />
                </div>
              </>)}

              {/* Grades Form */}
              {activeTab === 'grades' && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Grade Name *</label>
                  <input className="sd-form-input" type="text" required value={gradeForm.grade_name} onChange={e => setGradeForm({ ...gradeForm, grade_name: e.target.value })} placeholder="e.g. Grade 1" />
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Description</label>
                  <textarea className="sd-form-input" value={gradeForm.description} onChange={e => setGradeForm({ ...gradeForm, description: e.target.value })} placeholder="Enter grade details" />
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Sort Order *</label>
                  <input className="sd-form-input" type="number" required value={gradeForm.sort_order} onChange={e => setGradeForm({ ...gradeForm, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
              </>)}

              {/* Experiences Form */}
              {activeTab === 'experiences' && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Grade Level *</label>
                  <select className="sd-form-input" required value={experienceForm.grade} onChange={e => setExperienceForm({ ...experienceForm, grade: e.target.value })}>
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.grade_name}</option>)}
                  </select>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Title *</label>
                  <input className="sd-form-input" type="text" required value={experienceForm.title} onChange={e => setExperienceForm({ ...experienceForm, title: e.target.value })} placeholder="Beginner Lesson" />
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Description</label>
                  <textarea className="sd-form-input" value={experienceForm.description} onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })} />
                </div>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Duration *</label>
                    <input className="sd-form-input" type="number" required value={experienceForm.estimated_duration} onChange={e => setExperienceForm({ ...experienceForm, estimated_duration: parseInt(e.target.value) || 15 })} />
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Difficulty *</label>
                    <select className="sd-form-input" value={experienceForm.difficulty} onChange={e => setExperienceForm({ ...experienceForm, difficulty: e.target.value })}>
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="MASTER">Master</option>
                    </select>
                  </div>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Lifecycle Status *</label>
                  <select className="sd-form-input" value={experienceForm.status} onChange={e => setExperienceForm({ ...experienceForm, status: e.target.value })}>
                    <option value="DRAFT">Draft</option>
                    <option value="REVIEW">Review</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </>)}

              {/* Users & Roles / School Admin Form */}
              {(activeTab === 'school-admins') && (<>
                <div className="sd-form-group">
                  <label className="sd-form-label">Username *</label>
                  <input className="sd-form-input" type="text" required disabled={modalType === 'edit'} value={schoolAdminForm.username} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, username: e.target.value })} />
                </div>
                {modalType === 'add' && (
                  <div className="sd-form-group">
                    <label className="sd-form-label">Password *</label>
                    <input className="sd-form-input" type="password" required value={schoolAdminForm.password || ''} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, password: e.target.value })} />
                  </div>
                )}
                <div className="sd-form-group">
                  <label className="sd-form-label">Full Name *</label>
                  <input className="sd-form-input" type="text" required value={schoolAdminForm.full_name} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, full_name: e.target.value })} />
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Email *</label>
                  <input className="sd-form-input" type="email" required value={schoolAdminForm.email} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, email: e.target.value })} />
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Select Role *</label>
                  <select className="sd-form-input" required disabled={modalType === 'edit'} value={schoolAdminForm.role || 'school-admins'} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, role: e.target.value })}>
                    <option value="school-admins">School Admin</option>
                    <option value="teachers">Teacher</option>
                    <option value="students">Student</option>
                  </select>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">School Scope *</label>
                  <select className="sd-form-input" required value={schoolAdminForm.school} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, school: e.target.value })}>
                    <option value="">Select School</option>
                    {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name}</option>)}
                  </select>
                </div>
                <label className="sd-checkbox-label">
                  <input type="checkbox" checked={schoolAdminForm.is_active} onChange={e => setSchoolAdminForm({ ...schoolAdminForm, is_active: e.target.checked })} />
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
                  showFeedback('Password changed successfully!', null);
                  addRecentActivity("Super Admin security settings updated", 'Profile', '#f3e8ff', '#6b21a8', <FiLock />, '#8b5cf6', '#f5f3ff');
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

      {/* ── Experience Preview Modal ── */}
      {previewExperience && (
        <div className="sd-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) { setPreviewExperience(null); setActivePreviewScreen(null); } }} style={{ zIndex: 9999 }}>
          <div className="sd-modal" style={{ width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', margin: 0, borderRadius: 0, top: 0, left: 0, position: 'fixed', zIndex: 9999, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            {/* Modal Header */}
            <div className="sd-modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0, background: '#f8fafc' }}>
              <div>
                <span className="sd-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Interactive Student Player Simulator</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid #cbd5e1' }}>
                  <strong>Lesson:</strong> {previewExperience.title} • <strong>Grade:</strong> {previewExperience.grade_name || `Grade ${previewExperience.grade}`} • <strong>Difficulty:</strong> {previewExperience.difficulty}
                </span>
              </div>
              <button className="sd-modal-close" onClick={() => { setPreviewExperience(null); setActivePreviewScreen(null); }}><FiX /></button>
            </div>

            {/* Modal Body: Split view */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>

              {/* Left Sidebar: Navigator */}
              <div style={{ width: '280px', borderRight: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', tracking: '0.05em', marginBottom: '0.25rem' }}>Experience Navigator</h4>

                {previewExperience.steps?.map((act, actIdx) => (
                  <div key={act.id || actIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', padding: '2px 4px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                      Act {act.display_order || (actIdx + 1)}: {act.title}
                    </div>
                    {act.screens?.map((scr, scrIdx) => {
                      const isActive = activePreviewScreen && activePreviewScreen.id === scr.id;
                      return (
                        <button
                          key={scr.id || scrIdx}
                          type="button"
                          onClick={() => handleSelectPreviewScreen(scr)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: isActive ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                            color: isActive ? '#ffffff' : '#475569',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.78rem',
                            fontWeight: isActive ? 600 : 500,
                            transition: 'all 0.2s',
                          }}
                        >
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? '#ffffff' : (scr.screen_type === 'QUIZ' ? '#f59e0b' : '#10b981')
                          }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {scr.display_order}. {scr.title || 'Untitled Screen'}
                          </span>
                        </button>
                      );
                    })}
                    {(!act.screens || act.screens.length === 0) && (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '8px' }}>No screens</span>
                    )}
                  </div>
                ))}

                {(!previewExperience.steps || previewExperience.steps.length === 0) && (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', padding: '1rem 0' }}>
                    No activities defined.
                  </div>
                )}
              </div>

              {/* Right Content Pane: Full canvas player simulator */}
              <div className="preview-viewport-main" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 120px)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {activePreviewScreen ? (
                  <>
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
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}>

                    {/* Viewport Canvas Body */}
                    <div 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        position: 'relative',
                        width: '100%',
                        overflow: 'hidden'
                      }}
                    >
                      {activePreviewScreen.elements && activePreviewScreen.elements.length > 0 ? (
                        (() => {
                          const baseCanvasHeight = getCanvasHeight(activePreviewScreen.elements);
                          const scaledHeight = baseCanvasHeight * previewScaleFactor;
                          return (
                            <div style={{ 
                              width: '100%', 
                              height: `${scaledHeight}px`, 
                              position: 'relative', 
                              background: '#ffffff',
                              overflow: 'hidden'
                            }}>
                               <div 
                                 className="preview-canvas-viewport"
                                 style={{
                                   width: '1000px',
                                   height: `${baseCanvasHeight}px`,
                                   padding: '2rem',
                                   boxSizing: 'border-box',
                                   position: 'absolute',
                                   left: 0,
                                   top: 0,
                                   transform: `scale(${previewScaleFactor})`,
                                   transformOrigin: 'top left',
                                   background: '#ffffff',
                                   fontFamily: activePreviewScreen.content?.font || 'Poppins'
                                 }}
                               >
                                 <PreviewCanvasRenderer
                                   elements={activePreviewScreen.elements || []}
                                   activeScreenId={activePreviewScreen.id || ''}
                                   previewAnswers={previewAnswers}
                                   setPreviewAnswers={setPreviewAnswers}
                                   voiceRecordingStates={voiceRecordingStates}
                                   setVoiceRecordingStates={setVoiceRecordingStates}
                                   dragDropSelections={dragDropSelections}
                                   setDragDropSelections={setDragDropSelections}
                                   blankAnswers={blankAnswers}
                                   setBlankAnswers={setBlankAnswers}
                                   flippedCards={flippedCards}
                                   setFlippedCards={setFlippedCards}
                                   resolveUrl={resolvePreviewUrl}
                                 />
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
                            {activePreviewScreen.screen_type === 'INFORMATION' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ padding: '1.25rem', background: '#f0f9ff', borderRadius: '12px', borderLeft: '4px solid #0284c7', fontSize: '0.9rem', color: '#075985', lineHeight: 1.6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                  {activePreviewScreen.content?.intro_text || activePreviewScreen.content?.text || 'Read the conversation dialogue below carefully.'}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                  {(activePreviewScreen.elements?.[0]?.content?.steps || activePreviewScreen.content?.steps || [
                                    { step: 1, name: "Instructor", text: "Welcome to this experience! Interact with the options below.", side: 'left' }
                                  ]).map((dlg, idx) => (
                                    <div key={idx} style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: dlg.side === 'right' ? 'flex-end' : 'flex-start',
                                      width: '100%'
                                    }}>
                                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '4px', marginLeft: dlg.side === 'right' ? 0 : '8px', marginRight: dlg.side === 'right' ? '8px' : 0 }}>
                                        {dlg.name}
                                      </span>
                                      <div style={{
                                        padding: '0.8rem 1.2rem',
                                        borderRadius: '16px',
                                        borderTopLeftRadius: dlg.side === 'right' ? '16px' : '4px',
                                        borderTopRightRadius: dlg.side === 'right' ? '4px' : '16px',
                                        backgroundColor: dlg.side === 'right' ? '#0284c7' : '#f1f5f9',
                                        color: dlg.side === 'right' ? '#ffffff' : '#1e293b',
                                        fontSize: '0.85rem',
                                        maxWidth: '75%',
                                        lineHeight: 1.5,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                      }}>
                                        {dlg.text}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {activePreviewScreen.screen_type === 'IMAGE' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                                {getPreviewMediaUrl(activePreviewScreen, 'image') ? (
                                  <img
                                    src={getPreviewMediaUrl(activePreviewScreen, 'image')}
                                    alt="Screen Image"
                                    style={{ width: '100%', maxWidth: '600px', borderRadius: '16px', maxHeight: '350px', objectFit: 'cover', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                  />
                                ) : (
                                  <div style={{ width: '100%', maxWidth: '600px', height: '220px', backgroundColor: '#f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '3rem', border: '2px dashed #cbd5e1' }}>🖼️</div>
                                )}
                                <p style={{ fontSize: '0.95rem', color: '#334155', textAlign: 'center', lineHeight: 1.6, margin: 0, maxWidth: '600px' }}>
                                  {activePreviewScreen.content?.caption || activePreviewScreen.content?.text || 'Image asset preview.'}
                                </p>
                              </div>
                            )}

                            {activePreviewScreen.screen_type === 'VIDEO' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
                                <div style={{
                                  width: '100%',
                                  maxWidth: '640px',
                                  height: '360px',
                                  backgroundColor: '#0f172a',
                                  borderRadius: '16px',
                                  overflow: 'hidden',
                                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                }}>
                                  <video
                                    src={getPreviewMediaUrl(activePreviewScreen, 'video')}
                                    controls
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                </div>
                              </div>
                            )}

                            {activePreviewScreen.screen_type === 'SPEAKING' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{
                                  width: '100%',
                                  maxWidth: '500px',
                                  padding: '2.5rem',
                                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                  borderRadius: '24px',
                                  color: '#ffffff',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '20px',
                                  boxShadow: '0 20px 25px -5px rgba(2, 132, 199, 0.3)',
                                }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activePreviewScreen.content?.title || 'Audio Pronunciation Practice'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#e0f2fe', marginTop: '4px', marginBottom: '1.5rem' }}>Use the controls below to play the dialogue audio clip</div>
                                  </div>

                                  <audio
                                    src={getPreviewMediaUrl(activePreviewScreen, 'audio')}
                                    controls
                                    style={{ width: '100%' }}
                                  />
                                </div>
                              </div>
                            )}

                            {activePreviewScreen.screen_type === 'QUIZ' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                                  ❓ {activePreviewScreen.elements?.[0]?.content?.question || activePreviewScreen.content?.quiz_question || 'Choose the correct answer.'}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {(activePreviewScreen.elements?.[0]?.content?.options || activePreviewScreen.content?.quiz_options || ["Option A", "Option B", "Option C", "Option D"]).map((opt, oIdx) => {
                                    const isCorrectAnswer = oIdx === (activePreviewScreen.elements?.[0]?.content?.correctAnswerIndex ?? activePreviewScreen.content?.quiz_correct_index ?? 0);
                                    const isSelected = selectedQuizOption === oIdx;
                                    const optText = typeof opt === 'object' ? opt.text : opt;

                                    let cardBorder = '1px solid #cbd5e1';
                                    let cardBg = '#ffffff';
                                    let cardColor = '#334155';

                                    if (quizChecked) {
                                      if (isCorrectAnswer) {
                                        cardBorder = '2px solid #10b981';
                                        cardBg = '#ecfdf5';
                                        cardColor = '#065f46';
                                      } else if (isSelected) {
                                        cardBorder = '2px solid #ef4444';
                                        cardBg = '#fef2f2';
                                        cardColor = '#991b1b';
                                      }
                                    } else if (isSelected) {
                                      cardBorder = '2px solid #0284c7';
                                      cardBg = '#f0f9ff';
                                      cardColor = '#0369a1';
                                    }

                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        disabled={quizChecked}
                                        onClick={() => setSelectedQuizOption(oIdx)}
                                        style={{
                                          padding: '1rem 1.25rem',
                                          borderRadius: '12px',
                                          border: cardBorder,
                                          backgroundColor: cardBg,
                                          color: cardColor,
                                          fontSize: '0.9rem',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          fontWeight: isSelected || (quizChecked && isCorrectAnswer) ? 600 : 500,
                                          cursor: quizChecked ? 'default' : 'pointer',
                                          textAlign: 'left',
                                          transition: 'all 0.15s',
                                          width: '100%',
                                        }}
                                      >
                                        <span>{optText}</span>
                                        {quizChecked && isCorrectAnswer && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Correct Option</span>}
                                        {quizChecked && isSelected && !isCorrectAnswer && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗ Incorrect</span>}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Quiz Actions */}
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                  {!quizChecked ? (
                                    <button
                                      type="button"
                                      className="sd-btn-primary"
                                      disabled={selectedQuizOption === null}
                                      onClick={() => setQuizChecked(true)}
                                      style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}
                                    >
                                      Check Answer
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="sd-btn-outline"
                                      onClick={() => {
                                        setSelectedQuizOption(null);
                                        setQuizChecked(false);
                                      }}
                                      style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}
                                    >
                                      Retry Quiz Attempt
                                    </button>
                                  )}

                                  {quizChecked && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      fontSize: '0.9rem',
                                      fontWeight: 600,
                                      color: selectedQuizOption === (activePreviewScreen.elements?.[0]?.content?.correctAnswerIndex ?? activePreviewScreen.content?.quiz_correct_index ?? 0) ? '#10b981' : '#ef4444'
                                    }}>
                                      {selectedQuizOption === (activePreviewScreen.elements?.[0]?.content?.correctAnswerIndex ?? activePreviewScreen.content?.quiz_correct_index ?? 0)
                                        ? "🎉 Excellent job! That is correct."
                                        : "❌ Oops, that is not correct. Try again!"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {activePreviewScreen.screen_type === 'WRITING' && (
                              <div style={{
                                padding: '2.5rem',
                                backgroundColor: '#fefcf6',
                                border: '1px solid #fef08a',
                                borderRadius: '16px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)',
                                fontSize: '1rem',
                                color: '#451a03',
                                lineHeight: 1.8,
                                fontFamily: activePreviewScreen.content?.font === 'Courier' ? 'Courier New, monospace' : 'Georgia, serif',
                                position: 'relative'
                              }}>
                                {/* Mock line guide */}
                                <div style={{ position: 'absolute', left: '10px', top: 0, bottom: 0, width: '1px', backgroundColor: '#fef08a' }} />
                                {activePreviewScreen.content?.text || 'Custom styled writing text screen layout.'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>

                  {/* Navigation Footer Inside Canvas */}
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
                    {(() => {
                      const flat = getFlatScreens();
                      const idx = flat.findIndex(s => s.id === activePreviewScreen.id);
                      return (
                        <>
                          <button
                            type="button"
                            className="sd-btn-outline"
                            disabled={idx <= 0}
                            onClick={handlePrevScreen}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            ← Previous Screen
                          </button>

                          <button
                            type="button"
                            className="sd-btn-outline"
                            disabled={idx === -1 || idx === flat.length - 1}
                            onClick={handleNextScreen}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            Next Screen →
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <span style={{ fontSize: '4rem' }}>📱</span>
                  <h5 style={{ fontWeight: 600, marginTop: '1.5rem', color: '#1e293b' }}>Select a screen from the steps sidebar to preview</h5>
                </div>
              )}
              </div>
            </div>

            {/* Sticky Modal Footer: Action controls */}
            <div className="sd-modal-footer" style={{ position: 'sticky', bottom: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, flexShrink: 0 }}>
              <button type="button" className="sd-btn-cancel" onClick={() => { setPreviewExperience(null); setActivePreviewScreen(null); }}>Close Preview</button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="sd-btn-primary"
                  style={{ padding: '0.65rem 1.5rem', backgroundColor: '#ef4444', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
                  onClick={() => {
                    setRejectingId(previewExperience.id);
                    setRejectRemark('');
                    setShowRejectModal(true);
                    setPreviewExperience(null);
                    setActivePreviewScreen(null);
                  }}
                >
                  ❌ Reject Experience
                </button>
                <button
                  type="button"
                  className="sd-btn-primary"
                  style={{ padding: '0.65rem 1.5rem', backgroundColor: '#22c55e', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
                  onClick={() => {
                    handleApproveExperience(previewExperience.id);
                    setPreviewExperience(null);
                    setActivePreviewScreen(null);
                  }}
                >
                  ✅ Approve Experience
                </button>
              </div>
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
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.25rem' }} onClick={() => setShowHelpModal(false)}><FiX /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '🏫', title: 'School Management Guide', desc: 'How to onboard new schools, issue license keys, and manage portal roles.', action: '#' },
                { icon: '🔄', title: 'Offline Sync Troubleshooting', desc: 'Resolving telemetry ingestion conflicts from Electron LMS apps.', action: '#' },
                { icon: '🛡️', title: 'System Audit & Security', desc: 'Managing global admin permissions and monitoring API health.', action: '#' },
                { icon: '📞', title: 'Priority Support Contact', desc: 'Email: superadmin-support@lingualab.edu | Emergency Line: +91 98765 43210', action: 'mailto:superadmin-support@lingualab.edu' },
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
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'OK'}
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

      {showRejectModal && (
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
          onClick={() => { setShowRejectModal(false); setRejectingId(null); setRejectRemark(''); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem 1.5rem',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Reject Experience Request
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Please provide a brief review remark explaining the reason for rejection (optional).
            </p>
            <textarea
              className="sd-form-input"
              style={{
                width: '100%',
                height: '100px',
                padding: '0.75rem',
                fontSize: '0.88rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                resize: 'none',
                outline: 'none',
                marginBottom: '1.25rem'
              }}
              placeholder="e.g. Needs more activity screens or audio is unclear..."
              value={rejectRemark}
              onChange={e => setRejectRemark(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="sd-btn-outline"
                style={{ padding: '0.5rem 1rem' }}
                onClick={() => { setShowRejectModal(false); setRejectingId(null); setRejectRemark(''); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sd-btn-primary"
                style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                onClick={handleRejectExperienceSubmit}
              >
                Confirm Reject
              </button>
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

      {showNotifModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '850px', height: '90%', maxHeight: '650px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#4f46e5', color: '#ffffff', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <FiBell />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Notifications & announcements</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Stay updated with recent alerts and platform activity</p>
                </div>
              </div>
              <button style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }} onClick={() => setShowNotifModal(false)}>
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', flex: 1, overflow: 'hidden' }}>
              {/* Left Column: Notifications */}
              <div style={{ borderRight: '1px solid #f1f5f9', padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#334155' }}>Recent Alerts</h4>
                  {notifications.length > 0 && (
                    <button style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setNotifications([])}>
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
                      <div key={n.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: n.read ? '#f8fafc' : '#f0fdf4', border: `1px solid ${n.read ? '#e2e8f0' : '#bbf7d0'}`, position: 'relative' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: n.read ? 600 : 700 }}>{n.title || 'Notification'}</span>
                          <span style={{ fontSize: '0.8rem', color: '#475569' }}>{n.message || n.text}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{n.time || new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {!n.read && (
                            <button style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }} onClick={() => setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true } : item))}>
                              Mark read
                            </button>
                          )}
                          <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.8, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setNotifications(notifications.filter(item => item.id !== n.id))} title="Delete">
                            <FiX size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Announcements */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#334155' }}>System Announcements</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '20px', backgroundColor: '#fee2e2', color: '#ef4444', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Maintenance</span>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Scheduled System Upgrade</h5>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>The language lab portal will undergo essential server migration on Saturday from 2:00 AM to 4:00 AM UTC. Some services might be temporarily offline.</p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Posted 1 day ago</span>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '20px', backgroundColor: '#e0e7ff', color: '#4f46e5', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Feature Release</span>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Enhanced Analytics Dashboard</h5>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>Super Admins can now download full PDF grade reports and access engagement metrics with real-time graphs and teacher activity charts.</p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Posted 3 days ago</span>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Tip</span>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Security Recommendation</h5>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>Ensure all school administrators update their security credentials and password requirements for the new semester.</p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Posted 1 week ago</span>
                  </div>
                </div>
              </div>
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
    school: mUser.school_id,
    role: mUser.role === 'Teacher' ? 'teachers' : mUser.role === 'Student' ? 'students' : 'school-admins'
  };
};

export default Dashboard;
