'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, RefreshCw, Filter, Eye, X, Activity, CheckCircle, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-800 text-slate-400">Loading Map...</div>
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Numbers Intel</h1>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-48"
            >
              <option value="">All Users</option>
              {users.map((u: string) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 hover:bg-slate-700"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Total Requests</th>
                <th className="px-6 py-4">Last Seen</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">No numbers found</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.phone} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-6 py-4 font-mono text-slate-300">{item.phone}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-medium">
                        {item.total}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {new Date(item.last_seen).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <button
                        onClick={() => fetchPhoneJobs(item.phone)}
                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                      >
                        Detail
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-semibold text-slate-100">Details for {selectedPhone}</h3>
              <button onClick={() => setSelectedPhone(null)} className="text-slate-400 hover:text-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Requests</p>
                    <p className="text-xl font-bold text-slate-100">{stats.total}</p>
                  </div>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700 flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Success</p>
                    <p className="text-xl font-bold text-slate-100">{stats.success}</p>
                  </div>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700 flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                    <XCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Failed</p>
                    <p className="text-xl font-bold text-slate-100">{stats.failed}</p>
                  </div>
                </div>
              </div>

              {/* Charts & Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                {/* Pie Chart */}
                <div className="bg-slate-700/30 rounded-lg border border-slate-700 p-4 flex flex-col">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Status Distribution</h4>
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
                          >
                            {chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                            itemStyle={{ color: '#f1f5f9' }}
                          />
                          <Legend />
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
                <div className="bg-slate-700/30 rounded-lg border border-slate-700 p-4 flex flex-col">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Location History ({locations.length})</h4>
                  <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-slate-600">
                    <MapComponent locations={locations} highlightedJobId={highlightedJobId} />
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-slate-700/30 rounded-lg border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h4 className="font-medium text-slate-100">Request History</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/30">
                      <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingJobs ? (
                        <tr><td colSpan={4} className="text-center py-8">Loading jobs...</td></tr>
                      ) : phoneJobs.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8">No history found</td></tr>
                      ) : (
                        phoneJobs.map((job) => (
                          <tr 
                            key={job.id} 
                            className={`border-b border-slate-700/50 hover:bg-slate-700/50 cursor-pointer ${highlightedJobId === job.id ? 'bg-blue-500/10' : ''}`}
                            onClick={() => setHighlightedJobId(job.id)}
                          >
                            <td className="px-4 py-3 text-slate-300">
                              {new Date(job.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-slate-300">{job.username}</td>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedJob(job);
                                }}
                                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-semibold text-slate-100">Job Result</h3>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-x-auto">
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
        </div>
      )}
    </div>
  );
}
