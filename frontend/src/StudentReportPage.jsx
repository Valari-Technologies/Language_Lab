import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { apiFetch } from './api';
import { formatRollNo } from './format';

// Teacher Reports: the report of one student across the 6 zones, their levels, assessments, progress and activity.
// Missing data is shown as "Not captured" / "—" and never as a 0.

const card = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem' };
const muted = { color: '#64748b', fontSize: '0.8rem' };
const badge = (bg, color) => ({ display: 'inline-block', padding: '2px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: bg, color, whiteSpace: 'nowrap' });

const when = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
const day = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');
const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);
const dur = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';
  const s = Math.max(Math.round(seconds), 0);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};

const PERFORMANCE = {
  excellent: ['Excellent', '#dcfce7', '#15803d'], good: ['Good', '#dbeafe', '#1d4ed8'], average: ['Average', '#fef3c7', '#b45309'],
  needs_improvement: ['Needs Improvement', '#fee2e2', '#b91c1c'], not_assessed: ['Not assessed', '#f1f5f9', '#64748b'],
};
const LEVEL_STATUS = {
  completed: ['Completed', '#dcfce7', '#15803d'], in_progress: ['In Progress', '#fef3c7', '#b45309'],
  not_started: ['Not Started', '#f1f5f9', '#475569'], not_published: ['Not published yet', '#f8fafc', '#94a3b8'],
};

const Stat = ({ label, value, hint }) => (
  <div style={{ ...card, padding: '0.85rem 1rem' }}>
    <div style={muted}>{label}</div>
    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
    {hint && <div style={muted}>{hint}</div>}
  </div>
);
const Grid = ({ children, min = 170 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: '0.75rem' }}>{children}</div>
);
const Bar = ({ value, color = '#2563eb' }) => (
  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', flex: 1 }}>
    <div style={{ width: `${value || 0}%`, height: '100%', background: color }} />
  </div>
);
const tabBtn = (active) => ({ padding: '7px 16px', borderRadius: '999px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
  background: active ? '#2563eb' : '#ffffff', color: active ? '#ffffff' : '#334155' });
const linkBtn = { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '3px' };

const TABS = [['overview', 'Overview'], ['zones', 'Zones & Levels'], ['assessments', 'Assessments'], ['progress', 'Progress'], ['activity', 'Activity History']];

// A line chart of the assessment scores over time, drawn with plain SVG
const ScoreChart = ({ points }) => {
  const w = 560, h = 180, pad = 28;
  const x = (i) => (points.length === 1 ? w / 2 : pad + (i * (w - 2 * pad)) / (points.length - 1));
  const y = (v) => h - pad - (v / 100) * (h - 2 * pad);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: `${w}px`, height: 'auto' }} role="img" aria-label="Assessment scores over time">
      {[0, 50, 100].map(v => (
        <g key={v}>
          <line x1={pad} x2={w - pad} y1={y(v)} y2={y(v)} stroke="#e2e8f0" />
          <text x={4} y={y(v) + 4} fontSize="10" fill="#94a3b8">{v}%</text>
        </g>
      ))}
      {points.length > 1 && <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points.map((p, i) => `${x(i)},${y(p.percentage)}`).join(' ')} />}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.percentage)} r="4" fill="#2563eb"><title>{`${p.name}: ${p.percentage}% (${day(p.date)})`}</title></circle>
          <text x={x(i)} y={y(p.percentage) - 8} fontSize="10" textAnchor="middle" fill="#0f172a">{p.percentage}</text>
        </g>
      ))}
    </svg>
  );
};

const LevelRow = ({ level }) => {
  const [label, bg, color] = LEVEL_STATUS[level.status];
  if (level.status === 'not_published') {
    return <tr style={{ opacity: 0.6 }}><td>{level.levelInZone}</td><td colSpan="6"><span style={muted}>Level {level.level}: no lesson has been published for this level yet.</span></td></tr>;
  }
  return (
    <tr>
      <td>{level.levelInZone}</td>
      <td style={{ fontWeight: 600 }}>{level.title}</td>
      <td><span style={badge(bg, color)}>{label}</span></td>
      <td>{level.attempts}</td>
      <td>{level.attempts ? dur(level.seconds) : '—'}</td>
      <td>{when(level.startedAt)}</td>
      <td>{when(level.completedAt)}</td>
    </tr>
  );
};

