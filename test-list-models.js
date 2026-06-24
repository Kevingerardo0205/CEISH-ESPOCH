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

const apiKey = env['GEMINI_API_KEY'];

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    if (json.models) {
      console.log('Supported models:');
      json.models.forEach(m => {
        console.log(`- ${m.name} (${m.displayName})`);
      });
    } else {
      console.log('No models key found in response:', json);
    }
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

listModels();
