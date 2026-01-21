const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://sbr123:sbr123@103.74.5.236:5432/cp_location',
});

async function inspect() {
  try {
    await client.connect();
    
    // Get distinct statuses
    const statuses = await client.query('SELECT DISTINCT status FROM jobs');
    console.log('Statuses:', statuses.rows);

    // Get sample results to check for location data
    const results = await client.query('SELECT result FROM jobs WHERE result IS NOT NULL LIMIT 3');
    console.log('Sample Results:', results.rows.map(r => r.result));

    // Get distinct usernames
    const usernames = await client.query('SELECT DISTINCT username FROM jobs');
    console.log('Usernames:', usernames.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspect();