const StudentReportPage = ({ student, initialTab = 'overview', onBack, onOpenDayReport }) => {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(initialTab);
  const [period, setPeriod] = useState('30');
  const [openAnswers, setOpenAnswers] = useState({});

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError('');
    (async () => {
      try {
        const res = await apiFetch(`/api/cms/v1/teacher/reports/students/${student.id}/report/`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) setReport(body); else setError(body.error || 'Could not load this report.');
      } catch (e) {
        if (!cancelled) setError('Could not reach the CMS.');
      }
    })();
    return () => { cancelled = true; };
  }, [student.id]);

  const o = report ? report.overview : null;
  const perf = o ? PERFORMANCE[o.performance] : null;

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={onBack} style={{ ...linkBtn, fontSize: '0.9rem' }}><FiArrowLeft /> Back to Reports</button>
      </div>

      {error && <div style={{ ...card, color: '#b91c1c', borderColor: '#fecaca', background: '#fef2f2' }}>{error}</div>}
      {!report && !error && <div style={card}><span style={muted}>Loading the report…</span></div>}

      {report && (
        <>
          <div style={{ ...card, marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>{o.name}</h2>
              <div style={muted}>
                Student ID {o.loginCode} · Roll No {formatRollNo(o.rollNo) || '—'} · {[o.grade, o.section].filter(Boolean).join(' · ') || '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={badge(perf[1], perf[2])}>{perf[0]}</span>
              {o.activity === 'inactive' && <span style={badge('#f1f5f9', '#475569')}>Inactive</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {TABS.map(([key, label]) => <button type="button" key={key} style={tabBtn(tab === key)} onClick={() => setTab(key)}>{label}</button>)}
          </div>

          {tab === 'overview' && (
            <Grid>
              <Stat label="Overall progress" value={o.progress === null ? '—' : `${o.progress}%`} hint={o.progress === null ? 'No levels published' : undefined} />
              <Stat label="Zones completed" value={`${o.zonesCompleted} / ${o.zonesTotal}`} />
              <Stat label="Levels completed" value={`${o.levelsCompleted} / ${o.levelsTotal}`} />
              <Stat label="Avg assessment score" value={o.avgAssessment === null ? 'Not assessed' : `${o.avgAssessment}%`} />
              <Stat label="Games played" value={o.gamesPlayed} hint={`${o.gamesCompleted} completed`} />
              <Stat label="Assessments completed" value={o.assessmentsCompleted} />
              <Stat label="Total learning time" value={dur(o.learningSeconds)} />
              <Stat label="Avg time per game" value={o.avgSecondsPerGame === null ? '—' : dur(o.avgSecondsPerGame)} />
              <Stat label="Last login" value={<span style={{ fontSize: '0.95rem' }}>{when(o.lastLogin)}</span>} hint={o.lastLogin ? undefined : 'No login recorded'} />
              <Stat label="Last activity" value={<span style={{ fontSize: '0.95rem' }}>{when(o.lastActivity)}</span>} />
            </Grid>
          )}

          {tab === 'zones' && report.zones.map(z => (
            <div key={z.zone} style={{ ...card, marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Zone {z.zone}: {z.name}</h3>
                {z.complete && <span style={badge('#dcfce7', '#15803d')}>Completed {day(z.completedAt)}</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '160px' }}>
                  <Bar value={z.progress} />
                  <strong style={{ fontSize: '0.85rem' }}>{z.progress === null ? '—' : `${z.progress}%`}</strong>
                </div>
              </div>
              <Grid min={130}>
                <Stat label="Levels completed" value={`${z.levelsCompleted} / ${z.levelsTotal}`} hint={z.levelsPublished < z.levelsTotal ? `${z.levelsPublished} published` : undefined} />
                <Stat label="Games played" value={z.gamesPlayed} hint={`${z.gamesCompleted} completed`} />
                <Stat label="Assessment score" value={z.assessmentScore === null ? 'Not assessed' : `${z.assessmentScore}%`} />
                <Stat label="Attempts" value={z.attempts} />
                <Stat label="Time spent" value={z.attempts ? dur(z.seconds) : '—'} />
              </Grid>
              <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
                <table className="sd-table">
                  <thead>
                    <tr><th>Level</th><th>Game</th><th>Status</th><th>Attempts</th><th>Time</th><th>Started</th><th>Completed</th></tr>
                  </thead>
                  <tbody>
                    {report.levels.filter(l => l.zone === z.zone).map(l => (
                      <LevelRow key={l.level} level={l} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {tab === 'assessments' && (report.assessments.length === 0 ? (
            <div style={card}><span style={muted}>No assessments are published for this grade yet.</span></div>
          ) : report.assessments.map(a => {
            const [label, bg, color] = LEVEL_STATUS[a.status];
            return (
              <div key={a.zone} style={{ ...card, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{a.name}</h3>
                  <span style={muted}>Zone {a.zone}: {a.zoneName}</span>
                  <span style={badge(bg, color)}>{label}</span>
                  {a.result && <span style={badge(a.result === 'pass' ? '#dcfce7' : '#fee2e2', a.result === 'pass' ? '#15803d' : '#b91c1c')}>{a.result === 'pass' ? 'Pass' : 'Fail'} (pass mark {a.passMark}%)</span>}
                </div>
                <Grid min={140}>
                  <Stat label="Total questions" value={a.totalQuestions ?? 'Not captured'} />
                  <Stat label="Correct" value={a.correct ?? 'Not captured'} />
                  <Stat label="Incorrect" value={a.incorrect ?? 'Not captured'} />
                  <Stat label="Unanswered" value="Not captured" />
                  <Stat label="Marks" value={a.marksObtained === null ? '—' : `${a.marksObtained} / ${a.totalMarks}`} />
                  <Stat label="Percentage" value={pct(a.percentage)} />
                  <Stat label="Attempts" value={a.attempts} />
                  <Stat label="Highest / latest score" value={`${pct(a.highestScore)} / ${pct(a.latestScore)}`} />
                  <Stat label="Assessment date" value={<span style={{ fontSize: '0.95rem' }}>{when(a.date)}</span>} />
                </Grid>
                {a.status === 'completed' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <button type="button" style={linkBtn} onClick={() => setOpenAnswers(prev => ({ ...prev, [a.zone]: !prev[a.zone] }))}>
                      View Answers {openAnswers[a.zone] ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    {openAnswers[a.zone] && (a.answers.length === 0 ? (
                      <p style={{ ...muted, marginTop: '0.4rem' }}>The LMS did not send the answers of this assessment, so they cannot be reviewed.</p>
                    ) : (
                      <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                        <table className="sd-table">
                          <thead><tr><th>#</th><th>Question</th><th>Type</th><th>Result</th><th>Marks</th><th>Time</th><th>Response</th></tr></thead>
                          <tbody>
                            {a.answers.map((r, i) => (
                              <tr key={i} style={r.isCorrect === false ? { background: '#fef2f2' } : undefined}>
                                <td>{i + 1}</td><td>{r.screen}</td><td>{r.type || '—'}</td>
                                <td>{r.isCorrect === null ? '—' : (r.isCorrect ? <span style={{ color: '#15803d', fontWeight: 700 }}>Correct</span> : <span style={{ color: '#b91c1c', fontWeight: 700 }}>Incorrect</span>)}</td>
                                <td>{r.score === null ? '—' : `${r.score} / ${r.maxScore ?? '—'}`}</td>
                                <td>{dur(r.seconds)}</td>
                                <td style={{ maxWidth: '280px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  {Object.keys(r.details).length ? JSON.stringify(r.details).slice(0, 240) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }))}

          {tab === 'progress' && (
            <>
              <div style={{ ...card, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', marginRight: 'auto' }}>Progress in the last</h3>
                  {['7', '30'].map(p => <button type="button" key={p} style={tabBtn(period === p)} onClick={() => setPeriod(p)}>{p} days</button>)}
                </div>
                <Grid min={140}>
                  <Stat label="Levels completed" value={report.progress.periods[period].levelsCompleted} />
                  <Stat label="Attempts" value={report.progress.periods[period].attempts} />
                  <Stat label="Learning time" value={report.progress.periods[period].learningSeconds ? dur(report.progress.periods[period].learningSeconds) : '—'} />
                  <Stat label="Active days" value={report.progress.periods[period].activeDays} />
                </Grid>
              </div>

              <div style={{ ...card, marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: '#0f172a' }}>Assessment scores over time</h3>
                {report.progress.timeline.length === 0
                  ? <span style={muted}>No assessment has been completed yet.</span>
                  : <ScoreChart points={report.progress.timeline} />}
              </div>

              <div style={{ ...card, marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', color: '#0f172a' }}>Zone comparison</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {report.progress.zoneComparison.map(z => (
                    <div key={z.zone} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{z.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Bar value={z.progress} /><span style={muted}>{z.progress === null ? 'no levels' : `${z.progress}% progress`}</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Bar value={z.assessmentScore} color="#16a34a" /><span style={muted}>{z.assessmentScore === null ? 'not assessed' : `${z.assessmentScore}% score`}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: '#0f172a' }}>First attempt compared with the latest</h3>
                {report.progress.improvement.length === 0
                  ? <span style={muted}>Shown once an assessment has been completed at least twice.</span>
                  : (
                    <table className="sd-table">
                      <thead><tr><th>Assessment</th><th>First attempt</th><th>Latest attempt</th><th>Change</th></tr></thead>
                      <tbody>
                        {report.progress.improvement.map(r => (
                          <tr key={r.name}>
                            <td style={{ fontWeight: 600 }}>{r.name}</td><td>{pct(r.firstScore)}</td><td>{pct(r.latestScore)}</td>
                            <td style={{ fontWeight: 700, color: r.change > 0 ? '#15803d' : (r.change < 0 ? '#b91c1c' : '#475569') }}>
                              {r.change > 0 ? '+' : ''}{r.change} points {r.change > 0 ? '(improved)' : (r.change < 0 ? '(dropped)' : '(no change)')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            </>
          )}

          {tab === 'activity' && (
            <>
              <div style={{ ...card, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ ...muted, flex: 1 }}>
                  {o.activity === 'inactive'
                    ? `Inactive: no activity for ${report.inactiveAfterDays} days or more.`
                    : `Active: activity within the last ${report.inactiveAfterDays} days.`} Login history exists only from the time the school started using the LMS Hub.
                </span>
                {onOpenDayReport && <button type="button" className="sd-btn-outline" onClick={() => onOpenDayReport(student)}>Open the day report</button>}
              </div>

              <div style={{ ...card, marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: '#0f172a' }}>Logins</h3>
                {report.sessions.length === 0 ? <span style={muted}>No login has been recorded.</span> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sd-table">
                      <thead><tr><th>Login</th><th>Logout / last seen</th><th>Time online</th><th>Ended</th></tr></thead>
                      <tbody>
                        {report.sessions.map((s, i) => (
                          <tr key={i}><td>{when(s.loginAt)}</td><td>{when(s.lastSeenAt)}</td><td>{dur(s.seconds)}</td><td>{s.endReason || 'Left open'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={card}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: '#0f172a' }}>Games and assessments, day by day (last 60 days)</h3>
                {report.history.length === 0 ? <span style={muted}>No activity in the last 60 days.</span> : report.history.map(d => (
                  <div key={d.date} style={{ borderTop: '1px solid #f1f5f9', padding: '0.6rem 0' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <strong>{new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                      <span style={muted}>{d.sessions} {d.sessions === 1 ? 'login' : 'logins'} · {dur(d.seconds)} learning</span>
                    </div>
                    {d.items.map((it, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={badge(it.kind === 'assessment' ? '#ede9fe' : '#e0f2fe', it.kind === 'assessment' ? '#6d28d9' : '#0369a1')}>{it.kind === 'assessment' ? 'Assessment' : 'Lesson'}</span>
                        <span style={{ fontWeight: 600 }}>{it.title}</span>
                        <span style={muted}>{new Date(it.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {it.status === 'COMPLETED' ? 'Completed' : 'In progress'} · {dur(it.seconds)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default StudentReportPage;
