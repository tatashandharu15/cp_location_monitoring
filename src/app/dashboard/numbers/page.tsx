type NumberAgg = {
  phone: string;
  total: number;
  last_seen: string;
};

import { headers } from "next/headers";

export default async function NumbersPage() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const url = `${proto}://${host}/api/dashboard/numbers`;
  const res = await fetch(url, { cache: "no-store" });
  const items: NumberAgg[] = await res.json();
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Numbers Intel (Read-only)</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-300 text-sm">
          <thead>
            <tr className="bg-slate-200">
              <th className="px-3 py-2 border-b text-left text-slate-900">Phone</th>
              <th className="px-3 py-2 border-b text-left text-slate-900">Total</th>
              <th className="px-3 py-2 border-b text-left text-slate-900">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.phone} className="odd:bg-white even:bg-slate-50">
                <td className="px-3 py-2 border-b text-slate-800">{item.phone}</td>
                <td className="px-3 py-2 border-b text-slate-800">{item.total}</td>
                <td className="px-3 py-2 border-b text-slate-800">{item.last_seen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
