const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 3100,
  user: 'ceish_user',
  password: 'ceish_password',
  database: 'ceish_db',
});

async function main() {
  await client.connect();
  console.log("Connected to DB successfully.");

  // Fetch all permissions with names and codes
  const res = await client.query(`
    SELECT id, nombre, codigo 
    FROM catalogos.permisos 
    ORDER BY id
  `);
  console.log("\n--- PERMISSIONS IN DATABASE ---");
  for (const row of res.rows) {
    console.log(`ID: ${row.id} | Name: ${row.nombre} | Code: ${row.codigo}`);
  }

  await client.end();
}

main().catch(console.error);
