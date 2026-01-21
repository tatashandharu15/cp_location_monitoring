
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Job = {
  id: string;
  username: string;
  phone: string;
  status: string;
  created_at: string;
  result: string;
};

export default async function JobsPage() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const url = `${proto}://${host}/api/dashboard/jobs?limit=100`;
  
  let jobs: Job[] = [];
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      jobs = await res.json();
    } else {
      console.error("Failed to fetch jobs:", await res.text());
    }
  } catch (e) {
    console.error("Error fetching jobs:", e);
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">All Jobs</h1>
          <p className="text-slate-400 text-sm">Full history of requests</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg shadow-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Job ID</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-300">
                      {new Date(j.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                      {j.id}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold">
                          {(j.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <span>{j.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {j.phone}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        j.status === 'success' || j.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        j.status === 'failed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {j.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
