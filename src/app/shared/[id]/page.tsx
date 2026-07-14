'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Sparkles, Image as ImageIcon, Eye } from 'lucide-react';

export default function PreviewPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [imageMeta, setImageMeta] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const response = await fetch(`/api/images/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Link tidak ditemukan');
        }

        setImageMeta(data);
        const expiresAt = new Date(data.expires_at).getTime();
        const initialTimeLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeLeft(initialTimeLeft);
        
        if (initialTimeLeft === 0) {
          setError('expired');
        }
      } catch (err: any) {
        console.error(err);
        setError('expired');
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [id]);

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
          <span className="text-sm font-semibold text-slate-400">Membuka File Terenkripsi...</span>
        </div>
      </main>
    );
  }

  if (error === 'expired') {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-950/10 rounded-full blur-[120px] pointer-events-none" />
        
        <header className="w-full max-w-7xl mx-auto px-6 py-6 border-b border-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900/50 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Andi Preview
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 bg-rose-950/40 px-4 py-2 rounded-full border border-rose-900/50 animate-pulse">
          <Clock className="w-4 h-4" />
          <span>Hancur Dalam: {formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-4xl bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col">
          
          {/* Metadata Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-6">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">
                Nama File Gambar:
              </span>
              <h2 className="text-md font-bold text-slate-200 truncate max-w-xs md:max-w-md">
                {imageMeta.name}
              </h2>
            </div>
            <div className="flex items-center space-x-3 text-xs bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-850 self-start md:self-auto">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 font-medium">Tampilan Klien Terenkripsi</span>
            </div>
          </div>

          {/* Secure Display Workspace with Watermark */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950/95 flex items-center justify-center p-4 border border-slate-850 min-h-[50vh] max-h-[70vh] shadow-inner">
            
            {/* Repeated background watermark pattern */}
            <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none flex flex-wrap gap-x-16 gap-y-20 justify-center items-center overflow-hidden rotate-[-12deg] scale-110">
              {Array.from({ length: 64 }).map((_, i) => (
                <span key={i} className="text-xl font-extrabold tracking-widest uppercase font-mono text-white">
                  ANDI PREVIEW
                </span>
              ))}
            </div>
            
            {/* Secure Image File stream */}
            <img
              src={`/api/images/${id}/file`}
              alt={imageMeta.name}
              className="max-w-full max-h-[60vh] object-contain rounded-xl relative z-10 shadow-2xl select-none"
              onDragStart={(e) => e.preventDefault()} // Block drag and drop copy
              onContextMenu={(e) => e.preventDefault()} // Disable right-click save
            />
          </div>

          {/* Warning banner */}
          <div className="mt-6 bg-amber-950/20 border border-amber-900/40 text-amber-300/80 px-4 py-3 rounded-2xl text-xs text-center">
            * Demi keamanan klien Anda, gambar ini tidak dapat diakses lagi setelah masa berlaku habis. Jangan menyebarkan link ini kepada pihak ketiga yang tidak berwenang.
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-500 border-t border-slate-900/50 bg-slate-950">
        © 2026 Andi Preview. All Files Are Encrypted and Auto-Destroyed.
      </footer>
    </main>
  );
}
