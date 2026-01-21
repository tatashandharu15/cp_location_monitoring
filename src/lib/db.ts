import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

const connectionString = process.env.DASHBOARD_DB_URL;
if (!connectionString) {
  throw new Error("DASHBOARD_DB_URL is not set");
}

declare global {
  var dashboardDbPool: Pool | undefined;
}

const pool =
  globalThis.dashboardDbPool ?? new Pool({ connectionString });

pool.on("connect", (client: PoolClient) => {
  client.query("SET default_transaction_read_only = on").catch(() => {});
});

if (!globalThis.dashboardDbPool) {
  globalThis.dashboardDbPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}

export { pool };
