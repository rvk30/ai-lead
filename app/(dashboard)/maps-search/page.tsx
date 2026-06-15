'use client';

import { useState, useEffect } from 'react';
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

export default function MapsSearchPage() {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [streamMode, setStreamMode] = useState(true);
  const [liveData, setLiveData] = useState<ScrapedLead[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [foundCount, setFoundCount] = useState(0);
  const [insertedCount, setInsertedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [eventSourceRef, setEventSourceRef] = useState<EventSource | null>(null);

  const popularLocations = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Gurgaon', 'Chennai', 'Hyderabad'];
  const popularCategories = [
    'Restaurants',
    'Hotels',
    'IT Companies',
    'Manufacturing Companies',
    'Real Estate',
    'Gyms',
    'Salons',
    'Hospitals',
  ];

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('mapsSearchState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        
        // If search is in progress, reconnect
        if (parsed.searching && parsed.location && parsed.category) {
          setLocation(parsed.location);
          setCategory(parsed.category);
          setSearching(true);
          setLiveData(parsed.liveData || []);
          setFoundCount(parsed.foundCount || 0);
          setInsertedCount(parsed.insertedCount || 0);
          setSkippedCount(parsed.skippedCount || 0);
          setProgress(parsed.progress || { current: 0, total: 0, message: '' });
          
          // Reconnect to stream
          reconnectStream(parsed.location, parsed.category, parsed.liveData || []);
        } else if (parsed.results) {
          // Restore completed results
          setResults(parsed.results);
          setLocation(parsed.location || '');
          setCategory(parsed.category || '');
        }
      } catch (err) {
        console.error('Failed to restore state:', err);
      }
    }
  }, []);

  // Cleanup on unmount - DON'T close stream
  useEffect(() => {
    return () => {
      // Don't close EventSource on unmount - let it continue in background
      // Stream will auto-close when complete
    };
  }, []);

  // Save state whenever any relevant state changes
  useEffect(() => {
    if (searching || results) {
      const stateToSave = {
        searching,
        location,
        category,
        liveData,
        foundCount,
        insertedCount,
        skippedCount,
        progress,
        results,
        timestamp: Date.now(),
      };
      localStorage.setItem('mapsSearchState', JSON.stringify(stateToSave));
    }
  }, [searching, results, location, category, liveData, foundCount, insertedCount, skippedCount, progress]);

  const reconnectStream = (loc: string, cat: string, existingData: ScrapedLead[]) => {
    let currentLiveData = [...existingData];

    const eventSource = new EventSource(
      `/api/map-search-stream?location=${encodeURIComponent(loc)}&category=${encodeURIComponent(cat)}`
    );

    setEventSourceRef(eventSource);

    eventSource.onmessage = (event) => {
      try {
        // Validate event data before parsing
        if (!event.data || event.data.trim() === '') {
          console.warn('Empty event data received');
          return;
        }

        let data: StreamProgress;
        try {
          data = JSON.parse(event.data);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Raw event data:', event.data);
          return; // Skip this event and continue
        }
        
        if (data.type === 'status') {
          setProgress(prev => ({ ...prev, message: data.message || '' }));
        } else if (data.type === 'scroll') {
          setProgress(prev => ({ 
            ...prev, 
            message: `Scrolling: ${data.current}/${data.total}` 
          }));
        } else if (data.type === 'found') {
          setFoundCount(data.count || 0);
          setProgress(prev => ({ 
            ...prev, 
            total: data.count || 0,
            message: data.message || '' 
          }));
        } else if (data.type === 'progress') {
          setProgress({ 
            current: data.current || 0, 
            total: data.total || 0,
            message: data.message || '' 
          });
        } else if (data.type === 'business') {
          if (data.data) {
            // Check if already exists (avoid duplicates on reconnect)
            const exists = currentLiveData.some(
              item => item.company_name === data.data?.company_name
            );
            
            if (!exists) {
              currentLiveData = [...currentLiveData, data.data];
              setLiveData(currentLiveData);
            }
            
            setProgress(prev => ({ 
              ...prev, 
              current: data.count || prev.current,
              message: `Scraped ${data.count}/${data.total} businesses` 
            }));
            
            if (data.totalInserted !== undefined) {
              setInsertedCount(data.totalInserted);
            }
            if (data.totalSkipped !== undefined) {
              setSkippedCount(data.totalSkipped);
            }
          }
        } else if (data.type === 'complete') {
          eventSource.close();
          setSearching(false);
          setEventSourceRef(null);
          setResults({
            success: true,
            totalScraped: currentLiveData.length,
            totalInserted: data.totalInserted || currentLiveData.length,
            totalSkipped: data.totalSkipped || 0,
            data: currentLiveData,
          });
        } else if (data.type === 'error') {
          eventSource.close();
          setSearching(false);
          setEventSourceRef(null);
          setError(data.message || 'Search failed');
        }
      } catch (err) {
        console.error('Failed to parse event:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setSearching(false);
      setEventSourceRef(null);
      setError('Connection lost. Please try again.');
    };
  };

  const handleSearch = async () => {
    if (!location.trim() || !category.trim()) {
      setError('Please enter both location and category');
      return;
    }

    setSearching(true);
    setError('');
    setResults(null);
    setLiveData([]);
    setProgress({ current: 0, total: 0, message: '' });
    setFoundCount(0);
    setInsertedCount(0);
    setSkippedCount(0);

    if (streamMode) {
      // Use streaming API for real-time updates
      try {
        let currentLiveData: ScrapedLead[] = [];

        const eventSource = new EventSource(
          `/api/map-search-stream?location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}`
        );

        setEventSourceRef(eventSource);

        eventSource.onmessage = (event) => {
          try {
            // Validate event data before parsing
            if (!event.data || event.data.trim() === '') {
              console.warn('Empty event data received');
              return;
            }

            let data: StreamProgress;
            try {
              data = JSON.parse(event.data);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              console.error('Raw event data:', event.data);
              return; // Skip this event and continue
            }
            
            if (data.type === 'status') {
              setProgress(prev => ({ ...prev, message: data.message || '' }));
            } else if (data.type === 'scroll') {
              setProgress(prev => ({ 
                ...prev, 
                message: `Scrolling: ${data.current}/${data.total}` 
              }));
            } else if (data.type === 'found') {
              setFoundCount(data.count || 0);
              setProgress(prev => ({ 
                ...prev, 
                total: data.count || 0,
                message: data.message || '' 
              }));
            } else if (data.type === 'progress') {
              setProgress({ 
                current: data.current || 0, 
                total: data.total || 0,
                message: data.message || '' 
              });
            } else if (data.type === 'business') {
              // Add business to live data immediately
              if (data.data) {
                currentLiveData = [...currentLiveData, data.data];
                setLiveData(currentLiveData);
                setProgress(prev => ({ 
                  ...prev, 
                  current: data.count || prev.current,
                  message: `Scraped ${data.count}/${data.total} businesses` 
                }));
                
                // Update inserted/skipped counts
                if (data.totalInserted !== undefined) {
                  setInsertedCount(data.totalInserted);
                }
                if (data.totalSkipped !== undefined) {
                  setSkippedCount(data.totalSkipped);
                }
              }
            } else if (data.type === 'complete') {
              eventSource.close();
              setSearching(false);
              setEventSourceRef(null);
              setResults({
                success: true,
                totalScraped: currentLiveData.length,
                totalInserted: data.totalInserted || currentLiveData.length,
                totalSkipped: data.totalSkipped || 0,
                data: currentLiveData,
              });
            } else if (data.type === 'error') {
              eventSource.close();
              setSearching(false);
              setEventSourceRef(null);
              setError(data.message || 'Search failed');
            }
          } catch (err) {
            console.error('Failed to parse event:', err);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          setSearching(false);
          setEventSourceRef(null);
          setError('Connection lost. Please try again.');
        };
      } catch (err: any) {
        console.error(err);
        setError('Failed to start search');
        setSearching(false);
      }
    } else {
      // Use regular API (wait for all results)
      try {
        const res = await fetch('/api/map-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location, category }),
        });

        const data = await res.json();

        if (data.success) {
          setResults(data);
        } else {
          setError(data.message || 'Search failed');
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to connect to server');
      } finally {
        setSearching(false);
      }
    }
  };

  const handleReset = () => {
    // Close any active stream
    if (eventSourceRef) {
      eventSourceRef.close();
      setEventSourceRef(null);
    }
    
    setLocation('');
    setCategory('');
    setResults(null);
    setError('');
    setLiveData([]);
    setProgress({ current: 0, total: 0, message: '' });
    setFoundCount(0);
    setInsertedCount(0);
    setSkippedCount(0);
    setSearching(false);
    localStorage.removeItem('mapsSearchState');
  };

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
              <strong>Previous search results restored:</strong> "{category}" in "{location}"
            </p>
            <button
              onClick={handleReset}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Clear and start new search
            </button>
          </div>
        </div>
      )}

      {/* Search In Progress Notification */}
      {searching && liveData.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-green-800">
              <strong>Search in progress:</strong> Data is being saved in the background. You can navigate to other pages - the search will continue!
            </p>
            <p className="text-xs text-green-600 mt-1">
              Progress: {liveData.length}/{foundCount} businesses scraped
            </p>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Location
            </label>
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

          {/* Category Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏢 Business Category
            </label>
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

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Search Button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {searching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
          {results && (
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Search Again
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {searching && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Searching Google Maps...</h3>
              <p className="text-sm text-gray-500">{progress.message || 'Initializing...'}</p>
            </div>
            {progress.total > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {liveData.length}/{foundCount}
                </div>
                <div className="text-xs text-gray-500">Scraped</div>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {progress.total > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round((liveData.length / foundCount) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(liveData.length / foundCount) * 100}%` }}
                ></div>
              </div>
              
              {/* Live Stats */}
              {(insertedCount > 0 || skippedCount > 0) && (
                <div className="flex gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-semibold">✅ {insertedCount}</span>
                    <span className="text-gray-500">Inserted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-600 font-semibold">⏭️ {skippedCount}</span>
                    <span className="text-gray-500">Skipped</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-600">
            <p className={progress.message.includes('Opening') ? 'text-blue-600 font-medium' : ''}>
              {progress.message.includes('Opening') ? '🔄' : '✓'} Opening Google Maps...
            </p>
            <p className={progress.message.includes('Scrolling') ? 'text-blue-600 font-medium' : foundCount > 0 ? '' : ''}>
              {progress.message.includes('Scrolling') ? '🔄' : foundCount > 0 ? '✓' : '⏳'} 
              {progress.message.includes('Scrolling') ? ` ${progress.message}` : ' Searching for businesses...'}
            </p>
            {foundCount > 0 && (
              <p className="text-green-600 font-medium">
                ✓ Found {foundCount} businesses
              </p>
            )}
            {liveData.length > 0 && (
              <p className="text-blue-600 font-medium">
                🔄 Extracting details: {liveData.length}/{foundCount} complete
              </p>
            )}
          </div>
        </div>
      )}

      {/* Live Data Table - Shows while scraping */}
      {searching && liveData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">📋 Live Results ({liveData.length})</h3>
                <p className="text-sm text-gray-500 mt-1">Updating in real-time as businesses are scraped</p>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liveData.map((lead, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition animate-fadeIn">
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">
                            {(lead.company_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {lead.company_name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {lead.mobile_number || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={lead.email}>
                      {lead.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 max-w-xs truncate">
                      {lead.website_url ? (
                        <span className="inline-flex items-center gap-1" title={lead.website_url}>
                          {lead.website_url.substring(0, 30)}...
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.google_rating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-medium">{lead.google_rating}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={lead.address}>
                      {lead.address || '—'}
                    </td>
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
              <h3 className="text-lg font-bold text-gray-900 mb-3">🎉 Search Complete!</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="text-sm text-gray-600">⏭️ Skipped (Duplicates)</div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/leads"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  View All Leads →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scraped Data Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.data.map((lead, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">
                            {(lead.company_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {lead.company_name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {lead.mobile_number || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={lead.email}>
                      {lead.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 max-w-xs truncate">
                      {lead.website_url ? (
                        <a
                          href={
                            lead.website_url.startsWith('http://') || lead.website_url.startsWith('https://') 
                              ? lead.website_url 
                              : `https://${lead.website_url.replace(/^(www\.)?/, 'www.')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-1"
                          title={lead.website_url}
                          onClick={(e) => {
                            // Ensure link opens
                            const url = lead.website_url.startsWith('http://') || lead.website_url.startsWith('https://') 
                              ? lead.website_url 
                              : `https://${lead.website_url.replace(/^(www\.)?/, 'www.')}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                            e.preventDefault();
                          }}
                        >
                          {lead.website_url}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.google_rating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-medium">{lead.google_rating}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={lead.address}>
                      {lead.address || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.business_category || '—'}
                    </td>
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
          <p className="text-gray-500 mb-4">
            No businesses found for "{category}" in "{location}"
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Different Search
          </button>
        </div>
      )}
    </div>
  );
}
