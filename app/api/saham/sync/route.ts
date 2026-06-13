import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kodeSaham = searchParams.get('kodeSaham')?.toUpperCase();
    const range = searchParams.get('range') || '1y';

    if (!kodeSaham) {
      return NextResponse.json(
        { success: false, message: 'Parameter kodeSaham wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Pastikan emiten terdaftar di tabel saham (Master)
    // Jika belum ada, buat record dengan nama default
    const { error: emitenError } = await supabase
      .from('saham')
      .upsert(
        { kode_saham: kodeSaham, nama_saham: `${kodeSaham} Stock` },
        { onConflict: 'kode_saham' }
      );

    if (emitenError) {
      return NextResponse.json(
        { success: false, message: 'Gagal membuat/verifikasi master saham.', error: emitenError.message },
        { status: 500 }
      );
    }

    // 2. Fetch data dari Yahoo Finance
    const symbol = `${kodeSaham}.JK`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Yahoo Finance API mengembalikan HTTP ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const chartData = data?.chart?.result?.[0];

    if (!chartData) {
      return NextResponse.json(
        { success: false, message: 'Data saham tidak ditemukan di Yahoo Finance.' },
        { status: 404 }
      );
    }

    const timestamps = chartData.timestamp || [];
    const closePrices = chartData.indicators?.quote?.[0]?.close || [];

    if (timestamps.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada data harga historis yang tersedia.' },
        { status: 404 }
      );
    }

    // 3. Persiapkan baris data untuk bulk upsert
    const upsertRows = [];
    for (let i = 0; i < timestamps.length; i++) {
      const price = closePrices[i];
      // Lewati jika harga penutupan kosong (null)
      if (price === null || price === undefined) continue;

      const dateObj = new Date(timestamps[i] * 1000);
      const tanggal = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD

      upsertRows.push({
        kode_saham: kodeSaham,
        tanggal: tanggal,
        harga_penutupan: price,
      });
    }

    if (upsertRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data historis ada tetapi seluruh harga bernilai kosong.' },
        { status: 404 }
      );
    }

    // 4. Bulk upsert ke tabel harga_historis di Supabase
    const { error: dbError } = await supabase
      .from('harga_historis')
      .upsert(upsertRows, { onConflict: 'kode_saham,tanggal' });

    if (dbError) {
      return NextResponse.json(
        { success: false, message: 'Gagal menyimpan data ke database Supabase.', error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan data historis saham ${kodeSaham}.`,
      count: upsertRows.length,
      data: {
        firstDate: upsertRows[0].tanggal,
        lastDate: upsertRows[upsertRows.length - 1].tanggal,
        lastPrice: upsertRows[upsertRows.length - 1].harga_penutupan,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem internal.', error: error.message },
      { status: 500 }
    );
  }
}
