'use client';

import React, { useState, useRef } from 'react';
import { Upload, Copy, Check, Image as ImageIcon, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<string>('60'); // default 1 hour (60 minutes)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setShareUrl(null);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setError(null);
        setShareUrl(null);
      } else {
        setError('Hanya file gambar yang didukung!');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
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
    setFile(null);
    setPreviewUrl(null);
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
        <div className="w-full max-w-xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          
          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Bagikan Gambar Sementara
            </h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Unggah gambar Anda dengan aman. Tautan akan hancur sendiri secara otomatis sesuai waktu yang Anda pilih.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-950/40 border border-red-800/50 text-red-300 px-4 py-3 rounded-2xl mb-6 flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success / Generated Link State */}
          {shareUrl ? (
            <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 relative flex items-center justify-center">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Uploaded preview"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                  <span className="text-xs text-purple-400 font-medium uppercase tracking-wider bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-900/50">
                    Gambar Berhasil Diunggah
                  </span>
                </div>
              </div>

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
              
              {/* Drag-and-Drop / File Picker Area */}
              {!previewUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-56 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-6 text-center ${
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
                    className="hidden"
                  />
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-inner mb-4">
                    <Upload className="w-8 h-8 text-purple-400" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200 mb-1">
                    Seret & letakkan gambar di sini
                  </span>
                  <span className="text-xs text-slate-400">
                    atau klik untuk menelusuri (Maks. 10MB)
                  </span>
                </div>
              ) : (
                /* Selected File Preview Box */
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 relative flex items-center justify-center group">
                  <img
                    src={previewUrl}
                    alt="Selected file"
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold shadow-lg transition"
                    >
                      Ganti Gambar
                    </button>
                    <button
                      onClick={resetUploader}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold border border-slate-700 transition"
                    >
                      Hapus
                    </button>
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
                disabled={!file || isLoading}
                className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition flex items-center justify-center space-x-2 shadow-xl ${
                  !file
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
                    <span>Mengunggah...</span>
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
