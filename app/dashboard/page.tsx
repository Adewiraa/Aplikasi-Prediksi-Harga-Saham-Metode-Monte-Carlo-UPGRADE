'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Database, 
  Percent, 
  ArrowRight,
  ShieldCheck,
  BrainCircuit
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSaham: 0,
    totalHistory: 0,
    avgMape: 0,
    avgMapeStatus: 'N/A'
  });
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Ambil jumlah saham
        const { count: countSaham } = await supabase
          .from('saham')
          .select('*', { count: 'exact', head: true });

        // 2. Ambil jumlah data historis
        const { count: countHistory } = await supabase
          .from('harga_historis')
          .select('*', { count: 'exact', head: true });

        // 3. Ambil data saham master
        const { data: activeStocks } = await supabase
          .from('saham')
          .select('kode_saham, nama_saham, sektor')
          .limit(5);

        // 4. Hitung rata-rata MAPE dari hasil validasi
        const valRes = await fetch('/api/saham/validation');
        const valData = await valRes.json();
        
        let sumMape = 0;
        let countMape = 0;
        if (valData.success && valData.data) {
          valData.data.forEach((item: any) => {
            if (item.evaluasiAkurasi && item.evaluasiAkurasi.mape !== null) {
              sumMape += item.evaluasiAkurasi.mape;
              countMape++;
            }
          });
        }

        const avgMape = countMape > 0 ? sumMape / countMape : 0;
        
        let mapeStatus = 'N/A';
        if (avgMape > 0) {
          mapeStatus = avgMape < 10 ? 'Sangat Akurat' : (avgMape < 20 ? 'Baik' : (avgMape < 50 ? 'Layak' : 'Tidak Akurat'));
        }

        setStats({
          totalSaham: countSaham || 0,
          totalHistory: countHistory || 0,
          avgMape: parseFloat(avgMape.toFixed(2)),
          avgMapeStatus: mapeStatus
        });
        setStocks(activeStocks || []);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 to-zinc-900 border border-indigo-500/20 p-8 shadow-2xl">
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-400">
            <BrainCircuit size={14} /> Monte Carlo GBM Engine
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Prediksi Pergerakan Harga Saham
          </h2>
          <p className="mt-4 text-zinc-300 leading-relaxed">
            Selamat datang di Sistem Prediksi Saham Monte Carlo menggunakan model **Geometric Brownian Motion (GBM)**. Sistem berjalan tanpa backend eksternal, terintegrasi langsung dengan database PostgreSQL di Supabase cloud.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link 
              href="/dashboard/prediksi" 
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 hover:shadow-indigo-500/20 transition duration-150"
            >
              Mulai Prediksi <ArrowRight size={16} />
            </Link>
            <Link 
              href="/dashboard/validasi" 
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition duration-150"
            >
              Lihat Pengujian Validasi
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Card 1: Total Saham */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Total Saham Terdaftar</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-white tracking-tight">{stats.totalSaham}</p>
          <p className="mt-2 text-xs text-zinc-500">Emiten aktif di master data</p>
        </div>

        {/* Card 2: Total History */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Total Data Historis</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Database size={20} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-white tracking-tight">{stats.totalHistory.toLocaleString('id-ID')}</p>
          <p className="mt-2 text-xs text-zinc-500">Total baris harga penutupan aktual</p>
        </div>

        {/* Card 3: Rata-rata MAPE */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Rerata MAPE Sistem</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Percent size={20} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-white tracking-tight">
            {stats.avgMape > 0 ? `${stats.avgMape}%` : '0%'}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Kategori:{' '}
            <span className={`font-semibold ${
              stats.avgMapeStatus === 'Sangat Akurat' ? 'text-emerald-400' : 
              stats.avgMapeStatus === 'Baik' ? 'text-blue-400' : 
              stats.avgMapeStatus === 'Layak' ? 'text-yellow-400' : 'text-zinc-500'
            }`}>
              {stats.avgMapeStatus}
            </span>
          </p>
        </div>
      </div>

      {/* Grid: Master Saham Ringkas & Teori Pendukung */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom 1 & 2: Daftar Emiten */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Daftar Saham Terpopuler</h3>
            <Link href="/dashboard/saham" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800/60">
              <thead>
                <tr className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3">Kode</th>
                  <th className="pb-3">Nama Saham</th>
                  <th className="pb-3">Sektor</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {stocks.length > 0 ? (
                  stocks.map((stock) => (
                    <tr key={stock.kode_saham} className="text-sm text-zinc-300 hover:bg-zinc-800/20">
                      <td className="py-3.5 font-mono font-bold text-white">{stock.kode_saham}</td>
                      <td className="py-3.5">{stock.nama_saham}</td>
                      <td className="py-3.5 text-zinc-400">{stock.sektor || '-'}</td>
                      <td className="py-3.5 text-right">
                        <Link 
                          href={`/dashboard/prediksi?kode=${stock.kode_saham}`} 
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-600 hover:text-white transition duration-150"
                        >
                          Prediksi
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-zinc-500">
                      Belum ada data saham. Tambahkan emiten di menu Master Saham.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom 3: Catatan Akademik */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-6 space-y-4">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700">
            <ShieldCheck size={18} className="text-indigo-400" />
          </div>
          <h3 className="text-base font-bold text-white">Catatan Validitas Skripsi</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Untuk keperluan pengujian validasi, pastikan Anda:
          </p>
          <ul className="text-xs text-zinc-400 list-disc list-inside space-y-2 leading-relaxed">
            <li>Menyinkronkan data historis saham minimal 6 bulan ke belakang.</li>
            <li>Melakukan simulasi Monte Carlo harian ($N = 1000+$).</li>
            <li>Mengupdate harga penutupan aktual harian setelah bursa saham tutup pukul 16:00 WIB agar sistem dapat menghitung galat eror MAPE secara real-time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
