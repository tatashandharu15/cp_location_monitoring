'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, RefreshCw, Filter, Eye, X, Activity, CheckCircle, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-500">Loading Map...</div>
});

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type NumberAgg = {
  phone: string;
  total: number;
  last_seen: string;
};

type Job = {
  id: string;
  username: string;
  status: string;
  result: string;
  created_at: string;
};

export default function NumbersClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NumberAgg[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('trg_user'); // Default to trg_user
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [phoneJobs, setPhoneJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [highlightedJobId, setHighlightedJobId] = useState<string | undefined>(undefined);

  // Calculate derived stats when phoneJobs changes
  const { locations, stats, chartData } = useMemo(() => {
    const locs: any[] = [];
    let success = 0;
    let failed = 0;
    let other = 0;

    phoneJobs.forEach(job => {
      // Stats
      if (job.status === 'success' || job.status === 'completed') success++;
      else if (job.status === 'failed') failed++;
      else other++;

      // Locations
      try {
        if (job.result) {
          const parsed = JSON.parse(job.result);
          // Check for lat/lng in various possible structures
          let lat = parsed.lat || parsed.latitude;
          let lng = parsed.lng || parsed.longitude;
          
          if (parsed.location) {
            lat = lat || parsed.location.lat || parsed.location.latitude;
            lng = lng || parsed.location.lng || parsed.location.longitude || parsed.location.long;
          }
          
          if (parsed.data) {
            lat = lat || parsed.data.lat || parsed.data.latitude;
            lng = lng || parsed.data.lng || parsed.data.longitude || parsed.data.lng || parsed.data.long;
          }

          // Ensure lat/lng are valid numbers (allow 0 but filter out NaN/null/undefined)
          if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);
            
            if (!isNaN(latNum) && !isNaN(lngNum)) {
              locs.push({
                lat: latNum,
                lng: lngNum,
                phone: selectedPhone || '',
                created_at: job.created_at,
                jobId: job.id
              });
            }
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });

    const chartData = [
      { name: 'Success', value: success },
      { name: 'Failed', value: failed },
      { name: 'Other', value: other }
    ].filter(item => item.value > 0);

    return {
      locations: locs,
      stats: { total: phoneJobs.length, success, failed, other },
      chartData
    };
  }, [phoneJobs, selectedPhone]);

  // Fetch users for filter
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.append('username', selectedUser);
      
      const res = await fetch(`/api/dashboard/numbers?${params.toString()}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Failed to fetch numbers');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhoneJobs = async (phone: string) => {
    setLoadingJobs(true);
    setSelectedPhone(phone);
    try {
      const params = new URLSearchParams();
      params.append('phone', phone);
      // Reuse jobs API but we need to make sure it supports filtering by phone
      // If api/dashboard/jobs doesn't support phone filter, we might need to update it or use a new endpoint
      // Assuming we can use /api/dashboard/jobs?phone=... 
      const res = await fetch(`/api/dashboard/jobs?${params.toString()}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Failed to fetch phone jobs');
      const data = await res.json();
      setPhoneJobs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedUser]);

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white">Numbers Intel</h1>
          <p className="text-slate-400 text-sm mt-1">Analyze activity by phone numbers</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Filter size={16} />
            </div>
            <select 
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 appearance-none"
            >
              <option value="">All Users</option>
              {users.map((u: string) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={fetchData} 
            className="flex items-center justify-center p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg shadow-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Total Requests</th>
                <th className="px-6 py-4 font-medium">Last Seen</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Loading data...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">No numbers found</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.phone} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-300">{item.phone}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded text-xs font-medium">
                        {item.total}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {new Date(item.last_seen).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <button
                        onClick={() => fetchPhoneJobs(item.phone)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700"
                      >
                        <Eye size={14} />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phone Details Modal */}
      {selectedPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div>
                 <h3 className="font-semibold text-white text-lg">Details for {selectedPhone}</h3>
                 <p className="text-slate-500 text-xs mt-0.5">Comprehensive analysis of number activity</p>
              </div>
              <button onClick={() => setSelectedPhone(null)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-900/50">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Total Requests</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Success</p>
                    <p className="text-2xl font-bold text-white">{stats.success}</p>
                  </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                    <XCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Failed</p>
                    <p className="text-2xl font-bold text-white">{stats.failed}</p>
                  </div>
                </div>
              </div>

              {/* Charts & Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col h-[350px] shadow-sm">
                  <h4 className="text-sm font-semibold text-white mb-4">Status Distribution</h4>
                  <div className="flex-1 min-h-0">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.5rem' }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        No data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Map */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col h-[350px] shadow-sm">
                  <h4 className="text-sm font-semibold text-white mb-4">Location History ({locations.length})</h4>
                  <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    <MapComponent locations={locations} highlightedJobId={highlightedJobId} />
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-800">
                  <h4 className="font-semibold text-white">Request History</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3 font-medium">Time</th>
                        <th className="px-5 py-3 font-medium">User</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {loadingJobs ? (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-500">Loading jobs...</td></tr>
                      ) : phoneJobs.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-500">No history found</td></tr>
                      ) : (
                        phoneJobs.map((job) => (
                          <tr 
                            key={job.id} 
                            className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${highlightedJobId === job.id ? 'bg-blue-500/10' : ''}`}
                            onClick={() => setHighlightedJobId(job.id)}
                          >
                            <td className="px-5 py-3.5 text-slate-300">
                              {new Date(job.created_at).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-slate-300 font-medium">{job.username}</td>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedJob(job);
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700"
                              >
                                View Result
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Result Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="font-semibold text-white">Job Result</h3>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-900/50">
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
        </div>
      )}
    </div>
  );
}
