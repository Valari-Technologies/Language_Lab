import React from 'react';
import { 
  FiVolume2, FiImage, FiMonitor, FiFileText, FiEdit2, FiMic, 
  FiMove, FiCheckCircle, FiList, FiPlusCircle, FiLayers 
} from 'react-icons/fi';
import { API_BASE_URL } from './config';

const defaultResolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = url.startsWith('/') ? url : '/' + url;
  return `${base}${path}`;
};

export default function PreviewCanvasRenderer({
  elements = [],
  activeScreenId = '',
  previewAnswers = {},
  setPreviewAnswers = () => {},
  voiceRecordingStates = {},
  setVoiceRecordingStates = () => {},
  dragDropSelections = {},
  setDragDropSelections = () => {},
  blankAnswers = {},
  setBlankAnswers = () => {},
  flippedCards = {},
  setFlippedCards = () => {},
  resolveUrl = defaultResolveUrl
}) {
  const renderSingleBlock = (block) => {
    switch (block.type) {
      case 'heading':
        return (
          <div style={{ textAlign: (block.styles?.alignment || 'Center').toLowerCase(), marginBottom: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{
              fontFamily: block.styles?.fontFamily || 'Poppins',
              fontSize: `${(parseInt(block.styles?.fontSize) || 36) * 0.72}px`,
              fontWeight: block.styles?.fontWeight === 'Bold' ? 800 : block.styles?.fontWeight === 'SemiBold' ? 600 : 400,
              color: block.styles?.color || '#1e293b',
              lineHeight: 1.25,
              display: 'inline-block'
            }}>
              {block.content?.text || ''}
            </span>
          </div>
        );

      case 'text':
        return (
          <div style={{
            textAlign: (block.styles?.alignment || 'Left').toLowerCase(),
            fontFamily: block.styles?.fontFamily || 'Poppins',
            fontSize: block.styles?.fontSize || '15px',
            fontWeight: block.styles?.fontWeight === 'Bold' ? 700 : block.styles?.fontWeight === 'SemiBold' ? 600 : 400,
            color: block.styles?.color || '#334155',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            marginBottom: '0.5rem',
            flex: 1,
            height: '100%'
          }}>
            {block.content?.text || ''}
          </div>
        );

      case 'image':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1, height: '100%', width: '100%' }}>
            {block.content?.url ? (
              <div style={{ width: '100%', height: '100%', flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={resolveUrl(block.content.url)}
                  alt="Visual presentation"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', flex: 1, border: '1.5px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <FiImage style={{ fontSize: '2rem', marginBottom: '4px', opacity: 0.6 }} />
                <span style={{ fontSize: '0.72rem' }}>No image asset configured.</span>
              </div>
            )}
            {block.content?.caption && (
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>{block.content.caption}</span>
            )}
          </div>
        );

      case 'audio':
        return (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, height: '100%', boxSizing: 'border-box', width: '100%' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>
              <FiVolume2 />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.content?.title || 'Voice Instruction'}</div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 1 }}>{block.content?.url ? 'Audio track attached' : 'No track attached'}</div>
            </div>
            {block.content?.url && (
              <audio src={resolveUrl(block.content.url)} controls style={{ width: '180px', height: '32px', flexShrink: 0 }} />
            )}
          </div>
        );

      case 'video':
        return (
          <div className="video-element-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, width: '100%', height: '100%' }}>
            {block.content?.url ? (
              <div style={{ width: '100%', height: '100%', flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video src={resolveUrl(block.content.url)} controls style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }} />
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', flex: 1, border: '1.5px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <FiMonitor style={{ fontSize: '2rem', marginBottom: '4px', opacity: 0.6 }} />
                <span style={{ fontSize: '0.72rem' }}>No video asset configured.</span>
              </div>
            )}
          </div>
        );

      case 'dialogue':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.5rem 0' }}>
            {(block.content?.steps || []).map((st, i) => {
              const isLeft = st.side !== 'right';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: isLeft ? 'flex-start' : 'flex-end',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    flexDirection: isLeft ? 'row' : 'row-reverse'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: st.avatarColor || '#0ea5e9',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    flexShrink: 0
                  }}>{st.name ? st.name.charAt(0).toUpperCase() : '?'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isLeft ? 'flex-start' : 'flex-end' }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginBottom: '2px', padding: '0 4px' }}>{st.name}</span>
                    <div style={{
                      background: isLeft ? '#f1f5f9' : '#0b57d0',
                      color: isLeft ? '#1e293b' : '#ffffff',
                      padding: '0.65rem 0.95rem',
                      borderRadius: isLeft ? '0 12px 12px 12px' : '12px 0 12px 12px',
                      fontSize: '0.82rem',
                      lineHeight: 1.45,
                      maxWidth: '340px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: isLeft ? '1px solid #e2e8f0' : 'none'
                    }}>{st.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'quiz':
        const blockAnswerKey = `${activeScreenId}_${block.id}`;
        const selectedAnsIndex = previewAnswers[blockAnswerKey];
        const hasSelected = selectedAnsIndex !== undefined;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            <div style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: '10px', padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 700, color: '#c2410c', boxShadow: '0 2px 4px rgba(249,115,22,0.04)' }}>
              ❓ {block.content?.question || 'Quiz question text label...'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {(block.content?.options || ['', '', '', '']).map((opt, oIdx) => {
                const isCorrectAnswer = parseInt(block.content?.correctAnswerIndex) === oIdx;
                const isSelected = selectedAnsIndex === oIdx;

                let borderCol = '#cbd5e1';
                let bgCol = '#ffffff';
                let textCol = '#1e293b';

                if (hasSelected) {
                  if (isCorrectAnswer) {
                    borderCol = '#16a34a';
                    bgCol = '#ecfdf5';
                    textCol = '#15803d';
                  } else if (isSelected) {
                    borderCol = '#ef4444';
                    bgCol = '#fef2f2';
                    textCol = '#b91c1c';
                  }
                }

                return (
                  <div
                    key={oIdx}
                    onClick={() => {
                      if (!hasSelected) {
                        setPreviewAnswers(prev => ({
                          ...prev,
                          [blockAnswerKey]: oIdx
                        }));
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      background: bgCol,
                      border: `2px solid ${borderCol}`,
                      borderRadius: '10px',
                      padding: '0.85rem 1.1rem',
                      fontSize: '0.82rem',
                      cursor: hasSelected ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1.5px solid #cbd5e1',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 'bold',
                      background: isSelected || (hasSelected && isCorrectAnswer) ? borderCol : 'none',
                      color: isSelected || (hasSelected && isCorrectAnswer) ? '#ffffff' : '#64748b',
                      borderColor: borderCol
                    }}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span style={{ fontWeight: 600, color: textCol }}>{(typeof opt === 'object' ? opt?.text : opt) || `Quiz Option ${oIdx + 1}`}</span>

                    {hasSelected && isCorrectAnswer && (
                      <span style={{ marginLeft: 'auto', color: '#16a34a', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        ✓ Correct Choice
                      </span>
                    )}
                    {hasSelected && isSelected && !isCorrectAnswer && (
                      <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: '0.72rem', fontWeight: 'bold' }}>
                        ✗ Incorrect Choice
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {hasSelected && (
              <button
                onClick={() => {
                  setPreviewAnswers(prev => {
                    const updated = { ...prev };
                    delete updated[blockAnswerKey];
                    return updated;
                  });
                }}
                style={{ alignSelf: 'flex-end', border: 'none', background: 'none', color: '#0b57d0', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
              >
                ↺ Reset Answer Choice
              </button>
            )}
          </div>
        );

      case 'voice_recorder':
        const blockRecordKey = `${activeScreenId}_${block.id}`;
        const isRecording = voiceRecordingStates[blockRecordKey];
        return (
          <div style={{ border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 12px rgba(217,119,6,0.05)', margin: '0.5rem 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: isRecording ? '#ef4444' : '#d97706',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              cursor: 'pointer',
              boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.2)' : '0 2px 8px rgba(217,119,6,0.2)',
              animation: isRecording ? 'pulse 1.5s infinite' : 'none',
              transition: 'all 0.2s'
            }} onClick={() => {
              setVoiceRecordingStates(prev => ({
                ...prev,
                [blockRecordKey]: !isRecording
              }));
            }}>
              <FiMic />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#b45309' }}>
                {isRecording ? 'Recording audio response...' : 'Microphone Speaking Practice'}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px', maxWidth: '320px' }}>
                {block.content?.prompt || 'Record your response now.'}
              </p>
            </div>

            {isRecording && (
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '20px' }}>
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      width: '3px',
                      height: `${h * 4}px`,
                      background: '#ef4444',
                      borderRadius: '3px',
                      animation: `bounceWave 0.6s infinite alternate ${i * 0.08}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'drag_drop':
        const list = block.content?.pairs || [];
        const dragQuestion = block.content?.question || 'Match items by dragging';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af' }}>
              🔀 {dragQuestion}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {list.map((pair, pIdx) => {
                const selected = dragDropSelections[`${block.id}_${pair.id || pIdx}`] || '';
                return (
                  <div key={pair.id || pIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.72rem' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{pair.source || pair.left}</span>
                    <select
                      value={selected}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDragDropSelections(prev => ({
                          ...prev,
                          [`${block.id}_${pair.id || pIdx}`]: val
                        }));
                      }}
                      style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.7rem', color: '#1e293b', outline: 'none' }}
                    >
                      <option value="">Select match...</option>
                      {list.map((p, idx) => (
                        <option key={idx} value={p.target || p.right}>{p.target || p.right}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'fill_blank':
      case 'fill_blanks':
        const fillText = block.content?.text || 'Type the blanks [blank1]';
        const fillQuestion = block.content?.question || 'Fill in the missing words';
        const parts = fillText.split(/(\[.*?\])/g);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f0fdfa', padding: '1rem', borderRadius: '12px', border: '1px solid #ccfbf1', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f766e' }}>
              ✏️ {fillQuestion}
            </div>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.8, color: '#1e293b', background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccfbf1' }}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('[') && part.endsWith(']')) {
                  const key = `${block.id}-${pIdx}`;
                  const ans = blankAnswers[key] || '';
                  return (
                    <input
                      key={pIdx}
                      type="text"
                      value={ans}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBlankAnswers(prev => ({
                          ...prev,
                          [key]: val
                        }));
                      }}
                      placeholder="..."
                      style={{ width: '80px', borderBottom: '2px solid #0d9488', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'center', fontWeight: 700, color: '#0f766e', outline: 'none', padding: '0 4px', margin: '0 4px', fontSize: '0.75rem' }}
                    />
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          </div>
        );

      case 'match':
        const leftItems = block.content?.leftItems || [];
        const rightItems = block.content?.rightItems || [];
        const matchQuestion = block.content?.question || 'Match the columns';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fdf2f8', padding: '1rem', borderRadius: '12px', border: '1px solid #fbcfe8', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#9d174d' }}>
              🔗 {matchQuestion}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {leftItems.map((left, pIdx) => {
                const selected = dragDropSelections[`${block.id}_${pIdx}`] || '';
                return (
                  <div key={pIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #fbcfe8', fontSize: '0.72rem' }}>
                    <span style={{ fontWeight: 600, color: '#9d174d' }}>{left}</span>
                    <select
                      value={selected}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDragDropSelections(prev => ({
                          ...prev,
                          [`${block.id}_${pIdx}`]: val
                        }));
                      }}
                      style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #fbcfe8', fontSize: '0.7rem', color: '#9d174d', outline: 'none' }}
                    >
                      <option value="">Select match...</option>
                      {rightItems.map((right, idx) => (
                        <option key={idx} value={right}>{right}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'sequence':
        const items = block.content?.items || [];
        const seqQuestion = block.content?.question || 'Sort items in correct sequence';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>
              🔢 {seqQuestion}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.55rem 0.75rem', borderRadius: '8px', fontSize: '0.72rem', color: '#1e293b' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.68rem' }}>
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'flashcard':
        const cards = block.content?.cards || [];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#be185d', textAlign: 'center' }}>🗂️ Interactive Flashcards</div>
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', width: '100%' }}>
              {cards.map((card, cIdx) => {
                const isFlipped = flippedCards[`${block.id}-${cIdx}`];
                return (
                  <div
                    key={card.id || cIdx}
                    onClick={() => {
                      setFlippedCards(prev => ({
                        ...prev,
                        [`${block.id}-${cIdx}`]: !prev[`${block.id}-${cIdx}`]
                      }));
                    }}
                    style={{
                      flexShrink: 0,
                      width: '130px',
                      height: '90px',
                      background: isFlipped ? '#fdf2f8' : '#ffffff',
                      border: isFlipped ? '2px solid #ec4899' : '1px solid #cbd5e1',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem',
                      textAlign: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isFlipped ? '#be185d' : '#1e293b' }}>
                      {isFlipped ? card.back : card.front}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '8px' }}>
                      {isFlipped ? 'Show front' : 'Click to flip'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'sentence_builder':
        const sentenceQuestion = block.content?.question || 'Reorder the words to make a correct sentence.';
        const sentenceWords = block.content?.words || [];
        const selection = dragDropSelections[block.id] || [];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ecfeff', padding: '1rem', borderRadius: '12px', border: '1px solid #a5f3fc', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0891b2' }}>
              🧩 {sentenceQuestion}
            </div>

            <div style={{ minHeight: '38px', padding: '0.5rem', background: '#ffffff', borderRadius: '8px', border: '1.5px dashed #06b6d4', display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
              {selection.length === 0 ? (
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Click words below...</span>
              ) : (
                selection.map((word, wIdx) => (
                  <button
                    key={wIdx}
                    type="button"
                    onClick={() => {
                      setDragDropSelections(prev => ({
                        ...prev,
                        [block.id]: (prev[block.id] || []).filter((_, idx) => idx !== wIdx)
                      }));
                    }}
                    style={{ background: '#06b6d4', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {word} ×
                  </button>
                ))
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {sentenceWords.map((word, wIdx) => {
                const isUsed = selection.includes(word);
                return (
                  <button
                    key={wIdx}
                    type="button"
                    disabled={isUsed}
                    onClick={() => {
                      setDragDropSelections(prev => ({
                        ...prev,
                        [block.id]: [...(prev[block.id] || []), word]
                      }));
                    }}
                    style={{
                      background: isUsed ? '#e2e8f0' : '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: isUsed ? '#94a3b8' : '#0891b2',
                      cursor: isUsed ? 'default' : 'pointer'
                    }}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'word_search':
      case 'crossword':
        const wordQuestion = block.content?.question || 'Word Search Puzzle';
        const grid = [
          ['L', 'A', 'N', 'G', 'U', 'A', 'G', 'E'],
          ['E', 'X', 'P', 'E', 'R', 'I', 'E', 'N'],
          ['A', 'C', 'T', 'I', 'V', 'I', 'T', 'Y'],
          ['S', 'C', 'R', 'E', 'E', 'N', 'P', 'C']
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#faf5ff', padding: '1rem', borderRadius: '12px', border: '1px solid #f3e8ff', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6b21a8' }}>
              🔍 {wordQuestion}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', maxWidth: '240px', margin: '0 auto', background: '#f3e8ff', padding: '4px', borderRadius: '8px' }}>
              {grid.flatMap((row, rIdx) => row.map((char, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  style={{
                    aspectRatio: '1',
                    background: '#ffffff',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#6b21a8',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    const currBg = e.currentTarget.style.backgroundColor;
                    e.currentTarget.style.backgroundColor = currBg === 'rgb(216, 180, 254)' ? '#ffffff' : '#d8b4fe';
                  }}
                >
                  {char}
                </div>
              )))}
            </div>
          </div>
        );

      case 'reading_passage':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #cbd5e1', background: '#f1f5f9', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiFileText /> Reading Passage: {block.content?.title || 'Passage Title'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#334155', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', whiteSpace: 'pre-wrap', flex: 1, overflowY: 'auto' }}>
              {block.content?.passage || 'Read this text carefully...'}
            </div>
            {block.content?.question && (
              <div style={{ fontSize: '0.7rem', color: '#475569', fontStyle: 'italic' }}>
                Question: {block.content?.question}
              </div>
            )}
            <button disabled style={{ width: 'fit-content', padding: '4px 12px', borderRadius: '20px', background: '#10b981', color: '#fff', border: 'none', fontSize: '0.68rem', fontWeight: 600 }}>Mark as Read</button>
          </div>
        );

      case 'writing_prompt':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fbcfe8', background: '#fdf2f8', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9d174d', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiEdit2 /> Writing Prompt (Word Count Gate)
            </div>
            <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
              Prompt: {block.content?.prompt || 'Write about your favorite hobby.'}
            </div>
            <textarea disabled placeholder={block.content?.placeholder || 'Start writing here...'} style={{ width: '100%', flex: 1, height: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '6px', fontSize: '0.72rem', background: '#f8fafc', resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#9d174d', fontWeight: 600 }}>
              <span>Minimum word count: {block.content?.minWords || 10} words</span>
              <span>0 words</span>
            </div>
          </div>
        );

      case 'dictation':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiVolume2 /> Dictation (Listening Module)
            </div>
            <div style={{ fontSize: '0.72rem', color: '#475569' }}>
              <strong>Prompt/Question:</strong> {block.content?.question || 'Listen and type what you hear.'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', wordBreak: 'break-all' }}>
              Audio Source: {block.content?.url || '(No audio file selected)'}
            </div>
            <input type="text" disabled placeholder="User types response here..." style={{ width: '100%', height: '30px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '0.72rem', background: '#f8fafc' }} />
          </div>
        );

      case 'grammar_correction':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #a7f3d0', background: '#ecfdf5', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCheckCircle /> Grammar Correction
            </div>
            <div style={{ fontSize: '0.72rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '6px' }}>
              <strong>Incorrect:</strong> {block.content?.incorrectSentence || 'They is going to school.'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#15803d', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '6px', padding: '6px' }}>
              <strong>Corrected:</strong> {block.content?.correctedSentence || 'They are going to school.'}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes bounceWave {
          0% { height: 4px; }
          100% { height: 20px; }
        }
      `}</style>

      {elements.map((block) => (
        <div
          key={block.id}
          className={block.styles?.customClass || ''}
          style={{
            position: 'absolute',
            left: block.styles?.left || '0px',
            top: block.styles?.top || '0px',
            width: block.styles?.blockWidth || '100%',
            minHeight: block.styles?.minHeight || 'auto',
            height: block.styles?.minHeight || 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            marginBottom: '0.25rem',
            transition: 'all 0.15s',
            zIndex: block.styles?.zIndex || 1
          }}
        >
          {renderSingleBlock(block)}
        </div>
      ))}
    </>
  );
}
