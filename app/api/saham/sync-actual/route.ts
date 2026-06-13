import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 1. Ambil data hasil prediksi yang harga_aktual-nya kosong atau 0
    const { data: missingActuals, error: fetchError } = await supabase
      .from('hasil_prediksi')
      .select('id, kode_saham, tanggal, harga_prediksi')
      .or('harga_aktual.is.null,harga_aktual.eq.0');

    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data prediksi dengan harga aktual kosong.', error: fetchError.message },
        { status: 500 }
      );
    }

    if (!missingActuals || missingActuals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Semua data aktual hasil prediksi sudah terisi lengkap.',
        updatedCount: 0
      });
    }

    // 2. Kelompokkan berdasarkan kode saham
    const missingByStock: { [key: string]: typeof missingActuals } = {};
    for (const item of missingActuals) {
      if (!missingByStock[item.kode_saham]) {
        missingByStock[item.kode_saham] = [];
      }
      missingByStock[item.kode_saham].push(item);
    }

    let totalUpdated = 0;

    // 3. Untuk setiap saham, tarik data harga historis dari Yahoo Finance
    for (const kodeSaham of Object.keys(missingByStock)) {
      const items = missingByStock[kodeSaham];
      const symbol = `${kodeSaham}.JK`;
      // Tarik histori 1 tahun ke belakang agar mencakup tanggal prediksi
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        },
      });

      if (!res.ok) continue; // Lewati jika Yahoo API error untuk emiten ini

      const data = await res.json();
      const chartData = data?.chart?.result?.[0];
      if (!chartData) continue;

      const timestamps = chartData.timestamp || [];
      const closePrices = chartData.indicators?.quote?.[0]?.close || [];

      // Buat map tanggal -> harga penutupan aktual
      const priceMap = new Map<string, number>();
      for (let i = 0; i < timestamps.length; i++) {
        const price = closePrices[i];
        if (price === null || price === undefined) continue;

        const dateObj = new Date(timestamps[i] * 1000);
        const dateStr = dateObj.toISOString().split('T')[0];
        priceMap.set(dateStr, Math.round(price));
      }

      // Cocokkan dan siapkan baris untuk di-update
      const updateRows = [];
      for (const item of items) {
        if (priceMap.has(item.tanggal)) {
          const actualPrice = priceMap.get(item.tanggal)!;
          updateRows.push({
            id: item.id,
            kode_saham: item.kode_saham,
            tanggal: item.tanggal,
            harga_prediksi: item.harga_prediksi,
            harga_aktual: actualPrice
          });
        }
      }

      if (updateRows.length > 0) {
        // Bulk upsert ke Supabase hasil_prediksi
        const { error: updateError } = await supabase
          .from('hasil_prediksi')
          .upsert(updateRows, { onConflict: 'kode_saham,tanggal' });

        if (!updateError) {
          totalUpdated += updateRows.length;
        } else {
          console.error(`Error updating actuals for ${kodeSaham}:`, updateError.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi harga aktual selesai. Berhasil memperbarui ${totalUpdated} baris data.`,
      updatedCount: totalUpdated
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem internal.', error: error.message },
      { status: 500 }
    );
  }
}
