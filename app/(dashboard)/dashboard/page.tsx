'use client';

import { useEffect, useState } from 'react';
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

interface Stats {
  totalCompanies: number;
  avgQualityScore: number;
  avgGoogleRating: number;
  companiesWithEmail: number;
  companiesWithWebsite: number;
  companiesWithMobile: number;
  topStates: { state: string; count: number }[];
  topCategories: { category: string; count: number }[];
  topSources: { source: string; count: number }[];
  recentCompanies: Company[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/leads/all');
      const data = await res.json();
      
      if (data.success) {
        const companies: Company[] = data.data;
        
        // Calculate statistics
        const totalCompanies = companies.length;
        const avgQualityScore = companies.length > 0
          ? Math.round(companies.reduce((sum, c) => sum + (c.quality_score || 0), 0) / companies.length)
          : 0;
        const avgGoogleRating = companies.length > 0
          ? (companies.reduce((sum, c) => sum + (parseFloat(String(c.google_rating)) || 0), 0) / companies.length).toFixed(1)
          : '0.0';
        
        const companiesWithEmail = companies.filter(c => c.email && c.email.trim() !== '').length;
        const companiesWithWebsite = companies.filter(c => c.website_url && c.website_url.trim() !== '').length;
        const companiesWithMobile = companies.filter(c => c.mobile_number && c.mobile_number.trim() !== '').length;

        // Top states
        const stateCounts: Record<string, number> = {};
        companies.forEach(c => {
          if (c.state && c.state.trim() !== '') {
            stateCounts[c.state] = (stateCounts[c.state] || 0) + 1;
          }
        });
        const topStates = Object.entries(stateCounts)
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Top categories
        const categoryCounts: Record<string, number> = {};
        companies.forEach(c => {
          if (c.business_category && c.business_category.trim() !== '') {
            categoryCounts[c.business_category] = (categoryCounts[c.business_category] || 0) + 1;
          }
        });
        const topCategories = Object.entries(categoryCounts)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Top sources
        const sourceCounts: Record<string, number> = {};
        companies.forEach(c => {
          if (c.source_file && c.source_file.trim() !== '') {
            sourceCounts[c.source_file] = (sourceCounts[c.source_file] || 0) + 1;
          }
        });
        const topSources = Object.entries(sourceCounts)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Recent companies
        const recentCompanies = companies
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        setStats({
          totalCompanies,
          avgQualityScore,
          avgGoogleRating: parseFloat(avgGoogleRating),
          companiesWithEmail,
          companiesWithWebsite,
          companiesWithMobile,
          topStates,
          topCategories,
          topSources,
          recentCompanies,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Companies',
      value: stats.totalCompanies.toLocaleString(),
      icon: '🏢',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Avg Quality Score',
      value: `${stats.avgQualityScore}%`,
      icon: '⭐',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Avg Google Rating',
      value: stats.avgGoogleRating.toFixed(1),
      icon: '📊',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'With Email',
      value: `${stats.companiesWithEmail} (${stats.totalCompanies > 0 ? Math.round((stats.companiesWithEmail / stats.totalCompanies) * 100) : 0}%)`,
      icon: '📧',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'With Website',
      value: `${stats.companiesWithWebsite} (${stats.totalCompanies > 0 ? Math.round((stats.companiesWithWebsite / stats.totalCompanies) * 100) : 0}%)`,
      icon: '🌐',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'With Mobile',
      value: `${stats.companiesWithMobile} (${stats.totalCompanies > 0 ? Math.round((stats.companiesWithMobile / stats.totalCompanies) * 100) : 0}%)`,
      icon: '📱',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Overview of your company database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
            📅 {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <Link href="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition text-sm font-medium shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload File
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.title}</h3>
            <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top States - Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top States</h2>
            <span className="text-xs text-gray-500">{stats.topStates.length} states</span>
          </div>
          
          {stats.topStates.length > 0 ? (
            <>
              {/* Pie Chart */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                      let currentAngle = 0;
                      
                      return stats.topStates.map((item, i) => {
                        const percentage = (item.count / stats.totalCompanies) * 100;
                        const angle = (percentage / 100) * 360;
                        const radius = 40;
                        const circumference = 2 * Math.PI * radius;
                        const dashArray = `${(angle / 360) * circumference} ${circumference}`;
                        const rotation = currentAngle;
                        currentAngle += angle;
                        
                        return (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={colors[i]}
                            strokeWidth="20"
                            strokeDasharray={dashArray}
                            style={{
                              transformOrigin: 'center',
                              transform: `rotate(${rotation}deg)`
                            }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {stats.topStates.map((item, i) => {
                  const percentage = ((item.count / stats.totalCompanies) * 100).toFixed(1);
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-purple-500'];
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[i]}`}></div>
                        <span className="text-gray-700">{item.state}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{percentage}%</span>
                        <span className="font-medium text-gray-900">{item.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">No data</div>
          )}
        </div>

        {/* Top Categories - Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Categories</h2>
            <span className="text-xs text-gray-500">{stats.topCategories.length} categories</span>
          </div>
          
          {stats.topCategories.length > 0 ? (
            <>
              {/* Pie Chart */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
                      let currentAngle = 0;
                      
                      return stats.topCategories.map((item, i) => {
                        const percentage = (item.count / stats.totalCompanies) * 100;
                        const angle = (percentage / 100) * 360;
                        const radius = 40;
                        const circumference = 2 * Math.PI * radius;
                        const dashArray = `${(angle / 360) * circumference} ${circumference}`;
                        const rotation = currentAngle;
                        currentAngle += angle;
                        
                        return (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={colors[i]}
                            strokeWidth="20"
                            strokeDasharray={dashArray}
                            style={{
                              transformOrigin: 'center',
                              transform: `rotate(${rotation}deg)`
                            }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.topCategories.length}</div>
                      <div className="text-xs text-gray-500">Types</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {stats.topCategories.map((item, i) => {
                  const percentage = ((item.count / stats.totalCompanies) * 100).toFixed(1);
                  const colors = ['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-pink-500', 'bg-purple-500'];
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[i]}`}></div>
                        <span className="text-gray-700 truncate max-w-[120px]" title={item.category}>{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{percentage}%</span>
                        <span className="font-medium text-gray-900">{item.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">No data</div>
          )}
        </div>

        {/* Top Sources - Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Sources</h2>
            <span className="text-xs text-gray-500">{stats.topSources.length} sources</span>
          </div>
          
          {stats.topSources.length > 0 ? (
            <>
              {/* Pie Chart */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
                      let currentAngle = 0;
                      
                      return stats.topSources.map((item, i) => {
                        const percentage = (item.count / stats.totalCompanies) * 100;
                        const angle = (percentage / 100) * 360;
                        const radius = 40;
                        const circumference = 2 * Math.PI * radius;
                        const dashArray = `${(angle / 360) * circumference} ${circumference}`;
                        const rotation = currentAngle;
                        currentAngle += angle;
                        
                        return (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={colors[i]}
                            strokeWidth="20"
                            strokeDasharray={dashArray}
                            style={{
                              transformOrigin: 'center',
                              transform: `rotate(${rotation}deg)`
                            }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.topSources.length}</div>
                      <div className="text-xs text-gray-500">Files</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {stats.topSources.map((item, i) => {
                  const percentage = ((item.count / stats.totalCompanies) * 100).toFixed(1);
                  const colors = ['bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500', 'bg-blue-500'];
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[i]}`}></div>
                        <span className="text-gray-700 truncate max-w-[120px]" title={item.source}>{item.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{percentage}%</span>
                        <span className="font-medium text-gray-900">{item.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">No data</div>
          )}
        </div>
      </div>

      {/* Recent Companies Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Companies</h2>
          <Link href="/leads" className="text-sm text-blue-600 hover:underline">View All →</Link>
        </div>

        {stats.recentCompanies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-3">No companies yet</p>
            <Link href="/upload" className="text-sm text-blue-600 hover:underline">
              Upload your first file →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-sm">
                            {(c.company_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.company_name || '—'}</p>
                          <p className="text-xs text-gray-500">{c.business_category || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{c.mobile_number || '—'}</p>
                        <p className="text-gray-500 text-xs">{c.email || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.state || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        c.quality_score >= 75 ? 'bg-green-100 text-green-700' :
                        c.quality_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {c.quality_score || 0}%
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
