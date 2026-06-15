'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Company {
  id: number;
  company_name: string;
  mobile_number: string;
  email: string;
  website_url: string;
  address: string;
  state: string;
  business_category: string;
  quality_score: number;
  google_rating: number;
  source_file: string;
  created_at: string;
}

interface Filters {
  quality_score: number | null;
  state: string;
  business_category: string;
  has_email: boolean | null;
  has_mobile: boolean | null;
  has_website: boolean | null;
  min_rating: number | null;
  source_file: string;
}

const qualityBadge = (score: number) => {
  if (score >= 75) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

export default function FilterPage() {
  const [filters, setFilters] = useState<Filters>({
    quality_score: null,
    state: '',
    business_category: '',
    has_email: null,
    has_mobile: null,
    has_website: null,
    min_rating: null,
    source_file: '',
  });
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtered, setFiltered] = useState(false);
  
  // Get unique values for dropdowns
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    fetchAllCompanies();
  }, []);

  const fetchAllCompanies = async () => {
    try {
      const res = await fetch('/api/leads/all');
      const data = await res.json();
      if (data.success) {
        setAllCompanies(data.data);
        
        // Extract unique values
        const uniqueStates = [...new Set(data.data.map((c: Company) => c.state).filter(Boolean))] as string[];
        const uniqueCategories = [...new Set(data.data.map((c: Company) => c.business_category).filter(Boolean))] as string[];
        const uniqueSources = [...new Set(data.data.map((c: Company) => c.source_file).filter(Boolean))] as string[];
        
        setStates(uniqueStates.sort());
        setCategories(uniqueCategories.sort());
        setSources(uniqueSources.sort());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilter = () => {
    setLoading(true);
    setFiltered(true);
    
    // Client-side filtering
    let filtered = [...allCompanies];
    
    // Quality score filter
    if (filters.quality_score !== null) {
      filtered = filtered.filter(c => c.quality_score >= filters.quality_score!);
    }
    
    // State filter
    if (filters.state) {
      filtered = filtered.filter(c => c.state === filters.state);
    }
    
    // Category filter
    if (filters.business_category) {
      filtered = filtered.filter(c => c.business_category === filters.business_category);
    }
    
    // Email filter
    if (filters.has_email !== null) {
      filtered = filtered.filter(c => 
        filters.has_email ? (c.email && c.email.trim() !== '') : (!c.email || c.email.trim() === '')
      );
    }
    
    // Mobile filter
    if (filters.has_mobile !== null) {
      filtered = filtered.filter(c => 
        filters.has_mobile ? (c.mobile_number && c.mobile_number.trim() !== '') : (!c.mobile_number || c.mobile_number.trim() === '')
      );
    }
    
    // Website filter
    if (filters.has_website !== null) {
      filtered = filtered.filter(c => 
        filters.has_website ? (c.website_url && c.website_url.trim() !== '') : (!c.website_url || c.website_url.trim() === '')
      );
    }
    
    // Rating filter
    if (filters.min_rating !== null) {
      filtered = filtered.filter(c => c.google_rating && parseFloat(String(c.google_rating)) >= filters.min_rating!);
    }
    
    // Source filter
    if (filters.source_file) {
      filtered = filtered.filter(c => c.source_file === filters.source_file);
    }
    
    setCompanies(filtered);
    setLoading(false);
  };

  const handleReset = () => {
    setFilters({
      quality_score: null,
      state: '',
      business_category: '',
      has_email: null,
      has_mobile: null,
      has_website: null,
      min_rating: null,
      source_file: '',
    });
    setCompanies([]);
    setFiltered(false);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== null && v !== '').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Advanced Filters</h1>
        <p className="text-gray-500 text-sm mt-1">Filter companies using multiple criteria</p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Quality Score Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quality Score (Min)</label>
            <select
              value={filters.quality_score ?? ''}
              onChange={(e) => setFilters({ ...filters, quality_score: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Quality</option>
              <option value="80">80% and above</option>
              <option value="60">60% and above</option>
              <option value="40">40% and above</option>
              <option value="20">20% and above</option>
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Category</label>
            <select
              value={filters.business_category}
              onChange={(e) => setFilters({ ...filters, business_category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Source File Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source File</label>
            <select
              value={filters.source_file}
              onChange={(e) => setFilters({ ...filters, source_file: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          {/* Email Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Status</label>
            <select
              value={filters.has_email === null ? '' : filters.has_email ? 'yes' : 'no'}
              onChange={(e) => setFilters({ ...filters, has_email: e.target.value === '' ? null : e.target.value === 'yes' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All</option>
              <option value="yes">Has Email</option>
              <option value="no">No Email</option>
            </select>
          </div>

          {/* Mobile Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Status</label>
            <select
              value={filters.has_mobile === null ? '' : filters.has_mobile ? 'yes' : 'no'}
              onChange={(e) => setFilters({ ...filters, has_mobile: e.target.value === '' ? null : e.target.value === 'yes' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All</option>
              <option value="yes">Has Mobile</option>
              <option value="no">No Mobile</option>
            </select>
          </div>

          {/* Website Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website Status</label>
            <select
              value={filters.has_website === null ? '' : filters.has_website ? 'yes' : 'no'}
              onChange={(e) => setFilters({ ...filters, has_website: e.target.value === '' ? null : e.target.value === 'yes' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All</option>
              <option value="yes">Has Website</option>
              <option value="no">No Website</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Google Rating</label>
            <select
              value={filters.min_rating ?? ''}
              onChange={(e) => setFilters({ ...filters, min_rating: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Ratings</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
            </select>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleFilter}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Apply Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
          >
            Reset All
          </button>
          <div className="ml-auto text-sm text-gray-500">
            Total Companies: <strong>{allCompanies.length}</strong>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered && companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <p className="text-gray-500 mb-2">No companies match your filters</p>
          <button onClick={handleReset} className="text-sm text-blue-600 hover:underline">
            Clear filters and try again
          </button>
        </div>
      ) : companies.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <strong>{companies.length}</strong> compan{companies.length !== 1 ? 'ies' : 'y'} found
            </p>
            <Link href="/leads" className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">
                            {company.company_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{company.company_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{company.mobile_number || '—'}</p>
                        <p className="text-gray-500 text-xs">{company.email || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.state || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.business_category || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${qualityBadge(company.quality_score)}`}>
                        {company.quality_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {company.google_rating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span>{Number(company.google_rating).toFixed(1)}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{company.source_file || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
