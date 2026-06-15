import { NextRequest, NextResponse } from 'next/server';
import scrapingRegistry from '@/lib/scrapingRegistry';

export async function POST(req: NextRequest) {
  try {
    const { processId, location, category } = await req.json();

    let stopped = false;

    if (processId) {
      // Stop by specific process ID
      stopped = scrapingRegistry.stopProcess(processId);
    } else if (location && category) {
      // Find and stop by location and category
      const activeId = scrapingRegistry.getActiveProcessId(location, category);
      if (activeId) {
        stopped = scrapingRegistry.stopProcess(activeId);
      }
    }

    if (stopped) {
      return NextResponse.json({
        success: true,
        message: 'Scraping process stopped successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'No active scraping process found',
        },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Stop scraping error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to stop scraping' },
      { status: 500 }
    );
  }
}
