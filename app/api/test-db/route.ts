import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const results: any = {};
  
  try {
    const { data: users, error: usersError } = await supabase.from('users').select('*').limit(5);
    results.users = { success: !usersError, data: users, error: usersError };
  } catch (e: any) {
    results.users = { success: false, error: e.message };
  }

  try {
    const { data: saham, error: sahamError } = await supabase.from('saham').select('*').limit(5);
    results.saham = { success: !sahamError, data: saham, error: sahamError };
  } catch (e: any) {
    results.saham = { success: false, error: e.message };
  }

  try {
    const { data: harga_historis, error: hhError } = await supabase.from('harga_historis').select('*').limit(5);
    results.harga_historis = { success: !hhError, data: harga_historis, error: hhError };
  } catch (e: any) {
    results.harga_historis = { success: false, error: e.message };
  }

  return NextResponse.json(results);
}
