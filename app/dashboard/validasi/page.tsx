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

  // Custom Alert Modal State
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    show: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setModalConfig({
      show: true,
      title,
      message,
      onConfirm: () => setModalConfig(prev => ({ ...prev, show: false }))
    });
  };

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
        showAlert('Sinkronisasi Sukses', resJson.message);
        loadValidationData();
      } else {
        showAlert('Gagal Sinkronisasi', resJson.message);
      }
    } catch (err) {
      showAlert('Koneksi Gagal', 'Terjadi kesalahan koneksi saat menyinkronkan data.');
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
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-sans">Pengujian Validasi Model</h2>
          <p className="text-sm text-slate-500 font-medium">Analisis keandalan prediksi Monte Carlo menggunakan metrik galat MAPE & RMSE</p>
        </div>
        {role === 'admin' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition duration-150 shadow-sm cursor-pointer"
            >
              Update Aktual Manual
            </button>
            <button
              onClick={handleSyncActuals}
              disabled={syncingActuals}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition duration-150 cursor-pointer"
            >
              <RefreshCw size={15} className={syncingActuals ? 'animate-spin' : ''} />
              Sync Harga Aktual Otomatis
            </button>
          </div>
        )}
      </div>

      {/* Rangkuman Singkat Indikator Evaluasi */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-500 leading-relaxed max-w-3xl shadow-sm font-medium">
        <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 block mb-0.5">Penjelasan Pengujian Validasi:</span>
          Tabel di bawah mengukur simpangan model prediksi Monte Carlo. Nilai **MAPE (Mean Absolute Percentage Error)** yang semakin kecil mengindikasikan tingkat akurasi yang semakin tinggi. Kriteria MAPE: 
          <span className="text-emerald-700 font-bold ml-1">{"< 10%"} Sangat Akurat</span>, 
          <span className="text-blue-700 font-bold ml-1">{"10% - 20%"} Baik</span>, 
          <span className="text-yellow-750 font-bold ml-1">{"20% - 50%"} Layak</span>.
        </div>
      </div>

      {/* Tabel Validasi Utama */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/70">
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
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : validationData.length > 0 ? (
                validationData.map((item, idx) => (
                  <tr key={item.kodeSaham} className="text-sm text-slate-700 hover:bg-slate-50/50 group">
                    <td className="px-6 py-4 text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-950 relative">
                      <span className="flex items-center gap-1 cursor-help">
                        {item.kodeSaham}
                        <HelpCircle size={12} className="text-slate-400 group-hover:text-indigo-600 transition" />
                      </span>
                      {/* Tooltip Hover Premium */}
                      <div className="absolute left-6 top-12 z-20 hidden w-64 rounded-xl border border-slate-200 bg-slate-900 p-3 text-2xs text-slate-200 leading-relaxed group-hover:block shadow-2xl">
                        <span className="font-bold text-white block mb-1">Analisis Statistik {item.kodeSaham}:</span>
                        Berdasarkan {item.jumlahSampel} sampel, dipercaya 95% bahwa rata-rata harga prediksi berada di kisaran <strong>Rp {item.confidenceInterval.batasBawah}</strong> sampai dengan <strong>Rp {item.confidenceInterval.batasAtas}</strong>.
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{item.jumlahSampel} Hari</td>
                    <td className="px-6 py-4 font-mono">Rp {item.rataRata.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">Rp {item.standarDeviasi.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{item.confidenceInterval.formatted}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {item.evaluasiAkurasi ? `${item.evaluasiAkurasi.mape}%` : '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {item.evaluasiAkurasi ? `Rp ${item.evaluasiAkurasi.rmse.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.evaluasiAkurasi ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.evaluasiAkurasi.mapeStatus === 'Sangat Akurat' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          item.evaluasiAkurasi.mapeStatus === 'Baik' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          item.evaluasiAkurasi.mapeStatus === 'Layak' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {item.evaluasiAkurasi.mapeStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold">Belum Diuji</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400 font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-indigo-600" />
                <h3 className="text-base font-bold text-slate-950">Update Harga Aktual</h3>
              </div>
              <button 
                onClick={() => {
                  setShowManualModal(false);
                  setManualStatus({ error: '', success: '' });
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              {manualStatus.error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-medium">
                  {manualStatus.error}
                </div>
              )}
              {manualStatus.success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-600 font-medium">
                  {manualStatus.success}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pilih Saham</label>
                <select
                  required
                  value={selectedStock}
                  onChange={e => setSelectedStock(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="" disabled>Pilih Kode Saham</option>
                  {stocks.map(s => (
                    <option key={s.kode_saham} value={s.kode_saham}>{s.kode_saham}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tanggal Target</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Harga Aktual Penutupan (IDR)</label>
                <input
                  type="number"
                  required
                  placeholder="Masukkan nominal"
                  value={manualPrice}
                  onChange={e => setManualPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-sm cursor-pointer"
                >
                  {submittingManual ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {modalConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-zoom-in">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">{modalConfig.title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">{modalConfig.message}</p>
            
            <div className="flex justify-end">
              <button
                onClick={modalConfig.onConfirm}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 hover:shadow-indigo-500/10 transition duration-150 cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS Animations for Premium Modal Entry */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(4px); }
        }
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-zoom-in {
          animation: zoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}} />
    </div>
  );
}
