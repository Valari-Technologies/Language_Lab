import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';
import { LMS_PREVIEW_URL } from './config';

// Shows a lesson in the real LMS Engine (the same cards, zone themes and boards as the app) inside an iframe.
// Handshake: the engine posts 'lms-preview:ready'; we answer 'lms-preview:load' with the experience.json and the zone.
// Only messages from the preview page's own origin are accepted. Nothing is saved.
//
// Layout editor (canEdit): the "Edit layout" panel lists the parts of the card on screen (sign, tag, question, options,
// picture, the whole card) and changes their size, position, text size, brightness and opacity live. It talks to the
// engine with these messages (the engine must support them; the panel says so when it does not):
//   CMS -> engine  lms-preview:inspect   {on}              start / stop reporting the parts of the current card
//   engine -> CMS  lms-preview:elements  {cardType, screenIndex, elements:[{id, label, props:[...], values:{...}}]}
//                                        sent when inspect is on, after an inspect request and whenever the card changes
//   CMS -> engine  lms-preview:style     {id, props:{width, height, x, y, fontSize, brightness, opacity}}
//   CMS -> engine  lms-preview:highlight {id}              outline the selected part (null = none)
//   CMS -> engine  lms-preview:reset     {}                remove every override
//   CMS -> engine  lms-preview:goto      {activityId, screenId, activityIndex, screenIndex}   open that card (list of all cards)
// Units: width, height, x, y and fontSize are px; brightness and opacity are percent (100 = unchanged).

const ZONES = [
  { id: 1, name: 'Summer' }, { id: 2, name: 'Winter' }, { id: 3, name: 'Spring' },
  { id: 4, name: 'Island' }, { id: 5, name: 'Desert' }, { id: 6, name: 'Lava' },
];

const PROP_FIELDS = [
  { key: 'width', label: 'Width', unit: 'px', min: 0 },
  { key: 'height', label: 'Height', unit: 'px', min: 0 },
  { key: 'x', label: 'Move left / right', unit: 'px' },
  { key: 'y', label: 'Move up / down', unit: 'px' },
  { key: 'fontSize', label: 'Text size', unit: 'px', min: 1 },
  { key: 'brightness', label: 'Brightness', unit: '%', min: 0 },
  { key: 'opacity', label: 'Opacity', unit: '%', min: 0, max: 100 },
];

