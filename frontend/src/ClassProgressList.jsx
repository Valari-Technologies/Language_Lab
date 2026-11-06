import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

// Teacher Reports: the page behind the "Overall class progress" and "Class avg assessment score" cards: that number for
// each class the teacher handles, the highest first. It uses the filters chosen when the card was clicked, so it matches the card.

const card = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem' };
const muted = { color: '#64748b', fontSize: '0.8rem' };

const METRICS = {
  progress: {
    field: 'avgProgress', title: 'Overall class progress by class', column: 'Overall progress', color: '#2563eb',
    about: "The average progress of the students of each class you handle, the highest first. A student's progress is the lessons finished out of the lessons published for their grade.",
    overall: (v) => ` All your classes together: ${v}%.`,
    none: (c) => (c.students === 0 ? 'No students yet' : 'No lessons published for this grade'),
  },
  score: {
    field: 'avgAssessment', title: 'Class avg assessment score by class', column: 'Avg assessment score', color: '#16a34a',
    about: "The average assessment score of the students of each class you handle, the highest first. A student's score is the average percentage of the assessments they completed; students with no assessment are left out.",
    overall: (v) => ` All your classes together: ${v}%.`,
    none: (c) => (c.students === 0 ? 'No students yet' : 'No assessment completed yet'),
  },
};

const ClassProgressList = ({ classes, overall, metric = 'progress', onBack }) => {
  const m = METRICS[metric];
  // the highest first; a class with no value goes to the end
  const ordered = [...classes].sort((a, b) => (a[m.field] === null) - (b[m.field] === null) || (b[m.field] || 0) - (a[m.field] || 0) || a.name.localeCompare(b.name));
  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <FiArrowLeft /> Back to Reports
        </button>
      </div>

      <div className="sd-card" style={{ ...card, padding: '1.25rem 1.5rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: '#0f172a' }}>{m.title}</h2>
        <p style={{ ...muted, margin: '0 0 1rem' }}>
          {m.about}{overall !== null && overall !== undefined ? m.overall(overall) : ''}
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="sd-table">
            <thead><tr><th style={{ width: '60px' }}>Rank</th><th>Class</th><th>Students</th><th style={{ minWidth: '240px' }}>{m.column}</th></tr></thead>
            <tbody>
              {ordered.map((c, i) => (
                <tr key={c.classId}>
                  <td>{c[m.field] === null ? '—' : i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.students}</td>
                  <td>
                    {c[m.field] === null ? (
                      <span style={muted}>{m.none(c)}</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ flex: 1, height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(c[m.field], 100)}%`, height: '100%', background: m.color }} />
                        </div>
                        <strong style={{ fontSize: '0.9rem', minWidth: '48px', textAlign: 'right' }}>{c[m.field]}%</strong>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ClassProgressList;
