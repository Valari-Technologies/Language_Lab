import React from 'react';
import { 
  FiVolume2, FiImage, FiMonitor, FiFileText, FiEdit2, FiMic, 
  FiCheckCircle, FiPlay, FiPause,
  FiActivity, FiType, FiGrid, FiHelpCircle, FiUsers
} from 'react-icons/fi';
import { API_BASE_URL } from './config';

const getScrambledWords = (wordsList) => {
  if (!wordsList || wordsList.length <= 1) return wordsList || [];
  const str = wordsList.join('|');
  let hash = 0;
  for (let k = 0; k < str.length; k++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(k);
    hash |= 0;
  }
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  const shuffled = [...wordsList];
  let currentSeed = Math.abs(hash) + 1;
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  if (shuffled.length > 1 && shuffled.every((w, idx) => w === wordsList[idx])) {
    const temp = shuffled[0];
    shuffled[0] = shuffled[shuffled.length - 1];
    shuffled[shuffled.length - 1] = temp;
  }
  return shuffled;
};

const CustomAudioPlayer = ({ src, style = {} }) => {
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '0.4rem 0.6rem',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: '#0ea5e9',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          flexShrink: 0
        }}
      >
        {isPlaying ? <FiPause /> : <FiPlay style={{ marginLeft: '2px' }} />}
      </button>

      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', minWidth: '60px', flexShrink: 0 }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <input
        type="range"
        min="0"
        max={duration || 100}
        step="0.1"
        value={currentTime}
        onChange={handleSeek}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          height: '5px',
          accentColor: '#0ea5e9',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};

const defaultResolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = url.startsWith('/') ? url : '/' + url;
  return `${base}${path}`;
};

