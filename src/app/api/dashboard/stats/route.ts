import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let conditions: string[] = [];
  const params: any[] = [];

  if (username && username !== 'all') {
    params.push(username);
    conditions.push(`username = $${params.length}`);
  }

  if (startDate) {
    params.push(startDate);
    conditions.push(`created_at >= $${params.length}::date`);
  }

  if (endDate) {
    params.push(endDate);
    conditions.push(`created_at < $${params.length}::date + INTERVAL '1 day'`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const client = await pool.connect();

  try {
    // 1. Stats (Total, Today, Unique Numbers, Avg Time)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_req,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_req,
        COUNT(DISTINCT phone) as total_numbers,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE status IN ('success', 'completed')) as avg_time
      FROM jobs
      ${whereClause}
    `;

    // 2. Status Distribution
    const statusQuery = `
      SELECT 
        CASE 
          WHEN status IN ('not_found', 'number_off', 'unknown') THEN 'no_data'
          ELSE status 
        END as status_group,
        COUNT(*) as count
      FROM jobs
      ${whereClause}
      GROUP BY status_group
    `;

    // 3. Recent Jobs
    const recentQuery = `
      SELECT id, username, phone, status, created_at, result
      FROM jobs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // 4. Locations (Try to extract from result JSON safely-ish)
    // We fetch recent 100 successful jobs to show on map
    const locationQuery = `
      SELECT result, phone, created_at
      FROM jobs
      ${whereClause ? whereClause + " AND" : "WHERE"} 
      (status = 'success' OR status = 'completed') 
      AND result LIKE '%"latitude":%' 
      AND result LIKE '%"longitude":%'
      ORDER BY created_at DESC
    `;

    // 5. Users list for filter
    const usersQuery = `
      SELECT DISTINCT username FROM jobs WHERE username IS NOT NULL ORDER BY username
    `;

    const [statsRes, statusRes, recentRes, locationRes, usersRes] = await Promise.all([
      client.query(statsQuery, params),
      client.query(statusQuery, params),
      client.query(recentQuery, params),
      client.query(locationQuery, params),
      client.query(usersQuery)
    ]);

    // Process locations in JS to avoid SQL JSON casting errors
    const locations = locationRes.rows
      .map(row => {
        try {
          const data = JSON.parse(row.result).data;
          if (data && data.latitude && data.longitude) {
            return {
              lat: parseFloat(data.latitude),
              lng: parseFloat(data.longitude),
              phone: row.phone,
              created_at: row.created_at
            };
          }
        } catch (e) {
          return null;
        }
        return null;
      })
      .filter(loc => loc !== null && !isNaN(loc.lat) && !isNaN(loc.lng));

    return NextResponse.json({
      total_req: parseInt(statsRes.rows[0].total_req),
      today_req: parseInt(statsRes.rows[0].today_req),
      total_numbers: parseInt(statsRes.rows[0].total_numbers),
      avg_time: parseFloat(statsRes.rows[0].avg_time || 0),
      status_counts: statusRes.rows.map(row => ({ status: row.status_group || 'Unknown', count: parseInt(row.count) })),
      recent_jobs: recentRes.rows,
      locations,
      users: usersRes.rows.map(r => r.username)
    });

  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
