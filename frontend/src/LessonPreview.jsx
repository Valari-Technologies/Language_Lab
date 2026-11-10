import React, { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { apiFetch } from './api';
import { API_BASE_URL } from './config';
import PreviewCanvasRenderer from './PreviewCanvasRenderer';

// Teacher portal: the "View" page of a lesson card. It shows the lesson the way a student sees it: an activity and
// screen navigator on the left, the screen in the middle and Previous / Next Screen below. Nothing is saved.

const resolveUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};

// A screen saved with its elements shows them; an older screen saved only with content is turned into one block.
const screenElements = (screen) => {
  if (!screen) return [];
  if (screen.elements && screen.elements.length > 0) return screen.elements;
  const c = screen.content || {};
  const type = (screen.screen_type || '').toUpperCase();
  const id = `block-${screen.id}`;
  const questions = Array.isArray(c.questions) ? c.questions : [];
  if (c.mediaType === 'multimedia' || ((c.audioUrl || c.videoUrl) && questions.length > 0)) {
    return [{ id, type: 'multimedia_reading_assessment', content: {
      mediaType: c.mediaType || (c.videoUrl ? 'video' : 'audio'), audioUrl: c.audioUrl || '', videoUrl: c.videoUrl || '',
      scenario: c.scenario || '', documentText: c.documentText || '', questions } }];
  }
  if (type === 'QUIZ' || type === 'ASSESSMENT' || c.quiz_question || questions.length > 0) {
    return [{ id, type: 'quiz', content: {
      question: c.quiz_question || questions[0]?.question || c.question || 'Quiz question',
      options: c.quiz_options || questions[0]?.options || c.options || [],
      correctAnswerIndex: c.quiz_correct_index ?? questions[0]?.correctAnswerIndex ?? 0,
      questions: questions.length > 0 ? questions : undefined } }];
  }
  if (type === 'IMAGE' || (c.media_url && c.media_type === 'IMAGE')) {
    return [{ id, type: 'image', content: { url: c.media_url || '', caption: c.caption || c.text || '' } }];
  }
  if (type === 'VIDEO' || (c.media_url && c.media_type === 'VIDEO')) {
    return [{ id, type: 'video', content: { url: c.media_url || '' } }];
  }
  if (type === 'SPEAKING' || (c.media_url && c.media_type === 'AUDIO')) {
    return [{ id, type: 'audio', content: { title: c.title || 'Audio Practice', url: c.media_url || '' } }];
  }
  return [];
};

const LessonPreview = ({ experienceId, title, onBack }) => {
  const [activities, setActivities] = useState(null); // null while loading
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(0); // position in the flat list of screens
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [voiceRecordingStates, setVoiceRecordingStates] = useState({});
  const [dragDropSelections, setDragDropSelections] = useState({});
  const [blankAnswers, setBlankAnswers] = useState({});
  const [flippedCards, setFlippedCards] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/v1/content/experiences/${experienceId}/preview/`);
        if (!alive) return;
        if (!res.ok) { setError('This lesson could not be opened.'); setActivities([]); return; }
        const data = await res.json();
        setActivities(data.activities || data.payload?.activities || []);
      } catch {
        if (alive) { setError('This lesson could not be opened.'); setActivities([]); }
      }
    })();
    return () => { alive = false; };
  }, [experienceId]);

  const flat = useMemo(() => {
    const list = [];
    (activities || []).forEach((act, actIdx) => (act.screens || []).forEach((scr) => list.push({ screen: scr, actIdx })));
    return list;
  }, [activities]);

  const active = flat[current];
  const elements = screenElements(active && active.screen);
  const go = (i) => setCurrent(Math.max(0, Math.min(flat.length - 1, i)));

  const nav = { padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155' };

  let index = -1; // position of each screen in the navigator, in the same order as `flat`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem', padding: 0 }}>
          <FiArrowLeft /> Back to lessons
        </button>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>{title}</div>
      </div>

      {activities === null ? (
        <div style={{ padding: '2rem', color: '#64748b' }}>Opening the lesson…</div>
      ) : flat.length === 0 ? (
        <div style={{ padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          {error || 'This lesson has no screens yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 280px) 1fr', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', minHeight: '70vh' }}>
          <div style={{ padding: '1.25rem', borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Experience Navigator</div>
            {activities.map((act, actIdx) => (
              <div key={act.id || actIdx} style={{ marginBottom: '0.9rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', padding: '2px 4px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                  Act {actIdx + 1}: {act.title}
                </div>
                {(act.screens || []).map((scr, i) => {
                  index += 1;
                  const mine = index;
                  const on = mine === current;
                  return (
                    <button key={scr.id || i} type="button" onClick={() => go(mine)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.78rem', fontWeight: on ? 600 : 500,
                        background: on ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent', color: on ? '#ffffff' : '#475569' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: on ? '#ffffff' : '#10b981' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {scr.title || 'Untitled Screen'}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', background: '#f1f5f9', minWidth: 0 }}>
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxSizing: 'border-box', fontFamily: active.screen.content?.font || 'Poppins' }}>
                {elements.length > 0 ? (
                  <PreviewCanvasRenderer
                    elements={elements}
                    activeScreenId={active.screen.id || ''}
                    previewAnswers={previewAnswers} setPreviewAnswers={setPreviewAnswers}
                    voiceRecordingStates={voiceRecordingStates} setVoiceRecordingStates={setVoiceRecordingStates}
                    dragDropSelections={dragDropSelections} setDragDropSelections={setDragDropSelections}
                    blankAnswers={blankAnswers} setBlankAnswers={setBlankAnswers}
                    flippedCards={flippedCards} setFlippedCards={setFlippedCards}
                    resolveUrl={resolveUrl}
                  />
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>This screen has no content yet.</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
              <button type="button" disabled={current === 0} onClick={() => go(current - 1)} style={{ ...nav, cursor: current === 0 ? 'not-allowed' : 'pointer' }}>← Previous Screen</button>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Screen {current + 1} of {flat.length}</span>
              <button type="button" disabled={current === flat.length - 1} onClick={() => go(current + 1)} style={{ ...nav, cursor: current === flat.length - 1 ? 'not-allowed' : 'pointer' }}>Next Screen →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPreview;
