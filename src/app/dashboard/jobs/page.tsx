type Job = {
  job_id: string;
  phone: string;
  status: string;
  created_at: string;
};

import { headers } from "next/headers";

export default async function JobsPage() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const url = `${proto}://${host}/api/dashboard/jobs`;
  const res = await fetch(url, { cache: "no-store" });
  const jobs: Job[] = await res.json();
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Jobs (Read-only)</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-300 text-sm">
          <thead>
            <tr className="bg-slate-200">
              <th className="px-3 py-2 border-b text-left text-slate-900">Job ID</th>
              <th className="px-3 py-2 border-b text-left text-slate-900">Phone</th>
              <th className="px-3 py-2 border-b text-left text-slate-900">Status</th>
              <th className="px-3 py-2 border-b text-left text-slate-900">Created At</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.job_id} className="odd:bg-white even:bg-slate-50">
                <td className="px-3 py-2 border-b text-slate-800">{j.job_id}</td>
                <td className="px-3 py-2 border-b text-slate-800">{j.phone}</td>
                <td className="px-3 py-2 border-b text-slate-800">{j.status}</td>
                <td className="px-3 py-2 border-b text-slate-800">{j.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
