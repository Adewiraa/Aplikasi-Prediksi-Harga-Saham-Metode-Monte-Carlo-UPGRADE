'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ListOrdered, 
  LineChart, 
  CheckSquare, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

// CSS dark mode diinject langsung ke <head> agar tidak diproses Tailwind v4 layer system
const DARK_CSS = `
[data-theme="dark"] main { background-color: #0f172a !important; }
[data-theme="dark"] header { background-color: #1e293b !important; border-color: #334155 !important; }
[data-theme="dark"] div[class*="bg-white"] { background-color: #1e293b !important; }
[data-theme="dark"] div[class*="bg-slate-50"] { background-color: #0f172a !important; }
[data-theme="dark"] div[class*="bg-slate-100"] { background-color: #334155 !important; }
[data-theme="dark"] span[class*="bg-slate-50"] { background-color: #334155 !important; }
[data-theme="dark"] span[class*="bg-slate-100"] { background-color: #334155 !important; }
[data-theme="dark"] span[class*="bg-indigo-50"] { background-color: rgba(99,102,241,0.15) !important; }
[data-theme="dark"] div[class*="bg-indigo-50"] { background-color: rgba(99,102,241,0.1) !important; }
[data-theme="dark"] div[class*="bg-red-50"] { background-color: rgba(239,68,68,0.1) !important; }
[data-theme="dark"] div[class*="bg-emerald-50"] { background-color: rgba(16,185,129,0.1) !important; }
[data-theme="dark"] div[class*="bg-yellow-50"] { background-color: rgba(234,179,8,0.1) !important; }
[data-theme="dark"] div[class*="border-slate-200"],
[data-theme="dark"] div[class*="border-slate-100"],
[data-theme="dark"] span[class*="border-slate-200"],
[data-theme="dark"] td[class*="border-slate-200"] { border-color: #334155 !important; }
[data-theme="dark"] div[class*="border-indigo-100"] { border-color: rgba(99,102,241,0.2) !important; }
[data-theme="dark"] div[class*="border-red-200"],
[data-theme="dark"] div[class*="border-red-100"] { border-color: rgba(239,68,68,0.2) !important; }
[data-theme="dark"] div[class*="border-emerald-200"],
[data-theme="dark"] div[class*="border-emerald-100"] { border-color: rgba(16,185,129,0.2) !important; }
[data-theme="dark"] h1, [data-theme="dark"] h2, [data-theme="dark"] h3, [data-theme="dark"] h4 { color: #f1f5f9 !important; }
[data-theme="dark"] p { color: #cbd5e1 !important; }
[data-theme="dark"] strong { color: #f1f5f9 !important; }
[data-theme="dark"] td { color: #cbd5e1 !important; }
[data-theme="dark"] table thead tr { background-color: #1e293b !important; }
[data-theme="dark"] table th { background-color: #1e293b !important; color: #94a3b8 !important; border-color: #334155 !important; }
[data-theme="dark"] table tbody tr:hover { background-color: rgba(51,65,85,0.3) !important; }
[data-theme="dark"] input, [data-theme="dark"] select, [data-theme="dark"] textarea {
  background-color: #0f172a !important; color: #f1f5f9 !important; border-color: #475569 !important;
}
[data-theme="dark"] input:focus, [data-theme="dark"] select:focus { border-color: #818cf8 !important; }
[data-theme="dark"] label { color: #94a3b8 !important; }
[data-theme="dark"] canvas { filter: brightness(0.92) contrast(1.1); }
`;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme from localStorage & inject CSS into <head>
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    // Inject dark mode styles into <head> once
    if (!document.getElementById('dark-mode-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'dark-mode-styles';
      styleEl.textContent = DARK_CSS;
      document.head.appendChild(styleEl);
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  // Redirect ke login jika tidak ada user
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Master Saham', href: '/dashboard/saham', icon: ListOrdered },
    { name: 'Simulasi Prediksi', href: '/dashboard/prediksi', icon: LineChart },
    { name: 'Pengujian Validasi', href: '/dashboard/validasi', icon: CheckSquare },
  ];

  // Helper conditional class: light vs dark
  const dm = (light: string, dark: string) => darkMode ? dark : light;

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${dm('bg-slate-50 text-slate-800', 'bg-[#0f172a] text-slate-300')}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${dm('border-slate-200 bg-white', 'border-slate-700 bg-[#1e293b]')}`}
      >
        {/* Brand Header */}
        <div className={`flex h-16 items-center justify-between px-6 border-b ${dm('border-slate-200 bg-white', 'border-slate-700 bg-[#1e293b]')}`}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30">
              MC
            </div>
            <span className={`text-lg font-bold tracking-wide ${dm('text-slate-900', 'text-white')}`}>Monte Carlo</span>
          </Link>
          <button className={`lg:hidden cursor-pointer ${dm('text-slate-500 hover:text-slate-950', 'text-slate-400 hover:text-white')}`} onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User Profile Info Card */}
        <div className={`p-4 mx-4 my-6 rounded-2xl border flex items-center gap-3 ${dm('bg-slate-50 border-slate-200', 'bg-slate-800/50 border-slate-700')}`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${dm('bg-white text-slate-600 border-slate-200', 'bg-slate-700 text-slate-300 border-slate-600')}`}>
            {role === 'admin' ? <ShieldCheck size={20} className="text-indigo-500" /> : <UserIcon size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-bold ${dm('text-slate-900', 'text-white')}`}>
              {user.nama || user.username}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-bold border ${
                role === 'admin' 
                  ? dm('bg-indigo-50 text-indigo-700 border-indigo-100', 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30')
                  : dm('bg-slate-100 text-slate-600 border-slate-200', 'bg-slate-700 text-slate-300 border-slate-600')
              }`}>
                {role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-4 py-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition duration-150 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                    : dm('text-slate-600 hover:bg-slate-50 hover:text-slate-900', 'text-slate-400 hover:bg-slate-700 hover:text-white')
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Menu / Logout */}
        <div className={`p-4 border-t ${dm('border-slate-200', 'border-slate-700')}`}>
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition duration-150 cursor-pointer ${dm('text-red-600 hover:bg-red-50 hover:text-red-700', 'text-red-400 hover:bg-red-500/10 hover:text-red-300')}`}
          >
            <LogOut size={18} />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className={`flex h-16 shrink-0 items-center justify-between border-b px-6 backdrop-blur-md ${dm('border-slate-200 bg-white/70', 'border-slate-700 bg-[#1e293b]/90')}`}>
          <div className="flex items-center gap-4">
            <button
              className={`lg:hidden cursor-pointer ${dm('text-slate-600 hover:text-slate-900', 'text-slate-400 hover:text-white')}`}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className={`text-lg font-extrabold capitalize ${dm('text-slate-900', 'text-white')}`}>
              {pathname.split('/').pop() || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition duration-150 cursor-pointer ${dm('bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600', 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-amber-400')}`}
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className={`text-xs border rounded-full px-3 py-1 font-mono font-semibold ${dm('text-slate-500 bg-slate-50 border-slate-200', 'text-slate-400 bg-slate-800 border-slate-700')}`}>
              Serverless Node API
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto p-6 md:p-8 ${dm('bg-slate-50', 'bg-[#0f172a]')}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
