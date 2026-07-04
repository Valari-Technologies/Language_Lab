import React, { useState, useEffect } from 'react';
import { 
  FiShield, 
  FiLayers, 
  FiBarChart2, 
  FiClock,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLogOut,
  FiGrid,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiBookOpen,
  FiList,
  FiHelpCircle,
  FiFileText,
  FiCornerDownRight,
  FiMenu,
  FiX
} from 'react-icons/fi';
import './Dashboard.css';

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.reload();
    throw new Error('Session expired');
  }

  return response;
};

const Dashboard = ({ user, onLogout, activeTab, onTabChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data lists
  const [grades, setGrades] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [steps, setSteps] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [optionsList, setOptionsList] = useState([]);

  // Filter overrides for nested navigation
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [selectedExperienceFilter, setSelectedExperienceFilter] = useState('');
  const [selectedAssessmentFilter, setSelectedAssessmentFilter] = useState('');
  const [selectedQuestionFilter, setSelectedQuestionFilter] = useState('');

  // Loading & error feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal forms management
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [gradeForm, setGradeForm] = useState({ grade_name: '', description: '', sort_order: 1 });
  const [experienceForm, setExperienceForm] = useState({
    grade: '', title: '', description: '', objective: '', estimated_duration: 15, difficulty: 'MEDIUM', status: 'DRAFT', thumbnail: ''
  });
  const [stepForm, setStepForm] = useState({
    experience: '', block_type: 'VIDEO', title: '', content: '', media_url: '', display_order: 1, settings: '{}'
  });
  const [assessmentForm, setAssessmentForm] = useState({
    experience: '', title: '', instructions: '', mastery: 10, total_marks: 20, display_order: 1
  });
  const [questionForm, setQuestionForm] = useState({
    assessment: '', question_type: 'MCQ', question_text: '', marks: 5, display_order: 1
  });
  const [optionForm, setOptionForm] = useState({
    question: '', option_text: '', is_correct: false, display_order: 1
  });

  // Fetch all helper loaders
  const loadGrades = async () => {
    try {
      const res = await apiFetch('/api/cms/grades/');
      if (res.ok) {
        const data = await res.json();
        setGrades(data.results || data);
      }
    } catch (e) { console.error('Failed to load grades', e); }
  };

  const loadExperiences = async () => {
    try {
      const res = await apiFetch('/api/cms/learning-experiences/');
      if (res.ok) {
        const data = await res.json();
        setExperiences(data.results || data);
      }
    } catch (e) { console.error('Failed to load experiences', e); }
  };

  const loadSteps = async () => {
    try {
      const res = await apiFetch('/api/cms/experience-steps/');
      if (res.ok) {
        const data = await res.json();
        setSteps(data.results || data);
      }
    } catch (e) { console.error('Failed to load steps', e); }
  };

  const loadAssessments = async () => {
    try {
      const res = await apiFetch('/api/cms/assessments/');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.results || data);
      }
    } catch (e) { console.error('Failed to load assessments', e); }
  };

  const loadQuestions = async () => {
    try {
      const res = await apiFetch('/api/cms/questions/');
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.results || data);
      }
    } catch (e) { console.error('Failed to load questions', e); }
  };

  const loadOptions = async () => {
    try {
      const res = await apiFetch('/api/cms/options/');
      if (res.ok) {
        const data = await res.json();
        setOptionsList(data.results || data);
      }
    } catch (e) { console.error('Failed to load options', e); }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([
        loadGrades(),
        loadExperiences(),
        loadSteps(),
        loadAssessments(),
        loadQuestions(),
        loadOptions()
      ]);
    } catch (e) {
      setErrorMsg('Failed to load data from backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Load everything on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Show temporary success/error alerts
  const showFeedback = (success, error) => {
    if (success) {
      setSuccessMsg(success);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
    if (error) {
      setErrorMsg(error);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Clean form values
  const initForm = (tab, entity = null) => {
    setErrorMsg('');
    if (tab === 'grades') {
      setGradeForm(entity ? {
        grade_name: entity.grade_name || '',
        description: entity.description || '',
        sort_order: entity.sort_order || 1
      } : { grade_name: '', description: '', sort_order: grades.length + 1 });
    } else if (tab === 'experiences') {
      setExperienceForm(entity ? {
        grade: entity.grade?.id || entity.grade || '',
        title: entity.title || '',
        description: entity.description || '',
        objective: entity.objective || '',
        estimated_duration: entity.estimated_duration || 15,
        difficulty: entity.difficulty || 'MEDIUM',
        status: entity.status || 'DRAFT',
        thumbnail: entity.thumbnail || ''
      } : {
        grade: selectedGradeFilter || (grades[0]?.id || ''),
        title: '',
        description: '',
        objective: '',
        estimated_duration: 15,
        difficulty: 'MEDIUM',
        status: 'DRAFT',
        thumbnail: ''
      });
    } else if (tab === 'steps') {
      setStepForm(entity ? {
        experience: entity.experience?.id || entity.experience || '',
        block_type: entity.block_type || 'VIDEO',
        title: entity.title || '',
        content: entity.content || '',
        media_url: entity.media_url || '',
        display_order: entity.display_order || 1,
        settings: JSON.stringify(entity.settings || {}, null, 2)
      } : {
        experience: selectedExperienceFilter || (experiences[0]?.id || ''),
        block_type: 'VIDEO',
        title: '',
        content: '',
        media_url: '',
        display_order: steps.filter(s => s.experience?.id === selectedExperienceFilter).length + 1,
        settings: '{}'
      });
    } else if (tab === 'assessments') {
      setAssessmentForm(entity ? {
        experience: entity.experience?.id || entity.experience || '',
        title: entity.title || '',
        instructions: entity.instructions || '',
        mastery: entity.mastery || 10,
        total_marks: entity.total_marks || 20,
        display_order: entity.display_order || 1
      } : {
        experience: selectedExperienceFilter || (experiences[0]?.id || ''),
        title: '',
        instructions: '',
        mastery: 10,
        total_marks: 20,
        display_order: assessments.filter(a => a.experience?.id === selectedExperienceFilter).length + 1
      });
    } else if (tab === 'questions') {
      setQuestionForm(entity ? {
        assessment: entity.assessment?.id || entity.assessment || '',
        question_type: entity.question_type || 'MCQ',
        question_text: entity.question_text || '',
        marks: entity.marks || 5,
        display_order: entity.display_order || 1
      } : {
        assessment: selectedAssessmentFilter || (assessments[0]?.id || ''),
        question_type: 'MCQ',
        question_text: '',
        marks: 5,
        display_order: questions.filter(q => q.assessment?.id === selectedAssessmentFilter).length + 1
      });
    } else if (tab === 'options') {
      setOptionForm(entity ? {
        question: entity.question?.id || entity.question || '',
        option_text: entity.option_text || '',
        is_correct: entity.is_correct || false,
        display_order: entity.display_order || 1
      } : {
        question: selectedQuestionFilter || (questions[0]?.id || ''),
        option_text: '',
        is_correct: false,
        display_order: optionsList.filter(o => o.question?.id === selectedQuestionFilter).length + 1
      });
    }
  };

  // Add / Edit Button Clicks
  const handleOpenAdd = () => {
    setModalType('add');
    setEditingId(null);
    initForm(activeTab);
    setShowModal(true);
  };

  const handleOpenEdit = (entity) => {
    setModalType('edit');
    setEditingId(entity.id);
    initForm(activeTab, entity);
    setShowModal(true);
  };

  // Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    let body = {};
    let url = `/api/cms/${activeTab === 'experiences' ? 'learning-experiences' : activeTab === 'steps' ? 'experience-steps' : activeTab}/`;
    
    if (modalType === 'edit') {
      url += `${editingId}/`;
    }

    try {
      if (activeTab === 'grades') {
        body = { ...gradeForm };
      } else if (activeTab === 'experiences') {
        body = { ...experienceForm, grade: parseInt(experienceForm.grade) };
      } else if (activeTab === 'steps') {
        let settingsJson = {};
        try {
          settingsJson = JSON.parse(stepForm.settings || '{}');
        } catch (err) {
          setErrorMsg('Settings must be valid JSON object.');
          return;
        }
        body = { 
          ...stepForm, 
          experience: parseInt(stepForm.experience),
          settings: settingsJson 
        };
      } else if (activeTab === 'assessments') {
        body = { 
          ...assessmentForm, 
          experience: parseInt(assessmentForm.experience),
          mastery: parseInt(assessmentForm.mastery),
          total_marks: parseInt(assessmentForm.total_marks),
          display_order: parseInt(assessmentForm.display_order)
        };
      } else if (activeTab === 'questions') {
        body = { 
          ...questionForm, 
          assessment: parseInt(questionForm.assessment),
          marks: parseInt(questionForm.marks),
          display_order: parseInt(questionForm.display_order)
        };
      } else if (activeTab === 'options') {
        body = { 
          ...optionForm, 
          question: parseInt(optionForm.question),
          display_order: parseInt(optionForm.display_order)
        };
      }

      const method = modalType === 'add' ? 'POST' : 'PUT';
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(body)
      });

      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Operation successful', null);
        setShowModal(false);
        // Refresh data lists
        if (activeTab === 'grades') await loadGrades();
        else if (activeTab === 'experiences') await loadExperiences();
        else if (activeTab === 'steps') await loadSteps();
        else if (activeTab === 'assessments') await loadAssessments();
        else if (activeTab === 'questions') await loadQuestions();
        else if (activeTab === 'options') await loadOptions();
      } else {
        const errorDetail = typeof resData === 'object' ? JSON.stringify(resData) : resData;
        setErrorMsg(`Error: ${errorDetail}`);
      }
    } catch (err) {
      setErrorMsg('Failed to process request. Make sure form data is correct.');
      console.error(err);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    setErrorMsg('');
    const url = `/api/cms/${activeTab === 'experiences' ? 'learning-experiences' : activeTab === 'steps' ? 'experience-steps' : activeTab}/${id}/`;
    
    try {
      const res = await apiFetch(url, { method: 'DELETE' });
      const resData = await res.json();
      if (res.ok) {
        showFeedback(resData.message || 'Deleted successfully', null);
        if (activeTab === 'grades') await loadGrades();
        else if (activeTab === 'experiences') await loadExperiences();
        else if (activeTab === 'steps') await loadSteps();
        else if (activeTab === 'assessments') await loadAssessments();
        else if (activeTab === 'questions') await loadQuestions();
        else if (activeTab === 'options') await loadOptions();
      } else {
        setErrorMsg(resData.message || 'Failed to delete record.');
      }
    } catch (err) {
      setErrorMsg('Error communicating with backend.');
      console.error(err);
    }
  };

  // Stats generators
  const getStats = () => {
    return {
      grades: grades.length,
      experiences: experiences.length,
      steps: steps.length,
      assessments: assessments.length
    };
  };
  const stats = getStats();

  return (
    <div className="dashboard-layout">
      {/* Mobile Header Bar */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
          <FiMenu />
        </button>
        <div className="mobile-brand">
          <div className="brand-logo-small">
            <FiShield />
          </div>
          <span className="brand-name-small">Language Lab</span>
        </div>
        <div className="mobile-user-avatar">
          {user.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Panel */}
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <FiShield />
          </div>
          <div>
            <h3 className="brand-name">Language Lab</h3>
            <span className="brand-badge">CMS Portal</span>
          </div>
          {/* Mobile Close Button */}
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-link ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => { onTabChange('grades'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiGrid className="nav-icon" />
            <span>Grades</span>
            <span className="nav-count">{stats.grades}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'experiences' ? 'active' : ''}`}
            onClick={() => { onTabChange('experiences'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiBookOpen className="nav-icon" />
            <span>Learning Exp.</span>
            <span className="nav-count">{stats.experiences}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'steps' ? 'active' : ''}`}
            onClick={() => { onTabChange('steps'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiList className="nav-icon" />
            <span>Exp. Steps</span>
            <span className="nav-count">{stats.steps}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'assessments' ? 'active' : ''}`}
            onClick={() => { onTabChange('assessments'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiFileText className="nav-icon" />
            <span>Assessments</span>
            <span className="nav-count">{stats.assessments}</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => { onTabChange('questions'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiHelpCircle className="nav-icon" />
            <span>Questions</span>
          </button>

          <button 
            className={`nav-link ${activeTab === 'options' ? 'active' : ''}`}
            onClick={() => { onTabChange('options'); setSearchQuery(''); setIsSidebarOpen(false); }}
          >
            <FiCheckCircle className="nav-icon" />
            <span>Options</span>
          </button>
        </nav>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="user-meta">
            <div className="user-name">{user.username}</div>
            <div className="user-role">{user.role || 'Super Admin'}</div>
          </div>
          <button onClick={() => { setIsSidebarOpen(false); onLogout(); }} className="logout-btn" title="Sign Out">
            <FiLogOut />
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-info">
            <h1 className="page-title">
              {activeTab === 'grades' && 'Manage Grades'}
              {activeTab === 'experiences' && 'Learning Experiences'}
              {activeTab === 'steps' && 'Experience Steps Content'}
              {activeTab === 'assessments' && 'Assessments & Quizzes'}
              {activeTab === 'questions' && 'Assessment Questions'}
              {activeTab === 'options' && 'Question Options'}
            </h1>
            <p className="page-subtitle">Configure English Learning Content and structures dynamically</p>
          </div>

          {/* Search Box */}
          <div className="header-search">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </header>

        {/* Notifications */}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        {/* Nested Nav Badges / Filters */}
        <div className="filters-row">
          <div className="filter-tags">
            {/* Grade Filter */}
            {activeTab === 'experiences' && (
              <div className="filter-group">
                <span className="filter-label">Grade:</span>
                <select 
                  value={selectedGradeFilter} 
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Grades</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.grade_name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Experience Filter */}
            {(activeTab === 'steps' || activeTab === 'assessments') && (
              <div className="filter-group">
                <span className="filter-label">Experience:</span>
                <select 
                  value={selectedExperienceFilter} 
                  onChange={(e) => setSelectedExperienceFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Experiences</option>
                  {experiences.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Assessment Filter */}
            {activeTab === 'questions' && (
              <div className="filter-group">
                <span className="filter-label">Assessment:</span>
                <select 
                  value={selectedAssessmentFilter} 
                  onChange={(e) => setSelectedAssessmentFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Assessments</option>
                  {assessments.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Question Filter */}
            {activeTab === 'options' && (
              <div className="filter-group">
                <span className="filter-label">Question:</span>
                <select 
                  value={selectedQuestionFilter} 
                  onChange={(e) => setSelectedQuestionFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Questions</option>
                  {questions.map(q => (
                    <option key={q.id} value={q.id}>{q.question_text?.slice(0, 50)}...</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button onClick={handleOpenAdd} className="btn-add">
            <FiPlus />
            <span>Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}</span>
          </button>
        </div>

        {/* Data Container Panel */}
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching resources from the REST server...</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              {/* GRADES TAB */}
              {activeTab === 'grades' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Grade Name</th>
                      <th>Description</th>
                      <th>Direct Navigation</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades
                      .filter(g => g.grade_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(g => (
                        <tr key={g.id}>
                          <td className="bold-text">#{g.sort_order}</td>
                          <td className="highlight-text">{g.grade_name}</td>
                          <td>{g.description || <span className="dim-text">No description</span>}</td>
                          <td>
                            <button 
                              onClick={() => { setSelectedGradeFilter(g.id); setActiveTab('experiences'); }}
                              className="btn-link"
                            >
                              <FiCornerDownRight /> Experiences
                            </button>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(g)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(g.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* EXPERIENCES TAB */}
              {activeTab === 'experiences' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th>Title</th>
                      <th>Duration</th>
                      <th>Difficulty</th>
                      <th>Status</th>
                      <th>Components</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experiences
                      .filter(ex => !selectedGradeFilter || ex.grade?.id === parseInt(selectedGradeFilter) || ex.grade === parseInt(selectedGradeFilter))
                      .filter(ex => ex.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(ex => (
                        <tr key={ex.id}>
                          <td className="badge-cell">
                            <span className="badge-pill grade">
                              {ex.grade_detail?.grade_name || ex.grade_name || `Grade ID: ${ex.grade}`}
                            </span>
                          </td>
                          <td className="bold-text">{ex.title}</td>
                          <td>
                            <span className="duration-tag">
                              <FiClock /> {ex.estimated_duration} mins
                            </span>
                          </td>
                          <td>
                            <span className={`badge-pill difficulty ${ex.difficulty?.toLowerCase()}`}>
                              {ex.difficulty}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-pill status ${ex.status?.toLowerCase()}`}>
                              {ex.status}
                            </span>
                          </td>
                          <td className="navigation-shortcuts">
                            <button 
                              onClick={() => { setSelectedExperienceFilter(ex.id); setActiveTab('steps'); }}
                              className="btn-link"
                            >
                              Steps
                            </button>
                            <span className="divider">|</span>
                            <button 
                              onClick={() => { setSelectedExperienceFilter(ex.id); setActiveTab('assessments'); }}
                              className="btn-link"
                            >
                              Assessments
                            </button>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(ex)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(ex.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* STEPS TAB */}
              {activeTab === 'steps' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Experience</th>
                      <th>Block Type</th>
                      <th>Step Title</th>
                      <th>Content Preview</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps
                      .filter(s => !selectedExperienceFilter || s.experience?.id === parseInt(selectedExperienceFilter) || s.experience === parseInt(selectedExperienceFilter))
                      .filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(s => (
                        <tr key={s.id}>
                          <td className="bold-text">#{s.display_order}</td>
                          <td className="dim-text">{s.experience_detail?.title || `Exp ID: ${s.experience}`}</td>
                          <td>
                            <span className={`badge-pill block-type ${s.block_type?.toLowerCase()}`}>
                              {s.block_type}
                            </span>
                          </td>
                          <td className="highlight-text">{s.title}</td>
                          <td className="content-cell">{s.content || <span className="dim-text">No content</span>}</td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(s)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(s.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ASSESSMENTS TAB */}
              {activeTab === 'assessments' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Experience</th>
                      <th>Title</th>
                      <th>Mastery / Total</th>
                      <th>Manage</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments
                      .filter(a => !selectedExperienceFilter || a.experience?.id === parseInt(selectedExperienceFilter) || a.experience === parseInt(selectedExperienceFilter))
                      .filter(a => a.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(a => (
                        <tr key={a.id}>
                          <td className="bold-text">#{a.display_order}</td>
                          <td className="dim-text">{a.experience_detail?.title || `Exp ID: ${a.experience}`}</td>
                          <td className="highlight-text">{a.title}</td>
                          <td>
                            <span className="marks-badge">
                              {a.mastery} / {a.total_marks} Marks
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => { setSelectedAssessmentFilter(a.id); setActiveTab('questions'); }}
                              className="btn-link"
                            >
                              <FiCornerDownRight /> Questions
                            </button>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(a)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(a.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* QUESTIONS TAB */}
              {activeTab === 'questions' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Assessment</th>
                      <th>Type</th>
                      <th>Question Text</th>
                      <th>Marks</th>
                      <th>Options</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions
                      .filter(q => !selectedAssessmentFilter || q.assessment?.id === parseInt(selectedAssessmentFilter) || q.assessment === parseInt(selectedAssessmentFilter))
                      .filter(q => q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(q => (
                        <tr key={q.id}>
                          <td className="bold-text">#{q.display_order}</td>
                          <td className="dim-text">{q.assessment_detail?.title || `Assess ID: ${q.assessment}`}</td>
                          <td>
                            <span className="badge-pill type">{q.question_type}</span>
                          </td>
                          <td className="highlight-text">{q.question_text}</td>
                          <td className="bold-text">{q.marks}</td>
                          <td>
                            <button 
                              onClick={() => { setSelectedQuestionFilter(q.id); setActiveTab('options'); }}
                              className="btn-link"
                            >
                              <FiCornerDownRight /> Options
                            </button>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(q)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(q.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* OPTIONS TAB */}
              {activeTab === 'options' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Question</th>
                      <th>Option Value</th>
                      <th>Correct Answer?</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionsList
                      .filter(o => !selectedQuestionFilter || o.question?.id === parseInt(selectedQuestionFilter) || o.question === parseInt(selectedQuestionFilter))
                      .filter(o => o.option_text?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(o => (
                        <tr key={o.id}>
                          <td className="bold-text">#{o.display_order}</td>
                          <td className="dim-text question-col">{o.question_detail?.question_text || `Q ID: ${o.question}`}</td>
                          <td className="highlight-text">{o.option_text}</td>
                          <td>
                            {o.is_correct ? (
                              <span className="answer-badge correct"><FiCheckCircle /> Correct</span>
                            ) : (
                              <span className="answer-badge incorrect"><FiXCircle /> Incorrect</span>
                            )}
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEdit(o)} className="action-btn edit" title="Edit"><FiEdit2 /></button>
                            <button onClick={() => handleDelete(o.id)} className="action-btn delete" title="Delete"><FiTrash2 /></button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {/* DYNAMIC FORM MODAL OVERLAY */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h3>{modalType === 'add' ? 'Create' : 'Edit'} {activeTab.slice(0, -1).toUpperCase()}</h3>
              <button onClick={() => setShowModal(false)} className="close-modal-btn"><FiXCircle /></button>
            </header>
            
            <form onSubmit={handleFormSubmit} className="modal-form">
              {/* GRADES FORM FIELDS */}
              {activeTab === 'grades' && (
                <>
                  <div className="form-group">
                    <label>Grade Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={gradeForm.grade_name} 
                      onChange={e => setGradeForm({ ...gradeForm, grade_name: e.target.value })}
                      placeholder="e.g. Grade 1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      value={gradeForm.description} 
                      onChange={e => setGradeForm({ ...gradeForm, description: e.target.value })}
                      placeholder="Enter description of this grade level"
                    />
                  </div>
                  <div className="form-group">
                    <label>Sort Order *</label>
                    <input 
                      type="number" 
                      required 
                      value={gradeForm.sort_order} 
                      onChange={e => setGradeForm({ ...gradeForm, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </>
              )}

              {/* EXPERIENCES FORM FIELDS */}
              {activeTab === 'experiences' && (
                <>
                  <div className="form-group">
                    <label>Grade Level *</label>
                    <select 
                      required 
                      value={experienceForm.grade}
                      onChange={e => setExperienceForm({ ...experienceForm, grade: e.target.value })}
                    >
                      <option value="">Select Grade</option>
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>{g.grade_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input 
                      type="text" 
                      required 
                      value={experienceForm.title} 
                      onChange={e => setExperienceForm({ ...experienceForm, title: e.target.value })}
                      placeholder="e.g. Beginner Vocabulary"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      value={experienceForm.description} 
                      onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })}
                      placeholder="Enter description"
                    />
                  </div>
                  <div className="form-group">
                    <label>Objective</label>
                    <textarea 
                      value={experienceForm.objective} 
                      onChange={e => setExperienceForm({ ...experienceForm, objective: e.target.value })}
                      placeholder="Pedagogical objectives"
                    />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Duration (Minutes) *</label>
                      <input 
                        type="number" 
                        required 
                        value={experienceForm.estimated_duration} 
                        onChange={e => setExperienceForm({ ...experienceForm, estimated_duration: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Difficulty *</label>
                      <select 
                        value={experienceForm.difficulty} 
                        onChange={e => setExperienceForm({ ...experienceForm, difficulty: e.target.value })}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Lifecycle Status *</label>
                    <select 
                      value={experienceForm.status} 
                      onChange={e => setExperienceForm({ ...experienceForm, status: e.target.value })}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="REVIEW">Review</option>
                      <option value="TESTING">Testing</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Thumbnail Cover URL</label>
                    <input 
                      type="url" 
                      value={experienceForm.thumbnail} 
                      onChange={e => setExperienceForm({ ...experienceForm, thumbnail: e.target.value })}
                      placeholder="https://example.com/cover.png"
                    />
                  </div>
                </>
              )}

              {/* STEPS FORM FIELDS */}
              {activeTab === 'steps' && (
                <>
                  <div className="form-group">
                    <label>Learning Experience *</label>
                    <select 
                      required 
                      value={stepForm.experience}
                      onChange={e => setStepForm({ ...stepForm, experience: e.target.value })}
                    >
                      <option value="">Select Experience</option>
                      {experiences.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Block Type *</label>
                      <select 
                        value={stepForm.block_type} 
                        onChange={e => setStepForm({ ...stepForm, block_type: e.target.value })}
                      >
                        <option value="VIDEO">Video</option>
                        <option value="STORY">Story</option>
                        <option value="AUDIO">Audio</option>
                        <option value="VOCABULARY">Vocabulary</option>
                        <option value="GRAMMAR_GAME">Grammar Game</option>
                        <option value="SPEAKING">Speaking</option>
                        <option value="WRITING">Writing</option>
                        <option value="MCQ">MCQ Block</option>
                        <option value="SUMMARY">Summary</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Display Order *</label>
                      <input 
                        type="number" 
                        required 
                        value={stepForm.display_order} 
                        onChange={e => setStepForm({ ...stepForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Step Title *</label>
                    <input 
                      type="text" 
                      required 
                      value={stepForm.title} 
                      onChange={e => setStepForm({ ...stepForm, title: e.target.value })}
                      placeholder="e.g. Introduce vocabulary"
                    />
                  </div>
                  <div className="form-group">
                    <label>Body Content</label>
                    <textarea 
                      value={stepForm.content} 
                      onChange={e => setStepForm({ ...stepForm, content: e.target.value })}
                      placeholder="Enter body content or text story"
                    />
                  </div>
                  <div className="form-group">
                    <label>Media File URL</label>
                    <input 
                      type="url" 
                      value={stepForm.media_url} 
                      onChange={e => setStepForm({ ...stepForm, media_url: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Configuration Settings (JSON) *</label>
                    <textarea 
                      value={stepForm.settings} 
                      onChange={e => setStepForm({ ...stepForm, settings: e.target.value })}
                      placeholder='{ "autoplay": true }'
                      className="monospace-textarea"
                    />
                  </div>
                </>
              )}

              {/* ASSESSMENTS FORM FIELDS */}
              {activeTab === 'assessments' && (
                <>
                  <div className="form-group">
                    <label>Learning Experience *</label>
                    <select 
                      required 
                      value={assessmentForm.experience}
                      onChange={e => setAssessmentForm({ ...assessmentForm, experience: e.target.value })}
                    >
                      <option value="">Select Experience</option>
                      {experiences.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assessment Title *</label>
                    <input 
                      type="text" 
                      required 
                      value={assessmentForm.title} 
                      onChange={e => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                      placeholder="e.g. Vocabulary Quiz 1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Instructions</label>
                    <textarea 
                      value={assessmentForm.instructions} 
                      onChange={e => setAssessmentForm({ ...assessmentForm, instructions: e.target.value })}
                      placeholder="Instructions for taking the test"
                    />
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Mastery Score *</label>
                      <input 
                        type="number" 
                        required 
                        value={assessmentForm.mastery} 
                        onChange={e => setAssessmentForm({ ...assessmentForm, mastery: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Marks *</label>
                      <input 
                        type="number" 
                        required 
                        value={assessmentForm.total_marks} 
                        onChange={e => setAssessmentForm({ ...assessmentForm, total_marks: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Display Order *</label>
                      <input 
                        type="number" 
                        required 
                        value={assessmentForm.display_order} 
                        onChange={e => setAssessmentForm({ ...assessmentForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* QUESTIONS FORM FIELDS */}
              {activeTab === 'questions' && (
                <>
                  <div className="form-group">
                    <label>Assessment *</label>
                    <select 
                      required 
                      value={questionForm.assessment}
                      onChange={e => setQuestionForm({ ...questionForm, assessment: e.target.value })}
                    >
                      <option value="">Select Assessment</option>
                      {assessments.map(a => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Question Type *</label>
                      <select 
                        value={questionForm.question_type} 
                        onChange={e => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                      >
                        <option value="MCQ">Multiple Choice</option>
                        <option value="TRUE_FALSE">True / False</option>
                        <option value="MATCH">Match Columns</option>
                        <option value="FILL_BLANK">Fill in the Blank</option>
                        <option value="SHORT_ANSWER">Short Answer</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Display Order *</label>
                      <input 
                        type="number" 
                        required 
                        value={questionForm.display_order} 
                        onChange={e => setQuestionForm({ ...questionForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Question Prompt / Text *</label>
                    <textarea 
                      required
                      value={questionForm.question_text} 
                      onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                      placeholder="e.g. What is the antonym of 'huge'?"
                    />
                  </div>
                  <div className="form-group">
                    <label>Marks *</label>
                    <input 
                      type="number" 
                      required 
                      value={questionForm.marks} 
                      onChange={e => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </>
              )}

              {/* OPTIONS FORM FIELDS */}
              {activeTab === 'options' && (
                <>
                  <div className="form-group">
                    <label>Question *</label>
                    <select 
                      required 
                      value={optionForm.question}
                      onChange={e => setOptionForm({ ...optionForm, question: e.target.value })}
                    >
                      <option value="">Select Question</option>
                      {questions.map(q => (
                        <option key={q.id} value={q.id}>{q.question_text?.slice(0, 70)}...</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Option Text *</label>
                    <textarea 
                      required
                      value={optionForm.option_text} 
                      onChange={e => setOptionForm({ ...optionForm, option_text: e.target.value })}
                      placeholder="e.g. Tiny"
                    />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group checkbox-form-group">
                      <label className="checkbox-modal-label">
                        <input 
                          type="checkbox" 
                          checked={optionForm.is_correct} 
                          onChange={e => setOptionForm({ ...optionForm, is_correct: e.target.checked })}
                        />
                        <span>Is Correct Answer?</span>
                      </label>
                    </div>
                    <div className="form-group">
                      <label>Display Order *</label>
                      <input 
                        type="number" 
                        required 
                        value={optionForm.display_order} 
                        onChange={e => setOptionForm({ ...optionForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </>
              )}

              <footer className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Entity</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
