'use client';

import React, { useState, useRef } from 'react';
import { Upload, Copy, Check, Image as ImageIcon, AlertCircle, Sparkles, RefreshCw, X } from 'lucide-react';

interface FileQueueItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function Home() {
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [expiresIn, setExpiresIn] = useState<string>('60'); // default 1 hour
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFilesToQueue = (files: FileList | File[]) => {
    const validFiles: FileQueueItem[] = [];
    let hasInvalidType = false;
    let hasInvalidSize = false;

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file
    const MAX_FILES = 10;

    if (fileQueue.length + files.length > MAX_FILES) {
      setError(`Batas maksimum adalah ${MAX_FILES} gambar sekaligus!`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        hasInvalidType = true;
        continue;
      }
      if (file.size > MAX_SIZE) {
        hasInvalidSize = true;
        continue;
      }

      // Avoid duplicates
      if (fileQueue.some((item) => item.file.name === file.name && item.file.size === file.size)) {
        continue;
      }

      validFiles.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (hasInvalidType) {
      setError('Hanya file gambar yang didukung!');
    } else if (hasInvalidSize) {
      setError('Beberapa file melebihi batas ukuran 10MB!');
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      setFileQueue((prev) => [...prev, ...validFiles]);
      setShareUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFilesToQueue(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const removeFileFromQueue = (id: string, previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpload = async () => {
    if (fileQueue.length === 0) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    fileQueue.forEach((item) => {
      formData.append('file', item.file);
    });
    formData.append('expiresInMinutes', expiresIn);

    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengunggah gambar');
      }

      setShareUrl(data.shareUrl);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetUploader = () => {
    fileQueue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setFileQueue([]);
    setShareUrl(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Andi Preview
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
          Ephemeral Image Sharing
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          
          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Bagikan Gambar Sementara
            </h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Unggah beberapa gambar Anda secara aman. Tautan akan hancur sendiri secara otomatis sesuai waktu yang Anda pilih.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-950/40 border border-red-800/50 text-red-300 px-4 py-3 rounded-2xl mb-6 flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success State */}
          {shareUrl ? (
            <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              
              {/* Stacked Preview Card for multiple images */}
              <div className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center">
                <div className="flex -space-x-10 overflow-hidden py-4">
                  {fileQueue.slice(0, 3).map((item, index) => (
                    <div
                      key={item.id}
                      style={{ zIndex: 10 - index }}
                      className="w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-900 shadow-xl bg-slate-950 flex items-center justify-center relative transform rotate-[-4deg] even:rotate-[4deg] hover:rotate-0 hover:scale-105 transition duration-200"
                    >
                      <img src={item.previewUrl} alt="uploaded preview" className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider bg-purple-950/80 px-3 py-1 rounded-full border border-purple-900/50">
                    {fileQueue.length} Gambar Berhasil Diunggah
                  </span>
                </div>
              </div>

              {/* Shared Link Copy Box */}
              <div className="w-full space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Link Berbagi Anda:
                </label>
                <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-2 pl-4">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="bg-transparent text-sm text-slate-300 outline-none flex-1 font-mono select-all"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={resetUploader}
                className="w-full py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 transition text-sm font-semibold flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Unggah Gambar Lain</span>
              </button>
            </div>
          ) : (
            /* Upload Workspace State */
            <div className="w-full space-y-6">
              
              {/* Drag-and-Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-44 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-6 text-center ${
                  isDragOver
                    ? 'border-purple-500 bg-purple-950/10 shadow-lg shadow-purple-500/5'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-inner mb-3">
                  <Upload className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-slate-200 mb-1">
                  Seret & letakkan gambar Anda di sini
                </span>
                <span className="text-xs text-slate-400">
                  bisa pilih beberapa file sekaligus (Maks. 10MB per gambar, maks 10 file)
                </span>
              </div>

              {/* Upload Queue Grid Preview */}
              {fileQueue.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Antrean File ({fileQueue.length}):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {fileQueue.map((item) => (
                      <div
                        key={item.id}
                        className="group aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 relative flex items-center justify-center"
                      >
                        <img src={item.previewUrl} alt={item.file.name} className="object-cover w-full h-full" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFileFromQueue(item.id, item.previewUrl);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-950/80 border border-red-800/50 hover:bg-red-800 text-red-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Waktu Kedaluwarsa Gambar:
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 transition cursor-pointer appearance-none shadow-inner"
                  >
                    <option value="5">5 Menit (Sangat Rahasia)</option>
                    <option value="60">1 Jam (Standar Berbagi)</option>
                    <option value="1440">1 Hari (Untuk Pekerjaan Harian)</option>
                    <option value="10080">7 Hari (Jangka Panjang)</option>
                  </select>
                </div>
              </div>

              {/* Submit Action Button */}
              <button
                onClick={handleUpload}
                disabled={fileQueue.length === 0 || isLoading}
                className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition flex items-center justify-center space-x-2 shadow-xl ${
                  fileQueue.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/20'
                    : isLoading
                    ? 'bg-purple-900/60 text-purple-200 cursor-wait'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20 hover:scale-[1.01]'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Mengunggah {fileQueue.length} Gambar...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    <span>Generate Link</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-500 border-t border-slate-900/50 bg-slate-950 relative z-10">
        © 2026 Andi Preview. All Files Are Encrypted and Auto-Destroyed.
      </footer>
    </main>
  );
}
