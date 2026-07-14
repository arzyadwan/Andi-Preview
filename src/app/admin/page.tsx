'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, User, FolderLock, Clock, Trash2, Copy, Check, LogOut, 
  FileImage, Activity, Sparkles, ShieldAlert, ExternalLink 
} from 'lucide-react';

interface PreviewFile {
  id: string;
  name: string;
}

interface PreviewGroup {
  group_id: string;
  created_at: string;
  expires_at: string;
  files: PreviewFile[];
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [previews, setPreviews] = useState<PreviewGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null); // For loading state during delete

  // For countdowns
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    fetchActivePreviews();
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivePreviews = async () => {
    try {
      const res = await fetch('/api/admin/images');
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) throw new Error('Gagal memuat data');
      const data = await res.json();
      setPreviews(data.groups || []);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoginLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      setIsAuthenticated(true);
      fetchActivePreviews();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setPreviews([]);
      setUsername('');
      setPassword('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghancurkan pratinjau ini sekarang? File akan dihapus permanen dari storage dan database.')) {
      return;
    }

    setActionId(groupId);
    try {
      const res = await fetch(`/api/admin/images/${groupId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus');
      }

      setPreviews((prev) => prev.filter((item) => item.group_id !== groupId));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus link');
    } finally {
      setActionId(null);
    }
  };

  const copyToClipboard = (groupId: string) => {
    const shareUrl = `${window.location.origin}/shared/${groupId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(groupId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRemainingSeconds = (expiresAtStr: string) => {
    const expiresAt = new Date(expiresAtStr);
    const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
    return diff > 0 ? diff : 0;
  };

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return 'Kedaluwarsa';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');

    if (d > 0) {
      return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
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
          <span className="text-sm font-semibold text-slate-400">Menghubungkan Otoritas...</span>
        </div>
      </main>
    );
  }

  // LOGIN INTERFACE
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-950/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-950/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Header */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 relative z-10">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Andi Preview Logo" className="w-10 h-10 object-contain rounded-xl" />
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Andi Preview
            </span>
          </div>
          <div className="text-xs text-slate-400 font-medium bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-1.5">
            <FolderLock className="w-3.5 h-3.5 text-purple-400" />
            Admin Panel
          </div>
        </header>

        {/* Center Panel */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-md bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-4 rounded-full shadow-lg shadow-purple-500/10 mb-4 border border-purple-500/20">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
                Otorisasi Admin
              </h1>
              <p className="text-slate-400 text-xs">
                Masuk untuk mengelola preview gambar aktif
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-950/40 border border-red-900/50 rounded-2xl p-4 text-xs text-red-200 flex items-start space-x-2.5">
                  <ShieldAlert className="w-4.5 h-4.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <FolderLock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl py-3.5 font-semibold text-sm shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
              >
                {loginLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memproses Masuk...</span>
                  </>
                ) : (
                  <span>Masuk Dashboard</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full text-center py-6 text-xs text-slate-600 border-t border-slate-900/50 bg-slate-950 relative z-10">
          © 2026 Andi Preview. Admin Area Restricted.
        </footer>
      </main>
    );
  }

  // DASHBOARD INTERFACE
  const totalFiles = previews.reduce((acc, curr) => acc + curr.files.length, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-950/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-950/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-900/50 relative z-20">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Andi Preview Logo" className="w-10 h-10 object-contain rounded-xl" />
          <div className="flex flex-col">
            <span className="font-extrabold text-md sm:text-lg tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Andi Preview
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
              Admin Dashboard
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-950/20 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-red-900/50 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden xs:inline">Keluar</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10 flex flex-col space-y-8">
        
        {/* Top Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 flex items-center space-x-4 shadow-xl">
            <div className="p-3.5 bg-purple-950/40 border border-purple-900/50 text-purple-400 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Galeri Preview Aktif
              </span>
              <span className="text-2xl font-extrabold text-white">
                {previews.length} Link
              </span>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 flex items-center space-x-4 shadow-xl">
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-900/50 text-indigo-400 rounded-xl">
              <FileImage className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Total File Terenkripsi
              </span>
              <span className="text-2xl font-extrabold text-white">
                {totalFiles} Gambar
              </span>
            </div>
          </div>
        </div>

        {/* Active Previews Manager Panel */}
        <div className="bg-slate-900/20 border border-slate-800/60 rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-900/50 mb-6 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-purple-500" />
                Manajemen File Ephemeral
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Daftar preview gambar aktif di Supabase. Anda dapat memicu penghancuran paksa di sini.
              </p>
            </div>
            <button
              onClick={fetchActivePreviews}
              className="self-start sm:self-auto text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              Refresh Data
            </button>
          </div>

          {/* TABLE / CARD LIST */}
          {previews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-slate-900/60 p-4 rounded-full border border-slate-800 text-slate-600 mb-4">
                <FileImage className="w-10 h-10" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Belum ada preview gambar yang aktif</p>
              <p className="text-slate-600 text-xs mt-1">Gambar yang diupload client akan muncul di daftar ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="pb-4 pl-4">ID Preview Group</th>
                      <th className="pb-4">Jumlah Gambar</th>
                      <th className="pb-4">Nama File</th>
                      <th className="pb-4">Hancur Dalam (Sisa Waktu)</th>
                      <th className="pb-4 text-right pr-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/30 text-sm">
                    {previews.map((preview) => {
                      const remainingSec = getRemainingSeconds(preview.expires_at);
                      return (
                        <tr key={preview.group_id} className="hover:bg-slate-900/10 transition duration-150">
                          <td className="py-4 pl-4 font-mono text-xs font-semibold text-slate-400 max-w-[200px] truncate">
                            <div className="flex items-center space-x-2">
                              <span>{preview.group_id}</span>
                              <button
                                onClick={() => copyToClipboard(preview.group_id)}
                                className="text-slate-500 hover:text-purple-400 transition"
                                title="Salin Link Preview"
                              >
                                {copiedId === preview.group_id ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <a
                                href={`/shared/${preview.group_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-indigo-400 transition"
                                title="Buka Link di Tab Baru"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                          <td className="py-4 font-semibold text-slate-300">
                            {preview.files.length} File
                          </td>
                          <td className="py-4 text-xs text-slate-400 max-w-[250px] truncate">
                            {preview.files.map(f => f.name).join(', ')}
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              remainingSec < 300 
                                ? 'bg-red-950/40 text-red-400 border border-red-900/30' 
                                : 'bg-rose-950/20 text-rose-300 border border-rose-900/30'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              {formatCountdown(remainingSec)}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-4">
                            <button
                              onClick={() => handleDelete(preview.group_id)}
                              disabled={actionId === preview.group_id}
                              className="bg-red-950/40 hover:bg-red-900 border border-red-900/40 hover:border-red-700 text-red-400 hover:text-white rounded-xl py-2 px-3.5 text-xs font-semibold transition flex items-center space-x-1.5 ml-auto disabled:opacity-50 disabled:pointer-events-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hancurkan</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden space-y-4">
                {previews.map((preview) => {
                  const remainingSec = getRemainingSeconds(preview.expires_at);
                  return (
                    <div key={preview.group_id} className="bg-slate-950/30 border border-slate-900 rounded-2xl p-5 flex flex-col space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Group ID</span>
                          <span className="font-mono text-xs font-semibold text-slate-300 mt-0.5 max-w-[150px] truncate">{preview.group_id}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(preview.group_id)}
                            className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-400 hover:text-purple-400"
                          >
                            {copiedId === preview.group_id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <a
                            href={`/shared/${preview.group_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-400 hover:text-indigo-400"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 uppercase font-bold text-[9px]">Jumlah Gambar</span>
                          <p className="font-semibold text-slate-300 mt-0.5">{preview.files.length} File</p>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase font-bold text-[9px]">Sisa Waktu</span>
                          <p className="font-semibold text-rose-300 mt-0.5">{formatCountdown(remainingSec)}</p>
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="text-slate-500 uppercase font-bold text-[9px]">Nama File</span>
                        <p className="text-slate-400 mt-0.5 truncate">{preview.files.map(f => f.name).join(', ')}</p>
                      </div>

                      <button
                        onClick={() => handleDelete(preview.group_id)}
                        disabled={actionId === preview.group_id}
                        className="w-full bg-red-950/30 hover:bg-red-900 border border-red-900/40 text-red-400 hover:text-white rounded-xl py-2.5 text-xs font-semibold transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hancurkan Sekarang</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-600 border-t border-slate-900/50 bg-slate-950">
        © 2026 Andi Preview. Admin Area Encrypted & Secure.
      </footer>
    </main>
  );
}
