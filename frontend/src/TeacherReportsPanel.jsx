import React, { useCallback, useEffect, useState } from 'react';
import { FiBarChart2, FiDownload, FiEye, FiMoreVertical, FiRefreshCw, FiX } from 'react-icons/fi';
import { apiFetch } from './api';

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
  ['Lessons completed', s.completedLessons],
  ['Attempts', s.attempts],
  ['Average score', percent(s.averagePercent)],
  ['Stars', s.stars],
  ['Last activity', fmt(s.lastActivity)],
];

// A report as a PDF with tables, built in the browser from the data already on screen.
// tables: [{ heading, head: [..], body: [[..]] }]. The PDF library is loaded only when someone downloads.
const savePdf = async ({ file, title, subtitle, tables }) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text(title, 40, 50);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 40, 68);
  let y = 90;
  tables.forEach(({ heading, head, body }) => {
    if (heading) {
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(heading, 40, y);
      y += 8;
    }
    autoTable(doc, {
      startY: y,
      head: [head],
      body: body.map(row => row.map(v => String(v ?? '')).map(v => (v === '' ? '—' : v))),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 5 },
      margin: { left: 40, right: 40 },
    });
    y = doc.lastAutoTable.finalY + 24;
  });
  doc.save(file);
};

const downloadReport = (s) => savePdf({
  file: `report_${s.loginCode || s.id}.pdf`,
  title: 'Student Report',
  subtitle: `${s.name} · Class ${classLabel(s)}`,
  tables: [
    { head: ['Student', 'Login code', 'Roll No', 'Class'], body: [[s.name, s.loginCode, s.rollNo, classLabel(s)]] },
    { heading: 'Performance', head: reportRows(s).map(([label]) => label), body: [reportRows(s).map(([, value]) => value)] },
  ],
});

const Stat = ({ label, value }) => (
  <div style={{ ...card, padding: '0.9rem 1.1rem' }}>
    <div style={muted}>{label}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
  </div>
);

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
            style={{ height: '34px', width: 'auto', ...(tab === 'date' ? { borderColor: '#2563eb' } : {}) }} />
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

const TeacherReportsPanel = () => {
  const [data, setData] = useState(null);
  const [gradeId, setGradeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [menu, setMenu] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
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
  }, [gradeId]);

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
                      <th>Student</th><th>Roll No</th><th>Class</th><th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}<div style={muted}>{s.loginCode}</div></td>
                        <td>{s.rollNo || '—'}</td>
                        <td>{classLabel(s)}</td>
                        <td style={{ width: '90px', textAlign: 'center' }}>
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
                    ))}
                  </tbody>
                </table>
                {data.summary.attempts === 0 && (
                  <p style={{ ...muted, marginTop: '0.75rem' }}>No results yet: they appear here once students finish lessons in the LMS.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {menu && (
        <>
          <div onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 900 }} />
          <div style={{ position: 'fixed', top: menu.top, right: menu.right, zIndex: 901, background: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', minWidth: '140px', padding: '0.3rem 0' }}>
            <button type="button" style={{ ...menuItem, color: '#2563eb' }}
              onClick={() => { setViewing(menu.student); setMenu(null); }}><FiEye /> View</button>
            <button type="button" style={{ ...menuItem, color: '#0f172a' }}
              onClick={() => { downloadReport(menu.student); setMenu(null); }}><FiDownload /> Download</button>
          </div>
        </>
      )}

      {viewing && <StudentDayReport student={viewing} onClose={() => setViewing(null)} />}
    </>
  );
};

export default TeacherReportsPanel;
