import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { 
      company_name, 
      mobile_number, 
      email, 
      website_url, 
      address, 
      state, 
      business_category, 
      google_rating,
      source_file 
    } = await request.json();

    // Validation
    if (!company_name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company name required',
        },
        { status: 400 }
      );
    }

    // Calculate quality score based on filled fields
    const qualityScore = [company_name, mobile_number, email, website_url, address]
      .filter(field => field && String(field).trim() !== '').length * 20;

    // Insert Query
    const result = await pool.query(
      `INSERT INTO company_master (
         company_name, mobile_number, email, website_url, address, 
         state, business_category, quality_score, google_rating, source_file
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        company_name, 
        mobile_number, 
        email, 
        website_url, 
        address, 
        state, 
        business_category, 
        qualityScore,
        google_rating ? parseFloat(google_rating) : null,
        source_file || 'manual'
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Lead created',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Lead creation error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
