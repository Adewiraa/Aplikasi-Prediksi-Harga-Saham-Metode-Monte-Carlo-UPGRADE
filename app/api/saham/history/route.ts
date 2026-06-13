import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kodeSaham = searchParams.get('kodeSaham')?.toUpperCase();

    if (!kodeSaham) {
      return NextResponse.json(
        { success: false, message: 'Parameter kodeSaham wajib diisi.' },
        { status: 400 }
      );
    }

    // Ambil riwayat harga historis dari database
    const { data, error } = await supabase
      .from('harga_historis')
      .select('tanggal, harga_penutupan')
      .eq('kode_saham', kodeSaham)
      .order('tanggal', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil riwayat harga historis.', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem internal.', error: error.message },
      { status: 500 }
    );
  }
}
