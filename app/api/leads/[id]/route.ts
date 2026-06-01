import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET single lead
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      'SELECT * FROM company_master WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Get lead error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// UPDATE lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { 
      company_name, 
      mobile_number, 
      email, 
      website_url, 
      address, 
      state, 
      business_category, 
      google_rating 
    } = await request.json();

    // Calculate quality score
    const qualityScore = [company_name, mobile_number, email, website_url, address]
      .filter(field => field && String(field).trim() !== '').length * 20;

    const result = await pool.query(
      `UPDATE company_master
       SET company_name      = $1,
           mobile_number     = $2,
           email            = $3,
           website_url      = $4,
           address          = $5,
           state            = $6,
           business_category = $7,
           google_rating    = $8,
           quality_score    = $9
       WHERE id = $10
       RETURNING *`,
      [
        company_name,
        mobile_number,
        email,
        website_url,
        address,
        state,
        business_category,
        google_rating ? parseFloat(google_rating) : null,
        qualityScore,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Lead updated', data: result.rows[0] },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Update lead error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// DELETE lead
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM company_master WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Lead deleted', data: result.rows[0] },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Delete lead error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