const HotspotExplorerPreviewBlock = ({ block, resolveUrl }) => {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const resolvedImg = resolveUrl ? resolveUrl(block.content?.imageUrl) : defaultResolveUrl(block.content?.imageUrl);
  const hotspots = block.content?.hotspots || [];
  const currentIdx = activeIdx < hotspots.length ? activeIdx : 0;
  const activeHs = hotspots[currentIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', position: 'relative', overflow: 'hidden', flex: 1, height: '100%', minHeight: 0 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FiGrid /> Hotspot Explorer
      </div>
      {block.content?.imageUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
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
            {hotspots.map((h, hidx) => {
              const isActive = hidx === currentIdx;
              return (
                <div
                  key={h.id || hidx}
                  title={h.name || `Target ${hidx + 1}`}
                  onClick={() => setActiveIdx(hidx)}
                  style={{
                    position: 'absolute',
                    left: `${(h.x / 400) * 100}%`,
                    top: `${(h.y / 250) * 100}%`,
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: isActive
                      ? 'radial-gradient(circle, #2563eb 0%, #1d4ed8 100%)'
                      : 'radial-gradient(circle, #ef4444 0%, #dc2626 100%)',
                    border: isActive ? '3px solid #60a5fa' : '2px solid #ffffff',
                    boxShadow: isActive
                      ? '0 0 12px rgba(37, 99, 235, 0.9), 0 2px 6px rgba(0,0,0,0.4)'
                      : '0 0 10px rgba(239, 68, 68, 0.7), 0 2px 4px rgba(0,0,0,0.3)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {hidx + 1}
                </div>
              );
            })}
          </div>

          {/* Compact Column-Wise Target Name Chips below Image */}
          {hotspots.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              {hotspots.map((hs, idx) => {
                const isActive = idx === currentIdx;
                return (
                  <div
                    key={hs.id || idx}
                    onClick={() => setActiveIdx(idx)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.75rem',
                      background: isActive ? '#eff6ff' : '#ffffff',
                      border: isActive ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                      borderRadius: '20px',
                      boxShadow: isActive ? '0 2px 6px rgba(59, 130, 246, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isActive ? '#1d4ed8' : '#334155',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: isActive ? '#2563eb' : '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </span>
                    <span>{hs.name || `Target ${idx + 1}`}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#94a3b8', fontSize: '0.7rem' }}>
          No target explorer image selected
        </div>
      )}
    </div>
  );
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
    const rawType = (block.type || '').toLowerCase();
    let normType = rawType;
    if (['roleplay_simulation', 'roleplay simulation', 'roleplay', 'role_play', 'dialogue'].includes(rawType)) {
      normType = 'roleplay_simulation';
    } else if (['sentence_builder', 'sentence builder'].includes(rawType)) {
      normType = 'sentence_builder';
    } else if (['fill_blank', 'fill_blanks', 'fill_in_blanks'].includes(rawType)) {
      normType = 'fill_blank';
    } else if (['audio_mystery', 'audio mystery'].includes(rawType)) {
      normType = 'audio_mystery';
    } else if (['hotspot_explorer', 'hotspot explorer'].includes(rawType)) {
      normType = 'hotspot_explorer';
    } else if (['functional_reading', 'functional reading'].includes(rawType)) {
      normType = 'functional_reading';
    }
    switch (normType) {
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
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, height: '100%', boxSizing: 'border-box', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', flexShrink: 0 }}>
                <FiVolume2 />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.content?.title || 'Voice Instruction'}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 1 }}>{(block.content?.url || block.content?.audio) ? 'Audio track ready' : 'No track attached'}</div>
              </div>
            </div>
            {(block.content?.url || block.content?.audio) && (
              <CustomAudioPlayer src={resolveUrl(block.content?.url || block.content?.audio)} />
            )}
          </div>
        );

      case 'video':
        return (
          <div className="video-element-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, width: '100%', height: block.styles?.height || '100%' }}>
            {block.content?.url ? (
              <div style={{ width: '100%', height: '100%', flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video src={resolveUrl(block.content.url)} controls controlsList="nodownload noplaybackrate noremoteplayback" disablePictureInPicture onContextMenu={e => e.preventDefault()} style={{ width: '100%', height: '100%', display: 'block', objectFit: block.styles?.objectFit || 'contain' }} />
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
                const pairImg = resolveUrl ? resolveUrl(pair.sourceImage || pair.source_image) : defaultResolveUrl(pair.sourceImage || pair.source_image);
                return (
                  <div key={pair.id || pIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {pairImg && (
                        <img src={pairImg} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} />
                      )}
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{pair.source || pair.left}</span>
                    </div>
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
                const cardImg = resolveUrl ? resolveUrl(card.imageUrl || card.image) : defaultResolveUrl(card.imageUrl || card.image);
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
                      height: '95px',
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
                      transition: 'all 0.2s',
                      gap: '4px'
                    }}
                  >
                    {!isFlipped && cardImg && (
                      <img src={cardImg} alt="" style={{ width: '28px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                    )}
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
              const sentenceQuestion = item.question?.trim();
              const originalWords = item.words && item.words.length > 0
                ? item.words
                : (item.sentence?.trim() ? item.sentence.trim().split(' ').filter(Boolean) : []);
              const sentenceWords = getScrambledWords(originalWords);
              const selectionKey = `${block.id}_${sIdx}`;
              const selection = dragDropSelections[selectionKey] || [];

              return (
                <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderBottom: sIdx < sentencesList.length - 1 ? '1px dashed #a5f3fc' : 'none', paddingBottom: sIdx < sentencesList.length - 1 ? '0.75rem' : 0 }}>
                  {sentenceQuestion && (
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0891b2' }}>
                      🧩 {sentenceQuestion}
                    </div>
                  )}

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%)', padding: '1rem', borderRadius: '12px', border: '1.5px solid #c7d2fe', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff', paddingBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3730a3', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔍</span> {wordQuestion}
                </div>
                <span style={{ background: '#4f46e5', color: '#ffffff', fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                  {words.length} Words to Find
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center', marginTop: '0.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: '4px', width: gridSize > 8 ? '230px' : '190px', maxWidth: '100%', background: '#ffffff', padding: '6px', borderRadius: '10px', border: '1.5px solid #c7d2fe', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
                  {grid.flatMap((row, rIdx) => row.map((char, cIdx) => (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      style={{
                        aspectRatio: '1',
                        background: '#f5f3ff',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: gridSize > 8 ? '0.58rem' : '0.68rem',
                        fontWeight: 800,
                        color: '#3730a3',
                        border: '1px solid #e0e7ff',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={(e) => {
                        const currBg = e.currentTarget.style.backgroundColor;
                        if (currBg === 'rgb(129, 140, 248)' || currBg === '#818cf8') {
                          e.currentTarget.style.backgroundColor = '#f5f3ff';
                          e.currentTarget.style.color = '#3730a3';
                        } else {
                          e.currentTarget.style.backgroundColor = '#818cf8';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                    >
                      {char}
                    </div>
                  )))}
                </div>
                
                <div style={{ flex: '1', minWidth: '120px', background: '#ffffff', border: '1px solid #e0e7ff', borderRadius: '10px', padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📋 Hidden Words</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {words.map((w, wIdx) => (
                      <span key={wIdx} style={{ background: '#f5f3ff', border: '1px solid #c7d2fe', borderRadius: '16px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700, color: '#4338ca', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6366f1' }}></span>
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
          const rawPassages = block.content?.passages;
          const passages = rawPassages && rawPassages.length > 0
            ? rawPassages
            : [{
                title: block.content?.title || '',
                passage: block.content?.passage || '',
                question: block.content?.question || ''
              }];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid #cbd5e1', background: '#f1f5f9', borderRadius: '8px', padding: '0.75rem', flex: 1, height: '100%', overflowY: 'auto' }}>
              {passages.map((p, pIdx) => {
                const titleText = p.title || (passages.length > 1 ? `Passage #${pIdx + 1}` : 'Passage Title');
                const passageText = p.passage || 'Read this text carefully...';
                return (
                  <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: pIdx < passages.length - 1 ? '1px dashed #cbd5e1' : 'none', paddingBottom: pIdx < passages.length - 1 ? '0.5rem' : 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiFileText /> Reading Passage: {titleText}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#334155', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto' }}>
                      {passageText}
                    </div>
                    {p.question && (
                      <div style={{ fontSize: '0.7rem', color: '#475569', fontStyle: 'italic', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px' }}>
                        Question: {p.question}
                      </div>
                    )}
                  </div>
                );
              })}
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
                  gap: '4px',
                  marginTop: '4px'
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
        {
          const rawItems = block.content?.items;
          const items = Array.isArray(rawItems) && rawItems.length > 0
            ? rawItems
            : [{ id: 'dict-1', audioUrl: block.content?.url || block.content?.audioUrl || '', text: block.content?.text || block.content?.targetText || '' }];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '0.85rem', flex: 1, height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiVolume2 style={{ fontSize: '1rem' }} /> Dictation Exercise
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1e293b', background: '#ffffff', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #93c5fd' }}>
                <strong>Instruction:</strong> {block.content?.question || 'Listen carefully to the audio and type exactly what you hear.'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.map((item, idx) => {
                  const dictKey = `${activeScreenId}_${block.id}_${item.id || idx}`;
                  const userVal = previewAnswers[dictKey] !== undefined ? previewAnswers[dictKey] : (idx === 0 && items.length === 1 ? (previewAnswers[`${activeScreenId}_${block.id}`] || '') : '');
                  const audioSrc = item.audioUrl || item.url;

                  return (
                    <div key={item.id || idx} style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '8px', border: '1px solid #93c5fd', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1d4ed8' }}>🎵 Dictation Track #{idx + 1}</div>
                      {audioSrc ? (
                        <CustomAudioPlayer src={resolveUrl(audioSrc)} />
                      ) : (
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>No audio file configured for track #{idx + 1}.</div>
                      )}
                      <input
                        type="text"
                        className="cs-form-input"
                        placeholder="Type the dictation here..."
                        value={userVal}
                        onChange={e => setPreviewAnswers(prev => ({ ...prev, [dictKey]: e.target.value }))}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #94a3b8', padding: '0 10px', fontSize: '0.78rem', background: '#ffffff' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

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
                  <div key={item.id || itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '6px', padding: '0.45rem 0.65rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: '#b45309', fontWeight: 800 }}>{itemIdx + 1}.</span>
                      <span>{item.word || `Word ${itemIdx + 1}`}</span>
                    </div>
                    <button
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#f59e0b',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '16px',
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <FiMic style={{ fontSize: '0.8rem' }} /> Record
                    </button>
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
          const inputPlaceholder = block.content?.placeholder || 'Type your response here...';
          const isTextArea = block.content?.inputType === 'textarea';
          return (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              border: '1.5px solid #60a5fa',
              background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
              borderRadius: '12px',
              padding: '1.1rem',
              marginTop: '0.5rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    background: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem'
                  }}>
                    <FiType />
                  </div>
                  <span>{block.content?.label || block.content?.question || 'Text Input Field'}</span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#3b82f6', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px' }}>
                  {isTextArea ? 'Multi-line Text' : 'Single Line Input'}
                </span>
              </div>

              {block.content?.prompt && (
                <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.45, fontWeight: 500 }}>
                  {block.content.prompt}
                </div>
              )}

              <div style={{ position: 'relative', width: '100%' }}>
                {isTextArea ? (
                  <textarea
                    placeholder={inputPlaceholder}
                    rows={block.content?.rows || 3}
                    value={previewAnswers[block.id] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPreviewAnswers(prev => ({ ...prev, [block.id]: val }));
                    }}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      padding: '10px 12px',
                      fontSize: '0.78rem',
                      background: '#ffffff',
                      color: '#0f172a',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={inputPlaceholder}
                    value={previewAnswers[block.id] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPreviewAnswers(prev => ({ ...prev, [block.id]: val }));
                    }}
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      padding: '0 12px',
                      fontSize: '0.78rem',
                      background: '#ffffff',
                      color: '#0f172a',
                      outline: 'none',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  />
                )}
              </div>

              {block.content?.maxLength && (
                <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#64748b' }}>
                  Max characters: <strong>{block.content.maxLength}</strong>
                </div>
              )}
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
              Recording Required | Max Duration: {block.content?.maxDuration || 10}s
            </div>
          </div>
        );

      case 'roleplay_simulation':
        {
          const npcName = block.content?.npcCharacter || 'NPC';
          const userRole = block.content?.userRole || 'Student';
          const npcAvatarRaw = block.content?.npcImage || block.content?.npcAvatarUrl || block.content?.speakerAAvatarUrl;
          const studentAvatarRaw = block.content?.userAvatarUrl || block.content?.speakerBAvatarUrl;
          const npcAvatarUrl = resolveUrl ? resolveUrl(npcAvatarRaw) : defaultResolveUrl(npcAvatarRaw);
          const studentAvatarUrl = resolveUrl ? resolveUrl(studentAvatarRaw) : defaultResolveUrl(studentAvatarRaw);
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
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: isNpc ? '#6b21a8' : '#e0f2fe' }}>{speakerName}</div>
                          <div style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>{text}</div>

                          {!isNpc && (block.content?.allowAudioRecord !== false) && (t.allowAudioRecord !== false) && (
                            <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <button
                                type="button"
                                style={{
                                  background: 'rgba(255,255,255,0.25)',
                                  border: 'none',
                                  borderRadius: '12px',
                                  padding: '2px 8px',
                                  color: '#ffffff',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                <FiMic style={{ fontSize: '0.7rem' }} /> Record Answer
                              </button>
                            </div>
                          )}
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
        return <HotspotExplorerPreviewBlock block={block} resolveUrl={resolveUrl} />;

      case 'functional_reading':
        const docType = (block.content?.documentType || 'poster').toLowerCase();
        const isTextDoc = docType === 'text';
        const docUrl = block.content?.documentUrl || block.content?.url || '';
        const docText = block.content?.documentText || '';
        const questionsList = block.content?.questions || [];

        return (
          <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid #818cf8', background: '#ffffff', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 8px rgba(99,102,241,0.06)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiFileText /> Functional Reading
              </div>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 700 }}>
                {isTextDoc ? 'TEXT' : 'POSTER'}
              </span>
            </div>

            {block.content?.scenario && (
              <div style={{ fontSize: '0.78rem', color: '#475569', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #6366f1' }}>
                {block.content.scenario}
              </div>
            )}

            {isTextDoc ? (
              docText ? (
                <div style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', padding: '0.85rem', fontSize: '0.78rem', color: '#1e293b', whiteSpace: 'pre-wrap', maxHeight: '280px', overflowY: 'auto' }}>
                  {docText}
                </div>
              ) : (
                <div style={{ width: '100%', height: '100px', border: '1.5px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.72rem' }}>
                  No document text provided
                </div>
              )
            ) : (
              docUrl ? (
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
              )
            )}

            {questionsList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                  Questions ({questionsList.length}):
                </div>
                {questionsList.map((q, qIdx) => {
                  const qKey = `${activeScreenId}_${block.id}_q${qIdx}`;
                  const userAns = previewAnswers[qKey];

                  return (
                    <div key={q.id || qIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>
                        {qIdx + 1}. {q.question || 'Question prompt...'}
                      </div>
                      <input
                        className="cs-form-input"
                        style={{ height: '32px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #94a3b8', padding: '0 8px', background: '#ffffff' }}
                        type="text"
                        placeholder="Type your answer here..."
                        value={userAns || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setPreviewAnswers(prev => ({ ...prev, [qKey]: val }));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'audio_mystery':
        {
          const mysteryKey = `${activeScreenId}_${block.id}`;
          const selectedAns = previewAnswers[mysteryKey];
          const hasSelected = selectedAns !== undefined;
          const options = block.content?.options || [];
          const correctIdx = parseInt(block.content?.correctAnswerIndex ?? block.content?.correctAnswer) || 0;

          return (
            <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid #67e8f9', background: '#ecfeff', borderRadius: '10px', padding: '0.85rem', width: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0891b2', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiVolume2 style={{ fontSize: '1.1rem' }} /> Audio Mystery Challenge
              </div>

              {/* Main Audio File if configured */}
              {(block.content?.url || block.content?.audio) && (
                <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #7dd3fc' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', marginBottom: '4px' }}>🎵 Main Mystery Audio:</div>
                  <CustomAudioPlayer src={resolveUrl(block.content?.url || block.content?.audio)} />
                </div>
              )}

              {/* Audios Section with Audio Players */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0e7490' }}>
                  🔊 Progressive Audios:
                </div>
                {(block.content?.clues || []).map((c, cIdx) => (
                  <div key={cIdx} style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369a1' }}>
                      Audio #{cIdx + 1}: {c.description || `Audio track (${c.duration || 5}s)`}
                    </div>
                    {c.audio ? (
                      <CustomAudioPlayer src={resolveUrl(c.audio)} />
                    ) : (
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>No audio file attached for Audio #{cIdx + 1}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Question displayed directly above Options */}
              <div style={{ fontSize: '0.78rem', color: '#1e293b', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #bae6fd', fontWeight: 600 }}>
                <strong>Question:</strong> {block.content?.question || 'Listen to the audio clues and guess the mystery item!'}
              </div>

              {/* Answer options if provided */}
              {options && options.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0e7490' }}>Select your answer:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {options.map((opt, oIdx) => {
                      const isCorrect = correctIdx === oIdx;
                      const isSelected = selectedAns === oIdx;
                      const optText = typeof opt === 'object' ? opt?.text : opt;

                      let bg = '#ffffff';
                      let border = '#cbd5e1';
                      let textCol = '#334155';

                      if (hasSelected) {
                        if (isCorrect) {
                          bg = '#dcfce7';
                          border = '#16a34a';
                          textCol = '#15803d';
                        } else if (isSelected) {
                          bg = '#fee2e2';
                          border = '#ef4444';
                          textCol = '#b91c1c';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            if (!hasSelected) {
                              setPreviewAnswers(prev => ({ ...prev, [mysteryKey]: oIdx }));
                            }
                          }}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            border: `1.5px solid ${border}`,
                            background: bg,
                            color: textCol,
                            fontSize: '0.75rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: hasSelected ? 'default' : 'pointer'
                          }}
                        >
                          {optText}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        }

      default:
        return null;
    }
  };

  // Compute vertical dynamic flow positions to prevent overlap when content height exceeds saved editor top coordinates
  let currentBottom = 0;
  const sortedElements = [...(elements || [])].sort((a, b) => {
    const topA = parseInt(a.styles?.top || 0, 10) || 0;
    const topB = parseInt(b.styles?.top || 0, 10) || 0;
    return topA - topB;
  });

  const processedElements = sortedElements.map((block) => {
    const rawTop = parseInt(block.styles?.top || 0, 10);
    const parsedTop = isNaN(rawTop) ? 0 : rawTop;
    const computedTop = currentBottom > 0 ? Math.max(parsedTop, currentBottom + 16) : parsedTop;

    // Estimate realistic rendered block height
    let estimatedHeight = 100;
    const normType = (block.type || '').toLowerCase();
    const isFB = normType === 'fill_blank' || normType === 'fill_blanks' || normType === 'fill_in_blanks';
    
    if (isFB) {
      const bCount = (block.content?.blanks || []).length || 1;
      estimatedHeight = 140 + bCount * 45;
    } else if (normType === 'image') {
      const hasQ = block.content?.hasQuestion;
      const opts = block.content?.questionOptions?.length || 0;
      estimatedHeight = hasQ ? 280 + opts * 40 : 220;
    } else if (normType === 'word_search') {
      estimatedHeight = 360;
    } else if (normType === 'matching' || normType === 'match') {
      const pairCount = (block.content?.pairs || block.content?.leftItems || []).length || 2;
      estimatedHeight = 100 + pairCount * 45;
    } else if (normType === 'quiz') {
      const qCount = (block.content?.questions || []).length || 1;
      estimatedHeight = 120 + qCount * 180;
    } else if (normType === 'roleplay_simulation' || normType === 'roleplay') {
      const turnCount = (block.content?.conversation || []).length || 2;
      estimatedHeight = 140 + turnCount * 65;
    }

    if (block.styles?.height || block.styles?.minHeight) {
      const explicitH = parseInt(block.styles?.height || block.styles?.minHeight, 10);
      if (!isNaN(explicitH) && explicitH > 0) estimatedHeight = Math.max(estimatedHeight, explicitH);
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
