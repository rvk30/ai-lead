// In-memory job store for tracking scraping jobs
interface JobData {
  company_name: string;
  mobile_number: string;
  website_url: string;
  address: string;
  business_category: string;
  source_file: string;
  email?: string;
  google_rating?: string;
}

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
  data: JobData[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

// In-memory store
const jobs = new Map<string, Job>();

// Cleanup old jobs (> 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.updatedAt < oneHourAgo && job.status !== 'processing') {
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export function createJob(location: string, category: string): string {
  const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  jobs.set(id, {
    id,
    status: 'processing',
    location,
    category,
    progress: {
      current: 0,
      total: 0,
      message: 'Initializing...',
    },
    foundCount: 0,
    insertedCount: 0,
    skippedCount: 0,
    data: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  return id;
}

export function updateJob(
  id: string,
  updates: Partial<Omit<Job, 'id' | 'createdAt'>>
): void {
  const job = jobs.get(id);
  if (!job) return;
  
  Object.assign(job, updates, { updatedAt: Date.now() });
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function completeJob(id: string, data: JobData[]): void {
  const job = jobs.get(id);
  if (!job) return;
  
  job.status = 'completed';
  job.data = data;
  job.updatedAt = Date.now();
}

export function failJob(id: string, error: string): void {
  const job = jobs.get(id);
  if (!job) return;
  
  job.status = 'failed';
  job.error = error;
  job.updatedAt = Date.now();
}

export function stopJob(id: string): void {
  const job = jobs.get(id);
  if (!job) return;
  
  job.status = 'stopped';
  job.updatedAt = Date.now();
}

export function addJobData(id: string, newData: JobData): void {
  const job = jobs.get(id);
  if (!job) return;
  
  job.data.push(newData);
  job.updatedAt = Date.now();
}
