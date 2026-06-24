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
    
    console.log('--- PROTOCOLO 153 ---');
    const p = await client.query('SELECT * FROM public.protocolos WHERE id = 153');
    console.log(JSON.stringify(p.rows, null, 2));

    console.log('--- VERSIONES PROTOCOLO 153 ---');
    const v = await client.query('SELECT * FROM public.versiones_protocolo WHERE protocolo_id = 153');
    console.log(JSON.stringify(v.rows, null, 2));

    console.log('--- RECEPCIONES PROTOCOLO 153 ---');
    const r = await client.query('SELECT * FROM recepcion.recepciones WHERE version_id IN (121, 122)');
    console.log(JSON.stringify(r.rows, null, 2));

    console.log('--- REQUISITOS PROTOCOLO 153 ---');
    const req = await client.query('SELECT * FROM public.protocolo_requisitos WHERE protocolo_id = 153');
    console.log(JSON.stringify(req.rows, null, 2));

    console.log('--- VALIDACIONES DOCUMENTO ---');
    const val = await client.query('SELECT * FROM recepcion.validaciones_documento WHERE recepcion_id IN (SELECT id FROM recepcion.recepciones WHERE version_id IN (121, 122))');
    console.log(JSON.stringify(val.rows, null, 2));

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

main();
