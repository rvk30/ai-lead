import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name parameter is required',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT *
       FROM company_master
       WHERE LOWER(company_name) LIKE LOWER($1)`,
      [`%${name}%`]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Search leads error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
