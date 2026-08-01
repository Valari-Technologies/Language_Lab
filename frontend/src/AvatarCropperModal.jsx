import React, { useState, useRef, useEffect } from 'react';
import { FiZoomIn, FiZoomOut, FiRotateCcw, FiCheck, FiX } from 'react-icons/fi';

export default function AvatarCropperModal({ src, onCrop, onCancel }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Reset state when source changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    const containerSize = 200;
    let width = containerSize;
    let height = containerSize;

    if (naturalWidth > naturalHeight) {
      width = (naturalWidth / naturalHeight) * containerSize;
    } else {
      height = (naturalHeight / naturalWidth) * containerSize;
    }
    setImgSize({ width, height });
  };

  const handleStart = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imgRef.current) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, 300, 300);

    const containerSize = 200;
    const ratio = 300 / containerSize;

    const w = imgSize.width * zoom;
    const h = imgSize.height * zoom;

    const destW = w * ratio;
    const destH = h * ratio;
    
    const destX = (position.x - w / 2 + containerSize / 2) * ratio;
    const destY = (position.y - h / 2 + containerSize / 2) * ratio;

    ctx.drawImage(imgRef.current, destX, destY, destW, destH);

    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Crop Profile Image</h3>
          <button 
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Workspace */}
        <div style={{
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div 
            ref={containerRef}
            style={{
              width: '200px',
              height: '200px',
              overflow: 'hidden',
              position: 'relative',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              borderRadius: '50%',
              border: '4px solid #ffffff',
              boxShadow: '0 8px 25px rgba(15, 23, 42, 0.15)',
              background: '#e2e8f0'
            }}
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleEnd}
          >
            {src && (
              <img
                ref={imgRef}
                src={src}
                alt="Crop preview"
                onLoad={handleImageLoad}
                style={{
                  width: `${imgSize.width * zoom}px`,
                  height: `${imgSize.height * zoom}px`,
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: `-${(imgSize.height * zoom) / 2}px`,
                  marginLeft: `-${(imgSize.width * zoom) / 2}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              />
            )}
          </div>
          
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1.25rem', textAlign: 'center', fontWeight: 500 }}>
            Drag inside the circle to position, or use the slider below to zoom.
          </p>
        </div>

        {/* Controls */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FiZoomOut style={{ color: '#64748b' }} />
            <input 
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                flex: 1,
                accentColor: '#0b75b3',
                height: '5px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            />
            <FiZoomIn style={{ color: '#64748b' }} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <button
              onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
              style={{
                background: 'transparent',
                border: '1px solid #e2e8f0',
                color: '#475569',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <FiRotateCcw size={14} /> Reset
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onCancel}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  borderRadius: '8px',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  background: '#0b75b3',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 6px -1px rgba(11, 117, 179, 0.2)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#096296'}
                onMouseLeave={e => e.currentTarget.style.background = '#0b75b3'}
              >
                <FiCheck size={14} /> Save Crop
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
