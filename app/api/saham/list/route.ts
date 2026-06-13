import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Ambil daftar seluruh emiten saham yang ada di master saham
    const { data, error } = await supabase
      .from('saham')
      .select('kode_saham, nama_saham, sektor')
      .order('kode_saham', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil daftar saham.', error: error.message },
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
