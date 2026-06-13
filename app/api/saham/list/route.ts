import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const LQ45_STOCKS = [
  { kode_saham: 'ACES', nama_saham: 'Ace Hardware Indonesia Tbk', sektor: 'Barang Konsumen Non-Primer' },
  { kode_saham: 'ADRO', nama_saham: 'Adaro Energy Indonesia Tbk', sektor: 'Energi' },
  { kode_saham: 'AKRA', nama_saham: 'AKR Corporindo Tbk', sektor: 'Energi' },
  { kode_saham: 'AMRT', nama_saham: 'Sumber Alfaria Trijaya Tbk', sektor: 'Barang Konsumen Primer' },
  { kode_saham: 'ANTM', nama_saham: 'Aneka Tambang Tbk', sektor: 'Barang Baku' },
  { kode_saham: 'ARTO', nama_saham: 'Bank Jago Tbk', sektor: 'Keuangan' },
  { kode_saham: 'ASII', nama_saham: 'Astra International Tbk', sektor: 'Perindustrian' },
  { kode_saham: 'BBCA', nama_saham: 'Bank Central Asia Tbk', sektor: 'Keuangan' },
  { kode_saham: 'BBNI', nama_saham: 'Bank Negara Indonesia Tbk', sektor: 'Keuangan' },
  { kode_saham: 'BBRI', nama_saham: 'Bank Rakyat Indonesia Tbk', sektor: 'Keuangan' },
  { kode_saham: 'BBTN', nama_saham: 'Bank Tabungan Negara Tbk', sektor: 'Keuangan' },
  { kode_saham: 'BMRI', nama_saham: 'Bank Mandiri Tbk', sektor: 'Keuangan' },
  { kode_saham: 'BRIS', nama_saham: 'Bank Syariah Indonesia Tbk', sektor: 'Keuangan' },
  { kode_saham: 'BRPT', nama_saham: 'Barito Pacific Tbk', sektor: 'Barang Baku' },
  { kode_saham: 'BUKA', nama_saham: 'Bukalapak.com Tbk', sektor: 'Teknologi' },
  { kode_saham: 'CPIN', nama_saham: 'Charoen Pokphand Indonesia Tbk', sektor: 'Barang Konsumen Primer' },
  { kode_saham: 'EMTK', nama_saham: 'Elang Mahkota Teknologi Tbk', sektor: 'Teknologi' },
  { kode_saham: 'ESSA', nama_saham: 'Surya Esa Perkasa Tbk', sektor: 'Energi' },
  { kode_saham: 'EXCL', nama_saham: 'XL Axiata Tbk', sektor: 'Infrastruktur' },
  { kode_saham: 'GOTO', nama_saham: 'GoTo Gojek Tokopedia Tbk', sektor: 'Teknologi' },
  { kode_saham: 'HRUM', nama_saham: 'Harum Energy Tbk', sektor: 'Energi' },
  { kode_saham: 'ICBP', nama_saham: 'Indofood CBP Sukses Makmur Tbk', sektor: 'Barang Konsumen Primer' },
  { kode_saham: 'INCO', nama_saham: 'Vale Indonesia Tbk', sektor: 'Barang Baku' },
  { kode_saham: 'INDF', nama_saham: 'Indofood Sukses Makmur Tbk', sektor: 'Barang Konsumen Primer' },
  { kode_saham: 'INDY', nama_saham: 'Indika Energy Tbk', sektor: 'Energi' },
  { kode_saham: 'INKP', nama_saham: 'Indah Kiat Pulp & Paper Tbk', sektor: 'Barang Baku' },
  { kode_saham: 'INTP', nama_saham: 'Indocement Tunggal Prakarsa Tbk', sektor: 'Barang Baku' },
  { kode_saham: 'ITMG', nama_saham: 'Indo Tambangraya Megah Tbk', sektor: 'Energi' },
  { kode_saham: 'JPFA', nama_saham: 'Japfa Comfeed Indonesia Tbk', sektor: 'Barang Konsumen Primer' },
  { kode_saham: 'KLBF', nama_saham: 'Kalbe Farma Tbk', sektor: 'Kesehatan' },
  { kode_saham: 'MDKA', nama_saham: 'Merdeka Copper Gold Tbk', sektor: 'Barang Baku' },
  { kode_saham: 'MEDC', nama_saham: 'Medco Energi Internasional Tbk', sektor: 'Energi' },
  { kode_saham: 'PGAS', nama_saham: 'Perusahaan Gas Negara Tbk', sektor: 'Energi' },
  { kode_saham: 'PTBA', nama_saham: 'Bukit Asam Tbk', sektor: 'Energi' },
  { kode_saham: 'SCMA', nama_saham: 'Surya Citra Media Tbk', sektor: 'Barang Konsumen Non-Primer' },
  { kode_saham: 'SIDO', nama_saham: 'Industri Jamu Dan Farmasi Sido Muncul Tbk', sektor: 'Kesehatan' },
  { kode_saham: 'SMGR', nama_saham: 'Semen Indonesia Tbk', sektor: 'Barang Baku' },
  { kode_saham: 'SRTG', nama_saham: 'Saratoga Investama Sedaya Tbk', sektor: 'Keuangan' },
  { kode_saham: 'TBIG', nama_saham: 'Tower Bersama Infrastructure Tbk', sektor: 'Infrastruktur' },
  { kode_saham: 'TINS', nama_saham: 'Timah Tbk', sektor: 'Barang Baku' },
  { kode_saham: 'TLKM', nama_saham: 'Telkom Indonesia Tbk', sektor: 'Infrastruktur' },
  { kode_saham: 'TOWR', nama_saham: 'Sarana Menara Nusantara Tbk', sektor: 'Infrastruktur' },
  { kode_saham: 'TPIA', nama_saham: 'Chandra Asri Petrochemical Tbk', sektor: 'Barang Baku' },
  { kode_saham: 'UNTR', nama_saham: 'United Tractors Tbk', sektor: 'Perindustrian' },
  { kode_saham: 'UNVR', nama_saham: 'Unilever Indonesia Tbk', sektor: 'Barang Konsumen Primer' }
];

