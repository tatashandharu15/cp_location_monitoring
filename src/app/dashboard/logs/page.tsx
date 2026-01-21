type LogItem = {
  job_id: string;
  type: string;
  message: string;
  created_at: string;
};

import { headers } from "next/headers";

export default async function LogsPage() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const url = `${proto}://${host}/api/dashboard/logs?type=error`;
  const res = await fetch(url, { cache: "no-store" });
  const logs: LogItem[] = await res.json();
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Logs (Read-only)</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-300 text-sm">
          <thead>
            <tr className="bg-slate-200">
              <th className="px-3 py-2 border-b text-left text-slate-900">Job ID</th>
              <th className="px-3 py-2 border-b text-left text-slate-900">Type</th>
              <th className="px-3 py-2 border-b text-left text-slate-900">Message</th>
              <th className="px-3 py-2 border-b text-left text-slate-900">Created At</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, idx) => (
              <tr key={`${l.job_id}-${idx}`} className="odd:bg-white even:bg-slate-50">
                <td className="px-3 py-2 border-b text-slate-800">{l.job_id}</td>
                <td className="px-3 py-2 border-b text-slate-800">{l.type}</td>
                <td className="px-3 py-2 border-b text-slate-800">{l.message}</td>
                <td className="px-3 py-2 border-b text-slate-800">{l.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
