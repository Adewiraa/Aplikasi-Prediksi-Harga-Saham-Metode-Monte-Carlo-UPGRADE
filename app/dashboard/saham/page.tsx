'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  History, 
  Trash2,
  X,
  TrendingUp,
  Database
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

export default function SahamPage() {
  const { role } = useAuth();
  const [stocks, setStocks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form states untuk tambah saham
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKode, setNewKode] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newSektor, setNewSektor] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // States untuk sinkronisasi data dari Yahoo Finance
  const [syncingKode, setSyncingKode] = useState<string | null>(null);

  // States untuk detail riwayat (modal)
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadStocks();
  }, []);

  async function loadStocks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saham')
        .select('*, harga_historis(count)')
        .order('kode_saham', { ascending: true });

      if (error) throw error;
      
      const formattedStocks = data.map((stock: any) => ({
        ...stock,
        dataCount: stock.harga_historis?.[0]?.count || 0
      }));

      setStocks(formattedStocks);
    } catch (err) {
      console.error('Error loading stocks:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const kode = newKode.trim().toUpperCase();
    const nama = newNama.trim();
    const sektor = newSektor.trim();

    if (!kode || !nama) {
      setFormError('Kode Saham dan Nama Saham wajib diisi.');
      return;
    }

    try {
      const { error } = await supabase
        .from('saham')
        .insert([{ kode_saham: kode, nama_saham: nama, sektor: sektor || null }]);

      if (error) {
        if (error.code === '23505') {
          setFormError('Kode saham sudah terdaftar.');
        } else {
          setFormError(error.message);
        }
      } else {
        setFormSuccess('Emiten saham berhasil ditambahkan.');
        setNewKode('');
        setNewNama('');
        setNewSektor('');
        setShowAddForm(false);
        loadStocks();
      }
    } catch (err: any) {
      setFormError('Terjadi kesalahan koneksi.');
    }
  };

  const handleDeleteStock = async (kode: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus saham ${kode} beserta semua data historis dan prediksi terkait?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('saham')
        .delete()
        .eq('kode_saham', kode);

      if (error) throw error;
      loadStocks();
    } catch (err: any) {
      alert(`Gagal menghapus saham: ${err.message}`);
    }
  };

  const handleSyncData = async (kode: string) => {
    setSyncingKode(kode);
    try {
      const res = await fetch(`/api/saham/sync?kodeSaham=${kode}&range=1y`);
      const data = await res.json();
      if (data.success) {
        alert(`Berhasil sinkronisasi! Ditambahkan ${data.count} baris data historis.`);
        loadStocks();
      } else {
        alert(`Sinkronisasi gagal: ${data.message}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat sinkronisasi.');
    } finally {
      setSyncingKode(null);
    }
  };

  const handleViewHistory = async (stock: any) => {
    setSelectedStock(stock);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/saham/history?kodeSaham=${stock.kode_saham}`);
      const resJson = await res.json();
      if (resJson.success) {
        setHistoryData(resJson.data);
      } else {
        setHistoryData([]);
      }
    } catch (err) {
      console.error(err);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter saham berdasarkan pencarian
  const filteredStocks = stocks.filter(stock => 
    stock.kode_saham.toLowerCase().includes(search.toLowerCase()) ||
    stock.nama_saham.toLowerCase().includes(search.toLowerCase()) ||
    (stock.sektor && stock.sektor.toLowerCase().includes(search.toLowerCase()))
  );

  // Data untuk Grafik Chart.js
  const chartData = {
    labels: historyData.map(d => d.tanggal),
    datasets: [
      {
        fill: true,
        label: 'Harga Penutupan Aktual (IDR)',
        data: historyData.map(d => d.harga_penutupan),
        borderColor: 'rgb(79, 70, 229)', // Indigo 600
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        borderWidth: 2,
        tension: 0.15,
        pointRadius: 0,
        pointHoverRadius: 5,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
          maxTicksLimit: 10,
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
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Master Emiten Saham</h2>
          <p className="text-sm text-slate-500 font-medium">Kelola emiten saham dan lakukan sinkronisasi data historis dengan Yahoo Finance</p>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 hover:shadow-indigo-500/10 transition duration-150 self-start sm:self-auto"
          >
            <Plus size={16} /> Tambah Emiten
          </button>
        )}
      </div>

      {/* Form Tambah Saham (Admin Only) */}
      {showAddForm && role === 'admin' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Emiten Saham Baru</h3>
          <form onSubmit={handleAddStock} className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Kode Saham</label>
              <input
                type="text"
                required
                placeholder="Contoh: ACES, BBRI"
                value={newKode}
                onChange={e => setNewKode(e.target.value)}
                className="w-full rounded-xl border border-slate-350 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Emiten</label>
              <input
                type="text"
                required
                placeholder="Contoh: Ace Hardware Indonesia"
                value={newNama}
                onChange={e => setNewNama(e.target.value)}
                className="w-full rounded-xl border border-slate-350 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Sektor</label>
              <input
                type="text"
                placeholder="Contoh: Consumer Cyclical"
                value={newSektor}
                onChange={e => setNewSektor(e.target.value)}
                className="w-full rounded-xl border border-slate-350 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition duration-150 shadow-sm"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
            </div>
          </form>
          {formError && <p className="mt-3 text-sm text-red-650 font-medium">{formError}</p>}
          {formSuccess && <p className="mt-3 text-sm text-emerald-650 font-medium">{formSuccess}</p>}
        </div>
      )}

      {/* Control Box: Search & Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Cari kode saham, nama emiten, atau sektor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-350 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
          <Database size={14} /> Menampilkan {filteredStocks.length} dari {stocks.length} Emiten
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                <th className="px-6 py-4">Kode Saham</th>
                <th className="px-6 py-4">Nama Emiten</th>
                <th className="px-6 py-4">Sektor</th>
                <th className="px-6 py-4">Jumlah Data Historis</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => (
                  <tr key={stock.kode_saham} className="text-sm text-slate-700 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-950">{stock.kode_saham}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{stock.nama_saham}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{stock.sektor || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        stock.dataCount >= 30 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {stock.dataCount} Hari Kerja
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewHistory(stock)}
                        disabled={stock.dataCount === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-250 hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-40 transition shadow-sm"
                      >
                        <History size={13} /> Histori
                      </button>

                      {role === 'admin' && (
                        <>
                          <button
                            onClick={() => handleSyncData(stock.kode_saham)}
                            disabled={syncingKode === stock.kode_saham}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white px-3 py-1.5 text-xs font-bold text-indigo-750 disabled:opacity-50 transition shadow-sm"
                          >
                            <RefreshCw size={13} className={syncingKode === stock.kode_saham ? 'animate-spin' : ''} />
                            Sync
                          </button>
                          <button
                            onClick={() => handleDeleteStock(stock.kode_saham)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 hover:bg-red-600 hover:text-white px-3 py-1.5 text-xs font-bold text-red-750 transition shadow-sm"
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">
                    Tidak ada saham terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Grafik Riwayat */}
      {showHistoryModal && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">{selectedStock.kode_saham} - Riwayat Harga</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedStock.nama_saham}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedStock(null);
                  setHistoryData([]);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {loadingHistory ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                </div>
              ) : historyData.length > 0 ? (
                <>
                  <div className="h-64 sm:h-80 w-full relative">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                    <div>Pertama: <span className="font-bold text-slate-800">{historyData[0]?.tanggal}</span></div>
                    <div>Terakhir: <span className="font-bold text-slate-800">{historyData[historyData.length - 1]?.tanggal}</span></div>
                    <div>Terakhir Close: <span className="font-extrabold text-indigo-600 font-mono">Rp {historyData[historyData.length - 1]?.harga_penutupan.toLocaleString('id-ID')}</span></div>
                  </div>
                </>
              ) : (
                <p className="text-center text-sm text-slate-400 font-medium py-12">Tidak ada data historis yang tersedia.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
