'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Loader2, Users, Phone, Clock, Activity, RefreshCw, Eye, X } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-800 text-slate-400">Loading Map...</div>
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard Overview</h1>
        
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            />
            <span className="text-slate-500">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            />
          </div>

           {stats?.users && (
            <select 
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-48 p-2.5"
            >
              <option value="">All Users</option>
              {stats.users.map((u: string) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          )}
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 hover:bg-slate-700"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Requests</p>
              <h3 className="text-3xl font-bold text-slate-100 mt-2">{loading ? '...' : stats?.total_req}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Today's Requests</p>
              <h3 className="text-3xl font-bold text-slate-100 mt-2">{loading ? '...' : stats?.today_req}</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Clock className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Unique Numbers</p>
              <h3 className="text-3xl font-bold text-slate-100 mt-2">{loading ? '...' : stats?.total_numbers}</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Phone className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Avg Response Time</p>
              <h3 className="text-3xl font-bold text-slate-100 mt-2">
                {loading ? '...' : formatDuration(stats?.avg_time)}
              </h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Loader2 className="text-orange-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden h-[400px]">
        <div className="p-4 border-b border-slate-700">
           <h3 className="font-semibold text-slate-100">Location Distribution</h3>
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
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-semibold text-slate-100">Recent Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                ) : stats?.recent_jobs?.map((job: any) => (
                  <tr key={job.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(job.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{job.username}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      <button
                        onClick={() => setHighlightedPhone(job.phone)}
                        className="hover:text-blue-400 hover:underline transition-colors text-left"
                        title="Show on map"
                      >
                        {job.phone}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'success' || job.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        job.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedJob(job)}
                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                        title="View Details"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && stats?.recent_jobs?.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4">No recent data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Chart */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm flex flex-col h-[400px]">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-semibold text-slate-100">Status Distribution</h3>
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
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats?.status_counts?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>
      {/* Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-semibold text-slate-100">Job Details</h3>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Job ID</label>
                  <p className="text-slate-200 font-mono text-sm mt-1">{selectedJob.id}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Created At</label>
                  <p className="text-slate-200 text-sm mt-1">{new Date(selectedJob.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">User</label>
                  <p className="text-slate-200 text-sm mt-1">{selectedJob.username}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Phone</label>
                  <p className="text-slate-200 font-mono text-sm mt-1">{selectedJob.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedJob.status === 'success' || selectedJob.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      selectedJob.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 uppercase font-semibold">Result Data</label>
                <div className="mt-2 bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
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
            <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end">
              <button 
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
