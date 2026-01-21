'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Loader2, Users, Phone, Clock, Activity, RefreshCw, Eye, X, Calendar, Filter } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-500">Loading Map...</div>
});

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<string>('trg_user');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [highlightedPhone, setHighlightedPhone] = useState<string | undefined>(undefined);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.append('username', selectedUser);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetch(`/api/dashboard/stats?${params.toString()}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedUser, startDate, endDate]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor your system performance and metrics</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Date Range Filter */}
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-1 w-full md:w-auto">
            <div className="px-3 text-slate-500 border-r border-slate-800">
              <Calendar size={16} />
            </div>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-sm focus:ring-0 p-2 w-full md:w-32"
            />
            <span className="text-slate-600 px-2">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-sm focus:ring-0 p-2 w-full md:w-32"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             {stats?.users && (
              <div className="relative w-full md:w-48">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Users size={16} />
                </div>
                <select 
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 appearance-none"
                >
                  <option value="">All Users</option>
                  {stats.users.map((u: string) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Filter size={12} />
                </div>
              </div>
            )}
            
            <button 
              onClick={fetchData} 
              className="flex items-center justify-center p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: stats?.total_req, icon: Activity, color: 'blue' },
          { label: "Today's Requests", value: stats?.today_req, icon: Clock, color: 'emerald' },
          { label: 'Unique Numbers', value: stats?.total_numbers, icon: Phone, color: 'violet' },
          { label: 'Avg Response Time', value: formatDuration(stats?.avg_time), icon: Loader2, color: 'amber' }
        ].map((item, i) => (
          <div key={i} className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg shadow-slate-900/50 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">{item.label}</p>
                <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 tracking-tight">
                  {loading ? '...' : item.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg bg-${item.color}-500/10 text-${item.color}-500`}>
                <item.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg shadow-slate-900/50 overflow-hidden h-[450px]">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
           <h3 className="font-semibold text-white">Location Distribution</h3>
           <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">Live Data</span>
        </div>
        <div className="h-full">
           <MapComponent 
             locations={stats?.locations || []} 
             highlightedPhone={highlightedPhone}
           />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg shadow-slate-900/50 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-white">Recent Requests</h3>
            <Link href="/dashboard/jobs" className="text-xs text-blue-400 hover:text-blue-300">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading data...</td></tr>
                ) : stats?.recent_jobs?.map((job: any) => (
                  <tr key={job.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-300">
                      {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">{job.username}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">
                      <button
                        onClick={() => setHighlightedPhone(job.phone)}
                        className="hover:text-blue-400 hover:underline decoration-blue-500/30 transition-all text-left"
                        title="Show on map"
                      >
                        {job.phone}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'success' || job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        job.status === 'failed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => setSelectedJob(job)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && stats?.recent_jobs?.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">No recent data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Chart */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg shadow-slate-900/50 flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-semibold text-white">Status Distribution</h3>
          </div>
          <div className="flex-1 w-full min-h-0 p-4">
             {loading ? (
                <div className="h-full flex items-center justify-center text-slate-500">Loading chart...</div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.status_counts || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                      stroke="none"
                    >
                      {stats?.status_counts?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.5rem' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div>
                 <h3 className="font-semibold text-white text-lg">Job Details</h3>
                 <p className="text-slate-500 text-xs mt-0.5">ID: {selectedJob.id}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 bg-slate-900/50">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Created At</label>
                  <p className="text-slate-200 text-sm">{new Date(selectedJob.created_at).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">User</label>
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold">
                        {selectedJob.username.charAt(0).toUpperCase()}
                     </div>
                     <p className="text-slate-200 text-sm">{selectedJob.username}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Phone</label>
                  <p className="text-slate-200 font-mono text-sm">{selectedJob.phone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Status</label>
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                      selectedJob.status === 'success' || selectedJob.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      selectedJob.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Result Data</label>
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-x-auto shadow-inner">
                  <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedJob.result);
                        return JSON.stringify(parsed, null, 2);
                      } catch (e) {
                        return selectedJob.result || 'No result data';
                      }
                    })()}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
