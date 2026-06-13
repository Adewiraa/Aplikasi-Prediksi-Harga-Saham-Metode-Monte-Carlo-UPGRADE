import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Box-Muller Transform untuk menghasilkan bilangan acak dengan distribusi normal standar (Z ~ N(0, 1))
function randomNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Mengabaikan nol
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Fungsi untuk mendapatkan tanggal hari perdagangan berikutnya (melewati Sabtu & Minggu)
function getNextTradingDay(dateStr?: string): string {
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  const target = new Date(baseDate);
  target.setDate(target.getDate() + 1);

  // 6 = Sabtu, 0 = Minggu
  while (target.getDay() === 6 || target.getDay() === 0) {
    target.setDate(target.getDate() + 1);
  }

  return target.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kodeSaham = searchParams.get('kodeSaham')?.toUpperCase();
    const simulationsParam = searchParams.get('simulations');
    const simulations = simulationsParam ? parseInt(simulationsParam) : 1000;
    const tanggalPrediksiParam = searchParams.get('tanggalPrediksi');
    const windowParam = searchParams.get('window');
    const windowSize = windowParam ? parseInt(windowParam) : 60; // Default: 60 hari kerja terakhir

    if (!kodeSaham) {
      return NextResponse.json(
        { success: false, message: 'Parameter kodeSaham wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Ambil data harga historis dari database
    let { data: history, error: historyError } = await supabase
      .from('harga_historis')
      .select('tanggal, harga_penutupan')
      .eq('kode_saham', kodeSaham)
      .order('tanggal', { ascending: true });

    if (historyError) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data historis dari database.', error: historyError.message },
        { status: 500 }
      );
    }

    if (!history || history.length < 5) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Data historis saham ${kodeSaham} di database minimal harus berjumlah 5 baris. Harap lakukan sinkronisasi data terlebih dahulu.` 
        },
        { status: 400 }
      );
    }

    // Gunakan subset data sesuai windowSize teratas (terbaru)
    if (history.length > windowSize) {
      history = history.slice(-windowSize);
    }

    const n = history.length;
    const prices = history.map(h => h.harga_penutupan);
    const dates = history.map(h => h.tanggal);
    const S0 = prices[n - 1]; // Harga penutupan terakhir (harga hari ini)
    const tanggalTerakhir = dates[n - 1];

    // 2. Hitung Log Returns harian
    const logReturns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      logReturns.push(Math.log(prices[i] / prices[i - 1]));
    }

    // 3. Hitung Mean (Drift) dan Standar Deviasi (Volatilitas) dari Log Returns
    const sum = logReturns.reduce((a, b) => a + b, 0);
    const drift = sum / logReturns.length;

    const varianceSum = logReturns.reduce((a, b) => a + Math.pow(b - drift, 2), 0);
    // Standar deviasi sampel (n-1)
    const volatility = Math.sqrt(varianceSum / (logReturns.length - 1));

    // 4. Tentukan tanggal target prediksi (esok hari kerja)
    const targetDate = tanggalPrediksiParam || getNextTradingDay(tanggalTerakhir);

    // 5. Jalankan Simulasi Monte Carlo menggunakan rumus GBM (Tanpa double subtraction pada drift)
    const simulatedPrices: number[] = [];
    for (let i = 0; i < simulations; i++) {
      const Z = randomNormal();
      // Drift harian empiris (drift) adalah estimator dari (mu - 0.5 * sigma^2).
      // Sehingga exponent untuk simulasi log-normal adalah: drift + volatility * Z.
      const exponent = drift + volatility * Z;
      const sSim = S0 * Math.exp(exponent);
      simulatedPrices.push(sSim);
    }

    // 6. Analisis Statistik Hasil Simulasi
    simulatedPrices.sort((a, b) => a - b);
    
    // Rata-rata (mean) hasil simulasi
    const sumSim = simulatedPrices.reduce((a, b) => a + b, 0);
    const meanPrediction = sumSim / simulations;

    // Batas bawah (2.5%) dan batas atas (97.5%) untuk Confidence Interval 95%
    const lowerIdx = Math.floor(simulations * 0.025);
    const upperIdx = Math.floor(simulations * 0.975);
    const lowerBound = simulatedPrices[lowerIdx];
    const upperBound = simulatedPrices[upperIdx];

    // Hitung probabilitas harga naik (prediksi > S0)
    const upCount = simulatedPrices.filter(p => p > S0).length;
    const upProbability = (upCount / simulations) * 100;

    // 7. Simpan hasil rata-rata prediksi ke database Supabase
    // Cek harga aktual esok hari di database (jika sebelumnya sudah ada di sistem)
    const { error: saveError } = await supabase
      .from('hasil_prediksi')
      .upsert({
        kode_saham: kodeSaham,
        tanggal: targetDate,
        harga_prediksi: Math.round(meanPrediction),
      }, { onConflict: 'kode_saham,tanggal' });

    if (saveError) {
      return NextResponse.json(
        { success: false, message: 'Gagal menyimpan hasil prediksi ke database.', error: saveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil menjalankan simulasi prediksi Monte Carlo.',
      data: {
        kodeSaham,
        tanggalTerakhir,
        tanggalPrediksi: targetDate,
        hargaHariIni: S0,
        hargaPrediksi: Math.round(meanPrediction),
        totalSampleHistoris: n,
        parameters: {
          driftHarianPersen: (drift * 100).toFixed(4) + '%',
          volatilitasHarianPersen: (volatility * 100).toFixed(4) + '%',
        },
        probabilitasNaik: upProbability.toFixed(2) + '%',
        confidenceInterval95: {
          batasBawah: Math.round(lowerBound),
          batasAtas: Math.round(upperBound),
        },
        // Kembalikan sampel 100 simulasi pertama untuk plotting visual jika diperlukan di frontend
        simulasiSampel: simulatedPrices.slice(0, 100).map(p => Math.round(p)),
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem internal.', error: error.message },
      { status: 500 }
    );
  }
}
