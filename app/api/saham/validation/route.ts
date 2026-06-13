import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kodeSaham = searchParams.get('kodeSaham')?.toUpperCase();

    // 1. Ambil data hasil prediksi (dan data aktual jika ada) dari database
    let query = supabase
      .from('hasil_prediksi')
      .select('kode_saham, tanggal, harga_aktual, harga_prediksi')
      .order('tanggal', { ascending: true });

    if (kodeSaham) {
      query = query.eq('kode_saham', kodeSaham);
    }

    const { data: records, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data hasil prediksi.', error: error.message },
        { status: 500 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // 2. Kelompokkan data berdasarkan kode saham
    const groupedData: { [key: string]: typeof records } = {};
    for (const record of records) {
      if (!groupedData[record.kode_saham]) {
        groupedData[record.kode_saham] = [];
      }
      groupedData[record.kode_saham].push(record);
    }

    // 3. Hitung statistik untuk setiap kelompok saham
    const result = Object.keys(groupedData).map(kode => {
      const group = groupedData[kode];
      const jumlahSampel = group.length;

      // Hitung rata-rata harga prediksi
      const sumPred = group.reduce((sum, item) => sum + item.harga_prediksi, 0);
      const rataRata = sumPred / jumlahSampel;

      // Hitung Standar Deviasi sampel untuk prediksi
      let stdDev = 0;
      if (jumlahSampel > 1) {
        const varianceSum = group.reduce((sum, item) => sum + Math.pow(item.harga_prediksi - rataRata, 2), 0);
        stdDev = Math.sqrt(varianceSum / (jumlahSampel - 1));
      }

      // Hitung Confidence Interval 95% untuk rata-rata (z-score = 1.96)
      const zScore = 1.96;
      const marginOfError = jumlahSampel > 0 ? zScore * (stdDev / Math.sqrt(jumlahSampel)) : 0;
      const lowerBound = Math.round(rataRata - marginOfError);
      const upperBound = Math.round(rataRata + marginOfError);

      // Hitung MAPE dan RMSE (hanya dari data yang memiliki harga_aktual)
      const validPairs = group.filter(item => item.harga_aktual !== null && item.harga_aktual !== undefined && item.harga_aktual > 0);
      const k = validPairs.length;
      
      let mape: number | null = null;
      let rmse: number | null = null;

      if (k > 0) {
        // Hitung MAPE
        const sumAbsolutePercentageError = validPairs.reduce((sum, item) => {
          const actual = item.harga_aktual as number;
          const prediction = item.harga_prediksi;
          return sum + (Math.abs(actual - prediction) / actual);
        }, 0);
        mape = (sumAbsolutePercentageError / k) * 100;

        // Hitung RMSE
        const sumSquaredError = validPairs.reduce((sum, item) => {
          const actual = item.harga_aktual as number;
          const prediction = item.harga_prediksi;
          return sum + Math.pow(actual - prediction, 2);
        }, 0);
        rmse = Math.sqrt(sumSquaredError / k);
      }

      return {
        kodeSaham: kode,
        jumlahSampel,
        rataRata: Math.round(rataRata),
        standarDeviasi: Math.round(stdDev),
        confidenceInterval: {
          batasBawah: lowerBound,
          batasAtas: upperBound,
          formatted: `${lowerBound} - ${upperBound}`
        },
        evaluasiAkurasi: k > 0 ? {
          jumlahEvaluasi: k,
          mape: parseFloat(mape!.toFixed(2)),
          mapeStatus: mape! < 10 ? 'Sangat Akurat' : (mape! < 20 ? 'Baik' : (mape! < 50 ? 'Layak' : 'Tidak Akurat')),
          rmse: parseFloat(rmse!.toFixed(2))
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem internal.', error: error.message },
      { status: 500 }
    );
  }
}
