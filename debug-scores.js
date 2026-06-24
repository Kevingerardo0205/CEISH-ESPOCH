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

const stopWords = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'un', 'para',
  'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya',
  'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre',
  'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante',
  'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e',
  'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él'
]);

function normalizeSpanish(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function chunkText(text) {
  let clean = text.replace(/-- \d+ of \d+ --/gi, '');
  clean = clean.replace(/\n\s*\d+\s*(?=\n)/g, '\n');
  clean = clean.replace(/\n{3,}/g, '\n\n');
  clean = clean.replace(/:\s*\n+/g, ':\n');

  const paragraphs = clean.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  const chunks = [];
  let currentChunk = '';
  const maxChunkSize = 1500;
  const overlapParagraphs = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (currentChunk.length + p.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({ content: currentChunk.trim(), index: chunks.length });
      currentChunk = overlapParagraphs.join('\n\n') + '\n\n' + p;
      overlapParagraphs.length = 0;
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + p;
    }
    overlapParagraphs.push(p);
    if (overlapParagraphs.length > 2) {
      overlapParagraphs.shift();
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({ content: currentChunk.trim(), index: chunks.length });
  }
  return chunks;
}

function debugRetrieve(chunks, query) {
  const queryTerms = query
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\¿]/g, '')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.has(term));

  const normalizedTerms = queryTerms.map(term => {
    const clean = normalizeSpanish(term);
    const roots = [clean];
    if (clean.endsWith('es')) {
      roots.push(clean.slice(0, -2));
    } else if (clean.endsWith('s')) {
      roots.push(clean.slice(0, -1));
    }
    return roots;
  });

  chunks.forEach(chunk => {
    const chunkNormalized = normalizeSpanish(chunk.content);
    if (chunkNormalized.includes('requisitos para las investigaciones exentas') || chunkNormalized.includes('requisitos para la investigacion exenta')) {
      let score = 0;
      const breakdown = [];

      normalizedTerms.forEach(roots => {
        roots.forEach(root => {
          if (chunkNormalized.includes(root)) {
            const regex = new RegExp(`\\b${root}\\b`, 'gi');
            const matches = chunkNormalized.match(regex);
            let termScore = 0;
            if (matches) {
              termScore = matches.length * 2.0;
              breakdown.push(`Root "${root}": matched ${matches.length} times as whole word (score +${termScore})`);
            } else {
              termScore = 0.75;
              breakdown.push(`Root "${root}": matched as substring (score +0.75)`);
            }
            score += termScore;
          }
        });
      });

      const lengthPenalty = Math.log(chunk.content.length);
      const finalScore = score / (lengthPenalty || 1);

      console.log(`\n--- Chunk Index ${chunk.index} ---`);
      console.log(`Raw score: ${score}`);
      console.log(`Length penalty: ${lengthPenalty.toFixed(4)} (Length: ${chunk.content.length})`);
      console.log(`Final score: ${finalScore.toFixed(4)}`);
      console.log('Breakdown:');
      breakdown.forEach(line => console.log('  ' + line));
      console.log('Snippet:');
      console.log(chunk.content);
      console.log('---------------------------');
    }
  });
}

async function run() {
  await client.connect();
  try {
    const res = await client.query('SELECT pet_text FROM public.ai_assistant_config WHERE id = 1');
    if (res.rows.length > 0) {
      const text = res.rows[0].pet_text || '';
      const chunks = chunkText(text);
      debugRetrieve(chunks, 'dime los Requisitos para las investigaciones exentas');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
