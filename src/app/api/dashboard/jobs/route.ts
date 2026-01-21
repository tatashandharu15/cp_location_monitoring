import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const limit = searchParams.get('limit') || '100'; // Increased limit for better stats

  const client = await pool.connect();

  try {
    let query = `
      SELECT id, username, phone, status, result, created_at
      FROM jobs
    `;
    const params: any[] = [];

    if (phone) {
      query += ` WHERE phone = $1`;
      params.push(phone);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await client.query(query, params);

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
