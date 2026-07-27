import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiBookOpen, FiClock, FiAward, 
  FiActivity, FiCheckCircle, FiXCircle, FiRefreshCw 
} from 'react-icons/fi';
import { API_BASE_URL } from './config';
import { apiFetch } from './api';

export default function ReportsAnalytics() {
  const [activeTab, setActiveTab] = useState('progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [progressData, setProgressData] = useState([]);
  const [quizData, setQuizData] = useState([]);
  const [activityData, setActivityData] = useState([]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/v1/lms/sync/analytics/');
      if (res.ok) {
        const data = await res.json();
        setProgressData(data.progress || []);
        setQuizData(data.quizzes || []);
        setActivityData(data.activities || []);
      } else {
        setError('Failed to fetch telemetry analytics from server.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error – make sure the Django server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatDuration = (sec) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // Filter lists based on search query
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase().trim();
    if (activeTab === 'progress') {
      return progressData.filter(p => 
        (p.student_name || '').toLowerCase().includes(query) ||
        (p.roll_no || '').toLowerCase().includes(query) ||
        (p.scenario_id || '').toLowerCase().includes(query) ||
        (p.school_name || '').toLowerCase().includes(query)
      );
    } else if (activeTab === 'quiz') {
      return quizData.filter(q => 
        (q.student_name || '').toLowerCase().includes(query) ||
        (q.roll_no || '').toLowerCase().includes(query) ||
        (q.scenario_id || '').toLowerCase().includes(query) ||
        (q.screen_id || '').toLowerCase().includes(query)
      );
    } else {
      return activityData.filter(a => 
        (a.student_name || '').toLowerCase().includes(query) ||
        (a.roll_no || '').toLowerCase().includes(query) ||
        (a.scenario_id || '').toLowerCase().includes(query) ||
        (a.activity_id || '').toLowerCase().includes(query)
      );
    }
  };

  const filtered = getFilteredData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', height: '100%', overflowY: 'auto', paddingRight: '0.25rem' }}>
      
      {/* Title & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Sync & Ingestion Reports</h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Telemetry logs ingested from offline Electron LMS instances.
          </p>
        </div>
        <button 
          onClick={loadAnalytics} 
          disabled={loading}
          className="sd-btn-outline" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fff' }}
        >
          <FiRefreshCw className={loading ? 'spin-anim' : ''} /> Refresh Logs
        </button>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="sd-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiActivity style={{ fontSize: '1.5rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Active Scenarios</div>
            <strong style={{ fontSize: '1.35rem', color: '#0f172a' }}>{progressData.length}</strong>
          </div>
        </div>

        <div className="sd-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiAward style={{ fontSize: '1.5rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Quiz Responses</div>
            <strong style={{ fontSize: '1.35rem', color: '#0f172a' }}>{quizData.length}</strong>
          </div>
        </div>

        <div className="sd-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#d1fae5', color: '#059669', padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiClock style={{ fontSize: '1.5rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Time Synced Logs</div>
            <strong style={{ fontSize: '1.35rem', color: '#0f172a' }}>{activityData.length}</strong>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="sd-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          
          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { key: 'progress', label: 'Student Progress', count: progressData.length },
              { key: 'quiz', label: 'Quiz Attempts', count: quizData.length },
              { key: 'activity', label: 'Activity Logs', count: activityData.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.key ? '#4f46e5' : '#f1f5f9',
                  color: activeTab === tab.key ? '#fff' : '#475569',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label} <span style={{ marginLeft: '4px', opacity: 0.7, fontSize: '0.78rem' }}>({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="sd-table-search" style={{ margin: 0, minWidth: '260px' }}>
            <FiSearch />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Telemetry Tables */}
        {error && (
          <div className="sd-alert sd-alert-error">{error}</div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: '#64748b' }}>
            <FiRefreshCw className="spin-anim" style={{ fontSize: '1.8rem', marginRight: '8px' }} /> Loading synced logs...
          </div>
        ) : (
          <div className="sd-table-wrap">
            <table className="sd-table" style={{ width: '100%' }}>
              
              {/* PROGRESS TAB */}
              {activeTab === 'progress' && (
                <>
                  <thead>
                    <tr>
                      <th>Student Roll / Name</th>
                      <th>School</th>
                      <th>Experience / Scenario</th>
                      <th>Completion</th>
                      <th>Total Duration</th>
                      <th>Last Sync Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.student_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>Roll: {p.roll_no}</div>
                        </td>
                        <td>{p.school_name}</td>
                        <td style={{ fontWeight: 600, color: '#4f46e5' }}>Scenario {p.scenario_id}</td>
                        <td>
                          <span className={`sd-badge ${p.completed ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                            {p.completed ? 'Completed' : 'In Progress'}
                          </span>
                        </td>
                        <td>{formatDuration(p.total_time_spent)}</td>
                        <td>{new Date(p.last_accessed).toLocaleString()}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan="6" className="sd-empty-state">No progress telemetry found.</td></tr>
                    )}
                  </tbody>
                </>
              )}

              {/* QUIZ TAB */}
              {activeTab === 'quiz' && (
                <>
                  <thead>
                    <tr>
                      <th>Student Roll / Name</th>
                      <th>Scenario / Activity</th>
                      <th>Screen ID</th>
                      <th>Quiz Score</th>
                      <th>Submitted Answers</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(q => (
                      <tr key={q.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{q.student_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>Roll: {q.roll_no}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>Scenario: {q.scenario_id}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Act: {q.activity_id}</div>
                        </td>
                        <td>{q.screen_id}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: q.score === q.max_score ? '#10b981' : '#f59e0b' }}>
                            {q.score} / {q.max_score}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', maxWidth: '220px', overflowX: 'auto', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            {JSON.stringify(q.answers)}
                          </div>
                        </td>
                        <td>{new Date(q.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan="6" className="sd-empty-state">No quiz telemetry records found.</td></tr>
                    )}
                  </tbody>
                </>
              )}

              {/* ACTIVITY LOGS TAB */}
              {activeTab === 'activity' && (
                <>
                  <thead>
                    <tr>
                      <th>Student Roll / Name</th>
                      <th>Scenario / Activity</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{a.student_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>Roll: {a.roll_no}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>Scenario: {a.scenario_id}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Activity: {a.activity_id}</div>
                        </td>
                        <td>{formatDuration(a.time_spent_seconds)}</td>
                        <td>
                          <span className={`sd-badge ${a.completed ? 'sd-badge-active' : 'sd-badge-inactive'}`}>
                            {a.completed ? 'Completed' : 'Visited'}
                          </span>
                        </td>
                        <td>{new Date(a.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan="5" className="sd-empty-state">No activity log telemetry found.</td></tr>
                    )}
                  </tbody>
                </>
              )}

            </table>
          </div>
        )}
      </div>
    </div>
  );
}