// Helper untuk sinkronisasi data dari Yahoo Finance ke database Supabase
async function syncStockFromYahooFinance(kodeSaham: string) {
  try {
    const symbol = `${kodeSaham}.JK`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return;

    const data = await res.json();
    const chartData = data?.chart?.result?.[0];
    if (!chartData) return;

    const timestamps = chartData.timestamp || [];
    const closePrices = chartData.indicators?.quote?.[0]?.close || [];

    const upsertRows = [];
    for (let i = 0; i < timestamps.length; i++) {
      const price = closePrices[i];
      if (price === null || price === undefined) continue;

      const dateObj = new Date(timestamps[i] * 1000);
      const tanggal = dateObj.toISOString().split('T')[0];

      upsertRows.push({
        kode_saham: kodeSaham,
        tanggal: tanggal,
        harga_penutupan: price,
      });
    }

    if (upsertRows.length > 0) {
      await supabase
        .from('harga_historis')
        .upsert(upsertRows, { onConflict: 'kode_saham,tanggal' });
    }
  } catch (e) {
    console.error(`Auto-sync error for ${kodeSaham}:`, e);
  }
}

// Mendapatkan tanggal hari kerja perdagangan terakhir
function getLastTradingDay(): string {
  const today = new Date();
  // Gunakan zona waktu Jakarta (WIB, GMT+7)
  const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
  const jktDate = new Date(utc + (3600000 * 7));
  
  let day = jktDate.getDay(); // 0 = Minggu, 6 = Sabtu
  if (day === 0) { // Minggu
    jktDate.setDate(jktDate.getDate() - 2); // Geser ke Jumat
  } else if (day === 6) { // Sabtu
    jktDate.setDate(jktDate.getDate() - 1); // Geser ke Jumat
  }
  return jktDate.toISOString().split('T')[0];
}

export async function GET() {
  try {
    // 1. Ambil daftar emiten saham yang ada di database
    let { data: stocks, error } = await supabase
      .from('saham')
      .select('kode_saham, nama_saham, sektor, harga_historis(count)')
      .order('kode_saham', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil daftar saham.', error: error.message },
        { status: 500 }
      );
    }

    // 2. Jika master saham kosong, lakukan pengisian otomatis (auto-seed) 45 emiten LQ45
    if (!stocks || stocks.length === 0) {
      const { error: seedError } = await supabase
        .from('saham')
        .upsert(LQ45_STOCKS, { onConflict: 'kode_saham' });

      if (seedError) {
        return NextResponse.json(
          { success: false, message: 'Gagal melakukan inisialisasi otomatis data saham.', error: seedError.message },
          { status: 500 }
        );
      }

      // Ambil kembali data setelah diisi
      const { data: reloadedStocks, error: reloadError } = await supabase
        .from('saham')
        .select('kode_saham, nama_saham, sektor, harga_historis(count)')
        .order('kode_saham', { ascending: true });

      if (reloadError) {
        return NextResponse.json(
          { success: false, message: 'Gagal mengambil ulang data saham.', error: reloadError.message },
          { status: 500 }
        );
      }
      stocks = reloadedStocks;
    }

    // 3. Ambil data harga historis terbaru dari database untuk mendeteksi data yang perlu di-sync
    const { data: latestHistory } = await supabase
      .from('harga_historis')
      .select('kode_saham, tanggal')
      .order('tanggal', { ascending: false });

    // Petakan tanggal penutupan terbaru untuk setiap saham
    const latestDateMap: { [key: string]: string } = {};
    if (latestHistory) {
      for (const row of latestHistory) {
        if (!latestDateMap[row.kode_saham]) {
          latestDateMap[row.kode_saham] = row.tanggal;
        }
      }
    }

    // 4. Identifikasi saham yang datanya belum up-to-date (belum di-sync untuk hari perdagangan terakhir)
    const targetDate = getLastTradingDay();
    const stocksToSync = (stocks || []).filter(stock => {
      const lastDate = latestDateMap[stock.kode_saham];
      return !lastDate || lastDate < targetDate;
    });

    // 5. Jalankan sinkronisasi background secara paralel untuk saham yang out-of-date
    if (stocksToSync.length > 0) {
      // Jalankan sinkronisasi di background (tidak menunggu/await agar API langsung merespons dengan cepat)
      Promise.all(stocksToSync.map(s => syncStockFromYahooFinance(s.kode_saham)))
        .then(() => console.log(`Auto-sync selesai untuk ${stocksToSync.length} saham.`))
        .catch(err => console.error('Kesalahan sinkronisasi otomatis background:', err));
    }

    return NextResponse.json({
      success: true,
      data: stocks || []
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem internal.', error: error.message },
      { status: 500 }
    );
  }
}
