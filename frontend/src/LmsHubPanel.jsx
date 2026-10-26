import React, { useCallback, useEffect, useState } from 'react';
import { FiMonitor, FiRefreshCw, FiTrash2, FiUsers, FiBookOpen, FiAlertTriangle, FiKey } from 'react-icons/fi';
import { apiFetch } from './api';

// "LMS Hub" page: student PCs of the English Adventure LMS connect to the CMS instead of a hub PC in the school.
// School admins see their own school; the super admin picks a school first.

const card = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem' };
const cardTitle = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: '0 0 0.9rem 0' };
const muted = { color: '#64748b', fontSize: '0.8rem' };

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const LmsHubPanel = ({ user }) => {
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [confirmId, setConfirmId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) return;
    apiFetch('/api/cms/v1/schools/?page_size=500')
      .then(r => (r.ok ? r.json() : []))
      .then(d => setSchools(Array.isArray(d) ? d : (d.results || [])))
      .catch(() => setSchools([]));
  }, [isSuperAdmin]);

  const load = useCallback(async () => {
    if (isSuperAdmin && !schoolId) return;
    setLoading(true);
    try {
      const query = isSuperAdmin ? `?school_id=${schoolId}` : '';
      const res = await apiFetch(`/api/cms/v1/lms-hub/overview/${query}`);
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setData(body);
        setSecondsLeft(body.pairing?.secondsLeft || 0);
        setError('');
      } else {
        setError(body.error || 'Could not load the LMS hub.');
      }
    } catch (e) {
      setError('Could not reach the CMS.');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, schoolId]);

  // Refresh every 15 s; the pairing countdown runs every second and reloads when the code expires
  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { load(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [load]);

  const removeDevice = async (device) => {
    setConfirmId(null);
    const res = await apiFetch(`/api/cms/v1/lms-hub/devices/${device.id}/remove/`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok ? (body.message || 'Computer removed.') : (body.error || 'Could not remove the computer.'));
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {isSuperAdmin && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label htmlFor="lmshub-school" style={{ fontWeight: 700, color: '#0f172a' }}>School</label>
          <select id="lmshub-school" className="sd-form-input" value={schoolId} onChange={e => setSchoolId(e.target.value)}
            style={{ minWidth: '260px', height: '38px' }}>
            <option value="">Choose a school…</option>
            {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name} ({s.schoolId || s.school_code})</option>)}
          </select>
        </div>
      )}

      {isSuperAdmin && !schoolId && <p style={muted}>Choose a school to see its LMS hub.</p>}
      {error && <div style={{ ...card, color: '#b91c1c', borderColor: '#fecaca', background: '#fef2f2' }}>{error}</div>}
      {message && <div style={{ ...card, color: '#166534', borderColor: '#bbf7d0', background: '#f0fdf4' }} onClick={() => setMessage('')}>{message}</div>}

      {data && (
        <>
          {/* Pairing */}
          <div style={card}>
            <h3 style={cardTitle}><FiKey /> Pair a student computer</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={muted}>Pairing code</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.2em', color: '#0b57d0', fontVariantNumeric: 'tabular-nums' }}>{data.pairing.code}</div>
                <div style={muted}>New code in {clock(secondsLeft)}</div>
              </div>
              <div>
                <div style={muted}>School code</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{data.school.schoolId || data.school.schoolCode}</div>
                {data.school.schoolCode && data.school.schoolId && <div style={muted}>or {data.school.schoolCode}</div>}
              </div>
              <div>
                <div style={muted}>CMS address for the PCs</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>{data.cmsAddress}</div>
                {data.cmsAddress.startsWith('http://') && (
                  <div style={{ ...muted, color: '#b45309', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <FiAlertTriangle /> Not encrypted (http). Use HTTPS before student PCs connect over the internet.
                  </div>
                )}
              </div>
            </div>
            <p style={{ ...muted, marginTop: '0.75rem' }}>On the student PC, choose "Connect to the CMS", then type the CMS address, the school code and this pairing code.</p>
          </div>

          {/* Seats and active students */}
          <div style={card}>
            <h3 style={cardTitle}><FiUsers /> Seats: {data.seats.used} of {data.seats.total ?? '—'} in use
              <button type="button" onClick={load} className="sd-btn-outline" style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '0.75rem' }} disabled={loading}>
                <FiRefreshCw /> Refresh
              </button>
            </h3>
            {!data.licenseActive && <p style={{ ...muted, color: '#b91c1c' }}>The school licence is not active: students cannot log in.</p>}
            {data.sessions.length === 0 ? <p style={muted}>No student is logged in right now.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="sd-table">
                  <thead><tr><th>Student</th><th>Login code</th><th>Computer</th><th>Since</th></tr></thead>
                  <tbody>
                    {data.sessions.map(s => (
                      <tr key={`${s.loginCode}-${s.since}`}><td>{s.student}</td><td>{s.loginCode}</td><td>{s.computer}</td><td>{fmt(s.since)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paired computers */}
          <div style={card}>
            <h3 style={cardTitle}><FiMonitor /> Paired computers ({data.devices.filter(d => !d.revoked).length})</h3>
            {data.devices.length === 0 ? <p style={muted}>No computer is paired yet.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="sd-table">
                  <thead><tr><th>Name</th><th>PC id</th><th>Last IP</th><th>Last seen</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {data.devices.map(d => (
                      <tr key={d.id} style={d.revoked ? { opacity: 0.55 } : undefined}>
                        <td style={{ fontWeight: 600 }}>{d.pcName}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} title={d.pcId}>{d.pcId.slice(0, 8)}</td>
                        <td>{d.lastIp || '—'}</td>
                        <td>{fmt(d.lastSeen)}</td>
                        <td>{d.revoked ? 'Removed' : (d.inUse ? 'In use' : 'Paired')}</td>
                        <td>
                          {!d.revoked && (confirmId === d.id ? (
                            <span style={{ display: 'inline-flex', gap: '6px' }}>
                              <button type="button" className="sd-btn-outline" style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#dc2626', borderColor: '#dc2626' }} onClick={() => removeDevice(d)}>Remove now</button>
                              <button type="button" className="sd-btn-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => setConfirmId(null)}>Cancel</button>
                            </span>
                          ) : (
                            <button type="button" className="sd-btn-outline" style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#dc2626', borderColor: '#dc2626' }} onClick={() => setConfirmId(d.id)}>
                              <FiTrash2 /> Remove
                            </button>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={muted}>Removing a computer logs its student out. It can be paired again with a new pairing code.</p>
              </div>
            )}
          </div>

          {/* Lessons per grade */}
          <div style={card}>
            <h3 style={cardTitle}><FiBookOpen /> Lessons in the level map</h3>
            {data.plans.length === 0 ? <p style={muted}>No active student has a grade with lessons yet.</p> : data.plans.map(p => (
              <details key={p.grade.id} style={{ marginBottom: '0.6rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}>
                  {p.grade.name}: {p.counts.lessons} of 30 lessons, {p.counts.assessments} of 6 bosses
                </summary>
                <ol style={{ margin: '0.5rem 0 0 1.25rem', columns: 2, fontSize: '0.82rem', color: '#334155' }}>
                  {p.lessons.map((e, i) => <li key={`l${i}`}>{e ? e.title : <span style={muted}>(empty)</span>}{e && !e.available ? ' — file missing' : ''}</li>)}
                </ol>
                <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '0.4rem' }}>
                  Bosses: {p.bosses.map((e, i) => (e ? e.title : '(empty)') + (i < 5 ? ' · ' : '')).join('')}
                </div>
              </details>
            ))}
          </div>

          {/* Progress */}
          <div style={card}>
            <h3 style={cardTitle}><FiAlertTriangle /> Progress</h3>
            <p style={{ margin: '0 0 0.75rem 0', color: '#0f172a' }}>Attempts received today: <strong>{data.progress.attemptsToday}</strong></p>
            {data.progress.noClass.length > 0 && (
              <div style={{ marginBottom: '0.9rem' }}>
                <div style={{ fontWeight: 700, color: '#b45309' }}>Students without a class ({data.progress.noClass.length})</div>
                <p style={muted}>Their results are saved but do not appear in class and teacher reports. Ask the admin to create the class in the CMS.</p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                  {data.progress.noClass.map(s => <li key={s.loginCode}>{s.student} ({s.loginCode}) — {s.grade || '?'} {s.section || ''}</li>)}
                </ul>
              </div>
            )}
            {data.progress.rejected.length === 0 ? <p style={muted}>No rejected results.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: '0.4rem' }}>Results not saved for reports ({data.progress.rejected.length})</div>
                <table className="sd-table">
                  <thead><tr><th>Student</th><th>Level</th><th>Reason</th><th>Received</th></tr></thead>
                  <tbody>
                    {data.progress.rejected.map(r => (
                      <tr key={r.eventId}><td>{r.student} ({r.loginCode})</td><td>{r.levelKey || '—'}</td><td>{r.error}</td><td>{fmt(r.receivedAt)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LmsHubPanel;
