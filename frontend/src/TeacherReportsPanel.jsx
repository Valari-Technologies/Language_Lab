import React, { useEffect, useState } from 'react';
import { FiBarChart2, FiClock, FiDownload, FiEye, FiMoreVertical, FiX } from 'react-icons/fi';
import { apiFetch } from './api';
import { formatRollNo, pageItems, titleName } from './format';
import { savePdf } from './pdf';
import StudentReportPage from './StudentReportPage';
import StudentStatusList from './StudentStatusList';

// Teacher portal "Reports": results of the students of the grade(s) the teacher teaches.
// The CMS decides the students from the login (the teacher's own classes), never from the browser.

const card = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem' };
const muted = { color: '#64748b', fontSize: '0.8rem' };

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
const percent = (value) => (value === null || value === undefined ? '—' : `${value}%`);

const iconBtn = { padding: '6px 9px', display: 'inline-flex', alignItems: 'center' };
const menuItem = { display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 };
const classLabel = (s) => [s.grade, s.section].filter(Boolean).join(' · ') || '—';

const reportRows = (s) => [
  ['Overall progress', s.progress === null ? 'No levels published' : `${s.progress}%`],
  ['Zones completed', `${s.zonesCompleted}/${s.zonesTotal}`],
  ['Levels completed', `${s.levelsCompleted}/${s.levelsTotal}`],
  ['Avg assessment score', s.avgAssessment === null ? 'Not assessed' : percent(s.avgAssessment)],
  ['Attempts', s.attempts],
  ['Last active', fmt(s.lastActive)],
];

// The student's PDF: details, performance, then every lesson and assessment attempt with when it started and ended
const downloadReport = async (s) => {
  let attempts = [];
  try {
    const res = await apiFetch(`/api/cms/v1/teacher/reports/students/${s.id}/report/`);
    if (res.ok) attempts = (await res.json()).attempts || [];
  } catch (e) {
    // without the attempts the PDF still has the details and the performance
  }
  const status = (a) => String(a.status || '').replace('_', ' ');
  const lessons = attempts.filter(a => a.kind === 'lesson');
  const assessments = attempts.filter(a => a.kind === 'assessment');
  await savePdf({
    file: `report_${s.loginCode || s.id}.pdf`,
    title: 'Student Report',
    subtitle: `${s.name} · ${classLabel(s)}`,
    tables: [
      { head: ['Student', 'Login code', 'Roll No', 'Class'], body: [[s.name, s.loginCode, s.rollNo, classLabel(s)]] },
      { heading: 'Performance', head: reportRows(s).map(([label]) => label), body: [reportRows(s).map(([, value]) => value)] },
      {
        heading: 'Lessons',
        head: ['Lesson', 'Status', 'Started At', 'Ended At'],
        body: lessons.length ? lessons.map(a => [a.title, status(a), fmt(a.startedAt), fmt(a.completedAt)]) : [['No lessons played yet', '', '', '']],
      },
      {
        heading: 'Assessments',
        head: ['Assessment', 'Marks', 'Score', 'Status', 'Started At', 'Ended At'],
        body: assessments.length ? assessments.map(a => [
          a.title, a.score !== null && a.maxScore !== null ? `${a.score} / ${a.maxScore}` : 'N/A', a.percentage !== null ? `${a.percentage}%` : 'N/A',
          status(a), fmt(a.startedAt), fmt(a.completedAt),
        ]) : [['No assessments taken yet', '', '', '', '', '']],
      },
    ],
  });
};

