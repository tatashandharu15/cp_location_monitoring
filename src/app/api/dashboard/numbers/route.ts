import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  let whereClause = '';
  const params: any[] = [];

  if (username && username !== 'all') {
    whereClause = 'WHERE username = $1';
    params.push(username);
  }

  const res = await query<{
    phone: string;
    total: number;
    last_seen: string;
  }>(
    `SELECT phone,
            COUNT(*)::int AS total,
            MAX(created_at) AS last_seen
     FROM jobs
     ${whereClause}
     GROUP BY phone
     ORDER BY total DESC
     LIMIT 20`,
     params
  );
  return NextResponse.json(res.rows);
}

