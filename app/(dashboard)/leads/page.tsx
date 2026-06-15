'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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

const qualityBadge = (score: number) => {
  if (score >= 75) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const [companies, setCompanies]   = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    category: '',
    quality: '',
    hasEmail: '',
    source: '',
  });

  // Unique values for filters
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    // Apply filters whenever companies or filters change
    applyFilters();
  }, [companies, filters]);

  useEffect(() => {
    // Apply source filter from URL if present
    const sourceFromUrl = searchParams.get('source');
    if (sourceFromUrl) {
      setFilters(prev => ({ ...prev, source: sourceFromUrl }));
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/leads/all');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.data);
        setFilteredCompanies(data.data);
        
        // Extract unique values
        const uniqueStates = [...new Set(data.data.map((c: Company) => c.state).filter(Boolean))] as string[];
        const uniqueCategories = [...new Set(data.data.map((c: Company) => c.business_category).filter(Boolean))] as string[];
        const uniqueSources = [...new Set(data.data.map((c: Company) => c.source_file).filter(Boolean))] as string[];
        
        console.log('All sources from data:', data.data.map((c: Company) => c.source_file));
        console.log('Unique sources:', uniqueSources);
        
        setStates(uniqueStates.sort());
        setCategories(uniqueCategories.sort());
        setSources(uniqueSources.sort());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...companies];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.company_name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.mobile_number?.includes(searchLower)
      );
    }

    // State filter
    if (filters.state) {
      filtered = filtered.filter(c => c.state === filters.state);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(c => c.business_category === filters.category);
    }

    // Quality filter
    if (filters.quality) {
      const minQuality = parseInt(filters.quality);
      filtered = filtered.filter(c => c.quality_score >= minQuality);
    }

    // Email filter
    if (filters.hasEmail === 'yes') {
      filtered = filtered.filter(c => c.email && c.email.trim() !== '');
    } else if (filters.hasEmail === 'no') {
      filtered = filtered.filter(c => !c.email || c.email.trim() === '');
    }

    // Source filter
    if (filters.source) {
      filtered = filtered.filter(c => c.source_file === filters.source);
    }

    setFilteredCompanies(filtered);
    setCurrentPage(1); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      state: '',
      category: '',
      quality: '',
      hasEmail: '',
      source: '',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    setDeleting(id.toString());
    try {
      const res  = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCompanies(prev => prev.filter(c => c.id !== id));
        alert('Company deleted successfully!');
      } else {
        alert('Failed to delete: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting company');
    } finally {
      setDeleting(null);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    // Use filtered companies for export
    const dataToExport = filteredCompanies;

    if (dataToExport.length === 0) {
      alert('No data to export!');
      return;
    }

    // Create CSV content
    const headers = [
      'ID',
      'Company Name',
      'Mobile Number',
      'Email',
      'Website URL',
      'Address',
      'State',
      'Business Category',
      'Quality Score',
      'Google Rating',
      'Source File',
      'Created At'
    ];

    const csvRows = [
      headers.join(','), // Header row
      ...dataToExport.map(company => [
        company.id,
        `"${(company.company_name || '').replace(/"/g, '""')}"`,
        `"${company.mobile_number || ''}"`,
        `"${(company.email || '').replace(/"/g, '""')}"`,
        `"${(company.website_url || '').replace(/"/g, '""')}"`,
        `"${(company.address || '').replace(/"/g, '""')}"`,
        `"${(company.state || '').replace(/"/g, '""')}"`,
        `"${(company.business_category || '').replace(/"/g, '""')}"`,
        company.quality_score ?? 0,
        company.google_rating ?? '',
        `"${(company.source_file || '').replace(/"/g, '""')}"`,
        `"${new Date(company.created_at).toLocaleString()}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Companies</h1>
          <p className="text-gray-500 text-sm mt-1">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredCompanies.length)} of {filteredCompanies.length} filtered ({companies.length} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={loading || filteredCompanies.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export ({filteredCompanies.length})
          </button>
          <Link href="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload File
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search name, email, mobile..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* State */}
          <div>
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

          {/* Category */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Quality */}
          <div>
            <select
              value={filters.quality}
              onChange={(e) => setFilters({ ...filters, quality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Quality</option>
              <option value="80">80%+ Quality</option>
              <option value="60">60%+ Quality</option>
              <option value="40">40%+ Quality</option>
            </select>
          </div>

          {/* Email Status */}
          <div>
            <select
              value={filters.hasEmail}
              onChange={(e) => setFilters({ ...filters, hasEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Email: All</option>
              <option value="yes">Has Email</option>
              <option value="no">No Email</option>
            </select>
          </div>

          {/* Source */}
          <div>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
            </span>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-3">No companies found</p>
            <Link href="/upload" className="text-sm text-blue-600 hover:underline">
              Upload your first file →
            </Link>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-3">No companies match your filters</p>
            <button onClick={handleClearFilters} className="text-sm text-blue-600 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sr. No.</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">State</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentCompanies.map((c, index) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{c.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">
                            {(c.company_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 max-w-xs truncate" title={c.company_name}>
                            {c.company_name || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{c.mobile_number || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={c.email}>{c.email || '—'}</td>
                    <td className="px-6 py-4 text-sm text-blue-600 max-w-xs truncate">
                      {c.website_url ? (
                        <a 
                          href={c.website_url.startsWith('http') ? c.website_url : `https://${c.website_url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-1" 
                          title={c.website_url}
                        >
                          {c.website_url}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={c.address}>{c.address || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.state || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.business_category || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${qualityBadge(c.quality_score)}`}>
                        {c.quality_score ?? 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.google_rating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span>{c.google_rating}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.source_file || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/leads/${c.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id.toString()}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Delete">
                          {deleting === c.id.toString()
                            ? <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredCompanies.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition ${
                          currentPage === page
                            ? 'bg-blue-600 text-white font-medium'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LeadsPageContent />
    </Suspense>
  );
}
