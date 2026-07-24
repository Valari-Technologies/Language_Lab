import React, { useState, useEffect } from 'react';
import {
  FiGrid, FiUsers, FiBookOpen, FiBarChart2, FiUser,
  FiSettings, FiHelpCircle, FiLogOut, FiSearch,
  FiPlus, FiEdit2, FiTrash2, FiX, FiMenu,
  FiChevronDown, FiCalendar, FiBell, FiFilter,
  FiCheckCircle, FiMonitor, FiSmartphone, FiFileText,
  FiActivity, FiTrendingUp, FiAward, FiLock,
  FiChevronLeft, FiChevronRight, FiEye, FiEyeOff, FiList,
  FiCornerDownRight, FiXCircle, FiMoreVertical, FiDownload, FiAlertTriangle, FiKey, FiInfo
} from 'react-icons/fi';
import './Dashboard.css';
import { apiFetch } from './api';
import dashboardHeaderBanner from './assets/1.jpeg';
import logoIcon from './assets/icon.png';

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
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth="12"/>
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
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth="12"/>
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
  const [experienceBuilders, setExperienceBuilders] = useState([]);
  const [schools, setSchools] = useState([]);
  const [publishContents, setPublishContents] = useState([]);
  const [schoolAdmins, setSchoolAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ total_schools: 0, total_school_admins: 0, total_publish_contents: 0, total_grades: 0 });
  const [previewExperience, setPreviewExperience] = useState(null);
  const [subPage, setSubPage] = useState('overview');
  const [schoolSubTab, setSchoolSubTab] = useState('schools-list');
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [newSchoolForm, setNewSchoolForm] = useState({
    school_name: '', phone: '', address: '', city: '', state: '', pincode: '',
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
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '', full_name: user?.full_name || '', phone_no: user?.phone_no || '', current_password: '', password: '' });
  const [schoolForm, setSchoolForm] = useState({ school_name: '', address: '', phone: '', email: '', logo: '', is_active: true });
  const [publishForm, setPublishForm] = useState({ release_name: '', grade: '', total_experiences: 0, status: 'DRAFT', export_file: '', checksum: '' });
  const [gradeForm, setGradeForm] = useState({ grade_name: '', description: '', sort_order: 1 });
  const [experienceForm, setExperienceForm] = useState({ grade: '', title: '', description: '', objective: '', estimated_duration: 15, difficulty: 'MEDIUM', status: 'DRAFT', thumbnail: '' });
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
  const [selectedUserIds,   setSelectedUserIds]   = useState([]);

  /* ── Modal management ── */
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwModalError, setPwModalError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: '' });

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

  const handlePreviewExperience = async (experience) => {
    try {
      const res = await apiFetch(`/api/v1/content/preview/${experience.id}/`);
      if (res.ok) {
        const data = await res.json();
        setPreviewExperience({ ...experience, steps: data.payload?.activities || data.results || [] });
      } else {
        setPreviewExperience({ ...experience, steps: [] });
      }
    } catch (e) {
      console.error('Failed to load experience steps', e);
      setPreviewExperience({ ...experience, steps: [] });
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
      ]);
    } catch (e) {
      console.error('Failed to load data from backend server.', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  const showFeedback = (success, error) => {
    if (success) { setSuccessMsg(success); }
    if (error)   { setErrorMsg(formatErrorMsg(error)); }
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
        estimated_duration: entity.estimated_duration || 15, difficulty: entity.difficulty || 'MEDIUM',
        status: entity.status || 'DRAFT', thumbnail: entity.thumbnail || ''
      } : {
        grade: selectedGradeFilter || (grades[0]?.id || ''), title: '', description: '',
        objective: '', estimated_duration: 15, difficulty: 'MEDIUM', status: 'DRAFT', thumbnail: ''
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
    } else if (tab === 'school-admins' || tab === 'users-roles') {
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
    const targetTab = activeTab === 'users-roles' ? (schoolAdminForm.role || 'school-admins') : (activeTab === 'reports' ? 'publish-contents' : activeTab);
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
      } else if (activeTab === 'school-admins' || activeTab === 'users-roles') {
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
        if (targetTab === 'schools') { await loadSchools(); await loadDashboardStats(); }
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
      if (!id) return;
      let targetTab = activeTab === 'reports' ? 'publish-contents' : activeTab;
      if (activeTab === 'users-roles') {
        targetTab = deleteConfirm.type === 'teacher' ? 'teachers' : deleteConfirm.type === 'student' ? 'students' : 'school-admins';
      }
      const url = (targetTab === 'experiences' || targetTab === 'experience-builders')
        ? `/api/v1/content/experiences/${id}/`
        : `/api/cms/v1/${targetTab}/${id}/`;
      const res = await apiFetch(url, { method: 'DELETE' });
      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
        showFeedback(resData.message || 'Deleted successfully', null);
        setDeleteConfirm({ show: false, id: null, type: '' });
        if (targetTab === 'schools') { await loadSchools(); await loadDashboardStats(); }
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
      try { localStorage.setItem('user', JSON.stringify(updatedUser)); } catch {}
      showFeedback('Profile updated successfully', null);
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorMsg('Failed to update profile.');
    } finally { setActionLoading(false); }
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
    <div className="sd-layout">

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
        <div className="sd-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
          <img src={logoIcon} alt="Logo" style={{ width: '62px', height: '100px', objectFit: 'contain' }} />
          <div>
            <div className="sd-brand-name">LinguaLab</div>
            <div className="sd-brand-sub">Admin Portal</div>
          </div>
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
            <FiUser/><span>Profile Settings</span>
          </button>
        </nav>

        {/* Sidebar bottom: user card with logout icon */}
        <div className="sd-sidebar-bottom">
          <div className="sd-user-card">
            <div className="sd-user-avatar">
              {(user?.username || 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div className="sd-user-meta">
              <div className="sd-user-name">{user?.username || 'Super Admin'}</div>
              <div className="sd-user-role">Super Admin</div>
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
            <button className="sd-year-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <FiCalendar/> May 15 - Jun 13, 2025 <FiChevronDown/>
            </button>
            <button className="sd-icon-btn"><FiBell/></button>
            <button className="sd-icon-btn"><FiHelpCircle/></button>
          </div>
        </div>

        {/* ── Page Content ── */}
        <div className={`sd-content${activeTab === 'dashboard' ? ' sd-content--dashboard' : ''}`}>

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

          {/* ══════════ OVERVIEW / DASHBOARD TAB ══════════ */}
          {activeTab === 'dashboard' && (
            <>
              {/* Premium Dashboard Header Card with Background Image */}
              <div className="sd-dashboard-header-card" style={{ backgroundImage: `url(${dashboardHeaderBanner})`, position: 'relative' }}>
                <div className="sd-header-text-section" style={{ maxWidth: '50%' }}>
                   <h1>Welcome back, { profileForm.username || user?.username || 'Super Admin' }!</h1>
                  <p>Monitor schools, track student engagement, analyze subscriptions, and make data-driven decisions from one unified dashboard.</p>
                </div>

                {/* Export Report placed in the bottom-right corner of the card */}
                <button className="sd-btn-outline" style={{ position: 'absolute', bottom: '1.5rem', right: '2.5rem', background: '#ffffff', color: '#475569', border: '1px solid #dbeafe', margin: 0, padding: '0.5rem 1.25rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', zIndex: 3 }}>
                  Export Report <FiDownload style={{ fontSize: '0.9rem' }}/>
                </button>
              </div>

              {/* 4 Stat Cards */}
              <div className="sd-stat-row sd-stat-row--4col">
                {[
                  {
                    label: 'Total Schools',
                    value: dashboardStats.total_schools || 1,
                    color: '#4f46e5',
                    bg: '#eef2ff',
                    trendBg: '#e0e7ff',
                    trendColor: '#3730a3',
                    icon: (
                      <svg stroke="currentColor" fill="none" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18" />
                        <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
                      </svg>
                    ),
                    trend: '↑ 8% this month',
                    chart: <MiniLineChart color="#4f46e5" fillGradId="schGrad" points={[10, 15, 12, 18, 30]} />
                  },
                  {
                    label: 'Total Students',
                    value: '34,567',
                    color: '#0d9488',
                    bg: '#f0fdfa',
                    trendBg: '#ccfbf1',
                    trendColor: '#0f766e',
                    icon: <FiUsers/>,
                    trend: '↑ 13.4% this month',
                    chart: <MiniBarChart color="#0d9488" values={[8, 15, 22, 28, 35, 40]} />
                  },
                  {
                    label: 'Active Subscriptions',
                    value: '124',
                    color: '#8b5cf6',
                    bg: '#f5f3ff',
                    trendBg: '#ede9fe',
                    trendColor: '#6d28d9',
                    icon: <FiUser/>,
                    trend: '↑ 6% this month',
                    chart: <MiniLineChart color="#8b5cf6" fillGradId="subGrad" points={[12, 28, 14, 22, 35]} />
                  },
                  {
                    label: 'Total Revenue',
                    value: '₹12,45,000',
                    color: '#059669',
                    bg: '#ecfdf5',
                    trendBg: '#d1fae5',
                    trendColor: '#047857',
                    icon: <div style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1, fontFamily: 'Outfit,Inter,sans-serif' }}>₹</div>,
                    trend: '↑ 15% this month',
                    chart: <MiniBarChart color="#059669" values={[10, 18, 15, 25, 32, 40]} />
                  },
                ].map((s, i) => (
                  <div className="sd-stat-card sd-stat-card--horizontal" key={i}>
                    <div className="sd-stat-card-left">
                      <div className="sd-stat-icon" style={{ background: s.bg, color: s.color, marginBottom: '0.15rem' }}>{s.icon}</div>
                      <div className="sd-stat-label">{s.label}</div>
                      <div className="sd-stat-value">{s.value}</div>
                      <span className="sd-stat-trend" style={{ background: s.trendBg, color: s.trendColor, padding: '1px 6px', borderRadius: '12px', fontSize: '0.64rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', marginTop: '0.2rem', width: 'fit-content' }}>
                        {s.trend}
                      </span>
                    </div>
                    <div className="sd-stat-card-right">
                      {s.chart}
                    </div>
                  </div>
                ))}
              </div>

              {/* Middle Row Charts */}
              <div className="sd-bottom-grid">
                {/* Students Activity Overview */}
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div>
                      <div className="sd-card-title">Students Activity Overview</div>
                    </div>
                    <div className="sd-chart-legend" style={{ marginBottom: 0 }}>
                      <div className="sd-chart-legend-item">
                        <div className="sd-chart-legend-dot" style={{ background: '#3b82f6' }}/>
                        Active Students
                      </div>
                      <div className="sd-chart-legend-item">
                        <div className="sd-chart-legend-dot" style={{ background: '#10b981' }}/>
                        Completed Activities
                      </div>
                    </div>
                  </div>
                  <div className="sd-chart-wrap" style={{ marginTop: '1.25rem' }}>
                    <ActivityLineChart/>
                  </div>
                  <div className="sd-x-labels" style={{ paddingLeft: '35px', paddingRight: '5px' }}>
                    {['May 15', 'May 22', 'May 29', 'Jun 05', 'Jun 13'].map(m => <span className="sd-x-label" key={m}>{m}</span>)}
                  </div>
                </div>

                {/* Subscription Status Donut */}
                <div className="sd-card sd-card--subscription-donut" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="sd-card-header" style={{ marginBottom: '1rem' }}>
                      <div className="sd-card-title">Subscription Status</div>
                    </div>
                    <div className="sd-completion-grid">
                      <div className="sd-donut-wrap">
                        <MultiDonutChart total={124} activeCount={78} expiringCount={28} expiredCount={18}/>
                      </div>
                      <div className="sd-legend">
                        {[
                          { label: 'Active',        color: '#006aa6', pct: '78 (62.9%)' },
                          { label: 'Expiring Soon', color: '#0ea5e9', pct: '28 (22.6%)' },
                          { label: 'Expired',       color: '#38bdf8', pct: '18 (14.5%)' },
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
                  
                  {/* View All Subscriptions Link */}
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                    <button className="sd-view-all" onClick={() => goTo('subscriptions')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 600, fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                      View all subscriptions <span style={{ fontSize: '1rem' }}>→</span>
                    </button>
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
                  <div className="sd-activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {[
                      { id: 1, icon: <FiGrid />, color: '#3b82f6', bg: '#eff6ff', desc: "New school \"Greenfield Academy\" registered", meta: 'Super Admin • 10 mins ago', tag: 'New School', tagBg: '#dcfce7', tagColor: '#15803d' },
                      { id: 2, icon: <FiActivity />, color: '#0d9488', bg: '#f0fdfa', desc: "Subscription renewed for \"Bright Future School\"", meta: 'System • 1 hour ago', tag: 'Subscription', tagBg: '#e0f2fe', tagColor: '#0369a1' },
                      { id: 3, icon: <FiUsers />, color: '#8b5cf6', bg: '#f5f3ff', desc: "12 new students added to \"Silver Oak High\"", meta: 'Admin User • 3 hours ago', tag: 'Students', tagBg: '#f3e8ff', tagColor: '#6b21a8' },
                      { id: 4, icon: <FiFileText />, color: '#f59e0b', bg: '#fffbeb', desc: "Monthly report generated", meta: 'System • 5 hours ago', tag: 'Report', tagBg: '#fef3c7', tagColor: '#b45309' },
                    ].map(act => (
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
                          <th>Active Students</th>
                          <th>Completed Activities</th>
                          <th>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Bright Future School', active: '8,567', completed: '9,832', pct: 92 },
                          { name: 'Silver Oak High', active: '6,432', completed: '7,456', pct: 89 },
                          { name: 'Greenfield Academy', active: '5,678', completed: '6,302', pct: 85 },
                          { name: 'Sunrise Public School', active: '4,321', completed: '4,982', pct: 78 },
                        ].map((sch, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }}></span>
                              {sch.name}
                            </td>
                            <td>{sch.active}</td>
                            <td>{sch.completed}</td>
                            <td style={{ width: '120px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1e293b', width: '30px' }}>{sch.pct}%</span>
                                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${sch.pct}%`, height: '100%', background: '#10b981', borderRadius: '3px' }}></div>
                                </div>
                              </div>
                            </td>
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
                <div>
                  <h1 className="sd-page-title">Users &amp; Roles</h1>
                  <p className="sd-page-sub">Manage platform users and their roles.</p>
                </div>
              </div>

              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
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
                      <option value="School Admin">School Admin</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Student">Student</option>
                    </select>
                    <select className="sd-btn-filter" style={{ border: '1.5px solid #e8edf5', background: '#fff', fontSize: '0.8rem', fontWeight: 500 }}
                      value={selectedStatusFilter} onChange={e => { setSelectedStatusFilter(e.target.value); setUsersPage(1); }}>
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="sd-table-actions" style={{ display: 'flex', gap: '0.65rem' }}>
                    {selectedUserIds.length > 0 && (
                      <button className="sd-btn-outline" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleBulkDeleteUsers}>
                        <FiTrash2/> Delete Selected ({selectedUserIds.length})
                      </button>
                    )}
                    <button className="sd-btn-primary" onClick={handleOpenAdd}>
                      <FiPlus/> Add User
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <colgroup>
                      <col style={{ width: '4%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '24%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '14%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="sd-checkbox-cell">
                          <input
                            type="checkbox"
                            checked={getMergedUsers().length > 0 && selectedUserIds.length > 0}
                            onChange={handleSelectAllUsers}
                          />
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>School / Scope</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
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
                      }), usersPage).map((u, i) => {
                        const uid = u.id || i;
                        return (
                          <tr key={uid}>
                            <td className="sd-checkbox-cell">
                              {u.id !== 'super-admin-row' && (
                                <input
                                  type="checkbox"
                                  checked={selectedUserIds.includes(u.id)}
                                  onChange={() => handleSelectUserRow(u.id)}
                                />
                              )}
                            </td>
                            <td style={{ fontWeight: 600, color: '#1e293b' }}>{u.full_name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{u.school_name}</td>
                            <td style={{ overflow: 'visible', textOverflow: 'clip' }}>
                              <span className={`sd-badge ${u.is_active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                                {u.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="sd-action-cell" style={{ justifyContent: 'center' }}>
                                {u.id !== 'super-admin-row' && (
                                  <>
                                    <button className="sd-icon-action edit" onClick={() => handleOpenEdit(saFromMerged(u))} title="Edit"><FiEdit2/></button>
                                    <button className="sd-icon-action delete" onClick={() => openDeleteModal(u.id, 'school admin')} title="Delete"><FiTrash2/></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filterList(getMergedUsers()).length === 0 && (
                        <tr><td colSpan="7" className="sd-empty-state">No users found.</td></tr>
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
                      <span 
                        onClick={() => setIsAddingSchool(false)}
                        style={{ cursor: 'pointer', fontWeight: 500 }}
                        className="sd-breadcrumb-link"
                      >
                        Manage Schools
                      </span>
                      &nbsp;&gt;&nbsp; <span style={{ color: '#4f46e5', fontWeight: 600 }}>Add School</span>
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
                            <label className="sd-form-label">Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="sd-form-input" type="text" placeholder="Enter phone number" required
                              value={newSchoolForm.phone || ''} onChange={e => setNewSchoolForm({ ...newSchoolForm, phone: e.target.value })}/>
                          </div>
                          <div className="sd-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="sd-form-label">Address <span style={{ color: '#ef4444' }}>*</span></label>
                            <textarea className="sd-form-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Enter full address" required
                              value={newSchoolForm.address} onChange={e => setNewSchoolForm({ ...newSchoolForm, address: e.target.value })}/>
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
                              value={newSchoolForm.pincode} onChange={e => setNewSchoolForm({ ...newSchoolForm, pincode: e.target.value })}/>
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
                              value={newSchoolForm.email} onChange={e => setNewSchoolForm({ ...newSchoolForm, email: e.target.value })}/>
                          </div>
                        </div>
                        <div style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: '#475569', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <FiCheckCircle style={{ color: '#16a34a', flexShrink: 0, fontSize: '1rem' }}/>
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
                  <div className="sd-page-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h1 className="sd-page-title">Manage Schools</h1>
                        <p className="sd-page-sub">Configure English Learning Content and structures dynamically</p>
                      </div>
                    </div>
                  </div>

                  <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="sd-table-toolbar">
                      <div className="sd-table-search">
                        <FiSearch/>
                        <input
                          type="text"
                          placeholder="Search schools..."
                          value={searchQuery}
                          onChange={e => { setSearchQuery(e.target.value); setSchoolsPage(1); }}
                        />
                      </div>
                      <div className="sd-table-actions">
                        {selectedSchoolIds.length > 0 && (
                          <button className="sd-btn-outline" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleBulkDeleteSchools}>
                            <FiTrash2/> Delete Selected ({selectedSchoolIds.length})
                          </button>
                        )}
                        <button className="sd-btn-primary" onClick={() => setIsAddingSchool(true)}><FiPlus/>Add School</button>
                      </div>
                    </div>

                    <div className="sd-table-wrap">
                      <table className="sd-table">
                        <colgroup>
                          <col style={{ width: '4%' }} />
                          <col style={{ width: '22%' }} />
                          <col style={{ width: '16%' }} />
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '8%' }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="sd-checkbox-cell">
                              <input
                                type="checkbox"
                                checked={schools.length > 0 && selectedSchoolIds.length === filterList(schools).length}
                                onChange={handleSelectAllSchools}
                              />
                            </th>
                            <th>SCHOOL NAME</th>
                            <th>ADMIN NAME</th>
                            <th>EMAIL</th>
                            <th>TEACHERS</th>
                            <th>STUDENTS</th>
                            <th>LOCATION</th>
                            <th style={{ textAlign: 'center' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(filterList(schools), schoolsPage).map((s, i) => {
                            const sid = s.school_id || s.id;
                            const admin = schoolAdmins.find(sa => sa.school === s.school_id || sa.school_id === s.school_id);
                            const adminName = admin ? (admin.full_name || admin.username) : (s.admin_name || 'N/A');
                            const adminEmail = admin ? admin.email : (s.email || 'admin@example.com');
                            const teachersCount = teachers.filter(t => t.school === s.school_id || t.school_id === s.school_id).length;
                            const studentCount = 0;

                            return (
                              <tr key={sid || i}>
                                <td className="sd-checkbox-cell">
                                  <input
                                    type="checkbox"
                                    checked={selectedSchoolIds.includes(sid)}
                                    onChange={() => handleSelectSchoolRow(sid)}
                                  />
                                </td>
                                <td style={{ fontWeight: 600, color: '#1e293b' }}>{s.school_name}</td>
                                <td>{adminName}</td>
                                <td>{adminEmail}</td>
                                <td>{teachersCount}</td>
                                <td>{studentCount}</td>
                                <td>{s.address || s.city || 'N/A'}</td>
                                <td>
                                  <div className="sd-action-cell" style={{ justifyContent: 'center' }}>
                                    <button className="sd-icon-action edit" onClick={() => handleOpenEdit(s)} title="Edit"><FiEdit2/></button>
                                    <button className="sd-icon-action delete" onClick={() => openDeleteModal(sid, 'school')} title="Delete"><FiTrash2/></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {filterList(schools).length === 0 && (
                            <tr><td colSpan="8" className="sd-empty-state">No schools found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination total={filterList(schools).length} perPage={PER_PAGE} page={schoolsPage} onPage={setSchoolsPage}/>
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
                      { label: 'TOTAL ACTIVE',    value: '124',          color: '#3b82f6', bg: '#e0f2fe', icon: <FiUser/>,     trend: '↑ 6 this month', trendColor: '#22c55e' },
                      { label: 'EXPIRING SOON',   value: '9',            color: '#f97316', bg: '#ffedd5', icon: <FiBell/>,     trend: 'Within 30 days', trendColor: '#64748b' },
                      { label: 'EXPIRED',         value: '5',            color: '#ef4444', bg: '#fee2e2', icon: <FiXCircle/>,  trend: 'Needs attention', trendColor: '#ef4444' },
                      { label: 'TOTAL REVENUE',   value: '₹12,45,000',   color: '#a855f7', bg: '#f3e8ff', icon: <FiAward/>,    trend: '↑ 15% this month', trendColor: '#22c55e' },
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
                          <DistributionDonutChart/>
                        </div>
                        <div className="sd-legend">
                          {[
                            { label: 'Basic Plan',          color: '#004e75', pct: '45 (36.3%)' },
                            { label: 'Standard Plan',       color: '#006aa6', pct: '38 (30.6%)' },
                            { label: 'Premium Plan',        color: '#0ea5e9', pct: '28 (22.6%)' },
                            { label: 'Enterprise Plan',     color: '#38bdf8', pct: '10 (8.1%)' },
                            { label: 'Expired / Cancelled', color: '#bae6fd', pct: '3 (2.4%)' },
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
                               <td style={{ overflow: 'visible', textOverflow: 'clip' }}>
                                <span className={`sd-badge ${p.active ? 'sd-badge-active' : 'sd-badge-inactive'}`}>Active</span>
                              </td>
                              <td>
                                <div className="sd-action-cell">
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
                <div>
                  <h1 className="sd-page-title">Reports &amp; Releases</h1>
                  <p className="sd-page-sub">Release publish history, package checksums, and grade release files.</p>
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
                  <div className="sd-table-actions">
                    <button className="sd-btn-primary" onClick={handleOpenAdd}>
                      <FiPlus/> Add Release
                    </button>
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Release Name</th>
                        <th>Grade</th>
                        <th>Total Experiences</th>
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
                          <td>{p.total_experiences}</td>
                          <td style={{ overflow: 'visible', textOverflow: 'clip' }}>
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
                              <button className="sd-icon-action delete" onClick={() => openDeleteModal(p.publish_id || p.id, 'publish log')} title="Delete"><FiTrash2/></button>
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
                <h1 className="sd-page-title">Profile Settings</h1>
                <p className="sd-page-sub">View and update your administrator account details.</p>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="sd-profile-card">
                  <div className="sd-profile-section-header">
                    <div className="sd-profile-section-title">
                      <FiUser/>Personal Details
                    </div>
          
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
                    <div className="sd-form-group">
                      <label className="sd-form-label">Phone Number</label>
                      <input className="sd-form-input" type="tel"
                        value={profileForm.phone_no}
                        onChange={e => setProfileForm({ ...profileForm, phone_no: e.target.value })}
                        placeholder="+91 98765 43210"/>
                    </div>
                  </div>

                  {/* Change password row */}
                  <div className="sd-pw-row">
                    <div>
                      <div className="sd-pw-row-title">Change Password</div>
                      <div className="sd-pw-row-sub">Update your password to stay secure</div>
                    </div>
                    <button type="button" className="sd-btn-outline" onClick={() => {
                      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
                      setPwModalError('');
                      setShowPwModal(true);
                    }}>Update</button>
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
                            <button onClick={() => { setSelectedGradeFilter(g.id); onTabChange('experiences'); }} className="sd-btn-outline" style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                              <FiCornerDownRight/> Experiences
                            </button>
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit" onClick={() => handleOpenEdit(g)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => openDeleteModal(g.id, 'grade')} title="Delete"><FiTrash2/></button>
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

          {/* ══════════ EXPERIENCES TAB ══════════ */}
          {activeTab === 'experiences' && (
            <>
              <div className="sd-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 className="sd-page-title">Manage Experiences</h1>
                  </div>
                  <button className="sd-btn-primary" onClick={handleOpenAdd}><FiPlus/>Add Experience</button>
                </div>
              </div>

              <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="sd-table-toolbar">
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', flex: 1 }}>
                    <div className="sd-table-search">
                      <FiSearch/>
                      <input
                        type="text"
                        placeholder="Search experiences..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setExperiencesPage(1); }}
                      />
                    </div>
                    <select className="sd-btn-filter" style={{ border: '1.5px solid #e8edf5', background: '#fff', fontSize: '0.8rem', fontWeight: 500 }}
                      value={selectedGradeFilter} onChange={e => { setSelectedGradeFilter(e.target.value); setExperiencesPage(1); }}>
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
                      {paginate(filterList(experiences).filter(ex => !selectedGradeFilter || ex.grade?.id === parseInt(selectedGradeFilter) || ex.grade === parseInt(selectedGradeFilter)), experiencesPage).map((ex, i) => (
                        <tr key={ex.id || i}>
                          <td style={{ overflow: 'visible', textOverflow: 'clip' }}><span className="sd-badge sd-badge-active" style={{ background: '#e0f2fe', color: '#0369a1' }}>{ex.grade_name || `Grade ID: ${ex.grade}`}</span></td>
                          <td style={{ fontWeight: 600 }}>{ex.title}</td>
                          <td>{ex.estimated_duration} mins</td>
                          <td style={{ overflow: 'visible', textOverflow: 'clip' }}>
                            <span className={`sd-badge ${ex.difficulty === 'EASY' ? 'sd-badge-active' : ex.difficulty === 'HARD' ? 'sd-badge-leave' : 'sd-badge-review'}`}>
                              {ex.difficulty}
                            </span>
                          </td>
                          <td style={{ overflow: 'visible', textOverflow: 'clip' }}>
                            <span className={`sd-badge ${ex.status === 'PUBLISHED' ? 'sd-badge-published' : ex.status === 'REVIEW' ? 'sd-badge-review' : 'sd-badge-draft'}`}>
                              {ex.status}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => { setSelectedExperienceFilter(ex.id); onTabChange('experience-builders'); }} className="btn-link" style={{ background:'none', border:'none', color:'#6366f1', textDecoration:'underline', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
                              Experience Builders
                            </button>
                          </td>
                          <td>
                            <div className="sd-action-cell">
                              <button className="sd-icon-action edit" onClick={() => handlePreviewExperience(ex)} title="Preview"><FiBookOpen style={{ color:'#3b82f6' }}/></button>
                              <button className="sd-icon-action edit" onClick={() => handleOpenEdit(ex)} title="Edit"><FiEdit2/></button>
                              <button className="sd-icon-action delete" onClick={() => openDeleteModal(ex.id, 'experience')} title="Delete"><FiTrash2/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterList(experiences).length === 0 && (
                        <tr><td colSpan="7" className="sd-empty-state">No experiences found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={filterList(experiences).filter(ex => !selectedGradeFilter || ex.grade?.id === parseInt(selectedGradeFilter) || ex.grade === parseInt(selectedGradeFilter)).length} perPage={PER_PAGE} page={experiencesPage} onPage={setExperiencesPage}/>
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
                    <label className="sd-form-label">Total Experiences *</label>
                    <input className="sd-form-input" type="number" required value={publishForm.total_experiences} onChange={e => setPublishForm({ ...publishForm, total_experiences: parseInt(e.target.value) || 0 })}/>
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
                  <input className="sd-form-input" type="text" required value={experienceForm.title} onChange={e => setExperienceForm({ ...experienceForm, title: e.target.value })} placeholder="Beginner Lesson"/>
                </div>
                <div className="sd-form-group">
                  <label className="sd-form-label">Description</label>
                  <textarea className="sd-form-input" value={experienceForm.description} onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })}/>
                </div>
                <div className="sd-form-row">
                  <div className="sd-form-group">
                    <label className="sd-form-label">Duration *</label>
                    <input className="sd-form-input" type="number" required value={experienceForm.estimated_duration} onChange={e => setExperienceForm({ ...experienceForm, estimated_duration: parseInt(e.target.value) || 15 })}/>
                  </div>
                  <div className="sd-form-group">
                    <label className="sd-form-label">Difficulty *</label>
                    <select className="sd-form-input" value={experienceForm.difficulty} onChange={e => setExperienceForm({ ...experienceForm, difficulty: e.target.value })}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
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

      {/* ── Experience Preview Modal ── */}
      {previewExperience && (
        <div className="sd-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setPreviewExperience(null); }}>
          <div className="sd-modal" style={{ maxWidth: 700 }}>
            <div className="sd-modal-header">
              <span className="sd-modal-title">Preview Experience: {previewExperience.title}</span>
              <button className="sd-modal-close" onClick={() => setPreviewExperience(null)}><FiX/></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Grade:</strong> {previewExperience.grade_name || `Grade ID: ${previewExperience.grade}`}</div>
              <div><strong>Duration:</strong> {previewExperience.estimated_duration} mins</div>
              <div><strong>Difficulty:</strong> {previewExperience.difficulty}</div>
              <div><strong>Status:</strong> {previewExperience.status}</div>
            </div>
            <h4 style={{ marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>Experience Steps</h4>
            <div className="sd-activity-list">
              {previewExperience.steps?.map((s, idx) => (
                <div className="sd-activity-item" key={s.id || idx}>
                  <div className="sd-activity-body">
                    <div className="sd-activity-name">Step #{s.display_order}: {s.title} ({s.block_type})</div>
                    {s.content && <div className="sd-activity-desc">{s.content}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="sd-modal-footer">
              <button className="sd-btn-cancel" onClick={() => setPreviewExperience(null)}>Close</button>
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