const LmsEnginePreview = ({ experienceId, canEdit = false }) => {
  const frameRef = useRef(null);
  const [experience, setExperience] = useState(null);
  const [zone, setZone] = useState(1);
  const [status, setStatus] = useState('Loading the lesson…');
  const [frameKey, setFrameKey] = useState(0);

  const [editing, setEditing] = useState(false);
  const [supported, setSupported] = useState(null); // null = waiting for the engine, true / false
  const [info, setInfo] = useState(null);            // {cardType, screenIndex, elements}
  const [selectedId, setSelectedId] = useState(null);
  const [changes, setChanges] = useState({});        // {zone: {cardType: {elementId: {prop: value}}}}
  const [copied, setCopied] = useState(false);
  const [openCardId, setOpenCardId] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // card type of the selected element
  const [catalog, setCatalog] = useState({});             // {cardType: elements[]} reported by the player
  const [typeOf, setTypeOf] = useState({});               // {screenId: cardType} the player's name for each lesson card
  const [walkLeft, setWalkLeft] = useState(0);            // cards still to open while collecting every element
  const [walked, setWalked] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [savedText, setSavedText] = useState('{}');       // the layout as last saved (or loaded)
  const gotoRef = useRef(null);                           // the card last opened from the list
  const walkRef = useRef([]);                             // cards still to open
  const pendingSelectRef = useRef(null);                  // element to select once its card is shown

  const previewOrigin = (() => { try { return new URL(LMS_PREVIEW_URL).origin; } catch { return ''; } })();

  const post = (msg) => {
    const win = frameRef.current && frameRef.current.contentWindow;
    if (win && previewOrigin) win.postMessage(msg, previewOrigin);
  };

  useEffect(() => {
    let alive = true;
    setExperience(null);
    setStatus('Loading the lesson…');
    (async () => {
      try {
        const res = await apiFetch(`/api/v1/content/experiences/${experienceId}/preview/?runtime=1`);
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

  // The layout saved with this lesson (what the creator set before; it goes into the package once the lesson is approved).
  useEffect(() => {
    if (!canEdit) return undefined;
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/v1/content/experiences/${experienceId}/layout/`);
        if (!alive || !res.ok) return;
        const data = await res.json();
        const layout = data.layout || {};
        setChanges(layout);
        setSavedText(JSON.stringify(layout));
      } catch { /* the editor still works; saving will report the problem */ }
    })();
    return () => { alive = false; };
  }, [experienceId, canEdit]);

  // Sends the stored changes of this card back to the engine (a card that was left and opened again, or a reloaded zone).
  const reapply = (cardType) => {
    const saved = (changes[zone] || {})[cardType] || {};
    Object.entries(saved).forEach(([id, props]) => post({ type: 'lms-preview:style', id, props }));
  };

  useEffect(() => {
    const onMessage = (e) => {
      if (!previewOrigin || e.origin !== previewOrigin) return;
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      const m = e.data || {};
      if (m.type === 'lms-preview:ready') {
        post({ type: 'lms-preview:load', experience, zone });
        if (editing) post({ type: 'lms-preview:inspect', on: true });
        setStatus('');
      } else if (m.type === 'lms-preview:error') {
        setStatus(`The LMS player could not play this lesson: ${m.message || 'unknown error'}`);
      } else if (m.type === 'lms-preview:elements') {
        const cardType = m.cardType || 'card';
        const elements = Array.isArray(m.elements) ? m.elements : [];
        setSupported(true);
        setInfo({ cardType, screenIndex: m.screenIndex, elements });
        setCatalog((prev) => ({ ...prev, [cardType]: elements }));
        if (gotoRef.current) { const id = gotoRef.current.id; setTypeOf((prev) => ({ ...prev, [id]: cardType })); }
        reapply(cardType);
        const pending = pendingSelectRef.current;
        if (pending && pending.type === cardType) {
          pendingSelectRef.current = null;
          setSelectedId(pending.id); setSelectedType(cardType);
          post({ type: 'lms-preview:highlight', id: pending.id });
        }
        // collecting every element: open the next card of the lesson
        if (walkRef.current.length > 0) {
          const next = walkRef.current.shift();
          setWalkLeft(walkRef.current.length);
          gotoRef.current = next;
          setOpenCardId(next.id);
          post({ type: 'lms-preview:goto', activityId: next.activityId, screenId: next.id, activityIndex: next.activityIndex, screenIndex: next.screenIndex });
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  });

  // When the engine does not answer an inspect request, this build does not support the layout editor.
  useEffect(() => {
    if (!editing || supported !== null) return undefined;
    const t = setTimeout(() => setSupported((s) => (s === null ? false : s)), 4000);
    return () => clearTimeout(t);
  }, [editing, supported, frameKey]);

  const toggleEdit = () => {
    const next = !editing;
    setEditing(next);
    setSelectedId(null); setSelectedType(null);
    walkRef.current = []; setWalkLeft(0);
    if (next) { setSupported(null); post({ type: 'lms-preview:inspect', on: true }); }
    else { post({ type: 'lms-preview:highlight', id: null }); post({ type: 'lms-preview:inspect', on: false }); }
  };

  // Changing the zone reloads the page so the engine starts again with the new theme.
  const changeZone = (z) => { setZone(z); setFrameKey((k) => k + 1); setInfo(null); setSelectedId(null); setSelectedType(null); setWalked(false); walkRef.current = []; setWalkLeft(0); if (editing) setSupported(null); };

  // Every card (screen) of the lesson, in play order, read from the experience.json already loaded.
  const cards = [];
  ((experience && experience.activities) || []).forEach((a, activityIndex) => {
    (a.screens || []).forEach((s, screenIndex) => {
      cards.push({ id: s.id, title: s.title, type: s.type || 'card', activityId: a.id, activityIndex, screenIndex });
    });
  });

  // Asks the engine to open that card (message lms-preview:goto; the engine must support it).
  const openCard = (c) => {
    walkRef.current = []; setWalkLeft(0);
    gotoRef.current = c;
    setOpenCardId(c.id);
    setSelectedId(null); setSelectedType(null);
    post({ type: 'lms-preview:highlight', id: null });
    post({ type: 'lms-preview:goto', activityId: c.activityId, screenId: c.id, activityIndex: c.activityIndex, screenIndex: c.screenIndex });
  };

  // Once the player answers, open every card once so the panel can list all the elements of the lesson.
  useEffect(() => {
    if (!editing || supported !== true || walked || cards.length === 0) return;
    setWalked(true);
    walkRef.current = cards.slice();
    const first = walkRef.current.shift();
    setWalkLeft(walkRef.current.length);
    gotoRef.current = first;
    setOpenCardId(first.id);
    post({ type: 'lms-preview:goto', activityId: first.activityId, screenId: first.id, activityIndex: first.activityIndex, screenIndex: first.screenIndex });
  });

  // A card that never answers (an older player) stops the collecting instead of waiting for ever.
  useEffect(() => {
    if (walkLeft === 0) return undefined;
    const t = setTimeout(() => { walkRef.current = []; setWalkLeft(0); }, 5000);
    return () => clearTimeout(t);
  }, [walkLeft]);

  // Selects an element of any card: when it belongs to another card type, that card is opened first.
  const selectElement = (type, id) => {
    if (type === (info && info.cardType)) { setSelectedId(id); setSelectedType(type); post({ type: 'lms-preview:highlight', id }); return; }
    const card = cards.find((c) => typeOf[c.id] === type);
    if (!card) return;
    pendingSelectRef.current = { type, id };
    openCard(card);
  };

  const saveLayout = async () => {
    setSaveMsg('Saving…');
    try {
      const res = await apiFetch(`/api/v1/content/experiences/${experienceId}/layout/`, { method: 'PUT', body: JSON.stringify({ layout: changes }) });
      if (res.ok) { setSavedText(JSON.stringify((await res.json()).layout || {})); setSaveMsg('Saved with the lesson. Super Admin approval will send it in the package.'); }
      else { const d = await res.json().catch(() => ({})); setSaveMsg(d.detail || 'Could not save the layout.'); }
    } catch { setSaveMsg('Could not save the layout.'); }
  };

  const setValue = (el, key, raw) => {
    if (raw === '' || Number.isNaN(Number(raw))) return;
    const value = Number(raw);
    const cardType = info.cardType;
    setChanges((prev) => {
      const zoneChanges = { ...(prev[zone] || {}) };
      const cardChanges = { ...(zoneChanges[cardType] || {}) };
      cardChanges[el.id] = { ...(cardChanges[el.id] || {}), [key]: value };
      zoneChanges[cardType] = cardChanges;
      return { ...prev, [zone]: zoneChanges };
    });
    post({ type: 'lms-preview:style', id: el.id, props: { [key]: value } });
  };

  const valueOf = (el) => {
    const saved = ((changes[zone] || {})[info.cardType] || {})[el.id] || {};
    return { ...(el.values || {}), ...saved };
  };

  const resetAll = () => {
    post({ type: 'lms-preview:reset' });
    setChanges((prev) => ({ ...prev, [zone]: {} }));
    post({ type: 'lms-preview:inspect', on: true });
  };

  const zoneName = (ZONES.find((z) => z.id === zone) || {}).name;
  const settingsText = JSON.stringify({ version: 1, zone, zoneName, layouts: changes[zone] || {} }, null, 2);
  const hasChanges = Object.keys(changes[zone] || {}).length > 0;

  const copySettings = () => {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(settingsText).then(done).catch(() => {}); return; }
    const box = document.getElementById('lms-layout-settings');
    if (box) { box.focus(); box.select(); try { if (document.execCommand('copy')) done(); } catch { /* the text stays selected to copy by hand */ } }
  };

  if (!LMS_PREVIEW_URL) return null;
  const src = `${LMS_PREVIEW_URL}${LMS_PREVIEW_URL.includes('?') ? '&' : '?'}preview=1&zone=${zone}`;
  const selected = info && selectedType === info.cardType ? info.elements.find((el) => el.id === selectedId) : null;
  const unsaved = JSON.stringify(changes) !== savedText;
  const inputStyle = { width: '84px', padding: '0.25rem 0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Zone theme</span>
        <select value={zone} onChange={(e) => changeZone(Number(e.target.value))}
          style={{ padding: '0.3rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }}>
          {ZONES.map((z) => <option key={z.id} value={z.id}>{z.id}. {z.name}</option>)}
        </select>
        {status && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{status}</span>}
        {canEdit && (
          <button type="button" onClick={toggleEdit}
            style={{ marginLeft: 'auto', padding: '0.35rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer',
              border: '1px solid #0b57d0', background: editing ? '#0b57d0' : '#ffffff', color: editing ? '#ffffff' : '#0b57d0' }}>
            {editing ? 'Close editor' : 'Edit layout'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {experience && (
          <iframe key={frameKey} ref={frameRef} title="LMS preview" src={src} allow="microphone; autoplay"
            referrerPolicy="origin" /* the engine reads the embedding page's origin from the referrer, whatever the page's own policy */
            style={{ flex: 1, minWidth: 0, width: '100%', border: 'none', background: '#0f172a' }} />
        )}

        {canEdit && editing && (
          <div style={{ width: '340px', flexShrink: 0, background: '#ffffff', borderLeft: '1px solid #e2e8f0', overflowY: 'auto', padding: '1rem', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Layout editor</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Zone {zone} ({zoneName}){info ? ` · card: ${info.cardType}` : ''}. Changes show live and are not saved.</div>
            </div>

            {cards.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>All cards in this lesson ({cards.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
                  {cards.map((c, n) => {
                    const edited = Object.keys(((changes[zone] || {})[typeOf[c.id] || c.type]) || {}).length > 0;
                    return (
                      <button key={c.id} type="button" onClick={() => openCard(c)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: '0.4rem 0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem',
                          border: c.id === openCardId ? '1px solid #0b57d0' : '1px solid #e2e8f0', background: c.id === openCardId ? '#eff6ff' : '#ffffff', color: '#1e293b' }}>
                        <span>{n + 1}. {c.title || 'Untitled'} <span style={{ color: '#64748b' }}>· {typeOf[c.id] || c.type}</span></span>
                        {edited && <span style={{ fontSize: '0.65rem', color: '#0b57d0', fontWeight: 700 }}>edited</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>Click a card to open it in the player. Layout changes apply to every card of the same type.</div>
              </div>
            )}

            {supported === false && (
              <div style={{ fontSize: '0.8rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.7rem' }}>
                This LMS player build does not support the layout editor yet. The LMS team must add the layout messages (inspect, elements, style, highlight, reset).
              </div>
            )}
            {supported === null && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Reading the card…</div>}

            {supported && info && info.elements.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>The player reported no editable parts for this card.</div>
            )}

            {supported && walkLeft > 0 && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Reading every card of the lesson… {walkLeft} left</div>
            )}

            {supported && Object.keys(catalog).length > 0 && (
              <>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Elements of the lesson, by card type</div>
                {Object.entries(catalog).map(([type, els]) => (
                  <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{type}{type === (info && info.cardType) ? ' (on screen)' : ''}</div>
                    {els.map((el) => {
                      const changed = Object.keys((((changes[zone] || {})[type] || {})[el.id]) || {}).length > 0;
                      const on = el.id === selectedId && type === selectedType;
                      return (
                        <button key={el.id} type="button" onClick={() => selectElement(type, el.id)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: '0.45rem 0.65rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem',
                            border: on ? '1px solid #0b57d0' : '1px solid #e2e8f0', background: on ? '#eff6ff' : '#ffffff', color: '#1e293b', fontWeight: on ? 700 : 500 }}>
                          <span>{el.label || el.id}</span>
                          {changed && <span style={{ fontSize: '0.65rem', color: '#0b57d0', fontWeight: 700 }}>edited</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {selected && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{selected.label || selected.id}</div>
                    {PROP_FIELDS.filter((f) => (selected.props || []).includes(f.key)).map((f) => (
                      <label key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#475569' }}>
                        {f.label}
                        <span>
                          <input type="number" style={inputStyle} min={f.min} max={f.max}
                            value={valueOf(selected)[f.key] ?? ''} onChange={(e) => setValue(selected, f.key, e.target.value)} />
                          <span style={{ marginLeft: '4px', color: '#94a3b8' }}>{f.unit}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}

            {supported && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Settings for zone {zone} ({zoneName})</div>
                <textarea id="lms-layout-settings" readOnly value={hasChanges ? settingsText : 'No changes yet.'} rows={8}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.72rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" disabled={!hasChanges} onClick={copySettings}
                    style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', background: hasChanges ? '#0b57d0' : '#cbd5e1', color: '#fff', cursor: hasChanges ? 'pointer' : 'not-allowed' }}>
                    {copied ? 'Copied' : 'Copy settings'}
                  </button>
                  <button type="button" onClick={resetAll}
                    style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer' }}>
                    Reset
                  </button>
                </div>
                <button type="button" onClick={saveLayout} disabled={!unsaved}
                  style={{ padding: '0.5rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', border: 'none', background: unsaved ? '#16a34a' : '#cbd5e1', color: '#fff', cursor: unsaved ? 'pointer' : 'not-allowed' }}>
                  {unsaved ? 'Save layout with this lesson' : 'Layout saved'}
                </button>
                {saveMsg && <div style={{ fontSize: '0.72rem', color: '#475569' }}>{saveMsg}</div>}
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>The saved layout is part of the lesson. When Super Admin approves the lesson, the package carries it and the LMS shows the elements at these places and sizes.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LmsEnginePreview;
