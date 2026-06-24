const { Client } = require('pg');
const fs = require('fs');

const envPath = 'D:\\CEISH\\BACKEND\\CEISH-ESPOCH\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const client = new Client({
  host: env.DB_HOST || 'localhost',
  port: parseInt(env.DB_PORT || '5432', 10),
  user: env.DB_USERNAME || 'ceish_user',
  password: env.DB_PASSWORD || 'ceish_password',
  database: env.DB_NAME || 'ceish_db',
});

async function runSearch() {
  await client.connect();
  try {
    const res = await client.query('SELECT pet_text FROM public.ai_assistant_config WHERE id = 1');
    if (res.rows.length > 0) {
      const text = res.rows[0].pet_text || '';
      console.log('Raw text length:', text.length);

      const query = /requisitos.*ensayo/gi;
      let match;
      let count = 0;
      while ((match = query.exec(text)) !== null) {
        count++;
        const start = Math.max(0, match.index - 300);
        const end = Math.min(text.length, match.index + 800);
        console.log(`\nMatch ${count} at index ${match.index}:`);
        console.log('--- Context ---');
        console.log(text.substring(start, end));
        console.log('---------------');
      }
      console.log(`\nTotal matches found: ${count}`);
    } else {
      console.log('No config row found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

runSearch();
