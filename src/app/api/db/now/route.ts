import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const res = await query<{ now: string }>("SELECT NOW() AS now");
  return NextResponse.json({ ok: true, now: res.rows[0]?.now });
}

