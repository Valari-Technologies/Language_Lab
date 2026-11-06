import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

// Teacher Reports: the page behind the "Overall class progress" card: the progress of each class the teacher handles,
// the highest first. It uses the filters chosen when the card was clicked, so it matches the card.

const card = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem' };
const muted = { color: '#64748b', fontSize: '0.8rem' };

const ClassProgressList = ({ classes, overall, onBack }) => (
  <>
    <div style={{ marginBottom: '1rem' }}>
      <button type="button" onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <FiArrowLeft /> Back to Reports
      </button>
    </div>

    <div className="sd-card" style={{ ...card, padding: '1.25rem 1.5rem' }}>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: '#0f172a' }}>Overall class progress by class</h2>
      <p style={{ ...muted, margin: '0 0 1rem' }}>
        The average progress of the students of each class you handle, the highest first. A student's progress is the lessons
        finished out of the lessons published for their grade.{overall !== null && overall !== undefined ? ` All your classes together: ${overall}%.` : ''}
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table className="sd-table">
          <thead><tr><th style={{ width: '60px' }}>Rank</th><th>Class</th><th>Students</th><th style={{ minWidth: '240px' }}>Overall progress</th></tr></thead>
          <tbody>
            {classes.map((c, i) => (
              <tr key={c.classId}>
                <td>{c.avgProgress === null ? '—' : i + 1}</td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.students}</td>
                <td>
                  {c.avgProgress === null ? (
                    <span style={muted}>{c.students === 0 ? 'No students yet' : 'No lessons published for this grade'}</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ flex: 1, height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(c.avgProgress, 100)}%`, height: '100%', background: '#2563eb' }} />
                      </div>
                      <strong style={{ fontSize: '0.9rem', minWidth: '48px', textAlign: 'right' }}>{c.avgProgress}%</strong>
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

export default ClassProgressList;
