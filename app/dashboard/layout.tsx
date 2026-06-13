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
  ShieldCheck
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
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
    <div className="flex h-screen bg-zinc-950 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-800 bg-zinc-900/90 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30">
              MC
            </div>
            <span className="text-lg font-bold text-white tracking-wide">Monte Carlo</span>
          </Link>
          <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User Profile Info Card */}
        <div className="p-4 mx-4 my-6 rounded-2xl bg-zinc-950/50 border border-zinc-800/80 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700">
            {role === 'admin' ? <ShieldCheck size={20} className="text-indigo-400" /> : <UserIcon size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-medium border ${
                role === 'admin' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-700'
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
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-150 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Menu / Logout */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition duration-150"
          >
            <LogOut size={18} />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/40 backdrop-blur-md px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-zinc-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-white capitalize">
              {pathname.split('/').pop() || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 font-mono">
              Serverless Node API
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
