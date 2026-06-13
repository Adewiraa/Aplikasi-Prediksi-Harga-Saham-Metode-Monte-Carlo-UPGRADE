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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-800">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-950 to-slate-950 border border-indigo-900/50 p-8 shadow-xl">
        {/* Glow Ornaments */}
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-indigo-200 backdrop-blur-md">
            <BrainCircuit size={14} className="animate-pulse text-indigo-400" /> Monte Carlo GBM Engine v2.1
          </div>
          <h2 className="mt-4 text-3xl font-black text-white tracking-tight sm:text-5xl leading-tight">
            Prediksi Pergerakan <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">Harga Saham Terpercaya</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-slate-300 leading-relaxed font-medium">
            Simulasikan proyeksi harga masa depan emiten LQ45 menggunakan metode stokastik <strong>Geometric Brownian Motion (GBM)</strong>. Lakukan uji iterasi Monte Carlo secara real-time untuk memetakan jalur probabilitas harga dan menguji keandalan model melalui metrik galat MAPE & RMSE.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link 
              href="/dashboard/prediksi" 
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition duration-200 cursor-pointer"
            >
              Mulai Prediksi <ArrowRight size={16} />
            </Link>
            <Link 
              href="/dashboard/validasi" 
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 hover:border-white/20 hover:-translate-y-0.5 transition duration-200 cursor-pointer"
            >
              Lihat Pengujian Validasi
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Card 1: Total Saham */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-lg hover:border-indigo-400/50 hover:-translate-y-1 transition duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">Total Saham Terdaftar</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-110 transition duration-300">
              <TrendingUp size={22} />
            </div>
          </div>
          <p className="mt-4 text-4xl font-extrabold text-slate-900 tracking-tight">{stats.totalSaham}</p>
          <p className="mt-2 text-xs text-slate-400 font-bold">Emiten aktif di master data</p>
        </div>

        {/* Card 2: Total History */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-lg hover:border-indigo-400/50 hover:-translate-y-1 transition duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">Total Data Historis</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-110 transition duration-300">
              <Database size={22} />
            </div>
          </div>
          <p className="mt-4 text-4xl font-extrabold text-slate-900 tracking-tight">{stats.totalHistory.toLocaleString('id-ID')}</p>
          <p className="mt-2 text-xs text-slate-400 font-bold">Total baris harga penutupan aktual</p>
        </div>

        {/* Card 3: Rata-rata MAPE */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-lg hover:border-indigo-400/50 hover:-translate-y-1 transition duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">Rerata MAPE Sistem</span>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl border group-hover:scale-110 transition duration-300 ${
              stats.avgMapeStatus === 'Sangat Akurat' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              stats.avgMapeStatus === 'Baik' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
              stats.avgMapeStatus === 'Layak' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
              'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <Percent size={22} />
            </div>
          </div>
          <p className="mt-4 text-4xl font-extrabold text-slate-900 tracking-tight">
            {stats.avgMape > 0 ? `${stats.avgMape}%` : '0%'}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold">Kategori:</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black border ${
              stats.avgMapeStatus === 'Sangat Akurat' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
              stats.avgMapeStatus === 'Baik' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
              stats.avgMapeStatus === 'Layak' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
              'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {stats.avgMapeStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Master Saham Ringkas & Teori Pendukung */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom 1 & 2: Daftar Emiten */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-extrabold text-slate-900">Daftar Saham Terpopuler</h3>
            <Link href="/dashboard/saham" className="text-xs text-indigo-600 hover:text-indigo-500 font-bold flex items-center gap-1">
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-extrabold">Kode</th>
                  <th className="pb-3 font-extrabold">Nama Saham</th>
                  <th className="pb-3 font-extrabold">Sektor</th>
                  <th className="pb-3 text-right font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stocks.length > 0 ? (
                  stocks.map((stock) => (
                    <tr key={stock.kode_saham} className="text-sm text-slate-700 hover:bg-slate-50/70 transition duration-150">
                      <td className="py-4 font-mono font-black text-indigo-600">{stock.kode_saham}</td>
                      <td className="py-4 font-bold text-slate-900">{stock.nama_saham}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-2xs font-bold text-slate-600 border border-slate-200">
                          {stock.sektor || 'Sektor Lainnya'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Link 
                          href={`/dashboard/prediksi?kode=${stock.kode_saham}`} 
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-55 text-indigo-600 border border-indigo-100 px-3 py-1.5 text-xs font-bold hover:bg-indigo-600 hover:text-white transition duration-150 cursor-pointer"
                        >
                          Prediksi
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-slate-400 font-medium">
                      Belum ada data saham. Tambahkan emiten di menu Master Saham.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom 3: Catatan Akademik */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white p-6 space-y-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-indigo-100/20 blur-xl"></div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-inner">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Catatan Validitas Skripsi</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Untuk memastikan pengujian validitas model statistik prediktif Anda valid secara metodologis:
          </p>
          <ul className="text-xs text-slate-600 space-y-3 font-semibold">
            <li className="flex items-start gap-2 leading-relaxed">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-2xs font-black">✓</span>
              <span>Menyinkronkan data historis saham minimal 6 bulan ke belakang.</span>
            </li>
            <li className="flex items-start gap-2 leading-relaxed">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-2xs font-black">✓</span>
              <span>Melakukan simulasi Monte Carlo harian ($N = 1000+$).</span>
            </li>
            <li className="flex items-start gap-2 leading-relaxed">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-2xs font-black">✓</span>
              <span>Mengupdate harga penutupan aktual harian setelah bursa saham tutup pukul 16:00 WIB agar sistem dapat menghitung galat eror MAPE secara real-time.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
