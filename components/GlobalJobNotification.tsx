'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Job {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'stopped';
  location: string;
  category: string;
  progress: {
    current: number;
    total: number;
    message: string;
  };
  foundCount: number;
  insertedCount: number;
  skippedCount: number;
  dataCount: number;
}

export default function GlobalJobNotification() {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [minimized, setMinimized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for active job in localStorage
    const checkActiveJob = async () => {
      const jobId = localStorage.getItem('activeJobId');
      if (!jobId) {
        setActiveJob(null);
        return;
      }

      try {
        const res = await fetch(`/api/jobs/${jobId}/status`);
        const data = await res.json();

        if (data.success) {
          const job = data.job;
          
          if (job.status === 'completed' || job.status === 'failed' || job.status === 'stopped') {
            // Job finished, remove from localStorage
            localStorage.removeItem('activeJobId');
            setActiveJob(null);
          } else {
            setActiveJob(job);
          }
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error);
      }
    };

    checkActiveJob();
    const interval = setInterval(checkActiveJob, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  if (!activeJob || pathname === '/maps-search') {
    // Don't show on maps-search page (it has its own UI)
    return null;
  }

  const progressPercent = activeJob.foundCount > 0
    ? Math.round((activeJob.dataCount / activeJob.foundCount) * 100)
    : 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        {minimized ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Scraping in progress...</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">{activeJob.dataCount}/{activeJob.foundCount}</span>
              <button
                onClick={() => setMinimized(false)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition"
              >
                Show
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <div className="font-semibold">Google Maps Scraping</div>
                  <div className="text-sm text-blue-100">
                    {activeJob.category} in {activeJob.location}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/maps-search')}
                  className="px-4 py-1.5 bg-white text-blue-600 rounded hover:bg-blue-50 transition text-sm font-medium"
                >
                  View Details
                </button>
                <button
                  onClick={() => setMinimized(true)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded transition text-sm"
                >
                  Minimize
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{activeJob.progress.message || 'Processing...'}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <span>Found: {activeJob.foundCount}</span>
              <span>✅ Inserted: {activeJob.insertedCount}</span>
              <span>⏭️ Skipped: {activeJob.skippedCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
