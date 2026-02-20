import pg from 'pg';
const { Client } = pg;

// Use connection string format
const client = new Client({
  connectionString: 'postgresql://postgres@127.0.0.1:5432/aurora_social'
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
