'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface ScrapedLead {
  company_name: string;
  mobile_number: string;
  website_url: string;
  address: string;
  business_category: string;
  source_file: string;
  email?: string;
  google_rating?: string;
}

interface SearchResult {
  success: boolean;
  totalScraped: number;
  totalInserted: number;
  totalSkipped: number;
  data: ScrapedLead[];
}

interface StreamProgress {
  type: string;
  message?: string;
  count?: number;
  current?: number;
  total?: number;
  data?: ScrapedLead;
  inserted?: boolean;
  totalInserted?: number;
  totalSkipped?: number;
}

type ScrapeMode = 'fast' | 'enrich' | 'full';

const MODE_INFO = {
  fast: {
    label: 'Fast',
    icon: '⚡',
    desc: 'Sirf company names — sabse tez',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    activeColor: 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300',
  },
  enrich: {
    label: 'Enrich',
    icon: '📊',
    desc: 'Name + phone + website + rating',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    activeColor: 'border-blue-500 bg-blue-50 ring-2 ring-blue-300',
  },
  full: {
    label: 'Full',
    icon: '🔍',
    desc: 'Sab kuch + email bhi (slowest)',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    activeColor: 'border-purple-500 bg-purple-50 ring-2 ring-purple-300',
  },
};

export default function MapsSearchPage() {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [mode, setMode] = useState<ScrapeMode>('enrich');
  const [searching, setSearching] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [liveData, setLiveData] = useState<ScrapedLead[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [foundCount, setFoundCount] = useState(0);
  const [insertedCount, setInsertedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [processId, setProcessId] = useState<string | null>(null);

  // useRef so stop handler always gets latest processId
  const processIdRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const popularLocations = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Gurgaon', 'Chennai', 'Hyderabad'];
  const popularCategories = [
    'Restaurants', 'Hotels', 'IT Companies', 'Manufacturing Companies',
    'Real Estate', 'Gyms', 'Salons', 'Hospitals',
  ];

  // Restore saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('mapsSearchState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.results && !parsed.searching) {
          setResults(parsed.results);
          setLocation(parsed.location || '');
          setCategory(parsed.category || '');
          setMode(parsed.mode || 'enrich');
          setLiveData(parsed.liveData || []);
          setInsertedCount(parsed.insertedCount || 0);
          setSkippedCount(parsed.skippedCount || 0);
          setFoundCount(parsed.foundCount || 0);
        }
      } catch (err) {
        console.error('Failed to restore state:', err);
      }
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    if (results) {
      const stateToSave = {
        searching: false,
        location,
        category,
        mode,
        liveData,
        foundCount,
        insertedCount,
        skippedCount,
        results,
        timestamp: Date.now(),
      };
      localStorage.setItem('mapsSearchState', JSON.stringify(stateToSave));
    }
  }, [results]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStop = async () => {
    const currentProcessId = processIdRef.current;
    if (!currentProcessId) return;

    setStopping(true);
    try {
      await fetch('/api/map-search-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId: currentProcessId }),
      });
    } catch (err) {
      console.error('Stop request failed:', err);
    }
    // UI state stream event se update hoga (type: 'stopped')
  };

  const handleSearch = async () => {
    if (!location.trim() || !category.trim()) {
      setError('Please enter both location and category');
      return;
    }

    // Purana stream band karo agar chal raha hai
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setSearching(true);
    setStopping(false);
    setError('');
    setResults(null);
    setLiveData([]);
    setProgress({ current: 0, total: 0, message: '' });
    setFoundCount(0);
    setInsertedCount(0);
    setSkippedCount(0);
    setProcessId(null);
    processIdRef.current = null;

    try {
      let currentLiveData: ScrapedLead[] = [];

      const url = `/api/map-search-stream?location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}&mode=${mode}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data.trim() === '') return;

          let data: StreamProgress & { processId?: string };
          try {
            data = JSON.parse(event.data);
          } catch {
            console.error('JSON parse error, raw:', event.data);
            return;
          }

          // processId capture karo jab milta hai
          if (data.processId && !processIdRef.current) {
            processIdRef.current = data.processId;
            setProcessId(data.processId);
          }

          if (data.type === 'status') {
            setProgress(prev => ({ ...prev, message: data.message || '' }));

          } else if (data.type === 'scroll') {
            setProgress(prev => ({
              ...prev,
              message: `Scrolling: ${data.current ?? 0}/${data.total ?? 5}`,
            }));

          } else if (data.type === 'found') {
            setFoundCount(data.count || 0);
            setProgress(prev => ({
              ...prev,
              total: data.count || 0,
              message: data.message || '',
            }));

          } else if (data.type === 'progress') {
            setProgress({
              current: data.current || 0,
              total: data.total || 0,
              message: data.message || '',
            });

          } else if (data.type === 'business' && data.data) {
            currentLiveData = [...currentLiveData, data.data];
            setLiveData([...currentLiveData]);
            setProgress(prev => ({
              ...prev,
              current: data.count || prev.current,
              message: `Scraped ${data.count}/${data.total} businesses`,
            }));
            if (data.totalInserted !== undefined) setInsertedCount(data.totalInserted);
            if (data.totalSkipped !== undefined) setSkippedCount(data.totalSkipped);

          } else if (data.type === 'complete') {
            eventSource.close();
            eventSourceRef.current = null;
            setSearching(false);
            setStopping(false);
            const finalResult = {
              success: true,
              totalScraped: currentLiveData.length,
              totalInserted: data.totalInserted || 0,
              totalSkipped: data.totalSkipped || 0,
              data: currentLiveData,
            };
            setResults(finalResult);
            localStorage.setItem('mapsSearchState', JSON.stringify({
              searching: false, location, category, mode,
              liveData: currentLiveData,
              foundCount, insertedCount: data.totalInserted || 0,
              skippedCount: data.totalSkipped || 0,
              results: finalResult,
              timestamp: Date.now(),
            }));

          } else if (data.type === 'stopped') {
            eventSource.close();
            eventSourceRef.current = null;
            setSearching(false);
            setStopping(false);
            // Jo bhi scrape hua usse result mein dikha do
            if (currentLiveData.length > 0) {
              setResults({
                success: true,
                totalScraped: currentLiveData.length,
                totalInserted: data.totalInserted || 0,
                totalSkipped: data.totalSkipped || 0,
                data: currentLiveData,
              });
            }

          } else if (data.type === 'error') {
            eventSource.close();
            eventSourceRef.current = null;
            setSearching(false);
            setStopping(false);
            setError(data.message || 'Search failed');
          }
        } catch (err) {
          console.error('Event parse failed:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
        setSearching(false);
        setStopping(false);
        setError('Connection lost. Please try again.');
      };

    } catch (err: any) {
      console.error(err);
      setError('Failed to start search');
      setSearching(false);
    }
  };

  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setLocation('');
    setCategory('');
    setMode('enrich');
    setResults(null);
    setError('');
    setLiveData([]);
    setProgress({ current: 0, total: 0, message: '' });
    setFoundCount(0);
    setInsertedCount(0);
    setSkippedCount(0);
    setSearching(false);
    setStopping(false);
    setProcessId(null);
    processIdRef.current = null;
    localStorage.removeItem('mapsSearchState');
  };

  const progressPercent = foundCount > 0 ? Math.min(100, Math.round((liveData.length / foundCount) * 100)) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Google Maps Lead Finder</h1>
            <p className="text-sm text-gray-500">Search businesses on Google Maps and import them automatically</p>
          </div>
        </div>
      </div>

      {/* Restored State Notification */}
      {results && !searching && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              <strong>Previous search results:</strong> "{category}" in "{location}"
            </p>
            <button onClick={handleReset} className="text-xs text-blue-600 hover:underline mt-1">
              Clear and start new search
            </button>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📍 Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Gurgaon, Mumbai, Delhi"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={searching}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-gray-500">Popular:</span>
              {popularLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  disabled={searching}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-md transition disabled:opacity-50"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Business Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Restaurants, IT Companies"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={searching}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-gray-500">Popular:</span>
              {popularCategories.slice(0, 4).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  disabled={searching}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-md transition disabled:opacity-50"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">⚙️ Scraping Mode</label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(MODE_INFO) as ScrapeMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={searching}
                className={`p-3 rounded-lg border-2 text-left transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === m ? MODE_INFO[m].activeColor : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{MODE_INFO[m].icon}</div>
                <div className={`text-sm font-semibold ${mode === m ? '' : 'text-gray-800'}`}>
                  {MODE_INFO[m].label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{MODE_INFO[m].desc}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {searching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search & Import Leads
              </>
            )}
          </button>

          {/* Stop Button - searching ke time dikhega */}
          {searching && (
            <button
              onClick={handleStop}
              disabled={stopping}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 font-medium flex items-center gap-2"
            >
              {stopping ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 10h6v4H9z" />
                  </svg>
                  Stop
                </>
              )}
            </button>
          )}

          {results && !searching && (
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Search Again
            </button>
          )}
        </div>
      </div>

      {/* Progress Card */}
      {searching && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">Searching Google Maps...</h3>
              <p className="text-sm text-gray-500 truncate">{progress.message || 'Initializing...'}</p>
            </div>
            {foundCount > 0 && (
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-blue-600">{liveData.length}/{foundCount}</div>
                <div className="text-xs text-gray-500">Scraped</div>
              </div>
            )}
          </div>

          {foundCount > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {(insertedCount > 0 || skippedCount > 0) && (
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="text-green-600 font-semibold">✅ {insertedCount} Inserted</span>
                  <span className="text-yellow-600 font-semibold">⏭️ {skippedCount} Skipped</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5 text-sm text-gray-600">
            <p className={progress.message?.includes('Opening') ? 'text-blue-600 font-medium' : ''}>
              {progress.message?.includes('Opening') ? '🔄' : '✓'} Opening Google Maps...
            </p>
            <p className={progress.message?.includes('Scrolling') ? 'text-blue-600 font-medium' : ''}>
              {progress.message?.includes('Scrolling') ? '🔄 ' + progress.message : (foundCount > 0 ? '✓ Searched for businesses' : '⏳ Searching for businesses...')}
            </p>
            {foundCount > 0 && (
              <p className="text-green-600 font-medium">✓ Found {foundCount} businesses</p>
            )}
            {liveData.length > 0 && (
              <p className="text-blue-600 font-medium">
                🔄 Extracting details ({MODE_INFO[mode].label} mode): {liveData.length}/{foundCount}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Live Data Table */}
      {searching && liveData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">📋 Live Results ({liveData.length})</h3>
              <p className="text-sm text-gray-500 mt-1">Real-time update as businesses are scraped</p>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#', 'Company Name', 'Phone', 'Email', 'Website', 'Rating', 'Address'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liveData.map((lead, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">
                            {(lead.company_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{lead.company_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{lead.mobile_number || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-blue-600 max-w-[160px] truncate">
                      {lead.website_url ? lead.website_url.substring(0, 28) + '...' : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lead.google_rating ? <span>⭐ {lead.google_rating}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">{lead.address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {stopping ? '⏹️ Scraping Stopped' : '🎉 Search Complete!'}
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">{results.totalScraped}</div>
                  <div className="text-sm text-gray-600">Total Found</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">{results.totalInserted}</div>
                  <div className="text-sm text-gray-600">✅ Imported</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-yellow-600">{results.totalSkipped}</div>
                  <div className="text-sm text-gray-600">⏭️ Skipped</div>
                </div>
              </div>
              <Link
                href="/leads"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                View All Leads →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Final Data Table */}
      {results && results.data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">📋 Scraped Businesses ({results.data.length})</h3>
            <p className="text-sm text-gray-500 mt-1">Preview of businesses found on Google Maps</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['#', 'Company Name', 'Phone', 'Email', 'Website', 'Rating', 'Address', 'Category'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.data.map((lead, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">
                            {(lead.company_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{lead.company_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{lead.mobile_number || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-blue-600 max-w-[160px] truncate">
                      {lead.website_url ? (
                        <a
                          href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-1"
                          title={lead.website_url}
                        >
                          {lead.website_url.length > 28 ? lead.website_url.substring(0, 28) + '...' : lead.website_url}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lead.google_rating ? <span>⭐ {lead.google_rating}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate" title={lead.address}>
                      {lead.address || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.business_category || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty Results */}
      {results && results.data.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-500 mb-4">No businesses found for "{category}" in "{location}"</p>
          <button onClick={handleReset} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Try Different Search
          </button>
        </div>
      )}
    </div>
  );
}