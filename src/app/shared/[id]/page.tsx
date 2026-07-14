'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, ShieldAlert, Sparkles, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface ImageMeta {
  id: string;
  name: string;
  expires_at: string;
  created_at: string;
  content_type: string;
}

export default function PreviewPage({ params }: { params: { id: string } }) {
  const groupId = params.id;
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [animationClass, setAnimationClass] = useState<string>('animate-slide-in-right');

  // Touch gesture states for mobile swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const response = await fetch(`/api/images/${groupId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Link tidak ditemukan');
        }

        setImages(data);
        const expiresAt = new Date(data[0].expires_at).getTime();
        const initialTimeLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeLeft(initialTimeLeft);
        
        if (initialTimeLeft === 0) {
          setError('expired');
        }
      } catch (err) {
        console.error(err);
        setError('expired');
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [groupId]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handlePrev = useCallback(() => {
    setAnimationClass('animate-slide-in-left');
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setAnimationClass('animate-slide-in-right');
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Handle mobile touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50; // Swiped left -> Next image
    const isRightSwipe = distance < -50; // Swiped right -> Previous image

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    // Reset touch variables
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Handle keyboard arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (images.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, handlePrev, handleNext]);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');

    if (d > 0) {
      return `${d} Hari ${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative select-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-slate-400">Membuka Galeri Terenkripsi...</span>
        </div>
      </main>
    );
  }

  if (error === 'expired' || images.length === 0) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-950/10 rounded-full blur-[120px] pointer-events-none" />
        
        <header className="w-full max-w-7xl mx-auto px-6 py-6 border-b border-slate-900/50">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Andi Preview Logo" className="w-10 h-10 object-contain rounded-xl" />
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Andi Preview
            </span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-red-950/50 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
            <div className="bg-red-950/40 p-5 rounded-full border border-red-900/50 text-red-400 mb-6">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-red-200 mb-3">
              Link Kedaluwarsa
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Link ini sudah kedaluwarsa dan gambar telah dihapus demi keamanan.
            </p>
            <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl py-3 px-4 text-xs text-slate-500 font-mono">
              STATUS: SECURELY_DESTROYED_404
            </div>
          </div>
        </div>

        <footer className="w-full text-center py-6 text-xs text-slate-500 border-t border-slate-900/50 bg-slate-950">
          © 2026 Andi Preview. All Files Are Encrypted and Auto-Destroyed.
        </footer>
      </main>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-900/50 relative z-20">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Andi Preview Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg sm:rounded-xl" />
          <span className="font-extrabold text-md sm:text-lg tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent hidden xs:inline">
            Andi Preview
          </span>
          <span className="text-[10px] sm:text-xs bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300 font-semibold font-mono">
            {activeIndex + 1} / {images.length}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-semibold text-rose-400 bg-rose-950/40 px-3 py-2 rounded-full border border-rose-900/50 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Hancur Dalam: {formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main Preview Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 relative z-10">
        <div className="w-full max-w-5xl flex flex-col items-center">
          
          {/* File Name Header */}
          <div className="w-full text-center mb-2 sm:mb-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
              Nama File
            </span>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-300 truncate max-w-xs sm:max-w-xl mx-auto">
              {activeImage.name}
            </h2>
          </div>

          {/* Interactive Workspace - Dynamically wraps the image with its native ratio */}
          <div className="relative flex items-center justify-center w-full max-h-[72vh] overflow-hidden">
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative max-w-full flex items-center justify-center group overflow-hidden"
            >
              
              {/* Repeated background watermark pattern */}
              <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none flex flex-wrap gap-x-10 gap-y-12 justify-center items-center overflow-hidden rotate-[-12deg] scale-110">
                {Array.from({ length: 64 }).map((_, i) => (
                  <span key={i} className="text-xs sm:text-sm font-extrabold tracking-widest uppercase font-mono text-white">
                    ANDI PREVIEW
                  </span>
                ))}
              </div>

              {/* Left Control Navigation (Overlay on hover) */}
              {images.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="hidden md:flex absolute left-4 p-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 text-slate-200 hover:text-white rounded-full transition-all duration-200 z-20 shadow-xl opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Main Image Renderer with dynamic slide animation */}
              <img
                key={`${activeImage.id}-${animationClass}`}
                src={`/api/images/file/${activeImage.id}`}
                alt={activeImage.name}
                className={`max-w-full max-h-[70vh] w-auto h-auto object-contain relative z-10 select-none ${animationClass}`}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Right Control Navigation (Overlay on hover) */}
              {images.length > 1 && (
                <button
                  onClick={handleNext}
                  className="hidden md:flex absolute right-4 p-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 text-slate-200 hover:text-white rounded-full transition-all duration-200 z-20 shadow-xl opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Thumbnails Strip (Scrollable and smaller on mobile) */}
          {images.length > 1 && (
            <div className="w-full max-w-2xl mt-4 px-2 sm:px-4">
              <div className="flex justify-center space-x-2 sm:space-x-3 overflow-x-auto py-1 sm:py-2 custom-scrollbar snap-x">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveIndex(index)}
                    className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 border-2 snap-center ${
                      activeIndex === index
                        ? 'border-purple-500 scale-105 shadow-md shadow-purple-500/10'
                        : 'border-slate-900 hover:border-slate-800 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={`/api/images/file/${img.id}`}
                      alt={img.name}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CSS Animation Keyframes for dynamic slide sliding */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInFromRight {
          from { transform: translateX(80px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-80px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInFromRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-left {
          animation: slideInFromLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Footer */}
      <footer className="w-full text-center py-4 text-[10px] sm:text-xs text-slate-600 border-t border-slate-900/50 bg-slate-950">
        © 2026 Andi Preview. All Files Are Encrypted and Auto-Destroyed.
      </footer>
    </main>
  );
}
