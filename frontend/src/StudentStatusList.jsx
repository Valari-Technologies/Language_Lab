import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiBarChart2 } from 'react-icons/fi';
import { apiFetch } from './api';
import { formatRollNo, pageItems, titleName } from './format';

// Teacher Reports: the page behind the "Active students" and "Inactive students" cards: who they are, with class and roll no.
// It uses the class, zone, performance, progress and date filters that were chosen when the card was clicked.

const card = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem' };
const muted = { color: '#64748b', fontSize: '0.8rem' };

const StudentStatusList = ({ status, filterQuery, onBack }) => {
  const label = status === 'active' ? 'Active students' : 'Inactive students';
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(filterQuery);
    params.delete('search');
    params.set('activity', status);
    params.set('sort', 'name');
    params.set('order', 'asc');
    params.set('page', String(page));
    (async () => {
      try {
        const res = await apiFetch(`/api/cms/v1/teacher/reports/class/?${params}`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) {
          setData(body);
          setError('');
          if (body.page !== page) setPage(body.page);
        } else {
          setError(body.error || 'Could not load the list.');
        }
      } catch (e) {
        if (!cancelled) setError('Could not reach the CMS.');
      }
    })();
    return () => { cancelled = true; };
  }, [page, status, filterQuery]);

  const from = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <FiArrowLeft /> Back to Reports
        </button>
      </div>

      <div className="sd-card" style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: '#0f172a' }}>{label}{data ? ` (${data.total})` : ''}</h2>
        <p style={{ ...muted, margin: '0 0 1rem' }}>
          {status === 'active'
            ? `Students with activity in the last ${data ? data.inactiveAfterDays : 14} days.`
            : `Students with no activity for ${data ? data.inactiveAfterDays : 14} days or more, or none yet.`}
        </p>

        {error && <div style={{ ...card, color: '#b91c1c', borderColor: '#fecaca', background: '#fef2f2' }}>{error}</div>}
        {!data && !error && <span style={muted}>Loading…</span>}

        {data && (data.total === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <FiBarChart2 style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>No {status} students</h3>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="sd-table">
                <thead><tr><th>Student</th><th>Class</th><th>Roll No</th></tr></thead>
                <tbody>
                  {data.students.map(s => (
                    <tr key={s.id}>
                      <td>{titleName(s.name) || s.name}<div style={muted}>{s.loginCode}</div></td>
                      <td>{[s.grade, s.section].filter(Boolean).join(' · ') || '—'}</td>
                      <td>{formatRollNo(s.rollNo) || '—'}</td>
                    </tr>
                  ))}
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
          </>
        ))}
      </div>
    </>
  );
};

export default StudentStatusList;
