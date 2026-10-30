import React, { useCallback, useEffect, useState } from 'react';
import { FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import { apiFetch } from './api';

// Teacher portal "Reports": results of the students of the grade(s) the teacher teaches.
// The CMS decides the students from the login (the teacher's own classes), never from the browser.

const card = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem' };
const muted = { color: '#64748b', fontSize: '0.8rem' };

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
const percent = (value) => (value === null || value === undefined ? '—' : `${value}%`);

const Stat = ({ label, value }) => (
  <div style={{ ...card, padding: '0.9rem 1.1rem' }}>
    <div style={muted}>{label}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
  </div>
);

const TeacherReportsPanel = () => {
  const [data, setData] = useState(null);
  const [gradeId, setGradeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [classesReport, setClassesReport] = useState([]);
  const [studentsReport, setStudentsReport] = useState([]);
  const [completionReport, setCompletionReport] = useState([]);

  // The same report endpoints the School Admin uses; for a teacher the CMS limits them to the teacher's own classes.
  const loadAnalysis = useCallback(async () => {
    const get = async (path, set) => {
      try {
        const res = await apiFetch(path);
        const body = await res.json().catch(() => []);
        set(res.ok ? (body.results || body) : []);
      } catch (e) {
        set([]);
      }
    };
    await Promise.all([
      get('/api/v1/reports/classes/', setClassesReport),
      get('/api/v1/reports/students/', setStudentsReport),
      get('/api/v1/reports/student-completion/', setCompletionReport),
    ]);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    loadAnalysis();
    try {
      const res = await apiFetch(`/api/cms/v1/teacher/reports/${gradeId ? `?grade_id=${gradeId}` : ''}`);
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setData(body);
        setError('');
      } else {
        setData(null);
        setError(body.error || 'Could not load the reports.');
      }
    } catch (e) {
      setError('Could not reach the CMS.');
    } finally {
      setLoading(false);
    }
  }, [gradeId, loadAnalysis]);

  useEffect(() => { load(); }, [load]);

  const noGrade = data && data.grades.length === 0;

  return (
    <>
      <div className="sd-page-header" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="sd-page-title">Student Performance Reports</h1>
          <p className="sd-page-sub">
            {data && data.grades.length > 0
              ? `Students of ${data.grades.map(g => g.name).join(', ')} only.`
              : 'Monitor evaluation metrics and student progression.'}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {data && data.grades.length > 1 && (
            <select className="sd-form-input" value={gradeId} onChange={e => setGradeId(e.target.value)} style={{ height: '36px' }}>
              <option value="">All my grades</option>
              {data.grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <button type="button" className="sd-btn-outline" onClick={load} disabled={loading} style={{ padding: '6px 12px' }}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {error && <div style={{ ...card, color: '#b91c1c', borderColor: '#fecaca', background: '#fef2f2' }}>{error}</div>}

      {noGrade && (
        <div className="sd-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <FiBarChart2 style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>No Class Assigned</h3>
          <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto' }}>
            Reports show the students of your grade. Ask your school admin to assign a class to you.
          </p>
        </div>
      )}

      {data && !noGrade && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <Stat label="Students" value={data.summary.students} />
            <Stat label="Attempts" value={data.summary.attempts} />
            <Stat label="Average score" value={percent(data.summary.averagePercent)} />
            <Stat label="Lessons completed" value={data.summary.completedLessons} />
          </div>

          <div className="sd-card" style={{ padding: '1rem 1.25rem' }}>
            {data.students.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                <FiBarChart2 style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>No Reports Available</h3>
                <p style={{ ...muted, maxWidth: '450px', margin: '0 auto' }}>
                  There are no active students in your grade yet.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Student</th><th>Class</th><th>Lessons completed</th><th>Attempts</th>
                      <th>Average score</th><th>Stars</th><th>Last activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}<div style={muted}>{s.loginCode}</div></td>
                        <td>{[s.grade, s.section].filter(Boolean).join(' · ') || '—'}</td>
                        <td>{s.completedLessons}</td>
                        <td>{s.attempts}</td>
                        <td>{percent(s.averagePercent)}</td>
                        <td>{s.stars}</td>
                        <td>{fmt(s.lastActivity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.summary.attempts === 0 && (
                  <p style={{ ...muted, marginTop: '0.75rem' }}>No results yet: they appear here once students finish lessons in the LMS.</p>
                )}
              </div>
            )}
          </div>

          <div className="sd-card" style={{ padding: '1rem 1.25rem', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Class Performance Analysis</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Class Name</th><th>Students</th><th>Completed</th>
                    <th>Avg Score</th><th>Pass Rate</th><th>Top Student</th><th>Weakest</th>
                  </tr>
                </thead>
                <tbody>
                  {classesReport.length === 0 && <tr><td colSpan={7} style={muted}>No class results yet.</td></tr>}
                  {classesReport.map((c, i) => (
                    <tr key={i}>
                      <td>{c.class_name}</td>
                      <td>{c.total_students}</td>
                      <td>{c.completed}</td>
                      <td>{percent(c.average_score)}</td>
                      <td>{percent(c.pass_rate)}</td>
                      <td>{c.top_student}</td>
                      <td>{c.weakest_student}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sd-card" style={{ padding: '1rem 1.25rem', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Student Performance Analysis</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Class</th><th>Attempts</th><th>Completed</th>
                    <th>Avg Score</th><th>Best Lesson</th><th>Worst Lesson</th><th>Last Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsReport.length === 0 && <tr><td colSpan={8} style={muted}>No student results yet.</td></tr>}
                  {studentsReport.map((st, i) => (
                    <tr key={i}>
                      <td>{st.student_name}</td>
                      <td>{st.class_name}</td>
                      <td>{st.total_attempts}</td>
                      <td>{st.completed}</td>
                      <td>{percent(st.average_score)}</td>
                      <td>{st.best_experience}</td>
                      <td>{st.worst_experience}</td>
                      <td>{st.last_attempt_date ? new Date(st.last_attempt_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sd-card" style={{ padding: '1rem 1.25rem', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Student Lesson Completion</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="sd-table">
                <thead>
                  <tr><th>Student Profile</th><th>Assigned Lessons</th><th>Completed</th><th>Completion Progress</th></tr>
                </thead>
                <tbody>
                  {completionReport.length === 0 && <tr><td colSpan={4} style={muted}>No lesson assignments yet.</td></tr>}
                  {completionReport.map((row) => {
                    const pct = row.total_assigned_experiences > 0
                      ? Math.round((row.completed_experiences_count / row.total_assigned_experiences) * 100) : 0;
                    return (
                      <tr key={row.student_id}>
                        <td>{row.student_name}</td>
                        <td>{row.total_assigned_experiences}</td>
                        <td>{row.completed_experiences_count}</td>
                        <td>{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TeacherReportsPanel;
