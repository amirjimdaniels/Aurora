import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'aurora_social'
  // No password - using trust authentication
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connection successful!');
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Full error:', err);
  }
}

testConnection();
