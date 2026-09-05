import React from 'react';
import { 
  FiVolume2, FiImage, FiMonitor, FiFileText, FiEdit2, FiMic, 
  FiCheckCircle,
  FiActivity, FiType, FiGrid, FiHelpCircle, FiUsers
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
              fontFamily: block.styles?.fontFamily === 'Georgia' ? 'Georgia, serif' : block.styles?.fontFamily === 'Inter' ? "'Inter', sans-serif" : block.styles?.fontFamily === 'Roboto' ? "'Roboto', sans-serif" : block.styles?.fontFamily ? `'${block.styles.fontFamily}', sans-serif` : "'Poppins', sans-serif",
              fontSize: `${(parseInt(block.styles?.fontSize) || 36) * 0.72}px`,
              fontWeight: (block.styles?.fontWeight || '').toLowerCase() === 'bold' || block.styles?.fontWeight === '700' ? 700 : (block.styles?.fontWeight || '').toLowerCase() === 'semibold' || block.styles?.fontWeight === '600' ? 600 : 400,
              color: block.styles?.color || '#1e293b',
              lineHeight: 1.25,
              display: 'inline-block',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}>
              {block.content?.text || ''}
            </span>
          </div>
        );

      case 'text':
        return (
          <div style={{
            textAlign: (block.styles?.alignment || 'Left').toLowerCase(),
            fontFamily: block.styles?.fontFamily === 'Georgia' ? 'Georgia, serif' : block.styles?.fontFamily === 'Inter' ? "'Inter', sans-serif" : block.styles?.fontFamily === 'Roboto' ? "'Roboto', sans-serif" : block.styles?.fontFamily ? `'${block.styles.fontFamily}', sans-serif` : "'Poppins', sans-serif",
            fontSize: block.styles?.fontSize || '15px',
            fontWeight: (block.styles?.fontWeight || '').toLowerCase() === 'bold' || block.styles?.fontWeight === '700' ? 700 : (block.styles?.fontWeight || '').toLowerCase() === 'semibold' || block.styles?.fontWeight === '600' ? 600 : 400,
            color: block.styles?.color || '#334155',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            marginBottom: '0.5rem',
            flex: 1,
            height: '100%',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            overflow: 'hidden'
          }}>
            {block.content?.text || ''}
          </div>
        );

      case 'image':
        const imgBlockAnswerKey = `${activeScreenId}_${block.id}`;
        const selectedImgAns = previewAnswers[imgBlockAnswerKey];
        const hasImgSelected = selectedImgAns !== undefined;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1, height: block.styles?.height || '100%', width: '100%' }}>
            {block.content?.url ? (
              <div style={{ width: '100%', height: '100%', flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={resolveUrl(block.content.url)}
                  alt="Visual presentation"
                  style={{ width: '100%', height: '100%', objectFit: block.styles?.objectFit || 'contain' }}
                />
              </div>
            ) : (
              <div style={{ width: '100%', height: block.styles?.height || '220px', flex: 1, border: '1.5px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <FiImage style={{ fontSize: '2rem', marginBottom: '4px', opacity: 0.6 }} />
                <span style={{ fontSize: '0.72rem' }}>No image asset configured.</span>
              </div>
            )}
            {block.content?.caption && (
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>{block.content.caption}</span>
            )}
            {block.content?.hasQuestion && (
              <div style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'left', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                  {block.content.questionText || 'Answer the question:'}
                </div>
                {block.content.questionOptions && block.content.questionOptions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {block.content.questionOptions.map((opt, oIdx) => {
                      const isCorrect = (block.content.correctAnswer || '').trim().toLowerCase() === opt.trim().toLowerCase();
                      const isSelected = selectedImgAns === opt || selectedImgAns === oIdx;

                      let borderCol = '#cbd5e1';
                      let bgCol = '#ffffff';
                      let textCol = '#1e293b';

                      if (hasImgSelected) {
                        if (isCorrect) {
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
                            if (!hasImgSelected) {
                              setPreviewAnswers(prev => ({
                                ...prev,
                                [imgBlockAnswerKey]: opt
                              }));
                            }
                          }}
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: '6px',
                            border: `1.5px solid ${borderCol}`,
                            background: bgCol,
                            color: textCol,
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: hasImgSelected ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span>{opt}</span>
                          {hasImgSelected && isCorrect && <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>✓ Correct</span>}
                          {hasImgSelected && isSelected && !isCorrect && <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>✗ Incorrect</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
          <div className="video-element-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, width: '100%', height: block.styles?.height || '100%' }}>
            {block.content?.url ? (
              <div style={{ width: '100%', height: '100%', flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video src={resolveUrl(block.content.url)} controls style={{ width: '100%', height: '100%', display: 'block', objectFit: block.styles?.objectFit || 'contain' }} />
              </div>
            ) : (
              <div style={{ width: '100%', height: block.styles?.height || '220px', flex: 1, border: '1.5px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <FiMonitor style={{ fontSize: '2rem', marginBottom: '4px', opacity: 0.6 }} />
                <span style={{ fontSize: '0.72rem' }}>No video asset configured.</span>
              </div>
            )}
          </div>
        );

      case 'quiz':
        {
          const rawQuestions = block.content?.questions;
          const questionsList = rawQuestions && rawQuestions.length > 0
            ? rawQuestions
            : [{
                question: block.content?.question || 'Quiz question text label...',
                options: block.content?.options || ['', '', '', ''],
                correctAnswerIndex: block.content?.correctAnswerIndex ?? 0
              }];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', height: '100%', padding: '2px 0' }}>
              {questionsList.map((qObj, qIdx) => {
                const blockAnswerKey = `${activeScreenId}_${block.id}_q${qIdx}`;
                const selectedAnsIndex = previewAnswers[blockAnswerKey];
                const hasSelected = selectedAnsIndex !== undefined;
                const qText = qObj.question || `Question #${qIdx + 1}`;
                const options = qObj.options || ['', '', '', ''];
                const correctIdx = parseInt(qObj.correctAnswerIndex ?? qObj.correctAnswer) || 0;

                return (
                  <div key={qIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: '#c2410c', boxShadow: '0 2px 4px rgba(249,115,22,0.04)' }}>
                      ❓ {questionsList.length > 1 ? `#${qIdx + 1}: ` : ''}{qText}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {options.map((opt, oIdx) => {
                        const isCorrectAnswer = correctIdx === oIdx;
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

                        const optionText = typeof opt === 'object' ? opt?.text : opt;

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
                              gap: '0.5rem',
                              background: bgCol,
                              border: `1.5px solid ${borderCol}`,
                              borderRadius: '6px',
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.72rem',
                              cursor: hasSelected ? 'default' : 'pointer',
                              transition: 'all 0.15s',
                              boxSizing: 'border-box',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                          >
                            <span style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              border: `1px solid ${borderCol}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.55rem',
                              fontWeight: 'bold',
                              background: hasSelected && isCorrectAnswer ? '#16a34a' : 'none',
                              color: hasSelected && isCorrectAnswer ? '#ffffff' : textCol
                            }}>{String.fromCharCode(65 + oIdx)}</span>
                            <span style={{ color: textCol, fontWeight: isSelected || (hasSelected && isCorrectAnswer) ? 600 : 400 }}>
                              {optionText || `Option ${oIdx + 1}`}
                            </span>
                            {hasSelected && isCorrectAnswer && (
                              <span style={{ marginLeft: 'auto', color: '#16a34a', fontSize: '0.58rem', fontWeight: 'bold' }}>
                                ✓ Correct
                              </span>
                            )}
                            {hasSelected && isSelected && !isCorrectAnswer && (
                              <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: '0.58rem', fontWeight: 'bold' }}>
                                ✗ Incorrect
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

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
        const fillQuestion = block.content?.question || 'Fill in the missing words';
        const fillItems = block.content?.items || (block.content?.text ? [{ id: 'migrated', text: block.content.text }] : []);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f0fdfa', padding: '1rem', borderRadius: '12px', border: '1px solid #ccfbf1', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f766e' }}>
              ✏️ {fillQuestion}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {fillItems.map((item, itemIdx) => {
                const itemText = item.text || '';
                const itemParts = itemText.split(/(\[.*?\])/g);
                return (
                  <div key={item.id || itemIdx} style={{ fontSize: '0.78rem', lineHeight: 1.8, color: '#1e293b', background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccfbf1' }}>
                    {itemParts.map((part, pIdx) => {
                      if (part.startsWith('[') && part.endsWith(']')) {
                        const key = `${block.id}-${itemIdx}-${pIdx}`;
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
                );
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
        {
          const blockSeqKey = `${activeScreenId}_${block.id}`;
          const originalItems = block.content?.items || [];
          const seqQuestion = block.content?.question || 'Arrange the items in the correct order.';
          
          let activeOrder = previewAnswers[blockSeqKey];
          if (!activeOrder) {
            // Shuffle initially so student has to rearrange it
            activeOrder = [...originalItems];
          }
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
                  🔢 {seqQuestion}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const shuffled = [...originalItems].sort(() => Math.random() - 0.5);
                    setPreviewAnswers(prev => ({
                      ...prev,
                      [blockSeqKey]: shuffled
                    }));
                  }}
                  style={{ background: 'none', border: '1px solid #b45309', color: '#b45309', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', cursor: 'pointer' }}
                >
                  Shuffle Items
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                {activeOrder.map((item, idx) => (
                  <div key={idx} style={{ background: '#ffffff', border: '1px solid #fef3c7', borderRadius: '6px', padding: '6px 8px', fontSize: '0.72rem', fontWeight: 600, color: '#451a03', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: '#fef3c7', color: '#b45309', borderRadius: '4px', padding: '1px 5px', fontSize: '0.62rem', fontWeight: 800 }}>{idx + 1}</span>
                    <span style={{ flex: 1 }}>{item || `Step description ${idx + 1}`}</span>
                    
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        const updated = [...activeOrder];
                        const temp = updated[idx];
                        updated[idx] = updated[idx - 1];
                        updated[idx - 1] = temp;
                        setPreviewAnswers(prev => ({
                          ...prev,
                          [blockSeqKey]: updated
                        }));
                      }}
                      style={{ background: 'none', border: 'none', color: idx === 0 ? '#cbd5e1' : '#b45309', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '0.75rem' }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === activeOrder.length - 1}
                      onClick={() => {
                        const updated = [...activeOrder];
                        const temp = updated[idx];
                        updated[idx] = updated[idx + 1];
                        updated[idx + 1] = temp;
                        setPreviewAnswers(prev => ({
                          ...prev,
                          [blockSeqKey]: updated
                        }));
                      }}
                      style={{ background: 'none', border: 'none', color: idx === activeOrder.length - 1 ? '#cbd5e1' : '#b45309', cursor: idx === activeOrder.length - 1 ? 'default' : 'pointer', fontSize: '0.75rem' }}
                    >
                      ▼
                    </button>
                  </div>
                ))}
              </div>
              
              {JSON.stringify(activeOrder) === JSON.stringify(originalItems) && originalItems.length > 0 && (
                <span style={{ color: '#16a34a', fontSize: '0.68rem', fontWeight: 700, marginTop: '4px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  ✓ Correct Order!
                </span>
              )}
            </div>
          );
        }

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
        const rawSentencesList = block.content?.sentences;
        const sentencesList = rawSentencesList && rawSentencesList.length > 0
          ? rawSentencesList
          : [{ question: block.content?.question || '', sentence: block.content?.sentence || '', words: block.content?.words || [] }];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#ecfeff', padding: '0.85rem', borderRadius: '12px', border: '1px solid #a5f3fc', flex: 1, overflowY: 'auto' }}>
            {sentencesList.map((item, sIdx) => {
              const sentenceQuestion = item.question || 'Reorder the words to make a correct sentence.';
              const sentenceWords = item.words && item.words.length > 0
                ? item.words
                : (item.sentence?.trim() ? item.sentence.trim().split(' ').filter(Boolean) : []);
              const selectionKey = `${block.id}_${sIdx}`;
              const selection = dragDropSelections[selectionKey] || [];

              return (
                <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderBottom: sIdx < sentencesList.length - 1 ? '1px dashed #a5f3fc' : 'none', paddingBottom: sIdx < sentencesList.length - 1 ? '0.75rem' : 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0891b2' }}>
                    🧩 {sentenceQuestion}
                  </div>

                  <div style={{ minHeight: '38px', padding: '0.4rem 0.6rem', background: '#ffffff', borderRadius: '8px', border: '1.5px dashed #06b6d4', display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
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
                              [selectionKey]: (prev[selectionKey] || []).filter((_, idx) => idx !== wIdx)
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
                              [selectionKey]: [...(prev[selectionKey] || []), word]
                            }));
                          }}
                          style={{
                            background: isUsed ? '#e2e8f0' : '#ffffff',
                            color: isUsed ? '#94a3b8' : '#0891b2',
                            border: `1px solid ${isUsed ? '#cbd5e1' : '#67e8f9'}`,
                            borderRadius: '6px',
                            padding: '3px 9px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: isUsed ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'word_search':
        {
          const wordQuestion = block.content?.question || 'Word Search Puzzle';
          const gridSize = block.content?.gridSize || 8;
          const words = block.content?.words || [];

          // Deterministic seed based on content
          const seedString = words.join(',') + '_' + gridSize;
          
          // Seeded random helper
          let h = 1779033703 ^ seedString.length;
          for (let i = 0; i < seedString.length; i++) {
            h = Math.imul(h ^ seedString.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
          }
          const seededRandom = () => {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return ((h ^= h >>> 16) >>> 0) / 4294967296;
          };

          // Generate grid deterministically
          const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
          const directions = [[1, 0], [0, 1]];
          
          words.forEach(word => {
            const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, '');
            if (!cleanWord) return;
            
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
              attempts++;
              const dir = directions[Math.floor(seededRandom() * directions.length)];
              const dx = dir[0];
              const dy = dir[1];
              
              const startX = Math.floor(seededRandom() * (gridSize - (dx === 1 ? cleanWord.length : 0)));
              const startY = Math.floor(seededRandom() * (gridSize - (dy === 1 ? cleanWord.length : 0)));
              
              let canPlace = true;
              for (let i = 0; i < cleanWord.length; i++) {
                const x = startX + i * dx;
                const y = startY + i * dy;
                if (grid[y][x] !== '' && grid[y][x] !== cleanWord[i]) {
                  canPlace = false;
                  break;
                }
              }
              
              if (canPlace) {
                for (let i = 0; i < cleanWord.length; i++) {
                  const x = startX + i * dx;
                  const y = startY + i * dy;
                  grid[y][x] = cleanWord[i];
                }
                placed = true;
              }
            }
          });
          
          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
              if (grid[r][c] === '') {
                grid[r][c] = alphabet[Math.floor(seededRandom() * alphabet.length)];
              }
            }
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#faf5ff', padding: '1rem', borderRadius: '12px', border: '1px solid #f3e8ff', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6b21a8' }}>
                🔍 {wordQuestion}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: '4px', width: '220px', maxWidth: '100%', background: '#f3e8ff', padding: '4px', borderRadius: '8px', boxSizing: 'border-box' }}>
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
                        fontSize: gridSize > 8 ? '0.55rem' : '0.68rem',
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
                
                <div style={{ flex: '1', minWidth: '120px' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Hidden Words</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {words.map((w, wIdx) => (
                      <span key={wIdx} style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '4px', padding: '2px 6px', fontSize: '0.62rem', fontWeight: 600, color: '#6b21a8' }}>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }

      case 'reading_passage':
        {
          const blockReadKey = `${activeScreenId}_${block.id}_read`;
          const isRead = !!previewAnswers[blockReadKey];
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
              <button 
                type="button" 
                onClick={() => {
                  setPreviewAnswers(prev => ({
                    ...prev,
                    [blockReadKey]: !isRead
                  }));
                }}
                style={{ 
                  width: 'fit-content', 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  background: isRead ? '#d1fae5' : '#10b981', 
                  color: isRead ? '#065f46' : '#fff', 
                  border: isRead ? '1px solid #065f46' : 'none', 
                  fontSize: '0.68rem', 
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isRead ? '✓ Read' : 'Mark as Read'}
              </button>
            </div>
          );
        }

      case 'writing_prompt':
        {
          const blockWriteKey = `${activeScreenId}_${block.id}`;
          const currentText = previewAnswers[blockWriteKey] || '';
          const wordCount = currentText.trim() === '' ? 0 : currentText.trim().split(/\s+/).length;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fbcfe8', background: '#fdf2f8', borderRadius: '8px', padding: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9d174d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiEdit2 /> Writing Prompt (Word Count Gate)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                Prompt: {block.content?.prompt || 'Write about your favorite hobby.'}
              </div>
              <textarea 
                placeholder={block.content?.placeholder || 'Start writing here...'} 
                value={currentText}
                onChange={e => {
                  const val = e.target.value;
                  setPreviewAnswers(prev => ({
                    ...prev,
                    [blockWriteKey]: val
                  }));
                }}
                style={{ 
                  width: '100%', 
                  height: '80px', 
                  minHeight: '60px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1', 
                  padding: '6px', 
                  fontSize: '0.72rem', 
                  background: '#ffffff', 
                  resize: 'vertical',
                  boxSizing: 'border-box' 
                }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#9d174d', fontWeight: 600 }}>
                <span>Minimum word count: {block.content?.minWords || 10} words</span>
                <span>{wordCount} words</span>
              </div>
            </div>
          );
        }

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

      case 'pronunciation':
        {
          const pronQuestion = block.content?.question || 'Practice pronouncing words correctly';
          const pronItems = block.content?.items || (block.content?.word ? [{ id: 'migrated', word: block.content.word, phonetic: block.content.phonetic }] : []);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fde68a', background: '#fffbeb', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiMic /> Pronunciation: {pronQuestion}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pronItems.map((item, itemIdx) => (
                  <div key={item.id || itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                      Word: {item.word || 'Hello'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Phonetic: {item.phonetic || '/həˈloʊ/'}</span>
                      <button type="button" style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <FiMic size={10} /> Speak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

      case 'role_play':
        {
          const rpTitle = block.content?.title || 'Introduction';
          const rpPrompt = block.content?.prompt || 'Introduce yourself.';
          const rpScript = block.content?.script || [{ speaker: 'A', text: 'Hi! How are you?' }];
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #fbcfe8', background: '#fdf2f8', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9d174d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiActivity /> Role Play: {rpTitle}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                Scenario: {rpPrompt}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {rpScript.map((line, lIdx) => (
                  <div key={lIdx} style={{ fontSize: '0.72rem', color: '#1e293b' }}>
                    <strong>{line.speaker}:</strong> {line.text}
                  </div>
                ))}
              </div>
            </div>
          );
        }

      case 'input':
        {
          const inputPlaceholder = block.content?.placeholder || 'Type your answer here...';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiType /> Text Input Area
              </div>
              <input 
                type="text" 
                placeholder={inputPlaceholder} 
                value={previewAnswers[block.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPreviewAnswers(prev => ({ ...prev, [block.id]: val }));
                }}
                style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '0.75rem', background: '#ffffff' }} 
              />
            </div>
          );
        }


      case 'true_false':
        {
          const rawStatements = block.content?.statements;
          const statements = rawStatements && rawStatements.length > 0
            ? rawStatements
            : [{ question: block.content?.question || 'Is this statement true?', correctAnswer: block.content?.correctAnswer !== undefined ? block.content.correctAnswer : true }];
          const userAnswers = previewAnswers[block.id] || {};

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCheckCircle /> True / False Challenge ({statements.length} Statement{statements.length > 1 ? 's' : ''})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {statements.map((stmt, sIdx) => {
                  const currentSel = userAnswers[sIdx];
                  return (
                    <div key={sIdx} style={{ background: '#ffffff', border: '1px solid #ffedd5', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                        <span style={{ fontWeight: 700, color: '#ea580c', marginRight: '4px' }}>#{sIdx + 1}:</span>
                        {stmt.question || 'Is this statement true?'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewAnswers(prev => ({
                            ...prev,
                            [block.id]: { ...(prev[block.id] || {}), [sIdx]: true }
                          }))}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '6px',
                            border: currentSel === true ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                            background: currentSel === true ? '#dcfce7' : '#fff',
                            color: currentSel === true ? '#16a34a' : '#64748b',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          True
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewAnswers(prev => ({
                            ...prev,
                            [block.id]: { ...(prev[block.id] || {}), [sIdx]: false }
                          }))}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '6px',
                            border: currentSel === false ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                            background: currentSel === false ? '#dcfce7' : '#fff',
                            color: currentSel === false ? '#16a34a' : '#64748b',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          False
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

      case 'you_ask':
        return (
          <div style={{ flex: 1, height: '100%', minHeight: 0,  display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiHelpCircle /> You Ask Block
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              {block.content?.prompt || 'Ask a question about the topic'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem', color: '#64748b' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: block.content?.recordingRequired ? '#10b981' : '#ef4444' }}></span>
              Recording Required | Max Duration: {block.content?.maxDuration || 60}s
            </div>
          </div>
        );

      case 'roleplay_simulation':
        {
          const npcName = block.content?.npcCharacter || 'NPC';
          const userRole = block.content?.userRole || 'Student';
          const npcAvatarUrl = resolveUrl ? resolveUrl(block.content?.npcImage || block.content?.npcAvatarUrl) : defaultResolveUrl(block.content?.npcImage || block.content?.npcAvatarUrl);
          const studentAvatarUrl = resolveUrl ? resolveUrl(block.content?.userAvatarUrl) : defaultResolveUrl(block.content?.userAvatarUrl);
          const turns = block.content?.conversation || [];

          return (
            <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', border: '1px solid #c084fc', background: '#faf5ff', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiUsers /> Roleplay Simulation
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {npcAvatarUrl && (
                    <img
                      src={npcAvatarUrl}
                      alt={npcName}
                      title={`NPC: ${npcName}`}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #a855f7' }}
                    />
                  )}
                  {studentAvatarUrl && (
                    <img
                      src={studentAvatarUrl}
                      alt={userRole}
                      title={`Student: ${userRole}`}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }}
                    />
                  )}
                </div>
              </div>

              {block.content?.scenario && (
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                  <strong>Scenario:</strong> {block.content.scenario}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                {turns.length > 0 ? (
                  turns.map((t, tIdx) => {
                    const isNpc = t.speaker === 'npc' || t.speaker === 'NPC Speaker' || !t.speaker;
                    const speakerName = isNpc ? npcName : userRole;
                    const text = t.text || t.prompt || '(No dialogue provided)';
                    const currentAvatar = isNpc ? npcAvatarUrl : studentAvatarUrl;

                    return (
                      <div
                        key={tIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: isNpc ? 'flex-start' : 'flex-end',
                          gap: '0.5rem',
                          alignSelf: isNpc ? 'flex-start' : 'flex-end',
                          maxWidth: '85%'
                        }}
                      >
                        {isNpc && (
                          currentAvatar ? (
                            <img
                              src={currentAvatar}
                              alt={speakerName}
                              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#e9d5ff', color: '#6b21a8', flexShrink: 0 }}>
                              {speakerName}
                            </span>
                          )
                        )}

                        <div style={{
                          background: isNpc ? '#ffffff' : '#3b82f6',
                          color: isNpc ? '#1e293b' : '#ffffff',
                          border: isNpc ? '1px solid #e9d5ff' : 'none',
                          borderRadius: isNpc ? '10px 10px 10px 2px' : '10px 10px 2px 10px',
                          padding: '0.45rem 0.65rem',
                          textAlign: isNpc ? 'left' : 'right',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: isNpc ? '#6b21a8' : '#e0f2fe', marginBottom: '2px' }}>{speakerName}</div>
                          <div style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>{text}</div>
                        </div>

                        {!isNpc && (
                          currentAvatar ? (
                            <img
                              src={currentAvatar}
                              alt={speakerName}
                              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#3b82f6', color: '#ffffff', flexShrink: 0 }}>
                              {speakerName}
                            </span>
                          )
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>
                    No dialogue turns added yet.
                  </div>
                )}
              </div>
            </div>
          );
        }

      case 'hotspot_explorer':
        {
          const resolvedImg = resolveUrl ? resolveUrl(block.content?.imageUrl) : defaultResolveUrl(block.content?.imageUrl);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', position: 'relative', overflow: 'hidden', flex: 1, height: '100%', minHeight: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiGrid /> Hotspot Explorer
              </div>
              {block.content?.imageUrl ? (
                <div style={{ position: 'relative', width: '100%', height: block.styles?.height || 'auto', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'block' }}>
                  <img
                    src={resolvedImg}
                    alt="Hotspot explorer source"
                    style={{
                      width: '100%',
                      height: block.styles?.height && block.styles?.height !== 'auto' ? block.styles.height : 'auto',
                      maxHeight: '450px',
                      objectFit: block.styles?.objectFit || 'cover',
                      display: 'block'
                    }}
                  />
                  {(block.content.hotspots || []).map((h, hidx) => (
                    <div
                      key={h.id || hidx}
                      title={h.name || `Target ${hidx + 1}`}
                      style={{
                        position: 'absolute',
                        left: `${(h.x / 400) * 100}%`,
                        top: `${(h.y / 250) * 100}%`,
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #ef4444 0%, #dc2626 100%)',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.7), 0 2px 4px rgba(0,0,0,0.3)',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                    >
                      {hidx + 1}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#94a3b8', fontSize: '0.7rem' }}>
                  No target explorer image selected
                </div>
              )}
            </div>
          );
        }

      case 'functional_reading':
        const docUrl = block.content?.documentUrl || block.content?.url || '';
        const questionsList = block.content?.questions || [];

        return (
          <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid #818cf8', background: '#ffffff', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 8px rgba(99,102,241,0.06)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiFileText /> Functional Reading
              </div>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 700 }}>
                {block.content?.documentType || 'Poster'}
              </span>
            </div>

            {block.content?.scenario && (
              <div style={{ fontSize: '0.78rem', color: '#475569', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #6366f1' }}>
                {block.content.scenario}
              </div>
            )}

            {docUrl ? (
              <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}>
                <img
                  src={resolveUrl(docUrl)}
                  alt="Functional Reading Document"
                  style={{ width: '100%', maxHeight: '320px', objectFit: block.styles?.objectFit || 'contain', borderRadius: '6px' }}
                />
              </div>
            ) : (
              <div style={{ width: '100%', height: '160px', border: '1.5px dashed #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <FiImage style={{ fontSize: '2rem', marginBottom: '4px', opacity: 0.6 }} />
                <span style={{ fontSize: '0.72rem' }}>No document image configured.</span>
              </div>
            )}

            {questionsList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                  Questions ({questionsList.length}):
                </div>
                {questionsList.map((q, qIdx) => {
                  const qKey = `${activeScreenId}_${block.id}_q${qIdx}`;
                  const userAns = previewAnswers[qKey];
                  const hasAns = userAns !== undefined;

                  return (
                    <div key={q.id || qIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
                        {qIdx + 1}. {q.question || 'Question prompt...'}
                      </div>

                      {(q.type === 'mcq' || q.type === 'multiple_choice') && q.options && q.options.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {q.options.map((opt, oIdx) => {
                            const optText = typeof opt === 'object' ? opt.text : opt;
                            const isCorrect = q.correctAnswer === oIdx || String(q.correctAnswer).toLowerCase() === String(optText).toLowerCase();
                            const isSelected = userAns === oIdx || userAns === optText;

                            let borderCol = '#cbd5e1';
                            let bgCol = '#ffffff';
                            let textCol = '#1e293b';

                            if (hasAns) {
                              if (isCorrect) {
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
                                  if (!hasAns) {
                                    setPreviewAnswers(prev => ({ ...prev, [qKey]: oIdx }));
                                  }
                                }}
                                style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  border: `1.5px solid ${borderCol}`,
                                  background: bgCol,
                                  color: textCol,
                                  fontSize: '0.75rem',
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: hasAns ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justify: 'space-between'
                                }}
                              >
                                <span>{optText}</span>
                                {hasAns && isCorrect && <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>✓ Correct</span>}
                                {hasAns && isSelected && !isCorrect && <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>✗ Incorrect</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'true_false' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {[true, false].map((tfVal) => {
                            const isCorrect = q.correctAnswer === tfVal;
                            const isSelected = userAns === tfVal;

                            let borderCol = '#cbd5e1';
                            let bgCol = '#ffffff';
                            let textCol = '#1e293b';

                            if (hasAns) {
                              if (isCorrect) {
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
                              <button
                                key={String(tfVal)}
                                type="button"
                                onClick={() => {
                                  if (!hasAns) {
                                    setPreviewAnswers(prev => ({ ...prev, [qKey]: tfVal }));
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  border: `1.5px solid ${borderCol}`,
                                  background: bgCol,
                                  color: textCol,
                                  fontSize: '0.75rem',
                                  fontWeight: isSelected ? 700 : 600,
                                  cursor: hasAns ? 'default' : 'pointer'
                                }}
                              >
                                {tfVal ? 'True' : 'False'}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {(q.type === 'text' || q.type === 'open_text' || q.type === 'open_text_response' || !q.type) && (
                        <input
                          className="cs-form-input"
                          style={{ height: '30px', fontSize: '0.75rem' }}
                          type="text"
                          placeholder="Type your answer..."
                          value={userAns || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setPreviewAnswers(prev => ({ ...prev, [qKey]: val }));
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'audio_mystery':
        return (
          <div style={{ flex: 1, height: '100%', minHeight: 0,  display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #67e8f9', background: '#ecfeff', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0891b2', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiVolume2 /> Audio Mystery
            </div>
            <div style={{ fontSize: '0.72rem', color: '#475569' }}>
              <strong>Question:</strong> {block.content?.question || 'Mystery description question...'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Clues configuration: {(block.content?.clues || []).length} progressive clues.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Compute vertical dynamic flow positions to prevent overlap when content height exceeds saved editor top coordinates
  let currentBottom = 0;
  const processedElements = (elements || []).map((block) => {
    const rawTop = parseInt(block.styles?.top || 0, 10);
    const parsedTop = isNaN(rawTop) ? 0 : rawTop;
    const computedTop = currentBottom > 0 ? Math.max(parsedTop, currentBottom + 16) : parsedTop;

    // Estimate realistic rendered block height
    let estimatedHeight = 100;
    const isFB = block.type === 'fill_blank' || block.type === 'fill_blanks' || block.type === 'fill_in_blanks';
    
    if (isFB) {
      const bCount = (block.content?.blanks || []).length || 1;
      estimatedHeight = 140 + bCount * 45;
    } else if (block.type === 'image') {
      const hasQ = block.content?.hasQuestion;
      const opts = block.content?.questionOptions?.length || 0;
      estimatedHeight = hasQ ? 280 + opts * 40 : 220;
    } else if (block.type === 'word_search') {
      estimatedHeight = 360;
    } else if (block.type === 'matching') {
      const pairCount = (block.content?.pairs || []).length || 2;
      estimatedHeight = 100 + pairCount * 45;
    } else if (block.type === 'quiz') {
      const qCount = (block.content?.questions || []).length || 1;
      estimatedHeight = 120 + qCount * 180;
    } else if (block.styles?.height || block.styles?.minHeight) {
      const explicitH = parseInt(block.styles?.height || block.styles?.minHeight, 10);
      if (!isNaN(explicitH) && explicitH > 0) estimatedHeight = explicitH;
    }

    currentBottom = computedTop + estimatedHeight;
    return {
      ...block,
      _computedTop: computedTop
    };
  });

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

      {processedElements.map((block) => (
        <div
          key={block.id}
          className={block.styles?.customClass || ''}
          style={{
            position: 'absolute',
            left: block.styles?.left || '0px',
            top: `${block._computedTop}px`,
            padding: '0.85rem',
            borderRadius: '12px',
            border: '1.5px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'hidden',
            zIndex: block.styles?.zIndex || 1,
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            ...(block.styles?.blockWidth ? { width: block.styles.blockWidth } : { width: '100%' }),
            fontFamily: block.styles?.fontFamily || 'inherit',
            fontSize: block.styles?.fontSize || 'inherit',
            fontWeight: block.styles?.fontWeight === 'Bold' ? 700 : block.styles?.fontWeight === 'SemiBold' ? 600 : block.styles?.fontWeight === 'Normal' ? 400 : 'inherit',
            color: block.styles?.color || '#1e293b',
            textAlign: (block.styles?.alignment || 'Left').toLowerCase()
          }}
        >
          {renderSingleBlock(block)}
        </div>
      ))}
    </>
  );
}
