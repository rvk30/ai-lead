import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/jobManager';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const job = getJob(id);

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      location: job.location,
      category: job.category,
      progress: job.progress,
      foundCount: job.foundCount,
      insertedCount: job.insertedCount,
      skippedCount: job.skippedCount,
      dataCount: job.data.length,
      data: job.data,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
  });
}
