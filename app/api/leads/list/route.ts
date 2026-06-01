import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile     = searchParams.get('mobile_number');
    const email      = searchParams.get('email');
    const website    = searchParams.get('website_url');
    const state      = searchParams.get('state');
    const category   = searchParams.get('business_category');

    let query = 'SELECT * FROM company_master WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 1;

    if (mobile) {
      query += ` AND mobile_number = $${paramCount}`;
      queryParams.push(mobile);
      paramCount++;
    }

    if (email) {
      query += ` AND email = $${paramCount}`;
      queryParams.push(email);
      paramCount++;
    }

    if (website) {
      query += ` AND website_url = $${paramCount}`;
      queryParams.push(website);
      paramCount++;
    }

    if (state) {
      query += ` AND state = $${paramCount}`;
      queryParams.push(state);
      paramCount++;
    }

    if (category) {
      query += ` AND business_category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, queryParams);

    return NextResponse.json(
      {
        success: true,
        data: result.rows,
        count: result.rows.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Lead list error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
