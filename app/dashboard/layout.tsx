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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 bg-white">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30">
              MC
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-wide">Monte Carlo</span>
          </Link>
          <button className="lg:hidden text-slate-500 hover:text-slate-950" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User Profile Info Card */}
        <div className="p-4 mx-4 my-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 border border-slate-200 shadow-sm">
            {role === 'admin' ? <ShieldCheck size={20} className="text-indigo-600" /> : <UserIcon size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">
              {user.nama || user.username}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-bold border ${
                role === 'admin' 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
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
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Menu / Logout */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-150"
          >
            <LogOut size={18} />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/70 backdrop-blur-md px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-600 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-extrabold text-slate-900 capitalize">
              {pathname.split('/').pop() || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition duration-150 cursor-pointer"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
            </button>
            <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 font-mono font-semibold">
              Serverless Node API
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Dark Mode CSS — injected directly to bypass Tailwind v4 layer processing */}
      <style dangerouslySetInnerHTML={{ __html: `
        body.dark-theme,
        body.dark-theme > div {
          background-color: #0b0f19 !important;
          color: #cbd5e1 !important;
        }
        body.dark-theme main {
          background-color: #0b0f19 !important;
        }
        body.dark-theme header {
          background-color: rgba(11, 15, 25, 0.85) !important;
          border-color: #1e293b !important;
        }
        body.dark-theme aside {
          background-color: #111827 !important;
          border-color: #1e293b !important;
        }
        body.dark-theme aside div {
          background-color: transparent;
        }
        body.dark-theme aside > div:first-child {
          background-color: #111827 !important;
          border-color: #1e293b !important;
        }
        body.dark-theme aside nav a {
          color: #94a3b8;
        }
        body.dark-theme aside nav a:hover {
          background-color: #1e293b !important;
          color: #f8fafc !important;
        }
        body.dark-theme [class*="bg-white"] {
          background-color: #111827 !important;
        }
        body.dark-theme [class*="bg-slate-50"] {
          background-color: #0f172a !important;
        }
        body.dark-theme [class*="bg-slate-100"] {
          background-color: #1e293b !important;
        }
        body.dark-theme [class*="border-slate-200"],
        body.dark-theme [class*="border-slate-100"],
        body.dark-theme [class*="divide-slate-100"] > * + * {
          border-color: #1e293b !important;
        }
        body.dark-theme [class*="border-slate-200/80"] {
          border-color: rgba(30, 41, 59, 0.8) !important;
        }
        body.dark-theme input,
        body.dark-theme select,
        body.dark-theme textarea {
          background-color: #1e293b !important;
          color: #f8fafc !important;
          border-color: #334155 !important;
        }
        body.dark-theme input:focus,
        body.dark-theme select:focus {
          border-color: #6366f1 !important;
        }
        body.dark-theme [class*="text-slate-900"],
        body.dark-theme [class*="text-slate-950"],
        body.dark-theme [class*="text-slate-800"] {
          color: #f8fafc !important;
        }
        body.dark-theme h1,
        body.dark-theme h2,
        body.dark-theme h3,
        body.dark-theme h4,
        body.dark-theme th,
        body.dark-theme strong {
          color: #f8fafc !important;
        }
        body.dark-theme [class*="text-slate-700"],
        body.dark-theme [class*="text-slate-600"] {
          color: #cbd5e1 !important;
        }
        body.dark-theme td {
          color: #cbd5e1 !important;
        }
        body.dark-theme [class*="text-slate-500"],
        body.dark-theme [class*="text-slate-400"] {
          color: #64748b !important;
        }
        body.dark-theme tr:hover {
          background-color: #1e293b !important;
        }
        body.dark-theme table thead tr {
          background-color: #0f172a !important;
        }
        body.dark-theme table th {
          background-color: #0f172a !important;
          color: #94a3b8 !important;
        }
        body.dark-theme [class*="bg-indigo-50"] {
          background-color: rgba(99, 102, 241, 0.1) !important;
        }
        body.dark-theme [class*="border-indigo-100"] {
          border-color: rgba(99, 102, 241, 0.2) !important;
        }
        body.dark-theme [class*="text-indigo-600"],
        body.dark-theme [class*="text-indigo-700"] {
          color: #818cf8 !important;
        }
        body.dark-theme [class*="bg-red-50"] {
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        body.dark-theme [class*="border-red-100"],
        body.dark-theme [class*="border-red-200"] {
          border-color: rgba(239, 68, 68, 0.2) !important;
        }
        body.dark-theme [class*="bg-emerald-50"] {
          background-color: rgba(16, 185, 129, 0.1) !important;
        }
        body.dark-theme [class*="border-emerald-100"],
        body.dark-theme [class*="border-emerald-200"] {
          border-color: rgba(16, 185, 129, 0.2) !important;
        }
        body.dark-theme [class*="bg-yellow-50"] {
          background-color: rgba(234, 179, 8, 0.1) !important;
        }
        body.dark-theme [class*="shadow-sm"],
        body.dark-theme [class*="shadow-md"] {
          box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
        }
        body.dark-theme [class*="shadow-xl"],
        body.dark-theme [class*="shadow-2xl"] {
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        body.dark-theme canvas {
          filter: brightness(0.95);
        }
      `}} />
    </div>
  );
}
