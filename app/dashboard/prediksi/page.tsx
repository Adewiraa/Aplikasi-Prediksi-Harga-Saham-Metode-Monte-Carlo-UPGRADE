'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { 
  Play, 
  TrendingUp, 
  HelpCircle,
  Percent,
  Compass,
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PrediksiPage() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const defaultKode = searchParams.get('kode') || '';

  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedKode, setSelectedKode] = useState(defaultKode);
  const [simulations, setSimulations] = useState(1000);
  
  // States untuk menampung hasil prediksi
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [historyPrices, setHistoryPrices] = useState<any[]>([]);

  useEffect(() => {
    loadStocks();
  }, []);

  useEffect(() => {
    if (defaultKode) {
      setSelectedKode(defaultKode);
    }
  }, [defaultKode]);

  async function loadStocks() {
    try {
      const { data, error } = await supabase
        .from('saham')
        .select('kode_saham, nama_saham');
      if (error) throw error;
      setStocks(data || []);
    } catch (err) {
      console.error('Error loading stocks for select:', err);
    }
  }

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKode) {
      alert('Pilih emiten saham terlebih dahulu.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 1. Jalankan simulasi Monte Carlo di backend API Next.js
      const res = await fetch(`/api/saham/predict?kodeSaham=${selectedKode}&simulations=${simulations}`);
      const resJson = await res.json();

      if (!resJson.success) {
        alert(resJson.message);
        setLoading(false);
        return;
      }

      // 2. Tarik riwayat harga penutupan terakhir (untuk plotting di grafik)
      const histRes = await fetch(`/api/saham/history?kodeSaham=${selectedKode}`);
      const histJson = await histRes.json();
      
      if (histJson.success) {
        // Ambil 20 data historis terakhir
        const last20 = histJson.data.slice(-20);
        setHistoryPrices(last20);
      }

      setResult(resJson.data);
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat menjalankan simulasi.');
    } finally {
      setLoading(false);
    }
  };

  // Setup data grafik multi-path
  const getChartData = () => {
    if (!result || historyPrices.length === 0) return null;

    // S0 (harga terakhir)
    const S0 = result.hargaHariIni;
    const dates = historyPrices.map(d => d.tanggal);
    const prices = historyPrices.map(d => d.harga_penutupan);

    // Tambahkan label tanggal prediksi esok hari
    const labelDates = [...dates, result.tanggalPrediksi];

    // Datasets
    const datasets: any[] = [];

    // 1. Dataset Histori Aktual (Line chart biru)
    datasets.push({
      label: 'Harga Aktual Historis',
      data: [...prices, null], // Nilai besok bernilai null agar garis aktual berhenti di hari ini
      borderColor: 'rgb(79, 70, 229)', // Indigo 600
      borderWidth: 3,
      pointRadius: 3,
      pointBackgroundColor: 'rgb(79, 70, 229)',
      tension: 0.15
    });

    // 2. Buat 15 jalur simulasi acak untuk visualisasi premium (Line chart abu-abu transparan)
    const sampleSims = result.simulasiSampel || [];
    const pathsToShow = Math.min(15, sampleSims.length);
    
    for (let i = 0; i < pathsToShow; i++) {
      const simVal = sampleSims[i];
      const pathData = Array(prices.length - 1).fill(null);
      pathData.push(S0);
      pathData.push(simVal);

      datasets.push({
        label: `Simulasi #${i+1}`,
        data: pathData,
        borderColor: 'rgba(148, 163, 184, 0.3)', // slate-300 transparan
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0,
        legend: { display: false }
      });
    }

    // 3. Dataset Rata-rata Prediksi (Dashed Orange Line)
    const meanData = Array(prices.length - 1).fill(null);
    meanData.push(S0);
    meanData.push(result.hargaPrediksi);
    datasets.push({
      label: 'Rata-rata Prediksi Monte Carlo',
      data: meanData,
      borderColor: 'rgb(249, 115, 22)', // Orange
      borderDash: [5, 5],
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: 'rgb(249, 115, 22)',
      tension: 0
    });

    // 4. Dataset Batas Atas CI 95% (Dashed Emerald Line)
    const upperData = Array(prices.length - 1).fill(null);
    upperData.push(S0);
    upperData.push(result.confidenceInterval95.batasAtas);
    datasets.push({
      label: 'Batas Atas (97.5%)',
      data: upperData,
      borderColor: 'rgba(16, 185, 129, 0.6)', // Emerald
      borderDash: [3, 3],
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0
    });

    // 5. Dataset Batas Bawah CI 95% (Dashed Red Line)
    const lowerData = Array(prices.length - 1).fill(null);
    lowerData.push(S0);
    lowerData.push(result.confidenceInterval95.batasBawah);
    datasets.push({
      label: 'Batas Bawah (2.5%)',
      data: lowerData,
      borderColor: 'rgba(239, 68, 68, 0.6)', // Red/Rose
      borderDash: [3, 3],
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0
    });

    return {
      labels: labelDates,
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#475569',
          filter: (legendItem: any) => {
            return ['Harga Aktual Historis', 'Rata-rata Prediksi Monte Carlo'].includes(legendItem.text);
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#f1f5f9',
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b'
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
        },
        ticks: {
          color: '#64748b'
        }
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Simulasi Prediksi Monte Carlo</h2>
        <p className="text-sm text-slate-500 font-medium">Jalankan perhitungan Geometric Brownian Motion (GBM) untuk memprediksi harga saham esok hari</p>
      </div>

      {/* Grid Utama */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Panel Form Input */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Compass size={18} className="text-indigo-600" /> Konfigurasi Simulasi
          </h3>
          <form onSubmit={handleSimulate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pilih Emiten Saham</label>
              <select
                required
                value={selectedKode}
                onChange={e => setSelectedKode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>Pilih Kode Saham</option>
                {stocks.map(s => (
                  <option key={s.kode_saham} value={s.kode_saham}>
                    {s.kode_saham} - {s.nama_saham}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Jumlah Simulasi ($N$)</label>
              <input
                type="number"
                required
                min={100}
                max={10000}
                value={simulations}
                onChange={e => setSimulations(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-3xs text-slate-400 mt-1 block font-medium">Rekomendasi: 1.000 simulasi untuk kestabilan statistik</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition duration-150"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Menghitung...
                </>
              ) : (
                <>
                  <Play size={16} /> Jalankan Simulasi
                </>
              )}
            </button>
          </form>

          {/* Rangkuman Parameter Teoretis */}
          {result && (
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Parameter Model (GBM)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="block text-3xs font-bold text-slate-400 uppercase">Drift Harian ($\mu$)</span>
                  <span className="text-sm font-extrabold text-indigo-600 font-mono">{result.parameters.driftHarianPersen}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="block text-3xs font-bold text-slate-400 uppercase">Volatilitas ($\sigma$)</span>
                  <span className="text-sm font-extrabold text-indigo-600 font-mono">{result.parameters.volatilitasHarianPersen}</span>
                </div>
              </div>
              <p className="text-3xs text-slate-400 leading-normal font-medium">
                *Drift harian mengindikasikan arah tren jangka panjang, volatilitas mengukur deviasi standar dari return harian historis (ukuran risiko).
              </p>
            </div>
          )}
        </div>

        {/* Panel Grafik & Hasil Proyeksi */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col min-h-[450px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              <p className="text-sm text-slate-500 font-medium">Sedang memproses return logaritmik dan menghitung probabilitas...</p>
            </div>
          ) : result ? (
            <div className="flex-1 flex flex-col space-y-6">
              {/* Rangkuman Prediksi Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div className="border-r border-slate-200 pr-2">
                  <span className="block text-3xs font-bold text-slate-500 uppercase">Harga Hari Ini</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">Rp {result.hargaHariIni.toLocaleString('id-ID')}</span>
                </div>
                <div className="sm:border-r sm:border-slate-200 sm:px-2">
                  <span className="block text-3xs font-bold text-slate-500 uppercase">Rerata Prediksi Esok</span>
                  <span className="text-lg font-bold text-orange-600 font-mono">Rp {result.hargaPrediksi.toLocaleString('id-ID')}</span>
                </div>
                <div className="border-r border-slate-200 pr-2 sm:px-2">
                  <span className="block text-3xs font-bold text-slate-500 uppercase">Confidence Interval 95%</span>
                  <span className="text-xs font-bold text-emerald-600 font-mono block mt-1">
                    {result.confidenceInterval95.batasBawah} - {result.confidenceInterval95.batasAtas}
                  </span>
                </div>
                <div className="sm:pl-2">
                  <span className="block text-3xs font-bold text-slate-500 uppercase">Peluang Arah Naik</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">{result.probabilitasNaik}</span>
                </div>
              </div>

              {/* Box Info Hasil Prediksi */}
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-sm leading-relaxed text-indigo-700 font-medium">
                Berdasarkan <strong>{result.totalSampleHistoris}</strong> data historis aktual saham <strong>{result.kodeSaham}</strong>, model Geometric Brownian Motion memproyeksikan harga penutupan pada tanggal <strong>{result.tanggalPrediksi}</strong> akan ditutup di sekitar <strong>Rp {result.hargaPrediksi.toLocaleString('id-ID')}</strong> dengan tingkat kepercayaan 95% berada dalam rentang Rp {result.confidenceInterval95.batasBawah.toLocaleString('id-ID')} hingga Rp {result.confidenceInterval95.batasAtas.toLocaleString('id-ID')}.
              </div>

              {/* Grafik Line Multi-Path */}
              <div className="flex-1 min-h-[300px] w-full relative">
                {getChartData() && <Line data={getChartData()!} options={chartOptions} />}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 shadow-sm">
                <TrendingUp size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Belum Ada Simulasi Terpilih</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm font-medium">Silakan pilih emiten saham di sebelah kiri dan klik tombol "Jalankan Simulasi" untuk menampilkan proyeksi Monte Carlo.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
