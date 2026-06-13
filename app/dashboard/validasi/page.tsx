'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { 
  CheckSquare, 
  RefreshCw, 
  HelpCircle, 
  Info,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Percent,
  Compass,
  X
} from 'lucide-react';


export default function ValidasiPage() {
  const { role } = useAuth();
  const [validationData, setValidationData] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingActuals, setSyncingActuals] = useState(false);

  // States untuk modal input manual
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualStatus, setManualStatus] = useState({ error: '', success: '' });

  useEffect(() => {
    loadValidationData();
    loadStocks();
  }, []);

  async function loadStocks() {
    try {
      const { data, error } = await supabase.from('saham').select('kode_saham, nama_saham');
      if (!error) setStocks(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadValidationData() {
    setLoading(true);
    try {
      const res = await fetch('/api/saham/validation');
      const resJson = await res.json();
      if (resJson.success) {
        setValidationData(resJson.data);
      } else {
        setValidationData([]);
      }
    } catch (err) {
      console.error('Error loading validation data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSyncActuals = async () => {
    setSyncingActuals(true);
    try {
      const res = await fetch('/api/saham/sync-actual');
      const resJson = await res.json();
      if (resJson.success) {
        alert(resJson.message);
        loadValidationData();
      } else {
        alert(`Gagal: ${resJson.message}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat menyinkronkan data.');
    } finally {
      setSyncingActuals(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualStatus({ error: '', success: '' });

    if (!selectedStock || !manualDate || !manualPrice) {
      setManualStatus({ error: 'Semua kolom wajib diisi.', success: '' });
      return;
    }

    setSubmittingManual(true);
    try {
      // 1. Verifikasi apakah baris prediksi untuk saham & tanggal tersebut ada
      const { data: predictionRecord, error: checkError } = await supabase
        .from('hasil_prediksi')
        .select('*')
        .eq('kode_saham', selectedStock)
        .eq('tanggal', manualDate)
        .single();

      if (checkError || !predictionRecord) {
        setManualStatus({ 
          error: 'Data hasil prediksi untuk kode saham dan tanggal tersebut belum dibuat. Lakukan prediksi terlebih dahulu.', 
          success: '' 
        });
        setSubmittingManual(false);
        return;
      }

      // 2. Lakukan update harga_aktual
      const { error: updateError } = await supabase
        .from('hasil_prediksi')
        .update({ harga_aktual: parseInt(manualPrice) })
        .eq('kode_saham', selectedStock)
        .eq('tanggal', manualDate);

      if (updateError) {
        setManualStatus({ error: updateError.message, success: '' });
      } else {
        setManualStatus({ error: '', success: 'Berhasil memperbarui harga aktual!' });
        setSelectedStock('');
        setManualDate('');
        setManualPrice('');
        setTimeout(() => {
          setShowManualModal(false);
          setManualStatus({ error: '', success: '' });
        }, 1000);
        loadValidationData();
      }
    } catch (err) {
      setManualStatus({ error: 'Terjadi kesalahan sistem.', success: '' });
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-sans">Pengujian Validasi Model</h2>
          <p className="text-sm text-zinc-400">Analisis keandalan prediksi Monte Carlo menggunakan metrik galat MAPE & RMSE</p>
        </div>
        {role === 'admin' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition duration-150"
            >
              Update Aktual Manual
            </button>
            <button
              onClick={handleSyncActuals}
              disabled={syncingActuals}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition duration-150"
            >
              <RefreshCw size={15} className={syncingActuals ? 'animate-spin' : ''} />
              Sync Harga Aktual Otomatis
            </button>
          </div>
        )}
      </div>

      {/* Rangkuman Singkat Indikator Evaluasi */}
      <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl flex items-start gap-3 text-xs text-zinc-400 leading-relaxed max-w-3xl">
        <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-zinc-300 block mb-0.5">Penjelasan Pengujian Validasi:</span>
          Tabel di bawah mengukur simpangan model prediksi Monte Carlo. Nilai **MAPE (Mean Absolute Percentage Error)** yang semakin kecil mengindikasikan tingkat akurasi yang semakin tinggi. Kriteria MAPE: 
          <span className="text-emerald-400 font-semibold ml-1">{"< 10%"} Sangat Akurat</span>, 
          <span className="text-blue-400 font-semibold ml-1">{"10% - 20%"} Baik</span>, 
          <span className="text-yellow-400 font-semibold ml-1">{"20% - 50%"} Layak</span>.
        </div>
      </div>

      {/* Tabel Validasi Utama */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800/60">
            <thead>
              <tr className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-900/40">
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Kode Saham</th>
                <th className="px-6 py-4">Jumlah Sampel</th>
                <th className="px-6 py-4">Rata-rata Prediksi</th>
                <th className="px-6 py-4">Standar Deviasi</th>
                <th className="px-6 py-4">Confidence Interval (95%)</th>
                <th className="px-6 py-4">Rerata MAPE (%)</th>
                <th className="px-6 py-4">RMSE</th>
                <th className="px-6 py-4 text-right">Status Akurasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : validationData.length > 0 ? (
                validationData.map((item, idx) => (
                  <tr key={item.kodeSaham} className="text-sm text-zinc-300 hover:bg-zinc-800/20 group">
                    <td className="px-6 py-4 text-zinc-500">{idx + 1}</td>
                    <td className="px-6 py-4 font-mono font-bold text-white relative">
                      <span className="flex items-center gap-1 cursor-help">
                        {item.kodeSaham}
                        <HelpCircle size={12} className="text-zinc-500 group-hover:text-indigo-400 transition" />
                      </span>
                      {/* Tooltip Hover Premium */}
                      <div className="absolute left-6 top-12 z-20 hidden w-64 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-2xs text-zinc-400 leading-relaxed group-hover:block shadow-2xl">
                        <span className="font-bold text-white block mb-1">Analisis Statistik {item.kodeSaham}:</span>
                        Berdasarkan {item.jumlahSampel} sampel, dipercaya 95% bahwa rata-rata harga prediksi berada di kisaran <strong>Rp {item.confidenceInterval.batasBawah}</strong> sampai dengan <strong>Rp {item.confidenceInterval.batasAtas}</strong>.
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{item.jumlahSampel} Hari</td>
                    <td className="px-6 py-4 font-mono">Rp {item.rataRata.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-mono text-zinc-450">Rp {item.standarDeviasi.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-mono text-zinc-400">{item.confidenceInterval.formatted}</td>
                    <td className="px-6 py-4 font-mono font-semibold">
                      {item.evaluasiAkurasi ? `${item.evaluasiAkurasi.mape}%` : '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-450">
                      {item.evaluasiAkurasi ? `Rp ${item.evaluasiAkurasi.rmse.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.evaluasiAkurasi ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.evaluasiAkurasi.mapeStatus === 'Sangat Akurat' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' :
                          item.evaluasiAkurasi.mapeStatus === 'Baik' ? 'bg-blue-500/10 text-blue-450 border border-blue-500/20' :
                          item.evaluasiAkurasi.mapeStatus === 'Layak' ? 'bg-yellow-500/10 text-yellow-450 border border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {item.evaluasiAkurasi.mapeStatus}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">Belum Diuji</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-zinc-500">
                    Belum ada data validasi tersedia. Lakukan prediksi terlebih dahulu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Manual (Admin Only) */}
      {showManualModal && role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-indigo-400" />
                <h3 className="text-base font-bold text-white">Update Harga Aktual</h3>
              </div>
              <button 
                onClick={() => {
                  setShowManualModal(false);
                  setManualStatus({ error: '', success: '' });
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              {manualStatus.error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-450">
                  {manualStatus.error}
                </div>
              )}
              {manualStatus.success && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-450">
                  {manualStatus.success}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase">Pilih Saham</label>
                <select
                  required
                  value={selectedStock}
                  onChange={e => setSelectedStock(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="" disabled>Pilih Kode Saham</option>
                  {stocks.map(s => (
                    <option key={s.kode_saham} value={s.kode_saham}>{s.kode_saham}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase">Tanggal Target</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase">Harga Aktual Penutupan (IDR)</label>
                <input
                  type="number"
                  required
                  placeholder="Masukkan nominal"
                  value={manualPrice}
                  onChange={e => setManualPrice(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {submittingManual ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-400 hover:bg-zinc-700 hover:text-white"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
