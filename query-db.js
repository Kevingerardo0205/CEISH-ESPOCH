const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 3100,
    user: 'ceish_user',
    password: 'ceish_password',
    database: 'ceish_db',
  });

  try {
    await client.connect();
    
    console.log('--- COLUMNS OF RECEPCIONES ---');
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'recepcion' AND table_name = 'recepciones';
    `);
    console.log(JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

main();
