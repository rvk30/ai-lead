import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qualityScore = searchParams.get('quality_score');

    if (!qualityScore) {
      return NextResponse.json(
        { success: false, message: 'quality_score parameter is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT *
       FROM company_master
       WHERE quality_score = $1
       ORDER BY created_at DESC`,
      [qualityScore]
    );

    return NextResponse.json(
      { success: true, data: result.rows },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Filter leads error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
