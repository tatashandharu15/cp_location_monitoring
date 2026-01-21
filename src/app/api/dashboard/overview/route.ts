import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const [jobsRes, logsRes] = await Promise.all([
    query<{ total_jobs: number }>("SELECT COUNT(*)::int AS total_jobs FROM jobs"),
    query<{ last_log_at: string }>("SELECT MAX(created_at) AS last_log_at FROM logs"),
  ]);
  return NextResponse.json({
    total_jobs: jobsRes.rows[0]?.total_jobs ?? 0,
    last_log_at: logsRes.rows[0]?.last_log_at ?? null,
  });
}