// A number card; with onClick it is a button that opens the list behind the number
const Stat = ({ label, value, onClick }) => {
  const body = (
    <>
      <div style={muted}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
      {onClick && <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#2563eb' }}>View students ›</div>}
    </>
  );
  if (!onClick) return <div style={{ ...card, padding: '0.9rem 1.1rem' }}>{body}</div>;
  return (
    <button type="button" onClick={onClick} aria-label={`${label}: ${value}. View the list`}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(37,99,235,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
      style={{ ...card, padding: '0.9rem 1.1rem', textAlign: 'left', cursor: 'pointer', font: 'inherit', width: '100%', transition: 'border-color 0.15s, box-shadow 0.15s' }}>
      {body}
    </button>
  );
};

const hms = (seconds) => {
  const s = Math.max(Math.round(seconds || 0), 0);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
};
// Marks as the LMS issued them: score out of the maximum, else the percentage.
const marks = (a) => (a.score !== null && a.maxScore !== null ? `${a.score} / ${a.maxScore}` : (a.percentage !== null ? `${a.percentage}%` : '—'));
const clock = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—');
const dateValue = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const tabBtn = (active) => ({ padding: '6px 14px', borderRadius: '999px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
  background: active ? '#2563eb' : '#ffffff', color: active ? '#ffffff' : '#334155' });

// One student's day: Today, Yesterday or a picked date. The day is the browser's local midnight to midnight.
const StudentDayReport = ({ student, onClose }) => {
  const [tab, setTab] = useState('today');
  const [picked, setPicked] = useState(dateValue(new Date()));
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const day = (() => {
    const d = new Date();
    if (tab === 'yesterday') d.setDate(d.getDate() - 1);
    if (tab === 'date') {
      const [y, m, dd] = picked.split('-').map(Number);
      return new Date(y, (m || 1) - 1, dd || 1);
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  })();
  const dayKey = dateValue(day);

  useEffect(() => {
    let cancelled = false;
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    setReport(null);
    setError('');
    (async () => {
      try {
        const res = await apiFetch(`/api/cms/v1/teacher/reports/students/${student.id}/day/?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) setReport(body); else setError(body.error || 'Could not load this day.');
      } catch (e) {
        if (!cancelled) setError('Could not reach the CMS.');
      }
    })();
    return () => { cancelled = true; };
  }, [student.id, dayKey]);

  const cards = report ? [
    ['Total completed lessons', report.completedLessons],
    ['Time taken for completed lessons', hms(report.lessonSeconds)],
    ['Time for login', clock(report.loginAt)],
    ['Time for logout', report.stillOnline ? 'Still online' : clock(report.logoutAt)],
    ['Remaining lessons', report.totalLessons ? `${report.remainingLessons} of ${report.totalLessons}` : '—'],
    ['Completed assessments', report.assessments.length],
  ] : [];

  const download = () => savePdf({
    file: `report_${student.loginCode || student.id}_${dayKey}.pdf`,
    title: 'Student Day Report',
    subtitle: `${student.name} · Roll No ${student.rollNo || '—'} · Class ${classLabel(student)} · ${dayKey}`,
    tables: [
      { head: ['Item', 'Value'], body: [...cards, ['Time online', hms(report.onlineSeconds)]] },
      ...(report.assessments.length > 0 ? [{
        heading: 'Assessment marks',
        head: ['Assessment', 'Marks', 'Percentage'],
        body: report.assessments.map(a => [a.title, marks(a), a.percentage === null ? '' : `${a.percentage}%`]),
      }] : []),
      ...(report.remainingTitles.length > 0 ? [{
        heading: 'Remaining lessons',
        head: ['Lesson'],
        body: report.remainingTitles.map(t => [t]),
      }] : []),
    ],
  });

  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ ...card, width: '100%', maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{student.name}</h3>
            <div style={muted}>{student.loginCode} · Roll No {student.rollNo || '—'} · {classLabel(student)}</div>
          </div>
          <button type="button" className="sd-btn-outline" onClick={onClose} aria-label="Close" style={{ ...iconBtn, marginLeft: 'auto' }}><FiX /></button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <button type="button" style={tabBtn(tab === 'today')} onClick={() => setTab('today')}>Today</button>
          <button type="button" style={tabBtn(tab === 'yesterday')} onClick={() => setTab('yesterday')}>Yesterday</button>
          <input type="date" className="sd-form-input" value={picked} max={dateValue(new Date())} aria-label="Pick a date"
            onChange={e => { if (e.target.value) { setPicked(e.target.value); setTab('date'); } }}
            style={{ height: '34px', width: 'auto', padding: '0 0.7rem', ...(tab === 'date' ? { borderColor: '#2563eb' } : {}) }} />
        </div>
        <div style={{ ...muted, marginBottom: '0.75rem' }}>{day.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>

        {error && <div style={{ color: '#b91c1c', fontSize: '0.9rem' }}>{error}</div>}
        {!report && !error && <div style={muted}>Loading…</div>}
        {report && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {cards.map(([label, value]) => (
                <div key={label} style={{ ...card, padding: '0.7rem 0.9rem' }}>
                  <div style={muted}>{label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{value}</div>
                </div>
              ))}
            </div>
            {report.assessments.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ ...muted, fontWeight: 700, marginBottom: '0.3rem' }}>Assessment marks</div>
                <table className="sd-table">
                  <thead><tr><th>Assessment</th><th>Marks</th><th>Percentage</th></tr></thead>
                  <tbody>
                    {report.assessments.map((a, i) => (
                      <tr key={i}><td>{a.title}</td><td>{marks(a)}</td><td>{percent(a.percentage)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {report.remainingTitles.length > 0 && (
              <p style={{ ...muted, marginTop: '0.75rem' }}>
                Remaining: {report.remainingTitles.slice(0, 8).join(', ')}{report.remainingTitles.length > 8 ? ` and ${report.remainingTitles.length - 8} more` : ''}.
              </p>
            )}
            <p style={{ ...muted, marginTop: '0.75rem' }}>
              {report.sessions === 0
                ? 'Not online on this day.'
                : `Time online: ${hms(report.onlineSeconds)} · ${report.sessions} login${report.sessions === 1 ? '' : 's'} (first login, last logout shown).`}
            </p>
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <button type="button" className="sd-btn-outline" onClick={download}><FiDownload /> Download</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// A card with the first three students of a level; clicking it opens the list of all students of that level
const PerformanceList = ({ title, accent, students, empty, onOpen }) => (
  <div role="button" tabIndex={0} aria-label={`${title}: open the full list`}
    onClick={onOpen} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    style={{ ...card, padding: '1rem 1.25rem', borderTop: `4px solid ${accent}`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.6rem' }}>
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{title}</span>
      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 600, color: '#2563eb' }}>View all ›</span>
    </div>
    {students.length === 0 ? (
      <div style={muted}>{empty}</div>
    ) : (
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {students.map((s, i) => (
          <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: accent, color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
              <div style={muted}>{classLabel(s)} · {s.levelsCompleted} {s.levelsCompleted === 1 ? 'level' : 'levels'} completed</div>
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: accent }}>{percent(s.avgAssessment)}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

// Performance label colours: academic performance is shown apart from inactive (activity) status
const PERFORMANCE = {
  excellent: { label: 'Excellent', bg: '#dcfce7', color: '#15803d' },
  good: { label: 'Good', bg: '#dbeafe', color: '#1d4ed8' },
  average: { label: 'Average', bg: '#fef3c7', color: '#b45309' },
  needs_improvement: { label: 'Needs Improvement', bg: '#fee2e2', color: '#b91c1c' },
  not_assessed: { label: 'Not assessed', bg: '#f1f5f9', color: '#64748b' },
};
const badge = (bg, color) => ({ display: 'inline-block', padding: '2px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: bg, color, whiteSpace: 'nowrap' });
const studyTime = (seconds) => {
  if (!seconds) return '—';
  const m = Math.round(seconds / 60);
  return m < 60 ? `${Math.max(m, 1)}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};
const filterInput = { height: '36px', width: 'auto', padding: '0 0.7rem', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff' };
const NO_FILTERS = { classId: '', zone: '', performance: '', progress: '', activity: '', dateFrom: '', dateTo: '' };

// Sortable column heading: a click sorts by it, a second click reverses the order
const SortHead = ({ label, field, sort, order, onSort }) => (
  <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => onSort(field)} aria-sort={sort === field ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
    {label}{sort === field ? (order === 'asc' ? ' ▲' : ' ▼') : ''}
  </th>
);

const TeacherReportsPanel = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [menu, setMenu] = useState(null);
  const [reportOf, setReportOf] = useState(null); // { student, tab }: the student report page is open
  const [statusList, setStatusList] = useState(null); // 'active' | 'inactive' | 'needs_improvement': the list behind that card is open

  const [downloading, setDownloading] = useState(false);

  // the search and filters as the server wants them (the list adds its page, the PDF download takes every page)
  const filterParams = () => {
    const params = new URLSearchParams({ sort, order });
    if (search) params.set('search', search);
    if (filters.classId) params.set('class_id', filters.classId);
    if (filters.zone) params.set('zone', filters.zone);
    if (filters.performance) params.set('performance', filters.performance);
    if (filters.progress) params.set('progress', filters.progress);
    if (filters.activity) params.set('activity', filters.activity);
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);
    return params;
  };

  // Download all: a PDF with every student that matches the search and filters (all pages), one row each
  const downloadAll = async () => {
    setDownloading(true);
    try {
      const params = filterParams();
      params.set('all', '1');
      const res = await apiFetch(`/api/cms/v1/teacher/reports/class/?${params}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Could not download the class report.');
        return;
      }
      const chosen = data && data.classes.find(c => String(c.id) === String(filters.classId));
      const students = body.students.map(s => ({ ...s, name: titleName(s.name) || s.name, rollNo: formatRollNo(s.rollNo) }));
      await savePdf({
        file: `class_report${chosen ? `_${chosen.name.replace(/[^A-Za-z0-9-]+/g, '-')}` : ''}_${new Date().toISOString().slice(0, 10)}.pdf`,
        title: 'Class Report',
        subtitle: `${chosen ? chosen.name : 'All my classes'} · ${students.length} ${students.length === 1 ? 'student' : 'students'} · ${new Date().toLocaleDateString()}`,
        landscape: true,
        tables: [{
          head: ['Student', 'Roll No', 'Class', 'Overall Progress', 'Avg Assessment', 'Attempts', 'Learning Time', 'Last Active', 'Status'],
          body: students.map(s => [
            `${s.name} (${s.loginCode})`, s.rollNo || '—', classLabel(s),
            s.progress === null ? '—' : `${s.progress}% (Zones ${s.zonesCompleted}/${s.zonesTotal}, Levels ${s.levelsCompleted}/${s.levelsTotal})`,
            s.avgAssessment === null ? 'Not assessed' : `${s.avgAssessment}%`, s.attempts, studyTime(s.learningSeconds), fmt(s.lastActive),
            `${PERFORMANCE[s.performance].label}${s.activity === 'inactive' ? ', Inactive' : ''}`,
          ]),
        }],
      });
    } catch (e) {
      setError('Could not reach the CMS.');
    } finally {
      setDownloading(false);
    }
  };

  // the search waits a moment after typing before it asks the server
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const params = filterParams();
    params.set('page', String(page));
    (async () => {
      try {
        const res = await apiFetch(`/api/cms/v1/teacher/reports/class/?${params}`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) {
          // Names and roll numbers are formatted once here, so the table, the day report and the PDFs show them alike.
          const tidy = (s) => ({ ...s, name: titleName(s.name) || s.name, rollNo: formatRollNo(s.rollNo) });
          setData({ ...body, students: body.students.map(tidy), ranking: { best: body.ranking.best.map(tidy), least: body.ranking.least.map(tidy) } });
          setError('');
          if (body.page !== page) setPage(body.page);
        } else {
          setError(body.error || 'Could not load the reports.');
        }
      } catch (e) {
        if (!cancelled) setError('Could not reach the CMS.');
      }
    })();
    return () => { cancelled = true; };
  }, [page, search, sort, order, filters]);

  const setFilter = (name, value) => { setFilters(prev => ({ ...prev, [name]: value })); setPage(1); };
  const clearFilters = () => { setFilters(NO_FILTERS); setSearchInput(''); setSearch(''); setPage(1); };
  const sortBy = (field) => {
    if (sort === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setOrder(field === 'name' ? 'asc' : 'desc'); }
    setPage(1);
  };
  const filtered = Object.values(filters).some(Boolean) || search !== '';

  const noClass = data && data.classes.length === 0;
  const overview = data ? data.overview : null;
  const from = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  // the active or inactive students list is a page of its own, with the filters that were chosen
  if (statusList) {
    return <StudentStatusList status={statusList} filterQuery={filterParams().toString()} onBack={() => setStatusList(null)} />;
  }

  // the student report is a page of its own; the list keeps its search, filters and page behind it
  if (reportOf) {
    return (
      <>
        <StudentReportPage key={`${reportOf.student.id}-${reportOf.tab}`} student={reportOf.student} initialTab={reportOf.tab}
          onBack={() => setReportOf(null)} onOpenDayReport={(s) => setViewing(s)} />
        {viewing && <StudentDayReport student={viewing} onClose={() => setViewing(null)} />}
      </>
    );
  }

  return (
    <>
      <div className="sd-page-header" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="sd-page-title">Student Performance Reports</h1>
          <p className="sd-page-sub">
            {data && data.classes.length > 0
              ? `Students of ${data.classes.map(c => c.name).join(', ')} only.`
              : 'Monitor evaluation metrics and student progression.'}
          </p>
        </div>
      </div>

      {error && <div style={{ ...card, color: '#b91c1c', borderColor: '#fecaca', background: '#fef2f2', marginBottom: '1rem' }}>{error}</div>}

      {noClass && (
        <div className="sd-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <FiBarChart2 style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>No Class Assigned</h3>
          <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto' }}>
            Reports show the students of your class. Ask your school admin to assign a class to you.
          </p>
        </div>
      )}

      {data && !noClass && (
        <>
          {/* Class overview: follows the filters, not the search */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <Stat label="Total students" value={overview.totalStudents} />
            <Stat label="Active students" value={overview.activeStudents} onClick={() => setStatusList('active')} />
            <Stat label="Inactive students" value={overview.inactiveStudents} onClick={() => setStatusList('inactive')} />
            <Stat label="Class avg assessment score" value={percent(overview.avgAssessment)} />
            <Stat label="Overall class progress" value={percent(overview.avgProgress)} />
            <Stat label="Need improvement" value={overview.needsImprovement} onClick={() => setStatusList('needs_improvement')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <PerformanceList title="Best performing students" accent="#16a34a" students={data.ranking.best}
              empty="No student is at Excellent or Good yet." onOpen={() => setStatusList('best')} />
            <PerformanceList title="Least performing students" accent="#dc2626" students={data.ranking.least}
              empty="No student is at Average or Needs Improvement." onOpen={() => setStatusList('least')} />
          </div>

          <div className="sd-card" style={{ padding: '1rem 1.25rem' }}>
            {/* Search and filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
              <input type="search" className="sd-form-input" placeholder="Search by name or roll number" aria-label="Search students"
                value={searchInput} onChange={e => setSearchInput(e.target.value)} style={{ ...filterInput, width: '240px' }} />
              {data.classes.length > 1 && (
                <select className="sd-form-input" aria-label="Class" value={filters.classId} onChange={e => setFilter('classId', e.target.value)} style={filterInput}>
                  <option value="">All my classes</option>
                  {data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <select className="sd-form-input" aria-label="Performance" value={filters.performance} onChange={e => setFilter('performance', e.target.value)} style={filterInput}>
                <option value="">All performance</option>
                {Object.entries(PERFORMANCE).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
              </select>
              <select className="sd-form-input" aria-label="Progress" value={filters.progress} onChange={e => setFilter('progress', e.target.value)} style={filterInput}>
                <option value="">All progress</option>
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">All levels completed</option>
              </select>
              {filtered && <button type="button" className="sd-btn-outline" onClick={clearFilters} style={{ height: '36px' }}>Clear filters</button>}
              <button type="button" className="sd-btn-outline" onClick={downloadAll} disabled={downloading || data.total === 0}
                title="Download every student that matches the search and filters as a PDF"
                style={{ height: '36px', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <FiDownload /> {downloading ? 'Preparing…' : 'Download all (PDF)'}
              </button>
            </div>
            <p style={{ ...muted, margin: '0 0 0.75rem' }}>
              Performance uses the average assessment score: Excellent {data.thresholds.excellent}% and over, Good {data.thresholds.good}%,
              Average {data.thresholds.average}%, Needs Improvement below that. Inactive means no activity for {data.inactiveAfterDays} days.
            </p>

            {data.total === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                <FiBarChart2 style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>
                  {filtered ? 'No students match these filters' : 'No Reports Available'}
                </h3>
                <p style={{ ...muted, maxWidth: '450px', margin: '0 auto' }}>
                  {filtered ? 'Change or clear the search and filters to see students.' : 'There are no active students in your class yet.'}
                </p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <SortHead label="Student" field="name" sort={sort} order={order} onSort={sortBy} />
                        <th>Roll No</th><th>Class</th>
                        <SortHead label="Overall Progress" field="progress" sort={sort} order={order} onSort={sortBy} />
                        <SortHead label="Avg Assessment" field="score" sort={sort} order={order} onSort={sortBy} />
                        <th>Attempts</th><th>Learning Time</th>
                        <SortHead label="Last Active" field="last_active" sort={sort} order={order} onSort={sortBy} />
                        <th>Status</th>
                        <th style={{ width: '70px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.students.map(s => {
                        const perf = PERFORMANCE[s.performance];
                        return (
                          <tr key={s.id}>
                            <td>{s.name}<div style={muted}>{s.loginCode}</div></td>
                            <td>{s.rollNo || '—'}</td>
                            <td>{classLabel(s)}</td>
                            <td style={{ minWidth: '170px' }}>
                              {s.progress === null ? <span style={muted}>No levels published</span> : (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                      <div style={{ width: `${s.progress}%`, height: '100%', background: '#2563eb' }} />
                                    </div>
                                    <strong style={{ fontSize: '0.8rem' }}>{s.progress}%</strong>
                                  </div>
                                  <div style={muted}>Zones {s.zonesCompleted}/{s.zonesTotal} · Levels {s.levelsCompleted}/{s.levelsTotal}</div>
                                </>
                              )}
                            </td>
                            <td>{s.avgAssessment === null ? <span style={muted}>Not assessed</span> : `${s.avgAssessment}%`}</td>
                            <td>{s.attempts}</td>
                            <td>{studyTime(s.learningSeconds)}</td>
                            <td>{fmt(s.lastActive)}</td>
                            <td>
                              <span style={badge(perf.bg, perf.color)}>{perf.label}</span>
                              {s.activity === 'inactive' && <span style={{ ...badge('#f1f5f9', '#475569'), marginLeft: '0.3rem' }}>Inactive</span>}
                            </td>
                            <td style={{ width: '70px', textAlign: 'center' }}>
                              <button type="button" title="Actions" aria-label={`Actions for ${s.name}`}
                                onClick={(e) => {
                                  const box = e.currentTarget.getBoundingClientRect();
                                  setMenu(menu && menu.student.id === s.id ? null : { student: s, top: box.bottom + 4, right: window.innerWidth - box.right });
                                }}
                                style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', borderRadius: '4px', color: '#64748b', display: 'inline-flex' }}>
                                <FiMoreVertical style={{ fontSize: '1.1rem' }} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="sd-pagination-bar" style={{ marginTop: '1rem' }}>
                  <span className="sd-pagination-info">Showing {from} to {to} of {data.total} {data.total === 1 ? 'student' : 'students'}</span>
                  {data.pages > 1 && (
                    <div className="sd-pagination-pages">
                      <button type="button" className="sd-page-btn arrow" disabled={data.page === 1} onClick={() => setPage(data.page - 1)} aria-label="Previous page">‹</button>
                      {pageItems(data.page, data.pages).map(n => (
                        <button type="button" key={`page-${n}`} className={`sd-page-btn${data.page === n ? ' active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                      ))}
                      <button type="button" className="sd-page-btn arrow" disabled={data.page === data.pages} onClick={() => setPage(data.page + 1)} aria-label="Next page">›</button>
                    </div>
                  )}
                </div>
                {overview.totalStudents > 0 && data.students.every(s => s.attempts === 0) && data.page === 1 && (
                  <p style={{ ...muted, marginTop: '0.75rem' }}>No results yet: they appear here once students finish lessons in the LMS.</p>
                )}
              </>
            )}
          </div>
        </>
      )}

      {menu && (
        <>
          <div onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 900 }} />
          <div style={{ position: 'fixed', top: menu.top, right: menu.right, zIndex: 901, background: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', minWidth: '240px', padding: '0.3rem 0' }}>
            <button type="button" style={{ ...menuItem, color: '#2563eb' }}
              onClick={() => { setReportOf({ student: menu.student, tab: 'overview' }); setMenu(null); }}><FiEye /> View Report</button>
            <button type="button" style={{ ...menuItem, color: '#0f172a' }}
              onClick={() => { setReportOf({ student: menu.student, tab: 'activity' }); setMenu(null); }}><FiClock /> View Activity History</button>
            <button type="button" style={{ ...menuItem, color: '#0f172a' }}
              onClick={() => { downloadReport(menu.student); setMenu(null); }}><FiDownload /> Download Student Report (PDF)</button>
          </div>
        </>
      )}

      {viewing && <StudentDayReport student={viewing} onClose={() => setViewing(null)} />}
    </>
  );
};

export default TeacherReportsPanel;
