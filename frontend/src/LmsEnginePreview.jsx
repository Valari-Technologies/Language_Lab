import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';
import { LMS_PREVIEW_URL } from './config';

// Shows a lesson in the real LMS Engine (the same cards, zone themes and boards as the app) inside an iframe.
// Handshake: the engine posts 'lms-preview:ready'; we answer 'lms-preview:load' with the experience.json and the zone.
// Only messages from the preview page's own origin are accepted. Nothing is saved.

const ZONES = [
  { id: 1, name: 'Summer' }, { id: 2, name: 'Winter' }, { id: 3, name: 'Spring' },
  { id: 4, name: 'Island' }, { id: 5, name: 'Desert' }, { id: 6, name: 'Lava' },
];

const LmsEnginePreview = ({ experienceId }) => {
  const frameRef = useRef(null);
  const [experience, setExperience] = useState(null);
  const [zone, setZone] = useState(1);
  const [status, setStatus] = useState('Loading the lesson…');
  const [frameKey, setFrameKey] = useState(0);

  const previewOrigin = (() => { try { return new URL(LMS_PREVIEW_URL).origin; } catch { return ''; } })();

  useEffect(() => {
    let alive = true;
    setExperience(null);
    setStatus('Loading the lesson…');
    (async () => {
      try {
        const res = await apiFetch(`/api/v1/content/experiences/${experienceId}/preview/?format=runtime`);
        if (!alive) return;
        if (!res.ok) { setStatus('This lesson could not be loaded for the LMS preview.'); return; }
        setExperience(await res.json());
        setStatus('Starting the LMS player…');
      } catch {
        if (alive) setStatus('This lesson could not be loaded for the LMS preview.');
      }
    })();
    return () => { alive = false; };
  }, [experienceId]);

  const send = () => {
    const win = frameRef.current && frameRef.current.contentWindow;
    if (win && experience && previewOrigin) win.postMessage({ type: 'lms-preview:load', experience, zone }, previewOrigin);
  };

  useEffect(() => {
    const onMessage = (e) => {
      if (!previewOrigin || e.origin !== previewOrigin) return;
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      const m = e.data || {};
      if (m.type === 'lms-preview:ready') { send(); setStatus(''); }
      else if (m.type === 'lms-preview:error') setStatus(`The LMS player could not play this lesson: ${m.message || 'unknown error'}`);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  });

  // Changing the zone reloads the page so the engine starts again with the new theme.
  const changeZone = (z) => { setZone(z); setFrameKey((k) => k + 1); };

  if (!LMS_PREVIEW_URL) return null;
  const src = `${LMS_PREVIEW_URL}${LMS_PREVIEW_URL.includes('?') ? '&' : '?'}preview=1&zone=${zone}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Zone theme</span>
        <select value={zone} onChange={(e) => changeZone(Number(e.target.value))}
          style={{ padding: '0.3rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }}>
          {ZONES.map((z) => <option key={z.id} value={z.id}>{z.id}. {z.name}</option>)}
        </select>
        {status && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{status}</span>}
      </div>
      {experience && (
        <iframe key={frameKey} ref={frameRef} title="LMS preview" src={src} allow="microphone; autoplay"
          style={{ flex: 1, width: '100%', border: 'none', background: '#0f172a' }} />
      )}
    </div>
  );
};

export default LmsEnginePreview;
